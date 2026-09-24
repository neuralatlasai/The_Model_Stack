---
id: ms.section.3.2
entity_type: section
title: Stable primitives
short_title: Stable primitives
volume: 1
part: 1
chapter: 3
section: 3.2
slug: 03-2-stable-primitives
parent: ms.chapter.3
prev_sibling: ms.section.3.1
next_sibling: ms.section.3.3
children: []
prerequisites: [ms.section.2.1, ms.section.2.3, ms.section.3.1]
downstream: [ms.section.3.5, ms.section.5.2, ms.section.26.3, ms.section.26.6, ms.section.27.1]
related: [ms.section.20.4]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P19}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.flashattention}
axes: {lifecycle: [pretraining, inference], mechanism: [numerical_stability, reduction], feedback_setting: [], modality: [text]}
papers: [P19]
implementations: [impl.pytorch, impl.flashattention, impl.nvidia-cublas-cublaslt]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 3.2 Stable primitives

## Scope

Objective: give overflow-safe and cancellation-safe forms of the five primitives every language-model training step executes many times — log-sum-exp, softmax, normalization statistics, long reductions, and differences of nearly equal quantities — each with an explicit accumulation dtype and an error bound derived from [§3.1](03-1-numeric-representations.md). Baseline: the textbook formulas evaluated naively in the storage dtype. Success criterion: every primitive agrees with an FP64 twin within the bound stated here on the extreme fixtures of [verification.md](verification.md). Boundaries: the attention kernel that fuses these primitives is owned by [§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md); operator kernels by [§26.3](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/26-3-core-operators.md).

## Why this exists

What failed: exp(z) overflows FP16 at z > ln 65504 ≈ 11.09 and FP32 at z > ln x_max ≈ 88.7, so a softmax over raw logits fails on inputs that are ordinary for a trained model [MATHEMATICALLY-DERIVED — Table 3.1]. Bottleneck: the residual-stream width d_model and the sequence length T set reduction lengths in the thousands, and the forward error of a naive sum grows linearly with that length [MATHEMATICALLY-DERIVED — Eq. 3.10]. Dominant constraint: the storage dtype of the operands is chosen for bandwidth, so stability has to come from the algorithm and the accumulation dtype, not from wider storage. What changed: primitives are written as a max-shift plus a reduction in FP32, and the reduction is blocked so that its error grows with log of the length.

## Intuition

Physically, a reduction is a sequence of roundings, each losing at most u relative to the running partial sum; the damage is proportional to how large the partial sums are relative to the final answer. Subtracting the maximum before exponentiating bounds every term by 1 and makes the largest term exactly 1, so the sum lies in [1, n] and cannot overflow. A two-pass variance subtracts the mean before squaring, so the squares are small relative to nothing large, and the cancellation that destroys E[x²] − E[x]² never occurs. Blocked summation keeps partial sums comparable in magnitude so that no single rounding is amplified.

## Formulation

Let z ∈ ℝ^n (FP32 or BF16 storage), m = max_i z_i.

$$
\mathrm{LSE}(z) = m + \log \sum_{i=1}^{n} \exp(z_i - m)
$$
*(Eq. 3.6)* where every argument of exp is ≤ 0 and at least one equals 0, so the sum is in [1, n].

$$
\mathrm{softmax}(z)_i = \frac{\exp(z_i - m)}{\sum_{j} \exp(z_j - m)} = \exp\big(z_i - \mathrm{LSE}(z)\big)
$$
*(Eq. 3.7)* where the second form is the one to use when log-probabilities are needed (cross-entropy), because it never divides.

RMSNorm and LayerNorm statistics over the width D for a row x ∈ ℝ^D:

$$
\mathrm{rms}(x) = \sqrt{\tfrac{1}{D}\textstyle\sum_i x_i^2 + \epsilon}, \qquad \mu = \tfrac{1}{D}\textstyle\sum_i x_i,\quad \sigma^2 = \tfrac{1}{D}\textstyle\sum_i (x_i - \mu)^2
$$
*(Eq. 3.8)* where ε is a small stabilizer, and the sums are accumulated in FP32 regardless of the storage dtype of x. The layer definitions belong to [§5.1](../ch05-minimal-transformer-and-execution-trace/05-1-end-to-end-forward-pass.md); this section fixes how their statistics are computed.

Forward error of recursive versus pairwise summation of n terms with unit roundoff u (Higham, R3.7):

$$
\Big|\mathrm{fl}\Big(\sum_i x_i\Big) - \sum_i x_i\Big| \le \gamma_{n-1}\sum_i |x_i| \;\;\text{(recursive)},\qquad \le \gamma_{\lceil \log_2 n\rceil}\sum_i |x_i| \;\;\text{(pairwise)}
$$
*(Eq. 3.9)* where γ_k = k u / (1 − k u) and the bound is relative to Σ|x_i|, not to the result.

```figure
id: fig-3.8
kind: chart
title: Summation error bound against reduction length
caption: >-
  Eq. 3.9 in its first-order form k·u, relative to Σ|x_i|. γ_k = k·u/(1 − k·u)
  is within 0.4 % of k·u wherever an FP32 line is drawn. The rail cursor moves
  as the section argues. FP32 recursive against pairwise at n = 4096, then
  BF16 accumulation reaching 1 at n = 256. Next, Algorithm 3.4's blocked sum,
  then the swamped reduction of case E8 at n = 2^16. Where the BF16 line is
  above 1 the bound guarantees no correct digit, and γ itself is undefined
  past k·u = 1.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.9", "DERIVED:alg-3.4"]
alt: >-
  Log–log chart of the first-order summation error bound divided by Σ|x_i|
  against reduction length n from 16 to 65536. BF16 accumulation, recursive,
  (n − 1)·2^−8: 0.059 at n = 16, 0.996 at n = 256, 16 at 4096, 256 at
  65536. FP32 recursive, (n − 1)·2^−24: 2.4e−4 at 4096 and 3.9e−3 at 65536.
  FP32 blocked with K = 128 (Algorithm 3.4), (K + ⌈log₂(n/K)⌉)·2^−24: 7.9e−6
  at 4096 and 8.2e−6 at 65536. FP32 pairwise, ⌈log₂ n⌉·2^−24: 7.2e−7 at 4096
  and 9.5e−7 at 65536. A dashed line at 1 marks where the bound guarantees
  nothing.
spec:
  type: line
  x: { label: "reduction length n", scale: log2, format: integer, domain: [16, 65536] }
  y: { label: "error bound ÷ Σ|x_i|, first order", scale: log10, format: raw }
  variables: { K: 128 }
  series:
    - { id: rec16, label: "BF16 accumulation, recursive, (n−1)·2^−8", formula: "(x - 1)*2^-8", sample: { from: 16, to: 65536, count: 13 } }
    - { id: rec32, label: "FP32 recursive, (n−1)·2^−24", formula: "(x - 1)*2^-24", sample: { from: 16, to: 65536, count: 13 } }
    - { id: blk32, label: "FP32 blocked, K = 128, Algorithm 3.4", formula: "(min(x, K) + ceil(log2(max(x/K, 1)) - 0.000001))*2^-24", sample: { from: 16, to: 65536, count: 13 }, emphasis: true }
    - { id: pair32, label: "FP32 pairwise, ⌈log₂ n⌉·2^−24", formula: "ceil(log2(x) - 0.000001)*2^-24", sample: { from: 16, to: 65536, count: 13 } }
    - { id: one, label: "bound = 1: no digit guaranteed", formula: "1", sample: { from: 16, to: 65536, count: 2 }, dashed: true }
  annotations:
    - { x: 256, label: "BF16 recursive reaches 1" }
    - { x: 4096, label: "d_model-length reduction" }
states:
  - { anchor: formulation, label: "n = 4096", variables: { x: 4096 }, highlight: [rec32, pair32], note: "Eq. 3.9 at n = 4096: recursive FP32 gives (n − 1)·u ≈ 2.4e−4 of Σ|x_i|. Pairwise gives ⌈log₂ n⌉·u = 12·u ≈ 7.2e−7." }
  - { anchor: mechanism, label: "BF16 accumulator, n = 256", variables: { x: 256 }, highlight: [rec16, one], note: "With u = 2^−8 the recursive bound reaches (n − 1)·u ≈ 1 at n = 256, so no digit is guaranteed. BF16 reductions must accumulate in FP32." }
  - { anchor: algorithm, label: "blocked, K = 128", variables: { x: 4096 }, highlight: [blk32], note: "Algorithm 3.4: K + ⌈log₂(n/K)⌉ = 133 roundings deep at n = 4096, a bound of ≈ 7.9e−6, 31 times below the recursive sum." }
  - { anchor: failure-modes, label: "swamped, n = 2^16", variables: { x: 65536 }, highlight: [rec16, rec32], note: "Case E8: at n = 65536 the BF16-accumulated bound is 256, which means nothing. FP32 recursive is ≈ 3.9e−3. This is the 'swamped reduction' failure mode." }
  - { anchor: siblings, label: "three orders at n = 2^16", variables: { x: 65536 }, highlight: [rec32, blk32, pair32], note: "Recursive, blocked and pairwise at n = 2^16 give 3.9e−3, 8.2e−6 (137·u) and 9.5e−7 (16·u). Kahan summation (not drawn) is O(u) + O(n·u²)." }
```

Cancellation: for ŷ = fl(a − b) with a, b already carrying relative errors ≤ δ,

$$
\frac{|\hat{y} - (a-b)|}{|a-b|} \le \delta\,\frac{|a|+|b|}{|a-b|} + u
$$
*(Eq. 3.10)* where the factor (|a|+|b|)/|a−b| is the condition number of subtraction and is unbounded as a → b.

> **Definition — Accumulation dtype.** The format in which the partial sums of a reduction are held between roundings; it is a property of the algorithm, distinct from the input dtype and the output dtype.

> **Definition — Catastrophic cancellation.** The loss of relative precision in a − b when a and b are close and carry prior rounding error, quantified by Eq. 3.10.

> **Definition — Max-subtracted log-sum-exp.** Evaluation of log Σ exp(z_i) as in Eq. 3.6, which is overflow-safe and exact up to the rounding of exp and log.

## Mechanism

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-3.6].** Eq. 3.6 equals log Σ exp(z_i) for all finite z, since m + log Σ exp(z_i − m) = m + log(e^{−m} Σ e^{z_i}). Its rounding error is bounded by (n + 2)u relative to the sum, because each term is in (0, 1] and the sum is in [1, n], so no term is negligible by more than a factor n and no overflow can occur.

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-3.8].** The one-pass identity σ² = E[x²] − μ² has relative error ≈ u · E[x²]/σ², which is unbounded as σ → 0 with μ ≠ 0 (Eq. 3.10 with a = E[x²], b = μ²); the two-pass form has relative error O(D u) independent of μ.

```figure
id: fig-3.9
kind: chart
title: One-pass variance error against the row's mean-to-spread ratio
caption: >-
  The claim above, drawn. The one-pass error u·E[x²]/σ² = u·(1 + μ²/σ²) grows
  with the square of |μ|/σ. In FP32 it passes the two-pass line near
  |μ|/σ ≈ √D = 64 and reaches 1 at |μ|/σ = 2^12. Beyond that the sign of σ²
  is not guaranteed and sqrt returns NaN. Case E5 (|μ| ≈ 10³, σ² ≈ 10⁻⁶)
  sits at 10⁶, where the one-pass bound is ≈ 6·10⁴. The two-pass line is the
  O(D·u) scale with its constant taken as 1 and D = 4096. That constant is an
  assumption of the drawing.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.8", "DERIVED:eq-3.10"]
alt: >-
  Log–log chart of the first-order relative error of the variance σ² against
  |μ|/σ from 0.1 to 10^7. One-pass E[x²] − μ² in FP32, 2^−24·(1 + (|μ|/σ)²):
  about 6e−8 at small ratios and 2.4e−4 at 64. It equals 1 at 4096 and is
  about 6e4 at 10^6 (case E5). The two-pass or Welford form in FP32,
  D·u with D = 4096, is flat at 2.4e−4. A dashed line at 1 marks where the
  computed variance can come out negative.
spec:
  type: line
  x: { label: "|μ| / σ of the row", scale: log10, format: si, domain: [0.1, 10000000] }
  y: { label: "relative error of σ², first order", scale: log10, format: raw }
  variables: { D: 4096 }
  series:
    - { id: one32, label: "one-pass E[x²] − μ², FP32: u·(1 + μ²/σ²)", formula: "2^-24*(1 + x^2)", sample: { from: 0.1, to: 10000000, count: 41 }, emphasis: true }
    - { id: two32, label: "two-pass / Welford, FP32: D·u, D = 4096", formula: "D*2^-24", sample: { from: 0.1, to: 10000000, count: 2 } }
    - { id: one, label: "relative error 1: σ² can go negative", formula: "1", sample: { from: 0.1, to: 10000000, count: 2 }, dashed: true }
  annotations:
    - { x: 64, label: "|μ|/σ ≈ √D: one-pass loses" }
    - { x: 4096, label: "|μ|/σ = 2^12: error ≈ 1" }
    - { x: 1000000, label: "E5: |μ| ≈ 10³, σ² ≈ 10⁻⁶" }
```

<details><summary>Derivation of Eq. 3.9 (recursive case)</summary>
Let s_1 = x_1 and s_k = fl(s_{k−1} + x_k) = (s_{k−1} + x_k)(1 + δ_k), |δ_k| ≤ u. Unrolling, each x_i is multiplied by a product of (n − i) or (n − 1) factors (1 + δ), and |Π(1+δ) − 1| ≤ γ_{n−1}. Bounding each term separately gives the stated inequality. The pairwise case replaces the chain length n − 1 by the tree depth ⌈log₂ n⌉ (R3.7, ch. 4).
</details>

Consequence for tolerances: with u_32 = 2^−24 and n = 4096, γ_n ≈ 2.4e−4 for a recursive FP32 sum, but ≈ 7.2e−7 for a pairwise sum; with u_bf16 = 2^−8 the recursive bound already exceeds 1 at n = 256, which is why BF16 reductions must accumulate in FP32 [MATHEMATICALLY-DERIVED].

For a dot product Σ x_i y_i with x, y stored in BF16 and products and partial sums in FP32, the relative error against Σ|x_i y_i| is bounded by 2u_bf16 (from the two operand roundings, if the operands were rounded from wider values) plus γ_n(u_32) for the accumulation; the first term dominates for n < 2^15 [MATHEMATICALLY-DERIVED]. This is the tolerance basis used in [verification.md](verification.md).

```figure
id: fig-3.10
kind: calculator
title: Dot-product tolerance, operand rounding plus accumulation
caption: >-
  The paragraph's tolerance basis. With BF16 operands and an FP32
  accumulator, the operand term 2·u_bf16 = 2^−7 is 32 times the recursive
  accumulation term at n = 4096. The two meet only at n ≈ 2^17, so at every
  n < 2^15 the operand term is at least four times larger. Switch the
  accumulator to BF16 and the accumulation term is 256 at n = 2^16 (case
  E8). Algorithm 3.4's blocking shrinks only the accumulation term, never the
  operand term.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-3.9"
alt: >-
  Calculator for the dot-product bound 2·u_op + γ_n(u_acc), relative to
  Σ|x_i·y_i|. At n = 4096, BF16 operands (p = 7) and an FP32 accumulator
  (p = 23), block size 128: u_acc ≈ 5.96e−8. Recursive accumulation gives
  2.44e−4 and blocked accumulation 7.93e−6. The operand term is 7.81e−3 and
  the total with recursive accumulation is 8.06e−3. The accumulation term
  equals the operand term at n = 131073. Preset BF16 accumulator at
  n = 65536: accumulation term 256. Preset FP32 operands: operand term
  1.19e−7, total 2.44e−4.
spec:
  tex: >-
    \frac{|\mathrm{fl}(x^{\top}y)-x^{\top}y|}{\sum_i|x_i y_i|}\;\le\;2u_{\text{op}}+\gamma_{n}(u_{\text{acc}})
  equation: "3.9"
  inputs:
    - { symbol: n, label: "reduction length n", default: 4096, min: 64, max: 131072, scale: log2, format: integer }
    - { symbol: pa, label: "accumulator stored mantissa bits", default: 23, min: 7, max: 23, options: [7, 10, 23], format: integer }
    - { symbol: po, label: "operand stored mantissa bits", default: 7, min: 7, max: 23, options: [7, 10, 23], format: integer }
    - { symbol: K, label: "block size K, Algorithm 3.4", default: 128, min: 32, max: 256, options: [32, 64, 128, 256], format: integer }
  outputs:
    - { symbol: ua, label: "u_acc = 2^−(p_acc+1)", formula: "2^-(pa+1)", format: raw }
    - { symbol: rec, label: "accumulation, recursive, (n−1)·u_acc", formula: "(n - 1)*ua", format: raw }
    - { symbol: blk, label: "accumulation, blocked, (K + ⌈log₂(n/K)⌉)·u_acc", formula: "(min(n, K) + ceil(log2(max(n/K, 1)) - 0.000001))*ua", format: raw }
    - { symbol: op, label: "operand roundings, 2·u_op", formula: "2*2^-(po+1)", format: raw }
    - { symbol: tot, label: "bound with recursive accumulation", formula: "op + rec", format: raw, emphasis: true }
    - { symbol: nx, label: "n where (n−1)·u_acc equals 2·u_op", formula: "op/ua + 1", format: raw }
  presets:
    - { label: "E8: BF16 accumulator, n = 2^16", values: { pa: 7, n: 65536 } }
    - { label: "FP32 operands", values: { po: 23 } }
    - { label: "n = 2^16, FP32 accumulator", values: { n: 65536 } }
```

Cost line: max subtraction adds one reduction and one elementwise pass over n values (2n reads at HBM bandwidth if unfused; register-resident if fused); FP32 accumulation of BF16 inputs doubles accumulator register width but not HBM traffic; two-pass variance reads the row twice unless the row fits in on-chip memory, which for D ≤ 16384 in BF16 (32 KiB) it does [DERIVED].

## Algorithm

```text
Algorithm 3.2 — Online (streaming) log-sum-exp and softmax denominator
INPUT   z_1..z_n arriving in blocks; accumulation dtype FP32
OUTPUT  m = max z, l = Σ exp(z_i − m)   (so LSE = m + log l)
STATE   m ← −∞, l ← 0  (FP32)
INVARIANT after processing block k: l = Σ_{i ≤ k} exp(z_i − m), m = max_{i ≤ k} z_i
1  for each block b:
2      m_b ← max(z_i in b); m_new ← max(m, m_b)
3      l ← l · exp(m − m_new) + Σ_{i in b} exp(z_i − m_new)    # rescale old sum
4      m ← m_new
5  return m, l
6  TERMINATION: one pass over n values
```

Complexity: O(n) exp evaluations plus one extra exp per block; the rescaling in line 3 is the identity used by FlashAttention to avoid materializing the T × T score matrix (P19, PAPER-REPORTED). Fully masked rows (all z_i = −∞) leave m = −∞ and l = 0; the caller must define the output (zeros or NaN) explicitly.

```figure
id: fig-3.11
kind: diagram
title: One block of the online log-sum-exp, Algorithm 3.2
caption: >-
  Follow the heavy path. When a block raises the running max, the old sum is
  multiplied by exp(m − m_new) ≤ 1 before the new terms are added. No
  exponent argument is ever positive, and the row never has to be resident.
  Only (m, l) persists between blocks, in FP32. That persistent pair is what
  lets a fused attention kernel keep [B, H, T] statistics instead of a T × T
  matrix. A fully masked row leaves (−∞, 0) and must be defined by the caller.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:alg-3.2", "DERIVED:eq-3.6", P19]
alt: >-
  Diagram of one iteration of Algorithm 3.2. A block of logits z_i (BF16 or
  FP32) feeds a block-max step m_b. It is combined with the running max m to
  give m_new = max(m, m_b). The old sum l is rescaled by exp(m − m_new), which
  is at most 1 (emphasised). The block's terms exp(z_i − m_new) are summed in
  FP32 and added, giving the updated running pair (m, l), initialised to
  (−∞, 0). A feedback edge returns it for the next block. After the last
  block the output is LSE = m + log l (Eq. 3.6). A branch tests for a fully
  masked row, where m = −∞ and l = 0. The caller then defines the output as
  zeros and sets the loss mask to 0. Only [B, H, T] statistics are kept per
  row, no T × T matrix (P19).
spec:
  direction: TB
  nodes:
    - { id: zb, kind: tensor, label: "block b of logits z_i", sub: "BF16 or FP32 storage" }
    - { id: mb, kind: process, label: "block max m_b", sub: "one reduction", group: iter }
    - { id: mnew, kind: process, label: "m_new = max(m, m_b)", sub: "line 2", group: iter }
    - { id: resc, kind: process, label: "rescale the old sum", sub: "l · exp(m − m_new), line 3", group: iter }
    - { id: add, kind: process, label: "sum the block's terms", sub: "Σ exp(z_i − m_new), FP32", group: iter }
    - { id: upd, kind: process, label: "l ← rescaled l + block sum", sub: "m ← m_new, line 4", group: iter }
    - { id: st, kind: state, label: "running pair (m, l)", sub: "FP32; starts at (−∞, 0)" }
    - { id: out, kind: metric, label: "LSE = m + log l", sub: "Eq. 3.6; softmax by Eq. 3.7" }
    - { id: msk, kind: branch, label: "fully masked row?", sub: "m = −∞, l = 0" }
    - { id: def, kind: dependency, label: "caller-defined output", sub: "zeros, loss mask 0 (§3.5)" }
    - { id: mem, kind: memory, label: "no T × T matrix stored", sub: "[B, H, T] statistics per row (P19)" }
  edges:
    - { from: zb, to: mb }
    - { from: mb, to: mnew }
    - { from: st, to: mnew, kind: dependency, label: "old m" }
    - { from: mnew, to: resc, kind: emphasis, label: "exp(m − m_new) ≤ 1" }
    - { from: resc, to: upd, kind: emphasis }
    - { from: zb, to: add, label: "z_i − m_new ≤ 0" }
    - { from: mnew, to: add, kind: dependency }
    - { from: add, to: upd }
    - { from: upd, to: st }
    - { from: st, to: mb, kind: feedback, label: "next block" }
    - { from: st, to: out, label: "after the last block" }
    - { from: st, to: msk }
    - { from: msk, to: def, label: "yes" }
    - { from: st, to: mem, kind: dependency, label: "all that persists" }
  groups:
    - { id: iter, label: "one block, one pass" }
```

```text
Algorithm 3.3 — Two-pass / Welford variance in FP32 for a row of width D
INPUT   x_1..x_D in storage dtype (BF16 or FP32)
OUTPUT  μ, σ² in FP32
STATE   n ← 0, μ ← 0, M2 ← 0  (FP32)
INVARIANT M2 = Σ_{i ≤ n} (x_i − μ_n)²
1  for i = 1..D:
2      n ← n + 1; x ← FP32(x_i)
3      δ ← x − μ; μ ← μ + δ / n; M2 ← M2 + δ · (x − μ)
4  return μ, M2 / D        # (or M2/(D−1) for an unbiased estimate; normalization layers use 1/D)
5  TERMINATION: D steps
```

Complexity: one pass, O(D); the chunked variant merges (n_a, μ_a, M2_a) and (n_b, μ_b, M2_b) with δ = μ_b − μ_a, M2 = M2_a + M2_b + δ² n_a n_b / (n_a + n_b), which is how a parallel kernel combines per-thread partials (R3.10).

```text
Algorithm 3.4 — Blocked (pairwise-style) summation with FP32 accumulation
INPUT   x_1..x_n in storage dtype; block size K (e.g. 128); accumulation dtype FP32
OUTPUT  s ≈ Σ x_i
STATE   partials p_1..p_{⌈n/K⌉} in FP32
INVARIANT each p_j = fl32(Σ of its K elements); s = fl32(Σ_j p_j) by pairwise tree
1  for j = 1..⌈n/K⌉: p_j ← 0; for i in block j: p_j ← p_j + FP32(x_i)
2  while more than one partial: pair adjacent partials and add
3  return s
4  TERMINATION: ⌈log₂ ⌈n/K⌉⌉ + K rounding depth
```

Complexity: O(n); error bound γ_{K + ⌈log₂(n/K)⌉} Σ|x_i| by Eq. 3.9, i.e. O(u(K + log n)) rather than O(u n). Kahan compensated summation (R3.9) achieves O(u) + O(n u²) at 4× the additions and is appropriate for the optimizer update in BF16 storage ([§3.4](03-4-mixed-precision-execution.md)).

## Implementation

Tensors and operators: at the Model / autograd framework layer, PyTorch's autocast policy lists `softmax`, `log_softmax`, `layer_norm`, `cross_entropy`, `exp`, `log`, and `sum` among CUDA ops that autocast to float32 while `matmul`, `linear`, and convolutions autocast to float16/bfloat16, which is precisely the storage-versus-accumulation split of this section [OFFICIAL-DOCUMENTATION — PyTorch 2.14 AMP docs, R3.11, accessed 2026-09-20]. Kernels: at the Kernels / numerics / collectives layer, NVIDIA cuBLAS / cuBLASLt select the accumulation precision by a compute-type argument distinct from the operand types, and PyTorch's `torch.backends.cuda.matmul.allow_bf16_reduced_precision_reduction` — documented as `True` by default for BF16 — permits intermediate reductions in reduced precision, so a program that relies on FP32 accumulation MUST set it to `False` and record that in its manifest [OFFICIAL-DOCUMENTATION — cuBLAS docs R3.13; PyTorch CUDA-semantics page R3.11]. FlashAttention implements Algorithm 3.2 inside the attention tile loop with FP32 running statistics (P19). Memory: an unfused softmax over [B, H, T, T] scores materializes B·H·T² values; the fused form keeps only [B, H, T] statistics. Communication: none on a single device; the same reduction-order argument reappears for all-reduce in [§29.5](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-5-collective-communication.md).

```text
Tensor trace
[B, T, V] logits (BF16) → max over V (FP32) → [B, T, 1]
[B, T, V] − [B, T, 1] → exp (FP32) → sum over V (FP32, blocked) → [B, T, 1]
log-probs = (z − m) − log l  → gather target → [B, T] token losses (FP32) → masked mean (FP32) → scalar
```

## Experimental design

Proposed: Experiment 3.2 in [verification.md](verification.md) evaluates each primitive on (a) ordinary rows drawn from N(0, 1), (b) rows with logits of magnitude 10^4, (c) rows with all entries equal, (d) rows with one finite entry and the rest −∞, (e) normalization rows with σ² ≈ 0 and |μ| ≈ 10^3, and (f) reductions of length 2^16 in BF16 storage; compares against FP64 twins; and asserts the bounds of Eq. 3.9–3.10 with the per-format u of Table 3.1. Independent variable: primitive implementation; controlled: inputs, seeds, device; metric: max relative error against Σ|terms|.

## Observations

**What the paper claims.** P19 reports that computing attention with tiled online softmax in on-chip memory is exact (no approximation) and reduces HBM accesses relative to the standard implementation, with wall-clock speedups on the models it tested [PAPER-REPORTED]. R3.7 states the error bounds of Eq. 3.9 as theorems [MATHEMATICALLY-DERIVED].

**What the evidence shows.** The stability of Eq. 3.6–3.8 is a theorem, not an empirical finding, and holds on any IEEE-compliant device. The speedups of P19 are workload- and hardware-specific and are not re-asserted here.

**What we infer.** Because the recursive BF16 bound exceeds unity at n = 256 while the FP32 pairwise bound stays below 10^−6 at n = 4096, any reduction over d_model, d_ff, T, or V MUST accumulate in FP32 or wider; we treat this as a hard rule of the skeleton rather than a tunable [DERIVED].

**What remains unknown.** The internal blocking and reduction tree of any given cuBLAS / cuBLASLt or cuDNN kernel is NOT-DISCLOSED; the bounds here are therefore upper bounds for the reference implementation, and a vendor kernel may be better or, with reduced-precision reductions enabled, worse.

## Failure modes

> **Failure mode — Softmax overflow.** *Symptom:* inf in probabilities, NaN after normalization. *Cause:* exp evaluated on unshifted logits. *Detection:* max logit exceeds ln x_max of the compute dtype. *Mitigation:* Eq. 3.7.

> **Failure mode — Fully masked row.** *Symptom:* NaN in attention outputs for padded queries. *Cause:* l = 0 in Algorithm 3.2 and 0/0. *Detection:* rows whose mask is all-false. *Mitigation:* define the output for such rows (zero) and exclude them from the loss ([§3.5](03-5-reference-implementation.md)).

> **Failure mode — Negative variance.** *Symptom:* NaN from sqrt in normalization. *Cause:* one-pass E[x²] − μ² under cancellation. *Detection:* σ² < 0 assertion. *Mitigation:* Algorithm 3.3.

> **Failure mode — Swamped reduction.** *Symptom:* the token-mean loss drifts from its FP64 twin by more than γ_n. *Cause:* BF16 accumulation of a long sum, or the reduced-precision-reduction flag left at its default. *Detection:* Experiment 3.2 case (f). *Mitigation:* FP32 accumulation, blocked summation.

## Siblings

**Naive softmax (unshifted)** — this section, baseline. Why it exists: it is the definition. What assumption changed: none. What problem it solved: none. What new failure mode it introduced: overflow at z > ln x_max. Changed primitive: none.

**Max-subtracted softmax** — this section. Why it exists: overflow. What assumption changed: the max is available before the exponentials. What problem it solved: overflow for any finite z. What new failure mode it introduced: an extra reduction pass when unfused. Changed primitive: exp(z) → exp(z − m).

**Online (streaming) softmax** — this section; kernel owned by [§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md). Why it exists: the row does not fit in on-chip memory. What assumption changed: the max may be revised mid-stream. What problem it solved: materialization of the T × T matrix. What new failure mode it introduced: one extra exp per block and a rescaling rounding. Changed primitive: global max → running max with rescaling.

**One-pass variance vs two-pass/Welford** — this section. Why it exists: one-pass reads the row once. What assumption changed: E[x²] ≫ μ² is not guaranteed. What problem it solved: bandwidth. What new failure mode it introduced: cancellation (Eq. 3.10). Changed primitive: Σx² − (Σx)²/D → Σ(x − μ)².

**Recursive vs pairwise vs compensated summation** — this section. Why they exist: error growth O(n u) vs O(u log n) vs O(u). What assumption changed: reduction order is free to choose. What new failure mode it introduced: run-to-run nondeterminism when the order is chosen dynamically ([§3.6](03-6-reproducibility-limits.md)). Changed primitive: sequential add → tree add → compensated add.

```figure
id: fig-3.12
kind: compare
title: Four summation orders on one error axis
caption: >-
  Read the second row. At n = 4096 in FP32 the orders span two and a half
  decades of worst-case error with the same n − 1 additions. Only Kahan's
  scheme pays in arithmetic, about 4× the additions. The skeleton uses the
  blocked form for its reference primitives and the recursive bound for
  vendor kernels whose order it cannot see. Any order chosen dynamically at
  run time is the §3.6 nondeterminism, whatever its bound.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.9", "DERIVED:alg-3.4", R3.9]
alt: >-
  Comparison of recursive, pairwise, blocked (K = 128) and Kahan-compensated
  summation, on worst-case forward error relative to Σ|x_i| for an n-term
  FP32 sum. Bounds: γ_{n−1}, γ_{⌈log₂ n⌉}, γ_{K+⌈log₂(n/K)⌉}, and
  O(u) + O(n·u²). At n = 4096, first order: about 2.4e−4, 7.2e−7 and 7.9e−6.
  Kahan's constant is not derived here. Growth: O(n·u), O(u·log n),
  O(u·(K + log n)), O(u). Additions: n − 1 for the first three, about four
  times as many for Kahan. The order is fixed by the loop index, the tree
  shape, the block size and tree, or the loop index plus a correction term.
  Uses in the chapter: recursive is the bound for framework kernels of
  unknown order (T2b). Blocked is the reference primitive (T2a, Algorithm
  3.4). Kahan is the compensated BF16 optimizer update of §3.4.
spec:
  axis: "Worst-case forward error of an n-term FP32 sum relative to Σ|x_i| (Eq. 3.9), and what each summation order costs"
  columns:
    - { id: rec, label: "Recursive" }
    - { id: pair, label: "Pairwise" }
    - { id: blk, label: "Blocked, K = 128" }
    - { id: kahan, label: "Kahan compensated" }
  rows:
    - { dimension: "bound (Eq. 3.9)", values: { rec: "γ_{n−1}", pair: "γ_{⌈log₂ n⌉}", blk: "γ_{K + ⌈log₂(n/K)⌉}", kahan: "O(u) + O(n·u²)" } }
    - { dimension: "at n = 4096, FP32, first order", values: { rec: "≈ 2.4e−4", pair: "≈ 7.2e−7 (12·u)", blk: "≈ 7.9e−6 (133·u)", kahan: "O(u₃₂); constant not derived here" } }
    - { dimension: "error growth", values: { rec: "O(n·u)", pair: "O(u·log n)", blk: "O(u·(K + log n))", kahan: "O(u)" } }
    - { dimension: "additions", values: { rec: "n − 1", pair: "n − 1", blk: "n − 1", kahan: "≈ 4× (R3.9)" } }
    - { dimension: "order fixed by", values: { rec: "loop index", pair: "tree shape", blk: "block size, then a pairwise tree", kahan: "loop index plus a running correction" } }
    - { dimension: "where the chapter uses it", values: { rec: "bound for framework kernels of unknown order (T2b)", pair: "tree stage inside the blocked form", blk: "reference primitives, Algorithm 3.4 (T2a)", kahan: "compensated BF16 optimizer update (§3.4)" } }
```

## Extensions

Long context makes the attention reduction length T dominate the bound in Eq. 3.9, and the online form becomes mandatory rather than an optimization. For MoE routing, the softmax over experts is short but its argmax is discontinuous; a numerical tie broken differently across devices changes the routing decision, developed in [§20.4](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-4-stability-instrumentation.md). Multimodal encoders with large-magnitude patch embeddings need the same FP32 statistics (proposal).

## Limitations

Bounds assume IEEE round-to-nearest and no fast-math flushing; with `-ftz=true` subnormal partial products vanish and the bounds no longer hold below x_min^norm [OFFICIAL-DOCUMENTATION — NVIDIA CUDA floating-point docs, R3.25]. Falsification: an observed error above the stated bound on an in-range fixture with reduced-precision reductions disabled. Decision consequence: any fused or vendor kernel replacing these primitives must be checked against the FP64 twin before it enters the skeleton.

## Reproducibility

The primitives are defined by equations and are version-independent; their framework twins depend on autocast policy and reduction flags, which the manifest of [§3.6](03-6-reproducibility-limits.md) records. Unresolved: vendor kernel reduction trees (NOT-DISCLOSED).

## References

P19; R3.7, R3.9, R3.10, R3.11, R3.13, R3.20, R3.21, R3.25.
