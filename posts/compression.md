---
title: 'Compression'
tags: 'data, intelligence'
date: 'Oct 1, 2023'
---

I came across this [prize](http://prize.hutter1.net/index.htm) for compressing human knowledge.

The challenge is to compress the 1GB file enwik9 to less than the current record of about 114MB

This contest is motivated by the fact that "**being able to compress well is closely related to intelligence**"

And to encourage the development of intelligent compressors/programs as a path to AGI.

Why use wikipedia? Wikipedia is an extensive snapshot of human knowledge. And if you can compress the first 1GB of Wikipedia better than your predecessors, your (de)compressor likely has to be smarter.

This [FAQ](http://prize.hutter1.net/hfaq.htm#start) page goes a lot into what compression is, why you need AI to solve it, lossless compression, etc.

I liked this snippet about what are good compressors for:

- storage
- transmission
- prediction
- understanding
- induction
- intelligence

Some resources for getting started with compression.

- Read [Data Compression Explained](https://mattmahoney.net/dc/dce.html)
- If too dense, read C1-6 of [Handbook of Data Compression](https://link.springer.com/book/10.1007/978-1-84882-903-9)
- Understand [current SOTA](https://www.db-thueringen.de/receive/dbt_mods_00027239) such as [PAQ](https://en.wikipedia.org/wiki/PAQ)
- Information theory, ML, probability and statistics since most modern compression algos are based on [arithmetic coding](https://en.wikipedia.org/wiki/Arithmetic_coding) based on estimated probabilistic predictions
- start by implement simple compression like [Run-length encoding](https://en.wikipedia.org/wiki/Run-length_encoding) and [LZ77 and LZ78](https://en.wikipedia.org/wiki/LZ77_and_LZ78)
- Move on to [Context tree weighting](https://en.wikipedia.org/wiki/Context_tree_weighting)
- Look at past winners ([2023](https://github.com/saurabhk/fast-cmix/) and [2021](https://github.com/amargaritov/starlit)), and this page of [Data Compression Programs](https://mattmahoney.net/dc/)
