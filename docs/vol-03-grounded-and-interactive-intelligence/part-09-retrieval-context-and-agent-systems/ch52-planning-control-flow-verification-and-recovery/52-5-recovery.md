---
id: ms.section.52.5
entity_type: section
title: Recovery
volume: 3
part: 9
chapter: 52
section: 52.5
slug: 52-5-recovery
parent: ms.chapter.52
prev_sibling: ms.section.52.4
next_sibling: ms.section.52.6
children: []
prerequisites: [ms.chapter.36, ms.chapter.38, ms.chapter.50, ms.chapter.51]
downstream: [ms.chapter.53, ms.chapter.54, ms.chapter.63]
related: [ms.chapter.46, ms.chapter.47]
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [agent_control, verification, recovery], feedback_setting: [environment_return], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 52.5 — Recovery

## Scope

[DERIVED] Recovery resumes or safely terminates work after partial progress, process failure, tool failure or environmental drift. We cover checkpoints, retries, compensating actions and irrecoverable states. The baseline reruns the original plan from its first step. Success preserves an accurate account of committed effects, prevents unsafe replay and reaches either verified completion or a truthful terminal partial state. Transport retry semantics are owned by [Section 46.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch46-admission-control-routing-autoscaling-and-service-contracts/46-5-resilience.md); persistent memory policy belongs to [Chapter 53](../ch53-agent-memory-persistent-state-and-long-horizon-consistency/README.md).

## Why this exists

[DERIVED] Agent tasks often span several effect boundaries. A controller may reserve a resource, update a record and then fail before reporting the result. Restarting the prompt does not restore the world. Replaying the last call can duplicate an effect; skipping it can omit required work. A timeout leaves an epistemic problem until an authoritative status source resolves the effect.

[PAPER-REPORTED] The original saga model separates a sequence of committed transactions from compensations that amend a partial execution. Compensation is semantic and need not restore the original database bytes, because other transactions may have intervened [R52.15, §1, pp. 249–250]. [DERIVED] This distinction applies directly to agent recovery: a cancel or refund is another authorized operation, not time reversal.

[DERIVED] The dominant constraint becomes correspondence between the controller's durable record and external reality. A checkpoint that saves only a plan and conversation can preserve the wrong belief with perfect reliability.

## Intuition

[DERIVED] Recovery needs a frontier of effects, not merely a position in text. For each step record whether it was proposed, admitted, submitted, acknowledged, committed, independently verified or ambiguous. Different states permit different continuations. A verified read may be refreshed; a committed purchase may require compensation; an ambiguous purchase first requires reconciliation.

[DERIVED] Partial progress can be useful even when the original goal becomes impossible. The controller should retain valid results and identify which effects remain. “Failed” is insufficient if the user must know that one reservation exists and another does not.

## Formulation

> **Definition — Effect frontier.** [DERIVED] A dependency-consistent set of established operations and results, with receipts identifying their actual effect boundary.

| Local symbol | Meaning |
|---|---|
| $\mathcal D=(V,E)$ | Finite task dependency graph |
| $\mathcal F$ | Set of steps included as established in a checkpoint frontier |
| $\mathcal L$ | Durable operation/effect ledger |
| $e_{\rm own}$ | Monotonically increasing ownership epoch |
| $j(a),K(a)$ | Persisted attempt count and positive integer cap for logical action $a$ |
| $c(a)\ge0$ | Declared action cost in one chosen unit |
| $\mathcal P_{\rm rec}$ | Finite modeled admissible recovery paths under declared finite action/horizon caps |
| $\psi_{\rm biz}(s)$ | Projection onto explicitly declared business obligations |
| $a,C_a$ | Original action and its compensating action |

[MATHEMATICALLY-DERIVED] For dependency-complete established state, a checkpoint frontier is downward closed:

$$
v\in\mathcal F\land(u,v)\in E
\Rightarrow u\in\mathcal F.
$$
*(Eq. 52.20)*

This graph condition is necessary for reconstructing dependency-bound results. It is not sufficient for consistency with concurrent external writers or unmodeled dependencies.

[DERIVED] A recovery checkpoint has the form

$$
\chi=(\operatorname{GoalVersion},\operatorname{PlanVersion},
\mathcal F,e,\mathcal L,\mathbf u,\mathbf c,j,e_{\rm own},
\operatorname{PolicyVersion},d).
$$
*(Eq. 52.21)*

The saved evidence ledger $e$ includes immutable response references. Controller state and effect state require either an atomic shared transaction or an explicit reconciliation protocol across their boundary.

[DERIVED] Semantic compensation aims for

$$
\psi_{\rm biz}(C_a(s_{\rm after}))
=\psi_{\rm biz}(s_{\rm acceptable}),
\qquad
C_a\circ a\ne\operatorname{Identity}\ \text{in general}.
$$
*(Eq. 52.22)*

Here $s_{\rm acceptable}$ is a declared acceptable compensated state, not necessarily the pre-action state. Fees, notifications, audit events and third-party observations may persist.

[MATHEMATICALLY-DERIVED] If every launched attempt atomically increments its persistent logical-action counter under current ownership, then

$$
N_{\rm launched}\le N_{\rm reserved}=\sum_{a\in\mathcal A_{\rm logical}}j(a)
\le\sum_{a\in\mathcal A_{\rm logical}}K(a),
$$
*(Eq. 52.23)*

for a fixed finite logical-action set. A crash after reservation can leave a reserved attempt unlaunched, hence the inequality. Replanning that creates unlimited new action identities defeats this bound; an additional request-wide cap is required.

[DERIVED] The modeled minimum recovery cost is

$$
C^*_{\rm rec}=
\min_{p\in\mathcal P_{\rm rec}}\sum_{a\in p}c(a),
$$
*(Eq. 52.24)*

with $C^*_{\rm rec}=+\infty$ when the set is empty. This is a model-relative optimum. Failure to discover a path within a search budget does not establish that the set is empty.

## Mechanism

### Methodology

[DERIVED] Start recovery by acquiring logical-request ownership and loading the latest consistent ledger. Reuse existing operation keys and attempt counts. Only a genuinely new ledger entry initializes its counter to zero. Repeated delivery or worker takeover must not reset the allowance. A monotonically increasing ownership epoch is checked when publishing outputs and committing effects, preventing a paused former owner from committing after takeover. An internal lease alone cannot fence an external system that ignores the epoch.

[DERIVED] Classify every in-flight or completed operation before replay. A committed receipt supplies a continuation fact. A definitive rejection can permit a bounded retry after correcting the cause. A timeout, connection loss or stale owner can leave an ambiguous effect. Reconcile using an authoritative operation-key lookup or documented idempotent result. If the external API offers neither safe replay nor reliable reconciliation, terminate as ambiguous and escalate rather than inventing a clean failure.

[DERIVED] A checkpoint is a consistent cut through task dependencies and receipts. Persist plan and goal versions, evidence provenance, resource charges, pending reservations and operation IDs. Retain the code/prompt/tool schema needed to interpret the checkpoint. Restoring a checkpoint under a different parser or policy can change the meaning of its fields. Migration needs explicit validation; serialization success does not establish semantic compatibility.

[OFFICIAL-DOCUMENTATION] LangGraph documents persistent checkpointing and warns that in-memory state is lost on process restart [R52.12, persistence/checkpointer discussion]. Its interrupt documentation states that preceding node code runs again on resume [R52.13, “Resuming interrupts”]. [DERIVED] This means checkpoint location and effect placement matter. A node-local checkpoint cannot make an unprotected external effect exactly once.

[DERIVED] Preserve partial progress selectively. A current immutable result can be reused; a time-sensitive quote needs refresh; a derived calculation must be recomputed if its inputs change. Use provenance dependencies to invalidate the affected closure. A completed effect is retained as world state even if its original supporting evidence expires. The recovery plan must decide whether to finish around it or compensate it.

[DERIVED] Retry only after classifying the failure and rechecking preconditions. A transient outage may justify another attempt; invalid arguments require correction; denied permission requires a policy stop; a version conflict requires refresh. Charge all attempts before dispatch, including errors and timeouts. Use the deadline/backoff and durable ownership protocol in Section 46.5 rather than layering an independent retry loop inside every agent node. Nested retries can multiply load and exceed the intended logical-request cap.

[DERIVED] Compensation requires a domain contract. Identify the action being compensated, its current status, who may compensate it, what obligations the compensation restores and which irreversible consequences remain. A refund may restore a monetary obligation while leaving exchange-rate loss or a notification. A deleted external message may have been read. Never present these actions as full rollback. Compensations can fail and need their own bounded attempts, receipts and terminal unresolved state.

[PAPER-REPORTED] Sagas describes backward recovery and forward recovery, logged commands and consistent save-point dependencies in parallel execution [R52.15, §§2,4–5,8]. [DERIVED] For agent graphs, compensate in an order that respects actual effect dependencies, not simply reverse textual order. A downstream result may have been consumed by an independent service outside the controller's rollback scope. The chapter's projection in Eq. 52.22 intentionally leaves that boundary explicit.

[DERIVED] Environmental drift requires revalidation on resume. Refresh authorization, entity versions, time-sensitive constraints and available alternatives. A checkpoint can be correct for yesterday's state and unsafe today. If a user changes the goal, preserve the old effect history and create a new goal revision; do not silently reinterpret an old receipt as satisfying the new request. Recovery must identify which obligations survive the change.

[DERIVED] Irrecoverable failure includes no authorized continuation, unavailable compensation, exhausted capacity and unresolved external effects. The terminal record contains verified partial results, remaining effects, uncertainty and required follow-up. Completion and abandonment use the same accounting discipline. Cancellation prevents further intended work but does not prove that already submitted work did not commit.

[DERIVED] Checkpoint costs include serialized bytes, durable writes, replica/network traffic and recovery reads. More frequent checkpoints reduce repeated controller computation but cannot reduce external ambiguity without effect receipts. Retaining every raw tool response increases storage and privacy exposure; immutable references reduce repeated copying while requiring retention and access guarantees. Compensation adds real tool latency and possibly fees. The cited papers do not disclose a production end-to-end energy or cost frontier for these policies.

```figure
id: fig-52.15
kind: diagram
title: "Prepared operations and ambiguous effect recovery"
caption: "Persist operation identity before dispatch. Bounded reconciliation distinguishes committed, known-absent and unresolved effects. The verified frontier supports continuation or completion; compensation requires a separate policy decision and authorization."
placement: inline
evidence: DERIVED
source: DERIVED:eq-52.21
alt: "A prepared operation is submitted to the external sink. A receipt establishes commitment; timeout enters bounded reconciliation. Known-absent operations require repeat-safe re-admission, unresolved effects stop, and committed effects enter a verified frontier. A policy decision selects continuation, completion or authorized compensation."
spec:
  direction: LR
  nodes:
    - {id: prep, kind: memory, label: "PREPARED identity + payload"}
    - {id: submit, kind: process, label: "Submit with repeat safety", group: sink}
    - {id: receipt, kind: state, label: "Committed receipt", group: sink}
    - {id: amb, kind: state, label: "Ambiguous effect"}
    - {id: recon, kind: process, label: "Bounded reconciliation"}
    - {id: front, kind: memory, label: "Verified effect frontier"}
    - {id: absent, kind: state, label: "Known absent"}
    - {id: retry, kind: process, label: "Repeat-safe re-admission"}
    - {id: decide, kind: branch, label: "Current recovery policy"}
    - {id: forward, kind: state, label: "Continue / complete"}
    - {id: fail, kind: state, label: "Unresolved / irrecoverable"}
    - {id: comp, kind: process, label: "Authorized compensation", group: sink}
  edges:
    - {from: prep, to: submit}
    - {from: submit, to: receipt, label: "Confirmed"}
    - {from: submit, to: amb, label: "Timeout / uncertain"}
    - {from: amb, to: recon}
    - {from: recon, to: receipt, label: "Committed"}
    - {from: recon, to: absent, label: "Confirmed absent"}
    - {from: absent, to: retry}
    - {from: recon, to: fail, label: "Unresolved / cap reached"}
    - {from: receipt, to: front}
    - {from: front, to: decide}
    - {from: decide, to: forward, label: "Goal / continuation supported"}
    - {from: decide, to: comp, label: "Required and authorized"}
    - {from: decide, to: fail, label: "No permitted recovery"}
    - {from: comp, to: receipt, kind: feedback}
  groups:
    - {id: sink, label: "External effect sink"}
```

## Algorithm

[DERIVED] **Algorithm 52.5 — Recover from a durable effect frontier.** Inputs are logical request identity, checkpoint/ledger, current policy, deadline and request-wide remaining budgets. Output is verified continuation, compensated terminal state or explicit ambiguous/irrecoverable status. Every Finish persists final accounting and returns. Reserve cleanup/reconciliation capacity before launching new work.

$$
\begin{aligned}
1.\;&(\chi,\mathcal L,e_{\rm own})\leftarrow
\operatorname{AtomicClaimOrLoadWithNewFencingEpoch};
\quad\text{claim fail}\Rightarrow\operatorname{ReturnLocalOwnedElsewhereWithoutLedgerMutation}.\\
2.\;&\operatorname{LoadPersistedAttemptCounts};
\quad\operatorname{NewLogicalEntriesOnlyInitializeZero}.\\
3.\;&\operatorname{ValidateCheckpointDependenciesAndVersions};
\quad\text{invalid}\Rightarrow\operatorname{Finish}(\text{checkpoint unresolved}).\\
4.\;&\mathcal U\leftarrow\operatorname{AmbiguousOperations}(\mathcal L);
\quad\operatorname{BoundedReconcile}(\mathcal U);
\quad\text{unresolved}\Rightarrow\operatorname{Finish}(\text{ambiguous effects}).\\
5.\;&\operatorname{RefreshPolicyAndDriftSensitiveFacts};
\quad\operatorname{InvalidateUnsupportedContinuation}.\\
6.\;&\operatorname{GoalAndInvariantAndPublicationAuthorityVerified}
\Rightarrow\operatorname{Finish}(\text{complete}).\\
7.\;&p\leftarrow\operatorname{BoundedChooseForwardOrCompensatingPlan};
\quad p=\varnothing\Rightarrow\operatorname{Finish}(\text{irrecoverable partial}).\\
8.\;&\operatorname{AtomicReserveRequestAndActionAttempt}(p,e_{\rm own})
=\text{fail}\Rightarrow\operatorname{Finish}(\text{exhausted/ownership lost}).\\
9.\;&\operatorname{PersistPreparedOperation}(\text{opID},\text{exact payload},\text{revisions},e_{\rm own});\\
&\operatorname{DispatchOneRevalidatedStepViaRepeatSafetyProtocol}(p,\text{opID},e_{\rm own});
\quad\operatorname{PersistReceiptAndCharges};\ \operatorname{goto}4.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] A finite request-wide attempt cap decreases on every launch; bounded reconciliation and finalization then ensure termination. Successful takeover fencing requires the effect/output sinks to check ownership epochs. Where a sink cannot do so, safety depends on its documented idempotency or an explicit non-replay boundary, not the controller's local counter.

[DERIVED] The PREPARED record binds the exact operation identity, payload and relevant revisions before any effect can occur. Dispatch and post-crash lookup follow [Section 51.4](../ch51-tool-use-protocol-interfaces-and-reliable-execution/51-4-execution-correctness.md)'s repeat-safety contract; a crash between external commitment and receipt persistence enters reconciliation using that same identity. Checkpointing alone cannot close this gap.

## Implementation

[OFFICIAL-DOCUMENTATION] At the inspected LangGraph commit, _loop.py initializes the run step/stop boundary from checkpoint metadata and recursion_limit and checks out-of-steps in tick [R52.14, entry methods and tick]. [DERIVED] A per-run step limit is distinct from a persistent logical-request attempt budget. Static inspection does not establish crash recovery of a particular checkpointer or external API.

[DERIVED] LangGraph and saga-oriented storage are outside-stack controller infrastructure; no numbered stack entry automatically supplies these semantics. The implementation contract spans durable database transactions, tool idempotency keys, effect receipts, ownership fencing and application deadlines. Record the exact sink capabilities. A framework-level checkpoint claim cannot substitute for an API-level guarantee.

## Experimental design

### Reported experiments

[PAPER-REPORTED] ToolMaze uses simulated fixed responses and alternative-path DAGs; permanent failures in single-path tasks count graceful termination as TSR success [R52.2, §§3.2–3.5]. Thus recovery success is not always intended business-task completion.

[PAPER-REPORTED] PlanBench-XL's controlled blocking preserves a valid alternative path. Implicit failures produce the highest untrusted-input reuse rate, 11.99% versus 9.67% explicit and 9.89% misleading; longer remaining paths reduce accuracy [R52.1, §5, Figures 2–3]. These typed-world results do not measure durable transactions, compensation or real API idempotency. The original saga paper supplies an execution model rather than agent benchmark rates [R52.15].

[PAPER-REPORTED] That PlanBench-XL configuration has 327 tasks, 1,665 tools, 56 datatypes, shortest chains five–nine calls, a 100-turn cap, 30 returned tools and seed 42 [R52.1, Table 2]. Provider hardware/precision and transaction faults are not disclosed.

## Observations

**What the paper claims.** [PAPER-REPORTED] Controlled fault environments reveal recovery failures after partial progress [R52.1, §§5–6; R52.2, §4].

**What the evidence shows.** [PAPER-REPORTED] Silent wrong values can propagate, and available alternatives do not guarantee the agent follows them. Some benchmark “successes” are graceful abandonment.

**What we infer.** [DERIVED] Recovery needs effect reconciliation and task-specific terminal semantics in addition to alternative tool selection.

**What remains unknown.** [UNVERIFIED] Production compensation availability, external fencing behavior and crash/partition recovery were not exercised.

## Failure modes

> **Failure mode — Checkpoint replay duplicates an effect.** [DERIVED] *Symptom:* the same logical action has several external receipts. *Cause:* a timeout or resume resets identity/counters or reruns a pre-interrupt write. *Detection:* reconcile operation keys with sink records. *Mitigation:* durable keys, bounded persisted attempts and effect-specific idempotency/fencing.

[DERIVED] Other failures include stale compensation preconditions, inconsistent parallel checkpoints, erased partial progress and reporting cancellation while a submitted action remains ambiguous.

## Siblings

[DERIVED] Retry repeats an action; replanning changes the continuation; checkpoint restoration recovers controller state; compensation changes external state; escalation transfers an unresolved obligation. Combining them requires explicit ownership and accounting rather than one generic “recover” branch.

## Extensions

### Improvements

[DERIVED] Durable receipts and consistent frontiers extend prompt-only recovery with explicit effect semantics. [PAPER-REPORTED] ToolMaze and PlanBench-XL improve evaluation by controlling perturbation and alternative paths [R52.2, §3; R52.1, §5]. [DERIVED] Their remaining gap is transaction-level behavior, so no implementation reliability gain is inferred.

## Limitations

[DERIVED] A real open question is how to learn useful recovery policies without exposing unsafe exploratory effects. Evidence requires realistic irreversible operations, hidden drift and independent effect audits. Simulator branchability and graceful termination alone do not settle this problem.

## Reproducibility

[UNVERIFIED] Preserve checkpoint schema/code revision, receipt retention, operation keys, ownership epochs, attempt counters, drift events, compensation contracts and terminal ambiguity. The book did not inject crashes, restore checkpoints or execute compensations.

```figure
id: fig-52.16
kind: calculator
title: "Reserved attempt ceiling with equal action caps"
caption: "Illustrative fixed finite logical-action set with the same cap for each action. Launched attempts can be fewer after a crash; a request-wide cap still bounds newly created action identities."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-52.23
alt: "For a fixed set of logical actions with equal persisted attempt caps, their product bounds reserved attempts and therefore launched attempts."
states:
  - {anchor: formulation, label: "Identity", note: "The logical-action set and per-action caps are fixed."}
  - {anchor: mechanism, label: "Crash", note: "Reservation may persist even when dispatch never occurred."}
  - {anchor: failure-modes, label: "Replan", note: "Unlimited new identities require an additional request-wide cap."}
spec:
  tex: "N_{\\rm launched}\\le N_{\\rm reserved}\\le n_{\\rm logical}K"
  equation: "52.23"
  inputs:
    - {symbol: actions, label: "fixed logical actions", default: 8, min: 1, max: 100, format: integer}
    - {symbol: cap, label: "reserved attempts per action", default: 3, min: 1, max: 20, format: integer}
  outputs:
    - {symbol: result, label: "reserved-attempt upper bound", formula: "actions*cap", format: integer}
```

```figure
id: fig-52.17
kind: stat-panel
title: "Compensation is a new operation"
caption: "Business restoration can coexist with irreversible fees, notifications or third-party observations. Its own failure remains an explicit obligation."
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-52.21
alt: "Compensation restores a declared business projection, preserves residual effects and requires its own authorization, receipt and bounded recovery."
spec:
  header: CONTRACT BOUNDARY
  rows:
    - {key: "restored", value: "declared business obligation"}
    - {key: "residual", value: "fees / audit / third-party observations"}
    - {key: "new effect", value: "authorized and independently checked"}
```

## References

[R52.1](references.md#r52-1), [R52.2](references.md#r52-2), [R52.12](references.md#r52-12), [R52.13](references.md#r52-13), [R52.14](references.md#r52-14), [R52.15](references.md#r52-15).
