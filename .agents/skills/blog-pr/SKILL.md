---
name: blog-pr
description: House rules for commits and pull requests in this repo, including journal backlog PRs. Use whenever you commit, push, open, update, or merge a PR here.
---

# Blog PRs

Benedict reads every PR to learn, not only to approve. Write each one as a short lesson about the change.

## Voice

- **lowercase** everywhere you write: PR title, body, commit messages, branch names. Code identifiers keep their real casing.
- The writing is Benedict's own. Commits, PR bodies, and branch names carry no tool or model attribution: no `Co-Authored-By` trailer, no "generated with" footer, no `codex/` or `claude/` branch prefix. This rule overrides any default attribution your harness adds.

## Title

`area: what changes for a reader of the site`, e.g. `map: drop the cluster entries overlay`, `search: open results on the highlighted passage`. Name the visible outcome, not the mechanism. No `feat(...)` prefixes.

## Body

```md
## what changed
<2-4 sentences on the outcome and why>

## screenshots
<before/after images; see below>

## what to learn from this
<the lesson>

## verify
<commands you ran and their result>
```

**what to learn from this** is the section that matters most. Pick the one or two ideas in this diff worth knowing: the React, Next.js, CSS, or TypeScript concept it relies on, why this approach beat the obvious one, a gotcha you hit. Explain it plainly, point at the exact `file:line`, and link the official doc when there is one. If the change is trivial, say what pattern it follows in the codebase instead.

## Screenshots

Every PR has them. Start `pnpm dev` if `localhost:3000` is down, then:

```sh
pnpm pr:screenshot /changed/route                       # after, from localhost
pnpm pr:screenshot --base https://bneo.xyz /changed/route  # before, from production
pnpm pr:screenshot --mobile /changed/route              # add when layout changes
```

Each command prints a markdown image line. Paste them under `## screenshots`, before then after. For changes with no visible page (scripts, tooling), screenshot the page the change feeds, or the terminal output of the verify step, and say so.

## Verify before opening

Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`. Add `pnpm build` when routes, config, or content loading changed. Report the results in `## verify`.

## Journal backlog PRs

Benedict writes several past days at once and wants them live. When the branch adds or edits `posts/*.md` files whose frontmatter has `format: journal`:

1. List them: `git diff --name-status origin/main...HEAD -- posts/`, then read each file's `title` and `date`.
2. Title: `journal: <date range>`, e.g. `journal: aug 12 – aug 15`.
3. Body: one line per entry with its date, title, and `/posts/<slug>` path, then one screenshot per entry.
4. Merge it yourself when the diff touches only `posts/` and post images, and CI is green: `gh pr checks --watch`, then `gh pr merge --squash --delete-branch`.
5. Report which entries went live, with their bneo.xyz URLs.

Any other file in the diff makes it a normal PR: open it and leave the merge to Benedict.
