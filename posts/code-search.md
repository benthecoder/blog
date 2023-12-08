---
title: 'How GitHub code search works'
tags: 'tech'
date: 'Aug 24, 2023'
---

GitHub [built](https://github.blog/2023-02-06-the-technology-behind-githubs-new-code-search/?utm_source=theblueprint&curius=1433) a [code search engine](https://github.com/search?type=code&auto_enroll=true) from scratch in rust, called Blackbird.

Why not use an open source solution?

Because general text search products aren't great for _code_ search.

The UX is poor, indexing is slow, and it's expensive to host.

Here were the three main motivations:

1. A new UX for asking questions of code, and get answers through iteratively searching, browsing, navigating, and reading code
2. Code is already designed to be understood by machines, so we should take advantage of that structure. It also has unique requirements; we want to search for punctuation, no stemming, keep stop words, and search with regex.
3. Github scale is a unique challenge. Deploying on elasticsearch took months to index (8 mil repos). Today there are 200m. It's not static, and it's constantly changing. Right now, you can search **45 mil repos**, representing **115 TB of code** and **15.5b documents**.

## just use grep

In programming, always start with what the naive approach; in this case, it's grep.

Let's do a little napkin math.

On a machine with 8 core intel CPU, [ripgrep](https://github.com/BurntSushi/ripgrep) can run an exhaustive regex query on a 13GB file cached in memory in 2.76 seconds.

This isn't going to work with the amount of data they have.

Code search runs on 64 core, 32 machine clusters.

Even if they put 115 TB of code in memory, assuming perfect parallelization of work, they're going to saturate 2,048 CPU cores for 96 seconds to serve a single query.

And only that one query can run. This comes up to 0.01 queries per second (QPS).

There's no cost-effective way to scale this approach to all of Github's code.

We need to build an index.

## Search index primer

To speed up queries, we need to pre-compute a bunch of information in the form of indices.

There are two indexing techniques: **forward and inverted index**.

A [forward index](https://en.wikipedia.org/wiki/Search_engine_indexing#The_forward_index) stores a list of words for each document.

An [inverted index](https://en.wikipedia.org/wiki/Inverted_index) would be the opposite, mapping content to a set of documents that contain them.

For code search, they built a special type of inverted index called [n-gram](https://en.wikipedia.org/wiki/N-gram) index, useful for looking up substrings of content.

To perform a search, they intersect the results of multiple lookups to give the list of documents where the string appears. With a trigram index, there's four lookups for the query "limits" : `lim`, `imi`, `mit`, and `its`.

Unlike a hashmap, these indices are too big to fit into memory.

We build **iterators** to lazily return sorted document IDs (based on ranking of each document) and we intersect and union the iterators and read far enough to fetch the requested number of results. This way they never have to keep the entire entire posting list.

## Indexing 45 million repos

we have the technique, now to to figure out how to built the index efficiently.

we need to figure out some insights into the data we have which guides our approach.

we know two things: Git's use of [content addressable hashing](https://en.wikipedia.org/wiki/Content-addressable_storage?useskin=vector) and that there's a lot of duplicate content on GitHub.

This leads us to two decisions:

1. Shard by Git [blob](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) object ID.
   - nice way to evenly distributed docs between shards while avoiding duplication.
   - scale no. of shards as necessary
2. Model index as tree
   - use delta encoding to reduce amount of crawling and to optimize metadata
   - metadata = list of locations for documents (path, branch, repo) and info about the objects (repo name, owner, visibility)

## building the index

To ingest all the repositories for the first time, one key property is we **optimize the order** which we do the initial ingest to **make the most of delta encoding**.

We do this by using a novel probabilistic data structure representing repository similarity and by driving ingest order from a level order traversal of a MST of a graph of repository similarity.

Using this order, each repo is crawled by diffing it against its parent in the delta tree. This means we only need to crawl blobs unique to that repo, not the entire repo.

Here's the process.

1. Kafka provides events (`git push`) that tells us to index something.
2. A bunch of crawlers interact with Git and a service to extract symbols from code.
3. Kafka is used again to allow each shard to consume documents for indexing.
4. The data is partitioned between shards. Each shard consumes a single Kafka partition in the topic.
   - **Indexing is decoupled from crawling** through the use of Kafka and the **ordering** of messages in Kafka is how we gain **query consistency**.
5. Indexer shards take the documents and build the indices
   - tokenizing to construct n-gram indices (for content, symbols) and other useful indices (languages, owners, etc) before serializing and flushing to disk when enough work as accumulated.
6. Finally the shards run compaction to collapse up smaller indices to larger onces that are more efficient to query.
   - Compaction also k-merges the posting list by score so relevant documents have lower IDs and will be returned first by lazy iterators.

During initial ingest, we delay compact and do one big run at the end, but then as index keeps up with incremental changes, compaction is run on shorter intervals to handle things like document deletion.

## Life of a query

Redis is used to **manage quotas** and **cache some access control data**.

1. front end accepts user query and passes it to query service
2. service parses query into abstract syntax tree and rewrites it
   - resolves languages to canonical [Linguist](https://github.com/github-linguist/linguist) language ID (determine what langauge it is)
   - tags extra clauses for permissions and scopes
3. Fan out and send n concurrent request
   - query must be sent to each shard in search cluster due to sharding strategy
4. Conversion of query to lookup information in indices
   - regex gets translated into a series of substring queries on ngram indices
   - [trigrams](https://swtch.com/~rsc/regexp/regexp4.html) are sweet spot in design space, but causes problems at scale. GitHub uses "sparse grams", a dynamic gram size.
5. Iterators from each clause are run (and = intersect; or = union)
   - returns a list of documents
   - double check each document before scoring, sorting, and returning requested number of results
6. Aggregate results from all shards
   - resort by score, filter, return top 100
7. Github.com front-end does syntax highlighting, term highlighting, pagination.

```ruby
and(
  owners_iter("rails"),
  languages_iter(326),
  or(
    and(
      content_grams_iter("arg"),
      content_grams_iter("rgu"),
      content_grams_iter("gum"),
      or(
        and(
         content_grams_iter("ume"),
         content_grams_iter("ment")
        )
        content_grams_iter("uments"),
      )
    ),
    or(paths_grams_iter…)
    or(symbols_grams_iter…)
  ),
  …
)
```

## Summary

This is the entire system.

The ingest pipeline can publish 120k docs/s, so working through 15.5b should take 36 hours.

Delta indexing reduces no of documents we have to crawl by 50%, allowing us to re-index entire corpus in 18 hours.

We started with 115 TB of content to search, deduplication and delta indexing brings that down to 28 TB of unique content. The index itself clocks in at 25 TB, which includes all the indices, and a compressed copy of all unique content.

## Concept review

- forward and inverted index: indices for for full-text search
- [content addressable hashing](https://en.wikipedia.org/wiki/Content-addressable_storage?useskin=vector): fetching something based on content.
- [sharding](https://planetscale.com/blog/how-does-database-sharding-work): splitting large data across multiple clusters to scale horizontally
- git [blob](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects): blob (binary large object), named by a SHA-1 hashing of size and contents of file.
- [delta encoding](https://en.wikipedia.org/wiki/Delta_encoding?useskin=vector): storing data in form of deltas, storing only the differences
- [minimum spanning tree](https://en.wikipedia.org/wiki/Minimum_spanning_tree?useskin=vector): a subset of edges of a connected, edge-weighted, undirected graph that connects all vertices together **without cycles** and with **minimum possible total edge weight**.
- [k-merges](https://en.wikipedia.org/wiki/K-way_merge_algorithm?useskin=vector): merging k sorted arrays to produce a single sorted
- compaction: collapse smaller indices to larger ones
- [bitmask](https://stackoverflow.com/questions/10493411/what-is-bit-masking): data used for bitwise operation
- Probabilistic data structures: [MinHash](https://en.wikipedia.org/wiki/MinHash?useskin=vector) and [HyperLogLog](https://en.wikipedia.org/wiki/HyperLogLog?useskin=vector)
- Serializing: convert object state to byte stream
- Flushing: sync temporary state of data with permanent state.
- abstract syntax tree: tree-like data structure that represents the structure of source code in a programming language
