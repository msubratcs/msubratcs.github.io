---
layout: post
title: "Part 2: Resolving 57,000 Affiliation Strings to 5,800 Research Organizations"
date: 2026-04-09 20:10:00
description: "Part 2: LLM-based affiliation parsing, systematic evaluation with MLflow, and geo-search deduplication"
tags: [co-authorship, llm, entity-resolution, mlflow, evaluation]
categories: data-science
series_part: true
giscus_comments: false
related_posts: false
---

> *Part 2 of the series: **[From Open Source Data to Powerful Insights on Cystic Fibrosis Research Collaboration](/blog/cf-research-network-analysis/)***

---

## The Problem

Every author on a PubMed article has an affiliation string. In theory, this tells you where they work. In practice, it tells you whatever the journal's submission system happened to collect that day.

Here's what 57,675 distinct affiliation strings look like in the wild:

- *"Division of Pulmonary Medicine, Department of Pediatrics, Hospital for Sick Children, Toronto, ON, Canada"*
- *"SickKids Research Institute, Peter Gilgan Centre for Research and Learning, Toronto, Canada"*
- *"The Hospital for Sick Children, University of Toronto, Toronto, ON, Canada M5G 1X8; felix.ratjen@sickkids.ca"*

These are all the same hospital. But to a computer, they're three completely different strings.

Or consider the University of Alabama at Birmingham, which shows up as:

```
"University of Alabama at Birmingham"
"University of Alabama at Birmingham (UAB)"
"University of Alabama at Birmingham (UAB) School of Medicine"
"UAB School of Medicine"
```

For a co-authorship network, each institution needs to be a single node, not 4 variants creating 4 disconnected clusters.

The challenge breaks down into three pieces:

1. **Parsing**: Pull out the institution name, city, and country from free text that's a mess of department hierarchies, street addresses, postal codes, and email addresses.
2. **Deduplication**: Merge variants of the same institution. Language differences ("Universite de Montreal" vs "University of Montreal"), abbreviations ("UCSF" vs "University of California San Francisco"), granularity mismatches ("Johns Hopkins University" vs "Johns Hopkins University School of Medicine").
3. **Enrichment**: Give each institution a canonical ID, geographic coordinates, and a category (university, hospital, pharma company, government lab).

---

## Why Algorithmic Approaches Plateau

Before reaching for LLMs, it made sense to try pure algorithmic approaches first. Five strategies, all evaluated against ORCID-linked ground truth. The logic: if two author records share an ORCID, their affiliations should resolve to the same institution.

| Strategy | Consistency |
|----------|-------------|
| Token-based Jaccard similarity | 74.6% |
| Structured parsing into key match | 70.8% |
| Combined key + city + country | 75.7% |
| Priority-based institution extraction | 64.4% |
| City + institution composite | 68.6% |

The theoretical ceiling is around 87%, because roughly 13% of [ORCID](https://en.wikipedia.org/wiki/ORCID) pairs represent genuine institution changes where the researcher actually moved between 2015 and 2025. So the best algorithmic approach captures about 87% of what's theoretically possible. Not bad, but not good enough for what I'm trying to build. At 76% consistency, roughly 1 in 4 institution assignments would be wrong, and those errors would create fake institutional connections in the network downstream.

The fundamental problem is that affiliations are natural language written for humans, not machines. "School of Medicine" appears 555 times across dozens of different universities. No amount of string similarity can tell you *which* School of Medicine without understanding the surrounding context.

---

## The LLM-First Strategy

Instead of trying to pattern-match raw text, why not use a [large language model](https://en.wikipedia.org/wiki/Large_language_model) (LLM) to do what humans do naturally? Read the affiliation string and pull out the structured information. LLMs are trained on massive amounts of text and have seen enough university names, hospital hierarchies, and address formats to understand what "CHU de Toulouse - Hopital des Enfants" means even though it's in French and uses abbreviations.

Here's the full pipeline from start to finish:

```
85,194 author rows
  → Explode affiliation arrays, split on semicolons
108,264 affiliation segments
  → Strip, clean, deduplicate
50,981 distinct affiliations
  → LLM structured extraction
50,981 parsed records (entity_type, org_chain, city, country, etc.)
  → Normalize org names (lowercase, remove accents/quotes)
8,815 unique clean org names
  → Geocode via search API (5 iterative runs)
8,805 geocoded orgs (99.9%)
  → Deduplicate by canonical Place ID
5,799 unique research organizations
```

That's a 93% reduction from raw affiliations to unique orgs.

### Structured Output Design

The LLM extracts each affiliation into a structured schema with 12 fields:

- **org_chain**: The full organizational hierarchy from innermost to outermost, like `["Division of Pulmonary Medicine", "Department of Pediatrics", "Hospital for Sick Children"]`
- **entity_type**: Classification into one of 12 types (department, institute, hospital, university, company, government, etc.)
- **top_parent_org**: The highest-level organization. This becomes the dedup key.
- **city, state_or_region, country, postal_code**: Geographic anchors
- **institution_name_english**: A translation for non-English names
- **email, phone, street_address**: Contact info that sometimes shows up in affiliations
- **unclassified_text**: A catch-all for postal codes, street fragments, and noise the model can't confidently assign

The prompt uses Jinja2 templating with 4 carefully chosen few-shot examples covering the key extraction challenges: a deep academic hierarchy, a hospital-within-university, a government agency with a relationship qualifier, and a degenerate single-department input. There's also an explicit rule: "Never assume or infer information not explicitly present in the text."

Structured output guarantees are handled differently by each provider. OpenAI enforces the JSON schema at decoding time and returns typed Pydantic instances. Anthropic uses forced tool calls where the tool's input schema is the Pydantic JSON schema. Each approach has its quirks, but they all guarantee valid structured output on every call.

### What It Actually Looks Like: Input vs Output

To make this concrete, here's what the LLM actually does with a real affiliation from the dataset.

**Input:**
> "Division of Pulmonary Medicine, Department of Pediatrics, Nationwide Children's Hospital, ED 444 700 Children's Drive, Columbus, OH, 43205, USA, shahid.sheikh@nationwidechildrens.org."

There's a lot packed into that string: a 3-level organizational hierarchy, a street address, a zip code, a state abbreviation, and an email address. The LLM disentangles all of it:

**Output:**
```json
{
  "entity_type": "hospital",
  "org_chain": [
    {"type": "division", "name": "Division of Pulmonary Medicine"},
    {"type": "department", "name": "Department of Pediatrics"},
    {"type": "hospital", "name": "Nationwide Children's Hospital"}
  ],
  "top_parent_org": "Nationwide Children's Hospital",
  "city": "Columbus",
  "state_province": "OH",
  "country": "USA",
  "postal_code": "43205",
  "street_address": "ED 444 700 Children's Drive",
  "email": "shahid.sheikh@nationwidechildrens.org"
}
```

The org_chain captures the full hierarchy from innermost (division) to outermost (hospital). The top_parent_org identifies "Nationwide Children's Hospital" as the parent institution, which becomes the dedup key. And all the noise (street address, zip code, email) gets cleanly separated into its own fields.

Here are a few more examples showing the range of what we're dealing with:

**Pharma company (straightforward):**
> "Vertex Pharmaceuticals Incorporated, Boston, MA, United States."

```json
{
  "entity_type": "industry",
  "org_chain": [{"type": "company", "name": "Vertex Pharmaceuticals Incorporated"}],
  "top_parent_org": "Vertex Pharmaceuticals Incorporated",
  "city": "Boston",
  "state_province": "MA",
  "country": "United States"
}
```

**French academic with 4-level hierarchy:**
> "L'UNAM Universite, Universite d'Angers, Groupe d'Etude des Interactions Hote-Pathogene, EA 3142, Angers, France"

```json
{
  "entity_type": "academic",
  "org_chain": [
    {"type": "university", "name": "L'UNAM Universite"},
    {"type": "university", "name": "Universite d'Angers"},
    {"type": "other", "name": "Groupe d'Etude des Interactions Hote-Pathogene"},
    {"type": "other", "name": "EA 3142"}
  ],
  "top_parent_org": "Universite d'Angers",
  "city": "Angers",
  "country": "France"
}
```

Notice that the model correctly identifies "Universite d'Angers" as the top parent, even though "L'UNAM Universite" appears first in the text. L'UNAM is actually a multi-university consortium, not the parent org. Getting this right requires understanding the French academic system.

**Spanish hospital with embedded email:**
> "Pediatric Pulmonology Unit, 'Virgen de la Arrixaca' Children's University Hospital, University of Murcia, Murcia, Spain. Electronic address: msolis@um.es."

```json
{
  "entity_type": "hospital",
  "org_chain": [
    {"type": "other", "name": "Pediatric Pulmonology Unit"},
    {"type": "hospital", "name": "Virgen de la Arrixaca Children's University Hospital"},
    {"type": "university", "name": "University of Murcia"}
  ],
  "top_parent_org": "University of Murcia",
  "city": "Murcia",
  "country": "Spain",
  "email": "msolis@um.es",
  "unclassified_text": ["Electronic address:"]
}
```

The "Electronic address:" prefix gets put into unclassified_text (it's not part of the org or the email itself), and the model correctly routes the email to its own field. The top_parent_org is "University of Murcia" because the hospital is a university hospital within that system.

---

## I Needed a Proper Eval

You can't just pick an LLM and hope for the best. Different models handle edge cases differently, and I needed to know exactly where each one breaks down before committing to processing 50,000+ affiliations.

### Building the Gold Dataset

I hand-labeled 50 affiliations sampled across 9 difficulty buckets:

| Bucket | Count | What makes it hard |
|--------|-------|--------------------|
| Easy standard | 8 | Straightforward English academic affiliations |
| Deep hierarchy | 7 | 4+ organizational levels nested inside each other |
| Multilingual | 6 | French, German, Turkish, Chinese institution names |
| Industry | 5 | Pharma companies, biotech, CROs |
| Government/nonprofit | 5 | NIH, NHS Trusts, INSERM, national health agencies |
| Address noise | 5 | Street addresses, zip codes mixed into the text |
| Ambiguous/bad | 4 | Truncated strings, typos, genuinely malformed input |
| Has email | 5 | Email addresses embedded in the affiliation |
| Multi-institution | 5 | Two or more institutions in a single string |

### The MLflow Setup

Before running any evaluations, I needed proper infrastructure to track everything. This is where MLflow comes in, and honestly, the GenAI features in recent releases have been a game-changer for this kind of work.

Here's what the setup looks like:

- **Prompt Registry**: The extraction prompt is versioned in MLflow's Prompt Registry. Re-running the eval only creates a new prompt version if the template actually changed. This means I can iterate on the prompt and always know exactly which version produced which results.
- **Dataset Lineage**: The 50-example gold dataset is registered as an MLflow dataset with a content digest. Every evaluation run links back to the exact data it was scored against. If someone later asks "what data did you evaluate on?", there's no ambiguity.
- **Auto-tracing**: MLflow autolog captures token counts, latency, and cost per API call. Every single LLM call during evaluation is traced, so I can drill into individual examples to see exactly what the model returned and why it scored the way it did.
- **Experiment Tracking**: All 6 model evaluations live under a single MLflow experiment. Comparing runs side-by-side in the MLflow UI makes it trivially easy to spot which model wins on which metric.

### Six Models, Head to Head

I evaluated 6 models from three providers (OpenAI, Anthropic, Google) using 11 deterministic scorers. No LLM-as-judge here. Some evaluation frameworks use one LLM to judge the output of another, but that introduces stochastic variance: you might get a different score if you run it again. For structured extraction where I have known ground truth (my 50 hand-labeled examples), deterministic [precision/recall/F1](https://en.wikipedia.org/wiki/F-score) metrics are more informative and perfectly reproducible.

The scorers form a hierarchy from structural validity (did the model return valid JSON? did it pass Pydantic validation?) through geographic accuracy (city, country, state) to semantic accuracy (org_chain F1, entity_type, top_parent_org).

[MLflow](https://mlflow.org/) tracked every run: model version, prompt version, per-field metrics, cost, latency, token counts, and cache hit rates. MLflow is an open-source platform for managing the ML lifecycle. It's especially powerful here because it provides prompt versioning (so I know exactly which prompt produced which results), dataset lineage (linking every run to the exact test data), and auto-tracing that captures every API call. Every evaluation links back to the exact gold dataset version it was scored against.

**The results:**

| Model | org_chain F1 | top_parent_org | entity_type | city | country | Cost/example | Latency |
|-------|:-----------:|:--------------:|:-----------:|:----:|:-------:|:----------:|:-------:|
| **gpt-5.4-mini** | **0.960** | 0.960 | 0.860 | **1.000** | **1.000** | **$0.0005** | **1.3s** |
| gemini-3-flash | 0.895 | 0.880 | 0.820 | 0.920 | 0.940 | $0.0014 | 7.0s |
| gpt-5.4 | 0.940 | 0.980 | 0.860 | 0.980 | 1.000 | $0.0015 | 2.0s |
| claude-haiku-4-5 | 0.936 | 0.880 | 0.820 | 0.980 | 1.000 | $0.0046 | 1.8s |
| gemini-3.1-pro | 0.960 | 0.980 | 0.880 | 0.980 | 1.000 | $0.0058 | 11.0s |
| claude-sonnet-4-6 | 0.955 | 0.960 | 0.900 | 1.000 | 1.000 | $0.0059 | 3.3s |

### What I Learned

The aggregate numbers only tell part of the story. The per-bucket breakdown is where things get interesting.

City and country extraction was near-perfect across all models. That's the easy part. The real differentiator was **org_chain** and **entity_type**. Parsing "CHU de Toulouse - Hopital Purpan" into the correct parent institution, or knowing that an NHS Trust is a hospital and not a government agency, takes genuine language understanding.

Some surprises in the per-bucket results:
- On the **government/nonprofit** bucket, most models struggled with entity_type classification. Is "INSERM" a government agency or a research institute? Is an NHS Trust a hospital or a government body? These categories are genuinely ambiguous.
- On **multilingual** affiliations, gpt-5.4-mini and Claude Sonnet were the strongest. Gemini Flash had more trouble with accent handling and non-Latin scripts.
- The **ambiguous/bad** bucket was interesting because the best response to garbage input is to honestly say "I don't know" rather than hallucinate structure that isn't there.

Prompt caching behavior varied wildly across providers. OpenAI does automatic prefix caching (55% hit rate in production). Anthropic Sonnet requires explicit `cache_control` annotations but works well. Anthropic Haiku silently fails at caching because my prompt (~3,200 tokens) falls below its 4,096-token minimum. Gemini does implicit caching that shows up in pricing but isn't reported in metadata.

One gotcha I ran into: MLflow uses LiteLLM under the hood for cost tracking, and LiteLLM's cost calculation is buggy for cached Anthropic calls. When Anthropic returns `cache_read_input_tokens`, LiteLLM computes a *negative* input cost because it doesn't properly account for the discounted cache pricing. The costs reported in MLflow traces for Anthropic models were just wrong. I ended up computing costs myself from the raw token breakdowns using published per-token pricing from each vendor's pricing page. Worth knowing if you're doing similar evaluations.

### The Winner

**gpt-5.4-mini** matched or nearly matched frontier models on every accuracy metric while costing 3-12x less per call:

| Metric | gpt-5.4-mini | Best frontier | Gap |
|--------|:---:|:---:|:---:|
| org_chain F1 | 0.960 | 0.960 (gemini-3.1-pro) | tied |
| top_parent_org | 0.960 | 0.980 (gpt-5.4) | -0.02 |
| city | 1.000 | 1.000 | tied |
| country | 1.000 | 1.000 | tied |
| Cost per call | **$0.0005** | $0.0059 (sonnet) | **12x cheaper** |

The 2% gap on top_parent_org means roughly 1 in 50 affiliations might get a slightly wrong parent org name. At 50K affiliations that's maybe 1,000 cases. But since I'm deduplicating downstream by geocoding, many of these "wrong" names still resolve to the correct physical location. The cost savings of $0.005 per call x 50K = $250 more than justified the tiny accuracy tradeoff.

---

## Batch Processing at Scale

With the model chosen, I needed to process all 50,981 distinct affiliations. At real-time API rates that would be expensive. The OpenAI Batch API offers 50% discounts for non-time-sensitive workloads.

| Metric | Value |
|--------|-------|
| Records | 50,981 |
| Batches | 6 (5 x 10K + 1 x 981, due to OpenAI's 200MB file size limit) |
| Total tokens | 101.8M |
| Cache hit rate | 55% |
| Total time | 2.5 hours |
| Cost | $33 (actual bill) |
| Success rate | 100% (zero failures) |

$33 to parse 51,000 affiliations. That felt like a good deal.

---

## From Parsed Affiliations to Geocoded Organizations

LLM parsing produced 50,981 parsed records. After normalizing the org names (lowercasing, removing accents and quotation marks, collapsing whitespace), I ended up with **8,815 unique organization names**. Already a huge reduction.

But variants still existed:
- "Academic Medical Center" vs "Academic Medical Centre"
- "Universidade de Sao Paulo" (correctly translated, still a duplicate)
- Department-level names that slipped through, like "Department of Immunology" (which university though?)

### The Geo-Search Approach

For each unique org name + city combination, I queried a geo-search API that returns a canonical place ID (a globally unique identifier for a physical location), official name, geographic coordinates, category, and address.

Here's the key insight: **two different strings that resolve to the same physical location are the same institution.** "The Hospital for Sick Children" and "SickKids" both resolve to the same place ID at 555 University Avenue, Toronto. Here's another great example:

```
"post graduate institute of medical education and research"
"post graduate institute of medical education and research (pgimer)"
"post-graduate institute of medical education and research"
"postgraduate institute of medical education and research"
"postgraduate institute of medical education and research (pgimer)"
  → All resolve to: "Post Graduate Institute of Medical Education & Research, Chandigarh"
  → Same Place ID: ChIJ-xpmZ3_yDzkRg5rh7uCJQ60
```

Five name variants, one physical institution.

For orgs with a city and country (8,085 of 8,815), the query was straightforward: `"org_name, city, country"`. For the 730 orgs missing geographic context, I used the full raw affiliation string as the search query, which often contained enough context for the API to figure it out. Between API runs, fuzzy matching (SequenceMatcher >= 0.8 threshold) filled in additional orgs by matching unresolved names to already-geocoded ones.

**Final geocoding result**: 8,805 out of 8,815 orgs matched (99.9%). The remaining 10 are genuinely not physical places (patient advocacy groups, journal editorial offices, research network names).

### Dedup by Place ID

The last step: multiple name variants that resolved to the same place ID get collapsed into a single org record.

**8,815 org name variants -> 5,799 unique Place IDs.** A 34% dedup reduction on top of everything else.

---

## The Full Cost Picture

| Step | Tool | Cost |
|------|------|------|
| LLM evaluation (6 models x 50 examples) | MLflow + OpenAI/Anthropic/Gemini | ~$1 |
| LLM extraction (50,981 affiliations) | OpenAI Batch API (gpt-5.4-mini) | ~$33 |
| Geocoding (8,815 orgs) | Geo-search API | ~$48 |
| **Total** | | **~$82** |

The entire institution disambiguation pipeline, from raw affiliations to 5,799 geocoded organizations, cost $82. That seemed worth it.

---

## Coverage Statistics

| Metric | Value |
|--------|-------|
| Author-article pairs | 85,194 |
| Rows with org_id | 102,332 (91.5%) |
| Rows without org_id | 9,453 (8.5%) |
| Unique research orgs | 5,799 |
| Unique countries | 95 |

The 8.5% without an org_id are mostly collective/group authors (471 consortium names like "ECFS Diagnostic Network Working Group"), truly empty affiliations, and edge cases where the affiliation text just didn't contain anything parseable.

---

## Real Examples: The Hard Cases

**Multilingual ambiguity**: *"Centre Hospitalier Universitaire de Toulouse, Hopital des Enfants, Toulouse, France"*. The LLM correctly identified "Centre Hospitalier Universitaire de Toulouse" as the parent institution, not "Hopital des Enfants", which is actually a department within the CHU.

**Multi-institutional affiliations**: *"Department of Pediatrics, University of North Carolina at Chapel Hill; and Marsico Lung Institute/Cystic Fibrosis Research Center, Chapel Hill, NC"*. Pre-split on semicolons, each segment gets parsed independently. The author ends up with two org_ids, correctly representing a dual appointment.

**Pharma companies**: *"Vertex Pharmaceuticals Incorporated, Boston, MA, USA"* parses cleanly. But *"Vertex Pharmaceuticals (Europe) Ltd, London, United Kingdom"* gets a different place ID than the Boston office, and it should. They're separate facilities.

**The generic problem**: *"School of Medicine"* shows up 555 times across dozens of different universities. Without a city or country, there's no way to figure out which one. These fall into the 8.5% without org_id. The LLM returns the institution name just fine, but the geo-search can't disambiguate without geographic context.

---

## Lessons Learned

A few things that weren't obvious going in:

1. **Always evaluate before committing to a model.** gpt-5.4-mini matched frontier accuracy at 3-12x lower cost. I would have wasted hundreds of dollars if I'd just picked the "best" model without checking.
2. **Prompt caching varies wildly across providers.** OpenAI does it automatically, Anthropic needs explicit annotations (with minimum token thresholds that can silently fail), Gemini does it implicitly. Check each provider's docs.
3. **Track costs religiously.** I logged token counts, cache hits, and compute costs per run. My initial cost estimate was 5x too low because of wrong pricing assumptions. Always verify against the vendor's actual pricing page.
4. **Don't trust auto-computed LLM costs blindly.** LiteLLM (which MLflow uses for cost tracking) produced negative costs for cached Anthropic calls. I had to compute costs manually from raw token counts. The tooling is getting better fast, but it's not fully reliable yet for multi-provider comparisons with caching enabled.

---

## What's Next

With 5,799 organizations resolved and geolocated, I can now tackle the harder problem: **author disambiguation**. The organization IDs become a critical signal. "Smith, John at MIT" showing up on two papers is probably the same person. But "Smith, John at MIT" and "Smith, John at Stanford" might be the same person who moved... or they might be two completely different people.

Part 3 builds a temporal-aware disambiguation algorithm that uses publication dates to tell the difference between career moves and name collisions. It achieves F1=0.9996 against ORCID ground truth.

---

*Next: [Part 3: Disambiguating 43,000 Author Names with Temporal Intelligence]({% post_url 2026-04-09-cf-research-network-analysis-part3-author-disambiguation %})*
