---
id: ms.part.4
entity_type: part
title: Part IV — Training Science and Adaptation
short_title: Part IV
volume: 1
part: 4
chapter: null
section: null
slug: part-04-training-science-and-adaptation
parent: ms.volume.1
prev_sibling: ms.part.3
next_sibling: ms.part.5
children: [ms.chapter.19, ms.chapter.20, ms.chapter.21, ms.chapter.22, ms.chapter.23, ms.chapter.24]
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

VOLUME I / PART IV

# Part IV — Training Science and Adaptation

**Principal development outcome:** Pretraining/adaptation recipes with scaling and retention evidence.

**Navigation:** [Volume I](../README.md) · [Atlas index](../../README.md) · previous part: [Part III](../../vol-01-learning-and-representation/part-03-model-architectures-and-state/README.md) · next part: [Part V](../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [19](ch19-pretraining-objectives-and-the-full-training-loop/README.md) | Pretraining objectives and the full training loop | 04, 06, 12–18 | a complete single-device reference training recipe | [19.1](ch19-pretraining-objectives-and-the-full-training-loop/19-1-objective-selection.md) · [19.2](ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics.md) · [19.3](ch19-pretraining-objectives-and-the-full-training-loop/19-3-parameter-updates.md) · [19.4](ch19-pretraining-objectives-and-the-full-training-loop/19-4-training-state-transitions.md) · [19.5](ch19-pretraining-objectives-and-the-full-training-loop/19-5-monitoring.md) · [19.6](ch19-pretraining-objectives-and-the-full-training-loop/19-6-reference-to-scale-handoff.md) |
| [20](ch20-optimization-schedules-and-training-stability/README.md) | Optimization, schedules, and training stability | 02–03, 19 | an optimizer/schedule ablation protocol | [20.1](ch20-optimization-schedules-and-training-stability/20-1-optimizer-mechanics.md) · [20.2](ch20-optimization-schedules-and-training-stability/20-2-hyperparameter-scaling.md) · [20.3](ch20-optimization-schedules-and-training-stability/20-3-scheduling.md) · [20.4](ch20-optimization-schedules-and-training-stability/20-4-stability-instrumentation.md) · [20.5](ch20-optimization-schedules-and-training-stability/20-5-recovery-interventions.md) · [20.6](ch20-optimization-schedules-and-training-stability/20-6-comparative-evidence.md) |
| [21](ch21-scaling-laws-and-compute-allocation/README.md) | Scaling laws and compute allocation | 06, 09, 13, 19–20 | a fitted scaling model with uncertainty and held-out validation | [21.1](ch21-scaling-laws-and-compute-allocation/21-1-empirical-scaling.md) · [21.2](ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md) · [21.3](ch21-scaling-laws-and-compute-allocation/21-3-inference-aware-training.md) · [21.4](ch21-scaling-laws-and-compute-allocation/21-4-beyond-dense-pretraining.md) · [21.5](ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md) · [21.6](ch21-scaling-laws-and-compute-allocation/21-6-capability-prediction.md) |
| [22](ch22-continued-pretraining-mid-training-and-domain-adaptation/README.md) | Continued pretraining, mid-training, and domain adaptation | 09–12, 19–21 | an adaptation decision record and retention evaluation | [22.1](ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md) · [22.2](ch22-continued-pretraining-mid-training-and-domain-adaptation/22-2-distribution-transitions.md) · [22.3](ch22-continued-pretraining-mid-training-and-domain-adaptation/22-3-optimizer-transitions.md) · [22.4](ch22-continued-pretraining-mid-training-and-domain-adaptation/22-4-retention-and-interference.md) · [22.5](ch22-continued-pretraining-mid-training-and-domain-adaptation/22-5-alternative-interventions.md) · [22.6](ch22-continued-pretraining-mid-training-and-domain-adaptation/22-6-adaptation-economics.md) |
| [23](ch23-parameter-efficient-adaptation-and-model-composition/README.md) | Parameter-efficient adaptation and model composition | 13, 19–22 | an adapter lifecycle and composition study | [23.1](ch23-parameter-efficient-adaptation-and-model-composition/23-1-adaptation-families.md) · [23.2](ch23-parameter-efficient-adaptation-and-model-composition/23-2-lora-mechanics.md) · [23.3](ch23-parameter-efficient-adaptation-and-model-composition/23-3-quantized-base-adaptation.md) · [23.4](ch23-parameter-efficient-adaptation-and-model-composition/23-4-multi-task-composition.md) · [23.5](ch23-parameter-efficient-adaptation-and-model-composition/23-5-serving-implications.md) · [23.6](ch23-parameter-efficient-adaptation-and-model-composition/23-6-evaluation.md) |
| [24](ch24-continual-learning-model-editing-and-unlearning/README.md) | Continual learning, model editing, and unlearning | 06, 19–23 | a sequential-task evaluation with explicit data-retention constraints | [24.1](ch24-continual-learning-model-editing-and-unlearning/24-1-sequential-learning-regimes.md) · [24.2](ch24-continual-learning-model-editing-and-unlearning/24-2-forgetting-and-transfer.md) · [24.3](ch24-continual-learning-model-editing-and-unlearning/24-3-mechanism-families.md) · [24.4](ch24-continual-learning-model-editing-and-unlearning/24-4-model-editing.md) · [24.5](ch24-continual-learning-model-editing-and-unlearning/24-5-unlearning.md) · [24.6](ch24-continual-learning-model-editing-and-unlearning/24-6-parametric-versus-external-memory.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
