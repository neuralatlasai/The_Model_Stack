---
id: ms.section.46.4
entity_type: section
title: Autoscaling
volume: 2
part: 8
chapter: 46
section: 46.4
slug: 46-4-autoscaling
parent: ms.chapter.46
prev_sibling: ms.section.46.3
next_sibling: ms.section.46.5
children: []
prerequisites: [ms.chapter.6, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.section.46.3]
downstream: [ms.chapter.47, ms.chapter.48, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [serving_control_plane], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.tensorrt-llm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 46.4 — Autoscaling

## Scope

[DERIVED] Autoscaling changes ready serving capacity under observation and actuation delay. This section examines queue/load signals, warm capacity, model loading, predictive control, hysteresis, scale-down drain and KV-state consequences. The baseline reacts to current request count by changing desired replica count. Success is bounded overload and acceptable service/resource behavior, not merely a controller issuing a scaling command.

## Why this exists

[DERIVED] An unready replica provides no immediate service. A model may need artifact access, device allocation, weight loading, initialization and graph capture before accepting work. Meanwhile a queue grows, deadlines expire and retries add demand. Removing capacity can also destroy valuable state or interrupt requests. Thus autoscaling is a delayed stateful control problem with asymmetric scale-up and scale-down costs.

[PAPER-REPORTED] Two2026 studies investigate different interventions: predictive lookahead for delayed full-model replicas, and OpScale's finer operator-level provisioning [R46.2, §III; R46.1, §§3–4]. They must not be interpreted as interchangeable implementations or native-engine rankings.

## Intuition

[DERIVED] The controller needs three views: offered demand, actual plant state and capacity that may arrive later. Demand estimation alone misses queues and state pressure; queue observation alone can react too late; desired replica count alone mistakes pending capacity for ready capacity. The chosen scaling unit determines loading cost, communication and state migration obligations.

## Formulation

> **Definition — Ready-capacity state.** [DERIVED] The currently usable capacity, pending capacity with readiness estimates, and draining capacity with remaining request/state obligations, distinguished from desired deployment size.

| Local symbol | Meaning |
|---|---|
| $n_{\rm ready},n_{\rm pending},n_{\rm drain}$ | Usable, starting and draining replica counts |
| $W(t)$ | Queued work in a declared scalar fluid model |
| $\lambda_w(t),\mu$ | Offered work rate and service rate per ready replica |
| $\Delta$ | Observation-to-ready actuation delay |
| $T_c$ | Controller observation interval |
| $p_t,d_t$ | Prefill/decode work-rate signals |
| $\mathcal K_n$ | Empirically supported joint capacity region for $n$ replicas |
| $\widehat x_t,\widehat{\dot x}_t,\sigma_t$ | Smoothed signal, trend estimate and residual scale |
| $H_{\downarrow}$ | Scale-down stabilization horizon |

[MATHEMATICALLY-DERIVED] For a step increase to $\lambda_1>\mu n_0$ with no extra ready capacity for delay $\Delta$, a scalar fluid queue starting empty accumulates

$$
W(\Delta)=(\lambda_1-\mu n_0)\Delta.
$$
*(Eq. 46.16)*

This assumes all offered work is queued, constant rates and no abandonment. A finite admission gate bounds storage by rejecting excess; it does not eliminate unmet demand. Warm reserve exchanges persistent resource cost for a smaller capacity deficit.

[DERIVED] Capacity feasibility is more generally

$$
(p_t,d_t,\text{state pressure, workload mix})\in\mathcal K_{n_{\rm ready}},
$$
*(Eq. 46.17)*

rather than a universal scalar tokens/s. The region changes with context, batching, kernels, locality and hardware.

## Mechanism

### Methodology

[DERIVED] Measure offered input before admission, including rejected requests and their token lengths. Generation-token counters measure processed/generated work; under overload they can saturate while unmet demand grows. They are not automatically offered output demand. Future output length is unknown, so estimate it from a declared conditional model or reserve a cap. Retain arrivals, rejections, waiting/active counts, cache pressure and completion rates as distinct signals.

[DERIVED] Queue depth and oldest age expose unmet work but can be misleading without cost. Ten long prompts are not ten short prompts. Cache utilization can block admission while compute utilization looks low; high compute utilization can also represent productive work rather than imminent failure. A controller should identify which resource limits service for the current workload, not treat a single utilization threshold as universal demand.

[OFFICIAL-DOCUMENTATION] Kubernetes HPA uses a metric-ratio replica calculation with tolerance, missing/not-ready metric handling and stabilization [R46.5, “Algorithm details”]. This is a sampled control loop, not continuous instantaneous capacity. Production Stack documents a KEDA/Prometheus deployment route [R46.15]; those interfaces do not establish that a chosen metric captures offered token demand.

[DERIVED] Track pending scale-up actions explicitly. Otherwise every polling interval can request more replicas for the same deficit while earlier requests are still loading. Pending capacity should have an expected readiness distribution and failure/timeout state. A scheduled pod, a live process and a model-ready endpoint are different milestones. Image caching and local weights can change loading time; their warm state belongs in reproduction records.

[PAPER-REPORTED] The predictive study smooths token signals with EWMA, extrapolates a backward-difference trend across startup delay, adds a capped residual margin and stabilizes scale-down [R46.2, §III Eqs.1–3]. Its margin has the form

$$
x^{+}_{t+\Delta}=
\widehat x_{t+\Delta}+
\beta\min(\sigma_t,\gamma|\widehat x_{t+\Delta}|).
$$
*(Eq. 46.18)*

[DERIVED] This source-specific “UCB” is a heuristic margin: the inspected paper supplies no coverage theorem under heavy-tailed nonstationary arrivals. Capping uncertainty prevents extreme allocation but also removes any automatic interpretation as a calibrated confidence bound. A trend forecast can be negative or extrapolate a transient burst; implementations need declared clipping, initialization and fallback behavior.

[DERIVED] The paper converts phase rates to replicas using the maximum of phase-normalized demand. That is not a sufficient general capacity condition for colocated phases. Consider a serial shared-resource model where each phase separately uses80% of one replica's capacity: the maximum is0.8, while their combined work is1.6. Under that model, one replica is overloaded.

$$
\frac{p}{C_p}+\frac{d}{C_d}\le n
$$
*(Eq. 46.19)*

[MATHEMATICALLY-DERIVED] This additive condition follows only for the stated serial common-resource work model; overlapping independent resources need a different region. The practical requirement is a measured joint capacity surface, not replacing one universal formula with another. The source's calibrated simulator may make its heuristic useful in that evaluated regime without proving general sufficiency.

[DERIVED] Hysteresis reduces repeated reversal. Separate upscale and downscale thresholds create a deadband; a stabilization window requires low demand to persist before removal. Neither guarantees closed-loop stability by itself. Delay, estimator smoothing, scale-rate limits and integer capacity interact. A controller can oscillate between overshoot and backlog even when every individual threshold looks reasonable.

[MATHEMATICALLY-DERIVED] A conservative downscale recommendation over a window can retain the maximum recent required capacity:

$$
n_{\rm keep}(t)=
\max_{\tau\in[t-H_{\downarrow},t]}n_{\rm required}(\tau).
$$
*(Eq. 46.20)*

This delays reclamation and has a resource cost. It is not a substitute for request draining. A rolling maximum can be maintained with an amortized $O(1)$ monotonic queue per observation, with state proportional to window samples.

[PAPER-REPORTED] OpScale changes the scaling unit. It profiles operator compute/memory/communication over sparse workload/SM configurations, interpolates profiles, greedily adjusts bottleneck replicas/batching/parallelism, then places elastic components with memory/SM/interference and locality checks [R46.1, §§4.2–4.4; Appendix B]. Full-model base instances remain; incremental elastic operators do not imply every model is arbitrarily partitioned for free.

[PAPER-REPORTED] Its source formulation sums compute, communication and mean waiting contributions, using M/M/replica queue assumptions [R46.1, §3.1 Eqs.1–4]. Pairwise measured interference factors inform placement; higher-order colocation is approximated from pairs [§4.4]. The online greedy method is distinct from the offline exhaustive oracle.

[DERIVED] Mean queue estimates under Poisson/exponential assumptions do not prove p99 timing for bursty, correlated, variable-length requests. Multiplying pairwise interference factors is an empirical approximation, not a general law of three-way contention. Operator granularity trades loading/memory precision for extra dispatch, activation traffic, metadata and event dependencies. Its benefit should be evaluated under the actual interconnect and latency regime.

[PAPER-REPORTED] The execution plane registers operator replicas dynamically, uses late binding, elastic memory integration, stream reuse and event-ordered cross-device pipelines [R46.1, §4.5]. This is a substantive runtime intervention; it is not achieved by changing an ordinary Deployment replica count.

[DERIVED] Scale-down must first remove new-admission eligibility, then finish, migrate or explicitly fail active work under a finite drain deadline. KV state complicates migration: request history, layout, model identity, completion events and ownership transfer must agree. Cold prefix loss increases future prefill cost even after active requests drain. Removing a worker while another waits for its state transfer can affect requests not executing on the removed worker.

[OFFICIAL-DOCUMENTATION] Current Dynamo v1.5.1 documentation explicitly states that planner scale-down terminates workers without draining and can fail active prefill or dependent KV-transfer requests [R46.16, “Set the guardrails”]. Graceful draining is therefore a required design property to verify, not a universal existing guarantee.

[OFFICIAL-DOCUMENTATION] Kubernetes termination provides a grace period, preStop/termination signaling and endpoint readiness changes, then forced termination [R46.6, “Pod Termination Flow”]. [DERIVED] Application-level drain must fit that lifecycle; an endpoint becoming unready does not itself complete existing generation or safely migrate cache.

[DERIVED] Costs include ready, warm standby, starting and draining devices, artifact transfer, compile/capture, controller profiling and inference, plus state movement and lost reuse. Simple replica control is $O(n)$ in tracked replicas plus estimator state; operator provisioning has a combinatorial configuration space and heuristic search cost. Resource comparisons must charge warm reserve and pending/draining capacity, rather than counting only endpoints accepting new requests.

```figure
id: fig-46.12
kind: diagram
title: Desired capacity is not ready capacity
caption: Observed demand drives a delayed actuation pipeline. Pending and draining state must remain explicit.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.16
alt: Offered demand and plant metrics enter a controller, which issues scaling actions. Loading becomes ready capacity after delay; scale-down enters drain before release.
spec:
  direction: LR
  nodes:
    - {id: demand, kind: metric, label: offered demand}
    - {id: plant, kind: metric, label: queue active cache state}
    - {id: control, kind: process, label: estimate and decide}
    - {id: pending, kind: state, label: pending load and initialization}
    - {id: ready, kind: hardware, label: ready capacity}
    - {id: drain, kind: state, label: stop admission and drain}
    - {id: release, kind: memory, label: release or explicit failure}
  edges:
    - {from: demand, to: control}
    - {from: plant, to: control}
    - {from: control, to: pending}
    - {from: pending, to: ready, label: actuation delay}
    - {from: ready, to: plant, kind: feedback}
    - {from: control, to: drain}
    - {from: drain, to: release}
```

## Algorithm

### Algorithm 46.4 — Delay-aware capacity reconciliation

[DERIVED] Inputs are finite fleet budgets, workload/plant signals, a capacity model, pending-action records and finite drain deadlines. Each control iteration terminates with bounded actions or a recorded failure. Terminal request operators follow §46.1.

$$
\begin{aligned}
1.\;&\operatorname{ObserveOfferedAdmittedProcessedAndPlantSignals};
\quad\text{stale/missing}\Rightarrow\operatorname{UseDeclaredConservativeFallback}.\\
2.\;&\operatorname{ReconcileReadyPendingFailedDraining};
\quad\operatorname{ExpireTimedOutActions}.\\
3.\;&\widehat{\mathcal D}_{t+\Delta}\leftarrow\operatorname{ForecastWithDeclaredMargin};
\quad n^\star\leftarrow\operatorname{FindFeasibleCapacity}(\mathcal K,\widehat{\mathcal D}).\\
4.\;&n^\star>\text{ready plus valid pending}\Rightarrow
\operatorname{BoundedScaleUpWithinBudget}.\\
5.\;&\text{persistent excess after hysteresis}\Rightarrow
\operatorname{DisableNewAdmissionAndStartDrain}.\\
6.\;&\text{drained and no outstanding state readers}\Rightarrow\operatorname{Release};\\
&\text{drain deadline}\Rightarrow\operatorname{ExplicitlyFailOrMigrateEligibleWorkThenSafeRelease}.\\
7.\;&\operatorname{RecordActionReadinessServiceAndCost};\quad\operatorname{Return}.
\end{aligned}
$$

[DERIVED] Valid pending capacity in line 4 is counted only against the forecast horizon at which its recorded readiness is expected; it supplies no current service or current admission allowance. Invariants are no assumed service from unready replicas, no duplicate pending action for the same deficit, finite fleet/queue budgets and safe release. Forecast failure cannot remove capacity blindly. A service-lifetime loop repeats finite iterations; each pending/drain action has its own terminal timeout.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM/TensorRT-LLM are **Inference engine**. Kubernetes/KEDA, Production Stack, Dynamo and nano-vLLM/OpScale are outside the numbered stack, routed through deployment anchors and explicit autoscaling coverage. Their configuration, metric and actuation semantics differ. No controller was executed here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] OpScale ports all baseline policies to a common nano-vLLM data plane. It uses Qwen2-7B/57B-A14B, production trace lengths/arrivals, up to 40 A100-80GB GPUs and a 24 GB200 sensitivity setup. Its dynamic comparison uses 20 s baseline control versus 1 s OpScale; Figure 19 varies cadence [R46.1, §§5.1–5.5]. Precision, exact source commit and full repeated-run uncertainty are not disclosed in the inspected text.

[PAPER-REPORTED] The predictive study separates five-seed simulation from a five-minute hardware test: Qwen2.5-7B, vLLM 0.11, A100 40 GB, TP 1, 1–4pods, mixed 256–4096 contexts,256 output cap and injected 60 s startup delay. Simulation overestimates absolute TTFT; hardware validates lookahead timing rather than the full token policy [R46.2, §§IV–V].

## Observations

**What the paper claims.** [PAPER-REPORTED] Finer scaling and delay lookahead improve evaluated service/resource tradeoffs [R46.1–2].

**What the evidence shows.** [PAPER-REPORTED] OpScale's one-hour Qwen2-7B dense-trace case on the disclosed 40-A100-80GB pool reports 7.1 mean GPUs versus 11.2 for the ported DynamoLLM policy. In its separate cadence sensitivity experiment with a stated one-second SLO, attainment changes from 97.4% at one second to 89% at twenty seconds [R46.1, §§5.2,5.5, Figure 19]. [NOT-DISCLOSED] Precision and the exact joint timing thresholds for the main dynamic panel are not fully specified in the inspected text; its attainment headline is therefore not reused here. [PAPER-REPORTED] The predictive hardware test reports 63.5%→3.7% TTFT violations and p95 24.0→1.6s under its disclosed five-minute/injected-delay setup [R46.2, Table III].

**What we infer.** [DERIVED] Cadence and granularity jointly explain OpScale's main comparison; its cadence ablation limits single-factor attribution. The small hardware test supports earlier actuation, not universal forecast calibration or a current-engine ranking.

**What remains unknown.** [UNVERIFIED] No local joint-capacity surface, forecast coverage, long-running drain behavior or complete controller reproduction exists.

## Failure modes

> **Failure mode — Processed throughput mistaken for demand.** [DERIVED] *Symptom:* the controller sees a flat token rate while queues/rejections rise. *Cause:* saturated service counters censor unmet work. *Detection:* compare offered and admitted traces with waiting/rejected work. *Mitigation:* preserve both demand and plant signals.

[DERIVED] Other failures include repeated pending scale-ups, stale readiness, premature cache destruction, hysteresis without drain and phase-wise maxima treated as joint capacity guarantees.

## Siblings

[DERIVED] Reactive control follows present signals; predictive control spends estimator risk to act early; warm reserve pays idle cost; operator elasticity changes the actuation unit. [Admission](46-2-admission-and-backpressure.md) bounds damage while capacity catches up. These methods can compose but have different cost and correctness boundaries.

## Extensions

### Improvements

[PAPER-REPORTED] The 2026 studies move beyond model-count reaction through delay compensation or operator-specific elasticity [R46.1–2]. Their changed mechanisms, source-reported experiments and confounds are explicit above. [DERIVED] More elaborate estimators do not remove observability, capacity-model or lifecycle errors.

## Limitations

[DERIVED] Forecasts cannot anticipate every burst; hard limits require rejection/backpressure. Profile reuse across changed kernels/contexts needs validation. A research question is how to jointly control model readiness, state locality and deadline-qualified capacity with calibrated uncertainty under nonstationary demand.

## Reproducibility

[UNVERIFIED] Retain offered/admitted/processed signals, metric timestamps, ready/pending/drain timelines, startup distribution, controller/configuration, capacity profiles, model/kernel revisions, cache ownership and all failures. Source simulations, hardware tests and current mutable documentation remain separate evidence.

```figure
id: fig-46.13
kind: calculator
title: Backlog accumulated during startup
caption: Eq. 46.16 is a constant-rate fluid model with no rejection or abandonment; defaults are hypothetical work units.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.16
alt: Excess offered work rate multiplied by actuation delay gives accumulated work.
states:
  - {anchor: formulation, label: Capacity deficit, note: Only ready capacity serves the modeled work.}
  - {anchor: mechanism, label: Longer startup, variables: {delay: 120}, note: Warm reserve reduces deficit at persistent cost.}
  - {anchor: failure-modes, label: Finite admission, note: Rejection bounds stored backlog but leaves unmet demand.}
spec:
  tex: W(Delta)=(lambda_1-mu n_0)_+ Delta
  equation: "46.16"
  inputs:
    - {symbol: demand, label: offered work per second, default: 150, min: 0, max: 500, format: fixed2}
    - {symbol: capacity, label: ready work per second, default: 100, min: 0, max: 500, format: fixed2}
    - {symbol: delay, label: startup seconds, default: 60, min: 0, max: 600, format: fixed2}
  outputs:
    - {symbol: backlog, label: accumulated work, formula: "max(0,demand-capacity)*delay", format: fixed2}
```

```figure
id: fig-46.14
kind: stat-panel
title: Scaling state ledger
caption: Desired, ready, pending and draining counts have different service meanings.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-46.17
alt: The card lists readiness, pending loading and draining obligations.
spec:
  header: ACTUATION STATE
  rows:
    - {key: ready, value: usable supported capacity}
    - {key: pending, value: future capacity plus failure risk}
    - {key: draining, value: active obligations before release}
```

## References

[R46.1](references.md#r46-1), [R46.2](references.md#r46-2), [R46.5](references.md#r46-5), [R46.6](references.md#r46-6), [R46.15](references.md#r46-15), [R46.16](references.md#r46-16).
