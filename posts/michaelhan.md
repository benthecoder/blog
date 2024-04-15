---
title: 'Understand The Data'
tags: 'data, work'
date: 'Apr 15, 2024'
---

I had a chat with [Michael](https://www.linkedin.com/in/michael-ichin-han/) who I found on [ADPlist](https://adplist.org).

The most practical advice I got from him (+ Claude 3 Sonnet) is the following:

When assigned a task or analysis, like "research the relationship between A, B, and C", ask for additional context upfront:

- Why are we looking at A, B, and C specifically? What is the broader product/business goal?
- What are the initial assumptions or beliefs on how they relate?
- Are there other related variables X, Y, and Z that should be considered?
- Who will be consuming this analysis? What are their perspectives and priorities?

Working backwards from the end objective helps you obtain enough context so you understand where your specific analysis fits into the bigger picture.

The rest of the notes are about how to understand data and stuff about quant.

---

## How to understand data

### 1. Gather Structural/Systems Context

> The first critical step is to understand why the data is showing up in a certain way due to the underlying systems, processes and pipelines generating it. This provides the foundational context.

- Ask questions to verify assumptions rather than solely relying on documentation
- For datasets pulled from production systems you don't own, find out the relationships and expectations between data columns/tables
- Identify when certain data is expected/not expected to show up based on the systems
- Understand effects caused by system properties vs. inherent to the phenomenon being studied

The biggest, most obvious deviations initially uncovered are typically structural issues resulting from mismatched expectations about the systems. Resolving these systematics upfront prevents wasted effort analyzing artifacts.

### 2. Understand Industry/Domain Context

> The next crucial step is to deeply understand the problem domain, entity or industry vertical that the data represents. Every industry has established tenures, benchmarks and behavioral norms.

- Learn the industry standards, rules of thumb or common sayings that reflect accepted domain knowledge (e.g. 95% revenue from 1% whales in gaming)
- Compare the data against these benchmarks to identify gaps or deviations from expected norms
- Use findings that contradict popular beliefs as low-hanging fruit to impress stakeholders early on

### 3. Explore Broadly Before Narrowing

> With the structural and domain contexts established, the process moves to open-ended exploratory analysis.

- Writing down a list of hypotheses to test based on the gathered context
- Time-boxing each hypothesis with a quick 10-15 minute investigation
- Not lingering too long on any single hypothesis if no interesting leads emerge quickly
- The goal is to rapidly narrow down to the most promising areas for deeper analysis

### 4. Analyze Promising Areas Deeply

> For the most interesting hypotheses identified during broad exploration, go through through rigorous statistical study to:

- Quantify the size of any effects or opportunities precisely
- Formulate multiple potential solutions or proposals
- Estimate the business impact of executing each proposal

This provides the ammunition to effectively "sell" the analytic insights by demonstrating and quantifying the potential upside.

### 5. Validate Findings

Even after penetrating analysis, validate results through additional processes like:

- Holding meetings with subject matter experts to scrutinize assumptions
- Performing simulations or live experiments if possible
- Continuously monitoring and measuring impact after implementation

The combination of upfront context-building, broad gaping analysis, focused deep dives, sizing potential impact, and ongoing validation allows analysts to truly wring comprehensive insights from datasets.

---

Two main categories of quant back then

1. High-Frequency Trading
   - Focused on leveraging coding skills to execute trades at ultra-high speeds
   - Targeted micro price differentials and market microstructure inefficiencies
   - Highly technical, prioritizing low-latency systems and fast code execution
2. Statistical Arbitrage/Pricing
   - Employed robust statistical methods and mathematics
   - Aimed to identify and profit from longer-term pricing inefficiencies
   - Could involve forecasting over days, months or even years
   - More research-oriented analysis

The divide is narrowing in recent years and ML is being applied more widely across all quant strategies.

Entry level roles

- research analyst working on specific strategies or forecasting algorithms in a niche area.
- ex: working on modeling weather derivatives. (i.e. a theme park who insures against rainy weekends during peak summer seasons)

Career paths

- Front office trading roles: Focused on trade execution, higher pressure
- Portfolio management: Creating and overseeing investment strategies, providing direction to analysts

Resources

- [QuantStart](https://www.quantstart.com/)
- [Self-Study Plan for Becoming a Quantitative Trader](https://www.quantstart.com/articles/Self-Study-Plan-for-Becoming-a-Quantitative-Trader-Part-I/)
- [International Quant Championship 2024 - WorldQuant](https://www.worldquant.com/iqc/)
- [WorldQuant University](https://www.wqu.edu/)
