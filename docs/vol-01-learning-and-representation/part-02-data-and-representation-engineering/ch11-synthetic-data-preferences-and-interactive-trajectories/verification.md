---
id: ms.verification.11
entity_type: verification
title: "Verification — Chapter 11"
volume: 1
part: 2
chapter: 11
section: null
slug: verification
parent: ms.chapter.11
prev_sibling: ms.section.11.6
next_sibling: ms.references.11
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

# Verification — Chapter 11

[DERIVED] All three integrated studies below are proposals. No teacher generation, student training, interactive collection or human-labeling experiment was executed for this edition. Section-level Experiments 11.1–11.5 remain in their owning sections; 11.6–11.8 add end-to-end checks rather than relabel those earlier protocols as results.

## 1. Artifact specification

The artifact is a typed data and trajectory bundle with the following immutable objects. A schema is a design contract; an empty results field is not evidence of compliance.

| Object | Required content | Reject or mark unknown when |
|---|---|---|
| Generator manifest | Teacher/model revision, source and seed provenance, prompt/template hashes, sampler/engine versions, decoding parameters, offered budget and attempt cap, request identifiers and raw outputs | A mutable model alias is the only model identity; rejected offers or failed calls are absent |
| Typed target records | Record/source/lineage IDs; target type and label semantics from §11.2; prompt, response, comparison or trajectory fields; eligible loss spans and serialization revision | Human, model-judge and executable-verifier labels are merged without producer semantics; a loss mask cannot be reconstructed |
| Gate and audit ledger | Every offered candidate, check version/result, selected/rejected/unknown decision, rejection reason, duplicate group and retained representative; stratified manual audit with inclusion probabilities | Acceptance is reported only on successful parsing or only after deduplication; a judge decision is substituted for a correctness label |
| Collection manifest | Policy/interface/environment digests, task and reset identity, stepwise action/observation sequence, authorized tool schema, resource accounting, terminal reason and outcome-observation status | A timeout or lost acknowledgment is silently converted into an observed task failure or removed from the denominator |
| Construction and learning ledger | Offered/retained/unique counts; teacher, verifier, curation, student and evaluation work in separately stated units; reservations, failed calls and censored runs; all final candidate decisions | Cost starts after rejection; GPU-hours, peak memory and elapsed latency are added as if commensurate |
| Comparison report | Prespecified target population, paired configurations, train/development/final-test partitions, all seed/task outcomes, intervals, missingness bounds and decision margins | A development-selected result is presented as a fresh confirmatory estimate; a failed student run disappears |

[DERIVED] Hash raw and transformed content separately. Retain a privacy-preserving audit trail appropriate to the source permissions; a hash identifies an artifact, not its legal admissibility or semantic correctness. A directed lineage edge records how a target was produced. It cannot establish that the teacher lacked test information.

## 2. Experimental design — common execution and inference rules

[DERIVED] Freeze a configuration grid, cost convention and primary outcome before teacher calls or student runs. Keep final test tasks out of seed construction, generator prompts, judge calibration, data selection and development-grid ranking. Contamination checks specify their relation and detection limits; an absent exact match is not evidence of absence of semantic exposure. Use independently labeled final targets when the research question is correctness rather than agreement with a teacher.

[DERIVED] Pair student initializations, task partitions and training schedules where feasible. Treat source batches and student seeds as different uncertainty axes; do not manufacture independent observations by counting many targets from one prompt as independent runs. Publish paired effects and a prespecified interval procedure with its resampling unit. With too few independent clusters, report imprecision and raw paired results rather than presenting a narrow sample-level interval.

[DERIVED] Choose a positive practical improvement margin and any allowed degradation margins before evaluation. Evidence supporting a benefit requires the relevant lower bound to exceed that margin; failure to clear it is insufficient evidence, not proof of equivalence. A confidence interval crossing zero does not establish harm. If many policies or outcomes are tested, prespecify simultaneous inference or reserve an untouched confirmatory test for the selected policy. Source-reported paper gains are motivations, never expected numerical outcomes of these unexecuted studies.

## 3. Verification task — integrated studies

### Experiment 11.6 — target semantics and censoring in interactive collection

**Hypothesis.** [ASSUMED] Proposed and unexecuted. Under a frozen policy and task population, a complete terminal-state ledger will expose a difference between observed outcome success and deadline-service success whenever resource censoring is nonzero. The direction of bias from dropping censored episodes is not assumed.

**Setup.** Use an isolated replayable tool environment with finite tasks, deterministic reset identifiers and qualified outcome predicates. Collect a prespecified number of offered episodes per task under two resource caps. Preserve all events, including errors and lost acknowledgments. Assign unknown outcome when the final state cannot be established.

**Independent variables.** Collection budget and deadline; target-label conversion rule (typed observed/unknown versus naive timeout-as-failure versus complete-case deletion). A randomized cap intervention identifies a cap-specific policy outcome, not an uncapped counterfactual without assumptions.

**Controlled variables.** Policy/model, sampler, initial state distribution, tool versions and permissions, task assignment, evaluation predicates, logger and reset policy. Pair task instances and seeds; do not reuse a changed environment across arms.

**Dataset/workload.** A frozen inventory of public or purpose-built tool tasks with known expected state, plus fixtures for success, explicit failure, cap exhaustion and commit-with-lost-acknowledgment. Final tasks are excluded from generation and tuning. Data provenance and independent labeling remain required.

**Hardware.** Pin host/container, CPU/GPU, serving engine, concurrency, wall-clock source and resource meter before execution. Currently UNVERIFIED; hidden hosted hardware is NOT-DISCLOSED. Simulator work is not robot-safety evidence.

**Metrics.** Offered-episode denominator; outcome-observed fraction; confirmed success/failure/unknown counts; deadline-service success; censoring by cause/task; all calls, tokens and time. Bound outcome success by confirmed successes/offered through (confirmed successes + unknown)/offered without an identification model.

**Baselines.** Typed complete ledger, naive timeout-as-failure and complete-case summaries on exactly the same offered records; deterministic fixtures with known final states qualify conversion behavior.

**Expected result.** No measured result. Naive summaries may differ mechanically; their direction and magnitude depend on which episodes become unobserved. Tighter caps can reduce operational service success even when uncapped task competence is unchanged.

**Ablation.** Vary cap with the same task mix; remove lost acknowledgments; evaluate post-timeout state recovery separately from extra policy actions. Any inverse-probability estimator is a separate sensitivity analysis requiring measured selection variables, positivity and a defensible observation model.

**Interpretation.** Attribute differences first to the declared estimand and observation policy. Report partial-identification bounds when outcome observation is inadequate. Do not impute censored outcomes as counterfactual successes or infer unbiased competence from complete cases.

**Threats to validity.** Informative censoring, reset leakage, action retries with duplicate effects, hidden service drift, selected easy tasks, malformed reward predicates, correlated episodes and privacy-sensitive logs. Increasing episode count does not repair an invalid outcome definition.


### Experiment 11.7 — selection, verification and diversity at matched student exposure

**Hypothesis.** [ASSUMED] Proposed and unexecuted. Relative to unfiltered targets, verifier filtering or diversity control can improve a frozen student outcome at matched training exposure, but the gain is conditional on the offered pool and target task. Prespecify a positive improvement margin and allowable per-group regressions.

**Setup.** Generate one immutable offered pool. Independently audit a probability sample including rejects. Construct unfiltered A, verifier-filtered B and verifier-filtered plus diversity-controlled C. Fit identical student recipes with a declared token/repetition policy; separately analyze construction cost rather than hiding it in a matched-token comparison.

**Independent variables.** Selection predicate, verification source and diversity rule; selection threshold only on a prespecified development grid. Diversity uses an explicit representation, threshold and grouping procedure, not an undefined semantic uniqueness label.

**Controlled variables.** Offered pool, teacher, prompt/target semantics, tokenizer/template, student initialization and optimizer, training tokens and schedule, final evaluator and task split. Record any replenishment or changed repetition needed when a selected pool is small.

**Dataset/workload.** At least two task strata with executable or independently adjudicated targets and a held-out transfer stratum. Exclude final tasks and their known variants from seeds, teacher context and selection calibration. State residual contamination uncertainty.

**Hardware.** Freeze accelerator, precision, kernels, framework and distributed topology. Equal tokens need not mean equal FLOPs when lengths or packing differ; measure both. No hardware or training run has been executed for this protocol.

**Metrics.** Student primary effect and per-stratum effects; acceptance, audited precision/recall when identifiable, reject error rate, retained counts, duplicate/group occupancy, training exposure, all construction work and student work. Publish paired seed and source-batch uncertainty.

**Baselines.** Unfiltered targets A; random subsets of the same accepted size; B without diversity; a quality-score-matched diversity control where feasible. Independently adjudicated labels form an audit reference, not an unrestricted generator input.

**Expected result.** No result is asserted. Filtering can remove useful hard cases or inherit verifier blind spots; higher accepted precision does not logically imply better student learning. A small selected set may require more repetition and worsen transfer.

**Ablation.** Hold accepted count fixed versus hold training tokens fixed as different estimands. Remove individual gate stages, replace the teacher judge with an execution check on supported tasks, and compare duplicate-only removal with the declared diversity rule.

**Interpretation.** Support a selector claim only for the matched offered pool, objective and budget. A gain at fixed student exposure does not establish an end-to-end cost gain. A null result leaves the selected improvement claim unsupported; it does not prove selection universally unnecessary.

**Threats to validity.** Judge/teacher/evaluator dependence, unobserved false negatives, changed task mix, noisy reference labels, length and repetition confounding, source-level dependence, development reuse and selective reporting. No finite sample proves absence of rare failures.


### Experiment 11.8 — cost-matched student utility and finite policy selection

**Hypothesis.** [ASSUMED] Proposed and unexecuted. A construction policy is justified only if its cost-matched student effect clears a prespecified practical margin while satisfying declared resource and subgroup constraints. A policy with the best observed development score need not be best in expectation.

**Setup.** Freeze a finite grid of teacher/selection/grouping policies and a total-work convention. Reserve funds for all construction, student training and final evaluation. Run paired source batches and student seeds, recording every offered call, rejection and failure. Select only on development data, then test the single selected policy with the reserved final test.

**Independent variables.** Teacher and generation allocation; acceptance threshold; duplicate/grouping strategy; amount of human data; student exposure. Treat the policy as a joint intervention because isolated per-record scores do not determine group learning value.

**Controlled variables.** Final task population, base student family, tokenizer and target semantics, evaluation labels, resource-meter definitions, development/final split and paired randomization scheme. Fix the finite stopping and missing-result rules before execution.

**Dataset/workload.** Immutable source batches with a licensed/provenanced human baseline and synthetic candidates. Define independent batches and target strata before collection. Hold the final suite out of teacher prompts, oracle reference sets, curation selection and scaling-fit selection.

**Hardware.** Publish device model/count, precision, engines, versions, batching and measured utilization. Use separate CPU/GPU time, token work, currency and memory constraints unless a declared exchange rate converts costs. Calendar latency is a separately measured outcome, not the sum of parallel device times.

**Metrics.** Paired student effect as Eq. 11.21; total paid construction and learning work; accepted and unique counts; all failed/censored student runs; resource-feasibility status and subgroup effects. Report distributions and intervals at source-batch and student-seed units, plus sensitivity to missing-result bounds.

**Baselines.** Human-only/no-new-generation baseline; random synthetic selection; quality-score-only policy; group-aware policy with full scoring cost; no-admissible-policy fallback. Include finite occupancy and non-additive-gradient fixtures as mathematical controls, not capability experiments.

**Expected result.** No measured benefit or ranking is asserted. Eq. 11.17 predicts a stationary acceptance-cost component only, while Eq. 11.18 predicts fixed-class occupancy; neither predicts student gain. The finite policy selector can legitimately return no justified candidate.

**Ablation.** Equal offered work versus equal retained examples versus equal student tokens are distinct comparisons. Charge or remove oracle reference information explicitly. Compare group selection with equal-compute scoring controls; report any assumptions needed to extrapolate a fitted law outside observed sizes.

**Interpretation.** Accept only a cost-feasible policy whose final lower effect bound clears the registered margin and whose harm constraints pass. Unknown resource usage or unresolved outcomes yield an unknown decision. Finite termination and satisfying a cap establish neither global optimality nor a scientific-quality score.

**Threats to validity.** Nonstationary teacher costs, cache/batch effects, endogenous acceptance, semantic groups that are not an equivalence relation, oracle leakage, optimizer-dependent group rankings, sparse independent seeds, many-policy selection, failed-run exclusion and extrapolation beyond measured model/task regimes.

## 4. Acceptance criteria — reporting

[DERIVED] Publish the frozen manifests, all offered denominators, missingness and feasibility decisions, source-batch/seed-level results and the stated evidence label for each conclusion. Report a no-benefit or no-admissible-policy outcome as a legitimate result. Do not replace a failed confirmatory comparison with a favorable post-hoc metric. The current edition supplies the protocol and mathematical instruments; empirical outcome fields remain empty.
