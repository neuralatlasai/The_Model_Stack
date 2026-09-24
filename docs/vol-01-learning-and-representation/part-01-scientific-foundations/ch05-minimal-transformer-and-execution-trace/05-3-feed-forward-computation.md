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
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 5.3 Feed-forward computation

## Scope

Objective: specify the position-wise feed-forward block — expansion, nonlinearity, contraction — and its gated alternative, and derive its parameter count and per-token FLOPs so that the 8/3 width convention is seen as parameter matching rather than as a received number. Baseline: the ReLU two-matrix FFN of P01. Success criterion: the reader can compute, for any (D, F), the parameters and FLOPs of the two-matrix and three-matrix forms and choose F to equalise them. Boundaries: which activation trains better is a Chapter 13 question ([§13.3](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-3-feed-forward-alternatives.md)); mixture-of-experts replaces this block and is owned by [§16.1](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-1-conditional-computation.md).

## Why this exists

Attention (§5.2) mixes information across positions but, per position, applies only linear maps; without a nonlinearity between blocks the stack would collapse to one linear map of the mixed inputs. What failed before was not a Transformer-era problem but the general one: depth without nonlinearity buys nothing. The bottleneck the feed-forward block introduces is its share of parameters and FLOPs — at the conventional F = 4D it holds two thirds of each block's weights — so its width is the single largest lever on the 2N-per-token cost of §5.6. The dominant constraint that changed the design was that gated variants were reported to reach lower loss at equal compute, which forced the width to be renegotiated rather than the matrix count simply raised. PAPER-REPORTED (R5.5, abstract and §3): gated variants were compared at matched parameter and computation counts by reducing the hidden dimension.

## Intuition

Physically, the block is two GEMMs with an element-wise map between them; the GEMMs are compute-dense (intensity `~D·F/(D+F)` FLOPs per byte of weights at large B·T) and the element-wise map is memory-bound, which is why fusing the activation into the first GEMM's epilogue is a recurring kernel optimisation ([§26.4](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/26-4-fusion-and-dataflow.md)). The `[B, T, F]` hidden tensor is the largest non-attention activation in the trace: at F = 4D it is four times the residual stream. MATHEMATICALLY-DERIVED from shapes.

Heuristically, the block is sometimes described as a per-token key–value memory; that is an interpretive hypothesis for Chapter 64, not a mechanism used here.

## Formulation

Input `n ∈ ℝ^{B×T×D}`. Two-matrix form: `W_1 ∈ ℝ^{D×F}`, `W_2 ∈ ℝ^{F×D}`, activation `act: ℝ → ℝ` applied element-wise. Gated form: `W_1, W_3 ∈ ℝ^{D×F_g}`, `W_2 ∈ ℝ^{F_g×D}`. No biases (ASSUMED, following R5.9 and R5.11; sensitivity as in §5.1).

> **Definition — position-wise feed-forward block.** The per-token map `FFN(n_t) = act(n_t W_1) W_2`, or its gated form `(act(n_t W_1) ⊙ n_t W_3) W_2`, applied with the same parameters at every position t.

$$
u = n\,W_1 \in \mathbb{R}^{B\times T\times F},\qquad v = \mathrm{act}(u),\qquad f = v\,W_2 \in \mathbb{R}^{B\times T\times D}
$$
*(Eq. 5.9)* where act is ReLU in P01 and GELU in the reference model; GELU(x) = x·Φ(x) with Φ the standard normal CDF (PAPER-REPORTED, R5.1).

$$
f_{\text{gated}} = \big(\mathrm{act}(n\,W_1) \odot n\,W_3\big)\,W_2,\qquad \text{SwiGLU: } \mathrm{act}(x) = x\,\sigma(x)
$$
*(Eq. 5.10)* where ⊙ is element-wise product and σ the logistic function; PAPER-REPORTED (R5.5, §2): FFN_SwiGLU replaces the ReLU FFN by Swish-gated GLU, with the bias terms omitted in the paper's FFN variants.

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

$$
N_{\text{FFN}} = 2\,D\,F,\qquad N_{\text{FFN,gated}} = 3\,D\,F_g,\qquad N_{\text{FFN,gated}} = N_{\text{FFN}} \iff F_g = \tfrac{2}{3}F
$$
*(Eq. 5.11)* where with F = 4D this gives `F_g = 8D/3`.

$$
\text{FLOPs}_{\text{FFN}} = 4\,D\,F \text{ per token},\qquad \text{FLOPs}_{\text{FFN,gated}} = 6\,D\,F_g \text{ per token}
$$
*(Eq. 5.12)* where each `[·, D] × [D, F]` GEMM costs 2·D·F per token; activations and the gate product add O(F) per token and are omitted.

```figure
id: fig-5.14
kind: calculator
title: Feed-forward width matching
caption: >-
  At D = 768 and F = 4D the matched gated width is exactly 2048, a multiple of
  64, and the two forms agree to the parameter. Try the P01 base width,
  D = 512: F_g = 1365.3 is not an integer, rounding to a multiple of 64 gives
  1344, and the gated block then holds fewer parameters than the two-matrix
  one. That is the width-rounding ambiguity in the Failure modes.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.11", "DERIVED:eq-5.12", P01, R5.11]
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

> **Assumption.** F = 4D for the GELU reference and F_g = 8D/3 for the SwiGLU variant · *sensitivity:* both are conventions, not optima; PAPER-REPORTED (R5.11, §3.5): the CS336 handout states d_ff = 8/3·d_model canonically and permits rounding to a nearby multiple of 64 for hardware efficiency.

## Mechanism

Eq. 5.9 is a `[B·T, D] × [D, F]` GEMM, an element-wise map, and a `[B·T, F] × [F, D]` GEMM. Its parameters are `2DF` and its FLOPs per token `4DF`; for the reference configuration (D = 768, F = 3072) that is 4,718,592 parameters and 9,437,184 FLOPs per token per block. Eq. 5.10 adds a third matrix `W_3` of the same shape as `W_1`, so at equal width it costs 1.5× the parameters and FLOPs; the matched-parameter condition `3DF_g = 2DF` gives `F_g = 2F/3`, and with the 4D convention `F_g = 8D/3`. MATHEMATICALLY-DERIVED (Eq. 5.11). For D = 768, `F_g = 2048` exactly, and `3·768·2048 = 4,718,592 = 2·768·3072`: the gated block has the same parameters and, by Eq. 5.12, the same GEMM FLOPs (`6·768·2048 = 4·768·3072 = 9,437,184`). PAPER-REPORTED (R5.5, §3): the paper reduces the hidden dimension of the gated variants to 2/3 of the original d_ff to keep parameter count and computation constant, using T5-base with d_model = 768 and d_ff = 3072, i.e. a gated hidden size of 2048. PAPER-REPORTED (R5.8, §2.2): LLaMA uses a SwiGLU hidden dimension of 2/3·4d instead of 4d; PAPER-REPORTED (R5.9, §2): PaLM notes that SwiGLU requires three matrix multiplications rather than two and cites the compute-equivalent comparison of R5.5.

The costs that do not match at equal parameters are the activation bytes. The two-matrix form stores one `[B, T, F]` pre-activation (needed for the backward pass through act) and one `[B, T, F]` activation output (the input of the second GEMM): `2·B·T·F·b`. The gated form stores `n W_1`, `n W_3`, and their product: `3·B·T·F_g·b = 2·B·T·F·b` when `F_g = 2F/3` — equal again — but it issues three GEMMs of narrower width, which changes achievable utilisation on hardware, a Chapter 26 concern. MATHEMATICALLY-DERIVED.

```figure
id: fig-5.15
kind: memory-stack
title: Retained FFN hidden bytes at matched parameters
caption: >-
  Two tensors of width 3072 against three of width 2048: both bars stop at
  96 MiB per block, so matching parameters also matches retained activation
  bytes. What the bars do not show is GEMM shape, the one cost that differs.
  B = 8, T = 1024, BF16, from the illustrative §5.6 configuration, not a named
  model.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.9", "DERIVED:eq-5.10", "DERIVED:eq-5.11"]
alt: >-
  Two stacked bars of retained FFN hidden bytes per block at B = 8, T = 1024,
  2 bytes per value. GELU two-matrix form, F = 3072: pre-activation u 48 MiB
  plus activation v 48 MiB, total 96 MiB (2·B·T·F·b). SwiGLU gated form,
  F_g = 2048: n·W_1 32 MiB, n·W_3 32 MiB and their product 32 MiB, total
  96 MiB (3·B·T·F_g·b). The totals are equal.
spec:
  format: bytes
  variables: { B: 8, T: 1024, F: 3072, Fg: 2048, b: 2 }
  bars:
    - label: "GELU, two matrices, F = 3072"
      segments:
        - { label: "u = n·W_1, [B, T, F]", kind: tensor, formula: "B*T*F*b" }
        - { label: "v = GELU(u), [B, T, F]", kind: tensor, formula: "B*T*F*b" }
    - label: "SwiGLU, three matrices, F_g = 2048"
      segments:
        - { label: "n·W_1, [B, T, F_g]", kind: tensor, formula: "B*T*Fg*b" }
        - { label: "n·W_3, [B, T, F_g]", kind: tensor, formula: "B*T*Fg*b" }
        - { label: "SiLU(n·W_1) ⊙ n·W_3, [B, T, F_g]", kind: tensor, formula: "B*T*Fg*b" }
```

Per-token compute share: with attention's `8D²` projection FLOPs and the FFN's `4DF = 16D²` at F = 4D, the block's weight FLOPs are `24D²`, of which the FFN is two thirds — the same fraction as its parameter share `2DF/(4D² + 2DF) = 8/12`. MATHEMATICALLY-DERIVED; this identity (FLOP share = parameter share for weight GEMMs) is what makes the 2N rule of §5.6 work.

## Algorithm

```text
Algorithm 5.3 — Feed-forward block (two-matrix and gated forms)
INPUT   n : [B, T, D]; W_1 : [D, F]; W_2 : [F, D]; optional W_3 : [D, F]; act
OUTPUT  f : [B, T, D]
STATE   u, v : [B, T, F]
INVARIANT f.shape == n.shape; no cross-position data flow
1.  u ← n · W_1                         # [B, T, F]
2.  if W_3 is None:
3.      v ← act(u)                      # GELU in the reference model
4.  else:
5.      v ← act(u) ⊙ (n · W_3)          # SwiGLU when act = SiLU
6.  f ← v · W_2                         # [B, T, D]
7.  return f
TERMINATION: straight-line code.
```

Complexity: `4DF` (or `6DF_g`) FLOPs per token; `2DF` (or `3DF_g`) parameters; peak activation `2·B·T·F·b` (or `3·B·T·F_g·b`). Implementation: `reference_transformer.py` in [verification.md](verification.md).

## Implementation

Tensors → operators: `torch.nn.Linear(D, F, bias=False)`, `torch.nn.functional.gelu` or `silu`, `torch.nn.Linear(F, D, bias=False)`. Framework: PyTorch, *Model / autograd framework* layer. Kernels: two cuBLAS / cuBLASLt GEMMs with an element-wise kernel between them; fused GEMM-epilogue activations and fused SwiGLU kernels exist in the *Kernels / numerics / collectives* layer (for example in Liger Kernel and NVIDIA Transformer Engine) and are release-specific — which fusions apply to a given dtype and shape is NOT-DISCLOSED here rather than inferred. Memory: in training the pre-activation is retained; recomputation trades it for a repeated first GEMM ([§30.2](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-2-memory-management.md)). Communication: tensor parallelism splits F across devices, column-parallel for W_1/W_3 and row-parallel for W_2 (§29.2). Deployment: the block is unchanged at inference; MoE replaces it by a routed set of narrower blocks (§16).

> **Implementation note [impl.pytorch · 2.14.0 documentation, execution UNVERIFIED].** GELU has an exact (erf) and a tanh-approximate form; the two differ at the level of 10⁻³ in the activation for moderate inputs and must be pinned in the artifact because they change logits beyond the equivalence tolerance of [verification.md](verification.md). The reference model uses the exact form (ASSUMED).

## Experimental design

Proposal (for Chapter 13's ablation protocol, not executed here). Hold N and training tokens fixed; compare GELU at F = 4D against SwiGLU at F_g = 8D/3 rounded to a multiple of 64; report loss at matched steps with seed variance from ≥ 3 seeds; ablate the gate (`W_3` fixed to ones) to separate the activation from the gating. Threat: at matched parameters the two forms differ in GEMM shapes, so wall-clock is not matched — report both.

## Observations

**What the paper claims.** PAPER-REPORTED (P01, §3.3): the FFN is `max(0, xW_1 + b_1)W_2 + b_2` with d_model = 512 and d_ff = 2048, i.e. the 4× convention. PAPER-REPORTED (R5.5): GLU-variant FFNs reached lower perplexity than the ReLU FFN in the paper's T5 pretraining setup at matched parameters and compute, with SwiGLU and GEGLU among the reported variants. PAPER-REPORTED (R5.9, §2): PaLM adopted SwiGLU citing that comparison.

**What the evidence shows.** The parameter-matching identity is arithmetic and holds for every D; the quality claims rest on R5.5's single pretraining setup plus subsequent adoption in reports (R5.8, R5.9) that did not publish matched-compute ablations of the choice; no independent controlled reproduction is cited by this chapter.

**What we infer.** DERIVED: the 8/3 convention is a consequence of choosing to match parameters, not a property of SwiGLU; a team matching activation bytes or GEMM shapes instead would choose a different F_g. The reference model's GELU-at-4D default is chosen so that the accounting of §5.6 has two rather than three FFN matrices; the switch to SwiGLU in the artifact is a one-line change with identical N.

**What remains unknown.** NOT-DISCLOSED: the exact rounding of F_g and the presence of biases in most production models; UNVERIFIED: whether the fused SwiGLU kernels available in a given release preserve the exact-GELU/SiLU numerics of the reference.

## Failure modes

> **Failure mode — width mismatch between checkpoint and code.** *Symptom:* shape error on load, or silent quality loss if a permissive loader truncates. *Cause:* F_g rounded to a multiple of 64 in one implementation and not another. *Detection:* compare `W_1.shape` against the configuration record. *Mitigation:* store F explicitly in the configuration; never derive it from D at load time.

> **Failure mode — activation-form mismatch.** *Symptom:* logits differ from a reference by ~10⁻³ relative in FP32. *Cause:* exact versus tanh-approximate GELU, or Swish with a non-unit β. *Detection:* the equivalence protocol of [verification.md](verification.md) on a fixed input. *Mitigation:* pin the activation form in the artifact record.

> **Failure mode — hidden tensor dominates memory.** *Symptom:* out-of-memory in the FFN rather than in attention at short T. *Cause:* `2·B·T·F·b` retained per block. *Detection:* per-block activation trace. *Mitigation:* activation recomputation for the FFN; smaller microbatch.

## Siblings

**GELU two-matrix FFN (this section's reference)** — this file
Baseline against which the others are differentials.

**SwiGLU / GLU-family gated FFN** — [§13.3](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-3-feed-forward-alternatives.md)
Why it exists: reported lower loss at matched compute (R5.5). What assumption changed: the nonlinearity multiplies a linear branch instead of gating by sign or magnitude alone. What objective changed: none. What problem it solved: quality at fixed N. What new failure mode it introduced: three narrower GEMMs and width-rounding ambiguity. Changed primitive: `act(nW_1)W_2` → `(act(nW_1) ⊙ nW_3)W_2`.

**Mixture-of-experts FFN** — [§16.1](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-1-conditional-computation.md)
Why it exists: parameters without proportional per-token FLOPs. What assumption changed: each token uses a routed subset of E blocks. What objective changed: an auxiliary load-balancing term is usually added. What problem it solved: N grows while activated FLOPs stay near the dense block's. What new failure mode it introduced: routing imbalance and all-to-all communication. Changed primitive: one `[D, F]` pair → E pairs plus a router.

```figure
id: fig-5.16
kind: compare
title: Feed-forward siblings at matched parameters
caption: >-
  Read the parameter and FLOP rows first: the gated form equals the
  two-matrix form to the unit at D = 768 because its width was chosen to
  make it so. The rows that differ are GEMM count, width and failure mode.
  The mixture-of-experts column breaks the link between parameters and
  per-token FLOPs, which is the whole point of that sibling.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.11", "DERIVED:eq-5.12", R5.5]
alt: >-
  Comparison of three feed-forward forms at fixed D = 768. GELU two-matrix
  (reference): act(n·W_1)·W_2, two GEMMs, F = 3072, 2·D·F = 4,718,592
  parameters, 4·D·F = 9,437,184 GEMM FLOPs per token, retained hidden bytes
  2·B·T·F·b. SwiGLU gated: (SiLU(n·W_1) ⊙ n·W_3)·W_2, three narrower GEMMs,
  F_g = 2048, 3·D·F_g = 4,718,592 parameters, 6·D·F_g = 9,437,184 FLOPs,
  3·B·T·F_g·b = 2·B·T·F·b bytes; new failure mode width-rounding ambiguity.
  Mixture of experts: E pairs of matrices plus a router, parameters grow with
  E while activated FLOPs stay near the dense block's, an auxiliary
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
    - { dimension: "GEMM FLOPs per token", values: { gelu: "4·D·F = 9,437,184", swiglu: "6·D·F_g = 9,437,184", moe: "near the dense block's; set by the activated subset" } }
    - { dimension: "retained hidden bytes", values: { gelu: "2·B·T·F·b", swiglu: "3·B·T·F_g·b = 2·B·T·F·b", moe: "not derived here (§16)" } }
    - { dimension: "objective change", values: { gelu: "none", swiglu: "none", moe: "auxiliary load-balancing term usually added" } }
    - { dimension: "new failure mode", values: { gelu: "none beyond activation-form pinning", swiglu: "three narrower GEMMs; width-rounding ambiguity", moe: "routing imbalance; all-to-all communication" } }
```

## Extensions

Domain adaptation leaves the block unchanged. Long context does not touch it — its cost is linear in T. Multimodal encoders often use the same block with their own D; agents do not change it. MoE (§16) is the extension that changes the trace line. Proposals only.

## Limitations

The accounting assumes dense GEMMs and ignores the O(F) element-wise costs, which are negligible in FLOPs but not in memory traffic. The block is valid as written for D and F that the hardware can tile efficiently; odd widths are legal and slow. Falsification: a measured FFN FLOP count on a profiler that disagrees with Eq. 5.12 by more than the element-wise term indicates hidden padding or recomputation.

## Reproducibility

Configuration: D = 768, F = 3072 (GELU, exact) or F_g = 2048 (SwiGLU); no biases; PyTorch 2.14.0 documented API (R5.13/R5.14), execution UNVERIFIED. Unresolved: fused-kernel numerics per release.

## References

P01 · R5.1 · R5.5 · R5.8 · R5.9 · R5.11 · [references.md](references.md)
