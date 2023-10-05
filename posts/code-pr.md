---
title: 'The Best PR title'
tags: 'programming'
date: 'Sep 28, 2023'
---

> The average professional engineer (more than 200 PRs a year) authors nearly 600 PRs a year (590) with a median time to review of 1.34 days.

[Graphite](https://graphite.dev/) sampled 2 million PRs, compared median time to first review, and found the scientifically perfect PR title.

```text
fix!: delete prod!! fast!!!
```

In summary, here is what they [recommended](https://graphite.dev/blog/the-best-pr-title-of-all-time) for writing a good PR title:

- Short
- Lowercase
- Categorized as “fix” (if appropriate)
- Include an exclamation point
- Clean (no swearing)

They believe PRs should only contain one commit, following the philosophy of [stacking](https://stacking.dev/) PRs.

There are projects dedicated to standardizing PR/commits such as [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/).

Linus Torvalds specifies “74 characters" in his contributor’s guide for [Subsurface](https://github.com/torvalds/subsurface-for-dirk/blob/a48494d2fbed58c751e9b7e8fbff88582f9b2d02/README#L99).
