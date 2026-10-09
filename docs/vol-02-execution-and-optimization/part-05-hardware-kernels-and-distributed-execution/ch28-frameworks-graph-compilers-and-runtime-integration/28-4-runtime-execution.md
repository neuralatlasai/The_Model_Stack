---
id: ms.section.28.4
entity_type: section
title: Runtime execution
short_title: Runtime execution
volume: 2
part: 5
chapter: 28
section: 28.4
slug: 28-4-runtime-execution
parent: ms.chapter.28
prev_sibling: ms.section.28.3
next_sibling: ms.section.28.5
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

# 28.4 — Runtime execution

## Scope

[DERIVED] This section covers graph replay, allocation pools, shape buckets and dispatch after a computation has been captured and lowered. It treats runtime execution as an owned contract involving addresses, streams, events and object lifetimes. The artifact is a replay eligibility ledger and a memory/cost budget for each supported bucket. CUDA Graphs provide the inspected concrete mechanism; analogous runtimes must establish their own documented guarantees.

[OFFICIAL-DOCUMENTATION] The primary snapshots are CUDA 13.1's graph guide and PyTorch 2.14's CUDA semantics. PyTorch 2.14 also documents native XPU graph capture, demonstrating why “graph replay” should not be equated with one vendor API. No performance or address-lifetime property is transferred from CUDA to XPU without separate evidence. [R28.9], graph lifecycle; [R28.10], CUDA graphs; [R28.1], XPU support.

## Why this exists

[DERIVED] A compiled program can still issue many short launches through a host runtime. When host dispatch is material relative to device work, replaying a prepared dependency graph may reduce that dispatch cost. The opportunity is workload-dependent: a long compute-bound kernel need not benefit materially, and extra capture, allocation or padding can dominate infrequently reused graphs. The correct measurement is a complete invocation with the same semantic output.

[DERIVED] Replay also changes storage obligations. A pointer embedded in a captured launch must still identify valid intended storage later. Ordinary eager allocation habits can violate this requirement if an input buffer is replaced, freed or reused incorrectly. Keeping every buffer forever avoids one lifetime failure but can exceed memory capacity. An engineering design must specify both eligibility for replay and release conditions for pools and graph objects.

## Intuition

[DERIVED] A runtime graph is a prepared schedule of work and dependencies. It reduces repeated work in the submission path; it does not automatically reduce the mathematical operation count. Static input buffers act as an interface: new values may be copied into stable storage while the replay keeps its address contract. This is different from recompiling an executable for a new shape, and different again from fusing several operations into one kernel.

[OFFICIAL-DOCUMENTATION] CUDA documents graph definition, instantiation, execution and restricted updates as separate stages. PyTorch's capture rules require appropriate stream handling, prohibit CPU-GPU synchronization such as scalar extraction during capture and require replayed tensor storage addresses and relevant metadata to remain consistent. These are eligibility constraints, not optional performance hints. [R28.9], graph execution and update; [R28.10], constraints.

## Formulation

[MATHEMATICALLY-DERIVED] For a launch-dominated sequential accounting model, let $C$ include capture and instantiation, $K$ be ordinary launch count, $\lambda$ average host launch cost and $\lambda_g$ graph submission cost. Let $\Delta$ include extra per-invocation copying, padding or replay-only work. Replay amortizes only when

$$
N\bigl(K\lambda-\lambda_g-\Delta\bigr)>C,
\qquad K\lambda-\lambda_g-\Delta>0,
\qquad M_{\mathrm{persistent}}+M_{\mathrm{pools}}+M_{\mathrm{active}}\le M_{\mathrm{budget}}.
$$

*(Eq. 28.4)*

[DERIVED] The first inequality assumes equivalent device computation apart from $\Delta$; different scheduling or overlap requires direct timing instead. The second condition prevents reporting a fictitious finite break-even when replay has no per-invocation advantage. The capacity condition must account for actual pool sharing and overlap, not just the largest tensor. All defaults in the instruments below are analytical inputs, not measured CUDA launch costs.

## Mechanism

[OFFICIAL-DOCUMENTATION] **Graph lifecycle.** A graph definition describes nodes and dependencies; instantiation prepares an executable; launches replay that executable. Updates are permitted only under documented compatibility constraints. CUDA's guide also describes conditional nodes and graph memory allocation nodes. Their existence does not mean arbitrary host branching or allocation is captured by every framework wrapper. [R28.9], graph creation, execution, update and conditional nodes.


```figure
id: fig-28.12
kind: diagram
title: Replay requires a persistent address contract
caption: 'Authored runtime lifecycle: capture and instantiate prepare a replay family; new values enter stable buffers
  and outputs must be consumed before reuse. Lifetime dependencies remain explicit.'
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.4
alt: 'Authored runtime lifecycle: capture and instantiate prepare a replay family; new values enter stable buffers
  and outputs must be consumed before reuse. Lifetime dependencies remain explicit.'
concepts:
- ms.section.28.4
spec:
  direction: LR
  nodes:
  - id: alloc
    kind: memory
    label: Own stable buffers
  - id: cap
    kind: process
    label: Capture dependencies
  - id: inst
    kind: state
    label: Instantiate executable
  - id: copy
    kind: tensor
    label: Copy new input values
  - id: replay
    kind: process
    label: Replay on owned stream
  - id: out
    kind: tensor
    label: Consume before overwrite
  - id: release
    kind: boundary
    label: Release after final owner
  edges:
  - from: alloc
    to: cap
    kind: flow
  - from: cap
    to: inst
    kind: flow
  - from: inst
    to: replay
    kind: dependency
  - from: alloc
    to: copy
    kind: dependency
  - from: copy
    to: replay
    kind: flow
  - from: replay
    to: out
    kind: flow
  - from: out
    to: copy
    kind: feedback
  - from: out
    to: release
    kind: dependency
```


[OFFICIAL-DOCUMENTATION] **Capture constraints.** The inspected PyTorch guide documents a nondefault stream requirement for raw capture, while its graph context manages capture-stream behavior. CPU synchronization inside capture is prohibited. RNG requires graph-safe state handling. Ordinary Python control flow is not itself a replayed device computation. PyTorch 2.14's higher-order control-flow additions should be evaluated through their supported lowering, rather than used to erase these host-capture distinctions. [R28.10], constraints; [R28.1], control flow.

[DERIVED] **Stable storage.** Copying new data into a captured input buffer preserves an address while changing values. Replacing a Python variable with a different allocation does not modify the address already embedded in a replayed launch. Output references also require an ownership policy: consuming an output after the next replay may read overwritten storage unless it is copied or its lifetime is otherwise protected. Include these copies in the cost boundary.

[OFFICIAL-DOCUMENTATION] **Pools.** PyTorch documents graph-private memory pools whose lifetimes depend on graph and captured tensor ownership. Pool sharing requires compatible execution order and nonconcurrent use; it is not a universal memory-saving switch. The 2.14 release also describes graph retention of multiple memory pools. Consequently a pool budget must reflect actual retained objects and concurrent replay behavior. [R28.10], graph memory management; [R28.1], CUDA graph pool retention.


```figure
id: fig-28.13
kind: calculator
title: Launch-only amortization is conditional
caption: 'Illustrative launch-only model with no extra copies or padding: graph submission is rho times one ordinary
  launch. The input ranges ensure a positive saving; use Eq. 28.4 for additional costs. Values are assumed, not
  benchmarks.'
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.4
alt: 'Illustrative launch-only model with no extra copies or padding: graph submission is rho times one ordinary
  launch. The input ranges ensure a positive saving; use Eq. 28.4 for additional costs. Values are assumed, not
  benchmarks.'
concepts:
- ms.section.28.4
spec:
  equation: '28.4'
  tex: N_*={C\over(K-\rho)\lambda}
  inputs:
  - symbol: C
    label: Capture and instantiation seconds
    default: 0.02
    min: 0.001
    max: 2
    format: seconds
  - symbol: K
    label: Ordinary launch count
    default: 20
    min: 2
    max: 200
    format: integer
  - symbol: L
    label: Seconds per ordinary launch
    default: 4.0e-06
    min: 1.0e-06
    max: 0.0001
    format: seconds
  - symbol: R
    label: Graph / one-launch ratio
    default: 0.8
    min: 0
    max: 1
    format: ratio
  outputs:
  - symbol: D
    label: Launch saving per replay
    formula: (K-R)*L
    format: seconds
  - symbol: N
    label: Continuous break-even count
    formula: C/((K-R)*L)
    format: fixed2
```


[DERIVED] **Shape buckets.** A bucket assigns variable input shapes to a fixed replay-compatible signature. Padding may reduce variant count while increasing arithmetic and storage. For dense self-attention, extending a sequence from $T$ to $B$ increases the quadratic pair count by $B^2/T^2$, before considering algorithm-specific sparsity or other costs. That ratio is book-derived operation accounting, not a measured latency multiplier. The padded mask must preserve the semantic treatment of invalid tokens.

[DERIVED] Bucketing also affects queueing. Waiting to fill a bucket can improve utilization while increasing request delay. An offline batch-throughput optimum does not establish an online latency optimum. Keep scheduler wait outside device-only timing but inside the service-level measurement. A request whose signature misses all eligible buckets needs a defined fallback or a controlled new capture, rather than an accidental unbounded pool allocation.


```figure
id: fig-28.14
kind: compare
title: Bucket reuse trades storage and work
caption: Authored qualitative comparison. Padding changes valid work and masks; independent graph owners change
  retained storage. No row asserts measured throughput or a universal best policy.
placement: wide
evidence: DERIVED
source: DERIVED:eq-28.4
alt: Authored qualitative comparison. Padding changes valid work and masks; independent graph owners change retained
  storage. No row asserts measured throughput or a universal best policy.
concepts:
- ms.section.28.4
spec:
  axis: Runtime choice
  columns:
  - id: exact
    label: Exact signature
  - id: bucket
    label: Padded bucket
  - id: fallback
    label: Dynamic fallback
  rows:
  - dimension: Reuse
    values:
      exact: One compatible shape/layout family
      bucket: Several inputs mapped to one signature
      fallback: No replay eligibility assumed
  - dimension: Additional work
    values:
      exact: Copies and dispatch still counted
      bucket: Padding and masks plus copies
      fallback: Ordinary dispatch or compilation
  - dimension: Memory
    values:
      exact: Pools per owned graph family
      bucket: Larger static buffers and pools
      fallback: Allocator/runtime dependent
  - dimension: Risk
    values:
      exact: Too many rare variants
      bucket: Changed semantics or wasted work
      fallback: Unbounded new compilation
  - dimension: Acceptance
    values:
      exact: Address and state parity
      bucket: Mask parity plus cost/capacity
      fallback: Explicit supported fallback
```


## Algorithm

[DERIVED] **Algorithm 28.4 — Eligible graph replay with bounded storage.** Inputs are a verified executable, bucket signatures, concurrency policy and memory budget. Output is a captured replay family or an explicit fallback decision.

1. For each bucket, allocate owned input/output and state buffers. Record shape, stride, dtype, device, address and lifetime obligations.
2. Warm the required kernels and libraries outside capture according to the runtime's rules. Separate this setup from capture timing.
3. Capture on an allowed stream without forbidden host synchronization. Instantiate and record graph/pool ownership and update constraints.
4. Verify one replay against the reference, then verify new input values, state transitions and repeated output consumption. Include RNG and backward execution when required.
5. Before dispatch, check bucket eligibility and capacity under the concurrency policy. Copy or pack into stable buffers and record that cost.
6. Replay with explicit dependencies, consume outputs before overwrite and release only after all dependent work and owners permit it. Fall back on unmet eligibility; do not replay an incompatible graph.

[DERIVED] The invariant is that every replayed address remains valid for the intended tensor until its final consumer finishes. Numerical equivalence, RNG behavior and state evolution remain separate checks. An allocation that is still live can nevertheless contain the wrong request's data.

[DERIVED] The replay owner implements bounded preparation and guarded request dispatch. Let $\mathcal B$ be the finite bucket set and $\operatorname{eligible}$ include address, metadata, state and concurrency checks.

$$
\begin{aligned}
(1)&\quad\text{for }b\in\mathcal B:\ (U_b,P_b)\gets\operatorname{allocateOwned}(b);\quad\operatorname{warmOutsideCapture}(b).\\
(2)&\quad E_b\gets\operatorname{instantiate}(\operatorname{capture}(b,U_b,P_b));\quad\neg\operatorname{Parity}_\tau(E_b)\Rightarrow\operatorname{reject}(b).\\
(3)&\quad\text{for request }x:\ b\gets\operatorname{bucket}(x).\\
(4)&\quad\neg\operatorname{eligible}(x,b,U_b,P_b)\Rightarrow\operatorname{fallback}(x).\\
(5)&\quad\operatorname{pack}(x,U_b);\quad\operatorname{orderDependencies}(b);\quad\operatorname{launch}(E_b).\\
(6)&\quad\operatorname{consumeBeforeOverwrite}(U_b);\quad\operatorname{releaseOnlyAfterFinalOwner}(b).
\end{aligned}
$$

[DERIVED] The fallback branch terminates the replay path for that request. Preparation is bounded by the declared bucket count. Request work includes packing, submission, device execution and output handling; retained auxiliary storage is the sum of independently owned pools/buffers after valid sharing is accounted for. Completion and release are event-governed, not inferred from host return.

## Implementation

[DERIVED] Keep graph objects, pools and static buffers in one explicit runtime owner. Define whether one owner can serve concurrent requests; if not, serialize access or provision independent instances and account for their memory. Model stream/event dependencies as part of dispatch. A lock around a Python call is insufficient when asynchronous device work outlives the lock's scope.

[OFFICIAL-DOCUMENTATION] **NVIDIA CUDA**, in *Accelerator / driver / compiler*, owns graph instantiation and launch contracts. **PyTorch**, in *Model / autograd framework*, adds allocator and tensor-lifetime behavior. Its CUDA semantics also explain that certain native allocator statistics do not retain their usual meaning under the asynchronous allocation backend. Do not sum incomparable allocator counters and call the result a physical capacity measurement. [R28.9], lifecycle; [R28.10], allocator notes.

[DERIVED] Semantic comparison fixes learned parameters and valid tokens. The complete invocation counts generated and library FLOPs, conversion/transfer traffic, temporary or retained memory and all host dispatch; padding is additional work rather than valid data. Distributed communication is added when placement requires it. Achieved throughput, power, joules and financial cost are UNVERIFIED: analytical graph or launch savings cannot replace synchronized timing, a power integral or dated billed-resource evidence.

## Experimental design

[DERIVED] Compare ordinary compiled dispatch and graph replay using identical input values and numerical settings. Report capture/instantiation separately, complete first-use latency, warmed latency, graph launch time and input/output copy cost. Sweep reuse count, sequence buckets and concurrency. Track retained pool memory after every new bucket and after intended release. Test repeated graph creation and destruction for leaks in the chosen ownership policy.

[DERIVED] Include a long compute-bound case and a many-short-kernel case. Ablate padding, pool sharing and the number of concurrently owned graphs. Use device events for device intervals and an appropriate synchronized host boundary for complete invocations. The acceptance condition is improved total cost within numerical and memory policies, not fewer visible launches. This manuscript supplies no measured replay speedup or peak-memory result.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] CUDA 13.1 documents graph lifecycle, update and dependency mechanisms. PyTorch 2.14 documents capture constraints, stable storage and pool management; its release adds graph-related platform and retention capabilities. [R28.9], [R28.10], [R28.1].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Replay has explicit eligibility and lifetime requirements. The sources support an address/pool ledger and distinguish host capture from device conditional execution. They do not establish the launch savings or bucket policy for this book's workload.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 28.4 gives a conditional break-even and a separate capacity gate. If extra copying or padding removes the per-invocation advantage, additional reuse cannot amortize replay under this model.

**What remains unknown.** [UNVERIFIED] Actual submission overhead, device overlap, allocator behavior and service-level queueing remain unmeasured on the target deployment. An analogous non-CUDA runtime requires its own inspected lifetime and capture contract.

## Failure modes

[DERIVED] Rebinding a tensor can leave a captured pointer unchanged. Reading an output after a later replay can observe another request. Sharing a pool across concurrent graphs can violate its declared ordering. Capturing a host scalar extraction can fail or introduce an unsupported boundary. Padding without correct masks changes the function. A graph family can individually fit memory while its retained pools collectively exceed capacity. These failures require lifetime, semantic and budget tests respectively.

## Siblings

[DERIVED] Fusion in §26.4 changes operation boundaries and intermediate storage; graph replay retains a dependency graph while reducing submission work. Compilation in §28.2 changes graph representation and specialization. A valid runtime may combine all three. Deployment qualification in [§28.6](28-6-deployment-reproducibility.md) records which graph family, buffers, versions and warmup state were actually tested.

## Extensions

[OFFICIAL-DOCUMENTATION] CUDA's conditional graph nodes and PyTorch 2.14 control-flow integration expand the available representation of device-dependent execution. [R28.9], conditional nodes; [R28.1], control flow. [DERIVED] An adaptive bucket controller could trade retained graph memory against reuse frequency, but must preserve capacity, lifetime and service-latency constraints. This is a proposed system design, not an evaluated result.

## Limitations

[DERIVED] The sequential launch model abstracts overlap, driver scheduling and distributed progress. Static bucket signatures do not capture every value-dependent constraint. Allocator bookkeeping can differ from physical residency. Neither successful capture nor a documented API establishes race freedom. The finite validation protocol does not prove replay correctness for every possible interleaving.

## Reproducibility

[DERIVED] Archive bucket rules, graph construction, stream/event policy, pool ownership, buffer metadata, warmup sequence, concurrency and release procedure. Preserve cold and warm timing boundaries and all retained-memory measurements. Record exactly which unsupported signatures use fallback. Reproduce with the same framework, runtime, driver and accelerator architecture; treat a changed component as a new qualification request.

## References

[R28.1] PyTorch 2.14 release; [R28.9] CUDA 13.1 graph guide; [R28.10] PyTorch 2.14 CUDA semantics. Full originating release dates, inspected URLs and section locators are in [references.md](references.md).
