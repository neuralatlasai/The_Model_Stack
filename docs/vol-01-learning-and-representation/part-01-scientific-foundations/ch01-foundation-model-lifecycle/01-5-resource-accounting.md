---
id: ms.section.1.5
entity_type: section
title: Resource accounting
short_title: Resource ledger
volume: 1
part: 1
chapter: 1
section: 1.5
slug: 01-5-resource-accounting
parent: ms.chapter.1
prev_sibling: ms.section.1.4
next_sibling: ms.section.1.6
children: []
prerequisites: [ms.frontmatter.notation, ms.section.1.1, ms.section.1.3]
downstream: [ms.section.5.6, ms.section.21.2, ms.section.25.3, ms.section.30.2, ms.section.34.6, ms.section.42.2, ms.section.48.3, ms.section.48.5]
related: [ms.section.1.4]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P08}
  - {type: supported_by, target: paper.P09}
  - {type: supported_by, target: paper.P13}
  - {type: prerequisite_of, target: ms.section.21.2}
axes:
  lifecycle: [pretraining, inference, serving]
  mechanism: [resource_accounting, roofline, cost_model]
  feedback_setting: []
  modality: [text]
papers: [P08, P09, P13, P19, P36]
implementations: [impl.nvidia-nccl, impl.amd-rccl, impl.vllm, impl.sglang, impl.tensorrt-llm]
benchmarks: []
datasets: []
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED, ASSUMED]
  empirically_observed: false
word_count_target: 1700
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 1.5 Resource accounting

## Scope

Objective: fix the ten resource dimensions (parameters, tokens, FLOPs, memory capacity, memory traffic, communication, latency, throughput, energy, monetary cost) as a ledger with units, what each bounds, where it is measured, and which label its value can carry. Baseline: "compute" as a single number. Success criterion: every mechanism in the book can be given a cost line in these ten entries, or an explicit NOT-DISCLOSED / UNVERIFIED. Boundaries: derivations live with their owners ([21](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/README.md) scaling, [25.3](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/25-3-roofline-reasoning.md) roofline, [30.2](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/30-2-memory-management.md) training memory, [42.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-2-state-accounting.md) KV state, [48.3](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-3-metrics.md)–[48.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-5-economics.md) latency and economics).

## Why this exists

What failed: parameter count stood in for cost, peak FLOP/s stood in for throughput, GPU-hours stood in for money, and none of them predicted latency. The bottleneck is that the ten quantities are bound by different physical limits (arithmetic units, HBM bandwidth, fabric bandwidth, power delivery, budget) and convert into one another only through hardware- and workload-specific ratios. The dominant constraint at decode is memory traffic, not FLOPs; at pretraining it is FLOPs and communication; at the invoice it is wall-clock occupancy of accelerators. What changed: scaling-law work made loss a function of N, D, and C separately (PAPER-REPORTED · P08) and then made the N–D split at fixed C a decision (PAPER-REPORTED · P09), which forces at least three ledger entries into any training plan; serving work made memory traffic and capacity the binding entries at inference (PAPER-REPORTED · P19, P36).

## Intuition

Physically, the ledger is ten meters on one machine. Parameters are bytes at rest; tokens are the volume of data pushed through; FLOPs are arithmetic performed; memory capacity is the largest working set that fits; memory traffic is bytes moved between HBM and compute per unit work; communication is bytes moved between devices; latency is time per request; throughput is work per time; energy is power integrated over wall time; money is energy, hardware occupancy, and labor priced. No meter can be read off another without a conversion factor that must itself be measured.

Heuristically, FLOPs are "how much thinking", traffic "how much reading", and communication "how much talking". The analogy fails exactly where it is needed: a decode step does little arithmetic and much reading, so "more thinking" is not what makes it slow.

## Formulation

> **Definition — resource ledger.** The ten-entry record (N, D, C, M_cap, traffic, comm, latency, throughput, energy, money) attached to a mechanism, an intervention, or a deployment, each entry with unit, bound direction, measurement boundary, and evidence label.

> **Definition — cost line.** The one-line rendering of a mechanism's ledger, or NOT-DISCLOSED / UNVERIFIED for entries no cited source or derivation supports.

| Entry | Symbol / unit | Bounds | Where measured | Typical label |
|---|---|---|---|---|
| Parameters | N (count; N_total vs N_act) | memory capacity, weight traffic per step | config file | KNOWN (open) / NOT-DISCLOSED |
| Tokens | D (count; available/sampled/consumed) | training FLOPs, data cost | data loader counters | PAPER-REPORTED / KNOWN |
| FLOPs | C (FLOPs) | wall time at achievable FLOP/s | derived (Eq. N.3, Eq. 1.5) or profiler | MATHEMATICALLY-DERIVED |
| Memory capacity | M_* (bytes) | feasibility per device | allocator peak | MATHEMATICALLY-DERIVED + ASSUMED constants |
| Memory traffic | bytes per step | decode step time via Eq. N.4 | profiler counters | DERIVED / UNVERIFIED |
| Communication | bytes per step, collective type | step time overlap, scaling efficiency | NCCL/RCCL counters | OFFICIAL-DOCUMENTATION / UNVERIFIED |
| Latency | TTFT, TPOT, ITL, E2E; p50/p95/p99 (s) | SLO feasibility | client or server boundary, stated | measured only |
| Throughput | tokens/s/GPU, requests/s, goodput | capacity | server counters over a window | measured only |
| Energy | J or kWh; average power × wall time × devices, × PUE at the facility boundary | carbon, cost | power meters / vendor telemetry | UNVERIFIED unless metered |
| Money | currency; price × quantity, cost per accepted task | budget | invoices | ASSUMED (planning) / NOT-DISCLOSED |

Training FLOPs use [Eq. N.3](../../../front-matter/notation.md)'s C ≈ 6ND with its stated assumptions. Inference FLOPs per generated token for a dense decoder-only model with full-context attention:

$$
\text{FLOPs}_{\text{token}} \;\approx\; 2\,N_{\text{act}} \;+\; 4\,L\,S\,d_{\text{model}}
$$
*(Eq. 1.5)* where N_act = activated parameters, L = layers, S = current context length, d_model = residual width; the first term is one multiply-add per weight, the second is the query–key and attention–value products over S positions with H_q d_h = d_model; excludes softmax, normalization, and any recomputation.

```figure
id: fig-1.23
kind: chart
title: Inference FLOPs per generated token against context length, Eq. 1.5
caption: >-
  Illustrative configuration, not a named model. The weight term is flat at
  16 GFLOP; the attention term grows linearly in S, is 21% of the total at
  8K, equals the weight term at S = 2·N_act/(4·L·d_model) ≈ 30.5K and is 4.3
  times it at 128K. The habit of '2N FLOPs per token' is the dashed line
  alone, a fair approximation only well to the left of the crossing.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-1.5"
alt: >-
  Log–log line chart of FLOPs per generated token against current context
  length S from 512 to 131,072 tokens, for an illustrative dense decoder with
  N_act = 8·10⁹, L = 32 and d_model = 4096, not a named model. The weight
  term 2·N_act is constant at 16 GFLOP. The attention term 4·L·S·d_model is
  0.27 GFLOP at S = 512, 4.3 GFLOP at 8,192, 16 GFLOP at about 30,518 and
  68.7 GFLOP at 131,072. Their sum, Eq. 1.5, is 20.3 GFLOP at 8,192
  (attention 21% of it) and 84.7 GFLOP at 131,072.
spec:
  type: line
  x: { label: "current context length S", scale: log2, format: tokens, domain: [512, 131072] }
  y: { label: "FLOPs per generated token", scale: log2, format: flops }
  variables: { Na: 8e9, L: 32, d: 4096 }
  series:
    - { id: weights, label: "2·N_act, one multiply-add per weight", formula: "2*Na", sample: { from: 512, to: 131072, count: 9 }, dashed: true }
    - { id: attn, label: "4·L·S·d_model, scores and values", formula: "4*L*x*d", sample: { from: 512, to: 131072, count: 9 } }
    - { id: total, label: "FLOPs_token, Eq. 1.5", formula: "2*Na + 4*L*x*d", sample: { from: 512, to: 131072, count: 9 }, emphasis: true }
  annotations:
    - { x: 8192, label: "S = 8K: attention 21% of total" }
    - { x: 30518, label: "S ≈ 30.5K: the two terms are equal" }
    - { x: 131072, label: "S = 128K: attention 4.3× weights" }
```

Decode step time at batch B is bounded below by the larger of the compute and traffic times (an instance of [Eq. N.4](../../../front-matter/notation.md)):

$$
t_{\text{step}} \;\ge\; \max\!\left(\frac{B\,\text{FLOPs}_{\text{token}}}{P_{\text{peak}}},\; \frac{N_{\text{act}}\, b + M_{KV}(B, S)}{B_{\text{mem}}}\right)
$$
*(Eq. 1.6)* where b = bytes per weight value, M_KV from [Eq. N.8](../../../front-matter/notation.md), P_peak and B_mem from the notation table; for a dense model (N_act = N_total) the traffic term reads every weight once per step regardless of B, which is why small-batch decode is traffic-bound. For a routed MoE at B > 1 the weights read per step are the union of the experts activated across the batch, at least N_act and growing with B, so N_act b understates the traffic and Eq. 1.6 holds there only as a looser lower bound (DERIVED from the N_act definition of Eq. 1.4).

```figure
id: fig-1.24
kind: calculator
title: Decode-step traffic and compute, Eq. 1.5 and 1.6
caption: >-
  The traffic-bound test of the claim below, without inventing hardware:
  the step is traffic-bound on any accelerator whose B_mem/P_peak is below
  the demand output, the bytes the step moves per FLOP it performs. Fixed:
  L = 32, d_model = 4096, d_h = 128; illustrative configuration, not a named
  model. Scroll: batch 1, 8 and 64, weight-only compression, a shorter and a
  longer context. Watch the weight share and the demand, not the FLOPs.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-1.5", "DERIVED:eq-1.6"]
concepts: [ms.section.1.5]
alt: >-
  Calculator for Eq. 1.5 and the two numerators of Eq. 1.6, with L = 32,
  d_model = 4096 and d_h = 128 fixed, an illustrative configuration and not
  a named model. Inputs: activated parameters N_act, context length S, batch
  B, bytes per weight b, KV heads H_kv and bytes per cache value. At the
  defaults (N_act = 8·10⁹, S = 8,192, B = 1, b = 2, H_kv = 8, 2-byte cache):
  20.3 GFLOP per token; M_KV = 1 GiB; 15.9 GiB moved per step; 20.3 GFLOP per
  step; a demand of 0.841 bytes per FLOP; weights 94% of the bytes moved. At
  B = 8: M_KV 8 GiB, 22.9 GiB moved, 0.151 bytes per FLOP, weights 65%. At
  B = 64: 78.9 GiB moved, 0.065 bytes per FLOP, weights 19%. With b = 1 at
  B = 1: 8.45 GiB moved, FLOPs unchanged. At S = 1,024: 16.5 GFLOP and 15.0
  GiB moved. At S = 32,768: 33.2 GFLOP, 4 GiB of cache, 0.612 bytes per FLOP.
states:
  - { anchor: formulation, label: "B = 1 · S = 8K", variables: { Na: 8e9, S: 8192, B: 1, b: 2, Hkv: 8, bkv: 2 }, highlight: [Tr, Dm], note: "Batch 1 at 8K: 15.9 GiB moved for 20.3 GFLOP, 0.841 bytes per FLOP. The weight read is 94% of the traffic and is paid once per step whatever B is." }
  - { anchor: mechanism, label: "pass one · B = 8", variables: { Na: 8e9, S: 8192, B: 8, b: 2, Hkv: 8, bkv: 2 }, highlight: [KV, Tr, Wf], note: "Pass one fills these rows from the config alone. At B = 8 the cache is the notation's 8 GiB; the step moves 22.9 GiB, the demand falls to 0.151, and weights are 65% of the bytes." }
  - { anchor: experimental-design, label: "sweep end · B = 64", variables: { Na: 8e9, S: 8192, B: 64, b: 2, Hkv: 8, bkv: 2 }, highlight: [Dm, Wf], note: "The proposed sweep's last point: 78.9 GiB per step and 0.065 bytes per FLOP. Batching amortizes the weight read, not the cache: the demand floor is m/F = 0.053, not zero." }
  - { anchor: observations, label: "b halved · B = 1", variables: { Na: 8e9, S: 8192, B: 1, b: 1, Hkv: 8, bkv: 2 }, highlight: [Tr, F], note: "Weight-only compression halves b: 15.9 GiB becomes 8.45 GiB per step while FLOPs stay at 20.3 G. Eq. 1.6 predicts the small-batch latency gain without touching compute." }
  - { anchor: failure-modes, label: "FLOPs-as-latency · S = 1K", variables: { Na: 8e9, S: 1024, B: 1, b: 2, Hkv: 8, bkv: 2 }, highlight: [F, Tr], note: "Cutting S from 8K to 1K removes 18.5% of the FLOPs but only 5.5% of the bytes (15.0 GiB still move); a traffic-bound step barely gets faster." }
  - { anchor: extensions, label: "long context · S = 32K", variables: { Na: 8e9, S: 32768, B: 1, b: 2, Hkv: 8, bkv: 2 }, highlight: [F, KV], note: "At 32K the attention FLOPs (17.2 G) pass the weight term (16 G) and the cache reaches 4 GiB per sequence, yet the step still demands 0.612 bytes per FLOP." }
spec:
  tex: >-
    t_{\text{step}} \ge \max\!\left(\frac{B\,\text{FLOPs}_{\text{token}}}{P_{\text{peak}}},\ \frac{N_{\text{act}}\,b + M_{KV}(B,S)}{B_{\text{mem}}}\right),\qquad \text{FLOPs}_{\text{token}} \approx 2N_{\text{act}} + 4LS\,d_{\text{model}}
  equation: "1.6"
  inputs:
    - { symbol: Na, label: "activated parameters N_act", default: 8e9, min: 1e9, max: 1e11, scale: log10, format: params }
    - { symbol: S, label: "context length S", default: 8192, min: 512, max: 131072, scale: log2, format: tokens }
    - { symbol: B, label: "batch B", default: 1, min: 1, max: 256, scale: log2, format: integer }
    - { symbol: b, label: "bytes per weight b", default: 2, min: 0.5, max: 2, options: [0.5, 1, 2], format: bytes }
    - { symbol: Hkv, label: "KV heads H_kv (d_h = 128)", default: 8, min: 1, max: 32, options: [1, 8, 32], format: integer }
    - { symbol: bkv, label: "bytes per cache value", default: 2, min: 1, max: 2, options: [1, 2], format: bytes }
  outputs:
    - { symbol: F, label: "FLOPs per token, Eq. 1.5", formula: "2*Na + 4*32*S*4096", format: flops }
    - { symbol: KV, label: "M_KV(B, S), Eq. N.8", formula: "2*32*B*S*Hkv*128*bkv", format: bytes }
    - { symbol: Tr, label: "bytes moved per step, N_act·b + M_KV", formula: "Na*b + KV", format: bytes, emphasis: true }
    - { symbol: Cp, label: "FLOPs per step, B·FLOPs_token", formula: "B*F", format: flops }
    - { symbol: Dm, label: "demand: bytes per FLOP", formula: "Tr/Cp", format: fixed3, emphasis: true }
    - { symbol: Wf, label: "weight share of bytes moved", formula: "Na*b/Tr", format: percent }
```

Energy and money are not derivable from the entries above without measured factors:

$$
E_{\text{run}} = \bar{P}\, t_{\text{wall}}\, n_{\text{dev}}\cdot \text{PUE}, \qquad
\text{Money} = \sum_r \text{price}_r \cdot \text{quantity}_r
$$
*(Eq. 1.7)* where P̄ = measured average device power, t_wall = wall time, n_dev = devices, PUE = facility overhead factor at the facility boundary (1 at the device boundary), r ranges over priced resources (device-hours, storage, egress, labor); cost per accepted task then follows [notation §2.10](../../../front-matter/notation.md).

```figure
id: fig-1.25
kind: calculator
title: Run energy from occupancy, power and facility overhead, Eq. 1.7
caption: >-
  Every input is a planning placeholder, not a device specification or a
  measurement. Read the last row: a device-hour becomes energy only through
  P̄·PUE, two factors a GPU-hour count does not carry. P13's 2.788M H800
  GPU-hours fill the first output alone, so that run's energy stays
  NOT-DISCLOSED. The money half of Eq. 1.7 needs prices and is not executed
  here.
placement: rail
anchor: formulation
evidence: ASSUMED
source: "DERIVED:eq-1.7"
alt: >-
  Calculator for the energy half of Eq. 1.7, E_run = P̄·t_wall·n_dev·PUE,
  with planning placeholders that are not device specifications: average
  device power P̄ = 1,000 W, wall time 100 h, 8 devices and PUE 1 (the
  device boundary). Outputs: 800 device-hours; 800 kWh; 2.88·10⁹ J; and 1.00
  kWh per device-hour, the factor P̄·PUE that GPU-hours alone do not carry.
  Preset 'facility boundary, PUE 1.2' gives 960 kWh for the same
  device-hours.
spec:
  tex: >-
    E_{\text{run}} = \bar{P}\,t_{\text{wall}}\,n_{\text{dev}}\cdot\text{PUE}
  equation: "1.7"
  inputs:
    - { symbol: P, label: "measured average device power P̄ (W)", default: 1000, min: 100, max: 2000, step: 50, format: integer }
    - { symbol: t, label: "wall time t_wall (h)", default: 100, min: 1, max: 10000, scale: log10, format: integer }
    - { symbol: n, label: "devices n_dev", default: 8, min: 1, max: 4096, scale: log2, format: integer }
    - { symbol: PUE, label: "PUE (1 at the device boundary)", default: 1, min: 1, max: 2, options: [1, 1.1, 1.2, 1.5, 2], format: fixed2 }
  outputs:
    - { symbol: DH, label: "device-hours, t_wall·n_dev", formula: "t*n", format: integer }
    - { symbol: E, label: "E_run (kWh)", formula: "P*t*n*PUE/1000", format: integer, emphasis: true }
    - { symbol: EJ, label: "E_run (J)", formula: "P*t*3600*n*PUE", format: si }
    - { symbol: k, label: "kWh per device-hour, P̄·PUE/1000", formula: "P*PUE/1000", format: fixed2 }
  presets:
    - { label: "facility boundary, PUE 1.2", values: { PUE: 1.2 } }
```

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.6].** For B = 1 the traffic term of Eq. 1.6 exceeds the compute term whenever B_mem / P_peak < (N_act b + M_KV) / FLOPs_token, i.e. whenever the hardware's bytes-per-FLOP ratio is below the model's bytes-per-FLOP demand at that step; the crossover batch is a hardware–model property and must be computed, not assumed.

```figure
id: fig-1.26
kind: chart
title: Bytes per FLOP a decode step demands, against batch
caption: >-
  Each curve is Eq. 1.6's traffic numerator over its compute numerator at
  one context length. It falls as 1/B while the weight read dominates, then
  flattens toward the cache's own ratio m/F (0.008 at 1K, 0.053 at 8K, 0.129
  at 32K), because every sequence added to the batch brings its own cache.
  Draw your accelerator's B_mem/P_peak across the chart: wherever a curve
  lies above it, that step is traffic-bound. No hardware line is drawn
  because none is sourced here. Illustrative configuration, not a named
  model.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-1.5", "DERIVED:eq-1.6"]
alt: >-
  Log–log line chart of bytes moved per FLOP performed in one decode step
  against batch B from 1 to 256, for an illustrative dense model with
  N_act = 8·10⁹, 2-byte weights, L = 32, d_model = 4096, H_kv = 8, d_h = 128
  and a 2-byte cache, not a named model. At S = 1,024 the demand is 0.976 at
  B = 1 and approaches 0.008. At S = 8,192 it is 0.841 at B = 1, 0.151 at
  B = 8, 0.065 at B = 64 and approaches 0.053. At S = 32,768 it is 0.612 at
  B = 1 and approaches 0.129. Longer contexts start lower at B = 1 because
  their attention FLOPs are larger, and end higher because their cache is.
spec:
  type: line
  x: { label: "batch B", scale: log2, format: integer, domain: [1, 256] }
  y: { label: "bytes moved per FLOP", scale: log10, format: fixed3 }
  variables: { Na: 8e9, b: 2, L: 32, d: 4096, Hkv: 8, dh: 128, bkv: 2 }
  series:
    - { id: s1k, label: "S = 1K", formula: "(Na*b + x*2*L*1024*Hkv*dh*bkv)/(x*(2*Na + 4*L*1024*d))", sample: { from: 1, to: 256, count: 9 } }
    - { id: s8k, label: "S = 8K", formula: "(Na*b + x*2*L*8192*Hkv*dh*bkv)/(x*(2*Na + 4*L*8192*d))", sample: { from: 1, to: 256, count: 9 }, emphasis: true }
    - { id: s32k, label: "S = 32K", formula: "(Na*b + x*2*L*32768*Hkv*dh*bkv)/(x*(2*Na + 4*L*32768*d))", sample: { from: 1, to: 256, count: 9 } }
  annotations:
    - { x: 1, label: "B = 1: 0.841 at 8K" }
    - { x: 64, label: "B = 64: 0.065 at 8K" }
    - { x: 256, label: "floors m/F: 0.008 · 0.053 · 0.129" }
```

> **Assumption.** Vendor P_peak and B_mem are used as bounds only · *sensitivity:* achieved values are lower by launch, occupancy, and dependency effects (notation §2.3); a plan that assumes peaks under-provisions.

## Mechanism

The ledger is filled in three passes. Pass one, derivable entries: N from the config, C from Eq. N.3 for training and Eq. 1.5 for inference, M_params = N_total b, M_KV from Eq. N.8, traffic from Eq. 1.6's numerator. Pass two, bounded entries: latency and throughput lower and upper bounds from Eq. 1.6 and Eq. N.4, communication volume from the parallelism plan ([29.5](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-5-collective-communication.md)). Pass three, measured-only entries: achieved latency quantiles, goodput, energy, money. Entries in pass three are UNVERIFIED until measured under the declared workload; a vendor or paper figure may be entered only with its workload context and label.

```figure
id: fig-1.27
kind: diagram
title: Three passes that fill the ledger, Algorithm 1.5
caption: >-
  Cost rises left to right: pass one needs only the configuration, pass two
  a parallelism plan, pass three a load test, a power meter and invoices.
  The dashed arrows into pass three are the discipline of Algorithm 1.5: a
  bound informs the measurement and never substitutes for it, so an entry
  stays UNVERIFIED until the load test or the meter fills it.
placement: wide
evidence: DERIVED
source: ["DERIVED:alg-1.5", "DERIVED:eq-1.6", "DERIVED:eq-1.7"]
alt: >-
  Left-to-right diagram of Algorithm 1.5 in three groups. Inputs: the design
  ψ and its configuration (N_total, N_act, L, d_model, b) and the data
  manifest. Pass one, derivable: N, KNOWN if the configuration is open; D
  from the data manifest; C as 6ND for training and Eq. 1.5 per token for
  inference; capacity N_total·b plus M_KV plus a runtime term; traffic per
  decode step N_act·b plus M_KV. Pass two, bounded: communication bytes per
  step from a parallelism plan; a latency lower bound from Eq. 1.6, fed by
  the traffic and compute entries; a throughput upper bound from Eq. N.4.
  Pass three, measured only: latency quantiles and goodput from a load test;
  energy from Eq. 1.7 with metered power; money from Eq. 1.7 with prices.
  Dashed arrows run from the pass-two bounds to the pass-three measurements.
spec:
  direction: LR
  nodes:
    - { id: cfg, kind: dependency, label: "design ψ and config", sub: "N_total, N_act, L, d_model, b" }
    - { id: man, kind: dataset, label: "data manifest" }
    - { id: n, kind: metric, label: "N", sub: "KNOWN if the config is open", group: p1 }
    - { id: dd, kind: metric, label: "D, tokens", sub: "KNOWN or PAPER-REPORTED", group: p1 }
    - { id: c, kind: metric, label: "C: 6ND train · Eq. 1.5 per token", group: p1 }
    - { id: cap, kind: memory, label: "capacity: N_total·b + M_KV + runtime", sub: "runtime term ASSUMED", group: p1 }
    - { id: traf, kind: metric, label: "traffic: N_act·b + M_KV per step", group: p1 }
    - { id: plan, kind: dependency, label: "parallelism plan (§29.5)" }
    - { id: comm, kind: flow, label: "communication bytes per step", group: p2 }
    - { id: lat, kind: metric, label: "latency lower bound, Eq. 1.6", group: p2 }
    - { id: thr, kind: metric, label: "throughput upper bound, Eq. N.4", group: p2 }
    - { id: load, kind: process, label: "load test under the declared workload" }
    - { id: meter, kind: process, label: "power meter and invoices" }
    - { id: q, kind: metric, label: "latency quantiles, goodput", sub: "UNVERIFIED until measured", group: p3 }
    - { id: e, kind: metric, label: "energy, Eq. 1.7", sub: "metered P̄, stated PUE", group: p3 }
    - { id: m, kind: metric, label: "money, cost per accepted task", sub: "prices ASSUMED or NOT-DISCLOSED", group: p3 }
  edges:
    - { from: cfg, to: n }
    - { from: man, to: dd }
    - { from: cfg, to: c }
    - { from: cfg, to: cap }
    - { from: cfg, to: traf }
    - { from: traf, to: lat, kind: emphasis, label: "traffic term" }
    - { from: c, to: lat, label: "compute term" }
    - { from: c, to: thr }
    - { from: plan, to: comm }
    - { from: lat, to: q, kind: dependency, label: "bound, not a plan" }
    - { from: thr, to: q, kind: dependency }
    - { from: load, to: q }
    - { from: meter, to: e }
    - { from: meter, to: m }
  groups:
    - { id: p1, label: "pass one: derivable" }
    - { id: p2, label: "pass two: bounded" }
    - { id: p3, label: "pass three: measured only" }
```

Cost line of the ledger itself: derivable entries cost nothing beyond the config; bounded entries cost a parallelism plan; measured entries cost a load test (inference FLOPs × replayed requests) and metering.

## Algorithm

```text
Algorithm 1.5 — Ledger construction with provenance
INPUT   design ψ (N_total, N_act, L, d_model, b, parallelism plan), workload Ω (B, S distribution, arrival envelope), hardware H (P_peak, B_mem, fabric), prices Π (or null), measurements Μ (or null)
OUTPUT  ledger Λ: entry → (value or bound, unit, boundary, label, source)
INVARIANT  no entry receives a numeric value without a label and source; peaks are recorded as bounds
 1. Λ[N] := (N_total, N_act; KNOWN if config open else NOT-DISCLOSED)
 2. Λ[D] := tokens from data manifest (KNOWN) or report (PAPER-REPORTED) or NOT-DISCLOSED
 3. Λ[C_train] := 6 N D with assumptions of Eq. N.3 (MATHEMATICALLY-DERIVED); Λ[C_infer/token] := Eq. 1.5
 4. Λ[M_cap] := N_total b + M_KV(B, S_p95) + M_runtime (Eq. N.5/N.8; runtime term ASSUMED with sensitivity)
 5. Λ[traffic] := N_act b + M_KV per decode step (DERIVED)
 6. Λ[comm] := bytes per step from the parallelism plan (DERIVED) or UNVERIFIED
 7. Λ[latency] := lower bounds from Eq. 1.6 (DERIVED); measured quantiles from Μ if present, else UNVERIFIED
 8. Λ[throughput] := upper bound from Eq. N.4 (DERIVED); measured goodput from Μ if present, else UNVERIFIED
 9. Λ[energy] := Eq. 1.7 from metered P̄ if present, else UNVERIFIED
10. Λ[money] := Eq. 1.7 with Π if present (ASSUMED), else NOT-DISCLOSED
11. return Λ
TERMINATION  ten entries, one pass
```

Complexity: constant. Implementation link: capacity planning in [§48.4](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-4-queueing-and-capacity.md).

## Implementation

Measurement points by stack layer: FLOPs and traffic from profilers at the *Kernels / numerics / collectives* layer; communication from NVIDIA NCCL or AMD RCCL counters at the *Distributed training* layer; latency and throughput from the *Inference engine* (vLLM, SGLang, TensorRT-LLM) at a stated boundary; energy from device telemetry at the *Accelerator / driver / compiler* layer. The Metrics dimension of `AI_REFERENCE_STACK.md` §4.2 fixes the names (MFU, FLOP/s, HBM bandwidth, network bandwidth, tokens/s/GPU, TTFT, TPOT, ITL, p50/p95/p99). Independent estimates of compute, hardware, and cost for named runs are routed through Epoch AI, whose data page lists a models database, hardware and data-center datasets, and a companies dataset (OFFICIAL-DOCUMENTATION · R1.13, accessed 2026-09-20); these are third-party estimates, not disclosures, and enter the ledger with that provenance. Any performance figure entered from a source must sit in a table stating hardware, model, precision, sequence length, input/output distribution, concurrency, runtime version, and measurement boundary.

## Experimental design

Proposal: for one open-weights dense model on one accelerator class, sweep batch B ∈ {1, 4, 16, 64} at fixed S and measure TPOT at the server boundary; compare against the Eq. 1.6 bound to estimate the achieved fraction of B_mem and the crossover batch; repeat with b halved by weight-only quantization to test the predicted traffic reduction; meter device power to fill the energy entry. Three runs per point; report p50 and p95. Not executed; the design belongs to [§42.6](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-6-predictive-models.md) and [§48.2](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-2-load-test-methodology.md).

## Observations

**What the paper claims.** Kaplan et al. report power-law dependence of loss on N, D, and C over more than seven orders of magnitude and that compute-efficient training uses very large models on relatively modest data, stopping before convergence (PAPER-REPORTED · P08). Hoffmann et al. report that for compute-optimal training model size and tokens should be scaled equally, from over 400 models between 70M and 16B parameters trained on 5B to 500B tokens (PAPER-REPORTED · P09). DeepSeek-V3 reports 2.788M H800 GPU-hours for full training of a 671B-total, 37B-activated model on 14.8T tokens (PAPER-REPORTED · P13). Patterson et al. report that algorithm, processor, datacenter efficiency, and energy mix together can change training carbon footprint by roughly 100–1000× (PAPER-REPORTED · R1.12), and Strubell et al. recommend reporting training time and computational resources (PAPER-REPORTED · R1.11).

**What the evidence shows.** P08 and P09 disagree on the N–D allocation; P09 attributes the difference to schedule and fitting choices, which is itself a level-attribution question ([§1.2](01-2-levels-of-analysis.md)). The GPU-hour figure is a device-occupancy entry; converting it to energy or money requires P̄, PUE, and prices that P13 does not report.

**What we infer.** DERIVED: the GPU-hour entry equals t_wall × n_dev in Eq. 1.7, so energy is NOT-DISCLOSED for that run rather than computable. DERIVED: Eq. 1.6 explains why weight-only compression (smaller b) reduces decode latency at small B while leaving the FLOP term unchanged.

```figure
id: fig-1.28
kind: stat-panel
title: DeepSeek-V3 ledger from its disclosure
caption: >-
  Three of the ten entries fill from the abstract plus Eq. 1.4 and 1.5. The
  GPU-hour count is an occupancy factor, t_wall·n_dev in Eq. 1.7; without
  P̄, PUE and prices, which P13 does not report, it converts to neither
  energy nor money. Capacity and traffic need b, which this chapter does not
  take from P13, so those rows stay formulas.
placement: rail
anchor: observations
evidence: PAPER-REPORTED
source: [P13, "DERIVED:eq-1.4", "DERIVED:eq-1.7"]
alt: >-
  Instrument panel for DeepSeek-V3 filled by Algorithm 1.5 from its
  technical report abstract (P13). N_total 671B; N_act 37B; activated
  fraction 0.055 by Eq. 1.4; pretraining tokens D = 14.8T; per-token compute
  2·N_act = 74 GFLOP, the weight term of Eq. 1.5 only; 2.79M H800 GPU-hours
  for full training, equal to t_wall·n_dev in Eq. 1.7. Capacity and traffic
  are the formulas N·b with b not taken from P13; communication is not taken
  in this chapter; latency and throughput are measured-only entries and none
  is taken; energy NOT-DISCLOSED because average power and PUE are absent;
  money NOT-DISCLOSED because prices are absent; training data composition
  NOT-DISCLOSED. A dot glyph fills three of ten ledger entries.
spec:
  header: "LEDGER · DeepSeek-V3 · P13 abstract"
  variables: { Nt: 671e9, Na: 37e9, D: 14.8e12, GH: 2.788e6 }
  rows:
    - { key: "N_total", formula: "Nt", format: params }
    - { key: "N_act", formula: "Na", format: params }
    - { key: "activated fraction", formula: "Na/Nt", format: fixed3, note: "Eq. 1.4" }
    - { key: "D, pretraining tokens", formula: "D", format: tokens }
    - { key: "C per token, 2·N_act", formula: "2*Na", format: flops, note: "weight term of Eq. 1.5 only" }
    - { key: "GPU-hours = t_wall·n_dev", formula: "GH", format: si, note: "H800, full training (P13)" }
    - { key: "capacity, traffic", value: "N·b; b not taken from P13" }
    - { key: "communication", value: "not taken in this chapter" }
    - { key: "energy E_run", value: "NOT-DISCLOSED: P̄, PUE absent" }
    - { key: "money", value: "NOT-DISCLOSED: prices absent" }
    - { key: "training data composition", value: "NOT-DISCLOSED" }
  glyph:
    type: dots
    total: 10
    filled: 3
    legend:
      - { marker: filled, label: "filled from P13 or a derivation", value: "N, D, C" }
      - { marker: hollow, label: "missing b, a measurement or a factor", value: "7 entries" }
```

**What remains unknown.** Energy and money for every named training run cited here are NOT-DISCLOSED. Achieved B_mem fractions for any engine on any accelerator are UNVERIFIED in this chapter; owning chapters may enter OFFICIAL-DOCUMENTATION figures with workload context.

## Failure modes

> **Failure mode — peak-as-throughput.** *Symptom:* a capacity plan built on vendor P_peak misses its SLO. *Cause:* Eq. N.4 bound treated as achieved. *Detection:* measured FLOP/s ≪ P_peak in the profiler. *Mitigation:* plan on measured fractions.

> **Failure mode — parameters-as-memory.** *Symptom:* out-of-memory at a batch the parameter count "allowed". *Cause:* M_KV, optimizer state, or runtime workspace omitted. *Detection:* allocator peak exceeds N b. *Mitigation:* Eq. N.5/N.8 term by term.

> **Failure mode — GPU-hours-as-cost.** *Symptom:* two runs with equal GPU-hours have different invoices or energy. *Cause:* device generation, power, PUE, and price omitted. *Detection:* Eq. 1.7 factors missing. *Mitigation:* record the factors or mark NOT-DISCLOSED.

> **Failure mode — FLOPs-as-latency.** *Symptom:* a smaller-FLOP decode step is not faster. *Cause:* traffic-bound regime. *Detection:* Eq. 1.6 traffic term dominates. *Mitigation:* reduce bytes moved (b, cache size), not arithmetic.

## Siblings

**Roofline reasoning** — [§25.3](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/25-3-roofline-reasoning.md)
Why it exists: to bound kernel performance by intensity. What assumption changed: the unit is a kernel, not a lifecycle. What objective changed: none. What problem it solved: predicting compute- versus traffic-bound kernels. What new failure mode it introduced: bounds mistaken for predictions. Changed primitive: ledger entry → intensity plot.

**Compute-optimal design** — [§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md)
Why it exists: to allocate C between N and D. What assumption changed: a fitted loss surface is trusted. What objective changed: minimize loss at fixed C. What problem it solved: over-parameterized, under-trained runs. What new failure mode it introduced: fits that do not transfer across data and schedules. Changed primitive: ledger → fitted function.

**Economics** — [§48.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-5-economics.md)
Why it exists: to price the ledger per accepted task. What assumption changed: prices and denominators are known. What objective changed: minimize cost per accepted task. What problem it solved: cost/token as a misleading unit. What new failure mode it introduced: attribution-window games. Changed primitive: money entry → cost per accepted task.

## Extensions

Domain adaptation adds retention evaluation FLOPs to the ledger. Long context makes the second term of Eq. 1.5 and M_KV dominant, moving decode further into the traffic-bound regime. Multimodality adds encoder FLOPs and image or video token counts to D and S. Agents multiply per-task cost by tool calls and retries, so money must be reported per accepted task. Embodiment adds real-time deadlines that convert latency from a quantile to a hard bound. Proposals only.

## Limitations

Valid regime: dense or routed Transformers with conventional caches for Eq. 1.5–1.6; recurrent-state and compressed-cache families need their owners' formulas. Falsification: a measured TPOT below the Eq. 1.6 bound at the stated B and S means an accounting error (wrong b, S, or boundary), since the bound is physical. Decision consequence: no entry crosses from bound to plan without a label.

## Reproducibility

Artifacts: the ledger file with a source per entry. Configurations: hardware class, precision, runtime version for any measured entry. Metric definitions: [notation §2.8–2.10, §3](../../../front-matter/notation.md). Unresolved: achieved bandwidth fractions and all energy entries (UNVERIFIED).

## References

P08, P09, P13, P19, P36; R1.11, R1.12, R1.13; [notation](../../../front-matter/notation.md) Eq. N.3, N.4, N.5, N.8, §2.8–2.10.
