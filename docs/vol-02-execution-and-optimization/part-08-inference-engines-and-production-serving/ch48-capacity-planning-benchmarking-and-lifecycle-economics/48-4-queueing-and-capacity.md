---
id: ms.section.48.4
entity_type: section
title: "Queueing and capacity"
volume: 2
part: 8
chapter: 48
section: 48.4
slug: 48-4-queueing-and-capacity
parent: ms.chapter.48
prev_sibling: ms.section.48.3
next_sibling: ms.section.48.5
children: []
prerequisites: [ms.chapter.6, ms.chapter.21, ms.chapter.25, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.chapter.46, ms.chapter.47]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [capacity_planning, benchmarking, resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.nvidia-triton-inference-server]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 48.4 Queueing and capacity

## Scope

[DERIVED] Capacity planning identifies the workload/configuration region that sustains accepted service and required tails, including failure reserves. The baseline divides peak throughput by mean demand or applies a universal utilization percentage. Success is a conditional capacity model with explicit stochastic/system assumptions, held-out prediction and rejected operating points. Chapters 42–46 own phase/resource/scheduler/control mechanisms; this section joins them to workload and service evidence.

## Why this exists

[DERIVED] A system can have sufficient average arithmetic capacity and still miss latency targets because bursts, variable output lengths and shared-state contention create queues. At saturation, small execution or arrival errors can change which requests overlap and amplify waiting. A reserve sized only for steady demand may disappear during a worker failure, cold restart or traffic redistribution.

[DERIVED] Queueing identities are useful precisely because their boundaries are explicit. Little's law relates stable means for the same population; it does not infer P99 latency from GPU utilization. A single-server service-time model can explain variability effects, but continuous batching makes request progress depend on concurrent requests and scheduling. Treating that engine as an iid service-time draw can remove the phenomenon the capacity model is meant to predict.

## Intuition

[MATHEMATICALLY-DERIVED] Work entering faster than the available resource can clear it accumulates somewhere: in admission, client backpressure, retained sequences or rejected demand. Capacity is therefore a service envelope rather than one isolated rate. Within the stable envelope, waiting can still rise sharply as spare service shrinks. Tail requirements usually select an operating point before an unconstrained throughput ceiling.

[DERIVED] Headroom has a cause: forecast error, bursts, maintenance, hardware failures, restart/loading delay or correlated dependency failures. Those causes need not scale as one constant percentage. A workload with heavy output tails and correlated bursts can require a different reserve from short independent requests, even on identical hardware.

## Formulation

[MATHEMATICALLY-DERIVED] Let $N(t)$ be the number inside a declared system boundary. For arrivals $a_i$ and departures $d_i$, sample-path area accounting gives

$$
\int_0^T N(t)\,dt
=\sum_i |[a_i,d_i)\cap[0,T]|,\qquad
L=\lambda W
$$
*(Eq. 48.6)*

when long-run population $L$, crossing rate $\lambda$ and mean residence time $W$ exist, are finite and use the same boundary/population, with boundary residual terms vanishing appropriately. Departures include the terminal outcomes counted by that population; admitted-request means cannot use offered rates that include rejected requests.

[PAPER-REPORTED] Little's original 1961 abstract states stationarity, finite means and a nonzero ergodic arrival condition [R48.10, Abstract]. The area identity above is the book's explanatory accounting derivation; the full original proof was not inspected.

[MATHEMATICALLY-DERIVED] For an FCFS, work-conserving single server with Poisson arrivals of rate $\lambda$, iid nonnegative service $S$ independent of arrivals, finite second moment and $\rho=\lambda\mathbb E[S]<1$,

$$
\mathbb E[W_q]
=\frac{\lambda\mathbb E[S^2]}{2(1-\rho)}
=\frac{\rho(1+C_S^2)\mathbb E[S]}{2(1-\rho)}.
$$
*(Eq. 48.7)*

Here $W_q$ is queue waiting in seconds and $C_S$ service-time coefficient of variation. This conditional M/G/1 result is not asserted as the service model of a continuous-batching LLM engine.



```figure
{
  "id": "fig-48.12",
  "kind": "calculator",
  "title": "Conditional M/G/1 mean waiting",
  "caption": "Illustrative FCFS single-server Poisson/iid model. It does not model continuous batching or establish a tail SLO.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-48.7",
  "alt": "Illustrative FCFS single-server Poisson/iid model. It does not model continuous batching or establish a tail SLO.",
  "spec": {
    "tex": "E[W_q]=\\rho(1+C_S^2)E[S]/(2(1-\\rho))",
    "equation": "48.7",
    "inputs": [
      {
        "symbol": "rho",
        "label": "Utilization",
        "default": 0.8,
        "min": 0.01,
        "max": 0.99,
        "format": "ratio"
      },
      {
        "symbol": "cv",
        "label": "Service coefficient of variation",
        "default": 1,
        "min": 0,
        "max": 5,
        "format": "fixed3"
      },
      {
        "symbol": "mean",
        "label": "Mean service seconds",
        "default": 0.1,
        "min": 0.001,
        "max": 10,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "wait",
        "label": "Mean queue seconds",
        "formula": "rho*(1+cv^2)*mean/(2*(1-rho))",
        "format": "seconds"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] The area identity counts each request once for every moment it is inside the boundary. Dividing by $T$ yields average population. Under appropriate stable limits, the sum of full residence times per departure factors into departure rate times average residence; initial/final partial requests contribute residuals that must vanish after normalization. This explains both the mean relation and why finite-window, mismatched-cohort or growing-backlog measurements can fail to support the naive substitution.

[MATHEMATICALLY-DERIVED] Equation 48.7 can be reconstructed from residual work. Poisson arrivals see time-average state under the model assumptions. A service of length $s$ contributes residual-work area $s^2/2$ during its execution; dividing accumulated area by time gives expected residual service $\lambda\mathbb E[S^2]/2$. Work already queued contributes $\mathbb E[N_q]\mathbb E[S]$, with independence justified by the iid service model. Using $\mathbb E[N_q]=\lambda\mathbb E[W_q]$ and solving
$\mathbb E[W_q]=\lambda\mathbb E[S]\mathbb E[W_q]+\lambda\mathbb E[S^2]/2$
gives Eq. 48.7.

[MATHEMATICALLY-DERIVED] This derivation exposes the role of variability. Holding mean service and utilization fixed, a larger second moment increases mean waiting. If the second moment is infinite, the finite expression no longer exists even though $\rho<1$. Conversely, a finite mean waiting time supplies no exact tail quantile. Markov's bound $\Pr(W_q>x)\le\mathbb E[W_q]/x$ is generally loose; it cannot turn a fitted mean into an experimentally validated P99.

[MATHEMATICALLY-DERIVED] In the more restrictive M/M/1 case, mean residence is $1/(\mu-\lambda)$ for exponential service rate $\mu>\lambda$. Its sensitivity is
$\partial W/\partial\mu=-1/(\mu-\lambda)^2$.
For small service-rate error $\delta\mu$, relative mean error is approximately $-\delta\mu/(\mu-\lambda)$. Near saturation, a small denominator amplifies model error. This is an analytical sensitivity example, not evidence that an LLM request has exponential service.

[DERIVED] A real batching model must represent shared iteration state: active sequences and their contexts, newly admitted prompt chunks, cache residency, scheduling policy and per-phase kernel/communication costs. A request's service duration changes when its batch companions change. Admission also depends on simultaneous state capacity. Calibrate iteration costs and state transitions at the correct level, then propagate the offered workload through that scheduler; do not independently draw complete request service times unless that approximation is validated.

[PAPER-REPORTED] Vidur combines operator profiling/prediction with hierarchical discrete-event scheduling and configuration search [R48.9, §§4–6]. Its abstraction is richer than a request-level iid queue, but fidelity remains conditional on the profiled execution and workload domain.

[DERIVED] Resource feasibility supplies necessary constraints before statistical simulation. For workload classes $k$ with rates $\lambda_k$ and per-request demand $d_{kr}$ on resource $r$, a stationary average-load condition is $\sum_k\lambda_kd_{kr}\le C_r$ under the declared resource accounting. Memory needs a simultaneous live-state condition, not merely an average bytes/request. CPU/GPU/link stages can share resources, so treating stage capacities as independent may overstate feasible throughput.

[DERIVED] For disaggregated prefill/decode, increasing one phase's capacity does not guarantee higher accepted throughput if the other phase or transfer remains limiting. Changing cache placement changes both capacity and service time. Network transfer, routing locality, distributed collectives and state duplication belong in the coupled model from Chapters 42–44. A bottleneck-stage minimum can be an informative bound under an independent pipeline model; it is not sufficient for joint tail SLOs.

[MATHEMATICALLY-DERIVED] A simple failure-reserve calculation illustrates its assumptions. With positive integer $r$ identical replicas, integer $0\le f<r$ failed, perfect redistribution and independently established safe per-replica rate $\mu_{\rm safe}>0$, necessary service capacity is
$(r-f)\mu_{\rm safe}\ge\lambda_{\rm target}$.
Equivalently $r\ge f+\lceil\lambda_{\rm target}/\mu_{\rm safe}\rceil$. This omits recovery/cold-cache transients and correlated failures; it is a transparent baseline, not a universal fleet-sizing theorem.

[DERIVED] Explicit failure scenarios can consume shared resources differently. Rebuilding weights/caches loads storage and links while surviving replicas serve additional demand. An admission controller may protect accepted requests by rejecting more offers; availability and offered-task goodput must remain visible. Warm standbys, active redundancy and load-shed reserves have different idle/energy costs. Failure-capacity planning therefore joins service, recovery and economic boundaries.

[DERIVED] Calibrate on one set of traces/configurations and evaluate prediction on held-out temporal/client/model regimes. Compare complete distributions and acceptance rates, not only mean residual. A simulator can reproduce local batch times while missing queue accumulation because small errors change batch composition. Report where predictions remain inside declared tolerances and where the model becomes unidentified or invalid. The same measured trace used to fit a correction cannot also be independent validation.

[DERIVED] Search cost includes profiling accelerator time, simulator CPU/memory, candidate count and repeated boundary validation. Event simulation commonly requires a priority queue whose event insertion/removal costs $O(\log n_e)$ for $n_e$ queued events, plus model-specific scheduling/prediction work. This is a chosen implementation bound, not a universal simulator complexity. Device FLOPs/state/traffic remain in the underlying execution ledger; energy/money count calibration, idle/reserve and actual serving over the declared horizon.



```figure
{
  "id": "fig-48.13",
  "kind": "diagram",
  "title": "Conditional capacity model",
  "caption": "Workload, physical resources and scheduler transitions determine predicted service. Holdout and failure scenarios delimit validated capacity.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.6",
  "alt": "The diagram shows Joint workload to Scheduler/event model; Physical resource ledger to Conditional execution surface; Conditional execution surface to Scheduler/event model; Scheduler/event model to Predicted service region; Predicted service region to Holdout and failure validation; Holdout and failure validation to Validated domain.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "w",
        "kind": "dataset",
        "label": "Joint workload"
      },
      {
        "id": "r",
        "kind": "memory",
        "label": "Physical resource ledger"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "Conditional execution surface"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Scheduler/event model"
      },
      {
        "id": "p",
        "kind": "metric",
        "label": "Predicted service region"
      },
      {
        "id": "h",
        "kind": "process",
        "label": "Holdout and failure validation"
      },
      {
        "id": "v",
        "kind": "metric",
        "label": "Validated domain"
      }
    ],
    "edges": [
      {
        "from": "w",
        "to": "s"
      },
      {
        "from": "r",
        "to": "c"
      },
      {
        "from": "c",
        "to": "s"
      },
      {
        "from": "s",
        "to": "p"
      },
      {
        "from": "p",
        "to": "h"
      },
      {
        "from": "h",
        "to": "v"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 48.4 — Finite capacity-domain audit.** [DERIVED] Inputs are finite configurations $\mathcal C$, bounded offered-rate grid $\Lambda$, workload/calibration/holdout identities, resource limits, SLO/quality rules and finite failure scenarios $\mathcal F$. Output is a validated conditional service region or explicit gaps.

$$
\begin{aligned}
1.&\quad \operatorname{CalibrateExecutionWithinDomain};\
\mathcal V\leftarrow\varnothing.\\
2.&\quad \text{For }(c,\lambda,f)\in\mathcal C\times\Lambda\times\mathcal F:
\operatorname{ResourceInfeasible}\Rightarrow\operatorname{RejectAndSkip}.\\
3.&\quad \operatorname{BoundedPredictAndValidate}(c,\lambda,f)
\Rightarrow(\text{queue trajectory},\text{latency},G,\text{failures}).\\
4.&\quad \operatorname{UnboundedGrowthOrInvalidDomainOrSLOFailure}
\Rightarrow\operatorname{RetainRejectedPoint};\\
5.&\quad \text{Else }\mathcal V\leftarrow\mathcal V\cup
\{(c,\lambda,f,\text{uncertainty/domain})\}.\\
6.&\quad \operatorname{Return}(\mathcal V,\text{all rejected/unknown points});
\quad\text{do not extrapolate beyond the validated grid}.
\end{aligned}
$$

[DERIVED] Invariants are matched workload/quality boundaries, complete failure scenarios and prediction distinct from measurement. Finite grid/case deadlines bound execution. A passing point requires the declared evidence, not merely a successful simulator return. A monotone-search shortcut needs checked monotonicity and does not erase contradictory points.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** provides workload/service observations and timing metrics used for calibration [R48.6–R48.7]. Vidur is outside the numbered reference stack, routed through Chapter 48's reproducible internal measurement anchor; its source-described profiler/simulator is a research implementation [R48.9]. No simulator or serving engine was executed here.

[DERIVED] Keep resource inventory, conditional execution surface, scheduler transitions, workload law and failure/recovery model as separate versioned components. A mismatch can then be localized: impossible memory rejects inventory; batch-time error rejects calibration; correct local timing with wrong queues rejects workload/scheduler assumptions. A single opaque utilization multiplier conceals these diagnoses.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Vidur evaluates four models and three length traces capped at 4,096 total tokens on A100/H100 configurations. Its vLLM fork adds scheduling/telemetry; online arrivals are Poisson. Figure 4 reports normalized E2E fidelity at 85% of estimated capacity; Appendix A exposes larger near-capacity errors [R48.9, §7.1–7.2/Appendix A].

## Observations

**What the paper claims.** [PAPER-REPORTED] Vidur supports inexpensive configuration exploration within its measured domain [R48.9].

**What the evidence shows.** [PAPER-REPORTED] Its archival paper distinguishes static execution latency from online scheduling-inclusive latency; near-capacity errors grow [R48.9, §7.2/Appendix A]. No universal error ceiling is imported from the abstract.

**What we infer.** [MATHEMATICALLY-DERIVED] Equations 48.6–48.7 constrain means only under consistent populations and assumptions. Near-saturation sensitivity explains why small model errors can invalidate a tail/capacity claim.

**What remains unknown.** [UNVERIFIED] Held-out production-tail fidelity and failure/recovery capacity for a specific current deployment remain untested.



```figure
{
  "id": "fig-48.14",
  "kind": "stat-panel",
  "title": "Queueing assumptions",
  "caption": "Means, tail inference and stateful batches require different evidence.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.7",
  "alt": "Means, tail inference and stateful batches require different evidence.",
  "spec": {
    "header": "QUEUEING ASSUMPTIONS",
    "rows": [
      {
        "key": "little",
        "value": "Stable consistent population means"
      },
      {
        "key": "mg1",
        "value": "Poisson iid FCFS single server"
      },
      {
        "key": "batch",
        "value": "Concurrent state changes service"
      },
      {
        "key": "reserve",
        "value": "Failure and recovery scenario explicit"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Mean identity presented as a tail guarantee.** [DERIVED] *Symptom:* estimated average concurrency appears feasible while P99 misses sharply. *Cause:* Little's law or an iid queue approximation replaced the actual scheduler/workload tail. *Detection:* inspect assumptions and held-out queue trajectories. *Mitigation:* restrict the theorem's claim and validate the service region directly.

[DERIVED] Other failures include fixed-percentage headroom without a failure model, admitted rates paired with offered populations, aggregate resource feasibility mistaken for latency sufficiency, and search calibrated/validated on the same trace. Finite stability requires observed queue behavior and a declared horizon; it is not proven by a flat completion-rate average.

## Siblings

[DERIVED] [§48.1](48-1-workload-specification.md) supplies the joint process; [§48.2](48-2-load-test-methodology.md) supplies measured operating points; [§48.5](48-5-economics.md) prices feasible service. Chapters 42–46 own the physical and control mechanisms. Compare models by held-out prediction domain and uncertainty, not formula simplicity.

## Extensions

### Improvements

[DERIVED] Operator/event simulation expands beyond single-server analytic queues to stateful batching/configuration search. It adds calibration and validation costs while preserving an explicit approximation boundary. The workload-aware search lineage improves on universal peak-rate sizing only when its workload, failure and metric contracts remain representative [R48.9].

## Limitations

[DERIVED] The analytical queues omit shared batching/state interactions. The finite audit does not establish all future operating regimes. Correlated failures and changing user behavior can invalidate both fitted service surfaces and reserve assumptions.

> **Open question.** [UNVERIFIED] Can a capacity model generalize across nonstationary ragged batches, changing cache locality and recovery transients with calibrated tail uncertainty? *Settling evidence:* held-out complete offer/outcome/resource traces across those regimes, not a fitted mean or isolated kernel error.

## Reproducibility

[DERIVED] Retain theorem assumptions, population boundaries, execution profiles, scheduler/workload identities, calibration/holdout separation, uncertainty and rejected points. The original Little paper was inspected at abstract level only; book derivations state their own conditions. No capacity simulation or deployment validation was executed.

## References

[R48.6](references.md#r48-6), [R48.7](references.md#r48-7), [R48.9](references.md#r48-9), [R48.10](references.md#r48-10).
