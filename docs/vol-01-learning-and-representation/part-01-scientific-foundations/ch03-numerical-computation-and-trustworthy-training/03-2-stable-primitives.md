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
word_count_target: 2300
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 3.2 Stable primitives

## Scope

This section reconstructs log-sum-exp, softmax, normalization statistics, reduction order, accumulation dtype, and cancellation as numerical algorithms. Its baseline is direct evaluation in the input storage dtype. Success means that the algorithm's domain, exceptional rows, error metric, and accumulation policy are explicit. A sum bound is established under stated arithmetic conditions; a whole-model tolerance is not inferred from that bound. Attention kernel scheduling belongs to [§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md).

## Why this exists

Algebraically equivalent formulas can have different floating-point behavior. Blanchard, Higham, and Higham analyze direct, shifted, and division-free softmax and show that removing division does not establish better accuracy. Their experiments isolate numerical evaluation on logits rather than retraining the network [PAPER-REPORTED — R3.26 §§3–5]. The relevant improvement is consequently a changed evaluation algorithm with stated conditions, rather than a blanket rule to cast every tensor wider.

## Intuition

A reduction loses information at intermediate sums; the effect depends on the size of those partial sums relative to the final answer. A max shift bounds exponential arguments above by zero. Centering before squaring avoids subtracting two large second moments. Neither operation recovers differences already erased when the input was quantized. The comparison must distinguish error against exact real inputs from arithmetic error on the same stored inputs [MATHEMATICALLY-DERIVED — the decomposition $\widehat f(\widehat x)-f(x)=[\widehat f(\widehat x)-f(\widehat x)]+[f(\widehat x)-f(x)]$].

## Formulation

For a nonempty finite row $z\in\mathbb R^n$, let $m=\max_i z_i$ and $\ell=\sum_i e^{z_i-m}$:

$$
\operatorname{LSE}(z)=m+\log\ell,\qquad 1\le\ell\le n.
$$
*(Eq. 3.6)* [MATHEMATICALLY-DERIVED — factoring $e^m$ from the exact exponential sum].

$$
p_i=\frac{e^{z_i-m}}{\ell},\qquad \log p_i=(z_i-m)-\log\ell.
$$
*(Eq. 3.7)* The log expression avoids materializing a tiny probability before taking its logarithm. Computing $e^{z_i-\operatorname{LSE}(z)}$ is an algebraically equivalent probability formula with a different rounding path; it is not the preferred log-probability algorithm [MATHEMATICALLY-DERIVED].

For a row $x\in\mathbb R^d$,

$$
\mu=\frac1d\sum_i x_i,\quad v=\frac1d\sum_i(x_i-\mu)^2,\quad
r=\sqrt{\frac1d\sum_i x_i^2+\epsilon_{\rm norm}}.
$$
*(Eq. 3.8)* $\epsilon_{\rm norm}>0$ is the normalization stabilizer, distinct from machine epsilon. LayerNorm uses centered variance; RMSNorm uses the uncentered second moment. Their architectural effects belong to [§5.1](../ch05-minimal-transformer-and-execution-trace/05-1-end-to-end-forward-pass.md) [PAPER-REPORTED — R3.21 Eq. (3); R3.20 Eq. (4)].

For summation in precision $u$, with no overflow or underflow and correctly rounded additions,

$$
|\widehat s-s|\le\gamma_{n-1}\sum_i|x_i|\ \text{(recursive)},\qquad
|\widehat s-s|\le\gamma_{\lceil\log_2n\rceil}\sum_i|x_i|\ \text{(balanced tree)},\quad
\gamma_k=\frac{ku}{1-ku},\ ku<1.
$$
*(Eq. 3.9)* [MATHEMATICALLY-DERIVED — the product-of-rounding-factors derivation below].

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
  - { anchor: mechanism, label: "BF16 accumulator, n = 256", variables: { x: 256 }, highlight: [rec16, one], note: "With u = 2^−8 the recursive bound reaches (n − 1)·u ≈ 1 at n = 256, so no digit is guaranteed. The reference recipe uses FP32 accumulation." }
  - { anchor: algorithm, label: "blocked, K = 128", variables: { x: 4096 }, highlight: [blk32], note: "Algorithm 3.4: K + ⌈log₂(n/K)⌉ = 133 roundings deep at n = 4096, a bound of ≈ 7.9e−6, 31 times below the recursive sum." }
  - { anchor: failure-modes, label: "swamped, n = 2^16", variables: { x: 65536 }, highlight: [rec16, rec32], note: "Case E8: at n = 65536 the BF16 first-order proxy is 256; the — theorem is inapplicable. FP32 recursive is ≈ 3.9e−3. This is the 'swamped reduction' failure mode." }
  - { anchor: siblings, label: "three orders at n = 2^16", variables: { x: 65536 }, highlight: [rec32, blk32, pair32], note: "Recursive, blocked and pairwise at n = 2^16 give 3.9e−3, 8.2e−6 (137·u) and 9.5e−7 (16·u). Kahan summation (not drawn) is O(u) + O(n·u²)." }
```

If $\widehat a=a(1+\delta_a)$ and $\widehat b=b(1+\delta_b)$ with $|\delta_a|,|\delta_b|\le\eta$, subtraction gives

$$
\frac{|\operatorname{fl}(\widehat a-\widehat b)-(a-b)|}{|a-b|}
\le\eta(1+u)\frac{|a|+|b|}{|a-b|}+u,\qquad a\ne b.
$$
*(Eq. 3.10)* [MATHEMATICALLY-DERIVED — first bound input perturbation by $\eta(|a|+|b|)$, then include final rounding]. Exact cancellation has no finite relative-error denominator; use absolute error there.

## Mechanism

### Methodology

For log-sum-exp, compute the row maximum, subtract it in a sufficiently wide format, exponentiate the shifted values, sum in an explicit accumulator format, and combine $m$ with the logarithm. With $\ell=1+\sum_{i\ne i_*}e^{z_i-m}$, `log1p` preserves small corrections when the dominant term is one. For cross-entropy, evaluate the target log-probability by Eq. 3.7 directly. Underflow of very small exponential terms can be harmless for an absolute probability error but is not harmless if a later computation needs their logarithms [MATHEMATICALLY-DERIVED — Eq. 3.6–3.7].

The finite-row precondition matters. If every entry is $-\infty$, the shift attempts $-\infty-(-\infty)$; if an entry is $+\infty$, subtracting the maximum can also yield NaN. A masked attention implementation must identify rows with no allowed keys before subtraction, use a finite placeholder row internally, and return its specified zero output. Multiplying a NaN by a zero loss mask afterward is not a repair. Even finite inputs near opposite representable extremes can overflow in their subtraction, so max shifting alone is not a universal guarantee over the full floating input domain [MATHEMATICALLY-DERIVED].

For reduction, unroll $\widehat s_k=(\widehat s_{k-1}+x_k)(1+\delta_k)$. Each term is multiplied by a product of at most $n-1$ factors, bounded by $\gamma_{n-1}$ when $(n-1)u<1$. In a balanced tree each leaf traverses at most $\lceil\log_2n\rceil$ rounded additions. Blocking $K$ consecutive elements and combining their partial sums with a balanced tree gives rounding depth at most $K-1+\lceil\log_2\lceil n/K\rceil\rceil$. These are bounds relative to $\sum|x_i|$; division by $|\sum x_i|$ introduces the summation condition number [MATHEMATICALLY-DERIVED — Eq. 3.9].

Two-pass variance computes the mean first, then the sum of squared deviations. It removes the explicit subtraction $E[x^2]-\mu^2$, but mean error and input quantization still matter. In exact arithmetic, if $\widehat\mu=\mu+e_\mu$, then $d^{-1}\sum_i(x_i-\widehat\mu)^2=v+e_\mu^2$ because centered deviations sum to zero. Thus mean error is second order in this identity, while an almost constant quantized row may have already lost its true variance. RMS statistics also need range control: FP32 accumulation does not prevent an FP32 square from overflowing. Scaling by the maximum magnitude before squaring supplies a separate range-safe norm construction [MATHEMATICALLY-DERIVED].

```figure
id: fig-3.9
kind: chart
title: Cancellation sensitivity and an illustrative two-pass scale
caption: >-
  A first-order sensitivity illustration, not a certified relative-error bound. The one-pass error u·E[x²]/σ² = u·(1 + μ²/σ²) grows
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
  about 6e4 at 10^6 (case E5). An illustrative two-pass reference scale,
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

For a dot product, first fix the reference boundary. Against the exact sum of stored operands, the arithmetic bound uses accumulator roundoff and product rounding. Against wider unrounded operands, add representation error. With normal nearest-rounded operands and a serial correctly rounded FMA accumulator, one sufficient bound is $[(1+u_{\rm op})^2(1+\gamma_n(u_{\rm acc}))-1]\sum|x_i y_i|$, before any output rounding. The popular $2u_{\rm op}+nu_{\rm acc}$ is its first-order expansion, not a universal hard threshold [MATHEMATICALLY-DERIVED — composing operand and accumulation perturbations].

```figure
id: fig-3.10
kind: calculator
title: Dot-product first-order error terms, not a hard tolerance
caption: >-
  The paragraph's tolerance basis. With BF16 operands and an FP32
  accumulator, the operand term 2·u_bf16 = 2^−7 is 32 times the recursive
  accumulation term at n = 4096. The two meet only at n ≈ 2^17, so at every
  n < 2^15 the operand term is at least four times larger. Switch the
  accumulator to BF16 and the first-order proxy is 256; — bound inapplicable at n = 2^16 (case
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
    \frac{|\mathrm{fl}(x^{\top}y)-x^{\top}y|}{\sum_i|x_i y_i|}\;\approx\;2u_{\text{op}}+\gamma_{n}(u_{\text{acc}})
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
    - { symbol: tot, label: "first-order proxy with recursive accumulation", formula: "op + rec", format: raw, emphasis: true }
    - { symbol: nx, label: "n where (n−1)·u_acc equals 2·u_op", formula: "op/ua + 1", format: raw }
  presets:
    - { label: "E8: BF16 accumulator, n = 2^16", values: { pa: 7, n: 65536 } }
    - { label: "FP32 operands", values: { po: 23 } }
    - { label: "n = 2^16, FP32 accumulator", values: { n: 65536 } }
```

**Resource boundary.** Max-shifted evaluation requires $O(n)$ arithmetic and one maximum and one sum reduction. Two-pass variance is $O(d)$ work and two logical traversals; Welford is one traversal with a dependency chain. A balanced tree performs $n-1$ additions and exposes logarithmic parallel depth; a blocked implementation stores $O(\lceil n/K\rceil)$ partials. Wider accumulators consume registers without necessarily doubling HBM payload. Communication is absent on one device. Latency and bandwidth depend on fusion and residency; energy and money are NOT-DISCLOSED, not proportional by theorem to addition count [MATHEMATICALLY-DERIVED].

## Algorithm

```text
Algorithm 3.2 — Online shifted exponential sum with empty-block handling
OUTPUT  running maximum and rescaled exponential denominator
INPUT bounded blocks of finite allowed logits, or a block with no allowed entries
STATE m = -infinity, ell = 0, seen = false
INVARIANT in exact arithmetic ell sums all processed allowed exp(z_i-m).
1. For each block, skip it if it has no allowed entries.
2. Compute m_block from allowed entries only.
3. If not seen: m = m_block; ell = sum exp(z_i-m); seen = true.
4. Otherwise set m_new = max(m,m_block).
5. Set ell = ell*exp(m-m_new) + sum exp(z_i-m_new); m = m_new.
6. If not seen return EmptyRow; otherwise return (m,ell).
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: O(n) work, O(1) running state; output probabilities need storage or rereading
```

A streaming denominator does not itself output every probability in one pass: probabilities need stored logits, a second read, or fusion with the weighted numerator. FlashAttention uses the last option [PAPER-REPORTED — P19 Algorithm 1].

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
Algorithm 3.3 — Welford centered sum of squares (one pass)
OUTPUT  mean and centered sum of squares
INPUT finite x[1:d], d >= 1; explicit accumulation dtype
STATE count = 0, mean = 0, M2 = 0
INVARIANT in exact arithmetic M2 = sum_{i<=count}(x_i-mean)^2.
1. For each x_i: count += 1; delta = x_i - mean.
2. Set mean += delta/count; M2 += delta*(x_i-mean).
3. Return mean and M2/d.
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: O(n) work and O(1) running state
```

The parallel merge of two nonempty states uses $\delta=\mu_b-\mu_a$, $\mu=\mu_a+\delta n_b/(n_a+n_b)$, and $M_2=M_{2,a}+M_{2,b}+\delta^2n_an_b/(n_a+n_b)$. Expanding each group's squared deviations around the combined mean proves the identity. Empty states need a separate identity branch [MATHEMATICALLY-DERIVED].

```text
Algorithm 3.4 — Bounded blocked reduction
OUTPUT  scalar blocked/tree sum
STATE  block partials and balanced-tree buffers
INPUT x[1:n], n >= 1, integer block size K >= 1
INVARIANT each tree node owns a disjoint input interval.
1. Cast each operand to the declared accumulator dtype.
2. Reduce each consecutive block of at most K values recursively.
3. Combine block partials with a fixed balanced tree; carry an unpaired partial.
4. Return the last partial, checking exceptional values separately.
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: O(n) work; O(ceil(n/K)) auxiliary partials
```

## Implementation

PyTorch (**Model / autograd framework**) documents operator-specific autocast policies; in-place and `out=` operations can bypass autocast eligibility. Therefore `autocast` is not a command to execute an entire program in one dtype [OFFICIAL-DOCUMENTATION — R3.34, "Op Eligibility"]. NVIDIA cuBLAS / cuBLASLt (**Kernels / numerics / collectives**) expose compute modes separately from storage types [OFFICIAL-DOCUMENTATION — R3.13]. PyTorch 2.14 documents that disabling reduced-precision reduction with a Boolean still permits split-K; the tuple form also controls split-K [OFFICIAL-DOCUMENTATION — R3.33]. Neither switch reveals an undocumented reduction tree.

## Experimental design

### Reported experiments

Blanchard et al. extract 2,500 ten-dimensional pre-softmax vectors from a trained MNIST network, convert the inputs to FP16 or BF16, simulate their arithmetic using `chop`, and compare direct, shifted, and division-free algorithms against an FP32 reference. They measure both function error and deviation of probability sums from one [PAPER-REPORTED — R3.26 §5, Figures 5.1–5.4].

RMSNorm's translation study compares RNNSearch with LayerNorm, RMSNorm, partial RMSNorm, and an L2 normalization variant on WMT14 English–German, with newstest2014/2017 evaluation. Timings use one TITAN X Pascal, averaged over three runs with standard deviation, and count seconds per 1,000 training steps [PAPER-REPORTED — R3.20 §6.1, Table 2, Appendix A.1]. These architectural experiments do not isolate accumulation dtype.

## Observations

**What the paper claims.** Direct FP16 log-sum-exp overflows on 475 of the 2,500 extracted vectors; shifted evaluation does not. Division-free softmax can lose accuracy [PAPER-REPORTED — R3.26 §5].

**What the evidence shows.** The RMSNorm comparison reports 501±11.8 seconds versus LayerNorm's 665±32.5 seconds per 1,000 RNNSearch training steps; these values concern the specified implementation and model [PAPER-REPORTED — R3.20 Table 2].

**What we infer.** A sum bound only certifies the counted additions under its premises. It cannot certify `exp`, `log`, normalization, or a composed network without their own error and conditioning terms [MATHEMATICALLY-DERIVED].

**What remains unknown.** Internal vendor reduction trees, independent replication here, and per-device speed transfers are UNVERIFIED. Missing seed-level accuracy uncertainty is NOT-DISCLOSED for the cited RMSNorm table.

## Failure modes

Naive exponentiation overflows; all-masked subtraction creates NaN; subtracting large moments can yield negative variance; low-precision accumulation can swamp small terms; squaring can overflow before accumulation. Each symptom belongs to a different operation boundary. Wider summation repairs only the accumulation failure. The reference must preserve the same stored inputs when localizing the boundary [MATHEMATICALLY-DERIVED].

## Siblings

[Direct, shifted, and online softmax](03-2-stable-primitives.md#mechanism) differ in range safety, traversal, and state. [Two-pass and Welford variance](03-2-stable-primitives.md#algorithm) differ in reads and serial dependency; they are not names for the same procedure. [Recursive, pairwise, and blocked sums](03-2-stable-primitives.md#formulation) exchange dependency depth and storage. Compensated summation carries an error residual and needs extra arithmetic; no universal optimizer convergence gain is inferred from its sum-error advantage.

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

### Improvements

FlashAttention combines the online maximum/denominator with a rescaled weighted numerator, so attention can consume tiles without materializing every score and probability. This is an I/O improvement of exact real-arithmetic attention; finite-precision outputs may differ. The tiled algorithm and backward recomputation are supported by P19 §§3.1–3.2 and Algorithms 1–2 [PAPER-REPORTED]. Its kernel schedule and benchmark comparisons are owned by §27.1, preventing a speed result from substituting for this section's numerical proof.

## Limitations

Normal-range nearest-rounding sum bounds require $ku<1$. When that fails, the stated $\gamma_k$ bound is unavailable; a negative denominator is not an error estimate. Two-pass variance and max shifting improve specific mechanisms but do not establish exact arithmetic, unlimited range, or whole-training stability [MATHEMATICALLY-DERIVED].

## Reproducibility

Use identical rounded operands for arithmetic-only comparisons and unrounded operands for a separate representation comparison. Record operation order, accumulation format, math-library approximation settings, TF32, split-K, subnormal mode, masking policy, and the reference precision. Source-reported experiments and the unexecuted book protocol remain separate in [verification.md](verification.md).

## References

P19; R3.7, R3.9, R3.10 (historical candidates only); R3.33–R3.34; R3.13; R3.20–R3.21; R3.25–R3.26. Exact inspected locators are in [references.md](references.md).
