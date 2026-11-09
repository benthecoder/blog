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

## Working alongside other agents

Claude and Codex both work in this repo, often in parallel.

- `/Users/bneo/blog` is Benedict's checkout and runs his dev server. Check `git worktree list` before editing, and do parallel work in its own worktree; never edit on top of another agent's uncommitted changes. A new worktree needs `.env.local` copied in and `pnpm install`, and its dev server must start from the worktree (content is read from `process.cwd()`).
- If `.claude/plans/handoff.md` exists, read it first: it is the previous session's handoff, from either tool.
- Never commit images. Published images live in R2, and image history was purged from git.

## What gets merged

Benedict wants a careful maintainer, not a designer. Correctness, performance, SEO, accessibility, backend and security work, and quality-of-life fixes to the photos and maps sites land reliably. Features land when they quietly resurface his own writing, like the on-this-day footer. The main blog's look and homepage are his: propose, don't ship. No new icons (every one is hand-drawn), no stats, widgets, or new feeds, and no invented personal facts; list anything he must supply as a TODO in the PR. Build the smallest version of what he asked for, and grep for an existing feature before building one.

Design and code he reads as slop: tags, italics, dividers, bordered containers, many shades and opacities, detailed diagrams, section numbering; god files, duplication, pass-through wrappers, layer-first folders, representable illegal states, validation away from the boundary.

## Commits and PRs

Before any commit, push, or PR, load the `blog-pr` skill (`.agents/skills/blog-pr/SKILL.md`). Short version: lowercase, no AI attribution, screenshots for visible changes only, and a "what to learn from this" section.

## Skills

Project skills live in `.agents/skills/` (Codex reads it directly; Claude reads it through the `.claude/skills` symlink). Add new skills there, never in `.claude/skills/` directly, and give each one an `agents/openai.yaml` so Codex sees the same invocation policy as Claude's `disable-model-invocation`.

## Content model

Two content types, both markdown with gray-matter frontmatter:

- **Posts** `posts/*.md` → `/posts/[slug]` — chronological journal entries
- **Wiki** `wiki/*.md` → `/wiki/[slug]` — living reference pages (personal encyclopedia)

Tag a post only with what it is about: a passing mention (one "went to church" line, one verse, one quote) never earns a tag, and journal days get 0–2 tags. A `locations` entry means Benedict was there on that date, not that the place is mentioned. `utils/content/tagVocabulary.test.ts` pins every tag used on fewer than 3 posts, so prefer an existing tag over a new one.

When adding sources to post or wiki text, link the words themselves (`he brought in [kudzu](url)`), never a parenthetical `([source](url))`.

See any existing file in those directories for the frontmatter shape. All directory and file path constants live in `config/paths.ts` — add new paths there, never hardcode them.

## Critical rule

All markdown file I/O goes through `utils/content/markdown.ts` (`readMarkdownFile`, `scanMarkdownDir`). Do not add raw `fs.readFileSync + matter()` calls anywhere else. Higher-level content access goes through `utils/content/posts.ts`, `utils/content/wiki.ts`, or `utils/content/gallery.ts`.

## Not markdown

`/thoughts` stores short-form posts in Postgres (Neon), not files. See `app/thoughts/` for the schema and query patterns.

## Color

All color lives in `app/globals.css`. Never hardcode a hex value in a component. `/map` keeps its own fixed palette (`--map-*`) and does not follow `data-palette`, including the basemap tile colors.

Before any color or theme change, load the `blog-design-system` skill: it holds the tokens, the role utilities (`text-primary` over raw `ink-*`/`chalk-*` pairs), palettes, and the contrast and Tailwind gotchas.
