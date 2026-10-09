---
id: ms.section.28.1
entity_type: section
title: Framework semantics
short_title: Framework semantics
volume: 2
part: 5
chapter: 28
section: 28.1
slug: 28-1-framework-semantics
parent: ms.chapter.28
prev_sibling: null
next_sibling: ms.section.28.2
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

# 28.1 — Framework semantics

## Scope

[DERIVED] The compiler's input is a program contract, not just a tensor formula. This section owns PyTorch eager/autograd behavior, JAX transformations, explicit functional state, tracing and distributed tensor abstractions. It asks which values, effects, derivatives and placements must remain equivalent across execution routes. Kernel arithmetic and numerical acceptance are prerequisites from Chapter 26; distributed placement algorithms are developed in Chapter 29.

## Why this exists

[OFFICIAL-DOCUMENTATION] PyTorch 2.14 documents autograd's saved values and mutation constraints. JAX's released 0.11.2 tracing guide distinguishes traced primitives from Python side effects. JAX 0.9.0 changed export serialization to preserve explicit sharding and require a matching abstract mesh. [R28.2], “Saved tensors” and “In-place operations”; [R28.3], JIT guide “How JAX transformations work”; [R28.4], “Changes”. [DERIVED] These contracts make a tensor's shape and numeric contents insufficient to describe the program. Mutation history, random state, tracing decisions and distributed placement can change its meaning or the validity of reuse.

[DERIVED] The failure is often a test that compares a single output while ignoring a state transition. The first call can agree because Python performed a side effect during tracing; subsequent compiled calls can skip it. A gradient can match while an updated buffer differs. Two local arrays can have identical bytes but represent shards of different global coordinates. Framework semantics supply the invariants that compilation must preserve before performance matters.

## Intuition

[MATHEMATICALLY-DERIVED] Write a model step as $(y,s')=F(x,s)$, where $s$ contains parameters, optimizer moments, random keys and authorized mutable buffers. Pure mathematical notation makes state explicit even when an eager API hides it behind objects. A transform that compiles only the apparent $x\mapsto y$ while dropping the needed transition $s\mapsto s'$ changes the program. Similarly, a distributed tensor is a global value plus a placement map; local storage alone does not identify it. These are representation obligations, not merely coding conventions.

## Formulation

| Symbol | Meaning |
|---|---|
| $F$ | State-explicit forward/step program |
| $x,y,s,s'$ | Input, output, initial and resulting state |
| $\theta$ | Differentiated parameter components of $s$ |
| $\bar y,\bar\theta$ | Upstream cotangent and parameter vector-Jacobian product |
| $\mathcal T$ | Program transformation such as differentiation, batching or compilation |
| $\alpha(x)$ | Abstract metadata: shape, dtype, placement and static properties |
| $\mathcal P$ | Global-to-local placement map |
| $\mathcal E$ | Observable effects, including allowed mutation and randomness |

[MATHEMATICALLY-DERIVED] A semantic equivalence requirement is

$$
\operatorname{Obs}(F(x,s))\simeq_\tau\operatorname{Obs}(\mathcal T(F)(x,s)),
\qquad
\bar\theta=J_{F_y,\theta}(x,s)^\top\bar y,
$$

*(Eq. 28.1)*

where $F_y=\operatorname{proj}_y\circ F$ is the output projection, $\operatorname{Obs}$ includes outputs, specified state/effects and representation metadata, and $\simeq_\tau$ uses the separately declared numerical policy. A loss depending on differentiable successor state needs a cotangent for that state as well; the displayed VJP assumes the loss flows through $y$. Differentiation applies only to the specified differentiable components, not automatically to integer counters, random keys or device ownership.

## Mechanism

[DERIVED] **Eager execution** dispatches operations as the host program reaches them. The visible control flow and object state are part of that execution. **Autograd** records the derivative-relevant relationships of executed tensor operations and later propagates cotangents. An eager branch records the path actually taken, not every hypothetical branch. Saving an activation can reduce recomputation but extends storage lifetime. Updating a saved tensor in place can invalidate the backward computation unless the framework's supported semantics account for that mutation. A correct compiler path must preserve these relationships or transform them through an equivalent explicit representation.

[OFFICIAL-DOCUMENTATION] The examined PyTorch 2.14 autograd note describes version counters for in-place correctness checks and distinguishes grad, no-grad and inference modes. It also states a complex-gradient convention that differs from JAX's direct convention. [R28.2], “In-place correctness checks”, “Locally disabling gradient computation” and “Autograd for Complex Numbers”. [DERIVED] A framework comparison involving complex parameters therefore needs an explicitly aligned mathematical convention. A mismatch cannot be diagnosed by checking only real-valued output tensors.


```figure
id: fig-28.3
kind: diagram
title: Observable program state survives transformation
caption: A compiler must preserve the specified state transition and derivative relationship as well as output values.
  Random keys, mutation and placement are inputs to the contract, not hidden benchmark conveniences.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.1
alt: A compiler must preserve the specified state transition and derivative relationship as well as output values.
  Random keys, mutation and placement are inputs to the contract, not hidden benchmark conveniences.
concepts:
- ms.section.28.1
spec:
  direction: LR
  nodes:
  - id: x
    kind: tensor
    label: Inputs and parameter state
  - id: fx
    kind: process
    label: Forward execution
  - id: save
    kind: memory
    label: Saved derivative values
  - id: y
    kind: tensor
    label: Output and next state
  - id: vjp
    kind: process
    label: Registered vector Jacobian product
  - id: g
    kind: tensor
    label: Parameter cotangents
  edges:
  - from: x
    to: fx
  - from: fx
    to: save
  - from: fx
    to: y
    kind: emphasis
  - from: save
    to: vjp
    kind: dependency
  - from: y
    to: vjp
  - from: vjp
    to: g
```


[DERIVED] **JAX transformations** operate on programs expressed through supported primitives. Differentiation, vectorization and compilation compose only within their supported semantic domains. A batched function may add a leading dimension; a reduction must still target the intended axis. Transformation order can alter representation and resource use even when the real-arithmetic function agrees. For example, batching gradients can materialize per-example gradients, whereas differentiating a summed batched loss can reduce them during the derivative computation. These are different output contracts and storage requirements, not contradictory implementations of the same request.

[OFFICIAL-DOCUMENTATION] The released JAX 0.11.2 JIT guide shows that ordinary Python side effects do not become jaxpr primitives, while declared static arguments affect compiled reuse. [R28.3], “How JAX transformations work” and “Marking arguments as static”. [DERIVED] To preserve state, pass it into the transformed function and return its successor. Explicit random keys make the random transition inspectable; accidentally reusing a key can repeat a sample while still producing valid-shaped tensors. Buffer donation or mutation-aware mechanisms require a declared lifetime transfer and must not be treated as permission to read a consumed input later.

[MATHEMATICALLY-DERIVED] **Tracing** executes a program with abstract participants that record supported operations. Abstract shape/dtype information can justify static control flow; runtime data usually cannot be used as a Python Boolean without an explicit supported representation. A trace-time branch depending only on rank is different from a branch depending on an input element. A side effect outside the captured operation set can occur during tracing and be absent from replay. This is why repeated-call equivalence belongs in the test protocol rather than only first-call output comparison.


```figure
id: fig-28.4
kind: compare
title: What tracing must preserve
caption: The comparison concerns semantic responsibilities, not a framework ranking. A first-call output match cannot
  establish repeated-state or placement equivalence.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.1
alt: The comparison concerns semantic responsibilities, not a framework ranking. A first-call output match cannot
  establish repeated-state or placement equivalence.
concepts:
- ms.section.28.1
spec:
  axis: Which observable contract is required across an execution transformation
  columns:
  - id: numeric
    label: Numeric values
  - id: state
    label: State and effects
  - id: layout
    label: Representation
  rows:
  - dimension: Forward execution
    values:
      numeric: Output within declared policy
      state: Required mutation and RNG transition
      layout: Shape dtype strides alias
  - dimension: Backward execution
    values:
      numeric: Correct VJP for declared convention
      state: Saved-value lifetime respected
      layout: Gradient shapes and placements
  - dimension: Repeated compiled calls
    values:
      numeric: Every call remains equivalent
      state: Trace-time-only effects excluded
      layout: Static/dynamic assumptions valid
  - dimension: Distributed execution
    values:
      numeric: Same global value
      state: Required reduction completed
      layout: Shard/replicate/partial distinguished
```


[OFFICIAL-DOCUMENTATION] **PyTorch DTensor / DeviceMesh** describes a global tensor with `Shard`, `Replicate` and `Partial` placements and can propagate placements and introduce needed communication. **JAX**'s 0.9.0 export change preserves named sharding and requires matching abstract mesh names, not merely the same device count. [R28.14], placement and redistribution API; [R28.4], export serialization. [DERIVED] A `Partial` value is not an ordinary completed shard: it represents a pending reduction. Feeding it to an operation that assumes the global value is already assembled can change the result. Metadata must encode this distinction.

[MATHEMATICALLY-DERIVED] Let a global vector $z\in\mathbb R^d$ be sharded over $p$ devices with disjoint index sets $I_j$. Device $j$ stores $z_{I_j}$; reconstructing $z$ requires the placement map, not concatenation in an arbitrary device enumeration. If devices instead store contributions $u^{(j)}$ to the same coordinates, the global value is $z=\sum_j u^{(j)}$. Shards and partials can therefore have the same local shape and different semantics. A layout conversion has communication and temporary-memory cost. Shape inference that omits placement can be mathematically well-typed and operationally wrong.

[DERIVED] Resource accounting includes saved activations, derivative intermediates, explicit state copies and distributed reshards. A functional state representation does not require physically copying every tensor; compilation can alias or reuse storage when liveness and ownership permit. Conversely, an in-place-looking eager update may trigger internal copies or synchronization. Neither syntax establishes the byte cost. Record the generated memory plan and dispatch/communication trace before attributing a performance difference to a framework paradigm.

[MATHEMATICALLY-DERIVED] The parity harness below makes independently owned mutable state a correctness condition. To expose its storage consequence, construct an instant when both routes' buffers coexist. Let $S$ be distinct mutable-state bytes per route, $c$ additional full state snapshots per route, $A$ additional saved derivative bytes per route and $I$ immutable bytes shared by both routes. Count physical storage identities once: $A$ excludes views or references into the already counted state, snapshots and immutable buffers. For equal-sized routes with disjoint mutable/tape allocations,

$$
M_{\rm coexist}=I+2\bigl[(1+c)S+A\bigr],\qquad
M_{\rm coexist}(c+1)-M_{\rm coexist}(c)=2S.
$$

*(Eq. 28.19)*

This identity counts the declared buffers at that constructed instant. It is not a framework peak-memory estimate: allocator reservation, outputs, gradient buffers, workspace and unrelated live tensors are excluded unless separately added. If route tapes differ, replace $2A$ with $A_a+A_b$; if lifetimes do not overlap, use their actual live sets. Sharing immutable storage is legal under the contract, while sharing mutable reference/candidate state invalidates the test. Recomputation can reduce $A$ only if it reconstructs the correct pre-step state and random transition; setting the tape control to zero does not establish that such a replay is valid.

```figure
id: fig-28.21
kind: calculator
title: Independent state and retained derivative storage
caption: Count two independent routes at an explicitly constructed coexistence instant. Snapshot and tape controls reveal storage required by the declared parity harness, excluding unlisted allocations. These are assumed buffer sizes, not framework measurements.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-28.19
alt: Adjustable mutable-state, snapshot, derivative-tape and shared-immutable sizes show the physical storage counted for two independently owned execution routes.
concepts: [ms.section.28.1]
spec:
  tex: 'M=I+2\bigl[(1+c)S+A\bigr]'
  equation: '28.19'
  inputs:
    - symbol: S
      label: Mutable state per route
      default: 268435456
      min: 1048576
      max: 4294967296
      scale: log2
      format: bytes
    - symbol: c
      label: Additional snapshots per route
      default: 1
      min: 0
      max: 3
      options: [0, 1, 2, 3]
      format: integer
    - symbol: A
      label: Additional derivative storage per route
      default: 134217728
      min: 0
      max: 4294967296
      step: 16777216
      format: bytes
    - symbol: I
      label: Shared immutable storage
      default: 67108864
      min: 0
      max: 1073741824
      step: 1048576
      format: bytes
  outputs:
    - symbol: M
      label: Counted coexisting storage
      formula: 'I+2*((1+c)*S+A)'
      format: bytes
      emphasis: true
    - symbol: state
      label: Independent mutable states
      formula: '2*S'
      format: bytes
    - symbol: snapshot
      label: Additional state snapshots
      formula: '2*c*S'
      format: bytes
    - symbol: tape
      label: Additional derivative storage
      formula: '2*A'
      format: bytes
  presets:
    - label: No additional snapshots
      values: {S: 268435456, c: 0, A: 134217728, I: 67108864}
    - label: Replay with no retained tape
      values: {S: 268435456, c: 1, A: 0, I: 67108864}
```

## Algorithm

### Algorithm 28.1 — Compare state-explicit execution routes

[DERIVED] A book-authored semantic harness takes a fixed initial state, an input sequence and two execution routes. It checks repeated state transitions and gradients.

$$
\begin{aligned}
(1)&\quad s_0^a,s_0^b\gets\operatorname{independentCopies}(s_0);\quad\mathcal O\gets\varnothing.\\
(2)&\quad\text{for }t=0,\ldots,T-1:\ (y_t^a,s_{t+1}^a)\gets F_a(x_t,s_t^a).\\
(3)&\quad(y_t^b,s_{t+1}^b)\gets F_b(x_t,s_t^b);\quad\operatorname{awaitRequiredCompletion}.\\
(4)&\quad\neg\operatorname{ObsParity}(y_t^a,s_{t+1}^a,y_t^b,s_{t+1}^b)\Rightarrow\operatorname{reject}(t).\\
(5)&\quad\bar\theta_t^a,\bar\theta_t^b\gets\operatorname{VJP}(F_a,F_b;\bar y_t);\quad\neg\operatorname{GradientParity}\Rightarrow\operatorname{reject}(t).\\
(6)&\quad\operatorname{record}(\alpha,\mathcal P,\mathcal E,\mathcal O);\quad\text{return only after }T\text{ valid transitions.}
\end{aligned}
$$

The invariant is equal authorized initial state with independently owned mutable storage. Shared state would let one route modify the other's reference. Retain the derivative tape or independently reconstruct each route from its pre-step state for line5; differentiating an already mutated successor would test another transition. Both VJPs use the same upstream cotangent and differentiate the same declared state components. Work is the sum of both routes and their derivative checks; snapshots can add state-sized storage. No experiment was run here.

## Implementation

[DERIVED] **PyTorch**, **JAX** and **PyTorch DTensor / DeviceMesh** occupy *Model / autograd framework* and distributed-tensor responsibilities in the reference stack. **NVIDIA CUDA** in *Accelerator / driver / compiler* supplies device completion boundaries. Record modes, gradient conventions, static arguments, pytree/object structure, mutable buffers, RNG state, placement and donation/alias policy. Reconstruct the exact execution route; an API name does not prove whether a library, generated kernel or fallback ran.


```figure
id: fig-28.5
kind: systems-trace
title: Framework semantics through physical execution
caption: Explicit state can be implemented with reuse when ownership permits; in-place syntax alone does not establish
  traffic. Actual allocations and communication remain measurements.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.1
alt: Explicit state can be implemented with reuse when ownership permits; in-place syntax alone does not establish
  traffic. Actual allocations and communication remain measurements.
concepts:
- ms.section.28.1
spec:
  columns:
  - latency
  - memory
  - compute
  - communication
  - failure
  stages:
  - name: Eager or transformed call
    values:
      latency: Host dispatch boundary
      memory: Input and mutable state
      compute: Supported operations
      communication: Device enqueue
      failure: Dropped Python side effect
  - name: Derivative capture
    values:
      latency: Forward bookkeeping
      memory: Saved values or recomputation
      compute: VJP construction
      communication: Backward stream dependencies
      failure: Saved tensor changed
  - name: Placement propagation
    values:
      latency: Possible reshard cost
      memory: Local and temporary shards
      compute: Global operator semantics
      communication: Required collectives
      failure: Partial mistaken for shard
  - name: Completion and comparison
    values:
      latency: Await observed boundary
      memory: Independent state snapshots
      compute: Output and gradient checks
      communication: All needed work complete
      failure: Host timer sees only enqueue
```


## Experimental design

[NOT-DISCLOSED] The cited API contracts do not supply a matched study proving semantic equivalence for arbitrary user stateful models. [ASSUMED] The proposed test compares eager and compiled routes over repeated inputs, changed shapes, stateful updates, branch changes, aliased views and distributed placements where available. Use identical initial bytes and random streams under aligned conventions. Compare output, state and gradients independently; retain metadata and communication traces. A single-device experiment cannot validate multi-device placement propagation.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The versioned artifacts define tracing, gradient and placement behavior, including explicit release changes. They do not certify the book's unexecuted harness.

**What the evidence shows.** [DERIVED] Program semantics extend beyond numeric output arrays. Official interface contracts identify fields that a parity test must preserve.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 28.1 makes state/effects and VJPs separate obligations. Matching one output does not imply matching the transition function.

**What remains unknown.** [UNVERIFIED] Actual model-state equivalence, allocation reuse, reshard costs and complex-gradient alignment await a pinned execution study.

## Failure modes

[DERIVED] First-call agreement can conceal trace-time-only mutation. Shared reference/candidate buffers can invalidate comparison. A reused random key can repeat randomness. A misplaced reduction axis can turn batched gradients into a different output. A pending partial mistaken for a shard can omit communication. Detect these through multi-step tests, independent state ownership, explicit random transitions and placement assertions.

## Siblings

[DERIVED] Eager execution exposes immediate host control; functional transformations expose explicit state and primitive-level staging; distributed tensors add global placement semantics. None guarantees lower duration. The capture/specialization boundary is developed in [§28.2](28-2-compilation-pipeline.md).

## Extensions

[OFFICIAL-DOCUMENTATION] PyTorch 2.14 adds autograd extension points and JAX 0.11.2 expands explicit sharding/FFI-related surfaces. [R28.1], “Autograd Extension Points”; [R28.3], release notes. [DERIVED] New introspection changes what can be observed, not the mathematical requirement to preserve derivative and state contracts.

## Limitations

[DERIVED] This account excludes arbitrary Python side effects from transformed semantics unless explicitly supported. Numeric parity is conditional on the declared policy. Placement metadata does not prove a particular collective implementation or fault-tolerance behavior.

## Reproducibility

[DERIVED] Archive initial state, mode, transform order, static arguments, placement, output/state/gradient records and exact framework/backend releases. Keep the proposed study unexecuted and the manuscript in draft status.

## References

[R28.1] PyTorch 2.14 release; [R28.2] autograd semantics; [R28.3] JAX 0.11.2 release/JIT artifact; [R28.4] JAX 0.9.0 export change; [R28.14] DTensor API. See [references.md](references.md).
