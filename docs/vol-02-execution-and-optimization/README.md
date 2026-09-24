---
id: ms.volume.2
entity_type: volume
title: Volume II — Execution and Optimization
short_title: Volume II
volume: 2
part: null
chapter: null
section: null
slug: vol-02-execution-and-optimization
parent: ms.root
prev_sibling: ms.volume.1
next_sibling: ms.volume.3
children: [ms.part.5, ms.part.6, ms.part.7, ms.part.8]
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

# Volume II — Execution and Optimization

**Technical responsibility:** Hardware, kernels, distributed execution, post-training, inference, compression, serving.

**Navigation:** [Atlas index](../README.md) · previous: [Volume I](../vol-01-learning-and-representation/README.md) · next: [Volume III](../vol-03-grounded-and-interactive-intelligence/README.md)

## Parts

### Part V — Hardware, Kernels, and Distributed Execution

[part-05-hardware-kernels-and-distributed-execution/README.md](part-05-hardware-kernels-and-distributed-execution/README.md) · Measured kernels, parallelization, and recoverable training

- [25 — Accelerators, memory hierarchy, and performance models](part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/README.md) · prerequisites: 01–03, 05, 13–17
- [26 — Kernel programming and numerical equivalence](part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/README.md) · prerequisites: 03, 05, 25
- [27 — Attention, latent-attention, and expert kernels](part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/README.md) · prerequisites: 14–17, 25–26
- [28 — Frameworks, graph compilers, and runtime integration](part-05-hardware-kernels-and-distributed-execution/ch28-frameworks-graph-compilers-and-runtime-integration/README.md) · prerequisites: 19, 25–27
- [29 — Parallelism, collectives, and distributed optimization](part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/README.md) · prerequisites: 16, 19–20, 25–28
- [30 — Large training runs: reliability, monitoring, and recovery](part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/README.md) · prerequisites: 12, 19–21, 25–29

### Part VI — Post-Training and Reinforcement Learning

[part-06-post-training-and-reinforcement-learning/README.md](part-06-post-training-and-reinforcement-learning/README.md) · Auditable supervised, preference, and reinforcement-learning pipelines

- [31 — Supervised fine-tuning and behavior acquisition](part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/README.md) · prerequisites: 10–12, 19–24, 30
- [32 — Preferences, reward models, verifiers, and oversight](part-06-post-training-and-reinforcement-learning/ch32-preferences-reward-models-verifiers-and-oversight/README.md) · prerequisites: 02, 06, 11, 31
- [33 — Direct preference optimization and related objectives](part-06-post-training-and-reinforcement-learning/ch33-direct-preference-optimization-and-related-objectives/README.md) · prerequisites: 02, 23, 31–32
- [34 — Policy gradients, PPO, and RLHF](part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/README.md) · prerequisites: 02, 30–32
- [35 — Verifiable-reward RL and reasoning policy optimization](part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/README.md) · prerequisites: 11, 32–34
- [36 — Agent RL and distributed rollout systems](part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/README.md) · prerequisites: 11, 29–30, 34–35

### Part VII — Inference Algorithms, Distillation, and Compression

[part-07-inference-algorithms-distillation-and-compression/README.md](part-07-inference-algorithms-distillation-and-compression/README.md) · Quality/resource frontiers and validated state accounting

- [37 — Decoding, constrained generation, and speculative execution](part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/README.md) · prerequisites: 04–05, 14, 31
- [38 — Inference-time reasoning, search, and adaptive compute](part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/README.md) · prerequisites: 06, 32, 35, 37
- [39 — Knowledge, response, and policy distillation](part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/README.md) · prerequisites: 11, 23, 31–38
- [40 — Quantization from numerical model to deployable artifact](part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/README.md) · prerequisites: 03, 23, 25–28, 39
- [41 — Pruning, sparsity, rank reduction, and adaptive execution](part-07-inference-algorithms-distillation-and-compression/ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/README.md) · prerequisites: 13–17, 25–28, 39–40
- [42 — Prefill, decode, KV state, and inference resource models](part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md) · prerequisites: 14–17, 25, 37–41

### Part VIII — Inference Engines and Production Serving

[part-08-inference-engines-and-production-serving/README.md](part-08-inference-engines-and-production-serving/README.md) · SLO-driven deployment with capacity and cost evidence

- [43 — Runtime architecture and inference-engine selection](part-08-inference-engines-and-production-serving/ch43-runtime-architecture-and-inference-engine-selection/README.md) · prerequisites: 26–29, 37, 40–42
- [44 — Scheduling, distributed serving, and disaggregation](part-08-inference-engines-and-production-serving/ch44-scheduling-distributed-serving-and-disaggregation/README.md) · prerequisites: 29, 42–43
- [45 — Local, edge, and heterogeneous inference](part-08-inference-engines-and-production-serving/ch45-local-edge-and-heterogeneous-inference/README.md) · prerequisites: 25, 37, 40–43
- [46 — Admission control, routing, autoscaling, and service contracts](part-08-inference-engines-and-production-serving/ch46-admission-control-routing-autoscaling-and-service-contracts/README.md) · prerequisites: 06, 42–45
- [47 — Observability, deployment changes, and incident recovery](part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/README.md) · prerequisites: 30, 43–46
- [48 — Capacity planning, benchmarking, and lifecycle economics](part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) · prerequisites: 06, 21, 25, 42–47

