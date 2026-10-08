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
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 1.5 Resource accounting

## Scope

A resource ledger separates parameters, tokens, FLOPs, memory capacity, memory traffic, communication, latency, throughput, energy, and money. The baseline is a single-number cost account; the technical comparison requires units, boundaries, provenance, and the assumptions converting one quantity into another. Dense operation estimates and a conventional-attention streaming model are developed here, with architecture-specific cache and roofline derivations in their owning chapters. Reported resource totals remain conditional on the source's accounting boundary.

## Why this exists

A parameter count, a training-operation count, and a serving-throughput measurement describe different quantities. Kaplan et al. model language-model loss as a function of model size, dataset size, and training compute; Hoffmann et al. reconsider their allocation under a fixed training budget (P08; P09, §3). FlashAttention changes attention's HBM transfers through tiling and recomputation, while PagedAttention changes allocation and sharing of serving-state memory (P19, §3; P36, §§4–5). Their results cannot be compared by parameter count alone.

The ledger makes these distinctions explicit. Compute and traffic produce conditional lower bounds on execution time; memory capacity constrains admissible working sets; occupancy, metered power, and prices determine different accounting totals. Which constraint dominates depends on batch, context, architecture, parallelism, and the measurement boundary. No lifecycle stage is assigned a universal bottleneck.

## Intuition

Parameters count stored or activated model coefficients; tokens count data events under a specified tokenizer; FLOPs count arithmetic under a declared convention. Capacity is a maximum resident footprint, whereas traffic is an amount transferred across a named boundary. Communication counts inter-device transfers and collective participation. Latency measures elapsed time for an individual request or stage; throughput measures completed work per time window. Energy integrates power, and monetary cost prices a stated set of resources. These definitions are operational rather than cognitive analogies.

Batching can reuse a weight matrix across several sequences while each sequence retains its own attention state. Consequently, bytes per output token can decrease without the same reduction in operations per token. Conversely, an implementation can reduce transfers through reuse without changing the model's parameter count. The equations below expose the assumptions needed to calculate either effect.

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
*(Eq. 1.5)* where N_act counts coefficients used in dense linear operations for one token, L = layers, S = current context length, and d_model = residual width. The first term counts a multiply and add per participating matrix coefficient; embedding lookups and tied output projections require their own accounting rather than counting every stored coefficient as a multiply-add. The second term counts query–key and attention–value products with H_q d_h = d_model. This conventional full-attention approximation excludes softmax, normalization, routing, activation functions, dequantization, and recomputation. It is an operation model, not a profiler result.

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

For an execution performing F_step operations and transferring Q_HBM bytes across the HBM boundary, the resource lower bound is max(F_step/P_peak, Q_HBM/B_mem). The following **streaming model** substitutes F_step ≈ B·FLOPs_token and Q_HBM ≈ N_act b + M_KV. It assumes dense weights are streamed once per step, conventional KV state is read once, and omitted traffic and arithmetic are nonnegative additions. Its traffic substitution must be checked against cache reuse, sharding, compression, and the actual kernel:

$$
t_{\text{step}} \;\ge\; \max\!\left(\frac{B\,\text{FLOPs}_{\text{token}}}{P_{\text{peak}}},\; \frac{N_{\text{act}}\, b + M_{KV}(B, S)}{B_{\text{mem}}}\right)
$$
*(Eq. 1.6)* where b = bytes per weight value, M_KV is the conventional cache footprint from [Eq. N.8](../../../front-matter/notation.md), and P_peak and B_mem refer to the same device boundary. The displayed inequality is conditional on those transferred bytes being required at that boundary; the universally applicable resource expression uses actual required F_step and Q_HBM. Persistent on-chip reuse or another attention-state representation invalidates the substituted numerator. For routed MoE, account for the union of experts accessed by the batch, placement, and dispatch communication. Resident capacity does not establish that each byte crosses HBM once per step.

```figure
id: fig-1.24
kind: calculator
title: Conditional streaming-traffic model, Eq. 1.5 and 1.6
caption: >-
  Conditional dense streaming model: weights and conventional KV are read
  once from HBM per step; no persistent on-chip reuse is represented.
  The modeled traffic term dominates when B_mem/P_peak is below
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
  - { anchor: observations, label: "b halved · B = 1", variables: { Na: 8e9, S: 8192, B: 1, b: 1, Hkv: 8, bkv: 2 }, highlight: [Tr, F], note: "Weight-only compression halves b: 15.9 GiB becomes 8.45 GiB per step while FLOPs stay at 20.3 G. The streaming numerator falls; actual latency requires a kernel measurement." }
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
    - { symbol: Tr, label: "modeled streaming bytes per step, N_act·b + M_KV", formula: "Na*b + KV", format: bytes, emphasis: true }
    - { symbol: Cp, label: "FLOPs per step, B·FLOPs_token", formula: "B*F", format: flops }
    - { symbol: Dm, label: "demand: bytes per FLOP", formula: "Tr/Cp", format: fixed3, emphasis: true }
    - { symbol: Wf, label: "weight share of bytes moved", formula: "Na*b/Tr", format: percent }
```

Energy and money are not derivable from the entries above without measured factors:

$$
E_{\text{run}} = \bar{P}\, t_{\text{wall}}\, n_{\text{dev}}\cdot \text{PUE}, \qquad
\text{Money} = \sum_r \text{price}_r \cdot \text{quantity}_r
$$
*(Eq. 1.7)* assumes identical time-averaged device powers and occupancy durations; heterogeneous devices require a sum of power integrals. With PUE = 1 it measures the stated devices' energy. Multiplying GPU-only energy by facility PUE is an attributed estimate, not a complete facility total: host CPUs, memory, storage, networking, and other IT power must be included before PUE converts total IT energy to facility energy. Record measured, estimated, and excluded components separately. The money sum ranges over included resources such as device-hours, storage, egress, and labor; planning prices produce an estimate rather than an invoice. Cost per accepted task follows [notation §2.10](../../../front-matter/notation.md).

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
  Preset 'device-energy attribution, PUE 1.2' gives 960 kWh for the same
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
    - { label: "device-energy attribution, PUE 1.2", values: { PUE: 1.2 } }
```

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.6].** For B = 1 the traffic term of Eq. 1.6 exceeds the compute term whenever B_mem / P_peak < (N_act b + M_KV) / FLOPs_token, i.e. whenever the hardware's bytes-per-FLOP ratio is below the model's bytes-per-FLOP demand at that step; the crossover batch is a hardware–model property and must be computed, not assumed.

```figure
id: fig-1.26
kind: chart
title: Bytes per FLOP a decode step demands, against batch
caption: >-
  Each curve is the conditional streaming-traffic estimate over compute at
  one context length. It falls as 1/B while the weight read dominates, then
  flattens toward the cache's own ratio m/F (0.008 at 1K, 0.053 at 8K, 0.129
  at 32K), because every sequence added to the batch brings its own cache.
  Draw your accelerator's B_mem/P_peak across the chart: wherever a curve
  lies above it, the modeled traffic term dominates the modeled compute term. No hardware line is drawn
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

The ledger is filled in three passes. Configuration and source records supply parameter counts, token exposure, and conditional estimates of operations and footprint. A parallelism and execution model supplies necessary bounds at a declared boundary. Measurements supply achieved quantiles, goodput, transferred bytes, power, and resource charges. A bound does not substitute for a measurement; a source-reported measurement keeps its original workload and provenance.

### Methodology

Hoffmann et al. distinguish three compute-allocation estimators (P09, §3). The first interpolates training-loss curves and forms a lower envelope at fixed compute. The second fits parabolas to final losses from models trained at fixed compute budgets. The third fits L(N,D) = E + A/N^α + B/D^β, then minimizes it subject to C ≈ 6ND. Its Huber fit is applied to log loss using L-BFGS and multiple initializations (§3.3, Eqs. 2–4). Learning-rate horizon is a consequential control: an early checkpoint from a longer schedule differs from a run whose decay was chosen for that actual token budget. The fitted floor and exponents are empirical estimates for the study, not architecture-independent constants.

PagedAttention maps logical sequence blocks to physical KV blocks allocated as sequences grow. Reference counts and copy-on-write enable sharing across related sequences (P36, §§4–5). Reduced fragmentation can permit larger admitted batches, so a throughput comparison tests allocation and scheduling as well as the attention kernel. Record the actual batch and length distribution instead of attributing an engine gain to arithmetic alone.

Energy methodology has a separate boundary. Strubell et al. estimate CPU, GPU, and DRAM energy using measured/estimated power, duration, and a stated PUE (R1.11, §2); Patterson et al. distinguish processor, datacenter, and electricity-source factors (R1.12). Carbon additionally requires time/location-specific emissions intensity. GPU-hours and nominal thermal-design power do not supply those missing measurements.

```figure
id: fig-1.27
kind: diagram
title: Three passes that fill the ledger, Algorithm 1.5
caption: >-
  The three passes require different inputs: pass one needs only the configuration, pass two
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
    - { id: traf, kind: metric, label: "streaming traffic estimate: N_act·b + M_KV", group: p1 }
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
INPUT   design ψ (N_total, N_act, L, d_model, b, parallelism plan), workload Ω (B, S distribution, arrival envelope), hardware H (P_peak, B_mem, fabric), optional price record Π, optional measurement record Μ
OUTPUT  ledger Λ: entry → (value or bound, unit, boundary, label, source)
INVARIANT  no entry receives a numeric value without a label and source; peaks are recorded as bounds
 1. Λ[N] := (N_total, N_act; KNOWN if config open else NOT-DISCLOSED)
 2. Λ[D] := tokens from data manifest (KNOWN) or report (PAPER-REPORTED) or NOT-DISCLOSED
 3. Λ[C_train] := 6 N D with assumptions of Eq. N.3 (MATHEMATICALLY-DERIVED); Λ[C_infer/token] := Eq. 1.5
 4. Λ[M_cap] := N_total b + M_KV at the largest admitted workload (or a sum over actual sequence lengths) + M_runtime (Eq. N.5/N.8; runtime term ASSUMED with sensitivity)
 5. Λ[traffic] := conditional streaming estimate N_act b + M_KV; measured Q_HBM when available
 6. Λ[comm] := bytes per step from the parallelism plan (DERIVED) or UNVERIFIED
 7. Λ[latency] := lower bounds from Eq. 1.6 (DERIVED); measured quantiles from Μ if present, else UNVERIFIED
 8. Λ[throughput] := upper bound from Eq. N.4 (DERIVED); measured goodput from Μ if present, else UNVERIFIED
 9. Λ[energy] := Eq. 1.7 from metered P̄ if present, else UNVERIFIED
10. Λ[money] := Eq. 1.7 with Π if present (ASSUMED), else NOT-DISCLOSED
11. return Λ
TERMINATION  ten entries, one pass
```

Complexity: O(1) for a fixed ten-entry summary after input statistics exist; aggregating n sequence lengths, device records, or price records costs O(n). Implementation link: capacity planning in [§48.4](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-4-queueing-and-capacity.md).

## Implementation

Measurement points by stack layer: FLOPs and traffic from profilers at the *Kernels / numerics / collectives* layer; communication from NVIDIA NCCL or AMD RCCL counters at the *Distributed training* layer; latency and throughput from the *Inference engine* (vLLM, SGLang, TensorRT-LLM) at a stated boundary; energy from device telemetry at the *Accelerator / driver / compiler* layer. The Metrics dimension of `AI_REFERENCE_STACK.md` §4.2 fixes the names (MFU, FLOP/s, HBM bandwidth, network bandwidth, tokens/s/GPU, TTFT, TPOT, ITL, p50/p95/p99). Any performance figure entered from a source must sit in a table stating hardware, model, precision, sequence length, input/output distribution, concurrency, runtime version, and measurement boundary.

## Experimental design

### Reported experiments

Chinchilla's three estimation approaches yield similar but non-identical allocations (P09, Table 2). The training-curve method covers 70M–10B-parameter models with multiple token horizons; the fixed-budget method uses nine budgets from 6×10¹⁸ to 3×10²¹ FLOPs and models up to 16B parameters. The parametric fit uses the collected final losses. Table 2 reports exponent uncertainty from 100 bootstrap fits using 80% samples, with 10th–90th percentile ranges. These ranges characterize that fitting procedure and model/data regime; they do not establish an invariant optimum for all corpora or architectures. Appendix D.4 tests two models, 2.8B and 4.74B parameters, at a matched 10²¹-FLOP budget with matched depth/width ratio, batch size, and learning-rate schedule construction. This is stronger evidence for the allocation prediction than comparing unrelated released models.

PagedAttention evaluates OPT and LLaMA serving on configurations ranging from one to eight A100 GPUs (P36, §6.1, Table 1). ShareGPT and Alpaca supply prompt/response-length distributions; because source conversations lack request timestamps, arrivals are generated with a Poisson process. The paper compares against FasterTransformer and reimplemented Orca variants, including different maximum-length assumptions. Reported throughput and latency are conditional on those configurations and synthesized arrivals. The evaluation does not establish performance under arbitrary production burstiness or a current unpinned engine release.

The chapter's proposed batch/precision/power sweep is specified in [verification](verification.md#exp-1-5). No such load test or energy measurement was performed for this manuscript.

## Observations

**What the paper claims.** Kaplan et al. report power-law dependence of loss on N, D, and C over more than seven orders of magnitude and that compute-efficient training uses very large models on relatively modest data, stopping before convergence (PAPER-REPORTED · P08). Hoffmann et al. report that for compute-optimal training model size and tokens should be scaled equally, from over 400 models between 70M and 16B parameters trained on 5B to 500B tokens (PAPER-REPORTED · P09). DeepSeek-V3 reports 2.788M H800 GPU-hours for full training of a 671B-total, 37B-activated model on 14.8T tokens (PAPER-REPORTED · P13). Patterson et al. analyze processor, datacenter, and electricity-source contributions to carbon accounting (PAPER-REPORTED · R1.12), and Strubell et al. recommend reporting training time and computational resources (PAPER-REPORTED · R1.11).

**What the evidence shows.** P08 and P09 disagree on the N–D allocation; P09 attributes the difference to schedule and fitting choices, which is itself a level-attribution question ([§1.2](01-2-levels-of-analysis.md)). The GPU-hour figure is an accelerator-occupancy entry. P13 Table 1 does disclose an assumed $2/H800-hour price and a $5.576M total for the listed training phases; earlier research and ablations are excluded. It is an accounting estimate, not the full program invoice or facility energy.

**What we infer.** DERIVED: the GPU-hour entry equals t_wall × n_dev in Eq. 1.7, so energy is NOT-DISCLOSED for that run rather than computable. DERIVED under the streaming assumptions: reducing b lowers the modeled weight-transfer term without changing the mathematical multiply-add count. Real speed requires measuring dequantization, packing, cache reuse, and kernel performance.

```figure
id: fig-1.28
kind: stat-panel
title: DeepSeek-V3 disclosed resource entries and missing boundaries
caption: >-
  Table 1 discloses a training estimate at an assumed $2 per H800-hour.
  It excludes earlier research and ablations. Facility energy and the
  complete program invoice are not inferred from the GPU-hour count.
placement: rail
anchor: observations
evidence: PAPER-REPORTED
source: [P13, "DERIVED:eq-1.4", "DERIVED:eq-1.7"]
alt: >-
  DeepSeek-V3 reports 671B total and 37B active parameters, 14.8T training
  tokens, 2.788M H800 GPU-hours, and a $5.576M listed-training estimate.
  Actual HBM traffic, facility energy, and complete research cost are absent.
spec:
  header: "DeepSeek-V3 · report §1 and Table 1"
  variables: { Nt: 671e9, Na: 37e9, D: 14.8e12, GH: 2.788e6, rate: 2 }
  rows:
    - { key: "total parameters", formula: "Nt", format: params }
    - { key: "active parameters", formula: "Na", format: params }
    - { key: "active parameter fraction", formula: "Na/Nt", format: fixed3, note: "not a traffic ratio" }
    - { key: "pretraining tokens", formula: "D", format: tokens }
    - { key: "H800 GPU-hours", formula: "GH", format: si }
    - { key: "assumed price", value: "$2 per H800-hour" }
    - { key: "listed-training estimate", formula: "GH*rate", format: si, note: "USD; excludes earlier research and ablations" }
    - { key: "actual HBM traffic", value: "not measured in this chapter" }
    - { key: "facility energy", value: "NOT-DISCLOSED" }
    - { key: "full research-program cost", value: "NOT-DISCLOSED" }
    - { key: "data", value: "Coarse mix; full corpus unavailable" }
```

**What remains unknown.** Facility energy, measured average power, and complete research-program monetary cost for DeepSeek-V3 are NOT-DISCLOSED in the inspected report. Its stated training estimate is disclosed. Achieved B_mem fractions for any engine on any accelerator are UNVERIFIED in this chapter; owning chapters may enter OFFICIAL-DOCUMENTATION figures with workload context.

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

### Improvements

Compute-optimal allocation improves a specific resource decision: P09 reallocates a fixed training budget between parameters and tokens, then tests the resulting model against larger, less-trained alternatives. It does not minimize lifetime serving cost; adding inference demand changes the optimization objective. FlashAttention improves the HBM-transfer account by tiling exact attention and recomputing intermediates during backward, trading extra arithmetic for less transfer (P19, §3). PagedAttention improves effective state-memory utilization through allocation and sharing (P36, §§4–5). The affected ledger entry and its corresponding quality or execution check must accompany each improvement.

Longer conventional-attention contexts increase both the attention-operation term and KV state. Their ratio, rather than context length alone, determines whether the streaming model becomes more traffic-bound. Multimodal encoders add modality-specific work and state; recurrent or compressed-cache models require their own state formula. Agent retries change the denominator from generated tokens to accepted tasks. These are accounting extensions, not measured performance claims.

## Limitations

Eq. 1.5 is an approximate operation count; Eq. 1.6 is conditional on its streaming-traffic substitution. A measurement below the substituted bound rejects its accounting assumptions or boundary, not a physical law. The resource bound using actual required operations and transferred bytes remains distinct from that substitution. Precision-specific peak rates, sparse-versus-dense conventions, on-chip reuse, tensor-parallel shards, communication overlap, and compressed attention state must match the calculation.

A p95 input length is not a maximum-memory guarantee: the remaining admitted requests still need a policy. Feasibility calculations use maximum admitted lengths or a documented admission rule, and measured peaks cover only the tested workload. Energy, carbon, and money have different boundaries; an estimate for one must not be silently promoted into another.

## Reproducibility

Artifacts: the ledger file with a source per entry. Configurations: hardware class, precision, runtime version for any measured entry. Metric definitions: [notation §2.8–2.10, §3](../../../front-matter/notation.md). Unresolved: achieved bandwidth fractions and all energy entries (UNVERIFIED).

## References

P08, P09, P13, P19, P36; R1.11, R1.12; [notation](../../../front-matter/notation.md) Eq. N.3, N.4, N.5, N.8, §2.8–2.10.
