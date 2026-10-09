---
id: ms.section.27.3
entity_type: section
title: Decode-specialized attention
short_title: Parallel KV reads
volume: 2
part: 5
chapter: 27
section: 27.3
slug: 27-3-decode-specialized-attention
parent: ms.chapter.27
prev_sibling: ms.section.27.2
next_sibling: ms.section.27.4
children: []
prerequisites: [ms.chapter.14, ms.chapter.25, ms.chapter.26, ms.section.27.1]
downstream: [ms.section.27.4, ms.chapter.42, ms.chapter.45]
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [attention, split_reduction, paged_cache], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.flashattention, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 27.3 — Decode-specialized attention

## Scope

[DERIVED] Decode attention has one or a few new query positions per request and a potentially large resident KV history. The objective is exact attention over the declared history, including paged storage and grouped-query reuse. Splitting the key axis is a scheduling change; dropping keys is a different operator. Current evidence is bounded to the September 2026 study [R27.3](references.md#r273) and release-specific APIs in [R27.6](references.md#r276). No older serving paper supplies factual evidence here.

## Why this exists

[MATHEMATICALLY-DERIVED] A prefill query tile reuses each loaded key across many query positions. A single-token decode has no such sequence-axis reuse. Increasing key length creates more data to read without creating more independent output rows. If only one owner executes each head's entire history, a large device may have too few runnable owners even though the total attention work is substantial. The kernel can be limited by parallelism before it reaches a memory-bandwidth limit.

[DERIVED] Batching adds independent requests, but it also adds their cache reads. Unlike projection weights, unrelated requests' KV histories generally cannot be amortized into one shared read. A serving scheduler's concurrency and a kernel's internal split count solve different problems. Reporting a large-batch throughput gain as a single-request latency improvement changes the evaluation axis.

## Intuition

> **Definition — Attention partition normalizer.** [MATHEMATICALLY-DERIVED] The exponential mass of a key partition, or its logarithm, required to give that partition's normalized output its correct weight in a global merge.

[MATHEMATICALLY-DERIVED] Divide one query's admitted keys into disjoint partitions. Every partition computes a partial output and a log-normalizer. The final output is a normalized weighted sum of partial outputs. More partitions expose more independent work, but they also create scratch, launches, and a merge. There is no universally optimal split count: the balance depends on query count, head grouping, key length, page geometry, and available execution capacity.

## Formulation

| Symbol | Meaning | Shape / units |
|---|---|---|
| $B,T_b$ | Active requests and history length of request $b$ | Requests, tokens |
| $q$ | New query positions per request | Tokens |
| $H_q,H_{kv},g$ | Query heads, KV heads, and $H_q/H_{kv}$ | Positive integers; $g$ integral |
| $P_s$ | Number of disjoint key partitions | Integer |
| $p$ | Tokens per physical cache page | Positive integer |
| $\Lambda_{b,r}$ | Physical page identifier for logical page $r$ | Integer table |
| $z_a,o_a$ | Partition log-normalizer and output | Scalar, $[d_v]$ |

[MATHEMATICALLY-DERIVED] For full cache reads with ideal reuse across grouped query heads,

$$
Q_{\rm KV}=b\sum_{b'=1}^{B}T_{b'}H_{kv}(d_h+d_v),\qquad
F_{\rm decode}=2qH_q\sum_{b'=1}^{B}T_{b'}(d_h+d_v).
$$

*(Eq. 27.10)*

Here $b$ is bytes per stored value, consistent with the shared notation; the summation index is $b'$. Scales, page tables, queries, outputs, projections, and repeated cache-line fetches are excluded. For equal lengths, arithmetic intensity at this boundary is $2qg/b$ FLOPs per KV byte. It is an optimistic reuse calculation, not an observed hardware ratio.

## Mechanism

### Partition reduction without averaging errors

[MATHEMATICALLY-DERIVED] Let $z_a=\log\sum_{j\in A_a}\exp(s_j)$ and $o_a=\sum_{j\in A_a}\exp(s_j-z_a)v_j$ for disjoint nonempty partitions $A_a$. Then

$$
z=\operatorname{LSE}(z_1,\ldots,z_{P_s}),\qquad
o=\sum_{a=1}^{P_s}e^{z_a-z}o_a.
$$

*(Eq. 27.11)*

Substituting the definition of $o_a$ cancels the partition normalizer. The coefficient is the partition's share of the global exponential mass. An arithmetic mean gives every partition equal weight regardless of its scores or length and is wrong except in special cases. Empty partitions contribute zero mass; they must be excluded from the maximum and reduction before exponentiation.

```figure
id: fig-27.7
kind: tensor-flow
title: Split decode and weighted merge
caption: Partition outputs require their log-normalizers. The merge removes the split axis; it does not average equally weighted partial vectors.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.11
alt: Queries have batch, query, head, and head-width axes. Split attention creates partition outputs and log-normalizers. A weighted merge removes the partition dimension to produce the final output.
spec:
  dims: {B: active requests, Q: new query positions, Hq: query heads, D: key width, V: value width, Ps: key partitions}
  steps:
    - {shape: '[B, Q, Hq, D]', label: queries}
    - {shape: '[B, Q, Hq, Ps, V]', op: partition-local attention, cost: disjoint KV reads}
    - {shape: '[B, Q, Hq, Ps]', op: retain partition log-normalizers}
    - {shape: '[B, Q, Hq, V]', op: log-sum-exp weighted merge, cost: 'O(B Q Hq Ps V)'}
```

[DERIVED] Split scratch has one vector and one scalar per query/head/partition. If both use $b_a$ bytes, scratch is $BqH_qP_s(d_v+1)b_a$. The merge reads this scratch and writes the final result. The additional memory is linear in split count. Increasing splits beyond useful occupancy can therefore lower effective bandwidth by adding merge traffic and scheduling overhead.

### Paged address translation is part of correctness

[MATHEMATICALLY-DERIVED] For logical token $j$ in request $b'$, compute

$$
r=\lfloor j/p\rfloor,\quad o_p=j\bmod p,\quad
\mathrm{physicalToken}(b',j)=p\Lambda_{b',r}+o_p.
$$

*(Eq. 27.12)*

The page table maps storage; it does not determine which logical keys are admitted. A kernel must enforce both sequence length and causal position after translation. The last page can contain valid tokens followed by unrelated stale values. Physical contiguity across page identifiers cannot be assumed, even when a benchmark allocation happens to make it true.

[DERIVED] Cache sharing requires an additional lifetime contract. A page still referenced by a queued kernel cannot be recycled or mutated. Graph replay makes this requirement longer lived because a captured pointer may outlive the planning call. Correctness includes aliasing, stream ordering, and ownership, not just the arithmetic on a static cache. Bounds checks on page identifiers do not establish that the page belongs to the intended request.

[OFFICIAL-DOCUMENTATION] The v0.7 release records paged block-sparse attention and reusable plan/run wrappers. [R27.6](references.md#r276), “TRT-LLM Gen MoE kernels as Python source with PrimTS.” These are release disclosures; exact installed API compatibility remains UNVERIFIED.

```figure
id: fig-27.8
kind: memory-stack
title: Split scratch versus resident cache
caption: Illustrative equal-length configuration, not a named model. The cache uses Eq. 27.10 and partial-output scratch uses the stated split-state count; allocator overhead and weights are excluded.
evidence: MATHEMATICALLY-DERIVED
source: [DERIVED:eq-27.10, DERIVED:eq-27.11]
alt: For eight requests, 32768 cached tokens, eight KV heads, width128, and two-byte values the KV cache is1GiB per layer. Thirty-two splits,32query heads, and FP32 partial outputs require about4MiB scratch.
spec:
  format: bytes
  variables: {B: 8, T: 32768, Hkv: 8, Hq: 32, D: 128, V: 128, b: 2, ba: 4, Ps: 32, Q: 1}
  bars:
    - label: resident KV per layer
      segments:
        - {label: keys, kind: memory, formula: B*T*Hkv*D*b}
        - {label: values, kind: memory, formula: B*T*Hkv*V*b}
    - label: split scratch per call
      segments:
        - {label: partial outputs, kind: tensor, formula: B*Q*Hq*Ps*V*ba}
        - {label: log-normalizers, kind: state, formula: B*Q*Hq*Ps*ba}
```

### Batching, grouping, and the whole decode step

[MATHEMATICALLY-DERIVED] If each of $g$ query heads independently reloads the same KV group, physical traffic approaches $gQ_{\rm KV}$ instead of $Q_{\rm KV}$. Sharing a tile across grouped heads reduces that duplication but increases live query/output state and may change instruction shapes. The useful reuse is a property of the executed path, not merely the model's declared $H_{kv}$.

[MATHEMATICALLY-DERIVED] An operator-level lower bound is $t_{\rm attn}\geq Q_{\rm KV}/B_{\rm eff}$ for an assumed effective bandwidth $B_{\rm eff}$. A whole decode step also reads weights, applies projections and nonlinearities, communicates between ranks, and performs host scheduling. If attention originally contributes fraction $f$ of step time and is accelerated by factor $s$, the optimistic step speedup is

$$
S_{\rm step}\leq\frac{1}{(1-f)+f/s}.
$$

*(Eq. 27.13)*

The inequality assumes unchanged other costs and no added overhead. A bandwidth saving can improve memory capacity or allow a larger active batch without providing the same factor in ITL. That distinction is central to interpreting sparse-cache claims.

```figure
id: fig-27.9
kind: calculator
title: Ideal decode attention intensity
caption: Illustrative ideal grouped-head reuse from Eq. 27.10. This is FLOPs per KV byte, excluding scales, page metadata, projections, and repeated physical loads.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.10
alt: Query positions and query heads per KV group raise arithmetic intensity. Wider stored values lower it. One query, four grouped query heads, and two-byte values yield four FLOPs per ideal KV byte.
spec:
  tex: I_{\rm KV}=2qg/b
  equation: '27.10'
  inputs:
    - {symbol: q, label: new query positions, default: 1, min: 1, max: 16, format: integer}
    - {symbol: g, label: query heads per KV group, default: 4, min: 1, max: 64, format: integer}
    - {symbol: b, label: bytes per stored value, default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes}
  outputs:
    - {symbol: I, label: ideal FLOPs per KV byte, formula: 2*q*g/b, format: fixed2, emphasis: true}
```

## Algorithm

### Algorithm 27.3 — Paged split reduction

[DERIVED] Inputs include queries, cache, live page table, absolute positions, lengths, scale, and a bounded split policy. Outputs are attention vectors and optional global log-normalizers. The procedure is

$$
\begin{aligned}
1.&\quad\mathrm{validate}(H_q\bmod H_{kv}=0,\ T_{b'}\leq\text{capacity},\ \Lambda\text{ in bounds}).\\
2.&\quad\mathcal A_{b',i}=\bigsqcup_{a=1}^{P_s}A_{b',i,a};\quad\text{retain empty-partition flags}.\\
3.&\quad\mathrm{parallel}_{b',i,h,a}:\ (o_a,z_a)\leftarrow\mathrm{scan}_{27.1}(q_{b',i,h},A_{b',i,a},\Lambda).\\
4.&\quad\mathrm{join}\ \text{all partition writers before reading scratch}.\\
5.&\quad z\leftarrow\operatorname{LSE}\{z_a:A_a\neq\varnothing\}.\\
6.&\quad o\leftarrow\sum_{a:A_a\neq\varnothing}\exp(z_a-z)o_a;\quad\mathrm{publish}(o,z).
\end{aligned}
$$

[DERIVED] Each admitted logical key appears exactly once; this is the partition invariant. Each scratch slot has one writer and one post-join reduction owner. Work includes $O(BqH_qT(d_h+d_v))$ attention plus $O(BqH_qP_sd_v)$ merging for equal lengths. Scratch is $O(BqH_qP_sd_v)$. The host bounds the policy search and rejects unsupported geometry. No assumption about a physical page ordering is hidden in the algorithm.

## Implementation

[DERIVED] **FlashAttention** sits in *Kernels / numerics / collectives* and **vLLM** in *Inference engine*. FlashInfer is an explicitly outside-stack integration source routed by the chapter's kernel anchor. The critical integration boundary is a cache representation plus a dispatch policy. Pin the actual backend, split metadata, scratch ownership, and graph lifetime; naming a serving engine does not identify the kernel it selected.

[DERIVED] When varying batch size, keep request lengths and admitted tokens visible. A batch of many short histories can have the same total KV bytes as a few long ones but a different number of owners and merge costs. For speculative multi-query decode, specify whether the new queries causally attend within the speculative block. A “decode” function name does not settle that mask convention.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R27.3 §§4–5 and Appendices B–F compare dense and sparse decode paths after real-text prefill, sharing a split-K baseline. Disclosed tests include A100/RTX A6000, Llama-family checkpoints, perplexity and placed-key retrieval. Its §4.4 demonstrates baseline sensitivity. This is a narrow single-sequence study, not a production SLA measurement. No numerical result is transferred to our unexecuted artifact.

## Observations

**What the paper claims.** [PAPER-REPORTED] R27.3 §4.4 reports that changing the dense attention baseline changes the apparent benefit of an unchanged sparse policy.

**What the evidence shows.** [DERIVED] The inspected study provides a matched-path control. Its particular hardware, checkpoints, and selection procedure do not establish general serving superiority or independent replication.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 27.10–27.13 explain why head reuse, split overhead, and the whole-step fraction constrain achievable gains. Dense-baseline weakness can inflate an apparent sparsity advantage.

**What remains unknown.** [UNVERIFIED] Our page manager, release-specific backend, latency tails, communication, and split crossover have not been measured. A universal split threshold is unsupported.

## Failure modes

> **Failure mode — Partial-output mean.** [DERIVED] *Symptom:* errors depend on how keys are split. *Cause:* discarded or mis-scaled log-normalizers. *Detection:* compare several partitions of the same admitted set. *Mitigation:* Eq. 27.11 with a consistent logarithm base.

> **Failure mode — Stale page reuse.** [DERIVED] *Symptom:* output changes under concurrent requests despite identical logical inputs. *Cause:* page lifetime ends before queued reads. *Detection:* stream-stress tests with page poisoning. *Mitigation:* explicit reader lifetime and synchronization.

## Siblings

[DERIVED] [Prefill tiling](27-1-io-aware-attention.md) obtains reuse across query rows; split decode obtains parallelism across key partitions. [Sparse attention](27-4-mla-and-sparse-kernels.md) reduces admitted keys and adds selection/quality costs. A contiguous cache removes translation but sacrifices a paging allocator's flexibility; compare equal logical histories rather than favorable allocation accidents.

## Extensions

[DERIVED] Adaptive split policies can select from a finite qualified shape table. Use a separate calibration set and retain the unchanged baseline as fallback. Recalibrate after backend, device, page size, or graph mode changes; those changes invalidate the assumed service times.

## Limitations

[DERIVED] The byte count is an optimistic accounting boundary. HBM transactions include cache-line effects, scale reads, and possible repeated loads. Effective bandwidth, power, energy, and dollar cost remain measured quantities rather than deductions from parameter count.

## Reproducibility

[DERIVED] Preserve logical and physical page maps, page size, last-page lengths, selected splits, query/head mapping, cache scales, scratch sizes, graph bindings, cache mutation schedule, and both kernel and whole-step timers. Include all-masked, empty, ragged, aliased, and partially filled pages in the proposed correctness suite.

## References

[R27.3](references.md#r273), §§4.1–4.4,5 and Appendices B–F; [R27.6](references.md#r276), PrimTS plan/run release notes. All numerical calculators are illustrative mathematical accounts.
