---
id: ms.section.3.1
entity_type: section
title: Numeric representations
short_title: Numeric formats
volume: 1
part: 1
chapter: 3
section: 3.1
slug: 03-1-numeric-representations
parent: ms.chapter.3
prev_sibling: null
next_sibling: ms.section.3.2
children: []
prerequisites: [ms.section.1.5, ms.section.2.1]
downstream: [ms.section.3.2, ms.section.3.4, ms.section.25.2, ms.section.40.1, ms.section.42.4]
related: [ms.section.40.4]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: implemented_by, target: impl.nvidia-transformer-engine}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, inference], mechanism: [numerical_representation], feedback_setting: [], modality: [text]}
papers: [P13]
implementations: [impl.nvidia-transformer-engine, impl.pytorch, impl.nvidia-cublas-cublaslt]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 3.1 Numeric representations

## Scope

The numerical representation contract specifies which real values a tensor can encode, how conversion rounds them, which exceptional values exist, and which metadata is required to decode them. FP32 is the working baseline; FP64 is a reference format, not exact arithmetic. This section owns FP32, FP16, BF16, FP8, FP4, integer encodings, range, precision, rounding, overflow, and underflow. Scaling algorithms belong to [§3.4](03-4-mixed-precision-execution.md); calibrated inference quantization belongs to [§40.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-1-quantization-formulation.md).

## Why this exists

A dtype name specifies storage but does not establish the arithmetic used by an operator. PyTorch documents separate controls for FP32 matmul precision and reduced-precision intermediate reductions; cuBLAS separates operand types from compute type. Consequently, an FP32 output tensor does not establish that every input bit or intermediate partial sum was retained [OFFICIAL-DOCUMENTATION — R3.33, "TensorFloat-32" and "Reduced Precision Reduction"; R3.13, compute-type enumeration]. The question is which numerical information is lost at each boundary, and whether the resulting operation remains acceptable for its task.

## Intuition

In a binary normal number, the exponent selects a binade and the significand selects a uniform grid inside it. The spacing doubles at each positive binade boundary. A fixed relative update therefore confronts approximately fixed relative resolution, while an absolute update can disappear as its parameter grows. Subnormals use a fixed absolute grid without the implicit leading one; their relative accuracy deteriorates toward zero. These are properties of encodings, not empirical claims about convergence [MATHEMATICALLY-DERIVED — Eq. 3.1–3.3].

## Formulation

Let $p$ denote stored fraction bits, $w$ exponent bits, $e$ the encoded exponent, $m$ the encoded fraction, and $s\in\{0,1\}$ the sign. For conventional IEEE-style normal encodings,

$$
x=(-1)^s2^{e-\beta}(1+m2^{-p}),\quad \beta=2^{w-1}-1,\quad 1\le e\le2^w-2.
$$
*(Eq. 3.1)* [MATHEMATICALLY-DERIVED — decoding the sign, exponent, and fraction fields; IEEE text itself remains uninspected, R3.1].

The spacing above one and the round-to-nearest relative bound are different quantities:

$$
\varepsilon_{\rm mach}=2^{-p},\qquad u=2^{-(p+1)},\qquad |\operatorname{RN}(x)-x|\le u|x|.
$$
*(Eq. 3.2)* The last inequality requires a finite normal-range exact result and nearest rounding without overflow. It is not a bound for arbitrary composite operators or transcendental library implementations [MATHEMATICALLY-DERIVED — half a grid interval in each binade].

$$
x_{\max}=(2-2^{-p})2^{e_{\max}},\qquad x_{\min}^{\rm norm}=2^{1-\beta},\qquad x_{\min}^{\rm sub}=2^{1-\beta-p}.
$$
*(Eq. 3.3)* Here $e_{\max}=2^w-2-\beta$ for the conventional encoding. E4M3 and E2M1 require their explicitly defined top exponent patterns [MATHEMATICALLY-DERIVED — Eq. 3.1; OFFICIAL-DOCUMENTATION for the format-specific patterns is supplied separately below].

```figure
id: fig-3.3
kind: stat-panel
title: Format anatomy from Eq. 3.1–3.3
caption: >-
  Each row evaluates Eq. 3.1–3.3 from two numbers, w and p. The instrument
  steps through five formats as the section argues. FP32 is the working
  format. FP16 has the underflow gap. BF16 has FP32's range but loses updates.
  E4M3 carries finite values in its top exponent code. E5M2 keeps FP16's
  range for gradients. Compare u (precision) with the binade count (range).
  Extremes are shown as log₂ so FP32 and BF16 stay readable. The flag ext = 1
  models E4M3's top exponent code carrying finite values, with one NaN
  mantissa pattern.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.1", "DERIVED:eq-3.2", "DERIVED:eq-3.3", R3.2]
alt: >-
  Instrument panel computing format constants from exponent bits w, stored
  mantissa bits p, and an E4M3 flag ext. FP32 (w = 8, p = 23): 32 bits,
  bias 127, ε = 2^−23 ≈ 1.19e−7, u ≈ 5.96e−8, log₂ x_max ≈ 128, smallest
  normal 2^−126, smallest subnormal 2^−149, 277 binades, ln x_max ≈ 88.72.
  FP16 (5, 10): bias 15, ε ≈ 9.77e−4, u ≈ 0.0488 %, log₂ x_max ≈ 15.999
  (65504), normals to 2^−14, subnormals to 2^−24, 40 binades, ln x_max ≈
  11.09. BF16 (8, 7): bias 127, ε = 2^−7, u ≈ 0.391 %, log₂ x_max ≈ 127.994,
  normals to 2^−126, subnormals to 2^−133, 261 binades, ln x_max ≈ 88.72.
  E4M3 (4, 3, ext = 1): bias 7, u = 6.25 %, x_max = 448 (log₂ ≈ 8.807),
  normals to 2^−6, subnormals to 2^−9, 17.8 binades, ln x_max ≈ 6.10. E5M2
  (5, 2): bias 15, u = 12.5 %, x_max = 57344 (log₂ ≈ 15.807), normals to
  2^−14, subnormals to 2^−16, 31.8 binades, ln x_max ≈ 10.96.
spec:
  header: "FORMAT ANATOMY · EQ. 3.1–3.3"
  variables: { w: 8, p: 23, ext: 0 }
  rows:
    - { key: "bits, 1 + w + p", formula: "1 + w + p", format: integer }
    - { key: "bias β = 2^(w−1) − 1", formula: "2^(w-1) - 1", format: integer }
    - { key: "ε = 2^−p", formula: "2^-p", format: raw }
    - { key: "u = ε/2, worst RN error", formula: "2^-(p+1)", format: percent }
    - { key: "log₂ x_max", formula: "log2(2 - (1 + ext)*2^-p) + 2^w - 2 - (2^(w-1) - 1) + ext", format: fixed3 }
    - { key: "log₂ x_min^norm = 1 − β", formula: "2 - 2^(w-1)", format: integer }
    - { key: "log₂ x_min^sub = 1 − β − p", formula: "2 - 2^(w-1) - p", format: integer }
    - { key: "binades, x_min^sub to x_max", formula: "log2(2 - (1 + ext)*2^-p) + 2^w - 2 - (2^(w-1) - 1) + ext - (2 - 2^(w-1) - p)", format: fixed1 }
    - { key: "ln x_max: unshifted exp overflows", formula: "ln(2 - (1 + ext)*2^-p) + (2^w - 2 - (2^(w-1) - 1) + ext)*ln(2)", format: fixed2 }
states:
  - { anchor: formulation, label: "FP32 · 1-8-23", variables: { w: 8, p: 23, ext: 0 }, highlight: ["ε = 2^−p", "u = ε/2, worst RN error"], note: "Eq. 3.1–3.3 for the working format: β = 127, ε = 2^−23 ≈ 1.19e−7, u ≈ 5.96e−8, and 277 binades from 2^−149 to about 2^128." }
  - { anchor: mechanism, label: "FP16 · 1-5-10", variables: { w: 5, p: 10, ext: 0 }, highlight: ["log₂ x_min^norm = 1 − β", "log₂ x_min^sub = 1 − β − p", "ln x_max: unshifted exp overflows"], note: "Table 3.1's FP16 row: normals stop at 2^−14 ≈ 6.1e−5 and subnormals at 2^−24. Subnormals retain reduced absolute precision; flushing is operator-specific. x_max = 65504, so exp overflows past ln 65504 ≈ 11.09." }
  - { anchor: observations, label: "BF16 · 1-8-7", variables: { w: 8, p: 7, ext: 0 }, highlight: ["u = ε/2, worst RN error", "log₂ x_max"], note: "FP32's exponent with 7 stored bits: u = 2^−8 ≈ 0.39 %. The local half-spacing determines which updates round away, which is the inference that motivates FP32 master weights." }
  - { anchor: failure-modes, label: "E4M3 · 1-4-3", variables: { w: 4, p: 3, ext: 1 }, highlight: ["log₂ x_max", "u = ε/2, worst RN error"], note: "The top exponent code holds finite values, so x_max = 1.75·2^8 = 448 and u = 6.25 %. A value beyond 448/scale becomes NaN unless the conversion saturates." }
  - { anchor: siblings, label: "E5M2 · 1-5-2", variables: { w: 5, p: 2, ext: 0 }, highlight: ["binades, x_min^sub to x_max", "log₂ x_min^sub = 1 − β − p"], note: "E5M2 keeps FP16's five exponent bits (x_max 57344, subnormals to 2^−16, about 32 binades) for gradients, at u = 12.5 %." }
```

| Format | Sign / exponent / fraction | $u$ | Largest finite magnitude | Smallest normal | Smallest encoded subnormal |
|---|---|---|---|---|---|
| FP32 | 1 / 8 / 23 | $2^{-24}$ | $(2-2^{-23})2^{127}$ | $2^{-126}$ | $2^{-149}$ |
| FP16 | 1 / 5 / 10 | $2^{-11}$ | 65504 | $2^{-14}$ | $2^{-24}$ |
| BF16 | 1 / 8 / 7 | $2^{-8}$ | $(2-2^{-7})2^{127}$ | $2^{-126}$ | $2^{-133}$ |
| FP8 E4M3 | 1 / 4 / 3 | $2^{-4}$ | 448 | $2^{-6}$ | $2^{-9}$ |
| FP8 E5M2 | 1 / 5 / 2 | $2^{-3}$ | 57344 | $2^{-14}$ | $2^{-16}$ |
| FP4 E2M1 | 1 / 2 / 1 | $2^{-2}$ | 6 | 1 | 0.5 |

*Table 3.1 — Encoding constants. FP32/FP16/BF16 entries are derived from Eq. 3.1–3.3; actual subnormal execution remains operator-specific [MATHEMATICALLY-DERIVED]. FP8 patterns are reported in R3.2 Table 1 [PAPER-REPORTED]. E2M1 patterns are specified in R3.6 §5.3.3, Table 5 [OFFICIAL-DOCUMENTATION].*

For a block of $n_b$ elements represented by one scale $s_{\rm blk}$ and codes $q_i$,

$$
x_i\approx s_{\rm blk}q_i,\qquad b_{\rm effective}=\frac{\operatorname{bits}(q)}8+\frac{\operatorname{bits}(s)}{8n_b}.
$$
*(Eq. 3.4)* This counts payload and scale bytes before alignment, padding, transpose copies, global scales, and allocator overhead [MATHEMATICALLY-DERIVED].

```figure
id: fig-3.4
kind: calculator
title: Bits per element of a block-scaled format
caption: >-
  Eq. 3.4's storage rule. The shared scale adds bits(s)/n_b to every element,
  so halving the block doubles the overhead. The presets are the configurations
  the section cites. MXFP8 and MXFP4 have an E8M0 scale per 32 elements
  (R3.5). NVFP4 has an E4M3 scale per 16 (R3.12). Against BF16 storage, MXFP8
  keeps 51.6 % of the bytes rather than 50 %.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.4", R3.5, R3.12]
alt: >-
  Calculator for Eq. 3.4, bits per element = bits(q) + bits(s)/n_b. At the
  MXFP8 default (8-bit E4M3 elements, 8-bit E8M0 scale, block of 32) each
  element costs 8.25 bits. The scale overhead is 0.25 bit, the storage is
  51.6 % of BF16, and 2^20 elements take 1.03 MiB. MXFP4 (4-bit elements,
  block 32) costs 4.25 bits, 26.6 % of BF16. NVFP4 (4-bit elements, 8-bit
  scale per 16) costs 4.5 bits, 0.5 bit of overhead, 28.1 % of BF16. A 6-bit
  MX element costs 6.25 bits.
spec:
  tex: >-
    x_i \approx s_{\text{blk}}\, q_i,\qquad \text{bits/element} = \mathrm{bits}(q) + \frac{\mathrm{bits}(s)}{n_b}
  equation: "3.4"
  inputs:
    - { symbol: q, label: "element bits, bits(q)", default: 8, min: 4, max: 8, options: [4, 6, 8], format: integer }
    - { symbol: s, label: "scale bits, bits(s)", default: 8, min: 8, max: 32, options: [8, 32], format: integer }
    - { symbol: nb, label: "block size n_b", default: 32, min: 16, max: 128, options: [16, 32, 64, 128], format: integer }
    - { symbol: N, label: "elements in the tensor", default: 1048576, min: 1024, max: 1073741824, scale: log2, format: integer }
  outputs:
    - { symbol: bpe, label: "bits per element, bits(q) + bits(s)/n_b", formula: "q + s/nb", format: raw, emphasis: true }
    - { symbol: ovh, label: "scale overhead per element, bits", formula: "s/nb", format: raw }
    - { symbol: rel, label: "storage relative to BF16 (16 bits)", formula: "bpe/16", format: percent }
    - { symbol: M, label: "bytes for N elements", formula: "N*bpe/8", format: bytes }
  presets:
    - { label: "MXFP4: E2M1 + E8M0 per 32", values: { q: 4, s: 8, nb: 32 } }
    - { label: "NVFP4: FP4 + E4M3 per 16", values: { q: 4, s: 8, nb: 16 } }
    - { label: "MX 6-bit element per 32", values: { q: 6, s: 8, nb: 32 } }
```
```figure
id: fig-3.5
kind: hierarchy
title: The precision ladder of Table 3.1
caption: >-
  Precision descends one rung at a time, and range does not follow it. BF16
  sits below FP16 in precision but has FP32's exponent. E5M2 sits below E4M3
  in precision but spans about 32 binades against E4M3's 18. Every rung below FP32
  is used in this chapter only with FP32 accumulation, an FP32 master copy,
  or a scale. The emphasised rung is the one everything else is checked
  against on the device. The E2M1 constants are derived, not read from the OCP
  specification (UNVERIFIED).
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.2", "DERIVED:eq-3.3", R3.2, R3.5]
alt: >-
  Eight levels from most to least precise, with sign-exponent-mantissa layout,
  bytes per value and ε. FP64, 1-11-52, 8 bytes, ε 2.22e−16: the reference for
  FP64 twins and the finite-difference check. FP32, 1-8-23, 4 bytes, ε 1.19e−7:
  the working format, master weights and accumulation (emphasised). TF32,
  1-8-10, 19 of 32 bits used, ε 9.77e−4: a matmul input mode, not storage.
  FP16, 1-5-10, 2 bytes, ε 9.77e−4: x_max 65504 and smallest normal 2^−14,
  so it needs loss scaling. BF16, 1-8-7, 2 bytes, ε 7.81e−3: FP32's range,
  updates below 2^−8·|w| lost without a master. FP8 E4M3, 1-4-3, 1 byte,
  ε 0.125: x_max 448, no infinity, weights and activations with a scale. FP8
  E5M2, 1-5-2, 1 byte, ε 0.25: x_max 57344, gradients. FP4 E2M1, 1-2-1, half a
  byte, ε 0.5: x_max 6, the MXFP4 block element.
spec:
  direction: down
  levels:
    - { label: "FP64 · 1-11-52", kind: tensor, capacity: "8 B · ε = 2^−52 ≈ 2.22e−16", note: "reference: FP64 twins and the finite-difference check (§3.3)" }
    - { label: "FP32 · 1-8-23", kind: tensor, capacity: "4 B · ε = 2^−23 ≈ 1.19e−7", note: "working format; master weights, accumulation, normalization statistics", emphasis: true }
    - { label: "TF32 · 1-8-10 (compute input)", kind: process, capacity: "19 of 32 bits · ε ≈ 9.77e−4", note: "FP32 range with FP16 precision; a matmul input mode, not a storage format" }
    - { label: "FP16 · 1-5-10", kind: tensor, capacity: "2 B · ε = 2^−10 ≈ 9.77e−4", note: "x_max 65504, x_min^norm 2^−14: gradients underflow without loss scaling (§3.4)" }
    - { label: "BF16 · 1-8-7", kind: tensor, capacity: "2 B · ε = 2^−7 ≈ 7.81e−3", note: "FP32's range; updates below 2^−8·|w| are lost without an FP32 master" }
    - { label: "FP8 E4M3 · 1-4-3", kind: tensor, capacity: "1 B · ε = 0.125", note: "x_max 448, no ∞; weights and activations, with a scale (R3.2)" }
    - { label: "FP8 E5M2 · 1-5-2", kind: tensor, capacity: "1 B · ε = 0.25", note: "x_max 57344, IEEE ∞ and NaN; gradients (R3.2)" }
    - { label: "FP4 E2M1 · 1-2-1", kind: tensor, capacity: "0.5 B · ε = 0.5", note: "x_max 6.0; element of MXFP4 blocks (R3.5); OCP MX v1.0 §5.3.3 inspected" }
```

## Mechanism

### Methodology

Conversion first classifies the input as finite, infinite, NaN, or zero; determines the target grid; rounds; then applies the target's exceptional-value rule. For a normal value in $[2^a,2^{a+1})$, the grid spacing is $2^{a-p}$. Nearest-even chooses the nearest grid point and resolves a midpoint using the parity of the retained significand. In the subnormal interval the spacing is instead the constant $x_{\min}^{\rm sub}$. Thus $|x|<x_{\min}^{\rm sub}/2$ rounds to zero; at the midpoint nearest-even also selects zero. Values between half the minimum subnormal and the minimum subnormal can round to a nonzero value. "Below the minimum subnormal means zero" is therefore an incorrect conversion rule [MATHEMATICALLY-DERIVED — nearest-grid construction].

For a conventional IEEE-style finite format with infinities, the nearest-rounding overflow threshold is the midpoint beyond the largest finite number, $x_{\max}+2^{e_{\max}-p-1}$, rather than $x_{\max}(1+u)$. FP16 therefore overflows at magnitude 65520 under nearest-even. Saturating conversions impose a different boundary. FP8 E4M3 has no infinity encoding; software must distinguish saturating from non-saturating conversion rather than importing FP16 rules [MATHEMATICALLY-DERIVED for the midpoint; PAPER-REPORTED — R3.2 §3.1 for E4M3 exceptional patterns].

Stochastic rounding chooses between adjacent values $x^-\le x\le x^+$ with

$$
\Pr(\widehat x=x^+)=\frac{x-x^-}{x^+-x^-},\qquad
\mathbb E[\widehat x\mid x]=x,\qquad
\operatorname{Var}(\widehat x\mid x)=(x-x^-)(x^+-x).
$$
*(Eq. 3.5)* The variance is at most $(x^+-x^-)^2/4$. The conditional unbiasedness requires exact probabilities, representable neighbors, and no saturation. It neither proves independence across conversions nor proves that a product of rounded operands or a long training trajectory is unbiased [MATHEMATICALLY-DERIVED — expectation of the two-point distribution].

```figure
id: fig-3.6
kind: calculator
title: Round-to-nearest against stochastic rounding over K steps
caption: >-
  Eq. 3.5 applied to one parameter that receives the same small increment K
  times. At the defaults (|w| = 0.02 in BF16, Δ = 10⁻⁵, within the 10⁻³ to
  10⁻⁵ relative range §3.4 cites) the local spacing is 2^−13 ≈ 1.22e−4.
  Round-to-nearest drops every step, so the parameter never moves. Stochastic
  rounding moves it by K·Δ in expectation, with standard deviation at most
  (s/2)·√K. Drift outputs assume K·Δ ≪ |w| so w stays in its binade, and ties
  round up here, not to even. Illustrative values, not a named model.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-3.5"
alt: >-
  Calculator for Eq. 3.5 with stored value |w|, increment Δ per step, stored
  mantissa bits p and number of steps K. At |w| = 0.02, Δ = 1e−5, p = 7
  (BF16) and K = 100, the local spacing is 2^−13 ≈ 1.22e−4. Stochastic
  rounding goes up with probability 8.19 %. Round-to-nearest drift after 100
  steps is 0. Stochastic-rounding expected drift is 1e−3, with standard
  deviation at most 6.1e−4. Preset Δ = 1e−4: round-to-nearest overshoots to
  0.0122 against 0.01. Preset FP32 storage (p = 23): spacing 1.86e−9, and
  both methods give about 1e−3. Preset |w| = 1: spacing 7.8e−3 and
  probability 0.128 %.
spec:
  tex: >-
    \mathrm{SR}(x)=\begin{cases}x^{+}&\text{w.p. }(x-x^{-})/(x^{+}-x^{-})\\x^{-}&\text{otherwise}\end{cases},\qquad x^{+}-x^{-}=\varepsilon\,2^{\lfloor\log_2|x|\rfloor}
  equation: "3.5"
  inputs:
    - { symbol: w, label: "stored value |w|", default: 0.02, min: 0.001, max: 10, scale: log10, format: raw }
    - { symbol: d, label: "increment Δ per step", default: 0.00001, min: 0.0000001, max: 0.01, scale: log10, format: raw }
    - { symbol: p, label: "stored mantissa bits p", default: 7, min: 3, max: 23, options: [3, 7, 10, 23], format: integer }
    - { symbol: K, label: "steps with the same Δ", default: 100, min: 1, max: 100000, scale: log10, format: integer }
  outputs:
    - { symbol: s, label: "local spacing x⁺ − x⁻ = ε·2^⌊log₂|w|⌋", formula: "2^(floor(log2(w)) - p)", format: raw }
    - { symbol: P, label: "P(SR rounds up) per step", formula: "d/s - floor(d/s)", format: percent }
    - { symbol: RN, label: "round-to-nearest drift after K steps", formula: "K*s*round(d/s)", format: raw }
    - { symbol: SR, label: "SR expected drift, K·Δ", formula: "K*d", format: raw, emphasis: true }
    - { symbol: SD, label: "SR drift std. dev. ≤ (s/2)·√K", formula: "s/2*sqrt(K)", format: raw }
  presets:
    - { label: "Δ = 10⁻⁴", values: { d: 0.0001 } }
    - { label: "FP32 storage, p = 23", values: { p: 23 } }
    - { label: "|w| = 1", values: { w: 1 } }
```

A signed two's-complement $k$-bit integer has range $[-2^{k-1},2^{k-1}-1]$ and unit spacing; an unsigned integer has range $[0,2^k-1]$. Integer multiply-accumulate can overflow without any floating-point infinity. For symmetric INT8 operands bounded by 127, a sufficient INT32 safety condition is $n\,127^2\le2^{31}-1$ for a length-$n$ dot product; asymmetric zero points change this bound because the centered operands can be larger. A scale changes decoded units, not the accumulator's integer capacity [MATHEMATICALLY-DERIVED — triangle inequality on the integer sum].

MXFP8 and MXFP4 pair 32 elements with one E8M0 power-of-two scale. The encoding does not prescribe the memory layout or require every implementation to support every concrete MX format. NVFP4 differs: its E2M1 payload uses local E4M3 scales and a global FP32 scale; it is not interchangeable with MXFP4 [OFFICIAL-DOCUMENTATION — R3.6 §§5.1–5.4; R3.41, "Data Format"]. These scales encode range but consume metadata and introduce their own rounding boundaries.

```figure
id: fig-3.7
kind: chart
title: Normal-rounding bound and subnormal absolute-error envelope
caption: >-
  Each line is flat at log₂ u, the Eq. 3.2 bound, across its normal range. It
  climbs one step per binade through the subnormals, where spacing is fixed
  at x_min^sub. It is clipped at the display ceiling after underflow or
  passage beyond x_max, which marks ±∞ for IEEE formats and NaN or saturation for
  E4M3. Over the verification protocol's band, 2^−30 to 2^30, FP32 and BF16 never leave
  their plateau. FP16 holds full precision only from 2^−14 to 65504, 30 of the
  band's 60 binades. E4M3 holds it only from 2^−6 to 448, and represents
  nothing below 2^−9. That is why FP16 needs loss scaling and FP8 needs a
  scale per tensor or block.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.2", "DERIVED:eq-3.3"]
alt: >-
  Line chart of the base-2 logarithm of the illustrative relative-error envelope
  against log₂|x| from −30 to 30, for six formats. FP32 is flat at −24 and
  BF16 flat at −8 over the whole band. FP16 is at 0 (flushed to zero) below
  2^−25, rises from −1 at 2^−24 to −11 at 2^−14, stays at −11 up to 65504,
  and is at 0 (overflow) from 2^16. E5M2 is flat at −3 from 2^−14 to 57344,
  climbing through subnormals from 2^−16. E4M3 is flat at −4 from 2^−6 to
  448, subnormals from 2^−9, and overflows above 448. FP4 E2M1 is flat at −2
  from 1 to 6, with its subnormal at 0.5.
spec:
  type: line
  x: { label: "log₂|x|, magnitude of the value", scale: linear, format: integer, domain: [-30, 30] }
  y: { label: "log₂ of illustrative relative-error envelope", scale: linear, format: integer, domain: [-25, 0] }
  series:
    - { id: fp32, label: "FP32, u = 2^−24", formula: "min(0, max(-24, -150 - x, 1000*(x - 128)))", sample: { from: -30, to: 30, count: 61 } }
    - { id: bf16, label: "BF16, u = 2^−8", formula: "min(0, max(-8, -134 - x, 1000*(x - 127.994)))", sample: { from: -30, to: 30, count: 61 } }
    - { id: fp16, label: "FP16, u = 2^−11", formula: "min(0, max(-11, -25 - x, 1000*(x - 15.9993)))", sample: { from: -30, to: 30, count: 61 }, emphasis: true }
    - { id: e5m2, label: "FP8 E5M2, u = 2^−3", formula: "min(0, max(-3, -17 - x, 1000*(x - 15.8074)))", sample: { from: -30, to: 30, count: 61 } }
    - { id: e4m3, label: "FP8 E4M3, u = 2^−4", formula: "min(0, max(-4, -10 - x, 1000*(x - 8.8074)))", sample: { from: -30, to: 30, count: 61 } }
    - { id: e2m1, label: "FP4 E2M1, u = 2^−2", formula: "min(0, max(-2, -2 - x, 1000*(x - 2.585)))", sample: { from: -30, to: 30, count: 61 }, dashed: true }
  annotations:
    - { x: -24, label: "FP16 x_min^sub = 2^−24" }
    - { x: -14, label: "FP16 x_min^norm = 2^−14" }
    - { x: -6, label: "E4M3 x_min^norm = 2^−6" }
    - { x: 8.807, label: "E4M3 x_max = 448" }
    - { x: 15.999, label: "FP16 x_max = 65504" }
```

**Resource boundary.** An $n$-element conversion is $O(n)$ work and reads and writes $O(n)$ bytes; streaming auxiliary state is constant for scalar conversion and one scale per block for block conversion. Payload bytes per value are 4, 2, 1, and 0.5 for FP32, 16-bit, 8-bit, and packed 4-bit values. Eq. 3.4 adds scale storage. Parameter count and token count do not change. Communication shrinks only when the wire representation also narrows; single-device conversion has none. Latency, realized FLOP/s, energy, and monetary savings are NOT-DISCLOSED for this abstract conversion and cannot be inferred from bit width [MATHEMATICALLY-DERIVED].

## Algorithm

```text
Algorithm 3.1 — Finite-value nearest-even conversion (explanatory)
INPUT x finite; ordered target finite grid; target overflow mode
OUTPUT target code and class: finite, zero, saturated, or overflow
1. Handle signed zero explicitly.
2. If x lies beyond the finite grid, apply the specified overflow rule.
3. Find adjacent target grid values x_minus <= x <= x_plus.
4. Choose the closer neighbor; at equal distance choose even retained code.
5. Return that code and its class.
INVARIANT the finite result is a nearest representable neighbor.
TERMINATION constant field operations for fixed-width scalar formats.
```

This abstraction deliberately separates IEEE-style and finite-only exceptional encodings. A format implementation must supply those rules; a generic exponent-carry routine cannot safely implement every row of Table 3.1 [MATHEMATICALLY-DERIVED].

## Implementation

PyTorch and JAX occupy **Model / autograd framework**; NVIDIA CUDA occupies **Accelerator / driver / compiler**; NVIDIA cuBLAS / cuBLASLt and NVIDIA Transformer Engine occupy **Kernels / numerics / collectives**. PyTorch documents FP8 storage dtypes with restricted operator support, so dtype existence does not imply an arbitrary kernel can consume it. CUDA's floating-point documentation describes rounding and subnormal controls. JAX's matmul-precision setting controls dot/convolution evaluation separately from array storage [OFFICIAL-DOCUMENTATION — R3.33; R3.25 §§2–4; R3.48]. Actual kernel selection, scale layout, supported devices, and runtime versions must be recorded with an execution, which this manuscript does not claim to have performed.

## Experimental design

### Reported experiments

The 2022 FP8 format study preserves model initializations and optimizer hyperparameters and emulates FP8 GEMM inputs while evaluating arithmetic in wider precision; outputs remain wider. Its image-classification table and language-model experiments therefore test format perturbation in a training recipe, rather than native FP8 kernel speed [PAPER-REPORTED — R3.2 §4.1, Tables 2–5].

Rouhani et al. separately evaluate direct-cast inference, calibrated inference, fine-tuning, and training with emulated MX operators. Their Table 2 applies weight and activation conversion without retraining; Table 5 concerns training. Mixing these settings would conflate representation error with adaptation [PAPER-REPORTED — R3.5 §§4.1–4.3]. Proposed format-boundary checks are confined to [verification.md](verification.md).

## Observations

**What the paper claims.** In the MX direct-cast WMT-17 Transformer-Base experiment, FP32 BLEU is 26.85 and MXFP4 BLEU is 22.68. The narrower encoding is consequently not a drop-in accuracy guarantee [PAPER-REPORTED — R3.5 Table 2].

**What the evidence shows.** The FP8 study reports close baseline task results under its simulated conversion recipe. It does not establish native hardware throughput or unchanged training under arbitrary scale and accumulator choices [PAPER-REPORTED — R3.2 §4].

**What we infer.** Scaling can move the represented interval but cannot restore fraction bits. BF16 has broader exponent range than FP16 and coarser normal spacing; neither fact alone decides convergence [MATHEMATICALLY-DERIVED — Table 3.1].

**What remains unknown.** Independent replication, runtime compatibility, and undisclosed kernel arithmetic are UNVERIFIED for this edition; experimental seeds not supplied by a particular source remain NOT-DISCLOSED, not zero by default.

## Failure modes

Subnormal flushing can turn an encoded nonzero value into zero during an operation; this is distinct from conversion underflow. Saturation can produce finite but biased tensors. Wrong scale-axis or metadata decoding can produce finite values in incorrect units. Integer wraparound can return plausible bounded integers with the wrong sign. Each failure requires an operator-level input/output check and a recorded representation contract; a global finite-value test catches only a subset [MATHEMATICALLY-DERIVED].

## Siblings

[FP16 and BF16](03-1-numeric-representations.md#formulation) trade exponent range against resolution at equal payload width. [E4M3 and E5M2](03-1-numeric-representations.md#formulation) trade finer spacing against wider range and different special encodings. [MXFP4 and NVFP4](03-4-mixed-precision-execution.md#mechanism) share E2M1 payloads but differ in block size and scale hierarchy. [Integer quantization](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-1-quantization-formulation.md) uses a uniform decoded grid per scale; that differs from the binade-dependent floating grid.

## Extensions

### Improvements

The inspected lineage moves from scalar FP8 encoding to shared block scales, then to NVFP4's local fraction-bearing scale and global scale. Each reduces one range bottleneck while adding scale-state and layout requirements. These are representational changes; the training improvements and their ablations are reconstructed in [§3.4](03-4-mixed-precision-execution.md#extensions). No format-only theorem of superior task quality is claimed [OFFICIAL-DOCUMENTATION — R3.6; R3.41].

## Limitations

Eq. 3.2 covers an individual nearest rounding under its stated range conditions. Overflow, subnormal flushing, scale rounding, conditioning, and operator approximation require separate analysis. FP64 can itself overflow and round; a reference comparison establishes agreement at specified inputs, not exact mathematical truth [MATHEMATICALLY-DERIVED].

## Reproducibility

References record the inspected revisions and 7 October 2026 access date. The OCP MX specification is v1.0, September 2023. Transformer Engine pages display 2.20.2; these are mutable documentation, not an installed-version claim. Record rounding, saturation, subnormal handling, packing, scale direction, scale dtype, and actual operator support with each executable artifact [OFFICIAL-DOCUMENTATION — R3.6; R3.41–R3.45].

## References

R3.1–R3.6; R3.33; R3.41–R3.45; R3.13; R3.48; R3.25. Full-text locators are in [references.md](references.md).
