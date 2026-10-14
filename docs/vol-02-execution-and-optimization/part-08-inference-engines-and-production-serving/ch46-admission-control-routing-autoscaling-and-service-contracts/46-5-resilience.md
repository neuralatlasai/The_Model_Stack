---
id: ms.section.46.5
entity_type: section
title: Resilience
volume: 2
part: 8
chapter: 46
section: 46.5
slug: 46-5-resilience
parent: ms.chapter.46
prev_sibling: ms.section.46.4
next_sibling: ms.section.46.6
children: []
prerequisites: [ms.chapter.6, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.section.46.4]
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

# 46.5 — Resilience

## Scope

[DERIVED] Resilience preserves bounded work and declared outcomes under transient failures, overload and ambiguous completion. This section develops deadlines, finite retries, amplification, circuit breakers, failover, idempotency and duplicate-work accounting. The baseline independently retries every failure at every layer. Success is recovery without unbounded load or silently duplicated effects, while respecting the original request contract.

## Why this exists

[DERIVED] A timeout tells the client that a result did not arrive in time; it does not prove that the server stopped or never completed. Retrying can therefore create simultaneous generations, duplicate charges or repeated tool effects. Under overload, more attempts can reduce the probability that any attempt succeeds. Failover can also cross model, data or version boundaries that the original request did not permit.

[OFFICIAL-DOCUMENTATION] AWS's first-party engineering disclosure describes timeout/retry/backoff interactions and warns that retries across multiple service layers multiply downstream load [R46.8, “Retries and backoff”]. Envoy separately documents retry limits, total route deadlines and resource circuit-breaking [R46.24; R46.7]. These mechanisms need a common request-level budget.

## Intuition

[DERIVED] A retry is another resource-consuming attempt to satisfy one logical request. The logical identity persists; the attempt identity changes. Before launching another attempt, the controller needs evidence that retry is permitted, useful within the remaining deadline, and affordable within both request and fleet budgets. Recovering a lost result is different from recomputing an answer or repeating an external side effect.

## Formulation

> **Definition — Resilience attempt contract.** [DERIVED] The finite attempt, deadline, concurrency, replay and side-effect rules governing how one logical request can be retried or failed over.

| Local symbol | Meaning |
|---|---|
| $K$ | Maximum total attempts, including the initial attempt |
| $p$ | Constant conditional failure probability in an explicit independent-attempt model |
| $N_{\rm att}$ | Number of attempts actually launched |
| $\lambda_0,\lambda_{\rm eff}$ | Logical request rate and attempted-work arrival rate |
| $d_r$ | Original absolute deadline |
| $\tau_j,b_j$ | Attempt duration and inter-attempt backoff |
| $k_r,h_r$ | Tenant-scoped idempotency key and immutable payload/action hash |
| $L_r$ | Durable logical-request ledger state |
| $B_{\rm retry}$ | Fleet/tenant retry budget in declared work units |

[MATHEMATICALLY-DERIVED] Under independent attempts with constant failure probability $0\le p<1$ and stopping on first success,

$$
\mathbb E[N_{\rm att}]
=\sum_{j=0}^{K-1}p^j
=\frac{1-p^K}{1-p},
\qquad
\Pr(\text{all fail})=p^K.
$$
*(Eq. 46.21)*

At $p=1$, the expectation is $K$. Correlated failures and load-dependent $p$ invalidate the geometric interpretation; the hard bound $N_{\rm att}\le K$ still holds.

[MATHEMATICALLY-DERIVED] If layer $i$ independently permits at most $K_i$ total attempts and every attempt invokes the next layer, worst-case deepest-layer invocations are

$$
N_{\rm downstream}\le\prod_i K_i.
$$
*(Eq. 46.22)*

Three attempts at each of five layers permit 243 downstream invocations for one logical request. This is a combinatorial bound, not a measured failure rate.

## Mechanism

### Methodology

[DERIVED] Propagate one original deadline through the call chain. Each attempt receives only a bounded share of the remaining budget, including backoff and final accounting/cleanup. A transport connect timeout, response timeout, idle-stream timeout and complete-request deadline are different clocks. DNS, TLS and queueing can lie outside a poorly scoped socket timeout. Retry policy should name exactly which boundary expired.

[OFFICIAL-DOCUMENTATION] Envoy's route timeout includes all retries; its per-try timeout is a distinct control [R46.24, “x-envoy-max-retries,” “x-envoy-retry-on”]. [DERIVED] That separation is consistent with the budget condition

$$
\sum_{j=1}^{N_{\rm att}}\tau_j+
\sum_{j=1}^{N_{\rm att}-1}b_j+
t_{\rm cleanup}
\le d_r-a_r.
$$
*(Eq. 46.23)*

where $a_r$ is original request start. The equation is a feasibility condition, not an assertion that durations are known in advance. Do not start another attempt merely because its per-try timer would fit while cleanup or response transmission would not.

[DERIVED] Classify failures by semantics. Invalid authentication, unsupported parameters and a deterministic schema error normally require correction, not repetition of the identical request. A temporary connectivity failure may be retryable. A quota/capacity rejection requires paced, budgeted behavior and may persist. A timeout after partial publication is ambiguous and needs an explicit resume/replay policy. The HTTP status is useful evidence but not a complete decision rule.

[OFFICIAL-DOCUMENTATION] RFC9110 distinguishes idempotent intended effects and restricts automatic retry of non-idempotent operations without knowledge that retry is safe or the original was not applied [R46.9, §9.2.2]. [DERIVED] A generation POST does not acquire exactly-once semantics because its prompt or seed is unchanged. Computation, billing and external actions need separate treatment.

[DERIVED] A bounded retry policy should cap attempts and retry work, not only delay. Exponential backoff with jitter spreads attempts in time but cannot make unlimited retries safe. Let a retry consume a token/work allowance from $B_{\rm retry}$ before launch. When exhausted, fail or defer explicitly. Count retries at one authoritative scope where possible; hidden SDK, gateway and provider retries must still appear in total attempted work.

[OFFICIAL-DOCUMENTATION] AWS describes capped backoff, jitter and local token-bucket retry throttling [R46.8, “Retries and backoff,” “Jitter”]. Envoy supports configurable retry budgets and maximum active retries [R46.7]. Its documented resource limits are eventually consistent across worker threads, so exact fleet-wide strictness is not inferred.

[DERIVED] In the independent model, $\lambda_{\rm eff}=\lambda_0\mathbb E[N_{\rm att}]$. Under overload, failure probability can itself grow with attempted load. The fixed point becomes

$$
\lambda_{\rm eff}=\lambda_0 A(p(\lambda_{\rm eff})),
\qquad A(p)=\sum_{j=0}^{K-1}p^j.
$$
*(Eq. 46.24)*

[MATHEMATICALLY-DERIVED] For a differentiable deterministic iteration of this map near a fixed point, local contraction requires $|\lambda_0A'(p)p'(\lambda_{\rm eff})|<1$. This simplified feedback analysis is not a serving stability theorem; it exposes how retries can reinforce the failure process they are meant to repair. A bounded retry budget limits this mechanism even when $p$ is unknown.

[DERIVED] Two mechanisms are often called circuit breaking. A resource breaker refuses work when active connections, pending requests or retries exceed a threshold. A failure-based breaker stops sending to a failing destination, then probes recovery with limited traffic. They protect different conditions. A resource breaker need not observe errors; a passive health detector can remove a failed destination while the rest of the fleet becomes overloaded.

[OFFICIAL-DOCUMENTATION] Envoy's circuit-breaking page specifies resource ceilings; its outlier detector separately ejects hosts based on configured failures/success patterns, with bounded ejection and active-health-check interactions [R46.7; R46.22, “Ejection algorithm”]. A successful health probe can restore a host even when the probe does not exercise the failing data path; that limitation is documented.

[DERIVED] A classic explanatory failure-breaker state machine has closed, open and probe states. Closed permits bounded work and updates a declared failure statistic. Crossing a threshold opens the destination for a finite cooldown. Probe admits only a small bounded number of test requests; sufficient valid outcomes close it, while failure reopens it. Thresholds and windows are design inputs requiring workload validation, not universal constants.

[DERIVED] Failover then selects among still-eligible destinations using [§46.3](46-3-routing.md). It must preserve authorization/geography, model/version and task constraints. Sending all failed traffic to one healthy replica can overwhelm it; the alternative needs its own admission gate and capacity allowance. Failover to a different model is a quality-changing route, not transparent transport recovery.

[DERIVED] Idempotency requires a durable logical identity. Scope the key by tenant/principal and bind it to an immutable request/action hash. The hash should include model/version, template/decoding and relevant tool/action parameters. Reusing a key with different payload must produce a conflict, not return an unrelated cached answer. A ledger can have absent, in-progress, completed and failed/ambiguous states, with explicit retention and ownership.

$$
L_r:\ \text{absent}\rightarrow\text{in-progress}
\rightarrow\{\text{completed},\text{failed},\text{ambiguous}\}.
$$
*(Eq. 46.25)*

[DERIVED] Atomic claiming alone does not fence an expired owner that resumes after a pause or partition. Ownership requires a monotonically increasing epoch; output/effect commits must check the current fencing token, including after takeover. Attempt count is persisted and incremented atomically with the authorized launch: repeated delivery cannot reset its budget. Detailed release fencing belongs to Chapter 47. A crash after an external side effect but before recording completion remains ambiguous unless the effect itself supports an idempotent key or a transactional protocol. An answer cache alone cannot solve that gap. Retention expiry also bounds the guarantee: a request repeated after key expiration may run again.

[DERIVED] For generation-only work, a ledger may coalesce duplicate callers onto one running result or return a stored completed result. Exact replay requires retaining the output/events; rerunning with the same seed is not necessarily identical across engine paths (§43.6). Streaming complicates attachment: a reconnecting client needs a known event cursor and replay history, otherwise it can duplicate or miss published text.

[DERIVED] A timed-out attempt can continue computing until cancellation reaches the engine and outstanding device work quiesces. Launching a replacement before that point creates duplicate work even when only one result is published. Track logical requests, attempts, device work and published outcomes separately. A billing promise of one charged request is not proof of one physical execution.

[DERIVED] Resource costs include repeated prefill/decode, wasted partial outputs, parallel-attempt memory, retained idempotency results and cross-region/provider transfers. Finite sequential retry gives at most $K$ model-call work bounds per logical request under finite token caps; concurrent hedging adds a separate active-attempt cap. Ledger lookup is storage-dependent, and complete stream replay retention grows with retained event bytes and key lifetime.

```figure
id: fig-46.15
kind: diagram
title: One logical request, bounded physical attempts
caption: Retry and failover preserve logical identity while each attempt has its own deadline, resource reservation and outcome.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.25
alt: A logical key and payload hash enter a ledger. An owner launches a bounded attempt, which may succeed, fail or become ambiguous. Retry budget and remaining deadline gate any replacement.
spec:
  direction: LR
  nodes:
    - {id: identity, kind: tensor, label: logical key and payload hash}
    - {id: ledger, kind: memory, label: durable request state}
    - {id: budget, kind: process, label: deadline and retry budget}
    - {id: attempt, kind: process, label: physical attempt}
    - {id: result, kind: state, label: completed failed ambiguous}
    - {id: retry, kind: process, label: eligible replacement}
    - {id: replay, kind: tensor, label: recorded result or terminal error}
  edges:
    - {from: identity, to: ledger}
    - {from: ledger, to: budget}
    - {from: budget, to: attempt}
    - {from: attempt, to: result}
    - {from: result, to: ledger, kind: feedback}
    - {from: result, to: retry}
    - {from: retry, to: budget, kind: feedback}
    - {from: ledger, to: replay}
```

## Algorithm

### Algorithm 46.5 — Deadline- and identity-bounded retry

[DERIVED] Inputs are a logical key/hash, original deadline, integer $K\ge1$, retry/active-attempt budgets and eligible destinations. Initialize persisted attempt count $j=0$ only when creating a new ledger entry; repeated delivery/takeover reads the existing count. Reject/Expire/Fail/Cancel are terminal under §46.1; partial reservations are reconciled safely.

$$
\begin{aligned}
1.\;&L_r\leftarrow\operatorname{LookupOrAtomicClaim}(k_r,h_r);
\quad\text{hash conflict}\Rightarrow\operatorname{Reject};\\
&\text{completed}\Rightarrow\operatorname{ReplayAndReturn};
\quad\text{other owner}\Rightarrow\operatorname{BoundedAttachOrFail};\\
&\text{failed/ambiguous}\Rightarrow\operatorname{ReconcileThenClaimNewEpochOrFail};
\quad(j,e)\leftarrow\operatorname{ReadPersistedCountAndOwnershipEpoch}.\\
2.\;&j=K\text{ or no remaining deadline/work budget}\Rightarrow\operatorname{Fail}.\\
3.\;&a\leftarrow\operatorname{EligibleAdmissibleDestination};
\quad\text{none}\Rightarrow\operatorname{Fail};
\quad j\leftarrow\operatorname{AtomicIncrementIfOwner}(e,j<K);
\quad\text{claim lost}\Rightarrow\operatorname{Fail}.\\
4.\;&o_j\leftarrow\operatorname{LaunchWithAttemptDeadlineAndReservation}(a);
\quad\text{success}\Rightarrow\operatorname{FencedRecordCompleteAndReturn}(e).\\
5.\;&\operatorname{RecordFailureOrAmbiguityAndCancelOutstandingWork};
\quad\text{retry unsafe}\Rightarrow\operatorname{Fail}.\\
6.\;&\operatorname{ReserveRetryBudgetAndBoundedJitterBackoff};
\quad\text{budget/deadline fails}\Rightarrow\operatorname{Expire};
\quad\text{otherwise return to 2}.
\end{aligned}
$$

[DERIVED] Attachment in line 1 either returns the owner's recorded outcome or terminates; it does not launch an unowned attempt. Reconciliation of failed/ambiguous entries either proves replay safe and atomically obtains a new epoch, or terminates. Every publication/effect commit checks that epoch; an external effect system without a compatible fence/idempotent operation remains an explicit boundary. Retry safety includes side-effect ambiguity and published-stream policy. Invariants are one logical identity, a durable nonresetting attempt count, finite concurrency, nonincreasing deadline and safe resource ownership. Store failure uses an explicitly declared fail-closed or limited alternative contract, not silent duplicate execution.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM/TensorRT-LLM are **Inference engine**. Envoy, Ray Serve and durable idempotency stores are outside the numbered stack and supply separate proxy/application mechanisms [R46.7, R46.20, R46.22, R46.24]. Their semantics must be integrated with engine cancellation and provider behavior. No exactly-once or recovery claim was executed.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] AWS reports an operational timeout case involving new secure connections during deployment and a mitigation that establishes connections before receiving traffic [R46.8, “Timeouts”]. This is first-party engineering experience, not a controlled LLM-serving benchmark. The inspected Envoy/Ray documents specify interfaces and examples without this chapter's complete retry/failover quality, cost and tail-latency experiment.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] Scoped deadlines, bounded retries, backoff and circuit-breaking mitigate specified failure/load mechanisms [R46.7–9, R46.20, R46.22, R46.24].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The sources distinguish retry timing, resource ceilings, health ejection and cancellation boundaries. They do not establish a universal retry count or a controlled LLM recovery frontier.

**What we infer.** [DERIVED] More retries improve success only under an appropriate failure model. Under load-dependent failure they can prolong overload; idempotency and bounded work are necessary independent obligations.

**What remains unknown.** [UNVERIFIED] Actual duplicate execution, cancellation propagation, ledger consistency and failover quality have not been measured here.

## Failure modes

> **Failure mode — Timeout treated as proof of nonexecution.** [DERIVED] *Symptom:* duplicate generation, billing or external actions. *Cause:* replacement launched without resolving original ownership/effect state. *Detection:* join logical IDs, attempt IDs and effect receipts. *Mitigation:* finite retries, durable identity and effect-level idempotency where available.

[DERIVED] Nested SDK/proxy retries, uncapped probe traffic, health checks that miss the failing path and fallback outside the eligibility set create additional failures.

## Siblings

[DERIVED] Retries address recoverable attempt failure; quality cascades deliberately buy another answer; hedging spends concurrent resources to reduce tail risk; replay returns an existing result. Their cost and semantics differ. [API behavior](46-6-api-behavior.md) exposes these differences to clients.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Current Envoy separates retry budgets, resource circuit limits and passive outlier detection [R46.7, R46.22, R46.24]. [DERIVED] Combining them with logical-request identity and engine-aware cancellation is an integration design, not evidence of universal automatic recovery.

## Limitations

[DERIVED] Correlated provider failures, ambiguous effects and finite retention limit guarantees. A research question is how to bound wasted model work and client-visible inconsistency during partial streaming failover without assuming bit-identical regeneration or durable KV transfer.

## Reproducibility

[UNVERIFIED] Preserve retry layers/caps, deadlines, jitter seeds/distributions, active-attempt budgets, idempotency scope/hash/TTL/store semantics, provider eligibility, cancellation traces and effect receipts. Book fault-injection protocols remain unexecuted in [verification](verification.md).

```figure
id: fig-46.16
kind: calculator
title: Independent-attempt amplification
caption: Eq. 46.21 assumes independent constant-probability failures; real overload can violate those premises.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.21
alt: Failure probability and a finite attempt cap determine expected attempts and all-attempt failure probability.
states:
  - {anchor: formulation, label: Independent model, note: This is a conditional analytical model.}
  - {anchor: mechanism, label: Overload feedback, note: Failure probability may grow with attempted load.}
  - {anchor: failure-modes, label: Ambiguous completion, note: Retry safety is separate from success probability.}
spec:
  tex: E[N]=(1-p^K)/(1-p)
  equation: "46.21"
  inputs:
    - {symbol: probability, label: failure probability, default: 0.2, min: 0, max: 0.99, format: fixed2}
    - {symbol: attempts, label: total attempt cap, default: 3, min: 1, max: 10, format: integer}
  outputs:
    - {symbol: expected, label: expected attempts, formula: "(1-probability^attempts)/(1-probability)", format: fixed2}
    - {symbol: failure, label: all-attempt failure, formula: "probability^attempts", format: fixed2}
```

```figure
id: fig-46.17
kind: stat-panel
title: A retry is another attempt
caption: Logical identity, physical execution and published result are separate quantities.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-46.22
alt: The card separates logical requests, attempts and external effects.
spec:
  header: RETRY ACCOUNTING
  rows:
    - {key: logical request, value: one intended contract}
    - {key: attempt, value: another resource-consuming execution}
    - {key: effect, value: independent idempotency obligation}
```

## References

[R46.7](references.md#r46-7), [R46.8](references.md#r46-8), [R46.9](references.md#r46-9), [R46.20](references.md#r46-20), [R46.22](references.md#r46-22), [R46.24](references.md#r46-24).
