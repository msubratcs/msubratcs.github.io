---
layout: post
title: "The Trikafta Effect: How a Drug Approval Rewired a Research Community"
date: 2026-04-09 20:40:00
description: "Part 5: 94% edge turnover, counterfactual analysis showing 62.5% Trikafta-created collaborations, sliding windows, and rising stars"
tags: [co-authorship, network-analysis, temporal-analysis, node2vec, counterfactual]
categories: data-science
series_part: true
giscus_comments: false
related_posts: false
toc:
  sidebar: left
---

> *Part 5 of the series: **[From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration: A Deep Dive](/blog/co-authorship-series/)***

---

## Before and After

Trikafta was approved in October 2019. By splitting the data into Era 1 (2015-2018) and Era 2 (2019-2025), I can see exactly what happened to the collaboration network when a breakthrough drug transformed a disease.

The growth numbers are dramatic:

| Metric | Era 1 (2015-2018) | Era 2 (2019-2025) | Change |
|--------|-------------------|-------------------|--------|
| Researchers | 15,881 | 28,497 | +79% |
| Collaboration pairs | 100,349 | 237,350 | +137% |
| Average collaborators per researcher | 12.6 | 16.7 | +32% |
| Clustering coefficient | 0.880 | 0.877 | Stable |
| Continuity researchers (span both) | | 5,172 | 13.2% of total |

The field nearly doubled in size. But here's the thing that surprised me: while the network grew 79% in researchers and 137% in collaboration pairs, the [clustering coefficient](https://en.wikipedia.org/wiki/Clustering_coefficient) barely changed (0.880 to 0.877). That means the field expanded by adding new researchers who integrated into existing research teams, not by creating isolated new groups off to the side. The social fabric of CF research held its structure even as it doubled in scale.

The more interesting question isn't the raw growth. It's what happened *structurally*.

---

## 94% Edge Turnover

Of the 237,350 collaboration pairs that exist in Era 2, only **14,066 (5.9%) also existed in Era 1**. That means 94.1% of the collaborations in the Trikafta era are brand new.

Let that sink in. In a field with thousands of established researchers, nearly every collaboration pair in the post-Trikafta era is a connection that didn't exist before 2019. To put this in perspective, in a stable scientific field you might expect 20-30% new edges per year as researchers start new projects. A 94% turnover over 4-7 years is extraordinary.

Breaking it down:

- **86,283 dissolved collaborations**: These existed in Era 1 but didn't continue into Era 2. Some of these researchers retired, some shifted to other disease areas, and many simply moved on to new projects with new teams.
- **14,066 continued collaborations**: The durable partnerships. Researchers who published together before Trikafta and continued after. These are the long-term pairs, the mentor-mentee relationships, the lab groups that stuck together through the transition.
- **223,284 new collaborations**: Pairs who first published together in 2019 or later. This is where the action is.

<iframe src="{{ '/assets/plotly/eda_network_evolution.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The four panels above show the growth at a glance: active authors per year (top left), average team sizes growing from 6.5 to 7.8 (top right), new collaboration pairs forming each year (bottom left), and the cumulative network growth curve (bottom right). The dashed vertical line marks Trikafta's approval.

The 5,172 continuity researchers who span both eras deserve special attention. They make up only 13.2% of the total researcher population, but they're the structural backbone. They carry the institutional knowledge, the methods, the clinical trial infrastructure from one era to the next. Without them, the two eras would be essentially different fields.

---

## The Counterfactual: What Would Have Happened Without Trikafta?

Here's where I got to use some of the graph ML techniques from the Stanford course. The question is simple: of all those new Era 2 collaborations, how many would have happened anyway (because researchers were already trending toward each other) vs. how many are genuinely *caused* by the Trikafta revolution?

To answer this, I built a [counterfactual](https://en.wikipedia.org/wiki/Counterfactual_conditional) model. The idea is to learn how collaborations "naturally" form based on Era 1 patterns, then predict what the Era 2 network would have looked like if nothing had changed.

### How the model works

First, I trained [Node2Vec](https://en.wikipedia.org/wiki/Node2vec) embeddings on the Era 1 graph. Node2Vec is an algorithm that learns a compact numerical representation (a 64-dimensional vector) for each researcher based on their position in the network. It works by simulating random walks through the graph: starting at a researcher, randomly hopping to a collaborator, then to that person's collaborator, and so on. Researchers who appear in similar "neighborhoods" during these walks get similar vectors. Think of it as: "tell me who you collaborate with, and I'll tell you what kind of researcher you are."

Then I trained a simple [logistic regression](https://en.wikipedia.org/wiki/Logistic_regression) classifier on top of these embeddings. For each pair of researchers, I multiply their embedding vectors element-wise (this captures whether they're in similar network positions) and the classifier predicts whether they'll collaborate. I trained on real Era 1 edges (positive examples) and randomly sampled non-edges (negative examples).

The model achieves an [AUC](https://en.wikipedia.org/wiki/Receiver_operating_characteristic#Area_under_the_curve) of 0.674 on Era 1 data. That's not a perfect predictor, but it's meaningfully above random chance (0.5), meaning it captures real patterns in how CF researchers form partnerships: things like institutional proximity, shared network neighborhoods, and similar structural positions.

### The counterfactual results

Then I asked: if I apply this Era 1 model to the new Era 2 edges, how many would the pre-Trikafta model have predicted?

**Only 37.5%.**

<iframe src="{{ '/assets/plotly/tier7_counterfactual.html' | relative_url }}" frameborder='0' scrolling='no' height="510px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

Of the new Era 2 collaborations I could score (27,319 edges where both researchers had Era 1 embeddings):

- **10,257 (37.5%) were "expected"**: The pre-Trikafta model predicted these would happen. They follow the natural dynamics of the field: people collaborating with people in similar network neighborhoods, gradual expansion of existing clusters.
- **17,062 (62.5%) were "Trikafta-created"**: The model didn't predict these. These are collaborations that only exist because the drug approval changed the research landscape. New research questions (long-term modulator outcomes, CF in aging patients, mental health in CF) brought together researchers who had no structural reason to collaborate before 2019.

And on the other side: **57,397 collaborations were "Trikafta-destroyed."** The model predicted they would continue based on Era 1 patterns, but they ended. These represent research directions and partnerships that became less relevant once Trikafta transformed the standard of care. Some of these were likely infection-focused collaborations that wound down as patients on modulators had fewer lung infections.

A caveat: "Trikafta-created" doesn't mean Trikafta literally caused each collaboration. It means these connections don't follow pre-2019 network dynamics. Some might be driven by other factors (COVID-19, funding shifts, career moves). But the scale of the effect (62.5% of new edges are unexplained by the pre-Trikafta model) strongly suggests the drug approval was the dominant force reshaping the network.

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
| UK - US | 2,526 | Shared language, major CF centers on both sides, joint clinical trials |
| Canada - US | 2,134 | Geographic proximity, Toronto-Seattle axis |
| Australia - US | 1,618 | Anglophone connection, shared trial infrastructure |
| Germany - US | 1,400 | Strong German CF program, Vertex partnerships |
| Australia - UK | 1,376 | Commonwealth research ties |
| France - US | 1,119 | Major French CF program (INSERM) |
| Germany - UK | 925 | European clinical trial networks |
| Germany - France | 912 | Strongest intra-European corridor |

The Anglophone bias is striking: the top 5 corridors all involve English-speaking countries. Within continental Europe, Germany-France (912 shared publications) is the strongest partnership, but it's less than half the UK-US corridor. Language and shared clinical trial infrastructure clearly shape who collaborates with whom, even in 2025.

---

## Rising Stars: Who's Gaining Influence Fastest?

By comparing [degree centrality](https://en.wikipedia.org/wiki/Centrality#Degree_centrality) between Era 1 and Era 2, I identified researchers whose network influence grew the most. I filtered to researchers above the median Era 2 centrality to focus on people who became genuinely influential, not just someone who went from 0 to 1 connection.

| Researcher | Articles | Era 1 Centrality | Era 2 Centrality | Growth |
|-----------|----------|-------------------|-------------------|--------|
| Lisa Morrison | 11 | 0.00006 | 0.00523 | 82x |
| Laurence Kessler | 7 | 0.00006 | 0.00333 | 52x |
| Elizabeth B. Burgener | 12 | 0.00006 | 0.00281 | 44x |
| Meghana Nitin Sathe | 28 | 0.00013 | 0.00463 | 36x |
| Rebecca M. Davidson | 16 | 0.00013 | 0.00421 | 32x |

An important caveat: high growth rates are easier from a low base. Lisa Morrison's 82x growth sounds massive, but she started from essentially zero (a single connection in Era 1). The more interesting rising stars are people like Meghana Nitin Sathe (28 articles, 36x growth) and Dana P. Albon (26 articles, 20x growth), who have substantial publication records and went from peripheral to central.

What these rising stars have in common: they were on the edge of the field in 2015-2018, maybe a postdoc or early-career investigator with one or two papers. Then in Era 2, they became hubs in new research areas that Trikafta opened up: long-term outcomes, rare mutations, CF-related diabetes, mental health. The network structure reveals their emergence years before traditional metrics (h-index, citation counts) would flag them. For a hiring committee or funding agency trying to identify the next generation of CF leaders, this kind of analysis is exactly what you'd want.

---

<iframe src="{{ '/assets/plotly/tier4_trikafta_effect.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

---

*Next: [Part 6: The Institutional Backbone and Geography of CF Research]({% post_url 2026-04-09-co-authorship-part6-geography-institutions %})*
