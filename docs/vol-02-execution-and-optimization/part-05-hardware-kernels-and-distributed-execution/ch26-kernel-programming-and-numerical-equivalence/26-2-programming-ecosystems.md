---
id: ms.section.26.2
entity_type: section
title: Programming ecosystems
short_title: Programming ecosystems
volume: 2
part: 5
chapter: 26
section: 26.2
slug: 26-2-programming-ecosystems
parent: ms.chapter.26
prev_sibling: ms.section.26.1
next_sibling: ms.section.26.3
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
word_count_target: 1800
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 26.2 — Programming ecosystems

## Scope

[DERIVED] Compare interfaces at the level of responsibility they expose: logical work, tensor layout, instruction selection, synchronization, compilation and framework integration. CUDA, HIP/ROCm, Triton, CUTLASS/CuTe, CuTeDSL, Pallas, TileLang and ThunderKittens are distinct interfaces, not interchangeable spellings of a GPU kernel. The target is an auditable implementation choice for a declared operator and deployment envelope; this section makes no language ranking.

## Why this exists

[OFFICIAL-DOCUMENTATION] The inspected window contains a new CUDA Tile interface, TileLang's CuTeDSL backend disclosure, ThunderKittens 2.0 and PyTorch 2.14's integration of CuTeDSL-generated GEMM candidates. These developments cross abstraction boundaries: a framework compiler may select a kernel generated through another DSL. [R26.2], “CUDA Tile programming”; [R26.7], README “Latest News”; [R26.8], release introduction; [R26.11], “NVGEMM, a CuTeDSL GEMM Backend for Inductor”.

[DERIVED] A useful comparison must separate the frontend notation from the generated instruction path. Two interfaces can share a backend while exposing different layout obligations. Conversely, one interface can target multiple devices while requiring different schedules on each. “Written in Python” does not determine whether a kernel is traced, template-specialized, compiled through MLIR, dispatched to a library, or executed by an interpreter. The cost of adopting an interface includes the correctness proof and integration boundary it leaves with the author.

## Intuition

[MATHEMATICALLY-DERIVED] Let an implementation be a tuple $e=(\mathcal I,\mathcal L,\mathcal S,\mathcal B,\mathcal A)$: input contract, layout map, schedule, backend and ABI. Two programs compute the same mathematical function only when their input contracts overlap and their schedules preserve the same semantic dependencies. Matching a function name supplies none of these conditions. Portability is the existence of a valid tuple on another target; performance portability additionally constrains its resource cost. That distinction explains why a source-compatible rewrite can remain slower, numerically different, or unsupported for a useful shape.

## Formulation

| Symbol | Meaning |
|---|---|
| $\mathcal D$ | Deployment input envelope: shapes, dtypes, strides, aliasing, devices |
| $\mathcal E$ | Candidate interface/backend configurations |
| $v_e(x)$ | Whether configuration $e$ is valid for input $x$ |
| $\epsilon_e(x)$ | Declared numerical deviation from a reference |
| $t_e(x),m_e(x)$ | Complete-operator duration and peak auxiliary storage |
| $\pi(x)$ | Declared workload distribution; not inferred from examples |
| $c_e$ | Integration and compilation budget in declared units |

[MATHEMATICALLY-DERIVED] An interface-selection problem can be written

$$
\min_{e\in\mathcal E}\ \mathbb E_{x\sim\pi}t_e(x)
\quad\text{subject to}\quad
\forall x\in\mathcal D:\ v_e(x)=1,\ \epsilon_e(x)\leq\tau(x),\ m_e(x)\leq M,\ c_e\leq C_e.
$$

*(Eq. 26.2)*

This is a book-defined decision model. Integration cost is not automatically commensurate with seconds; use a constrained budget or explicitly priced objective. Undefined latency for an unsupported input must not disappear from an average. A fallback can make the composite implementation valid, but its cost belongs in $t_e$.

## Mechanism

[OFFICIAL-DOCUMENTATION] **CUDA** supplies a thread-oriented programming/runtime interface in the *Accelerator / driver / compiler* layer. CUDA 13.1 separately introduces **CUDA Tile**, whose tile operations let compilation choose lower-level execution mappings. Its first disclosure lists specific supported compute capabilities; that list is not permission to treat every NVIDIA architecture as supported. **HIP/ROCm** supplies a C++-oriented accelerator runtime/programming model with explicit thread hierarchy and device memory. HIP source compatibility does not document identical hardware group sizes or tensor instructions. [R26.2], “In this first version”; [R26.4], “Device programming” and “Memory model”.

[OFFICIAL-DOCUMENTATION] **Triton language**, in *Kernels / numerics / collectives*, expresses programs over blocks and compiles device-specific layouts and operations. Its 3.6 release distinguishes frontend, compiler, NVIDIA backend, AMD backend and Gluon layout changes. **CUTLASS/CuTe** exposes C++ templates and layout/tensor/hardware-operation abstractions; **CuTeDSL** exposes related concepts through Python-generated IR and JIT compilation. Its pinned 4.3.5 overview explicitly separates this interface from the complete CUTLASS C++ library and profiler. [R26.3], release structure; [R26.5], “Core CuTe DSL Abstractions” and “Relationship to CUTLASS C++”.

[DERIVED] These distinctions change what needs inspection. A thread-oriented kernel requires an explicit lane ownership and barrier analysis. A block-oriented DSL requires inspection of how the compiler distributed values and inserted synchronization. A template library instance requires its layout, architecture tag, epilogue and alignment conditions. A low-level DSL does not eliminate the need to inspect instructions; it makes some of their selection decisions programmable in another notation. The comparison axis is where the decision is made and whether it can be recovered from the artifact.


```figure
id: fig-26.6
kind: diagram
title: Interface to executable provenance
caption: A frontend name is only one stage in the path. Layout, lowering, target code and the framework binding
  remain independent objects that must be preserved in the provenance record.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.2
alt: A frontend name is only one stage in the path. Layout, lowering, target code and the framework binding remain
  independent objects that must be preserved in the provenance record.
concepts:
- ms.section.26.2
spec:
  direction: LR
  nodes:
  - id: f
    kind: process
    label: Frontend contract
  - id: l
    kind: tensor
    label: Logical and physical layouts
  - id: ir
    kind: process
    label: Intermediate representation
  - id: be
    kind: process
    label: Backend and assembler
  - id: bin
    kind: memory
    label: Target binary
  - id: abi
    kind: boundary
    label: Framework and stream ABI
  edges:
  - from: f
    to: l
  - from: l
    to: ir
  - from: ir
    to: be
  - from: be
    to: bin
  - from: bin
    to: abi
    kind: emphasis
```


[OFFICIAL-DOCUMENTATION] **Pallas**, routed through **JAX** in the *Model / autograd framework* layer, uses grids, block specifications and mutable buffer references inside a kernel boundary. The inspected JAX 0.9.0 snapshot describes GPU and TPU memory interpretations separately and marks the API experimental. **TileLang** uses tile operations with TVM-derived compiler infrastructure; its 0.1.8 pinned example exposes shared and fragment allocations, a pipelined depth loop and target selection. Its December 18, 2025 backend disclosure is within the requested source window. [R26.6], Pallas “Block specs by example”; [R26.7], README “Quick Start” and “Latest News”.

[OFFICIAL-DOCUMENTATION] **ThunderKittens** is a CUDA-embedded tile interface. The February 19, 2026 originating release deep dive discusses memory consistency, tensor-memory pipelining, assembler behavior and occupancy. The important evidence is the specific instruction and dependency reasoning, not the adjective in its performance claim. [R26.8], “Memory consistency” through “Occupancy”. Pallas is routed through the reference stack's JAX entry and CuTeDSL through its NVIDIA CUTLASS entry. TileLang and ThunderKittens are not separately enumerated among the fifty systems; their inclusion is justified by this chapter's explicit plan matrix and kernel-programming anchor.

[DERIVED] A deployment path is not identified until host integration is resolved. Who owns the tensor allocation? Which stream receives the launch? Is a temporary allocation legal during graph capture? Is the output aliased? Does the framework know the backward rule and fake/meta shape behavior? These questions can dominate whether an elegant kernel is usable. Section [§28.5](../ch28-frameworks-graph-compilers-and-runtime-integration/28-5-integration-boundaries.md) owns the full integration contract. Here the kernel author's deliverable includes enough metadata to make that boundary explicit.


```figure
id: fig-26.7
kind: compare
title: Responsibility exposed by three interface levels
caption: This is a book-authored responsibility comparison, not a benchmark. A higher-level interface moves decisions
  into compilation but does not remove their semantic obligations.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.2
alt: This is a book-authored responsibility comparison, not a benchmark. A higher-level interface moves decisions
  into compilation but does not remove their semantic obligations.
concepts:
- ms.section.26.2
spec:
  axis: Where ownership, layout and target decisions must be specified or inspected
  columns:
  - id: thread
    label: Thread-oriented
  - id: block
    label: Block-oriented DSL
  - id: tile
    label: Hardware tile interface
  rows:
  - dimension: Logical ownership
    values:
      thread: Explicit thread indices
      block: Program/block map
      tile: Tile partition and atom mapping
  - dimension: Physical layout
    values:
      thread: Explicit accesses plus compiler
      block: Inferred or constrained layouts
      tile: Often directly programmable
  - dimension: Synchronization
    values:
      thread: Explicit scoped primitives
      block: Compiler plus exposed operations
      tile: Pipeline/barrier protocol
  - dimension: Portability evidence
    values:
      thread: Retarget and validate
      block: Backend-specific validation
      tile: Target-specific instruction support
```


[DERIVED] Cross-interface resource accounting should separate device and host components. Device work includes arithmetic, address generation, transfers, synchronization and spills. Host work includes tracing, specialization, code generation, compilation, autotuning and dispatch. Shared code-generation infrastructure does not make these costs equal: one route may compile thousands of candidates, another select a prebuilt instance. Object size and cache storage matter when a shape-rich application creates many variants. Network traffic is absent from a single-device primitive but can enter through an explicit multi-device extension; do not infer that extension from a project name.

[MATHEMATICALLY-DERIVED] For a deliberately serialized interface boundary, let $P$ be one-time preparation seconds, $H$ host binding/dispatch seconds per call, $D>0$ device execution seconds per call, and $n\geq1$ identical calls. Assume preparation precedes execution and host/device work does not overlap. Then

$$
T_{\rm boundary}=P+n(H+D),\qquad
f_{\rm boundary}=\frac{P+nH}{P+n(H+D)}.
$$

*(Eq. 26.12)*

The numerator counts preparation and recurring host work; it excludes device execution. Increasing reuse amortizes $P/n$ but cannot remove $H$ under these assumptions. Even as $n\to\infty$, the fraction tends to $H/(H+D)$. This explains why selecting the fastest device kernel can fail to select the fastest complete operator. With asynchronous overlap, queues, graph replay, variable shapes or multiple streams, replace this sum by a dependency-aware schedule rather than presenting it as observed wall time. The controls use assumed durations, not timings from any named interface.

```figure
id: fig-26.21
kind: calculator
title: Preparation and the recurring interface boundary
caption: Change preparation, host dispatch, device execution and reuse. The additive model assumes serialized work; its boundary fraction includes preparation and host work only. All durations are illustrative inputs, not a benchmark.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-26.12
alt: Adjustable preparation and per-call durations reveal complete time and the fraction spent preparing or dispatching rather than executing the device operator.
concepts: [ms.section.26.2]
spec:
  tex: 'T=P+n(H+D),\qquad f=(P+nH)/T'
  equation: '26.12'
  inputs:
    - symbol: P
      label: One-time preparation
      default: 2
      min: 0
      max: 60
      step: 0.5
      format: seconds
    - symbol: H
      label: Host binding and dispatch per call
      default: 0.00002
      min: 0
      max: 0.001
      step: 0.000001
      format: seconds
    - symbol: D
      label: Device execution per call
      default: 0.00008
      min: 0.000001
      max: 0.01
      scale: log10
      format: seconds
    - symbol: n
      label: Calls sharing preparation
      default: 10000
      min: 1
      max: 1000000
      step: 1
      options: [1, 10, 100, 1000, 10000, 100000, 1000000]
      format: integer
  outputs:
    - symbol: T
      label: Complete serialized time
      formula: 'P+n*(H+D)'
      format: seconds
      emphasis: true
    - symbol: host
      label: Recurring host time
      formula: 'n*H'
      format: seconds
    - symbol: device
      label: Device execution time
      formula: 'n*D'
      format: seconds
    - symbol: boundary
      label: Preparation and host fraction
      formula: '(P+n*H)/(P+n*(H+D))'
      format: percent
  presets:
    - label: Reuse preparation more
      values: {P: 2, H: 0.00002, D: 0.00008, n: 100000}
    - label: Remove recurring host work
      values: {P: 2, H: 0, D: 0.00008, n: 10000}
```

## Algorithm

[DERIVED] The interface audit is a finite rejection procedure. Inputs are a required envelope $\mathcal D$, finite candidate set $\mathcal E$ and numerical policy $\tau$. Output is a set of admissible routes and an evidence ledger, not an unmeasured winner.

$$
\begin{aligned}
(1)&\quad\mathcal A\gets\varnothing;\quad\text{for each }e\in\mathcal E\text{ execute }(2)\text{--}(5).\\
(2)&\quad\mathcal D_e\gets\operatorname{DocumentedDomain}(e);\quad\mathcal D\nsubseteq\mathcal D_e\Rightarrow\operatorname{requireFallback}(e).\\
(3)&\quad\mathcal L_e,\mathcal S_e,\mathcal B_e,\mathcal A_e\gets\operatorname{InspectArtifact}(e).\\
(4)&\quad\operatorname{unknown}(\mathcal A_e)\lor\neg\operatorname{ValidDependencies}(\mathcal S_e)\Rightarrow\{\operatorname{reject}(e);\ \mathrm{continue}\}.\\
(5)&\quad\operatorname{CoverageJustified}(e,\mathcal D)\land\operatorname{ReferencePass}(e,\mathcal D_{\rm test},\tau)\land\operatorname{IntegrationPass}(e)\Rightarrow\mathcal A\gets\mathcal A\cup\{e\}.\\
(6)&\quad\text{stop after }|\mathcal E|\text{ candidates; return }\mathcal A\text{ and all rejection reasons.}
\end{aligned}
$$

Steps requiring execution remain unexecuted in this edition. Finite reference tests alone cannot establish the universal quantifier in Eq. 26.2. Coverage needs a documented or proved applicability predicate plus guards and a qualified fallback; unexplained cells remain unresolved. Inspection cannot populate execution results with “pass.” The invariant is that admissible candidates retain both a semantic contract and a recorded integration boundary. The procedure's metadata work is $O(|\mathcal E||\mathcal D_{\rm test}|)$ for a finite test matrix; actual compilation and execution costs are candidate-dependent and must be measured separately.

## Implementation

[DERIVED] Use source-pinned manifests rather than a single package version. Record frontend package, backend compiler revision, CUDA/HIP runtime, assembler, target architecture, generated binary hash, framework binding and fallback. A header-only C++ interface still depends on its host compiler and toolkit. A Python package version does not identify its bundled compiler submodule automatically. For a tile interface, archive logical and inferred layouts when available; for a library dispatch, archive the selected algorithm identifier and workspace requirement. These are different artifacts with different failure boundaries.


```figure
id: fig-26.8
kind: systems-trace
title: Interface adoption through the complete operator
caption: Compilation, binding and fallback are included as distinct stages. Device-only timing does not account
  for cold compilation or a host-side synchronization inside the binding.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.2
alt: Compilation, binding and fallback are included as distinct stages. Device-only timing does not account for
  cold compilation or a host-side synchronization inside the binding.
concepts:
- ms.section.26.2
spec:
  columns:
  - latency
  - memory
  - compute
  - communication
  - failure
  stages:
  - name: Specialize
    values:
      latency: Cold-path cost
      memory: IR and cache entries
      compute: Compile-time decisions
      communication: No network assumed
      failure: Unbounded variant count
  - name: Generate and assemble
    values:
      latency: Cold-path cost
      memory: Binary and debug data
      compute: Backend transformations
      communication: No network assumed
      failure: Unsupported target feature
  - name: Bind and dispatch
    values:
      latency: Host per-call cost
      memory: Workspace and tensor owners
      compute: Metadata and guards
      communication: Stream dependency
      failure: Wrong stream or alias contract
  - name: Execute or fallback
    values:
      latency: Complete-operator time
      memory: All temporaries included
      compute: Chosen kernel or reference
      communication: Declared device boundary
      failure: Silent dtype conversion
```


[DERIVED] An authoring interface does not itself determine parameter count, valid tokens, FLOPs or traffic: the selected schedule and operator contract do. Compare complete executables including compilation, workspace, conversions and dispatch, while keeping logical work fixed. Cross-device communication is not inherent to selecting a kernel DSL; any runtime transfer remains in the measured boundary. Developer effort, power, joules and financial cost are UNVERIFIED rather than inferred from syntax length or a vendor speed chart.

## Experimental design

[OFFICIAL-DOCUMENTATION] ThunderKittens' 2026 deep dive reports using identical inputs across compared kernels, 500 warmup iterations, 100 profiling iterations, cache-evicting input groups and two events surrounding the full sequence. This describes its own benchmark convention, not an independently reproduced result. [R26.8], “Benchmarking GPU kernels properly”, Figure 1 caption. [NOT-DISCLOSED] The chapter has no matched study spanning all eight interfaces, identical numerical policies, compilation budgets and device families.

[ASSUMED] A proposed comparison first implements one fixed operator contract, then separates cold compilation, tuning, warm operator time and binding overhead. Hold input bytes, dtype, accumulation policy, cache regime and synchronization boundary fixed. Report unsupported cells explicitly and measure fallback cells. Repeat on at least two architecture families only if both are available; absence of a second family limits the portability claim rather than authorizing simulated measurements.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The inspected releases document different abstraction and backend responsibilities. ThunderKittens supplies a first-party benchmark protocol for its kernels; none supplies a common eight-interface ranking.

**What the evidence shows.** [DERIVED] The primary artifacts make interface distinctions inspectable. A project's ability to express a kernel does not establish that a particular generated instance is valid or fast.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 26.2 makes coverage a hard condition. A lower average over only supported shapes is insufficient when deployment requires the omitted shapes.

**What remains unknown.** [UNVERIFIED] Comparative integration effort, full deployment latency, energy, maintenance cost and cross-device correctness are not measured here.

## Failure modes

[DERIVED] Common category errors include equating Python syntax with high abstraction, treating a backend's capability as a frontend guarantee, assuming a library example includes every shape, and assuming an accepted compilation means the framework will differentiate it. A version upgrade may fix one resource issue while invalidating a private ABI. A fallback that casts dtype silently can change the numerical contract. An interface audit must reject these ambiguities rather than hiding them behind “portable.”

## Siblings

[DERIVED] CUDA/HIP expose thread execution; Triton/Pallas/TileLang expose block computations with different compiler obligations; CUTLASS/CuTe/CuTeDSL/ThunderKittens expose different degrees of layout and hardware control. This differential is about responsibility, not a universal speed hierarchy. The core-operator contracts in [§26.3](26-3-core-operators.md) provide a common problem on which to compare these routes.

## Extensions

[OFFICIAL-DOCUMENTATION] PyTorch 2.14 allows NVGEMM-generated candidates to participate in Inductor selection. [R26.11], NVGEMM heading. [DERIVED] This shifts the deployment choice from selecting one DSL globally to selecting valid candidates locally; the compiler still needs trustworthy shape, dtype, epilogue and workspace contracts.

## Limitations

[DERIVED] The interface matrix is not exhaustive and does not claim all listed routes share a release cadence or stability policy. Version-pinned artifacts explain the examined release; they do not establish novelty of established mechanisms or guarantee compatibility with later packages.

## Reproducibility

[DERIVED] Keep failed candidates and exact rejection reasons. Record documentation version separately from executable version. Do not upgrade “experimental,” “preview,” or “API unstable” to production guarantees in the manuscript. All comparisons remain proposed until the environment and output artifacts exist.

## References

[R26.2] CUDA 13.1; [R26.3] Triton 3.6; [R26.4] HIP 7.2; [R26.5] CUTLASS/CuTeDSL 4.3.5; [R26.6] JAX 0.9.0 Pallas snapshot; [R26.7] TileLang 0.1.8; [R26.8] ThunderKittens 2.0; [R26.11] PyTorch 2.14. See [references.md](references.md) for release dates and pinned locators.
