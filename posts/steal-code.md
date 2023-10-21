---
title: 'Stealing code'
tags: 'programming'
date: 'Oct 20, 2023'
---

> Good artists borrow, great artists steal. -- Pablo Picasso

With [codegen](https://stackoverflow.blog/2023/10/16/is-ai-enough-to-increase-your-productivity/) tools, it's easier than ever to [borrow code](https://stackoverflow.blog/2020/05/20/good-coders-borrow-great-coders-steal/).

I'm working on research with my professor where my task is to translate [R code](https://github.com/luisdamiano/ritas-pkg)[into Python](https://github.com/jarad/pyritas) for this [algorithm](https://arxiv.org/abs/2209.11313) that estimates yield from yield monitor data.

My process has been pasting snippets of the algorithm step by step, and prompting GPT 4 to generate high quality, pythonic code with documentation in the style of Google.

It worked well for the easy parts, but now I'm stuck on cropping the intersecting polygons.

With ChatGPT I've been taking a lot of mental shortcuts, and since I'm optimizing more on completing this project, rather than learning the ins and outs of geospatial python packages, I've been placing too much trust in ChatGPT.

After several unsuccessful attempts of hoping ChatGPT would correct itself, it seems like there's no way around it, it's time to go deep into the weeds of the package documentation.

ChatGPT has been great at documenting my code, and also writing some tests, but it's definitely not a replacement for geospatial code, especially since it's not that good at R in the first place, having it translate to Python might be too much to ask.

My takeaway from the article by StackOverflow is if you're cloning code (copy pasting without understanding), you're risking merely borrowing the code.

Borrowing code comes at a risk, there might be bugs or malicious intent baked into it.

Even the [most copied snippet from SO has a bug](https://programming.guide/worlds-most-copied-so-snippet.html).

On the other hand, stealing code means you know exactly what it does.

You understand it at the fundamental level, the quirks, all of it seamlessly integrate into your own code, turning into something original.

A good test is to see if you could write it again from memory, that's a sign of good theft.

So steal code.

Take it, understand it, and implement it in your projects.
