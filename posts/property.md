---
title: '@property in Python'
tags: 'python, programming'
date: 'May 16, 2023'
---

Learning to write more Pythonic code is one of my goals.

Today we're learning about the `@property` decorator from this excellent [blog post](https://mathspp.com/blog/pydonts/properties#what-is-the-error-message-%E2%80%9Cproperty-of-object-has-no-setter%E2%80%9D).

## What is a property?

> property is the Pythonic interface for adding dynamic behaviour to your interactions with attributes in classes.

Knowing the what isn't very helpful without any context, let's answer the why.

## Why properties?

Let's say you create a Person class, and you want an attribute that returns the first and last name.

```py
class Person:
    def __init__(self, first, last):
        self.first = first
        self.last = last
        self.name = f"{self.first} {self.last}"

john = Person("John", "Doe")
john.name # 'John Doe'
```

Everything might look fine, but there's an issue here.

```py
john.last = "Smith"
john.name # 'John Doe'
```

Changing the `last` attribute did not update our `name` attribute, they're out of sync.

You could decide to create two methods: `set_first` and `set_last`, and update them that way, but it's not very Pythonic.

Another alternative, is a method that computes the name attribute on demand.

```py
class Person:
    def __init__(self, first, last):
        self.first = first
        self.last = last

    def get_name(self):
        return f"{self.first} {self.last}"

john = Person("John", "Doe")
john.get_name() # 'John Doe'
john.first = "Charles"
john.get_name() # 'Charles Doe'
```

But there's an elegant solution, a pythonic way of writing name as an attribute itself.

That's properties!

```py
class Person:
    def __init__(self, first, last):
        self.first = first
        self.last = last

    @property
    def name(self):
        return f"{self.first} {self.last}"

john = Person("John", "Doe")
john.name # 'John Doe'
john.last = "Smith"
john.name # 'John Smith'
```

The main use case of property is when you have an attribute that depends dynamically on something else.

In our previous example, we had name depend on two attributes.

in the `pathlib` module, you'll see @property in action as well

```py
# datetime.py, Python 3.11
class PurePath(object):
    # ...

    @property
    def name(self):
        """The final path component, if any."""
        parts = self._parts
        if len(parts) == (1 if (self._drv or self._root) else 0):
            return ''
        return parts[-1]

from pathlib import PurePath
p = PurePath("~/Documents/readme.md")
p.name # 'readme.md'
```

## When to use property?

- the value can be computed **fast**
- the value is a piece of data intrinsically **associated** with the instance we are talking about
- the value is a **simple** piece of data. (not common to see a property that returns complex data structures)

There's more to properties, you can make attributes read only by adding an underscore in front of variables to hide them, and create properties for them.

There's also property setters and deleters, which let's you directly assign attributes and to clean up other attributes that are auxiliary to the main property attribute.

Also @property apparently isn't a decorator, but a [descriptor](https://tushar.lol/post/descriptors/), which lets you customize the behavior getter/setter/deleter methods.

That's all for today.
