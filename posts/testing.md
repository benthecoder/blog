---
title: 'Testing'
tags: 'statistics, data'
date: 'Oct 17, 2023'
---

My professor was teaching about [hypothesis testing](https://www.wikiwand.com/en/Statistical_hypothesis_testing) in class today.

It reminded me of some blogs by [Allen Downey](https://allendowney.blogspot.com/) that I bookmarked ages ago.

I read through [them](https://allendowney.blogspot.com/2011/05/there-is-only-one-test.html) in class and this is the [framework](https://allendowney.blogspot.com/2016/06/there-is-still-only-one-test.html) to takeaway about hypothesis tests.

1. Compute **test statistic** that measures size of apparent effect. It could be a difference between two groups, absolute difference in means, see more examples [here](https://allendowney.blogspot.com/2011/06/more-hypotheses-less-trivia.html). We call this test statistic 𝛿
2. Define a **null hypothesis**, which is a model of the world under which the assumption that effect is not real, ex: if you think there is a difference between group A and B, H0 = there is no difference between A and B.
3. Model of null hypothesis should be [stochastic](https://www.wikiwand.com/en/Stochastic), that is, capable of simulating data similar to original data.
4. Goal: compute p-value (probability of seeing an effect as big as 𝛿 under null hypothesis). You can estimate p-value using **simulation**: calculate the same test statistic you used on the actual data for each simulation.
5. Count the fraction of times the test statistic exceeds 𝛿. This fraction approximates p-value. If it's sufficiently small, you can conclude that the apparent effect is [unlikely due to chance](https://allendowney.blogspot.com/2015/05/hypothesis-testing-is-only-mostly.html).

## Why simulation?

- analytical methods are slow and expensive, but even as computation gets faster, they are appealing because they are
  - **inflexible**: using a standard test -> particular test statistic and model, might not be appropriate for problem domain.
  - **opaque**: real-world scenario has many possible models, based on different assumptions. In standard tests, assumptions are implicit, not easy to know whether model is appropriate.
- simulation on the other hand, are
  - **explicit**: creating a simulation forces you to think about your modeling decisions, the simulations themselves document those decisions.
  - **arbitrarily flexible**: can try out several test statistics and models, can choose most appropriate one for the scenario.

## Resources

- [Statistical Rethinking 2023](https://www.youtube.com/playlist?list=PLDcUM9US4XdPz-KxHM4XHt7uUVGWWVSus) ([website](https://xcelab.net/rm/statistical-rethinking/))
- [Hypothesis testing - Think Stats 2e](https://greenteapress.com/thinkstats2/html/thinkstats2010.html)
