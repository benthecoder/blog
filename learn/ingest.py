from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from learn import EMPTY_RM, SCHEMA_VERSION, SHEET_KEYS
from learn.ids import digest, event_id, slot_id
from learn.schema import ValidationError, sheet_key
from learn.timeutil import parse_date, short_sheet_name


def _event(event_type: str, date: str, source: str, body: dict[str, Any],
           sheet: str = "", item_id: str = "") -> dict[str, Any]:
    sid = slot_id(event_type=event_type, date=date, sheet=sheet, item_id=item_id, source=source)
    eid = event_id(slot=sid, body=body)
    return {
        "schema_version": SCHEMA_VERSION,
        "event_id": eid,
        "slot_id": sid,
        "type": event_type,
        "date": date,
        "sheet": sheet,
        "item_id": item_id,
        "source": source,
        "body": body,
    }


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValidationError(f"{path}:{i} is not valid JSON") from exc
        if not isinstance(obj, dict):
            raise ValidationError(f"{path}:{i} must be a JSON object")
        rows.append(obj)
    return rows


def ingest_packet_state(path: Path, source: str = "packet_state") -> list[dict[str, Any]]:
    data = load_json(path)
    packets = data.get("packets") or {}
    if not isinstance(packets, dict):
        raise ValidationError("packet_state.packets must be an object")
    events: list[dict[str, Any]] = []
    for date, rec in packets.items():
        if not isinstance(rec, dict):
            raise ValidationError(f"packet_state.packets[{date!r}] must be an object")
        uploaded = bool(rec.get("uploaded"))
        files = rec.get("files") or {}
        if not uploaded or not isinstance(files, dict):
            continue
        built = rec.get("built") or ""
        for label in files:
            try:
                key = sheet_key(label)
            except ValidationError:
                continue
            body = {
                "uploaded": True,
                "sheet": key,
                "source_seq": f"packet:{built}",
            }
            events.append(_event("sheet_issued", date, source, body, sheet=key))
    return events


def ingest_items(path: Path, packet_state: dict[str, Any] | None = None,
                 source: str = "items.jsonl") -> list[dict[str, Any]]:
    rows = load_jsonl(path)
    packets = (packet_state or {}).get("packets") or {}
    by_day_sheet: dict[tuple[str, str], list[str]] = {}
    events: list[dict[str, Any]] = []
    for row in rows:
        date = row.get("date")
        label = row.get("sheet")
        item_id = row.get("item_id")
        if not date or not label or not item_id:
            raise ValidationError("items.jsonl row missing date, sheet, or item_id")
        key = sheet_key(label)
        built = ""
        rec = packets.get(date) if isinstance(packets, dict) else None
        if isinstance(rec, dict):
            built = rec.get("built") or ""
        status = row.get("status")
        if status not in ("new", "review", "stretch"):
            raise ValidationError(f"invalid item status: {status!r}")
        item_type = row.get("type") or ""
        if not isinstance(item_type, str):
            raise ValidationError("item type must be a string")
        body = {
            "status": status,
            "item_type": item_type,
            "source_seq": f"packet:{built}",
        }
        events.append(_event("item_shown", date, source, body, sheet=key, item_id=str(item_id)))
        by_day_sheet.setdefault((date, key), []).append(str(item_id))
    for (date, key), ids in sorted(by_day_sheet.items()):
        rec = packets.get(date) if isinstance(packets, dict) else None
        built = rec.get("built") if isinstance(rec, dict) else ""
        unique = sorted(set(ids))
        body = {
            "count": len(unique),
            "ids_hash": digest(unique),
            "item_ids": unique,
            "source_seq": f"packet:{built or ''}",
        }
        events.append(_event("item_set", date, source, body, sheet=key))
    return events


def _docs_from_tree(raw: Any) -> list[dict[str, Any]]:
    if isinstance(raw, dict) and isinstance(raw.get("Docs"), list):
        return raw["Docs"]
    if isinstance(raw, dict) and raw and all(isinstance(v, dict) for v in raw.values()):
        return list(raw.values())
    raise ValidationError("tree cache must be an rmapi cache object with Docs[]")


def _is_live_doc(doc: dict[str, Any]) -> bool:
    meta = doc.get("Metadata") or {}
    return not meta.get("deleted") and meta.get("parent") != "trash" and meta.get("type") == "DocumentType"


def ink_pages_for_doc(doc: dict[str, Any]) -> int:
    files = doc.get("Files") or []
    n = 0
    for fh in files:
        name = str(fh.get("DocumentID") or "")
        if name.endswith(".rm") and int(fh.get("Size") or 0) > EMPTY_RM:
            n += 1
    return n


def activity_from_tree(raw: Any, names: Iterable[str]) -> dict[str, int | None]:
    """Map visibleName -> ink page count, or None if the doc was not found."""
    wanted = {n: None for n in names}
    for doc in _docs_from_tree(raw):
        if not _is_live_doc(doc):
            continue
        name = (doc.get("Metadata") or {}).get("visibleName")
        if name in wanted:
            pages = ink_pages_for_doc(doc)
            prev = wanted[name]
            wanted[name] = pages if prev is None else max(prev, pages)
    return wanted


def tree_source_seq(raw: Any) -> str:
    if not isinstance(raw, dict):
        return "tree:missing-seq"
    gen = raw.get("Generation")
    if gen is not None:
        try:
            return f"tree:{int(gen):040d}"
        except (TypeError, ValueError):
            pass
    digest_hash = raw.get("Hash")
    if digest_hash:
        return f"treehash:{digest_hash}"
    return "tree:missing-seq"


def ingest_tree_activity(
    raw: Any,
    issued: list[tuple[str, str]],
    *,
    source: str = "tree",
    scan_ok: bool = True,
    reason: str = "",
) -> list[dict[str, Any]]:
    """Emit sheet_activity for each issued (date, sheet_key).

    Missing docs or a failed scan are `unknown`, never a fake zero.
    A found document with no ink pages is `none` (blank evidence), not wrong.
    """
    names = []
    planned: list[tuple[str, str, str]] = []
    for date, key in issued:
        label = next(lbl for lbl, k in SHEET_KEYS.items() if k == key)
        name = short_sheet_name(label, parse_date(date))
        planned.append((date, key, name))
        names.append(name)
    observed: dict[str, int | None] = {n: None for n in names}
    seq = "tree:scan-failed"
    if scan_ok:
        observed = activity_from_tree(raw, names)
        seq = tree_source_seq(raw)
    events = []
    for date, key, name in planned:
        pages = observed.get(name) if scan_ok else None
        if not scan_ok:
            status, ink_pages = "unknown", None
        elif pages is None:
            status, ink_pages = "unknown", None
        elif pages == 0:
            status, ink_pages = "none", 0
        else:
            status, ink_pages = "present", pages
        body = {
            "status": status,
            "ink_pages": ink_pages,
            "method": "rm_filesize",
            "source_seq": seq,
        }
        if reason and status == "unknown":
            body["reason"] = reason if not scan_ok else "doc_not_found"
        elif status == "unknown":
            body["reason"] = "doc_not_found"
        events.append(_event("sheet_activity", date, source, body, sheet=key))
    return events


def _grade_item_id(row: dict[str, Any]) -> str | None:
    if row.get("item_id"):
        return str(row["item_id"])
    if row.get("word"):
        return f"zh:{row['word']}"
    return None


def ingest_grades(path: Path, source: str = "grades") -> list[dict[str, Any]]:
    raw_txt = path.read_text(encoding="utf-8")
    if path.suffix == ".jsonl":
        rows = load_jsonl(path)
    else:
        raw = json.loads(raw_txt)
        if isinstance(raw, dict):
            if "grades" in raw or "rows" in raw:
                raw = raw.get("grades") or raw.get("rows") or []
            else:
                raw = [raw]
        if not isinstance(raw, list):
            raise ValidationError("grades file must be a list, a single grade object, or {grades: [...]}")
        rows = raw
    events = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValidationError("grade row must be an object")
        date = row.get("date")
        item_id = _grade_item_id(row)
        if not date or not item_id:
            raise ValidationError("grade row missing date or item_id/word")
        if "correct" not in row or not isinstance(row["correct"], bool):
            raise ValidationError("grade row.correct must be a boolean")
        provenance = row.get("provenance")
        if provenance is not None and not isinstance(provenance, dict):
            raise ValidationError("grade provenance must be an object when present")
        seq_n = row.get("sequence")
        recorded_at = (provenance or {}).get("recorded_at") or ""
        if isinstance(seq_n, int):
            source_seq = f"seq:{seq_n:010d}"
        elif recorded_at:
            source_seq = f"at:{recorded_at}"
        else:
            source_seq = ""
        body: dict[str, Any] = {
            "correct": row["correct"],
            "source_seq": source_seq,
        }
        if provenance:
            body["provenance"] = {
                k: provenance[k]
                for k in ("assessor", "method", "recorded_at", "note")
                if k in provenance
            }
        events.append(_event("assessment", date, source, body, item_id=item_id))
    return events


def issued_from_events(events: Iterable[dict[str, Any]]) -> list[tuple[str, str]]:
    out = []
    for event in events:
        if event["type"] == "sheet_issued":
            out.append((event["date"], event["sheet"]))
    return sorted(set(out))


def dates_in_window(issued: list[tuple[str, str]], today, window_days: int) -> list[tuple[str, str]]:
    keep = []
    for date_s, key in issued:
        date = parse_date(date_s)
        delta = (today - date).days
        if 0 <= delta < window_days:
            keep.append((date_s, key))
    return keep
