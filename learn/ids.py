from __future__ import annotations

import hashlib
import json
from typing import Any


def canonical(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=True, sort_keys=True, separators=(",", ":"))


def digest(obj: Any) -> str:
    return hashlib.sha256(canonical(obj).encode("utf-8")).hexdigest()


def slot_id(*, event_type: str, date: str, sheet: str = "", item_id: str = "", source: str) -> str:
    return digest(
        {
            "kind": "slot",
            "type": event_type,
            "date": date,
            "sheet": sheet or "",
            "item_id": item_id or "",
            "source": source,
        }
    )


def event_id(*, slot: str, body: dict) -> str:
    """Stable ID: hash(slot + semantic body). No clock, no nonce, no PID."""
    return digest({"kind": "event", "slot_id": slot, "body": body})
