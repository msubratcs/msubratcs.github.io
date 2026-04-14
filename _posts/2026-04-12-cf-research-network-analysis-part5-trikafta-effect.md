---
layout: post
title: "Part 5: The Trikafta Effect: How a Drug Approval Rewired a Research Community"
date: 2026-04-12 20:40:00
description: "Pre vs post-Trikafta era comparison, 94% edge turnover, a Node2Vec link-prediction counterfactual on continuity-researcher collaborations, and sliding-window analysis."
tags: [cystic-fibrosis, trikafta, temporal-analysis, node2vec, graph-embeddings, link-prediction, counterfactual]
categories: [data-science, cystic-fibrosis, network-analysis, graph-ml]
series_part: true
giscus_comments: false
related_posts: false
---

> *Part 5 of the series: **[Mapping the Cystic Fibrosis Research Community: A Data Science Deep Dive](/blog/cf-research-network-analysis/)***

---

## Before and After

Trikafta was approved in October 2019. By splitting the data into Era 1 (2015-2018) and Era 2 (2019-2025), We can see exactly what happened to the collaboration network when a breakthrough drug transformed a disease. A caveat to keep in mind for everything that follows: Era 1 is 4 years long and Era 2 is 7 years long, so raw-size comparisons are inflated by the longer observation window. The per-researcher and structural claims below (average collaborators, clustering, edge turnover) don't depend on that asymmetry, but the total-count numbers do.

The growth numbers are dramatic:

| Metric | Era 1 (2015-2018) | Era 2 (2019-2025) | Change |
|--------|-------------------|-------------------|--------|
| Researchers | 15,881 | 28,497 | +79% |
| Collaboration pairs | 100,349 | 237,350 | +137% |
| Average collaborators per researcher | 12.6 | 16.7 | +32% |
| Clustering coefficient | 0.880 | 0.877 | Stable |
| Continuity researchers (in both eras) | 5,172 | 5,172 | 13.2% of total |

The era comparison dashboard makes the scale of the shift visible at a glance:

<iframe src="{{ '/assets/plotly/eda_era_comparison.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

Era 2 has nearly twice the publications, 80% more unique authors, and almost double the number of unique MeSH topics. The donut chart (top left) shows how the author populations overlap between eras, and the bar charts compare the country-level and institution-type distributions.

The field nearly doubled in size. But here's the thing that's interesting: while the network grew 79% in researchers and 137% in collaboration pairs, the [clustering coefficient](https://en.wikipedia.org/wiki/Clustering_coefficient) barely changed (0.880 to 0.877). That means the field expanded by adding new researchers who integrated into existing research teams, not by creating isolated new groups on the side. The social fabric of CF research held its structure even as it doubled in scale.

The more interesting questions aren't about the raw growth. They're about what the field started studying, and who it started studying with.

---

## The Topic Shift

The era comparison already showed the field doubled in size. Look at the research content alongside it and you see it also rotated on its axis: some topics surged into the Trikafta era, others quietly receded.

<iframe src="{{ '/assets/plotly/eda_mesh_evolution.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

Green bars on the right are MeSH topics that grew in the Trikafta era. Red bars on the left are topics that shrank. The pattern is clear: modulator-related topics (CFTR, drug compounds) surged, while some traditional infection-focused topics declined. Quality of life and mental health research also grew, reflecting the new reality of patients living longer with better baseline health.

The heatmap below shows the same story in more detail, tracking the top 20 MeSH topics year by year:

<iframe src="{{ '/assets/plotly/eda_mesh_heatmap.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

That's what researchers are studying now, and how sharply it pivoted around 2019. The next question is who they're studying it with, and whether those partnerships changed just as sharply.

---

## 94% Edge Turnover

Of the 237,350 collaboration pairs that exist in Era 2, only **14,066 (5.9%) also existed in Era 1**. That means 94.1% of the collaborations in the Trikafta era are brand new. In a field with thousands of established researchers, nearly every collaboration pair in the post-Trikafta era is a connection that didn't exist before 2019. Seeing 94% of Era 2 edges being brand new across a comparison that spans barely a decade is interesting.

Breaking it down:

- **86,283 dissolved collaborations**: These existed in Era 1 but didn't continue into Era 2. Some of these researchers retired, some shifted to other disease areas, and some probably moved on to new projects.
- **14,066 continued collaborations**: The durable partnerships. Researchers who published together before Trikafta and continued after. These are the long-term pairs, the mentor-mentee relationships, the lab groups that stuck together through the transition.
- **223,284 new collaborations**: Pairs who first published together in 2019 or later.

<iframe src="{{ '/assets/plotly/eda_network_evolution.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The four panels above show the growth at a glance: active authors per year (top left), average team sizes growing from 6.5 to 7.8 (top right), new collaboration pairs forming each year (bottom left), and the cumulative network growth curve (bottom right). The dashed vertical line marks Trikafta's approval.

The 5,172 continuity researchers who span both eras deserve special attention. They make up only 13.2% of the total researcher population, but they're the structural backbone. They carry the institutional knowledge, the methods, the clinical trial infrastructure from one era to the next. Without them, the two eras would be essentially different fields.

---

## The Counterfactual: What Would Have Happened Without Trikafta?

Here's where I got to use some of the graph ML techniques from the Stanford course. The question is simple: of all those new Era 2 collaborations, how many would have happened anyway (because researchers were already trending toward each other) vs. how many are genuinely *caused* by the Trikafta revolution?

To answer this, I built a counterfactual model. The idea is to learn how collaborations "naturally" form based on Era 1 patterns, then predict what the Era 2 network would have looked like if nothing had changed.

### How the model works

First, I trained [Node2Vec](https://en.wikipedia.org/wiki/Node2vec) embeddings on the Era 1 graph. Node2Vec is an algorithm that learns a compact numerical representation (a 64-dimensional vector) for each researcher based on their position in the network. It works by simulating random walks through the graph: starting at a researcher, randomly hopping to a collaborator, then to that person's collaborator, and so on. Researchers who appear in similar "neighborhoods" during these walks get similar vectors. Think of it as: "tell me who you collaborate with, and I'll tell you what kind of researcher you are."

Then I trained a simple logistic regression classifier on top of these embeddings. For each pair of researchers, I built a single edge feature by multiplying their two embedding vectors element-wise to convert node embeddings into link-prediction features and the classifier predicts whether the pair will collaborate. I trained on real Era 1 edges (positive examples) and randomly sampled non-edges (negative examples).

The model hits a training AUC of 0.674 on Era 1 (evaluated on the same edges it trained on, so this is a signal-check rather than a generalization benchmark). That's not a perfect predictor, but it's still meaningfully above random chance (0.5), meaning the embeddings carry real signal about how CF researchers form partnerships: institutional proximity, shared network neighborhoods, and similar structural positions.

### The counterfactual results

If we apply this Era 1 model to the new Era 2 edges, how many would the pre-Trikafta model have predicted?

**Only 37.5%.**

<iframe src="{{ '/assets/plotly/tier7_counterfactual.html' | relative_url }}" frameborder='0' scrolling='no' height="510px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

A crucial scope note before the breakdown: the Era 1 model only has embeddings for researchers who were already active in 2015-2018. That means we can only score new Era 2 edges where *both* endpoints are continuity researchers. That works out to 27,319 edges, roughly 12% of the 223,284 new Era 2 edges. The other 88% involve at least one researcher who joined the field in Era 2, for whom the model simply has no prior. So every number below is about the "old guard rewiring itself" subset of the new edges, not the whole Era 2 growth.

Of the 27,319 new-but-scoreable Era 2 collaborations:

- **10,257 (37.5%) were "expected"**: The pre-Trikafta model predicted these would happen. They follow the natural dynamics of the field: people collaborating with people in similar network neighborhoods, gradual expansion of existing clusters.
- **17,062 (62.5%) were "Trikafta-created"**: The model didn't predict these. These are collaborations that only exist because the drug approval changed the research landscape. New research questions (long-term modulator outcomes, CF in aging patients, mental health in CF) brought together researchers who had no structural reason to collaborate before 2019.

And on the other side: of the 86,283 Era 1 pairs that did *not* continue into Era 2, the model predicted **57,397 (about two-thirds)** would continue if the field had stayed on its pre-2019 trajectory. Call these the "Trikafta-destroyed" edges. The model is saying: these partnerships should still be going, and they aren't. They represent research directions and partnerships that became less relevant once Trikafta transformed the standard of care. Some were likely infection-focused collaborations that wound down as patients on modulators had fewer lung infections.

A few caveats on what this does and doesn't show. "Trikafta-created" doesn't mean Trikafta literally caused each collaboration, it means these connections don't follow pre-2019 network dynamics, and some share of them is surely driven by other factors (COVID-19, funding shifts, career moves). The 62.5% figure is specific to continuity-researcher pairs, not to the Era 2 network as a whole. And the Era 1 model is a simple node2vec + logistic regression link predictor which has it's limitations. Taken together, though, the picture is still interesting; even restricted to researchers who were already in the field, a clear majority of their new partnerships don't fit the pre-2019 pattern, and most of their dissolved partnerships "should" still be going. Something field-wide and large happened around 2019, and Trikafta is the most likely candidate.

---

## The Sliding Window View

To see the transition more granularly, I built the network in 3-year sliding windows from 2015-2017 through 2023-2025. Each window captures a snapshot of who was collaborating with whom during that period:

<iframe src="{{ '/assets/plotly/tier4_sliding_windows.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

| Window | Researchers | Edges | Density | Giant Component |
|--------|------------|-------|---------|----------------|
| 2015-2017 | 12,461 | 75,414 | 0.00097 | 69.8% |
| 2016-2018 | 12,863 | 79,243 | 0.00096 | 72.5% |
| 2017-2019 | 13,061 | 81,540 | 0.00096 | 73.3% |
| 2018-2020 | 14,090 | 92,367 | 0.00093 | 73.2% |
| 2019-2021 | 14,693 | 102,095 | 0.00095 | 75.1% |
| 2020-2022 | 14,983 | 108,984 | 0.00097 | 75.5% |
| 2021-2023 | 14,562 | 111,292 | 0.00105 | 77.0% |
| 2022-2024 | 14,361 | 113,579 | 0.00110 | 76.3% |
| 2023-2025 | 14,514 | 116,961 | 0.00111 | 77.3% |

Two trends jump out:

**The community is becoming more connected.** The [giant component](https://en.wikipedia.org/wiki/Giant_component) keeps growing, from 69.8% to 77.3%. In the early windows, about 30% of researchers were in disconnected islands. By the latest windows, that's down to 23%. More and more peripheral researchers are getting pulled into the main collaboration network. The field is consolidating.

**The network is getting denser.** [Network density](https://en.wikipedia.org/wiki/Dense_graph) actually *increases* in the later windows (0.00097 to 0.00111), a 14% jump. This means researchers aren't just adding more collaborators at the same rate the field is growing. They're forming *tighter* connections within the existing network. There are more collaboration links per researcher than before. The post-Trikafta field isn't just bigger, it's more tightly woven.

---

## Is Collaboration Becoming More International?

I classified every collaboration pair as domestic (both researchers in the same country) or international (different countries):

| Type | Continued from Era 1 | New in Era 2 |
|------|----------------------|-------------|
| Domestic | 11,441 (81.3%) | 168,085 (75.3%) |
| International | 2,541 (18.1%) | 46,523 (20.8%) |

New collaborations in Era 2 are slightly more international than the collaborations that carried over from Era 1 (20.8% vs 18.1%). The field is globalizing, though gradually. Most CF research collaboration still happens within national borders, which makes sense: shared language, shared clinical trial networks, shared funding agencies.

But that 2.7 percentage point shift from 18.1% to 20.8% adds up when you're talking about 223,000 new edges. In absolute terms, Era 2 has 46,523 new international collaborations compared to 2,541 that continued from Era 1. The post-Trikafta era is dramatically more international in raw numbers, even if the ratio only shifted modestly.

The dominant corridors tell us where the international action is:

| Corridor | Shared Publications | Why it's strong |
|----------|-------------------|----------------|
| UK - US | 2,526 | Shared language, major CF centers on both sides |
| Canada - US | 2,134 | Geographic proximity, Toronto-Seattle |
| Australia - US | 1,618 | Shared language and possibly shared trial infrastructure? |
| Germany - US | 1,400 | Strong German CF program & possibly due to Vertex partnerships |
| Australia - UK | 1,376 | Commonwealth research ties |
| France - US | 1,119 | Interesting, but I'm not sure why |
| Germany - UK | 925 | Geographic proximity, EU Zone |
| Germany - France | 912 | Geographic proximity, EU Zone |

The top 5 corridors all involve English-speaking countries. Within continental Europe, Germany-France (912 shared publications) is the strongest partnership, but it's less than half the UK-US corridor. Shared language and geographic proximity clearly shape who collaborates with whom, even in 2025.

---

## Rising Stars: Who's Gaining Influence Fastest?

By comparing [degree centrality](https://en.wikipedia.org/wiki/Centrality#Degree_centrality) between Era 1 and Era 2, we can flag researchers whose network position grew the most. I filtered to researchers above the median Era 2 centrality to screen out the trivial "0 to 1 connection" cases.

| Researcher | Articles | Era 1 Centrality | Era 2 Centrality | Growth |
|-----------|----------|-------------------|-------------------|--------|
| Lisa Morrison | 11 | 0.00006 | 0.00523 | 82x |
| Laurence Kessler | 7 | 0.00006 | 0.00333 | 52x |
| Elizabeth B. Burgener | 12 | 0.00006 | 0.00281 | 44x |
| Meghana Nitin Sathe | 28 | 0.00013 | 0.00463 | 36x |
| Rebecca M. Davidson | 16 | 0.00013 | 0.00421 | 32x |

A few caveats before anyone reads too much into this list. High growth multipliers are easy from a low base: Lisa Morrison's 82x sounds massive, but she started from a single Era 1 connection, which inflates the ratio regardless of what she actually does now. Even the more substantial entries (Meghana Nitin Sathe at 28 articles and 36x, Dana P. Albon at 26 articles and ~20x) are only flagged by one metric — degree centrality growth — over two coarse time buckets. That is a shallow lens. It can't tell you *why* someone's connections grew, whether the growth is durable, or how they compare on the other centrality measures from Part 4 (betweenness, eigenvector, PageRank, weighted degree). Actually identifying genuine rising stars would need a much deeper look: tracking multiple centrality measures across a sliding window, checking whether the growth compounds or reverts, and sanity-checking against the person's actual publication record and research topics. The table above is best read as a list of researchers worth investigating further, not a verdict on who the next generation of CF leaders will be.

---

The dashboard below pulls the four main threads of this post into one view: the edge-turnover pie (continued vs dissolved vs brand new), the author population shift between eras, the domestic/international split for continued and new collaborations, and the density curve across the sliding windows.

<iframe src="{{ '/assets/plotly/tier4_trikafta_effect.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

---

## Key Takeaways

- **A drug approval rewired the graph.** 94% of Era 2 collaboration pairs are brand new compared to Era 1, far above the 20-30% per-year baseline for a stable field. The structural backbone held even as the field doubled: average clustering barely moved (0.880 → 0.877).
- **Most of the rewiring doesn't fit pre-2019 dynamics.** Restricted to continuity-researcher pairs where a pre-Trikafta node2vec + logistic-regression model can actually vote, 62.5% of their new edges are unexplained by the Era 1 pattern, and two-thirds of their dissolved edges were predicted to survive.
- **Topics rotated along with partnerships.** Modulator-related MeSH topics surged and some infection-focused topics receded, normalized against publication counts per era.
- **The post-Trikafta field is tighter, not just bigger.** Across 3-year sliding windows, network density rose 14% (0.00097 → 0.00111) and the giant component expanded from 69.8% to 77.3% of researchers.
- **Degree-centrality growth flags some candidate rising stars — tentatively.** Filtering to above-median Era 2 centrality to screen out zero-base artifacts surfaces names like Meghana Nitin Sathe (28 articles, 36x) and Dana P. Albon (26 articles, ~20x). A single-metric, two-bucket comparison is a shallow lens, though; confirming anyone as a real rising star would need multi-metric, sliding-window analysis.

## What's Next

Part 6 zooms out from researchers to institutions and geography: which organizations anchor CF research, how the map changes when you enrich it with ROR metadata, and why nearly half of institutional edges cross a national border.

---

*Next: [Part 6: The Institutional Backbone and Geography of CF Research]({% post_url 2026-04-12-cf-research-network-analysis-part6-geography-institutions %})*
