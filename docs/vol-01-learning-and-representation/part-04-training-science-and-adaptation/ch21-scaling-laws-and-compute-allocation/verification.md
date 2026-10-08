---
id: ms.verification.21
entity_type: verification
title: Chapter 21 verification
short_title: Chapter 21 verification
volume: 1
part: 4
chapter: 21
section: null
slug: verification
parent: ms.chapter.21
prev_sibling: ms.section.21.6
next_sibling: ms.references.21
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

# Chapter 21 verification

[UNVERIFIED] This chapter is a source-grounded manuscript draft. No scaling fit, model training, archived-run reconstruction, confidence-interval coverage test or serving benchmark has been executed. The following experiments are original book verification proposals. Their hypotheses, design choices and expected outcomes are not claims attributed to the source papers.

## 1. Artifact and evidence boundary

[DERIVED] The target artifact is a fitted conditional scaling model with full-precision coefficients, uncertainty and independent validation. It must include the immutable observation table; parameter, token and FLOP conventions; evaluation revision; run lineage; train/validation split; fit objective and constraints; optimization diagnostics; frozen target predictions; confidence and prediction intervals; fit-family sensitivity; and allocation decisions with uncertainty. A chapter diagram or a copied coefficient vector does not constitute that artifact.

[DERIVED] Published experiment summaries remain PAPER-REPORTED. Algebraic consequences of declared forms are MATHEMATICALLY-DERIVED. In particular, Kaplan's finite-dataset coordinate is $U$, Chinchilla's processed-token coordinate is $D$, and the original Chinchilla observations include a smoothed-training-loss proxy. Reconstructed observations must retain those identities. No absent source field is filled with a presumed learning rate, seed, hardware configuration or validation split.

## 2. Proposed experiments

### Experiment 21.1 - Fit-family sensitivity and held-out scaling prediction

- **Hypothesis.** [ASSUMED] Several fit procedures can explain observed pilot losses while disagreeing on a larger target and its compute-optimal allocation.
- **Setup.** Use a documented public run archive with comparable evaluation/tokenization or train a controlled dense family. Reserve whole largest-size run lineages and selected long-duration endpoints before fitting. Compare an additive offset law under raw-square and log-Huber objectives with a declared interaction alternative. Freeze all preprocessing and predictions before revealing targets.
- **Independent variables.** Model size, training-token presentations, fit family, residual scale, robust threshold, inclusion of intermediate checkpoints and extrapolation distance.
- **Controlled variables.** Architecture scaling rule, tokenizer, corpus revision, unique-data policy, held-out score, precision, optimizer calibration, endpoint schedule and count convention within each comparison group.
- **Dataset/workload.** A single autoregressive text workload with sequence and prediction-mask contracts. Archived sources must identify actual held-out losses versus training-loss proxies; analyze these separately rather than label them equivalent observations.
- **Hardware.** For archive reconstruction, retain source hardware as metadata and make no new throughput claim. For new runs, record accelerator, interconnect, software revision, arithmetic and timing boundary. Device selection remains unexecuted.
- **Metrics.** Absolute and relative held-out loss error, interval coverage, width, residual structure, coefficient/profile sensitivity, iso-compute allocation uncertainty, fit failures and decision regret. Show confidence and new-run prediction bands separately.
- **Baselines.** Best observed comparable pilot, an additive-law fit under the original declared objective, and a no-extrapolation prediction. Compare meaningful decision error rather than objectives measured on different scales.
- **Expected result.** [ASSUMED] Independent targets discriminate between apparently similar fits; a finding of similar predictions is also retained. Report all targets and intervals, including failures and boundary optima, without selecting a fit retrospectively on them.
- **Ablation.** Raw versus log residuals; floor fixed versus estimated; multiple starts versus one; checkpoint-row versus run-group resampling; endpoint-only versus trajectory fit; head-inclusive versus incomplete work accounting.
- **Interpretation.** The result establishes prediction quality only for the tested family and support. A good loss fit need not locate the optimum precisely; a good optimum prediction does not establish hardware or lifecycle optimality.
- **Threats to validity.** Target leakage, sparse seed replication, unrecorded recipe changes, digitization error, correlated checkpoints, incomparable losses, absent failures, unbracketed minima and excessive extrapolation.

### Experiment 21.2 - Quality-matched lifecycle and demand sensitivity

- **Hypothesis.** [ASSUMED] The preferred model/data allocation changes with expected serving demand, and a constant serving-FLOP approximation can disagree with measured currency or latency rankings.
- **Setup.** Select at least two independently quality-validated checkpoints with different size/training-duration trade-offs. Measure one-time training cost and serving costs on a fixed workload. Compute break-even boundaries over predefined demand scenarios; include uncertainty in both quality and cost.
- **Independent variables.** Model size, training horizon, demand, input/output lengths, concurrency, batching and cost boundary.
- **Controlled variables.** Task quality requirement, evaluation revision, serving stack, hardware allocation, precision, context support and latency service-level constraint for a given comparison.
- **Dataset/workload.** Frozen prompts with recorded length distribution and generated-output policy. Record successful task completions, retries and generated lengths so a cheaper token is not mistaken for a cheaper completed task.
- **Hardware.** A single declared deployment system per comparison, with training devices separately identified. Record peak arithmetic basis, measured utilization, memory, cache precision, interconnect, price date and inclusive timing.
- **Metrics.** Training currency/device-hours, prefill and generation cost, task success, latency percentiles, memory, queueing, break-even demand, lifecycle cost and scenario regret. Energy is reported only if measured or explicitly modeled with audited inputs.
- **Baselines.** Training-only allocation, simplified constant-utilization lifecycle allocation and measured workload-specific lifecycle allocation at the same independently established quality.
- **Expected result.** [ASSUMED] Some workload/demand settings favor longer-trained smaller models while others do not. A missing finite break-even, infeasible latency or failed quality target remains an outcome.
- **Ablation.** Include versus exclude pilot/search work; use input/output-specific versus common cost coefficients; vary release lifetime and retirement demand; compare per-token and per-successful-task accounting.
- **Interpretation.** The result supports a scenario-specific allocation, not a universal overtraining ratio. Endogenous demand and changing serving behavior require a revised objective rather than an unchanged threshold formula.
- **Threats to validity.** Uncertain lifetime, model-dependent answer length, unpriced idle reservation, inconsistent quality, cache effects, vendor-price changes, saturation of serving capacity and omitted failed requests.

### Experiment 21.3 - Identify repeated-data and transfer effects

- **Hypothesis.** [ASSUMED] A model using token presentations alone can mispredict a regime where uniqueness or cross-domain transfer changes.
- **Setup.** Construct a controlled two-domain or two-language corpus with known subset provenance. Vary unique data, presentations and mixture shares independently at multiple model sizes. Reserve one combination of repetition and mixture, then compare a presentation-only law with a saturating effective-data law and a transfer-aware alternative.
- **Independent variables.** Unique available tokens, repetitions, domain/language shares, model size and transfer-model family.
- **Controlled variables.** Extraction, deduplication rule, tokenizer, context, objective, optimizer calibration, endpoint schedule and fixed per-domain evaluation sets. Do not change the quality filter concurrently with the mixture intervention.
- **Dataset/workload.** Explicitly versioned corpora whose overlap and evaluation contamination are measured. Corpus units must share the same tokenizer and counting boundary; no source language-family grouping is assumed to eliminate all transfer.
- **Hardware.** Common declared training hardware and precision, with router/communication terms additionally required if the experiment is extended to sparse models. Such an extension is a separate factorial arm rather than an implicit change.
- **Metrics.** Per-domain and aggregate loss, unique/presented tokens, marginal repetition benefit, transfer effects, held-out prediction error, interval coverage, compute, time and memory.
- **Baselines.** Additive dense law conditioned on the same recipe, a repetition-only effective-data model, and a transfer-aware model with coefficients estimated only from training combinations.
- **Expected result.** [ASSUMED] Added coordinates improve prediction only if supported by independent targets. Monotone saturation may fail when overfitting produces rising loss; report that failure rather than extrapolate the fitted curve indefinitely.
- **Ablation.** Verbatim repetitions versus new unique material; fixed versus changed domain share; transfer omitted versus estimated; free versus shared repetition coefficients. Keep total work accounting consistent.
- **Interpretation.** An identified effect belongs to the tested corpus, overlap and mixture. Sparse activation, context extension, teacher supervision and RL cannot be added to the same law without corresponding controlled measurements.
- **Threats to validity.** Unknown overlap, noisy unique-token estimates, contamination, inadvertent domain changes, too few independent combinations, unsupported saturation and transfer coefficients absorbing optimizer failure.

### Experiment 21.4 - Capability forecast, metric resolution and leakage

- **Hypothesis.** [ASSUMED] Thresholding and finite benchmark resolution can change the apparent shape of capability growth, while observational predictors can generalize differently from loss-derived predictors.
- **Setup.** Reserve stronger model families or subsequently released models. Fit preprocessing and a capability representation on training models only. Freeze permitted target covariates, downstream response maps, forecast intervals and scoring rules before evaluating target task outcomes.
- **Independent variables.** Predictor family, model strength/family, exact versus graded metric, benchmark size, decoding budget and answer-selection method.
- **Controlled variables.** Prompts, task revision, answer extractor, valid-answer definition, sampling temperature, context and contamination policy. A frozen transform may consume allowed target predictor benchmarks, but not the withheld target outcome.
- **Dataset/workload.** Item-level evaluation with template/domain identifiers, continuous scores where meaningful, exact-match outcomes and fresh held-out task slices. Include EOS if forecasting exact terminated reference probability.
- **Hardware.** Record evaluation and verifier devices, serving revision and timing. No strategy is called compute-optimal unless difficulty estimation, generation, verification and selection work share the declared budget boundary.
- **Metrics.** Predictive error, interval coverage, calibration, benchmark resolution, ceiling/floor behavior, per-slice results, mean@$k$, pass@$k$ and actual selected-answer success as separate measurements.
- **Baselines.** Direct size/compute forecast, loss-derived response map, benchmark-representation predictor and a constant or last-observed-score baseline. Equivalent reference-family compute remains a fitted surrogate.
- **Expected result.** [ASSUMED] Some apparent jumps change with metric or test resolution; some remain. Retain failed forecasts and specialized target models even when they violate the fitted low-dimensional representation.
- **Ablation.** Threshold versus graded score; full versus reduced benchmark size; permitted predictors versus deliberately excluded overlapping task features; iid versus clustered item uncertainty; fixed inference work versus fixed sample count.
- **Interpretation.** The experiment distinguishes measurement effects and predictive validity. It cannot infer a new internal mechanism solely from a score jump, or claim every jump is an artifact solely from one smoothed metric.
- **Threats to validity.** Outcome leakage, benchmark contamination, correlated tasks, saturation, release-selection bias, verifier exploitation, mismatched decoding and retrospective predictor tuning.

## 3. Required-topic audit

| Required topic | Manuscript anchor and technical development | Primary basis | Remaining boundary |
|---|---|---|---|
| 21.1 Loss versus parameters | [Formulation](21-1-empirical-scaling.md#formulation): NLL/KL identity, count convention, finite-model terms and log slopes. | P08, P09 | No new fitted exponent. |
| 21.1 Loss versus tokens | [Formulation](21-1-empirical-scaling.md#formulation): finite dataset $U$ versus processed presentations $D$. | P08, P09 | Unique-data estimates depend on provenance and deduplication. |
| 21.1 Loss versus compute | [Methodology](21-1-empirical-scaling.md#mechanism): surface versus constrained frontier, dense approximation and omitted operations. | P08, P09, R21.1 | No common hardware benchmark. |
| 21.1 Irreducible loss | [What an irreducible term means](21-1-empirical-scaling.md#what-an-irreducible-term-means): entropy bound, fitted offset and identifiability. | P08, P09 | Fitted floor is not established natural-language entropy. |
| 21.1 Fitting assumptions/domain | [Failure modes](21-1-empirical-scaling.md#failure-modes): mixture dependence, tokenizer, context and recipe. | P08, P09, R21.17 | No cross-domain universal law. |
| 21.2 Iso-compute curves | [The three original Chinchilla estimators](21-2-compute-optimal-design.md#the-three-original-chinchilla-estimators): envelope, endpoint minima and robust joint fit. | P09 | Original training-loss proxy assumption retained. |
| 21.2 Optimal allocation | [Formulation](21-2-compute-optimal-design.md#formulation): marginal condition, constants, exponents, feasible boundaries and ratio. | P09 | Continuous optimum must be mapped to feasible configurations. |
| 21.2 Model/data scaling | [Allocation uncertainty differs from loss uncertainty](21-2-compute-optimal-design.md#allocation-uncertainty-differs-from-loss-uncertainty): curvature and uncertainty. | P09, R21.2 | Allocation interval not empirically estimated here. |
| 21.2 Recipe sensitivity | [Controlled reconstruction of the allocation disagreement](21-2-compute-optimal-design.md#controlled-reconstruction-of-the-allocation-disagreement): head, warmup, tuning and disclosure. | R21.1, R21.2 | Ablation findings remain source-specific. |
| 21.3 Longer training/smaller models | [Formulation](21-3-inference-aware-training.md#formulation): fixed-quality feasible curve, capacity boundary and elasticity. | R21.3 | Extreme training requires validation outside short-run fits. |
| 21.3 Lifecycle demand | [Break-even is a workload calculation](21-3-inference-aware-training.md#break-even-is-a-workload-calculation): expectation, risk, retirement and endogenous demand. | R21.3 | No actual service demand measured. |
| 21.3 Deployment cost | [Separate input processing and output generation](21-3-inference-aware-training.md#separate-input-processing-and-output-generation): currency units, utilization, cache and latency. | R21.3 | Serving cost remains analytical without deployment measurements. |
| 21.3 Break-even | [Break-even is a workload calculation](21-3-inference-aware-training.md#break-even-is-a-workload-calculation): pairwise threshold, dominance and mixed workload. | R21.3 plus explicit derivation | No universal threshold claimed. |
| 21.4 MoE | [Sparse routing separates stored capacity from activated work](21-4-beyond-dense-pretraining.md#sparse-routing-separates-stored-capacity-from-activated-work): routed interaction, granularity and router work. | R21.5, R21.6 | Fixed data/expansion restrict extrapolation. |
| 21.4 Data quality | [Data quality changes the response surface](21-4-beyond-dense-pretraining.md#data-quality-changes-the-response-surface): controlled curation, retained fraction and proxy transfer. | P07 | No universal quality-token multiplier. |
| 21.4 Data repetition | [Repeated presentations are not additional unique data](21-4-beyond-dense-pretraining.md#repeated-presentations-are-not-additional-unique-data): saturation, derivatives and overfitting limit. | R21.4 | Saturating monotone law cannot model arbitrary worsening. |
| 21.4 Multilinguality | [Multilingual allocation needs transfer and repetition coordinates](21-4-beyond-dense-pretraining.md#multilingual-allocation-needs-transfer-and-repetition-coordinates): mixture optimum and 2026 transfer extension. | R21.7, R21.8 | Transfer statistics and fitted coefficients kept distinct. |
| 21.4 Context length | [Context length changes both information and work](21-4-beyond-dense-pretraining.md#context-length-changes-both-information-and-work): context fit, continuation protocol and confounding. | R21.9 | No context-only attribution from compound continuation. |
| 21.4 Distillation | [Distillation adds teacher quality and teacher cost](21-4-beyond-dense-pretraining.md#distillation-adds-teacher-quality-and-teacher-cost): fitted law, capacity gap and teacher amortization. | R21.10 | Positive fitted correction is not an exact empirical identity. |
| 21.4 RL | [RL compute and inference compute are different budgets](21-4-beyond-dense-pretraining.md#rl-compute-and-inference-compute-are-different-budgets): sigmoid, recipe, rollout and metric boundary. | R21.11 | GPU-hours not hardware-independent FLOPs. |
| 21.4 Inference-time scaling | [RL compute and inference compute are different budgets](21-4-beyond-dense-pretraining.md#rl-compute-and-inference-compute-are-different-budgets): query-conditional strategies, difficulty and verifier cost. | R21.12 | Main source budget excludes difficulty estimation. |
| 21.5 Proxy models | [Select a proxy family that preserves the intervention](21-5-pilot-methodology.md#select-a-proxy-family-that-preserves-the-intervention): family specification and budget trade-offs. | P07, R21.17 | No arbitrary proxy-transfer guarantee. |
| 21.5 Extrapolation range | [Failure modes](21-5-pilot-methodology.md#failure-modes): vector distance, joint support and endpoint mismatch. | R21.3, R21.17 | New-target support not independently tested. |
| 21.5 Fit uncertainty | [Uncertainty must follow the whole decision pipeline](21-5-pilot-methodology.md#uncertainty-must-follow-the-whole-decision-pipeline): grouped bootstrap, mean versus prediction bands and discrepancy. | R21.1, R21.2, R21.17 | No executed coverage test. |
| 21.5 Confounding | [Formulation](21-5-pilot-methodology.md#formulation) and [Endpoints and intermediate checkpoints carry different information](21-5-pilot-methodology.md#endpoints-and-intermediate-checkpoints-carry-different-information): discrepancy, dependence and schedule. | R21.1, R21.17 | Retrospective collections are not randomized training programs. |
| 21.5 Independent validation | [Algorithm](21-5-pilot-methodology.md#algorithm): whole-lineage splits, frozen predictions and target reveal. | R21.14, R21.17 | Proposed artifact unexecuted. |
| 21.6 Continuous/threshold metrics | [Formulation](21-6-capability-prediction.md#formulation): sequence likelihood, rank counterexample and threshold map. | R21.13 plus explicit derivations | No identity between corpus loss and arbitrary task success. |
| 21.6 Apparent emergence | [Apparent emergence is a measurement question](21-6-capability-prediction.md#apparent-emergence-is-a-measurement-question): historical definition and alternative metrics. | R21.13, R21.16 | Does not claim all transitions are artifacts. |
| 21.6 Benchmark saturation | [Finite benchmarks impose detection and saturation limits](21-6-capability-prediction.md#finite-benchmarks-impose-detection-and-saturation-limits): zero-success bound, resolution and pass/mean distinction. | R21.13 plus explicit derivations | iid bound requires independent item model. |
| 21.6 Failed extrapolation | [Reported experiments](21-6-capability-prediction.md#experimental-design): source failures and separate upstream predictor boundaries. | R21.3, R21.14, R21.17 | No unseen-model forecast executed here. |

## 4. Mathematical procedures and visual audit

[DERIVED] Six mathematical procedures replace the earlier prose-code listings. Equations 21.24–21.29 specify finite record construction, constrained allocation, lifecycle comparison, transfer/repetition evaluation, bounded fitting and frozen capability forecasting. Their inputs, state, output contracts, invariants, termination and failure branches are developed in the owning sections. The bounded fitting procedure is a book-defined numerical reconstruction rather than a claim about a source implementation. Nonfinite starts are excluded from its final selection, failures remain in the audit, and deterministic tie ordering is part of the configuration.

| Section | Authored visual | Analytical inputs and evidential boundary |
|---|---|---|
| 21.1 | Figures 21.1–21.2: measurement dependency and floor/slope calculator. | Equation 21.4; floor 2, excess 1, exponent 0.3 are explicitly analytical. |
| 21.2 | Figures 21.3–21.4: estimator routes and iso-compute penalty. | Equation 21.8; positive exponents and optimum stationarity normalize excess loss. |
| 21.3 | Figures 21.5–21.6: lifecycle dependencies and break-even. | Equation 21.13; extra cost and per-request savings are analytical currency inputs, not prices. |
| 21.4 | Figures 21.7–21.8: added coordinates and repetition saturation. | Equation 21.14; chosen corpus units, epochs and repetition scale are not fitted coefficients. |
| 21.5 | Figures 21.9–21.10: protected targets and exponent sensitivity. | Equation 21.30; shared reference allocation isolates exponent variation without claiming a confidence interval. |
| 21.6 | Figures 21.11–21.12: response/scoring map and finite zero-success bound. | Equation 21.23; iid Bernoulli conditions are required; no named-model capability is inferred. |

[UNVERIFIED] Figure parsing and manuscript-link checks test authored metadata and navigation. They do not establish browser accessibility, a measured scaling fit or source replication. Rendering checks are performed separately by the UI workflow. The chapter makes no executed experiment or world-best presentation claim.

## 5. Review status

[DERIVED] The authoring audit checks the allocation, curvature, fixed-quality elasticity, currency units, break-even, repetition, multilingual mixture, capability probability and uncertainty derivations against their stated premises. Kaplan's finite available-data coordinate is kept distinct from presentations; Chinchilla's smoothed-training-loss proxy is explicit. Canonical section ownership, source locators, algorithm failure branches and target-covariate versus outcome leakage are also recorded. These checks do not substitute for independent scientific review or empirical validation.

[UNVERIFIED] Independent source-code reproduction, experimental artifact generation and empirical confidence coverage remain outstanding. The chapter retains `manuscript_draft`; a clean content compiler result establishes structural validity rather than scientific replication. Coverage is audited against all six manifest topics and their listed aspects, without claiming that the unexecuted research program is complete.
