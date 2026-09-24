---
id: ms.chapter.12
entity_type: chapter
title: Scalable data infrastructure and reproducible ingestion
short_title: Reproducible ingestion
section: null
slug: ch12-scalable-data-infrastructure-and-reproducible-ingestion
parent: ms.part.2
prev_sibling: ms.chapter.11
next_sibling: null
children: [ms.section.12.1, ms.section.12.2, ms.section.12.3, ms.section.12.4, ms.section.12.5, ms.section.12.6, ms.verification.12, ms.references.12]
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11]
downstream: [ms.chapter.19, ms.chapter.30]
word_count_target: 1500
volume: 1
part: 2
chapter: 12
related: []
relations: []
axes: {lifecycle: [data, pretraining], mechanism: [data_ingestion, reproducibility], feedback_setting: [], modality: [text, code]}
papers: [P05]
implementations: [impl.pytorch, impl.nvidia-megatron-core, impl.torchtitan, impl.mosaicml-llm-foundry, impl.nvidia-nemo-framework]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

VOLUME I / PART II — DATA AND REPRESENTATION ENGINEERING / CHAPTER 12

# 12 — Scalable data infrastructure and reproducible ingestion

**DERIVED — thesis.** Reproducible ingestion requires a coherent contract from immutable source bytes to committed training occurrences, because storage identity, sampling, packing, and recovery jointly determine the experiment actually executed.

6 sections · 1 spine paper · 5 reference-stack implementations · prerequisites: 07–11 · artifact: a resumable dataset build and loading pipeline · updated 2026-09-24

## Why this chapter exists

**DERIVED.** An offline corpus can pass every content-quality check and still produce the wrong training experiment. A loader can replicate samples across workers, a packer can expose unrelated documents to one another, and a restored iterator can skip records that were prefetched but never used. These defects need not produce invalid tensor shapes or obvious numerical failures. They alter exposure and conditioning while the training loop continues to report plausible losses.

**DERIVED.** As input pipelines become concurrent, their state spreads across source snapshots, task caches, sample indexes, workers, shuffle buffers, partial packs, and checkpoints. The dominant constraint is no longer simply reading bytes fast enough. It is preserving an identifiable relation between selected data, delivered tensors, and acknowledged optimization progress while bounding memory and recovery work.

**DERIVED.** The solution developed here separates logical identity from physical execution. Immutable manifests describe what may be read. Semantic build keys describe what transforms may be reused. Occurrence identities distinguish a scheduled repeat from a duplicate delivery. Explicit target and attention boundaries define what the model is trained to predict. A checkpoint manifest then binds input progress to one training boundary. Observability checks both resource flow and conservation of the intended experiment.

**KNOWN — ownership.** This chapter closes Part II. It uses the provenance, filtering, mixture, serialization, and trajectory contracts developed earlier; it does not redefine them. The manuscript provides a pipeline specification and verification protocol. Executable application and training implementations remain separate work.

## Concept map

**DERIVED — chapter architecture.**

~~~mermaid
flowchart TD
    A["[Dataset] Source revisions"] --> B["[Dataset] Immutable snapshot"]
    B --> C["[Process] Bounded transforms"]
    C --> D["[State] Semantic build key"]
    D --> E["[Dataset] Built shards and indexes"]
    E --> F["[Process] Occurrence selection"]
    F --> G["[Process] Rank and worker placement"]
    G --> H["[Memory] Shuffle and prefetch state"]
    H --> I["[Tensor] Packs and target masks"]
    I --> J["[Model] Training update"]
    J --> K["[State] Committed input boundary"]
    K --> L["[Dataset] Checkpoint manifest"]
    L --> H
    E --> M["[Metric] Integrity and lineage audit"]
    K --> M
    M --> N["[Process] Invalidation and rebuild"]
    N --> B
~~~

Equivalent structure:

- Source revisions are bound by an immutable snapshot.
  - Bounded transforms and semantic build keys produce shards and indexes.
  - Occurrence selection defines the logical exposure sequence.
    - Rank and worker placement feeds shuffle and prefetch state.
    - Packs and target masks determine the training-update inputs.
    - A committed input boundary is retained in a checkpoint manifest.
      - Restoring the manifest reconstructs the required loader state.
  - Integrity and lineage audits inspect built artifacts and committed exposure.
    - Invalidation and rebuild produce a new admissible snapshot.

## Position in the book

| Relation | Canonical connection | Consequence here |
|---|---|---|
| Prerequisites | [Provenance inventory, Ch. 07](../ch07-data-provenance-acquisition-and-dataset-semantics/README.md); [filtering, Ch. 08](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/README.md); [mixtures, Ch. 09](../ch09-data-mixtures-curricula-and-sample-efficiency/README.md); [serialization, §10.4](../ch10-tokenization-serialization-and-interface-correctness/10-4-conversation-serialization.md); [interactive records, §11.5](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md) | Preserve upstream meaning while changing execution |
| Siblings (same part) | [Part II chapter map](../README.md) | Content eligibility and exposure policy precede physical ingestion |
| Downstream | [Part IV: training science](../../part-04-training-science-and-adaptation/README.md); [Part V: hardware and distributed execution](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/README.md) | Chapters 19 and 30 consume the input and checkpoint contracts |
| Trades off with | [Storage, §12.1](12-1-storage-and-formats.md); [sampling, §12.3](12-3-sampling-and-loading.md); [resume, §12.5](12-5-resume-semantics.md) | Locality, memory, stochastic ordering, and replay have coupled costs |

## Sections

| Section | Title | What changes here | Primary evidence labels |
|---|---|---|---|
| [12.1](12-1-storage-and-formats.md) | Storage and formats | Physical objects acquire immutable identity and a declared interpretation | OFFICIAL-DOCUMENTATION; DERIVED |
| [12.2](12-2-transformation-execution.md) | Transformation execution | Concurrency is separated from semantic build order and publication | OFFICIAL-DOCUMENTATION; MATHEMATICALLY-DERIVED |
| [12.3](12-3-sampling-and-loading.md) | Sampling and loading | Selected occurrences acquire explicit consumer ownership | OFFICIAL-DOCUMENTATION; MATHEMATICALLY-DERIVED |
| [12.4](12-4-packing-and-masks.md) | Packing and masks | Tensor occupancy is constrained by objective equivalence | OFFICIAL-DOCUMENTATION; MATHEMATICALLY-DERIVED |
| [12.5](12-5-resume-semantics.md) | Resume semantics | A restart claim must state its preserved state and equivalence boundary | OFFICIAL-DOCUMENTATION; DERIVED |
| [12.6](12-6-operational-observability.md) | Operational observability | Resource metrics are reconciled with semantic conservation and lineage | DERIVED; MATHEMATICALLY-DERIVED |

## Artifact

**DERIVED — proposed deliverable.** The chapter specifies a **resumable dataset build and loading pipeline** through seven interoperable records:

1. **Snapshot manifest:** object revisions, digests, byte lengths, schema, tokenizer, transform identities, counts, and canonical order.
2. **Build ledger:** semantic keys, dependency graph, bounded tasks, attempt outcomes, selected results, and reject reasons.
3. **Occurrence schedule:** source identities, draw positions, weights, topology, partition rules, and intentional repeats.
4. **Packing ledger:** segment membership, retained source-token ranges, positions, masks, EOS policy, and dropped targets.
5. **Checkpoint manifest:** synchronized trainer and input state, component identities, commit step, and compatibility policy.
6. **Exposure and operational ledger:** fetched, delivered, processed, committed, rejected, failed, and pending populations with defined measurement boundaries.
7. **Verification report:** uninterrupted and resumed traces, discrepancy metrics, injected faults, lineage closure, and unresolved facts.

**DERIVED.** These records form an interface contract. A system can store them in different physical formats while preserving their meaning. The implementation must document any field it cannot produce rather than filling the gap with an inferred value. Full fields and falsification criteria appear in [verification.md](verification.md).

## Verification

**PROPOSAL.** Build a bounded fixture, retain an uninterrupted occurrence-and-token trace, interrupt at each relevant producer, consumer, packer, and checkpoint boundary, and compare the resumed suffix from the last committed checkpoint. Reject exact input replay if any occurrence identity, ordering, payload, mask, weight, or batch grouping differs. Deliberately incomplete-state controls must fail; a test that passes both the correct and defective variants is inadequate. Approximate replay reports discrepancy rather than reusing the exact label.

## Lineage

**KNOWN — dated source identity.** The only dated research work used for the historical lineage is the verified 2024 Dolma publication. Current documentation is identified by its 2026 inspection date, not assigned an invented release year.

- **2024 · Dolma · conceptual ancestor.** [P05](references.md#p05) supplies the chapter's documented-corpus and inspectable-curation anchor.
- **2026 · PyTorch data interfaces (documentation inspection) · engineering optimization.** [R12.5](references.md#r125) identifies the inspected versioned loading surface; this is an evidence date, not the introduction date.
- **2026 · explicit streaming state interfaces (documentation inspection) · alternative branch.** [R12.2](references.md#r122) and [R12.8](references.md#r128) expose different documented restart contracts.

~~~figure
id: fig-12.1
kind: lineage
title: Corpus evidence and execution contracts
caption: Dolma's publication year is historical metadata. The 2026 entries are documentation-inspection dates, not invention or release dates.
placement: inline
evidence: KNOWN
source: [P05, R12.5, R12.8]
alt: Dolma in 2024 anchors documented curation. PyTorch loading and Streaming resume are inspected in 2026 as implementation routes, without dating their invention.
spec:
  entries:
    - {year: 2024, work: Dolma, cite: P05, relation: conceptual ancestor}
    - {year: 2026, work: PyTorch data interfaces inspected, cite: R12.5, relation: engineering optimization}
    - {year: 2026, work: Streaming state interfaces inspected, cite: R12.8, relation: alternative branch}
~~~

~~~figure
id: fig-12.2
kind: cycle
title: Commit and recovery cycle
caption: Audit failures or revocations can require a new snapshot; recovery from an unchanged snapshot instead restores the committed state boundary.
placement: inline
evidence: DERIVED
source: DERIVED:eq-12.12
alt: A snapshot produces selected occurrences and packed tensors. Committed exposure is checkpointed and audited; restore returns to loading, while invalidation returns to snapshot construction.
spec:
  stages:
    - {id: s, kind: dataset, label: snapshot}
    - {id: l, kind: process, label: select and load}
    - {id: p, kind: tensor, label: packs and masks}
    - {id: c, kind: state, label: committed exposure}
    - {id: a, kind: metric, label: audit}
  edges:
    - {from: s, to: l}
    - {from: l, to: p}
    - {from: p, to: c}
    - {from: c, to: a}
    - {from: c, to: l, kind: feedback, label: restore}
    - {from: a, to: s, kind: feedback, label: invalidate and rebuild}
~~~

## Terms owned here

**KNOWN — canonical ownership index.**

| Term | Meaning | Owning section |
|---|---|---|
| Dataset snapshot | Immutable artifact inventory with bound interpretation | [§12.1](12-1-storage-and-formats.md#intuition) |
| Semantic build key | Digest of declared transformation dependencies | [§12.2](12-2-transformation-execution.md#intuition) |
| Occurrence identity | Identity of a scheduled draw rather than only its source record | [§12.3](12-3-sampling-and-loading.md#intuition) |
| Objective-preserving packing | Layout preserving targets, contexts, positions, and weights | [§12.4](12-4-packing-and-masks.md#intuition) |
| Exact input replay | Equality of the declared future input trace | [§12.5](12-5-resume-semantics.md#intuition) |
| Approximate input replay | Declared relaxation with measured discrepancy | [§12.5](12-5-resume-semantics.md#intuition) |
| Ingestion conservation ledger | Exhaustive input-disposition accounting | [§12.6](12-6-operational-observability.md#intuition) |
| Deletion propagation | Invalidation through recorded source dependencies | [§12.6](12-6-operational-observability.md#intuition) |

## Reference-stack coverage

**KNOWN — routing.** Rank numbers below are the reference pack's index positions, not performance rankings. “Surface used” retains the pack's exact entry URL; precise inspected pages are registered in [references.md](references.md).

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #22 Allen Institute for AI (Ai2) | — | Dolma paper and toolkit route | https://allenai.org/papers | 12.1, 12.2, 12.6 | PAPER-REPORTED |
| §1 lab | #27 Hugging Face Research | — | Plan-anchored Datasets documentation through official project | https://github.com/huggingface | 12.1–12.3, 12.5 | OFFICIAL-DOCUMENTATION |
| §1 lab | #25 Databricks / Mosaic AI Research | — | LLM Foundry and Streaming documentation route | https://github.com/mosaicml | 12.1, 12.3, 12.5 | OFFICIAL-DOCUMENTATION |
| §2 conference | #4 ACL | — | Archival Dolma bibliographic identity | https://aclanthology.org/venues/acl/ | 12.1, 12.2, 12.6 | PAPER-REPORTED |
| §3 discovery source | #1 arXiv | — | Dolma preprint identity cross-check | https://arxiv.org/ | 12.1, 12.2, 12.6 | PAPER-REPORTED |
| §3 discovery source | #5 ACL Anthology | — | Stable proceedings record | https://aclanthology.org/ | 12.1, 12.2, 12.6 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Worker and sampler contracts | https://pytorch.org/docs/stable/ | 12.1–12.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #23 NVIDIA Megatron-Core | Distributed training | Indexed dataset representation via official repository | https://docs.nvidia.com/megatron-core/index.html | 12.1–12.4 | OFFICIAL-DOCUMENTATION |
| §4 system | #21 TorchTitan | Distributed training | Checkpointable loading and monitoring route | https://github.com/pytorch/torchtitan | 12.5, 12.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #33 MosaicML LLM Foundry | Distributed training | Dataset-conversion integration via official repository fallback | https://docs.mosaicml.com/projects/llm-foundry/ | 12.1–12.3, 12.5 | OFFICIAL-DOCUMENTATION |
| §4 system | #22 NVIDIA NeMo Framework | Distributed training | Packing documentation redirected to Megatron Bridge | https://docs.nvidia.com/nemo-framework/index.html | 12.4 | OFFICIAL-DOCUMENTATION |
| Outside the reference stack (routed via book_plan.md anchors) | Hugging Face Datasets | Plan-anchored data tooling | Chapter 12 explicitly names this source; §4 does not list Datasets separately | https://huggingface.co/docs/datasets/index | 12.1–12.3, 12.5 | OFFICIAL-DOCUMENTATION |

**DERIVED — Inspection dimensions applied.** **Parallelism** appears in task and consumer ownership (§§12.2–12.3); **Precision** in packing-equivalence controls (§12.4); **Memory** in bounded decoding, queues, and masks (§§12.1–12.4); **Communication** in bytes and exposed wait (§12.6); **Kernels** in mask representation versus executed work (§12.4); **Checkpointing** in state closure (§12.5); **Metrics**, **Reliability**, and **Reproducibility** throughout. **Post-training** enters through fine-tuning packing and trajectories. **Inference** is outside this chapter's operational boundary.

## Source route

**KNOWN — search protocol.** Follow §1.1's official research/publication indexes before primary papers and official repositories; use §2.1 to resolve the archival venue; use §3.1's paper-to-code cascade; use §4.3's official-documentation-first system lookup. These concrete queries instantiate those routes:

~~~text
site:arxiv.org/abs "Allen Institute for AI" "Dolma"
"Dolma: an Open Corpus of Three Trillion Tokens" ACL
"NVIDIA Megatron-Core" official documentation distributed training datasets
site:github.com "TorchTitan" checkpoint
site:github.com "MosaicML LLM Foundry" architecture
~~~

**KNOWN — evidence scope.** Source discovery supplies candidate pages. Only the opened primary pages recorded in the chapter register support attributed claims. Contemporary documentation was checked for the 2026 edition; historical mechanisms remain dated and no current performance ranking is claimed.

## Status

**KNOWN.** Manuscript draft with six complete sections, a verification protocol, primary-source register, and chapter-local figures. Every performance experiment is a proposal. The mathematical fixtures are worked examples, not deployed-system measurements.

**UNVERIFIED.** Exact runtime compatibility, pinned source commits for moving repositories, actual throughput, and interruption-test outcomes remain unestablished. **NOT-DISCLOSED.** The inspected sources do not specify a universal deployment's storage transaction or deletion closure. These limitations constrain implementation claims without preventing the stated derivations.

