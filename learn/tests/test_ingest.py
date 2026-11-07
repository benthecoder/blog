import datetime as dt
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from zoneinfo import ZoneInfo

from learn.cli import main
from learn.export import build_export
from learn.ingest import ingest_grades, ingest_items, ingest_packet_state, ingest_tree_activity, issued_from_events, load_json
from learn.schema import latest_by_slot
from learn.store import Store
from learn.tests.support import FIXTURES, fx


ET = ZoneInfo("America/New_York")
NOW = dt.datetime(2024, 1, 17, 10, 0, tzinfo=ET)


def _run(store: Path, extra: list[str]) -> int:
    return main([extra[0], "--store", str(store), *extra[1:]])


class IngestTests(unittest.TestCase):
    def test_duplicate_cli_ingest_does_not_inflate_events(self):
        with TemporaryDirectory() as td:
            store = Path(td) / "store"
            args = [
                "ingest",
                "--packet-state", str(fx("synthetic_packet_state.json")),
                "--items", str(fx("synthetic_items.jsonl")),
                "--tree-cache", str(fx("synthetic_tree.json")),
                "--grades", str(fx("synthetic_grades.json")),
                "--window-days", "30",
                "--now", NOW.isoformat(),
            ]
            self.assertEqual(_run(store, args), 0)
            n1 = len(Store(store).load_events())
            self.assertEqual(_run(store, args), 0)
            n2 = len(Store(store).load_events())
            self.assertEqual(n1, n2)

    def test_day_rerun_preserves_prior_item_set_and_records_new_version(self):
        packet = ingest_packet_state(fx("synthetic_packet_state.json"))
        first = ingest_items(fx("synthetic_items.jsonl"), packet_state=load_json(fx("synthetic_packet_state.json")))
        # rewrite Jan 16 items: drop the review item, add another synthetic id
        with TemporaryDirectory() as td:
            items = Path(td) / "items.jsonl"
            items.write_text(
                '{"date": "2024-01-15", "sheet": "AI Lab Math", "item_id": "math:skill:0:synthetic-bayes", "type": "math-skill", "difficulty": 0.3, "status": "new"}\n'
                '{"date": "2024-01-15", "sheet": "Chinese", "item_id": "zh:zzfixtureword", "type": "zh-news", "difficulty": 0.35, "status": "new"}\n'
                '{"date": "2024-01-16", "sheet": "AI Lab Math", "item_id": "math:skill:0:synthetic-other", "type": "math-skill", "difficulty": 0.3, "status": "new"}\n',
                encoding="utf-8",
            )
            state = load_json(fx("synthetic_packet_state.json"))
            state["packets"]["2024-01-16"]["built"] = "2024-01-16T11:00:00-05:00"
            second = ingest_items(items, packet_state=state)
        sets = [e for e in first + second if e["type"] == "item_set" and e["date"] == "2024-01-16"]
        self.assertEqual(len({e["event_id"] for e in sets}), 2)
        shown = [e for e in first + second if e["type"] == "item_shown" and e["date"] == "2024-01-16"]
        ids = {e["item_id"] for e in shown}
        self.assertIn("math:skill:0:synthetic-bayes", ids)
        self.assertIn("math:skill:0:synthetic-other", ids)

    def test_late_ink_revises_activity_without_erasing_blank_observation(self):
        issued = [("2024-01-15", "chinese"), ("2024-01-15", "math"), ("2024-01-16", "math")]
        early = ingest_tree_activity(load_json(fx("synthetic_tree.json")), issued)
        late = ingest_tree_activity(load_json(fx("synthetic_tree_late.json")), issued)
        events = early + late
        zh = [e for e in events if e["type"] == "sheet_activity" and e["sheet"] == "chinese" and e["date"] == "2024-01-15"]
        self.assertEqual(len({e["event_id"] for e in zh}), 2)
        statuses = {e["body"]["status"] for e in zh}
        self.assertEqual(statuses, {"none", "present"})
        latest = latest_by_slot(events)
        current = next(e for e in latest.values() if e["sheet"] == "chinese" and e["type"] == "sheet_activity")
        self.assertEqual(current["body"]["status"], "present")

    def test_unknown_when_tree_missing_or_doc_absent(self):
        issued = [("2024-01-15", "bible")]
        failed = ingest_tree_activity({}, issued, scan_ok=False, reason="cache_missing")
        self.assertEqual(failed[0]["body"]["status"], "unknown")
        # tree loads but Bible · Jan 15 is not in the fixture
        missing_doc = ingest_tree_activity(load_json(fx("synthetic_tree.json")), issued, scan_ok=True)
        self.assertEqual(missing_doc[0]["body"]["status"], "unknown")
        self.assertNotEqual(missing_doc[0]["body"].get("ink_pages"), 0)

    def test_grade_correction_keeps_both_versions_latest_wins(self):
        events = ingest_grades(fx("synthetic_grades.json"))
        self.assertEqual(len(events), 2)
        latest = latest_by_slot(events)
        self.assertEqual(len(latest), 1)
        ev = next(iter(latest.values()))
        self.assertTrue(ev["body"]["correct"])

    def test_issued_does_not_mean_attempted(self):
        events = ingest_packet_state(fx("synthetic_packet_state.json"))
        self.assertTrue(all(e["type"] == "sheet_issued" for e in events))
        self.assertFalse(any("attempt" in json.dumps(e) for e in events))
