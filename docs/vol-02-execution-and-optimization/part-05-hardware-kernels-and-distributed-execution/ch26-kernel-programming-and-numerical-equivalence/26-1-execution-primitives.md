---
id: ms.section.26.1
entity_type: section
title: Execution primitives
short_title: Execution primitives
volume: 2
part: 5
chapter: 26
section: 26.1
slug: 26-1-execution-primitives
parent: ms.chapter.26
prev_sibling: null
next_sibling: ms.section.26.2
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

# 26.1 — Execution primitives

## Scope

[DERIVED] The object being optimized is an indexed computation together with its ownership, ordering and numerical contracts. This section develops threads, program instances, tiles, vector accesses, coalescing, synchronization and reductions. Its baseline is a correct scalar specification; success means that every valid output has one authorized producer and every read observes its required writes. Device peaks and throughput comparisons belong to [Chapter 25](../ch25-accelerators-memory-hierarchy-and-performance-models/README.md); here the accounting boundary is one operator launch.

## Why this exists

[OFFICIAL-DOCUMENTATION] NVIDIA's rewritten CUDA 13.1 guide describes grid/block/thread execution, shared storage, coalesced access and occupancy separately. Triton 3.6 adds checks and corrections around loop bounds, layouts and reductions. These are release-specific implementation contracts, not evidence that these mechanisms originated in 2026. [R26.1], §§2.2.2–2.2.7; [R26.3], “Dialect & Frontend” and “Backend & Compiler”.

[DERIVED] Parallel execution removes the sequential ordering that makes an otherwise plausible scalar loop correct. Tiling introduces reuse but also changes which thread owns a value and how long storage remains valid. A reduction introduces a dependency tree that is absent from the elementwise map. Combining these operations without an explicit ownership model makes performance tuning indistinguishable from modifying the algorithm accidentally. A successful optimization begins by identifying these distinctions rather than selecting a block size from a previous benchmark.

## Intuition

[MATHEMATICALLY-DERIVED] An index map is a small proof. For a one-dimensional output of length $n$, let program index $p$, tile width $q$ and local offset $r$ produce $i=pq+r$. Restrict $0\leq r<q$ and mask $i<n$. Euclidean division gives a unique pair $(p,r)$ for every $i\in[0,n)$, so the map covers the domain exactly once. Vectorization groups several consecutive offsets into one instruction; it changes the access granularity without changing the logical domain. A reduction instead maps many input indices to one output, so uniqueness of writers must be replaced by a defined combining operation and an ordering protocol.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $n,q,w$ | Valid elements, tile width, active hardware-group width | Elements/lanes |
| $p,r$ | Program and tile-local index | Integer |
| $a_i$ | Byte address of logical input $i$ | Byte address |
| $b$ | Bytes per stored value | Bytes/value |
| $g$ | Assumed transaction-sector width for an analytical example | Bytes |
| $\mathcal W_p,\mathcal R_p$ | Addresses written/read by program $p$ | Sets |
| $\prec$ | Required happens-before relation | Partial order |

[MATHEMATICALLY-DERIVED] Define the valid map and transaction-cover count as

$$
 i(p,r)=pq+r,\quad m(p,r)=\mathbf1[i(p,r)<n],\qquad
 Q=\left|\left\{\left\lfloor (a_{i(p,r)}+j)/g\right\rfloor:m(p,r)=1,\ 0\le j<b\right\}\right|.
$$

*(Eq. 26.1)*

$Q$ covers every byte of each addressed value, including a value that straddles a sector boundary. Assume integer byte widths $b,g>0$, $0\le r<q$, and $0\le p<\lceil n/q\rceil$. $Q$ counts sectors touched by that byte-address set; it is not a measured HBM transaction count. Caches, request merging, alignment, write policy and instruction decomposition can change the physical traffic. Logical useful-byte efficiency for this model is $\eta=n_ab/(Qg)$, where $n_a$ is the number of distinct useful values addressed. Broadcasts require counting distinct values, not multiplying a single address by the number of requesting lanes.

## Mechanism

[DERIVED] A **thread** is a scalar execution participant with its own logical indices. A **program instance** is a DSL-level unit operating on a block of values; it need not correspond to one hardware thread. Treat the mapping from block values to lanes, registers and shared memory as a separate layout decision. Confusing program count with thread count gives incorrect occupancy estimates and can conceal duplicated work. CUDA block independence also means that one ordinary block cannot assume another block has already produced its data merely because its index is smaller. [R26.1], “Thread Hierarchy”; [R26.3], “Gluon & Layout Improvements”.

[MATHEMATICALLY-DERIVED] **Tiling** partitions an iteration space while preserving its dependencies. For matrix multiplication, one output tile of $m_t\times n_t$ consumes slabs of $m_t\times k_t$ and $k_t\times n_t$. Its useful multiply-add count is $2m_tn_tk_t$ FLOPs per depth slab; a single-load model reads $b k_t(m_t+n_t)$ bytes. The slab's arithmetic intensity is therefore $2m_tn_t/[b(m_t+n_t)]$, excluding the output and assuming reuse within the tile. Increasing $k_t$ does not change this simplified ratio; it changes loop overhead, staging capacity and dependency length. An optimization justified solely by increasing this intensity through a deeper $k$ tile is using the wrong expression.

[DERIVED] **Vectorization** combines adjacent elements into a wider memory or arithmetic operation only when alignment, bounds, representation and lane layout allow it. A vector pointer cast does not prove these conditions. The final incomplete vector must be masked safely or handled by a scalar remainder. Overreading into another allocation remains invalid even if the value is discarded. Coalescing concerns the addresses issued collectively by a hardware group; vectorization concerns each issuing participant's access width. Either can improve while the other deteriorates. Transposed access is a useful counterexample: contiguous register vectors can still form a strided collective address pattern.


```figure
id: fig-26.3
kind: diagram
title: Logical ownership and physical access
caption: A valid masked index map establishes ownership before the compiler chooses a lane layout. Coalescing depends
  on the resulting address set, not on the logical tensor name.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.1
alt: A valid masked index map establishes ownership before the compiler chooses a lane layout. Coalescing depends
  on the resulting address set, not on the logical tensor name.
concepts:
- ms.section.26.1
spec:
  direction: LR
  nodes:
  - id: domain
    kind: tensor
    label: Logical output domain
  - id: map
    kind: process
    label: Program and local index map
  - id: mask
    kind: boundary
    label: Valid-element predicate
  - id: layout
    kind: process
    label: Lane and register layout
  - id: addr
    kind: memory
    label: Physical byte addresses
  - id: owner
    kind: metric
    label: Exactly one valid producer
  edges:
  - from: domain
    to: map
  - from: map
    to: mask
  - from: mask
    to: layout
  - from: layout
    to: addr
  - from: map
    to: owner
    kind: dependency
```


[DERIVED] **Synchronization** has two obligations: participants agree on the rendezvous and the relevant writes become visible before dependent reads. A block barrier reached only by threads with $i<n$ can deadlock on a partial tile. Instead, every required participant reaches the barrier while invalid lanes contribute neutral elements. A memory fence orders visibility at a specified scope; it does not by itself force the consumer to wait. An atomic access protects that location under its defined semantics; it does not automatically publish unrelated payload storage. State the synchronization scope—subgroup, block, cluster, device or system—and prove it matches the producer and consumer sets.

[MATHEMATICALLY-DERIVED] For summation, a balanced binary reduction over $q$ leaves has depth $\lceil\log_2q\rceil$ and $q-1$ additions when padded neutral leaves are excluded from useful work. A scalar chain has depth $q-1$. They represent the same real-arithmetic sum but generally different floating-point programs. A two-stage device reduction writes $P=\lceil n/q\rceil$ partials before reducing them, adding approximately $2Pb_a$ bytes of auxiliary traffic, with $b_a$ the partial accumulator width. An atomic final combine avoids that partial array but permits a schedule-dependent summation order unless a stronger algorithmic contract is imposed.

[MATHEMATICALLY-DERIVED] The reduction instrument uses the explicit identities

$$
P=\lceil n/q\rceil,\qquad Q_{\rm partial}=2Pb_a,\qquad D_{\rm tree}=\lceil\log_2q\rceil.
$$

*(Eq. 26.11)*

The tree depth permits a balanced padded tree; its useful additions exclude neutral padding. The algorithm below chooses a power-of-two $q$ to specify the exact local reduction. The calculator also permits other widths as a depth/traffic model, not as a claim that that exact algorithm accepts them.



```figure
id: fig-26.4
kind: calculator
title: Tree depth and partial-buffer traffic
caption: Illustrative two-stage reduction, not a measured kernel. Tile width changes the number of global partials
  and local tree depth; the additional bytes count one write and one read of each accumulator.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.11
alt: Illustrative two-stage reduction, not a measured kernel. Tile width changes the number of global partials and
  local tree depth; the additional bytes count one write and one read of each accumulator.
concepts:
- ms.section.26.1
spec:
  equation: '26.11'
  tex: P=\lceil n/q\rceil,\quad M_{\mathrm{partial}}=2Pb_a
  inputs:
  - symbol: n
    label: valid input elements
    default: 1048576
    min: 1
    max: 16777216
    format: integer
  - symbol: q
    label: tile width
    default: 256
    min: 32
    max: 1024
    format: integer
  - symbol: ba
    label: accumulator bytes
    default: 4
    min: 2
    max: 8
    format: bytes
  outputs:
  - symbol: P
    label: global partials
    formula: ceil(n/q)
    format: integer
  - symbol: M
    label: partial write and read
    formula: 2*ceil(n/q)*ba
    format: bytes
  - symbol: h
    label: local tree levels
    formula: ceil(log2(q))
    format: integer
```


[DERIVED] Resource accounting must include index arithmetic and masks when small tiles make them significant. Coalesced input reads do not eliminate repeated rereads across programs. Shared-memory reductions consume storage proportional to the staged values and require explicit reuse barriers. A kernel with many resident blocks may still stall on a single long dependency chain. Occupancy is a capacity constraint on concurrent work, whereas latency hiding is a consequence of ready independent work; one is not a substitute measurement for the other.

## Algorithm

[MATHEMATICALLY-DERIVED] The following book-authored two-stage sum is a specification, not a claim about a particular library kernel. Inputs are finite $x\in\mathbb R^n$, $n\geq0$, power-of-two $q$, and an accumulator type with a declared error policy. Output is $y$ and a completion status.

$$
\begin{aligned}
(1)&\quad P\gets\lceil n/q\rceil;\quad n=0\Rightarrow\operatorname{return}(0,\mathrm{done}).\\
(2)&\quad v_{p,r}^{(0)}\gets\begin{cases}\operatorname{cast}_a(x_{pq+r})&pq+r<n,\\0&\text{otherwise};\end{cases}\quad0\le p<P,\ 0\le r<q.\\
(3)&\quad v_{p,r}^{(h+1)}\gets v_{p,2r}^{(h)}+v_{p,2r+1}^{(h)},\quad0\le r<q/2^{h+1},\quad h=0,\ldots,\log_2q-1.\\
(4)&\quad u_p\gets v_{p,0}^{(\log_2q)};\quad\operatorname{complete}(u_{0:P})\prec\operatorname{read}(u_{0:P}).\\
(5)&\quad y\gets\operatorname{TreeSum}_a(u_{0:P});\quad\mathrm{status}\gets\mathrm{done}.
\end{aligned}
$$

Each level reads only the previous completed level; an implementation needs the appropriate synchronization or register-shuffle guarantees. Termination is bounded by $\log_2q$ local levels and a finite second reduction. Including padded lanes, work is $O(Pq+P)=O(n+q)$ for $n>0$; auxiliary storage is $O(P)$ globally plus up to $O(q)$ local staging per active program. The $n=0$ branch returns before allocating or reducing partials. The invariant is that every live value represents exactly its disjoint assigned subset of valid leaves. Nonfinite inputs are rejected here; accepting them requires an explicit NaN/infinity policy.

## Implementation

[OFFICIAL-DOCUMENTATION] **NVIDIA CUDA** is in the *Accelerator / driver / compiler* layer. Its CUDA 13.1 guide places shared memory at block scope and warns that spilling registers can introduce local-memory accesses. **Triton language**, in *Kernels / numerics / collectives*, exposes block computations and compiler-controlled layouts. **AMD HIP**, in *Accelerator / driver / compiler*, describes a similar logical hierarchy but requires architecture-specific performance decisions. [R26.1], “GPU Device Memory Spaces”; [R26.3], layout/compiler sections; [R26.4], “Hierarchical thread model”.

[DERIVED] The implementation ledger records logical shape, strides, alignment, grid, group count, register allocation, shared bytes, accumulator type and generated instructions. A reduction benchmark must record whether it includes the second launch, partial allocation and synchronization. No network communication is required for a single-device operator; this is a boundary condition, not a claim that the containing training step is communication-free. Energy and financial cost require duration and power/allocation measurements and are UNVERIFIED for this manuscript.


```figure
id: fig-26.5
kind: systems-trace
title: Reduction dependency and accounting boundaries
caption: The second stage may read partials only after their producers complete. Every stage has a separate failure
  condition; host enqueue time cannot substitute for complete-operator latency.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.1
alt: The second stage may read partials only after their producers complete. Every stage has a separate failure
  condition; host enqueue time cannot substitute for complete-operator latency.
concepts:
- ms.section.26.1
spec:
  columns:
  - latency
  - memory
  - compute
  - communication
  - failure
  stages:
  - name: Load and mask
    values:
      latency: Included in operator
      memory: Input reads and neutral lanes
      compute: Index and cast
      communication: No network
      failure: Incorrect boundary mask
  - name: Local combine
    values:
      latency: Dependency tree
      memory: Registers or shared staging
      compute: q minus one adds
      communication: Block coordination
      failure: Divergent barrier
  - name: Publish partials
    values:
      latency: First-launch completion
      memory: P accumulator writes
      compute: One owner per partial
      communication: Stream dependency
      failure: Early second-stage read
  - name: Final combine
    values:
      latency: Second launch included
      memory: P accumulator reads
      compute: Defined reduction order
      communication: No network
      failure: Schedule-dependent sum
```


[DERIVED] At the complete-operator boundary, ownership and vectorization preserve logical parameters and valid elements; they change issued instructions, actual memory transactions and launch/coordination costs. The sector equation bounds requested address coverage, not measured HBM traffic. Local synchronization adds no inter-node communication, while a later placement change can. Achieved latency and throughput require synchronized runs; energy requires a power integral and money requires a dated price multiplied by billed resources. These outcomes are UNVERIFIED, and lower transaction counts alone do not establish either saving.

## Experimental design

[NOT-DISCLOSED] The inspected release descriptions do not provide a matched experimental study for this chapter's index-map and reduction variants. They establish interfaces and reported fixes. They do not disclose a common shape matrix, input distribution, seed set, numerical reference, repetitions or uncertainty interval permitting a portable throughput comparison.

[ASSUMED] The proposed experiment varies $n$ around zero, one, group boundaries, tile boundaries and large streaming inputs; varies alignment and strides independently; and compares scalar reference, one-stage reduction, two-stage reduction and atomic combine. Seal the inputs before tuning. Use high-precision arithmetic on small cases and a documented higher-precision reference on large cases. Collect device-event time for the full operator, requested and measured bytes separately, and compiler resource reports. Repeated measurement should randomize candidate order and retain individual samples rather than only the minimum.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The cited versioned guides specify execution and memory behavior; Triton 3.6 reports layout and reduction-related compiler changes. These are official implementation disclosures, not a paper-reported universal speedup.

**What the evidence shows.** [DERIVED] The inspected contracts support the distinction between logical ownership and physical execution. They do not independently validate the proposed operator or its performance on the reader's device.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 26.1 proves exact domain coverage for the masked map. The reduction invariant proves coverage of input subsets; neither proof establishes floating-point equality to a differently ordered sum.

**What remains unknown.** [UNVERIFIED] Generated instruction count, spilling, achieved transaction efficiency, sanitizer outcomes and full-launch latency await execution under a pinned environment.

## Failure modes

[DERIVED] Distinguish missing outputs, duplicated writes, out-of-range accesses, stale reads, divergent barriers and numerically different but memory-safe reductions. A symptom observed at a later synchronization may originate in an earlier asynchronous launch. Use a tiny adversarial index-coded input to diagnose ownership before random floating-point tests. An all-zero test conceals both duplicate reads and missed writes. A reduction over alternating large positive and negative values exposes conditioning problems that uniform positive data can conceal.

## Siblings

[DERIVED] Elementwise mapping changes ownership without collective combination; tree reduction changes the dependency graph; atomic reduction changes the final ordering contract. Each solves a different coordination problem. The fused staging alternatives in [§26.4](26-4-fusion-and-dataflow.md) trade intermediate traffic against storage lifetime. Numerical acceptance is owned by [§26.6](26-6-correctness-under-optimization.md).

## Extensions

[OFFICIAL-DOCUMENTATION] CUDA 13.1 introduces CUDA Tile as a separate tile-oriented programming model. That release does not make existing SIMT synchronization assumptions automatically valid in its interface. [R26.2], “CUDA Tile programming”. [DERIVED] A higher-level tile declaration moves responsibility for a mapping to the compiler; the author still owes a valid memory and dependency contract.

## Limitations

[DERIVED] The sector model excludes caches and hardware request splitting. The reduction specification excludes nonfinite arithmetic and cross-device aggregation. A layout that is correct for contiguous arrays may be invalid for aliased views. Do not generalize a successful test for one representation to every stride pattern.

## Reproducibility

[DERIVED] Archive source, compiler output, launch parameters, masks, accumulator policy, exact device identifier and reference data hash. Record both the toolkit guide version and the actual compiler/runtime versions; reading CUDA 13.1 documentation does not establish that an environment uses it. Verification remains proposed and unexecuted.

## References

[R26.1] CUDA 13.1 rewritten programming guide; [R26.2] CUDA 13.1 originating disclosure; [R26.3] Triton 3.6 release; [R26.4] HIP/ROCm 7.2 versioned programming model. Full dated records and inspection locators are in [references.md](references.md).
