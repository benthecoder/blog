---
title: '10 LLM Challenges'
tags: 'AI, tech'
date: 'Jul 3, 2023'
---

[Challenges](https://www.youtube.com/watch?v=spamOhG7BOA) of building LLM applications for production by [Chip Huyen](https://huyenchip.com/)

1. **Inconsistency**
   - how to ensure user experience consistency?
     - same input -> different outputs
     - small input changes -> big output changes (temperature = 0 won't fix it)
   - how to ensure downstream apps can run without breaking?
     - no output schema guarantee
2. **Hallucination**
   - poor performance on task that require factuality
     - [bad](https://bird-bench.github.io/) text2sql performance
   - why?
     - Deepmind says lack understanding of cause and effect.
     - OpenAI says it's how we're annotating data in [RLHF](https://huyenchip.com/2023/05/02/rlhf.html) helps
3. **Compliance + privacy**
   - buy: are APIs compliant?
   - build: what if your in-house chatbot leaks sensitive info?
4. **Context length**
   - use cases: document processing, summarization, narrative, tasks involving genes and proteins
   - [16.9%](https://arxiv.org/abs/2109.06157) of [NQ-Open](https://huggingface.co/datasets/nq_open) tasks have context-dependent answers (SituatedQA)
5. **Data drift**
   - even when provided new data, existing models trained on past data fails to generalize to answer questions asked in the present ([SituatedQA](https://arxiv.org/abs/2109.06157))
6. **Forward & Backward compatibility**
   - same model, new data
   - how to make sure prompts still work with newer models?
7. **LLM on the edge**
   - healthcare devices, autonomous vehicles, drive-thru voice bots, personal AI assistant trained on personal data
   - on device inference
   - training
     - on-device training: bottlenecked by compute + memory + tech available
     - if trained on server:
       - how to incorporate device's data?
       - how to send model's updates to device?
   - choose a model size
     - 7B param model (depending on sparsity)
       - $100 to fine tune
       - $25,000 to train from scratch
8. **LLM for non-english languages**
   - performance:
   - tokenization (latency & cost [differs](https://blog.yenniejun.com/p/all-languages-are-not-created-tokenized) with language)
9. **Efficiency of Chat as an interface**
   - chat is not efficient but very robust
10. **Data bottleneck**
    - rate of training dataset size growth is much faster rate of new data being generated
    - internet is being rapidly populated with AI-generated text

More on Chip Huyen's article: [Building LLM applications for production](https://huyenchip.com/2023/04/11/llm-engineering.html#part_3_promising_use_cases) and in this [video](https://www.youtube.com/playlist?list=PL3vkEKxWd-us5YvvuvYkjP_QGlgUq3tpA) [series](https://www.youtube.com/playlist?list=PL3vkEKxWd-uupBSWL-DbVJuCMqXO9Z3Z4).
