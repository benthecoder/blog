# Next.js 16.4 upgrade

Next.js and eslint-config-next are pinned together at 16.4.0. Official npm metadata marks it as stable, with no deprecation notice, and declares compatibility with the current React version and Node.js 24. The installed caching guide remains unchanged from 16.3.6; the existing segment configuration and deployment snapshots are retained.

No new rendering mode, experimental feature, styling or UI behavior is enabled. Cache Components would require a separate migration of existing route configuration, rather than a configuration toggle.

## Compatibility checks

Before/after local production checks on Node.js 24 compare:

- Visible content on `/`, `/start`, `/posts`, and `/posts/understand`.
- RSS entries, preview JSON and cache headers.
- Unauthenticated `/api/admin/list-posts` rejection (401).
- The complete prerendered route set: all 1,042 published articles remain static, and thoughts retain a 3,600-second regeneration interval.
- The checked social PNG, which is byte-identical across the framework upgrade.

The complete test suite, lint, unused-item check, TypeScript and production build must pass. The combined dependency-hardening tree is also checked to avoid validating the framework upgrade in isolation.

## Lint compatibility

The installer warns that ESLint 9 is no longer supported upstream. ESLint 10 currently falls outside the declared peer ranges of the installed import, accessibility and React plugins. Keep ESLint alongside oxlint and retain the existing rules until those dependencies provide compatible releases; do not override peer constraints or remove coverage merely to update a version number.

References: [Next.js upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16), [Next.js current caching model](https://nextjs.org/docs/app/guides/caching-without-cache-components), and official npm package metadata for `next`, `eslint-config-next` and their lint plugins. Newer releases are not assumed to be faster without measurement.
