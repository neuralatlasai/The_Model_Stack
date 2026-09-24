---
id: ms.section.14.1
entity_type: section
title: MHA, MQA, and GQA
short_title: MHA, MQA, and GQA
section: 14.1
slug: 14-1-mha-mqa-and-gqa
parent: ms.chapter.14
prev_sibling: null
next_sibling: ms.section.14.2
children: []
prerequisites: [ms.chapter.5, ms.chapter.13]
downstream: [ms.chapter.15, ms.chapter.27, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 14
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [attention, cache_representation], feedback_setting: [], modality: [text, image, audio, video]}
papers: [P13, P19, P20]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 14.1 — MHA, MQA, and GQA

## Scope

**DERIVED.** This section fixes the relationship between query heads and independently stored key/value heads. The comparison holds residual width, query-head count, key/value dimensions, visibility, and workload explicit; it does not assume equal quality or equal total parameters. The artifact is a head-assignment map with separate parameter, persistent-state, and decode-work ledgers. Attention primitives remain in [Chapter 05](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/README.md); dense-model allocation remains in [Chapter 13](../ch13-dense-transformer-design-and-parameter-allocation/README.md).

## Why this exists

**PAPER-REPORTED — [R14.1](references.md#r141).** Shazeer's multi-query attention work identifies repeated loading of keys and values as a constraint in incremental decoding and shares those projections across query heads. [R14.2](references.md#r142) introduces grouped-query attention and studies conversion followed by additional training.

**DERIVED.** The design question is therefore not simply how many attention heads exist. Query heads determine how many distributions are formed; KV heads determine how many independent key/value representations are stored. Conflating them hides the mechanism's principal resource effect. Increasing batch size or retained history multiplies persistent state even when the learned parameter inventory stays fixed. Conversely, reducing KV heads does not proportionally remove the query-specific dot products or probability-weighted reductions.

## Intuition

> **Definition — KV-head sharing.** Assignment of several query heads to the same learned key and value projections and their corresponding cached tensors.

**DERIVED.** MHA assigns one KV head to each query head. MQA assigns all query heads to one KV head. GQA lies between these endpoints. Sharing values does not force identical head outputs: different queries generally produce different attention weights over the same values. Sharing keys does restrict which token features can independently define those weights.

**DERIVED.** This is an architectural constraint when the shared projections are learned as part of the model. Physically deduplicating identical tensors is a storage optimization; replacing distinct trained projections by a common projection changes the function unless an equivalence condition is established. A checkpoint conversion must therefore distinguish parameter transformation from subsequent adaptation.

## Formulation

**MATHEMATICALLY-DERIVED.** Let $H_q$ denote query heads, $H_{kv}$ KV heads, $d_k,d_v$ their key and value dimensions, and $d_{\mathrm{model}}$ residual width. For equal contiguous groups, require $H_q$ divisible by $H_{kv}$ and define $g=H_q/H_{kv}$. With zero-based head index $i$,

$$
j(i)=\lfloor i/g\rfloor,\qquad
a_{i,s}=
\frac{\exp(q_i^\top k_{j(i),s}/\sqrt{d_k})}
{\sum_{u\in\mathcal A}\exp(q_i^\top k_{j(i),u}/\sqrt{d_k})},
\qquad
o_i=\sum_{s\in\mathcal A}a_{i,s}v_{j(i),s}.
$$
*(Eq. 14.1)*

where $\mathcal A$ is the nonempty visible-key set for the query. Masks, positional transformations, and score biases must be identical when testing two implementations of this expression.

**MATHEMATICALLY-DERIVED.** For bias-free Q, K, V and output projections,

$$
N_{\mathrm{attn}}=
d_{\mathrm{model}}
\left[H_q(d_k+d_v)+H_{kv}(d_k+d_v)\right].
$$
*(Eq. 14.2)*

where the first bracketed term combines Q and output projection sizes, and the second combines K and V. Output projection maps the concatenated $H_qd_v$ values to residual width. Setting $d_k=d_v=d_h$ recovers $2d_{\mathrm{model}}d_h(H_q+H_{kv})$.

**MATHEMATICALLY-DERIVED.** Uniform, unquantized logical state for $B$ sequences of cached length $S$ over $L$ layers is

$$
M_{\mathrm{KV}}=LBSH_{kv}(d_k+d_v)b.
$$
*(Eq. 14.3)*

where $b$ is bytes per stored scalar. This counts one logical copy of K and V, excluding page rounding, metadata, scales, replicas, workspace, and allocator reserve. Heterogeneous lengths or layers require a sum instead of a homogeneous product.

**MATHEMATICALLY-DERIVED.** For one new query per sequence, attention's QK and AV matrix arithmetic is

$$
F_{\mathrm{decode,attn}}=2LBSH_q(d_k+d_v).
$$
*(Eq. 14.4)*

where multiply-add contributes two FLOPs. Projection, softmax, masking, positional work, and cache writes are excluded. Dividing Eq. 14.4 by Eq. 14.3 gives $2H_q/(bH_{kv})$ FLOPs per logical cache byte read once. This is a reuse model, not achieved arithmetic intensity.

~~~figure
id: fig-14.3
kind: calculator
title: KV-head sharing and logical cache bytes
caption: Eq. 14.3 counts one logical unquantized cache copy for an illustrative configuration, excluding allocation and replication.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: MHA, variables: {Hkv: 32}, note: "32 independent KV heads give 4 GiB for the declared fixture."}
  - {anchor: mechanism, label: GQA, variables: {Hkv: 8}, note: "Eight KV heads reduce logical cache capacity to 1 GiB."}
  - {anchor: siblings, label: MQA, variables: {Hkv: 1}, note: "One KV head gives 128 MiB; query-head arithmetic is not reduced by the same factor."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-14.3
alt: With 32 layers, one sequence, 8192 cached tokens, 128-dimensional keys and values, and two-byte storage, 32 KV heads occupy 4 GiB, eight occupy 1 GiB, and one occupies 128 MiB.
spec:
  tex: M=2LBSH_{kv}d_hb
  equation: "14.3"
  inputs:
    - {symbol: L, label: layers, default: 32, min: 1, max: 128, format: integer}
    - {symbol: B, label: sequences, default: 1, min: 1, max: 64, format: integer}
    - {symbol: S, label: cached tokens, default: 8192, min: 1, max: 131072, format: tokens}
    - {symbol: Hkv, label: KV heads, default: 32, min: 1, max: 32, options: [1, 2, 4, 8, 16, 32], format: integer}
    - {symbol: dh, label: equal key and value width, default: 128, min: 16, max: 512, format: integer}
    - {symbol: b, label: bytes per scalar, default: 2, min: 1, max: 4, options: [1, 2, 4], format: integer}
  outputs:
    - {symbol: M, label: logical cache, formula: 2*L*B*S*Hkv*dh*b, format: bytes}
~~~

## Mechanism

**MATHEMATICALLY-DERIVED.** The calculator's fixed query-head count is 32. Under its baseline dimensions, MHA, eight-head GQA, and MQA require respectively 4 GiB, 1 GiB, and 128 MiB of logical cache. These are constructed tensor capacities, not named-model measurements. At fixed $H_q$, each query still compares with every visible key position; Eq. 14.4 therefore stays constant across the three configurations.

**DERIVED.** A kernel can exploit sharing by keeping a KV tile available while processing several associated queries. If it instead expands KV data into one physical copy per query head, the persistent cache may remain compact while transient storage or traffic grows. If separate head groups independently reload the same tile, reduced logical bytes still need not produce the ideal traffic reduction. Storage, transfer, and reuse are three distinct quantities.

~~~figure
id: fig-14.4
kind: diagram
title: Four queries sharing two KV projections
caption: This illustrative group map preserves four query-specific distributions while storing two key/value representations.
placement: inline
evidence: DERIVED
source: DERIVED:eq-14.1
alt: Query heads zero and one read KV group zero. Query heads two and three read KV group one. Each query keeps a separate attention output.
spec:
  direction: LR
  nodes:
    - {id: q0, kind: tensor, label: query 0}
    - {id: q1, kind: tensor, label: query 1}
    - {id: q2, kind: tensor, label: query 2}
    - {id: q3, kind: tensor, label: query 3}
    - {id: kv0, kind: memory, label: KV group 0}
    - {id: kv1, kind: memory, label: KV group 1}
  edges:
    - {from: kv0, to: q0, kind: dependency}
    - {from: kv0, to: q1, kind: dependency}
    - {from: kv1, to: q2, kind: dependency}
    - {from: kv1, to: q3, kind: dependency}
~~~

**DERIVED.** Representation changes must be evaluated independently of reuse. Two query heads sharing a value projection can recover different weighted summaries but cannot request two independently learned value bases from that shared group. The task objective may stay unchanged while the feasible parameterization shrinks. Neither this constraint nor the cache ratio proves a particular quality difference.

**DERIVED.** Distributed placement complicates the count further. A logical KV head may be replicated across ranks when the parallel execution requires it. A per-rank allocator report must include that placement rather than dividing the global formula by the number of devices automatically. Query-head partitioning, KV-head ownership, and collective operations must be recorded separately; communication savings cannot be inferred from the local shape alone.

## Algorithm

**DERIVED — proposed bounded audit.**

~~~text
Algorithm 14.1 — Reconcile grouped attention state
INPUT: head map, dimensions, layer shapes, sequence lengths, dtype, placement
OUTPUT: Result(logical and physical ledgers, invalid configuration)
STATE: unique tensor-owner registry and bounded shape records
INVARIANT: every query head resolves to exactly one valid KV group
1. Validate positive dimensions, head divisibility and the declared head map.
2. Count projection parameters independently from tensor shapes.
3. Enumerate each sequence/layer's valid K and V elements.
4. Reconcile logical owners with physical shards, aliases and replicas.
5. Compare grouped outputs with an explicit repeated-KV reference on a tiny fixture.
6. Record temporary expansion separately from the persistent cache.
7. Return counts, numerical discrepancies and unresolved backend behavior.
~~~

**DERIVED — complexity.** Shape accounting is $O(LB+H_q)$ for homogeneous per-layer heads. Sorting fixed-width tensor-owner IDs adds $O(n\log n)$ comparisons for $n$ allocations. The tiny numerical oracle costs $O(BSH_q(d_k+d_v))$ for single-query decode. It is bounded explicitly; a production implementation should not expand the persistent cache simply to mimic the oracle.

## Implementation

**OFFICIAL-DOCUMENTATION — [R14.5](references.md#r145).** PyTorch's inspected 2.14 attention interface exposes GQA and documents its head constraints. PyTorch occupies *Model / autograd framework*. **OFFICIAL-DOCUMENTATION — [R14.8](references.md#r148).** FlashAttention documents fewer KV heads than query heads and an integral head ratio; its layer is *Kernels / numerics / collectives*.

**DERIVED.** Hugging Face Transformers, at *Model definition / adaptation*, supplies a cache-object boundary [R14.6](references.md#r146). A cache class does not establish whether an attention backend repeats heads or reuses loaded tiles. Pin the model configuration, package version, operator arguments, and selected dispatch before attributing memory or speed to GQA.

**DERIVED.** Parameter savings can also change optimizer state during training, but persistent inference KV savings are not training-activation savings. Teacher-forced training retains or recomputes intermediate tensors across many query positions. Quantization adds a further representation choice with scales and error; it must not be folded into the head-sharing factor.

## Experimental design

**PROPOSAL — no runtime measurements reported.**

### Experiment 14.1 — Sharing without hidden replication

- **Hypothesis:** logical KV bytes scale with KV heads while realized traffic depends on kernel reuse and placement.
- **Setup:** compare MHA, GQA and MQA fixtures with fixed query heads and key/value dimensions.
- **Independent variables:** KV-head count, context length, batch size and backend.
- **Controlled variables:** masks, query tensors for numerical checks, dtype, device and measured phase.
- **Dataset/workload:** bounded synthetic tensors for equivalence; separately versioned language tasks for trained-model comparisons.
- **Hardware:** record accelerator, memory, topology, driver and runtime at execution.
- **Metrics:** logical bytes, allocated bytes, repeated-head temporaries, attention error, HBM traffic and decode latency.
- **Baselines:** explicit repeated-KV mathematical oracle and a backend with verified grouped support.
- **Expected result:** analytic capacities match the tensor inventory; no universal latency or quality ratio is predicted.
- **Ablation:** force transient KV expansion to distinguish storage from execution.
- **Interpretation:** architectural quality requires trained or adapted checkpoints; kernel equivalence uses identical mathematical tensors.
- **Threats to validity:** hidden replication, changed total parameters, unequal training budgets and unspecified masks.

## Observations

**What the paper claims.** **PAPER-REPORTED — R14.1, R14.2.** Shared KV projections target decoding cost; GQA offers an intermediate grouping and an adaptation study.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Eq. 14.3 decreases with $H_{kv}$ while Eq. 14.4 holds $H_q$ fixed.

**What we infer.** **DERIVED.** Cache capacity and decode arithmetic require separate ledgers.

**What remains unknown.** **UNVERIFIED.** Quality, actual transfers and latency require the proposed controlled execution.

## Failure modes

~~~figure
id: fig-14.5
kind: stat-panel
title: Three quantities that must reconcile
caption: The cache equation excludes transient expansion and device replication; the runtime audit must restore those terms.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-14.3
alt: Logical KV state counts unique tokens and heads. Physical state includes allocation and replication. Traffic counts actual transfers and reuse.
spec:
  header: KV AUDIT
  rows:
    - {key: logical state, value: unique KV elements}
    - {key: physical state, value: allocation plus replicas}
    - {key: traffic, value: measured transfers}
~~~

> **Failure mode — expanded cache.** **DERIVED.** *Symptom:* bytes scale with query heads despite GQA configuration. *Cause:* permanent expansion or replication. *Detection:* inspect physical tensor owners. *Mitigation:* preserve compact ownership and use a compatible grouped operator.

> **Failure mode — incorrect grouping.** **DERIVED.** *Symptom:* valid shapes but wrong outputs. *Cause:* a different query-to-KV map. *Detection:* distinct sentinel values per KV group. *Mitigation:* serialize and test the head map.

## Siblings

**DERIVED.** MQA minimizes independent KV groups; GQA relaxes that constraint; MHA restores independent projections. [Latent attention](14-2-latent-attention.md) changes the cached representation rather than merely the group count. [Sparse attention](14-3-sparse-and-local-attention.md) changes which positions are read and may retain every KV entry. These interventions can compose, but their savings cannot be multiplied without checking the combined layout.

## Extensions

**DERIVED.** Unequal group assignments are mathematically possible through an explicit map, but the inspected equal-group interfaces do not establish support for them. Cross-attention can share KV heads over source states independently of decoder self-attention. Any asymmetric key/value width requires the general $(d_k+d_v)$ form, not an unexplained factor of two.

## Limitations

**DERIVED.** Cache capacity is necessary for admission but insufficient for serving performance. Weight reads, projections, collectives, cache writes and scheduling remain. Energy and monetary cost require measured resource occupancy and an explicit accounting boundary; no conversion from logical bytes alone is valid.

## Reproducibility

**DERIVED.** Retain dimensions, group map, unique parameter inventory, per-layer cache shapes, sequence lengths, padding, dtype, quantization metadata, rank placement and temporary lifetimes. Record the exact operator and package revision before treating an API-level support statement as a reproduced execution.

## References

[R14.1](references.md#r141); [R14.2](references.md#r142); [R14.5](references.md#r145); [R14.6](references.md#r146); [R14.8](references.md#r148).
