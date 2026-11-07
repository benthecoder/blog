from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo

from learn import TZ_NAME

ET = ZoneInfo(TZ_NAME)


def today_et(now: dt.datetime | None = None) -> dt.date:
    clock = now if now is not None else dt.datetime.now(ET)
    if clock.tzinfo is None:
        clock = clock.replace(tzinfo=dt.timezone.utc)
    return clock.astimezone(ET).date()


def parse_date(value: str) -> dt.date:
    return dt.date.fromisoformat(value)


def is_future(date: dt.date, now: dt.datetime | None = None) -> bool:
    return date > today_et(now)


def short_sheet_name(sheet_label: str, date: dt.date) -> str:
    """Match packet/visibleName: 'Chinese · Nov 7' (English month, no leading zero)."""
    months = (
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    )
    return f"{sheet_label} · {months[date.month - 1]} {date.day}"
