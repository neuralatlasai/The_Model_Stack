---
id: ms.section.29.2
entity_type: section
title: Tensor and pipeline parallelism
short_title: Tensor and pipeline parallelism
volume: 2
part: 5
chapter: 29
section: 29.2
slug: 29-2-tensor-and-pipeline-parallelism
parent: ms.chapter.29
prev_sibling: ms.section.29.1
next_sibling: ms.section.29.3
children: []
prerequisites: [ms.chapter.16, ms.chapter.19, ms.chapter.20, ms.chapter.25, ms.chapter.26, ms.chapter.27, ms.chapter.28]
downstream: [ms.chapter.30, ms.chapter.36, ms.chapter.44]
related: []
relations: []
axes: {lifecycle: [pretraining, continued_training], mechanism: [distributed_training, parallelism, communication], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch-fsdp2, impl.nvidia-megatron-core, impl.nvidia-nccl]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 29.2 — Tensor and pipeline parallelism

## Scope

[DERIVED] This section owns matrix partitioning, activation exchange, pipeline microbatch schedules, bubbles, interleaving, and topology. The baseline computes the same dense operators and synchronous optimizer step on one logical model. Distributed execution is acceptable only when both operator algebra and version ordering are preserved. Kernel internals belong to Chapters 26–27; this section accounts for boundaries between partitioned operators and devices. Sources are restricted to the chapter's 2025-12-01–2026-10-09 window.

## Why this exists

[MATHEMATICALLY-DERIVED] Data sharding cannot make an individual reconstructed operator smaller than its working set. Tensor partitioning divides the operator itself. Pipeline partitioning divides the layer graph, reducing resident layers per device. These interventions solve different capacity constraints but introduce different dependencies: a tensor-partitioned layer often needs a collective before its next consumer, whereas a pipeline stage waits for the preceding stage's output and its own available slot.

[PAPER-REPORTED] Piper separates placement directives from scheduling directives over a global computation/communication DAG, with pipeline examples and a DualPipe-style composition study. [R29.3], §4.1–4.3, §6.1 and §6.3. This makes the relevant distinction explicit: a placement says where work belongs, while a schedule says when mutually dependent work can execute. Its particular runtime is not required for the algebra derived here.

[DERIVED] Selecting a large tensor degree because all devices are available can be counterproductive: local matrix dimensions shrink while synchronization frequency remains tied to layer depth. Selecting many pipeline stages reduces per-stage state but adds fill/drain overhead and creates sensitivity to stage imbalance. Both are constrained optimizations, not monotone improvements in GPU count.

## Intuition

[MATHEMATICALLY-DERIVED] Matrix multiplication can distribute over a partitioned contraction or preserve a partitioned output. Those are different communication patterns. For $Y=XW$, partitioning output columns produces independent output shards. Partitioning the contraction dimension produces partial sums that must be reduced. A nonlinear activation can act independently on disjoint output coordinates; it cannot generally be moved across an unfinished sum. The placement of nonlinearities therefore determines where synchronization is mandatory.

[MATHEMATICALLY-DERIVED] A pipeline has a separate issue: sequential dependencies leave devices idle at the beginning and end of a finite microbatch wave. Increasing the microbatch count amortizes those intervals, but changing the global batch or using stale weight versions changes the optimization problem. Scheduling must state whether it merely changes execution order or also changes the gradient's parameter version.

## Formulation

| Symbol | Meaning | Shape / unit |
|---|---|---|
| $X$ | Flattened token activations | $\mathbb R^{q\times h}$ |
| $W_1,W_2$ | Two MLP matrices | $h\times f$, $f\times h$ |
| $t,p,m$ | Tensor degree, pipeline stages, microbatches | Counts |
| $b$ | Activation element storage | Bytes |
| $\tau_s$ | Forward-plus-backward service time at stage $s$ | Seconds/microbatch |
| $v$ | Virtual pipeline chunks per physical stage | Count |
| $\mathcal G$ | Distributed operator dependency graph | DAG |

[MATHEMATICALLY-DERIVED] Let the intermediate width partition into $t$ equal blocks, with $W_1=[W_{1,0}\cdots W_{1,t-1}]$ and $W_2=[W_{2,0}^{\mathsf T}\cdots W_{2,t-1}^{\mathsf T}]^{\mathsf T}$. Then

$$
Z_r=\phi(XW_{1,r}),\quad U_r=Z_rW_{2,r},\quad
Y=\sum_{r=0}^{t-1}U_r.
$$

*(Eq. 29.5)*

[MATHEMATICALLY-DERIVED] Each rank performs approximately $4qhf/t$ forward FLOPs for these two matrix multiplications, counting multiply-add as two FLOPs and excluding activation cost. The completed output has $qh$ elements. Whether all ranks need the complete output or only a shard determines whether its partial sum becomes all-reduce or reduce-scatter.

## Mechanism

### Partition algebra and its backward obligations

[MATHEMATICALLY-DERIVED] The first multiplication is column-partitioned and the second row-partitioned. Because $\phi$ acts elementwise on $XW_1$, it preserves independent feature shards. The output sum must finish before any operation that depends on its complete value. For a replicated output gradient $G=\partial\ell/\partial Y$, rank $r$ computes $\partial\ell/\partial W_{2,r}=Z_r^{\mathsf T}G$, propagates $G W_{2,r}^{\mathsf T}$ through $\phi$, and obtains a partial input gradient. Summing those input-gradient contributions restores the unpartitioned backward operator.

[MATHEMATICALLY-DERIVED] Consequently, a familiar two-matrix block with replicated input/output can require one forward output reduction and one backward input-gradient reduction. Their size is driven by $qh$, not by the number of weights. An ideal ring sends $4(t-1)qhb/t$ bytes per rank across those two all-reduces. This count excludes weight-gradient data synchronization, attention, normalization, and layout conversions; adding them requires explicit edges in $\mathcal G$.

```figure
id: fig-29.4
kind: tensor-flow
title: Paired MLP partitions
caption: Column partitioning preserves intermediate feature shards through an elementwise activation. Row partitioning produces partial output sums that must be combined before the complete residual stream is consumed.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.5
alt: Replicated token-by-hidden activations multiply a hidden-by-sharded-MLP matrix, pass through an elementwise activation, multiply a sharded-MLP-by-hidden matrix, and are summed into complete output activations.
spec:
  dims: {Q: Local tokens, H: Hidden width, Fp: MLP width divided by tensor degree}
  steps:
    - {shape: '[Q, H]', label: Replicated input}
    - {shape: '[Q, Fp]', label: Feature shard, op: Column-partitioned first GEMM, cost: 2 Q H Fp FLOPs}
    - {shape: '[Q, Fp]', label: Activated shard, op: Elementwise activation}
    - {shape: '[Q, H]', label: Partial output, op: Row-partitioned second GEMM, cost: 2 Q Fp H FLOPs}
    - {shape: '[Q, H]', label: Complete output, op: Sum across tensor ranks, cost: Q H activation elements reduced}
```

[DERIVED] Bias ownership, gated MLP branches, embedding tables, tied output heads, and uneven head counts require additional partition rules. A row bias added by every rank before summation is multiplied by $t$. A gate and value branch must align their intermediate feature indices before multiplication. Padding to make widths divisible by $t$ changes local FLOPs and memory; zero padding must remain excluded from logical parameter and loss accounting.

### Pipeline scheduling without changing the optimizer

[MATHEMATICALLY-DERIVED] In a balanced idealized fill/drain schedule, identical stage service $\tau$, no transfer overhead, and $m$ microbatches give

$$
T_{\rm pipe}=(m+p-1)\tau,\qquad
u_{\rm pipe}=\frac{m}{m+p-1},\qquad
f_{\rm bubble}=\frac{p-1}{m+p-1}.
$$

*(Eq. 29.6)*

```figure
id: fig-29.19
kind: calculator
title: Pipeline wave and bubble sensitivity
caption: Adjust stages, microbatches and balanced stage service time in Eq. 29.6. This authored fill/drain slot model excludes transfers, imbalance and interleaving; it is an analytical example rather than measured utilization or a schedule simulator.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.6
alt: Increasing microbatches amortizes the pipeline fill and drain interval. At four stages, eight microbatches and five milliseconds of stage service, the modeled wave lasts fifty-five milliseconds and the bubble fraction is three elevenths.
spec:
  tex: 'T=(m+p-1)\tau,\quad u=\frac{m}{m+p-1},\quad f=\frac{p-1}{m+p-1}'
  equation: '29.6'
  inputs:
    - {symbol: p, label: Pipeline stages, default: 4, min: 1, max: 32, options: [1, 2, 4, 8, 16, 32], format: integer}
    - {symbol: m, label: Microbatches in one wave, default: 8, min: 1, max: 256, options: [1, 2, 4, 8, 16, 32, 64, 128, 256], format: integer}
    - {symbol: tau, label: Balanced stage service time, default: 0.005, min: 0.0001, max: 0.1, scale: log10, format: seconds}
  outputs:
    - {symbol: T, label: Modeled wave duration, formula: (m+p-1)*tau, format: seconds, emphasis: true}
    - {symbol: u, label: Ideal slot utilization, formula: m/(m+p-1), format: percent}
    - {symbol: f, label: Fill and drain bubble fraction, formula: (p-1)/(m+p-1), format: percent}
  presets:
    - {label: Short wave, values: {p: 4, m: 2, tau: 0.005}}
    - {label: More stages same microbatches, values: {p: 16, m: 8, tau: 0.005}}
    - {label: Amortized wave, values: {p: 4, m: 64, tau: 0.005}}
```

[DERIVED] This is a pedagogical slot model, not an exact 1F1B or interleaved schedule simulator. Real forward and backward times differ, transfers consume resources, stage assignments are unequal, and resource sharing changes service durations. The model makes one valid point: a fixed microbatch wave pays a stage-count-dependent fill/drain cost. Its bubble fraction must not be plotted as measured utilization or equated with MFU.

```figure
id: fig-29.5
kind: chart
title: Idealized pipeline fill and drain
caption: Derived slot-model utilization for two, four and eight balanced stages. More microbatches amortize fill and drain, but these curves omit transfers, imbalance, activation capacity and changing GEMM efficiency.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.6
alt: As microbatches increase from one to sixty-four, ideal utilization approaches one. Eight stages need a longer wave than two stages to amortize their fill and drain intervals.
spec:
  type: line
  x: {label: Microbatches, domain: [1, 64], format: integer}
  y: {label: Slot-model utilization, domain: [0, 1], format: percent}
  series:
    - {id: pp2, label: Two stages, formula: x/(x+1), sample: {from: 1, to: 64, count: 64}}
    - {id: pp4, label: Four stages, formula: x/(x+3), sample: {from: 1, to: 64, count: 64}}
    - {id: pp8, label: Eight stages, formula: x/(x+7), sample: {from: 1, to: 64, count: 64}, emphasis: true}
```

[DERIVED] A synchronous 1F1B schedule alternates suitable forward and backward work after warmup, reducing the number of simultaneously saved microbatch activations relative to an all-forward wave. It need not reduce every bubble or communication edge. Interleaving assigns several virtual chunks to one device, exposing smaller schedulable units; it also creates additional activation boundaries and a more complicated queue. Its benefit depends on the actual mapping of virtual stages to physical links.

[MATHEMATICALLY-DERIVED] Optimizer equivalence requires every microbatch in a step to use the same logical $\theta_t$, accumulate gradients with the same valid-token denominator, and update only after the step's backward work is complete. If stage $s$ updates while downstream work still depends on its old activations, weight-version management or recomputation must preserve the intended derivative. Otherwise the schedule implements a stale or mixed-version gradient, not the baseline synchronous algorithm.

## Algorithm

**Algorithm 29.2 — Dependency-checked synchronous pipeline.** [DERIVED] Inputs are $\mathcal G$ with forward/backward/communication nodes, tensor placements, capacities, and a common step version $t$. Each task declares consumed tensors, produced tensors, device resources, and a completion event. The output is a complete gradient before a single optimizer commit.

$$
\begin{aligned}
1.\quad &\mathcal R\gets\{a:\operatorname{pred}(a)=\varnothing\},\quad\mathcal D\gets\varnothing,\quad\mathcal I\gets\varnothing.\\
2.\quad &\mathcal R=\varnothing\land\mathcal I=\varnothing\land |\mathcal D|<|\mathcal G|
\Rightarrow\operatorname{return}(\bot,\mathrm{cycle\ or\ unmet\ dependency}).\\
3.\quad &\mathcal A\gets\{a\in\mathcal R:
 \operatorname{version}(a)=t\land\operatorname{fits}(a)\}.\\
&\mathcal A=\varnothing\land\mathcal I\ne\varnothing
 \Rightarrow\operatorname{awaitNextCompletion};\ \operatorname{goto}(5).\\
&\mathcal A=\varnothing\land\mathcal I=\varnothing
 \Rightarrow\operatorname{return}(\bot,\mathrm{inadmissible\ ready\ task}).\\
4.\quad &a\gets\operatorname{select}(\mathcal A);\quad
\operatorname{reserve}(a);\quad e_a\gets\operatorname{launch}(a);\quad
\mathcal I\gets\mathcal I\cup\{a\};\quad\mathcal R\gets\mathcal R\setminus\{a\}.\\
5.\quad &\forall b\in\mathcal I:\operatorname{completed}(e_b)\Rightarrow
\mathcal D\gets\mathcal D\cup\{b\},\quad\mathcal I\gets\mathcal I\setminus\{b\},\quad\operatorname{releaseExecutionResources}(b),\quad\operatorname{releaseLastUses}(b).\\
6.\quad &\mathcal R\gets\{a\notin\mathcal D\cup\mathcal I:
 \operatorname{pred}(a)\subseteq\mathcal D\};\quad
 |\mathcal D|<|\mathcal G|\Rightarrow\operatorname{goto}(2).\\
7.\quad &g\gets\operatorname{normalizeAndSynchronize}(\{g_\mu\});\quad
\theta_{t+1}\gets\mathsf U(\theta_t,g).
\end{aligned}
$$

[DERIVED] In-flight tasks are removed from the launchable set until completion; if all ready tasks are temporarily blocked by in-flight work, wait for its next event rather than report a cycle. An errored or timed-out in-flight event follows a coordinated step-abort path instead of becoming a completed predecessor. Failure or a capacity-impossible task aborts the step. Completed tasks release reserved execution resources; tensor storage is released only after its final dependent use. Invariants are dependency completion before consumption, common parameter version, unique task launch, and protected live buffers. Termination requires a finite acyclic graph and sufficient resources for every admitted task.

```figure
id: fig-29.6
kind: diagram
title: Stage boundary and update barrier
caption: Forward activations and backward derivatives cross stage boundaries in opposite directions. The optimizer barrier is global over the logical step even though stages execute different local programs.
evidence: DERIVED
source: DERIVED:eq-29.1
alt: Two pipeline stages exchange activations forward and derivatives backward. Each contributes parameter gradients to a shared step-completion barrier before owner updates are committed.
spec:
  direction: LR
  nodes:
    - {id: f0, kind: process, label: Stage 0 forward, group: s0}
    - {id: f1, kind: process, label: Stage 1 forward, group: s1}
    - {id: b1, kind: process, label: Stage 1 backward, group: s1}
    - {id: b0, kind: process, label: Stage 0 backward, group: s0}
    - {id: barrier, kind: boundary, label: Complete logical step}
    - {id: update, kind: state, label: Commit parameter version t plus 1}
  groups: [{id: s0, label: Physical stage 0}, {id: s1, label: Physical stage 1}]
  edges:
    - {from: f0, to: f1, label: Activations}
    - {from: f1, to: b1}
    - {from: b1, to: b0, label: Activation derivatives}
    - {from: b0, to: barrier, kind: dependency}
    - {from: b1, to: barrier, kind: dependency}
    - {from: barrier, to: update, kind: emphasis}
```

## Implementation

[DERIVED] NVIDIA Megatron-Core belongs to **Distributed training**; its operator partitions lower through the framework into local GEMMs, activation kernels, and NVIDIA NCCL collectives. The inspected eligible release is 0.19.0; reading that release does not prove a particular TP/PP/precision composition is executable. [R29.2]. Require a configuration-specific check of matrix splits, microbatch schedule, activation transfer dtype, loss scaling, and final gradient ownership.

[DERIVED] Tensor groups should follow links with suitable latency and bandwidth for frequent layer-boundary collectives. Pipeline boundaries often carry activation tensors less frequently but can become limited by an oversubscribed inter-node cut. Mapping neighboring logical stages to neighboring rank numbers is meaningless without a physical GPU/NIC map. Record the transfer path and direction, including simultaneous backward traffic and contention with data synchronization.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Piper evaluates common pipeline strategies, pipeline-plus-sharding, and pipeline-plus-expert compositions separately, using its global DAG/runtime. Its evaluation reports workload-specific performance; its scheduler discussion explicitly describes cases where simple task priorities may perform poorly. [R29.3], §4.3.1 and §6.1–6.4. This manuscript does not copy its speedup range into a generic TP/PP claim.

### Proposed verification

[ASSUMED] Hold global valid-token batch and optimizer updates fixed while sweeping $t,p,m,v$. First verify outputs and gradients against the unpartitioned operator. Retain stage-level forward/backward durations, message sizes, fill/drain intervals, maximum live activations, and collective overlap. Repeat with intentional stage imbalance. Treat a change in microbatch GEMM efficiency separately from pipeline bubbles. The protocol in [verification](verification.md) remains unexecuted.

## Observations

**What the paper claims.** [PAPER-REPORTED] Piper represents composed execution as explicit compute and communication nodes. [R29.3], §4.

**What the evidence shows.** [DERIVED] Its evaluated schedules demonstrate particular compositions, not a proof that any arbitrary partition is efficient.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 29.5 fixes mandatory reduction boundaries; Eq. 29.6 isolates an idealized finite-wave cost.

**What remains unknown.** [UNVERIFIED] Local kernel efficiency, stage balance, and TP/PP numerical parity have not been measured.

## Failure modes

[MATHEMATICALLY-DERIVED] Duplicated row biases, misaligned gate shards, and missing backward sums produce incorrect operators. Updating a stage before all its step consumers finish creates mixed parameter versions. Too many microbatches can exhaust activation memory even as the ideal bubble fraction falls. Smaller virtual chunks can increase boundary traffic and launch overhead. Equal layer counts need not imply equal stage times, especially when embeddings, attention, and expert layers differ.

## Siblings

[DERIVED] [Data/state sharding](29-1-data-state-parallelism.md) changes persistent ownership without partitioning each mathematical operator. [Context parallelism](29-3-sequence-and-context-parallelism.md) distributes token positions and introduces attention-specific communication. TP splits dimensions inside operators; PP splits their dependency graph. None changes the likelihood objective by itself, but stale updates or altered global batches can change the optimization procedure.

## Extensions

[DERIVED] Forward/backward overlap, separated input-gradient and weight-gradient tasks, and interleaving expose additional scheduling freedom. Each requires a dependency proof and resource profile: legal overlap can still lose performance through shared SM, HBM, or fabric demand. Recomputation trades retained activations for additional operator work. Such decisions must be optimized jointly with state reconstruction rather than layered as independently beneficial flags. See [§29.6](29-6-joint-optimization.md).

## Limitations

[MATHEMATICALLY-DERIVED] The paired MLP derivation assumes elementwise activation and aligned partitions; attention and normalization can impose different constraints. The pipeline formula assumes balanced slots and excludes communication. Neither is an application throughput prediction. Energy and monetary effects remain unknown without wall time, power and pricing. A partition that passes the algebra can still be operationally infeasible because of message ordering, buffer capacity, or a supported-kernel restriction.

## Reproducibility

[DERIVED] Retain the global operator graph, tensor layouts, stage-to-device map, virtual-stage order, microbatch IDs, parameter version per task, message dtypes, optimizer barrier, activation retention policy, and runtime versions. Define the timing boundary across all ranks and include drain time. **UNVERIFIED:** no local TP/PP run or independent reproduction of source performance was performed.

## References

[R29.2](references.md#r292), Megatron-Core 0.19.0 release; [R29.3](references.md#r293), Piper §4 and §6. Analytical examples derive Eqs. 29.5–29.6.
