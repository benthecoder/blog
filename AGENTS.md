<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# blog

Personal blog — bneo.xyz. Next.js 16 app router, TypeScript, Tailwind CSS, pnpm. Benedict uses this repo to learn as much as to publish.

## How to work here: be ambitious

Speed is the baseline. Every task also gets pushed along three axes:

- **Altitude.** Ask what Benedict wants to happen _next_, the goal beyond the goal, and work toward that outcome rather than the literal task. Prefer a durable loop over a one-off fix: a check in CI, a script, a test that keeps the problem solved without him asking again (fix one broken link, then make broken links fail the build). When the loop needs access you lack (data, a CLI, credentials), say exactly what to wire up.
- **Depth.** Work the way the field's best practitioner would, with their instruments, not their vocabulary: measure performance with Lighthouse and real timings instead of eyeballing it, query the Neon tables and R2 bucket instead of trusting summaries, check typography against the rendered page. Start from the rawest material available. Aim at unreasonable targets (asked for 5s, try for 200ms) and treat hard as solvable. Challenge the premise against real data before building on it.
- **Range.** Name the task as verbs, then ask which other fields do those verbs best: editorial design and typography for posts, cartography for `/map`, information design for visualizations, librarianship for the wiki and tags. Do what those experts do, rather than imitating how they talk.

**Outside judge.** Never grade your own work. The judge is something that runs: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, a measurement, or a screenshot of the real page. If no judge exists for the change, build one first.

Before a substantial task, take one pass at sharpening it: what would a top practitioner do here that was not asked for, what raw material would they start from, which tools and methods, and what (other than you or Benedict) will show it is right. Then do that version, or propose it when the scope jumps. Put the ambitious option you took or skipped in the PR's "what to learn from this".

## Finish cleanly

A task is done when the repo looks like you were never there, apart from the intended change:

- Remove debug logs, scratch scripts, and temporary files you created. Plans and notes belong in `.claude/plans/` (gitignored).
- Stop any dev server, watcher, or background process you started. Leave the one Benedict already runs on `:3000` alone.
- Remove git worktrees you created (`git worktree remove`), and after a merge: switch to `main`, `git pull`, delete the merged branch locally and on the remote.
- End with `git status` showing only the intended change, then report what you left behind on purpose.

## Commits and PRs

Before any commit, push, or PR, load the `blog-pr` skill (`.agents/skills/blog-pr/SKILL.md`). Short version: lowercase, no AI attribution, always screenshots, and a "what to learn from this" section.

## Skills

Project skills live in `.agents/skills/` (Codex reads it directly; Claude reads it through the `.claude/skills` symlink). Add new skills there, never in `.claude/skills/` directly, and give each one an `agents/openai.yaml` so Codex sees the same invocation policy as Claude's `disable-model-invocation`.

## Content model

Two content types, both markdown with gray-matter frontmatter:

- **Posts** `posts/*.md` → `/posts/[slug]` — chronological journal entries
- **Wiki** `wiki/*.md` → `/wiki/[slug]` — living reference pages (personal encyclopedia)

See any existing file in those directories for the frontmatter shape. All directory and file path constants live in `config/paths.ts` — add new paths there, never hardcode them.

## Critical rule

All markdown file I/O goes through `utils/content/markdown.ts` (`readMarkdownFile`, `scanMarkdownDir`). Do not add raw `fs.readFileSync + matter()` calls anywhere else. Higher-level content access goes through `utils/content/posts.ts`, `utils/content/wiki.ts`, or `utils/content/gallery.ts`.

## Not markdown

`/thoughts` stores short-form posts in Postgres (Neon), not files. See `app/thoughts/` for the schema and query patterns.

## Color

All color lives in `app/globals.css`. Never hardcode a hex value in a component.

Two tiers. **Surfaces** are fixed across themes: `paper`, `paper-raised/sunken/tint/warm`, `rule` for light; `night`, `night-raised`, `night-rule` for dark. **Ink** is the only tier a palette changes: `ink-muted → ink-soft → ink → ink-strong` on paper, `chalk-muted → chalk → chalk-soft → chalk-strong` on night, running quietest to highest-contrast.

Pick tokens by mode: `ink-*` only in light, `chalk-*` only behind a `dark:` variant. Mixing them (`dark:text-ink-soft`) puts a light-mode tone on a dark surface.

Six palettes — indigo, olive, gold, steel, vermillion, rose — set via `data-palette` on `<html>` by the provider in `app/providers.tsx`. Adding one means a block in the PALETTES section plus its id in that file's `PALETTES` array.

Exception: `/map` keeps its own fixed palette (`--map-*`, MAP section of globals.css) and does not follow `data-palette`, including the basemap tile colors.

Two things to know before editing:

- Tailwind v4 strips `--tw-*` declarations from author CSS, so Typography's `--tw-prose-*` variables **cannot** be remapped. Themed prose elements are styled directly instead; follow that pattern.
- Text on a themed fill must not use a neighbouring tone of the same tier — `text-ink` on `bg-chalk` collapses to ~2.5:1. Pair across tiers (`bg-ink text-paper`, `dark:bg-chalk dark:text-night`).

## Verify changes

```
pnpm dev          # dev server (usually already running on :3000)
pnpm lint         # oxlint, including type-aware rules
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest
pnpm build        # full build + RSS + sitemap generation
```
