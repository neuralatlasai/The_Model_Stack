---
id: "ms.section.53.3"
entity_type: "section"
title: "53.3 — Retrieval and use"
volume: 3
part: 9
chapter: 53
section: 53.3
slug: "53-3-retrieval-and-use"
parent: "ms.chapter.53"
prev_sibling: "ms.section.53.2"
next_sibling: "ms.section.53.4"
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

# 53.3 — Retrieval and use

## Scope

[DERIVED] Memory retrieval is a permissioned, temporally scoped evidence-selection operation. Its output must support a current or historical query and constrain subsequent actions. This section develops relevance, recency, salience, contradiction handling and source grounding, then connects memory bundles to the context compiler of Chapter 50. Chapter 49 retains ownership of index and nearest-neighbor mechanics.

## Why this exists

[DERIVED] A relevant recollection can be wrong for the requested time or authority boundary. A recently accessed stale address can outrank an older authoritative correction. A plan can mention a booking that never committed. A query can presuppose that an outdated preference still holds, causing retrieval to reinforce the false premise rather than challenge it.

[DERIVED] Retrieval quality is therefore not exhausted by whether the expected string appears in the top results. The system must identify which proposition may govern the decision, which alternatives remain disputed, and whether the current state is known at all. Source identity, temporal scope and version freshness belong in that decision.

## Intuition

[DERIVED] A ranking function answers “which eligible records are useful to inspect?” It should not answer “which source is authorized to change the world state?” Authority and access are admissibility predicates; relevance and salience order candidates within the admissible set. A single scalar that mixes all properties can allow sufficiently high similarity or recency to override a required restriction.

[DERIVED] A memory-aware context bundle should distinguish accepted current state, historical observations, stale alternatives, unknown-current markers and pending plans. Its source map links every rendered proposition to an exact source/version. The action controller then validates the preconditions of the intended tool call against authoritative state, not merely against the model's recalled narrative.

```figure
{
  "id": "fig-53.9",
  "kind": "diagram",
  "title": "Eligible memories become status-aware evidence",
  "caption": "Permission and temporal eligibility gate use. Current-state lookup resolves status separately from similarity; unresolved current state requests clarification, and historical values cannot authorize a current action.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.10",
  "alt": "A bounded search and accepted-state lookup feed eligibility and status resolution. Ineligible records are excluded. Supported current evidence reaches context and a version gate; historical evidence has a labeled readout, while outdated or unknown required state blocks action and requests clarification.",
  "spec": {
    "direction": "TB",
    "nodes": [
      {
        "id": "q",
        "kind": "state",
        "label": "query / requested time"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "bounded candidate search"
      },
      {
        "id": "l",
        "kind": "memory",
        "label": "accepted-state lookup"
      },
      {
        "id": "e",
        "kind": "branch",
        "label": "permission / temporal eligibility"
      },
      {
        "id": "x",
        "kind": "state",
        "label": "exclude ineligible record"
      },
      {
        "id": "v",
        "kind": "branch",
        "label": "resolve current / historical status"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "current context + provenance"
      },
      {
        "id": "h",
        "kind": "process",
        "label": "historical readout + valid intervals"
      },
      {
        "id": "u",
        "kind": "state",
        "label": "clarify / block current action"
      },
      {
        "id": "p",
        "kind": "branch",
        "label": "dispatch-time version check"
      },
      {
        "id": "a",
        "kind": "state",
        "label": "admitted current action"
      }
    ],
    "edges": [
      {
        "from": "q",
        "to": "r",
        "kind": "flow"
      },
      {
        "from": "q",
        "to": "l",
        "kind": "flow"
      },
      {
        "from": "r",
        "to": "e",
        "kind": "flow"
      },
      {
        "from": "l",
        "to": "e",
        "kind": "flow"
      },
      {
        "from": "e",
        "to": "x",
        "kind": "flow",
        "label": "ineligible"
      },
      {
        "from": "e",
        "to": "v",
        "kind": "flow",
        "label": "eligible"
      },
      {
        "from": "v",
        "to": "c",
        "kind": "flow",
        "label": "supported current state"
      },
      {
        "from": "v",
        "to": "h",
        "kind": "flow",
        "label": "historical query; supported past value"
      },
      {
        "from": "v",
        "to": "u",
        "kind": "flow",
        "label": "outdated / contested / unknown required state"
      },
      {
        "from": "c",
        "to": "p",
        "kind": "flow",
        "label": "action requested"
      },
      {
        "from": "p",
        "to": "a",
        "kind": "flow",
        "label": "current versions + authority"
      },
      {
        "from": "p",
        "to": "u",
        "kind": "flow",
        "label": "changed / unsupported"
      }
    ]
  }
}
```

## Formulation

[DERIVED] For principal $u$, purpose $p$, query $q$ referring to world time $t_q$, and record-time snapshot $s$, define the hard-eligible set
$$
\mathcal E(q,u,p,t_q,s)=
\{m:\operatorname{allowed}(m,u,p)
\land \operatorname{known}(m,s)
\land \operatorname{temporally\_applicable}(m,t_q)
\land \neg\operatorname{revoked}(m,s)\}.
$$
(Eq. 53.8)

[DERIVED] Known-at-snapshot limits the evidence available to the system at $s$; temporally applicable addresses what time the proposition describes. Current-state selection additionally requires the accepted state view or an explicit unresolved marker. Historical queries may legitimately retrieve superseded values with their valid intervals. An expired access permission remains a separate restriction even for historical queries.

[DERIVED] An illustrative within-eligibility ranking is
$$
s_q(m)=\lambda_r R(q,m)+
\lambda_f e^{-\beta\,\operatorname{age}(m,t_q)}
+\lambda_i I(m),\qquad
\lambda_r,\lambda_f,\lambda_i,\beta\ge0,
$$
(Eq. 53.9)

[DERIVED] where $\beta$ has inverse-age units so the exponential argument is dimensionless, $R$ is relevance, $I$ is a bounded salience score, and age has a declared basis and nonnegative domain. Last access, observation time, event time and last validation time answer different questions. For a historical query, freshness relative to today may be irrelevant. Equation 53.9 is a policy family, not an empirically calibrated probability of truth.

[MATHEMATICALLY-DERIVED] A hard restriction cannot generally be replaced by a finite additive penalty when another score is unbounded. If an unauthorized item receives penalty $K<\infty$ and relevance advantage exceeds $K$, its penalized score can exceed the allowed item's score. Even bounded scores require a proved dominating penalty and a correct final filter. Explicit eligibility avoids relying on such accidental scale relationships.

```figure
{
  "id": "fig-53.10",
  "kind": "calculator",
  "title": "Access recency is not state validation",
  "caption": "Illustrative access-recency factor d^a with d = exp(-beta) per declared age unit. Access refresh changes rank without new evidence. Extremely small factors can underflow to numerical zero.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-53.9",
  "alt": "Exponential decay with d = exp(-beta); refreshing access changes rank without adding new evidence. Inputs are illustrative analytical values, not benchmark measurements.",
  "spec": {
    "tex": "r=d^a",
    "inputs": [
      {
        "symbol": "d",
        "label": "per-unit decay factor",
        "default": 0.995,
        "min": 0.001,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "a",
        "label": "elapsed units since access",
        "default": 100,
        "min": 0,
        "max": 10000,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "r",
        "label": "recency component",
        "formula": "d^a",
        "format": "ratio",
        "emphasis": true
      }
    ],
    "equation": "53.9"
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Age units",
      "note": "The decay factor is per declared age unit; beta has the reciprocal unit."
    },
    {
      "anchor": "mechanism",
      "label": "Access refresh",
      "note": "Resetting age to zero restores the rank factor without validating external state.",
      "variables": {
        "a": 0
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Old access",
      "note": "A low or numerically zero recency factor is not evidence that a fact is false.",
      "variables": {
        "a": 10000
      }
    }
  ]
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] Generative Agents combines min-max-normalized relevance, importance and recency with equal weights; relevance uses embedding cosine similarity, importance is model-scored, and recency decays with hours since last retrieval. It also generates reflections from retrieved observations when accumulated importance crosses a threshold. These are disclosed selection/consolidation heuristics, not calibrated current-state or source-authority guarantees. [R53.2, §4.1–4.2]

[DERIVED] Last-access recency creates feedback: retrieving an item refreshes its rank even without a new external observation. That can be useful for maintaining an active task, but it must not be confused with renewed evidence that a fact remains true. Separate an activity score from a validated-state freshness score. The query's task and temporal semantics determine which is useful.

[DERIVED] Retrieval proceeds in two linked stages. The first gathers a bounded candidate pool from permitted partitions or a trusted internal retrieval service. The second resolves the candidates against a consistent state snapshot: accepted propositions, contradictions, supersession chains and unknown-current states. Approximate search can omit the decisive correction; a current-state lookup by entity/slot supplies a separate path that does not depend solely on text similarity.

[PAPER-REPORTED] LongMemEval's disclosed indexing design separates stored values from retrieval keys: rounds or sessions retain original content, while extracted user facts can expand the search key. Its reader receives retrieved items in timestamp order; time-aware queries may restrict retrieval to an extracted date range. These are independently variable design decisions, not one monolithic “memory quality” setting. [R53.3, §4–5.4]

[DERIVED] Key expansion can improve matchability without replacing source evidence. A model-generated key is a search aid, not the authoritative value. Preserve both its generating source and extraction release, and expose the original span when validating the answer. If the key misstates the source, the readout must resolve the discrepancy rather than treating the duplicate wording as confirmation.

[PAPER-REPORTED] CUPMem analyzes query intent, presupposed states, required current-state basis and requested action. It returns status-aware bundles and verifies whether a premise is SUPPORTED, OUTDATED or UNRESOLVED before readout. Its state representation includes archived stale items and unknown-current markers. [R53.5, Appendix F.3]

[DERIVED] The manuscript's action boundary adds a versioned precondition check. If a tool call depends on the current delivery address, retrieve the accepted address evidence and verify its authoritative version immediately before dispatch. If an intervening update changes the version, regenerate or reject the action. An unresolved memory can support a clarification question; it cannot authorize silently using the old value.

[DERIVED] Context assembly selects from these bundles under the exact token and dependency constraints in §50.1–50.2. It preserves source IDs, distinctions between current/historical/contested states, and the model's instruction hierarchy. Retrieved procedures are data until trusted policy authorizes their use. Quoting a procedure inside memory does not grant permission to execute its instructions.

## Algorithm

### Algorithm 53.3 — Status-aware memory retrieval

[DERIVED] Algorithm 53.3 returns a grounded memory bundle and action-precondition manifest. Inputs are query/principal/purpose, state snapshot version $v$, bounded retrieval count $k$, candidate visit cap $J$, context budget $L_{\max}$, work budget $B$ and deadline $D$. All retrieval, adjudication and compilation operators enforce reserved work and time limits.

$$
\begin{aligned}
1.\;& \text{If }B<c_0\text{ return budget failure};\quad B_{\rm rem}\gets B-c_0;\quad A\gets\varnothing;\quad
      F_v\gets\operatorname{snapshot}(v);\quad
      (t_q,\text{intent})\gets\text{unset}.\\
2.\;& \text{Reserve bounded parse/retrieval work before dispatch; if infeasible,}\\
   &\qquad \text{return unavailable without reading unauthorized payloads};\\
   & (t_q,\text{intent})\gets\operatorname{bounded\_parse}_{D}(q).\\
3.\;& C\gets\operatorname{retrieve}_{k,J,D}(q,\text{allowed partition});\\
   & \text{for each candidate within }J\text{ visits: if Eq. 53.8 fails, exclude and continue}.\\
4.\;& A\gets A\cup\operatorname{eligible\_candidates}(C);
      \quad A\gets A\cup\operatorname{bounded\_state\_lookup}(F_v,\text{query slots}).\\
5.\;& \text{Resolve source versions, contradictions and unknown-current markers;}\\
   & \text{if required current state is unresolved, return clarification with provenance}.\\
6.\;& S\gets\operatorname{choose\_dependency\_bundles}(A);
      \quad c\gets\operatorname{upper\_work}(\text{compile and validate});\\
   & \text{if }c>B_{\rm rem},\text{ return budget-limited};
      \quad B_{\rm rem}\gets B_{\rm rem}-c.\\
7.\;& C_q\gets\operatorname{compile}_{c,D}(S);
      \quad\text{if exact tokens exceed }L_{\max},\\
   &\qquad \text{return infeasible or use a predeclared bounded reduction, then revalidate}.\\
8.\;& B_{\rm rem}\gets B_{\rm rem}+c-\operatorname{actual\_work};
      \quad\text{reconcile all earlier reservations similarly}.\\
9.\;& \text{Return }(C_q,v,\text{source manifest},\text{action preconditions});\\
   & \text{at dispatch, if current authoritative versions differ, block and replan}.
\end{aligned}
$$
(Eq. 53.10)

[DERIVED] The reserved cap $c_0$ covers control, snapshot/state lookups, bounded eligibility/provenance checks, manifest creation and cleanup. Step 2 reserves the full bounded parsing and retrieval work before either operation is invoked; neither is dispatched twice. State lookups and bounded deterministic checks already covered by $c_0$ are not charged twice; additional model adjudication uses a separate enforced reservation before dispatch. No fallback may exceed $B$ or $D$; incomplete retrieval is an explicit outcome.

## Implementation

[DERIVED] LongMemEval's retrieval/readout design is outside reference-stack §4; nearest-neighbor infrastructure remains Chapter 49's implementation boundary, and context serialization remains Chapter 50's.

[DERIVED] Use stable entity/slot keys alongside semantic indexes, since a corrective record can use different wording from the old fact. Index metadata includes tenant, permission, lifecycle and source revision; a final trusted snapshot check remains necessary when the index lags. A filtered candidate pool can require over-fetching, but over-fetching is bounded and accounted, not an excuse to expose records across tenant boundaries.

[DERIVED] A memory bundle carries both accepted state and relevant conflict metadata. It should not include every stale payload when a compact invalidation marker suffices, particularly after revocation. Historical questions need historical evidence; current action questions need accepted current state. The compiler retains those roles through serialization and records exact included/excluded IDs so answer support can be audited.

[DERIVED] Accounting includes retrieval/index traffic, adjudication and rendering. A brute-force dense scan over $N$ embeddings of width $d_e$ performs $O(Nd_e)$ arithmetic and reads the corresponding coordinates; approximate indexes change that tradeoff without providing a universal complexity/recall guarantee. A top-$k$ heap adds $O(N\log(k+1))$ comparisons for $k\ge1$ in a simple scan implementation. Entity lookup and version checks add database work and network round trips.

[DERIVED] Retrieved payload tokens increase model prefill work, KV capacity and decode attention traffic under Chapter 42's model. No extra model parameters are required by the policy itself; embeddings, rerankers or adjudicators add their own parameters and inference. Extra retrieval rounds and checks increase serial latency and can reduce throughput. Energy/money include unsuccessful searches, stale-index retries and later invalidation. Source-reported latency is configuration-specific; no such coefficient was measured here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] LongMemEval evaluates a 1.5B Stella V5 retriever, Llama 3.1 8B extraction and several readers on its large-history setting. With round values, Table 3 reports Recall@10 of 0.692 for the original-value key and 0.784 for value-plus-fact expansion; GPT-4o top-10 QA changes from 0.670 to 0.720. Fact-only keys yield Recall@10 of 0.654. Search aids and preserved source values therefore have different empirical roles in this setup. [R53.3, §5.1–5.3, Table 3]

[PAPER-REPORTED] The same study finds extracted summaries/facts can lose useful source detail, with task-dependent exceptions, and warns that weaker temporal-query extraction can invent date ranges and filter out needed evidence. Appendix E.4 supplies examples of false date constraints when none should be extracted. Its reader-dependent token-budget behavior also prevents a universal “more retrieved memory helps” conclusion. [R53.3, §5.2, §5.4; Appendix E.4]

[DERIVED] These results support a layered analysis: retrieval recall, source retention, temporal filtering and reader use are separately inspectable. A source-preserving key expansion is not equivalent to replacing the original value with a summary. A correct date filter can help; an unjustified one can make the needed evidence unreachable.

## Observations

**What the paper claims.** [PAPER-REPORTED] LongMemEval improves disclosed memory retrieval/reading through value decomposition, key expansion and time-aware access. [R53.3, §5]

**What the evidence shows.** [PAPER-REPORTED] Benefits depend on representation, reader and temporal-query model; compact keys alone and erroneous time restrictions can reduce performance. [R53.3, Table 3; Appendix E.4]

**What we infer.** [DERIVED] Ranking must operate inside explicit authority, temporal and permission boundaries, followed by current-state and action-precondition checks.

**What remains unknown.** [NOT-DISCLOSED] These experiments do not certify that source-grounded readout remains correct under concurrent corrections, index lag or unknown future query distributions.

## Failure modes

[DERIVED] False premises can dominate lexical retrieval. Access-based recency can promote repeatedly retrieved mistakes. Approximate search can omit corrections. Temporal parsing can remove needed evidence. Flattened bundles can blend historical and current states. A model can cite the correct record yet execute an action with an obsolete argument; the dispatch precondition check addresses that separate boundary.

## Siblings

[DERIVED] Pure semantic retrieval favors related wording. Entity/slot lookup favors exact state access but requires resolution. Temporal retrieval handles dated questions only with justified time constraints. Full-history prompting avoids candidate omission while increasing exposure and model-use cost. A hybrid must preserve snapshot and permission semantics across these paths.

```figure
{
  "id": "fig-53.11",
  "kind": "compare",
  "title": "Memory access paths preserve different relations",
  "caption": "Hybrid access must keep one snapshot and permission policy across every path.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.10",
  "alt": "Hybrid access must keep one snapshot and permission policy across every path. Comparison of semantic contracts, not a feature ranking.",
  "spec": {
    "axis": "Representation and guarantee boundary",
    "columns": [
      {
        "id": "a",
        "label": "Semantic search"
      },
      {
        "id": "b",
        "label": "Entity / slot lookup"
      },
      {
        "id": "c",
        "label": "Historical query"
      }
    ],
    "rows": [
      {
        "dimension": "Selects",
        "values": {
          "a": "related wording",
          "b": "accepted state key",
          "c": "time-scoped evidence"
        }
      },
      {
        "dimension": "Can miss",
        "values": {
          "a": "correction with different wording",
          "b": "unresolved entity mapping",
          "c": "unknown or uncertain intervals"
        }
      },
      {
        "dimension": "Final guard",
        "values": {
          "a": "source/version resolution",
          "b": "authority and freshness",
          "c": "requested-time interpretation"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage moves from scalar salience ranking to source-preserving search keys and explicit state/premise readout. The unresolved question is how much action consistency can be gained by deterministic state interfaces versus more capable model reasoning. Settling evidence requires matched state visibility, frozen models, independent action labels and interventions on the state interface rather than attention correlations alone.

## Limitations

[DERIVED] Hard eligibility guarantees only the checked predicates. It does not guarantee that the source is correct, the extractor is faithful or the model uses the bundle. Unknown-current can prevent an unsupported action while reducing completion rate; evaluation must report both outcomes.

## Reproducibility

[UNVERIFIED] No retrieval or action run was executed. Required records include index/source snapshots, entity resolution, scoring normalization, temporal parser outputs, permitted partitions, exact context bundles, exclusion reasons and authoritative precondition versions. Proposed checks are in [verification](verification.md).

## References

[DERIVED] [R53.2, Generative Agents v2](https://arxiv.org/html/2304.03442v2), §4.1–4.2; [R53.3, LongMemEval v2](https://arxiv.org/html/2410.10813v2), §5; [R53.5, STALE v1](https://arxiv.org/html/2605.06527v1), Appendix F.3. See [references](references.md).
