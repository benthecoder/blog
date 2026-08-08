---
name: commit-and-pr
description: How to commit and open PRs in this repo — branch hygiene, commit style, PR body format. Use whenever asked to commit changes or open a pull request in this repo.
---

# Commit and PR workflow

## Before committing

Check whether the current branch's PR is already merged (`gh pr view <branch> --json state`). If it is, don't pile more commits onto a dead branch — stash, branch fresh off `origin/main`, and reapply:

```
git stash push -u -m "<description>"
git checkout -b <new-branch> origin/main
git stash pop
```

If the working tree contains multiple unrelated fixes (e.g. an auth bug and a UI bug), split them into separate commits — one logical change per commit, staged with specific file paths, not `git add -A`.

## Commit messages

- No AI attribution. Never add `Co-Authored-By: Claude` or similar — this repo's owner explicitly doesn't want it.
- Match this repo's existing style: lowercase, `type: short description` (e.g. `fix: spotify token refresh + caching, toc active state, header alignment`, `chore: scope env ignore to .env*.local`, `refactor: post header hierarchy`). Check `git log --oneline -10` if unsure.
- Only create new commits; never amend unless asked.

## Pull requests

- Title: lowercase, short, matching commit style (e.g. `fix: admin auth cookie + preview popup jump`).
- Body via heredoc, structured as:
  - `## Summary` — 1–2 sentence bullets on what changed and why. No long AI-generated diff walkthroughs.
  - `## Test plan` — checklist of what was actually verified (tsc, lint, manual testing) and what wasn't (call out gaps honestly, e.g. "can't repro prod cookie path locally").
  - A `til:` line at the end — one short, concrete lesson about a concept the change touched (e.g. why a library API behaves the way it does, a subtle bug class, a platform quirk). This repo's owner reads PRs partly to learn, so this line is not optional filler — make it genuinely teach something.
- No emojis, no "Generated with Claude Code" footer.

## Example

```
gh pr create --title "fix: admin auth cookie + preview popup jump" --body "$(cat <<'EOF'
## Summary
- one bullet per logical change, plain and specific

## Test plan
- [x] npx tsc --noEmit
- [ ] manual: <what couldn't be verified and why>

til: <one concrete lesson from this change>
EOF
)"
```
