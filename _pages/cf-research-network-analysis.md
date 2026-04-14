---
layout: page
title: "Mapping the Cystic Fibrosis Research Community: A Data Science Deep Dive"
description: "A 7-part data science deep dive into the Cystic Fibrosis research community: PubMed ingestion, LLM-based entity resolution, network analysis, graph machine learning, and a topic-diffusion map across 1,688 cities."
permalink: /blog/cf-research-network-analysis/
nav: false
---

## The Questions That Started It All

This series treats a decade of Cystic Fibrosis research as a data set and asks what you can learn about a scientific community by looking only at its *human network*. Five questions guide the work:

- Who collaborates with whom in CF research, and how tightly knit is the field once you draw the graph?
- Which institutions and cities anchor the work today, and which ones are quietly on the rise?
- How does a research community evolve when a generational drug — Trikafta, in this case — arrives in the middle of the timeline?
- How do new ideas — pandemics, modulators, resistant infections — spread across the globe, and why do some reach everyone in months while others take decades?
- Can graph machine learning surface latent connections and innovation brokers that traditional bibliometrics miss?

None of these questions need a medical answer. They need a map of the people doing the science.

---

## Cystic Fibrosis: Why This Community?

Cystic Fibrosis is a genetic disease caused by mutations in the [CFTR gene](https://en.wikipedia.org/wiki/Cystic_fibrosis_transmembrane_conductance_regulator). The techniques in this series are general and apply to any biomedical research community, but CF makes for an unusually rich case study: the corpus (roughly 11,500 articles, 39,000 researchers) is big enough to show real network structure but small enough to iterate on from a single workstation, and the field is tight-knit enough that the human stories behind the graph are worth telling.

It also comes with a natural experiment baked into the timeline. The therapeutic landscape pivoted three times in one decade — **Ivacaftor (2012)** for a small subset of patients, **Orkambi (2015)** for roughly half, and **Trikafta (2019)** for about 90% of CF patients, with clinical benefits nobody had seen before. That last one is one of several inflection points the series tracks, and it powers the Era 1 (2015-2018) vs Era 2 (2019-2025) comparison in [Part 5]({% post_url 2026-04-12-cf-research-network-analysis-part5-trikafta-effect %}). The other six parts each ask their own questions — about data pipelines, entity resolution, network structure, institutional geography, embeddings, and knowledge diffusion — that don't need the Trikafta lens at all.

Below is a taste of what the seven parts together actually turn up:

> **Spoiler highlights:**
> - A three-step filter funnel distills **26 million** PubMed articles down to **11,528** CF-specific papers ([Part 1]({% post_url 2026-04-12-cf-research-network-analysis-part1-data-pipeline %})).
> - An LLM-based entity-resolution pipeline beats five traditional baselines that top out near 58% consistency, cleaning **50,981** messy affiliation strings for about **\$82** end-to-end ([Part 2]({% post_url 2026-04-12-cf-research-network-analysis-part2-institution-disambiguation %})).
> - One researcher at Imperial College London sits on **40 Leiden communities** at once, holding a surprisingly large chunk of the CF field together ([Part 4]({% post_url 2026-04-12-cf-research-network-analysis-part4-network-structure %})).
> - Even among researchers who were already active before 2019, **62.5%** of their new post-Trikafta partnerships don't fit pre-Trikafta network dynamics ([Part 5]({% post_url 2026-04-12-cf-research-network-analysis-part5-trikafta-effect %})).
> - **46%** of institutional collaboration edges cross a national border, and pre-1900 universities still own nearly half of CF output ([Part 6]({% post_url 2026-04-12-cf-research-network-analysis-part6-geography-institutions %})).
> - Two researchers on opposite sides of the Atlantic have nearly identical "Research DNA" in a 128-dim metapath2vec embedding space but have never co-authored — and COVID-19 reached **277 cities** in two years while CFTR modulators are still percolating after more than a decade ([Part 7]({% post_url 2026-04-12-cf-research-network-analysis-part7-graph-ml %})).

> **Disclaimer:** I am not a medical professional or a Cystic Fibrosis expert. This series is a data science and graph ML project, nothing in it is medical advice. For information about CF or its treatment, consult a qualified healthcare provider or visit the [Cystic Fibrosis Foundation](https://www.cff.org/).

---

## The Road Map

The series splits cleanly into two halves. The first half is **data engineering**: Parts 1 to 3 ingest [PubMed](https://pubmed.ncbi.nlm.nih.gov/), build a master list of institutions, and disambiguate the authors into a second master list of researchers. The second half is **analysis**: Parts 4 to 7 turn those two lists into a collaboration graph and work through its structure, its temporal response to Trikafta, its institutional geography, and finally its latent structure via [metapath2vec](https://ericdongyx.github.io/papers/KDD17-dong-chawla-swami-metapath2vec.pdf) embeddings over a heterogeneous researcher-paper-topic-journal-institution graph.

**Part I · From messy PubMed to a clean collaboration graph**

<ul class="series-list">

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part1-data-pipeline %}">Part 1: Building the Data Flywheel for CF Research Network Analysis</a></h3>
<p>A weekly-refreshing local mirror of PubMed, and a three-step filter funnel that distills 26 million indexed articles down to the 11,528 Cystic Fibrosis papers the rest of the series stands on. The plumbing post: quick on findings, honest about the trade-offs.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part2-institution-disambiguation %}">Part 2: From Messy Affiliations to a Master List of Institutions with LLMs</a></h3>
<p>Traditional entity resolution tops out near 58% consistency on 97,000 free-text affiliation strings. A structured-output LLM pipeline, an MLflow-tracked eval across six models from three providers, and a geo-search dedup step drive that pile down to 5,799 real research organizations.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part3-author-disambiguation %}">Part 3: From Ambiguous Author Names to a Master List of Researchers with Temporal Intelligence</a></h3>
<p>"Wang, X" is four different researchers. "Gökçen" and "Gokcen" are the same person. Almost a third of CF researchers published from more than one institution during the decade, a pattern naive algorithms mistake for two different people. A collision-aware matching rule and a five-year mobility window, both calibrated from real ORCID data, turn 85,000 author mentions into 39,206 unique researchers with full affiliation timelines.</p>
</li>

</ul>

**Part II · Mining the network for insight**

<ul class="series-list">

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part4-network-structure %}">Part 4: The Small World of CF Research</a></h3>
<p>With the graph finally built, the structural portrait comes into focus: a small-world network of 1,231 Leiden communities, five centrality measures fused via TOPSIS to rank influence across local clusters and global connectors alike, and a handful of bridge builders holding the field together &mdash; including one researcher at Imperial College London who sits on 40 communities at once.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part5-trikafta-effect %}">Part 5: The Trikafta Effect: How a Drug Approval Rewired a Research Community</a></h3>
<p>94% of the collaboration pairs in the post-Trikafta CF network didn't exist before 2019. A Node2Vec-based counterfactual, scoring only the subset of new edges where both researchers were already active in Era 1, finds that 62.5% of those partnerships don't fit pre-Trikafta network dynamics &mdash; and two-thirds of the dissolved ones "should" still be going.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part6-geography-institutions %}">Part 6: The Institutional Backbone and Geography of CF Research</a></h3>
<p>A bipartite projection of the researcher graph yields a 5,628-institution backbone where 46% of edges cross a national border. ROR enrichment dates 937 organizations and shows that pre-1900 universities still own nearly half of CF output, while the strongest international corridors are overwhelmingly Anglophone and Vertex Pharmaceuticals is the only industry player operating at scale.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part7-graph-ml %}">Part 7: Research DNA, Innovation Catalysts, and Knowledge Diffusion</a></h3>
<p>A 60,000-node heterogeneous graph of researchers, papers, topics, journals, and institutions, with metapath2vec walked along Author-Paper-Topic-Paper-Author to encode each scientist as a 128-dim "Research DNA" vector. The embedding surfaces Research Twins (pairs with nearly identical topic profiles who have never co-authored), a four-signal Innovation Brokerage Score blends Shannon-entropy topic diversity with Burt's structural holes to find the people who pull new ideas across community lines, and a topic-diffusion analysis across 1,688 cities shows why COVID-19 reached everywhere in months while CFTR modulators are still percolating.</p>
</li>

</ul>

---

## Acknowledgments

This project only exists because a lot of other people did the hard work first and made it public. I'm grateful to Prof. [Jure Leskovec](https://profiles.stanford.edu/jure-leskovec) ([CS224W: Machine Learning with Graphs](https://web.stanford.edu/class/cs224w/)) and Prof. [Chris Potts](https://profiles.stanford.edu/christopher-potts) ([CS224U: Natural Language Understanding](https://web.stanford.edu/class/cs224u/)), whose courses gave me the foundation to take on a project like this. The series also stands on:

- **Data sources**: [PubMed / NCBI](https://pubmed.ncbi.nlm.nih.gov/) for the literature, [MeSH](https://www.nlm.nih.gov/mesh/meshhome.html) for topic vocabulary, [ORCID](https://orcid.org/) for author identity, and the [Research Organization Registry (ROR)](https://ror.org/) for institution identity.
- **LLM and API providers**: OpenAI, Anthropic, and Google for the models used in the Part 2 entity-resolution eval; Google Places for geocoding institutions.
- **Open-source tooling**: [Prefect](https://www.prefect.io/) for the ETL pipeline, [MLflow](https://mlflow.org/) for experiment tracking, [NetworkX](https://networkx.org/) and [python-igraph](https://python.igraph.org/) for the graph work, [PyTorch Geometric](https://pytorch-geometric.readthedocs.io/) for metapath2vec, [UMAP](https://umap-learn.readthedocs.io/) for dimensionality reduction, and [Plotly](https://plotly.com/python/) for the interactive charts that hopefully make the findings easier to explore than they were to compute.
