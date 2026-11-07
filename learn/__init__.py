"""Private learning-event store, ingest, and allowlisted public export.

This package does not publish progress and does not change site routes.
See learn/README.md and learn/ARCHITECTURE.md.
"""

SCHEMA_VERSION = 1
STORE_KIND = "learn-events"
DEFAULT_STORE = "/workspace/learn-store"
TZ_NAME = "America/New_York"
EMPTY_RM = 300
DEFAULT_WINDOW_DAYS = 3
DEFAULT_STALE_AFTER_HOURS = 36

SHEET_KEYS = {
    "Chinese": "chinese",
    "AI Lab Math": "math",
    "Bible": "bible",
    "Crossword": "crossword",
}
SHEET_LABELS = {v: k for k, v in SHEET_KEYS.items()}
EVENT_TYPES = (
    "sheet_issued",
    "item_shown",
    "item_set",
    "sheet_activity",
    "assessment",
)
ACTIVITY_STATUSES = ("present", "none", "unknown")
