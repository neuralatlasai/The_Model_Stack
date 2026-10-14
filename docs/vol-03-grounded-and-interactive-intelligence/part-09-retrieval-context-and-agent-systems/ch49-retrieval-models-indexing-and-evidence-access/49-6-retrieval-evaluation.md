---
id: ms.section.49.6
entity_type: section
title: Retrieval evaluation
volume: 3
part: 9
chapter: 49
section: 49.6
slug: 49-6-retrieval-evaluation
parent: ms.chapter.49
prev_sibling: ms.section.49.5
next_sibling: ms.verification.49
children: []
prerequisites: [ms.chapter.6, ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.18, ms.chapter.48, ms.section.49.5]
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

# 49.6 — Retrieval evaluation


## Scope

[DERIVED] Retrieval evaluation measures ranking and evidence access independently of generation. We define relevance recall, hit rate, ranking quality, evidence coverage, freshness, access leakage, latency and cost. The baseline is a frozen corpus/policy snapshot with independent labels and exact-search diagnostics. Success is a bounded, reproducible retrieval claim; a correct generated answer or favorable answer-only judge score cannot certify the retrieved evidence.

## Why this exists

[DERIVED] A generator can answer from parametric knowledge after retrieval fails, or fail despite receiving sufficient evidence. End-to-end answer scores therefore mix stages. Likewise, an ANN index can recover nearly every exact vector neighbor while the embedding model ranks irrelevant units highly. Parsing, representation, approximation, ranking and evidence sufficiency need distinct evaluation axes.

[PAPER-REPORTED] The original RAG model trains the query encoder and generator through a latent-document marginal likelihood while keeping the document encoder/index fixed [P40, §2.4]. [DERIVED] That training signal rewards useful generation under the model, not an independently labeled evidence-access guarantee. Chapter 50 owns the full RAG probability factorization; this section owns the retrieval diagnostics needed before attributing generation behavior to retrieval.

[DERIVED] Inaccessible and absent evidence expose different errors. Returning restricted content is a policy failure even when it improves answer accuracy. Returning a plausible substitute when the required fact is absent is a sufficiency failure. Evaluation must preserve these cases in its denominator instead of removing difficult queries after observing retrieval outcomes.

## Intuition

[DERIVED] Evaluation asks three nested questions. Did the index approximate the declared embedding metric? Did the ranked results contain independently relevant evidence? Did they jointly cover the facts/relations required by the task at the correct revision and permission boundary? The answers can disagree. One relevant chunk can produce a hit while missing a second required relation; many near-duplicate relevant chunks can inflate apparent coverage.

[DERIVED] Quality and systems metrics should join on the same query and artifact identity. A faster index that returns a different snapshot or silently skips failed queries is a different experiment. Report failures, shortfalls and uncertainty beside latency distributions and accepted-evidence cost.

## Formulation

| Local symbol | Meaning |
|---|---|
| $\mathcal R_q$ | Independently judged relevant eligible units for query $q$ |
| $\mathcal A_k(q)$ | Returned first-k eligible units |
| $g_{qi}\ge0$ | Graded relevance at rank $i$ |
| $r_q$ | Rank of first relevant result, or infinity |
| $\mathcal G_q$ | Independently required evidence facets/atoms |
| $\mathcal T_k(q)$ | Exact top-k vector neighbors under the same metric/policy |
| $n_{\rm eval}$ | Positive integer evaluation-query count |
| $\Delta_q$ | Paired per-query metric difference |

[DERIVED] For $|\mathcal R_q|>0$,

$$
\operatorname{Recall@}k(q)=
\frac{|\mathcal A_k(q)\cap\mathcal R_q|}
{|\mathcal R_q|},
\qquad
\operatorname{Hit@}k(q)=
\mathbf1[\mathcal A_k(q)\cap\mathcal R_q\ne\varnothing].
$$
*(Eq. 49.28)*

A no-relevant-evidence query has undefined set recall, not automatic zero or one. Evaluate its abstention/no-evidence behavior separately while retaining its system cost and failure outcome. DPR's answer-containing top-k accuracy is a hit-style statistic [P39, §2]; it is not this set recall.

[DERIVED] Ranking metrics include

$$
\operatorname{MRR@}k=
\frac1{n_{\rm eval}}
\sum_q\frac{\mathbf1[r_q\le k]}{r_q},
\quad
\operatorname{DCG@}k(q)=
\sum_{i=1}^{k}\frac{2^{g_{qi}}-1}{\log_2(i+1)},
\quad
\operatorname{nDCG@}k(q)=
\frac{\operatorname{DCG@}k(q)}{\operatorname{IDCG@}k(q)}.
$$
*(Eq. 49.29)*

Use zero reciprocal contribution when no relevant result exists within k; missing returned ranks receive zero gain in DCG. nDCG needs an explicit exclusion/convention when ideal gain is zero, with that population reported separately. A different gain function defines a different metric. Document the relevance grades and judgment policy.

[DERIVED] ANN recall compares to an exact vector baseline:

$$
\operatorname{ANNRecall@}k(q)=
\frac{|\mathcal A_k(q)\cap\mathcal T_k(q)|}{k},
\qquad|\mathcal T_k(q)|=k.
$$
*(Eq. 49.30)*

This is defined only at a shared metric/snapshot/eligibility/tie boundary. When fewer than k eligible vectors exist, use their actual count or exclude with a stated reason and report that population separately.

## Mechanism

### Methodology

[DERIVED] Freeze the evaluation tuple: source/corpus revision, parser/chunker, representation, index/training sample, query strategy, ranking policy, authorization and observation boundary. Retain the query's original need rather than only its rewritten string. A pipeline comparison must control the same evidence population and hard constraints; equal generator settings do not equalize retrieval training data or candidate work.

[DERIVED] Independent relevance labels should distinguish topical similarity from evidence useful for the task. Multi-positive annotations need alternate valid sources. Source-level labels and chunk-level labels can disagree after rechunking; preserve a mapping to required source spans/facets rather than treating every overlapping chunk as a new fact. Negative labels need adjudication: unjudged is not necessarily irrelevant.

[DERIVED] Incomplete judgments create a measurement boundary. A novel retriever can return relevant units absent from an older judgment pool and receive a false penalty. Report judgment coverage of returned results and audit high-ranked unjudged candidates with a method independent of the candidate model. Conversely, a benchmark with one known source paper establishes target-source recovery, not exhaustive relevance recall across all semantically valid papers.

[MATHEMATICALLY-DERIVED] Evidence coverage and complete coverage differ. If $\mathcal E(u)$ denotes supported facets and every required facet has equal weight,

$$
\operatorname{Coverage}(q)=
\frac{|\mathcal G_q\cap\bigcup_{u\in\mathcal A_k(q)}\mathcal E(u)|}
{|\mathcal G_q|},
\quad
\operatorname{Complete}(q)=
\mathbf1\left[
\mathcal G_q\subseteq
\bigcup_{u\in\mathcal A_k(q)}\mathcal E(u)
\right].
$$
*(Eq. 49.31)*

The denominator requires $|\mathcal G_q|>0$. A hit can coexist with incomplete coverage. Weighted facets require preregistered weights; an average cannot conceal a missing mandatory constraint.

[DERIVED] Evidence labels should record revision/validity. Freshness is task-dependent: a historical query can require an old authoritative revision; a current query can reject it. Define acceptable source-valid intervals, ingestion lag and policy epoch separately. Access leakage counts unauthorized payloads, snippets, identifiers or sensitive metadata at the declared observation boundary. Aggregate relevance does not compensate for any such violation.

[DERIVED] Diagnose approximation by comparing exact and ANN results on the same embeddings. Diagnose representation using independent relevance labels with exact search where feasible. Diagnose ranking using a fixed candidate set. Diagnose ingestion using source-level retained evidence. These controlled boundaries identify what an intervention can repair. A generation oracle belongs to Chapter 50's stage analysis; it cannot replace retrieval-only labels here.

[PAPER-REPORTED] BEIR's historical evaluation spans nineteen datasets and several task families, uses named model checkpoints and reports nDCG@10 plus recall and efficiency [R49.16, §§3–5]. [DERIVED] Its importance is heterogeneous transfer, including negative results. A collection-wide mean weights datasets by a chosen convention and can hide a severe domain failure. Report domain, language, document-type and query-origin strata alongside the aggregate.

[DERIVED] Distribution shift can enter through corpus updates, new policy filters, changed query vocabulary or learned model revisions. Evaluate a frozen acceptance set separately from threshold/architecture selection. For adaptive query pipelines, retain failed transformations and budget exhaustion; measuring only completed successful actions changes the population. Source-generated synthetic queries can be useful diagnostics but may share lexical/semantic style with the model used to generate them.

[MATHEMATICALLY-DERIVED] For i.i.d. query-level paired differences with finite variance and integer $n_{\rm eval}\ge2$ for the sample-variance standard-error estimate,

$$
\bar\Delta=\frac1{n_{\rm eval}}\sum_q\Delta_q,
\qquad
\widehat{\operatorname{SE}}(\bar\Delta)=
\frac{s_\Delta}{\sqrt{n_{\rm eval}}}.
$$
*(Eq. 49.32)*

[DERIVED] Two queries derived from one paper, repeated templates or multiple chunks from one document can be correlated. Cluster-aware resampling/variance should use the independent source unit; stratified fixed designs need design-aware weighting. Seed variability, query sampling variability and label uncertainty are distinct. A narrow interval from many correlated synthetic queries does not establish broad deployment generalization.

[DERIVED] Latency measurement must name client or server boundary, include query encoding, rewriting, candidate search, payload fetch, reranking and policy checks, and retain cold/warm states. Report offered concurrency/rate, query and document-length distributions, corpus/index sizes, hardware, runtime and cache residency. A p95 among completed searches can hide timeouts; provide failure rate and deadline-qualified goodput separately. On-disk indexes can appear memory-resident after OS caching, so warm repeated queries do not measure cold storage behavior [R49.9, Caching].

[DERIVED] Retrieval cost includes ingestion refresh, representation training/encoding, index builds, replicas/storage, online model calls, search/fetch and retries. At a declared window, define

$$
\operatorname{CostPerAcceptedRetrievalTask}=
\frac{\operatorname{AllAttributedRetrievalCost}}
{\#\{q:\operatorname{EvidenceAndServiceAcceptance}(q)\}},
$$
*(Eq. 49.33)*

when the denominator is nonzero. Preserve failed/no-evidence query costs. Token-price or GPU-hour values are dated inputs; no current purchase recommendation follows from a historical table.


```figure
{
  "id": "fig-49.18",
  "kind": "diagram",
  "title": "Evidence coverage boundary",
  "caption": "Retrieved lists and source revisions feed separate neighbor, relevance, facet, freshness and access checks. Report coverage and complete service cost together; a relevant hit cannot cancel a policy violation.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-49.31",
  "alt": "Frozen corpus and policy leads to Independent query labels leads to Exact and approximate runs leads to Rank and evidence scoring leads to Latency and failure ledger.",
  "spec": {
    "nodes": [
      {
        "id": "n0",
        "label": "Frozen corpus and policy",
        "kind": "process"
      },
      {
        "id": "n1",
        "label": "Independent query labels",
        "kind": "process"
      },
      {
        "id": "n2",
        "label": "Exact and approximate runs",
        "kind": "process"
      },
      {
        "id": "n3",
        "label": "Rank and evidence scoring",
        "kind": "process"
      },
      {
        "id": "n4",
        "label": "Latency and failure ledger",
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

### Algorithm 49.6 — Independent retrieval evaluation with failure retention

[DERIVED] Inputs are finite independently labeled queries, immutable artifact/policy tuple, finite per-query budgets and an exact diagnostic baseline. Output is stratified metrics and a complete failure ledger.

$$
\begin{aligned}
1.\;&\operatorname{FreezeTupleAndValidateLabelProvenance};
\quad\text{selection contamination}\Rightarrow\operatorname{Fail}.\\
2.\;&\text{for }q=1,\ldots,n_{\rm eval}:
\quad\operatorname{RunBoundedPipelineAndRecordAllActions}.\\
3.\;&\operatorname{ResolveReturnedRevisionsAndEligibility};
\quad\text{leakage}\Rightarrow\operatorname{RecordViolationAndRejectClaim}.\\
4.\;&\operatorname{ScoreRankingCoverageFreshness};
\quad\text{zero denominator}\Rightarrow\operatorname{MarkUndefinedAndScoreSeparateTask}.\\
5.\;&\operatorname{CompareExactNeighborsAndRetainTimeoutsShortfalls};
\quad\operatorname{JoinLatencyAndCost}.\\
6.\;&\operatorname{AggregateByDeclaredIndependentUnitsAndStrata};
\quad\operatorname{ReturnMetricsUncertaintyAndGaps}.
\end{aligned}
$$

[DERIVED] A failed query contributes its named outcome and resource use; it is never silently removed. RejectClaim in step 3 marks the hard-policy claim failed while retaining subsequent diagnostic accounting. The finite loop and bounded calls terminate; statistical validity still depends on the sampling/label assumptions.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch is **Model / autograd framework** and Hugging Face Transformers is **Model definition / adaptation** for evaluated representation paths. Faiss, evaluation packages and corpus/policy stores are outside the numbered stack, routed through DPR/RAG and the independent-evaluation requirement. No local benchmark was executed.

[DERIVED] Save per-query ranked IDs, scores and complete action traces rather than only aggregates. An exact baseline must use the same transformed embeddings and eligibility set. Store result count and ties; a padded invalid ID is not a retrieved unit.

## Experimental design

### Reported experiments

[PAPER-REPORTED] BEIR's Table 2 reports TREC-COVID nDCG@10 0.656 BM25, 0.332 DPR and 0.757 BM25+cross-encoder, but Touché-2020 reports 0.367 BM25 versus 0.271 for that reranker. The source specifies checkpoints, neural truncation and candidate boundaries [R49.16, §§4–5]. These are historical transfer results, not 2026 rankings.

[PAPER-REPORTED] A September 2026 study constructs 19,484 synthetic queries from 9,742 source abstracts and retrieves across 463,971 title/abstract/category records. It uses SPECTER2/Chroma for five strategies and ColBERTv2/PLAID for another; generation is Llama-3.1-8B Q4_K_M, judging Qwen2.5-32B Q4_K_M on a GB10 DGX Spark with 128GB unified memory [R49.18, §3]. Its date filter uses metadata last-updated date, not necessarily first publication.

[PAPER-REPORTED] Table 5 reports problem-query Hit@3 46.3% classic, 39.7% rewritten, 47.5% rewritten/reranked, 38.6% fusion and 92.8% ColBERT. The first-stage representations and search engines differ for ColBERT, while reranking increases candidate depth from three to ten [R49.18, §§3.3,4.4]. These controls do not isolate architecture or equalize compute.

## Observations

**What the paper claims.** [PAPER-REPORTED] Heterogeneous and controlled multi-strategy evaluation distinguishes retrieval tradeoffs [R49.16; R49.18].

**What the evidence shows.** [PAPER-REPORTED] The 2026 study's direct source-paper metric finds rewriting/fusion failures. Its judge sees only question and answer, with no retrieved evidence and metric names lacking detailed rubrics [R49.18, §3.4]. Such ratings cannot independently verify source faithfulness.

**What we infer.** [DERIVED] Gold-paper recovery is useful but not exhaustive relevance or enterprise evidence coverage. Different encoder training, approximate indexes, candidate counts and generated-query selection prevent a causal claim that late interaction alone caused the full gap.

**What remains unknown.** [UNVERIFIED] Independent human relevance, deliberate absence, revoked access, freshness and equal-budget local performance remain unmeasured here.

## Failure modes

> **Failure mode — A generation score certifies retrieval.** [DERIVED] *Symptom:* high answer ratings coexist with missing or unauthorized evidence. *Cause:* the evaluator never inspects the source set. *Detection:* score source IDs/facets and policy outcomes independently. *Mitigation:* keep stage-specific denominators and evidence-aware labels.

## Siblings

[DERIVED] Neighbor recall diagnoses the index; relevance recall diagnoses representation/ranking; evidence coverage diagnoses sufficiency; freshness and leakage diagnose validity/access. Latency and cost characterize the same accepted workload rather than replacing those criteria.

## Extensions

### Improvements

[PAPER-REPORTED] The 2026 scientific-corpus study adds paired direct target-paper metrics and unconditional answer means alongside conditional judge scores [R49.18, §§3.5,4.4–4.5]. PureDocBench adds an upstream annotation audit [R49.1, Appendix A]. Neither eliminates independent labeling, sampling or workload-representativeness limitations.

## Limitations

[DERIVED] The central open question is how to estimate complete evidence availability under incomplete judgments and changing policies without an exhaustive oracle. Evidence that could settle a bounded version includes audited alternate-source labels, controlled missing/revoked cases and time-separated corpus updates. More benchmark queries alone cannot resolve a mislabeled target.

## Reproducibility

[UNVERIFIED] Preserve snapshot/policy identities, independent labels, all actions/results, undefined denominators, query clusters, uncertainty procedure, hardware/runtime/cache state and cost attribution. The proposed recall/latency artifact remains unexecuted in [verification](verification.md).


```figure
id: fig-49.19
kind: calculator
title: Evidence coverage boundary instrument
caption: The required facets are independently labeled; defaults are analytical and do not measure a named system.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-49.31
alt: Covered independently labeled facets divided by required facets gives evidence coverage; neighbor recall measures a different target.
states:
  - {anchor: formulation, label: Neighbor, note: Inspect the stated equation domain.}
  - {anchor: mechanism, label: Relevance, note: Costs and correctness have distinct boundaries.}
  - {anchor: failure-modes, label: Evidence, note: No empirical result is generated by the calculator.}
spec:
  tex: '\operatorname{Coverage}=n_{covered}/n_{required}'
  equation: "49.31"
  inputs:
    - {symbol: matched, label: covered evidence facets, default: 2, min: 0, max: 2, format: integer}
    - {symbol: required, label: required facets, default: 3, min: 2, max: 10, format: integer}
  outputs:
    - {symbol: result, label: evidence coverage, formula: "matched/required", format: fixed2}
```

```figure
id: fig-49.20
kind: stat-panel
title: Evidence coverage boundary boundaries
caption: These are mechanism boundaries, not benchmark measurements.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-49.31
alt: Exact metric neighbors, independent relevance labels and complete evidence facets form separate evaluation targets.
spec:
  header: EVIDENCE CONTRACT
  rows:
    - {key: neighbor, value: same metric exact baseline}
    - {key: relevance, value: independent relevance labels}
    - {key: evidence, value: all required facets checked}
```


## References

[P39](references.md#p39), [P40](references.md#p40), [R49.1](references.md#r49-1), [R49.9](references.md#r49-9), [R49.16](references.md#r49-16), [R49.18](references.md#r49-18).
