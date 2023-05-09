---
title: 'A Bayesian mindset'
tags: 'statistics'
date: 'May 9, 2023'
---

> In Bayesian statistics, model parameters are random variables.

I took a [Bayesian statistics](https://www.wikiwand.com/en/Bayesian_statistics) course this semester and I think it'll be the most valuable course I'll ever be taking in my 4 year of undergraduate studies in Statistics at ISU.

There's a decay rate for knowledge that I retain for the classes I take, and it'll be the same for this course as well. But if there's one thing I want to take away from this course, it's the mindset of being a Bayesian

I came across this [article](https://mindfulmodeler.substack.com/p/bayesian-inference-from-first-principles) by Christoph Molnar, and what better way to end the chapter of this course by understanding Bayesian modelling from first principles.

The first principles view of Bayesian statistics is that model parameters are [random variables](https://www.wikiwand.com/en/Random_variable).

The model here can be a simple distribution, and the parameters - the mean of a distribution, coefficients in linear regression, the correlation coefficient - are variables with their own distributions.

This notion contrasts the frequentist view of treating parameters as fixed but unknown quantities. By treating them as random variables, we acknowledge the uncertainty around their true values.

We're also, later on, able to incorporate our beliefs since we assign [probability distributions](https://www.wikiwand.com/en/Probability_distribution) to these parameters.

So, we've established parameters are variables.

What do we want to accomplish in Bayesian modelling?

We start with data about an event, and we want to estimate a parameter of interest (θ). This parameter can be anything from effectiveness of a drug to the click-through rate on a website.

In mathematical form, our model is estimating P(θ|X), the parameter distribution for θ given the data X.

But we can't directly estimate P(θ|X), we don't know the true values of parameters in the real-word.

It's much more natural to estimate the inverse - P(X|θ) the distribution of data given parameters.

And here's where [Bayes' theorem](https://www.wikiwand.com/en/Bayes'_theorem) come into the picture.

This theorem inverse the condition to P(X|θ), a.k.a the [likelihood function](https://www.wikiwand.com/en/Likelihood_function).

From this theorem, we are given two things: P(θ), the prior distribution and P(X), the evidence.

P(θ) is your beliefs about the world. You have to specify this BEFORE observing the data.

This prior can be informative or non-informative, and that determines how much your belief will influence the estimation. A non-informative prior means the data has more influence, and vice versa.

In statistics jargon, the posterior mean is the weighted average between the prior mean and the sample mean.

The cool thing being Bayesian is once you get an estimation P(θ|X), with the power of sequential updating, that becomes your new prior.

This idea of updating your priors is very intuitive, we're collecting new data and updating our beliefs from our interactions and experiences in everyday life.

Bayes' theorem also involves the term P(X) called the evidence, which is usually unfeasible to estimate. It's also known as the normalizing constant.

So instead we take the numerator P(X|θ) P(θ), which is proportional to the posterior distribution.

In most cases, the posterior distribution is not a known distribution like the Normal or Binomial distribution, so we need to perform sampling from the posterior using techniques such as [MCMC](https://en.wikipedia.org/wiki/Markov_chain_Monte_Carlo?useskin=vector).

There's no use to knowing all this without being able to apply it. So my goal is read [Bayesian Methods for Hackers](https://github.com/CamDavidsonPilon/Probabilistic-Programming-and-Bayesian-Methods-for-Hackers) and learn [PyMC](https://www.pymc.io/welcome.html) to put this knowledge into practice.
