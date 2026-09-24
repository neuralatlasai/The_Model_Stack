---
id: ms.section.9.4
entity_type: section
title: Learned mixture selection
short_title: Learned mixtures
volume: 1
part: 2
chapter: 9
section: 9.4
slug: 09-4-learned-mixture-selection
parent: ms.chapter.9
prev_sibling: ms.section.9.3
next_sibling: ms.section.9.5
children: []
prerequisites: [ms.section.2.6, ms.section.6.2, ms.section.6.3, ms.section.6.4, ms.section.9.1, ms.section.9.2]
downstream: [ms.section.9.5, ms.section.9.6, ms.section.21.5, ms.section.21.6]
related: [ms.section.9.3]
siblings_by_mechanism: [ms.section.9.1, ms.section.9.3]
relations:
  - {type: supported_by, target: paper.P07}
  - {type: contradicted_by, target: ref.R9.3}
axes:
  lifecycle: [data, pretraining]
  mechanism: [mixture_optimisation, proxy_runs, distributionally_robust_optimisation, regression, bandit]
  feedback_setting: []
  modality: [text]
papers: [P07]
implementations: []
benchmarks: []
datasets: [the-pile, slimpajama, redpajama]
status:
  maturity: emerging
  disputed: true
evidence_summary:
  labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2400
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# 9.4 Learned mixture selection

## Scope

Objective: present the four families of methods that choose a weight vector from proxy runs — minimax reweighting (DoReMi), gradient-alignment reweighting (DoGE), regression over sampled mixtures (RegMix, data mixing laws, joint scaling laws) and online bandit allocation (ODM) — with their objectives as equations, their proxy costs, the validation-leakage risk each carries, and a frank account of the evidence that their weights transfer from small to large models. Baseline: a hand-set temperature ([§9.1](09-1-mixture-formulation.md)). Success criterion: the reader can compute the proxy compute of each method as a fraction of the main run, identify where the selection signal touches the reported evaluation, and state the largest scale at which each method's transfer has been demonstrated. Boundaries: the fitting methodology of scaling laws in general is owned by [§21.5](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md); the multilingual and specialist applications are [§9.5](09-5-multilingual-and-specialist-mixtures.md).

## Why this exists

What failed before was the hand-set mixture: temperatures and per-source epochs chosen by intuition (P03) or by downstream tuning that leaks the evaluation into the training set. PAPER-REPORTED (R9.1): DoReMi's motivation is that domain proportions "greatly affect" performance and that the default weights of The Pile are not optimal — a 280M proxy chose weights that let an 8B model reach the baseline's few-shot accuracy with 2.6× fewer steps. The bottleneck is cost: a full-scale run per candidate mixture is unaffordable, so every method replaces it with runs that are smaller in parameters, tokens or both, and then assumes something about how the small run's verdict transfers. The dominant constraint is therefore the validity of that transfer, and the second constraint is that the proxy's selection signal (a validation loss, a benchmark) must be kept separate from the evaluation that reports the gain, or the gain is partly circular. What changed is that the weight vector became an argmin of an explicit proxy objective, that a growing literature reports gains at 1B–8B with the proxy costing 1–10% of the main run, and that the same literature states, in its own limitation sections, that transfer beyond the tested scales is unverified. PAPER-REPORTED (R9.32): a March 2026 survey formalises data mixing as a bilevel problem on the simplex and lists "limited transferability across data domains, optimization objectives, models, and validation sets" and "unstandardized evaluation protocols" as cross-cutting challenges.

```figure
id: fig-9.20
kind: stat-panel
title: How far each reported method extrapolates from its proxy
caption: >-
  Every transfer claim in the section reduced to one number: the main model's
  parameters over the proxy's (or over the largest scale at which the method
  was checked). The open demonstrations stretch 2.4× to 28.6× in parameters,
  and the only 1000× entry is a rank fit verified no further than 1B. The
  independent support, DCLM's rank correlations, is for filtering decisions,
  not weight vectors. Scroll: the motivating result, the transfer table, what
  supports rank invariance, and the threshold that would change the verdict.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: [R9.1, R9.2, R9.3, R9.4, R9.22, P07, R9.8, R9.30]
alt: >-
  Instrument panel of proxy-to-main scale ratios as reported. DoReMi: 8B main
  over 280M proxy, 28.6×, reaching baseline few-shot accuracy in 2.6× fewer
  steps. DoGE: 684M over 82M, 8.3×. RegMix: rank fit verified from 1M to 1B,
  1000×; the 7B main run is 7× the largest verified scale and was compared with
  human selection. Data mixing laws: 1B predicted from fits up to 410M, 2.4×.
  ODM: no proxy, online at 1B. DCLM dataset rankings: r = 0.838 between the
  412M and 6.9B scales, 16.7×; r = 0.956 between 1B-1x and 7B-1x. Llama 3 405B and Qwen3 235B:
  proxy sizes NOT-DISCLOSED. Independent test at 70B or more: none found.
spec:
  header: "PROXY → MAIN SCALE, AS REPORTED"
  rows:
    - { key: "DoReMi: 8B ÷ 280M proxy", formula: "8e9/2.8e8", format: ratio }
    - { key: "DoReMi: steps to baseline accuracy", value: "2.6× fewer" }
    - { key: "DoGE: 684M ÷ 82M proxy", formula: "684e6/82e6", format: ratio }
    - { key: "RegMix: rank fit, 1B ÷ 1M", formula: "1e9/1e6", format: ratio, note: "verified only at 1M–1B" }
    - { key: "RegMix: 7B main ÷ 1B verified", formula: "7e9/1e9", format: ratio, note: "compared with human selection" }
    - { key: "Mixing laws: 1B ÷ 410M fitted", formula: "1e9/410e6", format: ratio }
    - { key: "ODM: proxy", value: "none; online at 1B" }
    - { key: "DCLM ranks 400M → 7B, r = 0.838", formula: "6.9e9/412e6", format: ratio, note: "scale table 412M and 6.9B; filtering, not mixtures" }
    - { key: "DCLM ranks 1B-1x vs 7B-1x", value: "r = 0.956" }
    - { key: "Llama 3 405B · Qwen3 235B proxies", value: "NOT-DISCLOSED" }
    - { key: "independent test at ≥ 70B", value: "none found" }
states:
  - { anchor: why-this-exists, label: "the motivating result", highlight: ["DoReMi: 8B ÷ 280M proxy", "DoReMi: steps to baseline accuracy"], note: "A 280M proxy chose weights that let an 8B model reach baseline few-shot accuracy in 2.6× fewer steps: a 28.6× extrapolation in parameters." }
  - { anchor: mechanism, label: "the transfer table", highlight: ["DoReMi: 8B ÷ 280M proxy", "DoGE: 684M ÷ 82M proxy", "RegMix: rank fit, 1B ÷ 1M", "RegMix: 7B main ÷ 1B verified", "Mixing laws: 1B ÷ 410M fitted", "ODM: proxy"], note: "Every open demonstration ends at or below 8B; the largest verified rank fit ends at 1B, and the mixing law extrapolates 2.4× past its largest fit." }
  - { anchor: observations, label: "what supports rank invariance", highlight: ["DCLM ranks 400M → 7B, r = 0.838", "DCLM ranks 1B-1x vs 7B-1x"], note: "Independent support is for filtering decisions: DCLM's dataset rankings correlate at r = 0.838 across 16.7× in parameters and 0.956 from 1B-1x. Nothing comparable exists for weight vectors." }
  - { anchor: limitations, label: "the falsification threshold", highlight: ["Llama 3 405B · Qwen3 235B proxies", "independent test at ≥ 70B"], note: "The frontier reports disclose neither method nor weights. An independent win at 70B or more with a held-out domain is what would move transfer from UNVERIFIED." }
```

## Intuition

Physically, every method spends a small amount of compute to estimate the gradient of a large run's outcome with respect to the weight vector, then moves along that gradient. DoReMi estimates it from the *headroom* per domain (how far a proxy trails a reference); DoGE from the *alignment* between a domain's gradient and the gradients of the target domains; RegMix and mixing laws from a *response surface* fitted over many mixtures; a bandit from the *reward* a domain yields as training proceeds. All of them are cheap because a small model's loss surface over the simplex is assumed to be a monotone image of the large model's. Heuristically one might say "the small model knows what the big one needs"; the physical statement is only that the ranking of mixtures by a small model's validation loss is being used as a proxy for the ranking by a large model's, and that assumption is what [Experiment 9.4](#experiment-94--transfer-of-proxy-chosen-weights-across-scale) tests.

## Formulation

Let domains i = 1..k, weights α ∈ Δ^{k−1}, proxy parameters θ, per-example loss ℓ_θ(x) summed over tokens, and D_i the domain-i training set.

> **Definition — proxy run.** A reduced-scale training run whose only product is a signal (weights, a fitted response surface, a ranking) used to choose the mixture of a larger run.

> **Definition — excess loss (domain reweighting).** For a token x_j of domain i, `max{ℓ_{θ,j}(x) − ℓ_{ref,j}(x), 0}`: the proxy model's per-token loss minus a reference model's, clipped at zero, as used by DoReMi.

**DoReMi (Group DRO over domains).** PAPER-REPORTED (R9.1, §2–3): with a reference model trained on the initial weights,

$$
\min_{\theta}\ \max_{\alpha \in \Delta^{k}}\ L(\theta, \alpha) := \sum_{i=1}^{k} \alpha_i \cdot \frac{1}{\sum_{x \in D_i} |x|} \sum_{x \in D_i} \big(\ell_\theta(x) - \ell_{\text{ref}}(x)\big)
$$
*(Eq. 9.12)* where |x| is the token count of example x, so each domain's term is token-normalised; the per-token excess loss is clipped at zero in the implementation. The paper reads the excess loss as "the headroom for the proxy model to improve" on that domain.

$$
\alpha'_t \leftarrow \alpha_{t-1}\,\exp(\eta\,\lambda_t), \qquad \alpha_t \leftarrow (1-c)\,\frac{\alpha'_t}{\sum_i \alpha'_t[i]} + c\,u, \qquad \bar{\alpha} = \frac{1}{T_{\text{steps}}}\sum_{t} \alpha_t
$$
*(Eq. 9.13)* where λ_t is the vector of per-domain clipped excess losses at step t, η = 1, c = 10⁻³ mixes toward the uniform vector u, and the returned weights are the trajectory average. PAPER-REPORTED (R9.1). The three steps: train a reference on reference weights; train the proxy with Eq. 9.12–9.13; resample with ᾱ and train the main model. Cost: two proxy-scale runs (reference and DRO proxy) — the paper reports the domain-optimisation compute as 8% of the FLOPs of the 8B main run at 280M — plus one extra forward pass of the reference per proxy batch.

**DoGE (gradient-alignment bilevel).** PAPER-REPORTED (R9.2, §2):

$$
\alpha^{\star} \in \arg\min_{\alpha \in \Delta^{k}} \sum_{i} \ell_i\big(\theta^{\star}(\alpha)\big), \qquad \theta^{\star}(\alpha) \in \arg\min_{\theta} \sum_{i} \alpha_i\,\ell_i(\theta)
$$
*(Eq. 9.14)* solved with single-step inner unrolling, giving the generalisation-estimation score and mirror-descent update

$$
W^{(t)}_j = \Big\langle \nabla \ell_j(\theta^{(t)}),\ \sum_{i} \nabla \ell_i(\theta^{(t)}) \Big\rangle, \qquad \alpha^{(t)} \propto \alpha^{(t-1)} \odot \exp\!\big(\eta^{(t)} W^{(t)}/\mu\big)
$$
*(Eq. 9.15)* where W_j decomposes into an out-of-domain influence term plus ‖∇ℓ_j‖² (domain difficulty), and the out-of-domain variant replaces the sum by ∇ℓ_ood. Final weights are the trajectory average. Cost: one 82M proxy for 10k iterations on SlimPajama's 7 domains, with k per-domain gradients per step (reduced by restricting to a subset of modules, which the paper reports reaches comparable performance at 2.5% of the computation); the paper states DoReMi "required 5× more tokens and 10× more floating point operations" than DoGE in its setting.

**RegMix (regression over sampled mixtures).** PAPER-REPORTED (R9.3): sample M mixtures h^{(m)} from a Dirichlet whose concentration is the token distribution scaled by a factor in [0.1, 5.0] (so that no domain below 1% of tokens is over-emphasised), train M small models, fit

$$
\hat{L}(h) = f_\psi(h), \qquad h^{\star} = \arg\min_{h \in \mathcal{S}} \hat{L}(h)
$$
*(Eq. 9.16)* where f_ψ is ridge regression or LightGBM on the mixture vector as features and validation loss on a chosen domain (Pile-CC) as the label, and 𝒮 is a large simulated set of candidate mixtures. Reported fit quality (Spearman rank correlation on held-out mixtures): 98.45% (LightGBM) and 90.08% (linear) at 1M; 98.64% / 89.26% at 60M; 97.12% / 88.01% at 1B. Cost: 512 models × 1M parameters × 1B tokens for the fit, reported as about 3.5·10¹⁸ FLOPs against about 3.7·10¹⁹ for DoReMi in the same setting, and embarrassingly parallel.

```figure
id: fig-9.21
kind: calculator
title: Selection compute as a share of the main run
caption: >-
  The price of choosing a mixture, in the 6ND accounting: a sweep of M proxy
  runs plus Algorithm 9.4's transfer ladder of four rungs (N_top/30, /10, /3
  and N_top, each trained twice at 20 tokens per parameter), against a main
  run of 20·m·N tokens. A RegMix-sized sweep is 0.05% of a 7B 1x run; the
  ladder, not the sweep, dominates, and it is quadratic in its top rung.
  6ND gives 3.1·10¹⁸ for the sweep where R9.3 reports ≈3.5·10¹⁸; the gap lies
  outside 6ND. Illustrative main-run size.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.16", "DERIVED:alg-9.4", R9.3]
alt: >-
  Calculator for the selection share (M·6·N_p·D_p + 2·6·20·Σ N_s²) /
  (6·N·20·m·N), with a four-rung ladder at N_top/30, N_top/10, N_top/3 and
  N_top where N_top = q·N. At the defaults (N = 7B, m = 1, M = 512 proxies of
  1M parameters on 1B tokens each, q = 0.1): main run 5.88·10²¹ FLOPs, sweep
  3.07·10¹⁸ (0.05%), ladder 1.32·10²⁰ (2.24%), total 2.30%. The top rung alone
  is 2.0%. With q = 0.3 the ladder is 20.2% of the main run; at m = 10 the
  default ladder is 0.22%.
spec:
  tex: >-
    \frac{M\cdot 6N_pD_p + 2\cdot 6\cdot 20\sum_s N_s^{2}}{6\,N\cdot 20\,m\,N},\qquad N_s \in \Big\{\tfrac{N_{\text{top}}}{30}, \tfrac{N_{\text{top}}}{10}, \tfrac{N_{\text{top}}}{3}, N_{\text{top}}\Big\},\ N_{\text{top}} = qN
  inputs:
    - { symbol: N, label: "main parameters N", default: 7.0e9, min: 1.0e8, max: 1.0e12, scale: log10, format: params }
    - { symbol: m, label: "Chinchilla multiplier m, D = 20·m·N", default: 1, min: 1, max: 10, options: [1, 2, 4, 10], format: integer }
    - { symbol: M, label: "proxy runs M", default: 512, min: 1, max: 1024, scale: log2, format: integer }
    - { symbol: Np, label: "proxy parameters N_p", default: 1.0e6, min: 1.0e6, max: 1.0e10, scale: log10, format: params }
    - { symbol: Dp, label: "tokens per proxy run D_p", default: 1.0e9, min: 1.0e8, max: 1.0e12, scale: log10, format: tokens }
    - { symbol: q, label: "ladder top rung ÷ N", default: 0.1, min: 0.03, max: 0.3, options: [0.03, 0.1, 0.3], format: fixed2 }
  outputs:
    - { symbol: C, label: "main run, 6·N·20·m·N", formula: "6*N*20*m*N", format: flops }
    - { symbol: Sw, label: "proxy sweep, M·6·N_p·D_p", formula: "M*6*Np*Dp", format: flops }
    - { symbol: Ld, label: "transfer ladder, 4 rungs × 2 arms", formula: "2*6*20*(q*N)^2*(1 + 1/9 + 1/100 + 1/900)", format: flops }
    - { symbol: share, label: "selection share of the main run", formula: "(Sw + Ld)/C", format: percent, emphasis: true }
    - { symbol: lad, label: "ladder share alone", formula: "Ld/C", format: percent }
  presets:
    - { label: "overtrained main, m = 10", values: { m: 10 } }
states:
  - { anchor: formulation, label: "RegMix-sized sweep", variables: { N: 7.0e9, m: 1, M: 512, Np: 1.0e6, Dp: 1.0e9, q: 0.1 }, highlight: [M, Np, Dp, Sw], note: "512 runs of 1M parameters on 1B tokens: 3.1·10¹⁸ FLOPs by 6ND (R9.3 reports ≈3.5·10¹⁸), 0.05% of an illustrative 7B 1x run." }
  - { anchor: algorithm, label: "ladder to N/10", variables: { N: 7.0e9, m: 1, q: 0.1 }, highlight: [Ld, lad, share], note: "Algorithm 9.4's ladder ending at N/10 costs 2.24% of the main run, 2.0% for the top rung alone as the Complexity paragraph estimates. It dwarfs the sweep." }
  - { anchor: experimental-design, label: "ladder to 0.3·N", variables: { N: 7.0e9, m: 1, q: 0.3 }, highlight: [q, Ld, lad], note: "Push the top rung to 0.3·N and the ladder is 20% of the main run: the cost of transfer evidence is quadratic in the largest rung, so Experiment 9.4's ladder is a real budget line." }
```

> **Definition — rank-invariance assumption.** The assumption that the ordering of mixtures by outcome is preserved across model size and token budget; RegMix states it as "the relative ranking of data mixtures in terms of their impact on model performance is consistent across different model sizes and numbers of training tokens" (PAPER-REPORTED, R9.3).

**Data mixing laws (parametric response surface).** PAPER-REPORTED (R9.4, §3):

$$
L_i(r_{1..M}) = c_i + k_i\,\exp\!\Big(\sum_{j=1}^{M} t_{ij}\,r_j\Big), \qquad L(r) = \sum_{i=1}^{K} s_i\Big[c_i + k_i\exp\!\Big(\sum_j t_{ij} r_j\Big)\Big]
$$
*(Eq. 9.17)* where r_j is the training proportion of domain j, L_i the validation loss on domain i, c_i an irreducible term, k_i > 0, t_{ij} an interaction coefficient (negative = facilitation, positive = conflict), and the second form handles a validation set of unknown composition through K implicit domains with learnable s_i. The pipeline nests a step-count law L(S) = E₁ + B/S and a size law L(N) = E₂ + A/N — fitted on 70M–410M models for 30k steps — under the mixing law to predict a 1B model at 100k steps. Cost: O(M × K) parameters, so the number of fitting runs grows with the domain count; the paper notes that sparsity in t_{ij} reduces the requirement below quadratic. PAPER-REPORTED (R9.31): a NeurIPS 2025 work fits a single law for loss as a function of (N, D, h) jointly across language, multimodal and vision pretraining and derives optimal weights for a target domain under a budget; its functional form was not opened beyond the abstract and is not reproduced here.

**Online bandit allocation (ODM).** PAPER-REPORTED (R9.22): an Exp3-style policy over domains with reward equal to the current training loss of the sampled domain (read as expected information gain per token),

$$
\pi_t(i) = (1 - K\epsilon_t)\,\frac{\exp(\epsilon_{t-1}\hat{R}_i)}{\sum_j \exp(\epsilon_{t-1}\hat{R}_j)} + \epsilon_t, \qquad \hat{R}_{i,t} = \beta\,\hat{R}_{i,t-1} + (1-\beta)\,\frac{R_{i,t}}{\pi_{t-1}(i)}
$$
*(Eq. 9.18)* where ε_t = min{1/K, √(ln K/(K t))} and R̂ is an importance-weighted moving average. Cost: negligible wall-clock, no proxy run; the paper reports 19% fewer iterations to the next-best method's final perplexity at 1B on The Pile, after a 1% warm-up needed because early losses have very high variance.

```figure
id: fig-9.22
kind: chart
title: Exploration floor of the ODM policy
caption: >-
  The ε_t schedule of Eq. 9.18 as the share of draws the policy reserves for
  uniform exploration, K·ε_t. The policy is exactly uniform until
  t = K·ln K, then the floor decays as √(K·ln K / t): with K = 22 it is
  uniform for 68 steps, still 26% uniform at step 1,000 and 8% at 10,000.
  More domains mean a longer uniform start, so the reward-driven weights have
  less of a short run to act in. K = 7, 22 and 100 are the SlimPajama, Pile
  and RegMix FineWeb-URL domain counts named in the section; the ODM run's
  own K is not asserted here.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.18", R9.22]
alt: >-
  Log–log line chart of the exploration share K·ε_t with
  ε_t = min(1/K, √(ln K/(K·t))) against the ODM step t from 1 to 100,000, for
  K = 7, 22 and 100 domains. Each curve is flat at 100% (a uniform policy)
  until t = K·ln K, which is 13.6 for K = 7, 68 for K = 22 and 461 for
  K = 100, and then falls as the inverse square root of t. At t = 1,000 the
  shares are 11.7%, 26.1% and 67.9%; at t = 10,000 they are 3.7%, 8.3% and
  21.5%; at t = 100,000 they are 1.2%, 2.6% and 6.8%.
spec:
  type: line
  x: { label: "ODM step t", scale: log10, format: integer, domain: [1, 100000] }
  y: { label: "uniform share of draws, K·ε_t", scale: log10, format: percent }
  variables: { Ka: 7, Kb: 22, Kc: 100 }
  series:
    - { id: k7, label: "K = 7 (SlimPajama domains)", formula: "Ka*min(1/Ka, sqrt(ln(Ka)/(Ka*x)))", sample: { from: 1, to: 100000, count: 41 } }
    - { id: k22, label: "K = 22 (Pile domains)", formula: "Kb*min(1/Kb, sqrt(ln(Kb)/(Kb*x)))", sample: { from: 1, to: 100000, count: 41 }, emphasis: true }
    - { id: k100, label: "K = 100 (RegMix FineWeb-URL)", formula: "Kc*min(1/Kc, sqrt(ln(Kc)/(Kc*x)))", sample: { from: 1, to: 100000, count: 41 } }
  annotations:
    - { x: 68, label: "K = 22: uniform until t = K·ln K ≈ 68" }
    - { x: 1000, label: "K = 22: 26% of draws uniform" }
    - { x: 10000, label: "K = 22: 8.3%" }
```

> **Definition — selection leakage (mixture).** Optimistic bias created when the signal used to choose a mixture (a validation domain, a benchmark, a reference model trained on the same pools) is also, or is correlated with, the evaluation that reports the mixture's gain.

> **Assumption.** Proxy validation losses are computed on held-out splits of the training domains, not on evaluation benchmarks · *sensitivity:* if a benchmark is the selection target, the reported benchmark gain is a fit statistic, not a generalisation result, and must be reported as such ([§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md)).

## Mechanism

**What each signal measures and its bias.** DoReMi's excess loss is relative to a reference trained on the *initial* weights, so the method's output depends on those weights and on the reference's capacity; PAPER-REPORTED (R9.1): "increasing the proxy model size improves downstream accuracy at 8B … but the trend does not continue for the 1B proxy model" because "the Group DRO optimizer is worse at larger scales", and iterated DoReMi converged in three rounds on GLaM when the change in any weight fell below 10⁻³. DoGE's alignment score up-weights domains whose gradients point where the target domains' gradients point; PAPER-REPORTED (R9.2): its weights were stable across 60M–124M proxies (mean absolute weight difference below 0.015), it "shows a clear phase transition" up-weighting arXiv and StackExchange early and web later, and — a limitation the authors state — "the proxy model performs worse than a same-scale base model", as DoReMi's auxiliary models also do. RegMix's regression can only rank mixtures within the sampled support, and its target is one validation domain; PAPER-REPORTED (R9.3): web corpora, "rather than data perceived as high-quality like Wikipedia", had the strongest positive correlation with downstream performance, and "domains interact in complex ways often contradicting common sense". The mixing law is a global parametric form whose errors compound through the nested laws; PAPER-REPORTED (R9.4): "our nested use of scaling laws can introduce errors in each step". The bandit adapts online but rewards high loss, which favours noisy or high-entropy domains unless the reward is corrected (R9.22 lists this as a limitation).

```figure
id: fig-9.23
kind: compare
title: Mixture-optimisation families by signal, cost and bias
caption: >-
  Read the rows as the section's questions: what does the proxy measure, what
  does it cost, and where can the signal mislead. The families differ most in
  the signal row and the bias row; they agree on one thing, the last row:
  none of the learned methods prices repetition, which is why every output
  must be clipped to the admissible windows of §9.2 before use. Costs are as
  each paper reports them, in its own setting; they are not comparable across
  columns.
placement: wide
evidence: PAPER-REPORTED
source: [R9.1, R9.2, R9.3, R9.4, R9.22, R9.12]
alt: >-
  Comparison table with six columns: hand-set temperature or cap, DoReMi,
  DoGE, RegMix, data mixing laws and ODM. Signal: pool sizes only; clipped
  excess loss over a reference; gradient alignment with target domains;
  validation loss of many small runs on sampled mixtures; a fitted exponential
  law per validation domain; the current loss of the sampled domain.
  Objective: Eq. 9.3–9.5; Group DRO, Eq. 9.12–9.13; single-step bilevel, Eq.
  9.14–9.15; surrogate argmin, Eq. 9.16; parametric law nested in step and size
  laws, Eq. 9.17; Exp3-style, Eq. 9.18. Proxy runs: none; reference plus proxy
  at 280M; one 82M proxy for 10k steps; 512 runs of 1M parameters on 1B tokens;
  70M–410M runs for 30k steps; none. Reported cost: zero; 8% of the 8B main
  run; DoReMi used 5× more tokens and 10× more FLOPs in DoGE's setting;
  ≈3.5·10¹⁸ versus ≈3.7·10¹⁹ FLOPs for DoReMi; O(M × K) fitted parameters;
  negligible after a 1% warm-up. Prices repetition: only the cap; none of the
  learned methods.
spec:
  axis: >-
    What each family measures at proxy scale, what the selection costs as its
    paper reports it, where the signal can bias the chosen weights, and whether
    the method prices repetition
  columns:
    - { id: hand, label: "Hand-set T_s or cap" }
    - { id: doremi, label: "DoReMi · DRO", node: ms.section.9.4 }
    - { id: doge, label: "DoGE · alignment" }
    - { id: regmix, label: "RegMix · regression" }
    - { id: mixlaw, label: "Data mixing laws" }
    - { id: odm, label: "ODM · bandit" }
  rows:
    - { dimension: "signal", values: { hand: "pool sizes n_i only", doremi: "clipped per-token excess loss over a reference model", doge: "alignment of each domain's gradient with the target domains' gradients", regmix: "validation loss of M small runs on sampled mixtures", mixlaw: "fitted L_i(r) = c_i + k_i·exp(Σ_j t_ij·r_j) per validation domain", odm: "current training loss of the sampled domain" } }
    - { dimension: "objective", values: { hand: "Eq. 9.3–9.5", doremi: "Group DRO minimax, Eq. 9.12–9.13", doge: "bilevel, single-step unrolled, Eq. 9.14–9.15", regmix: "argmin of a ridge or LightGBM surrogate, Eq. 9.16", mixlaw: "argmin of a law nested in step and size laws, Eq. 9.17", odm: "Exp3-style regret, Eq. 9.18" } }
    - { dimension: "proxy runs", values: { hand: "none", doremi: "reference + DRO proxy, 280M", doge: "one 82M proxy, 10k steps, 7 domains", regmix: "512 × 1M params × 1B tokens", mixlaw: "70M–410M models, 30k steps", odm: "none; online inside the main run" } }
    - { dimension: "selection cost as reported", values: { hand: "zero", doremi: "8% of the 8B main run's FLOPs", doge: "DoReMi used 5× more tokens and 10× more FLOPs in DoGE's setting", regmix: "≈3.5·10¹⁸ FLOPs vs ≈3.7·10¹⁹ for DoReMi", mixlaw: "O(M × K) fitted parameters; fitting runs grow with domain count", odm: "negligible wall-clock; 1% warm-up" } }
    - { dimension: "where the signal can bias α", values: { hand: "carries no information about domain interactions", doremi: "depends on the reference weights and capacity; DRO degrades at a 1B proxy", doge: "proxy performs worse than a same-scale base model", regmix: "ranks only within the sampled support; one target domain (Pile-CC)", mixlaw: "errors compound through the nested laws", odm: "rewards irreducible entropy: loss, not loss decrease" } }
    - { dimension: "prices repetition", values: { hand: "only through the Eq. 9.5 cap", doremi: "no", doge: "no", regmix: "no; assumes unlimited domain data", mixlaw: "no", odm: "no" } }
```

**Transfer evidence, stated plainly.** The evidence that proxy-chosen weights transfer is the following list, and nothing more was found in the sources opened:

| Method | Proxy scale | Largest main scale reported | Transfer claim as stated | Label |
|---|---|---|---|---|
| DoReMi (R9.1) | 280M (reference and proxy), 200k–300k steps | 8B, The Pile (22 domains) and GLaM (8 domains) | +6.5 points average few-shot; baseline accuracy at 2.6× fewer steps; 1B proxy did not improve further; "the limits of how far these domain weights transfer are important questions to answer in future work" | PAPER-REPORTED |
| DoGE (R9.2) | 82M, 10k steps, SlimPajama 7 domains | 684M | Better average perplexity than uniform and than DoReMi-10k/50k at 684M; "scaling-up experiments with larger models and datasets is an important future direction" | PAPER-REPORTED |
| RegMix (R9.3) | 512 × 1M, 1B tokens each; also 60M | 1B for 25B tokens (best of 64 candidates); 7B for 100B tokens vs human selection | Rank invariance "verified only at 1M–1B parameter scales"; "not tested on models > 1B"; assumes unlimited domain data and a shared tokenizer | PAPER-REPORTED |
| Data mixing laws (R9.4) | 70M–410M, 30k steps | 1B for 100B tokens on RedPajama | Optimised mixture matched the default mixture's performance at 0.73 of its steps; equivalent to 1.48× more tokens on the default mix | PAPER-REPORTED |
| ODM (R9.22) | none (online) | 1B for 50B tokens on The Pile | 19% fewer iterations than DoReMi-50k weights; "only tested at 1B" | PAPER-REPORTED |
| Llama 3 (R9.8) | "several small models" per candidate mix | 405B | Scaling-law experiments used to choose the mix; sizes, counts and weights NOT-DISCLOSED | PAPER-REPORTED / NOT-DISCLOSED |
| Qwen3 (R9.30) | "small proxy models" | 235B (MoE) | Instance-level mixture optimised "through extensive ablation experiments on small proxy models with the fine-grained data labels"; weights NOT-DISCLOSED | PAPER-REPORTED / NOT-DISCLOSED |

Two facts follow. First, no independent replication of any method's transfer at frontier scale was found; the largest open demonstration is DoReMi's 8B, and even there the proxy-size trend reversed at 1B. Second, the two frontier reports that mention proxy-based selection disclose neither the method nor the weights, so their success cannot be attributed to any published method. DERIVED. Against this, PAPER-REPORTED (P07, Figure 3): DCLM found high Pearson correlations of *dataset* rankings between small and large scales (r = 0.838 at 400M-1x, 0.956 at 1B-1x, 0.982 at 3B-1x versus 7B-1x), which supports rank invariance for filtering decisions across a 17× parameter range at matched Chinchilla multiples; whether that extends to mixture vectors and to the 100× ranges the methods rely on is UNVERIFIED.

**Leakage paths.** (i) The selection validation set shares a source with the reported evaluation (e.g. selecting on Pile-CC loss and reporting on tasks derived from web text). (ii) The reference model is trained on the same pools, so DoReMi's headroom inherits the reference's contamination. (iii) Benchmark training splits are inside a candidate domain (OLMo 2's Dolmino carries the GSM8K train split, R9.7 — a disclosed, deliberate choice, but one that turns a GSM8K gain into in-distribution exposure). (iv) Iterated selection on a fixed validation set overfits it as any repeated test-set use does ([§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md)). The remedy in every case is a held-out domain excluded from the pools, from the reference model, and from the selection target — which [verification.md](verification.md) requires.

## Algorithm

```text
Algorithm 9.4 — Proxy-run mixture selection with a leakage guard
INPUT   domains D_1..D_k with held-out validation splits V_1..V_k; a held-out domain D_H (never in any pool, never a target);
        proxy family (size N_p, tokens D_p); selection method ∈ {DRO, alignment, regression, bandit}; budget of the main run (N, D);
        transfer test scales N_1 < N_2 < … ≤ N
OUTPUT  weights α*; a transfer report; a leakage report
STATE   proxy checkpoints; fitted surface or weight trajectories; ledgers from Algorithm 9.1 for every run
INVARIANT V_i ∩ D_i = ∅; D_H ∩ (∪_i D_i ∪ selection targets ∪ reported benchmarks) = ∅; every run's exposure ledger is retained
1.  freeze the pools and tokenizer; compute n_i and the admissible windows of §9.2 for the main budget D
2.  run the method at proxy scale:
      DRO:        train reference on α_ref; train proxy with Eq. 9.12–9.13; α* ← ᾱ
      alignment:  train proxy with Eq. 9.14–9.15; α* ← trajectory average
      regression: sample M mixtures within the admissible windows; train M proxies; fit Eq. 9.16 or 9.17; α* ← argmin over the windows
      bandit:     not applicable offline — record π_t of a pilot run and take its time average as α*
3.  clip α* to the admissible windows (§9.2) and record epochs e_i(α*) at the main budget; if any e_i exceeds the cap, renormalise (Eq. 9.5)
4.  transfer test: for each N_s in the scale ladder, train (α*, baseline α_ref) pairs at matched tokens 20·N_s; record the sign and size of the gain per V_i and on D_H
5.  leakage report: list every dataset touched by steps 1–4 and its overlap (n-gram, §8.5) with every reported evaluation; flag any non-empty overlap
6.  emit α* only if the gain's sign is stable across the ladder and D_H is not degraded beyond the pre-registered margin at any scale; otherwise emit α_ref with the report
TERMINATION: after the ladder; the main run is not started by this algorithm.
```

Complexity: step 2 costs one or two proxy runs (DRO, alignment) or M proxy runs (regression); step 4 costs Σ_s 2 · 6 · N_s · 20 N_s FLOPs for the ladder, which for a ladder ending at N/10 is dominated by its top rung, 2·6·20·(N/10)² — 2.0% of the main run's 6·N·20N when D = 20N; the four rungs of Experiment 9.4's 1 : 3 : 10 : 30 ladder (N/300 to N/10) add about 12% to that, 2.24% in total; both shares divide by m when the main run is overtrained to D = 20·m·N. Implementation link: `comparison_manifest.json` in [verification.md](verification.md).

```figure
id: fig-9.24
kind: cycle
title: Proxy → mixture → target loop with a leakage guard
caption: >-
  Algorithm 9.4 as a loop rather than a pipeline. The forward column is the
  path every method shares; the arcs on the right are where it returns. A
  candidate can go back to the proxy (DoReMi iterated three rounds on GLaM
  before the weights stopped moving), the ladder's gate can reject it and fall
  back to the reference weights, and the held-out domain's verdict on the
  main run feeds the next run's pools and selection target. The main run
  itself sits outside the algorithm.
placement: inline
evidence: DERIVED
source: ["DERIVED:alg-9.4", R9.1]
alt: >-
  Cycle of ten stages. Frozen pools and tokenizer with admissible windows feed
  proxy runs (DRO, alignment, regression or bandit), which produce a selection
  signal on held-out domain splits V_i, which yields a candidate weight vector
  α*. The candidate is clipped to the admissible windows with epoch caps at the
  main budget, then tested on a transfer ladder of (α*, α_ref) pairs at 20·N_s
  tokens, then checked by a leakage report of n-gram overlaps with every
  evaluation. A gate asks whether the gain's sign is stable across the ladder
  and the held-out domain D_H is within its margin; if so α* goes to the main
  run, which is evaluated on D_H and an independent suite. Feedback arcs: from
  the candidate back to the proxy (iteration, three rounds for DoReMi on GLaM);
  from the gate back to the proxy with α_ref emitted on a sign flip; from the
  evaluation back to the pools for the next run.
spec:
  stages:
    - { id: pools, label: "frozen pools + tokenizer", kind: dataset, sub: "n_i and admissible windows (§9.2)" }
    - { id: proxy, label: "proxy runs", kind: process, sub: "DRO · alignment · regression · bandit" }
    - { id: signal, label: "selection signal on V_i", kind: metric, sub: "held-out splits, never benchmarks" }
    - { id: alpha, label: "candidate weights α*", kind: state }
    - { id: clip, label: "clip to windows, cap epochs", kind: process, sub: "Eq. 9.5 at the main budget" }
    - { id: ladder, label: "transfer ladder", kind: process, sub: "(α*, α_ref) pairs at 20·N_s tokens" }
    - { id: leak, label: "leakage report", kind: dependency, sub: "n-gram overlap with every evaluation" }
    - { id: gate, label: "sign stable and D_H in margin?", kind: branch }
    - { id: main, label: "main run with α*", kind: model, sub: "outside Algorithm 9.4" }
    - { id: evalH, label: "held-out D_H + independent suite", kind: metric }
  edges:
    - { from: pools, to: proxy }
    - { from: proxy, to: signal }
    - { from: signal, to: alpha }
    - { from: alpha, to: clip }
    - { from: clip, to: ladder }
    - { from: ladder, to: leak }
    - { from: leak, to: gate }
    - { from: gate, to: main, label: "emit α*" }
    - { from: main, to: evalH }
    - { from: alpha, to: proxy, kind: feedback, label: "iterate; DoReMi: 3 rounds" }
    - { from: gate, to: proxy, kind: feedback, label: "sign flip: emit α_ref, revise" }
    - { from: evalH, to: pools, kind: feedback, label: "next run's pools and target" }
```

Cost line: parameters — proxy models, discarded; tokens — proxy tokens plus ladder tokens (reported as a fraction of D); FLOPs — 1–10% of the main run as the papers report, plus the ladder; memory — proxy checkpoints and ledgers; communication — none beyond ordinary training; latency — the selection precedes the main run and is on its critical path unless overlapped; energy and money — NOT-DISCLOSED for any production selection.

## Implementation

Tensors → operators: DoReMi needs a per-example loss vector `[B]` split by domain id and a reference forward pass per batch; DoGE needs per-domain gradient vectors (or projections onto a module subset), which is k backward passes or one backward with per-domain accumulation; RegMix and mixing laws need only the loss scalars of independent runs; ODM needs per-domain batch losses and a policy update on the host. Framework: any trainer that exposes per-example losses and domain ids in the batch — which requires the sampler of [§9.1](09-1-mixture-formulation.md) to tag each packed sequence with its domain composition ([§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md)). Named reference-stack systems with §4.1 layer: **MosaicML LLM Foundry** (Distributed training) — its per-stream `proportion` (R9.33) is the natural home for α*, and stratified batching gives every batch the exact composition the proxy assumed; **Megatron-LM** (Distributed training) — a blend rebuild per candidate mixture (R9.36) makes a RegMix-style sweep a set of independent index builds; **PyTorch** (Model / autograd framework) — per-example losses via an unreduced cross-entropy and `torch.func`-style per-sample gradients for the alignment score (no property of a specific release is asserted; UNVERIFIED). Kernels: none specific. Memory: k gradient copies for DoGE at proxy scale. Communication: a reduction of per-domain losses across ranks per step for DRO and bandit updates. Deployment: α* is written to `mixture_policy.yaml` with its provenance (method, proxy scale, seed, selection target).

> **Implementation note [impl.pytorch · UNVERIFIED].** Per-domain gradients for Eq. 9.15 can be approximated by restricting to a subset of modules, as R9.2 reports; which modules preserve the ranking is a property of the model and has not been established beyond that paper's setting.

## Experimental design

### Experiment 9.4 — Transfer of proxy-chosen weights across scale

- **Hypothesis.** Weights chosen at proxy scale N_p improve the in-mixture aggregate over a size-proportional baseline at N_p and at 10·N_p, with the same sign per domain, without degrading a held-out domain; the gain's magnitude shrinks with scale (the R9.8 405B observation) but its sign does not flip.
- **Setup.** Open pools with k = 8–16 domains; proxy N_p = 100M–300M; ladder N ∈ {N_p, 3N_p, 10N_p, 30N_p}; tokens 20N at each rung; one method from each family (DRO, alignment, regression) plus the baseline and a hand-set temperature T_s = 2.
- **Independent variables.** Method; scale rung; proxy size (two values, to test the R9.1 non-monotonicity).
- **Controlled variables.** Tokenizer, pools, admissible windows and epoch caps, model family, schedule, seeds (3 at the small rungs, 2 at the largest), evaluator independent of the selection target.
- **Dataset / workload.** Held-out per-domain splits V_i for selection; a separate benchmark suite for reporting; held-out domain D_H excluded from everything.
- **Hardware.** Any; equal tokens at fixed N and T implies equal FLOPs per rung.
- **Metrics.** Token-mean loss per V_i; benchmark suite; D_H loss; rank correlation of the per-domain gain vector across rungs; the exposure ledger per run.
- **Baselines.** Size-proportional; T_s = 2.
- **Expected result.** Positive in-mixture gains at N_p for all methods; sign-stable gains at 10N_p for at least the regression family (the DCLM correlation supports this); a proxy-size non-monotonicity for DRO if R9.1's finding generalises; D_H unchanged within the margin for methods that do not target it, degraded for a method that over-concentrates weight.
- **Ablation.** Select on a benchmark instead of V_i and report the same benchmark: the measured "gain" rises — quantifying leakage.
- **Interpretation.** Sign stability across the ladder is the minimal transfer evidence; a sign flip at any rung falsifies rank invariance for that method and pool set.
- **Threats to validity.** The largest rung is still far below frontier scale; domain definitions are corpus-specific; the epoch caps may bind differently across rungs, confounding scale with repetition.

## Observations

**What the paper claims.** PAPER-REPORTED (R9.1): DoReMi improves perplexity on every Pile domain even where it down-weights one, and matches downstream-tuned weights on GLaM without task knowledge. PAPER-REPORTED (R9.2): DoGE beats DoReMi at 684M with one proxy and finds inter-domain dependencies for out-of-domain targets. PAPER-REPORTED (R9.3): RegMix beats human selection up to 7B/100B and matches or exceeds DoReMi at 10% of its compute; mixture effects "transcend scaling laws". PAPER-REPORTED (R9.4): the optimised mixture equals the default at 0.73 of the steps and predicts the critical proportion that avoids forgetting in continual training. PAPER-REPORTED (R9.22): ODM reaches the next-best final perplexity with 19% fewer iterations.

**What the evidence shows.** Each claim is a single-group result on one or two corpora; the methods have been compared against each other mainly by their own authors, at ≤ 1B for all but DoReMi. The rank-invariance premise has independent support for *filtering* decisions across 17× in parameters (P07) and none for mixture vectors beyond the authors' own ladders. The two frontier reports that mention proxy-based mixture selection disclose nothing that would let any method be credited.

**What we infer.** DERIVED: at present the safest reading is that proxy selection reliably improves over a naive baseline at the proxy's own scale and up to about 10–30× its parameters, with diminishing and unverified returns beyond; that the choice of selection target (which validation domain) matters at least as much as the method; and that the admissible windows of [§9.2](09-2-quality-and-diversity.md) must constrain any method's output, because none of the methods except UniMax-style caps prices repetition.

**What remains unknown.** NOT-DISCLOSED: the methods, proxy sizes and weights used by closed frontier runs. UNVERIFIED: transfer beyond the scales tabulated; the behaviour of any method when domains number in the hundreds (RegMix's FineWeb-URL experiment used 100 domains but was not opened in detail); the reproducibility of DoReMi's 1B non-monotonicity.

## Failure modes

> **Failure mode — leaked selection target.** *Symptom:* a large benchmark gain that shrinks or vanishes on a fresh benchmark of the same skill. *Cause:* selection on the reported benchmark or a correlated split. *Detection:* Algorithm 9.4 step 5; Experiment 9.4 ablation. *Mitigation:* select on held-out domain splits; report on an independent suite.

> **Failure mode — reference dependence (DRO).** *Symptom:* different reference weights give materially different α*. *Cause:* excess loss is relative to the reference. *Detection:* run DoReMi from two reference weightings. *Mitigation:* iterate to convergence (R9.1) or use a reference-free method.

> **Failure mode — extrapolation off the sampled support (regression).** *Symptom:* the predicted optimum lies at a simplex corner never sampled and the trained model underperforms the prediction. *Cause:* the surrogate extrapolates. *Detection:* compare the optimum to the convex hull of sampled mixtures. *Mitigation:* constrain the argmin to the sampled hull and the admissible windows.

> **Failure mode — repetition ignored.** *Symptom:* α* puts weight on a small domain that at the main budget implies e_i ≫ 4. *Cause:* the proxy budget never exhausted the domain (RegMix assumes unlimited data). *Detection:* e_i(α*) at the main budget, Algorithm 9.4 step 3. *Mitigation:* epoch caps before the argmin.

> **Failure mode — reward-loss bias (bandit).** *Symptom:* the policy concentrates on the noisiest domain. *Cause:* reward = loss rewards irreducible entropy. *Detection:* the domain's loss does not fall while its share rises. *Mitigation:* reward on loss *decrease* or on excess loss; warm-up (R9.22).

## Siblings

**Hand-set temperature / epochs** — [§9.1](09-1-mixture-formulation.md)
Why it exists: no proxy compute. What assumption changed (relative to learned selection): a size-based prior suffices. What objective changed: none. What problem it solved: simplicity, reproducibility. What new failure mode it introduced: no information about domain interactions. Changed primitive: α from n_i.

**Minimax reweighting (DoReMi)** — this file, Eq. 9.12–9.13
Why it exists: robustness to the worst domain's headroom. What assumption changed: excess loss over a reference measures learnability. What objective changed: Group DRO. What problem it solved: task-agnostic weights that improved every domain at 8B. What new failure mode it introduced: reference dependence; optimiser degradation at larger proxies. Changed primitive: fixed α → EG ascent on α.

**Gradient-alignment reweighting (DoGE)** — this file, Eq. 9.14–9.15
Why it exists: DoReMi mimics a reference rather than minimising target loss. What assumption changed: single-step inner unrolling approximates the bilevel solution. What objective changed: average target loss after the next step. What problem it solved: one proxy; out-of-domain targets. What new failure mode it introduced: k per-domain gradients per step. Changed primitive: excess loss → gradient inner products.

**Regression and response surfaces (RegMix, mixing laws, joint scaling laws)** — this file, Eq. 9.16–9.17
Why it exists: many cheap independent runs parallelise better than one adaptive run. What assumption changed: rank invariance across scale; a smooth surface over the simplex. What objective changed: a fitted surrogate. What problem it solved: 10× less compute than DoReMi in R9.3's setting; predictions for unseen mixtures. What new failure mode it introduced: extrapolation error; O(M × K) fitting cost; error compounding through nested laws. Changed primitive: an optimiser on α → a surrogate over α.

**Online bandit allocation (ODM)** — this file, Eq. 9.18
Why it exists: fixed weights cannot follow training dynamics. What assumption changed: current loss is a reward. What objective changed: regret over domains. What problem it solved: no proxy run. What new failure mode it introduced: reward bias toward entropy; micro-batch homogeneity. Changed primitive: α → π_t.

**Annealing probes** — [§9.3](09-3-curriculum-design.md)
Why it exists: judge a candidate dataset from a short decay run. What assumption changed: a late-phase verdict transfers to a full run. What objective changed: none. What problem it solved: cheap per-dataset measurement at 8B. What new failure mode it introduced: joint data/schedule effect. Changed primitive: proxy *model* → proxy *phase*.

## Extensions

Domain adaptation uses the out-of-domain variant of Eq. 9.15 or the mixing law's critical-proportion prediction (R9.4) to choose a replay share ([§22.2](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-2-distribution-transitions.md)). Long-context mixtures need the length bucket as a domain axis. Multimodal mixtures are covered by R9.31's joint law in the abstract's claim; not verified here. Instance-level selection — labels on every document rather than domains (R9.30) — turns k into the number of label combinations and makes regression the only tractable family (proposal). Post-training mixtures ([§31.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-2-data-families.md)) reuse the same machinery on smaller budgets where full-scale sweeps are affordable.

## Limitations

Every method assumes a fixed domain partition; PAPER-REPORTED (R9.4): "the concept of domains is not well-defined". The equations reproduce each paper's stated objective, but the implementations contain choices (clipping, smoothing, module subsets, Dirichlet scaling) that the equations do not capture and that affect the output. Falsification of the section's stance: an independent demonstration that any method's proxy-chosen weights beat a strong hand-set baseline at ≥ 70B with a held-out domain would move the transfer question from UNVERIFIED to PAPER-REPORTED; a sign flip in Experiment 9.4 at 10N_p would establish that rank invariance fails for that method.

## Reproducibility

Method, proxy scale, tokens, seeds, selection target, sampled-mixture list (regression), reference weights (DRO), module subset (alignment), and the resulting α* with epochs at the main budget — all in `mixture_policy.yaml` provenance fields. Sources opened: R9.1 (arXiv abs; ar5iv HTML; NeurIPS proceedings PDF located), R9.2 (arXiv abs; arXiv HTML; PDF text extracted), R9.3 (arXiv abs; arXiv HTML; ICLR proceedings listing located), R9.4 (arXiv abs; arXiv HTML), R9.22 (arXiv abs; ar5iv HTML), R9.31 (arXiv abs), R9.32 (arXiv abs), P07 (arXiv HTML). No method was re-run for this edition (UNVERIFIED).

## References

P03 · P07 · R9.1 · R9.2 · R9.3 · R9.4 · R9.7 · R9.8 · R9.22 · R9.30 · R9.31 · R9.32 · R9.33 · R9.36 · [references.md](references.md)
