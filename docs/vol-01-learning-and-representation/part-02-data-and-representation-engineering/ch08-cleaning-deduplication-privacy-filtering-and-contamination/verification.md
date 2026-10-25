---
id: ms.verification.8
entity_type: verification
title: "Verification — Chapter 8"
volume: 1
part: 2
chapter: 8
section: null
slug: verification
parent: ms.chapter.8
prev_sibling: ms.section.8.6
next_sibling: ms.references.8
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [data, evaluation], mechanism: [data_provenance, controlled_comparison], feedback_setting: [], modality: [text]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Verification — Chapter 08

[DERIVED] Experiments 8.7 and 8.8 complete the artifact and falsifiable task specified in the chapter overview. Both are unexecuted proposals. The section-level Experiments 8.1–8.6 remain the detailed mechanism studies. No corpus was filtered, private-data audit performed or language model trained for these protocols in this edition.

## 1. Artifact specification

| File | Required fields and invariants |
|---|---|
| `pipeline.yaml` | Ordered stage DAG; `stage_id, version, input_schema, output_schema, rule_or_classifier_id, threshold, unit, decision_policy, idempotent, depends_on`. Record normalization, tokenizer, feature-extractor and benchmark-manifest revisions. Classify each stage as a fixed predicate, transformation, representative-selection or population-dependent operation before assuming commutativity. |
| `ledger.parquet` | `record_id, source_id, stage_id, rule_id, rule_version, score, threshold, decision, reason_code, unit, span_start, span_end, cluster_id, kept_record_id, reviewer_sample_flag, timestamp`. Every offered record has an explicit terminal state; every removal or redaction references its stage version. Span units and offset encoding are mandatory. |
| `rates.json` | Target population, eligible units, sampling frame, inclusion probabilities, source/duplicate cluster definitions, independent labeling procedure, adjudication disagreements, point estimates, interval construction, independent-cluster counts, missingness and detector relation. Include residual duplicate, contamination and PII estimates as different estimands. |
| `ablation_manifest.json` | Frozen pools and hashes, ordered stage configuration, retained and consumed tokens, model/tokenizer/template, parameter and resource budget, paired seeds, optimizer/schedule, held-out benchmarks, evaluator versions, primary contrast, practical margins and multiplicity rule; results empty until executed. |

[DERIVED] An idempotent string transform may still change task semantics; a deterministic pipeline may still depend on input order or duplicate representatives. Retain content-before/content-after identities and a dependency-aware replay record. Sensitive raw content belongs in an access-controlled audit store, not a public release merely because it is needed for evaluation. Release aggregate evidence and authorized fixtures instead.

## 2. Formulation — define the quantities before sampling

[DERIVED] Duplicate rate must name the object counted: documents in any duplicate group, excess documents beyond one representative, duplicate token mass, or detector-positive pairs. These denominators are not interchangeable. Fix the matching relation, normalization, representation and threshold; approximate-neighbor search recall is a separate uncertainty source. A transitive connected component can group endpoints that are not directly similar. Cluster completeness is required for the chosen group statistic, not inferred from a few observed edges.

[DERIVED] Contamination is defined relative to a frozen benchmark manifest and declared relation: exact normalized bytes, n-gram overlap, paraphrase, translation, code clone or answer-bearing source. Absence under one detector is not cleanliness under every relation. PII audit labels must specify entity type and contextual sensitivity; a generic string match is neither a complete privacy definition nor proof of personal-data absence. Synthetic injected identifiers can test a detector, but cannot estimate natural prevalence without a sampling model linking them to the target population.

[DERIVED] For a probability sample, retain the design weights and estimate the declared population quantity rather than averaging unequal-probability strata indiscriminately. Resample the independent units supported by the sampling design; source-domain bootstrap intervals are only defensible with enough independent sampled domains and a domain-sampling estimand. If all domains are a fixed census and only records are sampled, use design-appropriate within-domain uncertainty instead. If there are too few independent clusters, publish the raw cluster results and acknowledge that a nominal bootstrap interval is unstable.

[DERIVED] Let a prespecified maximum tolerable residual rate be the decision threshold. A valid upper bound below it supports that bounded-rate claim under the sampling and labeling assumptions. A lower bound above it contradicts the claim. An interval crossing the threshold is inconclusive. Zero observed sensitive records does not prove zero prevalence; with independent Bernoulli sampling, even the zero-event upper bound remains positive at finite sample size. Cluster dependence and detector misses can widen or invalidate that simple bound.

## 3. Verification task — integrated studies

### Experiment 8.7 — design-based residual duplicate, contamination and sensitive-data audit

**Hypothesis.** [ASSUMED] Proposed and unexecuted. Relative to a frozen input population, the selected pipeline reduces each prespecified residual-rate estimand below its declared threshold without exceeding registered removal or subgroup-retention limits. Thresholds and tolerated errors must be set before labels are inspected.

**Setup.** Freeze pipeline/pool/benchmark identities. Draw a probability sample stratified by source, language, stage decision and rare-risk group; retain inclusion probabilities. Independently label both retained and removed records. For duplicate claims obtain the full relevant group neighborhood under a qualified search procedure. Adjudicate disagreements blind to pipeline scores where possible.

**Independent variables.** Pipeline version and stage thresholds; retained versus removed population; source/language and risk stratum. Audit-label uncertainty and detector-coverage checks are measured separately rather than treated as filter interventions.

**Controlled variables.** Input snapshot, labeling rubric, independent reference inventory, benchmark relation, audit-tool revisions, sampling design and decision thresholds. Keep final benchmark content out of classifier fitting and threshold tuning.

**Dataset/workload.** A declared licensed/provenanced corpus snapshot and frozen benchmark suite; deliberately enriched risk strata with known inclusion probabilities; synthetic exact/paraphrase/translation/code-clone/PII fixtures used only to qualify detectors. Natural prevalence estimates use the natural probability sample.

**Hardware.** Pin CPU/GPU, classifier/embedding versions, approximate-index/search settings, tool containers and annotation interface. Runtime performance and human audit cost are unmeasured in this protocol. Store sensitive examples with authorized access.

**Metrics.** Weighted residual rates and removal/retention rates by declared unit and subgroup; detector-specific injection recall and false positives; annotator disagreement; interval bounds, effective independent units, unknown labels, all audit and pipeline work. Keep document, pair and token denominators distinct.

**Baselines.** Unfiltered frozen input; exact-identity detector; existing pipeline; simple declared threshold variant. Positive and negative synthetic controls qualify each detector separately. Hand-adjudicated natural examples are the audit reference, with their own limitations.

**Expected result.** No residual rate is reported. Improved recall can increase removal and subgroup loss. Zero observed positives still permits a nonzero upper risk bound; failures to label or retrieve groups remain uncertainty rather than clean records.

**Ablation.** Remove normalization, duplicate selection, privacy or decontamination stages one at a time under a frozen order. Repeat the audit on a declared noncommuting-pair swap. Keep any full-pipeline re-tuning as a separate intervention.

**Interpretation.** Use upper-bound-below-threshold for positive bounded-rate acceptance, lower-bound-above-threshold for contradiction, otherwise inconclusive. For an unmeasured relation report unknown. Passing a bounded natural-sample audit does not certify absence of private information or all contamination.

**Threats to validity.** Incomplete search neighborhoods, missing source support, label bias, correlated duplicates, rare-event uncertainty, adaptive thresholds, detector-training overlap, unequal sampling weights, informative missing labels and benchmark leakage through human annotation.

### Experiment 8.8 — filter ablation at matched tokens and declared resources

**Hypothesis.** [ASSUMED] Proposed and unexecuted. A specific filter or order change improves the registered downstream aggregate by at least a practical margin at matched consumed tokens, while preserving prespecified subgroup and contamination bounds. This is a conditional recipe claim, not a claim that every filtered dataset improves every model.

**Setup.** Freeze input and construct complete pipeline, leave-one-stage-out and justified noncommuting-pair order variants. Train paired models with identical consumed tokens and declared parameter/optimizer schedules. Reserve an untouched final benchmark and audit each resulting corpus independently using Experiment 8.7.

**Independent variables.** Presence of a stage and order of a prespecified noncommuting pair. Separate fixed-threshold ablation from re-optimized threshold selection. Stage removal can change available data and repetition, which must be recorded as consequences of the intervention.

**Controlled variables.** Input snapshot, model family/size, tokenizer/template, consumed token count, sequence/packing policy, optimizer, learning-rate schedule, paired seeds and evaluator implementation. Report realized FLOPs and device time; equal tokens alone do not guarantee equal total work.

**Dataset/workload.** Frozen eligible source pools with enough surviving material for every arm, or a prespecified replenishment/repetition rule when not. Train/development/final partitions exclude known benchmark variants under declared relations. Include source/language and long-tail evaluation strata.

**Hardware.** Pin device model/count, precision, kernels, framework and topology. Account for filtering/classifier/index construction work separately from student training. Hardware and training execution are currently UNVERIFIED.

**Metrics.** Paired seed-level aggregate and per-task/subgroup effects; design-appropriate intervals with task/source dependence; consumed and unique tokens, repetition, removal/risk rates, FLOPs, device time and failures. Prespecify a family of primary contrasts and simultaneous inference or a held-out confirmation.

**Baselines.** Complete pipeline, unfiltered eligible input, leave-one-stage-out arms and one qualified order swap; random removal matched to retained count as a selection-size control. A frozen-predicate swap should preserve the set and serves as an implementation control.

**Expected result.** No model outcome is asserted. A filter can improve an aggregate while removing rare useful data; an order swap can change representatives and later scores. Equal exposure can conceal extra construction cost, so report both rather than calling every positive score difference efficiency.

**Ablation.** Distinguish filter presence, fixed versus refitted threshold, order, representative rule and replacement/repetition. Evaluate equal-token and equal-end-to-end-resource conventions as different analyses when both are feasible; do not select the more favorable convention after viewing scores.

**Interpretation.** A positive lower effect bound above the registered margin supports that recipe-specific benefit if all harm/risk constraints also pass. An interval including zero is insufficient evidence of benefit, not proof of harm or equality. A negative upper bound supports a negative effect under the declared protocol.

**Threats to validity.** Changed source mixture, classifier/evaluator correlation, contaminated final tasks, representative randomness, length/packing confounding, sparse seeds, failed runs omitted, many ablations, hidden resource differences and transfer beyond the tested model/data scale.

## 4. Acceptance criteria — replay and reporting

[DERIVED] Verify conservation of offered records across kept/removed/unknown states and reconstruction of each decision from its declared dependencies before evaluating model outcomes. Preserve a failed or inconclusive audit. Publish configuration hashes, aggregate ledgers, rates with denominators and uncertainty, and all paired training outcomes. This chapter provides the protocol and analytical reasoning; no empirical acceptance certificate has been issued.
