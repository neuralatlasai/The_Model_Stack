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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 02.5 Statistical inference

## Scope

Statistical inference links an estimand to a sample, a variance model, and an interval or test. Relevant choices include the independent sampling unit, pairing, clustering, bootstrap construction, multiplicity, effect size, and power. Evaluation units are developed in [§06.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md), repeated-run uncertainty in [§06.4](../ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md), and preference aggregation in [§62.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-2-pairwise-aggregation.md).

## Why this exists

Shared passages, templates, prompts, or training runs can induce covariance between observed rows. The variance of an average then includes covariance terms, and the row count alone does not determine precision. Evaluating two systems on the same units also introduces a cross-system covariance that changes the variance of their difference. Miller develops clustered and paired standard errors for these settings [PAPER-REPORTED · R2.7, §§2.2,4.2]. The resulting corrections quantify measurement precision; they do not change the systems' observed scores.

## Intuition

A fixed benchmark mean is a deterministic summary after scores are recorded. Treating it as an estimate of a population quantity requires a sampling model. Prompt sampling, repeated generations, and training seeds can contribute different conditional variance terms. A bootstrap resamples the specified independent units and preserves the dependence carried inside each unit; its nominal coverage remains an approximation that must be assessed in the relevant regime [MATHEMATICALLY-DERIVED · DERIVED:eq-2.7; DERIVED:eq-2.22; PAPER-REPORTED · R2.16, §4.1].

## Formulation

> **Definition — bootstrap unit.** The independently sampled unit reproduced by a resampling scheme for a specified estimand. Canonical experimental-unit and treatment-assignment distinctions are developed in [§06.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md); this section owns their statistical consequences.

> **Definition — confidence interval (normal approximation).** For a mean of n iid unit scores s_i with finite variance and sample standard deviation ŝ,

$$
\hat\mu \pm z_{1-\alpha/2}\,\frac{\hat s}{\sqrt{n}}, \qquad \operatorname{SE}_{\text{CLT}} = \sqrt{\frac{\operatorname{Var}(s)}{n}}
$$
*(Eq. 2.20)* where z_{1−α/2} = standard-normal quantile (1.96 at α = 0.05); the second expression is the form R2.7 states as its Eq. 1.

> **Definition — paired test.** For two systems A, B scored on the same units, inference on d_i = s_{A,i} − s_{B,i}:

$$
\operatorname{Var}(d) = \operatorname{Var}(s_A) + \operatorname{Var}(s_B) - 2\operatorname{Cov}(s_A, s_B), \qquad \operatorname{SE}_{\text{paired}} = \sqrt{\frac{\operatorname{Var}(d)}{n}}
$$
*(Eq. 2.21)* where positive covariance quantifies a shared score component; it must be estimated rather than inferred solely from using the same units; R2.7 gives the second expression as its Eq. 7.

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

> **Assumption.** Unit scores have finite variance and the resampled clusters are independent and identically distributed · *sensitivity:* finite-sample coverage can deteriorate with skew, heavy tails, few independent units, or an unsuitable estimator. A log transformation changes the estimand and cannot be prescribed without that change being stated.

## Mechanism

### Methodology

**Why per-prompt resampling is wrong when prompts share a template.** Let K templates each generate m prompts and let the score be s_{kj} = μ + a_k + e_{kj} with a_k ∼ (0, σ_a²) the template effect and e_{kj} ∼ (0, σ_e²) the within-template noise. Then, by Eq. 2.7 with X = template, Var(μ̂) = σ_a²/K + σ_e²/(Km) = (σ²/n)(1 + (m−1)ρ). A bootstrap that resamples the n prompts individually produces replicates whose variance is σ²/n, because it treats the a_k as fixed and re-draws only across rows; under this equal-size random-effects model, its asymptotic variance target differs by DE; finite-sample bootstrap variance need not equal that ratio exactly [MATHEMATICALLY-DERIVED · DERIVED:eq-2.22]. Worked statement (ASSUMED inputs): m = 10 prompts per template and ρ = 0.5 give DE = 5.5, so the naive interval is too narrow by √5.5 ≈ 2.3×, and an effect that appears significant at "z = 2" is in fact at z ≈ 0.85. Resampling templates (clusters) with replacement, carrying all their prompts, reproduces σ_a²/K + σ_e²/(Km) because it re-draws the a_k [MATHEMATICALLY-DERIVED]. R2.7 arrives at the same place with its clustered standard error (its Eq. 4), which adds the within-cluster cross-covariances to SE²_CLT [PAPER-REPORTED · R2.7]. The same argument applies to seeds (one training seed is one cluster of all its evaluations), to repeated samples per prompt, and to questions built from one passage.

<details><summary>Derivation of Eq. 2.22</summary>

μ̂ = (1/Km) Σ_k Σ_j (μ + a_k + e_{kj}) = μ + (1/K) Σ_k a_k + (1/Km) Σ_{k,j} e_{kj}. The two sums are independent with variances σ_a²/K and σ_e²/(Km). Write σ² = σ_a² + σ_e², ρ = σ_a²/σ². Then σ_a²/K + σ_e²/(Km) = (σ²/(Km)) (mρ + (1 − ρ)) = (σ²/n)(1 + (m − 1)ρ).

</details>

**Pairing.** Eq. 2.21 says that scoring both systems on the same units and bootstrapping the differences removes the shared unit-difficulty variance; R2.7 states that "the naive comparison above misses an opportunity to reduce the standard error when two models evaluate the same set of questions" [PAPER-REPORTED · R2.7]. Worked statement (ASSUMED p = 0.5 for both systems, the worst case for a Bernoulli score): unpaired, SE of the difference is √(0.5/n), and Eq. 2.23 with α = 0.05, 1 − β = 0.8 (z sum ≈ 2.80) gives n ≈ 39,000 units per system to detect a 1-point (0.01) difference; paired with Cov = 0.125 (ρ_AB = 0.5), σ_d² = 0.25 and n ≈ 19,600 [MATHEMATICALLY-DERIVED · DERIVED:eq-2.23]. These numbers apply only to the chosen discordance/covariance model; near-identical paired outputs can have much smaller difference variance. No universal minimum detectable difference follows from benchmark size alone. A paired sign-flip permutation test — randomly negate each d_i under the null of exchangeability within pairs — gives a finite randomization reference under a sharp paired-exchangeability null; Monte Carlo sampling approximates the exhaustive reference at O(Rn) work, using an exceedance-count correction [MATHEMATICALLY-DERIVED].

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

**Multiple comparisons.** With m independent comparisons at level α, the probability of at least one false rejection is 1 − (1−α)^m (≈ 0.64 for m = 20, α = 0.05) [MATHEMATICALLY-DERIVED]. Bonferroni tests each at α/m (family-wise control, conservative under positive dependence); Holm step-down retains family-wise control under arbitrary dependence when the individual p-values are valid; Benjamini–Hochberg targets false-discovery rate under independence or specified positive-dependence conditions, not arbitrary dependence. A leaderboard with dozens of benchmarks and a report with dozens of ablations are both families.

**Bootstrap variants and cost.** The percentile bootstrap takes the α/2 and 1 − α/2 quantiles of R replicate statistics; BCa additionally corrects for bias and skew; the basic bootstrap reflects the percentile interval about the estimate. Agarwal et al. recommend "interval estimates of aggregate performance" via stratified bootstrap and "more robust and efficient aggregate metrics, such as interquartile mean scores" for few-run settings [PAPER-REPORTED · R2.16]; Bouthillier et al. report that "variance due to data sampling, parameter initialization and hyperparameter choice impact markedly the results" and recommend randomising many sources [PAPER-REPORTED · R2.17]. Cost: with per-unit scores cached, a replicate is an O(n) aggregation, so R = 10⁴ replicates is negligible against the one-time generation cost; when the statistic requires refitting (a scaling-law fit, §02.6) the cost is R × fit cost.

### Estimand, unequal clusters, and test construction

Let independent clusters be $k=1,\ldots,K$, with cluster size $n_k$, paired score sum $t_k=\sum_jd_{kj}$, and row count $n=\sum_kn_k$. A row-weighted mean is $\hat\delta=\sum_kt_k/n$; an equal-cluster mean is $K^{-1}\sum_kt_k/n_k$. These are different population targets when cluster size is informative. Resampling clusters uniformly and carrying their rows intact produces a ratio of resampled sums and counts, estimating the former under an iid-cluster sampling model. Averaging cluster means instead estimates the latter. The bootstrap algorithm must preserve the selected numerator and denominator, rather than silently switching weighting [MATHEMATICALLY-DERIVED · DERIVED:eq-2.21].

For the ratio target, define $u_k=t_k-\hat\delta n_k$. A cluster-robust plug-in standard error is

$$
\widehat{\mathrm{SE}}^2_{\rm cluster}
=\frac{K}{K-1}\frac{\sum_{k=1}^Ku_k^2}{n^2}.
$$
*(Eq. 2.30)* Independent clusters, a finite second moment of cluster contributions, and a nondegenerate denominator justify a many-cluster approximation. For singleton clusters it reduces to the usual sample-mean SE. For equal-size clusters it is the SE of their mean scores. Crossed dependencies, such as the same annotator appearing in unrelated prompt clusters, violate this one-way independence model; merely nesting labels cannot repair a crossed design [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27].

For paired binary scores, each difference is in $\{-1,0,1\}$. Let $p_+$ and $p_-$ be probabilities of the two discordant outcomes. Then $\delta=p_+-p_-$ and $\mathrm{Var}(d)=p_++p_--\delta^2$. Power depends on discordance, not only the two marginal accuracies. Under a sharp null making signs exchangeable among discordant independent pairs, their positive count is binomial with probability one-half conditional on the discordant count. For clustered data, rowwise sign flips are generally invalid; the randomization unit must match the assignment or justified joint symmetry [MATHEMATICALLY-DERIVED · DERIVED:eq-2.21].

A confidence interval is a random set whose repeated-sampling coverage is a property of the procedure and sampling model. It is not a posterior probability that a fixed unknown parameter lies in the realized interval. A nonzero interval for a metric difference also does not establish practical value; compare its range with a prespecified meaningful-effect threshold. Conversely, an interval overlapping zero need not establish equivalence. Equivalence requires a stated margin and a procedure aimed at excluding effects outside it [MATHEMATICALLY-DERIVED · DERIVED:eq-2.20].

### Bootstrap variants, multiplicity, and power

Given bootstrap replicates $d_1^*,\ldots,d_R^*$, let $q_u^*$ be their empirical $u$-quantile. The percentile interval is $[q_{\alpha/2}^*,q_{1-\alpha/2}^*]$; the basic interval is $[2\hat\delta-q_{1-\alpha/2}^*,2\hat\delta-q_{\alpha/2}^*]$. BCa modifies quantile levels using a bias term $z_0=\Phi^{-1}(R^{-1}\sum_r\mathbf1[d_r^*<\hat\delta])$ and a jackknife acceleration $a=\sum_k(\bar d_{(-\cdot)}-d_{(-k)})^3/[6\{\sum_k(\bar d_{(-\cdot)}-d_{(-k)})^2\}^{3/2}]$. Its adjusted level is $\Phi\{z_0+(z_0+z_u)/[1-a(z_0+z_u)]\}$. Delete-one operations must delete the independent resampling unit. Degenerate jackknife variation, infinite $z_0$, or a near-zero denominator makes this construction unstable; the method name does not guarantee coverage [MATHEMATICALLY-DERIVED · DERIVED:eq-2.20].

For $m$ valid null p-values, Bonferroni family-wise control follows directly from the union bound: $\Pr(\cup_i\{p_i\le\alpha/m\})\le\sum_i\alpha/m=\alpha$, without independence. Holm orders p-values and tests $p_{(j)}\le\alpha/(m-j+1)$ until the first failure. Sorting costs $O(m\log m)$ with constant-cost numeric comparison. Benjamini–Hochberg instead finds the largest $j$ with $p_{(j)}\le jq/m$ and rejects that prefix; its FDR guarantee requires its dependence conditions. Selecting a winning configuration before declaring the comparison family changes the inference problem and is not cured by bootstrapping only the winner [MATHEMATICALLY-DERIVED · DERIVED:eq-2.20].

Equation 2.23 uses a normal planning approximation to a paired mean. It needs a plausible difference variance, target effect, significance level, and desired power, all chosen before inspecting the decisive comparison. Clustering changes that variance and the available independent-unit count. Repeated generations reduce within-prompt noise but not the between-prompt term. Uncertainty in the variance estimate makes power itself uncertain; a range of plausible variances is more defensible than reporting one exact required sample count [MATHEMATICALLY-DERIVED · DERIVED:eq-2.23].

For the mean-difference bootstrap, preaggregate each cluster into $(t_k,n_k)$. Each replicate samples $K$ cluster indices and sums those two arrays, so its time is $O(K)$ and total time $O(n+RK)$, with $O(K+R)$ auxiliary storage. This preserves unequal-size row weighting without concatenating every sampled row. Refitting statistics have a different cost, as do BCa jackknife refits. Evaluation generation is outside this cached-score boundary; no extra model parameters or training tokens are introduced. Energy, money, and elapsed runtime remain UNVERIFIED without executing the stated workload [MATHEMATICALLY-DERIVED · DERIVED:eq-2.30].

## Algorithm

```text
Algorithm 2.5 — Paired cluster bootstrap for a difference of means
INPUT   per-unit scores s_A[i], s_B[i] for i = 1..n; cluster label c[i] ∈ {1..K}; replicates R; level α; seed
OUTPUT  point estimate d̂; percentile interval [lo, hi]; SE_boot; K (independent units actually resampled)
STATE   list of cluster index sets; replicate array D[1..R]
INVARIANT every replicate contains exactly K clusters drawn with replacement, each carried whole;
          both systems are evaluated on the identical resampled unit multiset (pairing preserved)
1  d[i] ← s_A[i] − s_B[i]                                  # pair first
2  preaggregate score_sum[k] = Σ_{i:c[i]=k} d[i], count[k] = number of such rows
3  d̂ ← mean over all i of d[i]
4  for r = 1..R:
5      draw k_1..k_K from {1..K} with replacement (seeded)
6      numerator ← Σ_j score_sum[k_j]; denominator ← Σ_j count[k_j]
7      D[r] ← numerator / denominator                      # preserves row-weighted estimand
8  lo, hi ← quantiles of D at α/2 and 1 − α/2
9  SE_boot ← standard deviation of D
10 return d̂, [lo, hi], SE_boot, K
```

Complexity: O(n + R·K) with preaggregated cluster sums/counts; auxiliary memory O(K + R). Termination: R replicates. Reporting K is mandatory: with very few clusters, nominal percentile coverage is not guaranteed and may be poor; report the observed count and the limitations rather than treating the confidence label as a validation. Reference code and the coverage check are in [verification.md](verification.md) (Experiment 2.2), UNVERIFIED for version.

```figure
id: fig-2.27
kind: diagram
title: Paired cluster bootstrap and the unit it resamples
caption: >-
  Algorithm 2.5 with its one decision made explicit. Pairing happens first,
  on the rows; resampling happens second, on the clusters. The emphasised
  path draws K whole clusters per replicate and reproduces
  σ_a²/K + σ_e²/(Km); the dashed alternative draws rows and reproduces
  σ²/n, which targets a variance smaller by DE in the equal-size random-effects model. The count K leaves
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
  its own cluster, and targets σ²/n asymptotically, too small by DE in that model. K is reported with
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
    - { id: rows, kind: dependency, label: "rows as units: each prompt its own cluster", sub: "targets σ²/n asymptotically, too small by DE in that model" }
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

There is no tensor computation here beyond caching per-unit scores as arrays indexed by (system, unit, sample). The costly part is producing the scores once per system — a generation per unit per sample per system, priced in Chapter 42 — after which statistical computation is over the cached score arrays; CPU execution is one implementation choice. Evaluation harnesses must record the cluster label (template id, passage id, seed) with every score, or Algorithm 2.5 cannot be run afterwards; P50 separates scenarios and metrics, but a scenario label alone does not establish independence or a bootstrap sampling unit [PAPER-REPORTED · P50].

## Experimental design

### Reported experiments

R2.7 Table 4 analyzes shared-question groups in DROP, RACE-H, and MGSM using Anthropic model scores. Its reported clustered-to-naive standard-error ratios are 3.05, 1.10, and 1.88, respectively; the fictional model tables elsewhere in that paper are not experimental evidence. This comparison isolates interval construction on the same scores, not a model-quality improvement. Model identities, seeds, and a reproducible runtime configuration are NOT-DISCLOSED for Table 4 [PAPER-REPORTED · R2.7, §2.2; Table 4].

R2.16 §3 evaluates five algorithms on 26 Atari 100k games with 100 runs each and 100 evaluation episodes per run. Subsampling studies the few-run regime. Its confidence-interval study compares bootstrap constructions against a 200-run DER reference; §4.1 and Figure 6 report better percentile coverage at ten runs and undercoverage at three. That evidence concerns fixed-task stratified run resampling; it does not establish unconditional coverage for an arbitrary prompt-cluster bootstrap [PAPER-REPORTED · R2.16, §§3–4.1; Figure 6; Appendix A.5].

R2.17 examines data, initialization, and hyperparameter variation in supervised-learning pipelines; its experimental design varies these sources rather than treating one fixed checkpoint's test rows as the whole uncertainty budget [PAPER-REPORTED · R2.17, §§2–4]. Proposed book coverage simulations and their acceptance thresholds are kept in [verification.md](verification.md).

## Observations

The covariance identity for paired differences and the random-effects design effect identify different sources of precision. Pairing can remove a shared difficulty component; clustering restores covariance omitted by an iid-row calculation. Neither formula assigns a universal correlation or minimum detectable difference to every benchmark [MATHEMATICALLY-DERIVED · DERIVED:eq-2.21; DERIVED:eq-2.22].

Miller's same-score comparison changes standard errors rather than model capability. Agarwal et al. additionally change aggregation and examine repeated-run/subsampling behavior. Their reported coverage and aggregate comparisons apply to the named tasks, run budgets, and statistics, rather than establishing finite-sample coverage for every resampling scheme [PAPER-REPORTED · R2.7, Table 4; R2.16, §§3–4].

Paired scores, dependency labels, estimand weights, and independent-unit counts determine which uncertainty calculation can be reconstructed. Model identities and runtime details absent from R2.7 Table 4 remain NOT-DISCLOSED; no coverage simulation or independent reproduction was executed for this chapter.

## Failure modes

> **Failure mode — wrong resampling unit.** *Symptom:* intervals that shrink with the number of paraphrases or samples per prompt. *Cause:* rows, not independent units, resampled. *Detection:* compute DE from a variance decomposition; the within-cluster term can shrink with m, but the between-cluster variance approaches σ_a²/K with K fixed. *Mitigation:* Algorithm 2.5 with cluster labels.

> **Failure mode — unpaired comparison of paired data.** *Symptom:* wide intervals despite identical prompt sets. *Cause:* Eq. 2.21's covariance term discarded. *Detection:* compare SE_paired and unpaired SE. *Mitigation:* difference first, then resample.

> **Failure mode — garden of forking paths.** *Symptom:* one significant result among many configurations. *Cause:* m comparisons at nominal α. *Detection:* count the family. *Mitigation:* preregistration ([§06.6](../ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md)), Holm or FDR control.

> **Failure mode — bootstrap on too few clusters or on extremes.** *Symptom:* intervals with K < ~10 that are erratic across seeds; percentile intervals for a maximum or a tail quantile that exclude the true value. *Cause:* the bootstrap distribution is a poor approximation for small K or for non-smooth statistics. *Detection:* vary the bootstrap seed; compare with a permutation test. *Mitigation:* report K; use exact or permutation methods; avoid bootstrapping a max.

## Siblings

A normal interval estimates uncertainty through an analytic standard error and an asymptotic reference distribution. Percentile and basic bootstrap intervals instead transform empirical resampling quantiles. BCa changes the quantile levels using bias correction and acceleration, whose construction and degeneracies are stated above. Its availability does not establish higher-order coverage in a setting lacking the required regularity or enough independent units.

A paired sign-flip test evaluates a sharp exchangeability reference; exhaustive enumeration and Monte Carlo sampling have different exactness and computational properties. Inverting a justified family of tests can construct an interval, while one p-value alone does not estimate effect magnitude. A clustered standard error analytically aggregates residual cluster sums; few clusters, incorrect dependency labels, and cross-cluster correlation can invalidate its reference approximation [MATHEMATICALLY-DERIVED · DERIVED:eq-2.21; PAPER-REPORTED · R2.7, §2.2].

Stratified resampling within a fixed task benchmark preserves task composition. The interquartile mean trims the bottom and top quarter of the pooled performance distribution; it is a different estimand from mean deployment utility. A task-population estimand additionally requires a model for sampling tasks, and cannot inherit its interval from fixed-task run resampling alone [PAPER-REPORTED · R2.16, §§4.1–4.3].

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
  permutation: an exact exhaustive reference under exchangeability within pairs; sampled references have Monte Carlo error; O(R·n);
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
    - { dimension: "returns", values: { normal: "μ̂ ± z·ŝ/√n", pct: "α/2 and 1 − α/2 quantiles of R replicates", bca: "bias- and skew-corrected quantiles", perm: "randomization p-value; exhaustive exactness under the specified null", cse: "analytic SE including within-cluster cross-covariances", iqm: "an interval on the interquartile mean" } }
    - { dimension: "assumes", values: { normal: "CLT on the unit mean; independent units", pct: "the empirical distribution of units stands in for the population", bca: "a jackknife acceleration estimate is available", perm: "exchangeability within pairs", cse: "independent clusters with recorded labels", iqm: "few runs per task, many tasks" } }
    - { dimension: "resampled or summed unit", values: { normal: "none: analytic", pct: "the independent unit, whole clusters", bca: "the independent unit", perm: "the sign of each paired d_i", cse: "clusters, analytically", iqm: "runs within each task (stratum)" } }
    - { dimension: "cost after scores are cached", values: { normal: "O(n)", pct: "O(R·n)", bca: "O(R·n) + n jackknife evaluations", perm: "O(R·n)", cse: "O(n)", iqm: "O(R·n)" } }
    - { dimension: "new failure mode", values: { normal: "small n, skew, dependence", pct: "bias, skew; non-smooth statistics such as a max", bca: "instability at small K", perm: "tests, does not estimate", cse: "few clusters; wrong labels; omitted cross-cluster dependence", iqm: "the IQM is not the mean the deployment pays for" } }
```

## Extensions

### Improvements

R2.16 replaces isolated point aggregates with stratified intervals, performance profiles, and an interquartile mean; its repeated-run/subsampling protocol supports narrower and more reliable uncertainty in that few-run benchmark setting. It does not make the IQM equal to deployment mean utility. R2.7 changes independent-question uncertainty analysis to clustered and paired analysis, with its same-score Table 4 comparison establishing the precision correction rather than better model capability [PAPER-REPORTED · R2.16, §§4.1–4.3; R2.7, §§2.2,4.2].

For agents the unit is an episode, and repeated episodes of one task are a cluster ([§63.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-2-repeated-run-reliability.md)). For preference data the unit is a pairwise judgement nested in a prompt and a rater; the aggregation model of [§62.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-2-pairwise-aggregation.md) must cluster on both. For latency SLOs the statistic is a quantile and the interval methods here apply only to the quantile estimator, not to the mean (Chapter 48). Proposals are marked there.

## Limitations

Eq. 2.22 assumes equal cluster sizes and a single clustering level; unequal sizes and crossed clusterings (prompt × seed) need a justified covariance or resampling construction; a nested bootstrap does not automatically address crossed dependence. Eq. 2.23 is a normal-approximation planning formula; it is not a guarantee. The design-effect identity is exact within the specified equal-size random-effects model; finite-sample coverage is a different claim. A coverage failure rejects the chosen approximation or implementation for that regime without refuting the algebraic identity.

## Reproducibility

Symbols: s_i, d_i, ρ, DE, σ_a², σ_e², K, m, R, α, β, δ (local). Every reported interval must state: unit, cluster label, n and K, method (normal, percentile, BCa, permutation), R and seed, pairing, and the family size for multiple comparisons. No code was executed in this edition.

## References

P50, R2.2, R2.7, R2.16, R2.17. See [references.md](references.md).
