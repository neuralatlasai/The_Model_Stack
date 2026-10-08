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
word_count_target: 2500
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 3.4 Mixed-precision execution

## Scope

[DERIVED] A precision recipe assigns representations to operands, accumulators, saved activations, gradients, persistent parameters, optimizer states, and scales. This section explains the resulting state transitions, loss scaling, FP32 update storage, FP8 current and delayed scaling, block scaling, and the documented progression to FP4 training. It distinguishes numerical mechanisms from hardware throughput claims. Optimizer algorithms and distributed state placement remain canonical in Chapters 20 and 29; inference quantization remains in Chapter 40.

## Why this exists

[PAPER-REPORTED] Mixed Precision Training identifies gradient underflow and ineffective small parameter updates as separate failure mechanisms, addressed with loss scaling and FP32 update storage. Its narrow operands and wider accumulators establish a role-based recipe, rather than a claim that every intermediate can safely be FP16. [R3.3, §3](references.md).

[MATHEMATICALLY-DERIVED] A wider accumulator cannot recover information already lost when an operand was quantized. Conversely, accurate operands do not prevent a small optimizer increment from rounding away in a narrow persistent parameter. The two errors occur at different state boundaries and need different controls. BF16's exponent width reduces FP16-style range failures but its coarser significand can increase operand error or lost updates.

## Intuition

[MATHEMATICALLY-DERIVED] Loss scaling changes the units of backward quantities before they enter narrow representations. Quantization scaling changes the units of a tensor before encoding its individual elements. Persistent FP32 parameters retain increments across steps even when a derived narrow operand remains unchanged for several steps. These mechanisms interact but are not substitutes: a tensor scale does not increase the accumulator's significand, and a loss scale does not enlarge the forward pass's exponent range.

## Formulation

[MATHEMATICALLY-DERIVED] For a constant positive scale $S$, exact differentiation gives

$$
\nabla_\theta(S\mathcal L)=S\nabla_\theta\mathcal L,
\qquad \widehat g=\widehat{\nabla(S\mathcal L)}/S.
$$
*(Eq. 3.15)* The hat covers the entire rounded backward computation; replacing it by a single terminal FP16 rounding would hide intermediate underflow and overflow. The same $S$ must apply to every accumulated micro-batch before unscaling. Scaling cannot restore values lost before the multiplication by $S$.

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

[MATHEMATICALLY-DERIVED] For finite tensor $x$, let $a=\max|x_i|$ and $M$ be the largest finite element-format value. A basic encode/decode pair is

$$
s_{\rm enc}=M/a,\qquad q_i=Q(s_{\rm enc}x_i),\qquad
\widehat x_i=q_i/s_{\rm enc}\quad(a>0).
$$
*(Eq. 3.16)* For an all-zero block, choose a finite positive scale and encode zeros. For a non-finite maximum, reject or follow an explicitly documented propagation rule; computing $M/\infty$ and multiplying by infinity is not a valid recovery mechanism. Real recipes can add margins, power-of-two constraints, clipping, or rounded scale storage.

[MATHEMATICALLY-DERIVED] Let $w^-<w<w^+$ be the adjacent finite representable values around stored parameter $w$. Round-to-nearest returns $w$ after update $\Delta$ precisely in the open interval

$$
-\frac{w-w^-}{2}<\Delta<\frac{w^+-w}{2},
$$
*(Eq. 3.17)* with endpoint ties determined by the rounding rule. The interval is direction-dependent at binade boundaries. For BF16 $w=1$, the positive half-spacing is $2^{-8}$, but the negative half-spacing is $2^{-9}$. Thus $|\Delta|<u|w|$ is not a universal necessary-and-sufficient lost-update criterion. FP32 reduces this interval; it does not eliminate lost updates for arbitrarily small increments.

```figure
id: fig-3.19
kind: calculator
title: Directional BF16 midpoint boundaries at w = 1
caption: >-
  At the exactly representable BF16 value w=1, the upward neighbor is
  1+2^-7 and the downward neighbor is 1-2^-8. The two half-spacings differ.
  For an update magnitude d, a positive margin means the update lies inside
  that directional unchanged-value interval. Endpoint ties require the
  nearest-even parity rule; no floating-point update simulator is implied.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.17", "DERIVED:eq-3.2"]
alt: >-
  BF16 at w1 has positive half-spacing2^-8 and negative half-spacing2^-9.
  An update magnitude0.003 lies below the positive threshold and above the
  negative threshold. Equal magnitudes in opposite directions therefore
  need not have the same unchanged-update outcome.
spec:
  tex: '-(w-w^-)/2 < \Delta < (w^+-w)/2'
  equation: "3.17"
  inputs:
    - { symbol: d, label: "update magnitude d", default: 0.003, min: 0.0001, max: 0.01, scale: log10, format: raw }
  outputs:
    - { symbol: hp, label: "positive half-spacing", formula: "2^-8", format: raw }
    - { symbol: hn, label: "negative half-spacing", formula: "2^-9", format: raw }
    - { symbol: mp, label: "positive unchanged-interval margin", formula: "2^-8-d", format: raw }
    - { symbol: mn, label: "negative unchanged-interval margin", formula: "2^-9-d", format: raw, emphasis: true }
  presets:
    - { label: "magnitude0.001", values: { d: 0.001 } }
    - { label: "magnitude0.003", values: { d: 0.003 } }
    - { label: "magnitude0.005", values: { d: 0.005 } }
```

[DERIVED] Parameter-state accounting must name every retained copy:

$$
M_{\rm state}=P(b_{\rm persistent}+b_g+b_m+b_v)
+\sum_jP_jb_{{\rm operand},j}+M_{\rm scales}+M_{\rm auxiliary}.
$$
*(Eq. 3.18)* If the persistent parameter itself is FP32, it is the update storage and no additional FP32 master is counted. The classic FP16 parameter/gradient plus FP32 master/moments layout has $2+2+4+4+4=16$ bytes per parameter, before activations and workspaces. An FP32 parameter/gradient/moment layout also has 16 bytes, but different copies and traffic. Temporary autocast operands are not necessarily persistent copies.

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
  A hypothetical one-byte operand with BF16 moments gives13B/parameter before scale, copy and exemption overhead. The
  80 GiB line is an illustrative budget, not a product specification.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-3.18", P18]
alt: >-
  Four stacked bars of training-state bytes for 5e9 parameters against an
  illustrative 80 GiB budget line. FP32 everywhere, 16 bytes per parameter
  (weights 4, gradients 4, Adam m 4, v 4): 74.5 GiB. FP16 with an FP32 master,
  the P18 accounting, 16 bytes (FP16 weights 2, FP16 gradients 2, FP32
  master 4, m 4, v 4): 74.5 GiB. BF16 operand copy kept with FP32 gradients,
  master and moments, 18 bytes (2 + 4 + 4 + 4 + 4): 83.8 GiB, over the line.
  Hypothetical FP8/BF16-state, 13 bytes (FP8 operand copy 1, FP32 gradients 4, FP32 master 4,
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
    - label: "Hypothetical FP8/BF16-state, 13 B/param"
      segments:
        - { label: "FP8 operand copy, 1 B", kind: tensor, formula: "1*N" }
        - { label: "FP32 gradients, 4 B", kind: tensor, formula: "4*N" }
        - { label: "FP32 master, 4 B", kind: memory, formula: "4*N" }
        - { label: "AdamW m, BF16, 2 B", kind: memory, formula: "2*N" }
        - { label: "AdamW v, BF16, 2 B", kind: memory, formula: "2*N" }
  budget: { label: "illustrative 80 GiB budget, not a product spec", formula: "80*2^30" }
```

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] PyTorch autocast chooses eligible operations' execution dtypes; it does not cast the whole model or promise that every reduction is FP32. In-place operations and operations with explicit output storage follow separate eligibility rules. Its AMP examples keep ordinary parameters in their original dtype and use a scaler when appropriate. Therefore modern AMP with FP32 parameters need not maintain the classic separate FP16-parameter/FP32-master pair. [R3.32/R3.34](references.md).

[MATHEMATICALLY-DERIVED] Dynamic scaling is a state machine over $S$, a successful-update count, and the optimizer state. Non-finite scaled gradients cause an update skip and scale backoff. Finite gradients permit unscaling and clipping, followed by an update and eventual scale growth. If gradient components span more range than the format can represent simultaneously, no single scalar makes every component representable. A finite gradient check also does not prove accuracy: small gradients can have rounded to zero without creating NaNs or infinities.

[OFFICIAL-DOCUMENTATION] PyTorch documents default scaler values $S_0=65536$, growth factor 2, backoff factor 0.5, and growth interval 2000. It explicitly allows scales below one; a BF16-pretrained model converted to FP16 can overflow because FP16's range is smaller. Unscaling happens once per optimizer after accumulation, and scale updates occur at effective-batch boundaries. These are the inspected 2.14 documentation semantics, not a tested runtime configuration. [R3.32/R3.34](references.md).

[MATHEMATICALLY-DERIVED] BF16 has FP32's exponent-bit count but not its exact finite maximum or significand precision. Using it without a loss scaler removes scaler state and passes; it does not prove the absence of underflow, overflow, non-finite norms, or ineffective increments. Wider parameter and optimizer representations remain separate choices whose suitability depends on the observed update and state distributions.

[OFFICIAL-DOCUMENTATION] Transformer Engine current scaling obtains a maximum from the tensor being quantized. Delayed scaling uses retained maximum history and records the new maximum during quantization, reducing the need for a separate full-tensor maximum pass. The inspected delayed recipe uses a direct ratio to its selected history statistic, with an optional margin; it is not universally a power-of-two scale. Staleness can expose new outliers to saturation. [R3.43/d](references.md).

[MATHEMATICALLY-DERIVED] Block scaling limits one outlier's influence to its block, at the cost of scale bytes, scale computation, and layout constraints. If blocks follow rows, quantizing $W$ and quantizing $W^\top$ generally produce different reconstructed matrices: transpose changes the elements sharing a scale. Keeping distinct row/column copies or using square scaling blocks resolves different implementation needs, with different error and memory costs.

[PAPER-REPORTED] The MX method uses blocks of 32 elements and an E8M0 shared scale. Its reference conversion chooses a block exponent from the maximum exponent and element-format range, with explicit clamping. Its implementation studies quantized dot-product inputs while retaining wider vector operations and update storage; the paper does not specify a unique physical tensor layout. [R3.5, §§2–4, Algorithm 1](references.md).

[PAPER-REPORTED] DeepSeek-V3 quantizes inputs of the three Linear GEMMs to E4M3, retaining higher precision for sensitive operations. It uses $1\times128$ activation and $128\times128$ weight scaling, with periodic FP32 promotion of partial sums at interval 128. FP32 master parameters and gradients coexist with BF16 optimizer moments. This is a specific implementation recipe, not an all-tensor E4M3 system. [P13, §3.3](references.md).

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
  Element format E4M3 on Linear GEMM inputs. Activations scaled per 1 × 128 tile
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
    - { key: "element format", value: "E4M3 on Linear GEMM inputs" }
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

[DERIVED] With one 8-bit scale per 32 FP8 elements, scale overhead is 0.25 bits per element. One 8-bit scale per 16 FP4 elements adds 0.5 bits, yielding 4.5 bits before tensor-level scales, alignment, metadata, and alternate copies. NVFP4 also includes an FP32 tensor scale, verified in the current official format description. The illustrative 13-byte state row in Fig.3.20 combines hypothetical one-byte operand, four-byte gradient/master, and two-byte moments; it is not DeepSeek-V3's measured total allocation. [R3.41](references.md).

## Algorithm

[DERIVED] The update ordering below exposes which state changes on a skip. Extra checks introduced by a surrounding optimizer must also leave parameters and moments unchanged when rejecting the update.

```text
Algorithm 3.8 — Scaled effective-batch update
INPUT  effective batch, scaler state, clipping threshold and optimizer
OUTPUT  accepted/skipped update and updated scaler state
STATE  fixed S, gradients, parameters, moments and growth counter
INVARIANT  S is unchanged across all accumulated micro-batches
1. clear gradients; hold scale S constant
2. for micro_batch:
3.     backward(S * summed_valid_loss / effective_valid_count)
4. unscale gradients once
5. if any gradient is nonfinite:
6.     skip optimizer update; back off S; reset growth counter
7. else:
8.     check finite global norm; clip in unscaled units
9.     update persistent parameters and moments once
10.     advance accepted-update counter and scaler growth state
11. clear or discard accumulated gradients before the next effective batch
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: one effective-batch forward/backward plus O(P) unscale/clip/update work
```

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

[DERIVED] This abstract delayed-scaling algorithm uses the inspected direct-ratio semantics. Exact history rotation, initial-scale behavior, and distributed reduction remain recipe/version fields.

```text
Algorithm 3.9 — Delayed tensor scaling
INPUT  tensor x, previous maximum history, format maximum M and margin
OUTPUT  codes, inverse scale and updated history
STATE  history and finite initialized scale
INVARIANT  current encoding scale depends on selected prior history
1. a_hat = selected_statistic(previous_amax_history)
2. s = M / (a_hat * 2**margin), if a_hat is finite and positive
3. otherwise retain the documented finite initialization/fallback scale
4. (q, a_current) = quantize_and_measure_amax(x, s)
5. rotate/update history with a_current
6. return q, inverse(s), updated_history
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: one quantization/maximum pass plus history reduction; kernel fusion matters
```

[PAPER-REPORTED] Algorithm 3.10 follows the reference MX exponent-selection construction. A zero block is handled separately; non-finite input behavior and exceptional scales follow the normative conversion contract rather than a guessed clipping rule. [R3.5, Algorithm 1; R3.6, §6.3](references.md).

```text
Algorithm 3.10 — Reference MX-style finite block conversion
INPUT  finite block, element exponent limit and shared-scale representation
OUTPUT  encoded scale and quantized elements
STATE  shared exponent and output block
INVARIANT  all elements share the returned decode scale
1. if all block elements are zero: return zero elements and finite unit scale
2. e_shared = floor(log2(max(abs(block)))) - e_max_element
3. bound e_shared to the scale representation's allowed range
4. scale = 2**e_shared
5. elements = round_and_clamp(block / scale, selected_element_format)
6. return encoded_scale, elements
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: O(block size) work plus one maximum reduction
```

## Implementation

[OFFICIAL-DOCUMENTATION] The inspected Transformer Engine 2.20.2 surfaces distinguish per-tensor FP8, MXFP8, and NVFP4 recipes and their hardware restrictions. TorchAO's unpinned training documentation distinguishes established float8 Linear conversion from prototype workflows, exposing tensorwise, rowwise, and high-precision-weight-gradient recipe variants. These are implementation choices, not interchangeable format names. [R3.41–R3.45, R3.14](references.md).

[DERIVED] Scaling costs depend on fusion. A separate current-maximum pass reads the tensor before quantization; a fused delayed pass can record the next maximum while producing current codes. Requantizing a transposed operand adds conversion and possibly storage. Communication is zero in this section's single-device boundary; distributed maximum synchronization, compressed dispatch, and gradient collectives require their own Chapter 29 accounting. Source hardware peaks do not establish application latency, energy, or monetary cost.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Mixed Precision Training reports task-dependent necessity of scaling. Its VOC detection comparison gives SSD 76.9 mAP in FP32, divergence without scaling, and 77.1 with scale 8; Faster R-CNN has different sensitivity. The large language-model experiment uses a two-layer 8192-unit LSTM, 1024-dimensional projections, sampled softmax, and scale128; the unscaled run diverges after approximately 300,000 iterations. These are accuracy/convergence studies, not end-to-end Tensor Core speed measurements. [R3.3, §4](references.md).

[PAPER-REPORTED] DeepSeek-V3's two-scale validation uses 16B and 230B MoE configurations trained for approximately 1.33T and 0.9T tokens, reporting relative loss differences below 0.25%. A separate activation-gradient scaling ablation diverges around 300B tokens for the 16B configuration when a coarse block scheme replaces the chosen treatment. The negative result constrains generalization of the successful recipe. [P13, AppendixB](references.md).

## Observations

**What the paper claims.** [PAPER-REPORTED] The FP16 and fine-grained FP8 studies report successful selected recipes alongside failing nearby scaling choices. Their protocols above delimit that evidence. [R3.3 section 4; P13 AppendixB](references.md).

**What the evidence shows.** [DERIVED] These comparisons support role-specific precision and long-horizon scrutiny. They do not establish equal final quality under arbitrary scales or a universal ordering of 2026 FP4 recipes. The source results were not independently reproduced here.

**What we infer.** [MATHEMATICALLY-DERIVED] Wider accumulation cannot restore already erased operands, and wider persistent storage addresses a separate local increment interval. A headline bit width therefore determines neither the complete error budget nor retained-state memory.

**What remains unknown.** [UNVERIFIED] Exact application allocations, native-kernel reproduction and production corner paths remain unchecked. Missing production precision maps are not inferred from the published successful recipe.

## Failure modes

[DERIVED] Repeated scale backoff may indicate either scaled-gradient overflow or genuine forward instability; observing non-finites at scale one does not distinguish them universally. A stale FP8 maximum can saturate a sudden outlier. BF16 persistent updates can fall inside Eq.3.17's interval. Coarse block scales can erase smaller channels. Incorrect transposed-copy reuse changes the matrix in backward. Diagnostics therefore record saturation, zeroing, scale history, finite status, and actual neighboring representable parameter values separately.

## Siblings

[DERIVED] FP16 loss scaling addresses backward range. FP8 tensor scaling addresses encoded operand range. Block scaling localizes that range allocation. Wider master storage addresses update retention. Quantized optimizer states address persistent memory, with a separate error path. These interventions can coexist; their byte and error budgets cannot be inferred from the model's headline precision.

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

## Extensions

### Improvements

[PAPER-REPORTED] NVIDIA's 2025 NVFP4 study combines FP4 elements, local E4M3 scales, a global FP32 scale, weight scaling over $16\times16$ tiles, stochastic gradient rounding, and size 16 randomized Hadamard transforms for weight-gradient operands. Sensitive layers and FP32 optimizer/update states remain wider. Its 12B hybrid model trains for 10T tokens against FP8; removing each component harms convergence, and quantizing every Linear layer diverges. The MMLU-Pro scores are 62.58 versus 62.62, while task-specific results vary. [R3.27, §§3–4, AppendixE](references.md).

[PAPER-REPORTED] QuartetII (January 2026) addresses gradient-estimation bias with MS-EDEN. In rotated coordinates it rescales reconstruction by $\|x\|^2/\langle x,\widehat x\rangle$, applying the correction through shared scales and stochastic scale rounding. It requires compatible weight requantization; isolated activation-gradient and weight-gradient ablations distinguish this from independently unbiased scalar rounding. Experiments cover C4 scaling studies and Nanochat pretraining, with a reported 15–25% reduction in the validation loss gap to BF16. Kernel speedups and full-training throughput have separate measurement boundaries. [R3.28, §§3,6–7](references.md).

[PAPER-REPORTED] Full-Stack FP4 (July 2026) extends the scope to projections, optimizer states, and selected attention paths. Its second-moment pipeline quantizes a centered, rotated square-root state and reconstructs before squaring. Sensitive attention products remain BF16. The 3B/64B-token study reports a 1.47% loss gap to BF16 Root+AdamW, using fake quantization on 8 A800 80 GB GPUs. This supports a simulated numerical recipe; it does not measure native FP4 throughput on Blackwell. Its code release is prospective. [R3.29, §§3–4, AppendixH](references.md).

## Limitations

[UNVERIFIED] This revision does not independently reproduce those convergence or speed measurements. The2026 FP4 papers are versioned preprints with finite workload coverage; no universal recipe ordering follows from their different models, token budgets, baselines, and execution modes. Scale-zero boundaries and exact kernels also require executable review before adoption.

## Reproducibility

[DERIVED] A reproducible recipe records the precision of every state role, scale direction and representation, block axes, conversion order, rounding/saturation mode, history updates, accumulation schedule, skip semantics, and retained copies. The proposed comparisons in [verification.md](verification.md) isolate these choices instead of assuming a narrow-format name specifies them.

## References

[DERIVED] Methods and actual experiment locators are recorded under [R3.2–6, R3.32/R3.34, R3.41–R3.45, R3.14, R3.27–29, P13, P18](references.md).
