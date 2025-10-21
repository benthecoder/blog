---
title: 'Dinner with Kevin'
tags: 'chats, people'
date: 'May 23, 2023'
---

I had dinner with [Kevin Kho](https://www.linkedin.com/in/kvnkho/) today at [Layang Layang](https://www.yelp.com/biz/layang-layang-milpitas).

I met him from an [online course](https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main) where he was teaching about [Prefect](https://www.prefect.io/opensource/v2/), an open-source data workflow orchestration tool.

I reached out to him, and since I was writing technical [articles](https://benedictxneo.medium.com/), he asked me to write one on [Fugue](https://github.com/fugue-project/fugue), an abstraction layer for distributed computing

I didn't get around writing it, but I'm glad we got to meetup as I learned a lot of things from him.

Here's a dump of everything I remember

- Databricks is successful because Spark is hard to self host, everything else is just icing on the cake
- Snowflake SQL engine (code -> SQL) makes it limited, whereas Databricks is SQL to code, and you can directly go to the code layer to do more things
- If you miss the H1B all 3 years, you can get transferred to Canada, and come back to the US under intracompany transfer (L Visa)
- Working on open-source can help you boost your stocks, get contracting work from companies (e.g. he's contracting with Citibank earning 200/hour)
- For open-source, the number of stars and community downloads are metrics for investors
- Fugue's plan to monetize is provide a service that can aggregate together the analytics (BigQuery, SQL) and machine learning (Spark, Dask) operations under one umbrella, and abstract away back-end side of things (hosting, clusters)
- [Han Wang](https://www.linkedin.com/in/han-wang-97272610) (Lyft) and other Snowflake engineers are working on Fugue, one person just appeared on Slack and started contributing
- Open source people are happy to provide materials if you want to do a conference or talk or blog about their software, it can help boost your brand.
- [Astronomer](https://www.astronomer.io/) is dying because people would rather setup their own airflow or use AWS instead of paying for another service and have to deal with authentication and such.
- Prefect wanted to use [Modal labs](https://modal.com/) to host and deploy workflows, but it was very expensive.
- Code generation is too non-deterministic, and code is deterministic. There should be another layer between natural language and code generation, could be training set, prompting, a new language.
- Compute services have a very low operating margin, 70% of it go to AWS or GCP
- cons of consulting, you might get assigned a project that is boring, and the work never goes to production
- in the Philippines there's an army class that you take where you march and learn how to hold a gun
- Facebook data scientists work on mostly SQL
- Developer advocate works on community-building, workshops, conferences, writing blogs, sometimes code, and salary can be 150k/year fresh grad, but they force you to write certain contents
- companies start out with analytics, use snowflake, then realize they want to do machine learning, they get recommended low code ML solutions (Dataiku)
