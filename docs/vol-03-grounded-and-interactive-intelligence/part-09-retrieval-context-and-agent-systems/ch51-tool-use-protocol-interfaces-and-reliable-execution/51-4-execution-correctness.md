---
id: ms.section.51.4
entity_type: section
title: "Execution correctness"
volume: 3
part: 9
chapter: 51
section: 51.4
slug: 51-4-execution-correctness
parent: ms.chapter.51
prev_sibling: ms.section.51.3
next_sibling: ms.section.51.5
children: []
prerequisites: [ms.chapter.10, ms.chapter.11, ms.chapter.37, ms.chapter.46, ms.chapter.47, ms.chapter.50]
downstream: [ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [tool_use, typed_interfaces, authorization], feedback_setting: [], modality: [text]}
papers: [P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 51.4 Execution correctness

## Scope

[DERIVED] Execution correctness connects a validated proposal to a known environment outcome under delivery faults, timeouts and partial observation. It covers input/output validation, cancellation, retries, idempotency and deferred completion. The baseline treats a successful send or a parseable response as completed work and retries every timeout. Success means reporting completed, failed or unresolved outcomes accurately while avoiding unintended repeated effects.

[DERIVED] Correctness is relative to the contract, including its effect boundary. A read that returns old data, a queued mutation, a committed transaction and a delivered external notification are distinct outcomes. Chapter 47 owns service recovery; this section owns how a tool caller reasons about one logical operation across attempts.

## Why this exists

[DERIVED] A timeout is an observation about waiting, not an observation that nothing happened. A server may commit and then lose its response. A client may disconnect before dispatch or after the commit point. A worker may partially update an external system before failing. These paths look similar from the client but require different recovery.

[DERIVED] The central distinction is between a logical operation and its delivery attempts. Transport correlation IDs identify individual request/response exchanges. A deduplication key, when supported, identifies the intended operation across retries. Reusing a JSON-RPC ID is not a substitute for durable deduplication; generating a fresh request ID is not permission to create a new logical mutation.

[OFFICIAL-DOCUMENTATION] MCP's core distinguishes protocol errors from tool execution errors, including complete results with isError true [R51.1, Error Handling]. The 2026 request/input cycle likewise distinguishes input_required from completion [R51.12]. A controller must inspect these states rather than treating any result object as task success.

## Intuition

[DERIVED] Maintain two ledgers. The attempt ledger records what was sent, received, cancelled or timed out. The operation ledger records whether the intended effect is known absent, known committed, failed with a known boundary, or unknown. Only authoritative reconciliation can turn an ambiguous attempt into a known operation outcome.

[DERIVED] Retryability belongs to the operation contract and current evidence. A harmless repeatable query can be retried within budget. A state-setting update can be idempotent with respect to its specified state while still producing repeated logs or notifications. A payment-like action needs stronger deduplication or reconciliation. “Try again” is therefore a policy decision grounded in effect semantics.

## Formulation

[DERIVED] Let $o$ be a logical operation, $a_j$ its $j$th attempt, $z$ the authoritative effect state and $y_j$ the client's observation. The client's knowledge state is
$$
K_o\in\{\mathrm{not\ sent},\mathrm{known\ absent},\mathrm{in\ progress},
\mathrm{committed},\mathrm{known\ failed},\mathrm{unknown}\}.
$$
*(Eq. 51.8)*

[MATHEMATICALLY-DERIVED] For a deterministic state transformation $F$, idempotence over a declared domain is $F(F(z))=F(z)$. It says nothing about unspecified auxiliary effects. If a timeout observation $y=\varnothing$ is possible both when $F$ committed and when no dispatch occurred, the client cannot distinguish those worlds from $y$ alone. Retrying a nonidempotent action risks duplication in the first world; refusing to retry risks omission in the second. Thus observation-only retry cannot guarantee both exactly one effect and eventual completion under this ambiguity without additional assumptions or authoritative coordination.

[DERIVED] A durable deduplication design binds key $k_o$ to verified principal, operation identity and canonical argument digest $g(a)$. The state owner atomically records the effect and terminal result:
$$
D[p,k_o]=(\iota,v,g(a),r,z_{\rm version}),\qquad
\operatorname{Repeat}(p,k_o,a)\mapsto
\begin{cases}
r,&g(a)\text{ and operation identity/revision match},\\
\mathrm{conflict},&\text{otherwise}.
\end{cases}
$$
*(Eq. 51.9)*

[DERIVED] Atomicity must include the relevant effect boundary. Writing this ledger before or after an unrelated external payment is insufficient: a crash between the two recreates ambiguity. External services need their own compatible deduplication/transaction contract or reconciliation. Ledger expiration also bounds the guarantee; a late duplicate after eviction is a new hazard.



```figure
{
  "id": "fig-51.12",
  "kind": "calculator",
  "title": "Repeated-task all-success",
  "caption": "One fixed task under iid trials. This is neither pass@k nor average success raised to k for heterogeneous tasks.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-51.10",
  "alt": "One fixed task under iid trials. This is neither pass@k nor average success raised to k for heterogeneous tasks.",
  "spec": {
    "tex": "p_i^k",
    "equation": "51.10",
    "inputs": [
      {
        "symbol": "p",
        "label": "One-task iid trial success",
        "default": 0.8,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "k",
        "label": "Required successful trials",
        "default": 4,
        "min": 1,
        "max": 20,
        "format": "integer",
        "step": 1
      }
    ],
    "outputs": [
      {
        "symbol": "result",
        "label": "All-trials success probability",
        "formula": "p^k",
        "format": "percent"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Validate the proposal and capture a logical operation record before sending. Include exact arguments, contract revision, principal/resource scope, deadline and supported retry semantics. Allocate a fresh attempt ID for each delivery while preserving the logical operation key. Record send/response times separately from the authoritative effect timestamp.

[DERIVED] Interpret responses in layers. First validate transport framing and correlation. Then distinguish protocol error, additional-input result, deferred task, tool error and complete successful content. Validate structured output and domain postconditions before marking success. A correct-looking textual statement such as “updated” is evidence only to the degree the executor's contract makes it authoritative.

[DERIVED] On timeout or connection loss, request cancellation using the transport mechanism and stop unbounded waiting. Preserve unknown effect status unless authoritative evidence resolves it. Progress notifications may justify continued waiting within a declared limit, but must not extend an absolute deadline indefinitely. Retry only if the contract establishes repeat safety or reconciliation proves absence; otherwise return an unresolved operation for bounded recovery.

[OFFICIAL-DOCUMENTATION] Core MCP cancellation differs by transport: stdio uses a cancellation notification, while Streamable HTTP closes the request stream. The specification allows races with completion and recommends a maximum timeout even when progress arrives [R51.17, Transport-Specific Cancellation/Timeouts/Timing]. This is cancellation signaling, not rollback of application side effects.

[OFFICIAL-DOCUMENTATION] The separate Draft Tasks extension can return a task handle when negotiated. Polling and update/cancel methods expose deferred state; “completed” can still contain a tool-error result, and cancellation acknowledgment does not guarantee eventual cancelled status [R51.16, Task Status/Task Cancellation]. These semantics do not create exactly-once effects.

[DERIVED] **Cost.** With at most $k_{\rm retry}$ additional attempts, worst-case dispatched calls are $k_{\rm retry}+1$; serial latency includes their bounded waits and backoff, not just successful execution time. Deduplication needs durable storage proportional to retained operation records plus results, atomic coordination and retention policy. Polling every $\Delta>0$ for at most horizon $H$ adds at most $\lceil H/\Delta\rceil+1$ observations under the chosen schedule; it trades detection delay for network/server work. Unknown outcomes consume recovery capacity even after the client stops waiting.

[PAPER-REPORTED] τ-bench models API database transitions deterministically while user dialogue is stochastic. Its reward checks final database agreement and required communicated information; the paper explicitly notes that final-state reward can miss trajectory-level violations such as absent confirmation [P43, §3]. This makes outcome and policy-path evaluation complementary.

[MATHEMATICALLY-DERIVED] For an integer number $m\ge1$ of tasks and integer $n_i\ge k\ge1$ trials, let task $i$ have iid trial success probability $p_i$, all-$k$ reliability is $p_i^k$. If $c_i$ of $n_i\ge k$ trials succeed, the unbiased combinatorial estimator is
$$
\Pr(\mathrm{all}\ k\ \mathrm{succeed}\mid i)=p_i^k,\qquad \widehat{\mathrm{pass}^{k}}=
\frac1m\sum_{i=1}^{m}\frac{\binom{c_i}{k}}{\binom{n_i}{k}}.
$$
*(Eq. 51.10)*

[DERIVED] Use $\binom{c_i}{k}=0$ when $c_i<k$; expectation does not require independence across tasks. It estimates success in every one of $k$ trials, unlike pass@k's at-least-one-success event. Heterogeneous task probabilities mean averaging $p_i^k$ differs from raising average success to $k$. Correlated trials, shared backend outages or changing simulator behavior invalidate the iid interpretation. Neither repeated benchmark reliability nor final-state agreement proves exactly-once execution.



```figure
{
  "id": "fig-51.13",
  "kind": "diagram",
  "title": "Operation knowledge",
  "caption": "Durable identity and attempt reservations precede dispatch; lost responses require reconciliation.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.10",
  "alt": "Durable identity, ownership and a PREPARED attempt precede dispatch. Known outcomes are persisted and returned. Unknown outcomes enter bounded reconciliation; only a permitted repeat-safe continuation can reserve another attempt.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "memory",
        "label": "Durable operation"
      },
      {
        "id": "p",
        "kind": "boundary",
        "label": "Own, reserve and persist PREPARED"
      },
      {
        "id": "g",
        "kind": "flow",
        "label": "Dispatch"
      },
      {
        "id": "e",
        "kind": "branch",
        "label": "Outcome knowledge"
      },
      {
        "id": "done",
        "kind": "state",
        "label": "Persist known terminal result"
      },
      {
        "id": "o",
        "kind": "process",
        "label": "Bounded reconciliation"
      },
      {
        "id": "retry",
        "kind": "branch",
        "label": "Repeat-safe and permitted?"
      },
      {
        "id": "stop",
        "kind": "state",
        "label": "Return unresolved journal"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "p"
      },
      {
        "from": "p",
        "to": "g"
      },
      {
        "from": "g",
        "to": "e"
      },
      {
        "from": "e",
        "to": "done",
        "label": "known"
      },
      {
        "from": "e",
        "to": "o",
        "label": "unknown"
      },
      {
        "from": "o",
        "to": "done",
        "label": "resolved"
      },
      {
        "from": "o",
        "to": "retry",
        "label": "still unknown"
      },
      {
        "from": "retry",
        "to": "p",
        "label": "yes, within same budget",
        "kind": "feedback"
      },
      {
        "from": "retry",
        "to": "stop",
        "label": "no"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 51.4 — Bounded operation execution and reconciliation.** [DERIVED] Inputs are an accepted contract/proposal, verified principal, logical key, integer retry budget $k_{\rm retry}\ge0$, absolute deadline, bounded reconciliation interface and optional negotiated task support. Output includes the operation knowledge state and all attempt records.

$$
\begin{aligned}
1.&\quad (j,K_o,R)\leftarrow\operatorname{LoadDurableOperationOrCreate}(o);
\quad\operatorname{Terminal}(K_o)\Rightarrow\operatorname{ReplayRecordedOutcome}.\\
2.&\quad \operatorname{UnresolvedPriorAttempt}\Rightarrow
K_o\leftarrow\operatorname{BoundedReconcileOrRetainUnknown};\\
 &\quad \operatorname{Terminal}(K_o)\Rightarrow\operatorname{ReturnRecordedOutcome};
\quad\operatorname{DeadlineReachedOrBudgetSpent}\Rightarrow\operatorname{Return}(K_o,R).\\
3.&\quad \operatorname{RecheckAuthorityPreconditionsAndRepeatSafety};
\quad\operatorname{GateFailed}\Rightarrow\operatorname{RecordAndReturn};\\
 &\quad \operatorname{AtomicReserveAttemptUnderFencedOwnership}(j+1)
\Rightarrow j\leftarrow j+1;\,\operatorname{PersistPreparedAttempt};\\
 &\quad \operatorname{ReservationFailed}\Rightarrow\operatorname{Return}(\mathrm{ownership/budget\ conflict});\\
 &\quad \operatorname{SendFreshAttemptWithSameLogicalKey};\quad K_o\leftarrow\mathrm{in\ progress}.\\
4.&\quad \operatorname{ValidatedAuthoritativeCompletion}\Rightarrow
K_o\leftarrow\operatorname{ClassifyEffectAndToolStatus};\,\operatorname{Persist};\\
 &\quad \operatorname{SuccessOrFinalFailure}\Rightarrow\operatorname{Return}(K_o,R);\\
 &\quad \operatorname{ExplicitRetryableKnownNoEffect}\Rightarrow\operatorname{GoTo}(7).\\
5.&\quad \operatorname{DeferredOrInputRequired}\Rightarrow
\operatorname{RunBoundedAuthorizedContinuation};\\
 &\quad \operatorname{CompleteResponse}\Rightarrow\operatorname{GoTo}(4);
\quad\operatorname{LimitOrAmbiguity}\Rightarrow\operatorname{GoTo}(6).\\
6.&\quad K_o\leftarrow\mathrm{unknown};\,\operatorname{SignalCancellation};\
K_o\leftarrow\operatorname{BoundedReconcileOrRetainUnknown};\,\operatorname{Persist}.\\
7.&\quad j<k_{\rm retry}+1\land\operatorname{BeforeDeadline}\land
\operatorname{RepeatSafe}(K_o,\mathfrak t)\Rightarrow\operatorname{GoTo}(2).\\
8.&\quad \operatorname{RecordAllAttemptsAndUnknowns};\,\operatorname{Return}(K_o,R).
\end{aligned}
$$

[DERIVED] A new operation initializes its persisted dispatched/reserved-attempt count at zero; repeated delivery loads it and never replenishes the budget. Reservation and ownership fencing prevent concurrent workers from spending the same attempt slot; an abandoned reservation consumes budget unless a declared authoritative rule safely releases it. The absolute deadline is also retained across restart. A definitive no-effect tool error reaches retry policy; terminal success/final failure replays without dispatch. A complete result with unknown/partial effects remains unresolved.

[DERIVED] Invariants are fixed logical identity/revision/arguments, no hidden retry, current authority, at most $k_{\rm retry}+1$ durable reservations and no conversion of unknown into failure-with-no-effect. Continuations return to response classification or ambiguity handling; their finite budgets prevent an unbounded inner loop. Fencing only protects resources that enforce the fence; external effects still require the deduplication/reconciliation contract.

## Implementation

[DERIVED] Store the operation ledger where the state owner can enforce it, not only in ephemeral agent memory. Canonical argument hashing must preserve semantics and bind all effect-relevant fields; omitting a destination or currency creates collisions in intent even with a cryptographically strong hash. Do not log credentials or sensitive arguments merely to obtain an audit trail.

[DERIVED] Error taxonomies need effect information where available: definitely not started, started with no commit, committed, partial or unknown. A generic HTTP 500 alone cannot supply this classification. Deduplication conflict and key-expiry errors must be visible to the controller; silently allocating a new key defeats repeat protection.

[OFFICIAL-DOCUMENTATION] Static schema inspection verifies the existence of result discriminators and input-response fields [R51.2, ResultType/InputResponseRequestParams]. No durable ledger, transaction or asynchronous worker implementation was executed. The Tasks extension's documented state shape is not evidence of a particular backend's persistence or recovery guarantees.

## Experimental design

### Reported experiments

[PAPER-REPORTED] τ-bench's main experiments cap episodes at 30 agent actions and run at least three trials per task; agent temperature is zero and simulated-user temperature one [P43, §5]. Table 2 reports gpt-4o 61.2% retail and 35.2% airline success in that historical setup. Those are task outcomes, not current-model rankings or distributed fault tests.

[PAPER-REPORTED] τ²-bench runs four trials per task with temperature zero, a gpt-4.1-2025-04-14 user simulator and four specified agent models [R51.8, §4.1]. Its telecom evaluation uses final-state assertions and separates direct-control/no-user from dual-control settings. These controlled environment tests still lack real network duplicate-delivery and commit-ambiguity experiments.

## Observations

**What the paper claims.** [PAPER-REPORTED] Repeated task trials expose inconsistency beyond single successful conversations [P43, §3/§5; R51.8, §4].

**What the evidence shows.** [PAPER-REPORTED] Their environment checks and bounded trials measure disclosed conversational tasks; final-state checking does not fully certify every intermediate policy action.

**What we infer.** [DERIVED] Tool reliability requires both trajectory policy and authoritative outcome evidence, with unresolved delivery retained explicitly.

**What remains unknown.** [NOT-DISCLOSED] No inspected task score establishes durable deduplication, rollback or exactly-once behavior for a live external effect.



```figure
{
  "id": "fig-51.14",
  "kind": "stat-panel",
  "title": "Contract boundary to retain",
  "caption": "These distinctions constrain claims; they are not measured deployment results.",
  "placement": "rail",
  "anchor": "observations",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.10",
  "alt": "Four relevant execution boundaries remain explicit.",
  "spec": {
    "header": "EXECUTION CONTRACT",
    "rows": [
      {
        "key": "attempt",
        "value": "Fresh ID; persisted reservation"
      },
      {
        "key": "operation",
        "value": "Fixed logical identity/revision"
      },
      {
        "key": "timeout",
        "value": "Unknown effect until reconciled"
      },
      {
        "key": "cancel",
        "value": "Signal does not undo a commit"
      }
    ]
  }
}
```

## Failure modes

[DERIVED] Blind timeout retry duplicates committed effects; detect using operation keys and authoritative lookup. Premature failure labeling hides completed work; retain unknown until reconciliation. Key reuse with changed arguments causes conflict or wrong replay; bind argument digest. Expired deduplication records permit late repeats; specify retention. Task completed-with-error is mistaken for success; inspect embedded tool status. Cancellation acknowledgment is mistaken for rollback; examine the effect ledger. Progress-based timeout resets exhaust resources; enforce the absolute horizon.

## Siblings

[DERIVED] At-most-once delivery can lose work; at-least-once delivery can repeat it. An application may obtain a bounded exactly-once effect contract through a state owner's atomic deduplication semantics, but not through transport naming alone. Synchronous waiting, polling and explicit notifications differ in observation latency and resource retention. Chapter 52 owns controller recovery policies; §51.5 owns transactional/compensating effect management.

## Extensions

### Improvements

[DERIVED] A stronger executor adds authoritative reconciliation and operation-scoped deduplication to schema-valid calling. The changed mechanism is durable effect knowledge, not a more persuasive success message. τ²-bench extends the earlier single-control environment with user tools and state assertions; that is an evaluation improvement with explicit simulator limitations, not proof of real-world reliability.

## Limitations

[DERIVED] The indistinguishable-world argument concerns absent additional evidence, not impossibility under every transactional architecture. Idempotence is effect-domain-specific. Reconciliation can itself fail or become unauthorized. The open question is how to expose partial/unknown effects in reusable tool contracts without assuming a universal backend transaction model. Evidence must include controlled crashes around real commit points and concurrent actors.

## Reproducibility

[UNVERIFIED] Required artifacts are logical/attempt identities, deduplication retention and atomicity scope, exact executor/backend revisions, fault schedule, raw outcomes, task assertions and trajectory-policy checks. No fault injection or trial evaluation was run. verification.md contains proposed tests only.

## References

[PAPER-REPORTED] [P43](references.md#p43) τ-bench; [R51.8](references.md#r51-8) τ²-bench. [OFFICIAL-DOCUMENTATION] [R51.1](references.md#r51-1), [R51.2](references.md#r51-2), [R51.12](references.md#r51-12), [R51.16](references.md#r51-16), [R51.17](references.md#r51-17) result and cancellation contracts; [R51.18](references.md#r51-18) HTTP idempotence scope. Access 2026-10-14.
