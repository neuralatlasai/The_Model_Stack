---
id: ms.section.9.2
entity_type: section
title: Quality and diversity
short_title: Quality and diversity
volume: 1
part: 2
chapter: 9
section: 9.2
slug: 09-2-quality-and-diversity
parent: ms.chapter.9
prev_sibling: ms.section.9.1
next_sibling: ms.section.9.3
children: []
prerequisites: [ms.section.2.3, ms.section.8.2, ms.section.8.3, ms.section.8.6, ms.section.9.1]
downstream: [ms.section.9.3, ms.section.9.4, ms.section.9.6, ms.section.11.4, ms.section.21.1]
related: [ms.section.13.1]
siblings_by_mechanism: [ms.section.8.2, ms.section.8.3]
relations:
  - {type: supported_by, target: paper.P06}
  - {type: supported_by, target: paper.P07}
  - {type: trades_off_with, target: ms.section.8.2}
axes:
  lifecycle: [data, pretraining]
  mechanism: [data_mixture, coverage, redundancy, repetition]
  feedback_setting: []
  modality: [text]
papers: [P06, P07]
implementations: []
benchmarks: []
datasets: [fineweb, dclm-baseline, redpajama]
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2100
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# 9.2 Quality and diversity

## Scope

Objective: define coverage, redundancy and long-tail retention as measurable properties of the *consumed stream* rather than of the pool, show how filter strictness and mixture weight trade quality against repetition under a fixed token budget, and state how the trade moves with model capacity. Baseline: a single quality threshold chosen without reference to the budget. Success criterion: the reader can compute the three metrics from the exposure ledger and a cluster map, and can predict the direction in which the optimal filter strictness moves when D or N changes. Boundaries: how quality is scored and how duplicates are found belongs to [§8.2](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation.md) and [§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md); the fitted price of repetition is [§9.6](09-6-data-scaling-limits.md); the effect of adding whole domains is [§9.5](09-5-multilingual-and-specialist-mixtures.md).

## Why this exists

What failed before was the belief that quality and quantity are separable: filter as hard as the classifier allows, then train on whatever remains. PAPER-REPORTED (P06): FineWeb's ablations found that global MinHash deduplication across 96 Common Crawl snapshots left about 4T tokens that performed "far below RefinedWeb" and little better than non-deduplicated data, because older snapshots lost roughly 90% of their content and the 10% that survived "was actually of worse quality than the 90% of data that was removed"; per-snapshot deduplication kept about 20T tokens and matched RefinedWeb. Removing redundancy had removed something else with it. PAPER-REPORTED (P07, Table 6): DCLM found that mixing its best-filtered Common Crawl subset with the RedPajama extras (Wikipedia, books, StackExchange, arXiv, GitHub at a 33% ratio) *lowered* the Core score (31.1 → 29.9), "which suggests it can be counterproductive given performant filtering", while lower-performing subsets gained 1.4–2.2 points from the same additions. The bottleneck is that "high quality" is a property of a document relative to a pool and a budget, not an absolute; the dominant constraint is the number of unique high-quality tokens available against the tokens the run will consume, which is why PAPER-REPORTED (R9.23) frames the problem as a quality–quantity trade-off in which "the limited high-quality data rapidly loses its utility when repeated". What changed is that filter strictness became a mixture parameter chosen jointly with the weight vector and the budget, and coverage of the long tail became something to measure rather than assume.

```figure
id: fig-9.10
kind: stat-panel
title: Two reported cases where removing data removed value
caption: >-
  The two ablations behind this section, as reported. FineWeb's global
  deduplication kept a fifth of the tokens that per-snapshot deduplication
  kept, and the smaller set was worse, because the 10% it kept from old
  snapshots was worse than the 90% it removed. DCLM's curated extras lowered
  the Core score of its best-filtered web set by 1.2 points while helping
  weaker sets. Each is a single-lab result; neither transfers as a number.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: [P06, P07]
alt: >-
  Instrument panel of reported values. FineWeb (P06): global MinHash
  deduplication across 96 Common Crawl snapshots left about 4T tokens that
  performed far below RefinedWeb; per-snapshot deduplication left about 20T
  and matched it, five times as many tokens; old snapshots lost about 90% of
  their content and the retained 10% was of worse quality. DCLM (P07, Table 6):
  DCLM-baseline Core 31.1 alone and 29.9 with the RedPajama extras at a 33%
  ratio, a change of −1.2; lower-performing subsets gained 1.4 to 2.2 points
  from the same extras.
spec:
  header: "FINEWEB (P06) · DCLM TABLE 6 (P07)"
  variables: { glob: 4.0e12, snap: 20.0e12, coreA: 31.1, coreB: 29.9 }
  rows:
    - { key: "global dedup, 96 snapshots", formula: "glob", format: tokens, note: "far below RefinedWeb" }
    - { key: "per-snapshot dedup", formula: "snap", format: tokens, note: "matched RefinedWeb" }
    - { key: "per-snapshot ÷ global", formula: "snap/glob", format: ratio }
    - { key: "old snapshots, share removed (approx.)", formula: "0.9", format: percent, note: "the kept 10% was worse" }
    - { key: "DCLM-baseline Core, alone", formula: "coreA", format: fixed1 }
    - { key: "with RedPajama extras, 33%", formula: "coreB", format: fixed1 }
    - { key: "change from adding extras", formula: "coreB - coreA", format: fixed1 }
    - { key: "weaker subsets, same extras", value: "+1.4 to +2.2 Core" }
```

## Intuition

Physically, a quality filter is a map from the pool to a subset; tightening it shrinks n_i and, under fixed D, raises e_i = D/n_i (Eq. 9.4 of [§9.1](09-1-mixture-formulation.md)). Every unit of strictness therefore buys higher mean document quality at the price of more repetition, and repetition's value decays ([§9.6](09-6-data-scaling-limits.md)). At small D the pool is never exhausted and strictness is free; at large D the same threshold forces the run through the surviving documents several times, and the marginal repeated token is worth less than an unseen lower-quality one. The crossover is a budget-dependent quantity. Capacity enters because a larger model extracts more from each pass and memorises repeated content sooner — PAPER-REPORTED (R9.24): an 800M-parameter model's performance was degraded to that of a 400M model by repeating 0.1% of its data 100 times while the other 90% of tokens stayed unique — so the same repetition profile is more harmful to a larger model. Heuristically one might say a big model "gets bored"; the physical statement is only that its loss on repeated content falls faster and its capacity is spent on memorisation.

## Formulation

Let the consumed stream be partitioned into content cells c ∈ 𝒞 — near-duplicate clusters from [§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md), or coarser cells such as (domain, topic, language) from a labeller ([§8.2](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation.md)). Let d(c) be consumed tokens in cell c, q(c) the reference mass of c under a stated reference distribution (the unfiltered pool, or a target task distribution), and d_min a minimum exposure.

> **Definition — mixture coverage.** `cov(d_min) = Σ_{c : d(c) ≥ d_min} q(c)`, the reference-distribution mass of content cells that received at least d_min consumed tokens.

> **Definition — mixture redundancy.** `red = 1 − U/D`, where U is the number of unique consumed tokens after collapsing near-duplicate clusters and repeated units, and D the consumed tokens; redundancy counts within-run repetition and cross-document duplication together.

> **Definition — long-tail retention.** `ltr(f_0, d_min) = |{c : q(c) < f_0, d(c) ≥ d_min}| / |{c : q(c) < f_0}|`, the fraction of cells with reference mass below f_0 that survive filtering and sampling with at least d_min consumed tokens.

$$
\mathrm{cov}(d_{\min}) = \sum_{c \in \mathcal{C}} q(c)\,\mathbb{1}\big[d(c) \ge d_{\min}\big], \qquad \mathrm{red} = 1 - \frac{U}{D}
$$
*(Eq. 9.6)* where 𝒞 = cells, q = reference mass, d(c) = consumed tokens in c, U = unique consumed tokens, D = consumed tokens.

```figure
id: fig-9.11
kind: stat-panel
title: Coverage, redundancy and tail retention of a six-cell stream
caption: >-
  Eq. 9.6 and the long-tail definition evaluated on a toy stream of six
  content cells with reference masses 40, 30, 15, 8, 5 and 2%, a pool that
  holds exactly one pass at D = 1B, d_min = 30M tokens and f_0 = 0.1, so
  cells 4–6 are the tail. Scroll: proportional sampling, then a head-biased
  filter, then the same filter reused at four times the budget. Coverage
  barely moves in the last step; redundancy is what reveals it. Illustrative
  stream, not a measured corpus.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.6", "DERIVED:alg-9.2"]
alt: >-
  Instrument panel executing Algorithm 9.2 on six cells with reference masses
  0.40, 0.30, 0.15, 0.08, 0.05 and 0.02, unique tokens per cell equal to its
  mass times 1B, d_min = 30M and tail threshold f_0 = 0.1. Proportional
  sampling at D = 1B: five cells reach d_min, coverage 98%, long-tail retention
  2 of 3, redundancy 0. A head-biased filter that removes cells 5 and 6 and
  moves their 7% to cell 1: four cells reach d_min, coverage 93%, retention 1
  of 3, redundancy 7%, cell 1 read 1.18 times. The same filter at D = 4B:
  coverage still 93%, retention 1 of 3, redundancy 77%, cell 1 read 4.7 times.
spec:
  header: "ALGORITHM 9.2 · SIX-CELL TOY STREAM"
  variables: { D: 1.0e9, dmin: 3.0e7, q1: 0.4, q2: 0.3, q3: 0.15, q4: 0.08, q5: 0.05, q6: 0.02, s1: 0.4, s2: 0.3, s3: 0.15, s4: 0.08, s5: 0.05, s6: 0.02, n1: 4.0e8, n2: 3.0e8, n3: 1.5e8, n4: 8.0e7, n5: 5.0e7, n6: 2.0e7 }
  rows:
    - { key: "consumed tokens D", formula: "D", format: tokens }
    - { key: "cells with d(c) ≥ d_min, of 6", formula: "clamp(floor(s1*D/dmin), 0, 1) + clamp(floor(s2*D/dmin), 0, 1) + clamp(floor(s3*D/dmin), 0, 1) + clamp(floor(s4*D/dmin), 0, 1) + clamp(floor(s5*D/dmin), 0, 1) + clamp(floor(s6*D/dmin), 0, 1)", format: integer }
    - { key: "coverage cov(d_min)", formula: "q1*clamp(floor(s1*D/dmin), 0, 1) + q2*clamp(floor(s2*D/dmin), 0, 1) + q3*clamp(floor(s3*D/dmin), 0, 1) + q4*clamp(floor(s4*D/dmin), 0, 1) + q5*clamp(floor(s5*D/dmin), 0, 1) + q6*clamp(floor(s6*D/dmin), 0, 1)", format: percent }
    - { key: "long-tail retention ltr", formula: "(clamp(floor(s4*D/dmin), 0, 1) + clamp(floor(s5*D/dmin), 0, 1) + clamp(floor(s6*D/dmin), 0, 1))/3", format: percent, note: "tail = cells with q < 0.1" }
    - { key: "unique consumed U", formula: "min(s1*D, n1) + min(s2*D, n2) + min(s3*D, n3) + min(s4*D, n4) + min(s5*D, n5) + min(s6*D, n6)", format: tokens }
    - { key: "redundancy red = 1 − U/D", formula: "1 - (min(s1*D, n1) + min(s2*D, n2) + min(s3*D, n3) + min(s4*D, n4) + min(s5*D, n5) + min(s6*D, n6))/D", format: percent }
    - { key: "head cell c1, epochs", formula: "s1*D/n1", format: fixed2 }
    - { key: "tail cells c5 + c6, share of D", formula: "s5 + s6", format: percent }
states:
  - { anchor: formulation, label: "proportional, unfiltered", variables: { D: 1.0e9, s1: 0.4, s5: 0.05, s6: 0.02 }, highlight: ["coverage cov(d_min)", "long-tail retention ltr", "redundancy red = 1 − U/D"], note: "Proportional sampling of the reference: five of six cells clear d_min, cov = 98%, ltr = 2/3, red = 0. The 2% cell is present but never reaches d_min." }
  - { anchor: mechanism, label: "head-biased filter", variables: { D: 1.0e9, s1: 0.47, s5: 0, s6: 0 }, highlight: ["coverage cov(d_min)", "long-tail retention ltr", "head cell c1, epochs"], note: "The filter drops cells 5 and 6 and their 7% moves to the head: cov 93%, ltr 1/3, and cell 1 is now read 1.18 times, so red rises to 7%." }
  - { anchor: failure-modes, label: "same filter at 4× budget", variables: { D: 4.0e9, s1: 0.47, s5: 0, s6: 0 }, highlight: ["redundancy red = 1 − U/D", "head cell c1, epochs"], note: "Strictness inherited across budgets: coverage stays at 93%, but the 0.93B surviving tokens are read 4.3 times on average, red = 77%, cell 1 at 4.7 epochs." }
```

**Quality–quantity trade under a budget.** Let a filter with threshold θ retain n(θ) unique tokens of mean quality score s̄(θ), with n decreasing and s̄ increasing in θ. Under budget D the run repeats the retained pool e(θ) = D/n(θ) times. Using the repetition-discounted effective data D′ of [§9.6](09-6-data-scaling-limits.md) (Eq. 9.22, the form fitted by R9.5) as the currency, the pool's effective contribution is

$$
D'(\theta) = n(\theta) + n(\theta)\,R^{*}_{D}\Big(1 - e^{-(e(\theta)-1)/R^{*}_{D}}\Big), \qquad \theta^{\star}(D) = \arg\max_{\theta}\; \phi\big(\bar{s}(\theta)\big)\,D'(\theta)
$$
*(Eq. 9.7)* where R*_D is the repetition constant of R9.5 and φ is an increasing, unknown utility of mean quality; the equation is a DERIVED framing, not a fitted law, and φ is ASSUMED to exist. Its only robust consequence is qualitative: since ∂D′/∂n > 0 and saturates as e grows, θ* decreases as D grows — larger budgets want looser filters — and the crossover moves earlier for models that extract more per pass. PAPER-REPORTED (R9.23) reaches the same conclusion for vision-language data with its own fitted utility-and-repetition forms; those fits are not transferred here.

```figure
id: fig-9.12
kind: chart
title: Fresh-equivalent share of the budget against filter strictness
caption: >-
  The quantity side of Eq. 9.7, D′(θ)/D, for a pool that halves with each unit
  of strictness, n(θ) = n₀·2^(−θ), an ASSUMED illustrative shrink law. Each
  curve stays at 100% while the filtered pool still exceeds the budget and
  bends down once the filter forces e > 1. The knee sits at θ = 2 for
  D = n₀/4, at θ = 0 for D = n₀, and at 16·n₀ even the unfiltered pool is worth
  only 66%. The utility φ of mean quality is not drawn because the section
  does not fit it; the argmax of φ·D′ moves left as the knee does.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-9.7", "DERIVED:eq-9.22", R9.5]
alt: >-
  Line chart of D′/D, the repetition-discounted effective data as a share of
  consumed tokens, against filter strictness θ from 0 to 6, where the retained
  pool is n₀·2^(−θ) (assumed) and D′ follows Eq. 9.22 with R*_D = 15.39. For
  budget D = n₀/4 the share is 100% up to θ = 2, then 98.4% at 3, 93.1% at 4,
  82.8% at 5 and 66.1% at 6. For D = n₀: 100% at 0, 98.4% at 1, 93.1% at 2,
  66.1% at 4 and 25.2% at 6. For D = 4·n₀: 93.1% at 0, 66.1% at 2, 25.2% at 4.
  For D = 16·n₀: 66.1% at 0, 25.2% at 2 and 1.6% at 6.
spec:
  type: line
  x: { label: "filter strictness θ (pool halves per unit)", scale: linear, format: raw, domain: [0, 6] }
  y: { label: "D′/D, fresh-equivalent share of D", scale: linear, format: percent, domain: [0, 1] }
  variables: { n0: 1, Rs: 15.39, Da: 0.25, Db: 1, Dc: 4, Dd: 16 }
  series:
    - { id: da, label: "D = n₀/4", formula: "(min(Da, n0*2^(-x)) + n0*2^(-x)*Rs*(1 - exp(-max(Da/(n0*2^(-x)) - 1, 0)/Rs)))/Da", sample: { from: 0, to: 6, count: 25 } }
    - { id: db, label: "D = n₀", formula: "(min(Db, n0*2^(-x)) + n0*2^(-x)*Rs*(1 - exp(-max(Db/(n0*2^(-x)) - 1, 0)/Rs)))/Db", sample: { from: 0, to: 6, count: 25 }, emphasis: true }
    - { id: dc, label: "D = 4·n₀", formula: "(min(Dc, n0*2^(-x)) + n0*2^(-x)*Rs*(1 - exp(-max(Dc/(n0*2^(-x)) - 1, 0)/Rs)))/Dc", sample: { from: 0, to: 6, count: 25 } }
    - { id: dd, label: "D = 16·n₀", formula: "(min(Dd, n0*2^(-x)) + n0*2^(-x)*Rs*(1 - exp(-max(Dd/(n0*2^(-x)) - 1, 0)/Rs)))/Dd", sample: { from: 0, to: 6, count: 25 } }
  annotations:
    - { x: 2, label: "D = n₀/4: e reaches 1 at θ = 2" }
    - { x: 0, label: "D = 16·n₀: 66% before any filter" }
    - { x: 4, label: "D = n₀: 66% at θ = 4 (16 epochs)" }
```

**Capacity coupling.** PAPER-REPORTED (R9.27): in controlled synthetic settings, language models store about 2 bits of factual knowledge per parameter, and the amount stored depends on training duration and on the data's signal-to-noise ratio; PAPER-REPORTED (R9.26): a model's accuracy on a fact-based question rises with the number of pretraining documents relevant to that question, with a causal component established by intervention, and models "must be scaled by many orders of magnitude" to answer questions with little support. Combining the two as a DERIVED heuristic, not a law: a cell with reference mass q(c) receives about q(c)·D consumed tokens under proportional sampling, and whether that exposure is enough depends on N through the per-exposure retention, so the minimum exposure d_min in Eq. 9.6 is itself a decreasing function of N. The chapter does not assert a functional form for d_min(N); it is UNVERIFIED.

> **Assumption.** Content cells are defined by the same clustering used for deduplication in Chapter 08 · *sensitivity:* coarser cells overstate coverage and understate redundancy; a cell definition must be recorded with every reported value.

## Mechanism

Three mechanisms move the metrics. *Filtering* removes cells outright and, because quality classifiers are trained on head-like positives (PAPER-REPORTED, P06: FineWeb-Edu's classifier was thresholded at 3 to balance educational and general benchmarks), removes tail cells preferentially; [§8.6](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-6-filter-interactions.md) develops the rare-data loss of filter chains. Cost: fewer unique tokens, higher e_i at fixed D, no FLOP change. *Weighting and repetition* concentrate consumed tokens on up-weighted cells, lowering U/D and, when e_i > 1, raising r_i^max; PAPER-REPORTED (R9.25): D4 found that "repeating data intelligently consistently outperforms baseline training (while repeating random data performs worse than baseline training)" at the 6.7B scale, with embedding-based selection giving about 20% efficiency gains — repetition of selected, diverse content differs from repetition of arbitrary content. Cost: unchanged FLOPs, increased memorisation risk that scales with N (R9.24). *Diversification* — selecting for embedding-space spread rather than quality score — raises coverage at fixed U; its cost is an embedding pass over the pool (one forward pass of an encoder per document, NOT-DISCLOSED for any production pipeline) and a nearest-neighbour structure.

```figure
id: fig-9.13
kind: compare
title: Three mechanisms that move coverage, redundancy and tail retention
caption: >-
  Read across a row to see that the three levers act on different terms of
  Eq. 9.6. Filtering shrinks the pool and so raises epochs at a fixed budget;
  weighting moves consumed tokens between cells without changing the pool;
  diversification holds unique tokens fixed and changes which cells they come
  from. None changes FLOPs per token. The evidence row is single-lab, at scales
  up to 6.7B.
placement: wide
evidence: PAPER-REPORTED
source: [P06, R9.24, R9.25, R9.26, "DERIVED:eq-9.6"]
alt: >-
  Comparison table with three columns: quality filtering, weighting and
  repetition, and diversification (D4-style). Filtering removes cells, shrinks
  n_i, raises e_i = D/n_i at fixed D and removes tail cells preferentially;
  its reported evidence is FineWeb-Edu's classifier threshold of 3 and FineWeb's
  global deduplication keeping about 4T worse tokens. Weighting moves consumed
  tokens between cells, lowers U/D once e_i exceeds 1 and raises r_i^max; D4
  found selected repetition beat baseline at 6.7B while random repetition did
  worse, and R9.24 found a small repeated fraction disproportionately harmful.
  Diversification holds U fixed and raises coverage, costs one encoder pass per
  document, and D4 reported about 20% efficiency and up to 2% average accuracy
  at 6.7B. None changes FLOPs per token.
spec:
  axis: >-
    Effect on the consumed stream's coverage, redundancy and long-tail
    retention (Eq. 9.6) at a fixed token budget D, as the Mechanism states it
  columns:
    - { id: filter, label: "Quality filtering" }
    - { id: weight, label: "Weighting and repetition" }
    - { id: diverse, label: "Diversification (D4-style)" }
  rows:
    - { dimension: "what it changes", values: { filter: "removes cells outright; shrinks n_i", weight: "moves consumed tokens between cells; pool unchanged", diverse: "selects for embedding-space spread at a fixed U" } }
    - { dimension: "effective epochs at fixed D", values: { filter: "rise, e_i = D/n_i", weight: "rise on up-weighted domains; r_i^max rises when e_i > 1", diverse: "unchanged at matched n" } }
    - { dimension: "coverage cov(d_min)", values: { filter: "falls where tail cells are removed", weight: "falls for any domain weighted below d_min·|C_i|/D", diverse: "rises at fixed U" } }
    - { dimension: "long-tail retention", values: { filter: "falls preferentially: classifier positives are head-like", weight: "depends on which cells are up-weighted", diverse: "expected to rise (Experiment 9.2 ablation, a proposal)" } }
    - { dimension: "redundancy 1 − U/D", values: { filter: "rises at fixed D through repetition", weight: "rises with e_i", diverse: "not asserted by the section" } }
    - { dimension: "FLOPs per token", values: { filter: "unchanged", weight: "unchanged", diverse: "unchanged; plus one encoder pass per document (NOT-DISCLOSED in production)" } }
    - { dimension: "reported evidence", values: { filter: "P06: FineWeb-Edu threshold 3; global dedup kept ≈4T worse tokens", weight: "R9.25: selected repetition beat baseline at 6.7B, random did worse; R9.24: small repeated fraction harmful", diverse: "R9.25: ≈20% efficiency, up to 2% average accuracy at 6.7B" } }
    - { dimension: "named risk", values: { filter: "tail and rare-entity loss (R9.26)", weight: "memorisation of repeated content, larger at larger N (R9.24)", diverse: "dependence on the embedding model" } }
```

The interaction with the mixture weights is direct: under Eq. 9.6, a domain's coverage contribution is its own cell mass times the indicator that exposure crossed d_min, so a weight below d_min·|cells_i|/D wastes the domain entirely — it is present but never learned — while a weight far above n_i/D repeats it. The admissible window for each domain is therefore `[d_min·|𝒞_i|/D, E_max·n_i/D]`, and domain balance means keeping every weight inside its window before any optimisation of [§9.4](09-4-learned-mixture-selection.md) is attempted. MATHEMATICALLY-DERIVED from the definitions. For a small domain the window can be empty — the pool is too small to be covered at the minimum exposure without exceeding the epoch cap — which is the formal statement of "this domain is too small to matter at this cap and minimum exposure". Both bounds scale as 1/D, so the window is empty exactly when E_max·n_i < d_min·|𝒞_i|, whatever the budget.

```figure
id: fig-9.14
kind: calculator
title: Admissible weight window for one domain
caption: >-
  The window of the Mechanism, composed from Eq. 9.6's exposure threshold
  (floor) and Eq. 9.5's epoch cap (ceiling). Scroll: a weight inside the
  window, the same weight at Experiment 9.2's 4× budget, and a pool too small
  for any weight. Both bounds scale as 1/D, so a larger budget moves the window
  down but cannot open an empty one: the window is empty exactly when
  E_max·n_i < d_min·|C_i|. Illustrative domain, cell count and d_min.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.5", "DERIVED:eq-9.6"]
alt: >-
  Calculator for the admissible window w_i in [d_min·|C_i|/D, E_max·n_i/D]
  with inputs unique tokens n_i, content cells |C_i|, minimum exposure d_min per
  cell, budget D, epoch cap E_max and a proposed weight w_i. At the illustrative
  defaults (n = 2B, 100,000 cells, d_min = 10,000 tokens, D = 1T, E_max = 4,
  w = 0.5%) the window is 0.1% to 0.8%, the weight sits inside with 0.3 points
  of slack, e = 2.5 and 50,000 tokens per cell. At D = 4T the window is 0.025%
  to 0.2% and the same weight gives e = 10, outside. With n = 200M the ceiling
  0.08% is below the floor 0.1%: the window is empty.
spec:
  tex: >-
    \frac{d_{\min}\,|\mathcal{C}_i|}{D} \;\le\; w_i \;\le\; \frac{E_{\max}\,n_i}{D}
  inputs:
    - { symbol: n, label: "unique tokens n_i", default: 2.0e9, min: 1.0e7, max: 1.0e12, scale: log10, format: tokens }
    - { symbol: C, label: "content cells |C_i|", default: 1.0e5, min: 100, max: 1.0e7, scale: log10, format: integer }
    - { symbol: dmin, label: "d_min, tokens per cell", default: 1.0e4, min: 100, max: 1.0e6, scale: log10, format: tokens }
    - { symbol: D, label: "budget D", default: 1.0e12, min: 1.0e10, max: 1.0e14, scale: log10, format: tokens }
    - { symbol: E, label: "epoch cap E_max", default: 4, min: 1, max: 16, options: [1, 2, 4, 8, 16], format: integer }
    - { symbol: w, label: "proposed weight w_i", default: 0.005, min: 0.0001, max: 0.5, scale: log10, format: percent }
  outputs:
    - { symbol: lo, label: "floor d_min·|C_i|/D", formula: "dmin*C/D", format: percent }
    - { symbol: hi, label: "ceiling E_max·n_i/D", formula: "E*n/D", format: percent }
    - { symbol: width, label: "window width (negative = empty)", formula: "hi - lo", format: percent }
    - { symbol: e, label: "epochs at w, e_i = w·D/n_i", formula: "w*D/n", format: fixed2 }
    - { symbol: cell, label: "mean tokens per cell at w", formula: "w*D/C", format: tokens }
    - { symbol: slack, label: "slack, min(w − floor, ceiling − w)", formula: "min(w - lo, hi - w)", format: percent, emphasis: true }
states:
  - { anchor: mechanism, label: "w inside the window", variables: { n: 2.0e9, D: 1.0e12, w: 0.005 }, highlight: [lo, hi, slack], note: "A 2B-token, 100k-cell domain at D = 1T: window 0.1% to 0.8%. The weight 0.5% sits inside with e = 2.5 and 50k tokens per cell." }
  - { anchor: experimental-design, label: "same w at 4× budget", variables: { n: 2.0e9, D: 4.0e12, w: 0.005 }, highlight: [hi, e, slack], note: "Experiment 9.2's 4× budget: both bounds fall 4×, the ceiling to 0.2%, and the unchanged 0.5% now forces e = 10. A threshold and weight chosen at 1T are wrong at 4T." }
  - { anchor: failure-modes, label: "empty window, n_i = 200M", variables: { n: 2.0e8, D: 1.0e12, w: 0.005 }, highlight: [lo, hi, width], note: "Shrink the pool to 200M: the ceiling 0.08% falls below the floor 0.1%. No weight covers every cell at d_min within the cap, at any D; merge, re-cap or drop the domain." }
```

## Algorithm

```text
Algorithm 9.2 — Coverage, redundancy and long-tail audit of a consumed stream
INPUT   exposure ledger and emitted (domain, unit, pass) triples of Algorithm 9.1; cluster map C: unit → cell (from §8.3);
        reference masses q(c); thresholds d_min, f_0; sample rate ρ ∈ (0, 1]
OUTPUT  cov(d_min), red, ltr(f_0, d_min), per-domain admissible windows
STATE   hash map d[c] (consumed tokens per cell); set of (unit, pass) seen; U (unique tokens)
INVARIANT d[c] counts only committed tokens; U counts a unit once regardless of pass
1.  d ← {}; U ← 0; seen ← ∅
2.  for each committed triple (i, j, e) with global index t, if hash(t) mod 1/ρ == 0:
3.      c ← C[i, j]; d[c] ← d[c] + len(U_i[j]) / ρ
4.      if (i, j) ∉ seen: seen ← seen ∪ {(i, j)}; U ← U + len(U_i[j]) / ρ
5.  cov ← Σ_c q(c)·[d[c] ≥ d_min]
6.  red ← 1 − U / Σ_c d[c]
7.  ltr ← |{c : q(c) < f_0 ∧ d[c] ≥ d_min}| / |{c : q(c) < f_0}|
8.  for each domain i: window_i ← [d_min·|C_i| / D, E_max·n_i / D]; flag if w_i ∉ window_i or window_i = ∅
9.  return (cov, red, ltr, windows)
TERMINATION: one pass over the sampled triples.
```

Complexity: O(ρ·D/ℓ̄) hash operations for a stream of D tokens with mean unit length ℓ̄; memory O(|𝒞|) for d and O(ρ·Σ_i N_i) for `seen` (a Bloom filter with a stated false-positive rate reduces it at the cost of under-counting U by that rate). Implementation link: `exposure_report.csv` columns `unique_tokens, coverage, long_tail_retention` in [verification.md](verification.md). The cluster map is an input from Chapter 08; this algorithm does not compute duplicates.

Cost line: parameters 0; tokens 0; FLOPs — negligible against training; memory capacity O(|𝒞|); memory traffic one pass over the ledger; communication — a reduction of per-rank hash maps at report time; latency — off the training critical path; energy and money — NOT-DISCLOSED.

## Implementation

Tensors → operators: none on the accelerator; the audit consumes the sampler's emitted triples and a cluster map. Framework: the same loader that hosts Algorithm 9.1. Named reference-stack systems with their §4.1 layer: **MosaicML LLM Foundry** (Distributed training) exposes per-stream `repeat` (R9.33), which is the direct control of e_i and hence of the redundancy term; **Megatron-LM** (Distributed training) materialises the blended sample index (R9.36), so the audit can be run over the index file before training rather than during it — a property the chapter uses in the verification protocol; **Hugging Face Transformers** is not involved. Quality scores and cluster ids are produced by the Chapter 08 pipeline; no reference-stack system computes them as a documented feature on the pages opened (NOT-DISCLOSED). Kernels, memory, communication: none. Deployment: the audit runs at each reporting step and writes to the exposure report.

> **Implementation note [impl.megatron-lm · datasets readme as opened 2026-09-20, no version string on the page].** Because `BlendedDataset` precomputes a dataset index and a dataset sample index (R9.36), the per-domain consumed-token forecast and the coverage audit can be computed from those indices before the first step — provided the sample index is built with the same seed and sequence length as the run.

## Experimental design

### Experiment 9.2 — Filter strictness against budget

- **Hypothesis.** The filter threshold that maximises held-out loss at equal tokens decreases (loosens) as D increases and as N increases at fixed D/N; a threshold chosen at a small budget and reused at a large budget produces a run whose small-domain effective epochs exceed 4 and whose loss on a held-out domain rises relative to the looser filter.
- **Setup.** One web pool with a scored quality classifier (Chapter 08); thresholds θ ∈ {loose, medium, strict} giving n(θ) spanning at least 8×; budgets D ∈ {0.5×, 1×, 4×} of the strict pool's size; two model sizes at a fixed D/N.
- **Independent variables.** θ, D, N.
- **Controlled variables.** Tokenizer, model family, optimiser, schedule, sequence length, seeds (3), evaluator; e(θ) recorded per arm.
- **Dataset / workload.** The web pool; per-cell held-out validation; one held-out domain never in any pool.
- **Hardware.** Any; equal tokens and equal FLOPs coincide at fixed N and T.
- **Metrics.** Token-mean loss on in-pool validation and on the held-out domain; cov, red, ltr from Algorithm 9.2; e(θ).
- **Baselines.** Unfiltered pool at each D.
- **Expected result.** At the smallest D the strict filter wins; at the largest D the medium or loose filter wins; the crossover occurs at lower D for the larger N. Redundancy rises monotonically with strictness at fixed D; long-tail retention falls with strictness at every D.
- **Ablation.** Replace quality-score filtering by embedding-diversity selection to the same n(θ); expected higher ltr at similar loss.
- **Interpretation.** Confirms the direction of Eq. 9.7 without fitting φ; a crossover that does not move with D would falsify the coupling.
- **Threats to validity.** Classifier bias toward the head confounds "quality" with "head-likeness"; small-model insensitivity; the held-out domain may be close to the pool.

## Observations

**What the paper claims.** PAPER-REPORTED (P06): per-snapshot deduplication outperformed global deduplication, and small duplicate clusters can be worth keeping. PAPER-REPORTED (P07): mixing curated extras into the best-filtered web set hurt on average. PAPER-REPORTED (R9.25): selected repetition beat single-pass random data at 6.7B; random repetition did worse. PAPER-REPORTED (R9.24): a small repeated fraction caused a strong double-descent-like degradation and damaged induction-head-like structures. PAPER-REPORTED (R9.26): fact accuracy tracks relevant-document count with a causal component. PAPER-REPORTED (R9.27): about 2 bits of knowledge per parameter under controlled conditions, dependent on exposure and signal-to-noise.

**What the evidence shows.** Each finding is a single-lab result at scales up to about 7B; the direction "quality must be budget-aware" is supported by two independent groups (P06, R9.23) in two modalities. The 2-bits-per-parameter figure comes from synthetic data and has not been shown to transfer to web text; the R9.24 degradation was measured with an artificial repetition pattern. No paper opened measured coverage or long-tail retention as defined here; the definitions are the book's.

**What we infer.** DERIVED: filter strictness, mixture weight and repetition count are one decision, and the admissible window per domain is computable before training from n_i, |𝒞_i|, d_min, E_max and D, and whether it is empty from the first four alone. ASSUMED: d_min falls with N; the functional form is not asserted.

**What remains unknown.** NOT-DISCLOSED: the coverage or redundancy of any frontier training stream; the cell definition used by any lab. UNVERIFIED: whether Eq. 9.7's qualitative crossover appears at the scales of Experiment 9.2; whether R9.25's selected-repetition result holds beyond 6.7B.

## Failure modes

> **Failure mode — head-biased filter.** *Symptom:* validation loss on head domains improves while held-out tail domains and rare-entity questions degrade. *Cause:* the classifier's positives are head-like; tail cells are removed. *Detection:* ltr falls sharply between the unfiltered and filtered streams; per-cell losses diverge. *Mitigation:* diversity-aware selection to the same n(θ); per-cell floors.

> **Failure mode — strictness inherited across budgets.** *Symptom:* a run at 4× the proxy budget shows small-domain loss rising after a minimum. *Cause:* θ chosen at small D reused at large D; e_i > 4 for the strict pool. *Detection:* e_i in the ledger; loss curve non-monotone on the repeated domain. *Mitigation:* re-choose θ per budget (Experiment 9.2); cap epochs.

> **Failure mode — redundancy hidden by deduplication scope.** *Symptom:* red computed low, but the model memorises boilerplate. *Cause:* cells defined at document level miss paragraph-level duplicates. *Detection:* n-gram repetition statistics on generations; compare red at two cell granularities. *Mitigation:* record the cell definition; audit at the finer granularity used by [§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md).

> **Failure mode — empty admissible window.** *Symptom:* a domain is weighted but its per-cell exposure never reaches d_min. *Cause:* n_i too small for the domain's cell count at the chosen cap and minimum exposure, E_max·n_i < d_min·|𝒞_i| — a condition that does not involve D, so no budget opens the window. *Detection:* Algorithm 9.2, line 8. *Mitigation:* merge the domain into a neighbour, raise the cap deliberately with the cost stated, or drop it.

## Siblings

**Quality filtering** — [§8.2](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation.md)
Why it exists: most crawled text is low value per token. What assumption changed (relative to budget-aware mixing): quality is a property of a document alone. What objective changed: a classifier score threshold. What problem it solved: mean quality of the pool. What new failure mode it introduced: budget-blind repetition. Changed primitive: the pool → a thresholded pool.

**Deduplication** — [§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md)
Why it exists: exact and near duplicates waste tokens and leak evaluations. What assumption changed: every duplicate is worthless. What objective changed: unique-content maximisation. What problem it solved: cross-document redundancy. What new failure mode it introduced: removing natural up-weighting of widely replicated, often useful content (P06). Changed primitive: document set → cluster representatives.

**Diversity-based selection (D4-style)** — this file; R9.25
Why it exists: quality scores select near-identical head content. What assumption changed: spread in an embedding space is a proxy for coverage. What objective changed: a diversity criterion under a size constraint. What problem it solved: coverage at fixed U. What new failure mode it introduced: dependence on the embedding model; an extra encoder pass. Changed primitive: a scalar score → a geometry.

**Late-stage quality upsampling** — [§9.3](09-3-curriculum-design.md)
Why it exists: strict-filtered pools are small; repeating them throughout wastes them. What assumption changed: when exposure occurs matters. What objective changed: none. What problem it solved: uses scarce high-quality tokens once, at the end. What new failure mode it introduced: schedule confounding. Changed primitive: static θ → phase-dependent θ.

**Synthetic augmentation** — [§9.6](09-6-data-scaling-limits.md), [§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md)
Why it exists: the high-quality pool is exhausted. What assumption changed: a model can manufacture unique tokens. What objective changed: none. What problem it solved: n_i. What new failure mode it introduced: distributional collapse when synthetic data replaces rather than accumulates alongside real data (R9.29). Changed primitive: a fixed pool → a generated pool.

## Extensions

For continued pretraining ([§22.4](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-4-retention-and-interference.md)) the reference distribution q becomes the original training mixture, and coverage measures retention exposure. For long context, cells should be defined per length bucket because long documents are rarer and are removed disproportionately by length-sensitive filters. For multimodal data, redundancy must be computed per modality with modality-specific duplicate detectors; proposal only. For agents, trajectories from the same environment are near-duplicates at the state level even when their text differs, so a cell map by environment and task is needed (proposal).

## Limitations

The metrics depend on a cell definition and a reference distribution, neither of which is canonical; two teams with different clusterings will report different coverage for the same stream. Eq. 9.7 uses a repetition form fitted on English web text (R9.5) and an unspecified utility; it predicts direction, not magnitude. Capacity coupling rests on synthetic-data results (R9.27) and correlational-plus-intervention results (R9.26) that have not been combined in one experiment. Falsification: if Experiment 9.2 shows the optimal θ independent of D across an 8× range, the budget coupling is absent at that scale and the section's central recommendation — choose strictness per budget — is unnecessary there.

## Reproducibility

Cell map version and clustering parameters (from Chapter 08's removal ledger), reference distribution, d_min, f_0, ρ and the sampler seed; the audit's outputs live in `exposure_report.csv`. Papers opened: P06, P07, R9.23–R9.27 (see [references.md](references.md)). Unknowns: no audit has been run on any real stream for this edition (UNVERIFIED).

## References

P06 · P07 · R9.5 · R9.23 · R9.24 · R9.25 · R9.26 · R9.27 · R9.29 · [references.md](references.md)
