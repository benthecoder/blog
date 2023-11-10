---
title: 'How to Win Kaggle Competitions'
tags: 'ML'
date: 'Nov 10, 2023'
---

[Christof Henkel](https://www.kaggle.com/christofhenkel), the current #2 on Kaggle shares in an [interview](https://www.youtube.com/watch?v=RF4LwRl0npQ) how to succeed in a competition.

His track record: first place in 7 out of 75 challenges

### How to pick a challenge

First you have to decide what challenge to work on.

Success is positively correlated with how much time you spend on the challenge.

**Pick a challenge that motivates you**, not what seems the easiest.

Also, investigate the data of a challenge before deciding on it.

Once you have one in mind, here's his 3 step approach.

### 1. Create an End-to-end pipeline

- Create a very simple pipeline of reading in data, creating features, training a (simple) model, and computing the **competition-specific metric**
- replicate as closely as possible to the [validation](https://learning.oreilly.com/library/view/the-kaggle-book/9781801817479/Text/Chapter_6.xhtml#_idParaDest-95) setup for leaderboard

### 2. Experiment and research

- start with a simple model and iterate through many ideas
- read research papers, check other comps
- look at data, even external data, reduce noise, augment the data
- use different losses
- post-process the predictions
- more experimentation = better, evaluate them with validation setup

### 3. Scale your approach

- now you've converged on a final model, and are no longer experimenting
- it's time to use all of the data and "scale up" the model
- this means hyperparameter turning, using a deeper model, etc.
- happens at the last 2-3 weeks of comp

### Summary

> Pick something that motivates you. First goal: create a feedback loop that allows you to experiment. Then experiment. Optimize in the end.

For toolkits for challenges, check out this [winning toolkit](https://mlcontests.com/winning-toolkit/) article.
