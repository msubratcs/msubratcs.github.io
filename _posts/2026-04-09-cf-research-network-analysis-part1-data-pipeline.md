---
layout: post
title: "Part 1: Building a Real-Time Biomedical Research Intelligence Pipeline"
date: 2026-04-09 20:00:00
description: "Part 1: PubMed ETL, PostgreSQL, and filtering 26M articles down to a focused research community"
tags: [co-authorship, pubmed, etl, postgresql, data-pipeline]
categories: data-science
series_part: true
giscus_comments: false
related_posts: false
---

> *Part 1 of the series: **[From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration](/blog/cf-research-network-analysis/)***

---

## The Data: 26 Million Articles in a Local PostgreSQL Database

To answer any of this, I needed data. Not a spreadsheet, but a live, queryable pipeline that could ingest the entirety of [PubMed's](https://en.wikipedia.org/wiki/PubMed) 26 million biomedical articles and let me slice into any disease, any time period, any research community.

### The Infrastructure

My setup is deliberately unglamorous. It's a headless Linux server running Ubuntu, accessible only via SSH. No GUI, no cloud credits burning. Just [PostgreSQL](https://en.wikipedia.org/wiki/PostgreSQL), Python, and [Prefect](https://www.prefect.io/) keeping everything fresh.

Prefect is a workflow orchestration tool, similar to Apache Airflow but lighter weight. Think of it as a scheduler that runs my data pipelines on a fixed cadence and handles all the messy things that go wrong: retries, logging, alerting if something fails.

Why local instead of cloud? A few reasons:

1. **26 million articles don't fit in a notebook.** PubMed's annual baseline is around 35GB of compressed XML. You need a real database for this, not pandas. And running a PostgreSQL instance on a cloud VM 24/7 would cost real money for something I only query a few times a week.
2. **Reproducibility.** Everything is version-controlled SQL. Re-running a query three months from now gives the same results against the same schema with the same filters. No "well, the notebook was different last time I ran it."
3. **Weekly freshness.** Prefect runs an [ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load) flow every week that pulls PubMed's daily update files, parses the XML, and upserts into Postgres. The database is never more than 7 days behind live PubMed. New papers show up automatically.

The PostgreSQL schema is designed for the kinds of analytical queries this project needs, like "give me all authors who published on Cystic Fibrosis and Pseudomonas in 2020, along with their affiliations." Five main tables:

- **articles**: 26M+ rows. Every paper in PubMed with its title, abstract, publication year, journal, DOI, and keywords.
- **article_authors**: Who wrote each paper, in what order, with their ORCID (if they have one) and affiliation text.
- **article_mesh_headings**: The standardized topic tags assigned to each article by human indexers (more on this below).
- **article_publication_types**: Whether it's a journal article, clinical trial, review, case report, etc.
- **article_chemicals**: Substances and drugs mentioned in each paper.

The weekly Prefect flow handles the messy reality of PubMed updates. Articles get revised, retracted, and re-indexed all the time. A paper published in 2022 might get new MeSH tags added in 2024. The pipeline processes update files in order, handles deletions, and maintains referential integrity across all five tables. It's not glamorous work, but it's the kind of plumbing that makes everything downstream possible.

---

## Filtering 26 Million Articles Down to 11,500

With the full PubMed database sitting in Postgres, I could get surgical with the filtering. Everything is in pure SQL, which serves as the single source of truth. No Python filtering that could silently diverge from the SQL logic. If someone asks "exactly which articles did you include?", I point them to the SQL file.

Here's how the funnel works:

**Step 1: Disease identification via MeSH.** PubMed doesn't tag articles with plain-text disease names. Instead, it uses the [Medical Subject Headings (MeSH)](https://en.wikipedia.org/wiki/Medical_Subject_Headings) controlled vocabulary, a hierarchical system of about 30,000 terms maintained by the National Library of Medicine. Every article in PubMed gets reviewed by a trained human indexer who assigns the relevant MeSH terms.

This matters because an article tagged with MeSH descriptor "Cystic Fibrosis" has been confirmed by a human to actually be *about* CF, not just mentioning it in passing. A keyword search for "cystic fibrosis" would also catch papers that say things like "unlike cystic fibrosis, this disease..." or papers that briefly mention CF in a list of genetic diseases. MeSH filtering is dramatically more precise.

**Step 2: Species filter.** I specifically needed human research. MeSH helps here too: requiring the "Humans" descriptor filters out the 3% of CF articles that study only animal models. Those are important science, but animal-model researchers don't collaborate with clinical researchers in the same way, and including them would muddy the network.

**Step 3: Publication type filter.** This one needed some thought. PubMed categorizes publications into roughly 80 types, and they're not all equal for understanding collaboration. I wanted original scientific collaboration: journal articles, clinical trials (all phases), observational studies, reviews, meta-analyses, case reports, practice guidelines. These are the publication types where multiple researchers actually *work together* on a shared project.

I explicitly excluded commentaries, letters to the editor, editorials, and news articles (over 2,700 items in total). Why? Because those represent discourse, not collaboration. A letter to the editor listing 2 authors doesn't mean those 2 people actually did research together. Including them would create false collaboration links in the network.

**Step 4: Time window.** The window 2015--2025 was chosen for both data quality and scientific reasons, and these two considerations happen to align nicely:

- **Data quality**: Affiliation coverage in PubMed crosses 80% around 2015. Before that, too many authors lack institutional information for meaningful network analysis. Since I need to know *where* each researcher works (not just *who* they are), going further back would mean losing a huge chunk of the data.
- **Scientific significance**: 2015 marks the approval of Orkambi, the first broadly accessible CFTR modulator. 2019 marks Trikafta. That gives us the two therapeutic eras we need for the before-and-after comparison.

The final filtered set: **11,528 articles, 85,194 author-article pairs, spanning 11 years across two therapeutic eras**.

Here's what the publication volume looks like year by year:

<iframe src="{{ '/assets/plotly/eda_publication_timeline.html' | relative_url }}" frameborder='0' scrolling='no' height="510px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The blue bars (Era 1) are clearly smaller than the orange bars (Era 2). Publication volume increased significantly after Trikafta's approval in 2019. But the trend was already upward in the late Era 1 years, suggesting that the modulator revolution was building momentum even before Trikafta.

And this chart shows how the research themes themselves shifted between eras:

<iframe src="{{ '/assets/plotly/eda_topic_streams.html' | relative_url }}" frameborder='0' scrolling='no' height="560px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

CFTR Modulator topics (blue) surge upward starting around 2019, while infection research (orange) holds relatively steady. Quality of Life research (green) shows a gradual increase across the whole period. This is the two-eras story told through data: the research community literally pivoted its focus.

---

## What the Raw Data Looks Like

Here's a real example of what PubMed gives us for a single article, so you can see what I'm working with:

**PMID 33160331**, a nephrology case report:
- **Authors**: 8 authors, each with name, position (0-indexed, meaning the first author is position 0), initials, and an affiliation text string
- **Affiliations**: Free text like *"The Nephrology Group Inc, 568 E Herndon Ave STE 201, Fresno, CA 93720"*, which mixes institution name, street address, city, state, and zip code into one long string that's basically unparseable by a computer
- **MeSH terms**: 14 descriptors, 3 flagged as major topics (meaning they're central to the paper, not just mentioned)
- **Publication types**: Journal Article, Case Reports

The affiliations are by far the hardest part. They're not structured fields with labeled columns for "institution", "city", "country." They're just whatever the journal's submission system happened to collect when the author submitted the paper. Think of it like trying to extract someone's employer from a string like "John Smith, the guy at the corner building next to the pharmacy on Main Street, 12345" instead of a clean field that says "Employer: Acme Corp."

The variation is staggering. Some affiliations have department hierarchies 7 levels deep ("Division of Pulmonary Medicine, Department of Pediatrics, College of Medicine, University of..."). Some are in French or Turkish or Chinese. Some have email addresses stuck in the middle. Some list 3 different institutions separated by semicolons because the researcher holds multiple appointments. And there are 57,675 distinct affiliation strings in our dataset that all need to be resolved to actual organizations.

Turning all of this into something I can actually analyze is what Parts 2 and 3 are about.

---

## The Extraction Pipeline

With the filters defined in SQL, the extraction pipeline itself is deliberately simple. I'm a firm believer that data pipelines should be boring. The interesting work should happen in the analysis, not in the plumbing.

The pipeline:

1. Connect to PostgreSQL via Unix socket (no passwords flying over the network)
2. Read the SQL filter definitions, which are the source of truth, parameterized with year ranges
3. Run the articles query, save as [Parquet](https://en.wikipedia.org/wiki/Apache_Parquet) (primary format) plus CSV (for eyeballing in a spreadsheet)
4. Run the authors query, save the same way
5. Print summary statistics as a sanity check

The output:
- **11,528 articles** with title, abstract, pub_year, journal, DOI, keywords
- **85,194 author-article pairs** with PMID, author position, name, ORCID, affiliations

I went with Parquet as the primary format on purpose. It's a columnar storage format that preserves data types (integers stay integers, arrays stay arrays), compresses well (20MB CSV becomes 6MB Parquet), and reads about 10x faster than CSV for the kind of column-level queries that downstream analysis needs. CSV is there as a backup for when I want to open something in a spreadsheet to sanity-check it.

---

## What's Next

The raw data has two critical problems that need to be solved before any network analysis is possible:

1. **The institution problem**: 57,675 distinct affiliation strings that need to be resolved to roughly 5,800 actual research organizations. The same hospital shows up as "The Hospital for Sick Children", "SickKids", "Hospital for Sick Children, Toronto", and a dozen other variants. If I don't fix this, one hospital becomes 12 disconnected nodes in the network, and the analysis falls apart.

2. **The author problem**: 42,949 unique name combinations that need to be resolved to about 39,000 actual people. "Wang, X" could be 4 different researchers at 4 different institutions. "Gokcen" and "Gokcen" are the same person with and without Turkish characters. If I get this wrong, I either merge two different people into one (creating fake collaborations) or split one person into two (losing real ones).

Both problems are forms of [entity resolution](https://en.wikipedia.org/wiki/Record_linkage), one of the oldest and hardest problems in data science. Part 2 tackles the institution version using LLM-based affiliation parsing and a geo-search API. Part 3 tackles the author version with a temporal-aware disambiguation algorithm that achieves F1=0.9996 against ground truth.

---

*Next: [Part 2: Resolving 57,000 Affiliation Strings to 5,800 Research Organizations]({% post_url 2026-04-09-cf-research-network-analysis-part2-institution-disambiguation %})*

