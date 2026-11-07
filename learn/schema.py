from __future__ import annotations

from typing import Any

from learn import ACTIVITY_STATUSES, EVENT_TYPES, SCHEMA_VERSION, SHEET_KEYS

REQUIRED_EVENT_FIELDS = (
    "schema_version",
    "event_id",
    "slot_id",
    "type",
    "date",
    "source",
    "body",
)


class ValidationError(ValueError):
    pass


def sheet_key(label_or_key: str) -> str:
    if label_or_key in SHEET_KEYS:
        return SHEET_KEYS[label_or_key]
    if label_or_key in SHEET_KEYS.values():
        return label_or_key
    raise ValidationError(f"unknown sheet: {label_or_key!r}")


def validate_event(event: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(event, dict):
        raise ValidationError("event must be an object")
    missing = [k for k in REQUIRED_EVENT_FIELDS if k not in event]
    if missing:
        raise ValidationError(f"event missing fields: {missing}")
    if event["schema_version"] != SCHEMA_VERSION:
        raise ValidationError(f"unsupported schema_version: {event['schema_version']!r}")
    if event["type"] not in EVENT_TYPES:
        raise ValidationError(f"unknown event type: {event['type']!r}")
    date = event["date"]
    if not isinstance(date, str) or len(date) != 10:
        raise ValidationError(f"date must be YYYY-MM-DD, got {date!r}")
    try:
        parts = [int(p) for p in date.split("-")]
        if len(parts) != 3:
            raise ValueError
    except ValueError as exc:
        raise ValidationError(f"invalid date: {date!r}") from exc
    body = event["body"]
    if not isinstance(body, dict):
        raise ValidationError("body must be an object")
    if event["type"] == "sheet_activity":
        status = body.get("status")
        if status not in ACTIVITY_STATUSES:
            raise ValidationError(f"invalid activity status: {status!r}")
    if event["type"] == "assessment":
        if "correct" not in body or not isinstance(body["correct"], bool):
            raise ValidationError("assessment.body.correct must be a boolean")
    for key in ("event_id", "slot_id", "type", "date", "source"):
        if not isinstance(event[key], str) or not event[key]:
            raise ValidationError(f"{key} must be a non-empty string")
    return event


def order_key(event: dict[str, Any]) -> tuple:
    """Deterministic recency key from source-provided sequence, never wall-clock now()."""
    body = event.get("body") or {}
    seq = body.get("source_seq") or ""
    return (str(seq), event["event_id"])


def latest_by_slot(events: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    latest: dict[str, dict[str, Any]] = {}
    for event in events:
        sid = event["slot_id"]
        prev = latest.get(sid)
        if prev is None or order_key(event) >= order_key(prev):
            latest[sid] = event
    return latest


def grade_conflict(events: list[dict[str, Any]]) -> bool:
    """True when multiple distinct answers share the same empty/missing sequence."""
    if len(events) < 2:
        return False
    seqs = {(e.get("body") or {}).get("source_seq") or "" for e in events}
    corrects = {(e.get("body") or {}).get("correct") for e in events}
    return seqs == {""} and len(corrects) > 1
