---
id: "ms.section.53.5"
entity_type: "section"
title: "53.5 — Forgetting and deletion"
volume: 3
part: 9
chapter: 53
section: 53.5
slug: "53-5-forgetting-and-deletion"
parent: "ms.chapter.53"
prev_sibling: "ms.section.53.4"
next_sibling: "ms.section.53.6"
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
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 53.5 — Forgetting and deletion

## Scope

[DERIVED] Forgetting is a family of contracts: stop serving a record, expire its accepted meaning, correct a false proposition, remove persisted copies, or reconstruct runtime behavior without a target observation. These contracts differ from parametric unlearning in Chapter 24. This section develops expiry, retention, invalidation, correction, privacy boundaries and contaminated-memory removal with explicit physical and computational scope.

## Why this exists

[DERIVED] A deleted source can survive in a summary, embedding, replica, cached prompt, log or backup. A live request may already have read it. An agent may have acted on it. Removing the original row therefore establishes only a local storage transition unless the system records and processes these dependencies.

[DERIVED] The opposite error is claiming that every forgetting request requires retraining or a full reset. External records can be blocked by policy; a reconstructible runtime may share a clean prefix with a counterfactual execution. The correct method depends on the requested guarantee and the state objects actually influenced.

## Intuition

[DERIVED] Expiry means a record is no longer eligible for a specified use after a time boundary; it does not necessarily erase its bytes. Correction preserves the old assertion as historical evidence while changing the accepted view. Invalidation retires an unsafe assumption, possibly leaving current state unknown. Physical erasure requires a copy inventory and retention controls. Runtime repair requires restoring the computation's state, not merely changing future retrieval.

[DERIVED] Provenance supplies a conservative removal/rebuild scope. If a summary read the target, its descendants are potentially affected even if their text omits the exact target string. A conservative graph can over-remove; a graph with missing dependency edges cannot certify that all influenced objects were found. Rebuilding permitted descendants from sanitized inputs is different from keeping their original representations.

```figure
{
  "id": "fig-53.15",
  "kind": "diagram",
  "title": "Deletion follows copies and live influence",
  "caption": "Example provenance paths show stored copies and live influence; the deployment inventory must enumerate its actual paths. Logical fencing precedes scoped purge/rebuild or runtime repair. Retained backups and unrepairable runtime remain explicit exclusions.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.18",
  "alt": "A raw record has example derived-summary, index, replica, live-state and backup paths. A tombstone/epoch fence separates stored-copy cleanup from runtime reconstruction. Reconstruction needs replay premises; otherwise quarantine or termination is reported. Receipts disclose retained copies and all other scope exclusions.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "z",
        "kind": "dataset",
        "label": "target raw record"
      },
      {
        "id": "s",
        "kind": "memory",
        "label": "derived summary"
      },
      {
        "id": "e",
        "kind": "tensor",
        "label": "embedding / index"
      },
      {
        "id": "r",
        "kind": "memory",
        "label": "replicas / caches"
      },
      {
        "id": "h",
        "kind": "state",
        "label": "live plan / KV state"
      },
      {
        "id": "l",
        "kind": "memory",
        "label": "logs / backups"
      },
      {
        "id": "f",
        "kind": "boundary",
        "label": "tombstone + epoch fence"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "purge / rebuild allowed parents"
      },
      {
        "id": "q",
        "kind": "branch",
        "label": "replay premises hold?"
      },
      {
        "id": "v",
        "kind": "process",
        "label": "private restore / replay"
      },
      {
        "id": "x",
        "kind": "state",
        "label": "terminate / quarantine"
      },
      {
        "id": "o",
        "kind": "metric",
        "label": "scoped receipts / exclusions"
      }
    ],
    "edges": [
      {
        "from": "z",
        "to": "s",
        "kind": "flow",
        "label": "derived"
      },
      {
        "from": "z",
        "to": "e",
        "kind": "flow",
        "label": "encoded"
      },
      {
        "from": "s",
        "to": "r",
        "kind": "flow"
      },
      {
        "from": "s",
        "to": "h",
        "kind": "flow",
        "label": "consumed"
      },
      {
        "from": "z",
        "to": "l",
        "kind": "flow",
        "label": "copied"
      },
      {
        "from": "z",
        "to": "f",
        "kind": "flow",
        "label": "revoke"
      },
      {
        "from": "f",
        "to": "p",
        "kind": "flow",
        "label": "stored copies"
      },
      {
        "from": "f",
        "to": "q",
        "kind": "flow",
        "label": "affected runtime"
      },
      {
        "from": "q",
        "to": "v",
        "kind": "flow",
        "label": "yes"
      },
      {
        "from": "q",
        "to": "x",
        "kind": "flow",
        "label": "no"
      },
      {
        "from": "p",
        "to": "o",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "o",
        "kind": "flow"
      },
      {
        "from": "x",
        "to": "o",
        "kind": "flow"
      },
      {
        "from": "l",
        "to": "o",
        "kind": "flow",
        "label": "retention boundary"
      }
    ]
  }
}
```

## Formulation

[DERIVED] Let $G=(V,E)$ contain immutable artifacts and recorded dependency edges from parent to derived child. For target set $Z\subseteq V$, define
$$
D_0=Z,\qquad
D_{j+1}=D_j\cup\{v:\exists u\in D_j,\ (u,v)\in E\},
\qquad D^*=\bigcup_{j\ge0}D_j.
$$
(Eq. 53.15)

[MATHEMATICALLY-DERIVED] For a finite graph, the sequence is monotone and reaches a fixed point after at most $|V|$ strict additions of new vertices. A queue traversal with visited flags takes $O(|V_D|+|E_D|)$ work on the visited region and $O(|V_D|)$ auxiliary storage. This computes recorded reachability, not complete semantic influence. Concurrent creation requires epoch/ancestor checks or another snapshot-and-fence protocol to keep new descendants from escaping the closure.

[MATHEMATICALLY-DERIVED] Zero observed extraction in $n\ge1$ independent, identically distributed Bernoulli audit units does not establish zero extraction probability $p$. A one-sided $(1-\alpha)$ upper confidence bound after zero events is
$$
p\le1-\alpha^{1/n},\qquad 0<\alpha<1.
$$
(Eq. 53.16)

[MATHEMATICALLY-DERIVED] The probability of zero events is $(1-p)^n$; solving $(1-p)^n=\alpha$ gives the displayed bound. For $n=50$ and $\alpha=0.05$, the bound is approximately 0.0582 under those premises. Correlated probes, adaptive attack selection or reused instances change the sampling model; the number of prompts is not automatically the number of independent audit units. The bound is about the specified audit distribution, not every possible extraction attack.

```figure
{
  "id": "fig-53.16",
  "kind": "calculator",
  "title": "Zero-event audits still leave uncertainty",
  "caption": "One-sided binomial bound after zero events in n iid Bernoulli audit units. Inputs and output probabilities display as percentages; the bound applies to that audit distribution, not arbitrary attacks.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-53.16",
  "alt": "With 50 independent iid audit units, zero events and tail probability 5%, the one-sided upper event probability is about 5.82%. The bound does not establish zero risk or cover correlated/adaptive attacks.",
  "spec": {
    "tex": "p_{upper}=1-\\alpha^{1/n}",
    "inputs": [
      {
        "symbol": "n",
        "label": "independent audit units",
        "default": 50,
        "min": 1,
        "max": 1000000,
        "format": "integer"
      },
      {
        "symbol": "a",
        "label": "tail probability alpha",
        "default": 0.05,
        "min": 0.001,
        "max": 0.2,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "upper event probability for this audit distribution",
        "formula": "1-a^(1/n)",
        "format": "percent",
        "emphasis": true
      }
    ],
    "equation": "53.16"
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Audit population",
      "note": "Zero observed events still permits a positive upper probability under the iid model."
    },
    {
      "anchor": "mechanism",
      "label": "More independent units",
      "note": "The same audit distribution and tail probability are required when increasing the unit count.",
      "variables": {
        "n": 500
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Assumption boundary",
      "note": "Correlated or adaptively selected probes invalidate this simple iid confidence interpretation."
    }
  ]
}
```

[DERIVED] For reconstructible execution state, write a frozen deterministic or fixed-randomness transition as $R_t=F(R_{t-1},o_t)$. A target first enters at transition $\tau$. If sanitized observations equal those of a declared counterfactual and the environment is restored without committed post-target effects, then a restored clean checkpoint obeys
$$
\widetilde R_{\tau-1}=R^{-Z}_{\tau-1},
\qquad
\widetilde R_t=F(\widetilde R_{t-1},o_t^{-Z})
\Longrightarrow
\widetilde R_t=R_t^{-Z}\quad(t\ge\tau-1).
$$
(Eq. 53.17)

[MATHEMATICALLY-DERIVED] Equality follows by induction: equal prior states and equal observations supplied to the same deterministic transition produce equal next states. The premises include every relevant runtime component, configuration and random-state dependency. Cropping KV alone does not restore a changed summary, pending plan or external environment. If later human/tool observations would differ in the counterfactual, reusing the real observations does not satisfy the premise.

## Mechanism

### Methodology

[DERIVED] A deletion operation first authenticates target, scope and requested contract, then atomically records a tombstone/revocation epoch before asynchronous cleanup. Readers and writers reject the revoked target and derived records under that epoch. In-flight owners that consumed the target are fenced from publishing affected outputs until repaired or terminated. This closes serving races while making physical cleanup a separately tracked process.

[DERIVED] The removal plan traverses raw records, summaries, embeddings, index entries/replicas, caches, active runtime state, logs and backups. Each item has an action, owner, dependency, acknowledgement and deadline/retention rule. A summary can be rebuilt from allowed parents; its old embedding and replicas still require invalidation. A log/backup held under scoped retention can remain physically present while access and restoration policy exclude it. The receipt must disclose that boundary.

[PAPER-REPORTED] Deployment-Time Memorization compares raw turns, key-fact extraction and one-sentence summaries, varying retrieved chunks and five deletion modes. Its raw_only mode deliberately scrubs raw text while retaining old embeddings and summary-tier content; full_purge and tombstone process all evaluated tiers and regenerate embeddings. The ablation therefore identifies specific pipeline omissions, not an intrinsic impossibility of every raw-record deletion design. [R53.7, §2.1–2.4, Table 1]

[PAPER-REPORTED] Execution-State Unlearning formalizes replay under deterministic/fixed randomness, exact counterfactual observations and no committed post-target effects. Its worst-case $T-\tau+1$ lower bound counts calls to a restricted black-box transition, not tokens or time. In 280 scripted paired episodes with oracle source IDs, Table 1 reports 133 recomputed tokens for selective replay, 1,235 for full reset and 202 for prefix-cached reset. Stronger attribution supports additional suffix-prefill reuse; independent-seed non-significance is explicitly not equivalence. [R53.6, Theorem 1, Corollary 1; §Experiments, Table 1]

[DERIVED] The independent reconstruction in Eq. 53.17 explains both the opportunity and the boundary: reuse clean state, reconstruct affected state, and refuse an exact-counterfactual claim when observations or effects cannot be reproduced. A side-effect deduplication key can prevent a replay from repeating an effect; it does not undo an effect already committed in the real world. Restoration, compensation and behavioral equivalence are different outcomes.

## Algorithm

### Algorithm 53.5 — Scoped removal and runtime repair

[DERIVED] Algorithm 53.5 is a resumable removal transaction. Inputs are authenticated target/scope, logical operation ID, requested contract, durable remaining budget, graph-visit cap $G_{\max}$, byte caps and deadline $D$. The operation ledger includes a prepaid bootstrap/control cap; later phases atomically reserve bounded ownership, graph, storage, validation and cleanup work before execution, decrement remaining budget and reconcile actual costs. A partial result remains blocked and pending rather than being reported as fully erased.

$$
\begin{aligned}
1.\;& \operatorname{authenticate\_scope}(Z);
      \quad\text{load operation ledger and remaining budget};\\
   & \text{if complete, return scoped receipt; if infeasible, return pending}.\\
2.\;& \operatorname{reserve\_phase\_caps}(\text{fence, traversal, receipts});\\
   & \text{on reservation failure, return pending before CAS or any phase work};\\
   & \operatorname{atomic\_CAS}(\text{epoch},\text{epoch}+1,
      \operatorname{tombstone}(Z),\text{operation owner});\\
   & \text{on conflict reread within the same durable budget, or return pending}.\\
3.\;& \operatorname{fence}(\text{affected output/state owners});
      \quad A_{\rm affected}\gets\operatorname{closure}_{G_{\max}}(Z);\\
   & \text{if closure is incomplete, persist frontier and keep scope quarantined}.\\
4.\;& \text{For each ready artifact within bounded visits: compute cap }c_a;\\
   & \text{if budget/deadline disallows }c_a,\text{ persist pending and stop};\\
   & \operatorname{block\_reads}(a);\quad
      \operatorname{purge\_or\_rebuild}_{c_a,D}(a,\text{allowed parents});\\
   & \text{record replica/cache acknowledgements and reconcile actual cost}.\\
5.\;& \text{For affected live runtime: if Eq. 53.17 premises hold,}\\
   &\qquad \text{reserve bounded restore/replay work; on failure remain quarantined};\\
   &\qquad \text{only on successful reservation reconstruct privately};\\
   & \text{otherwise terminate/quarantine it and disclose the unmet contract}.\\
6.\;& \text{Validate absence from serving paths and all required copy receipts};\\
   & \text{publish repaired state only under the new epoch and unchanged allowed parents}.\\
7.\;& \text{Return logical-blocked, cleanup-pending, physically-scoped-complete,}\\
   &\qquad \text{or counterfactual-runtime-restored, with explicit exclusions}.
\end{aligned}
$$
(Eq. 53.18)

[DERIVED] Every descendant writer must check ancestor tombstones and epoch at commit, preventing reconstruction from reintroducing revoked content. Backup restoration re-applies the deletion ledger before serving. No receipt silently equates logical denial with media erasure, or runtime reconstruction with parametric unlearning. Missing graph coverage or copy acknowledgement blocks the stronger completion label.

## Implementation

[DERIVED] Hugging Face Transformers is reference-stack §4 #26, Model definition / adaptation; its cache objects use PyTorch tensors, §4 #17, Model / autograd framework. The cache source is inspected but unpinned and unexecuted; the persistent-copy policy is backend independent.

[DERIVED] Give each representation a stable artifact ID, parent IDs, source/payload digest, creation epoch, storage owner and retention classification. A tombstone must remain discoverable long enough to block stale replicas and restores; its payload should avoid retaining the deleted secret unnecessarily. Re-embedding sanitized text changes a retrieval representation but is not proof that every old vector copy has disappeared.

[OFFICIAL-DOCUMENTATION] PostgreSQL 18 states that UPDATE/DELETE leave old row versions while they may remain visible to transactions, and vacuuming later reclaims space for reuse. This is a concrete example of why logical deletion and physical-copy handling need separate claims; it is not a secure-media-erasure guarantee. [R53.10, §24.1.2]

[OFFICIAL-DOCUMENTATION] The inspected Transformers main source dispatches cache cropping to layer-specific implementations. Dynamic sliding-window rollback can fail once earlier state is unavailable unless past recording was enabled; linear-attention layers likewise require retained past state. The mutable interface also distinguishes negative removal counts from a deprecated positive absolute-size convention. A checkpoint protocol must bind the exact cache implementation and available state rather than assuming all caches support arbitrary rollback. [R53.8, DynamicLayer.crop; DynamicSlidingWindowLayer.crop; LinearAttentionLayer.crop; Cache.crop]

[DERIVED] Accounting spans the target's entire representation lifetime. Graph traversal reads metadata; purge/rebuild reads and writes payloads, embeddings, logs and replicas. Storage can temporarily increase during rebuild. Model parameters remain unchanged in this runtime policy. Sanitized summary generation and replay consume source/prompt/output tokens and architecture-dependent FLOPs; restored KV and runtime objects incur Chapter 42's capacities and traffic.

[DERIVED] Communication includes invalidation broadcasts, replica acknowledgements and backup/restore ledgers. Fencing and replay raise affected-request latency and reduce available throughput; asynchronous physical cleanup can preserve serving availability only after logical blocking is enforced. Energy/money include failed cleanup, reconstruction, retention storage and audit probes. The execution paper's token ratio is not a universal wall-clock or energy ratio.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The deletion study samples 50 oracle LongMemEval instances, inserts high-entropy synthetic canaries into non-evidence turns, uses all-MiniLM-L6-v2 retrieval, evaluates Gemma 3 12B and a GPT-4o-mini slice, and tests direct, indirect and jailbreak probes. Utility uses cosine-over-0.50 or content-word coverage, rather than independent task execution. Table 2 reports summary-tier residue around 0.20 under raw_only and zero observed residue for full_purge/tombstone in its evaluated configurations. [R53.7, §3.1–3.3, Table 2]

[DERIVED] This small controlled study supports a pipeline-scope distinction. Its zero cells do not establish zero privacy risk, deletion across backups/logs, or behavioral independence from correlated retained facts. The inspected HTML asserts an appendix judge validation but does not contain that appendix; the claimed utility validation therefore remains unverified in this source surface.

[DERIVED] Behavioral probes matter because string silence can coexist with changed actions. A model that avoids mentioning a revoked preference may still select tools or providers according to it. Evaluation must compare relevant actions with an independently specified clean reference, while recognizing that exact counterfactual replay can be infeasible for real interactive environments.

## Observations

**What the paper claims.** [PAPER-REPORTED] Runtime replay and tier-aware deletion address different residual-influence surfaces. [R53.6; R53.7]

**What the evidence shows.** [PAPER-REPORTED] The disclosed controlled studies expose failures of local deletion within their evaluated pipelines. [R53.7, Table 2]

**What we infer.** [DERIVED] A deletion receipt must identify copy scope, serving denial, physical cleanup and runtime repair separately.

**What remains unknown.** [UNVERIFIED] No test here establishes complete physical erasure or counterfactual equivalence for open-ended environments with committed effects.

## Failure modes

[DERIVED] TTL hides rather than erases bytes. Missing dependency edges leave summaries or cached suffixes live. Old replicas reintroduce records. In-flight requests publish before a fence. Backups restore deleted entries. String redaction leaves paraphrased influence. Replay repeats effects or reuses non-counterfactual observations. A broad purge can also destroy unrelated utility, requiring scoped reconstruction rather than an unsupported success claim.

## Siblings

[DERIVED] Expiry handles use eligibility; correction handles accepted meaning; physical purge handles enumerated copies; counterfactual replay handles reconstructible execution state. Parametric unlearning changes weights under a different training-level contract. These mechanisms can be combined but cannot substitute for one another's evidence.

```figure
{
  "id": "fig-53.17",
  "kind": "compare",
  "title": "Choose the requested forgetting contract",
  "caption": "Stronger completion labels need additional scope evidence and can require more work or unavailable premises.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.18",
  "alt": "Stronger completion labels need additional scope evidence and can require more work or unavailable premises. Comparison of semantic contracts, not a feature ranking.",
  "spec": {
    "axis": "Representation and guarantee boundary",
    "columns": [
      {
        "id": "a",
        "label": "Expiry / denial"
      },
      {
        "id": "b",
        "label": "Physical copy purge"
      },
      {
        "id": "c",
        "label": "Runtime reconstruction"
      }
    ],
    "rows": [
      {
        "dimension": "Changes",
        "values": {
          "a": "future use eligibility",
          "b": "enumerated persisted representations",
          "c": "reconstructible execution trajectory"
        }
      },
      {
        "dimension": "Leaves unresolved",
        "values": {
          "a": "retained bytes / past influence",
          "b": "already committed effects / weights",
          "c": "copies outside runtime / weights"
        }
      },
      {
        "dimension": "Required evidence",
        "values": {
          "a": "read/write fence",
          "b": "inventory + replica/retention receipts",
          "c": "checkpoint + exact replay observations"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage moves from deleting one record to dependency-aware removal and bounded state reconstruction. The open question is whether practical provenance can certify enough counterfactual independence to reduce replay without an oracle. Settling evidence needs imperfect attribution, dynamic tools, committed-effect exclusions, behavioral extraction and predefined equivalence margins.

## Limitations

[DERIVED] Dependency closure is only as complete as the recorded edges. Physical deletion requires control over the relevant copies and a stated retention policy. Counterfactual reconstruction cannot erase external history, model parameters or identifying information retained through other permitted observations.

## Reproducibility

[UNVERIFIED] No deletion or replay operation was executed. Required artifacts include copy inventory, graph snapshot/frontier, epochs, reader/writer fencing, replica acknowledgements, retention exclusions, model/runtime releases, checkpoints, sanitized observations, effect receipts and probe definitions. Proposed audits remain in [verification](verification.md).

## References

[DERIVED] [R53.6, Execution-State Unlearning v1](https://arxiv.org/html/2609.04875v1), Theorem 1/Corollary 1 and Table 1; [R53.7, Deployment-Time Memorization v1](https://arxiv.org/html/2606.10062v1), §2–3; [R53.10, PostgreSQL vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html), §24.1.2. See [references](references.md).
