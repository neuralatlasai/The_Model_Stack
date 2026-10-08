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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 02.1 Tensor algebra

## Scope

A tensor contraction combines indexed arrays and sums over designated axes. Its specification includes operand and output shapes, retained batch axes, arithmetic work, ideal data movement, and any layout transformation required by execution. Rank, singular values, and matrix norms describe the represented linear map; condition numbers bound sensitivity of a specified solve. Floating-point representation is developed in [§03.1](../ch03-numerical-computation-and-trustworthy-training/03-1-numeric-representations.md), and kernel execution in [§26.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/26-1-execution-primitives.md).

## Why this exists

The same algebraic product can have different execution costs after changing batch extent, operand sharing, storage precision, or layout. FLOP counts alone omit data movement; shape labels alone omit which axes are reduced. Explicit index and traffic contracts separate these questions. A hardware performance bound additionally needs sustained compute and memory rates, as developed by the roofline treatment in [Chapter 25](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/README.md) [MATHEMATICALLY-DERIVED · DERIVED:eq-2.2].

## Intuition

A two-operand contraction forms products and reduces them over summed axes. The multiply-add convention counts approximately twice the product of retained and reduced extents; ideal operand reads and output writes give a separate byte boundary. Broadcasting can preserve a view through zero strides, while a later operation can require materialization. Singular values measure directional gains; a solve's condition number bounds amplification of perturbations in the recovered solution under the specified perturbation model [MATHEMATICALLY-DERIVED · DERIVED:eq-2.4; OFFICIAL-DOCUMENTATION · R2.8].

## Formulation

> **Definition — tensor contraction.** For tensors A and B with index labels, the contraction over shared label j is Z[i,k] = Σ_j A[i,j] B[j,k]; the general form sums over every label that appears in both operands and does not appear in the output.

$$
Z_{i_1 \ldots i_a\, k_1 \ldots k_c} = \sum_{j_1 \ldots j_b} A_{i_1 \ldots i_a\, j_1 \ldots j_b}\; B_{j_1 \ldots j_b\, k_1 \ldots k_c}
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
  (contracted, summed). The contraction costs approximately
  2·B·H·T·S·Dh by Eq. 2.2 with batch B·H; scalar scaling adds B·H·T·S
  multiplies. The transpose is a stride change.
  Each logit sums Dh products, so independent zero-mean unit-variance entries give variance Dh,
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

> **Definition — batched matrix multiplication.** A contraction over one index applied independently across one or more leading batch axes: `[B, M, K] × [B, K, J] → [B, M, J]`.

$$
\text{FLOPs} = 2\,B\,M\,K\,J, \qquad \text{bytes} \ge b\,B\,(MK + KJ + MJ), \qquad I = \frac{2\,M\,K\,J}{b\,(MK + KJ + MJ)}
$$
*(Eq. 2.2)* where B = batch axis extent, M, K, J = matrix extents, b = bytes per value (notation.md), I = arithmetic intensity in FLOPs/byte (notation.md).

```figure
id: fig-2.4
kind: calculator
title: FLOPs, bytes and arithmetic intensity of one batched matmul
caption: >-
  Eq. 2.2 on one [B, M, K] × [B, K, J] product. Intensity is the one output
  that does not scale with B: the smallest of M, K and J sets it. As the
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
  J, and bytes per value b. At the defaults B = 1, M = K = J = 4096, b = 2 the
  product costs 137,438,953,472 FLOPs (about 137 GFLOP), moves at least
  100,663,296 bytes (96 MiB) and has arithmetic intensity 4096/3 ≈ 1365.3
  FLOPs per byte. With M = 1, a decode matrix–vector product, it costs
  33,554,432 FLOPs over 32 MiB, intensity 0.9995, about 2/b = 1; with b = 1
  the intensity doubles to about 2. The score product of the Implementation
  trace at batch B·H = 32, M = J = T = 4096 and K = Dh = 128 costs the same
  137 GFLOP but moves 1088 MiB, an intensity of about 120.5. Illustrative
  shapes, not a named model.
spec:
  tex: >-
    \text{FLOPs} = 2\,B\,M\,K\,J,\qquad \text{bytes} \ge b\,B\,(MK + KJ + MJ),\qquad I = \frac{2\,M\,K\,J}{b\,(MK + KJ + MJ)}
  equation: "2.2"
  inputs:
    - { symbol: B, label: "batch extent B", default: 1, min: 1, max: 1024, scale: log2, format: integer }
    - { symbol: M, label: "rows M", default: 4096, min: 1, max: 16384, scale: log2, format: integer }
    - { symbol: K, label: "contracted extent K", default: 4096, min: 16, max: 16384, scale: log2, format: integer }
    - { symbol: J, label: "columns J", default: 4096, min: 1, max: 16384, scale: log2, format: integer }
    - { symbol: b, label: "bytes per value b", default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: F, label: "FLOPs, 2·B·M·K·J", formula: "2*B*M*K*J", format: flops }
    - { symbol: Y, label: "bytes, one read of each operand and one write", formula: "b*B*(M*K + K*J + M*J)", format: bytes }
    - { symbol: I, label: "arithmetic intensity, FLOPs per byte", formula: "F/Y", format: fixed2, emphasis: true }
    - { symbol: Ib, label: "decode limit 2/b, for reference", formula: "2/b", format: fixed2 }
  presets:
    - { label: "decode, M = 1", values: { M: 1 } }
    - { label: "scores: B·H = 32, T = 4096, Dh = 128", values: { B: 32, M: 4096, K: 128, J: 4096 } }
states:
  - { anchor: formulation, label: "square GEMM", variables: { B: 1, M: 4096, K: 4096, J: 4096, b: 2 }, highlight: [F, Y, I], note: "M = K = J = 4096: 137 GFLOP over at least 96 MiB, I = 4096/3 ≈ 1365 FLOPs per byte." }
  - { anchor: mechanism, label: "decode, M = 1", variables: { B: 1, M: 1, K: 4096, J: 4096, b: 2 }, highlight: [M, I, Ib], note: "One row: I = 2KJ/(b(K + KJ + J)) = 0.9995, the 2/b of the Mechanism. No accelerator's peak changes this ratio." }
  - { anchor: implementation, label: "scores Q·Kᵀ", variables: { B: 32, M: 4096, K: 128, J: 4096, b: 2 }, highlight: [F, Y, I], note: "Batch B·H = 32, M = J = T = 4096, K = Dh = 128: the same 137 GFLOP as the square GEMM, but 1088 MiB moved and I ≈ 120." }
  - { anchor: siblings, label: "quantised, b = 1", variables: { B: 1, M: 1, K: 4096, J: 4096, b: 1 }, highlight: [b, I], note: "The quantised sibling changes only b: the decode product's intensity doubles, from about 1 to about 2 FLOPs per byte." }
```

> **Definition — broadcasting.** Two shapes are broadcast-compatible if, aligning trailing axes, each pair of extents is equal or one of them is 1 (or missing); the size-1 axis is treated as repeated.

> **Claim [OFFICIAL-DOCUMENTATION · R2.8].** PyTorch 2.14, “Broadcasting semantics,” General semantics, aligns trailing dimensions, requiring equality or a singleton dimension. The `Tensor.expand` reference documents a zero-stride view and warns that logical elements can share a memory location. Clone before an in-place write. This interface was inspected on 2026-10-07; no allocation profile was measured.

> **Definition — rank, norms, singular values.** For A ∈ ℝ^{m×n} with singular value decomposition A = UΣVᵀ and singular values σ₁ ≥ … ≥ σ_r > 0, rank(A) = r; the spectral norm is ‖A‖₂ = σ₁; the Frobenius norm is ‖A‖_F = (Σ_i σ_i²)^{1/2}.

$$
A = U \Sigma V^{\top}, \qquad \|A\|_2 = \sigma_1, \qquad \|A\|_F^2 = \sum_{i=1}^{r} \sigma_i^2, \qquad \min_{\operatorname{rank}(\hat A)\le k} \|A - \hat A\|_F^2 = \sum_{i>k} \sigma_i^2
$$
*(Eq. 2.3)* where U ∈ ℝ^{m×r}, V ∈ ℝ^{n×r} orthonormal columns, Σ = diag(σ_i); the last identity is the Eckart–Young theorem.

> **Definition — condition number.** κ₂(A) = σ_max/σ_min for square nonsingular A; κ₂ = ∞ for singular A. A rectangular pseudoinverse needs its own perturbation contract; Eq. 2.4 below treats a square solve.

$$
\frac{\|\delta x\|}{\|x\|} \le \kappa_2(A)\,\frac{\|\delta b\|}{\|b\|} \quad \text{for } Ax = b,\; A(x+\delta x) = b + \delta b
$$
*(Eq. 2.4)* where δb = perturbation of the right-hand side, δx = induced perturbation of the solution.

> **Assumption.** Values are stored in a floating-point format with unit roundoff u (format-specific values in [§03.1](../ch03-numerical-computation-and-trustworthy-training/03-1-numeric-representations.md)) · *sensitivity:* Eq. 2.4 with ‖δb‖/‖b‖ ≈ u gives the achievable relative accuracy of a solve; when κ₂u approaches one this perturbation bound guarantees no accurate digits; favorable perturbation directions can produce smaller actual error.

```figure
id: fig-2.5
kind: calculator
title: Condition number against unit roundoff
caption: >-
  Eq. 2.4 with the input perturbation ‖δb‖/‖b‖ set to the unit roundoff
  u = 2^−p of a p-bit significand, as the Assumption does. The bound κ₂·u applies to an exact solve after the specified right-hand-side
  perturbation; it omits matrix perturbations and solver roundoff. The decimal
  accuracy scale −log₁₀(κ₂u) reaches zero at κ₂u = 1; favorable directions may
  still have smaller actual error. The p options are significand
  widths; which format has which p is owned by §03.1.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.4"
alt: >-
  Calculator for Eq. 2.4 with inputs σ_max, σ_min and significand precision
  p in bits, u = 2^−p. At the defaults σ_max = 1, σ_min = 10^−3, p = 24:
  κ₂ = 1000, log₁₀ u = −7.22, relative error bound κ₂u ≈ 0.006 % (5.96 × 10^−5)
  and about 4.2 decimal accuracy scale. At σ_min = 10^−7 the bound is
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
    - { symbol: digits, label: "decimal accuracy scale, −log₁₀(κ₂u)", formula: "max(0, -(log10(kappa) + lu))", format: fixed1 }
  presets:
    - { label: "κ₂ = 10⁷", values: { smin: 1.0e-7 } }
    - { label: "p = 8, κ₂ = 10³", values: { p: 8 } }
states:
  - { anchor: formulation, label: "κ₂ = 10³, p = 24", variables: { smax: 1, smin: 0.001, p: 24 }, highlight: [kappa, E, digits], note: "κ₂u ≈ 6 × 10⁻⁵: about four of the solve's decimal digits survive rounding of the right-hand side." }
  - { anchor: failure-modes, label: "κ₂ = 10⁷, ill-conditioned", variables: { smax: 1, smin: 1.0e-7, p: 24 }, highlight: [kappa, E, digits], note: "κ₂u ≈ 0.6: the ill-conditioned solve. Coefficients of a fit can move by their own size under rounding alone." }
  - { anchor: siblings, label: "quantised, p = 8", variables: { smax: 1, smin: 0.001, p: 8 }, highlight: [p, E], note: "Coarser values raise u to 2⁻⁸ ≈ 0.0039; at κ₂ = 10³ the worst-case amplification of Eq. 2.4 exceeds 100 %." }
```

## Mechanism

### Methodology

Eq. 2.2 follows by counting: each output element of a matrix product needs K multiply–adds, there are M·J outputs per batch element, and a multiply–add is two FLOPs [MATHEMATICALLY-DERIVED · DERIVED:eq-2.2]. The byte bound counts one read of each operand and one write of the output; real kernels re-read tiles, so it is a lower bound. Arithmetic intensity grows with the smallest of M, K, J: for a decode-step matrix–vector product (M = 1) it is ≈ 2K J /(b(K J + K + J)) ≈ 2/b FLOPs per byte, which supplies the low arithmetic intensity of that contraction; a bandwidth-limited prediction also requires the hardware ridge point and the stated memory boundary (developed in [§42](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md)) [MATHEMATICALLY-DERIVED · DERIVED:eq-2.2].

```figure
id: fig-2.6
kind: chart
title: Arithmetic intensity against the smallest matmul extent
caption: >-
  Eq. 2.2 with K = J = 4096 fixed and M swept from one decode row to 16,384.
  At M = 1 the product does about 2/b FLOPs per byte whatever the
  accelerator; the curve rises almost in proportion to M until M nears K
  and J, then bends toward its ceiling 2KJ/(b(K + J)) = 2048 at b = 2. The
  annotated M values are this section's Experimental-design grid. Halving b
  doubles every point. No ridge point P_peak/B_mem is drawn: it belongs to a
  stated accelerator (Chapter 25), not to the equation.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.2"
alt: >-
  Log–log line chart of arithmetic intensity I = 2MKJ/(b(MK + KJ + MJ))
  against M from 1 to 16,384 at K = J = 4096. For b = 2 bytes: I = 0.9995 at
  M = 1, 15.9 at M = 16, 227.6 at M = 256, 1365.3 at M = 4096 and 1820.4 at
  M = 16,384, approaching the dashed ceiling 2KJ/(b(K + J)) = 2048. For
  b = 1 byte every value doubles: 2.0, 31.8, 455.1, 2730.7 and 3640.9.
spec:
  type: line
  x: { label: "rows M (decode = 1)", scale: log2, format: integer, domain: [1, 16384] }
  y: { label: "FLOPs per byte, one-read bound", scale: log2, format: raw }
  variables: { K: 4096, J: 4096 }
  series:
    - { id: b2, label: "b = 2 bytes", formula: "2*x*K*J/(2*(x*K + K*J + x*J))", sample: { from: 1, to: 16384, count: 15 }, emphasis: true }
    - { id: b1, label: "b = 1 byte", formula: "2*x*K*J/(1*(x*K + K*J + x*J))", sample: { from: 1, to: 16384, count: 15 } }
    - { id: cap, label: "ceiling 2KJ/(b(K + J)), b = 2", formula: "2*K*J/(2*(K + J))", sample: { from: 1, to: 16384, count: 2 }, dashed: true }
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

### Shape, layout, and reduction contract

The algebraic contract has four separate objects: the logical axis extents; the index equation defining the result; the mapping from indices to storage; and the reduction order used in finite precision. For an array with offset $o$, element strides $s_j$, and index $i_j$, its element address is $o+\sum_j i_js_j$. A transpose permutes extents and strides. A zero-stride dimension maps all its logical positions to one stored value. Neither identity implies that a downstream operator accepts the layout without copying. PyTorch's expanded-view warning is therefore part of the mutation contract, while exact kernel selection and workspace traffic remain UNVERIFIED [OFFICIAL-DOCUMENTATION · R2.8, `Tensor.expand`, Warning].

For a general two-input contraction, classify every index as retained batch, free-left, free-right, or reduced. An index retained in both inputs, as $b$ in $Z_{bik}=\sum_j A_{bij}W_{bjk}$, is not summed. After compatible permutation and flattening, the operation has batch extent $B$, row extent $M$, reduction extent $K$, and column extent $n_{\rm col}$. Its scalar multiply count is $BMKn_{\rm col}$ and addition count $BMn_{\rm col}(K-1)$ when $K\ge1$; $2BMKn_{\rm col}$ is the conventional multiply-add FLOP accounting. Temporary flattening can be a view or require a copy depending on strides. For three or more operands, choosing an intermediate changes peak storage and arithmetic work; an index expression alone does not fix the contraction order [MATHEMATICALLY-DERIVED · DERIVED:eq-2.1].

The byte bound in Eq. 2.2 assumes distinct materialized batched operands, one read each, and a newly written output, all at the same $b$. Shared broadcast weights are counted once at the stated memory level if retained there; repeatedly fetching them from a lower cache level changes that boundary. An accumulated output also needs its old contents read. A transpose view changes no value, but a contiguous copy reads and writes every element. These distinctions are required before comparing a contraction's arithmetic intensity to the hardware bound in Chapter 25 [MATHEMATICALLY-DERIVED · DERIVED:eq-2.2].

### Singular values, approximation error, and solve sensitivity

For a vector $u$, $\|u\|_p=(\sum_i|u_i|^p)^{1/p}$ for $1\le p<\infty$ and $\|u\|_\infty=\max_i|u_i|$. The induced matrix 2-norm maximizes $\|Au\|_2/\|u\|_2$ and equals $\sigma_1$ because orthogonal $U,V$ preserve length. The Frobenius norm sums squared entries, so orthogonal invariance yields $\|A\|_F^2=\mathrm{tr}(A^\top A)=\sum_i\sigma_i^2$. They answer different questions: largest directional gain versus total squared magnitude. For $r$ nonzero singular values, $\|A\|_2\le\|A\|_F\le\sqrt r\|A\|_2$ follows by bounding each squared singular value by $\sigma_1^2$ [MATHEMATICALLY-DERIVED · DERIVED:eq-2.3].

To establish the low-rank error in Eq. 2.3, let $P$ project onto the column space of a rank-at-most-$k$ approximation $\hat A$. Orthogonal decomposition gives $\|A-\hat A\|_F^2\ge\|(\mathrm{Id}-P)A\|_F^2=\|A\|_F^2-\mathrm{tr}(PAA^\top)$. Write the trace in the eigenbasis of $AA^\top$: it is $\sum_i\sigma_i^2u_i^\top Pu_i$, with coefficients in $[0,1]$ whose sum is at most $k$. Its maximum is the sum of the largest $k$ squared singular values. Retaining those singular triplets attains the bound, proving the identity. In spectral norm the corresponding optimum is $\sigma_{k+1}$. Repeated boundary singular values permit multiple optimal subspaces; rank truncation is not then a unique parameterization [MATHEMATICALLY-DERIVED · DERIVED:eq-2.3].

Equation 2.4 perturbs only the right-hand side. If both the matrix and right-hand side change, write $(A+\Delta A)(x+\Delta x)=b_{\rm rhs}+\Delta b_{\rm rhs}$. Rearrangement gives $\Delta x=A^{-1}(\Delta b_{\rm rhs}-\Delta A x)-A^{-1}\Delta A\Delta x$. If $\kappa_2(A)\|\Delta A\|_2/\|A\|_2<1$, taking norms and moving the last term left gives

$$
\frac{\|\Delta x\|_2}{\|x\|_2}\le
\frac{\kappa_2(A)}{1-\kappa_2(A)\|\Delta A\|_2/\|A\|_2}
\left(\frac{\|\Delta b_{\rm rhs}\|_2}{\|b_{\rm rhs}\|_2}+\frac{\|\Delta A\|_2}{\|A\|_2}\right).
$$
*(Eq. 2.28)* Here $b_{\rm rhs}$ is a right-hand-side vector, distinct from global bytes-per-value $b$; all vector norms are Euclidean. The denominator explains why a perturbation of the matrix can remove invertibility. For a tall full-rank least-squares matrix, forming normal equations squares its 2-norm condition number, since the eigenvalues of $A^\top A$ are $\sigma_i^2$. A QR or SVD solve avoids that squaring in its formulation, at additional factorization work [MATHEMATICALLY-DERIVED · DERIVED:eq-2.28].

The counted boundary here is an algebraic operator, not a full training run. Tensor state and traffic are explicit above; model parameters and tokens enter only when an operand is a model tensor. Communication is zero for an explicitly single-device contraction. Distributed movement belongs to its placement specification. Latency, throughput, energy, and money cannot be recovered from FLOPs and bytes alone and are UNVERIFIED for these illustrative shapes.

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

Complexity: 4mn FLOPs and two matrix traversals per iteration if A is not retained in cache; convergence of the leading-vector direction is geometric at rate (σ₂/σ₁)² when σ₁ > σ₂ and the initialization has a nonzero leading component. The prefactor depends on that component. Termination: at K or at the iterate-change tolerance, which is not a certified error bound. Zero norms in lines 3 or 4 require a zero-matrix/nullspace branch before division. Implementation: two framework matvecs; the hardware-specific compute/memory rates and cache residency determine the bottleneck [MATHEMATICALLY-DERIVED].

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

The algebraic `einsum` or `matmul` specification does not identify its backend kernel. Library routing for a particular shape, device, dtype and framework version is UNVERIFIED here. `Tensor.expand` documents a stride-0 view in PyTorch 2.14; this does not prove that every downstream broadcasting operation allocates no intermediate [OFFICIAL-DOCUMENTATION · R2.8]. The `permute` in the trace changes strides, not memory; a subsequent kernel that requires contiguity triggers a copy of B·T·H·Dh·b bytes, when the consumer explicitly materializes that whole operand. The [B, H, T, T] score tensor is the object that IO-aware attention avoids materialising ([§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md)). Kernel-level tiling, and which Triton language or NVIDIA CUTLASS kernel realises a given contraction, are owned by Chapter 26.

## Experimental design

### Reported experiments

Tensor identities and the low-rank and perturbation bounds are mathematical results; training datasets, random seeds, and benchmark scores are not applicable to their validity. R2.8 documents shape and aliasing examples rather than a hardware benchmark. No source-inspected protocol establishes a speedup from broadcasting, a transpose, or a particular contraction layout. The unexecuted book checks, including power-iteration error and shape/stride audits, are specified in [verification.md](verification.md#2-verification-task).

## Observations

Equation 2.2 counts the declared arithmetic and ideal operand/output traffic. Low intensity for a single-row product follows algebraically; memory-bound execution additionally needs a hardware ridge point, a placement, and a cache/traffic boundary. Framework allocation and elapsed time are distinct observations and are not measured by the shape calculation [MATHEMATICALLY-DERIVED · DERIVED:eq-2.2].

The condition-number result pertains to a specified linear solve. Directional alignment can make the actual perturbation smaller than the worst-case bound; matrix changes and solver roundoff require their own terms. The singular spectrum also fixes the optimal approximation error at each retained rank, independently of any later training adaptation [MATHEMATICALLY-DERIVED · DERIVED:eq-2.3; DERIVED:eq-2.28].

PyTorch documents broadcast compatibility and zero-stride expansion; it does not establish which library algorithm executes every contraction. Kernel routing, measured traffic, and latency for a named shape/device/version remain UNVERIFIED [OFFICIAL-DOCUMENTATION · R2.8].

## Failure modes

> **Failure mode — silent broadcast.** *Symptom:* a loss that is finite but wrong, or a [B, T] mask applied as [T, B]. *Cause:* two shapes that are broadcast-compatible by accident. *Detection:* assert shapes at module boundaries; name axes in einsum strings. *Mitigation:* explicit `unsqueeze`/`expand`; shape contracts as in [§03.5](../ch03-numerical-computation-and-trustworthy-training/03-5-reference-implementation.md).

> **Failure mode — ill-conditioned solve.** *Symptom:* a least-squares fit (e.g. a scaling-law fit, §02.6) whose coefficients change wildly with tiny data changes. *Cause:* κ₂ u ≈ 1 for the design matrix. *Detection:* compute σ_min/σ_max of the design matrix. *Mitigation:* rescale columns, regularise, or solve in higher precision.

> **Failure mode — accidental contiguity copy.** *Symptom:* a permute followed by an unexpected memory spike. *Cause:* a downstream kernel requiring contiguous input. *Detection:* memory profiler at the op boundary. *Mitigation:* fuse or reorder the permute.

## Siblings

Index-labeled notation changes the specification of a contraction without changing its mathematical value. Execution can still depend on contraction ordering and layout. A low-rank update BA with B∈ℝ^{d_out×r}, A∈ℝ^{r×d_in} stores r(d_in+d_out) trainable values and has rank at most r; the rank cap constrains the update, not necessarily the rank of an already full-rank base weight. Two thin products replace the update's dense product, with their own intermediate and launch costs [MATHEMATICALLY-DERIVED · DERIVED:eq-2.3].

Quantization changes value representation and may require scale/zero-point state, conversion work, and accumulator precision. Reducing b in Eq. 2.2 captures only the operand-byte term. Equation 2.4 bounds quantization effects only when they enter its specified solve perturbation; an arbitrary neural-network forward product needs its own operator/error analysis. Full adaptation and quantization mechanisms are developed in Chapters 23 and 40.

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

### Improvements

The truncation identity gives an exact improvement in storage and algebraic approximation error when a matrix is represented by rank-$k$ factors; it gives no automatic improvement in task loss or wall time. QR/SVD formulations improve the conditioning of a least-squares computation relative to explicitly formed normal equations in the precise sense above. No inspected source establishes a universally superior GPU contraction path for all layouts, dimensions, and precisions [MATHEMATICALLY-DERIVED · DERIVED:eq-2.3].

For long context the [B, H, T, T] tensor in the trace dominates memory and is the reason for IO-aware kernels ([§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md)). For multimodal inputs the contraction pattern is unchanged; only T is composed of tokens from several encoders ([§18](../../part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md)). Mixture-of-experts replaces one batched matmul by a grouped matmul with ragged batch extents, for which Eq. 2.2 must be summed per expert ([§16](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/README.md)). These are cross-references, not proposals.

## Limitations

Eq. 2.2's byte count is valid as a lower bound only; it says nothing about cache behaviour. Eq. 2.4 is a worst-case bound in the 2-norm; actual amplification depends on perturbation direction. The condition-number argument assumes a linear solve; iterative optimisation of a nonconvex loss has no single κ, though curvature ratios (§02.4) play the analogous role. Falsification: a measured matmul achieving more than min(P_peak, I·B_mem) with I from Eq. 2.2 would indicate a mis-stated P_peak, B_mem, or byte count, not a violated theorem.

## Reproducibility

Symbols: as in notation.md plus σ_i, κ₂, I, r (local). The tensor trace is framework-agnostic; the stride and broadcasting claims are documented for PyTorch 2.14 (R2.8, accessed 2026-10-07). GEMM algorithm selection per shape: UNVERIFIED. No measurement was made.

## References

R2.8 (PyTorch 2.14 broadcasting and `expand` documentation). Cross-chapter: notation.md Eq. J.4. See [references.md](references.md).
