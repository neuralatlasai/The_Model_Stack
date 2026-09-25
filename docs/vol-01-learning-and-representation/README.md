---
id: ms.volume.1
entity_type: volume
title: Volume I — Learning and Representation
short_title: Volume I
volume: 1
part: null
chapter: null
section: null
slug: vol-01-learning-and-representation
parent: ms.root
prev_sibling: null
next_sibling: ms.volume.2
children: [ms.part.1, ms.part.2, ms.part.3, ms.part.4]
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
word_count_target: 400
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Volume I — Learning and Representation

**Technical responsibility:** Scientific foundations, data, tokenization, architecture, pretraining, adaptation, continual learning.

**Navigation:** [Atlas index](../README.md) · next: [Volume II](../vol-02-execution-and-optimization/README.md)

## Parts

### Part I — Scientific Foundations

[Part I page](part-01-scientific-foundations/README.md) · A correct reference model and defensible experiment

- [01 — The foundation-model lifecycle as a scientific system](part-01-scientific-foundations/ch01-foundation-model-lifecycle/README.md) · prerequisites: graduate-level ML and software engineering
- [02 — Mathematical and statistical foundations](part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/README.md) · prerequisites: 01
- [03 — Numerical computation and a trustworthy training program](part-01-scientific-foundations/ch03-numerical-computation-and-trustworthy-training/README.md) · prerequisites: 02
- [04 — Language modeling and learning objectives](part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/README.md) · prerequisites: 02–03
- [05 — A minimal Transformer and its execution trace](part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/README.md) · prerequisites: 03–04
- [06 — Experimental design and evaluation before optimization](part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md) · prerequisites: 01–05

### Part II — Data and Representation Engineering

[Part II page](part-02-data-and-representation-engineering/README.md) · A versioned corpus, tokenizer, and ingestion pipeline

- [07 — Data provenance, acquisition, and dataset semantics](part-02-data-and-representation-engineering/ch07-data-provenance-acquisition-and-dataset-semantics/README.md) · prerequisites: 04, 06
- [08 — Cleaning, deduplication, privacy filtering, and contamination](part-02-data-and-representation-engineering/ch08-cleaning-deduplication-privacy-filtering-and-contamination/README.md) · prerequisites: 06–07
- [09 — Data mixtures, curricula, and sample efficiency](part-02-data-and-representation-engineering/ch09-data-mixtures-curricula-and-sample-efficiency/README.md) · prerequisites: 06–08
- [10 — Tokenization, serialization, and interface correctness](part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/README.md) · prerequisites: 04, 07–09
- [11 — Synthetic data, preferences, and interactive trajectories](part-02-data-and-representation-engineering/ch11-synthetic-data-preferences-and-interactive-trajectories/README.md) · prerequisites: 06–10
- [12 — Scalable data infrastructure and reproducible ingestion](part-02-data-and-representation-engineering/ch12-scalable-data-infrastructure-and-reproducible-ingestion/README.md) · prerequisites: 07–11

### Part III — Model Architectures and State

[Part III page](part-03-model-architectures-and-state/README.md) · Explicit representation, state, and computation tradeoffs

- [13 — Dense Transformer design and parameter allocation](part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/README.md) · prerequisites: 05, 10
- [14 — Attention architectures and cache representations](part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/README.md) · prerequisites: 05, 13
- [15 — Position, long context, and effective information access](part-03-model-architectures-and-state/ch15-position-long-context-and-effective-information-access/README.md) · prerequisites: 10, 13–14
- [16 — Mixture-of-experts architectures](part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/README.md) · prerequisites: 13–14
- [17 — State-space, recurrent, linear-attention, and hybrid models](part-03-model-architectures-and-state/ch17-state-space-recurrent-linear-attention-and-hybrid-models/README.md) · prerequisites: 02, 13–15
- [18 — Multimodal architectural primitives](part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md) · prerequisites: 04, 10, 13–17

### Part IV — Training Science and Adaptation

[Part IV page](part-04-training-science-and-adaptation/README.md) · Pretraining/adaptation recipes with scaling and retention evidence

- [19 — Pretraining objectives and the full training loop](part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/README.md) · prerequisites: 04, 06, 12–18
- [20 — Optimization, schedules, and training stability](part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/README.md) · prerequisites: 02–03, 19
- [21 — Scaling laws and compute allocation](part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/README.md) · prerequisites: 06, 09, 13, 19–20
- [22 — Continued pretraining, mid-training, and domain adaptation](part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/README.md) · prerequisites: 09–12, 19–21
- [23 — Parameter-efficient adaptation and model composition](part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/README.md) · prerequisites: 13, 19–22
- [24 — Continual learning, model editing, and unlearning](part-04-training-science-and-adaptation/ch24-continual-learning-model-editing-and-unlearning/README.md) · prerequisites: 06, 19–23

