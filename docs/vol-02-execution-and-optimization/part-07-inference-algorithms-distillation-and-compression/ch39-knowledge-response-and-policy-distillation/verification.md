---
id: "ms.verification.39"
entity_type: "verification"
title: "Chapter 39 verification"
short_title: "Chapter 39 verification"
volume: 2
part: 7
chapter: 39
section: null
slug: "verification"
parent: "ms.chapter.39"
prev_sibling: "ms.section.39.6"
next_sibling: "ms.references.39"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.37", "ms.chapter.38"]
downstream: ["ms.chapter.40", "ms.chapter.41", "ms.chapter.42", "ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "adaptation", "inference"], "mechanism": ["distillation", "distribution_matching"], "feedback_setting": ["ai_feedback", "verifiable_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: ["impl.pytorch", "impl.megatron-lm", "impl.verl", "impl.vllm", "impl.sglang"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1400
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter 39 verification

## Artifact specification

[DERIVED] The artifact is **a teacher–student experiment with transparent information access**. The following schema is a book-authored proposed deliverable, not a claim that its model results exist.

| Record | Required fields |
|---|---|
| `run-manifest` | Experiment ID; immutable teacher/student/tokenizer revisions; architecture; frozen/trainable masks; precision; software/container/driver; source/train/validation/test hashes; stage budgets; seed hierarchy |
| `teacher-access` | Full logits/top-k/text/features; subset owner; original temperature and normalizer; retained submass; tail treatment; layer/width map; target support |
| `alignment` | Prompt/response token IDs; target shift; exact prefix/attention/packing hash; response/rationale/tool/observation masks; loss denominator |
| `attempt-ledger` | Every prompt/candidate; actual behavior distribution/version; generation cap; valid termination/truncation/error; verifier version/outcome; accepted/rejected disposition; cost tag |
| `trajectory-ledger` | Turn owner; guidance draw; environment snapshot; action arguments/authorization/idempotency ID; observations; teacher publishing/adaptation version |
| `training-ledger` | Optimizer/scheduler counters; attempted versus committed updates; nonfinite/empty/rollback state; loss/gate direction; measured teacher/student/cache resource use |
| `selection-ledger` | Candidate search budget; validation rule; every inspected checkpoint; frozen final artifact; proof of untouched final-test isolation |
| `evaluation` | Paired item IDs and baseline/student outcomes; decoding seeds and independent training seeds separately; task/retention metrics; evaluator pins; uncertainty definition |
| `cost-and-serving` | Disjoint stage work; accepted/rejected tokens; teacher adaptation/cache/verifier/search/storage/I/O; hardware/time/energy/money separately; serving workload/concurrency/SLO; quality-gated break-even |

[DERIVED] Derived fields never replace raw evidence. A prefix hash without the corresponding input tokens cannot diagnose a shift error; a single total cost without stage ownership cannot detect double counting; a pooled quality mean cannot expose retention regressions. A model artifact is not complete until its tokenizer, decoding configuration and any fallback/verifier serving path are included.

## Verification task

### Experiment 39.1 — Finite objective and information contracts

**Hypothesis.** [ASSUMED] The implemented loss and derivative match the declared teacher interface, temperature and normalization. **Setup.** Enumerate finite categorical examples with two to five tokens, common and mismatched supports, retained mass zero/partial/one, and temperatures.25/1/4. **Independent variables.** KL direction, hard mixture, teacher/student temperature, subset owner, tail bucket and feature map. **Controlled variables.** Fixed logits, mask and alignment; no sampling-based target changes. **Dataset/workload.** Synthetic finite arrays are analytical inputs, not model benchmarks. **Hardware.** CPU FP64 reference; optional declared-device comparison with a pinned implementation. **Metrics.** Exact loss, analytical/finite-difference gradient, global numerator/denominator and cache identity. **Baselines.** Dense normalized objective and explicit coarse-tail objective. **Expected result.** The appropriate formula agrees within predeclared numerical tolerance; sparse submass can be negative and does not equal renormalized top-k. **Ablation.** Remove tail bucket, change only one temperature, normalize each rank separately and perturb a cache prefix. **Interpretation.** A disagreement rejects the implementation's claimed objective even if training loss decreases. **Threats to validity.** Finite-difference cancellation, deliberate support singularities and precision-dependent floors need separate treatment.

[DERIVED] Include the exact mixed-history, confidence-gate and weighted-expert counterexamples from the manuscript. Check Eq.39.11 against a fully enumerated two-step model to separate local conditional autograd from the complete occupancy derivative. Check the RED linear proxy's nonzero $\dot M$ with zero initial leading spectral slope. These finite checks test mathematics; they do not reproduce a model-training result. Existing shared analytical helper results, if cited, must retain their exact executed scope.

### Experiment 39.2 — Matched-information and matched-budget transfer

**Hypothesis.** [ASSUMED] Any claimed advantage survives a comparison matched on teacher, prompt identities, accepted supervision and evaluation selection. **Setup.** Choose one fully pinned teacher/student pair supported by the available information interface; create disjoint source/train/validation/test manifests before generation. **Independent variables.** Response-only, full-law, original-submass top-k, coarse-tail and feature-augmented supervision; optionally a separate student-prefix versus teacher-prefix factor. **Controlled variables.** Student initialization, optimizer, consumed-token budget, loss masks, target temperature, decoding and evaluator. **Dataset/workload.** An eligible licensed reasoning/code/interaction source with final tests isolated from candidate/filter/checkpoint selection. **Hardware.** A declared fixed accelerator allocation and measured runtime; no hardware choice is represented as already executed. **Metrics.** Paired final quality, retention by task, acceptance, recovery, complete stage work and training-seed dispersion. **Baselines.** Existing student and response-only SFT; full-law teacher access only when actually available. **Expected result.** Direction/target comparisons can differ; no universal ranking is prespecified. **Ablation.** Match accepted tokens, teacher attempts and complete compute in separate arms rather than pretending all three constraints are identical. **Interpretation.** A gain that vanishes under the claimed matched boundary rejects that particular improvement claim. **Threats to validity.** Teacher contamination, varying verifier coverage, changed student capacity, stochastic decoding and unavailable full logits.

[DERIVED] Teacher adaptation, privileged-context transfer and mixed-turn guidance require additional separately budgeted arms; they cannot be added after outcome inspection to rescue the main comparison. Freeze the guidance schedule and teacher publishing interval before evaluation. Treat a failed environment/service call as an incomplete record rather than silently excluding the episode. Student-prefix and teacher-prefix data must preserve the actual rollout law and role masks.

### Experiment 39.3 — Complete-cost serving substitution

**Hypothesis.** [ASSUMED] A quality-valid student has positive per-request savings after generation, verification, teacher fallback and integration are counted. **Setup.** Freeze the selected student and teacher serving artifacts, route the same held-out workload and satisfy identical quality/retention/SLO requirements. **Independent variables.** Workload mix, request count, concurrency and declared cache-reuse horizon. **Controlled variables.** Hardware accounting, precision, output caps, tool/verifier path and metric definitions. **Dataset/workload.** An untouched deployment-representative request manifest with token-length and task distributions. **Hardware.** Explicit measured deployments, including any teacher/verifier services. **Metrics.** Complete one-time cost, p50/p95/p99 latency, task quality, retry/fallback rate and incremental per-request cost. **Baselines.** Direct teacher serving and a student without extra verification/fallback where valid. **Expected result.** Finite amortization occurs only for positive measured saving and a valid substitute. **Ablation.** Include/exclude cache construction only as labeled accounting views, never as two supposedly equivalent complete bills. **Interpretation.** Quality failure returns NOT_A_VALID_SUBSTITUTE; nonpositive saving returns no finite strict cost-saving point. **Threats to validity.** Changing prices, request mix, cache invalidation and hidden external-service cost.

## Acceptance criteria

[DERIVED] Before model evaluation, finite FP64 identities and gradients must agree within an explicit absolute/relative tolerance (proposed $10^{-6}$ away from support singularities). Every mask/target shift and cache identity must match exactly. Loss/count aggregation must agree across declared sharding partitions. Integer controls and bounded procedures must remain finite over all reachable settings. A zero-target batch must leave optimizer/scheduler state unchanged, not merely produce a zero scalar loss.

[DERIVED] A scientific comparison requires complete source/version/split/budget fields, validation-only selection and paired final outcomes. Every attempt and cost stage must be accounted for exactly once. Model-level quality and retention thresholds must be fixed before execution, reported per task and never relaxed using the final test. Numerical cost amortization requires finite nonnegative cost inputs and a positive serving saving; equal costs are reported as equal, not as a strict saving. A missing required field produces an incomplete result instead of an invented default.

## What this edition did not do

[DERIVED] The three model/serving protocols above are proposals. This edition did not generate teacher traces, train or adapt a student/teacher, execute the released loss kernel, run interaction environments, measure deployment costs or independently reproduce any paper benchmark. It inspected primary texts and pinned implementation code, derived finite mathematical contracts and ran manuscript/figure/compiler checks. Those checks cannot certify model performance or a10/10 review score. All nine chapter files remain manuscript_draft.

## Topic-completeness audit

[DERIVED] The closure map below is editorial coverage, not an executed experiment. For every row, the owning section's Scope/Why/Intuition/Formulation/Mechanism/Algorithm/Implementation/Experimental design/Observations/Failure modes/Siblings/Extensions/Limitations/Reproducibility/References provide the applicable13 completeness obligations. Anchor columns locate the specific variant's central treatment; protocol and unknown fields are in that section's later headings. Pure identities have no training dataset of their own, so their empirical obligation is not applicable; source comparisons are treated separately.

| Concept or substantive variant | Manuscript anchors and formal/procedure closure | Primary record and exact locator | Gap and review consequence |
|---|---|---|---|
| Forward KL | [39.1 Formulation](39-1-distillation-objectives.md#formulation), Eqs39.1–2; Algorithm39.1 | R39.2 §2; R39.9 AppendixB Eq13 | Fixed-prefix identity; no universal quality ranking |
| Reverse KL | [39.1 Formulation](39-1-distillation-objectives.md#formulation), support/gradient; [39.4](39-4-policy-and-trajectory-transfer.md#formulation) occupancy | R39.3 AppendixC/D; R39.8 §5.1.2 Eq29 | Local derivative is not full trajectory gradient |
| Shared temperature and tau squared | [39.1 Mechanism](39-1-distillation-objectives.md#mechanism), Eq39.2/calculator | R39.1 §3/code temperature; R39.9 Table6 | High-temperature explanation is asymptotic, not constant-gradient promise |
| Hard-target mixture | [39.1 Formulation](39-1-distillation-objectives.md#formulation), Eq39.1 | R39.9 AppendixB Eqs12–13; original book mixture | Full coefficient implementation for RED NOT-DISCLOSED; no invented source mixture |
| Feature/layer/width alignment | [39.1 Mechanism](39-1-distillation-objectives.md#mechanism), Eq39.3; [39.5](39-5-student-optimization.md#mechanism) | R39.9 AppendicesB–C; R39.1 §4.4 | Book width-normalized loss distinguished from source reduction |
| CaRE soft/hard gates | [39.1 Mechanism](39-1-distillation-objectives.md#mechanism), finite sign counterexample | R39.2 §§2–3,8–9 | Entropy order does not fix FKL−RKL; bounded soft gate remains explicit |
| Revival/rejected optimizer state | [39.1 Implementation](39-1-distillation-objectives.md#implementation), Algorithm39.1 | R39.2 §§2,8,10,13 | Actual all-rejected optimizer transition NOT-DISCLOSED; no freeze claim |
| Full logits and conditional law | [39.2 Scope/Formulation](39-2-information-access.md#formulation) | R39.8 §5.1.2–5.2.2 | Requires complete vocabulary/support identity |
| Original top-k submass | [39.2 Formulation](39-2-information-access.md#formulation), Eq39.4; Algorithm39.2 | R39.1 §3.1–3.2; pinned full_chunked.py | Can be negative; never called normalized full KL |
| Renormalized subset | [39.2 Intuition/Formulation](39-2-information-access.md#intuition), Eq39.4 comparison | R39.1 §3 plus book derivation | Conditional target differs; no omitted-tail reconstruction |
| Tail bucket/coarsening | [39.2 Formulation](39-2-information-access.md#formulation), Eq39.5 | Book exact partition identity; R39.1 subset interface | Empirical obligation not applicable to identity; unobserved tail KL unknown |
| Student-top256 approximation | [39.2 Implementation](39-2-information-access.md#implementation); [39.4](39-4-policy-and-trajectory-transfer.md#mechanism) | R39.6 AppendixA.3/B.2 versus printed Algorithm1 | Tail normalization NOT-DISCLOSED; exact full-KL claim blocked |
| Response-only/black-box transfer | [39.2 Mechanism/Siblings](39-2-information-access.md#mechanism); [39.3](39-3-sequence-and-reasoning-data.md#formulation) | R39.9 AppendixB LM target; book interface derivation | Text does not expose unobserved probabilities/features |
| Cross-tokenizer and feature access | [39.2 Mechanism](39-2-information-access.md#mechanism) | Book event-map derivation; R39.9 feature interface | Exact many-to-many event sums unavailable; no one-token remap equivalence |
| Two-forward/one-backward chunking | [39.2 Algorithm/Implementation](39-2-information-access.md#algorithm), Eq39.6 | R39.1 code SHA38d09ce… full_chunked.forward/backward,loss_common | Read-only code inspection; no executed kernel claim |
| Teacher-hidden cache/head reconstruction | [39.2 Implementation](39-2-information-access.md#implementation); [39.6](39-6-experimental-accounting.md#implementation) | R39.8 §5.2.2 | Isolated overhead/traffic NOT-DISCLOSED; cost not zero |
| Acceptance and bounded rejection | [39.3 Formulation](39-3-sequence-and-reasoning-data.md#formulation), Eq39.7; Algorithm39.3 | R39.7 §3.1; original rejection derivation | Filter precision and full acceptance bill absent; source result not invented |
| Rationale versus answer-only | [39.3 Formulation/Implementation](39-3-sequence-and-reasoning-data.md#formulation) | R39.3 §§3–6; R39.7 §3.1 | Outcome verifier does not establish rationale/process truth |
| Masked error and corrective trace | [39.3 Implementation](39-3-sequence-and-reasoning-data.md#implementation) | R39.7 §3.1 | Private mask/data specifics NOT-DISCLOSED; restricted mechanism disclosure |
| Prefix recovery and finite-zero limit | [39.3 Formulation/Mechanism](39-3-sequence-and-reasoning-data.md#mechanism), Eq39.8 | R39.3 AppendixB/D,Table6; book binomial bound | Zero observed success is not zero support |
| Capacity/conflict diagnostic | [39.3 Mechanism/Observations](39-3-sequence-and-reasoning-data.md#mechanism), Eq39.9 | R39.3 Tables1–2,AppendixA/C | Full-vs-LoRA confound; local logit angles not parameter angles |
| Offline versus student-prefix transfer | [39.4 Formulation](39-4-policy-and-trajectory-transfer.md#formulation), Eqs39.10–11 | R39.4 §§2–3; R39.8 §5.1.2; book chain rule | Detached histories omit occupancy derivative |
| Teacher/student turn mixture | [39.4 Mechanism](39-4-policy-and-trajectory-transfer.md#mechanism), Eq39.12; Algorithm39.4 | R39.5 §3 Eqs4–10;Table4 | Common mixed occupancy; source Eq10 reading qualified |
| Agent tool traces | [39.4 Algorithm/Implementation](39-4-policy-and-trajectory-transfer.md#algorithm) | R39.5 AppendixA.1/A.5; R39.7 §3.1 | Environment/action authorization is book operational contract; no private tools invented |
| SCOUT teacher adaptation and K1 loss | [39.4 Mechanism/Experiments](39-4-policy-and-trajectory-transfer.md#mechanism) | R39.4 §3/§5,AppendixB.2/B.4 | Actual clipped sampled estimator; teacher optimizer/resources counted |
| Privileged-context OPCD | [39.4 Mechanism](39-4-policy-and-trajectory-transfer.md#mechanism); [39.6](39-6-experimental-accounting.md#mechanism) | R39.6 §3,AppendixA.3/B.2 | Response length/top256/test-selection restrictions retained |
| Self-distillation/moving target | [39.4 Extensions](39-4-policy-and-trajectory-transfer.md#extensions) | R39.6 §4.6/Table5 | Negative reported result; uninspected EMA not claimed implemented |
| Cross-stage specialist transfer | [39.4 Mechanism](39-4-policy-and-trajectory-transfer.md#mechanism) | R39.7 §3.5/Eq2 | Exact mixture/budget/component contribution NOT-DISCLOSED |
| Weighted expert RKL/geometric product | [39.4 Mechanism](39-4-policy-and-trajectory-transfer.md#mechanism), Eq39.13 | R39.8 §5.1.2/Eq29; book optimum derivation | Fixed weights/support; production router not reconstructed |
| Scratch/pretrained/inherited students | [39.5 Mechanism/Siblings](39-5-student-optimization.md#mechanism) | R39.9 §§3–6; book experiment taxonomy | No matched total-cost scratch comparison; architecture winner not claimed |
| Activation-aware maps and merge | [39.5 Formulation/Algorithm](39-5-student-optimization.md#formulation), Eqs39.14–15 | R39.9 §5 Eqs9–10,AppendixC/D.8 | Proxy theorem scope; nonzero matrix motion despite zero spectral slope |
| Temperature/initialization interaction | [39.5 Experiments/Observations](39-5-student-optimization.md#experimental-design) | R39.9 Table6;AppendixG.1 | Official/retrained LRC distinguished; sample-count discrepancy unresolved |
| SFT/optional RL/compression retention | [39.5 Mechanism/Extensions](39-5-student-optimization.md#mechanism) | R39.9 AppendixG.5; R39.3 AppendixA; R39.6 Tables1–2 | No universal recovery or zero-forgetting guarantee |
| Trainable versus resident state | [39.5 Implementation](39-5-student-optimization.md#implementation), Eq39.16 | R39.9 AppendixF; book memory boundary | Teacher/activations additional; no complete peak estimate |
| Complete generation/adaptation/cache bill | [39.6 Formulation/Implementation](39-6-experimental-accounting.md#formulation), Eq39.17 | R39.1 §4.1; R39.4 §5/B.4; R39.8 §5.2.2 | Full measured totals absent; no numerical pipeline-cost claim |
| Matched-data/attempt/compute/quality | [39.6 Mechanism](39-6-experimental-accounting.md#mechanism) | R39.4 §5/Figure6; book comparison contracts | Fixed-data control does not test fresh-data counterfactual |
| Checkpoint/filter/test leakage | [39.6 Mechanism/Experiments](39-6-experimental-accounting.md#mechanism) | R39.6 AppendixA.3/B.2 | Selected-test outcomes not untouched estimates; finite toy not a bias correction |
| Paired outcomes and uncertainty | [39.6 Formulation/Mechanism](39-6-experimental-accounting.md#mechanism), Eq39.19 | R39.3 AppendixD/F; R39.4 AppendixB.3 | Training seed and decoding repetitions separated |
| Quality-gated deployment amortization | [39.6 Formulation/Algorithm](39-6-experimental-accounting.md#formulation), Eq39.18 | Book finite-cost identity | Empirical serving inputs absent; conditional calculation only |

[DERIVED] Remaining material gaps prevent editorial_status:reviewed for unsupported production or universal-performance assertions. They do not erase the mathematical and disclosed-method treatment. A reviewer can close a gap only with a relevant primary artifact or a separately executed, fully recorded verification; an attractive plot, an accepted conference label or a successful compiler run is insufficient.
