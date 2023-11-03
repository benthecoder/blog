---
title: 'Catboost for tabular data'
tags: 'ML'
date: 'Nov 2, 2023'
---

Catboost is an open-source ML [Gradient](https://en.wikipedia.org/wiki/Gradient_boosting?useskin=vector) Boosted Decision [Trees](https://developers.google.com/machine-learning/decision-forests/intro-to-gbdt) algorithm, it's name come from the terms “Category” and “Boosting.” It was developed by Yandex (Russian Google ) in 2017

Key [attributes](https://neptune.ai/blog/when-to-choose-catboost-over-xgboost-or-lightgbm) of Catboost:

- ranking objective function
- native categorical features preprocessing
- model analysis
- fastest prediction time
  - [30-60x](https://www.joinplank.com/articles/xgboost-catboost-lightgbm) faster as documented by real companies
  - on GPUs it is 50-100x times faster than XGBoost.
- performs remarkably well with default parameters, significantly improving performance when tuned
- utilising ideas such as Ordered Target Statistics from online learning, CatBoost considers datasets sequential in time and permutes them
  - By creating the concept of artificial time 🕰️ CatBoost cleverly reduces Prediction Shift, inherent in the traditional Gradient Boosting models such as XGBoost and LightGBM.
- 8X faster inference than XGBoost
  - build better trees 🌲 that result in better regularisation and speed, especially during inference

## References

- [The Gradient Boosters V: CatBoost – Deep & Shallow](https://deep-and-shallow.com/2020/02/29/the-gradient-boosters-v-catboost/)
- [XGBoost? CatBoost? LightGBM? | Plank](https://www.joinplank.com/articles/xgboost-catboost-lightgbm)
- [When to Choose CatBoost Over XGBoost or LightGBM [Practical Guide]](https://neptune.ai/blog/when-to-choose-catboost-over-xgboost-or-lightgbm)
- [Is CatBoost faster than LightGBM and XGBoost?](https://tech.deliveryhero.com/is-catboost-faster-than-lightgbm-and-xgboost/)
- [ICR - Identifying Age-Related Conditions | Kaggle](https://www.kaggle.com/competitions/icr-identify-age-related-conditions/discussion/431041)
- [Tabular Data: Deep Learning is Not All You Need](https://arxiv.org/pdf/2106.03253.pdf)
- [When Do Neural Nets Outperform Boosted Trees on Tabular Data?](https://arxiv.org/pdf/2305.02997.pdf)
  - [TABPFN](https://arxiv.org/pdf/2207.01848.pdf)

## Resources

Catboost

- [CatBoost: unbiased boosting with categorical features](https://papers.nips.cc/paper/2018/hash/14491b756b3a51daac41c24863285549-Abstract.html)
- [CatBoost: A Deeper Dive | Kaggle](https://www.kaggle.com/code/abhinand05/catboost-a-deeper-dive)
- [catboost_simple.py · optuna/optuna-examples](https://github.com/optuna/optuna-examples/blob/main/catboost/catboost_simple.py)
- [CatBoost - open-source gradient boosting library](https://catboost.ai/)
- [CatBoost Github Repo](https://github.com/catboost/catboost)

GBDT

- [Stochastic Gradient Boosting](https://jerryfriedman.su.domains/ftp/stobst.pdf)
- [Gradient Boost Part 1 (of 4): Regression Main Ideas](https://www.youtube.com/watch?v=3CC4N4z3GJc)
- [Ensembles: Gradient boosting, random forests, bagging, voting](https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting)
