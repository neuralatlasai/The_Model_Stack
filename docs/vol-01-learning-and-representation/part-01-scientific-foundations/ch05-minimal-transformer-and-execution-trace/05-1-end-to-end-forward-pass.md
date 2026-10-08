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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 5.1 End-to-end forward pass

## Scope

A decoder-only Transformer maps an ordered token sequence to a conditional distribution at every input position. Its forward computation couples a token embedding and position representation to repeated attention and position-wise transformations, residual additions, normalization, and a vocabulary projection. The trace below specifies the mathematical function and distinguishes it from the execution plan: tensor layouts, masks, parameter sharing, numerical precision, and saved intermediates determine whether an implementation preserves that function and what resources it consumes. The original Transformer used an encoder-decoder architecture, post-LayerNorm, ReLU, and scaled embeddings; the pre-RMSNorm, GELU, learned-position decoder specified here is an explicitly declared analytical reference, rather than an attributed configuration of P01 or a claimed production default. (PAPER-REPORTED: P01 sections 3.1-3.5; analytical construction: Eq. 5.1-5.3.)

## Why this exists

The autoregressive factorization fixes which token is predicted from which prefix; it does not prescribe how the conditional distribution is computed. During teacher-forced Transformer training, every observed input token is available and the attention mask enforces prefix visibility. All positions within a layer can therefore be processed together, although layer dependencies remain sequential. During ordinary autoregressive generation, the next input depends on the sampled output, so this within-layer training parallelism does not remove the sequential generation loop. P01 Table 1 analyzes sequential operations of a layer; it is not a proof that an entire generated sequence requires constant time. (PAPER-REPORTED: P01 sections 3-4; MATHEMATICALLY-DERIVED: dependence graph.)

A trace also exposes distinct growth rates. Residual and feed-forward tensors grow linearly with sequence length; explicitly materialized attention scores grow quadratically; a full vocabulary logit tensor grows with the vocabulary dimension. Which allocation reaches a device limit first depends on batch, width, vocabulary, saved tensors, precision, and kernel implementation. A quadratic logical operator need not allocate a quadratic tensor in device memory, as P19 demonstrates. This distinction prevents an architecture diagram from being mistaken for an allocation trace. (MATHEMATICALLY-DERIVED: tensor shapes below; PAPER-REPORTED: P19 section 3.)

## Intuition

The residual width is conserved across a block because its branch outputs are added to its input. Attention permits cross-position dependence subject to a mask; the feed-forward block transforms each position using shared parameters. Normalization changes the values presented to a branch, while a residual addition preserves a direct dependence on the preceding state. These statements concern algebraic operations, without assigning a semantic meaning to a learned coordinate or head. An interpretation of a representation requires separate evidence.

For a row-vector convention, each token's hidden state is a row of a matrix and a dense projection acts by multiplication on the right. Flattening the batch and token axes converts `[B, T, d]` to `[B*T, d]` for a projection without changing which positions can interact. Reshaping projected channels into heads also introduces no interaction by itself. The cross-position operation occurs in the query-key product and probability-value product. This separation is essential when a packed projection, a strided view, or a fused kernel replaces several visible operations. (MATHEMATICALLY-DERIVED.)

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

## Formulation

Write `d = d_model`, `d_h = d/H`, `F = d_ff`, and let B, T, L, H, and V denote batch size, token positions, blocks, query heads, and vocabulary size. The local lower-case d avoids conflating model width with the global notation D for training tokens. Inputs are integer IDs `x[b, t]` in `[0, V)`. The reference uses `H_kv=H`, no projection biases, an embedding `E[V, d]`, learned positions `P[T_max, d]`, and two independent RMSNorm gain vectors per block. The output weight is `W_out[d, V]`, either independent or the transpose of E. These are analytical specification choices, not inferred properties of an undisclosed checkpoint.

$$
h_0[b,t,:]=E[x[b,t],:]+P[t,:],\qquad h_0\in\mathbb R^{B\times T\times d}.
$$
*(Eq. 5.1)*

$$
\begin{aligned}
u_\ell&=h_{\ell-1}+A_\ell(N_{\ell,a}(h_{\ell-1})),\\
h_\ell&=u_\ell+F_\ell(N_{\ell,f}(u_\ell)),\qquad \ell=1,\ldots,L.
\end{aligned}
$$
*(Eq. 5.2)* Each A is causal multi-head attention and each F is the two-matrix GELU block specified in 5.3. The two N operators have distinct gain parameters; the attention result is computed once and reused in u.

$$
z=N_{\mathrm{final}}(h_L)W_{\mathrm{out}}\in\mathbb R^{B\times T\times V}.
$$
*(Eq. 5.3)* Logits are unnormalized real scores. Stable log-softmax and target selection belong to the loss; a generation sampler consumes the selected logit rows. Tying the head reuses E's storage but does not eliminate the vocabulary projection's arithmetic. A learned-position table requires every used position ID to lie below T_max. (MATHEMATICALLY-DERIVED.)

The reference differs from P01 in normalization placement, activation, removal of cross-attention, and embedding scaling. GPT-2 documents pre-LayerNorm and a final norm; LLaMA documents pre-RMSNorm, SwiGLU, and rotary positions. These reports establish specific alternatives, without making this chapter's combination an empirical optimum. (PAPER-REPORTED: R5.2 section 2.3; R5.8 section 2.2.)

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

## Mechanism

### Methodology

The computation applies Eq. 5.1, then L blocks of Eq. 5.2, then Eq. 5.3. Each layer has independent parameters. The trace uses the local alias D=d only inside its shape notation; it counts both attention projections and the output vocabulary projection. A materialized attention path is shown to expose its logical intermediates; an exact fused path need not allocate the score and probability tensors in HBM.

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
[B, T, F]                    → GELU    → [B, T, F]        v
[B, T, F] × [F, D]           → W_2                    → [B, T, D]        f
[B, T, D] + [B, T, D]        → residual add           → [B, T, D]        h_ℓ
--- end block ---
[B, T, D]                    → RMSNorm(g_L)           → [B, T, D]        n_L
[B, T, D] × [D, V]           → output head W_out      → [B, T, V]        logits z
[B, T, V], [B, T] int64      → log-softmax + gather   → scalar           loss (§5.5)
```

Every line has a cost. Parameters: E has V·D, P has T_max·D, each block has `4D² + 2DF + 2D` (four D×D attention matrices, two FFN matrices, two norm gains), the final norm has D, and W_out has D·V unless tied. FLOPs per token: a matmul `[B, T, m] × [m, n]` costs `2·m·n` FLOPs per token, so the block's weight matmuls cost `2·(4D² + 2DF)` per token and the head costs `2·D·V`; the two batched attention matmuls cost `4·T·D` per token (the O(T²) term counted per token), and gathers and norms are O(D), FFN activation is O(F), and softmax is O(H*T) per token and are omitted from FLOP totals but not from byte totals. Activation bytes: each `[B, T, D]` tensor is `B·T·D·b` bytes, each `[B, T, F]` is `B·T·F·b`, and each `[B, H, T, T]` is `B·H·T²·b`. All MATHEMATICALLY-DERIVED from the shapes; the numbers for a concrete configuration are in §5.6.

```figure
id: fig-5.5
kind: stat-panel
title: One block of the reference trace, costed
caption: >-
  The FFN holds two thirds of block projection parameters at F=4d.
  Leading projection FLOPs per token are twice projection parameters;
  RMSNorm gains are counted separately. These identities do not establish
  a latency bottleneck. The configuration is analytical, not a named model.
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

Complexity per token: `2·L·(4D² + 2DF) + 2·D·V + 4·L·T·D` FLOPs (§5.6, Eq. 5.23); peak memory requires the sum of unique live allocations, including retained blocks, logits, and workspaces. The two listed shape classes alone do not determine it. A reference implementation remains an unexecuted proposal in [verification.md](verification.md).

## Implementation

The embedding gather, dense projections, head views, attention operator, normalization, activation, residual additions, and output projection are separate logical operators. An actual framework may fuse, compile, or dispatch them through several libraries. `Linear` therefore does not imply a particular cuBLAS kernel, number of launches, accumulator dtype, or memory-traffic count. Those are properties of a concrete execution path and require an inspected implementation or a trace. The SDPA interface in R5.13 is an operator contract; backend selection remains shape-, device-, and dtype-dependent. (OFFICIAL-DOCUMENTATION: R5.13.)

A `[B, T,3d]` packed QKV result and three `[B, T, d]` results can implement identical projections when their weight blocks and output ordering agree. A transpose may produce a noncontiguous view; merging heads after attention must respect its strides or materialize a compatible layout. Comparing shapes and operation names alone is insufficient: equality also requires the same parameters, mask semantics, positions, scale, normalization epsilon, activation formula, and stochastic policy. Floating-point equivalence then requires a declared comparison tolerance rather than exact bitwise equality.

Parameter costs follow the declared tensors. The embedding contributes Vd, the position table T_max*d, attention4d^2 per block, the two-matrix FFN2dF, and RMSNorm2d per block plus d at the output. Adding biases contributes each projection's output width: d for each attention projection, F then d for the FFN, and V for a biased head. It does not add d uniformly to every layer. Tied parameters count once in storage and receive gradients from every use.

An explicit score/probability path has `[B, H, T, T]` allocations; an IO-aware attention path can omit those HBM tensors while retaining the same real-arithmetic attention function. Training may retain inputs to backward operators across all L blocks; inference without autograd can release most intermediates as their last use completes. The output logits and temporary workspaces must be included when computing a peak. None of these shape identities determines latency, throughput, energy, or monetary cost without an actual workload and measurement boundary. Communication is absent for the single-device reference; distributed execution adds separate collective and buffer terms. (MATHEMATICALLY-DERIVED; PAPER-REPORTED: P19 section 3.)

## Experimental design

### Reported experiments

P01 section 6.2 varies architectural components within its translation setup, including attention head count, key/value dimensions, feed-forward width, dropout, and learned versus sinusoidal positions. Its positional comparison is a controlled alternative inside that source's encoder-decoder model; it does not compare this chapter's complete decoder against a current model. The relevant outcomes are translation quality and source-defined perplexity, under the training and decoding protocol in sections 5-6. Source comparisons must keep the changed component separate from unchanged training conditions. (PAPER-REPORTED: P01 section 6.2/Table 3.)

LLaMA section 2.2 identifies its normalization, activation, and positional choices, and section 2.4 describes efficient training execution. Adoption records do not identify the isolated causal contribution of each choice. No source inspected here trains exactly the analytical reference in Eq. 5.1-5.3. Full-sequence versus cached equivalence is an unexecuted chapter verification proposal, documented separately in [verification.md](verification.md). (PAPER-REPORTED: R5.8 sections 2.2/2.4; UNVERIFIED: reference execution.)

## Observations

**What the paper claims.** P01 presents a Transformer encoder-decoder and component variations; R5.2 and R5.8 document different decoder configurations. P19 gives an exact-attention execution with reduced HBM traffic. Each claim applies to its specified architecture and implementation. (PAPER-REPORTED.)

**What the evidence shows.** The inspected method descriptions specify equations and configuration choices. A component result in one source does not measure a mixed configuration assembled from several reports. The reference trace is an analytical composition, and its resource identities follow from its declared tensors. (MATHEMATICALLY-DERIVED.)

**What we infer.** Preserving residual shape allows a branch implementation to be replaced without changing the surrounding tensor interface. It does not guarantee preservation of numerical behavior, trained quality, or performance; those require separate equivalence and task evidence. (MATHEMATICALLY-DERIVED.)

**What remains unknown.** No training quality, measured peak allocation, dispatched kernel, or device latency has been established for the reference in this chapter. Undisclosed production configurations cannot be reconstructed from these sources. (UNVERIFIED; NOT-DISCLOSED.)

```figure
id: fig-5.6
kind: chart
title: Bytes per block against sequence length
caption: >-
  Projection weights are constant in sequence length, while residual/KV
  tensors grow linearly and one materialized score tensor quadratically.
  At these dimensions scores cross projection weights near T=272 and are
  sixteen residual-sized tensors at T=1024. Values above T_max=1024 are
  allocation sensitivity calculations for a changed positional specification,
  not runs of this model.
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
  T = 1024 and 12 GiB at T = 8192, crossing the weights near T approximately 272.
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

## Failure modes

A wrong mask can expose a target's future context while preserving every tensor shape. Perturbing a future input and checking earlier logits under deterministic evaluation detects a violation of causal visibility; the correct test also declares packing and document-reset semantics. A wrong target shift can make a correct forward trace optimize a different objective, so masks and labels must be audited together.

Head reshaping can silently permute channels when a checkpoint's packed QKV ordering differs from the loader's convention. Comparing intermediate Q, K, V and the merged context localizes this error more directly than a final accuracy score. Weight tying can also be accidentally broken by copying a tensor instead of sharing its parameter; storage identity and accumulated gradients distinguish the cases.

Learned positions can exceed their table bounds, or cached execution can restart position IDs at zero. Either violates Eq. 5.1's specified indexing. Finally, a trace that omits logits, saved tensors, or workspaces understates peak memory. These are implementation failure mechanisms and proposed diagnostic checks, rather than benchmark findings from an executed reference.

## Siblings

The original encoder-decoder adds source representations and a cross-attention branch to the decoder; a decoder-only trace must remove that branch explicitly. A rotary-position decoder rotates Q and K at their absolute positions rather than adding a learned P table to the residual input. Its projection trace therefore changes even when residual shapes do not. The architecture-specific treatment is in Chapters 13-18. (PAPER-REPORTED: P01 section 3; R5.8 section 2.2.)

A parallel residual block makes attention and FFN read the same incoming normalized state, whereas Eq. 5.2 makes the FFN read the attention-updated state. This is a changed function, not a scheduling optimization that can be applied to arbitrary sequential-block weights without further justification. Normalization and residual variants are developed in 5.4.

## Extensions

### Improvements

Packed projections reduce the number of separately expressed dense operators when the three inputs and their layout permit concatenation. Fusing operations can reduce intermediate writes, but the mathematical specification must still distinguish attention projections, normalization, masking, probability normalization, and output projection. P19 changes how exact attention is evaluated; it does not replace the causal objective or remove the quadratic arithmetic of full attention. (PAPER-REPORTED: P19 section 3; MATHEMATICALLY-DERIVED: operator composition.)

Changing GELU to SwiGLU introduces a third projection and a multiplicative branch, so it requires a new width and parameter account even when a matched-width convention preserves total dense parameters. Changing MHA to shared-key attention alters cache and projection dimensions. These changes belong in the trace before any efficiency claim is evaluated.

## Limitations

The reference is a complete forward specification for the stated architecture, not a complete training recipe or an assertion about frontier model internals. Its learned position table bounds context, and its dense FFN and equal query/KV head counts exclude several deployed variants. Shape-based FLOPs omit operator-specific reductions and implementation padding unless listed. A functionally equivalent optimized execution can have different tensor lifetimes, recomputation, communication, and measured peak memory. These distinctions are retained in subsequent accounting rather than folded into an unspecified constant.

## Reproducibility

The reproducible analytical inputs are B, T, L, d, H, F, V, T_max, parameter sharing, position IDs, causal/document masks, RMSNorm epsilon, activation formula, and numerical dtypes. Source versions and access dates are recorded in [references.md](references.md). An executed implementation must additionally record repository revision, framework, backend, device, stochastic controls, and position-resolved equivalence results. The chapter's code and numerical proposals remain unexecuted; there is no model-quality or timing measurement to reproduce.

## References

P01 · R5.2 · R5.3 · R5.8 · R5.13 · R5.14 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
