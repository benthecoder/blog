from __future__ import annotations

import datetime as dt
from collections import defaultdict
from typing import Any

from learn import DEFAULT_STALE_AFTER_HOURS, SCHEMA_VERSION, SHEET_KEYS
from learn.ids import canonical
from learn.schema import latest_by_slot
from learn.timeutil import is_future, parse_date, today_et

# Public documents are built from scratch. Unknown keys never pass through.
PUBLIC_ROOT_KEYS = (
    "schema_version",
    "visibility",
    "as_of",
    "last_success_at",
    "stale_after_hours",
    "counts",
    "by_sheet",
    "days",
    "notes",
)
COUNT_KEYS = (
    "issued_sheet_days",
    "activity_present_sheet_days",
    "activity_none_sheet_days",
    "activity_unknown_sheet_days",
    "assessments",
    "demonstrated",
)
SHEET_COUNT_KEYS = COUNT_KEYS
DAY_SHEET_KEYS = ("issued", "activity")
VISIBILITY = "opt_in_required"
NOTES = (
    "issued means a sheet was uploaded that day; it is not an attempt. "
    "activity is sheet-level ink evidence (present/none/unknown), not a grade. "
    "assessments count explicit item assessments (checked). "
    "demonstrated counts only correct assessments with provenance and a matching shown item. "
    "Curriculum position is not included and is not demonstrated knowledge. "
    "This file must not be published without an explicit visibility opt-in."
)

# Denied substrings used only by tests' extra scanner and as a safety net.
SENSITIVE_KEY_FRAGMENTS = (
    "item_id", "word", "gloss", "pinyin", "answer", "path", "email",
    "token", "secret", "password", "visibleName", "provenance",
)


def _empty_counts() -> dict[str, int]:
    return {k: 0 for k in COUNT_KEYS}


def build_export(
    events: list[dict[str, Any]],
    *,
    last_success_at: str | None = None,
    now: dt.datetime | None = None,
    stale_after_hours: int = DEFAULT_STALE_AFTER_HOURS,
) -> dict[str, Any]:
    as_of = today_et(now).isoformat()
    latest = latest_by_slot(events)
    issued_slots = [e for e in latest.values() if e["type"] == "sheet_issued"]
    activity = {e["slot_id"]: e for e in latest.values() if e["type"] == "sheet_activity"}
    assessments = [e for e in latest.values() if e["type"] == "assessment"]
    shown_ids = {
        (e["date"], e["item_id"])
        for e in latest.values()
        if e["type"] == "item_shown" and e.get("item_id")
    }

    counts = _empty_counts()
    by_sheet = {key: _empty_counts() for key in SHEET_KEYS.values()}
    days: dict[str, dict[str, Any]] = {}

    def bucket(date: str, sheet: str) -> dict[str, Any]:
        rec = days.setdefault(date, {"date": date, "sheets": {}})
        return rec["sheets"].setdefault(sheet, {"issued": False, "activity": "unknown"})

    future_skipped = 0
    for ev in issued_slots:
        date, sheet = ev["date"], ev["sheet"]
        if is_future(parse_date(date), now):
            future_skipped += 1
            continue
        counts["issued_sheet_days"] += 1
        by_sheet[sheet]["issued_sheet_days"] += 1
        cell = bucket(date, sheet)
        cell["issued"] = True
        # Find activity for this date+sheet (same sheet field, type sheet_activity).
        act = None
        for other in activity.values():
            if other["date"] == date and other["sheet"] == sheet:
                act = other
                break
        status = (act["body"]["status"] if act else "unknown")
        cell["activity"] = status
        field = {
            "present": "activity_present_sheet_days",
            "none": "activity_none_sheet_days",
            "unknown": "activity_unknown_sheet_days",
        }[status]
        counts[field] += 1
        by_sheet[sheet][field] += 1

    assessed_slots = []
    for ev in assessments:
        if is_future(parse_date(ev["date"]), now):
            future_skipped += 1
            continue
        body = ev["body"]
        siblings = [
            e for e in events
            if e["type"] == "assessment" and e["slot_id"] == ev["slot_id"]
        ]
        seqs = {(e.get("body") or {}).get("source_seq") or "" for e in siblings}
        corrects = {(e.get("body") or {}).get("correct") for e in siblings}
        if seqs == {""} and len(corrects) > 1:
            continue
        assessed_slots.append(ev)
        counts["assessments"] += 1
        # assessments are not sheet-keyed in the grade contract; leave by_sheet assessments
        # only when we can map via shown item.
        match = (ev["date"], ev.get("item_id")) in shown_ids
        provenance = body.get("provenance")
        has_prov = isinstance(provenance, dict) and bool(provenance.get("assessor") or provenance.get("method"))
        if body.get("correct") is True and has_prov and match:
            counts["demonstrated"] += 1
        if match:
            # attribute checked/demonstrated to sheet via the matching shown item
            shown = next(
                e for e in latest.values()
                if e["type"] == "item_shown" and e["date"] == ev["date"] and e.get("item_id") == ev.get("item_id")
            )
            sheet = shown["sheet"]
            by_sheet[sheet]["assessments"] += 1
            if body.get("correct") is True and has_prov:
                by_sheet[sheet]["demonstrated"] += 1

    day_list = [days[k] for k in sorted(days)]
    doc = {
        "schema_version": SCHEMA_VERSION,
        "visibility": VISIBILITY,
        "as_of": as_of,
        "last_success_at": last_success_at,
        "stale_after_hours": stale_after_hours,
        "counts": counts,
        "by_sheet": by_sheet,
        "days": day_list,
        "notes": NOTES,
    }
    if future_skipped:
        # keep notes only; do not add a non-allowlisted key
        pass
    assert_public(doc)
    return doc


def assert_public(doc: dict[str, Any]) -> None:
    extra = set(doc) - set(PUBLIC_ROOT_KEYS)
    if extra:
        raise ValueError(f"export contains non-allowlisted keys: {sorted(extra)}")
    for key in doc.get("counts", {}):
        if key not in COUNT_KEYS:
            raise ValueError(f"non-allowlisted count key: {key}")
    text = canonical(doc)
    for frag in ("item_id", "item_ids", "ids_hash"):
        # allowlisted notes string should not include these either
        if f'"{frag}"' in text:
            raise ValueError(f"export leaked field {frag!r}")


def render_export(doc: dict[str, Any]) -> str:
    assert_public(doc)
    return canonical(doc) + "\n"
