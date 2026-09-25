---
id: ms.chapter.15
entity_type: chapter
title: Position, long context, and effective information access
short_title: Position and long context
section: null
slug: ch15-position-long-context-and-effective-information-access
parent: ms.part.3
prev_sibling: ms.chapter.14
next_sibling: ms.chapter.16
children: [ms.section.15.1, ms.section.15.2, ms.section.15.3, ms.section.15.4, ms.section.15.5, ms.section.15.6, ms.verification.15, ms.references.15]
prerequisites: [ms.chapter.10, ms.chapter.13, ms.chapter.14]
downstream: [ms.chapter.27, ms.chapter.42, ms.chapter.49]
word_count_target: 1500
volume: 1
part: 3
chapter: 15
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [position_representation, long_context], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P01, P46]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

VOLUME I / PART III — MODEL ARCHITECTURES AND STATE / CHAPTER 15

# 15 — Position, long context, and effective information access

**DERIVED — thesis.** Usable context is a measured relationship between positional geometry, training exposure, evidence requirements, and resource constraints, rather than a consequence of an advertised sequence limit.

6 sections · 2 spine papers · 3 reference-stack systems · prerequisites: 10, 13–14 · artifact: a long-context experiment matrix · updated 2026-09-25

## Why this chapter exists

**DERIVED.** Attention's ability to connect tokens does not by itself establish that a trained model can exploit every permitted connection. A runtime may accept a long sequence while its positional transformation operates outside familiar conditions, its training data provides little comparable dependency exposure, or its task requires combining more facts than its evaluation demonstrated. A maximum input length compresses these different questions into one misleading scalar.

The bottleneck shifts as sequence length grows. Position phases span unfamiliar ranges; dense interaction counts rise; training batches contain fewer independent sequences at a fixed token budget; inference state consumes more memory. At the same time, evidence can become harder to distinguish from distractors or can be split across several source locations. Improving one resource boundary does not establish improvement at the others.

The dominant constraint is maintaining a traceable connection between the information supplied, the computation performed, and the claim being made. This chapter therefore links a position contract to an exposure ledger, an evaluation matrix, and an admission policy. Mathematical fixtures establish operator and accounting identities. Primary sources establish specific published mechanisms. Proposed experiments establish what must be measured before a deployment can claim an effective-context envelope.

## Concept map

**DERIVED — the information-access chain.**

~~~mermaid
flowchart TD
    A["[Objective] Required answer evidence"] --> B["[Dependency] Position contract"]
    B --> C["[Tensor] Absolute and relative coordinates"]
    C --> D["[Process] Context extension"]
    D --> E["[Dataset] Length exposure ledger"]
    E --> F["[Boundary] Packing and visibility"]
    F --> G["[Process] Context-parallel execution"]
    G --> H["[Model] Frozen evaluated checkpoint"]
    A --> I["[Dataset] Evidence-position matrix"]
    I --> J["[Metric] Supported task success"]
    H --> J
    J --> K["[State] Effective-context envelope"]
    A --> L["[Process] Retrieval or broad-context assembly"]
    L --> M["[Memory] Cache and token budget"]
    K --> N["[Boundary] Context admission contract"]
    M --> N
~~~

Text equivalent:

- Required answer evidence constrains the position contract and the evidence-position matrix.
  - The position contract specifies absolute and relative coordinates.
  - Context extension changes their operating range.
  - The length exposure ledger records the training distribution.
  - Packing and visibility preserve example semantics.
  - Context-parallel execution preserves global coordinates.
  - These produce the frozen evaluated checkpoint.
- The matrix and checkpoint determine supported task success.
  - Success with uncertainty defines the effective-context envelope.
- Retrieval or broad-context assembly chooses supplied evidence.
  - Cache and token budgets constrain its execution.
  - The envelope and budgets jointly inform the context admission contract.

The map separates dependencies from guarantees. A trained checkpoint reaches evaluation, but the arrow does not assert that it passes. Likewise, a context constructor produces an input, not proof of sufficient support. Each boundary carries an explicit artifact so a failed request can be traced to absent evidence, changed geometry, numerical error, or an unsupported quality claim.

## Position in the book

| Relation | Location and ownership |
|---|---|
| Prerequisites | Chapter 10's representation contract through the [Part II index](../../part-02-data-and-representation-engineering/README.md); [Chapter 13](../ch13-dense-transformer-design-and-parameter-allocation/README.md); [Chapter 14](../ch14-attention-architectures-and-cache-representations/README.md) |
| Siblings (same part) | [Part III](../README.md): dense allocation, attention state, conditional computation, recurrent state, and multimodal primitives |
| Downstream | Kernel and distributed execution in [Part V](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/README.md); Chapters 42 and 49 through the [Atlas index](../../../README.md) |
| Trades off with | Cache capacity and attention visibility in [Chapter 14](../ch14-attention-architectures-and-cache-representations/README.md); explicit evidence selection in [15.5](15-5-long-context-versus-retrieval.md) |

This chapter owns positional geometry and the operational meaning of effective context. It uses attention and cache results already developed in Chapter 14 rather than redefining their architecture. Later systems chapters own optimized distributed execution and serving mechanisms; later grounding chapters own retrieval algorithms. The present comparison keeps their interface contracts visible.

## Sections

| Section | Title | What changes here | Primary evidence labels |
|---|---|---|---|
| [15.1](15-1-position-representations.md) | Position representations | Logical coordinates become an explicit attention and cache contract | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [15.2](15-2-context-extension.md) | Context extension | Geometry and adaptation must be evaluated together | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [15.3](15-3-long-sequence-training.md) | Long-sequence training | Physical length is separated from dependency exposure | DERIVED; OFFICIAL-DOCUMENTATION |
| [15.4](15-4-effective-context.md) | Effective context | Capability becomes a matrix of tested conditions | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [15.5](15-5-long-context-versus-retrieval.md) | Long context versus retrieval | Evidence coverage and whole-pipeline cost define the comparison | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [15.6](15-6-deployment-consequences.md) | Deployment consequences | Admission must satisfy resource and evidence constraints | DERIVED; OFFICIAL-DOCUMENTATION |

## Artifact

**PROPOSAL — a long-context experiment matrix.** The complete schema and acceptance protocol are in [verification.md](verification.md). Each row binds a frozen system configuration to one task cell, source snapshot, evidence layout, distractor regime, fact count, and resource boundary. Store the serialized prompt and source-support ledger alongside its output and evaluator decision.

The artifact has five logical records: configuration, example provenance, cell specification, execution outcome, and aggregate claim. Separating them prevents a changed tokenizer or source snapshot from being hidden inside an otherwise identical experiment name. Results remain unmeasured until execution; mathematical fixture values are not benchmark outcomes.

A finished experimental artifact must allow another researcher to reconstruct which facts were present, where they appeared after serialization, which facts were required, and how failures entered the denominator. The manuscript provides that specification and worked mathematical fixtures. It does not claim to have run the proposed training or model evaluations.

## Verification

Vary evidence position, distractor density and type, and the number of required facts while controlling the checkpoint and serialization. Include single-needle, tracing, aggregation, and distributed-evidence tasks. Test the position/cache contract separately from task quality. Report per-cell success and uncertainty, short-context preservation, and resource use. A cell failing the quality criterion remains failed even when the runtime accepts its input. An untested length remains untested even when longer and shorter cells pass.

The verification record also distinguishes missing support from incorrect reasoning given complete support. Evidence-only and no-evidence controls help interpret that distinction, while counterfactual source changes test whether an answer responds to the supplied facts. The final deployment claim is restricted to the evaluated constructor and admission policy.

~~~figure
id: fig-15.1
kind: cycle
title: Context claim verification cycle
caption: "The next candidate may use development findings; final test results remain attached to the frozen configuration that produced them."
placement: inline
evidence: DERIVED
source: DERIVED:eq-15.13
alt: "Specify position and evidence contracts, construct a candidate, evaluate held-out cells, audit resource and support failures, and revise the next development candidate."
spec:
  stages:
    - {id: specify, label: Specify contracts, kind: dependency}
    - {id: candidate, label: Freeze candidate, kind: model}
    - {id: evaluate, label: Evaluate held-out cells, kind: metric}
    - {id: audit, label: Audit support and resources, kind: process}
  edges:
    - {from: specify, to: candidate}
    - {from: candidate, to: evaluate}
    - {from: evaluate, to: audit}
    - {from: audit, to: specify}
~~~

## Lineage

**PAPER-REPORTED — dated mechanisms, not a leaderboard.**

- 2017 · Transformer [P01] · conceptual ancestor.
- 2018 · Self-Attention with Relative Position Representations [R15.6] · alternative branch.
- 2021 · RoFormer [R15.1] · alternative branch.
- 2021 · ALiBi [R15.2] · alternative branch.
- 2023 · Position Interpolation [R15.3] · engineering optimization.
- 2023 · YaRN [R15.4] · engineering optimization; inspected revision v3 is dated 2026.
- 2024 · RULER [R15.8] · engineering optimization of the evaluation boundary.
- 2025 · LongRoPE2 [R15.5] · engineering optimization.
- 2025 · Gemini 2.5 technical report [P46] · alternative branch of system-level capability evidence.

~~~figure
id: fig-15.2
kind: lineage
title: Positional mechanisms and evaluation lineage
caption: "Years identify first publication for the listed works. YaRN's inspected v3 is a 2026 revision; publication chronology does not imply universal superiority."
placement: inline
evidence: PAPER-REPORTED
source: [P01, R15.6, R15.1, R15.2, R15.3, R15.4, R15.8, R15.5, P46]
alt: "The lineage runs from the 2017 Transformer through relative positions, rotary and linear biases, context extension, broader evaluation, and 2025 system reports."
spec:
  entries:
    - {year: 2017, work: Transformer, cite: P01, relation: conceptual ancestor}
    - {year: 2018, work: Relative position representations, cite: R15.6, relation: alternative branch}
    - {year: 2021, work: RoFormer, cite: R15.1, relation: alternative branch}
    - {year: 2021, work: ALiBi, cite: R15.2, relation: alternative branch}
    - {year: 2023, work: Position Interpolation, cite: R15.3, relation: engineering optimization}
    - {year: 2023, work: YaRN, cite: R15.4, relation: engineering optimization}
    - {year: 2024, work: RULER, cite: R15.8, relation: engineering optimization}
    - {year: 2025, work: LongRoPE2, cite: R15.5, relation: engineering optimization}
    - {year: 2025, work: Gemini 2.5 technical report, cite: P46, relation: alternative branch}
~~~

## Terms owned here

| Term | Definition and owner |
|---|---|
| Position contract | Logical-location mapping and transformation/cache conventions; [15.1](15-1-position-representations.md#intuition) |
| Context-extension contract | Target range, geometry, adaptation, numerics, and cache compatibility; [15.2](15-2-context-extension.md#intuition) |
| Length exposure ledger | Training tokens, examples, targets, and dependency distances by regime; [15.3](15-3-long-sequence-training.md#intuition) |
| Effective-context envelope | Tested conditions satisfying quality and resource criteria with uncertainty; [15.4](15-4-effective-context.md#intuition) |
| Compositional evidence coverage | Presence and usability of all required source components; [15.5](15-5-long-context-versus-retrieval.md#intuition) |
| Context admission contract | Rules for serialization, resource limits, support, and fallback; [15.6](15-6-deployment-consequences.md#intuition) |

## Reference-stack coverage

Stack surfaces below preserve the exact names and routes in the reference pack. Specific inspected paper and documentation URLs, access dates, and revision boundaries are recorded in [references.md](references.md); the route table is not a claim that every linked organization page was independently audited.

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #3 Google DeepMind | — | Plan-anchored Gemini 2.5 evaluation report | Papers: https://deepmind.google/research/publications/ | 15.4, 15.6 | PAPER-REPORTED |
| §1 lab | #13 Microsoft Research / Microsoft AI | — | LongRoPE2 search and mixed-window adaptation research route | Papers: https://www.microsoft.com/research/publications/ | 15.2, 15.3 | PAPER-REPORTED |
| §1 lab | #14 NVIDIA Research | — | RULER primary paper and official repository | Code: https://github.com/NVIDIA | 15.4 | PAPER-REPORTED |
| §1 lab | #27 Hugging Face Research | — | Transformers source ecosystem behind the inspected guides | Code: https://github.com/huggingface | 15.1, 15.2, 15.6 | OFFICIAL-DOCUMENTATION |
| §3 discovery source | #1 arXiv | — | Primary papers and revision histories; no ranking evidence | Home: https://arxiv.org/ | 15.1–15.6 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Versioned scaled-dot-product attention reference | docs/code: https://pytorch.org/docs/stable/ | 15.1, 15.3 | OFFICIAL-DOCUMENTATION |
| §4 system | #23 NVIDIA Megatron-Core | Distributed training | Context-parallel ownership and communication | docs/code: https://docs.nvidia.com/megatron-core/index.html | 15.3 | OFFICIAL-DOCUMENTATION |
| §4 system | #26 Hugging Face Transformers | Model definition / adaptation | Rotary configuration and cache-strategy contracts | docs/code: https://huggingface.co/docs/transformers/ | 15.1, 15.2, 15.5, 15.6 | OFFICIAL-DOCUMENTATION |

**Inspection dimensions applied.** Parallelism and Communication appear in 15.3; Precision in 15.1–15.3; Memory in 15.3 and 15.6; Kernels at the reference-attention boundary in 15.1; Checkpointing in 15.2; Inference in 15.5–15.6; Metrics in 15.4; Reliability in 15.6; Reproducibility in all six sections. Post-training algorithms are outside this chapter's ownership.

## Source route

Follow the pack's lab route from research/publication surface to the primary paper and revision history. Use the conference workflow when an archival venue is identified; do not infer peer review from arXiv availability. Follow the discovery cascade to the original report, then inspect official system documentation for implementation claims. Concrete query templates, filled using the pack's protocols, are:

- site:arxiv.org/abs "Google DeepMind" "long context"
- site:arxiv.org/abs "Microsoft Research" "LongRoPE2"
- site:github.com/NVIDIA "RULER"
- "Hugging Face Transformers" official documentation distributed training
- site:github.com "NVIDIA Megatron-Core" (architecture OR design OR RFC OR benchmark)

These are reproducible search routes, not additional evidentiary sources. A search hit establishes neither method correctness nor current interface compatibility. The references register identifies the actual inspected material.

## Status

**Manuscript draft for the 2026 edition.** Primary sources were inspected on 2026-09-25, including the 2026 YaRN revision and current official documentation surfaces. The prose and figures are original synthesis with source-local mechanism attribution. Nineteen numbered equations specify mathematical contracts; six section experiments and the integrated verification protocol are proposals.

**UNVERIFIED:** proposed model quality, adaptation outcomes, hardware performance, cache-hit distributions, costs, and deployment thresholds. **NOT-DISCLOSED:** provider internals and operating details absent from inspected reports. Moving documentation is explicitly unpinned. This manuscript does not certify zero error, reproduce source benchmark tables, or present generated measurements as observed evidence.

