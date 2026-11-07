# Learning data foundation

Private event log, ingest adapters, and an allowlisted exporter. This
directory does not add a `/learn` route, change navigation, or publish
progress.

## Activation status

| Piece | Status |
| --- | --- |
| Event schema + private store + CLI | Shipped here; nothing writes to the live site |
| Ingest of packet / items / tree / grades | Ready to run against local files |
| Public exporter | Ready, but writing `public/data/learn.json` or committing a real export is **not** approved |
| FSRS policy `display_is_not_review` | **Code-only.** Not imported by the daily packet. Live sheets still record display as Good |
| `/learn` page and nav changes | Design only, in `DESIGN.md`. No UI in this PR |
| Handwriting `get` / `geta` QA | Deferred; sheet activity uses `.rm` file size from a tree listing |
| Off-machine backup | Not claimed. `backup` / `restore` verify a local tarball only |

## Visibility opt-in

Current approval covers this code and its synthetic fixtures, not publishing
real progress. Do not commit an export built from personal logs, and do not
copy one into `public/data/` until there is an explicit yes to make those
counts public.

## Private store

Canonical location (outside this git repo):

```
/workspace/learn-store
```

Override with `--store` or `$LEARN_STORE`. The store holds `events.jsonl`,
`manifest.json`, `last_success.json`, `store.lock`, and optional quarantine /
backup sidecars. It is shared-box private data, not a GitHub file.

## Commands other agents can run

From the repository root, no bot internals required:

```sh
python3 -m learn ingest \
  --store /workspace/learn-store \
  --items /workspace/remarkable/data/items.jsonl \
  --packet-state /workspace/remarkable/daily/packet_state.json \
  --tree-cache "$HOME/.cache/rmapi/tree.cache" \
  --window-days 3

python3 -m learn export --store /workspace/learn-store --out /tmp/learn-export.json
python3 -m learn status --store /workspace/learn-store
python3 -m learn repair --store /workspace/learn-store
python3 -m learn backup --store /workspace/learn-store --out /tmp/learn-store.tar
python3 -m learn restore --archive /tmp/learn-store.tar --store /tmp/learn-store-restored
python3 -m learn policy-annotate --deck /path/to/srs_cards.json --out /tmp/srs_cards.labeled.json
```

`--repair` rescans every issued date instead of the window. Repeatable
`--grades PATH` reads the existing grade contract (a list, a single object, or
`{grades: [...]}` with `date`, `item_id` or `word`, and boolean `correct`).
A synthetic example is `learn/fixtures/sample_grade_event.json`.

`policy-annotate` only writes the path you pass to `--out`. It does not
overwrite the live deck.

## Recommended sync (do not install a timer from this PR)

1. After the morning packet upload has written `packet_state.json` and
   `items.jsonl`, run `ingest` with `--window-days 3`. If the tree cache might
   be stale, refresh it first with a **read-only** `rmapi ls /` (never
   `rmapi rm`, and this tool never uploads or moves cloud docs).
2. Run the same `ingest` again around 03:30 America/New_York so writing that
   synced overnight is recorded as late activity, not a fake blank.
3. `export` only to a temp path until visibility is approved.
4. Periodically `backup` the store and `restore --archive …` into a scratch
   directory to verify checksums.

Parent-owned routines can schedule those commands. This PR does not add cron,
systemd units, or watchers.

## Counts

- **issued** — that sheet was uploaded that day. Not an attempt.
- **activity** — sheet-level ink evidence: `present`, `none` (doc found, no
  ink), or `unknown` (no scan or doc missing). Never treated as a grade.
- **assessments (checked)** — an explicit per-item assessment exists.
- **demonstrated** — that assessment is `correct: true`, has provenance, and
  the `item_id` matches an `item_shown` row. Curriculum step changes are not
  demonstrated knowledge.

## Tests

```sh
python3 -m unittest discover -s learn/tests -t .
# or: pnpm test:learn
```

Fixtures under `learn/fixtures/` are synthetic and labeled as such.
