---
id: ms.section.27.5
entity_type: section
title: MoE execution
short_title: Dispatch, grouped GEMM, combine
volume: 2
part: 5
chapter: 27
section: 27.5
slug: 27-5-moe-execution
parent: ms.chapter.27
prev_sibling: ms.section.27.4
next_sibling: ms.section.27.6
children: []
prerequisites: [ms.chapter.16, ms.chapter.25, ms.chapter.26]
downstream: [ms.chapter.29, ms.chapter.45]
related: []
relations: []
axes: {lifecycle: [pretraining, inference, serving], mechanism: [mixture_of_experts, grouped_gemm, token_dispatch], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.nvidia-cutlass, impl.nvidia-nccl, impl.liger-kernel, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 27.5 — MoE execution

## Scope

[DERIVED] This section turns a routed expert layer into ownership, tensor layouts, compute, and communication. Chapter 16 owns the architecture. Here the mathematical reference is a declared top-k weighted expert sum, with explicit overflow and quantization policies. The eligible September 2026 MegaMoE disclosure [R27.5](references.md#r275) supports a current fused implementation example. Distributed topology and collective selection are developed in Chapter 29; this section provides their operator-level payload and progress requirements.

## Why this exists

[MATHEMATICALLY-DERIVED] Active parameter count is not an execution schedule. A token sent to several experts produces several work items, may cross rank boundaries, and must return enough information to combine results with the correct weights. Small expert batches can be poor GEMM shapes even when aggregate active arithmetic is large. Hot experts can determine the layer's critical path while other ranks wait. Sparse activation therefore does not imply balanced or communication-free execution.

[DERIVED] The principal design choice is what becomes contiguous, who owns each work item, and when a result is safe to consume. A diagram containing only “router → experts → output” hides the permutation, replication, capacity policy, scale metadata, and reduction. Those omitted details are where incorrect output, deadlock, and exaggerated speedups enter.

## Intuition

> **Definition — Accepted-route conservation.** [DERIVED] Every accepted token–expert edge has exactly one compute owner and contributes exactly once, with its declared weight, to the original token's output.

[MATHEMATICALLY-DERIVED] Routing constructs a sparse token–expert incidence matrix. Dispatch materializes its nonzero edges as contiguous expert batches. Grouped GEMM processes those differently sized batches; combine applies the inverse mapping and weights. The output of a token is a reduction over its routed edges. This decomposition exposes exact invariants: no accepted edge is lost or duplicated, each edge has one owner, and each combined contribution belongs to the original token and route slot.

## Formulation

| Symbol | Meaning | Shape / units |
|---|---|---|
| $n_t,d_{\rm model},d_f$ | Local tokens, model width, expert intermediate width | Tokens, values, values |
| $E,k$ | Total experts and accepted routes per token | Integers |
| $e_{it},a_{it}$ | Expert ID and mixture weight for route $t$ of token $i$ | Integer, scalar |
| $n_e,\widehat n_e$ | Actual and allocated routed rows for expert $e$ | Rows |
| $m_g$ | GEMM row alignment extent | Rows |
| $f_{\rm remote}$ | Fraction of accepted routes crossing a rank boundary | Fraction |
| $b_d,b_c$ | Dispatch and combine wire widths | Bytes per value |

[MATHEMATICALLY-DERIVED] With a gated expert $F_e(x)=W_e^D[\phi(W_e^Gx)\odot W_e^Ux]$,

$$
y_i=\sum_{t=1}^{k}a_{it}F_{e_{it}}(x_i),\qquad
n_e=\sum_{i,t}\mathbf1[e_{it}=e],\qquad\sum_en_e=n_tk.
$$

*(Eq. 27.18)*

The reference states whether route weights are renormalized after top-k or capacity rejection. It does not infer that choice from a model family name. Shared experts, biases, and residual paths must be added explicitly when present.

## Mechanism

### Routing and permutation contract

[DERIVED] The router emits IDs and weights in token order. A histogram counts accepted rows per expert; a prefix sum assigns expert ranges; a scatter writes rows into those ranges. Store the original token and route slot alongside the permutation. Different stable orders within an expert can be mathematically equivalent for independent rows, but deterministic accumulation and debugging need a declared order. Duplicate expert IDs for a token are rejected unless the operator deliberately interprets them as separate weighted contributions.

[MATHEMATICALLY-DERIVED] Counting/scattering accepted routes costs $O(n_tk+E)$ work and $O(n_tk+E)$ index storage in the straightforward construction. A comparison sort costs more but may enforce a desired ordering. Index and offset widths must represent $n_tk$ and allocated row extents, not merely $n_t$. Capacity truncation changes the operator because it removes terms in Eq. 27.18. Padding does not change it if padded rows are masked and excluded from combine.

```figure
id: fig-27.13
kind: diagram
title: Routed edge ownership
caption: The permutation and inverse mapping are part of the layer contract. Combination returns each weighted edge to its original token; it is not an unordered expert average.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.18
alt: Tokens produce route IDs and weights. Dispatch groups routed edges by expert and rank. Grouped GEMMs generate expert outputs. An inverse map and weighted reduction combine those edges into the original token order.
spec:
  direction: LR
  nodes:
    - {id: x, kind: tensor, label: Original tokens, sub: '[nt, dmodel]'}
    - {id: routes, kind: state, label: IDs and route weights, sub: '[nt, k]'}
    - {id: dispatch, kind: flow, label: Permute and dispatch}
    - {id: experts, kind: process, label: Grouped expert GEMMs, emphasis: true}
    - {id: inverse, kind: state, label: Token and route inverse map}
    - {id: combine, kind: process, label: Weighted combine}
    - {id: y, kind: tensor, label: Restored token order, sub: '[nt, dmodel]'}
  edges:
    - {from: x, to: routes}
    - {from: routes, to: dispatch}
    - {from: x, to: dispatch}
    - {from: dispatch, to: experts}
    - {from: dispatch, to: inverse}
    - {from: experts, to: combine}
    - {from: inverse, to: combine, kind: dependency}
    - {from: combine, to: y}
```

### Grouped GEMM and capacity padding

[MATHEMATICALLY-DERIVED] Three dense projections in the stated gated expert require approximately $6d_{\rm model}d_f$ FLOPs per routed row, excluding activation and multiplication. For aligned groups,

$$
\widehat n_e=m_g\left\lceil\frac{n_e}{m_g}\right\rceil,\qquad
F_{\rm useful}=6n_tkd_{\rm model}d_f,\qquad
F_{\rm padded}=6d_{\rm model}d_f\sum_e\widehat n_e.
$$

*(Eq. 27.19)*

The ratio $\sum_en_e/\sum_e\widehat n_e$ describes useful-row fraction for this padding scheme. It is not tensor-core utilization, because execution has additional scheduling and instruction constraints. Empty experts should require no work unless the selected backend imposes a fixed allocation. A fixed expert capacity adds another constraint; it must not be confused with hardware row alignment.

[DERIVED] Grouped GEMM aggregates scheduling across heterogeneous matrices. It does not make their row counts equal. A strategy suitable for many tiny groups may differ from one suitable for a few large groups. Expert weights can dominate resident capacity even when only a small subset is active in one step. A per-step active-parameter figure therefore cannot be used as the persistent weight-memory requirement.

```figure
id: fig-27.14
kind: memory-stack
title: Useful and padded routed rows
caption: An illustrative four-expert distribution uses a16-row alignment. The difference is allocated GEMM work, not token dropping or a measured implementation result.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.19
alt: Four experts receive17,33,8,and6routed rows. Alignment to16rows allocates32,48,16,and16rows. Total useful rows are64and allocated rows112.
spec:
  format: integer
  bars:
    - label: expert A
      segments:
        - {label: accepted rows, kind: tensor, value: 17}
        - {label: padding rows, kind: memory, value: 15}
    - label: expert B
      segments:
        - {label: accepted rows, kind: tensor, value: 33}
        - {label: padding rows, kind: memory, value: 15}
    - label: expert C
      segments:
        - {label: accepted rows, kind: tensor, value: 8}
        - {label: padding rows, kind: memory, value: 8}
    - label: expert D
      segments:
        - {label: accepted rows, kind: tensor, value: 6}
        - {label: padding rows, kind: memory, value: 10}
```

### Dispatch/combine bytes and overlap

[MATHEMATICALLY-DERIVED] For a non-coalesced route-copy transport with one activation and one result vector per remote route,

$$
Q_{\rm wire}=n_tkf_{\rm remote}d_{\rm model}(b_d+b_c)+Q_{\rm metadata}+Q_{\rm scales}.
$$

*(Eq. 27.20)*

This is a counted transport model, not a lower bound for every algorithm: routes to several experts on one rank can share a dispatch payload; multicast and local combination can change the byte count. State whether counters report endpoint bytes, link bytes, or collective aggregate bytes. Dividing one by a bandwidth defined for another produces a meaningless latency estimate.

[DERIVED] Communication can overlap expert compute after some tiles arrive. Correct overlap requires that a consumer can determine which input tile is complete, that the producer cannot overwrite it, and that enough resources remain to progress communication. A persistent kernel holding all execution slots while waiting for a producer that also needs those slots can deadlock. The same ownership reasoning as §27.2 applies across ranks, with additional transport completion and memory-consistency requirements.

[OFFICIAL-DOCUMENTATION] MegaMoE's September disclosure combines dispatch, quantization, two grouped-GEMM phases, and combine in a persistent forward kernel using symmetric memory. It also retains a split path and backend alternatives. [R27.5](references.md#r275), “Our approach” and “Usage.” Fusion is therefore a supported execution option, not the mathematical definition of an MoE layer.

### Quantized experts and wire formats

[MATHEMATICALLY-DERIVED] A block-scaled tensor represents $x\approx s_gq$ for quantized $q$ and scale group $g$. Effective storage is $nb_q+\lceil n/g\rceil b_s$ bytes for $n$ values, $b_q$ bytes per quantized value, and $b_s$ bytes per scale. Metadata, alignment, zero points, and packing can add more. Weight precision, activation precision, accumulation precision, and combine-wire precision are separate axes; the phrase “FP4 MoE” does not identify them.

[DERIVED] Low-precision combine perturbs already computed expert outputs, while low-precision dispatch perturbs expert inputs before nonlinear transformations. Their errors need not be interchangeable. Compare quantized and unquantized execution using identical routing first; then test whether the deployed router itself changes with precision. A throughput comparison between differently cast checkpoints requires a quality gate as well as kernel parity.

```figure
id: fig-27.15
kind: calculator
title: Remote routed payload
caption: Illustrative route-copy payload from Eq. 27.20. Coalescing, scales, route metadata, packet overhead, and collective topology are excluded; this is not measured network traffic.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.20
alt: Vary tokens, routes per token, model width, remote fraction,and dispatch/combine widths. The output counts vectors sent and returned across the chosen rank boundary.
spec:
  tex: Q=n_tkf_{\rm remote}d_{\rm model}(b_d+b_c)
  equation: '27.20'
  inputs:
    - {symbol: nt, label: local tokens, default: 1024, min: 8, max: 16384, scale: log2, format: tokens}
    - {symbol: k, label: routes per token, default: 8, min: 1, max: 16, format: integer}
    - {symbol: D, label: model width, default: 4096, min: 512, max: 16384, scale: log2, format: integer}
    - {symbol: remote, label: remote route fraction, default: 0.75, min: 0, max: 1, format: percent}
    - {symbol: bd, label: dispatch bytes per value, default: 2, min: 0.5, max: 2, options: [0.5, 1, 2], format: fixed1}
    - {symbol: bc, label: combine bytes per value, default: 2, min: 0.5, max: 2, options: [0.5, 1, 2], format: fixed1}
  outputs:
    - {symbol: Qwire, label: route-copy payload, formula: nt*k*remote*D*(bd+bc), format: bytes, emphasis: true}
```

## Algorithm

### Algorithm 27.5 — Routed execution with explicit conservation

[DERIVED] Inputs are $X$, expert weights, accepted route IDs/weights, expert placement, and capacity/precision policies. Outputs are $Y$ and a route-status record:

$$
\begin{aligned}
1.&\quad\mathcal R\leftarrow\{(i,t,e_{it},a_{it})\};\quad\mathrm{validateIDsAndWeights}(\mathcal R).\\
2.&\quad\mathcal R_{\rm accepted}\leftarrow\mathrm{capacityPolicy}(\mathcal R);\quad\mathrm{recordRejectedRoutes}.\\
3.&\quad(n_e,\mathrm{offsets},\pi,\pi^{-1})\leftarrow\mathrm{groupByExpert}(\mathcal R_{\rm accepted}).\\
4.&\quad X_e\leftarrow\mathrm{dispatch}_{\pi}(X);\quad\mathrm{waitForInputOwnership}.\\
5.&\quad Z_e\leftarrow\phi(X_eW_e^{G\mathsf T})\odot(X_eW_e^{U\mathsf T}).\\
6.&\quad U_e\leftarrow Z_eW_e^{D\mathsf T};\quad\mathrm{return}_{\pi^{-1}}(U_e).\\
7.&\quad Y_i\leftarrow\sum_{(i,t)\in\mathcal R_{\rm accepted}}a_{it}U_{it};\quad\mathrm{verifyRouteConservation}.
\end{aligned}
$$

[DERIVED] The invariant counts every accepted edge once through dispatch and once through combine. Capacity policy runs before allocation, and its renormalization choice is explicit. The procedure terminates after finite accepted routes and all required transport completions; missing-rank failure aborts the operation rather than returning a partial sum. The reference has $O(n_tkd_{\rm model}d_f)$ useful compute, routed-buffer storage $O(n_tkd_{\rm model})$, expert intermediates $O(n_tkd_f)$, and the communication model in Eq. 27.20. Fusion can reduce live intermediates but increases scheduling and progress obligations.

## Implementation

[DERIVED] **NVIDIA CUTLASS**, **NVIDIA NCCL**, and **Liger Kernel** occupy *Kernels / numerics / collectives*; **vLLM** occupies *Inference engine*. FlashInfer/MegaMoE and NVSHMEM are outside the enumerated stack and are declared in the chapter's coverage table. Their role is a specific execution/transport example. This manuscript inspected release disclosures, not a running distributed deployment; implementation compatibility is UNVERIFIED.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] R27.5 “Performance” identifies vLLM 0.25.1 and distinguishes native, same-kernel integration, and NVFP4-cast paths. “Microbenchmarks” and “Accuracy gate” disclose shape sweeps, small-token regressions, and quality qualification. The changed precision prevents attributing every difference to scheduling. R27.8's v0.8.4 notes record further correctness fixes; neither release establishes our local backward correctness.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] R27.5 reports workload-dependent fused-path benefits and regions where alternatives remain competitive. It is a first-party release disclosure, not a peer-reviewed universal ranking.

**What the evidence shows.** [DERIVED] Same-kernel integration and changed-precision comparisons are different controls. A regression at small routed batches is a meaningful operating boundary; the manuscript does not discard it to preserve a favorable headline.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 27.18–27.20 show that accepted routes, padding, expert load, and remote payload govern costs beyond active arithmetic. Fusion cannot remove the routed sum or transport completion obligations.

**What remains unknown.** [UNVERIFIED] Our topology's crossover, p99 layer latency, training gradients, failure recovery, energy, and cost are unmeasured. The disclosed forward path does not certify a backward path.

## Failure modes

> **Failure mode — Route conservation loss.** [DERIVED] *Symptom:* output varies with expert placement. *Cause:* lost/duplicated permutation entries or wrong mixture weights. *Detection:* one-hot synthetic experts with traceable contributions. *Mitigation:* assert accepted-route conservation and inverse-map identity.

> **Failure mode — Progress deadlock.** [DERIVED] *Symptom:* persistent distributed kernel stops completing. *Cause:* circular waits or resource starvation. *Detection:* progress counters and bounded fault injection. *Mitigation:* qualified launch/resource policy and an abortable fallback boundary.

## Siblings

[DERIVED] A split dispatch–GEMM–combine path exposes synchronization boundaries and uses more launches/intermediates; a persistent fused path reduces those boundaries but owns progress explicitly. Capacity padding preserves accepted routes; token dropping changes them. Quantized wire formats reduce bytes but introduce another error budget. [Chapter 29](../ch29-parallelism-collectives-and-distributed-optimization/README.md) develops placement and collectives.

## Extensions

[DERIVED] Training adds routed input/weight gradients, inverse communication, and possible expert-load auxiliary terms. Forward parity is insufficient. Extend the conservation test to derivative paths and preserve capacity decisions from the corresponding forward pass rather than rerouting with altered state.

## Limitations

[DERIVED] The arithmetic model assumes the stated gated expert and ignores padding unless explicitly charged. Communication depends on placement and topology. No claim about global model quality, parameter efficiency, energy, or total training cost follows from a fused layer benchmark.

## Reproducibility

[DERIVED] Retain expert placement, histogram, accepted/rejected route records, permutations, capacity/renormalization policy, padded shapes, block scales, wire format, transport version, rank count, topology, graph mode, and both layer/kernel timers. The proposal in [verification](verification.md) includes hot-expert and empty-expert adversaries and remains unexecuted.

## References

[R27.5](references.md#r275), Our approach, Usage, Performance, microbenchmark/accuracy sections; [R27.8](references.md#r278), v0.8.4 release notes. Algorithms and payload accounts are book-derived.
