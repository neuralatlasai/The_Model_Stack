---
id: ms.section.9.1
entity_type: section
title: Mixture formulation
short_title: Mixture formulation
volume: 1
part: 2
chapter: 9
section: 9.1
slug: 09-1-mixture-formulation
parent: ms.chapter.9
prev_sibling: null
next_sibling: ms.section.9.2
children: []
prerequisites: [ms.section.2.2, ms.section.6.3, ms.section.7.2, ms.section.8.3]
downstream: [ms.section.9.2, ms.section.9.3, ms.section.9.4, ms.section.9.5, ms.section.9.6, ms.section.12.3, ms.section.12.5, ms.section.19.2]
related: [ms.section.10.3]
siblings_by_mechanism: [ms.section.9.3, ms.section.9.4]
relations:
  - {type: supported_by, target: paper.P03}
  - {type: supported_by, target: paper.P07}
  - {type: implemented_by, target: impl.mosaicml-llm-foundry}
  - {type: implemented_by, target: impl.megatron-lm}
  - {type: implemented_by, target: impl.torchtitan}
axes:
  lifecycle: [data, pretraining]
  mechanism: [data_mixture, sampling, repetition]
  feedback_setting: []
  modality: [text]
papers: [P03, P07]
implementations: [impl.mosaicml-llm-foundry, impl.megatron-lm, impl.torchtitan, impl.pytorch]
benchmarks: []
datasets: [the-pile, olmo-2-mix-1124]
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2200
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 9.1 Mixture formulation

## Scope

Objective: replace "the training set" by a mixture policy — a probability vector over domains, a declared sampling unit, a temperature, an order rule and a seed — and derive from it the quantities that a run actually controls: expected tokens per domain, effective epochs, and maximum repetitions of any unit. Baseline: concatenate-and-shuffle, in which every domain's weight is its token share and every token is seen once. Success criterion: a reader can convert any published mixture (unit weights, token weights, or temperature) into per-domain consumed tokens and epochs under a named tokenizer, and can specify a sampler whose exposure ledger survives restarts. Boundaries: which pools exist and how they were filtered belongs to [§7.2](../ch07-data-provenance-acquisition-and-dataset-semantics/07-2-orthogonal-dataset-axes.md) and [§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md); loader engineering, packing and restart semantics belong to [§12.3](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-3-sampling-and-loading.md), [§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md) and [§12.5](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md); how weights are chosen is §9.2–§9.4.

## Why this exists

What failed before was implicit weighting. A corpus assembled by concatenation weights each source by its size after filtering, so a change in a filter threshold silently changes the mixture, and a reader of the corpus card cannot tell how many times a small source was visited. PAPER-REPORTED (P03, Table 1): The Pile broke with this by publishing, per component, a raw size, a weight and an "epochs" column defined as the number of passes over that component during one full pass over The Pile — Pile-CC at 1.0, Wikipedia (en) at 3.0, Books3 at 1.5, PubMed Central and ArXiv at 2.0 — with a stated 825.18 GiB raw and 1,254.20 GiB effective size. The bottleneck that this exposed is that a weight above a domain's natural share is a repetition count in disguise, and repetition has a price ([§9.6](09-6-data-scaling-limits.md)). The dominant constraint is therefore the unique token count n_i of each domain relative to the tokens D the run will consume. What changed is that the mixture is now an object with its own accounting: OLMo 2 publishes its stage-1 mix as a table of sources and token counts totalling about 3.9T tokens, and reports that its 7B model consumed about 4T tokens — slightly more than one pass over that mix (PAPER-REPORTED, R9.7, Table 4 and §3). Every quantity in that sentence — token counts under a named tokenizer, passes, and the difference between the mix size and the consumed count — is what this section formalises.

```figure
id: fig-9.4
kind: stat-panel
title: OLMo 2 Mix 1124 as a ledger
caption: >-
  A published mix read as the section reads it. The seven sources sum to 3.90T
  tokens, 95% of them DCLM-Baseline, and the 7B stage-1 run consumed 4T, so
  the mix-level average is 1.03 passes. That average is all the table fixes:
  how many times StarCoder or Wikipedia was read depends on the sampling rule,
  which is exactly what Eq. 9.1–9.5 make explicit. The 13B and 32B stage-1
  counts are shown as reported, without passes, because the section does not
  tie them to this table.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: R9.7
alt: >-
  Instrument panel of OLMo 2 Mix 1124 from R9.7 Table 4, in tokens:
  DCLM-Baseline 3.71T, StarCoder 83.0B, peS2o 58.6B, arXiv 20.8B, OpenWebMath
  12.2B, Algebraic Stack 11.8B, Wikipedia 3.7B; total 3.90T, of which
  DCLM-Baseline is 95.1%. The 7B model's stage 1 consumed 4T tokens, 1.03
  passes over the mix on average. Stage-1 consumption reported for 13B is 5T
  and for 32B 6.06T. Per-source epochs are not stated in the source.
spec:
  header: "OLMO 2 MIX 1124 · STAGE 1 (R9.7, TABLE 4)"
  variables: { dclm: 3.71e12, star: 83.0e9, pes2o: 58.6e9, arxiv: 20.8e9, owm: 12.2e9, alg: 11.8e9, wiki: 3.7e9, D7: 4.0e12 }
  rows:
    - { key: "DCLM-Baseline", formula: "dclm", format: tokens }
    - { key: "StarCoder", formula: "star", format: tokens }
    - { key: "peS2o", formula: "pes2o", format: tokens }
    - { key: "arXiv", formula: "arxiv", format: tokens }
    - { key: "OpenWebMath", formula: "owm", format: tokens }
    - { key: "Algebraic Stack", formula: "alg", format: tokens }
    - { key: "Wikipedia", formula: "wiki", format: tokens }
    - { key: "mix total", formula: "dclm + star + pes2o + arxiv + owm + alg + wiki", format: tokens }
    - { key: "DCLM-Baseline share", formula: "dclm/(dclm + star + pes2o + arxiv + owm + alg + wiki)", format: percent }
    - { key: "7B stage 1, 4T: passes", formula: "D7/(dclm + star + pes2o + arxiv + owm + alg + wiki)", format: fixed2, note: "mix-level mean; per-source epochs not stated" }
    - { key: "13B · 32B stage 1, reported", value: "5T · 6.06T" }
```

## Intuition

Physically, a training run is a stream of B·T tokens per step for S_steps steps, and the mixture policy decides which pool each packed sequence is filled from. The only resources the policy moves are (i) which bytes are read from storage, (ii) how many times the same bytes are read, and (iii) nothing else — the FLOPs per step are fixed by the model and the sequence length, not by where the tokens came from. That is why "equal tokens" and "equal FLOPs" coincide for a dense model at fixed sequence length and diverge only when a policy changes the sequence-length distribution ([§9.3](09-3-curriculum-design.md)) or the model ([§9.6](09-6-data-scaling-limits.md)). MATHEMATICALLY-DERIVED from the 6ND accounting of [notation.md](../../../front-matter/notation.md) §2.2. Heuristically, one may think of a weight as "how much the model cares about a domain"; the physical statement is only that the gradient at each step is an average over a batch whose domain composition the sampler chose, so the weight vector scales the expected per-domain gradient contribution linearly and nothing more.

## Formulation

Let there be k domains with available token counts n_1, …, n_k under a fixed tokenizer τ_id (the tokenizer is part of the definition: [§10.3](../ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md) shows the same bytes yield different n_i under different tokenizers). Let D be the tokens the run will consume (the global symbol of [notation.md](../../../front-matter/notation.md), here in its "consumed" sense).

> **Definition — mixture policy.** The versioned map `π : (step or token position) → (w ∈ Δ^{k−1}, unit, order rule, seed)` from training position to a probability vector over domains together with the declared sampling unit, the within-domain order rule and the seed; a static mixture is the special case of a constant map.

> **Definition — sampling unit.** The object the sampler draws — a document, a packed sequence of fixed length T, or a token — which fixes whether the weight vector is a share of units or a share of tokens.

> **Definition — available / sampled / consumed tokens.** For domain i: available tokens n_i are the tokens in the pool after the filters of Chapter 08; sampled tokens s_i are the tokens the sampler emitted for domain i; consumed tokens d_i are the sampled tokens that entered an optimiser step which was retained (not skipped or rolled back) with loss mask m_t = 1.

> **Definition — effective epochs.** `e_i = d_i / n_i`, consumed tokens of domain i divided by its available tokens under the named tokenizer.

> **Definition — exposure accounting.** The per-phase, per-domain ledger of (n_i, s_i, d_i, e_i, r_i^max), where r_i^max is the maximum number of times any single unit of domain i was consumed.

**Token weighting.** If the sampler draws tokens (or packed sequences from a token stream) with domain probabilities w_i, the expected consumed tokens are

$$
\mathbb{E}[d_i] = w_i\,D\,(1-\mu_i), \qquad \sum_i w_i = 1
$$
*(Eq. 9.1)* where μ_i is the fraction of domain-i tokens carrying loss mask zero (for pretraining text, μ_i ≈ 0; for templated or padded data it is not). Under Eq. 9.1 the mixture weight is a token share.

**Unit weighting.** If the sampler draws whole units (documents) with probabilities u_i and domain i has mean unit length ℓ̄_i tokens, the realised token share is

$$
w_i = \frac{u_i\,\bar{\ell}_i}{\sum_j u_j\,\bar{\ell}_j}
$$
*(Eq. 9.2)* where ℓ̄_i is measured under τ_id after any truncation. MATHEMATICALLY-DERIVED. A document-weighted mixture with equal u_i therefore over-represents long-document domains (books, code repositories) by the ratio of mean lengths — an order-of-magnitude effect between web pages and books, whose exact value depends on the corpus and is not asserted here.

```figure
id: fig-9.5
kind: calculator
title: Document weights to token shares
caption: >-
  Eq. 9.2 for three domains whose units differ in mean length. Equal document
  weights hand the long-unit domain 89% of the tokens at the default lengths,
  50 times the short-unit domain's share, which is exactly the ratio of their
  mean lengths. The preset inverts the lengths and recovers equal token shares.
  The lengths are illustrative, not measured; the section asserts only an
  order-of-magnitude gap between web pages and books.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-9.2"
alt: >-
  Calculator for Eq. 9.2, w_i = u_i·ℓ_i / Σ_j u_j·ℓ_j, over three unit weights
  u_1, u_2, u_3 and three mean unit lengths in tokens. At the illustrative
  defaults (u = 1, 1, 1; ℓ = 1,000, 5,000 and 50,000 tokens) the token shares
  are 1.8%, 8.9% and 89.3%; the long-unit domain receives 2.68 times its
  document share, and the mean drawn unit is 18,667 tokens. The preset
  u = 1, 0.2, 0.02 gives equal token shares of 33.3%.
spec:
  tex: >-
    w_i = \frac{u_i\,\bar{\ell}_i}{\sum_j u_j\,\bar{\ell}_j}
  equation: "9.2"
  inputs:
    - { symbol: u1, label: "document weight u_1", default: 1, min: 0.01, max: 1, step: 0.01, format: fixed2 }
    - { symbol: u2, label: "document weight u_2", default: 1, min: 0.01, max: 1, step: 0.01, format: fixed2 }
    - { symbol: u3, label: "document weight u_3", default: 1, min: 0.01, max: 1, step: 0.01, format: fixed2 }
    - { symbol: l1, label: "mean unit length ℓ_1, short units", default: 1000, min: 100, max: 100000, scale: log10, format: tokens }
    - { symbol: l2, label: "mean unit length ℓ_2", default: 5000, min: 100, max: 100000, scale: log10, format: tokens }
    - { symbol: l3, label: "mean unit length ℓ_3, long units", default: 50000, min: 100, max: 100000, scale: log10, format: tokens }
  outputs:
    - { symbol: w1, label: "token share w_1", formula: "u1*l1/(u1*l1 + u2*l2 + u3*l3)", format: percent }
    - { symbol: w2, label: "token share w_2", formula: "u2*l2/(u1*l1 + u2*l2 + u3*l3)", format: percent }
    - { symbol: w3, label: "token share w_3", formula: "u3*l3/(u1*l1 + u2*l2 + u3*l3)", format: percent, emphasis: true }
    - { symbol: over, label: "w_3 ÷ its document share", formula: "w3*(u1 + u2 + u3)/u3", format: ratio }
    - { symbol: lbar, label: "mean tokens per drawn unit", formula: "(u1*l1 + u2*l2 + u3*l3)/(u1 + u2 + u3)", format: tokens }
  presets:
    - { label: "equal token shares", values: { u1: 1, u2: 0.2, u3: 0.02 } }
```

**Temperature sampling.** A one-parameter family that interpolates between size-proportional and uniform weighting:

> **Definition — sampling temperature (mixture).** The parameter T_s > 0 in `p_i ∝ n_i^{1/T_s}` that interpolates between size-proportional domain sampling (T_s = 1) and uniform sampling (T_s → ∞); the multilingual literature writes the same law with α = 1/T_s.

$$
p_i(T_s) = \frac{n_i^{1/T_s}}{\sum_{j=1}^{k} n_j^{1/T_s}}
$$
*(Eq. 9.3)* where n_i are available tokens (or units — the literature is not consistent, and the artifact must record which). PAPER-REPORTED (R9.11): mT5 samples languages with `p(L) ∝ |L|^α` and chose α = 0.3 (T_s ≈ 3.33), citing α = 0.7 for mBERT, 0.3 for XLM-R and 0.2 for a multilingual NMT system.

**Effective epochs under temperature sampling.** Substituting Eq. 9.3 into Eq. 9.1 with μ_i = 0:

$$
e_i(T_s) = \frac{D\,p_i(T_s)}{n_i} = \frac{D\; n_i^{\,1/T_s - 1}}{\sum_j n_j^{1/T_s}}, \qquad \frac{e_i}{e_j} = \left(\frac{n_i}{n_j}\right)^{\frac{1-T_s}{T_s}}
$$
*(Eq. 9.4)* where the second form shows the repetition asymmetry the temperature buys.

```figure
id: fig-9.6
kind: calculator
title: Temperature sampling and the epochs it implies
caption: >-
  Eq. 9.3 and Eq. 9.4 for three domains of 1T, 100B and 1B tokens and a
  consumed budget of 1T. The weight vector looks mild at every temperature;
  the epochs do not. At T_s = 3.33 (α = 0.3) the 1B-token domain holds 7.7% of
  the stream and is read 77 times while the 1T domain is read 0.61 times, the
  126× asymmetry of the derivation. Scroll to watch the same instrument show
  silent repetition and then the size-proportional baseline. Illustrative
  configuration, not a named corpus.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.3", "DERIVED:eq-9.4", R9.11]
alt: >-
  Calculator for Eq. 9.3 and 9.4 over temperature T_s, three available token
  counts and the consumed budget D. At the illustrative defaults n = 1T, 100B
  and 1B tokens, D = 1T and T_s = 3.33: shares p = 61.5%, 30.8% and 7.7%;
  effective epochs 0.61, 3.08 and 77.2; the small domain's epochs are 126 times
  the large domain's. At T_s = 10: p_3 = 21.8%, e_3 = 218 and the ratio is 501.
  At T_s = 1 every domain gets 0.91 epochs and the small domain holds 0.09% of
  the stream.
spec:
  tex: >-
    p_i = \frac{n_i^{1/T_s}}{\sum_j n_j^{1/T_s}},\qquad e_i = \frac{D\,p_i}{n_i} = \frac{D\,n_i^{1/T_s - 1}}{\sum_j n_j^{1/T_s}}
  equation: "9.4"
  inputs:
    - { symbol: Ts, label: "sampling temperature T_s", default: 3.33, min: 1, max: 100, scale: log10, format: fixed2 }
    - { symbol: n1, label: "large domain n_1", default: 1.0e12, min: 1.0e10, max: 1.0e13, scale: log10, format: tokens }
    - { symbol: n2, label: "middle domain n_2", default: 1.0e11, min: 1.0e9, max: 1.0e13, scale: log10, format: tokens }
    - { symbol: n3, label: "small domain n_3", default: 1.0e9, min: 1.0e7, max: 1.0e12, scale: log10, format: tokens }
    - { symbol: D, label: "consumed tokens D", default: 1.0e12, min: 1.0e10, max: 1.0e14, scale: log10, format: tokens }
  outputs:
    - { symbol: p1, label: "share of the large domain p_1", formula: "n1^(1/Ts)/(n1^(1/Ts) + n2^(1/Ts) + n3^(1/Ts))", format: percent }
    - { symbol: p3, label: "share of the small domain p_3", formula: "n3^(1/Ts)/(n1^(1/Ts) + n2^(1/Ts) + n3^(1/Ts))", format: percent }
    - { symbol: e1, label: "epochs, large domain e_1", formula: "D*p1/n1", format: fixed2 }
    - { symbol: e2, label: "epochs, middle domain e_2", formula: "D*n2^(1/Ts - 1)/(n1^(1/Ts) + n2^(1/Ts) + n3^(1/Ts))", format: fixed2 }
    - { symbol: e3, label: "epochs, small domain e_3", formula: "D*p3/n3", format: fixed2, emphasis: true }
    - { symbol: r, label: "repetition asymmetry e_3 ÷ e_1", formula: "e3/e1", format: ratio }
states:
  - { anchor: formulation, label: "T_s = 3.33 (α = 0.3)", variables: { Ts: 3.33 }, highlight: [Ts, p3, e3, r], note: "mT5's α = 0.3: a 7.7% share reads the 1B-token domain 77 times while the 1T domain is read 0.61 times, the 126× asymmetry of Eq. 9.4." }
  - { anchor: failure-modes, label: "T_s = 10, no cap", variables: { Ts: 10 }, highlight: [p3, e3, r], note: "Silent repetition: at T_s = 10 the small domain is 22% of the stream and is read 218 times. Nothing in the weight vector says so; only e_i does." }
  - { anchor: siblings, label: "T_s = 1, size-proportional", variables: { Ts: 1 }, highlight: [e1, e2, e3], note: "The concatenate-and-shuffle baseline: every domain is read 0.91 times, and the 1B-token domain is 0.09% of the stream, present but nearly absent." }
```

<details><summary>Derivation of Eq. 9.4 and its limits</summary>

From Eq. 9.1, E[d_i] = p_i D. Divide by n_i and insert Eq. 9.3: e_i = D n_i^{1/T_s}/(n_i Σ_j n_j^{1/T_s}) = D n_i^{1/T_s − 1}/Σ_j n_j^{1/T_s}. The ratio e_i/e_j cancels the denominator and leaves (n_i/n_j)^{1/T_s − 1} = (n_i/n_j)^{(1−T_s)/T_s}. Limits: at T_s = 1, e_i = D/Σ_j n_j for every i — all domains are seen the same number of times, which is the concatenate-and-shuffle baseline. As T_s → ∞, p_i → 1/k and e_i → D/(k n_i): the smallest domain is repeated most, with e_min/e_max = n_max/n_min. For T_s = 3.33 (α = 0.3) and two domains with n_i/n_j = 10⁻³, the exponent (1 − 3.33)/3.33 ≈ −0.70 gives e_i/e_j ≈ 10^{2.1} ≈ 126: the small domain is repeated about 126 times as often as the large one. MATHEMATICALLY-DERIVED; the numerical example is illustrative.

</details>

```figure
id: fig-9.7
kind: chart
title: Effective epochs per domain against sampling temperature
caption: >-
  The three curves fan out from a single point. At T_s = 1 all three domains
  are read 0.91 times; raising T_s lowers the large domain's epochs only
  slowly while the small domain's climb by orders of magnitude, passing an
  illustrative four-epoch cap already at T_s ≈ 1.29 and reaching 77 at
  α = 0.3. The limit as T_s → ∞ is D/(k·n_3) = 333. A temperature is a
  repetition schedule for the tail, which is why Eq. 9.5 caps epochs rather
  than shares. Same illustrative configuration as the rail calculator.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.4", "DERIVED:eq-9.5"]
alt: >-
  Log–log line chart of effective epochs e_i against sampling temperature T_s
  from 1 to 100 for three domains of 1T, 100B and 1B available tokens at a
  consumed budget of 1T tokens, an illustrative configuration. At T_s = 1 all
  three curves start at 0.91 epochs. At T_s = 3.33 they are 0.61, 3.08 and 77;
  at T_s = 10 they are 0.44, 3.46 and 218; at T_s = 100 they are 0.34, 3.36
  and 321, approaching 333 for the small domain. A dashed horizontal line marks
  an illustrative cap of four epochs, which the small domain crosses at
  T_s ≈ 1.29.
spec:
  type: line
  x: { label: "sampling temperature T_s", scale: log10, format: raw, domain: [1, 100] }
  y: { label: "effective epochs e_i", scale: log10, format: raw }
  variables: { n1: 1.0e12, n2: 1.0e11, n3: 1.0e9, D: 1.0e12, Emax: 4 }
  series:
    - { id: e1, label: "n_1 = 1T tokens", formula: "D*n1^(1/x - 1)/(n1^(1/x) + n2^(1/x) + n3^(1/x))", sample: { from: 1, to: 100, count: 25 } }
    - { id: e2, label: "n_2 = 100B tokens", formula: "D*n2^(1/x - 1)/(n1^(1/x) + n2^(1/x) + n3^(1/x))", sample: { from: 1, to: 100, count: 25 } }
    - { id: e3, label: "n_3 = 1B tokens", formula: "D*n3^(1/x - 1)/(n1^(1/x) + n2^(1/x) + n3^(1/x))", sample: { from: 1, to: 100, count: 25 }, emphasis: true }
    - { id: cap, label: "illustrative cap E_max = 4 (Eq. 9.5)", formula: "Emax", sample: { from: 1, to: 100, count: 2 }, dashed: true }
  annotations:
    - { x: 1, label: "T_s = 1: every e_i = 0.91" }
    - { x: 1.29, label: "small domain passes 4 epochs" }
    - { x: 3.33, label: "α = 0.3: 77 vs 0.61, ratio 126" }
    - { x: 100, label: "limit D/(3·n_3) = 333" }
```

**Epoch cap.** A constraint that bounds repetition directly:

$$
p_i \le \frac{E_{\max}\,n_i}{D} \quad \forall i, \qquad \text{redistribute } \Big(1 - \sum_{i \in \text{capped}} p_i\Big) \text{ over uncapped domains}
$$
*(Eq. 9.5)* where E_max is the maximum effective epochs allowed. PAPER-REPORTED (R9.12): UniMax allocates a character budget uniformly across languages sorted by ascending size, capping each at N epochs of its corpus and redistributing the remainder, and reports the best results with N = 1 "but the effect is small". The water-filling in Eq. 9.5 is the same construction expressed in tokens.

**Repetition of units versus epochs.** e_i is a mean; the ledger also needs r_i^max. With a seeded permutation restarted at every pass, `r_i^max = ⌈e_i⌉` exactly. With independent sampling with replacement from N_i units, the count of a fixed unit after e_i N_i draws is Binomial(e_i N_i, 1/N_i) ≈ Poisson(e_i), and the expected maximum over N_i units grows like `ln N_i / ln ln N_i` for e_i of order 1 — some units are seen many more times than the mean while others are never seen. MATHEMATICALLY-DERIVED (standard balls-in-bins bound). This is why the order rule is part of the policy definition.

> **Assumption.** The weight vector is applied at the token or packed-sequence level with μ_i = 0 unless the artifact says otherwise · *sensitivity:* with document-level draws, Eq. 9.2 must be applied before any epoch computation, and with masked data (templated conversations, [§10.4](../ch10-tokenization-serialization-and-interface-correctness/10-4-conversation-serialization.md)) consumed tokens fall below sampled tokens by μ_i.

## Mechanism

A mixture is executed as a two-level sampler: an outer draw chooses a domain, an inner draw chooses the next unit of that domain. Three properties are required of the outer draw. It must be *exactly proportional* in the long run, so that d_i/D converges to w_i and the ledger can be predicted from the policy; it must be *deterministic given (policy, seed, step)* so that a restart reproduces the stream; and it must be *independent of world size and of the number of loader workers*, so that a run resumed on a different number of accelerators consumes the same stream — the requirement that [§12.5](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md) develops. A pseudo-random categorical draw satisfies the second property but not the first (its per-domain counts fluctuate as √t) and satisfies the third only if the generator is indexed by global step rather than by worker. The integer-credit construction of Algorithm 9.1 satisfies all three: after t draws, the count for domain i differs from t·w_i by less than one.

The inner draw is a seeded permutation of the domain's units, restarted with a new seed at every pass; the pass index is the integer part of e_i and the position inside the permutation is the fractional part, so the pair (pass, position) is the domain's exposure state. Cost of the mechanism: O(k) integer operations per draw, O(k) 64-bit counters of state, no accelerator compute, no communication when every rank derives its own slice of the global stream from the same state — the per-rank slice is `global_index mod world_size`, so the stream is partitioned, not re-sampled. MATHEMATICALLY-DERIVED.

The gap between sampled and consumed tokens arises from three events that the trainer, not the sampler, decides: a batch skipped by a gradient-norm or loss-spike guard ([§20.5](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-5-recovery-interventions.md)), a rollback to an earlier checkpoint that discards steps already counted, and loss masking. The ledger therefore takes a *commit* signal from the training loop after each optimiser step; sampled counters advance at draw time, consumed counters at commit time, and a rollback restores both from the checkpointed `sampler_state.json`. PAPER-REPORTED (R9.7, §3.4): OLMo 2 found training batches with long repeated n-gram sequences at gradient spikes and filtered documents containing 32 or more repeated n-grams of 1–13 tokens, which reduced but did not eliminate spikes — a data-side cause whose accounting consequence is that skipped or rolled-back batches are domain-correlated, so a consumed ledger, not a sampled ledger, is what a mixture comparison must report.

```figure
id: fig-9.8
kind: stat-panel
title: Exposure ledger for one domain
caption: >-
  One row of exposure_report.csv, computed from the definitions of
  available, sampled and consumed tokens. The domain holds 50B tokens and is
  weighted 10% of a 1T-token run. Scroll through three regions: a loss mask
  opens a gap between sampled and consumed; skipped batches concentrated in
  the domain open a larger one; a higher weight turns into silent repetition.
  In every state the sampled row stays at the plan while the consumed row
  moves. Illustrative configuration and rates, not measured.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.1", "DERIVED:alg-9.1"]
alt: >-
  Instrument panel for one domain with n_i = 50B available tokens, weight 10%
  and D = 1T tokens drawn, an illustrative configuration. Rows: available,
  sampled s_i = w_i·D, consumed d_i = (w_i − skipped share)·D·(1 − μ_i),
  effective epochs, epochs from a sampled-only ledger, sampled over consumed,
  maximum unit repetitions under permutation order, skipped share and masked
  share. With μ_i = 10%: 100B sampled, 90B consumed, 1.8 epochs, the sampled
  ledger overstates by 1.11. With 2% of all batches skipped, all from this
  domain: 80B consumed, 1.6 epochs, overstated by 1.25. At weight 40%: 400B
  consumed, 8 epochs, every unit read exactly 8 times under permutation order.
spec:
  header: "EXPOSURE LEDGER · ONE DOMAIN · ILLUSTRATIVE"
  variables: { D: 1.0e12, w: 0.1, n: 5.0e10, sk: 0, mu: 0 }
  rows:
    - { key: "available n_i", formula: "n", format: tokens }
    - { key: "sampled s_i = w_i·D", formula: "w*D", format: tokens }
    - { key: "consumed d_i", formula: "(w - sk)*D*(1 - mu)", format: tokens, note: "retained steps, mask m = 1" }
    - { key: "effective epochs e_i", formula: "(w - sk)*D*(1 - mu)/n", format: fixed2 }
    - { key: "epochs from a sampled ledger", formula: "w*D/n", format: fixed2 }
    - { key: "sampled ÷ consumed", formula: "w/((w - sk)*(1 - mu))", format: ratio }
    - { key: "r_max under permutation order", formula: "ceil((w - sk)*D*(1 - mu)/n)", format: integer, note: "equals ⌈e_i⌉ exactly" }
    - { key: "skipped-batch share, all here", formula: "sk", format: percent }
    - { key: "masked share μ_i", formula: "mu", format: percent }
states:
  - { anchor: mechanism, label: "loss mask μ = 10%", variables: { w: 0.1, sk: 0, mu: 0.1 }, highlight: ["consumed d_i", "effective epochs e_i", "sampled ÷ consumed"], note: "Loss masking alone: 10% of the domain's tokens carry m = 0, so 100B sampled become 90B consumed and e_i falls from 2.0 to 1.8." }
  - { anchor: experimental-design, label: "2% skipped, all in this domain", variables: { w: 0.1, sk: 0.02, mu: 0 }, highlight: ["consumed d_i", "epochs from a sampled ledger", "sampled ÷ consumed"], note: "Experiment 9.1's ablation: 2% of all batches skipped, every one from this 10% domain, removes 20% of its consumed tokens. A sampled ledger overstates exposure 1.25×." }
  - { anchor: failure-modes, label: "w = 40%, silent repetition", variables: { w: 0.4, sk: 0, mu: 0 }, highlight: ["effective epochs e_i", "r_max under permutation order"], note: "Raise the weight to 40% and the 50B pool is consumed 8 times. Permutation order reads every unit exactly 8 times; with-replacement order reads some far more." }
```

## Algorithm

```text
Algorithm 9.1 — Deterministic, resumable weighted sampler with exposure counters
INPUT   policy π = (w[1..k] as rationals with common denominator Q, unit, order rule, seed σ, phase table);
        per-domain unit lists U_i with token lengths; tokenizer id τ_id; global step g; world size W; rank r
OUTPUT  a stream of (domain i, unit index j, pass e) triples, of which rank r consumes those with global index ≡ r (mod W)
STATE   credits c[1..k] ∈ ℤ (initially 0); pass[1..k] ∈ ℕ; pos[1..k] ∈ ℕ; sampled_tokens[1..k];
        consumed_tokens[1..k]; committed_index; policy_hash; σ
INVARIANT after t outer draws, | count_i(t) − t·w_i | < 1 for every i (exact proportionality);
          the triple stream is a pure function of (π, σ, t);
          consumed_tokens[i] ≤ sampled_tokens[i] ≤ pass[i]·n_i + (tokens of units 0..pos[i]−1 in the current permutation)
1.  load (c, pass, pos, sampled_tokens, consumed_tokens, committed_index) from sampler_state.json, or zero-initialise
2.  assert policy_hash == hash(π, τ_id); assert σ matches
3.  for t = committed_index, committed_index+1, …:
4.      phase ← π.phase_at(t); w ← π.weights(phase)                       # weights may change with t (§9.3)
5.      for i in 1..k: c[i] ← c[i] + Q·w[i]                                # integer credit accrual, Σ_i Q·w[i] = Q
6.      i* ← argmax_i c[i]  (ties → lowest index)                           # smooth weighted round-robin
7.      c[i*] ← c[i*] − Q
8.      if pos[i*] == |U_{i*}|: pass[i*] ← pass[i*] + 1; pos[i*] ← 0        # new pass ⇒ new permutation seed
9.      j ← Perm(σ, i*, pass[i*])[pos[i*]]; pos[i*] ← pos[i*] + 1           # Perm: seeded bijection (Feistel or stored shuffle)
10.     sampled_tokens[i*] ← sampled_tokens[i*] + len(U_{i*}[j])
11.     emit (i*, j, pass[i*]) with global index t; rank r consumes it iff t mod W == r
12.     on COMMIT(t') from the training loop (every optimiser step retained):
13.         for each emitted triple with index ≤ t' not yet committed: consumed_tokens[i] += unmasked len; committed_index ← t'+1
14.         write sampler_state.json (atomic rename); append exposure_report.csv row per domain
15.     on ROLLBACK(t''): reload state from the checkpoint at t''; discard emitted triples with index > t''
TERMINATION: when Σ_i consumed_tokens[i] ≥ D_target, or the phase table ends.
```

Complexity: O(k) per draw for steps 5–7 (O(log k) with a heap keyed on credits, at the cost of a less obvious tie rule); O(1) for the permutation lookup with a Feistel bijection or O(|U_i|) storage with a stored shuffle; state size 5k integers plus the seed. Proof sketch of the invariant: credits sum to zero after every draw (Q added in total, Q removed), each credit is bounded in (−Q, Q) because a domain is selected exactly when its credit is maximal and credits sum to zero, and count_i(t) = (Q·w_i·t − c_i)/Q, so |count_i − t w_i| = |c_i|/Q < 1. MATHEMATICALLY-DERIVED. Implementation link: `sampler_state.json` and `exposure_report.csv` in [verification.md](verification.md); the loader that hosts the algorithm is developed in [§12.3](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-3-sampling-and-loading.md), and its restart contract in [§12.5](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md).

```figure
id: fig-9.9
kind: matrix
title: Twelve outer draws of Algorithm 9.1 at w = (1/2, 1/3, 1/6)
caption: >-
  Steps 5–7 of Algorithm 9.1 executed by hand with Q = 6. Every column holds
  exactly one draw, the pattern repeats every six draws because the credits
  return to zero, and at every prefix each domain's count is within one draw
  of t·w_i: after 5 draws the counts are 2, 2, 1 against 2.5, 1.67, 0.83. The
  ringed cell is the tie at t = 3, broken toward the lowest index. A seeded
  categorical draw would give the same long-run shares with √t fluctuations
  and could leave the 1/6 domain absent from the first dozen draws.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:alg-9.1"
alt: >-
  Three-by-twelve matrix: rows are domains with weights 1/2, 1/3 and 1/6,
  columns are outer draws t = 1 to 12, a filled cell marks the domain drawn.
  With Q = 6 the credits after accrual and selection are: t = 1, credits
  (3, 2, 1), draw domain 1, leaving (−3, 2, 1); t = 2, (0, 4, 2), draw 2;
  t = 3, (3, 0, 3), a tie broken toward domain 1; t = 4, (0, 2, 4), draw 3;
  t = 5, (3, 4, −1), draw 2; t = 6, (6, 0, 0), draw 1, leaving (0, 0, 0). The
  sequence 1, 2, 1, 3, 2, 1 then repeats. Domain 1 is drawn at t = 1, 3, 6, 7,
  9, 12; domain 2 at t = 2, 5, 8, 11; domain 3 at t = 4 and 10. Counts stay
  within one of t·w_i at every t.
spec:
  rows: 3
  cols: 12
  pattern: explicit
  cells:
    - [1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1]
    - [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]
    - [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0]
  rowLabel: "domain i"
  colLabel: "outer draw t"
  rowTicks: ["w = 1/2", "w = 1/3", "w = 1/6"]
  colTicks: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
  highlight: [{ row: 0, col: 2 }]
  legend: "filled = domain drawn at t; every prefix within one draw of t·w_i (Q = 6); ring = tie at t = 3"
```

Cost line for the whole mechanism: parameters 0; tokens — none beyond the budget, but repetition r_i^max reported; FLOPs — sampler negligible relative to training; memory capacity — O(k) integers plus O(Σ|U_i|) for stored permutations; memory traffic — one unit read per draw, k·8 bytes of state per checkpoint; communication — none (partitioned stream); latency — one integer argmax per draw; throughput — not a bottleneck; energy and money — NOT-DISCLOSED for any production loader.

## Implementation

Tensors → operators: the sampler emits unit indices; packing turns units into `[B, T]` id tensors with a loss mask `[B, T]` ([§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md)); the per-domain token counts of a packed batch are what the ledger records, not the unit counts. Framework: any loader that can carry state. Named reference-stack systems, each with its §4.1 layer:

- **MosaicML LLM Foundry** (Distributed training) trains on StreamingDataset. OFFICIAL-DOCUMENTATION (R9.33): each `Stream` takes one of `proportion` ("how to sample this Stream relative to other Streams"), `repeat` (a stream with `repeat=3` appears three times per epoch; values below 1 downsample) or `choose` (a fixed number of samples per epoch); `epoch_size` defaults to the total unique samples across streams and, if set, proportions apply to it; `batching_method` is `random` (mixing respected in expectation), `stratified` ("every global batch respects dataset mixing exactly"), `per_stream` or `device_per_stream`. OFFICIAL-DOCUMENTATION (R9.34): `StreamingDataLoader.state_dict()` / `load_state_dict()` give "immediate and deterministic resumption in the middle of an epoch by being stateful". The `repeat` parameter is the effective-epochs quantity e_i set directly; `proportion` sets w_i and leaves e_i implied by `epoch_size`. The repository README confirms conversion "to StreamingDataset format" and launch via `composer train/train.py` (OFFICIAL-DOCUMENTATION, R9.38).
- **Megatron-LM** (Distributed training). OFFICIAL-DOCUMENTATION (R9.36): `IndexedDataset` stores documents in a `.bin` data file with a `.idx` metadata file; `GPTDataset` builds a document index, a sample index and a shuffle index from a seed; `BlendedDataset` "will draw samples from contributing datasets in proportion to the weights until achieving a composite dataset of the desired size" through a dataset index and a dataset sample index, with caches keyed by a hash of the build inputs. This is a materialised, precomputed form of Algorithm 9.1: the blend indices are the full emitted stream, so resumption is an integer offset. What the readme does not state, and this chapter carries as NOT-DISCLOSED, is whether the blend is exactly proportional or stochastic per draw.
- **TorchTitan** (Distributed training). OFFICIAL-DOCUMENTATION (R9.37): "checkpointable data-loading, with the C4 dataset pre-configured" and distributed checkpointing that includes dataloader state; multi-source mixing is not described on the pages opened (NOT-DISCLOSED).
- **PyTorch** (Model / autograd framework): the Hugging Face `datasets` documentation (R9.35) names `torchdata`'s `StatefulDataLoader` as the loader that saves and restores an `IterableDataset`'s `state_dict` — the shard and in-shard example index — and warns that shuffle-buffer contents are lost on resume. The same page documents `interleave_datasets(..., probabilities=…, seed=…)` with `stopping_strategy` ∈ {`first_exhausted` (subsampling), `all_exhausted` (oversampling: an exhausted dataset restarts), `all_exhausted_without_replacement`}: the three stopping strategies are three different epoch policies, and only the third guarantees e_i ≤ 1 for every i. OFFICIAL-DOCUMENTATION (R9.35, `datasets` v4.8.4 pages).

Kernels, memory and communication: none specific. Deployment: the policy file and the state file are checkpointed with the model ([§19.4](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-4-training-state-transitions.md)).

> **Implementation note [impl.mosaicml-llm-foundry · Streaming docs "stable", accessed 2026-09-20; version string not shown on the page].** `proportion`, `repeat` and `choose` are mutually exclusive per stream, and `epoch_size` changes what a proportion means; a policy file must record which of the three was used and the `epoch_size`, or its epochs cannot be recovered.

## Experimental design

### Experiment 9.1 — Exposure equivalence across sampling units and temperatures

- **Hypothesis.** Two policies that produce the same per-domain consumed tokens and the same r_i^max — one expressed as document weights u_i, the other as the token weights of Eq. 9.2, and a third as a temperature T_s that reproduces the same e_i via Eq. 9.4 — yield models that differ by no more than seed noise on every evaluation; a policy with the same nominal weights but a different unit yields a measurable difference.
- **Setup.** Four domains from open pools with mean unit lengths spanning at least 10× (web, code, papers, encyclopaedia); a model in the 400M–1B range; D fixed at the 1× Chinchilla multiple for the size (the DCLM scale convention: tokens = 20 × parameters × multiplier, PAPER-REPORTED, P07, Table 1).
- **Independent variables.** Policy family ∈ {document-weighted, token-weighted matched by Eq. 9.2, temperature-matched by Eq. 9.4, document-weighted with the *token* weights misapplied as unit weights}; order rule ∈ {permutation, with replacement}.
- **Controlled variables.** Tokenizer, pools, filter ledger, model, optimiser, schedule, sequence length, packing, seeds (3 per arm), evaluator.
- **Dataset / workload.** The four pools; held-out per-domain validation; a fifth held-out domain never sampled.
- **Hardware.** Any; the comparison is at equal tokens and, at fixed T, equal FLOPs.
- **Metrics.** Per-domain validation loss (token-mean, [§4.1](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md)); the exposure ledger; paired seed differences ([§2.5](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md)).
- **Baselines.** Concatenate-and-shuffle (T_s = 1).
- **Expected result.** The three exposure-matched arms are indistinguishable within seed variance; the misapplied-unit arm differs on the long-document domains in the direction predicted by Eq. 9.2; with-replacement ordering shows a wider spread of unit repetition counts and, if e_i > 1 for any domain, higher loss on that domain than permutation ordering at equal consumed tokens.
- **Ablation.** Remove the ledger's commit signal (count sampled instead of consumed) and introduce 2% skipped batches concentrated in one domain; the reported weights then misstate exposure by a predictable amount.
- **Interpretation.** Support for the section's central claim that exposure, not nominal weight, is the causal variable.
- **Threats to validity.** Small models may be insensitive to ordering; domain-correlated skips are a proposal, not an observed rate; the held-out domain choice affects sensitivity.

## Observations

**What the paper claims.** PAPER-REPORTED (P03): The Pile assigns per-component epochs, with high-quality components up-weighted "following Brown et al. 2020" and Wikipedia seen up to three times. PAPER-REPORTED (R9.11): mT5 chose α = 0.3 after ablations at α = 0.2 and 0.7 both scoring lower on XNLI zero-shot for mT5-Large (80.7 versus 81.1). PAPER-REPORTED (R9.12): UniMax's epoch cap outperformed temperature sampling at τ = 3.33 and τ = 1 across the Large-to-XXL scales tested, with overfitting on tail languages emerging only at the larger scales. OFFICIAL-DOCUMENTATION (R9.33, R9.35, R9.36): the three loaders expose weights, repeats and stopping strategies as described above.

**What the evidence shows.** The algebra of Eq. 9.1–9.5 is exact. The claim that exposure rather than nominal weight is causal is supported indirectly — UniMax's result is a comparison between two policies that differ precisely in their repetition profile at equal budget — but no paper opened for this chapter ran the unit-matching comparison of Experiment 9.1; that experiment is a proposal.

**What we infer.** DERIVED: any published mixture without a stated unit, tokenizer and epoch policy is under-specified by a factor that Eq. 9.2 and Eq. 9.4 bound but cannot resolve; two groups implementing "the same" weights can differ by the ratio of mean document lengths in per-domain exposure. DERIVED: exact-proportional sampling removes the √t fluctuation of categorical sampling, which for small domains at small t is the difference between a domain being present or absent in the early phase.

**What remains unknown.** NOT-DISCLOSED: the sampling unit and the epoch policy of most frontier models. UNVERIFIED: whether Megatron-LM's blend is exactly proportional. UNVERIFIED: the numerical behaviour of Algorithm 9.1 in any implementation.

## Failure modes

> **Failure mode — unit/weight mismatch.** *Symptom:* per-domain consumed tokens differ from w_i·D by a factor that is constant per domain. *Cause:* token weights applied as document weights or the reverse. *Detection:* compare `exposure_report.csv` against Eq. 9.1 after the first 1% of steps. *Mitigation:* record `weight_kind` in the policy and apply Eq. 9.2 explicitly.

> **Failure mode — silent repetition.** *Symptom:* a small domain's validation loss falls faster than others early and rises later. *Cause:* temperature or proportion implies e_i ≫ 1 without a cap. *Detection:* e_i in the ledger exceeds the plan; r_i^max ≫ ⌈e_i⌉ under with-replacement order. *Mitigation:* Eq. 9.5 cap; permutation order.

> **Failure mode — sampled ≠ consumed.** *Symptom:* a mixture comparison shows an effect that vanishes when re-run without loss-spike skipping. *Cause:* skipped or rolled-back batches are domain-correlated. *Detection:* sampled and consumed columns diverge by more than the loss-mask fraction. *Mitigation:* commit-time counting (Algorithm 9.1, lines 12–15).

> **Failure mode — resume drift.** *Symptom:* a resumed run re-consumes units already counted or skips a range. *Cause:* loader state not checkpointed, or shuffle-buffer contents lost on resume (documented for iterable datasets, R9.35). *Detection:* ledger discontinuity at the restart step. *Mitigation:* state-carrying loaders; stateless permutation indexing.

> **Failure mode — world-size-dependent order.** *Symptom:* two runs with identical policy and seed but different accelerator counts consume different streams. *Cause:* per-worker generators. *Detection:* hash the first 10⁴ emitted triples at two world sizes. *Mitigation:* global-index partitioning (Algorithm 9.1, line 11).

## Siblings

**Size-proportional sampling (T_s = 1, concatenate-and-shuffle)** — this file, baseline
Why it exists: no decision to make. What assumption changed (relative to a weighted mixture): none — it is the reference. What objective changed: none. What problem it solved: reproducibility by construction. What new failure mode it introduced: mixture drift with every filter change; scarce domains under-represented. Changed primitive: none.

**Temperature sampling** — this file, Eq. 9.3
Why it exists: scarce domains would otherwise be nearly absent. What assumption changed: the value of a domain is not proportional to its size. What objective changed: none; the sampling distribution changed. What problem it solved: tail-domain presence with one parameter. What new failure mode it introduced: uncontrolled repetition of the smallest domains (Eq. 9.4). Changed primitive: n_i → n_i^{1/T_s}.

**Epoch-capped allocation (UniMax-style)** — this file, Eq. 9.5; multilingual use in [§9.5](09-5-multilingual-and-specialist-mixtures.md)
Why it exists: temperature sampling overfits tail languages at scale (R9.12). What assumption changed: repetition, not share, is the quantity to bound. What objective changed: uniform coverage subject to e_i ≤ E_max. What problem it solved: tail overfitting. What new failure mode it introduced: head domains absorb the redistributed budget and the mixture becomes budget-dependent. Changed primitive: a weight vector → a budget allocation with caps.

**Learned weights** — [§9.4](09-4-learned-mixture-selection.md)
Why it exists: hand-set temperatures encode no information about domain interactions. What assumption changed: a proxy run's signal predicts the large run's outcome. What objective changed: a proxy objective (excess loss, gradient alignment, regression target). What problem it solved: replaces intuition with an optimisation. What new failure mode it introduced: selection leakage and unverified transfer. Changed primitive: a fixed w → w = argmin of a proxy objective.

**Time-indexed policy (curriculum)** — [§9.3](09-3-curriculum-design.md)
Why it exists: the same exposure at different training positions is not equivalent under a decaying learning rate. What assumption changed: w may depend on t. What objective changed: none. What problem it solved: scarce high-quality tokens placed where they act most. What new failure mode it introduced: confounding with the schedule. Changed primitive: w → w(t).

## Extensions

Domain adaptation ([§22.2](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-2-distribution-transitions.md)) reuses the same policy object with a second phase whose pools include the previous mixture as a replay domain. Long context changes the sampling unit — a packed 32K sequence drawn from a long-document bucket is a different unit from a 4K sequence — so the ledger must be per (domain, length bucket) ([§9.3](09-3-curriculum-design.md)). Multimodal mixtures need a per-modality token definition before Eq. 9.1 applies; the chapter's ledger schema carries `tokenizer_id` per domain for that reason (proposal). Agent trajectories ([§11.5](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md)) have large μ_i, so the sampled/consumed distinction is material.

## Limitations

The formulation assumes fixed pools; if pools grow during a run (fresh crawls), n_i is time-dependent and e_i must be defined against the pool at the time of consumption. The exact-proportionality invariant holds for the outer draw; when units have unequal token lengths, per-domain *token* shares still fluctuate by up to one unit length per draw, which is negligible at scale but must be reported for small pools. Falsification: if Experiment 9.1's exposure-matched arms differ beyond seed noise, then something other than exposure — most plausibly the sequence-position distribution of units inside packed sequences — is causal, and the policy definition would need a packing rule.

## Reproducibility

Policy hash over (weights as rationals, unit, order rule, T_s, E_max, phase table, tokenizer hash); seed; Algorithm 9.1 state; the loader and its version (Streaming docs "stable" and `datasets` v4.8.4 pages as opened, R9.33–R9.35; Megatron-LM datasets readme as opened, R9.36; TorchTitan README as opened, R9.37). Unresolved: no implementation of Algorithm 9.1 has been executed for this edition (UNVERIFIED).

## References

P03 · P07 · R9.7 · R9.11 · R9.12 · R9.33 · R9.34 · R9.35 · R9.36 · R9.37 · R9.38 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
