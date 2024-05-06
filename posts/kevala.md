---
title: 'Kevala: Grid Intelligence'
tags: 'climate, energy'
date: 'May 6, 2024'
---

I had a chat with Troy, DS manager @ [Kevala](https://www.kevala.com/).

A few things I got out of the chat:

### On Kevala

- key mission: make energy data more useful and drive decisions in energy policy and utility decisions
- customers: They work a lot with utilities as their main stakeholders, as well as some state and federal regulatory bodies
- offerings:
  - They have a user platform that shows granular data on the electric grid, including high voltage transmission lines and lower voltage distribution lines
  - A key data asset is their granular data on the lower voltage distribution lines that feed customers and EV chargers
- example works:
  - One of their data science teams models different energy resources like rooftop solar, batteries, EVs, and EV charging infrastructure
  - They help utilities plan their grids and identify where new energy needs will arise at a granular level
  - They can help utilities understand impacts on revenue and customer bills from technology adoption

## resources

- News sources
  - [Canary Media | Covering the clean energy transition](https://www.canarymedia.com/)
  - [Utility and Energy Transmission & Distribution News | Utility Dive](https://www.utilitydive.com/)
- Course
  - [Electric Utilities Fundamentals and Future Course](https://www.coursera.org/learn/electric-utilities)
- Communities
  - [Young Professionals in Energy- SF Bay Area](https://www.ypesfbayarea.org/)
- Datasets
  - [Grid Status API](https://www.gridstatus.io/) – ex: forecast electricity price in Texas
  - [Energy Information Administration (EIA)](https://www.eia.gov/)
- Book
  - [The Grid: The Fraying Wires Between Americans and Our Energy Future by Gretchen Bakke | Goodreads](https://www.goodreads.com/en/book/show/26073005)

## DS projects in energy

- Forecasting:
  - Forecasting energy demand
  - Forecasting electricity prices
- Optimization:
  - Controlling/optimizing different energy assets like batteries, EV chargers
- Other Applications:
  - Image recognition (e.g. analyzing satellite imagery)
  - LLMs (e.g. parsing regulations/zoning PDFs)
  - Graph analysis (representing utility grid network as a graph)

## What he looks for when hiring

- clean, documented, production-quality code that can be collaborated
- Familiarity with version control, cloud platforms (AWS, GCP)
- Already thinking about evaluation metrics and how to assess model performance
- Able to discuss next steps - other modeling techniques, deployment considerations
- Thinking holistically about the entire solution pipeline beyond just modeling on laptop, i.e. big-picture thinking about full lifecycle of a data science solution

## projects he would work on

- EV Charging Analysis
  - Analyze data on locations of EV charging stations
  - Look at characteristics of neighborhoods that lead to more charger deployments
  - Examine speed of charger rollout in different areas
- Transportation/Mobility Analysis
  - Use datasets on people's travel patterns and destinations
  - Analyze bike networks and most used routes/locations
- Battery/EV Charger Optimization Modeling
  - Model integrated battery and EV charger systems
  - Optimize battery usage alongside EV charging patterns
  - Factor in pricing signals, grid carbon intensity by time of day
- New York City Subway/Transit Analysis
  - Mentioned NYC has open data on subway schedules that could enable analysis

### what keeps him up at night

- The massive scale of EV charger deployment needed to support transportation electrification goals
- He cites a target of 1.2 million chargers needed in California by 2035/2040, but currently only around 100,000 public ports
- Acknowledges utilities were not designed for this magnitude of new electric loads
- But he finds it exciting that utilities are open to changing their processes to accommodate this transition

### advice for a master's student

- Make the most of being in the Bay Area for networking and events outside just your masters program
- Attend energy/sustainability groups and events to learn from other professionals
- This exposure helped give him a better understanding of why energy is used/deployed in certain ways
