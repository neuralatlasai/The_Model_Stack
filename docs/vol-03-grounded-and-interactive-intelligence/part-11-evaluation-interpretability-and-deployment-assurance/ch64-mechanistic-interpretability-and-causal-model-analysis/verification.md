---
id: ms.verification.64
entity_type: verification
title: "Chapter 64 verification"
volume: 3
part: 11
chapter: 64
section: null
slug: verification
parent: ms.chapter.64
prev_sibling: ms.section.64.6
next_sibling: ms.references.64
children: []
prerequisites:
  [
    ms.chapter.2,
    ms.chapter.5,
    ms.chapter.13,
    ms.chapter.14,
    ms.chapter.15,
    ms.chapter.16,
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.32,
    ms.chapter.61,
    ms.chapter.62,
  ]
downstream: [ms.chapter.65, ms.chapter.66]
related: [ms.chapter.40, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [evaluation, assurance],
    mechanism:
      [causal_intervention, representation_analysis, feature_decomposition],
    feedback_setting: [],
    modality: [text],
  }
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        CODE-VERIFIED,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2200
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 64 verification

## Artifact specification

[DERIVED] The artifact is a mechanistic hypothesis with intervention controls. Required records are: (1) immutable model/tokenizer/dictionary/analysis-code/environment manifest; (2) site schema with module path, input/output, pre/post-normalization, token and dtype; (3) source-grouped discovery, validation and final-test identifiers; (4) hypothesis and nearest competing mechanism with variable/operation/intervention maps; (5) donor/alignment/background policy; (6) exact and approximate effects with scalar score and failed/undefined status; (7) graph before/after pruning, residual/error nodes and edge semantics; (8) reconstruction, joint replacement and intervention-transfer metrics; (9) controls and OOD counterexamples; (10) complete resource ledger; and (11) versioned decision/reopening record. The following two experiments are proposals, not results.

## Verification task

### Experiment 64.1 - Discriminating causal validation of a proposed circuit.

**Hypothesis.** A fixed sparse circuit predicts held-out finite interventions more accurately than a specified coarse-component or correlational rival, under the same donor/site/background and extraction budget, while passing identity and matched-null controls. The claim concerns the declared task/population, not complete model understanding.

**Setup.** Discover candidate variables and two competing mechanisms on discovery sources. Freeze their mappings and the scalar task score. Choose validation thresholds only on disjoint validation sources. Before final testing, record model/tokenizer/CLT hashes, all hook semantics, pruning levels, donor alignments, random seeds and acceptance intervals. Evaluate exact original-model patches, analysis-model predictions and nulls on the same paired records. Any unavailable mapping is declared unresolved rather than silently replaced by graph deletion.

**Independent variables.** Hypothesis/circuit choice; zero, matched-resampled and semantically paired donors; full activation versus path-restricted interventions; single versus joint feature changes; source-template and compositional distribution shift; first-order versus HVP/exact effect estimator at fixed candidate budgets.

**Controlled variables.** Frozen original and replacement checkpoints, input/token alignment, target score, sequence length cap, precision/kernel path, dataset splits, retained-error policy, extraction and intervention budgets, source-grouped uncertainty method and final-test selection. PCA/probe/covariance and layer selection fit only discovery/validation data. Same donors and test cases are used across candidates.

**Dataset/workload.** Proposed pilot of 500 independent source/template groups, with multiple paired interventions within each group and a separately curated counterexample set. Task families include a lexical-confound control, relational/compositional contrast and label-preserving paraphrase. Real-world labels and intervention validity require independent human adjudication. If 500 independent groups cannot be justified, report the actual effective grouping and precision; do not treat all patches as independent examples. Discovery, validation and test counts and exclusions are recorded separately.

**Hardware.** Proposed single A100 80 GB node for a declared small open model and dictionary that fit, with CPU/RAM, driver, CUDA/PyTorch, kernel fallback and storage revisions logged. If higher-order differentiation or the chosen dictionary exceeds memory, reduce the preregistered candidate set on discovery data or return infeasible; do not drop hard final-test cases. This is an assumed resource envelope, not hardware execution.

**Metrics.** Absolute finite-effect error and signed calibration; top-k ranking agreement only with an exact-effect tie rule; held-out task performance; exact-control deviations; source-grouped confidence intervals; reconstruction variance with denominator checks; joint replacement loss and normalized loss recovery only under Eq.64.18's valid baseline; intervention-transfer error; counterexample rate; peak/transient memory; forward/reverse traversals; all offered failures and complete wall time. Keep logit, log-probability and probability effects separate.

**Baselines.** Exact original-model patching as the finite-effect reference; coarse head/MLP circuit; equally sized/norm-matched random features or directions; first-order attribution; one-step and composed HVP under the same target. An unpruned replacement is a separate diagnostic reference. A cheap probe is compared for predictive utility, not incorrectly declared the same causal estimator.

**Expected result.** Conditional expectation only: a genuine targeted mechanism should outperform nuisance-matched rivals on interventions that distinguish them. Generic disruption, nonidentification or off-support donor effects can produce null, reversed or invalid results. Improved component ranking need not improve a jointly pruned circuit. No direction of empirical improvement is assumed as observed.

**Ablation.** Remove donor matching, residual/error nodes, source-grouped splitting or held-out layer selection one at a time as diagnostic sensitivity analyses, clearly marking the resulting invalid scientific controls. Compare zero and matched nonzero donors. Test joint changes against the sum of individual effects. Include a gate-crossing fixture and a coordinate-transformed probe/intervention pair to expose approximation/mapping mistakes.

**Interpretation.** Proposed acceptance margins are an absolute normalized-score prediction error at most 0.05 and at least 0.02 paired improvement over the strongest admissible rival, with a multiplicity-aware lower confidence bound above zero, plus no failed identity control beyond a separately calibrated numerical tolerance. These are proposed application choices to approve before data, not universal thresholds. If precision cannot resolve the practical margin, return inconclusive; budget exhaustion does not establish success. A counterexample narrows or rejects the mechanism, while a failed control invalidates the experiment before semantic interpretation.

**Threats to validity.** Donor shifts multiple factors; implausible counterfactuals; template overlap; hidden training contamination; probe label/style shortcuts; pruning selection leakage; unsupported original-to-feature intervention mapping; approximate derivatives through frozen operators; nondeterministic kernels; unreported failed cases; correlated patches and researcher-selected examples. A null can reflect low power, a wrong variable or an invalid intervention, so diagnosis must distinguish them.

### Experiment 64.2 - Mechanistic measurement transfer across release and numerical changes.

**Hypothesis.** A frozen interpretation remains decision-useful after a declared checkpoint or numerical change only if its feature/readout, joint replacement and finite-intervention tests meet the same acceptance rule; behavioral parity or high correlation alone is insufficient evidence of transfer.

**Setup.** Freeze an original model, tokenizer, hook, dictionary and optional NLA readout. Establish original-regime controls, then change one release/numerical factor at a time. Maintain exact token-position pairing where possible and explicitly record unmatched tokenizer/site records. Compare frozen-basis transfer, a training-only aligned basis and an independently refitted dictionary as different candidates. A refit never uses final-test labels or effects. If text explanations are evaluated, freeze judge information access and score utility, source support and causal predictions separately.

**Independent variables.** Checkpoint revision; simulated weight quantization versus a separately identified packed-kernel implementation; dtype/kernel path; frozen versus aligned/refitted dictionary; source population; point versus conditional-distribution activation readout when a reproducible artifact is available. Unavailable Flow-NLA code is an unavailable comparator, not an invented implementation.

**Controlled variables.** Inputs and source grouping; tokenizer when compatible; site semantics; donor alignment; task metrics; sparsity/reconstruction target; probe fitting budget; intervention magnitude and norm; evaluator prompts/provider revision; generation limits; training/extraction/inference accounting and final-test acceptance thresholds. Do not conflate coordinate standardization with unit-norm projection or substitute normalized-mean explained variance for raw variance.

**Dataset/workload.** Proposed 500 independent document/task source groups stratified by common behavior, rare target mechanism, benign distractors and compositional counterexamples. All variants use paired records; unmatched/zero-variance features remain in explicit denominators. Source-text labels and unsupported explanation claims receive independent adjudication on a predeclared subset. The distribution is a proposal, not a claim that any existing benchmark supplies these labels.

**Hardware.** Proposed eight H100 80 GB GPUs only if a refit or explainer-training arm is approved and its exact source/environment is available; otherwise a single fitting inference node suffices for a bounded transfer pilot. Record topology, CPU/RAM/storage, precision, distributed layout, second-derivative support, decoder/rollout placement and all collective participants. Energy is unavailable unless metering and its system boundary are actually provided. No equipment was run for this chapter.

**Metrics.** Paired task loss/accuracy; per-feature activation-rate/correlation distribution with undefined counts; scale/offset change; selectivity; aligned-basis uncertainty; reconstruction and joint replacement; exact intervention-transfer error; target improvement and unrelated-task harm; explanation utility, assertion support and parse/failure rates; full data/training/rollout/reward cost and memory; timeout/recovery records. Report source-level uncertainty and native denominators rather than a single universal transfer score.

**Baselines.** Original-regime repeat/identity run; behavior-only regression suite; frozen dictionary; train-only orthogonal/general alignment with stated invariance; equally budgeted refit; simple probe and no-explanation judge control. Quantization simulation and an actual low-bit kernel are separate arms with separate runtime evidence.

**Expected result.** Conditional expectation only: some release changes may preserve behavior but alter a frozen readout, and some apparent feature drift may disappear after a justified coordinate alignment. A richer activation decoder may recover information without improving source support. These possibilities motivate joint testing; none is asserted as a new observation.

**Ablation.** Apply positive affine transformations to a nonconstant synthetic feature trace to show correlation's blindness; change only norm scale or log/MSE reward mode in an available explainer; compare matched and hard-negative explanations with identical judge access; remove activation magnitudes; freeze versus recompute attention paths; invalidate cache keys after changing checkpoint/site/dictionary. Audit all explanations, including truncation and parse failures, in intent-to-evaluate counts.

**Interpretation.** Proposed acceptance requires source-grouped noninferiority margins for target and benign tasks selected before evaluation, exact-control validity, and a finite-intervention error bound of practical relevance. A feature-correlation threshold alone never passes transfer. Retire or refit an interpretation if the required decision fails; retain only a descriptive drift warning if causal correspondence is unresolved. An equally good simpler behavioral monitor reverses the preference when mechanistic analysis adds no held-out decision value at its cost.

**Threats to validity.** Misaligned tokenization, changed hooks, low-bit simulation mistaken for kernels, normalization/dtype confounding, dictionary nonidentifiability, thresholded active-feature survivor bias, judge/provider drift, explanation leakage, correlated tasks, finite refit optimization, hardware differences and missing release artifacts. No interpretation transfers to adversarial populations merely because these finite ordinary tests pass.

## Acceptance criteria

[DERIVED] Artifact acceptance requires all identities and assumptions present, exact controls passing predeclared numerical tolerances, independent final testing, comparable candidate budgets, explicit undefined/failure denominators, source-grouped uncertainty and recorded rejection/reopening outcomes. Scientific acceptance of a particular hypothesis additionally requires its preregistered effect/utility rule, with both positive and negative controls. Editorial compilation and arithmetic checks establish the manuscript's internal integration; they cannot satisfy either proposed empirical hypothesis.

## What this edition did not do

[DERIVED] No model/SAE/CLT/NLA/Flow-NLA training, activation extraction, causal patching on a neural model, GPU profiling, human study or benchmark replication was executed. Official source files were inspected statically. Mathematical fixtures and compiler/schema checks are bounded verification of equations, cases and rendering inputs. The chapter remains `manuscript_draft`; no numerical quality score or safety certification is asserted.

## Topic-completeness audit

[DERIVED] Obligation codes are P problem, F formal contract, M methodology, Q mathematical account, A algorithm, I implementation, C resource accounting, E reported experiment, O observations, S alternatives, L lineage, V validity/failures and R reproducibility. Each section supplies the fixed headings with the corresponding code. Pure conditional identities/counterexamples have no training dataset or hardware performance result; E/O then cover the relevant source method and explicitly do not claim execution of the identity as a model experiment.

| Required concept / variant                     | Owning manuscript anchor and obligations                            | Primary/equation locator                                         | Unresolved gap and consequence                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Correlation, probing, output-only limits       | 64.1 Scope/Formulation/Methodology/Observations; all codes          | Eqs.64.1-64.2; R64.1 §§3.1-3.3                                   | Observational support can underidentify mechanism; no unrestricted semantic claim           |
| Causal intervention/localization               | 64.1 Algorithm/Implementation/Failure modes; all codes              | Algorithm64.1; donor/site/background contract                    | Original-to-feature mapping and off-support donors require experiment                       |
| Activation/residual/attention analysis         | 64.2 Intuition/Implementation; P/F/M/Q/A/I/C/S/V/R                  | Canonical Chapters5/13-18; zero-value attention counterexample   | Pure operator example has no new training experiment; attention map alone not causal effect |
| Directions and similarity                      | 64.2 Formulation/Algorithm/Observations; all codes                  | Eqs.64.4-64.6; R64.1 App.A.2/A.5                                 | Raw versus corrected direction ambiguity; no causal equivalence from geometry               |
| Superposition                                  | 64.2 Formulation/Failure modes; P/F/M/Q/A/I/C/S/V/R                 | Eq.64.7 conditional additive model                               | Model premise not empirically established; no measured interference rate                    |
| SAE/dictionary/L1/top-k                        | 64.3 Formulation/Siblings/Algorithm; P/F/M/Q/A/I/C/S/L/V/R          | Eq.64.8 and scale counterexample                                 | Conditional estimator family, no new training result; donor/basis validity unresolved       |
| JumpReLU and CLT loss                          | 64.3 Methodology/Implementation/Reported experiments; all codes     | Eqs.64.9-64.10; R64.2 App.B; R64.3 CLT.loss                      | Surrogate-gradient runtime unverified; no objective equivalence across reductions           |
| Sparse-reconstruction tradeoff/dead features   | 64.3 Observations/Extensions; all codes                             | R64.2 App.C/D                                                    | Rare-mechanism recall and independent runs not established                                  |
| Feature splitting/missing mechanisms           | 64.3 Mechanism/Failure modes; P/F/M/Q/A/I/C/S/V/R                   | Duplicate-column counterexample; residual contract               | Nonidentifiability persists; no training dataset needed for algebraic counterexample        |
| Explanation collisions                         | 64.3 Mechanism/Observations; all codes                              | Eq.64.12; R64.5 §§3-6/Prop.1                                     | Source counts unresolved; discrimination proposal not executed                              |
| Inclusive allocation/distributed sparse decode | 64.3 Implementation/Algorithm/Reproducibility; all codes            | Eq.64.11; R64.3 **init**/gather/loss/config                      | Paper count/batch mismatch retained; static code is not runtime proof                       |
| Activation, path patching and ablation         | 64.4 Mechanism/Algorithm/Failure modes; all codes                   | Eq.64.13; R64.4 §4.1                                             | Different intervention policies cannot share an unlabeled estimand                          |
| Counterfactuals/off-distribution artifacts     | 64.1 and64.4 Failure modes/Algorithm; P/F/M/Q/A/I/C/E/O/S/V/R       | Donor controls; R64.4 corruption protocols                       | Donor validity and world-causal meaning not identified                                      |
| HVP/MS-HVP/smoothness                          | 64.4 Formulation/Methodology/Reported experiments; all codes        | Eqs.64.14-64.16; R64.4 §§3-4, Table3                             | Estimated constant not certificate; ReLU/gate counterexample; no pinned runtime             |
| Circuit discovery/joint interactions           | 64.4 Observations/Limitations; all codes                            | R64.4 App.E.8; two-site multiplicative example                   | Component gains do not imply circuit completeness/minimality                                |
| Replacement/cross-layer graph                  | 64.5 Formulation/Methodology/Algorithm; all codes                   | Eq.64.17; R64.2 Eq.4; R64.1 App.A.4                              | Frozen attention and nonlinearities restrict explanation                                    |
| Faithfulness and intervention validation       | 64.5 Formulation/Observations/Failure modes; all codes              | Eqs.64.18-64.20; R64.2 §§4-5                                     | Metric normalization incomplete; coverage cannot certify output fidelity                    |
| Debugging/modification/safety signals          | 64.6 Scope/Formulation/Algorithm/Limitations; P/F/M/Q/A/I/C/S/L/V/R | Eq.64.21, Algorithm64.6                                          | Proposed optimization/constraints, not measured steering/safety success                     |
| NLA point readout and reward                   | 64.6 Methodology/Implementation; all codes                          | Eqs.64.22-64.24; R64.6 training/limitations; R64.7 schema/reward | May report vs August code defaults differ; no circuit truth from round trip                 |
| Flow-NLA/distributional alternative            | 64.6 Mechanism/Reported experiments/Observations; all codes         | Eqs.64.25-64.26; R64.8 §§4-5/App.B,E,F,H,I                       | Unreleased code, moving decoder, evaluator/provider confounds, nonuniform utility           |
| Drift/mechanistic generalization failures      | 64.6 Failure modes/Reproducibility; all codes                       | R64.9 §§3-4/Table3; affine-correlation counterexample            | Frozen basis changes do not prove destroyed semantics; transfer unexecuted                  |

## Equation, source and calculator bindings

| Figure | Owning host file / numbered equation | Executed mathematical function                    | Source and validity boundary                                           | Pure fixture                                                      |
| ------ | ------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 64.3   | 64.1 / Eq.64.3                       | z sqrt(p(1-p)/n)                                  | DERIVED:eq-64.3; illustrative Wald half-width, not acceptance interval | p=.8,n=200,z=1.96 gives0.05543717; endpoints expose degeneracy    |
| 64.6   | 64.2 / Eq.64.7                       | coherence times other activity plus residual norm | DERIVED:eq-64.7; unit-column additive premise                          | .1*5+.2=.7; zero coherence retains residual                       |
| 64.9   | 64.3 / Eq.64.11                      | inclusive CLT all-parameter count and bytes       | DERIVED:eq-64.11 from R64.3 allocations; optimizer/buffers excluded    | L16,d2048,K65536 matrices20,401,094,656; all20,403,470,336        |
| 64.12  | 64.4 / Eq.64.16                      | Gamma3 radius cubed/(6q squared)                  | DERIVED:eq-64.16; certified common smooth-path bound needed            | cubic M(t)=t^3, Gamma3=6: q1error1,q5error.04                     |
| 64.15  | 64.5 / Eq.64.20                      | dense b m squared and sparse e(b+2indexbytes)     | DERIVED:eq-64.20; counted adjacency/edge-list boundary only            | m10000,b4 dense400,000,000bytes; e50000,index4 sparse600,000bytes |
| 64.18  | 64.6 / Eq.64.24                      | 2 minus2 conditional mean norm                    | DERIVED:eq-64.24; unit activation and unit point output                | mean0loss2, mean.5loss1, mean1loss0                               |

[DERIVED] Each calculator's formula, displayed TeX, source and equation ID resolve in its own section. Inputs expose their declared analytical ranges; counts use exact number entry when testing integers. The six host equations are part of a sequential 64.1-64.26 equation set; Algorithms64.1-64.6 and Figures64.1-64.20 are independently numbered. No formula output is a measured benchmark.

## Pure mathematical and source-boundary fixtures

[DERIVED] The accompanying authoring audit checks: coordinate readout/intervention transformation; zero-mean directional-probe guard; singular/zero-Gram rejection; coherence bound; decoder scale degeneracy and duplicate-column splitting; inclusive CLT shapes/counts and omitted-encoder difference; constant-Hessian exactness; cubic composed-error q^-2; ReLU crossing invalidity; individual-versus-joint interaction; cancellation defeating weight coverage; zero-denominator handling; NLA unit-mean optimum and distinct symmetric distributions; positive-affine correlation invariance; and all six calculator formulas/defaults/range corners. These are small deterministic analytical checks, not execution of the cited research implementations.

## Evidence and review closure

[DERIVED] The reference ledger records first release, inspected revision, exact method/protocol/code locators and unresolved discrepancies. Scope-local compiler and visual-schema checks must report actual diagnostics and counts before handoff; final global build/browser/static-link checks belong to integration. Neither a clean schema nor arithmetic fixtures remove the recorded empirical gaps. Independent scientific peer review is required before any change from manuscript_draft.
