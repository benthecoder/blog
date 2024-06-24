---
title: 'semantic search @ elicit'
tags: 'AI'
date: 'Jun 24, 2024'
---

read this [article](https://blog.elicit.com/semantic-search/) by [elicit](https://elicit.com/) on how they're implementing SOTA semantic search specifically for research papers, bringing us on a journey from string matching and full-text search, to semantic search and agent-based search.

the problem of search exists in almost all applications.

before modern vector search, we did traditional [bag of words](https://github.com/rahulvasaikar/Bag-of-words) – take a set of documents to be retrieved (i.e. web pages on Google) and then transform each doc into a set (bag) of words and use this to populate a spare "frequency vector". popular algorithms are TF-IDF and BM25

these sparse vectors were popular in information retrieval because of efficiency, interpretability, and exact term matching

however, there are cases when we search for information, we rarely know the exact terms, we have the idea, not the words.

with dense embedding models, we can search based on "semantic meaning" rather than term matching.

the issue is you need vast amounts of data to fine-tune dense embedding models, without that, you lack the performance of sparse methods. and data is hard to find for niche domains with domain-specific terminology.

another issue is embedding models are non-deterministic, so the same query could produce different results.

these models are also black boxes, end users don't know how the results are ranked. even researchers can't give a great description as to how or why.

ex1: academics using search as part of systematic review or meta-analysis has to explain how they got the papers they included. they need to know that the results are comprehensive and they haven't missed any important papers.

ex2: web-style semantic search for a law use case, where judges search for a relevant case law. if the search leaves out important precedent, it could be disastrous.

one solution that makes the most of both world's is a merging of sparse and dense retrieval – using hybrid search and learnable sparse embeddings.

that technique is called [SPLADE](https://www.pinecone.io/learn/splade/) — the Sparse Lexical and Expansion model.

how it works: given a user query, it enriches it with synonymous or related terms, and instead of it being a manual process, use LLMs to suggest additional search terms.

they also included another technique: automated comprehensive search, where you use semantic search to sort papers by relevancy, and have LLMs read them in that order. as it does this, each paper becomes less and less relevant. model this curve and you can probabilistically guarantee you've found everything relevant.

more on search and evals

- [Evaluating Search: Measure It](https://dtunkelang.medium.com/evaluating-good-search-part-i-measure-it-5507b2dbf4f6)
- [Evaluating Search: Measuring Searcher Behavior](https://dtunkelang.medium.com/evaluating-search-measuring-searcher-behavior-5f8347619eb0)
- [Evaluating Search: Using Human Judgments](https://dtunkelang.medium.com/evaluating-search-using-human-judgement-fbb2eeba37d9)

---

Elicit seems like a cool place to [work](https://elicit.com/careers) at.

they recently released a blog post about [how to hire AI engineers](https://blog.elicit.com/how-to-hire-ai-engineers/)

they have good thoughts about [coding assistants in interviews](https://blog.elicit.com/coding-assistants-and-interviews/)

they ship a user-facing feature [every week](https://blog.elicit.com/launching-a-feature-every-week/)

they have a great [ML reading list](https://github.com/elicit/machine-learning-list?curius=2790)
