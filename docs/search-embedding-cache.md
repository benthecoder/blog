# Search embedding reuse

Semantic and hybrid search previously made a Voyage embedding request for every
search, including identical queries and changes to filters or search mode.
`getSearchEmbedding` now caches the validated vector through Next.js with a
3,600-second revalidation interval. Query text and model identify the entry; the
versioned key also identifies the existing document input mode and 1,024
dimensions. The API still reads current results from PostgreSQL on every search.
No result-list caching, model changes, ranking changes, or UI changes.

The existing project uses Next.js's caching model without Cache Components.
`unstable_cache` is supported for that model and persists expensive results
across requests and deployments. Adopting the recommended `use cache` directive
requires a separate Cache Components migration across the site.
[Next.js cache reference](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

Simultaneous misses for one query/model share a provider request within a worker.
The pending entry is removed on either success or failure, so failures retry on
later searches. A provider response must contain 1,024 finite numbers before it
can enter the persistent cache. Missing, malformed, or failed responses throw
and retain the API's generic search error handling.

Voyage requests use a 10-second timeout with no automatic SDK retries. The
installed SDK previously defaulted to 60 seconds plus retries; this bounds the
provider wait in interactive search. Existing document-mode embeddings are
preserved to avoid changing search relevance during a performance change.

## Verification

- Four new regression tests cover simultaneous requests, query isolation,
  provider failure recovery, and rejection/retry of malformed vectors. Existing
  API boundary tests still cover keyword bypass, filters, fallback paths, and
  rejection before external services.
- All 279 tests, lint (four existing warnings), Knip, TypeScript, and the Node 24
  production build pass on the merged main base.
- A local production Next.js server used the real Voyage provider and database.
  A temporary process wrapper counted provider calls without recording tokens or
  queries. Ten API requests across two server runs made two provider calls:
  repeated semantic requests reused the first vector, five concurrent requests
  shared a second vector, keyword search bypassed Voyage, and hybrid search reused
  the semantic vector. Restarting the server retained the cache entry and returned
  an identical response without another provider call.
- The checked cold semantic request took 1,350.7 ms and its immediate repeated
  request took 115.0 ms, with identical response hashes. These are single local
  observations, not a latency distribution or a Vercel cost measurement. Pending
  requests coalesce within a worker; separate simultaneous cold workers can each
  miss the shared cache.

The temporary wrapper and cache-verification scripts are outside the repository.
No credentials or vector payloads are returned to visitors.
