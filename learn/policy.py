"""Scheduler policy: document live behavior and a code-only replacement.

Activation status
-----------------
NOT ACTIVE in the daily packet. This module is not imported by
`/workspace/remarkable/daily_packet.py` or `adaptive/scheduler.py`.
The live packet still records every shown item as FSRS Rating.Good and still
re-queues review items when a sheet's synced `.rm` size says the page was blank.

This file ships a tested reference implementation so a later rollout can switch
on `display_is_not_review` without inventing behavior under time pressure.

Live policy (investigated, do not silently change)
--------------------------------------------------
`Deck.show(iid, meta, day, rating=Rating.Good)` (adaptive/scheduler.py):
  * First sight or a new day calls `review_card` with Good by default.
  * Same calendar day repeats are ignored (`last_day == str(day)`).
  * `reviews` increments on each counted show.

`apply_signals(deck, rows, ink, grades, day)`:
  * For each earlier (not-yet-settled) item row, if `ink.get(visibleName) == 0`
    (document found and no ink pages), it sets that card's `due` to now.
    That is a re-queue, not FSRS Again, and not "the answer was wrong".
  * `ink.get(name)` is None when the doc was not found; `None == 0` is False,
    so unknown/missing scans do not re-queue. However the day is then added to
    `_settled["days"]` anyway, so a later late-sync cannot revisit that day.
    That is a settlement bug in the live code; the new policy must not copy it.
  * BMO rows with `correct is False` call `show(..., rating=Again)`.
  * Blank/unknown never produces Again today; the new policy keeps that.

Selection risk if display-Good stopped without care
---------------------------------------------------
`due()` skips items with `last_day == today` and ranks by retrievability of the
FSRS card. If we stopped calling `review_card(Good)`:
  * New cards would stay unreviewed (different due/stability).
  * Mean recall and due-order would change.
  * Same-day exclusion would break unless `last_shown` is consulted.

Therefore rollout must be explicit. `annotate_legacy_assumptions` only *labels*
existing JSON records; it does not rewrite card math. `record_display` never
calls a review and never increments `reviews`. `settle_without_ink_ratings`
never writes Again and never rewrites `due` from sheet-level ink.

New count semantics (used by learn.export, independent of FSRS)
--------------------------------------------------------------
issued     != attempted. Printing or uploading a sheet is not an attempt.
activity   sheet-level ink is evidence only (present/none/unknown).
checked    an assessment event exists for a specific item.
demonstrated  assessment.correct is True AND provenance is present AND the
              item_id matches an item_shown event. Not curriculum advancement.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

LEGACY_ASSUMPTION = "display_counted_as_good"
POLICY_NAME = "display_is_not_review"
ACTIVATION = "code-only"  # not wired into the daily packet


def annotate_legacy_assumptions(deck: dict[str, Any]) -> dict[str, int]:
    """Add provenance labels. Does not change card, reviews, due, or last_day."""
    labeled = 0
    skipped = 0
    for key, rec in deck.items():
        if key.startswith("_") or not isinstance(rec, dict):
            continue
        meta = rec.setdefault("meta", {})
        if meta.get("rating_provenance"):
            skipped += 1
            continue
        if meta.get("legacy_assumption") == LEGACY_ASSUMPTION:
            skipped += 1
            continue
        meta["legacy_assumption"] = LEGACY_ASSUMPTION
        labeled += 1
    return {"labeled": labeled, "skipped": skipped}


def card_math(rec: dict[str, Any]) -> dict[str, Any]:
    card = rec.get("card") or {}
    return {
        "card": deepcopy(card),
        "reviews": rec.get("reviews"),
        "last_day": rec.get("last_day"),
    }


def record_display(deck: dict[str, Any], item_id: str, day: str, meta: dict[str, Any] | None = None) -> None:
    """Record that an item was printed. Does not review and does not invent Good."""
    rec = deck.get(item_id)
    if rec is None:
        rec = {
            "card": None,
            "meta": {},
            "reviews": 0,
            "last_day": None,
            "shown_days": [],
        }
        deck[item_id] = rec
    rec.setdefault("meta", {}).update({k: v for k, v in (meta or {}).items() if v})
    rec.setdefault("shown_days", [])
    if day not in rec["shown_days"]:
        rec["shown_days"].append(day)
    rec["last_shown"] = day


def record_rating(
    deck: dict[str, Any],
    item_id: str,
    day: str,
    rating: str,
    provenance: dict[str, Any],
) -> None:
    """The only path that should later call FSRS review_card.

    This reference implementation records the rating and provenance; it does not
    import `fsrs` or mutate card stability, so activating it cannot silently
    reset intervals. A rollout can replace the body of this function with a
    real `review_card` call while keeping the provenance requirement.
    """
    if rating not in {"again", "hard", "good", "easy"}:
        raise ValueError(f"invalid rating: {rating!r}")
    if not provenance or not (provenance.get("assessor") or provenance.get("method")):
        raise ValueError("rating requires provenance (assessor or method)")
    rec = deck.setdefault(item_id, {"card": None, "meta": {}, "reviews": 0, "shown_days": []})
    rec.setdefault("ratings", []).append(
        {"day": day, "rating": rating, "provenance": dict(provenance)}
    )
    rec["reviews"] = int(rec.get("reviews") or 0) + 1
    rec["last_day"] = day
    rec.setdefault("meta", {})["rating_provenance"] = dict(provenance)


def settle_without_ink_ratings(
    deck: dict[str, Any],
    rows: list[dict[str, Any]],
    ink: dict[str, int | None],
    day: str,
) -> dict[str, int]:
    """New settlement: sheet-level ink never writes Again and never changes due.

    `ink` values: int pages, 0 = found blank, None = unknown/missing.
    """
    inspected = 0
    for row in rows:
        if row.get("date") >= day:
            continue
        name = row.get("visible_name")
        _ = ink.get(name) if name else None
        inspected += 1
        # Intentionally no due rewrite and no Again.
    return {"inspected": inspected, "again": 0, "due_rewritten": 0}


def live_blank_would_requeue(ink_value: int | None) -> bool:
    """Reproduce live `ink.get(name) == 0` (unknown/None does not requeue)."""
    return ink_value == 0
