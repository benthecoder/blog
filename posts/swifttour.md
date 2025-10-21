---
title: 'A Swift Tour'
tags: 'programming, notes, learning'
date: 'Jan 5, 2024'
---

Some notes & questions from reading [A Swift Tour](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/guidedtour/).

- **values**
  - `let` for constants, `var` for variables
  - `\(var)` for string variables (kinda weird)
- **control flow**
  - parentheses around conditions optional, braces around body (like JS)
  - write `if` or `switch` after `=` (inline conditional)
  - optionals:
    - `?` after value to mark value as **optional**
    - `if let` to create optional variables
    - `??` to use default value if optional value is missing
  - `_` can be used like in Python for unnamed vars
  - tuples like Python
  - switch case supports any kind of data
  - `..<` to make range of index
    - ex: `0..<4` is 0 to 3, and `0...<4` includes 4
- `func`
  - functions are first-class types, it can return another function as its value and cane take a function as an argument
  - **closures**
    - functions are a special case of closures: blocks of code that can be called later
    - code in closure can access to variables and functions available in scope where closure was created, even if in a different scope when executed
- `class`
  - declare methods and functions within class
    - dot syntax to access properties and methods
    - init to create initializer
    - `deinit` for cleanup before object is deallocated
  - subclasses
    - `super.init` to access superclass init
    - `override func myFunc()` to override superclass implementation
  - `get` and `set`
    - set explicit name like this `set(newVal)` or `newValue` is the implicit name
  - `willSet` and `didSet`
    - run code before and after setting new values
  - optional values: write `?` before operations like methods, properties, and subscripting
- `enum`
  - Like classes and all other named types, enumerations can have methods associated with them
  - case values are actual values
  - raw values start at 0 and increment by one each time
  - use abbreviated forms (`.value`) anytime the value's type is already known
- `struct`
  - ex: initializers are enums, and can initialize with abbreviated form
  - always copied when they’re passed around in your code, but classes are passed by reference.
- `async await`
  - how to use
    - `async` to mark function that runs asynchronously
    - call with `await`
    - use `async let` to call async function and let it run parallel with other async code
  - Tasks
    - use `Task` to call async func from sync code, without waiting for them to return
    - use `withTaskGroup` to structure concurrent code
  - **actors**
    - similar to classes, but they ensure that different asynchronous functions can safely interact with an instance of the same actor at the same time.
    - use `await` keyword when calling a method on an actor or accessing one of its properties
- `protocol`
  - Classes, enumerations, and structures can all adopt protocols.
  - use `mutating func` in `struct` when writing methods that modifies structure
  - classes don't require marking as mutating because methods can always modify the class.
  - `extension`
    - add functionality to an existing type, such as new methods and computed properties
    - ex: add methods and props like this to Int type `7.simpleDescription` or `7.adjust()`
  - can be used like a named type
    - ex: objects of different types all conform to a single protocol
    - when type is a **boxed protocol type**, methods outside protocol definitions aren't available
    - ensures no accidental access of methods or properties the class implements in addition to its protocol conformance
- error handling
  - `throw` to throw error
  - `throws` to mark a function that can throw errors
  - ways to handle
    - `do-catch`:
      - in `do`, write `try` in front of code
      - in `catch`, errors are given name `error` by default
    - multiple catch blocks
      - handle specific errors
      - name errors like `catch let printerError as PrinterError` (`PrinterError` is enum which adopts `Error` protocol)
    - optionals
      - `try?`: if function throws error, specific error is discarded and result is nill, else result is optional containing the value returned by function
    - `defer`
      - block of code that is executed after all other code, just before function return
      - executed regardless of error or not
      - can write setup code and cleanup code next to each other
- generics: `<myGeneric>`
  - there are generic forms of func and methods, as well as class, enum, and structs.
  - use `where` to specify list of requirements
    - require type to implement a protocol, require to types to be equivalent, to require a class to have a particular superclass, etc.

thoughts

- unwrapping values
  - feel like this will be used a lot in ios dev, I use this a lot in react
- closures
  - ({}) to write closers
- custom argument labels in functions
- raw values
  - another name for default values in an enum?
- structs
  - why is this important? "structures are always copied when they’re passed around in your code, but classes are passed by reference."
- concurrency
  - what does calling async functions from sync code mean?
- task groups
  - is task group basically a grouper for async?
- is actor basically classes but with async features
- is it common to extend types?
- how often is protocol used? seems like it's a way to enforce some properties of a class
- is generic a type of types?

After thought:

This was my first time reading through the docs of a new programming language, coming from R initially from Coursera, and Python with textbooks and hackathons, and hacking with Typescript for React and Next.js for side projects, I discovered I have a lot of gaps in programming knowledge. I've never used struct and protocols, and a lot of other concepts were foreign to me. It feels like I'm actually learning how to program for real.

It can only go up from here. I'm glad I have GPT 4 to help me understand these concepts better.
