# Hybrid candidate selection

The hybrid query combined text matching and vector matching with `OR`. PostgreSQL
scanned the chunks and parsed their text vectors even though text indexes were
available. Searches without tag filters now select candidate IDs from the union
of indexed text matches and exact vector-threshold matches, then use the existing
ranking formula on those candidates. Both branches preserve chunk filtering.
There is no candidate limit before ranking and no approximate vector search.

The union removes duplicate IDs when a chunk matches both branches. The table's
primary key guarantees that each candidate identifies one chunk. Text ranking,
vector ranking, weights, threshold comparisons, result limits, and response
mapping are unchanged. Only fixed SQL fragments vary; queries, tags, types, and
vectors remain bound parameters.
[PostgreSQL 16 union semantics](https://www.postgresql.org/docs/16/queries-union.html)

Tag-filtered requests keep the existing predicate. A trial that split every
request made the selective `music` filter slower (about 7→15 ms), so the final
change preserves its fast path. Fallback queries are unchanged. The new query
still works without the full-text indexes; the measured benefit uses the indexes
already applied and recorded in PR #60.

## Verification

Ten read-only comparisons used the existing 2,176-row production database, two
real cached fixture vectors, and identical parameters before/after. Every
checked result array, score, and ordering was identical. Cases cover ordinary
terms, a term absent from text, stop words, a selective tag, chunk filters, a
literal tag containing SQL punctuation, and a threshold that excludes vectors.

Median database execution times from three `EXPLAIN ANALYZE` samples per case:

| Query | Before | After |
| --- | ---: | ---: |
| machine learning | 595.588 ms | 258.540 ms |
| faith | 593.840 ms | 257.068 ms |
| book | 613.162 ms | 277.090 ms |
| faith, music tag | 6.852 ms | 6.503 ms |
| book, full-post chunks | 451.437 ms | 198.648 ms |
| faith, quote chunks | 49.287 ms | 25.882 ms |

These measure database execution only. Embedding requests, network latency, cold
starts, and hosting cost are separate. The text branch uses the GIN index in the
checked plans. No database schema or content changes were made for this rewrite.
