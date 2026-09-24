---
id: ms.section.7.1
entity_type: section
title: Source categories
short_title: Source categories
volume: 1
part: 2
chapter: 7
section: 7.1
slug: 07-1-source-categories
parent: ms.chapter.7
prev_sibling: null
next_sibling: ms.section.7.2
children: []
prerequisites: [ms.section.1.5, ms.section.4.1, ms.section.6.2]
downstream: [ms.section.7.2, ms.section.7.3, ms.section.8.2, ms.section.9.1, ms.section.11.5, ms.section.49.1]
related: [ms.section.11.1, ms.section.65.1]
siblings_by_mechanism: [ms.section.7.2]
relations:
  - {type: supported_by, target: paper.P03}
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P06}
  - {type: prerequisite_of, target: ms.section.9.1}
axes: {lifecycle: [data], mechanism: [source_taxonomy, sampling_unit, cost_accounting], feedback_setting: [], modality: [text, code]}
papers: [P03, P05, P06, P21, P25]
implementations: [impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED, KNOWN], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 7.1 Source categories

## Scope

Objective: classify training data by *where it physically comes from* — web, books, science, code, mathematics, dialogue, enterprise records, user interactions, simulation — and attach to each category four engineering facts: its unit of sampling, the supervision it typically carries, its dominant provenance risk, and its cost line (acquisition, storage, tokens after extraction). Baseline: the undifferentiated phrase "pretraining data". Success: the reader can place any candidate dataset in a category, state what one drawn record is, and write a yield chain from raw bytes to tokens under a named tokenizer. Boundaries: the axes that cut across categories are §7.2; extraction mechanics are §7.3; filtering and deduplication methods are owned by [Chapter 08](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/README.md); mixture weights by [§9.1](../ch09-data-mixtures-curricula-and-sample-efficiency/09-1-mixture-formulation.md).

## Why this exists

What failed before was treating a corpus as a homogeneous bag of tokens whose only interesting property was its size. The Pile was assembled explicitly against that habit: it combines 22 constituent datasets and reports, per constituent, raw size, weight, and epochs, because the constituents differ in document length, tokenizer fit, and provenance (PAPER-REPORTED · P03). The bottleneck that appeared was that *costs and risks do not aggregate across sources*: a terabyte of Common Crawl HTML and a terabyte of parsed scientific PDFs differ in acquisition mechanism, in extraction yield, in who holds rights, and in what one "document" means. The constraint that became dominant is that every later decision — filter thresholds, deduplication scope, mixture weights, deletion handling — is made per source, so the source must be a first-class field of every record. What changed in the solution is that open corpora began to publish per-source accounting: Dolma reports UTF-8 bytes, documents, Unicode words, and Llama tokens for each of its sources, and states how raw data for each can be recovered (PAPER-REPORTED · P05).

## Intuition

A source category is a statement about a *generating process and a custody chain*, not about content. Two documents with identical text — one crawled from a public page, one exported from a customer ticketing system — are different training inputs because they arrive with different rights, different deletion obligations, and a different population behind them. The physical-resource reading is equally concrete: web data is cheap per raw byte and expensive per retained token, because most crawled bytes are markup and boilerplate that extraction discards; book and paper data is expensive to acquire and parse but dense in retained tokens per document; code is cheap to parse but tokenizes poorly under a text-trained vocabulary; interaction logs are nearly free to store and dominated by governance cost. Heuristically one may think of categories as "genres", but the engineering content of a category is only the tuple (unit, supervision, risk, cost).

## Formulation

> **Definition — Source category.** The class of generating process and custody chain from which a dataset's raw records were obtained: web crawl, books, scientific literature, code repositories, mathematical text, dialogue, enterprise records, user interactions, or simulation. It is one coordinate of the origin axis of §7.2, fixed at acquisition and never changed by later processing.

> **Definition — Unit of sampling (data).** The smallest record that the dataset build treats as indivisible when it draws, deduplicates, splits, or deletes: a page, a book, a paper, a file, a repository, a thread, a conversation, a ticket, a trajectory. It is a property of the dataset build, distinct from the statistical [experimental unit](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md) of an analysis, although the two must be reconciled before any split (see [§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md)).

> **Definition — Provenance risk.** The category-typical way in which the chain from a training record back to its origin, rights holder, and generating population fails: unknown author, unauthorised host, unverifiable licence, machine-generated content of unknown generator, or unrecorded consent.

The token yield of a source under tokenizer tok is a product of stage yields:

$$
D_{\text{avail}}^{(\text{tok})} \;=\; \frac{Z \cdot \gamma_{\text{ext}} \cdot \gamma_{\text{filt}} \cdot \gamma_{\text{dedup}}}{\nu_{\text{tok}}}
$$
*(Eq. 7.1)* where Z = raw acquired bytes, γ_ext = fraction of bytes surviving content extraction, γ_filt = fraction surviving filtering, γ_dedup = fraction surviving deduplication, ν_tok = mean UTF-8 bytes per token of the surviving text under tokenizer tok, and D_avail = available tokens (the qualifier is defined in §7.2).

```figure
id: fig-7.4
kind: calculator
title: Yield chain from raw bytes to available tokens
caption: >-
  Eq. 7.1 as an instrument. The three stage yields multiply, and the
  tokenizer enters only through ν_tok. The first state is an illustrative
  configuration, not a named corpus. The second reproduces Dolma's code row
  from P05 Table 1, whose bytes are already post-filter, so every γ is 1
  there. The third keeps those bytes and swaps in the web ν: the token
  count drops by about a third with no byte changing.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-7.1", P05]
alt: >-
  Calculator for Eq. 7.1, D_avail = Z · γ_ext · γ_filt · γ_dedup / ν_tok, with
  Z in decimal gigabytes. Illustrative defaults (not a named corpus): Z = 1,000
  GB, γ_ext = 0.5, γ_filt = 0.5, γ_dedup = 0.8, ν = 4.0 bytes per token give a
  surviving fraction of 20%, 200 GB of text and 50 B available tokens. With
  Dolma's code source from P05 Table 1 (1,043 GB post-filter, γ = 1, ν = 2.54
  under the Llama tokenizer) the output is about 411 B tokens, matching the
  reported row. The same 1,043 GB at Dolma's web ν of 3.96 (9,812 GB over
  2,479 B tokens) gives about 263 B tokens, 36% fewer.
spec:
  tex: >-
    D_{\text{avail}}^{(\text{tok})} = \frac{Z\,\gamma_{\text{ext}}\,\gamma_{\text{filt}}\,\gamma_{\text{dedup}}}{\nu_{\text{tok}}}
  equation: "7.1"
  inputs:
    - { symbol: Z, label: "raw acquired bytes Z, GB (decimal)", default: 1000, min: 1, max: 200000, scale: log10, format: integer }
    - { symbol: ge, label: "γ_ext, bytes surviving extraction", default: 0.5, min: 0.01, max: 1, step: 0.01, format: percent }
    - { symbol: gf, label: "γ_filt, bytes surviving filtering", default: 0.5, min: 0.01, max: 1, step: 0.01, format: percent }
    - { symbol: gd, label: "γ_dedup, bytes surviving deduplication", default: 0.8, min: 0.01, max: 1, step: 0.01, format: percent }
    - { symbol: nu, label: "ν_tok, UTF-8 bytes per token", default: 4, min: 1.5, max: 6, step: 0.01, format: fixed2 }
  outputs:
    - { symbol: y, label: "surviving fraction γ_ext·γ_filt·γ_dedup", formula: "ge*gf*gd", format: percent }
    - { symbol: Zs, label: "surviving text, GB", formula: "Z*ge*gf*gd", format: raw }
    - { symbol: D, label: "D_avail under tok", formula: "Z*1e9*ge*gf*gd/nu", format: tokens, emphasis: true }
states:
  - { anchor: formulation, label: "illustrative 1,000 GB raw", variables: { Z: 1000, ge: 0.5, gf: 0.5, gd: 0.8, nu: 4 }, highlight: [y, D], note: "Illustrative yields, not a named corpus. The stages multiply, so 1,000 GB raw keeps 20% of its bytes and yields 50 B tokens at 4.0 bytes per token." }
  - { anchor: mechanism, label: "Dolma code row, Llama", variables: { Z: 1043, ge: 1, gf: 1, gd: 1, nu: 2.54 }, highlight: [nu, D], note: "P05 Table 1 reports post-filter bytes, so every γ is already applied. 1,043 GB at ν ≈ 2.54 reproduces the reported 411 B Llama tokens for the code source." }
  - { anchor: observations, label: "same bytes at web ν", variables: { Z: 1043, ge: 1, gf: 1, gd: 1, nu: 3.96 }, highlight: [nu, D], note: "Planned at Dolma's web ν (9,812 GB / 2,479 B ≈ 3.96), the same code bytes give 263 B tokens, 36% short of 411 B. This is the per-source ν error the Observations infer." }
```

The per-source acquisition cost has three separable terms:

$$
K_{\text{src}} \;=\; \underbrace{k_{\text{acq}}}_{\text{licence, crawl, API, egress}} \;+\; \underbrace{\phi_{\text{store}} \cdot \textstyle\sum_{s} Z_s\, \Delta_s}_{\text{bytes} \times \text{retention time, per retained stage } s} \;+\; \underbrace{\phi_{\text{cpu}} \cdot h_{\text{ext}}}_{\text{extraction and parsing core-hours}}
$$
*(Eq. 7.2)* where k_acq = one-off acquisition cost, Z_s = bytes retained at stage s (raw, extracted, filtered), Δ_s = retention duration of that stage, ϕ_store and ϕ_cpu = unit prices, h_ext = core-hours of extraction. Every symbol except Z_s is deployment-specific (ASSUMED as inputs; no public price is quoted in this chapter).

> **Assumption.** γ_ext, γ_filt, γ_dedup are treated as independent scalars per source. · *sensitivity:* they are not independent — extraction quality changes what filters and deduplication see (FineWeb and DCLM both measure this, §7.3) — so Eq. 7.1 is an accounting identity for a *fixed pipeline version*, not a predictive model across pipelines.

## Mechanism

The nine categories, with every numeric cell attributed; cells without a public, attributable figure are qualitative.

| Category | Unit of sampling | Typical supervision | Dominant provenance risk | Cost line (acquisition · storage · tokens after extraction) |
|---|---|---|---|---|
| **Web** | one fetched URL response (a WARC record), after extraction one page text | self-supervised next-token targets; URL, crawl date, language score as incidental metadata | author and licence unknown per page; boilerplate, machine-generated and templated text; page may have been removed at source since the crawl | acquisition near-free from Common Crawl's public bucket, hosted "on the bucket s3://commoncrawl/" (OFFICIAL-DOCUMENTATION · R7.9); storage dominated by raw WARC; yield low: Dolma reports that CCNet alone "filters out 84.2% of the content in Common Crawl, from 175.1 TB to 27.7 TB" (PAPER-REPORTED · P05) |
| **Books** | one book (or chapter when split) | self-supervised; long-range structure | unauthorised hosts; Books3 was "derived from a copy of the contents of the Bibliotik private tracker" (PAPER-REPORTED · P03), and RedPajama states "We originally included Books3 as well but took it down due to copyright issues" (PAPER-REPORTED · R7.3) | licensed acquisition cost NOT-DISCLOSED for any lab; public-domain acquisition near-free; tokens per document high: Dolma's Project Gutenberg subset is 0.056 M documents for 6.0 B Llama tokens (PAPER-REPORTED · P05) |
| **Science** | one paper, after PDF or LaTeX parsing | self-supervised; citation and field metadata available as weak labels | publisher licence heterogeneity; parser errors in formulas and tables silently alter content | parsing cost dominates; Dolma's peS2o subset is 38.8 M documents, 268 GB, 70 B Llama tokens, "derived from the Semantic Scholar Open Research Corpus" (PAPER-REPORTED · P05) |
| **Code** | one file; one repository when repository-level context is built | self-supervised; licence, path, language, stars as metadata; tests as latent execution-grounded targets ([§4.3](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-3-code-and-structured-sequences.md)) | per-file licence unknown: The Stack v2 reports that a repository-level licence was unavailable "for 96.93% of repositories" and was replaced by file-level detection (PAPER-REPORTED · R7.12) | acquisition via archive (Software Heritage) or platform dumps; bytes-per-token low under text tokenizers: Dolma's Stack subset gives 1,043 GB / 411 B Llama tokens ≈ 2.5 bytes/token versus ≈ 4.0 for its Common Crawl subset (DERIVED from P05 Table 1) |
| **Mathematics** | one web page or document containing mathematical notation | self-supervised; occasionally problem–solution pairs | the corpus is defined by a classifier, so its boundary is a model artefact; benchmark problems are over-represented on the web | selection cost dominates: DeepSeekMath reduces Common Crawl to "40B HTML web pages" before classifier recall and retains a corpus it reports as 120B tokens (PAPER-REPORTED · P25; tokenizer not stated in the passages inspected, NOT-DISCLOSED) |
| **Dialogue** | one thread, one submission, or one comment — the choice is a design variable | self-supervised; reply structure as weak supervision | platform terms change after collection: Dolma records that "Pushshift no longer distributes this dataset due to changes to the Reddit API's terms" (PAPER-REPORTED · P05) | small in bytes (Dolma Reddit: 339 GB, 89 B Llama tokens) (PAPER-REPORTED · P05); unit choice changes downstream quality: Dolma reports that treating submissions and comments as independent documents performed better in its ablation (PAPER-REPORTED · P05) |
| **Enterprise records** | one ticket, email, document, or database row with its access-control context | often labelled by workflow outcome (resolution code, approval) | contractual purpose limitation and tenant isolation; records about third parties who never consented | acquisition cost is contractual, not computational; all sizes NOT-DISCLOSED for every organisation the book inspected; storage must preserve access boundaries (§7.4) |
| **User interactions** | one conversation, or one prompt with its responses | demonstrations, comparisons, ratings, implicit feedback | consent scope and withdrawal; InstructGPT reports that Playground users "were informed that their data could be used to train further models via a recurring notification" and that production API data was not used (PAPER-REPORTED · P21); WildChat collected transcripts in exchange for "affirmative, consensual opt-in" (PAPER-REPORTED · R7.22) | near-zero acquisition cost, high governance cost; volumes of any production assistant NOT-DISCLOSED |
| **Simulation** | one episode or trajectory with state, action, observation, reward | environment-defined: returns, verifier outcomes, test verdicts | generator identity and version: the "source" is a program plus a policy, so provenance is a (simulator revision, policy revision, seed) triple | acquisition cost is compute, paid per episode; storage depends on observation modality; token yield is a serialisation choice owned by [§11.5](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md) (UNVERIFIED for any named system) |

```figure
id: fig-7.5
kind: stat-panel
title: Per-source accounting behind the cost-line column
caption: >-
  The five Dolma v1.6 sources that map onto this table's categories, from P05
  Table 1 under one tokenizer (Llama). The counts are PAPER-REPORTED; every
  ratio is derived here. Read the bytes-per-token rows against each other.
  Web, dialogue and science sit between 3.8 and 4.0 bytes per token, code
  sits at 2.54, and a book carries about sixty times as many tokens per
  document as a paper. The block glyph is the share of Llama tokens.
placement: rail
anchor: mechanism
evidence: DERIVED
source: [P05]
alt: >-
  Instrument panel from P05 Table 1, Dolma v1.6, Llama tokens. Bytes per token:
  web (Common Crawl) 9,812 GB over 2,479 B tokens, 3.96; code (GitHub) 1,043
  GB over 411 B, 2.54; dialogue (Reddit) 339 GB over 89 B, 3.81; science
  (peS2o) 268 GB over 70 B, 3.83; books (Project Gutenberg) 20.4 GB over 6.0 B,
  3.40. Code ν divided by web ν is 0.64. Tokens per document: science 70 B over
  38.8 M documents, about 1,804; books 6.0 B over 0.056 M documents, about
  107,143. Web holds 81% of the 3,059 B Llama tokens. Block glyph by tokens:
  web 2,479, code 411, dialogue 89, science 70, books 6.0, encyclopedic 4.3.
spec:
  header: "DOLMA v1.6 · P05 TABLE 1 · LLAMA TOKENS"
  variables: { Bcc: 9812, Tcc: 2479, Bgh: 1043, Tgh: 411, Brd: 339, Trd: 89, Bs2: 268, Ts2: 70, Ds2: 38.8, Bpg: 20.4, Tpg: 6.0, Dpg: 0.056, Tall: 3059 }
  rows:
    - { key: "web (Common Crawl), bytes/token", formula: "Bcc/Tcc", format: fixed2, note: "9,812 GB / 2,479 B" }
    - { key: "code (GitHub), bytes/token", formula: "Bgh/Tgh", format: fixed2, note: "1,043 GB / 411 B" }
    - { key: "dialogue (Reddit), bytes/token", formula: "Brd/Trd", format: fixed2, note: "339 GB / 89 B" }
    - { key: "science (peS2o), bytes/token", formula: "Bs2/Ts2", format: fixed2, note: "268 GB / 70 B" }
    - { key: "books (Gutenberg), bytes/token", formula: "Bpg/Tpg", format: fixed2, note: "20.4 GB / 6.0 B" }
    - { key: "code ν ÷ web ν", formula: "(Bgh/Tgh)/(Bcc/Tcc)", format: ratio }
    - { key: "science, tokens per document", formula: "Ts2*1e9/(Ds2*1e6)", format: integer, note: "70 B / 38.8 M documents" }
    - { key: "books, tokens per document", formula: "Tpg*1e9/(Dpg*1e6)", format: integer, note: "6.0 B / 0.056 M documents" }
    - { key: "web share of Llama tokens", formula: "Tcc/Tall", format: percent, note: "of 3,059 B" }
  glyph:
    type: blocks
    items:
      - { label: "web", weight: 2479 }
      - { label: "code", weight: 411, emphasis: true }
      - { label: "dialogue", weight: 89 }
      - { label: "science", weight: 70 }
      - { label: "books", weight: 6.0 }
      - { label: "encyclopedic", weight: 4.3 }
states:
  - { anchor: mechanism, label: "cost line in numbers", highlight: ["web (Common Crawl), bytes/token", "code (GitHub), bytes/token", "books, tokens per document"], note: "The table's cost-line column in numbers. Books are dense per document (≈107k tokens each), code is cheap per token (2.54 bytes), and web is 81% of all tokens." }
  - { anchor: observations, label: "code ν ÷ web ν", highlight: ["code ν ÷ web ν"], note: "The Observations' ≈ 2.5 vs ≈ 4.0: code packs 0.64× the bytes per Llama token of web text, so one corpus-wide ν misplans code-heavy mixtures." }
  - { anchor: failure-modes, label: "tokenizer-free sizes", highlight: ["web (Common Crawl), bytes/token", "code (GitHub), bytes/token"], note: "Every ratio here holds for the Llama tokenizer only. Recount under the run's tokenizer before reusing a size (Appendix C rule)." }
```

Three observations follow from the table. First, *the unit of sampling is a decision with measurable consequences*, not a given: Dolma's Reddit ablation and FIM's document-versus-context choice ([§4.3](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-3-code-and-structured-sequences.md)) are both unit decisions. Second, *the cheapest bytes carry the least provenance*: web pages arrive with a URL and a fetch time and nothing else, while enterprise and interaction records arrive with strong identity and therefore strong obligations. Third, *a category can be manufactured by a classifier*: the DeepSeekMath corpus and FineWeb-Edu are subsets of web data selected by a learned model (PAPER-REPORTED · P25, P06); their source category remains *web*, and the selector is recorded on the quality axis of §7.2, not as a new origin.

```figure
id: fig-7.6
kind: diagram
title: Custody decides the category; a classifier selects inside it
caption: >-
  Two classifiers carve subsets out of one web custodian, and both subsets
  keep origin = web: the selector goes on the quality axis. Books3 looks like
  books by content, but its custody chain ends at a private tracker, so the
  emphasised edge assigns it by custody to unknown. That is Algorithm 7.1
  line 2 applied to the case RedPajama later took down. Project Gutenberg
  shows the contrast: an identified custodian makes the books label
  legitimate.
placement: inline
evidence: PAPER-REPORTED
source: [P03, R7.3, P05, P06, R7.6, P25]
concepts: [ms.section.7.1, ms.section.7.2]
alt: >-
  Diagram. The Common Crawl archive, custodian Common Crawl Foundation, feeds
  two selectors: the FineWeb-Edu classifier (labels from Llama3-70B-Instruct,
  threshold 3) produces the FineWeb-Edu subset, and the DeepSeekMath
  classifier (fastText seeded from OpenWebMath) produces the DeepSeekMath
  Corpus of 120 B tokens with the tokenizer not disclosed. Both subsets keep
  origin web, with the selector recorded on the quality axis. Separately, the
  Bibliotik private tracker, an unauthorised host, is the custody chain of
  Books3, a Pile constituent whose content looks like books. An emphasised
  edge assigns it by custody to source category unknown with an unresolved
  provenance flag; RedPajama later took Books3 down due to copyright issues.
  Project Gutenberg, with an identified custodian, 0.056 M documents and 6.0 B
  Llama tokens, is assigned to books.
spec:
  direction: LR
  nodes:
    - { id: cc, kind: dataset, label: "Common Crawl archive", sub: "custodian: Common Crawl Foundation", group: web }
    - { id: fwe, kind: process, label: "FineWeb-Edu classifier", sub: "Llama3-70B-Instruct labels, threshold 3", group: web }
    - { id: dsm, kind: process, label: "DeepSeekMath classifier", sub: "fastText seeded from OpenWebMath", group: web }
    - { id: s1, kind: dataset, label: "FineWeb-Edu subset", sub: "origin: web · selector on quality axis", group: web }
    - { id: s2, kind: dataset, label: "DeepSeekMath Corpus", sub: "origin: web · 120 B tokens, tokenizer ND", group: web }
    - { id: bib, kind: boundary, label: "Bibliotik private tracker", sub: "unauthorised host" }
    - { id: b3, kind: dataset, label: "Books3 (Pile constituent)", sub: "content looks like books" }
    - { id: unk, kind: state, label: "source_category = unknown", sub: "Algorithm 7.1 line 2: unresolved provenance" }
    - { id: rp, kind: state, label: "RedPajama: taken down", sub: "'due to copyright issues' (R7.3)" }
    - { id: pg, kind: dataset, label: "Project Gutenberg", sub: "0.056 M docs · 6.0 B Llama tokens (P05)" }
    - { id: bk, kind: state, label: "source_category = books", sub: "custodian identified" }
  edges:
    - { from: cc, to: fwe }
    - { from: fwe, to: s1 }
    - { from: cc, to: dsm }
    - { from: dsm, to: s2 }
    - { from: bib, to: b3, kind: dependency, label: "custody chain" }
    - { from: b3, to: unk, kind: emphasis, label: "category from custody, not content" }
    - { from: b3, to: rp, kind: dependency, label: "later removed" }
    - { from: pg, to: bk, label: "category from custody" }
  groups:
    - { id: web, label: "web: one custodian, many selectors" }
```

Cost line for this mechanism: classification itself costs one enum field per record and nothing else (DERIVED); the costs it exposes are those of Eq. 7.1–7.2.

## Algorithm

```text
Algorithm 7.1 — Source-category assignment and yield ledger
INPUT   candidate dataset X with acquisition manifest M (URIs, fetch times, custodian, terms reference), tokenizer tok
OUTPUT  inventory row r with fields {source_category, unit_of_sampling, supervision, provenance_risk, Z, γ_ext, γ_filt, γ_dedup, ν_tok, D_avail^(tok)}
STATE   none across datasets
INVARIANT  source_category is decided from M (custody chain), never from content; D_avail is always reported with tok
1  cat ← category implied by M.custodian and M.acquisition_method           # crawl → web; archive of repos → code; …
2  if M is missing or does not identify a custodian:  cat ← "unknown"; flag unresolved_provenance (§7.5)
3  u ← unit declared by the build (page | book | paper | file | repo | thread | conversation | record | episode)
4  Z ← Σ bytes of raw acquired objects listed in M
5  for stage s in (extract, filter, dedup):  γ_s ← bytes_out(s) / bytes_in(s)   # from the build's own counters
6  ν_tok ← bytes(text_out) / tokens_tok(text_out) on the full output, or on a stated random sample with its size
7  D_avail ← Z · γ_ext · γ_filt · γ_dedup / ν_tok                                 # Eq. 7.1; equals tokens_tok(text_out) when computed on the full output
8  emit r; terminate
```
Complexity: O(1) per dataset given stage counters; line 6 is one tokenizer pass, O(bytes). The invariant on line 1 is the point: content-based category guesses ("this looks like a book") are how unauthorised copies enter a corpus under a benign label.

```figure
id: fig-7.7
kind: diagram
title: Algorithm 7.1 as a ledger from manifest to D_avail
caption: >-
  The emphasised path is the yield chain of Eq. 7.1. Each stage divides its
  own output bytes by its input bytes, and the tokenizer pass is the only
  place tok enters, so D_avail is always reported with it. The branch
  before the chain is the invariant: category comes from the manifest's
  custodian. A missing custodian does not stop the ledger. It writes unknown
  and raises a flag that §7.4 and §7.5 must carry. The stage group is one
  fixed pipeline version, the condition under which the γ are meaningful.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-7.1", "DERIVED:alg-7.1"]
concepts: [ms.section.7.1]
alt: >-
  Diagram of Algorithm 7.1. The acquisition manifest M (URIs, fetch times,
  custodian, terms reference) feeds a branch asking whether the custodian is
  identified. If not, the row records source category unknown with an
  unresolved-provenance flag for §7.4 and §7.5. If so, the category is taken
  from custody and the raw objects of Z bytes enter the emphasised chain:
  extract with γ_ext = bytes out over bytes in, filter with γ_filt,
  deduplicate with γ_dedup, all inside one fixed pipeline version, giving
  surviving text of Z·γ_ext·γ_filt·γ_dedup bytes; a tokenizer pass measures
  ν_tok as bytes over tokens at O(bytes) cost and yields D_avail under tok
  (Eq. 7.1). D_avail and the category feed the inventory row: category, unit,
  supervision, risk and yield chain.
spec:
  direction: LR
  nodes:
    - { id: m, kind: dependency, label: "acquisition manifest M", sub: "URIs, fetch times, custodian, terms" }
    - { id: cat, kind: branch, label: "custodian identified?", sub: "lines 1–2" }
    - { id: ucat, kind: state, label: "unknown + unresolved_provenance", sub: "flag carried to §7.4, §7.5" }
    - { id: raw, kind: dataset, label: "raw objects", sub: "Z bytes (line 4)" }
    - { id: ext, kind: process, label: "extract", sub: "γ_ext = bytes_out / bytes_in", group: pipe }
    - { id: filt, kind: process, label: "filter", sub: "γ_filt", group: pipe }
    - { id: dd, kind: process, label: "deduplicate", sub: "γ_dedup", group: pipe }
    - { id: txt, kind: dataset, label: "surviving text", sub: "Z·γ_ext·γ_filt·γ_dedup bytes" }
    - { id: tok, kind: process, label: "tokenizer pass under tok", sub: "ν_tok = bytes / tokens; O(bytes)" }
    - { id: d, kind: metric, label: "D_avail^(tok)", sub: "Eq. 7.1; never without tok", emphasis: true }
    - { id: row, kind: dataset, label: "inventory row r", sub: "category · unit · supervision · risk · yield" }
  edges:
    - { from: m, to: cat }
    - { from: cat, to: ucat, label: "no custodian" }
    - { from: cat, to: raw, label: "category from custody" }
    - { from: raw, to: ext, kind: emphasis }
    - { from: ext, to: filt, kind: emphasis }
    - { from: filt, to: dd, kind: emphasis }
    - { from: dd, to: txt, kind: emphasis }
    - { from: txt, to: tok, kind: emphasis }
    - { from: tok, to: d, kind: emphasis }
    - { from: d, to: row }
    - { from: ucat, to: row, kind: dependency }
  groups:
    - { id: pipe, label: "one fixed pipeline version (Eq. 7.1 assumption)" }
```

## Implementation

The reference stack (`AI_REFERENCE_STACK.md` §4) contains no acquisition or corpus-processing system; its first data-touching entries are on the consumption side. The systems named here are therefore placed honestly:

- **Hugging Face Transformers** (#26, *Model definition / adaptation*) supplies the tokenizer objects with which ν_tok and D_avail are computed; FineWeb's per-record `token_count` is "number of tokens when applying the `gpt2` tokenizer to this sample" (OFFICIAL-DOCUMENTATION · R7.5).
- **PyTorch** (#17, *Model / autograd framework*) and **Nanotron** (#35, *Distributed training*) are the consumers: FineWeb's ablation models were trained "using `nanotron`" (OFFICIAL-DOCUMENTATION · R7.5).
- *Outside the reference stack, routed via the plan's FineWeb and Dolma anchors:* `datatrove` (Hugging Face), the Dolma toolkit (Ai2), CCNet, and Hugging Face Datasets, which the plan lists as a primary implementation anchor in Appendix B. `datatrove` documents a `Document` object with `text`, `id`, and "`metadata` a dictionary where any additional info may be stored" (OFFICIAL-DOCUMENTATION · R7.15) — the natural carrier for `source_category`.

```text
Systems trace (per-source acquisition)
acquire → latency: network-bound / memory: streaming / compute: negligible / communication: egress from custodian / failure: partial manifests, moved URIs
store raw → latency: n/a / memory: Z bytes × retention time / compute: none / communication: replication / failure: raw deleted before lineage audit
extract → latency: CPU-bound / memory: per-document / compute: h_ext core-hours / communication: shard I/O / failure: silent content loss (§7.3)
count tokens → latency: one tokenizer pass / memory: streaming / compute: O(bytes) / communication: none / failure: tokenizer not recorded
```

## Experimental design

### Experiment 7.1 — Per-category yield and bytes-per-token audit

- **Hypothesis:** for a fixed pipeline version, γ_ext and ν_tok differ between source categories by more than their within-category variation across shards, so a single corpus-wide yield or bytes-per-token constant misestimates D_avail per source.
- **Setup:** one build of a multi-source corpus with stage counters enabled; Algorithm 7.1 per source and per shard.
- **Independent variables:** source category; tokenizer tok ∈ {a text-trained BPE, a code-aware BPE} (ASSUMED choices).
- **Controlled variables:** pipeline commit, filter configuration, deduplication scope, sample seed.
- **Dataset/workload:** Dolma v1.6 sources as published (web, code, social, papers, books, encyclopedic) (P05).
- **Hardware:** CPU only.
- **Metrics:** γ_ext, γ_filt, γ_dedup per source; ν_tok with a shard-bootstrap interval; relative error of D_avail when a corpus-wide ν is substituted.
- **Baselines:** corpus-wide constants.
- **Expected result:** code ν_tok materially below web ν_tok under the text-trained tokenizer, as the Dolma table already implies (DERIVED); magnitude under a code-aware tokenizer UNVERIFIED.
- **Ablation:** unit of sampling for dialogue (thread vs comment).
- **Interpretation:** whether per-source token budgets can be planned from bytes alone.
- **Threats to validity:** published byte counts are post-filter; raw-stage counters for Dolma are only partly public.

Proposal only; no run was executed.

## Observations

**What the paper claims.** P03 reports 22 constituents with per-constituent weights and epochs and a three-tier consent classification (public, ToS-compliant, authorial consent). P05 reports per-source bytes, documents, words, and Llama tokens and a datasheet answer on how raw data can be recovered per source. P21 and R7.22 report two different consent mechanisms for interaction data. R7.12 reports that repository-level licences were unavailable for 96.93% of repositories (all PAPER-REPORTED).

**What the evidence shows.** These are self-reports by corpus builders; the per-source counts are verifiable in principle because the corpora are downloadable, but this edition did not recount them. The consent mechanisms are described by the collecting organisation only; no independent audit of either is known to the book.

**What we infer.** The bytes-per-token gap between Dolma's code and web subsets (≈ 2.5 vs ≈ 4.0 under the Llama tokenizer) is DERIVED from one table and is consistent with that paper's own fertility analysis; we infer (ASSUMED) that any token budget planned in bytes without a per-source ν_tok carries an error of that order for code-heavy mixtures.

**What remains unknown.** Licensed-acquisition costs for books and science, and the volume and composition of enterprise and interaction data in any production model, are NOT-DISCLOSED. The share of machine-generated text inside each category after 2022 is UNVERIFIED; DCLM-Pool omits 2023 onward partly "to prevent large amounts of language model generated text from polluting our datasets" (PAPER-REPORTED · P07), which is a stated motive, not a measurement.

## Failure modes

> **Failure mode — Category laundering.** *Symptom:* a subset labelled "books" or "papers" cannot be traced to a publisher, archive, or rights holder. *Cause:* category assigned from content instead of custody chain. *Detection:* Algorithm 7.1 line 2 fires; lineage completeness (§7.3) near zero for the subset. *Mitigation:* assign `unknown` and carry the unresolved-provenance flag into the admissible-use predicate (§7.4).

> **Failure mode — Unit drift.** *Symptom:* deduplication and train/evaluation splits disagree about what a "document" is; near-identical records straddle the split. *Cause:* the unit of sampling changed between pipeline stages (file → repository, comment → thread). *Detection:* record-count ratios between stages that are not explained by filters. *Mitigation:* fix the unit in the inventory row and split on it, as InstructGPT did by user/organisation id (PAPER-REPORTED · P21).

> **Failure mode — Tokenizer-free sizes.** *Symptom:* two corpora are compared by "tokens" and the conclusion reverses when recounted. *Cause:* counts under different tokenizers (gpt2, Llama, GPT-NeoX, SpaCy words). *Detection:* a size without a tokenizer id. *Mitigation:* Appendix C rule — name the tokenizer; §7.6 applies it to every case study.

> **Failure mode — Custodian disappearance.** *Symptom:* raw data can no longer be re-acquired. *Cause:* platform terms or hosting change (the Pushshift case). *Detection:* periodic re-resolution of manifest URIs. *Mitigation:* retain raw snapshots where the rights record permits, and record when it does not.

## Siblings

**Orthogonal dataset axes** — [07-2-orthogonal-dataset-axes.md](07-2-orthogonal-dataset-axes.md)
Why it exists: categories alone conflate origin with language, role, and quality. What assumption changed: a dataset is a point in a product of independent attribute spaces. What objective changed: none. What problem it solved: "SFT data" and "web data" stop competing for the same slot. What new failure mode it introduced: attribute vectors with missing coordinates. Changed primitive: one label → typed vector.

**Generator design (synthetic sources)** — [§11.1](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-1-generator-design.md)
Why it exists: data whose source is a model, not a custodian. What assumption changed: the generating process is controllable and versioned. What objective changed: supervision is designed, not found. What problem it solved: scarce target types. What new failure mode it introduced: distributional collapse and teacher-rights inheritance. Changed primitive: acquisition → generation.

**Retrieval corpus construction** — [§49.1](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/49-1-corpus-construction.md)
Why it exists: the same sources consumed at inference time rather than in gradients. What assumption changed: records must stay addressable and deletable online. What objective changed: relevance, not likelihood. What problem it solved: freshness. What new failure mode it introduced: permission leaks at query time. Changed primitive: static snapshot → live index.

## Extensions

For domain adaptation the category list is unchanged but the custodian is usually a single institution, which makes enterprise-record governance the binding constraint ([§22.2](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-2-distribution-transitions.md)). For multimodality the unit of sampling becomes a (media object, caption/transcript) pair and provenance risk attaches to each element separately (proposal; ASSUMED). For agents and embodiment, simulation dominates, and the source identifier must include simulator and policy revisions, as Appendix C requires for RL rollouts.

## Limitations

The nine categories are a working partition, not a theory; hybrid sources (a forum of code snippets, a wiki of theorems) belong to the category of their custody chain and get their content described on the domain axis. The cost line is qualitative wherever no public figure exists, and Eq. 7.2 cannot be evaluated without deployment-specific prices. The section is falsified as a useful abstraction if Experiment 7.1 shows within-category variation in yield and ν_tok as large as between-category variation.

## Reproducibility

Versions: P03 (ar5iv rendering), P05 (arXiv HTML v2, the manuscript states it "was prepared for Dolma v.1.6"), P06, P07, P21, P25, R7.3, R7.12, R7.22 — all accessed 2026-09-20. Artifacts: inventory columns `source_category`, `unit_of_sampling`, `supervision`, `provenance_risk`, `yield_chain`, `bytes_per_token`, `tokenizer_id` in [verification.md](verification.md). Metric definitions: Eq. 7.1–7.2. Unresolved: all acquisition prices (NOT-DISCLOSED); machine-generated share per category (UNVERIFIED).

## References

P03, P05, P06, P07, P21, P25, R7.3, R7.5, R7.9, R7.12, R7.15, R7.22; Eq. 7.1, 7.2.
