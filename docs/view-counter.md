# View-counter requests

## Counting visits

Previously the API made two sequential HTTP requests: create a 24-hour deduplication marker, then increment or read the persistent count. If the increment failed after creating the marker, retries could not count that visit.

The new command uses one bounded Lua script through Upstash's EVAL endpoint. New viewers create a marker and increment the counter; repeated viewers read the current count. If INCR fails, the script removes the newly created marker before returning an error. This cleanup is explicit because Redis scripts isolate execution but do not automatically roll back earlier writes.

Existing counter names, viewer hashes, Unicode slugs and the 24-hour expiry stay unchanged. A lost HTTP response can be retried without incrementing the same viewer twice. Scripts contain no interpolated user input; key names and expiry are separate Redis arguments.

## Reading the leaderboard

The archive's published filenames bound the leaderboard. Reads still use batches of at most 200 keys. For the current 1,042 published posts, the six MGET commands now travel in one pipeline HTTP request instead of six sequential requests. Pipeline results preserve command order; any command error rejects the response rather than returning a partial leaderboard. Empty archives do not call Redis.

Single commands and pipelines share one transport with explicit no-store caching and a ten-second timeout. Pipeline execution is not a transaction. The counter script provides the isolation needed for mutations.

## Verification

- An isolated Redis 7.2.16 server, built from an official SHA256-verified release, executed the actual script. One hundred concurrent repeats counted once; one hundred distinct viewers counted 100 times. Expiry and retry after a malformed counter passed. The server used a private Unix socket with persistence disabled and was stopped after verification.
- Read-only checks against configured Upstash confirmed pipeline ordering support and EVAL availability. These checks did not modify production counters.
- 263 tests across 38 files passed. Tests cover route validation, unchanged response shapes, one-command writes, batching, partial provider errors and transport behavior.
- Lint, Knip, TypeScript and the full production build passed.

See [Upstash's Lua documentation](https://upstash.com/blog/lua-scripting-on-upstash-redis-atomic-operations-over-http) and [REST pipeline documentation](https://upstash.com/docs/redis/features/restapi). The improvement is fewer HTTP round trips and more reliable counting; Redis command billing and deployed latency have not been measured. Upstash uses global locking for Lua by default, so the script is deliberately short with no loops or archive reads.
