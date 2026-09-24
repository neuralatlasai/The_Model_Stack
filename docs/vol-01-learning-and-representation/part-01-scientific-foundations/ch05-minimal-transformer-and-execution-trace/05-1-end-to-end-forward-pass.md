---
id: ms.section.5.1
entity_type: section
title: End-to-end forward pass
short_title: Forward pass trace
volume: 1
part: 1
chapter: 5
section: 5.1
slug: 05-1-end-to-end-forward-pass
parent: ms.chapter.5
prev_sibling: null
next_sibling: ms.section.5.2
children: []
prerequisites: [ms.section.3.2, ms.section.3.5, ms.section.4.1]
downstream: [ms.section.5.2, ms.section.5.5, ms.section.5.6, ms.section.13.1, ms.section.13.5, ms.section.64.2]
related: [ms.frontmatter.notation]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P01}
  - {type: implemented_by, target: impl.pytorch}
axes:
  lifecycle: [pretraining, inference]
  mechanism: [residual_stream, embedding, output_head]
  feedback_setting: []
  modality: [text]
papers: [P01]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, ASSUMED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 5.1 End-to-end forward pass

## Scope

Objective: write the decoder-only forward pass as a tensor trace — every intermediate tensor named, shaped, typed and costed — from integer token ids to a `[B, T, V]` logit tensor. Baseline: the block diagram of P01 restricted to its decoder without cross-attention. Success criterion: a reader can reconstruct the reference implementation in §5.5 from the trace alone and can point to the line responsible for any parameter, FLOP or byte reported in §5.6. Boundaries: attention internals (§5.2), feed-forward internals (§5.3), normalisation placement (§5.4) and the backward pass (§5.5) are deferred; RoPE is a forward link to [§15.1](../../part-03-model-architectures-and-state/ch15-position-long-context-and-effective-information-access/15-1-position-representations.md).

## Why this exists

Chapter 04 fixed the objective: the model must output a conditional distribution `p_θ(x_t | x_<t)` at every position in one pass, with teacher forcing supplying the prefix ([§4.1](../ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md)). What failed when that objective was first met with recurrent models was that computing position t required the state of position t−1, so the T positions of a sequence could not be processed as one batched matrix multiplication. The Transformer of P01 removes that dependency: every position's representation is computed from all earlier positions through attention, and the only sequential structure is the depth of the stack. PAPER-REPORTED (P01, §1 and §4): the authors state that self-attention connects all positions with a constant number of sequentially executed operations, in contrast to the O(n) sequential operations of a recurrent layer.

The bottleneck that this creates, and that the trace exposes, is that the parallel form materialises tensors whose size depends on T² (scores) and on T·d_ff (feed-forward hidden), so that memory rather than sequential latency becomes the dominant constraint at long T. The trace is the instrument for seeing that before it is measured.

## Intuition

Physically, the forward pass is a sequence of dense matrix multiplications interrupted by three non-matmul operations: a gather (embedding), a row-wise normalisation, and a row-wise softmax. The matmuls are where the FLOPs are; the gather and the softmax are where the memory traffic and the numerical hazards are. A `[B, T, D]` tensor with B·T = 8192 tokens and D = 768 is 12 MiB in BF16; the model touches on the order of a dozen such tensors per block, so the working set is tens of MiB per block before any O(T²) object appears. MATHEMATICALLY-DERIVED from the shapes below.

```figure
id: fig-5.3
kind: calculator
title: Bytes of one tensor in each trace shape class
caption: >-
  The trace has three activation shape classes, costed by the byte rules of
  the Mechanism and Eq. 5.8: B·T·D·b, B·T·F·b and B·H·T²·b. The defaults
  reproduce the Intuition's 12 MiB [B, T, D] tensor (B·T = 8192 tokens,
  D = 768, BF16). Double T and the score tensor quadruples while the other two
  double. Illustrative configuration, not a named model.
placement: rail
anchor: intuition
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.8", "DERIVED:eq-5.25"]
alt: >-
  Calculator over sequences B, positions T, model width D, head dimension Dh
  and bytes per value b, with F = 4D and H = D/Dh. At the defaults (B = 8,
  T = 1024, D = 768, Dh = 64, b = 2; the chapter's illustrative reference
  configuration, not a named model) the batch holds 8192 tokens, one
  [B, T, D] tensor is 12 MiB, one [B, T, F] tensor is 48 MiB, one
  [B, H, T, T] score tensor is 192 MiB, and the score tensor is 16 times a
  [B, T, D] tensor, which is T/Dh.
spec:
  tex: >-
    B\,T\,D\,b,\qquad B\,T\,F\,b,\qquad B\,H\,T^{2}\,b,\qquad F = 4D,\; H = D/D_h
  inputs:
    - { symbol: B, label: "sequences", default: 8, min: 1, max: 64, scale: log2, format: integer }
    - { symbol: T, label: "positions", default: 1024, min: 128, max: 131072, scale: log2, format: tokens }
    - { symbol: D, label: "model width D", default: 768, min: 512, max: 8192, options: [512, 768, 1024, 2048, 4096, 8192], format: integer }
    - { symbol: Dh, label: "head dimension Dh", default: 64, min: 64, max: 128, options: [64, 128], format: integer }
    - { symbol: b, label: "bytes per value", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: Ntok, label: "tokens in the batch, B·T", formula: "B*T", format: tokens }
    - { symbol: X, label: "one [B, T, D] tensor", formula: "B*T*D*b", format: bytes }
    - { symbol: Y, label: "one [B, T, F] tensor, F = 4D", formula: "B*T*4*D*b", format: bytes }
    - { symbol: S, label: "one [B, H, T, T] score tensor", formula: "B*(D/Dh)*T^2*b", format: bytes, emphasis: true }
    - { symbol: R, label: "score tensor ÷ [B, T, D] tensor", formula: "S/X", format: ratio }
  presets:
    - { label: "T = 8192", values: { T: 8192 } }
```

Heuristically, one may think of the residual stream as a per-token "bus" that sub-blocks read from and write to; this analogy is a reading aid and carries no mechanistic claim. Mechanistic claims about what the stream encodes are the subject of [§64.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/64-2-representation-analysis.md).

## Formulation

Symbols follow [notation.md](../../../front-matter/notation.md): B sequences, T positions, D = d_model, L blocks, H = H_q = H_kv heads in the reference form, Dh = d_h, F = d_ff (local alias, this chapter only), V vocabulary size. Token ids are `x ∈ {0,…,V−1}^{B×T}`. Parameters: embedding `E ∈ ℝ^{V×D}`, position table `P ∈ ℝ^{T_max×D}`, per block `θ_ℓ`, final norm gain `g_L ∈ ℝ^D`, output head `W_out ∈ ℝ^{D×V}` (equal to `Eᵀ` when tied).

> **Definition — residual stream.** The `[B, T, D]` tensor `h_ℓ` that block ℓ reads from and adds to; its shape is invariant from the embedding output `h_0` to the input of the final normalisation `h_L`.

> **Definition — tensor trace.** The ordered list of lines `shape → op → shape`, each annotated with dtype, parameter count, FLOPs and bytes, that fully specifies a forward pass; two implementations with the same trace compute the same function up to floating-point reordering.

$$
h_0 = E[x] + P[0{:}T]
$$
*(Eq. 5.1)* where `E[x]` is a gather of shape `[B, T, D]` and `P[0:T]` broadcasts over B.

$$
h_{\ell} = h_{\ell-1} + \mathrm{Attn}_\ell\big(\mathrm{Norm}(h_{\ell-1})\big) + \mathrm{FFN}_\ell\Big(\mathrm{Norm}\big(h_{\ell-1} + \mathrm{Attn}_\ell(\mathrm{Norm}(h_{\ell-1}))\big)\Big), \quad \ell = 1,\dots,L
$$
*(Eq. 5.2)* where Norm is RMSNorm with its own gain per call, Attn is §5.2, FFN is §5.3; this is the pre-norm ordering of §5.4.

$$
z = \mathrm{Norm}(h_L)\, W_{\text{out}} \in \mathbb{R}^{B\times T\times V}
$$
*(Eq. 5.3)* where z are logits; the softmax over V is applied only inside the loss or the sampler.

```figure
id: fig-5.4
kind: diagram
title: Pre-norm decoder block around the residual stream
caption: >-
  Follow the heavy path. The residual stream enters as h_0 and leaves as h_L
  having only been added to, never replaced. Each sub-block reads a normalised
  copy and writes back through an add, so every parameter tensor sits on a
  side branch and the block's count, 4·D² + 2·D·F + 2·D, does not depend on T.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.1", "DERIVED:eq-5.2", "DERIVED:eq-5.3"]
alt: >-
  Top-to-bottom diagram of Eq. 5.1 to 5.3. Token ids [B, T] pass through the
  embedding gather (V·D parameters) and are added to the position table
  [T, D] (T_max·D parameters) to form the residual stream h_0 [B, T, D].
  Inside block ℓ, repeated L times, an RMSNorm (D gains) feeds attention
  (4·D² parameters), whose output is added to the stream to give h_mid; a
  second RMSNorm feeds the feed-forward block (2·D·F parameters), whose output
  is added again to give h_ℓ, and a feedback edge returns to the next block.
  The emphasised path is the stream itself, from h_0 through both adds to the
  final RMSNorm. The final norm feeds the output head (D·V parameters, shared
  with the embedding if tied), which produces logits [B, T, V] scored by the
  shifted-target cross-entropy of Eq. 5.18.
spec:
  direction: TB
  nodes:
    - { id: ids, kind: tensor, label: "token ids x", sub: "[B, T] int64" }
    - { id: emb, kind: process, label: "embedding gather E[x]", sub: "V·D params" }
    - { id: pos, kind: tensor, label: "position table P[0:T]", sub: "[T, D] · T_max·D params" }
    - { id: h0, kind: tensor, label: "residual stream h_0", sub: "[B, T, D]", emphasis: true }
    - { id: n1, kind: process, label: "RMSNorm, g_att", sub: "D params", group: blk }
    - { id: att, kind: process, label: "attention (§5.2)", sub: "4·D² params", group: blk }
    - { id: add1, kind: process, label: "residual add", sub: "h_mid [B, T, D]", group: blk }
    - { id: n2, kind: process, label: "RMSNorm, g_ffn", sub: "D params", group: blk }
    - { id: ffn, kind: process, label: "feed-forward (§5.3)", sub: "2·D·F params", group: blk }
    - { id: add2, kind: process, label: "residual add", sub: "h_ℓ [B, T, D]", group: blk }
    - { id: nL, kind: process, label: "final RMSNorm, g_L", sub: "D params" }
    - { id: head, kind: process, label: "output head W_out", sub: "D·V params; shared with E if tied" }
    - { id: z, kind: tensor, label: "logits z", sub: "[B, T, V]" }
    - { id: loss, kind: objective, label: "shifted-target cross-entropy", sub: "Eq. 5.18" }
  edges:
    - { from: ids, to: emb }
    - { from: emb, to: h0 }
    - { from: pos, to: h0, label: "broadcast add" }
    - { from: h0, to: n1 }
    - { from: n1, to: att }
    - { from: att, to: add1 }
    - { from: h0, to: add1, kind: emphasis, label: "identity path" }
    - { from: add1, to: n2 }
    - { from: n2, to: ffn }
    - { from: ffn, to: add2 }
    - { from: add1, to: add2, kind: emphasis }
    - { from: add2, to: nL, kind: emphasis, label: "after L blocks: h_L" }
    - { from: add2, to: n1, kind: feedback, label: "next block, ℓ + 1" }
    - { from: nL, to: head }
    - { from: head, to: z }
    - { from: z, to: loss }
  groups:
    - { id: blk, label: "block ℓ, repeated L times" }
```

> **Assumption.** No bias vectors in any projection · *sensitivity:* adding biases adds `D` parameters per projection and is a negligible FLOP change; it changes the pre-norm variance analysis in §5.4 only at second order.

> **Assumption.** Learned absolute positions `P` with `T ≤ T_max` · *sensitivity:* replacing P by RoPE removes `T_max·D` parameters and moves position information into the Q and K projections of §5.2; see §15.1.

## Mechanism

The forward pass is the composition of Eq. 5.1, L applications of Eq. 5.2, and Eq. 5.3. The full trace for one block, with F = d_ff and the head split `D = H·Dh`, is the canonical example that every later Tensor trace block in the book follows.

```text
Tensor trace — reference decoder-only forward pass (pre-norm, learned positions)
[B, T] int64                 → gather E[x]            → [B, T, D]        h_0 (embedding)
[B, T, D] + [T, D]           → broadcast add P        → [B, T, D]        h_0 (positioned)
--- block ℓ (repeated L times) ---
[B, T, D]                    → RMSNorm(g_att)         → [B, T, D]        n_att
[B, T, D] × [D, 3D]          → QKV projection         → [B, T, 3, H, Dh] qkv (packed)
[B, T, 3, H, Dh]             → split + transpose      → 3 × [B, H, T, Dh] Q, K, V
[B, H, T, Dh] × [B, H, Dh, T]→ batched matmul / √Dh   → [B, H, T, T]     scores  (§5.2)
[B, H, T, T] + [T, T]        → causal mask, softmax   → [B, H, T, T]     probs   (§5.2)
[B, H, T, T] × [B, H, T, Dh] → batched matmul         → [B, H, T, Dh]    ctx
[B, H, T, Dh]                → transpose + merge      → [B, T, D]        ctx (merged)
[B, T, D] × [D, D]           → output projection W_O  → [B, T, D]        a
[B, T, D] + [B, T, D]        → residual add           → [B, T, D]        h_mid
[B, T, D]                    → RMSNorm(g_ffn)         → [B, T, D]        n_ffn
[B, T, D] × [D, F]           → W_1                    → [B, T, F]        u       (§5.3)
[B, T, F]                    → GELU (or gated act)    → [B, T, F]        v
[B, T, F] × [F, D]           → W_2                    → [B, T, D]        f
[B, T, D] + [B, T, D]        → residual add           → [B, T, D]        h_ℓ
--- end block ---
[B, T, D]                    → RMSNorm(g_L)           → [B, T, D]        n_L
[B, T, D] × [D, V]           → output head W_out      → [B, T, V]        logits z
[B, T, V], [B, T] int64      → log-softmax + gather   → scalar           loss (§5.5)
```

Every line has a cost. Parameters: E has V·D, P has T_max·D, each block has `4D² + 2DF + 2D` (four D×D attention matrices, two FFN matrices, two norm gains), the final norm has D, and W_out has D·V unless tied. FLOPs per token: a matmul `[B, T, m] × [m, n]` costs `2·m·n` FLOPs per token, so the block's weight matmuls cost `2·(4D² + 2DF)` per token and the head costs `2·D·V`; the two batched attention matmuls cost `4·T·D` per token (the O(T²) term counted per token), and gathers, norms, softmax and activations are O(D) or O(T) per token and are omitted from FLOP totals but not from byte totals. Activation bytes: each `[B, T, D]` tensor is `B·T·D·b` bytes, each `[B, T, F]` is `B·T·F·b`, and each `[B, H, T, T]` is `B·H·T²·b`. All MATHEMATICALLY-DERIVED from the shapes; the numbers for a concrete configuration are in §5.6.

```figure
id: fig-5.5
kind: stat-panel
title: One block of the reference trace, costed
caption: >-
  Each row evaluates one cost rule of this paragraph at the §5.6
  configuration (illustrative, not a named model). The glyph shows why the FFN
  dominates: 2·D·F is two thirds of the block's weights at F = 4D, and the
  weight-GEMM FLOPs per token are exactly twice the weight count.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.22", "DERIVED:eq-5.23"]
alt: >-
  Instrument panel for one pre-norm block at L = 12, D = 768, F = 3072,
  T = 1024, V = 32,000 (illustrative configuration, not a named model).
  Attention parameters 4·D² = 2,359,296; FFN parameters 2·D·F = 4,718,592;
  norm gains 2·D = 1,536; parameters per block 7,079,424. Weight-GEMM FLOPs
  per token per block 14,155,776; score FLOPs per token per block at T = 1024
  under a full mask 3,145,728; head FLOPs per token 49,152,000; forward FLOPs
  per token for the whole model 256,770,048. A block glyph splits the block's
  parameters into attention, FFN and norm gains.
spec:
  header: "ONE BLOCK · REFERENCE CONFIG · BF16"
  variables: { L: 12, D: 768, F: 3072, T: 1024, V: 32000 }
  rows:
    - { key: "attention params, 4·D²", formula: "4*D^2", format: integer }
    - { key: "FFN params, 2·D·F", formula: "2*D*F", format: integer }
    - { key: "norm gains, 2·D", formula: "2*D", format: integer }
    - { key: "params per block", formula: "4*D^2 + 2*D*F + 2*D", format: integer }
    - { key: "weight FLOPs/token/block", formula: "2*(4*D^2 + 2*D*F)", format: integer }
    - { key: "score FLOPs/token/block, T=1024", formula: "4*T*D", format: integer, note: "full mask" }
    - { key: "head FLOPs/token, 2·D·V", formula: "2*D*V", format: integer }
    - { key: "forward FLOPs/token, all L", formula: "2*L*(4*D^2 + 2*D*F) + 2*D*V + 4*L*T*D", format: integer, note: "Eq. 5.23, full mask" }
  glyph:
    type: blocks
    items:
      - { label: "attention 4·D²", weight: 2359296 }
      - { label: "FFN 2·D·F", weight: 4718592, emphasis: true }
      - { label: "norm gains 2·D", weight: 1536 }
```

PAPER-REPORTED (P01, §3.4): the original model multiplies the embedding output by √d_model and uses sinusoidal rather than learned positions, with the authors reporting that learned positions gave nearly identical results in their setting. The reference model here uses learned positions without the √d_model factor as an ASSUMED simplification; the factor matters when embeddings are tied to the head and initialised at small scale, which §5.4 revisits.

## Algorithm

```text
Algorithm 5.1 — Reference forward pass
INPUT   x : int64 [B, T] with 0 ≤ x < V and T ≤ T_max; parameters θ = {E, P, (θ_ℓ)_{ℓ=1..L}, g_L, W_out}
OUTPUT  z : [B, T, V] logits; trace : dict of named intermediate tensors (optional)
STATE   h : [B, T, D] residual stream
INVARIANT after every line that writes h: h.shape == [B, T, D] and h.dtype == compute dtype
1.  h ← E[x] + P[0:T]                              # Eq. 5.1
2.  for ℓ = 1 … L:
3.      n ← RMSNorm(h; g_att,ℓ)
4.      a ← Attention_ℓ(n, mask = causal(T))       # Algorithm 5.2, §5.2
5.      h ← h + a
6.      n ← RMSNorm(h; g_ffn,ℓ)
7.      f ← FFN_ℓ(n)                               # Algorithm 5.3, §5.3
8.      h ← h + f
9.  n ← RMSNorm(h; g_L)
10. z ← n · W_out                                  # Eq. 5.3; W_out = Eᵀ if tied
11. return z (and trace if requested)
TERMINATION: the loop is bounded by L; no data-dependent control flow.
```

Complexity per token: `2·L·(4D² + 2DF) + 2·D·V + 4·L·T·D` FLOPs (§5.6, Eq. 5.23); peak activation memory is dominated by the largest of `B·H·T²·b` (scores) and `B·T·F·b` (FFN hidden). Implementation: `reference_transformer.py` in [verification.md](verification.md).

## Implementation

Tensors → operators: the gather is `torch.nn.Embedding`; the projections are `torch.nn.Linear(bias=False)`; the two batched matmuls are `torch.matmul` on `[B, H, T, Dh]` layouts, or a single fused call to `torch.nn.functional.scaled_dot_product_attention`, which the PyTorch 2.14.0 documentation describes as dispatching to one of three fused implementations or to a PyTorch fallback (OFFICIAL-DOCUMENTATION, R5.13, accessed 2026-09-20; the version in which it first appeared is not asserted here). Framework: PyTorch at the *Model / autograd framework* layer of the stack. Kernels: each `Linear` lowers to a GEMM in NVIDIA cuBLAS / cuBLASLt on NVIDIA hardware; the fused attention path may dispatch to a FlashAttention-family kernel when dtype, head dimension and mask are supported, and otherwise to a materialised-score path — the dispatch conditions are release-specific and are NOT-DISCLOSED here rather than inferred. Memory: in training every line's output that the backward pass needs is retained (§5.5); in inference only the residual stream and the K, V tensors persist. Communication: none on a single device; the trace is what tensor and sequence parallelism partition in [Chapter 29](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/README.md). Deployment: the same trace executes under an inference engine with the attention line replaced by a paged variant ([§42.3](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-3-cache-organization.md)).

> **Implementation note [impl.pytorch · 2.14.0 documentation, execution UNVERIFIED].** The packed `[D, 3D]` QKV projection and the separate `W_Q, W_K, W_V` form have identical parameter and FLOP counts; the packed form issues one GEMM instead of three and changes the memory layout of the result, which is why the trace shows `[B, T, 3, H, Dh]` before the split.

## Experimental design

Proposal only. The chapter's experiment is the equivalence test of [verification.md](verification.md); for this section the relevant sub-check is shape and dtype conformance of every trace line against Algorithm 5.1 on a deterministic fixture (fixed seed, B = 2, T = 16, D = 64, H = 4, F = 256, V = 128), with the trace dictionary compared line by line to the expected shapes. No dataset is required; the check is structural.

## Observations

**What the paper claims.** PAPER-REPORTED (P01): the base model uses d_model = 512, h = 8, d_k = d_v = 64, d_ff = 2048, six encoder and six decoder layers, shared input/output embedding weights, sinusoidal positions, and dropout 0.1 on residual connections and embedding sums; the authors report 65 million parameters for the base configuration.

**What the evidence shows.** The parameter figure follows from the stated shapes and is independently recomputable from Eq. 5.22 in §5.6 once encoder cross-attention is included; the architectural choices themselves (post-norm, ReLU, sinusoidal positions) have since been replaced in most decoder-only reports (R5.2, R5.8), which is evidence that the trace grammar survives while individual lines are swapped.

**What we infer.** DERIVED: for a decoder-only model the trace has exactly three growth regimes — O(1) in T for weights, O(T) for the residual stream and cache, O(T²) for scores — and every later efficiency intervention in this book targets one regime; naming the regime is the first step of any cost argument.

```figure
id: fig-5.6
kind: chart
title: Bytes per block against sequence length
caption: >-
  The three growth regimes on one log–log plot, per block of the reference
  configuration (illustrative, not a named model). Weights are a flat line;
  the residual stream and the K, V pair rise with slope 1; the score tensor
  rises with slope 2. At B = 8 the score line crosses the block's weights near
  T ≈ 270, and at T = 1024 it is already 16 times a [B, T, D] tensor.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.8", "DERIVED:eq-5.22"]
alt: >-
  Log–log line chart of bytes per block against sequence length T from 128 to
  65,536, at B = 8, H = 12, D = 768, F = 3072 and 2 bytes per value. The block
  weights, (4·D² + 2·D·F)·b, are constant at 13.5 MiB. One residual-stream
  tensor [B, T, D] grows linearly from 1.5 MiB at T = 128 to 12 MiB at
  T = 1024 and 96 MiB at T = 8192; K and V together are twice that. The score
  tensor [B, H, T, T] grows quadratically from 3 MiB at T = 128 to 192 MiB at
  T = 1024 and 12 GiB at T = 8192, crossing the weights near T ≈ 270.
spec:
  type: line
  x: { label: "sequence length T", scale: log2, format: tokens, domain: [128, 65536] }
  y: { label: "bytes per block, BF16", scale: log2, format: bytes }
  variables: { B: 8, H: 12, D: 768, F: 3072, b: 2 }
  series:
    - { id: w, label: "block weights, (4·D² + 2·D·F)·b", formula: "(4*D^2 + 2*D*F)*b", sample: { from: 128, to: 65536, count: 10 }, dashed: true }
    - { id: h, label: "residual stream [B, T, D]", formula: "B*x*D*b", sample: { from: 128, to: 65536, count: 10 } }
    - { id: kv, label: "K and V, 2·B·T·D·b", formula: "2*B*x*D*b", sample: { from: 128, to: 65536, count: 10 } }
    - { id: s, label: "scores [B, H, T, T]", formula: "B*H*x^2*b", sample: { from: 128, to: 65536, count: 10 }, emphasis: true }
  annotations:
    - { x: 1024, label: "scores 192 MiB = 16 × [B, T, D]" }
    - { x: 8192, label: "scores 12 GiB = 128 × [B, T, D]" }
```

**What remains unknown.** NOT-DISCLOSED: for most production models the exact projection layouts (packed or split QKV, biases or not, embedding scaling) are absent from public reports; UNVERIFIED: whether the fused attention entry point in a given PyTorch release preserves the materialised-path numerics is a release-specific property that [§26.6](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/26-6-correctness-under-optimization.md) treats.

## Failure modes

> **Failure mode — position-table overflow.** *Symptom:* index error or silently wrong logits when T > T_max. *Cause:* learned absolute positions have a fixed table. *Detection:* assert `T ≤ P.shape[0]` at line 1 of Algorithm 5.1. *Mitigation:* enforce the assertion; RoPE (§15.1) removes the table but not the trained-length limit.

> **Failure mode — dtype drift in the residual stream.** *Symptom:* loss diverges or plateaus after a few hundred steps in BF16. *Cause:* residual adds accumulate in the storage dtype, so small updates are rounded away. *Detection:* compare `h_L` against an FP32 run on the same fixture ([§3.4](../ch03-numerical-computation-and-trustworthy-training/03-4-mixed-precision-execution.md)). *Mitigation:* keep the residual stream in FP32 or use an autocast policy that up-casts the add.

> **Failure mode — logits materialised for all positions at decode.** *Symptom:* decode memory scales with prompt length in the head, not only in the cache. *Cause:* Eq. 5.3 applied to all T rows when only the last is needed. *Detection:* trace shows `[B, T, V]` at the decode step. *Mitigation:* slice `n_L[:, -1]` before the head (§5.5).

## Siblings

**Encoder–decoder forward pass (P01 full model)** — [§13.1 Architectural families](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-1-architectural-families.md)
Why it exists: sequence-to-sequence tasks with a distinct source. What assumption changed: the decoder reads an encoder output through cross-attention. What objective changed: conditional likelihood of target given source. What problem it solved: bidirectional source encoding. What new failure mode it introduced: a second cache (encoder K, V) with a different lifetime ([§14.4](../../part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/14-4-cross-attention.md)). Changed primitive: one attention line → two attention lines per decoder block.

**Encoder-only forward pass** — [§13.1](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-1-architectural-families.md)
Why it exists: representation tasks without generation. What assumption changed: no causal mask. What objective changed: masked or contrastive objectives ([§4.2](../ch04-language-modeling-and-learning-objectives/04-2-alternative-objectives.md)). What problem it solved: bidirectional context per position. What new failure mode it introduced: no autoregressive generation path; no cache. Changed primitive: causal mask → full mask.

## Extensions

Domain adaptation leaves the trace unchanged and changes θ. Long context changes only the two O(T) and O(T²) regimes; the weight lines are untouched, which is why long-context work concentrates on §5.2's score line and §5.5's cache. Multimodality inserts additional gathers or encoders before line 1 that produce `[B, T', D]` tensors concatenated into the residual stream ([§18](../../part-03-model-architectures-and-state/README.md)); agents change the token stream, not the trace. Each is a proposal for the reader's own configuration, not a result.

## Limitations

The trace is valid for a dense, single-device, pre-norm decoder with H_q = H_kv. It does not describe mixture-of-experts feed-forward blocks (the `[B, T, F]` line becomes a routed, per-expert set), grouped or latent attention (§14), or recurrent layers (§17). The falsification condition is direct: a model whose intermediate shapes differ from the trace at any line is not the reference model, and its costs must be re-derived. The decision consequence is that no cost figure in this book is quoted without naming the trace line it comes from.

## Reproducibility

Reference implementation in [verification.md](verification.md); API pinned to the PyTorch 2.14.0 documentation (R5.13, R5.14), execution UNVERIFIED; fixture shapes above; the trace dictionary keys are the names in the right-hand column of the Tensor trace block. Unresolved: the fused-attention dispatch conditions per release.

## References

P01 · R5.2 · R5.3 · R5.8 · R5.13 · R5.14 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
