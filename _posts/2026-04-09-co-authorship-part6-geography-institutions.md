---
layout: post
title: "The Institutional Backbone and Geography of CF Research"
date: 2026-04-09 20:50:00
description: "Part 6: Institution networks, academic-industry collaboration, founding century analysis, 46% international corridors, and global mapping"
tags: [co-authorship, network-analysis, institutions, geography, ror]
categories: data-science
series_part: true
giscus_comments: false
related_posts: false
toc:
  sidebar: left
---

> *Part 6 of the series: **[From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration: A Deep Dive](/blog/co-authorship-series/)***

---

## The Institution Network

So far I've been looking at the network through the lens of individual researchers. But there's another way to slice it: by institution. If two institutions have authors who co-published a paper, those institutions are connected. The weight of the connection is the number of shared publications. This is essentially a [bipartite graph](https://en.wikipedia.org/wiki/Bipartite_graph) projection: the original data has authors connected to papers, and I project it onto institutions by saying "two institutions are linked if they share at least one paper."

This gives us a very different view. Instead of 39,206 nodes and 323,633 edges, the institution network has **5,628 institutions connected by 61,059 collaboration edges**. It's a more tractable graph, and it reveals the organizational backbone of CF research.

Here's a bar chart of the top 30, with bars stacked by era to show how each institution's output split between pre- and post-Trikafta:

<iframe src="{{ '/assets/plotly/eda_top_institutions.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

And the same data ranked by total collaboration volume (weighted degree), colored by institution type:

<iframe src="{{ '/assets/plotly/tier5_top_institutions.html' | relative_url }}" frameborder='0' scrolling='no' height="860px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

### The Top 10 Institutional Hubs

| Rank | Institution | Country | Shared Publications | Collaborating Institutions |
|------|-----------|---------|-------------------|--------------------------|
| 1 | University of Washington | US | 2,102 | 534 |
| 2 | Cystic Fibrosis Foundation | US | 1,924 | 532 |
| 3 | University of Toronto | CA | 1,736 | 554 |
| 4 | Imperial College London | GB | 1,517 | 527 |
| 5 | UNC Chapel Hill | US | 1,414 | 496 |
| 6 | Univ. of Alabama at Birmingham | US | 1,286 | 438 |
| 7 | The Hospital for Sick Children | CA | 1,178 | 431 |
| 8 | Charite Campus Mitte | DE | 1,168 | 467 |
| 9 | University of Queensland | AU | 1,161 | 409 |
| 10 | National Jewish Health | US | 1,157 | 370 |

The University of Toronto has the most institutional connections (554 collaborating institutions), even though the University of Washington has the most shared publications (2,102). This suggests UW has deeper relationships with fewer partners, while U of T has broader but shallower connections.

The CF Foundation at #2 is interesting. It's not a research university or hospital. It's a nonprofit that funds and coordinates clinical trial networks, which is why it shows up as a shared affiliation on so many multi-center studies. Its structural position in the network reflects its role as an enabler of collaboration.

---

## Who's Collaborating With Pharma?

CF research has a significant industry component, mostly driven by Vertex Pharmaceuticals, which developed the CFTR modulator drugs. I classified the 5,799 organizations into broad types (academic, hospital, industry, government, other) and mapped the academic-industry collaboration patterns.

**Vertex Pharmaceuticals dominates** the industry side with 558 shared publications across its two main facilities (378 from the Boston campus, 180 from additional sites). No other company comes close.

<iframe src="{{ '/assets/plotly/tier5_industry_connections.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

### Top Academic Centers by Industry Collaboration

| Institution | Country | Shared Publications with Industry | Industry Partners |
|-------------|---------|----------------------------------|-------------------|
| Imperial College London | GB | 52 | 25 |
| Univ. of Alabama at Birmingham | US | 46 | 26 |
| Universita di Napoli Federico II | IT | 44 | 5 |
| Charite Campus Mitte | DE | 42 | 20 |
| University of Toronto | CA | 39 | 24 |
| National Jewish Health | US | 39 | 16 |
| Medical Univ. of South Carolina | US | 34 | 22 |
| University of Washington | US | 33 | 20 |
| UNC Chapel Hill | US | 30 | 23 |
| Harvard Medical School | US | 28 | 15 |

An interesting contrast: Napoli Federico II has 44 shared publications with industry but only 5 industry partners. That's a deep relationship with a small number of companies (likely Vertex and CEINGE Biotecnologie). Meanwhile, UAB has 46 publications spread across 26 different industry partners, a much broader portfolio.

---

## Institution Type Mixing

Who collaborates with whom at the organizational level? The mixing patterns reveal the structure of the research ecosystem:

<iframe src="{{ '/assets/plotly/tier5_type_mixing.html' | relative_url }}" frameborder='0' scrolling='no' height="560px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

| Collaboration Type | Shared Publications |
|-------------------|-------------------|
| Academic - Hospital | 32,707 |
| Academic - Academic | 26,319 |
| Hospital - Hospital | 15,090 |
| Academic - Other | 11,212 |
| Hospital - Other | 8,448 |
| Academic - Industry | 1,618 |
| Hospital - Industry | 1,120 |
| Academic - Government | 684 |

The academic-hospital axis is the strongest collaboration channel in CF research, which makes sense: most CF research is clinical, conducted by university-affiliated physicians working in hospital settings. The academic-industry connection (1,618 shared publications) is smaller but growing, driven almost entirely by Vertex's clinical trial network.

---

## The Age of Research: How Old Are These Institutions?

This is something I couldn't have done with just the Google Places data. By enriching the top 1,000 institutions with data from the [Research Organization Registry (ROR)](https://en.wikipedia.org/wiki/Research_Organization_Registry), an open, community-led registry of research organizations worldwide, I got founding years for 937 of them. The results add a whole new dimension to the analysis.

### The Age Distribution

<iframe src="{{ '/assets/plotly/ror_age_distribution.html' | relative_url }}" frameborder='0' scrolling='no' height="510px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

| Age Cohort | Institutions | Publication Share | Median Connections |
|-----------|-------------|------------------|--------------------|
| Legacy (pre-1900) | 372 (39.7%) | **47.4%** | 67 |
| Established (1900-1960) | 206 (22.0%) | 21.6% | 53 |
| Modern (1960-2000) | 252 (26.9%) | 22.1% | 50 |
| Newcomer (2000+) | 107 (11.4%) | 8.8% | 50 |

Legacy institutions, places like the University of Washington (1861), University of Toronto (1827), UNC Chapel Hill (1789), and Charite (1710), make up about 40% of the institutions but account for nearly **half of all CF research output**. The accumulated advantages of centuries of infrastructure, reputation, and network position show up clearly in the data.

But the newcomers are interesting too. Seattle Children's Research Institute (2006) already has 674 shared publications. Perth Children's Hospital (2018) and University Paris Cite (2019) are climbing fast despite being less than a decade old. Several of these "newcomer" institutions are actually reorganizations or spin-offs from existing legacy institutions, which explains their rapid rise.

### Does Age Predict Influence?

<iframe src="{{ '/assets/plotly/ror_age_vs_centrality.html' | relative_url }}" frameborder='0' scrolling='no' height="610px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>
*Hover over points for details.*

I ran [Spearman rank correlations](https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient) between institutional age and four centrality metrics. Spearman correlation measures whether two variables tend to increase together, without assuming a linear relationship. It ranges from -1 (perfect inverse relationship) to +1 (perfect positive relationship), with 0 meaning no relationship:

| Metric | Correlation (rho) | p-value |
|--------|------------------|---------|
| Betweenness centrality | **0.223** | 4.6 x 10^-12 |
| PageRank | 0.151 | 3.3 x 10^-6 |
| Degree | 0.141 | 1.4 x 10^-5 |
| Weighted degree | 0.101 | 0.002 |

The correlations are statistically significant but modest. Institutional age explains some of the variance in network position, but it's far from deterministic. **Betweenness centrality has the strongest age effect** (rho = 0.223), meaning older institutions are disproportionately likely to be bridges between different research groups. This makes sense: centuries of accumulated alumni, collaborations, and institutional relationships create structural connections that newer institutions can't replicate overnight.

But the scatter plot tells a more nuanced story. There's a cloud of legacy institutions at various centrality levels, meaning being old doesn't guarantee being important. And there are newcomers punching well above their weight.

### Did Trikafta Shift Power Toward Newer Institutions?

<iframe src="{{ '/assets/plotly/ror_era_dynamics.html' | relative_url }}" frameborder='0' scrolling='no' height="560px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

| Cohort | Era 1 Share | Era 2 Share | Shift |
|--------|------------|------------|-------|
| Legacy (pre-1900) | 49.2% | 46.9% | -2.3% |
| Established (1900-1960) | 19.6% | 22.2% | **+2.6%** |
| Modern (1960-2000) | 22.3% | 22.1% | -0.2% |
| Newcomer (2000+) | 8.8% | 8.8% | 0.0% |

The shift is subtle but real. Legacy institutions lost 2.3 percentage points of network share between eras, while the Established cohort (1900-1960) gained 2.6 points. The Modern and Newcomer cohorts stayed flat.

This doesn't mean the Trikafta revolution redistributed power away from old institutions in any dramatic way. The legacy institutions still dominate. But the established mid-century institutions, places like the CF Foundation (1955), National Jewish Health (1899), and many of the major children's hospitals, gained relative ground. These are exactly the institutions most deeply embedded in CF clinical trial networks, which expanded significantly in the Trikafta era.

### The Age Map

<iframe src="{{ '/assets/plotly/ror_age_map.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The geographic pattern is clear: legacy institutions (blue) cluster in the US Northeast, UK, and Western Europe. Newcomers (red) are more evenly distributed globally, appearing in Turkey, Australia, and Latin America as well as traditional research hubs. The Trikafta era is gradually diversifying the geographic and institutional landscape of CF research, even if the old powerhouses still dominate.

### ROR-Based Type Mixing

With the ROR enrichment, I can also redo the type mixing analysis from earlier using ROR's cleaner 18-type taxonomy instead of Google's 278 fragmented categories. The biggest difference: ROR allows multi-valued types (49% of institutions have 2+ types like "education;funder;healthcare"), which captures the reality that a university hospital is both educational and clinical:

<iframe src="{{ '/assets/plotly/ror_type_mixing.html' | relative_url }}" frameborder='0' scrolling='no' height="610px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The funder-education axis dominates, which makes sense: most research institutions are both educational and funded. The healthcare-funder axis is the next strongest, reflecting hospital-based research funded by grants.

---

## The Global Map

CF research spans 95 countries, but the distribution is far from even. The map below shows every city with 5 or more CF publications, with bubble size proportional to publication count.

<iframe src="{{ '/assets/plotly/eda_global_map.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The concentration is striking. North America (especially the US East Coast and Toronto), Western Europe (London, Paris, Milan, Berlin), and pockets of Australia dominate. Large parts of the world, most of Africa, South Asia, Southeast Asia, Latin America, have minimal CF research presence. This reflects both the epidemiology of CF (it's most common in populations of European descent) and the distribution of research funding.

Even more revealing is the animated version that shows how these hubs evolved over time. Use the play button or drag the year slider to watch cities grow:

<iframe src="{{ '/assets/plotly/cf_hubs_animated.html' | relative_url }}" frameborder='0' scrolling='no' height="760px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

Some highlights to watch for: Seattle surges from a minor hub to a global top-3 center (home of the CF Foundation's Therapeutics Development Network). Ankara, Turkey emerges from nothing to become a significant contributor. Boston grows steadily (home of Vertex Pharmaceuticals). And the European hubs (Paris, London, Milan) maintain their positions throughout.

### Top Countries

<iframe src="{{ '/assets/plotly/eda_top_countries.html' | relative_url }}" frameborder='0' scrolling='no' height="510px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The US accounts for roughly a third of all CF research output, followed by the UK, Italy, France, Germany, Canada, and Australia. Turkey has emerged as a significant contributor in Era 2, driven largely by the Hacettepe University group that showed up in the centrality rankings.

### International Collaboration Corridors

**46% of institutional collaborations cross national borders.** The strongest corridors:

<iframe src="{{ '/assets/plotly/tier5_intl_corridors.html' | relative_url }}" frameborder='0' scrolling='no' height="660px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The US-UK corridor (2,526 shared publications) is the single strongest international research relationship in CF. The US-Canada (2,134) and US-Australia (1,618) corridors are next. Within Europe, Germany-France (912) and France-Italy (647) are the strongest continental partnerships.

The Anglophone bias is obvious: the top 5 corridors all involve English-speaking countries. The European cross-language corridors (Germany-France, France-Italy, Germany-Netherlands) are strong but consistently smaller, suggesting that language and cultural barriers still shape who collaborates with whom, even in science.

---

*Next: [Part 7: Research DNA, Innovation Catalysts, and Knowledge Diffusion]({% post_url 2026-04-09-co-authorship-part7-graph-ml %})*
