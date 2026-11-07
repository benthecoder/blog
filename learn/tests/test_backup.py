import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from learn.backup import backup, restore
from learn.ingest import _event
from learn.store import Store


class BackupTests(unittest.TestCase):
    def test_backup_and_restore_roundtrip(self):
        with TemporaryDirectory() as td:
            src = Store(Path(td) / "src")
            src.ensure()
            ev = _event("sheet_issued", "2024-01-15", "packet_state",
                        {"uploaded": True, "sheet": "math", "source_seq": "packet:a"}, sheet="math")
            src.append_events([ev])
            archive = Path(td) / "backup.tar"
            backup(src, archive)
            dest = Store(Path(td) / "dest")
            result = restore(archive, dest, verify=True)
            self.assertTrue(result["checksums_ok"])
            self.assertEqual({e["event_id"] for e in dest.load_events()},
                             {e["event_id"] for e in src.load_events()})
