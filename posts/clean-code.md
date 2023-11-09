---
title: 'Clean Code - Google'
tags: 'programming'
date: 'Nov 9, 2023'
---

When you read code and find it hard to understand, you're experiencing [cognitive load](https://en.wikipedia.org/wiki/Cognitive_load).

Cognitive Load = amount of mental effort to complete a task.

While reading code, you have to keep in mind information such as conditional logic, data structure state, loop indices, variable values, etc. And since people can typically hold only 5-7 pieces of information in their [short-term memory](https://en.wikipedia.org/wiki/Working_memory#Capacity), code that is more complex (involves more information) increases cognitive load.

Cognitive load is also higher for other people reading the code you wrote. This is why [code reviews](https://google.github.io/eng-practices/review/reviewer/looking-for.html#complexity) are needed, to check if the code causes too much cognitive load.

So, be kind to your coworkers and write clean code.

The key to reducing cognitive load is to make code simpler.

Here are some principles:

1. **Limit amount of code in a function or file**: [Keep functions small](https://martinfowler.com/bliki/FunctionLength.html) and limit each class to [single responsibility](https://en.wikipedia.org/wiki/Single-responsibility_principle).
2. **Create abstractions to hide implementation details**: functions and interfaces are [abstraction](https://www.cs.cornell.edu/courses/cs211/2006sp/Lectures/L08-Abstraction/08_abstraction.html) to hide complex details, but don't go overboard.
3. **Simplify control flow**: too many if statements or loops makes the [control flow](https://testing.googleblog.com/2023/10/simplify-your-control-flows.html) hard to understand, hide complex logic with helper functions. Reduce [nesting](https://testing.googleblog.com/2017/06/code-health-reduce-nesting-reduce.html) with early returns.
4. **Minimize mutable state**: [stateless](https://stackoverflow.com/a/844548) code is easier to understand, avoid mutable class fields, make types [immutable](https://en.wikipedia.org/wiki/Immutable_object)
5. **Include only relevant details in a test**: test can be [hard to follow](https://testing.googleblog.com/2023/10/include-only-relevant-details-in-tests.html) if it includes boilerplate test data that is irrelevant
6. **Don't overuse mocks in tests**: [improper use of mocks](https://testing.googleblog.com/2013/05/testing-on-toilet-dont-overuse-mocks.html) -> cluttered test with calls that expose implementation details

Here's a [printer friendly version](https://docs.google.com/document/d/1AgcBG2iOmzEWIKYs6hNDyTMZ-an0SOwmJZRsX898XD0/edit?pli=1).
