---
title: 'What is a Kalman Filter?'
tags: 'explained'
date: 'Nov 6, 2023'
---

[Kalman Filters](https://www.wikiwand.com/en/Kalman_filter) helps estimate unknown values based on a series of measurements taken over time.

You can use it in any place where you have uncertain information about some dynamic system, and you can make an educated guess about what the system is going to do next.

So, a common application is for guidance, navigation, and control of vehicles, particularly airfract, [spacecraft](https://ntrs.nasa.gov/api/citations/19860003843/downloads/19860003843.pdf) and ships [positioned dynamically](https://www.wikiwand.com/en/Dynamic_positioning).

Even if reality is messy and interferes with the clean motion, it can still do a good job of figuring out what happened.

This is because it can combine information, taking advantage of correlations between different phenomena you maybe wouldn't have thought to exploit.

It's ideal for systems that are continuously changing, and are memory efficient (only keeps track of previous state), making them fast and suited for real time and embedded systems.

Here are some examples

- **Augmented Reality (AR)**: Improving the accuracy of object tracking and camera positioning, ensuring that virtual overlays maintain correct alignment with the real world in AR applications.
- **Behavioral Economics**: Analyzing decision-making processes by filtering out noise from experimental data, providing insights into how people make economic choices under uncertainty.
- **Earthquake Prediction Models**: Enhancing the precision of models that predict seismic activity by processing noisy seismographic data over time.
- **Professional Sports**: Applying advanced analytics to player tracking data in real time to strategize on team movements and improve training regimens.
- **Film Production**: Stabilizing camera motion in movies, allowing for smoother shots and easier integration of special effects in post-production.
- **Artwork Analysis and Restoration**: Assisting art conservators by filtering through layers of paint and varnish using imaging technology to uncover original strokes and colors or to understand the deterioration patterns.

## Resources

Understanding

- [Poor Man's Explanation of Kalman Filtering: Or How I Stopped Worrying and Learned to Love Matrix Inversion](https://archive.org/details/poor-mans-explanation-of-kalman-filtering)
- [Kalman Filter Tutorial](https://www.kalmanfilter.net/default.aspx)
- [Greg Czerniak's Website - Kalman Filters for Undergrads 1](http://greg.czerniak.info/guides/kalman1/)
- [How a Kalman filter works, in pictures | Bzarg](https://www.bzarg.com/p/how-a-kalman-filter-works-in-pictures/)
- [Kalman Filter Explained Simply - The Kalman Filter](https://thekalmanfilter.com/kalman-filter-explained-simply/)

Implementing

- [Implementation of Kalman Filter with Python Language](https://arxiv.org/pdf/1204.0375.pdf)
- [rlabbe/Kalman-and-Bayesian-Filters-in-Python](https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python)
- [Designing Kalman Filters](https://cocalc.com/share/public_paths/7557a5ac1c870f1ec8f01271959b16b49df9d087/08-Designing-Kalman-Filters.ipynb)
- [Extended Kalman Filter (EKF) With Python Code Example – Automatic Addison](https://automaticaddison.com/extended-kalman-filter-ekf-with-python-code-example/)

Applications

- [Kalman Filter for Time Series Forecasting in Python](https://forecastegy.com/posts/kalman-filter-for-time-series-forecasting-in-python/)
- [Online learning for an MLP using extended Kalman filtering](https://probml.github.io/dynamax/notebooks/nonlinear_gaussian_ssm/ekf_mlp.html)
