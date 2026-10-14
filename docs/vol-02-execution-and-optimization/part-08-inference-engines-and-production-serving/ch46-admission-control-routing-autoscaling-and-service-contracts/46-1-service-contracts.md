---
id: ms.section.46.1
entity_type: section
title: Service contracts
volume: 2
part: 8
chapter: 46
section: 46.1
slug: 46-1-service-contracts
parent: ms.chapter.46
prev_sibling: null
next_sibling: ms.section.46.2
children: []
prerequisites: [ms.chapter.6, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45]
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

# 46.1 — Service contracts

## Scope

[DERIVED] A serving contract specifies which requests a service accepts, which observable outcomes count as success and what happens when completion is impossible. This section connects TTFT, token delivery, completion deadlines, availability, quality, quotas and cancellation. The baseline is a best-effort generation endpoint. Success is a measurable conditional promise with explicit workload and failure boundaries, not an advertised throughput peak.

## Why this exists

[DERIVED] Model execution can be correct while the service is unusable: the first token arrives late, generation stalls, an answer is truncated, a cancelled request continues consuming capacity, or a fallback changes quality. An HTTP success code alone does not distinguish these cases. Once multiple clients share stateful accelerators, service promises must constrain admission and lifecycle decisions as well as model output.

[OFFICIAL-DOCUMENTATION] Current Dynamo documentation distinguishes threshold-driven scaling targets from an SLA target that uses TTFT/ITL settings [R46.16, “Two levels of tuning”]. The distinction shows why a named latency target is not automatically enforced by every deployment mode. A configured requirement, a controller's estimate and a measured service result are separate evidence.

## Intuition

[DERIVED] A contract is an acceptance predicate over a complete request history. First-token time, completion time and quality are different coordinates of that history. Meeting each coordinate on average does not imply that a particular request met them jointly. Quotas define admissible demand; cancellation defines how obligations end. Their semantics determine the denominator of any availability or goodput statement.

## Formulation

> **Definition — Serving acceptance contract.** [DERIVED] A versioned predicate over eligible requests, client-observed event histories, task outcomes and terminal states, together with the workload envelope under which its targets apply.

| Local symbol | Meaning |
|---|---|
| $r$, $h_r$ | Request and its ordered client/server event history |
| $\mathcal W$ | Declared workload envelope and eligible-request population |
| $a_r,d_r$ | Client request start and absolute completion deadline |
| $\tau_f,\tau_i$ | First-delivery and token-delivery limits |
| $q_r,q_{\min}$ | Task-quality outcome and acceptance threshold |
| $E_f,E_i,E_d,E_q,E_a$ | First delivery, inter-delivery, deadline, quality and availability failure events |
| $\delta_j$ | Allowed probability of failure event $E_j$ within a declared population |
| $n_{\rm eligible},n_{\rm accept}$ | Eligible offered requests and accepted complete outcomes |

[DERIVED] Define the request-level acceptance predicate

$$
A(r,h_r)=
\mathbf1[r\in\mathcal W]\,
\mathbf1[\operatorname{Terminal}(h_r)=\text{accepted completion}]\,
\mathbf1[\operatorname{Timing}(h_r)\text{ passes}]\,
\mathbf1[q_r\ge q_{\min}].
$$
*(Eq. 46.1)*

Eligibility is specified before outcomes are observed. Invalid authentication or inputs can be reported separately; overload rejections of otherwise eligible requests cannot silently vanish from an offered-service denominator.

[MATHEMATICALLY-DERIVED] Without independence assumptions, the union bound gives

$$
\Pr(E_f\cup E_i\cup E_d\cup E_q\cup E_a)
\le \delta_f+\delta_i+\delta_d+\delta_q+\delta_a.
$$
*(Eq. 46.2)*

This is a conservative relation between marginal failure budgets and joint failure. Multiplying success rates instead would require an independence model that shared congestion and long requests commonly violate. No probability is estimated by this equation.

## Mechanism

### Methodology

[DERIVED] Begin by specifying the observation point. The [shared latency definitions](../../../front-matter/notation.md#2-8-latency-chapter-48-mathematically-derived-definitions) use request start and delivery times. A server's first model token is not necessarily the client's first usable delivery: tokenization, routing, serialization, network buffering and output filtering lie between those events. A heartbeat or empty metadata frame should not satisfy a meaningful first-token requirement unless the contract intentionally defines first-byte rather than first-token latency.

[DERIVED] A token-delivery target must state whether it concerns average TPOT, a distribution of ITLs, a per-request maximum stall or a percentile over requests. These are different estimands. Pooling every token gives long responses more weight; averaging per-request TPOT gives each request equal weight. If the transport coalesces tokens into chunks, client token ITL may not be identifiable. Report chunk delivery separately rather than inventing token timestamps from one chunk's arrival.

[DERIVED] Completion deadlines constrain total work, not merely responsiveness. A service can emit a first token quickly and then miss the deadline by minutes. Conversely, buffering a short complete answer can pass E2E while failing the first-token target. Stop rules, maximum generated tokens and required structured output determine which terminal outcomes qualify. A length-cap truncation must not count as a valid completion merely because transport closes cleanly.

[MATHEMATICALLY-DERIVED] At stage time $t$, remaining deadline budget is

$$
b_r(t)=d_r-t,\qquad
t_{\rm next}^{\rm upper}+t_{\rm reserved\ downstream}\le b_r(t).
$$
*(Eq. 46.3)*

The inequality is sufficient only if the component times are valid upper bounds and include contention/communication. Predictions produce a risk-based admission heuristic, not a hard guarantee. Across hosts, a deadline representation must account for clock synchronization or propagate a bounded remaining duration; within one process, elapsed time should use a monotonic clock.

[DERIVED] An idle timeout and an absolute deadline serve different purposes. An idle timeout detects a stalled connection or generation gap and may reset after a qualifying event. An absolute deadline must continue decreasing even when heartbeats arrive. Reusing one timeout at every downstream hop can unintentionally multiply the user's total wait. Section 46.5 develops bounded retries inside the same remaining budget.

[DERIVED] Availability requires a declared unit. Request availability concerns eligible offered requests receiving the promised result; time availability concerns service readiness over a window. A ready health endpoint does not certify that the model, sampler and cache can complete a target request. A partial streamed answer may be useful to a user but still fail the declared completion contract. Count it as a separate outcome rather than relabeling it automatically.

[DERIVED] Quota violations and overload rejections also require distinct categories. A tenant exceeding a predeclared quota can be outside a specific contracted envelope, but the rejection remains operational evidence. Reclassifying overload failures as quota violations after the fact biases availability. Different HTTP status codes may help clients decide what to do; they do not determine the scientific success denominator.

[OFFICIAL-DOCUMENTATION] Ray Serve exposes bounded per-caller queues and ongoing-request limits, with default 503 load shedding and a configurable 429 response [R46.4, “Load shedding”]. That is an implementation mechanism. Whether such a rejection counts against an application SLO is a contract choice, not a property of the status code.

[DERIVED] Quality thresholds must identify their evidence and evaluation unit. A task can require exact execution success, schema validity, grounded attribution or a calibrated answer-quality score. A quality estimate is not ground truth. If a fallback model differs, its quality acceptance must be validated on the relevant population before being an allowed route. A route that meets latency by returning systematically inadequate answers has changed the task.

[DERIVED] Quality may be observed long after response completion. A controller cannot use unavailable task labels as an instantaneous admission signal. It can use a validated model/category policy and monitor delayed outcomes, keeping uncertainty explicit. Separate independent acceptance data from router or controller tuning. Section 46.3 connects the quality estimator to model selection; Chapter 6 owns evaluation design.

[DERIVED] Quotas should name resource and scope: requests per interval, input/output token budget, concurrent requests, maximum context, permitted model classes and spend. An input token cap is known after tokenization; output cost is uncertain until completion unless a hard cap is imposed. A quota is therefore not a substitute for current capacity or a latency guarantee. The contract must specify reservation and refund semantics, including cancelled or failed work.

[OFFICIAL-DOCUMENTATION] Ray's cancellation interface distinguishes dropping unforwarded requests from attempting to cancel dispatched asynchronous handlers; cancellation is delivered at an await point [R46.20, “Request cancellation”]. This does not imply preemption of every already-launched accelerator operation.

[DERIVED] The cancellation contract needs at least three events: client cancellation observed, further logical generation stopped, and resources safe to reuse. They need not coincide. Already published output cannot be retracted by freeing cache. Pending device work can require completion before reuse. The [runtime state contract](../ch43-runtime-architecture-and-inference-engine-selection/43-1-runtime-decomposition.md#formulation) separates committed model-prefix tokens from published tokens; the control plane must preserve that distinction.

[MATHEMATICALLY-DERIVED] Let $c_r$ be cancellation receipt, $s_r$ logical stop and $f_r$ safe reclamation. A valid ordering is

$$
c_r\le s_r\le f_r,\qquad
f_r\ge \max\{\text{last completion of a reader of request-owned state}\}.
$$
*(Eq. 46.4)*

A bound on $f_r-c_r$ requires a bound on outstanding work. An immediate “cancel accepted” response establishes receipt, not physical reclamation. Billing/usage should identify whether it counts computed, accepted or published tokens, because those counters can differ at cancellation and stop-string boundaries.

[DERIVED] Resource costs follow the contract's scope. Maintaining per-request deadlines, tenant reservations and terminal reasons uses state proportional to active plus queued requests. Timers can be managed with heaps in $O(\log n)$ updates or bounded timing structures with different precision tradeoffs. Client-event retention grows with delivery events; aggregate histograms are cheaper but cannot reconstruct individual joint acceptance. Quality evaluation adds its own compute/label cost. None of those costs is included in accelerator FLOPs alone.

```figure
id: fig-46.3
kind: diagram
title: A complete request contract
caption: Timing, terminal state and quality jointly define acceptance; quotas and cancellation govern the request's admissible lifecycle.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.1
alt: Eligible request and quota checks lead to execution. Client timing, terminal state and task quality jointly feed acceptance. Cancellation leads through logical stop to safe reclamation.
spec:
  direction: LR
  nodes:
    - {id: request, kind: tensor, label: eligible request}
    - {id: quota, kind: process, label: quota and admission}
    - {id: execute, kind: process, label: execute}
    - {id: timing, kind: metric, label: client timing}
    - {id: terminal, kind: state, label: terminal reason}
    - {id: quality, kind: metric, label: task quality}
    - {id: accept, kind: metric, label: joint acceptance}
    - {id: cancel, kind: process, label: stop and safe reclaim}
  edges:
    - {from: request, to: quota}
    - {from: quota, to: execute}
    - {from: execute, to: timing}
    - {from: execute, to: terminal}
    - {from: execute, to: quality}
    - {from: timing, to: accept}
    - {from: terminal, to: accept}
    - {from: quality, to: accept}
    - {from: execute, to: cancel, kind: dependency}
```

## Algorithm

### Algorithm 46.1 — Contract-preserving request lifecycle

[DERIVED] Inputs are an authenticated request, versioned contract and finite deadlines/token limits. Outputs are a complete event history and one terminal reason.

[DERIVED] In this chapter's explanatory algorithms, Reject, Expire, Fail and Cancel are terminal operators: they stop progression, record the terminal reason, roll back partial reservations or release them after outstanding readers complete, and return through final accounting. They never fall through into subsequent execution. A bounded wait or retry explicitly returns to a named validation step and remains subject to its finite budget.

$$
\begin{aligned}
1.\;&\operatorname{ValidateEligibilityAndResolveContract}(r);
\quad\text{invalid}\Rightarrow\operatorname{RejectWithReason}.\\
2.\;&\operatorname{ReserveQuotaAndCapacity}(r);
\quad\text{unavailable}\Rightarrow\operatorname{Reject}.\\
3.\;&b_r(t)\le0\Rightarrow\operatorname{Expire};
\quad\text{otherwise execute admissible work}.\\
4.\;&\operatorname{RecordClientRelevantDeliveryAndModelProgress};
\quad\operatorname{ApplyStopRules}.\\
5.\;&\text{cancel}\Rightarrow\operatorname{StopFutureWorkThenAwaitSafeRelease};\\
&\text{stop, error, cap or deadline}\Rightarrow\operatorname{FinalizeTerminalReason}.\\
6.\;&\text{continuing}\Rightarrow\text{return to 3};
\quad\text{terminal}\Rightarrow\operatorname{ReconcileUsageAndEvaluateAcceptance}.
\end{aligned}
$$

[DERIVED] Invariants are decreasing absolute budget, complete terminal accounting, unchanged contract identity and safe state release. Finite caps bound per-request work; bounded queues are supplied by §46.2. Delayed quality labels can complete acceptance analysis later without changing the recorded runtime history.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM and TensorRT-LLM are **Inference engine**; their deployment/serving surfaces expose part of the execution path [R46.12–16; R46.21]. Ray Serve, Dynamo and Kubernetes are outside the numbered stack, routed through the plan's deployment anchors. A gateway must connect their limits, cancellation and metrics to one application contract. No complete service guarantee was executed.

## Experimental design

### Reported experiments

[PAPER-REPORTED] OpScale evaluates source-defined TTFT/TBT SLO attainment on trace replays with Qwen2 models and a common nano-vLLM data plane. Its static-capacity experiment increases load until a target such as p99 TTFT below one second is met [R46.1, §5.1, §5.3]. That protocol measures timing/resource behavior; it does not establish this section's joint task-quality and cancellation contract.

## Observations

**What the paper claims.** [PAPER-REPORTED] Fine-grained provisioning improves SLO attainment with fewer resources [R46.1].

**What the evidence shows.** [PAPER-REPORTED] The reported dynamic comparison changes controller cadence and scaling granularity together [R46.1, §§5.2,5.5]. The fully contextualized measured case and attribution limits are examined in §46.4.

**What we infer.** [DERIVED] A source-defined timing SLO cannot be silently promoted to overall task availability. The acceptance predicate must retain quality, failures and denominators separately.

**What remains unknown.** [UNVERIFIED] No local workload acceptance, cancellation-lag distribution or joint quality/service rate was measured.

## Failure modes

> **Failure mode — Successful transport counted as successful task.** [DERIVED] *Symptom:* availability appears high while responses truncate or fail schemas. *Cause:* acceptance uses HTTP status alone. *Detection:* join terminal reasons and task outcomes to delivery traces. *Mitigation:* apply the versioned joint predicate.

[DERIVED] Heartbeats masking stalled generation, resetting absolute deadlines and treating cancellation receipt as memory reclamation create similarly misleading evidence.

## Siblings

[DERIVED] First-token, delivery-stall and completion contracts protect different user needs. Time-based readiness and request-based availability have different units. [Admission](46-2-admission-and-backpressure.md) enforces workload feasibility; [API behavior](46-6-api-behavior.md) makes outcomes observable.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Current controllers expose distinct SLA modeling and reactive load modes [R46.16]. [DERIVED] Combining these with explicit terminal/quality accounting is a book engineering synthesis, not a claim that a named controller already enforces the complete predicate.

## Limitations

[DERIVED] A contract is conditional on its workload and evidence. Delayed or subjective quality labels limit immediate guarantees. A genuine research question is how to maintain statistically defensible joint quality/service acceptance under changing routes and delayed feedback without tuning on the acceptance population.

## Reproducibility

[UNVERIFIED] Preserve contract/version, eligibility rules, workload envelope, observation boundary, quota/reservation semantics, clocks, token/chunk events, terminal reasons and evaluator identity. The proposed complete lifecycle checks are in [verification](verification.md); current documentation is not an executed SLO certificate.

```figure
id: fig-46.4
kind: calculator
title: Joint failure budget
caption: The union-bound upper bound composes declared marginal budgets without independence; defaults are hypothetical percentages.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.2
alt: Marginal timing, quality and availability failure budgets sum to a conservative bound on any failure.
states:
  - {anchor: formulation, label: Marginal budgets, note: Inputs are declared hypothetical percentages.}
  - {anchor: mechanism, label: Dependence, note: Shared congestion does not justify multiplying success rates.}
  - {anchor: failure-modes, label: Denominator, note: Excluding overload failures invalidates interpretation.}
spec:
  tex: delta_{joint} le sum_j delta_j
  equation: "46.2"
  inputs:
    - {symbol: timing, label: timing budget percent, default: 1, min: 0, max: 10, format: fixed2}
    - {symbol: quality, label: quality budget percent, default: 1, min: 0, max: 10, format: fixed2}
    - {symbol: availability, label: availability budget percent, default: 0.1, min: 0, max: 10, format: fixed2}
  outputs:
    - {symbol: joint, label: conservative any-failure percent, formula: "min(100,timing+quality+availability)", format: fixed2}
```

```figure
id: fig-46.5
kind: stat-panel
title: Cancellation has three boundaries
caption: Receipt, logical stop and safe reclamation are distinct events.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-46.4
alt: The card lists cancellation receipt, future-work stop and completion-safe resource reuse.
spec:
  header: CANCELLATION CONTRACT
  rows:
    - {key: receipt, value: client signal observed}
    - {key: logical stop, value: no further work admitted}
    - {key: reclaim, value: last device reader complete}
```

## References

[R46.1](references.md#r46-1), [R46.4](references.md#r46-4), [R46.16](references.md#r46-16), [R46.20](references.md#r46-20), [R46.21](references.md#r46-21); shared [notation](../../../front-matter/notation.md).
