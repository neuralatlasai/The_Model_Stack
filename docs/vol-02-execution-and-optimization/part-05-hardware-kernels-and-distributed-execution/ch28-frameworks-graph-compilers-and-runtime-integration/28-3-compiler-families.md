---
id: ms.section.28.3
entity_type: section
title: Compiler families
short_title: Compiler families
volume: 2
part: 5
chapter: 28
section: 28.3
slug: 28-3-compiler-families
parent: ms.chapter.28
prev_sibling: ms.section.28.2
next_sibling: ms.section.28.4
children: []
prerequisites:
- ms.chapter.19
- ms.chapter.25
- ms.chapter.26
- ms.chapter.27
downstream:
- ms.chapter.29
- ms.chapter.30
- ms.chapter.42
related: []
relations: []
axes:
  lifecycle:
  - pretraining
  - inference
  - serving
  mechanism:
  - graph_compilation
  - runtime_integration
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

# 28.3 — Compiler families

## Scope

[DERIVED] This section locates TorchInductor, XLA, MLIR and TVM in an execution stack without pretending that they are interchangeable products. It compares semantic entry points, intermediate representations, transformation ownership, target lowering and runtime boundaries. The deliverable is a compiler responsibility map for one model graph, including the library calls and custom operations that remain outside generated kernels.

[OFFICIAL-DOCUMENTATION] The evidence boundary is PyTorch 2.14, JAX 0.11.2, LLVM/MLIR 22.1.0 and Apache TVM 0.23.0 release artifacts. These snapshots were released within the permitted window. Their descriptions of established compiler architectures are not dated claims of architectural invention. Release provenance is essential because a current unversioned tutorial can mix capabilities from several revisions. [R28.1], [R28.3], [R28.6]–[R28.8].

## Why this exists

[DERIVED] “Use a better compiler” is not an executable engineering plan. An error in Python capture cannot necessarily be repaired by changing an instruction selector. A missing operator decomposition may require frontend work. A kernel with the wrong layout may require scheduling. An opaque external call may already select a strong vendor implementation while preventing cross-boundary fusion. The appropriate intervention depends on which component owns the failed decision.

[DERIVED] Comparing compiler names also hides different input contracts. A frontend accepting a dynamic framework program, a compiler for an already functional tensor graph and an infrastructure for constructing dialect transformations have different obligations. A fair evaluation fixes the model semantics, shape envelope, numerical policy, available libraries and measurement boundary before comparing executables. Otherwise the experiment compares different problems under the same model name.

## Intuition

[DERIVED] Think of the executable as a sequence of representations and contracts. A high-level operation expresses what must be computed; a lower representation adds decisions about decomposition, layout, storage and launch. A transformation is useful when it preserves the required semantics and exposes a decision that the next stage can optimize. More lowering is not automatically better: prematurely replacing a recognizable operator can discard an efficient library path.

[OFFICIAL-DOCUMENTATION] TVM's architecture guide distinguishes Relax functions and TIR primitive functions within an IRModule. MLIR supplies infrastructure for operations, dialects and passes rather than one universal model compiler. PyTorch describes Inductor as a backend in a larger compiler stack. JAX's JIT guide describes compilation through XLA after tracing. These distinctions are direct reasons to compare responsibilities instead of treating all four names as peer APIs. [R28.3], JIT; [R28.6], stack; [R28.7], pass management; [R28.8], architecture.

## Formulation

[MATHEMATICALLY-DERIVED] Let $I_0$ denote captured semantics and $P_j$ a legal transformation to representation $I_j$. Let $\llbracket I\rrbracket$ denote its observable computation under the declared numerical and state policy. A valid pipeline satisfies

$$
I_j=P_j(I_{j-1}),\qquad
\llbracket I_j\rrbracket\simeq_\tau\llbracket I_{j-1}\rrbracket,
\qquad \min_{a\in\mathcal A}T(a)\ \text{subject to legality and capacity}.
$$

*(Eq. 28.3)*

[DERIVED] $\mathcal A$ is the set of implementations expressible and discoverable by this pipeline, not every possible GPU program. Legal does not mean fastest. Search quality, cost-model error and available implementation families bound the optimization. Conversely, a low predicted cost cannot authorize an illegal alias change, a dropped collective or a numerical policy violation. The equality is an obligation for each transformation, not a proof supplied by this chapter.

[MATHEMATICALLY-DERIVED] Approximate equivalence at tolerance $\tau$ is not transitive at that same tolerance. Two accepted local rewrites can accumulate errors, and a downstream operation can amplify an earlier perturbation. The displayed per-pass relation is therefore an allocated local obligation, not a proof that the complete pipeline meets the original end-to-end $\tau$. Exact semantic identities compose; approximate transformations require a justified error budget or direct end-to-end acceptance against the reference. Unknown amplification is a reason to retain that final check, not to assume zero additional error.

## Mechanism

[OFFICIAL-DOCUMENTATION] **TorchInductor** receives graphs through the PyTorch compiler stack and generates device-oriented implementations while using external kernels where appropriate. The 2.14 release adds NVGEMM candidates based on CuTeDSL/CUTLASS that compete with other GEMM paths; it also describes epilogue and grouped-operation integration. This makes library selection part of the compiler problem. It does not imply that every matrix multiplication uses NVGEMM or that every external call prevents all surrounding optimization. [R28.1], NVGEMM; [R28.6], backend overview.

[OFFICIAL-DOCUMENTATION] **XLA** is the compiler named by the inspected JAX JIT guide. JAX tracing and transformations establish an input computation before compilation; abstract shapes and static arguments constrain that input. The persistent-cache document keys reuse partly from nonoptimized HLO, tying an executable to more than a Python function name. This chapter does not infer XLA scheduling details from a jaxpr printout. [R28.3], tracing and compilation; [R28.13], cache key.


```figure
id: fig-28.9
kind: compare
title: Compiler names own different contracts
caption: Authored comparison of inspected architectural responsibilities. Cells describe layers and boundaries rather
  than benchmark rankings or universal support.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.3
alt: Authored comparison of inspected architectural responsibilities. Cells describe layers and boundaries rather
  than benchmark rankings or universal support.
concepts:
- ms.section.28.3
spec:
  axis: Responsibility
  columns:
  - id: ind
    label: TorchInductor
  - id: xla
    label: XLA via JAX
  - id: mlir
    label: MLIR infrastructure
  - id: tvm
    label: Apache TVM
  rows:
  - dimension: Entry
    values:
      ind: PyTorch captured graph
      xla: JAX traced computation
      mlir: Selected dialect operations
      tvm: Relax / TIR module
  - dimension: Optimization owner
    values:
      ind: Graph lowering and kernel selection
      xla: Compiled graph transformations
      mlir: Chosen passes and conversions
      tvm: Graph and primitive scheduling
  - dimension: External boundary
    values:
      ind: Libraries and custom operations
      xla: Custom calls and runtime
      mlir: Selected target and ABI
      tvm: Module / PackedFunc runtime
  - dimension: Evidence limit
    values:
      ind: No universal operator coverage
      xla: No schedule inferred from jaxpr
      mlir: Not one complete model compiler
      tvm: Target path is not operator parity
```


[OFFICIAL-DOCUMENTATION] **MLIR** provides pass infrastructure with explicit operation scope and concurrency constraints. Its 22.1.0 pass-management guide forbids operation passes from inspecting or modifying sibling operations and warns against mutable state shared across invocations. These are compiler implementation rules, not GPU kernel rules. A pipeline designer must select dialects, conversions and target backends; “MLIR” alone does not specify an executable or runtime ABI. [R28.7], operation passes and pass management.

[OFFICIAL-DOCUMENTATION] **TVM** 0.23.0 documents a sequence in which Relax operators can be legalized to TIR primitive functions, fused at appropriate boundaries and lowered through target-specific code generation. Its runtime Module and PackedFunc abstractions provide execution and integration boundaries. MetaSchedule is a schedule-search mechanism in this architecture, not a guarantee of an optimal schedule for every operator. [R28.8], compiler flow, target translation and runtime.

[DERIVED] These families can intersect. A framework can call a kernel authored with another DSL; a DSL can use MLIR infrastructure; a runtime can execute an external library kernel. Such nesting does not transfer all correctness or performance claims across the boundary. Name the exact frontend, intermediate representation, kernel generator, linked library and launcher for the executable being assessed.


```figure
id: fig-28.10
kind: diagram
title: Representations retain different decisions
caption: 'Authored lowering topology: semantic legality persists across representations while layout and runtime
  decisions are introduced. An external library path remains part of the executable.'
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.3
alt: 'Authored lowering topology: semantic legality persists across representations while layout and runtime decisions
  are introduced. An external library path remains part of the executable.'
concepts:
- ms.section.28.3
spec:
  direction: LR
  nodes:
  - id: sem
    kind: state
    label: Semantic graph
  - id: low
    kind: process
    label: Decomposition and legalization
  - id: sched
    kind: process
    label: Layout and schedule
  - id: gen
    kind: process
    label: Target code generation
  - id: lib
    kind: state
    label: External library contract
  - id: run
    kind: boundary
    label: Runtime executable
  edges:
  - from: sem
    to: low
    kind: flow
  - from: low
    to: sched
    kind: flow
  - from: sched
    to: gen
    kind: flow
  - from: gen
    to: run
    kind: flow
  - from: low
    to: lib
    kind: dependency
  - from: lib
    to: run
    kind: flow
```


[DERIVED] Layout choices couple these layers. A producer layout that is locally efficient may require a transpose before a consumer. A fusion rule may remove that transfer or increase live storage. A library call can constrain accepted strides while providing a superior numerical implementation. The complete graph cost includes conversion and dispatch, so isolated kernel rankings cannot select the best pipeline without boundary costs. This is the graph-level counterpart of §26.4's fusion accounting.

[MATHEMATICALLY-DERIVED] A two-pass example makes the error-budget obligation explicit. Let the exact composition be $f_2\circ f_1$ and the transformed composition $g_2\circ g_1$. Assume $\|g_1(x)-f_1(x)\|\le\delta_1$ on the declared input domain, $\|g_2(z)-f_2(z)\|\le\delta_2$ uniformly over the reached intermediate domain, and $f_2$ is $L_2$-Lipschitz between the relevant intermediate values in the same norm. The triangle inequality gives

$$
\begin{aligned}
\|g_2(g_1(x))-f_2(f_1(x))\|
&\le \|g_2(g_1(x))-f_2(g_1(x))\|
 +\|f_2(g_1(x))-f_2(f_1(x))\|\\
&\le\delta_2+L_2\delta_1\equiv E_{\mathrm{bound}}.
\end{aligned}
$$

*(Eq. 28.20)*

where $\delta_1,\delta_2$ = local absolute-error bounds, $L_2$ = downstream Lipschitz bound, and $E_{\mathrm{bound}}$ = sufficient composed absolute-error bound, all in one declared norm.

[DERIVED] A sufficient allocated-budget check is $E_{\mathrm{bound}}\le\tau$. A negative budget remainder in the instrument means this bound cannot certify the chosen tolerance; it does not prove the actual error exceeds it. The assumptions require established uniform bounds on the reached domain, not single-sample errors substituted for $\delta_i$. When $L_2$ or either local bound is unknown, this calculator supplies sensitivity analysis only and end-to-end qualification remains necessary. It establishes no compiler-specific numerical result.

```figure
id: fig-28.22
kind: calculator
title: Downstream sensitivity spends the error budget
caption: 'Illustrative two-pass bound from Eq. 28.20: vary local error bounds and downstream sensitivity to test
  a sufficient allocated budget. Defaults are assumed analytical inputs, not measured compiler errors. A negative
  remainder means this bound cannot certify the tolerance.'
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-28.20
alt: The calculator multiplies the first pass error bound by downstream sensitivity, adds the second pass bound,
  and compares the sum with an end-to-end tolerance. Unknown bounds prevent certification.
concepts:
- ms.section.28.3
spec:
  equation: '28.20'
  tex: E_{\mathrm{bound}}=L_2\delta_1+\delta_2,\qquad r=\tau-E_{\mathrm{bound}}
  inputs:
  - symbol: d1
    label: First-pass absolute-error bound
    default: 0.001
    min: 0
    max: 0.1
    format: fixed3
  - symbol: d2
    label: Second-pass absolute-error bound
    default: 0.001
    min: 0
    max: 0.1
    format: fixed3
  - symbol: L2
    label: Downstream Lipschitz bound
    default: 4
    min: 0
    max: 100
    format: fixed2
  - symbol: tau
    label: End-to-end absolute tolerance
    default: 0.01
    min: 0.001
    max: 1
    format: fixed3
  outputs:
  - symbol: E
    label: Composed error upper bound
    formula: L2*d1+d2
    format: fixed3
  - symbol: R
    label: Remaining allocated budget
    formula: tau-(L2*d1+d2)
    format: fixed3
  - symbol: F
    label: Fraction of tolerance consumed
    formula: (L2*d1+d2)/tau
    format: ratio
```

## Algorithm

[DERIVED] **Algorithm 28.3 — Responsibility-preserving compiler comparison.** Inputs are a semantic reference, supported input envelope and two candidate compiler stacks. Output is a comparable executable report, or an explicit incompatibility statement.

1. Fix shapes, layouts, dtype/accumulation, state, gradients, device placement, collectives and error tolerances before choosing backend flags.
2. Record each candidate's entry representation and unsupported constructs. Use equivalent decompositions only when their semantics satisfy the fixed contract.
3. Capture and save intermediate representations at semantic, graph, schedule and target boundaries that the stack exposes.
4. Enumerate generated kernels, external library calls, layout conversions, host operations and runtime dependencies. Attribute each decision to its owning component.
5. Verify outputs, derivatives and state transitions. Reject a fast executable whose legality constraints do not match the reference.
6. Measure complete cold and warm execution with matched inputs and numerical policies. Change one owned transformation or library selection, then rerun both correctness and cost checks.

[DERIVED] The comparison invariant is semantic equality under the declared policy, not matching intermediate graphs. Different legal decompositions can generate different kernels. Retain the executable manifests so a result does not silently become a comparison of different library or driver revisions.

[DERIVED] A finite two-stack evaluation can be written as an explicit state machine. $\mathcal B$ is the candidate stack set and $W$ the sealed workload.

$$
\begin{aligned}
(1)&\quad\mathcal L\gets\varnothing;\quad\tau,\mathcal E\gets\operatorname{seal}(\text{semantics},\text{envelope}).\\
(2)&\quad\text{for }b\in\mathcal B:\ (I_b,E_b)\gets\operatorname{compile}(f,\mathcal E,b).\\
(3)&\quad\neg\operatorname{legal}(I_b,\tau)\Rightarrow\operatorname{reject}(b).\\
(4)&\quad\text{for }x\in W:\ (r_x,z_{b,x})\gets\operatorname{independentRuns}(f,E_b,x).\\
(5)&\quad\neg\operatorname{Parity}_\tau(r_x,z_{b,x})\Rightarrow\operatorname{reject}(b,x).\\
(6)&\quad\mathcal L\gets\mathcal L\cup\{b,x,\operatorname{IR}(b),\operatorname{libraries}(b),\operatorname{cost}(b,x)\};\quad\text{return }\mathcal L.
\end{aligned}
$$

[DERIVED] The legality check denotes declared constraints plus available validation, not an automatic theorem prover. For finite stacks and workloads, evaluation work is compilation plus the sum of reference, candidate and derivative costs; artifact storage scales with retained representations and samples. Compilation failure is an incompatibility result, not a zero-duration candidate.

## Implementation

[DERIVED] In the reference-stack vocabulary, **PyTorch** and **JAX** sit in *Model / autograd framework*; **TorchInductor**, **OpenXLA/XLA**, **MLIR** and **Apache TVM** sit at graph/compiler/runtime boundaries. The first two frameworks own transformation interfaces exposed to the model author. Compiler infrastructure owns representation and lowering machinery. Vendor libraries and kernel DSLs remain named dependencies rather than disappearing inside the word “backend”.

[OFFICIAL-DOCUMENTATION] The 2.14 release reports a Helion registry path but states that operators are not routed through Helion in this release and that the backend requires appropriate installation. A visible integration hook is therefore not evidence of active kernel coverage. Likewise, TVM's target-code-generation description establishes supported architectural paths, not parity for a specific operator set on every target. [R28.1], Helion integration; [R28.8], target translation.


```figure
id: fig-28.11
kind: systems-trace
title: Attribute each cost to its owning layer
caption: Qualitative compiler audit with quantities to collect at each boundary. The trace is an authored inspection
  template and contains no observed performance values.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.3
alt: Qualitative compiler audit with quantities to collect at each boundary. The trace is an authored inspection
  template and contains no observed performance values.
concepts:
- ms.section.28.3
spec:
  columns:
  - latency
  - memory
  - compute
  - communication
  - failure
  stages:
  - name: Frontend
    values:
      latency: capture time
      memory: graph representation
      compute: decomposition
      communication: placement declared
      failure: unsupported semantics
  - name: Compiler
    values:
      latency: lower and tune time
      memory: IR and temporary plans
      compute: generated kernels
      communication: collectives retained
      failure: illegal transformation
  - name: Library
    values:
      latency: dispatch overhead
      memory: workspace contract
      compute: selected routine
      communication: library dependent
      failure: precision mismatch
  - name: Runtime
    values:
      latency: launch and replay
      memory: allocation pools
      compute: complete executable
      communication: actual transfers
      failure: ABI incompatibility
```


[DERIVED] Semantic comparison fixes learned parameters and valid tokens. The complete invocation counts generated and library FLOPs, conversion/transfer traffic, temporary or retained memory and all host dispatch; padding is additional work rather than valid data. Distributed communication is added when placement requires it. Achieved throughput, power, joules and financial cost are UNVERIFIED: analytical graph or launch savings cannot replace synchronized timing, a power integral or dated billed-resource evidence.

## Experimental design

[DERIVED] Select one graph with a reduction, a matrix multiplication, a layout-sensitive consumer and an explicit custom boundary. Evaluate the same semantic graph through the chosen stacks; report incompatibility rather than deleting difficult operations from one candidate. Measure compile time, first execution, warmed execution, temporary memory, conversion bytes and complete output/gradient error. Keep library versions and accelerator numerical settings in the report.

[DERIVED] Run two ablations: preserve versus decompose the high-level operator, and accept versus change the producer layout. Inspect whether fusion and external-library selection change. Use repeated complete invocations with synchronization appropriate to each runtime. No timings are supplied here: the proposed experiment is a method for identifying ownership and trade-offs, not a retrospective claim that one compiler family wins.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The release-scoped sources describe Inductor integration, JAX-to-XLA compilation, MLIR pass constraints and TVM's high-level/primitive/runtime architecture. They do not present a common benchmark proving a universal ranking. [R28.1], [R28.3], [R28.6]–[R28.8].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The inspected sources distinguish frontend capture from backend lowering and show that library calls, schedule search and runtime ABIs belong to different layers. PyTorch's stated Helion coverage boundary prevents inferring execution from registration alone. [R28.1].

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 28.3 requires legality before cost comparison. Changing the feasible implementation set can alter performance without changing the mathematical function, while an invalid transformation cannot be justified by its speed.

**What remains unknown.** [UNVERIFIED] Relative quality, compilation economics and operator completeness for a deployment remain unknown without matched workloads, pinned artifacts and full numerical checks. No source establishes those results for this book's model.

## Failure modes

[DERIVED] A comparison can silently change precision, fold a constant available to only one candidate, omit backward execution or measure a library call without layout conversion. A compiler pass can preserve tensor shapes while violating alias or state semantics. A target backend can exist while lacking the required operation or collective. An IR dump can omit runtime dispatch. Each failure invalidates a different part of the proposed comparison and must be labeled precisely.

## Siblings

[DERIVED] Kernel authoring in [Chapter 26](../ch26-kernel-programming-and-numerical-equivalence/README.md) optimizes a local operator implementation. This section selects and composes implementations at graph boundaries. Runtime execution in [§28.4](28-4-runtime-execution.md) owns launch, allocation and replay after lowering. Custom-operation integration in [§28.5](28-5-integration-boundaries.md) owns the semantic metadata that makes opaque execution safe for transformations.

## Extensions

[DERIVED] A useful next artifact is a per-operation provenance graph linking high-level nodes to lowered kernels, library versions and output buffers. Such a graph can expose where a schedule change increases conversion traffic or where an external call constrains fusion. It must record actual emitted artifacts; reconstructing provenance from operator names alone can misattribute dynamically selected implementations.

## Limitations

[DERIVED] The responsibility map abstracts many backend details and cannot prove compiler correctness. Intermediate representations and debug interfaces change across releases. The selected sources establish architectural contracts, not every optimization's implementation. Distributed partitioning requires the collective and topology reasoning in Chapter 29; it cannot be reduced to a local-kernel cost model.

## Reproducibility

[DERIVED] Preserve source and exported graph, constraints, pass configuration, target triple, device architecture, linked library versions, generated code and runtime manifest. Archive numerical policies and the attribution of external calls. Record inaccessible compiler stages as NOT-DISCLOSED rather than inventing their schedule. Include unsuccessful compilation cases in the comparison envelope.

## References

[R28.1] PyTorch 2.14 release; [R28.3] JAX 0.11.2 JIT snapshot; [R28.6] PyTorch compiler stack; [R28.7] LLVM/MLIR 22.1.0 pass-management artifact; [R28.8] TVM 0.23.0 architecture artifact; [R28.13] JAX persistent-cache snapshot. Full dates and exact inspection locators are in [references.md](references.md).
