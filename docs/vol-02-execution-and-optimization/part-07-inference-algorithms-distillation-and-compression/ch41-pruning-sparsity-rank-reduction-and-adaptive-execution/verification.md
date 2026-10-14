---
id: "ms.verification.41"
entity_type: "verification"
title: "Chapter 41 verification"
volume: 2
part: 7
chapter: 41
section: null
slug: "verification"
parent: "ms.chapter.41"
prev_sibling: "ms.section.41.6"
next_sibling: "ms.references.41"
children: []
prerequisites: ["ms.chapter.13","ms.chapter.14","ms.chapter.15","ms.chapter.16","ms.chapter.17","ms.chapter.25","ms.chapter.26","ms.chapter.27","ms.chapter.28","ms.chapter.39","ms.chapter.40"]
downstream: ["ms.chapter.42","ms.chapter.43","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference","adaptation"],"mechanism":["pruning","sparsity","adaptive_computation"],"feedback_setting":[],"modality":["text","image"]}
papers: []
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.nvidia-cutlass","impl.nvidia-cuda"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED", "ASSUMED"],"empirically_observed":false}
word_count_target: 2500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# Chapter 41 verification

## Artifact specification

[DERIVED] The chapter artifact is an **executable compression comparison**. The manuscript specifies it; this edition has not created or executed its numerical artifacts. A future implementation retains the following files, each with a schema version and immutable identifier.

| Artifact record | Required fields |
|---|---|
| parent-manifest | Model/checkpoint hash, tokenizer/template revision, license, configuration, original tensor names/shapes/dtypes, tied-weight map, parent preservation location |
| transform-manifest | Method and exact commit, support family/axis, tensors included/excluded, retained coordinate maps, factor ranks, router changes, seed, damping, ordering, export format, measured file bytes |
| calibration-ledger | Dataset snapshot, source/split, document hashes, domain/language counts, tokenizer, sequence distribution, padding/target masks, consumed tokens, calibration-input producer, target producer, exclusion of evaluation data |
| recovery-ledger | Teacher correction and student recovery separately: data, consumed target tokens, optimizer/schedule, mask/factor constraints, frozen parameters, teacher information access, layer maps, checkpoints and validation-selection rule |
| numerical-record | Dense reference, masked dense, packed/extracted outputs, cases and dtype/accumulation, absolute/relative errors, reconstruction round trip, group-pattern validity, solve residuals, failed cases |
| runtime-record | GPU/CPU identifiers, driver/toolkit, runtime/compiler/kernel commits, descriptor shapes/layouts, actual kernel names, fallback/densification counts, workspace, tensor-parallel placement, cache/state policy |
| quality-record | Task/version/split, metric definition, dense/unrecovered/recovered scores, uncertainty, long-context/domain strata, contamination audit, evaluator independence, accepted-task rule |
| measurement-samples | Randomized run order, warmup, request input/output sizes, concurrency/arrival process, synchronization, client/server boundary, latency samples and quantiles, tokens/s/GPU, memory components, failures |
| energy-cost-record | Power sampling source/rate, device versus host boundary, integrated joules, construction and deployment separately, idle baseline, attribution window, currency assumptions, accepted-task denominator, break-even horizon |
| decision-record | Claimed benefit, quality constraint, confidence interval, unsupported configurations, rejected candidate reason, rollback parent and reproducibility gaps |

[DERIVED] Every performance comparison must be recoverable from these raw records. Report both logical dense-equivalent FLOPs and executed sparse arithmetic where available; report numerical density, physical bytes, and actual dispatch separately. A successful output check with fallback is a valid result whose execution category is dense.

## Verification task

[DERIVED] The book-plan task asks whether reduced operations translate into wall-clock and energy gains while reporting quality loss and kernel support. The protocol below tests that claim at three boundaries: tensor correctness, model quality/resource trade-offs, and adaptive-state validity. It makes no claim that a winning configuration already exists.

### Experiment 41.1 — Representation, pattern, and dispatch consistency

**Hypothesis.** [ASSUMED] A valid packed sparse or extracted dense operator reproduces the declared compressed mathematical operator within a dtype-specific tolerance and actually executes its named path.

**Setup.** [ASSUMED] Choose a small set of aligned and deliberately misaligned matrices, each with dense, zeroed-dense, encoded sparse, and extracted/factorized references as applicable. Include all-zero groups, repeated values/ties, rank-deficient moments, extreme representable values, transposed operands, and contraction-axis changes.

**Independent variables.** [ASSUMED] Support family, group/block dimensions, density, factor rank, matrix shape, dtype, layout, and operator backend.

**Controlled variables.** [ASSUMED] Identical mathematical weights/inputs, accumulator settings where supported, host/device residency, warmup, synchronization, and output comparison boundary.

**Dataset/workload.** [ASSUMED] Deterministic analytical matrices with retained seeds and independent randomly generated cases; no task training or benchmark contamination claim.

**Hardware.** [ASSUMED] Record the actual available device and its documented supported operators. Unsupported cases are retained as explicit failures/fallbacks; no device support is presumed.

**Metrics.** [ASSUMED] Encoded bytes including indices/scales/padding, support validity, round-trip equality, maximum absolute/relative output error, solve residuals, actual kernel dispatch, workspace, and fallback count.

**Baselines.** [ASSUMED] Full dense parent, dense tensor with the same zeros, and dense reference evaluation of the extracted/factorized operator.

**Expected result.** [ASSUMED] Pattern-valid supported cases agree numerically with their compressed reference. A masked dense baseline retains dense dispatch. Deliberately invalid patterns must be rejected or recorded as fallback. These are acceptance expectations, not observed results.

**Ablation.** [ASSUMED] Remove or corrupt positional metadata; change contraction axis; disable conversion; rematerialize factors. These controls should expose representation/dispatch distinctions.

**Interpretation.** [DERIVED] Invalid compressed-reference outputs reject correctness. Dense fallback rejects an executable-sparsity claim but can remain a correct numerical result.

**Threats to validity.** [DERIVED] An operator check does not establish full-model quality or request performance; library-specific packing and tolerance differences require separate reference contracts.

### Experiment 41.2 — Matched quality, time, energy, and amortization

**Hypothesis.** [ASSUMED] At least one supported compression candidate lowers measured E2E resource cost while satisfying a prespecified held-out quality bound; this is a testable conditional claim, not an expectation of universal benefit.

**Setup.** [ASSUMED] Select one licensed open parent checkpoint and pin its exact model/tokenizer revisions before transformation. Compare magnitude, activation-aware and reconstruction-based selection within the same pattern, plus a structurally smaller dense and a low-rank candidate. Separate unrecovered and recovered versions. Use three independent calibration seeds and prespecified recovery-token budgets; retain original-parent and parent-continued-training controls.

**Independent variables.** [ASSUMED] Selection criterion, support/structural family, retained budget, recovery objective/budget, quantization order, and kernel path.

**Controlled variables.** [ASSUMED] Parent/tokenizer/template, evaluation tasks/splits, prompt/output distributions, hardware, precision, backend revision, concurrency, arrival trace, cache state, and generation settings.

**Dataset/workload.** [ASSUMED] Use independently held-out general, code, math and long-context strata with no calibration/recovery overlap. Freeze examples and task acceptance rules before examining candidate scores. Evaluate both fixed-output workloads and natural stopping; their timing questions differ.

**Hardware.** [ASSUMED] Use one recorded supported accelerator configuration for direct comparisons; treat a changed device count/topology as a separately labeled deployment comparison. Record total device and host power boundaries.

**Metrics.** [ASSUMED] Per-task quality and uncertainty, target-token likelihood, reconstruction error, accepted-task rate, p50/p95/p99 E2E latency, TTFT/TPOT/ITL where applicable, tokens/s/GPU, goodput, resident weight/metadata/KV/workspace bytes, joules per accepted task, and cost per accepted task. Construction energy/time is added before Eq.41.32 amortization.

**Baselines.** [ASSUMED] Dense parent, masked-dense same-support execution, unrecovered compressed checkpoint, recovered compressed checkpoint, and smaller dense alternatives under declared construction accounting.

**Expected result.** [ASSUMED] Supported packing or extraction may improve some workloads and regress others. Every retained speed claim needs a positive paired confidence interval; energy improvements need integrated-energy evidence. No benefit is the valid null outcome.

**Ablation.** [ASSUMED] Hold the mask constant while changing backend; hold backend constant while changing criterion; compare no recovery versus matched recovery; separate pruning-only, quantization-only, both orders, and joint compensation where supported; expose padding and fallback.

**Interpretation.** [DERIVED] If fewer operations yield no statistically resolved E2E saving, reject the speed claim at that workload. If quality fails, reject the candidate even if faster. If total energy per accepted task or construction amortization fails, reject the energy/economic claim separately.

**Threats to validity.** [DERIVED] Thermal/power drift, changed sampling lengths, search-selection bias, evaluator contamination, incompatible recovery budgets, hidden densification, and incomparable topology can each invalidate attribution.

### Experiment 41.3 — Adaptive execution and causal-state validity

**Hypothesis.** [ASSUMED] A prespecified early-exit or dynamic-depth policy maintains its declared causal/cache contract and quality bound while reducing measured accepted-task cost.

**Setup.** [ASSUMED] Freeze router/exit checkpoints and the finite policy grid before calibration. Use independent sequence-level calibration examples. Compare full depth, fixed reduced depth, adaptive execution, and verified speculation as separate semantic contracts.

**Independent variables.** [ASSUMED] Exit threshold, token capacity, predictor/router choice, state-completion rule, sequence length/domain, and concurrency.

**Controlled variables.** [ASSUMED] Weights, tokenizer, prompt templates, sampling settings, fixed calibration family, bounded risk function, failure probability, device/runtime, and evaluator.

**Dataset/workload.** [ASSUMED] Include prompts with shallow earlier tokens followed by deep later tokens, long prefixes, protected positional tokens, and domain shift. Preserve original token/patch positions during compaction.

**Hardware.** [ASSUMED] Record actual device and active-batch implementation; no inference benefit is credited to padded computations that still execute.

**Metrics.** [ASSUMED] Causal-information audit, missing-state reads, cache-shape/provenance validity, token participation/depth distribution, sequence-level quality/risk, routing/repair latency, active-batch occupancy, and accepted-task energy.

**Baselines.** [ASSUMED] Full depth, matched mean-depth static execution, random routing at the same capacity, and the source-specific trained policy with its declared state strategy.

**Expected result.** [ASSUMED] No attention read accesses unavailable future input or undocumented prefix state. A quality bound is accepted only under its sampling conditions; shifted-domain results are reported independently.

**Ablation.** [ASSUMED] Teacher-forced sequence-global routing versus causal routing; copied/projected versus fully reconstructed state; compacted versus padded batches; direct exit versus exact verification.

**Interpretation.** [DERIVED] Future-information dependence or an invalid state read rejects causal correctness. A valid but expensive repair policy can reject the efficiency hypothesis. Loss of calibrated quality under distribution shift limits its operating regime instead of invalidating an in-distribution theorem.

**Threats to validity.** [DERIVED] Token-level pseudo-replication, calibration-policy reuse, full-depth parent errors, and unmeasured repair tails can mask failures.

## Acceptance criteria

[ASSUMED] These are proposed thresholds to be frozen before execution, with sensitivity reported if changed:

- Representation decoding is exact for lossless masked weights; lossy quantization gets its own declared error check.
- Pattern validity is 100% for every claimed N:M group along the actual contraction axis; all extracted graph edges pass shape checks.
- FP32 analytical linear references target relative error at most $10^{-5}$ away from near-zero reference norms; BF16/FP16 target $10^{-2}$ with a separately declared absolute floor and accumulator policy. These planning tolerances are not universal library guarantees.
- No unsupported case is reported as sparse execution; every fallback is counted and attributed.
- For the chosen model-quality protocol, the 95% lower confidence bound of each critical task's retained score must exceed 98% of the parent's score, or a task-specific absolute tolerance declared before evaluation. Ratios are inappropriate near zero and need replacement by an absolute margin.
- A claimed timing/energy reduction requires a paired 95% interval wholly below a ratio of one, at matched accepted quality. At least 30 measured repetitions per fixed configuration are retained; increase sampling if intervals remain unresolved.
- Construction amortization is reported for the declared deployment horizon, and absence of break-even is retained.
- Adaptive policies permit zero invalid cache reads and zero future-information dependence. Their risk guarantee applies only to the fixed bounded loss and independent sampling conditions actually used.

## What this edition did not do

[UNVERIFIED] This edition did not prune or recover a checkpoint, execute a sparse kernel, train an exit/router, reproduce a published benchmark, measure power, or calculate a deployment price. All experiments above are unexecuted proposals. Manuscript observations concern inspected sources; formula validation establishes only structural/mathematical consistency.

## Topic-completeness audit

[DERIVED] Audit obligations abbreviate CONTENT_CONTRACT §4.1: **P** problem/prior limitation; **F** formal contract; **M** methodology; **Q** mathematical account; **A** bounded procedure; **I** implementation; **C** costs; **E** reported protocol; **O** observations; **S** alternatives; **X** lineage/improvements; **V** validity/failures; **R** reproducibility. “All” means these obligations have owning manuscript headings, not that independent replication is complete. Exact supporting locators and disclosure limits follow.

| Required concept/variant | Manuscript anchor | Obligations and source locator | Unresolved gap | Review consequence |
|---|---|---|---|---|
| Unstructured support | [41.1 Mechanism](41-1-sparsity-taxonomy.md#mechanism) | P/F/M/Q/A/I/C/S/V/R; E/O/X through R41.1 §§3–4 and R41.2 §4; CSR Eqs.41.1–2 are independent accounting | Runtime-specific encoding unexecuted | No generic speed claim |
| Block support | [41.1 Formulation/Mechanism](41-1-sparsity-taxonomy.md#mechanism) | P/F/M/Q/A/I/C/S/V/R; Eq.41.3 block index/padding; R41.10 §§3–4 hybrid tiles | No controlled experiment spanning all block granularities | Analytical taxonomy only; no optimal block size |
| N:M including 2:4/4:8 | [41.1](41-1-sparsity-taxonomy.md#mechanism) and [41.2](41-2-selection-criteria.md#extensions) | All; R41.9 §3 six masks and relaxation, R41.1 §3.3 patterns; §41.6 actual support boundary | Device/layout paths unexecuted | Pattern validity separated from support |
| Channel sparsity | [41.3](41-3-structural-reduction.md#formulation) | All; Eq.41.12 coupled gated FFN; R41.3 §3.1; R41.6 §3.2/Table3 | Particular extracted graph not built | Dependency closure is a required gate |
| Head sparsity | [41.3 Mechanism](41-3-structural-reduction.md#mechanism) | All; R41.6 §2 width/attention, Table3; Chapter14 owns GQA prerequisite; explicit KV/query differential | No per-head universal saliency theorem | No automatic KV-saving claim |
| Layer sparsity/depth pruning | [41.3 Mechanism](41-3-structural-reduction.md#mechanism) | All; local perturbation/propagation bound; R41.6 §3.2 contiguous layer removal | Multi-edit interactions not globally solved | Single-deletion score not additive guarantee |
| Expert sparsity/removal | [41.3 Mechanism](41-3-structural-reduction.md#mechanism) | All; fixed-router perturbation versus rerouting; R41.15 §4, Appendix B.1/C.4 | Whole-expert counterfactual with changed router not exact | Attribution stays local proxy |
| Storage versus executable sparsity | [41.1](41-1-sparsity-taxonomy.md#formulation), [41.6](41-6-hardware-realization.md#implementation) | All; R41.16 save/export; R41.18 workflow; R41.19 overview | Dispatch not run | File/zero count cannot certify speed |
| Magnitude criterion | [41.2](41-2-selection-criteria.md#formulation) | All; Eq.41.6, scale counterexample; R41.2 §4.2 Table3 | Deployment task-specific saliency absent | Baseline, not universal proxy |
| Activation sensitivity | [41.2](41-2-selection-criteria.md#mechanism) | All; direct-deletion derivation; R41.2 §3 Eq.1, §4, Appendix D.1 Table17 | Distributional moment mismatch | Bound is conditional on stated moments |
| Gradient/group sensitivity | [41.2](41-2-selection-criteria.md#mechanism) | All; Eq.41.9/Taylor conditions; R41.3 §3.2 Eqs.3–5; R41.15 §4.1 | Large discrete perturbation remainder | No exact global-loss guarantee |
| Second-order approximations | [41.2](41-2-selection-criteria.md#mechanism) | All; Eqs.41.7–11; R41.1 §§3.1–3.4/Algorithm1 | Practical solver not reimplemented | Exact local solve distinguished from approximate global support |
| Calibration data | [41.2](41-2-selection-criteria.md#experimental-design) | All; Eq.41.10; R41.1 §4 128×2048 C4; R41.2 §4/Table17 | Production coverage unavailable | No universal retention claim |
| Reconstruction objectives | [41.2](41-2-selection-criteria.md#formulation) | All; Eq.41.5 and target/input-producer differential; R41.1 §2 Eq.1 | Neural task mapping not established | Local error has bounded meaning |
| Learned mask successor | [41.2 Extensions](41-2-selection-criteria.md#extensions) | All; R41.9 §3.2 Algorithm1, §4/Appendix A/J; hardening/state and parameter cost derived | No matched total-build-budget reproduction | Quality gain cannot be called construction-cost neutral |
| Width reduction | [41.3](41-3-structural-reduction.md#mechanism) | All; R41.4 §3.1–3.4 Theorem1/Appendix A.1; R41.6 Table3 | Normalization/extraction path unexecuted | Rotation conditions retained |
| Low-rank factorization | [41.3](41-3-structural-reduction.md#formulation) | All; Eqs.41.13/15–16; R41.5 v5 §3.1/Table1; historical v3 §3.2 separated | Numerical conditioning and current factor execution | Rank threshold is arithmetic/storage, not latency |
| Architecture extraction/NAS | [41.3](41-3-structural-reduction.md#algorithm) | All; Eq.41.17–18; R41.8 §§2–4/Table1; R41.22 README scope | Full Puzzle pipeline not released by inspected demo | MIP demo does not establish reproduction |
| Distillation recovery | [41.4](41-4-recovery.md#mechanism) | All; Chapter39 objective prerequisite; R41.6 §3.3/Figure4; R41.8 §8.3/Table13 | Full data provenance/independent replication | Source protocol bounded |
| Continued training | [41.4](41-4-recovery.md#mechanism) | All; Eq.41.20; R41.7 Table16; R41.4 Figure6 negative OPT result | Recovery benefit not universal | Preserve parent-training controls |
| Layerwise reconstruction | [41.4](41-4-recovery.md#mechanism) | All; Eq.41.21, R41.5 v3 §3.2 Eq.7 as historical; v5 changes method | Rank-deficient solves/conditioning unexecuted | No silent revision merge |
| Sequential factor-wise recovery | [41.4](41-4-recovery.md#mechanism) | All; R41.5 v5 §3.2 Eq.7, Appendix A.1 Algorithm3 and A.10/Table15 | No unconditional SGD monotonic guarantee | Empirical ablation remains empirical |
| Quantization interaction | [41.4](41-4-recovery.md#mechanism) | All; Eq.41.22 cross term; R41.1 §3.5 Eq.7; Chapter40 owns quantization | Joint sparse-low-bit runtime compatibility | Numerical interaction separate from hardware |
| Early exit | [41.5](41-5-adaptive-computation.md#mechanism) | All; R41.12 §§3–4; R41.13 §4/§5/Table2 | Drift and state-repair tails | Causal contract required |
| Token/patch pruning | [41.5](41-5-adaptive-computation.md#mechanism) | All; R41.14 §3 Eqs.1–14, Tables1/4, Appendix A | Dense spatial/action tasks not established | Classification evidence not generalized |
| Dynamic depth | [41.5](41-5-adaptive-computation.md#formulation) | All; Eq.41.25; R41.11 §§3–4 | Training/inference router mismatch | Fixed capacity not causal guarantee |
| Conditional routing | [41.5](41-5-adaptive-computation.md#mechanism) | All; R41.11 §§3.3–3.6; capacity, top-k cost and causal selection | Distributed serving path unexecuted | No serving-speed extrapolation |
| Quality-aware policy | [41.5](41-5-adaptive-computation.md#mechanism) | All; R41.12 §4 Proposition1/§5 50trials; Eq.41.26 independently derived union bound | Shifted-distribution guarantees unavailable | Sampling/multiplicity conditions retained |
| Sparse kernel support | [41.6](41-6-hardware-realization.md#implementation) | All; R41.18 features/workflow, R41.20 GEMM tables, R41.19 microbenchmark | Current installed combination untested | Documentation only |
| Index overhead | [41.1](41-1-sparsity-taxonomy.md#formulation), [41.6](41-6-hardware-realization.md#mechanism) | P/F/M/Q/A/I/C/S/V/R; E/O through R41.19 compression; Eqs.41.1–3/31 independent | Private packing not inferred | Analytical encoding labeled |
| Load imbalance | [41.6](41-6-hardware-realization.md#formulation) | P/F/M/Q/A/I/C/S/V/R; Eq.41.30 static-worker bound; R41.11 §3.3 capacity motivation | No measured imbalance distribution | Bound, not empirical efficiency |
| Shape alignment | [41.6](41-6-hardware-realization.md#mechanism) | All; Eq.41.30; R41.15 §4.3/Appendix A.2; R41.18 descriptors | Device-specific optimum unexecuted | No universal alignment constant |
| Failure of theoretical speedup | [41.6](41-6-hardware-realization.md#experimental-design) | All; Eqs.41.29/32; R41.19 operator context, R41.10 §5.4 context | Energy/E2E replication absent | No claimed book-run benefit |

[DERIVED] Dataset, training-seed, and learned-improvement obligations are not applicable to pure identities (CSR byte sums, the rank parameter threshold, Amdahl's decomposition, and static-worker bounds); they are applicable to every empirical method attached to them. Architecture-specific empirical completeness remains limited to the inspected cases. Explicitly uninspected RobOP/ROSE candidate methods are excluded from mechanism claims rather than marked complete.

## Scientific review gates still open

[UNVERIFIED] Implementation commits/executed numerical checks, production quality retention, compatible sparse-low-bit dispatch, causal-state stress tests, integrated energy and independent replication remain open. The chapter can be structurally validated as a manuscript while retaining **manuscript_draft**. An auditor should reject any promotion to reviewed status that substitutes heading/figure presence or source citation count for these missing checks.
