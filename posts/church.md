---
title: 'F-beta score'
tags: 'machine-learning'
date: 'May 14, 2023'
---

In classification problems, there's a tradeoff between precision and recall.

If you forgot what precision and recall are, here's a good [analogy](https://www.reddit.com/r/datascience/comments/qdai89/i_just_explained_recallprecision_to_a_nonds_and/) to recap.

Let's say you're fishing with a huge net. You cast it and catch 80 fishes out of the 100. That's 80% recall. However, you also catch 80 rocks in the process, that's 50% precision.

You can use a smaller net, and target a pocket of the lake with only fish and no rocks, but you only get 20 of the fish, but no rocks. That's 20% recall and 100% precision.

Get the idea?

Recall = what proportion of the things you catch are actually fish (true). (ex1: 80 / 100)

Precision = of those you catch, what proportion are fish. (ex1: 80 / 80 + 80)

To balance between these two metrics, we optimize the [F1 score](https://www.wikiwand.com/en/F-score), which is their [harmonic mean](https://www.wikiwand.com/en/Harmonic_mean).

However, in some cases, precision would be more important than recall, and vice versa.

Here's where the [F Beta](https://www.wikiwand.com/en/F-score#F%CE%B2_score) scofe comes in handy.

We can adjust the value of Beta to assign higher weight to either precision or recall.

Below is a [toy example](https://github.com/MenaWANG/ML_toy_examples/blob/main/modeling%20algorithm/metrics-fbeta.ipynb).

```py
from sklearn.metrics import fbeta_score

# define two models
y_true           = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0] # half positive
y_pred_precision = [1, 1, 1, 0, 0, 0, 0, 0, 0, 0] # perfect precision, two false negatives
y_pred_recall    = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0] # perfect recall, three false positives

perfect_precision = [y_true, y_pred_precision]
perfect_recall    = [y_true, y_pred_recall]

# the two models score similarly when beta = 1
print(fbeta_score(*perfect_precision, beta=1))
print(fbeta_score(*perfect_recall, beta=1))

# higher perfect precision scores
print(fbeta_score(*perfect_precision, beta=0.5))
print(fbeta_score(*perfect_recall, beta=0.5))

# higher perfect recall scores
print(fbeta_score(*perfect_precision, beta=2))
print(fbeta_score(*perfect_recall, beta=2))

```

The [beta parameter](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.fbeta_score.html) determines the weight of recall in the combined score.

beta < 1 lends more weight to precision, while beta > 1 favors recall (beta -> 0 considers only precision, beta -> +inf only recall).
