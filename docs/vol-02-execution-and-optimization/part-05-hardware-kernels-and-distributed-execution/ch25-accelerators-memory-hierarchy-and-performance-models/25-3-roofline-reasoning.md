---
id: "ms.section.25.3"
entity_type: "section"
title: "Roofline reasoning"
short_title: "Roofline reasoning"
volume: 2
part: 5
chapter: 25
section: 25.3
slug: "25-3-roofline-reasoning"
parent: "ms.chapter.25"
prev_sibling: "ms.section.25.2"
next_sibling: "ms.section.25.4"
children: []
prerequisites: ["ms.chapter.1", "ms.chapter.2", "ms.chapter.3", "ms.chapter.5", "ms.chapter.13", "ms.chapter.14", "ms.chapter.15", "ms.chapter.16", "ms.chapter.17"]
downstream: ["ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29", "ms.chapter.30"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "inference", "serving"], "mechanism": ["hardware", "performance_model", "memory_hierarchy"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.nvidia-cuda", "impl.amd-rocm", "impl.google-tpu-xla"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "KNOWN", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED", "ASSUMED"], "empirically_observed": false}
word_count_target: 1800
updated_at: "2026-10-09"
editorial_status: "manuscript_draft"
---

# 25.3 — Roofline reasoning

## Scope

[DERIVED] Use compute and memory service bounds to classify a declared operator, then identify where launch overhead, insufficient parallelism, or dependency latency invalidates the two-ceiling approximation. The deliverable is a falsifiable bottleneck hypothesis with a measurement boundary. A roofline is a bound under counted traffic and a chosen precision; it is not a throughput forecast obtained by dividing all model FLOPs by a vendor peak.

## Why this exists

[PAPER-REPORTED] The May 2026 analytical-model study explicitly adds memory-hierarchy, pipeline, occupancy, and overhead terms beyond a naive peak-only roofline [R25.4], §§IV–V. Its use of calibrated coefficients motivates an audit of which quantities are independently measured and which are fitted to the same cases later reported as validation.

[MATHEMATICALLY-DERIVED] A bound can correctly identify an impossible performance target while badly predicting actual runtime. If a kernel requires ten microseconds of unavoidable dispatch and one microsecond of ideal device service, a service-only calculation understates latency by elevenfold. That discrepancy does not invalidate the service bound. It invalidates treating a lower bound as a complete runtime model.

## Intuition

[MATHEMATICALLY-DERIVED] Arithmetic intensity is work per byte crossing a selected boundary. Each byte supplies some arithmetic. At low intensity the byte service limits the attainable arithmetic rate; at high intensity the arithmetic engine limits it. Changing the boundary changes intensity: a tile can have high HBM reuse but poor register or shared-memory reuse. Therefore an “HBM-bound” label must name the HBM traffic count and the rate used.

[DERIVED] Launch count adds another axis. Many small kernels may each fall below the size needed to fill the device. Summing their FLOPs into one large hypothetical kernel invents parallelism that the execution graph does not possess. Preserve operator boundaries until a real fusion or capture transformation changes them.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $F$ | Useful arithmetic in the declared operator | FLOPs |
| $Q$ | Bytes crossing the chosen memory boundary | Bytes |
| $I=F/Q$ | Arithmetic intensity at that boundary | FLOPs/byte |
| $P$ | Compatible sustained or peak arithmetic ceiling | FLOP/s |
| $B_{\rm mem}$ | Compatible sustained or peak boundary bandwidth | Bytes/s |
| $\lambda$ | Exposed per-launch overhead | Seconds |
| $n_k$ | Number of serialized launches | Count |

[MATHEMATICALLY-DERIVED] The ideal service bound and crossover are

$$
t_{\rm service}\geq\max(F/P,Q/B_{\rm mem}),\qquad
P_{\rm attainable}\leq\min(P,I B_{\rm mem}),\qquad
I_* = P/B_{\rm mem},\qquad
t_{\rm model}\approx n_k\lambda+\max(F/P,Q/B_{\rm mem}).
$$

*(Eq. 25.5)*

[DERIVED] If launch overhead is exposed and device service is serial, a first-order analytical model is $t_{\rm model}=n_k\lambda+\max(F/P,Q/B_{\rm mem})$. This model is a declared approximation, not a theorem about arbitrary concurrent launches. Use the calculator to vary each term rather than assuming its default configuration was measured.

```figure
id: fig-25.8
kind: chart
title: A service roof is an analytical ceiling
caption: This curve is min(P, I times bandwidth) for selected analytical rates. The knee is at 1000 FLOPs per byte; it is not a measured accelerator result.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.5
alt: This curve is min(P, I times bandwidth) for selected analytical rates. The knee is at 1000 FLOPs per byte; it is not a measured accelerator result.
spec:
  type: line
  x:
    label: Arithmetic intensity / FLOPs per byte
    scale: log10
    domain:
    - 1
    - 10000
  y:
    label: Arithmetic service ceiling
    scale: log10
    format: flop/s
  variables:
    P: 1000000000000000.0
    B: 1000000000000.0
  series:
  - id: roof
    label: Analytical service bound
    formula: min(P,x*B)
    sample:
      from: 1
      to: 10000
      count: 120
    emphasis: true
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] A dense $M\times K$ by $K\times N$ multiply has $F\approx2MKN$. If each input is fetched once and the output written once, its compulsory traffic is $Q_{\rm min}=b(MK+KN+MN)$, excluding a read of an existing output and precision conversion. This is an ideal-reuse lower bound. An implementation that repeatedly loads an input tile has larger $Q$ and lower intensity. An output accumulation with nonzero prior coefficient adds output-read traffic unless the prior output is already resident at the counted boundary.

[MATHEMATICALLY-DERIVED] For a single-vector projection with $M=1$ and large $K,N$, weights dominate $Q$, giving $I\approx2/b$. For a batch with weights reused across $M$ rows, $I$ rises approximately in proportion to $M$ until activation/output traffic matters. That derivation explains a possible bottleneck transition without claiming that every decode workload is bandwidth-limited or that batching preserves a latency deadline.

[ASSUMED] Consider an analytical device with $P=10^{15}$ FLOP/s, $B_{\rm mem}=10^{12}$ bytes/s, and $\lambda=5\,\mu$s. Its crossover is $1000$ FLOPs/byte. A kernel with $F=10^9$ and $Q=10^7$ has intensity $100$ and ideal memory time $10\,\mu$s versus compute time $1\,\mu$s. With one exposed launch the model gives $15\,\mu$s. These are selected inputs to inspect the equation; they are neither specifications nor measured results for any listed accelerator.

```figure
id: fig-25.9
kind: calculator
title: Separate compute, memory, and exposed launch time
caption: Selected analytical defaults give 1 microsecond compute service, 10 microseconds memory service, and 5 microseconds exposed dispatch. Change the rates and work to inspect the transition.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.5
alt: Selected analytical defaults give 1 microsecond compute service, 10 microseconds memory service, and 5 microseconds exposed dispatch. Change the rates and work to inspect the transition.
spec:
  tex: t=n_k\lambda+\max(F/P,Q/B)
  equation: '25.5'
  inputs:
  - symbol: F
    label: Useful FLOPs
    default: 1000000000.0
    min: 1000000.0
    max: 1000000000000.0
    step: 1000000.0
    format: flops
  - symbol: Q
    label: Boundary bytes
    default: 10000000.0
    min: 1000.0
    max: 10000000000.0
    step: 1000.0
    format: bytes
  - symbol: P
    label: Compatible arithmetic rate
    default: 1000000000000000.0
    min: 1000000000000.0
    max: 1.0e+16
    step: 1000000000000.0
    format: flop/s
  - symbol: B
    label: Boundary byte rate
    default: 1000000000000.0
    min: 1000000000.0
    max: 10000000000000.0
    step: 1000000000.0
    format: bytes/s
  - symbol: nk
    label: Serialized launches
    default: 1
    min: 1
    max: 100
    step: 1
    format: integer
  - symbol: launch
    label: Exposed launch seconds
    default: 5.0e-06
    min: 0
    max: 0.001
    step: 1.0e-06
    format: seconds
  outputs:
  - symbol: tc
    label: Compute service
    formula: F/P
    format: seconds
  - symbol: tm
    label: Memory service
    formula: Q/B
    format: seconds
  - symbol: total
    label: First-order model
    formula: nk*launch+max(F/P,Q/B)
    format: seconds
  presets: []
anchor: mechanism
```

[MATHEMATICALLY-DERIVED] Occupancy constrains the work that can be resident. Let a block require $r_b$ register bytes and $s_b$ shared-memory bytes, with unit budgets $R_u,S_u$ and an architectural block limit $b_{\max}$. Then resident blocks are bounded by $\min(\lfloor R_u/r_b\rfloor,\lfloor S_u/s_b\rfloor,b_{\max})$. This is a capacity bound. It becomes a latency-hiding argument only after considering independent eligible work and memory-level concurrency.

[MATHEMATICALLY-DERIVED] To sustain byte rate $B$ with average transfer latency $\ell$ and useful transfer size $q$, at least approximately $B\ell/q$ transfers must be in flight under a stable-flow model. Extra resident warps can help supply those transfers, but dependent pointer chasing cannot generate arbitrary concurrency. Conversely, a sufficiently pipelined matrix kernel may need fewer resident blocks than a memory-latency-bound gather. Maximizing occupancy is not an objective independent of useful throughput.

[DERIVED] Distinguish a hierarchical roofline from one HBM roof. Repeat the intensity calculation at each boundary with boundary-specific bytes. A cache-resident benchmark can legitimately exceed $I_{\rm HBM}B_{\rm HBM}$ if $I_{\rm HBM}$ was incorrectly formed from logical bytes rather than actual HBM traffic; the problem is the inconsistent denominator. Also include scalar issue, special functions, and synchronization when they bound a stage outside the arithmetic class used by $P$.

```figure
id: fig-25.10
kind: stat-panel
title: Residency is a capacity bound
caption: For selected local resource budgets, registers permit eight blocks, staging permits four, and the architectural limit permits eight. Four resident blocks do not by themselves prove latency hiding.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.5
alt: For selected local resource budgets, registers permit eight blocks, staging permits four, and the architectural limit permits eight. Four resident blocks do not by themselves prove latency hiding.
spec:
  header: ANALYTICAL CONFIGURATION
  variables:
    R: 65536
    r: 8192
    S: 65536
    s: 16384
    lim: 8
  rows:
  - key: Register-limited blocks
    formula: floor(R/r)
    format: integer
  - key: Staging-limited blocks
    formula: floor(S/s)
    format: integer
  - key: Resident block bound
    formula: min(floor(R/r),floor(S/s),lim)
    format: integer
anchor: implementation
```

## Algorithm

### Algorithm 25.5 — Bottleneck classification with interval uncertainty

[DERIVED] Inputs are $F,Q$, compatible rate intervals $[P_-,P_+]$, $[B_-,B_+]$, launch count, and measured exposed-overhead bounds. Output is a classification and a predicted interval. State contains only a finite operator ledger; this is a diagnostic procedure.

$$
\begin{aligned}
(1)\quad&t_c\leftarrow[F/P_+,F/P_-],\quad t_m\leftarrow[Q/B_+,Q/B_-].\\
(2)\quad&\operatorname{class}\leftarrow
\begin{cases}
\mathrm{compute},&\inf t_c>\sup t_m,\\
\mathrm{memory},&\inf t_m>\sup t_c,\\
\mathrm{unresolved},&\text{otherwise}.
\end{cases}\\
(3)\quad&t_{\rm model}\leftarrow n_k[\lambda_-,\lambda_+]+\max(t_c,t_m).\\
(4)\quad&\operatorname{boundaryMismatch}\lor\operatorname{unsupportedDtype}
\Rightarrow\mathrm{REJECT};\quad\mathrm{return}\ (\operatorname{class},t_{\rm model}).
\end{aligned}
$$

*(Eq. 25.6)*

Interval maximum applies endpointwise because the arguments are nonnegative. Positive lower rate bounds are required; otherwise the upper-time bound is unbounded. The invariant is dimensional compatibility and one fixed counting boundary. Cost is $O(1)$ per ledger row and $O(n)$ for $n$ operators. A mismatch between measurement and prediction triggers model revision; it must not be hidden by silently changing $Q$. The compute/memory classification concerns the ideal service terms; an exposed launch term can dominate end-to-end time even when that service classification is unambiguous. Rate intervals here are supplied uncertainty bounds, not automatically confidence intervals. Their coverage requires a sampling and calibration protocol. Correlated power or contention effects also prevent interpreting independently selected interval endpoints as equally likely configurations.

## Implementation

[DERIVED] Use profiler counters to test the hypothesis, with the kernel's target, precision, clock/power policy, cache state, launch geometry, and profiler version recorded. Compare device event timing with synchronized wall time to detect exposed host or launch work. Counter collection can perturb scheduling; retain a timing-only run and a counter run as separate artifacts. A framework's total graph time includes boundaries absent from an isolated kernel measurement.

## Experimental design

### Reported experiments

[PAPER-REPORTED] [R25.4], §V-B, specifies ten warmups, one hundred repetitions, median timing, and profiler/library comparisons. Its §IV-D allows optional case-specific multipliers, and §IV-G excludes some queueing and multi-node effects. Consequently, fitted accuracy is not evidence of portable out-of-sample prediction. This chapter does not reproduce its percentage-error headline as a general guarantee.

## Observations

**What the paper claims.** [PAPER-REPORTED] The modeling paper reports improved fit over a peak-only baseline for its tested cases [R25.4], §V.

**What the evidence shows.** [KNOWN] The disclosed model has calibrated terms and a restricted workload domain. The public text does not turn a low fitting error into independent cross-platform replication.

**What we infer.** [MATHEMATICALLY-DERIVED] The roofline bound remains useful for impossibility checks and controlled bottleneck hypotheses. Prediction requires the additional exposed and serialized work described above.

**What remains unknown.** [UNVERIFIED] Generalization to unseen shape distributions, power policies, concurrent services, and newer targets has not been checked by this edition. No held-out hardware timing dataset was produced here.

## Failure modes

> **Failure mode — Boundary drift.** [DERIVED] *Symptom:* arithmetic intensity changes without a program change. *Cause:* logical bytes, cache bytes, and HBM bytes are mixed. *Detection:* identify the counter and denominator for every row. *Mitigation:* keep one explicit memory boundary per intensity.

> **Failure mode — Calibration leakage.** [DERIVED] *Symptom:* near-perfect predictions on the cases used to tune per-case factors. *Cause:* the validation target entered the model inputs. *Detection:* audit parameter fitting and held-out cases. *Mitigation:* freeze coefficients before validation and report fit and holdout errors separately.

## Siblings

[DERIVED] A roofline gives resource ceilings; a critical-path model adds dependencies; an empirical regression predicts within the support of its training measurements; a cycle simulator models finer execution at greater configuration and compute cost. Their validation obligations differ. Resource assignment belongs to [§25.1](25-1-accelerator-organization.md); physical path constraints to [§25.4](25-4-physical-connectivity.md). None of these models substitutes for a comparable application experiment.

## Extensions

### Improvements

[DERIVED] A useful extension adds one independently measurable omitted term at a time: launch overhead, working-set-dependent traffic, or a serialization edge. An extra fitted coefficient can reduce training error even when its proposed physical interpretation is false. Evaluate whether the extension predicts a held-out bottleneck transition and whether its parameters remain stable under the declared operating regime.

## Limitations

[DERIVED] Eq. 25.5 assumes the counted arithmetic and bytes have compatible service ceilings. It does not claim full overlap, power independence, unlimited parallelism, or cache-hit stability. Near the crossover, uncertainty can change the classification. Report “unresolved” when intervals overlap instead of manufacturing a precise dominant-resource label.

## Reproducibility

[DERIVED] Archive the FLOP convention, input/output-read treatment, traffic boundary, sustained-rate calibration, raw timings, warmup policy, exposure assumptions, and frozen coefficient set. The verification protocol varies intensity and launch count independently. All plotted curves in this section are analytical; no benchmark measurements are synthesized.

## References

[R25.4], inspected §§IV–V; source and discrepancy notes in [references.md](references.md).
