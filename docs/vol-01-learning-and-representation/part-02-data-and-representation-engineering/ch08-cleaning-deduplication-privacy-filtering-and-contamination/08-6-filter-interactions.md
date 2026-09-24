---
id: ms.section.8.6
entity_type: section
title: Filter interactions
short_title: Filter interactions
volume: 1
part: 2
chapter: 8
section: 8.6
slug: 08-6-filter-interactions
parent: ms.chapter.8
prev_sibling: ms.section.8.5
next_sibling: ms.verification.8
children: []
prerequisites: [ms.section.8.1, ms.section.8.2, ms.section.8.3, ms.section.8.4, ms.section.8.5, ms.section.6.3, ms.section.2.5]
downstream: [ms.section.9.2, ms.section.9.4, ms.section.12.2, ms.section.21.5, ms.section.61.4, ms.section.65.2]
related: [ms.section.6.4, ms.section.12.6]
siblings_by_mechanism: [ms.section.6.3, ms.section.9.2]
relations:
  - {type: supported_by, target: paper.P06}
  - {type: supported_by, target: paper.P07}
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P04}
  - {type: evaluated_by, target: experiment.8.6}
  - {type: trades_off_with, target: ms.section.9.2}
  - {type: implemented_by, target: impl.nanotron}
axes:
  lifecycle: [data, evaluation, assurance]
  mechanism: [filter_composition, filter_ordering, bias_audit, data_poisoning, matched_budget_ablation]
  feedback_setting: []
  modality: [text, code]
papers: [P04, P05, P06, P07]
implementations: [impl.nanotron, impl.pytorch, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: [dataset.fineweb, dataset.fineweb-edu, dataset.dclm-baseline, dataset.dolma, dataset.c4]
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, KNOWN, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2600
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 8.6 Filter interactions

## Scope

Objective: treat the filters of §8.1–§8.5 as one composed operator and state when their order changes the retained corpus, when it changes only the cost and the ledger's attribution, how per-stage biases against a language, dialect or domain compound along the chain, how an adversary exploits the chain, and what a matched-token ablation must look like to decide any of this. Baseline: the one-filter-at-a-time validation of P06 and P07, in which each stage is ablated on top of a fixed predecessor chain. Success criterion: for any pipeline the reader can classify every stage pair as commuting or not, estimate the ordering effect of the non-commuting pairs on a sample, compute per-group retention through the chain with an interval, and size an ablation that can resolve the effect. Boundaries: the design vocabulary of factorial comparisons and interaction effects is owned by [§6.3](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md); seed variance by [§6.4](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md); re-weighting of what survives by [§9.2](../ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md); distributed execution of the chain by [§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md); poisoning as a model-level threat by [§65.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-2-training-model-attacks.md).

## Why this exists

What failed before was validating filters one at a time and describing the pipeline as the list of its stages. Each rule set of §8.2 was published with its own removal fraction, but the pipeline that ran it was a chain, and the chain's output is not the conjunction of those descriptions. Three reported cases make the gap concrete. Nemotron-CC measured that the heuristic filters of a conventional pipeline "removes a non-trivial portion of high-quality tokens (-18.1%)" as judged by the FineWeb-Edu classifier, and that applying the heuristics only to documents the classifiers had placed in low-quality buckets raised MMLU from 55.5 to 57.5 for 8B-parameter models trained on 1T tokens (R8.38 §2.1, Table 7, PAPER-REPORTED). Longpre et al. found that "toxicity and quality are not well-aligned": documents classified as highly toxic scored *higher* on the PaLM-style quality classifier, and "there are substantial interactions between curation choices" (R8.33 §3, PAPER-REPORTED). Lucy et al. found that a Wikipedia-perplexity quality filter "behaves like fastText langID (rs = 0.860)" across topical clusters, and wrote that they "study the effects of filters in isolation, but acknowledge that in practice, data curation steps are layered and combined" (R8.35 §4.1, §7, PAPER-REPORTED). The bottleneck is attribution: a ledger row says what a stage removed *given its predecessors*, so the same stage looks more or less valuable depending on where it sits. The dominant constraint is combinatorial and statistical at once — K stages have 2^K presence patterns and K! orders, while a matched-token run at the 1B scale has seed noise that DataDecide reports "can be as high as 2% points of accuracy for some recipes on most tasks" (R8.37 §2.1, PAPER-REPORTED). What changed is that recent pipelines condition later stages on earlier scores (R8.38's bucketing; R8.12's rehydration), that small-scale ranking studies now quantify how often an ablation picks the right winner (R8.37), and that poisoning results show the adversary needs a near-constant *count* of surviving documents, not a fraction (R8.39). This section formalises the composition, derives which orders matter, and specifies the ablation.

```figure
id: fig-8.30
kind: stat-panel
title: Reported cases where filters interact
caption: >-
  Each row is one paper's measurement, not a law. Read the first two rows together:
  a heuristic chain removed high-quality tokens that a classifier would have kept, and
  reordering the two stages recovered MMLU. The noise rows set the scale an ablation must
  resolve. The last row is why chain recall on adversarial documents, not the fraction
  removed, is the security quantity.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: [R8.38, R8.33, R8.35, R8.37, R8.39]
alt: >-
  Instrument panel of reported values. Nemotron-CC (R8.38): heuristic filters removed
  18.1% of classifier-judged high-quality tokens (127B to 104B on 13 snapshots with
  jusText); 8B models on 1T tokens scored MMLU 55.5 with jusText unfiltered and 57.5 when
  heuristics were applied only to low-quality data. Longpre et al. (R8.33): the quality
  filter at threshold 0.7 kept 46% of C4 and changed Books QA by minus 6.7 points. AboutMe
  (R8.35): pages associated with Eastern Asia were 2.4 times more likely than Northern
  Europe to be removed by CLD2. DataDecide (R8.37): seed standard deviation up to 2 points
  at 1B for some recipes; about 80% of pairwise decisions correct from 150M. Souly et al.
  (R8.39): 250 poisoned documents backdoored 600M to 13B models, 0.00016% of the 13B
  model's training tokens.
spec:
  header: "FILTER INTERACTIONS · REPORTED"
  rows:
    - { key: "HQ tokens lost to heuristics", value: "-18.1% (127B to 104B)", note: "R8.38, FineWeb-Edu-judged HQ" }
    - { key: "MMLU, heuristics on LQ only", value: "55.5 to 57.5", note: "R8.38, 8B params, 1T tokens" }
    - { key: "quality filter T = 0.7, C4 kept", value: "46%", note: "R8.33, PaLM-style classifier" }
    - { key: "Books QA at T = 0.7", value: "-6.7 points", note: "R8.33, 1.5B model" }
    - { key: "CLD2 removal, E. Asia vs N. Europe", value: "2.4x", note: "R8.35, English web pages" }
    - { key: "seed std at 1B, some recipes", value: "up to 2 points", note: "R8.37" }
    - { key: "pairwise decisions right from 150M", value: "about 80%", note: "R8.37, target 1B" }
    - { key: "poisons for a DoS backdoor", value: "250 documents", note: "R8.39, 600M to 13B" }
```

## Intuition

Physically, a pipeline is a cascade of sieves over bytes. Every stage has a cost per unit it inspects and a pass fraction, so its position fixes how many bytes it must read; every stage also has a type that fixes whether its position can change the output. A stateless per-document test — a language score threshold, a word-count rule, a classifier with a fixed threshold — keeps a document or not by looking at that document alone, and a conjunction of such tests is the same set in any order: moving them changes only the bill and the ledger's bookkeeping. Three kinds of stage break that symmetry. A *transform* edits the text (line removal, redaction, span cuts), so every later statistic is computed on different bytes. A *population* stage decides by looking at other documents (deduplication keeps one member of a cluster; a top-p threshold is a quantile of the current pool; a Bloom filter keeps the first occurrence it sees), so removing documents earlier changes its decision about the rest. And any stage whose threshold was tuned on a majority distribution removes a minority group at a different rate, and those rates multiply. Heuristically one says "the filters stack"; the physical statement is that the retained distribution equals p(x)·Π_k a_k(x) only for stateless predicates, and everything else in this section is the correction for the stages that are not.

## Formulation

Let X be a finite multiset of records drawn from p, and let a pipeline be a sequence of stages f_1, …, f_K, each mapping a record set (with its ledger) to a record set. Every stage in the stage contract ([verification.md](verification.md) §1) declares one of three types:

- **predicate** (type P): f(X) = {x ∈ X : g(x) = 1} with g depending on x alone (language identification, rule filters, a classifier at a fixed threshold τ, URL blocklists);
- **transform** (type T): f(X) = {t(x) : x ∈ X, t(x) ≠ ∅}, where t edits content (line rules, encoding repair, Unicode normalisation, PII redaction, exact-substring cuts, windowed decontamination);
- **population** (type S): the decision on x depends on X (near-duplicate clustering with a representative policy, a top-p threshold τ_p = Q_s(1 − p) computed on the current pool, a Bloom filter that keeps first occurrences, per-cluster rehydration weights).

> **Definition — filter ordering effect.** For two stages f and h applied to the same input X, the pair (set effect, attribution effect): the set effect is the difference between the retained corpora h(f(X)) and f(h(X)) — reported as the Jaccard distance of the two retained sets or the difference of their per-group token shares — and the attribution effect is the difference between the conditional removal rates the ledger records for each stage in the two orders.

> **Definition — rare-data loss.** For a group g of records (a language, dialect, region, register or domain) and a validity label v(x) ∈ {0, 1} assigned by an audit, the fraction of valid g-records the chain removes, 1 − R_g^{valid}, in excess of the same fraction for a stated reference group.

For predicates with indicator functions g_k, the chain keeps x if and only if every g_k(x) = 1:

$$
\text{keep}(x) = \prod_{k=1}^{K} g_k(x), \qquad \sigma_{\text{chain}} = \mathbb{E}_{x\sim p}\Big[\prod_{k=1}^{K} g_k(x)\Big], \qquad \sigma_{k\mid<k} = \frac{\mathbb{E}\big[\prod_{j\le k} g_j(x)\big]}{\mathbb{E}\big[\prod_{j<k} g_j(x)\big]}
$$
*(Eq. 8.16)* where σ_chain = selection rate of the whole chain (the §8.2 quantity, Eq. 8.3, for a composite filter); σ_{k|<k} = the conditional pass rate the ledger records for stage k in its position; the product is over stages in execution order.

> **Proposition 8.1 (commutation).** (i) If f_j and f_k are both predicates, f_j∘f_k = f_k∘f_j on every input set; the set effect is zero. (ii) The attribution effect between two predicates is zero in every order if the g_k are mutually independent under p, in which case σ_{k|<k} = σ_k; under dependence σ_{k|<k} varies with position. (iii) A transform t_j and a predicate g_k commute if g_k does not read any field t_j writes. (iv) A population stage commutes with a predicate only if, for every cluster or quantile it forms, the predicate passes all or none of the members involved.

*Proof sketch.* (i) The kept set is {x : g_j(x)g_k(x) = 1}, symmetric in j and k. (ii) Under independence E[Π_{j≤k} g_j] = Π_{j≤k} σ_j, so each conditional rate equals its marginal whatever the order; any dependence makes E[g_k Π_{j<k} g_j] ≠ σ_k E[Π_{j<k} g_j] for some order. (iii) g_k(t_j(x)) = g_k(x) when g_k's inputs are unchanged by t_j. (iv) is shown for deduplication in Eq. 8.17 and holds for quantiles because τ_p is a function of the pool that the predicate changes. MATHEMATICALLY-DERIVED.

Consequence for the ledger: when two predicates are correlated — R8.33's toxicity and quality scores, R8.35's perplexity and language scores — the removal fraction reported for "the quality filter" is a property of its position, and two pipelines with the same stages in different orders will publish different per-stage tables for the same retained corpus. PAPER-REPORTED (P05 §5.4): Dolma runs paragraph deduplication last because it "risks disrupting content analysis", an explicit ordering decision driven by the transform rule (iii).

The central non-commuting pair is near-duplicate removal (type S, §8.3) against a quality predicate g (type P, §8.2). Let cluster c have m_c members of which m_c^+ pass g, and let the representative be chosen uniformly at random, the policy of P04 and P06:

$$
P_{D\to Q}\big[c \text{ survives}\big] = \frac{m_c^{+}}{m_c}, \qquad P_{Q\to D}\big[c \text{ survives}\big] = \mathbb{1}\big[m_c^{+}\ge 1\big], \qquad \Delta_{\text{set}} = \sum_{c}\Big(\mathbb{1}\big[m_c^{+}\ge 1\big] - \frac{m_c^{+}}{m_c}\Big) \ge 0
$$
*(Eq. 8.17)* where D→Q = deduplicate then filter, Q→D = filter then deduplicate; Δ_set = expected number of clusters kept by Q→D and lost by D→Q; only *straddling* clusters, 0 < m_c^+ < m_c, contribute.

Two limits bracket the effect. If members' scores are identical — exact duplicates, or near-duplicates whose differing bytes the classifier ignores — m_c^+ ∈ {0, m_c}, both orders keep a fraction a of clusters and Δ_set = 0. If members pass independently with probability a, D→Q keeps a fraction a of clusters and Q→D keeps 1 − (1 − a)^{m_c}; at m_c = 10 and a = 0.3 that is 0.30 against 0.97 (MATHEMATICALLY-DERIVED). Real clusters lie between, and the fraction of straddling clusters is estimable on a sample (Algorithm 8.12). The survivor's distribution conditional on survival is the same in both orders (uniform over passing members), so the ordering effect is a *yield* effect: Q→D keeps more clusters and scores m_c documents per cluster instead of one.

```figure
id: fig-8.31
kind: calculator
title: Clusters surviving deduplication and a quality filter in either order
caption: >-
  Eq. 8.17 for a pool of clusters of equal size m, a fraction f of which have
  independently scored members while the rest have identical scores. Scroll: with every
  cluster straddling the threshold the two orders differ by a factor of three; at a
  realistic straddling fraction the gap is thirteen points of cluster survival; with exact
  duplicates it vanishes and only the scoring cost differs. The cost ratio assumes every
  document belongs to a cluster of size m. Illustrative configuration, not a named corpus.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-8.17"
alt: >-
  Calculator for Eq. 8.17 with inputs cluster size m, member pass probability a, fraction
  f of clusters whose members are scored independently, and number of clusters C. Outputs:
  cluster survival for deduplicate-then-filter equals a; for filter-then-deduplicate it is
  (1 − f)·a + f·(1 − (1 − a)^m); the extra clusters kept by filter-first; and the ratio of
  documents scored, 1/m. At m = 10, a = 0.3, f = 1 and C = 100 million: 30% against 97.2%,
  about 67 million extra clusters. At f = 0.2: 30% against 43.4%, 13.4 million extra. At
  f = 0: both 30%, no extra clusters, and deduplicating first scores one tenth of the documents.
spec:
  tex: >-
    P_{D\to Q} = a,\qquad P_{Q\to D} = (1-f)\,a + f\,\big(1-(1-a)^{m}\big)
  equation: "8.17"
  inputs:
    - { symbol: m, label: "cluster size m", default: 10, min: 2, max: 1000, scale: log10, format: integer }
    - { symbol: a, label: "member pass probability a", default: 0.3, min: 0.01, max: 0.99, format: percent }
    - { symbol: f, label: "straddling-capable clusters f", default: 0.2, min: 0, max: 1, format: percent }
    - { symbol: C, label: "clusters C", default: 1.0e8, min: 1000, max: 1.0e10, scale: log10, format: integer }
  outputs:
    - { symbol: sDQ, label: "survival, dedup then filter", formula: "a", format: percent }
    - { symbol: sQD, label: "survival, filter then dedup", formula: "(1 - f)*a + f*(1 - (1 - a)^m)", format: percent, emphasis: true }
    - { symbol: dC, label: "extra clusters kept by filter-first", formula: "C*(sQD - sDQ)", format: integer }
    - { symbol: cost, label: "documents scored, dedup-first / filter-first", formula: "1/m", format: ratio }
states:
  - { anchor: formulation, label: "independent members, f = 1", variables: { m: 10, a: 0.3, f: 1 }, highlight: [sDQ, sQD], note: "Upper bound: every cluster straddles. Deduplicating first keeps 30% of clusters, filtering first keeps 97.2%: the order triples the yield of the same two stages." }
  - { anchor: mechanism, label: "f = 0.2", variables: { m: 10, a: 0.3, f: 0.2 }, highlight: [sQD, dC], note: "One cluster in five straddles the threshold: 43.4% against 30%, 13.4 million extra clusters per 100 million. The ledger must say which order produced the corpus." }
  - { anchor: failure-modes, label: "exact duplicates, f = 0", variables: { m: 10, a: 0.3, f: 0 }, highlight: [sQD, cost], note: "Identical scores inside every cluster: both orders keep 30%. The only difference left is cost, and deduplicating first scores one document in ten." }
```

For a percentile threshold the population effect is direct: τ_p computed after deduplication is the (1 − p)-quantile of a different score distribution. PAPER-REPORTED (P06 §3.4): on the 2013-48 snapshot, the data kept by global deduplication was of worse quality than the data it removed, so a top-p threshold computed after that deduplication would sit lower — admitting documents that the same p would have rejected before it (DERIVED). The stage contract must therefore record both τ and the pool on which it was computed.

**Cost-optimal order among commuting predicates.** When stages commute, order is a pure cost decision. Let c_k be stage k's cost per inspected record and σ_k its pass fraction, with pass decisions independent:

$$
\mathbb{E}[\text{cost}_\pi] = \sum_{i=1}^{K} c_{\pi(i)} \prod_{j<i} \sigma_{\pi(j)}, \qquad \pi^\star \text{ sorts stages by } r_k = \frac{c_k}{1-\sigma_k} \text{ ascending}
$$
*(Eq. 8.18)* where π = execution order; r_k = cost per unit of removal; with dependent decisions, σ_k is replaced by the conditional rates of Eq. 8.16 and the sort becomes a heuristic that must be re-checked against the ledger.

<details><summary>Derivation of Eq. 8.18</summary>
Consider two adjacent stages k and l at any position, reached by a fraction P of records. Running k first costs P(c_k + σ_k c_l); running l first costs P(c_l + σ_l c_k). The first is no larger iff c_k(1 − σ_l) ≤ c_l(1 − σ_k), i.e. iff c_k/(1 − σ_k) ≤ c_l/(1 − σ_l). No other term of the sum changes under the swap, because the fraction reaching every later stage is P·σ_k·σ_l in both orders. Any order not sorted by r contains an adjacent inversion whose swap does not increase cost, so the sorted order is optimal. MATHEMATICALLY-DERIVED under independence; the exchange argument fails when σ_l depends on whether k ran first.
</details>

Illustrative (DERIVED, ASSUMED costs): a stage costing 1 unit per record with pass fraction 0.4 has r = 1.7; a stage costing 50 units with pass fraction 0.1 has r = 55.6; the cheap stage first costs 1 + 0.4·50 = 21 units per input record, the expensive stage first 50 + 0.1·1 = 50.1, for the identical retained set. This is the formal reason language identification runs first in every reference pipeline: at about 1 ms of CPU per document (R8.2's rate, §8.1) and a removal of 61.7 % of bytes in Dolma (P05, PAPER-REPORTED) its r is the smallest of any stage.

> **Assumption.** Scores of a stage are not changed by predicates that ran before it · *sensitivity:* holds for predicates by definition; fails for transforms (rule iii), so a cost-sorted order may silently move a transform past a statistic that reads its output — Algorithm 8.11 therefore sorts only within blocks of mutually commuting predicates.

**Per-group retention.** Let the input be partitioned into groups g with prior π_g, and let σ_{k|g,<k} be stage k's conditional pass rate on group g in its position. The chain retention of g, its share after the chain, and its retention relative to a reference group are

$$
R_g = \prod_{k=1}^{K} \sigma_{k\mid g,<k}, \qquad \pi'_g = \frac{\pi_g R_g}{\sum_h \pi_h R_h}, \qquad \kappa_g = \frac{R_g}{R_{\text{ref}}} = \prod_{k=1}^{K} \frac{\sigma_{k\mid g,<k}}{\sigma_{k\mid \text{ref},<k}}
$$
*(Eq. 8.19)* where κ_g = relative retention; each factor of the last product is one stage's relative pass rate, measured on the ledger; rare-data loss is 1 − R_g evaluated on audited-valid records only.

The product form is the compounding mechanism: five stages that each keep group g at 0.9 of the reference rate give κ_g = 0.9⁵ = 0.59; ten give 0.35 (MATHEMATICALLY-DERIVED). With π_g = 0.02, R_ref = 0.3 and κ_g = 0.59, the group's share falls from 2.0 % to 1.2 % (DERIVED, illustrative).

The adversarial counterpart concerns documents crafted to survive. Let a_k be stage k's pass probability for the adversary's documents and n_⋆ the number of surviving documents an attack needs:

$$
n_{\text{surv}} = n_{\text{inj}}\,A,\quad A=\prod_{k=1}^{K} a_k, \qquad n_{\text{inj}} = \frac{n_\star}{A}, \qquad s_{\text{post}} = s_{\text{pre}}\,\frac{A}{\sigma_{\text{chain}}}, \qquad \bar d = (n_\star - 1)\,\Big(1-\big(1-J^{\,r}\big)^{b}\Big)
$$
*(Eq. 8.20)* where A = chain pass probability for the adversary's documents; n_inj = documents the adversary must place in the crawl; s_pre, s_post = the adversary's share of records before and after the chain, σ_chain being the chain's pass rate on everything else (Eq. 8.16); d̄ = expected number of MinHash candidate edges per surviving poison when the variants have pairwise Jaccard similarity J under b bands of r rows (Eq. 8.8); a component forms among the variants when d̄ exceeds 1.

Decisions about stages are made by matched-token ablations. Let each arm be trained with n seeds and let σ_a be the seed-effect standard deviation of Eq. 6.9 ([§6.4](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md)) for the aggregate score. For a true difference δ between two pipeline configurations,

$$
\mathrm{SE}(\hat\Delta) = \sigma_a\sqrt{2/n}, \qquad P\big[\operatorname{sign}\hat\Delta = \operatorname{sign}\delta\big] = \Phi\!\left(\frac{|\delta|}{\sigma_a}\sqrt{\frac{n}{2}}\right), \qquad n_{\text{req}} = \left\lceil \frac{2\,\sigma_a^{2}\,z_{1-\gamma}^{2}}{\delta^{2}} \right\rceil
$$
*(Eq. 8.21)* where Φ = standard-normal CDF; γ = tolerated probability of choosing the wrong configuration; the form is Eq. 2.23 of [§2.5](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md) written for a sign decision, with σ_d² = 2σ_a² for unpaired seeds; seeds that share data order and initialisation across arms lower σ_d.

> **Assumption.** Seed effects are normal and the same in both arms · *sensitivity:* with two seeds per arm the normal quantile understates the interval (t with two degrees of freedom has a 97.5 % quantile of 4.30, not 1.96), so Eq. 8.21 is optimistic at n = 2.

## Mechanism

**Where order matters: the stage algebra.** Proposition 8.1 classifies every pair of the stages in §8.1–§8.5. Language identification, document-level rules and a fixed-threshold classifier are predicates and commute with each other. Line rules, encoding repair, Unicode normalisation, PII redaction, exact-substring cuts and windowed decontamination are transforms, and they do not commute with any stage that reads what they write — which is almost every later statistic. MinHash clustering, exact-substring detection (a span is duplicate only relative to the corpus), top-p thresholds and the document-frequency cap of Algorithm 8.9 are population stages. Figure 8.32 is the resulting classification; its structure is DERIVED from the stage types, not measured.

```figure
id: fig-8.32
kind: matrix
title: Which stage pairs can change the retained corpus when swapped
caption: >-
  Rows and columns are the stages of §8.1–§8.5. Dark cells are pairs whose order changes
  the retained set in general (a transform or population stage is involved); mid cells change
  it only for records near a threshold or containing the edited spans; empty cells commute
  exactly. The empty block in the upper left is why language identification, document rules
  and fixed-threshold classifiers can be reordered for cost alone (Eq. 8.18). This is the
  book's classification by Proposition 8.1.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-8.16", "DERIVED:eq-8.17"]
alt: >-
  Nine-by-nine symmetric matrix over the stages language identification, line rules,
  document rules, classifier at a fixed threshold, classifier at a top-p threshold, MinHash
  deduplication, exact-substring deduplication, PII redaction and decontamination. Pairs
  that commute exactly: language identification with document rules and with the fixed
  classifier; document rules with the fixed classifier. Pairs that change the retained set
  only near thresholds or where edited spans matter: language identification with MinHash and
  with PII redaction; line rules with PII redaction; document rules with MinHash and with PII;
  fixed classifier with MinHash and with PII; top-p classifier with PII; PII with
  decontamination. Every other pair, including every pair involving the top-p classifier,
  exact-substring deduplication or line rules with a reader of text, changes the retained set.
spec:
  rows: 9
  cols: 9
  pattern: explicit
  rowLabel: "stage run first"
  colLabel: "stage run second"
  rowTicks: ["LID", "line rules", "doc rules", "clf fixed", "clf top-p", "MinHash", "substring", "PII redact", "decontam"]
  colTicks: ["LID", "line rules", "doc rules", "clf fixed", "clf top-p", "MinHash", "substring", "PII redact", "decontam"]
  cells:
    - [0, 1, 0, 0, 1, 0.5, 1, 0.5, 1]
    - [1, 0, 1, 1, 1, 1, 1, 0.5, 1]
    - [0, 1, 0, 0, 1, 0.5, 1, 0.5, 1]
    - [0, 1, 0, 0, 1, 0.5, 1, 0.5, 1]
    - [1, 1, 1, 1, 0, 1, 1, 0.5, 1]
    - [0.5, 1, 0.5, 0.5, 1, 0, 1, 1, 1]
    - [1, 1, 1, 1, 1, 1, 0, 1, 1]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 1, 1, 0, 0.5]
    - [1, 1, 1, 1, 1, 1, 1, 0.5, 0]
  highlight:
    - { row: 3, col: 5 }
    - { row: 5, col: 3 }
  legend: "1 = order changes the retained set; 0.5 = only near thresholds or edited spans; 0 = commutes"
```

**Deduplication against quality filtering.** The reference pipelines do not agree on where deduplication sits, and one of them does not agree with itself. FineWeb's §3.7 gives the order as extraction, base filtering, "individual per-crawl MinHash deduplication", C4 filters, "and finally … custom filters", and its filter ablations were run on "the base filtered and individually deduplicated 2019-18 crawl" — rules after deduplication; its Appendix A datasheet lists "C4 quality filters – FineWeb custom filters – MinHash deduplication – PII reformatting" — rules before deduplication (P06 §3.5, §3.7, App. A, PAPER-REPORTED). The reference script `examples/fineweb.py` in datatrove follows the datasheet: URL filter, trafilatura, language filter, Gopher repetition and quality filters, C4 filter and FineWeb filter per dump, then the four MinHash steps, then the PII formatter (R8.16, main at commit `356bca2`, read 2026-09-25, not executed; OFFICIAL-DOCUMENTATION). datatrove's `C4QualityFilter` rewrites `doc.text` from the lines it keeps, so it is a transform, not a predicate (R8.16, same commit), and Proposition 8.1 (iii)–(iv) says the two published orders need not yield the same corpus; the size of the difference for FineWeb is NOT-DISCLOSED. ⟦P07-ORDER⟧ FineWeb2 moves deduplication to the front on purpose: "While deduplication requires a large amount of computation and is therefore typically applied as the very last processing step, we employ it as an initial step, before filtering. This allowed us to directly observe the final dataset performance each time we ran one of our many filtering experiments without the possibility of deduplication later influencing the results" (R8.12 §4.3, PAPER-REPORTED) — an ordering chosen to make ablations interpretable, which is the attribution effect of the definition above.

The cost argument for deduplicating before an expensive classifier is independent of yield: at 112 hashes the MinHash stage costs ~10⁵ hash evaluations per 1,000-word document (§8.3), far below one encoder forward, and every fraction of tokens removed before scoring saves the same fraction of the classifier bill — 6,000 H100 GPU-hours per 15T tokens for the FineWeb-Edu regressor (P06 §4, PAPER-REPORTED; the proportionality is DERIVED). Eq. 8.17 prices the other side: every straddling cluster whose random representative fails the classifier is lost although a passing member existed. FineWeb2 turns the interaction into a signal. It computes the filtering removal rate at each MinHash cluster size, finds that "both data that was never repeated (cluster size of 1), as well as data that is repeated many times … is generally of lower quality" in a U shape "present in most languages we verified", and assigns "a weight of 10 … to the cluster size with the smallest removal rate, and a weight of 1 to every cluster size above the global removal rate", interpolating between (R8.12 §4.5, PAPER-REPORTED). That is the one stage in the opened sources that reads another stage's ledger by design. No opened source reports Δ_set for a production corpus; it is NOT-DISCLOSED, and Algorithm 8.12 estimates it from a sample.

A Bloom-filter deduplicator (BFF, §8.3) is a population stage whose outcome depends on *stream* order: the first occurrence of each n-gram is kept. A stream sorted by crawl date keeps the oldest copy; a stream sorted by quality score keeps the best-scoring one; a stream in shard order keeps an arbitrary one (DERIVED from P07's description that a paragraph is removed when its n-grams were already seen). The stream order is therefore part of the stage contract, and a re-run with a different shard layout is a different pipeline.

**Transforms before statistics.** Four transform interactions recur. *Line rules before document rules:* the word-count, mean-word-length and duplicate-line statistics of R8.1 are computed on whatever lines survive; RefinedWeb makes the interaction explicit by dropping a document "if these corrections remove more than 5% of a document" (P04 §3.2, PAPER-REPORTED), a document-level decision driven by a line-level transform. *Normalisation before deduplication and PII:* NFKC maps full-width and compatibility characters to base forms (§8.1), which raises the Jaccard similarity of pages that differ only in those characters and changes which regexes match; running it after MinHash or after PII scanning gives a different corpus (DERIVED). *PII placeholders before deduplication:* replacing every email with one placeholder string, as P05 does with |||EMAIL_ADDRESS|||, makes templated pages that differed only in contact details more similar, so redaction before MinHash merges clusters that would otherwise stay apart, and repeated placeholders create new exact-substring duplicates (DERIVED). *Decontamination windows before length rules:* R8.7's protocol cuts 200-character windows and discards pieces shorter than 200 characters (PAPER-REPORTED, §8.5); the surviving pieces then face every length rule again, so the same benchmark overlap removes more text when decontamination precedes the rule filters than when it follows them (DERIVED).

**Classifiers and contamination.** A learned filter changes the prior of benchmark-like text in the retained pool. P07's classifier is trained with instruction-style positives (OpenHermes 2.5 and ELI5, §8.2) and P06's regressor is prompted toward "grade-school and middle-school level knowledge" (PAPER-REPORTED); both select for the register in which multiple-choice benchmarks are written. The dirty fraction of Eq. 8.13 measured *before* the classifier is therefore not the dirty fraction of the corpus that trains the model (DERIVED). P07 is the one programme in the opened sources that checked the consequence: removing detected overlaps moved its 7B-2x MMLU from 51.8 to 52.7 and HellaSwag from 77.9 to 78.4, and it concludes its gains "are not likely to be caused by increased presence of their test examples" (PAPER-REPORTED, §8.5). The ordering rule that follows is that decontamination is measured, and if needed applied, on the post-classifier pool.

**Conditional application and ensembles.** Nemotron-CC replaces a fixed chain by a score-conditioned one. Its pipeline extracts with jusText, keeps English "as determined by pycld2 and the FastText lid176 language classifier with threshold 0.3", applies "global fuzzy deduplication as well as exact substring deduplication over eighths of snapshots", scores every document with an ensemble of three classifiers, groups the scores into 20 buckets and 5 quality levels, and applies the heuristic filters only to the low-quality data (R8.38 §2.1–§2.2, PAPER-REPORTED). The token counts on 13 snapshots are the cleanest published measurement of a filter interaction: trafilatura with heuristic filtering yielded 994B tokens of which 80B were high-quality by the FineWeb-Edu classifier; jusText with filtering 1,380B and 104B; jusText without filtering 1,804B and 127B (R8.38 Table 1, PAPER-REPORTED). Among the top 1,000 domains preferred by the FineWeb-Edu and DCLM classifiers "only 368 domains are in the intersection" (R8.38 Appendix B, PAPER-REPORTED) — the classifiers are not interchangeable predicates, which is the argument for an ensemble. Cost line: three classifier forward passes per document instead of one; the heuristics run on the low-quality buckets only; the classifier inference cost is NOT-DISCLOSED in the paper.

**Multilingual bias.** Three mechanisms bias a chain against languages it was not designed for. First, language identification has prior-limited precision (Eq. 8.1): R8.12 reports that for low-resource languages false positives from a related high-resource language can account "for more than 90% of the data" (PAPER-REPORTED, §8.1), and the audit of R8.36 found, across 205 language-specific corpora of CCAligned, ParaCrawl, WikiMatrix, OSCAR and mC4, that "87 of them had under 50% usable data, with a full 15 languages at 0% in-language" (PAPER-REPORTED). Second, English-derived rules are implicit language filters: R8.1's rule requiring "at least two of the following English words: the, be, to, of, and, that, have, with" (PAPER-REPORTED, §8.2) removes every non-English document that reaches it, so a multilingual pipeline that reuses the rule set unchanged after a multilingual LID pass has re-imposed English-only filtering without a ledger row that says so (DERIVED). Third, language scores leak into quality scores: R8.35 found pages associated with Eastern Asia "2.4 times more likely to be removed by CLD2" than Northern Europe on English pages, and that the Wikipedia-perplexity filter tracks fastText LID across topics (rs = 0.860) (PAPER-REPORTED). Because both stages penalise the same pages, their per-stage relative pass rates multiply in Eq. 8.19 rather than overlapping, and a region or variety of English that loses 10 % more at each of five stages retains 0.59 of the reference rate (DERIVED). FineWeb2's per-language adaptation — thresholds derived from each language's own score distribution, per-language word tokenizers, and 207 ablation models of 29B tokens each to choose among threshold rules for three filter groups (R8.12 §4.4, PAPER-REPORTED) — is the published response. Its comparison marks the default FineWeb English thresholds of two of the three groups with the symbol reserved for combinations "that would remove over 75% of data with a single filter on at least one of the languages, or that would not remove anything at all", and even the adapted thresholds remove on average between 24.79 % and 49.23 % of the data per group and method (R8.12 Tables 25–26, PAPER-REPORTED). It adapts each stage separately and does not report κ_g for the chain.

```figure
id: fig-8.33
kind: chart
title: Compounding of per-stage relative retention along a filter chain
caption: >-
  Eq. 8.19's last product when every stage keeps a group at the same fraction r of the
  reference group's rate. A 5% per-stage disadvantage is invisible in any single ledger row
  and still removes a fifth of the group's relative share after five stages; a 20%
  disadvantage leaves a third. Illustrative constant r, not a measured pipeline.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-8.19"]
alt: >-
  Line chart of relative retention kappa equal to r to the power K against the number of
  stages K from 1 to 12, for per-stage relative pass rates r = 0.95, 0.9 and 0.8. At K = 5
  the three curves stand at 0.774, 0.590 and 0.328; at K = 10 at 0.599, 0.349 and 0.107;
  at K = 12 at 0.540, 0.282 and 0.069.
spec:
  type: line
  x: { label: "stages in the chain, K", scale: linear, format: integer, domain: [1, 12] }
  y: { label: "relative retention kappa_g", scale: linear, format: ratio, domain: [0, 1] }
  variables: { r1: 0.95, r2: 0.9, r3: 0.8 }
  series:
    - { id: r95, label: "r = 0.95 per stage", formula: "r1^x", sample: { from: 1, to: 12, count: 12 } }
    - { id: r90, label: "r = 0.90 per stage", formula: "r2^x", sample: { from: 1, to: 12, count: 12 }, emphasis: true }
    - { id: r80, label: "r = 0.80 per stage", formula: "r3^x", sample: { from: 1, to: 12, count: 12 }, dashed: true }
  annotations:
    - { x: 5, label: "0.9^5 = 0.59" }
    - { x: 10, label: "0.9^10 = 0.35" }
```

**Rare-data loss.** The same compounding applies to dialects, registers and domains, and the evidence that single stages already carry the bias is consistent across four independent groups. R8.34 reproduced the GPT-3 quality classifier and found that high-school newspaper articles "from larger schools, located in wealthier, educated, and urban ZIP codes are more likely to be classified as high quality", with no difference in quality scores between high- and low-factuality news sources (p = 0.085) (PAPER-REPORTED). R8.11 found that C4's blocklist removes text in dialects associated with minority identities (PAPER-REPORTED, §8.2). R8.35 found that "some quality classifiers act like topical domain filters" (PAPER-REPORTED). R8.33 measured the downstream side at 1.5B parameters: the quality filter improved most QA domains despite removing data, but hurt Books — at threshold 0.7, which kept 46 % of C4, Books QA changed by −6.7 points while the average rose by 0.7 — and "the benefits are not predictable from text characteristics" (PAPER-REPORTED). Deduplication adds its own tail effect: P06 hypothesises that the gain lies in removing large clusters while removing clusters with fewer than ~100 duplicates "can harm performance" (PAPER-REPORTED as a hypothesis, §8.3), R8.12's filter removal rates are highest for singletons and for the most-repeated tail, and R8.38's −18.1 % is rare-data loss in the precise sense of the definition, with the classifier as the validity oracle. The mechanism is Eq. 8.3 applied per group: a filter tuned for precision on the majority has a false-positive rate on content its reference set under-represents, and Eq. 8.19 multiplies those rates. What a filter removes from the long tail is the input that [§9.2](../ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md) measures as long-tail retention; this section owns the removal side and §9.2 the exposure side.

**Adversarial documents.** A filter chain is also an attack surface. R8.13 shows that web-scale datasets can be poisoned in practice. Split-view poisoning "exploits the mutable nature of internet content to ensure a dataset annotator's initial view of the dataset differs from the view downloaded by subsequent clients"; frontrunning poisoning targets datasets that "periodically snapshot crowd-sourced content -- such as Wikipedia -- where an attacker only needs a time-limited window to inject malicious examples"; the authors estimate that "for just $60 USD, we could have poisoned 0.01% of the LAION-400M or COYO-700M datasets in 2023" and that they "can poison 6.5% of Wikipedia documents absent any other defensive measures", and their Table 1 lists the text corpus Falcon RefinedWeb with 0.24 % of its documents on expired domains (R8.13 abstract, §1, §5.4, Table 1, PAPER-REPORTED). The first version of the paper states the filter interaction directly: an attack adding 1 MB of text is a 2.5 × 10⁻⁹ fraction of Common Crawl, "but if this text bypasses the curation done for the CC-100 dataset, it could instead poison a 1.2 × 10⁻⁵ fraction of the English corpus, or even a full 9.1% of the Oromo corpus" (R8.13 v1 App. B.3, PAPER-REPORTED; the passage is absent from v2). Filtering that removes benign text and passes the adversary's text *concentrates* the attack: the adversary's share after the chain is its share before, times A/σ_chain (Eq. 8.20). The count, not the fraction, is what matters to the defender: R8.39 found that "250 poisoned documents similarly compromise models across all model and dataset sizes" from 600M to 13B parameters trained on Chinchilla-optimal data, 0.00016 % of training tokens for the 13B model, and that 100 documents did not succeed (PAPER-REPORTED); R8.40 found that poisoning 0.1 % of pretraining data let three of four attacks "measurably persist through post-training", and denial-of-service at 0.001 % (PAPER-REPORTED). Eq. 8.20 converts a chain into the adversary's cost: a chain that passes adversarial documents with probability 0.1 multiplies the injection budget by 10 — 2,500 documents instead of 250, a fraction 2.5·10⁻⁷ of a 10¹⁰-document crawl — and if the same chain keeps 10 % of benign documents, the 250 survivors are 2.5·10⁻⁷ of the retained corpus, the same share as the 2,500 had in the crawl; a filter-aware adversary with A = 1 facing σ_chain = 0.1 enters the retained corpus at ten times its crawl share (DERIVED, illustrative; this is R8.13's CC-100 arithmetic in general form). Two properties of the chain limit that factor. First, the reference classifiers are public: the FineWeb-Edu classifier and the DCLM fastText model are released (R8.27, R8.31), so an adversary can score candidate documents before publishing them and drive each a_k toward 1 (DERIVED; no opened source measures filter-aware poisoning). Second, deduplication collapses only similar variants: with FineWeb's 14 × 8 banding, 250 variants at pairwise Jaccard 0.5 have candidate probability 0.053 per pair and a mean of about 13 candidate edges each, so transitive clustering (Algorithm 8.6) without per-edge verification merges almost all of them into one cluster; at pairwise Jaccard 0.2 the mean degree is 0.009 and they all survive (MATHEMATICALLY-DERIVED from Eq. 8.8 and Eq. 8.20). R8.39's construction — a random public-domain prefix, a trigger, and 400–900 tokens sampled at random from a vocabulary (PAPER-REPORTED) — has near-zero shingle overlap between documents by construction, so deduplication does not touch it; whether a perplexity or repetition filter would remove such gibberish was not tested in R8.39 and is UNVERIFIED. The defences that act on the chain are integrity and provenance rather than scoring: pinning content hashes at collection time (R8.13's proposal, §7.3), recording source identifiers so that a poisoned source can be removed with its descendants (§7.4 deletion lineage), and injecting canary documents to measure a_k directly (Algorithm 8.13).

```figure
id: fig-8.34
kind: calculator
title: Injection budget and deduplication collapse for a poisoning adversary
caption: >-
  Eq. 8.20 with Eq. 8.8's banding. The first output is what the chain charges the adversary;
  the share outputs show the chain concentrating whatever passes it; the last is whether MinHash
  clustering sees the variants as one family. Scroll: variants at Jaccard 0.5 form a connected
  candidate graph and collapse; at 0.2 they are invisible to deduplication; a filter-aware
  adversary pays nothing and gains share. The poison count of 250 is R8.39's reported
  denial-of-service setting; both pass rates are ASSUMED.
placement: rail
anchor: mechanism
evidence: DERIVED
source: ["DERIVED:eq-8.20", "DERIVED:eq-8.8", R8.39, R8.13]
alt: >-
  Calculator for Eq. 8.20. Inputs: surviving poisons needed n_star (default 250, the
  setting reported by R8.39), chain pass probability A for adversarial documents (default
  0.1, assumed), chain pass rate on benign records (default 0.1, assumed), crawl size in
  documents (default 10 billion), pairwise Jaccard J of the variants (default 0.5), bands
  b = 14 and rows r = 8. Outputs: documents to inject 2,500; share of the crawl 2.5e-7;
  share of the retained corpus 2.5e-7; candidate probability per pair 5.3%; mean candidate
  degree 13.3, above 1, so the variants form one component. At J = 0.2 the candidate
  probability is 3.6e-5 and the degree 0.009. At A = 1 the injection is 250, 2.5e-8 of the
  crawl and 2.5e-7 of the retained corpus.
spec:
  tex: >-
    n_{\text{inj}} = \frac{n_\star}{A},\quad s_{\text{post}} = s_{\text{pre}}\frac{A}{\sigma_{\text{chain}}},\quad \bar d = (n_\star-1)\Big(1-\big(1-J^{r}\big)^{b}\Big)
  equation: "8.20"
  inputs:
    - { symbol: ns, label: "surviving poisons needed n_star", default: 250, min: 1, max: 100000, scale: log10, format: integer }
    - { symbol: A, label: "chain pass probability A", default: 0.1, min: 0.0001, max: 1, scale: log10, format: percent }
    - { symbol: sc, label: "chain pass rate on benign records", default: 0.1, min: 0.01, max: 1, scale: log10, format: percent }
    - { symbol: X, label: "crawl size, documents", default: 1.0e10, min: 1.0e6, max: 1.0e12, scale: log10, format: integer }
    - { symbol: J, label: "pairwise Jaccard of variants J", default: 0.5, min: 0.01, max: 0.95, format: fixed2 }
    - { symbol: b, label: "bands b", default: 14, min: 1, max: 500, format: integer }
    - { symbol: r, label: "rows per band r", default: 8, min: 1, max: 32, format: integer }
  outputs:
    - { symbol: ninj, label: "documents to inject", formula: "ns/A", format: integer, emphasis: true }
    - { symbol: frac, label: "share of the crawl, s_pre", formula: "ninj/X", format: raw }
    - { symbol: post, label: "share of the retained corpus, s_post", formula: "frac*A/sc", format: raw }
    - { symbol: pc, label: "candidate probability per variant pair", formula: "1 - (1 - J^r)^b", format: percent }
    - { symbol: deg, label: "mean candidate degree", formula: "(ns - 1)*pc", format: fixed2 }
states:
  - { anchor: mechanism, label: "J = 0.5, A = 0.1", variables: { ns: 250, A: 0.1, sc: 0.1, J: 0.5 }, highlight: [ninj, deg], note: "2,500 injections for 250 survivors; at Jaccard 0.5 each variant has about 13 candidate edges, so transitive clustering merges the family." }
  - { anchor: failure-modes, label: "J = 0.2", variables: { ns: 250, A: 0.1, sc: 0.1, J: 0.2 }, highlight: [pc, deg], note: "Dissimilar variants: candidate probability 3.6e-5 per pair, degree 0.009. Deduplication no longer sees an attack; only the scoring stages charge the adversary." }
  - { anchor: limitations, label: "filter-aware, A = 1", variables: { ns: 250, A: 1, sc: 0.1, J: 0.2 }, highlight: [frac, post], note: "A filter-aware adversary pays nothing to the chain: 250 injections, 2.5e-8 of the crawl, and 2.5e-7 of a corpus that kept 10% of benign records." }
```

**Controlled downstream ablations.** Every interaction above is decided, in the end, by training on the two corpora at matched tokens. The published designs are one-factor-at-a-time: P06 trains 1.71B-parameter models on 28B tokens with two seeds per configuration and adds each stage on top of the previous chain (PAPER-REPORTED, §8.1–§8.2); P07 fixes the recipe per scale and varies the data (PAPER-REPORTED); R8.33 trained 28 models of 1.5B parameters and states that it proceeded "without the luxury of multiple rounds of reflection and repetition" (PAPER-REPORTED); R8.38 ran its extractor-and-filter comparison as four 8B-parameter, 1T-token trainings (PAPER-REPORTED). None estimates an interaction coefficient in the sense of Eq. 6.6 ([§6.3](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md)), and none reports a second order of the same stages. DataDecide supplies the noise side: 1,050 models over 25 data recipes, 14 sizes from 4M to 1B and 3 seeds, trained at 100 tokens per parameter; ranking recipes at 150M predicts the 1B winner in about 80 % of pairwise comparisons; the evaluation "must separate pairs of data recipes by an amount greater than combined noise from run-to-run variance"; and the suite cost "approximately 820K H100 GPU hours" (R8.37 §2.1, §3.4, Impact statement, PAPER-REPORTED). Eq. 8.21 turns this into a sizing rule. With σ_a = 1 point, two seeds per arm give a standard error of 1 point on the difference: a true 1-point effect is ranked correctly with probability Φ(1) = 0.84 and a 0.5-point effect with Φ(0.5) = 0.69; ranking a 0.5-point effect correctly 95 % of the time needs 22 seeds per arm (MATHEMATICALLY-DERIVED). P06's reported gain of "about 1%" from its three custom filters (§8.2) sits at the edge of what a two-seed design can resolve if σ_a approaches the 2 points R8.37 reports for some recipes at 1B.

The combinatorics fix what to ablate. Presence of K stages is a 2^K factorial; order is K! arms; neither is affordable at K = 8 when a single P06-scale run costs 6ND = 6 × 1.71·10⁹ × 28·10⁹ ≈ 2.9·10²⁰ FLOPs (DERIVED, dense-transformer approximation of notation §2.2). Proposition 8.1 reduces the problem: only non-commuting pairs whose relative order is not forced by dependencies (LID before per-language rules; normalisation before PII scanning; decontamination before tokenisation) need an order ablation, and only stages whose conditional removal rates differ across positions need an interaction term. Algorithm 8.11 produces that list; Experiment 8.6 ablates the pair that Eq. 8.17 says matters most.

```figure
id: fig-8.35
kind: calculator
title: How often a matched-token ablation ranks two pipelines correctly
caption: >-
  Eq. 8.21 with the normal CDF replaced by the logistic approximation 1/(1 + exp(−1.702 z)),
  accurate to about 0.01. Scroll: a two-seed design against a half-point effect is right about
  seven times in ten; the same design against a one-point effect about 85%; at the seed
  noise R8.37 reports for some recipes, a one-point effect is again a coin weighted only 70:30.
  The seeds column is the n needed for a 95% correct decision (z = 1.645).
placement: rail
anchor: experimental-design
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-8.21", R8.37]
alt: >-
  Calculator for Eq. 8.21 with inputs true difference delta in score points, seed standard
  deviation sigma, seeds per arm n and target quantile z. Outputs: standard error
  sigma times the square root of 2/n; margin in standard errors; probability of the correct
  sign by the logistic approximation; seeds per arm needed. At delta 0.5, sigma 1, n 2: standard
  error 1, margin 0.5, probability about 0.70, 22 seeds needed. At delta 1, sigma 1, n 2:
  margin 1, probability about 0.85, 6 seeds needed. At delta 1, sigma 2, n 2: margin 0.5,
  probability about 0.70, 22 seeds needed.
spec:
  tex: >-
    P\big[\operatorname{sign}\hat\Delta=\operatorname{sign}\delta\big]=\Phi\!\Big(\tfrac{|\delta|}{\sigma_a}\sqrt{n/2}\Big),\quad n_{\text{req}}=\Big\lceil\tfrac{2\sigma_a^2 z^2}{\delta^2}\Big\rceil
  equation: "8.21"
  inputs:
    - { symbol: delta, label: "true difference delta, points", default: 0.5, min: 0.05, max: 5, scale: log10, format: fixed2 }
    - { symbol: sa, label: "seed std sigma_a, points", default: 1.0, min: 0.1, max: 4, format: fixed2 }
    - { symbol: n, label: "seeds per arm n", default: 2, min: 1, max: 64, options: [1, 2, 3, 5, 8, 16, 32, 64], format: integer }
    - { symbol: z, label: "target quantile z", default: 1.645, min: 0.5, max: 3.1, options: [1.282, 1.645, 1.96, 2.326], format: fixed3 }
  outputs:
    - { symbol: se, label: "standard error of the difference", formula: "sa*sqrt(2/n)", format: fixed2 }
    - { symbol: zm, label: "margin in standard errors", formula: "delta/se", format: fixed2 }
    - { symbol: pc, label: "P(correct sign), logistic approx.", formula: "1/(1 + exp(-1.702*zm))", format: percent, emphasis: true }
    - { symbol: nreq, label: "seeds per arm for the target", formula: "ceil(2*sa^2*z^2/delta^2)", format: integer }
states:
  - { anchor: experimental-design, label: "0.5 points, 2 seeds", variables: { delta: 0.5, sa: 1.0, n: 2 }, highlight: [pc, nreq], note: "The P06 design against a half-point effect: right about 70% of the time. A 95% decision needs 22 seeds per arm." }
  - { anchor: observations, label: "1 point, 2 seeds", variables: { delta: 1.0, sa: 1.0, n: 2 }, highlight: [zm, pc], note: "A one-point effect at one point of seed noise: about 85% correct, 6 seeds for 95%." }
  - { anchor: limitations, label: "sigma_a = 2 points", variables: { delta: 1.0, sa: 2.0, n: 2 }, highlight: [se, pc], note: "At the 2-point seed spread R8.37 reports for some recipes at 1B, a one-point effect is ranked correctly about 70% of the time with two seeds." }
```

<details><summary>Derivation of the numbers in Eq. 8.19–8.21</summary>
Eq. 8.19: 0.9⁵ = 0.5905, 0.9¹⁰ = 0.3487; share 0.02·0.3·0.5905 / (0.02·0.3·0.5905 + 0.98·0.3) = 0.003543/0.297543 = 0.0119. Eq. 8.20: 1 − (1 − 0.5⁸)¹⁴ = 1 − (0.996094)¹⁴ = 0.0533, times 249 gives 13.3; 1 − (1 − 0.2⁸)¹⁴ = 3.58·10⁻⁵, times 249 gives 0.0089; an Erdős–Rényi graph acquires a giant component when the mean degree exceeds 1 (KNOWN), which is the collapse criterion used here, idealising candidate edges as independent. Eq. 8.21: SE = 1·√(2/2) = 1; Φ(1) = 0.8413, Φ(0.5) = 0.6915; n = 2·1²·1.645²/0.5² = 21.6, rounded up to 22; at δ = 1, n = 5.4, rounded up to 6. MATHEMATICALLY-DERIVED.
</details>

## Algorithm

```text
Algorithm 8.11 — Stage-contract interaction analysis and cost-aware ordering
INPUT   stage contracts S_1..S_K with {stage_id, type ∈ {P, T, S}, reads[], writes[], unit, depends_on[], cost c_k,
        conditional pass rate σ_{k|<k} from the last ledger}; forced-order rules F (e.g. LID < per-language rules,
        normalise < PII scan, decontaminate < tokenise)
OUTPUT  execution order π; list O of order-sensitive pairs to ablate; list I of stages whose attribution is position-dependent
STATE   commute[j][k] ∈ {0, ½, 1}; precedence graph G
INVARIANT π respects G; two stages are reordered for cost only if commute = 0 for the pair
1.  for each pair (j, k):
2.      if type_j = P and type_k = P: commute[j][k] ← 0                               # Proposition 8.1 (i)
3.      elif S ∈ {type_j, type_k}: commute[j][k] ← 1                                   # (iv); refine to ½ after Algorithm 8.12 if straddling is rare
4.      elif writes_j ∩ reads_k = ∅ and writes_k ∩ reads_j = ∅: commute[j][k] ← 0     # (iii)
5.      else: commute[j][k] ← 1
6.  G ← edges from depends_on[] ∪ F; reject if G has a cycle
7.  partition stages into maximal blocks of mutually commuting predicates consistent with G
8.  within each block sort by r_k = c_k / (1 − σ_{k|<k}) ascending                    # Eq. 8.18
9.  π ← topological order of G with blocks internally sorted
10. O ← { (j, k) : commute[j][k] > 0 and neither j <_G k nor k <_G j }
11. I ← { k : |σ_{k|<k} − σ_k| exceeds its sampling interval }                         # dependence, Proposition 8.1 (ii)
12. write π, O, I and the contract hashes to pipeline.yaml; return
TERMINATION: O(K²) pair checks and one topological sort.
```

Complexity: O(K²) comparisons of read/write sets; negligible against any stage. Memory: the K × K commute table. The read/write declarations are the book's addition to the stage contract; no reference implementation declares them (NOT-DISCLOSED in R8.16, R8.29, R8.31 as inspected).

```text
Algorithm 8.12 — Order-sensitivity and per-group retention audit on a sample
INPUT   cluster-complete sample X_s drawn by source domain and group g (whole near-duplicate clusters, never single members);
        two orders π, π′ of the same stages; audit labels v(x) on a sub-sample; reference group ref; bootstrap draws Bt
OUTPUT  set effect (Jaccard distance, straddling-cluster count), attribution table, R_g, κ_g, rare-data loss with intervals
STATE   retained sets Y = π(X_s), Y′ = π′(X_s); per-stage ledgers L, L′
INVARIANT the sample contains every member of each sampled cluster, so population stages see intact clusters
1.  Y, L ← run π on X_s ; Y′, L′ ← run π′ on X_s
2.  set_effect ← 1 − |Y ∩ Y′| / |Y ∪ Y′| ; token_share_diff[g] ← share_g(Y) − share_g(Y′)
3.  straddling ← |{ c : 0 < m_c^+ < m_c }|                                         # Eq. 8.17, from the classifier scores of all members
4.  for each stage k and order: σ_{k|<k} from L, L′ ; attribution_effect[k] ← difference
5.  for each group g: R_g ← Π_k σ_{k|g,<k} (from L) ; κ_g ← R_g / R_ref             # Eq. 8.19
6.  on audited records: R_g^valid ← retained valid / valid ; loss_g ← (1 − R_g^valid) − (1 − R_ref^valid)
7.  repeat 2–6 on Bt bootstrap resamples of source domains; report percentile intervals (§2.5)
8.  return set_effect, straddling, attribution_effect, {R_g, κ_g, loss_g} with intervals
TERMINATION: two pipeline runs on X_s and Bt resamples of the metric computations.
```

Complexity: two pipeline passes over the sample — the cost of the most expensive stage (usually the classifier) on |X_s| records, twice; the bootstrap reuses the ledgers. Memory: two retained sets and ledgers. The cluster-complete sampling is essential: a document-level sample breaks clusters and makes a population stage behave as if the corpus had fewer duplicates than it has (DERIVED).

```text
Algorithm 8.13 — Canary survival test for adversarial documents
INPUT   chain π; canary families F_1..F_q (e.g. random-token payloads, fluent filter-aware texts scored against the released
        classifiers, near-duplicate variant sets at J ∈ {0.2, 0.5, 0.8}); per-family count n_f; unique canary string per document
OUTPUT  per-stage pass probability a_k per family; chain pass A_f = Π a_k; implied injection budget n_⋆/A_f (Eq. 8.20)
STATE   canary registry (id → family, string, hash)
INVARIANT canaries are removed from the released corpus after measurement; every canary has a ledger row at the stage that dropped it or a survivor row
1.  mix n_f canaries of each family into a held-out shard at random positions; register ids and hashes
2.  run π; collect ledger rows whose record_id is a canary
3.  for each family f and stage k: a_k ← survivors after k / survivors before k
4.  A_f ← Π_k a_k ; budget_f ← n_⋆ / A_f ; flag stages with a_k ≥ 0.9 for filter-aware families
5.  delete surviving canaries by id; verify by string search that none remain
TERMINATION: one run of π on one shard.
```

Complexity: one chain run on a shard plus a string search; the canary families are generated offline. The canary strings must be unique and must not collide with benchmark canary strings (§8.5), or decontamination will remove them for the wrong reason.

## Implementation

Tensors and operators: none beyond those of the stages themselves; the interaction machinery is bookkeeping over ledgers and a second run on a sample. Framework: the stage chains in the reference open pipelines are ordered lists of blocks — datatrove's pipeline of readers, extractors, filters, deduplication steps and formatters executed in sequence by its local, Slurm and Ray executors (R8.16, OFFICIAL-DOCUMENTATION), Ai2's dolma toolkit of taggers and a mixer (R8.29), DCLM's processing and `dedup/bff` code (R8.31), and NeMo Curator, which R8.38 names as its fuzzy-deduplication library (PAPER-REPORTED); these are lab code surfaces (Hugging Face #27, Ai2 #22, NVIDIA Research #14), not §4 stack systems, and none of them declares stage types or read/write sets, which Algorithm 8.11 adds. The ablation models are where §4 systems enter: **Nanotron** (#35, *Distributed training*) is the trainer P06 names for every FineWeb ablation model, described in its README as a pretraining library (R8.24, OFFICIAL-DOCUMENTATION); **PyTorch** (#17, *Model / autograd framework*, R8.32) and **Hugging Face Transformers** (#26, *Model definition / adaptation*, R8.23) host the classifier and NER stages whose scores Algorithm 8.12 re-reads; **vLLM** (#41, *Inference engine*, R8.25) is the engine class for the LLM annotators and judges whose outputs define several predicates (§8.2, §8.5). Memory: Algorithm 8.12 holds two copies of the sample's ledger; the population stages need their full state (MinHash bucket tables, Bloom filters) for the sample only. Communication: none beyond the stages' own shuffles (§8.3). Deployment: the order π and its hash belong in `pipeline.yaml`; a re-order is a new pipeline version, and the ledger of a corpus built by one order cannot be compared row-for-row with a ledger built by another. Execution semantics — worker completion order, which matters for BFF — are owned by [§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md), and stage-by-stage accounting of identities by the conservation ledger of [§12.6](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-6-operational-observability.md).

> **Implementation note [impl.nanotron · README, R8.24, no version string asserted].** Named because P06 trained its ablation models with it; no claim in this section depends on a Nanotron API, and the throughput of any ablation run is NOT-DISCLOSED here.

Cost line: Algorithm 8.11 is free; Algorithm 8.12 costs two passes of the chain over the sample, dominated by classifier inference (at the P06 rate, 0.4 H100 GPU-hours per billion tokens scored, DERIVED from 6,000 hours per 15T tokens); Algorithm 8.13 costs one chain pass over a shard; Experiment 8.6 costs 24 training runs at ≈ 2.9·10²⁰ FLOPs each, ≈ 6.9·10²¹ FLOPs in total (DERIVED), plus the scoring of both orders.

## Experimental design

### Experiment 8.6 — Order, conditional application and group retention at matched tokens

- **Hypothesis.** (a) Filtering before deduplication (Q→D) retains more clusters than D→Q by the straddling-cluster count of Eq. 8.17, and the difference in aggregate downstream score between the two orders is smaller than the seed noise at 28B tokens. (b) Applying rule filters only to classifier-low buckets (the R8.38 design) raises the aggregate score over applying them everywhere, as R8.38 reports at 8B/1T. (c) The chain's relative retention κ_g for at least one audited group (a non-US English variety or a register such as fiction) is below 0.8 and is the product of per-stage factors each above 0.9 — the compounding of Eq. 8.19.
- **Setup.** One base-filtered Common Crawl pool (P06 base filtering) of ≥ 5 snapshots; stages: MinHash (14 × 8, per snapshot), a fixed-threshold quality classifier, the FineWeb rule filters. A 2 × 2 × 2 factorial: order ∈ {D→Q, Q→D} × rule application ∈ {everywhere, low-quality buckets only} × classifier threshold ∈ {top 10 %, top 30 %}, with 3 seeds per cell; 1.71B-class model on 28B tokens per run.
- **Independent variables.** Order; rule application; classifier threshold.
- **Controlled variables.** Extractor, LID, tokenizer, model, steps, optimiser, data order seed per arm, evaluator version, benchmark set and truncation.
- **Dataset / workload.** The pool; P06's eight benchmarks; a group audit sample of ≥ 2,000 cluster-complete records labelled for language variety, region and register, with validity labels from two annotators.
- **Hardware.** Any accelerator for training; CPU for deduplication and rules; one accelerator for scoring. Report GPU-hours and CPU-hours per stage and per order.
- **Metrics.** Aggregate and per-benchmark accuracy with Eq. 8.21 intervals; main effects and interactions by Eq. 6.6; retained tokens per cell; straddling clusters; set effect and attribution table from Algorithm 8.12; R_g, κ_g, rare-data loss with bootstrap intervals; canary survival (Algorithm 8.13) for three families.
- **Baselines.** P06's order and rule application at the top-10 % threshold.
- **Expected result.** Q→D keeps measurably more tokens; the score difference between orders is within noise at this scale; bucket-conditional rules gain less than R8.38 reports because of the smaller model and budget; κ_g falls below 0.8 for at least one audited group through the product of small per-stage factors.
- **Ablation.** Replace random representative selection by keep-highest-score, which makes D→Q equivalent to Q→D on straddling clusters; replace the fixed threshold by a top-p threshold computed after deduplication.
- **Interpretation.** Order is recorded as a pipeline parameter regardless of outcome; it is ablated in future only if hypothesis (a) fails. A κ_g below the pre-registered floor triggers per-group thresholds for the stages with the smallest factors.
- **Threats to validity.** Three seeds resolve only effects near σ_a (Eq. 8.21); the audit labels define validity and inherit annotator bias; the 28B-token scale may not reflect repetition regimes where retained-token differences matter (§9.6); canary families may not represent a capable adversary.

## Observations

**What the paper claims.** R8.38 claims heuristic filters remove 18.1 % of classifier-judged high-quality tokens and that applying them only to low-quality data improves MMLU at 8B/1T (PAPER-REPORTED). R8.33 claims quality and toxicity filters have "significant but opposite effects" and that quality-filter benefits "are not predictable from text characteristics" (PAPER-REPORTED). R8.35 and R8.34 claim that quality and language filters remove content non-uniformly by region, topic and socio-economic context (PAPER-REPORTED). R8.37 claims small-scale rankings predict the 1B winner in about 80 % of pairwise comparisons and that noise sets the limit (PAPER-REPORTED). R8.39 and R8.40 claim poisoning needs a near-constant number of documents and persists through post-training at 0.1 % (PAPER-REPORTED).

**What the evidence shows.** The claim that single filters carry group biases has independent support from four groups using different filters and populations (R8.11, R8.33, R8.34, R8.35). The claim that reordering or conditioning stages changes downstream quality rests on one paper (R8.38) at one scale and without seed replication in the table opened. No opened source measures an ordering effect of two stages on the same pool, an interaction coefficient between stages, or a chain-level κ_g. The poisoning results come from two overlapping author groups (R8.39, R8.40) with synthetic backdoors, and neither tests a data-filtering chain.

**What we infer.** DERIVED: predicates commute and population stages do not (Proposition 8.1), so the ordering question reduces to a small list of pairs that can be audited on a sample before any training. DERIVED: group biases compound multiplicatively through the chain (Eq. 8.19), so per-stage ledgers that each show a small disparity are consistent with a large chain-level loss. DERIVED: against a count-limited adversary with access to released classifiers, scoring stages provide little protection and provenance controls provide most of it (Eq. 8.20).

**What remains unknown.** NOT-DISCLOSED: Δ_set, κ_g and canary survival for any released corpus; the order in which closed pipelines apply their stages. UNVERIFIED: whether the R8.38 conditional-application gain transfers to other classifiers and scales; whether perplexity or repetition filters remove R8.39-style payloads; the size of interaction coefficients between standard stages.

## Failure modes

> **Failure mode — ordering drift.** *Symptom:* a rebuilt corpus differs from the release by millions of clusters although every stage version is unchanged. *Cause:* two non-commuting stages swapped by a refactor or a cost optimisation. *Detection:* the order hash in `pipeline.yaml`; Algorithm 8.12 on a fixed sample in CI. *Mitigation:* order is part of the pipeline version; Algorithm 8.11 permits cost reordering only inside commuting blocks.

> **Failure mode — positional attribution read as stage value.** *Symptom:* a stage is removed because the ledger shows it removes little, and quality falls. *Cause:* its conditional removal rate was small because a correlated predecessor already removed its targets (Proposition 8.1 ii). *Detection:* compare σ_{k|<k} with the marginal σ_k on a sample. *Mitigation:* ablate stages by presence at matched tokens, never by ledger fraction alone.

> **Failure mode — straddling-cluster loss.** *Symptom:* a strict classifier after deduplication yields far fewer tokens than the same classifier applied before it. *Cause:* Eq. 8.17 with random representatives. *Detection:* straddling-cluster count from Algorithm 8.12. *Mitigation:* keep the highest-scoring member, or score before deduplication for the clusters near the threshold.

> **Failure mode — silent English re-filtering.** *Symptom:* a multilingual pool collapses to English after the rule stage. *Cause:* an English stop-word or word-length rule reused after multilingual LID. *Detection:* per-language pass rate of each stage in the ledger. *Mitigation:* per-language rule thresholds (R8.12); language-conditional stage contracts.

> **Failure mode — compounding tail loss.** *Symptom:* a dialect, region or register is under-represented after the chain although no single stage shows a large disparity. *Cause:* Eq. 8.19. *Detection:* κ_g with an interval from Algorithm 8.12; audited validity labels. *Mitigation:* per-group floors; conditional application of rules (R8.38); re-weighting instead of removal ([§9.2](../ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md)).

> **Failure mode — filter-aware poisoning.** *Symptom:* canary families optimised against the released classifiers survive at a_k ≈ 1. *Cause:* public classifiers and a count-limited attack (R8.39). *Detection:* Algorithm 8.13. *Mitigation:* provenance and integrity controls (R8.13), source-level removal through deletion lineage (§7.4), and model-level detection (§65.2).

## Siblings

**Controlled comparisons and factorial designs** — [§6.3](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md)
Why it exists: attribute an outcome difference to a declared factor. What assumption changed: the factors are generic experimental levels, not pipeline stages with types. What objective changed: estimate main effects and interactions rather than classify commutation. What problem it solved: interaction coefficients from a crossed design (Eq. 6.6). What new failure mode it introduced: 2^K runs when every stage is a factor. Changed primitive: stage algebra → factorial response model.

**Score-conditioned pipelines (bucketing and ensembles)** — this file; R8.38
Why it exists: a fixed chain removes high-quality tokens that a classifier would keep. What assumption changed: later stages may depend on earlier scores. What objective changed: maximise high-quality token yield at fixed downstream quality. What problem it solved: −18.1 % HQ tokens recovered, MMLU 55.5 → 57.5 at 8B/1T (R8.38). What new failure mode it introduced: three classifier passes per document; the bucket-to-quality mapping must itself be ablated. Changed primitive: sequential predicates → score-indexed routing.

**Re-weighting what survives (rehydration, quality-aware mixing)** — [§9.2](../ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md)
Why it exists: removal is irreversible and compounds; weights are not. What assumption changed: a record's value is a weight, not a keep bit. What objective changed: exposure per cell rather than membership. What problem it solved: tail and small-cluster loss (P06, R8.12). What new failure mode it introduced: repetition of up-weighted content (§9.6). Changed primitive: keep(x) → weight w(x).

**Distributed execution of the chain** — [§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md)
Why it exists: the chain must produce the same corpus on any cluster. What assumption changed: order is also worker completion order. What objective changed: deterministic outputs under concurrency. What problem it solved: rebuilds that match the release. What new failure mode it introduced: stream-order dependence of BFF-style stages across shard layouts. Changed primitive: logical stage order → build graph.

**Model-level poisoning defence** — [§65.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-2-training-model-attacks.md)
Why it exists: scoring stages cannot bound a count-limited adversary. What assumption changed: detection moves from the corpus to the trained model. What objective changed: detect backdoor behaviour rather than suspicious documents. What problem it solved: attacks that pass every filter. What new failure mode it introduced: trigger search is incomplete. Changed primitive: document filter → model audit.

## Extensions

For code, licence filters, deduplication at file and repository level, PII redaction of keys and secret scanning (§8.3–§8.4) interact in the same way: redaction before deduplication merges forks that differ in credentials, and decontamination must run on post-deduplication files because forks carry benchmark copies (P05's WIMBD finding, §8.5). For multilingual corpora, every stage needs a per-language contract and κ_g must be reported per language, not only for English varieties. For multimodal data, an image–text similarity filter and a text quality filter are correlated predicates, and their attribution depends on order as in Proposition 8.1 (ii). For synthetic data, a generator trained on a filtered corpus reproduces the chain's biases in its outputs, so the κ_g of the generator's training corpus becomes a property of the synthetic set ([§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md)). For agent trajectories, episode-level filters (success, tool errors) and turn-level redaction are transforms and predicates at two units, and the unit must be part of the stage contract. These are proposals.

## Limitations

Proposition 8.1 is exact for the idealised stage types; real implementations mix them (a classifier whose threshold is re-estimated per shard is a population stage), so the classification must be read from the code, not the documentation. Eq. 8.17 assumes random representatives and independent member scores at one extreme; its magnitude on a real pool is unmeasured. Eq. 8.19 multiplies conditional rates and is exact only when those rates are estimated in the executed order. Eq. 8.20 idealises candidate edges as independent and the adversary as count-limited in the R8.39 sense, which was measured for synthetic backdoors at ≤ 13B parameters. Eq. 8.21 assumes normal seed effects; at two seeds it is optimistic. The falsification condition for the section's central claim is Experiment 8.6 showing a set effect or score difference between two orders of predicate-only stages beyond implementation noise — which would mean some "predicate" reads state it does not declare. Decision consequence: record the order and the stage types, audit non-commuting pairs and group retention on a cluster-complete sample before training, and spend training ablations only on the pairs that audit flags.

## Reproducibility

Record: the stage contracts with type, reads, writes and unit; the execution order and its hash; the representative policy of every deduplication stage; the pool on which every percentile threshold was computed; the stream order of every first-occurrence stage; the conditional pass rate of every stage per group from the ledger; the audit sample design (cluster-complete, strata, size), annotator protocol and validity definition; canary families, counts and registry hashes; the ablation factorial, seeds, tokens, model and evaluator version. Unknowns: no opened source reports an ordering ablation, an interaction coefficient or a chain-level group retention for a released corpus; R8.38's per-bucket token counts beyond Table 1 and its classifier inference cost were not transcribed.

## References

P04 · P05 · P06 · P07 · R8.1 · R8.2 · R8.7 · R8.11 · R8.12 · R8.13 · R8.16 · R8.23 · R8.24 · R8.25 · R8.27 · R8.29 · R8.31 · R8.32 · R8.33 · R8.34 · R8.35 · R8.36 · R8.37 · R8.38 · R8.39 · R8.40 · [references.md](references.md)
