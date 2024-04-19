---
title: 'Climate Forecast with AI'
tags: 'climate, AI'
date: 'Apr 19, 2024'
---

A few notes on [how AI is improving climate forecasts](https://www.nature.com/articles/d41586-024-00780-8).

Conventional climate models are built manually from scratch by scientists using mathematical equations to describe the physical processes by which land, oceans, and air interact and affect the climate.

They're important and are expected to work well enough to make climate projects because they help guide global policy.

The problem? They take weeks to run and are energy intensive. A typical model consumes up to 10 MW hours of energy to simulate a century of climate. (this is, on average, the amount of electricity used annually by a US household)

These models also struggle to simulate small-scale processes, like how raindrops form, which have an important role in large-scale weather and climate outcomes.

The solution? Using ML to spot patterns in the data.

Three ways AI is used for climate modelling

1. Emulators (Copycats)
   - take baseball, a conventional climate model is a program that calculates where a ball will land based on physical factors, such as how hard a ball is thrown, where it is thrown from, and how fast it is spinning.
     - What emulators do is equivalent to a sports player who learns the patterns from these modelled outputs, and can make predictions of where the ball will land, without crunching all the math.
   - two examples
     - [QuickClim](https://www.nature.com/articles/s43247-023-01011-0): forecast temperature 1M times faster than a conventional model
     - [ACE: A fast, skillful learned global atmospheric model for climate prediction](https://arxiv.org/abs/2310.02074)): accurately predicted 90% of atmospheric variables, 100 times faster and 100 times more energy-efficient
2. Foundational models
   - what: picking up hidden patterns, fundamental, possibly unknown, patterns in the data that are predictive of futruefuture climate
   - [ClimaX: A foundation model for weather and climate](https://arxiv.org/abs/2301.10343)
     - **general training**: Microsoft trained on the output from five physics-based climate models that simulated the global weather and climate from 1850 to 2015, including factors such as air temperature, air pressure and humidity, simulated on timescales from hours to years
     - **fine-tuning** on wide-range of tasks: one of it (from a [benchmark](https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2021MS002954) for comparing AI climate models) was predicted the average surface temperature, daily temperature range and rainfall worldwide from input variables of carbon dioxide, sulphur dioxide, black carbon and methane levels
     - ClimaX predicted state of temperature-related variables better than 3 emulators, but less well in predicting rainfall
   - limitations:
     - true state of future climate is unknown: "Testing climate models against past climate behaviour is useful, but not a perfect measure of how well they can predict a future that’s likely to be vastly different from what humanity has seen before."
     - AI is a black box: “With climate projections, you absolutely need to trust the model to extrapolate,”
3. Hybrids (best of both)
   - what: embed ML components inside physics-based models to produce hybrid models
   - why: ML replaces the parts of conventional models that works less well – typically modelling of small-scale, complex and important processes such as cloud formation, [snow cover](https://clima.caltech.edu/files/2023/04/Snow_Prediction_Paper.pdf), and river flows
   - example
     - [A machine learning approach to rapidly project climate responses under a multitude of net-zero emission pathways | Communications Earth & Environment](https://www.nature.com/articles/s43247-023-01011-0)

What is the ultimate goal?

> create digital models of Earth's systems, partly powered by AI, that can simulate all aspects of the weather and climate down to kilometre scales, with great accuracy and at lightning speed.

### more

by nature

- [Science and the new age of AI](https://www.nature.com/immersive/d41586-023-03017-2/index.html)
- [Think big and model small](https://www.nature.com/articles/s41558-022-01399-1)
- [How machine learning could help to improve climate forecasts](https://www.nature.com/articles/548379a)
- [Harnessing AI and computing to advance climate modelling and prediction](https://www.nature.com/articles/s41558-023-01769-3)

interesting projects

- [CliMA – Climate Modeling Alliance](https://clima.caltech.edu/)
- [Earth System Digital Twins - NASA Earth Science and Technology Office](https://esto.nasa.gov/earth-system-digital-twin/)
- [Destination Earth](https://destination-earth.eu/): Building a highly accurate digital twin of the Earth

DeepMind

- [GraphCast: AI model for faster and more accurate global weather forecasting](https://deepmind.google/discover/blog/graphcast-ai-model-for-faster-and-more-accurate-global-weather-forecasting/)
- [Nowcasting the next hour of rain](https://deepmind.google/discover/blog/nowcasting-the-next-hour-of-rain/)
- [What is the Deepmind Nowcasting paper all about? | Real-world Machine Learning](https://dramsch.net/articles/deepmind-nowcasting/)
- [Google DeepMind’s AI Weather Forecaster Handily Beats a Global Standard](https://www.wired.com/story/google-deepmind-ai-weather-forecast/)
