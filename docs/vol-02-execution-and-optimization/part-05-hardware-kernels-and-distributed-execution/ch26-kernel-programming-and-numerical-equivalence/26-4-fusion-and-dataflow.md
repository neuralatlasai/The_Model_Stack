---
id: ms.section.26.4
entity_type: section
title: Fusion and dataflow
short_title: Fusion and dataflow
volume: 2
part: 5
chapter: 26
section: 26.4
slug: 26-4-fusion-and-dataflow
parent: ms.chapter.26
prev_sibling: ms.section.26.3
next_sibling: ms.section.26.5
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

# 26.4 — Fusion and dataflow

## Scope

[DERIVED] Fusion is a change in storage and scheduling that preserves a declared operator composition. This section owns intermediate-write elimination, layout choice, register pressure, shared-memory staging and asynchronous copies. The baseline materializes producer output in global memory before a consumer launch. Success requires lower complete-composition cost with identical mathematical and accepted numerical behavior, including any backward intermediates and boundary cases.

## Why this exists

[OFFICIAL-DOCUMENTATION] NVIDIA's June 2026 fused-MLP disclosure identifies activation traffic, host synchronization and quantization traffic as separate bottlenecks. Its GLU fusion repacks weights so one tile can access both contributing halves. [R26.12], “Overcoming training bottlenecks” and “Optimizing GLU activation functions”. [DERIVED] Fusion becomes useful when the producer's result can be consumed while it is already in a cheaper storage level. Merely placing two operations in one source function does not establish that condition. Conversely, a single generated kernel can still spill its intermediate and recover none of the intended traffic savings.

[DERIVED] The limiting constraint often moves after fusion. Removing global writes extends the lifetime of values in registers or shared memory. That can reduce concurrent resident work, increase spill traffic, or force a less favorable matrix tile. A useful design must show both the traffic eliminated and the storage retained. “Fewer kernels” is an execution description; it is not a proof of lower latency.

## Intuition

[MATHEMATICALLY-DERIVED] Consider $u=f(x)$ and $y=g(u)$. If $u$ contains $E$ values of $b$ bytes, a separated implementation writes and rereads $2Eb$ useful bytes, in addition to unavoidable input/output traffic. A fused implementation can avoid these transfers only if the consumer's needed subset of $u$ is available to its executing tile. If $g$ requires a reduction over values owned by different producer tiles, the fusion requires either a different ownership partition, explicit coordination or recomputation. The composition graph alone does not determine the physical feasibility.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $E,b$ | Intermediate elements and bytes/value | Elements, bytes |
| $B_0$ | Useful traffic excluding that intermediate pair | Bytes |
| $k,\lambda$ | Original launch count and exposed launch cost | Count, seconds |
| $t_c,t_m$ | Compute and transfer service times in a staged loop | Seconds/stage |
| $h$ | Number of stages | Count |
| $s$ | Shared-memory bytes per pipeline slot | Bytes |
| $R,S$ | Live registers and shared bytes per block | Resource quantities |
| $\Delta B,\Delta t$ | Extra spill/recompute traffic and added dependency time | Bytes, seconds |

[MATHEMATICALLY-DERIVED] A deliberately simplified comparison is

$$
T_{\rm separate}\approx k\lambda+\max(F/P,(B_0+2Eb)/B_{\rm mem}),\qquad
T_{\rm fused}\approx\lambda+\max(F'/P,(B_0+\Delta B)/B_{\rm mem})+\Delta t.
$$

*(Eq. 26.5)*

$P$ is an assumed achieved compute rate for this analytical model, not advertised peak. The maximum is optimistic overlap; dependent phases may require addition. It identifies quantities to measure, not a latency prediction certified by the manuscript.

## Mechanism

[DERIVED] **Intermediate elimination** first requires a liveness analysis. A value used only by the immediate epilogue can die after consumption. A value needed for backward, another branch, logging or an output alias cannot simply vanish. One may save a compact sufficient statistic or recompute a value later, but that is a changed execution plan with new arithmetic and traffic costs. Count externally visible outputs before declaring a temporary “unnecessary.” Retaining an output solely for a debugging path can materially change the measured optimized program.

[MATHEMATICALLY-DERIVED] **Layout selection** is a mapping from logical coordinates to storage and participants. If the producer writes layout $L_f$ while the consumer reads $L_g$, for bijective placement maps a conversion $\Pi=L_g\circ L_f^{-1}$ may be necessary on the valid domain. Broadcast or replicated layouts need an explicit ownership relation rather than an assumed inverse. A permutation realized entirely in registers can still require cross-lane exchange instructions. A shared-memory transpose adds writes, reads and synchronization; a global conversion can eliminate the intended benefit. For a GLU whose output combines two matrix-product halves, placing those halves in the same producing tile makes local fusion possible. Repacking weights costs time and storage and must preserve the logical parameter and checkpoint mapping.


```figure
id: fig-26.12
kind: diagram
title: Fusion requires common operand ownership
caption: A consumer can use registers directly only when its operands are present in the same valid tile. A layout
  conversion or cross-tile dependency may reintroduce the traffic that fusion was meant to remove.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.5
alt: A consumer can use registers directly only when its operands are present in the same valid tile. A layout conversion
  or cross-tile dependency may reintroduce the traffic that fusion was meant to remove.
concepts:
- ms.section.26.4
spec:
  direction: LR
  nodes:
  - id: a
    kind: tensor
    label: Producer input tile
  - id: b
    kind: process
    label: Producer and accumulator
  - id: u
    kind: memory
    label: Live local intermediate
  - id: g
    kind: process
    label: Consumer epilogue
  - id: y
    kind: tensor
    label: Final output tile
  - id: x
    kind: boundary
    label: Other consumer or backward use
  edges:
  - from: a
    to: b
  - from: b
    to: u
  - from: u
    to: g
    kind: emphasis
  - from: g
    to: y
  - from: u
    to: x
    kind: dependency
```


[DERIVED] **Register pressure** depends on simultaneous liveness, not source variable count. Holding a matrix accumulator, activation input, scaling statistics and several staged addresses together can increase register allocation. If allocation exceeds a target-specific limit, compilation may spill values to local memory or reduce residency. A smaller tile can reduce liveness but increase rereads and launch count. Shortening live ranges by computing and storing a completed subset may be more useful than globally forcing a register cap. A register limit that introduces hidden loads must be evaluated against the full byte ledger.

[DERIVED] **Shared-memory staging** provides explicitly managed reuse and can adapt layout to the consuming instruction. It consumes per-block capacity and requires lifetime discipline: the last consumer must finish before a slot is overwritten. Shared-bank conflicts are a property of simultaneous addresses, access width and bank mapping; padding is only one possible remedy. A swizzle changes the coordinate map and must be applied consistently by producers and consumers. Reusing storage for two disjoint phases is valid only if their lifetimes truly do not overlap under the actual asynchronous schedule.

[OFFICIAL-DOCUMENTATION] CUDA 13.1's asynchronous-copy guide distinguishes LDGSTS-based copies, producer/consumer warp specialization and Tensor Memory Accelerator transfers. Its TMA examples require stated alignment and size conditions, and distinguish APIs that can fall back from those whose violated preconditions lead to undefined behavior. [R26.9], §§4.11.1–4.11.2. [DERIVED] An async issue operation is not a completion event. The consumer waits for the corresponding generation and the producer waits for the previous consumer before reusing a buffer. Replacing that protocol with a generic barrier can be either insufficient or unnecessarily restrictive, depending on the memory proxy and scope.

[MATHEMATICALLY-DERIVED] For $h$ identical stages, ideal double buffering yields

$$
T_{\rm serial}=h(t_m+t_c),\qquad
T_{\rm pipe}=t_m+t_c+(h-1)\max(t_m,t_c),\qquad S_{\rm slots}=2s.
$$

*(Eq. 26.6)*

The first fill and last drain remain exposed. Speedup approaches at most two when $t_m=t_c$ and $h$ grows, under this two-resource model; unequal times reduce that ceiling. Extra buffers can hide additional latency only when enough independent requests and capacity exist. They do not create bandwidth. Instruction issue overhead, barriers, scale loads and epilogues may form extra resources, invalidating the two-resource simplification.


```figure
id: fig-26.13
kind: calculator
title: Fill, overlap and drain
caption: Illustrative two-resource pipeline, not measured hardware. The model includes one initial fill and final
  drain and assumes transfer and compute can overlap completely on independent slots.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.6
alt: Illustrative two-resource pipeline, not measured hardware. The model includes one initial fill and final drain
  and assumes transfer and compute can overlap completely on independent slots.
concepts:
- ms.section.26.4
spec:
  equation: '26.6'
  tex: T_s=h(t_m+t_c),\quad T_p=t_m+t_c+(h-1)\max(t_m,t_c)
  inputs:
  - symbol: h
    label: pipeline stages
    default: 16
    min: 1
    max: 128
    format: integer
  - symbol: tm
    label: transfer time per stage
    default: 2
    min: 0.01
    max: 20
    format: fixed2
  - symbol: tc
    label: compute time per stage
    default: 3
    min: 0.01
    max: 20
    format: fixed2
  - symbol: s
    label: bytes per slot
    default: 32768
    min: 1024
    max: 131072
    format: bytes
  outputs:
  - symbol: Ts
    label: serial time in chosen units
    formula: h*(tm+tc)
    format: fixed2
  - symbol: Tp
    label: pipelined time in chosen units
    formula: tm+tc+(h-1)*max(tm,tc)
    format: fixed2
  - symbol: gain
    label: ideal time ratio
    formula: h*(tm+tc)/(tm+tc+(h-1)*max(tm,tc))
    format: ratio
  - symbol: sm
    label: two-slot capacity
    formula: 2*s
    format: bytes
```


[DERIVED] **Asynchronous copies** also affect failure localization. A read-after-issue bug may appear nondeterministically because arrival depends on scheduling. A phase-bit mistake may pass the first tile and fail only after the circular buffer wraps. For a two-slot pipeline, prove the order for slot reuse across at least three stages, including partial final tiles. The producer must not announce a full byte count while masking away some arrivals unless the API explicitly defines that behavior. A correct full-tile benchmark does not validate this partial-tile completion contract.

## Algorithm

[DERIVED] This book-authored pipeline is expressed in events rather than assuming a particular CUDA primitive. Inputs are $h$ tiles and two slots with generation counters. Output is the fused operator's valid outputs.

$$
\begin{aligned}
(1)&\quad\forall j\in\{0,1\}:\operatorname{publishEmpty}(j,0);\quad\operatorname{runConcurrently}(P,C).\\
(P1)&\quad\text{for }t=0,\ldots,h-1:\ (j,k)\gets(t\bmod2,\lfloor t/2\rfloor);\quad\operatorname{waitEmpty}(j,k).\\
(P2)&\quad\operatorname{issueCopy}(t,j,\mathrm{validBytes}(t));\quad\operatorname{waitCopyComplete}(t,j);\quad\operatorname{publishReady}(j,k).\\
(C1)&\quad\text{for }t=0,\ldots,h-1:\ (j,k)\gets(t\bmod2,\lfloor t/2\rfloor);\quad\operatorname{waitReady}(j,k).\\
(C2)&\quad u_t\gets f(\mathrm{slot}_j);\quad y_t\gets g(u_t);\quad\operatorname{publish}(y_t).\\
(C3)&\quad\operatorname{waitLastRead}(u_t,\mathrm{slot}_j);\quad\operatorname{publishEmpty}(j,k+1).\\
(2)&\quad\operatorname{join}(P,C);\quad\operatorname{drainOutstandingWork};\quad\operatorname{return}(y_{0:h}).
\end{aligned}
$$

Producer and consumer are separate concurrent roles; each role preserves its own loop order. A single role that issued a copy, waited, computed, and released before advancing would be serial and could not realize Eq. 26.6. The roles may overlap only across different slots or after the proven release. Ready events publish completed-copy visibility to the consumer, and empty events publish final-consumer completion to the producer. The invariant is exclusive ownership of a slot by its current generation. The schedule uses $O(s)$ auxiliary storage with two slots and $O(h)$ stage transitions; arithmetic remains that of $f$ and $g$, plus any conversion or recomputation. A failure to complete an expected event is an error/timeout branch, not permission to read the slot.

## Implementation

[DERIVED] **NVIDIA CUDA** in *Accelerator / driver / compiler* supplies the scoped async mechanisms; **NVIDIA CUTLASS**, **Triton language** and related tile interfaces in *Kernels / numerics / collectives* express schedules and epilogues. **PyTorch** in *Model / autograd framework* determines whether the composition's intermediates are externally needed. Archive the generated instructions, resource report, pipeline depth, slot layout, barrier protocol and partial-tile path. Confirm whether “fused” means one launch, one allocation, one operator registration, or all three. These are different properties.


```figure
id: fig-26.14
kind: systems-trace
title: Pipeline slot lifetime
caption: Copy issue, copy completion, consumption and slot release are distinct events. Reuse of a slot before its
  last reader finishes is invalid even when the next copy appears to have completed.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.5
alt: Copy issue, copy completion, consumption and slot release are distinct events. Reuse of a slot before its last
  reader finishes is invalid even when the next copy appears to have completed.
concepts:
- ms.section.26.4
spec:
  columns:
  - latency
  - memory
  - compute
  - communication
  - failure
  stages:
  - name: Acquire empty slot
    values:
      latency: Wait for prior generation
      memory: Two staged buffers
      compute: Index and byte count
      communication: Producer/consumer event
      failure: Premature overwrite
  - name: Issue and complete copy
    values:
      latency: Transfer service
      memory: Global to shared data
      compute: Address and descriptor work
      communication: Completion transaction
      failure: Wrong expected byte count
  - name: Consume and fuse
    values:
      latency: Compute service
      memory: Live accumulator and epilogue
      compute: Product and activation
      communication: Visibility dependency
      failure: Read before arrival
  - name: Release and drain
    values:
      latency: Last read completion
      memory: Slot becomes reusable
      compute: Store final output
      communication: Generation advancement
      failure: Phase-bit reuse bug
```


[DERIVED] Fusion preserves logical parameters and valid tokens while altering intermediate traffic, launch count and live storage. Weight repacking adds representation storage without adding learned parameters. The pipeline model counts overlap under its assumptions; it is not an achieved throughput result. Global/distributed communication is outside this locally resident composition and must be added if placement crosses devices. Energy and money remain UNVERIFIED because neither saved bytes nor an analytical overlap bound supplies power or billed-resource measurements.

## Experimental design

[NOT-DISCLOSED] NVIDIA's fused-MLP disclosure provides first-party performance claims, but does not provide a complete seed-level uncertainty record that supports transplanting those gains to this chapter's analytical operator. No performance number from it is used as a book result. [ASSUMED] The proposed ablation compares separated execution, epilogue-only fusion, layout repacking, one-slot staging and two-slot staging. Include repacking in a cold-start measurement and separately report its amortized reuse count. Test forward/backward parity, a final partial tile, repeated slot reuse and external outputs that prevent elimination. Measure register spills, shared bytes, actual traffic and complete-composition time together.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] CUDA documents async-copy protocols; NVIDIA's 2026 fusion disclosure attributes its implementation to combined activation, quantization and synchronization changes. These sources do not establish a universal fusion benefit.

**What the evidence shows.** [DERIVED] The disclosures identify real mechanisms and explicit preconditions. The book has not reproduced the implementation or benchmarked the proposed ablations.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 26.5 explains why saved global bytes can be offset by spills and longer dependencies. Eq. 26.6 exposes pipeline fill/drain rather than assuming perfect overlap.

**What remains unknown.** [UNVERIFIED] Actual liveness, spill bytes, compiler-chosen layouts, overlap fraction and end-to-end training impact remain environment-dependent measurements.

## Failure modes

[DERIVED] A locally correct epilogue can be globally wrong if two producer tiles own the operands it needs. A correct pipeline can become unsafe after reducing stage count without changing generation logic. Saved forward statistics can be insufficient for backward. Layout repacking can corrupt checkpoint interpretation while leaving a single run internally consistent. Detect these by validating logical-to-physical inverse maps, wrapping the pipeline repeatedly and restoring a checkpoint through the declared canonical layout.

## Siblings

[DERIVED] Vertical producer/consumer fusion saves intermediate traffic; horizontal fusion combines independent work to amortize launches; graph replay reduces repeated submission cost while retaining separate kernels. The latter is developed in [§28.4](../ch28-frameworks-graph-compilers-and-runtime-integration/28-4-runtime-execution.md). They address different terms of the latency model and may coexist.

## Extensions

[OFFICIAL-DOCUMENTATION] PyTorch 2.14 extends CuTeDSL-generated GEMM epilogue participation in compiler selection. [R26.11], NVGEMM heading. [DERIVED] This allows the optimizer to compare a fused candidate with other valid paths; it does not remove the need to include conversion and workspace costs.

## Limitations

[DERIVED] The models assume one device and exclude distributed transfers, dynamic routing imbalance and instruction-level contention between pipeline roles. The event algorithm is a semantic reconstruction, not executable proof that any one API sequence is correct.

## Reproducibility

[DERIVED] Retain both fused and unfused references, logical parameter maps, generated binaries and numerical checks. Record whether repacking is included, cached or repeated. State that all proposed ablations remain unexecuted.

## References

[R26.9] CUDA 13.1 asynchronous data copies; [R26.11] PyTorch 2.14 release; [R26.12] June 2026 fused-MLP disclosure. See [references.md](references.md).
