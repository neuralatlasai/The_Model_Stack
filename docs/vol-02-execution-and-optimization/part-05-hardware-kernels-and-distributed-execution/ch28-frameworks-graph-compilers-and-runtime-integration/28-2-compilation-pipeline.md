---
id: ms.section.28.2
entity_type: section
title: Compilation pipeline
short_title: Compilation pipeline
volume: 2
part: 5
chapter: 28
section: 28.2
slug: 28-2-compilation-pipeline
parent: ms.chapter.28
prev_sibling: ms.section.28.1
next_sibling: ms.section.28.3
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

# 28.2 — Compilation pipeline

## Scope

[DERIVED] This section follows one differentiable function from Python execution to accelerator kernels. It separates capture, guards, graph breaks, specialization, graph scheduling, lowering and code generation. The artifact is a capture report that identifies every specialized assumption and every boundary where execution returns to the host. It is a necessary companion to the semantic reference in §28.1, not a substitute for it.

[OFFICIAL-DOCUMENTATION] The inspected baseline is PyTorch 2.14 and JAX 0.11.2. PyTorch documents TorchDynamo capture, AOTAutograd and TorchInductor as distinct components. JAX documents tracing to jaxpr, static specialization and caching. These dated release snapshots describe current interfaces for established compiler techniques; this chapter makes no claim that tracing or guarded specialization was invented in the source window. [R28.3], JIT compilation; [R28.5], core concepts; [R28.6], compiler stack.

## Why this exists

[DERIVED] A model can have fast arithmetic and poor compiled execution. Repeated tracing, Python callbacks, host scalar extraction and unnecessary specialization can dominate short invocations. Conversely, removing every graph break is insufficient when a compiler captures a large graph but chooses expensive materializations or kernels. The investigation must identify the failing stage before choosing an intervention.

[DERIVED] A production report that says only “compiled successfully” hides two different failures: some paths may never have been exercised, and compilation may have created many valid but uneconomic variants. A full-graph diagnostic tests one capture boundary. A latency distribution tests a workload. Neither proves the other. Training additionally requires the captured backward graph and state updates to remain valid under the same input envelope.

## Intuition

[DERIVED] A trace is a conditional promise: for inputs satisfying a set of assumptions, this graph preserves the required behavior. A guard checks those assumptions before reuse. A graph break divides that promise into regions and resumes Python between them. A specialization creates another promise for a different assumption set. These are separate operations even when a user encounters them through one compile API.

[OFFICIAL-DOCUMENTATION] Dynamo records tensor operations into an FX graph, checks guards before reuse and can resume tracing after an unsupported operation. JAX traces Python using abstract values; Python side effects are not represented as ordinary mathematical operations in jaxpr. A print observed during tracing is consequently not evidence of an accelerator operation executed on every invocation. [R28.5], graph breaks and guards; [R28.3], tracing.

## Formulation

[MATHEMATICALLY-DERIVED] Let $f$ be the reference computation, $g_j$ a compiled variant and $A_j$ its guarded applicability set. Let $\simeq_\tau$ include the value, gradient and state policies from §28.1. Correct reuse requires

$$
x\in A_j\;\Longrightarrow\; g_j(x)\simeq_\tau f(x),\qquad
T_N=\sum_{j\in J_N}C_j+\sum_{i=1}^{N}\left(G_i+H_i+K_i\right).
$$

*(Eq. 28.2)*

[DERIVED] $C_j$ is compile cost for each encountered variant, $G_i$ guard/dispatch cost, $H_i$ host work and synchronization, and $K_i$ complete device execution. The expression is an accounting identity under sequential request accounting, not a latency model for overlapping independent requests. A cache hit removes a particular compilation cost; it does not remove guards, Python boundaries or device work. A cache key that omits a semantically relevant assumption violates the implication.

## Mechanism

[DERIVED] **Capture** first establishes a graph representation of observed operations. **Specialization** decides which values or metadata become constants. **Guards** protect those decisions. **Graph breaks** mark execution the chosen capture mechanism cannot represent or is configured not to capture. **Scheduling** orders and groups dependencies. **Lowering** replaces high-level operations with implementation-level forms. **Code generation** emits executable kernels and dispatch code. Calling every stage “the compiler” prevents useful diagnosis.


```figure
id: fig-28.6
kind: diagram
title: Capture is the first compiler boundary
caption: 'Authored pipeline: guards validate captured assumptions; graph breaks return to host execution before
  another region is captured. This is an explanatory topology, not an instrumented trace.'
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.2
alt: 'Authored pipeline: guards validate captured assumptions; graph breaks return to host execution before another
  region is captured. This is an explanatory topology, not an instrumented trace.'
concepts:
- ms.section.28.2
spec:
  direction: LR
  nodes:
  - id: py
    kind: boundary
    label: Python and explicit state
  - id: guard
    kind: process
    label: Guard assumptions
  - id: ir
    kind: state
    label: Captured graph
  - id: ad
    kind: process
    label: Forward and backward
  - id: lower
    kind: process
    label: Schedule and lower
  - id: code
    kind: boundary
    label: Generated executable
  - id: host
    kind: state
    label: Intentional host boundary
  edges:
  - from: py
    to: guard
    kind: flow
  - from: guard
    to: ir
    kind: flow
  - from: ir
    to: ad
    kind: flow
  - from: ad
    to: lower
    kind: flow
  - from: lower
    to: code
    kind: flow
  - from: ir
    to: host
    kind: dependency
  - from: host
    to: guard
    kind: feedback
```


[OFFICIAL-DOCUMENTATION] PyTorch 2.14 describes AOTAutograd as capturing forward and backward graphs, with TorchInductor as a default backend. Dynamo's documented dynamic-shape modes differ: initially static behavior can generalize after shape changes, explicitly dynamic settings request another strategy, and explicitly static settings disable that generalization. This is not a promise that all data-dependent dimensions are automatically supported. [R28.5], recompilation and dynamic shapes; [R28.6], stack overview.

[DERIVED] A Python integer selecting a branch can create a valid specialized graph for that branch. A tensor-derived scalar transferred to the host introduces both a semantic dependency and potential synchronization. Replacing it with a graph-supported conditional may preserve both alternatives inside the executable, but changes the representation and requires a backend supporting that conditional. PyTorch 2.14 adds higher-order control-flow capabilities, including multiway switching; capability must be checked at the exact backend and deployment path. [R28.1], control-flow operators.

[DERIVED] Shape specialization is multidimensional. Batch, sequence length, strides, dtype, training mode, static arguments and closure identity may each partition the input space. The Cartesian product gives an upper bound on possible variants only if these axes vary independently. Actual guards may merge or further split classes. Count observed variants and rejected guards; do not infer cache pressure from one shape list alone.


```figure
id: fig-28.7
kind: calculator
title: Potential specialization growth
caption: The product is an upper bound for independent categorical specialization axes. Defaults are illustrative
  class counts, not observed compiler variants. Actual guards may merge or split these classes.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.2
alt: The product is an upper bound for independent categorical specialization axes. Defaults are illustrative class
  counts, not observed compiler variants. Actual guards may merge or split these classes.
concepts:
- ms.section.28.2
spec:
  tex: V\le BSLM
  inputs:
  - symbol: B
    label: Batch classes
    default: 3
    min: 1
    max: 32
    format: integer
  - symbol: S
    label: Sequence classes
    default: 4
    min: 1
    max: 64
    format: integer
  - symbol: L
    label: Layout classes
    default: 2
    min: 1
    max: 8
    format: integer
  - symbol: M
    label: Mode classes
    default: 2
    min: 1
    max: 8
    format: integer
  outputs:
  - symbol: V
    label: Cartesian classes
    formula: B*S*L*M
    format: integer
```


## Algorithm

[DERIVED] **Algorithm 28.2 — Guarded capture audit.** Inputs are the reference $f$, a representative ordered workload $W$, policy $\tau$ and backend configuration $b$. Output is a verified applicability ledger, or a named unresolved boundary.

1. Partition $W$ by required semantic distinctions: shape, stride, dtype, device, mode, static controls and state transitions. Preserve rare but supported cases.
2. Execute the reference for each class and retain outputs, gradients, state deltas and exception behavior under $\tau$.
3. Capture one representative. Record the emitted graph, guards, graph-break reasons, compiler settings and compile duration separately.
4. Replay every class, recording the selected variant, guard failures, new traces and host synchronization. Compare semantic results to step 2.
5. For each break, decide whether the operation is intentionally host-owned, expressible through supported graph control flow, or requires an explicit custom boundary. Change one cause and repeat steps 2–4.
6. Accept only classes with verified semantics and bounded specialization behavior. Mark unvisited classes unsupported rather than extrapolating from a successful trace.

[DERIVED] The invariant is that every reused variant has an identified applicability set and a matching semantic witness from the workload. This finite experiment cannot prove equivalence for all real-valued inputs. It does expose untested dispatch regions and accidental compile loops.

[DERIVED] The numbered state transitions make the audit executable over finite workload classes. Let $q(x)$ return semantic metadata and $\operatorname{Parity}_\tau$ compare independently owned reference/compiled results and state.

$$
\begin{aligned}
(1)&\quad\mathcal A\gets\operatorname{partition}(W;q),\quad\mathcal L\gets\varnothing.\\
(2)&\quad\text{for }x\in W:\ r_x\gets\operatorname{Reference}(x;\operatorname{copy}(s_0^x)).\\
(3)&\quad(g_a,G_a,C_a)\gets\operatorname{Capture}(f,a,b).\\
(4)&\quad\text{for }x\in W:\ j\gets\operatorname{GuardDispatch}(x);\\
&\quad j=\varnothing\Rightarrow j\gets\operatorname{CaptureOrReject}(x);\quad j=\varnothing\Rightarrow\operatorname{recordAndSkip}(x).\\
(5)&\quad z_x\gets g_j(x;\operatorname{copy}(s_0^x));\quad\neg\operatorname{Parity}_\tau(z_x,r_x)\Rightarrow\operatorname{reject}(x,j).\\
(6)&\quad\mathcal L\gets\mathcal L\cup\{q(x),j,G_j,\operatorname{breaks}(j),\operatorname{cost}(x)\};\quad\text{return }\mathcal L.
\end{aligned}
$$

[DERIVED] References in line2 are evaluated for each concrete input, not reused across different values in one metadata class. Independent initial state and the same cotangent are required for each parity check. Capture/warmup uses disposable copies and cannot mutate the sealed pre-step state. A stateful sequence supplies its paired pre-step states explicitly rather than resetting only one route. Failed capture and parity rejection record the cause and terminate that candidate's admission path; later lines cannot execute an absent variant. Work is the sum of finite reference/compiled executions and encountered compilation costs; ledger storage is linear in recorded invocations and retained variants. A missing guard-valid variant takes the explicit capture/reject branch.

## Implementation

[OFFICIAL-DOCUMENTATION] **PyTorch**, in the *Model / autograd framework* layer, exposes compiler diagnostics for capture and recompilation. **JAX**, in the same layer, requires pure transformed functions and treats designated static arguments as part of specialization. Recreating temporary jitted functions can prevent useful cache reuse because function identity participates in the transformation lifecycle. [R28.5], diagnostics; [R28.3], caching and static arguments.

[DERIVED] Keep a stable callable and explicit configuration object for each intended compiled family. Avoid using an unbounded request identifier as a static argument. Hoist logging outside the compiled computation when it does not affect results. If logging must depend on device values, account for its transfer and synchronization rather than hiding it inside the arithmetic timing interval. Treat an intentional break as an owned interface with an explicit latency and state contract.


```figure
id: fig-28.8
kind: systems-trace
title: One request crosses several accounting boundaries
caption: Qualitative audit template separating capture, guard reuse, host boundaries and device execution. Values
  name quantities to record; no latency or memory result is asserted.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.2
alt: Qualitative audit template separating capture, guard reuse, host boundaries and device execution. Values name
  quantities to record; no latency or memory result is asserted.
concepts:
- ms.section.28.2
spec:
  columns:
  - latency
  - memory
  - compute
  - communication
  - failure
  stages:
  - name: First class
    values:
      latency: compile separately
      memory: IR and code
      compute: capture and lower
      communication: none required
      failure: unsupported capture
  - name: Guarded reuse
    values:
      latency: dispatch separately
      memory: cached executable
      compute: scheduled kernels
      communication: depends on graph
      failure: guard rejected
  - name: Host boundary
    values:
      latency: transfer and wait
      memory: materialized values
      compute: host operation
      communication: device-to-host possible
      failure: hidden synchronization
  - name: New class
    values:
      latency: new compilation
      memory: additional variant
      compute: new schedule
      communication: depends on graph
      failure: unbounded variants
```


[OFFICIAL-DOCUMENTATION] PyTorch 2.14 introduces a shared dynamic-specification interface across compilation, export and tracing. The release also states that Python 3.15 wheels support eager execution while compiler invocation raises an error. A compatible package import therefore does not prove compiler availability. [R28.1], dynamic specifications and Python support.

## Experimental design

[DERIVED] Replay two ordered workloads: a stable-shape stream and an adversarial interleaving of supported shapes, layouts and modes. Report the first invocation, each newly compiled variant, steady reuse and total run cost separately. Run the same input order with capture disabled. Record host synchronization and graph breaks alongside device timings. Warmup must not silently remove the specialization distribution under investigation.

[DERIVED] Ablate one factor at a time: static versus dynamic dimensions, stable versus reconstructed callables, scalar host extraction versus supported graph control flow, and one intentional break versus a full captured region. Control library versions, device clocks, input values and numerical settings. Predeclare that reducing graph-break count is a diagnostic outcome; acceptance still requires end-to-end latency and semantic parity. No outcomes from this experiment have been measured for this manuscript.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The primary records document guarded Dynamo capture, graph-break continuation, dynamic specialization and JAX tracing/caching. They describe interfaces and constraints, not a guarantee of faster arbitrary programs. [R28.3], [R28.5], [R28.6].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The inspected release separates compiler components and documents version-specific control-flow and Python compatibility changes. These are direct support for auditing the pipeline by stage. They do not provide this book's workload measurements. [R28.1].

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 28.2 shows that lower kernel time can coexist with higher total cost when compile, dispatch or host terms grow. Variant count alone is also insufficient without each variant's cost and reuse frequency.

**What remains unknown.** [UNVERIFIED] The break locations, guard classes and economic benefit for a particular model remain unmeasured until its actual workload, state transitions and deployment configuration are captured.

## Failure modes

[DERIVED] A data-dependent branch covered only on one side can hide an uncompiled path. A Python callback can preserve values while serializing device progress. Broad dynamic shapes can avoid recompilation but select a less specialized schedule; overly static shapes can create expensive variant churn. An opaque custom call can make capture succeed while blocking fusion. Captured forward parity without backward and state checks leaves the training contract incomplete. Distinguish these failures in the ledger.

## Siblings

[DERIVED] Eager execution, guarded JIT compilation and ahead-of-time export place uncertainty at different times. Eager mode resolves operations repeatedly; guarded JIT discovers workload classes during execution; export requires a declared signature and constraints before deployment. Runtime graph replay in [§28.4](28-4-runtime-execution.md) reduces launch overhead after a suitable execution graph exists. It cannot repair a semantically invalid capture.

## Extensions

[OFFICIAL-DOCUMENTATION] JAX 0.11.2 adds exported symbolic-dimension bounds and changes the timing of an inline compilation option. These changes justify recording symbolic constraints and transformation configuration in the artifact rather than treating a source function as a complete executable identity. [R28.3], release notes. [DERIVED] A future capture audit can search for the smallest stable applicability partition, but must preserve explicit rejection of unsupported classes.

## Limitations

[DERIVED] The cost identity does not predict overlap, distributed compilation contention or compiler search quality. A finite workload cannot prove complete Python semantic preservation. Backend diagnostics are version-specific and can omit internal scheduling decisions. This section establishes an inspection method; it reports no model-specific speedup or guarantee of full-graph support.

## Reproducibility

[DERIVED] Archive the reference signature, input-class generator, ordered workload, guards, break report, graph IR, compiler configuration, cold/warm timings and comparison policy. Include interpreter, framework, backend, driver and device versions. Preserve failed classes and the exact reason for fallback. A screenshot of a captured graph is not sufficient to reproduce the specialization behavior.

## References

[R28.1] PyTorch 2.14 release; [R28.3] JAX 0.11.2 release and pinned JIT guide; [R28.5] PyTorch 2.14 Dynamo core concepts; [R28.6] PyTorch 2.14 compiler stack. Full first-publication dates and locators are in [references.md](references.md).
