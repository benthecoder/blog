---
title: 'AI Aging'
tags: 'machine-learning, mlops'
date: 'Apr 17, 2023'
---

Found this [article](https://www.nannyml.com/blog/91-of-ml-perfomance-degrade-in-time) by NannyML and thought it would be useful for my article writing.

ML models depend on the data it was trained on. Since data in the real-world changes over time, model performance will degrade as time passes, a phenomenon the authors called "AI Aging".

MIT, Harvard, and other top institutions trained 4 different ML models (Linear Regression, Random Forest Regressor, XGBoost, and a Multilayer Perceptron Neural Network) on 32 datasets from four industries (Healthcare, Weather, Airport Traffic, and Financial) and found that [91% of their ML models degrade over time](https://www.nature.com/articles/s41598-022-15245-z)

Key takeaway

> Neither the data nor the model alone can be used to guarantee consistent predictive quality. Instead, the temporal model quality is determined by the stability of a specific model applied to the specific data at a particular time.

What are the solutions?

The right solution is context-dependent, and investigation shuld be done to understand the cause of the degradation

The solutions are:

1. Alert when model must be retrained: need access to latest ground truth or able to estimate model performance
2. develop efficient and robust mechanism for automatic model retraining: (if no data quality issue or concept drift), retraining model on latest labeled data can help
3. Have constant access to most recent ground truth: allows retraining, but in practice, ground truth is often delayed, expensive and time-consuming to newly labeled data. Alternative is to have a model catalog and use estimated performance to select best performing model

More:

- https://huyenchip.com/2022/02/07/data-distribution-shifts-and-monitoring.html
- https://www.nannyml.com/blog/6-ways-to-address-data-distribution-shift
