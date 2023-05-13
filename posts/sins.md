---
title: '7 Deadly Sins of Programming'
tags: 'programming'
date: 'May 12, 2023'
---

> Any fool can write code that a computer can understand. Good programmers write code that humans can understand - Martin Fowler

Some notes on this [video](https://www.youtube.com/watch?v=q1qKv5TBaOA) on essential coding topics to help me become a better programmer.

## #1 Not using programming standards

There are [conventions](https://en.wikipedia.org/wiki/Coding_conventions) to follow in writing code such as whitespacing, file structure, and naming to make code consistent and readable.

It's especially important when working with other people, as it allows everyone to rely on shared expectations.

Not keeping standards is like switching fonts all the time, you can still read it but the differences can throw people off.

## #2 Not learning programming principles

Programming [principles](https://en.wikipedia.org/wiki/Category:Programming_principles) guide you into becoming a better programmer. They're like raw philosophies of code.

[SOLID](https://en.wikipedia.org/wiki/SOLID) is an acronym for five design principles intended to make OOP more maintainable.

- **S**ingle Responsibility Principle
  - aim to break code down into modules of one responsibility each, it's more code, but you can test it more cleanly and use parts of it elsewhere
- **O**pen/Closed Principle
  - design modules to be able to add new functionality in the future without making changes to them, extending but never modify directly
- **L**iskov Substitution Principle
  - only extend modules when it's still the same type at heart, if not, create its own type
- **I**nterface Segregation Principle
  - modules shouldn't need to know about functionality they don't use, split modules into smaller abstractions like interfaces, is useful when testing as it allows us to mock out only the functionality that each module needs
- **D**ependency Inversion Principle
  - code should communicate with each other abstractly through interfaces, allows for swapping parts of code

Combining these principles ends up decoupling your code, which gives you modules that are independent of each other, making code maintainable, reusable, scalable and testable.

## #3 Not using programming design patterns

[Design patterns](https://en.wikipedia.org/wiki/Design_Patterns) give real solution to code problems, but they aren't fixed implementations.

They're used to architect software solutions, matching the right shapes to fit the needs our software has.

THere are [three](https://en.wikipedia.org/wiki/Design_Patterns#Patterns_by_type) main types

1. Creational patterns - make and control new object instances i.e. factory pattern
2. Structural patterns - how we organize and manipulate objects i.e. adapter pattern
3. Behavioral Patterns - how code functions and how it communicates with other parts of the code, i.e. observer pattern.

These patterns are used in big corporations, and creates a universal vocabulary of programming.

## #4 Bad naming

Bad variable naming makes code hard to interpret.

Here are some fixes

1. Avoid encoding - remove type information in variable
2. Expand abbreviation - expand to full name to avoid miscommunication
3. Use clear distinction - use names that more accurately represent nuances in code
4. Replace "magic" values - define as named constants, clarifies significance and keeps things in sync if used elsewhere
5. Be descriptive with names - find balance between clear enough without being verbose

## #5 Not testing code

Writing test can be difficult when code is not properly architected.

At the high level, there's end-to-end testing, which lets you test code as the end user.

Any spaghetti code can be e2e tested since it doesn't really touch the code, but only what it delivers. It's also more tricky to setup since it requires a fully functional application running.

At the lower-level are unit tests that verify the operations of modules in isolation, and integration test that examines how modules interact with each other.

Applying SOLID principles makes testing easier.

## #6 Bad time management

Time estimation is hard.

Rule of thumb is to 2x or 3x initial time estimate for a task.

Account for unknown problems along the way.

Remember that creation goes hand-in-hand in problems.

It's better to overestimate schedule than underestimate it.

## #7 Rushing

Things can feel great when blazing through projects, there's a place for that in prototypes.

But if this is a long-term project, take your time and think things through from day-one.

It can give a better foundation to work from and avoid code debt.

Overtime, you'll be saving time from batting decisions with no easy fix because of poor architecture.
