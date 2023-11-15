---
title: 'Linear Algebra for ML'
tags: 'math, ML'
date: 'Nov 15, 2023'
---

I took a [Linear Algebra](https://www.wikiwand.com/en/Linear_algebra) (LA) class in my first year of college, it was taught in such a mathematical and algebraic way that I couldn't appreciate it at all.

I got a B+ in that class, I remember in the the final exam I didn't have time to finish the test and got mad at myself, and then disappointed. I also realize I don't understand Linear Algebra at all. Like why does the no. of cols in A have to match the no. of rows in B for a [matmul](https://www.wikiwand.com/en/Matrix_multiplication) operation?

Now that I'm starting grad school, and have the goal of becoming an AI engineer, it's time to **really** understand LA.

I watched this [video](https://www.youtube.com/watch?v=uZeDTwWcnuY&t=19s) today taught by the amazing [Charles Frye](https://charlesfrye.github.io/about/), who was also involved in teaching [FSDL](https://fullstackdeeplearning.com/).

He also made videos for calculus and probability in his series [Math4ML](http://wandb.me/m4ml-videos), along with [exercise notebooks](https://github.com/wandb/edu/tree/main/math-for-ml).

His [analogy](https://docs.google.com/presentation/d/1Kqf3cq2lvJ8QtunduVtaTCVfFUq574faOC-Sx6yQEK8/edit#slide=id.g7270120a71_1_214) of comparing linear algebra with programming really helped me make sense of the how and the why behind it.

Here are some takeaways.

- LA is like programming
  - in programming, we combine **functions** with matching **types** through **function composition**
  - in LA, we combine **matrices** with matching **shapes** through **matrix multiplication**
  - so, think of matrices as functions, and matmul as a function application, that takes another matrix
- why arrays as functions?
  - easy to change slightly, small changes to entries -> small changes to function
  - LA can be made lightning fast ([TPU](https://en.wikipedia.org/wiki/Tensor_Processing_Unit), [BLAS](https://en.wikipedia.org/wiki/Basic_Linear_Algebra_Subprogramsr))
  - arrays represent [linear functions](https://www.wikiwand.com/en/Linear_function)
  - linear functions play nice with weighted sums
  - this makes linear function easy to reason about
    - ex: 0 is **always** sent to 0
    - **everything sent to 0** is called the **[kernel](https://brilliant.org/wiki/kernel/)**
      - kernel is made of weighted sums
    - weighted sums define the [rank](https://www.mathsisfun.com/algebra/matrix-rank.html) of function
      - We can make **new non-kernel elements** by making **weighted sums of known non-kernel elements**.
      - Rank answers the question: **how many non-kernel elements** do I need to know in order to **make every element that’s not in the kernel**?
- [SVD](https://www.wikiwand.com/en/Singular_value_decomposition) is matrix "refactoring"
  - "separation of concern" = Eigenvectors ("eigendecomposition")
  - removing redundant code = Low-rank decomposition
  - break up into functions (decomposing) = Singular Value decomposition (SVD)
- Function & Matrix decomposition
  - any function can be decomposed to "**representatives**", reversible **renaming**, and **type conversion**
  - any matrix can be decomposed into A (tall matrix), B (square matrix), C (wide matrix)
  - in SVD, special choices are made: B is diagonal, and A and C are unitary (no growing/shrinking)
- why do SVD?
  - calculate low-rank approximation
  - used in PCa for preprocessing and analyzing data
  - classify and measure matrices in LA
- applied to video
  - many matrices are nearly low rank (you can notice patterns)
    - full rank = absence of patterns in matrix
  - simplest low-rank pattern in a video is the background
    - an outer product of a vector \* rest of vectors (a repeat() function)
    - think of it as an approximation
    - used to compress data (this is used in JPEG encoding of images in form of Fourier transform)
    - can be used to separate out foreground. Rank 1 approx is the background, and you can use it to approx foreground.

### LA concepts

- matrix: a function that transforms data
- matmul: applying a function to an input
- rank: count of unique, independent features in data
  - low rank : repeating patterns, useful for compressing data
  - full rank: implies complex data
- kernel: a function that returns zero for specific inputs, helps identify redundant or dependent features in data
- eigenvectors: directions in which data varies the most
- SVD: decompose function into simpler parts
  - Surjective (onto): Every possible output is represented.
  - Bijective (one-to-one and onto): Each input has a unique output and vice versa.
  - Injective (one-to-one): Every input leads to a unique output.

### More Resources

Hackers approach

- [Computational Linear Algebra for Coders](https://github.com/fastai/numerical-linear-algebra)
- [Introduction to Linear Algebra for Applied Machine Learning with Python](https://pabloinsente.github.io/intro-linear-algebra)

Visualize

- [Graphical Linear Algebra](https://graphicallinearalgebra.net/2015/04/23/makelele-and-linear-algebra/) – a new way of doing LA
- [Essence of linear algebra by 3Blue1Brown](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab) – amazing animations, visualize concepts

Papers/Courses/Textbooks

- [The Matrix Calculus You Need For Deep Learning](https://arxiv.org/pdf/1802.01528.pdf)
- [Matrix Methods in Data Analysis, Signal Processing, and Machine Learning | Mathematics | MIT OpenCourseWare](https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/)
- [Linear Algebra Done Right](https://link.springer.com/content/pdf/10.1007/978-3-031-41026-0.pdf)
