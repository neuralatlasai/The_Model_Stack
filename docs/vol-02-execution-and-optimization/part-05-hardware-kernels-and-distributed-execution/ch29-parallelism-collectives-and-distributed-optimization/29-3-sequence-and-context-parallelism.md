---
id: ms.section.29.3
entity_type: section
title: Sequence and context parallelism
short_title: Sequence and context parallelism
volume: 2
part: 5
chapter: 29
section: 29.3
slug: 29-3-sequence-and-context-parallelism
parent: ms.chapter.29
prev_sibling: ms.section.29.2
next_sibling: ms.section.29.4
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

# 29.3 — Sequence and context parallelism

## Scope

[DERIVED] This section owns activation partitioning versus distribution of attention context, their communication obligations, document masks, and load models. Names such as sequence parallelism and context parallelism are framework-dependent; the authoritative specification is the placement of each tensor and the attention dependency relation. The correctness target is an unchanged declared attention mask and global gradient. The six-section chapter restricts primary disclosures to 2025-12-01–2026-10-09 and does not redate older mechanisms.

## Why this exists

[MATHEMATICALLY-DERIVED] Splitting weights does not necessarily reduce all token-dependent activations. A local normalization or residual operation may retain a complete sequence even though neighboring GEMMs use tensor shards. Sharding those activation positions reduces replicated storage. Attention adds a stronger dependency: the output at a query position can require keys and values owned by other ranks. Partitioning positions alone does not specify how that dependency is satisfied.

[PAPER-REPORTED] FlashCP uses document-aware placement and selective KV exchange to avoid communication that the declared document mask does not require. Its heuristic balances whole-document placement against splitting long documents. [R29.5], §3.2–3.4. HyDra instead targets dynamic context degrees and computation imbalance at production scale. [R29.6], §3–5. These eligible 2026 disclosures show that equal token counts are not a sufficient universal scheduling objective.

[DERIVED] A claim of “exact context parallelism” must state exactness relative to which mask. Preventing cross-document attention can reduce work, but compared with an unmasked packed sequence it changes the operator. The proper reference is an unpartitioned execution of the same document-aware mask. A padding or packing improvement cannot be attributed entirely to distributed communication if it also removes attention edges.

## Intuition

[MATHEMATICALLY-DERIVED] Position-local operators can compute independently on token shards. Attention can instead communicate remote KV blocks to query owners, redistribute sequence and head dimensions, or use a combination. Each method preserves a different intermediate representation. A common mistake is to equate an activation storage partition with a complete distributed attention algorithm; the latter needs a normalization-preserving aggregation rule.

[MATHEMATICALLY-DERIVED] Causal attention also makes contiguous equal-length query shards unequal in arithmetic. Early positions attend few keys and late positions many keys. Document boundaries modify that relation again. A rank receiving many short independent documents can have the same token count as a rank receiving one long document while performing much less attention arithmetic. Scheduling should model permitted query-key pairs, not just tokens.

## Formulation

| Symbol | Meaning | Shape / unit |
|---|---|---|
| $S$ | Sequence positions in the logical packed sample | Tokens |
| $c$ | Context-parallel degree | Count |
| $H_q,H_{kv},d_h$ | Query heads, KV heads, head dimension | Counts |
| $\mathcal Q_r,\mathcal K_r$ | Query and KV position sets owned by rank $r$ | Index sets |
| $\mathcal A(i)$ | Permitted keys for query $i$ | Index set |
| $m_i,l_i,u_i$ | Running maximum, exponential sum, weighted-value numerator | Scalar, scalar, vector |
| $F_r$ | Attention pair work assigned to rank $r$ | Query-key pairs |

[MATHEMATICALLY-DERIVED] For query vector $q_i$ and permitted scores $s_{ij}=q_i^{\mathsf T}k_j/\sqrt{d_h}$, define

$$
o_i=\frac{\sum_{j\in\mathcal A(i)}e^{s_{ij}}v_j}
{\sum_{j\in\mathcal A(i)}e^{s_{ij}}},\qquad
F_r=H_q\sum_{i\in\mathcal Q_r}|\mathcal A(i)|.
$$

*(Eq. 29.7)*

[DERIVED] The pair count is a work proxy, not a measured kernel duration. Head dimension, tile utilization, document fragmentation, sparse index overhead, and device occupancy also matter. Model parameters are replicated across the context group unless another axis shards them. Their gradients must include contributions from all participating token positions exactly once.

## Mechanism

### Activation sharding and complete-context ownership

[DERIVED] In the activation-partitioning usage of “sequence parallelism,” token-local tensors remain sharded between tensor-parallel operators, reducing replicated normalization, dropout, or residual storage. The adjacent operators may gather or redistribute these tensors. In the context-distribution usage, each rank owns queries for a subset of positions throughout attention and must obtain all permitted remote information. A system can use both. The terms are labels for placements; record the tensor shapes before and after every collective.

[MATHEMATICALLY-DERIVED] For a simple ring that circulates every KV block to every query owner, each rank initially stores $2(S/c)H_{kv}d_hb$ KV bytes. Forward sent traffic per rank is

$$
V_{\rm KV}=2\frac{c-1}{c}SH_{kv}d_hb.
$$

*(Eq. 29.8)*

[DERIVED] This excludes query/output tensors, metadata, backward communication and temporary double buffers. It overcounts if the mask permits omission of some blocks and underdescribes layouts that redistribute heads. A replicated-KV all-gather can have the same ideal payload count but a different live-memory peak and overlap structure. Equal bytes do not imply equal time because dependencies and resource contention differ.

### Normalization-preserving block merge

[MATHEMATICALLY-DERIVED] Let a previous set of keys have stable summaries $(m,l,u)$, where $l=\sum_j e^{s_j-m}$ and $u=\sum_j e^{s_j-m}v_j$. A disjoint block has summaries $(\widehat m,\widehat l,\widehat u)$. Their union is

$$
\begin{aligned}
m'&=\max(m,\widehat m),\\
l'&=e^{m-m'}l+e^{\widehat m-m'}\widehat l,\\
u'&=e^{m-m'}u+e^{\widehat m-m'}\widehat u,\qquad o=u'/l'.
\end{aligned}
$$

*(Eq. 29.9)*

[MATHEMATICALLY-DERIVED] The proof multiplies both block numerators and denominators by their factors converting from local maxima to $m'$. Every included term becomes $e^{s_j-m'}$, so the normalized union equals Eq. 29.7 in real arithmetic. Finite precision and merge order can change rounding; dropout additionally requires a placement-independent mapping from logical attention indices to random draws. An empty permitted set needs a declared convention rather than division by zero.

```figure
id: fig-29.7
kind: matrix
title: Attention dependencies across context owners
caption: An illustrative eight-position causal mask shows why equal contiguous query shards have unequal pair counts. Sharding storage does not remove the permitted cross-rank attention dependencies.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.7
alt: The lower-triangular eight-by-eight matrix contains one permitted key in its first row and eight in its last. The last four queries therefore contain more attention pairs than the first four.
spec:
  rows: 8
  cols: 8
  pattern: causal
  rowLabel: Query position
  colLabel: Key position
  rowTicks: ['0', '1', '2', '3', '4', '5', '6', '7']
  colTicks: ['0', '1', '2', '3', '4', '5', '6', '7']
  highlight: [{row: 7, col: 0}, {row: 7, col: 3}]
  legend: Permitted pairs remain dependencies across device boundaries
```

### Document-aware load

[MATHEMATICALLY-DERIVED] Independent causal documents of lengths $s_1,\ldots,s_J$ contain

$$
F=H_q\sum_{j=1}^{J}\frac{s_j(s_j+1)}2.
$$

*(Eq. 29.10)*

[MATHEMATICALLY-DERIVED] For fixed total tokens, fewer longer documents increase pair work. A single length-$2a$ document contains $a^2$ more causal pairs than two length-$a$ documents. Whole-document placement can eliminate cross-rank KV dependencies for those documents, but an extremely long document may require splitting for capacity or load. A planner must satisfy token capacity and computation balance simultaneously, not optimize one proxy and assume the other follows.

```figure
id: fig-29.8
kind: calculator
title: Equal tokens and unequal attention work
caption: Compare one causal document with equally sized independent documents at the same total token count. The calculation is an illustrative pair count, not a benchmark or a claim about kernel speed.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.10
alt: A fixed number of tokens split into more independent documents has fewer causal query-key pairs. The ratio approaches the document count for long equally sized documents.
spec:
  tex: F=J\,(S/J)(S/J+1)/2
  equation: '29.10'
  inputs:
    - {symbol: S, label: Total tokens, default: 32768, min: 1024, max: 262144, scale: log2, format: tokens}
    - {symbol: J, label: Equal independent documents, default: 8, min: 1, max: 32, options: [1, 2, 4, 8, 16, 32], format: integer}
  outputs:
    - {symbol: F, label: Pairs per head, formula: J*(S/J)*(S/J+1)/2, format: si, emphasis: true}
    - {symbol: R, label: Single-document work ratio, formula: (S*(S+1)/2)/(J*(S/J)*(S/J+1)/2), format: fixed2}
```

## Algorithm

**Algorithm 29.3 — Exact-mask distributed block attention.** [MATHEMATICALLY-DERIVED] Inputs are local queries, a complete partition of permitted KV blocks, the declared logical mask, and stable accumulator precision. Output is the local attention result. This is an explanatory algorithm, not a claim that a cited runtime uses precisely this ordering.

$$
\begin{aligned}
1.\quad &(m_i,l_i,u_i)\gets(-\infty,0,0),\quad\mathcal V_i,\mathcal W_i\gets\varnothing.\\
2.\quad &\mathcal B\gets\operatorname{nextBlock}(i;\mathcal W_i).\\
3.\quad &\mathcal B=\varnothing\Rightarrow\operatorname{goto}(7).\\
4.\quad &\mathcal W_i\gets\mathcal W_i\cup\{\operatorname{id}(\mathcal B)\};\quad\mathcal P_i\gets\mathcal B\cap\mathcal A(i);\quad\mathcal P_i=\varnothing\Rightarrow\operatorname{goto}(2).\\
&\mathcal P_i\cap\mathcal V_i\ne\varnothing\Rightarrow\operatorname{return}(\bot,\mathrm{duplicate});\quad
(\widehat m_i,\widehat l_i,\widehat u_i)\gets\operatorname{maskedSummary}(q_i,K_{\mathcal P_i},V_{\mathcal P_i}).\\
5.\quad &(m_i,l_i,u_i)\gets\operatorname{merge}_{29.9}
((m_i,l_i,u_i),(\widehat m_i,\widehat l_i,\widehat u_i));\quad
\mathcal V_i\gets\mathcal V_i\cup\mathcal P_i.\\
6.\quad &\operatorname{goto}(2).\\
7.\quad &\mathcal V_i\ne\mathcal A(i)\Rightarrow\operatorname{return}(\bot,\mathrm{coverage}).\\
8.\quad &l_i>0\Rightarrow o_i\gets u_i/l_i;\quad
l_i=0\Rightarrow o_i\gets\operatorname{emptyMaskConvention}(i).
\end{aligned}
$$

[DERIVED] The invariant is that the summary covers each visited permitted key exactly once. Termination follows a finite block set and monotone visitation. The finite block iterator records visited block identities in $\mathcal W_i$, while $\mathcal V_i$ records only mask-permitted key identities. A physical block can straddle a mask boundary; adding its unpermitted keys to the coverage set would incorrectly reject a valid masked execution. A block containing no permitted key is skipped rather than merging negative infinities. Repeated blocks silently overweight keys; missing blocks change the model. Backward must implement derivatives of the same logical operation, including remote KV contributions and any loss normalizer.

## Implementation

[OFFICIAL-DOCUMENTATION] Megatron-Core 0.19.0 documents context-parallel and packed-sequence support for DeepSeek Sparse Attention and inter-document masking metadata in its release. [R29.2], model-support and dataset bullets. This establishes named release features, not arbitrary compatibility across kernels or mask layouts.

[DERIVED] NVIDIA Megatron-Core is the **Distributed training** layer, while local attention kernels and NVIDIA NCCL operations occupy **Kernels / numerics / collectives**. Define whether a group circulates KV, gathers it, or transposes sequence/head ownership. Record global position IDs, document boundaries, local sequence offsets, grouped-query head ownership, and gradient reduction groups. A CP degree constrained by head count in one redistribution is not a universal bound on all CP algorithms.

```figure
id: fig-29.9
kind: systems-trace
title: Context block coverage and lifetime
caption: The correctness boundary is the set of permitted keys covered by each query. Communication completion, mask filtering and stable normalization are separate operations with separate failure signatures.
evidence: DERIVED
source: DERIVED:eq-29.9
alt: Query owners obtain remote KV blocks, apply the declared mask, merge stable summaries, release the block after consumption and return locally owned outputs. Missing or duplicate key coverage is a correctness failure.
spec:
  columns: [compute, memory, communication, failure]
  stages:
    - {name: Place queries, values: {compute: Local token operators, memory: Query shard, communication: Declared layout conversion, failure: Global position IDs changed}}
    - {name: Obtain KV block, values: {compute: Await dependency, memory: Current and incoming KV buffers, communication: Ring or selective transfer, failure: Read before completion}}
    - {name: Mask and summarize, values: {compute: Permitted query-key products, memory: Stable partial summary, communication: Optional next-block transfer, failure: Cross-document leakage}}
    - {name: Merge, values: {compute: Equation 29.9, memory: Running maximum and numerator, communication: None required by merge, failure: Duplicate or missing keys}}
    - {name: Backward, values: {compute: Derivative of same logical mask, memory: Declared saved statistics, communication: Remote KV-gradient contributions, failure: Context gradients omitted}}
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] FlashCP evaluates on one eight-H100-SXM-80GB node with NVLink, using WLB-LLM, Pile and RedPajama document distributions; it compares ring, zigzag, Llama3-style and per-document baselines. Its 128K-context attention experiments vary head count and use head dimension 128. [R29.5], §4.1–4.2 and Fig. 5. Those boundaries do not establish multi-node performance.

[PAPER-REPORTED] HyDra evaluates a 512-GPU testbed and a separate 2,048-GPU production setting, with dynamic-degree and static-context baselines. It reports load, scheduler, bubble and throughput comparisons rather than token balance alone. [R29.6], §6.1–6.4. This manuscript does not independently validate the disclosed production measurements or extrapolate their gains.

### Proposed verification

[ASSUMED] Hold tokens and attention edges fixed while varying document-length distribution and context degree. Compare output/gradients against the same mask on one logical device, with dropout disabled before a deterministic RNG test. Record permitted-pair counts, per-rank attention time, KV payload, live buffers, and full step time. Include a long-document case and many short documents; reject a faster result that changes the mask. [verification](verification.md), Experiment 29.1, is unexecuted.

## Observations

**What the paper claims.** [PAPER-REPORTED] FlashCP reduces unnecessary KV movement through document-aware placement; HyDra balances dynamic-context execution using load rather than capacity alone. [R29.5], §3; [R29.6], §5.1–5.2.

**What the evidence shows.** [DERIVED] These are different evaluated mechanisms and scales; their measurements cannot be combined into a single universal speedup.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 29.7 and 29.10 explain why equal token counts need not imply equal attention work.

**What remains unknown.** [UNVERIFIED] Numerical parity, source-runtime compatibility and performance on the reader's fabric remain unchecked.

## Failure modes

[MATHEMATICALLY-DERIVED] Missing remote keys, duplicated ring blocks, shifted position IDs and incorrect document boundaries change the attention operator. Summing already normalized partial outputs without denominator weights is wrong. Insufficient accumulator precision can produce unstable merges. The case of an all-masked row must be specified explicitly. Token-balanced placement can still leave a compute straggler, while finer shards can reduce kernel efficiency and increase launch or metadata overhead.

## Siblings

[DERIVED] [Tensor parallelism](29-2-tensor-and-pipeline-parallelism.md) splits feature/head dimensions or matrix contractions; context distribution splits token positions. Local activation sharding removes replication for position-local work, whereas complete-context algorithms satisfy nonlocal attention edges. Selective or sparse attention changes which edges exist and belongs to the attention architecture/kernel chapters; distributing an already specified mask must preserve it.

## Extensions

[DERIVED] Hierarchical context groups can combine a sequence/head redistribution within a fast domain with remote block exchange across slower domains. Whole-document placement can avoid remote edges only where the mask permits it. Dynamic degrees add redistribution, group management, and pipeline balance concerns. Optimizing degree by memory alone omits the quadratic work term; optimizing pair counts alone omits GEMM and communication efficiency. The joint planner must retain both constraints.

## Limitations

[MATHEMATICALLY-DERIVED] Stable block merging is exact in real arithmetic for disjoint complete permitted-key sets. It does not guarantee bitwise floating-point equality or deterministic dropout. Eq. 29.8 assumes full KV circulation and excludes backward. Pair counts omit implementation-dependent kernel efficiency. No energy, monetary saving, or universal context limit follows without hardware and workload evidence. Date-eligible sources do not make their historical baseline methods newly invented.

## Reproducibility

[DERIVED] Retain mask definition, document IDs, global positions, local offsets, KV/query head layout, context groups, block visitation order, accumulation precision, RNG mapping and backward reduction groups. Pin source revisions and executable builds separately. **UNVERIFIED:** the proposed tests have not run; no book-authored output-error, timing, or capacity measurement is asserted.

## References

[R29.2](references.md#r292), Megatron-Core 0.19.0 release; [R29.5](references.md#r295), FlashCP v1 §3–4; [R29.6](references.md#r296), HyDra v1 §3–6.
