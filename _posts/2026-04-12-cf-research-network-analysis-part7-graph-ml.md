---
layout: post
title: "Part 7: Topic-Profile Embeddings, Structural Brokerage, and Topic Diffusion"
date: 2026-04-12 21:00:00
description: "metapath2vec embeddings encode each researcher's topic profile. Three analyses test what graph ML adds over classical network metrics."
tags: [cystic-fibrosis, trikafta, heterogeneous-network, metapath2vec, embeddings, umap, structural-holes, knowledge-diffusion]
categories: [data-science, cystic-fibrosis, network-analysis, graph-ml]
series_part: true
giscus_comments: false
related_posts: false
---

> *Part 7 of the series: **[Mapping the Cystic Fibrosis Research Community](/blog/cf-research-network-analysis/)***

> ***TL;DR:*** *A 60,000-node heterogeneous graph with metapath2vec embeddings encodes each researcher's topic profile as a 128-dimensional vector. Three analyses follow: high-similarity non-collaborator pairs, a four-signal brokerage score for structural positioning, and a topic-diffusion map across 1,688 cities.*
>
> ***Read this if*** *you want to see what graph ML adds to a collaboration network once the classical metrics from Parts 4-6 are exhausted.*
>
> ***Skip to*** *[Knowledge Diffusion](#3-knowledge-diffusion-how-topics-spread-across-the-globe) for the topic-spread analysis.*
>
> ***Why this matters for the graph:*** *Parts 4-6 measured structure with classical graph metrics. This post tests whether learned embeddings and composite scores surface patterns those metrics miss, and is honest about where they do and don't.*

---

This is where the infrastructure from Parts 1-3 and the network measures from Parts 4-6 get tested against a different class of method. If the embeddings don't encode meaningful similarity, the non-collaborator pairs are noise. If the brokerage score rewards random breadth instead of genuine bridging, it adds nothing over betweenness centrality. The point of this post is to check whether graph ML earns its complexity on this particular dataset.

Three analyses, each answering a different question:
1. Which non-collaborating researcher pairs have the most similar topic profiles?
2. Who is structurally positioned to bridge topic boundaries?
3. How do research topics spread across the globe, and what determines the speed?

---

## 1. Topic-Profile Embeddings and Research Twins

Traditional co-authorship analysis captures one dimension: who works with whom. But a researcher's identity is richer than their list of collaborators. It includes *what* they study (MeSH topics), *where* they publish (journals), *where* they work (institutions), and *who* they work with (co-authors).

We need a way to encode that rich profile into a single numerical fingerprint -- a compact topic profile for each of the 39,206 researchers. Two researchers with similar profiles would be doing similar work, even if they'd never met. To do that, we need a graph that contains all of those dimensions in one place.

### Building the Heterogeneous Graph

A regular graph has one type of node and one type of edge. A [heterogeneous information network](https://en.wikipedia.org/wiki/Heterogeneous_information_network) (HIN) has multiple types of both. A simple co-authorship graph is like a phone network where everyone is just "a person" and every connection is "called each other." A heterogeneous graph is more like a real social system where there are people, companies, topics, and locations, all connected by different kinds of relationships.

I constructed a HIN with five node types and four edge types:

```
Author (39,206)  --authored-->      Paper (11,500)
Paper            --tagged_with-->   MeSH Topic (2,502)
Paper            --published_in-->  Journal (1,601)
Author           --affiliated-->    Institution (5,799)
```

This single graph encodes the full research identity of every author. It captures not just who collaborates with whom, but what they study (through shared MeSH topics), where they publish (through shared journals), and where they're based (through institutional affiliation). The total graph has about 60,000 nodes and roughly 165,000 edges across the four relationship types.

### metapath2vec: Learning Research Fingerprints

To learn embeddings from this heterogeneous graph, I used [metapath2vec](https://ericdongyx.github.io/metapath2vec/m2v.html), designed specifically for heterogeneous networks. It's an extension of the [Word2Vec](https://en.wikipedia.org/wiki/Word2vec) idea (which learns word embeddings from the company they keep in sentences) applied to graphs.

Here's how it works. we define a "metapath," a recipe for walking through the graph that follows a specific sequence of node types:

**Author -> Paper -> MeSH Topic -> Paper -> Author**

The algorithm performs thousands of random walks following this recipe. Starting at a researcher, it hops to one of their papers, then to a MeSH topic on that paper, then to *another* paper with the same topic, then to that paper's author. By doing this over and over (20 walks per node, each 10 steps long), the algorithm collects evidence about which researchers appear in similar "contexts."

The key insight: two researchers who frequently appear at the end of these walks from similar starting points are doing similar research, even if they've never directly collaborated. The algorithm compresses all of this topic-context information into a compact 128-dimensional vector for each researcher.

A note on what this metapath actually captures. The walk goes Author → Paper → Topic → Paper → Author, so the embedding learns who shares **research topics**. Co-authorship is captured indirectly: when two authors are on the same paper, a length-2 segment of the same metapath links them through that paper. The journal and institution edges are present in the graph and could be exploited by additional metapaths (for example, Author → Institution → Author to capture institutional similarity), but for this post the topic metapath is the most informative single recipe to walk.

I trained the embeddings over 5 epochs with 20 walks per node. The training took about 20 minutes on my rather modest CPU setup.

### The UMAP Landscape

128 dimensions are impossible to visualize, so I used UMAP (Uniform Manifold Approximation and Projection) to reduce those 128 dimensions down to 2 for plotting. UMAP is a dimensionality reduction algorithm that preserves the local neighborhood structure of the data: researchers who are close in 128 dimensions stay close in 2 dimensions.

<iframe src="{{ '/assets/plotly/tier7_embedding_umap.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
*Hover over any point to see the researcher's name, institution, and country.*

The result is interesting. The communities detected by the Leiden algorithm back in Part 4 map cleanly onto the embedding space, even though the embeddings were learned independently. Researchers in the same community cluster together, confirming that the embeddings are capturing real structure. But the embeddings also reveal something the Leiden communities don't: gradients *between* communities. Researchers who work at the boundary of two topics (say, infection research and modulator therapy) appear in the transition zones between clusters, exactly where we'd expect to find interdisciplinary researchers.

### Research Twins: Who Should Be Collaborating But Isn't?

For each researcher with at least 3 publications, I found their nearest neighbor in the embeddings space who they've *never co-authored with*. These are "Research Twins": people doing remarkably similar work in different parts of the world who've never connected.

| Twin Pair | Similarity | Articles | Countries |
|-----------|-----------|----------|-----------|
| Michael D. Parkins / Edith T. Zemanick | 0.535 | 49 / 59 | CA / US |
| Lucas R. Hoffman / Tacjana Pressler | 0.522 | 51 / 51 | US / DK |
| Marianne Skov / Don B. Sanders | 0.501 | 39 / 59 | DK / US |
| Julia C. Emerson / Loic Guillot | 0.500 | 9 / 20 | US / FR |
| Bradley S. Quon / Quitterie Reynaud | 0.498 | 73 / 83 | CA / FR |
| Valerie J. Waters / Joanna B. Goldberg | 0.495 | 75 / 30 | CA / US |

A note on the similarity scores: cosine similarity ranges from -1 to 1, where 1 means two embedding vectors point in the exact same direction. To calibrate: random pairs of researchers in this dataset have a mean similarity around 0.01, frequent collaborators (10+ joint papers) average about 0.23, and even the most tightly bonded pairs in the entire network top out near 0.6. A non-co-author similarity of 0.535 sits in that very top tail, these are people whose topic profiles are about as close as it ever gets without them being literally the same person.

Parkins (Calgary, Canada) and Zemanick (Colorado, US) have the highest twin similarity. Both work on CF microbiology and pulmonary infections, and a quick check of their publication records shows they also tend to publish in the same journals and run similarly-sized collaboration networks. The embedding only "sees" their topic overlap directly, but the rest of the resemblance is striking once we look.

The Hoffman/Pressler pair is particularly interesting because it crosses the Atlantic, a US-based microbiologist paired with a Danish clinician. Their research profiles are nearly identical despite working in completely different healthcare systems on different continents.

Why does this matter? This could be a concrete starting point for catalyzing new collaborations between researchers with the highest chance of productive partnership. Traditional approaches to matchmaking (conferences, personal introductions) are hit-or-miss. This is a data-driven approach based on the structure of the entire research network.

---

## 2. Structural Brokerage: Who Bridges Topic Boundaries?

### Beyond Betweenness

Betweenness centrality from Part 4 tells us who bridges different groups. But bridging isn't the same as catalyzing innovation. I wanted to identify researchers who are structurally positioned to enable *new combinations of ideas*, the kind of innovation that leads to breakthroughs. The theory behind this comes from sociologist [Ronald Burt's work on structural holes](https://en.wikipedia.org/wiki/Structural_holes): people who bridge disconnected groups have access to non-redundant information, which gives them an advantage in generating novel ideas.

### The Brokerage Score

I combined four signals into a composite brokerage score:

1. **Topic diversity** (30% weight): Measured using Shannon entropy of each researcher's MeSH topic distribution. A researcher who publishes across 20 different topics has higher entropy than one who focuses on 3. Topic diversity ranges from around 1 (narrow specialist) to 4.5+ (extreme generalist).

2. **Topic novelty** (25% weight): How often does a researcher bridge *unusual* topic combinations? Measured as the average rarity of topic pairs across their papers. If most of their papers combine topics that rarely appear together (say, "mental health" and "CFTR modulators"), they're producing novel combinations that might spark new ideas. This captures *what* they combine, not just *how much* they cover.

3. **[Structural holes](https://en.wikipedia.org/wiki/Structural_holes)** (25% weight): Burt's effective size metric. If their collaborators all collaborate with each other, they're in a clique with no structural holes. There's nothing unique flowing through them. But if their collaborators *don't* know each other, they're a bridge between them, controlling unique information pathways. Effective size adjusts a researcher's raw collaborator count by subtracting the redundancy created by mutual connections. Jane Davies, for instance, has 785 direct collaborators in the network but an effective size of 742, meaning her ego network is dominated by people who don't densely overlap with each other.

4. **Betweenness centrality** (20% weight): The classic network bridging measure from Part 4, included to capture positional importance in the overall network topology.

### The Top Brokers

<iframe src="{{ '/assets/plotly/tier7_brokerage.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
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

**Among topics with substantial reach, COVID-19 is the fastest spreader in the dataset**, with an adoption speed of 60%. Over half of the 277 cities that eventually published on COVID-19 in CF did so within 2 years of the first publications in 2020. That's the global urgency of a pandemic at work: every CF center in the world likely needed to understand how COVID-19 affected their patients, and they needed to know fast.

Compare that with the CFTR modulator topics (Quinolones, Aminophenols, Benzodioxoles) at 4-8% adoption speed. These topics reached 300+ cities eventually, so they have enormous *reach*, but the *speed* is slow. Possibly because modulator research requires specialized infrastructure and expertise. The contrast is stark; COVID-19 research spreads by urgency. Modulator research spreads slowly but surely.

### The Animated Diffusion Map

<iframe src="{{ '/assets/plotly/tier7_diffusion_animated.html' | relative_url }}" frameborder='0' scrolling='no' height="710px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
*Use the play button to watch topics spread across the globe year by year.*

The animation tracks six key topics across time and geography. Watch Pseudomonas aeruginosa (infection research) cluster heavily in European cities, while the modulator topics start from a few centers and gradually light up across both North America and Europe. Quality of Life research is the most geographically even from the start, suggesting it requires less specialized infrastructure and spreads more organically.

<iframe src="{{ '/assets/plotly/tier7_diffusion_speed.html' | relative_url }}" frameborder='0' scrolling='no' height="610px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
*Top 30 topics plotted as reach (x-axis) versus 2-year adoption speed (y-axis). Bubble size is total publication count; color is the year the topic first appeared. The high-reach modulator topics sit in the bottom-right (slow-but-wide), while COVID-19 sits up and to the right.*

---

## What Graph ML Adds Here

Each analysis tests whether a specific technique adds information that standard bibliometric measures do not readily provide.

**Topic-profile embeddings** surface deep topical similarity. Co-authorship analysis can tell us who works with whom but cannot find two people on opposite sides of the world whose entire research portfolios point at the same set of MeSH topics yet who have never appeared on a paper together. That requires compressing each researcher's publication history into a vector and asking who's nearby. The same heterogeneous graph could be re-walked along other metapaths to test additional similarity dimensions.

**Structural brokerage** distinguishes researchers who are merely *well-connected* from those who are *positioned to bridge different topic areas*. A traditional h-index or publication count does not capture the difference between a researcher who publishes 100 papers all within one subfield and one who publishes 80 papers that bridge three subfields. The brokerage score can, because it measures topic diversity, topic novelty, and structural position simultaneously. Whether that structural positioning actually translates to novel discoveries is a separate question this analysis does not answer.

**Topic diffusion** tracks the geography of ideas at the topic level. Knowing that modulator expertise takes 5+ years to spread from research hubs to community hospitals has real implications for funders and training programs. Standard bibliometric tools do not currently offer topic-level geographic diffusion tracking, though the gap is narrowing as these tools add network features.

---

## Where This Could Go Next

This is the end of the series for now, but not the end of the analysis. The dataset and infrastructure are set up for deeper investigations:

- **Temporal embeddings**: Training separate embeddings for each era and tracking how individual researchers' "Research DNA" evolved across the Trikafta transition. Did some researchers completely reinvent their profiles?
- **Mentorship networks**: Building directed graphs from first-author/last-author relationships to map the academic genealogy of CF research. Who trained whom?

I'm not a CF researcher and I have no medical background. This series is a side project I built for fun, mostly as an excuse to put graph ML and entity resolution to work on a real corpus. I can't promise the insights here are scientifically meaningful. If you *are* a CF researcher and you've spotted something I got wrong, a missing nuance, a better question to ask of the data, or just a suggestion for where to take this next, I'd genuinely love to hear it.

---

*This is Part 7, the final part of the series: **[Mapping the Cystic Fibrosis Research Community](/blog/cf-research-network-analysis/)***

