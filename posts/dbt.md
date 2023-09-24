---
title: 'What is dbt?'
tags: 'tech, explained'
date: 'Sep 23, 2023'
---

[dbt](https://www.getdbt.com/) (data build tool) is a CLT that enables data analyst and [engineers](https://www.getdbt.com/data-teams/hiring-data-engineer) to transform data in their [data warehouses](https://docs.getdbt.com/terms/data-warehouse) more effectively.

### where

dbt is the T in [ETL](https://docs.getdbt.com/terms/etl).

It doesn't extract or load, but it sits on top of your warehouse and transforms data that's already loaded.

This is known as [ELT](https://docs.getdbt.com/terms/elt).

ELT is becoming more prevalent because data warehouses like Bigquery and Snowflake are extremely performant and scalable, that transformations can be more effectively handed in-database rather than elsewhere.

### What

So [what](https://www.getdbt.com/blog/what-exactly-is-dbt) does it do?

The only function of dbt is to take code, compile it to SQL, and run it against your database.

At the most basic level, it's a compiler and a runner.

You write dbt code in a text editor of your choice, or the [IDE](https://docs.getdbt.com/docs/cloud/dbt-cloud-ide/develop-in-the-cloud) in dbt cloud, and run dbt in the cli.

dbt compiles all the code into raw sql, and execute it against a configured data warehouse.

dbt code has two core workflows: **building** data [models](https://docs.getdbt.com/docs/build/models) and **testing** data models

### building models

A data model is any transformed [view](https://docs.getdbt.com/terms/view) of raw data.

To create a model, you write a SQL SELECT statement. dbt then builds it in the database, materializing it as a view or [table](https://docs.getdbt.com/terms/table).

This model then can be queried by other models or analytical tools.

[Materialization](https://docs.getdbt.com/docs/build/materializations) means the strategy ([DDL](https://docs.getdbt.com/terms/ddl)) by which a data model is built in the warehouse. Or in other words, the manner in which data is represented.

### testing

You can [test](https://docs.getdbt.com/docs/build/tests) the integrity of SQL in each model by making assertions.

You can test for things like:

- whether a specificed column only has non-null or unique
- values that have a corresponding value in another model
- values from a list
- custom tests that suit business logic

There are two ways to define a test: singular and generic.

Singular tests is test in its simplest form. You write a SQL query that returns failing rows, save it in a .sql file in your test directory.

Generic tests are parameterized queries that accept arguments. they can be reused over and over, and are defined in a test block.

They're defined in a .yml file in `models` directory

Out of the box, dbt ships with four generic tests already defined: unique, not_null, accepted_values and relationships.

### dbt code

What is dbt code exactly?

it's a combination of SQL and Jinja, a common templating language used in Python.

For example, `ref()` is a function that gives users the ability to reference other models in their code.

ref does two things: interpolates itself into raw SQL as the appropriate schema.table, and it automatically builds [DAG](https://docs.getdbt.com/terms/dag) of all the models in a project.

With Jinja, you can do if statements, loops, macros, and gives SQL superpowers.

### modular code

dbt also has additional functions and variables, where you can express logic that checks if code is running in dev vs prod, state of database. etc.

This allows you to write modular code that can automate complicated and time-consuming tasks.

This means dbt gives users powerful tools to build, ship and share their own transformations.

Which is why dbt ships with a package manager.

So to summarize everything, here's why dbt is so [powerful](https://docs.getdbt.com/docs/introduction):

- avoid writing boilerplate [DML](https://docs.getdbt.com/terms/dml) and [DDL](https://docs.getdbt.com/terms/ddl), just write SELECT statements and dbt takes cares of materialization
- build reusable, modular data models that can be referenced
- reduce the time it takes for queries to run with metadata
- Use Jinja in SQL for control structures, macros, hooks
- Publish packages that can be referenced by otherse
- Use source control processes like branching, PRs
- Write data quality tests quickly and easily
- [document](https://docs.getdbt.com/docs/collaborate/documentation) descriptions for each model and field
- snapshots your data to track changes or reconstruct historic values
