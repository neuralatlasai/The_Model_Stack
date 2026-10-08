---
id: ms.section.5.3
entity_type: section
title: Feed-forward computation
short_title: Feed-forward block
volume: 1
part: 1
chapter: 5
section: 5.3
slug: 05-3-feed-forward-computation
parent: ms.chapter.5
prev_sibling: ms.section.5.2
next_sibling: ms.section.5.4
children: []
prerequisites: [ms.section.5.1]
downstream: [ms.section.5.6, ms.section.13.3, ms.section.16.1, ms.section.26.4]
related: []
siblings_by_mechanism: [ms.section.13.3, ms.section.16.1]
relations:
  - {type: supported_by, target: paper.P01}
  - {type: implemented_by, target: impl.pytorch}
axes:
  lifecycle: [pretraining, inference]
  mechanism: [feed_forward]
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
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 5.3 Feed-forward computation

## Scope

A position-wise feed-forward branch applies the same learned transformation independently to each token representation. Its expansion width, activation, multiplicative gates, biases, and contraction determine both the function and its dense parameter and compute costs. The two-matrix ReLU/GELU family and three-matrix GLU family differ in more than an activation name: gating introduces another projection and another backward dependence. This section derives the forward and backward calculations, the matched-parameter width relation, and the limits of using that relation to infer memory or speed. (PAPER-REPORTED: P01 section 3.3; R5.5 sections 1-3; MATHEMATICALLY-DERIVED: Eq. 5.9-5.12.)

## Why this exists

Attention supplies input-dependent interaction between positions; the feed-forward branch supplies an additional learned channel transformation at each position. Attention itself is nonlinear through its score construction and softmax, so removing the feed-forward activation does not turn an entire Transformer into a linear map. For a two-matrix feed-forward branch alone, removing its activation collapses the composition to one matrix product W_1 W_2. For a gated branch, retaining the product of two linear projections still gives a bilinear input dependence. These distinctions identify what an activation or gating ablation actually changes. (MATHEMATICALLY-DERIVED.)

The FFN also accounts for a substantial part of a dense block's weight arithmetic. With residual width d, attention projections contain4d^2 parameters; a bias-free two-matrix FFN with F=4d contains8d^2. Its two-thirds share applies to this block specification, excluding embeddings, output head, and other architecture components. It is not a statement that FFN parameters always dominate a complete model or that its runtime share equals its parameter share. (MATHEMATICALLY-DERIVED.)

## Intuition

Flatten the batch/token axes into M=B*T independent rows. Expansion maps each d-dimensional row to F learned features; the activation transforms those features elementwise; contraction combines them back into d channels. Parameter sharing across M rows makes a batched matrix multiplication possible, but no cross-position dependence is introduced by this branch. A gated alternative computes two features at the same position and multiplies them coordinatewise before contraction. The multiplicative branch changes derivatives to both projections, so treating it as an interchangeable elementwise epilogue would omit a parameterized path. (MATHEMATICALLY-DERIVED.)

Equal leading FLOPs do not imply equal kernels. Two wider products and three narrower products can have different tiling, launch, fusion, reuse, and saved-activation behavior. At small M, reading dense weights can dominate the useful work; at larger M, more rows reuse those weights. An arithmetic-intensity calculation must count the actual reads/writes for a declared execution boundary, rather than divide weight FLOPs by the size of an arbitrary intermediate.

## Formulation

Let n have shape `[B, T, d]`. The bias-free two-matrix form has W_1[d, F] and W_2[F, d]; the gated form has W_1[d, F_g], W_3[d, F_g], and W_2[F_g, d]. Biases are excluded by the analytical reference and by R5.5's compared FFN variants; they are present in P01's original FFN. Adding them changes the two-matrix parameter total by F+d and the gated total by 2F_g+d.

$$
u=nW_1,\quad v=\phi(u),\quad f=vW_2.
$$
*(Eq. 5.9)* ReLU uses max(0, u). Exact GELU uses `u*Phi(u)`, where Phi is the standard normal CDF. A tanh approximation is a different numerical function and must be identified when comparing checkpoints or implementations. (PAPER-REPORTED: R5.1; R5.5 section 1.)

$$
u=nW_1,\quad g=nW_3,\quad r=\phi(u)\odot g,\quad f_{\mathrm{gated}}=rW_2.
$$
*(Eq. 5.10)* GLU uses the sigmoid for phi, GEGLU uses GELU, and SwiGLU uses `SiLU(u)=u*sigmoid(u)` with unit Swish parameter. The unactivated bilinear variant sets phi(u)=u. The unactivated branch g is not constrained to[0,1]. (PAPER-REPORTED: R5.5 section 2.)

$$
N_{\mathrm{FFN}}=2dF,\quad N_{\mathrm{gated}}=3dF_g,\quad N_{\mathrm{gated}}=N_{\mathrm{FFN}}\iff F_g=2F/3.
$$
*(Eq. 5.11)* With F=4d this yields F_g=8d/3 before integer or hardware-alignment rounding.

$$
C_{\mathrm{FFN}}=4dF,\qquad C_{\mathrm{gated}}=6dF_g\quad\text{GEMM FLOPs per token}.
$$
*(Eq. 5.12)* Counts use2 FLOPs per multiply-add and exclude elementwise work. Exact matched width preserves these leading GEMM counts; a rounded width changes them by its actual matrix dimensions. (MATHEMATICALLY-DERIVED.)

```figure
id: fig-5.13
kind: diagram
title: Two-matrix and gated feed-forward branches
caption: >-
  Same input, same output shape, two routes. At D = 768 the GELU route uses
  F = 3072 and the SwiGLU route F_g = 2048 = 2F/3, so both hold 4,718,592
  parameters and cost 9,437,184 GEMM FLOPs per token (Eq. 5.11 and 5.12).
  What differs is three narrower GEMMs instead of two, and a third hidden
  tensor produced by the linear branch that the gate multiplies.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.9", "DERIVED:eq-5.10", "DERIVED:eq-5.11", "DERIVED:eq-5.12"]
alt: >-
  Left-to-right diagram with one input, the normalised stream n of shape
  [B, T, D], feeding two groups. The two-matrix group (GELU, F = 4D = 3072,
  2·D·F parameters) runs W_1 ([D, F], 2·D·F FLOPs per token) to the
  pre-activation u [B, T, F], an element-wise exact GELU to v [B, T, F], and
  W_2 ([F, D], 2·D·F FLOPs per token) to the output f [B, T, D]. The gated
  group (SwiGLU, F_g = 2F/3 = 2048, 3·D·F_g parameters) runs W_1 and W_3 in
  parallel ([D, F_g] each, 2·D·F_g FLOPs per token each); SiLU is applied to
  the W_1 branch, the emphasised W_3 branch multiplies it element-wise into a
  [B, T, F_g] product, and W_2 ([F_g, D]) produces f_gated [B, T, D].
spec:
  direction: LR
  nodes:
    - { id: n, kind: tensor, label: "n, normalised stream", sub: "[B, T, D]" }
    - { id: w1, kind: process, label: "W_1 GEMM", sub: "[D, F] · 2·D·F FLOPs/token", group: two }
    - { id: u, kind: tensor, label: "u, pre-activation", sub: "[B, T, F]", group: two }
    - { id: gelu, kind: process, label: "GELU, exact erf form", sub: "element-wise, O(F) per token", group: two }
    - { id: v, kind: tensor, label: "v", sub: "[B, T, F]", group: two }
    - { id: w2, kind: process, label: "W_2 GEMM", sub: "[F, D] · 2·D·F FLOPs/token", group: two }
    - { id: f, kind: tensor, label: "f, two-matrix output", sub: "[B, T, D]" }
    - { id: g1, kind: process, label: "W_1 GEMM", sub: "[D, F_g] · 2·D·F_g FLOPs/token", group: gated }
    - { id: g3, kind: process, label: "W_3 GEMM, linear branch", sub: "[D, F_g] · 2·D·F_g FLOPs/token", group: gated }
    - { id: silu, kind: process, label: "SiLU, x·σ(x)", sub: "element-wise", group: gated }
    - { id: prod, kind: process, label: "gate product ⊙", sub: "[B, T, F_g]", group: gated }
    - { id: g2, kind: process, label: "W_2 GEMM", sub: "[F_g, D] · 2·D·F_g FLOPs/token", group: gated }
    - { id: fg, kind: tensor, label: "f_gated", sub: "[B, T, D]" }
  edges:
    - { from: n, to: w1 }
    - { from: w1, to: u }
    - { from: u, to: gelu }
    - { from: gelu, to: v }
    - { from: v, to: w2 }
    - { from: w2, to: f }
    - { from: n, to: g1 }
    - { from: n, to: g3 }
    - { from: g1, to: silu }
    - { from: silu, to: prod }
    - { from: g3, to: prod, kind: emphasis, label: "multiplies, Eq. 5.10" }
    - { from: prod, to: g2 }
    - { from: g2, to: fg }
  groups:
    - { id: two, label: "two-matrix, GELU, F = 4D = 3072, 2·D·F params" }
    - { id: gated, label: "gated, SwiGLU, F_g = 2F/3 = 2048, 3·D·F_g params" }
```

```figure
id: fig-5.14
kind: calculator
title: Feed-forward width matching
caption: >-
  Exact projection-parameter matching gives F_g=2F/3. At d=768, F=3072
  this is 2048; at d=512, F=2048 it is 1365.333... . This calculator chooses
  the nearest multiple of 64, namely1344, which has fewer parameters. That
  rounding policy is analytical, not a claim about every source or kernel.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.11", "DERIVED:eq-5.12", P01]
alt: >-
  Calculator for Eq. 5.11 and 5.12 over model width D and the ratio F/D. At
  D = 768 and F/D = 4 (the reference model): F = 3072, matched gated width
  F_g = 2F/3 = 2048.0, rounded to a multiple of 64 still 2048, two-matrix
  parameters 2·D·F = 4,718,592, gated parameters at the rounded width
  3·D·F_g = 4,718,592, and two-matrix GEMM FLOPs per token 4·D·F = 9,437,184.
  The preset D = 512 gives F = 2048, F_g = 1365.3, rounded 1344, two-matrix
  parameters 2,097,152 and gated parameters 2,064,384.
spec:
  tex: >-
    N_{\text{FFN}} = 2DF,\quad N_{\text{gated}} = 3DF_g,\quad F_g = \tfrac{2}{3}F,\quad \text{FLOPs}_{\text{FFN}} = 4DF
  equation: "5.11"
  inputs:
    - { symbol: D, label: "model width D", default: 768, min: 512, max: 4096, options: [512, 768, 1024, 1536, 2048, 4096], format: integer }
    - { symbol: k, label: "F / D", default: 4, min: 2, max: 8, options: [2, 3, 4, 6, 8], format: integer }
  outputs:
    - { symbol: F, label: "two-matrix width F = k·D", formula: "k*D", format: integer }
    - { symbol: Fg, label: "matched gated width, 2F/3", formula: "2*F/3", format: fixed1 }
    - { symbol: Fg64, label: "gated width rounded to 64", formula: "64*round(Fg/64)", format: integer }
    - { symbol: N, label: "two-matrix params, 2·D·F", formula: "2*D*F", format: integer }
    - { symbol: Ng, label: "gated params at rounded width, 3·D·F_g", formula: "3*D*Fg64", format: integer, emphasis: true }
    - { symbol: C, label: "two-matrix GEMM FLOPs/token, 4·D·F", formula: "4*D*F", format: integer }
  presets:
    - { label: "P01 base width, D = 512", values: { D: 512 } }
```

## Mechanism

### Methodology

For the two-matrix branch, compute an `[M, d]` by `[d, F]` product, apply the activation to M*F scalars, and multiply the result by `[F, d]`. This gives 2dF parameters and 4dF GEMM FLOPs per token. With d=768 and F=3072 the totals are 4,718,592 parameters and 9,437,184 FLOPs per token. A gated branch of the same width adds dF parameters and 2dF FLOPs per token; choosing F_g=2048 restores both leading totals exactly. These are arithmetic identities, rather than evidence of matched elapsed time or identical training dynamics.

The derivative of exact GELU is `Phi(u)+u*varphi(u)`, where varphi is the standard normal density. For SiLU it is `sigmoid(u)+u*sigmoid(u)*(1-sigmoid(u))`. These formulas specify how negative and near-zero inputs contribute to the gradient; replacing either activation with a hard threshold changes the derivative. ReLU is nondifferentiable at zero and an implementation must adopt its stated subgradient convention. (MATHEMATICALLY-DERIVED from the activation definitions.)

For the gated branch let barf be the upstream cotangent and flatten tokens into rows. The contraction gives `barr=barf W_2^T` and `barW_2=r^T barf`. The product gives `baru=barr*g*phi'(u)` and `barg=barr*phi(u)`. Consequently,

$$
\bar W_1=n^{\top}\bar u,\qquad \bar W_3=n^{\top}\bar g,\qquad
\bar n=\bar uW_1^{\top}+\bar gW_3^{\top}.
$$
The two cotangent paths into n must be added. Returning only one path would preserve forward outputs while producing an incorrect training algorithm. The two-matrix derivative is the same construction with one activation path and no multiplicative branch. For each dense product, its input and weight gradients each have the leading cost of the forward product when both are required; freezing a parameter does not necessarily remove the gradient needed by earlier trainable layers. (MATHEMATICALLY-DERIVED.)

Activation retention is a property of a backward implementation. A simple two-matrix execution can save u for the activation derivative and v for the contraction's weight gradient, in addition to its shared input n. A primitive gated execution may save u, g, phi(u), and r. A fused/custom backward can recompute phi(u) from u and save fewer arrays, or checkpoint the branch and recompute projections. Thus `3F_g=2F` is not a universal equality of retained or peak activation bytes. The saved set, element dtypes, aliasing, and release times must be specified before converting counts to bytes.

The arithmetic share can be derived under fixed widths. At F=4d, FFN projections contribute16d^2 forward FLOPs per token, against8d^2 for attention projections. Adding attention's context-dependent products and the output vocabulary head changes the complete-model share. Likewise, the FFN expansion is larger than one residual array when F>d, but a logit array or attention array can be larger still. The resource account therefore names individual tensors and their lifetimes rather than declaring one tensor universally largest.

```figure
id: fig-5.15
kind: memory-stack
title: Retained FFN hidden bytes at matched parameters
caption: >-
  Equal bars require a saving policy: two width3072 tensors for GELU, and
  three width2048 tensors u, g, r for SwiGLU with SiLU(u) recomputed in backward.
  A primitive graph can also save SiLU(u), adding another32 MiB. Equal
  projection parameters do not imply equal actual saved activations or peak
  memory. Shared input and branch output are omitted.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.9", "DERIVED:eq-5.10", "DERIVED:eq-5.11"]
alt: >-
  Conditional FFN inventory at B=8, T=1024, two-byte storage. GELU saves
  u and v,48 MiB each, total 96 MiB. The selected SwiGLU policy saves u, g, r,
  32 MiB each, total 96 MiB, and recomputes SiLU(u). Saving SiLU(u) too gives
  128 MiB. These are inventory choices, not measured autograd peaks.
spec:
  format: bytes
  variables: { B: 8, T: 1024, F: 3072, Fg: 2048, b: 2 }
  bars:
    - label: "GELU, two matrices, F = 3072"
      segments:
        - { label: "u = n·W_1, [B, T, F]", kind: tensor, formula: "B*T*F*b" }
        - { label: "v = GELU(u), [B, T, F]", kind: tensor, formula: "B*T*F*b" }
    - label: "SwiGLU: save u,g,r; recompute SiLU(u)"
      segments:
        - { label: "n·W_1, [B, T, F_g]", kind: tensor, formula: "B*T*Fg*b" }
        - { label: "n·W_3, [B, T, F_g]", kind: tensor, formula: "B*T*Fg*b" }
        - { label: "SiLU(n·W_1) ⊙ n·W_3, [B, T, F_g]", kind: tensor, formula: "B*T*Fg*b" }
```

## Algorithm

```text
Algorithm 5.3 - Two-matrix or gated position-wise branch
INPUT: n[B,T,d]; W_1[d,F]; W_2[F,d]; activation phi; variant in {plain,gated}; gated W_3[d,F]
OUTPUT: f[B,T,d]
STATE: u[B,T,F]; activated[B,T,F]; gated g,r[B,T,F]
INVARIANT: the same parameters act on every position, with no cross-position reads
1. Compute u = n W_1 and activated = phi(u).
2. If variant is gated, compute g = n W_3 and r = activated * g.
3. Otherwise set r = activated.
4. Compute and return f = r W_2.
TERMINATION: a finite sequence of dense and elementwise operations.
```

Here F means the actual chosen width of the selected variant; Eq. 5.11 determines a matched alternative width when requested. Validate dimensions before dispatch. The implementation must preserve both projection-gradient paths for the gated variant. Its dense complexity is O(B*T*d*F), and its materialized intermediate storage is O(B*T*F) with an implementation-dependent constant. (MATHEMATICALLY-DERIVED.)

## Implementation

A plain implementation uses two bias-free linear operators and the declared GELU/ReLU activation. A gated implementation uses two independent input projections, an elementwise activation/product, and a contraction. The input projections may be packed into one weight tensor with output width2F_g, but checkpoint ordering and gradient accumulation must preserve the two logical branches. A compilation or kernel library can fuse an activation or gate without changing its mathematical definition; which fusion is selected is a versioned execution fact, not implied by the operator names.

For tensor-parallel FFNs, partitioning the expansion channels lets each rank compute its local up/gate features and partial contraction. The partial residual-width outputs then need the appropriate reduction. The all-to-all associated with routed experts is a different mechanism and must not be attributed to an ordinary dense channel partition. Exact collective placement and overlap belong to29.2.

Width rounding changes parameter count by 3d times the gated-width increment and leading forward FLOPs by 6d times that increment. Saving the width explicitly in checkpoint configuration avoids a loader silently deriving a different rounded value. An aligned width can improve a particular kernel's tiling; an odd width is mathematically legal and is not evidence of a universal slowdown magnitude. A measured comparison needs device, backend, precision, M, width, and measurement boundary.

Materialized activation traffic can motivate fusion or recomputation, but retained backward tensors need not equal the temporary tensors observed during forward. Report both allocations and the saved-state policy. No FFN timing, energy, memory peak, or fused-kernel equivalence has been measured for the analytical reference.

## Experimental design

### Reported experiments

R5.5 compares bias-free FFN alternatives inside T5 on C4 span reconstruction. It fixes d=768, uses F=3072 for two-matrix variants and F_g=2048 for gated variants, and trains the long runs for 524,288 steps with 128 examples per batch,512 input tokens and 114 output tokens per example. Four shorter65,536-step runs estimate variability. The reported metric is held-out log-perplexity on that reconstruction objective, not general decoder-only perplexity or wall-clock-normalized quality. GEGLU and SwiGLU improve that metric in the reported comparisons. Fine-tuning uses a task mixture and source-specific checkpoint selection; its scores require a separate reading of that protocol. (PAPER-REPORTED: R5.5 sections 3.1-3.3/Table 1.)

## Observations

**What the paper claims.** R5.5 reports benefits for several GLU variants at matched leading parameter and operation counts in its T5 setup. R5.8 and R5.9 document adoption of SwiGLU in their architectures. Adoption is distinct from a new controlled activation ablation. (PAPER-REPORTED.)

**What the evidence shows.** Eq. 5.11 establishes exact parameter matching before rounding. The reported quality evidence concerns the source's objective, training regime, and evaluation. It does not establish identical activation memory, elapsed time, or an optimum expansion width for another model. (MATHEMATICALLY-DERIVED; PAPER-REPORTED.)

**What we infer.** A width convention is the result of an accounting constraint. Matching dense parameters, matching peak activation bytes, and matching elapsed training cost are different constraints and may select different widths. (MATHEMATICALLY-DERIVED.)

**What remains unknown.** This revision has not executed the reference FFN or compared fused backends. Numerical error, saved-state behavior, and measured utilization for a selected release remain unverified. (UNVERIFIED.)

## Failure modes

An activation-name match can hide a formula mismatch, such as exact versus approximate GELU or a different Swish parameter. Compare activation outputs and gradients over a declared input range before attributing downstream differences to a checkpoint. A packed gate/up projection can also have reversed halves, preserving shape while changing the function.

A backward implementation that omits one gated input path gives correct forward values and incorrect gradients. A vector-Jacobian comparison against the explicit composition detects that error. Width rounding or bias differences can instead cause checkpoint shape mismatches or different parameter totals; configuration and tensor metadata identify these before training.

An FFN can exhaust memory through saved inputs or expanded intermediates even when attention is fused. Recomputation changes both saved bytes and arithmetic; it cannot be represented by deleting an activation row without adding the repeated work. These are analytical failure mechanisms, with proposed checks recorded in verification.md.

## Siblings

Two-matrix ReLU, GELU, and SiLU branches share the same leading matrix shapes but use different scalar functions and derivatives. GLU variants add a second parameterized branch; the purely bilinear variant remains nonlinear despite omitting an activation. Routed experts replace the single shared FFN with a selection over expert parameter sets and introduce routing/state/communication questions treated in Chapter 16. Matching activated dense work does not match total resident expert parameters. (PAPER-REPORTED: R5.5 sections 1-2; MATHEMATICALLY-DERIVED.)

```figure
id: fig-5.16
kind: compare
title: Feed-forward siblings at matched parameters
caption: >-
  Matched width preserves projection parameters and leading GEMM arithmetic.
  Nonlinear operations, saving policy, and execution still differ. MoE needs
  separate resident expert and routed execution counts, plus routing and
  communication; it does not guarantee the dense FFN arithmetic or latency.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.11", "DERIVED:eq-5.12", R5.5]
alt: >-
  Comparison of three feed-forward forms at fixed D = 768. GELU two-matrix
  (reference): act(n·W_1)·W_2, two GEMMs, F = 3072, 2·D·F = 4,718,592
  parameters, 4·D·F = 9,437,184 GEMM FLOPs per token, retained hidden bytes
  2·B·T·F·b. SwiGLU gated: (SiLU(n·W_1) ⊙ n·W_3)·W_2, three narrower GEMMs,
  F_g = 2048, 3·D·F_g = 4,718,592 parameters, 6·D·F_g = 9,437,184 FLOPs,
  conditional saved bytes:3*B*T*F_g*b when SiLU(u) is recomputed; new failure mode width-rounding ambiguity.
  Mixture of experts: E pairs of matrices plus a router, parameters grow with
  E while activated FLOPs depend on routed experts and their widths, an auxiliary
  load-balancing term is usually added, and routing imbalance and all-to-all
  communication are the new failure modes.
spec:
  axis: >-
    Per-token cost of the feed-forward line at fixed D = 768, matched
    parameters where stated; training quality is not an axis here
  columns:
    - { id: gelu, label: "GELU two-matrix, reference", node: ms.section.5.3 }
    - { id: swiglu, label: "SwiGLU gated", node: ms.section.13.3 }
    - { id: moe, label: "Mixture-of-experts FFN", node: ms.section.16.1 }
  rows:
    - { dimension: "form", values: { gelu: "act(n·W_1)·W_2", swiglu: "(SiLU(n·W_1) ⊙ n·W_3)·W_2", moe: "E pairs of [D, F] matrices plus a router" } }
    - { dimension: "GEMMs per token", values: { gelu: "2", swiglu: "3, each narrower", moe: "2 per activated expert, plus the router" } }
    - { dimension: "hidden width", values: { gelu: "F = 4D = 3072", swiglu: "F_g = 2F/3 = 8D/3 = 2048", moe: "a design input (§16.1)" } }
    - { dimension: "parameters", values: { gelu: "2·D·F = 4,718,592", swiglu: "3·D·F_g = 4,718,592", moe: "grow with E" } }
    - { dimension: "GEMM FLOPs per token", values: { gelu: "4·D·F = 9,437,184", swiglu: "6·D·F_g = 9,437,184", moe: "sum routed expert work plus routing overhead" } }
    - { dimension: "retained hidden bytes", values: { gelu: "2·B·T·F·b", swiglu: "policy-dependent:3*B*T*F_g*b with specified recomputation", moe: "not derived here (§16)" } }
    - { dimension: "objective change", values: { gelu: "none", swiglu: "none", moe: "auxiliary load-balancing term usually added" } }
    - { dimension: "new failure mode", values: { gelu: "none beyond activation-form pinning", swiglu: "three narrower GEMMs; width-rounding ambiguity", moe: "routing imbalance; all-to-all communication" } }
```

## Extensions

### Improvements

The documented transition from a two-matrix FFN to a GLU-family FFN changes the feature interaction and compensates its extra projection through width selection. Later architecture reports establish that this design was used at larger scale, while the isolated quality result remains bounded by the controlled source experiment. Fusion and activation checkpointing are execution changes that can be applied to either family when the numerical and saved-state contracts are preserved. (PAPER-REPORTED: R5.5; R5.8; R5.9.)

Longer sequences increase the number of FFN rows linearly for fixed batch and width. A multimodal token stream can change that row count without changing the local branch equation. A changed modality encoder or expert router introduces its own parameter and interface specification and cannot be accounted for by silently reusing a dense FFN total.

## Limitations

The leading counts exclude activation, multiplication, bias, and reduction instructions. These exclusions are appropriate for a stated GEMM account but do not establish negligible runtime. Parameter matching assumes dense unstructured matrices, a specified tying policy, and exact widths. The source quality evidence is conditional on its training and selection protocol; no universal ordering of activations is established. Retained and peak memory remain implementation-specific.

## Reproducibility

Record the actual expansion width, biases, activation formula, gate/up ordering, parameter sharing, precision, and saved-state/recomputation policy. The analytical example uses d=768 with F=3072 or F_g=2048; its integer totals can be checked independently of any model training. Numerical forward/backward and performance checks remain unexecuted proposals in [verification.md](verification.md). Source versions and inspected experiment locators are listed in [references.md](references.md).

## References

P01 · R5.1 · R5.5 · R5.8 · R5.9 · R5.11 · [references.md](references.md)
