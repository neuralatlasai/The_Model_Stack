---
id: ms.section.55.4
entity_type: section
title: Document structure
volume: 3
part: 10
chapter: 55
section: 55.4
slug: 55-4-document-structure
parent: ms.chapter.55
prev_sibling: ms.section.55.3
next_sibling: ms.section.55.5
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.49, ms.chapter.50]
downstream: [ms.chapter.57, ms.chapter.63]
related: [ms.chapter.15, ms.chapter.42]
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [visual_representation, spatial_sampling], feedback_setting: [], modality: [image, text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 55.4 - Document structure

## Scope

[DERIVED] The required result is a document representation that preserves content, structure and page provenance sufficiently to support the requested answer. OCR strings alone do not establish reading order, table-cell relations, formula structure, figure references or cross-page evidence. This section owns those document-specific contracts. Retrieval ranking and generic context construction remain in Chapters 49-50; here they consume visual pages and typed document elements. Acceptance combines answer correctness with the evidence and structural relations required by the task.

## Why this exists

[DERIVED] A page is not a single text sequence. Columns, headers, footnotes and figures impose multiple relations. Flattening a table can place a correct value next to the wrong header; a page number printed in a footer can differ from the PDF's physical index. Both errors can produce a fluent answer that cites an existing page. The controlling uncertainty is whether the pipeline has preserved the bindings required by the question, rather than merely recovered most characters.

## Intuition

[MATHEMATICALLY-DERIVED] Suppose every token is recognized correctly but two table headers are exchanged. Character-level error can remain zero while a query selecting a named column becomes wrong. Conversely, splitting one paragraph into two adjacent blocks can change a structural matching score without changing its readable content. Evaluation must therefore distinguish content errors, relational errors and harmless segmentation differences; a single aggregate cannot establish all three.

## Formulation

[DERIVED] Use a typed graph $G_D=(V_D,E_D)$ whose nodes carry immutable document identity, physical page index, source geometry, element type and payload. Edges express containment, reading precedence, table header association, caption-of, continuation and explicit reference. Do not make all relations a single global order. A caption can refer to a figure while having its own reading position; a table cell can belong to both a row and a column hierarchy.

[MATHEMATICALLY-DERIVED] For a reading-precedence graph $G_R=(V_R,E_R)$, a valid linearization $\pi$ must satisfy

$$
(u,v)\in E_R\Rightarrow\pi(u)<\pi(v).
$$
*(Eq. 55.13)*

where $\pi$ assigns distinct sequence positions. A topological ordering exists exactly when the directed graph is acyclic. It need not be unique. An unresolved precedence ambiguity should remain explicit rather than be hidden by sorting every box by its top coordinate. Cycles can identify inconsistent local predictions or an incorrect attempt to encode non-order relations as precedence. A finite graph validator costs $O(|V_R|+|E_R|)$; the difficult step is inferring the appropriate edges.

[DERIVED] A table cell record contains its text/value, row interval, column interval, unit and header path. Merged cells occupy spans, so a row-major string is not an adequate substitute for the incidence structure. Blank, missing, zero and 'not applicable' remain distinct. For a formula, a linear serialization must preserve operator grouping, indices and matrix boundaries. For figures, preserve the caption, panel identifiers and associations between text references and image regions. A rendering-equivalent formula can differ in serialization, while a visually similar minus sign or superscript can change the meaning.

[MATHEMATICALLY-DERIVED] Let $Y$ be an answer and $E$ the required evidence. The chain rule gives

$$
p(Y,E\mid D,q)=p(E\mid D,q)\,p(Y\mid E,D,q).
$$
*(Eq. 55.14)*

where $D$ is the document. This factorization is exact, but a system replacing the second factor by $p(Y\mid E,q)$ additionally assumes the selected evidence is sufficient. An omitted footnote, unit or page-level qualifier violates that assumption. A retrieved page can include the required evidence and still distract the reader; 'all gold pages retrieved' is a coverage event, not proof that every necessary qualifier was annotated or correctly used.

```figure
{
  "id": "fig-55.12",
  "kind": "diagram",
  "title": "A table answer needs structural bindings",
  "caption": "A physical page contains a table; a header names a column; a cell belongs to that header path and carries its unit. The answer combines cell value and operation while retaining a source region. A nearby string or valid page citation alone does not establish those relations.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.14",
  "alt": "A physical page contains a table; a header names a column; a cell belongs to that header path and carries its unit. The answer combines cell value and operation while retaining a source region. A nearby string or valid page citation alone does not establish those relations.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "doc",
        "kind": "dataset",
        "label": "Immutable PDF"
      },
      {
        "id": "page",
        "kind": "state",
        "label": "Physical page identity"
      },
      {
        "id": "table",
        "kind": "state",
        "label": "Table and span structure"
      },
      {
        "id": "head",
        "kind": "state",
        "label": "Header path and unit"
      },
      {
        "id": "cell",
        "kind": "tensor",
        "label": "Selected cell value"
      },
      {
        "id": "op",
        "kind": "process",
        "label": "Requested operation"
      },
      {
        "id": "out",
        "kind": "metric",
        "label": "Answer plus cited region"
      }
    ],
    "edges": [
      {
        "from": "doc",
        "to": "page",
        "label": "contains"
      },
      {
        "from": "page",
        "to": "table",
        "label": "contains"
      },
      {
        "from": "table",
        "to": "head",
        "label": "column semantics"
      },
      {
        "from": "head",
        "to": "cell",
        "label": "binds"
      },
      {
        "from": "cell",
        "to": "op",
        "label": "typed value"
      },
      {
        "from": "op",
        "to": "out",
        "label": "result"
      },
      {
        "from": "page",
        "to": "out",
        "label": "source identity"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] A modular parser locates regions, recognizes each according to type, then assembles structure. Its advantage is inspectable boundaries and potentially specialized local resolution; a missed region becomes an upstream recall failure. A whole-page decoder emits content and structure jointly, avoiding a hard detection boundary while exposing serialization and long-output risks. A hybrid can retain the original page alongside parsed elements so that downstream verification can revisit evidence. None of these architectures establishes correctness simply by emitting valid Markdown or JSON.

[PAPER-REPORTED] PaddleOCR-VL-1.6 keeps its predecessor's architecture and layout detector, while upgrading data refinement and post-training. Its pipeline localizes regions, recognizes their contents and applies structural post-processing [R55.8, Secs. 2-4]. Expert agreement is used for labeling; unresolved cases undergo bounded render-and-refine rounds before manual escalation. This procedure checks some rendered discrepancies, but expert agreement does not imply independence or eliminate shared errors.

[DERIVED] Rendering a candidate table or formula provides an additional observation of the candidate serialization. It can expose bad spans or missing terms, yet a judge may prefer a visually neat but semantically wrong candidate. A bounded refinement procedure must preserve original pixels and every candidate, distinguish parse failure from content disagreement, and stop with an unresolved status. A loop that ends at its round cap has established termination, not label correctness.

[PAPER-REPORTED] The same report's stage ablation on OmniDocBench v1.6 gives overall scores 94.93, 95.62, 96.25 and 96.33 after baseline, continued pretraining, SFT and RL respectively [R55.8, Table 8]. These sequential changes confound data, optimization and cumulative compute. They support the reported incremental recipe; they do not isolate an architecture gain or establish that RL is necessary for most of the improvement. Table 8 lists SFT table-structure score 97.09, while adjacent prose says 97.19; this chapter uses the table and records the inconsistency.

[DERIVED] For visual retrieval, page embeddings can retain multiple local vectors so that a query token matches a localized region. A late-interaction score with $L_q$ query vectors and $M_p$ page vectors is

$$
s(q,p)=\sum_{\ell=1}^{L_q}\max_{1\leq j\leq M_p}t_\ell^\top v_{p,j}.
$$
*(Eq. 55.15)*

where embeddings share width $d$. This score can collect maxima from unrelated regions; it does not enforce that all query predicates bind to one object or coherent table row. Longer queries can change score scale, and normalization choices belong to the retriever contract. Approximate candidate search adds a recall boundary before the exact shortlist score.

[MATHEMATICALLY-DERIVED] For uncompressed storage of $N$ pages, a shared vector width $d$ and $b$ bytes per coordinate, the vector payload is

$$
M_{\mathrm{index}}=bd\sum_{p=1}^{N}M_p,\qquad
M_{\mathrm{index}}=NMdb\quad\text{if every }M_p=M.
$$
*(Eq. 55.15a)*

[DERIVED] This counts vector coordinates only. ANN metadata, IDs, alignment, replicas, source pages and working buffers are separate allocations. The uniform-page special case drives [Fig. 55.14](#fig-55-14); it does not evaluate the retrieval score in Eq. 55.15.

[PAPER-REPORTED] LITTA keeps its visual index fixed, generates multiple query variants and fuses ranked page lists, using a frozen retriever, candidate depth 20 and reciprocal-rank constant 60 in its main configuration [R55.9, Secs. 3-4]. Its reported three-domain mean NDCG@10 rises from 64.2 for one query to 69.5 for three and 72.0 for five. Domain gains differ; optional reranking and failed-expansion fallback must be logged. It is query-side evidence access, not retriever retraining.

[MATHEMATICALLY-DERIVED] With $Q$ variants, candidate sets $C_i$ and one-indexed ranks $r_i(p)$, a rank-fusion construction is

$$
S(p)=\sum_{i:p\in C_i}\frac1{c+r_i(p)},\qquad c>0.
$$
*(Eq. 55.16)*

where an absent page contributes zero. It avoids combining incomparable raw score scales, but duplicated variants can repeatedly vote for the same semantic mistake. Deduplication and original-query retention are therefore meaningful controls. An expansion that invents an entity may increase retrieval confidence while violating the original question.

## Algorithm

### Algorithm 55.4 — Document evidence assembly with bounded retrieval

[DERIVED] Inputs are immutable document pages, a finite parse/retrieval configuration, question, candidate cap, resource budget and deadline. Output is an answer with source-resolvable evidence, an abstention or an explicit failure.

$$
\begin{aligned}
1.&\quad \text{validate document digest, page-index map, parser/index revisions and access boundary}.\\
2.&\quad G_D\leftarrow\operatorname{ParseOrLoad}(D);\quad\text{validate boxes, table spans, references and precedence cycles}.\\
3.&\quad \mathcal Q\leftarrow\operatorname{BoundedVariants}(q,Q);\quad\text{retain }q;\ \text{reject invalid expansions}.\\
4.&\quad C\leftarrow\operatorname{Fuse}(\operatorname{Retrieve}(G_D,\mathcal Q));\quad\text{deduplicate and enforce candidate cap}.\\
5.&\quad \text{if cancelled, expired, evidence-invalid or over budget: stop without publishing an unsupported answer}.\\
6.&\quad (y,e)\leftarrow\operatorname{Read}(q,C);\quad\text{validate evidence identities and required operations}.\\
7.&\quad \text{recheck deadline and document version; publish }(y,e)\text{ only under the declared acceptance rule}.
\end{aligned}
$$

[DERIVED] The invariant is that every cited element resolves to the immutable source and its physical page, with logical labels stored separately. Candidate exhaustion returns a bounded failure or abstention; it does not authorize expanding indefinitely. Parsing and index build are charged to their own lifecycle boundary. Cached results with a different rasterizer, parser or model digest are separate artifacts.

```figure
{
  "id": "fig-55.13",
  "kind": "compare",
  "title": "Oracle controls change the available information",
  "caption": "Use these conditions as diagnostics with explicit information differences. Gold pages remove some retrieval uncertainty, oracle text removes some recognition uncertainty, and oracle structure additionally supplies bindings. None is a deployable gain without providing that information operationally.",
  "placement": "inline",
  "anchor": "experimental-design",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.14",
  "alt": "Use these conditions as diagnostics with explicit information differences. Gold pages remove some retrieval uncertainty, oracle text removes some recognition uncertainty, and oracle structure additionally supplies bindings. None is a deployable gain without providing that information operationally.",
  "spec": {
    "axis": "What uncertainty is reduced by the supplied oracle interface",
    "columns": [
      {
        "id": "pages",
        "label": "Gold pages"
      },
      {
        "id": "text",
        "label": "Oracle transcription"
      },
      {
        "id": "structure",
        "label": "Oracle structure"
      }
    ],
    "rows": [
      {
        "dimension": "Supplied information",
        "values": {
          "pages": "Annotated supporting page images",
          "text": "Verified recognized strings",
          "structure": "Verified spans, headers and relations"
        }
      },
      {
        "dimension": "Still unresolved",
        "values": {
          "pages": "Perception, bindings, computation and judge",
          "text": "Layout if flattened, computation and judge",
          "structure": "Required operation, answer policy and judge"
        }
      },
      {
        "dimension": "Interpretation of gain",
        "values": {
          "pages": "Evidence access or context selection probe",
          "text": "Observation/interface probe",
          "structure": "Binding/interface probe"
        }
      }
    ]
  }
}
```


## Implementation

[MATHEMATICALLY-DERIVED] Storing $N$ pages with $M$ vectors/page, width $d$ and $b$ bytes/value requires $NMdb$ payload bytes before indexing overhead (Eq. 55.15a). Exact shortlist interaction for $Q$ queries, $k$ candidates each and length $L_q$ costs $O(QkL_qMd)$ arithmetic. Omitting $d$ is valid only when treating width as fixed; this chapter keeps it explicit. Query generation, ANN search, transfer, reranking and answer generation are additional costs. A compressed embedding index can save memory while changing recall and numerical ties.

[DERIVED] Maintain both physical PDF index and displayed page label, plus crop-to-page transforms from Sec. 55.1. Heading hierarchy and cross-page tables require document-level state; continuation must preserve column semantics and units, not merely concatenate adjacent pages. An extracted cell should link to its exact region and parser revision so an answer can be rechecked. Page images and OCR text can be complementary access paths, but the language model must distinguish source text from generated descriptions or inferred repairs. Tool/security boundaries remain in Chapter 51 and are not replaced by visual parsing.

[NOT-DISCLOSED] Complete source-label independence, all package revisions, training contamination checks and production recovery behavior are not supplied by these paper comparisons. No implementation was executed for this section. Algorithm 55.4 is a book interface reconstruction; it is not attributed as the released control flow of PaddleOCR or LITTA.

```figure
{
  "id": "fig-55.14",
  "kind": "calculator",
  "title": "Multi-vector page-index payload",
  "caption": "Illustrative uniform-page vector payload in Eq. 55.15a, with every page holding M vectors. The calculator excludes ANN metadata, IDs, alignment, replication and source page storage. More page vectors increase index cost while changing the information exposed to retrieval.",
  "placement": "rail",
  "anchor": "implementation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-55.15a",
  "alt": "Illustrative uncompressed payload NMdb. The calculator excludes ANN metadata, IDs, alignment, replication and source page storage. More page vectors increase index cost while changing the information exposed to retrieval.",
  "spec": {
    "tex": "M_{\\rm index}=NMdb",
    "equation": "55.15a",
    "inputs": [
      {
        "symbol": "N",
        "label": "Number of pages",
        "default": 10000,
        "min": 100,
        "max": 1000000,
        "format": "integer"
      },
      {
        "symbol": "M",
        "label": "Vectors per page",
        "default": 1024,
        "min": 32,
        "max": 4096,
        "format": "integer"
      },
      {
        "symbol": "d",
        "label": "Retrieval vector width",
        "default": 128,
        "min": 32,
        "max": 1024,
        "format": "integer"
      },
      {
        "symbol": "b",
        "label": "Bytes per value",
        "default": 2,
        "min": 1,
        "max": 4,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "bytes",
        "label": "Uncompressed vector payload",
        "formula": "N*M*d*b",
        "format": "bytes"
      }
    ]
  }
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] VELD-QA supplies human-authored questions and supporting-page/element annotations for long PDFs. It evaluates question-only, gold-page, retrieved-page and all-page access; longer all-page documents use batched processing and synthesis [R55.10, Secs. 3-5]. Its 1,452-question test uses document bootstrap intervals and a model judge with partial credit, plus an independent judge comparison. Gold-page access isolates page selection imperfectly because it still requires perception and reasoning.

## Observations

**What the paper claims.** [PAPER-REPORTED] VELD-QA's best reported gold-page accuracy is 81.7%, and complete page coverage does not eliminate answer errors [R55.10, Table 3 and Appendix F]. This is source-judged partial-credit accuracy, not exact match.

**What the evidence shows.** [PAPER-REPORTED] The study's shared-backbone agent comparisons retain method-specific prompts and budgets; some agents improve selected tasks and others underperform fixed retrieval [R55.10, Sec. 4.1, Table 4]. They are not a uniformly budget-matched causal test of agency.

**What we infer.** [DERIVED] A retrieval gain should be followed through to answer and evidence correctness. Better rank metrics can be offset by distracting context, poor table interpretation or a changed synthesis boundary. A correct page citation alone does not establish correct value extraction.

**What remains unknown.** [UNVERIFIED] Independent reproduction and transfer to other document languages, genres and parser/index versions remain open. Printed page identifiers, dataset aliases and byte-level duplicates require local validation before deployment.

## Failure modes

> **Failure mode - Header/value misbinding.** [DERIVED] *Symptom:* correct digits answer the wrong column. *Cause:* cell spans, units or header hierarchy were flattened incorrectly. *Detection:* trace the selected cell's header path and source crop. *Mitigation:* preserve table incidence and re-read the original region when bindings are uncertain.

> **Failure mode - Citation without support.** [DERIVED] *Symptom:* an existing page is cited but does not establish the answer. *Cause:* page-level relevance is mistaken for claim entailment. *Detection:* check every answer claim against the cited element and operation. *Mitigation:* separate retrieval coverage, extraction and claim validation, with abstention on unresolved support.

## Siblings

[DERIVED] Use parsed text/structure when it preserves the required relations and offers acceptable lifecycle cost. Use direct page images when parsing omits decisive layout or visual content. A hybrid is justified when the extra representation measurably closes those errors under a matched evidence budget. Query expansion is useful only if improved coverage exceeds added distraction and cost; a fixed-query baseline with deeper retrieval is a necessary comparator. If gold pages still fail, prioritize reading/structure or evaluation rather than increasing retrieval breadth. If oracle structure closes the gap, it identifies a consequential parser/evidence bottleneck without proving a particular repair is best.

## Extensions

### Improvements

[DERIVED] Region refinement and render-guided labels improve the supervision path; multi-query retrieval improves query coverage; structure-preserving assembly improves the interface to the reader. They address different obstructions. Adaptive zoom can be added when the original raster contains detail lost by current crops, but its added pixels and tool budget must be counted. Sec. 55.6 owns that acquisition loop. A new document graph edge or parser heuristic should be accepted only when it changes task error or auditability, not merely serialization completeness.

## Limitations

[DERIVED] An acyclic order graph proves consistency of the supplied precedence constraints, not that those constraints reflect intended reading. A valid table serialization can still encode wrong contents. Gold annotations need not be exhaustive or minimally sufficient. The bounded conclusion is an evidence-preserving architecture and diagnostic decomposition; model-independent accuracy guarantees remain absent.

## Reproducibility

[DERIVED] Preserve PDF hashes and aliases, renderer settings, logical/physical page map, region geometry, parse graph, header/span associations, element serializations, index digest, ANN parameters, query variants/fallbacks, ranking ties, selected context and evaluator prompts. The proposed oracle-structure and retrieval interventions are in [verification](verification.md).

## References

[R55.8](references.md#r55-8), Secs. 2-5, Algorithms 1-2 and Table 8; [R55.9](references.md#r55-9), Secs. 3-4; [R55.10](references.md#r55-10), Secs. 3-6 and Appendices C/F. General retrieval and context construction: Chapters 49-50.
