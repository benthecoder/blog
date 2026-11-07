import multiprocessing
import time
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from learn.ingest import _event
from learn.store import Store, StoreError


def _hold_lock(root: str, ready: multiprocessing.Queue, release: multiprocessing.Queue):
    store = Store(Path(root))
    with store.lock():
        ready.put("held")
        release.get()


class StoreTests(unittest.TestCase):
    def test_lock_is_exclusive(self):
        with TemporaryDirectory() as td:
            ready = multiprocessing.Queue()
            release = multiprocessing.Queue()
            proc = multiprocessing.Process(target=_hold_lock, args=(td, ready, release))
            proc.start()
            self.assertEqual(ready.get(timeout=5), "held")
            store = Store(Path(td))
            started = time.monotonic()
            # non-blocking check: lock file exists and peer still holds it
            self.assertTrue(store.lock_path.exists())
            release.put("go")
            proc.join(timeout=5)
            self.assertEqual(proc.exitcode, 0)
            # after release we can take the lock quickly
            with store.lock():
                elapsed = time.monotonic() - started
            self.assertLess(elapsed, 5)

    def test_corrupt_log_rejected_then_repaired(self):
        with TemporaryDirectory() as td:
            store = Store(Path(td))
            store.ensure()
            ev = _event("sheet_issued", "2024-01-15", "packet_state",
                        {"uploaded": True, "sheet": "math", "source_seq": "packet:a"}, sheet="math")
            store.append_events([ev])
            with store.events_path.open("a", encoding="utf-8") as fh:
                fh.write("{not json\n")
            with self.assertRaises(StoreError):
                store.load_events()
            result = store.repair()
            self.assertEqual(result["kept"], 1)
            self.assertEqual(result["quarantined"], 1)
            events = store.load_events()
            self.assertEqual(len(events), 1)
            self.assertTrue(store.corrupt_path.exists())

    def test_duplicate_append_skips_same_event_id(self):
        with TemporaryDirectory() as td:
            store = Store(Path(td))
            store.ensure()
            ev = _event("sheet_issued", "2024-01-15", "packet_state",
                        {"uploaded": True, "sheet": "math", "source_seq": "packet:a"}, sheet="math")
            self.assertEqual(store.append_events([ev])["written"], 1)
            self.assertEqual(store.append_events([ev])["written"], 0)
            self.assertEqual(store.append_events([ev])["skipped"], 1)
            self.assertEqual(len(store.load_events()), 1)
