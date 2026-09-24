---
id: ms.section.2.1
entity_type: section
title: Tensor algebra
short_title: Tensor algebra
volume: 1
part: 1
chapter: 2
section: 2.1
slug: 02-1-tensor-algebra
parent: ms.chapter.2
prev_sibling: null
next_sibling: ms.section.2.2
children: []
prerequisites: [ms.section.1.5, ms.frontmatter.notation]
downstream: [ms.section.3.1, ms.section.3.2, ms.section.5.2, ms.section.5.6, ms.section.14.1, ms.section.20.4, ms.section.23.1, ms.section.26.1]
related: [ms.section.25.1, ms.section.40.1]
siblings_by_mechanism: []
relations:
  - {type: prerequisite_of, target: ms.section.5.2}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, inference], mechanism: [tensor_algebra, linear_algebra], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch, impl.jax]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 02.1 Tensor algebra

## Scope

Objective: fix how tensors, contractions, and linear maps are written, costed, and bounded in this book. Baseline: shapes written informally, FLOPs quoted without byte counts, "rank" and "norm" used without a definition. Success: every later tensor trace has a shape contract, a FLOP count, a byte count, and — where a linear solve or inverse is involved — a condition number. Boundaries: floating-point formats and rounding belong to [§03.1](../ch03-numerical-computation-and-trustworthy-training/03-1-numeric-representations.md); kernel-level execution to [§26.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/26-1-execution-primitives.md).

## Why this exists

What failed: papers and code disagree silently about axis order, and cost estimates count multiplications while ignoring the bytes that dominate the time. The bottleneck: on modern accelerators most tensor operations other than large matrix products are bandwidth-bound, so a FLOP-only accounting predicts the wrong bottleneck ([§25](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/README.md) develops the roofline, Eq. N.4). The dominant constraint: arithmetic intensity, which is a property of the contraction's shape. What changed: contractions are written with explicit index labels, and each carries both a FLOP and a byte count.

## Intuition

Physically, a contraction is a reduction over a shared index; its cost in FLOPs is the product of all index extents, while its memory cost is the sum of the operand sizes. The ratio — arithmetic intensity — determines whether the operation is limited by compute or by memory traffic. Broadcasting is free in FLOPs but is not free in bytes if a framework materialises the expanded operand. Rank measures how many independent directions a linear map preserves; singular values measure how much it stretches each; the condition number measures how much an error in the input can be amplified in the output. No cognitive analogy is needed here.

## Formulation

> **Definition — tensor contraction.** For tensors A and B with index labels, the contraction over shared label j is C[i,k] = Σ_j A[i,j] B[j,k]; the general form sums over every label that appears in both operands and does not appear in the output.

$$
C_{i_1 \ldots i_a\, k_1 \ldots k_c} = \sum_{j_1 \ldots j_b} A_{i_1 \ldots i_a\, j_1 \ldots j_b}\; B_{j_1 \ldots j_b\, k_1 \ldots k_c}
$$
*(Eq. 2.1)* where i = free indices of A, k = free indices of B, j = contracted indices.

```figure
id: fig-2.3
kind: tensor-flow
title: Eq. 2.1 as a labelled contraction, the attention logits
caption: >-
  Eq. 2.1 with every index given a role, in einsum form bhtd,bhsd→bhts: b
  and h appear in both operands and in the output (batch), t and s in one
  operand and the output (free), d in both operands but not the output
  (contracted, summed). Only the contraction step costs FLOPs,
  2·B·H·T·S·Dh by Eq. 2.2 with batch B·H; the transpose is a stride change.
  Each logit sums Dh products, so unit-variance entries give variance Dh,
  which the 1/√Dh scale of the Mechanism returns to 1. S = T in
  self-attention; the two labels are kept apart only to show the roles.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.1", "DERIVED:eq-2.2"]
alt: >-
  Four-step shape trace of the attention-logit contraction written as the
  einsum bhtd,bhsd→bhts. Queries Q have shape [B, H, T, Dh] with labels b, h,
  t, d. Keys K [B, H, S, Dh] are viewed transposed as [B, H, Dh, S], a stride
  change with no arithmetic and no copy. Contracting the shared label d gives
  scores [B, H, T, S] at 2·B·H·T·S·Dh FLOPs; each entry is a sum of Dh
  products and so, for independent zero-mean unit-variance entries, has
  variance Dh. Multiplying by 1/√Dh gives scaled logits [B, H, T, S] with
  unit variance, occupying B·H·T·S·b bytes.
spec:
  dims: { B: "sequences, batch label b", H: "heads, batch label h", T: "query positions, free label t", S: "key positions, free label s", Dh: "head dimension, contracted label d" }
  steps:
    - { shape: "[B, H, T, Dh]", label: "Q, first operand, labels b h t d" }
    - { shape: "[B, H, Dh, S]", label: "Kᵀ, second operand, labels b h d s", op: "K [B, H, S, Dh] viewed transposed", cost: "strides only: 0 FLOPs, no copy" }
    - { shape: "[B, H, T, S]", label: "Q·Kᵀ, labels b h t s", op: "sum over the shared label d, Eq. 2.1", cost: "2·B·H·T·S·Dh FLOPs; Var = Dh" }
    - { shape: "[B, H, T, S]", label: "scaled logits", op: "× 1/√Dh", cost: "Var = 1; B·H·T·S·b bytes" }
```

> **Definition — batched matrix multiplication.** A contraction over one index applied independently across one or more leading batch axes: `[B, M, K] × [B, K, N] → [B, M, N]`.

$$
\text{FLOPs} = 2\,B\,M\,K\,N, \qquad \text{bytes} \ge b\,B\,(MK + KN + MN), \qquad I = \frac{2\,M\,K\,N}{b\,(MK + KN + MN)}
$$
*(Eq. 2.2)* where B = batch axis extent, M, K, N = matrix extents, b = bytes per value (notation.md), I = arithmetic intensity in FLOPs/byte (notation.md).

```figure
id: fig-2.4
kind: calculator
title: FLOPs, bytes and arithmetic intensity of one batched matmul
caption: >-
  Eq. 2.2 on one [B, M, K] × [B, K, N] product. Intensity is the one output
  that does not scale with B: the smallest of M, K and N sets it. As the
  reader scrolls the instrument follows the section: a square GEMM at
  4096/3 ≈ 1365 FLOPs per byte, the decode matrix–vector product at
  ≈ 2/b, the score product of the Implementation trace at ≈ 120, and the
  quantised sibling that halves b. Bytes are the one-read lower bound of
  the Mechanism; illustrative shapes, not a named model.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.2"
alt: >-
  Calculator for Eq. 2.2 with inputs batch extent B, matrix extents M, K and
  N, and bytes per value b. At the defaults B = 1, M = K = N = 4096, b = 2 the
  product costs 137,438,953,472 FLOPs (about 137 GFLOP), moves at least
  100,663,296 bytes (96 MiB) and has arithmetic intensity 4096/3 ≈ 1365.3
  FLOPs per byte. With M = 1, a decode matrix–vector product, it costs
  33,554,432 FLOPs over 32 MiB, intensity 0.9995, about 2/b = 1; with b = 1
  the intensity doubles to about 2. The score product of the Implementation
  trace at batch B·H = 32, M = N = T = 4096 and K = Dh = 128 costs the same
  137 GFLOP but moves 1088 MiB, an intensity of about 120.5. Illustrative
  shapes, not a named model.
spec:
  tex: >-
    \text{FLOPs} = 2\,B\,M\,K\,N,\qquad \text{bytes} \ge b\,B\,(MK + KN + MN),\qquad I = \frac{2\,M\,K\,N}{b\,(MK + KN + MN)}
  equation: "2.2"
  inputs:
    - { symbol: B, label: "batch extent B", default: 1, min: 1, max: 1024, scale: log2, format: integer }
    - { symbol: M, label: "rows M", default: 4096, min: 1, max: 16384, scale: log2, format: integer }
    - { symbol: K, label: "contracted extent K", default: 4096, min: 16, max: 16384, scale: log2, format: integer }
    - { symbol: N, label: "columns N", default: 4096, min: 1, max: 16384, scale: log2, format: integer }
    - { symbol: b, label: "bytes per value b", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: F, label: "FLOPs, 2·B·M·K·N", formula: "2*B*M*K*N", format: flops }
    - { symbol: Y, label: "bytes, one read of each operand and one write", formula: "b*B*(M*K + K*N + M*N)", format: bytes }
    - { symbol: I, label: "arithmetic intensity, FLOPs per byte", formula: "F/Y", format: fixed2, emphasis: true }
    - { symbol: Ib, label: "decode limit 2/b, for reference", formula: "2/b", format: fixed2 }
  presets:
    - { label: "decode, M = 1", values: { M: 1 } }
    - { label: "scores: B·H = 32, T = 4096, Dh = 128", values: { B: 32, M: 4096, K: 128, N: 4096 } }
states:
  - { anchor: formulation, label: "square GEMM", variables: { B: 1, M: 4096, K: 4096, N: 4096, b: 2 }, highlight: [F, Y, I], note: "M = K = N = 4096: 137 GFLOP over at least 96 MiB, I = 4096/3 ≈ 1365 FLOPs per byte." }
  - { anchor: mechanism, label: "decode, M = 1", variables: { B: 1, M: 1, K: 4096, N: 4096, b: 2 }, highlight: [M, I, Ib], note: "One row: I = 2KN/(b(K + KN + N)) = 0.9995, the 2/b of the Mechanism. No accelerator's peak changes this ratio." }
  - { anchor: implementation, label: "scores Q·Kᵀ", variables: { B: 32, M: 4096, K: 128, N: 4096, b: 2 }, highlight: [F, Y, I], note: "Batch B·H = 32, M = N = T = 4096, K = Dh = 128: the same 137 GFLOP as the square GEMM, but 1088 MiB moved and I ≈ 120." }
  - { anchor: siblings, label: "quantised, b = 1", variables: { B: 1, M: 1, K: 4096, N: 4096, b: 1 }, highlight: [b, I], note: "The quantised sibling changes only b: the decode product's intensity doubles, from about 1 to about 2 FLOPs per byte." }
```

> **Definition — broadcasting.** Two shapes are broadcast-compatible if, aligning trailing axes, each pair of extents is equal or one of them is 1 (or missing); the size-1 axis is treated as repeated.

> **Claim [OFFICIAL-DOCUMENTATION · R2.8].** PyTorch 2.14 documents the rule "starting at the trailing dimension, the dimension sizes must either be equal, one of them is 1, or one of them does not exist", and documents that expanding a tensor "does not allocate new memory, but only creates a new view on the existing tensor where a dimension of size one is expanded to a larger size by setting the stride to 0", while "operations on an expanded view may still allocate memory if they need to materialize the expanded values" (docs.pytorch.org, version 2.14, accessed 2026-09-20).

> **Definition — rank, norms, singular values.** For A ∈ ℝ^{m×n} with singular value decomposition A = UΣVᵀ and singular values σ₁ ≥ … ≥ σ_r > 0, rank(A) = r; the spectral norm is ‖A‖₂ = σ₁; the Frobenius norm is ‖A‖_F = (Σ_i σ_i²)^{1/2}.

$$
A = U \Sigma V^{\top}, \qquad \|A\|_2 = \sigma_1, \qquad \|A\|_F^2 = \sum_{i=1}^{r} \sigma_i^2, \qquad \min_{\operatorname{rank}(\hat A)\le k} \|A - \hat A\|_F^2 = \sum_{i>k} \sigma_i^2
$$
*(Eq. 2.3)* where U ∈ ℝ^{m×r}, V ∈ ℝ^{n×r} orthonormal columns, Σ = diag(σ_i); the last identity is the Eckart–Young theorem.

> **Definition — condition number.** κ₂(A) = σ_max/σ_min for full-column-rank A; κ₂ = ∞ for rank-deficient A.

$$
\frac{\|\delta x\|}{\|x\|} \le \kappa_2(A)\,\frac{\|\delta b\|}{\|b\|} \quad \text{for } Ax = b,\; A(x+\delta x) = b + \delta b
$$
*(Eq. 2.4)* where δb = perturbation of the right-hand side, δx = induced perturbation of the solution.

> **Assumption.** Values are stored in a floating-point format with unit roundoff u (format-specific values in [§03.1](../ch03-numerical-computation-and-trustworthy-training/03-1-numeric-representations.md)) · *sensitivity:* Eq. 2.4 with ‖δb‖/‖b‖ ≈ u gives the achievable relative accuracy of a solve; when κ₂ u approaches 1 the solution carries no correct digits.

```figure
id: fig-2.5
kind: calculator
title: Condition number against unit roundoff
caption: >-
  Eq. 2.4 with the input perturbation ‖δb‖/‖b‖ set to the unit roundoff
  u = 2^−p of a p-bit significand, as the Assumption does. The bound κ₂·u is
  the worst-case relative error of the solve; −log₁₀(κ₂u) is the number of
  decimal digits it can still guarantee, and it reaches zero where κ₂u ≈ 1,
  the Assumption's "no correct digits". The p options are significand
  widths; which format has which p is owned by §03.1.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.4"
alt: >-
  Calculator for Eq. 2.4 with inputs σ_max, σ_min and significand precision
  p in bits, u = 2^−p. At the defaults σ_max = 1, σ_min = 10^−3, p = 24:
  κ₂ = 1000, log₁₀ u = −7.22, relative error bound κ₂u ≈ 0.006 % (5.96 × 10^−5)
  and about 4.2 guaranteed decimal digits. At σ_min = 10^−7 the bound is
  about 60 % and 0.2 digits remain. At p = 8 with κ₂ = 1000 the bound is
  about 391 % and no digit is guaranteed. At p = 53 with κ₂ = 1000 about 13
  digits remain.
spec:
  tex: >-
    \frac{\|\delta x\|}{\|x\|} \le \kappa_2(A)\,\frac{\|\delta b\|}{\|b\|},\qquad \kappa_2 = \frac{\sigma_{\max}}{\sigma_{\min}},\qquad \frac{\|\delta b\|}{\|b\|} \approx u = 2^{-p}
  equation: "2.4"
  inputs:
    - { symbol: smax, label: "largest singular value σ_max", default: 1, min: 0.001, max: 1000, scale: log10, format: raw }
    - { symbol: smin, label: "smallest singular value σ_min", default: 0.001, min: 1.0e-12, max: 1, scale: log10, format: raw }
    - { symbol: p, label: "significand precision p, bits", default: 24, min: 8, max: 53, options: [8, 11, 24, 53], format: integer }
  outputs:
    - { symbol: kappa, label: "κ₂ = σ_max/σ_min", formula: "smax/smin", format: raw }
    - { symbol: lu, label: "log₁₀ u, with u = 2^−p", formula: "-p*log10(2)", format: fixed2 }
    - { symbol: E, label: "relative error bound κ₂·u", formula: "kappa*2^(-p)", format: percent, emphasis: true }
    - { symbol: digits, label: "guaranteed decimal digits, −log₁₀(κ₂u)", formula: "max(0, -(log10(kappa) + lu))", format: fixed1 }
  presets:
    - { label: "κ₂ = 10⁷", values: { smin: 1.0e-7 } }
    - { label: "p = 8, κ₂ = 10³", values: { p: 8 } }
states:
  - { anchor: formulation, label: "κ₂ = 10³, p = 24", variables: { smax: 1, smin: 0.001, p: 24 }, highlight: [kappa, E, digits], note: "κ₂u ≈ 6 × 10⁻⁵: about four of the solve's decimal digits survive rounding of the right-hand side." }
  - { anchor: failure-modes, label: "κ₂ = 10⁷, ill-conditioned", variables: { smax: 1, smin: 1.0e-7, p: 24 }, highlight: [kappa, E, digits], note: "κ₂u ≈ 0.6: the ill-conditioned solve. Coefficients of a fit can move by their own size under rounding alone." }
  - { anchor: siblings, label: "quantised, p = 8", variables: { smax: 1, smin: 0.001, p: 8 }, highlight: [p, E], note: "Coarser values raise u to 2⁻⁸ ≈ 0.0039; at κ₂ = 10³ the worst-case amplification of Eq. 2.4 exceeds 100 %." }
```

## Mechanism

Eq. 2.2 follows by counting: each output element of a matrix product needs K multiply–adds, there are M·N outputs per batch element, and a multiply–add is two FLOPs [MATHEMATICALLY-DERIVED · DERIVED:eq-2.2]. The byte bound counts one read of each operand and one write of the output; real kernels re-read tiles, so it is a lower bound. Arithmetic intensity grows with the smallest of M, K, N: for a decode-step matrix–vector product (M = 1) it is ≈ 2K N /(b(K N + K + N)) ≈ 2/b FLOPs per byte, which is why single-sequence decode is memory-bound regardless of accelerator (developed in [§42](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md)) [MATHEMATICALLY-DERIVED · DERIVED:eq-2.2].

```figure
id: fig-2.6
kind: chart
title: Arithmetic intensity against the smallest matmul extent
caption: >-
  Eq. 2.2 with K = N = 4096 fixed and M swept from one decode row to 16,384.
  At M = 1 the product does about 2/b FLOPs per byte whatever the
  accelerator; the curve rises almost in proportion to M until M nears K
  and N, then bends toward its ceiling 2KN/(b(K + N)) = 2048 at b = 2. The
  annotated M values are this section's Experimental-design grid. Halving b
  doubles every point. No ridge point P_peak/B_mem is drawn: it belongs to a
  stated accelerator (Chapter 25), not to the equation.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.2"
alt: >-
  Log–log line chart of arithmetic intensity I = 2MKN/(b(MK + KN + MN))
  against M from 1 to 16,384 at K = N = 4096. For b = 2 bytes: I = 0.9995 at
  M = 1, 15.9 at M = 16, 227.6 at M = 256, 1365.3 at M = 4096 and 1820.4 at
  M = 16,384, approaching the dashed ceiling 2KN/(b(K + N)) = 2048. For
  b = 1 byte every value doubles: 2.0, 31.8, 455.1, 2730.7 and 3640.9.
spec:
  type: line
  x: { label: "rows M (decode = 1)", scale: log2, format: integer, domain: [1, 16384] }
  y: { label: "FLOPs per byte, one-read bound", scale: log2, format: raw }
  variables: { K: 4096, N: 4096 }
  series:
    - { id: b2, label: "b = 2 bytes", formula: "2*x*K*N/(2*(x*K + K*N + x*N))", sample: { from: 1, to: 16384, count: 15 }, emphasis: true }
    - { id: b1, label: "b = 1 byte", formula: "2*x*K*N/(1*(x*K + K*N + x*N))", sample: { from: 1, to: 16384, count: 15 } }
    - { id: cap, label: "ceiling 2KN/(b(K + N)), b = 2", formula: "2*K*N/(2*(K + N))", sample: { from: 1, to: 16384, count: 2 }, dashed: true }
  annotations:
    - { x: 1, label: "decode: I ≈ 2/b" }
    - { x: 16, label: "M = 16: 15.9" }
    - { x: 256, label: "M = 256: 228" }
    - { x: 4096, label: "square: 4096/3 ≈ 1365" }
```

The attention-logit scale 1/√d_h is a variance argument: if the entries of q and k are independent with zero mean and unit variance, then Var(q·k) = d_h, so dividing by √d_h restores unit variance and keeps the softmax away from saturation [MATHEMATICALLY-DERIVED · DERIVED:eq-2.1]. The attention calculation itself is owned by [§05.2](../ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation.md).

<details><summary>Derivation of Eq. 2.4</summary>

From Ax = b and A(x + δx) = b + δb, δx = A⁻¹δb, so ‖δx‖ ≤ ‖A⁻¹‖₂‖δb‖ = ‖δb‖/σ_min. From b = Ax, ‖b‖ ≤ σ_max‖x‖, hence 1/‖x‖ ≤ σ_max/‖b‖. Multiplying, ‖δx‖/‖x‖ ≤ (σ_max/σ_min)‖δb‖/‖b‖. The bound is attained when δb lies along the left singular vector of σ_min and b along that of σ_max.

</details>

Cost of the objects defined: a full SVD of an m×n matrix costs O(mn·min(m,n)) FLOPs and is rarely affordable on weight matrices during training; the spectral norm alone is obtained by power iteration at two matrix–vector products per iteration (Algorithm 2.1), which is why spectral monitoring of weights ([§20.4](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-4-stability-instrumentation.md)) uses it [MATHEMATICALLY-DERIVED · DERIVED:alg-2.1]. Low-rank factorisation ΔW = B A with inner dimension r replaces a d_out × d_in product by two products costing 2r(d_in + d_out) FLOPs per token instead of 2 d_in d_out, and stores r(d_in + d_out) values instead of d_in d_out; this is the accounting behind parameter-efficient adaptation ([§23.1](../../part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/23-1-adaptation-families.md)) [MATHEMATICALLY-DERIVED · DERIVED:eq-2.3].

## Algorithm

```text
Algorithm 2.1 — Power iteration for the spectral norm
INPUT   A ∈ ℝ^{m×n}; iteration budget K; tolerance ε
OUTPUT  σ̂ ≈ σ_1(A)
STATE   v ∈ ℝ^n (unit vector), σ_prev
INVARIANT ‖v‖₂ = 1 after every iteration; σ̂ is non-decreasing in exact arithmetic
1  v ← random unit vector; σ_prev ← 0
2  for k = 1 … K:
3      u ← A v;            u ← u / ‖u‖₂          # one matvec, 2mn FLOPs
4      v ← Aᵀ u;           σ̂ ← ‖v‖₂;  v ← v / σ̂  # one matvec, 2mn FLOPs
5      if |σ̂ − σ_prev| ≤ ε σ̂: break
6      σ_prev ← σ̂
7  return σ̂
```

Complexity: 4mn FLOPs and one read of A per iteration; convergence is geometric at rate (σ₂/σ₁)², so ill-separated leading singular values need many iterations [MATHEMATICALLY-DERIVED]. Termination: at K or at tolerance. Implementation: any framework matvec; A is read from HBM once per iteration, so the cost is bandwidth-bound.

```figure
id: fig-2.7
kind: chart
title: Power-iteration budget against the spectral gap
caption: >-
  Algorithm 2.1 converges at rate (σ₂/σ₁)², so the iteration count for the
  error envelope (σ₂/σ₁)^{2k} to fall below ε is ln ε / (2 ln(σ₂/σ₁)),
  drawn against the relative gap 1 − σ₂/σ₁. The count grows as 1/gap: a gap
  of 0.5 needs about 10 iterations for ε = 10⁻⁶, a gap of 0.01 about 690.
  Every iteration is two matrix–vector products, 4mn FLOPs, so an
  ill-separated spectrum is expensive through the budget, not through any
  single step. The envelope's constant is set to 1.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:alg-2.1"
alt: >-
  Log–log line chart of the iterations k needed for (σ₂/σ₁)^{2k} to reach a
  tolerance ε, k = ln ε / (2 ln(1 − gap)), against the relative gap
  1 − σ₂/σ₁ from 0.001 to 0.5. For ε = 10^−6: about 10 iterations at gap 0.5,
  66 at 0.1, 687 at 0.01 and 6904 at 0.001. For ε = 10^−3 each count is half
  as large: about 5, 33, 344 and 3452. Each iteration costs 4mn FLOPs,
  67,108,864 for a 4096 × 4096 matrix.
spec:
  type: line
  x: { label: "relative gap 1 − σ₂/σ₁", scale: log10, format: raw, domain: [0.001, 0.5] }
  y: { label: "iterations k to reach ε", scale: log10, format: integer }
  series:
    - { id: e3, label: "ε = 10⁻³", formula: "ln(0.001)/(2*ln(1 - x))", sample: { from: 0.001, to: 0.5, count: 12 } }
    - { id: e6, label: "ε = 10⁻⁶", formula: "ln(0.000001)/(2*ln(1 - x))", sample: { from: 0.001, to: 0.5, count: 12 }, emphasis: true }
  annotations:
    - { x: 0.5, label: "gap 0.5: ≈ 10 iterations" }
    - { x: 0.1, label: "gap 0.1: ≈ 66" }
    - { x: 0.01, label: "gap 0.01: ≈ 690" }
```

## Implementation

Tensor trace for the projections that feed attention, in the axis names of notation.md:

```text
Tensor trace
[B, T, D] → linear W_qkv [D, 3·H·Dh] → [B, T, 3·H·Dh] → view → [B, T, 3, H, Dh] → permute → 3 × [B, H, T, Dh]
[B, H, T, Dh] × [B, H, Dh, T] → batched matmul → [B, H, T, T]      # 2·B·H·T²·Dh FLOPs, output B·H·T²·b bytes
[B, H, T, T] × [B, H, T, Dh] → batched matmul → [B, H, T, Dh]      # 2·B·H·T²·Dh FLOPs
```

Framework: `einsum` and batched `matmul` in PyTorch or JAX are dispatched to batched GEMM in NVIDIA cuBLAS / cuBLASLt (or AMD ROCm equivalents); which library algorithm is selected for a given shape is UNVERIFIED here and owned by Chapter 26. Broadcast operands are stride-0 views, not copies, in PyTorch 2.14 [OFFICIAL-DOCUMENTATION · R2.8]. The `permute` in the trace changes strides, not memory; a subsequent kernel that requires contiguity triggers a copy of B·T·H·Dh·b bytes, exactly the "may still allocate memory if they need to materialize" case the documentation names. The [B, H, T, T] score tensor is the object that IO-aware attention avoids materialising ([§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md)). Kernel-level tiling, and which Triton language or NVIDIA CUTLASS kernel realises a given contraction, are owned by Chapter 26.

## Experimental design

Proposal: for a grid of (M, K, N, b) covering M ∈ {1, 16, 256, 4096}, measure achieved FLOP/s of batched matmul on one stated accelerator and compare against min(P_peak, I·B_mem) from Eq. 2.2 and Eq. N.4; report the ratio with p50/p95 over repeated launches. The independent variable is I; the prediction is that the ratio saturates once I exceeds P_peak/B_mem. Seeds are irrelevant; runtime version, driver, and clock state must be pinned. This is the roofline experiment developed in Chapter 25 and is not run in this edition.

## Observations

**What the paper claims.** No spine paper is claimed for this section; the PyTorch 2.14 documentation states the broadcasting rule and the stride-0 view semantics of expansion [OFFICIAL-DOCUMENTATION · R2.8].

**What the evidence shows.** Eq. 2.1–2.4 are theorems; they need no independent support. The claim that decode is memory-bound follows from Eq. 2.2 for M = 1 and does not depend on any measurement [MATHEMATICALLY-DERIVED].

**What we infer.** The byte bound in Eq. 2.2 is a lower bound; realised traffic is higher by a tiling-dependent factor that the book treats as ASSUMED until Chapter 26 measures it.

**What remains unknown.** Which shapes route to which cuBLASLt algorithm, and the effective bytes moved per GEMM for a specific library version, are UNVERIFIED here.

## Failure modes

> **Failure mode — silent broadcast.** *Symptom:* a loss that is finite but wrong, or a [B, T] mask applied as [T, B]. *Cause:* two shapes that are broadcast-compatible by accident. *Detection:* assert shapes at module boundaries; name axes in einsum strings. *Mitigation:* explicit `unsqueeze`/`expand`; shape contracts as in [§03.5](../ch03-numerical-computation-and-trustworthy-training/03-5-reference-implementation.md).

> **Failure mode — ill-conditioned solve.** *Symptom:* a least-squares fit (e.g. a scaling-law fit, §02.6) whose coefficients change wildly with tiny data changes. *Cause:* κ₂ u ≈ 1 for the design matrix. *Detection:* compute σ_min/σ_max of the design matrix. *Mitigation:* rescale columns, regularise, or solve in higher precision.

> **Failure mode — accidental contiguity copy.** *Symptom:* a permute followed by an unexpected memory spike. *Cause:* a downstream kernel requiring contiguous input. *Detection:* memory profiler at the op boundary. *Mitigation:* fuse or reorder the permute.

## Siblings

**Index-labelled contraction (einsum)** — this file. Why it exists: to make axis semantics explicit. Changed primitive: positional `matmul` → labelled contraction. New failure mode: unreadable index strings.

**Low-rank factored product** — [§23.1](../../part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/23-1-adaptation-families.md). Why it exists: reduce trainable state. What assumption changed: the update lies in a rank-r subspace. What objective changed: none. What problem it solved: r(d_in + d_out) trainable values instead of d_in d_out. New failure mode: expressivity capped by r. Changed primitive: one dense product → two thin products.

**Quantised product** — [§40.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-1-quantization-formulation.md). Why it exists: reduce b in Eq. 2.2. What assumption changed: values tolerate coarser representation. What problem it solved: bytes per value. New failure mode: error amplification governed by Eq. 2.4. Changed primitive: b = 2 → b ≤ 1.

```figure
id: fig-2.8
kind: compare
title: Three forms of one linear map, costed by Eq. 2.2
caption: >-
  Read the FLOPs and stored-values rows at d_in = d_out = 4096 and r = 16
  (an illustrative shape): the factored product does 1/128 of the dense
  FLOPs and stores 1/128 of the values, while the quantised product keeps
  every FLOP and every value and changes only b. Each sibling pays in a
  different currency: the labelled contraction in readability, low rank in
  expressivity, quantisation in error amplified by κ₂ (Eq. 2.4).
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.2", "DERIVED:eq-2.3", "DERIVED:eq-2.4"]
alt: >-
  Comparison of three siblings for applying one d_out × d_in linear map per
  token. Labelled contraction (einsum): positional matmul replaced by named
  indices; 2·d_in·d_out FLOPs and d_in·d_out stored values; at
  d_in = d_out = 4096 that is 33,554,432 FLOPs and 16,777,216 values; new
  failure mode unreadable index strings. Low-rank factored product (§23.1):
  two thin products; 2r(d_in + d_out) FLOPs and r(d_in + d_out) values; at
  r = 16, 262,144 FLOPs and 131,072 values, one 128th of dense; assumption
  that the update lies in a rank-r subspace; failure mode expressivity capped
  by r, with best rank-r error given by Eckart–Young. Quantised product
  (§40.1): b = 2 reduced to b ≤ 1; FLOPs and values unchanged, 16 MiB instead
  of 32 MiB at b = 1; failure mode error amplification governed by κ₂.
spec:
  axis: >-
    Cost of applying one d_out × d_in linear map to one token, by Eq. 2.2, at
    fixed d_in and d_out; the quality of the resulting map is not an axis
  columns:
    - { id: dense, label: "Labelled contraction (einsum)", node: ms.section.2.1 }
    - { id: lowrank, label: "Low-rank factored product", node: ms.section.23.1 }
    - { id: quant, label: "Quantised product", node: ms.section.40.1 }
  rows:
    - { dimension: "changed primitive", values: { dense: "positional matmul → labelled contraction", lowrank: "one dense product → two thin products, ΔW = BA", quant: "b = 2 → b ≤ 1" } }
    - { dimension: "FLOPs per token", values: { dense: "2·d_in·d_out", lowrank: "2r(d_in + d_out)", quant: "2·d_in·d_out, unchanged" } }
    - { dimension: "stored values", values: { dense: "d_in·d_out", lowrank: "r(d_in + d_out)", quant: "d_in·d_out, at b bytes each" } }
    - { dimension: "at d_in = d_out = 4096, r = 16", values: { dense: "33,554,432 FLOPs; 16,777,216 values (32 MiB at b = 2)", lowrank: "262,144 FLOPs; 131,072 values: 1/128 of dense", quant: "33,554,432 FLOPs; 16 MiB at b = 1" } }
    - { dimension: "assumption changed", values: { dense: "none", lowrank: "the update lies in a rank-r subspace", quant: "values tolerate a coarser representation" } }
    - { dimension: "new failure mode", values: { dense: "unreadable index strings", lowrank: "expressivity capped by r; best rank-r error Σ_{i>r} σ_i² (Eq. 2.3)", quant: "error amplification governed by κ₂ (Eq. 2.4)" } }
    - { dimension: "owning section", values: { dense: "§02.1", lowrank: "§23.1", quant: "§40.1" } }
```

## Extensions

For long context the [B, H, T, T] tensor in the trace dominates memory and is the reason for IO-aware kernels ([§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md)). For multimodal inputs the contraction pattern is unchanged; only T is composed of tokens from several encoders ([§18](../../part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md)). Mixture-of-experts replaces one batched matmul by a grouped matmul with ragged batch extents, for which Eq. 2.2 must be summed per expert ([§16](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/README.md)). These are cross-references, not proposals.

## Limitations

Eq. 2.2's byte count is valid as a lower bound only; it says nothing about cache behaviour. Eq. 2.4 is a worst-case bound in the 2-norm; typical perturbations are amplified less. The condition-number argument assumes a linear solve; iterative optimisation of a nonconvex loss has no single κ, though curvature ratios (§02.4) play the analogous role. Falsification: a measured matmul achieving more than min(P_peak, I·B_mem) with I from Eq. 2.2 would indicate a mis-stated P_peak, B_mem, or byte count, not a violated theorem.

## Reproducibility

Symbols: as in notation.md plus σ_i, κ₂, I, r (local). The tensor trace is framework-agnostic; the stride and broadcasting claims are documented for PyTorch 2.14 (R2.8, accessed 2026-09-20). GEMM algorithm selection per shape: UNVERIFIED. No measurement was made.

## References

R2.8 (PyTorch 2.14 broadcasting and `expand` documentation). Cross-chapter: notation.md Eq. N.4. See [references.md](references.md).
