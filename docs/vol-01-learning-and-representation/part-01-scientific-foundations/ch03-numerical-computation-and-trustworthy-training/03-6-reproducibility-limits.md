---
id: ms.section.3.6
entity_type: section
title: Reproducibility limits
short_title: Reproducibility limits
volume: 1
part: 1
chapter: 3
section: 3.6
slug: 03-6-reproducibility-limits
parent: ms.chapter.3
prev_sibling: ms.section.3.5
next_sibling: ms.verification.3
children: []
prerequisites: [ms.section.2.5, ms.section.3.1, ms.section.3.2, ms.section.3.5]
downstream: [ms.section.6.4, ms.section.12.5, ms.section.19.4, ms.section.26.6, ms.section.28.6, ms.section.30.6]
related: [ms.section.6.6, ms.section.63.2]
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.jax}
  - {type: implemented_by, target: impl.nvidia-cublas-cublaslt}
  - {type: implemented_by, target: impl.nvidia-cudnn}
axes: {lifecycle: [pretraining, evaluation, assurance], mechanism: [reproducibility, determinism], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch, impl.jax, impl.nvidia-cublas-cublaslt, impl.nvidia-cudnn]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, ASSUMED, DERIVED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 3.6 Reproducibility limits

## Scope

Objective: state what "the same run" can and cannot mean on floating-point hardware, enumerate the sources that consume the tolerance — seeds and RNG state, nondeterministic kernels, reduction order, hardware and software changes — and define equivalence as a tolerance relation with a manifest that makes each source explicit. Baseline: the expectation of bitwise identity. Success criterion: two runs of the skeleton are declared equivalent or not by Algorithm 3.13 with a derived tolerance, and every difference is attributable to a manifest field. Boundaries: resume semantics of data iterators in [§12.5](../../part-02-data-and-representation-engineering/ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md); training-state transitions in [§19.4](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-4-training-state-transitions.md); kernel-level correctness under optimization in [§26.6](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/26-6-correctness-under-optimization.md); recovery and replay at scale in [§30.6](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-6-recovery-and-reproducibility.md); seed variance as a measurement problem in [§6.4](../ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md).

## Why this exists

What failed: teams reported "the same seed gives a different loss" as a bug and spent effort on it, when floating-point addition is not associative and the hardware reorders sums for throughput [OFFICIAL-DOCUMENTATION — NVIDIA CUDA floating-point docs: "Parallelizing algorithms may rearrange operations, yielding different numeric results", R3.25]. Bottleneck: deterministic kernels forgo atomics and dynamic work distribution; the framework documents that "deterministic operations are often slower than nondeterministic operations" [OFFICIAL-DOCUMENTATION — PyTorch 2.14 Reproducibility page, R3.11]. Dominant constraint: the framework itself states that "completely reproducible results are not guaranteed across PyTorch releases, individual commits, or different platforms" nor "between CPU and GPU executions, even when using identical seeds" [OFFICIAL-DOCUMENTATION — same page]. What changed: equivalence is defined as a tolerance derived from Eq. 3.9, and the run is described by a manifest whose fields are the known sources of difference.

## Intuition

Physically, every run is a specific sequence of roundings. Two runs are bit-identical only if the sequence is identical: same inputs, same kernels, same tiling, same reduction tree, same FMA contraction, same thread scheduling. Any of these can change without any change to the program text. What is invariant is the *bound*: whichever order is used, the result lies within γ_n Σ|x_i| of the exact sum. Equivalence must therefore be tested against that invariant, and bitwise identity reserved for the narrow situations in which all of the above are pinned.

## Formulation

Tolerance-based equivalence for tensors a (candidate) and b (reference):

$$
|a_i - b_i| \le \mathrm{atol} + \mathrm{rtol}\cdot |b_i| \quad \forall i
$$
*(Eq. 3.22)* where atol absorbs errors near zero and rtol the relative bound; for a reduction of length n in a format with unit roundoff u the derived rtol is c·γ_n with a stated headroom c, and atol is c·γ_n·(Σ|terms|)·u_out to cover cancellation (see [verification.md](verification.md)).

```figure
id: fig-3.29
kind: chart
title: Derived tolerances against reduction length
caption: >-
  The rtol side of Eq. 3.22 as verification.md derives it, per unit of
  Σ|terms|, for FP32 with headroom c = 4. The hard bound (T2b) grows as n.
  The review gate follows the √n random-rounding rule of Eq. 3.23. The
  two-run tolerance (T8) is twice the hard bound, because each run is within
  it of the exact value. The blocked reference primitives (T2a) stay near
  137·u, which is why they are the ones that should fail loudly. None of
  these lines depends on which order a kernel picked.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.22", "DERIVED:eq-3.9", "DERIVED:eq-3.23"]
alt: >-
  Log–log chart of tolerance divided by Σ|terms| against reduction length n
  from 64 to 65536, FP32, headroom c = 4. T2b hard bound γ_{n+c}(u₃₂): 2.4e−4
  at n = 4096 and 3.9e−3 at 65536. T8 two-run tolerance, twice T2b: 4.9e−4
  at 4096. T2b review gate 8·√n·u₃₂: 3.1e−5 at 4096 and 1.2e−4 at 65536. T2a
  blocked reference bound γ_{K+⌈log₂(n/K)⌉+c} with K = 128: 8.2e−6 at 4096,
  nearly flat.
spec:
  type: line
  x: { label: "reduction length n", scale: log2, format: integer, domain: [64, 65536] }
  y: { label: "tolerance ÷ Σ|terms|, FP32", scale: log10, format: raw }
  variables: { c: 4, K: 128 }
  series:
    - { id: hard, label: "T2b hard bound, γ_{n+c}(u₃₂)", formula: "(x + c)*2^-24/(1 - (x + c)*2^-24)", sample: { from: 64, to: 65536, count: 11 }, emphasis: true }
    - { id: two, label: "T8 two-run tolerance, 2 × T2b", formula: "2*(x + c)*2^-24/(1 - (x + c)*2^-24)", sample: { from: 64, to: 65536, count: 11 }, dashed: true }
    - { id: gate, label: "T2b review gate, 8·√n·u₃₂", formula: "8*sqrt(x)*2^-24", sample: { from: 64, to: 65536, count: 11 } }
    - { id: blk, label: "T2a blocked reference, K = 128", formula: "(min(x, K) + ceil(log2(max(x/K, 1)) - 0.000001) + c)*2^-24/(1 - (min(x, K) + ceil(log2(max(x/K, 1)) - 0.000001) + c)*2^-24)", sample: { from: 64, to: 65536, count: 11 } }
  annotations:
    - { x: 4096, label: "d_model-length reduction" }
states:
  - { anchor: formulation, label: "n = 4096", variables: { x: 4096 }, highlight: [hard, gate], note: "Eq. 3.22's rtol = c·γ_n. For n = 4096 in FP32 the hard bound γ_{4100} is ≈ 2.4e−4 of Σ|terms|, and the review gate 8·√n·u₃₂ ≈ 3.1e−5 flags errors well inside it." }
  - { anchor: mechanism, label: "n = 65536", variables: { x: 65536 }, highlight: [hard], note: "Reordering (split-K, atomics, streams) changes the rounding sequence, not the bound. At n = 2^16 every order stays within ≈ 3.9e−3 of Σ|terms|." }
  - { anchor: algorithm, label: "two runs, n = 4096", variables: { x: 4096 }, highlight: [two], note: "Algorithm 3.13 line 5. Each run is within γ of the exact value, so two runs differ by at most twice it: T8 ≈ 4.9e−4 at n = 4096." }
  - { anchor: failure-modes, label: "tolerance tuned to pass", variables: { x: 4096 }, highlight: [blk, hard], note: "A tolerance tuned so the current run passes drifts far above γ_n. The blocked reference primitives (T2a, ≈ 8.2e−6) should fail loudly long before the T2b line." }
```

Expected versus worst-case error of a sum under reordering:

$$
\mathbb{E}\big[|\mathrm{fl}(\textstyle\sum x_i) - \sum x_i|\big] \approx u \sqrt{n}\, \big\|x\big\|_2 \quad\text{(random rounding model)}, \qquad \le \gamma_{n-1}\textstyle\sum|x_i| \quad\text{(worst case)}
$$
*(Eq. 3.23)* where the random model assumes independent zero-mean rounding errors [ASSUMED — it is a model, not a theorem; sensitivity: correlated roundings (e.g. all-positive terms of similar magnitude) approach the worst case].

> **Definition — Tolerance-based equivalence.** Two computations are equivalent when every corresponding output satisfies Eq. 3.22 with atol and rtol derived from the formats and reduction lengths involved, and stated in the manifest.

> **Definition — Reduction-order nondeterminism.** Run-to-run differences arising because a kernel's summation order (tiling, split-K, atomic accumulation, thread scheduling) is not fixed across runs, so the rounding sequence of Eq. 3.9 differs while its bound does not.

## Mechanism

**Seeds and RNG state.** PyTorch's `torch.manual_seed` seeds "the RNG for all devices (both CPU and CUDA)"; Python and NumPy generators are separate and must be seeded separately; multi-worker data loading requires `worker_init_fn` and a `generator` to make workers reproducible [OFFICIAL-DOCUMENTATION — R3.11]. A seed fixes the *stream*, not the *consumption*: any change in the number or order of random draws (a dropout layer added, a batch reordered, a checkpointed segment re-run without `preserve_rng_state`) shifts every later draw. Checkpoints must therefore carry the RNG state of every generator (CPU, each device, each worker) alongside parameters, developed in [§19.4](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-4-training-state-transitions.md). JAX removes the stream problem by construction: "random functions consume the key, but do not modify it", and independent draws require an explicit `split()` [OFFICIAL-DOCUMENTATION — JAX random-numbers page, R3.16].

**Nondeterministic kernels.** Two families dominate. (i) Atomics in reductions: scatter-add, index-add, embedding backward, and split-K GEMMs accumulate contributions in an order set by thread arrival; cuBLAS documents that for some routines "results are not guaranteed to be bit-wise reproducible because atomics are used" [OFFICIAL-DOCUMENTATION — cuBLAS docs, R3.13]. (ii) Algorithm selection: cuDNN engines carry numerical notes including `CUDNN_NUMERICAL_NOTE_NONDETERMINISTIC`, and heuristic modes choose engines by measured or predicted performance; PyTorch's `torch.backends.cudnn.benchmark = False` makes cuDNN "deterministically select an algorithm, possibly at the cost of reduced performance" [OFFICIAL-DOCUMENTATION — cuDNN graph-library API reference R3.17; PyTorch Reproducibility page R3.11]. `torch.use_deterministic_algorithms(True)` switches to deterministic implementations where available "and throw[s] an error if an operation is known to be nondeterministic" [OFFICIAL-DOCUMENTATION — R3.11].

**Reduction order and streams.** cuBLAS states that "all cuBLAS API routines from a given toolkit version generate the same bit-wise results at every run when executed on GPUs with the same architecture and the same number of SMs", that "this guarantee no longer holds when multiple CUDA streams are active", and that `CUBLAS_WORKSPACE_CONFIG=:16:8` or `:4096:8` restores it at a performance or memory cost [OFFICIAL-DOCUMENTATION — R3.13]. The bound of Eq. 3.9 is unaffected; only the realized rounding sequence changes.

**Hardware and software changes.** A different SM count, a different architecture, a different toolkit, FMA contraction on one target and not another ("The GPU has fused multiply-add while the CPU does not"), or a compiler flag such as `-ftz=true` each changes the rounding sequence [OFFICIAL-DOCUMENTATION — R3.25]. None of these is a defect; each must appear in the manifest so that a change in results is attributable.

**Chaotic amplification.** Training is a long iterated map; a 1-ulp difference at step 1 is amplified through optimizer nonlinearity and data-dependent control flow (argmax routing, top-k, clipping decisions) so that two tolerance-equivalent steps produce runs that diverge in loss by amounts far larger than γ_n after many steps. This is expected, and it is why reproducibility of a *run* is assessed by distributional statistics over seeds (§6.4) while reproducibility of a *step* is assessed by Eq. 3.22 [DERIVED].

Cost line: deterministic mode — kernel slowdown that is workload-specific and NOT quantified here (UNVERIFIED for any ratio); `CUBLAS_WORKSPACE_CONFIG=:4096:8` — documented as approximately 24 MiB of additional device memory [OFFICIAL-DOCUMENTATION — R3.13]; RNG-state checkpointing — a few KiB per generator; manifest — negligible; the two-run equivalence test — one extra step per check.

```figure
id: fig-3.30
kind: stat-panel
title: What pinning the rounding sequence costs
caption: >-
  The documented switches that buy bitwise identity, with the cost each one
  states. Only one cost is quantified in the documentation read for this
  chapter, the ≈ 24 MiB workspace of :4096:8. The deterministic-mode slowdown
  is workload-specific and stays UNVERIFIED here. Note the scope of cuBLAS's
  guarantee. It holds for the same toolkit, architecture and SM count, and
  lapses once a second stream is active.
placement: rail
anchor: mechanism
evidence: OFFICIAL-DOCUMENTATION
source: [R3.13, R3.11, R3.17]
alt: >-
  Instrument panel of documented determinism switches and their costs.
  CUBLAS_WORKSPACE_CONFIG is :4096:8 or :16:8, and :4096:8 costs about
  24 MiB of device memory (R3.13). The cuBLAS bitwise guarantee holds for the
  same toolkit, architecture and SM count and is lost when multiple CUDA
  streams are active. cudnn.benchmark = False makes engine selection
  deterministic. use_deterministic_algorithms(True) raises an error on a
  known-nondeterministic operation (R3.11). The deterministic-mode slowdown
  is UNVERIFIED. RNG-state checkpointing costs a few KiB per generator, and
  the two-run test costs one extra step per check.
spec:
  header: "DETERMINISM · WHAT PINNING COSTS"
  rows:
    - { key: "CUBLAS_WORKSPACE_CONFIG", value: ":4096:8 or :16:8" }
    - { key: "extra device memory, :4096:8", value: "≈ 24 MiB", note: "R3.13" }
    - { key: "cuBLAS bitwise guarantee holds for", value: "same toolkit, arch, SM count" }
    - { key: "guarantee lost when", value: "multiple CUDA streams active" }
    - { key: "cudnn.benchmark = False", value: "deterministic engine selection" }
    - { key: "use_deterministic_algorithms(True)", value: "error on known-nondeterministic op" }
    - { key: "deterministic-mode slowdown", value: "UNVERIFIED, workload-specific" }
    - { key: "RNG-state checkpoint", value: "a few KiB per generator" }
    - { key: "two-run equivalence test", value: "one extra step per check" }
```

## Algorithm

```text
Algorithm 3.13 — Reproducibility manifest and two-run step equivalence
INPUT   program P; fixture F; manifest schema M; tolerance derivation (Eq. 3.9, Eq. 3.22)
OUTPUT  manifest.json; verdict ∈ {bitwise, tolerance-equivalent, not equivalent} with attribution
STATE   run A, run B on the same device (or declared different devices)
INVARIANT every field of M is recorded before either run starts
1  fill M: framework version+commit; device model, SM count, driver, toolkit; cuBLAS/cuDNN versions;
          deterministic flags; reduction-precision flags; CUBLAS_WORKSPACE_CONFIG; autocast dtype; FP8 recipe;
          seeds (python, numpy, torch CPU, each CUDA device, each worker); fixture hash; kernel flags; stream count
2  run A: y_A, g_A ← forward/backward of P on F; hash(RNG states after)
3  run B: same, fresh process
4  if bytes(y_A) = bytes(y_B) and bytes(g_A) = bytes(g_B): verdict ← bitwise; return
5  compute (atol, rtol) per output from its reduction length n and dtype (verification.md table)
6  if Eq. 3.22 holds for all outputs: verdict ← tolerance-equivalent; attribute to M fields that differ or to
   nondeterministic kernels listed by use_deterministic_algorithms warnings
7  else verdict ← not equivalent; report max violation and the first layer at which it appears
8  TERMINATION: two runs and one comparison
```

Complexity: two step executions; the per-layer localization in line 7 uses stored intermediate tensors and is O(number of layers) comparisons.

```figure
id: fig-3.31
kind: diagram
title: Two-run equivalence with attribution, Algorithm 3.13
caption: >-
  The manifest is written before either run starts, so every later
  difference has somewhere to land. A byte-equal pair ends the algorithm at
  bitwise. Otherwise the emphasised path derives tolerances from n and dtype,
  not from the observed gap, and tests Eq. 3.22. A pass is still attributed,
  to a manifest field that differs or to an operation the deterministic flag
  lists. A failure is localised to the first layer where stored intermediates
  diverge.
placement: inline
evidence: DERIVED
source: ["DERIVED:alg-3.13", "DERIVED:eq-3.22"]
alt: >-
  Diagram of Algorithm 3.13. The manifest M (versions and commit, device and
  SM count, flags, seeds, RNG and fixture hashes) is filled first and is
  recorded before run A and run B. Run B is a fresh process of the same
  program on the stored fixture F. Both runs feed a branch that asks whether
  the bytes of outputs and gradients are equal. If yes, the verdict is
  bitwise. If no, the emphasised path derives atol and rtol per output from
  its reduction length and dtype (Eq. 3.9) and tests Eq. 3.22 on all outputs.
  If it holds, the verdict is tolerance-equivalent, attributed through the
  manifest diff or to listed nondeterministic operations. If it fails, the
  verdict is not equivalent, with the maximum violation and the first
  differing layer.
spec:
  direction: TB
  nodes:
    - { id: man, kind: dependency, label: "manifest M, filled first", sub: "versions, SM count, flags, seeds, hashes" }
    - { id: fx, kind: dataset, label: "fixture F", sub: "stored, hashed (§3.5)" }
    - { id: ra, kind: process, label: "run A", sub: "forward + backward; RNG-state hash", group: runs }
    - { id: rb, kind: process, label: "run B, fresh process", sub: "same program P", group: runs }
    - { id: byt, kind: branch, label: "bytes of y and g equal?", sub: "line 4" }
    - { id: bw, kind: state, label: "bitwise", sub: "every manifest field pinned" }
    - { id: tol, kind: process, label: "derive atol, rtol per output", sub: "from n and dtype, Eq. 3.9; line 5" }
    - { id: eq, kind: branch, label: "Eq. 3.22 holds for all outputs?", sub: "line 6" }
    - { id: te, kind: state, label: "tolerance-equivalent", sub: "attributed to fields or listed ops" }
    - { id: ne, kind: state, label: "not equivalent", sub: "max violation, first differing layer" }
    - { id: diff, kind: metric, label: "manifest diff", sub: "which field changed" }
  edges:
    - { from: man, to: ra, kind: dependency, label: "recorded before" }
    - { from: man, to: rb, kind: dependency }
    - { from: fx, to: ra }
    - { from: fx, to: rb }
    - { from: ra, to: byt }
    - { from: rb, to: byt }
    - { from: byt, to: bw, label: "yes" }
    - { from: byt, to: tol, kind: emphasis, label: "no" }
    - { from: tol, to: eq, kind: emphasis }
    - { from: eq, to: te, kind: emphasis, label: "yes" }
    - { from: eq, to: ne, label: "no" }
    - { from: man, to: diff, kind: dependency }
    - { from: diff, to: te, kind: dependency, label: "attribution" }
  groups:
    - { id: runs, label: "two runs, same device or declared devices" }
```

## Implementation

Framework: PyTorch (Model / autograd framework layer) exposes the seeding, deterministic-algorithm, cuDNN-benchmark, and reduced-precision-reduction switches used in line 1 [OFFICIAL-DOCUMENTATION — R3.11]; JAX's explicit keys make RNG state a value that is checkpointed like any array [OFFICIAL-DOCUMENTATION — R3.16]. Kernels: NVIDIA cuBLAS / cuBLASLt workspace configuration and NVIDIA cuDNN engine selection are the Kernels / numerics / collectives-layer sources [OFFICIAL-DOCUMENTATION — R3.13, R3.17]. Accelerator / driver / compiler: SM count, FMA, and `-ftz` are recorded from the CUDA toolkit [OFFICIAL-DOCUMENTATION — R3.25]. Memory: workspace configuration (documented ≈ 24 MiB for `:4096:8`). Communication: a second class of reduction-order nondeterminism arises in collectives and is developed in [§29.5](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-5-collective-communication.md) and [§30.6](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-6-recovery-and-reproducibility.md). Deployment: compile-cache and warmup effects on inference numerics are owned by [§28.6](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch28-frameworks-graph-compilers-and-runtime-integration/28-6-deployment-reproducibility.md).

```figure
id: fig-3.32
kind: hierarchy
title: Layers that fix the rounding sequence
caption: >-
  Each level can change the sequence of roundings without any change to the
  program text, and each has its own manifest fields. A seed pins only the
  top level. The emphasised level is where the two documented
  nondeterminism families live, atomics and engine selection. The bottom
  level is out of scope for a single device and is shown only to mark where
  the next class of reduction-order difference begins.
placement: inline
evidence: OFFICIAL-DOCUMENTATION
source: [R3.11, R3.13, R3.17, R3.25]
alt: >-
  Five levels from program to hardware, each with its manifest fields.
  Program and data: fixture hash, and seeds for Python, NumPy, torch CPU, each
  device and each worker. Model and autograd framework: version and commit,
  deterministic-algorithm flag, cudnn.benchmark, reduced-precision-reduction
  flags, autocast dtype. Kernels, numerics and collectives (emphasised):
  cuBLAS and cuBLASLt workspace configuration and stream count, cuDNN engine
  selection and its numerical notes, atomics in scatter-add and split-K.
  Accelerator, driver and compiler: architecture, SM count, driver, toolkit,
  FMA contraction, -ftz. Collectives across devices: a second reduction-order
  class, owned by §29.5 and §30.6.
spec:
  direction: down
  levels:
    - { label: "Program + data", kind: dataset, note: "fixture hash; seeds for python, numpy, torch CPU, each device, each worker" }
    - { label: "Model / autograd framework", kind: process, note: "version + commit; deterministic flag; cudnn.benchmark; reduction-precision flags; autocast" }
    - { label: "Kernels / numerics / collectives", kind: process, note: "cuBLAS workspace config and stream count; cuDNN engine choice; atomics (scatter-add, split-K)", emphasis: true }
    - { label: "Accelerator / driver / compiler", kind: hardware, note: "architecture, SM count, driver, toolkit; FMA contraction; -ftz flush-to-zero" }
    - { label: "Collectives across devices", kind: flow, note: "second reduction-order class; §29.5, §30.6, out of scope here" }
```

```text
Systems trace (one training step, sources of non-identity)
stage            → latency effect        / memory            / compute / communication / failure (non-identity source)
data loading     → none                  / none              / none    / none          / worker RNG order
embedding bwd    → atomics fast          / none              / same    / none          / atomic scatter order
GEMMs            → split-K faster        / +24 MiB if pinned / same    / none          / split-K / multi-stream order
attention kernel → engine-dependent      / engine-dependent  / same    / none          / cuDNN engine selection
softmax / norms  → deterministic         / none              / same    / none          / none (fixed order)
clip + optimizer → deterministic         / none              / same    / none          / none on one device
```

## Experimental design

Proposed: Experiment 3.6 in [verification.md](verification.md) runs Algorithm 3.13 under four settings: (a) deterministic flags on, single stream; (b) deterministic off; (c) deterministic on but a different SM-count device; (d) same as (a) with a CPU FP64 reference. Expected: (a) bitwise; (b) tolerance-equivalent with attribution to listed nondeterministic ops; (c) tolerance-equivalent with attribution to the device field; (d) tolerance-equivalent against FP64 by the verification tolerances. A rejection of (a) would indicate an unlisted nondeterministic path.

## Observations

**What the paper claims.** The PyTorch, cuBLAS, cuDNN, and CUDA documentation cited above state the guarantees and non-guarantees quoted in *Mechanism* [OFFICIAL-DOCUMENTATION — R3.11, R3.13, R3.17, R3.25].

**What the evidence shows.** The non-associativity of floating-point addition is a theorem; the documented list of nondeterministic operations is version-specific and is the vendor's own account, which this book has not independently audited.

**What we infer.** Because Eq. 3.9's bound is order-independent, tolerance-based equivalence is the correct correctness criterion for a step, and bitwise identity is a *configuration* achievable only by pinning every manifest field; chapters that claim bitwise reproduction must show the manifest [DERIVED].

**What remains unknown.** The throughput cost of deterministic mode on a given workload is UNVERIFIED here. Which cuDNN engine a heuristic selects on a given device and version is NOT-DISCLOSED without querying the numerical notes at runtime.

## Failure modes

> **Failure mode — Seed without state.** *Symptom:* resumed run diverges from the uninterrupted run at the resume step. *Cause:* RNG state not checkpointed, only the seed. *Detection:* compare dropout masks at the first resumed step. *Mitigation:* checkpoint all generator states ([§19.4](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-4-training-state-transitions.md)).

> **Failure mode — Hidden nondeterministic op.** *Symptom:* runs differ with all flags set. *Cause:* an operation without a deterministic implementation, or a custom kernel using atomics. *Detection:* `use_deterministic_algorithms` error or a per-layer localization (Algorithm 3.13 line 7). *Mitigation:* replace the op or accept tolerance equivalence with attribution.

> **Failure mode — Tolerance set from a passing run.** *Symptom:* tests never fail. *Cause:* rtol chosen to make the current run pass rather than derived from Eq. 3.9. *Detection:* tolerance far above γ_n. *Mitigation:* derive tolerances (verification.md), then record them.

> **Failure mode — Cross-device "regression".** *Symptom:* results change after a hardware upgrade with no code change. *Cause:* different SM count, FMA behavior, or kernel selection. *Detection:* manifest diff. *Mitigation:* declare equivalence by Eq. 3.22; re-baseline fixtures only with an FP64 reference.

## Siblings

**Bitwise reproducibility** — this section. Why it exists: debugging and audit. What assumption changed: every manifest field is pinned. What problem it solved: exact replay. What new failure mode it introduced: throughput loss; fragility to any environment change. Changed primitive: tolerance test → byte comparison.

**Tolerance-based equivalence** — this section. Why it exists: reduction-order nondeterminism is unavoidable across configurations. What assumption changed: correctness is a bound, not a value. What problem it solved: portable tests. What new failure mode it introduced: tolerances can be set too loosely. Changed primitive: byte comparison → Eq. 3.22.

**Statistical reproducibility over seeds** — [§6.4](../ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md). Why it exists: chaotic amplification makes step-level equivalence uninformative for run-level outcomes. What assumption changed: the quantity of interest is a distribution. Changed primitive: single-run comparison → confidence interval over seeds.

```figure
id: fig-3.33
kind: compare
title: Three meanings of "the same run"
caption: >-
  The columns are nested in what they tolerate, not ranked. Bitwise identity
  is a configuration, reached only by pinning every manifest field, and is
  lost to any environment change. Tolerance equivalence survives hardware
  changes because the Eq. 3.9 bound does not depend on order. Statistical
  reproducibility is the only one that says anything about a whole run once
  chaotic amplification has spread a 1-ulp difference.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-3.22", R3.11, R3.13]
alt: >-
  Comparison of bitwise reproducibility, tolerance-equivalent steps and
  statistical reproducibility over seeds. Assertion: byte equality of outputs
  and gradients; Eq. 3.22 for every output; a confidence interval over seeds
  (§6.4). Unit compared: one step; one step; a whole run. Must be pinned:
  every manifest field including SM count, stream count and workspace
  configuration; the formats and reduction lengths that set atol and rtol;
  the seed set and protocol. Survives a hardware change: no; yes, with
  attribution to the device field; yes. Catches: any change at all; errors
  above the derived bound; run-level shifts beyond seed variance. New failure
  mode: throughput loss and fragility; tolerances set too loosely; owned by
  §6.4. Used for: debugging and audit; portable correctness tests; run-level
  claims under chaotic amplification.
spec:
  axis: "What 'the same run' asserts on floating-point hardware, and what must be pinned for the assertion to hold"
  columns:
    - { id: bit, label: "Bitwise" }
    - { id: tol, label: "Tolerance-equivalent step" }
    - { id: stat, label: "Statistical over seeds", node: ms.section.6.4 }
  rows:
    - { dimension: "assertion", values: { bit: "bytes(y_A) = bytes(y_B) and bytes(g_A) = bytes(g_B)", tol: "Eq. 3.22 for every output", stat: "confidence interval over seeds (§6.4)" } }
    - { dimension: "unit compared", values: { bit: "one step", tol: "one step", stat: "a whole run" } }
    - { dimension: "must be pinned", values: { bit: "every manifest field: versions, SM count, streams, workspace config, flags", tol: "formats and reduction lengths, which set atol and rtol", stat: "the seed set and the protocol" } }
    - { dimension: "survives a hardware change", values: { bit: "no", tol: "yes, attributed to the device field", stat: "yes" } }
    - { dimension: "catches", values: { bit: "any change at all", tol: "errors above the derived bound", stat: "run-level shifts beyond seed variance" } }
    - { dimension: "new failure mode", values: { bit: "throughput loss; fragile to any environment change", tol: "tolerances set too loosely", stat: "owned by §6.4" } }
    - { dimension: "used for", values: { bit: "debugging and audit; Experiment 3.6 (a)", tol: "portable tests; Experiment 3.6 (b), (c)", stat: "run-level claims under chaotic amplification" } }
```

**Explicit-key RNG (JAX) vs global-stream RNG (PyTorch)** — this section; framework semantics in [§28.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch28-frameworks-graph-compilers-and-runtime-integration/28-1-framework-semantics.md). Why explicit keys exist: reproducible, parallelizable draws without hidden state. What new failure mode it introduced: key reuse produces correlated samples. Changed primitive: stateful generator → pure function of a key.

## Extensions

Distributed training adds collective reduction order and rank-dependent RNG ([§29.5](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-5-collective-communication.md), [§30.6](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-6-recovery-and-reproducibility.md)); compiled graphs add compile-cache identity ([§28.6](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch28-frameworks-graph-compilers-and-runtime-integration/28-6-deployment-reproducibility.md)); agent evaluations add environment nondeterminism ([§63.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-2-repeated-run-reliability.md), forward reference; path per manifest).

## Limitations

The random-rounding model of Eq. 3.23 is a heuristic used only to set expectations; acceptance uses the worst-case bound. The vendor statements quoted are for the versions accessed on 2026-09-20 and must be re-read for a pinned release. Falsification: a bitwise-identical pair of runs under setting (b) of Experiment 3.6 on a workload that uses atomics would show that the listed nondeterminism did not manifest, not that it cannot. Decision consequence: choose deterministic mode for correctness work and accept tolerance equivalence for production.

## Reproducibility

This section's own artifact is the manifest schema of Algorithm 3.13; the chapter's `manifest.json` ([README](README.md) artifact list) instantiates it. Unresolved: deterministic-mode cost (UNVERIFIED); engine selection internals (NOT-DISCLOSED).

## References

R3.11, R3.13, R3.16, R3.17, R3.25, R3.7.
