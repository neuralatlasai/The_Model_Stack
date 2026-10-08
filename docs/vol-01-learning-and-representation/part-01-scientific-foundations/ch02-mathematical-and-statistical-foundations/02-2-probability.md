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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 02.2 Probability

## Scope

Conditional probability, Bayes' rule, factorization, expectation, and variance specify the target quantities of sampling-based computation. Monte Carlo and importance sampling replace an exact expectation with an estimator whose bias, variance, support requirements, and cost depend on the sampling law. Language-model likelihood is developed in [§04.1](../ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md), decoding in [Chapter 37](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/README.md), and interval construction in §02.5.

## Why this exists

An expectation over prompts and generated outputs includes two distinct sources of variation. Repeated outputs can reduce conditional output noise while leaving between-prompt variation unchanged. Reusing outputs from another policy introduces importance ratios and additional support and moment conditions. Computational allocation therefore depends on the estimand and its variance decomposition, rather than on sample count alone [MATHEMATICALLY-DERIVED · DERIVED:eq-2.7; DERIVED:eq-2.9].

## Intuition

A distribution assigns normalized mass to its sample space. Factorization exposes conditional probabilities; exact summation is possible for some small or structured spaces, while sampling provides an alternative when enumeration is infeasible. For independent identically distributed samples with finite variance σ², the sample-mean variance is σ²/n. Importance sampling changes the random integrand by multiplying by a density ratio. Self-normalization changes it again into a ratio estimator, whose uncertainty depends on the joint behavior of weights and the measured function [MATHEMATICALLY-DERIVED · DERIVED:eq-2.8; DERIVED:eq-2.29].

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
*(Eq. 2.9)* where w_i = p(x_i)/q(x_i); ESS ∈ [1,n] for nonnegative weights with a positive sum; it measures weight concentration rather than integrand-independent precision.

> **Assumption.** Samples are independent and f has finite variance under p · *sensitivity:* with positive correlation between samples (shared prompt, shared seed) the true variance exceeds σ²/n by the design effect derived in §02.5; with infinite variance the SE estimate is meaningless.

```figure
id: fig-2.11
kind: calculator
title: Monte Carlo standard error and effective sample size
caption: >-
  Eq. 2.8 and Eq. 2.9 for n samples of which n − 1 carry weight 1 and one
  carries weight W, the simplest picture of "one sample dominates". With
  W = 1 the estimator is plain Monte Carlo and SE = σ/√n. As W grows the ESS
  falls toward 1 and the fixed-weight-model SE, σ/√ESS, rises toward σ, while
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
  (16.7 % of n) and the fixed-weight-model SE is 0.123. At W = 1000, ESS = 1.21
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
    - { symbol: SEis, label: "fixed-weight-model SE, σ/√ESS", formula: "sigma/sqrt(ESS)", format: fixed3 }
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

### Methodology

Eq. 2.7 is the tool for decomposing an evaluation score into its sources: if X indexes prompts and Y is the per-sample correctness at nonzero temperature, the between-prompt term is what a larger prompt set reduces and the within-prompt term is what more samples per prompt reduce; §02.5 turns this into a sampling-allocation rule [MATHEMATICALLY-DERIVED · DERIVED:eq-2.7].

Sampling a categorical over V tokens: inverse-CDF sampling needs the cumulative sum, O(V) work and one uniform draw; the Gumbel-max identity argmax_v (log p_v + g_v) with g_v i.i.d. standard Gumbel produces an exact sample with V independent draws and no cumulative sum, which is why it vectorises well [MATHEMATICALLY-DERIVED]. Temperature, top-k, and nucleus truncation define *different* distributions from p_θ; a sample from them is not a sample from p_θ, and any expectation estimated from them is an expectation under the modified distribution (developed in [§37.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-1-sampling-distributions.md)). Cost per sequence sample: T forward passes over a growing cache, i.e. the decode cost of Chapter 42; this is the unit in which every Monte Carlo estimate over model outputs is priced.

<details><summary>Derivation of Eq. 2.9 (unbiasedness and the role of ESS)</summary>

E_q[w(x) f(x)] = ∫ q(x)(p(x)/q(x)) f(x) dx = ∫ p(x) f(x) dx = μ, provided q(x) > 0 wherever p(x) f(x) ≠ 0. Var_q[w f] = E_q[w²f²] − μ², which can be above or below Var_p[f]. For self-normalization, the relevant asymptotic variance is E_q[w²(f−μ)²]/n under Eq. 2.29’s conditions. Bounded f alone does not reduce it to σ²/ESS.

</details>

Importance weights appear in the book in two disguises. In PPO-family objectives ([§34.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-3-ppo.md)) the per-token ratio π_θ/π_old is exactly w_i, and clipping changes the surrogate and can introduce bias; clipping alone does not bound the complete gradient variance without reward/score moment bounds. In off-policy evaluation the weights are products over tokens and their second moments can grow with T, so weight concentration can become severe; its usability depends on support overlap and the joint weighted second moment, which must be assessed for the actual sequence distribution [MATHEMATICALLY-DERIVED · DERIVED:eq-2.9].

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

### Conditional laws and estimands

Conditional probabilities are defined on an event of positive probability. For discrete $X,Y$, $p(y\mid x)=p(x,y)/p(x)$ whenever $p(x)>0$. Consequently $p(x,y)=p(x)p(y\mid x)$ and summing over $x$ gives $p(y)=\sum_xp(y\mid x)p(x)$. Bayes' rule reverses the conditional by dividing this joint by $p(y)>0$. A zero-probability conditioning event does not license division by zero; continuous conditioning requires a conditional density or a regular conditional distribution, rather than the probability of a singleton event. No independence is implied by factorization: independence is the additional equality $p(y\mid x)=p(y)$ on the support [MATHEMATICALLY-DERIVED · DERIVED:eq-2.5].

For an integrable $f(X,Y)$, summing the joint law in either order proves $\mathbb E[f]=\mathbb E_X[\mathbb E[f\mid X]]$. Decompose $f-\mathbb E f=(f-\mathbb E[f\mid X])+(\mathbb E[f\mid X]-\mathbb E f)$. The cross term is zero because its first factor has conditional mean zero. Squaring and averaging proves the total-variance identity. This derivation requires a second moment for a finite variance statement. Conditioning cannot increase the variance of the conditional-mean estimator: $\mathrm{Var}(\mathbb E[f\mid X])\le\mathrm{Var}(f)$. Replacing a sampled answer score by its exact conditional expectation therefore preserves the estimand and removes conditional sampling variance when that expectation is actually available [MATHEMATICALLY-DERIVED · DERIVED:eq-2.7].

### Sampling law and importance-estimator contract

The inverse-CDF construction chooses the first category whose cumulative probability exceeds $U\sim\mathrm{Uniform}(0,1)$; the interval assigned to category $j$ has length $p_j$, proving its categorical law. Alternatively, if $E_j$ are independent unit-rate exponentials, $E_j/p_j$ are independent exponential clocks of rates $p_j$. Integration gives $\Pr(j\text{ is first})=\int_0^\infty p_j e^{-t\sum_kp_k}dt=p_j$. Taking minus logarithms produces the Gumbel-max construction. Zero-probability categories have infinite clock time or log probability $-\infty$ and cannot be selected [MATHEMATICALLY-DERIVED · DERIVED:eq-2.5].

Ordinary importance sampling estimates an expectation with a sample mean of $w_if_i$ and is unbiased when $p$ is normalized and $p\ll q$. Its finite-variance condition is $\mathbb E_q[w^2f^2]<\infty$, which is stronger than $\mathbb E_p[f^2]<\infty$. A standard error can then be estimated from the ordinary sample variance of $w_if_i$, divided by $n$. Self-normalization estimates a ratio: $\hat\mu_{\rm SN}=\bar a/\bar w$, where $a_i=w_if_i$. Its finite-sample expectation is generally not $\mu$. Expanding around $(\mathbb E a,\mathbb E w)=(\mu,1)$ gives

$$
\sqrt n(\hat\mu_{\rm SN}-\mu)\ \Longrightarrow\
\mathcal N\!\left(0,\mathbb E_q[w^2(f-\mu)^2]\right),\qquad
\widehat{\mathrm{Var}}(\hat\mu_{\rm SN})=
\frac{n}{n-1}\frac{\sum_iw_i^2(f_i-\hat\mu_{\rm SN})^2}{(\sum_iw_i)^2}.
$$
*(Eq. 2.29)* The limiting result requires independent samples, positive mean weight, and the corresponding joint second moments. The displayed variance estimate is an asymptotic plug-in estimate with a finite-sample correction; it is not an exact finite-$n$ confidence guarantee [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27].

Weight-only ESS discards the correlation between weights and squared centered scores. Under a separate fixed-weight model in which independent $f_i$ share mean $\mu$ and variance $\sigma^2$, conditional variance is exactly $\sigma^2\sum_iw_i^2/(\sum_iw_i)^2=\sigma^2/\mathrm{ESS}$. Actual importance weights are functions of the same samples as $f_i$, so that extra model cannot be presumed. The ESS illustrations in this section show weight concentration and that conditional-model SE, not validated uncertainty for an arbitrary policy estimator [MATHEMATICALLY-DERIVED · DERIVED:eq-2.9].

If outputs are repeated $k$ times for each of $n$ independent prompts, the mean score variance is $(v_{\rm prompt}+v_{\rm output}/k)/n$. Under the declared analytical cost model of prompt overhead $c_0$ and per-output cost $c_1$, a fixed budget permits $n=\mathrm{budget}/(c_0+c_1k)$. Differentiating the resulting variance gives the continuous optimum $k^*=\sqrt{v_{\rm output}c_0/(v_{\rm prompt}c_1)}$ when all four terms are positive. Integer and budget constraints require nearby feasible choices; zero overhead favors broader prompt sampling. This is a derived allocation condition, not a reported deployment policy [MATHEMATICALLY-DERIVED · DERIVED:eq-2.7].

## Algorithm

```text
Algorithm 2.2 — Fixed-budget self-normalized importance estimate
INPUT   independent sampler q; nonnegative weights p/q; integrand f; integer n >= 2
OUTPUT  estimate, asymptotic SE, weight-concentration ESS, or invalid-estimate status
STATE   W1=sum(w); W2=sum(w^2); A1=sum(w*f); A2=sum(w^2*f); A3=sum(w^2*f^2)
INVARIANT accumulators contain exactly the first i samples from the declared proposal
1  initialize all five accumulators to zero
2  for i = 1 .. n:
3      sample x_i from q; evaluate f_i and log weight
4      reject NaN, absent proposal support, or a non-finite score
5      update the five scaled accumulators
6  if W1 = 0 or W2 = 0: return invalid-estimate
7  estimate = A1/W1; ESS = W1^2/W2
8  Q = A3 - 2*estimate*A2 + estimate^2*W2
9  SE = sqrt((n/(n-1))*max(Q,0)/W1^2)   # only a roundoff guard; investigate material Q < 0
10 return estimate, SE, ESS, n
```

The algorithm uses the variance estimate of Eq. 2.29. Time is $O(n)$ after sampling and score evaluation; auxiliary state is $O(1)$. Dynamic rescaling by the largest observed log weight prevents exponent overflow; sums with one weight scale and squared-weight scale must be rescaled consistently. Centered streaming moments or a second pass reduce cancellation in line 8. For plain sampling set every weight to one; then the standard error reduces to the usual sample-standard-deviation divided by $\sqrt n$. For ordinary importance sampling use the unnormalized mean and variance of $w_if_i$ instead. All three estimators must be named separately [MATHEMATICALLY-DERIVED · DERIVED:eq-2.29].

## Implementation

```text
Tensor trace
[B, V] logits → log_softmax (LSE over V) → [B, V] log p → gather(token) → [B] log p_t → Σ_t → [B] sequence log-prob
[B, V] log p + Gumbel noise [B, V] → argmax over V → [B] sampled token ids
```

PyTorch 2.14 `torch.multinomial` accepts nonnegative finite weights with a nonzero row sum and distinguishes replacement from sampling without replacement; weights need not sum to one. Its API does not promise a cumulative-sum kernel or a specific complexity. The inverse-CDF and Gumbel constructions above are mathematical algorithms, rather than a claim about that implementation [OFFICIAL-DOCUMENTATION · R2.20, Parameters and Note]. The importance ratio in line 4 requires the log-probabilities of the same token sequence under two parameter sets, which is why RL trainers ([§34.4](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-4-rlhf-components.md)) keep actor, reference, and sometimes old-policy forward passes; the memory and communication cost of that placement is owned by Chapter 36. Monte Carlo estimates of a KL penalty use sampled estimators rather than a full-vocabulary sum; the estimator used by GRPO in P25 is treated in §02.3.

## Experimental design

### Reported experiments

Conditional factorization, Bayes' rule, and Monte Carlo expectation/variance identities do not require training experiments. Miller's R2.7 §3.1–3.2 analyzes repeated answers and conditional expected scores; its uniform-difficulty calculations are analytical examples, not measurements of named production systems. DeepSeekMath P25 §4.1, Eq. (4), inserts the sampled KL expression into its GRPO construction; the RL comparisons belong to Chapter 35 and do not isolate that estimator's variance. No inspected experiment establishes a universal ESS-to-error conversion. Book-designed sampling and variance-allocation checks are unexecuted protocols in [verification.md](verification.md).

## Observations

The probability chain rule is an identity; a reduced graphical conditioning set is an additional model assumption. Total variance separates conditional noise from variation in conditional means. The number of independent prompts and the number of outputs per prompt therefore cannot be exchanged without specifying the corresponding variance components and costs [MATHEMATICALLY-DERIVED · DERIVED:eq-2.5; DERIVED:eq-2.7].

Plain importance sampling is unbiased when the required support and integrability conditions hold. Self-normalization generally introduces finite-sample bias and a function-specific asymptotic variance. Weight concentration alone does not specify that variance, because the weights and centered scores arise from the same samples [MATHEMATICALLY-DERIVED · DERIVED:eq-2.29].

DeepSeekMath reports its sampled KL construction within a larger RL procedure. Its isolated estimator variance at a named production batch is not disclosed by that comparison; the support, value, and gradient conditions are developed in [§02.3](02-3-information-theory.md#kl-support-estimation-and-differentiation) [PAPER-REPORTED · P25, §4.1].

## Failure modes

> **Failure mode — degenerate importance weights.** *Symptom:* ESS ≪ n; the estimate is dominated by one sample. *Cause:* proposal far from target, or sequence-level ratios over long T. *Detection:* log ESS/n every step. *Mitigation:* clip or truncate weights (biased), shorten the horizon, or resample (developed in §34.3).

> **Failure mode — sampling from the wrong distribution.** *Symptom:* an expectation under p_θ estimated from top-p samples drifts as the truncation changes. *Cause:* truncation defines a different distribution. *Detection:* sweep the truncation parameter; the estimate should be invariant if it were under p_θ. *Mitigation:* state the sampling distribution as part of the estimand.

> **Failure mode — sequential stopping.** *Symptom:* estimates that stop early are systematically favourable. *Cause:* optional stopping on the estimate. *Detection:* compare with fixed-n runs. *Mitigation:* preregister n ([§06.6](../ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md)).

## Siblings

Plain MC averages f under the target distribution. Importance sampling averages wf under a proposal; SNIS divides by the random total weight. Their bias and moment conditions differ even when the same samples are reused. A control variate with known mean μ_h instead averages f−c(h−μ_h). Its variance is [Var(f)+c²Var(h)−2cCov(f,h)]/n, minimized at c=Cov(f,h)/Var(h) when Var(h)>0. The optimum yields Var(f)(1−ρ²)/n; an arbitrary positive correlation without an appropriate coefficient does not guarantee reduction [MATHEMATICALLY-DERIVED · DERIVED:eq-2.8].

Stratification estimates μ=Σ_h a_h μ_h from fixed stratum weights and independent stratum samples. Its variance is Σ_h a_h²σ_h²/n_h. At fixed total n and equal per-sample costs, continuous allocation gives n_h proportional to a_hσ_h; unequal costs add their square-root cost factors. These are allocation formulas under the stated independence and known-weight model. Clustering instead represents dependence among rows and determines an inference unit; it is not itself a variance-reduction estimator [MATHEMATICALLY-DERIVED · DERIVED:eq-2.7; DERIVED:eq-2.22].

```figure
id: fig-2.13
kind: compare
title: Four estimators of one expectation over model outputs
caption: >-
  Every column estimates the same μ = E_p[f] and every column still pays one
  generation per sample; what differs is where the variance goes. Only
  importance sampling can reuse samples drawn from another distribution, and
  it pays for that in the ESS row. Control variates can reduce variance with an appropriate coefficient,
  while fixed-weight stratification removes allocation variance. Each needs a
  quantity with a known mean, or a known structure.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.7", "DERIVED:eq-2.8", "DERIVED:eq-2.9"]
alt: >-
  Comparison of four estimators of μ = E_p[f] from n sampled model outputs.
  Plain Monte Carlo: sample mean, unbiased, variance σ²/n, cost one
  generation and one evaluation of f per sample, failure mode σ²/n at small
  n. Importance sampling: weighted mean with w = p/q, unbiased in plain form
  and biased at finite n when self-normalised, asymptotic variance E_q[w²(f−μ)²]/n for normalized target p
  under the stated moment conditions, assumes p ≪ q, adds two log-probability evaluations per sample,
  failure mode weight degeneracy. Control variates or baselines (§34.2):
  f − b with a known mean added back, unbiased, lower variance only when its coefficient and covariance
  make Var(f − b) smaller, failure mode a learned baseline that lags the policy.
  Stratified sampling (§02.5): fixed-weight per-stratum means remove random
  stratum allocation; clustering instead describes dependence and the
  resampling unit. The estimator needs known strata; failure mode
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
    - { dimension: "variance", values: { mc: "σ²/n (Eq. 2.8)", imp: "E_q[w²(f−μ)²]/n; ESS alone is insufficient", cv: "Var(f − b)/n, below σ²/n only when Var(b) < 2Cov(f,b)", strat: "sum_h a_h^2 sigma_h^2/n_h for fixed stratum weights a_h" } }
    - { dimension: "assumption", values: { mc: "independent samples, finite σ²", imp: "p ≪ q: q > 0 wherever p > 0; finite weighted moments", cv: "a correlated quantity with known mean", strat: "known strata such as prompts or tasks" } }
    - { dimension: "per-sample cost", values: { mc: "one generation + one evaluation of f", imp: "the same + two log-probability evaluations for w_i", cv: "the same + evaluating b", strat: "the same + a stratum label per sample" } }
    - { dimension: "new failure mode", values: { mc: "σ²/n at small n", imp: "weight degeneracy, ESS ≪ n", cv: "a learned baseline that lags the policy", strat: "mis-specified strata" } }
```

## Extensions

### Improvements

Conditioning on available information and replacing sampled outcomes by their conditional means reduces variance by exactly the removed conditional-variance term. Importance sampling improves precision only when its proposal reduces the relevant weighted second moment; clipping and self-normalization change bias and must not be advertised as unconditional improvements. The inspected R2.7 §3 motivates conditional-score and repeated-answer analysis; no production speedup is established here [MATHEMATICALLY-DERIVED · DERIVED:eq-2.7].

For agents, the sampled object is a trajectory whose length and tool calls are random, so the per-sample cost is itself a random variable and the budget, not n, is the natural stopping rule (developed in [§36.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-1-agent-trajectories.md)). For multimodal generation the factorisation in Eq. 2.5 may be over patches or continuous latents, and the estimators change from categorical sampling to integration schemes ([Chapter 58](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch58-generative-multimodal-models-and-alternative-generation-paths/README.md)). Proposals are marked in those chapters.

## Limitations

The variance and CLT statements require their stated finite moments and, for Eq. 2.8, independence; heavy-tailed rewards and clustered prompts violate them, and §02.5 supplies the correction. Falsification: a Monte Carlo estimate whose empirical variance does not fall as 1/n across independent replications motivates checks for dependence, heavy tails, finite-sample error, or an implementation defect; it does not by itself identify a unique cause.

## Reproducibility

Symbols: p, q, w_i, ESS, σ² (local); p_θ, π_θ, π_ref from notation.md. The sampling distribution (temperature, truncation), the number of samples per prompt, and whether the estimator is self-normalised must be recorded with every reported expectation. No code was executed in this edition.

## References

P25 (GRPO's sampled KL estimator), R2.7 (conditional-score analysis), R2.20 (PyTorch multinomial interface). See [references.md](references.md).
