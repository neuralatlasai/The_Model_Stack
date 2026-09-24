---
id: ms.part.8
entity_type: part
title: Part VIII — Inference Engines and Production Serving
short_title: Part VIII
volume: 2
part: 8
chapter: null
section: null
slug: part-08-inference-engines-and-production-serving
parent: ms.volume.2
prev_sibling: ms.part.7
next_sibling: ms.part.9
children: [ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.chapter.46, ms.chapter.47, ms.chapter.48]
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

VOLUME II / PART VIII

# Part VIII — Inference Engines and Production Serving

**Principal development outcome:** SLO-driven deployment with capacity and cost evidence.

**Navigation:** [Volume II](../README.md) · [Atlas index](../../README.md) · previous part: [Part VII](../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/README.md) · next part: [Part IX](../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [43](ch43-runtime-architecture-and-inference-engine-selection/README.md) | Runtime architecture and inference-engine selection | 26–29, 37, 40–42 | a version-pinned engine comparison | [43.1](ch43-runtime-architecture-and-inference-engine-selection/43-1-runtime-decomposition.md) · [43.2](ch43-runtime-architecture-and-inference-engine-selection/43-2-vllm.md) · [43.3](ch43-runtime-architecture-and-inference-engine-selection/43-3-sglang.md) · [43.4](ch43-runtime-architecture-and-inference-engine-selection/43-4-tensorrt-llm.md) · [43.5](ch43-runtime-architecture-and-inference-engine-selection/43-5-other-deployment-routes.md) · [43.6](ch43-runtime-architecture-and-inference-engine-selection/43-6-selection-methodology.md) |
| [44](ch44-scheduling-distributed-serving-and-disaggregation/README.md) | Scheduling, distributed serving, and disaggregation | 29, 42–43 | a serving-scheduler and placement experiment | [44.1](ch44-scheduling-distributed-serving-and-disaggregation/44-1-batching.md) · [44.2](ch44-scheduling-distributed-serving-and-disaggregation/44-2-prefill-management.md) · [44.3](ch44-scheduling-distributed-serving-and-disaggregation/44-3-prefix-and-state-placement.md) · [44.4](ch44-scheduling-distributed-serving-and-disaggregation/44-4-disaggregation.md) · [44.5](ch44-scheduling-distributed-serving-and-disaggregation/44-5-distributed-execution.md) · [44.6](ch44-scheduling-distributed-serving-and-disaggregation/44-6-load-adaptation.md) |
| [45](ch45-local-edge-and-heterogeneous-inference/README.md) | Local, edge, and heterogeneous inference | 25, 37, 40–43 | a constrained-device deployment profile | [45.1](ch45-local-edge-and-heterogeneous-inference/45-1-device-constraints.md) · [45.2](ch45-local-edge-and-heterogeneous-inference/45-2-llamacpp-stack.md) · [45.3](ch45-local-edge-and-heterogeneous-inference/45-3-apple-and-mobile-execution.md) · [45.4](ch45-local-edge-and-heterogeneous-inference/45-4-portable-runtimes.md) · [45.5](ch45-local-edge-and-heterogeneous-inference/45-5-hybrid-placement.md) · [45.6](ch45-local-edge-and-heterogeneous-inference/45-6-device-evaluation.md) |
| [46](ch46-admission-control-routing-autoscaling-and-service-contracts/README.md) | Admission control, routing, autoscaling, and service contracts | 06, 42–45 | an SLO-driven serving control-plane design | [46.1](ch46-admission-control-routing-autoscaling-and-service-contracts/46-1-service-contracts.md) · [46.2](ch46-admission-control-routing-autoscaling-and-service-contracts/46-2-admission-and-backpressure.md) · [46.3](ch46-admission-control-routing-autoscaling-and-service-contracts/46-3-routing.md) · [46.4](ch46-admission-control-routing-autoscaling-and-service-contracts/46-4-autoscaling.md) · [46.5](ch46-admission-control-routing-autoscaling-and-service-contracts/46-5-resilience.md) · [46.6](ch46-admission-control-routing-autoscaling-and-service-contracts/46-6-api-behavior.md) |
| [47](ch47-observability-deployment-changes-and-incident-recovery/README.md) | Observability, deployment changes, and incident recovery | 30, 43–46 | an instrumented deployment and rollback runbook | [47.1](ch47-observability-deployment-changes-and-incident-recovery/47-1-telemetry.md) · [47.2](ch47-observability-deployment-changes-and-incident-recovery/47-2-quality-observability.md) · [47.3](ch47-observability-deployment-changes-and-incident-recovery/47-3-release-control.md) · [47.4](ch47-observability-deployment-changes-and-incident-recovery/47-4-regression-localization.md) · [47.5](ch47-observability-deployment-changes-and-incident-recovery/47-5-recovery.md) · [47.6](ch47-observability-deployment-changes-and-incident-recovery/47-6-operational-learning.md) |
| [48](ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) | Capacity planning, benchmarking, and lifecycle economics | 06, 21, 25, 42–47 | a workload-specific capacity/cost model | [48.1](ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-1-workload-specification.md) · [48.2](ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-2-load-test-methodology.md) · [48.3](ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-3-metrics.md) · [48.4](ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-4-queueing-and-capacity.md) · [48.5](ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-5-economics.md) · [48.6](ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-6-external-measurements.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
