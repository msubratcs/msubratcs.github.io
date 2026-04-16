---
layout: page
title: "Mapping the Cystic Fibrosis Research Community"
description: "A 7-part series on the Cystic Fibrosis research community: PubMed ingestion, LLM-based entity resolution, co-authorship network analysis, graph machine learning, and a topic-diffusion map across 1,688 cities."
permalink: /blog/cf-research-network-analysis/
nav: false
---

## The Questions That Started It All

This series treats a decade of Cystic Fibrosis research as a data set and asks what you can learn about a scientific community by looking only at its *human network*. Five questions guide the work:

- Who collaborates with whom in CF research, and how tightly knit is the field once you draw the graph?
- Which institutions and cities anchor the work today, and which ones are quietly on the rise?
- How does a research community evolve when a major therapeutic shift (Trikafta, in this case) arrives in the middle of the timeline?
- How do new ideas -- pandemics, modulators, resistant infections -- spread across the globe, and why do some reach everyone in months while others take decades?
- Does graph machine learning add information that standard bibliometric measures miss?

None of these questions need a medical answer. They need a map of the people doing the science.

---

## Cystic Fibrosis: Why This Community?

Cystic Fibrosis is a genetic disease caused by mutations in the [CFTR gene](https://en.wikipedia.org/wiki/Cystic_fibrosis_transmembrane_conductance_regulator). The techniques in this series are general and apply to any biomedical research community, but CF makes for an unusually rich case study: the corpus (roughly 11,500 articles, 39,000 researchers) is big enough to show real network structure but small enough to iterate on from a single workstation, and the field is tight-knit enough that the human stories behind the graph are worth telling.

It also comes with a natural experiment baked into the timeline. The therapeutic landscape pivoted three times in one decade: **Ivacaftor (2012)** for a small subset of patients, **Orkambi (2015)** for roughly half, and **Trikafta (2019)** for about 90% of CF patients, with clinical benefits nobody had seen before. That last one is one of several inflection points the series tracks, and it powers the Era 1 (2015-2018) vs Era 2 (2019-2025) comparison in [Part 5]({% post_url 2026-04-12-cf-research-network-analysis-part5-trikafta-effect %}). The other six parts each ask their own questions -- about data pipelines, entity resolution, network structure, institutional geography, embeddings, and knowledge diffusion -- that don't need the Trikafta lens at all.

**A note:** I am not a medical professional or a Cystic Fibrosis expert. This series is a data science and graph ML project; nothing in it is medical advice. For information about CF or its treatment, consult a qualified healthcare provider or visit the [Cystic Fibrosis Foundation](https://www.cff.org/).

**Who this is for.** The series should be useful to anyone interested in entity resolution at scale, co-authorship network analysis, applied LLM systems, bibliometrics, or how scientific communities organize themselves. CF is the case study, but the methods and trade-offs are general. You do not need a biomedical background to follow along.

Below is a taste of what the seven parts together actually turn up:

> **Spoiler highlights:**
> - A three-step filter funnel distills **26 million** PubMed articles down to **11,528** CF-specific papers ([Part 1]({% post_url 2026-04-12-cf-research-network-analysis-part1-data-pipeline %})).
> - An LLM-based entity-resolution pipeline beats five traditional baselines that top out near 58% consistency, cleaning **50,981** messy affiliation strings for about **\$82** end-to-end ([Part 2]({% post_url 2026-04-12-cf-research-network-analysis-part2-institution-disambiguation %})).
> - One researcher at Imperial College London sits on **40 Leiden communities** at once, playing an unusually central brokerage role in the CF field ([Part 4]({% post_url 2026-04-12-cf-research-network-analysis-part4-network-structure %})).
> - Even among researchers who were already active before 2019, **62.5%** of their new post-Trikafta partnerships don't fit pre-Trikafta network dynamics ([Part 5]({% post_url 2026-04-12-cf-research-network-analysis-part5-trikafta-effect %})).
> - **46%** of institutional collaboration edges cross a national border, and pre-1900 universities still own nearly half of CF output ([Part 6]({% post_url 2026-04-12-cf-research-network-analysis-part6-geography-institutions %})).
> - Two researchers on opposite sides of the Atlantic have nearly identical topic profiles in a 128-dim metapath2vec embedding space but have never co-authored, and COVID-19 reached **277 cities** in two years while CFTR modulators are still percolating after more than a decade ([Part 7]({% post_url 2026-04-12-cf-research-network-analysis-part7-graph-ml %})).

---

## The Road Map

The series splits cleanly into two halves. The first half is **data engineering**: Parts 1 to 3 ingest [PubMed](https://pubmed.ncbi.nlm.nih.gov/), build a master list of institutions, and disambiguate the authors into a second master list of researchers. The second half is **analysis**: Parts 4 to 7 turn those two lists into a collaboration graph and measure its structure, its response to Trikafta, its institutional geography, and its latent structure via graph embeddings.

**Part I · From messy PubMed to a clean collaboration graph**

<ul class="series-list">

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part1-data-pipeline %}">Part 1: Building the Data Flywheel for CF Research Network Analysis</a></h3>
<p>PubMed indexes 26 million articles. A three-step filter funnel distills them down to the 11,528 CF papers the rest of the series stands on.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part2-institution-disambiguation %}">Part 2: From Messy Affiliations to a Master List of Institutions with LLMs</a></h3>
<p>97,000 free-text affiliation strings need to resolve to real institutions. A structured-output LLM pipeline, evaluated across six models, drives them down to 5,799 geocoded organizations for about $82.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part3-author-disambiguation %}">Part 3: From Ambiguous Author Names to a Master List of Researchers with Temporal Intelligence</a></h3>
<p>Nearly a third of CF researchers changed institutions during the decade, and naive name matching mistakes career moves for different people. A temporal-aware disambiguation algorithm turns 85,000 author mentions into 39,206 unique researchers at F1 = 0.9996.</p>
</li>

</ul>

**Part II · Mining the network for insight**

<ul class="series-list">

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part4-network-structure %}">Part 4: The Small World of CF Research</a></h3>
<p>The co-authorship graph turns out to be a small-world network with 1,231 communities. Five centrality measures fused via TOPSIS rank influence, and 14.2% of researchers bridge two or more communities.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part5-trikafta-effect %}">Part 5: The Trikafta Effect: How a Drug Approval Rewired a Research Community</a></h3>
<p>94% of post-Trikafta collaboration pairs are new. A Node2Vec counterfactual measures how much of that rewiring follows pre-2019 dynamics and how much does not.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part6-geography-institutions %}">Part 6: The Institutional Backbone and Geography of CF Research</a></h3>
<p>A bipartite projection yields a 5,628-institution network where 46% of edges cross a national border. Pre-1900 universities still account for nearly half of CF output.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-12-cf-research-network-analysis-part7-graph-ml %}">Part 7: Topic-Profile Embeddings, Structural Brokerage, and Topic Diffusion</a></h3>
<p>metapath2vec embeddings over a heterogeneous graph encode each researcher's topic profile. Three analyses test what graph ML adds: high-similarity non-collaborator pairs, a structural brokerage score, and a topic-diffusion map across 1,688 cities.</p>
</li>

</ul>

---

## Acknowledgments

This project only exists because a lot of other people did the hard work first and made it public. I'm grateful to [Ryan Sowers](https://www.linkedin.com/in/rhsowers/), who provided all the inspiration for this work, and to Prof. [Jure Leskovec](https://profiles.stanford.edu/jure-leskovec) ([CS224W: Machine Learning with Graphs](https://web.stanford.edu/class/cs224w/)) and Prof. [Chris Potts](https://profiles.stanford.edu/christopher-potts) ([CS224U: Natural Language Understanding](https://web.stanford.edu/class/cs224u/)), whose courses gave me the foundation to take on a project like this. The series also stands on:

- **Data sources**: [PubMed / NCBI](https://pubmed.ncbi.nlm.nih.gov/) for the literature, [MeSH](https://www.nlm.nih.gov/mesh/meshhome.html) for topic vocabulary, [ORCID](https://orcid.org/) for author identity, and the [Research Organization Registry (ROR)](https://ror.org/) for institution identity.
- **LLM and API providers**: OpenAI, Anthropic, and Google for the models used in the Part 2 entity-resolution eval; Google Places for geocoding institutions.
- **Open-source tooling**: [Prefect](https://www.prefect.io/) for the ETL pipeline, [MLflow](https://mlflow.org/) for experiment tracking, [NetworkX](https://networkx.org/) and [python-igraph](https://python.igraph.org/) for the graph work, [PyTorch Geometric](https://pytorch-geometric.readthedocs.io/) for metapath2vec, [UMAP](https://umap-learn.readthedocs.io/) for dimensionality reduction, and [Plotly](https://plotly.com/python/) for the interactive charts.
