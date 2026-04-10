---
layout: post
title: "Research DNA, Innovation Catalysts, and Knowledge Diffusion"
date: 2026-04-09 21:00:00
description: "Part 7: metapath2vec embeddings, Research Twins, brokerage scoring, and topic diffusion across 1,688 cities"
tags: [co-authorship, graph-ml, metapath2vec, embeddings, knowledge-diffusion]
categories: data-science
series_part: true
giscus_comments: false
related_posts: false
toc:
  sidebar: left
---

> *Part 7 of the series: **[From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration: A Deep Dive](/blog/co-authorship-series/)***

---

This is the part I've been building toward since Part 1. Everything before this, the data pipeline, the disambiguation, the network construction, was infrastructure. Now I get to apply graph machine learning techniques to uncover things that traditional research metrics simply can't see.

Three analyses, each answering a different question:
1. Who are the "Research Twins" who should be collaborating but aren't?
2. Who is best positioned to catalyze the *next* breakthrough?
3. How does research knowledge spread across the globe?

---

## 1. Research DNA Embeddings: Finding Your Scientific Twin

### The Idea

Traditional co-authorship analysis captures one dimension: who works with whom. But a researcher's identity is richer than their list of collaborators. It includes *what* they study (MeSH topics), *where* they publish (journals), *where* they work (institutions), and *who* they work with (co-authors).

I wanted a way to encode all of these dimensions into a single numerical fingerprint, a kind of "Research DNA" for each of the 39,206 researchers. Two researchers with similar DNA would be doing similar work, even if they'd never met.

### Building the Heterogeneous Graph

A regular [graph](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)) has one type of node and one type of edge. A [heterogeneous information network](https://en.wikipedia.org/wiki/Heterogeneous_information_network) (HIN) has multiple types of both. Think of it this way: a simple co-authorship graph is like a phone network where everyone is just "a person" and every connection is "called each other." A heterogeneous graph is more like a real social system where there are people, companies, topics, and locations, all connected by different kinds of relationships.

I built a HIN with five node types and four edge types:

```
Author (39,206)  --authored-->      Paper (11,500)
Paper            --tagged_with-->   MeSH Topic (2,094)
Paper            --published_in-->  Journal (1,601)
Author           --affiliated-->    Institution (5,799)
```

This single graph encodes the full research identity of every author. It captures not just who collaborates with whom, but what they study (through shared MeSH topics), where they publish (through shared journals), and where they're based (through institutional affiliation). The total graph has about 58,000 nodes and over 200,000 edges across the four relationship types.

### metapath2vec: Learning Research Fingerprints

To learn embeddings from this heterogeneous graph, I used [metapath2vec](https://ericdongyx.github.io/metapath2vec/m2v.html), a method designed specifically for heterogeneous networks. It's an extension of the [Word2Vec](https://en.wikipedia.org/wiki/Word2vec) idea (which learns word meanings from the company they keep in sentences) applied to graphs.

Here's how it works. I define a "metapath," a recipe for walking through the graph that follows a specific sequence of node types:

**Author -> Paper -> MeSH Topic -> Paper -> Author**

The algorithm performs thousands of random walks following this recipe. Starting at a researcher, it hops to one of their papers, then to a MeSH topic on that paper, then to *another* paper with the same topic, then to that paper's author. By doing this over and over (20 walks per node, each 10 steps long), the algorithm collects evidence about which researchers appear in similar "contexts."

The key insight: two researchers who frequently appear at the end of these walks from similar starting points are doing similar research, even if they've never directly collaborated. The algorithm compresses all of this context information into a compact 128-dimensional vector for each researcher.

Think of it like this: if you told me "this researcher appears in the context of Pseudomonas topics, pediatric pulmonology journals, and European hospital affiliations," I'd have a pretty good picture of their research profile. Metapath2vec automates that intuition across all 39,206 researchers simultaneously.

I trained the embeddings over 5 epochs with 20 walks per node. The training took about 20 minutes on CPU.

### The UMAP Landscape

128 dimensions are impossible for humans to visualize, so I used [UMAP](https://en.wikipedia.org/wiki/Nonlinear_dimensionality_reduction#Uniform_manifold_approximation_and_projection) (Uniform Manifold Approximation and Projection) to squash those 128 dimensions down to 2 for plotting. UMAP is a [dimensionality reduction](https://en.wikipedia.org/wiki/Dimensionality_reduction) technique that preserves the local neighborhood structure of the data: researchers who are close in 128 dimensions stay close in 2 dimensions.

<iframe src="{{ '/assets/plotly/tier7_embedding_umap.html' | relative_url }}" frameborder='0' scrolling='no' height="600px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
*Hover over any point to see the researcher's name, institution, and country.*

The result is striking. The communities detected by the Leiden algorithm back in Part 4 map cleanly onto the embedding space, even though the embeddings were learned independently. Researchers in the same community cluster together, confirming that the embeddings are capturing real structure. But the embeddings also reveal something the Leiden communities don't: gradients *between* communities. Researchers who work at the boundary of two topics (say, infection research and modulator therapy) appear in the transition zones between clusters, exactly where you'd expect to find interdisciplinary researchers.

### Research Twins: Who Should Be Collaborating But Isn't?

Here's the payoff. For each researcher with at least 3 publications, I found their [nearest neighbor](https://en.wikipedia.org/wiki/K-nearest_neighbors_algorithm) in embedding space who they've *never co-authored with*. These are "Research Twins": people doing remarkably similar work in different parts of the world who've somehow never connected.

| Twin Pair | Similarity | Articles | Countries |
|-----------|-----------|----------|-----------|
| Michael D. Parkins / Edith T. Zemanick | 0.535 | 49 / 59 | CA / US |
| Lucas R. Hoffman / Tacjana Pressler | 0.522 | 51 / 51 | US / DK |
| Marianne Skov / Don B. Sanders | 0.501 | 39 / 59 | DK / US |
| Julia C. Emerson / Loic Guillot | 0.500 | 9 / 20 | US / FR |
| Bradley S. Quon / Quitterie Reynaud | 0.498 | 73 / 83 | CA / FR |
| Valerie J. Waters / Joanna B. Goldberg | 0.495 | 75 / 30 | CA / US |

A note on the similarity scores: they range from 0 (completely different research profiles) to 1 (identical). A score of 0.535 means these two researchers are more similar to each other than to the vast majority of the 39,206 researchers in the network. For comparison, researchers who actually co-author together typically have similarities around 0.6-0.8. So 0.535 for two people who've *never* met is remarkably high.

Parkins (Calgary, Canada) and Zemanick (Colorado, US) have the highest twin similarity. Both work on CF microbiology and pulmonary infections, publish in similar journals, and have similar-sized collaboration networks. The embedding sees them as near-identical in terms of their research profile. They're just a 3-hour flight apart.

The Hoffman/Pressler pair is particularly interesting because it crosses the Atlantic: a US-based microbiologist paired with a Danish clinician. Their research profiles are nearly identical despite working in completely different healthcare systems on different continents.

Why does this matter? For a funding agency like the CF Foundation, this list is a concrete starting point for catalyzing new collaborations between researchers with the highest chance of productive partnership. Traditional approaches to matchmaking (conferences, personal introductions) are hit-or-miss. This is a data-driven approach based on the structure of the entire research network.

---

## 2. Innovation Catalysts: Who Enables Breakthroughs?

### Beyond Betweenness

[Betweenness centrality](https://en.wikipedia.org/wiki/Betweenness_centrality) from Part 4 tells us who bridges different groups. But bridging isn't the same as catalyzing innovation. A researcher might bridge two communities simply because they serve on a lot of clinical trial steering committees without doing any creative cross-pollination of ideas.

I wanted to identify researchers who are structurally positioned to enable *new combinations of ideas*, the kind of recombinant innovation that leads to breakthroughs. The theory behind this comes from sociologist [Ronald Burt's work on structural holes](https://en.wikipedia.org/wiki/Structural_holes): people who bridge disconnected groups have access to non-redundant information, which gives them an advantage in generating novel ideas.

### The Brokerage Score

I combined four signals into a composite Innovation Brokerage Score:

1. **Topic diversity** (30% weight): Measured using [Shannon entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory)) of each researcher's MeSH topic distribution. A researcher who publishes across 20 different topics has higher entropy than one who focuses on 3. Topic diversity ranges from around 1 (narrow specialist) to 4.5+ (extreme generalist). Think of it as: how wide is your research menu?

2. **Topic novelty** (25% weight): How often does a researcher bridge *unusual* topic combinations? Measured as the average rarity of topic pairs across their papers. If most of your papers combine topics that rarely appear together (say, "mental health" and "CFTR modulators"), you're producing novel combinations that might spark new ideas. This captures *what* you combine, not just *how much* you cover.

3. **[Structural holes](https://en.wikipedia.org/wiki/Structural_holes)** (25% weight): Burt's effective size metric. If your collaborators all collaborate with each other, you're in a clique with no structural holes. There's nothing unique flowing through you. But if your collaborators *don't* know each other, you're the only bridge between them, controlling unique information pathways. A researcher with an effective size of 742 (like Jane Davies) means she has 742 "non-redundant" connections: people she connects who wouldn't otherwise be connected.

4. **Betweenness centrality** (20% weight): The classic network bridging measure from Part 4, included to capture positional importance in the overall network topology.

### The Top Innovation Catalysts

<iframe src="{{ '/assets/plotly/tier7_brokerage.html' | relative_url }}" frameborder='0' scrolling='no' height="500px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
*Left panel: top 30 catalysts. Right panel: brokerage vs traditional centrality for all researchers.*

| Rank | Researcher | Score | Topic Diversity | Structural Holes | Articles |
|------|-----------|-------|----------------|-----------------|----------|
| 1 | Jane C. Davies | 0.888 | 4.16 | 742 | 122 |
| 2 | Carla Colombo | 0.860 | 4.39 | 580 | 91 |
| 3 | Isabelle Sermet-Gaudelus | 0.801 | 3.94 | 787 | 123 |
| 4 | J. Stuart Elborn | 0.752 | 3.99 | 518 | 91 |
| 5 | Steven M. Rowe | 0.731 | 3.90 | 595 | 109 |
| 6 | Felix A. Ratjen | 0.728 | 4.01 | 660 | 166 |
| 7 | Christopher H. Goss | 0.719 | 4.18 | 508 | 136 |
| 8 | Marcus A. Mall | 0.718 | 3.98 | 680 | 127 |
| 9 | Scott C. Bell | 0.718 | 4.13 | 427 | 91 |
| 10 | Pierre-Regis Burgel | 0.695 | 4.01 | 595 | 109 |

Jane Davies leads again (she also topped the bridge builders in Part 4), but the ordering shifts in revealing ways. Carla Colombo jumps to #2, ahead of researchers with more publications, because her topic diversity is the highest on the list at 4.39. She publishes across an unusually wide range of CF subtopics, from gastrointestinal complications to modulator therapy to quality of life. That breadth, combined with strong structural holes, makes her score higher than researchers who publish more but in narrower lanes.

Gregory Sawicki (#14, not shown in the table) is another standout: 107 articles and the *highest* topic diversity of anyone in the top 20 at 4.50. He publishes across respiratory medicine, quality of life, health economics, and behavioral science. His brokerage score captures something that a simple publication count or h-index would completely miss.

The most revealing comparison is between the brokerage ranking and the TOPSIS centrality ranking from Part 4. They're correlated but not identical. Researchers who rank high on centrality but lower on brokerage are well-connected but stay in their lane. Researchers who rank high on brokerage but lower on centrality are doing creative cross-disciplinary work from a less central network position. Both are valuable, but if you're a funding agency trying to maximize the chance of novel discoveries, you'd want to invest in the high-brokerage researchers.

---

## 3. Knowledge Diffusion: How Topics Spread Across the Globe

### The Question

When a new research topic emerges (say, "long-term outcomes of modulator therapy"), it doesn't appear everywhere at once. It starts in one or two cities, usually where the pioneering researchers work, and gradually spreads to other centers as expertise, clinical trial infrastructure, and funding follow. I wanted to map this diffusion process at the topic level across all 1,688 cities in the dataset.

### Tracking Topic Adoption

For each of the 2,472 major MeSH topics in the dataset, I built a timeline: which cities published on it in each year from 2015 to 2025. I focused on topics that eventually reached at least 5 cities (1,096 topics met this threshold) and computed two metrics:

- **Geographic reach**: How many cities eventually published on this topic?
- **Adoption speed**: What percentage of adopting cities did so within 2 years of the first publication? High speed means the topic spread quickly (like a pandemic). Low speed means it diffused slowly (like a specialized clinical technique that requires training and infrastructure).

### What Spreads Fast, What Spreads Slow

| Topic | Cities Reached | Adoption Speed | Origin Year |
|-------|---------------|---------------|-------------|
| CFTR | 522 | 6% | 2015 |
| Pseudomonas Infections | 433 | 19% | 2015 |
| Quinolones (modulator component) | 369 | 8% | 2016 |
| Aminophenols (ivacaftor) | 350 | 8% | 2016 |
| Pseudomonas aeruginosa | 343 | 26% | 2015 |
| Indoles | 286 | 4% | 2019 |
| **COVID-19** | **277** | **60%** | **2020** |
| Quality of Life | 274 | 39% | 2015 |
| Lung Transplantation | 260 | 27% | 2015 |

**COVID-19 stands out as the fastest-spreading topic in the entire dataset**, with an adoption speed of 60%. Over half of the 277 cities that eventually published on COVID-19 in CF did so within 2 years of the first publications in 2020. That's the global urgency of a pandemic at work: every CF center in the world needed to understand how COVID-19 affected their patients, and they needed to know now.

Compare that with the CFTR modulator topics (Quinolones, Aminophenols, Benzodioxoles) at 4-8% adoption speed. These topics reached 300+ cities eventually, so they have enormous *reach*, but the *speed* is slow. Why? Because modulator research requires clinical trial infrastructure, regulatory approval, and specialized molecular biology expertise. You can't just start publishing on CFTR modulators because you read a paper about them. You need the whole ecosystem: approved drugs, consenting patients, laboratory facilities, IRB approvals.

The contrast is stark: COVID-19 research spreads by urgency. Modulator research spreads by infrastructure. Understanding these diffusion patterns has real implications for how medical research capacity should be built and funded.

### The Animated Diffusion Map

<iframe src="{{ '/assets/plotly/tier7_diffusion_animated.html' | relative_url }}" frameborder='0' scrolling='no' height="600px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
*Use the play button to watch topics spread across the globe year by year.*

The animation tracks six key topics across time and geography. Watch Pseudomonas aeruginosa (infection research) cluster heavily in European cities, while the modulator topics start from a few centers and gradually light up across both North America and Europe. Quality of Life research is the most geographically even from the start, suggesting it requires less specialized infrastructure and spreads more organically.

<iframe src="{{ '/assets/plotly/tier7_diffusion_speed.html' | relative_url }}" frameborder='0' scrolling='no' height="500px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

---

## What Graph ML Reveals That Traditional Methods Can't

Each of these three analyses produces insights that are invisible to traditional bibliometrics:

**Research Twins** surface latent similarities across all dimensions of a researcher's profile simultaneously. Citation analysis can tell you who cites whom. Co-authorship analysis can tell you who works with whom. But neither can find two people in different countries who study the same topics, publish in the same journals, and work in similar institutional contexts but have never connected. That requires encoding the full research identity into a shared vector space.

**Innovation Brokerage** distinguishes researchers who are merely *well-connected* from those who are *structurally positioned to create new combinations of ideas*. A traditional h-index or publication count can't capture the difference between a researcher who publishes 100 papers all within one subfield and one who publishes 80 papers that bridge three subfields. The brokerage score can, because it measures topic diversity, topic novelty, and structural position simultaneously.

**Knowledge Diffusion** reveals the geography of ideas at the topic level. Knowing that modulator expertise takes 5+ years to spread from clinical trial hubs to community hospitals has real implications. If you're a research funder, you might invest in training programs at slow-adopting institutions. If you're a pharmaceutical company, you might target awareness campaigns at cities that haven't yet adopted your drug's research topic. No existing bibliometric tool provides this kind of topic-level geographic diffusion analysis for specific therapeutic areas.

---

## What's Next

This is the end of the series for now, but not the end of the analysis. The dataset and infrastructure are set up for several deeper investigations:

- **Temporal embeddings**: Training separate embeddings for each era and tracking how individual researchers' "Research DNA" evolved across the Trikafta transition. Did some researchers completely reinvent their profiles?
- **Mentorship networks**: Building directed graphs from first-author/last-author relationships to map the academic genealogy of CF research. Who trained whom?
- **Succession planning**: Identifying central researchers who are showing signs of winding down (fewer publications, more reviews, declining centrality) and whether there are clear successors in the network. Where are the gaps?
- **Breakthrough prediction**: Can the network patterns that preceded the Trikafta papers be detected in current data, pointing to the next breakthrough?

If you're a CF researcher, a research funder, or just someone interested in the science of science, I'd love to hear from you.

---

*This is Part 7, the final part of the series: **[From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration: A Deep Dive](/blog/co-authorship-series/)***

---

*Acknowledgments: I'm grateful to Prof. [Jure Leskovec](https://profiles.stanford.edu/jure-leskovec) ([CS224W: Machine Learning with Graphs](https://web.stanford.edu/class/cs224w/)) and Prof. [Chris Potts](https://profiles.stanford.edu/christopher-potts) ([CS224U: Natural Language Understanding](https://web.stanford.edu/class/cs224u/)) at Stanford, whose courses gave me the foundation to take on a project like this.*
