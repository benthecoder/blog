import datetime as dt
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from zoneinfo import ZoneInfo

from learn.cli import main
from learn.export import assert_public, build_export, render_export
from learn.ingest import (
    ingest_grades,
    ingest_items,
    ingest_packet_state,
    ingest_tree_activity,
    issued_from_events,
    load_json,
)
from learn.store import Store
from learn.tests.support import fx


ET = ZoneInfo("America/New_York")
NOW = dt.datetime(2024, 1, 17, 10, 0, tzinfo=ET)


def all_events():
    packet = load_json(fx("synthetic_packet_state.json"))
    ev = ingest_packet_state(fx("synthetic_packet_state.json"))
    ev += ingest_items(fx("synthetic_items.jsonl"), packet_state=packet)
    ev += ingest_tree_activity(load_json(fx("synthetic_tree_late.json")), issued_from_events(ev))
    ev += ingest_grades(fx("synthetic_grades.json"))
    return ev


class ExportTests(unittest.TestCase):
    def test_counts_and_semantics(self):
        doc = build_export(all_events(), last_success_at="2024-01-17T10:00:00-05:00", now=NOW)
        # issued: Jan 15 chinese+math, Jan 16 math  (2099 bible excluded as future)
        self.assertEqual(doc["counts"]["issued_sheet_days"], 3)
        self.assertEqual(doc["counts"]["activity_present_sheet_days"], 2)  # math jan15 + chinese jan15 (late)
        self.assertEqual(doc["counts"]["activity_none_sheet_days"], 1)  # math jan16 blank
        self.assertEqual(doc["counts"]["activity_unknown_sheet_days"], 0)
        self.assertEqual(doc["counts"]["assessments"], 1)
        self.assertEqual(doc["counts"]["demonstrated"], 1)
        self.assertNotIn("attempted", json.dumps(doc))
        self.assertEqual(doc["visibility"], "opt_in_required")

    def test_stable_export_bytes(self):
        events = all_events()
        a = render_export(build_export(events, last_success_at="ts", now=NOW))
        b = render_export(build_export(events, last_success_at="ts", now=NOW))
        self.assertEqual(a, b)

    def test_future_dates_excluded_and_et_calendar(self):
        # 2024-01-17 00:30 UTC is still 2024-01-16 19:30 ET
        utc_morning = dt.datetime(2024, 1, 17, 0, 30, tzinfo=dt.timezone.utc)
        doc = build_export(all_events(), last_success_at="ts", now=utc_morning)
        self.assertEqual(doc["as_of"], "2024-01-16")
        dates = {d["date"] for d in doc["days"]}
        self.assertNotIn("2099-01-01", dates)
        self.assertNotIn("2024-01-17", dates)

    def test_privacy_fail_closed_on_malicious_source(self):
        packet = {
            "packets": {
                "2024-01-15": {
                    "uploaded": True,
                    "built": "2024-01-15T09:00:00-05:00",
                    "files": {"AI Lab Math": "/tmp/x.pdf"},
                }
            }
        }
        from learn.ingest import ingest_items as ingest_items_fn, ingest_packet_state as ingest_ps
        with TemporaryDirectory() as td:
            p = Path(td) / "packet.json"
            p.write_text(json.dumps(packet), encoding="utf-8")
            events = ingest_ps(p)
            events += ingest_items_fn(fx("malicious_items.jsonl"), packet_state=packet)
            text = render_export(build_export(events, last_success_at="ts", now=NOW))
        for leaked in ("SECRETWORD99", "ABOUT_PROJECT_ZEPHYR", "42-private-answer", ".ssh/id_rsa", "zh:"):
            self.assertNotIn(leaked, text)
        assert_public(json.loads(text))

    def test_export_refuses_corrupt_store(self):
        with TemporaryDirectory() as td:
            store = Store(Path(td))
            store.ensure()
            store.events_path.write_text("{bad\n", encoding="utf-8")
            rc = main(["export", "--store", td, "--out", str(Path(td) / "out.json")])
            self.assertEqual(rc, 1)
            self.assertFalse((Path(td) / "out.json").exists())

    def test_no_assumed_successful_review(self):
        packet = load_json(fx("synthetic_packet_state.json"))
        ev = ingest_packet_state(fx("synthetic_packet_state.json"))
        ev += ingest_items(fx("synthetic_items.jsonl"), packet_state=packet)
        doc = build_export(ev, last_success_at="ts", now=NOW)
        self.assertEqual(doc["counts"]["demonstrated"], 0)
        self.assertEqual(doc["counts"]["assessments"], 0)
        # shown items without grades are not checked or demonstrated
        self.assertGreater(doc["counts"]["issued_sheet_days"], 0)

    def test_grade_without_provenance_is_checked_not_demonstrated(self):
        from learn.ingest import _event
        ev = [
            _event("item_shown", "2024-01-15", "items.jsonl",
                   {"status": "new", "item_type": "math-skill", "source_seq": "packet:a"},
                   sheet="math", item_id="math:skill:0:synthetic-bayes"),
            _event("assessment", "2024-01-15", "grades",
                   {"correct": True, "source_seq": "seq:0000000001"},
                   item_id="math:skill:0:synthetic-bayes"),
        ]
        doc = build_export(ev, last_success_at="ts", now=NOW)
        self.assertEqual(doc["counts"]["assessments"], 1)
        self.assertEqual(doc["counts"]["demonstrated"], 0)
