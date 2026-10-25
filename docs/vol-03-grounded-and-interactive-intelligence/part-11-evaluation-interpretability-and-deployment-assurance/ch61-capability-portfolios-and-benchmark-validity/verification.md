---
id: ms.verification.61
entity_type: verification
title: "Chapter 61 — Verification"
volume: 3
part: 11
chapter: 61
section: null
slug: verification
parent: ms.chapter.61
prev_sibling: ms.section.61.6
next_sibling: ms.references.61
children: []
prerequisites: [ms.chapter.6, ms.chapter.31, ms.chapter.49, ms.chapter.55, ms.chapter.56, ms.chapter.57]
downstream: [ms.chapter.62, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [evaluation_validity], feedback_setting: [], modality: [text, image, audio, video]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1400
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 61 verification

[DERIVED] **Protocol status: unexecuted proposal.** No model, endpoint, human study, package or benchmark has been run. These protocols specify the plan's fixed-checkpoint prompt/budget audit and the controls needed to interpret it. Structural compilation and illustrative mathematical checks are not empirical replication.

## Artifact specification

| Proposed artifact | Required contents |
|---|---|
| requirements.json | Decision, population, gates, practical margins, resource envelope and reversal conditions |
| portfolio.json | Coverage cells, direct/proxy/gap rationale, sampling probabilities and complete candidate history |
| protocols.json | Data/task/model/tokenizer/processor revisions, rendered prompts, budgets, tools, extraction, grader and aggregation |
| items.jsonl | Offered IDs, source family, language/domain/modality, raw hashes, references, variants and admissibility |
| outcomes.jsonl | System/protocol/repeat/attempt keys, raw outputs, finish reason, acceptance, failures, abstention and actual usage |
| review.jsonl | Independent adjudication, reviewer qualification, control outcomes, disagreement and correction lineage |
| report.json | Task vectors/counts, paired/cluster-aware uncertainty, sensitivity, resource joins and bounded decision |

[DERIVED] Costs attach to offered IDs and retain failed retries. Freeze validation and selection rules before observing candidate outcomes. Keep confirmatory families separate from development; use permitted recordings/documents and consenting qualified reviewers for any human component. Missing outcomes remain explicit records.

### Instrument execution bindings

[DERIVED] Every executable instrument specializes an indexed expression below. Inputs are chosen analytical values; none is a measured score or fitted probability. Fractions are dimensionless in [0,1], counts use integer slider steps, and state changes preserve the same symbol mapping. Static/formula execution checks do not establish benchmark validity.

| Figure | Indexed expression executed | Symbol, unit and admissible domain | Specialization and conclusion limit |
|---|---|---|---|
| Figure 61.3 | Eq. 61.3: weighted binary coverage | w = omega_1 in [0,1]; q1/q2 = coverage indicators in {0,1}; omega_2 = 1-w; output fraction | Exactly two strata; q_r indicates an admissible measurement exists. Full coverage does not imply competence or adequate evidence. |
| Figure 61.6 | Eq. 61.6: p_i and conditional Fisher information | a > 0; ability = eta; difficulty = delta; local scores dimensionless; probability fraction and information scalar | Two-parameter logistic model, not a fitted system. It executes both displayed components, not a measure of deployment utility. |
| Figure 61.9 | Eq. 61.9: finite score range | p1/p2/p3 in [0,1]; output absolute accuracy fraction | Three prespecified protocol scores. Max minus min is descriptive and is not a confidence interval or unseen-protocol bound. |
| Figure 61.12 | Eq. 61.10: max(-1, observed gap - 2*label fraction) lower bound | gap in [-1,1]; eta = epsilon_lab in [0,1]; output accuracy-gap fraction | Fixed item set and predictions, binary labels, corrected difference in [-1,1]. The displayed bound is a worst-case consequence, not an estimate of actual label error. |
| Figure 61.15 | Eq. 61.15: 1-alpha^(1/n) | n >= 1 independent accepted cases; alpha in (0,1); output conditional failure fraction | Zero observed failures and fixed i.i.d. accepted-case sampling. Excludes no-coverage and dependent cases. |
| Figure 61.18 | Eq. 61.17: integer ceiling of log(2R/alpha)/(2*epsilon^2) | cells = R >= 1; alpha in (0,1); eps = epsilon > 0; output cases per cell | Prespecified bounded-score cells with within-cell i.i.d. observations; conservative simultaneous accuracy bound, not paired-comparison power. |

[DERIVED] Calculator states change only declared illustrative inputs. The reference expression, units, sampling premises and inferential boundary remain fixed. Other authored diagrams/compares are explanatory structures, not hidden numerical estimators.

## Verification task

### Experiment 61.1 — Portfolio and protocol sensitivity

**Hypothesis.** [ASSUMED] A candidate selection remains admissible within its practical margins across the prespecified prompt/budget grid. A ranking reversal or required-gate failure falsifies stability at that operating condition. No candidate advantage is predicted.

**Setup.** [ASSUMED] Select two fixed checkpoint revisions, three independently authored valid prompt templates, and generation caps of 256, 512, 1,024 and 2,048 tokens. Reserve one third of item families for confirmation after selection. Declare whether reasoning and tool tokens consume the cap.

**Independent variables.** [ASSUMED] Prompt template, generation cap and candidate endpoint. Analyze interactions explicitly. Tool access is fixed; if it cannot be matched, report a separate endpoint comparison instead of attributing the difference to weights.

**Controlled variables.** [ASSUMED] Same offered IDs, input support, dataset revision, per-checkpoint tokenizer/processor, extraction, grader, failure rules, inference configuration, concurrency and time window. Equal seed integers do not imply coupled randomness across architectures.

**Dataset/workload.** [ASSUMED] Begin with 240 source-disjoint task families stratified across mathematics, science/knowledge, coding, instruction constraints, target languages, evidence-dependent modalities and long context. This is a planning count, not a power argument; determine independent-unit requirements from the acceptance margin before execution. Keep translations and source-related items in one split.

**Hardware.** [UNVERIFIED] Pin accelerator/CPU, precision, runtime/container, kernels, model revisions, tools and timing boundaries before execution. A mutable hosted alias supports only a timestamped endpoint claim. No device or compatibility is established by this proposal.

**Metrics.** [ASSUMED] Offered and per-stratum acceptance, completion/truncation/invalid/failure counts, paired changes, family-cluster uncertainty, ranking/admissibility sensitivity, tokens, calls, retries, tool work, wall-clock delay and accepted-task expense. Separate item uncertainty from inference repeats and training-run uncertainty.

**Baselines.** [ASSUMED] Frozen baseline template at each cap, a common reference budget and identity-input duplicate controls. Complete-case diagnostics remain separate from offered-population acceptance. A test-label oracle selector is a diagnostic upper reference, not a deployable routing baseline.

**Expected result.** [UNVERIFIED] No model is expected to lead or pass. The artifact should expose whether the decision depends on prompt, completion opportunity or a failed requirement. Retained raw outputs and protocol IDs should permit reconstruction without erasing unsuccessful calls.

**Ablation.** [ASSUMED] Vary only template at fixed cap, then only cap at fixed template. Audit truncation with finish reasons. Compare pure regrading of saved output separately from new inference after an input change; the interventions answer different questions.

**Interpretation.** [DERIVED] Stability supports only the checked grid/population under its uncertainty. A reversal changes the protocol-conditioned choice; shared gate failure leaves no admissible candidate. Confirm any selected protocol on reserved families. Budget exhaustion establishes termination, not impossibility or quality.

**Threats to validity.** [DERIVED] Related checkpoints, task provenance, small independent strata, parser error, prompt meaning changes, provider updates, hidden reasoning work, completion conditioning, adaptive selection and unknown population weights can confound ranking. Narrow the claim or leave it unresolved when controlling assumptions fail.

### Experiment 61.2 — Validator and perturbation controls

**Hypothesis.** [ASSUMED] The validator accepts valid artifacts and rejects material violations, and every in-scope transform preserves the target requirement. A known-invalid accepted control or task-changing allegedly valid variant falsifies the respective measurement contract.

**Setup.** [ASSUMED] Construct original/variant pairs and known-correct, known-incorrect, malformed, timeout and ambiguous controls. Independently review labels and transformations before candidate outputs. Run programs only in disposable pinned sandboxes with the task's declared permissions and no production credentials.

**Independent variables.** [ASSUMED] Choice order, whitespace, one reviewed paraphrase, native versus translated wording, relevant-evidence removal and parser normalization. Evidence removal and intentional task-changing controls are separate answerability conditions, not automatically benign perturbations.

**Controlled variables.** [ASSUMED] Original family, specification, support, model/protocol revision, execution caps and grader except where deliberately intervened. Pin transform version, parameters, seed and composition order. Preserve raw outputs for non-deterministic rewriting rather than asserting seed reproducibility.

**Dataset/workload.** [ASSUMED] Use 120 source-disjoint families including an untested-input program counterexample, sign/numeric extraction, bracket-sensitive scientific notation, an evidence shortcut and native-language review cases. Retain all generated variants with independent admissibility decisions and selection histories.

**Hardware.** [UNVERIFIED] Pin sandbox image, interpreter/compiler, OS, CPU/accelerator, evaluator endpoints and transform commit before execution. Static code locators in the manuscript do not establish installation or runtime compatibility.

**Metrics.** [ASSUMED] Validator false acceptance/rejection on controls, ambiguity/unparseability, semantic-review disagreement, matched acceptance and response disagreement on valid variants, evidence-dependence failures, offered/retained/invalid-variant counts, review effort and transformation/inference expense.

**Baselines.** [ASSUMED] Identity transformation, mathematical/specification reference, qualified independent adjudication, finite tests and stronger hidden tests with justified coverage. A semantic model judge is an instrument requiring validation rather than ground truth by declaration.

**Expected result.** [UNVERIFIED] No robustness rate is predicted. Incomplete tests may intentionally accept the incomplete-test fixture; a specification-aware audit should identify the missing obligation. Effects on candidate model behavior remain unknown until valid execution.

**Ablation.** [ASSUMED] Disable normalization, independently correct labels, remove an evidence channel and compare single versus ordered composed variants one factor at a time. Publish original and corrected protocol versions rather than silently overwriting scores.

**Interpretation.** [DERIVED] A failed control requires validator correction before capability inference. An invalid transform is an admissibility defect. A valid variant exposing a material drop establishes conditional fragility, not natural prevalence or contamination causality. A null audit supports only the inspected scope.

**Threats to validity.** [DERIVED] Reviewer error, correlated generator/judge mistakes, limited controls, incomplete tests, changed difficulty, candidate-dependent filtering, translations and public exposure can confound results. Separate adversarial discovery sets from representative prevalence samples.

### Experiment 61.3 — Paired report and decision audit

**Hypothesis.** [ASSUMED] Independent reconstruction recovers the same denominators, paired contrasts and decision under the frozen analysis, and plausible prespecified weights/label bounds preserve the practical conclusion. An unreconciled outcome or material sensitivity reversal falsifies report stability.

**Setup.** [ASSUMED] Give an independent analyst immutable offered outcomes and protocol manifests without a preferred aggregate. Reconstruct vectors, gates, uncertainty, macro/micro summaries and resources. Begin with synthetic ledger fixtures; analyze real candidates only after valid execution of Experiments 61.1–61.2.

**Independent variables.** [ASSUMED] Equal-task versus declared deployment weights, label-error bounds, failure handling, item versus family resampling and offered versus accepted timing denominators. Intentionally invalid analyses are controls, not equally defensible reporting choices.

**Controlled variables.** [ASSUMED] Fixed raw outcomes, system/protocol identities, primary estimand, sampling hierarchy, practical margins, accounting window, multiplicity plan and confirmation split. Do not change the chosen candidate after inspecting sensitivities without a new confirmation step.

**Dataset/workload.** [ASSUMED] Fixtures include equal means with disjoint errors, macro/micro rank reversal, duplicated translations, an all-failed cohort, a missing terminal outcome, a leaked demonstration and a failed retry before success. Fixture values are chosen test inputs, not model measurements.

**Hardware.** [UNVERIFIED] Pin CPU analysis environment, statistical package versions and exact analysis code before execution. Accelerator performance is irrelevant to ledger fixtures; actual inference/billing records are required for endpoint resource conclusions.

**Metrics.** [ASSUMED] Row reconciliation, independent family counts, paired changes/intervals, gate/candidate sensitivity, undefined-denominator handling, resource totals, accepted-task expense, reconstruction differences and their causes. Audit exclusions and selection history alongside point estimates.

**Baselines.** [ASSUMED] Hand-calculated small fixtures, the chapter equations under their premises, frozen weights and cluster-aware analysis matching the sampling design. Naive row bootstrap or failure-dropping reports serve only as invalid controls.

**Expected result.** [MATHEMATICALLY-DERIVED] Analytical fixtures have calculable outcomes under their premises. Zero accepted cases yield undefined accepted risk and expense per accepted task. No future real-candidate outcome is asserted.

**Ablation.** [ASSUMED] Remove pairing, collapse family IDs, omit failed attempts, switch weights or count unknown outcomes as successes one at a time. Restore each required field to locate the changed interpretation. Keep valid sensitivity separate from deliberately incorrect analysis.

**Interpretation.** [DERIVED] Reconstruction defects are implementation/reporting failures. A valid sensitivity reversal exposes a decision-relevant assumption. Stability cannot repair invalid population support or grading. Stop at the declared audit and identify evidence that would reopen the choice rather than attach a quality rating.

**Threats to validity.** [DERIVED] Small cluster counts, adaptive weights, incomplete billing, unrecorded infrastructure failures, hidden candidate search, stale cached grades and dependence beyond the recorded hierarchy can defeat inference. Resampling cannot manufacture independent evidence or missing observations.

## Reproducibility

[DERIVED] These proposals terminate under finite task, attempt and time caps. Termination is not success; source results are not book replications. The report supports only the population and operating envelope whose assumptions survive its audit. Deployment authorization belongs to Chapter 66, outside these proposed evaluations.
