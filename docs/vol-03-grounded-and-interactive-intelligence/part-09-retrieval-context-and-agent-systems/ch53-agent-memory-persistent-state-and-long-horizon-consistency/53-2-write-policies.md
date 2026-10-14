---
id: "ms.section.53.2"
entity_type: "section"
title: "53.2 — Write policies"
volume: 3
part: 9
chapter: 53
section: 53.2
slug: "53-2-write-policies"
parent: "ms.chapter.53"
prev_sibling: "ms.section.53.1"
next_sibling: "ms.section.53.3"
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

# 53.2 — Write policies

## Scope

[DERIVED] A write policy decides which observations become persistent records, what propositions are extracted, how confidence and provenance are represented, and which prior views are revised. It includes permissions, timestamps and consolidation. The policy developed here preserves an observation ledger while treating semantic updates as proposals that require authority, temporal and transactional validation.

## Why this exists

[DERIVED] Memory can fail before retrieval begins. If extraction drops an exception, later search cannot recover it from the extracted record. If consolidation treats repeated paraphrases as independent confirmations, confidence can increase without new evidence. If a generated summary receives the same authority as its source, future queries may prefer a compact invented statement over the actual observation.

[DERIVED] Selection also creates an asymmetric error tradeoff. Writing every incidental statement increases storage, exposure and later conflict resolution; writing too little loses information needed by unknown future tasks. The selection objective must include downstream value and harm, rather than treating the number of remembered facts as a quality metric.

## Intuition

[DERIVED] Separate three decisions: retain an observation, interpret its content, and revise an accepted state. A source can be worth retaining even when its proposition is uncertain. A clearly extracted proposition can remain unauthorized to change the current state. A valid update can invalidate an old default without revealing the replacement. These branches should be visible in the state machine instead of being collapsed into one overwrite operation.

[DERIVED] Consolidation is a dependency-preserving transformation. A merged record must name the exact supporting records and transformation version. Otherwise correction cannot distinguish independent evidence from a model-authored restatement of the same source. Compression saves later exposure tokens only if the additional extraction, adjudication and maintenance work is included in the lifetime cost.

```figure
{
  "id": "fig-53.6",
  "kind": "diagram",
  "title": "Observation retention precedes state revision",
  "caption": "Retain permitted source observations before extraction. Invalid or unauthorized proposals make no semantic revision; validated adjudication distinguishes active, stale and unknown-current state.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.7",
  "alt": "Authenticated observations enter an allowed event ledger. Bounded extraction and authority/time validation either reject the semantic proposal or reach affected-state adjudication, which can preserve active values, archive stale values or mark current state unknown.",
  "spec": {
    "direction": "TB",
    "nodes": [
      {
        "id": "e",
        "kind": "dataset",
        "label": "authenticated observations"
      },
      {
        "id": "l",
        "kind": "memory",
        "label": "permitted event ledger"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "bounded extraction + source spans"
      },
      {
        "id": "v",
        "kind": "branch",
        "label": "authority / time / semantic checks"
      },
      {
        "id": "q",
        "kind": "state",
        "label": "quarantine / no semantic revision"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "affected-state adjudication"
      },
      {
        "id": "a",
        "kind": "state",
        "label": "active supported view"
      },
      {
        "id": "s",
        "kind": "state",
        "label": "archived stale record"
      },
      {
        "id": "u",
        "kind": "state",
        "label": "UNKNOWN_CURRENT"
      }
    ],
    "edges": [
      {
        "from": "e",
        "to": "l",
        "kind": "flow",
        "label": "retain only if permitted"
      },
      {
        "from": "l",
        "to": "p",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "q",
        "kind": "flow",
        "label": "invalid / unauthorized"
      },
      {
        "from": "v",
        "to": "r",
        "kind": "flow",
        "label": "validated"
      },
      {
        "from": "r",
        "to": "a",
        "kind": "flow",
        "label": "supported current value"
      },
      {
        "from": "r",
        "to": "s",
        "kind": "flow",
        "label": "superseded"
      },
      {
        "from": "r",
        "to": "u",
        "kind": "flow",
        "label": "unsafe old default; no replacement"
      }
    ]
  }
}
```

## Formulation

[DERIVED] Let a proposed semantic write have probability $p$ of being useful and correct under its declared future-use distribution, benefit $V\ge0$ when valid, harm $H\ge0$ when invalid, and lifecycle cost $c\ge0$ in the same utility units. This is a decision model, not an interpretation of an LLM's self-reported confidence.

[MATHEMATICALLY-DERIVED] Under these two exclusive outcomes, its expected net utility is $pV-(1-p)H-c$. For $V+H>0$, a positive-utility write requires
$$
p>\frac{H+c}{V+H}.
$$
(Eq. 53.5)

[MATHEMATICALLY-DERIVED] The threshold follows by collecting the $p$ terms. If $c\ge V$, no $p\le1$ yields strictly positive utility. The result explains why low-cost archival retention and high-authority state mutation need different acceptance rules: their harm and maintenance terms differ. It does not justify applying the threshold to uncalibrated confidence scores or unknown future-use distributions.

[DERIVED] A record's temporal fields distinguish valid time, when the reported proposition applies in the world, from record time, when the system learns or stores it. An observation received today can describe an event from last month. A corrected extraction can change the system's knowledge without changing when the event occurred. Preserve both intervals, source timezone/precision and uncertainty instead of ordering all updates by ingestion time.

[MATHEMATICALLY-DERIVED] For $m$ accepted extraction or consolidation operations, let $E_j$ denote a semantic defect at operation $j$ under a specified audit distribution. Without assuming independence,
$$
\Pr\!\left(\bigcup_{j=1}^{m}E_j\right)
\le \min\!\left(1,\sum_{j=1}^{m}\Pr(E_j)\right).
$$
(Eq. 53.6)

[MATHEMATICALLY-DERIVED] This union bound does not estimate the actual defect rate, but shows that a small per-operation bound cannot be interpreted as an unchanged lifetime guarantee. Shared models and source dependencies can correlate errors. Repeatedly consolidating the same false statement provides no independent evidence that its meaning is correct.

```figure
{
  "id": "fig-53.7",
  "kind": "calculator",
  "title": "Write acceptance depends on harm and lifecycle cost",
  "caption": "Illustrative two-outcome model in common utility units. Positive utility requires p > p*; equality gives zero, and p* >= 1 admits no feasible probability. The event probability must be calibrated for its declared use.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-53.5",
  "alt": "The threshold is (harm plus lifecycle cost) divided by valid-write benefit plus harm, with all three in common utility units. Positive utility requires a strictly greater calibrated probability; a threshold at least one is infeasible.",
  "spec": {
    "tex": "p_*=(H+c)/(V+H),\\qquad p>p_*",
    "inputs": [
      {
        "symbol": "v",
        "label": "valid-write benefit (utility units)",
        "default": 1,
        "min": 0.01,
        "max": 100,
        "format": "fixed2"
      },
      {
        "symbol": "h",
        "label": "invalid-write harm (utility units)",
        "default": 5,
        "min": 0,
        "max": 100,
        "format": "fixed2"
      },
      {
        "symbol": "c",
        "label": "lifecycle cost (utility units)",
        "default": 0.2,
        "min": 0,
        "max": 100,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "strict acceptance threshold p*",
        "formula": "(h+c)/(v+h)",
        "format": "fixed2",
        "emphasis": true
      }
    ],
    "equation": "53.5"
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Threshold",
      "note": "All benefit, harm and lifecycle cost terms use the same declared utility unit."
    },
    {
      "anchor": "mechanism",
      "label": "Calibration",
      "note": "A model confidence score does not establish the required event probability."
    },
    {
      "anchor": "failure-modes",
      "label": "Infeasible write",
      "note": "When lifecycle cost equals benefit, the threshold is one: no p <= 1 gives positive utility.",
      "variables": {
        "v": 1,
        "h": 5,
        "c": 1
      }
    }
  ]
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] CUPMem, introduced with STALE, uses a fixed two-level domain/slot schema with single- and multi-valued slots. It extracts state-relevant evidence spans, generates update candidates with evidence, time and confidence, and performs local ADD, REFINE, REPLACE or NO_OP decisions. A separate revision stage expands from directly affected slots to related regions and a bounded global fallback. An LLM adjudicator can archive an old item as STALE or mark a slot UNKNOWN_CURRENT when the old default is unsafe but no replacement is established. [R53.5, Appendix F.1–F.2]

[DERIVED] This separates same-slot replacement from propagated invalidation. If an authoritative mobility limitation changes, a commuting procedure may become inapplicable without any sentence explicitly retracting the previous commute. A dependency-aware writer can mark the old procedure inapplicable and require clarification, rather than inventing a replacement route. That is an engineering implication of the representation, not a guarantee that an LLM identifies every dependency.

[PAPER-REPORTED] CUPMem preserves evidence and stale records instead of deleting them during revision; its disclosed temporal constraint allows later evidence to revise earlier items. The schema is fixed before evaluation and described as an LLM-assisted operational abstraction, not a benchmark-label lookup table. [R53.5, Appendix F.1–F.2]

[DERIVED] The manuscript strengthens the engineering boundary by requiring source authority and valid-time scope in addition to temporal order. A later untrusted webpage cannot revise an authenticated account setting merely because it was ingested later. Conversely, an authoritative correction can arrive late and revise the system's interpretation of earlier events. Event ordering is evidence about temporal applicability, not a universal authority relation.

[DERIVED] Candidate extraction should retain quoted source spans or exact offsets, the proposition, uncertainty, negation, entity resolution, units and temporal qualifiers. Evidence supports a statement only within those qualifiers. Confidence belongs to a named task and calibration protocol: extraction correctness, source reliability and future usefulness are different probabilities. Combining them by multiplication would require a conditional model, not merely three scores between zero and one.

[DERIVED] Consolidation proceeds over a bounded compatible group, checks whether the proposed summary preserves required distinctions, and retains links to every parent. Contradictory parents produce an unresolved bundle or explicit adjudication rather than a blended sentence. Independent source evidence can strengthen a proposition; self-generated restatements must not be counted as additional independent observations.

## Algorithm

### Algorithm 53.2 — Evidence-preserving write transaction

[DERIVED] Algorithm 53.2 is a bounded write transaction. Inputs are authenticated observations, schema/authority policy, event and view versions, candidate limit $J$, dependency-visit cap $G$, byte/token caps, budget $B$ and deadline $D$. Operators have enforced work/time caps including validation and cleanup. The output is an atomic event/view update or a typed failure, never an unvalidated overwrite.

$$
\begin{aligned}
1.\;& \text{If }B<c_0\text{ return budget failure};\quad B_{\rm rem}\gets B-c_0;\quad
      (E,F,v)\gets\operatorname{snapshot}();\quad \Delta\gets\varnothing.\\
2.\;& \text{For each authenticated observation, within }J\text{ visits:}\\
   &\quad \text{if permission, purpose, size or deadline checks fail, exclude and continue}.\\
3.\;& c\gets\operatorname{upper\_work}(\text{extract, adjudicate, validate});
      \quad \text{if }c>B_{\rm rem},\text{ defer and continue};\\
   & B_{\rm rem}\gets B_{\rm rem}-c;\quad
     P\gets\operatorname{extract}_{c,D}(\text{original spans}).\\
4.\;& \text{If extraction fails, }P\gets\varnothing;\ \text{retain only an allowed unresolved event,}\\
   &\quad \text{reconcile the reservation and continue to the next observation}.\\
   &\text{Otherwise validate entity, units, negation, time and parent IDs}.\\
5.\;& R\gets\operatorname{affected}_{G}(P,F);
      \quad \text{if closure is incomplete, mark its scope unresolved}.\\
6.\;& \text{For validated }p:\quad
      a\gets\operatorname{adjudicate}(p,R,\text{authority},\text{valid time});\\
   & a\in\{\text{add, refine, supersede, contradict, unknown-current, no-op}\};\\
   & \text{reject unauthorized revisions; append allowed proposals to }\Delta.\\
7.\;& \text{Validate }\Delta\text{'s cardinality, provenance and cross-slot constraints};\\
   & \text{on failure discard semantic proposals and preserve only allowed events}.\\
8.\;& B_{\rm rem}\gets B_{\rm rem}+c-\operatorname{actual\_work};
      \quad\operatorname{actual\_work}\le c.\\
9.\;& \operatorname{atomic\_commit}(v,E',F',\Delta):
      \text{ conflict returns retry-needed; success returns }v+1.
\end{aligned}
$$
(Eq. 53.7)

[DERIVED] A reserved cap $c_0$ covers authentication/control, snapshot reads, bounded record bookkeeping, final validation/commit and cleanup; unused capacity is reconciled at termination. The invariant is that an accepted view names its evidence and revision policy, and no unauthorized candidate supersedes an accepted authoritative value. Incomplete dependency search is reported rather than interpreted as absence of conflicts. The initial $B$ applies to this finite transaction; retries or redelivery of the same logical request draw from its durable remaining budget rather than resetting it. A retry must reread affected state and consume a new bounded reservation; the displayed procedure itself performs no automatic retry.

## Implementation

[DERIVED] CUPMem is outside reference-stack §4 and enters through the plan's memory/state synthesis scope. No disclosed tensor kernel implements semantic authority or provenance by itself.

[DERIVED] Store immutable event payloads separately from versioned semantic projections. A projection includes entity/slot, proposition, valid interval, supporting sources, extraction/adjudication release, confidence type, status and supersedes/contradicts edges. Single-valued slots require a uniqueness policy for overlapping valid intervals; multi-valued slots need compatibility constraints rather than indiscriminate replacement. Unknown-current must survive rendering and retrieval, since replacing it with the last known value defeats invalidation.

[DERIVED] Every extraction service receives only records authorized for its tenant, purpose and processing destination. Filtering after extraction already exposes the source to that service. Consolidation must preserve the conjunction of inherited restrictions unless an explicitly trusted policy permits a transformation. A summary's shorter length cannot be used to remove its provenance or permission obligations.

[DERIVED] Accounting includes write-side inference, storage/index updates and future maintenance. A bounded group of $n$ records with total $L$ source tokens requires reading those tokens and writing extracted/summary output; model FLOPs follow the selected architecture, not record count alone. Dense embedding creation costs one encoder pass per chosen representation. Dependency traversal is $O(|V_R|+|E_R|)$ for the visited graph region with adjacency access, and may trigger additional inference. Raw events plus views and histories increase capacity even when rendered context shrinks.

[DERIVED] Traffic includes source reads, embeddings, write-ahead/log and replica updates, and invalidation messages. Batched extraction can improve device utilization but delays visible state; synchronous adjudication adds write latency and may reduce ingestion throughput. Energy and money include failed candidates and reprocessing after corrections. Neither the manuscript nor the cited CUPMem comparison supplies a portable cost coefficient for these operations.

## Experimental design

### Reported experiments

[PAPER-REPORTED] STALE constructs 400 LLM-generated, expert-reviewed single-conflict scenarios and three independent probes per scenario: State Resolution, Premise Resistance and Implicit Policy Adaptation. Memory frameworks share GPT-4o-mini, ingest each history once and answer the probes against fixed memory. Some plain-model comparisons use evidence-preserving truncation, retaining old and new evidence while removing distractors. These are controlled benchmark settings, not naturally sampled production histories. [R53.5, §3.4–4.1]

[PAPER-REPORTED] CUPMem obtains 68.0% overall in Table 2, but its Type I/II implicit-policy scores are 32.0% and 43.0%, compared with State Resolution scores of 91.0% and 89.0%. Explicit revision helps the disclosed aggregate comparison while leaving a large gap between identifying invalidation and acting consistently with it. The table does not isolate the contribution of every schema, adjudicator or retrieval component. [R53.5, Table 2; Appendix F]

[DERIVED] A write-policy interpretation must therefore distinguish representation validity, adjudicator accuracy and downstream behavior. The result motivates explicit invalidation states but does not establish that storing such states is sufficient, or that the same schema generalizes to unseen domains and concurrent updates.

## Observations

**What the paper claims.** [PAPER-REPORTED] CUPMem converts new observations into explicit current-state revision and constrained readout. [R53.5, §5; Appendix F]

**What the evidence shows.** [PAPER-REPORTED] Its aggregate benchmark result improves over the disclosed memory-framework configurations, while implicit adaptation remains substantially below explicit resolution. [R53.5, Table 2]

**What we infer.** [DERIVED] A writer should expose uncertainty and invalidation as first-class states rather than silently keeping an unsafe default.

**What remains unknown.** [NOT-DISCLOSED] The comparison does not establish schema-independent generalization, calibrated candidate confidence, or transactional guarantees under concurrent writers.

## Failure modes

[DERIVED] Overwriting by arrival time destroys late corrections. Merging conflicting evidence can invent a nonexistent consensus. Summaries can lose exclusions, units or action status. Extraction can persist a prompt injection as a procedure. Repeated reflection can amplify one false source. Bounded dependency search can miss affected slots; this is a declared unresolved scope, not a clean consistency certificate.

## Siblings

[DERIVED] Append-only event retention favors auditability but increases read and storage work. Destructive fact replacement is compact but makes correction difficult. Periodic consolidation amortizes work while introducing lag. Write-time adjudication pays before future queries; read-time adjudication pays repeatedly and can produce query-dependent states. A hybrid needs one versioned authority policy shared by both paths.

```figure
{
  "id": "fig-53.8",
  "kind": "compare",
  "title": "Writing policies move work and uncertainty",
  "caption": "Every policy needs authority, provenance and explicit treatment of unresolved updates.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.7",
  "alt": "Every policy needs authority, provenance and explicit treatment of unresolved updates. Comparison of semantic contracts, not a feature ranking.",
  "spec": {
    "axis": "Representation and guarantee boundary",
    "columns": [
      {
        "id": "a",
        "label": "Append events"
      },
      {
        "id": "b",
        "label": "Consolidate periodically"
      },
      {
        "id": "c",
        "label": "Adjudicate on write"
      }
    ],
    "rows": [
      {
        "dimension": "Retains",
        "values": {
          "a": "raw observations",
          "b": "generated compact views",
          "c": "current-state proposals"
        }
      },
      {
        "dimension": "Extra work",
        "values": {
          "a": "later interpretation",
          "b": "transformation and validation",
          "c": "dependency revision"
        }
      },
      {
        "dimension": "Main risk",
        "values": {
          "a": "repeated read cost",
          "b": "lost qualifiers / lag",
          "c": "false invalidation"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The improvement path moves from selection and compression to explicit dependency-aware revision. A central open question is how to discover latent invalidation dependencies without causing excessive false retirement of useful records. Settling evidence needs unseen dependency types, delayed/out-of-order authoritative corrections, abstention outcomes and source-level adjudication error audits.

## Limitations

[DERIVED] Neither Eq. 53.5 nor schema validation establishes semantic truth. Expected future value and harm can be misspecified; extracted confidence can be uncalibrated; world-knowledge implications can be defeasible. Unknown-current is a safe representation of uncertainty only if downstream policies honor it.

## Reproducibility

[UNVERIFIED] No writer or consolidation benchmark was executed. Required records include exact observations, permissions, valid/record times, extraction prompts, model/schema releases, dependency search limits, candidate exclusions, calibration definition and atomic commit logs. Proposed tests remain in [verification](verification.md).

## References

[DERIVED] [R53.5, STALE v1](https://arxiv.org/html/2605.06527v1), §3–5 and Appendix F. Exact locators and access are recorded in [references](references.md).
