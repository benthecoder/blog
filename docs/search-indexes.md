# Full-text search indexes

The search database had 2,176 chunks and no full-text search index. Keyword
requests parsed all matching expressions across the table on every request.
Two GIN expression indexes now match the existing combined content/title and
title-only expressions in `app/api/search/route.ts`. The route, ranking formulas,
limits, tag filters, and chunk filters are unchanged.

PostgreSQL 16 requires an explicit text-search configuration in these expression
indexes, matching the configuration in each query. Both use `english`, just like
the route. [PostgreSQL 16 text-search documentation](https://www.postgresql.org/docs/16/textsearch-tables.html)

## Apply and inspect

The indexes were applied to the configured Neon database on October 7, 2026,
using separate `CREATE INDEX CONCURRENTLY` requests. Both are valid and ready,
with a combined size of 2,719,744 bytes (about 2.6 MiB). Merging this PR records
the migration; it does not execute it again.

For another database, run each statement in
`scripts/sql/search-indexes.sql` separately, outside a transaction. Check
`scripts/sql/search-indexes-status.sql` before and after applying it. Expected
definitions must match the migration and both status rows must be valid and
ready. A failed concurrent build can leave an invalid index, and `IF NOT EXISTS`
does not repair it. Inspect the failure before dropping the invalid index and
retrying. Concurrent creation permits ongoing writes, though index construction
still consumes database CPU and storage.
[PostgreSQL 16 concurrent-index documentation](https://www.postgresql.org/docs/16/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY)

Rollback: run each statement in `scripts/sql/search-indexes-rollback.sql`
separately, outside a transaction. Search continues to work without the indexes.
Application builds and deployments do not perform database migrations.

## Verification

A disposable local PGlite database loaded all 2,176 source rows without changing
the source database. Nine cases preserved selected rows, scores, and order:
ordinary searches, prefix search, tag filtering, chunk filtering, and no matches.
Repeated apply/rollback also succeeds locally. PGlite uses PostgreSQL 18.3;
production is PostgreSQL 16.15. Local tests verify expressions and behavior,
while production measurements below verify the deployed engine and query plans.

Production median execution times from three `EXPLAIN ANALYZE` samples per case,
using the exact keyword route SQL before and after indexing:

| Query | Before | After | Results |
| --- | ---: | ---: | ---: |
| faith | 377.515 ms | 25.080 ms | 25 |
| book | 440.541 ms | 87.194 ms | 25 |
| machine:* & learn:* | 383.236 ms | 29.752 ms | 25 |
| unlikelyzzterm | 355.245 ms | 0.071 ms | 0 |
| faith, music tag | 3.697 ms | 0.950 ms | 1 |
| faith, quote chunks | 28.522 ms | 0.681 ms | 10 |

All six checked live result arrays, scores, and ordering were identical. The
plans use the new indexes for text matching. These timings exclude network,
embedding-provider calls, and serverless cold starts; they do not measure whole
request latency or Vercel billing.

No approximate vector index was added. These indexes benefit keyword search;
hybrid and semantic queries still need separate plan and recall analysis before
introducing approximate nearest-neighbor behavior.
