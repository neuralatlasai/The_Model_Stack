---
id: ms.verification.26
entity_type: verification
title: Verification
short_title: Verification
volume: 2
part: 5
chapter: 26
section: null
slug: verification
parent: ms.chapter.26
prev_sibling: null
next_sibling: null
children: []
prerequisites:
- ms.chapter.3
- ms.chapter.5
- ms.chapter.25
downstream:
- ms.chapter.27
- ms.chapter.28
- ms.chapter.29
- ms.chapter.30
related: []
relations: []
axes:
  lifecycle:
  - pretraining
  - inference
  - serving
  mechanism:
  - kernel_programming
  - numerical_equivalence
  feedback_setting: []
  modality:
  - text
  - image
  - audio
papers: []
implementations:
- impl.nvidia-cuda
- impl.triton-language
- impl.nvidia-cutlass
- impl.amd-hip
- impl.pytorch
- impl.jax
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - OFFICIAL-DOCUMENTATION
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1200
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# Verification — Chapter 26

[DERIVED] This page specifies the artifact, an **unexecuted** falsification protocol and topic-completeness audit. No operator benchmark, sanitizer run, gradient experiment or training study was executed for this edition. Presentation/compiler checks are not GPU evidence.

## Artifact specification

| File | Required fields |
|---|---|
| `operator-contract.json` | Formula; shapes; strides/alignment; storage/product/accumulation dtypes; epsilon/mask; alias/mutation; denominator; gradient/state contract |
| `environment.json` | Device model/capability; driver/runtime/toolkit/compiler/assembler commits; flags; power/clock regime; source/binary hashes |
| `inputs.jsonl` | Case id/hash; seed or adversarial construction; valid/invalid category; boundary reason; initial state |
| `candidates.jsonl` | Interface; tile/layout/launch/stages; preconditions; cold cost; rejection; generated binary |
| `parity.jsonl` | Reference precision; tolerance rationale; worst output; VJP/directional/coordinate checks; state equality; safety tool/log; outcome |
| `profile.jsonl` | Complete boundary; raw samples/order; warm/cold caches; actual versus useful bytes; spills/register/shared allocation; conversions/repacking/extra reductions |
| `dispatch.json` | Complete key; guards; valid devices/dtypes/layouts; candidate; exact fallback; invalidation |

## Proposed experiment 26.1 — Correctness-constrained optimization

- **Hypothesis.** [DERIVED] A proposed route is useful only if it improves the declared complete-operator objective while satisfying every required correctness cell. No improvement is assumed.
- **Setup.** [ASSUMED] Implement one §26.3 operator with an independent high-precision small-case reference and a documented larger-case reference; freeze its contract before tuning.
- **Independent variables.** [ASSUMED] Tile/layout, pipeline depth, fusion, compiler revision, dtype, target where available.
- **Controlled variables.** [DERIVED] Input bytes and initial state; semantic envelope; numerical policy; forward/backward requirements; timing/cache/power boundaries; selection budget.
- **Workload.** [ASSUMED] Zero/one where valid; tile minus/plus one; rectangular/single-row products; unaligned/noncontiguous views; repeated indices; almost-constant normalization; rotary layouts; extreme logits; ignored/all-masked policy; repeated optimizer state and restore.
- **Hardware.** [UNVERIFIED] Executor must record actual devices, driver, toolkit/compiler and precision. No available accelerator or achieved bandwidth is invented.
- **Metrics.** [DERIVED] Full-operator duration, compile/tune cost, output/VJP/state error, actual traffic, useful-byte model, spills/shared allocation, fallback cells and frequency under sealed requests. Energy/money need extra measurements.
- **Baselines.** [DERIVED] Independent reference, identical unfused composition, valid library route and exact fallback.
- **Expected result.** [UNVERIFIED] No winner/speedup/pass rate is predicted. A required invalid cell rejects the candidate regardless of time.
- **Ablations.** [ASSUMED] Fusion off; repacking off; one/two slots; coarse/complete key; static/dynamic path; correctly restored versus deliberately rejected nonrestoring mutable-state harness.
- **Interpretation.** [DERIVED] Attribute effects only to matched boundaries. Cold compilation is separate from warm device execution; kernel gains do not establish training-step gains.
- **Falsification.** [DERIVED] Reject a route if any required valid case violates the sealed contract, or accepted complete-operator cost fails to improve under the predeclared uncertainty rule. Negative results remain in the ledger.

## Acceptance criteria

[ASSUMED] Exact agreement is required for metadata, domains, masks and integer counters. Floating tolerances require review before candidate errors are observed and must be justified by dtype, conditioning and application; no universal threshold is invented here. Every applicable safety tool reports no detected error on the tested set, with coverage documented. Forward, backward and state pass independently. At least two independently ordered timing passes confirm any selected candidate; raw samples and uncertainty procedure are retained. Missing results remain UNVERIFIED, never zero.

[DERIVED] A performance publication records hardware, operator/model, precision, sequence/shape envelope, input distribution, concurrency, runtime and boundary. Sanitized and performance binaries are distinct artifacts. Analytical figure calculations are not relabelled as benchmarks.

## What this edition did not do

No experiment was run. No binary compatibility, race freedom, convergence or production readiness is certified. Mathematical arguments establish their stated models; future finite checks establish tested envelopes only. Numerical and scientific review remain required before changing draft status.

## Topic-completeness audit

Every row maps the contract's problem, formal inputs/outputs, methodology, mathematics, procedure, execution/resources, reported/proposed experiment, observation, alternatives, lineage, failure and closure obligations to its topic. A pure identity has no training dataset or learning budget; its implementation still requires an exact version and input manifest. All sections contain the exact H2 anatomy and four-part observations. Gaps below block empirical/reviewed claims, not the explanation of the mechanism.

| Topic/variant | Owning anchors | Primary locator and derivation | Gap and consequence |
|---|---|---|---|
| Threads/program instances | 26.1 Intuition, Formulation, Mechanism | R26.1 §§2.2.1–2.2.2; R26.3 layouts; Eq.26.1 | Generated mapping unverified; inspect before execution claim |
| Tiling/vectorization/coalescing | 26.1 Mechanism, Algorithm | R26.1 memory/access; ownership proof and sector equation | Actual transactions/alignment tests absent; model is not profiler traffic |
| Synchronization/reductions | 26.1 two-stage sum;26.6 | R26.1 shared memory/groups; R26.10; subset invariant | No safety run; ordering and boundary checks required |
| CUDA/CUDA Tile | 26.2 interface audit | R26.2 tile programming and first-version capabilities | Target build absent; no universal architecture support |
| HIP/ROCm | 26.2 Mechanism/Implementation | R26.4 hierarchy/memory | Cross-target run absent; portability is conditional |
| Triton | 26.2 Mechanism;26.5 | R26.3 backend/layout; R26.16 autotuner | Binary and selected schedule unverified |
| CUTLASS/CuTe/CuTeDSL | 26.2 interface matrix | R26.5 core abstractions/relationship to C++ | Instance/ABI absent; pin generated artifact |
| Pallas | 26.2 grid/block-spec account | R26.6 released0.9.0 quickstart | Experimental interface unexecuted; no novelty claim |
| TileLang | 26.2 Mechanism | R26.7 v0.1.8 Quick Start/backend news | Backend compatibility unexecuted |
| ThunderKittens | 26.2 Mechanism/Experimental design | R26.8 consistency, pipelines, benchmark protocol | No pinned built kernel or reproduced gain |
| GEMM/GEMV | 26.3 product and gradients | Eq.26.3; R26.11 NVGEMM | Dispatch/workspace absent; forward/backward shapes separate |
| Embedding | 26.3 gather/scatter derivative | R26.13 parameters/notes | Sparse/duplicate cells unexecuted |
| Normalization | 26.3 centered/RMS formulas and gradients | Book derivations under finite smooth-input contract; R26.6 interface route | Numerical algorithm/tolerance untested; functions distinct |
| RoPE | 26.3 rotation/transposed derivative/pair layouts | Book orthogonal rotation derivation | Frequency implementation outside local input contract; require declared angles |
| Softmax | 26.3 finite-row max/sum/derivative | Book identities; R26.14 context | All-masked policy must be chosen |
| Cross-entropy | 26.3 Eq.26.4/procedure | R26.14 targets/reduction/ignore_index | Weighted/smoothed variants restricted explicitly; separate tests needed |
| Optimizer | 26.3 moments/update/traffic | R26.15 displayed algorithm and modes | Mixed precision/overflow/restore unexecuted |
| Intermediate writes/layouts | 26.4 liveness/maps | R26.12 GLU repacking; Eq.26.5 | Actual conversion bytes unknown; full-composition ledger |
| Register/shared storage | 26.4 liveness/lifetimes | R26.1 memory spaces; R26.9 staging | Spill/resource reports missing; no measured gain |
| Async copies | 26.4 Eq.26.6/generation procedure | R26.9 §§4.11.1–4.11.2 | Partial arrivals/wraparound untested; safety blocks acceptance |
| Shape/dtype specialization/autotuning | 26.5 Eq.26.7/bounded tuner | R26.16 __init__/run/listener | Timing/cache sequence absent; no best selection claim |
| Occupancy/compiler/device families | 26.5 Eq.26.8 and target analysis | R26.1 occupancy; R26.16 release | Allocation granularity unknown; upper bound is not throughput |
| Fallback | 26.5 validity intersection/failures | Book dispatch contract | Complete fallback not executed |
| Accumulation/tolerances | 26.6 Eq.26.9/error model | R26.17; book rounding derivation | Policy review pending; no universal threshold |
| Race/synchronization/boundaries | 26.6 Mechanism/gates | R26.10 analysis/caveats | No tool outcomes; no race-free certification |
| Forward/backward/state parity | 26.6 Eq.26.10/acceptance | R26.18 numeric fixes; book derivative checks | Actual outputs/gradients/state unmeasured; no convergence claim |

## Analytical instrument check

[MATHEMATICALLY-DERIVED] Figure 26.21 executes Eq. 26.12. Its assumed default $P=2$ seconds, $H=20$ microseconds, $D=80$ microseconds and $n=10{,}000$ gives $T=3$ seconds, recurring host time $0.2$ seconds, device time $0.8$ seconds and preparation/host fraction $2.2/3$. With $P=0$, reuse leaves that fraction fixed at $H/(H+D)=0.2$; with $H=0$ and increasing $n$, the preparation fraction tends to zero. These arithmetic checks concern the declared serialized model and do not validate asynchronous execution or measured interface latency.

## Figure coverage

[DERIVED] Each numbered topic has at least three authored native scientific figures: diagrams, analytical calculators, tensor traces, systems traces and comparisons. All nineteen carry provenance, captions and accessible equivalents. Section 26.2 additionally includes the adjustable Eq. 26.12 preparation/dispatch boundary instrument (Figure 26.21), with explicitly serialized, assumed durations. Illustrative configurations are labelled; no fabricated performance data appears. Scientific adequacy and responsive rendering are separate gates.
