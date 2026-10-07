# Dependency security review

Reviewed October 7, 2026, against main `965c5a6` and the npm registry.

## Patched dependencies

- KaTeX 0.16.25 → 0.18.2, including the copies used by rehype-katex and remark-math. This fixes [inherited renderer options bypassing trust restrictions](https://github.com/advisories/GHSA-238p-pmpm-9mq7). The exact version is intentional: npm marks 0.18.11 deprecated for accidentally published breaking changes. The Markdown renderer and stylesheet resolve to the same pinned version.
- source-map-js 1.2.1 → 1.2.2 throughout the dependency tree. This fixes [indexed source-map offset denial of service](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- postcss-selector-parser 6.0.10 → 7.1.6 through a pnpm override because the current Tailwind typography plugin still pins 6.0.10. This fixes [quadratic selector parsing](https://github.com/advisories/GHSA-rj75-hqrm-r3gf). The production CSS build must pass before this cross-major override is merged.

## Remaining alerts

The registry audit reports one high and one moderate finding. Neither has a published patched npm version at review time. They have not been dismissed or hidden.

| Dependency | Usage found in this repository | Remaining issue |
| --- | --- | --- |
| braces 3.0.3 | micromatch in ESLint's Next plugin, lint-staged and next-sitemap; development dependencies | [Deeply nested patterns can exhaust the stack](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Registry latest is 3.0.3; although audit metadata suggests `>=3.0.4`, that release is not published. |
| sprintf-js 1.0.3 | gray-matter → js-yaml 3 → argparse | [Unbounded precision format strings can exhaust resources](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). Registry latest is 1.1.3 and remains affected. In js-yaml, argparse is imported by its CLI, while the library entry used by gray-matter imports the YAML parser directly. No direct application sprintf-js call was found. |

These dependency paths reduce the apparent exposure but are not proof that every reachable application path is safe. Do not claim a clean audit. A subsequent cleanup can remove the legacy YAML/CLI chain or adopt published fixes, with compatibility checks over existing frontmatter and local draft writing. A development dependency can still affect builds when its input is untrusted.

## Validation

256 tests across 37 files pass on this branch, based on main's 254 tests plus two math checks. The separate public-feed PR's five tests are not included here. Math checks cover the site's actual remark/rehype rendering pipeline and rejection of inherited `trust: true` when rendering a JavaScript link. All three patched packages resolve to a single fixed version in the installed dependency tree.
