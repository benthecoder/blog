# Search response processing

The client previously converted parsed API results back into a JSON string and
parsed them again through `parseSearchCache`. The old local-storage cache no
longer exists. `validateSearchResults` now accepts the parsed data directly;
the cache-named wrapper and its JSON conversion are removed. The same required
fields, finite scores, string tags, and optional-field checks still apply.

Responses from cancelled or superseded searches are discarded before parsing
their body. If cancellation happens during parsing, results are discarded
before validation. The latest-search failure message and successful empty
results retain their existing behavior. No markup or styling changes.

An isolated Node 24 benchmark used 25 real article bodies in a valid keyword
result fixture (66,597 serialized bytes). Seven runs of 500 validations measured
a median 146.6 ms with the JSON round trip and 0.9 ms with direct validation.
Validated output was equivalent. These numbers measure only response validation,
not network, database, search latency, or Vercel usage.

The existing response-validation and stale-search tests cover the change. The
stale-success test additionally confirms that a superseded response is never
parsed, even if its fetch implementation ignores cancellation. The full suite
passes 275 tests; lint, unused-code checks, TypeScript, and the Node 24 production
build pass on the merged main base. PR #58's separate pagination tests are not
part of this branch.
