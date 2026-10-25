---
id: ms.verification.65
entity_type: verification
title: "Chapter 65 verification and topic audit"
volume: 3
part: 11
chapter: 65
section: null
slug: verification
parent: ms.chapter.65
prev_sibling: ms.section.65.6
next_sibling: ms.references.65
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.24, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36, ms.chapter.46, ms.chapter.47, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64]
downstream: [ms.chapter.66]
related: [ms.chapter.30, ms.chapter.42, ms.chapter.48]
relations: []
axes: {lifecycle: [pretraining, post_training, inference, evaluation, assurance], mechanism: [security_boundary, privacy_accounting, adversarial_evaluation], feedback_setting: [], modality: [text, code, image, tool_trajectory]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 65 - Verification and topic audit

[DERIVED] **Editorial status: manuscript_draft.** All five experiments below are proposed and unexecuted. Source methods/tables/appendices and two pinned implementation paths were inspected; no source training, attack campaign, private-data extraction, human adjudication or deployed mitigation test occurred. Structural and pure mathematical fixtures establish only the limited properties they check.

## Artifact and acceptance rule

[DERIVED] Produce a versioned threat/control graph, synthetic-assets fixture, privacy-access/accounting ledger, frozen attack/scoring protocol, harmful/legitimate outcome table and residual-risk decision record. A release claim must identify its asset/event, attacker access, budget, system/harness state, denominator, uncertainty and control owner. Missing data, zero executions and unresolved authorization/accounting paths do not become passing evidence.

## Coverage audit

| Planned topic | Mechanism and mathematical object | Source evidence | Required unresolved check |
|---|---|---|---|
|65.1 Threat surfaces | Authority graph, reachability and sampling model, Eq.65.1-65.4 | Safeguard poisoning access/trials, R65.1 | Complete deployment paths, provenance and review detectability |
|65.2 Training/model attacks | Bilevel integrity, pure-DP posterior specialization, coverage/ROC, Eq.65.5-65.8 | AutoMIA and fine-tuning extractability, R65.3-R65.4 | Actual artifact identity, matched nonmembers and unknown-content recovery |
|65.3 Runtime attacks | Conditional hazards, capability intersection, composed probability, Eq.65.9-65.12 | Back-Reveal/Adaptive Adversaries/code, R65.2,R65.5,R65.11 | Actual side effects, all egress and caller reset semantics |
|65.4 Controls | DP definition/update/composition and dependent misses, Eq.65.13-65.16 | DP-SelFT/MCP, R65.6,R65.10 | Complete accountant, unit/adjacency, broker completeness and conformance |
|65.5 Safety evaluation | PPV, separate harm/utility, group objective/constraints, Eq.65.17-65.20 | WIFA/boundary/self-assessment, R65.7-R65.9 | Independent adjudication, common benchmarks and resource costs |
|65.6 Residual risk | Feasible-adversary risk, unions, useful cost and zero-event endpoint, Eq.65.21-65.24 | Adaptive protocol limits, R65.5 | Distribution/access shift, untested attacks and release ownership |

## Proposed experiments

### Experiment 65.1 — Lifecycle authority and canary audit

**Hypothesis.** [DERIVED] A complete, enforced authority graph blocks forbidden synthetic asset paths while preserving declared legitimate operations; provenance alone cannot establish that behavior.

**Setup.** [DERIVED] Build an authorized local mock application with synthetic tenant records, no real secrets, isolated loaders and mocked tools/egress. Freeze the graph and violation oracle before testing.

**Independent variables.** [DERIVED] Attacker-writable surface, privileged versus unavailable access, direct versus retrieved content, provenance checks and structural mediation.

**Controlled variables.** [DERIVED] Synthetic task instances, application/component hashes, principal/resource assignments, model interface or deterministic proposal fixture, budgets and event definitions.

**Dataset/workload.** [DERIVED] Grouped synthetic training-artifact, retrieval, memory, log and tool-path cases plus legitimate cross-resource tasks with explicit access labels.

**Hardware.** [ASSUMED] Planned local CPU mock server and isolated process/container; any optional model-backed run records exact accelerator/runtime and is a separate unexecuted condition.

**Metrics.** [DERIVED] Attempted/blocked/executed/uncertain violations, reachable paths, tenant separation, legitimate useful completion, latency and retained sensitive fields.

**Baselines.** [DERIVED] No privileged access, provenance-only checking, model-instruction-only checking and enforced resource mediation.

**Expected result.** [ASSUMED] Removing a necessary capability should block that modeled path; this expectation does not establish graph completeness or behavioral robustness.

**Ablation.** [DERIVED] Remove each broker/egress/memory/log restriction independently and test redirects, stale permissions and derived summaries without adding real targets.

**Interpretation.** [DERIVED] A single executed forbidden transition falsifies the corresponding invariant; passing results apply only to the enumerated paths and frozen environment.

**Threats to validity.** [DERIVED] Incomplete mocks, missing side channels, unrealistic legitimate tasks, scorer blind spots and accidental privilege differences can overstate enforcement.

### Experiment 65.2 — Separate integrity, membership and privacy-accounting evidence

**Hypothesis.** [DERIVED] Known-candidate membership, aggregate extraction coverage and poisoned behavior yield distinct outcomes, while a private pipeline's formal claim depends on every raw-data access and adjacency convention.

**Setup.** [DERIVED] Use an authorized small local model or deterministic mechanism fixtures on wholly synthetic records. Maintain separate attack-development/calibration/test groups and an explicit release/accounting graph; do not process private or copyrighted reference text.

**Independent variables.** [DERIVED] Candidate prior, matched versus shifted nonmembers, query/generation budget, allowed adaptation access, record versus user units and add/remove versus replacement adjacency.

**Controlled variables.** [DERIVED] Synthetic corpus/source groups, model/optimizer seeds, fixed score thresholds, exact matching rules, clipping/noise normalization and final test split.

**Dataset/workload.** [DERIVED] Synthetic member/nonmember records, unknown synthetic spans, controlled benign/conditional behavior cases and histogram/clipped-gradient adjacency pairs.

**Hardware.** [ASSUMED] Planned CPU fixtures and, only if training is later authorized/executed, a single recorded local accelerator with memory/precision/software disclosed.

**Metrics.** [DERIVED] TPR at low FPR, ROC AUC, prior-sensitive precision, single-output versus union coverage, conditional/clean behavior, accounting parameters and sensitivity counterexamples.

**Baselines.** [DERIVED] Random score, source-matched nonmembers, no adaptation, unrelated synthetic text, full versus selective updates and an independently checked accounting reference.

**Expected result.** [ASSUMED] Shifting nonmembers may inflate apparent membership; union coverage can exceed any one output; replacement sensitivity can exceed add/remove sensitivity. No model effect is asserted in advance.

**Ablation.** [DERIVED] Vary candidate knowledge and remove each private selection/labeling/training release from a deliberately incomplete ledger to verify the audit detects the omission.

**Interpretation.** [DERIVED] Report the observable actually tested. A pure mathematical/accounting check is not a model-privacy replication or proof that no extraction exists.

**Threats to validity.** [DERIVED] Toy distributions, attack overfitting, user correlations, mismatch between formal mechanism and library implementation, and optional training instability limit transfer.

### Experiment 65.3 — Composed runtime mediation under adaptive feedback

**Hypothesis.** [DERIVED] Resource/destination-bound mediation reduces actual unauthorized mock effects beyond textual safeguards, but shared monitors can have correlated misses and utility costs.

**Setup.** [DERIVED] Run local mock retrieval, memory and tools with synthetic canaries, a typed proposal broker and both textual/disclosure and execution-state oracles. Freeze session/reset and feedback semantics.

**Independent variables.** [DERIVED] Direct/indirect content surface, fresh/persistent defender state, attacker feedback, equal-budget attacker diversity, mediation, monitor and provenance conditions.

**Controlled variables.** [DERIVED] Principal/resource data, tool schemas, approval binding, model/harness identity, attack budget, timeout handling and legitimate workload distribution.

**Dataset/workload.** [DERIVED] Held-out synthetic intents/source documents and benign tasks requiring the same tools, with separate unavailable-access controls.

**Hardware.** [ASSUMED] Planned local mock services; model calls, if later executed, require recorded checkpoint/API revision, inference hardware where known, rate limits and costs.

**Metrics.** [DERIVED] ASR by independent battle/budget, emitted canary, actual state/egress violation, conditional monitor misses, legitimate completion, refusal, latency and all-attempt cost.

**Baselines.** [DERIVED] Instruction-only defense, each control alone, composed controls and no privileged capability; compare equal total attacker budgets before claiming efficiency.

**Expected result.** [ASSUMED] Structural mediation should prevent its explicitly forbidden effect when complete; behavior and useful completion can still fail. Independence of control misses is not assumed.

**Ablation.** [DERIVED] Remove destination/resource checks, replay stale approvals, exercise ambiguous acknowledgment and compare output criteria that include versus exclude secrets inside refusals.

**Interpretation.** [DERIVED] Delivery, activation, textual violation and actual side effect retain separate denominators; do not multiply separate marginal rates into an unmeasured end-to-end result.

**Threats to validity.** [DERIVED] Mock fidelity, incomplete egress, adaptive test reuse, clustered battles, evaluator errors and unknown production paths remain.

### Experiment 65.4 — Harmful and legitimate boundary operating points

**Hypothesis.** [DERIVED] A useful safety intervention needs independently assessed harm reduction and retained legitimate completion; one over-refusal metric or teacher-relative recall is insufficient.

**Setup.** [DERIVED] Freeze a deployment-specific policy, intent/source splits, wrapper groups, monitor thresholds and independent adjudication plan before final testing. Keep ambiguous labels visible.

**Independent variables.** [DERIVED] Intent/form composition, shared versus unseen wrappers, boundary-pair supervision condition, monitor operating point and event prevalence sensitivity.

**Controlled variables.** [DERIVED] Base model/version, adaptation budget, generation settings, common benchmark fields, judge identity, attack budget and per-intent sample counts.

**Dataset/workload.** [DERIVED] Synthetic harmful/benign/ambiguous near-boundary groups and representative legitimate tasks; independent audit samples include both flagged and unflagged outcomes.

**Hardware.** [ASSUMED] Planned recorded local/served inference configuration with assessor cost, cache retention and concurrency; no adaptation or human study has been run.

**Metrics.** [DERIVED] Harmful violation/severity, false refusal, useful completion, per-group outcomes, teacher/independent disagreement, PPV sensitivity, review workload and latency/cost.

**Baselines.** [DERIVED] Unmodified system, refusal-only intervention, each proposed boundary/monitor condition and a constant-refuse negative utility control.

**Expected result.** [ASSUMED] Different metrics can move in opposite directions; independent review may reveal teacher-shared errors. No uniformly superior operating point is presupposed.

**Ablation.** [DERIVED] Remove benign boundary pairs, group anchors or independent negative-sample review; retain matched compute and identical benchmark composition where feasible.

**Interpretation.** [DERIVED] Select from the declared harm/utility/resource constraints, with clustered uncertainty. Passive flags, blocking and policy adjudication remain distinct claims.

**Threats to validity.** [DERIVED] Policy ambiguity, synthetic coverage, judge dependence, rare-event priors, unpinned services and small training-seed counts limit inference.

### Experiment 65.5 — Budget, shift and residual-risk decision audit

**Hypothesis.** [DERIVED] A versioned residual-risk record exposes which release claims fail when access, distribution, budget or scorer assumptions change.

**Setup.** [DERIVED] Freeze a local candidate/control graph and predeclare release constraints, uncertainty method, hold/restrict/release outcomes and reopening signals. Keep a final held-out suite separate from development.

**Independent variables.** [DERIVED] Attacker budget, attack family, fresh/persistent state, workload shift, evaluator disagreement/missingness and capability changes.

**Controlled variables.** [DERIVED] Within each comparison, system identity, success event, independent battle/task unit, legitimate benchmark set, seeds and total resource accounting.

**Dataset/workload.** [DERIVED] Held-out synthetic attack battles and legitimate task sessions, with explicit zero-opportunity, zero-execution, timeout and uncertain-effect cases.

**Hardware.** [ASSUMED] Planned local harness plus any later recorded inference/review infrastructure; operational staffing and alert capacity are declared resources.

**Metrics.** [DERIVED] Budget curves, per-scenario denominators, useful-task cost, fixed-design confidence endpoints where applicable, unresolved paths and correct reopening decisions.

**Baselines.** [DERIVED] One-shot scoring, fixed-budget multi-attempt scoring, equal-cost diverse attackers, no-shift workload and an intentionally overconfident zero-failure rule.

**Expected result.** [ASSUMED] Larger search budgets can reveal more failures; changed premises should reopen affected claims. No finite suite is expected to prove universal security.

**Ablation.** [DERIVED] Treat dependent attempts as IID, omit failed/retried cost, sum conditional category rates or ignore missing outcomes, and check that the audit rejects those invalid conclusions.

**Interpretation.** [DERIVED] Separate concrete counterexamples, empirical uncertainty, conditional formal bounds and untested risk. A resource stop is recorded as a budget stop.

**Threats to validity.** [DERIVED] Unknown attacks, incomplete graph/scorer, selection bias, deployment drift and unrealistic review capacity remain beyond the proposed suite.

## Semantic calculator-binding audit

[MATHEMATICALLY-DERIVED] Each instrument executes the cited expression or explicitly declared specialization. Default evaluation uses the actual formula parser, with pure fixtures separately checking edge cases. This does not execute a source experiment.

| Instrument | Exact indexed expression/component | Symbol/unit/domain mapping | Specialization and boundary |
|---|---|---|---|
| fig-65.3 | Eq.65.3, (1-m/N)^r | p=m/N dimensionless in[0,1]; r positive integer inspections | Independent with-replacement sampling; inspected poisons assumed recognizable; not hypergeometric |
| fig-65.6 | Eq.65.6, posterior upper bound | eps=epsilon dimensionless[0,10]; pi prior in[.00001,.99] | Pure DP delta=0 and two adjacent-dataset hypotheses; exp is e to epsilon; not arbitrary population MIA |
| fig-65.11 | Eq.65.9, equal-hazard specialization | p=q_t dimensionless[0,1]; B positive integer attempts | Constant conditional hazard; adaptive varying q_t not modeled |
| fig-65.12 | Eq.65.16, lower/upper bounds and independent component | m1,m2 dimensionless[0,1] | Bounds need same-distribution events; product is labeled independent hypothetical, not measured cascade |
| fig-65.15 | Eq.65.17, PPV and expected false alerts | t recall in[.0001,1]; f FPR[0,1]; pi prevalence[.000001,1]; N positive integer | Fixed common population/threshold; positive t*pi avoids undefined PPV; false alerts is an expectation, not rounded count |
| fig-65.20 | Eq.65.24, one-sided zero-event upper endpoint | n positive integer; eta error probability in[.000001,.5] | Fixed-event IID Bernoulli trials; confidence1-eta; no adaptive/selection/general-deployment certificate |

## Local verification scope

[DERIVED] Required structural checks are nine documents, six canonical section structures/observations blocks,24 indexed equations, six mathematical algorithms,20 authored figures plus chapter map, five typed terms, five proposed experiments each with12 ordered nonempty fields,11 reference rows and nine lineage entries. Run the real compiler in memory, figure validation and pure mathematical/parser fixtures; report the actual results in the current-run audit artifact rather than embedding an unexecuted pass claim.

[DERIVED] Pure fixtures cover sampling-law differences, Bayes/pure-DP boundaries, coverage unions, nonstationary hazards, conditional versus marginal composition, binomial field saturation, adjacency sensitivities, basic composition, dependent-control bounds, PPV/zero-denominator behavior, refusal versus useful completion, group-anchor degeneracy, feasible-set inclusion, union bounds, useful-cost denominator and exact zero-event inversion. These are mathematical/engineering checks only.

## Decision and reversal conditions

[DERIVED] Accept a scoped claim only if its source/implementation identity, assumptions, denominator, uncertainty and legitimate utility are explicit. Hold a formal privacy claim with unresolved accounting. Restrict capabilities when the consequence of an untested route is unacceptable. Reopen on changed privileges, policy/model/control/scorer, workload shift, observed unauthorized effect, secret exposure or review backlog. No arbitrary10/10rating substitutes for this evidence.

## Remaining gaps

[UNVERIFIED] No live broker, sandbox, DP training implementation, attack campaign, source benchmark, safety adaptation, human oversight workflow or production mitigation has been executed. Source code was inspected only for two originating paths; code/recipe equivalence and other implementation claims remain bounded by their ledger. Figures/calculators explain conditional mechanisms, not deployment certificates.
