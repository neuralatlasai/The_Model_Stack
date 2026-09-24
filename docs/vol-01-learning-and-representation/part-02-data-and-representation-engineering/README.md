---
id: ms.part.2
entity_type: part
title: Part II — Data and Representation Engineering
short_title: Part II
volume: 1
part: 2
chapter: null
section: null
slug: part-02-data-and-representation-engineering
parent: ms.volume.1
prev_sibling: ms.part.1
next_sibling: ms.part.3
children: [ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12]
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [KNOWN], empirically_observed: false}
word_count_target: 500
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

VOLUME I / PART II

# Part II — Data and Representation Engineering

**Principal development outcome:** A versioned corpus, tokenizer, and ingestion pipeline.

**Navigation:** [Volume I](../README.md) · [Atlas index](../../README.md) · previous part: [Part I](../../vol-01-learning-and-representation/part-01-scientific-foundations/README.md) · next part: [Part III](../../vol-01-learning-and-representation/part-03-model-architectures-and-state/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [07](ch07-data-provenance-acquisition-and-dataset-semantics/README.md) | Data provenance, acquisition, and dataset semantics | 04, 06 | a dataset inventory with provenance and admissible-use fields | [7.1](ch07-data-provenance-acquisition-and-dataset-semantics/07-1-source-categories.md) · [7.2](ch07-data-provenance-acquisition-and-dataset-semantics/07-2-orthogonal-dataset-axes.md) · [7.3](ch07-data-provenance-acquisition-and-dataset-semantics/07-3-acquisition-and-extraction.md) · [7.4](ch07-data-provenance-acquisition-and-dataset-semantics/07-4-rights-and-governance-metadata.md) · [7.5](ch07-data-provenance-acquisition-and-dataset-semantics/07-5-dataset-documentation.md) · [7.6](ch07-data-provenance-acquisition-and-dataset-semantics/07-6-corpus-case-studies.md) |
| [08](ch08-cleaning-deduplication-privacy-filtering-and-contamination/README.md) | Cleaning, deduplication, privacy filtering, and contamination | 06–07 | an auditable filtering pipeline and removal ledger | [8.1](ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-1-normalization.md) · [8.2](ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation.md) · [8.3](ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md) · [8.4](ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-4-privacy-and-sensitive-data.md) · [8.5](ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md) · [8.6](ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-6-filter-interactions.md) |
| [09](ch09-data-mixtures-curricula-and-sample-efficiency/README.md) | Data mixtures, curricula, and sample efficiency | 06–08 | a mixture policy and exposure accounting report | [9.1](ch09-data-mixtures-curricula-and-sample-efficiency/09-1-mixture-formulation.md) · [9.2](ch09-data-mixtures-curricula-and-sample-efficiency/09-2-quality-and-diversity.md) · [9.3](ch09-data-mixtures-curricula-and-sample-efficiency/09-3-curriculum-design.md) · [9.4](ch09-data-mixtures-curricula-and-sample-efficiency/09-4-learned-mixture-selection.md) · [9.5](ch09-data-mixtures-curricula-and-sample-efficiency/09-5-multilingual-and-specialist-mixtures.md) · [9.6](ch09-data-mixtures-curricula-and-sample-efficiency/09-6-data-scaling-limits.md) |
| [10](ch10-tokenization-serialization-and-interface-correctness/README.md) | Tokenization, serialization, and interface correctness | 04, 07–09 | a tokenizer and serialization compatibility suite | [10.1](ch10-tokenization-serialization-and-interface-correctness/10-1-tokenization-algorithms.md) · [10.2](ch10-tokenization-serialization-and-interface-correctness/10-2-implementations-and-normalization.md) · [10.3](ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md) · [10.4](ch10-tokenization-serialization-and-interface-correctness/10-4-conversation-serialization.md) · [10.5](ch10-tokenization-serialization-and-interface-correctness/10-5-tool-and-multimodal-interfaces.md) · [10.6](ch10-tokenization-serialization-and-interface-correctness/10-6-migration-and-compatibility.md) |
| [11](ch11-synthetic-data-preferences-and-interactive-trajectories/README.md) | Synthetic data, preferences, and interactive trajectories | 06–10 | a supervised-data and trajectory schema with quality gates | [11.1](ch11-synthetic-data-preferences-and-interactive-trajectories/11-1-generator-design.md) · [11.2](ch11-synthetic-data-preferences-and-interactive-trajectories/11-2-target-types.md) · [11.3](ch11-synthetic-data-preferences-and-interactive-trajectories/11-3-selection-and-verification.md) · [11.4](ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md) · [11.5](ch11-synthetic-data-preferences-and-interactive-trajectories/11-5-interactive-collection.md) · [11.6](ch11-synthetic-data-preferences-and-interactive-trajectories/11-6-synthetic-data-economics.md) |
| [12](ch12-scalable-data-infrastructure-and-reproducible-ingestion/README.md) | Scalable data infrastructure and reproducible ingestion | 07–11 | a resumable dataset build and loading pipeline | [12.1](ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-1-storage-and-formats.md) · [12.2](ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution.md) · [12.3](ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-3-sampling-and-loading.md) · [12.4](ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md) · [12.5](ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md) · [12.6](ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-6-operational-observability.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
