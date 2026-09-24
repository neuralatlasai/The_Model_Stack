---
id: ms.section.5.4
entity_type: section
title: Residual organization
short_title: Pre-norm vs post-norm
volume: 1
part: 1
chapter: 5
section: 5.4
slug: 05-4-residual-organization
parent: ms.chapter.5
prev_sibling: ms.section.5.3
next_sibling: ms.section.5.5
children: []
prerequisites: [ms.section.3.2, ms.section.3.4, ms.section.5.1]
downstream: [ms.section.13.4, ms.section.19.3, ms.section.20.4, ms.section.64.2]
related: []
siblings_by_mechanism: [ms.section.13.4]
relations:
  - {type: supported_by, target: paper.P01}
  - {type: implemented_by, target: impl.pytorch}
axes:
  lifecycle: [pretraining]
  mechanism: [normalization, residual_stream]
  feedback_setting: []
  modality: [text]
papers: [P01]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 5.4 Residual organization

## Scope

Objective: fix where normalisation sits relative to the residual additions of Eq. 5.2, state the signal-propagation consequence at initialisation, and record which initialisation assumptions the reference model makes. Baseline: the post-norm ordering of P01. Success criterion: the reader can write both orderings as equations, derive the variance of the residual stream at initialisation under each, and say which claims are paper-reported and which are derived. Boundaries: the empirical stability evidence at scale and the LayerNorm-versus-RMSNorm comparison are developed in [§13.4](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-4-normalization-and-residuals.md); optimiser interaction in [§20.4](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-4-stability-instrumentation.md).

## Why this exists

What failed before was training deep post-norm stacks without a learning-rate warm-up. PAPER-REPORTED (R5.4, abstract): for the post-LN Transformer at initialisation the expected gradients of the parameters near the output layer are large, so training without warm-up is unstable, whereas with the normalisation inside the residual branch (pre-LN) the gradients are well-behaved at initialisation and warm-up can be removed. The bottleneck was that warm-up length became an untracked hyperparameter that had to be re-tuned per depth. The dominant constraint that changed the design was depth: PAPER-REPORTED (R5.2, §2.3): the GPT-2 report moved layer normalisation to the input of each sub-block, added a final layer normalisation after the last block, and scaled residual-layer weights at initialisation by 1/√N with N the number of residual layers, to account for accumulation on the residual path with depth. What changed is the ordering of Eq. 5.2, and — as the trace shows — nothing else: parameters and FLOPs are identical.

## Intuition

Physically, the residual stream is a sum of L block outputs added to the embedding. If each block adds an independent contribution of variance σ², the stream's variance after ℓ blocks is `σ_0² + ℓσ²` — linear growth — unless something renormalises it. Post-norm renormalises after every addition, so the stream has unit scale everywhere but the identity path is repeatedly rescaled; pre-norm normalises only what each block reads, so the identity path is untouched and the stream grows. Both are consistent; they differ in where the gradient must pass through a normalisation. MATHEMATICALLY-DERIVED under the independence assumption below. Heuristically, pre-norm keeps a "clean" skip path; this phrase is a mnemonic, not a mechanism.

## Formulation

Let `f_ℓ`, ℓ = 1…2L, denote the ℓ-th sub-block with parameters at initialisation — block k contributes its attention sub-block as ℓ = 2k−1 and its FFN sub-block as ℓ = 2k — so `h_ℓ` is the stream after ℓ residual additions; Norm is RMSNorm.

> **Definition — pre-norm block / post-norm block.** A pre-norm block computes `h ← h + f(Norm(h))`; a post-norm block computes `h ← Norm(h + f(h))`.

$$
\text{post-norm (P01): } h_{\ell} = \mathrm{Norm}\big(h_{\ell-1} + f_\ell(h_{\ell-1})\big)
$$
*(Eq. 5.13)* where Norm in P01 is LayerNorm (PAPER-REPORTED, P01 §3.1: the output of each sub-layer is LayerNorm(x + Sublayer(x))).

$$
\text{pre-norm (reference model): } h_{\ell} = h_{\ell-1} + f_\ell\big(\mathrm{Norm}(h_{\ell-1})\big)
$$
*(Eq. 5.14)* where the final `Norm(h_L)` of Eq. 5.3 is required because h_L itself is not normalised.

```figure
id: fig-5.17
kind: diagram
title: Pre-norm and post-norm orderings of one sub-block
caption: >-
  The two groups have the same nodes in a different order. In pre-norm the
  emphasised identity edge carries h_ℓ−1 straight to the add, so the stream is
  never rescaled and grows with depth; in post-norm the add feeds the norm, so
  the stream is rescaled every block and the gradient crosses the norm's
  Jacobian each time. Parameters and FLOPs are identical.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.13", "DERIVED:eq-5.14"]
alt: >-
  Two side-by-side groups. Pre-norm (Eq. 5.14, reference model): the input
  h_ℓ−1 [B, T, D] goes to RMSNorm (D gains), then to the sub-block f
  (attention or FFN), then to a residual add; an emphasised identity edge
  also carries h_ℓ−1 directly to the add, and the output h_ℓ has RMS that
  grows as the square root of depth at initialisation. Post-norm (Eq. 5.13,
  P01): the input goes to the sub-block f, then to the residual add together
  with the identity edge, then through the norm (LayerNorm in P01) to h_ℓ,
  whose RMS is 1 up to the gain; the edge from the add into the norm is where
  the gradient passes the norm's Jacobian.
spec:
  direction: LR
  nodes:
    - { id: pin, kind: tensor, label: "h_ℓ−1", sub: "[B, T, D]", group: pre }
    - { id: pn, kind: process, label: "RMSNorm", sub: "γ: D params", group: pre }
    - { id: pf, kind: process, label: "sub-block f", sub: "attention or FFN", group: pre }
    - { id: padd, kind: process, label: "residual add", sub: "h + f(Norm(h))", group: pre }
    - { id: pout, kind: tensor, label: "h_ℓ", sub: "RMS grows as √ℓ at init", group: pre }
    - { id: qin, kind: tensor, label: "h_ℓ−1", sub: "[B, T, D]", group: post }
    - { id: qf, kind: process, label: "sub-block f", sub: "attention or FFN", group: post }
    - { id: qadd, kind: process, label: "residual add", sub: "h + f(h)", group: post }
    - { id: qn, kind: process, label: "Norm (LayerNorm in P01)", sub: "γ: D params", group: post }
    - { id: qout, kind: tensor, label: "h_ℓ", sub: "RMS = 1 up to γ", group: post }
  edges:
    - { from: pin, to: pn }
    - { from: pn, to: pf }
    - { from: pf, to: padd }
    - { from: pin, to: padd, kind: emphasis, label: "identity path, never rescaled" }
    - { from: padd, to: pout }
    - { from: qin, to: qf }
    - { from: qf, to: qadd }
    - { from: qin, to: qadd, label: "identity path" }
    - { from: qadd, to: qn, label: "gradient crosses the norm" }
    - { from: qn, to: qout }
  groups:
    - { id: pre, label: "pre-norm, Eq. 5.14 (reference)" }
    - { id: post, label: "post-norm, Eq. 5.13 (P01)" }
```

$$
h_{2L} = h_0 + \sum_{\ell=1}^{2L} f_\ell\big(\mathrm{Norm}(h_{\ell-1})\big)
$$
*(Eq. 5.15)* where the residual stream is a sum of sub-block outputs — the "stream" reading of §5.1 made literal; `h_{2L}` here is the stream after the last block, written `h_L` in the block indexing of §5.1.

$$
\mathrm{RMSNorm}(x)_i = \frac{x_i}{\sqrt{\varepsilon + \tfrac{1}{D}\sum_{j=1}^{D} x_j^{2}}}\;\gamma_i
$$
*(Eq. 5.16)* where γ ∈ ℝ^D is a learned gain; OFFICIAL-DOCUMENTATION (R5.14, PyTorch 2.14.0): `torch.nn.RMSNorm` computes this form with ε inside the square root and, when ε is unspecified, defaults to `torch.finfo(torch.float32).eps` for fp16, bf16 and fp32 inputs. PAPER-REPORTED (R5.3, abstract): RMSNorm drops LayerNorm's re-centering and keeps re-scaling invariance.

> **Assumption.** Sub-block outputs at initialisation are zero-mean, mutually independent across ℓ, with variance σ_f² each · *sensitivity:* correlation across blocks changes the linear growth of Eq. 5.17 to something between linear and quadratic; the qualitative conclusion (pre-norm stream grows with depth) survives.

> **Assumption.** Initialisation of linear weights follows the CS336 handout: truncated normal with variance `2/(d_in + d_out)`, truncated at ±3σ; embeddings N(0, 1) truncated at ±3; RMSNorm gains 1 · *sensitivity:* OFFICIAL-DOCUMENTATION (R5.11, §3.3.1): the handout gives these as approximate initialisations that work well in most cases and states that pre-norm Transformers are unusually robust to initialisation; the residual-branch 1/√N scaling of R5.2 is an alternative the artifact exposes as a switch.

## Mechanism

Under Eq. 5.14 and the first assumption,

$$
\mathrm{Var}[h_\ell] = \mathrm{Var}[h_0] + \ell\,\sigma_f^{2}
$$
*(Eq. 5.17)* where the variance is per coordinate, so the residual stream's RMS grows as √ℓ at initialisation. MATHEMATICALLY-DERIVED. Because each block reads `Norm(h_{ℓ−1})`, its input has unit RMS regardless of ℓ, so σ_f² is depth-independent if the block weights are; the relative size of block ℓ's contribution to the stream is then `σ_f/√(Var[h_0] + ℓσ_f²)`, decreasing as `1/√ℓ`. This is the quantitative form of "later blocks perturb the stream less at initialisation". DERIVED. Scaling residual-branch output weights by 1/√L (the GPT-2 rule with N = 2L residual layers, PAPER-REPORTED R5.2) replaces `ℓσ_f²` by `ℓσ_f²/N`, keeping `Var[h_L]` at the order of `Var[h_0]`. DERIVED from Eq. 5.17 by substitution; the report does not give this derivation, which is the book's.

```figure
id: fig-5.18
kind: chart
title: Residual-stream RMS against depth at initialisation
caption: >-
  Eq. 5.17 in units where Var[h_0] = σ_f² = 1, with ℓ counting sub-block
  additions (N = 2L = 24 for L = 12). Unscaled pre-norm climbs as √(1 + ℓ) to
  5 at the last addition; the 1/√N branch scaling of R5.2 holds it at √2;
  post-norm stays at 1 by construction. The curves use the independence
  assumption of this section and describe initialisation only.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.17", R5.2]
alt: >-
  Line chart of the residual-stream RMS against the number of residual
  additions ℓ from 0 to 24, with Var[h_0] = 1 and σ_f² = 1. Pre-norm without
  scaling follows √(1 + ℓ), reaching 5.0 at ℓ = 24. Pre-norm with the 1/√N
  branch scaling (N = 24) follows √(1 + ℓ/24), reaching √2 ≈ 1.41 at ℓ = 24.
  Post-norm is flat at 1.0.
spec:
  type: line
  x: { label: "residual additions ℓ (2 per block)", scale: linear, format: integer, domain: [0, 24] }
  y: { label: "RMS(h_ℓ), units of σ_f", scale: linear, format: fixed2 }
  variables: { V0: 1, s2: 1, N: 24 }
  series:
    - { id: pre, label: "pre-norm, Eq. 5.17", formula: "sqrt(V0 + x*s2)", sample: { from: 0, to: 24, count: 25 }, emphasis: true }
    - { id: scaled, label: "pre-norm, branch scaled by 1/√N (R5.2)", formula: "sqrt(V0 + x*s2/N)", sample: { from: 0, to: 24, count: 25 } }
    - { id: post, label: "post-norm, Eq. 5.13", formula: "1", sample: { from: 0, to: 24, count: 25 }, dashed: true }
  annotations:
    - { x: 24, label: "ℓ = N = 24: 5.0 · 1.41 · 1.0" }
```

```figure
id: fig-5.19
kind: calculator
title: Residual-stream variance at depth
caption: >-
  Eq. 5.17 with the GPT-2 switch. The defaults are the reference model's last
  addition (ℓ = N = 24), in units where Var[h_0] = σ_f² = 1: RMS 5, and the
  last sub-block contributes 20% of the stream's scale. Turn the switch on and
  the RMS drops to √2. The 96-block preset shows the contribution shrinking
  as 1/√ℓ.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.17", R5.2]
alt: >-
  Calculator for Eq. 5.17, Var[h_ℓ] = Var[h_0] + ℓ·σ_f², with an optional
  division of σ_f² by N when residual-branch scaling is on. At the defaults
  (Var[h_0] = 1, σ_f² = 1, ℓ = 24, N = 24, scaling off) the variance is 25,
  the RMS 5, and the relative contribution of one sub-block σ_f/RMS is 20%.
  With scaling on the variance is 2, the RMS 1.41 and the contribution 14.4%.
  With 96 blocks (ℓ = N = 192, scaling off) the RMS is 13.9 and the
  contribution 7.2%.
spec:
  tex: >-
    \mathrm{Var}[h_\ell] = \mathrm{Var}[h_0] + \ell\,\sigma_f^{2} / N^{s}
  equation: "5.17"
  inputs:
    - { symbol: V0, label: "Var[h_0]", default: 1, min: 0.25, max: 4, step: 0.25, format: fixed2 }
    - { symbol: s2, label: "σ_f² per sub-block", default: 1, min: 0.25, max: 4, step: 0.25, format: fixed2 }
    - { symbol: l, label: "residual additions ℓ", default: 24, min: 0, max: 192, step: 1, format: integer }
    - { symbol: N, label: "residual layers N = 2L", default: 24, min: 2, max: 192, step: 2, format: integer }
    - { symbol: s, label: "1/√N branch scaling, 0 off, 1 on", default: 0, min: 0, max: 1, options: [0, 1], format: integer }
  outputs:
    - { symbol: Var, label: "Var[h_ℓ]", formula: "V0 + l*s2/pow(N, s)", format: fixed2 }
    - { symbol: RMS, label: "RMS(h_ℓ)", formula: "sqrt(Var)", format: fixed2, emphasis: true }
    - { symbol: rel, label: "one sub-block's share of the scale, σ_f/RMS", formula: "sqrt(s2/pow(N, s))/RMS", format: percent }
  presets:
    - { label: "GPT-2 rule on (R5.2)", values: { s: 1 } }
    - { label: "96 blocks, ℓ = N = 192", values: { l: 192, N: 192 } }
```

Under Eq. 5.13 the stream is renormalised after every block, so `Var[h_ℓ] = 1` for all ℓ at initialisation (up to the gain), and the gradient with respect to `h_{ℓ−1}` passes through Norm's Jacobian at every block. PAPER-REPORTED (R5.4): the paper's mean-field analysis shows that this makes the expected gradient scale of parameters near the output large at initialisation for post-LN and of order independent of depth for pre-LN; the exact bounds are the paper's Theorem 1 and are not restated here.

Costs. Normalisation adds `2D` parameters per block and `D` for the final norm (§5.6); its FLOPs are O(D) per token (a sum of squares, a rsqrt, a scale) and are omitted from FLOP totals; its memory traffic is one read and one write of a `[B, T, D]` tensor per call, two calls per block (Algorithm 5.4, lines 2–3) — `4·B·T·D·b` bytes per block — which at the reference configuration is more traffic than the attention projections' weight reads and is why norm-fusion is a standard kernel optimisation (§26.4). MATHEMATICALLY-DERIVED. Training retains the norm input (or the rsqrt factor) for the backward pass: `B·T·D·b` per call. Ordering changes none of these counts; it changes only the tensors' statistics.

```figure
id: fig-5.20
kind: memory-stack
title: Norm traffic against attention weight reads, per block
caption: >-
  The norm has almost no parameters and almost no FLOPs, yet at B = 8,
  T = 1024 its traffic, 4·B·T·D·b for the two calls per block, is 48 MiB
  per block against 4.5 MiB of attention projection weights. That gap, not
  arithmetic, is why norm and add-norm fusion are standard kernels.
  Illustrative §5.6 configuration, not a named model.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-5.16"
alt: >-
  Two stacked bars in bytes per block at B = 8, T = 1024, D = 768, 2 bytes
  per value. RMSNorm traffic: reads 2·B·T·D·b = 24 MiB plus writes
  2·B·T·D·b = 24 MiB, total 48 MiB. Attention projection weight reads:
  W_Q, W_K, W_V and W_O, 4·D²·b = 4.5 MiB.
spec:
  format: bytes
  variables: { B: 8, T: 1024, D: 768, b: 2 }
  bars:
    - label: "RMSNorm traffic per block"
      segments:
        - { label: "reads, 2 × B·T·D·b", kind: flow, formula: "2*B*T*D*b" }
        - { label: "writes, 2 × B·T·D·b", kind: flow, formula: "2*B*T*D*b" }
    - label: "attention weight reads per block"
      segments:
        - { label: "W_Q, W_K, W_V, W_O: 4·D²·b", kind: tensor, formula: "4*D^2*b" }
```

## Algorithm

```text
Algorithm 5.4 — One residual block under the two orderings
INPUT   h : [B, T, D]; sub-block f; gains γ_att, γ_ffn; ordering ∈ {pre, post}
OUTPUT  h' : [B, T, D]
INVARIANT h'.shape == h.shape; under "pre", RMS(f's input) == 1 up to γ; under "post", RMS(h') == 1 up to γ
1.  if ordering == pre:
2.      h ← h + Attention(RMSNorm(h; γ_att))
3.      h ← h + FFN(RMSNorm(h; γ_ffn))
4.  else:
5.      h ← RMSNorm(h + Attention(h); γ_att)
6.      h ← RMSNorm(h + FFN(h); γ_ffn)
7.  return h
TERMINATION: straight-line code.
```

Complexity: identical GEMM FLOPs and parameters under both orderings; `6·B·T·D·b` bytes of norm traffic per block. Implementation: `ordering` flag in `reference_transformer.py`, [verification.md](verification.md).

## Implementation

Tensors → operators: `torch.nn.RMSNorm(D, eps=1e-6)` in the reference (ε pinned explicitly rather than left to the documented default, ASSUMED); the residual add is a plain tensor add. Framework: PyTorch. Kernels: RMSNorm is a row reduction plus an element-wise scale, typically fused into one kernel; fusing the add and the norm ("add-norm" kernels) removes one `[B, T, D]` round-trip and is provided by kernel libraries such as Liger Kernel and NVIDIA Transformer Engine — availability per dtype and release is NOT-DISCLOSED here. Memory: keep the residual stream in FP32 under mixed precision (§3.4) so that the `1/√ℓ`-shrinking block contributions of Eq. 5.17 are not rounded away in BF16 at large ℓ — the eight-bit mantissa of BF16 cannot represent a contribution smaller than 2⁻⁸ of the running value. MATHEMATICALLY-DERIVED from the format ([§3.1](../ch03-numerical-computation-and-trustworthy-training/03-1-numeric-representations.md)). Communication: none. Deployment: unchanged at inference; the final norm is applied to the last position only at decode (§5.5).

> **Implementation note [impl.pytorch · 2.14.0 documentation, execution UNVERIFIED].** `torch.nn.RMSNorm` exposes `elementwise_affine=True` by default with gains initialised to ones (OFFICIAL-DOCUMENTATION, R5.14); the reference model keeps the default. The variance computation in low precision should up-cast to FP32 inside the norm; whether the built-in module does so for a BF16 input is not asserted from the documentation and is UNVERIFIED.

## Experimental design

Proposal. On the verification fixture at initialisation (no training), record `RMS(h_ℓ)` for ℓ = 0…L under pre-norm with and without 1/√N residual scaling, and under post-norm; expected: √ℓ growth, near-constant, and constant respectively (Eq. 5.17). Then record the gradient norm of `W_O` and `W_2` per block for one backward pass; expected under R5.4: depth-dependent scale for post-norm, depth-independent for pre-norm. Seeds ≥ 5; report medians and ranges. This checks the derivations, not training quality; training-quality comparisons are Chapter 13's protocol.

## Observations

**What the paper claims.** PAPER-REPORTED (P01): post-norm with dropout 0.1 on each sub-layer output before the residual add and on the embedding sums, warm-up of 4000 steps with Adam (β₁ = 0.9, β₂ = 0.98, ε = 10⁻⁹). PAPER-REPORTED (R5.2): pre-norm ordering, final norm, 1/√N residual scaling. PAPER-REPORTED (R5.4): gradient-scale analysis at initialisation and warm-up removal for pre-LN in the paper's translation and BERT-pretraining experiments. PAPER-REPORTED (R5.10, abstract): DeepNet modifies the residual connection and derives an initialisation to bound model updates, scaling to 1,000 layers. PAPER-REPORTED (R5.8, §2.2): LLaMA normalises the input of each sub-layer with RMSNorm, citing training stability.

**What the evidence shows.** Eq. 5.17 is arithmetic. The warm-up claim of R5.4 has been widely adopted but this chapter cites no independent controlled reproduction at the depths of current models; the DeepNet result is a single group's report. The choice of pre-norm in R5.8 and R5.9 is reported as a stability motivation, not with a published ablation against post-norm at their scale.

**What we infer.** DERIVED: ordering is a numerical-conditioning decision with zero parameter or FLOP cost and a fixed memory-traffic cost; the reference model adopts pre-norm because its initialisation behaviour is derivable (Eq. 5.17) and because every PAPER-REPORTED decoder-only report cited here uses it. ASSUMED: the CS336 initialisation; the 1/√N switch is provided so the reader can test Eq. 5.17's substitution.

**What remains unknown.** UNVERIFIED: whether the pre-norm stream's √ℓ growth is harmful or benign for the reference model's training — this chapter runs no training. NOT-DISCLOSED: the exact ε, gain initialisation and residual-scaling rules of most production models.

## Failure modes

> **Failure mode — missing final norm under pre-norm.** *Symptom:* logits with very large magnitude at initialisation; loss starts far above log V. *Cause:* Eq. 5.3 applied to un-normalised h_L whose RMS is ~√(2L) at initialisation (Eq. 5.17 after 2L sub-block additions). *Detection:* `RMS(h_L)` versus `RMS(Norm(h_L))` on the fixture. *Mitigation:* keep the final norm; the artifact asserts its presence.

> **Failure mode — BF16 residual absorption.** *Symptom:* deep blocks appear to contribute nothing; gradients to late blocks are non-zero but the forward output is insensitive to them. *Cause:* block contributions below the BF16 resolution of the running sum. *Detection:* compare `h_L` from BF16 and FP32 residual streams. *Mitigation:* FP32 residual stream.

> **Failure mode — ε mismatch across implementations.** *Symptom:* small but systematic logit differences between a checkpoint's training framework and an inference engine. *Cause:* ε inside versus outside the square root, or a different default. *Detection:* the equivalence protocol at a fixed input. *Mitigation:* record ε and its placement in the configuration.

## Siblings

**Post-norm block (P01)** — this file, Eq. 5.13
Why it exists: the original design. What assumption changed (relative to pre-norm): the stream is renormalised after every addition. What objective changed: none. What problem it solved: bounded stream scale at every depth. What new failure mode it introduced: large output-side gradients at initialisation requiring warm-up (R5.4). Changed primitive: `h + f(Norm(h))` → `Norm(h + f(h))`.

**Residual-scaled pre-norm (GPT-2 rule; DeepNorm)** — [§13.4](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-4-normalization-and-residuals.md)
Why it exists: Eq. 5.17's growth at large L. What assumption changed: block outputs are down-weighted at initialisation (R5.2) or the residual branch is re-weighted with a derived constant (R5.10). What objective changed: none. What problem it solved: depth-independent stream scale without post-norm's gradient issue. What new failure mode it introduced: an extra depth-dependent constant that must be recorded. Changed primitive: `W_O, W_2` initialisation scale.

**Parallel block (attention and FFN read the same norm)** — [§13.4](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-4-normalization-and-residuals.md)
Why it exists: PAPER-REPORTED (R5.9, §2): PaLM computes `y = x + MLP(LayerNorm(x)) + Attention(LayerNorm(x))` so the two input GEMMs can be fused, reporting roughly 15% faster training at large scale with a small quality degradation at 8B and none observed at 62B. What assumption changed: the FFN no longer sees the attention output of the same block. What objective changed: none. What problem it solved: one norm and one fused input GEMM per block. What new failure mode it introduced: quality sensitivity at small scale. Changed primitive: sequential sub-blocks → parallel sub-blocks.

**LayerNorm versus RMSNorm** — [§13.4](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-4-normalization-and-residuals.md)
Why it exists: the mean subtraction of LayerNorm was hypothesised dispensable (R5.3). What assumption changed: re-centering is unnecessary. What objective changed: none. What problem it solved: one fewer reduction and no bias parameter. What new failure mode it introduced: none documented here. Changed primitive: `(x − μ)/σ · γ + β` → `x / RMS(x) · γ`.

```figure
id: fig-5.21
kind: compare
title: Residual orderings at initialisation
caption: >-
  The parameter and FLOP row is the same everywhere except the parallel
  block's single norm, so the choice among these columns is about
  conditioning, not cost. Read the variance and gradient rows together:
  post-norm buys a bounded stream by routing every gradient through a norm,
  and pre-norm keeps the identity path but lets the stream grow unless the
  branch is rescaled.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-5.13", "DERIVED:eq-5.14", "DERIVED:eq-5.17", R5.2, R5.4, R5.9, R5.10]
alt: >-
  Comparison of four residual organisations at fixed D and L. Post-norm
  (P01): h ← Norm(h + f(h)); stream variance 1 up to the gain; gradient
  crosses the norm's Jacobian at every block; R5.4 reports large output-side
  gradients at initialisation and a need for warm-up. Pre-norm (reference):
  h ← h + f(Norm(h)); Var[h_0] + ℓ·σ_f² (Eq. 5.17); identity path untouched;
  R5.4 reports well-behaved gradients and removable warm-up; final norm
  required. Residual-scaled pre-norm (GPT-2 rule, DeepNorm): variance
  Var[h_0] + ℓ·σ_f²/N; an extra depth-dependent initialisation constant to
  record. Parallel block (PaLM): y = x + MLP(Norm(x)) + Attention(Norm(x));
  one norm and one fused input GEMM per block; reported quality sensitivity
  at small scale.
spec:
  axis: >-
    Scale of the residual stream and of gradients at initialisation, and
    per-block cost, at fixed D and L; trained quality is not an axis here
  columns:
    - { id: post, label: "Post-norm (P01)", node: ms.section.5.4 }
    - { id: pre, label: "Pre-norm (reference)", node: ms.section.5.4 }
    - { id: scaled, label: "Residual-scaled pre-norm", node: ms.section.13.4 }
    - { id: par, label: "Parallel block (PaLM)", node: ms.section.13.4 }
  rows:
    - { dimension: "block equation", values: { post: "h ← Norm(h + f(h))", pre: "h ← h + f(Norm(h))", scaled: "h ← h + f(Norm(h)), W_O and W_2 init × 1/√N", par: "y = x + MLP(Norm(x)) + Attention(Norm(x))" } }
    - { dimension: "Var[h_ℓ] at initialisation", values: { post: "1 up to γ", pre: "Var[h_0] + ℓ·σ_f² (Eq. 5.17)", scaled: "Var[h_0] + ℓ·σ_f²/N", par: "not derived here (§13.4)" } }
    - { dimension: "gradient path", values: { post: "through the norm's Jacobian at every block", pre: "identity path untouched", scaled: "identity path untouched", par: "identity path untouched" } }
    - { dimension: "reported at initialisation", values: { post: "large output-side gradients; warm-up needed (R5.4)", pre: "well-behaved gradients; warm-up removable (R5.4)", scaled: "stream kept at the order of Var[h_0] (derived here); DeepNet bounds updates (R5.10)", par: "not analysed at initialisation here" } }
    - { dimension: "final norm", values: { post: "not required, h_L already normalised", pre: "required (Eq. 5.14)", scaled: "required", par: "not derived here" } }
    - { dimension: "parameters and GEMM FLOPs", values: { post: "reference; 2·D norm gains per block", pre: "identical", scaled: "identical", par: "one norm per block; the two input GEMMs fuse" } }
    - { dimension: "extra constant to record", values: { post: "none", pre: "none", scaled: "depth-dependent initialisation scale", par: "none" } }
    - { dimension: "new failure mode", values: { post: "warm-up length as an untracked hyperparameter", pre: "missing final norm; BF16 absorption at depth", scaled: "an extra depth-dependent constant that must be recorded", par: "quality sensitivity at small scale (R5.9)" } }
```

## Extensions

Depth beyond ~100 blocks makes Eq. 5.17's growth and the 1/√N rule material (§13.4); long context does not interact with ordering; multimodal encoders often use post-norm variants inherited from vision models, which changes the initialisation analysis for those towers. Proposals only.

## Limitations

The variance analysis holds at initialisation under independence and says nothing about trained networks, where block outputs are correlated. The claims about warm-up are the cited papers' experiments, in their settings. Falsification of Eq. 5.17: measured `RMS(h_ℓ)` at initialisation that does not grow as √ℓ under pre-norm without residual scaling would indicate correlated or non-zero-mean block outputs — itself informative.

## Reproducibility

Ordering flag, ε = 10⁻⁶, gains = 1, CS336 initialisation (R5.11 §3.3.1) with a 1/√N switch; PyTorch 2.14.0 documented API (R5.14), execution UNVERIFIED. Unresolved: the built-in module's internal up-cast behaviour for BF16.

## References

P01 · R5.2 · R5.3 · R5.4 · R5.8 · R5.9 · R5.10 · R5.11 · R5.14 · [references.md](references.md)
