# Atomic embedding replacement

Branch: `fix/atomic-embedding-replacement`, based on PR #67. Includes the provider retry fix from #66 to avoid competing edits to the same script.

Before: the script deletes old chunks before generating embeddings; per-row insertion failures are caught and counted, then the CLI exits successfully. Full rebuilds can empty or partially populate the index.

After: read posts, prepare every vector, validate provider results, then use a connected Neon session for BEGIN, transaction advisory lock, scoped DELETE, bulk INSERT batches, and COMMIT. Any write failure attempts ROLLBACK and exits unsuccessfully. No database session is held while provider requests run. All-post and single-post modes share this implementation.

## Verification

- 302 tests, TypeScript, lint (four existing ESLint warnings), Knip, Node 24 build.
- Disposable PGlite PostgreSQL 18.3 with pgvector: second-batch duplicate UUID fails and restores all original rows, including the first inserted batch. Single-post replacement preserves other posts; full replacement removes old rows. Commas, quotes, backslashes, and Japanese tags round-trip.
- The real 1,042-post corpus yielded 2,199 prepared chunks with synthetic finite 1,024-dimensional vectors. The actual bulk SQL inserted all rows, using 23 commands and about 48 MB of serialized rows.
- Existing Neon PostgreSQL 16.15: session connection and BEGIN READ ONLY / ROLLBACK verified. No production writes or paid provider calls.
- Tool-only verification dependencies were installed outside the repository. No runtime dependencies were added.

## Limits

Prepared rows live in CLI memory until replacement finishes. A full rebuild transaction updates indexes and may hold the writer advisory lock for several seconds; production duration is unmeasured. Only writers using this helper participate in its advisory lock. Schema setup for a new database runs separately.

The session client and transaction behavior follow the [installed Neon driver documentation](https://github.com/neondatabase/serverless/blob/main/README.md). Local SQL verification uses [PGlite with pgvector](https://pglite.dev/extensions/).
