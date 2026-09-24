---
id: ms.section.2.5
entity_type: section
title: Statistical inference
short_title: Statistical inference
volume: 1
part: 1
chapter: 2
section: 2.5
slug: 02-5-statistical-inference
parent: ms.chapter.2
prev_sibling: ms.section.2.4
next_sibling: ms.section.2.6
children: []
prerequisites: [ms.section.1.1, ms.section.2.2]
downstream: [ms.section.6.3, ms.section.6.4, ms.section.6.6, ms.section.21.5, ms.section.61.6, ms.section.62.2, ms.section.62.6, ms.section.63.2]
related: [ms.section.20.6, ms.section.35.5]
siblings_by_mechanism: []
relations:
  - {type: prerequisite_of, target: ms.section.6.4}
  - {type: prerequisite_of, target: ms.section.62.2}
  - {type: supported_by, target: paper.P50}
axes: {lifecycle: [evaluation], mechanism: [statistical_inference, resampling], feedback_setting: [], modality: [text]}
papers: [P50]
implementations: []
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, ASSUMED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1100
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 02.5 Statistical inference

## Scope

Objective: fix how a measured difference between two systems is turned into an interval and a decision: confidence intervals, the bootstrap and its resampling unit, paired tests, dependence, multiple comparisons, effect sizes, and power. Baseline: a point estimate with no interval, or an interval computed by resampling prompts that are not independent. Success: every reported comparison in the book names its experimental unit, its interval method, its pairing, its number of comparisons, and the effect it was powered to detect. Boundaries: which units exist (model, checkpoint, prompt, scaffold, endpoint) is [§06.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md); seed and task variance in context is [§06.4](../ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md); preference aggregation is [§62.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-2-pairwise-aggregation.md).

## Why this exists

What failed: benchmark differences of a point or two were reported as improvements without a variance model, and where intervals were given they treated every question as an independent draw. The bottleneck: questions in many evaluations are generated from shared templates, passages, or seeds, so the effective sample size is far smaller than the question count; and comparing two models on different question subsets throws away the pairing that would make small differences detectable. The dominant constraint: the number of *independent* units, not the number of rows. What changed: Miller frames evaluations as experiments in which "the inclusion of questions is non-independent" so that "a key assumption of the Central Limit Theorem (or a bootstrap) is violated", and supplies clustered and paired standard errors [PAPER-REPORTED · R2.7]; this section derives the same conclusions from Eq. 2.7 and fixes the resampling rule.

## Intuition

Physically, an evaluation is a Monte Carlo estimate (Eq. 2.8) of a population mean over a task distribution (Chapter 01). Its uncertainty comes from three sources at once — which units were drawn, which samples were drawn per unit at nonzero temperature, and which training seed produced the model — and Eq. 2.7 adds their variances. Resampling reproduces the variance of whatever it resamples: bootstrapping prompts reproduces prompt-draw variance only if prompts were the independent draws. Heuristically, ten paraphrases of one question are one question asked ten times.

## Formulation

> **Definition — experimental unit / bootstrap unit.** The smallest entity that is independently sampled from the population or independently assigned a treatment; the bootstrap resamples these units and nothing finer.

> **Definition — confidence interval (normal approximation).** For a mean of n independent unit scores s_i with sample standard deviation ŝ,

$$
\hat\mu \pm z_{1-\alpha/2}\,\frac{\hat s}{\sqrt{n}}, \qquad \operatorname{SE}_{\text{CLT}} = \sqrt{\frac{\operatorname{Var}(s)}{n}}
$$
*(Eq. 2.20)* where z_{1−α/2} = standard-normal quantile (1.96 at α = 0.05); the second expression is the form R2.7 states as its Eq. 1.

> **Definition — paired test.** For two systems A, B scored on the same units, inference on d_i = s_{A,i} − s_{B,i}:

$$
\operatorname{Var}(d) = \operatorname{Var}(s_A) + \operatorname{Var}(s_B) - 2\operatorname{Cov}(s_A, s_B), \qquad \operatorname{SE}_{\text{paired}} = \sqrt{\frac{\operatorname{Var}(d)}{n}}
$$
*(Eq. 2.21)* where the covariance is positive whenever both systems find the same units hard; R2.7 gives the second expression as its Eq. 7.

> **Definition — design effect.** For K clusters of m units each (n = Km) with intra-cluster correlation ρ,

$$
\operatorname{Var}(\hat\mu) = \frac{\sigma^2}{n}\big(1 + (m-1)\rho\big), \qquad \operatorname{DE} = 1 + (m-1)\rho, \qquad \rho = \frac{\sigma_a^2}{\sigma_a^2 + \sigma_e^2}
$$
*(Eq. 2.22)* where σ_a² = between-cluster variance, σ_e² = within-cluster variance, σ² = σ_a² + σ_e²; the per-unit iid formula understates the variance by the factor DE.

```figure
id: fig-2.25
kind: calculator
title: Design effect and interval width for clustered prompts
caption: >-
  Eq. 2.22 composed with the normal interval of Eq. 2.20, for K clusters of
  m prompts, intra-cluster correlation ρ and per-unit SD σ (0.5 is the
  Bernoulli worst case). DE is the factor by which a per-prompt variance
  understates the truth, √DE the factor by which its interval is too narrow,
  and K·m/DE the number of independent prompts the rows are worth; it tends
  to K/ρ, not K·m, as m grows. The two half-widths are the naive and the
  corrected 95 % interval. ρ values are ASSUMED, as in the worked statement.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.22", "DERIVED:eq-2.20"]
alt: >-
  Calculator composing Eq. 2.22 and Eq. 2.20 with inputs prompts per cluster
  m, intra-cluster correlation ρ, clusters K, nominal z and per-unit
  standard deviation σ. At ρ = 0, DE = 1: 500 rows from K = 50 clusters of
  m = 10 are worth 500 prompts and the 95 % half-width is 4.4 points either
  way. At m = 10, ρ = 0.5, the section's ASSUMED worked statement, DE = 5.5,
  the interval is 2.35 times too narrow, a nominal z = 2 becomes z ≈ 0.85,
  the 500 rows are worth about 91 prompts, and the half-width is 10.3 points
  instead of 4.4. At m = 25, ρ = 0.5 the naive half-width shrinks to 2.8
  points while the corrected one stays at 10.0 and the 1250 rows are worth
  about 96 prompts. At m = 25, ρ = 0.75, DE = 19, the interval is 4.36 times
  too narrow, the corrected half-width is 12.1 points and the rows are worth
  about 66 prompts.
spec:
  tex: >-
    \operatorname{DE} = 1 + (m-1)\rho,\qquad \hat\mu \pm z_{1-\alpha/2}\,\frac{\sigma}{\sqrt{n}}\sqrt{\operatorname{DE}},\qquad n = K m
  equation: "2.22"
  inputs:
    - { symbol: m, label: "prompts per cluster m", default: 10, min: 1, max: 50, step: 1, format: integer }
    - { symbol: rho, label: "intra-cluster correlation ρ", default: 0.5, min: 0, max: 1, step: 0.05, format: fixed2 }
    - { symbol: K, label: "clusters K", default: 50, min: 5, max: 500, options: [5, 10, 20, 50, 100, 200, 500], format: integer }
    - { symbol: z, label: "nominal z from a per-prompt SE", default: 2, min: 1, max: 4, step: 0.1, format: fixed2 }
    - { symbol: sigma, label: "per-unit SD σ (0.5 = Bernoulli at p = 0.5)", default: 0.5, min: 0.05, max: 0.5, step: 0.05, format: fixed2 }
  outputs:
    - { symbol: DE, label: "design effect DE", formula: "1 + (m - 1)*rho", format: fixed2, emphasis: true }
    - { symbol: w, label: "interval too narrow by √DE", formula: "sqrt(DE)", format: ratio }
    - { symbol: zt, label: "z after correction, z/√DE", formula: "z/w", format: fixed2 }
    - { symbol: neff, label: "independent prompts K·m/DE", formula: "K*m/DE", format: fixed1 }
    - { symbol: hwn, label: "95 % half-width, per-prompt (naive)", formula: "1.96*sigma/sqrt(K*m)", format: percent }
    - { symbol: hwc, label: "95 % half-width, corrected by √DE", formula: "hwn*w", format: percent }
states:
  - { anchor: formulation, label: "ρ = 0, independent", variables: { m: 10, rho: 0, K: 50, z: 2, sigma: 0.5 }, highlight: [DE, neff, hwn], note: "No template effect: DE = 1, Eq. 2.20 is right as written, 500 rows are 500 units, and the half-width is 4.4 points." }
  - { anchor: mechanism, label: "m = 10, ρ = 0.5", variables: { m: 10, rho: 0.5, K: 50, z: 2, sigma: 0.5 }, highlight: [DE, w, zt, hwc], note: "The worked statement: DE = 5.5, 'z = 2' is z ≈ 0.85, and the honest half-width is 10.3 points, not 4.4. 500 rows are worth 91 prompts." }
  - { anchor: experimental-design, label: "m = 25, ρ = 0.75", variables: { m: 25, rho: 0.75, K: 50, z: 2, sigma: 0.5 }, highlight: [DE, w, neff], note: "The far corner of Experiment 2.2's grid: DE = 19, intervals 4.4× too narrow, 1250 rows worth 66 prompts." }
  - { anchor: failure-modes, label: "more paraphrases, m = 25", variables: { m: 25, rho: 0.5, K: 50, z: 2, sigma: 0.5 }, highlight: [m, neff, hwn, hwc], note: "Wrong unit: m = 10 → 25 narrows the naive half-width 4.4 → 2.8 points; the corrected one barely moves, 10.3 → 10.0." }
```

> **Definition — effect size; statistical power.** Effect size is the difference in the metric's own unit (δ, e.g. accuracy points) or standardised (δ/s_d); power 1 − β is the probability of rejecting H₀ when the true effect is δ. The sample size to detect δ at two-sided level α with power 1 − β is

$$
n \approx \frac{\big(z_{1-\alpha/2} + z_{1-\beta}\big)^2\,\sigma_d^2}{\delta^2}
$$
*(Eq. 2.23)* where σ_d² = variance of the per-unit (paired) difference; R2.7's Eq. 9 has the same form with σ_d² expanded, by Eq. 2.7, into a between-question term plus within-question terms divided by the samples per question.

> **Assumption.** Unit scores have finite variance and clusters are exchangeable · *sensitivity:* with heavy-tailed scores (e.g. latency, reward) the normal approximation and the percentile bootstrap both under-cover; use the log scale or quantile-based effect sizes.

## Mechanism

**Why per-prompt resampling is wrong when prompts share a template.** Let K templates each generate m prompts and let the score be s_{kj} = μ + a_k + e_{kj} with a_k ∼ (0, σ_a²) the template effect and e_{kj} ∼ (0, σ_e²) the within-template noise. Then, by Eq. 2.7 with X = template, Var(μ̂) = σ_a²/K + σ_e²/(Km) = (σ²/n)(1 + (m−1)ρ). A bootstrap that resamples the n prompts individually produces replicates whose variance is σ²/n, because it treats the a_k as fixed and re-draws only across rows; it estimates the wrong quantity by exactly the factor DE [MATHEMATICALLY-DERIVED · DERIVED:eq-2.22]. Worked statement (ASSUMED inputs): m = 10 prompts per template and ρ = 0.5 give DE = 5.5, so the naive interval is too narrow by √5.5 ≈ 2.3×, and an effect that appears significant at "z = 2" is in fact at z ≈ 0.85. Resampling templates (clusters) with replacement, carrying all their prompts, reproduces σ_a²/K + σ_e²/(Km) because it re-draws the a_k [MATHEMATICALLY-DERIVED]. R2.7 arrives at the same place with its clustered standard error (its Eq. 4), which adds the within-cluster cross-covariances to SE²_CLT [PAPER-REPORTED · R2.7]. The same argument applies to seeds (one training seed is one cluster of all its evaluations), to repeated samples per prompt, and to questions built from one passage.

<details><summary>Derivation of Eq. 2.22</summary>

μ̂ = (1/Km) Σ_k Σ_j (μ + a_k + e_{kj}) = μ + (1/K) Σ_k a_k + (1/Km) Σ_{k,j} e_{kj}. The two sums are independent with variances σ_a²/K and σ_e²/(Km). Write σ² = σ_a² + σ_e², ρ = σ_a²/σ². Then σ_a²/K + σ_e²/(Km) = (σ²/(Km)) (mρ + (1 − ρ)) = (σ²/n)(1 + (m − 1)ρ).

</details>

**Pairing.** Eq. 2.21 says that scoring both systems on the same units and bootstrapping the differences removes the shared unit-difficulty variance; R2.7 states that "the naive comparison above misses an opportunity to reduce the standard error when two models evaluate the same set of questions" [PAPER-REPORTED · R2.7]. Worked statement (ASSUMED p = 0.5 for both systems, the worst case for a Bernoulli score): unpaired, SE of the difference is √(0.5/n), and Eq. 2.23 with α = 0.05, 1 − β = 0.8 (z sum ≈ 2.80) gives n ≈ 39,000 units per system to detect a 1-point (0.01) difference; paired with Cov = 0.125 (ρ_AB = 0.5), σ_d² = 0.25 and n ≈ 19,600 [MATHEMATICALLY-DERIVED · DERIVED:eq-2.23]. Both numbers are far above typical benchmark sizes, which is the quantitative content of "a one-point difference is noise unless shown otherwise". A paired sign-flip permutation test — randomly negate each d_i under the null of exchangeability within pairs — gives an exact p-value without a normality assumption at a cost of R permutations × O(n) [MATHEMATICALLY-DERIVED].

```figure
id: fig-2.26
kind: calculator
title: Units needed to detect a one-point difference
caption: >-
  Eq. 2.23 for two systems with Bernoulli scores at pass rate p, scored on
  the same units, with correlation ρ_AB between their per-unit scores. At the
  worked statement (p = 0.5, δ = 0.01, α = 0.05, power 0.8, z sum 2.80) an
  unpaired design needs 39,200 units per system and a paired one 19,600:
  pairing buys exactly 1/(1 − ρ_AB). Both are counts of independent units;
  with clustered units multiply by DE (Eq. 2.22). p and ρ_AB are ASSUMED;
  z₁₋β is rounded to 2 decimals as in the text.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.23", "DERIVED:eq-2.21"]
alt: >-
  Calculator for Eq. 2.23 with inputs effect δ, pass rate p, correlation
  ρ_AB of the two systems' unit scores, z_{1−α/2} and z_{1−β}. At the
  defaults δ = 0.01, p = 0.5, ρ_AB = 0.5, z_{1−α/2} = 1.96 and z_{1−β} = 0.84:
  unpaired σ_d² = 0.5 and paired σ_d² = 0.25; an unpaired comparison needs
  39,200 units per system, a paired one 19,600, a factor of 2. At δ = 0.02
  the counts are 9,800 and 4,900; at δ = 0.05, 1,568 and 784; at power 0.9
  (z = 1.28) and δ = 0.01, 52,488 and 26,244.
spec:
  tex: >-
    n \approx \frac{\big(z_{1-\alpha/2} + z_{1-\beta}\big)^{2}\,\sigma_d^{2}}{\delta^{2}},\qquad \sigma_d^{2} = 2p(1-p)(1-\rho_{AB})
  equation: "2.23"
  inputs:
    - { symbol: delta, label: "effect δ, accuracy as a fraction", default: 0.01, min: 0.005, max: 0.1, step: 0.005, format: percent }
    - { symbol: p, label: "pass rate p of both systems", default: 0.5, min: 0.05, max: 0.95, step: 0.05, format: fixed2 }
    - { symbol: rab, label: "correlation ρ_AB of unit scores", default: 0.5, min: 0, max: 0.95, step: 0.05, format: fixed2 }
    - { symbol: za, label: "z at α = 0.10, 0.05 or 0.01", default: 1.96, min: 1.645, max: 2.576, options: [1.645, 1.96, 2.576], format: fixed2 }
    - { symbol: zb, label: "z at power 0.8 or 0.9", default: 0.84, min: 0.84, max: 1.28, options: [0.84, 1.28], format: fixed2 }
  outputs:
    - { symbol: vu, label: "σ_d² unpaired, 2p(1 − p)", formula: "2*p*(1 - p)", format: fixed3 }
    - { symbol: vp, label: "σ_d² paired, 2p(1 − p)(1 − ρ_AB)", formula: "vu*(1 - rab)", format: fixed3 }
    - { symbol: nu, label: "units per system, unpaired", formula: "(za + zb)^2*vu/delta^2", format: integer }
    - { symbol: np, label: "units, paired", formula: "(za + zb)^2*vp/delta^2", format: integer, emphasis: true }
    - { symbol: gain, label: "unpaired ÷ paired", formula: "nu/np", format: ratio }
  presets:
    - { label: "δ = 2 points", values: { delta: 0.02 } }
    - { label: "δ = 5 points", values: { delta: 0.05 } }
    - { label: "power 0.9", values: { zb: 1.28 } }
```

**Multiple comparisons.** With m independent comparisons at level α, the probability of at least one false rejection is 1 − (1−α)^m (≈ 0.64 for m = 20, α = 0.05) [MATHEMATICALLY-DERIVED]. Bonferroni tests each at α/m (family-wise control, conservative under positive dependence); Holm's step-down is uniformly more powerful with the same guarantee; Benjamini–Hochberg controls the expected proportion of false rejections instead. A leaderboard with dozens of benchmarks and a report with dozens of ablations are both families.

**Bootstrap variants and cost.** The percentile bootstrap takes the α/2 and 1 − α/2 quantiles of R replicate statistics; BCa additionally corrects for bias and skew; the basic bootstrap reflects the percentile interval about the estimate. Agarwal et al. recommend "interval estimates of aggregate performance" via stratified bootstrap and "more robust and efficient aggregate metrics, such as interquartile mean scores" for few-run settings [PAPER-REPORTED · R2.16]; Bouthillier et al. report that "variance due to data sampling, parameter initialization and hyperparameter choice impact markedly the results" and recommend randomising many sources [PAPER-REPORTED · R2.17]. Cost: with per-unit scores cached, a replicate is an O(n) aggregation, so R = 10⁴ replicates is negligible against the one-time generation cost; when the statistic requires refitting (a scaling-law fit, §02.6) the cost is R × fit cost.

## Algorithm

```text
Algorithm 2.5 — Paired cluster bootstrap for a difference of means
INPUT   per-unit scores s_A[i], s_B[i] for i = 1..n; cluster label c[i] ∈ {1..K}; replicates R; level α; seed
OUTPUT  point estimate d̂; percentile interval [lo, hi]; SE_boot; K (independent units actually resampled)
STATE   list of cluster index sets; replicate array D[1..R]
INVARIANT every replicate contains exactly K clusters drawn with replacement, each carried whole;
          both systems are evaluated on the identical resampled unit multiset (pairing preserved)
1  d[i] ← s_A[i] − s_B[i]                                  # pair first
2  groups ← {k : indices i with c[i] = k}                   # K clusters
3  d̂ ← mean over all i of d[i]
4  for r = 1..R:
5      draw k_1..k_K from {1..K} with replacement (seeded)
6      idx ← concatenation of groups[k_1], …, groups[k_K]
7      D[r] ← mean of d[idx]                                # cluster-weighted by construction
8  lo, hi ← quantiles of D at α/2 and 1 − α/2
9  SE_boot ← standard deviation of D
10 return d̂, [lo, hi], SE_boot, K
```

Complexity: O(R·n) after O(n) grouping; memory O(n + R). Termination: R replicates. Reporting K is mandatory: an interval from K = 5 clusters is not a 95 % interval in any useful sense. Reference code and the coverage check are in [verification.md](verification.md) (Experiment 2.2), UNVERIFIED for version.

```figure
id: fig-2.27
kind: diagram
title: Paired cluster bootstrap and the unit it resamples
caption: >-
  Algorithm 2.5 with its one decision made explicit. Pairing happens first,
  on the rows; resampling happens second, on the clusters. The emphasised
  path draws K whole clusters per replicate and reproduces
  σ_a²/K + σ_e²/(Km); the dashed alternative draws rows and reproduces
  σ²/n, which understates the variance by exactly DE. The count K leaves
  the algorithm as an output, because an interval from K = 5 clusters is not
  a 95 % interval in any useful sense.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:alg-2.5", "DERIVED:eq-2.22"]
alt: >-
  Left-to-right diagram of Algorithm 2.5. Per-unit scores s_A[i] and s_B[i]
  for the same n units are differenced first, d = s_A − s_B (line 1), and
  the point estimate d̂ is their mean. Cluster labels c[i] (template,
  passage or seed ids) group the differences into K index sets (line 2). A
  branch asks which unit is drawn. The emphasised path draws K clusters with
  replacement, seeded and carried whole (lines 5–6), takes the replicate
  mean D[r] at O(n) per replicate (line 7), loops R times, and returns the
  percentile interval and SE_boot (lines 8–9); its variance is
  σ_a²/K + σ_e²/(Km). The dashed alternative resamples rows, each prompt as
  its own cluster, and reproduces σ²/n, too small by DE. K is reported with
  the interval.
spec:
  direction: LR
  nodes:
    - { id: sa, kind: tensor, label: "scores s_A[i]", sub: "[n]" }
    - { id: sb, kind: tensor, label: "scores s_B[i]", sub: "[n], the same units" }
    - { id: c, kind: dataset, label: "cluster labels c[i]", sub: "template, passage or seed id" }
    - { id: d, kind: process, label: "pair first: d = s_A − s_B", sub: "line 1" }
    - { id: dhat, kind: metric, label: "point estimate d̂", sub: "mean of d, line 3" }
    - { id: g, kind: process, label: "group by cluster", sub: "K index sets, line 2" }
    - { id: br, kind: branch, label: "which unit is drawn?" }
    - { id: draw, kind: process, label: "draw K clusters with replacement", sub: "seeded; each carried whole, lines 5–6" }
    - { id: rep, kind: process, label: "replicate mean D[r]", sub: "O(n) per replicate, line 7" }
    - { id: out, kind: metric, label: "percentile interval and SE_boot", sub: "lines 8–9; Var = σ_a²/K + σ_e²/(Km)", emphasis: true }
    - { id: k, kind: metric, label: "K, reported with the interval", sub: "independent units actually resampled" }
    - { id: rows, kind: dependency, label: "rows as units: each prompt its own cluster", sub: "reproduces σ²/n, too small by DE" }
  edges:
    - { from: sa, to: d }
    - { from: sb, to: d }
    - { from: d, to: dhat }
    - { from: d, to: g }
    - { from: c, to: g, kind: dependency, label: "labels" }
    - { from: g, to: br }
    - { from: br, to: draw, kind: emphasis, label: "clusters" }
    - { from: draw, to: rep, kind: emphasis }
    - { from: rep, to: draw, kind: feedback, label: "r = 1..R" }
    - { from: rep, to: out, kind: emphasis }
    - { from: g, to: k, kind: dependency }
    - { from: br, to: rows, kind: dependency, label: "rows: wrong unit" }
```

## Implementation

There is no tensor computation here beyond caching per-unit scores as arrays indexed by (system, unit, sample). The costly part is producing the scores once per system — a generation per unit per sample per system, priced in Chapter 42 — after which every statistic in this section is CPU work. Evaluation harnesses must record the cluster label (template id, passage id, seed) with every score, or Algorithm 2.5 cannot be run afterwards; P50's scenario-and-metric structure is an example of a design in which the scenario is a natural cluster [PAPER-REPORTED · P50].

## Experimental design

### Experiment 2.2 (summary; full protocol in verification.md) — Coverage of per-prompt versus per-cluster bootstrap

Hypothesis: on a synthetic clustered population with known ρ, per-prompt percentile intervals cover the true difference at a rate well below nominal while cluster intervals cover at nominal within Monte Carlo error. Setup: simulate K templates × m prompts, paired scores with a known δ; run Algorithm 2.5 with cluster labels and with each prompt as its own cluster; repeat over many synthetic populations. Independent variables: ρ ∈ {0, 0.25, 0.5, 0.75}, m ∈ {1, 5, 10, 25}. Metrics: empirical coverage, mean interval width. Expected result: coverage of the per-prompt method falls with DE; cluster method stays at 1 − α. Threats: the simulation's score model may be simpler than real evaluations. Not run.

```figure
id: fig-2.28
kind: chart
title: Predicted coverage of a nominal 95 % per-prompt interval
caption: >-
  What Experiment 2.2 should see if Eq. 2.22 holds, drawn before it is run:
  an interval computed as if prompts were independent is √DE too narrow, so
  its coverage is 2Φ(1.96/√DE) − 1. At m = 10, ρ = 0.5 (DE = 5.5) a nominal
  95 % interval covers about 60 % of the time; at m = 25, ρ = 0.75 about
  35 %. Cluster resampling is predicted to hold 95 % at large K. Derived for
  the mean of clustered scores; for a paired difference the relevant ρ is
  that of d_i, not of the scores. A prediction, not a result.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.22", "DERIVED:eq-2.20"]
alt: >-
  Line chart of predicted coverage, 2Φ(1.96/√DE) − 1 with DE = 1 + (m − 1)ρ,
  against intra-cluster correlation ρ from 0 to 0.9, for per-prompt intervals
  at m = 5, 10 and 25 prompts per cluster, with a dashed line at 0.95 for
  cluster resampling at large K and for m = 1. At ρ = 0 every line is 0.95.
  m = 5 falls to 0.742 at ρ = 0.5 and 0.639 at ρ = 0.9. m = 10 falls to
  0.597 at ρ = 0.5 and 0.484 at ρ = 0.9. m = 25 falls to 0.413 at ρ = 0.5
  and 0.320 at ρ = 0.9.
spec:
  type: line
  x: { label: "intra-cluster correlation ρ", scale: linear, format: fixed2, domain: [0, 0.9] }
  y: { label: "coverage of a nominal 95 % interval", scale: linear, format: percent, domain: [0.3, 1] }
  series:
    - { id: nominal, label: "cluster resampling, large K; or m = 1", points: [[0, 0.95], [0.9, 0.95]], dashed: true }
    - { id: m5, label: "per-prompt, m = 5", points: [[0, 0.95], [0.1, 0.902], [0.2, 0.856], [0.3, 0.814], [0.4, 0.776], [0.5, 0.742], [0.6, 0.712], [0.7, 0.685], [0.8, 0.661], [0.9, 0.639]] }
    - { id: m10, label: "per-prompt, m = 10", points: [[0, 0.95], [0.1, 0.845], [0.2, 0.759], [0.3, 0.692], [0.4, 0.639], [0.5, 0.597], [0.6, 0.562], [0.7, 0.532], [0.8, 0.506], [0.9, 0.484]], emphasis: true }
    - { id: m25, label: "per-prompt, m = 25", points: [[0, 0.95], [0.1, 0.712], [0.2, 0.584], [0.3, 0.506], [0.4, 0.453], [0.5, 0.413], [0.6, 0.383], [0.7, 0.358], [0.8, 0.337], [0.9, 0.32]] }
  annotations:
    - { x: 0.5, label: "m = 10, DE = 5.5: ≈ 60 %" }
```

## Observations

**What the paper claims.** R2.7 reports clustered and paired standard errors and a power formula for evaluations; R2.16 recommends stratified bootstrap intervals and interquartile means; R2.17 reports that seed, data, and hyperparameter variance materially affect benchmark conclusions; P50 reports a multi-scenario, multi-metric evaluation design [PAPER-REPORTED].

**What the evidence shows.** The design-effect and pairing identities are theorems (Eq. 2.21–2.22). That real evaluations have ρ > 0 within templates or passages is reported by R2.7 as the reason for clustering and has not been independently quantified here [PAPER-REPORTED].

**What we infer.** The book infers (DERIVED) that most benchmark differences of one or two points at typical sizes are not resolvable at conventional power, and (ASSUMED) that ρ within template families is large enough to matter; both inferences are testable by Experiment 2.2 and by recording cluster labels in harnesses.

**What remains unknown.** The resampling unit and variance model behind vendor-reported intervals are NOT-DISCLOSED in the reports inspected; typical ρ values on named benchmarks are UNVERIFIED.

## Failure modes

> **Failure mode — wrong resampling unit.** *Symptom:* intervals that shrink with the number of paraphrases or samples per prompt. *Cause:* rows, not independent units, resampled. *Detection:* compute DE from a variance decomposition; intervals should not narrow when m grows with K fixed. *Mitigation:* Algorithm 2.5 with cluster labels.

> **Failure mode — unpaired comparison of paired data.** *Symptom:* wide intervals despite identical prompt sets. *Cause:* Eq. 2.21's covariance term discarded. *Detection:* compare SE_paired and unpaired SE. *Mitigation:* difference first, then resample.

> **Failure mode — garden of forking paths.** *Symptom:* one significant result among many configurations. *Cause:* m comparisons at nominal α. *Detection:* count the family. *Mitigation:* preregistration ([§06.6](../ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md)), Holm or FDR control.

> **Failure mode — bootstrap on too few clusters or on extremes.** *Symptom:* intervals with K < ~10 that are erratic across seeds; percentile intervals for a maximum or a tail quantile that exclude the true value. *Cause:* the bootstrap distribution is a poor approximation for small K or for non-smooth statistics. *Detection:* vary the bootstrap seed; compare with a permutation test. *Mitigation:* report K; use exact or permutation methods; avoid bootstrapping a max.

## Siblings

**Normal-approximation interval** — this file, Eq. 2.20. Why it exists: closed form. What assumption changed: CLT applies to the unit mean. New failure mode: small n, skew, dependence. Changed primitive: none.

**Percentile bootstrap** — this file. Why it exists: no distributional form needed. What assumption changed: the empirical distribution of units stands in for the population. New failure mode: bias and skew uncorrected; non-smooth statistics. Changed primitive: analytic SE → resampled quantiles.

**BCa bootstrap** — this file. Why it exists: correct percentile bias and acceleration. What assumption changed: a jackknife acceleration estimate is available. New failure mode: cost n extra evaluations for the jackknife; instability at small K.

**Paired permutation (sign-flip) test** — this file. Why it exists: exact inference under exchangeability. What assumption changed: exchangeability within pairs instead of a distribution. What problem it solved: valid p-values at small n. New failure mode: it tests, it does not estimate; no interval without inversion.

**Clustered standard error** — [R2.7], this file. Why it exists: analytic alternative to the cluster bootstrap. Changed primitive: resampling → cross-covariance sum.

**Stratified bootstrap with interquartile mean** — [R2.16]; applied in [§63.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-2-repeated-run-reliability.md). Why it exists: few runs per task, many tasks. What objective changed: robust aggregate instead of mean. New failure mode: the IQM is not the mean the deployment pays for.

```figure
id: fig-2.29
kind: compare
title: Interval methods for a difference of means, by assumption and cost
caption: >-
  Six ways to put an interval or a test on the same cached per-unit scores.
  The "resampled or summed unit" row is where the section's rule applies to
  every column alike: whichever method is used, it must operate on the
  independent unit. The cost row shows why the choice is cheap to get right:
  once scores are cached, even 10⁴ replicates are O(R·n) CPU work against a
  one-time generation cost.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.20", "DERIVED:eq-2.21", R2.7, R2.16]
alt: >-
  Comparison of six interval methods for a difference of means over n units
  in K clusters. Normal approximation (Eq. 2.20): returns μ̂ ± z·ŝ/√n;
  assumes the CLT on independent units; O(n); fails at small n, under skew
  and dependence. Percentile bootstrap: quantiles of R replicates; the
  empirical unit distribution stands in for the population; O(R·n); fails
  under bias, skew and non-smooth statistics. BCa bootstrap: bias- and
  skew-corrected quantiles; needs a jackknife acceleration estimate; O(R·n)
  plus n jackknife evaluations; unstable at small K. Paired sign-flip
  permutation: an exact p-value under exchangeability within pairs; O(R·n);
  tests but does not estimate. Clustered standard error (R2.7): analytic SE
  with within-cluster cross-covariances; O(n). Stratified bootstrap with
  interquartile mean (R2.16): an interval on the IQM for few runs per task;
  O(R·n); the IQM is not the mean a deployment pays for.
spec:
  axis: >-
    What each method assumes about n units in K clusters, what it returns,
    and what it costs once per-unit scores are cached; coverage is not ranked
  columns:
    - { id: normal, label: "Normal approximation (Eq. 2.20)", node: ms.section.2.5 }
    - { id: pct, label: "Percentile bootstrap" }
    - { id: bca, label: "BCa bootstrap" }
    - { id: perm, label: "Paired sign-flip permutation" }
    - { id: cse, label: "Clustered SE (R2.7)" }
    - { id: iqm, label: "Stratified bootstrap + IQM (R2.16)", node: ms.section.63.2 }
  rows:
    - { dimension: "returns", values: { normal: "μ̂ ± z·ŝ/√n", pct: "α/2 and 1 − α/2 quantiles of R replicates", bca: "bias- and skew-corrected quantiles", perm: "an exact p-value; no interval without inversion", cse: "analytic SE including within-cluster cross-covariances", iqm: "an interval on the interquartile mean" } }
    - { dimension: "assumes", values: { normal: "CLT on the unit mean; independent units", pct: "the empirical distribution of units stands in for the population", bca: "a jackknife acceleration estimate is available", perm: "exchangeability within pairs", cse: "independent clusters with recorded labels", iqm: "few runs per task, many tasks" } }
    - { dimension: "resampled or summed unit", values: { normal: "none: analytic", pct: "the independent unit, whole clusters", bca: "the independent unit", perm: "the sign of each paired d_i", cse: "clusters, analytically", iqm: "runs within each task (stratum)" } }
    - { dimension: "cost after scores are cached", values: { normal: "O(n)", pct: "O(R·n)", bca: "O(R·n) + n jackknife evaluations", perm: "O(R·n)", cse: "O(n)", iqm: "O(R·n)" } }
    - { dimension: "new failure mode", values: { normal: "small n, skew, dependence", pct: "bias, skew; non-smooth statistics such as a max", bca: "instability at small K", perm: "tests, does not estimate", cse: "not stated in this section", iqm: "the IQM is not the mean the deployment pays for" } }
```

## Extensions

For agents the unit is an episode, and repeated episodes of one task are a cluster ([§63.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-2-repeated-run-reliability.md)). For preference data the unit is a pairwise judgement nested in a prompt and a rater; the aggregation model of [§62.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-2-pairwise-aggregation.md) must cluster on both. For latency SLOs the statistic is a quantile and the interval methods here apply only to the quantile estimator, not to the mean (Chapter 48). Proposals are marked there.

## Limitations

Eq. 2.22 assumes equal cluster sizes and a single clustering level; unequal sizes and crossed clusterings (prompt × seed) need the general clustered estimator or a nested bootstrap. Eq. 2.23 is a normal-approximation planning formula; it is not a guarantee. Falsification: Experiment 2.2 showing nominal coverage for per-prompt resampling at ρ > 0 would falsify the design-effect argument as applied; it cannot, since the derivation is exact, but it would reveal an error in the simulation.

## Reproducibility

Symbols: s_i, d_i, ρ, DE, σ_a², σ_e², K, m, R, α, β, δ (local). Every reported interval must state: unit, cluster label, n and K, method (normal, percentile, BCa, permutation), R and seed, pairing, and the family size for multiple comparisons. No code was executed in this edition.

## References

P50, R2.2, R2.7, R2.16, R2.17. See [references.md](references.md).
