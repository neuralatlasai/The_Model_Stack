---
id: "ms.section.25.1"
entity_type: "section"
title: "Accelerator organization"
short_title: "Accelerator organization"
volume: 2
part: 5
chapter: 25
section: 25.1
slug: "25-1-accelerator-organization"
parent: "ms.chapter.25"
prev_sibling: null
next_sibling: "ms.section.25.2"
children: []
prerequisites: ["ms.chapter.1", "ms.chapter.2", "ms.chapter.3", "ms.chapter.5", "ms.chapter.13", "ms.chapter.14", "ms.chapter.15", "ms.chapter.16", "ms.chapter.17"]
downstream: ["ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29", "ms.chapter.30"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "inference", "serving"], "mechanism": ["hardware", "performance_model", "memory_hierarchy"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.nvidia-cuda", "impl.amd-rocm", "impl.google-tpu-xla"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "KNOWN", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED", "ASSUMED"], "empirically_observed": false}
word_count_target: 1800
updated_at: "2026-10-09"
editorial_status: "manuscript_draft"
---

# 25.1 — Accelerator organization

## Scope

[DERIVED] Map a workload to the execution resources that can actually implement it: matrix units, vector/scalar units, instruction issue, synchronization, and data movement. The output is a capacity-constrained resource graph, not a ranking of chips. Shapes, precision, and the correctness contract precede throughput comparisons. This section owns GPU execution units, warps and wavefronts, TPU matrix/vector organization, and specialized accelerator execution. Memory residency is developed in [§25.2](25-2-memory-hierarchy.md); end-to-end ceilings in [§25.3](25-3-roofline-reasoning.md).

## Why this exists

[OFFICIAL-DOCUMENTATION] The 2026 disclosures describe materially different execution organizations: Rubin couples matrix execution with expanded special-function capacity; CDNA 5 exposes Wave32 and matrix/vector resources; the May Neuron release exposes a Trainium3 scalar-engine instruction and matrix-input capabilities. These are disclosed interfaces and architectural descriptions, not independent measurements of application speed. [R25.1, R25.2, R25.11].

[MATHEMATICALLY-DERIVED] A model with two consecutive kernels cannot consume both devices' advertised matrix peaks merely because its total FLOP count is large. A reduction, an exponential, an irregular gather, and a matrix multiply require different resources. Their dependencies may serialize them. Increasing one resource leaves the critical path unchanged when another resource remains dominant. Consequently, the first engineering question is which units execute each operator and how much independent work reaches those units.

## Intuition

[DERIVED] Treat an accelerator as a graph of service centers. A matrix unit consumes packed tiles; a vector unit performs elementwise transforms and reductions; scalar/control resources generate addresses and dispatch work; memory engines move operands; synchronization connects producer completion to consumer eligibility. A program can overlap independent work, but an unavailable operand remains unavailable regardless of the theoretical arithmetic rate.

[MATHEMATICALLY-DERIVED] Suppose a matrix stage takes time $a$ and its dependent vector epilogue takes $v$. Doubling only matrix throughput changes the serialized time from $a+v$ to $a/2+v$. The speedup is $(a+v)/(a/2+v)$ and approaches one when $v$ dominates. This counterexample does not establish any chip's performance. It establishes why peak matrix ratios cannot be substituted for a whole-program comparison.

## Formulation

| Symbol | Meaning | Unit or shape |
|---|---|---|
| $\mathcal G=(V,E)$ | Operator dependency DAG | Nodes and directed edges |
| $F_{v,r}$ | Work node $v$ requires from resource class $r$ | Operations |
| $P_r$ | Sustained service rate under a declared configuration | Operations/s |
| $Q_{v,h}$ | Bytes node $v$ transfers across boundary $h$ | Bytes |
| $B_h$ | Sustained directional service rate of boundary $h$ | Bytes/s |
| $\lambda_v$ | Non-overlapped dispatch/synchronization cost | Seconds |
| $c_v$ | Completion time of node $v$ | Seconds |

[MATHEMATICALLY-DERIVED] With ideal overlap between distinct resources inside a node, a lower bound is

$$
t_v^{\rm lb}=\max\!\left(\max_r\frac{F_{v,r}}{P_r},\max_h\frac{Q_{v,h}}{B_h}\right),\qquad
c_v\geq t_v^{\rm lb}+\max_{u:(u,v)\in E}c_u.
$$

*(Eq. 25.1)*

The predecessor maximum is zero for a source node. An additive dispatch term is valid only for overhead proven to remain exposed; a device launch already included in a measured interval must not be counted twice. The inequality deliberately does not claim to model scheduling queues or shared-resource interference.

```figure
id: fig-25.2
kind: diagram
title: Execution resources and dependent service
caption: A matrix result must pass through its vector epilogue and completion event before the consumer is eligible. Independent copy work can overlap; a dependency cannot.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.1
alt: A matrix result must pass through its vector epilogue and completion event before the consumer is eligible. Independent copy work can overlap; a dependency cannot.
spec:
  direction: LR
  nodes:
  - id: input
    kind: tensor
    label: Input tile
  - id: copy
    kind: flow
    label: Operand transfer
  - id: matrix
    kind: hardware
    label: Matrix engine
  - id: vector
    kind: hardware
    label: Vector epilogue
  - id: done
    kind: state
    label: Completion
  - id: next
    kind: process
    label: Consumer
  edges:
  - from: input
    to: copy
    kind: flow
  - from: copy
    to: matrix
    kind: flow
  - from: matrix
    to: vector
    kind: flow
  - from: vector
    to: done
    kind: flow
  - from: done
    to: next
    kind: flow
```

## Mechanism

### Methodology

[DERIVED] Begin with the executed operator graph, including casts, layout conversions, host decisions, and collectives. Assign each node a shape, element format, accumulation format, and permitted numerical error. A shape is insufficient if the stride or transpose flags change the dispatched implementation. Count matrix work separately from transcendental and reduction work; a FLOP total cannot represent both with one hardware peak.

[MATHEMATICALLY-DERIVED] For $A\in\mathbb R^{M\times K}$ and $W\in\mathbb R^{K\times N}$, $AW$ requires approximately $2MKN$ scalar floating-point operations under the conventional multiply-plus-add count. A hardware tile covers $m_t\times n_t\times k_t$. With padding and no tail-specialized path, the issued arithmetic is approximately $2\lceil M/m_t\rceil m_t\lceil N/n_t\rceil n_t\lceil K/k_t\rceil k_t$. Their ratio is useful-work efficiency. A large matrix-engine peak does not remove the work executed on padded lanes.

[MATHEMATICALLY-DERIVED] Under that full-tile padding model, the useful-work fraction is

$$
\eta_{\rm useful}=\frac{MKN}{\lceil M/m_t\rceil m_t\,\lceil N/n_t\rceil n_t\,\lceil K/k_t\rceil k_t}.
$$

*(Eq. 25.14)*

The calculator specializes to $m_t=n_t=k_t=t$. This is an illustrative equal-width tile, not a claim that any named accelerator uses the same tile extent on all three axes. Tail-specialized kernels require a different issued-work count.


[DERIVED] A GPU warp/wavefront is an execution grouping, not a guarantee that all lanes contribute useful values. Predication preserves correctness at a boundary while wasting issued lane slots. Divergent paths, partial tiles, and irregular indexing must be represented in the work ledger. Keep a distinction between logical threads, resident groups, eligible groups, and actually issued instructions. An occupancy percentage reports residency; it does not prove that memory dependencies allow progress.

[PAPER-REPORTED] Jouppi et al.'s June 2026 report describes Ironwood's matrix, vector, scalar, and sparse resources, compiler-directed VMEM transfers, and the JAX/XLA/Pallas software route. Its architecture discussion and Table 1 support that decomposition; they do not provide a matched GPU-versus-TPU experiment for the workload analyzed here. [R25.5], pp. 2–6.

[DERIVED] For an ASIC, explicitly model the operators outside the favored matrix path. If an embedding, dynamic routing operation, or host callback takes another route, include its synchronization and representation conversion. A compiler transformation is allowed to change the execution graph while preserving the chosen semantic contract; the model must follow the transformed graph rather than the source-level layer name.

```figure
id: fig-25.3
kind: calculator
title: Useful arithmetic versus issued tile work
caption: Vary matrix dimensions against a fixed illustrative tile. Padding reduces useful-work efficiency even though the semantic output shape is unchanged. No hardware timing is implied.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.14
alt: Vary matrix dimensions against a fixed illustrative tile. Padding reduces useful-work efficiency even though the semantic output shape is unchanged. No hardware timing is implied.
spec:
  tex: \eta=\frac{MKN}{\lceil M/t\rceil\lceil N/t\rceil\lceil K/t\rceil t^3}
  equation: '25.14'
  inputs:
  - symbol: M
    label: Rows
    default: 129
    min: 1
    max: 1024
    step: 1
    format: integer
  - symbol: N
    label: Columns
    default: 257
    min: 1
    max: 1024
    step: 1
    format: integer
  - symbol: K
    label: Reduction length
    default: 65
    min: 1
    max: 1024
    step: 1
    format: integer
  - symbol: t
    label: Illustrative tile width
    default: 64
    min: 8
    max: 128
    step: 8
    format: integer
  outputs:
  - symbol: eta
    label: Useful / issued work
    formula: M*N*K/(ceil(M/t)*ceil(N/t)*ceil(K/t)*t*t*t)
    format: percent
  presets: []
anchor: mechanism
```

## Algorithm

### Algorithm 25.1 — Resource assignment with unsupported-path rejection

[DERIVED] Inputs are a finite DAG, shape/dtype/stride contracts, a declared target release, and measured or explicitly assumed resource rates. Output is a classified graph and a lower-bound ledger. State comprises the classified node set $S$, resource work totals, and completion bounds. This is a book-authored analysis procedure, not a vendor scheduler.

$$
\begin{aligned}
(1)\quad&S\leftarrow\varnothing,\quad c_v\leftarrow0\quad(v\in V).\\
(2)\quad&v\leftarrow\operatorname{next}_{\rm topo}(V\setminus S).\\
(3)\quad&\mathcal K_v\leftarrow\operatorname{eligible}(v,\mathrm{target},\mathrm{contract});
\quad\mathcal K_v=\varnothing\Rightarrow\mathrm{UNSUPPORTED}.\\
(4)\quad&k_v\leftarrow\operatorname{declaredDispatch}(\mathcal K_v),\quad
(F_{v,r},Q_{v,h})\leftarrow\operatorname{count}(k_v).\\
(5)\quad&c_v\leftarrow t_v^{\rm lb}+\max_{u:(u,v)\in E}c_u,\quad S\leftarrow S\cup\{v\}.\\
(6)\quad&|S|<|V|\Rightarrow(2);\quad\mathrm{return}\ (\{k_v\},\{c_v\},\{F,Q\}).
\end{aligned}
$$

*(Eq. 25.2)*

The invariant is that every classified node has a feasible semantic implementation and all its predecessors are classified. Reject cyclic graphs unless loops have first been bounded or separately modeled. Graph traversal costs $O(|V|+|E|)$ plus dispatch resolution; the ledger requires $O(|V|+|E|)$ storage. A missing measured rate produces an interval or an explicit unknown, never a zero-time stage.

## Implementation

[DERIVED] NVIDIA CUDA and AMD HIP/ROCm occupy the Accelerator / driver / compiler layer; their tensor libraries and kernel generators occupy Kernels / numerics / collectives. Google TPU / XLA spans the target and compiler; JAX supplies transformation semantics. AWS Trainium / Inferentia + Neuron is enumerated in the Accelerator / driver / compiler layer; its NKI interface also satisfies the plan's “other AI accelerators” requirement. An engine diagram does not establish binary compatibility between those interfaces.

[DERIVED] Record launch geometry, compiled target, selected kernel, tile shapes, register use, staging bytes, and the operation that gates each barrier. Map a matrix accumulator to its actual storage class instead of treating registers, GPU tensor memory, and TPU vector memory as interchangeable. Operator equivalence is checked in [Chapter 26](../ch26-kernel-programming-and-numerical-equivalence/README.md); compiler effects in [Chapter 28](../ch28-frameworks-graph-compilers-and-runtime-integration/README.md).

```figure
id: fig-25.4
kind: stat-panel
title: Why matrix acceleration can stall
caption: An analytical matrix stage and dependent vector stage take 1 ms and 4 ms. Doubling only the matrix rate reduces their sum from 5 ms to 4.5 ms, a 1.11-fold speedup.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.1
alt: An analytical matrix stage and dependent vector stage take 1 ms and 4 ms. Doubling only the matrix rate reduces their sum from 5 ms to 4.5 ms, a 1.11-fold speedup.
spec:
  header: ANALYTICAL CONFIGURATION
  variables:
    a: 0.001
    v: 0.004
  rows:
  - key: Original serialized time
    formula: a+v
    format: seconds
  - key: Doubled matrix rate
    formula: a/2+v
    format: seconds
  - key: Whole-path speedup
    formula: (a+v)/(a/2+v)
    format: ratio
anchor: implementation
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] The December Blackwell study uses PTX microbenchmarks, instruction inspection, memory access sweeps, and application examples. The inspected version states that its code is unavailable during double-blind review. This supports reading its protocol, not claiming that this edition reran it. [R25.3], §IV and §VII-A. The May modeling paper separates hardware calibration from application cases but includes optional fitted per-case multipliers; evaluate holdout predictions separately. [R25.4], §IV-D and §V.

## Observations

**What the paper claims.** [PAPER-REPORTED] The studies attribute performance to architecture-specific resource behavior rather than a single peak. Their claimed outcomes remain source-reported [R25.3, R25.4].

**What the evidence shows.** [KNOWN] The public texts expose methodological choices. The December text gives incompatible B200 SM counts across itself and the May report; this manuscript does not adopt either count as a verified target specification. See the discrepancy record in [references](references.md).

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 25.1 makes resource assignment necessary: changing the matrix rate cannot reduce a different dominating term. The padding calculation also bounds useful arithmetic independently of a brand name.

**What remains unknown.** [NOT-DISCLOSED] A matched, independently reproduced workload comparison across all listed platforms is absent from this inspected evidence set. Exact deployment dispatch, utilization, and software configuration must be supplied by the artifact.

## Failure modes

> **Failure mode — Peak substitution.** [DERIVED] *Symptom:* predicted speed improves while the vector or dispatch stage stays fixed. *Cause:* all work was divided by a matrix peak. *Detection:* classify the executed operators. *Mitigation:* retain per-resource work and the dependency graph.

> **Failure mode — Unsupported precision path.** [DERIVED] *Symptom:* runtime falls back or casts tensors. *Cause:* the reported low-precision mode is unavailable for the shape or accuracy contract. *Detection:* retain dispatch and conversion traces. *Mitigation:* reject the comparison until both paths satisfy the same numerical test.

## Siblings

[DERIVED] Matrix-dominant execution increases tile reuse but can expose vector epilogues; vector-dominant execution handles irregular work but cannot inherit matrix throughput. Compiler-scheduled ASIC execution moves scheduling responsibility into the compiled program; SIMT execution exposes a different grouping and latency-hiding contract. These are differential execution choices, not universal quality rankings. Their memory consequences are canonical in [§25.2](25-2-memory-hierarchy.md).

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The May Neuron 2.30.0 release adds Trainium3-specific NKI instructions and reference kernels [R25.11]. This is a dated interface extension. Its announcement does not isolate a general model-training speedup, so no such gain is attributed here.

## Limitations

[DERIVED] This resource graph is a lower-bound model under stated rate and overlap assumptions. It does not predict queueing, cache interference, power throttling, or the distribution of tensor shapes. A claim that a target is faster requires end-to-end measurements with the same semantic and workload boundary. A resource that is present in silicon but inaccessible to the selected runtime is unavailable to this artifact.

## Reproducibility

[DERIVED] Retain the graph, operation counts, precision contract, compiled target, dispatch evidence, and unknown-rate intervals. Recent disclosures are evidence about the identified 2025–2026 releases; classic mechanisms are reconstructed mathematically and are not presented as new inventions. No book-authored hardware experiment was performed.

## References

[R25.1], [R25.2], [R25.3], [R25.4], [R25.5], [R25.6], [R25.11]; full dates, revisions, and locators in [references.md](references.md).
