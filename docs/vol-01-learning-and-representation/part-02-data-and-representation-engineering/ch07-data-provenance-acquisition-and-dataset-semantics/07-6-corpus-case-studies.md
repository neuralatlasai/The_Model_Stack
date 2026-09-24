---
id: ms.section.7.6
entity_type: section
title: Corpus case studies
short_title: Corpus case studies
volume: 1
part: 2
chapter: 7
section: 7.6
slug: 07-6-corpus-case-studies
parent: ms.chapter.7
prev_sibling: ms.section.7.5
next_sibling: ms.verification.7
children: []
prerequisites: [ms.section.6.3, ms.section.7.1, ms.section.7.2, ms.section.7.3, ms.section.7.4, ms.section.7.5]
downstream: [ms.section.8.2, ms.section.8.3, ms.section.9.1, ms.section.9.5, ms.section.10.3, ms.section.22.2, ms.section.61.4]
related: [ms.section.4.6, ms.section.21.6]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P02}
  - {type: supported_by, target: paper.P03}
  - {type: supported_by, target: paper.P04}
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P06}
  - {type: supported_by, target: paper.P07}
  - {type: evaluated_by, target: ms.verification.7}
axes: {lifecycle: [data, pretraining], mechanism: [dataset_record, corpus_comparison, token_accounting], feedback_setting: [], modality: [text, code]}
papers: [P02, P03, P04, P05, P06, P07, P25]
implementations: [impl.hugging-face-transformers, impl.pytorch, impl.nanotron]
benchmarks: []
datasets: [ds.c4, ds.the-pile, ds.redpajama, ds.refinedweb, ds.dolma, ds.fineweb, ds.fineweb-edu, ds.fineweb-2, ds.dclm, ds.the-stack-v2]
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2400
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 7.6 Corpus case studies

## Scope

Objective: write one **Dataset record** (contract §5; Appendix C mandatory fields) for each corpus the plan names — C4/T5, The Pile, RedPajama, RefinedWeb, Dolma, FineWeb / FineWeb-Edu / FineWeb2, DCLM, a code corpus (The Stack v2), and multilingual coverage (FineWeb2, mC4) — using only values found in the paper, official repository, or official dataset card opened for this edition, with `NOT-DISCLOSED` wherever the inspected source is silent. Every token count names its tokenizer and its qualifier (available / sampled / consumed); counts under different tokenizers are never placed on one axis. Baseline: a table of corpora ordered by advertised size. Success: the reader can tell, for any pair of corpora, which fields make them comparable and which do not. Boundaries: filtering and deduplication *methods* are [Chapter 08](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/README.md); mixture weights are [§9.1](../ch09-data-mixtures-curricula-and-sample-efficiency/09-1-mixture-formulation.md); tokenizer economics are [§10.3](../ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md). No corpus was downloaded or recounted for this edition.

## Why this exists

What failed before was the family name used as an experimental treatment. "Trained on C4" can mean the 2019 TFDS release, the Hugging Face `allenai/c4` mirror, `en.noblocklist`, or mC4; "Dolma" can mean v1.5, v1.6 (the manuscript version), or v1.7, whose source lists differ (OFFICIAL-DOCUMENTATION · R7.19). The bottleneck that appeared was token arithmetic across tokenizers: FineWeb reports its size in gpt2 tokens, Dolma v1.6 in Llama tokens, Dolma v1.7 in OLMo tokens, DCLM in GPT-NeoX tokens, C4's documenters in SpaCy word tokens, and FineWeb2 refuses to report subword tokens at all because the count "heavily depends on whether the tokenizer was trained with that language, and its script, in mind" (OFFICIAL-DOCUMENTATION · R7.5, R7.19, P07, R7.28, R7.7). The constraint that became dominant is that the *same* corpus can be reported under several tokenizers and several qualifiers, so any cross-corpus statement needs the record, not the name. What changed is that the case-study corpora now publish enough of the Appendix C fields that a record can be filled from primary sources — and the gaps are themselves informative, because they are the same gaps in every corpus: retention conditions, contamination results, and content-level rights.

## Intuition

Each corpus is the output of a selection program over a source universe. Two programs can emit the same number of tokens while exposing a model to different languages, repetition patterns, and document boundaries; two releases of one family can share most bytes and differ in how they were filtered and documented. Physically, what a reader can *reacquire* differs by corpus: DCLM-Pool ships WARC identifiers and is hosted by Common Crawl; The Stack v2 ships blob ids that resolve to Software Heritage; The Pile's Books3 constituent resolves to a private tracker copy. A useful comparison asks what can be reacquired, reprocessed, audited, and retrained separately (DERIVED). Heuristically corpora are "cleaner" or "dirtier"; mechanically they differ in the tuple of Eq. 7.12.

```figure
id: fig-7.29
kind: diagram
title: What a training record resolves to, corpus by corpus
caption: >-
  Follow each record's identifier to its custodian. The emphasised route is
  the strongest published one: DCLM keeps one WARC file per jsonl file, so a
  record replays and a Common Crawl redaction propagates. FineWeb and The
  Stack v2 also resolve to an archive by identifier, Dolma by intersecting
  ids, and peS2o through metadata. The two dashed edges are dead ends. Books3
  resolves only to a private tracker copy, and the Reddit source to an
  interface that no longer distributes.
placement: wide
evidence: PAPER-REPORTED
source: [P07, R7.4, R7.5, R7.12, R7.13, P05, P03]
concepts: [ms.section.7.6, ms.section.7.3]
alt: >-
  Diagram of reacquisition routes. A DCLM-Pool record carries WARC-Record-ID
  and WARC-Target-URI and resolves, on the emphasised route, to the Common
  Crawl WARC archive at s3://commoncrawl/, one WARC file per jsonl file. A
  FineWeb record resolves to the same archive through its urn:uuid id and
  file_path. A Dolma record resolves to it by intersecting Dolma ids with WARC
  files to recover HTML. A Stack v2 file resolves by blob_id or SWHID to the
  Software Heritage archive, graph version 2023-09-06, fetched from its S3
  bucket. A Dolma peS2o paper resolves through S2ORC metadata to the original
  PDF. Two dead ends: Books3, a Pile constituent, resolves only to a copy on
  the Bibliotik private tracker, which is not a rights holder; Dolma's Reddit
  source resolves to Pushshift dumps that are no longer distributed.
spec:
  direction: LR
  nodes:
    - { id: dclm, kind: dataset, label: "DCLM-Pool record", sub: "WARC-Record-ID, WARC-Target-URI", group: rec }
    - { id: fw, kind: dataset, label: "FineWeb record", sub: "id (urn:uuid) + file_path", group: rec }
    - { id: dol, kind: dataset, label: "Dolma web record", sub: "Dolma id", group: rec }
    - { id: stk, kind: dataset, label: "The Stack v2 file", sub: "blob_id / SWHID", group: rec }
    - { id: s2, kind: dataset, label: "Dolma peS2o paper", sub: "S2ORC metadata", group: rec }
    - { id: b3, kind: dataset, label: "Books3 book (The Pile)", sub: "no identifier to a rights holder", group: rec }
    - { id: rd, kind: dataset, label: "Dolma Reddit record", sub: "Pushshift dump, March 2023", group: rec }
    - { id: cc, kind: dataset, label: "Common Crawl WARC archive", sub: "s3://commoncrawl/", group: cus }
    - { id: sh, kind: dataset, label: "Software Heritage archive", sub: "graph 2023-09-06; S3 bucket", group: cus }
    - { id: pdf, kind: dataset, label: "original PDF", sub: "via S2ORC", group: cus }
    - { id: bib, kind: boundary, label: "Bibliotik private tracker", sub: "a copy, not a custodian of rights" }
    - { id: ps, kind: dependency, label: "Pushshift", sub: "no longer distributes (Reddit API terms)" }
  edges:
    - { from: dclm, to: cc, kind: emphasis, label: "one WARC file ↔ one jsonl file" }
    - { from: fw, to: cc, label: "id + file_path" }
    - { from: dol, to: cc, label: "ids ∩ WARC recover HTML" }
    - { from: stk, to: sh, label: "fetch blob by id" }
    - { from: s2, to: pdf, label: "metadata" }
    - { from: b3, to: bib, kind: dependency, label: "resolves only to a copy" }
    - { from: rd, to: ps, kind: dependency, label: "interface closed" }
  groups:
    - { id: rec, label: "training records and their identifiers" }
    - { id: cus, label: "custodian archives that resolve them" }
```

## Formulation

For a controlled comparison, define the corpus treatment as

$$
\chi \;=\; (u_{\mathrm{source}},\ u_{\mathrm{pipeline}},\ u_{\mathrm{release}},\ u_{\mathrm{tok}},\ u_{\mathrm{sampler}})
$$
*(Eq. 7.12)*

| Local symbol | Meaning | Required evidence |
|---|---|---|
| $u_{\mathrm{source}}$ | acquisition snapshot identity (frame of §7.5) | source manifest and observation window |
| $u_{\mathrm{pipeline}}$ | transformation identity (extractor, filters, dedup; §7.3) | code/configuration digests or versions |
| $u_{\mathrm{release}}$ | released record set | shard manifest, card version |
| $u_{\mathrm{tok}}$ | tokenizer identity under which counts are stated | repository id and revision |
| $u_{\mathrm{sampler}}$ | sampling and exposure identity (the run side of Eq. 7.4) | weights, repetition, order, seed |

Eq. 7.12 is a proposed comparison contract (ASSUMED). A family name fixes at most u_source loosely and leaves the rest unresolved. To isolate a pipeline intervention, hold u_source, u_tok, the training configuration and the *consumed* token budget fixed while u_pipeline and therefore u_release vary; if a smaller pool needs repetition to meet the budget, repetition is part of the treatment.

```figure
id: fig-7.30
kind: compare
title: Six corpora on the comparison contract χ
caption: >-
  Read along the u_tok row first. No two columns share a tokenizer, and
  three do not name one. So no size in this table divides another, and the
  family name fixes at most a loose u_source. The u_sampler row is where
  the records are thinnest; only DCLM reports a consumed budget. The last
  row is identical in every column, which is the finding: no release states
  a content hash.
placement: wide
evidence: PAPER-REPORTED
source: [P02, R7.1, R7.28, R7.3, P03, R7.2, P05, R7.19, P06, R7.5, P07, R7.4]
concepts: [ms.section.7.6, ms.section.9.1, ms.section.10.3]
alt: >-
  Comparison of six corpora on the five coordinates of Eq. 7.12 plus content
  hash. C4: source Common Crawl WET April 2019; pipeline terminal punctuation,
  bad-words list, three-sentence dedup, versions not disclosed; release TFDS
  and the allenai/c4 mirror variants; tokens 156 B SpaCy words, or 175B under
  an undisclosed tokenizer. The Pile: 22 constituents, Pile-CC from 2008 on;
  jusText on WARC; 825.18 GiB; bytes only, subword total not disclosed;
  constituent weights and epochs. RedPajama-V2: 84 WET snapshots, 2014 to
  April 2023; CCNet buckets, Bloom exact dedup, MinHash LSH; 113 B documents,
  20.8 B deduplicated head_middle; 30.4 T estimated, tokenizer not disclosed.
  Dolma v1.7: Common Crawl plus fourteen other sources; CCNet plus the Dolma
  toolkit; v1_7, 4.5 TB gzip; 2,308.5 B OLMo tokens; per-source proportions of
  50, 100 and 200%. FineWeb: WARC, 96 then 114 dumps; trafilatura, fastText,
  filters, per-crawl MinHash; v1.4.0; 18,527.0 B gpt2 tokens; ablations at 27 B
  and 350 B. DCLM-baseline: WARC 2013 to 2022; resiliparse, filters, Bloom
  dedup, fastText classifier; release 1.0; 3.8 T or 4 T, tokenizer UNVERIFIED;
  2.6 T consumed. Content hash: not disclosed for all six.
spec:
  axis: "The five coordinates of Eq. 7.12 as each corpus's own sources state them, plus the release content hash; values are not normalised across tokenizers"
  columns:
    - { id: c4, label: "C4" }
    - { id: pile, label: "The Pile" }
    - { id: rp2, label: "RedPajama-V2" }
    - { id: dolma, label: "Dolma v1.7" }
    - { id: fw, label: "FineWeb" }
    - { id: dclm, label: "DCLM-baseline" }
  rows:
    - { dimension: "u_source", values: { c4: "Common Crawl WET, April 2019 (P02)", pile: "22 constituents; Pile-CC from Common Crawl 2008 onwards (P03)", rp2: "84 monthly WET snapshots, 2014 – April 2023 (R7.3)", dolma: "CC 25 snapshots 2020-05 – 2023-06 + 14 other sources (P05, R7.19)", fw: "CC WARC; 96 dumps (paper) → 114 (card v1.4.0)", dclm: "CC WARC 2013–2022 via DCLM-Pool (P07)" } }
    - { dimension: "u_pipeline", values: { c4: "terminal punctuation, bad-words list, 3-sentence dedup; versions NOT-DISCLOSED", pile: "jusText on WARC; per-constituent; versions NOT-DISCLOSED", rp2: "CCNet head/middle/tail; Bloom exact dedup; MinHash LSH; 40+ quality signals", dolma: "CCNet + Dolma toolkit; versions NOT-DISCLOSED beyond dataset version", fw: "trafilatura, fastText ≥ 0.65, Gopher/C4/custom filters, per-crawl MinHash; datatrove commits linked", dclm: "resiliparse; RefinedWeb heuristics; Bloom dedup; fastText classifier" } }
    - { dimension: "u_release", values: { c4: "TFDS; allenai/c4 mirror (en, en.noclean, en.noblocklist, realnewslike; mC4)", pile: "825.18 GiB before held-out sets", rp2: "113 B documents; 20.8 B deduplicated head_middle", dolma: "v1_7, 4.5 TB gzip, 2024-04-15", fw: "v1.4.0 (2025-07-11); DOI 10.57967/hf/2493", dclm: "dclm-baseline-1.0" } }
    - { dimension: "u_tok, with the stated count", values: { c4: "156 B SpaCy words (R7.28); '175B' tokenizer NOT-DISCLOSED (R7.3)", pile: "bytes; subword total NOT-DISCLOSED", rp2: "30.4 T 'estimated'; tokenizer NOT-DISCLOSED", dolma: "2,308.5 B OLMo tokens", fw: "18,527.0 B gpt2 tokens", dclm: "3.8 T (paper) / 4 T (card); tokenizer UNVERIFIED; pool 240 T GPT-NeoX" } }
    - { dimension: "u_sampler", values: { c4: "NOT-DISCLOSED here", pile: "constituent weights and epochs (Books3 1.5 epochs)", rp2: "pool built for filtering; run side NOT-DISCLOSED", dolma: "q ∈ {50, 100, 200%}; stated pool 1,715.1 B", fw: "ablations sample 27 B and 350 B gpt2 tokens; nanotron", dclm: "2.6 T consumed by the reported 7B run" } }
    - { dimension: "release content hash", values: { c4: "NOT-DISCLOSED", pile: "NOT-DISCLOSED", rp2: "NOT-DISCLOSED", dolma: "NOT-DISCLOSED", fw: "NOT-DISCLOSED", dclm: "NOT-DISCLOSED" } }
```

```figure
id: fig-7.31
kind: stat-panel
title: Every headline size, with its unit and qualifier
caption: >-
  One row per record, each size in its own unit. There is deliberately no
  glyph: bars or blocks would put gpt2, OLMo, GPT-NeoX, SpaCy-word, word and
  byte counts on one axis, which §7.6 forbids. The instrument follows the
  section. The formulation lights u_tok, the mechanism the named tokenizers,
  the observations the three most-quoted families, and the failure modes a
  ratio that should never be computed.
placement: rail
anchor: formulation
evidence: PAPER-REPORTED
source: [R7.28, P03, R7.2, P04, R7.19, R7.5, R7.7, P07, R7.13, P25]
alt: >-
  Instrument panel of headline sizes with unit, qualifier and source. C4.en:
  156 B SpaCy English word tokens, available (R7.28). The Pile: 825.18 GiB of
  bytes; subword total not disclosed (P03). RedPajama-V2 deduplicated
  head_middle: 30.4 T estimated tokens, tokenizer not disclosed (R7.2).
  RefinedWeb: 5,000 GT, tokenizer not disclosed (P04). Dolma v1.7: 2,308.5 B
  available OLMo tokens (R7.19). FineWeb v1.4.0: 18,527.0 B available gpt2
  tokens (R7.5). FineWeb2: 3.34 T words under language-specific word
  tokenizers (R7.7). DCLM-Pool: 240 T available GPT-NeoX tokens (P07). DCLM
  7B run: 2.6 T consumed (P07). The Stack v2 full training set: about 900 B,
  tokenizer not disclosed (R7.13). DeepSeekMath Corpus: 120 B, tokenizer not
  disclosed (P25).
spec:
  header: "HEADLINE SIZES · UNIT · QUALIFIER"
  rows:
    - { key: "C4.en", value: "156 B", note: "SpaCy word tokens · available (R7.28)" }
    - { key: "The Pile", value: "825.18 GiB", note: "bytes · subword total NOT-DISCLOSED (P03)" }
    - { key: "RedPajama-V2 head_middle", value: "30.4 T", note: "'estimated' · tokenizer NOT-DISCLOSED (R7.2)" }
    - { key: "RefinedWeb, full", value: "5,000 GT", note: "available · tokenizer NOT-DISCLOSED (P04)" }
    - { key: "Dolma v1.7", value: "2,308.5 B", note: "available · OLMo tokenizer (R7.19)" }
    - { key: "FineWeb v1.4.0", value: "18,527.0 B", note: "available · gpt2 tokenizer (R7.5)" }
    - { key: "FineWeb2", value: "3.34 T words", note: "language-specific word tokenizers (R7.7)" }
    - { key: "DCLM-Pool", value: "240 T", note: "available · GPT-NeoX tokenizer (P07)" }
    - { key: "DCLM 7B run", value: "2.6 T", note: "consumed by the reported run (P07)" }
    - { key: "The Stack v2, full", value: "~900 B", note: "training set · tokenizer NOT-DISCLOSED (R7.13)" }
    - { key: "DeepSeekMath Corpus", value: "120 B", note: "tokenizer NOT-DISCLOSED (P25)" }
states:
  - { anchor: formulation, label: "u_tok is a coordinate", highlight: ["Dolma v1.7", "FineWeb v1.4.0", "DCLM-Pool"], note: "u_tok is one of χ's five coordinates. Dolma, FineWeb and DCLM each name a different tokenizer, so their counts differ in a treatment coordinate, not just in size." }
  - { anchor: mechanism, label: "four tokenizers NOT-DISCLOSED", highlight: ["RedPajama-V2 head_middle", "RefinedWeb, full", "The Stack v2, full", "DeepSeekMath Corpus"], note: "Four of the eleven sizes carry no tokenizer in the sources inspected. Their records say NOT-DISCLOSED rather than borrow one." }
  - { anchor: observations, label: "the most-quoted families", highlight: ["FineWeb v1.4.0", "Dolma v1.7", "DCLM-Pool"], note: "The families most quoted in secondary literature sit under gpt2, OLMo (v1.6: Llama) and GPT-NeoX. Every quote is a self-report under the builder's own tokenizer." }
  - { anchor: failure-modes, label: "cross-tokenizer ratio", highlight: ["DCLM-Pool", "FineWeb v1.4.0"], note: "Dividing 240 T GPT-NeoX tokens by 18,527.0 B gpt2 tokens gives a number with no unit. Report bytes or words as a second axis instead." }
```

For source attribution within a mixture, let s_k be the fraction of consumed tokens attributed to source k under a declared ownership rule; then

$$
\sum_k s_k \;=\; 1
$$
*(Eq. 7.13)* only when the attribution is exhaustive and non-overlapping (MATHEMATICALLY-DERIVED). Dolma v1.7 lists C4 and Common Crawl as separate sources although C4 is itself a Common Crawl derivative (OFFICIAL-DOCUMENTATION · R7.19); a document present in both must be assigned by rule or reported as overlapping membership. Unknown-origin tokens get their own bucket.

```figure
id: fig-7.32
kind: diagram
title: One crawl behind four Dolma v1.7 rows
caption: >-
  Eq. 7.13 needs non-overlapping sources. Four of the card's fifteen rows are
  Common Crawl derivatives: Dolma's CC, C4, RefinedWeb and CC News. Together
  they hold 1,804.6 of 2,308.5 B available OLMo tokens, 78%, a share derived
  from the card's rows. The emphasised path is the one Eq. 7.13 forces. A
  document present in two of these rows gets an ownership rule or an
  overlap report before any s_k is computed.
placement: inline
evidence: OFFICIAL-DOCUMENTATION
source: [R7.19, P02, P04, "DERIVED:eq-7.13"]
concepts: [ms.section.7.6, ms.section.9.1, ms.section.8.3]
alt: >-
  Diagram. Common Crawl feeds four rows of the Dolma v1.7 card: Dolma's CC,
  1,195.5 B OLMo tokens at q 50%; C4, from the April 2019 WET files, 138.4 B at
  50%; RefinedWeb, from dumps through 2023-06, 456.4 B at 100%; and CC News,
  14.3 B at 100%. Eleven other sources hold 503.8 B. All fifteen feed the
  Dolma v1.7 mixture of 2,308.5 B available tokens; the four Common Crawl rows
  are 1,804.6 B, 78%. The emphasised path leads to an ownership rule for a
  document in two rows, assign by rule or report overlap, and then to the
  condition that the attribution shares s_k sum to one only when exhaustive
  and non-overlapping. An unknown-origin bucket feeds the same condition with
  its own share.
spec:
  direction: LR
  nodes:
    - { id: cc, kind: dataset, label: "Common Crawl", sub: "WARC / WET archive" }
    - { id: dcc, kind: dataset, label: "Dolma's CC", sub: "1,195.5 B OLMo · q 50%", group: ccd }
    - { id: c4, kind: dataset, label: "C4", sub: "WET April 2019 · 138.4 B · q 50%", group: ccd }
    - { id: rw, kind: dataset, label: "RefinedWeb", sub: "dumps to 2023-06 · 456.4 B · q 100%", group: ccd }
    - { id: ccn, kind: dataset, label: "CC News", sub: "14.3 B · q 100%", group: ccd }
    - { id: oth, kind: dataset, label: "11 other sources", sub: "503.8 B available" }
    - { id: mix, kind: dataset, label: "Dolma v1.7 mixture", sub: "15 rows · 2,308.5 B available" }
    - { id: rule, kind: branch, label: "document in two rows?", sub: "ownership rule, or overlap report" }
    - { id: unk, kind: state, label: "unknown-origin bucket", sub: "its own s_k" }
    - { id: sk, kind: metric, label: "Σ_k s_k = 1", sub: "only if exhaustive and non-overlapping", emphasis: true }
  edges:
    - { from: cc, to: dcc }
    - { from: cc, to: c4 }
    - { from: cc, to: rw }
    - { from: cc, to: ccn }
    - { from: dcc, to: mix }
    - { from: c4, to: mix }
    - { from: rw, to: mix }
    - { from: ccn, to: mix }
    - { from: oth, to: mix }
    - { from: mix, to: rule, kind: emphasis }
    - { from: rule, to: sk, kind: emphasis }
    - { from: unk, to: sk, kind: dependency }
  groups:
    - { id: ccd, label: "Common Crawl derivatives: 1,804.6 B (78%)" }
```

## Mechanism

Each record uses the Appendix C mandatory fields; `NOT-DISCLOSED` means the inspected paper, repository, or card does not state the value. Token rows read *qualifier · count · tokenizer*.

**Dataset record — C4 / T5 (P02; card R7.1; audit R7.28).**

| Field | Value | Label |
|---|---|---|
| dataset ID | "Colossal Clean Crawled Corpus" (C4); TensorFlow Datasets release; Hugging Face mirror `allenai/c4` | PAPER-REPORTED · P02; OFFICIAL-DOCUMENTATION · R7.1 |
| snapshot / hash | Common Crawl "web extracted text from April 2019"; content hash NOT-DISCLOSED | PAPER-REPORTED · P02 |
| origin | web (Common Crawl WET), human-authored with measured machine-translated content | PAPER-REPORTED · P02, R7.28 |
| acquisition time | April 2019 crawl | PAPER-REPORTED · P02 |
| modality / language | text; English at `langdetect` probability ≥ 0.99; `multilingual` (mC4) variant with 108 subsets | PAPER-REPORTED · P02; OFFICIAL-DOCUMENTATION · R7.1 |
| domain | web, uncontrolled; "the single-most represented website ... is patents.google.com" | PAPER-REPORTED · R7.28 |
| unit of sampling | one URL's extracted text: "One 'document' is the text scraped from a single URL" | PAPER-REPORTED · R7.28 |
| label schema | none (self-supervised) | DERIVED |
| generator / policy | not synthetic; machine-translated patents present, generator unknown | PAPER-REPORTED · R7.28 |
| license / permission | HF mirror: ODC-BY, "bound by the Common Crawl terms of use" | OFFICIAL-DOCUMENTATION · R7.1 |
| extraction / filter / dedup versions | WET; lines ending in terminal punctuation only; "List of Dirty, Naughty, Obscene or Otherwise Bad Words" page removal; three-sentence span deduplication; versions NOT-DISCLOSED | PAPER-REPORTED · P02, P04 |
| training role (as published) | base pretraining for T5; later a component of RedPajama-V1 and Dolma | PAPER-REPORTED · P02, R7.3, P05 |
| train / evaluation membership | TFDS train/validation splits; sizes NOT-DISCLOSED here | UNVERIFIED |
| contamination results | R7.28 reports benchmark test examples present in C4.en (exact-match, normalised) | PAPER-REPORTED · R7.28 |
| retention / deletion | NOT-DISCLOSED | — |
| known limitations | blocklist "disproportionately removes text from and about minority individuals"; 51.3% of pages hosted in the US (proxy) | PAPER-REPORTED · R7.28 |
| token counts | available · "about 750 GB" (bytes, P02); available · 156 B · SpaCy English word tokens, C4.en (R7.28); available · "175B token" · tokenizer NOT-DISCLOSED (R7.3). The three figures are not on one axis. | PAPER-REPORTED |

**Dataset record — The Pile (P03).**

| Field | Value | Label |
|---|---|---|
| dataset ID | The Pile (EleutherAI) | PAPER-REPORTED · P03 |
| snapshot / hash | 825.18 GiB before held-out sets; content hash NOT-DISCLOSED | PAPER-REPORTED · P03 |
| origin | 22 constituents: web (Pile-CC), books (Books3, PG-19, BookCorpus2), science (PubMed Central, arXiv), code, dialogue, subtitles, mail (Enron), others | PAPER-REPORTED · P03 |
| acquisition time | Common Crawl "from 2008 onwards" for Pile-CC; per-constituent dates NOT-DISCLOSED here | PAPER-REPORTED · P03 |
| modality / language | text; English | PAPER-REPORTED · P03 |
| domain | multi-domain by construction | PAPER-REPORTED · P03 |
| unit of sampling | per-constituent documents; constituent weights and epochs (e.g. Pile-CC 227.12 GiB, 18.11%, 1.0 epoch; Books3 100.96 GiB, 12.07%, 1.5 epochs) | PAPER-REPORTED · P03 |
| label schema | none | DERIVED |
| generator / policy | not synthetic | PAPER-REPORTED · P03 |
| license / permission | three consent tiers (public / ToS-compliant / authorial consent), unknown treated as non-consensual; five constituents "not collected and distributed in a ToS compliant fashion"; Books3 from "the Bibliotik private tracker"; distribution licence NOT-DISCLOSED in the passages inspected | PAPER-REPORTED · P03 |
| extraction / filter / dedup versions | jusText on WARC for Pile-CC; per-constituent processing in the paper's appendix; versions NOT-DISCLOSED | PAPER-REPORTED · P03 |
| training role (as published) | base pretraining; also proposed as a bits-per-byte benchmark | PAPER-REPORTED · P03 |
| train / evaluation membership | validation and test "each contain 0.1% of the data, sampled uniformly at random" | PAPER-REPORTED · P03 |
| contamination results | NOT-DISCLOSED in the passages inspected | — |
| retention / deletion | NOT-DISCLOSED | — |
| known limitations | copyright status per text unknown: "we do not have the metadata necessary to determine exactly which texts are copyrighted" | PAPER-REPORTED · P03 |
| token counts | available · 825.18 GiB (bytes); subword totals NOT-DISCLOSED in the passages inspected; bytes-per-token analysed under the GPT-2 tokenizer per constituent | PAPER-REPORTED · P03 |

**Dataset record — RedPajama V1 / V2 (paper R7.3; repository R7.2; Together AI Research, reference-stack lab #26).**

| Field | Value | Label |
|---|---|---|
| dataset ID | RedPajama-V1 (`RedPajama-Data-1T`); RedPajama-V2 (`RedPajama-Data-V2`); code at `togethercomputer/RedPajama-Data` (`rp_v1` branch for V1) | OFFICIAL-DOCUMENTATION · R7.2 |
| snapshot / hash | V1: five Common Crawl snapshots 2017–2020 plus C4, GitHub, Wikipedia, Books, arXiv, StackExchange; V2: "all 84 monthly snapshots between 2014 and April 2023"; hashes NOT-DISCLOSED | PAPER-REPORTED · R7.3 |
| origin | V1: mixed (web, code, encyclopedic, books, science, Q&A); V2: web only | PAPER-REPORTED · R7.3 |
| acquisition time | V1 per source, following the LLaMA description; V2 2014–April 2023 | PAPER-REPORTED · R7.3 |
| modality / language | text; V1 English (Wikipedia multilingual subset NOT-DISCLOSED here); V2 English, German, French, Spanish, Italian | PAPER-REPORTED · R7.3; OFFICIAL-DOCUMENTATION · R7.2 |
| domain | V1 multi-domain; V2 uncontrolled web with "more than 40 quality signals" as metadata | PAPER-REPORTED · R7.3 |
| unit of sampling | documents; V2 "113B documents", 32.8 B in head+middle, 80 B in tail; 20.8 B deduplicated head_middle documents | PAPER-REPORTED · R7.3; OFFICIAL-DOCUMENTATION · R7.2 |
| label schema | none; V2 carries per-document quality signals (C4, Gopher, RefinedWeb, DSIR-style, fastText) as metadata, not labels | PAPER-REPORTED · R7.3 |
| generator / policy | not synthetic | PAPER-REPORTED · R7.3 |
| license / permission | repository Apache-2.0; "For the datasets themselves, we refer to the Common Crawl Foundation Terms of Use"; V1 GitHub restricted to Apache, BSD, MIT; Books3 "took it down due to copyright issues" | PAPER-REPORTED · R7.3; OFFICIAL-DOCUMENTATION · R7.2 |
| extraction / filter / dedup versions | WET + CCNet (head/middle/tail by Wikipedia-perplexity buckets); V1 keeps head+middle; V2 keeps all buckets; exact dedup by Bloom filter on WET document hashes "prior to processing the data with CCNet"; MinHash LSH; versions NOT-DISCLOSED | PAPER-REPORTED · R7.3 |
| training role (as published) | base pretraining (RedPajama-INCITE); V2 designed as a filterable pool | PAPER-REPORTED · R7.3 |
| train / evaluation membership | NOT-DISCLOSED | — |
| contamination results | NOT-DISCLOSED in the passages inspected | — |
| retention / deletion | Books3 removal documented; other conditions NOT-DISCLOSED | PAPER-REPORTED · R7.3 |
| known limitations | V1 reproduction gap: "some salient details that went into the construction of the original LLaMA training corpus may be missing" | PAPER-REPORTED · R7.3 |
| token counts | V1 available · "approximately 1.2 Trillion tokens" · tokenizer NOT-DISCLOSED in the passage inspected; V2 available (deduplicated head_middle) · 30.4 T "Estimated Token count" · tokenizer NOT-DISCLOSED in the README; the paper's "over 100 trillion tokens" is the raw pool | PAPER-REPORTED · R7.3; OFFICIAL-DOCUMENTATION · R7.2 |

**Dataset record — RefinedWeb (P04).**

| Field | Value | Label |
|---|---|---|
| dataset ID | RefinedWeb (Technology Innovation Institute / LightOn affiliations as printed); public extract `tiiuae/falcon-refinedweb` | PAPER-REPORTED · P04 |
| snapshot / hash | "all CommonCrawl dumps until the 2023-06 one"; hash NOT-DISCLOSED | PAPER-REPORTED · P04 |
| origin | web only | PAPER-REPORTED · P04 |
| acquisition time | through 2023-06 | PAPER-REPORTED · P04 |
| modality / language | text; English (fastText from CCNet); "The public extract ... only draw[s] from the English version" | PAPER-REPORTED · P04 |
| domain | uncontrolled web; adult-content URL blocklist of 4.6 M domains plus URL scoring | PAPER-REPORTED · P04 |
| unit of sampling | one page; "∼10 billion documents" | PAPER-REPORTED · P04 |
| label schema | none | DERIVED |
| generator / policy | not synthetic | PAPER-REPORTED · P04 |
| license / permission | public extract ODC-By 1.0; Common Crawl ToU | PAPER-REPORTED · P04 |
| extraction / filter / dedup versions | archive format UNVERIFIED (WARC via warcio in §3; ".WET files" in the datasheet); trafilatura; line-wise corrections; MassiveWeb-style heuristics; MinHash then ExactSubstr; versions NOT-DISCLOSED | PAPER-REPORTED · P04 |
| training role (as published) | base pretraining (Falcon); also a Dolma v1.7 source | PAPER-REPORTED · P04; OFFICIAL-DOCUMENTATION · R7.19 |
| train / evaluation membership | NOT-DISCLOSED | — |
| contamination results | NOT-DISCLOSED in the passages inspected | — |
| retention / deletion | NOT-DISCLOSED | — |
| known limitations | toxicity "about as toxic as The Pile" by Perspective API definition; English-only public extract | PAPER-REPORTED · P04 |
| token counts | full available · "5,000GT"; public extract available · "600GT random extract"; tokenizer for these counts NOT-DISCLOSED in the passages inspected (GPT-2 is named only for the MinHash normalisation) | PAPER-REPORTED · P04 |

**Dataset record — Dolma (P05; card R7.19; Ai2, reference-stack lab #22).**

| Field | Value | Label |
|---|---|---|
| dataset ID | `allenai/dolma`; versions v1, v1_5, v1_5-sample, v1_6, v1_6-sample, v1_7 (default); the manuscript "was prepared for Dolma v.1.6" | OFFICIAL-DOCUMENTATION · R7.19; PAPER-REPORTED · P05 |
| snapshot / hash | v1_6 5.4 TB gzip (2024-01-31); v1_7 4.5 TB gzip (2024-04-15); content hashes NOT-DISCLOSED | OFFICIAL-DOCUMENTATION · R7.19 |
| origin | v1.6: Common Crawl, The Stack, C4, Reddit, peS2o, Project Gutenberg, Wikipedia/Wikibooks; v1.7 adds RefinedWeb, StarCoder, arXiv and StackExchange (via RedPajama v1), Flan, CC News, OpenWebMath, Algebraic Stack, MegaWika | PAPER-REPORTED · P05; OFFICIAL-DOCUMENTATION · R7.19 |
| acquisition time | Common Crawl "25 snapshots between 2020-05 to 2023-06"; per-source cutoffs in the v1.7 table (e.g. C4 Apr 2019, Reddit Mar 2023) | PAPER-REPORTED · P05; OFFICIAL-DOCUMENTATION · R7.19 |
| modality / language | text; "English-only corpus" | PAPER-REPORTED · P05 |
| domain | web, code, social media, papers, books, encyclopedic (+ instruction data reformatted for pretraining in v1.7) | PAPER-REPORTED · P05; OFFICIAL-DOCUMENTATION · R7.19 |
| unit of sampling | per-source documents; Reddit submissions and comments as independent documents ("Atomic Content") | PAPER-REPORTED · P05 |
| label schema | none | DERIVED |
| generator / policy | not synthetic | PAPER-REPORTED · P05 |
| license / permission | ODC-By (from 2024-04-15); per-source: C4 ODC-By 1.0, S2ORC ODC-By 1.0, The Stack permissive licences, Gutenberg not under US copyright, Wikimedia CC BY-SA 4.0, Reddit inherits Reddit API terms at collection | OFFICIAL-DOCUMENTATION · R7.19; PAPER-REPORTED · P05 |
| extraction / filter / dedup versions | CCNet; URL and document-level dedup, quality and content filtering, paragraph-level dedup; Dolma toolkit (Rust Bloom filter); versions NOT-DISCLOSED beyond dataset version | PAPER-REPORTED · P05; OFFICIAL-DOCUMENTATION · R7.16 |
| training role (as published) | base pretraining (OLMo) | PAPER-REPORTED · P05 |
| train / evaluation membership | NOT-DISCLOSED as splits | — |
| contamination results | paragraph-level decontamination against Paloma for OLMo-1B: "≤0.001% characters in Dolma contaminated, ≤0.02% of documents removed" | PAPER-REPORTED · P05 |
| retention / deletion | PII removal form on the card; other conditions NOT-DISCLOSED | OFFICIAL-DOCUMENTATION · R7.19 |
| known limitations | copyrighted material in web crawls cannot be reliably detected; English-only | PAPER-REPORTED · P05 |
| token counts | v1.6 available · 3,059 B · Llama tokenizer; v1.7 available · 2,308.5 B · OLMo tokenizer; v1.7 sampled pool · 1,715.1 B · OLMo tokenizer (sample proportions 50/100/200%); consumed by any OLMo run NOT-DISCLOSED on the card. The v1.6 and v1.7 totals are under different tokenizers and source sets. | PAPER-REPORTED · P05; OFFICIAL-DOCUMENTATION · R7.19 |

**Dataset record — FineWeb / FineWeb-Edu (P06; cards R7.5, R7.6; Hugging Face Research, reference-stack lab #27).**

| Field | Value | Label |
|---|---|---|
| dataset ID | `HuggingFaceFW/fineweb` (v1.0.0 2024-04-21 … v1.4.0 2025-07-11); `HuggingFaceFW/fineweb-edu` (v1.0.0 2024-06-02 … v1.4.0); `fineweb-edu-score-2` | OFFICIAL-DOCUMENTATION · R7.5, R7.6 |
| snapshot / hash | paper: 96 dumps, summer 2013–April 2024; card: 114 dump subsets through CC-MAIN-2025-26; DOI 10.57967/hf/2493; content hashes NOT-DISCLOSED | PAPER-REPORTED · P06; OFFICIAL-DOCUMENTATION · R7.5 |
| origin | web only (Common Crawl WARC) | OFFICIAL-DOCUMENTATION · R7.5 |
| acquisition time | 2013–2025 by dump; each record carries `date` (crawl date) | OFFICIAL-DOCUMENTATION · R7.5 |
| modality / language | text; English, fastText score ≥ 0.65 | OFFICIAL-DOCUMENTATION · R7.5 |
| domain | uncontrolled web; FineWeb-Edu: pages scored ≥ 3 on a 0–5 educational scale | OFFICIAL-DOCUMENTATION · R7.5, R7.6 |
| unit of sampling | one page; fields `text, id, dump, url, date, file_path, language, language_score, token_count` | OFFICIAL-DOCUMENTATION · R7.5 |
| label schema | none for training; FineWeb-Edu membership decided by a classifier (see generator) | OFFICIAL-DOCUMENTATION · R7.6 |
| generator / policy | text not synthetic; FineWeb-Edu selector: regression model on Snowflake-arctic-embed fine-tuned on 500 k samples scored by Llama3-70B-Instruct, threshold 3, F1 82% as a binary classifier; "removed 92% of the dataset" | OFFICIAL-DOCUMENTATION · R7.6 |
| license / permission | ODC-By v1.0; Common Crawl ToU | OFFICIAL-DOCUMENTATION · R7.5, R7.6 |
| extraction / filter / dedup versions | URL filtering → trafilatura on WARC → fastText LID → Gopher repetition/quality, C4 filters (minus terminal-punctuation), FineWeb custom filters → MinHash per crawl (5-grams, 14×8 hashes) → PII formatting; `datatrove` commits linked per step in the card | OFFICIAL-DOCUMENTATION · R7.5 |
| training role (as published) | base pretraining; ablation models via `nanotron` | OFFICIAL-DOCUMENTATION · R7.5 |
| train / evaluation membership | no held-out split published; sample configs `sample-10BT/100BT/350BT` | OFFICIAL-DOCUMENTATION · R7.5 |
| contamination results | NOT-DISCLOSED on the card; the paper's Paloma perplexity evaluation "intentionally do[es] not perform decontamination" | OFFICIAL-DOCUMENTATION · R7.5; PAPER-REPORTED · P06 |
| retention / deletion | PII removal form; v1.3.0 "removed specific domains in response to a C&D notice"; e-mail and public-IP anonymisation | OFFICIAL-DOCUMENTATION · R7.5 |
| known limitations | code "not prevalent"; toxic content remains; no per-site processing | OFFICIAL-DOCUMENTATION · R7.5 |
| token counts | available · "around 15 trillion" (paper, 96 dumps) and "more than 18.5T" (card v1.4.0, 18,527.0 B by dump table) · gpt2 tokenizer; FineWeb-Edu available · 1.3 T (score ≥ 3) and 5.4 T (score ≥ 2) · gpt2 tokenizer; sampled · 27 B (per-filter ablations) and 350 B (cross-dataset comparisons) · gpt2 tokenizer; FineWeb-Edu classification cost 6 k H100 GPU-hours | PAPER-REPORTED · P06; OFFICIAL-DOCUMENTATION · R7.5, R7.6 |

**Dataset record — FineWeb2 (card R7.7; paper R7.18) — the multilingual case.**

| Field | Value | Label |
|---|---|---|
| dataset ID | `HuggingFaceFW/fineweb-2` (v2.0.0 2024-12-08 … v2.1.1 2025-10-27) | OFFICIAL-DOCUMENTATION · R7.7 |
| snapshot / hash | 96 Common Crawl snapshots, summer 2013–April 2024; the non-English remainder (< 0.65 English score) of FineWeb's processing; hashes NOT-DISCLOSED | OFFICIAL-DOCUMENTATION · R7.7 |
| origin | web only | OFFICIAL-DOCUMENTATION · R7.7 |
| acquisition time | 2013–2024 by dump | OFFICIAL-DOCUMENTATION · R7.7 |
| modality / language | text; "1,868 language-script pairs" keyed `iso639-3_Script`; per-language LID thresholds via GlotLID; `und_` subsets for unsupported scripts | OFFICIAL-DOCUMENTATION · R7.7 |
| domain | uncontrolled web; measured: "70% (1320 of them) have more than half their documents from Bible- or Wikipedia-related domains" | PAPER-REPORTED · R7.18 |
| unit of sampling | one page; adds `language_script`, `top_langs`, `minhash_cluster_size` | OFFICIAL-DOCUMENTATION · R7.7 |
| label schema | none | DERIVED |
| generator / policy | not synthetic | OFFICIAL-DOCUMENTATION · R7.7 |
| license / permission | ODC-By v1.0; Common Crawl ToU | OFFICIAL-DOCUMENTATION · R7.7 |
| extraction / filter / dedup versions | trafilatura (inherited); GlotLID; MinHash deduplicated "per language, globally" with cluster sizes retained for "rehydration"; per-language filter configs `configs/{iso3}_{script}.yml`; `_removed` subsets published; v2.0.1 disabled most FTFY fixes; v2.1.0 changed filtering to match the paper | OFFICIAL-DOCUMENTATION · R7.7 |
| training role (as published) | base pretraining; "Most languages also include a small `test` split which should not be trained on" | OFFICIAL-DOCUMENTATION · R7.7 |
| train / evaluation membership | per-language `test` split (sizes NOT-DISCLOSED here) | OFFICIAL-DOCUMENTATION · R7.7 |
| contamination results | NOT-DISCLOSED | — |
| retention / deletion | PII removal / opt-out form, including for webmasters | OFFICIAL-DOCUMENTATION · R7.7 |
| known limitations | GlotLID confuses closely related languages; "we couldn't test each language individually"; punctuation filter removes poems | OFFICIAL-DOCUMENTATION · R7.7 |
| token counts | available · 3,339,271,691,958 words (language-specific word tokenizers), 5,018,505,566 documents, 20.78 TB; subword tokens deliberately not reported; sampled · 350 B for the paper's pipeline ablations, tokenizer per the paper's tokenizer study | OFFICIAL-DOCUMENTATION · R7.7; PAPER-REPORTED · R7.18 |

**Dataset record — DCLM-Pool / DCLM-baseline (P07; card R7.4).**

| Field | Value | Label |
|---|---|---|
| dataset ID | DCLM-Pool (hosted at `data.commoncrawl.org/contrib/datacomp`); `mlfoundations/dclm-baseline-1.0` | PAPER-REPORTED · P07; OFFICIAL-DOCUMENTATION · R7.4 |
| snapshot / hash | "all 5.1M Common Crawl WARC dumps from 2013 to 2022 (inclusive)"; 2023+ deliberately omitted; hashes NOT-DISCLOSED | PAPER-REPORTED · P07 |
| origin | web only | PAPER-REPORTED · P07 |
| acquisition time | 2013–2022 | PAPER-REPORTED · P07 |
| modality / language | text; English (fastText, whole-page score retained as `language_id_whole_page_fasttext`) | OFFICIAL-DOCUMENTATION · R7.4 |
| domain | uncontrolled web; baseline selected by a fastText classifier (`fasttext_openhermes_reddit_eli5_vs_rw_v2_bigram_200k_train_prob` field) | OFFICIAL-DOCUMENTATION · R7.4 |
| unit of sampling | one WARC record → one jsonl document; pool "200B documents (370TB after gzip compression)" | PAPER-REPORTED · P07 |
| label schema | none; per-document quality scores as metadata | OFFICIAL-DOCUMENTATION · R7.4 |
| generator / policy | not synthetic; classifier trained on external data (OpenHermes/ELI5-style positives), per field name | OFFICIAL-DOCUMENTATION · R7.4 |
| license / permission | CC-BY-4.0 data, MIT code, Common Crawl ToU | PAPER-REPORTED · P07; OFFICIAL-DOCUMENTATION · R7.4 |
| extraction / filter / dedup versions | resiliparse on WARC; RefinedWeb heuristic filters; Bloom-filter dedup (`bff_contained_ngram_count_before_dedupe`); versions NOT-DISCLOSED beyond release 1.0 | PAPER-REPORTED · P07; OFFICIAL-DOCUMENTATION · R7.4 |
| training role (as published) | base pretraining; benchmark pool for data-curation competition | PAPER-REPORTED · P07 |
| train / evaluation membership | evaluation data use "forbidden" except for decontamination; pools per compute scale | PAPER-REPORTED · P07 |
| contamination results | decontamination tooling released rather than a decontaminated pool; MMLU and HellaSwag overlap removal at 7B-2x "performance does not fall" | PAPER-REPORTED · P07 |
| retention / deletion | one-to-one WARC→jsonl mapping to propagate Common Crawl redactions; "none have had any special treatment for PII" | PAPER-REPORTED · P07 |
| known limitations | single tokenizer in most experiments; raw pool unfiltered for PII | PAPER-REPORTED · P07 |
| token counts | pool available · 240 T · GPT-NeoX tokenizer; baseline available · 3.8 T (paper) / "4T token / 3B document" (card) · tokenizer stated for the pool only, presumed the same for the baseline (UNVERIFIED); consumed · 2.6 T by the reported 7B run | PAPER-REPORTED · P07; OFFICIAL-DOCUMENTATION · R7.4 |

**Dataset record — The Stack v2 (paper R7.12; card R7.13) — the code case.**

| Field | Value | Label |
|---|---|---|
| dataset ID | `bigcode/the-stack-v2` (gated) | OFFICIAL-DOCUMENTATION · R7.13 |
| snapshot / hash | Software Heritage graph dataset 2023-09-06; per-file `blob_id`/SWHID | PAPER-REPORTED · R7.12; OFFICIAL-DOCUMENTATION · R7.13 |
| origin | code repositories (GitHub via Software Heritage), plus GitHub issues, pull requests, notebooks, documentation for StarCoder2 training | PAPER-REPORTED · R7.12 |
| acquisition time | archive version 2023-09-06; per-file `visit_date`, `revision_date`, `committer_date` | OFFICIAL-DOCUMENTATION · R7.13 |
| modality / language | code and markup, "600+ programming and markup languages" | OFFICIAL-DOCUMENTATION · R7.13 |
| domain | software | DERIVED |
| unit of sampling | file (blob); repository identity retained (`repo_name`, `directory_id`, `revision_id`) | OFFICIAL-DOCUMENTATION · R7.13 |
| label schema | none for pretraining; `detected_licenses`, `license_type`, `is_vendor`, `is_generated` as metadata | OFFICIAL-DOCUMENTATION · R7.13 |
| generator / policy | not synthetic; `is_generated` flag for generated code | OFFICIAL-DOCUMENTATION · R7.13 |
| license / permission | permissive and unlicensed files included; copyleft and commercial excluded; "must abide by the terms of the original licenses"; gated access | PAPER-REPORTED · R7.12; OFFICIAL-DOCUMENTATION · R7.13 |
| extraction / filter / dedup versions | Merkle-DAG dedup by `directory_id`; ScanCode license detection; extension inspection; versions NOT-DISCLOSED beyond archive date | PAPER-REPORTED · R7.12 |
| training role (as published) | base pretraining (StarCoder2); StarCoder (v1-era) is a Dolma v1.7 source | PAPER-REPORTED · R7.12; OFFICIAL-DOCUMENTATION · R7.19 |
| train / evaluation membership | training variants "full" and "17 languages"; evaluation held out via external benchmarks | OFFICIAL-DOCUMENTATION · R7.13 |
| contamination results | NOT-DISCLOSED in the passages inspected | — |
| retention / deletion | "Am I in The Stack" opt-out; 1,561 repositories / 22,066 files removed after the 2023-11-20 cut-off | PAPER-REPORTED · R7.12 |
| known limitations | repository-level licence missing for 96.93% of repositories, replaced by file-level detection | PAPER-REPORTED · R7.12 |
| token counts | full available · 67.5 TB; deduplicated · 32.1 TB; training (full) · "~900B tokens" · tokenizer NOT-DISCLOSED on the card summary inspected | OFFICIAL-DOCUMENTATION · R7.13 |

**Mathematics corpus (P25), for completeness.** The DeepSeekMath Corpus is recorded with `origin = web (Common Crawl)`, `domain = mathematics by fastText classifier seeded from OpenWebMath`, `token counts: available · 120 B · tokenizer NOT-DISCLOSED in the passages inspected`, and every other mandatory field `NOT-DISCLOSED` (PAPER-REPORTED · P25) — the corpus itself was not released as a dataset card the book could open.

Cost line for the records: each is a few kilobytes of metadata; the cost that matters is the *audit* cost of filling it — for this edition roughly one paper, one repository and one card per corpus, with no download (DERIVED). Building a comparable record for a private corpus costs the same fields plus access.

## Algorithm

```text
Algorithm 7.6 — Comparable corpus inventory
INPUT   list of corpus releases; primary sources (paper, repository, card) with access dates; comparison question
OUTPUT  one Dataset record per release; comparable-treatment groups under Eq. 7.12; unresolved-field ledger
STATE   one inventory row per release; source references keyed by references.md id
INVARIANT  no family-level statement becomes a release-level value; every token count carries tokenizer and qualifier
1  resolve each family name to a release (card version, branch, DOI) or mark u_release unresolved
2  fill the Appendix C fields from the primary sources only; absent → NOT-DISCLOSED; conflicting → UNVERIFIED with both sources
3  copy each quantity with unit, tokenizer, qualifier, and citation; never convert across tokenizers
4  separate observed documentation (labels PAPER-REPORTED / OFFICIAL-DOCUMENTATION) from inference (DERIVED / ASSUMED)
5  group releases for comparison only when u_source, u_tok, and the consumed budget can be matched
6  mark unmatched coordinates of χ as confounders, not as normalised-away
7  emit the falsifiable experiment that would resolve the comparison; terminate
```
Complexity: O(n·f) for n releases and f fields plus source-reading time; grouping on fixed-width treatment keys is O(n log n) (DERIVED). All-pairs comparison over an unbounded catalogue is rejected; group by question.

## Implementation

The records above are consumed by reference-stack systems at the load boundary: **Hugging Face Transformers** (#26, *Model definition / adaptation*) supplies the tokenizer that must match u_tok before any count is reused (OFFICIAL-DOCUMENTATION · R7.30); **PyTorch** (#17, *Model / autograd framework*) and **Nanotron** (#35, *Distributed training*) realise u_sampler — FineWeb's ablations were trained with Nanotron, and any replication must pin its revision (OFFICIAL-DOCUMENTATION · R7.5, R7.31, R7.32). *Outside the reference stack (plan anchors: Appendix C resource table; P02–P07; RedPajama repository):* `datatrove` (R7.15), the Dolma toolkit (R7.16), RedPajama-Data (R7.2), CCNet (R7.17), and Hugging Face Datasets, "Backed by the Apache Arrow format" with streaming (OFFICIAL-DOCUMENTATION · R7.35), are the processing and loading routes the cards themselves name. A comparison study chooses one training path and holds kernels, precision, optimizer, packing, checkpoint schedule and evaluator fixed across corpora.

## Experimental design

### Experiment 7.6 — Pipeline effect under one source snapshot and one tokenizer

- **Hypothesis:** a declared curation intervention (e.g. FineWeb's custom filters versus RefinedWeb-style heuristics, both re-implemented) changes downstream quality at a fixed u_source, u_tok, model, and *consumed* token budget; the family-level size difference predicts nothing about the outcome.
- **Setup:** one Common Crawl crawl; two documented pipelines re-implemented from R7.5 and P04; identical training configuration.
- **Independent variables:** pipeline treatment; seed.
- **Controlled variables:** snapshot, tokenizer (one repository revision), architecture, optimizer, sequence length, evaluator, consumed tokens.
- **Dataset/workload:** source-grouped splits; an independently sealed evaluation set; repeated exposure disclosed when a retained pool is small.
- **Hardware:** same accelerator type and count for all arms; recorded before execution.
- **Metrics:** held-out loss; task aggregate with seed intervals; retained-token diversity; duplicate exposure; preprocessing CPU-hours; training throughput (tokens/s/GPU).
- **Baselines:** minimal admissible cleaning (LID only).
- **Expected result:** direction as reported by P06 at its scale; magnitude UNVERIFIED at the reader's scale; the experiment can reject "useful gain at this budget".
- **Ablation:** remove one pipeline stage with sampling and training fixed.
- **Interpretation:** applies to the studied crawl, language, scale and budget only.
- **Threats to validity:** imperfect re-implementation; evaluator leakage; few seeds; small-scale transfer.

Proposal only; no run was executed.

## Observations

**What the paper claims.** P02 claims a 750 GB cleaned WET-based English corpus; P03 claims 825.18 GiB across 22 constituents with documented consent tiers; R7.3 claims a 1.2 T-token LLaMA reproduction and a 100 T-token raw multilingual pool with quality signals; P04 claims 5 T tokens of web-only data matching curated corpora; P05 claims 3 T Llama tokens with a datasheet and toolkit; P06 claims 15 T gpt2 tokens and a 1.3 T educational subset; P07 claims a 240 T GPT-NeoX-token pool and a 3.8 T baseline; R7.12 claims 3 B+ files with SWHID provenance; R7.18 claims 1,868 language-script pairs (all PAPER-REPORTED or OFFICIAL-DOCUMENTATION).

**What the evidence shows.** Every size claim is a self-report under the builder's tokenizer; the only cross-corpus comparisons with matched training are those *inside* P06 and P07, which use their own filters and evaluation suites. No two of these corpora have been compared by an independent third party at matched consumed budget with a sealed evaluation set, to the book's knowledge.

**What we infer.** The records show that retention conditions and contamination results are the least-reported mandatory fields across all nine corpora (DERIVED from the tables). We infer, marked ASSUMED, that the size figures most often quoted in secondary literature (15 T, 3 T, 240 T) are compared across tokenizers without acknowledgement; the book has not audited secondary literature to confirm the rate.

```figure
id: fig-7.33
kind: stat-panel
title: Five mandatory fields across the nine records
caption: >-
  Counted from the nine §7.6 tables. A cell counts as stated only when the
  inspected source gives a value, not when the record says NOT-DISCLOSED.
  Twelve of 45 cells are filled. Retention periods and release hashes are
  empty in every record, and contamination results and subword tokenizers
  are stated in a third. Removal paths are the exception: six releases
  document one. This is the "What we infer" paragraph as a count.
placement: rail
anchor: observations
evidence: DERIVED
source: [P02, P03, P04, P05, P06, P07, R7.2, R7.3, R7.5, R7.7, R7.12, R7.13, R7.19, R7.28]
alt: >-
  Instrument panel counting five mandatory fields over the nine Dataset
  records of §7.6 (C4, The Pile, RedPajama, RefinedWeb, Dolma, FineWeb and
  FineWeb-Edu, FineWeb2, DCLM, The Stack v2). Release-level content hash: 0
  of 9; The Stack v2 has per-file SWHIDs, not a release hash. Contamination
  results: 3 of 9 (C4 through the R7.28 audit, Dolma, DCLM). Removal path: 6 of
  9 (RedPajama's Books3 removal, Dolma's PII form, FineWeb's form and C&D
  removal, FineWeb2's form, DCLM's WARC mapping, The Stack v2's opt-out).
  Retention period: 0 of 9. Subword tokenizer named for the headline count: 3
  of 9 (Dolma, FineWeb, DCLM). Dot glyph: 12 of 45 cells filled.
spec:
  header: "NINE RECORDS · FIVE FIELDS · STATED?"
  variables: { R: 9, H: 0, C: 3, D: 6, T: 0, K: 3 }
  rows:
    - { key: "records filled (§7.6)", formula: "R", format: integer }
    - { key: "release content hash stated", formula: "H/R", format: percent, note: "Stack v2: per-file SWHIDs only" }
    - { key: "contamination results stated", formula: "C/R", format: percent, note: "C4 (via R7.28), Dolma, DCLM" }
    - { key: "removal path documented", formula: "D/R", format: percent, note: "RedPajama, Dolma, FineWeb, FineWeb2, DCLM, Stack v2" }
    - { key: "retention period stated", formula: "T/R", format: percent, note: "NOT-DISCLOSED in every record" }
    - { key: "subword tokenizer named", formula: "K/R", format: percent, note: "Dolma (OLMo, Llama), FineWeb (gpt2), DCLM (GPT-NeoX)" }
    - { key: "cells stated, of 45", formula: "H + C + D + T + K", format: integer }
  glyph:
    type: dots
    total: 45
    filled: 12
    legend:
      - { marker: filled, label: "stated in the inspected source", value: "12" }
      - { marker: hollow, label: "NOT-DISCLOSED or absent", value: "33" }
states:
  - { anchor: observations, label: "least-reported fields", highlight: ["retention period stated", "contamination results stated", "release content hash stated"], note: "Retention and contamination are the least-reported mandatory fields across all nine records, as the Observations infer. The release hash is absent everywhere." }
  - { anchor: failure-modes, label: "tokenizer named in 3 of 9", highlight: ["subword tokenizer named"], note: "Only three records name a subword tokenizer for their headline count, so any cross-corpus ratio has at most three operands with a defined unit." }
  - { anchor: limitations, label: "as reported by builders", highlight: ["records filled (§7.6)", "cells stated, of 45"], note: "Every stated cell is the builder's own report. No corpus was downloaded or recounted for this edition, so the twelve are transcriptions, not audits." }
```

**What remains unknown.** Tokenizers for RedPajama-V2's 30.4 T, RefinedWeb's 5,000 GT, The Stack v2's 900 B, and DeepSeekMath's 120 B are NOT-DISCLOSED in the sources inspected. Content hashes of every release are NOT-DISCLOSED. Dolma v1's archive format is UNVERIFIED.

## Failure modes

> **Failure mode — Paper–card hybrid.** *Symptom:* a paper's score is paired with a later card's token count. *Cause:* family name resolved to two releases. *Detection:* record cites two u_release values. *Mitigation:* Algorithm 7.6 line 1.

> **Failure mode — Cross-tokenizer ratio.** *Symptom:* "corpus A is 5× corpus B". *Cause:* gpt2 vs Llama vs GPT-NeoX counts divided. *Detection:* tokenizer cells differ in the ratio's operands. *Mitigation:* line 3; report bytes or words as a second axis when tokenizers differ.

> **Failure mode — Openness read as reproducibility.** *Symptom:* "the pipeline is public, so the release is reproducible". *Cause:* unpinned commits and unavailable raw inputs (Pushshift). *Detection:* u_pipeline without digests. *Mitigation:* mark UNVERIFIED until commit and inputs are pinned.

> **Failure mode — Cross-source overlap.** *Symptom:* Σ s_k > 1 or duplicated documents across "C4" and "Common Crawl" rows. *Cause:* per-source dedup only. *Detection:* Eq. 7.13 violated. *Mitigation:* ownership rule or overlap report.

## Siblings

**Source categories** — [07-1-source-categories.md](07-1-source-categories.md)
Why it exists: the vocabulary of origins. What assumption changed here: sources are instantiated as named releases. What objective changed: none. What problem it solved: per-category cost and risk. What new failure mode it introduced: none new. Changed primitive: category → record.

**Dataset documentation** — [07-5-dataset-documentation.md](07-5-dataset-documentation.md)
Why it exists: the card template. What assumption changed: the template is filled from sources the book opened. What objective changed: none. What problem it solved: evidence interface. What new failure mode it introduced: hybrid releases. Changed primitive: template → filled records.

**Quality estimation** — [§8.2](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation.md)
Why it exists: the selection programs the records only name. What assumption changed: filters are the object of study. What objective changed: precision/recall against downstream quality. What problem it solved: which documents to keep. What new failure mode it introduced: estimator-defined populations. Changed primitive: record field → mechanism.

## Extensions

For multimodal and agent corpora the record adds alignment, environment, action-policy and feedback-source identities (Appendix C embodied and RL-rollout rows); for retrieval corpora it adds index and update versions. Post-training mixtures (Appendix C's Tulu-family row) need the same record with `training role` set per component rather than per corpus — the point of §7.2. The comparison contract of Eq. 7.12 gains a coordinate for the evaluation suite when the question is capability rather than loss ([§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md)).

## Limitations

This is a source-grounded documentary comparison: no corpus was downloaded, recounted, or benchmarked, so every value is as reported by its builder. Cards move; the versions recorded are those at the access dates in [references.md](references.md), and later releases may change a family without changing the paper. The section is falsified as guidance if a matched-budget, matched-tokenizer comparison (Experiment 7.6) shows the family-level size ordering *does* predict the outcome ordering across these corpora — a result that would be evidence about the corpora, not about the record schema.

## Reproducibility

Versions: P02 (ar5iv, arXiv v4), P03 (ar5iv, v1), P04 (ar5iv, v1), P05 (arXiv HTML v2; ACL 2024 pages 15725–15788), P06 (arXiv HTML v2; NeurIPS 2024 Datasets and Benchmarks), P07 (arXiv HTML v4), P25 (ar5iv, v3), R7.3 (arXiv abs v1; NeurIPS 2024 D&B), R7.12 (arXiv abs v1), R7.18 (arXiv HTML v1) — accessed 2026-09-20; cards R7.1, R7.4, R7.5 (v1.4.0), R7.6 (v1.4.0), R7.7 (v2.1.1), R7.13, R7.19 (v1_7 default), repository R7.2 (`main`) — accessed 2026-09-20; R7.30–R7.32, R7.35 opened 2026-09-23. Artifacts: the nine records above are the filled rows of the inventory in [verification.md](verification.md). Exact definitions: Eq. 7.12–7.13. Unresolved: listed under "What remains unknown".

## References

P02, P03, P04, P05, P06, P07, P25, R7.1, R7.2, R7.3, R7.4, R7.5, R7.6, R7.7, R7.12, R7.13, R7.15, R7.16, R7.17, R7.18, R7.19, R7.28, R7.30, R7.31, R7.32, R7.35; Eq. 7.12–7.13.
