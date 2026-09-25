---
id: ms.section.15.5
entity_type: section
title: Long context versus retrieval
short_title: Long context versus retrieval
section: 15.5
slug: 15-5-long-context-versus-retrieval
parent: ms.chapter.15
prev_sibling: ms.section.15.4
next_sibling: ms.section.15.6
children: []
prerequisites: [ms.chapter.10, ms.chapter.13, ms.chapter.14, ms.section.15.4]
downstream: [ms.chapter.27, ms.chapter.42, ms.chapter.49]
word_count_target: 1900
volume: 1
part: 3
chapter: 15
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [position_representation, long_context], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P01, P46]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 15.5 — Long context versus retrieval

## Scope

Long context and retrieval are alternative and composable ways to construct the evidence presented to a model. This section compares freshness, provenance, irrelevant-token exposure, update cost, latency, and selection of compositional evidence. It does not duplicate the later retrieval chapter's indexing algorithms. The decision criterion is grounded task quality under a bounded resource budget, evaluated on the same source snapshot and answer requirements.

## Why this exists

**DERIVED.** Supplying a large source collection avoids an explicit retrieval omission only if the required evidence actually fits and survives serialization. It does not establish that the model will use every relevant item correctly. Retrieval reduces the supplied set, but can omit a necessary bridge fact before generation begins.

The resource bottleneck also moves. A large prompt pays for repeated model-side evidence processing unless valid reuse applies. A retrieval system pays for indexing, querying, reranking, and maintenance, followed by model processing of the selected context. Comparing only the generator's token count conceals part of the retrieval cost; comparing only retrieval latency conceals the generator cost.

**PAPER-REPORTED.** The cited RAG-versus-long-context study evaluates both approaches and a hybrid method in its own settings [R15.9]. Its results motivate measuring the complete pipeline. They do not establish a timeless winner for other models, corpora, or prices.

## Intuition

**DERIVED.** The evidence needed for a question is often a set rather than one highly similar passage. A question about a changed policy may require the old policy, the revision notice, and an effective date. Selecting only the passage most similar to the question can produce a convincing but temporally wrong answer.

Long context moves more selection work into the model's attention and reasoning. Retrieval moves some selection into a separate pipeline. Both still require source versioning, conflict handling, and a rule for insufficient evidence. Increasing the context window can reduce one selection pressure without eliminating these obligations.

> **Definition — Compositional evidence coverage.** The event that a constructed context contains every source component required by the declared answer dependency, with sufficient provenance and surrounding information to interpret those components.

## Formulation

**MATHEMATICALLY-DERIVED.** Let \(E_i\) be the event that required component \(i\) is present and usable in the constructed context. For \(k\ge1\), complete coverage is \(E_{\mathrm{all}}=\bigcap_{i=1}^{k}E_i\). Without assuming independent selection errors,

$$
\max\!\left(0,\sum_{i=1}^{k}\Pr(E_i)-(k-1)\right)
\le \Pr(E_{\mathrm{all}})
\le \min_i\Pr(E_i).
$$
*(Eq. 15.14)*

The lower bound follows by applying the union bound to missing components; the upper bound follows because complete coverage implies each individual event. Multiplying marginal recall values is unjustified unless independence is established under the evaluation design.

For answer-correctness event \(A\), the law of total probability gives

$$
\Pr(A)=
\Pr(E_{\mathrm{all}})\Pr(A\mid E_{\mathrm{all}})
+
\Pr(\neg E_{\mathrm{all}})\Pr(A\mid\neg E_{\mathrm{all}}).
$$
*(Eq. 15.15)*

Correct answers without complete context are possible through prior knowledge or chance. A grounded-task scoring rule can require complete support, but that must be declared. Do not silently equate answer accuracy with evidence recall.

For a fixed accounting horizon of \(N>0\) queries, define costs in one consistent unit:

$$
\overline C_{\mathrm{retrieve}}
=\frac{C_{\mathrm{index}}+C_{\mathrm{updates}}}{N}
+\overline C_{\mathrm{search}}
+\overline C_{\mathrm{rerank}}
+\overline C_{\mathrm{generation}},
\qquad
\overline C_{\mathrm{long}}
=\frac{C_{\mathrm{preparation}}}{N}
+\overline C_{\mathrm{generation,long}}.
$$
*(Eq. 15.16)*

These are accounting identities. The terms may represent money or another additive resource, but cannot mix seconds, dollars, and bytes. End-to-end latency additionally depends on overlap and critical paths; it is not generally the sum of amortized costs.

~~~figure
id: fig-15.15
kind: calculator
title: Joint evidence coverage bounds
caption: "Illustrative equal marginal coverage probabilities; the interval requires no independence assumption and contains no measured retrieval result."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-15.14
alt: "With three required components and marginal coverage 0.9 for each, complete coverage lies between 0.7 and 0.9; its exact value is unspecified."
spec:
  tex: \max(0,kr-(k-1))\le P(E_{\mathrm{all}})\le r
  equation: "15.14"
  inputs:
    - {symbol: k, label: required components, default: 3, min: 1, max: 20, format: integer}
    - {symbol: r, label: equal marginal coverage, default: 0.9, min: 0, max: 1, format: fixed2}
  outputs:
    - {symbol: lower, label: lower bound, formula: "max(0,k*r-(k-1))", format: fixed3}
    - {symbol: upper, label: upper bound, formula: r, format: fixed3}
states:
  - {anchor: formulation, label: Three components, variables: {k: 3, r: 0.9}, note: "Marginal quality alone does not determine joint coverage."}
  - {anchor: mechanism, label: One component, variables: {k: 1, r: 0.9}, note: "For one required component the bounds coincide."}
  - {anchor: failure-modes, label: Many required components, variables: {k: 10, r: 0.9}, note: "High marginal coverage can leave a weak guarantee on complete coverage."}
~~~

## Mechanism

**DERIVED.** Compare the two approaches at a common evidence boundary. Freeze an eligible source snapshot, define the question and required support, and record what each context constructor selected. If one method receives fresher documents or cleaner annotations, the comparison measures those differences as well.

Freshness has several timestamps: source publication, ingestion, index update, prompt construction, and answer generation. A current answer cannot be inferred from a recent model identifier. Retrieval can expose newly ingested evidence without changing model weights, but an outdated index remains outdated. A long prompt can include a current document, but a reused prefix can still contain an obsolete version.

Provenance must survive selection and compression. Preserve document identifier, revision, span, and extraction method. A summary's citation to an entire document does not establish that each statement is supported. If an intermediate summary removes the exception that controls the answer, later generation cannot recover it from that summary alone.

Irrelevant tokens have both systems and quality consequences. They increase physical input length and may introduce plausible competitors or instructions embedded in source material. Source content should retain its data role in the prompt contract. Whether a particular distraction changes task quality is an empirical question for the matrix, not a property inferred solely from token count.

~~~figure
id: fig-15.16
kind: diagram
title: Shared evidence boundary for two context constructors
caption: "Both branches begin from the same eligible snapshot and end at the same independent answer-and-support evaluator."
placement: inline
evidence: DERIVED
source: DERIVED:eq-15.15
alt: "A versioned source snapshot feeds either broad-context assembly or retrieval and reranking. Both feed generation, whose answer is checked against required source support."
spec:
  direction: LR
  nodes:
    - {id: source, kind: dataset, label: Versioned eligible source snapshot}
    - {id: broad, kind: process, label: Broad context assembly}
    - {id: retrieval, kind: process, label: Retrieve and rerank}
    - {id: context, kind: tensor, label: Selected serialized evidence}
    - {id: model, kind: model, label: Fixed generator}
    - {id: evaluator, kind: metric, label: Answer and complete support}
    - {id: truth, kind: dependency, label: Required evidence ledger}
  edges:
    - {from: source, to: broad, kind: flow}
    - {from: source, to: retrieval, kind: flow}
    - {from: broad, to: context, kind: flow}
    - {from: retrieval, to: context, kind: flow}
    - {from: context, to: model, kind: flow}
    - {from: model, to: evaluator, kind: flow}
    - {from: truth, to: evaluator, kind: dependency}
~~~

Selection for compositional questions should retain bridge evidence, not merely high-scoring isolated passages. Candidate expansion through explicit references is one possible bounded policy. It must count all added text against the context budget and evaluate whether expansion improves complete coverage. The chapter makes no claim that an arbitrary heuristic solves optimal evidence selection.

Cost comparison requires an actual reuse distribution. An index used for many queries amortizes its preparation differently from a one-off document. A stable long prefix reused across requests may avoid some repeated prefill work, but only when the runtime's cache contract permits it. Cold-start and warm-reuse measurements answer different questions and should be reported separately.

Update experiments should include deletion as well as addition. Removing an ineligible source requires invalidating its index entries, extracted passages, retained summaries, and reusable prompt state where those artifacts contain the removed content. Record the time at which each representation becomes consistent with the new source snapshot. A fast query against partially updated state is not equivalent to a query against the declared snapshot.

## Algorithm

**DERIVED — bounded, auditable context construction.**

~~~text
Algorithm 15.5 — Construct a provenance-preserving evidence context
INPUT: query, versioned eligible corpus, bounded candidate limit,
       input token budget, retrieval or broad-context policy
OUTPUT: serialized evidence ledger or explicit insufficient-evidence status
STATE: candidate records with source versions, spans, costs, and scores
INVARIANT: every retained passage maps to an eligible source revision
1. Obtain a bounded candidate set under the selected policy.
2. Validate source eligibility, revision, and span integrity.
3. Rank candidates with deterministic tie-breaking where ranking is used.
4. Add required linked material under the predeclared expansion policy.
5. Select within the token budget while preserving atomic evidence units.
6. Serialize and retokenize the complete prompt, including metadata.
7. Record selected and excluded candidates with exclusion reasons.
8. Return the context or an explicit inability to satisfy declared requirements.
~~~

For \(n\) bounded candidates, sorting costs \(O(n\log n)\) comparisons plus comparator cost. Do not hide repeated tokenization or model scoring inside a supposedly constant-time comparator. Precompute bounded scalar ranking keys. Selection remains a heuristic unless a separate optimization guarantee is proved.

## Implementation

**DERIVED.** Hugging Face Transformers, **Model definition / adaptation**, provides the generator and tokenizer boundary. PyTorch, **Model / autograd framework**, supports controlled scoring or generator evaluation. NVIDIA Megatron-Core, **Distributed training**, supplies relevant checkpoint-training provenance; it is not an evidence index. This section does not attribute retrieval-service functionality to these systems.

Keep the context constructor independently versioned from the generator. Cache keys should include source revisions and serialization policy where applicable. Retain raw extraction artifacts for structured tables, code, and multimodal sources, because a retrieval hit can point to a passage whose extraction lost the decisive relationship.

**OFFICIAL-DOCUMENTATION.** Hugging Face Transformers documents cache strategies and prefix reuse examples [R15.13]. **DERIVED.** Their availability is not a measured cache-hit rate for the workload. Evaluate reuse validity and cost using the deployment contract in [Section 15.6](15-6-deployment-consequences.md).

## Experimental design

**PROPOSAL — no comparative quality or cost result is asserted.**

### Experiment 15.5 — Retrieval, broad context, and hybrid evidence selection

- **Hypothesis:** The preferable context constructor depends on complete evidence coverage, corpus freshness, and amortized workload cost.
- **Setup:** Run all policies against identical questions and source snapshots with a fixed generator.
- **Independent variables:** Selection policy, token budget, source update rate, required-fact count, and query reuse pattern.
- **Controlled variables:** Source eligibility, answer criteria, model revision, decoding budget, and evaluator.
- **Dataset/workload:** Single-source questions, cross-document joins, revision-sensitive questions, and insufficient-evidence cases.
- **Hardware:** Record generator and retrieval infrastructure, precision, runtime versions, concurrency, and cold/warm boundaries.
- **Metrics:** Complete coverage, supported answer success, freshness errors, latency distribution, total resource cost, and update work.
- **Baselines:** Evidence-only oracle context for diagnosis, broad eligible context, bounded retrieval, and a predeclared hybrid.
- **Expected result:** The measured frontier may vary across task cells; no universal ordering is assumed.
- **Ablation:** Remove reranking, linked-evidence expansion, or prefix reuse independently.
- **Interpretation:** Diagnose selection failure separately from generation failure given complete evidence.
- **Threats to validity:** Oracle annotations leaking into selection, unequal source freshness, incomplete cost accounting, and workload-specific reuse.

## Observations

**What the paper claims — PAPER-REPORTED.** The comparative study investigates RAG, long context, and hybrid routing within its selected tasks and models [R15.9].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Marginal evidence coverage does not determine complete coverage, and answer correctness need not imply complete support.

**What we infer — DERIVED.** A deployment comparison should report both the selected evidence set and the complete pipeline cost.

**What remains unknown — UNVERIFIED.** Current workload-specific quality, latency, update cost, and monetary trade-offs require measurement.

## Failure modes

**DERIVED.** Failures include obsolete cached prefixes, missing bridge facts, duplicated evidence mistaken for independent corroboration, and citations that identify a document without supporting the claim.

~~~figure
id: fig-15.17
kind: stat-panel
title: Evidence-selection failure boundaries
caption: "These diagnostics distinguish absent evidence from incorrect use and stale-source errors."
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-15.15
alt: "Inspect eligibility, complete coverage, source freshness, and claim support before attributing failure to the model alone."
spec:
  header: Audit sequence
  rows:
    - {key: Eligibility, value: "Source belongs to the allowed snapshot"}
    - {key: Coverage, value: "All required components survived"}
    - {key: Freshness, value: "The applicable revision is present"}
    - {key: Support, value: "Sufficient evidence for each claim"}
~~~

## Siblings

**DERIVED.** Retrieval, broad context, and iterative evidence acquisition differ in where selection occurs and when additional cost is paid. Summarization changes the evidence representation; it does not guarantee preservation of all answer-relevant details.

## Extensions

**DERIVED.** Repository questions may require definitions, callers, and configuration from different files. Video questions may require separated intervals. The coverage ledger should encode these relationships directly instead of treating every passage as an independent substitute.

## Limitations

**DERIVED.** Exact required-evidence sets are often unavailable for natural questions. Use expert annotation with adjudication and retain ambiguity rather than presenting an incomplete annotation as ground truth. The cost identity does not predict prices or latency.

## Reproducibility

Archive source snapshots, timestamps, index and extraction versions, selection settings, candidate ledgers, prompt serialization, cache policy, raw answers, support annotations, and the accounting horizon. Report excluded infrastructure costs explicitly.

## References

[R15.9](references.md#r159); [R15.13](references.md#r1513).
