---
id: ms.section.21.6
entity_type: section
title: Capability prediction
short_title: Capability prediction
volume: 1
part: 4
chapter: 21
section: '21.6'
slug: 21-6-capability-prediction
parent: ms.chapter.21
prev_sibling: ms.section.21.5
next_sibling: ms.verification.21
children: []
prerequisites:
- ms.chapter.6
- ms.chapter.9
- ms.chapter.13
- ms.chapter.19
- ms.chapter.20
downstream:
- ms.chapter.22
- ms.chapter.29
- ms.chapter.30
related:
- ms.chapter.35
- ms.chapter.36
- ms.chapter.59
siblings_by_mechanism: []
relations:
- type: supported_by
  target: paper.P08
- type: supported_by
  target: paper.P09
axes:
  lifecycle:
  - pretraining
  - post_training
  - evaluation
  - inference
  mechanism:
  - scaling_laws
  - compute_allocation
  feedback_setting: []
  modality:
  - text
papers:
- P07
- P08
- P09
implementations: []
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 21.6 Capability prediction

## Scope

[DERIVED] Predicting next-token loss and predicting task success require different models. A smooth improvement in average cross-entropy does not fix answer extraction, sampling, reasoning strategy, task composition, scoring thresholds or finite-test resolution. A capability forecast must therefore reconstruct the measurement map between a model's behavior and the reported score, then validate that map on unseen models or tasks.

## Why this exists

[PAPER-REPORTED] Apparent emergence studies and observational scaling studies address separate gaps: how scoring creates curve shape, and how benchmark coordinates predict unseen model outcomes. Both require a precise evaluation contract. Reported prediction successes coexist with failed extrapolations at extreme training ratios and selected large-model targets; those failures remain evidence rather than inconvenient exceptions. [R21.13], §§2–4; [R21.14], §§3–5; [R21.3], §5; [R21.17], §§4–6.

## Intuition

[MATHEMATICALLY-DERIVED] Cross-entropy averages log probabilities; exact-match success applies a nonlinear event to a sequence; a benchmark then averages a finite set of those events. Nonlinearity and finite resolution can create steep measured transitions from smooth probability changes. Conversely, averaging can conceal a large change on a rare slice. A response map must therefore be validated separately from the upstream size/loss predictor.

## Formulation

[MATHEMATICALLY-DERIVED] Let $c_j=-\log p_\theta(x_j\mid x_{<j})$ be the correct-token log loss for a deterministic target. Sampling the correct token has probability $e^{-c_j}$; generating an entire reference sequence of length $m$ has probability

$$
p_{\mathrm{reference}}=\prod_{j=1}^m p_\theta(x_j\mid x_{<j})
=\exp\left(-\sum_{j=1}^m c_j\right).
$$
*(Eq. 21.22)*

[DERIVED] This autoregressive factorization does not require independent unconditional token events; each factor uses the correct prefix. With $c=m^{-1}\sum_jc_j$ on this reference, $e^{-mc}$ is exact. Substituting a corpus-average loss instead requires an additional representativeness assumption. Include the end-of-sequence token when the event is the exact terminated completion rather than a reference prefix. Neither expression is an identity between arbitrary corpus-average loss and task accuracy. Multiple valid answers, greedy decoding, verifier selection and free-form answer extraction each change the event being measured.

[MATHEMATICALLY-DERIVED] Even identical correct-token probability does not identify top-1 accuracy. A true token with probability 0.4 is ranked first against competitors 0.3 and 0.3, and ranked second against 0.5 and 0.1. Both cases have the same correct-token log loss. For token-level top-1 error, an incorrect prediction implies $p_{\mathrm{true}}\le1/2$, giving $\Pr(\mathrm{error})\le L/\log2$ under the same evaluation distribution. This loose upper bound can be vacuous and is not a quantitative map to sequence-level reasoning success.

[MATHEMATICALLY-DERIVED] A thresholded task metric can transform a continuous latent score $z$ into $\mathbf1\{z\ge t\}$. For a distribution of thresholds, aggregate success is a cumulative distribution function evaluated at $z$. Concentrated thresholds can produce a steep rise even when $z$ changes smoothly. Conversely, a continuous aggregate loss can conceal a discontinuity or regression on a small task subset because its contribution receives little weight.

## Mechanism

```figure
id: fig-21.11
kind: diagram
title: From a model predictor to measured task success
caption: Task forecasts depend on a response map, decoding and scoring. Finite benchmark resolution and independent validation constrain interpretation of apparent jumps or saturation.
placement: wide
evidence: DERIVED
source: [R21.13, R21.14, R21.15]
alt: Loss or capability predictors enter a task response map, followed by decoding and scoring, then a finite benchmark score. Independent targets validate the full chain.
spec:
  direction: TB
  nodes:
    - {id: predictor, kind: model, label: loss or capability predictors}
    - {id: map, kind: process, label: task response map}
    - {id: decode, kind: process, label: decoding and answer selection}
    - {id: metric, kind: metric, label: continuous or thresholded scoring}
    - {id: test, kind: dataset, label: finite benchmark and slices}
    - {id: validate, kind: boundary, label: independent model validation}
  edges:
    - {from: predictor, to: map}
    - {from: map, to: decode}
    - {from: decode, to: metric}
    - {from: metric, to: test}
    - {from: test, to: validate}
```

### Methodology

### Apparent emergence is a measurement question

[PAPER-REPORTED] Wei et al. define emergence operationally through abilities that appear absent at smaller scales and present at larger scales, discussing the limits of extrapolation. Schaeffer et al. investigate whether nonlinear and discontinuous metrics can create such appearances from smoother changes. Their empirical analyses change scoring functions, including exact-match versus more graded metrics, and study finite-sample resolution. These are distinct contributions to the interpretation of reported curves. [R21.16; R21.13, sections 2–4]

[DERIVED] The useful scientific question is which claim survives a change in metric, test size and decoding contract. A jump in exact-match accuracy can coexist with a smooth change in token probabilities or edit distance. That does not show the task is unimportant, that the underlying model has no new useful behavior, or that every discontinuity is a measurement artifact. A genuine mechanism change requires evidence beyond observing the shape of one thresholded score.

### Finite benchmarks impose detection and saturation limits

[MATHEMATICALLY-DERIVED] If $M$ independent, identically distributed Bernoulli items yield zero successes, the probability of that outcome at true success probability $p$ is $(1-p)^M$. A one-sided 95% upper bound solves

$$
p_{\mathrm{upper}}=1-0.05^{1/M}\approx\frac{-\log0.05}{M}\approx\frac3M.
$$
*(Eq. 21.23)*

[DERIVED] Zero observed successes therefore does not establish zero capability. Correlated items, shared templates or domain clusters reduce the justification for the iid calculation. The score resolution is $1/M$ for unweighted exact-match accuracy, while prompt/sampling variation can add another source of noise. Near saturation, one or two changed items can dominate the measured gain; repeated model selection on a public benchmark further changes its evidential meaning.

[MATHEMATICALLY-DERIVED] For independent answers with per-answer success $p$, at-least-one success among $k$ samples is $1-(1-p)^k$. Mean success over those samples remains $p$. Thus pass@$k$ and mean@$k$ answer different questions even before accounting for sample dependence. A deployment system also needs a method to identify the successful answer; an oracle pass metric does not price that selection. Token budget, verifier work and latency belong in comparisons involving test-time scaling. [R21.11; R21.12]

### Observational scaling predicts across heterogeneous model families

[PAPER-REPORTED] Ruan et al. use benchmark performance across about 100 models to estimate a low-dimensional capability representation, with three principal components explaining most observed benchmark variation. They relate capability to compute within model families and fit downstream response maps using that representation. Their method can use stronger predictors than parameter count alone while remaining observational. [R21.14, sections 3–4]

[DERIVED] A schematic task-response map is $\widehat y=h\,\sigma(\beta^\top S+a)$, where $S$ contains fitted capability coordinates, $h$ is a response ceiling and $\sigma$ is logistic. The exact outcome orientation and fitting objective must follow the source implementation; replacing its nonlinear least-squares fitting by an assumed logit regression would be a different procedure. The representation can absorb differences in data and training recipe, which makes it useful for prediction but prevents a causal interpretation of “more FLOPs” without further controls.

[PAPER-REPORTED] Their evaluation holds out stronger models and also reports forecasts made before subsequently released models. Preprocessing and PCA are fitted on the training subset. The paper additionally uses task-specific equivalent compute relative to a reference family; that quantity summarizes a fitted capability relation rather than measuring the actual training work of another model. [R21.14, sections 4–5/Appendices]

[DERIVED] Benchmark preprocessing is part of the model. Imputation, centering, scaling and component-selection parameters must be fitted without target-model results. Once frozen, the transform may use the target model's permitted predictor benchmarks; those covariates are distinct from the withheld task outcome. A benchmark to be predicted cannot quietly enter the predictor vector for the same target question. If the target model family lies outside the training representation's support, low-dimensional compression can miss a specialized improvement or weakness. High explained variance on the observed matrix does not certify coverage of unmeasured capabilities.

### Aggregate predictability does not guarantee slice predictability

[PAPER-REPORTED] Ganguli et al. examine the coexistence of predictable aggregate trends and difficult-to-predict impacts of large language models. Their analysis motivates evaluating narrower behaviors rather than assuming that smooth average loss bounds every downstream outcome. [R21.15, sections 2–4]

[MATHEMATICALLY-DERIVED] Under fixed evaluation mixture weights, $L_{\mathrm{mix}}=\sum_iw_iL_i$. A rare slice with small $w_i$ can change substantially while moving the mixture little. Conversely, reducing loss on common easy material can improve the aggregate without improving a sparse difficult capability. This identity is sufficient to show why an aggregate law alone cannot determine every slice; it does not establish that any specific unmeasured harmful or beneficial behavior has changed.

```figure
id: fig-21.12
kind: calculator
title: Zero successes and finite benchmark resolution
caption: >-
  Equation 21.23 generalizes 0.05 to a supplied tail probability. It assumes
  independent identically distributed Bernoulli items and zero successes.
  This analytical bound is not evidence of a named model's capability.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-21.23
alt: >-
  With zero successes on 1000 independent items, the one-sided 95 percent
  upper success-probability bound is approximately 0.299 percent.
spec:
  tex: p_{\mathrm{upper}}=1-\alpha^{1/M}
  equation: "21.23"
  inputs:
    - {symbol: items, label: independent item count, default: 1000, min: 1, max: 1000000, step: 1, format: integer}
    - {symbol: tail, label: one-sided tail probability, default: 0.05, min: 0.001, max: 0.5}
  outputs:
    - {symbol: upper, label: upper success probability in percent, formula: 100*(1-tail^(1/items)), emphasis: true}
    - {symbol: resolution, label: one-item score resolution in percent, formula: 100/items}
```

```figure
id: fig-21.13
kind: chart
title: Evaluation resolution improves with independent item count
caption: >-
  Analytical curves from Equation 21.23 compare zero-success one-sided upper
  bounds with the one-item resolution of an unweighted score. Both axes are
  logarithmic. These are mathematical quantities under iid Bernoulli sampling,
  not observed model results; correlated items do not inherit these bounds.
placement: wide
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-21.23
alt: >-
  Three descending curves show the 99 percent upper bound above the 95 percent
  upper bound, both above one-item score resolution. At 1024 independent items,
  zero successes gives a 95 percent upper bound near 0.292 percent, while one
  item changes the score by about 0.098 percentage points.
spec:
  type: line
  x: {label: independent item count M, scale: log2, format: integer, domain: [16, 65536]}
  y: {label: success probability or score resolution (%), scale: log10, domain: [0.001, 50]}
  series:
    - {id: upper99, label: 99% upper bound after zero successes, formula: "100*(1-0.01^(1/x))", sample: {from: 16, to: 65536, count: 13}}
    - {id: upper95, label: 95% upper bound after zero successes, formula: "100*(1-0.05^(1/x))", sample: {from: 16, to: 65536, count: 13}, emphasis: true}
    - {id: resolution, label: one-item score resolution, formula: "100/x", sample: {from: 16, to: 65536, count: 13}, dashed: true}
  annotations:
    - {x: 1024, label: "1024 items: 95% upper bound ≈ 0.292%"}
```

## Algorithm

**Algorithm 21.6 — Freeze a capability forecast.** [DERIVED] Input: training model features/outcomes $(X_{\mathcal T},y_{\mathcal T})$, permitted target predictor features $X_{\mathcal V}$, a fixed scoring contract $\chi$, finite representation rank $d$, and bounded fit routines. Output: forecasts and target assessment. Target predictors may be measured before forecasting; the target outcome being predicted is excluded from those features.

$$
\begin{aligned}
1.\quad &\omega\gets\operatorname{fit\_preprocess}(X_{\mathcal T}),\qquad
 \widetilde X_{\mathcal T}\gets T_\omega(X_{\mathcal T}).\\
2.\quad &W_d\gets\operatorname{PCA}_d(\widetilde X_{\mathcal T}),\qquad
 S_{\mathcal T}\gets\widetilde X_{\mathcal T}W_d.\\
3.\quad &\widehat\beta\gets\operatorname{fit}_J(h_\beta(S_{\mathcal T}),y_{\mathcal T};\chi).\\
4.\quad &S_{\mathcal V}\gets T_\omega(X_{\mathcal V})W_d,\qquad
 \widehat y_v\gets h_{\widehat\beta}(S_v).\\
5.\quad &\mathcal P\gets\operatorname{freeze}
 (\omega,W_d,\widehat\beta,\chi,\{\widehat y_v,I_v\}_{v\in\mathcal V}).\\
6.\quad &e_v\gets y_v-\widehat y_v,\qquad
 c_v\gets\mathbf1\{y_v\in I_v\},\qquad v\in\operatorname{reveal}(\mathcal V).\\
7.\quad &\operatorname{return}(\mathcal P,\{e_v,c_v,\mathrm{slice\ diagnostics}_v\}).
\end{aligned}
$$
*(Eq. 21.29)*

[DERIVED] $T_\omega$ includes the training-fitted missing-value and centering policy; $I_v$ is an interval constructed under a declared item/model uncertainty procedure. A missing required predictor, out-of-support feature or failed fit yields a flagged/unresolved forecast, not an imputed task success. The response map may be logistic or another preregistered family; the procedure does not assert a causal compute law. The invariant is training-only fitting of every transformation and response coefficient. Finite fit/iteration budgets and a finite target set ensure termination. Dense representation costs follow the PCA/SVD bound below; freezing stores $O(Kd)$ loadings for $K$ features and $O(|\mathcal V|)$ scalar forecasts/intervals. Evaluation generation, extraction and scoring retain their own compute boundaries.

## Implementation

[DERIVED] Evaluation needs the declared inference/runtime and scoring layer, but no specific Inference / serving engine is necessary for the mathematical forecast. The observational source documents LM Eval Harness and source leaderboard protocols; these are source evaluation tools outside the enumerated §4 training/inference systems, routed through the plan's capability-prediction topic. Their runtime behavior was not inspected or executed here. [R21.14], Appendix B.2.

[DERIVED] Store the model revision, prompt template, task data revision, contamination checks, decoding parameters, answer extractor and score implementation. For stochastic decoding, retain sample counts and random-state policy. Item-level results permit bootstrap or hierarchical uncertainty at the appropriate task/template level. A single rounded percentage prevents examination of dependence, threshold artifacts and slice regressions. Public score tables are discovery inputs until their evaluation contracts are reconciled.

[DERIVED] With $R$ models and $K$ benchmark features, dense PCA or SVD has cost governed by $\min(RK^2,R^2K)$ under standard dense algorithms; a fixed-rank approach can reduce work but must preserve the chosen fit contract. Most practical cost lies in generating reliable task measurements. Adding test-time samples increases evaluation and selection work even when the model weights are unchanged. Hardware and serving assumptions must accompany any comparison framed in wall time or currency.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Schaeffer et al.'s experiments show that particular apparent discontinuities can become smoother under alternative metrics and that metric choices can induce apparent emergence. Ruan et al. separately demonstrate stronger-model and future-release prediction using a low-dimensional benchmark representation. These findings concern different objects: measurement-induced curve shape and statistical cross-model prediction. Neither proves that all capabilities are indefinitely extrapolatable. [R21.13, sections 3–4; R21.14, sections 4–5]

[PAPER-REPORTED] Negative extrapolation evidence also appears in the preceding allocation studies. Inference-aware scaling finds that short-training fits can overstate gains at extreme token/parameter ratios; retrospective law estimation reports large errors in selected model-family extrapolations. [R21.3, section 5; R21.17, sections 4–6]

[DERIVED] Capability forecasts that use predicted loss inherit upstream loss-prediction error and add response-map uncertainty. Predictors based directly on measured benchmark coordinates have a different upstream uncertainty boundary; they do not inherently depend on a loss-scaling fit.

## Observations

### Observation 21.6 - Predictable loss is insufficient for a task forecast

**What the paper claims.** [PAPER-REPORTED] Metric nonlinearity can explain particular emergence patterns, and benchmark-derived capability coordinates can improve cross-model forecasts. [R21.13; R21.14]

**What the evidence shows.** [PAPER-REPORTED] These results depend on tested metrics, model collections, preprocessing and held-out targets. Separate studies document limits and failed extrapolations. [R21.13–R21.17; R21.3]

**What we infer.** [DERIVED] A capability forecast needs an independently validated response map and adequate benchmark resolution. Neither a smooth loss law nor an observed score jump alone supplies that evidence.

**What remains unknown.** [UNVERIFIED] This manuscript has not forecast an unseen production model, measured a new emergent mechanism or established that the inspected historical predictors cover all later reasoning and agent capabilities.

## Failure modes

[DERIVED] Benchmark saturation can make a stable improvement appear absent; exact-match thresholds can make a gradual improvement appear abrupt. Contaminated items can create apparent capability unsupported on fresh tasks. Using target evaluations in PCA or imputation leaks the outcome into the predictor. Estimating actual training compute from an equivalent-compute capability score confuses observation with cause. Combining pass@$k$, mean@$k$ and verifier-selected accuracy conflates distinct success events.

[DERIVED] Confidence intervals based only on item resampling omit model-training randomness and response-map error. Forecasting beyond the observed family can fail because of data specialization, instruction tuning, tools, context or inference strategies. Reporting only successful forecasts conceals selection. A defensible report retains the failed target, its preregistered prediction, the observed error and any subsequent change to the model as a new version rather than revising the original forecast retroactively.

## Siblings

[DERIVED] Loss-derived prediction composes an upstream scaling law with a task response; observational prediction uses permitted measured benchmark covariates; causal scaling estimates the effect of a controlled intervention. Exact match, graded score, mean success and oracle pass rate measure different events. Compare forecasts on independently withheld outcomes under one decoding/scoring contract; compare inference strategies on selected-answer quality with their full generation/verifier costs.

## Extensions

### Improvements

[DERIVED] The improvement lineage moves from single size-to-score curves to explicit scoring contracts, paired continuous and thresholded measurements, low-dimensional cross-model predictors, independent stronger-model tests and forecasts frozen before new releases. More informative measurement does not eliminate scientific uncertainty; it exposes which uncertainty belongs to training, prediction or task scoring.

[DERIVED] The chapter's final artifact therefore contains both a conditional loss model and a separate capability validation record if capability is the decision objective. The unexecuted protocol in [verification](verification.md) requires frozen target predictions, fit-family sensitivity and uncertainty coverage. No unseen-model result is claimed until that evidence exists.

## Limitations

[MATHEMATICALLY-DERIVED] A threshold explanation establishes that an apparent transition can arise without a discontinuous latent score; it does not establish that every observed transition has that cause. Three principal components can explain observed benchmark covariance while omitting a specialized unmeasured behavior. Finite iid bounds require their sampling conditions. A prediction beyond support remains conditional even when its numerical interval is narrow.

## Reproducibility

[DERIVED] Preserve item-level outcomes, prompts, answer extraction, valid-answer criteria, model/data/runtime revisions, target predictors, training-only transformations, held-out family identities, frozen forecasts and failures. Record model-training and evaluation randomness separately. The source analyses remain PAPER-REPORTED; this draft has not run capability evaluation, fitted the representation or tested a future release forecast.

## References

[R21.13](references.md#r21-13), §§2–4; [R21.14](references.md#r21-14), §§3–5 and Appendix B; [R21.15](references.md#r21-15), §2; [R21.16](references.md#r21-16), §2; [R21.3](references.md#r21-3), §5; [R21.17](references.md#r21-17), extrapolation results; [verification](verification.md).
