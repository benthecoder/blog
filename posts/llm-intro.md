---
title: 'Intro to LLMs'
tags: 'notes, AI'
date: 'Nov 27, 2023'
---

[Andrej Karpathy](https://karpathy.ai/), the GOAT who gifted us the [Neural Networks from Zero To Hero](https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ) videos, released a 1hr [Intro to LLMs](https://www.youtube.com/watch?v=zjkBMFhNj_g) video ([slides](https://drive.google.com/file/d/1pxx_ZI7O-Nwl7ZLNk5hI3WzAsTLwvNU7/view))

Below are my takeaways.

- LLMs are neutal networks with billions of parameters dispersed through them, we know how to iteratively adjust the parameters to make them better, but we don't know how they collaborate to do it
- training LLMs = lossy compression (100x compression ratio), there is [close relationship](https://mindfulmodeler.substack.com/p/the-intricate-link-between-compression) between compression and performance
- hallucinations: LLMs dreams, think of them as mostly inscrutable artifacts, develop correspondingly sophisticated evaluations
- how LLMs are build
  - 1\) pre-training for knowledge
    - get large amounts of text (~10 TB), and get expensive compute (~6000 GPUs)
    - compress text into neural network (pay ~$2m and wait ~12 days)
    - get a **base model**
  - 2\) fine-tuning for alignment
    - write labelling instructions
    - hire people (scale.ai) to collect 100k high quality ideal Q&A instructions or comparisons
    - finetune base model on this data (wait ~1 day)
    - obtain **assistant model**
    - run lots of evaluations
    - deploy
    - monitor, collect misbehaviours, go back to step 1
  - 3\) RLHF with comparisons data, train model on good/bad outputs
- scaling laws:
  - performance of LLMs is a smooth, well-behaved, predictable function of
    - N: no. of parameters in network
    - D: amount of text
  - expect a lot of "general capability" across all areas of knowledge
- system 2 thinking
  - LLMs currently only have system 1 fast thinking, just next word prediction
  - the goal is system 2, where they take time to think through a problem, providing more accurate answers
  - how? create tree of thought and reflect on question before answering
- self-improvement
  - what is equivalent of AlphaGO self-play for LLMs?
  - main challenge is the lack of reward criterion (language is a large space and not well defined)
- LLM OS
  - "LLMs is the kernel process of an emergent operating system"
  - RAM = working memory = context window
  - OS systems had closed and open source (llama2 vs gpt4)
- llm security
  - LLMs are vulnerable to jailbreaks, prompt injection, data poisoning

## Reading list

- **Transformers and Language Models**
  - [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
  - [Language Models are Unsupervised Multitask Learners (GPT-2)](https://d4mucfpksywv.cloudfront.net/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)
  - [Training Language Models to Follow Instructions (InstructGPT)](https://arxiv.org/abs/2203.02155)
  - [LLaMA-2](https://ai.meta.com/research/publications/llama-2-open-foundation-and-fine-tuned-chat-models)
- **Running Language Models Locally**
  - [Llama.cpp code](https://github.com/ggerganov/llama.cpp)
  - [Andrej’s code](https://github.com/karpathy/llama2.c/blob/master/run.c)
  - [Tutorial: How to run Llama-2 on CPU](https://blog.oxen.ai/how-to-run-llama-2-on-cpu-after-fine-tuning-with-lora/)
- **Reinforcement Learning and Optimization in LLMs**
  - [RLAIF: Scaling Reinforcement Learning from Human Feedback with AI Feedback](https://arxiv.org/abs/2309.00267)
  - [Direct Preference Optimization: Your Language Model is Secretly a Reward Model](https://arxiv.org/abs/2305.18290)
  - [Training Compute Optimal Language Models](https://arxiv.org/abs/2203.15556)
  - [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
  - [Sparks of Artificial General Intelligence: Early experiments with GPT-4](https://arxiv.org/abs/2303.12712)
- **System One vs System Two Thinking**
  - [Thinking Fast and Slow](https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow?useskin=vector)
  - [Mastering the game of Go with deep neural networks and tree search](https://www.nature.com/articles/nature16961)
  - [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903)
  - [Tree of Thoughts: Deliberate Problem Solving with Large Language Models](https://arxiv.org/abs/2305.10601)
  - [System 2 Attention (is something you might need too)](https://arxiv.org/abs/2311.11829)
- **LLM Operating System and Tool Use**
  - [Retrieval Augmented Generation (RAG)](https://arxiv.org/abs/2005.11401)
  - [Demonstrate-Search-Predict: Composing retrieval and language models for knowledge-intensive NLP](https://arxiv.org/abs/2212.14024)
  - [Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/abs/2302.04761)
  - [Large Language Models as Tool Makers](https://arxiv.org/abs/2305.17126)
  - [ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs](https://arxiv.org/abs/2307.16789)
- **Multimodal Interaction and Peripheral Device I/O**
  - [An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929)
  - [CLIP - Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020)
  - [ULIP: Learning a Unified Representation of Language, Images, and Point Clouds for 3D Understanding](https://arxiv.org/abs/2212.05171)
  - [NExT-GPT: Any-to-any multimodal large language models](https://next-gpt.github.io/)
  - [LLaVA - Visual Instruction Tuning](https://arxiv.org/abs/2304.08485)
  - [LaVIN - Cheap and Quick: Efficient Vision-Language Instruction Tuning for Large Language Models](https://arxiv.org/abs/2305.15023)
  - [CoCa: Contrastive Captioners are Image-Text Foundation Models](https://arxiv.org/abs/2205.01917)
  - [Emu Video: Factorizing Text-to-Video Generation by Explicit Image Conditioning](https://arxiv.org/abs/2311.10709)
- **Security and Ethical Challenges in LLMs**
  - [Jailbroken: How Does LLM Safety Training Fail?](https://arxiv.org/abs/2307.02483)
  - [Universal and Transferable Adversarial Attacks on Aligned Language Models](https://arxiv.org/abs/2307.15043)
  - [Visual Adversarial Examples Jailbreak Aligned Large Language Models](https://arxiv.org/abs/2306.13213)
  - [Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173)
  - [Hacking Google Bard - From Prompt Injection to Data Exfiltration](https://embracethered.com/blog/posts/2023/google-bard-data-exfiltration/)
  - [Poisoning Language Models During Instruction Tuning](https://arxiv.org/abs/2305.00944)
  - [Poisoning Web-Scale Training Datasets is Practical](https://arxiv.org/abs/2302.10149)
