---
id: ms.root
entity_type: frontmatter
title: The Model Stack — Atlas index
short_title: Atlas index
volume: null
part: null
chapter: null
section: null
slug: index
parent: null
prev_sibling: null
next_sibling: null
children: [ms.volume.1, ms.volume.2, ms.volume.3, ms.appendices]
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
word_count_target: 900
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# The Model Stack

**From Data and Silicon to Intelligence**

*Foundation Models: Learning Science, Systems Engineering, and Intelligent Applications* · Edition 1.0 · 20 September 2026

**Audience:** principal scientists, research engineers, AI systems architects, and advanced graduate researchers.

**Scope:** 3 volumes · 11 parts · 66 chapters · 396 numbered sections · 8 reference appendices.

The book develops one central relationship: a learning objective induces a representation and an algorithm; those choices determine execution, memory, communication, and deployment behaviour; deployment evidence then informs the next learning intervention. Architecture, data, optimisation, hardware, and evaluation are therefore studied jointly.

## How this tree is organised

- The editorial hierarchy is **Volume → Part → Chapter → Section**. Every folder has a `README.md` that is the page for that node; every section is one file.
- Every file starts with a YAML frontmatter block that records `parent`, `prev_sibling`, `next_sibling`, `prerequisites`, `downstream`, `papers`, `implementations`, `status`, and `evidence_summary`. The schema is normative in [CONTENT_CONTRACT.md](CONTENT_CONTRACT.md).
- Concept-level relations are a graph, not a tree. Labs, papers, and libraries are provenance indexes (Appendices A–H); they are never parents of the methods they discuss.
- A machine-readable list of every node with its id, slug, path, title, prerequisites, and artifact is in [atlas-manifest.json](atlas-manifest.json).
- Source inputs are read-only: `../book_plan.md` (the editorial specification) and `../Instruction/` (reference stack, engineering standards, UI/UX brief).

## Front matter

- [Notation and the shared mathematical contract](front-matter/notation.md)
- [Reading routes and integrated studies](front-matter/reading-routes.md)
- [Glossary](front-matter/glossary.md) — compiled from each chapter's *Terms owned here*

## Volume I — Learning and Representation

[vol-01-learning-and-representation/README.md](vol-01-learning-and-representation/README.md) · Scientific foundations, data, tokenization, architecture, pretraining, adaptation, continual learning

### Part I — Scientific Foundations

[part-01-scientific-foundations/README.md](vol-01-learning-and-representation/part-01-scientific-foundations/README.md) · Principal development outcome: A correct reference model and defensible experiment

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 01 | The foundation-model lifecycle as a scientific system | graduate-level ML and software engineering | a system specification with measurable objectives and resource constraints | [ch01-foundation-model-lifecycle](vol-01-learning-and-representation/part-01-scientific-foundations/ch01-foundation-model-lifecycle/README.md) |
| 02 | Mathematical and statistical foundations | 01 | a consistent notation and statistical-estimation reference | [ch02-mathematical-and-statistical-foundations](vol-01-learning-and-representation/part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/README.md) |
| 03 | Numerical computation and a trustworthy training program | 02 | a numerically checked single-device training skeleton | [ch03-numerical-computation-and-trustworthy-training](vol-01-learning-and-representation/part-01-scientific-foundations/ch03-numerical-computation-and-trustworthy-training/README.md) |
| 04 | Language modeling and learning objectives | 02–03 | an objective ledger specifying conditioning, targets, masks, and normalization | [ch04-language-modeling-and-learning-objectives](vol-01-learning-and-representation/part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/README.md) |
| 05 | A minimal Transformer and its execution trace | 03–04 | a small reference Transformer with inspectable intermediate tensors | [ch05-minimal-transformer-and-execution-trace](vol-01-learning-and-representation/part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/README.md) |
| 06 | Experimental design and evaluation before optimization | 01–05 | a preregistered experiment and benchmark manifest | [ch06-experimental-design-and-evaluation-before-optimization](vol-01-learning-and-representation/part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md) |

### Part II — Data and Representation Engineering

[part-02-data-and-representation-engineering/README.md](vol-01-learning-and-representation/part-02-data-and-representation-engineering/README.md) · Principal development outcome: A versioned corpus, tokenizer, and ingestion pipeline

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 07 | Data provenance, acquisition, and dataset semantics | 04, 06 | a dataset inventory with provenance and admissible-use fields | [ch07-data-provenance-acquisition-and-dataset-semantics](vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch07-data-provenance-acquisition-and-dataset-semantics/README.md) |
| 08 | Cleaning, deduplication, privacy filtering, and contamination | 06–07 | an auditable filtering pipeline and removal ledger | [ch08-cleaning-deduplication-privacy-filtering-and-contamination](vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch08-cleaning-deduplication-privacy-filtering-and-contamination/README.md) |
| 09 | Data mixtures, curricula, and sample efficiency | 06–08 | a mixture policy and exposure accounting report | [ch09-data-mixtures-curricula-and-sample-efficiency](vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch09-data-mixtures-curricula-and-sample-efficiency/README.md) |
| 10 | Tokenization, serialization, and interface correctness | 04, 07–09 | a tokenizer and serialization compatibility suite | [ch10-tokenization-serialization-and-interface-correctness](vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/README.md) |
| 11 | Synthetic data, preferences, and interactive trajectories | 06–10 | a supervised-data and trajectory schema with quality gates | [ch11-synthetic-data-preferences-and-interactive-trajectories](vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch11-synthetic-data-preferences-and-interactive-trajectories/README.md) |
| 12 | Scalable data infrastructure and reproducible ingestion | 07–11 | a resumable dataset build and loading pipeline | [ch12-scalable-data-infrastructure-and-reproducible-ingestion](vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch12-scalable-data-infrastructure-and-reproducible-ingestion/README.md) |

### Part III — Model Architectures and State

[part-03-model-architectures-and-state/README.md](vol-01-learning-and-representation/part-03-model-architectures-and-state/README.md) · Principal development outcome: Explicit representation, state, and computation tradeoffs

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 13 | Dense Transformer design and parameter allocation | 05, 10 | a parameter/FLOP model for a family of dense architectures | [ch13-dense-transformer-design-and-parameter-allocation](vol-01-learning-and-representation/part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/README.md) |
| 14 | Attention architectures and cache representations | 05, 13 | an attention-family comparison with explicit cached state | [ch14-attention-architectures-and-cache-representations](vol-01-learning-and-representation/part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/README.md) |
| 15 | Position, long context, and effective information access | 10, 13–14 | a long-context experiment matrix | [ch15-position-long-context-and-effective-information-access](vol-01-learning-and-representation/part-03-model-architectures-and-state/ch15-position-long-context-and-effective-information-access/README.md) |
| 16 | Mixture-of-experts architectures | 13–14 | an MoE routing and resource-accounting study | [ch16-mixture-of-experts-architectures](vol-01-learning-and-representation/part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/README.md) |
| 17 | State-space, recurrent, linear-attention, and hybrid models | 02, 13–15 | a sequence-model comparison under explicit state budgets | [ch17-state-space-recurrent-linear-attention-and-hybrid-models](vol-01-learning-and-representation/part-03-model-architectures-and-state/ch17-state-space-recurrent-linear-attention-and-hybrid-models/README.md) |
| 18 | Multimodal architectural primitives | 04, 10, 13–17 | a modality-to-model interface specification | [ch18-multimodal-architectural-primitives](vol-01-learning-and-representation/part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/README.md) |

### Part IV — Training Science and Adaptation

[part-04-training-science-and-adaptation/README.md](vol-01-learning-and-representation/part-04-training-science-and-adaptation/README.md) · Principal development outcome: Pretraining/adaptation recipes with scaling and retention evidence

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 19 | Pretraining objectives and the full training loop | 04, 06, 12–18 | a complete single-device reference training recipe | [ch19-pretraining-objectives-and-the-full-training-loop](vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/README.md) |
| 20 | Optimization, schedules, and training stability | 02–03, 19 | an optimizer/schedule ablation protocol | [ch20-optimization-schedules-and-training-stability](vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/README.md) |
| 21 | Scaling laws and compute allocation | 06, 09, 13, 19–20 | a fitted scaling model with uncertainty and held-out validation | [ch21-scaling-laws-and-compute-allocation](vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/README.md) |
| 22 | Continued pretraining, mid-training, and domain adaptation | 09–12, 19–21 | an adaptation decision record and retention evaluation | [ch22-continued-pretraining-mid-training-and-domain-adaptation](vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/README.md) |
| 23 | Parameter-efficient adaptation and model composition | 13, 19–22 | an adapter lifecycle and composition study | [ch23-parameter-efficient-adaptation-and-model-composition](vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/README.md) |
| 24 | Continual learning, model editing, and unlearning | 06, 19–23 | a sequential-task evaluation with explicit data-retention constraints | [ch24-continual-learning-model-editing-and-unlearning](vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch24-continual-learning-model-editing-and-unlearning/README.md) |

## Volume II — Execution and Optimization

[vol-02-execution-and-optimization/README.md](vol-02-execution-and-optimization/README.md) · Hardware, kernels, distributed execution, post-training, inference, compression, serving

### Part V — Hardware, Kernels, and Distributed Execution

[part-05-hardware-kernels-and-distributed-execution/README.md](vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/README.md) · Principal development outcome: Measured kernels, parallelization, and recoverable training

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 25 | Accelerators, memory hierarchy, and performance models | 01–03, 05, 13–17 | a hardware/resource model for a specified workload | [ch25-accelerators-memory-hierarchy-and-performance-models](vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/README.md) |
| 26 | Kernel programming and numerical equivalence | 03, 05, 25 | a profiled operator with a correctness reference | [ch26-kernel-programming-and-numerical-equivalence](vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch26-kernel-programming-and-numerical-equivalence/README.md) |
| 27 | Attention, latent-attention, and expert kernels | 14–17, 25–26 | an algorithm-to-kernel analysis with hardware-specific measurements | [ch27-attention-latent-attention-and-expert-kernels](vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/README.md) |
| 28 | Frameworks, graph compilers, and runtime integration | 19, 25–27 | a reproducible framework/compiler execution profile | [ch28-frameworks-graph-compilers-and-runtime-integration](vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch28-frameworks-graph-compilers-and-runtime-integration/README.md) |
| 29 | Parallelism, collectives, and distributed optimization | 16, 19–20, 25–28 | a distributed placement and communication plan | [ch29-parallelism-collectives-and-distributed-optimization](vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/README.md) |
| 30 | Large training runs: reliability, monitoring, and recovery | 12, 19–21, 25–29 | a training runbook and fault-injection report | [ch30-large-training-runs-reliability-monitoring-and-recovery](vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/README.md) |

### Part VI — Post-Training and Reinforcement Learning

[part-06-post-training-and-reinforcement-learning/README.md](vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/README.md) · Principal development outcome: Auditable supervised, preference, and reinforcement-learning pipelines

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 31 | Supervised fine-tuning and behavior acquisition | 10–12, 19–24, 30 | an SFT recipe with exact target masks and template fixtures | [ch31-supervised-fine-tuning-and-behavior-acquisition](vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/README.md) |
| 32 | Preferences, reward models, verifiers, and oversight | 02, 06, 11, 31 | a reward/verification specification and calibration study | [ch32-preferences-reward-models-verifiers-and-oversight](vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch32-preferences-reward-models-verifiers-and-oversight/README.md) |
| 33 | Direct preference optimization and related objectives | 02, 23, 31–32 | an objective-comparison sheet and controlled preference experiment | [ch33-direct-preference-optimization-and-related-objectives](vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch33-direct-preference-optimization-and-related-objectives/README.md) |
| 34 | Policy gradients, PPO, and RLHF | 02, 30–32 | a transparent rollout-to-update implementation specification | [ch34-policy-gradients-ppo-and-rlhf](vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/README.md) |
| 35 | Verifiable-reward RL and reasoning policy optimization | 11, 32–34 | a verifier-grounded RL experiment with failure analysis | [ch35-verifiable-reward-rl-and-reasoning-policy-optimization](vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/README.md) |
| 36 | Agent RL and distributed rollout systems | 11, 29–30, 34–35 | a versioned environment/rollout/update architecture | [ch36-agent-rl-and-distributed-rollout-systems](vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch36-agent-rl-and-distributed-rollout-systems/README.md) |

### Part VII — Inference Algorithms, Distillation, and Compression

[part-07-inference-algorithms-distillation-and-compression/README.md](vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/README.md) · Principal development outcome: Quality/resource frontiers and validated state accounting

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 37 | Decoding, constrained generation, and speculative execution | 04–05, 14, 31 | a decoding-policy comparison with distributional checks | [ch37-decoding-constrained-generation-and-speculative-execution](vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/README.md) |
| 38 | Inference-time reasoning, search, and adaptive compute | 06, 32, 35, 37 | a quality-versus-inference-budget frontier | [ch38-inference-time-reasoning-search-and-adaptive-compute](vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/README.md) |
| 39 | Knowledge, response, and policy distillation | 11, 23, 31–38 | a teacher–student experiment with transparent information access | [ch39-knowledge-response-and-policy-distillation](vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/README.md) |
| 40 | Quantization from numerical model to deployable artifact | 03, 23, 25–28, 39 | a quantized checkpoint with calibration and runtime evidence | [ch40-quantization-from-numerical-model-to-deployable-artifact](vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/README.md) |
| 41 | Pruning, sparsity, rank reduction, and adaptive execution | 13–17, 25–28, 39–40 | an executable compression comparison | [ch41-pruning-sparsity-rank-reduction-and-adaptive-execution](vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/README.md) |
| 42 | Prefill, decode, KV state, and inference resource models | 14–17, 25, 37–41 | an inference memory/latency estimator validated against measurements | [ch42-prefill-decode-kv-state-and-inference-resource-models](vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md) |

### Part VIII — Inference Engines and Production Serving

[part-08-inference-engines-and-production-serving/README.md](vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/README.md) · Principal development outcome: SLO-driven deployment with capacity and cost evidence

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 43 | Runtime architecture and inference-engine selection | 26–29, 37, 40–42 | a version-pinned engine comparison | [ch43-runtime-architecture-and-inference-engine-selection](vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch43-runtime-architecture-and-inference-engine-selection/README.md) |
| 44 | Scheduling, distributed serving, and disaggregation | 29, 42–43 | a serving-scheduler and placement experiment | [ch44-scheduling-distributed-serving-and-disaggregation](vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch44-scheduling-distributed-serving-and-disaggregation/README.md) |
| 45 | Local, edge, and heterogeneous inference | 25, 37, 40–43 | a constrained-device deployment profile | [ch45-local-edge-and-heterogeneous-inference](vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch45-local-edge-and-heterogeneous-inference/README.md) |
| 46 | Admission control, routing, autoscaling, and service contracts | 06, 42–45 | an SLO-driven serving control-plane design | [ch46-admission-control-routing-autoscaling-and-service-contracts](vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch46-admission-control-routing-autoscaling-and-service-contracts/README.md) |
| 47 | Observability, deployment changes, and incident recovery | 30, 43–46 | an instrumented deployment and rollback runbook | [ch47-observability-deployment-changes-and-incident-recovery](vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/README.md) |
| 48 | Capacity planning, benchmarking, and lifecycle economics | 06, 21, 25, 42–47 | a workload-specific capacity/cost model | [ch48-capacity-planning-benchmarking-and-lifecycle-economics](vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) |

## Volume III — Grounded and Interactive Intelligence

[vol-03-grounded-and-interactive-intelligence/README.md](vol-03-grounded-and-interactive-intelligence/README.md) · Retrieval, agents, multimodality, world models, evaluation, interpretability, security, release science

### Part IX — Retrieval, Context, and Agent Systems

[part-09-retrieval-context-and-agent-systems/README.md](vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/README.md) · Principal development outcome: Grounded context, reliable tools, and consistent long-horizon state

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 49 | Retrieval models, indexing, and evidence access | 06–12, 18, 48 | a versioned retrieval pipeline and recall/latency evaluation | [ch49-retrieval-models-indexing-and-evidence-access](vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/README.md) |
| 50 | Context construction and retrieval-augmented generation | 10, 15, 37–38, 49 | a context compiler with evidence provenance | [ch50-context-construction-and-retrieval-augmented-generation](vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch50-context-construction-and-retrieval-augmented-generation/README.md) |
| 51 | Tool use, protocol interfaces, and reliable execution | 10–11, 37, 46–47, 50 | a typed tool-execution contract | [ch51-tool-use-protocol-interfaces-and-reliable-execution](vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch51-tool-use-protocol-interfaces-and-reliable-execution/README.md) |
| 52 | Planning, control flow, verification, and recovery | 36, 38, 50–51 | a bounded agent controller with explicit state transitions | [ch52-planning-control-flow-verification-and-recovery](vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch52-planning-control-flow-verification-and-recovery/README.md) |
| 53 | Agent memory, persistent state, and long-horizon consistency | 24, 42, 49–52 | a memory/state policy with provenance and deletion semantics | [ch53-agent-memory-persistent-state-and-long-horizon-consistency](vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch53-agent-memory-persistent-state-and-long-horizon-consistency/README.md) |
| 54 | Multi-agent coordination and system-level evaluation | 06, 36, 48, 51–53 | a coordination experiment with a budget-matched single-agent baseline | [ch54-multi-agent-coordination-and-system-level-evaluation](vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch54-multi-agent-coordination-and-system-level-evaluation/README.md) |

### Part X — Multimodal, World, and Embodied Models

[part-10-multimodal-world-and-embodied-models/README.md](vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/README.md) · Principal development outcome: Modality-aware learning, prediction, planning, and control studies

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 55 | Vision-language models and document intelligence | 18, 31, 49–50 | a vision/document evaluation with component ablations | [ch55-vision-language-models-and-document-intelligence](vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/README.md) |
| 56 | Audio, speech, and real-time interaction | 18, 31, 42, 46–47 | an audio-language latency and task-quality profile | [ch56-audio-speech-and-real-time-interaction](vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch56-audio-speech-and-real-time-interaction/README.md) |
| 57 | Video, temporal reasoning, and streaming multimodality | 15, 18, 55–56 | a temporally grounded multimodal evaluation | [ch57-video-temporal-reasoning-and-streaming-multimodality](vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch57-video-temporal-reasoning-and-streaming-multimodality/README.md) |
| 58 | Generative multimodal models and alternative generation paths | 04, 18, 25–28, 37–41, 55–57 | an objective/sampler/runtime comparison | [ch58-generative-multimodal-models-and-alternative-generation-paths](vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch58-generative-multimodal-models-and-alternative-generation-paths/README.md) |
| 59 | Predictive representations, JEPA, and world models | 17–18, 24, 38, 57–58 | a representation-prediction experiment and bounded planning study | [ch59-predictive-representations-jepa-and-world-models](vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch59-predictive-representations-jepa-and-world-models/README.md) |
| 60 | Vision-language-action policies and embodied learning | 18, 24, 34–36, 52, 55–59 | a simulation-first embodied-policy evaluation | [ch60-vision-language-action-policies-and-embodied-learning](vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch60-vision-language-action-policies-and-embodied-learning/README.md) |

### Part XI — Evaluation, Interpretability, and Deployment Assurance

[part-11-evaluation-interpretability-and-deployment-assurance/README.md](vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/README.md) · Principal development outcome: Reproducible evidence and an accountable release dossier

| Ch | Title | Prerequisites | Artifact | Path |
|---:|---|---|---|---|
| 61 | Capability portfolios and benchmark validity | 06, 21, 31–40, 49–60 | a versioned evaluation portfolio with coverage and contamination analysis | [ch61-capability-portfolios-and-benchmark-validity](vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/README.md) |
| 62 | Human preference, model judges, and uncertainty | 02, 06, 32–33, 61 | a human/judge evaluation with calibration and disagreement analysis | [ch62-human-preference-model-judges-and-uncertainty](vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/README.md) |
| 63 | Agent, retrieval, multimodal, and system reliability evaluation | 48–62 | an end-to-end reliability report with stage-level attribution | [ch63-agent-retrieval-multimodal-and-system-reliability-evaluation](vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) |
| 64 | Mechanistic interpretability and causal model analysis | 02, 05, 13–18, 32, 61–62 | a mechanistic hypothesis with intervention controls | [ch64-mechanistic-interpretability-and-causal-model-analysis](vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/README.md) |
| 65 | Security, privacy, safety, and adversarial robustness | 07–08, 24, 32–36, 46–47, 51–64 | a threat model and evidence-backed mitigation evaluation | [ch65-security-privacy-safety-and-adversarial-robustness](vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/README.md) |
| 66 | Release decisions, reproducibility, and research-to-production closure | 06, 30, 47–48, 61–65 | a complete release dossier and reproducibility package | [ch66-release-decisions-reproducibility-and-research-to-production-closure](vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch66-release-decisions-reproducibility-and-research-to-production-closure/README.md) |

## Reference appendices

[appendices/README.md](appendices/README.md)

| Appendix | Title | Path |
|---|---|---|
| A | Research organizations, model families, and disclosure | [appendix-a-organizations-model-families-and-disclosure.md](appendices/appendix-a-organizations-model-families-and-disclosure.md) |
| B | Software ecosystem and implementation roles | [appendix-b-software-ecosystem-and-implementation-roles.md](appendices/appendix-b-software-ecosystem-and-implementation-roles.md) |
| C | Dataset atlas and training-role taxonomy | [appendix-c-dataset-atlas-and-training-role-taxonomy.md](appendices/appendix-c-dataset-atlas-and-training-role-taxonomy.md) |
| D | Primary-paper spine | [appendix-d-primary-paper-spine.md](appendices/appendix-d-primary-paper-spine.md) |
| E | Researchers indexed by documented contribution | [appendix-e-researchers-by-documented-contribution.md](appendices/appendix-e-researchers-by-documented-contribution.md) |
| F | Conferences, journals, and publication routes | [appendix-f-conferences-journals-and-publication-routes.md](appendices/appendix-f-conferences-journals-and-publication-routes.md) |
| G | Curricula, reference ecosystems, and independent measurement | [appendix-g-curricula-reference-ecosystems-and-independent-measurement.md](appendices/appendix-g-curricula-reference-ecosystems-and-independent-measurement.md) |
| H | Editorial specification, metadata, and coverage audit | [appendix-h-editorial-specification-metadata-and-coverage-audit.md](appendices/appendix-h-editorial-specification-metadata-and-coverage-audit.md) |
| I | Evaluation ecosystem, 2026 — frameworks, benchmarks, and platforms in priority order | [appendix-i-evaluation-ecosystem-2026.md](appendices/appendix-i-evaluation-ecosystem-2026.md) |

## Editorial status

Edition 1.0 contains chapter manuscripts written against the architecture in `book_plan.md`. Every experiment in the manuscripts is a proposal. No result is EMPIRICALLY-OBSERVED in this edition. Publicly undocumented model details remain NOT-DISCLOSED.
