---
layout: page
title: "From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration"
description: "A 7-part series analyzing Cystic Fibrosis co-authorship networks from PubMed data using graph ML, generative AI, NLP, and network analysis."
permalink: /blog/cf-research-network-analysis/
nav: false
---

> **Disclaimer:** I am not a medical professional or a Cystic Fibrosis expert. This blog series is a data science and graph ML project. Nothing in this series should be construed as medical advice. For information about CF or its treatment, consult a qualified healthcare provider or visit the [Cystic Fibrosis Foundation](https://www.cff.org/).

---

## The Question That Started It All

What happens to a scientific community when a breakthrough drug transforms an entire disease? I don't mean the clinical outcomes. Those are well-documented. I'm talking about the *human network*. Who starts collaborating with whom? Which institutions rise? Which research topics quietly die, and which ones spring up from nothing?

These aren't abstract questions. By the end of this series, I'll show you that a single researcher at Imperial College London bridges **40 distinct research communities** across the globe. That **62.5% of new collaborations** in the post-breakthrough era were ones that no pre-existing pattern predicted. And that two researchers on opposite sides of the Atlantic have nearly identical "research DNA" but have never met.

I'd been sitting on these questions for a while, looking for the right problem to dig into with some graph ML and NLP techniques I'd been picking up. I wanted something where the data was messy, the domain was rich, and the results might actually tell us something new. Biomedical co-authorship networks turned out to be exactly that kind of problem.

---

## What This Series Covers

This is a multi-part deep dive into building a research intelligence platform from scratch, starting from 26 million [PubMed](https://pubmed.ncbi.nlm.nih.gov/) articles and ending with [graph neural networks](https://en.wikipedia.org/wiki/Graph_neural_network) running on the collaboration patterns of 39,000 researchers. Each part tackles a different data science challenge:

| Part | Challenge |
|------|-----------|
| [**Part 1**]({% post_url 2026-04-09-cf-research-network-analysis-part1-data-pipeline %}) | Building the data pipeline: PubMed ETL, PostgreSQL, and filtering 26M articles down to a focused research community |
| [**Part 2**]({% post_url 2026-04-09-cf-research-network-analysis-part2-institution-disambiguation %}) | Resolving 57,000 messy affiliation strings to 5,800 canonical research organizations using LLMs and systematic evaluation |
| [**Part 3**]({% post_url 2026-04-09-cf-research-network-analysis-part3-author-disambiguation %}) | Disambiguating 43,000 author names into 39,000 real people using temporal-aware [entity resolution](https://en.wikipedia.org/wiki/Record_linkage) (F1=0.9996) |
| [**Part 4**]({% post_url 2026-04-09-cf-research-network-analysis-part4-network-structure %}) | Building the co-authorship network, finding research communities, and ranking the most influential researchers |
| [**Part 5**]({% post_url 2026-04-09-cf-research-network-analysis-part5-trikafta-effect %}) | How a breakthrough drug approval rewired the entire collaboration network |
| [**Part 6**]({% post_url 2026-04-09-cf-research-network-analysis-part6-geography-institutions %}) | The geography and institutional backbone of research, including which century these institutions were founded |
| [**Part 7**]({% post_url 2026-04-09-cf-research-network-analysis-part7-graph-ml %}) | Graph ML innovations: research embeddings, innovation catalysts, and tracking how knowledge spreads across cities |

The techniques here are general. They apply to any biomedical research community, any disease, any time period. I chose Cystic Fibrosis as the case study for three reasons. First, its recent therapeutic history provides an extraordinary natural experiment: a before-and-after moment that lets us see how a single drug approval reshapes an entire field. Second, its research community is large enough to show complex network structure but small enough (about 11,500 articles, roughly 39,000 researchers) to keep computation and iteration manageable. Compare that with oncology or cardiovascular disease, where you'd be dealing with hundreds of thousands of papers and millions of author-article pairs. And third, CF has a passionate, well-organized research community that makes the human stories behind the network genuinely compelling.

---

## Why Cystic Fibrosis: A Disease Transformed

Cystic Fibrosis is a genetic disease caused by mutations in the [CFTR gene](https://en.wikipedia.org/wiki/Cystic_fibrosis_transmembrane_conductance_regulator). For decades, treatment was all about managing symptoms: fighting chronic lung infections, maintaining nutrition, and when things got bad enough, lung transplant. The median survival age hovered around 40.

Then the science shifted. Instead of treating symptoms, researchers started going after the underlying molecular defect itself:

- **2012**: Ivacaftor (Kalydeco), the first CFTR modulator. A real breakthrough, but it only worked for about 5% of patients who carried a specific mutation.
- **2015**: Lumacaftor/ivacaftor (Orkambi) extended modulator therapy to roughly 50% of CF patients, specifically those homozygous for the most common mutation, F508del.
- **2019**: Elexacaftor/tezacaftor/ivacaftor (Trikafta). This was the big one. Effective for about 90% of CF patients. Clinical trials showed improvements in lung function, nutritional status, and quality of life that nobody had seen before.

To put the scale of Trikafta in perspective: imagine if a single pill suddenly worked for 90% of diabetics instead of 5%. That's the kind of shift we're talking about. Median survival projections jumped dramatically. Patients who had been on lung transplant waiting lists improved enough to be delisted. The entire research agenda started to pivot, from "how do we manage decline?" to "what does it mean to age with CF?"

This gives us two natural eras for network analysis:
- **Era 1 (2015-2018)**: Early modulators. The research community is still primarily organized around managing symptoms: infections, nutrition, transplant.
- **Era 2 (2019-2025)**: The Trikafta revolution. Research pivots toward long-term outcomes, new complications of extended survival, and the subset of patients who don't respond to modulators.

The question driving this project isn't really about CF itself. It's about what the *network of researchers* can tell us. Did the breakthrough rewire who collaborates with whom? Did new research communities form? Did old ones dissolve? Can [graph machine learning](https://en.wikipedia.org/wiki/Graph_neural_network) pick up on these shifts before traditional bibliometrics can?

Spoiler: the answer to all of those is yes. The data tells a remarkable story.
