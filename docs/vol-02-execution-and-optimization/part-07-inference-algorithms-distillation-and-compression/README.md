---
id: ms.part.7
entity_type: part
title: "Part VII — Inference Algorithms, Distillation, and Compression"
short_title: Part VII
volume: 2
part: 7
chapter: null
section: null
slug: part-07-inference-algorithms-distillation-and-compression
parent: ms.volume.2
prev_sibling: ms.part.6
next_sibling: ms.part.8
children: [ms.chapter.37, ms.chapter.38, ms.chapter.39, ms.chapter.40, ms.chapter.41, ms.chapter.42]
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

VOLUME II / PART VII

# Part VII — Inference Algorithms, Distillation, and Compression

**Principal development outcome:** Quality/resource frontiers and validated state accounting.

**Navigation:** [Volume II](../README.md) · [Atlas index](../../README.md) · previous part: [Part VI](../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/README.md) · next part: [Part VIII](../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [37](ch37-decoding-constrained-generation-and-speculative-execution/README.md) | Decoding, constrained generation, and speculative execution | 04–05, 14, 31 | a decoding-policy comparison with distributional checks | [37.1](ch37-decoding-constrained-generation-and-speculative-execution/37-1-sampling-distributions.md) · [37.2](ch37-decoding-constrained-generation-and-speculative-execution/37-2-sequence-termination.md) · [37.3](ch37-decoding-constrained-generation-and-speculative-execution/37-3-search-versus-sampling.md) · [37.4](ch37-decoding-constrained-generation-and-speculative-execution/37-4-structured-generation.md) · [37.5](ch37-decoding-constrained-generation-and-speculative-execution/37-5-speculative-decoding.md) · [37.6](ch37-decoding-constrained-generation-and-speculative-execution/37-6-runtime-coupling.md) |
| [38](ch38-inference-time-reasoning-search-and-adaptive-compute/README.md) | Inference-time reasoning, search, and adaptive compute | 06, 32, 35, 37 | a quality-versus-inference-budget frontier | [38.1](ch38-inference-time-reasoning-search-and-adaptive-compute/38-1-computation-dimensions.md) · [38.2](ch38-inference-time-reasoning-search-and-adaptive-compute/38-2-candidate-aggregation.md) · [38.3](ch38-inference-time-reasoning-search-and-adaptive-compute/38-3-guided-search.md) · [38.4](ch38-inference-time-reasoning-search-and-adaptive-compute/38-4-revision-and-adaptive-stopping.md) · [38.5](ch38-inference-time-reasoning-search-and-adaptive-compute/38-5-representation-and-evidence.md) · [38.6](ch38-inference-time-reasoning-search-and-adaptive-compute/38-6-evaluation-and-economics.md) |
| [39](ch39-knowledge-response-and-policy-distillation/README.md) | Knowledge, response, and policy distillation | 11, 23, 31–38 | a teacher–student experiment with transparent information access | [39.1](ch39-knowledge-response-and-policy-distillation/39-1-distillation-objectives.md) · [39.2](ch39-knowledge-response-and-policy-distillation/39-2-information-access.md) · [39.3](ch39-knowledge-response-and-policy-distillation/39-3-sequence-and-reasoning-data.md) · [39.4](ch39-knowledge-response-and-policy-distillation/39-4-policy-and-trajectory-transfer.md) · [39.5](ch39-knowledge-response-and-policy-distillation/39-5-student-optimization.md) · [39.6](ch39-knowledge-response-and-policy-distillation/39-6-experimental-accounting.md) |
| [40](ch40-quantization-from-numerical-model-to-deployable-artifact/README.md) | Quantization from numerical model to deployable artifact | 03, 23, 25–28, 39 | a quantized checkpoint with calibration and runtime evidence | [40.1](ch40-quantization-from-numerical-model-to-deployable-artifact/40-1-quantization-formulation.md) · [40.2](ch40-quantization-from-numerical-model-to-deployable-artifact/40-2-quantization-targets.md) · [40.3](ch40-quantization-from-numerical-model-to-deployable-artifact/40-3-ptq-and-qat.md) · [40.4](ch40-quantization-from-numerical-model-to-deployable-artifact/40-4-method-families.md) · [40.5](ch40-quantization-from-numerical-model-to-deployable-artifact/40-5-artifact-runtime-interfaces.md) · [40.6](ch40-quantization-from-numerical-model-to-deployable-artifact/40-6-evaluation.md) |
| [41](ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/README.md) | Pruning, sparsity, rank reduction, and adaptive execution | 13–17, 25–28, 39–40 | an executable compression comparison | [41.1](ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/41-1-sparsity-taxonomy.md) · [41.2](ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/41-2-selection-criteria.md) · [41.3](ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/41-3-structural-reduction.md) · [41.4](ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/41-4-recovery.md) · [41.5](ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/41-5-adaptive-computation.md) · [41.6](ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/41-6-hardware-realization.md) |
| [42](ch42-prefill-decode-kv-state-and-inference-resource-models/README.md) | Prefill, decode, KV state, and inference resource models | 14–17, 25, 37–41 | an inference memory/latency estimator validated against measurements | [42.1](ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition.md) · [42.2](ch42-prefill-decode-kv-state-and-inference-resource-models/42-2-state-accounting.md) · [42.3](ch42-prefill-decode-kv-state-and-inference-resource-models/42-3-cache-organization.md) · [42.4](ch42-prefill-decode-kv-state-and-inference-resource-models/42-4-cache-reduction.md) · [42.5](ch42-prefill-decode-kv-state-and-inference-resource-models/42-5-parallel-inference.md) · [42.6](ch42-prefill-decode-kv-state-and-inference-resource-models/42-6-predictive-models.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
