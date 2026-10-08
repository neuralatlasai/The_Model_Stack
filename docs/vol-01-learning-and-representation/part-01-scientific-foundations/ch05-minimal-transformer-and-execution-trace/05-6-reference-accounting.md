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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 5.6 Reference accounting

## Scope

Parameter count, arithmetic, resident storage, retained activations, and memory traffic measure different properties of an execution. This section derives each from the decoder trace in 5.1, with an explicit distinction between a dense matrix's unique parameters and the number of times it is applied. It then evaluates one declared configuration, including weight sharing, causal work, the last-row vocabulary projection during prefill, and the lifetime of cached tokens. The calculation is analytical; it is neither an undisclosed production configuration nor an accelerator benchmark. (MATHEMATICALLY-DERIVED: Eq. 5.22-5.25; PAPER-REPORTED context: P08 section 2.1/Table 1; P19 section 3.)

Architecture allocation across families is developed in Chapter 13, sharded training state in Chapters 29-30, and serving capacity in Chapter 42. The present calculation provides the component identities those treatments require; substituting a reported model's dimensions also requires substituting its actual biases, normalization, positional mechanism, head sharing, and FFN variant.

## Why this exists

A tied vocabulary matrix is stored once but participates in both input lookup and output projection. Those operations have different arithmetic: lookup selects rows, whereas a full vocabulary head multiplies every output channel. Counting every stored scalar as a dense multiply therefore overcounts learned positions and input-only embeddings, while omitting the head from a non-embedding compute convention can undercount a small decoder with a large vocabulary.

Sequence-dependent work creates another distinction. Full attention computes a number of token pairs quadratic in sequence length; the cache stores a number of vectors linear in consumed tokens. A non-materializing attention kernel can remove quadratic intermediate storage while retaining quadratic full-attention arithmetic. P08 uses an explicitly approximate non-embedding compute convention for scaling fits; P19 studies the input/output traffic of exact attention. Neither convention supplies a universal latency or peak-memory measurement for an arbitrary implementation. (PAPER-REPORTED: P08 Table 1/section 2.1; P19 Theorems1-2.)

## Intuition

For an [m, n] by [n, p] dense product, this chapter counts one multiplication and one addition per accumulation, giving 2mnp leading FLOPs. This convention omits the missing first addition in a literal dot product, as well as bias, activation, normalization, and reduction operations unless separately listed. A forward product and its two required input/weight gradient products have the same leading matrix arithmetic; this is the origin of the three-times-forward training approximation, rather than a statement about physical memory reads.

Storage follows unique live allocations, not FLOPs. A tensor contributes its element count times its actual storage bytes while it remains live; views do not create another copy. Traffic additionally depends on cache residency, reuse across a batch, fusion, layout conversions, and recomputation. The ideal decode read estimate below is a declared one-read model. It cannot establish bandwidth saturation without a device, kernel, batch, and timing protocol.

## Formulation

The analytical decoder has L=12 blocks, residual width d=768, H_q=H_kv=12, head width d_h=64, a bias-free two-matrix GELU FFN of width F=3072, vocabulary V=32000, and a learned absolute-position table of length T_max=1024. Each block has two d-element RMSNorm gains and there is one final gain. The training tensor example uses B=8 and T=1024. Weight, ordinary activation, and cache storage are BF16 (two bytes), while the separately listed logits are FP32 (four bytes). These are inputs to a calculation, not source-reported hyperparameters of a named model. A parameter-matched SwiGLU uses F_g=2048, with a different nonlinear graph and potentially different saved tensors (5.3).

Let N_resident count unique parameter scalars, N_block-mat count only block projection matrices, and N_dense include the block matrices plus one full vocabulary projection:

$$
N_{\rm resident}=Vd+T_{\max}d+L(4d^2+2dF+2d)+d+[Vd]_{\rm untied}.
$$
*(Eq. 5.22)*

Thus N_block-mat=L(4d^2+2dF)=84,934,656 and N_dense=N_block-mat+dV=109,510,656. These counts deliberately differ: an untied input embedding adds storage without adding a dense input projection; a tied head still incurs its projection FLOPs. RMSNorm gains and learned positions contribute to N_resident but not to N_dense.

For a forward pass that evaluates the vocabulary head at every position,

$$
C_{\rm fwd/token}=2L(4d^2+2dF)+2dV+4LTd
                 =2N_{\rm dense}+4LTd.
$$
*(Eq. 5.23; dense attention products before masking.)*

If the implementation skips all forbidden causal pairs, summing t valid keys for queries t=1,..., T replaces 4LTd by 2L(T+1)d. Actual tiled kernels can compute padded or boundary-tile entries, so the triangular count is ideal useful arithmetic, not an exact hardware instruction count. The leading training estimate is

$$
C_{\rm train/token}\approx3C_{\rm fwd/token}.
$$
*(Eq. 5.24)*

This requires both cotangents for each counted matrix product and excludes optimizer updates, elementwise work, padding, communication, and recomputation. Checkpointing adds the forward operators actually recomputed, rather than a universal percentage.

For a specified saved-tensor schedule with distinct allocations, one useful inventory is

$$
M_{\rm saved/block}=BTb(\alpha d+\beta F)+BH T^2b\gamma.
$$
*(Eq. 5.25; a conditional inventory, not a universal autograd formula.)*

Here alpha, beta, and gamma count distinct simultaneously retained tensors of the indicated shapes. The example below declares eight residual-sized tensors, two FFN-sized tensors, and one probability tensor. A fused kernel has its own saved inputs/statistics and recomputation schedule; setting gamma=0 illustrates removal of that probability allocation, but does not specify its complete peak.

```figure
id: fig-5.27
kind: stat-panel
title: Reference configuration and its headline totals
caption: >-
  The analytical reference has 110316288 tied or134892288 untied unique
  parameters. N_dense=109510656 counts matrices used by dense projections,
  not all resident storage. Cache growth is 36 KiB per consumed token. The
  ideal dense-matrix/cache read crossing lies beyond T_max=1024 and cannot
  be executed without changing the positional specification.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.21", "DERIVED:eq-5.22", "DERIVED:eq-5.23"]
alt: >-
  Analytical dimensions L=12, d=768, H=12, F=3072, V=32000, T_max=1024.
  Unique tied parameters110316288; untied134892288. Dense projection
  matrix count109510656. Tied BF16 storage210.4116 MiB. Cache growth
  36 KiB per consumed token. Dense forward at T=1024 costs256770048
  leading FLOPs per token, with all head rows evaluated.
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
    - { key: "N_dense: projection matrices plus head", formula: "L*(4*D^2 + 2*D*F) + D*V", format: integer }
    - { key: "weights, tied, BF16", formula: "(V*D + Tmax*D + L*(4*D^2 + 2*D*F + 2*D) + D)*b", format: bytes }
    - { key: "KV cache per token (Eq. 5.21)", formula: "2*L*H*(D/H)*b", format: bytes }
    - { key: "ideal read crossing; beyond T_max", formula: "(L*(4*D^2 + 2*D*F) + D*V)/(2*L*D)", format: tokens }
    - { key: "fwd FLOPs/token, T = 1024", formula: "2*L*(4*D^2 + 2*D*F) + 2*D*V + 4*L*T*D", format: flops, note: "full mask, Eq. 5.23" }
  glyph:
    type: blocks
    items:
      - { label: "token embedding E", weight: 24576000 }
      - { label: "position table P", weight: 786432 }
      - { label: "12 blocks", weight: 84953088, emphasis: true }
      - { label: "untied head W_out", weight: 24576000 }
```

```figure
id: fig-5.28
kind: calculator
title: Parameter count by component
caption: >-
  Unique parameter totals include learned positions and gain-only norms.
  Tying removes a second vocabulary allocation but retains head arithmetic.
  Vocabulary/head share is 36.4% untied or22.3% tied at these dimensions.
  The separate N_dense output excludes input-only embeddings, positions,
  and gains; it is not P08's non-embedding parameter convention.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.22"
alt: >-
  Eq. 5.22 parameter calculator. Defaults give 134892288 untied or110316288
  tied unique scalars. Block parameters including gains are 84953088.
  Dense projection matrices plus head contain109510656 scalars. BF16
  resident storage is 257.2866 MiB untied or210.4116 MiB tied.
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
    - { symbol: Nne, label: "N_dense: matrices plus head", formula: "L*(4*D^2 + 2*D*F) + D*V", format: integer }
    - { symbol: E, label: "embedding + head share", formula: "V*D*(1 + u)/N", format: percent }
    - { symbol: W, label: "weights in BF16", formula: "2*N", format: bytes }
  presets:
    - { label: "tied head", values: { u: 0 } }
```

## Mechanism

### Methodology

Count unique parameter storage first, and then count each operator application. The reference gives the following exact integers; the gain-only RMSNorm and absence of projection biases are part of the specification.

| Component | Shape or count | Parameters |
|---|---|---:|
| Token embedding E | [32000,768] | 24,576,000 |
| Learned positions | [1024,768] | 786,432 |
| Attention matrices per block | four [768,768] matrices | 2,359,296 |
| FFN matrices per block | [768,3072] and [3072,768] | 4,718,592 |
| RMSNorm gains per block | two [768] vectors | 1,536 |
| All twelve blocks, including gains | 12 times 7,079,424 | 84,953,088 |
| Final gain | [768] | 768 |
| Additional head when untied | [768,32000] | 24,576,000 |
| **Unique parameters, tied** | Eq. 5.22 | **110,316,288** |
| **Unique parameters, untied** | Eq. 5.22 | **134,892,288** |

Tied BF16 parameter storage is 220,632,576 bytes, or 210.4116 MiB; untied storage is 257.2866 MiB. The tied embedding/head allocation is about22.3% of parameters, and the two untied allocations together are about36.4%. Increasing width also changes block matrices quadratically, so a vocabulary-share comparison must declare which dimensions remain fixed. Matching SwiGLU projection parameters does not establish matching activation storage or latency.

| Forward term, per token | Leading FLOPs |
|---|---:|
| All attention projections | 56,623,104 |
| All FFN projections | 113,246,208 |
| Full vocabulary head | 49,152,000 |
| Attention pair products, dense T=1024 | 37,748,736 |
| Attention pair products, ideal causal T=1024 | 18,892,800 |
| **Dense forward total** | **256,770,048** |
| **Ideal causal forward total** | **237,914,112** |
| Dense leading training estimate, times three | 770,310,144 |

The head is smaller than both the combined FFN projections and the combined attention projections in this configuration. The dense pair term is about17.2% of 2N_dense; relative to all block projection work alone it is about22.2%. A ratio must name its denominator. Comparing the dense total with 2N_resident mixes storage and operator conventions; the cleaner residual is (C_fwd-2N_dense)/(2N_dense).

### Tensor storage and lifetime

At B=8, T=1024, one BF16 [B, T, d] allocation is 12 MiB; Q, K, V together occupy36 MiB and the merged context another12 MiB if separately stored. One [B, H, T, T] allocation is 192 MiB. A materialized implementation can temporarily hold scores and probabilities simultaneously, giving384 MiB for those two allocations alone. Each [B, T, F] BF16 FFN allocation is 48 MiB. FP32 [B, T, V] logits contain262,144,000 elements and occupy1000 MiB.

An explicitly chosen saved inventory is h_prev, n_att, Q, K, V, C, h_mid, n_ffn (eight residual-sized allocations), plus FFN preactivation u and activated v (two FFN-sized allocations), plus attention probabilities P. If all are distinct and retained across the forward pass, Eq. 5.25 gives 384 MiB per block and 4.5 GiB across twelve blocks. Removing P from this inventory leaves192 MiB per block and 2.25 GiB across blocks, before kernel statistics, final-normalization/head state, backward temporaries, weights, optimizer state, and allocator reserve. This subtraction is an inventory identity; it is not a prediction that an executed fused implementation halves total training peak. Actual autograd saves, aliasing, fusion, and scheduling must be inspected.

At T=8192 the same hypothetical inventory's P allocations alone would total 144 GiB. That length exceeds the declared learned position table. The calculation is a storage sensitivity study for a reconfigured model, not an executable long-context setting of this reference.

### Prefill and decode

For one S=1024-token prompt, last-row-only head evaluation gives 193,341,554,688 leading FLOPs under ideal causal skipping; evaluating all prompt heads gives 243,624,050,688. These follow the separate prefill formula in 5.5, not 2N_resident times S. At B=1 the cached K/V for this consumed prompt is 36 MiB. Each additional consumed token adds36,864 bytes across layers, because 2L H_kv d_h b_kv=36 KiB.

A one-query decode step with s valid keys performs approximately 2N_dense+4Lsd leading FLOPs. Under an ideal one-read traffic model its large matrix/cache reads are N_dense b_w+2Lsd b_kv; input embedding gathers, gains, activations, output writes, and workspaces remain additional. With both storages two bytes, those two terms become equal at s=N_dense/(2Ld)=5941.333... . This lies beyond T_max=1024, so the crossing is counterfactual for the stated model. It also depends on batch reuse and memory hierarchy; it cannot establish a measured latency bottleneck. Comparing cache allocation with *resident* parameter allocation gives a different crossing, which is not a per-step traffic calculation.

For G>0 sampled tokens in the standard loop, the prompt is consumed once and the first G-1 sampled tokens are consumed by subsequent forward calls. The final sampled token need not be added to the cache, so its logical length is S+G-1, unless the implementation explicitly performs another consume operation. With G=0 there need be no prefill. Capacity counts consumed positions and must respect position-table bounds.

### Training state

A declared mixed-precision state with BF16 working parameters (2 bytes), BF16 gradients (2), an FP32 master copy (4), and two FP32 Adam moments (8) totals16 bytes per unique parameter. The BF16 working copy is already included. FP32 gradients instead make that total 18 bytes; all-FP32 parameters/gradients/moments total 16 bytes without an additional master copy. These are alternative storage specifications, not universally required framework layouts. Sharding, flattened buffers, gradient accumulation, and allocator behavior require further terms; Chapter 29 develops their distribution.

```figure
id: fig-5.29
kind: calculator
title: Forward and training FLOPs per token
caption: >-
  Dense all-row-head forward gives 256770048 leading FLOPs per token; the
  three-times-forward training approximation gives 770310144 before omitted
  operators and recomputation. Ideal triangular pair work gives 237914112
  forward. The displayed pair/block-projection ratio is 22.2%, which differs
  from the17.2% residual relative to2*N_dense. Long-length presets require
  a changed positional specification.
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
title: Pair-work residual relative to dense matrix arithmetic
caption: >-
  The residual is attention pair work divided by 2*N_dense, with the
  vocabulary head included in that dense-matrix count. At T=1024 it is 17.2%
  for dense products or8.63% for ideal triangular work. The dense pair term
  equals block projection work at T=4608; that is a different denominator.
  Lengths above 1024 are sensitivity calculations, not supported runs of the
  reference learned-position model.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.23", "DERIVED:alg-5.7"]
alt: >-
  Analytical pair-work residual versus sequence length, using
  N_dense=109510656. At T=128,1024,8192,16384 dense residuals are
  2.15%,17.24%,137.88%,275.76%; ideal causal residuals are 1.09%,8.63%,
  68.95%,137.89%. The position specification only supports1024 tokens.
spec:
  type: line
  x: { label: "sequence length T", scale: log2, format: tokens, domain: [128, 16384] }
  y: { label: "pair work / (2*N_dense)", scale: log10, format: percent }
  variables: { L: 12, D: 768, F: 3072, V: 32000, N: 109510656 }
  series:
    - { id: full, label: "full mask, 4·L·T·D", formula: "(2*L*(4*D^2 + 2*D*F) + 2*D*V + 4*L*x*D - 2*N)/(2*N)", sample: { from: 128, to: 16384, count: 8 }, emphasis: true }
    - { id: causal, label: "causal skipping, 2·L·(T+1)·D", formula: "(2*L*(4*D^2 + 2*D*F) + 2*D*V + 2*L*(x + 1)*D - 2*N)/(2*N)", sample: { from: 128, to: 16384, count: 8 } }
  annotations:
    - { x: 1024, label: "17.2% dense;8.63% ideal causal" }
    - { x: 4608, label: "score term = weight-GEMM term" }
    - { x: 8192, label: "137.9% dense;sensitivity beyond T_max" }
```

```figure
id: fig-5.31
kind: memory-stack
title: Conditional saved inventory with and without probabilities
caption: >-
  Eq. 5.25 inventories eight residual-sized, two FFN-sized, and optionally
  one probability allocation per block, plus FP32 logits. Removing P subtracts
  2.25 GiB at T=1024; it does not specify a fused kernel's complete saved
  state or guarantee halving peak. Weights, gradients, optimizer, workspace,
  and reserve are omitted. T=8192 exceeds this model's position table; the
  80 GiB line is an analytical budget, not a measured fit.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.25"
alt: >-
  Conditional saved-allocation bars at B=8 over 12 blocks. T=1024:
  residual-sized inventory1.125 GiB, FFN inventory1.125 GiB, P2.25 GiB,
  and FP32 logits1000 MiB. Removing P leaves the other declared terms,
  not an observed fused peak. At counterfactual T=8192, P alone is 144 GiB.
  Additional live allocations determine actual device capacity.
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
    - label: "T = 1024, P removed;other kernel state omitted"
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
    - label: "T = 8192, P removed;sensitivity only"
      segments:
        - { label: "α = 8 [B, T, D] per block", kind: tensor, formula: "L*alpha*B*T2*D*b" }
        - { label: "β = 2 [B, T, F] per block", kind: tensor, formula: "L*beta*B*T2*F*b" }
        - { label: "FP32 logits [B, T, V], once", kind: tensor, formula: "B*T2*V*4" }
  budget: { label: "illustrative 80 GiB device, not a product spec", formula: "80*2^30" }
```

## Algorithm

```text
Algorithm 5.7 - Trace-driven accounting with storage identity
INPUT: finite operator trace; unique allocation/alias map; tensor shapes and dtypes;
       parameter sharing; mode; B,T or consumed length s; head evaluation rows
OUTPUT: component parameters, leading FLOPs, allocation inventory, declared traffic estimate
INVARIANT: a parameter allocation is counted once; every operator application is counted;
           tensor bytes use actual dtype and unique live storage
1 Enumerate unique parameter allocations and sum products of their dimensions.
2 For each dense [m,n] x [n,p] operator application, add 2*m*n*p leading FLOPs.
3 Count attention pair products under the declared dense, triangular, or tiled work convention.
4 Count vocabulary projection only for the rows actually evaluated.
5 List saved and temporary allocations with their live intervals, aliases, and bytes.
6 Compute peak allocated bytes as the maximum sum of unique live allocations over time.
7 For decode, separately declare matrix reuse and cache-read assumptions before estimating traffic.
8 Report omissions and the residual against 2*N_dense, with its precise denominator.
TERMINATION: each finite trace entry and allocation event is visited once.
```

Parameter and FLOP summation are O(K) for K trace entries. If live intervals are not already ordered, sorting A allocation/free events costs O(A log A); a sweep then finds the peak in O(A). Summing every tensor size without lifetimes is an inventory bound, not that peak computation. The chapter contains no executed model accounting script or generated profiler CSV; [verification.md](verification.md) records the analytical checks and the separate unexecuted implementation proposal.

## Implementation

Sharing must survive model construction and loading: two names referring to the same parameter allocation are one resident weight, while a copied tensor is a second allocation. Parameter enumeration and storage-identity inspection should agree with the declared sharing policy. Views can have different shapes and strides while sharing the same underlying storage; counting both as independently allocated bytes is incorrect.

A profiler may report useful mathematical operations, dispatched kernel operations, or selected operator estimates. Its number is interpretable only with the tool's convention. Causal tiles, padding, tensor-core instructions, backward recomputation, and excluded elementwise operations can create legitimate differences from Eq. 5.23. A residual is not automatically allocator overhead, which is a memory concept.

Memory verification must record synchronized peak *allocated* and *reserved* device bytes separately, the warmup/reset interval, optimizer creation and step state, gradient accumulation, cached tensors, and external library allocations. Device peak capacity and a saved-tensor inventory are different quantities. The head can dominate a small model's intermediate allocation when all FP32 logits are materialized; chunking or fusing loss evaluation changes live intervals and backward requirements, not vocabulary projection arithmetic by itself. No such runtime measurement has been performed here.

## Experimental design

### Reported experiments

P08 fits language-model loss against model/data/compute scale using its non-embedding convention. Its Table 1 omits normalization, nonlinearities, biases, and other subleading terms, and section 2.1 explicitly drops the context-dependent term in the regime studied. The default training protocol uses WebText2, a1024-token context, and 512 sequences per batch; the paper separately varies architecture, data, and training conditions. Those experiments support the source's scaling analysis, not an exact throughput prediction for the present mixed configuration. (PAPER-REPORTED: P08 sections 2.1-2.3.)

P19 compares exact-attention implementations and accounts for HBM traffic, tiled execution, and backward recomputation. Its memory savings concern attention intermediates and its timings are tied to the stated hardware/shapes. They do not measure this chapter's end-to-end peak. (PAPER-REPORTED: P19 sections 3-4.)

The proposed local verification first matches unique parameter counts exactly, then compares trace-level matrix arithmetic under the same head/mask policy. Peak-memory experiments must isolate materialized attention, fused attention, and checkpointing while recording each implementation's saved allocations. An anticipated 192 MiB probability allocation per block is an item to inspect, not a guaranteed difference between complete measured peaks. Results remain UNVERIFIED until executed with a pinned model/runtime and recorded device.

## Observations

**What the paper claims.** P08 defines approximate non-embedding forward/training compute for its scaling study. P19 evaluates exact attention with reduced HBM traffic and non-materialized pairwise intermediates. These are different resource claims with specified boundaries. (PAPER-REPORTED.)

**What the evidence shows.** Eq. 5.22 gives 110,316,288 tied parameters for the declared reference. Its dense all-row-head forward has 256,770,048 leading FLOPs per token at T=1024, while ideal triangular work gives 237,914,112. The values are mathematical consequences of the configuration and counting convention, not model runs. (MATHEMATICALLY-DERIVED.)

**What we infer.** Weight tying changes unique storage without removing output-head arithmetic. Non-materializing attention changes the saved-allocation schedule without making full attention linear in arithmetic. A larger vocabulary can affect both storage and head cost, and consumed context affects cache and pair work differently. None of these identities fixes the measured dominant latency component. (MATHEMATICALLY-DERIVED.)

**What remains unknown.** No accelerator timing, dispatched kernel trace, measured peak allocation, optimizer state layout, training quality, or long-context validity has been established for the analytical reference. The source reports do not disclose those quantities for this constructed configuration. (UNVERIFIED; NOT-DISCLOSED.)

## Failure modes

A storage count can double-count a tied head, while a FLOP count can accidentally remove its projection because the head has no additional unique parameters. Compare unique allocation count and operator applications separately. Counting all resident parameters as multiply-used matrices also misclassifies learned positions, gains, and an untied input-only embedding.

A causal mask does not guarantee triangular hardware work. A dense matmul followed by masking still computes the full matrix. Likewise, choosing a fused kernel does not determine the complete saved-tensor set or optimizer peak. Inspect dispatch and live allocations before attributing a numerical discrepancy to a single missing term.

Cache length can be off by one when sampled and consumed tokens are conflated; prefill can be overcounted when a full vocabulary projection is charged for every prompt position despite evaluating only the last row. Record actual forward inputs and head rows. A proposed cache/weight crossing beyond the position table is not a supported run configuration.

Binary and decimal units must also remain explicit: MiB means2^20 bytes, MB means10^6 bytes. Carry integer bytes through calculations and convert at presentation; their relative difference is about4.86%, rather than a universal7% discrepancy.

## Siblings

Dense architecture allocation in Chapter 13 turns the present constants into variables and compares depth, width, head dimensions, FFN size, and vocabulary under a stated resource budget. Equal resident parameters alone do not imply equal arithmetic, cache, or saved activations.

Training-state distribution in Chapter 29 separates parameters, gradients, master copies, moments, and communication buffers before applying sharding factors. Serving state in 42.2 instead accounts for unequal consumed lengths, KV-head sharing, page allocation, prefix sharing, and reserve. Both require unique storage and lifetime accounting; they cannot be obtained by multiplying this single-sequence cache count by an arbitrary concurrency constant.

## Extensions

### Improvements

The exact-attention improvement in P19 targets memory traffic through tiling, online normalization, and backward recomputation. Its benefit must be evaluated against the memory hierarchy and shapes in its execution regime. Activation checkpointing changes which forward tensors persist and which operators repeat; a selective checkpoint can save a different amount from a whole-block checkpoint.

Grouped/multi-query attention replaces KV projection/cache dimensions by H_kv*d_h while preserving the query-head count, requiring fresh parameter and FLOP rows. Quantization changes parameter/cache bytes and introduces scales, packing, and possibly dequantization work; dividing all totals by a bit-width ratio omits these terms. MoE requires both resident expert parameters and routed execution counts. These are changes to the trace specification, not constant-factor guarantees about latency.

## Limitations

The exact parameter identities apply to the specified bias-free RMSNorm/learned-position decoder. The leading FLOPs omit softmax, normalization, activations, embedding gathers, reductions, optimizer updates, communication, and implementation padding unless separately stated. Their asymptotic or small scalar count does not prove negligible elapsed time. The saved-tensor table is a conditional allocation inventory rather than an observed autograd schedule. Sensitivity calculations beyond T_max require a changed positional specification before execution; they do not demonstrate extrapolation quality.

## Reproducibility

The analytical inputs are the complete configuration, sharing/alias map, mode, number of head rows, attention-pair convention, dtype of each allocation, and FLOP convention. The integer identities and unit conversions can be reproduced independently without an accelerator. [verification.md](verification.md) distinguishes the executed arithmetic checks from the unexecuted reference-model and profiling proposals. A future runtime record must add repository revision, framework/backend, accelerator, allocation timeline, warmup/synchronization, and profiler counting semantics.

## References

P08 section 2.1/Table 1 (source compute convention); P19 sections 3-4 (exact-attention IO and saved intermediates); R5.6 (incremental decoding and shared-key attention); [notation.md](../../../front-matter/notation.md); [references.md](references.md).
