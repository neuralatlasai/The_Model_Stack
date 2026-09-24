---
id: ms.section.7.5
entity_type: section
title: Dataset documentation
short_title: Dataset documentation
volume: 1
part: 2
chapter: 7
section: 7.5
slug: 07-5-dataset-documentation
parent: ms.chapter.7
prev_sibling: ms.section.7.4
next_sibling: ms.section.7.6
children: []
prerequisites: [ms.section.2.5, ms.section.6.6, ms.section.7.2, ms.section.7.3, ms.section.7.4]
downstream: [ms.section.7.6, ms.section.8.6, ms.section.9.5, ms.section.61.4, ms.section.66.5]
related: [ms.section.6.2, ms.section.61.6]
siblings_by_mechanism: [ms.section.66.5]
relations:
  - {type: supported_by, target: paper.R7.27}
  - {type: supported_by, target: paper.R7.21}
  - {type: supported_by, target: paper.R7.28}
  - {type: consumes, target: concept.admissible-use-decision}
  - {type: produces, target: concept.dataset-card}
axes: {lifecycle: [data, evaluation, assurance], mechanism: [datasheet, data_statement, dataset_card, sampling_frame, coverage_audit, bias_documentation], feedback_setting: [], modality: [text, code]}
papers: [P03, P04, P05, P06, P07]
implementations: [impl.hugging-face-transformers, impl.pytorch, impl.nanotron]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 7.5 Dataset documentation

## Scope

Objective: specify documentation that lets a reader reconstruct what a dataset *represents* and what remains unknown — the datasheet / data statement / data card / model card lineage and its Hugging Face Hub realisation, the sampling frame, known omissions, population coverage, collection bias, and unresolved provenance — as evidence-linked fields of the chapter's inventory rather than prose. Baseline: a card listing name, size and intended task with no frame and no transformation history. Success: the reader can populate the documentation fields for any case-study corpus in §7.6, compute the coverage and retention fractions of Eq. 7.10 where the frame is known, and state explicitly where it is not. Boundaries: the attribute vector being documented is [§7.2](07-2-orthogonal-dataset-axes.md); rights decisions are [§7.4](07-4-rights-and-governance-metadata.md); filter-retention measurements that belong in an updated card are [§8.6](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-6-filter-interactions.md); reporting of evaluation results is [§61.6](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-6-reporting.md).

## Why this exists

What failed before was documentation that reported what was easy to count. Datasheets for Datasets opens with the analogy that "In the electronics industry, every component ... is accompanied with a datasheet describing its operating characteristics, test results, recommended usage" and proposes "that every dataset be accompanied with a datasheet that documents its motivation, composition, collection process, recommended uses, and so on" (PAPER-REPORTED · R7.27). Data Statements, addressed to NLP specifically, target "critical scientific and ethical issues that result from the use of data from certain populations in the development of technology for other populations" (PAPER-REPORTED · R7.21). The bottleneck that appeared was that even a widely used corpus could go undocumented for years: C4 was released in 2019 and its first systematic documentation, by a separate group in 2021, found that "the single-most represented website in the corpus is patents.google.com", that many of those patents are machine-translated, that the blocklist filter "disproportionately removes text from and about minority individuals", and that benchmark test examples are present (PAPER-REPORTED · R7.28). The constraint that became dominant is the gap between *observations* and *claims*: a record count is an observation; "covers English web text" is a claim about a population that needs a frame. What changed in the solution is that corpus papers now ship datasheets as appendices — Dolma "Following the template by Gebru et al." (PAPER-REPORTED · P05), RefinedWeb's Table 6 (PAPER-REPORTED · P04), FineWeb's Appendix A (PAPER-REPORTED · P06), DCLM's Appendix U (PAPER-REPORTED · P07) — and hosting platforms render a machine-readable card from the repository README (OFFICIAL-DOCUMENTATION · R7.29). This section turns those practices into inventory fields.

## Intuition

Documentation is an interface to evidence. A field `language: en` is useful only if the reader knows whether it came from a human label, a classifier at a stated threshold, an upstream tag, or a guess from a domain name; the value and its measurement procedure form one claim. There are two kinds of missingness and they must not share a cell: information never collected (Dolma: "in the vast majority of cases authorship information is unavailable let alone subpopulation metadata", PAPER-REPORTED · P05) and information that exists but is withheld. A card can be complete *about its uncertainty* even when the collection is incomplete (DERIVED). The population question is physical, not rhetorical: a web corpus is bounded by what a crawler fetched from seeds it had, in the window it ran, from servers that answered; Dodge et al. had to use "the location where a webpage is hosted as a proxy for the location of its creators" and found "51.3% pages are hosted in the United States", while noting that hosting location is a weak proxy (PAPER-REPORTED · R7.28). Heuristically a card "describes the data"; mechanically it binds each descriptive claim to a denominator and an estimator.

## Formulation

> **Definition — Sampling frame (dataset).** The identifiable set of units eligible for selection by a stated collection procedure during a stated observation interval, distinguished from the target population to which conclusions are intended to apply. For Common Crawl-derived corpora the frame is the set of records in the named `CC-MAIN-YYYY-WW` snapshots that the builder acquired.

> **Definition — Provenance completeness.** The fraction of specified records for which a declared set of required lineage fields is present and resolvable, measured under an explicit audit rule; the chapter's verification metric λ in [verification.md](verification.md) is its stratified estimate.

For a frame partitioned into strata g (language, source, snapshot), coverage and retention are separate fractions:

$$
\kappa_g \;=\; \frac{n^{\mathrm{obs}}_g}{F_g}, \qquad \eta_g \;=\; \frac{n^{\mathrm{rel}}_g}{n^{\mathrm{obs}}_g}
$$
*(Eq. 7.10)*

| Local symbol | Meaning | Unit or condition |
|---|---|---|
| $g$ | declared frame stratum | language, source, snapshot, or other auditable grouping |
| $F_g$ | eligible units in the frame stratum | count; must be *known* for $\kappa_g$ to be defined |
| $n^{\mathrm{obs}}_g$ | acquired units | same sampling unit as $F_g$ |
| $n^{\mathrm{rel}}_g$ | released units from those acquired | count after the declared pipeline |
| $\kappa_g, \eta_g$ | coverage of the frame; retention through the pipeline | undefined when the denominator is zero or unknown |

These are accounting definitions (DERIVED). When F_g is unknown, coverage is *unidentified*; substituting n^obs for F_g manufactures full coverage. Documents, domains, people and tokens are different units and cannot share a denominator without a conversion model. Dolma's frame statement is a model of the right form: "We used 25 snapshots between 2020-05 to 2023-06" and "we only acquired enough shards of Common Crawl to meet our target 2-3T token corpus size" (PAPER-REPORTED · P05) — the frame is 25 snapshots, the acquisition is a stated sub-sample of it, and κ at snapshot level is therefore < 1 by design.

```figure
id: fig-7.24
kind: calculator
title: Coverage of the frame against retention through the pipeline
caption: >-
  Eq. 7.10 for one stratum. The two fractions answer different questions
  and have different denominators, so neither can stand in for the other.
  κ needs F_g, which exists only where the frame can be enumerated. The
  second state shows the failure the formulation warns about: put n_obs
  where the unknown F_g belongs and coverage becomes 100% by construction.
  Every value is an illustrative configuration, not a corpus.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-7.10"]
alt: >-
  Calculator for Eq. 7.10, illustrative configuration. Inputs: F_g eligible
  units in the frame stratum, n_obs acquired units, n_rel released units, all
  in the same sampling unit. Coverage κ_g = n_obs / F_g; retention η_g = n_rel
  / n_obs; released share of the frame = n_rel / F_g. Defaults: F_g = 1
  million, n_obs = 600 thousand, n_rel = 150 thousand, giving κ = 60%, η = 25%
  and a released share of 15%. If n_obs is substituted for an unknown F_g,
  κ reads 100%, a manufactured full coverage; the card should report
  'unidentified'.
spec:
  tex: >-
    \kappa_g = \frac{n^{\mathrm{obs}}_g}{F_g},\qquad \eta_g = \frac{n^{\mathrm{rel}}_g}{n^{\mathrm{obs}}_g}
  equation: "7.10"
  inputs:
    - { symbol: F, label: "F_g, eligible units in the frame stratum", default: 1000000, min: 1000, max: 1000000000, scale: log10, format: si }
    - { symbol: nobs, label: "n_obs, acquired units", default: 600000, min: 1, max: 1000000000, scale: log10, format: si }
    - { symbol: nrel, label: "n_rel, released units", default: 150000, min: 1, max: 1000000000, scale: log10, format: si }
  outputs:
    - { symbol: kap, label: "κ_g, coverage of the frame", formula: "nobs/F", format: percent, emphasis: true }
    - { symbol: eta, label: "η_g, retention through the pipeline", formula: "nrel/nobs", format: percent, emphasis: true }
    - { symbol: sh, label: "released share of the frame, κ·η", formula: "nrel/F", format: percent }
states:
  - { anchor: formulation, label: "known frame, illustrative", variables: { F: 1000000, nobs: 600000, nrel: 150000 }, highlight: [kap, eta], note: "Illustrative stratum: the builder acquired 60% of an enumerable frame and released 25% of what it acquired, so 15% of the frame reaches the card." }
  - { anchor: failure-modes, label: "F_g replaced by n_obs", variables: { F: 600000, nobs: 600000, nrel: 150000 }, highlight: [F, kap], note: "Proxy as population: with F_g unknown and n_obs put in its place, κ reads 100%. The correct cell is 'unidentified', not a number." }
```

For a stratified audit of a binary property (lineage complete, licence resolved) on a released set:

$$
\hat{\Lambda} \;=\; \sum_g \omega_g\, \hat{\Lambda}_g, \qquad \omega_g \;=\; \frac{n^{\mathrm{rel}}_g}{\sum_h n^{\mathrm{rel}}_h}
$$
*(Eq. 7.11)* where Λ̂_g = the audited fraction with the property in a probability sample drawn within stratum g, ω_g = the stratum's share of released records. Under stratified random sampling this estimator is unbiased for the released-set fraction (MATHEMATICALLY-DERIVED); its interval must respect clustering and unequal inclusion probabilities ([§2.5](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md)); a convenience sample does not inherit the interpretation by using the same formula.

```figure
id: fig-7.25
kind: calculator
title: Stratified provenance completeness and the unweighted trap
caption: >-
  Eq. 7.11 over three strata. The weights come from released counts, not
  from audit sample sizes. With one large, weaker stratum and two small,
  strong ones, the weighted Λ̂ and the unweighted mean of stratum fractions
  land on opposite sides of verification §3's ASSUMED 0.98 web bar. All
  counts and fractions are an illustrative configuration, not a measured
  corpus.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-7.11"]
alt: >-
  Calculator for Eq. 7.11 with three strata, illustrative configuration.
  Released records: web 900 million, code 90 million, interactions 10
  million. Audited complete fractions: web 0.970, code 0.999, interactions
  0.999. Weights are released shares: web 90%. The weighted estimate Λ̂ is
  0.973. The unweighted mean of the three stratum fractions is 0.989, 0.016
  higher, which would appear to clear a 0.98 threshold that the weighted
  estimate does not.
spec:
  tex: >-
    \hat{\Lambda} = \sum_g \omega_g\,\hat{\Lambda}_g,\qquad \omega_g = \frac{n^{\mathrm{rel}}_g}{\sum_h n^{\mathrm{rel}}_h}
  equation: "7.11"
  inputs:
    - { symbol: n1, label: "released records, web stratum", default: 900000000, min: 1000, max: 10000000000, scale: log10, format: si }
    - { symbol: L1, label: "audited fraction complete, web", default: 0.97, min: 0.5, max: 1, step: 0.001, format: fixed3 }
    - { symbol: n2, label: "released records, code stratum", default: 90000000, min: 1000, max: 10000000000, scale: log10, format: si }
    - { symbol: L2, label: "audited fraction complete, code", default: 0.999, min: 0.5, max: 1, step: 0.001, format: fixed3 }
    - { symbol: n3, label: "released records, interaction stratum", default: 10000000, min: 1000, max: 10000000000, scale: log10, format: si }
    - { symbol: L3, label: "audited fraction complete, interactions", default: 0.999, min: 0.5, max: 1, step: 0.001, format: fixed3 }
  outputs:
    - { symbol: w1, label: "ω_web, released share", formula: "n1/(n1 + n2 + n3)", format: percent }
    - { symbol: Lhat, label: "Λ̂, stratum-weighted (Eq. 7.11)", formula: "(n1*L1 + n2*L2 + n3*L3)/(n1 + n2 + n3)", format: fixed3, emphasis: true }
    - { symbol: Lraw, label: "unweighted mean of stratum fractions", formula: "(L1 + L2 + L3)/3", format: fixed3 }
    - { symbol: bias, label: "unweighted − weighted", formula: "Lraw - Lhat", format: fixed3 }
states:
  - { anchor: formulation, label: "ω_g from released counts", highlight: [w1, Lhat], note: "Illustrative strata: web holds 90% of released records, so its audited 0.970 sets Λ̂ = 0.973 almost alone." }
  - { anchor: algorithm, label: "line 6: weighted Λ̂", highlight: [Lhat, L1], note: "Line 6 computes Λ̂ with a design-appropriate interval and keeps every denominator. The web stratum's 0.970 misses verification §3's ASSUMED 0.98 bar." }
  - { anchor: failure-modes, label: "weighted audit reported raw", highlight: [Lraw, bias], note: "Pool equal-size stratum samples without ω_g and the estimate reads 0.989, which appears to clear 0.98. The weighted 0.973 does not; the gap is 0.016." }
```

## Mechanism

**The documentation lineage.** Four instruments, in order, each adding a question the previous did not ask. *Datasheets* (R7.27) fix seven sections — motivation, composition, collection process, preprocessing/cleaning/labeling, uses, distribution, maintenance — and insist the process "is not intended to be automated" because automation "run[s] counter to our objective of encouraging dataset creators to carefully reflect" (PAPER-REPORTED · R7.27). *Data Statements* (R7.21) add the speaker/annotator population framing for language data. *Model Cards* (R7.23) move the same discipline to the trained artifact, asking for "benchmarked evaluation in a variety of conditions, such as across different cultural, demographic, or phenotypic groups" (PAPER-REPORTED · R7.23) — the consumer of a dataset card. *Data Cards* (R7.24) recast datasheets as "structured summaries" with reported deployment of "over 20 Data Cards in practice" (PAPER-REPORTED · R7.24). The Hub realisation is a repository `README.md` "called a dataset card" whose YAML header carries `language`, `license`, `pretty_name`, `tags`, `task_categories`, and from which a linked arXiv id becomes an `arxiv:<PAPER ID>` tag (OFFICIAL-DOCUMENTATION · R7.29); Croissant supplies "a metadata format for datasets that creates a shared representation across ML tools, frameworks, and platforms" (PAPER-REPORTED · R7.26). The inventory treats the datasheet questions as *required fields* and the Hub YAML as the machine-readable projection of a subset of them (DERIVED).

**Sampling frames in published cards.** FineWeb: "96 CommonCrawl dumps ... from the summer of 2013 to April of 2024", later extended dump-by-dump in a changelog (v1.2.0, v1.3.0, v1.4.0) so the frame is a *versioned* list (OFFICIAL-DOCUMENTATION · R7.5). DCLM-Pool: "all 5.1M Common Crawl WARC dumps from 2013 to 2022 (inclusive)", with 2023 onward omitted "to prevent large amounts of language model generated text from polluting our datasets and to provide a hold out for future use" (PAPER-REPORTED · P07) — a frame boundary chosen for chronology and contamination reasons, which the card must state as an omission. FineWeb2: "1,868 language-script pairs", of which "474 have more than 1 thousand documents, and 203 have more than 10 thousand" (OFFICIAL-DOCUMENTATION · R7.7). InstructGPT: Playground prompts only, capped per user, split by user (PAPER-REPORTED · P21). Each is a frame statement; none of them is a population claim.

```figure
id: fig-7.26
kind: compare
title: Published frame statements, read as Eq. 7.10 inputs
caption: >-
  Every column states its frame as a list of snapshots, files, pairs or an
  interface, never as a population. So κ is computable at the listed level
  and unidentified above it. The boundary row separates what was excluded
  by design (DCLM's 2023+, Dolma's English-only) from what was acquired in
  part (Dolma's shards, RefinedWeb's public extract). The omission row gives
  each release's own strongest stated gap, in the three-valued vocabulary
  where the text assigns one.
placement: wide
evidence: PAPER-REPORTED
source: [R7.5, P06, P07, R7.7, P05, P21, P04]
concepts: [ms.section.7.5, ms.section.6.2]
alt: >-
  Comparison of frame statements. FineWeb: frame of Common Crawl dumps, 96
  from summer 2013 to April 2024 and extended by changelog; κ computable per
  dump; stated omission that code is likely not prevalent, a suspected
  omission. DCLM-Pool: all Common Crawl WARC files from 2013 to 2022
  inclusive; 2023 onward omitted by design against model-generated text and as
  a hold-out; κ per WARC file. FineWeb2: 1,868 language-script pairs from 96
  snapshots, 474 with more than a thousand documents and 203 with more than
  ten thousand; the punctuation filter removes many poems and GlotLID confuses
  close languages. Dolma: 25 snapshots from 2020-05 to 2023-06, only enough
  shards for a 2 to 3 T token target, so κ is below one by design; English
  only by design. InstructGPT: Playground prompts under a consent notice, about
  200 per user id, split by user id, production API data excluded by design;
  κ only if the Playground log is enumerable. RefinedWeb: all dumps to
  2023-06, with a public extract of 600 GT drawn at random from 5,000 GT;
  English only.
spec:
  axis: "How each release states its sampling frame, its boundary, and its strongest stated omission; the level at which κ_g of Eq. 7.10 is computable"
  columns:
    - { id: fw, label: "FineWeb" }
    - { id: dclm, label: "DCLM-Pool" }
    - { id: fw2, label: "FineWeb2" }
    - { id: dolma, label: "Dolma" }
    - { id: igpt, label: "InstructGPT prompts" }
    - { id: rw, label: "RefinedWeb" }
  rows:
    - { dimension: "frame unit", values: { fw: "Common Crawl dump", dclm: "Common Crawl WARC file", fw2: "language-script pair within CC snapshots", dolma: "Common Crawl snapshot, then shards", igpt: "Playground prompt, keyed by user id", rw: "Common Crawl dump" } }
    - { dimension: "frame window", values: { fw: "96 dumps, summer 2013 – April 2024 (paper); extended per changelog", dclm: "'5.1M ... WARC dumps', 2013–2022 inclusive", fw2: "96 snapshots, summer 2013 – April 2024; 1,868 pairs", dolma: "25 snapshots, 2020-05 – 2023-06", igpt: "Playground prompts under a recurring consent notification", rw: "all dumps until 2023-06" } }
    - { dimension: "boundary", values: { fw: "versioned list of dumps", dclm: "2023+ omitted: LM-generated text, and a hold-out", fw2: "474 pairs > 1k documents; 203 > 10k", dolma: "only enough shards for the 2–3 T token target", igpt: "≈ 200 prompts per user id; splits by user id", rw: "public extract: 600 GT random of 5,000 GT" } }
    - { dimension: "strongest stated omission", values: { fw: "code 'not prevalent' (suspected)", dclm: "2023 onward (by design)", fw2: "poems removed by punctuation filter; close languages confused", dolma: "English-only (by design)", igpt: "production API customer data (by design)", rw: "English-only public extract" } }
    - { dimension: "κ_g computable at", values: { fw: "dump level", dclm: "WARC-file level", fw2: "snapshot level; pairs are strata within it", dolma: "snapshot level; κ < 1 by design", igpt: "prompt level, if the Playground log is enumerable (NOT-DISCLOSED)", rw: "dump level" } }
```

**Known omissions.** The strongest cards say what is *not* there. FineWeb: "it is likely that code content is not prevalent in our dataset", and Wikipedia content is present but "we did not tailor the processing to individual websites" (OFFICIAL-DOCUMENTATION · R7.5). FineWeb2: "the punctuation filter removes a lot of poems"; GlotLID "is prone to sometimes mistaking closely related languages (for instance, Standard Arabic and Arabic dialects or Croatian and Bosnian)"; "we couldn't test each language individually" (OFFICIAL-DOCUMENTATION · R7.7). Dolma: "English-only corpus" (PAPER-REPORTED · P05). RefinedWeb: the public extract "is a 600GT random extract of the 5,000GT of the full dataset" and English-only (PAPER-REPORTED · P04). An omission field has three legal values — *by design*, *by measurement*, *suspected* — and the FineWeb code statement is of the third kind.

**Population coverage and collection bias.** Coverage requires a mechanism and an observable consequence. Dodge et al. supply both for C4: hosting geolocation as a (weak) proxy for creators; Internet Archive first-index date as a proxy for utterance date, with the caveat that the Archive "only indexed approximately 65% of URLs in C4.en" and "92% are estimated to have been written in the last decade (2011-2019)"; and the blocklist mechanism whose consequence is disproportionate removal of "text in African American English, text discussing LGBTQ+ identities" (PAPER-REPORTED · R7.28). FineWeb2's paper measures a coverage pathology directly: "Out of 1868 language-script pairs in the final dataset, 70% (1320 of them) have more than half their documents from Bible- or Wikipedia-related domains. This is mostly driven by Bible content" (PAPER-REPORTED · R7.18) — a low-resource "language subset" whose population is largely one genre from a handful of domains. Dolma ran "an external audit on the International Corpus of English (ICE)" across nine countries to estimate how many regional-English documents its language filter would discard (PAPER-REPORTED · P05). FineWeb and FineWeb2 state a *design* response — avoiding "gold"-similarity and toxicity classifiers because such methods "disproportionately remove content in specific dialects" and "overclassify as toxic text related to specific social identities" — while acknowledging that "a significant number of documents ... could be considered toxic" remain (OFFICIAL-DOCUMENTATION · R7.5, R7.7). The inventory field `collection_bias[]` therefore records {mechanism, measured consequence or hypothesis, evidence ref}; a bias entry without a mechanism is not admitted (ASSUMED protocol).

```figure
id: fig-7.27
kind: stat-panel
title: FineWeb2's per-language coverage, in its own counts
caption: >-
  A dataset of 1,868 language-script pairs where a quarter of the pairs have
  more than a thousand documents. Seven in ten pairs draw most of their
  documents from Bible- or Wikipedia-related domains. The shares are derived
  here from the card's and the paper's counts. The dot glyph is that 70.7%.
  Words are counted with language-specific word tokenizers, and subword
  tokens are deliberately not reported.
placement: rail
anchor: mechanism
evidence: OFFICIAL-DOCUMENTATION
source: [R7.7, R7.18]
alt: >-
  Instrument panel for FineWeb2. 1,868 language-script pairs. 474 pairs, 25.4%,
  have more than a thousand documents; 203, 10.9%, have more than ten
  thousand. 1,320 pairs, 70.7%, have more than half their documents from
  Bible- or Wikipedia-related domains (R7.18). Totals: 3,339,271,691,958 words
  under language-specific word tokenizers, 5,018,505,566 documents, 20.78 TB,
  about 665 words per document (derived). Subword tokens are not reported by
  design. Language identification uses GlotLID, and und_ subsets keep
  unsupported scripts. Dot glyph: 71 of 100 filled for pairs whose documents
  are mostly Bible or Wikipedia.
spec:
  header: "FINEWEB2 · CARD v2.1.1 · PAPER R7.18"
  variables: { P: 1868, P1k: 474, P10k: 203, Pbw: 1320, W: 3339271691958, Dn: 5018505566 }
  rows:
    - { key: "language-script pairs", formula: "P", format: integer }
    - { key: "pairs with > 1 thousand documents", formula: "P1k/P", format: percent, note: "474 pairs" }
    - { key: "pairs with > 10 thousand documents", formula: "P10k/P", format: percent, note: "203 pairs" }
    - { key: "pairs > ½ Bible/Wikipedia documents", formula: "Pbw/P", format: percent, note: "1,320 pairs (R7.18)" }
    - { key: "words, language-specific tokenizers", formula: "W", format: tokens }
    - { key: "documents", formula: "Dn", format: tokens }
    - { key: "bytes", value: "20.78 TB" }
    - { key: "words per document", formula: "W/Dn", format: integer, note: "derived" }
    - { key: "subword tokens", value: "not reported, by design" }
    - { key: "language identification", value: "GlotLID; und_ subsets kept" }
  glyph:
    type: dots
    total: 100
    filled: 71
    legend:
      - { marker: filled, label: "> ½ documents Bible/Wikipedia", value: "1,320 pairs" }
      - { marker: hollow, label: "other pairs", value: "548 pairs" }
states:
  - { anchor: mechanism, label: "coverage pathology", highlight: ["pairs > ½ Bible/Wikipedia documents", "pairs with > 1 thousand documents"], note: "A low-resource 'language subset' is often mostly one genre from a handful of domains. That is a coverage fact the card needs a mechanism and a measurement to state." }
  - { anchor: observations, label: "the builders' own measurement", highlight: ["pairs > ½ Bible/Wikipedia documents", "language-script pairs"], note: "The 70% is FineWeb2's own measurement, not an independent audit. Whether the concentration changes downstream behaviour is the section's open question." }
  - { anchor: failure-modes, label: "abstentions kept", highlight: ["language identification", "subword tokens"], note: "Against the 'histogram without abstentions' failure: und_ subsets keep unsupported scripts, and the card declines a subword count it cannot make language-neutral." }
```

**Unresolved provenance.** The last layer records what the builder could not establish. Dolma: "given current tools, it's not possible to reliably or scalably detect copyrighted materials in a corpus of this size" (PAPER-REPORTED · P05). The Pile: "we do not have the metadata necessary to determine exactly which texts are copyrighted" (PAPER-REPORTED · P03). RefinedWeb: WARC-versus-WET ambiguity inside its own paper (§7.3). The Stack v2: 96.93% of repositories without a repository-level licence (R7.12). These become `unresolved_provenance[]` entries, each with the subset affected, the reason, and whether another audit could resolve it (*resolvable* vs *unresolvable-in-principle*).

**Versioning the card.** A release can stay byte-identical while its documentation or governance state changes, and the reverse: FineWeb's card reports v1.1.0 reprocessed "11 dumps ... as we found a bug on their deduplication" (OFFICIAL-DOCUMENTATION · R7.5); the Dolma manuscript "was prepared for Dolma v.1.6" while the default card version is v1_7 with a different source list (PAPER-REPORTED · P05; OFFICIAL-DOCUMENTATION · R7.19). The card therefore carries three timestamps — bytes collected, metadata inspected, use decided — and is generated from a frozen manifest, with prose reviewed against the same identity (ASSUMED protocol).

Cost line: card generation is one streaming pass over the manifest (O(n)) plus audit-sample lookups; no model FLOPs unless classifiers are re-run; remote lineage retrieval for the audit can dominate wall-clock; human review is a measured effort that asymptotics do not remove (DERIVED). Energy and money are deployment-dependent (NOT-DISCLOSED).

## Algorithm

```text
Algorithm 7.5 — Evidence-linked dataset card
INPUT   frozen release manifest (snapshot id, a(d), lineage index, rights ledger), frame description, audit specification (strata, sample sizes, required fields)
OUTPUT  versioned card (prose + YAML projection), coverage/retention table (Eq. 7.10), provenance-completeness estimate (Eq. 7.11), unresolved-evidence register
STATE   bounded aggregation buffers, sampled audit identities with inclusion probabilities, evidence links
INVARIANT  every quantitative claim in the card names its unit, denominator, estimator, and evidence reference; unknown ≠ withheld ≠ not applicable
1  validate release identity; write the frame (snapshots, interfaces, window) separately from the target population
2  scan the manifest once; aggregate counts by declared strata and by measurement method (human | classifier id | upstream tag | inferred)
3  for each stratum: emit κ_g if F_g is known, else "unidentified"; emit η_g from pipeline counters
4  draw the pre-declared stratified audit sample; record inclusion probabilities
5  resolve each sampled record's lineage and rights fields → complete | incomplete(fields) | inaccessible
6  compute Λ̂ (Eq. 7.11) with a design-appropriate interval; preserve all denominators
7  populate omissions (by design | measured | suspected), collection_bias (mechanism, consequence, evidence), unresolved_provenance (resolvable?)
8  render prose and the Hub YAML projection from the same frozen aggregates; attach the three timestamps
9  human review of prose against linked evidence; publish with metadata digest; terminate
```
Complexity: O(n) streaming aggregation for fixed strata; O(n log n) with an unbounded grouping key via external sort; audit lookup O(a log n) for a sampled records under a sorted index (DERIVED). Rescanning the corpus per card row is rejected — it wastes I/O and can mix snapshots if the source moves.

```figure
id: fig-7.28
kind: diagram
title: "Algorithm 7.5: one frozen manifest, one audit, two renderings"
caption: >-
  Everything the card says comes from one frozen manifest, read in one
  streaming pass and one pre-declared sample. The emphasised path is the
  audit: sampled records resolve to three outcomes, and all three survive
  into Λ̂ with their denominators. Prose and Hub YAML are rendered from the
  same aggregates, so they cannot disagree. The last step is deliberately
  human, as the datasheet authors insist.
placement: inline
evidence: DERIVED
source: ["DERIVED:alg-7.5", "DERIVED:eq-7.10", "DERIVED:eq-7.11", R7.27, R7.29]
concepts: [ms.section.7.5]
alt: >-
  Diagram of Algorithm 7.5. A frozen release manifest (snapshot id, attribute
  vector, lineage index, rights ledger) feeds three things. First, the frame,
  written apart from the target population. Second, one streaming scan that
  aggregates counts by stratum and by measurement method, giving κ_g, or
  'unidentified' when F_g is unknown (Eq. 7.10), and η_g from pipeline
  counters. Third, the emphasised audit path: a stratified sample with
  recorded inclusion probabilities, resolution of each sampled record's lineage
  and rights to complete, incomplete by field, or inaccessible, and Λ̂ with a
  design-appropriate interval (Eq. 7.11). Registers of omissions, collection
  bias and unresolved provenance join these in one rendering step that
  produces prose and the Hub YAML projection from the same aggregates with
  three timestamps, followed by human review and publication with a metadata
  digest.
spec:
  direction: LR
  nodes:
    - { id: man, kind: dataset, label: "frozen release manifest", sub: "snapshot id, a(d), lineage, rights ledger" }
    - { id: frame, kind: state, label: "frame, written apart from population", sub: "line 1" }
    - { id: agg, kind: process, label: "one streaming scan", sub: "counts by stratum and method; O(n)" }
    - { id: kap, kind: metric, label: "κ_g or 'unidentified'", sub: "Eq. 7.10; needs a known F_g" }
    - { id: eta, kind: metric, label: "η_g", sub: "from pipeline counters" }
    - { id: samp, kind: process, label: "stratified audit sample", sub: "inclusion probabilities recorded (line 4)" }
    - { id: res, kind: branch, label: "resolve lineage + rights", sub: "complete · incomplete(fields) · inaccessible" }
    - { id: lam, kind: metric, label: "Λ̂ with a design interval", sub: "Eq. 7.11; all denominators kept" }
    - { id: reg, kind: dataset, label: "registers", sub: "omissions · collection_bias · unresolved" }
    - { id: rend, kind: process, label: "render prose + Hub YAML", sub: "same aggregates; three timestamps" }
    - { id: rev, kind: dependency, label: "human review", sub: "'not intended to be automated' (R7.27)" }
    - { id: pub, kind: state, label: "published card", sub: "metadata digest" }
  edges:
    - { from: man, to: frame }
    - { from: man, to: agg }
    - { from: agg, to: kap }
    - { from: agg, to: eta }
    - { from: man, to: samp }
    - { from: samp, to: res, kind: emphasis }
    - { from: res, to: lam, kind: emphasis }
    - { from: lam, to: rend, kind: emphasis }
    - { from: kap, to: rend }
    - { from: eta, to: rend }
    - { from: frame, to: rend, kind: dependency }
    - { from: reg, to: rend }
    - { from: rend, to: rev, kind: emphasis }
    - { from: rev, to: pub, kind: emphasis }
```

## Implementation

Reference-stack placement is on the consumer side only. **Hugging Face Transformers** (#26, *Model definition / adaptation*) fixes the tokenizer whose id the card's token counts must name (OFFICIAL-DOCUMENTATION · R7.30); **PyTorch** (#17, *Model / autograd framework*) supplies the input path whose consumed-token counter is logged separately from the card's available pool (R7.31); **Nanotron** (#35, *Distributed training*) is the trainer whose run configuration, not the card, owns exposure (R7.32). *Outside the reference stack (plan anchors: Appendix C "known limitations", P05/P06 datasheets):* Hub dataset-card metadata (R7.29), Croissant (R7.26), and the datasheet template (R7.27). The proposed exporter maps inventory fields into the Hub YAML and Croissant projections while richer lineage and decision records stay in linked artifacts; neither format is asserted to lack extensibility.

> **Implementation note [Hub dataset cards · `hub-docs` main, commit not pinned · UNVERIFIED].** The documented YAML fields carry licence as "any valid license identifier" and language as ISO 639-1 codes (OFFICIAL-DOCUMENTATION · R7.29); FineWeb2 keys its subsets by ISO 639-3 plus script (R7.7). A card projection must state which code system it used, or the language coordinate of §7.2 becomes ambiguous.

## Experimental design

### Experiment 7.5 — Can a reader recover the population claim?

- **Hypothesis:** a card with explicit frames, three-valued omissions, and linked measurements reduces incorrect interpretations of coverage and token exposure relative to a size-and-licence card, without increasing unjustified certainty.
- **Setup:** two documentation views of one frozen synthetic inventory; reviewers randomised to view order.
- **Independent variables:** frame disclosure; unknown/withheld/not-applicable distinction; denominator labels; linked lineage.
- **Controlled variables:** underlying records, release identity, factual content, question wording.
- **Dataset/workload:** questions about source coverage, retention, training use, and planted omissions with a pre-declared rubric.
- **Hardware:** none beyond the metadata store.
- **Metrics:** correct answers; unjustified-certainty rate; correct identification of unresolved questions; time to locate evidence.
- **Baselines:** size-and-licence card; narrative-only card.
- **Expected result:** higher correctness where evidence exists; unknown coverage reported as unknown rather than guessed.
- **Ablation:** keep tables but drop measurement methods; then drop the three-valued missingness.
- **Interpretation:** better comprehension of documentation does not establish better downstream model quality.
- **Threats to validity:** reviewer expertise; learning effects; synthetic omissions; rubric ambiguity.

Proposal only; no run was executed.

## Observations

**What the paper claims.** R7.27 claims a seven-section, non-automated datasheet practice; R7.21 claims data statements as professional practice for NLP; R7.23 and R7.24 extend the discipline to models and to structured summaries; R7.28 claims specific provenance and bias findings for C4 (patents, machine translation, blocklist effects, contamination, 51.3% US hosting); R7.18 claims that 70% of FineWeb2's language-script pairs are majority Bible/Wikipedia; P05 claims an external ICE audit of its language filter (all PAPER-REPORTED).

**What the evidence shows.** The C4 findings are a single-group audit that has been widely cited but, to the book's knowledge, not independently replicated at the same depth; the FineWeb2 domain analysis is the builders' own measurement. The datasheet practice has demonstrable adoption (four of the six case-study papers include one), which is evidence of uptake, not of accuracy.

**What we infer.** Because every published card that states a frame states it as a list of snapshots or interfaces, κ_g is computable at snapshot level for web corpora and unidentified at population level (DERIVED). We infer, marked ASSUMED, that the three-valued omission field is the single highest-value addition to current cards; no study tests it.

**What remains unknown.** Coverage of populations outside the observed frame is NOT-DISCLOSED for every corpus inspected. The accuracy of unaudited card metadata is UNVERIFIED. Whether machine-readable cards are read by anyone other than indexers is an open question.

> **Open question.** Does a per-language coverage pathology like FineWeb2's Bible/Wikipedia concentration measurably change downstream behaviour in those languages? · *what evidence would settle it:* matched-budget training on the concentrated subset versus a domain-balanced subset of the same language with an independent evaluation set in that language.

## Failure modes

> **Failure mode — Moving-branch card.** *Symptom:* counts in the card do not match any single release. *Cause:* card generated against a moving branch. *Detection:* card digest without a release digest. *Mitigation:* line 1 of Algorithm 7.5; FineWeb's "previous versions remain available in the branch `version name`" pattern (R7.5).

> **Failure mode — Histogram without abstentions.** *Symptom:* language shares sum to 100% with no `unknown`. *Cause:* classifier abstentions dropped. *Detection:* `top_langs`-style fields absent. *Mitigation:* keep an uncertain bucket; FineWeb2 retains `und_`-prefixed data for unsupported scripts (R7.7).

> **Failure mode — Weighted audit reported raw.** *Symptom:* provenance completeness looks high because rich strata were oversampled. *Cause:* Eq. 7.11 weights omitted. *Detection:* Λ̂ reported without ω_g. *Mitigation:* line 6.

> **Failure mode — `not applicable` hiding a gap.** *Symptom:* consent marked n/a for a corpus containing user text. *Cause:* three-valued missingness collapsed. *Detection:* n/a on a field the role requires (Algorithm 7.2 line 1). *Mitigation:* the invariant of Algorithm 7.5.

> **Failure mode — Proxy reported as population.** *Symptom:* "51% of authors are in the US". *Cause:* hosting geolocation read as creator location. *Detection:* claim without the proxy's caveat. *Mitigation:* record the proxy and its known failure (R7.28's own caveat).

## Siblings

**Orthogonal dataset axes** — [07-2-orthogonal-dataset-axes.md](07-2-orthogonal-dataset-axes.md)
Why it exists: the schema being documented. What assumption changed here: the coordinates exist; the question is their evidence and denominators. What objective changed: none. What problem it solved: typed description. What new failure mode it introduced: coordinates with no method. Changed primitive: vector → card.

**Corpus case studies** — [07-6-corpus-case-studies.md](07-6-corpus-case-studies.md)
Why it exists: the same questions applied release by release. What assumption changed: the sources are the papers and cards themselves. What objective changed: none. What problem it solved: comparable records. What new failure mode it introduced: family-name aliasing. Changed primitive: template → filled records.

**Reproducibility and disclosure** — [§66.5](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch66-release-decisions-reproducibility-and-research-to-production-closure/66-5-reproducibility-and-disclosure.md)
Why it exists: the model-level counterpart (model cards, disclosure levels). What assumption changed: the artifact is a checkpoint. What objective changed: release decision. What problem it solved: what to disclose. What new failure mode it introduced: none new to data. Changed primitive: dataset card → model card.

## Extensions

For continuously updated corpora, publish periodic immutable cards and a changelog of additions, removals and measurement changes — the FineWeb changelog is the working pattern (R7.5). For multimodal data, report missing alignment and modality-specific extraction failures as omissions. For agent trajectories, document the policy that generated actions and the environments reachable, which Appendix C's RL-rollout row already requires. For retrieval corpora, freshness and delete behaviour are card fields, not footnotes ([§49.1](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/49-1-corpus-construction.md)).

## Limitations

Documentation can be internally consistent and still wrong; independent audits remain necessary, and the C4 case shows how long a gap can persist. Some target populations cannot be enumerated, so coverage is *unidentified* rather than low or high, and no card design changes that. A readable card improves inspectability without proving representativeness, fairness, or admissibility. The section is falsified as guidance if Experiment 7.5 shows no reduction in misinterpretation from frames and three-valued missingness.

## Reproducibility

Versions: R7.27 (ar5iv; arXiv v8, "Published in CACM in December, 2021"), R7.21 (ACL Anthology Q18-1041 page), R7.23, R7.24, R7.26, R7.28 (arXiv abs; R7.28 ar5iv full text), R7.18 (arXiv HTML) — accessed 2026-09-20; R7.5, R7.7, R7.19, R7.29 (cards/docs, `main`, unpinned) — accessed 2026-09-20; P03, P04, P05, P06, P07 as in §7.3; R7.30–R7.32 opened 2026-09-23. Artifacts: inventory fields `frame`, `omissions[]`, `coverage_by_stratum`, `retention_by_stratum`, `collection_bias[]`, `unresolved_provenance[]`, `card_timestamps{collected, inspected, decided}` in [verification.md](verification.md). Exact definitions: Eq. 7.10–7.11. Unresolved: population-level coverage (NOT-DISCLOSED everywhere); metadata accuracy (UNVERIFIED).

## References

P03, P04, P05, P06, P07, P21, R7.5, R7.7, R7.12, R7.18, R7.19, R7.21, R7.23, R7.24, R7.26, R7.27, R7.28, R7.29, R7.30, R7.31, R7.32; Eq. 7.10–7.11.
