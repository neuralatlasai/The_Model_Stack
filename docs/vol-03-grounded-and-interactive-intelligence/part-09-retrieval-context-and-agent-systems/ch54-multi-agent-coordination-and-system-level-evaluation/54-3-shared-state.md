---
id: ms.section.54.3
entity_type: section
title: "Shared state"
volume: 3
part: 9
chapter: 54
section: 54.3
slug: 54-3-shared-state
parent: ms.chapter.54
prev_sibling: ms.section.54.2
next_sibling: ms.section.54.4
children: []
prerequisites: [ms.chapter.6, ms.chapter.38, ms.chapter.48, ms.chapter.51, ms.chapter.52, ms.chapter.53]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [multi_agent_coordination, resource_accounting], feedback_setting: [], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: "2026-10-25"
editorial_status: manuscript_draft
---

# 54.3 Shared state

## Scope

[DERIVED] Shared-state coordination governs ownership, version checks, locks, conflict resolution, duplicate work and irreversible effects across workers. The baseline lets every agent read and overwrite one mutable artifact or account. Success means preserving declared invariants and task provenance under concurrency and restart, while retaining partial or unknown outcomes rather than hiding them.

[DERIVED] Chapter 53 owns persistent-state consistency and deletion foundations. Chapter 51 owns logical-operation retry, proposal-bound approval and effect recovery. This section applies those contracts to competing agents and shared artifacts; it does not invent a stronger atomicity guarantee because more controllers participate.

## Why this exists

[DERIVED] Separate conversations do not imply separate state. Two workers can edit the same file, allocate the same inventory, spend one shared budget or publish duplicate external updates. A late worker can overwrite a newer correction. A coordinator can restart and dispatch a task already running under another process. These failures arise even if every individual worker follows its local instructions.

[DERIVED] A conversational consensus is also not a commit protocol. Agents may agree on a desired update while their snapshots differ, or while an external actor changes the resource. State ownership and atomic checks belong where the state is stored. A model-generated “lock acquired” statement has no exclusion effect unless an independent service actually enforces it.

[OFFICIAL-DOCUMENTATION] SQLite's transaction documentation distinguishes multiple concurrent readers from a single simultaneous writer and documents busy/error and snapshot behavior [R54.9, §§2.1–2.3]. This illustrates why actual storage semantics matter; it does not imply that an agent workflow has a transaction spanning its external tools.

## Intuition

[DERIVED] Give each mutable object one authoritative commit path. Workers can compute proposed patches on snapshots, but commit requires ownership and a current version check. If updates commute under a proven merge rule, concurrent accumulation may be safe; if they alter the same semantic constraint, the system needs ordering or rejection/replanning.

[DERIVED] A lease says which worker currently owns work under the service's rules. A fencing token lets the resource reject a former owner after reassignment. Both need enforcement outside the agent. Cancellation tells a worker to stop; it does not prevent a delayed request from arriving unless the commit path rejects its obsolete authority/version.

## Formulation

[DERIVED] Let shared resource $r$ have state/version $(z_r,\nu_r)$ and current ownership epoch $e_r$. A worker proposal contains expected version $\hat\nu$, ownership epoch $\hat e$, authorized principal $p$, patch $\Delta z$ and logical operation key. A safe optimistic commit requires
$$
\operatorname{AcceptPatch}=
\operatorname{Authorized}(p,r,\Delta z)
\land \hat\nu=\nu_r
\land\operatorname{FenceValid}(\hat e,e_r)
\land\mathcal I(z_r\oplus\Delta z),
$$
*(Eq. 54.8)*

[DERIVED] with check and write atomic at the state owner. The invariant $\mathcal I$ is the application's validity condition; $\oplus$ is the declared patch semantics, not arbitrary text concatenation. A version/fence field without enforcement has no concurrency guarantee.

[MATHEMATICALLY-DERIVED] For an unordered merge operation $\sqcup$ that must tolerate grouping, arrival order and duplicate delivery, useful algebraic conditions are
$$
(a\sqcup b)\sqcup c=a\sqcup(b\sqcup c),\quad
a\sqcup b=b\sqcup a,\quad
a\sqcup a=a.
$$
*(Eq. 54.9)*

[DERIVED] These are associativity, commutativity and idempotence on the declared state domain. They do not prove preservation of $\mathcal I$; merge closure additionally requires $a,b\in\mathcal I\Rightarrow a\sqcup b\in\mathcal I$. A union of independently valid allocation sets can exceed a global quota. A deterministic last-writer rule converges under its ordering assumptions but can still discard a necessary correction.

[MATHEMATICALLY-DERIVED] If each conflict-rejected attempt costs fixed work $w>0$, independent attempts conflict with probability $q_{\rm conflict}<1$, and at most integer $k_{\rm attempts}\ge1$ attempts are allowed, expected attempted work is
$$
\mathbb E[W_{\rm attempt}]
=w\sum_{j=0}^{k_{\rm attempts}-1}q_{\rm conflict}^{\,j}
=w\frac{1-q_{\rm conflict}^{\,k_{\rm attempts}}}{1-q_{\rm conflict}}.
$$
*(Eq. 54.10)*

[DERIVED] This is a bounded sensitivity model, not a real conflict law. At $q_{\rm conflict}=1$ the limiting work is $wk_{\rm attempts}$ with no successful commit. Correlated writers, unequal work and state-dependent conflict require actual traces. Retrying cannot increase a worker's persisted budget after restart.



```figure
{
  "id": "fig-54.9",
  "kind": "calculator",
  "title": "Expected bounded conflict work",
  "caption": "Illustrative constant per-attempt work w, independent conflict probability q<1 and at most k attempts. This is expected attempt work, not concurrency-aware wall latency.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-54.10",
  "alt": "Illustrative constant per-attempt work w, independent conflict probability q<1 and at most k attempts. This is expected attempt work, not concurrency-aware wall latency.",
  "spec": {
    "tex": "\\mathbb E W=w(1-q^k)/(1-q)",
    "equation": "54.10",
    "inputs": [
      {
        "symbol": "w",
        "label": "Work seconds per attempt",
        "default": 1,
        "min": 0.01,
        "max": 100,
        "format": "seconds"
      },
      {
        "symbol": "q",
        "label": "Independent conflict probability",
        "default": 0.3,
        "min": 0,
        "max": 0.99,
        "format": "percent"
      },
      {
        "symbol": "k",
        "label": "Maximum attempts",
        "default": 4,
        "min": 1,
        "max": 20,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "expected",
        "label": "Expected bounded attempt work",
        "formula": "w*(1-q^k)/(1-q)",
        "format": "seconds"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Inventory shared state before delegation: task journal, budget ledger, model-visible artifacts, databases, filesystem paths and external effects. Declare read/write sets and ownership granularity. Immutable artifacts can be shared by hash; mutable pointers need a versioned publication path. Disjoint output directories help only when hidden shared dependencies such as package manifests or global account state are also considered.

[DERIVED] Choose a commit strategy per resource. A single writer is simple but can bottleneck. Optimistic patches permit concurrent computation and reject stale commits. Locks can serialize dependent updates but retain resources during long model/tool waits. Mergeable accumulations need a defined algebra and invariant closure. No one strategy is universally suitable.

[DERIVED] Acquire ownership atomically and persist the prepared operation before dispatch. A worker may crash after its effect but before recording completion; a replacement must reconcile the logical operation using Chapter 51's executor instead of assuming absence. Record task identity, attempt, state version, ownership epoch and effect status. Duplicate work can be tolerated for pure isolated computation but must not duplicate a nonrepeatable effect.

[DERIVED] Lease expiry requires careful separation from safety. A service can reassign work after an authoritative lease timeout, but the old worker may still run. The state owner must reject its obsolete fencing epoch on every relevant mutation. Fencing protects only participating resources; it does not revoke an already sent external request to a service that ignores the epoch.

[DERIVED] For multiple locks, a global strict resource order prevents a wait-for cycle when every participant acquires locks only in that order: a cycle would require resource ranks to increase strictly and return to the starting rank, a contradiction. This argument assumes all participants follow the order and no hidden locks violate it. Deadlines, release on failure and recovery still matter.

[DERIVED] Conflict resolution is semantic. Rebase a patch only after checking whether its intent remains valid against the new state. A text merge can resolve syntax while violating a task requirement. Model arbitration is a proposal for resolution; independent tests, policy and authoritative state decide whether it is acceptable. If an irreversible effect already occurred, reconciliation or compensation is required rather than file-style merge.

[DERIVED] **Cost.** Locks add wait time and retained ownership state; optimistic retries waste computation according to their observed conflict process. Versioned artifacts consume storage and read traffic. Durable journals require writes before effects and retention for deduplication/recovery. Fine-grained ownership reduces some contention but increases metadata and invariant complexity. Read snapshots may be stale even without lock waiting; consistency requirements determine whether that is acceptable.



```figure
{
  "id": "fig-54.10",
  "kind": "diagram",
  "title": "Prepare under authoritative ownership",
  "caption": "Acquire ownership and its new epoch before snapshot and preparation. Persist the proposal before effect, then commit atomically or reconcile uncertainty.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.8",
  "alt": "The diagram shows Reserve attempt and epoch to Authoritative snapshot; Authoritative snapshot to Durable prepared proposal; Durable prepared proposal to Atomic fenced commit; Atomic fenced commit to Verified or unresolved state.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "branch",
        "label": "Reserve attempt and epoch"
      },
      {
        "id": "b",
        "kind": "state",
        "label": "Authoritative snapshot"
      },
      {
        "id": "c",
        "kind": "memory",
        "label": "Durable prepared proposal"
      },
      {
        "id": "d",
        "kind": "boundary",
        "label": "Atomic fenced commit"
      },
      {
        "id": "e",
        "kind": "metric",
        "label": "Verified or unresolved state"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d"
      },
      {
        "from": "d",
        "to": "e"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 54.3 — Bounded owned patch commit.** [DERIVED] Inputs are a resource, validated proposal/authority, persisted logical operation, integer attempt cap, deadline and authoritative version/fence interface. Output is verified commit, typed conflict/failure or unresolved effect.

$$
\begin{aligned}
1.&\quad J\leftarrow\operatorname{LoadOperationJournal};
\quad\operatorname{Terminal}(J)\Rightarrow\operatorname{ReplayAndStop};\\
 &\quad \operatorname{UnknownPriorEffect}(J)\Rightarrow
\operatorname{ReconcileVia}_{51.4};
\quad\operatorname{StillUnknownAndNotRepeatSafe}\Rightarrow\operatorname{ReturnUnknown}.\\
2.&\quad \operatorname{CheckPersistedCapAndDeadline};\quad \operatorname{AtomicallyReserveAttemptAndOwnership};\\
 &\quad\operatorname{UnavailableOrExhausted}\Rightarrow\operatorname{RecordAndStop};\quad (z_r,\nu_r,e_r)\leftarrow\operatorname{ReadSnapshotWithNewOwnershipEpoch}.\\
3.&\quad \Delta z\leftarrow\operatorname{BoundedPreparePatch}(z_r);\\
 &\quad\operatorname{PersistPreparedPatch}(\nu_r,e_r,\Delta z,\mathrm{operation}).\\
4.&\quad \operatorname{AtomicGateAndCommit}_{54.8}
\Rightarrow\operatorname{PersistOutcomeAndVerify};\,\operatorname{Return};\\
 &\quad\operatorname{DefiniteConflictNoEffect}\Rightarrow\operatorname{PersistConflict}.\\
5.&\quad \operatorname{DefiniteConflictNoEffect}\land\operatorname{WithinPersistedCapAndDeadline}\land\operatorname{ReplanningAuthorized}
\Rightarrow\operatorname{GoTo}(2);\\
 &\quad\operatorname{AmbiguousDelivery}\Rightarrow\operatorname{ReconcileVia}_{51.4};\,\operatorname{ReturnReconciledOrUnknown};\\
6.&\quad \operatorname{Return}(J,\mathrm{known\ partial/failure/unknown}).
\end{aligned}
$$

[DERIVED] Invariants are one enforced ownership epoch per resource, atomic gate/write, persistent attempt accounting and no unrecorded prepared mutation. Changed patches receive the approval binding required by Chapter 51; a stale approval cannot silently authorize a rebase. Conflict implies no effect only when the state owner's contract makes that explicit. All reads/preparation/reconciliation have finite bounds. The persisted attempt cap is checked and ownership is atomically reserved before expensive preparation; the snapshot uses the newly issued fencing epoch, and commit revalidates it.

## Implementation

[OFFICIAL-DOCUMENTATION] LangGraph's pinned StateGraph implementation uses partial-state updates and optional binary reducers; _is_field_binop checks a two-argument callable signature, not its algebraic laws [R54.14, StateGraph/_get_channel/_is_field_binop]. An application must therefore review ordering and duplicate behavior of its actual reducer rather than inferring Eq. 54.9 from the annotation.

[OFFICIAL-DOCUMENTATION] The persistence documentation distinguishes in-memory checkpointers, which lose state on process restart, from persistent storage [R54.8, Troubleshooting/Checkpointers]. A checkpoint can preserve graph state without atomically coupling an external effect. Durable recovery needs the correct backend, retention and commit semantics.

[DERIVED] Keep tool credentials and resource ownership outside worker prompts. A worker can carry an opaque scoped reference while the executor verifies it. Audit records should join agent/task IDs to state-owner operation IDs without exposing secrets. File paths, shared stores and external handles require actual access control, not only role descriptions.

## Experimental design

### Reported experiments

[PAPER-REPORTED] τ-bench implements deterministic database APIs and evaluates final database/communication outcomes; τ²-bench adds user actions and domain-specific state assertions [P43, §3; R54.11, §§3.1–3.3]. These support state-grounded task evaluation, but do not disclose a matched concurrent-agent lock/fencing or crash-consistency experiment.

[NOT-DISCLOSED] SQLite and LangGraph documentation describe storage/update contracts rather than a source-reported multi-agent task-quality comparison. No performance gain from using one persistence or conflict policy is imported into this chapter. Actual effects and runtime overhead remain unverified.

## Observations

**What the paper claims.** [PAPER-REPORTED] Task benchmarks use explicit state transitions and assertions to evaluate tool-mediated outcomes [P43; R54.11].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Storage/checkpoint/reducer interfaces have specific scope and failure semantics [R54.8–R54.9/R54.14]; they do not create a universal external transaction.

**What we infer.** [DERIVED] Concurrent agents need enforced ownership, atomic state checks and durable uncertainty accounting, with merge rules reviewed against application invariants.

**What remains unknown.** [UNVERIFIED] No actual concurrent writers, recovery journal, conflict distribution or side-effect fixture was executed.



```figure
{
  "id": "fig-54.11",
  "kind": "stat-panel",
  "title": "Scientific boundaries to retain",
  "caption": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.8",
  "alt": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "spec": {
    "header": "CLAIM BOUNDARY",
    "rows": [
      {
        "key": "ownership",
        "value": "Epoch captured after acquisition"
      },
      {
        "key": "merge",
        "value": "Algebra plus invariant closure"
      },
      {
        "key": "retry",
        "value": "Persisted cap and absolute deadline"
      },
      {
        "key": "unknown",
        "value": "Reconcile before repeat"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

[DERIVED] Lost update overwrites another agent's valid work; detect through version conflicts and invariant checks. Stale lease lets an old owner act; enforce fencing. Duplicate dispatch repeats external effects; preserve logical operation identity and deduplication. Nonidempotent reducer duplicates counts on replay; declare and test its algebra. Last-writer resolution erases a correction; evaluate semantic postconditions. Deadlock retains mutually requested resources; order acquisition and bound waits. Checkpoint-only recovery repeats an unjournaled effect; persist preparation and reconcile.

## Siblings

[DERIVED] Single-writer, pessimistic-lock, optimistic-version and merge-based policies differ in contention, liveness and invariant scope. Compare them under identical resource semantics and failure sets. A shared scratch artifact is easier to merge than a real financial/physical effect. Chapter 53 owns long-term consistency/deletion; Chapter 51 owns authorization and effect recovery.

## Extensions

### Improvements

[DERIVED] Enforced ownership epochs, immutable artifacts and semantic patch checks strengthen plain shared-chat state. The changed mechanism is explicit state authority, not guaranteed correctness from a framework. Open research is coordinating adaptive agents under partial observations while preserving nonlocal invariants without excessive serialization. Settling evidence requires concurrent actors, crash points, actual state checks and latency/cost accounting.

## Limitations

[DERIVED] Eq. 54.8 assumes a correctly implemented authoritative gate; Eq. 54.9 applies only to the declared merge domain; Eq. 54.10 assumes an illustrative independent conflict process. Fencing cannot undo an external effect. A perfectly serializable database can still commit a semantically wrong but authorized model action.

## Reproducibility

[UNVERIFIED] Preserve storage/runtime revisions, ownership/lease/fence definitions, operation keys, patch versions, reducer code, journals and independent invariant checks. The source pin supports static inspection only. Proposed concurrent/restart/partial-effect tests are in verification.md.

## References

[OFFICIAL-DOCUMENTATION] [R54.8](references.md#r54-8) persistence/checkpointers; [R54.9](references.md#r54-9) SQLite transactions; [R54.14](references.md#r54-14) pinned state update source. [PAPER-REPORTED] [P43](references.md#p43), [R54.11](references.md#r54-11) state-grounded task evaluation. Access 2026-10-14.
