---
layout: post
title: "Part 4: The Small World of CF Research"
date: 2026-04-12 20:30:00
description: "Co-authorship graph construction, centrality rankings with TOPSIS, Leiden community detection, and bridge builders."
tags: [cystic-fibrosis, graph-theory, small-world, leiden, community-detection, centrality, topsis, networkx]
categories: [data-science, cystic-fibrosis, network-analysis]
series_part: true
giscus_comments: false
related_posts: false
---

> *Part 4 of the series: **[Mapping the Cystic Fibrosis Research Community: A Data Science Deep Dive](/blog/cf-research-network-analysis/)***

---

In parts 2 and 3 we created a list of 39,206 researchers and 11,500 CF publications. This post is where that raw material finally becomes a graph, and where the graph starts answering questions. Three in particular: what does the CF research network *look like* as a structure, who are the most influential researchers once you accept that "influential" has more than one meaning, and how is the field organized into communities and the bridge-builders who connect them.

## Building the Graph

In a co-authorship network, each researcher is a **node**, and two nodes are linked by an **edge** if those researchers share a paper. Everything that follows is built on top of those two primitives: we weigh nodes to measure influence and edges to measure collaboration depth.

With the 39,206 authors and 11,500 publications from Parts 2 and 3, we can now wire up the network. The basic idea is straightforward. Two researchers are connected if they co-authored a paper. But not all authorship positions carry the same meaning. In biomedical research, authorship order is a strong signal of contribution: the first author typically did most of the hands-on work (running experiments, analyzing data, writing the paper), and the last author is usually the senior investigator who led the project and whose lab it came out of. Middle authors contributed specific expertise, a statistical analysis, a patient cohort, a reagent, but their role in the direct collaboration is less central.

So instead of treating every co-authorship equally, I used a position-weighted scheme:

| Position | Weight | Why |
|----------|--------|-----|
| First author | 1.0 | Did the primary work |
| Last author | 1.0 | Led the project |
| Second author | 0.6 | Often a close collaborator or co-lead |
| Second-to-last | 0.5 | Often contributed significantly |
| All other middle | 0.3 | Contributed, but less central to the collaboration |

For each paper two researchers share, multiply their position weights together; the edge weight is the sum of those per-paper products. If Felix Ratjen (last author, weight 1.0) and a trainee (first author, weight 1.0) published 5 papers together, their edge weight is 1.0 &times; 1.0 summed five times, or 5.0, a strong, repeated partnership. Compare that with two middle authors (weight 0.3 each) who appeared on a single large clinical trial: their edge weight is 0.3 &times; 0.3 = 0.09. This distinction matters because a clinical trial with 40 authors doesn't represent 780 meaningful collaborations. It represents one coordinated effort.

---

## The Numbers

The resulting network:

| Metric | Value |
|--------|-------|
| Researchers (nodes) | 39,206 |
| Collaboration pairs (edges) | 323,633 |
| Isolated researchers (no co-authors) | 143 |
| Average collaborators per researcher | 16.5 |
| Median collaborators | 9 |
| Most connected researcher | 819 collaborators |

That last number caught my eye. 819 distinct collaborators means this person has co-authored papers with more than 2% of the entire CF research community. This typically happens with researchers who coordinate large multi-center clinical trials, where a single Phase 3 trial paper might list 40+ authors from 20 different institutions. They're not necessarily the deepest collaborators, but they're the ultimate connectors.

The gap between mean (16.5) and median (9) tells its own story. Most researchers have a modest number of collaborators, but a few "super-connectors" pull the average way up. This is the hallmark of a power-law distribution, and it's exactly what you'd expect in a real scientific collaboration network.

<iframe src="{{ '/assets/plotly/degree_distribution.html' | relative_url }}" frameborder='0' scrolling='no' height="510px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

Scientific productivity follows the same shape. Most researchers in the dataset show up on exactly one CF paper; a long middle tail published a handful; and a tiny head published dozens or over a hundred. The right panel below also previews something Part 5 leans on: the split between researchers who only appear in Era 1, researchers who only appear in Era 2, and the 5,172 continuity researchers who span both eras and carry the institutional knowledge across the Trikafta transition.

<iframe src="{{ '/assets/plotly/eda_author_productivity.html' | relative_url }}" frameborder='0' scrolling='no' height="510px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

---

## It's a Small World

Here's where things get interesting. The [giant connected component](https://en.wikipedia.org/wiki/Giant_component), the largest chunk of the network where you can trace a path between any two researchers through shared co-authorships, contains **32,760 researchers (83.6%)**. That means 5 out of every 6 CF researchers in the world are connected to each other through some chain of collaborations.

The remaining 16.4% are scattered across 1,276 smaller disconnected groups. These are mostly pairs or small teams who published one or two papers on a CF-related topic and never connected to the broader community. Think of a gastroenterology team that published a single case report about CF pancreatic disease but otherwise works on non-CF topics.

Within the giant component, the average [shortest path](https://en.wikipedia.org/wiki/Shortest_path_problem) between any two researchers is **4.31 hops**. To make that concrete: pick any two CF researchers anywhere in the world, say a pulmonologist in Sao Paulo and a geneticist in Seoul. On average, they're connected through just 4 intermediate people. "I know someone who knows someone who knows someone who knows them." The maximum distance I found (from a sample of 500 starting nodes) was 12 hops, but that's an extreme outlier at the periphery.

The [clustering coefficient](https://en.wikipedia.org/wiki/Clustering_coefficient) is **0.862**, which is extremely high. In plain language: if Researcher A collaborates with both Researcher B and Researcher C, there's an 86% chance that B and C also collaborate with each other. CF research teams are tight-knit groups where everyone on a team tends to work with everyone else on that team. It's more like a collection of overlapping friend circles than a loose web.

These three properties together, short path lengths (4.31), high clustering (0.862), and a sparse overall structure (density = 0.0004), are the textbook signature of a [small-world network](https://en.wikipedia.org/wiki/Small-world_network). The sparsity might seem to contradict the "small world" idea, but it actually reinforces it: despite the fact that most researchers don't collaborate with most others (sparse), the ones who do collaborate form tight cliques (high clustering) that are connected to each other through a surprisingly small number of hops (short paths).

CF research, despite spanning 95 countries and thousands of institutions, behaves like a village.

---

## Who Matters? Five Ways to Measure Influence

Asking "who is the most important researcher?" turns out to have at least five different answers, depending on what you mean by "important." Each [centrality measure](https://en.wikipedia.org/wiki/Centrality) captures a different kind of influence:

**[Degree centrality](https://en.wikipedia.org/wiki/Degree_(graph_theory))**: Who has the most collaborators? This is the simplest measure, just counting connections. It favors researchers on large multi-center clinical trials where one paper can add 30+ co-authors. High degree doesn't necessarily mean deep collaboration, it often means broad reach.

**Weighted degree**: Who has the *strongest* collaboration relationships? This uses the position weights from above, so repeated first/last author partnerships score much higher than a single shared trial. A researcher with 20 collaborators but deep, repeated partnerships might have a higher weighted degree than someone with 200 one-off trial co-authorships.

**[Betweenness centrality](https://en.wikipedia.org/wiki/Betweenness_centrality)**: Who bridges different groups? Imagine removing this person from the network. How many connections would break? How many shortest paths would get longer? Betweenness identifies researchers who sit in the "structural holes" between communities, serving as conduits for ideas and introductions. These people are often the translators, the ones who connect infection researchers to drug developers, or link European clinicians to North American epidemiologists.

**[Eigenvector centrality](https://en.wikipedia.org/wiki/Eigenvector_centrality)**: Who is connected to other well-connected people? This captures the "inner circle" effect. You might not have the most collaborators, but if your collaborators are themselves highly connected, you're sitting at the center of a powerful network neighborhood. Think of it as: "it's not just who you know, it's who *they* know."

**[PageRank](https://en.wikipedia.org/wiki/PageRank)**: The algorithm Google originally used to rank web pages, adapted for networks. Similar to eigenvector centrality but dampened, so influence doesn't concentrate as heavily at the very top. It answers: "if you randomly followed collaboration links from one researcher to another, where would you end up most often?"

### Combining Five Measures Into One Ranking

Rather than picking one measure and declaring it the ranking, I used [TOPSIS](https://en.wikipedia.org/wiki/TOPSIS) (Technique for Order of Preference by Similarity to Ideal Solution) to combine all five into a single composite score. The intuition behind TOPSIS: imagine a hypothetical "ideal researcher" who scores best on all five measures, and a hypothetical "worst researcher" who scores worst on all five. TOPSIS ranks everyone by how close they are to the ideal and how far from the worst. It naturally balances researchers who are strong across multiple dimensions against those who are extreme on just one.

### The TOPSIS Top 10

| Rank | Researcher | Articles | Country | What makes them rank high |
|------|-----------|----------|---------|--------------------------|
| 1 | Deniz Dogru Ersoz | 58 | TR | Extremely high eigenvector centrality |
| 2 | Hayriye Ugur Ozcelik | 57 | TR | Same Turkish network, very high eigenvector |
| 3 | Emine Nural Kiper | 47 | TR | Same cluster |
| 4 | Nagehan Emiralioglu | 49 | TR | Same cluster |
| 5 | Ebru Elmas Yalcin | 52 | TR | Same cluster |
| 6 | Jane C. Davies | 122 | GB | **Highest betweenness in the entire network** (0.033) |
| 7 | Isabelle Sermet-Gaudelus | 123 | FR | Third-highest betweenness (0.026) |
| 8 | Felix A. Ratjen | 166 | CA | Most prolific author, high across all measures |
| 9 | Carla Colombo | 91 | IT | Second-highest betweenness (0.029) |
| 10 | Marcus A. Mall | 127 | DE | Strong across degree and betweenness |

The top 5 are a surprise. They're a tightly connected Turkish pediatric pulmonology group at Hacettepe University in Ankara. They dominate eigenvector centrality because they form a dense [clique](https://en.wikipedia.org/wiki/Clique_(graph_theory)) where every member is connected to every other member, and their collaborators are also well-connected within that same network. But they rank lower on betweenness because they're not bridging *across* to other communities as much. They're the center of a strong local network, not a global connector.

The "traditional" CF leaders start at rank 6. Jane Davies, Isabelle Sermet-Gaudelus, Felix Ratjen, and Carla Colombo. These researchers score highest on betweenness and degree. They're the ones connecting different parts of the global CF network: linking UK researchers to US trials, connecting French clinicians to German drug development teams.

This is exactly the kind of insight that a single ranking metric would miss. The Turkish group is genuinely influential within their community. The global leaders are influential *across* communities. Both matter, in different ways. And TOPSIS, by considering all five dimensions simultaneously, surfaces both.

---

## The Major Communities of CF Research

Using the [Leiden algorithm](https://en.wikipedia.org/wiki/Leiden_algorithm) for community detection, I found **1,231 communities** with a [modularity](https://en.wikipedia.org/wiki/Modularity_(networks)) of 0.815.

A quick explanation: the Leiden algorithm looks for groups of researchers who collaborate more with each other than you'd expect by chance. It's an improvement over the older [Louvain method](https://en.wikipedia.org/wiki/Louvain_method) because it guarantees that every detected community is internally well-connected, not just well-separated from others. Modularity is a score from 0 to 1 that measures how cleanly the network splits into communities. A score of 0.815 is very high, meaning CF research has genuinely distinct research clusters, not a homogeneous blob.

Most of the 1,231 communities are small groups of 2-9 people. But **208 communities have 10 or more members**, and the largest ones tell a clear story about how CF research is organized:

<iframe src="{{ '/assets/plotly/community_network.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
*Hover for researcher names; colors represent communities.*

| Community | Authors | Pubs | Theme | Anchor Institution |
|-----------|---------|------|-------|-------------------|
| 0 | 2,790 | 1,862 | CFTR modulators + transplant | Univ. of Washington, CF Foundation (US) |
| 1 | 2,333 | 864 | CFTR modulators | INSERM, Sainte-Perine Hospital (France) |
| 2 | 1,954 | 697 | CFTR modulators | Univ. of Rome, Univ. of Naples (Italy) |
| 3 | 1,682 | 639 | CFTR + Pseudomonas | MHH Hannover (Germany) |
| 4 | 1,449 | 861 | Pseudomonas infections | Univ. of Liverpool, Manchester NHS (UK) |
| 5 | 1,318 | 742 | Lung transplantation | Univ. of Toronto, SickKids (Canada) |
| 7 | 964 | 282 | Pseudomonas microbiology | Carlos III Institute (Spain) |
| 9 | 912 | 495 | Exercise + Quality of Life | Univ. of Sydney, UNSW (Australia) |
| 14 | 795 | 318 | NTM infections + sinusitis | Specialized centers |

Two patterns jump out:

**Communities map to geography.** Community 0 is US-centric, Community 1 is French, Community 2 is Italian, Community 3 is German, Community 4 is British, Community 5 is Canadian, Community 7 is Spanish, and Community 9 is Australian. CF research is still organized primarily along national lines, with each country having its own research ecosystem anchored by one or two major centers. Language, funding structures, and clinical trial networks all reinforce national boundaries.

**But topics also cluster.** The microbiology-focused communities (4, 7) are clearly distinct from the modulator-focused communities (0, 1, 2, 3). The Australian community stands out with its focus on exercise and quality of life, a topic that barely appears in the European clusters. And the Canadian community (#5) has a strong transplant focus, reflecting Toronto's role as a global center for lung transplantation. The "anchor institution" in each community is typically where the community leader works and where the most publications originate.

---

## The Bridge Builders

The most interesting researchers aren't always the most prolific. They're the ones who connect communities that would otherwise be isolated from each other. If the communities above are "tribes," these are the diplomats.

Jane C. Davies at Imperial College London bridges **40 different communities**. That's not a typo. She has co-authored with researchers in 40 of the 1,231 communities detected by Leiden. To put that in perspective, the average researcher who bridges at all connects to just 3-4 communities. Jane Davies connects to 40. She's the single most important structural connector in the entire CF research network.

| Rank | Researcher | Communities Bridged | Articles | Primary Base |
|------|-----------|-------------------|----------|--------------|
| 1 | Jane C. Davies | 40 | 122 | Imperial College London (GB) |
| 2 | Pierre-Regis Burgel | 37 | 109 | Cochin Hospital, Paris (FR) |
| 3 | Edward F. McKone | 37 | 52 | St. Vincent's Hospital, Dublin (IE) |
| 4 | Christopher H. Goss | 35 | 136 | Univ. of Washington (US) |
| 5 | J. Stuart Elborn | 33 | 91 | Queen's University Belfast (GB) |
| 6 | Felix A. Ratjen | 33 | 166 | SickKids, Toronto (CA) |
| 7 | Steven M. Rowe | 31 | 109 | UAB (US) |
| 8 | John P. Clancy | 31 | 83 | Cincinnati Children's (US) |
| 9 | Isabelle Sermet-Gaudelus | 30 | 123 | Necker Hospital, Paris (FR) |
| 10 | Carla Colombo | 29 | 91 | Milan (IT) |

What stands out: **Edward McKone at #3 with "only" 52 articles but bridging 37 communities.** He's punching well above his publication weight in terms of structural importance. Same with Silvia Gartner (28 articles, 25 communities bridged). These are researchers whose value to the field goes far beyond their publication count. They're connectors, the people who introduce a French microbiologist to a Canadian transplant surgeon because they happen to collaborate with both.

Why does this matter? Because ideas flow through people. A breakthrough in Pseudomonas treatment in Liverpool only reaches the transplant community in Toronto if someone bridges those two groups. Bridge builders are the people through whom knowledge diffuses across the field. Remove them, and the network fragments into national or topical silos.

In total, **5,549 researchers** (14.2% of the network) bridge two or more communities. That's the connective tissue holding the CF research world together. The other 85.8% publish within a single community. Both roles are valuable, but the 14.2% of bridge builders have an outsized influence on how quickly ideas spread.

---

## Key Takeaways

- **It's a village, not a web.** A 4.31-hop average path length and a clustering coefficient of 0.862 mark CF research as a classic small-world network: sparse overall, but densely connected inside teams and shockingly close across them.
- **Influence has five flavors.** Degree, weighted degree, betweenness, eigenvector, and PageRank each capture a different kind of prominence. TOPSIS combines them into one ranking so local-network stars (the Hacettepe Turkish group) surface alongside global connectors (Davies, Sermet-Gaudelus, Ratjen, Colombo, Mall) in the same top 10.
- **1,231 communities, organized mostly by country.** A Leiden modularity of 0.815 says the communities are real, not artifacts of the algorithm, and the biggest ones anchor on single flagship institutions: Washington, INSERM, Rome, Hannover, Liverpool, Toronto, Carlos III, Sydney.
- **14.2% of researchers are the connective tissue.** 5,549 bridge builders link two or more communities; Jane Davies alone spans 40. Remove them and the field fragments into national and topical silos.

## What's Next

Part 5 asks whether this structure actually held when Trikafta landed in late 2019, or whether a single drug approval was enough to rewire the graph.

---

*Next: [Part 5: The Trikafta Effect: How a Drug Approval Rewired a Research Community]({% post_url 2026-04-12-cf-research-network-analysis-part5-trikafta-effect %})*
