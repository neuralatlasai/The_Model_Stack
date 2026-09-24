---
id: ms.section.3.3
entity_type: section
title: Automatic differentiation
short_title: Autodiff in practice
volume: 1
part: 1
chapter: 3
section: 3.3
slug: 03-3-automatic-differentiation
parent: ms.chapter.3
prev_sibling: ms.section.3.2
next_sibling: ms.section.3.4
children: []
prerequisites: [ms.section.2.4, ms.section.3.1, ms.section.3.2]
downstream: [ms.section.3.5, ms.section.5.5, ms.section.19.2, ms.section.19.3, ms.section.28.1, ms.section.30.2]
related: [ms.section.20.5]
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.jax}
  - {type: supported_by, target: paper.P13}
axes: {lifecycle: [pretraining, adaptation], mechanism: [automatic_differentiation, memory_accounting], feedback_setting: [], modality: [text]}
papers: [P13]
implementations: [impl.pytorch, impl.jax]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1100
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 3.3 Automatic differentiation

## Scope

Objective: turn the reverse-mode calculus of [§2.4](../ch02-mathematical-and-statistical-foundations/02-4-differential-calculus.md) into the four contracts a training program must honor — what the forward pass saves and how much memory that costs, what happens when a saved tensor is mutated, how gradients are accumulated and clipped across micro-batches, and how the analytic gradient is checked against FP64 finite differences. Baseline: an untested backward pass. Success criterion: the skeleton's gradient passes the FP64 check under the tolerance derived in Eq. 3.14 on ordinary and extreme inputs. Boundaries: the mathematics of VJPs and the chain rule are owned by §2.4; graph capture and compilation by [§28.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch28-frameworks-graph-compilers-and-runtime-integration/28-1-framework-semantics.md); activation checkpointing as a memory-management policy at scale by [§30.2](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-2-memory-management.md).

## Why this exists

What failed: hand-written backward passes were wrong in ways that only appeared as slower convergence; the first defense, comparing to finite differences, was itself done in FP32 where the difference quotient has at best five correct digits [MATHEMATICALLY-DERIVED — Eq. 3.14]. Bottleneck: for a Transformer the forward pass's saved intermediates, not the parameters, dominate device memory at long sequence length, because every attention and MLP block retains tensors proportional to B·T·d_model and, unfused, to B·H·T² [DERIVED — activation accounting in [§5.6](../ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md)]. Dominant constraint: memory forces micro-batching, and micro-batching forces a gradient-accumulation contract whose normalization must match the loss definition of Eq. N.2. What changed: the framework makes the tape, the saved tensors, and the mutation check explicit objects, so each contract can be tested.

## Intuition

Physically, reverse mode is a second traversal of the same computation in the opposite direction; every node that needs its input to compute its local VJP pins that input in memory until the traversal reaches it. Memory is therefore proportional to the *depth* of the live path, and recomputation trades FLOPs for that memory. Accumulation is an ordinary sum and inherits the summation error of Eq. 3.9. Clipping is a projection onto a ball in gradient space; it changes the direction only when the ball is exceeded, never otherwise.

## Formulation

For a loss ℒ(θ) computed through intermediates y_k = f_k(y_{k−1}), reverse mode propagates cotangents

$$
\bar{y}_{k-1} = J_{f_k}(y_{k-1})^{\top}\, \bar{y}_k, \qquad \bar{\theta} = \sum_k \Big(\tfrac{\partial f_k}{\partial \theta}\Big)^{\top} \bar{y}_k
$$
*(Eq. 3.11)* where J is the Jacobian, ȳ_k = ∂ℒ/∂y_k, and each factor is a VJP that needs some subset of (y_{k−1}, y_k, θ) — the *saved tensors*.

Gradient accumulation over K micro-batches with valid-token counts n_1..n_K for the token-mean loss of Eq. N.2:

$$
\nabla_\theta \mathcal{L} = \frac{\sum_{k=1}^{K} n_k \nabla_\theta \bar{\ell}_k}{\sum_{k=1}^{K} n_k}, \qquad \bar{\ell}_k = \frac{1}{n_k}\sum_{t \in k} m_t\, \ell_t
$$
*(Eq. 3.12)* where ℓ̄_k is the per-micro-batch token mean; summing K equal-weighted micro-batch means is correct only if all n_k are equal, a point developed in [§19.2](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics.md).

```figure
id: fig-3.13
kind: calculator
title: Token-weighted against equal-weighted micro-batch accumulation
caption: >-
  Eq. 3.12 with two micro-batches and one scalar gradient component. With
  1000 and 250 valid tokens, averaging the two micro-batch means gives the
  short micro-batch's tokens 2.5 times their share. The accumulated gradient
  is off by 0.3 on a correct value of 1.2. Nothing diverges, which is why the
  failure mode shows up only as a mis-scaled learning rate. Set n₂ = n₁ and the
  two agree. Illustrative values, not a named model.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-3.12"
alt: >-
  Calculator for Eq. 3.12 with two micro-batches. With valid-token counts
  n₁ = 1000 and n₂ = 250 and per-token-mean gradients 1.0 and 2.0, the
  correct token-weighted gradient is (1000·1 + 250·2)/1250 = 1.200. The
  equal-weight mean of means is 1.500, the error is 0.300, and micro-batch 2
  is over-weighted 2.5 times. Preset with equal counts gives zero error.
  Preset with a nearly empty second micro-batch (n₂ = 10) gives a correct
  gradient of 1.010 against 1.500, an over-weighting of 50.5 times.
spec:
  tex: >-
    \nabla_\theta\mathcal{L}=\frac{\sum_{k} n_k\,\nabla_\theta\bar\ell_k}{\sum_k n_k}\quad\text{vs}\quad\frac{1}{K}\sum_k\nabla_\theta\bar\ell_k
  equation: "3.12"
  inputs:
    - { symbol: n1, label: "valid tokens, micro-batch 1", default: 1000, min: 1, max: 4096, step: 1, format: integer }
    - { symbol: n2, label: "valid tokens, micro-batch 2", default: 250, min: 1, max: 4096, step: 1, format: integer }
    - { symbol: g1, label: "per-token-mean gradient, micro-batch 1", default: 1, min: -4, max: 4, step: 0.01, format: fixed2 }
    - { symbol: g2, label: "per-token-mean gradient, micro-batch 2", default: 2, min: -4, max: 4, step: 0.01, format: fixed2 }
  outputs:
    - { symbol: gc, label: "correct, Σ n_k·ḡ_k / Σ n_k", formula: "(n1*g1 + n2*g2)/(n1 + n2)", format: fixed3, emphasis: true }
    - { symbol: ge, label: "equal-weight mean of means", formula: "(g1 + g2)/2", format: fixed3 }
    - { symbol: err, label: "error of equal weighting", formula: "ge - gc", format: fixed3 }
    - { symbol: w2, label: "over-weighting of micro-batch 2", formula: "(n1 + n2)/(2*n2)", format: ratio }
  presets:
    - { label: "equal counts, n₂ = n₁", values: { n2: 1000 } }
    - { label: "nearly empty micro-batch, n₂ = 10", values: { n2: 10 } }
```

Global-norm clipping with threshold c:

$$
g \leftarrow g \cdot \min\Big(1, \frac{c}{\|g\|_2 + \eta}\Big), \qquad \|g\|_2 = \Big(\sum_{p} \|g_p\|_2^2\Big)^{1/2}
$$
*(Eq. 3.13)* where the norm is over all parameter gradients concatenated and η is a small constant against division by zero.

Central finite difference in FP64 with step h for a scalar function f and unit direction v:

$$
\hat{d} = \frac{f(\theta + h v) - f(\theta - h v)}{2h}, \qquad |\hat{d} - \nabla f \cdot v| \le \frac{h^2}{6}\|f'''\| + \frac{u_{64}\,|f|}{h}
$$
*(Eq. 3.14)* where the first term is truncation and the second is rounding; the bound is minimized at h ≈ (3 u_64 |f| / ‖f'''‖)^{1/3}, which for O(1) quantities is ≈ 10^−5 and gives an error ≈ 10^−10 [MATHEMATICALLY-DERIVED].

```figure
id: fig-3.14
kind: calculator
title: Finite-difference error budget, FP64 against FP32
caption: >-
  Eq. 3.14, live. Truncation h²‖f‴‖/6 falls with h while rounding u·|f|/h
  rises, so each format has an optimal step h*. With O(1) quantities FP64
  balances near h ≈ 10⁻⁵ at about 10^−10.6. Keep h = 10⁻⁵ and switch to FP32
  and the rounding term alone is ≈ 6e−3. At FP32's own optimum h* ≈ 5.6e−3
  the bound is still ≈ 1.6e−5, about six decades worse than FP64. Outputs are
  log₁₀ because the FP64 terms are below the display's resolution.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-3.14"
alt: >-
  Calculator for Eq. 3.14 with step h, stored mantissa bits p (52 for FP64,
  23 for FP32), ‖f‴‖ and |f|. At h = 1e−5 in FP64 with both norms 1: log₁₀
  of truncation is −10.78, log₁₀ of rounding −10.95, and log₁₀ of the bound
  −10.56. The optimal step h* is 6.9e−6 with a bound of 10^−10.62 there. In
  FP32 at h = 1e−5 the rounding term is 10^−2.22 (≈ 6e−3) and dominates. The
  FP32 optimum is h* ≈ 5.6e−3 with a bound of 10^−4.80 (≈ 1.6e−5).
spec:
  tex: >-
    |\hat d-\nabla f\cdot v|\;\le\;\frac{h^{2}}{6}\|f'''\|+\frac{u\,|f|}{h},\qquad h^{*}=\Big(\frac{3u|f|}{\|f'''\|}\Big)^{1/3}
  equation: "3.14"
  inputs:
    - { symbol: h, label: "step h", default: 0.00001, min: 0.0000000001, max: 0.1, scale: log10, format: raw }
    - { symbol: p, label: "stored mantissa bits (52 FP64, 23 FP32)", default: 52, min: 23, max: 52, options: [23, 52], format: integer }
    - { symbol: f3, label: "‖f‴‖", default: 1, min: 0.01, max: 1000, scale: log10, format: raw }
    - { symbol: F, label: "|f|", default: 1, min: 0.01, max: 100, scale: log10, format: raw }
  outputs:
    - { symbol: Lt, label: "log₁₀ truncation, h²‖f‴‖/6", formula: "log10(h^2*f3/6)", format: fixed2 }
    - { symbol: Lr, label: "log₁₀ rounding, u·|f|/h", formula: "log10(2^-(p+1)*F/h)", format: fixed2 }
    - { symbol: Lb, label: "log₁₀ bound, Eq. 3.14", formula: "log10(h^2*f3/6 + 2^-(p+1)*F/h)", format: fixed2, emphasis: true }
    - { symbol: hs, label: "optimal step h*", formula: "(3*2^-(p+1)*F/f3)^(1/3)", format: raw }
    - { symbol: Ls, label: "log₁₀ bound at h*", formula: "log10(hs^2*f3/6 + 2^-(p+1)*F/hs)", format: fixed2 }
states:
  - { anchor: formulation, label: "FP64 · h = 10⁻⁵", variables: { p: 52, h: 0.00001 }, highlight: [Lt, Lr, Lb], note: "FP64 at h = 1e−5: truncation ≈ 1.7e−11 and rounding ≈ 1.1e−11 balance. The bound is 10^−10.6 and h* ≈ 6.9e−6." }
  - { anchor: experimental-design, label: "FP32 ablation · h = 10⁻⁵", variables: { p: 23, h: 0.00001 }, highlight: [Lr, Lb], note: "Experiment 3.3's ablation. At the same h in FP32 the rounding term u₃₂/h ≈ 6e−3 swamps everything, so the check stops being informative." }
  - { anchor: observations, label: "FP32 at its own h*", variables: { p: 23, h: 0.0056 }, highlight: [hs, Ls], note: "Even at FP32's optimum h* ≈ 5.6e−3 the bound is ≈ 1.6e−5, about five digits and six decades worse than FP64. At h = 1e−5, the ≈ 1e−3 of the text, a 0.1 % defect is invisible." }
  - { anchor: failure-modes, label: "FP64 against a 0.1 % defect", variables: { p: 52, h: 0.00001 }, highlight: [Lb], note: "A 0.1 % normalization error (10⁻³ relative) sits about 7.5 decades above the FP64 bound. Algorithm 3.7 on an unequal-n_k fixture sees it." }
```

> **Definition — Saved tensor.** An intermediate value retained by the forward pass because a VJP in Eq. 3.11 requires it; the set of saved tensors is the activation memory of the backward pass.

> **Definition — Version counter.** A per-tensor integer incremented on every in-place modification; autograd records it when a tensor is saved and compares it when the tensor is read in backward.

> **Definition — Gradient accumulation (micro-batch).** Summing gradients of K micro-batch losses, weighted as in Eq. 3.12, before a single optimizer step.

> **Definition — Global-norm gradient clipping.** The rescaling of Eq. 3.13 applied with one factor to all gradients.

> **Definition — Finite-difference gradient check.** Comparison of the analytic gradient with the FP64 estimate of Eq. 3.14 under the tolerance derived from its error bound.

## Mechanism

Graph construction and saved tensors. PyTorch records the graph dynamically: each tensor produced by a differentiable operation holds a `grad_fn` node that is "an entry point into this graph"; for built-in operations "tensors are automatically saved as needed", and custom functions save with `save_for_backward()` and read with `saved_tensors` [OFFICIAL-DOCUMENTATION — PyTorch 2.14 *Autograd mechanics*, R3.11, accessed 2026-09-20]. Which tensors are saved is operator-specific: a matmul y = xW saves x and W; an elementwise GELU saves its input; softmax saves its output. Activation memory is therefore the sum over live nodes of the saved-tensor bytes, and it is why the MLP intermediate [B, T, d_ff] and, when unfused, the [B, H, T, T] probabilities dominate.

In-place operations and version counters. "Every tensor keeps a version counter, that is incremented every time it is marked dirty in any operation. When a Function saves any tensors for backward, a version counter of their containing Tensor is saved as well"; on access in backward "it is checked, and if it is greater than the saved value an error is raised" [OFFICIAL-DOCUMENTATION — same page]. The consequence for the skeleton is a rule: an in-place update (`add_`, `mul_`, masked fills) is legal only on tensors no VJP needs, and the check makes violations loud rather than silent.

```figure
id: fig-3.15
kind: diagram
title: Tape for p = softmax(GELU(x·W)) with saved tensors and version checks
caption: >-
  The forward row records a grad_fn node per operation and pins what each
  VJP will need. The matmul pins x and W, GELU its input u, softmax its
  output p. The emphasised backward path consumes them in reverse. Each read
  first compares the tensor's version counter with the one recorded at save
  time. So p.add_() after the forward raises an error instead of producing a
  silently wrong ā. Leaf gradients accumulate across backward() calls, which
  is the hook Eq. 3.12 uses.
placement: inline
evidence: OFFICIAL-DOCUMENTATION
source: [R3.11, "DERIVED:eq-3.11"]
alt: >-
  Diagram in two groups. Forward, which records the grad_fn tape: input x
  [B, T, d_in] and leaf weight W (requires_grad) enter the matmul u = x·W,
  which saves x and W. GELU gives a and saves u, softmax gives p and saves its
  output p, and the loss ℒ is the token mean of Eq. N.2. The saved tensors
  x, W, u and p are pinned in memory until read. Backward, in reverse order
  (Algorithm 3.5), is the emphasised path: ℒ seeds ȳ = 1 into the softmax VJP
  (reads p), then the GELU VJP (reads u), then the matmul VJP (ū·Wᵀ and
  xᵀ·ū), which accumulates ∂ℒ/∂W into W.grad across backward() calls. Version
  counters are recorded at save and asserted at read. An in-place p.add_()
  after the save bumps the counter, and the softmax VJP raises a RuntimeError.
spec:
  direction: LR
  nodes:
    - { id: x, kind: tensor, label: "input x", sub: "[B, T, d_in]", group: fwd }
    - { id: W, kind: tensor, label: "weight W, leaf", sub: "requires_grad=True", group: fwd }
    - { id: mm, kind: process, label: "u = x·W", sub: "saves x and W", group: fwd }
    - { id: ge, kind: process, label: "a = GELU(u)", sub: "saves its input u", group: fwd }
    - { id: sm, kind: process, label: "p = softmax(a)", sub: "saves its output p", group: fwd }
    - { id: L, kind: objective, label: "loss ℒ", sub: "token mean, Eq. N.2" }
    - { id: sv, kind: memory, label: "saved tensors", sub: "x, W, u, p pinned until read" }
    - { id: vc, kind: state, label: "version counters", sub: "recorded at save, asserted at read" }
    - { id: ip, kind: branch, label: "p.add_() after the save", sub: "counter bumped → RuntimeError" }
    - { id: vs, kind: process, label: "VJP of softmax", sub: "reads p", group: bwd }
    - { id: vg, kind: process, label: "VJP of GELU", sub: "reads u", group: bwd }
    - { id: vm, kind: process, label: "VJP of matmul", sub: "ū·Wᵀ and xᵀ·ū", group: bwd }
    - { id: gW, kind: memory, label: "W.grad", sub: "accumulates across backward() calls" }
  edges:
    - { from: x, to: mm }
    - { from: W, to: mm }
    - { from: mm, to: ge }
    - { from: ge, to: sm }
    - { from: sm, to: L }
    - { from: mm, to: sv, kind: dependency, label: "x, W" }
    - { from: ge, to: sv, kind: dependency, label: "u" }
    - { from: sm, to: sv, kind: dependency, label: "p" }
    - { from: L, to: vs, kind: emphasis, label: "ȳ = 1" }
    - { from: vs, to: vg, kind: emphasis, label: "ā" }
    - { from: vg, to: vm, kind: emphasis, label: "ū" }
    - { from: vm, to: gW, kind: emphasis, label: "∂ℒ/∂W" }
    - { from: sv, to: vs, kind: dependency, label: "read in backward" }
    - { from: vc, to: vs, kind: dependency, label: "assert version" }
    - { from: ip, to: vc, kind: dependency, label: "increments" }
  groups:
    - { id: fwd, label: "forward: records the grad_fn tape" }
    - { id: bwd, label: "backward: reverse order, Algorithm 3.5" }
```

Recomputation. `torch.utils.checkpoint` "trades compute for memory" by recomputing a segment's forward during backward instead of saving its intermediates; the documentation recommends `use_reentrant=False`, and by default "includes logic to juggle the RNG state such that checkpointed passes making use of RNG (through dropout for example) have deterministic output as compared to non-checkpointed passes" [OFFICIAL-DOCUMENTATION — PyTorch 2.14 `torch.utils.checkpoint`, R3.11]. JAX exposes the same trade under `jax.checkpoint` / `jax.remat`, where "only the input ... is stored on the forward pass" and residuals are recomputed, with policies selecting which primitives may save [OFFICIAL-DOCUMENTATION — JAX gradient-checkpointing page, R3.16]. P13 reports recomputing all RMSNorm outputs and MLA up-projections during backward for memory [PAPER-REPORTED]. The policy question of *what* to recompute at scale is owned by §30.2.

Accumulation and clipping. Leaf tensors with `requires_grad=True` "will have gradients accumulated into their .grad fields" across successive `backward()` calls, so Eq. 3.12 is implemented by scaling each micro-batch loss by n_k/Σn_k before its backward, or equivalently by dividing by K when the n_k are equal [OFFICIAL-DOCUMENTATION — Autograd mechanics]. `torch.nn.utils.clip_grad_norm_` computes the norm "as if the norms of the individual gradients were concatenated into a single vector", modifies gradients in place, and returns the total norm; `error_if_nonfinite` defaults to `False`, so a NaN norm silently produces NaN gradients unless the caller checks the returned value [OFFICIAL-DOCUMENTATION — PyTorch 2.14 reference page, R3.11]. Clipping precedes the optimizer step and, under FP16 loss scaling, follows unscaling ([§3.4](03-4-mixed-precision-execution.md)).

Gradient checking. `torch.autograd.gradcheck` compares analytic gradients to "small finite differences" with defaults `eps=1e-06`, `atol=1e-05`, `rtol=0.001`, and "the default values are designed for input of double precision"; the check "will likely fail if input is of less precision" [OFFICIAL-DOCUMENTATION — same root]. JAX's `jax.test_util.check_grads` performs the analogous finite-difference check to a chosen order [OFFICIAL-DOCUMENTATION — JAX automatic-differentiation page, R3.16]. The skeleton uses its own Algorithm 3.7 so that the tolerance is derived from Eq. 3.14 and reported, not inherited.

Cost line: saved-tensor memory ≈ Σ_live bytes(saved) — for one pre-norm block with unfused attention roughly B·T·(≈ 10 d_model + 2 d_ff)·b + B·H·T²·b bytes [DERIVED; exact multiplier is operator-set-specific and given in §5.6]; recomputation adds one extra forward of the segment (≈ +1/3 of step FLOPs if every block is recomputed); accumulation costs one read-modify-write of the gradient buffer per micro-batch; clipping costs one reduction over all gradients plus one scaling pass; the FP64 check costs 2 forward passes per probed direction.

```figure
id: fig-3.16
kind: memory-stack
title: Saved-tensor bytes of one pre-norm block
caption: >-
  The cost line's saved-tensor estimate for one block at the §5.6
  illustrative configuration (B = 8, T = 1024, D = 768, d_ff = 3072, H = 12,
  BF16), not a named model. Unfused, the [B, H, T, T] probabilities are
  192 MiB, the largest segment at T = 1024. A fused kernel replaces them with
  384 KiB of FP32 row statistics and recomputes them in backward.
  Checkpointing the block keeps only its 12 MiB input, at the price of one
  extra forward. The ≈ 10 multiplier is this section's approximation. §5.6
  gives the operator-exact count.
placement: rail
anchor: mechanism
evidence: DERIVED
source: "DERIVED:eq-3.11"
alt: >-
  Three stacked bars of saved-tensor bytes for one pre-norm block at B = 8,
  T = 1024, D = 768, d_ff = 3072, H = 12 and 2 bytes per value, an
  illustrative configuration. Unfused attention: about ten [B, T, D] tensors
  120 MiB, two [B, T, d_ff] tensors 96 MiB and probabilities [B, H, T, T]
  192 MiB, 408 MiB in total. Fused attention: the same 120 MiB and 96 MiB plus
  384 KiB of FP32 [B, H, T] statistics, about 216 MiB. Checkpointed block:
  only the block input [B, T, D], 12 MiB, recomputed in backward.
spec:
  format: bytes
  variables: { B: 8, T: 1024, D: 768, F: 3072, H: 12, b: 2 }
  bars:
    - label: "unfused attention, all saved"
      segments:
        - { label: "≈ 10 [B, T, D] tensors", kind: tensor, formula: "10*B*T*D*b" }
        - { label: "2 [B, T, d_ff] tensors", kind: tensor, formula: "2*B*T*F*b" }
        - { label: "probabilities [B, H, T, T]", kind: tensor, formula: "B*H*T^2*b" }
    - label: "fused attention, P recomputed"
      segments:
        - { label: "≈ 10 [B, T, D] tensors", kind: tensor, formula: "10*B*T*D*b" }
        - { label: "2 [B, T, d_ff] tensors", kind: tensor, formula: "2*B*T*F*b" }
        - { label: "[B, H, T] FP32 statistics", kind: tensor, formula: "B*H*T*4" }
    - label: "checkpointed block, input only"
      segments:
        - { label: "block input [B, T, D]", kind: tensor, formula: "B*T*D*b" }
```

## Algorithm

```text
Algorithm 3.5 — Reverse-mode backward over a tape with saved-tensor version checks
INPUT   tape of nodes (f_k, saved_k, version_k) in forward order; ȳ_K = 1 (dℒ/dℒ)
OUTPUT  ∂ℒ/∂θ_p accumulated into grad[p] for each leaf p
STATE   cotangent map ȳ; grad buffers (FP32 for master weights, §3.4)
INVARIANT before processing node k, ȳ_k is complete (all consumers of y_k processed)
1  for k = K down to 1:
2      for each tensor s in saved_k: assert version(s) == version_k[s]   # in-place check
3      (ȳ_{k−1}, ∂θ_k) ← VJP_k(saved_k, ȳ_k)
4      for each leaf p touched by ∂θ_k: grad[p] ← grad[p] + ∂θ_k[p]     # accumulate
5      release saved_k
6  TERMINATION: K nodes; each node visited once (topological order)
```

Complexity: ≈ 2× the forward FLOPs for matmul-dominated graphs (one VJP for the input, one for the weight); memory peaks at the largest live set of saved tensors.

```text
Algorithm 3.6 — Micro-batched step with accumulation, global-norm clipping, and finiteness gate
INPUT   micro-batches b_1..b_K with valid-token counts n_k; clip threshold c; optimizer
OUTPUT  one parameter update, or a skipped step
STATE   grad buffers zeroed; N = Σ n_k
INVARIANT after line 4 for all k, grad = Σ_k (n_k/N) ∇ℓ̄_k = ∇ℒ (Eq. 3.12)
1  zero grads
2  for k = 1..K:
3      loss_k ← token-mean loss on b_k (FP32 reduction, §3.2)
4      backward( loss_k · n_k / N )          # under loss scaling, multiply by S first (§3.4)
5  (unscale if S ≠ 1)
6  total ← ‖grad‖_2 over all parameters (FP32)
7  if not isfinite(total): skip step; record; (reduce S if scaling) ; return
8  grad ← grad · min(1, c / (total + η))
9  optimizer.step(); log total
10 TERMINATION: K backward passes and one step
```

Complexity: K forward+backward passes; one extra global reduction. The skip in line 7 is the same policy dynamic loss scaling uses ([§3.4](03-4-mixed-precision-execution.md)).

```text
Algorithm 3.7 — FP64 finite-difference gradient check
INPUT   model f in FP64 copy; parameters θ (FP64); fixture batch; step h = 1e-5; R random unit directions v_r
OUTPUT  pass/fail with max observed |d̂_r − g·v_r|
STATE   analytic gradient g from Algorithm 3.5 run in FP64
INVARIANT the same fixture, mask, and deterministic settings are used for every evaluation
1  g ← analytic gradient of ℒ at θ (FP64, deterministic kernels)
2  for r = 1..R:
3      d̂_r ← ( ℒ(θ + h v_r) − ℒ(θ − h v_r) ) / (2h)
4      err_r ← |d̂_r − g·v_r| ;  tol_r ← atol + rtol·|g·v_r|   with atol, rtol from verification.md
5      if err_r > tol_r: fail (report r, err_r, tol_r)
6  pass
7  TERMINATION: 2R + 1 forward evaluations
```

Complexity: O(R) forward passes; directional probes rather than the full Jacobian keep R ≪ |θ|.

## Implementation

Framework: PyTorch (Model / autograd framework layer) executes Algorithm 3.5 eagerly; JAX composes `jax.vjp` / `jax.grad` over pure functions, where arrays are immutable so the version-counter problem does not arise by construction and the corresponding failure mode becomes an unintended recompute [OFFICIAL-DOCUMENTATION — R3.11, R3.16]. Kernels: VJPs of matmuls are themselves matmuls dispatched to NVIDIA cuBLAS / cuBLASLt with the accumulation-type caveats of [§3.2](03-2-stable-primitives.md); fused attention (FlashAttention, P19) recomputes the probabilities in backward from the saved [B, H, T] statistics rather than saving [B, H, T, T]. Memory: `saved_tensors_hooks` allow packing saved tensors to a narrower dtype or to host memory, which is a precision decision and belongs in the manifest. Deployment: none; this is a training-time contract.

> **Implementation note [impl.pytorch · docs 2.14, accessed 2026-09-20; execution UNVERIFIED].** The skeleton uses `set_to_none`-style zeroing before each optimizer step, non-reentrant checkpointing when enabled, and inspects the value returned by `clip_grad_norm_` for finiteness rather than relying on `error_if_nonfinite`.

## Experimental design

Proposed: Experiment 3.3 in [verification.md](verification.md) runs Algorithm 3.7 on the skeleton with R = 64 directions on ordinary and extreme fixtures; an ablation replaces FP64 with FP32 to demonstrate that the same check becomes uninformative (error floor ≈ u_32/h ≈ 6e−3); a second ablation deliberately mutates a saved tensor in place and expects the version-counter error. Seeds and deterministic settings per [§3.6](03-6-reproducibility-limits.md).

## Observations

**What the paper claims.** The PyTorch documentation states the version-counter guarantee: "if you're using in-place functions and not seeing any errors, you can be sure that the computed gradients are correct" [OFFICIAL-DOCUMENTATION — R3.11]. P13 reports recomputation of RMSNorm and MLA up-projection as a memory measure with "minor overhead" [PAPER-REPORTED].

**What the evidence shows.** The correctness of reverse mode is a theorem given correct local VJPs (R3.18, R3.19); what a program can verify empirically is only that *its* composition matches finite differences on *its* fixtures. The checkpointing overhead reported by P13 is not quantified in the report and is not transferable.

**What we infer.** Because Eq. 3.14 gives ≈ 10^−10 accuracy in FP64 but ≈ 10^−3 in FP32, an FP32 gradient check cannot distinguish a correct backward from one with a 0.1% systematic error — the size of error a wrong normalization in Eq. 3.12 produces at K ≈ 10^3 tokens per micro-batch; FP64 is therefore not optional [DERIVED].

**What remains unknown.** The exact saved-tensor set of fused kernels (which intermediates a vendor attention or MLP kernel retains) is NOT-DISCLOSED except where the kernel's source is inspected, which this edition did not do.

## Failure modes

> **Failure mode — Mis-normalized accumulation.** *Symptom:* loss curve identical in shape but learning rate effectively scaled by K or by n_k variation. *Cause:* summing micro-batch means with unequal n_k. *Detection:* Algorithm 3.7 on a two-micro-batch fixture with unequal masks. *Mitigation:* Eq. 3.12 weights.

> **Failure mode — In-place mutation of a saved tensor.** *Symptom:* `RuntimeError` naming the modified variable, or in frameworks without the check, silently wrong gradients. *Cause:* `x.add_()` after x was saved. *Detection:* version counters. *Mitigation:* out-of-place ops on any tensor consumed by a VJP.

> **Failure mode — Clipping a non-finite norm.** *Symptom:* all gradients NaN after clipping; parameters NaN after step. *Cause:* c/(NaN + η) = NaN broadcast to every gradient. *Detection:* check the returned norm. *Mitigation:* gate in Algorithm 3.6 line 7.

> **Failure mode — Activation OOM at long T.** *Symptom:* out-of-memory in backward, not forward. *Cause:* saved tensors proportional to T (or T²) exceed capacity while forward peak was lower. *Detection:* memory trace by phase. *Mitigation:* recomputation, fused attention, smaller micro-batch with Eq. 3.12.

## Siblings

**Forward-mode AD (JVP)** — [§2.4](../ch02-mathematical-and-statistical-foundations/02-4-differential-calculus.md). Why it exists: derivatives of many outputs w.r.t. few inputs. What assumption changed: propagate tangents alongside values, saving nothing. What problem it solved: no activation memory. What new failure mode it introduced: cost proportional to the number of inputs, i.e. |θ| passes for a full gradient. Changed primitive: VJP → JVP.

**Reverse-mode AD (VJP)** — this section. Why it exists: one output (the loss), millions of inputs. What assumption changed: the forward can be retained. What problem it solved: one backward pass for the whole gradient. What new failure mode it introduced: saved-tensor memory and mutation hazards. Changed primitive: JVP → VJP with a tape.

**Recomputation (activation checkpointing)** — this section for the mechanism; policy in [§30.2](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-2-memory-management.md). Why it exists: saved tensors exceed capacity. What assumption changed: FLOPs are cheaper than bytes. What problem it solved: memory proportional to √L or to the checkpoint interval. What new failure mode it introduced: RNG-state divergence between the two forwards, and extra compute. Changed primitive: save → recompute.

```figure
id: fig-3.17
kind: compare
title: Forward mode, reverse mode, and reverse mode with recomputation
caption: >-
  Evaluated on one full gradient of a scalar loss. Forward mode saves nothing
  but needs one pass per parameter. Reverse mode needs one backward but pins
  every saved tensor. Recomputation buys most of that memory back with one
  extra forward per recomputed segment, about a third more step FLOPs if
  every block is recomputed. Each column introduces the failure mode in its
  last row, and the chapter's contracts (version counters, RNG juggling) exist
  to catch the last two.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-3.11", R3.11, R3.16, R3.24]
alt: >-
  Comparison of forward-mode AD, reverse-mode AD with a tape, and reverse
  mode with recomputation, on the cost of one full gradient of a scalar loss
  with respect to |θ| parameters. Passes: |θ| JVP passes; one backward at
  about twice the forward FLOPs; one backward plus one extra forward per
  recomputed segment, about one third more step FLOPs if every block is
  recomputed. Activation memory: none saved; the sum of saved-tensor bytes over
  live nodes; segment inputs only, proportional to √L or the checkpoint
  interval. Assumption changed: tangents propagate with values; the forward
  can be retained; FLOPs are cheaper than bytes. New failure mode: cost
  proportional to the number of inputs; saved-tensor memory and in-place
  mutation hazards; RNG-state divergence between the two forwards. Framework
  surface: owned by §2.4; the grad_fn tape with saved_tensors, and jax.vjp or
  jax.grad; torch.utils.checkpoint with use_reentrant=False, and jax.checkpoint
  or jax.remat.
spec:
  axis: "Cost of one full gradient of a scalar loss with respect to |θ| parameters: passes, activation memory, and the failure each mode introduces"
  columns:
    - { id: fwd, label: "Forward mode (JVP)", node: ms.section.2.4 }
    - { id: rev, label: "Reverse mode (VJP, tape)", node: ms.section.3.3 }
    - { id: ckpt, label: "Reverse mode + recomputation", node: ms.section.30.2 }
  rows:
    - { dimension: "passes for the full gradient", values: { fwd: "|θ| JVP passes", rev: "one backward, ≈ 2× forward FLOPs (Algorithm 3.5)", ckpt: "one backward plus one extra forward per recomputed segment; ≈ +1/3 of step FLOPs if every block" } }
    - { dimension: "activation memory", values: { fwd: "none saved", rev: "Σ over live nodes of saved-tensor bytes", ckpt: "segment inputs only; ∝ √L or the checkpoint interval" } }
    - { dimension: "assumption changed", values: { fwd: "tangents propagate alongside values", rev: "the forward can be retained", ckpt: "FLOPs are cheaper than bytes" } }
    - { dimension: "framework surface", values: { fwd: "owned by §2.4", rev: "grad_fn tape, saved_tensors; jax.vjp / jax.grad", ckpt: "torch.utils.checkpoint (use_reentrant=False); jax.checkpoint / jax.remat" } }
    - { dimension: "new failure mode", values: { fwd: "cost ∝ number of inputs", rev: "saved-tensor memory; in-place mutation hazards", ckpt: "RNG-state divergence between the two forwards; extra compute" } }
```

**Value clipping vs global-norm clipping** — this section. Why value clipping exists: per-element bounds. What assumption changed: direction may be altered. What problem it solved: none that norm clipping does not. What new failure mode it introduced: biased gradient direction. Changed primitive: elementwise clamp → uniform rescale.

## Extensions

For RL post-training the accumulation of Eq. 3.12 must weight by sequences or tokens consistently with the estimator of Eq. N.6 ([§34](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/README.md), forward reference). For multimodal inputs, saved tensors of vision encoders add a second memory term with its own T. For agents, gradients through tool outputs are stopped by construction (proposal).

## Limitations

The contracts assume a single device; with sharded parameters the norm in Eq. 3.13 requires a collective, developed in [§29.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-1-data-state-parallelism.md). Falsification: Algorithm 3.7 failing on an ordinary fixture after the reference primitives pass Experiment 3.2 isolates the defect to the composition or to a custom VJP. Decision consequence: no custom operator enters the skeleton without its own FP64 check.

## Reproducibility

Framework version, deterministic-algorithm setting, and checkpointing mode are recorded in the manifest ([§3.6](03-6-reproducibility-limits.md)); the FP64 check requires FP64 kernels on the device, which for some accelerators means running the check on CPU. Unresolved: fused-kernel saved sets (NOT-DISCLOSED).

## References

P13, P19; R3.11, R3.16, R3.18, R3.19, R3.22, R3.24.
