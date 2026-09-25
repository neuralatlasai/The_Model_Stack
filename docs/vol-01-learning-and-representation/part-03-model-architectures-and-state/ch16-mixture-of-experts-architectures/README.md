---
id: ms.chapter.16
entity_type: chapter
title: Mixture-of-experts architectures
short_title: Mixture of experts
section: null
slug: ch16-mixture-of-experts-architectures
parent: ms.part.3
prev_sibling: ms.chapter.15
next_sibling: ms.chapter.17
children: [ms.section.16.1, ms.section.16.2, ms.section.16.3, ms.section.16.4, ms.section.16.5, ms.section.16.6, ms.verification.16, ms.references.16]
prerequisites: [ms.chapter.13, ms.chapter.14]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
word_count_target: 1600
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

VOLUME I / PART III — MODEL ARCHITECTURES AND STATE / CHAPTER 16

# 16 — Mixture-of-experts architectures

**DERIVED — thesis.** Sparse expert activation separates stored capacity from selected computation, but its usefulness depends on routing semantics, training exposure, assignment preservation, and the physical cost of executing uneven demand.

6 sections · 2 spine papers · 3 reference-stack systems · prerequisites: 13–14 · artifact: an MoE routing and resource-accounting study · updated 2026-09-25

## Why this chapter exists

**DERIVED.** Dense parameter scaling makes additional feed-forward capacity participate in every token's computation. Sparse expert architectures change that relationship by storing alternative functions and selecting a subset for each input. This creates an opportunity to expand the available parameter collection without proportionally expanding selected-expert arithmetic. It also introduces a new set of failure boundaries that parameter counts alone cannot explain.

The bottleneck shifts from one regular feed-forward workload to an input-dependent distribution of work. Routers determine which experts receive examples and gradients. Capacity policies determine which assignments survive. Placement determines where representations move. Small expert batches, hot destinations, padding, and synchronization can dominate an execution path whose leading arithmetic appears favorable.

The dominant constraint is preserving a coherent account from model function to physical execution. A claim about activated parameters must identify dense and shared components. A claim about balance must identify scope and timing. A claim about speed must disclose drops, communication, and workload tails. This chapter builds one linked study that carries those distinctions through architecture, training, and deployment comparison, with mathematical fixtures separated from unmeasured empirical outcomes.

## Concept map

**DERIVED — from conditional function to joint evidence.**

~~~mermaid
flowchart TD
    A["[Objective] Task and resource requirements"] --> B["[Model] Total expert collection"]
    B --> C["[Dependency] Activated-parameter contract"]
    C --> D["[Process] Router scoring"]
    D --> E["[Process] Constrained assignment"]
    E --> F["[Tensor] Combination coefficients"]
    E --> G["[Metric] Pre-capacity load"]
    G --> H["[Feedback] Balancing intervention"]
    H --> D
    E --> I["[Boundary] Capacity and preservation"]
    I --> J["[Tensor] Expert-major token rows"]
    J --> K["[Memory] Expert placement and replicas"]
    K --> L["[Flow] Dispatch and return traffic"]
    L --> M["[Process] Expert execution and combination"]
    F --> M
    M --> N["[Metric] Quality drops bytes and latency"]
    A --> O["[Boundary] Comparison acceptance criteria"]
    N --> O
~~~

Text equivalent:

- Task and resource requirements constrain the total expert collection.
  - The activated-parameter contract separates stored and used tensors.
  - Router scoring produces constrained assignments and combination coefficients.
  - Pre-capacity load informs the balancing intervention, which affects future scoring.
- Assignments pass through capacity and preservation checks.
  - Expert-major rows are mapped to placement and replicas.
  - Dispatch and return traffic connect those rows to expert execution.
  - Weighted combination reconstructs token outputs.
- Quality, drops, bytes, and latency are evaluated jointly.
  - Comparison acceptance criteria preserve the original task and resource requirements.

The arrows express dependencies, not guaranteed improvements. More experts do not imply better quality; balanced counts do not imply useful specialization; fewer transferred bytes do not imply lower end-to-end latency. Each transition has a record that makes those claims testable.

## Position in the book

| Relation | Location and ownership |
|---|---|
| Prerequisites | [Chapter 13](../ch13-dense-transformer-design-and-parameter-allocation/README.md) owns dense parameter and feed-forward allocation; [Chapter 14](../ch14-attention-architectures-and-cache-representations/README.md) owns attention and cached state |
| Siblings (same part) | [Chapter 15](../ch15-position-long-context-and-effective-information-access/README.md) owns position and effective context; [Part III](../README.md) lists recurrent and multimodal successors |
| Downstream | Chapters 27 and 29 through [Part V](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/README.md); serving work through the [Atlas index](../../../README.md) |
| Trades off with | Dense widening in [13.3](../ch13-dense-transformer-design-and-parameter-allocation/13-3-feed-forward-alternatives.md); input-dependent memory and concurrency in [15.6](../ch15-position-long-context-and-effective-information-access/15-6-deployment-consequences.md) |

The chapter owns architectural routing and its accounting consequences. Detailed collective algorithms, accelerator kernels, and serving schedulers remain in their later canonical locations. The implementation sections identify the interfaces those systems must preserve, rather than duplicating a production runtime design.

## Sections

| Section | Title | What changes here | Primary evidence labels |
|---|---|---|---|
| [16.1](16-1-conditional-computation.md) | Conditional computation | Stored capacity separates from per-token and per-batch activation | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [16.2](16-2-router-design.md) | Router design | Selection and combination become separate contracts | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [16.3](16-3-training-dynamics.md) | Training dynamics | Balance receives a scope, intervention path, and learning consequence | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [16.4](16-4-capacity-and-execution.md) | Capacity and execution | Logical assignments become physical rows without hidden losses | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [16.5](16-5-distributed-implications.md) | Distributed implications | Placement turns assignments into traffic and critical-path work | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [16.6](16-6-comparative-methodology.md) | Comparative methodology | Dense baselines and joint metrics define the valid conclusion | DERIVED; MATHEMATICALLY-DERIVED |

## Artifact

**PROPOSAL — an MoE routing and resource-accounting study.** The artifact in [verification.md](verification.md) links a parameter inventory, routing ledger, capacity ledger, placement map, execution trace, and quality report under one immutable configuration identifier.

Each routing record includes the input unit, eligible experts, selected indices, combination coefficients, and balancing scope. Each capacity record retains pre-capacity demand, accepted assignments, rejected assignments, and padding. Each execution record identifies the physical owner, transfer convention, useful work, and measurement boundary. The final report includes quality, expert-load histograms, drop rates, communication bytes, and tail latency together.

The study separates operator correctness from model quality. Small independent fixtures can expose normalization errors, missing top-k accumulation, or incorrect traffic counts. They cannot establish useful specialization or favorable deployment performance. Those claims require the proposed held-out tasks and resource measurements.

## Verification

Replay identical routing traces through a bounded reference and each candidate execution path. Require assignment conservation when the path claims to be dropless, and disclose every rejected edge otherwise. Verify forward outputs and gradients under declared tolerances. Then compare models under separately stated active-compute and total-memory boundaries, sweeping batch size and workload skew. Report the complete attempt population, including rejected, failed, and retried requests.

The acceptance rule keeps quality and resources coupled. A faster configuration that discards more expert work is a changed model workload; it cannot inherit the quality score of a no-drop configuration. A balanced average histogram does not resolve a hot-rank tail. The report must preserve those distinctions at the configuration and workload-stratum level.

~~~figure
id: fig-16.1
kind: cycle
title: MoE study and verification cycle
caption: "Development findings can inform a new candidate; final quality and resource claims remain bound to the frozen configuration that produced them."
placement: inline
evidence: DERIVED
source: DERIVED:eq-16.19
alt: "Specify routing and resource contracts, freeze a candidate, verify assignment and numerical behavior, measure joint outcomes, and revise the next development candidate."
spec:
  stages:
    - {id: contract, label: Specify contracts, kind: dependency}
    - {id: candidate, label: Freeze candidate, kind: model}
    - {id: verify, label: Verify assignments and numerics, kind: process}
    - {id: measure, label: Measure joint outcomes, kind: metric}
  edges:
    - {from: contract, to: candidate}
    - {from: candidate, to: verify}
    - {from: verify, to: measure}
    - {from: measure, to: contract}
~~~

## Lineage

**PAPER-REPORTED — research lineage, not a performance ranking.**

- 2017 · Sparsely-Gated Mixture-of-Experts [R16.1] · conceptual ancestor.
- 2021 · Switch Transformers [P10] · engineering optimization; archival JMLR publication followed in 2022.
- 2022 · Expert Choice Routing [R16.7] · alternative branch.
- 2022 · MegaBlocks [R16.2] · engineering optimization.
- 2024 · Auxiliary-Loss-Free Load Balancing [R16.3] · alternative branch.
- 2024 · DeepSeek-V3 technical report [P13] · engineering optimization; inspected report revision v2 is dated 2025.

~~~figure
id: fig-16.2
kind: lineage
title: Sparse experts from architecture to execution
caption: "The dated works contribute different mechanisms: conditional activation, routing, balancing, and execution. None is a universal replacement for every earlier design."
placement: inline
evidence: PAPER-REPORTED
source: [R16.1, P10, R16.7, R16.2, R16.3, P13]
alt: "The lineage spans 2017 sparse gating, 2021 Switch routing, 2022 expert choice and MegaBlocks, and 2024 balancing and system integration."
spec:
  entries:
    - {year: 2017, work: Sparsely-Gated MoE, cite: R16.1, relation: conceptual ancestor}
    - {year: 2021, work: Switch Transformers, cite: P10, relation: engineering optimization}
    - {year: 2022, work: Expert Choice Routing, cite: R16.7, relation: alternative branch}
    - {year: 2022, work: MegaBlocks, cite: R16.2, relation: engineering optimization}
    - {year: 2024, work: Auxiliary-Loss-Free Load Balancing, cite: R16.3, relation: alternative branch}
    - {year: 2024, work: DeepSeek-V3 technical report, cite: P13, relation: engineering optimization}
~~~

## Terms owned here

| Term | Definition and owner |
|---|---|
| Activated-parameter contract | Counting rule for distinct tensors used by a token or batch; [16.1](16-1-conditional-computation.md#intuition) |
| Routing contract | Eligibility, selection, coefficients, overflow, and gradient rules; [16.2](16-2-router-design.md#intuition) |
| Balancing scope | Population and time interval defining load statistics; [16.3](16-3-training-dynamics.md#intuition) |
| Assignment preservation contract | Which routed edges survive all execution stages; [16.4](16-4-capacity-and-execution.md#intuition) |
| Expert placement ledger | Logical expert mapping to physical shards and replicas; [16.5](16-5-distributed-implications.md#intuition) |
| MoE comparison boundary | Matched resources, controlled conditions, and included costs; [16.6](16-6-comparative-methodology.md#intuition) |

## Reference-stack coverage

The table preserves exact reference-pack names and route surfaces. Specific inspected URLs and versions are in [references.md](references.md); a route entry does not assert that every organizational homepage was independently audited.

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #8 DeepSeek | — | Reported expert architecture and balancing distinctions | Papers: https://github.com/deepseek-ai | 16.1, 16.3, 16.5 | PAPER-REPORTED |
| §1 lab | #14 NVIDIA Research | — | Official distributed execution documentation route | Code: https://github.com/NVIDIA | 16.3–16.6 | OFFICIAL-DOCUMENTATION |
| §1 lab | #18 Google Research | — | Sparse gating, Switch, and expert-choice research | Papers: https://research.google/pubs/ | 16.1–16.3 | PAPER-REPORTED |
| §1 lab | #27 Hugging Face Research | — | Model-definition ecosystem behind the Switch interface | Code: https://github.com/huggingface | 16.1, 16.2 | OFFICIAL-DOCUMENTATION |
| §3 discovery source | #1 arXiv | — | Primary papers and revision histories | Home: https://arxiv.org/ | 16.1–16.6 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Bounded numerical references and distributed communication interface | docs/code: https://pytorch.org/docs/stable/ | 16.2, 16.4, 16.5 | OFFICIAL-DOCUMENTATION |
| §4 system | #23 NVIDIA Megatron-Core | Distributed training | Router, balancing, permutation, grouped execution, and expert-parallel interfaces | docs/code: https://docs.nvidia.com/megatron-core/index.html | 16.2–16.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #26 Hugging Face Transformers | Model definition / adaptation | Checkpoint-specific Switch configuration and model interface | docs/code: https://huggingface.co/docs/transformers/ | 16.1, 16.2 | OFFICIAL-DOCUMENTATION |
| Outside the reference stack (routed via book_plan.md anchors) | JMLR archival Switch Transformers page | — | Archival version of the plan's explicit P10 source anchor | https://www.jmlr.org/papers/v23/21-0998.html | 16.1–16.3 | PAPER-REPORTED |

MegaBlocks is cited as a research paper through arXiv, not added to the reference pack's §4 system vocabulary. No unlisted implementation is claimed as an installed or tested dependency.

**Inspection dimensions applied.** Parallelism and Communication appear in 16.5; Precision in 16.2 and 16.4; Memory in 16.1, 16.4, and 16.5; Kernels in 16.4; Checkpointing in 16.3 and 16.5; Inference and Metrics in 16.6; Reliability in 16.4–16.6; Reproducibility in every section. Post-training algorithms are outside this chapter's canonical scope, though adaptation-related routing shifts are identified as evaluation extensions.

## Source route

Follow the lab protocol to the original paper and revision record, then use the conference or archival workflow where applicable. The discovery cascade supplies papers, not evidence from popularity rankings. The training-stack protocol supplies official interfaces whose release or moving-documentation boundary must be recorded.

- site:arxiv.org/abs "DeepSeek" "mixture of experts"
- site:research.google/pubs "Switch Transformers"
- site:arxiv.org/abs "NVIDIA" "mixture of experts"
- "NVIDIA Megatron-Core" official documentation distributed training
- site:github.com "PyTorch" (architecture OR design OR RFC OR benchmark)

These filled-in queries are reproducible discovery routes. The source register records what was actually inspected. A paper title containing an efficiency claim is not a measured result for the reader's hardware, and a current documentation page is not proof of installed-package compatibility.

## Status

**Manuscript draft for the 2026 edition.** Primary papers and current official implementation surfaces were inspected on 2026-09-25. The chapter contains six technical sections, nineteen numbered equations, chapter-local figures, and proposed experiments. Historical mechanisms retain their original dates; moving documentation remains explicitly unpinned.

**UNVERIFIED:** proposed quality outcomes, expert specialization, training stability, workload-specific throughput, tail latency, energy, and monetary cost. **NOT-DISCLOSED:** implementation or training details absent from inspected sources. Mathematical fixture results validate identities and accounting, not empirical superiority or a universal MoE deployment recommendation.

