---
title: 'Shipping with LLMs'
tags: 'notes'
date: 'Jan 25, 2024'
---

Notes on [Application Development using Large Language Models](https://nips.cc/virtual/2023/tutorial/73948) from NeurIPS.

Text processing applications

- summarizing (summarize text for fast human browsing)
- inferring (classify text and extract keywords)
- transforming (translation)
- expanding (writing email)

Commonly built classes

- Retrieval augmentation generation (RAG)
- customer service chatbots

model limitations

- hallucination
- limited context length
- knowledge cutoff date
- reasoning on complex tasks

Prompting strategies

- #1 write clear and specific instructions
  - 1.1 give detailed context for the problem (clear != short)
    - include details in your query
    - instruct models to answer using a reference text
    - use delimiters
  - 1.2 specify the desired output format
    - ask model to adopt a persona
    - specify desired length of the output (words are not reliable)
    - ask output in specific structured format
    - provide examples
- #2 give model time to think
  - 1.1 guide model's reasoning with steps
    - specify steps required to complete a task
    -
- use external tools
