---
id: ms.part.1
entity_type: part
title: Part I — Scientific Foundations
short_title: Part I
volume: 1
part: 1
chapter: null
section: null
slug: part-01-scientific-foundations
parent: ms.volume.1
prev_sibling: null
next_sibling: ms.part.2
children: [ms.chapter.1, ms.chapter.2, ms.chapter.3, ms.chapter.4, ms.chapter.5, ms.chapter.6]
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

VOLUME I / PART I

# Part I — Scientific Foundations

**Principal development outcome:** A correct reference model and defensible experiment.

**Navigation:** [Volume I](../README.md) · [Atlas index](../../README.md) · next part: [Part II](../../vol-01-learning-and-representation/part-02-data-and-representation-engineering/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [01](ch01-foundation-model-lifecycle/README.md) | The foundation-model lifecycle as a scientific system | graduate-level ML and software engineering | a system specification with measurable objectives and resource constraints | [1.1](ch01-foundation-model-lifecycle/01-1-problem-formulation.md) · [1.2](ch01-foundation-model-lifecycle/01-2-levels-of-analysis.md) · [1.3](ch01-foundation-model-lifecycle/01-3-model-categories.md) · [1.4](ch01-foundation-model-lifecycle/01-4-lifecycle-and-intervention.md) · [1.5](ch01-foundation-model-lifecycle/01-5-resource-accounting.md) · [1.6](ch01-foundation-model-lifecycle/01-6-scientific-interpretation.md) |
| [02](ch02-mathematical-and-statistical-foundations/README.md) | Mathematical and statistical foundations | 01 | a consistent notation and statistical-estimation reference | [2.1](ch02-mathematical-and-statistical-foundations/02-1-tensor-algebra.md) · [2.2](ch02-mathematical-and-statistical-foundations/02-2-probability.md) · [2.3](ch02-mathematical-and-statistical-foundations/02-3-information-theory.md) · [2.4](ch02-mathematical-and-statistical-foundations/02-4-differential-calculus.md) · [2.5](ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md) · [2.6](ch02-mathematical-and-statistical-foundations/02-6-optimization-language.md) |
| [03](ch03-numerical-computation-and-trustworthy-training/README.md) | Numerical computation and a trustworthy training program | 02 | a numerically checked single-device training skeleton | [3.1](ch03-numerical-computation-and-trustworthy-training/03-1-numeric-representations.md) · [3.2](ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md) · [3.3](ch03-numerical-computation-and-trustworthy-training/03-3-automatic-differentiation.md) · [3.4](ch03-numerical-computation-and-trustworthy-training/03-4-mixed-precision-execution.md) · [3.5](ch03-numerical-computation-and-trustworthy-training/03-5-reference-implementation.md) · [3.6](ch03-numerical-computation-and-trustworthy-training/03-6-reproducibility-limits.md) |
| [04](ch04-language-modeling-and-learning-objectives/README.md) | Language modeling and learning objectives | 02–03 | an objective ledger specifying conditioning, targets, masks, and normalization | [4.1](ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md) · [4.2](ch04-language-modeling-and-learning-objectives/04-2-alternative-objectives.md) · [4.3](ch04-language-modeling-and-learning-objectives/04-3-code-and-structured-sequences.md) · [4.4](ch04-language-modeling-and-learning-objectives/04-4-auxiliary-prediction.md) · [4.5](ch04-language-modeling-and-learning-objectives/04-5-conditional-and-multimodal-learning.md) · [4.6](ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md) |
| [05](ch05-minimal-transformer-and-execution-trace/README.md) | A minimal Transformer and its execution trace | 03–04 | a small reference Transformer with inspectable intermediate tensors | [5.1](ch05-minimal-transformer-and-execution-trace/05-1-end-to-end-forward-pass.md) · [5.2](ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation.md) · [5.3](ch05-minimal-transformer-and-execution-trace/05-3-feed-forward-computation.md) · [5.4](ch05-minimal-transformer-and-execution-trace/05-4-residual-organization.md) · [5.5](ch05-minimal-transformer-and-execution-trace/05-5-training-and-generation.md) · [5.6](ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md) |
| [06](ch06-experimental-design-and-evaluation-before-optimization/README.md) | Experimental design and evaluation before optimization | 01–05 | a preregistered experiment and benchmark manifest | [6.1](ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md) · [6.2](ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md) · [6.3](ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md) · [6.4](ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md) · [6.5](ch06-experimental-design-and-evaluation-before-optimization/06-5-quality-resource-frontiers.md) · [6.6](ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
