---
layout: page
title: "From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration"
description: "A Deep Dive"
permalink: /blog/cf-research-network-analysis/
nav: false
---

What happens to a scientific community when a breakthrough drug transforms an entire disease? This 7-part series explores that question by building a research intelligence platform from scratch, starting from 26 million PubMed articles and ending with graph neural networks running on the collaboration patterns of 39,000 researchers.

The techniques are general, but the case study is specific: Cystic Fibrosis research before and after the approval of Trikafta in 2019. Along the way, we uncover that 62.5% of post-Trikafta collaborations were ones that no pre-existing pattern predicted, that a single researcher at Imperial College London bridges 40 distinct research communities, and that two researchers on opposite sides of the Atlantic have nearly identical "research DNA" but have never met.

---

## The Series

<ol class="series-list">

<li>
<h3><a href="{% post_url 2026-04-09-co-authorship-part1-data-pipeline %}">Building a Real-Time Biomedical Research Intelligence Pipeline</a></h3>
<p>PubMed ETL, PostgreSQL, Prefect orchestration, and filtering 26 million articles down to 11,500 focused on Cystic Fibrosis.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-co-authorship-part2-institution-disambiguation %}">Resolving 57,000 Affiliation Strings to 5,800 Research Organizations</a></h3>
<p>LLM-based affiliation parsing, systematic evaluation of 6 models with MLflow, and geo-search deduplication. Total cost: $82.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-co-authorship-part3-author-disambiguation %}">Disambiguating 43,000 Author Names with Temporal Intelligence</a></h3>
<p>ORCID anchoring, collision-aware matching, temporal career transitions, and achieving F1=0.9996 against ground truth.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-co-authorship-part4-network-structure %}">The Small World of CF Research</a></h3>
<p>Graph construction with position-weighted edges, five centrality measures combined via TOPSIS, Leiden community detection, and the bridge builders connecting 1,231 research communities.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-co-authorship-part5-trikafta-effect %}">The Trikafta Effect: How a Drug Approval Rewired a Research Community</a></h3>
<p>94% edge turnover, Node2Vec counterfactual analysis showing 62.5% of new collaborations were Trikafta-created, sliding window dynamics, and rising stars.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-co-authorship-part6-geography-institutions %}">The Institutional Backbone and Geography of CF Research</a></h3>
<p>Institution networks, academic-industry collaboration (Vertex Pharmaceuticals), founding century analysis via ROR, 46% international corridors, and a global research hub map.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-co-authorship-part7-graph-ml %}">Research DNA, Innovation Catalysts, and Knowledge Diffusion</a></h3>
<p>metapath2vec embeddings on a heterogeneous graph, Research Twins who should be collaborating, innovation brokerage scoring, and tracking how topics spread across 1,688 cities.</p>
</li>

</ol>

