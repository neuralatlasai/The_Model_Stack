---
id: "ms.verification.33"
entity_type: "verification"
title: "Chapter 33 verification"
short_title: "Chapter 33 verification"
volume: 2
part: 6
chapter: 33
section: null
slug: "verification"
parent: "ms.chapter.33"
prev_sibling: null
next_sibling: null
children: []
prerequisites: ["ms.chapter.2", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32"]
downstream: ["ms.chapter.34", "ms.chapter.35", "ms.chapter.36"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["preference_optimization", "offline_optimization"], "feedback_setting": ["human_preference", "ai_feedback", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.hugging-face-trl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1400
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter 33 verification and completeness record

## Artifact contract

[DERIVED] The plan artifact is **an objective-comparison sheet and controlled preference experiment**. This file specifies the artifact and unexecuted falsifiable checks; it is not a results report. Source-reported experiments remain under each section's Experimental design/Observations. The proposed study cannot inherit the authors' measured outcomes or claim reproduction merely because it uses a similarly named trainer.

| Artifact | Required contents |
|---|---|
| `objective-comparison.csv` | Objective id/equation/version; label unit; score units; coefficient convention; sums/means/NLL masks; required channels; reference and initialization; auxiliary state; operating conditions; source locators; gaps |
| `data-manifest.json` | Raw strings; rendered ids and context; attention/completion masks; terminators; prompt-family split; candidate/label/selection provenance; response counts; exclusions and immutable row digests |
| `scoring-parity.jsonl` | Per-row reference/policy/token/sequence scores; fresh/cache identity; finite losses; selected analytical/autodiff gradients; tolerance and failed cases |
| `run-manifest.json` | Model/tokenizer/template revisions; implementation tag/container/device/driver; numerical policy; optimizer/schedule; finite update/attempt caps; random seeds; checkpoints |
| `resource-ledger.jsonl` | Generation, annotation, reference cache, pilots, fit and evaluation allocations; consumed/valid tokens; discarded groups/rows; memory/communication/timing boundaries; reuse attribution |
| `evaluation.jsonl` | Frozen prompt ids; randomized orientation; predictions; actual labels; independent verifier outcomes; judge/opponent/order; ties, failures and lengths; seed/checkpoint identity |
| `comparison-report.md` | Prespecified contrast; held-out preference fit; calibration; task metrics; seed/prompt uncertainty; all negative results; noncomparability and unresolved disclosure fields |

[DERIVED] Every field has a unit and owner. Absent values are null with NOT-DISCLOSED or UNVERIFIED reason. A known version in another source cannot fill a missing version in a May experiment. CSV/JSON names are proposed outputs; they have not been fabricated for this manuscript.

## Common proposed setup

[ASSUMED] The training study uses one fixed instruction-tuned1Bclass model, one frozen reference copy, complete chat rendering and completion-only scoring including the declared terminator. The exact checkpoint/license/tokenizer hashes must be resolved before execution. A proposed four-A10080GBallocation provides a common resource boundary; availability, compatibility and actual memory fit are UNVERIFIED. BF16 forward/backward with FP32 declared reductions/optimizer state is the proposed policy, subject to a retained parity gate. No installed kernel or driver support is assumed from a package name.

[ASSUMED] Construct a prompt-family-grouped dataset with paired responses, independent criterion labels, repeated directional labels, strength categories and optional numerical ratings. Hold60%families for training,20%for development and20%for final test; split development equally into model selection and probability calibration. Resolve the corpus and annotation provenance before training. Older workload artifacts may be used only as named workload inputs, without admitting their old founding papers as scientific evidence for this edition. All related candidate rows, paraphrases and user/template families remain in one partition.

[ASSUMED] Use six declared training seeds per training arm, the same finite data order per matched seed, and a common150successful-update initial comparison with batch128valid pairs where applicable. Log every attempt and exclusion. An equal-total-device-time extension has a separately preregistered budget and may use different update counts. Hyperparameter search receives a fixed equal resource allotment and development outcomes only. No final test metric is used to choose a coefficient, seed, checkpoint or early-stop rule.

[DERIVED] These are proposed controls rather than source facts or universal recommended hyperparameters. A method requiring extra information receives a separately identified full-information arm; it cannot claim a common-information objective effect simply because the additional channel shares row ids. Actual resource feasibility is checked before any model-quality claim.

## Proposed falsification protocols

### Experiment 33.1 — Finite-support derivation and identification

| Field | Proposed protocol |
|---|---|
| Hypothesis | The declared finite-support Gibbs identity and same-prompt cancellation hold; unsupported extensions fail admission. |
| Setup | Enumerate positive reference distributions on three and five responses; bounded utilities and positive beta; compute normalized optimum and identity. |
| Independent variables | Reference mass, utility offsets/gaps, beta, restricted model family, hard-zero support and nonintegrable countable counterexample. |
| Controlled variables | Response set, utility units and exact conditioning prompt. |
| Dataset/workload | Analytical finite cases, including Eq33.25displacement and disconnected comparison components. |
| Hardware | CPU float64reference arithmetic; arbitrary-precision spot checks if required. |
| Metrics | Normalization residual, variational identity residual, KL nonnegativity, likelihood equivalence, unsupported-case rejection. |
| Baselines | Direct constrained probability optimization; closed-form optimum; deliberately wrong beta/noise-unit convention. |
| Expected result | Valid finite cases agree; invalid partitions/support and different-history cancellations are rejected. |
| Ablation | Remove normalization, compare different prompts, or enforce a nonrealizable policy family. |
| Interpretation | Identity success establishes only the mathematical contract, not neural convergence or task utility. |
| Threats to validity | Numerical optimization error and near-zero probabilities can obscure exact identities; report conditioning. |

### Experiment 33.2 — Token-score, reference and cache parity

| Field | Proposed protocol |
|---|---|
| Hypothesis | Fresh and cached scores agree only for identical reference and full event identities. |
| Setup | Transparent shifted-logsoftmax reference versus selected tagged trainer path on identical rendered ids/context/masks. |
| Independent variables | EOS, assistant boundary, multi-turn masking, padding, sum/mean, empty suffix, truncation, reference revision and row-index reuse. |
| Controlled variables | Raw strings, full conditioning context, policy weights, evaluation mode and numerical policy. |
| Dataset/workload | Short/long analytical token streams and fixed real text pairs; include NaNs in masked positions as explicit negative control. |
| Hardware | CPUreference plus common proposedGPUallocation; record installed versions before execution. |
| Metrics | Per-token/per-branch scores, counts, loss/gradient parity, cache misses/rejections, reference bytes and build time. |
| Baselines | Fresh immutable-reference scores; correct cache; deliberately stale or index-only cache. |
| Expected result | Valid paths meet declared tolerance; changed ids/context/mask/reference cannot reuse an incompatible row. |
| Ablation | Disable full row digest, alter template, unfreeze adapter-shared base, or omit denominator weighting. |
| Interpretation | Passing establishes tested arithmetic/cache cases only; it does not establish general framework compatibility. |
| Threats to validity | Stochastic kernels, dropout, quantization and reduction order require their own numerical contract. |

### Experiment 33.3 — Objective-specific loss and gradient closure

| Field | Proposed protocol |
|---|---|
| Hypothesis | Each canonical family matches its own equation and rejects another family's feedback/normalization substitutes. |
| Setup | Finite synthetic scores with analytical gradients; separate paired and unpaired observation manifests. |
| Independent variables | IPO target/overshoot; KTO baseline/class weights; ORPO odds/NLL mask; rating availability/variance; block count/weights; mean-score margin. |
| Controlled variables | Token ids/counts, score values, coefficient units, label orientation and stop-gradient convention. |
| Dataset/workload | Explicit examples for Eqs33.11–18; choose positive unequal response counts and probabilities strictly inside support. |
| Hardware | CPUfloat64/autodiffreference; selectedGPUimplementation parity only after pins resolve. |
| Metrics | Per-row loss, derivatives, stationary point, saturation, detached-state audit and required-forward count. |
| Baselines | Transparent mathematical loss; intentionally substituted response sums/means, plus/minus rating offset and whole/block log-sigmoid. |
| Expected result | Correct paths agree; deliberate substitutions are detected as different objectives. |
| Ablation | Differentiate through KTO baseline; replace missing rating by zero; compute ORPOcomplement via rounded probability; divide blocks by variable count. |
| Interpretation | Agreement proves objective implementation for tested cases; no quality ranking follows. |
| Threats to validity | Near-unit odds and large margins need stable reference calculations; finite differences can be misleading at clipping boundaries. |

[DERIVED] Method-specific assertions are mandatory: IPO derivative changes sign at its normalized target; KTO gradients exclude the detached statistic and expose missing-class behavior; ORPO tests separate odds and NLL masks and rejects $a\ge0$; RDPO subtracts its rating offset; ML rating channels use separate observed-row denominators; ADPO's two-zero-block loss is twice one-zero-whole-event loss. A generic sigmoid check cannot substitute for these distinct assertions.

### Experiment 33.4 — Candidate refresh, selection and full cost

| Field | Proposed protocol |
|---|---|
| Hypothesis | Data selection and reference/initialization changes are detectable independently of objective choice. |
| Setup | First simulate iidBernoulli groups with known p; then compare fixed versus refreshed real candidates under frozen verifier and prompt split. |
| Independent variables | Group size, success distribution, correlated duplicates, warm-up duration, fresh/continued initialization, fixed/moving reference and old-row mixture weights. |
| Controlled variables | Prompt families, verifier, decoding caps, selection rule and total accounting boundary. |
| Dataset/workload | Synthetic groups for exact Eq33.20; resolved reasoning workload for training extension. |
| Hardware | CPUsimulation; common proposedGPUallocation for generation/training with full reservation ledger. |
| Metrics | Pairability, all-success/failure/partial groups, selected prompt marginal, coverage graph, consumed tokens, all phase costs and independent task outcomes. |
| Baselines | Fixed K0dataset; matched retained-pair count; unchanged initialization/reference; deliberately omitted selection propensity. |
| Expected result | iidcase follows the binomial contract; correlations break it; no discarded generation disappears from cost. |
| Ablation | Retain all groups versus mixed-only; resample candidates without relabeling; change judge/reference separately. |
| Interpretation | Better task outcome under refresh supports that recipe's data-process effect, not universal on-policy equivalence. |
| Threats to validity | Verifier error, decoding truncation, unknown propensities and adaptive prompt selection limit transport claims. |

### Experiment 33.5 — Noise, length and prompt-scale identification

| Field | Proposed protocol |
|---|---|
| Hypothesis | Relative likelihood, length convention, corruption correction and scale identification behave as distinct mechanisms. |
| Setup | Analytical displacement path; repeated labels with declared injected noise; controlled response-length pairs; finite tree/cycle comparison graphs. |
| Independent variables | Beta, symmetric/asymmetric corruption, sum/mean, chosen-quality threshold, margin strength, AO/WR, unit/frozen learned scale and scale provenance. |
| Controlled variables | Underlying candidates/task, reference, label process before injection, folds, score units and training budget. |
| Dataset/workload | Eq33.25path; repeated-annotation panel; same-pair distinct-margin and nonzero-cycle cases. |
| Hardware | CPUgraph/gradientchecks; common proposedGPUallocation for scale/policy extension. |
| Metrics | Chosen/rejected likelihood, label log loss, task correctness, scale recovery where identified, centering/bounds, pilot and scale costs. |
| Baselines | DPO, smoothing, known-noise correction, constant-scale margin, AO, WR and length-normalized WR. |
| Expected result | One-edge free scales remain nonidentified; valid cycle conditions identify modeled scale; fitting spread alone does not establish true noise. |
| Ablation | Recenter test prompts, train pilot on held-out prompt, input strength into nominal prompt-only head, or refit scale while claiming only length changed. |
| Interpretation | Failure narrows the assumptions; a task gain without true-scale recovery cannot be described as latent-noise identification. |
| Threats to validity | Injected noise is not real annotation corruption; restricted neural classes differ from unrestricted finite graph assumptions. |

### Experiment 33.6 — Matched preference, calibration and task comparison

| Field | Proposed protocol |
|---|---|
| Hypothesis | Objective effects can be distinguished from added information and compute, and preference fit need not track task utility. |
| Setup | Common proposedsetup with untouched initialization, chosen-SFT and complete family arms; separate common-information/full-method and equal-data/equal-compute contrasts. |
| Independent variables | Objective, beta/own-coefficient grids, noise level, response-length distribution and total budget. |
| Controlled variables | Prompt splits, candidates/labels where applicable, model/reference/template, optimizer numerical policy, decoding and evaluator. |
| Dataset/workload | Resolved held-out preferences plus independent task-verifier prompts; calibration partition separate from model selection/test. |
| Hardware | Common proposedfour-A10080GBallocation; exact kernels/container resolved before study; all auxiliary devices counted. |
| Metrics | Pair ranking/NLL, Brier score, probability reliability counts, chosen likelihood, pass@1, tie-adjusted wins, lengths, memory/device-hours and failed runs. |
| Baselines | Untouched model, chosen-response SFT, sum-DPO, each canonical family with its actual feedback contract. |
| Expected result | No ranking is presupposed; all outcomes and noncomparability are reported, including better fit with worse task results. |
| Ablation | Remove reference/ratings/pilots only as distinct interventions; swap NLL masks; omit preparation cost; select best seed as explicit invalid-report control. |
| Interpretation | Primary contrast uses preregistered task metric and independent seeds; prompt intervals remain conditional where appropriate. |
| Threats to validity | Judge dependence, multiple tuning, leakage, seed shortage, length adjustment and incomplete verifier coverage restrict claims. |

## Acceptance and reporting

[ASSUMED] CPUfloat64identity/gradient checks use absolute1e-10plus relative1e-8where well conditioned. Proposed FP32 scoring parity starts at absolute1e-6plus relative1e-5; BF16/kernel comparisons require a separately justified bound before viewing treatment outcomes. These are engineering gates for specified cases, not universal tolerances. Near-zero support/near-unit odds must be checked with a stable higher-precision reference and explicitly classified rather than relaxed until passing.

[DERIVED] Categorical gates are exact: no empty denominator used; no rejected row scored; no incompatible cache hit; no mixed reference identity; no missing rating represented as an observed zero; no silently manufactured local annotation; no omitted failed run; no normalization or uncertainty unit mislabeled. All finite algorithms terminate or emit a failure record within declared attempt/time/update caps. A failed gate blocks interpreting its model-quality result.

[DERIVED] A comparative quality conclusion needs a prespecified task estimand, retained seed-level outcomes and appropriate paired uncertainty. Report preference fit/calibration/task metrics together without demanding that all improve. Do not impose a fabricated score target or call an externally unreviewed manuscript10/10. Total compute conclusions require complete compatible resource units; unresolved source cost contradictions remain unresolved, not averaged into a new number.

## Topic-completeness audit

[DERIVED] **A–M obligations** refer to CONTENT_CONTRACT §4.1: A problem/boundary, B formal/mathematical conditions, C full methodology, D bounded procedure, E implementation/resources, F actual source protocol, G four-layer outcomes, H failures/detection, I alternatives, J documented successors, K validity, L reproducibility, M closure/gaps. Every row below maps those obligations to its owning section's exact H2 headings; the columns give the concept-specific center, execution/resource anchor, actual-source locator and limiting condition. Derived identities have no empirical dataset requirement; their source experiment cell explicitly separates source context from the unexecuted check. NOT-DISCLOSED does not waive mathematical or methodological treatment.

| Concept / substantive variant | Mechanism and math (A–C) | Procedure / execution / resources (D–E) | Actual protocol / outcomes / alternatives (F–J) | Validity / reproducibility / closure (K–M) |
|---|---|---|---|---|
| KL-regularized optimum | [33.1 Formulation](33-1-dpo-derivation.md#formulation), Eqs33.1–2; finiteZ/absolute continuity | [Algorithm33.1](33-1-dpo-derivation.md#algorithm); paired forward/reference boundary | R33.1§2; §6/Fis empirical context, not proof;33.1Observations |33.1Limitations/Reproducibility; known reward differs from empirical fit |
| Reward-policy reparameterization |33.1Mechanism/Eq33.2; common prompt and reward units |33.1Algorithm/Implementation; frozen reference | R33.1§2; R33.2Appendix B; source-context caveat | Realizability and optimizer gap explicit; Experiment33.1unexecuted |
| Binary likelihood and additive gauge |33.1Mechanism/Eqs33.3–4 |33.1Algorithm; valid-pair denominator | R33.1§2;33.1Siblings/Observations | Offsets/missing responses unidentifiable; no absolute-quality inference |
| Separability / neural approximation |33.1Mechanism; unbounded empirical margin versus finite reward optimum |33.1Algorithm finitecaps/failedbatch | No empirical universal-convergence assertion; R33.1Assumption4.2 |33.1Failure modes/Limitations; not a convergence guarantee |
| Reference choice and beta units | [33.2 Mechanism](33-2-reference-policy-effects.md#mechanism), Eq33.7 |33.2Algorithm; reference identity and residency | R33.6loss branches;33.2source-code protocol |33.2Limitations; no universal bestreference |
| Support mismatch / hard zeros |33.2Mechanism; absolute continuity and epsilon objective change |33.2Algorithm rejectedrow skip | R33.1Assumptions4.1–4.2; mathematical admission context |33.2Failure modes/Limitations; softmax positivity≠effectivecoverage |
| Shifted completion log probabilities |33.2Formulation/Eq33.6 |33.2Algorithm/Implementation; logits,BTVandcountreduction | R33.6`compute_ref_log_probs`1132–1169 | Jointtokenization/EOS/NaNmask/emptyresponse audited; Experiment33.2 |
| Numerical softplus / logsumexp |33.2Mechanism/Eq33.8 |33.2Implementation; accumulation/parity boundary | R33.6`_compute_loss`; no measured kernel gain | Finiteinputs and overflowconditions; no installedrunclaim |
| Sequence sums versus response means |33.2Mechanism/Eq33.9 |33.2Algorithm counts/cachegranularity | R33.6IPO branch; R33.3Appendix E.4 | Variablelengths changeobjective; cannotreuse onecoefficient |
| Reference cache / adapter ownership |33.2Mechanism; fullrendereddigest |33.2Algorithm/Eq33.10; rowdigest pluscontract | R33.6cache and reference paths |33.2Reproducibility; unfreezingbase invalidatesanchor |
| IPO normalized finite target | [33.3 IPO methodology](33-3-objective-families.md#mechanism), Eq33.11 | Algorithm33.3; pairedscores/counts and squaregradient | R33.6IPO branch; R33.4Appendix Alossnegative | Own target/normalization; no generalempiricalranking |
| IPO sequence-sum variant |33.3IPO methodology; alternativecountcontract |33.3Algorithm namednormalization | R33.6pins mean; sum is explicitderivedvariant | Variablelengthnonequivalence; no unsupportedhistorical claim |
| KTO unpaired utilities |33.3KTO methodology/Eq33.12; classweights/gradienttails | Algorithm33.3; extra mismatchforwards | R33.7`_compute_loss`1388–1492; no matched2026benchmark | Saturation/imbalance/missingcounterfactual; exactownfeedback |
| KTO detached baseline |33.3KTO methodology; dataexpectation≠policyKL |33.3Algorithm; mismatchpermutation/gathercost | R33.7`_compute_kl_logps`1206–1254 | Stopgradient/countweighting/oneclass recorded |
| ORPO odds objective |33.3ORPO methodology/Eq33.13 | Algorithm33.3; pairedpolicy,NLL,memory | R33.8`odds_ratio_loss`606–634 | Geometricmean≠sequenceprobdistribution; ownlambdaunits |
| ORPO complement stability |33.3Eq33.14; domaina<0 |33.3Algorithm failnonfinite; stablelog1mexp | R33.8helper use; actualsourceprotocolnot benchmark | Exactunitprobability rejected; no silentclipping |
| ORPO chosen NLL mask |33.3Formulation/Implementation; independentNLLreduction | Algorithm33.3; chosentokenweightedNLL | R33.8`concatenated_forward`702–741 | Decoderfullprompt+response tagconvention; response-onlydifferent |
| RDPO rating-offset objective |33.3Rating methodology/Eq33.15 | Algorithm33.3; perpairgap/provenance | R33.1§3.1,§6/F; trustnontransfer | Subtractedoffset;missinggapsnotzero; coefficientchange |
| RIPO rating finite target |33.3Eq33.15 and IPOderivative mechanism | Algorithm33.3; pairedgap/square | R33.1§3.1/Fsmallmodelbranch | Ownscaledtarget; no substitutedIPOevidence |
| ML rating joint likelihood |33.3Rating methodology/Eq33.15Gaussian derivation | Algorithm33.3; separaterowsets/weights | R33.1§3.2/B.2;§6/Fpartialratings | Conditionalindependence/fixedV;judgecorrelation andmissingness |
| Rating statistical guarantees |33.3Mechanism plus33.1assumptions |33.3Limitations; restrictedclass/error-tunedtrust | R33.1Theorems4.3–4.4/C.2–C.4 | Effectivebeta changes; no universalneuraloptimizer rate |
| Mean-score reference-free / SimPO |33.3Eq33.16; scoreunits andsofttarget | Algorithm33.3; norefforward,pairedpolicy | R33.3Appendix E.2Table5; §5selectedcomparison | No sequenceKLinterpretation; noprewindowpriorityclaim |
| ADPO block feedback |33.3Block methodology/Eq33.17 | Algorithm33.3; blockreduction andfullhistory | R33.2§§3–6/Appendices A–C/E; partitionnegative | Productevents≠wholeevent; localnormalizers caveat |
| Static versus adaptive partition |33.3Block methodology; m≤nstrongcomposition |33.3Reproducibility; count/paddingpolicy | R33.2§5/Appendix C/Table3 | Shortresponse/paddingimplementationgap explicit |
| cADPO token-weighted rejection |33.3Block methodology; weight1-s | Algorithm33.3; auxiliarypreparation cost | R33.2§6.1/Eimplementationdetails | Externalweight provenance/gradientpolicy needed; no freecost |
| Fixed offline pair measure | [33.4 Formulation](33-4-offline-versus-online-data.md#formulation), Eq33.19 | Algorithm33.4; immutablemeasure/version | R33.4§2;33.4actualprotocol | Promptfamily leakage/measuremismatch explicit |
| Resampling / iterative labeling |33.4Mechanism; separateC,A,q,startinterventions | Algorithm33.4boundedround/token/deadlines | R33.4pipeline as boundedsourceexample; genericderivedround | No on-policygradientclaim; no uninspectedmergingsuccessor |
| Pairability / selection shift |33.4Eqs33.20–21andbinomialproof | Algorithm33.4; discardedgeneration ledger | R33.4§2.2/Appendix A; sourceprotocoltable | iidassumption;binaryentropy not tokencalibration |
| Stale support / graph components |33.4Mechanism; utilityoffsetspercomponent | Algorithm33.4provenance; coverageinventory | R33.1coverage assumptions; R33.4conditionalstudy | Softmaxsupport≠evidence; no extrapolation guarantee |
| Importance transport / ESS |33.4Eqs33.22–23; continuity/integrability |33.4Implementation; actualsamplingprobabilities | Derivedidentity, no experiment implied; sourcecontextR33.4 | Unknownselection/annotationpropensities block exactweights |
| Chosen likelihood displacement | [33.5 Formulation](33-5-bias-and-pathology.md#formulation), Eq33.25 |33.5Algorithm branchscoreaudit | Analyticalcounterexample; R33.3actualprotocolseparate | No fabricatedtrajectory; tasktruth independent |
| Length and absolute candidate quality |33.5Mechanism/Eq33.26 |33.5Implementation exclusions/counts | R33.3Appendix E.4; R33.2Table11 | Meanunits changeobjective; annotationcomparativeonly |
| Symmetric noise correction |33.5Eq33.27/derivation |33.5boundedfailureaudit; robustbranch | R33.6robust loss; no assumedrealnoiseestimate | epsilon<0.5,knownsymmetry; negativecorrectedlosspossible |
| Smoothing / fixed margins |33.5Mechanism; convex target versus correction |33.5Algorithm explicitcontract | R33.6smoothingbranch; R33.3fixedmarginprotocol | Targetsnotdenoising; strengthnotautomaticreliability |
| UNM AO |33.5Eq33.28; thresholdcs | Algorithm33.5; frozenpromptscale | R33.3§3.1/§5/E; actualprotocoltable | Differentrawthreshold; not ordinalcategorylikelihood |
| UNM WR |33.5Eq33.28; thresholdc/slope1/s | Algorithm33.5; pilot/scale/finalcost | R33.3§3.1/§5/E; AO/WRorderingnegative | Fixedrawmarginunits; samecommon scale perprompt |
| Frozen pooled scale estimator |33.5Eq33.29; rowvsuniqueprompt denominators | Algorithm33.5; fold/provenance/features | R33.3§3.2/E.3/E.5; differing8Bscales | PilotOOF≠scaleOOF; boundedcentering≠noiseidentification |
| WR cycle identification |33.5Eq33.30fullconverse/proof |33.5Algorithm graphaudit; CPUproposal33.5 | R33.3Theorem4.1/Appendix B.3 | Exactmodeledlogitsnotlabels; freeone-edge scaleunidentified |
| Length-normalized WR |33.5Mechanism; betaLN=L0beta0condition | Algorithm33.5; rescoring/refitcost | R33.3§3.3/E.4/F; sourcepaneloutcomes | EqualonlyatbothlengthL0; simultaneousrefitconfound |
| Overoptimization / proxy-task gap |33.5Failure modes;33.6metrics |33.5branch/taskaudit;33.6recordadmission | R33.1–4boundedstudyoutcomes | No universalproxy-success implication; verifier/judgegaps |
| SFT and matched information | [33.6 Mechanism](33-6-controlled-comparison.md#mechanism) | Algorithm33.6; untouched/chosenSFTschema | R33.1–4protocolboundaryaudit | Extra supervisionisintervention; initializationsfixed |
| Equal compute / complete cost |33.6Eq33.32 | Algorithm33.6phaseinventory | R33.3Epilotcost; R33.4costcontradiction | Deviceunitscompatible; reusedcost reported separately |
| Training seeds / prompt intervals |33.6Eq33.33 | Algorithm33.6seed/checkpointinventory | R33.1Ferrorbars; R33.3§5/Ebootstrap | ConditionalCIs≠trainingvariance; selectionretained |
| Held-out preferences / calibration |33.6Eq33.34; randomizedorientation | Algorithm33.6split/metricadmission | R33.1–4fit/outcomesnotcalibrationproof | Surrogate≠rawprobability; separatecalibration/test |
| Independent task metrics |33.6Eq33.35 | Algorithm33.6verifier/judge/decodingfields | R33.2mathprotocol; R33.4greedypass1; R33.3judgepanels | Distinctevents/lengthunits; no crosspaperleague table |

## Evidence gaps and review consequences

| Gap | Inspected boundary | Consequence |
|---|---|---|
| Old founding papers excluded | Originating dates outside active window | Foundations reconstructed; historical priority/performance not claimed |
| Foundation KTO/ORPO benchmark absent | Tagged2026code provides conventions, not matched quality results | No empirical ranking assigned; dedicated protocol proposed |
| RDPO guarantee assumptions / tuning | Theorems4.3–4.4, finiteclass/coverage/error tuning and effectivecoefficient | Conditional statistical claim only; no neural walltime/convergence claim |
| ADPO local feedback semantics | v1Appendix A/B/C and static/adaptive composition | Explicit surrogate; no generic different-historypartition cancellation |
| ADPO precision / repetition unit | §6/Appendix Efull inspected account | NOT-DISCLOSED; H100hardware corrected from later appendixdetails |
| G2D end-to-end cost / table inconsistency | §4GPUhours versus abstract; Appendix B | No numerical speedup derived; retain disclosed tuning limits |
| UNM scale identification / provenance | §3/Theorem4.1/E.3–E.5 | Fittedrelative scale; no perpromptlatentnoise claim; no isolated8BAO/WR effect |
| UNM auxiliary budget / uncertainty | Appendix E; fivepilots, conditionalpromptbootstrap | Finalupdate equality nottotalcost equality; no seedrobustness assertion |
| Installed implementation / kernels | Only tagged source inspected | UNVERIFIED; no compatibility or executed parity claim |
| Proposed experiments unexecuted | This verification specification | No empirical result, replication or externalreviewscore asserted |

## Edition closure

[DERIVED] All six canonical sections and every plan concept are represented, with36scientifically motivated native figures and six adjustable analytical calculators. Figure defaults, formulas, legal count controls and in-memory manuscript schema are editorial checks, not trained-model experiments. Source chronology and typed records are in references.md. The draft remains **manuscript_draft** while scientific replication and identified disclosure gaps remain outside this edition's evidence boundary.
