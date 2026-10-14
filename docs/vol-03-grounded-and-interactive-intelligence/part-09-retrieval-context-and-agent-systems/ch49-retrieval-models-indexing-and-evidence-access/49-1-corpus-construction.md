---
id: ms.section.49.1
entity_type: section
title: Corpus construction
volume: 3
part: 9
chapter: 49
section: 49.1
slug: 49-1-corpus-construction
parent: ms.chapter.49
prev_sibling: null
next_sibling: ms.section.49.2
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
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 49.1 — Corpus construction


## Scope

[DERIVED] Corpus construction produces evidence-bearing retrieval units with reproducible content, structure, provenance and access policy. The baseline is indexing extracted text with anonymous offsets. Success requires that a returned unit resolves to an authorized source revision and retains enough structure to interpret its claims. We cover parsing, semantic units, chunking, tables/code, stable identity and metadata; detailed vision architectures belong to Chapter 55.

## Why this exists

[DERIVED] Retrieval cannot recover information omitted by ingestion. A table flattened without headers may retain every character while losing the relation between a value and its measure. A code block separated from its signature or imports may become a misleading implementation fragment. OCR can change an inequality, decimal or identifier. These failures occur before similarity search and therefore cannot be attributed solely to the embedding model.

[PAPER-REPORTED] DPR's historical corpus deliberately removes tables, infoboxes and lists, then splits Wikipedia into disjoint 100-word passages with article titles [P39, §4.1]. That is a task-specific corpus contract rather than a generally correct enterprise ingestion policy. [DERIVED] A result on that collection does not establish retrieval quality for evidence encoded in cells, figures or repository structure.

[DERIVED] The dominant constraint changes when evidence must be audited. Searchable text alone is insufficient: one needs a source identity, revision, location and policy state. Updating a parser or chunk boundary changes the retrieval population, even if the underlying document bytes are unchanged. Index revisions must therefore identify the ingestion transform as well as the document snapshot.

## Intuition

[DERIVED] Treat ingestion as a compiler that emits evidence units rather than a text-cleaning script. Parsing exposes structure; segmentation chooses what can be retrieved together; serialization chooses what a model sees; metadata determines whether that representation may be returned. Each transformation can preserve, lose or invent relations. The useful invariant is traceability from every emitted claim-bearing span to the authoritative source.

[DERIVED] Chunk size trades localization against sufficient context. Smaller windows reduce irrelevant material but can cut dependencies. Larger windows retain dependencies while diluting similarity and consuming more encoding/reranking/context budget. Overlap changes the number of duplicate views of the same evidence. None of these choices has a universal optimum independent of queries, document structure and the downstream reader.

## Formulation

> **Definition — Evidence unit.** [DERIVED] A versioned content/structure object whose source spans, parent relations, transformation identity and access policy can be resolved independently of its retrieval score.

| Local symbol | Meaning |
|---|---|
| $u$, $\mathcal C_v$ | Evidence unit and corpus at snapshot $v$ |
| $s_u$, $r_u$ | Logical source identity and immutable source revision |
| $\mathcal P_u$ | Source span/page/cell/code-location provenance |
| $z_u$ | Parsed structure and parent/child relationships |
| $a_u$ | Policy metadata, authoritative policy reference and epoch |
| $H$ | Collision-resistant digest under a named encoding |
| $n_t,w_c,o_c$ | Positive integer document tokens/chunk cap and nonnegative integer overlap; $0\le o_c<w_c$ |
| $n_c$ | Number of emitted chunks |

[DERIVED] Separate logical identity from content revision:

$$
\operatorname{UnitKey}(u)=
(s_u,\operatorname{LogicalAnchor}(z_u)),
\qquad
\operatorname{RevisionKey}(u)=
H(r_u,\mathcal P_u,\operatorname{ParserVersion},
\operatorname{ChunkPolicy},\operatorname{Payload}(u)).
$$
*(Eq. 49.1)*

A digest binds bytes and transforms under a defined serialization; it does not prove truth, permission or semantic identity. Logical anchors can drift after editing, so mapping an old anchor to a new source requires an explicit alignment result.

[DERIVED] At request time $t$, principal $p$ may receive only

$$
\mathcal C_{v,p,t}=
\{u\in\mathcal C_v:
\operatorname{Authorize}(p,s_u,a_u,t)
\land\operatorname{ValidRevision}(u,t)\}.
$$
*(Eq. 49.2)*

Policy and freshness are eligibility predicates, not ranking penalties. A high-scoring unit outside this set remains ineligible.

[MATHEMATICALLY-DERIVED] For a nonempty linear token sequence, fixed-width windows advanced by $w_c-o_c$, with one final shorter window when needed, yield

$$
n_c=1+
\left\lceil
\frac{(n_t-w_c)_+}{w_c-o_c}
\right\rceil.
$$
*(Eq. 49.3)*

This is a window-count identity, not a claim that fixed windows preserve semantic dependencies. Boundary-aware segmentation changes the count.

## Mechanism

### Methodology

[DERIVED] Begin with immutable source bytes and a declared extraction path. Record the media type, parser/decoder revision, language and normalization operations. Preserve the original separately from normalized text. Normalization may improve matching while damaging evidence fidelity: Unicode compatibility folding can alter mathematical distinctions; whitespace collapsing can destroy code indentation; numeric reformatting can erase source units. Keep both a search view and a faithful citation view with a mapping between them.

[DERIVED] Parsing should produce a typed structure rather than one undifferentiated string. Paragraphs need heading paths and reading order. Tables need row/column headers, merged-cell spans, units and notes. Code needs language, repository revision, path, symbol boundaries and surrounding dependencies. A useful unit may include a row plus inherited headers or a function plus signature and documentation. That contextual augmentation must be marked as inherited source context, not text originally present in the local span.

[PAPER-REPORTED] PureDocBench constructs images and annotations from common HTML/CSS sources, then validates schema/source alignment and performs human review [R49.1, §2.1, Appendix H]. [DERIVED] Its important mechanism here is source traceability, which allows a parsing output to be checked against a known document representation. Fresh synthetic pages reduce a known overlap route but do not establish representativeness of private enterprise documents, natural editing histories or scanned archives.

[DERIVED] Semantic segmentation should respect dependencies before applying a finite size cap. First identify candidate units from structure, then group adjacent units when their meaning depends on a shared heading or table. Split oversized units with continuation markers and repeated inherited context. Retain parent links so a small retrieval hit can expand to its authorized neighborhood later. Expansion is a new retrieval/context action with its own budget; a parent link is not permission to retrieve every sibling.

[DERIVED] Tables require two complementary views. A textual view can expose cell content and headers to lexical/dense retrieval; a structured view preserves coordinates and relational operations. For a query asking for a total or comparison, matching a row is insufficient if the result requires aggregation across rows. Keep formula/raw-cell provenance and distinguish displayed values from calculated ones. Likewise, code retrieval should distinguish source, generated files, tests and executable artifacts. A copied function may be relevant but incompatible with a different repository revision.

[DERIVED] Stable IDs should survive incidental index ordering. A sequential row position is convenient for array storage but can change after deletion; retain a mapping to logical/revision keys. Content hashes alone merge identical public/private copies unless policy scope is preserved. Deduplication can share physical payloads while maintaining multiple provenance and permission edges. A deletion request must invalidate every authorized view that derives from the removed source, including cached summaries and embeddings where the declared retention policy requires it.

[OFFICIAL-DOCUMENTATION] PostgreSQL's row-security documentation distinguishes table privileges, enabled row policies and bypassing roles/owners [R49.20, §5.9]. [DERIVED] This illustrates why “metadata contains tenant_id” is not evidence of enforced access. Query execution, returned snippets, parent expansion, cache keys and observability records all need the same principal/policy boundary. Cached retrieval results must either be scoped to that boundary or reauthorized before publication.

[MATHEMATICALLY-DERIVED] Let $\mathcal E(u)$ be the set of source evidence atoms represented by unit $u$. Define ingestion evidence retention over independently required atoms $\mathcal G_q$ as

$$
\operatorname{Retain}(q,\mathcal C_v)=
\frac{\left|\mathcal G_q\cap
\bigcup_{u\in\mathcal C_v}\mathcal E(u)\right|}
{|\mathcal G_q|},
\quad |\mathcal G_q|>0.
$$
*(Eq. 49.4)*

For any retrieved subset, evidence coverage cannot exceed this retained fraction. The proof is set inclusion. A perfect ranker cannot restore an omitted table header unless a subsequent action accesses a representation that retains it.

[DERIVED] Resource accounting begins before indexing. Parsing cost depends on page/rendering and model execution, not just text bytes. Text segmentation is linear in the parsed stream under bounded local rules; global document alignment can be more expensive. Encoding repeated overlap increases processed tokens and stored vectors. Search payloads, faithful source views, structure graphs, ACL indexes and revision maps all contribute memory/storage. Deduplicated bytes do not eliminate permission-edge or invalidation costs. Network ingestion and source refresh can dominate when documents are remote; energy and money require the actual parser/runtime and workload rather than parameter-count proxies.


```figure
{
  "id": "fig-49.3",
  "kind": "diagram",
  "title": "Chunk count and provenance",
  "caption": "Source revisions pass through typed parsing and semantic segmentation before indexed evidence can be published. Provenance, structure and access labels remain part of each returned unit.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-49.3",
  "alt": "Source revision leads to Parsed structure leads to Semantic units leads to Versioned chunks leads to Policy metadata.",
  "spec": {
    "nodes": [
      {
        "id": "n0",
        "label": "Source revision",
        "kind": "process"
      },
      {
        "id": "n1",
        "label": "Parsed structure",
        "kind": "process"
      },
      {
        "id": "n2",
        "label": "Semantic units",
        "kind": "process"
      },
      {
        "id": "n3",
        "label": "Versioned chunks",
        "kind": "process"
      },
      {
        "id": "n4",
        "label": "Policy metadata",
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

### Algorithm 49.1 — Versioned, policy-bearing ingestion

[DERIVED] Inputs are a finite source snapshot, pinned parser/chunk policy and authoritative policy references. Output is a staged corpus manifest or a rejected build. Failure is terminal: quarantine affected units, roll back staged publication and return a diagnostic. No partial index is declared complete.

$$
\begin{aligned}
1.\;&\operatorname{ReadAndVerifySourceBytes};\quad
\text{missing/mismatched revision}\Rightarrow\operatorname{Fail}.\\
2.\;&z\leftarrow\operatorname{ParseTypedStructure};\quad
\text{invalid structure}\Rightarrow\operatorname{QuarantineAndFail}.\\
3.\;&\{u\}\leftarrow\operatorname{SegmentWithFiniteCaps}(z);
\quad\operatorname{AttachInheritedContextAndSpans}.\\
4.\;&\operatorname{AssignLogicalAndRevisionKeys};
\quad\operatorname{AttachAuthoritativePolicyReferences}.\\
5.\;&\operatorname{ValidateSpanResolutionAndStructure};
\quad\text{unresolved/unauthorized source}\Rightarrow\operatorname{Fail}.\\
6.\;&\operatorname{EncodeAndStagePayloads};
\quad\operatorname{PublishAtomicManifestIfComplete};\quad\operatorname{Return}.
\end{aligned}
$$

[DERIVED] Invariants are source-resolvable units, finite size/count, explicit policy inheritance and one published snapshot identity. A finite input and bounded parser/model token budget guarantee termination, not extraction accuracy. Validation must retain rejected pages rather than silently shrinking the evaluation population.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch is **Model / autograd framework** and Hugging Face Transformers is **Model definition / adaptation** for source-reported encoder/parser paths [P39, §3; R49.1, Appendix E]. PostgreSQL and document parsers are outside the numbered stack, routed through the plan's corpus/access requirements. No parser or policy implementation was executed.

[DERIVED] Keep immutable manifests connecting source revision, parser, chunk policy, tokenizer and embedding identity. Parallel ingestion workers can stage independent units, but publication needs a coherent snapshot. A failed source refresh should retain a named older revision or expose unavailable evidence; it should not mix new metadata with old content without disclosure.

## Experimental design

### Reported experiments

[PAPER-REPORTED] PureDocBench evaluates 40 parsers on 1,475 pages in clean/digital/physical-degradation tracks, totaling 4,425 images. It uses text edit distance, formula matching, table tree-edit similarity and reading-order edit distance; Appendix E records a four-A100-80GB local server, per-model backends and exceptions [R49.1, §§2–3, Appendix E]. These are parsing metrics, not retrieval recall.

[PAPER-REPORTED] Its separate OmniDocBench v1.5 audit confirms 2,580 errors among 21,353 scored blocks; 8,685 automatically screened default-OK blocks were not manually revised [R49.1, Appendix A.1]. That distinction limits any claim of exhaustive manual correctness.

## Observations

**What the paper claims.** [PAPER-REPORTED] Source-rendered annotations and degradation tracks expose parsing weaknesses obscured by clean-page evaluation [R49.1, §§2–3].

**What the evidence shows.** [PAPER-REPORTED] Table 2 reports FD-RL's Overall score falling from 78.38 clean to 67.04 real-degraded, while Qwen3.5-122B-A10B reports 76.14 to 69.85 under the source's per-model configurations. Overall excludes reading order, which is reported separately.

**What we infer.** [DERIVED] Parser choice and degradation can change the searchable evidence population. Aggregate parsing scores do not determine whether a particular required number, relation or code symbol survived.

**What remains unknown.** [UNVERIFIED] No local parser-to-retrieval propagation study, permission test or corpus-refresh replay has been run.

## Failure modes

> **Failure mode — Faithful-looking but relationally wrong evidence.** [DERIVED] *Symptom:* a retrieved value has the wrong header/unit or a code fragment resolves to the wrong revision. *Cause:* flattening or detached context. *Detection:* resolve source coordinates and parent relations. *Mitigation:* preserve typed structure and reject unresolved provenance.

[DERIVED] Overlap duplicates can monopolize top-k results; stale ACL caches can disclose revoked text; content-only deduplication can erase access distinctions. Each has a different observable signal and requires separate accounting.

## Siblings

[DERIVED] Fixed windows offer simple bounded costs; structure-aware units preserve dependencies; parent/child retrieval defers context expansion. Visual-page retrieval can avoid some OCR loss while introducing image encoding and localization costs. Chapter 55 owns the full visual representation treatment.

## Extensions

### Improvements

[PAPER-REPORTED] PureDocBench's 2026 change is a source-rendered, re-creatable benchmark with matched degradation tracks and an evaluator-aware audit [R49.1, §2.1, Appendix A]. It improves traceability of the benchmark, not automatically the accuracy of an ingestion system. No inspected study establishes one chunk policy as optimal across tasks and modalities.

## Limitations

[DERIVED] Logical anchors, source-coordinate mappings and inherited policy can all fail under document restructuring. A substantive research question is how to optimize retrieval units jointly for evidence retention, query coverage and update cost while retaining auditable provenance. Settling it requires source-level evidence labels and held-out document families, not only answer scores.

## Reproducibility

[UNVERIFIED] Preserve originals, parsing outputs, normalization maps, source/policy epochs, rejected pages, chunk relations and embedding manifests. Proposed experiments remain in [verification](verification.md); the corpus is not certified by file existence or a successful parse.


```figure
id: fig-49.4
kind: calculator
title: Chunk count and provenance instrument
caption: Defaults are an analytical token-count example; overlap must remain below the chunk cap.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-49.3
alt: Document tokens, window width and overlap determine the number of fixed-window evidence units.
states:
  - {anchor: formulation, label: Boundary, note: Inspect the stated equation domain.}
  - {anchor: mechanism, label: Structure, note: Costs and correctness have distinct boundaries.}
  - {anchor: failure-modes, label: Access, note: No empirical result is generated by the calculator.}
spec:
  tex: 'n_c=1+\left\lceil\max(0,n_t-w_c)/(w_c-o_c)\right\rceil'
  equation: "49.3"
  inputs:
    - {symbol: tokens, label: document tokens, default: 3000, min: 1, max: 10000, format: integer}
    - {symbol: width, label: chunk token cap, default: 500, min: 100, max: 1000, format: integer}
    - {symbol: overlap, label: overlap tokens, default: 50, min: 0, max: 99, format: integer}
  outputs:
    - {symbol: result, label: analytical result, formula: "1+ceil(max(0,tokens-width)/(width-overlap))", format: fixed2}
```

```figure
id: fig-49.5
kind: stat-panel
title: Chunk count and provenance boundaries
caption: These are mechanism boundaries, not benchmark measurements.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-49.3
alt: Finite chunk windows, parent and table relations, and return-time access checks constrain corpus construction.
spec:
  header: EVIDENCE CONTRACT
  rows:
    - {key: boundary, value: finite chunk window}
    - {key: structure, value: parent/table/code relations}
    - {key: access, value: policy checked at return}
```


## References

[P39](references.md#p39), [R49.1](references.md#r49-1), [R49.20](references.md#r49-20).
