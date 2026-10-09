---
id: "ms.section.25.6"
entity_type: "section"
title: "Cluster constraints"
short_title: "Cluster constraints"
volume: 2
part: 5
chapter: 25
section: 25.6
slug: "25-6-cluster-constraints"
parent: "ms.chapter.25"
prev_sibling: "ms.section.25.5"
next_sibling: null
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

# 25.6 — Cluster constraints

## Scope

[DERIVED] Convert a feasible device-level workload into a rack/cluster plan constrained by topology, power, cooling, storage, scheduling, failure domains, and retained useful progress. The output is an admission envelope and a causal utilization ledger. A rack's installed matrix peak is not achieved training progress; a busy-device counter is not an application success metric. Detailed recovery protocols are owned by Chapter 30.

## Why this exists

[OFFICIAL-DOCUMENTATION] The 2026 platform disclosures explicitly include rack-scale connectivity, cooling, serviceability, and fault isolation [R25.1, R25.2]. Those features widen the system boundary beyond a chip. Their presence does not establish the failure distribution, power headroom, or sustained application utilization of an unspecified deployment.

[DERIVED] Device-focused optimization can increase cluster cost when it changes the power envelope, stretches checkpoint traffic, or creates a placement that crosses a constrained fabric cut. Capacity that exists in inventory may be unavailable as one contiguous communication group. A plan must distinguish installed devices, healthy devices, admitted job allocations, actively executing devices, and retained useful progress.

## Intuition

[MATHEMATICALLY-DERIVED] Think of admission as satisfying several simultaneous inequalities. A job can fit in HBM yet exceed the rack's power or cooling budget. It can satisfy those budgets yet fail its input-service rate. It can meet average rates yet stall behind synchronized checkpoint bursts. The limiting constraint is the first violated condition under the declared schedule, not the largest number in the specification sheet.

[DERIVED] Utilization losses require a time ledger. Compilation, input starvation, communication waits, checkpointing, recovery, and queueing are different states. Attribution must avoid counting overlapping waits twice. A change that reduces kernel time may make input preparation the new bottleneck; the old utilization decomposition must then be recomputed.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $g$ | Admitted accelerator count | Count |
| $p_g,p_h,p_n$ | Per-accelerator, host, and network electrical demand | Watts |
| $P_{\rm rack}$ | Rack electrical budget at the declared boundary | Watts |
| $H_{\rm cool}$ | Removable thermal load at the declared conditions | Watts |
| $r_d$ | Input bytes required per accelerator per second | Bytes/s |
| $B_s$ | Usable shared storage/input path rate | Bytes/s |
| $T_u,T_w$ | Time contributing retained useful progress; wall time | Seconds |

[MATHEMATICALLY-DERIVED] A necessary steady-state admission envelope is

$$
gp_g+p_h+p_n\le\min(P_{\rm rack},H_{\rm cool}),\qquad
gr_d\le B_s,\qquad M_h^{\rm peak}\le C_h\quad\forall h.
$$

*(Eq. 25.11)*

Thermal removal and electrical input are related but not identical measurement boundaries. Include the non-accelerator components and their conditions. A power cap is not a measured average draw; use a conservative envelope for admission and measured energy over time for efficiency reporting.

```figure
id: fig-25.17
kind: diagram
title: Cluster admission has simultaneous constraints
caption: A workload placement must pass memory, topology, power/cooling, and input-service checks before admission. Passing one branch does not compensate for failing another.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.11
alt: A workload placement must pass memory, topology, power/cooling, and input-service checks before admission. Passing one branch does not compensate for failing another.
spec:
  direction: LR
  nodes:
  - id: job
    kind: process
    label: Workload placement
  - id: mem
    kind: memory
    label: Capacity check
  - id: top
    kind: flow
    label: Fabric cut check
  - id: power
    kind: hardware
    label: Power and cooling
  - id: input
    kind: dataset
    label: Input service
  - id: admit
    kind: branch
    label: All constraints pass
  edges:
  - from: job
    to: mem
    kind: flow
  - from: job
    to: top
    kind: flow
  - from: job
    to: power
    kind: flow
  - from: job
    to: input
    kind: flow
  - from: mem
    to: admit
    kind: flow
  - from: top
    to: admit
    kind: flow
  - from: power
    to: admit
    kind: flow
  - from: input
    to: admit
    kind: flow
```

## Mechanism

### Methodology

[DERIVED] Start with the workload graph and group mapping from the preceding sections. Map hosts, local fabrics, rack uplinks, power feeds, cooling loops, and storage paths onto failure and resource domains. A failure domain is the set of allocations affected by an event; it need not match a rank group or a rack. Redundant links can preserve connectivity while reducing usable bandwidth. An application may remain running yet miss its latency or progress target.

[MATHEMATICALLY-DERIVED] If each of $g$ independent devices has event rate $\nu$, the aggregate device-event rate is $g\nu$ under an independent Poisson model. This is an assumption-driven scaling relation, not a measured cluster failure rate. Common-cause rack, power, firmware, and network events violate independence and require separate event classes. A per-chip reliability figure cannot by itself specify whole-job reliability.

[MATHEMATICALLY-DERIVED] For a simplified checkpoint policy with interval $\Delta$, checkpoint duration $c$, recovery duration $r$, and job event rate $\Lambda$, an approximate overhead fraction is

$$
\omega(\Delta)\approx c/\Delta+\Lambda(\Delta/2+r).
$$

*(Eq. 25.12)*

The first-order model assumes uniform failure position within the interval, rare events ($\Lambda\Delta\ll1$), small checkpoint duty fraction ($c/\Delta\ll1$), and no checkpoint overlap or failed checkpoints. Here $\Delta$ approximates the useful-computation interval between checkpoints; the $c/\Delta$ term drops higher-order wall-time corrections. Differentiating the first two interval-dependent terms gives $\Delta_*\approx\sqrt{2c/\Lambda}$. This is an analytical sensitivity result, not an operational recommendation without measured rates, storage constraints, and recovery semantics.

[DERIVED] Input service must be modeled as a pipeline: storage read, decompression/decoding, preprocessing, host staging, transfer, and consumption. If stages overlap perfectly, steady-state service is limited by the slowest stage; first-batch latency retains the serial path. Queue capacity adds burst tolerance but cannot repair a long-run service deficit. An input cache changes which storage boundary is active and must be included in the experiment identity.

[MATHEMATICALLY-DERIVED] A checkpoint with $S_c$ bytes, written every $\Delta$ seconds, requires average rate $S_c/\Delta$. If $k$ jobs write at once over one path, the burst requires at least $kS_c/B_s$ seconds even when the average is feasible. Admission must therefore check both mean demand and synchronized bursts. Staggering changes the schedule, while reducing stored state changes recovery semantics; they are different interventions.

```figure
id: fig-25.18
kind: calculator
title: Electrical and input-service headroom
caption: Selected analytical budgets show the independent power and storage limits. Negative headroom rejects the proposed placement; the calculation does not represent any named rack.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.11
alt: Selected analytical budgets show the independent power and storage limits. Negative headroom rejects the proposed placement; the calculation does not represent any named rack.
spec:
  tex: H_P=P_{\rm rack}-gp_g-p_h-p_n
  equation: '25.11'
  inputs:
  - symbol: g
    label: Accelerators
    default: 64
    min: 1
    max: 256
    step: 1
    format: integer
  - symbol: pg
    label: Watts per accelerator
    default: 1000
    min: 100
    max: 3000
    step: 50
    format: si
  - symbol: ph
    label: Host and network watts
    default: 8000
    min: 0
    max: 50000
    step: 500
    format: si
  - symbol: budget
    label: Rack and cooling envelope watts
    default: 80000
    min: 10000
    max: 300000
    step: 1000
    format: si
  - symbol: rd
    label: Input bytes/s per accelerator
    default: 100000000.0
    min: 1000000.0
    max: 10000000000.0
    step: 1000000.0
    format: bytes/s
  - symbol: Bs
    label: Shared input service bytes/s
    default: 10000000000.0
    min: 100000000.0
    max: 1000000000000.0
    step: 100000000.0
    format: bytes/s
  outputs:
  - symbol: power
    label: Power headroom / watts
    formula: budget-g*pg-ph
    format: si
  - symbol: storage
    label: Input service headroom
    formula: Bs-g*rd
    format: bytes/s
  presets: []
anchor: formulation
```

[DERIVED] Scheduling includes topology and shape constraints. A free count of sixteen devices does not imply two compatible eight-device groups or one contiguous sixteen-device group. Represent healthy devices and available links as a graph and test the required placement. Also record queue wait, reserved-but-idle allocations, and compilation time separately from steady-state execution. A scheduler can improve packing while worsening interference if it co-locates communication-heavy jobs on the same cut.

[PAPER-REPORTED] Google's June report treats resilience, deterministic testing, checkpoint/restore, and modular isolation as distinct system concerns [R25.5], pp. 6–8. Its discussion motivates preserving those separate states. The historical production percentages it cites are outside this chapter's requested evidence scope and are not imported as current measurements.

## Algorithm

### Algorithm 25.11 — Admission with causal loss accounting

[DERIVED] Inputs are a candidate placement, workload rates, resource budgets, failure-domain map, and finite observation interval. Output is a feasible envelope plus a mutually exclusive state ledger. This procedure does not claim to optimize all placements.

$$
\begin{aligned}
(1)\quad&\operatorname{supported}(w,\mathrm{placement})=0\Rightarrow\mathrm{REJECT}.\\
(2)\quad&\max_h M_h^{\rm peak}/C_h>1\Rightarrow\mathrm{REJECT}(\mathrm{capacity}).\\
(3)\quad&\operatorname{violatesPowerCooling}(25.11)\lor
\operatorname{violatesCut}(25.7)\Rightarrow\mathrm{REJECT}.\\
(4)\quad&\operatorname{inputRate}<gr_d\lor\operatorname{burstDeadlineMiss}
\Rightarrow\mathrm{REJECT}(\mathrm{service}).\\
(5)\quad&\{[a_k,b_k),s_k\}_{k=1}^{K}\leftarrow\operatorname{disjointStateTimeline};\quad
T_s\leftarrow\sum_{k:s_k=s}(b_k-a_k).\\
(6)\quad&\sum_sT_s\ne T_w\Rightarrow\mathrm{INVALID\_LEDGER};\quad
\mathrm{return}\ (\mathrm{admit},\{T_s\},T_u/T_w).
\end{aligned}
$$

*(Eq. 25.13)*

The timeline partitions wall time; nested/overlapping events require a declared causal attribution rule rather than additive double counting. Productive arithmetic lost to rollback is not retained progress. The admission checks cost the graph/route/lifetime analyses already defined; sorting $K$ state endpoints costs $O(K\log K)$. Missing resource or rate evidence yields “unresolved” rather than admission.

```figure
id: fig-25.19
kind: calculator
title: Checkpoint overhead under a simplified event model
caption: The rare-event analytical model separates checkpoint service from lost work and recovery. The selected event rate is an assumption; no production reliability measurement is implied. Inputs are restricted so that event probability and checkpoint duty fraction stay at or below one percent in this first-order regime.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-25.12
alt: The rare-event analytical model separates checkpoint service from lost work and recovery. The selected event rate is an assumption; no production reliability measurement is implied. Inputs are restricted so that event probability and checkpoint duty fraction stay at or below one percent in this first-order regime.
spec:
  tex: \omega=c/\Delta+\Lambda(\Delta/2+r)
  equation: '25.12'
  inputs:
  - symbol: c
    label: Checkpoint duration seconds
    default: 10
    min: 1
    max: 10
    step: 1
    format: seconds
  - symbol: delta
    label: Checkpoint interval seconds
    default: 1000
    min: 1000
    max: 10000
    step: 10
    format: seconds
  - symbol: rate
    label: Assumed job events per second
    default: 1.0e-06
    min: 1.0e-07
    max: 1.0e-06
    step: 1.0e-07
    format: raw
  - symbol: r
    label: Recovery duration seconds
    default: 60
    min: 0
    max: 3600
    step: 10
    format: seconds
  outputs:
  - symbol: overhead
    label: Approximate overhead fraction
    formula: c/delta+rate*(delta/2+r)
    format: percent
  - symbol: optimal
    label: Unconstrained optimum (may exceed slider range)
    formula: sqrt(2*c/rate)
    format: seconds
  presets: []
anchor: mechanism
```

## Implementation

[DERIVED] Persist job identity, device/link health, power and thermal telemetry, topology mapping, storage path, input queues, checkpoint policy, and compiler/runtime identity. Join those records by timestamps and configuration identity. Correlation between a hot rack and a slow step does not establish causation; a controlled intervention or a trace identifying the limiting resource is needed.

[DERIVED] Fault containment is not transparent recovery. A fabric reroute can preserve transfers while a lost rank still requires distributed-state recovery. An admission controller must distinguish degraded-but-correct operation, deadline violation, and state loss. The recovery runbook in Chapter 30 must specify checkpoint atomicity, RNG/data-loader state, optimizer shards, and restart ordering; this section supplies the capacity and time boundary it consumes.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] AMD's August technical disclosure describes link/switch failure cases and rerouting [R25.2], resilience figures. It does not disclose a complete independently replicated multi-month workload trace for the admission model here. Google's report explains architecture and reliability mechanisms [R25.5]; these are not book-run fault injections. The verification protocol consequently proposes separate healthy, degraded-fabric, input-starved, and recovery cases without claiming results.

## Observations

**What the paper claims.** [PAPER-REPORTED] Google's report connects resilience and isolation with sustained system execution [R25.5]. [OFFICIAL-DOCUMENTATION] AMD describes rack-scale fault isolation and rerouting [R25.2]. Their performance and availability statements remain attributed to their respective sources.

**What the evidence shows.** [KNOWN] The disclosed mechanisms have distinct resource and failure boundaries. They do not supply all quantities needed to predict retained progress for a new cluster/workload.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 25.11 requires simultaneous feasibility. Eq. 25.12 shows why checkpoint interval and event rate cannot be chosen independently of lost progress and storage cost.

**What remains unknown.** [NOT-DISCLOSED] Actual event-rate distributions, common-cause incidents, rack thermal margins, queueing, and application recovery times for an unspecified installation remain unknown. The chapter does not manufacture utilization targets from vendor peaks.

## Failure modes

> **Failure mode — Busy but unproductive.** [DERIVED] *Symptom:* high device activity accompanies low retained progress. *Cause:* recomputation, retries, stalled communication, or work later rolled back. *Detection:* reconcile successful progress with wall time and recovery state. *Mitigation:* optimize the dominant causal loss and validate retained progress after the change.

> **Failure mode — Average-rate admission.** [DERIVED] *Symptom:* simultaneous checkpoints stall jobs despite adequate average storage throughput. *Cause:* burst service was omitted. *Detection:* retain per-job write windows and shared-path demand. *Mitigation:* schedule bursts or provision capacity while preserving recovery requirements.

## Siblings

[DERIVED] Increasing local batch amortizes some overhead but can exceed memory or latency limits. Increasing parallel degree reduces per-rank state but can enlarge exposed communication and failure scope. Offload reduces local capacity pressure but increases shared-path demand. Their joint plan is developed in [§29.6](../ch29-parallelism-collectives-and-distributed-optimization/29-6-joint-optimization.md); no single utilization statistic chooses among them.

## Extensions

### Improvements

[DERIVED] A topology-aware, power-aware scheduler can change feasibility and interference, but this manuscript does not claim a measured benefit without a matching study. The derived extension is to evaluate candidate placements under healthy and declared degraded states, preserve unknown-rate intervals, and reject plans that only meet their deadline at an unvalidated optimistic bound.

## Limitations

[DERIVED] The cluster envelope is a necessary-condition model. It omits tail distributions and common-cause events unless explicitly supplied. The checkpoint sensitivity formula is not valid for frequent failures, nonuniform failures within an interval, or overlapped checkpoints without revising its accounting. Thermal and storage service can vary over time; a constant-rate model must state the interval where it applies.

## Reproducibility

[DERIVED] Retain workload and topology identities, power/cooling boundaries, rates with measurement intervals, event classes, raw timestamps, and a reconciliation proving that the state timeline partitions wall time. Record which observations are missing. The experiment in [verification.md](verification.md) is a proposal; this edition reports no executed cluster study or certified operational target.

## References

[R25.1], [R25.2], [R25.5]; dated technical disclosures and inspected boundaries in [references.md](references.md).
