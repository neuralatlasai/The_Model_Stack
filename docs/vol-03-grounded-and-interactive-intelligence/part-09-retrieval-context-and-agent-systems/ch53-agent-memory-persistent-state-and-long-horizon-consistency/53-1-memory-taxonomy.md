---
id: "ms.section.53.1"
entity_type: "section"
title: "53.1 — Memory taxonomy"
volume: 3
part: 9
chapter: 53
section: 53.1
slug: "53-1-memory-taxonomy"
parent: "ms.chapter.53"
prev_sibling: null
next_sibling: "ms.section.53.2"
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

# 53.1 — Memory taxonomy

## Scope

[DERIVED] Agent memory comprises several state objects with different update, access and deletion contracts. This section distinguishes working context, episodic events, semantic propositions, procedural knowledge, plans, authoritative external state and model parameters. The artifact is a typed state inventory that prevents a retrieved recollection, generated summary or pending plan from silently becoming an authoritative fact. It extends the retrieval/context mechanisms of Chapters 49–50 without redefining them.

## Why this exists

[DERIVED] Persistence alone says little about what is retained. A transcript records an assertion; a semantic record represents an extracted proposition; a database row may determine an actual reservation; a cached attention tensor represents computation on a particular token prefix. These can disagree while every storage component operates correctly. A memory architecture needs to explain which object answers a query, which source may change it, and which descendants must change after correction.

[DERIVED] The same distinction prevents two category errors. Improving recall by retrieving records does not establish continual learning in parameters. Removing a memory entry does not reverse computation that already conditioned on it. Chapter 24 owns persistent parameter adaptation and unlearning; Chapter 42 owns inference state and its physical resource model. This chapter owns the policies connecting persistent observations to future agent decisions.

## Intuition

[DERIVED] A useful memory interface separates evidence from interpretations and intentions. An episode says an authenticated source reported a value at a specified time. A semantic view says the policy currently accepts a proposition, with supporting evidence and qualifications. A procedure describes how an action may be performed. A plan describes intended future work under assumptions; it does not prove the work happened. External state records the environment's actual result.

[DERIVED] Working context is the currently rendered input, not a complete catalog of retained knowledge. External memory matters only after the runtime retrieves or otherwise exposes it to the model or deterministic controller. Conversely, a removed prompt span can remain influential through a later summary or cached suffix. Retention, exposure and influence are distinct relations, each requiring an explicit boundary.

```figure
{
  "id": "fig-53.3",
  "kind": "diagram",
  "title": "Typed memory objects carry different authority",
  "caption": "An observation supports a semantic view; a proposed plan remains an intention. Verified external state is a separate authority, and no inventory arrow commits an action.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.1",
  "alt": "Episodic observations pass through extraction into a semantic view. Verified external state supplies separately checked facts. Proposed plans and versioned procedures enter context, without an implied external mutation.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "e",
        "kind": "dataset",
        "label": "episodic observation"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "validated extraction"
      },
      {
        "id": "v",
        "kind": "state",
        "label": "semantic view"
      },
      {
        "id": "p",
        "kind": "state",
        "label": "proposed plan / versioned procedure"
      },
      {
        "id": "x",
        "kind": "state",
        "label": "verified external state"
      },
      {
        "id": "h",
        "kind": "memory",
        "label": "context / execution state"
      }
    ],
    "edges": [
      {
        "from": "e",
        "to": "s",
        "kind": "flow"
      },
      {
        "from": "s",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "p",
        "kind": "flow"
      },
      {
        "from": "x",
        "to": "v",
        "kind": "flow",
        "label": "versioned verified observation"
      },
      {
        "from": "v",
        "to": "h",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "h",
        "kind": "flow"
      }
    ]
  }
}
```

## Formulation

[DERIVED] Let a runtime inventory at decision boundary $t$ be
$$
\mathcal S_t=(\theta_t,C_t,H_t,E_t,F_t,K_t,\Pi_t,X_t).
$$
(Eq. 53.1)

[DERIVED] Here $\theta_t$ denotes model parameters; $C_t$ the exact working context; $H_t$ the execution state, including applicable KV state; $E_t$ an append-only observation/event ledger; $F_t$ accepted semantic views; $K_t$ procedural records; $\Pi_t$ pending plans; and $X_t$ authoritative external state or its verified versioned observations. The objects can share storage while retaining different semantics. A source assertion in $E_t$ is not automatically true in $X_t$.

[MATHEMATICALLY-DERIVED] Compression is decision-sufficient only relative to a declared decision problem. Suppose a history encoder $g$ maps histories $h$ to memory $m$, and the required decision is a deterministic function $a^*(h,q)$. A necessary condition for a decoder using only $(m,q)$ to reproduce every required decision is
$$
g(h)=g(h')\ \Longrightarrow\
a^*(h,q)=a^*(h',q)\quad\text{for every allowed }q.
$$
(Eq. 53.2)

[MATHEMATICALLY-DERIVED] If two histories share $m$ but require different decisions for the same query, any deterministic decoder receives identical input and must produce the same output, contradicting at least one requirement. A stochastic decoder cannot guarantee both incompatible outputs either. This is an indistinguishability argument, not a claim that a practical summary is a sufficient statistic. The allowed query family determines which distinctions may safely disappear.

[DERIVED] A summary omitting whether a booking was merely proposed or actually committed violates Eq. 53.2 for a query asking whether to book again. Keeping only a user's latest mentioned city may violate it for a historical question. Keeping every string avoids this particular compression collision but still leaves interpretation, access control and context-selection failures. Representation sufficiency and effective model use require separate evidence.

```figure
{
  "id": "fig-53.4",
  "kind": "calculator",
  "title": "Base external-memory capacity",
  "caption": "Payload, embedding and metadata bytes add before indexes, replicas and version histories.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-53.4",
  "alt": "Payload, embedding and metadata bytes add before indexes, replicas and version histories. Inputs are illustrative analytical values, not benchmark measurements.",
  "spec": {
    "tex": "M_{\\rm base}=N(d_eb_e+\\bar p+\\bar h)",
    "inputs": [
      {
        "symbol": "n",
        "label": "records",
        "default": 100000,
        "min": 0,
        "max": 10000000,
        "format": "integer"
      },
      {
        "symbol": "d",
        "label": "embedding width",
        "default": 768,
        "min": 0,
        "max": 10000,
        "format": "integer"
      },
      {
        "symbol": "b",
        "label": "bytes per coordinate",
        "default": 4,
        "min": 1,
        "max": 8,
        "format": "bytes"
      },
      {
        "symbol": "p",
        "label": "mean payload bytes per record",
        "default": 1000,
        "min": 0,
        "max": 100000,
        "format": "bytes"
      },
      {
        "symbol": "h",
        "label": "mean metadata bytes per record",
        "default": 300,
        "min": 0,
        "max": 10000,
        "format": "bytes"
      }
    ],
    "outputs": [
      {
        "symbol": "m",
        "label": "base memory bytes",
        "formula": "n*(d*b+p+h)",
        "format": "bytes",
        "emphasis": true
      }
    ],
    "equation": "53.4"
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Base records",
      "note": "Mean payload and metadata plus coordinate bytes determine this base capacity."
    },
    {
      "anchor": "mechanism",
      "label": "Execution boundary",
      "note": "Indexes, replicas and histories add state; retrieval also incurs model-context cost."
    },
    {
      "anchor": "failure-modes",
      "label": "Scope",
      "note": "This capacity does not inventory live KV state or committed external effects."
    }
  ]
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] MemGPT divides accessible prompt state into read-only system instructions, editable working context and a rolling message queue, while recall and archival stores remain outside the prompt. Model-generated function calls move or edit information; validated results and errors return to the queue. Memory-pressure warnings precede eviction, which creates a recursive summary while preserving evicted messages in recall storage. Retrieval is paginated, and a heartbeat argument requests another inference step for function chaining. These are the disclosed mechanisms, rather than a larger transformer context window. [R53.1, §2.1–2.4]

[DERIVED] Reconstructing that control path reveals three different policies: what to preserve externally, what to expose now, and when to continue processing. The controller can validate function syntax and token capacity deterministically; deciding that an extracted preference is current or important remains a semantic judgment. A function interface supplies state transitions, not their epistemic correctness.

[DERIVED] Episodic events should retain the source's original assertion and its provenance. Semantic facts are policy-governed projections over those events, including rejected or unresolved alternatives. Procedures need applicability conditions, permission scope and a version of the environment/API they target. Plans need dependencies and an execution status such as proposed, authorized, dispatched, committed or cancelled. Treating all five as interchangeable vector-store chunks erases the distinctions needed to prevent stale actions.

[PAPER-REPORTED] EWC addresses a different object: it regularizes parameter changes using a diagonal Fisher-weighted quadratic penalty around a previously learned solution. Its original experiments involve sequential permuted-MNIST and Atari tasks, not deletion of agent records or live KV state. The approximation and sequential interpretation belong to Chapter 24. [P16, §2, Eq. 3; §2.1–2.2]

[DERIVED] The practical separation is operational. A persistent parameter update changes predictions even when no memory item is retrieved. An external record can be withheld or versioned without retraining the model, although its earlier influence may remain in runtime state. A tool-state mutation can survive both model reset and memory deletion. A complete inventory must identify all three before assigning a recovery or forgetting guarantee.

## Algorithm

### Algorithm 53.1 — Bounded typed inventory

[DERIVED] Algorithm 53.1 constructs a bounded typed inventory. Inputs are at most $N_{\max}$ candidate objects, an authenticated tenant/purpose, a schema, current inventory version $v$, byte cap $M_{\max}$, work budget $B$, and deadline $D$. Classification is a proposal; deterministic validation checks allowed type, origin, field limits and references. External actions are not executed by inventory construction.

$$
\begin{aligned}
1.\;& A\gets\varnothing,\quad\text{if }B<c_0\text{ return budget failure};\\
   & B_{\rm rem}\gets B-c_0,\quad j\gets0,\quad
      S\gets\operatorname{snapshot}(v).\\
2.\;& \text{For each }z\text{, at most }N_{\max}\text{ visits: }
      j\gets j+1;\ \text{if expired, stop with partial status}.\\
3.\;& \text{If identity, purpose, byte cap or bounded schema checks fail,}\\
   &\qquad \operatorname{record\_exclusion}(z);\ \text{continue}.\\
4.\;& c\gets\operatorname{upper\_work}(z);
      \ \text{if }c>B_{\rm rem},\ \operatorname{exclude}(z);\ \text{continue};\\
   & B_{\rm rem}\gets B_{\rm rem}-c;\quad
      p\gets\operatorname{classify}_{c,D}(z).\\
5.\;& \text{If classification fails, retain an unresolved event only when}\\
   &\qquad \text{its independently validated record fits; otherwise exclude}.\\
6.\;& \text{If valid, }A\gets A\cup
      \{(\operatorname{type}(p),z,\operatorname{origin}(z),
         \operatorname{dependencies}(p),\text{inventory-staged},\text{effect-status}(z))\}.\\
7.\;& B_{\rm rem}\gets B_{\rm rem}+c-\operatorname{actual\_work}(z);
      \quad\text{require actual work}\le c.\\
8.\;& \text{If }\operatorname{bytes}(S\cup A)>M_{\max},
      \text{ return capacity failure without publishing }A.\\
9.\;& \operatorname{CAS}(v,v+1,S\cup\operatorname{inventory\_committed}(A)):
      \text{ success returns inventory};\
      \text{conflict returns retry-needed, without automatic retry}.
\end{aligned}
$$
(Eq. 53.3)

[DERIVED] A reserved cap $c_0$ covers authentication/control, snapshot reads, bounded record bookkeeping, final validation/commit and cleanup; unused capacity is reconciled at termination. The invariant is that every published entry has an origin, type, bounded representation and separate inventory-commit and represented-effect statuses, with aggregate inventory bytes below the configured cap. Publishing an inventory record does not commit a represented external action: a persisted proposed plan remains proposed. Classification cost includes any model call and validation; the enforced operator limit includes cleanup. Failed proposals cannot create a semantic fact or dispatch a tool. Cross-record atomicity depends on the storage transaction scope developed in §53.4.

## Implementation

[DERIVED] MemGPT is outside reference-stack §4 and is included through the plan's external-memory anchor; the proposed inventory itself is storage/framework independent.

[DERIVED] A record header should carry immutable ID, tenant, source ID/revision, type, payload digest, schema version, permission/purpose labels, valid-time interval, ingestion time, dependency IDs, state version and lifecycle status. Payloads can remain in separate object storage. A semantic view stores supporting event IDs and its adjudication version; a plan stores preconditions and action IDs. Provenance metadata is part of the computational representation, not an optional annotation added after a wrong answer.

[DERIVED] Accounting covers the inventory service plus model calls. External memory adds no required model parameters unless a separate encoder, extractor or memory policy is deployed. With $N$ records, embedding width $d_e$, $b_e$ bytes per embedding coordinate, mean payload bytes $\bar p$ and metadata bytes $\bar h$, the elementary capacity term, before indexes, replicas and histories, is
$$
M_{\rm base}=N(d_eb_e+\bar p+\bar h).
$$
(Eq. 53.4)

[DERIVED] Working-context tokens incur the prefill, decode and KV costs defined in Chapter 42; retaining records externally does not make those costs disappear when retrieved.

[DERIVED] Reads transfer selected payloads and metadata; writes transfer records, embeddings and replication/log updates. Extra extraction, consolidation or paging calls consume input/output tokens and serial latency. Throughput can be limited by database contention or repeated model calls rather than raw vector distance. Energy and monetary cost must include encoder/extractor inference, storage, replication and later deletion/replay, under a declared lifetime. Hardware-specific coefficients for this artifact remain unmeasured.

## Experimental design

### Reported experiments

[PAPER-REPORTED] MemGPT's deep-memory retrieval test adds an LLM-generated sixth-session question to five-session Multi-Session Chat histories. Fixed-context baselines receive a lossy prior-history summary; MemGPT can page through full history. Table 2 reports GPT-4 (gpt-4-0613, 8,192-token context) accuracy of 32.1% for the baseline and 92.5% with MemGPT, using the paper's answer judge. This establishes an outcome for different information-access policies, not a matched-compute isolation of every memory component. [R53.1, §3.1.1, Table 2]

[PAPER-REPORTED] Its nested key-value experiment fixes 140 UUID pairs and varies lookup nesting/order. MemGPT's GPT-4 configuration handles the disclosed nesting settings; GPT-3.5 and GPT-4 Turbo variants degrade when they fail to perform enough lookups. The document experiment likewise observes premature stopping before exhausting retrieval pages. These negative conditions connect memory utility to control competence and stopping policy. [R53.1, §3.2.1–3.2.2]

[DERIVED] The relevant experimental unit is an entire session or dependent task sequence. A correct lookup establishes neither authority nor a successful external action. Ablating the editable working block, page count or retained raw history changes different constraints; conclusions require matching whichever resource or access dimension is claimed to explain the difference.

## Observations

**What the paper claims.** [PAPER-REPORTED] MemGPT uses tiered storage and function-driven control to expose information beyond a fixed prompt. [R53.1, §2]

**What the evidence shows.** [PAPER-REPORTED] Its disclosed retrieval tasks improve under specific base models and access policies, while weaker function-control configurations fail to complete retrieval chains. [R53.1, §3]

**What we infer.** [DERIVED] Memory architecture must specify both state representation and the policy that makes retained information available at a decision boundary.

**What remains unknown.** [NOT-DISCLOSED] These experiments do not establish long-term transactional consistency, physical erasure, or a universal gain from external memory across 2026 agent workloads.

## Failure modes

[DERIVED] A generated plan can be mistaken for a completed action; a paraphrase can lose negation or temporal scope; an assistant-generated assertion can become a self-confirming fact; a cache can carry information no longer present in the visible transcript. Unbounded paging can also turn a nominally small context into unbounded cumulative inference cost. Each failure violates a different inventory or control invariant.

## Siblings

[DERIVED] Full-history prompting preserves more original context but pays repeated exposure cost. Episodic retrieval preserves source detail while risking omission. Semantic views simplify current-state queries while requiring adjudication and correction. Parametric adaptation changes general behavior but requires training-level retention tests. These are compatible components, not interchangeable implementations of one guarantee.

```figure
{
  "id": "fig-53.5",
  "kind": "compare",
  "title": "Memory objects require distinct guarantees",
  "caption": "Persistence does not make evidence, intentions and environment state interchangeable.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.1",
  "alt": "Persistence does not make evidence, intentions and environment state interchangeable. Comparison of semantic contracts, not a feature ranking.",
  "spec": {
    "axis": "Representation and guarantee boundary",
    "columns": [
      {
        "id": "a",
        "label": "Episodic ledger"
      },
      {
        "id": "b",
        "label": "Semantic view"
      },
      {
        "id": "c",
        "label": "Plan / external state"
      }
    ],
    "rows": [
      {
        "dimension": "Represents",
        "values": {
          "a": "source assertion",
          "b": "policy-accepted proposition",
          "c": "intention / committed outcome"
        }
      },
      {
        "dimension": "Revision",
        "values": {
          "a": "append correction",
          "b": "adjudicate and version",
          "c": "cancel / verified transition"
        }
      },
      {
        "dimension": "Main check",
        "values": {
          "a": "origin and scope",
          "b": "support and currency",
          "c": "preconditions / commit receipt"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage from retrieved evidence to self-managed context motivates typed, versioned memory services. The unresolved question is whether a compact memory can preserve decisions across a broad, changing query family without effectively retaining the raw history. Settling evidence requires adversarial pairs that share the summary yet demand different actions, plus matched lifetime resource accounting.

## Limitations

[DERIVED] A taxonomy does not supply a correct extractor or authoritative source. Eq. 53.2 is a requirement relative to declared decisions, not a practical certificate for arbitrary future questions. An inventory can be internally valid while the world changes or the model ignores its evidence.

## Reproducibility

[UNVERIFIED] No memory service or model benchmark was executed. Reproduction needs typed schemas, payload/source revisions, exact prompts, memory-function definitions, page/step limits, model/tokenizer releases, full retained history and extraction/eviction logs. Proposed checks are in [verification](verification.md).

## References

[DERIVED] [R53.1, MemGPT v2](https://arxiv.org/html/2310.08560v2), §2–3; [P16, EWC v2](https://arxiv.org/html/1612.00796v2), §2. Exact access/revision details appear in [references](references.md).
