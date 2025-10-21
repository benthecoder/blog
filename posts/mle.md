---
title: 'MoM and MLE'
tags: 'statistics, math'
date: 'Oct 9, 2023'
---

It's my last statistics class for my bachelor's degree, and my midterm is tomorrow, these are some resources I found for these concepts.

Method of Moments and Maximum Likelihood Estimation are two methods for [estimating](https://online.stat.psu.edu/stat415/lesson/1) [parameters](https://online.stat.psu.edu/stat415/lesson/1/1.1) of a [distribution](https://en.wikipedia.org/wiki/Probability_distribution).

### MoM

Basic Idea: equate sample [moments](https://gregorygundersen.com/blog/2020/04/11/moments) with the respective [theoretical](https://math.stackexchange.com/questions/2379647/difference-between-theoretic-moment-and-sample-moment-and-understanding) moments E(X^k), k=1,2,3.... , until you have as many equations as parameters, and solve for the parameters.

Links

- [1.4 - Method of Moments | STAT 415](https://online.stat.psu.edu/stat415/lesson/1/1.4)
- [Full Lecture 8 - Significant Statistics](https://significantstatistics.com/index.php/Full_Lecture_8#Method_of_Moments)

### MLE

Basic idea: maximize likelihood of data to estimate unknown parameter 𝛉. Find L(𝛉), log-likelihood it to make it easier to work with, differentiate it, set it to 0, and solve for 𝛉.

Links

- [Maximum Likelihood Estimation | STAT 415](https://online.stat.psu.edu/stat415/lesson/1/1.2)
- [Explaining Maximum Likelihood Estimationf](https://www.rasch.org/rmt/rmt1237.htm)
- [MLE.pdf](https://heather.cs.ucdavis.edu/MLE.pdf)
- [Maximum Likelihood by NIST (Pros and Cons)](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3652.htm)
- [Maximum Likelihood, clearly explained by Statquest](https://www.youtube.com/watch?v=XepXtl9YKwc)
- [Maximum Likelihood Estimation in Python](https://python.quantecon.org/mle.html)

### MoM vs MLE

MLEs can be shown to be [asymptotically efficient](https://www.statistics.com/glossary/asymptotic-efficiency/), but MLEs require more assumptions. The best tool depends on the situation.

More on this:

- [What is the Method of Moments and how is it different from MLE? - Cross Validated](https://stats.stackexchange.com/questions/252936/what-is-the-method-of-moments-and-how-is-it-different-from-mle)
- [When do maximum likelihood and method of moments produce the same estimators? - Cross Validated](https://stats.stackexchange.com/questions/262546/when-do-maximum-likelihood-and-method-of-moments-produce-the-same-estimators)
- [Why MLEs are asymptotically efficient whereas method of moment estimators are not? - MathOverflow](https://mathoverflow.net/questions/451895/why-mles-are-asymptotically-efficient-whereas-method-of-moment-estimators-are-no)
