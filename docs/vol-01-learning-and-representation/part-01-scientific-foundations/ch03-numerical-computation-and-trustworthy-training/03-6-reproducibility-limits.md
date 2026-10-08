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
word_count_target: 2200
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 3.6 Reproducibility limits

## Scope

[DERIVED] Reproducibility requires a declared comparison unit: exact replay of an execution, numerical agreement of a particular computation, or reproducibility of a scientific conclusion across runs. This section identifies seeds, generator consumption, reduction schedules, backend selection, workspace policy, software versions, and hardware as separate state. It defines numerical comparisons without claiming that a format name supplies a complete training-error budget. Run-level uncertainty remains in [§6.4](../ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md); distributed recovery remains in Chapter 30.

## Why this exists

[OFFICIAL-DOCUMENTATION] PyTorch explicitly limits reproducibility across releases, commits, platforms, and CPU/GPU executions. Its deterministic controls cover documented operations and can incur workload-dependent performance costs. Therefore equal seeds alone do not establish equal execution, and a changed result alone does not identify a software defect. The precise operator and environment must be examined. [R3.35](references.md).

[MATHEMATICALLY-DERIVED] Non-associativity creates different valid results for different reduction trees. Nevertheless, an arbitrary difference is not excused by calling it rounding noise. Both computations must satisfy the premises of the relevant error analysis. Reduced operand precision, changed mask semantics, saturation, non-finite intermediates, or distinct objectives can invalidate a proposed comparison before the final tolerance test.

## Intuition

[DERIVED] Replaying a seed repeats a generator's initial state. Replaying a computation also repeats its sequence of draws, data order, kernels, scale updates, accepted optimizer steps, and stored state. A manifest documents these dependencies; it is evidence for diagnosis, not a causal proof. If two manifests match yet outputs differ, the possible result is unresolved attribution rather than an invented explanation.

## Formulation

[MATHEMATICALLY-DERIVED] A common elementwise comparison is

$$
|a_i-b_i|\le\mathrm{atol}+\mathrm{rtol}|b_i|\quad\forall i.
$$
*(Eq. 3.22)* This reference-relative relation is generally asymmetric and nontransitive, so "within tolerance" is more precise than mathematical equivalence. Near-zero reference entries require an absolute error budget. If a scalar sum is bounded by $\gamma_k\sum|x_i|$, its absolute tolerance is that quantity; multiplying by another output roundoff factor would wrongly shrink it.

[MATHEMATICALLY-DERIVED] If two implementations evaluate the same exact target $y$ and satisfy $|\widehat y_A-y|\le B_A$, $|\widehat y_B-y|\le B_B$, then triangle inequality gives $|\widehat y_A-\widehat y_B|\le B_A+B_B$. This conclusion requires justified budgets for both complete computations. A sum's $\gamma_k$ bound is not automatically a bound for softmax, normalization, a backward graph, or a training trajectory.

```figure
id: fig-3.29
kind: chart
title: Conditional scalar-sum budgets against reduction length
caption: >-
  Eq.3.9 applied only to finite scalar sums under its rounding premises and
  ku < 1. Two valid implementations' absolute budgets add by triangle
  inequality. These curves are not end-to-end model or gradient tolerances.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.9", "DERIVED:eq-3.22"]
alt: >-
  FP32 sequential-sum error budget divided by the sum of input magnitudes,
  plotted over reduction lengths128 through 65536. A second curve doubles
  that conditional budget for two computations of the same exact sum.
spec:
  type: line
  x: { label: "reduction length n", scale: log2, format: integer, domain: [128, 65536] }
  y: { label: "absolute budget / sum of magnitudes", scale: log10, format: raw }
  series:
    - { id: one, label: "one sequential sum, gamma_(n-1)", formula: "(x-1)*2^-24/(1-(x-1)*2^-24)" }
    - { id: two, label: "two such sums, 2gamma_(n-1)", formula: "2*(x-1)*2^-24/(1-(x-1)*2^-24)" }
```

[MATHEMATICALLY-DERIVED] Let exact state updates be $z_{t+1}=F_t(z_t)$ and computed updates $\widehat z_{t+1}=F_t(\widehat z_t)+\delta_t$. If $F_t$ is Lipschitz with constant $L_t$ on the states traversed and $\|\delta_t\|\le\epsilon_t$, then

$$
\|e_{t+1}\|\le L_t\|e_t\|+\epsilon_t,
\qquad
\|e_T\|\le\Big(\prod_{j=0}^{T-1}L_j\Big)\|e_0\|
+\sum_{t=0}^{T-1}\epsilon_t\prod_{j=t+1}^{T-1}L_j.
$$
*(Eq. 3.23)* The premises include all optimizer and scale state in $z$. They are not estimates of a particular model's sensitivity. Discontinuous routing or changed control flow may invalidate the local Lipschitz description. The equation shows why a one-reduction error bound cannot certify a long training run without additional sensitivity information.

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] PyTorch documents separate seeding of its generators, Python randomness, and NumPy generators, including worker-specific data-loading patterns. JAX exposes explicit immutable keys: drawing with a key does not mutate it, and independent draws require suitable splitting. Both designs require correct consumption semantics. Reusing a JAX key repeats its draw; reseeding a stateful generator at the wrong boundary can also repeat draws unintentionally. [R3.35, R3.47](references.md).

[DERIVED] Store realized inputs when the purpose is numerical comparison. A changed RNG implementation then does not silently change the tested data. For exact resume, seeds are insufficient: store generator state or explicit keys, iterator position, model/optimizer/scaler state, and accepted-update counters. A consumed-but-skipped effective batch must be distinguishable from an accepted update. Detailed restart transactions belong to Chapter 19 and Chapter 30.

[OFFICIAL-DOCUMENTATION] PyTorch distinguishes deterministic algorithm selection from deterministic execution. Disabling cuDNN benchmarking stabilizes selection behavior but does not itself guarantee the chosen algorithm is deterministic. `torch.use_deterministic_algorithms(True)` requests deterministic implementations and errors on documented unsupported nondeterministic operations. This does not prove custom extensions or every external library path deterministic. [R3.35](references.md).

[OFFICIAL-DOCUMENTATION] cuBLAS13.4 scopes its bitwise reproducibility guarantee to a given toolkit, GPU architecture, and SM count, with exceptions for concurrent streams, fixed-point emulation, and selected atomic routines. It documents separate workspaces/handles, user-owned cuBLASLt workspace, or workspace environment settings as relevant remedies. `:4096:8` adds approximately 24MiB of library footprint. These are library-specific conditions, not a guarantee for the complete training program. [R3.13, §2.1.4](references.md).

[OFFICIAL-DOCUMENTATION] NVIDIA's floating-point note compares serial separate multiply/add, FMA, and tree dot products. All can use IEEE arithmetic and produce different rounded results. Compiler controls for contraction, division, square root, and subnormal handling change the execution contract. Some historical CPU statements in that note describe older targets and are not adopted as general 2026 hardware claims. Actual instruction/compiler behavior must be recorded. [R3.25, §§3–5](references.md).

[DERIVED] A numerical manifest therefore records more than dtype: framework build/commit; driver, toolkit, math libraries; device architecture and SM count; shapes/strides and hashes; autocast and operator precision; TF32/reduced-reduction/split-K controls; compiler flags; kernel/backend choice; stream/workspace policy; seeds and state hashes; scale recipes; and objective normalization. An unspecified field stays unspecified. A broad name such as "CUDA" cannot identify the numerical implementation.

```figure
id: fig-3.30
kind: stat-panel
title: What pinning the rounding sequence costs
caption: >-
  The documented documented library controls and their scoped guarantees, with the cost each one
  states. Only one cost is quantified in the documentation read for this
  chapter, the ≈ 24 MiB workspace of :4096:8. The deterministic-mode slowdown
  is workload-specific and stays UNVERIFIED here. Note the scope of cuBLAS's
  guarantee. It holds for the same toolkit, architecture and SM count, with additional stream, workspace, emulation, and atomic-routine conditions.
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
  is UNVERIFIED. RNG-state storage depends on the generator implementation, and
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

[DERIVED] Deterministic modes can constrain available kernels and add workspace; their slowdown depends on the workload and measurement boundary. Stored intermediates for first-divergence diagnosis add memory and may change scheduling. A comparison should distinguish a minimally instrumented run from a diagnostic replay. Energy, cost, and application throughput remain unmeasured unless a concrete protocol records them; the documented workspace allocation is the only quantitative cost used here.

## Algorithm

[DERIVED] The comparison procedure permits unresolved attribution. It also treats identical output bytes as evidence about the inspected executions, rather than proof that all future schedules are deterministic.

```text
Algorithm 3.13 — Reproducibility comparison and diagnostic record
INPUT  program, stored initial state, manifest and justified budgets
OUTPUT  pair-specific comparison and supported or unresolved attribution
STATE  fresh process executions and diagnostic records
INVARIANT  comparison targets the same declared objective and stored inputs
1. record environment, operation contracts, input/state hashes, and tolerances
2. run A from stored initial state; capture outputs and state-transition record
3. run B in a fresh process from the same stored initial state
4. if matching output/state bytes: report bitwise identity for this pair
5. else:
6.     compare finite-status masks and independently justified numeric budgets
7.     report within budget, outside budget, or no justified budget
8.     locate first differing intermediate using a controlled diagnostic replay
9.     record candidate environment/operation differences
10.     test one candidate at a time when feasible; otherwise attribution unresolved
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: two executions plus bounded tensor comparisons and diagnostic replay
```

```figure
id: fig-3.31
kind: diagram
title: Two-run comparison with potentially unresolved attribution, Algorithm 3.13
caption: >-
  The manifest is written before either run starts, to expose candidate sources of differences. A byte-equal pair ends the algorithm at
  bitwise. Otherwise a justified complete-computation budget is required. Missing premises and causal attribution can remain unresolved. A failure is localised to the first layer where stored intermediates
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
  bitwise. If no, the emphasised path requires a justified complete-computation budget, using Eq.3.9 only where its premises apply and tests Eq. 3.22 on all outputs.
  If it holds, the verdict is within declared budget, with candidate causes recorded and unresolved attribution permitted. If it fails, the
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
    - { id: bw, kind: state, label: "bitwise", sub: "identity of this observed pair" }
    - { id: tol, kind: process, label: "derive atol, rtol per output", sub: "complete error budget or explicit gap" }
    - { id: eq, kind: branch, label: "Eq. 3.22 holds for all outputs?", sub: "line 6" }
    - { id: te, kind: state, label: "within declared budget", sub: "causal attribution may remain unresolved" }
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
    - { from: diff, to: te, kind: dependency, label: "candidate causes" }
  groups:
    - { id: runs, label: "two runs, same device or declared devices" }
```

## Implementation

[OFFICIAL-DOCUMENTATION] Current PyTorch numerical-accuracy documentation distinguishes input precision, reduced-precision accumulation, split-K choices, and operation-specific backend behavior. These fields belong in the manifest even when the declared tensor dtype is unchanged. cuDNN's graph API exposes numerical notes for engine configurations, including nondeterminism, so a heuristic engine choice should be recorded where available. [R3.33, R3.17](references.md).

[DERIVED] Compare forward values, gradients, optimizer state, and accepted-update decisions at separate boundaries. Equal logits with different gradients do not establish step agreement. Equal parameters after a skipped update do not establish equal scaler or data-consumption state. At the other extreme, different strides or metadata do not necessarily imply a different mathematical tensor; byte comparisons require a declared serialization and canonical layout.

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

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] NVIDIA's floating-point note contains worked dot-product comparisons using distinct serial, FMA, and parallel organizations, plus a historical CPU math-library/compiler example. Their purpose is to demonstrate that operation organization and implementation can change numerical results. The historical compiler/hardware settings are not 2026 performance measurements. [R3.25, §§3,5](references.md).

[PAPER-REPORTED] The log-sum-exp study examined in §3.2 compares numerical algorithms on logits from a trained MNIST classifier, using lower-precision evaluation against FP32 results. That protocol isolates arithmetic on fixed inputs rather than allowing different training randomness to change the inputs. Its numerical findings remain source-specific; it is not an experiment on the reproducibility of full training trajectories. [R3.26, §5](references.md).

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The inspected framework/library texts state scoped determinism guarantees, explicit exclusions and worked arithmetic comparisons. They do not promise cross-version identity of a complete training run. [R3.35; R3.13 section 2.1.4; R3.25 sections 3/5](references.md).

**What the evidence shows.** [DERIVED] Those guarantees delimit supported configurations; no fresh-process or cross-device comparison was run for this revision. A matching manifest is not an independent execution result.

**What we infer.** [MATHEMATICALLY-DERIVED] A repeated wrong arithmetic schedule is deterministic but inaccurate. Different schedules can meet justified budgets. A changed environment field is a candidate cause; causal attribution needs controlled substitution or an inspected mechanism explaining first divergence.

**What remains unknown.** [UNVERIFIED] Composite budgets, actual deterministic-mode cost, hidden kernel selection and causes of an unobserved execution difference remain unresolved. Equation3.23 does not supply unmeasured model sensitivity constants.

## Failure modes

[DERIVED] Storing only seeds breaks exact resume when draw consumption differs. Disabling benchmarking without requiring deterministic algorithms leaves a selection/execution gap. Calling every discrepancy harmless rounding can conceal a changed objective. Fitting tolerances to the current result makes the test circular. Assuming deterministic flags guarantee cross-release equality exceeds the documented scope. Each failure is detected by examining the contract boundary it changes.

[MATHEMATICALLY-DERIVED] Relative gradient error $\|g-g_*\|/\|g_*\|$ becomes undefined or unstable near a zero reference gradient. Use an absolute criterion or a scale based on the actual terms and sensitivity analysis. A tiny absolute perturbation can also cross a routing or clipping boundary; the subsequent state sequence then requires a control-flow analysis, not merely a larger reduction tolerance.

## Siblings

[DERIVED] Bitwise replay compares exact states of declared executions. Numerical agreement compares declared quantities under justified budgets. Statistical reproducibility compares an estimated effect or distribution under a full experimental protocol. These criteria answer different questions; they are not a nested ranking and one does not automatically establish another.

```figure
id: fig-3.33
kind: compare
title: Three meanings of "the same run"
caption: >-
  The columns answer distinct questions and are not nested guarantees. Bitwise identity
  compares an observed pair; environment pinning supports guarantees only within their stated scope. A hardware change requires renewed checking of every error-bound premise. Statistical reproducibility concerns declared run-level estimates.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-3.22", R3.11, R3.13]
alt: >-
  Comparison of bitwise reproducibility, within-budget steps and
  statistical reproducibility over seeds. Assertion: byte equality of outputs
  and gradients; Eq. 3.22 for every output; a confidence interval over seeds
  (§6.4). Unit compared: one step; one step; a whole run. Must be pinned:
  every manifest field including SM count, stream count and workspace
  configuration; the formats and reduction lengths that set atol and rtol;
  the seed set and protocol. Survives a hardware change: no; requires justified budgets and causal evidence; yes. Catches: any change at all; errors
  above the derived bound; run-level shifts beyond seed variance. New failure
  mode: throughput loss and fragility; tolerances set too loosely; owned by
  §6.4. Used for: debugging and audit; portable correctness tests; run-level
  claims under chaotic amplification.
spec:
  axis: "What 'the same run' asserts on floating-point hardware, and what must be pinned for the assertion to hold"
  columns:
    - { id: bit, label: "Bitwise" }
    - { id: tol, label: "Within-budget computation" }
    - { id: stat, label: "Statistical over seeds", node: ms.section.6.4 }
  rows:
    - { dimension: "assertion", values: { bit: "bytes(y_A) = bytes(y_B) and bytes(g_A) = bytes(g_B)", tol: "Eq. 3.22 for every output", stat: "confidence interval over seeds (§6.4)" } }
    - { dimension: "unit compared", values: { bit: "one step", tol: "one step", stat: "a whole run" } }
    - { dimension: "must be pinned", values: { bit: "every manifest field: versions, SM count, streams, workspace config, flags", tol: "complete operation-error premises and justified budgets", stat: "the seed set and the protocol" } }
    - { dimension: "survives a hardware change", values: { bit: "not guaranteed", tol: "requires renewed premise checking", stat: "requires the declared statistical protocol" } }
    - { dimension: "catches", values: { bit: "any changed compared output byte", tol: "errors above the derived bound", stat: "run-level shifts beyond seed variance" } }
    - { dimension: "new failure mode", values: { bit: "throughput loss; fragile to any environment change", tol: "tolerances set too loosely", stat: "owned by §6.4" } }
    - { dimension: "used for", values: { bit: "debugging and audit; Experiment 3.6 (a)", tol: "portable tests; Experiment 3.6 (b), (c)", stat: "run-level claims under chaotic amplification" } }
```

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Explicit PRNG keys make random dependencies visible values, while deterministic-operation controls and library workspace contracts make other execution choices inspectable. These mechanisms improve diagnosability when used together with stored inputs and complete state. They do not remove the need to track operation order, version changes, and unsupported kernels. [R3.47, R3.35, R3.13](references.md).

[DERIVED] Distributed collectives add topology- and rank-dependent reduction schedules. Compiled graphs add compiler transformations and cache identity. Their canonical treatments are Chapters29/30 and28. Extending the manifest requires these additional execution states rather than extrapolating the single-device guarantees.

## Limitations

[UNVERIFIED] No two-run or cross-device comparison was executed for this revision. No universal end-to-end tolerance or deterministic-mode speed ratio is supplied. An unmeasured long-horizon amplification constant cannot be filled in from unit roundoff. The source guarantees are confined to the exact inspected documentation surfaces and their stated conditions.

## Reproducibility

[DERIVED] [verification.md](verification.md) specifies proposed comparisons, counterexamples, and unresolved evidence. A future report must retain failures without causal attribution and comparisons for which no justified bound exists. Updating a baseline requires explaining changed state or semantics rather than accepting a new output because it is repeatable.

## References

[DERIVED] Primary and official locators: [R3.33/R3.35, R3.13, R3.47, R3.17, R3.25–26](references.md), inspected2026-10-07.
