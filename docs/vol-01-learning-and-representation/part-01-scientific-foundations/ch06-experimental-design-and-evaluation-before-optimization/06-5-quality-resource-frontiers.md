---
id: ms.section.6.5
entity_type: section
title: Quality/resource frontiers
short_title: Quality/resource frontiers
volume: 1
part: 1
chapter: 6
section: 6.5
slug: 06-5-quality-resource-frontiers
parent: ms.chapter.6
prev_sibling: ms.section.6.4
next_sibling: ms.section.6.6
children: []
prerequisites: [ms.section.1.5, ms.section.2.6, ms.section.5.6, ms.section.6.1, ms.section.6.3, ms.section.6.4]
downstream: [ms.section.6.6, ms.chapter.21, ms.chapter.43, ms.chapter.48]
related: [ms.chapter.38, ms.chapter.44]
siblings_by_mechanism: [ms.section.6.3]
relations:
  - {type: supported_by, target: paper.P38}
  - {type: supported_by, target: paper.P09}
  - {type: evaluated_by, target: experiment.6.5}
axes: {lifecycle: [pretraining, inference, serving, evaluation], mechanism: [constrained_comparison, resource_accounting, pareto_selection], feedback_setting: [], modality: [text]}
papers: [P07, P09, P38, P50]
implementations: [impl.vllm, impl.sglang, impl.tensorrt-llm]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 6.5 Quality/resource frontiers

## Scope

Objective: specify fixed-quality, fixed-latency, fixed-compute, and fixed-cost comparisons before interpreting an efficiency claim. Baseline: a quality table and a throughput table collected on different workloads. Success: every selected configuration satisfies a named resource constraint on the same evaluation unit, and apparent dominance is separated from supported dominance. Pareto definitions belong to [§2.6](../ch02-mathematical-and-statistical-foundations/02-6-optimization-language.md); workload generation and capacity planning are developed in [Chapter 48](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md). This section owns the comparison protocol, not runtime scheduling.

## Why this exists

**PAPER-REPORTED · [P09](references.md).** Compute-optimal training studies compare different allocations of parameters and data under a constrained training budget. **PAPER-REPORTED · [P38](references.md).** DistServe treats serving performance under latency objectives, rather than treating unconstrained token throughput as sufficient. **PAPER-REPORTED · [P50](references.md).** HELM places efficiency alongside several quality and risk dimensions. These examples share a measurement requirement: the resource boundary and the quality boundary must be explicit.

**DERIVED.** A system can improve its displayed throughput by batching more aggressively, terminating responses earlier, or omitting slow failures. Each changes the experiment. A lower-cost model can become more expensive per successful task if retries increase sufficiently. The dominant constraint is therefore the joint feasible region, not a scalar score detached from its workload.

## Intuition

**DERIVED.** Each measured point is a configured system, including sampling, concurrency, input/output lengths, caching, and the hardware boundary. Moving one knob traces a local trade-off curve. Switching checkpoints changes the system and may also change response lengths, correctness, and cache behaviour. Comparing a minimum cost from one configuration to a maximum quality from another constructs a point that no tested system achieved.

**ASSUMED.** All comparisons below use higher-is-better quality q, lower-is-better client-visible latency quantile ℓ_p, compute C, and monetary cost κ, plus optional goodput. A hard constraint is a requirement of the intended use, not a fitted weight chosen to make one configuration win.

## Formulation

> **Definition — iso-quality / iso-latency / iso-compute / iso-cost comparison.** A comparison in which a declared quality level, latency quantile, compute budget, or monetary budget is held fixed, or enforced as a preregistered feasibility constraint, while other outcomes are compared.

| Local symbol | Meaning | Unit |
|---|---|---|
| a ∈ A | complete candidate configuration | immutable configuration id |
| W_eval | fixed workload distribution and protocol | manifest id |
| q(a), q_min | quality; required floor | declared score units |
| ℓ_p(a), ℓ_max | latency quantile p; permitted ceiling | seconds |
| C(a), C_max | resource-boundary FLOPs; limit | FLOPs |
| κ(a), κ_max | monetary cost; limit | named currency and accounting window |
| q_L, q_U | uncertainty bounds on quality | score units |
| ℓ_L, ℓ_U | uncertainty bounds on latency quantile | seconds |

**MATHEMATICALLY-DERIVED.** A fixed-quality cost comparison and a fixed-latency quality comparison are respectively

$$
\min_{a\in A}\kappa(a)\quad\text{subject to }q(a)\ge q_{\min},
\qquad
\max_{a\in A}q(a)\quad\text{subject to }\ell_p(a)\le\ell_{\max}.
$$
*(Eq. 6.12)* where every function is evaluated on W_eval with a common boundary. Fixed-compute and fixed-cost quality comparisons replace the latency constraint by C(a) ≤ C_max or κ(a) ≤ κ_max.

**ASSUMED.** A conservative measured feasible set is

$$
\widehat A_{\mathrm{safe}}=
\{a:q_L(a)\ge q_{\min},\ \ell_U(a)\le\ell_{\max},\ C_U(a)\le C_{\max},\ \kappa_U(a)\le\kappa_{\max}\}.
$$
*(Eq. 6.13)* where upper resource bounds are used when accounting quantities are uncertain; exact counted costs can have equal lower and upper bounds. The intended simultaneous confidence level must cover the registered constraints and configurations. Separate marginal 95% intervals do not automatically give 95% simultaneous coverage.

**MATHEMATICALLY-DERIVED.** For a two-axis quality/cost comparison, a sufficient condition for supported dominance of a over b is q_L(a) ≥ q_U(b) and κ_U(a) ≤ κ_L(b), with at least one strict inequality, provided all true values lie inside the simultaneous intervals. It is conservative: correlated paired differences may establish dominance when marginal interval boxes overlap. Absence of supported dominance does not establish equivalence.

```figure
id: fig-6.24
kind: compare
title: Four fixed-resource comparisons and what each must name
caption: >-
  Eq. 6.12 has four instances, and each is well defined only once its
  "must be named" row is filled before measurement. The trap row is where
  each goes wrong when that row is left open. It maps onto the section's
  failure modes, and the compute column onto §6.3's hidden curation compute.
  The Eq. 6.13 row uses the conservative bound of each interval, the lower
  bound on quality and the upper bound on every resource.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-6.12", "DERIVED:eq-6.13", "DERIVED:eq-6.8"]
concepts: [ms.section.6.5]
alt: >-
  Comparison of iso-quality, iso-latency, iso-compute and iso-cost
  comparisons. Held fixed: q(a) ≥ q_min; ℓ_p(a) ≤ ℓ_max; C(a) ≤ C_max;
  κ(a) ≤ κ_max. Compared: cost minimised; quality maximised; quality;
  quality. Must be named: the primary floor, guardrail subgroups,
  aggregation and uncertainty treatment; the quantile, workload, arrival
  process, measurement boundary and timeout handling; which stages count
  (training, tuning, curation, inference) and the first-use or amortised
  rule; the billing convention, token counts including reasoning and cache,
  retries, failed runs and currency date. Conservative feasibility (Eq.
  6.13): q_L ≥ q_min; ℓ_U ≤ ℓ_max; C_U ≤ C_max; κ_U ≤ κ_max. Trap: a
  subgroup added after results; completion-only quantiles that omit
  timeouts; 6ND read as a currency conversion; zero accepted tasks treated
  as a finite ratio. Failure mode: infeasible winner; hidden censoring;
  hidden curation compute; impossible composite point.
spec:
  axis: >-
    What each fixed-resource comparison holds fixed, what it compares, what
    must be named before it is well defined, and the trap when it is not;
    no system is ranked
  columns:
    - { id: iq, label: "iso-quality" }
    - { id: il, label: "iso-latency" }
    - { id: ic, label: "iso-compute" }
    - { id: ik, label: "iso-cost" }
  rows:
    - { dimension: "held fixed (Eq. 6.12)", values: { iq: "q(a) ≥ q_min on W_eval", il: "ℓ_p(a) ≤ ℓ_max", ic: "C(a) ≤ C_max", ik: "κ(a) ≤ κ_max" } }
    - { dimension: "compared", values: { iq: "cost κ, minimised", il: "quality q, maximised", ic: "quality q", ik: "quality q" } }
    - { dimension: "must be named", values: { iq: "primary floor, guardrail subgroups, aggregation, uncertainty treatment", il: "quantile p, workload, arrival process, boundary, timeout handling", ic: "stages counted: training, tuning, curation, inference; first-use vs amortised", ik: "billing convention, reasoning and cache tokens, retries, failed runs, currency date" } }
    - { dimension: "conservative feasibility (Eq. 6.13)", values: { iq: "q_L(a) ≥ q_min", il: "ℓ_U(a) ≤ ℓ_max", ic: "C_U(a) ≤ C_max", ik: "κ_U(a) ≤ κ_max" } }
    - { dimension: "trap", values: { iq: "a subgroup added after results changes the decision", il: "completion-only quantiles omit timeouts", ic: "6ND read as a currency conversion", ik: "zero accepted tasks: ratio undefined, not finite" } }
    - { dimension: "failure mode", values: { iq: "infeasible winner", il: "hidden censoring", ic: "hidden curation compute (§6.3)", ik: "impossible composite point" } }
```

## Mechanism

**DERIVED.** Fixed quality isolates resource efficiency only when the quality criterion stays fixed. If a quantised checkpoint meets a mean accuracy floor but fails a required subgroup, it is infeasible under a subgroup-constrained specification. Conversely, adding an unregistered subgroup after inspecting results changes the decision. Record a primary quality floor, required guardrails, their aggregation, and their uncertainty treatment before fitting any frontier.

**DERIVED.** Fixed latency must name the quantile, workload, arrival process, and measurement boundary. Median latency at one request at a time does not imply p99 latency under sustained arrivals. Completion-only quantiles omit timeouts: a system that drops its slow requests can appear faster. Preserve the timeout rate and define whether deadlines create censored observations or explicit service failures. If the desired quantile falls beyond the censoring boundary, report that it is unresolved or exceeds the deadline; do not invent an exact latency.

**DERIVED.** Fixed compute must distinguish training, tuning, curation, and inference. Equation 6.8 in [§6.3](06-3-controlled-comparisons.md) is a dense training approximation, not a currency conversion. Sparse computation, recomputation, sequence length, and kernel efficiency can separate useful model FLOPs, executed operations, accelerator-hours, and money. A compute-matched comparison may intentionally allow different wall-clock times, but must expose them. If curation is reused across many runs, publish both the first-use and amortised accounting rule.

**MATHEMATICALLY-DERIVED.** For a shared one-time curation cost C_curate used by H registered downstream runs, the per-run allocation C_curate/H is an accounting convention whose sum recovers C_curate. Its defensibility depends on H representing actual or explicitly assumed reuse. Increasing an assumed H without running the additional workloads lowers the displayed allocated cost without reducing the resources consumed. Report H and sensitivity rather than hiding this assumption in a price-per-token number.

```figure
id: fig-6.25
kind: calculator
title: Amortised curation cost and the top-up it implies
caption: >-
  This composes the section's allocation rule C_curate/H with Eq. 6.8's
  top-up at verification.md's N and D_low. The one-time cost of 6 × 10¹⁷
  FLOPs is ASSUMED so that H = 10 filtered runs (five seed blocks × two
  budgets) reproduces verification.md's per-run 6 × 10¹⁶. Move H and watch
  the second output. The allocated share and the top-up change by 100×
  across the presets, yet the resources consumed never move. That is why H
  is reported beside every amortised number.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-6.8"]
alt: >-
  Calculator for the per-run allocation C_curate/H composed with the Eq. 6.8
  top-up ΔD = allocation/(6N), with inputs one-time curation FLOPs, H
  registered runs sharing it, N and D. At C_curate = 6 × 10¹⁷, H = 10,
  N = 10⁸ and D = 2 × 10⁹: 6 × 10¹⁶ FLOPs per run, a recovered total of
  6 × 10¹⁷, a top-up of 10⁸ tokens, 5 % of D. At H = 1, the first-use
  ledger: 6 × 10¹⁷ per run, 10⁹ tokens, 50 %. At H = 100, an assumed reuse:
  6 × 10¹⁵ per run, 10⁷ tokens, 0.5 %. The consumed total is 6 × 10¹⁷ in
  every case.
spec:
  tex: >-
    C_{\text{alloc}}=\frac{C_{\text{curate}}}{H},\qquad \sum_{h=1}^{H} C_{\text{alloc}} = C_{\text{curate}},\qquad \Delta D=\frac{C_{\text{alloc}}}{6N}
  inputs:
    - { symbol: Cc, label: "one-time curation FLOPs C_curate", default: 6.0e17, min: 1.0e15, max: 1.0e19, scale: log10, format: flops }
    - { symbol: H, label: "registered runs sharing it, H", default: 10, min: 1, max: 1000, scale: log10, format: integer }
    - { symbol: N, label: "parameters N", default: 1.0e8, min: 1.0e7, max: 1.0e10, scale: log10, format: params }
    - { symbol: D, label: "consumed tokens D", default: 2.0e9, min: 1.0e8, max: 1.0e12, scale: log10, format: tokens }
  outputs:
    - { symbol: al, label: "allocated per run, C_curate/H", formula: "Cc/H", format: flops }
    - { symbol: tot, label: "sum over H runs (resources consumed)", formula: "H*al", format: flops }
    - { symbol: dD, label: "Eq. 6.8 top-up per run, ΔD", formula: "al/(6*N)", format: tokens, emphasis: true }
    - { symbol: fr, label: "top-up as a share of D", formula: "dD/D", format: percent }
  presets:
    - { label: "first use, H = 1", values: { H: 1 } }
    - { label: "assumed reuse, H = 100", values: { H: 100 } }
    - { label: "D_high = 4 × 10⁹", values: { D: 4.0e9 } }
```

**DERIVED.** Fixed monetary cost needs actual input/output token counts and the provider's billing convention, or the full infrastructure allocation when self-hosting. Reasoning tokens, cache reads/writes, retries, retrieval, tools, idle reserved capacity, and failed runs can matter. The [shared cost-per-accepted-task definition](../../../front-matter/notation.md) keeps the denominator tied to usefulness. If there are zero accepted tasks, the finite ratio is undefined and the configuration fails the requirement; represent that state explicitly.

**ASSUMED — illustrative decision.** Under one hypothetical workload, suppose registered simultaneous quality intervals and exact task costs are as follows. These are arithmetic inputs only; no model or hardware performance is reported.

| Configuration | Quality interval | Cost per attempted task | At q_min = 0.70 |
|---|---|---|---|
| a | [0.72, 0.76] | 0.012 currency units | Feasible on quality |
| b | [0.69, 0.73] | 0.008 currency units | Feasibility unresolved |
| c | [0.66, 0.69] | 0.014 currency units | Below the quality floor |

**MATHEMATICALLY-DERIVED.** Configuration a dominates c on the displayed interval bounds and cost, but a and b remain incomparable: b is cheaper, while the intervals do not establish quality equality or a practical quality ordering. Removing b from all future study would confuse unresolved feasibility with known inferiority. Lowering q_min to 0.68 changes feasibility; that is a different decision, not new model evidence.

```figure
id: fig-6.26
kind: chart
title: Interval boxes of configurations a, b and c against q_min
caption: >-
  The illustrative table drawn as quality intervals at exact costs. Each
  configuration is a vertical bar from q_L to q_U, and the dashed line is
  the registered floor. The states follow the section. First the interval
  bounds settle dominance and feasibility. Then Algorithm 6.5 on midpoints
  draws a frontier that knows nothing about intervals. Then ranking by cost
  alone picks an unresolved point. Finally a new q_min changes the decision
  without new evidence. The values are ASSUMED arithmetic inputs, not
  measurements.
placement: rail
anchor: mechanism
evidence: ASSUMED
source: ["DERIVED:eq-6.13", "DERIVED:alg-6.5"]
alt: >-
  Chart of quality against cost per attempted task for three illustrative
  configurations: a, quality [0.72, 0.76] at 0.012 currency units; b,
  [0.69, 0.73] at 0.008; c, [0.66, 0.69] at 0.014. A dashed floor q_min is at
  0.70. A dashed point-estimate frontier joins b's midpoint 0.71 and a's
  midpoint 0.74; c's midpoint 0.675 is dominated. At q_min = 0.70, a is
  feasible, b is unresolved and c is below the floor, and a dominates c
  because 0.72 ≥ 0.69 and 0.012 ≤ 0.014. At q_min = 0.68, b becomes
  feasible and c unresolved.
spec:
  type: line
  x: { label: "cost per attempted task, currency units", scale: linear, format: fixed3, domain: [0.006, 0.016] }
  y: { label: "quality interval [q_L, q_U]", scale: linear, format: fixed2, domain: [0.64, 0.78] }
  variables: { qmin: 0.70 }
  series:
    - { id: a, label: "a: [0.72, 0.76] at 0.012", points: [[0.012, 0.72], [0.012, 0.76]], emphasis: true }
    - { id: b, label: "b: [0.69, 0.73] at 0.008", points: [[0.008, 0.69], [0.008, 0.73]] }
    - { id: c, label: "c: [0.66, 0.69] at 0.014", points: [[0.014, 0.66], [0.014, 0.69]] }
    - { id: floor, label: "registered floor q_min", formula: "qmin", sample: { from: 0.006, to: 0.016, count: 2 }, dashed: true }
    - { id: front, label: "Algorithm 6.5 frontier on midpoints", points: [[0.008, 0.71], [0.012, 0.74]], dashed: true }
states:
  - { anchor: mechanism, label: "q_min = 0.70", variables: { qmin: 0.70 }, highlight: [a, c, floor], note: "a dominates c: q_L(a) = 0.72 ≥ q_U(c) = 0.69 at lower cost. b is cheaper but straddles the floor: unresolved, not inferior, and a and b stay incomparable." }
  - { anchor: algorithm, label: "midpoint frontier", variables: { qmin: 0.70 }, highlight: [front, a, b], note: "Algorithm 6.5 on point estimates: b (0.71) then a (0.74) enter, and c (0.675) falls below best_quality. The sort says nothing about feasibility, which is attached afterwards." }
  - { anchor: failure-modes, label: "infeasible winner", variables: { qmin: 0.70 }, highlight: [b, floor], note: "Ranking by cost alone crowns b at 0.008, but q_L(b) = 0.69 < 0.70, so Eq. 6.13 cannot certify it. Evaluate feasibility before ranking." }
  - { anchor: limitations, label: "q_min = 0.68", variables: { qmin: 0.68 }, highlight: [floor, b, c], note: "At q_min = 0.68, b is feasible and cheapest and c becomes unresolved. The decision owner supplied the constraint; no model evidence changed." }
```

**DERIVED.** Measured frontiers exist only over tested configurations. Connecting two points by a line is visual interpolation, not evidence that an intermediate checkpoint or serving policy exists. Randomly routing requests between two systems can interpolate expected scores and expected per-request costs under stationarity, but latency quantiles do not interpolate linearly. A mixture policy must be evaluated as another system if a latency constraint matters.

```figure
id: fig-6.27
kind: chart
title: p99 of a random-routing mixture is not the chord
caption: >-
  A worked counter-example to drawing a line between two measured points.
  Two systems have ASSUMED exponential per-request latencies with means
  0.25 s (B) and 1 s (A), and no queueing. Routing a fraction w of requests
  to A moves the mean exactly along its chord. The p99 of the mixture
  climbs far faster. At w = 0.1 it is 2.31 s against a chord value of
  1.50 s, because the tail belongs to whichever system owns it. Any
  constraint on ℓ_p therefore needs the mixture measured as its own system.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.12"
alt: >-
  Line chart of latency in seconds against the routing weight w on the
  slower system, from 0 to 1. The mean latency 0.25 + 0.75w is a straight
  line from 0.25 s to 1 s. The chord between the endpoint p99 values runs
  from 1.15 s to 4.61 s. The mixture p99, solved from
  w·e^(−t) + (1 − w)·e^(−4t) = 0.01, is 1.15 s at w = 0, 1.71 s at 0.05,
  2.31 s at 0.1, 3.00 s at 0.2, 3.40 s at 0.3, 3.91 s at 0.5, 4.38 s at 0.8
  and 4.61 s at 1. It lies above the chord at every interior w; the gap is
  0.82 s at w = 0.1 and about 1.2 s between w = 0.2 and 0.4.
spec:
  type: line
  x: { label: "share w of requests routed to the slower system", scale: linear, format: fixed2, domain: [0, 1] }
  y: { label: "latency, illustrative exponential services", scale: linear, format: seconds, domain: [0, 5] }
  series:
    - { id: p99, label: "mixture p99, solved exactly", points: [[0, 1.1513], [0.02, 1.3335], [0.05, 1.7146], [0.1, 2.3113], [0.2, 2.9962], [0.3, 3.4013], [0.4, 3.6889], [0.5, 3.912], [0.6, 4.0943], [0.7, 4.2485], [0.8, 4.382], [0.9, 4.4998], [1, 4.6052]], emphasis: true }
    - { id: chord, label: "chord between endpoint p99s", formula: "ln(100)*(0.25 + 0.75*x)", sample: { from: 0, to: 1, count: 2 }, dashed: true }
    - { id: mean, label: "mean latency, exactly linear", formula: "0.25 + 0.75*x", sample: { from: 0, to: 1, count: 2 } }
  annotations:
    - { x: 0.1, label: "w = 0.1: p99 2.31 s vs chord 1.50 s" }
```

**DERIVED — cost line.** A grid with K configurations requires K quality/resource measurements, each with its own repeated windows or seeds. Parameters and checkpoint bytes vary only when the configuration changes them; generated tokens and inference FLOPs generally vary even at fixed prompt count. Timing telemetry adds linear event writes, bounded buffers, and communication to the collector. Memory traffic and network traffic must be measured at the same boundary as performance. Energy, money, latency, and achieved throughput remain UNVERIFIED until the proposed workload runs.

## Algorithm

```text
Algorithm 6.5 — Exact two-axis frontier among measured points
INPUT   K validated (configuration_id, exact_cost, estimated_quality) records
OUTPUT  non-dominated measured points; separate uncertainty annotations
STATE   best_quality = -infinity; frontier = []
INVARIANT  best_quality is the maximum quality among all lower-cost groups
1  Reject mixed workload ids, incomparable metrics, NaN values, and missing costs.
2  Sort by increasing cost, then decreasing quality, then bounded configuration id.
3  Process each equal-cost group together; retain its maximum quality value q_group.
4  If q_group > best_quality, emit every tied configuration at q_group in this group.
5  Set best_quality = max(best_quality, q_group); discard dominated lower qualities.
6  Attach interval-based feasibility and dominance status; do not infer it from the sort.
7  Preserve the full input table, including every discarded or unresolved point.
```

**DERIVED.** Sorting and scanning cost O(K log K) time and O(K) output/storage space; comparisons are O(1) for finite machine numbers and bounded ids. Ties with identical quality and cost are equivalent measured points, not strictly dominating ones. This algorithm handles exactly two objectives and point estimates. For a fixed small number of additional objectives, use an appropriate multidimensional dominance data structure; for an unbounded configuration set, reject an all-pairs quadratic scan. Joint interval comparisons require their own justified procedure.

## Implementation

**OFFICIAL-DOCUMENTATION · [R6.34](references.md).** vLLM's serving benchmark documents requested percentile metrics and goodput objectives. Its timing-based goodput arguments do not by themselves check task correctness. Join latency telemetry to independently scored responses by request id before applying a quality-and-service acceptance rule.

**ASSUMED.** vLLM, SGLang, and TensorRT-LLM occupy the *Inference engine* layer. A comparison can treat engine choice as the factor while holding checkpoint, numeric format, hardware, and request stream fixed. No speed ordering or API compatibility among these engines is asserted. Specify accelerator model/count, memory, interconnect, driver, engine commit, checkpoint revision, precision, sequence-length distribution, concurrency, cache policy, warm-up, and timing boundary before reporting any measurement.

**OFFICIAL-DOCUMENTATION · [R6.7, R6.8](references.md).** Artificial Analysis describes customer-visible endpoint performance under named workloads and a specified token-count convention. Those observations belong to that endpoint and protocol. **DERIVED.** They cannot supply missing hardware measurements for a self-hosted checkpoint comparison.

```text
Systems trace
immutable workload -> replay scheduled arrivals / bounded queue / record rejected requests
engine             -> token generation / checkpoint + KV bytes / collect runtime identity
client             -> monotonic delivery timestamps / preserve timeout and cancellation events
scorer             -> independent correctness decision / retain output and scorer hashes
join               -> request-id keyed quality + service record / reject missing pairs
analysis           -> constraints then frontier / retain raw points and uncertainty
```

## Experimental design

### Experiment 6.5 — Frontier movement under load and output constraints

- **Hypothesis:** a throughput gain does not necessarily preserve the feasible quality/latency region.
- **Setup:** proposal; freeze one checkpoint and vary concurrency and output limits.
- **Independent variables:** registered concurrency levels; generation length cap; cache state.
- **Controlled variables:** prompts, engine revision, precision, hardware, arrival trace, scorer.
- **Dataset/workload:** paired short- and long-input tasks, preserving the same mixture weights.
- **Hardware:** fully specified deployment manifest required before execution; currently UNVERIFIED.
- **Metrics:** quality, TTFT, TPOT, p99 E2E latency, timeout fraction, goodput, cost per accepted task.
- **Baselines:** default registered configuration at the same offered workload.
- **Expected result:** configuration-dependent movement of measured points; direction and magnitude remain UNVERIFIED.
- **Ablation:** compare completed-only statistics with the full attempted-request accounting.
- **Interpretation:** a gain disappearing under quality or timeout constraints does not support constrained efficiency.
- **Threats to validity:** warm-up, client saturation, endpoint drift, correlated time windows, output-length shift.

## Observations

**What the paper claims.** PAPER-REPORTED: P38 motivates latency-constrained serving performance; P09 studies training allocation under compute constraints. Neither establishes this chapter's proposed operating points.

**What the evidence shows.** DERIVED: a resource constraint identifies the estimand; it does not make different quality metrics commensurable or remove hidden system components.

**What we infer.** DERIVED: publish the measured feasible set, uncertainty, and selection rule together. A selected point without its rejected alternatives conceals the trade-off.

**What remains unknown.** UNVERIFIED: frontier location for the planned workload, tail latency, energy, and actual monetary allocation. NOT-DISCLOSED: endpoint internals when providers do not expose them.

## Failure modes

> **Failure mode — Impossible composite point [DERIVED].** *Symptom:* the reported configuration combines minimum latency and maximum quality from different settings. *Cause:* summaries joined by model name. *Detection:* compare configuration hashes. *Mitigation:* one immutable configuration id per point.

> **Failure mode — Infeasible winner [DERIVED].** *Symptom:* the cheapest system misses a required quality floor. *Cause:* unconstrained ranking. *Detection:* evaluate Eq. 6.13 before ranking. *Mitigation:* separate feasibility from resource optimisation.

> **Failure mode — Hidden censoring [DERIVED].** *Symptom:* tail latency improves while timeout rate rises. *Cause:* slow failures omitted. *Detection:* reconcile arrivals, completions, and failures. *Mitigation:* retain attempted-request denominators and report censoring.

## Siblings

**Controlled attribution — [§6.3](06-3-controlled-comparisons.md).** DERIVED: holds non-intervention components fixed to identify a cause. A frontier comparison instead selects complete systems; it permits several components to differ but cannot assign causality to one of them.

**Scalar utility — [§2.6](../ch02-mathematical-and-statistical-foundations/02-6-optimization-language.md).** DERIVED: converts trade-offs into a scalar using explicit weights. The changed primitive is a utility function instead of dominance; sensitivity to units and weights becomes the failure mode. No utility is inferred from a leaderboard rank.

**Capacity planning — [Chapter 48](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md).** ASSUMED forward route: adds time-varying demand and deployment economics. The changed boundary is a service over an attribution window, requiring load and cost evidence beyond an isolated configuration test.

## Extensions

**ASSUMED.** Agent frontiers must count tool calls and retries; multimodal frontiers need workload measures for images, audio, and video; long-context frontiers retain retrieval correctness alongside latency. Domain adaptation adds retention constraints on the original domain. These extend the objective vector and require explicit priorities when no point satisfies all constraints.

## Limitations

**DERIVED.** A frontier depends on the tested candidate set, workload, and accounting boundary. It does not prove global optimality. Simultaneous interval boxes can be conservative, and tails require enough independent service windows. A Pareto set supplies alternatives; it does not choose among incomparable alternatives without a utility or constraint supplied by the decision owner.

## Reproducibility

**ASSUMED.** Preserve all points, workload hashes, paired raw outcomes, actual resource ledgers, uncertainty method, feasibility thresholds, currency date, and amortisation assumptions. Store runtime identity per run rather than per project. No experiment, latency measurement, or economic benchmark was executed for this edition.

## References

[Chapter reference register](references.md): P07, P09, P38, P50; R6.7, R6.8, R6.28, R6.34. Metric ownership: [notation](../../../front-matter/notation.md); dominance ownership: [§2.6](../ch02-mathematical-and-statistical-foundations/02-6-optimization-language.md).
