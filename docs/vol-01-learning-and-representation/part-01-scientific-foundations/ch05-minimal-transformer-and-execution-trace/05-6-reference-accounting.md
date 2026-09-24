---
id: ms.section.5.6
entity_type: section
title: Reference accounting
short_title: Parameters, FLOPs, bytes
volume: 1
part: 1
chapter: 5
section: 5.6
slug: 05-6-reference-accounting
parent: ms.chapter.5
prev_sibling: ms.section.5.5
next_sibling: ms.verification.5
children: []
prerequisites: [ms.section.5.1, ms.section.5.2, ms.section.5.3, ms.section.5.5]
downstream: [ms.section.13.2, ms.section.13.5, ms.section.21.1, ms.section.25.3, ms.section.29.1, ms.section.30.2, ms.section.42.2]
related: [ms.frontmatter.notation]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P08}
  - {type: supported_by, target: paper.P01}
  - {type: implemented_by, target: impl.pytorch}
axes:
  lifecycle: [pretraining, inference]
  mechanism: [resource_accounting]
  feedback_setting: []
  modality: [text]
papers: [P01, P08]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, DERIVED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 5.6 Reference accounting

## Scope

Objective: tabulate, for one concrete configuration, the parameters by component, the activation shapes and bytes, the major FLOPs per token in forward and training, and a first memory trace covering weights, activations and cache. Baseline: the accounting conventions of P08 §2.1 and the CS336 handout's FLOPs rule (R5.11). Success criterion: every number in the tables is reproducible from the shapes of §5.1–§5.5 by hand. Boundaries: the configuration is illustrative and ASSUMED; the general parameter/FLOP model across architecture families is Chapter 13's artifact; training-memory totals with optimiser state are Eq. N.5 (Chapters 29–30); KV accounting at serving scale is Eq. N.8 (Chapter 42).

## Why this exists

What failed before was cost reasoning by parameter count alone: two models with equal N can differ several-fold in activation memory (by T and F), in cache bytes (by H_kv), and in attention FLOPs (by T), so "N" is not a cost. The bottleneck is that the terms grow at different rates — weights O(1) in T, cache O(T), scores O(T²) — and any single constant hides the crossover. The dominant constraint depends on the mode: activations in training, cache bytes in decode. What changed is the practice of writing the trace down with its three growth regimes separated; the tables below are that practice applied once, so later chapters can apply it by difference.

## Intuition

Physically, weights are read once per token in decode and once per batch in training; activations are written and read once per block per token; the cache is written once per token and read once per subsequent token. Multiply each by its byte count and the traffic picture follows. Heuristically, "parameters ≈ cost" holds only in the regime P08 identifies — `d_model ≫ n_ctx/12` — and the tables show where the reference configuration sits relative to that boundary.

## Formulation

Configuration (ASSUMED, illustrative; not a specification for any named model):

| Symbol | Value | Note |
|---|---|---|
| L | 12 | blocks |
| D = d_model | 768 | residual width |
| H = H_q = H_kv | 12 | heads; Dh = 64 |
| F = d_ff | 3072 | GELU two-matrix form (SwiGLU: F_g = 2048, same N) |
| V | 32,000 | vocabulary |
| T_max | 1024 | learned position table |
| B, T | 8, 1024 | training microbatch used in the activation table |
| b | 2 | BF16 storage for weights, activations and cache |

The depth and width coincide with the smallest configuration of the GPT-2 report — PAPER-REPORTED (R5.2, Table 2): 117M parameters, 12 layers, d_model 768 — but that model has V = 50,257, tied embeddings and LayerNorm, so its count differs from the table below.

```figure
id: fig-5.27
kind: stat-panel
title: Reference configuration and its headline totals
caption: >-
  The configuration is ASSUMED and illustrative, not a named model; every
  total below it is a formula over the configuration rows. Note the last two
  rows: a single sequence's cache reaches the size of the tied weights at
  about 6k tokens, and one forward token costs 257 MFLOP of which the head
  alone is almost a fifth.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.21", "DERIVED:eq-5.22", "DERIVED:eq-5.23"]
alt: >-
  Instrument panel for the chapter's illustrative reference configuration,
  not a named model: L = 12, D = 768, H = 12, Dh = 64, F = 3072 (SwiGLU
  F_g = 2048), V = 32,000, T_max = 1024, training B × T = 8 × 1024, BF16.
  Parameters tied 110,316,288; untied 134,892,288; non-embedding N in the P08
  convention 84,953,856. Tied BF16 weights about 210 MiB. KV cache 36 KiB per
  token. A single sequence's cache equals the tied weights at about 5,985
  tokens. Forward FLOPs per token at T = 1024 under a full mask about
  257 MFLOP. A block glyph splits the untied parameters into token embedding
  (24.6 M), position table (0.8 M), the 12 blocks (85.0 M) and the untied head
  (24.6 M).
spec:
  header: "REFERENCE CONFIG · BF16 · ILLUSTRATIVE"
  variables: { L: 12, D: 768, H: 12, F: 3072, V: 32000, Tmax: 1024, T: 1024, b: 2 }
  rows:
    - { key: "layers L", value: "12" }
    - { key: "width D · heads H · Dh", value: "768 · 12 · 64" }
    - { key: "d_ff F", value: "3072 (SwiGLU F_g 2048)" }
    - { key: "vocabulary V · T_max", value: "32,000 · 1024" }
    - { key: "training B × T", value: "8 × 1024" }
    - { key: "params, tied (Eq. 5.22)", formula: "V*D + Tmax*D + L*(4*D^2 + 2*D*F + 2*D) + D", format: integer }
    - { key: "params, untied", formula: "V*D + Tmax*D + L*(4*D^2 + 2*D*F + 2*D) + D + D*V", format: integer }
    - { key: "non-embedding N (P08)", formula: "L*(4*D^2 + 2*D*F + 2*D) + D", format: integer }
    - { key: "weights, tied, BF16", formula: "(V*D + Tmax*D + L*(4*D^2 + 2*D*F + 2*D) + D)*b", format: bytes }
    - { key: "KV cache per token (Eq. 5.21)", formula: "2*L*H*(D/H)*b", format: bytes }
    - { key: "cache = tied weights at s", formula: "(V*D + Tmax*D + L*(4*D^2 + 2*D*F + 2*D) + D)*b/(2*L*D*b)", format: tokens }
    - { key: "fwd FLOPs/token, T = 1024", formula: "2*L*(4*D^2 + 2*D*F) + 2*D*V + 4*L*T*D", format: flops, note: "full mask, Eq. 5.23" }
  glyph:
    type: blocks
    items:
      - { label: "token embedding E", weight: 24576000 }
      - { label: "position table P", weight: 786432 }
      - { label: "12 blocks", weight: 84953088, emphasis: true }
      - { label: "untied head W_out", weight: 24576000 }
```

$$
N = VD + T_{\max}D + L\,(4D^{2} + 2DF + 2D) + D + [\,DV\,]_{\text{untied}}
$$
*(Eq. 5.22)* where the bracket is present only for an untied head; norm gains are counted; no biases.

```figure
id: fig-5.28
kind: calculator
title: Parameter count by component
caption: >-
  The defaults reproduce the untied total of the parameter table,
  134,892,288; the tied preset gives 110,316,288. Watch the embedding-plus-head
  share: 36% untied and 22% tied at V = 32,000, because V/D is large at this
  width. Raise D and the share falls; raise V and it climbs, which is why
  vocabulary size is a compute decision. Illustrative configuration, not a
  named model.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.22"
alt: >-
  Calculator for Eq. 5.22 over blocks L, width D, FFN width F, vocabulary V,
  position-table length T_max and an untied-head switch. At the defaults
  (L = 12, D = 768, F = 3072, V = 32,000, T_max = 1024, untied) the blocks hold
  84,953,088 parameters, the total is 134,892,288, non-embedding N is
  84,953,856, the embedding and head are 36.4% of the total, and the BF16
  weights occupy about 257 MiB. With the head tied the total is 110,316,288,
  the embedding share 22.3%, and the weights about 210 MiB.
spec:
  tex: >-
    N = VD + T_{\max}D + L\,(4D^{2} + 2DF + 2D) + D + [\,DV\,]_{\text{untied}}
  equation: "5.22"
  inputs:
    - { symbol: L, label: "blocks L", default: 12, min: 1, max: 96, step: 1, format: integer }
    - { symbol: D, label: "width D", default: 768, min: 256, max: 4096, options: [256, 512, 768, 1024, 1536, 2048, 4096], format: integer }
    - { symbol: F, label: "FFN width F", default: 3072, min: 1024, max: 16384, options: [1024, 2048, 3072, 4096, 6144, 8192, 16384], format: integer }
    - { symbol: V, label: "vocabulary V", default: 32000, min: 1000, max: 256000, step: 1000, format: integer }
    - { symbol: Tmax, label: "position table T_max", default: 1024, min: 128, max: 131072, scale: log2, format: tokens }
    - { symbol: u, label: "head: 1 untied, 0 tied", default: 1, min: 0, max: 1, options: [0, 1], format: integer }
  outputs:
    - { symbol: Nb, label: "all blocks, L·(4D² + 2DF + 2D)", formula: "L*(4*D^2 + 2*D*F + 2*D)", format: integer }
    - { symbol: N, label: "total parameters", formula: "V*D + Tmax*D + Nb + D + u*D*V", format: integer, emphasis: true }
    - { symbol: Nne, label: "non-embedding N, P08 convention", formula: "Nb + D", format: integer }
    - { symbol: E, label: "embedding + head share", formula: "V*D*(1 + u)/N", format: percent }
    - { symbol: W, label: "weights in BF16", formula: "2*N", format: bytes }
  presets:
    - { label: "tied head", values: { u: 0 } }
```

$$
\text{FLOPs}_{\text{fwd/token}} = \underbrace{2L(4D^{2} + 2DF)}_{2N_{\text{blocks}}} + 2DV + \underbrace{4LTD}_{\text{scores, full mask}}
$$
*(Eq. 5.23)* where the first term is the weight-GEMM term, the second the head, the third the two score matmuls of §5.2 per token; under a causal mask that skips masked work the third term averages `2L(T+1)D`.

$$
\text{FLOPs}_{\text{train/token}} \approx 3\times\text{FLOPs}_{\text{fwd/token}} = 6N_{\text{blocks}} + 6DV + 12LTD
$$
*(Eq. 5.24)* where the factor 3 is Eq. 5.19; with full activation recomputation add one more forward: `8N_blocks + …`.

$$
M_{\text{act/block}} = B\,T\,b\,\big(\alpha D + \beta F\big) + B\,H\,T^{2}\,b\,\gamma
$$
*(Eq. 5.25)* where α, β, γ count retained tensors of each shape; for the reference block without recomputation and with materialised attention, α = 8 (n, Q, K, V, C, a-input, n_ffn, f-input), β = 2 (u, v), γ = 1 (P); with a non-materialising kernel γ = 0.

> **Definition — 2N-per-token rule.** The approximation `FLOPs_fwd/token ≈ 2N` (and `6N` for training) obtained from Eq. 5.23–5.24 by dropping the score term and counting the head inside N; valid when `4LTD ≪ 2N`, i.e. `T ≪ N/(2LD)`.

## Mechanism

**Parameters.** Evaluating Eq. 5.22:

| Component | Tensor(s) | Shape | Parameters |
|---|---|---|---|
| Token embedding | E | [32,000, 768] | 24,576,000 |
| Position table | P | [1024, 768] | 786,432 |
| Attention (per block) | W_Q, W_K, W_V, W_O | 4 × [768, 768] | 2,359,296 |
| FFN (per block) | W_1, W_2 | [768, 3072], [3072, 768] | 4,718,592 |
| Norms (per block) | γ_att, γ_ffn | 2 × [768] | 1,536 |
| Per block total | | | 7,079,424 |
| All blocks (L = 12) | | | 84,953,088 |
| Final norm | γ_L | [768] | 768 |
| Output head (untied) | W_out | [768, 32,000] | 24,576,000 |
| **Total, tied** | | | **110,316,288** |
| **Total, untied** | | | **134,892,288** |

MATHEMATICALLY-DERIVED. The embedding and head are 22% (tied) or 36% (untied) of the total; non-embedding parameters (P08's N) are 84,953,856 including the final norm. The SwiGLU switch (F_g = 2048, three matrices) leaves every row unchanged (§5.3).

**FLOPs per token.** Evaluating Eq. 5.23:

| Term | Expression | Value (FLOPs/token) |
|---|---|---|
| Attention projections | 2·L·4D² | 56,623,104 |
| FFN GEMMs | 2·L·2DF | 113,246,208 |
| Weight-GEMM subtotal | 2·N_blocks | 169,869,312 |
| Output head | 2·D·V | 49,152,000 |
| Score matmuls, full mask, T = 1024 | 4·L·T·D | 37,748,736 |
| Score matmuls, causal average | 2·L·(T+1)·D | 18,892,800 |
| Forward total (full mask) | | 256,770,048 |
| Training total (×3, full mask) | | 770,310,144 |

MATHEMATICALLY-DERIVED. The score term is 22% of the weight-GEMM term at T = 1024 under a full mask and 11% under a causal kernel that skips masked work; the head is 29% — large because V/D is large at this width. The 2N rule with N = 110.3M (tied) gives 220.6 MFLOPs; the full-mask forward total exceeds it by 16% and the causal-average total by 7.8% (the 2N-rule residual, measured relative to 2N as Algorithm 5.7 defines it); PAPER-REPORTED (P08, §2.1): the paper's `C_forward ≈ 2N + 2·n_layer·n_ctx·d_attn` counts non-embedding N and a single context-dependent term, and states that for `d_model > n_ctx/12` the context-dependent cost is a relatively small fraction, adopting `C ≈ 6N` per training token. The reference configuration has D = 768 against `n_ctx/12 = 85`, well inside that regime. This chapter's score term `4LTD` counts both the QKᵀ and the PV matmul and is therefore twice P08's `2·n_layer·n_ctx·d_attn`; the difference is an accounting convention, not a disagreement about the arithmetic. DERIVED.

```figure
id: fig-5.29
kind: calculator
title: Forward and training FLOPs per token
caption: >-
  The defaults reproduce the FLOP table row by row: 169,869,312 for the weight
  GEMMs, 49,152,000 for the head, 37,748,736 for the scores, 256,770,048
  forward and 770,310,144 training. The last output is the ratio the 2N rule
  ignores, 22% here. The T = 8192 preset pushes it past 100%, and the causal
  preset halves it. Executes Eq. 5.23 and Eq. 5.24; illustrative
  configuration, not a named model.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.23", "DERIVED:eq-5.24"]
alt: >-
  Calculator for Eq. 5.23 and 5.24 over blocks L, width D, FFN width F,
  vocabulary V, sequence length T and a score-term switch (full mask or
  causal skipping). At the defaults (L = 12, D = 768, F = 3072, V = 32,000,
  T = 1024, full mask): weight-GEMM FLOPs 169,869,312, head 49,152,000,
  score matmuls 37,748,736, forward 256,770,048, training 770,310,144 per
  token, and the score term is 22.2% of the weight-GEMM term. With the causal
  switch the score term is 18,892,800 (11.1%). At T = 8192 with a full mask
  it is 301,989,888, about 178% of the weight-GEMM term.
spec:
  tex: >-
    \text{FLOPs}_{\text{fwd}} = 2L(4D^{2} + 2DF) + 2DV + 4LTD,\qquad \text{FLOPs}_{\text{train}} \approx 3\,\text{FLOPs}_{\text{fwd}}
  equation: "5.23"
  inputs:
    - { symbol: L, label: "blocks L", default: 12, min: 1, max: 96, step: 1, format: integer }
    - { symbol: D, label: "width D", default: 768, min: 256, max: 4096, options: [256, 512, 768, 1024, 1536, 2048, 4096], format: integer }
    - { symbol: F, label: "FFN width F", default: 3072, min: 1024, max: 16384, options: [1024, 2048, 3072, 4096, 6144, 8192, 16384], format: integer }
    - { symbol: V, label: "vocabulary V", default: 32000, min: 1000, max: 256000, step: 1000, format: integer }
    - { symbol: T, label: "sequence length T", default: 1024, min: 128, max: 131072, scale: log2, format: tokens }
    - { symbol: c, label: "scores: 0 full mask, 1 causal skip", default: 0, min: 0, max: 1, options: [0, 1], format: integer }
  outputs:
    - { symbol: Wg, label: "weight GEMMs, 2·N_blocks", formula: "2*L*(4*D^2 + 2*D*F)", format: integer }
    - { symbol: Hd, label: "output head, 2·D·V", formula: "2*D*V", format: integer }
    - { symbol: Sc, label: "score matmuls", formula: "(1 - c)*4*L*T*D + c*2*L*(T + 1)*D", format: integer }
    - { symbol: Fw, label: "forward FLOPs per token (Eq. 5.23)", formula: "Wg + Hd + Sc", format: integer, emphasis: true }
    - { symbol: Tr, label: "training FLOPs per token (Eq. 5.24)", formula: "3*Fw", format: integer }
    - { symbol: R, label: "score term ÷ weight-GEMM term", formula: "Sc/Wg", format: percent }
  presets:
    - { label: "T = 8192", values: { T: 8192 } }
    - { label: "causal-skipping kernel", values: { c: 1 } }
```

```figure
id: fig-5.30
kind: chart
title: Error of the 2N rule against sequence length
caption: >-
  The residual of Algorithm 5.7, (forward − 2N)/2N with the tied N, is 16% at
  T = 1024 under a full mask and 7.8% under a causal-skipping kernel. The
  score term equals the weight-GEMM term at T = 4608, and by T = 8192 the
  rule undercounts by 136%. Use 2N only well to the left of the crossing.
  Illustrative configuration, not a named model.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.23", "DERIVED:alg-5.7"]
alt: >-
  Log–log line chart of the 2N-rule residual, (forward FLOPs per token − 2N)
  divided by 2N with N = 110,316,288, against sequence length T from 128 to
  16,384, for L = 12, D = 768, F = 3072, V = 32,000. Under a full mask the
  residual is 1.4% at T = 128, 16.4% at T = 1024, 136% at T = 8192 and 273% at
  T = 16,384. With causal skipping it is 0.35% at T = 128, 7.8% at T = 1024
  and about 68% at T = 8192. The score term equals the weight-GEMM term at
  T = 4608.
spec:
  type: line
  x: { label: "sequence length T", scale: log2, format: tokens, domain: [128, 16384] }
  y: { label: "(forward FLOPs − 2N) / 2N", scale: log10, format: percent }
  variables: { L: 12, D: 768, F: 3072, V: 32000, N: 110316288 }
  series:
    - { id: full, label: "full mask, 4·L·T·D", formula: "(2*L*(4*D^2 + 2*D*F) + 2*D*V + 4*L*x*D - 2*N)/(2*N)", sample: { from: 128, to: 16384, count: 8 }, emphasis: true }
    - { id: causal, label: "causal skipping, 2·L·(T+1)·D", formula: "(2*L*(4*D^2 + 2*D*F) + 2*D*V + 2*L*(x + 1)*D - 2*N)/(2*N)", sample: { from: 128, to: 16384, count: 8 } }
  annotations:
    - { x: 1024, label: "+16% full · +7.8% causal" }
    - { x: 4608, label: "score term = weight-GEMM term" }
    - { x: 8192, label: "+136%, full mask" }
```

**Activation shapes and bytes** (B = 8, T = 1024, BF16; one block; materialised attention; no recomputation):

| Tensor | Shape | Elements | Bytes |
|---|---|---|---|
| Residual stream / any [B, T, D] | [8, 1024, 768] | 6,291,456 | 12 MiB |
| Q, K, V, C (4 tensors) | 4 × [8, 12, 1024, 64] | 25,165,824 | 48 MiB |
| Scores S / probabilities P (each) | [8, 12, 1024, 1024] | 100,663,296 | 192 MiB |
| FFN hidden u, v (each) | [8, 1024, 3072] | 25,165,824 | 48 MiB |
| Retained per block (α = 8, β = 2, γ = 1) | | | 96 + 96 + 192 = 384 MiB |
| Retained, all 12 blocks | | | 4.5 GiB |
| Retained, all blocks, γ = 0 (fused attention) | | | 2.25 GiB |
| Logits [B, T, V] in FP32 for the loss | [8, 1024, 32,000] | 262,144,000 | 1000 MiB |

MATHEMATICALLY-DERIVED. The single P tensor per block is half of the retained set at this T; at T = 8192 it would be 12 GiB per block against 1.5 GiB for the rest, which is the quantitative content of "attention memory is the O(T²) term". The FP32 logits tensor is larger than all weights combined — a well-known reason to fuse the head with the loss or to chunk it over T.

```figure
id: fig-5.31
kind: memory-stack
title: Retained training activations, materialised and fused attention
caption: >-
  Eq. 5.25 summed over 12 blocks at B = 8, plus the FP32 logits. At
  T = 1024 the P segment alone is half of the retained blocks, 2.25 of
  4.5 GiB. At T = 8192 it is 144 GiB, the segment that carries the bar across
  the hairline; removing it with a non-materialising kernel (γ = 0) brings the
  bar back under. Gradients and optimiser state (Eq. N.5) are not included. The
  80 GiB line is an illustrative budget, not a product specification, and the
  configuration is illustrative, not a named model.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.25"
alt: >-
  Four stacked bars of retained training activations for all 12 blocks at
  B = 8, D = 768, F = 3072, H = 12, V = 32,000 and 2 bytes per value, with
  FP32 logits added. T = 1024 with materialised attention: eight [B, T, D]
  tensors per block 1.125 GiB, two [B, T, F] tensors per block 1.125 GiB,
  probabilities P 2.25 GiB, FP32 logits about 0.98 GiB. T = 1024 fused
  (γ = 0): the same without P. T = 8192 materialised: 9 GiB, 9 GiB, 144 GiB
  for P and about 7.8 GiB of logits, far above an illustrative 80 GiB budget
  line. T = 8192 fused: about 25.8 GiB, under the line.
spec:
  format: bytes
  variables: { L: 12, B: 8, D: 768, F: 3072, H: 12, V: 32000, b: 2, T1: 1024, T2: 8192, alpha: 8, beta: 2 }
  bars:
    - label: "T = 1024, materialised (γ = 1)"
      segments:
        - { label: "α = 8 [B, T, D] per block", kind: tensor, formula: "L*alpha*B*T1*D*b" }
        - { label: "β = 2 [B, T, F] per block", kind: tensor, formula: "L*beta*B*T1*F*b" }
        - { label: "P [B, H, T, T] per block", kind: tensor, formula: "L*B*H*T1^2*b" }
        - { label: "FP32 logits [B, T, V], once", kind: tensor, formula: "B*T1*V*4" }
    - label: "T = 1024, fused (γ = 0)"
      segments:
        - { label: "α = 8 [B, T, D] per block", kind: tensor, formula: "L*alpha*B*T1*D*b" }
        - { label: "β = 2 [B, T, F] per block", kind: tensor, formula: "L*beta*B*T1*F*b" }
        - { label: "FP32 logits [B, T, V], once", kind: tensor, formula: "B*T1*V*4" }
    - label: "T = 8192, materialised (γ = 1)"
      segments:
        - { label: "α = 8 [B, T, D] per block", kind: tensor, formula: "L*alpha*B*T2*D*b" }
        - { label: "β = 2 [B, T, F] per block", kind: tensor, formula: "L*beta*B*T2*F*b" }
        - { label: "P [B, H, T, T] per block", kind: tensor, formula: "L*B*H*T2^2*b" }
        - { label: "FP32 logits [B, T, V], once", kind: tensor, formula: "B*T2*V*4" }
    - label: "T = 8192, fused (γ = 0)"
      segments:
        - { label: "α = 8 [B, T, D] per block", kind: tensor, formula: "L*alpha*B*T2*D*b" }
        - { label: "β = 2 [B, T, F] per block", kind: tensor, formula: "L*beta*B*T2*F*b" }
        - { label: "FP32 logits [B, T, V], once", kind: tensor, formula: "B*T2*V*4" }
  budget: { label: "illustrative 80 GiB device, not a product spec", formula: "80*2^30" }
```

**First memory trace** (single sequence, BF16, inference):

```text
Systems trace — reference model, inference, one sequence
stage        → latency        / memory                              / compute            / communication / failure
weights      → read per step  / 210.4 MiB tied · 257.3 MiB untied   / —                  / none          / OOM at load
prefill S=1024 → one pass     / cache written 36 MiB; peak act ~ P   / 2N·S + 2L·S²·D     / none          / score OOM at large S
cache/token  → —              / 36,864 B = 36 KiB (Eq. 5.21)        / —                  / none          / indexing error
decode step s → bandwidth-bound / reads weights + 36 KiB·s          / 2N + 4·L·s·D       / none          / position offset
```

MATHEMATICALLY-DERIVED: tied weights 110,316,288 × 2 B = 220,632,576 B = 210.4 MiB; cache 2·12·12·64·2 = 36,864 B per token; at s = 1024, 37,748,736 B = 36 MiB. The cache reaches the size of the tied weights at s ≈ 5,985 tokens — the crossover at which a decode step reads more cache than weights. Training memory adds gradients, optimiser state and the activations above; with an FP32 master copy and two FP32 Adam moments the per-parameter state is 16 bytes plus the BF16 working copy, but that sum is Eq. N.5's subject and is not totalled here (ASSUMED constants; [§29.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-1-data-state-parallelism.md), [§30.2](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-2-memory-management.md)).

## Algorithm

```text
Algorithm 5.7 — Trace-driven accounting
INPUT   configuration (L, D, H, F, V, T_max, tied); mode ∈ {train, prefill, decode}; B, T (or s); b, b_w
OUTPUT  tables: parameters by component; FLOPs per token; bytes by tensor
INVARIANT every FLOP entry corresponds to one matmul line of the §5.1 trace with cost 2·m·n·p (R5.11 rule)
1.  for each trace line with a weight: params ← product of weight shape; flops ← 2 × params per token
2.  for each batched matmul without a weight (scores, PV): flops ← 2·T·Dh per head per token; × H × L
3.  for each retained tensor in the mode: bytes ← product of shape × b
4.  if mode == decode: bytes_read ← N·b_w + 2·L·s·H·Dh·b; flops ← 2N + 4·L·s·D
5.  sum by component; report the 2N-rule residual = (total − 2N)/2N
TERMINATION: finite line list.
```

Complexity: O(number of trace lines). Implementation: `accounting.py`, producing `accounting.csv` ([verification.md](verification.md)).

## Implementation

Tensors → operators: parameter counts come from `sum(p.numel() for p in model.parameters())` and must equal Eq. 5.22 — the artifact asserts this. FLOPs are counted from shapes, not from a profiler; a profiler's count is a measurement of what a kernel did (including padding and recomputation) and belongs to [§26.3](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/26-3-core-operators.md). Framework: PyTorch. Kernels: the bytes table assumes materialised attention; with a fused kernel γ = 0 and the P row disappears from retained memory while its recomputation adds to backward FLOPs (§27.1). Memory: allocator reserve and fragmentation are additional and NOT-DISCLOSED for any given runtime until measured ([§42.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-2-state-accounting.md)). Communication: none. Deployment: the same tables with H_kv < H, paged cache, and quantised weights are Chapter 42's estimator.

> **Implementation note [impl.pytorch · 2.14.0 documentation, execution UNVERIFIED].** Tied embeddings are implemented by assigning `head.weight = embedding.weight`; `parameters()` then yields the shared tensor once, so the count is the tied row of the table.

## Experimental design

Proposal. Run Algorithm 5.7 on the reference configuration and compare against (i) `numel()` for parameters (exact match required), (ii) a profiler's GEMM FLOP count for one forward pass (expected to match Eq. 5.23 within the element-wise term and any padding), (iii) peak allocated bytes for one training step with and without a fused attention kernel (expected difference ≈ 192 MiB × L at B = 8, T = 1024). Any residual is the runtime's overhead and is reported, not absorbed.

## Observations

**What the paper claims.** PAPER-REPORTED (P08, §2.1 and Table 1): non-embedding parameters `N ≈ 12·n_layer·d_model²` with the standard `d_attn = d_ff/4 = d_model`, forward compute `2N + 2·n_layer·n_ctx·d_attn` per token, and `C ≈ 6N` per training token with the backward pass approximated as twice the forward. OFFICIAL-DOCUMENTATION (R5.11, §3.5): the CS336 handout states the `2mnp` FLOPs rule for an `[m, n] × [n, p]` product and poses the accounting exercise for a GPT-2 XL-shaped configuration (V = 50,257, context 1,024, 48 layers, d_model 1,600, 25 heads, d_ff 4,288). PAPER-REPORTED (P01, Table 3): 65 × 10⁶ parameters for the base model.

**What the evidence shows.** The identities are arithmetic; the 12·L·D² form reproduces this chapter's `4D² + 2DF = 12D²` per block at F = 4D exactly. The regime condition `d_model ≫ n_ctx/12` is P08's stated modelling choice and its empirical adequacy for their fits is their claim; at T = 8192 with D = 768 the score term would exceed the weight term and the 2N rule would fail by more than 100%, which the reader can verify from Eq. 5.23.

**What we infer.** DERIVED: (1) for the reference configuration the head is the single largest per-token FLOP item after the FFN, so vocabulary size is a compute decision ([§10.3](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md)); (2) the score tensor dominates training memory already at T = 1024, so a non-materialising attention kernel halves retained activations before any recomputation policy; (3) cache bytes overtake weight bytes at s ≈ 6k tokens, so decode cost at long context is set by L·H_kv·Dh, not by N.

**What remains unknown.** NOT-DISCLOSED: runtime workspace and allocator overheads; UNVERIFIED: the profiler-measured FLOPs and peak bytes of the artifact on any accelerator.

## Failure modes

> **Failure mode — 2N applied outside its regime.** *Symptom:* measured training throughput far below the MFU implied by 6N. *Cause:* score term ignored at long T. *Detection:* compute `4LTD/(2N)`; if it is not ≪ 1, the rule is invalid. *Mitigation:* use Eq. 5.23 in full.

> **Failure mode — embedding double-count.** *Symptom:* tied model reports the untied count. *Cause:* counting E and W_out separately when they alias. *Detection:* `numel()` over `parameters()` versus a manual sum. *Mitigation:* Algorithm 5.7 line 1 with aliasing respected.

> **Failure mode — unit confusion.** *Symptom:* memory estimates off by 7%. *Cause:* MiB versus MB. *Detection:* state units (this chapter uses binary units per [notation.md](../../../front-matter/notation.md)). *Mitigation:* carry bytes, convert once.

## Siblings

**Parameter/FLOP model across dense families** — [§13.2](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-2-width-depth-and-heads.md)
Why it exists: choosing (L, D, H, F) jointly. What assumption changed: the configuration is a variable, not a constant. What objective changed: quality per FLOP. What problem it solved: allocation. What new failure mode it introduced: matched-N comparisons that are not matched-cost. Changed primitive: one table → a function of the configuration.

**Training-memory accounting (Eq. N.5)** — [§29.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-1-data-state-parallelism.md)
Why it exists: optimiser state and sharding. What assumption changed: multiple devices, several dtypes per term. What objective changed: fit and throughput. What problem it solved: per-term sharding factors. What new failure mode it introduced: communication buffers. Changed primitive: single-device sum → sharded sum.

**Inference state accounting (Eq. N.8)** — [§42.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-2-state-accounting.md)
Why it exists: many sequences, paged cache, reserve. What assumption changed: B sequences of unequal length. What objective changed: capacity. What problem it solved: predicting admissible concurrency. What new failure mode it introduced: fragmentation. Changed primitive: per-token increment → allocator-level totals.

## Extensions

Domain adaptation: unchanged. Long context: re-evaluate Eq. 5.23 and Eq. 5.25 at the target T; the tables do not extrapolate. Multimodal: add encoder tables with their own D. MoE: replace the FFN row by E experts with an activated count ([§16.4](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-4-capacity-and-execution.md)). Proposals only.

## Limitations

Valid for the stated configuration and conventions (no biases, materialised attention unless stated, BF16). The FLOP counts omit norms, softmax, activations and reductions, which are O(T²) in operations for the softmax and can matter in kernel time even when they do not in FLOPs. Falsification: a `numel()` mismatch with the tied or untied row falsifies the trace, not the arithmetic.

## Reproducibility

`accounting.py` and `accounting.csv` in [verification.md](verification.md); configuration table above; all values are exact integers or binary-unit conversions of them. Unresolved: runtime overheads.

## References

P01 · P08 · R5.2 · R5.11 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
