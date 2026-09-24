---
id: ms.section.2.4
entity_type: section
title: Differential calculus
short_title: Derivatives and autodiff
volume: 1
part: 1
chapter: 2
section: 2.4
slug: 02-4-differential-calculus
parent: ms.chapter.2
prev_sibling: ms.section.2.3
next_sibling: ms.section.2.5
children: []
prerequisites: [ms.section.2.1, ms.section.2.2, ms.section.2.3]
downstream: [ms.section.3.2, ms.section.3.3, ms.section.5.5, ms.section.19.3, ms.section.20.1, ms.section.30.2, ms.section.33.1, ms.section.34.2, ms.section.40.3]
related: [ms.section.21.2]
siblings_by_mechanism: []
relations:
  - {type: prerequisite_of, target: ms.section.3.3}
  - {type: prerequisite_of, target: ms.section.34.2}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.jax}
axes: {lifecycle: [pretraining, post_training], mechanism: [differentiation, autodiff, curvature, gradient_estimation], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch, impl.jax, impl.liger-kernel]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED], empirically_observed: false}
word_count_target: 1100
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 02.4 Differential calculus

## Scope

Objective: fix Jacobians, vector–Jacobian products, the chain rule, forward- versus reverse-mode automatic differentiation, Hessian approximations, and stochastic gradient estimators, each with its computational cost. Baseline: "take the gradient" written as if free. Success: every derivative quantity in later chapters is named (VJP, JVP, HVP, Gauss–Newton, K-FAC, diagonal; score-function, reparameterisation, straight-through) with its cost relative to a forward pass and its memory footprint. Boundaries: graph construction, saved tensors, in-place operations, gradient accumulation, clipping, and gradient checking are owned by [§03.3](../ch03-numerical-computation-and-trustworthy-training/03-3-automatic-differentiation.md); optimiser mechanics by [§20.1](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-1-optimizer-mechanics.md); policy gradients by [§34.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-2-policy-gradients.md).

## Why this exists

What failed: methods were compared by their update rule while the cost of computing the update was hidden — a natural-gradient step, a Hessian-vector product, and a plain gradient were treated as commensurate. The bottleneck: for a model with N parameters, anything that touches an N×N object is impossible; only products with vectors and factored approximations are affordable, and the memory of reverse mode — not its FLOPs — is what limits sequence length and batch size. The dominant constraint: cost as a multiple of the forward pass, and bytes of saved activations. What changed: derivatives are written as linear maps applied to vectors, priced per application.

## Intuition

Physically, differentiation is linear-algebra bookkeeping on the forward computation: forward mode pushes a tangent vector through the same graph, reverse mode pulls a cotangent vector back through its transpose. A scalar loss has one cotangent, so reverse mode gives the whole gradient in one pass; this is why training uses it and why it must keep the forward intermediates in memory. Heuristically, a gradient estimator is "a Monte Carlo estimate of a derivative"; the score-function and reparameterisation estimators differ in what they sample and therefore in variance.

## Formulation

> **Definition — Jacobian, VJP, JVP.** For f: ℝⁿ → ℝᵐ, J_f(x) ∈ ℝ^{m×n} has entries ∂f_i/∂x_j. The vector–Jacobian product of cotangent v ∈ ℝᵐ is vᵀJ_f ∈ ℝⁿ; the Jacobian–vector product of tangent u ∈ ℝⁿ is J_f u ∈ ℝᵐ.

$$
J_{f\circ g}(x) = J_f\big(g(x)\big)\, J_g(x), \qquad v^{\top} J_{f\circ g} = \big(v^{\top} J_f\big) J_g, \qquad J_{f\circ g}\, u = J_f\big(J_g\, u\big)
$$
*(Eq. 2.14)* where g: ℝⁿ → ℝᵏ, f: ℝᵏ → ℝᵐ; the VJP composes right-to-left (reverse mode), the JVP left-to-right (forward mode); neither forms a Jacobian.

> **Definition — forward-mode / reverse-mode differentiation.** Forward mode evaluates J u alongside the forward computation with one tangent per input direction; reverse mode records the forward computation and evaluates vᵀJ for one cotangent per output direction.

For softmax cross-entropy with logits z ∈ ℝ^V and target distribution y (one-hot for a token target):

$$
\mathcal{L}(z) = -\sum_{v} y_v \log p_v = -\,y^{\top} z + \operatorname{LSE}(z), \qquad \operatorname{LSE}(z) = m + \log \sum_{v} e^{z_v - m}, \quad m = \max_v z_v
$$
*(Eq. 2.15)* where p = softmax(z), Σ_v y_v = 1; the second form is the numerically stable one ([§03.2](../ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md)).

$$
\frac{\partial \mathcal{L}}{\partial z} = p - y, \qquad \frac{\partial p}{\partial z} = \operatorname{diag}(p) - p\,p^{\top}, \qquad \frac{\partial^2 \mathcal{L}}{\partial z^2} = \operatorname{diag}(p) - p\,p^{\top}
$$
*(Eq. 2.16)* where diag(p) − ppᵀ is positive semidefinite (it is the covariance of a one-hot draw from p).

```figure
id: fig-2.19
kind: matrix
title: Softmax Jacobian diag(p) − ppᵀ for four logits
caption: >-
  Eq. 2.16 at z = (2.0, 1.0, 0.1, −1.0), where p = (0.638, 0.235, 0.095,
  0.032); shade is |entry| relative to the largest, 0.231. The diagonal
  p_v(1 − p_v) is positive, every off-diagonal −p_u·p_v negative, and every
  row sums to zero: adding one constant to all logits leaves p unchanged,
  which is exactly why the max shift m of Eq. 2.15 costs nothing in
  accuracy. The same matrix is the Hessian of the loss in z and the
  covariance of a one-hot draw from p.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.16"
alt: >-
  Four by four grid of diag(p) − ppᵀ for logits (2.0, 1.0, 0.1, −1.0), whose
  softmax is p = (0.638, 0.235, 0.095, 0.032). Diagonal entries are 0.231,
  0.180, 0.086 and 0.031. Off-diagonal entries, symmetric: (1,2) −0.150,
  (1,3) −0.061, (1,4) −0.020, (2,3) −0.022, (2,4) −0.007, (3,4) −0.003.
  Every row sums to zero. Shading is |entry|/0.231, and the diagonal is
  highlighted.
spec:
  rows: 4
  cols: 4
  pattern: explicit
  cells:
    - [1.00, 0.65, 0.26, 0.09]
    - [0.65, 0.78, 0.10, 0.03]
    - [0.26, 0.10, 0.37, 0.01]
    - [0.09, 0.03, 0.01, 0.13]
  rowLabel: "output p_u"
  colLabel: "input logit z_v"
  rowTicks: ["p1 = 0.638", "p2 = 0.235", "p3 = 0.095", "p4 = 0.032"]
  colTicks: ["z1 = 2.0", "z2 = 1.0", "z3 = 0.1", "z4 = −1.0"]
  highlight:
    - { row: 0, col: 0 }
    - { row: 1, col: 1 }
    - { row: 2, col: 2 }
    - { row: 3, col: 3 }
  legend: "|entry|/0.231; diagonal p_v(1 − p_v) > 0, off-diagonal −p_u·p_v < 0, each row sums to 0"
```

```figure
id: fig-2.20
kind: calculator
title: Softmax cross-entropy and its gradient in shifted LSE form
caption: >-
  Eq. 2.15 and Eq. 2.16 on four logits z = s·ζ, class 1 the target. The
  shift m = max z sits inside every exponential, so no term exceeds e⁰ at any
  scale; the last output is what the unshifted sum would have had to hold,
  10^(m/ln 10). The gradient is p − y: its target component is
  p₁ − 1 = e^(−L) − 1, and the components sum to zero. The s options are
  Experiment 2.1's logit scales.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.15", "DERIVED:eq-2.16"]
alt: >-
  Calculator for Eq. 2.15 and 2.16 with inputs logit scale s ∈ {1, 10, 100,
  1000} and base logits ζ₁ to ζ₄ (defaults 2.0, 1.0, 0.1, −1.0; class 1 is
  the target). At s = 1: shift m = 2, LSE = 2.449, loss L = 0.449 nats,
  ∂L/∂z₁ = −0.362, ∂L/∂z₂ = 0.235, and the unshifted largest term e^m is
  10^0.87. At s = 10: L = 4.5 × 10^−5 and ∂L/∂z₂ = 4.5 × 10^−5, a saturated
  softmax. At s = 1000: m = 2000, the shifted LSE is exactly 2000, L = 0 and
  the gradient is zero, while the unshifted sum would have had to hold
  10^868.6.
spec:
  tex: >-
    \mathcal{L}(z) = -z_1 + m + \log\sum_{v} e^{z_v - m},\quad m = \max_v z_v,\qquad \frac{\partial \mathcal{L}}{\partial z} = p - y
  inputs:
    - { symbol: s, label: "logit scale s", default: 1, min: 1, max: 1000, options: [1, 10, 100, 1000], format: integer }
    - { symbol: z1, label: "ζ₁, target class", default: 2, min: -5, max: 5, step: 0.1, format: fixed1 }
    - { symbol: z2, label: "ζ₂", default: 1, min: -5, max: 5, step: 0.1, format: fixed1 }
    - { symbol: z3, label: "ζ₃", default: 0.1, min: -5, max: 5, step: 0.1, format: fixed1 }
    - { symbol: z4, label: "ζ₄", default: -1, min: -5, max: 5, step: 0.1, format: fixed1 }
  outputs:
    - { symbol: m, label: "shift m = s·max ζ", formula: "s*max(z1, z2, z3, z4)", format: fixed2 }
    - { symbol: LSE, label: "LSE(z), shifted form", formula: "m + ln(exp(s*z1 - m) + exp(s*z2 - m) + exp(s*z3 - m) + exp(s*z4 - m))", format: fixed3 }
    - { symbol: L, label: "loss L = LSE − z₁, nats", formula: "LSE - s*z1", format: raw, emphasis: true }
    - { symbol: g1, label: "∂L/∂z₁ = p₁ − 1", formula: "exp(-L) - 1", format: raw }
    - { symbol: g2, label: "∂L/∂z₂ = p₂", formula: "exp(s*z2 - LSE)", format: raw }
    - { symbol: U, label: "log₁₀ of the unshifted term e^m", formula: "m/ln(10)", format: fixed1 }
  presets:
    - { label: "s = 10", values: { s: 10 } }
    - { label: "s = 1000", values: { s: 1000 } }
states:
  - { anchor: formulation, label: "s = 1", variables: { s: 1, z1: 2, z2: 1, z3: 0.1, z4: -1 }, highlight: [L, g1, g2], note: "L = 0.449 nats; the gradient (−0.362, 0.235, 0.095, 0.032) sums to zero, as p − y must." }
  - { anchor: mechanism, label: "s = 10, saturated", variables: { s: 10, z1: 2, z2: 1, z3: 0.1, z4: -1 }, highlight: [L, g1, g2], note: "Scale the logits by 10: p₁ = 0.99995, L = 4.5 × 10⁻⁵, and p − y almost vanishes. A saturated softmax passes back almost nothing." }
  - { anchor: failure-modes, label: "s = 1000", variables: { s: 1000, z1: 2, z2: 1, z3: 0.1, z4: -1 }, highlight: [m, LSE, U], note: "The unshifted sum would hold e²⁰⁰⁰ ≈ 10^869, the overflow Experiment 2.1 expects; the shifted form keeps every exponent ≤ 0 and returns L = 0." }
```

> **Definition — Hessian-vector product; Gauss–Newton matrix.** For L(θ) = ℓ(f(θ)), Hv is computed as the JVP of the gradient map (forward-over-reverse) or a VJP of it (reverse-over-reverse); the Gauss–Newton matrix is G = J_fᵀ (∂²ℓ/∂f²) J_f.

$$
H = J_f^{\top}\,\frac{\partial^2 \ell}{\partial f^2}\,J_f + \sum_i \frac{\partial \ell}{\partial f_i}\,\frac{\partial^2 f_i}{\partial \theta^2}, \qquad G = J_f^{\top}\,\frac{\partial^2 \ell}{\partial f^2}\,J_f
$$
*(Eq. 2.17)* where f = the network map from θ to logits, ℓ = the loss on logits; G drops the second term and is PSD whenever ∂²ℓ/∂f² is.

> **Definition — score-function estimator; reparameterisation estimator; straight-through estimator.** For J(θ) = E_{x∼p_θ}[f(x)]:

$$
\nabla_\theta J = \mathbb{E}_{x\sim p_\theta}\big[\big(f(x) - b\big)\,\nabla_\theta \log p_\theta(x)\big] \quad \text{(score function; any } b \text{ independent of } x\text{)}
$$
*(Eq. 2.18)* where b = a baseline; validity requires that the support of p_θ not depend on θ and that ∇ and ∫ commute.

$$
\nabla_\theta J = \mathbb{E}_{\varepsilon\sim p(\varepsilon)}\big[\nabla_\theta f\big(g(\theta,\varepsilon)\big)\big] \quad \text{(reparameterisation, } x = g(\theta,\varepsilon)\text{)}
$$
*(Eq. 2.19)* where g is differentiable in θ and f is differentiable in x; the straight-through estimator replaces J of a non-differentiable inner map by I and is biased.

> **Assumption.** Loss and network are almost-everywhere differentiable and the forward graph is static within one step · *sensitivity:* piecewise-linear activations make the Hessian zero almost everywhere in the second term of Eq. 2.17, which is one argument for G; data-dependent control flow changes the graph per step, which reverse-mode frameworks handle by re-recording.

## Mechanism

**Cost of a VJP.** Under the chain rule each primitive contributes its local VJP, and for the matrix products that dominate a Transformer the VJP of y = xW with respect to both x and W is two products of the same size as the forward one: ∂x = ∂y Wᵀ and ∂W = xᵀ∂y, each 2·T·d_in·d_out FLOPs. Hence backward ≈ 2× forward for matmul-dominated layers, and forward + backward ≈ 6 FLOPs per parameter per token — the accounting behind C ≈ 6ND in notation.md Eq. N.3 [MATHEMATICALLY-DERIVED · DERIVED:eq-2.14]. The JAX documentation states the general bound in the same terms: the cost of evaluating (f(x), vᵀ∂f(x)) "is only about three times the cost of evaluating f", and likewise for the JVP, while for reverse mode "memory scales with the depth of the computation" and for forward mode "the memory cost is independent of the depth" [OFFICIAL-DOCUMENTATION · R2.10]. The memory statement is the material one: reverse mode must retain, for every primitive on the path, whatever its local VJP needs (the inputs of a matmul, the mask of a ReLU, the probabilities of a softmax); PyTorch documents that "some operations need intermediary results to be saved during the forward pass in order to execute the backward pass" and exposes `save_for_backward` for that purpose [OFFICIAL-DOCUMENTATION · R2.11]. The bytes are Σ over layers of the saved activations at B·T resolution, the M_act term of Eq. N.5; activation checkpointing trades them for recomputation ([§30.2](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-2-memory-management.md)). The constant "about three" is documentation for JAX's transformation and is UNVERIFIED as a measured ratio for any specific PyTorch model.

```figure
id: fig-2.21
kind: stat-panel
title: Reverse-mode ledger for the output head
caption: >-
  This paragraph's costs evaluated on the output-head product z = x·W of the
  §5.6 reference configuration (B·T = 8192 tokens, D = 768, V = 32,000,
  BF16; illustrative, not a named model). The FLOP rows are the 2× rule: two
  backward GEMMs the size of the forward one, 6 FLOPs per parameter per
  token in all. The byte rows are what the tape keeps and what reverse mode
  creates; the last row is the Jacobian it never forms. Scroll to watch the
  binding constraint move from FLOPs to bytes.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.14", "DERIVED:eq-2.16", R2.9]
alt: >-
  Instrument panel for the output head z = x·W with Ntok = B·T = 8192
  tokens, D = 768, V = 32,000 and 2 bytes per value (illustrative). Forward
  2·Ntok·D·V = 402,653,184,000 FLOPs; ∂x = (p − y)·Wᵀ and ∂W = xᵀ·(p − y)
  cost the same each, so forward plus backward is 6 FLOPs per parameter per
  token. The saved input x [Ntok, D] is 12 MiB; the saved probabilities p
  [Ntok, V] are 500 MiB; the cotangent p − y [Ntok, V] is another 500 MiB;
  the Jacobian ∂z/∂x, if it were formed, would have (Ntok·V)·(Ntok·D), about
  1.65 × 10^15, entries. At Ntok = 65,536 each [Ntok, V] tensor is 3.9 GiB
  and the saved input 96 MiB. A block glyph compares 12 MiB with the two
  500 MiB tensors.
spec:
  header: "OUTPUT HEAD · z = x·W · BF16"
  variables: { Ntok: 8192, D: 768, V: 32000, b: 2 }
  rows:
    - { key: "forward, 2·Ntok·D·V", formula: "2*Ntok*D*V", format: flops }
    - { key: "∂x = (p − y)·Wᵀ", formula: "2*Ntok*D*V", format: flops }
    - { key: "∂W = xᵀ·(p − y)", formula: "2*Ntok*D*V", format: flops }
    - { key: "FLOPs per param per token", formula: "(3*2*Ntok*D*V)/(Ntok*D*V)", format: fixed1, note: "the 6 of C ≈ 6ND" }
    - { key: "saved x [Ntok, D]", formula: "Ntok*D*b", format: bytes, note: "read by ∂W" }
    - { key: "saved p [Ntok, V]", formula: "Ntok*V*b", format: bytes, note: "softmax probabilities, read by p − y" }
    - { key: "cotangent p − y [Ntok, V]", formula: "Ntok*V*b", format: bytes, note: "created in reverse, same size as z" }
    - { key: "∂z/∂x entries, if formed", formula: "(Ntok*V)*(Ntok*D)", format: si, note: "never formed" }
  glyph:
    type: blocks
    items:
      - { label: "saved x, 12 MiB", weight: 12 }
      - { label: "saved p, 500 MiB", weight: 500 }
      - { label: "p − y, 500 MiB", weight: 500, emphasis: true }
states:
  - { anchor: mechanism, label: "backward = 2 × forward", variables: { Ntok: 8192 }, highlight: ["forward, 2·Ntok·D·V", "∂x = (p − y)·Wᵀ", "∂W = xᵀ·(p − y)", "FLOPs per param per token"], note: "Each backward GEMM is the size of the forward one, 403 GFLOP apiece: 6 FLOPs per parameter per token in all." }
  - { anchor: algorithm, label: "tape at the start of reverse", variables: { Ntok: 8192 }, highlight: ["saved x [Ntok, D]", "saved p [Ntok, V]"], note: "Algorithm 2.4 peaks where reverse begins: the head's tape alone holds 12 MiB of x and 500 MiB of probabilities." }
  - { anchor: implementation, label: "fused, chunked over T", variables: { Ntok: 8192 }, highlight: ["saved p [Ntok, V]", "cotangent p − y [Ntok, V]"], note: "Fused linear cross-entropy forms the loss and p − y chunk by chunk, so the two 500 MiB rows are never resident whole (R2.9; chunking UNVERIFIED)." }
  - { anchor: failure-modes, label: "Ntok = 65,536", variables: { Ntok: 65536 }, highlight: ["saved p [Ntok, V]", "cotangent p − y [Ntok, V]"], note: "B = 8, T = 8192: each [Ntok, V] row is now 3.9 GiB. Out of memory at the first backward step, not in forward." }
```

<details><summary>Derivation of Eq. 2.16</summary>

log p_v = z_v − LSE(z), so L = −Σ_v y_v z_v + LSE(z) Σ_v y_v = −yᵀz + LSE(z). Then ∂LSE/∂z_u = e^{z_u}/Σ_v e^{z_v} = p_u, giving ∂L/∂z = −y + p. For the softmax Jacobian, ∂p_v/∂z_u = ∂/∂z_u [e^{z_v}/Σ e^{z_w}] = p_v δ_{vu} − p_v p_u, i.e. diag(p) − ppᵀ. Differentiating p − y once more gives the same matrix as the Hessian of L in z. The stable form: LSE(z) = m + log Σ e^{z_v − m} is exact for any m; choosing m = max z keeps every exponent ≤ 0 and the sum ≥ 1, so neither overflow nor log(0) can occur. Under sampling y ∼ p, E[(p − y)(p − y)ᵀ] = Cov(y) = diag(p) − ppᵀ, so the Fisher information in z equals the Hessian in z.

</details>

**Hessian approximations and their costs.** Forming H is impossible for N of interest (N² entries). Hv costs a bounded multiple of a gradient: forward-over-reverse computes the JVP of the gradient map, and the JAX documentation reports this composition as cheaper than reverse-over-reverse [OFFICIAL-DOCUMENTATION · R2.10]; the multiple in a specific framework is UNVERIFIED here. The Gauss–Newton matrix G (Eq. 2.17) is PSD for cross-entropy because ∂²ℓ/∂z² = diag(p) − ppᵀ, and by the last line of the derivation it coincides with the Fisher information matrix; Martens reports that "in many important cases, the Fisher information matrix is shown to be equivalent to the Generalized Gauss-Newton matrix" [PAPER-REPORTED · R2.12]. Gv costs one JVP, one V×V product per token, and one VJP [MATHEMATICALLY-DERIVED]. K-FAC approximates each layer's Fisher block as a Kronecker product: for a linear layer with input a and backpropagated gradient g at the pre-activation, the per-example weight gradient is g aᵀ, so the block is E[(aaᵀ) ⊗ (ggᵀ)], approximated by E[aaᵀ] ⊗ E[ggᵀ] = A ⊗ G_ℓ; Martens and Grosse describe K-FAC as "approximating various large blocks of the Fisher (corresponding to entire layers) as being the Kronecker product of two much smaller matrices" [PAPER-REPORTED · R2.5]. Cost: storing A (d_in²) and G_ℓ (d_out²) instead of (d_in d_out)², inverting each at O(d_in³ + d_out³) amortised over steps, and applying the preconditioner as G_ℓ⁻¹ ∇W A⁻¹, two products of the size of the weight gradient [MATHEMATICALLY-DERIVED · DERIVED:eq-2.17]. Diagonal approximations cost one vector of size N: the second-moment estimate of adaptive optimisers is an elementwise empirical-Fisher-like quantity ([§20.1](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-1-optimizer-mechanics.md)), and the identity E[v ⊙ Hv] = diag(H) for Rademacher v gives a stochastic diagonal at one HVP per sample [MATHEMATICALLY-DERIVED].

```figure
id: fig-2.22
kind: compare
title: Curvature objects by what they store and cost per application
caption: >-
  One linear layer with d_in = d_out = 4096 (an illustrative shape) makes the
  ordering concrete: the exact Fisher or Gauss–Newton block for it has
  2.8 × 10¹⁴ entries, K-FAC's two factors 3.4 × 10⁷, the diagonal
  1.7 × 10⁷, and an HVP keeps only gradient-sized vectors. Read left to
  right, the columns follow the section's inferred cost order in reverse:
  explicit G > K-FAC > HVP-based > diagonal (DERIVED; not a measured
  ranking of optimisers).
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.17", R2.5, R2.12, R2.10]
alt: >-
  Comparison of four curvature objects for one d_out × d_in layer. Hessian
  or explicit Gauss–Newton: H = JᵀH_out J plus the second-derivative term,
  G drops it; stores (d_in·d_out)² per layer block and N² for the model,
  281,474,976,710,656 entries at d_in = d_out = 4096; infeasible at N of
  interest; G is PSD for cross-entropy and equals the Fisher. K-FAC (R2.5):
  E[aaᵀ] ⊗ E[ggᵀ]; stores d_in² + d_out², 33,554,432 entries; inversion
  O(d_in³ + d_out³) amortised, applied as G_ℓ⁻¹ ∇W A⁻¹; drops the
  correlation between a and g; its factors are reduced across data-parallel
  ranks. HVP or Gv, matrix-free: Hv by forward-over-reverse, Gv by a JVP, the
  output curvature and a VJP; stores gradient-sized vectors, 16,777,216 per
  vector; costs a bounded multiple of a gradient whose constant is
  UNVERIFIED. Diagonal: one value per parameter, 16,777,216; an elementwise
  product, or one HVP per Hutchinson sample; drops all off-diagonal
  curvature.
spec:
  axis: >-
    Storage and per-application cost of a curvature approximation for one
    d_out × d_in linear layer in a model of N parameters; optimisation
    quality is not an axis
  columns:
    - { id: full, label: "Hessian H or explicit G" }
    - { id: kfac, label: "K-FAC, A ⊗ G_ℓ" }
    - { id: hvp, label: "HVP / Gv, matrix-free" }
    - { id: diag, label: "Diagonal (second moment, Hutchinson)" }
  rows:
    - { dimension: "object", values: { full: "H = JᵀH_out J + Σ_i ∂ℓ/∂f_i ∂²f_i/∂θ² (Eq. 2.17); G drops the second term", kfac: "E[aaᵀ] ⊗ E[ggᵀ] per layer (R2.5)", hvp: "Hv by forward-over-reverse; Gv by JVP, output curvature, VJP", diag: "one value per parameter" } }
    - { dimension: "stored for one layer", values: { full: "(d_in·d_out)² per block; N² for the model", kfac: "d_in² + d_out²", hvp: "gradient-sized vectors only", diag: "d_in·d_out" } }
    - { dimension: "at d_in = d_out = 4096", values: { full: "281,474,976,710,656 entries", kfac: "33,554,432 entries", hvp: "16,777,216 per vector", diag: "16,777,216 entries" } }
    - { dimension: "cost per application", values: { full: "infeasible at N of interest", kfac: "invert at O(d_in³ + d_out³), amortised; apply G_ℓ⁻¹ ∇W A⁻¹", hvp: "a bounded multiple of a gradient; the multiple is UNVERIFIED (R2.10)", diag: "one elementwise product; Hutchinson: one HVP per sample" } }
    - { dimension: "PSD", values: { full: "H: not in general; G: yes for cross-entropy", kfac: "yes: Kronecker product of PSD factors", hvp: "Gv: yes; Hv: no guarantee", diag: "second moment: yes" } }
    - { dimension: "what is dropped", values: { full: "nothing (H); the inner map's second derivative (G)", kfac: "the correlation between a and g", hvp: "nothing; only products are formed", diag: "all off-diagonal curvature" } }
    - { dimension: "communication", values: { full: "not applicable", kfac: "d_in × d_in and d_out × d_out factors reduced across data-parallel ranks (Chapter 29)", hvp: "not analysed here", diag: "not analysed here" } }
```

**Gradient estimators.** Eq. 2.18 follows from ∇∫p_θ f = ∫(∇p_θ) f = ∫p_θ (∇log p_θ) f, and the baseline term vanishes because E[∇log p_θ] = ∇∫p_θ = 0 [MATHEMATICALLY-DERIVED · DERIVED:eq-2.18]. Its variance scales with the magnitude of f − b and with the length of the sequence, since ∇log π_θ(y|x) = Σ_t ∇log π_θ(y_t|y_{<t},x) is a sum of T terms; this is the policy-gradient estimator of [§34.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-2-policy-gradients.md), where advantages are the baseline-subtracted f. Cost: one sample (a generation) and one backward pass through the log-probability, the same as a supervised step on that sequence. Eq. 2.19 moves the randomness outside the parameters; Kingma and Welling report that "a reparameterization of the variational lower bound yields a lower bound estimator that can be straightforwardly optimized using standard stochastic gradient methods" [PAPER-REPORTED · R2.4]. It requires continuous x and differentiable f, so it does not apply to token sampling; its variance is governed by ∇f rather than by f. The straight-through estimator, introduced by Bengio, Léonard and Courville as an approach that "heuristically copies the gradient with respect to the stochastic output directly as an estimator of the gradient with respect to the sigmoid argument" [PAPER-REPORTED · R2.13], is what quantisation-aware training uses through rounding ([§40.3](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-3-ptq-and-qat.md)); it is biased and its cost is one ordinary backward pass. Schulman et al. unify these under stochastic computation graphs [PAPER-REPORTED · R2.14]; Mohamed et al. survey the pathwise, score-function, and measure-valued families and their variance [PAPER-REPORTED · R2.15]. The word "reparameterisation" in DPO ([§33.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch33-direct-preference-optimization-and-related-objectives/33-1-dpo-derivation.md)) names a change of variables from reward to policy, not Eq. 2.19.

## Algorithm

```text
Algorithm 2.4 — Reverse-mode accumulation (VJP tape)
INPUT   forward program as ordered primitives k = 1..K with inputs I_k, output o_k; loss scalar L = o_K
OUTPUT  cotangents ō_j for every recorded value j, including parameters
STATE   tape of (primitive, saved values needed by its local VJP); cotangent table ō
INVARIANT after processing primitive k in reverse, ō_j is complete for every j produced after k
1  # forward
2  for k = 1..K:  o_k ← prim_k(I_k);  save on tape whatever VJP_k needs      # memory: Σ_k saved bytes
3  ō ← 0;  ō_K ← 1
4  # reverse
5  for k = K..1:
6      for each input j ∈ I_k:  ō_j += VJP_k(saved_k, ō_k)[j]              # accumulate, never overwrite
7      free saved_k                                                          # peak memory at start of reverse
8  return ō
```

Complexity: FLOPs ≈ forward + Σ_k cost(VJP_k) — about 3× forward in total for matmul-dominated graphs; peak memory = all saved values at line 3. Termination: K steps each way. Accumulation (line 6) is what makes shared parameters and residual branches correct; frameworks implement it as described in [§03.3](../ch03-numerical-computation-and-trustworthy-training/03-3-automatic-differentiation.md).

```figure
id: fig-2.23
kind: diagram
title: Reverse-mode tape for the softmax cross-entropy head
caption: >-
  Algorithm 2.4 drawn on the Implementation trace. The forward group writes
  the tape; the reverse group reads it and never overwrites a cotangent, only
  accumulates. Follow the emphasised path through p − y, the one [B, T, V]
  tensor reverse mode creates: it feeds both products of the last line of
  the trace, so it must stay resident until both finish. That is the tensor
  fused losses chunk over T.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:alg-2.4", "DERIVED:eq-2.16", R2.11]
alt: >-
  Diagram of Algorithm 2.4 for the output head. Forward group: hidden x
  [B, T, D] and the weight W [D, V] enter the matmul z = x·W (2·B·T·D·V
  FLOPs), giving logits z [B, T, V]; a max-shifted LSE over V gives [B, T];
  −z_y + LSE gives the per-token loss [B, T]; a masked mean gives the scalar
  L. The matmul saves x and the softmax saves p onto the tape, a memory node
  whose total is the sum of saved bytes, peaking at the start of reverse.
  Reverse group: the seed ō_K = 1 becomes m_t/Σm per token [B, T], then the
  cotangent p − y [B, T, V] on the emphasised path, which reads p from the
  tape; it feeds ∂x = (p − y)·Wᵀ [B, T, D], which continues into the layers
  below, and ∂W = xᵀ·(p − y) [D, V], which reads x from the tape and is
  accumulated.
spec:
  direction: LR
  nodes:
    - { id: x, kind: tensor, label: "hidden x", sub: "[B, T, D]", group: fwd }
    - { id: w, kind: model, label: "W_head", sub: "[D, V]" }
    - { id: mm, kind: process, label: "k = 1: z = x·W", sub: "2·B·T·D·V FLOPs", group: fwd }
    - { id: z, kind: tensor, label: "logits z", sub: "[B, T, V]", group: fwd }
    - { id: lse, kind: process, label: "k = 2: LSE over V, max-shifted", sub: "[B, T]", group: fwd }
    - { id: nll, kind: process, label: "k = 3: −z_y + LSE", sub: "[B, T] loss", group: fwd }
    - { id: mean, kind: objective, label: "k = 4: masked mean", sub: "scalar L", group: fwd }
    - { id: tape, kind: memory, label: "tape: saved x, p, mask", sub: "Σ_k saved bytes; peak at start of reverse" }
    - { id: seed, kind: state, label: "seed ō_K = 1", group: rev }
    - { id: gl, kind: tensor, label: "∂L/∂loss_t = m_t/Σm", sub: "[B, T]", group: rev }
    - { id: gz, kind: tensor, label: "cotangent p − y", sub: "[B, T, V], same size as z", group: rev, emphasis: true }
    - { id: gx, kind: tensor, label: "∂x = (p − y)·Wᵀ", sub: "[B, T, D] · 2·B·T·D·V FLOPs", group: rev }
    - { id: gw, kind: tensor, label: "∂W = xᵀ·(p − y), accumulated", sub: "[D, V] · 2·B·T·D·V FLOPs", group: rev }
    - { id: below, kind: node, label: "layers below", sub: "continue Algorithm 2.4" }
  edges:
    - { from: x, to: mm }
    - { from: w, to: mm, kind: dependency }
    - { from: mm, to: z }
    - { from: z, to: lse }
    - { from: lse, to: nll }
    - { from: z, to: nll, label: "gather z_y" }
    - { from: nll, to: mean }
    - { from: mm, to: tape, kind: dependency, label: "save x" }
    - { from: lse, to: tape, kind: dependency, label: "save p" }
    - { from: mean, to: seed, label: "reverse begins" }
    - { from: seed, to: gl }
    - { from: gl, to: gz, kind: emphasis, label: "VJP of −z_y + LSE" }
    - { from: tape, to: gz, kind: dependency, label: "read p" }
    - { from: gz, to: gx, kind: emphasis }
    - { from: gz, to: gw }
    - { from: tape, to: gw, kind: dependency, label: "read x" }
    - { from: w, to: gx, kind: dependency }
    - { from: gx, to: below }
  groups:
    - { id: fwd, label: "forward, lines 1–2: write the tape" }
    - { id: rev, label: "reverse, lines 3–7: read, accumulate, free" }
```

## Implementation

```text
Tensor trace (softmax cross-entropy, training)
[B, T, D] hidden → lm_head [D, V] → [B, T, V] z → LSE over V → [B, T] → −z_y + LSE → [B, T] loss → mask-mean → scalar
backward: scalar → [B, T] (m_t / Σm) → [B, T, V] (p − y) → lm_headᵀ → [B, T, D] ∂hidden ; [D, V] ∂W = hiddenᵀ (p − y)
```

The [B, T, V] cotangent p − y has the same size as the logits and is retained until the two products in the last line complete; fused implementations compute the loss and this cotangent chunk by chunk over T so that the full [B, T, V] tensor is never resident — Liger Kernel documents a fused linear cross-entropy loss with "chunk-by-chunk computation to reduce memory" [OFFICIAL-DOCUMENTATION · R2.9]; its exact chunking policy and the memory saved for a given shape are UNVERIFIED here. HVPs and K-FAC statistics are computed with the same primitives (JVP/VJP, batched outer products) in PyTorch or JAX; K-FAC additionally needs the d_in×d_in and d_out×d_out matrices reduced across data-parallel ranks, a communication cost owned by Chapter 29.

## Experimental design

Proposal: Experiment 2.1 in [verification.md](verification.md) checks Eq. 2.16 against FP64 central differences on ordinary and extreme logits. A second proposal compares the per-step wall time and peak memory of gradient, HVP (forward-over-reverse and reverse-over-reverse), and K-FAC statistics on one stated model, reporting each as a multiple of a forward pass with p50/p95 over repeated steps. Not run in this edition.

## Observations

**What the paper claims.** R2.5 reports that K-FAC's Kronecker-factored blocks make natural-gradient steps affordable; R2.12 reports the Fisher–Gauss–Newton equivalence; R2.4 and R2.13 report the reparameterisation and straight-through estimators; R2.10 documents the ≈3× VJP/JVP cost bound and the depth-scaling memory of reverse mode; R2.11 documents saved tensors [PAPER-REPORTED / OFFICIAL-DOCUMENTATION].

**What the evidence shows.** Eq. 2.14–2.19 and the Fisher = Hessian-in-logits identity are theorems. The reported advantages of K-FAC over adaptive diagonal methods at language-model scale have not been independently established in the sources inspected; the book takes no position [UNVERIFIED].

**What we infer.** The book infers (DERIVED) that the practical ordering of curvature methods by cost is diagonal < HVP-based < K-FAC < anything forming G explicitly, and (ASSUMED) that memory rather than FLOPs binds first for reverse mode at long T.

**What remains unknown.** The measured ratio backward/forward for a specific model, framework version, and kernel set is UNVERIFIED; the memory saved by a specific fused-loss release is UNVERIFIED.

## Failure modes

> **Failure mode — unstable softmax gradient.** *Symptom:* NaN loss on long sequences or large logits. *Cause:* LSE computed without the max shift, or p formed by exp then normalised in low precision. *Detection:* Experiment 2.1 on extreme inputs. *Mitigation:* Eq. 2.15's shifted form; cross-entropy from log-softmax, never from softmax then log ([§03.2](../ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md)).

> **Failure mode — score-function variance blow-up.** *Symptom:* policy updates dominated by a few long sequences. *Cause:* Σ_t over T terms with unnormalised f − b. *Detection:* per-sequence gradient-norm distribution. *Mitigation:* baselines, per-token advantages, length normalisation (§34.2, §35.2).

> **Failure mode — reparameterisation applied to a discrete variable.** *Symptom:* gradient is zero or undefined through a sampling op. *Cause:* Eq. 2.19 needs continuous x. *Detection:* the sampling op has no registered VJP. *Mitigation:* use Eq. 2.18, or a straight-through surrogate with its bias stated.

> **Failure mode — activation memory exhaustion.** *Symptom:* out-of-memory at the first backward step but not in forward. *Cause:* saved tensors of Algorithm 2.4 line 2. *Detection:* memory profiler at the forward/backward boundary. *Mitigation:* checkpointing, fused losses, shorter T (§30.2).

## Siblings

**Score-function estimator** — this file, Eq. 2.18; applied in [§34.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-2-policy-gradients.md). Why it exists: differentiate through sampling of discrete outputs. What assumption changed: none on f. What problem it solved: unbiased gradients of expected reward. New failure mode: variance ∝ |f − b| and T. Changed primitive: gradient of f → f times gradient of log-probability.

**Reparameterisation estimator** — this file, Eq. 2.19 [R2.4]. Why it exists: lower variance when x is continuous. What assumption changed: f differentiable, x = g(θ, ε). What problem it solved: variational objectives with continuous latents. New failure mode: inapplicable to tokens. Changed primitive: sample x → sample ε.

**Straight-through estimator** — this file [R2.13]; applied in [§40.3](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-3-ptq-and-qat.md). Why it exists: train through rounding or thresholding. What assumption changed: the Jacobian of the non-differentiable op is replaced by I. What problem it solved: quantisation-aware training. New failure mode: bias with no unbiasedness guarantee. Changed primitive: true local VJP → identity.

**Exact gradient (reverse mode)** — this file, Algorithm 2.4; owned mechanically by [§03.3](../ch03-numerical-computation-and-trustworthy-training/03-3-automatic-differentiation.md). Why it exists: deterministic objectives. New failure mode: saved-tensor memory.

```figure
id: fig-2.24
kind: compare
title: Gradient estimators for an expectation, and the exact gradient
caption: >-
  Read the "requires" and "applies to tokens" rows together: they, not
  variance, decide which estimator is available. Token sampling is discrete,
  so the reparameterised estimator is simply unavailable for language-model
  outputs; the score-function estimator is unbiased but its variance grows
  with |f − b| and with T; straight-through is cheap and biased. Every
  column's cost row is priced in forward and backward passes, the unit of
  the Mechanism.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.18", "DERIVED:eq-2.19", R2.4, R2.13, R2.14, R2.15]
alt: >-
  Comparison of four ways to obtain a gradient. Score function (Eq. 2.18,
  applied in §34.2): E[(f − b)∇log p_θ]; requires only that the support not
  depend on θ; unbiased for any baseline b independent of x; variance driven
  by |f − b| and the sequence length T; costs one generation and one backward
  pass through the log-probability; applies to tokens; fails by variance
  blow-up on long sequences. Reparameterisation (Eq. 2.19, R2.4): E_ε of the
  gradient of f(g(θ, ε)); requires continuous x and differentiable f;
  unbiased; variance driven by ∇f; one forward and one backward per sample;
  does not apply to tokens. Straight-through (R2.13): the local VJP of a
  non-differentiable op replaced by the identity; biased with no guarantee;
  one ordinary backward pass; used through rounding in quantisation-aware
  training. Exact reverse mode (Algorithm 2.4): deterministic objectives;
  about three times forward FLOPs; fails by saved-tensor memory.
spec:
  axis: >-
    What each way of obtaining a gradient requires of f and x, its bias,
    what drives its variance, and its price in passes per sample;
    applicability, not quality, is compared
  columns:
    - { id: sf, label: "Score function (Eq. 2.18)", node: ms.section.34.2 }
    - { id: rp, label: "Reparameterisation (Eq. 2.19)", node: ms.section.2.4 }
    - { id: st, label: "Straight-through", node: ms.section.40.3 }
    - { id: ex, label: "Exact reverse mode (Alg. 2.4)", node: ms.section.3.3 }
  rows:
    - { dimension: "estimator", values: { sf: "E[(f(x) − b)·∇_θ log p_θ(x)]", rp: "E_ε[∇_θ f(g(θ, ε))], x = g(θ, ε)", st: "local VJP of a non-differentiable op replaced by I", ex: "vᵀJ composed right to left, v = 1 for a scalar L" } }
    - { dimension: "requires", values: { sf: "support of p_θ independent of θ; nothing of f", rp: "continuous x; f differentiable in x", st: "an op to bypass: rounding, thresholding", ex: "a deterministic, a.e.-differentiable graph" } }
    - { dimension: "bias", values: { sf: "none, for any b independent of x", rp: "none", st: "biased, with no unbiasedness guarantee", ex: "none, up to rounding" } }
    - { dimension: "variance driven by", values: { sf: "|f − b| and T: ∇log π sums T per-token terms", rp: "∇f rather than f", st: "not applicable: a deterministic surrogate", ex: "not applicable" } }
    - { dimension: "cost per sample", values: { sf: "one generation + one backward through log p", rp: "one forward + one backward", st: "one ordinary backward pass", ex: "≈ 3 × forward FLOPs; saved-tensor memory" } }
    - { dimension: "applies to tokens", values: { sf: "yes", rp: "no: x must be continuous", st: "yes, with its bias stated", ex: "only for deterministic objectives" } }
    - { dimension: "new failure mode", values: { sf: "variance blow-up on long sequences", rp: "inapplicable to tokens", st: "bias with no guarantee", ex: "saved-tensor memory" } }
```

## Extensions

For long context the saved-tensor memory of Algorithm 2.4 grows linearly in T per layer and quadratically for materialised attention scores, which is the motivation for IO-aware attention recomputing scores in the backward pass ([§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md)). For agents, the sampled object in Eq. 2.18 is a multi-turn trajectory with environment tokens masked out of ∇log π ([§36.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-2-credit-assignment.md)). For continuous action policies (embodiment), Eq. 2.19 becomes applicable and is the estimator of choice ([Chapter 60](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch60-vision-language-action-policies-and-embodied-learning/README.md)). These are cross-references.

## Limitations

The ≈3× cost bound is a documented property of one framework's transformations and a derivation for matmul-dominated graphs; it does not hold for graphs dominated by memory-bound elementwise ops, where backward can be relatively cheaper or costlier. Gauss–Newton and K-FAC assumptions (dropped second term; independence of a and g) are not validated here. Falsification: a finite-difference check violating Eq. 2.16 beyond FP64 tolerance, or an HVP that disagrees with (∇L(θ + εv) − ∇L(θ − εv))/2ε, rejects the implementation, not the calculus.

## Reproducibility

Symbols: J, vᵀJ, Ju, H, G, A, G_ℓ, b, ε, g(θ, ε) (local); θ, π_θ, N, D, C, T from notation.md. Framework claims cite JAX documentation ("latest", accessed 2026-09-20) and PyTorch 2.14 documentation; measured ratios are not provided. Reference code for the gradient check is in [verification.md](verification.md), UNVERIFIED for version.

## References

R2.4, R2.5, R2.6, R2.9, R2.10, R2.11, R2.12, R2.13, R2.14, R2.15. See [references.md](references.md).
