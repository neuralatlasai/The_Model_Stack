---
id: ms.section.49.4
entity_type: section
title: Ranking and fusion
volume: 3
part: 9
chapter: 49
section: 49.4
slug: 49-4-ranking-and-fusion
parent: ms.chapter.49
prev_sibling: ms.section.49.3
next_sibling: ms.section.49.5
children: []
prerequisites: [ms.chapter.6, ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.18, ms.chapter.48, ms.section.49.3]
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

# 49.4 — Ranking and fusion


## Scope

[DERIVED] Ranking and fusion allocate a finite candidate/evidence budget after initial retrieval. We distinguish score fusion, reciprocal-rank fusion, cross-encoder reranking and token-level late interaction. The baseline is one first-stage ranked list. Success requires improved independent ranking/evidence metrics at a stated cost, with the same policy and corpus boundary; reranking cannot recover a unit absent from all candidates.

## Why this exists

[DERIVED] Lexical and dense scores have different scales and distributions. Adding them raw assigns an implicit and unstable weighting. Rank fusion avoids scale dependence but discards score-gap information. A cross-encoder can inspect a query–document pair jointly, while late interaction retains reusable document token vectors and defers fine-grained matching. These mechanisms spend different kinds of computation to repair different first-stage limitations.

[PAPER-REPORTED] DPR's historical hybrid experiment reranks the union of separately retrieved BM25/dense candidates using a development-selected linear combination [P39, §5]. [DERIVED] That is evidence for one tuned tuple. The coefficient does not transfer automatically to another analyzer, embedding normalization, chunk policy or corpus. A hybrid gain must be attributed to its candidate union and scoring separately.

## Intuition

[DERIVED] Fusion combines evidence about candidates; reranking obtains new interaction features. Combining two nearly identical lists mostly reinforces shared errors. Combining complementary lists can increase coverage before any rescoring. The reranker then spends more computation on a smaller population, but its maximum attainable recall remains bounded by that population.

[DERIVED] Late interaction lies between pooled dual encoding and joint encoding. Document token representations are cached, but each query token chooses its strongest document-token match. This retains more local alignment than one pooled vector and less joint conditional modeling than a cross-encoder. It creates an index/storage problem as well as a modeling opportunity.

## Formulation

| Local symbol | Meaning |
|---|---|
| $\mathcal A_j(q)$ | Candidate set from retriever/list $j$ |
| $\mathcal A(q)$ | Deduplicated union of candidates |
| $s_j(q,u),r_j(q,u)$ | Score and one-based rank in list $j$ |
| $\alpha_j\ge0$ | Declared fusion weights |
| $\kappa>0$ | Reciprocal-rank offset |
| $n_q,n_u,d_e$ | Positive integer query/document token-vector counts and dimension; empty representations are rejected |
| $Q_i,D_j$ | Unit-normalized token embeddings |
| $g_{qu}$ | Independent graded relevance label |

[DERIVED] Score fusion requires a declared normalization $\nu_j$:

$$
s_{\rm fuse}(q,u)=
\sum_j\alpha_j\nu_j(s_j(q,u)).
$$
*(Eq. 49.18)*

Absent candidates need an explicit missing-score rule. A numeric zero can mean no evidence, an actual score, or a normalization minimum; those meanings are not interchangeable.

[PAPER-REPORTED] Reciprocal Rank Fusion uses inverse offset ranks [R49.10, §1]. For truncated lists, a bounded reconstruction is

$$
s_{\rm RRF}(q,u)=
\sum_{j:u\in\mathcal A_j(q)}
\frac{\alpha_j}{\kappa+r_j(q,u)}.
$$
*(Eq. 49.19)*

[DERIVED] Missing candidates contribute zero. The original unweighted form sets all $\alpha_j=1$. RRF is invariant to strictly monotone transformations of each list's scores when ties/order remain fixed; it is not invariant to duplicating a list.

[MATHEMATICALLY-DERIVED] With $J$ unweighted lists, a unit ranked first in all lists receives $J/(\kappa+1)$, while one appearing at rank $r$ in only one list receives $1/(\kappa+r)$. This explains consensus reinforcement; it does not prove relevance improvement.

## Mechanism

### Methodology

[DERIVED] Start by aligning candidate identity and eligibility. Deduplicate the same revision before fusion, but preserve which retrievers supplied it and their ranks. Different chunks of one source may be distinct useful evidence or redundant overlaps; source-level diversification needs an explicit objective. All candidates should use the same policy snapshot or be reauthorized before return. An inaccessible candidate must not be made visible because another branch retrieved it.

[DERIVED] Common normalizers include min–max and z-score transformations within a query's candidate set. Min–max requires nonzero range; z-score requires nonzero variance. Neither estimates a calibrated probability of relevance. A single outlier can compress all other scores, and expanding the candidate set can change normalization and hence ranking. Define a constant-score fallback, retain raw scores and tune weights on an independent selection set.

[DERIVED] A learned fusion model can use scores, ranks, query features and source attributes with independently labeled relevance. It can also learn corpus-specific shortcuts. Training labels must cover the union population rather than only one retriever's preferred candidates. Report performance when one branch is missing or stale; normalizers learned on complete lists may fail under partial infrastructure failure. No inspected source establishes a universal normalizer or branch weight.

[PAPER-REPORTED] The originating RRF study compares fused TREC/LETOR runs against individual systems, Condorcet and CombMNZ, selecting offset 60 in its pilot [R49.10, §§1–2]. [DERIVED] Offset controls how much top positions dominate relative to broader consensus. Weighted variants are engineering extensions that need their own selection/evaluation; copying the historical value is a baseline choice, not an optimality theorem.

[DERIVED] A cross-encoder forms a joint query/unit input, computes contextual interactions and emits a relevance logit. For positive integer $n_{\rm pair}$, a pointwise binary objective over judged pairs is

$$
\mathcal L_{\rm CE}=
-\frac1{n_{\rm pair}}\sum_{(q,u)}
\left[g_{qu}\log\sigma(z_{qu})
+(1-g_{qu})\log(1-\sigma(z_{qu}))\right],
\quad g_{qu}\in\{0,1\}.
$$
*(Eq. 49.20)*

[PAPER-REPORTED] BERT passage reranking feeds query and passage as paired segments and trains a classification head [R49.11, §2, Eq. 1]. [DERIVED] The query-mean versus pair-mean distinction matters when queries have different candidate counts. Truncation can remove precisely the evidence the first-stage retriever found; preserve source coordinates and record which tokens the reranker actually receives.

[DERIVED] Pairwise training instead penalizes an incorrect score difference, for example $\log(1+\exp[-(z_{q,u^+}-z_{q,u^-})])$. Listwise training normalizes over a finite candidate set or distills teacher distributions. These objectives optimize different sampling units. A pointwise sigmoid after sampled-negative training is not automatically a corpus-level relevance probability; class sampling and label incompleteness change the meaning of its output. Calibration requires held-out labels at the intended population boundary.

[PAPER-REPORTED] Qwen3-VL reranking uses next-token yes/no supervision and a logit-difference sigmoid at inference [R49.17, §5.2]. [DERIVED] That binary score is a ranking function under a task instruction; it does not establish factual correctness or permission. A yes/no token score can be normalized without decoding a free-form explanation, but the joint multimodal forward pass remains a cost.

[PAPER-REPORTED] ColBERTv2 caches token representations and scores query–document alignment through summed MaxSim [R49.12, §4.1]. In local notation,

$$
s_{\rm late}(q,u)=
\sum_{i=1}^{n_q}\max_{1\le j\le n_u}Q_i^\top D_j.
$$
*(Eq. 49.21)*

[DERIVED] Each query token selects independently; several query tokens may match the same document token. This is not bipartite matching and does not enforce a one-to-one explanation. Adding new document vectors cannot decrease the score; adding exact duplicate vectors leaves it unchanged. Duplicating input text can change contextual encoder states and is a different intervention. A sum over query tokens also changes scale with query length; cross-query score thresholds need a separate convention.

[DERIVED] Late interaction separates expensive encoding from reusable comparison. Full scoring of one pair requires $O(n_qn_ud_e)$ dot-product work before reduction. A candidate generator may retrieve token neighbors, aggregate passage-level lower/approximate scores and then score complete retained passages. Candidate pruning can miss a document whose total support comes from many moderately strong token matches. The final MaxSim scorer does not remove that candidate-generation error.

[PAPER-REPORTED] ColBERTv2 improves supervision using mined candidates scored by a cross-encoder and stores centroid-plus-low-bit residual token vectors [R49.12, §§4.2–4.5]. [DERIVED] Compression and denoised supervision change distinct parts of the system. Compare uncompressed/compressed scoring on the same vectors to isolate codec effects; compare training variants at the same index settings to isolate supervision.

[MATHEMATICALLY-DERIVED] If query vectors are unit normalized and every document token reconstruction has norm error at most $\epsilon_e$, then each token dot product changes by at most $\epsilon_e$. Max is 1-Lipschitz in the sup norm, so

$$
|\tilde s_{\rm late}(q,u)-s_{\rm late}(q,u)|
\le n_q\epsilon_e.
$$
*(Eq. 49.22)*

This is a uniform reconstruction bound with a fixed token set. It does not bound candidate omission or a query-encoder change. It also explains why a small per-token error can accumulate in long query representations.

[DERIVED] Resource accounting should distinguish first-stage union size, reranked pairs and retained context. Joint attention has sequence-length-dependent cost per pair and cannot reuse one query-conditioned document encoding across unrelated queries. Late interaction stores approximately $b\,d_e\sum_un_u$ vector bytes before compression/index metadata, substantially more than one vector per unit. RRF uses $O(\sum_j|\mathcal A_j|)$ aggregation plus ranking; deduplication needs a stable-ID map. Network payload fetching, decompression, modality processing and failed branch retries add costs beyond score arithmetic. Measured latency must include query encoding and candidate fetch at the stated boundary.


```figure
{
  "id": "fig-49.12",
  "kind": "diagram",
  "title": "Rank evidence aggregation",
  "caption": "Sparse and dense searches are parallel candidate sources, not mandatory serial stages. Eligible deduplication precedes fusion or interaction ranking, whose recall is capped by the candidate union.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-49.19",
  "alt": "Sparse and dense candidate branches independently enter deduplication and fusion, followed by pair or token interaction and an eligible final ranking.",
  "spec": {
    "nodes": [
      {
        "id": "n0",
        "label": "Sparse candidates",
        "kind": "process"
      },
      {
        "id": "n1",
        "label": "Dense candidates",
        "kind": "process"
      },
      {
        "id": "n2",
        "label": "Deduplicate and fuse",
        "kind": "process"
      },
      {
        "id": "n3",
        "label": "Pair or token interaction",
        "kind": "process"
      },
      {
        "id": "n4",
        "label": "Final eligible ranking",
        "kind": "state"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n2"
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

### Algorithm 49.4 — Candidate-union fusion and bounded reranking

[DERIVED] Inputs are finite ranked lists, a fixed policy snapshot, fusion/missing-score rule, reranking budget and finite output cap. Output is an eligible ranked set with provenance. Failure branches terminate or return a declared partial-branch status; they never fabricate a complete list.

$$
\begin{aligned}
1.\;&\operatorname{ValidateListMetricAndSnapshotIdentities};
\quad\text{invalid branch}\Rightarrow\operatorname{ExcludeAndRecord}.\\
2.\;&\mathcal A\leftarrow\operatorname{DeduplicateEligibleUnion};
\quad\mathcal A=\varnothing\Rightarrow\operatorname{ReturnNoEvidence}.\\
3.\;&\operatorname{NormalizeWithZeroRangeConventionOrComputeRRF};
\quad\text{nonfinite}\Rightarrow\operatorname{Fail}.\\
4.\;&\mathcal A'\leftarrow\operatorname{TopBoundedCandidates};
\quad\operatorname{FetchExactUnitRevisions}.\\
5.\;&\operatorname{OptionalPairOrLateInteractionScore}(\mathcal A');
\quad\text{budget exhausted}\Rightarrow\operatorname{DeclaredFallbackRanking}.\\
6.\;&\operatorname{ReauthorizeAndSortWithTiePolicy};
\quad\operatorname{ReturnRankAndBranchProvenance}.
\end{aligned}
$$

[DERIVED] The fallback returns a completed valid first-stage ranking or terminates with a named shortfall; it does not mix unfinished scores as comparable values. Invariants are finite union/work, stable revision identity, explicit missing branches and unchanged hard eligibility. No ranking step expands authorization.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch is **Model / autograd framework** and Hugging Face Transformers is **Model definition / adaptation** for the inspected neural rankers. ColBERT/Faiss, sparse engines and multimodal retrieval packages are outside the numbered stack, routed through DPR/RAG anchors and the ranking row. No reranker or codec path was executed.

[DERIVED] Batch pairs by actual token/modal lengths; record padding/truncation and kernel dtype. Preserve the relationship between compact IDs, token-vector offsets and source revisions. An embedding cache keyed only by document ID fails when model or content revisions change.

## Experimental design

### Reported experiments

[PAPER-REPORTED] BERT's historical MS MARCO experiment reranks BM25 top-1,000 passages, uses BERT-large, maximum combined length 512 and query cap 64; Table 1 reports dev MRR@10 0.365 versus BM25 0.167 [R49.11, §§2–3]. These are the paper's dataset/version and candidate boundary.

[PAPER-REPORTED] ColBERTv2 reports MS MARCO dev MRR@10 39.7 versus ColBERT 36.0, with its changed supervision/compression; §6.3 reports 20/29 GiB versus 154 GiB for its one/two-bit versus original index configurations [R49.12, Tables 3–4, §6.3]. Storage includes index structures, not model weights.

[PAPER-REPORTED] Qwen3-VL's top-100-candidate reranking evaluation reports ViDoRe-v3 52.9→60.8/66.7 for base 2B embeddings and 2B/8B rerankers [R49.17, §6.4, Table 5]. It is not an equal-compute comparison.

## Observations

**What the paper claims.** [PAPER-REPORTED] Joint or token-level interactions improve their reported ranking tasks; RRF improves specified fused runs [R49.10–12].

**What the evidence shows.** [PAPER-REPORTED] RRF beats Condorcet in all seven post-pilot comparisons in its sign test; ColBERTv2 improves quality while reducing its historical index footprint. These results have distinct candidate, training and measurement boundaries.

**What we infer.** [DERIVED] Candidate coverage, learned interaction and storage compression require separate ablations. A later model with more compute can improve ranking without being the preferred latency/cost point.

**What remains unknown.** [UNVERIFIED] No current local hybrid/reranking frontier, authorization replay or independent calibration was measured.

## Failure modes

> **Failure mode — Fusion reinforces redundant error.** [DERIVED] *Symptom:* many branches return overlapping irrelevant chunks and displace complementary evidence. *Cause:* correlated retrievers/rewrites treated as independent support. *Detection:* inspect union diversity and facet coverage. *Mitigation:* evaluate branch contribution and deduplicate at the correct evidence level.

## Siblings

[DERIVED] Score fusion retains magnitude information but needs scale treatment; RRF retains order but discards gaps; cross-encoders obtain query-conditioned features; late interaction reuses document vectors. None can exceed its candidate coverage without another retrieval action.

## Extensions

### Improvements

[PAPER-REPORTED] ColBERTv2 changes residual representation and denoised supervision over ColBERT [R49.12, §4]. Qwen3-VL extends pair relevance to modalities under instructions [R49.17, §2]. Their remaining limits include index/candidate costs and training-distribution dependence, not merely model size.

## Limitations

[DERIVED] A research question is how to allocate first-stage breadth, interaction compute and source diversity under a fixed evidence/latency budget. Decisive evidence needs independent facet labels and equal-budget comparisons; an improved answer-only judge score does not settle the retrieval allocation problem.

## Reproducibility

[UNVERIFIED] Preserve all raw lists, normalizers/weights, ranks, candidate-union IDs, reranker inputs, teacher/model revisions, codec parameters, tie policy and cost boundary. Proposals remain in [verification](verification.md).


```figure
id: fig-49.13
kind: calculator
title: Rank evidence aggregation instrument
caption: Both ranks are present in this analytical example; absence contributes zero, not an invented rank.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-49.19
alt: Two integer list ranks contribute inverse-offset terms to the fused reciprocal-rank score.
states:
  - {anchor: formulation, label: Scores, note: Inspect the stated equation domain.}
  - {anchor: mechanism, label: Ranks, note: Costs and correctness have distinct boundaries.}
  - {anchor: failure-modes, label: Rerank, note: No empirical result is generated by the calculator.}
spec:
  tex: "RRF(u)=sum 1/(kappa+rank_j(u))"
  equation: "49.19"
  inputs:
    - {symbol: offset, label: rank offset, default: 60, min: 1, max: 100, format: integer}
    - {symbol: rankone, label: first-list rank, default: 1, min: 1, max: 100, format: integer}
    - {symbol: ranktwo, label: second-list rank, default: 20, min: 1, max: 100, format: integer}
  outputs:
    - {symbol: result, label: analytical result, formula: "1/(offset+rankone)+1/(offset+ranktwo)", format: fixed3}
```

```figure
id: fig-49.14
kind: stat-panel
title: Rank evidence aggregation boundaries
caption: These are mechanism boundaries, not benchmark measurements.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-49.19
alt: Score calibration, rank invariance and finite candidate coverage distinguish fusion from reranking.
spec:
  header: EVIDENCE CONTRACT
  rows:
    - {key: scores, value: calibration is separate}
    - {key: ranks, value: monotone-score invariant}
    - {key: rerank, value: candidate ceiling remains}
```


## References

[P39](references.md#p39), [R49.10](references.md#r49-10), [R49.11](references.md#r49-11), [R49.12](references.md#r49-12), [R49.17](references.md#r49-17).
