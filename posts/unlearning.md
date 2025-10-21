---
title: 'Machine Unlearning'
tags: 'ML, AI'
date: 'Jul 10, 2023'
---

With the progress of deep learning, there is now widespread use of AI technologies.

With that, comes with the propagation and amplification of biases and breach of user privacy.

What if we could somehow make AI models "forget" the data it was trained on?

[_Machine Unlearning_](https://ai.googleblog.com/2023/06/announcing-first-machine-unlearning.html) is a subfield of ML that aims to remove the influence of specific subset of training examples (forget set) from a trained model.

The ideal unlearning algorithm would (1) **remove the influence** while (2) **maintaining accuracy** on the rest of training set and **generalization** to held-out examples.

The naive way is to retrain the model on a new dataset that excludes the samples from the forget set, but this can be computationally expensive.

The ideal algorithm will use the pre-trained model as a starting point, and **efficiently make adjustments** to remove the influence of the forget set.

### Applications

MU goes beyond protecting user privacy. It can:

1. erase inaccurate/outdated information (due to errors in labelling or changes in environment)
2. remove harmful, manipulated, or outlier data

It's also related to other areas of ML

- [Differential privacy](https://en.wikipedia.org/wiki/Differential_privacy?useskin=vector): guarantee no particular training example has too large an influence on model (stronger goal compared to unlearning)
- [life-long learning](https://arxiv.org/abs/1802.07569): models that can learn continuously while maintaining previously-acquired skills
- [fairness](https://tinyurl.com/28g452mh): correct unfair biases or disparate treatment of members belonging to different groups

### Anatomy

An unlearning algorithm takes a pre-trained model, and one or more samples from the forget set to unlearn.

From the model, forget set, and retain set, the unlearning algorithm produces an **unlearned** model.

The goal: unlearned model === model trained without forget set

### Challenges

It is complex as it involves several **conflicting objectives**:

1. forgetting requested data
1. maintaining model's utility (accuracy on retained and held-out data)
1. efficiency

Existing algorithms make different tradeoff

- full retraining = forget ✅, utility ✅, efficiency ❌
- adding noise to weights = forget ✅, utility ❌

The second challenge is the inconsistent **evaluation**.

- [classification accuracy](https://arxiv.org/abs/1911.04933) on samples to unlearn
- [distance](https://proceedings.mlr.press/v119/wu20b.html) to fully retrained model
- error rate of membership inference attacks as [metric](https://arxiv.org/abs/2302.09880) for [forgetting](https://arxiv.org/abs/2010.10981) [quality](https://arxiv.org/abs/2005.02205)

### Challenge

The first [NeurIPS 2023 Machine Unlearning Challenge](https://unlearning-challenge.github.io/) was announced to advanced this field.

A [starting kit](https://github.com/unlearning-challenge/starting-kit) and a sample [notebook](https://nbviewer.org/github/unlearning-challenge/starting-kit/blob/main/unlearning-CIFAR10.ipynb) is also released.

### Evaluation

How is forgetting evaluated?

Using tools inspired by Membership Inference Attacks (MIAs) such as [LiRA](https://arxiv.org/abs/2112.03570).

They were first developed in privacy and security literature with the goal of inferring which **examples** were **part of the training set**.

Intuitively, if unlearning was successful, there will be **no trace of the forget set**, causing MIA to fail; since the attacker will be _unable_ to infer the forget set was part of the original training set.

In addition, distribution of retrained models and unlearned models will be compared. For an ideal unlearned algorithm, the two will be indistinguishable.
