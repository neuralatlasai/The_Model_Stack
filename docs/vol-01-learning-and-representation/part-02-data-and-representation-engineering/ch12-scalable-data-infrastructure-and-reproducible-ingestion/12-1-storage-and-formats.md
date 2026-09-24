---
id: ms.section.12.1
entity_type: section
title: Storage and formats
short_title: Storage and formats
section: 12.1
slug: 12-1-storage-and-formats
parent: ms.chapter.12
prev_sibling: null
next_sibling: ms.section.12.2
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11]
downstream: [ms.chapter.19, ms.chapter.30]
word_count_target: 1800
volume: 1
part: 2
chapter: 12
related: []
relations: []
axes: {lifecycle: [data, pretraining], mechanism: [data_ingestion, reproducibility], feedback_setting: [], modality: [text, code]}
papers: [P05]
implementations: [impl.pytorch, impl.nvidia-megatron-core, impl.torchtitan, impl.mosaicml-llm-foundry]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# 12.1 Storage and formats

## Scope

**KNOWN — chapter matrix.** This section owns the physical representation of a dataset build: columnar files, object storage, compressed shards, indexed sequences, metadata tables, and immutable snapshots. It preserves the source identities established in [§7.3](../ch07-data-provenance-acquisition-and-dataset-semantics/07-3-acquisition-and-extraction.md) and tokenizer identities established in [§10.6](../ch10-tokenization-serialization-and-interface-correctness/10-6-migration-and-compatibility.md). Success means that an input occurrence resolves to authenticated bytes and a declared interpretation. “Same pathname” and “same dataset name” are insufficient identifiers.

## Why this exists

**DERIVED — identity argument.** A training run consumes a sequence of interpreted records, whereas storage exposes files, objects, and byte ranges. If an object changes behind a stable URI, replaying a recorded row offset can return different content. If a tokenizer changes while token identifiers remain physically readable, identical bytes can acquire a different meaning. The storage contract therefore needs both physical identity and semantic identity.

**DERIVED — access argument.** A layout that minimizes archive size need not minimize training cost. A sequentially compressed shard can make a small random request require decoding a much larger prefix. Conversely, writing every record as a separate object can eliminate prefix decoding while multiplying requests and metadata. The decision is about the access distribution, recovery granularity, and admissible memory, rather than a universal ordering of formats.

## Intuition

**DERIVED.** Separate three address spaces. The object address identifies a physical artifact. The record address identifies an item within a particular artifact revision. The occurrence address identifies one scheduled use of that record; oversampling creates multiple occurrences without creating multiple source records. A replay audit fails if it collapses these three identities into one integer.

> **Definition — dataset snapshot.** An immutable manifest that binds an ordered artifact inventory to content digests, schema and transformation identities, and declared record-membership rules.

**DERIVED.** Immutability is a property of the publication protocol. A digest stored next to an object detects disagreement only if the reader validates it against a trusted manifest. A digest fetched from the same mutable, untrusted location as its payload does not independently authenticate either.

## Formulation

**MATHEMATICALLY-DERIVED — representation accounting.** For a deliberately specified indexed layout containing a flat token array and one unsigned offset per document boundary,

$$
M_{\mathrm{layout}}=b_{\mathrm{tok}}D_{\mathrm{stored}}
+b_{\mathrm{off}}(n_{\mathrm{doc}}+1)+M_{\mathrm{meta}}.
$$
*(Eq. 12.1)*

where $D_{\mathrm{stored}}$ is stored tokens, $n_{\mathrm{doc}}$ is documents, $b_{\mathrm{tok}}$ and $b_{\mathrm{off}}$ are bytes per token identifier and offset, and $M_{\mathrm{meta}}$ is all remaining metadata. This is an accounting model, not the on-disk specification of a named library.

**MATHEMATICALLY-DERIVED.** With $D_{\mathrm{stored}}=10^9$, $n_{\mathrm{doc}}=10^6$, four-byte token identifiers, and eight-byte offsets, the arrays occupy $4{,}008{,}000{,}008$ bytes before metadata. The example is synthetic arithmetic. Integer offsets must accommodate the largest byte or element address under the chosen convention; validating token vocabulary range does not validate offset range.

$$
a_{\mathrm{read}}=\frac{Q_{\mathrm{fetched}}}{Q_{\mathrm{useful}}},
\qquad
a_{\mathrm{decode}}=\frac{Q_{\mathrm{decoded}}}{Q_{\mathrm{useful}}}.
$$
*(Eq. 12.2)*

where each $Q$ is a byte count at a stated representation boundary and $Q_{\mathrm{useful}}>0$. **DERIVED.** These ratios answer different questions: compressed bytes transferred cannot be compared to uncompressed useful bytes as if they were an efficiency percentage.

~~~figure
id: fig-12.3
kind: calculator
title: Indexed token-array capacity
caption: Illustrative layout from Eq. 12.1; excludes metadata, compression, allocator overhead, and library-specific headers.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-12.1
alt: One billion four-byte token identifiers and one million plus one eight-byte offsets occupy 4,008,000,008 bytes before metadata.
spec:
  tex: M=b_{\mathrm{tok}}D_{\mathrm{stored}}+b_{\mathrm{off}}(n_{\mathrm{doc}}+1)
  equation: "12.1"
  inputs:
    - {symbol: Dt, label: stored tokens, default: 1000000000, min: 1, max: 1000000000000, format: integer}
    - {symbol: nd, label: documents, default: 1000000, min: 1, max: 1000000000, format: integer}
    - {symbol: bt, label: bytes per token, default: 4, min: 2, max: 8, options: [2, 4, 8], format: integer}
    - {symbol: bo, label: bytes per offset, default: 8, min: 4, max: 8, options: [4, 8], format: integer}
  outputs:
    - {symbol: M, label: array bytes, formula: Dt*bt+(nd+1)*bo, format: bytes}
~~~

## Mechanism

**OFFICIAL-DOCUMENTATION — [R12.1](references.md#r121).** Hugging Face Datasets describes Arrow as a columnar memory representation and uses memory mapping to access datasets larger than resident memory. **DERIVED.** Memory mapping defers residency decisions; it does not eliminate page faults, storage reads, decoded buffers, or device transfers. A zero-copy claim must name the two compatible representations between which copying is avoided.

**OFFICIAL-DOCUMENTATION — [R12.2](references.md#r122).** Its streaming guide describes Parquet column selection and statistics-assisted filtering. **DERIVED.** A projection that excludes document text can reduce irrelevant work for a metadata audit. Once every example needs its text, that projection advantage may disappear. Predicate selectivity alone does not establish bytes avoided: the selected values may be dispersed across every physical group.

**OFFICIAL-DOCUMENTATION — [R12.6](references.md#r126).** NVIDIA Megatron-Core's dataset documentation distinguishes a token-data file from an index file and identifies document, sample, and shuffle mappings. **DERIVED.** Those mappings solve different address translations. Treating a shuffled sample index as an original source identifier destroys the inverse path needed for correction and deletion.

**DERIVED — publication design.** A defensible snapshot contains an explicit ordered list of object revisions, cryptographic content digests, byte lengths, compression and encoding identifiers, schema digest, tokenizer digest when applicable, transform identity, record counts, and an index convention. It also carries a link to the provenance inventory rather than copying mutable permissions into an unaudited string field. These are the chapter's proposed artifact fields, not claims that every cited framework stores them.

~~~figure
id: fig-12.4
kind: diagram
title: Three address spaces
caption: An occurrence refers to a record in a fixed snapshot; the index resolves that record to bytes without replacing its provenance identity.
placement: inline
evidence: DERIVED
source: DERIVED:eq-12.1
alt: Scheduled occurrence points to a source record and snapshot. The snapshot identifies an index and payload; the index resolves byte offsets into the payload.
spec:
  direction: LR
  nodes:
    - {id: o, kind: state, label: occurrence identity}
    - {id: r, kind: dataset, label: record identity}
    - {id: s, kind: dataset, label: snapshot manifest}
    - {id: i, kind: memory, label: sequence index}
    - {id: p, kind: memory, label: immutable payload}
  edges:
    - {from: o, to: r}
    - {from: r, to: s}
    - {from: s, to: i}
    - {from: s, to: p, kind: dependency}
    - {from: i, to: p, label: checked byte range}
~~~

**DERIVED.** Keep compressed and decoded limits separate. A small compressed object can expand beyond the worker budget. Bound decompressed bytes, document length, nested metadata depth, and records per task before allocation. For range access, verify offset monotonicity and checked addition of offset plus length against the authenticated object size. A valid digest does not make a corrupt index safe to dereference.

**DERIVED.** Metadata tables should support joins by stable record identity. Positional joins are unsafe after filtering, repartitioning, or a parser that emits multiple outputs per input. Preserve parent identity and child ordinal for one-to-many extraction. When compaction rewrites physical shards without changing logical records, produce a new physical snapshot plus an explicit logical-equivalence assertion; do not silently reuse the old manifest digest.

## Algorithm

**DERIVED — proposed publication protocol.**

~~~text
Algorithm 12.1 — Publish a bounded immutable snapshot
INPUT: ordered partitions; schema; transform identity; byte and record limits
OUTPUT: Result(snapshot digest, publication error)
STATE: unpublished object descriptors and validation ledger
INVARIANT: no committed manifest references an incomplete or unchecked payload
1. For each partition, stream bounded records into private staging objects.
2. Validate schema, record identities, offsets, counts, and decoded-size limits.
3. Finish each object; compute its content digest and durable descriptor.
4. Verify that every required partition has one selected successful result.
5. Canonically serialize the ordered descriptors and interpretation metadata.
6. Publish the immutable manifest only after all referenced objects are durable.
7. Atomically select the new manifest using the storage service's verified primitive.
8. On any error, retain the prior committed manifest and report staged artifacts.
~~~

**DERIVED — complexity.** With $Q$ payload bytes and $n_{\mathrm{obj}}$ descriptors already in canonical partition order, hashing and validation require $O(Q+n_{\mathrm{obj}})$ work. If descriptors arrive unordered, comparison sorting costs $O(n_{\mathrm{obj}}\log n_{\mathrm{obj}})$ comparisons; compare fixed-width partition keys rather than repeatedly decoding long URIs. Memory is bounded by streaming buffers plus the descriptor index. The publication primitive is an implementation prerequisite, not an assumed object-store rename.

## Implementation

**OFFICIAL-DOCUMENTATION.** PyTorch occupies *Model / autograd framework* and supplies the consumer interfaces [R12.5](references.md#r125). NVIDIA Megatron-Core and MosaicML LLM Foundry occupy *Distributed training*: the former exposes indexed dataset machinery, while the latter documents data preparation into StreamingDataset format [R12.6](references.md#r126), [R12.9](references.md#r129). Hugging Face Datasets is outside §4's fifty systems but is an explicit Chapter 12 source anchor.

**DERIVED.** Store flat arrays and compact offsets for the hot read path; keep large provenance objects in separately addressable metadata. This reduces repeated parsing without deleting the audit path. Local caching should key on snapshot and object digest, not basename. Reusing the same basename across two snapshots must never authorize reuse of different bytes.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 12.1 — Layout under a fixed access trace

- **Hypothesis:** format choice changes fetched and decoded work under an identical record trace.
- **Setup:** encode one immutable corpus in projected columnar, compressed sequential, and indexed token layouts.
- **Independent variables:** layout, shard size, compression, and access locality.
- **Controlled variables:** record set, tokenizer, scheduled occurrences, and semantic output.
- **Dataset/workload:** a permitted corpus plus bounded generated edge cases; hold out an access trace.
- **Hardware:** record CPU, RAM, storage, network, and cache state at execution.
- **Metrics:** Eq. 12.2, peak resident bytes, requests, and batch-ready latency distributions.
- **Baselines:** sequential scan and warmed local indexed reads.
- **Expected result:** workload-dependent differences; no universal winner is asserted.
- **Ablation:** remove projection and repeat after clearing only the experiment's cache.
- **Interpretation:** attribute changes to bytes, requests, or decoding before claiming training acceleration.
- **Threats to validity:** warm caches, unequal compression levels, and differing token sequences.

## Observations

**What the paper claims.** **PAPER-REPORTED — P05.** Dolma releases a documented corpus and curation toolkit; this motivates retaining intermediate identities, without establishing the proposed snapshot protocol.

**What the evidence shows.** **OFFICIAL-DOCUMENTATION.** The cited formats expose distinct access mechanisms. Their documentation is evidence of interfaces, not a measured comparison.

**What we infer.** **DERIVED.** A storage choice is admissible only if it preserves interpretation and satisfies the intended access and recovery contract.

**What remains unknown.** **UNVERIFIED.** Deployment-specific request costs, compression ratios, and cold-read performance remain unmeasured.

## Failure modes

~~~figure
id: fig-12.5
kind: stat-panel
title: Snapshot identity
caption: Proposed invariants for this section; these are design requirements, not measured deployment status.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-12.1
alt: >-
  object identity: manifest-bound digest. interpretation: schema and tokenizer. range validation: offset + length within object. publication: complete manifest only.
spec:
  header: SNAPSHOT IDENTITY
  rows:
    - {key: "object identity", value: "manifest-bound digest"}
    - {key: "interpretation", value: "schema and tokenizer"}
    - {key: "range validation", value: "offset + length within object"}
    - {key: "publication", value: "complete manifest only"}
~~~

> **Failure mode — mutable alias.** **DERIVED.** *Symptom:* identical run configuration yields different record hashes. *Cause:* a URI resolves to revised bytes. *Detection:* compare manifest-bound digests. *Mitigation:* pin immutable revisions and reject mismatches.

> **Failure mode — offset overflow.** **DERIVED.** *Symptom:* truncated, overlapping, or out-of-range reads. *Cause:* unchecked arithmetic or a mismatched offset unit. *Detection:* monotonicity, range, and unit validation. *Mitigation:* checked arithmetic and explicit byte-versus-element metadata.

## Siblings

**DERIVED.** Within this section, sequential compressed shards exchange random-access locality for sequential decode efficiency; columnar files exchange flexible projection for format and group metadata; indexed token sequences exchange tokenizer independence for direct token addressing. The objective need not change, but each representation introduces a different migration obligation. [§12.3](12-3-sampling-and-loading.md) owns the access schedule, and [§12.5](12-5-resume-semantics.md) owns replay; neither can repair an unidentified input artifact.

## Extensions

**DERIVED.** For multimodal inputs, a record may reference several media objects with independent decoding parameters. Pin all constituent digests and temporal alignment metadata. A stable text row with a mutable image URL is not an immutable training example. For agent traces, preserve event order separately from physical file order.

## Limitations

**DERIVED.** Content addressing establishes byte identity, not scientific validity, permissions, or truthful provenance. A reproducible snapshot can still contain inappropriate or incorrectly labeled records; the upstream governance and filtering chapters remain necessary.

## Reproducibility

**DERIVED — required artifact.** Retain the manifest, schema, all reader versions, tokenizer identity, encoding and compression settings, authenticated object descriptors, and the exact record trace used for comparison. Separate physical-byte equivalence from logical-record equivalence in the report.

## References

[P05 — Dolma](references.md#p05); [R12.1 — Arrow](references.md#r121); [R12.2 — streaming](references.md#r122); [R12.5 — PyTorch loading](references.md#r125); [R12.6 — indexed datasets](references.md#r126); [R12.9 — LLM Foundry](references.md#r129).
