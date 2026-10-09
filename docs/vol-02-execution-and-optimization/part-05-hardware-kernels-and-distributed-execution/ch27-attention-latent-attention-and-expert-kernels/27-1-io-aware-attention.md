---
id: ms.section.27.1
entity_type: section
title: IO-aware attention
short_title: Exact attention without scores
volume: 2
part: 5
chapter: 27
section: 27.1
slug: 27-1-io-aware-attention
parent: ms.chapter.27
prev_sibling: null
next_sibling: ms.section.27.2
children: []
prerequisites: [ms.chapter.14, ms.chapter.25, ms.chapter.26]
downstream: [ms.section.27.2, ms.section.27.3, ms.section.27.4, ms.chapter.28]
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [attention, kernel_fusion, memory_traffic], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.flashattention, impl.nvidia-cutlass]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 27.1 — IO-aware attention

## Scope

[DERIVED] The operator is masked scaled dot-product attention with finite inputs and at least one admitted key per nonempty row. The baseline materializes scores and probabilities; the candidate streams tiles and retains a mergeable row state. Success means the same mathematical operator, a declared floating-point error budget, and an explicit reduction in intermediate storage. This section derives that contract independently; it does not claim online normalization was invented in the evidence window. Current implementation evidence comes from the March 2026 disclosure [R27.1](references.md#r271), §3.1.4.

## Why this exists

[MATHEMATICALLY-DERIVED] For a sequence of length $T$, a dense attention head has $T^2$ query–key pairs but only $Td_v$ output values. Storing every pair is an implementation choice, not an output requirement. If scores and probabilities both cross the device-memory boundary, the implementation moves quadratic intermediates even when the final result is linear in sequence length. Faster matrix multiplication cannot remove those writes. It can instead make their fraction of elapsed time larger.

[DERIVED] The engineering question is therefore which state is sufficient to finish one output row after visiting its keys in pieces. The answer must also serve masking, numerical stability, and backward recomputation. A description that says “fuse softmax” without defining the state is incomplete: a tile-local softmax followed by addition is generally wrong because every tile has its own denominator. The denominators must be merged before the output is interpreted.

## Intuition

> **Definition — Streaming attention merge state.** [MATHEMATICALLY-DERIVED] A shared exponent reference, exponential denominator, and weighted numerator representing a declared subset of admitted keys, with a separate empty-subset identity.

[MATHEMATICALLY-DERIVED] A row's exponential sum and weighted exponential sum share the same arbitrary shift. Store a shift $m$, a scalar denominator $\ell$, and a vector numerator $u$. Changing the shift from $m$ to $m'$ multiplies both sums by $\exp(m-m')$ and leaves $u/\ell$ unchanged. The stable streaming algorithm is repeated change of coordinates on these two sums. Its exactness follows from that identity, not from a learned approximation or a special property of a GPU.

## Formulation

| Symbol | Meaning | Shape / units |
|---|---|---|
| $Q,K,V$ | Query, key, value tensors for one head | $[T_q,d_h]$, $[T_k,d_h]$, $[T_k,d_v]$ |
| $\mathcal A_i$ | Admitted keys for query $i$ | Subset of $\{0,\ldots,T_k-1\}$ |
| $a_{ij}$ | Finite additive score bias | Dimensionless |
| $b,b_a$ | Operand and accumulator storage widths | Bytes per value |
| $M_q,M_k$ | Query and key tile extents | Tokens |
| $m_i,\ell_i,u_i$ | Running shift, normalizer, numerator | Scalar, scalar, $[d_v]$ |

[MATHEMATICALLY-DERIVED] With $s_{ij}=q_i^\mathsf T k_j/\sqrt{d_h}+a_{ij}$ on admitted pairs,

$$
o_i=\frac{\sum_{j\in\mathcal A_i}e^{s_{ij}-m_i}v_j}{\sum_{j\in\mathcal A_i}e^{s_{ij}-m_i}},\qquad
m_i=\max_{j\in\mathcal A_i}s_{ij}.
$$

*(Eq. 27.1)*

The dimensions and mask are part of the operator. The formula excludes a completely masked row: its denominator is zero, and any zero-output convention must be stated separately. Padding keys do not become valid because their stored values happen to be zero.

## Mechanism

### Stable state and merge proof

[MATHEMATICALLY-DERIVED] For disjoint admitted key subsets $A$ and $B$, write their states $(m_A,\ell_A,u_A)$ and $(m_B,\ell_B,u_B)$. Then

$$
\begin{aligned}
m&=\max(m_A,m_B),\\
\ell&=e^{m_A-m}\ell_A+e^{m_B-m}\ell_B,\\
u&=e^{m_A-m}u_A+e^{m_B-m}u_B,\qquad o=u/\ell.
\end{aligned}
$$

*(Eq. 27.2)*

Expanding $u_A$ and $u_B$ substitutes one common shift into every term of Eq. 27.1. This proves equality in real arithmetic and permits a sequential scan or a reduction tree. It does not prove bitwise equality between those orders in floating point. An empty subset is an identity state; implementations must branch around expressions such as $(-\infty)-(-\infty)$ rather than relying on their numerical evaluation.

[DERIVED] Retaining an unnormalized $u$ avoids dividing a vector after every tile. A normalized partial output is equally sufficient if its log-normalizer accompanies it; §27.3 derives that alternative. Keeping only normalized outputs discards the information required to combine partitions. This is the central interface requirement for any split attention implementation.

```figure
id: fig-27.1
kind: diagram
title: Streaming row state
caption: A key tile contributes a shifted denominator and numerator. Only the merged state survives to the next tile; the quadratic score array is never an output.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.2
alt: Query and a key-value tile produce local scores and a local row state. A merge combines this with the running state. The final numerator divided by the denominator gives the output.
spec:
  direction: LR
  nodes:
    - {id: q, kind: tensor, label: Query tile, sub: '[Mq, dh]'}
    - {id: kv, kind: memory, label: Key-value tile, sub: '[Mk, dh] and [Mk, dv]'}
    - {id: local, kind: process, label: Mask and local sums}
    - {id: state, kind: state, label: Merge running state, sub: 'm, ell, u', emphasis: true}
    - {id: out, kind: tensor, label: Normalize once, sub: '[Mq, dv]'}
  edges:
    - {from: q, to: local}
    - {from: kv, to: local}
    - {from: local, to: state, kind: emphasis}
    - {from: state, to: out}
```

### Tile residency and traffic boundary

[MATHEMATICALLY-DERIVED] An illustrative resident allocation needs query, key, and value tiles, score scratch, and a row state. A conservative capacity condition for one buffering stage is

$$
b\{M_qd_h+M_k(d_h+d_v)\}+b_a\{M_qM_k+M_q(d_v+2)\}\leq M_{\rm local}.
$$

*(Eq. 27.3)*

Here $M_{\rm local}$ is an analytical byte budget, not a specification for a named accelerator. Real layouts can keep pieces in registers or tensor memory, alias buffers, double-buffer operands, or avoid a full score tile. Those changes alter the capacity inequality and instruction schedule; they do not change Eq. 27.2. A tile that fits one storage class can still spill another, so aggregate capacity alone is insufficient.

[MATHEMATICALLY-DERIVED] For square dense attention with $B$ sequences and $H_q$ query heads, one materialized score copy occupies

$$
M_{\rm scores}=BH_qT^2b_s,\qquad
F_{\rm fwd}=2BH_qT^2(d_h+d_v).
$$

*(Eq. 27.4)*

The FLOP expression counts two multiply-accumulate operations per dot-product term, and excludes softmax, masks, projection layers, and padding. Streaming removes the score allocation; it does not remove the dense pair count. Tiling can reread K/V for multiple query tiles. Consequently “linear auxiliary storage” does not mean “each operand is read once.” Cache reuse and tile order decide the physical traffic.

```figure
id: fig-27.2
kind: calculator
title: Materialized score storage
caption: Illustrative dimensions, not a named model. This evaluates one score copy in Eq. 27.4; probabilities, gradients, operands, and allocator overhead are excluded.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.4
alt: Change batch, query heads, sequence length, or score width to inspect quadratic score storage. At one sequence, 32 heads, 8192 tokens, and two bytes per score the result is 4 GiB.
spec:
  tex: M_{\rm scores}=BH_qT^2b_s
  equation: '27.4'
  inputs:
    - {symbol: B, label: sequences, default: 1, min: 1, max: 32, format: integer}
    - {symbol: Hq, label: query heads, default: 32, min: 1, max: 128, format: integer}
    - {symbol: T, label: tokens, default: 8192, min: 512, max: 131072, scale: log2, format: tokens}
    - {symbol: bs, label: bytes per score, default: 2, min: 2, max: 4, options: [2, 4], format: bytes}
  outputs:
    - {symbol: M, label: one score copy, formula: B*Hq*T^2*bs, format: bytes, emphasis: true}
```

### Causality and backward recomputation

[MATHEMATICALLY-DERIVED] A causal row admits $j\leq p_i$, where $p_i$ is the query's absolute position in its sequence. For a chunk appended to an existing cache, $p_i$ includes the cached prefix. Using the local chunk index instead silently drops valid prefix keys. Entirely future tiles can be skipped; the diagonal tile requires an elementwise mask. For square causal self-attention the admitted pair count is $T(T+1)/2$, so replacing $T^2$ by that count gives exact algorithmic pair accounting before padded-tile effects.

```figure
id: fig-27.3
kind: matrix
title: Causal boundary inside a tile
caption: Filled cells are admitted pairs, not measured GPU work. A tiled implementation can skip future tiles but still needs an elementwise decision at the diagonal.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-27.1
alt: An eight by eight causal matrix admits column j when j is no greater than row i. There are 36 admitted pairs and 28 excluded pairs.
spec:
  rows: 8
  cols: 8
  pattern: causal
  rowLabel: absolute query position
  colLabel: absolute key position
  highlight: [{row: 4, col: 4}]
  legend: 'Filled = j <= i; elementwise masking remains on the diagonal'
```

[MATHEMATICALLY-DERIVED] Given output derivative $G$, a tile can reconstruct $P_{ij}=\exp(s_{ij}-\mathrm{LSE}_i)$ from stored row log-normalizers. Set $D_i=\sum_r G_{ir}O_{ir}$ and obtain

$$
\begin{aligned}
dV&=P^\mathsf TG,\quad dP=GV^\mathsf T,\quad dS_{ij}=P_{ij}(dP_{ij}-D_i),\\
dQ&=dSK/\sqrt{d_h},\qquad dK=dS^\mathsf TQ/\sqrt{d_h}.
\end{aligned}
$$

*(Eq. 27.5)*

The softmax Jacobian gives the middle identity; $D_i=\sum_jP_{ij}dP_{ij}$ follows by substituting $O_i=\sum_jP_{ij}V_j$. Recomputing scores trades extra dot products for avoiding a stored probability matrix. Dropout requires reproducing the same mask and scaling, with random-counter ownership defined across tile orders. Otherwise the backward pass differentiates a different sampled operator.

## Algorithm

### Algorithm 27.1 — Bounded masked row scan

[MATHEMATICALLY-DERIVED] Inputs are $q_i$, K/V tiles, the absolute-position mask, and finite admitted biases. Output is $(o_i,\mathrm{LSE}_i)$ or a typed empty-row result. State is initialized and advanced as follows:

$$
\begin{aligned}
1.&\quad (m,\ell,u,\mathrm{valid})\leftarrow(-\infty,0,0,\mathrm{false}).\\
2.&\quad A_j\leftarrow\mathcal A_i\cap\text{tile}_j;\quad A_j=\varnothing\Rightarrow\text{continue}.\\
3.&\quad s\leftarrow q_iK_{A_j}^{\mathsf T}/\sqrt{d_h}+a_{i,A_j};\quad m_j\leftarrow\max s.\\
4.&\quad (\ell_j,u_j)\leftarrow\left(\sum e^{s-m_j},\sum e^{s-m_j}v\right).\\
5.&\quad \mathrm{valid}=\mathrm{false}\Rightarrow(m,\ell,u)\leftarrow(m_j,\ell_j,u_j);\\
 &\quad \mathrm{valid}=\mathrm{true}\Rightarrow(m,\ell,u)\leftarrow\mathrm{merge}_{27.2}(m,\ell,u;m_j,\ell_j,u_j).\\
6.&\quad \mathrm{valid}\leftarrow\mathrm{true};\quad\text{advance to the next finite tile}.\\
7.&\quad \neg\mathrm{valid}\Rightarrow\text{return declared empty-row convention};\\
 &\quad\text{otherwise return }(u/\ell,m+\ln\ell).
\end{aligned}
$$

[DERIVED] The invariant is that the state represents exactly the union of admitted keys already visited, in real arithmetic. Termination occurs after $\lceil T_k/M_k\rceil$ tiles. Work is $O(T_k(d_h+d_v))$ per query row; running state is $O(d_v)$ plus tile scratch. Nonfinite inputs, invalid addresses, and inconsistent sequence metadata reject the call rather than being repaired by normalization.

## Implementation

[PAPER-REPORTED] FlashAttention-4 implements a hardware-specific realization of streamed attention and conditional normalization. [R27.1](references.md#r271), §§3.1–3.2. **FlashAttention** and **NVIDIA CUTLASS** occupy *Kernels / numerics / collectives*. No installed binary was tested here.

[DERIVED] Map query rows to owners, stage K/V tiles, compute scores, apply masks before maxima, reduce row state, and write output and log-normalizer. Each buffer needs producer-completion and consumer-release conditions. A barrier proves availability only for its documented participants and scope. Profiling must separate score scratch, spills, shared-memory traffic, and HBM transactions: eliminating one intermediate does not establish that all four improve.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R27.1 §5 evaluates masked/unmasked BF16 attention over sequence and head shapes; Appendix A.1 describes warm-up and repeated timing. Its hardware/year disclosures conflict with the main text. See the exact audit in [references](references.md#r271). We use no transported speedup number. This section's algebra is not an independent replication of those experiments.

## Observations

**What the paper claims.** [PAPER-REPORTED] R27.1 §3.1.4 describes a streaming normalization implementation; its implementation claims are version-specific.

**What the evidence shows.** [DERIVED] The inspected source supports a concrete implementation direction. It does not establish the candidate's correctness on the reader's masks, dtype, or installed release.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 27.2 proves real-arithmetic equivalence for disjoint partitions. Eq. 27.4 proves quadratic intermediate capacity is avoidable, not that quadratic dense computation disappears.

**What remains unknown.** [UNVERIFIED] Local accuracy, realized HBM traffic, backward races, and throughput remain unmeasured. Energy and cost per operator are NOT-DISCLOSED for the proposed artifact.

## Failure modes

> **Failure mode — Empty-row NaN.** [DERIVED] *Symptom:* NaNs only at padding or unusual masks. *Cause:* subtracting two negative infinities. *Detection:* explicit all-masked fixtures. *Mitigation:* define an identity-state and empty-row branch.

> **Failure mode — Wrong chunk origin.** [DERIVED] *Symptom:* appended queries ignore prefix tokens. *Cause:* local indices used as absolute positions. *Detection:* compare chunked and unchunked calls with identical admitted pairs. *Mitigation:* pass and validate position offsets.

## Siblings

[DERIVED] [Decode splitting](27-3-decode-specialized-attention.md) changes ownership across key partitions and adds a merge; streaming prefill keeps more query rows together. [Sparse kernels](27-4-mla-and-sparse-kernels.md) change the admitted key set and therefore the operator unless sparsity was already in its definition. [Attention architectures](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/README.md) change stored state and head sharing, rather than merely the execution schedule.

## Extensions

[DERIVED] The same merge applies to ragged sequences and block masks when their admitted-pair predicate is explicit. Dropout, additive biases, and custom score transforms require separate derivative and reproducibility contracts. A successful dense kernel does not inherit those extensions automatically.

## Limitations

[DERIVED] Preserving the original operator also requires identical score transformations and output scaling. Kernel fusion cannot move a nonlinear score cap across normalization merely because both operations are elementwise before a reduction.

[MATHEMATICALLY-DERIVED] Real-arithmetic exactness excludes finite-precision ordering, quantized operands, approximate exponentials, and truncated key sets. A kernel can implement the intended dense operator within tolerance while producing different bits. A candidate failing the declared derivative or boundary tests is rejected regardless of its average latency.

## Reproducibility

[DERIVED] Retain tensor shapes and strides, absolute positions, masks, scale, dtype and accumulation dtype, row-state format, dropout seed/counter map, forward/backward error distributions, and compiled-kernel identity. The proposed [verification protocol](verification.md) was not executed. Implementation compatibility remains UNVERIFIED.

## References

[R27.1](references.md#r271), §§2.1,3.1.4,3.2,5 and Appendix A.1. Eqs. 27.1–27.5 and Algorithm 27.1 are book-derived identities under the stated conditions, not new empirical findings.
