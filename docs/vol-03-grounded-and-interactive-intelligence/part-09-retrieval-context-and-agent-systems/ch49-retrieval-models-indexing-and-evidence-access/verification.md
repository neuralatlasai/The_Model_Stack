---
id: ms.verification.49
entity_type: verification
title: Chapter 49 verification and topic audit
volume: 3
part: 9
chapter: 49
section: null
slug: verification
parent: ms.chapter.49
prev_sibling: ms.section.49.6
next_sibling: ms.references.49
children: []
prerequisites: [ms.chapter.6, ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.18, ms.chapter.48]
downstream: [ms.chapter.50, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.55, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, serving], mechanism: [evidence_access], feedback_setting: [], modality: [text, image]}
papers: [P39, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: open, disputed: false}
evidence_summary: {labels_used: [ASSUMED, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2600
updated_at: 2026-10-14
editorial_status: manuscript_draft
---


# Chapter 49 — Verification and topic-completeness audit

## Artifact specification

[KNOWN] The planned artifact is **a versioned retrieval pipeline and recall/latency evaluation**. Records below are proposed and unexecuted.

| Proposed record | Required fields |
|---|---|
| sources.jsonl | Logical source, revision/hash, media type, source-valid/ingestion times, original location, ownership/access policy reference and retention |
| units.jsonl | Stable/revision keys, faithful/search views, spans/pages/cells/symbols, structure parents, parser/chunk policy, inherited context, rejected/quarantined status |
| representations.json | Model/tokenizer revisions, query/document instructions, pooling, dimension, normalization, dtype, training/negative/teacher data and losses |
| index-manifest.json | Corpus/vector hash, metric/ties, index/source commit, centroids/codebooks/graph, training sample/seed, packed layout, direct maps and tombstones |
| policy-snapshots.jsonl | Principal/role, hard filters, policy epoch, permitted source revisions, cache/expansion rules and revocation time |
| queries.jsonl | Original need, source/cluster identity, relevance/facet labels, valid time, absence/access case, split assignment and label provenance |
| actions.jsonl | Original/transformed query, hypothesis/typed plan, branch/hop, attempted budget, runtime outcome, returned IDs and provenance |
| rankings.jsonl | Raw branch ranks/scores, candidate union, fusion normalization/weights, reranker inputs, final ranks, result count and eligibility |
| exact-diagnostics.jsonl | Exact eligible vector top-k, ANN visited/candidate/refined sets, codec errors, omission/ordering/identity diagnosis |
| results.csv | Recall/hit/MRR/nDCG/coverage/complete evidence, freshness/leakage, undefined denominators, latency/failure/cost and strata |
| update-replay.jsonl | Insert/update/delete/revoke event, replica/index/policy epochs, query visibility, cache invalidation and physical-compaction status |
| decision.md | Accepted/rejected claims, confidence method, workload boundary, unresolved evidence and prohibited extrapolations |

[DERIVED] Every result joins query identity, evidence revision and deployed tuple. Physical index IDs alone cannot resolve source changes or policy. A model/index configuration without the original offered query population cannot establish failure-aware latency or recall.

## Verification task

### Experiment 49.1 — Source retention, deliberately missing evidence and access isolation

**Hypothesis.** [ASSUMED] Ingestion retains independently required source relations, and retrieval never returns inaccessible evidence while distinguishing absence from unsuccessful search.

**Setup.** [ASSUMED] Pin a finite corpus with prose, tables, code and scanned pages, retaining authoritative source bytes and policy. Construct labels from source-level facts/relations before indexing; separate parser/chunk selection from acceptance sources.

**Independent variables.** [ASSUMED] Parser/chunk policy, overlap, parent expansion, content duplication across policy scopes, source degradation, missing required evidence and revoked access.

**Controlled variables.** [ASSUMED] Source revisions, query needs, authorization population, encoder/index/ranker, finite token/call caps and label rubric. A policy-restricted query is not relabeled as public after a retrieval failure.

**Dataset/workload.** [ASSUMED] Independent document families with facts requiring headers, units, qualifiers or code revision context; deliberately removed evidence; inaccessible copies of otherwise relevant documents; historical/current validity cases.

**Hardware.** [ASSUMED] Record parser/model runtime and CPU/GPU/storage identity before execution. Equipment remains unresolved.

**Metrics.** [ASSUMED] Required-source-atom retention, provenance resolution, parser structural errors, retrieval coverage/complete coverage, forbidden snippets/IDs/metadata, no-evidence behavior and per-case resource use.

**Baselines.** [ASSUMED] Fixed windows with explicit inherited titles, structure-aware units and deferred parent expansion under the same total evidence budget. An unsafe public/private union is unnecessary.

**Expected result.** [ASSUMED] Authorized retained evidence should resolve to source spans; missing evidence and unsuccessful bounded search should remain distinguishable. No universal parser-retention improvement is presumed.

**Ablation.** [ASSUMED] Hold representation fixed while changing parsing/segmentation; hold chunk policy fixed while changing normalization; isolate parent expansion and policy-cache invalidation.

**Interpretation.** [ASSUMED] Localize lost source relations before attributing an answer failure to the retriever; an inaccessible source is not a permitted recall target.

**Threats to validity.** [ASSUMED] Annotation omissions, OCR/source-quality shift, source-family dependence and incomplete access-copy inventories can make apparent completeness misleading.

**Acceptance criteria.** [ASSUMED] Zero returned unauthorized evidence at the declared boundary; every returned unit resolves to its immutable source spans/revision; absence and budget exhaustion have distinguishable outcomes. Retention/coverage thresholds are preregistered by required evidence type.

**Rejection condition.** [ASSUMED] A source relation silently lost but represented as complete, an unresolved citation, restricted data returned through expansion/cache, or missing evidence promoted from a generated hypothesis rejects the corresponding contract.

**Reproducibility.** [ASSUMED] Retain originals, parsing outputs, labels, policy epochs, all rejected pages/queries and source maps. Repeated views of one page are clustered, not treated as independent source samples.

### Experiment 49.2 — Representation, ANN and codec error decomposition

**Hypothesis.** [ASSUMED] A claimed recall/latency improvement survives comparison at a shared embedding, eligible corpus and numeric boundary, and its error source can be localized.

**Setup.** [ASSUMED] Pin one embedding tuple and independently labeled acceptance queries. Establish exact eligible search first. Evaluate Flat, HNSW, IVF-Flat and IVF-PQ only where supported by the selected source/runtime.

**Independent variables.** [ASSUMED] Graph construction/query exploration, IVF list/probe counts, PQ subspaces/bits, exact refinement, filter selectivity, cold/warm residency and update/tombstone fraction.

**Controlled variables.** [ASSUMED] Vector bytes, query embeddings, metric/ties, source snapshot, policy, CPU/GPU/thread configuration, client concurrency and finite deadline. Different encoders are a separate representation comparison.

**Dataset/workload.** [ASSUMED] Finite held-out queries spanning dense/sparse embedding regions, near-tie neighbors, highly selective eligibility and long/short source units. Training samples for centroids/codebooks are disjoint from index-parameter acceptance selection.

**Hardware.** [ASSUMED] Record processor/device, memory, storage, driver/runtime, thread placement and available memory. On-disk cold tests disclose OS cache state; no unspecified page-cache reset is claimed.

**Metrics.** [ASSUMED] Exact-neighbor intersection, independent relevance/facet metrics, visited/scanned counts, reconstruction/rank error, packed codes and total memory, query latency/failures, index-build/update time and complete lifecycle cost.

**Baselines.** [ASSUMED] Exact uncompressed eligible scan; IVF-Flat exhaustive all-list scan without code caps; compressed exhaustive scan; non-exhaustive full-vector search. These isolate codec and exploration effects.

**Expected result.** [ASSUMED] Exact-reference comparisons should expose candidate omission, score approximation and filter/staleness effects separately; no particular ANN setting is presumed optimal.

**Ablation.** [ASSUMED] Same candidates with exact versus approximate scoring; same codes with wider exploration; same query/filter sets with different index settings; representation changes only after the infrastructure comparison.

**Interpretation.** [ASSUMED] Compare recall and latency at the same eligible corpus and scoring boundary. A gain caused by a new encoder is not an isolated index improvement.

**Threats to validity.** [ASSUMED] Tie/numeric conventions, warm-cache effects, query-distribution mismatch and incomplete eligible-ground-truth construction can confound error attribution.

**Acceptance criteria.** [ASSUMED] Exact diagnostic identities agree within the declared numeric/tie convention; each approximate shortfall has omission/codec/filter/staleness classification. Recall/latency/cost thresholds and memory budget are selected before acceptance runs.

**Rejection condition.** [ASSUMED] A claimed ANN benefit disappears under the shared tuple, uses a changed corpus/metric, excludes failures, or relies on unavailable future capacity/index state. Any stale/revoked payload invalidates the access claim even if vector recall is high.

**Reproducibility.** [ASSUMED] Preserve insertion order, seeds, training vectors, codebooks, graph/list state, source commit, raw measurements and exact outputs. A static source inspection is not a replacement for this experiment.

### Experiment 49.3 — Budget-matched ranking and evidence strategy under updates

**Hypothesis.** [ASSUMED] Fusion/reranking or multi-step evidence acquisition improves independent evidence outcomes under equal declared online budgets and remains correct across snapshot/policy updates.

**Setup.** [ASSUMED] Freeze a common candidate/corpus boundary and separate ranking from candidate generation. Compare original-query retrieval, finite rewrites, finite decomposition/multi-hop and typed structured access where the source supports it. Pin models, prompts, tables/graph extraction and query plans.

**Independent variables.** [ASSUMED] Candidate breadth, normalization/RRF parameters, cross-encoder/late interaction, original-plus-rewrite branches, finite hop count, temporal predicates and update/revocation timing.

**Controlled variables.** [ASSUMED] Original query need, authorization, source snapshot, evidence token budget, model-call/compute allowance, deadline and independent evaluator. If budgets cannot be matched exactly, report a frontier rather than one superiority number.

**Dataset/workload.** [ASSUMED] Held-out query families with exact identifiers, paraphrases, conjunctions, comparisons, multi-hop alternatives, missing required relations and conflicting/old revisions. Queries derived from the same source form a cluster.

**Hardware.** [ASSUMED] Record query generation/encoding, search, reranking and fetch resources separately, including transfers and retained state.

**Metrics.** [ASSUMED] Candidate-union coverage, ranking metrics, complete required evidence, policy/freshness violations, wasted calls, elapsed latency, actual processed tokens/rows/edges and accepted-retrieval cost.

**Baselines.** [ASSUMED] Legal fixed original-query retrieval, legal sparse/dense branches, unweighted RRF, fixed-candidate reranking and fixed workflow for known structured needs. Generation answers are excluded from the retrieval score.

**Expected result.** [ASSUMED] Permitted strategies should terminate within all-attempt budgets and preserve policy/source provenance. A quality improvement must survive the preregistered matched comparison.

**Ablation.** [ASSUMED] Preserve original query versus rewrite-only; equal first-stage candidate count; fixed encoder versus changed encoder; no teacher versus distilled ranker; per-hop generated entity with/without source validation; fresh versus stale policy/index replicas.

**Interpretation.** [ASSUMED] Separate candidate-budget, encoder, ranker and additional-search effects; report unresolved/missing evidence rather than converting a generated entity into a source.

**Threats to validity.** [ASSUMED] Adaptive stopping, repeated document families, evaluator calibration, snapshot skew and unequal hidden online costs can bias the strategy comparison.

**Acceptance criteria.** [ASSUMED] Zero unauthorized returned content, no generated hypothesis treated as evidence, no silent incomplete result, and finite attempted-call/row/token counts including failures. Quality/cost improvement requires preregistered paired, cluster-aware uncertainty over independently labeled evidence.

**Rejection condition.** [ASSUMED] Improvement exists only in answer-only judging, vanishes at equal candidate/work budget, fails missing-evidence cases, changes the information need or leaks revoked data. These reject different claims and are recorded separately.

**Reproducibility.** [ASSUMED] Preserve raw lists, all hypotheses/plans, executed filters, policy/index epochs, reranker truncation, failed calls and source labels. Replay updates with the same offered query sequence.

## Acceptance criteria

[DERIVED] Hard access/provenance invariants require complete event accounting at a stated boundary. Statistical retrieval claims require independent labels and appropriate sampling units. Undefined recall/nDCG denominators are explicitly marked and their task population remains reported; no convention is silently selected to improve an aggregate.

[ASSUMED] Numeric recall, latency, freshness and cost thresholds must be preregistered for the chosen equipment/workload. This edition supplies exact categorical invariants and leaves deployment-specific numeric targets unresolved. Independent acceptance follows model/index/parameter selection.

## What this edition did not do

[UNVERIFIED] No sources were ingested into a working corpus, no embeddings trained/generated, no index built/searched, no permission/revocation enforced and no benchmark/fault replay executed. Two immutable Faiss source files were fetched/read, without runtime checks. The manuscript is a source-grounded draft, not a reviewed implementation or empirical replication.

## Topic-completeness audit

[KNOWN] Obligations A–M correspond to CONTENT_CONTRACT §4.1: A problem/prior limitation; B formal contract; C full methodology; D mathematics; E bounded procedure; F implementation; G resources; H reported protocol; I observations; J alternatives; K improvements/lineage; L validity/failures; M reproducibility/closure.

| Obligation | Owning anchors applied to each row |
|---|---|
| A | #scope and #why-this-exists |
| B, D | #formulation and #mechanism; Eq. 49.1–49.33 with local symbols/conditions |
| C, G | #mechanism and explicit representation/compute/storage/communication boundaries |
| E | #algorithm; finite budgets, initialization, terminal/partial branches |
| F | #implementation; official source/docs versus unexecuted runtime |
| H, I | #experimental-design and four-part #observations; absence of controlled evidence explicit |
| J, K | #siblings and #extensions; chapter dated lineage |
| L, M | #failure-modes, #limitations, #reproducibility and exact source ledger |

[KNOWN] All rows require A–M unless noted. Pure accounting identities have no training dataset; specifications/designs have no controlled experiment to invent. Their H/I obligations record source scope and absent empirical closure. An inspected report's omission does not authorize fabricated implementation details.

| Required concept / variant | Manuscript anchor | Obligations / exception | Primary key and exact locator | Unresolved gap | Review consequence |
|---|---|---|---|---|---|
| Parsing and normalization | [49.1](49-1-corpus-construction.md#mechanism) | A–M | R49.1 §2.1, Appendix E/H | Local extraction unexecuted | No ingestion accuracy claim |
| Semantic units / inherited context | [49.1](49-1-corpus-construction.md#mechanism) | A–M; no training for segmentation rule | P39 §4.1; Eq. 49.1/4 original design | Unit sufficiency labels absent | No universal chunk optimum |
| Fixed windows / overlap | [49.1](49-1-corpus-construction.md#formulation) | A–M; counting identity no training | Eq. 49.3; P39 §4.1 historical windows | Semantic effects unmeasured | Count is not retention proof |
| Tables/code/document structure | [49.1](49-1-corpus-construction.md#mechanism) | A–M | R49.1 §2.1/§3.1; P39 corpus exclusions | Source-specific relational tests absent | Preserve header/symbol provenance |
| Stable logical/revision IDs | [49.1](49-1-corpus-construction.md#formulation) | A–M; no training | Eq. 49.1; R49.7 sequential/explicit IDs | Alignment/update mapping unexecuted | Hash not truth/permission |
| ACL-bearing metadata / dedup scope | [49.1](49-1-corpus-construction.md#mechanism) | A–M; no training | R49.20 §5.9; Eq. 49.2 | End-to-end principal checks absent | Metadata alone not enforcement |
| Source audit / degradation | [49.1](49-1-corpus-construction.md#experimental-design) | A–M | R49.1 §3.1/Table 2, Appendix A/E | Default-OK audit bucket not manually revised | No exhaustive correctness or enterprise generality |
| Sparse lexical analyzers | [49.2](49-2-retrieval-representations.md#mechanism) | A–M; no model training | R49.2 §§3.1,3.5 | Local analyzer/identifier tests absent | Exact-match contract versioned |
| BM25 saturation/length/IDF | [49.2](49-2-retrieval-representations.md#formulation) | A–M; no learned encoder | R49.2 §§3.4–3.5 Eqs. 3.10–3.15 | Parameter selection unexecuted | Approximate scoring, not arbitrary posterior |
| Learned sparse expansion | [49.2](49-2-retrieval-representations.md#mechanism) | A–M | R49.3 §§2–4, Table 1 | Local sparsity/latency frontier absent | FLOPS surrogate not device FLOPs |
| Dense encoder geometry | [49.2](49-2-retrieval-representations.md#formulation) | A–M | P39 §3 Eq. 1; R49.17 §2 | Current source embeddings absent | Pooling/normalization identities required |
| Contrastive objective / gradient | [49.2](49-2-retrieval-representations.md#mechanism) | A–M | P39 Eq. 2; Eq. 49.7/9 original adaptations | Negative-label validity unknown | Relative sampled probabilities only |
| Hard/in-batch negatives | [49.2](49-2-retrieval-representations.md#algorithm) | A–M | P39 §3.2/§5.2; R49.3 §3 | False-negative audit unexecuted | Harder can amplify label error |
| Domain adaptation / synthetic labels | [49.2](49-2-retrieval-representations.md#mechanism) | A–M | R49.16 GenQ/§5; R49.17 §§3–4 | Acceptance/update drift unmeasured | Training and re-encoding interventions separate |
| Multimodal stages / model merging | [49.2](49-2-retrieval-representations.md#observations) | A–M | R49.17 §§2–5, Table 6 | Proprietary data/independent reproduction incomplete | Stage gain not single-mechanism attribution |
| Exact vector search / ties | [49.3](49-3-search-infrastructure.md#formulation) | A–M; no training | R49.5 §3.1; Eq. 49.11 | Numeric reference unexecuted | Same metric/eligible set required |
| HNSW construction / search | [49.3](49-3-search-infrastructure.md#mechanism) | A–M; graph construction not learned encoder | R49.4 Algorithms 1–5, §4.2 | High-dimensional general complexity unresolved | Height bound not logarithmic query theorem |
| HNSW diversity / historical experiment | [49.3](49-3-search-infrastructure.md#experimental-design) | A–M | R49.4 Figures 7/10, §5.1 | Exact precision/current build absent | Historical hardware boundary retained |
| IVF list selection / imbalance | [49.3](49-3-search-infrastructure.md#mechanism) | A–M | R49.5 §5.1; Eq. 49.14 | Query/list model unvalidated | Uniform-list estimate conditional |
| PQ / ADC / packed storage | [49.3](49-3-search-infrastructure.md#mechanism) | A–M | R49.5 §4.1; R49.19 ProductQuantizer lines 61–71 | Original 2011 PDF inaccessible; runtime absent | Actual support is author-library report/code |
| Refinement / candidate omission | [49.3](49-3-search-infrastructure.md#formulation) | A–M; proof no training | R49.5 §3.5; Eq. 49.12/17 | Candidate/codec experiment absent | Exact rescoring not exact retrieval |
| Updates/deletions/direct maps | [49.3](49-3-search-infrastructure.md#mechanism) | A–M; no training | R49.7 Direct Map/Removing; R49.19 update_vectors | Operational deletion lag absent | Array/Hashtable/HNSW scope explicit |
| On-disk/shards/replicas | [49.3](49-3-search-infrastructure.md#mechanism) | A–M; no training | R49.9 storage/demo/Caching | Consistency/cold latency unexecuted | No universal RAM-only or production-RPC claim |
| Index integrity / filters | [49.3](49-3-search-infrastructure.md#implementation) | A–M; no training | R49.8 I/O warning; R49.19 search_preassigned | Artifact/auth path unexecuted | Static checks not deployed safety |
| Hybrid union / score normalization | [49.4](49-4-ranking-and-fusion.md#mechanism) | A–M | P39 §5 hybrid; Eq. 49.18 | Current normalization selection absent | Zero-range/missing-score conventions required |
| Reciprocal-rank fusion | [49.4](49-4-ranking-and-fusion.md#formulation) | A–M; no training for unweighted form | R49.10 §1/Tables 1–3 | Current complementary branch test absent | No universal dominance |
| Cross-encoder / pointwise-pairwise-listwise | [49.4](49-4-ranking-and-fusion.md#mechanism) | A–M | R49.11 §2 Eq. 1; R49.12 §4.2; Eq. 49.20 | Calibration/independent training absent | Ranking logits not factual correctness |
| Late interaction / MaxSim | [49.4](49-4-ranking-and-fusion.md#formulation) | A–M | R49.12 §4.1 Eq. 1; Eq. 49.21–22 | Current token-index experiment absent | No one-to-one matching or omission bound |
| Residual compression / denoised supervision | [49.4](49-4-ranking-and-fusion.md#experimental-design) | A–M | R49.12 §§4.2–4.5, Table 4/§6.3 | Combined interventions not isolated locally | Earlier revision/storage boundary explicit |
| Multimodal reranking | [49.4](49-4-ranking-and-fusion.md#experimental-design) | A–M | R49.17 §5.2/§6.4 Table 5 | Equal-compute/human calibration absent | Top-100 candidate boundary only |
| Rewriting / original constraints | [49.5](49-5-query-and-evidence-strategy.md#mechanism) | A–M | R49.18 §3.3/§4.4 Table 5 | Local drift test absent | Added search not guaranteed benefit |
| HyDE generated hypothesis | [49.5](49-5-query-and-evidence-strategy.md#formulation) | A–M | R49.13 §3 Eqs. 5–8, §4 Tables 1–2 | Ambiguity/hallucination filtering unproven | Hypothesis remains outside evidence |
| Decomposition / multihop | [49.5](49-5-query-and-evidence-strategy.md#mechanism) | A–M | R49.14 §§3–5; Eq. 49.25–26 | Conditional hop success unknown | Finite calls not success guarantee |
| Temporal / structured relational access | [49.5](49-5-query-and-evidence-strategy.md#mechanism) | A–M; no model training for algebra | R49.20 §7.2; Eq. 49.27 | Schema/time authority unexecuted | Typed execution not world completeness |
| Graph/community retrieval | [49.5](49-5-query-and-evidence-strategy.md#mechanism) | A–M | R49.15 §3.1/§3.3/§5 | Edge/facet/permission audit absent | Global sensemaking not exact local recall |
| Recall/hit/MRR/nDCG | [49.6](49-6-retrieval-evaluation.md#formulation) | A–M; definitions no training | P39 §2; R49.16 metrics; Eq. 49.28–29 | Independent judgments absent | Empty/zero-gain conventions explicit |
| ANN recall versus relevance | [49.6](49-6-retrieval-evaluation.md#formulation) | A–M; definitions no training | R49.5 §3.2; Eq. 49.30 | Exact local baseline absent | Metric neighbors not evidence sufficiency |
| Evidence coverage / complete facets | [49.6](49-6-retrieval-evaluation.md#mechanism) | A–M; set identities no training | Eq. 49.31; R49.14 set-recall boundary | Required facets/alternates unjudged | One hit not complete support |
| Freshness / access leakage | [49.6](49-6-retrieval-evaluation.md#mechanism) | A–M; no training | R49.20 §5.9; Eq. 49.2 | Revocation/time replay absent | Relevance cannot compensate for leakage |
| Latency/cost/failure populations | [49.6](49-6-retrieval-evaluation.md#mechanism) | A–M; accounting no training | R49.9 Caching; R49.16 §5.1; Eq. 49.33 | Local offered workload absent | No current measured frontier |
| Independent/cluster-aware uncertainty | [49.6](49-6-retrieval-evaluation.md#mechanism) | A–M; estimator no training | Eq. 49.32; R49.18 paired-query construction | Source-cluster sampling unresolved | I.i.d. SE restricted |
| 2026 controlled comparison / judge limits | [49.6](49-6-retrieval-evaluation.md#experimental-design) | A–M | R49.18 §§3.1–3.5, Table 5/§4.5 | Human labels/equal encoder/work absent | No architecture-only or faithfulness certificate |

## Research questions and decisive evidence

[DERIVED] **Filtered recall under evolving representations.** How can a search system retain predictable recall and update cost when embeddings, policy selectivity and source distributions change together? A useful result requires explicit query/filter distributions, update semantics and a valid capacity/error model, supported by held-out update traces or a theorem under bounded assumptions.

[DERIVED] **Evidence sufficiency under incomplete judgments.** How can one distinguish absent evidence from unsuccessful search without an exhaustive oracle? Decisive evidence includes audited alternate valid sources, deliberately missing/revoked facts and independently labeled required relations. More generated queries do not fix an incomplete relevance target.

[DERIVED] **Representation versus operational adaptation.** Which updates improve semantic coverage while preserving identifiers, provenance and acceptable re-encoding cost? Evidence needs controlled model/tokenizer/chunk changes, independent domain strata and complete rebuild/refresh accounting. A higher pooled benchmark score does not settle that engineering decision.
