import datetime as dt
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from zoneinfo import ZoneInfo

from learn.cli import main
from learn.tests.support import fx

ET = ZoneInfo("America/New_York")
NOW = dt.datetime(2024, 1, 17, 10, 0, tzinfo=ET)


class CliTests(unittest.TestCase):
    def test_ingest_export_status(self):
        with TemporaryDirectory() as td:
            store = str(Path(td) / "store")
            out = str(Path(td) / "public.json")
            rc = main([
                "ingest", "--store", store,
                "--packet-state", str(fx("synthetic_packet_state.json")),
                "--items", str(fx("synthetic_items.jsonl")),
                "--tree-cache", str(fx("synthetic_tree.json")),
                "--grades", str(fx("sample_grade_event.json")),
                "--repair",
                "--now", NOW.isoformat(),
            ])
            self.assertEqual(rc, 0)
            rc = main(["export", "--store", store, "--out", out, "--now", NOW.isoformat()])
            self.assertEqual(rc, 0)
            doc = json.loads(Path(out).read_text(encoding="utf-8"))
            self.assertEqual(doc["counts"]["demonstrated"], 1)
            rc = main(["status", "--store", store])
            self.assertEqual(rc, 0)

    def test_policy_annotate_cli_writes_copy(self):
        with TemporaryDirectory() as td:
            deck = {
                "math:skill:0:synthetic-bayes": {
                    "card": {"due": "2024-02-01T09:42:00+00:00", "stability": 1},
                    "meta": {},
                    "reviews": 1,
                    "last_day": "2024-01-15",
                }
            }
            src = Path(td) / "deck.json"
            dest = Path(td) / "out.json"
            src.write_text(json.dumps(deck), encoding="utf-8")
            rc = main(["policy-annotate", "--deck", str(src), "--out", str(dest)])
            self.assertEqual(rc, 0)
            labeled = json.loads(dest.read_text(encoding="utf-8"))
            self.assertEqual(labeled["math:skill:0:synthetic-bayes"]["card"]["stability"], 1)
            self.assertEqual(
                labeled["math:skill:0:synthetic-bayes"]["meta"]["legacy_assumption"],
                "display_counted_as_good",
            )
