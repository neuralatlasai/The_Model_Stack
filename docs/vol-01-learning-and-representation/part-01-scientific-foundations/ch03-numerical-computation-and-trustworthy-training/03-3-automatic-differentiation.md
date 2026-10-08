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
word_count_target: 2200
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 3.3 Automatic differentiation

## Scope

[DERIVED] This section connects the calculus of [§2.4](../ch02-mathematical-and-statistical-foundations/02-4-differential-calculus.md) to execution: reverse traversal of an acyclic graph, lifetime of saved values, mutation detection, token-weighted accumulation, clipping, and derivative verification. A symbolic derivative is insufficient when the program differentiates a wrongly masked objective, changes an intermediate before backward, or normalizes micro-batches inconsistently. Distributed accumulation and checkpoint placement at scale remain in Chapters 19 and 30.

## Why this exists

[MATHEMATICALLY-DERIVED] Reverse mode composes local vector–Jacobian products. Correctness requires both correct local derivatives and accumulation of contributions from every outgoing edge. Weight sharing and residual connections make the second premise essential: treating a graph as a chain can discard a contribution even when every operator's derivative is correct.

[OFFICIAL-DOCUMENTATION] PyTorch records operations dynamically and retains operator-dependent values for backward. Its documentation describes saved-tensor version checks and accumulation into leaf gradient fields. These mechanisms do not verify the intended objective. Masking an invalid division after computing it, for example, does not remove that division from the differentiation graph. [R3.31](references.md).

## Intuition

[MATHEMATICALLY-DERIVED] An intermediate's cotangent sums sensitivities arriving through all consumers. Reverse traversal waits until these contributions are complete before applying its local derivative. Saved values supply the arguments at which that derivative is evaluated. Recomputing them is valid only when it reproduces the required values and state; changed randomness or mutable state can change the derivative.

## Formulation

[MATHEMATICALLY-DERIVED] For an acyclic graph with node $y_j=f_j((y_i)_{i\in\mathrm{pred}(j)})$, initialize the scalar loss cotangent to one and all others to zero. Each edge contributes

$$
\bar y_i\mathrel{+}=\left(\frac{\partial f_j}{\partial y_i}\right)^{\!\top}\bar y_j,
\qquad i\in\mathrm{pred}(j).
$$
*(Eq. 3.11)* Addition applies to intermediate nodes and parameter leaves. For $y=x^2+x$, the paths contribute $2x$ and $1$; overwriting gives an incorrect derivative.

[MATHEMATICALLY-DERIVED] Let $s_k$ be the summed valid-token loss in micro-batch $k$, and $n_k$ its valid count. For $N=\sum_k n_k>0$,

$$
\nabla_\theta\mathcal L=\frac1N\sum_k\nabla_\theta s_k
=\sum_{k:n_k>0}\frac{n_k}{N}\nabla_\theta\bar\ell_k,
\qquad \bar\ell_k=s_k/n_k.
$$
*(Eq. 3.12)* Empty micro-batches contribute zero without evaluating their undefined means. An empty effective batch is rejected. Equal weighting of means implements this objective only when counts agree.

```figure
id: fig-3.13
kind: calculator
title: Token-weighted against equal-weighted micro-batch accumulation
caption: >-
  Eq. 3.12 with two micro-batches and one scalar gradient component. With
  1000 and 250 valid tokens, averaging the two micro-batch means gives the
  short micro-batch's tokens 2.5 times their share. The accumulated gradient
  is off by 0.3 on a correct value of 1.2. Nothing diverges, which can change the objective without a non-finite loss. Set n₂ = n₁ and the
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

[MATHEMATICALLY-DERIVED] For finite concatenated gradient $g$ and $c>0$, projection onto a Euclidean ball is

$$
\operatorname{clip}_c(g)=\begin{cases}g,&\|g\|_2\le c,\\ c g/\|g\|_2,&\|g\|_2>c.\end{cases}
$$
*(Eq. 3.13)* This preserves every nonzero gradient's direction, including when clipped. Componentwise clipping generally does not. A denominator epsilon changes the exact projection. Neither formula supplies a recovery policy for non-finite gradients.

[MATHEMATICALLY-DERIVED] Define $\phi(t)=f(\theta+tv)$, $\|v\|_2=1$, and suppose its third derivative has magnitude at most $M_3$ on $[-h,h]$. If computed endpoint values have absolute errors $E_+,E_-$, then

$$
\left|\frac{\widehat\phi(h)-\widehat\phi(-h)}{2h}-\nabla f(\theta)^\top v\right|
\le \frac{M_3h^2}{6}+\frac{E_++E_-}{2h}+E_{\mathrm{quot}}.
$$
*(Eq. 3.14)* The last term covers subtraction/division and argument-formation errors not included in $E_\pm$. Replacing the evaluation term by $u|f|/h$ requires a bound on the whole function evaluation; FP64 storage alone supplies no such bound. Balancing $E/h$ against truncation yields $h=(3E/M_3)^{1/3}$, conditional on known $E,M_3$.

```figure
id: fig-3.14
kind: calculator
title: Conditional finite-difference model, FP64 and FP32
caption: >-
  Eq. 3.14 with the additional model E = u|f| and bounded third derivative, live. Truncation h²‖f‴‖/6 falls with h while rounding u·|f|/h
  rises, so each format has an optimal step h*. With O(1) quantities FP64
  balances near h ≈ 10⁻⁵ at about 10^−10.6. Keep h = 10⁻⁵ and switch to FP32
  and the rounding term alone is ≈ 6e−3. At FP32's own optimum h* ≈ 5.6e−3
  the conditional model is still ≈ 1.6e−5, about six decades worse than FP64. Outputs are
  log₁₀ because the FP64 terms are below the display's resolution.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-3.14"
alt: >-
  Calculator for Eq. 3.14 with the additional model E = u|f| and bounded third derivative with step h, stored mantissa bits p (52 for FP64,
  23 for FP32), ‖f‴‖ and |f|. At h = 1e−5 in FP64 with both norms 1: log₁₀
  of truncation is −10.78, log₁₀ of rounding −10.95, and log₁₀ of the conditional model
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
    - { symbol: Lb, label: "conditional error model", formula: "log10(h^2*f3/6 + 2^-(p+1)*F/h)", format: fixed2, emphasis: true }
    - { symbol: hs, label: "optimal step h*", formula: "(3*2^-(p+1)*F/f3)^(1/3)", format: raw }
    - { symbol: Ls, label: "log10 conditional model at h*", formula: "log10(hs^2*f3/6 + 2^-(p+1)*F/hs)", format: fixed2 }
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Reverse mode records dependencies and values needed by local derivatives, then visits nodes in reverse topological order. For $Y=XW$, the derivatives are $\bar X=\bar YW^\top$, $\bar W=X^\top\bar Y$. Saving or reconstructing $X,W$ is sufficient. A fused operator can use a different saved representation for the same derivative. Tensor sizes, branching, aliasing, and overlapping lifetimes determine peak activation memory; graph depth alone does not.

[OFFICIAL-DOCUMENTATION] Saved tensors in PyTorch carry version information. An incompatible in-place modification detected when backward accesses the saved value raises an error. Saved-tensor hooks may change the stored representation, so lossy packing becomes part of the numerical program. These checks address supported mutation semantics, rather than proving custom backward code correct. [R3.31](references.md).

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

[MATHEMATICALLY-DERIVED] A chain of $L$ equal-size activation states can retain $k$ boundaries and reconstruct $L/k$ states per segment. Activation storage is proportional to $k+L/k$, minimized near $\sqrt L$. This excludes parameters, optimizer states, and workspaces. One extra forward-equivalent traversal gives compute multiplier $(2F+B)/(F+B)$, equal to $4/3$ only if backward cost $B=2F$.

[PAPER-REPORTED] Chen et al. implement segmented recomputation and a graph planner, using a budget heuristic for unequal operations. Their reported static feature-map memory excludes parameters and temporary convolution workspaces; runtime total memory is measured separately. The sublinear claim concerns this explicit allocation boundary. [R3.24, §§4–5](references.md).

[OFFICIAL-DOCUMENTATION] PyTorch recommends non-reentrant checkpointing and describes RNG preservation and its device limitations. JAX rematerialization policies select which residuals are retained. A function that changes global state or introduces an unanticipated device requires additional care: replaying code need not reproduce its original execution state. [R3.39, R3.49](references.md).

[MATHEMATICALLY-DERIVED] Accumulation precedes clipping because projection is nonlinear: clipping a sum differs from summing clipped gradients. FP16 gradients must also be unscaled first; otherwise the threshold is interpreted in scaled units. Componentwise finiteness and norm finiteness are distinct checks because squaring finite gradients can overflow the accumulator.

[DERIVED] For $P$ gradient elements, accumulation and clipping entail $O(P)$ traffic; clipping adds a reduction and scaling pass. Directional finite differences need two forwards per direction and one analytic backward. Coordinatewise Jacobian reconstruction scales with input-coordinate count. These counts do not determine latency or energy without a concrete kernel and measurement boundary.

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

[DERIVED] The reverse traversal requires contributions to every intermediate, not only leaves. Storage release also respects asynchronous consumers when kernels run on multiple streams.

```text
Algorithm 3.5 — Reverse traversal of an acyclic graph
INPUT  acyclic graph, scalar loss, saved values and parameter leaves
OUTPUT  parameter cotangents or mutation error
STATE  cotangent map initialized to zero except loss=1
INVARIANT  all consumers contribute before their input node is processed
1. cotangent[loss] = 1; all other cotangents = 0
2. for node in reverse_topological_order(graph):
3.     verify_versions(node.saved_values)
4.     contributions = local_vjp(node.saved_values, cotangent[node.output])
5.     for (input, contribution) in contributions:
6.         cotangent[input] += contribution
7.     release_saved_values_after_last_use(node)
8. return cotangent[parameter_leaves]
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: one reverse traversal; VJP cost plus live saved values and cotangents
```

[DERIVED] The effective-batch step preserves token weighting and performs one update. Optimizer moments and update counters advance only when that update is accepted; a skip still consumes data unless the surrounding algorithm explicitly replays it.

```text
Algorithm 3.6 — Token-normalized accumulation
INPUT  finite list of micro-batches, valid counts, fixed scale and optimizer
OUTPUT  one accepted update or explicit rejection
STATE  gradient buffers, N, scale and optimizer counters
INVARIANT  accumulated gradient equals token-weighted partial objective before clipping
1. validate N = sum(valid_token_counts) > 0; clear gradients
2. for each nonempty micro_batch:
3.     loss = summed_valid_token_loss(micro_batch) / N
4.     backward(loss * fixed_loss_scale)
5. unscale_once_after_all_micro_batches()
6. reject_if_any_gradient_nonfinite()
7. compute_global_norm_in_declared_accumulator(); reject_if_nonfinite()
8. apply_one_global_clipping_factor()
9. perform_one_optimizer_update(); advance_accepted_update_counter()
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: K forward/backward passes and O(P) gradient reduction/scaling
```

[DERIVED] Derivative checks inspect a range of representable perturbations. Parameters and RNG state are restored between evaluations; dropout is disabled or an identical realization is replayed.

```text
Algorithm 3.7 — Directional derivative diagnostic
INPUT  FP64-preserving function, stored theta, finite direction and step sets
OUTPUT  directional derivative diagnostic records
STATE  restorable parameters and execution/RNG state
INVARIANT  each endpoint evaluation starts from the same declared state
1. compute g = grad(f)(theta) through an FP64-preserving forward path
2. for each stored unit direction v:
3.     for each declared step h:
4.         evaluate f(theta+h*v), f(theta-h*v) from identical state
5.         record central_difference, dot(g,v), absolute_error
6.         record whether perturbed arguments differ from theta
7. inspect the truncation-to-rounding curve; compare justified bounds
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: two forward evaluations per direction/step and one analytic backward
```

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch's gradcheck note reconstructs analytical and finite-difference Jacobians and describes faster directional checks. The JAX cookbook explains JVP/VJP composition and numerical comparisons. These tools have smoothness, dtype, and aliasing requirements; they do not establish that a caller intended the objective it supplied. [R3.36, R3.46](references.md).

[DERIVED] A missing gradient differs from a numerical zero: the former may expose a disconnected parameter, the latter may be correct. Connectivity therefore needs its own declared expected set. An FP64 check must preserve FP64 through attention, normalization, and loss; a hidden `.float()` invalidates the reference even if all parameters were converted with `.double()`.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Chen et al. compare allocation strategies on MXNet and a Titan X. Their ResNet experiments use batch 32 and images $(3,224,224)$; the reported 1000-layer configuration uses less than 7 GB. Separate LSTM graph experiments provide a second workload. The static-allocation and total-runtime traces are distinct measurements. [R3.24, §5, Figs.5–6](references.md).

[PAPER-REPORTED] Pascanu et al. compare SGD, norm-clipped SGD, and clipping plus a separate vanishing-gradient regularizer on music prediction and character-level Penn Treebank. Next-character test bits per character are respectively 1.50, 1.42, and 1.41. The final improvement cannot be attributed to clipping alone. [R3.22, §4.2, Table 2](references.md).

## Observations

**What the paper claims.** [PAPER-REPORTED] The recomputation study reports sublinear feature-map memory under its allocation boundary; the recurrent study distinguishes norm clipping from its additional regularizer. Neither reports validation of the manuscript reference program. [R3.24 section 5; R3.22 section 4.2](references.md).

**What the evidence shows.** [DERIVED] Those source experiments support workload-specific memory and optimization claims. The reported memory trend is not a universal square-root total-memory law, and this revision supplies no independent replication.

**What we infer.** [MATHEMATICALLY-DERIVED] Finite differences test the executed function. A wrong causal mask can have a correct derivative, so target alignment, causality and token weighting require separate semantic checks.

**What remains unknown.** [UNVERIFIED] Complete function-evaluation budgets, the listing's runtime behavior and closed-kernel saved-state sets are not established here. Derivative-sweep and replay results await execution.

## Failure modes

[DERIVED] Lost graph contributions change gradients without necessarily producing non-finite values. Mutation can produce an explicit version error. Equal weighting of unequal micro-batches changes the objective. Clipping before accumulation applies different factors to contributions. No single loss-curve diagnostic distinguishes all these failures.

[MATHEMATICALLY-DERIVED] A numerical mismatch can indicate an incorrect VJP, a non-smooth point, rounded-away perturbations, uncontrolled randomness, or cancellation in evaluation. Decreasing the step eventually amplifies evaluation error. Passing finitely many directional probes does not prove the whole Jacobian correct; an error may lie in an unprobed direction.

## Siblings

[DERIVED] Forward mode propagates input directions; reverse mode propagates output cotangents. Recomputation changes retention and replay, not the intended derivative. Componentwise clipping changes coordinates independently; global clipping applies one scalar. These distinctions separate differentiation modes, memory policies, and optimization safeguards.

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

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Selective rematerialization refines segment checkpointing by retaining expensive residuals and replaying cheaper operations. Non-reentrant execution also changes early stopping of replay and supported transformations. These are version-dependent execution improvements, with no unconditional training-time reduction. [R3.39, R3.49](references.md).

[DERIVED] Fusion can reduce saved state while preserving the VJP. FlashAttention's canonical treatment in Chapter 20 explains tiled recomputation; here it establishes that storing the unfused quadratic attention-probability matrix is not unavoidable. [P19](references.md).

## Limitations

[NOT-DISCLOSED] A high-level operator contract does not establish the saved tensors or arithmetic schedule of every closed vendor kernel. Their exact memory and numerical behavior require the concrete implementation or measurement. This revision does not claim an executable training validation or repository audit.

## Reproducibility

[DERIVED] A derivative comparison needs identical objective, masks, parameters, dtype-preserving evaluation, perturbations, randomness, and backend choices. A checkpoint comparison additionally needs identical replay state. Proposed chapter checks and unresolved coverage are recorded in [verification.md](verification.md), separately from the source experiments above.

## References

[DERIVED] Primary locators: [R3.18, R3.22, R3.24, P19; official documentation R3.31/R3.36/R3.39 and R3.46/R3.49](references.md). The ledger records actual inspection dates and differentiates documentation semantics from executable validation.
