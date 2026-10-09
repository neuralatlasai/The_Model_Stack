---
id: ms.verification.27
entity_type: verification
title: Verification — Attention, latent-attention, and expert kernels
short_title: Verification 27
volume: 2
part: 5
chapter: 27
section: null
slug: verification
parent: ms.chapter.27
prev_sibling: ms.section.27.6
next_sibling: ms.references.27
children: []
prerequisites: [ms.chapter.14, ms.chapter.16, ms.chapter.25, ms.chapter.26]
downstream: [ms.chapter.28, ms.chapter.29, ms.chapter.42]
related: []
relations: []
axes: {lifecycle: [pretraining, inference, serving, evaluation], mechanism: [attention, latent_attention, mixture_of_experts, kernel_dispatch], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.flashattention, impl.liger-kernel, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, ASSUMED, MATHEMATICALLY-DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2600
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# Verification — Chapter 27

## Artifact specification

[DERIVED] The artifact is an **algorithm-to-kernel analysis with hardware-specific measurements**. The manuscript defines it; measurement records below are required outputs of a future execution, not files claimed to exist.

| File | Required fields |
|---|---|
| `contract.json` | operator ID; shapes/strides; admitted-pair predicate; absolute positions; scale; positional transforms; dropout; empty-row convention; selected indices; route weights; capacity policy; quantization components; expected derivative |
| `environment.json` | device/model/count; topology; memory capacity; driver/runtime/compiler; package and backend revisions; wheel/container hashes; clocks/power state; graph/eager mode; measurement date |
| `capabilities.csv` | complete call tuple; candidate; documented support locator; local qualification status; supported/rejected reason; fallback identity; memory precondition |
| `accuracy.csv` | fixture/seed; candidate; reference; output/LSE/gradient metric; absolute/relative/norm errors; tolerance; worst index; finite/empty convention; pass/fail |
| `resources.csv` | useful and padded pairs/routes; FLOP counting convention; estimated operand bytes; measured HBM transactions; shared-memory/spill traffic; peak allocations; link/endpoint bytes; instrumentation scope |
| `timings.jsonl` | fixture; candidate; repetition; warm/cold state; timer boundary; preparation cost; kernel/eager/replay/layer cost; selected tactic; raw sample; excluded-sample reason |
| `dispatch.jsonl` | capability/tuning identity; selected backend; compiled specialization; graph/workspace ownership; fallback reason; cache ABI; invalidation event; rank agreement |
| `report.md` | protocol deviations; numerical failures; negative performance cells; uncertainty; source discrepancies; unsupported configurations; conclusions tied to measured boundaries |

[DERIVED] References use the same operator. A selected sparse kernel is compared to Eq. 27.16 with identical indices; selector quality gets a separate dense-model comparison. Quantized kernels are tested both against their dequantized represented operator and, separately, against the original higher-precision operator. Expert execution uses identical accepted routes and normalization. A benchmark that changes all these controls simultaneously cannot identify a kernel effect.

## Verification task

### Experiment 27.1 — Numerical equivalence and boundary semantics

- **Hypothesis.** [ASSUMED] A qualified exact kernel satisfies its declared forward/backward numerical budget and admitted-pair/route semantics. This is a proposal; passing is not assumed.

- **Setup.** Construct a high-precision mathematical reference for small cases and a memory-feasible reference for larger cases. Retain the reference's accumulation/order/dtype. Compare online scan, several disjoint split partitions, paged gathering, latent absorption, selected attention, and expert dispatch/combine against their corresponding equations.

- **Independent variables.** Query/key lengths; unequal head/value widths; batch/head grouping; arbitrary strides; page size and ordering; finite score range; mask; split count; precision/scales; expert route/load distribution; graph mode.

- **Controlled variables.** Same Q/K/V or expert weights; same admitted pairs/indices/routes; same absolute positions, scale, dropout counters, route normalization, and output convention. Numerical tolerances are fixed before candidate timing.

- **Dataset/workload.** [ASSUMED] Synthetic finite tensors and adversarial fixtures: lengths0,1,tile-minus1,tile,tile-plus1; all-masked and single-valid rows; partial pages; noncontiguous physical pages; equal/unequal split masses; duplicate/out-of-range selected indices; large positive/negative logits; zero/large values; empty/hot experts; overflow capacity. Empty or unsupported cases may correctly reject but must do so explicitly.

- **Hardware.** [UNVERIFIED] Select an actual device supported by the pinned candidate, record it, and test only its documented path. No hardware is represented as available merely because a source used it. Multi-rank expert tests require the recorded topology and transport stack.

- **Metrics.** Maximum absolute and normalized Frobenius error; per-row LSE error with a declared log base; finite-value policy; directional derivative error; route conservation; page/shape rejection; sanitizer findings; repeated-run consistency where deterministic mode is promised.

- **Baselines.** Mathematical attention Eqs. 27.1/27.16; explicit expanded-vs-absorbed linear form Eq. 27.14; unfused accepted expert sum Eq. 27.18. A deliberately incorrect equal-partition mean and a wrong-position mask are negative controls and must fail.

- **Expected result.** [ASSUMED] Correct candidates pass the preregistered envelope and negative controls fail. Any systematic split-dependent semantic error rejects the candidate even if average error looks small. A source-reported tolerance does not automatically become the deployment's tolerance.

- **Ablation.** Hold inputs fixed while changing split tree, page order, tile size, reduction determinism, scale format, and capacity padding. Disable approximation separately from dtype conversion when the backend exposes that control.

- **Interpretation.** Passing establishes tested numerical agreement for the declared represented operator. It does not establish selector quality, global model fidelity, all-input correctness, or speed.

- **Threats to validity.** An inaccurate reference; identical shared bugs; insufficient extreme-input coverage; nonfinite masking accidents; random fixtures missing adversarial conditions; gradient comparison on nondifferentiable route boundaries. Test derivatives with accepted routes fixed unless router differentiation is explicitly part of the contract.

### Experiment 27.2 — Traffic, parallelism, and baseline sensitivity

- **Hypothesis.** [ASSUMED] Eliminating materialized scores reduces counted intermediate traffic for matched prefill cases; split decode has a workload-dependent parallelism/merge tradeoff rather than a universal optimum.

- **Setup.** Compare qualified implementations over a frozen shape matrix. Separate kernel device timing from recurring eager and graph-replay timing. Charge preprocessing, page translation, selector, merge, and output projection at declared boundaries. Keep the dense attention baseline fixed when testing key omission.

- **Independent variables.** Prefill/decode query extent; history length; batch; head grouping; tile/split policy; page locality; precision; selector retained set; graph mode.

- **Controlled variables.** Same operator and numerical budget, same software/device state, same total admitted pairs for exact-kernel comparisons, same baseline for sparse policy comparisons, and the same repetition/warm-up policy.

- **Dataset/workload.** [ASSUMED] Geometric sequence-length sweep plus ragged traces with identical total tokens but different length distributions. Include small batches, large batches, short contexts, long contexts, and unsupported cells. Separate calibration traces from held-out policy evaluation.

- **Hardware.** Use the actual environment record. Profiler counters must identify whether they measure HBM transactions, cache traffic, shared-memory reads, or logical bytes. These are distinct denominators.

- **Metrics.** Achieved useful FLOP/s with explicit causal pair count; HBM bytes and bandwidth; merge/preparation time; peak memory; kernel/eager/replay cost distributions; whole-layer and decode-step cost where measured; uncertainty from raw repetitions.

- **Baselines.** Materialized mathematical attention where memory permits; qualified streamed dense path; several split counts; same-path selected-key evaluation. Do not use an intentionally weak dense kernel as the only sparse baseline.

- **Expected result.** [ASSUMED] Some shapes may regress. A traffic hypothesis is rejected for any tested cell where the counted reduction is absent beyond measurement uncertainty; a time improvement cannot repair that failed attribution. A candidate can remain correct without being faster.

- **Ablation.** Separate score materialization, split merge, grouping reuse, cache locality, selector time, dtype, and graph mode. Freeze the selected index set before timing the attention-only sparse stage, then charge selection separately and jointly.

- **Interpretation.** Report each cell rather than only the best ratio. Eq. 27.13 bounds a hypothetical whole-step gain under fixed remaining costs; compare measured whole-step behavior instead of presenting that bound as a result.

- **Threats to validity.** Cache warmth mismatch; profiler overhead; omitted host work; differing causal FLOP conventions; tuning on evaluation traces; changing baseline release; allocator behavior; clocks/power throttling. Energy requires an actual power integration interval and is omitted if unavailable, not inferred from FLOPs.

### Experiment 27.3 — Expert progress and dispatch identity

- **Hypothesis.** [ASSUMED] Every accepted route is conserved and every executed backend remains qualified across restarts, cache invalidation, and supported graph replay.

- **Setup.** Use synthetic experts with traceable outputs and controlled load skew. Compare split and fused paths with identical routes/precision first, then isolate quantization changes. Exercise tuning persistence, one-field key perturbations, graph/workspace lifetimes, and explicit incompatible-cache rejection.

- **Independent variables.** Expert placement; remote fraction; hot-expert skew; capacity alignment; dispatch/combine precision; rank count; graph mode; dependency/version fields; shape/stride and semantic key fields.

- **Controlled variables.** Same accepted routes, expert function, mixture weights, memory ownership, and timer scope. Keep changed-checkpoint quality evaluation separate from same-kernel integration overhead.

- **Dataset/workload.** [ASSUMED] Empty experts, all tokens to one expert, uniform routes, duplicated IDs, rejected capacity, delayed producers, concurrent stream attempts, and a stale-format cache fixture. Fault injection uses bounded test jobs and explicit abort/cleanup, not a live service.

- **Hardware.** Qualified actual expert-parallel topology; record transport and progress requirements. If no multi-rank hardware is available, mark that protocol branch unexecuted rather than replacing it with a single-device claim.

- **Metrics.** Accepted/processed/combined edge counts; output error; progress completion; timeout/abort status; peak routed buffers; payload; eager/replay/layer latency; persistent-key changes; selected-tactic feasibility; rank agreement.

- **Baselines.** Unfused exact routed reference and an explicit qualified fallback. A corrupted inverse map and a missing tuning-key field are negative controls.

- **Expected result.** [ASSUMED] Conservation and incompatibility rejection hold categorically. Any lost/duplicated route, wrong cached tactic, or incompatible ABI accepted silently rejects that path. A persistent-fusion speed gain cannot override correctness or progress failure.

- **Ablation.** Same kernel through alternative integration versus changed kernel; same precision versus changed precision; fixed routing versus router changes; coherent versus deliberately stale tuning/cache identity.

- **Interpretation.** Passing establishes the tested operator and lifetime envelope. Forward-only qualification does not certify training gradients. A short task-level quality check is insufficient for broad cross-checkpoint equivalence.

- **Threats to validity.** Shared reference/permutation bugs, artificial topology, overly benign load, disabled diagnostics, missed asynchronous failures, and a timeout that fails to terminate device work. Retain failed jobs and resource cleanup evidence.

## Acceptance criteria

[ASSUMED] These are proposed criteria, not source-reported findings or universal numerical tolerances:

1. **Semantics:** zero lost/duplicated accepted routes; exact logical mask/page/index agreement; all unsupported inputs reject or enter a declared capacity-safe fallback.
2. **Numerics:** set dtype- and operator-specific absolute/norm/derivative budgets in `contract.json` before timing. No unbudgeted NaN/Inf on finite admitted inputs. Empty-row special values match the backend's declared ABI.
3. **Reference sensitivity:** deliberately wrong equal-partition merge, position origin, inverse map, and tuning key must fail their corresponding controls.
4. **Source/identity:** every measured result has an exact environment and backend identity. Resolve R27.1's hardware/date conflict before reproducing or transporting that source's benchmark numbers.
5. **Performance attribution:** publish all qualified cells and negative results with raw samples. Claim improvement only for matched boundaries with uncertainty; do not set an arbitrary minimum speed ratio to certify correctness.
6. **Reproducibility:** a fresh process reconstructs contract, selected implementation, and results within the declared tolerance. Unsupported changed environments invalidate cached decisions rather than inheriting them.

## Analytical boundary fixtures

[MATHEMATICALLY-DERIVED] Figure 27.18 must distinguish a tie from a strict improvement. With extra setup 1 second and recurring saving 125 microseconds, Eq. 27.22 gives a tie at 8000 calls and the first strict saving at 8001. With the authored defaults of 2 seconds and 20 microseconds, the first strict saving is at 100001 calls. These exact arithmetic fixtures check the explanatory formula, not measured latency.

[DERIVED] Algorithm 27.2's slot-reuse invariant requires a consumer's asynchronous reads to complete before its release decrement. The last consumer's release publication must be acquired by the producer before overwrite. Final output publication separately waits for result writes. A future implementation test must deliberately delay a slot read and show that reuse remains blocked; source review alone does not execute that test.

## What this edition did not do

[UNVERIFIED] No experiment above was executed. No GPU, distributed MoE, package/API, cache conversion, gradient, performance, energy, or scientific-review result is claimed. Markdown/figure compilation and browser presentation checks, when run, establish artifact/rendering behavior only. They do not satisfy the scientific acceptance criteria. Editorial status remains **manuscript_draft**.

## Topic-completeness audit

[DERIVED] Every row below maps its topic to the full required-depth chain: **P** problem/prior limit; **F** formal contract; **M** methodology; **D** mathematical account; **A** bounded algorithm; **I** implementation; **R** resources; **E** source experimental design; **O** observations; **S** alternatives; **X** improvements; **V** validity/failures; **C** reproducibility. Section anchors carry these obligations at their named H2 headings. “Covered” means manuscript treatment, not passed scientific review. All proposed measurements remain UNVERIFIED.

| Topic / substantive variant | Manuscript anchors and applicable obligations | Primary key and exact locator | Unresolved gap / review consequence |
|---|---|---|---|
| Tiling and resident state | 27.1 Formulation/Mechanism/Implementation; P,F,M,D,A,I,R,E,O,S,X,V,C | R27.1 §3.1; bookEqs. 27.1–27.4 | Actual storage allocation/spills not executed |
| Online softmax and disjoint merge | 27.1 Mechanism/Algorithm; all obligations | R27.1 §3.1.4; bookEq. 27.2/Algorithm 27.1 | Floating-point envelope requires testing |
| Recomputation and derivative parity | 27.1 backward subsection/Algorithm/Failure modes; all obligations | R27.1 §2.1,§3.2; bookEq. 27.5 | Dropout counter map and gradients unexecuted |
| Causal and appended-query masks | 27.1 causality/Failure modes; all obligations | R27.1 §5 mask protocol; bookEq. 27.1 | Position-origin boundary fixtures unexecuted |
| Avoiding materialized score matrices | 27.1 Mechanism/Experimental design; all obligations | R27.1 Introduction/§3.1.4; bookEq. 27.4 | Physical traffic claim requires profiler evidence |
| Original IO analysis as retrospective | 27.2 Why this exists/Mechanism; P,F,M,D,I,R,E,O,S,X,V,C | R27.1 Introduction; bookEq. 27.6 | Original old paper excluded by date; no historical theorem attributed from uninspected origin |
| Parallelism refinements | 27.2 four questions/27.3 splitting; all obligations | R27.1 Introduction/§3.3 | Shape-specific occupancy/load balance unknown |
| Asynchronous pipeline | 27.2 Mechanism/Algorithm; all obligations | R27.1 §3.1.2/§3.2.2; bookEq. 27.7 | Barrier implementation and progress unexecuted |
| FA4 hardware co-design | 27.2 mechanism/experimental/observations; all obligations | R27.1 §§2.2,3–5,Appendix A.1 | Conflicting hardware/date blocks clean benchmark transfer |
| Conditional rescaling/exponential approximation | 27.2 mechanism; all obligations | R27.1 §§3.1.3–3.1.4,Table2; bookEqs. 27.8–27.9 | Our bounds conditional; installed approximation accuracy unknown |
| Deterministic backward and reduction ownership | 27.2 backward ownership/Failure modes; all obligations | R27.1 §§3.2.3–3.2.4 | Determinism envelope and races untested |
| Small-query/large-KV decode | 27.3 Why/Intuition/Formulation; all obligations | R27.3 §4.1; bookEq. 27.10 | Effective reuse/bandwidth unmeasured |
| Paged layout and lifetime | 27.3 Mechanism/Algorithm/Failures; all obligations | R27.6 v0.7 PrimTS plan/run; bookEq. 27.12 | Installed page ABI and concurrent lifetime untested |
| Split reduction and batching | 27.3 mechanism/Algorithm/Experimental design; all obligations | R27.3 §4.4/AppendixF; bookEqs. 27.10–27.13 | Policy crossover requires calibration and held-out tests |
| Compressed latent state and absorption | 27.4 Formulation/Mechanism; all obligations | R27.2 Appendix A; bookEqs. 27.14–27.15 | Actual checkpoint projections and cost unqualified |
| Positional components | 27.4 latent/position subsection; all obligations | R27.2 Appendix A; R27.4 cache Usage | Per-model position ABI must be checked |
| Sparse selector and training boundary | 27.4 selector subsection/Observations; all obligations | R27.2 §2.1,Eqs.1–4 | September parity excluded; new independent quality evidence absent |
| Sparse selected operator and omitted mass | 27.4 mechanism/Algorithm/Siblings; all obligations | R27.2 §2.1/Eq.2; bookEqs. 27.16–27.17 | Dense-model fidelity distinct from kernel parity |
| FlashMLA shape/cache constraints | 27.4 physical sparsity/Implementation/Reproducibility; all obligations | R27.4 pinned breaking notice,Requirements,Usage | Latest release is not V3.2-compatible; no execution claim |
| Routing and token dispatch/combine | 27.5 Formulation/Mechanism/Algorithm; all obligations | R27.5 Our approach/Usage; bookEq. 27.18 | Route conservation and transport untested |
| Grouped GEMM and capacity padding | 27.5 grouped subsection; all obligations | R27.5 Our approach/microbenchmarks; bookEq. 27.19 | Actual padding/backend geometry unmeasured |
| Quantized experts and wire formats | 27.5 precision/Experimental design; all obligations | R27.5 Performance/Accuracy gate; R27.6 quantization notes | Cross-checkpoint broad quality and backward unavailable |
| Communication overlap and progress | 27.5 dispatch/Algorithm/Failure modes; all obligations | R27.5 Our approach/Split path; bookEq. 27.20 | Multi-rank progress/topology must be tested |
| FlashInfer integration and experimental policy | 27.6 Mechanism/Algorithm; all obligations | R27.6 unified MoE/PrimTS; R27.7 opt-in/admission | Release APIs unexecuted; later docs not silently imported |
| FlashAttention/FlashMLA integration boundaries | 27.6 capability record/Failures; all obligations | R27.1 §4; R27.4 breaking notice/Usage | Package import does not qualify mathematical/cache ABI |
| Liger/xFormers examples | 27.6 five surfaces/Implementation; P,F,M,I,R,E,O,S,X,V,C | R27.8 Summary/What's Changed; R27.9 Removed | Source governs release changes; algorithm not applicable to packaging event itself |
| Backend/dtype/shape/release qualification | 27.6 Formulation/Algorithm; all obligations | R27.6 restrictions; R27.10 §§1–3; bookEq. 27.21 | Local support predicate unknown until executed |
| Deployment-matched tuning and persistence | 27.6 timing/persistence/Algorithm; all obligations | R27.10 §§1–5/key and timer audit; bookEq. 27.22 | Finite candidate oracle and environment-specific rank tests only |

[DERIVED] Data construction/training splits are not applicable to a deterministic kernel-equivalence reference; tensor fixtures and workload traces replace them. DSA's learned selector has a training boundary and is treated separately in §27.4. Packaging changes have no mathematical optimizer or training algorithm, so their algorithmic obligations apply to dispatch/qualification rather than to inventing a procedure for a release announcement. Energy/money are applicable measured costs but unavailable; no fictitious values close those gaps.
