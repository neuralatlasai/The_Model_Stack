---
id: ms.section.29.4
entity_type: section
title: Expert parallelism
short_title: Expert parallelism
volume: 2
part: 5
chapter: 29
section: 29.4
slug: 29-4-expert-parallelism
parent: ms.chapter.29
prev_sibling: ms.section.29.3
next_sibling: ms.section.29.5
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

# 29.4 — Expert parallelism

## Scope

[DERIVED] This section owns expert placement, router-induced imbalance, dispatch/combine exchange, hybrid expert/data groups and shared-expert placement. The architecture's routing function is an input; changing it is an architectural or optimization intervention rather than a transparent communication improvement. The correctness target is the same selected experts, weights and token outputs as the declared reference. The cost boundary includes routing metadata, packing, transport, grouped expert work, combine and backward, not merely all-to-all device time.

## Why this exists

[MATHEMATICALLY-DERIVED] Sparse activation reduces the parameters used per token without removing all expert parameters from storage. Expert partitioning places different expert matrices on different devices, allowing capacity to scale with the group. Tokens must reach their selected experts and return to their original logical positions. Since routing depends on the current activations and parameters, the resulting message counts and per-expert matrix sizes vary across steps.

[PAPER-REPORTED] UCCL-EP describes a portable token-level communication design using GPU-to-CPU control commands and CPU proxy threads, separating those commands from GPUDirect RDMA payload transfers. It studies GPU/NIC combinations rather than assuming a single tightly coupled platform. [R29.7], §3–4. This is evidence for a concrete communication architecture, not a claim that CPU assistance is inherently faster or every NIC shares the same completion semantics.

[DERIVED] Expert parallelism is therefore a sparse, dynamic dependency problem. A fixed group size does not fix the byte matrix, and equal expert counts do not imply equal work. The dominant constraint can move among expert storage, dispatch rate, incast, grouped-GEMM utilization, shared-expert overlap, and the longest-loaded rank. An average expert load alone hides the critical path.

## Intuition

[MATHEMATICALLY-DERIVED] The same activation can be sent to multiple selected experts. If those experts share a destination rank or node, a dispatcher may reuse a transported activation, but that is an explicit deduplication rule. Expert outputs generally differ and need a weighted combine; one cannot deduplicate them merely because their inputs match. Dispatch bytes, combine bytes and metadata have separate accounting boundaries.

[MATHEMATICALLY-DERIVED] Perfect balance by token count can still give poor efficiency if every expert receives too few rows for its kernel. Conversely, several experts on one device can create a straggler even when each individual expert looks moderately loaded. The useful load metric combines placement with the actual token-to-expert incidence relation and a measured or declared cost for each grouped operation.

## Formulation

| Symbol | Meaning | Shape / unit |
|---|---|---|
| $q,E,k$ | Tokens, routed experts, selections per token | Counts |
| $h$ | Token activation width | Elements |
| $p(e)$ | Device owner of expert $e$ | Rank index |
| $e_p$ | Number of expert-parallel device owners | Count |
| $a_{ie}$ | Whether token $i$ selects expert $e$ | Zero or one |
| $w_{ie}$ | Declared combine weight | Scalar |
| $n_e$ | Routed token count for expert $e$ | Tokens |
| $c_{rs}$ | Expert-assignment count from source $r$ to destination $s$ | Count |
| $b_x,b_y$ | Dispatch and output element storage | Bytes |

[MATHEMATICALLY-DERIVED] For deterministic selected assignments with no dropping,

$$
n_e=\sum_i a_{ie},\qquad\sum_e n_e=qk,\qquad
y_i=\sum_e a_{ie}w_{ie}f_e(x_i)+f_{\rm shared}(x_i).
$$

*(Eq. 29.11)*

[DERIVED] The shared term is included only if the declared architecture has it. Its scale and normalization must match the model. Shared experts are not necessarily members of the top-$k$ set, and treating them that way can alter both outputs and communication counts. Token-dropping, padded-capacity and dropless dispatch are different contracts and require different invariants.

## Mechanism

### Dynamic exchange and ownership

[MATHEMATICALLY-DERIVED] Without activation deduplication, source rank $r$ sends

$$
V_{r,\rm dispatch}=hb_x\sum_{s\ne r}c_{rs},\qquad
V_{r,\rm return}=hb_y\sum_{s\ne r}c_{sr},\qquad
V_{\rm total}=\sum_r(V_{r,\rm dispatch}+V_{r,\rm return})=qkh(b_x+b_y)\varphi_{\rm remote}.
$$

*(Eq. 29.12)*

[MATHEMATICALLY-DERIVED] The second expression counts output traffic sent by rank $r$, whose locally hosted experts process incoming assignments. Summing over ranks gives total remote assignment traffic. Here $\varphi_{\rm remote}\in[0,1]$ is the fraction of assignments crossing owner ranks, and the calculator applies that total rather than a per-rank traffic claim. Metadata adds token IDs, expert IDs, offsets, lengths, weights, and sometimes scale factors. If routing to several experts on a node uses one remote activation plus local forwarding, network dispatch counts unique token/destination-node pairs instead of expert assignments. That optimization does not remove intra-node copies or combine reductions.

[DERIVED] A variable-split all-to-all normally requires peers to agree on counts before payload transfers. Counts can be exchanged or inferred from a shared routing contract, but they cannot be omitted without another correctness mechanism. Tensor packing converts a sparse logical incidence relation into transport buffers; its memory traffic and kernel time belong in the dispatch boundary. A low-level communication benchmark that begins after packing cannot establish full dispatcher latency.

```figure
id: fig-29.10
kind: matrix
title: Expert routing becomes a traffic matrix
caption: Illustrative normalized assignment counts for four source and destination ranks. A hot destination creates incast even when the total number of assignments is fixed; diagonal entries remain local.
evidence: DERIVED
source: DERIVED:eq-29.12
alt: A four-by-four matrix shows all sources sending many assignments to destination one, while diagonal local assignments require no remote payload. The column sum exposes destination imbalance.
spec:
  rows: 4
  cols: 4
  pattern: explicit
  cells: [[0.2, 0.8, 0.1, 0.1], [0.1, 0.7, 0.2, 0.1], [0.1, 0.9, 0.2, 0.1], [0.2, 0.8, 0.1, 0.2]]
  rowLabel: Source rank
  colLabel: Expert owner rank
  rowTicks: ['0', '1', '2', '3']
  colTicks: ['0', '1', '2', '3']
  highlight: [{row: 0, col: 1}, {row: 2, col: 1}]
  legend: Intensities are illustrative counts after common normalization
```

### Load, capacity, and grouped kernels

[MATHEMATICALLY-DERIVED] Define expert-count imbalance $\rho_E=\max_e n_e/(qk/E)$. For identical expert costs and $E/e_p$ experts per device, a placement-level proxy is

$$
\rho_R=\frac{\max_r\sum_{e:p(e)=r}n_e}{qk/e_p},
$$

*(Eq. 29.13)*

[DERIVED] Neither ratio is a complete time model. Grouped GEMMs depend on the distribution of expert row counts, widths, dtypes and tile padding. A rank with two large expert matrices can have a different duration from one with many tiny matrices at the same total rows. Capacity factor $\kappa$ sets a nominal per-expert admission bound $\lceil\kappa qk/E\rceil$ only for a specified capacity-based router. Dropping overflow changes token computation; rerouting changes expert selection; padding wastes work. A dropless contract retains all assignments but must accommodate worst-case allocation or an overflow execution path.

[OFFICIAL-DOCUMENTATION] Megatron-Core 0.19.0 lists quantile-based routing biases, fused shared-expert MLP execution, packed-sequence dispatch support, routing analysis, and an NCCL expert dispatcher. [R29.2], MoE and Parallelism bullets. The router change and dispatcher change are distinct interventions; the release does not establish that their combined quality/performance effect transfers to any arbitrary model.

### Hybrid groups and shared experts

[DERIVED] A dense attention parameter replicated across expert owners needs gradient contributions from every token partition that used it. A routed expert parameter needs synchronization only across replicas of that same expert. Their data groups need not be identical. Write each parameter family's logical owner set and replica set; multiplying DP and EP degrees without that mapping can reduce unrelated experts together or omit required expert replicas.

[MATHEMATICALLY-DERIVED] A shared expert evaluated for every local token can be replicated alongside the dense path, avoiding a routed dispatch at the cost of replicated parameters and their synchronization. Placing it remotely reduces resident duplication but adds a dependency for every token. Overlap with routed work is legal only when buffers and resources permit it; it does not erase the shared expert's compute or HBM demand. For training, routed input gradients and shared input gradients must be summed before the preceding operator consumes their complete derivative.

## Algorithm

**Algorithm 29.4 — Count-checked dropless dispatch and combine.** [MATHEMATICALLY-DERIVED] Inputs are logical token IDs, selected expert IDs and weights, placement $p$, experts, and a buffer budget. Outputs preserve token ordering and Eq. 29.11. Routing is fixed before this procedure; overflow cannot silently change it.

$$
\begin{aligned}
1.\quad &\mathcal A\gets\{(i,e,w_{ie}):a_{ie}=1\};\quad
|\mathcal A|\ne qk\Rightarrow\operatorname{return}(\bot).\\
2.\quad &c_{rs}\gets|\{(i,e,w)\in\mathcal A:i\in r,\ p(e)=s\}|.\\
3.\quad &\widehat c_{sr}\gets\operatorname{exchangeCounts}(c_{rs});\quad
\neg\operatorname{fits}(c,\widehat c)\Rightarrow\operatorname{requireFeasiblePeerAgreedChunksOrReturn}(\bot).\\
4.\quad &X_s,\mathcal J_s\gets\operatorname{dispatch}(X,\mathcal A,p),\quad
\mathcal J_s=(i,e,w,\mathrm{source}).\\
5.\quad &Z_{i,e}\gets f_e(X_{i,e});\quad
\widetilde Z\gets\operatorname{returnToSources}(Z,\mathcal J).\\
6.\quad &\neg\operatorname{exactlyOneResultPerAssignment}(\widetilde Z,\mathcal A)
\Rightarrow\operatorname{return}(\bot,\mathrm{lost\ or\ duplicate\ assignment}).\\
7.\quad &y_i\gets\sum_{e:a_{ie}=1}w_{ie}\widetilde Z_{i,e}
+f_{\rm shared}(x_i);\quad\operatorname{return}(Y).
\end{aligned}
$$

[DERIVED] Coverage is a multiplicity check keyed by source/token/expert identity, not set equality that discards duplicate results. Counts and chunk boundaries must agree across peers before payload posting; a failed chunk plan returns without dispatch. The invariant is one result per selected assignment, or a declared deduplicated representation with equivalent combine. Termination follows finite assignments and successful completion of all chunks. Backpressure must bound outstanding buffers without creating a cycle in which every peer awaits space held by another. Backward reverses data dependencies and additionally differentiates combine weights where the routing model requires them; dropping metadata can therefore corrupt training despite plausible forward outputs.

```figure
id: fig-29.11
kind: cycle
title: Routed assignment conservation
caption: Routing metadata must survive dispatch, expert execution and combine. Every selected assignment returns exactly once before the logical token output is complete.
evidence: DERIVED
source: DERIVED:eq-29.11
alt: Selected token-expert assignments are counted, dispatched to owners, executed, returned to source positions, checked for complete coverage, and combined with their original weights.
spec:
  stages:
    - {id: route, label: Select assignments, kind: tensor}
    - {id: counts, label: Agree counts, kind: boundary}
    - {id: dispatch, label: Dispatch to owners, kind: flow}
    - {id: execute, label: Grouped expert work, kind: process}
    - {id: return, label: Return assignment outputs, kind: flow}
    - {id: combine, label: Check and combine, kind: process}
  edges:
    - {from: route, to: counts}
    - {from: counts, to: dispatch}
    - {from: dispatch, to: execute}
    - {from: execute, to: return}
    - {from: return, to: combine}
    - {from: route, to: combine, kind: feedback, label: Identity and combine weights}
```

## Implementation

[DERIVED] NVIDIA Megatron-Core realizes **Distributed training** placement and dispatcher selection; NVIDIA NCCL and AMD RCCL occupy **Kernels / numerics / collectives**. UCCL-EP is outside the named stack and is routed through the plan's communication/MoE anchors. Its inspected preprint describes a communication design; no local implementation or runtime compatibility is asserted. [R29.7].

[DERIVED] Separate router precision, activation precision, transport representation and expert accumulation precision. Quantized payloads need scale metadata and a reconstruction convention. A device-initiated transport also needs a memory-ordering proof: observing a flag must imply visibility of the associated payload. CPU proxies require CPU affinity and NUMA/NIC placement. Hiding those resources outside the reported GPU cost boundary can make a portability comparison misleading.

```figure
id: fig-29.12
kind: calculator
title: Assignment payload before deduplication
caption: Illustrative remote-assignment model for dispatch and return payload. The remote fraction is an analytical input, not a measured routing distribution; packing, metadata, gradients and local forwarding are excluded.
placement: rail
anchor: implementation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.12
alt: Total dispatch and return payload grows with token count, selections per token, hidden width, representation bytes and the remote-assignment fraction. The model explicitly excludes metadata and backward traffic.
spec:
  equation: '29.12'
  tex: V=qkh(b_x+b_y)r
  inputs:
    - {symbol: q, label: Tokens in expert group, default: 8192, min: 128, max: 131072, scale: log2, format: tokens}
    - {symbol: k, label: Experts per token, default: 4, min: 1, max: 8, format: integer}
    - {symbol: h, label: Hidden width, default: 4096, min: 512, max: 16384, scale: log2, format: integer}
    - {symbol: bx, label: Dispatch bytes per value, default: 2, min: 1, max: 4, options: [1, 2, 4]}
    - {symbol: by, label: Return bytes per value, default: 2, min: 1, max: 4, options: [1, 2, 4]}
    - {symbol: r, label: Remote assignment fraction, default: 0.75, min: 0, max: 1, step: 0.05, format: percent}
  outputs:
    - {symbol: V, label: Total remote payload, formula: q*k*h*(bx+by)*r, format: bytes, emphasis: true}
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] UCCL-EP uses multiple NVIDIA/AMD and NIC testbeds, compares available NCCL/RCCL, DeepEP and PPLX baselines, and matches GPU communication resources while using four CPU proxy threads per GPU. Its microbenchmark notes a small-batch case in which PPLX is faster. [R29.7], Table 2, §5.1–5.2. These conditions prevent a blanket claim of superiority and distinguish communication microbenchmarks from end-to-end training/serving evaluations in §5.3.

### Proposed verification

[ASSUMED] Freeze router decisions to isolate dispatch correctness and cost, then restore learned routing for a separate end-to-end test. Sweep token count, EP degree, skew and placement. Record assignment coverage, count matrices, metadata bytes, packing/unpacking time, CPU time, expert row distributions, complete forward/backward time and peak memory. Compare shared-expert replication and remote placement at equal logical computation. No proposed experiment was executed.

## Observations

**What the paper claims.** [PAPER-REPORTED] UCCL-EP separates portable CPU-mediated control from direct payload transport. [R29.7], §3.

**What the evidence shows.** [DERIVED] Its tested platforms and small-batch counterexample bound the claim; it does not establish universal portability or a universally faster control path.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 29.12–29.13 show that equal total assignments can hide destination incast and rank imbalance.

**What remains unknown.** [UNVERIFIED] Local dispatcher correctness, firmware behavior and full-step speed remain unchecked.

## Failure modes

[MATHEMATICALLY-DERIVED] Mismatched count/split arrays can hang or corrupt buffers. Missing token IDs reorder outputs; duplicate assignments overweight an expert; lost combine weights change the function. Capacity overflow silently handled by dropping changes the algorithm. A stale completion flag can expose an incomplete payload. A hot rank can dominate makespan even when average network utilization is low. Routing changes made to improve locality can change training quality and require a separate controlled comparison.

## Siblings

[DERIVED] [Tensor parallelism](29-2-tensor-and-pipeline-parallelism.md) partitions every relevant dense operator and commonly exchanges regular activation tensors. EP partitions a set of experts and moves sparse, data-dependent assignments. [Data parallelism](29-1-data-state-parallelism.md) replicates the same parameters across independent token groups; EP owners can hold different parameters. A hybrid needs family-specific groups. These alternatives preserve the objective only when their routing, normalization and update contracts remain fixed.

## Extensions

[DERIVED] Hierarchical dispatch can deduplicate network payloads before local forwarding and combine outputs locally before return. Replicating popular experts can reduce hotspots but adds memory and replica-gradient synchronization. Changing expert placement online requires moving optimizer state and maintaining logical expert identity. Shared-expert overlap is a scheduling intervention; shared-expert parameterization is an architecture choice. Distinguishing these prevents a systems result from being mistaken for a model-quality result.

## Limitations

[MATHEMATICALLY-DERIVED] The byte model assumes no payload deduplication and ignores metadata, headers and retransmission. The load ratios assume equal expert costs and do not predict grouped-kernel efficiency. No claim about quality follows from a communication improvement with frozen routing. Energy and money require accounting for CPU proxies, NICs, GPU occupancy and elapsed time. Source-reported platform support is not a guarantee for untested firmware or another runtime build.

## Reproducibility

[DERIVED] Preserve token/expert IDs, selected weights, router and transport dtypes, expert placement, family-specific replica groups, count matrices, capacity/drop policy, shared-expert path, dispatcher version and CPU affinity. Keep microbenchmark and full-step timing boundaries separate. **UNVERIFIED:** no dispatcher, training or serving experiment was run for this manuscript.

## References

[R29.2](references.md#r292), Megatron-Core 0.19.0 MoE/parallelism release disclosures; [R29.7](references.md#r297), UCCL-EP v1 §3–5.
