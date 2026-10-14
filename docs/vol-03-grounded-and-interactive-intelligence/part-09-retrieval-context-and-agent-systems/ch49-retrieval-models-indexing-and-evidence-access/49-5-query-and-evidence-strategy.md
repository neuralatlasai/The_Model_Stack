---
id: ms.section.49.5
entity_type: section
title: Query and evidence strategy
volume: 3
part: 9
chapter: 49
section: 49.5
slug: 49-5-query-and-evidence-strategy
parent: ms.chapter.49
prev_sibling: ms.section.49.4
next_sibling: ms.section.49.6
children: []
prerequisites: [ms.chapter.6, ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.18, ms.chapter.48, ms.section.49.4]
downstream: [ms.chapter.50, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.55, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, serving], mechanism: [evidence_access], feedback_setting: [], modality: [text, image]}
papers: [P39, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 49.5 — Query and evidence strategy


## Scope

[DERIVED] Query and evidence strategy decides which retrieval actions to perform while preserving the original information need and hard constraints. We cover rewriting, decomposition, multi-hop retrieval, temporal filters, structured queries and relational/graph access. The baseline is one query against a fixed corpus snapshot. Success is additional valid evidence at bounded cost, not a more fluent query or a plausible generated hypothesis.

## Why this exists

[DERIVED] A short user request can omit domain vocabulary, refer to an unresolved entity or require evidence distributed across sources. One query may retrieve a useful starting point but miss the relation needed for the next step. Conversely, rewriting can remove the exact technical term, negation or date that distinguishes the intended evidence. Additional search is therefore an intervention with both opportunity and failure modes.

[PAPER-REPORTED] IRCoT interleaves retrieval with generated reasoning sentences rather than relying on the original question alone [R49.14, §3]. [DERIVED] Its lesson is a dependency between acquired evidence and subsequent search, not a guarantee that generated reasoning is correct. An incorrect intermediate entity can send every later action toward a coherent but irrelevant neighborhood.

[DERIVED] Structured evidence exposes another limitation of unstructured similarity. A query asking for all records satisfying a date and relational condition requires completeness and schema semantics. A top-k nearest-neighbor result does not implement an exhaustive join or aggregate. Query planning must distinguish finding promising evidence from executing a logically complete data operation.

## Intuition

[DERIVED] Preserve two objects: the immutable information need and an evolving retrieval hypothesis. The need includes entities, time, scope and permissions. A hypothesis proposes vocabulary, subquestions or graph paths that may help find evidence. The hypothesis can be revised when observations disagree, while the original constraints remain authoritative unless the user changes them.

[DERIVED] Independent rewrites offer breadth and can run in parallel. Multi-hop retrieval has sequential dependencies: a later query may require an entity or relation obtained earlier. Relational/graph execution can exploit explicit structure when the source is authoritative, but extracted structures retain their extraction uncertainty. A graph edge is not automatically a verified fact.

## Formulation

| Local symbol | Meaning |
|---|---|
| $q_0,\mathcal H_q$ | Original query and hard query constraints |
| $q_j,\mathcal U_j$ | Retrieval action query and collected evidence after step $j$ |
| $h_{\max},k_{\rm step}$ | Finite retrieval-step and per-step hit caps |
| $g(q_0)$ | Generated hypothetical document distribution |
| $f(u)$ | Fixed document embedding function |
| $t_{\rm valid},t_{\rm ingest}$ | Source-valid time and ingestion/availability time |
| $\mathcal R_1,\mathcal R_2$ | Authoritative relations with declared schemas |
| $\mathcal G_v=(\mathcal V_g,\mathcal E_g)$ | Versioned graph and its provenance-bearing edges |

[DERIVED] A query transformation produces a candidate action under preserved constraints:

$$
q_j=\operatorname{Transform}
(q_0,\mathcal U_{j-1},\mathcal H_q),
\qquad
\mathcal A_j\subseteq\mathcal C_{v,p,t}.
$$
*(Eq. 49.23)*

The subset condition is enforced by execution, not by trusting generated text to remember access restrictions.

[PAPER-REPORTED] HyDE estimates a query representation by encoding sampled hypothetical documents [R49.13, §3, Eqs. 5–8]. An adapted finite estimator is

$$
\hat e_q=\frac1{n_h}\sum_{j=1}^{n_h}f(\hat u_j),
\quad \hat u_j\sim g(q_0),\quad n_h\ge1.
$$
*(Eq. 49.24)*

[DERIVED] This average is not necessarily unit length; normalization changes the metric contract. Generated hypotheses are query aids and must never be inserted into the evidence set as if they were retrieved sources.

[MATHEMATICALLY-DERIVED] With at most $h_{\max}$ calls returning at most $k_{\rm step}$ hits each,

$$
|\mathcal U_{\rm final}|
\le h_{\max}k_{\rm step}
$$
*(Eq. 49.25)*

before any additional parent expansion. Deduplication can reduce the count. The bound says nothing about relevance, evidence completeness or task success.

## Mechanism

### Methodology

[DERIVED] Rewriting should retain the original query and record the transformation. Preserve named entities, identifiers, units, negations and temporal qualifiers as independently checked constraints where possible. A rewrite that adds synonyms can still broaden a comparison into a different task. Search both original and rewritten forms only under a finite action budget, and preserve branch provenance so additional coverage can be attributed rather than assumed.

[PAPER-REPORTED] HyDE generates hypothetical relevant text with an instruction-following model, then searches real documents in an unsupervised encoder's space [R49.13, §§3–4]. [DERIVED] The generated detail may improve vocabulary alignment or steer toward hallucinated attributes. A dense bottleneck is not a theorem that removes false facts. Retrieving a real document similar to a hypothesis does not establish that every hypothesis claim is supported.

[DERIVED] Decomposition represents a compound need as subneeds plus dependency constraints. Independent facets can be searched concurrently; dependent facets wait for grounding. Preserve whether the user requested conjunction, disjunction, comparison, exhaustive enumeration or one example. Splitting “companies satisfying A and B” into separate top-k searches and concatenating results does not compute the intersection. Similarly, retrieving two papers about related concepts does not establish a relation between their claims.

[DERIVED] Multi-hop retrieval maintains an evidence ledger of source-resolved entities/relations and the reason for each next action. A bounded search step can retrieve, validate provenance/constraints, update the ledger and select another query. Generated intermediate statements should retain confidence/source status and be revisable. Stop conditions include sufficient independently defined evidence, no new admissible evidence, budget exhaustion and unsupported need. “The model produced an answer” is not an independent retrieval sufficiency test.

[PAPER-REPORTED] IRCoT uses the last generated reasoning sentence as the next query, collects paragraphs and terminates on a textual answer marker or step cap; its experiment caps reasoning steps at eight and retained paragraphs at fifteen [R49.14, §3.1]. [DERIVED] Those are disclosed controller choices rather than semantic proof of completion. A sentence can mention a plausible but unsupported entity, and a textual marker can appear before all required evidence has been acquired.

[MATHEMATICALLY-DERIVED] For a chain of required successful retrieval/validation events $E_1,\ldots,E_h$,

$$
\Pr\left(\bigcap_{j=1}^hE_j\right)=
\Pr(E_1)
\prod_{j=2}^h
\Pr(E_j\mid E_1,\ldots,E_{j-1}).
$$
*(Eq. 49.26)*

The displayed conditional factors require positive-probability conditioning prefixes. If a prefix has probability zero, the joint probability is zero without evaluating undefined subsequent conditionals. No independence is required. Equal per-hop marginal recall cannot be multiplied unless it represents the needed conditional probabilities. Errors can become more likely after a wrong intermediate query, while a redundant alternative path can reduce dependence on one hop.

[DERIVED] Temporal filtering requires a declared time interpretation. “As of” can mean knowledge available at a historical time, a fact valid at that time, or the latest ingested revision today. Store source-valid intervals separately from ingestion timestamps. A recently ingested old document is not fresh evidence about current conditions. Date parsing and inferred event dates have uncertainty; unresolved time requirements should produce a named ambiguity rather than an arbitrary filter.

[DERIVED] Structured query construction should emit a typed plan, not unrestricted generated SQL. Validate schema, allowed tables/columns, joins, predicates, aggregation and resource limits. Bind values as parameters; constrain read-only access and row policy at execution. Numeric/date comparisons belong to typed operators with units and null semantics. A similarity score cannot replace equality, ordering or membership when the task requires those exact conditions.

[OFFICIAL-DOCUMENTATION] PostgreSQL specifies joins, WHERE and grouping as distinct table transformations, including outer-join/null effects; row security has explicit role/owner bypass behavior [R49.20, §§7.2,5.9]. [DERIVED] Thus a valid query string under a privileged connection can still violate the intended access contract. Execution identity and permitted schema are part of the retrieval plan.

[MATHEMATICALLY-DERIVED] For a keyed inner join with predicate $\phi$ and eligibility predicates $A_1,A_2$, a relational evidence result is

$$
\mathcal J=
\sigma_{\phi\land A_1\land A_2}
\left(\mathcal R_1
\Join_{\mathcal R_1.k=\mathcal R_2.k}\mathcal R_2\right).
$$
*(Eq. 49.27)*

[DERIVED] The expression defines selection under a declared relational model. Duplicate keys can multiply rows; SQL bag semantics, nulls and aggregation require explicit treatment. A complete result depends on complete source relations, valid keys, snapshot consistency and authorization. Correct execution of the modeled relation does not prove that the source database reflects the world.

[DERIVED] Graph retrieval can follow explicit typed relations, retrieve neighborhoods or exploit communities. Edge direction/type and path length matter. Entity resolution errors can merge distinct people or split one organization across aliases. Every extracted edge should retain supporting spans and extraction identity; a path of unsupported edges is not stronger evidence because it is connected. Bounded traversal can omit a necessary path, while unconstrained expansion can exhaust memory and disclose inaccessible neighbors.

[PAPER-REPORTED] GraphRAG extracts entities/relations, clusters an LLM-derived graph hierarchically and summarizes communities for global sensemaking queries [R49.15, §3.1]. [DERIVED] That workflow targets broad corpus summaries rather than a general exact relational query engine. Community reports can summarize relevant themes but hide counterexamples and source-level qualifiers. Hard permissions must constrain source contributions to summaries; filtering only a final report's title cannot undo restricted information already incorporated into its text.

[DERIVED] Resource accounting must distinguish parallel breadth and serial depth. With per-call latency $t_j$, fully dependent actions accumulate approximately $\sum_jt_j$ plus validation/coordination; independent actions can overlap but still consume aggregate work. Hypothesis generation adds model tokens/latency before search. Relational joins can produce quadratic output in unconstrained Cartesian cases; graph neighborhoods can grow exponentially with depth before deduplication. Finite row, edge, token and call caps provide operational bounds, while explicit exhaustion preserves the distinction between incomplete search and absence of evidence.


```figure
{
  "id": "fig-49.15",
  "kind": "diagram",
  "title": "Sequential evidence budget",
  "caption": "The original need and policy persist across a bounded retrieval feedback loop. Generated hypotheses guide searches; only source-validated observations contribute evidence, and exhaustion returns incomplete coverage.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-49.25",
  "alt": "Original need and policy leads to Query or structured plan leads to Retrieve and validate leads to Evidence state leads to Stop or bounded next step.",
  "spec": {
    "nodes": [
      {
        "id": "n0",
        "label": "Original need and policy",
        "kind": "process"
      },
      {
        "id": "n1",
        "label": "Query or structured plan",
        "kind": "process"
      },
      {
        "id": "n2",
        "label": "Retrieve and validate",
        "kind": "process"
      },
      {
        "id": "n3",
        "label": "Evidence state",
        "kind": "process"
      },
      {
        "id": "n4",
        "label": "Stop or bounded next step",
        "kind": "state"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2"
      },
      {
        "from": "n2",
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4"
      }
    ]
  }
}
```


## Algorithm

### Algorithm 49.5 — Bounded evidence acquisition under immutable constraints

[DERIVED] Inputs are original need/policy, finite action/token/row budgets and corpus snapshot. Initialize $\mathcal U_0=\varnothing$, $j=0$. Output is a provenance-bearing evidence set with sufficient/incomplete/no-evidence status. Fail terminates and returns diagnostic accounting.

$$
\begin{aligned}
1.\;&\operatorname{ValidateNeedPolicyAndSchema};
\quad\text{unresolved hard constraint}\Rightarrow\operatorname{Fail}.\\
2.\;&j=h_{\max}\text{ or budget exhausted}
\Rightarrow\operatorname{ReturnIncomplete}(\mathcal U_j).\\
3.\;&q_{j+1}\leftarrow\operatorname{ChooseRewriteSubneedOrTypedPlan};
\quad\text{constraint change}\Rightarrow\operatorname{RejectActionAndReturnIncomplete}.\\
4.\;&j\leftarrow j+1;\quad\operatorname{ReserveAttemptBudgetBeforeDispatch};
\quad\mathcal A_j\leftarrow\operatorname{BoundedAuthorizedExecute};\\
&\text{failure/timeout}\Rightarrow\operatorname{RecordAndReturnIncomplete}
(\mathcal U_{j-1});\quad\text{partial result}\Rightarrow\operatorname{MarkPartial}.\\
5.\;&\mathcal U_j\leftarrow\operatorname{DeduplicateAndValidateProvenance}
(\mathcal U_{j-1}\cup\mathcal A_j).\\
6.\;&\operatorname{IndependentEvidenceCriterionMet}
\Rightarrow\operatorname{ReturnSufficient};\\
&\text{no admissible progress}\Rightarrow\operatorname{ReturnIncomplete};
\quad\text{otherwise return to 2}.
\end{aligned}
$$

[DERIVED] A hypothesis remains outside $\mathcal U_j$. Failed/timed-out dispatched calls consume the reserved attempt; partial results enter step 5 only with explicit partial status and validated source IDs. Every terminal state reports spent calls/rows/tokens. The finite loop guarantees termination under bounded call timeouts, not successful retrieval or a correct answer. Chapter 52 owns broader adaptive agent control and recovery.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch is **Model / autograd framework** and Hugging Face Transformers is **Model definition / adaptation** upstream of representation/query models. HyDE/IRCoT/GraphRAG, PostgreSQL and search engines are outside the numbered stack, justified by the plan's query/evidence row and DPR/RAG anchors. No generated query or graph pipeline was executed.

[DERIVED] Preserve typed plan and executed plan separately. Record filter pushdown, selected index, transaction/snapshot and returned source IDs. Cache keys include original constraints and policy identity; a cached public query plan cannot silently reuse a private evidence result.

## Experimental design

### Reported experiments

[PAPER-REPORTED] HyDE evaluates historical InstructGPT text-davinci-003 at temperature 0.7 with Contriever/mContriever on TREC DL, BEIR subsets and multilingual tasks. Table 1 reports DL19 nDCG@10 61.3 versus Contriever 44.5; Table 2 includes a TREC-COVID comparison slightly below BM25 [R49.13, §4]. No universal improvement follows.

[PAPER-REPORTED] IRCoT uses four multi-step QA datasets, 100 tuning and 500 test questions each, and three demonstration samples. Its fixed maximum fifteen-paragraph evidence budget is a set-recall comparison, not ordinary ranked Recall@15 [R49.14, §4]. GPT3 retrieval improves IIRC by 21.2 points while downstream QA does not improve [§5].

[PAPER-REPORTED] GraphRAG evaluates two corpora with 125 generated global questions each and five repeated LLM comparisons. It reports comprehensiveness wins of 72–83% for global approaches versus vector RAG on podcast transcripts [R49.15, §§3–5]. These are judged sensemaking comparisons, not source-level recall.

## Observations

**What the paper claims.** [PAPER-REPORTED] Query/hypothesis expansion and iterative/graph strategies improve their specified evidence or sensemaking tasks [R49.13–15].

**What the evidence shows.** [PAPER-REPORTED] Gains depend on task and metric; IRCoT's improved retrieval without improved IIRC answer performance explicitly separates stages.

**What we infer.** [DERIVED] More search can acquire useful evidence while still failing generation, and fluent summaries can score well without certifying exhaustive evidence. A strategy must be evaluated at its owning boundary.

**What remains unknown.** [UNVERIFIED] Local temporal correctness, graph-edge provenance, relational completeness and access leakage have not been tested.

## Failure modes

> **Failure mode — Hypothesis promoted into evidence.** [DERIVED] *Symptom:* an invented entity or relation becomes the basis of later retrieval and the final answer. *Cause:* generated query text entered the evidence ledger. *Detection:* resolve every evidence atom to an authorized source. *Mitigation:* retain hypotheses separately and validate intermediate entities.

## Siblings

[DERIVED] Rewriting changes the search expression; decomposition changes the evidence plan; multi-hop search conditions later actions on observations; relational execution uses typed predicates; graph/community retrieval exploits represented links. Their success criteria differ and cannot be collapsed into one “agentic retrieval” label.

## Extensions

### Improvements

[PAPER-REPORTED] A September 2026 controlled scientific-corpus study compares rewriting, reranking, RRF, single-step tool access and late interaction, with common generator and direct gold-paper metrics [R49.18, §§3–4]. Its negative rewriting/fusion results are examined in §49.6. It changes the evaluation control boundary, not the universal preferred strategy.

## Limitations

[DERIVED] A research question is how to detect that additional retrieval has diminishing evidential value without confusing missing corpus evidence with failed search. Decisive evidence needs deliberately absent facts, alternative valid paths, time constraints and independent sufficiency labels. Model confidence alone cannot settle it.

## Reproducibility

[UNVERIFIED] Preserve original/transformed queries, prompts, model revisions, hypotheses, filters, typed/executed plans, graph extraction/summaries, source snapshots, intermediate provenance and every exhaustion state.


```figure
id: fig-49.16
kind: calculator
title: Sequential evidence budget instrument
caption: This bounds raw hit slots before deduplication, not distinct relevant evidence or task success.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-49.25
alt: Finite retrieval-step and per-step-hit caps bound raw hit slots before deduplication.
states:
  - {anchor: formulation, label: Rewrite, note: Inspect the stated equation domain.}
  - {anchor: mechanism, label: Multi-hop, note: Costs and correctness have distinct boundaries.}
  - {anchor: failure-modes, label: Structured, note: No empirical result is generated by the calculator.}
spec:
  tex: 'n_{hits}\le h_{\max}k_{\rm step}'
  equation: "49.25"
  inputs:
    - {symbol: hops, label: finite retrieval steps, default: 8, min: 1, max: 16, format: integer}
    - {symbol: hits, label: hits per step, default: 4, min: 1, max: 20, format: integer}
  outputs:
    - {symbol: result, label: raw hit slots, formula: "hops*hits", format: integer}
```

```figure
id: fig-49.17
kind: stat-panel
title: Sequential evidence budget boundaries
caption: These are mechanism boundaries, not benchmark measurements.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-49.25
alt: Original constraints, grounded intermediate entities and validated schema authority constrain evidence strategy.
spec:
  header: EVIDENCE CONTRACT
  rows:
    - {key: rewrite, value: preserve original constraints}
    - {key: multihop, value: ground each new entity}
    - {key: structured, value: validate schema and authority}
```


## References

[R49.13](references.md#r49-13), [R49.14](references.md#r49-14), [R49.15](references.md#r49-15), [R49.18](references.md#r49-18), [R49.20](references.md#r49-20).
