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
word_count_target: 1050
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 3.1 Numeric representations

## Scope

Objective: fix, for every format a training program may use, the exponent range, the precision (machine epsilon), the rounding rule, and the overflow, underflow, and subnormal behavior, so that later sections can derive tolerances rather than assert them. Baseline: FP32 as the working format and FP64 as the reference. Success criterion: the reader can compute, from the table below, the relative error bound of any elementwise operation and the magnitude at which a gradient vanishes. Boundaries: quantization mappings (scale, zero point, granularity) are owned by [§40.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-1-quantization-formulation.md); this section defines the formats those mappings target.

## Why this exists

What failed: programs assumed that a 16-bit float is "a float with less precision", when FP16 and BF16 differ in *which* resource is reduced — FP16 keeps ten mantissa bits and gives up exponent range; BF16 keeps FP32's exponent range and gives up precision [MATHEMATICALLY-DERIVED — from the bit layouts in Table 3.1]. Bottleneck: accelerator throughput and HBM traffic both scale with bytes per value b, so narrower formats are the cheapest lever available [KNOWN — notation.md §1, b]. Dominant constraint: below 16 bits, no format has both the range and the precision to represent weights, activations, and gradients unscaled; a per-tensor or per-block scale becomes part of the representation [PAPER-REPORTED — R3.2, R3.5]. What changed: the format is now a tuple (element encoding, scale granularity, accumulation width), and the chapter treats it as such.

## Intuition

Physically, a floating-point number is a fixed budget of bits split between an exponent (how far the value can reach) and a significand (how finely it can be resolved). Adding one exponent bit doubles the number of binades; adding one significand bit halves the relative spacing in every binade. Training needs reach for gradients, whose magnitudes span many orders across layers, and resolution for parameter updates, whose relative size is set by the learning rate. No 8-bit split satisfies both, which is why scaling factors exist [MATHEMATICALLY-DERIVED — Eq. 3.2 and Eq. 3.3].

## Formulation

A binary floating-point format with p stored significand bits, w exponent bits, and bias β represents

$$
x = (-1)^{s}\, 2^{\,e-\beta}\,\Big(1 + \frac{m}{2^{p}}\Big), \qquad 1 \le e \le 2^{w}-2,\; 0 \le m < 2^{p}
$$
*(Eq. 3.1)* where s = sign bit, e = biased exponent field, m = integer significand field, p = stored significand bits, w = exponent bits, β = 2^(w−1) − 1.

Machine epsilon and unit roundoff:

$$
\varepsilon = 2^{-p}, \qquad u = \tfrac{1}{2}\varepsilon = 2^{-(p+1)}, \qquad \mathrm{fl}(x) = x(1+\delta),\; |\delta| \le u
$$
*(Eq. 3.2)* where fl(·) is round-to-nearest into the format and x is inside the normal range. The model fl(x) = x(1+δ) is the standard model of floating-point arithmetic and holds for +, −, ×, ÷, √ on IEEE-compliant hardware [R3.7].

Largest finite value, smallest normal, and smallest subnormal:

$$
x_{\max} = (2 - 2^{-p})\, 2^{\,e_{\max}}, \qquad x_{\min}^{\text{norm}} = 2^{\,1-\beta}, \qquad x_{\min}^{\text{sub}} = 2^{\,1-\beta-p}
$$
*(Eq. 3.3)* where e_max = 2^w − 2 − β for IEEE formats; E4M3 departs from this by spending its top exponent code on finite values (see below).

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
  - { anchor: mechanism, label: "FP16 · 1-5-10", variables: { w: 5, p: 10, ext: 0 }, highlight: ["log₂ x_min^norm = 1 − β", "log₂ x_min^sub = 1 − β − p", "ln x_max: unshifted exp overflows"], note: "Table 3.1's FP16 row: normals stop at 2^−14 ≈ 6.1e−5 and subnormals at 2^−24. That is the gap where gradients vanish. x_max = 65504, so exp overflows past ln 65504 ≈ 11.09." }
  - { anchor: observations, label: "BF16 · 1-8-7", variables: { w: 8, p: 7, ext: 0 }, highlight: ["u = ε/2, worst RN error", "log₂ x_max"], note: "FP32's exponent with 7 stored bits: u = 2^−8 ≈ 0.39 %. A relative update below that rounds away, which is the inference that motivates FP32 master weights." }
  - { anchor: failure-modes, label: "E4M3 · 1-4-3", variables: { w: 4, p: 3, ext: 1 }, highlight: ["log₂ x_max", "u = ε/2, worst RN error"], note: "The top exponent code holds finite values, so x_max = 1.75·2^8 = 448 and u = 6.25 %. A value beyond 448/scale becomes NaN unless the conversion saturates." }
  - { anchor: siblings, label: "E5M2 · 1-5-2", variables: { w: 5, p: 2, ext: 0 }, highlight: ["binades, x_min^sub to x_max", "log₂ x_min^sub = 1 − β − p"], note: "E5M2 keeps FP16's five exponent bits (x_max 57344, subnormals to 2^−16, about 32 binades) for gradients, at u = 12.5 %." }
```

Integer formats of k bits in two's complement represent the range [−2^(k−1), 2^(k−1) − 1] with unit spacing; a real value is mapped onto that grid by a scale and zero point owned by §40.1 [MATHEMATICALLY-DERIVED].

Block-scaled formats represent a block of n_b elements as

$$
x_i \approx s_{\text{blk}}\, q_i, \quad i = 1,\dots,n_b
$$
*(Eq. 3.4)* where q_i is a low-precision element (for example E4M3 or E2M1) and s_blk is one shared scale stored once per block. Bits per element are then bits(q) + bits(s)/n_b.

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

> **Definition — Machine epsilon (ε) and unit roundoff (u).** ε is the spacing between 1 and the next representable number in a format; u = ε/2 bounds the relative error of a single round-to-nearest operation on a value in the normal range.

> **Definition — Subnormal number.** A value with biased exponent field zero, represented as (−1)^s 2^(1−β) (m/2^p); subnormals fill the gap between zero and the smallest normal with reduced relative precision.

> **Definition — Block-scaled format.** A representation in which a fixed-size block of low-precision elements shares one stored scale factor, so that the effective dynamic range is set by the scale and the per-element resolution by the element format.

## Mechanism

**Table 3.1 — Format constants** (MATHEMATICALLY-DERIVED from the layouts for FP64/FP32/FP16/BF16/TF32; PAPER-REPORTED from R3.2 Table 1 for E4M3/E5M2; the E2M1 row is derived from Eq. 3.1–3.3 for a 1-2-1 layout without infinities or NaN, the element format R3.5 names for MXFP4):

| Format | Bits | Exp. bits | Stored mantissa bits | ε = 2^−p | u | x_max | x_min^norm | x_min^sub |
|---|---:|---:|---:|---|---|---|---|---|
| FP64 | 64 | 11 | 52 | 2.22e−16 | 1.11e−16 | ≈1.80e308 | 2^−1022 ≈ 2.23e−308 | 2^−1074 ≈ 4.94e−324 |
| FP32 | 32 | 8 | 23 | 1.19e−7 | 5.96e−8 | ≈3.40e38 | 2^−126 ≈ 1.18e−38 | 2^−149 ≈ 1.40e−45 |
| TF32 (compute input) | 32 (19 used) | 8 | 10 | 9.77e−4 | 4.88e−4 | as FP32 | as FP32 | not a storage format |
| FP16 | 16 | 5 | 10 | 9.77e−4 | 4.88e−4 | 65504 | 2^−14 ≈ 6.10e−5 | 2^−24 ≈ 5.96e−8 |
| BF16 | 16 | 8 | 7 | 7.81e−3 | 3.91e−3 | ≈3.39e38 | 2^−126 ≈ 1.18e−38 | 2^−133 ≈ 9.18e−41 |
| FP8 E4M3 | 8 | 4 | 3 | 0.125 | 0.0625 | 448 | 2^−6 = 0.0156 | 2^−9 ≈ 1.95e−3 |
| FP8 E5M2 | 8 | 5 | 2 | 0.25 | 0.125 | 57344 | 2^−14 ≈ 6.10e−5 | 2^−16 ≈ 1.53e−5 |
| FP4 E2M1 | 4 | 2 | 1 | 0.5 | 0.25 | 6.0 | 1.0 | 0.5 |

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
    - { label: "FP4 E2M1 · 1-2-1", kind: tensor, capacity: "0.5 B · ε = 0.5", note: "x_max 6.0; element of MXFP4 blocks (R3.5); derived, OCP text UNVERIFIED" }
```

> **Claim [PAPER-REPORTED · R3.2].** E4M3 obtains x_max = 448 by not encoding infinities and by reserving only one mantissa pattern per sign for NaN, so that the top exponent code carries finite values; E5M2 keeps IEEE conventions for infinities and NaN. The proposal uses E4M3 for weights and activations and E5M2 for gradients.

> **Claim [PAPER-REPORTED · R3.5].** The microscaling (MX) formats pair E4M3/E5M2, E3M2/E2M3, or E2M1 elements with a shared 8-bit power-of-two scale per block of 32 elements; MXFP8 and MXFP4 are the two block-scaled families relevant to training. By Eq. 3.4 the overhead is 8/32 = 0.25 bits per element.

> **Claim [OFFICIAL-DOCUMENTATION · OD:transformer-engine-docs].** NVIDIA Transformer Engine (Kernels / numerics / collectives layer) documents FP8, MXFP8, and NVFP4 recipes at https://docs.nvidia.com/deeplearning/transformer-engine/ (release 2.13/2.14 pages, accessed 2026-09-20). MXFP8 there is E4M3 data with one E8M0 scale per 32 consecutive values, computed against max_fp8 = 448; NVFP4 uses one FP8 E4M3 scale per block of 16 elements (a 16×16 two-dimensional block for weights), i.e. 8/16 = 0.5 bit per element of scale overhead by Eq. 3.4. Both are documented as requiring Blackwell-class devices. Whether NVFP4 carries an additional per-tensor FP32 scale is not asserted here [that detail alone is UNVERIFIED].

**Rounding.** Round-to-nearest-even (RN) is the IEEE default and the one assumed by Eq. 3.2; directed modes (toward zero, +∞, −∞) give |δ| ≤ ε and are used for interval bounds, not training. Stochastic rounding rounds up with probability equal to the fractional distance between the two neighbouring representable values x⁻ ≤ x ≤ x⁺:

$$
\mathrm{SR}(x) = \begin{cases} x^{+} & \text{with probability } (x - x^{-})/(x^{+} - x^{-}) \\ x^{-} & \text{otherwise} \end{cases} \qquad\Rightarrow\qquad \mathbb{E}[\mathrm{SR}(x)] = x,\quad \mathrm{Var}[\mathrm{SR}(x)] \le \tfrac{1}{4}(x^{+}-x^{-})^2
$$
*(Eq. 3.5)* where x⁺ − x⁻ = ε·2^⌊log₂|x|⌋ in the normal range. It is unbiased, so an update smaller than u·|w| survives in expectation where round-to-nearest would discard it every time, at the price of variance; it is not an IEEE mode, and R3.2 leaves the rounding choice "to the implementation" [MATHEMATICALLY-DERIVED for mean and variance; PAPER-REPORTED — R3.2 §2 for the format's neutrality; per-device availability NOT-DISCLOSED].

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

**Overflow.** Under RN an IEEE format returns ±∞ once |x| ≥ x_max(1 + u); subsequent arithmetic propagates ∞ and produces NaN from ∞ − ∞ or 0·∞. E4M3 has no ∞, so a conversion must either saturate to ±448 or emit NaN; R3.2 describes saturation to the maximum representable value as the expected conversion, notes that infinities and NaNs of the wider type both become NaN in E4M3, and allows a non-saturating mode; which one a given kernel uses is a property of the kernel, not of the format [PAPER-REPORTED — R3.2 §2; per-kernel mode NOT-DISCLOSED].

**Underflow.** Below x_min^norm, IEEE arithmetic degrades gradually through subnormals; below x_min^sub the result is zero. Hardware may run in flush-to-zero mode, in which subnormal results are replaced by zero; the NVIDIA CUDA compiler exposes this as a compile option and fast-math implies it [OFFICIAL-DOCUMENTATION — NVIDIA CUDA docs root https://docs.nvidia.com/cuda/]. For FP16 the gap between 6.1e−5 and zero is the region in which gradients vanish, and it motivates loss scaling in [§3.4](03-4-mixed-precision-execution.md).

```figure
id: fig-3.7
kind: chart
title: Worst relative rounding error against magnitude, per format
caption: >-
  Each line is flat at log₂ u, the Eq. 3.2 bound, across its normal range. It
  climbs one step per binade through the subnormals, where spacing is fixed
  at x_min^sub. It is pinned at 2^0 = 100 % once the value flushes to zero or
  passes x_max, which marks ±∞ for IEEE formats and NaN or saturation for
  E4M3. Over Experiment 3.1's band, 2^−30 to 2^30, FP32 and BF16 never leave
  their plateau. FP16 holds full precision only from 2^−14 to 65504, 30 of the
  band's 60 binades. E4M3 holds it only from 2^−6 to 448, and represents
  nothing below 2^−9. That is why FP16 needs loss scaling and FP8 needs a
  scale per tensor or block.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.2", "DERIVED:eq-3.3"]
alt: >-
  Line chart of the base-2 logarithm of the worst relative rounding error
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
  y: { label: "log₂ of worst relative rounding error", scale: linear, format: integer, domain: [-25, 0] }
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

Cost line: bytes per value b = 4 (FP32), 2 (FP16/BF16), 1 (FP8), 0.5 (FP4) plus scale overhead of Eq. 3.4; HBM traffic and capacity scale with b; compute throughput per format is vendor-specific and advertised peaks are not application throughput [KNOWN — notation.md; UNVERIFIED for any specific ratio].

## Algorithm

```text
Algorithm 3.1 — Round-to-nearest-even into a (w, p) format
INPUT   real x ≠ 0; format (w, p, β); saturate ∈ {true, false}
OUTPUT  representable value fl(x), or ±∞ / NaN / ±x_max on overflow
STATE   e = floor(log2 |x|); m_real = |x| / 2^e − 1 (in [0,1))
INVARIANT  |fl(x) − x| ≤ u |x| whenever x_min^norm ≤ |x| ≤ x_max
1  if e + β < 1:                       # subnormal range
2      set e ← 1 − β; m_real ← |x| / 2^e         # no implicit leading 1
3  q ← m_real · 2^p; q_lo ← floor(q); r ← q − q_lo
4  if r > 1/2 or (r = 1/2 and q_lo is odd): q_lo ← q_lo + 1   # ties-to-even
5  if q_lo = 2^p: q_lo ← 0; e ← e + 1                        # carry into exponent
6  if e > e_max: return saturate ? sign(x)·x_max : (format has ∞ ? sign(x)·∞ : NaN)
7  if |x| < x_min^sub / 2: return sign(x)·0
8  return sign(x) · 2^e · (1 + q_lo / 2^p)   # or 2^(1−β) · q_lo/2^p if subnormal
9  TERMINATION: constant number of steps
```

Complexity: O(1) per element. Implementation: `Tensor.to(dtype)` in PyTorch and `astype` in JAX perform RN conversion; the saturate flag corresponds to conversion-mode options in FP8 kernels [OFFICIAL-DOCUMENTATION — https://pytorch.org/docs/stable/, https://docs.jax.dev/].

## Implementation

Tensors carry a dtype (storage); operators declare a compute dtype and, for reductions, an accumulation dtype ([§3.2](03-2-stable-primitives.md)). In the reference stack this is visible at the Kernels / numerics / collectives layer: NVIDIA cuBLAS / cuBLASLt take input, output, and compute types as separate arguments so that BF16 inputs can accumulate in FP32 [OFFICIAL-DOCUMENTATION — https://docs.nvidia.com/cuda/cublas/]. At the Model / autograd framework layer, PyTorch exposes `torch.float32`, `torch.float16`, `torch.bfloat16`, `torch.float8_e4m3fn`, `torch.float8_e5m2`, and integer dtypes, and a matmul-precision switch controlling TF32 use for FP32 inputs [OFFICIAL-DOCUMENTATION — https://pytorch.org/docs/stable/]. Block-scaled FP8/FP4 execution is provided by NVIDIA Transformer Engine layers rather than by plain dtypes, because the scale is per block, not per tensor [OFFICIAL-DOCUMENTATION — Transformer Engine docs root]. Memory: converting a [B, T, D] BF16 activation to FP8 halves its bytes and adds bits(s)/n_b per element. Communication: collectives over reduced formats reduce bytes but reduce in the wire dtype unless the collective promotes; this is developed in [§29.5](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-5-collective-communication.md).

## Experimental design

Proposed: Experiment 3.1 in [verification.md](verification.md) converts fixtures spanning 2^−30 … 2^30 into each format and measures |fl(x) − x|/|x| against the u column of Table 3.1; a violation on any in-range value rejects the implementation's rounding mode. An extreme set includes values straddling x_max and x_min^sub of each format.

## Observations

**What the paper claims.** R3.2 reports that FP8 training matched FP16/BF16 baselines on the image, translation, and language models it tested, up to a 175B-parameter GPT model, with hyperparameters unchanged; the experiments used *simulated* FP8 — GEMM input tensors clipped to FP8-representable values with scaling and saturation, arithmetic carried out in the wider 16-bit format [PAPER-REPORTED]. P13 reports that a fine-grained FP8 recipe (E4M3 throughout, 1×128 activation tiles, 128×128 weight blocks, FP32 promotion of partial sums) kept relative loss error below 0.25% against a BF16 baseline on its ablation models [PAPER-REPORTED].

**What the evidence shows.** Table 3.1 is definitional and needs no reproduction. The equivalence of FP8 and BF16 training is reported by the authors on their workloads and has not been independently reproduced in this book; it depends on the scaling recipe, not on the format alone.

**What we infer.** From Eq. 3.2, a single E4M3 rounding contributes relative error up to 6.25%; usable training therefore requires that error to be uncorrelated across many elements and accumulated in a wider format [DERIVED]. From Table 3.1, BF16 cannot represent a relative parameter update smaller than 2^−8 ≈ 0.39% of the parameter, which is the origin of FP32 master weights in [§3.4](03-4-mixed-precision-execution.md) [DERIVED].

**What remains unknown.** The accumulator width inside any vendor's tensor cores for a given input format is NOT-DISCLOSED in the material inspected here; P13 states that its target device retained about 14 bits of accumulation precision for FP8 GEMMs and designs around it, which this book records as the report's statement rather than as a device specification [PAPER-REPORTED].

## Failure modes

> **Failure mode — Silent exponent overflow in FP16.** *Symptom:* loss becomes inf then NaN within one step. *Cause:* an activation or attention logit exceeded 65504 or exp(z) with z > ln 65504 ≈ 11.09 was evaluated without max subtraction. *Detection:* per-tensor finite checks after each block. *Mitigation:* BF16 storage, max-subtracted softmax (§3.2), or scaling.

> **Failure mode — Gradient underflow in FP16.** *Symptom:* a fraction of gradient elements are exactly zero while their FP32 twins are not. *Cause:* magnitudes below 2^−24 (or below 2^−14 under flush-to-zero). *Detection:* histogram of |g| against Table 3.1 thresholds. *Mitigation:* loss scaling (§3.4).

> **Failure mode — NaN from E4M3 conversion.** *Symptom:* NaNs appear only in FP8 layers. *Cause:* a value beyond 448/scale was converted without saturation. *Detection:* amax monitoring per tensor. *Mitigation:* correct scale (§3.4) or saturating conversion.

## Siblings

**FP16** — this section. Why it exists: half the bytes of FP32 with ten mantissa bits. What assumption changed: values fit in ±65504. What objective changed: none. What problem it solved: HBM traffic and tensor-core eligibility. What new failure mode it introduced: overflow and gradient underflow. Changed primitive: exponent field 8 → 5 bits.

**BF16** — this section. Why it exists: FP16 range failures. What assumption changed: 7 mantissa bits suffice for activations and gradients when accumulation is FP32. What problem it solved: no loss scaling needed. What new failure mode it introduced: updates below 2^−8 relative are lost without master weights. Changed primitive: mantissa 10 → 7 bits, exponent 5 → 8.

**FP8 E4M3 / E5M2** — this section. Why it exists: a further halving of bytes. What assumption changed: a per-tensor or per-block scale is part of the representation. What problem it solved: 8-bit GEMM eligibility. What new failure mode it introduced: scale staleness and saturation. Changed primitive: unscaled element → scaled element.

**Block-scaled MXFP8 / NVFP4** — this section; execution owned by Transformer Engine layers. Why it exists: per-tensor scales are dominated by outliers. What assumption changed: a block of 16–32 elements shares an exponent. What problem it solved: dynamic range per block rather than per tensor. What new failure mode it introduced: scale-metadata layout and kernel availability. Changed primitive: one scale per tensor → one scale per block.

**Integer INT8 / INT4** — [§40.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-1-quantization-formulation.md). Why it exists: uniform grids are cheapest to multiply. What assumption changed: values are bounded and approximately uniformly distributed within a block. Changed primitive: floating spacing → uniform spacing.

## Extensions

Long context enlarges attention-logit magnitudes and reduction lengths, tightening the effective tolerance (developed in [§3.6](03-6-reproducibility-limits.md)). Multimodal encoders often keep FP32 normalization statistics while projecting into BF16; embodied control loops are sensitive to subnormal flushing in low-magnitude action outputs (proposal; UNVERIFIED).

## Limitations

The bounds hold for IEEE-compliant elementwise operations in the normal range; they do not describe fused kernels that internally reorder or promote. Falsification: a measured relative error exceeding u on an in-range elementwise conversion indicates a non-RN mode or a fast-math flag. Decision consequence: choose the storage format by required range first, then precision, and never assume the accumulation width.

## Reproducibility

Constants in Table 3.1 are derivable from Eq. 3.1–3.3 and need no software version. Framework dtype availability and FP8 conversion modes must be checked against the pinned version in the skeleton manifest ([§3.6](03-6-reproducibility-limits.md)). Unresolved: per-device accumulator width (NOT-DISCLOSED); NVFP4 second-level tensor scale (UNVERIFIED); E2M1 constants against the OCP specification text (UNVERIFIED, R3.6).

## References

P13; R3.1, R3.2, R3.4, R3.5, R3.6, R3.7, R3.8, R3.11, R3.12, R3.13, R3.16, R3.25.
