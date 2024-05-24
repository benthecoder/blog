---
title: 'Predict New Medicine with ML'
tags: 'ML'
date: 'May 24, 2024'
---

There's a Kaggle competition that I'm working on with a grandmaster.

It's called [Leash Bio - Predict New Medicines with BELKA](https://www.kaggle.com/competitions/leash-BELKA/data?select=train.parquet)

More specifically, the goal is to predict small molecule-protein interactions using the Big Encoded Library for Chemical Assessment (BELKA)

Back to basics of biology.

### what are proteins?

they are large, complex molecules made up of smaller units of chains called amino acids. These chains fold into 3d structures, and the specific structure determines the function of the protein.

### what are they used for?

virtually every process that takes place in living organisms.

they can act as

- enzymes: catalyzing chemical reactions
- structural: provide support and shape to cells and tissue
- signalling molecules: transmitting information within and between cells
- transporters: move molecules across cell membranes

Now what does this have to do with drugs?

### drugs & proteins

drugs are small molecules designed to bind to specific and either inhibit or activate their functions.

They act like a lock and key, where the small molecule (the key) fits into a specific pocket or binding site on the protein (the lock). When this binding occurs, it can alter the protein's shape or behaviour, potentially treating a disease or condition caused by the abnormal activity of the protein.

take cancer for an example. a tumor is caused my cells that grow uncontrollably, and if there's a drug that can inhibit this protein and stop the growth, it can be used to treat cancer.

Now back to the competition.

### the goal

The goal is to develop an ML model to predict whether a given small molecule will bind to one of three specific protein targets.

1. EPHX2 (soluble epoxide hydrolase): This enzyme is involved in regulating blood pressure and diabetes progression.
1. BRD4 (bromodomain-containing protein 4): This protein plays a role in gene expression and is implicated in cancer progression. Drugs that inhibit BRD4 could be used as cancer treatments.
1. ALB (human serum albumin): This is the most abundant protein in blood and is responsible for transporting various molecules, including drugs. Predicting how small molecules bind to ALB can help in designing drugs that are not sequestered by this protein, improving their efficacy.

For any AI task, the data is everything.

### the data

The dataset is 133 million small molecules, each represented by a [SMILES](https://archive.epa.gov/med/med_archive_03/web/html/smiles.html) string, which stands for (Simplified Molecular-Input Line-Entry System) and is a way to encode the structure of chemical molecules as a linear string of characters. For example, the SMILES string "C1=CC=C(C=C1)C" represents the molecule benzene.

Each small molecule is composed of three "building blocks" and a central triazine core.

Think of the triazine core as the glue, a framework for how the three blocks are attached

### representing molecules

There are different ways of [representing](https://jcheminf.biomedcentral.com/articles/10.1186/s13321-020-00460-5) molecules. They are provided as SMILES in the data, but you can explore

- [Graphs](https://wires.onlinelibrary.wiley.com/doi/10.1002/wcms.1603)
- [3d structures](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10689004/)
- [Spherical CNNs](https://arxiv.org/abs/1801.10130)

### how is this data collected?

Using [DNA-encoded libraries](https://en.wikipedia.org/wiki/DNA-encoded_chemical_library?useskin=vector) (DELs)

Before DELs, small molecules had to be kept in separate, identifiable tubes and required a lot of liquid handling to test each one of them against the protein target of interest in a separate reaction. This logistical overhead limited the screening collections (libraries) to 50K-5m small molecules.

In 2009, as DNA sequencing got [cheaper and cheaper](https://www.genome.gov/about-genomics/fact-sheets/Sequencing-Human-Genome-cost), they realized they can use DNA itself as a label to identify collections of molecules in a complex mixture.

So now scientists can fit in many small molecules in a single tube, each of them barcoded using DNA sequencing technology, and exposed to the protein target of interest in solution. Then, the protein target of interest is rinsed to remove the molecules that do not bind to the target, and the remaining binders are collected and DNA sequenced.

An intuitive way to think of DELs is imagine a Mickey mouse head as a small molecule in the DEL. And we attach a DNA barcode to its chin. And its left ear is attached with a velcro and the right ear with a zipper. The zipper and velcro are analogies to different chemical reactions to construct the DEL.

Say we buy 10 different faces, 10 different zipper ears and 10 different velcro ears to construct our library. By creating every possible combination of the three, we have 1000 small molecules, while only needing 30 building blocks (faces and ears). This combinatorial approach is what allows a DEL to have so many members, and how the 133M small molecules in the dataset is constructed.

### Why is this model important?

The classic approach to identify the right molecules is to physically make them one by one, and then expose them to the protein target of interest and test if the two interact. This is a time-intensive and laborious process.

The US Food and Drug Administration (FDA) has approved only ~[2000](https://www.fda.gov/drugs/development-approval-process-drugs/new-drugs-fda-cders-new-molecular-entities-and-new-therapeutic-biological-products) novel molecular entities in its entire history. But the number of chemicals in druglike space has been estimated to be [10^60](https://www.nature.com/articles/432823a), and the next treatment of cancer could be hiding in this chemical space, but it would be impossible to physically search it.

That's why we need ML to accelerate drug discovery.

With this model, researches can input various small molecules into the model, and predict their binding affinities to specific protein targets. This helps prioritize which small molecules are most promising for further testing and development as potential drug candidates.

###\*\*\*\* example use cases

1. improve drug delivery and efficacy
   - say you have a new promising drug but a significant portion of it is being sequestered by serum albumin (ALB protein target) in the bloodstream, reducing its effectiveness.
   - using ML, you can identify modifications to the drug's structure to reduce its binding affinity for ALB, improving its delivery
2. repurpose existing drugs
   - taking advantage of the binding interactions of existing drugs to treat other conditions
   - using ML to identify potential repurposing opportunities

###\*\*\*\* solutions

coming soon...
