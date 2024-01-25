---
title: 'Tracking Carbon Emission'
tags: 'climate'
date: 'Jan 25, 2024'
---

![Coalbrookdale by Night, 1801, Philip James de Loutherbourg](/images/loutherbourg.jpg)

> "Companies that persist in treating climate change solely as a corporate social responsibility issue, rather than a business problem, will risk the greatest consequences." – Michael E. Porter and Forest L. Reinhardt

I came across the company [Watershed](https://watershed.com/) on LinkedIn last year while I was in Cali. I want to work in the climate tech space, so this company peaked my curiosity.

I have ~7 months (-1 for surgery recovery) in Malaysia if things go well with grad school (still no interviews btw I'm freaking out). I googled for climate tech companies in Malaysia and [Pantas](https://pantas.com/) was the first result.

I reached out to people working in that company, and chatted with a senior DS working there currently.

To prepare for the chat, I did a quick one hour research into carbon emission tracking.

First, there's the formula to calculate carbon emissions.

```txt
"activity or energy consumption" data X emission factor
```

This value is in CO2e – carbon dioxide equivalent.

The emission factor is the challenge here. They're usually just broad approximations, and sometimes you don't have it. Let's say you have a pencil and a pen, you have the emission factor for a broad category - stationary, but nothing more specific.

You have a way to measure it. But how wide do you collect and measure? Emissions can be direct and indirect. There are also upstream and downstream activities that have GHG impact.

Since 1998, the [Greenhouse Gas Protocol](https://ghgprotocol.org/sites/default/files/standards_supporting/FAQ.pdf) (GHG protocol), developed by the World Resources Institute (WRI) and the World Sustainable The Business Council for Development (WBCSD), has developed greenhouse gas emissions accounting standards.

Why is this necessary?

- it can facilitate description of direct and indirect emission sources
- improves transparency
- serves different types of institution and different types of climate policies and business goals

There are 3 scopes of carbon emissions as defined in the protocol.

Scope 1 & 2 are mandatory, while #3 is voluntary and hardest to monitor.

## Scope 1: direct emissions

- emission from company-owned and controlled resources
- categories:
  - stationary combustion: fuels, heating sources
  - mobile combustion: cars, vans, trucks
  - fugitive emissions: leaks from ghg (refrigeration, ac units)
  - process emissions: released during industrial processes, on-site manufacturing

## Scope 2: indirect emissions

- indirect emissions from generation of purchased energy from utility provider, including electricity, steam, heat, and cooling consumed

## Scope 3: indirect emissions - not owned

- all indirect emissions not in scope 2, occurring in the value chain of reporting company
- 15 categories in total
  - upstream
    - business travel
    - employee commuting
    - waste generated in operations (landfills, wastewater treatments)
    - purchased goods and services (production-related & non-prod related)
    - transportation and distribution
    - fuel and energy-related activities (production of fuels and energy not included in #1 and #2)
    - capital goods (buildings, vehicles, machinery)
  - downstream
    - investments (equity, debt, project finance, managed investments, client services)
    - franchises (operations under franchisee control)
    - leased assets (upstream and downstream leasing)
    - use of sold products ("in-use" emissions from sold products)
    - end-of-life treatment. (disposal of products sold to consumers)

Below is Apple's 3 scopes visualized.

![Apple Carbon Footprint](/images/apple_carbon.png)

Notice how scope #3 represents the largest portion of a company's GHG impact.

By tracking all 3 scopes, companies can understand their full value chain emissions and focus their efforts on the greatest GHG reduction opportunities
