---
layout: page
title: "From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration"
description: "A 7-part series on how one drug approval rewired the Cystic Fibrosis research community. PubMed, LLM-based entity resolution, network analysis, and graph ML."
permalink: /blog/cf-research-network-analysis/
nav: false
---

## The Question That Started It All

What happens to a scientific community when a breakthrough drug transforms an entire disease? Not the clinical outcomes. Those are well-documented. The *human network*. Who starts collaborating with whom? Which institutions rise? Which research topics quietly die, and which ones spring up from nothing?

---

## Cystic Fibrosis: A Disease Transformed

Cystic Fibrosis is a genetic disease caused by mutations in the [CFTR gene](https://en.wikipedia.org/wiki/Cystic_fibrosis_transmembrane_conductance_regulator). For decades, treatment meant managing symptoms: chronic lung infections, nutrition, and lung transplant when things got bad enough. Median survival hovered around 40.

Then the science shifted. Instead of treating symptoms, researchers started going after the underlying molecular defect:

- **2012**: Ivacaftor (Kalydeco), the first CFTR modulator. A real breakthrough, but only for a small percentage of patients with a specific mutation.
- **2015**: Orkambi extended modulator therapy to roughly 50% of patients, those homozygous for the F508del mutation.
- **2019**: Trikafta. The big one. Effective for about 90% of CF patients, with improvements in lung function, nutrition, and quality of life that nobody had seen before.

Imagine a single pill that worked for 90% of diabetics instead of 5%. That is the scale of Trikafta. Median survival projections jumped dramatically, patients came off lung transplant waiting lists, and the research agenda pivoted from "how do we manage decline" to "what does it mean to age with CF."

That pivot is the natural experiment this series runs on. **Era 1 (2015-2018)** is the early-modulator world, still centered on infections, nutrition, and transplant. **Era 2 (2019-2025)** is the Trikafta revolution, pivoting toward long-term outcomes and the minority of patients who don't respond. The project is not really about CF itself. It is about whether the *network of researchers* felt that pivot, and whether graph machine learning can pick it up before traditional bibliometrics can.

Spoiler: it did! By the end of this series, we'll see that a single researcher at Imperial College London bridges **40 research communities** across the globe, that **62.5% of new collaborations** in the post-breakthrough era were ones no pre-existing pattern predicted, and that two researchers on opposite sides of the Atlantic have nearly identical "research DNA" but have never met.

> **Disclaimer:** I am not a medical professional or a Cystic Fibrosis expert. This series is a data science and graph ML project, nothing in it is medical advice. For information about CF or its treatment, consult a qualified healthcare provider or visit the [Cystic Fibrosis Foundation](https://www.cff.org/).

---

## The Road Map

The techniques here are general and apply to any biomedical research community. Cystic Fibrosis earns its role as the case study for three reasons: its recent therapeutic history is an extraordinary natural experiment, its corpus (roughly 11,500 articles and 39,000 researchers) is big enough to show rich network structure but small enough to iterate on from a single workstation, and its research community is tight-knit enough to make the human stories behind the graph worth telling.

The series splits cleanly into two halves. Parts 1 to 3 build the raw material: ingesting [PubMed](https://pubmed.ncbi.nlm.nih.gov/), cleaning the institutions into a master list, and disambiguating the authors into a second one. Parts 4 to 7 turn those two lists into a collaboration graph and run the analyses, starting with the raw structure of the network and ending with [graph neural networks](https://en.wikipedia.org/wiki/Graph_neural_network) on a heterogeneous researcher-topic-institution graph.

**Part I · From messy PubMed to a clean collaboration graph**

<ul class="series-list">

<li>
<h3><a href="{% post_url 2026-04-09-cf-research-network-analysis-part1-data-pipeline %}">Part 1: Building the Data Flywheel for CF Research Network Analysis</a></h3>
<p>A weekly-refreshing local mirror of PubMed, and a three-step filter funnel that distills 26 million indexed articles down to the 11,528 Cystic Fibrosis papers the rest of the series stands on. The plumbing post: quick on findings, honest about the trade-offs.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-cf-research-network-analysis-part2-institution-disambiguation %}">Part 2: From Messy Affiliations to a Master List of Institutions with LLMs</a></h3>
<p>Traditional entity resolution tops out near 58% consistency on 97,000 free-text affiliation strings. A structured-output LLM pipeline, an MLflow-tracked eval across six models from three providers, and a geo-search dedup step drive that pile down to 5,799 real research organizations.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-cf-research-network-analysis-part3-author-disambiguation %}">Part 3: From Ambiguous Author Names to a Master List of Researchers with Temporal Intelligence</a></h3>
<p>"Wang, X" is four different researchers. "Gökçen" and "Gokcen" are the same person. Almost a third of CF researchers published from more than one institution during the decade, a pattern naive algorithms mistake for two different people. A collision-aware matching rule and a five-year mobility window, both calibrated from real ORCID data, turn 85,000 author mentions into 39,206 unique researchers with full affiliation timelines.</p>
</li>

</ul>

**Part II · Reading the network**

<ul class="series-list">

<li>
<h3><a href="{% post_url 2026-04-09-cf-research-network-analysis-part4-network-structure %}">Part 4: The Small World of CF Research</a></h3>
<p>With the graph finally built, the structural portrait comes into focus: a small-world network of 1,231 research communities glued together by a handful of bridge builders, including one researcher at Imperial College London who sits on 40 of them at once.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-cf-research-network-analysis-part5-trikafta-effect %}">Part 5: The Trikafta Effect: How a Drug Approval Rewired a Research Community</a></h3>
<p>In a typical scientific field, 20 to 30% of collaboration edges turn over each year. The post-Trikafta CF network saw 94%. A Node2Vec-based counterfactual shows that 62.5% of the new collaborations were genuinely unpredictable from pre-2019 patterns: a single drug approval rewired the graph.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-cf-research-network-analysis-part6-geography-institutions %}">Part 6: The Institutional Backbone and Geography of CF Research</a></h3>
<p>46% of institution-to-institution edges cross a national border. A founding-era analysis via ROR shows that 19th-century institutions still carry an outsized share of the output, while academic-industry corridors, most visibly Vertex Pharmaceuticals, trace the flow of translational work from the lab into the clinic.</p>
</li>

<li>
<h3><a href="{% post_url 2026-04-09-cf-research-network-analysis-part7-graph-ml %}">Part 7: Research DNA, Innovation Catalysts, and Knowledge Diffusion</a></h3>
<p>A heterogeneous graph of researchers, topics, journals, and institutions, trained with metapath2vec embeddings, surfaces Research Twins: pairs of scientists with nearly identical research DNA who have never co-authored. Innovation brokerage scoring picks out the people who pull new ideas across community lines, and a topic-diffusion analysis across 1,688 cities shows why COVID-19 reached everywhere in months while CFTR modulators are still percolating.</p>
</li>

</ul>

---

*Acknowledgments: I'm grateful to Prof. [Jure Leskovec](https://profiles.stanford.edu/jure-leskovec) ([CS224W: Machine Learning with Graphs](https://web.stanford.edu/class/cs224w/)) and Prof. [Chris Potts](https://profiles.stanford.edu/christopher-potts) ([CS224U: Natural Language Understanding](https://web.stanford.edu/class/cs224u/)) at Stanford, whose courses gave me the foundation to take on a project like this.*
