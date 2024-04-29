---
title: "what is backprop?"
tags: "whatis, AI"
date: "Apr 29, 2024"
---

I finally finished Andrej Karpathy's [video on backprop](https://www.youtube.com/watch?v=VMj-3S1tku0) that I started last year.

I'm going to code [micrograd](https://github.com/karpathy/micrograd) from scratch now, and write a medium article on it.

But before that, I'll explain some of the concepts in my own words to make sure that I actually understand, and not just think I understand them.

Summary of the video

- neural nets are mathematical expressions that take input as data, along with the weights and parameters of the neural net, passed through the mathematical operations in the forward pass, followed by a loss function.
- This loss function measures the accuracy of our predictions, and usually the loss is low when your predictions close to the targets or when it is behaving well. We manipulate the function in a way that when it is minimized, the network is doing what we want it to do.
- Then we backward the loss, use backpropagation to get the gradients, which tells us how to tune the parameters to decrease the loss locally
- This process is iterated many times in gradient descent. Where we follow the gradient information to minimize the loss, until it is close to / at zero.
- fundamentally, this neural network setup and training is identical and pervasive in all kinds of AI tasks, where it differs is in how we're updating the weights (simple MLP uses stochastic GD), and in computing the loss function (MSE is the simplest, cross-entropy loss is used for predicting next word)

Derivative

- a way to nudge a function to see how sensitive it is and whether it goes in the positive or negative direction.
- why? so that when minimizing the loss function in ML, we know which direction and by how much to adjust during gradient descent
- the math: $f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$, derivative of function at point x is the limit of the slope as h approaches zero.

forward pass

- traversing through the neural network with the input data, where each neuron in each layer processes the data based on its weight and bias, until it reaches the output layer which is the prediction.
- path: input data -> neural network: layer by layer calculate output sequentially by applying weighted sum of inputs and a bias -> non-linear activation function -> output
- math: the output of a layer is defined as $y = \sigma(Wx + b)$ where $\sigma$ is the activation function, $W$ is the weight matrix, $x$ is the input vector, and $b$ is the bias matrix.

backprop

- going backwards through the network to adjust the weights to reduce the error between the predictions and actual data
- how? it computes the gradient of the loss function w.r.t each weight in the network using chain rule, which allows gradient descent to find the direction and magnitude of the weight that will minimize the loss.
- analogy: we have knobs in a machine, where each knob directly affects each other to minimize the loss function, instead of randomly turning each of them, backprop tells you which knob to turn and by how much,

More resources

- [Yes you should understand backprop](https://karpathy.medium.com/yes-you-should-understand-backprop-e2f06eab496b)
- 3blue1brown’s [What is backpropagation really doing?](https://www.youtube.com/watch?v=Ilg3gGewQ5U) & [Backpropagation calculus](https://www.youtube.com/watch?v=tIeHLnjs5U8)
- [The Most Important Machine Learning Algorithm](https://www.youtube.com/watch?v=SmZmBKc7Lrs)
- [CS231n lecture on backprop](https://cs231n.github.io/optimization-2/)
