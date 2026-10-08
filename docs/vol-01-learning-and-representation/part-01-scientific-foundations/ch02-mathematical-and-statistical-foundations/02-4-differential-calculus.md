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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 02.4 Differential calculus

## Scope

Jacobians act on tangent vectors through JVPs and on cotangent vectors through VJPs. Their composition gives first derivatives; Hessian and generalized Gauss–Newton products provide distinct second-order objects. Stochastic objectives additionally require an estimator such as a score-function or pathwise derivative, while straight-through differentiation supplies a generally biased surrogate. Graph construction and numerical differentiation are developed in [§03.3](../ch03-numerical-computation-and-trustworthy-training/03-3-automatic-differentiation.md), optimizer mechanics in [§20.1](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-1-optimizer-mechanics.md), and policy gradients in [§34.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-2-policy-gradients.md).

## Why this exists

A dense parameter Hessian stores N² entries, whereas an HVP applies that linear map without constructing it. Reverse differentiation retains or recomputes intermediates; structured curvature methods retain different factors and may require repeated model passes. These choices change arithmetic, state, communication, and approximation error. Neither an update-rule name nor a FLOP multiplier alone establishes a wall-time comparison [MATHEMATICALLY-DERIVED · DERIVED:eq-2.17; OFFICIAL-DOCUMENTATION · R2.10; R2.11].

## Intuition

Forward mode propagates a tangent through local derivatives. Reverse mode propagates a cotangent through their transposes and accumulates contributions wherever a value is reused. A scalar objective starts from one output cotangent and yields its full input gradient in one reverse traversal. Saved intermediates can instead be recomputed, trading state for work. Score-function and pathwise estimators apply different differentiation identities to an expectation; their regularity conditions and random integrands determine bias and variance [PAPER-REPORTED · R2.6, §3; R2.14, §2.1].

## Formulation

> **Definition — Jacobian, VJP, JVP.** For f: ℝⁿ → ℝᵐ, J_f(x) ∈ ℝ^{m×n} has entries ∂f_i/∂x_j. The vector–Jacobian product of cotangent v ∈ ℝᵐ is vᵀJ_f ∈ ℝⁿ; the Jacobian–vector product of tangent u ∈ ℝⁿ is J_f u ∈ ℝᵐ.

$$
J_{f\circ g}(x) = J_f\big(g(x)\big)\, J_g(x), \qquad v^{\top} J_{f\circ g} = \big(v^{\top} J_f\big) J_g, \qquad J_{f\circ g}\, u = J_f\big(J_g\, u\big)
$$
*(Eq. 2.14)* where g: ℝⁿ → ℝᵏ, f: ℝᵏ → ℝᵐ; the VJP first applies the outer pullback and then the inner pullback; the JVP first applies the inner tangent map and then the outer tangent map. Neither procedure materializes the full Jacobian.

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
\nabla_\theta J = \mathbb{E}_{x\sim p_\theta}\big[\big(f(x) - c_0\big)\,\nabla_\theta \log p_\theta(x)\big] \quad \text{(score function; any } c_0 \text{ independent of } x\text{)}
$$
*(Eq. 2.18)* where c_0 = a baseline; validity requires that the support of p_θ not depend on θ and that ∇ and ∫ commute.

$$
\nabla_\theta J = \mathbb{E}_{\varepsilon\sim p(\varepsilon)}\big[\nabla_\theta f\big(g(\theta,\varepsilon)\big)\big] \quad \text{(reparameterisation, } x = g(\theta,\varepsilon)\text{)}
$$
*(Eq. 2.19)* where g is differentiable in θ and f is differentiable in x; the straight-through estimator replaces J of a non-differentiable inner map by I and is biased.

> **Assumption.** Loss and network are almost-everywhere differentiable and the forward graph is static within one step · *sensitivity:* piecewise-linear activation branches do not make a multilayer network linear in all parameters jointly, so the parameter Hessian term need not vanish. Branch-boundary derivatives require operator conventions [MATHEMATICALLY-DERIVED · DERIVED:eq-2.17].

## Mechanism

### Methodology

**Cost of a VJP.** Under the chain rule each primitive contributes its local VJP, and for the matrix products that dominate a Transformer the VJP of y = xW with respect to both x and W is two products of the same size as the forward one: ∂x = ∂y Wᵀ and ∂W = xᵀ∂y, each 2·T·d_in·d_out FLOPs. Hence backward ≈ 2× forward for matmul-dominated layers, and forward + backward ≈ 6 FLOPs per parameter per token — the accounting behind C ≈ 6ND in notation.md Eq. N.3 [MATHEMATICALLY-DERIVED · DERIVED:eq-2.14]. For a general program, the cost is the sum of the executed local derivative primitives; no device-independent wall-time multiplier follows. JAX's cookbook discusses roughly constant-factor JVP/VJP arithmetic overhead and the saved-intermediate memory of reverse mode [OFFICIAL-DOCUMENTATION · R2.10, “Jacobian-vector products” and “Vector-Jacobian products”]. PyTorch documents backward graph construction and saved tensors [OFFICIAL-DOCUMENTATION · R2.11, “How autograd encodes the history”; “Saved tensors”]. Those documents do not establish a measured ratio for a named language model or hardware configuration. Activation checkpointing changes retained state and recomputation, as developed in [§30.2](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-2-memory-management.md).

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

log p_v = z_v − LSE(z), so L = −Σ_v y_v z_v + LSE(z) Σ_v y_v = −yᵀz + LSE(z). Then ∂LSE/∂z_u = e^{z_u}/Σ_v e^{z_v} = p_u, giving ∂L/∂z = −y + p. For the softmax Jacobian, ∂p_v/∂z_u = ∂/∂z_u [e^{z_v}/Σ e^{z_w}] = p_v δ_{vu} − p_v p_u, i.e. diag(p) − ppᵀ. Differentiating p − y once more gives the same matrix as the Hessian of L in z. The stable form: LSE(z) = m + log Σ e^{z_v − m} is exact for any m; choosing m = max z keeps every exponent ≤ 0 and the sum ≥ 1, so individual exponentials avoid positive-exponent overflow and their exact-real sum is nonzero. The reduction, final LSE, and loss still need representable arithmetic; the shift alone does not guarantee their floating-point range. Under sampling y ∼ p, E[(p − y)(p − y)ᵀ] = Cov(y) = diag(p) − ppᵀ, so the Fisher information in z equals the Hessian in z.

</details>

**Hessian approximations and their costs.** A dense parameter Hessian contains $N^2$ values. A Hessian-vector product evaluates $H v$ without materializing that object. JAX documents forward-over-reverse composition and compares it with reverse-over-reverse; the exact workload-dependent time ratio remains UNVERIFIED [OFFICIAL-DOCUMENTATION · R2.10, “Hessian-vector products using both forward- and reverse-mode”]. For categorical logits, the generalized Gauss–Newton inner matrix is $H_z=\operatorname{diag}(p)-pp^\top$. Its product with $u$ is $p\odot u-p(p^\top u)$, requiring $O(V)$ work and auxiliary state, rather than an explicit $V\times V$ multiplication. Then $Gv$ is one network JVP, this inner product, and one network VJP [MATHEMATICALLY-DERIVED · DERIVED:eq-2.17].

Martens distinguishes the Fisher, generalized Gauss–Newton, and empirical Fisher. Fisher–GGN equality holds when the output distribution and its natural parameterization make the output Fisher equal the loss Hessian; it is not a generic identity for any network output or loss [PAPER-REPORTED · R2.12, §§8–9, Eqs. (5)–(6)]. For a categorical softmax in logits, averaging model-sampled targets gives that equality. Replacing those targets with observed labels gives the empirical Fisher, which need not coincide [MATHEMATICALLY-DERIVED · DERIVED:eq-2.16].

For a linear layer $h=Wa$, a per-example gradient is $ga^\top$. For Fisher statistics, average over model-sampled targets conditional on the input. Vectorization then gives a Fisher block $\mathbb E[(aa^\top)\otimes(gg^\top)]$. Replacing this expectation of a product by $\mathbb E[aa^\top]\otimes\mathbb E[gg^\top]$ and neglecting chosen cross-layer interactions produces the simplified block-diagonal K-FAC representation [PAPER-REPORTED · R2.5, §§3–4]. Storing factors costs $O(d_{\rm in}^2+d_{\rm out}^2)$; constructing them over $n$ examples costs $O(n(d_{\rm in}^2+d_{\rm out}^2))$. Factor decompositions cost $O(d_{\rm in}^3+d_{\rm out}^3)$ per refresh. Applying the preconditioner costs $O(d_{\rm out}^2d_{\rm in}+d_{\rm out}d_{\rm in}^2)$, not elementwise weight-gradient cost. These are dense arithmetic counts for the stated simplified representation [MATHEMATICALLY-DERIVED · DERIVED:eq-2.17].

A diagonal curvature surrogate stores $O(N)$ values. The unbiased randomized identity $\mathbb E[v\odot Hv]=\operatorname{diag}(H)$ follows from independent Rademacher coordinates with $\mathbb E[v_iv_j]=\mathbf1[i=j]$, but its Monte Carlo variance and signed diagonal are distinct from adaptive-optimizer second moments. A second-moment accumulator is not automatically an unbiased Hessian or Fisher estimator [MATHEMATICALLY-DERIVED · DERIVED:eq-2.17].

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
    - { dimension: "cost per application", values: { full: "infeasible at N of interest", kfac: "invert at O(d_in³ + d_out³), amortised; apply at O(d_out²d_in + d_out d_in²)", hvp: "a bounded multiple of a gradient; the multiple is UNVERIFIED (R2.10)", diag: "one elementwise product; Hutchinson: one HVP per sample" } }
    - { dimension: "PSD", values: { full: "H: not in general; G: yes for cross-entropy", kfac: "yes: Kronecker product of PSD factors", hvp: "operator G: PSD; operator H: not generally PSD", diag: "second moment: yes" } }
    - { dimension: "what is dropped", values: { full: "nothing (H); the inner map's second derivative (G)", kfac: "dependence between aaᵀ and ggᵀ", hvp: "nothing; only products are formed", diag: "all off-diagonal curvature" } }
    - { dimension: "communication", values: { full: "not applicable", kfac: "d_in × d_in and d_out × d_out factors reduced across data-parallel ranks (Chapter 29)", hvp: "not analysed here", diag: "not analysed here" } }
```

**Gradient estimators.** Equation 2.18 is the fixed-integrand score-function identity: write $\nabla p_\theta=p_\theta\nabla\log p_\theta$ under a parameter-independent support and a justified derivative/integral interchange. The baseline vanishes because $\mathbb E[\nabla\log p_\theta]=\nabla\int p_\theta=0$. With an explicit parameter-dependent integrand $f_\theta$, retain the additional $\mathbb E[\nabla_\theta f_\theta]$ term. For conditional samples, a baseline can depend on the conditioning context but not on the sampled action conditional on that context [MATHEMATICALLY-DERIVED · DERIVED:eq-2.18].

For score vector $s=\nabla\log p_\theta$, minimizing the trace of $\mathrm{Cov}[(f-c_0)s]$ over a scalar constant $c_0$ differentiates $\mathbb E[(f-c_0)^2\|s\|^2]$. When $\mathbb E\|s\|^2>0$, the optimum is $c_0^*=\mathbb E[f\|s\|^2]/\mathbb E\|s\|^2$. Thus subtracting an unweighted mean reward is not generally the variance-optimal baseline. Reusing the same sample to fit and evaluate a baseline can also change unbiasedness unless its dependence is handled [MATHEMATICALLY-DERIVED · DERIVED:eq-2.18].

For a location-scale sample $X=\mu+s_0\varepsilon$, $\varepsilon\sim\mathcal N(0,1)$, Eq. 2.19 gives gradients $f'(X)$ and $f'(X)\varepsilon$ with respect to $\mu,s_0$. The score estimator instead uses $f(X)(X-\mu)/s_0^2$ and $f(X)((X-\mu)^2/s_0^3-1/s_0)$. Both have the same mean under their respective regularity conditions but different random integrands; neither family universally dominates variance. Reparameterization requires a differentiable sampling transformation and usable derivative of the integrand; a black-box discrete verifier can satisfy the score-function conditions without satisfying pathwise conditions [MATHEMATICALLY-DERIVED · DERIVED:eq-2.19].

Kingma and Welling's SGVB construction moves posterior noise into a parameter-independent auxiliary distribution and differentiates its transformed sample [PAPER-REPORTED · R2.4, §§2.3–2.4, Eqs. (4)–(7)]. Bengio, Léonard, and Courville's straight-through construction substitutes a surrogate backward derivative for a discrete forward node; its copied derivative is heuristic [PAPER-REPORTED · R2.13, §4]. Schulman et al. combine deterministic path derivatives and log-probability terms in a stochastic DAG, with downstream cost selection preventing unrelated costs from entering a stochastic node's score term [PAPER-REPORTED · R2.14, §3, Theorem 1]. These are distinct estimators rather than alternate names for automatic differentiation.

### Curvature validity and damping

The dropped term in Eq. 2.17 can remain nonzero with a fixed ReLU activation pattern. For $f(w_1,w_2)=w_2\operatorname{ReLU}(w_1x)$ on the branch $w_1x>0$, $f=w_1w_2x$ and $\partial^2f/\partial w_1\partial w_2=x$. The network is linear in each layer separately, but bilinear jointly. GGN drops this network-curvature term deliberately; it does not prove that the term is zero. For $u$, $u^\top Gu=(Ju)^\top H_z(Ju)\ge0$ when the output loss is convex. The exact Hessian can be indefinite because its second term has no such sign guarantee [MATHEMATICALLY-DERIVED · DERIVED:eq-2.17].

Solving $(G+\gamma\mathrm{Id})\Delta=-g$ with $\gamma>0$ controls singular directions and changes the step. K-FAC factor damping $(A+\gamma_A\mathrm{Id})\otimes(G_\ell+\gamma_G\mathrm{Id})$ expands into the undamped Kronecker product plus cross terms; it is not identical to adding one scalar identity to the full block. Refresh intervals, factor approximation, damping, and line-search or trust-region choices all belong to the algorithm specification. Matrix-free products avoid $N^2$ storage but require repeated model passes if used inside an iterative solver; a cost comparison must specify the number of such products [MATHEMATICALLY-DERIVED · DERIVED:eq-2.17].

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

### Reported experiments

R2.5 §13 compares K-FAC with Nesterov-style momentum SGD on deep autoencoders for MNIST, CURVES, and FACES. It uses squared-parameter regularization with coefficient $10^{-5}$, reports training reconstruction error versus iteration and time curves, and studies K-FAC approximations/efficiency choices. Diagonal adaptive methods are not included in that comparison. These experiments therefore cannot establish K-FAC superiority over modern adaptive optimizers in language-model training [PAPER-REPORTED · R2.5, §13 and experimental figures].

R2.4 §5 and Appendices C–E evaluate SGVB/AEVB on MNIST and Frey Face, reporting variational bounds and comparisons with wake-sleep and Monte Carlo EM. The latent-variable construction, objective, and estimator change together; the experiment does not give a universal pathwise-versus-score variance ratio [PAPER-REPORTED · R2.4, §5; Appendices C–E]. Hardware-normalized modern language-model throughput and the release-specific fused-loss memory gain are NOT-DISCLOSED for these protocols. The chapter's FP64 derivative checks remain unexecuted proposals in [verification.md](verification.md).

## Observations

For finite logits and a fixed normalized target, the softmax-cross-entropy gradient is p−y and its logit Hessian is diag(p)−ppᵀ. The latter is a covariance matrix, so it is positive semidefinite with a constant-shift null direction. The parameter Hessian includes an additional network-curvature term and need not inherit that sign [MATHEMATICALLY-DERIVED · DERIVED:eq-2.16; DERIVED:eq-2.17].

Model-target Fisher and GGN coincide only under the specified output-family/parameterization conditions. An empirical Fisher formed from observed-label gradients is a different expectation. K-FAC further approximates the relevant blocks and changes their inversion and damping; the reported autoencoder experiments do not rank all such choices on modern language models [PAPER-REPORTED · R2.12, §§8–11; R2.5, §13].

Matrix-free derivatives avoid a dense N² object but may require multiple model passes inside a solver. Factor refresh, damping, solver iterations, layout, and retained state enter the execution cost. No release-specific fused-loss allocation or language-model backward/forward latency ratio is measured here [OFFICIAL-DOCUMENTATION · R2.10; R2.11].

## Failure modes

> **Failure mode — unstable softmax gradient.** *Symptom:* NaN loss on long sequences or large logits. *Cause:* LSE computed without the max shift, or p formed by exp then normalised in low precision. *Detection:* Experiment 2.1 on extreme inputs. *Mitigation:* Eq. 2.15's shifted form; cross-entropy from log-softmax, never from softmax then log ([§03.2](../ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md)).

> **Failure mode — score-function variance blow-up.** *Symptom:* policy updates dominated by a few long sequences. *Cause:* Σ_t over T terms with unnormalised f − c₀. *Detection:* per-sequence gradient-norm distribution. *Mitigation:* baselines, per-token advantages, length normalisation (§34.2, §35.2).

> **Failure mode — reparameterisation applied to a discrete variable.** *Symptom:* gradient is zero or undefined through a sampling op. *Cause:* Eq. 2.19 needs continuous x. *Detection:* the sampling op has no registered VJP. *Mitigation:* use Eq. 2.18, or a straight-through surrogate with its bias stated.

> **Failure mode — activation memory exhaustion.** *Symptom:* out-of-memory at the first backward step but not in forward. *Cause:* saved tensors of Algorithm 2.4 line 2. *Detection:* memory profiler at the forward/backward boundary. *Mitigation:* checkpointing, fused losses, shorter T (§30.2).

## Siblings

Score-function differentiation requires no pathwise derivative through the sampled action, but it needs the support, integrability, and interchange conditions of Eq. 2.18. A conditional baseline must be independent of the sampled action given its context, or its dependence must be accounted for. Pathwise differentiation instead uses a differentiable noise transformation; an exact categorical draw ordinarily lacks the required derivative. Neither estimator family universally dominates variance [PAPER-REPORTED · R2.14, §2.1; MATHEMATICALLY-DERIVED · DERIVED:eq-2.18; DERIVED:eq-2.19].

Straight-through differentiation substitutes a backward rule for a discrete forward node. The identity rule is one example, rather than the only surrogate; it generally does not equal the derivative of the forward expectation. Exact reverse-mode differentiation applies the registered local derivatives of a deterministic computation and accumulates every reuse. These procedures can share an autodiff engine while targeting different derivatives or surrogates [PAPER-REPORTED · R2.13, §4; R2.6, §3].

```figure
id: fig-2.24
kind: compare
title: Gradient estimators for an expectation, and the exact gradient
caption: >-
  Read the "requires" and "applies to tokens" rows together: they, not
  variance, decide which estimator is available. Token sampling is discrete,
  so an ordinary differentiable pathwise transformation is unavailable for
  exact categorical samples. Score-function unbiasedness requires the
  stated regularity conditions; trajectory covariance determines its
  variance. Straight-through uses a generally biased surrogate. Every
  column's cost row is priced in forward and backward passes, the unit of
  the Mechanism.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.18", "DERIVED:eq-2.19", R2.4, R2.13, R2.14, R2.15]
alt: >-
  Comparison of four ways to obtain a gradient. Score function (Eq. 2.18,
  applied in §34.2): E[(f − c₀)∇log p_θ]; requires parameter-independent support, finite moments,
  and valid gradient–expectation interchange; unbiased for a sample-independent
  baseline. Variance depends
  on residual rewards and covariance among trajectory score terms; costs one generation and one backward
  pass through the log-probability; applies to tokens; fails by variance
  blow-up on long sequences. Reparameterisation (Eq. 2.19, R2.4): E_ε of the
  gradient of f(g(θ, ε)); requires continuous x and differentiable f;
  unbiased; variance driven by ∇f; one forward and one backward per sample;
  does not apply to tokens. Straight-through (R2.13): the local VJP of a
  non-differentiable op replaced by the identity; biased with no guarantee;
  one ordinary backward pass; used through rounding in quantisation-aware
  training. Exact reverse mode (Algorithm 2.4): deterministic objectives;
  about three times forward arithmetic for the stated matmul-dominated graph; saved-tensor memory is an additional constraint.
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
    - { dimension: "requires", values: { sf: "fixed support; finite moments; derivative–expectation interchange", rp: "continuous x; f differentiable in x", st: "an op to bypass: rounding, thresholding", ex: "a deterministic, a.e.-differentiable graph" } }
    - { dimension: "bias", values: { sf: "none, for any c₀ independent of x", rp: "none", st: "biased, with no unbiasedness guarantee", ex: "none, up to rounding" } }
    - { dimension: "variance driven by", values: { sf: "E[(f−c₀)² ssᵀ] and score-term covariance", rp: "∇f rather than f", st: "not applicable: a deterministic surrogate", ex: "not applicable" } }
    - { dimension: "cost per sample", values: { sf: "one generation + one backward through log p", rp: "one forward + one backward", st: "one ordinary backward pass", ex: "matmul-dominated graph: ≈ 3 × forward FLOPs; saved state" } }
    - { dimension: "applies to tokens", values: { sf: "yes", rp: "no: x must be continuous", st: "yes, with its bias stated", ex: "only for deterministic objectives" } }
    - { dimension: "new failure mode", values: { sf: "variance blow-up on long sequences", rp: "inapplicable to tokens", st: "bias with no guarantee", ex: "saved-tensor memory" } }
```

## Extensions

### Improvements

The documented SGVB change replaces a high-variance score-based posterior-gradient construction with a differentiable noise transformation in its latent-variable setting. K-FAC replaces a dense Fisher representation with structured factors and separately controls damping and approximation. Their experiments support those source-specific procedures; neither isolates a universally optimal estimator or optimizer. Straight-through derivatives trade exact differentiation of the forward map for a surrogate, so their usefulness cannot be described as an unbiasedness improvement [PAPER-REPORTED · R2.4, §§2.3,5; R2.5, §§3–8,13; R2.13, §4].

For long context the saved-tensor memory of Algorithm 2.4 grows linearly in T per layer and quadratically for materialised attention scores, which is the motivation for IO-aware attention recomputing scores in the backward pass ([§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md)). For agents, the sampled object in Eq. 2.18 is a multi-turn trajectory with environment tokens masked out of ∇log π ([§36.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/36-2-credit-assignment.md)). For continuous action policies (embodiment), Eq. 2.19 can become applicable under its differentiability conditions ([Chapter 60](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch60-vision-language-action-policies-and-embodied-learning/README.md)). These are cross-references.

## Limitations

The ≈3× cost bound is a documented property of one framework's transformations and a derivation for matmul-dominated graphs; it does not hold for graphs dominated by memory-bound elementwise ops, where backward can be relatively cheaper or costlier. Gauss–Newton and K-FAC assumptions (dropped second term; independence of a and g) are not validated here. Falsification: a finite-difference check violating Eq. 2.16 beyond FP64 tolerance, or an HVP that disagrees with (∇L(θ + εv) − ∇L(θ − εv))/2ε, rejects the implementation, not the calculus.

## Reproducibility

Symbols: J, vᵀJ, Ju, H, G, A, G_ℓ, c₀, ε, g(θ, ε) (local); θ, π_θ, N, D, C, T from notation.md. Framework claims cite JAX documentation ("latest", accessed 2026-10-07) and PyTorch 2.14 documentation; measured ratios are not provided. Reference code for the gradient check is in [verification.md](verification.md), UNVERIFIED for version.

## References

R2.4, R2.5, R2.6, R2.9, R2.10, R2.11, R2.12, R2.13, R2.14, R2.15. See [references.md](references.md).
