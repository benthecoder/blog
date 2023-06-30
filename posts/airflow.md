---
title: 'What is Airflow?'
tags: 'programming'
date: 'Jun 29, 2023'
---

[Airflow](https://github.com/apache/airflow) is an open-source platform for **developing**, **scheduling**, and **monitoring** batch-oriented workflows.

The philosophy is "Workflows as Code", which serves several purposes

- **dynamic**: dynamic pipeline generation
- **extensible**: can connect with numerous technologies (other packages, dbs)
- **flexible**: parameterization leverages [Jinja](https://jinja.palletsprojects.com/en/3.1.x/) templating engine.

Here's a simple example

```py
from datetime import datetime

from airflow import DAG
from airflow.decorators import task
from airflow.operators.bash import BashOperator

# A DAG represents a workflow, a collection of tasks
with DAG(dag_id="demo", start_date=datetime(2022, 1, 1), schedule="0 0 * * *") as dag:

    # Tasks are represented as operators
    marco = BashOperator(task_id="marco", bash_command="echo marco")

    @task()
    def polo():
        print("polo")

    # Set dependencies between tasks
    marco >> polo()

```

There are three main [concepts](https://airflow.apache.org/docs/apache-airflow/1.10.12/concepts.html#dags) to understand.

- DAGs: describes the work (tasks) and the order to carry out the workflow
- Operators: a class that acts as a template for carrying out some work
- Tasks: a unit of work (node) in a DAG, implements an operator

Here we have a [DAG](https://airflow.apache.org/docs/apache-airflow/1.10.12/concepts.html#dags) (Directed Acyclic Graph) named "demo" that will start on January 1st 2022, running daily.

We have two tasks defined

- A `BashOperator` running a bash script
- A Python function defined with the `@task` decorator

`>>` is a bishift operator which defines the dependency and order of the tasks.

Here it means `marco` runs first, then `polo()`

Why Airflow?

- Coding > clicking
- version control, can roll back to previous workflows
- can be developed by multiple people simultaneously
- write tests to validate functionalities
- components are extensible

Why not Airflow?

- not for infinitely-running event-based workflows (this is streaming - [Kafka](https://kafka.apache.org/))
- if you like clicking

Resources

- [Official Tutorial](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/index.html)
- [DE Project by startdataengineering](https://www.startdataengineering.com/post/data-engineering-project-for-beginners-batch-edition/)
- [Best Practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [YouTube Tutorial](https://youtu.be/2v9AKewyUEo)
- [jghoman/awesome-apache-airflow: Curated list of resources about Apache Airflow](https://github.com/jghoman/awesome-apache-airflow)
- [Apache Airflow - YouTube](https://www.youtube.com/@ApacheAirflow/videos)

Alternatives

- [Luigi](https://github.com/spotify/luigi)
- [Prefect](https://www.prefect.io/)
- [Dagster](https://dagster.io/)
- [Mage](https://www.mage.ai/)

Blogs

- [Lessons Learned From Running Apache Airflow at Scale (2023)](https://shopify.engineering/lessons-learned-apache-airflow-scale)
- [Running Apache Airflow At Lyft. By Tao Feng, Andrew Stahlman, and Junda… | by Tao Feng | Lyft Engineering](https://eng.lyft.com/running-apache-airflow-at-lyft-6e53bb8fccff)
- [Migrating Airflow from EC2 to Kubernetes | Snowflake Blog](https://www.snowflake.com/blog/migrating-airflow-from-amazon-ec2-to-kubernetes/)
- [How AppsFlyer uses Apache Airflow to run more than 3.5k daily jobs | by Alex Kruchkov | AppsFlyer Engineering | Medium](https://medium.com/appsflyerengineering/how-appsflyer-uses-apache-airflow-to-run-over-3-5k-daily-jobs-and-more-683106cb24fc)
- [The Journey of Deploying Apache Airflow at Grab](https://engineering.grab.com/the-journey-of-deploying-apache-airflow-at-Grab)
- [How Sift Trains Thousands of Models using Apache Airflow - Sift Engineering Blog : Sift Engineering Blog](https://engineering.sift.com/sift-trains-thousands-models-using-apache-airflow/)
