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
updated_at: '2026-10-08'
editorial_status: manuscript_draft
---

# 21.6 Capability prediction

[DERIVED] Predicting next-token loss and predicting task success require different models. A smooth improvement in average cross-entropy does not fix answer extraction, sampling, reasoning strategy, task composition, scoring thresholds or finite-test resolution. A capability forecast must therefore reconstruct the measurement map between a model's behavior and the reported score, then validate that map on unseen models or tasks.

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

## Methodology

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

## Algorithm

```text
Algorithm 21.6 — Validate a capability forecast and its measurement map
INPUT: model/predictor table; task scoring contract; independent target models
OUTPUT: frozen forecasts, calibrated uncertainty and observed extrapolation errors
STATE: training-only preprocessing; task and model splits; decoding and scoring revisions
INVARIANT: target outcomes never enter representation fitting or predictor selection
1. Define the success event, valid answers, prompts, decoding, extraction and sampling budget.
2. Record continuous signals alongside thresholded metrics where the task permits them.
3. Split by model family and strength while retaining untouched target releases or runs.
4. Fit preprocessing, capability representation and response maps using training data only.
5. Estimate score resolution, item dependence and uncertainty near floor or ceiling.
6. Freeze predictions and compare them with subsequently revealed target outcomes.
7. Test metric changes, benchmark slices, saturation and out-of-support model families.
8. Report failed forecasts and distinguish observational prediction from causal scaling.
TERMINATION: each predefined target receives a prediction and independent assessment
COMPLEXITY: linear scoring in evaluated items; representation and fitting costs depend on rank
```

## Implementation

[DERIVED] Store the model revision, prompt template, task data revision, contamination checks, decoding parameters, answer extractor and score implementation. For stochastic decoding, retain sample counts and random-state policy. Item-level results permit bootstrap or hierarchical uncertainty at the appropriate task/template level. A single rounded percentage prevents examination of dependence, threshold artifacts and slice regressions. Public score tables are discovery inputs until their evaluation contracts are reconciled.

[DERIVED] With $R$ models and $K$ benchmark features, dense PCA or SVD has cost governed by $\min(RK^2,R^2K)$ under standard dense algorithms; a fixed-rank approach can reduce work but must preserve the chosen fit contract. Most practical cost lies in generating reliable task measurements. Adding test-time samples increases evaluation and selection work even when the model weights are unchanged. Hardware and serving assumptions must accompany any comparison framed in wall time or currency.

## Reported experiments

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

## Improvements and limits

[DERIVED] The improvement lineage moves from single size-to-score curves to explicit scoring contracts, paired continuous and thresholded measurements, low-dimensional cross-model predictors, independent stronger-model tests and forecasts frozen before new releases. More informative measurement does not eliminate scientific uncertainty; it exposes which uncertainty belongs to training, prediction or task scoring.

[DERIVED] The chapter's final artifact therefore contains both a conditional loss model and a separate capability validation record if capability is the decision objective. The unexecuted protocol in [verification](verification.md) requires frozen target predictions, fit-family sensitivity and uncertainty coverage. No unseen-model result is claimed until that evidence exists.

```figure
id: fig-21.6
kind: diagram
title: From a model predictor to measured task success
caption: Task forecasts depend on a response map, decoding and scoring. Finite benchmark resolution and independent validation constrain interpretation of apparent jumps or saturation.
placement: wide
evidence: DERIVED
source: [R21.13, R21.14, R21.15]
alt: Loss or capability predictors enter a task response map, followed by decoding and scoring, then a finite benchmark score. Independent targets validate the full chain.
spec:
  direction: LR
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
