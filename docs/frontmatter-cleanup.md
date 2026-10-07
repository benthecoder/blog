# YAML frontmatter cleanup

This replaces gray-matter with a focused YAML boundary backed by js-yaml 5.4.1. The blog uses YAML metadata; executable JavaScript frontmatter engines are rejected. Parsing returns only `data` and `content`, without the old parser's auxiliary objects or global parse cache.

All callers use `parseFrontmatter` and `stringifyFrontmatter`, including Markdown file access, draft formatting, chunk generation and the local editor's data handling. The parser keeps dates and merge keys with explicitly enabled safe YAML tags. It rejects non-mapping metadata, unfinished headers and unsupported language engines. Plain Markdown, empty headers, BOM and CRLF are supported.

Admin post reads and writes now go through `utils/content/markdown.ts`. Saves use its existing atomic file helper; exclusive new-file creation reports a conflict instead of overwriting an existing draft. No editor markup, styling or layout changes are included.

## Evidence

- Compared the original gray-matter-based `readMarkdownFile` with the new helper on all 1,042 published files. Every parsed metadata object and body matched after JSON serialization.
- Round-trip tests cover dated metadata, array tags, multiline values and a body containing a horizontal rule. Security checks reject JavaScript engines, JavaScript YAML types, malformed headers and non-mapping metadata.
- 262 tests across 38 files pass; lint passes with the five existing ESLint warnings; Knip is clean.
- Removing gray-matter removes its js-yaml 3 → argparse 1 → sprintf-js dependency chain. Neither gray-matter nor sprintf-js remains in the lockfile.

This is a dependency and data-handling cleanup, not proof of a particular bundle-size or production-latency reduction. The separate dependency-hardening PR addresses KaTeX and CSS packages; the unpatched braces tooling alert remains separate work.
