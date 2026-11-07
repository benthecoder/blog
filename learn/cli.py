from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path

from learn import DEFAULT_STORE, DEFAULT_WINDOW_DAYS, SCHEMA_VERSION
from learn.backup import backup, restore
from learn.export import build_export, render_export
from learn.ingest import (
    dates_in_window,
    ingest_grades,
    ingest_items,
    ingest_packet_state,
    ingest_tree_activity,
    issued_from_events,
    load_json,
)
from learn.policy import ACTIVATION, POLICY_NAME, annotate_legacy_assumptions
from learn.schema import ValidationError
from learn.store import Store, StoreError, atomic_write_text
from learn.timeutil import today_et


def _store(ns: argparse.Namespace) -> Store:
    root = Path(ns.store or os.environ.get("LEARN_STORE") or DEFAULT_STORE)
    return Store(root)


def cmd_ingest(ns: argparse.Namespace) -> int:
    store = _store(ns)
    now = dt.datetime.fromisoformat(ns.now) if ns.now else None
    today = today_et(now)
    proposed: list[dict] = []
    errors: list[str] = []
    packet_obj = None
    try:
        with store.lock():
            store.ensure()
            if ns.packet_state:
                packet_obj = load_json(Path(ns.packet_state))
                proposed.extend(ingest_packet_state(Path(ns.packet_state)))
            if ns.items:
                proposed.extend(ingest_items(Path(ns.items), packet_state=packet_obj))
            issued = issued_from_events(proposed)
            # also consider already-stored issued sheets so late rescan works
            try:
                existing = store.load_events()
            except StoreError:
                existing = store.try_load_events()[0]
            issued = sorted(set(issued) | set(issued_from_events(existing)))
            target = issued if ns.repair else dates_in_window(issued, today, ns.window_days)
            if ns.tree_cache:
                tpath = Path(ns.tree_cache)
                if not tpath.exists():
                    proposed.extend(
                        ingest_tree_activity({}, target, scan_ok=False, reason="cache_missing")
                    )
                else:
                    try:
                        raw = load_json(tpath)
                        proposed.extend(ingest_tree_activity(raw, target, scan_ok=True))
                    except (OSError, json.JSONDecodeError, ValidationError) as exc:
                        proposed.extend(
                            ingest_tree_activity({}, target, scan_ok=False, reason="cache_unreadable")
                        )
                        errors.append(f"tree cache: {exc}")
            if ns.grades:
                for gpath in ns.grades:
                    proposed.extend(ingest_grades(Path(gpath)))
            stats = store.append_events(proposed)
            success = {
                "schema_version": SCHEMA_VERSION,
                "ok": True,
                "as_of": today.isoformat(),
                "written": stats["written"],
                "skipped": stats["skipped"],
                "total": stats["total"],
                "window_days": ns.window_days,
                "repair": bool(ns.repair),
                "errors": errors,
                "at": (now or dt.datetime.now(dt.timezone.utc)).astimezone().isoformat(timespec="seconds"),
            }
            store.write_success(success)
    except (ValidationError, StoreError, OSError, json.JSONDecodeError) as exc:
        print(f"ingest failed: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"ok": True, **stats, "errors": errors}, sort_keys=True))
    return 0


def cmd_export(ns: argparse.Namespace) -> int:
    store = _store(ns)
    try:
        with store.lock():
            events = store.load_events()
            success = store.read_success() or {}
            now = dt.datetime.fromisoformat(ns.now) if ns.now else None
            doc = build_export(
                events,
                last_success_at=success.get("at"),
                now=now,
            )
            text = render_export(doc)
            out = Path(ns.out)
            atomic_write_text(out, text)
    except (StoreError, ValidationError, ValueError, OSError) as exc:
        print(f"export failed: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"ok": True, "out": ns.out, "counts": doc["counts"]}, sort_keys=True))
    return 0


def cmd_status(ns: argparse.Namespace) -> int:
    store = _store(ns)
    try:
        with store.lock():
            events, bad = store.try_load_events()
            success = store.read_success()
            print(json.dumps({
                "store": str(store.root),
                "schema_version": SCHEMA_VERSION,
                "events": len(events),
                "corrupt_lines": len(bad),
                "last_success": success,
                "scheduler_policy": {"name": POLICY_NAME, "activation": ACTIVATION},
            }, sort_keys=True, default=str))
    except (StoreError, OSError) as exc:
        print(f"status failed: {exc}", file=sys.stderr)
        return 1
    return 0


def cmd_repair(ns: argparse.Namespace) -> int:
    store = _store(ns)
    try:
        with store.lock():
            store.ensure()
            result = store.repair()
    except (StoreError, OSError) as exc:
        print(f"repair failed: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"ok": True, **result}, sort_keys=True))
    return 0


def cmd_backup(ns: argparse.Namespace) -> int:
    store = _store(ns)
    try:
        with store.lock():
            result = backup(store, Path(ns.out))
    except (StoreError, OSError) as exc:
        print(f"backup failed: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"ok": True, **result}, sort_keys=True))
    return 0


def cmd_restore(ns: argparse.Namespace) -> int:
    store = _store(ns)
    try:
        with store.lock():
            result = restore(Path(ns.archive), store, verify=not ns.no_verify)
    except (StoreError, OSError) as exc:
        print(f"restore failed: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"ok": True, **result}, sort_keys=True))
    return 0


def cmd_policy_annotate(ns: argparse.Namespace) -> int:
    src = Path(ns.deck)
    dest = Path(ns.out)
    try:
        deck = json.loads(src.read_text(encoding="utf-8"))
        if not isinstance(deck, dict):
            raise ValidationError("deck must be a JSON object")
        stats = annotate_legacy_assumptions(deck)
        atomic_write_text(dest, json.dumps(deck, ensure_ascii=False, indent=2) + "\n")
    except (OSError, json.JSONDecodeError, ValidationError) as exc:
        print(f"policy-annotate failed: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"ok": True, "activation": ACTIVATION, **stats, "out": ns.out}, sort_keys=True))
    return 0


def build_parser() -> argparse.ArgumentParser:
    store_p = argparse.ArgumentParser(add_help=False)
    store_p.add_argument(
        "--store",
        help=f"private store directory (default $LEARN_STORE or {DEFAULT_STORE})",
    )
    p = argparse.ArgumentParser(
        prog="python3 -m learn",
        description="Private learning-event ingest and allowlisted export (no site UI).",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    ing = sub.add_parser("ingest", parents=[store_p], help="read packet/items/tree/grades into the private store")
    ing.add_argument("--items", help="path to items.jsonl")
    ing.add_argument("--packet-state", help="path to packet_state.json")
    ing.add_argument("--tree-cache", help="path to rmapi tree.cache JSON")
    ing.add_argument("--grades", action="append", default=[], help="grade JSON/JSONL (repeatable)")
    ing.add_argument("--window-days", type=int, default=DEFAULT_WINDOW_DAYS,
                      help="rescan this many ET calendar days of issued sheets (default 3)")
    ing.add_argument("--repair", action="store_true", help="rescan every issued date, not just the window")
    ing.add_argument("--now", help="override clock (ISO-8601) for tests")
    ing.set_defaults(func=cmd_ingest)

    exp = sub.add_parser("export", parents=[store_p], help="write an allowlisted public JSON document")
    exp.add_argument("--out", required=True, help="destination path (not committed)")
    exp.add_argument("--now", help="override clock (ISO-8601) for tests")
    exp.set_defaults(func=cmd_export)

    st = sub.add_parser("status", parents=[store_p], help="show store health")
    st.set_defaults(func=cmd_status)

    rp = sub.add_parser("repair", parents=[store_p], help="quarantine corrupt log lines and rewrite the valid log")
    rp.set_defaults(func=cmd_repair)

    bk = sub.add_parser("backup", parents=[store_p], help="write a checksummed tar of the private store")
    bk.add_argument("--out", required=True)
    bk.set_defaults(func=cmd_backup)

    rs = sub.add_parser("restore", parents=[store_p], help="restore a backup tar and verify checksums")
    rs.add_argument("--archive", required=True)
    rs.add_argument("--no-verify", action="store_true")
    rs.set_defaults(func=cmd_restore)

    pa = sub.add_parser("policy-annotate", help="label legacy display=Good cards; does not reset FSRS")
    pa.add_argument("--deck", required=True, help="input srs_cards-like JSON")
    pa.add_argument("--out", required=True, help="output path (never overwrite without an explicit --out)")
    pa.set_defaults(func=cmd_policy_annotate)

    return p


def main(argv: list[str] | None = None) -> int:
    p = build_parser()
    ns = p.parse_args(argv)
    return ns.func(ns)
