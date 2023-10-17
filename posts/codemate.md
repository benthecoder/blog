---
title: 'Codemate'
tags: 'work, programming'
date: 'Oct 16, 2023'
---

On how to be a good codemate by [Brian Lee](https://www.moderndescartes.com/essays/codemates/).

Some takeaways/interesting points:

- It has everything to do with settings expectations on how you communicate and collaborate within a shared codebase, not your coding ability or quality
- tell your teammates how to **test your workflow**, hook the script (unit test, integration test, or bash script) into CI so your codemates can't accidentally break you, [tests](https://abseil.io/resources/swe-book/html/ch11.html#the_beyonceacutesemicolon_rule) are the only scalable way to inform your team on how to not break your code.
- changes requiring manual steps need to be **announced publicly**, ex: updated dependency, changes in AWS account permissions. The pro move is to use tools that transparently and automatically install and use currently checked-in configs
- effort in writing actual code is in equal parts of packaging code that satisfies all automated linters, test coverage requirements, links to tickets, and other blocking requirements
- adopt mindset of investing in formatters that automatically fix formatting issues, than linters that nag you about issues
- One common toe-stepping maneuver is refactoring - renaming modules, moving functions/classes around. Merge conflicts are inevitable
- Refactoring benefits: compress mental map needed to understand how the codebase works.
- Refactoring cost: people need to relearn their mental map, a needless refactor is like sorting a bookshelf by color - unnecessary and productivity killer
- Two rules for refactoring: (1) **Don't Refactor**, get formatting and naming right the [first time](https://www.moderndescartes.com/essays/noutils/), (2) **don't mix refactors with feature changes**, refactoring changes are 10-100x easier to review than normal feature-adding changes. Look at [Google monorepo](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext#FNF) for managing refactors at larger scale
- flake tests build up in CI, causing it to rerun multiple time before passing, CI runtime only increase, and eventually people stop trusting CI. senior eng become reviewing bottlenecks.
- Adopt "leap of faith" strategy and pretend CI can be trusted, and figure out tests that can catch your mistakes, and add it. The cost of breaking main branch is equally expensive to suffer through worry-laden code review process.
- Have a quick rollback procedure to mitigate accidental breakage.
- The ultimate solution is to embrace [Conway's law](https://en.wikipedia.org/wiki/Conway%27s_law), shard codebase along organizational lines, reduce O(n^2) cost of coordinating people's work
