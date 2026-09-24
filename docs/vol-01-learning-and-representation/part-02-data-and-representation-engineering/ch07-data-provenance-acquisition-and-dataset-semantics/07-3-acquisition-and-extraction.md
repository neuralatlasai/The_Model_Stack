---
id: ms.section.7.3
entity_type: section
title: Acquisition and extraction
short_title: Acquisition and extraction
volume: 1
part: 2
chapter: 7
section: 7.3
slug: 07-3-acquisition-and-extraction
parent: ms.chapter.7
prev_sibling: ms.section.7.2
next_sibling: ms.section.7.4
children: []
prerequisites: [ms.section.6.6, ms.section.7.1, ms.section.7.2]
downstream: [ms.section.7.4, ms.section.7.5, ms.section.7.6, ms.section.8.1, ms.section.12.1, ms.section.12.2, ms.section.49.1]
related: [ms.section.12.5, ms.section.65.1]
siblings_by_mechanism: [ms.section.8.1, ms.section.12.2]
relations:
  - {type: supported_by, target: paper.P04}
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P06}
  - {type: supported_by, target: paper.P07}
  - {type: consumes, target: concept.common-crawl-warc}
  - {type: produces, target: concept.extraction-lineage}
axes: {lifecycle: [data], mechanism: [crawling, api_acquisition, repository_acquisition, document_parsing, ocr, metadata_retention, source_identifiers], feedback_setting: [], modality: [text, code]}
papers: [P02, P03, P04, P05, P06, P07, P21]
implementations: [impl.hugging-face-transformers, impl.pytorch, impl.nanotron]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED, KNOWN], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 7.3 Acquisition and extraction

## Scope

Objective: specify the mechanisms by which raw objects enter a corpus — crawling (with the Common Crawl WARC/WET distinction and robots handling), APIs, repositories, document parsing, HTML text extraction, OCR — and the two things every mechanism must leave behind: retained metadata and a stable source identifier, so that a training record can be traced back to an acquisition event and a transformation history. Baseline: an extraction job that writes text and discards inputs, failures, and parser configuration. Success: the reader can state, for each of the case-study corpora of §7.6, which archive format was read, which extractor ran, and which identifier links a record to its source; and can compute the lineage-completeness metric of [verification.md](verification.md). Boundaries: normalisation, quality filters, and deduplication are owned by [§8.1](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-1-normalization.md)–[§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md); storage formats and transformation execution by [§12.1](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-1-storage-and-formats.md)–[§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md). This section states only what the cited papers and cards report about their extractors.

## Why this exists

What failed before was extraction treated as a solved preprocessing step. C4 was built from Common Crawl's "web extracted text" — the WET files — and cleaned with line-level heuristics (PAPER-REPORTED · P02). Three later corpora independently found that starting point inadequate: The Pile reports that jusText "on Web Archive files (raw HTTP responses including page HTML)" for extraction "yields higher quality output than directly using the WET files" (PAPER-REPORTED · P03); RefinedWeb "found WET files to include undesirable navigation menus, ads, and other irrelevant texts" and started "from raw WARC files, read with the warcio library" (PAPER-REPORTED · P04); FineWeb "found that WET files retained too much boilerplate and menu text" (PAPER-REPORTED · P06). The bottleneck that appeared was that *the extractor is a training variable*: FineWeb's ablation of trafilatura-on-WARC against WET, with only English language identification and no deduplication, showed the WARC path "clearly results in a more performant model" (PAPER-REPORTED · P06), and DCLM's three-way comparison at its 1B-1x scale reports Core scores of 24.1 for resiliparse, 24.5 for trafilatura and 20.7 for WET files (PAPER-REPORTED · P07). The constraint that became dominant is cost against traceability: re-extracting from HTML is, in FineWeb's words, "relatively costly" (PAPER-REPORTED · P06), and once extraction is a choice, every record needs an identifier back to the archive object so that the choice can be revisited. What changed in the solution is that corpora now ship WARC-level identifiers and extractor identities as record fields, and DCLM designed its pool "to maintain a one-to-one mapping between raw Common Crawl WARC files and DCLM-Pool .jsonl files" (PAPER-REPORTED · P07).

## Intuition

Acquisition moves bytes; extraction interprets them. A WARC record is a faithful copy of an HTTP response — headers, HTML, and crawl metadata; a WET record is somebody's *prior* interpretation of that response as text, made once, with a fixed parser, for all downstream users. Using WET is cheap because the interpretation is amortised across the whole community; using WARC is expensive because each corpus pays for its own parse, but it lets the builder choose the interpretation and, crucially, change it later. The physical reading is byte expansion: a compressed WARC segment expands to HTML, HTML expands to a DOM, and a PDF page rendered for OCR expands to pixels and then to model activations, so admission limits must sit at every expansion boundary, not only at the network. Retaining a digest of the acquired object is cheap relative to retaining the object, but a digest cannot reconstruct bytes that a custodian later removes (DERIVED). Heuristically, an extractor "reads the page like a person"; mechanically it applies DOM heuristics whose recall on tables, code blocks and mathematics is exactly what the ablations above measure indirectly.

## Formulation

> **Definition — Acquisition event.** A timestamped observation of a source through a specified interface, carrying a locator, response status, integrity metadata, and either a content identity or an explicit acquisition failure.

> **Definition — Extraction lineage.** The directed record of source objects, transformation identities (tool, version, configuration), and derived records sufficient to identify the inputs and configuration of each extraction step for any training record.

> **Definition — Source identifier.** An identifier that resolves, through a documented procedure, from a training record to the archived object it was extracted from: a WARC record id plus archive path for web data, a Software Heritage identifier for code, a corpus id plus metadata for parsed papers.

Every output record gets a domain-separated identity:

$$
u_{\mathrm{out}} \;=\; \mathsf{hash}\big(\operatorname{encode}(u_{\mathrm{in}},\, h_{\mathrm{tool}},\, h_{\mathrm{config}},\, j,\, h_{\mathrm{payload}})\big)
$$
*(Eq. 7.6)*

| Local symbol | Meaning | Unit or constraint |
|---|---|---|
| $\mathsf{hash}$ | chosen cryptographic digest | fixed-width identifier; collision handling still required |
| $u_{\mathrm{in}}$ | parent content identifier (source identifier or an earlier $u_{\mathrm{out}}$) | identifier, never a mutable URL |
| $h_{\mathrm{tool}}, h_{\mathrm{config}}$ | tool and canonical configuration digests | include model weights for learned extractors and OCR |
| $j$ | deterministic output ordinal (page, block, file) | non-negative integer |
| $h_{\mathrm{payload}}$ | digest of the derived payload bytes | of explicitly specified bytes |
| $\operatorname{encode}$ | versioned, length-delimited serialisation | unambiguous byte sequence |

Eq. 7.6 is an engineering construction (ASSUMED). It identifies an *observed* output even when OCR is nondeterministic; it does not force two reruns to agree, and a separate transformation identity groups their differing outputs. Without length delimiting, different tuples can share a preimage.

```figure
id: fig-7.12
kind: diagram
title: "Eq. 7.6: how an extracted record gets its identity"
caption: >-
  Five inputs, one versioned encoding, one digest. The instrument follows the
  section. The formulation lights the construction. The mechanism lights what
  real corpora put into u_in and h_tool. Algorithm 7.3 lights the three
  lines that register, compute and split identity from locators. The
  failure modes light the one input that must never be used, a URL standing
  in for u_in.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-7.6", "DERIVED:alg-7.3", R7.5, R7.4, R7.12, R7.11]
alt: >-
  Diagram of Eq. 7.6. Five inputs feed a versioned, length-delimited encoding:
  u_in, the parent identity (a WARC-Record-ID, a SWHID or an earlier u_out);
  h_tool, the tool digest including model weights for learned extractors and
  OCR; h_config, the canonical configuration digest; j, the output ordinal
  (page, block, file); and h_payload, the digest of the derived bytes. The
  encoding is hashed to a fixed-width digest, which becomes u_out. u_out keys
  an access-controlled sidecar holding URLs, WARC-IP-Address values and user
  ids. A URL used as identity points into u_in and breaks replay, because a
  locator names a place, not content.
spec:
  direction: TB
  nodes:
    - { id: uin, kind: dataset, label: "u_in, parent identity", sub: "WARC-Record-ID · SWHID · earlier u_out" }
    - { id: tool, kind: dependency, label: "h_tool", sub: "extractor or OCR, incl. model weights" }
    - { id: cfg, kind: dependency, label: "h_config", sub: "canonical configuration digest" }
    - { id: j, kind: node, label: "j, output ordinal", sub: "page · block · file" }
    - { id: pay, kind: node, label: "h_payload", sub: "digest of the derived bytes" }
    - { id: enc, kind: process, label: "encode", sub: "versioned, length-delimited" }
    - { id: hash, kind: process, label: "hash", sub: "fixed-width digest" }
    - { id: uout, kind: dataset, label: "u_out", sub: "Eq. 7.6", emphasis: true }
    - { id: side, kind: memory, label: "sidecar", sub: "URL, WARC-IP-Address, user ids" }
    - { id: url, kind: boundary, label: "URL used as identity", sub: "a locator, not content" }
  edges:
    - { from: uin, to: enc }
    - { from: tool, to: enc }
    - { from: cfg, to: enc }
    - { from: j, to: enc }
    - { from: pay, to: enc }
    - { from: enc, to: hash, kind: emphasis }
    - { from: hash, to: uout, kind: emphasis }
    - { from: uout, to: side, kind: dependency, label: "keyed by u_out" }
    - { from: url, to: uin, kind: dependency, label: "replay fails" }
states:
  - { anchor: formulation, label: "Eq. 7.6", highlight: [uin, enc, hash, uout, "enc->hash", "hash->uout"], note: "Every output gets a domain-separated identity from parent, tool, config, ordinal and payload. Without length delimiting, two different tuples can share a preimage." }
  - { anchor: mechanism, label: "what fills u_in and h_tool", highlight: [uin, tool], note: "u_in is FineWeb's urn:uuid id + file_path, DCLM's WARC-Record-ID, or a Stack v2 blob id / SWHID. h_tool names trafilatura, resiliparse or jusText; trafilatura's licence changed at v1.8.0." }
  - { anchor: algorithm, label: "lines 5, 7, 8", highlight: [uin, uout, side, "uout->side"], note: "Line 5 registers u_in from the received bytes, line 7 computes u_out, line 8 routes locators, IPs and credential-adjacent fields to the sidecar keyed by u_out." }
  - { anchor: failure-modes, label: "locator-as-identity", highlight: [url, "url->uin"], note: "Replay from a URL returns different bytes or nothing. Detection: payload digest ≠ h_payload. Mitigation: store WARC-Record-ID + archive path, or a SWHID." }
```

For a bounded job with retries, transfer and unique content are counted separately:

$$
Z_{\mathrm{wire}} \;=\; \sum_{i=1}^{n}\sum_{a=1}^{r_i} z_{ia}, \qquad Z_{\mathrm{unique}} \;=\; \sum_{o \in \mathcal{O}} z_o
$$
*(Eq. 7.7)* where n = requested objects, r_i = bounded attempts for object i, z_ia = bytes transferred on attempt a, 𝒪 = the verified unique-content set, z_o = retained bytes of object o. These are accounting identities (MATHEMATICALLY-DERIVED); compression and partial attempts make Z_wire ≠ Z_unique in general. The raw-byte term Z of Eq. 7.1 is Z_unique.

```figure
id: fig-7.13
kind: calculator
title: Wire bytes against unique bytes for one bounded job
caption: >-
  Eq. 7.7 under a uniform-object approximation, not the exact double sum.
  Every object is taken to cost r̄ attempts of z̄_w KiB on the wire and to
  retain z_o KiB if it verifies as unique. All values are an illustrative
  configuration, not a named crawl. Watch the ratio. Only with one attempt,
  all-unique content and no expansion does Z_wire equal Z_unique, and only
  Z_unique is the Z of Eq. 7.1.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-7.7"]
alt: >-
  Calculator for Eq. 7.7 with uniform object sizes (an approximation of the
  double sum), illustrative configuration. Inputs: n requested objects, mean
  attempts per object r̄, mean bytes on the wire per attempt in KiB, fraction
  of objects verified as unique content, and retained bytes per unique object
  in KiB. Z_wire = n · r̄ · z_w; Z_unique = n · f_u · z_o. At the defaults (one
  million objects, 1.2 attempts, 50 KiB per attempt, 90% unique, 50 KiB
  retained) Z_wire is about 57 GiB and Z_unique about 43 GiB, a ratio of 1.33.
  With one attempt, all unique and equal sizes, the ratio is 1. With 1 KiB on
  the wire expanding to 1,000 KiB retained, Z_unique is a thousand times the
  wire bytes.
spec:
  tex: >-
    Z_{\mathrm{wire}} = \sum_{i=1}^{n}\sum_{a=1}^{r_i} z_{ia} \approx n\,\bar{r}\,\bar{z}_{w},\qquad
    Z_{\mathrm{unique}} = \sum_{o \in \mathcal{O}} z_o \approx n\,f_u\,\bar{z}_o
  equation: "7.7"
  inputs:
    - { symbol: n, label: "requested objects n", default: 1000000, min: 1000, max: 1000000000, scale: log10, format: si }
    - { symbol: r, label: "mean attempts per object r̄ (≤ bound r_i)", default: 1.2, min: 1, max: 5, step: 0.1, format: fixed1 }
    - { symbol: zw, label: "bytes on the wire per attempt, KiB", default: 50, min: 1, max: 10000, scale: log10, format: raw }
    - { symbol: fu, label: "objects verified as unique content", default: 0.9, min: 0.01, max: 1, step: 0.01, format: percent }
    - { symbol: zo, label: "retained bytes per unique object, KiB", default: 50, min: 1, max: 10000, scale: log10, format: raw }
  outputs:
    - { symbol: Zw, label: "Z_wire", formula: "n*r*zw*1024", format: bytes }
    - { symbol: Zu, label: "Z_unique (the Z of Eq. 7.1)", formula: "n*fu*zo*1024", format: bytes, emphasis: true }
    - { symbol: R, label: "Z_wire ÷ Z_unique", formula: "Zw/Zu", format: ratio }
states:
  - { anchor: formulation, label: "one attempt, all unique", variables: { r: 1, fu: 1, zw: 50, zo: 50 }, highlight: [Zw, Zu, R], note: "The only case with Z_wire = Z_unique: one attempt per object, all content unique, no expansion. Everywhere else the two identities differ." }
  - { anchor: algorithm, label: "line 3: bounded retries", variables: { r: 3, fu: 0.9, zw: 50, zo: 50 }, highlight: [r, Zw, R], note: "Line 3 schedules at most r_i attempts, each a distinct acquisition event. At three attempts per object the wire carries 3.3× the unique bytes. Illustrative." }
  - { anchor: failure-modes, label: "decompression bomb", variables: { r: 1, fu: 1, zw: 1, zo: 1000 }, highlight: [zo, Zu, R], note: "Illustrative: 1 KiB on the wire expanding to 1,000 KiB retained. Wire bytes say nothing about the expanded footprint, so line 4's admission limit must bound expanded bytes." }
```

## Mechanism

**Crawling and the Common Crawl formats.** Common Crawl documents three formats: "The WARC format is the raw data from the crawl, providing a direct mapping to the crawl process"; "WAT files contain important metadata about the records stored in the WARC format"; and "The acronym WET stands for 'WARC Encapsulated Text'. As many tasks only require textual information, the Common Crawl dataset provides WET files that only contain extracted plaintext" (OFFICIAL-DOCUMENTATION · R7.9). The data is hosted "on the bucket s3://commoncrawl/" with an HTTPS prefix "https://data.commoncrawl.org/" for access outside the cloud (OFFICIAL-DOCUMENTATION · R7.9); crawls are named `CC-MAIN-YYYY-WW` (OFFICIAL-DOCUMENTATION · R7.5, R7.9). Which format a corpus read is a fact to record, not to infer: C4 and RedPajama-V2 read WET (P02; "we used the web-extracted text (i.e., .wet files) from all 84 monthly snapshots between 2014 and April 2023", PAPER-REPORTED · R7.3); The Pile, RefinedWeb, FineWeb and DCLM read WARC (P03, P04, P06, P07); Dolma reads Common Crawl via CCNet and states that "WARC files from Common Crawl can be intersected with Dolma ids to recover original HTML files" (PAPER-REPORTED · P05). DCLM also reports that "most open source datasets, including C4, RedPajama, and Dolma-V1, use WET files" (PAPER-REPORTED · P07); the book records this as the format Dolma v1 read, consistent with CCNet's WET-based pipeline, and marks the recovery statement in P05 as a statement about *recoverability*, not about the format read (UNVERIFIED as to Dolma's exact input format). RefinedWeb's own paper is internally inconsistent: its method section says WARC via warcio, its datasheet says "We downloaded with warcio publicly available .WET files" (PAPER-REPORTED · P04); the method section is the more specific statement, but the inventory row carries `archive_format = UNVERIFIED (WARC per §3, WET per datasheet)`.

```figure
id: fig-7.14
kind: diagram
title: Which Common Crawl format each case-study corpus read
caption: >-
  Every corpus in §7.6 enters through one of two doors. WET is Common
  Crawl's own one-time extraction, which C4 and RedPajama-V2 read. WARC is
  the raw response, which The Pile, RefinedWeb, FineWeb and DCLM parse with
  their own extractor. The emphasised path is the FineWeb route whose
  WARC-versus-WET ablation made the extractor a training variable. Two
  dashed edges are unresolved facts, not choices: RefinedWeb's datasheet
  contradicts its method section, and Dolma's recoverability statement does
  not settle which format it read.
placement: wide
evidence: PAPER-REPORTED
source: [R7.9, R7.8, P02, P03, P04, P05, P06, P07, R7.3, R7.7]
concepts: [ms.section.7.3, ms.section.7.6]
alt: >-
  Diagram of Common Crawl formats and the corpora that read them. The CCBot
  crawl, named CC-MAIN-YYYY-WW and honouring robots.txt at crawl time, writes
  WARC files of raw HTTP responses on s3://commoncrawl/. WAT files hold
  metadata about WARC records, and WET files hold Common Crawl's own extracted
  plaintext. From WARC: jusText produces The Pile's Pile-CC; trafilatura
  produces RefinedWeb and, on the emphasised path, FineWeb and FineWeb2;
  resiliparse, 8× faster than trafilatura, produces DCLM-Pool with one WARC
  file per jsonl file. From WET: C4 (April 2019) directly, and RedPajama-V2
  (84 snapshots) and Dolma v1 through CCNet. Dashed edges: RefinedWeb's
  datasheet says WET while its method says WARC (UNVERIFIED), and Dolma ids
  can be intersected with WARC to recover HTML, which does not settle Dolma
  v1's input format (UNVERIFIED).
spec:
  direction: LR
  nodes:
    - { id: crawl, kind: process, label: "CCBot crawl, CC-MAIN-YYYY-WW", sub: "robots.txt honoured at crawl time" }
    - { id: warc, kind: dataset, label: "WARC: raw HTTP responses", sub: "s3://commoncrawl/", group: cc }
    - { id: wat, kind: dataset, label: "WAT: metadata about WARC records", group: cc }
    - { id: wet, kind: dataset, label: "WET: Common Crawl's own plaintext", sub: "one extraction for all users", group: cc }
    - { id: jus, kind: process, label: "jusText", group: ext }
    - { id: traf, kind: process, label: "trafilatura", sub: "Apache-2.0 from v1.8.0", group: ext }
    - { id: resi, kind: process, label: "resiliparse", sub: "8× faster than trafilatura (P07)", group: ext }
    - { id: ccnet, kind: process, label: "CCNet", sub: "LID, paragraph dedup, perplexity buckets" }
    - { id: pile, kind: dataset, label: "The Pile: Pile-CC" }
    - { id: rw, kind: dataset, label: "RefinedWeb", sub: "warcio + trafilatura (method section)" }
    - { id: fw, kind: dataset, label: "FineWeb, FineWeb2", sub: "trafilatura on warc files" }
    - { id: dclm, kind: dataset, label: "DCLM-Pool", sub: "one WARC file ↔ one jsonl file" }
    - { id: c4, kind: dataset, label: "C4", sub: "WET, April 2019" }
    - { id: rp2, kind: dataset, label: "RedPajama-V2", sub: "WET, 84 monthly snapshots" }
    - { id: dolma, kind: dataset, label: "Dolma v1", sub: "via CCNet; input format UNVERIFIED" }
  edges:
    - { from: crawl, to: warc }
    - { from: warc, to: wat, kind: dependency, label: "metadata of" }
    - { from: warc, to: wet, label: "CC's one-time extraction" }
    - { from: warc, to: jus }
    - { from: jus, to: pile }
    - { from: warc, to: traf, kind: emphasis }
    - { from: traf, to: fw, kind: emphasis }
    - { from: traf, to: rw }
    - { from: warc, to: resi }
    - { from: resi, to: dclm }
    - { from: wet, to: c4 }
    - { from: wet, to: ccnet }
    - { from: ccnet, to: rp2 }
    - { from: ccnet, to: dolma }
    - { from: wet, to: rw, kind: dependency, label: "datasheet says WET: UNVERIFIED" }
    - { from: dolma, to: warc, kind: dependency, label: "ids ∩ WARC recover HTML (P05)" }
  groups:
    - { id: cc, label: "Common Crawl archive (R7.9)" }
    - { id: ext, label: "extractors run by the corpus builder" }
```

**Robots handling.** The Robots Exclusion Protocol is specified by RFC 9309, which states plainly: "These rules are not a form of access authorization" (OFFICIAL-DOCUMENTATION · R7.10). The RFC's error semantics matter for provenance: if `robots.txt` is *unreachable* (server errors, 5xx) "the crawler MUST assume complete disallow", whereas if it is *unavailable* (4xx) "the crawler MAY access any resources on the server"; a cached copy "SHOULD NOT" be used "for more than 24 hours" without revalidation; and parsers must accept at least 500 KiB (OFFICIAL-DOCUMENTATION · R7.10). Common Crawl's crawler identifies itself as "CCBot/2.0 (https://commoncrawl.org/faq/)", can be excluded with `User-agent: CCBot` / `Disallow: /`, and publishes its IP ranges (OFFICIAL-DOCUMENTATION · R7.8). Corpora built on Common Crawl inherit its robots decisions at *crawl time*: DCLM writes "Common Crawl respects robots.txt, and thus our pool does so as well, giving content creators a mechanism to opt out" (PAPER-REPORTED · P07), and the FineWeb2 card says "CommonCrawl respects robots.txt at crawl time" while offering its own removal form (OFFICIAL-DOCUMENTATION · R7.7). The engineering consequence is that a robots decision is a *timestamped acquisition-event fact*, not a property of the page: a site that added a `Disallow` after the crawl is still in the archive. Cost line: one small fetch per host per 24 h, negligible in bytes; the retained field is `robots_status` ∈ {allowed, disallowed, unavailable, unreachable} with the fetch time (DERIVED from R7.10).

```figure
id: fig-7.15
kind: diagram
title: RFC 9309 outcomes as a recorded acquisition fact
caption: >-
  The error semantics are asymmetric: a server error means complete
  disallow, a missing file means access. Each outcome therefore lands in
  robots_status with its fetch time rather than being collapsed to
  allowed or blocked. The emphasised path is the ordinary one. The two
  dashed dependencies are the section's point. The field records a decision
  and grants nothing. A Disallow added after the crawl does not remove the
  page from the archive.
placement: inline
evidence: OFFICIAL-DOCUMENTATION
source: [R7.10, R7.8, P07, R7.7]
alt: >-
  Diagram of robots handling. CCBot/2.0, which sites can exclude with
  User-agent CCBot and Disallow slash, fetches /robots.txt for a host at most
  once per 24 hours, the RFC's cache limit. A branch on the HTTP outcome: 5xx
  means unreachable, and the crawler must assume complete disallow; 4xx means
  unavailable, and the crawler may access any resource; 2xx leads to parsing,
  where parsers must accept at least 500 KiB. All three outcomes write
  robots_status (allowed, disallowed, unavailable or unreachable) with the
  fetch time. Two dependencies: the rules are not a form of access
  authorization, and a Disallow added after the crawl leaves the page in the
  archive, so the field is a crawl-time fact, not a page property.
spec:
  direction: LR
  nodes:
    - { id: bot, kind: node, label: "CCBot/2.0", sub: "User-agent: CCBot · Disallow: /" }
    - { id: fetch, kind: process, label: "fetch /robots.txt for the host", sub: "cache ≤ 24 h, then revalidate" }
    - { id: st, kind: branch, label: "HTTP outcome?" }
    - { id: s5, kind: state, label: "unreachable (5xx)", sub: "MUST assume complete disallow" }
    - { id: s4, kind: state, label: "unavailable (4xx)", sub: "MAY access any resource" }
    - { id: s2, kind: process, label: "parse rules", sub: "accept at least 500 KiB" }
    - { id: rs, kind: metric, label: "robots_status + fetch time", sub: "allowed · disallowed · unavailable · unreachable" }
    - { id: auth, kind: boundary, label: "not a form of access authorization", sub: "RFC 9309" }
    - { id: late, kind: dependency, label: "Disallow added after the crawl", sub: "page stays in the archive" }
  edges:
    - { from: bot, to: fetch }
    - { from: fetch, to: st, kind: emphasis }
    - { from: st, to: s5, label: "5xx" }
    - { from: st, to: s4, label: "4xx" }
    - { from: st, to: s2, kind: emphasis, label: "2xx" }
    - { from: s5, to: rs }
    - { from: s4, to: rs }
    - { from: s2, to: rs, kind: emphasis }
    - { from: rs, to: auth, kind: dependency, label: "records a decision, grants nothing" }
    - { from: late, to: rs, kind: dependency, label: "crawl-time fact, not page property" }
```

**APIs.** API acquisition observes a source through credentials, pagination state and observation time. Two published cases fix the record fields. InstructGPT's prompts came from "the OpenAI API Playground", users "were informed that their data could be used to train further models via a recurring notification", prompts were deduplicated by long common prefix, capped at about 200 per user id, and split by user id (PAPER-REPORTED · P21) — so the acquisition event carries a consent-notification version and a user-scope key. Dolma's Reddit source came via Pushshift dumps that are "no longer distributed by Pushshift" after Reddit API term changes (PAPER-REPORTED · P05) — so the event must record the terms in force at collection, because the interface can close. The manifest records endpoint, query, cursor identity, and an access-scope identifier, never the credential (ASSUMED protocol).

**Repositories.** The Stack v2 is built "on top of the Software Heritage (SH) archive" using the SH graph dataset, "a fully deduplicated Merkle DAG representation of the full archive", taking the 2023-09-06 graph version, the latest revision of each repository's main branch, and deduplicating repositories "based on the unique hashes of their contents (column directory_id)" (PAPER-REPORTED · R7.12). Its card exposes `blob_id`, `directory_id`, `path`, `content_id`, `repo_name`, `snapshot_id`, `revision_id`, `branch_name`, `visit_date`, `revision_date`, `committer_date`, `detected_licenses`, `license_type` and more, and file contents are fetched "from the Software Heritage S3 bucket" by blob id (OFFICIAL-DOCUMENTATION · R7.13). The Software Heritage identifier (SWHID) is described as "intrinsically bound to the software components" and needing "no central registry" (PAPER-REPORTED · R7.12) — the model source identifier for code. The earlier route, GitHub through Google BigQuery restricted to Apache, BSD and MIT licences, is what RedPajama-V1 followed from the LLaMA description (PAPER-REPORTED · R7.3). A branch name is descriptive metadata; the identity is the revision or blob hash (DERIVED).

**Document parsing and OCR.** Scientific text enters through parsed PDFs or source: Dolma's peS2o is "derived from the Semantic Scholar Open Research Corpus (S2ORC)" and "metadata in S2ORC can be used to obtain original PDF" (PAPER-REPORTED · P05); RedPajama-V1 took arXiv LaTeX following LLaMA (PAPER-REPORTED · R7.3). Where only rendered pages exist, OCR is a learned extractor: Nougat frames PDF parsing as "an Optical Character Recognition (OCR) task for processing scientific documents into a markup language", motivated by the fact that "the PDF format leads to a loss of semantic information, particularly for mathematical expressions" (PAPER-REPORTED · R7.20). For OCR, Eq. 7.6's h_tool must include model weights, and the record retains page ordinals, rendering configuration and any confidence output — a model output, not a calibrated probability of correctness (DERIVED). Mathematical notation, column order and footnote placement need targeted audits because readable text can encode the wrong relationship.

**HTML text extraction.** Three extractors appear in the case studies, and the book states only what the papers report. *trafilatura*: used by RefinedWeb, which cites an external comparison finding it "the best non-commercial library for retrieving content from blog posts and news articles" and applies extra line-level corrections afterwards (PAPER-REPORTED · P04); used by FineWeb "on the raw HTML from CommonCrawl's warc files" (OFFICIAL-DOCUMENTATION · R7.5), chosen "from visual inspection" against other libraries (PAPER-REPORTED · P06); its README describes extraction of main text plus "Metadata (title, author, date, site name, categories and tags)" and states the package "is distributed under the Apache 2.0 license" with "Versions prior to v1.8.0 ... under GPLv3+ license" (OFFICIAL-DOCUMENTATION · R7.11) — a tooling-licence fact the inventory must carry because it changed at a version boundary. *resiliparse*: used by DCLM for the whole 240T-token pool because, at similar downstream performance, "resiliparse is 8× faster to run and hence more practical for large-scale processing" (PAPER-REPORTED · P07); its repository describes "performance-optimized" extraction utilities and FastWARC, "a high-performance WARC parsing library" (OFFICIAL-DOCUMENTATION · R7.14). *jusText*: used by The Pile's Pile-CC (PAPER-REPORTED · P03). FineWeb2 additionally reports repairing "trafilatura created artifacts related to tables" and disabling Gopher paragraph filters "as trafilatura does not keep them" (OFFICIAL-DOCUMENTATION · R7.7) — extraction shapes what later filters can see, which is why Eq. 7.1's stage yields are not independent.

```figure
id: fig-7.16
kind: compare
title: Four extraction routes, as their users report them
caption: >-
  The only row with numbers measured side by side is DCLM's Core score at
  1B-1x. It separates both WARC extractors from WET by at least 3.4 points
  and the two WARC extractors from each other by 0.4. The throughput row is
  what decided DCLM's choice. The artefact row is why extractor identity
  belongs in pipeline identity: each route loses something different, and
  downstream filters inherit the loss.
placement: wide
evidence: PAPER-REPORTED
source: [P02, P03, P04, P06, P07, R7.3, R7.7, R7.11, R7.14]
concepts: [ms.section.7.3, ms.section.8.1]
alt: >-
  Comparison of four extraction routes. WET, Common Crawl's own extraction:
  read by C4 and RedPajama-V2, and by Dolma v1 per P07; DCLM Core 20.7 at the
  1B-1x scale; no extraction cost to the builder; retains navigation menus,
  ads and boilerplate per P04 and P06. jusText: run on WARC for The Pile's
  Pile-CC, reported to give higher quality than WET; no Core score reported;
  throughput, artefacts and licence not stated in the sources. trafilatura:
  run on WARC by RefinedWeb and FineWeb and inherited by FineWeb2; Core 24.5;
  chosen as the best non-commercial library in an external comparison (P04)
  and by visual inspection (P06); FineWeb2 repaired table artefacts and
  disabled paragraph filters because paragraphs are not kept; Apache-2.0 from
  v1.8.0, GPLv3+ before. resiliparse: run on WARC for the whole DCLM pool;
  Core 24.1; 8× faster than trafilatura at similar downstream performance;
  companion FastWARC parser; artefacts and licence not stated.
spec:
  axis: "What the cited papers and repositories report about each extraction route from Common Crawl; Core scores are DCLM's 1B-1x comparison only"
  columns:
    - { id: wet, label: "WET (Common Crawl's extraction)" }
    - { id: jus, label: "jusText on WARC" }
    - { id: traf, label: "trafilatura on WARC" }
    - { id: resi, label: "resiliparse on WARC" }
  rows:
    - { dimension: "read or run by", values: { wet: "C4 (P02), RedPajama-V2 (R7.3); Dolma v1 per P07", jus: "The Pile, Pile-CC (P03)", traf: "RefinedWeb (P04), FineWeb (P06); inherited by FineWeb2 (R7.7)", resi: "DCLM, the whole 240 T-token pool (P07)" } }
    - { dimension: "DCLM Core score, 1B-1x scale", values: { wet: "20.7", jus: "not reported", traf: "24.5", resi: "24.1" } }
    - { dimension: "extraction cost to the builder", values: { wet: "none: one extraction amortised across all users", jus: "NOT-DISCLOSED", traf: "baseline of P07's speed comparison; FineWeb calls custom extraction 'relatively costly'", resi: "8× faster than trafilatura (P07)" } }
    - { dimension: "why chosen", values: { wet: "not stated by its users; cheap because the parse is amortised (DERIVED)", jus: "'higher quality output than directly using the WET files' (P03)", traf: "external comparison (P04); visual inspection (P06)", resi: "similar downstream performance at 8× the speed (P07)" } }
    - { dimension: "reported artefact", values: { wet: "navigation menus, ads, boilerplate retained (P04, P06)", jus: "NOT-DISCLOSED", traf: "table artefacts; paragraphs not kept, so Gopher paragraph filters disabled (R7.7)", resi: "NOT-DISCLOSED" } }
    - { dimension: "tool licence (a pipeline-identity field)", values: { wet: "not a tool the builder runs", jus: "not stated in the chapter's sources", traf: "Apache-2.0 from v1.8.0; GPLv3+ before (R7.11)", resi: "not stated in the chapter's sources" } }
    - { dimension: "companion tooling", values: { wet: "WAT metadata files", jus: "none stated", traf: "metadata: title, author, date, site name, categories, tags", resi: "FastWARC, 'a high-performance WARC parsing library' (R7.14)" } }
```

**Metadata retention and source identifiers.** What survives extraction is a design decision that each corpus made differently. FineWeb keeps `id` (the Common Crawl `urn:uuid` record id), `dump`, `url`, `date`, `file_path` (the S3 path of the WARC file), `language`, `language_score`, `token_count` (OFFICIAL-DOCUMENTATION · R7.5); FineWeb2 adds `language_script`, `top_langs`, and `minhash_cluster_size` (OFFICIAL-DOCUMENTATION · R7.7); DCLM-Pool keeps the WARC headers themselves — `WARC-Record-ID`, `WARC-Target-URI`, `WARC-Date`, `WARC-IP-Address`, `WARC-Payload-Digest`, `WARC-Block-Digest`, `Content-Type`, and `warcinfo` (PAPER-REPORTED · P07, Table 9; OFFICIAL-DOCUMENTATION · R7.4); the Stack v2 keeps the SH and GHArchive fields above (R7.13). The vocabulary for lineage itself is standardised: W3C PROV-DM defines provenance as "information about entities, activities, and people involved in producing a piece of data or thing", with `used`, `wasGeneratedBy`, `wasDerivedFrom` and `wasAttributedTo` as the core relations (OFFICIAL-DOCUMENTATION · R7.33); Eq. 7.6's parent link is a `wasDerivedFrom` edge and (h_tool, h_config) identifies the activity. Retention has a privacy cost: a `WARC-IP-Address` or a full URL can identify a person or a tenant, so sensitive locators live in an access-controlled sidecar keyed by u_out while the public record carries only the opaque identifier (ASSUMED protocol; see §7.4). Keep *missing*, *unavailable*, *withheld*, and *not applicable* as distinct states; a discarded field cannot be recovered by adding a column later.

```figure
id: fig-7.17
kind: hierarchy
title: What each kind of source reference lets an audit do
caption: >-
  Levels are ordered by what a reference supports, from locating a page to
  attributing a record to a transformation. The ordering is DERIVED from
  this section; the field names are the corpora's own. The emphasised level
  is the minimum that lets a web record be replayed: FineWeb and DCLM retain
  it, and a URL-only corpus stops two levels above it. Digests detect drift
  but cannot restore removed bytes. Only Eq. 7.6 adds the transformation
  identity.
placement: inline
evidence: DERIVED
source: [R7.5, R7.4, P07, R7.12, R7.13, R7.33, "DERIVED:eq-7.6"]
concepts: [ms.section.7.3, ms.section.12.1]
alt: >-
  Six levels of source reference, weakest first. URL, a locator: names a
  place, and replay may return other bytes or nothing. URL with fetch time and
  crawl id, as in FineWeb's url, date and dump fields: locates a crawl, not a
  record. WARC-Record-ID plus archive path, emphasised, as in FineWeb's id and
  file_path and DCLM's WARC-Record-ID with one WARC file per jsonl file: the
  minimum for replaying a web record. Payload and block digests, as in DCLM's
  WARC-Payload-Digest and WARC-Block-Digest: detect drift but cannot restore
  bytes. Content-addressed identifier, the SWHID and blob_id of The Stack v2:
  intrinsic to the content and needing no central registry. u_out with tool
  and configuration digests (Eq. 7.6): adds the transformation identity, a
  PROV-DM wasDerivedFrom edge.
spec:
  direction: down
  levels:
    - { label: "URL (locator)", kind: dependency, note: "names a place; replay may return other bytes or nothing" }
    - { label: "URL + fetch time + crawl id", kind: state, note: "FineWeb url, date, dump; locates a crawl, not a record" }
    - { label: "WARC-Record-ID + archive path", kind: dataset, emphasis: true, note: "FineWeb id + file_path; DCLM WARC-Record-ID, one WARC ↔ one jsonl; minimum for replay" }
    - { label: "payload / block digest", kind: metric, note: "DCLM WARC-Payload-Digest, WARC-Block-Digest; detects drift, cannot restore bytes" }
    - { label: "content-addressed identifier", kind: dataset, note: "Stack v2 SWHID / blob_id: intrinsic, no central registry (R7.12)" }
    - { label: "u_out with tool + config digests", kind: process, note: "Eq. 7.6: adds transformation identity; PROV-DM wasDerivedFrom edge" }
```

Cost line for the whole mechanism: acquisition is egress-bound (Common Crawl is free to read; DCLM streamed "directly from S3 to EC2 using the Ray data processing framework", PAPER-REPORTED · P07); storage of raw archives dominates capacity (DCLM-Pool: "200B documents (370TB after gzip compression)", PAPER-REPORTED · P07); extraction is CPU-bound with an 8× throughput spread between two extractors of similar quality (P07); OCR adds accelerator inference whose cost is NOT-DISCLOSED for any corpus inspected; metadata retention adds tens of bytes per record (DERIVED).

## Algorithm

```text
Algorithm 7.3 — Bounded acquisition with extraction lineage
INPUT   fixed request manifest (locators, archive format, observation window), source policies (robots, terms), byte/page/time limits, tool bundle (h_tool, h_config)
OUTPUT  committed records with u_out (Eq. 7.6), acquisition ledger (events, robots_status, failures), sidecar of sensitive locators
STATE   immutable staging objects, bounded work queue, per-request attempt counter
INVARIANT  every committed record resolves to an observed parent and to tool/config digests; no locator without a fetch time
1  validate manifest identities, limits, and permitted source scope before dispatch
2  for each host: fetch robots.txt ≤ once per 24 h; set robots_status per RFC 9309 (5xx → disallow, 4xx → allowed, else parse)
3  for each request: schedule at most r_i attempts with backoff; each attempt is a distinct acquisition event
4  stream into bounded staging; stop on byte, time, expansion, or scope violation → typed failure
5  validate integrity (declared checksum, content length, digest of received bytes); register content identity u_in
6  decode and extract within expansion, page, recursion, and CPU limits; for OCR include model weights in h_tool
7  attach parent u_in, (h_tool, h_config), ordinal j, payload digest; compute u_out
8  route locators, IPs, and credential-adjacent fields to the sidecar keyed by u_out
9  stage payloads and lineage together; verify counts and digest references
10 publish one manifest pointer only after every referenced object is durable; incomplete jobs stay unpublished
11 return committed manifest identity and all failure counts by type; terminate
```
Complexity: with Z admitted expanded bytes, n objects, and extractor cost E, digesting is O(Z), sorting fixed-width identifiers O(n log n), total O(Z + n log n + E); OCR's E is not linear in text length and cannot be hidden in a "linear" claim (DERIVED). RAM is bounded by the staging buffer plus the largest admitted working object; concurrency is bounded independently of input size. All-pairs payload comparison is excluded: it is quadratic and belongs to deduplication ([§8.3](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md)), not acquisition.

## Implementation

The reference stack has no acquisition layer; placement is therefore on the consumer side and everything else is routed through the plan's anchors. **Hugging Face Transformers** (#26, *Model definition / adaptation*) consumes extracted text through a pinned tokenizer (OFFICIAL-DOCUMENTATION · R7.30); **PyTorch** (#17, *Model / autograd framework*) is the training input path (OFFICIAL-DOCUMENTATION · R7.31); **Nanotron** (#35, *Distributed training*) is the trainer FineWeb used for its ablation models (OFFICIAL-DOCUMENTATION · R7.5, R7.32). None is a crawler or extractor.

*Outside the reference stack (plan anchors: FineWeb P06, Dolma P05, DCLM P07, Appendix B "Datasets"):* `datatrove` provides `io` dependencies "to read `warc/arc/wet` files", `extractors` that "extract text content from raw formats (such as webpage html)", a `Document` with `text`, `id`, and `metadata`, and Slurm and Ray executors (OFFICIAL-DOCUMENTATION · R7.15); the Dolma toolkit provides taggers and "Speedy document deduplication using a Rust Bloom filter" (OFFICIAL-DOCUMENTATION · R7.16); CCNet performs fastText language identification and paragraph-level deduplication over Common Crawl shards (PAPER-REPORTED · P05, R7.17). The proposed interface from extraction to the consumers above is an immutable shard manifest carrying record counts, schema version, extractor identity (h_tool, h_config) and tokenizer id.

```text
Systems trace (WARC → training record)
fetch WARC segment → latency: network / memory: streaming / compute: none / communication: S3 or HTTPS egress / failure: moved path, truncated stream
parse records → latency: CPU / memory: one record / compute: WARC parsing (FastWARC-class) / communication: none / failure: malformed record, wrong Content-Type
extract text → latency: CPU-bound; 8× spread between extractors (P07) / memory: DOM per page / compute: E per page / failure: silent loss of tables, code, math
identify (Eq. 7.6) → latency: one digest / memory: O(1) / compute: O(bytes) / failure: locator stored instead of identity
write shard + sidecar → latency: I/O / memory: buffer / communication: object store / failure: manifest published before shard durable (§12.5)
```

## Experimental design

### Experiment 7.3 — Extractor as a training variable, with lineage replay

- **Hypothesis:** at a fixed token budget, model quality differs between WET text and WARC-extracted text from the *same* WARC records, and every record in both arms can be replayed to its `WARC-Record-ID` and archive path; a change of extractor version is distinguishable from a change of source bytes by Eq. 7.6.
- **Setup:** one Common Crawl crawl (`CC-MAIN-YYYY-WW`, ASSUMED choice); arms: WET as shipped; trafilatura on WARC; resiliparse on WARC; language identification only, no deduplication (the P06 ablation design).
- **Independent variables:** extractor (three arms); extractor version (two versions of one extractor, for the replay sub-test).
- **Controlled variables:** WARC segments, tokenizer, model size, token budget, seeds, evaluation suite.
- **Dataset/workload:** the selected crawl's WARC and WET files; held-out crawl for evaluation loss.
- **Hardware:** CPU cluster for extraction; one accelerator type for training; record counts and versions.
- **Metrics:** held-out loss and the task aggregate of P06/P07 with seed intervals; extraction throughput (pages/s/core) per extractor; lineage completeness λ (verification.md) per arm; fraction of records whose payload digest changes across extractor versions.
- **Baselines:** WET arm.
- **Expected result:** direction as reported by P06 and P07 (WARC-based arms above WET); magnitude at the reader's scale UNVERIFIED; λ = 1 for all arms by construction if line 7 of Algorithm 7.3 is enforced.
- **Ablation:** drop `file_path`/`WARC-Record-ID` retention and attempt replay from URL alone.
- **Interpretation:** whether the published extractor effect transfers, and whether URL-only lineage suffices (it is predicted not to, since URLs change).
- **Threats to validity:** a single crawl; extractor defaults differ across versions; downstream filters may interact with extraction (FineWeb2's table-artefact fixes, R7.7).

Proposal only; no run was executed.

## Observations

**What the paper claims.** P06 claims trafilatura-on-WARC outperforms WET under minimal filtering and that custom extraction is costly; P07 claims resiliparse and trafilatura beat WET by at least 2.5 Core points at 1B-1x and that resiliparse is 8× faster; P04 claims WARC via warcio plus trafilatura plus line corrections; P03 claims jusText on WARC beats WET; P02 built C4 from WET; R7.12 claims SWHID-based, Merkle-DAG-deduplicated acquisition from Software Heritage; R7.20 claims OCR-to-markup for scientific PDFs (all PAPER-REPORTED).

**What the evidence shows.** The extractor effect is reported by two independent groups (P06, P07) with consistent direction at small scale; neither result has been reproduced by a third party known to the book, and both were measured with each group's own filters and evaluation suites. The internal WARC/WET inconsistency inside P04 and the P07-versus-P05 ambiguity about Dolma's input format show that even careful papers under-specify this field.

**What we infer.** Because extraction changes what filters see, extractor identity must be part of the pipeline identity of every case study in §7.6 (DERIVED). We infer, marked ASSUMED, that the 8× throughput gap is the dominant cost driver at pool scale and that quality parity between the two WARC extractors will not hold on table- and code-heavy pages; no source measures this.

**What remains unknown.** OCR cost and accuracy for any production corpus are NOT-DISCLOSED. Which archive format Dolma v1 read is UNVERIFIED (conflicting statements across P05 and P07). Robots status per record is not retained by any inspected corpus; only the crawl-time policy is stated (NOT-DISCLOSED at record level).

## Failure modes

> **Failure mode — Locator-as-identity.** *Symptom:* replay from URL returns different bytes or nothing. *Cause:* URLs name locations, not content. *Detection:* payload digest at replay ≠ recorded h_payload. *Mitigation:* store `WARC-Record-ID` + archive path (web) or SWHID (code); Algorithm 7.3 line 5.

> **Failure mode — Decompression bomb.** *Symptom:* worker OOM on a small compressed object. *Cause:* expansion ratio unbounded. *Detection:* expanded bytes exceed the admission limit. *Mitigation:* per-stage expansion limits (line 4).

> **Failure mode — Silent structural loss.** *Symptom:* tables, code blocks or formulas vanish while the page "extracts fine". *Cause:* main-content heuristics classify them as boilerplate; FineWeb2 reports trafilatura table artefacts (R7.7). *Detection:* per-type fidelity audit on a fixture. *Mitigation:* record extractor identity; re-extract on demand from WARC.

> **Failure mode — Cursor cycle.** *Symptom:* an API job is busy with no new records. *Cause:* pagination cursor repeats. *Detection:* bounded cursor history. *Mitigation:* terminate on cycle; log as failure.

> **Failure mode — Stale robots cache.** *Symptom:* pages fetched after a `Disallow` was added. *Cause:* cache beyond 24 h (R7.10). *Detection:* robots fetch time older than page fetch time minus 24 h. *Mitigation:* revalidate; mark records with `robots_status` uncertain.

> **Failure mode — Sidecar orphaning.** *Symptom:* public records exist whose locators cannot be found for a deletion request. *Cause:* sidecar and shard published separately. *Detection:* count mismatch at manifest publication. *Mitigation:* lines 9–10, joint staging and a single manifest pointer.

## Siblings

**Normalization** — [§8.1](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-1-normalization.md)
Why it exists: extracted text still carries encoding damage, boilerplate lines and segmentation ambiguity. What assumption changed: the input is already text with a source identifier. What objective changed: none. What problem it solved: cleaning without touching acquisition identity. What new failure mode it introduced: normalisation that destroys evidence needed for replay. Changed primitive: bytes → text becomes text → text.

**Transformation execution** — [§12.2](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md)
Why it exists: running Algorithm 7.3-class pipelines at pool scale. What assumption changed: the transformation identity is given; the problem is scheduling, sharding and resumption. What objective changed: throughput and resumability. What problem it solved: 370 TB-class pools. What new failure mode it introduced: partial publication. Changed primitive: single job → executor.

**Corpus construction for retrieval** — [§49.1](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/49-1-corpus-construction.md)
Why it exists: the same acquisition feeding an index rather than gradients. What assumption changed: records must remain addressable and deletable online. What objective changed: relevance. What problem it solved: freshness. What new failure mode it introduced: chunk lineage. Changed primitive: snapshot → live index.

## Extensions

For multimodal documents, text, image crops, timestamps and page coordinates become aligned children of one acquisition event with a shared u_in (ASSUMED). For interactive trajectories the "archive" is the environment: the acquisition event records environment version, policy revision and seed, and replay may be impossible even with every observation stored ([§11.5](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md)). For enterprise change feeds, add source sequence numbers and explicit gaps. For long-context training, document-boundary metadata from extraction (page and block ordinals) is what packing in [§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md) consumes.

## Limitations

The protocol proves traceability relative to recorded observations; it cannot establish that the remote source was truthful, complete, or authorised by every affected party, and a payload digest cannot certify semantic correctness. Where raw retention is prohibited, replay uses permitted evidence and reports the resulting limit. The reported extractor effects hold at the scales and suites of P06 and P07 only; the section is falsified as guidance if Experiment 7.3 shows no extractor effect at a matched budget or shows λ < 1 under Algorithm 7.3, which would mean the lineage fields are insufficient.

## Reproducibility

Versions: P02, P03, P04 (ar5iv), P05 (arXiv HTML v2), P06 (arXiv HTML v2), P07 (arXiv HTML v4), P21 (ar5iv), R7.3, R7.12, R7.20 (arXiv abs) — accessed 2026-09-20; R7.4, R7.5, R7.7, R7.11, R7.13, R7.14, R7.15, R7.16 — raw README/card files, `main` branches, commits not pinned, accessed 2026-09-20; R7.8, R7.9 (Common Crawl pages), R7.10 (RFC 9309 text), R7.33 (PROV-DM) — accessed 2026-09-20; R7.30, R7.31, R7.32 — documentation roots opened 2026-09-23. Artifacts: inventory columns `archive_format`, `extractor_id`, `extractor_version`, `source_identifier`, `robots_status`, `sidecar_ref` in [verification.md](verification.md). Metric definitions: Eq. 7.6–7.7; λ in verification.md. Unresolved: Dolma v1 archive format (UNVERIFIED); OCR costs (NOT-DISCLOSED).

## References

P02, P03, P04, P05, P06, P07, P21, R7.3, R7.4, R7.5, R7.7, R7.8, R7.9, R7.10, R7.11, R7.12, R7.13, R7.14, R7.15, R7.16, R7.17, R7.20, R7.30, R7.31, R7.32, R7.33; Eq. 7.6–7.7.
