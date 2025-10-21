---
title: 'Git Best Practice'
tags: 'programming, coding'
date: 'Nov 13, 2023'
---

In my past 2 years of programming with Python and React in various little hackathon projects and side projects like this blog, I've never really worked much with pull requests or creating branches. I've just been pushing to the main branch.

I'm now working on a hackathon and would like to practice creating branches, writing [good commit messages](https://bneo.xyz/posts/code-pr), merging branches, etc.

I found this [Git Style Guide](https://github.com/agis/git-style-guide?tab=readme-ov-file#messages) inspired by inspired by [How to Get Your Change Into the Linux Kernel](https://kernel.org/doc/html/latest/process/submitting-patches.html), and the [git man pages](http://git-scm.com/doc)

### Branches

- use lower case in [branch names](https://tilburgsciencehub.com/building-blocks/collaborate-and-share-your-work/use-github/naming-git-branches/), use hyphens to separate words
- choose short descriptive names like "oauth-migration", not "login_fix" (too vague)
- use identifiers from tickets like `git checkout -b issue-15`
- delete branch from upstream repo after merging, unless there's good reason not to
- use `git branch --merged | grep -v "\*"` to list merged branches.
- [more tips](https://gist.github.com/digitaljhelms/4287848)

### Commits

- when writing, **think about what you would need to know in a year from now** when running across the commit
- each commit should be a single _logical_ change, ex: if a patch fixes a bug and optimize performance, split into two
- use `git add -p` to interactively stage specific portions of files
- don't split a single _logical_ change into several commits (features + tests should be one)
- <mark>commit early and often</mark> : small, self-contained commits are easier to understand and easy to revert
- commits should be **ordered logically**, if commit X depends on Y, Y should come before X.
- [squash](https://www.git-tower.com/learn/git/faq/git-squash) commits using `--squash` and `-fixup`

### Messages

- summary line should be descriptive yet succinct, no longer than 50 chars
- should not end with a period
- after that comes a blank line and a more thorough description (72 chars) explaining **why** the change was needed, **how** it addresses the issue, and **what side-effects** it might have
- it should also provide pointers to related resources (link to issue in bug tracker)
- if commit A depends on B, state in message of A, and use SHA1 to refer to commits

```txt
Short (50 chars or fewer) summary of changes

More detailed explanatory text, if necessary. Wrap it to
72 characters. In some contexts, the first
line is treated as the subject of an email and the rest of
the text as the body.  The blank line separating the
summary from the body is critical (unless you omit the body
entirely); tools like rebase can get confused if you run
the two together.

Further paragraphs come after blank lines.

- Bullet points are okay, too

- Use a hyphen or an asterisk for the bullet,
  followed by a single space, with blank lines in
  between

The pointers to your related resources can serve as a footer
for your commit message. Here is an example that is referencing
issues in a bug tracker:

Resolves: #56, #78
See also: #12, #34

Source: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
```

### Merging

- **Do not rewrite published history**
- keep history clean and simple, before merging
  - make sure it conforms to style guide, perform actions if it doesn't (squash/reorder, reword messages)
  - rebase onto branch, so it can be applied directly to end of "main" branch and result in a simple history (suited for projects with short-running branches)
- If your branch includes more than one commit, do not merge with a [fast-forward](https://stackoverflow.com/a/29673993):
  - `git merge --no-ff my-branch`

### Extras

Some maintenance tasks git commands

- [git gc](https://git-scm.com/docs/git-gc)
- [git prune](https://git-scm.com/docs/git-prune)
- [git fsck](https://git-scm.com/docs/git-fsck)

### More Git stuff

Some articles by [Julia Evans](https://jvns.ca/)

- [Confusing git terminology](https://jvns.ca/blog/2023/11/01/confusing-git-terminology/)
- [Some miscellaneous git facts](https://jvns.ca/blog/2023/10/20/some-miscellaneous-git-facts/)
- [In a git repository, where do your files live?](https://jvns.ca/blog/2023/09/14/in-a-git-repository--where-do-your-files-live-/)
- [git rebase: what can go wrong?](https://jvns.ca/blog/2023/11/06/rebasing-what-can-go-wrong-/)
- [How git cherry-pick and revert use 3-way merge](https://jvns.ca/blog/2023/11/10/how-cherry-pick-and-revert-work/)
