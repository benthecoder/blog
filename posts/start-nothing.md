---
title: 'Start With Nothing'
tags: 'programming'
date: 'Dec 5, 2023'
---

A good first step when building a thing is to build a thing that [does nothing](https://devblogs.microsoft.com/oldnewthing/20230725-00/?p=108482).

This way, you know you're starting from a good place.

If you're building a component, [Raymond Chen](https://devblogs.microsoft.com/oldnewthing/author/oldnewthing) suggests to do it in these steps:

- Step 0: Develop a standalone program to perform the action, conforming the action is possible
- Step 1: Create a basic structure (class or module) without full functionality
- Step 2: Add method to test operational context with simple output
- Step 3: Prepare method/function for action with parameters, but without execution
- Step 4: Integrate core functionality from step 0 for full operation

He comments that inexperienced devs dive in and start writing a big complex thing, and can't even get it to compile.

So start with something that does nothing. Make sure you do nothing successfully. Only then should you make changes so it starts doing something.

This iterative way of programming will allow you to know that any problems you have are related to your attempts to do something.

Here's an example to drive the point home

### Step 0: Inserting data

```py
import sqlite3

def insert_data_into_db(data):
    conn = sqlite3.connect('example.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS data (info TEXT)''')
    c.execute('''INSERT INTO data (info) VALUES (?)''', (data,))
    conn.commit()
    conn.close()

insert_data_into_db('Sample Data')
```

### Step 1: Basic FastAPI with no operations

```py
from fastapi import FastAPI

app = FastAPI()

@app.post('/data')
def handle_data():
    return {"message": "Endpoint Created"}
```

### Step 2: Register an action

```py
@app.post('/data')
def handle_data():
    print("Yay! Received a request.")
    return {"message": "Endpoint Hit"}
```

### Step 3: Parse response and check output

```py
@app.post('/data')
async def handle_data(request: Request):
    data = await request.json()
    print(f"Received data: {data}")
    return {"message": "Data Received"}s
```

### Step 4: Perform the action

```py
@app.post('/data')
async def handle_data(request: Request):
    data = await request.json()
    insert_data_into_db(str(data))
    return {"message": "Data Processed and Stored in DB"}
```
