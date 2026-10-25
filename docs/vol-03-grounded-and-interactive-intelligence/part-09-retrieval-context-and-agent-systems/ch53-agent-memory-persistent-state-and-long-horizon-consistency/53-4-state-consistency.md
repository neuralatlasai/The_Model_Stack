---
id: "ms.section.53.4"
entity_type: "section"
title: "53.4 — State consistency"
volume: 3
part: 9
chapter: 53
section: 53.4
slug: "53-4-state-consistency"
parent: "ms.chapter.53"
prev_sibling: "ms.section.53.3"
next_sibling: "ms.section.53.5"
children: []
prerequisites: ["ms.chapter.24","ms.chapter.42","ms.chapter.49","ms.chapter.50","ms.chapter.51","ms.chapter.52"]
downstream: ["ms.chapter.54","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference","evaluation","assurance"],"mechanism":["agent_memory","persistent_state","provenance","deletion"],"feedback_setting":[],"modality":["text"]}
papers: ["P16","P40"]
implementations: ["impl.pytorch","impl.hugging-face-transformers"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-25"
editorial_status: "manuscript_draft"
---

# 53.4 — State consistency

## Scope

[DERIVED] State consistency connects memory to a versioned authority boundary under concurrent access. It covers authoritative state versus summaries, transactional updates, stale reads, versioning and concurrent writers. The proposed policy is an engineering synthesis: semantic adjudication produces proposals, while storage and action interfaces enforce defined consistency conditions. A language model's coherent narrative does not establish those conditions.

## Why this exists

[DERIVED] Two individually plausible memory updates can violate a joint constraint. One worker reads an old preference while another records its correction. A semantic index can lag behind a committed source update. A plan can validate against one state version and execute after that version changes. These failures are possible even when the model faithfully uses every record it sees.

[DERIVED] The relevant question is which state was observed and which state constrained the commit. Without that boundary, “the agent remembered correctly” can mean only that its answer matched a stale snapshot. Auditability requires event versions, the transaction's read/write scope, and the environment's actual action result.

## Intuition

[DERIVED] Keep an authoritative event/state service and treat model-authored summaries as materialized views. A view can be useful and source-grounded while lagging behind the source. Its header names the source versions it represents. A query requiring the current state either verifies those versions, waits for refresh, or explicitly reports unavailable/current-unknown.

[DERIVED] Version checks prevent particular races only within their scope. A compare-and-swap on one record prevents an unnoticed overwrite of that record. It does not prevent two workers from updating different records based on mutually incompatible stale reads. Cross-record invariants require a transaction or locking/serialization policy covering the relevant read predicates and writes.

```figure
{
  "id": "fig-53.12",
  "kind": "diagram",
  "title": "Internal commit and external effect differ",
  "caption": "One protected internal transaction publishes the view, epoch and outbox together; a conflict publishes none. A durable PREPARED identity precedes external dispatch. A crash after an effect can leave ambiguity until bounded reconciliation.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.14",
  "alt": "Private proposals enter an atomic transaction containing read/predicate validation and one publication of view, epoch and outbox. Conflicts abort. A prepared operation is dispatched conditionally to the external sink; confirmed receipts and ambiguous crash/timeout outcomes split, with unresolved reconciliation returning an explicit partial status.",
  "spec": {
    "direction": "TB",
    "nodes": [
      {
        "id": "p",
        "kind": "process",
        "label": "private proposal"
      },
      {
        "id": "t",
        "kind": "branch",
        "label": "read / predicate validation",
        "group": "tx"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "one atomic publication",
        "group": "tx"
      },
      {
        "id": "v",
        "kind": "state",
        "label": "view + epoch",
        "group": "tx"
      },
      {
        "id": "o",
        "kind": "memory",
        "label": "durable outbox",
        "group": "tx"
      },
      {
        "id": "b",
        "kind": "state",
        "label": "abort; publish nothing"
      },
      {
        "id": "d",
        "kind": "memory",
        "label": "PREPARED ID + digest + version"
      },
      {
        "id": "x",
        "kind": "process",
        "label": "conditional external action",
        "group": "sink"
      },
      {
        "id": "r",
        "kind": "state",
        "label": "confirmed effect receipt"
      },
      {
        "id": "u",
        "kind": "state",
        "label": "AMBIGUOUS effect"
      },
      {
        "id": "k",
        "kind": "process",
        "label": "bounded same-ID reconciliation"
      },
      {
        "id": "z",
        "kind": "state",
        "label": "unresolved / partial terminal"
      }
    ],
    "edges": [
      {
        "from": "p",
        "to": "t",
        "kind": "flow"
      },
      {
        "from": "t",
        "to": "c",
        "kind": "flow",
        "label": "validated"
      },
      {
        "from": "t",
        "to": "b",
        "kind": "flow",
        "label": "conflict / invalid"
      },
      {
        "from": "c",
        "to": "v",
        "kind": "flow",
        "label": "same commit"
      },
      {
        "from": "c",
        "to": "o",
        "kind": "flow",
        "label": "same commit"
      },
      {
        "from": "o",
        "to": "d",
        "kind": "flow"
      },
      {
        "from": "d",
        "to": "x",
        "kind": "flow",
        "label": "repeat-safety contract"
      },
      {
        "from": "x",
        "to": "r",
        "kind": "flow",
        "label": "confirmed and recorded"
      },
      {
        "from": "x",
        "to": "u",
        "kind": "flow",
        "label": "timeout / crash before saved receipt"
      },
      {
        "from": "u",
        "to": "k",
        "kind": "flow"
      },
      {
        "from": "k",
        "to": "r",
        "kind": "flow",
        "label": "commit confirmed"
      },
      {
        "from": "k",
        "to": "z",
        "kind": "flow",
        "label": "unresolved"
      }
    ],
    "groups": [
      {
        "id": "tx",
        "label": "Atomic internal transaction"
      },
      {
        "id": "sink",
        "label": "External effect boundary"
      }
    ]
  }
}
```

## Formulation

[DERIVED] Let $e$ have valid interval $[a_e,b_e)$ and record-time interval $[r_e,s_e)$, with $s_e=\infty$ until the stored interpretation is superseded. A bitemporal candidate view at world time $t$ and knowledge snapshot $u$ is
$$
V(t,u)=\operatorname{adjudicate}
\{e:a_e\le t<b_e,\ r_e\le u<s_e,\
\operatorname{authority\_eligible}(e)\}.
$$
(Eq. 53.11)

[DERIVED] Adjudication returns an accepted value, compatible set or unresolved result under a named policy. The intervals alone do not determine truth. An event received at $u_2$ can correct what the system believed at $u_1$ about a much earlier world time; an “as known then” query and an “as now corrected” query can therefore differ legitimately.

[MATHEMATICALLY-DERIVED] Consider two flags $x,y\in\{0,1\}$ with invariant $x+y\ge1$. Starting from $(1,1)$, transaction $T_x$ reads both flags and proposes $x\gets0$ because $y=1$; transaction $T_y$ proposes $y\gets0$ because $x=1$. If each validates only its own written row, both can commit, yielding
$$
(1,1)\xrightarrow{T_x,T_y}(0,0),\qquad x+y=0<1.
$$
(Eq. 53.12)

[MATHEMATICALLY-DERIVED] Each row's compare-and-swap can succeed because the other transaction writes a different row. The failure is write skew over the shared read constraint, not a lost update on one row. Validating and serializing the relevant read set/predicates, or locking a common invariant owner, prevents this particular execution. Merely adding version fields to written records does not.

[DERIVED] An accepted memory update should carry a transaction manifest $(R,W,v_R,\mathcal P)$: read keys/predicates $R$, writes $W$, observed versions $v_R$, and invariant predicates $\mathcal P$. The commit implementation must declare how it protects those predicates from concurrent changes, including inserted records that can create a phantom conflict. A client-side check followed by an unguarded write leaves a race.

```figure
{
  "id": "fig-53.13",
  "kind": "calculator",
  "title": "Write skew violates a joint invariant",
  "caption": "Two row-local successful updates can leave both flags off; row versions alone do not protect x+y >= 1.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-53.12",
  "alt": "Two row-local successful updates can leave both flags off; row versions alone do not protect x+y >= 1. Inputs are illustrative analytical values, not benchmark measurements.",
  "spec": {
    "tex": "s=x+y,\\quad v=\\max(0,1-s)",
    "inputs": [
      {
        "symbol": "x",
        "label": "first flag after commit",
        "default": 0,
        "min": 0,
        "max": 1,
        "format": "integer",
        "options": [
          0,
          1
        ]
      },
      {
        "symbol": "y",
        "label": "second flag after commit",
        "default": 0,
        "min": 0,
        "max": 1,
        "format": "integer",
        "options": [
          0,
          1
        ]
      }
    ],
    "outputs": [
      {
        "symbol": "s",
        "label": "remaining enabled flags",
        "formula": "x+y",
        "format": "integer",
        "emphasis": true
      },
      {
        "symbol": "v",
        "label": "invariant deficit",
        "formula": "max(0,1-x-y)",
        "format": "integer",
        "emphasis": true
      }
    ],
    "equation": "53.12"
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Joint invariant",
      "note": "Initially both flags are enabled; binary controls expose the joint constraint.",
      "variables": {
        "x": 1,
        "y": 1
      }
    },
    {
      "anchor": "mechanism",
      "label": "One committed change",
      "note": "Turning off one flag preserves the invariant when the other remains enabled.",
      "variables": {
        "x": 0,
        "y": 1
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Write skew",
      "note": "Two row-local commits can leave no enabled flag: row versions did not protect the joint read predicate.",
      "variables": {
        "x": 0,
        "y": 0
      }
    }
  ]
}
```

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] PostgreSQL 18 documents statement snapshots at Read Committed, transaction snapshots with possible serialization anomalies at Repeatable Read, and serializable execution with possible transaction failures requiring retries. These guarantees concern the database transaction, not external tools or model reasoning. [R53.9, §13.2.1–13.2.3, Table 13.1]

[DERIVED] The proposed architecture uses that separation explicitly. Observations and adjudication proposals can be prepared privately. An atomic transaction validates the relevant source versions and constraints, appends the event revision, updates the accepted view, records dependency changes, advances a cache epoch and writes any intended action to an outbox. Failed transactions publish none of those effects. The LLM is not granted an unrestricted database mutation interface.

[DERIVED] An outbox links a committed internal decision to a later external dispatch. It does not by itself make the external action exactly once. A crash after the environment commits but before the receipt is recorded leaves an ambiguous outcome. Safe recovery needs an idempotency key understood by the environment, a status query, or a compensating/human resolution policy. Blindly repeating the action can duplicate its effect.

[MATHEMATICALLY-DERIVED] If the environment implements an operation-ID-indexed idempotent transition $f$, its required property is
$$
f(f(X,\mathrm{op}),\mathrm{op})=f(X,\mathrm{op}).
$$
(Eq. 53.13)

[MATHEMATICALLY-DERIVED] This identity concerns repeated application of the same operation and payload. It does not say that two different IDs, mutated payloads, or a non-idempotent downstream service share the property. The controller must bind ID, payload digest, target version and authorization scope; otherwise a retry can become a new effect.

[DERIVED] Dispatch-time preconditions require environment support at the actual mutation boundary. Reading the latest state and then sending an unconditional action still permits an intervening update. A concrete schedule is: check authoritative version $v$ at $t_1$, commit a correction to $v+1$ at $t_2$, then commit the old-version action at $t_3$, with $t_1<t_2<t_3$. The read succeeded, yet freshness at the action's commit failed. A version-conditional API or a valid exclusive lease can close that race only if its protected authority, predicate scope and lifetime cover the relevant state and effect. A sink-local version unrelated to the source-state version cannot supply this protection.

[DERIVED] The temporal acceptance rule must identify its linearization point: the instant at which the effect and its authoritative precondition are treated as one atomic decision. A later correction does not retroactively invalidate an earlier effect that was permitted at that point. Conversely, an internal outbox commit cannot establish freshness for a later remote effect, and rereading after the effect detects a violation without undoing it. If the environment cannot provide the required atomic or equivalent coordinated contract, return an unsupported strict requirement or disclose a separately accepted best-effort policy; do not label a source-version manifest itself a consistency guarantee. This is the downstream obligation carried by [53.3's retrieval manifest](53-3-retrieval-and-use.md#algorithm).

[DERIVED] Cache/index epochs constrain stale readout. A retrieved summary includes its source-version vector and view epoch; a request requiring the current version cannot accept a mismatch merely because the summary's text looks relevant. Invalidation messages accelerate refresh but can be delayed or lost. Correctness depends on final version checks or an explicit bounded-staleness contract, not on assuming perfect broadcast delivery.

## Algorithm

### Algorithm 53.4 — Versioned commit and action handoff

[DERIVED] Algorithm 53.4 performs a bounded update and prepares an action without confusing internal commit with external effect. Inputs include logical operation ID $o$, immutable payload digest, durable remaining budget, deadline $D$, maximum attempts $K$, and required invariant scope. Reserve the bounded control/snapshot/commit/cleanup cap before model work; each attempt and dispatch has an enforced remaining-deadline timeout.

$$
\begin{aligned}
1.\;& (B_{\rm rem},j,\sigma_o,\text{owner})\gets\operatorname{durable\_ledger}(o);
      \quad\text{bootstrap/receipt work uses its prepaid cap};\\
   & \text{if complete, return receipt; if ambiguous or prepared, use the reconciler};\\
   & \text{if internal commit/outbox exists, resume at step 7 without semantic recommit}.\\
2.\;& \text{While durable }j<K:\quad
      \text{if deadline/budget is exhausted, return deferred}.\\
3.\;& c_j\gets\operatorname{upper\_work}(\text{snapshot, proposal, validation, commit, cleanup});\\
   & \operatorname{atomic\_claim\_reserve}(o,\text{owner},c_j,j+1):
      \text{ insufficient budget returns deferred};\\
   & \text{owned elsewhere returns a local status, without finalizing that ledger};\\
   & \text{success durably sets }B_{\rm rem}\gets B_{\rm rem}-c_j,\ j\gets j+1.\\
4.\;& (F,v_R)\gets\operatorname{snapshot}(R);
      \quad\Delta\gets\operatorname{bounded\_proposal}_{c_j,D}(F);\\
   & \text{invalid proposal: discard, reconcile and return rejected}.\\
5.\;& \operatorname{serializable\_commit}(R,\mathcal P,v_R,
       \Delta,\operatorname{outbox}(o,\text{digest}),\text{new epoch});\\
   & \text{conflict: abort, reconcile, continue within durable }j<K;\\
   & \text{success: reconcile, exit the attempt loop}.\\
6.\;& \text{If no commit succeeded, return deferred};\
      \text{if no action is required, return committed-view receipt}.\\
7.\;& \text{Atomically claim and reserve bounded dispatch/reconciliation work;}\\
   & \text{persist PREPARED}(o,\text{digest},\text{target version},\text{owner})
      \text{ before dispatch}.\\
8.\;& \operatorname{execute\_or\_reconcile}_{D}(o,\text{digest},\text{target version});\\
   & \text{success records external receipt; timeout/crash leaves PREPARED/AMBIGUOUS,}\\
   & \text{which enters reconciliation rather than ordinary outbox replay}.
\end{aligned}
$$
(Eq. 53.14)

[DERIVED] Every attempt draws from the same durable budget, including retries after process restart; actual-cost reconciliation cannot replenish spent work. Changed payload or target binding requires a new authorized logical operation, rather than mutation of a retry identity. External execution and uncertain outcomes follow the [§51.4 executor/reconciliation contract](../ch51-tool-use-protocol-interfaces-and-reliable-execution/51-4-execution-correctness.md). The invariant is atomic internal publication with protected read/constraint scope and at most one logical action identity. It is not an unconditional exactly-once guarantee for an arbitrary environment.

## Implementation

[DERIVED] PostgreSQL is outside reference-stack §4; it is used here as an official implementation contract for the plan's transactional persistent-state synthesis.

[DERIVED] Store immutable events, versioned accepted views, a transaction/outbox ledger and cache epochs as separate logical tables or services with a declared atomic boundary. Indexes and summaries name the versions they represent. A status value is not enough: pending, committed-view, dispatched, externally-committed and ambiguous-effect states need distinct receipts and transition rules.

[DERIVED] Avoid holding database locks during long model calls. Prepare proposals from a snapshot, then validate/commit in a short transaction; a conflict triggers bounded re-evaluation. This reduces lock duration but does not eliminate contention. For invariants spanning multiple entities, choose a common locked owner, serializable predicate scope or an explicitly weaker contract. A per-user lock does not protect a shared resource modified by other users.

[DERIVED] Accounting covers database transactions, inference proposals and external action reconciliation. The policy adds no necessary model parameters. Model tokens/FLOPs depend on the proposal context and re-evaluation count. Storage includes versions, outbox records, receipts and dependency edges; traffic includes reads, logs, replication and invalidations. Short commits can improve concurrency, while contention, serializable aborts and hot entity locks increase tail latency and reduce throughput.

[DERIVED] A finite attempt cap bounds the number of retries but not their cumulative cost without the durable ledger and timeouts. Energy/money include aborted model proposals, database work and external status queries. There is no portable transaction speedup or retry probability established by the cited documentation, and no end-to-end coefficient was measured here.

## Experimental design

### Reported experiments and documented guarantees

[PAPER-REPORTED] STALE's LightMem diagnostic separates retrieval visibility from accepted-state revision. Updated evidence appears in top-20 retrieval for 77.5% of SR/PR cases, while only 3.3% of recalled old entries are judged as needing update during construction. The disclosed analysis motivates an adjudication gap; it is not a database concurrency experiment. [R53.5, §4.4, Table 3]

[OFFICIAL-DOCUMENTATION] PostgreSQL's isolation documentation includes concrete executions illustrating differing snapshot and serialization behavior, and explicitly requires retry handling for relevant failures. It establishes the documented database contract; it does not empirically validate this chapter's composed agent architecture. [R53.9, §13.2]

[DERIVED] These evidence types should not be merged. Semantic revision can fail in a single-threaded benchmark; transaction isolation can prevent races while preserving an incorrect semantic proposal. A defensible composed claim requires both correct adjudication and a verified transaction/action boundary.

## Observations

**What the paper claims.** [PAPER-REPORTED] STALE identifies a gap between retrieving new evidence and making it govern current-state decisions. [R53.5, §4.4]

**What the evidence shows.** [PAPER-REPORTED] The disclosed diagnostic shows visibility can coexist with poor revision and downstream outcomes. [R53.5, Table 3]

**What we infer.** [DERIVED] Semantic state adjudication and transactional consistency are separate necessary interfaces in a concurrent memory service.

**What remains unknown.** [UNVERIFIED] No executed test establishes the proposed service's serializability, stale-index behavior or effect reconciliation under failure.

## Failure modes

[DERIVED] Row-level CAS misses cross-row write skew. Stale indexes serve retired facts. Check-then-act races invalidate action preconditions. A timeout hides a committed external action. A crash can replay an outbox operation without a sink idempotency key. A summary can carry a fresh view timestamp while representing obsolete source versions. Each needs a distinct guard and recorded outcome.

## Siblings

[DERIVED] Single-writer serialization simplifies a narrow state scope but constrains concurrency. Optimistic validation avoids long locks while requiring complete read/constraint protection and retries. Serializable storage protects a declared transaction but cannot adjudicate semantic truth. Eventual views improve availability only when callers accept their explicit staleness and action limitations.

```figure
{
  "id": "fig-53.14",
  "kind": "compare",
  "title": "Consistency guarantees have explicit scope",
  "caption": "A storage guarantee does not establish semantic truth or an arbitrary external effect.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.14",
  "alt": "A storage guarantee does not establish semantic truth or an arbitrary external effect. Comparison of semantic contracts, not a feature ranking.",
  "spec": {
    "axis": "Representation and guarantee boundary",
    "columns": [
      {
        "id": "a",
        "label": "Per-row CAS"
      },
      {
        "id": "b",
        "label": "Serializable transaction"
      },
      {
        "id": "c",
        "label": "Conditional tool API"
      }
    ],
    "rows": [
      {
        "dimension": "Protects",
        "values": {
          "a": "one observed row version",
          "b": "declared transaction invariants",
          "c": "mutation precondition at sink"
        }
      },
      {
        "dimension": "Does not imply",
        "values": {
          "a": "cross-row serializability",
          "b": "correct semantic proposal",
          "c": "all downstream effects atomic"
        }
      },
      {
        "dimension": "Failure handling",
        "values": {
          "a": "reread and bounded retry",
          "b": "abort / retry budget",
          "c": "idempotency / status receipt"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The improvement path moves from unversioned recollection to versioned views and protected action commits. An unresolved question is which invariants should remain deterministic versus model-adjudicated when domain state is only partially observable. Settling evidence requires source-verified updates, concurrent schedules, ambiguous external outcomes and separate measurements of semantic and serialization failures.

## Limitations

[DERIVED] No transaction can establish truth beyond its inputs or atomically control an unrelated external service without a supporting protocol. Stronger consistency can reduce availability during partitions or raise contention cost. Unknown/ambiguous outcomes must remain explicit rather than being forced into a successful or failed action label.

## Reproducibility

[UNVERIFIED] No database or tool transition was executed. Reproduction requires transaction isolation/version, protected predicates, complete schedules, read/source versions, operation IDs, payload digests, action receipts, retries, cache epochs and remaining-budget logs. Proposed concurrency checks remain in [verification](verification.md).

## References

[DERIVED] [R53.9, PostgreSQL 18 isolation](https://www.postgresql.org/docs/18/transaction-iso.html), §13.2; [R53.5, STALE v1](https://arxiv.org/html/2605.06527v1), §4.4. Exact access details are in [references](references.md).
