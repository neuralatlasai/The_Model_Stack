---
id: ms.part.5
entity_type: part
title: "Part V — Hardware, Kernels, and Distributed Execution"
short_title: Part V
volume: 2
part: 5
chapter: null
section: null
slug: part-05-hardware-kernels-and-distributed-execution
parent: ms.volume.2
prev_sibling: ms.part.4
next_sibling: ms.part.6
children: [ms.chapter.25, ms.chapter.26, ms.chapter.27, ms.chapter.28, ms.chapter.29, ms.chapter.30]
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

VOLUME II / PART V

# Part V — Hardware, Kernels, and Distributed Execution

**Principal development outcome:** Measured kernels, parallelization, and recoverable training.

**Navigation:** [Volume II](../README.md) · [Atlas index](../../README.md) · previous part: [Part IV](../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/README.md) · next part: [Part VI](../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [25](ch25-accelerators-memory-hierarchy-and-performance-models/README.md) | Accelerators, memory hierarchy, and performance models | 01–03, 05, 13–17 | a hardware/resource model for a specified workload | [25.1](ch25-accelerators-memory-hierarchy-and-performance-models/25-1-accelerator-organization.md) · [25.2](ch25-accelerators-memory-hierarchy-and-performance-models/25-2-memory-hierarchy.md) · [25.3](ch25-accelerators-memory-hierarchy-and-performance-models/25-3-roofline-reasoning.md) · [25.4](ch25-accelerators-memory-hierarchy-and-performance-models/25-4-physical-connectivity.md) · [25.5](ch25-accelerators-memory-hierarchy-and-performance-models/25-5-platform-comparison.md) · [25.6](ch25-accelerators-memory-hierarchy-and-performance-models/25-6-cluster-constraints.md) |
| [26](ch26-kernel-programming-and-numerical-equivalence/README.md) | Kernel programming and numerical equivalence | 03, 05, 25 | a profiled operator with a correctness reference | [26.1](ch26-kernel-programming-and-numerical-equivalence/26-1-execution-primitives.md) · [26.2](ch26-kernel-programming-and-numerical-equivalence/26-2-programming-ecosystems.md) · [26.3](ch26-kernel-programming-and-numerical-equivalence/26-3-core-operators.md) · [26.4](ch26-kernel-programming-and-numerical-equivalence/26-4-fusion-and-dataflow.md) · [26.5](ch26-kernel-programming-and-numerical-equivalence/26-5-tuning-and-portability.md) · [26.6](ch26-kernel-programming-and-numerical-equivalence/26-6-correctness-under-optimization.md) |
| [27](ch27-attention-latent-attention-and-expert-kernels/README.md) | Attention, latent-attention, and expert kernels | 14–17, 25–26 | an algorithm-to-kernel analysis with hardware-specific measurements | [27.1](ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md) · [27.2](ch27-attention-latent-attention-and-expert-kernels/27-2-flashattention-lineage.md) · [27.3](ch27-attention-latent-attention-and-expert-kernels/27-3-decode-specialized-attention.md) · [27.4](ch27-attention-latent-attention-and-expert-kernels/27-4-mla-and-sparse-kernels.md) · [27.5](ch27-attention-latent-attention-and-expert-kernels/27-5-moe-execution.md) · [27.6](ch27-attention-latent-attention-and-expert-kernels/27-6-integration-libraries.md) |
| [28](ch28-frameworks-graph-compilers-and-runtime-integration/README.md) | Frameworks, graph compilers, and runtime integration | 19, 25–27 | a reproducible framework/compiler execution profile | [28.1](ch28-frameworks-graph-compilers-and-runtime-integration/28-1-framework-semantics.md) · [28.2](ch28-frameworks-graph-compilers-and-runtime-integration/28-2-compilation-pipeline.md) · [28.3](ch28-frameworks-graph-compilers-and-runtime-integration/28-3-compiler-families.md) · [28.4](ch28-frameworks-graph-compilers-and-runtime-integration/28-4-runtime-execution.md) · [28.5](ch28-frameworks-graph-compilers-and-runtime-integration/28-5-integration-boundaries.md) · [28.6](ch28-frameworks-graph-compilers-and-runtime-integration/28-6-deployment-reproducibility.md) |
| [29](ch29-parallelism-collectives-and-distributed-optimization/README.md) | Parallelism, collectives, and distributed optimization | 16, 19–20, 25–28 | a distributed placement and communication plan | [29.1](ch29-parallelism-collectives-and-distributed-optimization/29-1-data-state-parallelism.md) · [29.2](ch29-parallelism-collectives-and-distributed-optimization/29-2-tensor-and-pipeline-parallelism.md) · [29.3](ch29-parallelism-collectives-and-distributed-optimization/29-3-sequence-and-context-parallelism.md) · [29.4](ch29-parallelism-collectives-and-distributed-optimization/29-4-expert-parallelism.md) · [29.5](ch29-parallelism-collectives-and-distributed-optimization/29-5-collective-communication.md) · [29.6](ch29-parallelism-collectives-and-distributed-optimization/29-6-joint-optimization.md) |
| [30](ch30-large-training-runs-reliability-monitoring-and-recovery/README.md) | Large training runs: reliability, monitoring, and recovery | 12, 19–21, 25–29 | a training runbook and fault-injection report | [30.1](ch30-large-training-runs-reliability-monitoring-and-recovery/30-1-training-orchestration.md) · [30.2](ch30-large-training-runs-reliability-monitoring-and-recovery/30-2-memory-management.md) · [30.3](ch30-large-training-runs-reliability-monitoring-and-recovery/30-3-checkpoint-design.md) · [30.4](ch30-large-training-runs-reliability-monitoring-and-recovery/30-4-failure-taxonomy.md) · [30.5](ch30-large-training-runs-reliability-monitoring-and-recovery/30-5-observability.md) · [30.6](ch30-large-training-runs-reliability-monitoring-and-recovery/30-6-recovery-and-reproducibility.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
