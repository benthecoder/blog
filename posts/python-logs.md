---
title: 'Writing Better Logs'
tags: 'programming'
date: 'Jun 28, 2023'
---

Are you still writing logs like this?

```py
import logging

logging.debug("Start uploading file with name %s. Number of retries: %s", file_name, 0)
...
logging.error("Failed uploading file with name %s. Current retry: %s.", file_name, retries)
...
```

Here are the [challenges](https://medium.com/@ArzelaAscoli/writing-professional-python-logs-e1f31635b60b) of logging this way.

- **missing contextual info**, the above log might be enough for a dev environment with one user, but in a production system, questions that can arise are:
  - Who sent this request?
  - Which organization does the user belong to?
  - Which file store did we connect to? Is there a session identifier or something else that helps us trace down the error?
  - Is this log line connected to a request identifier?
- **transition** from dev only to machine readable logs
  - logs should not only human-readable, but also machine readable in production system for easier querying
- **inconsistent** wording
  - dependent on author, different naming convention, missing information

Introducing [structlog](https://www.structlog.org/en/stable/)

> Structlog offers a lot of nice features that help you write logs in a faster and less painful way. It helps you to add contextual data to your logger and offers a modular configuration for parsing your log lines in a machine readable and developer friendly way.

Summary of learnings

- a key-value format for variables creates standardizes log messages and naming convention
- contextual data are added explicitly by binding variables or implicitly by using [context variables](https://docs.python.org/3/library/contextvars.html), enriching logs with useful metadata
- structlog preprocessor extends content of log messages and renderer allows easy parsing of logs into machine/human-friendly format

[Loguru](https://github.com/Delgan/loguru) is another library that makes logging enjoyable.
