---
layout: post
title: "Disambiguating 43,000 Author Names with Temporal Intelligence"
date: 2026-04-09 20:20:00
description: "Part 3: ORCID anchoring, collision-aware matching, temporal transitions, and F1=0.9996"
tags: [co-authorship, entity-resolution, disambiguation, orcid]
categories: data-science
series_part: true
giscus_comments: false
related_posts: false
toc:
  sidebar: left
---

> *Part 3 of the series: **[From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration: A Deep Dive](/blog/co-authorship-series/)***

---

## The Author Identity Problem

In PubMed, authors are identified by name. Not by a unique ID, not by an account number. Just their name as it appears on the paper. This is the [entity resolution](https://en.wikipedia.org/wiki/Record_linkage) problem: figuring out which records in a database refer to the same real-world entity. It creates two opposite problems:

1. **Name collisions**: "Wang, X" in the dataset matches 4 different researchers. "Zhang, L" matches 3. These are genuinely different people who happen to share a last name and initial.
2. **Name variants**: "Gokcen" and "Gokcen" are the same person, one with Turkish special characters and one without. "Silva-Filho" and "Silva Filho" are the same person, one hyphenated and one not. "Greg" and "Gregory" and "Gregory S" are all the same person at different levels of name completeness.

The scale of it: **42,949 unique (last name, first name, initials) combinations** across 85,194 author-article appearances. Some unknown fraction of those are duplicates. Some are collisions. The goal is to figure out which is which and resolve them into about 39,000 real people.

---

## The Signals, Ranked by Reliability

### 1. ORCID: Ground Truth (13% coverage)

[ORCID](https://en.wikipedia.org/wiki/ORCID) is a persistent digital identifier for researchers, like a Social Security number for scientists. When two records share an ORCID, they're definitively the same person. The dataset has 6,293 unique ORCIDs covering 14,593 author-article rows (13.1%). That's enough to serve as ground truth for evaluating the algorithm, even though it only covers a fraction of the data.

ORCIDs do double duty here: they anchor known identities, and they give us ground truth for measuring how well the disambiguation works on the other 87%.

### 2. Organization ID: Strong Signal (91.5% coverage)

From Part 2, I have a canonical org_id for 91.5% of author rows. "Smith, John" at the same institution across multiple papers is very likely the same person. That said, there are 20 known exceptions where the same (name, org) combination maps to different ORCIDs, meaning genuinely different people at the same institution with the same name.

### 3. Name Similarity: Moderate Signal

Name matching sounds simple. It really isn't. Here's what the matcher has to deal with:

- **Compound last names**: "Silva-Filho" should match "Silva Filho" (hyphen variants). The algorithm normalizes hyphens, sorts name parts alphabetically, and computes overlap.
- **First/last name swaps**: "Tana Aslan, Ayse" vs "Aslan, Ayse Tana". This comes up a lot with Turkish and Brazilian naming conventions. The algorithm detects cross-part overlap between the first and last name fields.
- **Prefix matching with length guards**: "Mirjam" should match "M" (it's just an initial). But "Fang" should NOT match "Fangyu". The shorter name has to be at least 60% of the longer one to qualify.
- **Unicode normalization**: "Ozturk" becomes "Ozturk" via transliteration before any comparison.

The name matcher produces a score from 0.0 to 1.0, combining a last-name component (compound handling, swap detection) with a first-name component (exact match, prefix match, initial match).

### 4. Co-authorship Overlap: Supporting Signal

If two name variants frequently show up on papers with the same co-authors, they're likely the same person. This is computed as [Jaccard similarity](https://en.wikipedia.org/wiki/Jaccard_index) of co-author name sets across papers. Jaccard similarity is simply the size of the overlap divided by the size of the union: if two authors share 3 co-authors out of 10 total unique co-authors between them, the Jaccard similarity is 3/10 = 0.3.

---

## The Collision-Aware Strategy

Not all names deserve the same treatment. "Felix Ratjen" is unique enough that name similarity alone can safely merge records. "Wang, X" is so common that merging on name alone would be catastrophic.

I maintain a curated set of 40+ **high-collision surnames** (Zhang, Wang, Li, Chen, Kim, Patel, Smith, Brown, and so on) that need extra confirmation before merging:

| Scenario | What's required |
|----------|-----------------|
| Rare name, high name score (>=0.85) | Name alone is enough |
| Rare name, moderate score (>=0.5) | Name + org match OR co-author overlap |
| **High-collision name**, high score (>=0.85) | Name + org match, OR name + co-author overlap |
| **High-collision name**, very high score (>=0.95) | Name + org match |

This asymmetry is intentional. For co-authorship networks, **false positives are worse than false negatives**. A wrong merge creates fake connections between unrelated research groups. A missed merge just means one researcher shows up as two nodes. Not ideal, but not destructive either.

---

## The Temporal Problem: Researchers Move

Here's where publication dates become critical. Consider this:

- "Krick, Stefanie" published from UAB Medical Center in 2015 through 2017
- "Krick, Stefanie" published from UAB Hospital starting in 2017 through 2025

Without temporal awareness, the algorithm sees two different org_ids and might hesitate to merge (especially if the name were more common). But with temporal awareness, it sees a plausible career transition: the first affiliation ends right as the second one begins.

### How Common Are Institution Changes?

Using ORCID ground truth (6,126 researchers who have both an ORCID and an org_id) to measure the actual prevalence:

| Metric | Value |
|--------|-------|
| Researchers at exactly 1 org (2015--2025) | 4,332 (70.7%) |
| Researchers at 2+ orgs | 1,794 (29.3%) |
| Researchers at 3+ orgs | 505 (8.2%) |

**Nearly 1 in 3 researchers published from multiple institutions over those 10 years.** This isn't some rare edge case. It's just how academic science works.

### Transition Patterns

Those 1,794 multi-org researchers fall into three patterns:

| Pattern | Count | Pct | What it looks like |
|---------|-------|-----|-------------|
| Overlapping | 1,278 | 71.2% | Published from both orgs in the same year range, usually a transition period or dual affiliation |
| Concurrent | 348 | 19.4% | Sustained dual appointment (hospital + university, for instance) |
| Sequential | 168 | 9.4% | A clean move: stopped publishing from org A, then started at org B |

**Real examples from the data:**

- **Sequential move**: Aykut Eski went from Ege University (2020) to Istanbul University (2025). A clear career move with a 5-year gap.
- **Overlapping transition**: Kevin J. Downes had Children's Hospital of Philadelphia (2022--2023) overlapping with University of Pennsylvania (2022). Dual appointment during the transition.
- **Concurrent affiliation**: Abbey Sawyer was at Curtin University, the Institute for Respiratory Health, *and* Sir Charles Gairdner Hospital all at the same time (2020--2021). Three simultaneous affiliations.

### Year Gap Calibration

For sequential transitions, how many years typically pass between the last publication at org A and the first at org B?

| Gap (years) | Percentage |
|-------------|-----------|
| 1 year | 24.4% |
| 2 years | 30.1% |
| 3 years | 18.8% |
| 4 years | 12.5% |
| 5 years | 8.5% |
| 6+ years | 5.7% |

**94.3% of transitions happen within a 5-year gap.** This directly calibrates the algorithm: two records with different orgs but publication years within 5 years of each other are temporally compatible. They *could* be the same person who moved.

### What's the False Positive Risk?

The big question: if I allow cross-org merging with temporal compatibility, how often will it incorrectly merge two different people?

Among ORCID-bearing names that appear at 2+ orgs:
- **1,778 (96.6%)** are the same person. Safe to merge.
- **63 (3.4%)** are genuinely different people. These would be false positives.

And those 63 cases are almost entirely high-collision names (Kim, Wang, Zhang, Li). The collision-aware strategy already requires co-author confirmation for those, which catches them.

---

## The Full Algorithm

The disambiguation runs in four phases:

**Phase 1: ORCID Anchoring.** All records sharing an ORCID get pre-merged. This handles 6,293 known identities covering 10,097 records.

**Phase 2: Affiliation Imputation.** 9,453 rows are missing an org_id. Two safe imputation strategies recover 2,526 of them:
- ORCID-based: if the same ORCID appears elsewhere with an org, assign that org (647 rows)
- Unique-name: if "Smith, John" only shows up at one org across the entire dataset, assign that org to the missing rows (1,879 rows)

**Phase 3: Pairwise Comparison.** Records get grouped ("blocked") by normalized last name parts to avoid comparing every possible pair (85K x 85K would be 3.6 billion comparisons). Within each block, every pair gets scored on name similarity, org overlap, temporal compatibility, and co-author overlap. The decision logic applies the collision-aware thresholds.

All merge decisions feed into a [union-find](https://en.wikipedia.org/wiki/Disjoint-set_data_structure) data structure with path compression. Union-find is an elegant data structure that handles transitive merges automatically. Think of it like a family tree: if I determine that record A and record B are the same person, and separately that B and C are the same person, union-find automatically figures out that A, B, and C are all the same person without me having to check every possible pair. This is critical because with 85K records, checking all pairs (3.6 billion comparisons) would be computationally infeasible.

**Phase 4: ORCID Propagation.** After clustering, ORCIDs propagate within clusters. If any record in a cluster has an ORCID, every record in that cluster inherits it. This expanded ORCID coverage from 10,097 records to 31,087, a 3x increase.

---

## Results

| Metric | Value |
|--------|-------|
| Input: author-article appearances | 84,709 |
| Output: unique author IDs | 39,206 |
| Reduction | 53.7% |
| Singletons (1 appearance only) | 27,881 |
| Largest cluster | 166 articles (Felix Ratjen, the most prolific CF researcher) |
| ORCID propagation | +20,990 records gained an ORCID |

### Validation Against ORCID Ground Truth

The 6,293 ORCIDs give us a solid evaluation: for every pair of records sharing an ORCID, did the algorithm put them in the same cluster?

| Metric | Without temporal awareness | With temporal enhancement |
|--------|-------------------------------|--------------------------|
| Precision | 0.988 | **0.9992** |
| Recall | 0.947 | **1.0000** |
| F1 | 0.967 | **0.9996** |
| False negative ORCIDs (split) | 150 | **0** |
| False positive clusters | 49 | 45 |

The temporal enhancement eliminated all 150 false negatives. Every single ORCID-confirmed person was correctly unified. It also knocked a few false positives off.

The 45 remaining false positive clusters aren't actually algorithm errors. They're ORCID data quality issues: researchers who somehow ended up with multiple ORCID IDs. Schwarz, Carsten, for example, has two different ORCIDs that both belong to the same person.

### Mobility in the Final Dataset

| Pattern | Authors | Pct |
|---------|---------|-----|
| Single organization | 29,385 | 75.0% |
| Concurrent affiliations | 8,015 | 20.4% |
| Sequential career move | 1,806 | 4.6% |
| **Total at 2+ orgs** | **9,821** | **25.0%** |

Each author's record includes a full affiliation timeline: every org they published from, along with the year range. This makes temporal analysis of career trajectories possible across the entire research community.

---

## The Most Prolific Researchers

| Author | Articles | Orgs | Years Active |
|--------|----------|------|-------------|
| Felix A. Ratjen | 166 | 6 | 2015--2025 |
| Christopher H. Goss | 136 | 13 | 2015--2025 |
| Marcus A. Mall | 127 | 42 | 2015--2025 |
| Isabelle Sermet-Gaudelus | 123 | 35 | 2015--2025 |
| Jane C. Davies | 122 | 26 | 2015--2025 |

The high org counts for top researchers reflect multi-institutional clinical trials. A single trial paper can list 30+ institutional affiliations. Marcus Mall didn't actually work at 42 different places.

---

## The Clean Dataset

Before jumping into the schema, here's a bird's-eye view of what the disambiguated dataset looks like:

<iframe src="{{ '/assets/plotly/eda_author_productivity.html' | relative_url }}" frameborder='0' scrolling='no' height="500px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The left panel shows the classic power-law distribution of scientific productivity: the vast majority of researchers (27,881) published just one paper in the CF field, while a small number published dozens or even over 100. The right panel shows the era breakdown: 10,709 researchers only published in Era 1 (and then left the field or retired), 23,325 are newcomers who only appear in Era 2, and 5,172 span both eras. Those 5,172 continuity researchers will turn out to be the structural backbone of the network in Part 4.

<iframe src="{{ '/assets/plotly/eda_era_comparison.html' | relative_url }}" frameborder='0' scrolling='no' height="500px" width="100%" style="border: 1px solid #ddd; border-radius: 5px;"></iframe>

The era comparison dashboard shows the scale of the shift: Era 2 has nearly twice the publications, 80% more unique authors, and almost double the number of unique MeSH topics. The donut chart (top left) shows how author populations overlap between eras, and the bar charts compare country-level and institution-type distributions.

The final output is a normalized, relational dataset ready for network analysis:

**Entity tables:**
- 11,500 publications with title, abstract, journal, year, MeSH terms
- 39,206 disambiguated authors with canonical names, ORCIDs, and mobility patterns
- 5,799 research organizations with coordinates and categories

**Relationship tables:**
- 84,709 publication-to-author links (with author position)
- 53,689 author-to-organization links (with year ranges)
- 37,832 publication-to-organization links
- 138,062 publication-to-MeSH term links (with major/minor flags)

Every foreign key validated. Zero orphan records. Ready for graph construction.

---

*Next: [Part 4: The Small World of CF Research]({% post_url 2026-04-09-co-authorship-part4-network-structure %})*
