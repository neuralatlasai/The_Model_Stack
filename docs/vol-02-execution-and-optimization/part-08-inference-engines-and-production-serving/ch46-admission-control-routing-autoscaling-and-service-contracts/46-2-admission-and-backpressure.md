---
id: ms.section.46.2
entity_type: section
title: Admission and backpressure
volume: 2
part: 8
chapter: 46
section: 46.2
slug: 46-2-admission-and-backpressure
parent: ms.chapter.46
prev_sibling: ms.section.46.1
next_sibling: ms.section.46.3
children: []
prerequisites: [ms.chapter.6, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.section.46.1]
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

# 46.2 — Admission and backpressure

## Scope

[DERIVED] Admission converts offered demand into bounded commitments. This section develops request/token quotas, finite queues, cost-aware admission, overload rejection and tenant fairness. The baseline admits every syntactically valid request into an unbounded FIFO. Success is bounded state and explicit overload behavior under a declared service/resource model. Chapter 44 owns device scheduling; this section owns the control-plane gate before and around that scheduler.

## Why this exists

[DERIVED] A queue does not create capacity. When arrivals exceed service, accepting more requests stores future work and consumes memory while deadlines expire. Request counts also hide heterogeneity: equal-count prompts can differ greatly in prefill work, output lifetime and state reservation. A control plane that limits only concurrency can still accumulate a large waiting population; one that limits only requests/s can admit a token-heavy overload.

[OFFICIAL-DOCUMENTATION] Ray Serve documents separate ongoing and queued request limits, with the queued bound applied to each DeploymentHandle, including proxies [R46.4, “Load shedding”]. This is an important scope distinction: a per-caller bound is not automatically a fleet-wide bound.

## Intuition

[DERIVED] Admission is a resource transaction. Validate a request, estimate or bound its obligations, reserve the necessary budget, and either commit the request to a finite queue/execution path or reject it. Completion/cancellation reconciles reservations. The transaction must be atomic at its scope; two frontends independently seeing one remaining slot cannot both spend it without coordination or an explicitly bounded overshoot policy.

## Formulation

> **Definition — Admission commitment.** [DERIVED] A bounded reservation of queue, concurrency, token/work and state capacity for an eligible request, with explicit expiry and reconciliation rules.

| Local symbol | Meaning |
|---|---|
| $Q_j$, $Q_{\max}$ | Queue count at step $j$ and finite capacity |
| $A_j,D_j,X_j$ | Newly admitted, dispatched and removed/expired queued requests |
| $\mathbf c_r$ | Request resource vector in declared units |
| $\mathbf B,\mathbf U$ | Capacity budget and already reserved usage |
| $u_k,b_k,\rho_k$ | Tenant budget balance, burst capacity and refill rate |
| $\widehat w_r,w_r^{\max}$ | Predicted and valid bounded work charge |
| $\mu_{\min}$ | Guaranteed lower service rate in the analytical model |
| $a_k,\Delta_k$ | Tenant deficit balance and positive fairness quantum |

[MATHEMATICALLY-DERIVED] Queue conservation is

$$
Q_{j+1}=Q_j+A_j-D_j-X_j,\qquad 0\le Q_j\le Q_{\max}.
$$
*(Eq. 46.5)*

The gate chooses $A_j$ so the bound holds. Expired/cancelled work $X_j$ remains in outcome accounting. This equation distinguishes admission from dispatch and completion; a request can leave this queue while remaining active on a device.

[DERIVED] A multidimensional reservation test is

$$
\mathbf U+\mathbf c_r\le\mathbf B
\quad\text{componentwise},\qquad Q_j<Q_{\max}.
$$
*(Eq. 46.6)*

The vector can include request slots, token-work units, cache capacity and tenant spend. Its dimensions cannot be summed without conversion. Chapter 42 supplies state-byte accounting; predicted work is a separate dimension.

## Mechanism

### Methodology

[DERIVED] Start with cheap bounds before expensive preprocessing: request/body size, supported model, maximum allowed context and authentication. Tokenize only after the caller is eligible, then validate actual token count. A raw-character limit is not a token limit. Both can be useful because tokenization and media decoding consume CPU/memory before accelerator admission.

[DERIVED] Request quotas count calls; token quotas count a declared token unit; concurrency quotas count outstanding commitments. They constrain different failure mechanisms. A rate limit can allow a large burst that overwhelms a small queue. A concurrency limit can protect active state while allowing unlimited waiting requests. A token allowance can still be consumed by many small calls whose fixed overhead dominates. Compose the necessary dimensions rather than expecting one scalar to protect all resources.

[MATHEMATICALLY-DERIVED] A token-bucket-style balance with elapsed interval $\Delta t$ and charge $c_r$ is

$$
u_k^+=\min(b_k,u_k+\rho_k\Delta t),\qquad
\operatorname{admit}\Rightarrow u_k'=u_k^+-c_r\ge0.
$$
*(Eq. 46.7)*

In this idealized model, charges admitted in any interval of length $T$ are at most $b_k+\rho_kT$, given an initially full bucket and no unaccounted refunds. Refill rates have charge units/s. If charging request count, this is not a bound on token work.

[DERIVED] Output tokens are unknown at admission. One option reserves the hard maximum output allowance and refunds unused budget after terminal reconciliation. Another reserves a conditional prediction and permits incremental acquisition during generation. The first is conservative and may lower utilization; the second can stop or defer work mid-request when budget is exhausted. The contract must explain that outcome. An expected output length cannot be treated as a worst-case memory reservation.

[DERIVED] Cost prediction should condition on model/configuration, prompt length, expected output regime, prefix reuse and current execution phase. A simple scalar prediction can rank queue work, but actual capacity may be a feasible region over prefill, decode and state, rather than independent limits. A request with a warm prefix still needs suffix attention and retains its lifetime state. Cache-hit ratio is not a complete cost estimator.

[MATHEMATICALLY-DERIVED] Suppose a scalar FIFO model has current work $W$ and a valid charge bound $w_r^{\max}$, while service is continuously available at rate at least $\mu_{\min}>0$. Then completion of the appended work is bounded by

$$
t_{\rm complete}-t_{\rm admit}
\le \frac{W+w_r^{\max}}{\mu_{\min}}.
$$
*(Eq. 46.8)*

This requires no hidden higher-priority interference, valid work units and inclusion of all serial costs. Shared accelerator batching, nonpreemptive operators and resource stalls can invalidate the premises. Replacing $w_r^{\max}$ by a mean prediction turns the expression into a heuristic. A percentile prediction requires calibrated conditional coverage and does not become a hard bound.

[DERIVED] A numerical counterexample shows why count alone is insufficient. Two queues each containing ten requests have equal count. If one request class consumes one work unit and another100, their queued work differs by100× under the scalar model. Their actual latency ratio need not equal100 because batching and cache effects change service; the counterexample establishes only that equal request count does not specify equal obligation.

[DERIVED] Overload rejection must be explicit and early enough to avoid spending the work it protects. Rejecting after model prefill has already consumed resources is less effective than rejecting before reservation, although a later feasibility failure can still occur. Return a machine-readable reason distinguishing tenant quota, global capacity, expired deadline and unsupported input. Retry hints describe an intended client policy; they do not grant another reservation.

[OFFICIAL-DOCUMENTATION] Ray's documented default load-shedding response is503, with configurable 429/Retry-After behavior [R46.4]. RFC6585 defines429 as excessive request rate under the server's chosen counting policy [R46.23, §4]. Neither response proves that a retry will fit. Automatic retries must consume a separate bounded budget (§46.5).

[DERIVED] Backpressure must reach the source of work. A gateway can stop admitting new requests, but an upstream client with an unbounded local queue merely moves the memory problem. Likewise, a bounded proxy queue does not bound engine-internal waiting requests unless the gate includes them. Record the whole chain: caller queue, gateway queue, engine queue, active model state and outbound stream buffers.

[MATHEMATICALLY-DERIVED] With $H$ independent caller handles each bounded by $q_h$ and $R$ replicas each allowing $m_r$ ongoing requests, an elementary count ceiling is

$$
N_{\rm resident}\le Hq_h+\sum_{r=1}^{R}m_r
$$
*(Eq. 46.9)*

only if those are the only resident queues and every request belongs to one counted location. Increasing the number of handles increases the bound. Retries, fan-out and intermediate queues require additional terms. Count bounds still need per-request byte bounds to become memory bounds.

[DERIVED] Fairness concerns who receives admission under contention, not merely whether the queue is stable. Equal requests/s can favor token-heavy tenants in resource consumption; equal token units can disadvantage latency-sensitive short calls if queued behind long work. Define the intended fairness unit and protected minima. A tenant quota is an upper bound, not a guaranteed minimum share.

[DERIVED] A cost-deficit gate is one explanatory design. Maintain a per-tenant balance, add a positive quantum when visiting an eligible tenant, and admit its next request only when balance covers its declared charge and global capacity permits. Unused balance carries forward up to a declared cap. Large requests then accumulate credit rather than being permanently excluded by a quantum smaller than their cost. This is a control-plane reconstruction, not a claim about a named engine's scheduler.

$$
a_k^+=\min(a_{\max},a_k+\Delta_k),\qquad
a_k^+\ge c_r\Rightarrow a_k'=a_k^+-c_r.
$$
*(Eq. 46.10)*

[MATHEMATICALLY-DERIVED] If request charges are bounded by $c_{\max}\le a_{\max}$ and a tenant is visited repeatedly with $\Delta_k>0$, it accumulates enough charge credit after at most $\lceil c_{\max}/\Delta_k\rceil$ visits starting from zero, absent intervening spends. This does not guarantee service when global capacity never becomes available or a deadline expires. Device scheduling and fairness among already admitted work remain separate.

[DERIVED] Prediction error can undermine fairness: underestimated long requests receive more real work than charged. Reconcile measured work against reservations and examine error by tenant/task class. A single global correction can hide systematic undercharging in one class. Fairness should be evaluated using both admission outcomes and delivered resource/service outcomes.

[DERIVED] Resource accounting includes $O(Q_{\max})$ request metadata plus bounded payload bytes and per-tenant balances. FIFO insertion is $O(1)$; deadline ordering with a heap is $O(\log Q_{\max})$; tokenization is proportional to input processing work. Maintaining distributed reservations introduces network/consistency cost. A locally approximate quota can reduce coordination latency but must declare its maximum overshoot or fail closed when a strict cap is required.

```figure
id: fig-46.6
kind: diagram
title: Admission as a bounded reservation transaction
caption: Quota, queue and resource checks precede committed work; terminal outcomes reconcile reservations.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.6
alt: Validation feeds cost and resource estimation. Tenant quota, global budget and queue capacity jointly permit reservation, followed by dispatch and terminal reconciliation.
spec:
  direction: LR
  nodes:
    - {id: validate, kind: process, label: validate eligible input}
    - {id: cost, kind: metric, label: cost and state obligation}
    - {id: tenant, kind: memory, label: tenant budget}
    - {id: capacity, kind: memory, label: global capacity}
    - {id: queue, kind: memory, label: finite queue}
    - {id: reserve, kind: process, label: atomic reservation}
    - {id: run, kind: process, label: dispatch}
    - {id: reconcile, kind: process, label: terminal reconciliation}
  edges:
    - {from: validate, to: cost}
    - {from: cost, to: reserve}
    - {from: tenant, to: reserve, kind: dependency}
    - {from: capacity, to: reserve, kind: dependency}
    - {from: queue, to: reserve, kind: dependency}
    - {from: reserve, to: run}
    - {from: run, to: reconcile}
    - {from: reconcile, to: tenant, kind: feedback}
```

## Algorithm

### Algorithm 46.2 — Finite admission with cost reconciliation

[DERIVED] Inputs are eligible requests, finite queue/resource budgets, tenant balances, deadlines and an integer reservation-attempt cap $K_{\rm res}\ge1$. Initialize $k_{\rm res}=0$. Outputs are reservations or explicit terminal rejections. The terminal-operator convention of §46.1 applies; partial reservations are rolled back before retry or finalized after safe release.

$$
\begin{aligned}
1.\;&\operatorname{ExpireQueuedRequestsAndReconcileCompletedWork};\\
2.\;&(\mathbf c_r,c_r)\leftarrow\operatorname{ResolveBoundsOrDeclaredPredictions}(r);\\
3.\;&\text{deadline infeasible}\Rightarrow\operatorname{Expire};\quad
\text{quota/capacity unavailable}\Rightarrow\operatorname{Reject}.\\
4.\;&k_{\rm res}\leftarrow k_{\rm res}+1;\quad\operatorname{AcquireAtomicReservation}(r);
\quad\text{conflict}\Rightarrow\operatorname{RollbackPartialReservation};\\
&\text{on conflict only: }k_{\rm res}<K_{\rm res}\text{ and budget remains}\Rightarrow\text{return to 1};
\quad\text{otherwise}\Rightarrow\operatorname{Reject}.\\
5.\;&Q\leftarrow Q+1;\quad\operatorname{DispatchWhenAdmissible};
\quad Q\leftarrow Q-1.\\
6.\;&\text{terminal}\Rightarrow
\operatorname{ChargeActualUsageAndReleaseReservation};\\
&\text{incremental budget fails}\Rightarrow\operatorname{DeclaredStopOrDeferral}.
\end{aligned}
$$

[DERIVED] Successful reservation proceeds directly to line5; the retry/reject subbranch in line 4 applies only to conflict. Invariants are finite queues, nonnegative strict balances, one reservation owner and complete rejection accounting. Each request terminates at stop/error/cancellation/deadline/cap. The finite gate bounds resident state under explicit byte limits; it does not guarantee finite completion without service/lifecycle assumptions.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM and TensorRT-LLM are **Inference engine**. Their engine limits must be joined to gateway/controller limits rather than treated as complete admission policy. Ray Serve is outside the indexed stack and supplies a documented application-level queue gate [R46.4]; Kubernetes/Envoy provide additional deployment/network scopes. Actual atomicity and aggregate bounds remain unexecuted.

## Experimental design

### Reported experiments

[PAPER-REPORTED] OpScale models operator waiting with M/M/replica queues under Poisson/exponential assumptions and reports profiling/queue prediction checks against its evaluated traces [R46.1, §3.1; §5.7 Table 2]. The method is a cost/queue model, not a proof of finite-queue tail behavior for arbitrary serving workloads.

## Observations

**What the paper claims.** [PAPER-REPORTED] Profiling-driven operator/queue models guide provisioning [R46.1].

**What the evidence shows.** [PAPER-REPORTED] The queue-model validation composes per-operator sojourn times to predict end-to-end iteration latency [R46.1, §5.7 Table 2]. Its error statistic is not pure queue-wait error or a universal deadline bound; the contextualized study is examined in §46.4.

**What we infer.** [DERIVED] Prediction can improve admission decisions, but hard resident-state bounds require explicit finite capacities. Low average prediction error does not establish calibrated tail risk or tenant fairness.

**What remains unknown.** [UNVERIFIED] No local overload rejection, quota overshoot, cost calibration or fairness experiment was run.

## Failure modes

> **Failure mode — Bounded proxy, unbounded system.** [DERIVED] *Symptom:* memory grows despite a configured queue limit. *Cause:* per-handle limits, hidden upstream/engine queues or unbounded payloads. *Detection:* enumerate request locations and join reservation counts. *Mitigation:* bound each scope and total permitted fan-out.

[DERIVED] Other failures include output-mean reservations treated as hard capacity, duplicate reservation/refund, unfair systematic undercharging and retries bypassing admission.

## Siblings

[DERIVED] Request-rate, token-rate, concurrency and state quotas protect different dimensions. Cost-deficit admission allocates access among tenants; [Chapter 44 scheduling](../ch44-scheduling-distributed-serving-and-disaggregation/README.md) chooses work among admitted requests. Neither replaces the other.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Current Ray documentation adds configurable load-shedding response semantics [R46.4]. [PAPER-REPORTED] OpScale's finer operator model targets heterogeneous resource demand [R46.1]. [DERIVED] Neither automatically establishes distributed quota strictness or fairness; those remain explicit integration obligations.

## Limitations

[DERIVED] Predictions drift with model/runtime/workload changes. Strict global reservations cost coordination; approximate local reservations need bounded overshoot. A research question is how to combine calibrated cost uncertainty with fair admission without penalizing difficult tasks simply because their cost is less predictable.

## Reproducibility

[UNVERIFIED] Record quota units/scopes, queue locations, atomicity model, cost estimator/validation set, hard caps, reconciliation, tenant quanta, deadlines and rejection reasons. Documentation examples were read but not executed. Controlled overload and fairness proposals belong in [verification](verification.md).

```figure
id: fig-46.7
kind: calculator
title: A scoped resident-request bound
caption: Eq. 46.9 counts only the displayed caller queues and active replicas; hidden queues invalidate the total.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.9
alt: The number of caller handles multiplies each queue bound, then active replica capacity is added.
states:
  - {anchor: formulation, label: One scope, note: The bound requires all resident locations to be counted.}
  - {anchor: mechanism, label: More callers, variables: {handles: 8}, note: Per-handle limits grow with caller count.}
  - {anchor: failure-modes, label: Hidden queue, note: This formula excludes unrecorded locations.}
spec:
  tex: N le H q + R m
  equation: "46.9"
  inputs:
    - {symbol: handles, label: caller handles, default: 2, min: 1, max: 16, format: integer}
    - {symbol: queued, label: queue per handle, default: 8, min: 0, max: 128, format: integer}
    - {symbol: replicas, label: replicas, default: 2, min: 1, max: 16, format: integer}
    - {symbol: ongoing, label: ongoing per replica, default: 16, min: 1, max: 128, format: integer}
  outputs:
    - {symbol: resident, label: counted request ceiling, formula: "handles*queued+replicas*ongoing", format: integer}
```

```figure
id: fig-46.8
kind: stat-panel
title: Rate and capacity are different
caption: Request rate, token work, active state and queued bytes need their own units and scopes.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-46.6
alt: The card separates request, work, state and queue limits.
spec:
  header: MULTIDIMENSIONAL GATE
  rows:
    - {key: rate, value: calls or charged units per second}
    - {key: capacity, value: outstanding resource commitments}
    - {key: memory, value: bounded bytes at every queue}
```

## References

[R46.1](references.md#r46-1), [R46.4](references.md#r46-4), [R46.23](references.md#r46-23); [Chapter 42 resources](../../part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md).
