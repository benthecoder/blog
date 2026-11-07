import copy
import unittest

from learn.policy import (
    LEGACY_ASSUMPTION,
    annotate_legacy_assumptions,
    card_math,
    live_blank_would_requeue,
    record_display,
    record_rating,
    settle_without_ink_ratings,
)


def sample_deck():
    return {
        "math:skill:0:synthetic-bayes": {
            "card": {"due": "2024-01-20T09:42:00+00:00", "stability": 12.5, "difficulty": 4.2, "state": 2},
            "meta": {"first_seen": "2024-01-15"},
            "reviews": 3,
            "last_day": "2024-01-16",
        },
        "_settled": {"days": ["2024-01-15"], "grades": 0},
    }


class PolicyTests(unittest.TestCase):
    def test_annotate_does_not_change_card_math(self):
        deck = sample_deck()
        before = card_math(deck["math:skill:0:synthetic-bayes"])
        stats = annotate_legacy_assumptions(deck)
        self.assertEqual(stats["labeled"], 1)
        after = card_math(deck["math:skill:0:synthetic-bayes"])
        self.assertEqual(before, after)
        self.assertEqual(deck["math:skill:0:synthetic-bayes"]["meta"]["legacy_assumption"], LEGACY_ASSUMPTION)
        self.assertEqual(deck["_settled"], {"days": ["2024-01-15"], "grades": 0})

    def test_display_does_not_invent_good_or_increment_reviews(self):
        deck = sample_deck()
        before = card_math(deck["math:skill:0:synthetic-bayes"])
        record_display(deck, "math:skill:0:synthetic-bayes", "2024-01-17")
        self.assertEqual(card_math(deck["math:skill:0:synthetic-bayes"]), before)
        rec = deck["math:skill:0:synthetic-bayes"]
        self.assertEqual(rec["last_shown"], "2024-01-17")
        self.assertEqual(rec["reviews"], 3)
        record_display(deck, "math:skill:0:new-item", "2024-01-17")
        newbie = deck["math:skill:0:new-item"]
        self.assertEqual(newbie["reviews"], 0)
        self.assertIsNone(newbie["last_day"])
        self.assertIsNone(newbie["card"])

    def test_blank_and_unknown_do_not_write_again_or_due(self):
        deck = sample_deck()
        before = copy.deepcopy(deck)
        rows = [{"date": "2024-01-15", "item_id": "math:skill:0:synthetic-bayes", "visible_name": "AI Lab Math · Jan 15"}]
        out = settle_without_ink_ratings(deck, rows, {"AI Lab Math · Jan 15": 0}, "2024-01-17")
        self.assertEqual(out["again"], 0)
        self.assertEqual(out["due_rewritten"], 0)
        self.assertEqual(deck["math:skill:0:synthetic-bayes"]["card"], before["math:skill:0:synthetic-bayes"]["card"])
        settle_without_ink_ratings(deck, rows, {"AI Lab Math · Jan 15": None}, "2024-01-17")
        self.assertEqual(deck["math:skill:0:synthetic-bayes"]["card"], before["math:skill:0:synthetic-bayes"]["card"])
        self.assertTrue(live_blank_would_requeue(0))
        self.assertFalse(live_blank_would_requeue(None))
        self.assertFalse(live_blank_would_requeue(2))

    def test_rating_requires_provenance(self):
        deck = sample_deck()
        with self.assertRaises(ValueError):
            record_rating(deck, "math:skill:0:synthetic-bayes", "2024-01-17", "good", {})
        record_rating(
            deck,
            "math:skill:0:synthetic-bayes",
            "2024-01-17",
            "again",
            {"assessor": "fixture", "method": "human"},
        )
        self.assertEqual(deck["math:skill:0:synthetic-bayes"]["reviews"], 4)
        self.assertEqual(deck["math:skill:0:synthetic-bayes"]["last_day"], "2024-01-17")
        # still did not rewrite FSRS stability
        self.assertEqual(deck["math:skill:0:synthetic-bayes"]["card"]["stability"], 12.5)
