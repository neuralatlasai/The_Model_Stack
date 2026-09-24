---
id: ms.section.3.4
entity_type: section
title: Mixed-precision execution
short_title: Mixed precision
volume: 1
part: 1
chapter: 3
section: 3.4
slug: 03-4-mixed-precision-execution
parent: ms.chapter.3
prev_sibling: ms.section.3.3
next_sibling: ms.section.3.5
children: []
prerequisites: [ms.section.3.1, ms.section.3.2, ms.section.3.3]
downstream: [ms.section.3.5, ms.section.19.3, ms.section.20.1, ms.section.29.1, ms.section.40.2]
related: [ms.section.30.2, ms.section.42.4]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: supported_by, target: paper.P18}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.nvidia-transformer-engine}
axes: {lifecycle: [pretraining, adaptation], mechanism: [mixed_precision, scaling], feedback_setting: [], modality: [text]}
papers: [P13, P18]
implementations: [impl.pytorch, impl.nvidia-transformer-engine, impl.nvidia-cublas-cublaslt]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1150
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 3.4 Mixed-precision execution

## Scope

Objective: separate the three dtype decisions of a training step — storage, compute, accumulation — and specify the two mechanisms that make narrow storage survivable: scaling (loss scaling for FP16; per-tensor or per-block scale factors for FP8/FP4) and FP32 master weights with a stated optimizer-state precision. Baseline: FP32 everywhere. Success criterion: the reader can write the byte budget of any precision recipe and state which of its terms are load-bearing. Boundaries: optimizer-state cost as a design variable is owned by [§20.1](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-1-optimizer-mechanics.md); sharding of those states by [§29.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-1-data-state-parallelism.md); quantization of weights, activations, and cache for inference by [§40.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/40-2-quantization-targets.md).

## Why this exists

What failed: FP16 training diverged or stalled because gradients fell into the underflow region of Table 3.1 and because parameter updates smaller than u·|w| were rounded away [PAPER-REPORTED — R3.3 identifies both, proposes loss scaling and an FP32 master copy]. Bottleneck: tensor-core GEMM throughput and HBM traffic favor 16-bit and, later, 8-bit operands, so keeping everything in FP32 wastes the accelerator [KNOWN — R3.2 motivation]. Dominant constraint: the update Δw = −lr·(adaptive step) is typically 10^−3 to 10^−5 relative to |w|, below BF16's u = 2^−8, so *storage* of the master parameter, not of the GEMM operand, decides whether learning happens at all [MATHEMATICALLY-DERIVED — Eq. 3.17]. What changed: recipes assign a dtype per role (operand, activation cache, gradient, master weight, first moment, second moment) and a scale per tensor or block.

## Intuition

Physically there are three distinct places a bit budget is spent: the bytes moved through HBM and the tensor cores (storage/compute dtype), the width of the register holding partial sums (accumulation dtype), and the width of the value that must absorb a tiny increment every step (master/optimizer dtype). The first buys throughput; the second buys the bound of Eq. 3.9; the third buys the ability to learn. Loss scaling is a change of units: multiply the loss by S so that gradients are S times larger, land inside the representable range, then divide S out before the update. FP8 scaling generalizes this to a per-tensor (or per-block) unit chosen from the tensor's own maximum.

## Formulation

Loss scaling with factor S:

$$
\nabla_\theta (S\,\mathcal{L}) = S\,\nabla_\theta \mathcal{L}, \qquad g = \frac{1}{S}\,\mathrm{fl}_{16}\big(S\,\nabla_\theta \mathcal{L}\big)
$$
*(Eq. 3.15)* where fl_16 is the FP16 rounding of the backward pass; S is chosen so that S·|g| stays below x_max(FP16) = 65504 for the largest gradient and above x_min^sub = 2^−24 for the smallest one that matters.

```figure
id: fig-3.18
kind: chart
title: Dynamic loss scale against its Eq. 3.15 window
caption: >-
  Algorithm 3.8 with GradScaler's documented defaults: init 2^16, ×2 after
  2000 consecutive finite steps, ×0.5 on a non-finite step. The gradient
  magnitudes |g|max = 2^−4 and |g|min = 2^−36 are illustrative, not measured.
  The two flat lines are Eq. 3.15's window. S grows until a doubling crosses
  the ceiling, then saws against it, losing one step in every 2000. The
  emphasised line is drawn after each backoff, so the one-step tries at 2^20
  are not shown. The rail states move t and |g|max as the section's argument
  moves.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:alg-3.8", "DERIVED:eq-3.15", R3.11]
alt: >-
  Step chart of loss scale S on a log₂ axis against optimizer step t from 0
  to 12000. With every step finite, S would double every 2000 steps from
  65,536 (2^16) to 4,194,304 (2^22) at t = 12000 (dashed). The overflow
  ceiling 65504/|g|max for |g|max = 2^−4 is flat at 1,048,064. The underflow
  floor 2^−24/|g|min for |g|min = 2^−36 is flat at 4,096. Under Algorithm 3.8
  S climbs 2^16, 2^17, 2^18, 2^19 at t = 0, 2000, 4000, 6000. At t = 8000 the
  doubling to 2^20 = 1,048,576 exceeds the ceiling, the step is skipped and
  S returns to 2^19, and the pattern repeats every 2000 steps.
spec:
  type: step
  x: { label: "optimizer step t", scale: linear, format: integer, domain: [0, 12000] }
  y: { label: "loss scale S", scale: log2, format: raw, domain: [1024, 8388608] }
  variables: { S0: 65536, G: 2000, gmax: 0.0625, gmin: 1.4551915228366852e-11 }
  series:
    - { id: grow, label: "S if every step were finite, 2^16·2^⌊t/G⌋", formula: "S0*2^floor(x/G + 0.000001)", sample: { from: 0, to: 12000, count: 241 }, dashed: true }
    - { id: saw, label: "S under Algorithm 3.8, after backoff", formula: "S0*2^min(floor(x/G + 0.000001), floor(log2(65504/(gmax*S0))))", sample: { from: 0, to: 12000, count: 241 }, emphasis: true }
    - { id: ceil, label: "overflow ceiling 65504/|g|max", formula: "65504/gmax", sample: { from: 0, to: 12000, count: 2 } }
    - { id: floor, label: "underflow floor 2^−24/|g|min", formula: "2^-24/gmin", sample: { from: 0, to: 12000, count: 2 } }
  annotations:
    - { x: 8000, label: "2^20 > 1,048,064: skip, halve" }
states:
  - { anchor: formulation, label: "window at t = 0", variables: { gmax: 0.0625, x: 0 }, highlight: [ceil, floor, saw], note: "Eq. 3.15's window for |g|max = 2^−4 and |g|min = 2^−36: S·|g|max ≤ 65504 caps S near 2^20, and S·|g|min ≥ 2^−24 needs S ≥ 2^12. GradScaler starts at 2^16." }
  - { anchor: mechanism, label: "growth, t = 6000", variables: { gmax: 0.0625, x: 6000 }, highlight: [saw, grow], note: "GradScaler doubles S after G = 2000 consecutive finite steps. By t = 6000 S = 2^19 = 524,288, still under the 1,048,064 ceiling." }
  - { anchor: algorithm, label: "backoff, t = 8000", variables: { gmax: 0.0625, x: 8000 }, highlight: [saw, ceil], note: "Line 7 doubles S to 2^20 = 1,048,576, above the ceiling. The step overflows, line 4 halves S and skips it. From here one step in every 2000 is skipped." }
  - { anchor: failure-modes, label: "|g|max = 16: window closed", variables: { gmax: 16, x: 12000 }, highlight: [ceil, floor], note: "If |g|max grows to 16 the ceiling (4094) drops below the floor (4096), so no S satisfies Eq. 3.15. Non-finite gradients at every S are divergence, not a scaling fault (§20.5)." }
  - { anchor: siblings, label: "|g|max = 1", variables: { gmax: 1, x: 2000 }, highlight: [saw, ceil], note: "With |g|max = 1 the ceiling 65504 sits below the default init 2^16. Step 0 overflows, S settles at 2^15, and one step in every 2000 is skipped. BF16 needs no S at all." }
```

Per-tensor FP8 scale from the absolute maximum:

$$
s = \frac{x_{\max}^{\text{FP8}}}{\mathrm{amax}(x)}, \qquad q = \mathrm{fl}_{8}(s\,x), \qquad x \approx q / s
$$
*(Eq. 3.16)* where x_max^FP8 = 448 for E4M3, 57344 for E5M2; "current" scaling computes amax from the tensor being quantized, "delayed" scaling predicts it from a history of previous amax values [OFFICIAL-DOCUMENTATION — Transformer Engine FP8 current-scaling and delayed-scaling pages, R3.12]. Block scaling applies Eq. 3.16 per block of n_b elements with s stored as E8M0 (MXFP8, n_b = 32) or E4M3 (NVFP4, n_b = 16) [OFFICIAL-DOCUMENTATION — R3.12, TE 2.13/2.14 pages, accessed 2026-09-20].

BF16 update-loss threshold: for a parameter w stored in BF16, the update Δ is lost entirely when

$$
|\Delta| < u_{\text{bf16}}\,|w| = 2^{-8}|w| \approx 0.0039\,|w|
$$
*(Eq. 3.17)* where the rounding of w + Δ returns w. For |w| ≈ 0.02 (a typical initialization scale) and an Adam-normalized step of size lr ≈ 10^−4, the ratio is 5 × 10^−3 < 2^−8 only barely, and for larger |w| or smaller lr the update vanishes [MATHEMATICALLY-DERIVED].

```figure
id: fig-3.19
kind: calculator
title: Does a BF16-stored parameter absorb this update?
caption: >-
  Eq. 3.17 next to the exact round-to-nearest test. The update survives if
  it reaches half the local spacing, u·2^⌊log₂|w|⌋. That threshold equals
  u·|w| only when |w| is a power of two and is up to 2× smaller otherwise.
  At the example above (|w| = 0.02, Δ = 10⁻⁴) the ratio is 0.5 %, just above
  2^−8 ≈ 0.39 %. The update is kept but rounded up by 22 %. At Δ = 10⁻⁵, or
  at |w| = 0.5, it is lost entirely. An FP32 master makes the rounding error
  negligible. Ties round up here, not to even.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.17", "DERIVED:eq-3.2"]
alt: >-
  Calculator for Eq. 3.17 with stored value |w|, update |Δ| and stored
  mantissa bits p. At |w| = 0.02, Δ = 1e−4 and p = 7 (BF16): the Eq. 3.17
  threshold u·|w| is 7.81e−5. The exact round-to-nearest threshold, half the
  local spacing, is 2^−14 ≈ 6.10e−5. The relative update is 0.5 %, the stored
  increment after rounding is 2^−13 ≈ 1.22e−4, and the rounding error in the
  update is +22.1 %. Preset Δ = 1e−5: stored increment 0, error −100 %
  (lost). Preset |w| = 0.5: lost. Preset FP32 master (p = 23): stored
  increment ≈ 1e−4, error about −0.0002 %.
spec:
  tex: >-
    |\Delta| < u_{\text{bf16}}\,|w| = 2^{-8}|w|\qquad\text{exact: } |\Delta| < u\,2^{\lfloor\log_2|w|\rfloor}
  equation: "3.17"
  inputs:
    - { symbol: w, label: "stored parameter |w|", default: 0.02, min: 0.001, max: 10, scale: log10, format: raw }
    - { symbol: d, label: "update |Δ|", default: 0.0001, min: 0.0000001, max: 0.01, scale: log10, format: raw }
    - { symbol: p, label: "stored mantissa bits p", default: 7, min: 7, max: 23, options: [7, 10, 23], format: integer }
  outputs:
    - { symbol: th, label: "Eq. 3.17 threshold u·|w|", formula: "2^-(p+1)*w", format: raw }
    - { symbol: hs, label: "exact RN threshold, half the local spacing", formula: "2^(floor(log2(w)) - p - 1)", format: raw }
    - { symbol: r, label: "relative update |Δ|/|w|", formula: "d/w", format: percent }
    - { symbol: st, label: "stored increment after RN", formula: "2^(floor(log2(w)) - p)*round(d/2^(floor(log2(w)) - p))", format: raw }
    - { symbol: e, label: "RN error in the update, (stored − Δ)/Δ", formula: "(st - d)/d", format: percent, emphasis: true }
  presets:
    - { label: "Δ = 10⁻⁵", values: { d: 0.00001 } }
    - { label: "|w| = 0.5", values: { w: 0.5 } }
    - { label: "FP32 master, p = 23", values: { p: 23 } }
```

Bytes per parameter for a mixed-precision AdamW recipe (before sharding):

$$
b_{\text{total}} = b_{\text{param}} + b_{\text{grad}} + b_{\text{master}} + b_{m} + b_{v}
$$
*(Eq. 3.18)* where the classic FP16/FP32 recipe gives 2 + 2 + 4 + 4 + 4 = 16 bytes per parameter [PAPER-REPORTED — P18 uses this accounting], a BF16-moment recipe with FP32 master and gradient (P13) gives 1 (FP8 operand copy) + 4 + 4 + 2 + 2 = 13, and a pure-FP32 baseline gives 4 + 4 + 0 + 4 + 4 = 16 with no separate master.

```figure
id: fig-3.20
kind: memory-stack
title: Training state per recipe under Eq. 3.18
caption: >-
  Eq. 3.18 times N = 5 × 10⁹ parameters, an illustrative model size, state
  only, before activations and sharding. The first two bars are both
  16 B/param (74.5 GiB). FP16 storage with an FP32 master saves nothing in
  state; its savings are in activations and GEMM bandwidth. Keeping a
  separate BF16 operand copy (18 B, 83.8 GiB) crosses the 80 GiB line.
  P13's BF16 moments and FP8 copy (13 B, 60.5 GiB) bring it back under. The
  80 GiB line is an illustrative budget, not a product specification.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-3.18", P18, P13]
alt: >-
  Four stacked bars of training-state bytes for 5e9 parameters against an
  illustrative 80 GiB budget line. FP32 everywhere, 16 bytes per parameter
  (weights 4, gradients 4, Adam m 4, v 4): 74.5 GiB. FP16 with an FP32 master,
  the P18 accounting, 16 bytes (FP16 weights 2, FP16 gradients 2, FP32
  master 4, m 4, v 4): 74.5 GiB. BF16 operand copy kept with FP32 gradients,
  master and moments, 18 bytes (2 + 4 + 4 + 4 + 4): 83.8 GiB, over the line.
  P13-style, 13 bytes (FP8 operand copy 1, FP32 gradients 4, FP32 master 4,
  BF16 m 2, BF16 v 2): 60.5 GiB.
spec:
  format: bytes
  variables: { N: 5.0e9 }
  bars:
    - label: "FP32 everywhere, 16 B/param"
      segments:
        - { label: "FP32 weights, 4 B", kind: tensor, formula: "4*N" }
        - { label: "FP32 gradients, 4 B", kind: tensor, formula: "4*N" }
        - { label: "Adam m, FP32, 4 B", kind: memory, formula: "4*N" }
        - { label: "Adam v, FP32, 4 B", kind: memory, formula: "4*N" }
    - label: "FP16 + FP32 master (P18), 16 B/param"
      segments:
        - { label: "FP16 weights, 2 B", kind: tensor, formula: "2*N" }
        - { label: "FP16 gradients, 2 B", kind: tensor, formula: "2*N" }
        - { label: "FP32 master, 4 B", kind: memory, formula: "4*N" }
        - { label: "Adam m, FP32, 4 B", kind: memory, formula: "4*N" }
        - { label: "Adam v, FP32, 4 B", kind: memory, formula: "4*N" }
    - label: "BF16 copy + FP32 grads, master, moments, 18 B"
      segments:
        - { label: "BF16 operand copy, 2 B", kind: tensor, formula: "2*N" }
        - { label: "FP32 gradients, 4 B", kind: tensor, formula: "4*N" }
        - { label: "FP32 master, 4 B", kind: memory, formula: "4*N" }
        - { label: "Adam m, FP32, 4 B", kind: memory, formula: "4*N" }
        - { label: "Adam v, FP32, 4 B", kind: memory, formula: "4*N" }
    - label: "P13-style, 13 B/param"
      segments:
        - { label: "FP8 operand copy, 1 B", kind: tensor, formula: "1*N" }
        - { label: "FP32 gradients, 4 B", kind: tensor, formula: "4*N" }
        - { label: "FP32 master, 4 B", kind: memory, formula: "4*N" }
        - { label: "AdamW m, BF16, 2 B", kind: memory, formula: "2*N" }
        - { label: "AdamW v, BF16, 2 B", kind: memory, formula: "2*N" }
  budget: { label: "illustrative 80 GiB budget, not a product spec", formula: "80*2^30" }
```

> **Definition — Master weights.** An FP32 copy of the parameters that receives the optimizer update; the narrow-format copy used as a GEMM operand is derived from it each step.

> **Definition — Loss scaling (static / dynamic).** Multiplication of the loss by S before backward and division of gradients by S before the update; static keeps S fixed, dynamic grows S on a run of finite steps and halves it on a non-finite step.

> **Definition — Delayed scaling / block scaling (FP8).** Delayed scaling sets a tensor's scale from a history of prior amax values so that quantization needs one read; block scaling sets one scale per fixed block from that block's current amax.

## Mechanism

**FP16 with loss scaling and master weights** (R3.3, PAPER-REPORTED). Weights, activations, and gradients are stored in FP16; the master copy is FP32 and "accumulates the gradients after each optimizer step"; loss scaling shifts the gradient histogram into range; arithmetic accumulates in FP32. Dynamic scaling as documented for PyTorch's `GradScaler` starts at `init_scale=65536.0`, multiplies by `growth_factor=2.0` after `growth_interval=2000` consecutive finite steps, and multiplies by `backoff_factor=0.5` when a non-finite gradient is found, skipping that step [OFFICIAL-DOCUMENTATION — PyTorch 2.14 AMP page, R3.11]. Gradients must be unscaled before clipping so that the threshold c of Eq. 3.13 is applied in true units.

**BF16 without loss scaling** (R3.4, PAPER-REPORTED). BF16 shares FP32's exponent range, so gradients do not underflow at ordinary magnitudes and the authors report training "with no changes to hyper-parameters". The precise state consequence: (i) no S is needed; (ii) the seven-bit mantissa makes each operand rounding 8× coarser than FP16 (u = 2^−8 vs 2^−11), so Eq. 3.9's bound per reduction is 8× larger unless accumulation is FP32; (iii) by Eq. 3.17 a BF16-stored parameter cannot absorb typical updates, so either an FP32 master copy (4 extra bytes per parameter) or a compensated update (Kahan-style residual, +2 bytes) is required; (iv) BF16 optimizer moments lose the same relative resolution, which P13 reports as acceptable for AdamW's first and second moments while keeping master weights and gradients in FP32 [PAPER-REPORTED — P13 §3.3.3]. PyTorch documents BF16 autocast as usable without `GradScaler` [OFFICIAL-DOCUMENTATION — R3.11].

**FP8 with per-tensor scaling** (R3.2; Transformer Engine). Operands of the three GEMMs (forward, activation-gradient, weight-gradient) are cast to FP8 with a scale from Eq. 3.16; outputs are produced in BF16 or FP32; the recommended pairing is E4M3 forward and E5M2 for gradients [PAPER-REPORTED — R3.2 §3]. Delayed scaling estimates the scale from an amax history so that quantization needs a single tensor read; current scaling reads the tensor twice (amax, then cast) and is documented as "a significant overhead compared to other recipes" [OFFICIAL-DOCUMENTATION — TE current-scaling page, R3.12]. In distributed settings the amax must be synchronized before quantizing gathered tensors [OFFICIAL-DOCUMENTATION — same page].

**FP8 with block scaling** (P13; MX, R3.5; Transformer Engine). P13 uses E4M3 for all tensors, scales activations per 1×128 tile and weights per 128×128 block, computes scales online, and promotes tensor-core partial sums to FP32 every N_C = 128 elements because the target device's FP8 accumulation "is limited to retaining around 14 bits"; the report's preliminary test measured a maximum relative error of nearly 2% for a K = 4096 GEMM without promotion [PAPER-REPORTED — P13 §3.3.2]. MXFP8 uses blocks of 32 consecutive values with an E8M0 (power-of-two) scale computed from the block amax against 448; because scales are one-dimensional, the row-wise and column-wise quantized tensors "are numerically different — one cannot derive one from the other" [OFFICIAL-DOCUMENTATION — TE 2.13 MXFP8 page, R3.12]. NVFP4 uses one E4M3 scale per block of 16 (2D 16×16 blocks for weights) [OFFICIAL-DOCUMENTATION — TE 2.14 FP8/FP4 primer and docs listing, R3.12]; a further FP32 per-tensor scale is described in some materials but is not asserted here [UNVERIFIED].

```figure
id: fig-3.21
kind: stat-panel
title: The DeepSeek-V3 FP8 recipe as reported
caption: >-
  P13's recipe, reduced to the numbers this section uses. Two of them carry
  the recipe. The ≈ 14-bit FP8 accumulation, the report's statement rather
  than a device specification, forces FP32 promotion every 128 elements.
  Without promotion a K = 4096 GEMM showed a maximum relative error near 2 %.
  The block glyph is Eq. 3.18 for this recipe, 13 B/param. The FP32 master
  and FP32 gradients are 8 of those 13 bytes. P13 narrows the moments and
  the operand copy, not the master.
placement: rail
anchor: mechanism
evidence: PAPER-REPORTED
source: P13
context:
  hardware: "the report's target device; not named in this chapter (NOT-DISCLOSED here)"
  model: "ablation models similar to DeepSeek-V2-Lite and DeepSeek-V2 (P13 §3.3)"
  precision: "FP8 E4M3 GEMM operands with FP32 promotion, against a BF16 baseline"
  sequenceLength: "NOT-DISCLOSED in the pages read"
  ioDistribution: "pretraining tokens, approximately 1 trillion per ablation run"
  concurrency: "NOT-DISCLOSED in the pages read"
  runtimeVersion: "NOT-DISCLOSED"
  measurementBoundary: "relative training-loss error vs BF16; GEMM max relative error at K = 4096 without promotion"
alt: >-
  Instrument panel of the DeepSeek-V3 FP8 training recipe as reported in P13.
  Element format E4M3 on all tensors. Activations scaled per 1 × 128 tile
  and weights per 128 × 128 block, both online. Tensor-core partial sums
  promoted to FP32 every N_C = 128 elements, because FP8 GEMM accumulation
  retains about 14 bits. Maximum relative error near 2 % for a K = 4096 GEMM
  without promotion. Master weights and gradients in FP32, AdamW moments in
  BF16. Eq. 3.18 gives 13 bytes per parameter. Relative loss error below
  0.25 % against BF16 on two ablation scales trained on about 1 trillion
  tokens. A block glyph splits the 13 bytes into FP8 copy 1, FP32 gradients
  4, FP32 master 4, BF16 m 2 and BF16 v 2.
spec:
  header: "DEEPSEEK-V3 FP8 RECIPE · P13 §3.3"
  rows:
    - { key: "element format", value: "E4M3 on all tensors" }
    - { key: "activation scaling", value: "1 × 128 tiles, online" }
    - { key: "weight scaling", value: "128 × 128 blocks, online" }
    - { key: "FP32 promotion interval", value: "N_C = 128 elements" }
    - { key: "FP8 GEMM accumulation", value: "≈ 14 bits retained", note: "the report's statement, not a device specification" }
    - { key: "K = 4096 GEMM, no promotion", value: "max rel. error near 2 %" }
    - { key: "master weights, gradients", value: "FP32" }
    - { key: "AdamW moments", value: "BF16" }
    - { key: "bytes/param, Eq. 3.18", formula: "1 + 4 + 4 + 2 + 2", format: integer }
    - { key: "loss error vs BF16", value: "< 0.25 %, two scales, ≈ 1T tokens" }
  glyph:
    type: blocks
    items:
      - { label: "FP8 operand copy 1 B", weight: 1 }
      - { label: "FP32 gradients 4 B", weight: 4 }
      - { label: "FP32 master 4 B", weight: 4, emphasis: true }
      - { label: "BF16 AdamW m 2 B", weight: 2 }
      - { label: "BF16 AdamW v 2 B", weight: 2 }
```

**Optimizer-state precision.** Under Eq. 3.18 the two Adam moments are half of the 16-byte budget; storing them in BF16 (P13) or in block-wise quantized 8-bit form (R3.23) reduces M_opt of Eq. N.5 at the cost of moment resolution; the design space is developed in §20.1 and its sharding in §29.1.

Cost line (per parameter, unsharded): FP32 baseline 16 B; FP16+master+Adam 16 B (no memory saving in state, saving is in activations and bandwidth); BF16 operand + FP32 master + FP32 moments 18 B if a separate BF16 copy is kept, 16 B if the operand is cast on the fly; P13-style 13 B; per-tensor FP8 adds one FP32 scale and an amax history per tensor (negligible); block scaling adds 8/32 = 0.25 bit/element (MXFP8) or 8/16 = 0.5 bit/element (NVFP4) plus the transposed copy where needed [MATHEMATICALLY-DERIVED accounting; per-recipe totals DERIVED]. Compute: current scaling costs one extra read per quantized tensor; P13's promotion reduces the tensor-core issue rate and is overlapped by warp specialization [PAPER-REPORTED].

## Algorithm

```text
Algorithm 3.8 — Dynamic loss-scaling step (FP16 operands, FP32 master weights)
INPUT   micro-batches; scale S (init 2^16); growth factor 2; backoff 0.5; growth interval G
OUTPUT  updated master weights or a skipped step; updated S
STATE   finite-step counter n_ok; FP32 master θ_32; FP16 operand θ_16 = fl16(θ_32)
INVARIANT gradients are unscaled (divided by S) before clipping and stepping
1  loss ← forward(θ_16) in FP16 with FP32 reductions (§3.2)
2  backward(S · loss)                         # gradients g_16 ≈ S·∇ℒ in FP16
3  g_32 ← FP32(g_16) / S                       # unscale into FP32
4  if any non-finite in g_32: S ← S · 0.5; n_ok ← 0; skip step; return
5  clip g_32 by Eq. 3.13; θ_32 ← optimizer(θ_32, g_32)
6  θ_16 ← fl16(θ_32)
7  n_ok ← n_ok + 1; if n_ok = G: S ← S · 2; n_ok ← 0
8  TERMINATION: one step
```

Complexity: one extra elementwise pass for unscaling and one for the cast in line 6; the skip in line 4 loses one micro-step of data.

```figure
id: fig-3.22
kind: diagram
title: Dtype of every role in one dynamic-loss-scaling step
caption: >-
  Algorithm 3.8 with each tensor placed in the format it lives in. FP16
  touches only the operand copy, the forward and the backward. Everything
  that must absorb a small number is FP32: the master, the unscaled gradient,
  the clip and the optimizer. The emphasised path is the algorithm's
  invariant. Gradients leave FP16, are divided by S and checked for
  finiteness before Eq. 3.13 clips them in true units. Clipping S·g instead
  gives the c/S failure mode.
placement: inline
evidence: DERIVED
source: ["DERIVED:alg-3.8", R3.3, R3.11]
alt: >-
  Diagram of Algorithm 3.8 in two groups. FP32 state: master θ₃₂ (4 bytes per
  parameter) is cast by fl16 (line 6) to the FP16 operand θ₁₆ (2 bytes per
  parameter). FP16 storage and compute: the forward runs FP16 GEMMs with FP32
  reductions, and the loss is multiplied by S (line 2; S starts at 2^16).
  The backward gives g₁₆ ≈ S·∇ℒ in FP16. Back in FP32, the emphasised path
  unscales g₃₂ = FP32(g₁₆)/S (line 3) and tests for any non-finite value
  (line 4). On yes the step is skipped and S halves. On no, Eq. 3.13 clips in
  true units and the optimizer updates θ₃₂ with FP32 moments, feeding back to
  the master. After G = 2000 finite steps S doubles, feeding back to the next
  step's S·ℒ.
spec:
  direction: TB
  nodes:
    - { id: m32, kind: memory, label: "master θ₃₂", sub: "FP32, 4 B/param", group: f32 }
    - { id: cast, kind: process, label: "cast fl16(θ₃₂)", sub: "line 6; one pass over the weights" }
    - { id: t16, kind: tensor, label: "operand θ₁₆", sub: "FP16, 2 B/param", group: f16 }
    - { id: fwd, kind: process, label: "forward", sub: "FP16 GEMMs, FP32 reductions (§3.2)", group: f16 }
    - { id: loss, kind: objective, label: "S · ℒ", sub: "line 2; S starts at 2^16" }
    - { id: bwd, kind: process, label: "backward", sub: "g₁₆ ≈ S·∇ℒ in FP16", group: f16 }
    - { id: uns, kind: process, label: "unscale g₃₂ = FP32(g₁₆) / S", sub: "line 3", group: f32 }
    - { id: fin, kind: branch, label: "any non-finite value?", sub: "line 4", group: f32 }
    - { id: skip, kind: state, label: "skip step, S ← S · 0.5", sub: "n_ok ← 0" }
    - { id: clip, kind: process, label: "clip by Eq. 3.13", sub: "true units, after unscaling", group: f32 }
    - { id: opt, kind: process, label: "optimizer(θ₃₂, g₃₂)", sub: "FP32 moments m, v", group: f32 }
    - { id: grow, kind: state, label: "n_ok = G → S ← 2S", sub: "G = 2000, the GradScaler default" }
  edges:
    - { from: m32, to: cast }
    - { from: cast, to: t16 }
    - { from: t16, to: fwd }
    - { from: fwd, to: loss }
    - { from: loss, to: bwd }
    - { from: bwd, to: uns, kind: emphasis, label: "leave FP16" }
    - { from: uns, to: fin, kind: emphasis }
    - { from: fin, to: clip, kind: emphasis, label: "no: unscale before clip" }
    - { from: fin, to: skip, label: "yes" }
    - { from: clip, to: opt }
    - { from: opt, to: m32, kind: feedback, label: "θ₃₂ updated" }
    - { from: opt, to: grow }
    - { from: grow, to: loss, kind: feedback, label: "next step's S" }
    - { from: skip, to: loss, kind: feedback, label: "S halved" }
  groups:
    - { id: f16, label: "FP16 storage and compute" }
    - { id: f32, label: "FP32 state" }
```

```text
Algorithm 3.9 — Delayed per-tensor FP8 scaling (concept)
INPUT   tensor x_t at step t; amax history A of length H; FP8 max M (448 or 57344); margin μ ≥ 0
OUTPUT  q_t = fl8(s_t · x_t), scale s_t, updated history
STATE   A = [amax_{t−1}, …, amax_{t−H}]
INVARIANT s_t depends only on past amax values; amax_t is recorded after quantization
1  â ← reduce(A)                              # "max" over the history or "most recent"
2  s_t ← 2^{ floor(log2(M / â)) − μ }          # power-of-two scale with safety margin
3  q_t ← fl8(saturate(s_t · x_t))              # one read of x_t
4  amax_t ← max|x_t| (computed during the same pass); push amax_t into A, drop oldest
5  return q_t, s_t
6  TERMINATION: one pass
```

Complexity: one read of x_t; the price is staleness: if amax_t > â·2^μ, values saturate at line 3. The reduction choice in line 1 and the margin are recipe options documented for Transformer Engine's `DelayedScaling`; the exact formula of the shipped implementation should be read from the pinned release [OFFICIAL-DOCUMENTATION for the concept, R3.12; formula details UNVERIFIED].

```text
Algorithm 3.10 — Block scaling to an MX-style block (after R3.5, Alg. 1)
INPUT   block V_1..V_k (k = 32 for MX); element format with max-exponent e_max_elem
OUTPUT  shared scale X (E8M0), elements P_1..P_k
1  shared_exp ← floor(log2(max_i |V_i|)) − e_max_elem
2  X ← 2^shared_exp
3  for i = 1..k: P_i ← quantize_to_element_format(V_i / X), clamping normal values to the element max
4  return X, {P_i}
5  TERMINATION: k steps
```

Complexity: one amax per block and one division per element; R3.5 notes that the specification allows other implementation-defined conversion recipes [PAPER-REPORTED].

## Implementation

Framework: PyTorch's `torch.autocast` chooses the compute dtype per op (GEMMs in FP16/BF16, reductions in FP32) and `torch.amp.GradScaler` implements Algorithm 3.8 for FP16 [OFFICIAL-DOCUMENTATION — R3.11]. Kernels: FP8 and FP4 GEMMs with scaled operands run through NVIDIA Transformer Engine layers (`DelayedScaling`, `Float8CurrentScaling`, `MXFP8BlockScaling`, `NVFP4BlockScaling` recipe classes) over NVIDIA cuBLAS / cuBLASLt with a compute type of at least FP32 for the accumulator where the device supports it [OFFICIAL-DOCUMENTATION — R3.12, R3.13]. TorchAO offers float8 training for `torch.nn.Linear` with `tensorwise`, `rowwise`, and `rowwise_with_gw_hp` recipes via `Float8LinearConfig.from_recipe_name()` and `convert_to_float8_training()`, and lists MXFP8 training as a prototype [OFFICIAL-DOCUMENTATION — TorchAO training docs, R3.14, accessed 2026-09-20]. Memory: the FP8 activation cache for the weight-gradient GEMM halves activation bytes relative to BF16 (P13 stores Linear inputs in FP8 for backward, with a custom E5M6 format for the inputs of the Linear after attention and power-of-two scales there [PAPER-REPORTED]). Communication: FP8 dispatch of MoE activations before up-projections is reported by P13 as a bandwidth measure; the general treatment is in §29.5. Deployment: the storage recipe chosen here fixes which tensors §40.2 can quantize without a second calibration.

```text
Systems trace (single device, one Linear layer, BF16-operand recipe)
stage                 → latency          / memory                           / compute        / communication / failure
cast master→operand   → 1 pass over W    / +2 B/param operand copy          / elementwise    / none          / none
GEMM forward          → tensor-core bound/ activations saved in BF16        / 2·M·N·K FLOPs  / none          / overflow if FP16
GEMM backward (2×)    → tensor-core bound/ grads in BF16 then FP32          / 4·M·N·K FLOPs  / none          / underflow if FP16, no S
unscale + clip        → 2 passes over g  / FP32 gradient buffer 4 B/param   / elementwise    / none          / NaN norm
optimizer step        → 1 pass over θ_32 / master 4 B + m 4 B + v 4 B       / elementwise    / none          / lost update if BF16 master
```

## Experimental design

Proposed: Experiment 3.4 (in [verification.md](verification.md)) trains the skeleton on the tiny-batch fixture under four recipes — FP32; FP16 + dynamic S + FP32 master; BF16 + FP32 master; BF16 with BF16 master (no master) — with identical seeds and deterministic kernels, and reports (a) the FP64-referenced gradient error before the first step, (b) the fraction of parameter elements whose update rounds to zero on step 1 (predicted by Eq. 3.17), and (c) loss after a fixed number of steps. Expected: recipe (d) shows a nonzero lost-update fraction that recipes (a)–(c) do not. This is a proposal; no runs were performed.

## Observations

**What the paper claims.** R3.3 reports that FP16 with master weights and loss scaling matched FP32 accuracy across the tasks tested and reduced memory "by nearly 2x". R3.4 reports BF16 matches FP32 in the same number of iterations without hyperparameter changes. P13 reports FP8 relative loss error consistently below 0.25% versus BF16 on two model scales (similar to DeepSeek-V2-Lite and DeepSeek-V2) trained for approximately 1 trillion tokens. TorchAO documents a 25.03% (tensorwise) and 10.05% (rowwise) throughput gain for Llama3-8b on an 8-GPU H100 node and 1.5× at 512-GPU / 405B scale [all PAPER-REPORTED or OFFICIAL-DOCUMENTATION; the speedups carry their stated model/hardware context and are not transferable].

**What the evidence shows.** The underflow and update-loss mechanisms are theorems of the format tables. The claim that a given recipe "matches" a baseline is workload-specific, reported by its authors, and — for FP8 — depends on a scaling recipe that the papers themselves say was tuned (P13 Appendix B.2 on block-scaled activations destabilizing training).

**What we infer.** Under Eq. 3.18, FP16/BF16 mixed precision does not reduce per-parameter state at all when an FP32 master and FP32 moments are kept; its memory benefit is in activations and its speed benefit in GEMMs. Any recipe that claims to cut state must say which of the five terms it narrows [DERIVED].

**What remains unknown.** The full per-layer precision map of any production model beyond what its report lists is NOT-DISCLOSED. Whether BF16 moments are adequate outside the P13 setting is UNVERIFIED. The exact delayed-scaling formula and margin default in a given Transformer Engine release are to be read from that release [UNVERIFIED here].

## Failure modes

> **Failure mode — Loss-scale collapse.** *Symptom:* S halves repeatedly, most steps skipped. *Cause:* a genuine divergence (inf gradients regardless of S) rather than overflow of the scaled gradient. *Detection:* non-finite gradients persist at S = 1. *Mitigation:* treat as instability ([§20.5](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-5-recovery-interventions.md)), not as a scaling problem.

> **Failure mode — Clipping before unscaling.** *Symptom:* effective clip threshold is c/S; training crawls. *Cause:* Eq. 3.13 applied to S·g. *Detection:* logged norms ≈ S × expected. *Mitigation:* Algorithm 3.8 line order.

> **Failure mode — Lost updates in BF16 storage.** *Symptom:* parameters with large magnitude stop changing; loss plateaus early. *Cause:* Eq. 3.17. *Detection:* fraction of elements with θ_{t+1} = θ_t despite nonzero gradient. *Mitigation:* FP32 master weights or compensated summation.

> **Failure mode — Stale FP8 scale.** *Symptom:* saturation (values at ±448) in one tensor after a distribution shift. *Cause:* delayed amax history lags. *Detection:* per-tensor saturation counters. *Mitigation:* current or block scaling; margin μ.

## Siblings

**FP16 + loss scaling + FP32 master** — this section. Why it exists: FP16's five-bit exponent. What assumption changed: gradients can be rescaled by a scalar. What objective changed: none (S cancels). What problem it solved: gradient underflow. What new failure mode it introduced: overflow of S·g, skipped steps. Changed primitive: backward(ℒ) → backward(S·ℒ) + unscale.

**BF16 (no loss scaling) + FP32 master** — this section. Why it exists: FP32's exponent range in 16 bits. What assumption changed: 7 mantissa bits suffice for operands if accumulation is FP32. What problem it solved: no S, no skipped steps. What new failure mode it introduced: coarser operands; lost updates without a master copy. Changed primitive: exponent 5 → 8 bits.

**FP8 delayed (per-tensor) scaling** — this section; execution in Transformer Engine. Why it exists: one read per quantization. What assumption changed: amax changes slowly step to step. What problem it solved: bandwidth of the amax pass. What new failure mode it introduced: stale scale, saturation. Changed primitive: current amax → historical amax.

**FP8 current (per-tensor) scaling** — this section. Why it exists: exact amax. What assumption changed: two reads are affordable. What new failure mode it introduced: extra read; amax synchronization in distributed gathers. Changed primitive: history → current.

**FP8/FP4 block scaling (MXFP8, NVFP4, P13 tiles)** — this section. Why it exists: per-tensor scales are set by outliers. What assumption changed: a block of 16–128 values shares range. What problem it solved: outlier dominance; enables E4M3 everywhere (P13). What new failure mode it introduced: non-transposable quantized tensors, scale metadata, kernel requirements. Changed primitive: one scale per tensor → one per block.

```figure
id: fig-3.23
kind: compare
title: Five ways to give an FP8 or FP4 tensor its scale
caption: >-
  Read across the granularity row, which runs from one scale per tensor to
  one scale per 16 elements. Every step down that row trades the outlier
  problem of per-tensor scales for scale metadata, layout constraints or
  device requirements. Delayed scaling is the only column that predicts its
  scale instead of measuring it, and that prediction is the one that goes
  stale. The P13 column is PAPER-REPORTED. The others are Transformer Engine
  documentation (R3.12). Where the chapter states nothing, the cell says so.
placement: wide
evidence: OFFICIAL-DOCUMENTATION
source: [R3.12, R3.2, R3.5, P13]
alt: >-
  Comparison of five FP8 and FP4 scaling schemes on where the scale comes
  from and what it adds per quantized tensor. Delayed per-tensor: one scale
  per tensor from a history of prior amax values, one FP32 scale plus an amax
  history, one read of x, negligible overhead, fails by a stale scale that
  saturates at ±448. Current per-tensor: amax of the tensor itself, two reads
  (amax, then cast), extra read and amax synchronization before gathers.
  MXFP8 block: 32 consecutive values, E8M0 power-of-two scale computed
  against max_fp8 = 448, E4M3 elements, 0.25 bit per element, row-wise and
  column-wise copies differ, Blackwell-class devices. NVFP4 block: 16
  elements (16 × 16 for weights), E4M3 scale, FP4 elements, 0.5 bit per
  element, Blackwell-class devices. P13: 1 × 128 activation tiles and
  128 × 128 weight blocks computed online, E4M3 everywhere, scale storage not
  stated, and the report's Appendix B.2 notes block-scaled activations
  destabilising training.
spec:
  axis: "Where an FP8 or FP4 tensor's scale comes from and what it adds per quantized tensor, as documented for Transformer Engine (R3.12) and reported by P13"
  columns:
    - { id: del, label: "Delayed, per tensor" }
    - { id: cur, label: "Current, per tensor" }
    - { id: mx, label: "MXFP8 block" }
    - { id: nv, label: "NVFP4 block" }
    - { id: p13, label: "P13 tiles and blocks" }
  rows:
    - { dimension: "scale granularity", values: { del: "one per tensor", cur: "one per tensor", mx: "32 consecutive values", nv: "16 elements; 16 × 16 for weights", p13: "1 × 128 activation tiles; 128 × 128 weight blocks" } }
    - { dimension: "scale source", values: { del: "history of prior amax values (Algorithm 3.9)", cur: "amax of the tensor being quantized", mx: "block amax against max_fp8 = 448", nv: "block amax", p13: "computed online per tile or block" } }
    - { dimension: "scale storage", values: { del: "one FP32 scale plus an amax history", cur: "one FP32 scale", mx: "E8M0, a power of two", nv: "FP8 E4M3", p13: "not stated in the pages read" } }
    - { dimension: "element format", values: { del: "E4M3 forward, E5M2 gradients (R3.2)", cur: "E4M3 forward, E5M2 gradients (R3.2)", mx: "E4M3", nv: "FP4", p13: "E4M3 on all tensors" } }
    - { dimension: "reads of x per quantization", values: { del: "one", cur: "two: amax, then cast", mx: "not stated here", nv: "not stated here", p13: "not stated here" } }
    - { dimension: "scale overhead, Eq. 3.4", values: { del: "negligible", cur: "negligible", mx: "8/32 = 0.25 bit per element", nv: "8/16 = 0.5 bit per element", p13: "not derived here" } }
    - { dimension: "new failure mode", values: { del: "stale scale, saturation at ±448", cur: "extra read; amax synchronization before gathers", mx: "row- and column-wise copies differ; not transposable", nv: "scale metadata; kernel availability", p13: "block-scaled activations destabilising training (App. B.2)" } }
    - { dimension: "device requirement", values: { del: "not stated here", cur: "not stated here", mx: "Blackwell-class (TE docs)", nv: "Blackwell-class (TE docs)", p13: "the report's target device" } }
```

**8-bit optimizer states** — [§20.1](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-1-optimizer-mechanics.md) (R3.23). Why it exists: moments are half the state. Changed primitive: FP32 moment → block-quantized moment.

## Extensions

Adaptation with adapters ([§23](../../part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/README.md), forward) keeps only adapter master weights in FP32 and the frozen base in a narrow format, which is a different budget under Eq. 3.18. Long context shifts the memory term from state to activations, favoring the FP8 activation cache of P13. For inference, only b_param survives, which is why §40.2's targets differ from training's (proposal-level statements).

## Limitations

Eq. 3.17 uses the initialization scale as a proxy; trained parameter magnitudes vary by layer. The FP8 recipes are documented for specific device generations (MXFP8 and NVFP4 require Blackwell-class hardware per Transformer Engine docs [OFFICIAL-DOCUMENTATION — R3.12]) and do not run elsewhere. Falsification: a BF16-master run matching the FP32-master run on Experiment 3.4 would contradict Eq. 3.17 at that learning-rate/magnitude regime. Decision consequence: choose the master/moment precision by Eq. 3.17 and Eq. 3.18, then the operand format by the device.

## Reproducibility

Record: autocast dtype, reduced-precision-reduction flags, GradScaler parameters (or none), FP8 recipe class and its options, amax history length, block sizes, and the Transformer Engine / TorchAO release. Unresolved: delayed-scaling formula defaults (UNVERIFIED), production precision maps (NOT-DISCLOSED).

## References

P13, P18; R3.2, R3.3, R3.4, R3.5, R3.11, R3.12, R3.13, R3.14, R3.23.
