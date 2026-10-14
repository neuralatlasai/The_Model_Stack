---
id: ms.section.49.2
entity_type: section
title: Retrieval representations
volume: 3
part: 9
chapter: 49
section: 49.2
slug: 49-2-retrieval-representations
parent: ms.chapter.49
prev_sibling: ms.section.49.1
next_sibling: ms.section.49.3
children: []
prerequisites: [ms.chapter.6, ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.18, ms.chapter.48, ms.section.49.1]
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

# 49.2 — Retrieval representations


## Scope

[DERIVED] Retrieval representations define which aspects of evidence are cheap to compare and which relevance distinctions must be learned. We reconstruct lexical BM25, learned sparse expansion and dense dual encoders, including contrastive objectives, hard negatives and domain adaptation. The baseline is exact lexical matching over the versioned units from §49.1. Success is independent retrieval quality under a declared relevance/policy contract, not proximity alone.

## Why this exists

[DERIVED] Lexical search fails when a query and relevant evidence use different vocabulary, yet exact identifiers, numbers and rare names remain powerful signals. Dense retrieval can bridge some vocabulary gaps while confusing semantically related but operationally incompatible statements. Learned sparse retrieval changes term weights and adds expansion terms; it preserves an inverted-index interface without preserving a literal lexical interpretation of every nonzero coordinate.

[PAPER-REPORTED] DPR improves answer-containing passage retrieval on several historical QA datasets but underperforms BM25 on SQuAD in its main table [P39, Table 2]. [DERIVED] That negative case matters: representation quality depends on the query-generation process and label definition. It cannot be inferred from one aggregate benchmark or from encoder size.

[DERIVED] The representation also determines update economics. A query-only change can be cheap; a document-encoder or tokenizer change usually invalidates stored vectors. Domain adaptation therefore changes both a learning problem and a deployed corpus artifact. Comparing two models against different document snapshots conflates these interventions.

## Intuition

[DERIVED] A sparse representation allocates coordinates to terms and visits postings for active query coordinates. A dense representation allocates a fixed vector budget to all content and compares vectors geometrically. Both compress information. BM25 compresses word order and semantics; a pooled dense vector compresses token-specific relations. Training can move useful distinctions into the retained coordinates but cannot prove that every future evidence distinction survives.

[DERIVED] Contrastive learning is relative discrimination within a candidate set. Raising a positive above sampled negatives does not make the score a calibrated probability of relevance in the full corpus. Hard negatives focus optimization on confusing alternatives, while false negatives push genuinely useful evidence away. The source of negatives is therefore part of the objective's meaning.

## Formulation

| Local symbol | Meaning |
|---|---|
| $q,u$ | Query and evidence unit |
| $n_c,n_j$ | Corpus units and units containing term $j$ |
| $f_{ju},\ell_u,\bar\ell$ | Term frequency, unit length and positive corpus mean length |
| $k_1,\rho_\ell$ | BM25 saturation and length parameters; $k_1>0$, $0\le\rho_\ell\le1$ |
| $e_q,e_u\in\mathbb R^{d_e}$ | Query/document embeddings of dimension $d_e$ |
| $t_s>0$ | Contrastive score temperature, distinct from distillation temperature |
| $\mathcal N_i$ | Selected negatives for training query $i$ |
| $n_b\ge1$ | Integer training query count in a minibatch |

[PAPER-REPORTED] The probabilistic relevance framework uses term independence assumptions and approximates an eliteness-based saturation curve; BM25 is not the exact posterior of an arbitrary text model [R49.2, §§3.1,3.4]. In a common rank-equivalent scaling, write

$$
s_{\rm BM25}(q,u)=
\sum_{j\in q}
\operatorname{idf}_j
\frac{(k_1+1)f_{ju}}
{f_{ju}+k_1(1-\rho_\ell+\rho_\ell\ell_u/\bar\ell)}.
$$
*(Eq. 49.5)*

[DERIVED] The prefactor $k_1+1$ is a constant across documents for fixed parameters and does not change ranking relative to its omission. An implementation must declare its IDF convention; the raw relevance-odds approximation $\log[(n_c-n_j+0.5)/(n_j+0.5)]$ can be negative for common terms, while implementations may use a positive shifted form. Those variants need not have identical rankings.

[MATHEMATICALLY-DERIVED] For fixed length factor $a_u=k_1(1-\rho_\ell+\rho_\ell\ell_u/\bar\ell)>0$, the frequency factor $g(f)=(k_1+1)f/(f+a_u)$ satisfies

$$
g'(f)=\frac{(k_1+1)a_u}{(f+a_u)^2}>0,
\qquad
g''(f)=
-\frac{2(k_1+1)a_u}{(f+a_u)^3}<0.
$$
*(Eq. 49.6)*

This proves diminishing marginal contribution under the stated model. It does not prove that repetition is irrelevant or that length normalization should be identical for prose and code.

[DERIVED] A dual encoder computes $s(q,u)=e_q^\top e_u$ or normalized cosine similarity. For one labeled positive $u_i^+$ and finite candidates $\mathcal A_i=\{u_i^+\}\cup\mathcal N_i$, an adapted contrastive objective is

$$
\mathcal L_{\rm ret}=
-\frac1{n_b}\sum_{i=1}^{n_b}
\log\frac{\exp(s(q_i,u_i^+)/t_s)}
{\sum_{u\in\mathcal A_i}\exp(s(q_i,u)/t_s)}.
$$
*(Eq. 49.7)*

This is a query-mean loss. DPR's original dot-product objective uses the corresponding untempered form [P39, Eq. 2]; other candidate constructions and masks change the objective.

## Mechanism

### Methodology

[DERIVED] Lexical preprocessing defines the vocabulary actually matched. Case handling, token boundaries, stemming and identifier splitting can change exact-match behavior. A programming identifier, legal citation or product code can be damaged by a language-oriented analyzer. Store the analyzer version with the sparse index. Query and document analyzers need a deliberate relationship; accidental asymmetry is not domain adaptation.

[DERIVED] BM25 combines rarity, saturating frequency and soft length normalization. The underlying binary-independence relevance-odds model motivates additive log weights; eliteness adds a hidden “about this term” variable; the practical saturation curve approximates its behavior. The result is an engineered scoring family with tunable parameters, not a universally calibrated probabilistic classifier [R49.2, §§3.4–3.5]. Tune only on a selection split and retain a separate acceptance set.

[PAPER-REPORTED] SPLADE v2 produces vocabulary-space nonnegative term impacts through log-saturated positive language-model activations and max pooling across positions. Its training combines ranking with sparsity regularization; distillation and refreshed mined negatives improve the reported model [R49.3, §§2–3]. [DERIVED] A nonzero expansion coordinate need not mean the term occurred in the evidence. Search results must display original source text, not synthetic expansion weights as factual content.

[DERIVED] Let $a_{tj}$ be a masked-language-model vocabulary logit for token position $t$ and term $j$. A simplified SPLADE-max representation and batch activation penalty are

$$
w_j(u)=\max_t\log(1+\operatorname{ReLU}(a_{tj})),
\qquad
\mathcal R_{\rm sparse}=
\sum_j\left(\frac1{n_b}\sum_i w_j(u_i)\right)^2.
$$
*(Eq. 49.8)*

[PAPER-REPORTED] The penalty is the source's FLOPS-inspired sparsity surrogate [R49.3, §2], not measured hardware FLOPs. [DERIVED] It penalizes common high-impact dimensions more than isolated ones, encouraging postings sparsity. Changing its strength changes candidate coverage, index size and lookup work. Sparsity alone does not guarantee fast search: one frequent expanded term can create a long posting list.

[DERIVED] Dense encoders must specify pooling, normalization, query instructions, truncation and document encoding. Cosine requires nonzero norms: reject zero-norm outputs or record an explicit fallback convention rather than dividing by zero. Unnormalized dot products are sensitive to vector norms; cosine removes that degree of freedom. For unit-normalized vectors, squared Euclidean distance is $2-2e_q^\top e_u$, so their exact rankings agree. Applying that equivalence to unnormalized embeddings silently changes the retrieval contract.

[PAPER-REPORTED] DPR uses separate BERT-base query/passage encoders and in-batch plus BM25 negatives [P39, §3]. [DERIVED] The score matrix can be implemented as $E_QE_U^\top$, with shapes $[n_b,d_e]$ and $[n_{\rm cand},d_e]$. Encoding dominates many training runs, while matrix work grows with candidate count. Distributed negatives require exchanging embeddings or scores and preserving label/mask identity across workers.

[MATHEMATICALLY-DERIVED] Let $z_{iu}=s(q_i,u)/t_s$, $p_{iu}=\operatorname{softmax}(z_i)_u$ and $y_{iu}$ the one-positive indicator. For one query loss,

$$
\frac{\partial \ell_i}{\partial z_{iu}}=p_{iu}-y_{iu},
\qquad
\frac{\partial \ell_i}{\partial s(q_i,u)}
=\frac{p_{iu}-y_{iu}}{t_s}.
$$
*(Eq. 49.9)*

A mislabeled relevant negative with high probability receives a large positive derivative, exerting downward loss pressure on its score. Shared-parameter optimizer updates need not decrease that individual score monotonically. The equation explains why harder negatives can amplify label error rather than always help.

[DERIVED] Negative mining is a finite data pipeline: retrieve candidates with a named index/model revision; remove known positives and duplicates; apply documented labeling/filtering; sample negatives with retained provenance; refresh after representation changes. “Not labeled positive” is insufficient evidence of irrelevance. In-batch negatives need special handling for duplicate questions, shared answers and multi-positive tasks. Hard-negative sampling can be conditioned on model failures while preserving an independent evaluation distribution.

[PAPER-REPORTED] Qwen3-VL's 2026 report extends retrieval to instruction-aware multimodal embeddings, with contrastive stages, mined/refined pairs, reranker distillation and model merging after a retrieval-versus-other-task tradeoff [R49.17, §§2–5]. [DERIVED] This is an expanded representation contract, not evidence that visual/document content should always be collapsed into one vector. The paper's abstract ranking date conflicts with its 2026 revision; this chapter relies on the dated experiment tables rather than that date string.

[DERIVED] Domain adaptation has several distinct interventions. Supervised contrastive tuning changes relevance geometry. Synthetic queries change the training population and can teach generator-specific vocabulary. Hard-negative refresh changes the discrimination set. Query instructions can change inference without updating weights. Document-encoder updates require re-encoding. Preserve these differences in ablations rather than attributing all gains to “better embeddings.”

[MATHEMATICALLY-DERIVED] Under orthogonal postprocessing $U^\top U=I$, inner products are preserved: $(Ue_q)^\top(Ue_u)=e_q^\top e_u$. Dimensional truncation and quantization generally do not preserve them. If $\tilde e_u=e_u+\epsilon_u$, then

$$
|e_q^\top\tilde e_u-e_q^\top e_u|
\le \|e_q\|_2\|\epsilon_u\|_2.
$$
*(Eq. 49.10)*

[DERIVED] A top-score margin larger than the combined candidate error bounds preserves that pairwise order; an average reconstruction error does not provide a uniform guarantee. This links representation compression to ranking sensitivity without claiming a universal recall loss.

[DERIVED] Sparse storage scales with nonzero impacts/postings plus dictionaries; dense storage has leading term $n_cd_eb$ bytes before IDs/indexes. Training adds encoder parameters, gradients/optimizer state and candidate scores; mining adds index builds and corpus passes. Re-encoding costs apply to all changed documents. Actual latency, energy and money depend on sequence/modal tokens, batch shapes, precision and hardware, which parameter count alone cannot supply.


```figure
{
  "id": "fig-49.6",
  "kind": "diagram",
  "title": "Contrastive pressure",
  "caption": "A training update changes representation geometry; document embeddings and search artifacts must be exported or refreshed under the same encoder, tokenizer and normalization contract.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-49.9",
  "alt": "Pairs and negatives leads to Query and document encoders leads to Similarity matrix leads to Masked objective leads to Versioned embeddings.",
  "spec": {
    "nodes": [
      {
        "id": "n0",
        "label": "Pairs and negatives",
        "kind": "process"
      },
      {
        "id": "n1",
        "label": "Query and document encoders",
        "kind": "process"
      },
      {
        "id": "n2",
        "label": "Similarity matrix",
        "kind": "process"
      },
      {
        "id": "n3",
        "label": "Masked objective",
        "kind": "process"
      },
      {
        "id": "n4",
        "label": "Versioned embeddings",
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

### Algorithm 49.2 — Bounded contrastive adaptation and index refresh

[DERIVED] Inputs are finite train/selection sets, pinned source corpus, finite epoch/mining budgets and a positive/negative labeling policy. Output is a selected representation plus a matching rebuilt index, or failure.

$$
\begin{aligned}
1.\;&\operatorname{ValidateSplitsAndPositiveProvenance};
\quad\text{overlap/invalid labels}\Rightarrow\operatorname{Fail}.\\
2.\;&\text{for }e=1,\ldots,e_{\max}:
\quad\operatorname{MineBoundedCandidatesFromPinnedIndex}.\\
3.\;&\operatorname{MaskKnownPositivesAndDuplicates};
\quad\text{no valid contrast}\Rightarrow\operatorname{SkipAndRecord}.\\
4.\;&\theta\leftarrow\operatorname{FiniteOptimizerStep}
(\mathcal L_{\rm ret}+\alpha_s\mathcal R_{\rm sparse});
\quad\text{nonfinite}\Rightarrow\operatorname{RollbackAndFail}.\\
5.\;&\operatorname{SelectOnHeldOutSelectionSet};
\quad\operatorname{FreezeRepresentationContract}.\\
6.\;&\operatorname{ReencodeAffectedCorpusAndBuildMatchingIndex};
\quad\text{identity mismatch}\Rightarrow\operatorname{Fail};
\quad\operatorname{Return}.
\end{aligned}
$$

[DERIVED] $\alpha_s\ge0$ is a declared sparsity coefficient and is zero for the unregularized dense variant. Step 3 removes the invalid example from the optimizer contribution and query-mean denominator, records it and advances to the next finite example; it does not execute step 4 for that example. Failed acceptance queries remain in evaluation. Finite epochs, candidate counts and token caps bound work; no convergence or domain-generalization theorem follows.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch is **Model / autograd framework**; Hugging Face Transformers is **Model definition / adaptation**, used in the inspected source training implementations [R49.3, §4]. Faiss/inverted-index engines are outside the numbered stack and are the plan's DPR-indexing integration. No encoder was trained or imported here.

[DERIVED] Store tokenizer, pooling, instruction, normalization, dtype and dimension with every embedding artifact. A dimension match alone is insufficient compatibility. Scores must join stable unit revisions; a new query encoder paired with stale document vectors is a new hybrid tuple requiring evaluation.

## Experimental design

### Reported experiments

[PAPER-REPORTED] DPR's Table 2 uses the fixed Wikipedia corpus and held-out QA tests; NQ top-20 answer-containing accuracy is 78.4% versus BM25's 59.1%, while SQuAD is 63.2% versus 68.8% [P39, §§4–5]. These are hit rates, not set recall over all relevant passages.

[PAPER-REPORTED] SPLADE v2 trains on MS MARCO, reports dev MRR@10 and TREC DL 2019 nDCG@10, and records four V100-32GB GPUs, DistilBERT initialization, length 256 and optimization settings. Table 1 reports SPLADE-max 0.340/0.684 and DistilSPLADE-max 0.368/0.729 on those respective metrics [R49.3, §4]. The latter changes supervision and negatives together.

## Observations

**What the paper claims.** [PAPER-REPORTED] Learned sparse/dense representations can improve specified retrieval tasks [P39; R49.3].

**What the evidence shows.** [PAPER-REPORTED] DPR includes a negative dataset comparison; SPLADE's max-pooling and distillation experiments expose effectiveness/sparsity tradeoffs. Qwen3-VL Table 6 reports 2B aggregate scores 72.1→71.5→73.2 across tuning, distillation and merging [R49.17, §7.3].

**What we infer.** [DERIVED] Supervision, candidate selection and task mixture matter alongside architecture. A gain from a merged model cannot be attributed solely to distillation.

**What remains unknown.** [UNVERIFIED] No local domain adaptation, false-negative audit or current corpus re-encoding was executed.

## Failure modes

> **Failure mode — Hard negatives encode missing labels.** [DERIVED] *Symptom:* valid alternate evidence loses rank after adaptation. *Cause:* unjudged positives treated as negatives. *Detection:* inspect high-gradient mined pairs and independent multi-positive labels. *Mitigation:* retain provenance, multi-positive masks and an acceptance split.

## Siblings

[DERIVED] BM25 exposes lexical matches; SPLADE learns sparse impacts/expansion; pooled dense retrieval offers fixed-width geometry; late interaction preserves token-level comparison (§49.4). These are representation choices, not a guaranteed quality ordering.

## Extensions

### Improvements

[PAPER-REPORTED] SPLADE v2 changes pooling and supervision over SPLADE; its documented gains come with mining and teacher costs [R49.3, §§3–4]. Qwen3-VL extends instruction-aware retrieval across modalities and variable representation budgets [R49.17, §§2–5]. Neither establishes a universal successor to lexical retrieval.

## Limitations

[DERIVED] No fixed representation can be presumed sufficient for every new domain, authority distinction or numerical constraint. A research question is whether adaptation can preserve exact identifier/constraint behavior while improving semantic recall under bounded re-encoding cost. Independent task strata and changed-corpus experiments are needed to settle it.

## Reproducibility

[UNVERIFIED] Retain corpus/splits, labels, mined candidates, model/tokenizer revisions, score normalization, optimizer schedule and complete index identity. Proposed training/evaluation remains in [verification](verification.md).


```figure
id: fig-49.7
kind: calculator
title: Contrastive pressure instrument
caption: The derivative is with respect to the dimensionless logit; target is 0 or 1.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-49.9
alt: Candidate softmax probability minus its positive-label indicator gives the loss derivative with respect to its logit.
states:
  - {anchor: formulation, label: Candidate, note: Inspect the stated equation domain.}
  - {anchor: mechanism, label: False negative, note: Costs and correctness have distinct boundaries.}
  - {anchor: failure-modes, label: Adaptation, note: No empirical result is generated by the calculator.}
spec:
  tex: '\partial\ell/\partial z_j=p_j-y_j'
  equation: "49.9"
  inputs:
    - {symbol: probability, label: candidate probability, default: 0.2, min: 0, max: 1, format: fixed2}
    - {symbol: target, label: positive indicator, default: 1, min: 0, max: 1, options: [0, 1], format: integer}
  outputs:
    - {symbol: result, label: analytical result, formula: "probability-target", format: fixed2}
```

```figure
id: fig-49.8
kind: stat-panel
title: Contrastive pressure boundaries
caption: These are mechanism boundaries, not benchmark measurements.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-49.9
alt: Sampled normalization, uncertain negative labels and representation-version changes constrain adaptation.
spec:
  header: EVIDENCE CONTRACT
  rows:
    - {key: candidate, value: sampled normalization}
    - {key: false negative, value: unlabeled is not irrelevant}
    - {key: adaptation, value: index identity must change}
```


## References

[P39](references.md#p39), [R49.2](references.md#r49-2), [R49.3](references.md#r49-3), [R49.17](references.md#r49-17).
