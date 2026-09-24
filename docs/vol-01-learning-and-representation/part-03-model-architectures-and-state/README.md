---
id: ms.part.3
entity_type: part
title: Part III — Model Architectures and State
short_title: Part III
volume: 1
part: 3
chapter: null
section: null
slug: part-03-model-architectures-and-state
parent: ms.volume.1
prev_sibling: ms.part.2
next_sibling: ms.part.4
children: [ms.chapter.13, ms.chapter.14, ms.chapter.15, ms.chapter.16, ms.chapter.17, ms.chapter.18]
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

VOLUME I / PART III

# Part III — Model Architectures and State

**Principal development outcome:** Explicit representation, state, and computation tradeoffs.

**Navigation:** [Volume I](../README.md) · [Atlas index](../../README.md) · previous part: [Part II](../../vol-01-learning-and-representation/part-02-data-and-representation-engineering/README.md) · next part: [Part IV](../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [13](ch13-dense-transformer-design-and-parameter-allocation/README.md) | Dense Transformer design and parameter allocation | 05, 10 | a parameter/FLOP model for a family of dense architectures | [13.1](ch13-dense-transformer-design-and-parameter-allocation/13-1-architectural-families.md) · [13.2](ch13-dense-transformer-design-and-parameter-allocation/13-2-width-depth-and-heads.md) · [13.3](ch13-dense-transformer-design-and-parameter-allocation/13-3-feed-forward-alternatives.md) · [13.4](ch13-dense-transformer-design-and-parameter-allocation/13-4-normalization-and-residuals.md) · [13.5](ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md) · [13.6](ch13-dense-transformer-design-and-parameter-allocation/13-6-architectural-ablations.md) |
| [14](ch14-attention-architectures-and-cache-representations/README.md) | Attention architectures and cache representations | 05, 13 | an attention-family comparison with explicit cached state | [14.1](ch14-attention-architectures-and-cache-representations/14-1-mha-mqa-and-gqa.md) · [14.2](ch14-attention-architectures-and-cache-representations/14-2-latent-attention.md) · [14.3](ch14-attention-architectures-and-cache-representations/14-3-sparse-and-local-attention.md) · [14.4](ch14-attention-architectures-and-cache-representations/14-4-cross-attention.md) · [14.5](ch14-attention-architectures-and-cache-representations/14-5-exact-versus-approximate-computation.md) · [14.6](ch14-attention-architectures-and-cache-representations/14-6-quality-state-tradeoffs.md) |
| [15](ch15-position-long-context-and-effective-information-access/README.md) | Position, long context, and effective information access | 10, 13–14 | a long-context experiment matrix | [15.1](ch15-position-long-context-and-effective-information-access/15-1-position-representations.md) · [15.2](ch15-position-long-context-and-effective-information-access/15-2-context-extension.md) · [15.3](ch15-position-long-context-and-effective-information-access/15-3-long-sequence-training.md) · [15.4](ch15-position-long-context-and-effective-information-access/15-4-effective-context.md) · [15.5](ch15-position-long-context-and-effective-information-access/15-5-long-context-versus-retrieval.md) · [15.6](ch15-position-long-context-and-effective-information-access/15-6-deployment-consequences.md) |
| [16](ch16-mixture-of-experts-architectures/README.md) | Mixture-of-experts architectures | 13–14 | an MoE routing and resource-accounting study | [16.1](ch16-mixture-of-experts-architectures/16-1-conditional-computation.md) · [16.2](ch16-mixture-of-experts-architectures/16-2-router-design.md) · [16.3](ch16-mixture-of-experts-architectures/16-3-training-dynamics.md) · [16.4](ch16-mixture-of-experts-architectures/16-4-capacity-and-execution.md) · [16.5](ch16-mixture-of-experts-architectures/16-5-distributed-implications.md) · [16.6](ch16-mixture-of-experts-architectures/16-6-comparative-methodology.md) |
| [17](ch17-state-space-recurrent-linear-attention-and-hybrid-models/README.md) | State-space, recurrent, linear-attention, and hybrid models | 02, 13–15 | a sequence-model comparison under explicit state budgets | [17.1](ch17-state-space-recurrent-linear-attention-and-hybrid-models/17-1-recurrent-state.md) · [17.2](ch17-state-space-recurrent-linear-attention-and-hybrid-models/17-2-state-space-models.md) · [17.3](ch17-state-space-recurrent-linear-attention-and-hybrid-models/17-3-linear-attention.md) · [17.4](ch17-state-space-recurrent-linear-attention-and-hybrid-models/17-4-delta-rule-mechanisms.md) · [17.5](ch17-state-space-recurrent-linear-attention-and-hybrid-models/17-5-hybrid-composition.md) · [17.6](ch17-state-space-recurrent-linear-attention-and-hybrid-models/17-6-evaluation-boundaries.md) |
| [18](ch18-multimodal-architectural-primitives/README.md) | Multimodal architectural primitives | 04, 10, 13–17 | a modality-to-model interface specification | [18.1](ch18-multimodal-architectural-primitives/18-1-modality-representation.md) · [18.2](ch18-multimodal-architectural-primitives/18-2-encoders-and-adapters.md) · [18.3](ch18-multimodal-architectural-primitives/18-3-fusion.md) · [18.4](ch18-multimodal-architectural-primitives/18-4-learning-objectives.md) · [18.5](ch18-multimodal-architectural-primitives/18-5-sequence-and-time-alignment.md) · [18.6](ch18-multimodal-architectural-primitives/18-6-transfer-and-interference.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
