---
id: ms.section.5.2
entity_type: section
title: Attention calculation
short_title: Attention
volume: 1
part: 1
chapter: 5
section: 5.2
slug: 05-2-attention-calculation
parent: ms.chapter.5
prev_sibling: ms.section.5.1
next_sibling: ms.section.5.3
children: []
prerequisites: [ms.section.3.2, ms.section.5.1]
downstream: [ms.section.5.5, ms.section.5.6, ms.section.14.1, ms.section.14.5, ms.section.27.1, ms.section.42.2]
related: [ms.section.15.1]
siblings_by_mechanism: [ms.section.14.1, ms.section.14.2, ms.section.14.3]
relations:
  - {type: supported_by, target: paper.P01}
  - {type: supported_by, target: paper.P19}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.flashattention}
axes:
  lifecycle: [pretraining, inference]
  mechanism: [attention]
  feedback_setting: []
  modality: [text]
papers: [P01, P19]
implementations: [impl.pytorch, impl.flashattention]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 1050
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 5.2 Attention calculation

## Scope

Objective: expand the four attention lines of the §5.1 trace — projections, scaled dot products, masking and softmax, head combination and output projection — into equations with shapes, and cost each line in parameters, FLOPs and bytes. Baseline: Eq. (1) of P01. Success criterion: the reader can state, for any (B, H, T, Dh), which attention tensor is largest and whether it must exist at all. Boundaries: head-sharing variants (MQA, GQA) belong to [§14.1](../../part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/14-1-mha-mqa-and-gqa.md); latent compression to [§14.2](../../part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/14-2-latent-attention.md); the tiled, non-materialising execution of P19 to [§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md). None of those mechanisms is explained here.

## Why this exists

What failed before attention was the fixed-size bottleneck between positions: a recurrent state of D numbers had to summarise an arbitrarily long prefix. Attention replaces the summary with a data-dependent weighted sum over all prefix positions, at the price of computing T weights per query position. PAPER-REPORTED (P01, Table 1): per-layer complexity O(n²·d) with O(1) sequential operations, versus O(n·d²) and O(n) for recurrence. The bottleneck that this introduced is the object those weights live in — an attention score matrix of T² entries per head — and the dominant constraint at long T is its bytes, not its FLOPs. What changed in later solutions (Chapter 14 and Chapter 27) is either the number of keys each query sees or whether the matrix is ever written to memory; the definition below is what they preserve or approximate.

## Intuition

Physically, attention is two batched matrix multiplications with a row-wise softmax between them. The first multiplies a `[T, Dh]` query block by a `[Dh, T]` key block, producing T² numbers from 2·T·Dh inputs; the second multiplies the T² probabilities by a `[T, Dh]` value block, producing T·Dh outputs. Arithmetic intensity therefore falls as Dh shrinks relative to T: each of the T² scores costs 2·Dh FLOPs to produce and 2 bytes to store in BF16, so at Dh = 64 the score matrix is 128 FLOPs per stored byte pair — well below the ratio at which an accelerator is compute-bound ([§25.3](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/25-3-roofline-reasoning.md)). MATHEMATICALLY-DERIVED from the shapes.

Heuristically, a query "looks up" the keys it matches; this is a reading aid and no claim about what the learned keys encode.

## Formulation

Input `n ∈ ℝ^{B×T×D}` (the normalised residual stream). Parameters per block: `W_Q, W_K, W_V, W_O ∈ ℝ^{D×D}`, with `D = H·Dh` and H = H_q = H_kv in the reference form. The additive causal mask `M ∈ ℝ^{T×T}` has `M_{ij} = 0` for `j ≤ i` and `−∞` otherwise. Local symbol: `S` is the score tensor in this section only (the global S of [notation.md](../../../front-matter/notation.md) is reserved for inference sequence length and is not used here).

> **Definition — scaled dot-product attention.** For one head, `Attn(Q, K, V; M) = softmax(QKᵀ/√Dh + M)·V`, the softmax taken over the key axis, with an additive mask M.

> **Definition — attention score matrix.** The `[B, H, T, T]` tensor `S = QKᵀ/√Dh` before masking and softmax; it is the only tensor in the reference forward pass whose size is quadratic in T.

> **Definition — multi-head attention (reference form).** H independent scaled dot-product attentions over per-head slices of Q, K, V, whose `[B, H, T, Dh]` outputs are merged to `[B, T, D]` and projected by W_O. Head-sharing forms (H_kv < H_q) are owned by §14.1.

$$
Q = n\,W_Q,\quad K = n\,W_K,\quad V = n\,W_V \;\in\; \mathbb{R}^{B\times T\times D},\qquad\text{reshaped to } [B, H, T, D_h]
$$
*(Eq. 5.4)* where the reshape splits D into H contiguous slices of Dh; no arithmetic.

$$
S_{b,h} = \frac{Q_{b,h}\,K_{b,h}^{\top}}{\sqrt{D_h}} + M \;\in\; \mathbb{R}^{T\times T}
$$
*(Eq. 5.5)* where the mask is broadcast over b and h; `−∞` entries produce exactly zero probability after softmax.

$$
P_{b,h} = \mathrm{softmax}_{\text{rows}}(S_{b,h}),\qquad C_{b,h} = P_{b,h}\,V_{b,h} \;\in\; \mathbb{R}^{T\times D_h}
$$
*(Eq. 5.6)* where the softmax is computed with the max-subtracted form of [§3.2](../ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md).

$$
a = \mathrm{merge}(C)\,W_O \;\in\; \mathbb{R}^{B\times T\times D}
$$
*(Eq. 5.7)* where merge is the inverse of the reshape in Eq. 5.4 (transpose to `[B, T, H, Dh]`, then view as `[B, T, D]`).

```figure
id: fig-5.7
kind: tensor-flow
title: Shape trace of one causal attention block
caption: >-
  Only two steps change the shape class: the score product turns
  [B, H, T, Dh] into [B, H, T, T], and P·V turns it back. Every step with a
  weight costs a multiple of D² per token; the two weight-free matmuls cost
  2·T·D each, and the two [B, H, T, T] tensors are where the bytes go.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.4", "DERIVED:eq-5.5", "DERIVED:eq-5.6", "DERIVED:eq-5.7"]
alt: >-
  Eight-step tensor trace for Eq. 5.4 to 5.7 with D = H·Dh. The normalised
  stream [B, T, D] goes through the packed QKV projection (6·D² FLOPs per
  token, 3·D² parameters) to [B, T, 3, H, Dh]; it is split and transposed
  without arithmetic into Q, K and V, [3, B, H, T, Dh]; Q·Kᵀ/√Dh plus the
  causal mask gives the scores [B, H, T, T] (2·T·D FLOPs per token, B·H·T²·b
  bytes); a max-subtracted row softmax gives the probabilities [B, H, T, T]
  (another B·H·T²·b bytes, kept for the backward pass); P·V gives the context
  [B, H, T, Dh] (2·T·D FLOPs per token); a transpose and merge gives
  [B, T, D]; and W_O (2·D² FLOPs per token, D² parameters) gives the
  attention output a, [B, T, D].
spec:
  dims: { B: "sequences", T: "positions", D: "model width, D = H·Dh", H: "heads", Dh: "head dimension" }
  steps:
    - { shape: "[B, T, D]", label: "n, normalised residual stream" }
    - { shape: "[B, T, 3, H, Dh]", label: "qkv, packed", op: "n · [W_Q W_K W_V], Eq. 5.4", cost: "6·D² FLOPs/token · 3·D² params" }
    - { shape: "[3, B, H, T, Dh]", label: "Q, K, V", op: "split + transpose, no arithmetic", cost: "3·B·T·D·b bytes" }
    - { shape: "[B, H, T, T]", label: "scores S", op: "Q·Kᵀ/√Dh + M, Eq. 5.5", cost: "2·T·D FLOPs/token · B·H·T²·b bytes" }
    - { shape: "[B, H, T, T]", label: "probabilities P", op: "row softmax, max-subtracted, Eq. 5.6", cost: "B·H·T²·b bytes, kept for backward" }
    - { shape: "[B, H, T, Dh]", label: "context C", op: "P · V, Eq. 5.6", cost: "2·T·D FLOPs/token" }
    - { shape: "[B, T, D]", label: "merge(C)", op: "transpose + merge, no arithmetic" }
    - { shape: "[B, T, D]", label: "a, attention output", op: "· W_O, Eq. 5.7", cost: "2·D² FLOPs/token · D² params" }
```

$$
M_{\text{scores}} = B\,H\,T^{2}\,b \;\text{bytes per layer, per materialised copy}
$$
*(Eq. 5.8)* where b is bytes per value; a materialised implementation holds S and P, and training retains P for the backward pass.

```figure
id: fig-5.8
kind: calculator
title: Score-matrix bytes per layer
caption: >-
  Eq. 5.8 at the §5.6 defaults (illustrative, not a named model) gives
  192 MiB per copy, and Algorithm 5.2 holds two copies, S and P. The last
  output is T/Dh: the score tensor measured in units of one [B, T, D]
  activation. Move T one notch and it doubles; the preset at T = 8192 reaches
  the 12 GiB per layer of §5.6.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.8"
alt: >-
  Calculator for Eq. 5.8, M = B·H·T²·b bytes per layer per materialised copy.
  With B = 8, H = 12, Dh = 64, T = 1024 and b = 2 (illustrative reference
  configuration, not a named model) one copy is 192 MiB, S and P together are
  384 MiB, one [B, T, D] tensor with D = H·Dh = 768 is 12 MiB, and the ratio
  is 16. Preset T = 8192 gives 12 GiB per copy and ratio 128; preset B = 1,
  H = 32, T = 8192 gives 4 GiB per copy.
spec:
  tex: >-
    M_{\text{scores}} = B\,H\,T^{2}\,b
  equation: "5.8"
  inputs:
    - { symbol: B, label: "sequences", default: 8, min: 1, max: 64, scale: log2, format: integer }
    - { symbol: H, label: "heads", default: 12, min: 1, max: 128, options: [1, 4, 8, 12, 16, 32, 64, 128], format: integer }
    - { symbol: Dh, label: "head dimension", default: 64, min: 32, max: 256, options: [32, 64, 128, 256], format: integer }
    - { symbol: T, label: "sequence length", default: 1024, min: 128, max: 131072, scale: log2, format: tokens }
    - { symbol: b, label: "bytes per value", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: M, label: "scores per layer, one copy", formula: "B*H*T^2*b", format: bytes, emphasis: true }
    - { symbol: M2, label: "S and P held, Algorithm 5.2", formula: "2*M", format: bytes }
    - { symbol: X, label: "one [B, T, D] tensor, D = H·Dh", formula: "B*T*H*Dh*b", format: bytes }
    - { symbol: R, label: "scores ÷ [B, T, D], = T/Dh", formula: "M/X", format: ratio }
  presets:
    - { label: "reference, T = 8192", values: { T: 8192 } }
    - { label: "B = 1, H = 32, T = 8192", values: { B: 1, H: 32, T: 8192 } }
```

> **Assumption.** The scale is exactly `1/√Dh` · *sensitivity:* PAPER-REPORTED (P01, §3.2.1, footnote): if the components of q and k are independent with mean 0 and variance 1, the dot product has variance Dh, so the scale restores unit variance at initialisation; a learned or larger scale changes the softmax temperature and is a design change owned by [§13.2](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-2-width-depth-and-heads.md).

## Mechanism

Eq. 5.4 is three GEMMs (or one packed `[D, 3D]` GEMM) costing `3·2·D²` FLOPs per token and `3·D²` parameters. Eq. 5.5 is a batched GEMM over B·H problems of size `[T, Dh] × [Dh, T]`, costing `2·T·Dh` FLOPs per query per head, i.e. `2·T·D` per token summed over heads; Eq. 5.6's second GEMM costs the same again, so the two score-dependent matmuls cost `4·T·D` FLOPs per token per layer under a full mask. Under the causal mask, half the entries of S are `−∞` and contribute nothing to the output; an implementation that skips them halves this term, an implementation that computes and then masks them does not. MATHEMATICALLY-DERIVED. Eq. 5.7 costs `2·D²` per token and `D²` parameters. The per-block attention totals are therefore `4·D²` parameters and `8·D² + 4·T·D` FLOPs per token (full mask), and the ratio of the score term to the projection term is `T/(2D)`: for T = 1024 and D = 768 the score matmuls are two thirds of the projection FLOPs; for T = 8192 they exceed them fivefold. MATHEMATICALLY-DERIVED.

```figure
id: fig-5.9
kind: chart
title: Attention FLOPs per token, projections against score matmuls
caption: >-
  The projection term 8·D² is flat in T; the two score matmuls grow as 4·T·D
  and overtake it at T = 2D, which is 1536 for D = 768. Their ratio T/(2D) is
  2/3 at T = 1024 and 16/3 at T = 8192. A kernel that skips masked work
  follows the lower rising line, 2·(T+1)·D.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.4", "DERIVED:eq-5.5", "DERIVED:eq-5.6", "DERIVED:eq-5.7"]
alt: >-
  Log–log line chart of attention FLOPs per token per block against sequence
  length T from 128 to 65,536, at D = 768. The projections, 8·D², are
  constant at 4,718,592 FLOPs. The score matmuls under a full mask, 4·T·D, are
  3,145,728 FLOPs at T = 1024 (two thirds of the projections), equal the
  projections at T = 1536, and reach 25,165,824 FLOPs at T = 8192 (about 5.3
  times). The causal-skipping line, 2·(T+1)·D, runs just above half of the
  full-mask line.
spec:
  type: line
  x: { label: "sequence length T", scale: log2, format: tokens, domain: [128, 65536] }
  y: { label: "FLOPs per token per block", scale: log2, format: flops }
  variables: { D: 768 }
  series:
    - { id: proj, label: "projections, 8·D²", formula: "8*D^2", sample: { from: 128, to: 65536, count: 10 }, dashed: true }
    - { id: full, label: "score matmuls, full mask, 4·T·D", formula: "4*x*D", sample: { from: 128, to: 65536, count: 10 }, emphasis: true }
    - { id: causal, label: "score matmuls, masked work skipped", formula: "2*(x+1)*D", sample: { from: 128, to: 65536, count: 10 } }
  annotations:
    - { x: 1024, label: "T/(2D) = 2/3" }
    - { x: 1536, label: "T = 2D: equal" }
    - { x: 8192, label: "T/(2D) = 16/3" }
```

The bytes tell a different story. The projections produce three `[B, T, D]` tensors — `3·B·T·D·b` bytes. The score matrix is `B·H·T²·b` bytes (Eq. 5.8), and its ratio to one `[B, T, D]` tensor is `H·T/D = T/Dh`: at Dh = 64 the score matrix is 16 times a `[B, T, D]` tensor when T = 1024, and 128 times when T = 8192. This is the quantity that P19 avoids materialising. PAPER-REPORTED (P19, abstract): the algorithm uses tiling to reduce HBM reads and writes and requires fewer HBM accesses than standard attention, computing exact attention. The mechanism (online softmax, tiling, recomputation) is developed in §27.1; here only the consequence is used — the `[B, H, T, T]` line can be removed from the memory trace without changing the function computed.

```figure
id: fig-5.10
kind: chart
title: Score-matrix bytes against the linear attention tensors
caption: >-
  The vertical gap between the emphasised line and the lowest line is T/Dh:
  16 at T = 1024, 128 at T = 8192. The peak of Algorithm 5.2 is the S-and-P
  line plus the Q, K, V, C line, and S and P overtake Q, K, V, C at
  T = 2·Dh = 128, so at any practical T the materialised path's memory is
  set by the quadratic line alone. Reference configuration, illustrative, not
  a named model.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.8"
alt: >-
  Log–log line chart of bytes per layer against sequence length T from 128 to
  65,536, at B = 8, H = 12, Dh = 64 (D = 768) and 2 bytes per value. One score
  copy, B·H·T²·b, is 192 MiB at T = 1024 and 12 GiB at T = 8192; S and P held
  together are twice that. Q, K, V and C together, 4·B·T·D·b, are 48 MiB at
  T = 1024. One [B, T, D] tensor is 12 MiB at T = 1024 and 96 MiB at T = 8192,
  so the score copy is 16 and 128 times larger at those lengths.
spec:
  type: line
  x: { label: "sequence length T", scale: log2, format: tokens, domain: [128, 65536] }
  y: { label: "bytes per layer, BF16", scale: log2, format: bytes }
  variables: { B: 8, H: 12, Dh: 64, b: 2 }
  series:
    - { id: sp, label: "S and P held, 2·B·H·T²·b", formula: "2*B*H*x^2*b", sample: { from: 128, to: 65536, count: 10 }, dashed: true }
    - { id: s, label: "one score copy, B·H·T²·b (Eq. 5.8)", formula: "B*H*x^2*b", sample: { from: 128, to: 65536, count: 10 }, emphasis: true }
    - { id: qkvc, label: "Q, K, V, C together, 4·B·T·D·b", formula: "4*B*x*H*Dh*b", sample: { from: 128, to: 65536, count: 10 } }
    - { id: one, label: "one [B, T, D] tensor", formula: "B*x*H*Dh*b", sample: { from: 128, to: 65536, count: 10 }, dashed: true }
  annotations:
    - { x: 1024, label: "S = 16 × one [B, T, D]" }
    - { x: 8192, label: "S = 128 × one [B, T, D]" }
```

<details><summary>Derivation of the causal-mask halving</summary>
For query position i, the mask admits keys j ≤ i, i.e. i+1 keys. Summing over i = 0…T−1 gives T(T+1)/2 admitted pairs against T² total, so the admitted fraction is (T+1)/(2T) → 1/2. Per-token FLOPs for the two score matmuls are then `2·(T+1)·D` on average instead of `4·T·D`. MATHEMATICALLY-DERIVED.
</details>

```figure
id: fig-5.11
kind: matrix
title: Causal mask at T = 8
caption: >-
  Row i is a query, column j a key; filled cells are the pairs the mask
  admits, j ≤ i. The highlighted row 5 sees i + 1 = 6 keys. Summing the rows
  gives T(T+1)/2 = 36 of 64 pairs, the fraction (T+1)/(2T) = 9/16 that tends
  to one half as T grows, which is the saving a mask-skipping kernel can claim.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.5"
alt: >-
  Eight by eight grid with query position i from 0 to 7 down the rows and key
  position j from 0 to 7 across the columns. Cells on and below the diagonal
  are filled (admitted); cells above it are empty (masked to minus infinity).
  Row 5 is highlighted across columns 0 to 5, six admitted keys. In total 36 of
  the 64 cells are admitted.
spec:
  rows: 8
  cols: 8
  pattern: causal
  rowLabel: "query position i"
  colLabel: "key position j"
  rowTicks: ["0", "1", "2", "3", "4", "5", "6", "7"]
  colTicks: ["0", "1", "2", "3", "4", "5", "6", "7"]
  highlight:
    - { row: 5, col: 0 }
    - { row: 5, col: 1 }
    - { row: 5, col: 2 }
    - { row: 5, col: 3 }
    - { row: 5, col: 4 }
    - { row: 5, col: 5 }
  legend: "admitted j ≤ i: 36 of 64 pairs, (T+1)/(2T) = 9/16 at T = 8"
```

## Algorithm

```text
Algorithm 5.2 — Causal multi-head attention (materialised reference form)
INPUT   n : [B, T, D]; W_Q, W_K, W_V, W_O : [D, D]; H with D mod H = 0
OUTPUT  a : [B, T, D]
STATE   Q, K, V : [B, H, T, Dh]; S, P : [B, H, T, T]
INVARIANT rows of P sum to 1 (within fp tolerance) and P[..., i, j] = 0 for j > i
1.  Q, K, V ← split_heads(n·W_Q), split_heads(n·W_K), split_heads(n·W_V)   # Eq. 5.4
2.  S ← Q · Kᵀ / √Dh                                                       # [B, H, T, T]
3.  S ← S + M                                                              # M[i, j] = −∞ for j > i
4.  P ← softmax(S − rowmax(S)) along the last axis                         # §3.2 stable form
5.  C ← P · V                                                              # [B, H, T, Dh]
6.  a ← merge_heads(C) · W_O                                               # Eq. 5.7
7.  return a
TERMINATION: straight-line code; no loops.
```

Complexity: `8·D² + 4·T·D` FLOPs per token; peak memory `2·B·H·T²·b` (S and P) plus `4·B·T·D·b` (Q, K, V, C). Implementation: `reference_transformer.py` in [verification.md](verification.md); the fused path replaces lines 2–5 by one call.

## Implementation

Tensors → operators: lines 2–5 map to `torch.nn.functional.scaled_dot_product_attention(query, key, value, attn_mask=None, dropout_p=0.0, is_causal=False, scale=None, enable_gqa=False)`. OFFICIAL-DOCUMENTATION (R5.13, PyTorch 2.14.0, accessed 2026-09-20): the documentation lists three fused implementations — FlashAttention-2, memory-efficient attention, and a PyTorch C++ implementation — states that the PyTorch implementation is used for other cases, and states that an error is thrown if both `attn_mask` and `is_causal` are set. The reference model therefore passes `is_causal=True` and no explicit mask on the prefill path, and an explicit mask only where a padding mask must be combined (§5.5). Kernels: the FlashAttention path is at the *Kernels / numerics / collectives* layer; OFFICIAL-DOCUMENTATION (R5.15, FlashAttention repository README, accessed 2026-09-20): FlashAttention-2 supports fp16 and bf16, all head dimensions up to 256, and aligns the causal mask to the bottom-right corner of the attention matrix when query and key lengths differ — the convention that makes cached decode (§5.5) a special case of the same kernel. Memory: which backend is selected for a given shape and dtype is decided at run time by the framework and is not asserted here (UNVERIFIED for any specific configuration until traced). Communication: none on one device; head-sharded tensor parallelism partitions the H axis of Eq. 5.4 ([§29.2](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-2-tensor-and-pipeline-parallelism.md)). Deployment: inference engines replace K and V by paged buffers ([§42.3](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-3-cache-organization.md)).

> **Implementation note [impl.pytorch · 2.14.0 documentation, execution UNVERIFIED].** The documented reference computation in R5.13 scales by `1/√E` where E is the last dimension of the query, applies the mask additively, applies softmax and dropout, then multiplies by value — the same order as Algorithm 5.2. A user-supplied `scale` overrides the default.

## Experimental design

Proposal. Compare Algorithm 5.2 against the fused call on the verification fixture in FP32 and BF16, reporting the maximum absolute difference of `a` per position; then repeat with the query length set to 1 and K, V of length T to check the bottom-right mask alignment. Expected: FP32 differences at the level of reduction-order noise; BF16 differences bounded as in [verification.md](verification.md). Rejection: any position with a non-zero probability on a future key.

## Observations

**What the paper claims.** PAPER-REPORTED (P01, §3.2.2): multi-head attention with h = 8 heads and d_k = d_v = d_model/h = 64 has total computational cost similar to single-head attention with full dimensionality, and the authors report that the base model uses these values. PAPER-REPORTED (P19, abstract): FlashAttention computes exact attention with fewer HBM accesses than the standard implementation and is optimal for a range of SRAM sizes.

**What the evidence shows.** The equal-cost claim of P01 is a direct consequence of `H·Dh = D` in Eq. 5.4–5.7 and needs no measurement; the IO-optimality claim of P19 is an asymptotic statement whose realised speedups are hardware- and shape-specific and are treated as versioned measurements in §27.2, not as constants.

**What we infer.** DERIVED: for the reference model, the attention block's parameter count is independent of T while its FLOPs and bytes both grow with T, and the bytes grow faster (T² against T); hence memory, not arithmetic, is the first resource exhausted as context grows, which is why §5.5's cache and §27's kernels target bytes.

**What remains unknown.** NOT-DISCLOSED: whether a given production model uses biases, a non-default scale, or a packed QKV layout is absent from most public reports; UNVERIFIED: the backend actually dispatched for the reference configuration on a named accelerator.

## Failure modes

> **Failure mode — future leakage.** *Symptom:* training loss falls implausibly fast; generation degrades sharply from the first sampled token. *Cause:* mask applied after softmax, wrong orientation (`triu` versus `tril`), or `is_causal` combined with an explicit mask that is not causal. *Detection:* assert `P[..., i, j] = 0` for `j > i` on the fixture. *Mitigation:* additive `−∞` mask before softmax; single source of truth for the mask.

> **Failure mode — softmax overflow in low precision.** *Symptom:* NaN in P at a few rows. *Cause:* exponentiating unshifted scores in FP16 or BF16. *Detection:* compare against the FP32 stable form of §3.2. *Mitigation:* max-subtraction; FP32 accumulation of the row sum.

> **Failure mode — score matrix out of memory.** *Symptom:* allocation failure at line 2 of Algorithm 5.2 as T grows, while weights fit comfortably. *Cause:* Eq. 5.8. *Detection:* the trace shows `[B, H, T, T]` at BF16 exceeding free memory. *Mitigation:* fused non-materialising attention (§27.1); smaller B; sequence parallelism ([§29.3](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-3-sequence-and-context-parallelism.md)).

## Siblings

**MQA / GQA** — [§14.1](../../part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/14-1-mha-mqa-and-gqa.md)
Why it exists: PAPER-REPORTED (R5.6, abstract): incremental inference is slow because of the memory-bandwidth cost of repeatedly loading the keys and values tensors. What assumption changed: query heads may share K and V heads. What objective changed: none. What problem it solved: K, V bytes per token fall by H_q/H_kv. What new failure mode it introduced: reduced K, V capacity at H_kv = 1. Changed primitive: per-head W_K, W_V → shared.

**Latent (MLA-style) attention** — [§14.2](../../part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/14-2-latent-attention.md)
Why it exists: cache bytes at long context. What assumption changed: K and V are reconstructed from a low-dimensional latent. What objective changed: none. What problem it solved: cache stores the latent, not K and V. What new failure mode it introduced: implementation-dependent cache layout. Changed primitive: `[B, H, T, Dh]` K, V → latent `[B, T, d_c]`.

**Sparse / sliding-window attention** — [§14.3](../../part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/14-3-sparse-and-local-attention.md)
Why it exists: the T² term. What assumption changed: each query sees a subset of keys. What objective changed: none. What problem it solved: score bytes and FLOPs become O(T·w). What new failure mode it introduced: coverage gaps for distant evidence. Changed primitive: full causal mask → banded or block mask.

**Exact IO-aware execution (FlashAttention)** — [§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md)
Why it exists: Eq. 5.8. What assumption changed: none about the function; the assumption that S must be materialised is dropped. What objective changed: none. What problem it solved: O(T²) bytes → O(T) bytes in HBM. What new failure mode it introduced: shape, dtype and hardware support constraints. Changed primitive: two GEMMs with a stored P → one tiled kernel with recomputation.

```figure
id: fig-5.12
kind: compare
title: Attention siblings as differentials of the reference trace
caption: >-
  Each column changes one line of Algorithm 5.2. Head sharing and latent
  caches shrink the per-token K, V row and leave the score tensor alone;
  sparse masks shrink the score tensor and its FLOPs; the IO-aware kernel
  removes the score tensor from memory while computing the identical
  function. Only the last column is the same model.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.8", R5.6, P19]
alt: >-
  Comparison of five attention forms on K, V bytes per token per layer and
  score bytes per layer at fixed D, H_q and T. Reference MHA: 2·H·Dh·b and
  B·H·T²·b. MQA and GQA: 2·H_kv·Dh·b, a reduction by H_q/H_kv, with scores
  unchanged. Latent, MLA-style: the cache stores a d_c-wide latent per token,
  layout implementation-dependent, scores unchanged if materialised. Sparse or
  sliding-window: K, V row unchanged, scores and score FLOPs become O(T·w).
  IO-aware exact execution (FlashAttention): K, V unchanged, no [B, H, T, T]
  tensor in HBM, O(T) bytes, identical function. The rows also list the
  changed primitive, the function computed and the new failure mode.
spec:
  axis: >-
    K, V bytes per token and score bytes per layer at fixed D, H_q and T, plus
    whether the function computed is unchanged; quality is not an axis here
  columns:
    - { id: mha, label: "MHA, reference (§5.2)", node: ms.section.5.2 }
    - { id: gqa, label: "MQA / GQA", node: ms.section.14.1 }
    - { id: mla, label: "Latent (MLA-style)", node: ms.section.14.2 }
    - { id: sparse, label: "Sparse / sliding-window", node: ms.section.14.3 }
    - { id: io, label: "IO-aware exact (FlashAttention)", node: ms.section.27.1 }
  rows:
    - { dimension: "changed primitive", values: { mha: "per-head W_K, W_V; full causal mask", gqa: "W_K, W_V shared across query heads", mla: "K, V [B, H, T, Dh] → latent [B, T, d_c]", sparse: "full causal mask → banded or block mask", io: "two GEMMs + stored P → one tiled kernel with recomputation" } }
    - { dimension: "K, V bytes per token per layer", values: { mha: "2·H·Dh·b", gqa: "2·H_kv·Dh·b, ÷ H_q/H_kv", mla: "d_c·b latent; layout implementation-dependent", sparse: "2·H·Dh·b, unchanged", io: "2·H·Dh·b, unchanged" } }
    - { dimension: "score bytes per layer", values: { mha: "B·H·T²·b (Eq. 5.8)", gqa: "B·H_q·T²·b, unchanged", mla: "B·H·T²·b if materialised, unchanged", sparse: "O(T·w) per head", io: "no [B, H, T, T] in HBM; O(T) bytes" } }
    - { dimension: "score FLOPs per token per layer", values: { mha: "4·T·D, full mask", gqa: "4·T·D, unchanged", mla: "not derived here (§14.2)", sparse: "O(w·D)", io: "4·T·D forward, plus recomputation in backward" } }
    - { dimension: "function computed", values: { mha: "reference", gqa: "a different model (shared K, V)", mla: "a different model (latent K, V)", sparse: "a different model (subset of keys)", io: "identical (exact attention, P19)" } }
    - { dimension: "new failure mode", values: { mha: "score OOM as T grows", gqa: "reduced K, V capacity at H_kv = 1", mla: "implementation-dependent cache layout", sparse: "coverage gaps for distant evidence", io: "shape, dtype and hardware support limits" } }
```

## Extensions

Long context changes only T in Eq. 5.5–5.8. Multimodal inputs add tokens with the same Q, K, V lines; cross-attention ([§14.4](../../part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/14-4-cross-attention.md)) draws K and V from another sequence and is a shape change, `[B, T_kv, D]`, not an equation change. Positions: RoPE rotates Q and K after Eq. 5.4 and before Eq. 5.5, adding no parameters (§15.1). These are proposals for the reader's configuration.

## Limitations

The materialised form is the numerical reference, not the execution target: it is what fused kernels are checked against ([§26.6](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/26-6-correctness-under-optimization.md)). The FLOP counts assume dense GEMMs and exclude softmax, mask and reshape costs, which are O(T²) in operations but not in multiply-adds. The falsification condition is that a fused implementation disagrees with Algorithm 5.2 beyond the tolerance of [verification.md](verification.md) on an in-support shape.

## Reproducibility

Reference: Algorithm 5.2 as implemented in [verification.md](verification.md); API pinned to the PyTorch 2.14.0 documentation (R5.13), execution UNVERIFIED; FlashAttention constraints from R5.15 as of 2026-09-20. Unresolved: backend dispatch per shape.

## References

P01 · P19 · R5.6 · R5.13 · R5.15 · [references.md](references.md)
