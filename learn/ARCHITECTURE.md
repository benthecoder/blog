# Architecture and data flow

## Why this shape

The daily packet already prints sheets, logs `items.jsonl`, maintains an FSRS
deck (`data/srs_cards.json`), and can read sheet-level ink from the rmapi tree
cache. Those files live on the shared box, not in this public repository.

This package adds a portable, multi-writer-safe event log that other agents can
read without depending on one bot's memory. The public blog repo versions the
schema, adapters, tests, and docs. Real events stay outside git.

```
packet_state.json  items.jsonl  tree.cache  grades.json(l)
        \              |            |              /
         \             |            |             /
          +------------+-----+------+------------+
                             |
                      python3 -m learn ingest
                             |
                             v
              /workspace/learn-store/events.jsonl
                 (append-only, locked, private)
                             |
                      python3 -m learn export
                             |
                             v
              allowlisted JSON (temp path only for now)
```

SQLite is not the source of truth. The log is JSONL so it stays diffable and
replayable. Derived views are computed at export time.

## Event schema (version 1)

Every event has:

| Field | Meaning |
| --- | --- |
| `schema_version` | `1` |
| `event_id` | SHA-256 of `slot_id` + semantic `body` (no clock, no nonce, no PID) |
| `slot_id` | SHA-256 of `(type, date, sheet, item_id, source)` |
| `type` | `sheet_issued` \| `item_shown` \| `item_set` \| `sheet_activity` \| `assessment` |
| `date` | America/New_York calendar date `YYYY-MM-DD` |
| `sheet` | `chinese` \| `math` \| `bible` \| `crossword` (empty for assessments) |
| `item_id` | private; never copied into a public export |
| `source` | `packet_state` \| `items.jsonl` \| `tree` \| `grades` |
| `body` | type-specific payload, including `source_seq` for recency |

`source_seq` comes from the *artifact* (packet `built` timestamp, tree
`Generation`/`Hash`, grade `sequence` or `provenance.recorded_at`). It is not
"now". Latest-per-slot is `max(source_seq, event_id)`.

Identical observations produce the same `event_id` and are skipped. A changed
body (late ink, a corrected grade, a rebuilt day's item set) writes a new
event with the same `slot_id`. Older rows stay in the log.

If two assessments for one slot have different `correct` values and no
`source_seq`, export treats them as unresolved and counts neither (fail-closed).

### Type payloads

- `sheet_issued` — `{uploaded, sheet, source_seq}` from `packet_state` when
  `uploaded` is true and `files` lists that sheet.
- `item_shown` — `{status: new\|review\|stretch, item_type, source_seq}`.
  This records that an item was **printed**, not that it was attempted.
- `item_set` — `{count, ids_hash, item_ids, source_seq}` so a same-day rebuild
  keeps the previous set as history.
- `sheet_activity` — `{status: present\|none\|unknown, ink_pages, method: rm_filesize, source_seq}`.
  `none` means the document was found and `.rm` page files were empty
  (`Size <= 300`, same threshold as `adaptive/signals.py`). `unknown` means
  the scan failed or the document was not in the tree. Missing scans write
  nothing, and export then reports `unknown` rather than zero.
- `assessment` — `{correct: bool, source_seq, provenance?}`.

Curriculum `progress.json` is intentionally not ingested. Advancing a lesson
step is a schedule cursor, not demonstrated knowledge.

## Source contracts (read-only)

| Source | Expected shape |
| --- | --- |
| `daily/packet_state.json` | `{packets: {YYYY-MM-DD: {uploaded, files, built}}}` |
| `data/items.jsonl` | `{date, sheet, item_id, type, status}` plus unused extra fields |
| rmapi `tree.cache` | `{Generation, Hash, Docs: [{Metadata, Files}]}` or a `{id: doc}` map |
| Grades | list, single object, or `{grades\|rows: [...]}` with `date`, `item_id` or `word`, `correct` |

Sheet visible names follow the packet: `Chinese · Jan 15` (English month
abbreviation, no leading zero on the day).

This tool never calls `rmapi put`, `mv`, or `rm`. A tree refresh, if needed,
is a separate read-only `rmapi ls`.

`get` / `geta` can render annotations for a human later. They are not wired
here: file-size activity is enough for this slice, and this PR does not claim
handwriting OCR or auto-grading.

## Multi-writer contract

1. Take `store.lock` with `fcntl.LOCK_EX` before reading-then-writing events,
   repairing, backing up, restoring, or exporting.
2. Write files via a same-directory temp, `fsync`, `os.replace`, then `fsync`
   the directory.
3. Only `ingest`, `repair`, and `restore` mutate the log. `export` and
   `status` are readers (`export` may write the caller-supplied `--out` file).
4. Do not rewrite `items.jsonl`, `packet_state.json`, or the live
   `srs_cards.json` from this tool. `policy-annotate` writes a new file.
5. Agents should set `--store` explicitly so two experiments do not share a
   lock by accident.
6. `schema_version` is `1`. Unknown versions fail closed.

## Public export allowlist

The exporter *constructs* a document; it never passes events through. Allowed
top-level keys: `schema_version`, `visibility`, `as_of`, `last_success_at`,
`stale_after_hours`, `counts`, `by_sheet`, `days`, `notes`.

Counts: `issued_sheet_days`, `activity_present_sheet_days`,
`activity_none_sheet_days`, `activity_unknown_sheet_days`, `assessments`,
`demonstrated`. There is no `attempted` field.

`visibility` is `opt_in_required`. `days[].sheets.{chinese|math|bible|crossword}`
only exposes `{issued: bool, activity: present|none|unknown}`.

Export refuses to write a file if the log has corrupt lines. `learn repair`
moves those lines to `events.jsonl.corrupt` and rewrites the valid prefix.

## FSRS policy investigation

Live code (`adaptive/scheduler.py`, not modified by this PR):

- `Deck.show(..., rating=Rating.Good)` treats each first daily display as a
  successful review and increments `reviews`.
- Same-day repeats are ignored via `last_day`.
- `apply_signals` re-queues an item (`due = now`) when
  `ink.get(visibleName) == 0`. That is not Again and not "wrong".
- `ink.get(name) is None` (unknown / not found) does not re-queue, because
  `None == 0` is false. The day is still appended to `_settled["days"]`, so a
  later late-sync cannot settle that day. The new ingest log does not copy
  that settlement behavior; activity events can be revised when the tree
  changes.
- `correct is False` on a BMO row calls `show(..., rating=Again)`.

`learn/policy.py` implements `display_is_not_review` as a reference:

- `record_display` records `last_shown` and never increments `reviews` or
  invents Good.
- `record_rating` requires provenance and still does not import `fsrs` or
  rewrite stability/due (so it cannot silently reset intervals).
- `settle_without_ink_ratings` never writes Again and never changes `due`
  from sheet-level ink.
- `annotate_legacy_assumptions` only adds
  `meta.legacy_assumption = "display_counted_as_good"`.

Wiring this into `daily_packet.py` would change due-order and retrievability
if done carelessly (`due()` currently ranks reviewed cards and skips
`last_day == today`). Activation stays **code-only** until a dedicated
rollout reviews selection against fixtures.

## Backup

`python3 -m learn backup` writes a local tar plus checksums.
`restore --archive` copies the files back and checks hashes and that
`events.jsonl` still parses. That proves the archive is readable on this
machine. It is not off-site redundancy.

## Tests

See `learn/tests/`. They use synthetic January 2024 fixtures only.
