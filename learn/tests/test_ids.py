import unittest

from learn.ids import event_id, slot_id


class IdTests(unittest.TestCase):
    def test_event_ids_are_stable_across_replay(self):
        body = {"status": "present", "ink_pages": 1, "method": "rm_filesize", "source_seq": "tree:1"}
        slot = slot_id(event_type="sheet_activity", date="2024-01-15", sheet="math", source="tree")
        first = event_id(slot=slot, body=body)
        second = event_id(slot=slot, body=dict(body))
        self.assertEqual(first, second)
        self.assertEqual(len(first), 64)

    def test_ids_ignore_insertion_clock(self):
        slot = slot_id(event_type="item_shown", date="2024-01-15", sheet="math",
                       item_id="math:skill:0:synthetic-bayes", source="items.jsonl")
        a = event_id(slot=slot, body={"status": "new", "item_type": "math-skill", "source_seq": "packet:x"})
        b = event_id(slot=slot, body={"item_type": "math-skill", "source_seq": "packet:x", "status": "new"})
        self.assertEqual(a, b)
