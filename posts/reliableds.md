---
title: '10 Rules of Reliable Data Science'
tags: 'data'
date: 'Jun 14, 2024'
---

Since I'm starting an MSDS next month, I have to pick up Data Science again.

I found this [paper](https://drivendata.co/insights) with a ton of insights into best practices for data science.

below are some notes:

### intro

- **good**: data science provides a powerful toolbox for increasing efficiency, driving growth, automating expensive processes, and making better decisions.
- **bad**: Too many real-world projects are chaotic stew of hand-tweaked algorithms, cherry picked examples, and brittle, undocumented, untested research code.
- the main bottleneck in data science are no longer compute power or sophisticated algorithms, but <mark>craftsmanship, communication, and process</mark>
- the 3 basic premise
  - data science is a kind of software work,
  - correctness and reliability of software depends on development practices
  - data science quality depends on SWE quality
- the aim: work that is accurate and correct, but also **can be understood**, work that others **can collaborate on**, and that **can be improved and built** upon in the future even if original contributors have left

### Rule 1: Start organized, stay organized

- good analysis is often the result of scattershot and serendipitous explorations; tentative experiments and trying out approaches that might work are all part of the process
- but it should start with clean and logical structure
- the [cookiecutter DS](https://cookiecutter-data-science.drivendata.org/) template is an effective structure where:
  - data is always in `/data`, raw is in `/data/raw`, and final for analysis is in `/data/processed`
  - notebooks are in `/notebooks` with a numbering scheme
  - project-wide code is in `/src`
- this sensible and self-documenting structure allows others to understand, extend, and reproduce your analysis
- other people will thank you: newcomers can understand without suffering through documentation, every data scientist in a team can open any historical project, and immediately know where to find the inputs/outputs, the explorations, the final models, and any reports generated
- you will thank yourself: if you try to reproduce your analysis, you're not asking questions about which `.py` file to run to get things done

Below is the full structure of their template

```text
├── LICENSE <- Open-source license if one is chosen
├── Makefile <- Makefile with convenience commands like `make data` or `make train`
├── README.md <- The top-level README for developers using this project.
├── data
│ ├── external <- Data from third party sources.
│ ├── interim <- Intermediate data that has been transformed.
│ ├── processed <- The final, canonical data sets for modeling.
│ └── raw <- The original, immutable data dump.
│
├── docs <- A default mkdocs project; see www.mkdocs.org for details
│
├── models <- Trained and serialized models, model predictions, or model summaries
│
├── notebooks <- Jupyter notebooks. Naming convention is a number (for ordering),
│ the creator's initials, and a short `-` delimited description, e.g.
│ `1.0-jqp-initial-data-exploration`.
│
├── pyproject.toml <- Project configuration file with package metadata for
│ {{ cookiecutter.module_name }} and configuration for tools like black
│
├── references <- Data dictionaries, manuals, and all other explanatory materials.
│
├── reports <- Generated analysis as HTML, PDF, LaTeX, etc.
│ └── figures <- Generated graphics and figures to be used in reporting
│
├── requirements.txt <- The requirements file for reproducing the analysis environment, e.g.
│ generated with `pip freeze > requirements.txt`
│
├── setup.cfg <- Configuration file for flake8
│
└── {{ cookiecutter.module_name }} <- Source code for use in this project.
│
├── **init**.py <- Makes {{ cookiecutter.module_name }} a Python module
│
├── config.py <- Store useful variables and configuration
│
├── dataset.py <- Scripts to download or generate data
│
├── features.py <- Code to create features for modeling
│
├── modeling
│ ├── **init**.py
│ ├── predict.py <- Code to run model inference with trained models
│ └── train.py <- Code to train models
│
└── plots.py <- Code to create visualizations
```

### Rule 2: Everything comes from somewhere and the raw data is immutable

> Every piece of knowledge must have a single, unambiguous, authoritative representation within a system. – Andy Hunt and Dave Thomas

- the fundamental theorem of reproducibility: every conclusion drawn in an analysis must come from somewhere
- DAG: Every piece of data or work product in an analysis tree should be the result of a dependency graph that can be traced backwards to examine what combination of code and data it came from or run forwards to recreate any artifact of the analysis
- if you trace any product far enough upstream, you will end up at one or more scripts that extract raw data, or the raw dataset itself
- do not have misc data files in the project, at least write own how the data was acquired in the README

### Rule 3: Version control is basic professionalism

- data should (mostly not be in VCS)
  - not usually a good idea to store intermediate or cleaned data products, whole idea of reproducible data pipelines is everything should be obtainable with clear provenance from original, raw dataset
  - impractical to store data of a certain size, will clutter commit history and inflate repository size on disk, tracking code changes alongside data change will be unbearable
  - putting data in code tracker is conceptual mismatch: we expect raw data to change often over time (daily report requires new data everyday)
- data stored in db or warehouse has its own versioning (timestamp, IDs)
- raw data can be archived and shared using basic storage (hard drive, S3, etc.)
- check out data versioning tools
  - [Data Version Control · DVC](https://dvc.org/)
  - [dat-ecosystem](https://dat-ecosystem.org/)
  - [git lfs](https://git-lfs.com/)
- why source control?
  - look at "diff" to spot unintended changes and extra debugging code
  - DS accretes small decisions and assumptions, helps track individually and get feedback on mathematical validity, statistical relevance, and implementation of the decisions
  - promote sharing knowledge

### Rule 4: Notebooks are for exploration, source files are for repetition

- notebooks are tools for rapid, iterative, and serendipitous explorations that give a tight feedback loop showing the immediate results of change
- also invaluable as artifacts for communicating and explaining analyses
- why notebooks bad for reproducability
  - manually opening and running cells is not automation
  - hard to test and introduce complications that go against the grain of common system conventions (logging, where output is directed STDERR vs STDOUT, return of error codes, what process fails on uncaught exceptions, working directories, etc.)
  - challenging for source control, merge conflicts
- naming convention that shows "owner" and gives sense of order of analysis
  - `<step>-<initials>-<description>.ipynb`
  - ex: `3.1-BN-visualize-distributions.ipynb` where step is a loose idea of where in the end-to-end workflow this notebook falls
- the solution: `.ipynb` -> `.py`
  - continuously extracting common building blocks out of the notebook into source files that can be **centrally tracked** and used from any other notebook
- benefits:
  - separate multiple concerns into logical units, so data layer (ETL) is not mixed with modeling and experimentation (where notebooks shine), and are not entangled with output layer (final result of workflow, where predictions, reports sent to a database)
  - prevents duplication of code (how errors creep in), rather than being stuck in one notebook, changes to commonly used code propagate across all notebooks
  - allows pieces of pipeline to run without running the entire pipeline (ex: tweak hyperparameter and refit model doesn't require sitting through long-running data extraction task)
  - enables test to verify functionality and correctness
  - shows code changes across commits in VCS
- embrace refactoring
  - write utility code in commonly accessible modules, write a couple of quick tests, import it into notebooks
- when to move out of notebook?
  - matter of judgement, taste, and pragmatism
  - notebooks > code, for demonstration and experimentation
  - if a piece of code is the focus of the work, or solely designed for the analysis, leave it in
  - if it's a necessary building block but not worth showing, move it to a separate file that can be tracked in VCS and tested

### Rule 5: Tests and sanity checks prevent catastrophes

> Code without tests is bad code. It doesn’t matter how well written it is; it doesn’t matter how pretty or object-oriented or well-encapsulated it is. With tests, we can change the behavior of our code quickly and verifiably. Without them, we really don’t know if our code is getting better or worse.
> – Michael Feathers

- testing data science code is hard
  - testing on large datasets = long-running test
  - we expect data to change over time, downstream values fluctuate
  - often use randomness on purpose (to sample or fit model), hard to assert whether changes are meaningful or due to expected variation
  - visualizations are challenging to test
  - notebook env not the same level of tooling for test discovery and running
- what code to test?
  - [sanity check](https://en.wikipedia.org/wiki/Sanity_check?useskin=vector#Software_development) and [smoke test](<https://en.wikipedia.org/wiki/Smoke_testing_(software)?useskin=vector>)
  - helpful when examples have possible edge cases such as null values, zeros, shape mismatch, etc.
- what kind?
  - test that operate on "toy examples" with tiny amounts of data or extremely small arrays make it clear what is being tested and what values are expected
  - **unit test**: the right tool for verifying processing or math code, tests focused on a specific operation being correct in isolation
    - how? take a sensible number of expected input-output pairs (taken from reference, calculated with an alternative package, or worked out by hand) and demonstrate that the new code produces the expected output
- recommendation
  - write test for any code refactored out of notebooks
  - write tests with sample data to confirm logic works as expected

### Rule 6: Fail loudly, fail quickly

> This is a problem that occurs more for machine learning systems than for other kinds of systems. Suppose that a particular table that is being joined is no longer being updated. The machine learning system will adjust, and behavior will continue to be reasonably good, decaying gradually. Sometimes tables are found that were months out of date, and a simple refresh improved performance more than any other launch that quarter!
> — Martin Zinkevich, “Rules of Machine Learning

- ml is dangerous models can often appear to give reasonable predictions despite serious programming errors or data quality issues
- principles of [defensive programming](https://en.wikipedia.org/wiki/Defensive_programming?useskin=vector)
  - Conspicuous: worst failure is a silent one
  - fast: if a function is going to fail eventually, it might as well fail now
  - informative: provide messages
- ex: a model fitting pipeline, one of the feature is mean(col_from_raw)
  - assume raw data is not generally expected to contain missing values
  - mean() function in many packages ignores nulls without complains
  - a damaged sensor or buggy code change causes column to silently start having non-random null values
  - this new mean value could be strongly biased and lead to bad predictions, and will make costly business decisions
- solution?
  - make assumptions concrete and enforce them at runtime
  - bail out immediately and loudly if assumptions are violated
  - from example above:
    - check input column before applying transformation
    - immediately log that the non-null assumption was violated
    - halt processing script with a failure exit status
  - point and call
    - your pipeline should not be more permissive than necessary
    - set a norm thinking explicitly about where to be permissive and strict
    - ex: add assertions that values can be floating point or null is an intentional way to show sources of possible error

### Rule 7: Project runs are fully automated from raw data to final outputs

- it should be obvious for anyone to initiate the process for raw data -> finished product
- instructions in README are not enough, you can miss crucial steps, or it's too vague, or not updated.
- when data pipelines are not automated, they are not reproducible
- use a build tool
  - keep pipeline working and run it everytime you make a non-trivial change
  - CICD: mainline branch is always in a runnable state and has its tests run every time a change is committed
  - for a data project, to reproduce the results of a project, anyone should be able to run a "default" pipeline without typing out or understanding the various knobs and settings
  - it can be as intuitive as running a single command from proj dir
- make env reproducible
  - same interpreter and same libraries with identical versions to ensure matching results
  - requirements.txt with specific versions of packages
  - for more complex requirements, use docker
- make randomness reproducible
  - set a random seed in a central location
    - note that random, numpy.random, torch.rand each use their own seeding mechanism
    - use an explicit random number generator object where you set seed in one location and track its use
  - reproducing an analysis using probabilistic methods means pseudorandom number generators must be initialized with a known state to induce the same values each time

### Rule 8: Important parameters are extracted and centralized

- magic numbers is a bad practice of sprinkling critically important values which affect the program's behaviour throughout the codebase
- data projects often end up with an excessive number of ways to parameterize scripts and functions
- consider a model training pipeline that cleans raw data, fits several models, and outputs predictions
  - all of the model parameters multiply possibilities with the "meta" choices like train/test ratio, cross-val params, ensemble voting params, to make a combinatorially overwhelming universe of possible inputs for a single run
- AVOID: one notebook for each model and then copy pasting setup code, or reuse notebooks by changing parameters by hand, or have parameters in multiple code files.
- remember the goal is not just making changes, it's to see how our changes affect outcomes
- ideal: running another experiment = changing settings in a central config file, getting a cup of coffee, compare most recent log to past experiments
  - it also documents the changes with the output for yourself and for colleagues
- imagine a declarative settings file `config.yml` file like below

```yaml
n_threads: 4
random_seed: 42
train_ratio: 0.5
log_level: debug
  features:
    use_log_scale: true
    n_principal_components: 4
models:
  xgboost:
    max_depth: [2,5,10]
    n_estimators: [50,100,150,200]
  random_forest:
    criterion: ["gini","entropy"]
ensembling:
  voting: ["soft","hard"]
```

### Rule 9: Project runs are verbose by default and result in tangible artifacts

- capturing useful output during data pipeline runs make it easy to figure out where results came from, making it easy to look back and pick up from where it was left off
- example of a run of experiment codified in a config file

```txt
2022-11-01 14:10:02 INFO starting run on branch master （HEAD @ 37c02ab）
2022-11-01 14:10:02 DEBUG set random seed of 42
2022-11-01 14:10:02 DEBUG reading config file
2022-11-01 14:10:02 DEBUG ... settings：｛"n_threads"： 4， <..snip.... .>｝
2022-11-01 14:10:03 INFO reading in and merging data files
2022-11-01 14:10:39 INFO finished loading data: 2,835,824 rows
2022-11-01 14:10:40 WARNING ... dropped 126, 664 rows where ID was duplicated （4.47%）
2022-11-01 14:10:41 WARNING ... dropped 2,706 rows where column 'total was null （0.09%）
2022-11-01 14:10:41 INFO creating train/test split
2022-11-01 14:10:41 INFO ...  train: 0.5 ［1,353,227 rows］
2022-11-01 14:10:41 INFD ...  test : 0.5 ［1,353,227 rows］
2022-11-01 14:10:42 INFO starting grid search cross validation ..
2022-11-01 14:21:01 DEBUG ... 30/120
2022-11-01 14:31:46 DEBUG ...  60/120
2022-11-01 14:42:31 DEBUG ...  90/120
2022-11-01 14:53:03 DEBUG ... 120/120
2022-11-01 14:53:03 INFO finished cross validation, writing best parameters
2022-11-01 14:53:03 DEBUG ...  runs/2022-11-01_14-10-02/parameters/xgboost.yml
2022-11-01 14:53:03 DEBUG ...  runs/2022-11-01.
_14-10-02/parameters/random_forest.yml
2022-11-01 14:53:03 DEBUG ...  runs/2022-11-01_14-10-02/parameters/adaboost.yml
2022-11-01 14:53:03 INFO training voting classifier on ensemble of 3 best models..
2022-11-01 14:53:19 INFO making predictions
2022-11-01 14:53:22 INFO writing results to runs/2022-11-01_14-10-02/results.yml
2022-11-01 14:53:22 DEBUG ... results: precision=0.9624 recall=0.9388 f1=0.9514
2022-11-01 14:53:23 INFO writing predictions to runs/2022-11-01_14-10-02/predictions.csv
```

- above we are storing important history like how many rows were dropped, what the train/test split was, how long it took to run, the performance, the best parameters, etc.
- imagine if you introduce a new feature, you want to see what impact that has on overall performance as well as processing time, instead of eyeballing, you can simply look at the result data files
- this allows rapid iteration through experimental settings, you worry less about missing settings or performance backsliding from misc changes, and focus more on actual modeling subject matter and business case
- this ability to audit how results came about -> eases detecting and fixing any downstream problem

### Rule 10: Start with the simplest possible end-to-end pipeline

> a complex system that works is invariably found to have evolved from a simple system that worked. A complex system designed from scratch never works and cannot be patched up to make it work. You have to start over with a working simple system"
>
> – Brian Kernighan and John Gail, Systemantics

1. start with proper form, fill in proper function
   - work from raw data all the way to finish product before going back to improve all of the pieces
   - all projects have a time constraint, so it's better to get the entire pipeline glued together, even if some parts are basic or even faked
     - even if you use a naive model that has poor accuracy, very few features are cleaned from raw data, if outputs are rough,
   - aim for an automated pipeline, then work on it piece by piece
2. start with basic tools and models
   - for numerical predictions from tabular dataset, the potential accuracy buff with deep learning does not justify the added complexity and decreased interpretability, compared to plain old regression or decision trees
   - the decision to add additional complexity should not be made lightly, but delayed until the [last responsible moment](https://blog.codinghorror.com/the-last-responsible-moment/) when its clear the tradeoff is going to pay dividends
   - ex: there are powerful libraries for orchestrating from raw -> clean data to trained models to new predictions, but consider whether the old and boring Make tool can do the job
   - ex: instead of perfectly handling every quirk in a dataset, purposefully decline to handle edge cases by failing fast on bad inputs (rule 6) or loudly filtering unhandled cases (rule 9)
     - a column "12.10 USD", instead of doing something clever like a custom struct with enumerated data type representing the currency is in use, if you know it'll only be in "USD", just do a split on space " " and assert the second value is in "USD" (rule 5)
3. you don't have to use all of the data all the time
   - exploratory analysis and scaling ana analysis are two different chores, they can be tackled separately as long as the bigger picture is in mind
   - keep exploratory feedback loop fast by working with representative samples
   - sometimes a naive sample is enough for the task at hand, i.e. getting all data cleaning code in order or making sure a preprocessing step results in useful features
   - save the parallelization for later, once you feel confident about the modeling assumptions and data pipeline, they can be translated for parallelization

### software lessons

1. use version control
2. keep it simple, stupid (KISS): simple solutions are easier to reason, easier to debug, and easier for new collaborators to understand. only add complexity if it serves the ultimate goal of the project, after careful consideration
3. separation of concerns: aka, loose coupling , minimize the amount each component of a program needs to "know" about other pieces
4. separate configuration from code: dispersing settings throughout codebase makes it difficult for anyone trying to understand the logical flow, centralize and codify important settings to make the effect they have on outputs obvious.
5. You aren't gonna need it (YAGNI): abstraction is powerful and costly, [start with a concrete case](https://wiki.c2.com/?DoTheSimplestThingThatCouldPossiblyWork) and only generalize when needed.
6. premature optimization is the root of all evil: [rule of thumb](https://wiki.c2.com/?MakeItWorkMakeItRightMakeItFast) is to "make it work, make it right, make it fast", focus on getting the job done first before trying to speed up or cover all edge cases. in data work, instead of dealing with massive datasets and cluster, understand the problem well
7. don't repeat yourself (DRY): when functions get copied and pasted all over, it's a problem. for DS, that means refactoring notebook code -> "real" modules
8. composability: unix philosophy, "write programs that can communicate easily with other programs" so that developers break down projects into small simple programs rather than overly complex monolithic programs. instead of packing everything into one function, separate functions that read data, assemble data, and graph the result
9. test the critical bits: simple basic tests and sanity checks are important for data projects, they prevent the most common errors and increase confidence about correctness
10. fail fast and loudly: adopt a defensive way of thinking about error cases and focus on bailing out early if unanticipated errors happen
