---
id: ms.section.2.2
entity_type: section
title: Probability
short_title: Probability
volume: 1
part: 1
chapter: 2
section: 2.2
slug: 02-2-probability
parent: ms.chapter.2
prev_sibling: ms.section.2.1
next_sibling: ms.section.2.3
children: []
prerequisites: [ms.section.1.1, ms.section.2.1]
downstream: [ms.section.2.3, ms.section.2.4, ms.section.2.5, ms.section.4.1, ms.section.34.2, ms.section.34.3, ms.section.37.1]
related: [ms.section.6.4]
siblings_by_mechanism: []
relations:
  - {type: prerequisite_of, target: ms.section.4.1}
  - {type: prerequisite_of, target: ms.section.34.2}
axes: {lifecycle: [pretraining, post_training, inference, evaluation], mechanism: [probability, monte_carlo], feedback_setting: [], modality: [text]}
papers: [P25]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, ASSUMED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 02.2 Probability

## Scope

Objective: fix the probabilistic vocabulary — conditional distributions, factorisation, Bayes' rule, expectation, variance, sampling, and Monte Carlo estimation — as estimators with stated variance and per-sample cost. Baseline: expectations written as if computed exactly when they are always sampled. Success: every expectation in later chapters can be named as "Monte Carlo with n samples, variance σ²/n, cost n forward passes" or as an importance-weighted variant with a stated effective sample size. Boundaries: the language-model likelihood (Eq. N.1) is owned by [§04.1](../ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md); decoding algorithms by [Chapter 37](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/README.md); interval construction by §02.5.

## Why this exists

What failed: RL objectives (Eq. N.6), evaluation scores, and KL penalties are all expectations, and their reported values are sample means whose variance is rarely stated. The bottleneck: each sample of a language model's output costs a full generation, so the number of samples is small and the estimator's variance is material. The dominant constraint: variance per unit compute. What changed: expectations are written with their estimator, the estimator with its variance, and the variance with what it costs to reduce.

## Intuition

Physically, a probability distribution over token sequences is a normalised weight over an exponentially large discrete set; nothing can be computed on it except by factorisation (which makes local computations tractable) and by sampling (which replaces sums by averages). The variance of a Monte Carlo estimate falls as 1/n, so halving the error costs four times the samples; that arithmetic, not any modelling subtlety, is what makes RL and evaluation expensive. Heuristically, one may think of importance weights as "how surprised the target distribution is by the proposal's sample"; the effective sample size makes that heuristic quantitative.

## Formulation

> **Definition — factorisation (of a joint distribution).** For random variables X₁,…,X_T and any ordering, p(x₁,…,x_T) = Π_t p(x_t | x_{<t}); a conditional-independence structure (a directed acyclic graph) removes variables from the conditioning sets.

$$
p(x_1,\ldots,x_T) = \prod_{t=1}^{T} p(x_t \mid x_{<t}), \qquad p(x_1,\ldots,x_T) = \prod_{t=1}^{T} p\big(x_t \mid \operatorname{pa}(x_t)\big)
$$
*(Eq. 2.5)* where x_{<t} = all earlier variables; pa(x_t) = the parents of x_t in a conditional-independence graph. The left identity is the chain rule and holds for every distribution; the right is a modelling assumption.

```figure
id: fig-2.9
kind: matrix
title: Conditioning sets of the chain rule and of a first-order graph
caption: >-
  Row t is the factor p(x_t | ·); a shaded cell (t, j) means x_j is in its
  conditioning set. Every shaded cell is required by the left identity of
  Eq. 2.5, which holds for any distribution: 28 of 64 pairs at T = 8, one
  more per row as t grows. The dark sub-diagonal alone is what the right
  identity keeps under a first-order Markov graph, pa(x_t) = {x_{t−1}}: 7
  pairs, bought with a modelling assumption. An autoregressive language
  model keeps the whole triangle; it is the causal mask of §05.2 without
  its diagonal.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.5"
alt: >-
  Eight by eight grid with the factor for x_t, t = 1 to 8, down the rows and
  the conditioning variable x_j across the columns. Cells strictly below the
  diagonal are shaded: row x_t conditions on x_1 to x_{t−1}, 28 cells in all,
  the chain-rule factorisation. Of these, the seven cells directly below the
  diagonal (x_t conditioned on x_{t−1}) are dark and are the only ones a
  first-order Markov graph keeps; the other 21 are light. The diagonal and
  everything above it are empty. Row x_6 is highlighted across x_1 to x_5.
spec:
  rows: 8
  cols: 8
  pattern: explicit
  cells:
    - [0, 0, 0, 0, 0, 0, 0, 0]
    - [1, 0, 0, 0, 0, 0, 0, 0]
    - [0.35, 1, 0, 0, 0, 0, 0, 0]
    - [0.35, 0.35, 1, 0, 0, 0, 0, 0]
    - [0.35, 0.35, 0.35, 1, 0, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 1, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 1, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 1, 0]
  rowLabel: "factor p(x_t | ·)"
  colLabel: "conditioning variable x_j"
  rowTicks: ["x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8"]
  colTicks: ["x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8"]
  highlight:
    - { row: 5, col: 0 }
    - { row: 5, col: 1 }
    - { row: 5, col: 2 }
    - { row: 5, col: 3 }
    - { row: 5, col: 4 }
  legend: "dark: pa(x_t) under a first-order graph, 7 pairs; dark + light: chain rule, 28 of 64"
```

$$
p(\theta \mid \mathcal{D}) = \frac{p(\mathcal{D} \mid \theta)\,p(\theta)}{p(\mathcal{D})}, \qquad p(\mathcal{D}) = \int p(\mathcal{D} \mid \theta)\,p(\theta)\,d\theta
$$
*(Eq. 2.6)* where θ = parameters or hypothesis, 𝒟 = observed data, p(θ) = prior, p(𝒟) = marginal likelihood (evidence).

$$
\mathbb{E}[Y] = \mathbb{E}\big[\mathbb{E}[Y \mid X]\big], \qquad \operatorname{Var}[Y] = \mathbb{E}\big[\operatorname{Var}[Y \mid X]\big] + \operatorname{Var}\big[\mathbb{E}[Y \mid X]\big]
$$
*(Eq. 2.7)* where Y = a score or return, X = a conditioning variable (prompt, seed, task); the two variance terms are within-X and between-X variance.

```figure
id: fig-2.10
kind: chart
title: Standard error of a pass rate, split by Eq. 2.7
caption: >-
  Eq. 2.7 with X = prompt: Var(μ̂) = σ_b²/P + σ_w²/(P·s) for P prompts and s
  samples per prompt. More samples per prompt shrink only the second term,
  so the total flattens onto the between-prompt floor; only more prompts
  lower the floor. Illustrative split of σ² = 0.25 (a pass rate near 0.5)
  into σ_b² = 0.05 between prompts and σ_w² = 0.2 within, P = 200; not a
  measured benchmark.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.7"
alt: >-
  Log–log chart of the standard error of a mean pass rate against samples
  per prompt s from 1 to 64, for an illustrative σ_b² = 0.05, σ_w² = 0.2 and
  P = 200 prompts. The total is 0.0354 at s = 1, 0.0224 at s = 4 where the
  between and within terms are equal, 0.0177 at s = 16 and 0.0163 at s = 64,
  approaching the between-prompt floor √(σ_b²/P) = 0.0158. The within term
  alone falls as 1/√s. With 2P = 400 prompts the total is 0.025 at s = 1 and
  0.0115 at s = 64, over a floor of 0.0112.
spec:
  type: line
  x: { label: "samples per prompt s", scale: log2, format: integer, domain: [1, 64] }
  y: { label: "standard error of the mean", scale: log2, format: raw }
  variables: { sb2: 0.05, sw2: 0.2, P: 200 }
  series:
    - { id: total, label: "total, P prompts", formula: "sqrt(sb2/P + sw2/(P*x))", sample: { from: 1, to: 64, count: 7 }, emphasis: true }
    - { id: floor, label: "between-prompt floor √(σ_b²/P)", formula: "sqrt(sb2/P)", sample: { from: 1, to: 64, count: 2 }, dashed: true }
    - { id: within, label: "within-prompt term √(σ_w²/(P·s))", formula: "sqrt(sw2/(P*x))", sample: { from: 1, to: 64, count: 7 }, dashed: true }
    - { id: twoP, label: "total, 2P prompts", formula: "sqrt(sb2/(2*P) + sw2/(2*P*x))", sample: { from: 1, to: 64, count: 7 } }
  annotations:
    - { x: 4, label: "s = σ_w²/σ_b² = 4: terms equal" }
states:
  - { anchor: formulation, label: "s = 1", variables: { x: 1 }, highlight: [total, within], note: "One sample per prompt: SE 0.035, dominated by the within-prompt term σ_w²/(P·s)." }
  - { anchor: mechanism, label: "s = 4", variables: { x: 4 }, highlight: [total, floor, within], note: "At s = σ_w²/σ_b² = 4 the two variance terms are equal; past it, extra samples per prompt buy little." }
  - { anchor: experimental-design, label: "s = 64, and 2P", variables: { x: 64 }, highlight: [total, twoP, floor], note: "From s = 16 to 64 the SE moves only 0.0177 → 0.0163; doubling the prompts moves the floor itself, 0.0158 → 0.0112." }
```

> **Definition — Monte Carlo estimator.** For μ = E_{x∼p}[f(x)] and independent samples x₁,…,x_n ∼ p, μ̂_n = (1/n) Σ_i f(x_i).

$$
\hat\mu_n = \frac{1}{n}\sum_{i=1}^{n} f(x_i), \qquad \mathbb{E}[\hat\mu_n] = \mu, \qquad \operatorname{Var}[\hat\mu_n] = \frac{\sigma^2}{n}, \qquad \operatorname{SE} = \frac{\sigma}{\sqrt{n}}
$$
*(Eq. 2.8)* where σ² = Var_{x∼p}[f(x)] (finite by assumption), SE = standard error; σ² is estimated by the sample variance.

> **Definition — importance sampling / effective sample size.** For samples from a proposal q with p ≪ q, μ̂_IS = (1/n) Σ_i w_i f(x_i) with w_i = p(x_i)/q(x_i); ESS = (Σ_i w_i)² / Σ_i w_i².

$$
\hat\mu_{\text{IS}} = \frac{1}{n}\sum_{i=1}^{n} \frac{p(x_i)}{q(x_i)}\, f(x_i), \qquad \operatorname{ESS} = \frac{\big(\sum_i w_i\big)^2}{\sum_i w_i^2}
$$
*(Eq. 2.9)* where w_i = p(x_i)/q(x_i); ESS ∈ [1, n] is the number of unweighted samples with the same variance for a bounded f (heuristic when f is unbounded).

> **Assumption.** Samples are independent and f has finite variance under p · *sensitivity:* with positive correlation between samples (shared prompt, shared seed) the true variance exceeds σ²/n by the design effect derived in §02.5; with infinite variance the SE estimate is meaningless.

```figure
id: fig-2.11
kind: calculator
title: Monte Carlo standard error and effective sample size
caption: >-
  Eq. 2.8 and Eq. 2.9 for n samples of which n − 1 carry weight 1 and one
  carries weight W, the simplest picture of "one sample dominates". With
  W = 1 the estimator is plain Monte Carlo and SE = σ/√n. As W grows the ESS
  falls toward 1 and the self-normalised SE, σ/√ESS, rises toward σ, while
  the generations paid, and the cost, stay at n. The n = 400 preset is the
  Intuition's arithmetic: four times the samples for half the error.
  Illustrative weights, not a measured policy ratio.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.8", "DERIVED:eq-2.9"]
alt: >-
  Calculator composing Eq. 2.8 and Eq. 2.9 with inputs per-sample standard
  deviation σ, sample count n and the weight W of one sample (all others
  weight 1). At σ = 0.5, n = 100, W = 1: SE = 0.050, ESS = 100, ESS/n = 100 %.
  At n = 400 the SE halves to 0.025. At n = 100 and W = 30, ESS = 16.7
  (16.7 % of n) and the self-normalised SE is 0.123. At W = 1000, ESS = 1.21
  and the SE is 0.455, close to σ itself, although 100 generations were
  paid.
spec:
  tex: >-
    \operatorname{SE} = \frac{\sigma}{\sqrt{n}},\qquad \operatorname{ESS} = \frac{\big(\sum_i w_i\big)^2}{\sum_i w_i^2} = \frac{(n-1+W)^2}{n-1+W^2},\qquad \operatorname{SE}_{\text{IS}} \approx \frac{\sigma}{\sqrt{\operatorname{ESS}}}
  inputs:
    - { symbol: sigma, label: "σ, per-sample standard deviation", default: 0.5, min: 0.05, max: 1, step: 0.05, format: fixed2 }
    - { symbol: n, label: "samples n, one generation each", default: 100, min: 4, max: 10000, scale: log10, format: integer }
    - { symbol: W, label: "weight W of one sample, the rest 1", default: 1, min: 1, max: 10000, scale: log10, format: raw }
  outputs:
    - { symbol: SE, label: "plain Monte Carlo SE, σ/√n", formula: "sigma/sqrt(n)", format: fixed3 }
    - { symbol: ESS, label: "effective sample size", formula: "(n - 1 + W)^2/(n - 1 + W^2)", format: fixed1, emphasis: true }
    - { symbol: frac, label: "ESS/n", formula: "ESS/n", format: percent }
    - { symbol: SEis, label: "self-normalised SE, σ/√ESS", formula: "sigma/sqrt(ESS)", format: fixed3 }
    - { symbol: gens, label: "generations paid", formula: "n", format: integer }
  presets:
    - { label: "n = 400, W = 1", values: { n: 400, W: 1 } }
    - { label: "W = 30", values: { W: 30 } }
states:
  - { anchor: formulation, label: "plain MC, n = 100", variables: { sigma: 0.5, n: 100, W: 1 }, highlight: [SE, ESS], note: "σ = 0.5, n = 100: SE = 0.05. Every weight is 1, so ESS = n." }
  - { anchor: mechanism, label: "one weight W = 30", variables: { sigma: 0.5, n: 100, W: 30 }, highlight: [W, ESS, SEis], note: "One ratio π_θ/π_old of 30 among 100: ESS = 16.7 and the SE is 0.123, though 100 generations were paid." }
  - { anchor: failure-modes, label: "degenerate, W = 1000", variables: { sigma: 0.5, n: 100, W: 1000 }, highlight: [ESS, frac, SEis], note: "Degenerate weights: ESS = 1.2, 1.2 % of n. The estimate is one sample; log ESS/n every step to see it." }
```

## Mechanism

Eq. 2.7 is the tool for decomposing an evaluation score into its sources: if X indexes prompts and Y is the per-sample correctness at nonzero temperature, the between-prompt term is what a larger prompt set reduces and the within-prompt term is what more samples per prompt reduce; §02.5 turns this into a sampling-allocation rule [MATHEMATICALLY-DERIVED · DERIVED:eq-2.7].

Sampling a categorical over V tokens: inverse-CDF sampling needs the cumulative sum, O(V) work and one uniform draw; the Gumbel-max identity argmax_v (log p_v + g_v) with g_v i.i.d. standard Gumbel produces an exact sample with V independent draws and no cumulative sum, which is why it vectorises well [MATHEMATICALLY-DERIVED]. Temperature, top-k, and nucleus truncation define *different* distributions from p_θ; a sample from them is not a sample from p_θ, and any expectation estimated from them is an expectation under the modified distribution (developed in [§37.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-1-sampling-distributions.md)). Cost per sequence sample: T forward passes over a growing cache, i.e. the decode cost of Chapter 42; this is the unit in which every Monte Carlo estimate over model outputs is priced.

<details><summary>Derivation of Eq. 2.9 (unbiasedness and the role of ESS)</summary>

E_q[w(x) f(x)] = ∫ q(x)(p(x)/q(x)) f(x) dx = ∫ p(x) f(x) dx = μ, provided q(x) > 0 wherever p(x) f(x) ≠ 0. Var_q[w f] = E_p[w f²] − μ², which exceeds Var_p[f] whenever w is large where f² is large. For the self-normalised estimator Σ w_i f_i / Σ w_i, a delta-method expansion (§02.6, Eq. 2.27) gives variance ≈ Var_p[f]·(Σ w_i²)/(Σ w_i)² for bounded f, i.e. σ²/ESS.

</details>

Importance weights appear in the book in two disguises. In PPO-family objectives ([§34.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-3-ppo.md)) the per-token ratio π_θ/π_old is exactly w_i, and clipping bounds the variance at the price of bias. In off-policy evaluation the weights are products over tokens and their variance grows with T, so the ESS collapses; the sequence-level ratio is only usable when the two policies are close [MATHEMATICALLY-DERIVED · DERIVED:eq-2.9].

```figure
id: fig-2.12
kind: chart
title: Effective samples left by sequence-level importance weights
caption: >-
  If per-token log-ratios log(π_θ/π_old) are independent with standard
  deviation s, the sequence weight is their product and, for lognormal
  weights, ESS/n tends to exp(−T·s²): Eq. 2.9 in the large-n limit. The
  collapse is exponential in T, so a per-token spread that leaves per-token
  ratios usable leaves almost no effective samples for a sequence-level
  estimate at T in the thousands. The independent lognormal model is an
  assumption chosen for its closed form; the s values are illustrative.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.9"
alt: >-
  Line chart of the large-n effective-sample fraction ESS/n = exp(−T·s²)
  against sequence length T from 1 to 4096 tokens on a log axis, for
  per-token log-ratio standard deviations s = 0.01, 0.03 and 0.1. At T = 100
  the fractions are 0.990, 0.914 and 0.368; at T = 1000 they are 0.905,
  0.407 and 0.000045; at T = 4096 they are 0.664, 0.025 and effectively zero.
spec:
  type: line
  x: { label: "sequence length T, tokens", scale: log2, format: tokens, domain: [1, 4096] }
  y: { label: "ESS/n, large-n limit", scale: linear, format: percent, domain: [0, 1] }
  variables: { s1: 0.01, s2: 0.03, s3: 0.1 }
  series:
    - { id: lo, label: "s = 0.01", formula: "exp(-x*s1^2)", sample: { from: 1, to: 4096, count: 13 } }
    - { id: mid, label: "s = 0.03", formula: "exp(-x*s2^2)", sample: { from: 1, to: 4096, count: 13 }, emphasis: true }
    - { id: hi, label: "s = 0.1", formula: "exp(-x*s3^2)", sample: { from: 1, to: 4096, count: 13 } }
  annotations:
    - { x: 100, label: "s = 0.1: e⁻¹ ≈ 0.37" }
    - { x: 1024, label: "s = 0.03: ≈ 0.40" }
```

Bayes' rule (Eq. 2.6) appears as the posterior over hypotheses in Chapter 01's falsification programme and as the noisy-channel identity p(y|x) ∝ p(x|y) p(y) that motivates reranking and classifier guidance; the marginal likelihood p(𝒟) is intractable for models with millions of parameters and is estimated, when at all, by sampling [MATHEMATICALLY-DERIVED · DERIVED:eq-2.6].

## Algorithm

```text
Algorithm 2.2 — Monte Carlo estimate with standard error and effective sample size
INPUT   sampler for q; target density p (p = q for the plain estimator); function f; sample count n
OUTPUT  estimate μ̂, standard error SE, effective sample size ESS
STATE   accumulators S1 = Σ w_i f_i, S2 = Σ w_i f_i², W1 = Σ w_i, W2 = Σ w_i²
INVARIANT after i samples, S1/W1 is the self-normalised estimate on the first i samples
1  S1, S2, W1, W2 ← 0
2  for i = 1 … n:
3      x_i ← sample(q)                          # cost: one generation
4      w_i ← p(x_i)/q(x_i)                      # 1 if p = q; else two log-prob evaluations
5      f_i ← f(x_i)                             # cost: one evaluation (verifier, judge, metric)
6      S1 += w_i f_i;  S2 += w_i f_i²;  W1 += w_i;  W2 += w_i²
7  μ̂ ← S1 / W1
8  ESS ← W1² / W2
9  σ̂² ← S2 / W1 − μ̂²                            # weighted sample variance
10 SE ← sqrt(σ̂² / ESS)
11 return μ̂, SE, ESS
```

Complexity: n generations plus n evaluations of f; memory O(1) beyond the samples. Termination: fixed n, or stop when SE ≤ target (sequential stopping biases μ̂ slightly; state it if used). Implementation: the log-probabilities in line 4 are sums of per-token log-softmax values, which must be computed in the log-sum-exp form of [§03.2](../ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md).

## Implementation

```text
Tensor trace
[B, V] logits → log_softmax (LSE over V) → [B, V] log p → gather(token) → [B] log p_t → Σ_t → [B] sequence log-prob
[B, V] log p + Gumbel noise [B, V] → argmax over V → [B] sampled token ids
```

In PyTorch the categorical sample is `torch.multinomial` on probabilities or a Gumbel-argmax on log-probabilities; the former needs the O(V) normalisation and cumulative sum. The importance ratio in line 4 requires the log-probabilities of the same token sequence under two parameter sets, which is why RL trainers ([§34.4](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-4-rlhf-components.md)) keep actor, reference, and sometimes old-policy forward passes; the memory and communication cost of that placement is owned by Chapter 36. Monte Carlo estimates of a KL penalty use sampled estimators rather than a full-vocabulary sum; the estimator used by GRPO in P25 is treated in §02.3.

## Experimental design

Proposal: on a fixed prompt set, estimate a verifier pass rate by Algorithm 2.2 at n ∈ {1, 4, 16, 64} samples per prompt and report the within-prompt and between-prompt variance components of Eq. 2.7; the prediction is that beyond the point where the within-prompt term is small relative to the between-prompt term, additional samples per prompt do not narrow the interval and more prompts do. Controlled: temperature, decoding truncation, verifier version, seeds. This is a proposal and was not run.

## Observations

**What the paper claims.** P25 reports using a sampled, per-token KL estimator inside the GRPO loss rather than a full-vocabulary KL (its Eq. 4), and describes it as unbiased and guaranteed positive [PAPER-REPORTED · P25].

**What the evidence shows.** The identities in Eq. 2.5–2.9 are theorems and require no empirical support. The unbiasedness of P25's estimator follows from E_q[p/q] = 1 (§02.3) and is not a reported result but a derivation [MATHEMATICALLY-DERIVED].

**What we infer.** The book infers that, because per-sequence generation is the cost unit, the binding constraint on evaluation and RL precision is the ESS per unit compute, not the raw sample count; this is DERIVED from Eq. 2.8–2.9 and ASSUMED to dominate other costs.

**What remains unknown.** The variance of sampled KL and advantage estimators at production batch sizes in any named trainer is NOT-DISCLOSED by the reports inspected.

## Failure modes

> **Failure mode — degenerate importance weights.** *Symptom:* ESS ≪ n; the estimate is dominated by one sample. *Cause:* proposal far from target, or sequence-level ratios over long T. *Detection:* log ESS/n every step. *Mitigation:* clip or truncate weights (biased), shorten the horizon, or resample (developed in §34.3).

> **Failure mode — sampling from the wrong distribution.** *Symptom:* an expectation under p_θ estimated from top-p samples drifts as the truncation changes. *Cause:* truncation defines a different distribution. *Detection:* sweep the truncation parameter; the estimate should be invariant if it were under p_θ. *Mitigation:* state the sampling distribution as part of the estimand.

> **Failure mode — sequential stopping.** *Symptom:* estimates that stop early are systematically favourable. *Cause:* optional stopping on the estimate. *Detection:* compare with fixed-n runs. *Mitigation:* preregister n ([§06.6](../ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md)).

## Siblings

**Plain Monte Carlo** — this file. Why it exists: the only general estimator for expectations over sequences. Changed primitive: exact sum → sample mean. New failure mode: σ²/n at small n.

**Importance sampling** — this file, Eq. 2.9. Why it exists: reuse samples from another distribution. What assumption changed: p ≪ q. What problem it solved: off-policy reuse. New failure mode: weight degeneracy. Changed primitive: unweighted mean → weighted mean.

**Control variates / baselines** — [§34.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-2-policy-gradients.md). Why it exists: reduce variance without bias. What assumption changed: a correlated quantity with known mean is available. What problem it solved: the variance of score-function gradients (§02.4). New failure mode: a learned baseline that lags the policy. Changed primitive: f → f − b.

**Stratified / clustered sampling** — §02.5. Why it exists: exploit known structure (prompts, tasks). What problem it solved: between-stratum variance. New failure mode: mis-specified strata.

```figure
id: fig-2.13
kind: compare
title: Four estimators of one expectation over model outputs
caption: >-
  Every column estimates the same μ = E_p[f] and every column still pays one
  generation per sample; what differs is where the variance goes. Only
  importance sampling can reuse samples drawn from another distribution, and
  it pays for that in the ESS row. Control variates and stratification cut
  variance without bias, but each needs something extra: a correlated
  quantity with a known mean, or a known structure.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.7", "DERIVED:eq-2.8", "DERIVED:eq-2.9"]
alt: >-
  Comparison of four estimators of μ = E_p[f] from n sampled model outputs.
  Plain Monte Carlo: sample mean, unbiased, variance σ²/n, cost one
  generation and one evaluation of f per sample, failure mode σ²/n at small
  n. Importance sampling: weighted mean with w = p/q, unbiased in plain form
  and biased at finite n when self-normalised, variance about σ²/ESS for
  bounded f, assumes p ≪ q, adds two log-probability evaluations per sample,
  failure mode weight degeneracy. Control variates or baselines (§34.2):
  f − b with a known mean added back, unbiased, lower variance when b
  correlates with f, failure mode a learned baseline that lags the policy.
  Stratified or clustered sampling (§02.5): per-stratum means, removes the
  between-stratum term of Eq. 2.7, needs known strata, failure mode
  mis-specified strata.
spec:
  axis: >-
    Variance and per-sample cost of estimating μ = E_p[f] from n sampled
    model outputs at fixed n; bias is stated, not ranked
  columns:
    - { id: mc, label: "Plain Monte Carlo", node: ms.section.2.2 }
    - { id: imp, label: "Importance sampling (Eq. 2.9)", node: ms.section.2.2 }
    - { id: cv, label: "Control variates / baselines", node: ms.section.34.2 }
    - { id: strat, label: "Stratified / clustered sampling", node: ms.section.2.5 }
  rows:
    - { dimension: "changed primitive", values: { mc: "exact sum → sample mean", imp: "unweighted mean → weighted mean, w = p/q", cv: "f → f − b", strat: "one pool → per-stratum means" } }
    - { dimension: "bias", values: { mc: "none", imp: "none in plain form; finite-n bias when self-normalised", cv: "none when the mean of b is known", strat: "none" } }
    - { dimension: "variance", values: { mc: "σ²/n (Eq. 2.8)", imp: "≈ σ²/ESS for bounded f", cv: "Var(f − b)/n, below σ²/n when b correlates with f", strat: "within-stratum term only; the between term of Eq. 2.7 is removed" } }
    - { dimension: "assumption", values: { mc: "independent samples, finite σ²", imp: "p ≪ q: q > 0 wherever p·f ≠ 0", cv: "a correlated quantity with known mean", strat: "known strata such as prompts or tasks" } }
    - { dimension: "per-sample cost", values: { mc: "one generation + one evaluation of f", imp: "the same + two log-probability evaluations for w_i", cv: "the same + evaluating b", strat: "the same + a stratum label per sample" } }
    - { dimension: "new failure mode", values: { mc: "σ²/n at small n", imp: "weight degeneracy, ESS ≪ n", cv: "a learned baseline that lags the policy", strat: "mis-specified strata" } }
```

## Extensions

For agents, the sampled object is a trajectory whose length and tool calls are random, so the per-sample cost is itself a random variable and the budget, not n, is the natural stopping rule (developed in [§36.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-1-agent-trajectories.md)). For multimodal generation the factorisation in Eq. 2.5 may be over patches or continuous latents, and the estimators change from categorical sampling to integration schemes ([Chapter 58](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch58-generative-multimodal-models-and-alternative-generation-paths/README.md)). Proposals are marked in those chapters.

## Limitations

All statements assume finite variance and, for Eq. 2.8, independence; heavy-tailed rewards and clustered prompts violate them, and §02.5 supplies the correction. Falsification: a Monte Carlo estimate whose empirical variance does not fall as 1/n across independent replications indicates dependence or infinite variance, and the estimator must be replaced, not the sample size increased.

## Reproducibility

Symbols: p, q, w_i, ESS, σ² (local); p_θ, π_θ, π_ref from notation.md. The sampling distribution (temperature, truncation), the number of samples per prompt, and whether the estimator is self-normalised must be recorded with every reported expectation. No code was executed in this edition.

## References

P25 (GRPO's sampled KL estimator). See [references.md](references.md).
