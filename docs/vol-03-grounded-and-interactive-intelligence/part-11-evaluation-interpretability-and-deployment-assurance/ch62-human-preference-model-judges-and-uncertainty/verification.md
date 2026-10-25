---
id: ms.verification.62
entity_type: verification
title: "Chapter 62 — Verification"
volume: 3
part: 11
chapter: 62
section: null
slug: verification
parent: ms.chapter.62
prev_sibling: ms.section.62.6
next_sibling: ms.references.62
children: []
prerequisites: [ms.chapter.6, ms.chapter.61]
downstream: [ms.chapter.63, ms.chapter.66]
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

# Chapter 62 verification

[DERIVED] **Protocol status: unexecuted proposal.** No participant recruitment, model endpoint, judge ensemble, calibration procedure, adversarial attack or package was executed. The chapter's equations and counterexamples are conditional mathematical analysis. These experiments specify the human/judge artifact and independent checks needed before its conclusions are used.

## Artifact specification

| Proposed artifact | Required contents |
|---|---|
| decision.json | Target population, predicate, action set, costs, practical margins, gates and reopening conditions |
| rubric.json | Anchors, evidence access, criterion meanings, tie/abstain policy and independently checked controls |
| assignments.jsonl | Deidentified task/rater IDs, recruitment/qualification opportunity, randomized slots, repeats and missingness |
| judgments.jsonl | Raw human/model grades, actual versus displayed identity, confidence, rationale/evidence and parser status |
| references.jsonl | Independent labels, reviewer qualification, disagreements, adjudication and label revisions |
| judge-manifest.json | Endpoint/prompt/parser/ensemble revisions, configured roster, tool privileges and attempt/time caps |
| calibration.json | Score construction, independent splits, fixed grid, accepted/error counts, multiplicity rule and NULL outputs |
| report.json | Pairwise/confusion tables, identification/convergence, clustered uncertainty, risk/coverage, cost and decision sensitivity |

[DERIVED] Preserve offered judgments and all attempts before any outcome-based filtering. Keep participant identity/consent records outside the analytic artifact while retaining deidentified assignment information sufficient to reconstruct dependence. Human participation and data use require the recorded consent/access procedures before execution.

### Instrument execution bindings

[DERIVED] Executable instruments specialize these exact indexed components. Chosen values and states are analytical illustrations. Count fields have integer slider steps; probabilities are fractions. Domain restrictions exclude singular expressions while the manuscripts separately explain excluded/undefined cases.

| Figure | Indexed expression executed | Symbol, unit and admissible domain | Specialization and conclusion limit |
|---|---|---|---|
| Figure 62.3 | Eq. 62.3: Gr and Gr/[1+(r-1)*rho] | G >= 1 independent clusters; r >= 1 judgments/cluster; rho in [0,1]; count and variance-equivalent count | Equal cluster size/common variance/equicorrelation model; rho is chosen rather than estimated. Crossed dependence is not automatically represented. |
| Figure 62.6 | Eq. 62.4: sigma(score difference) | delta = s_i-s_j in [-5,5], dimensionless log-odds; probability output | Binary Bradley–Terry component only. It does not execute the full likelihood, fit scores, model ties or represent a preference cycle. |
| Figure 62.9 | Eq. 62.8: (q+c-1)/(s+c-1) | q in [0,1]; sens=s and spec=c in [0.6,1], so denominator >= 0.2; output unclipped scalar | Binary confusion inversion with transferable sensitivity/specificity. Out-of-range plug-in output is deliberately visible and signals incompatible estimates; it is not a certified probability. |
| Figure 62.12 | Eq. 62.10: mapped swap-average and derivative at zero margin; no-position specialization | margin=d; bias=zeta; probability outputs and dimensionless local slope | Plain preference sets zeta=0; averaged preference uses current d/zeta; slope equals 4*exp(-zeta)/(1+exp(-zeta))^2 at d=0 regardless of current margin. Local logistic result, not universal debiasing. |
| Figure 62.15 | Eq. 62.15: min(1,e/n+sqrt(log(K/delta)/(2n))) | n accepted cases in [100,10000]; errors=e integer [0,100], ensuring e<=n; K>=1 fixed thresholds; delta in (0,1); output risk fraction | Executes the positive-count simultaneous Hoeffding component. Does not select a threshold, certify independence, execute NULL behavior or prove predicate truth. |
| Figure 62.18 | Eq. 62.17: raw agreement and Cohen kappa | a=n11,b=n12,c=n21,d=n22 are positive integer confusion counts; n=sum counts; p_e<1 | Two-class table; all cells positive keeps the calculator defined. Degenerate constant-label cases remain explicitly undefined in the manuscript. Kappa is chance-corrected agreement, not factual-error rate. |

[DERIVED] State overrides retain the same component binding. A calibrated or corrected proxy remains conditional on its reference and target assumptions. Diagram/compare figures introduce no additional numerical estimator.

## Verification task

### Experiment 62.1 — Human and order audit

**Hypothesis.** [ASSUMED] The rubric supports the intended predicate and the selected endpoint remains admissible under randomized display order and prespecified rater/task strata. A failed independent control, material order effect or subgroup gate violation falsifies that bounded claim.

**Setup.** [ASSUMED] Pilot criterion anchors on separate tasks, then freeze them. Recruit 12 consenting domain/language-qualified raters, with target-user representation recorded separately. Counterbalance AB/BA presentation and task blocks. Repeat a prespecified subset without treating duplicates as new content draws.

**Independent variables.** [ASSUMED] Display order, endpoint pair, domain/language stratum and repeated versus first presentation. Qualification/control opportunities are designed before collection; do not select raters based on which endpoint they prefer.

**Controlled variables.** [ASSUMED] Same output content and permitted references under order swaps, frozen rubric/interface, blinded model identity, task-family split and time allowance. Keep factual adjudication and user preference as separate criteria when both are required.

**Dataset/workload.** [ASSUMED] Begin with 240 source-disjoint prompt families across four required domains, including clear passes/failures, omissions, ambiguous references and unanswerable cases. The planning count is not a power calculation; determine independent families/raters from the decision margin. Every qualification assignment includes meaningful class opportunity.

**Hardware.** [UNVERIFIED] Pin annotation interface, browser/device support, reference rendering and any candidate-generation stack before execution. No participant environment or model compatibility has been established by the book.

**Metrics.** [ASSUMED] Recruitment/retention, per-rater opportunities, criterion-level raw agreement and confusion, repeat stability, order effects, ties/abstentions, rater/task dependence, subgroup preference/acceptance and review effort/expense. Undefined class metrics remain undefined rather than becoming zero expertise.

**Baselines.** [ASSUMED] Independent adjudicated controls, blind order-balanced collection and a frozen reference endpoint. Compare general-user and domain-qualified judgments only on their declared predicates/populations; neither is a universal ground truth for the other.

**Expected result.** [UNVERIFIED] No endpoint advantage or human agreement level is predicted. A complete ledger should reveal whether rubric, opportunity, order or retention controls the conclusion. Known zero-opportunity fixtures should not be interpreted as failed positive-class recall.

**Ablation.** [ASSUMED] Remove identity blinding, alter only answer order, or apply a deliberately invalid F1-based retention rule to the saved ledger one factor at a time. Restore controls and compare the inferred population and decision without overwriting the original report.

**Interpretation.** [DERIVED] A failed control invalidates the instrument for that role. Preference heterogeneity may be a population property rather than annotator error. A material order effect requires adjustment or a narrower conclusion. Confirm any selected endpoint on reserved tasks rather than reusing development labels.

**Threats to validity.** [DERIVED] Self-selection, insufficient expertise, shared sources, fatigue, unblinding, reference mistakes, ambiguous rubrics, missingness, candidate-dependent exclusions and small independent rater counts can confound inference. Consent/access and retention limitations bound the reusable evidence.

### Experiment 62.2 — Judge validation and bias controls

**Hypothesis.** [ASSUMED] A frozen judge/parser/ensemble detects the decision-relevant failures within its allowed error margin and remains valid under declared nuisance/attack controls. A material false acceptance or invalid strict-joint score falsifies that evaluator role.

**Setup.** [ASSUMED] Split qualified independent labels into development, calibration and confirmation families. Freeze two judge endpoints and one prespecified ensemble after development. Test side/turn/type output, order mapping, controlled length/style/label variants and bounded predicate-preserving attacks without unnecessary tools or side effects.

**Independent variables.** [ASSUMED] Judge/ensemble, absolute versus pairwise rubric, reference access, display order, preserved-content length/style and claimed authorship. Treat task-changing or predicate-destroying variants separately from valid nuisance controls.

**Controlled variables.** [ASSUMED] Same target content, independently reviewed predicate, endpoint/prompt/parser versions, configured roster, allowed evidence, call/token/time/retry caps and candidate-output distribution. Preserve raw values before any automatic normalization.

**Dataset/workload.** [ASSUMED] Use 180 held-out task families with subtle factual errors, omissions, wrong error locations, category ambiguity, invalid JSON and missing ground-truth fields. Add ledger fixtures with one entirely absent configured judge and with failed attempts before success. No benchmark data or attack has been executed.

**Hardware.** [UNVERIFIED] Pin model/provider revisions, CPU/accelerator, precision, runtime, context support and isolation. An API alias supports only a timestamped endpoint claim. No local compatibility follows from the paper's reported hardware.

**Metrics.** [ASSUMED] Per-class sensitivity/specificity/precision, joint and component correctness, parse failures, error overlap, configured-roster completeness, matched nuisance effects, conditional and offered attack rates, independent preservation audit, calls/tokens/retries and expense.

**Baselines.** [ASSUMED] Independent qualified labels or executable predicates, identity transform, simple validated checker, each ensemble member and an order-aware comparison model. Consensus with another unvalidated judge is not an independent baseline.

**Expected result.** [UNVERIFIED] No judge superiority or attack rate is asserted. Strict-joint fixtures with absent required targets must be rejected as unscorable, and an entirely missing configured judge must remain visible. Real judge error and defense effectiveness await valid execution.

**Ablation.** [ASSUMED] Drop a target field, infer the roster only from observed matches, omit failed retries, remove references, swap identical content and randomize displayed authorship independently. Compare simple and nuisance-adjusted fits on identical held-out prompt clusters.

**Interpretation.** [DERIVED] Parser/metadata failures require implementation repair; correlated errors require independent evidence; valid adversarial flips establish conditional vulnerability. Outcome-based filtering changes the target and must be reported. A defense passes only with ordinary acceptance, coverage and expense also admissible.

**Threats to validity.** [DERIVED] Correlated generator/judge errors, invalid transformations, label noise, incomplete references, attack search selection, missing roster members, provider drift, nonidentified nuisance terms and overfitting to confirmation data can defeat the conclusion.

### Experiment 62.3 — Calibration and decision audit

**Hypothesis.** [ASSUMED] The actual threshold-selection implementation matches Eq. 62.15 under its sufficient premises and supports the declared risk/coverage decision on untouched target cases. An implementation mismatch, failed assumption or material risk/gate violation falsifies that claim.

**Setup.** [ASSUMED] Freeze a score/system/predicate and a 20-point threshold grid using separate development data. Calibrate on independently sampled target tuples, then evaluate once on held-out data. Begin with analytical/synthetic controls before any model run; do not treat simulation agreement as proof of universal risk control.

**Independent variables.** [ASSUMED] Fixed versus empirical score grid, simultaneous versus unjustified per-threshold testing, independent versus shared-latent samples, target versus shifted strata and calibrated-score versus full-information action policies under their stated information regimes.

**Controlled variables.** [ASSUMED] Correctness event, generation/randomness procedure, score construction, calibration/test split, grid, error level delta=0.05, target risk alpha=0.05, tie boundary and cost/action meanings. Any chosen numerical value is a protocol choice, not a measured optimum.

**Dataset/workload.** [ASSUMED] Synthetic controls include independent Bernoulli errors; 1,000 errors determined by one shared Bernoulli variable; coarse-bin calibration cancellation; a safe policy with too few cases to certify; no accepted cases; and a target-only language stratum. Real model labels require independent adjudication and power/design review before collection.

**Hardware.** [UNVERIFIED] Pin the CPU statistical implementation, numerical precision, exact code revision and random generators for fixtures. For model uncertainty, additionally pin all generation and semantic-judge calls. No calibration software was executed here.

**Metrics.** [ASSUMED] Accepted/error counts, simultaneous bounds, threshold/NULL output, target accepted risk and coverage, subgroup gates, false certificates on simulated known targets, numerical boundary behavior, independent-unit counts and complete generation/review expense.

**Baselines.** [ASSUMED] Direct hand calculations, fixed-threshold exact binomial bounds under i.i.d. premises, fixed-grid simultaneous construction, forced answering and a separately evaluated review policy. Invalid exchangeability-only or repeated-unadjusted scans are negative controls rather than valid alternatives.

**Expected result.** [MATHEMATICALLY-DERIVED] The shared-latent count is zero or all errors and violates a binomial independence premise. Zero coverage has undefined conditional risk. A NULL certificate can arise for a safe policy with insufficient evidence. No future model risk/coverage result is predicted.

**Ablation.** [ASSUMED] Remove multiplicity adjustment, train the score on calibration labels, collapse dependent rows into nominal independent counts, change the correctness proxy or alter only the target distribution. Analyze each change as a different guarantee boundary and preserve the valid reference construction.

**Interpretation.** [DERIVED] A failed implementation control is a software defect; a failed sampling or support condition invalidates the certificate's transfer; no feasible threshold is failure to certify. Evaluate the declared utility with full posterior information only when available; score calibration alone supports the restricted policy class.

**Threats to validity.** [DERIVED] Dependent sources, adaptively selected grids, mislabeled proxy correctness, finite-sample underpower, distribution drift, hidden endpoint changes and omitted review cost can invalidate action claims. Independent confirmation cannot repair a predicate that measures the wrong requirement.

## Reproducibility

[DERIVED] Every proposal has finite item, attempt and time caps, a complete offered ledger and explicit stopping/reopening conditions. Completion means that the declared measurement obligations were checked or left unresolved; it does not imply a model is universally trustworthy. Chapter 66 owns deployment authorization and the release dossier.
