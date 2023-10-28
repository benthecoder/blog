---
title: '6 senior SWE skills'
tags: 'programming'
date: 'Oct 27, 2023'
---

Six [skills](https://levelupsoftwareengineering.substack.com/p/6-skills-required-to-be-a-senior) one should develop to grow into senior+ SWE positions.

1. [Data modelling](https://medium.com/@seckindinc/data-modeling-fundamentals-dba245b7dc9f)
   - **entity**: a concept or object in real world that can be uniquely identified (ex: person, place), represented by a table in db
   - **attribute**: characteristics of entity (ex: name, age), represented by a column in db
   - **relationship**: how entities are related to each other (ex: person has a name), can be 1-1, 1-many, many-many.
2. Events, Message Queues, and Workers
   - distributed systems that process work in real time (APIs) and asynchronously (queues + workers)
   - one key piece of asynchronous systems is [message queues](https://medium.com/must-know-computer-science/system-design-message-queues-245612428a22), which are used to:
     - rate limit processing of events
     - communicate between microservices
     - shard load of specific types of events to be processed at different rates
     - batch process a bunch of events
   - ex: instead of one mega server handing all tasks, throw them on a queue, have worker pods scale and pick them up, and send them asynchronously
   - also used for [interservice communication](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/interservice-communication)
3. Autoscaling infrastructure
   - for monoliths: setup autoscaling ec2
   - for microservices: implement horizontal pod autoscaling in k8s
   - db: amazon aurora spins up new replicas based on increase load
4. Cloud Technologies
   - can't avoid learning, need real-world experience solving business scaling problems
   - ex in AWS
     - SNS, SQS : message queues
     - S3 : storage
     - kafka, kinesis: event streaming
     - EC2: monoliths
5. Caching
   - caching allows system to handle more load, respond faster, without scaling up
   - read engineering blogs and system design to understand where/when to apply caching, instead of just saying "throw redis at it"
   - types of caching:
     - site cache: serve content quickly to return users
     - application/output cache: server level HTML caching
     - distributed data cache: redis, memcached
     - file caching: CDN for static files
6. Concurrency / Idempotency
   - [idempotency](https://stripe.com/blog/idempotency) = ability to execute same operation multiple times without changing the result beyond the initial application
     - ex: customer submitting same order multiple times (because of bugs) -> only one order is created
     - how? send an [idempotency key](https://brandur.org/idempotency-keys) via api request, where it could be a hashed key of the forms data
