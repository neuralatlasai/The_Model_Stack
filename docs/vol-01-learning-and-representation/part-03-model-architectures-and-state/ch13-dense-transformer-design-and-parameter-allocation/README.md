---
id: ms.chapter.13
entity_type: chapter
title: Dense Transformer design and parameter allocation
short_title: Dense Transformer design
section: null
slug: ch13-dense-transformer-design-and-parameter-allocation
parent: ms.part.3
prev_sibling: null
next_sibling: ms.chapter.14
children: [ms.section.13.1, ms.section.13.2, ms.section.13.3, ms.section.13.4, ms.section.13.5, ms.section.13.6, ms.verification.13, ms.references.13]
prerequisites: [ms.chapter.5, ms.chapter.10]
downstream: [ms.chapter.14, ms.chapter.19, ms.chapter.21]
word_count_target: 1500
volume: 1
part: 3
chapter: 13
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [dense_architecture, parameter_allocation], feedback_setting: [], modality: [text]}
papers: [P01, P02]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core, impl.nvidia-transformer-engine]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

VOLUME I / PART III — MODEL ARCHITECTURES AND STATE / CHAPTER 13

# 13 — Dense Transformer design and parameter allocation

**DERIVED — thesis.** A dense architecture must be specified as both a parameter allocation and an operator graph, because equal parameter counts do not determine equal computation, state, optimization behavior, or task quality.

6 sections · 2 spine papers · 4 reference-stack implementations · prerequisites: 05, 10 · artifact: a parameter/FLOP model for a family of dense architectures · updated 2026-09-25

## Why this chapter exists

**DERIVED.** A parameter total discards the information needed to explain an architecture. It does not identify how often a matrix is used, which positions interact, how many layers execute sequentially, or where a vocabulary projection is evaluated. Two configurations can therefore share a parameter budget while placing different demands on activation memory, arithmetic, communication, and the critical path. A comparison that treats the total as the complete experimental control leaves those differences unresolved.

**DERIVED.** The bottleneck becomes visible when a design choice changes more than its advertised mechanism. Increasing width also enlarges embeddings and output projections. Replacing a two-matrix feed-forward branch with a gated branch changes the number of projections. Moving normalization changes Jacobian composition. A longer sequence changes the relative cost of attention and the vocabulary head. None of these consequences can be recovered from the checkpoint size alone.

**DERIVED.** The dominant constraint is preserving a consistent accounting boundary across architecture, workload, and execution. This chapter builds that boundary from unique parameter ownership, tensor shapes, operator multiplicity, and explicitly retained state. Closed-form calculations establish what follows from the design; proposed controlled experiments establish what must still be measured. The resulting artifact supports budget-specific architectural decisions without turning a convenient approximation into a universal performance claim.

## Concept map

**DERIVED — chapter accounting structure.**

~~~mermaid
flowchart TD
    A["[Process] Task contract"] --> B["[Model] Architectural family"]
    B --> C["[Tensor] Attention visibility"]
    B --> D["[Model] Depth and width"]
    D --> E["[Tensor] Head partition"]
    D --> F["[Process] Feed-forward branch"]
    D --> G["[Process] Normalization and residual"]
    B --> H["[Memory] Embeddings and output head"]
    E --> I["[Metric] Unique parameters"]
    F --> I
    G --> I
    H --> I
    C --> J["[Process] Operator ledger"]
    I --> J
    K["[Dataset] Workload contract"] --> J
    J --> L["[Metric] FLOPs by phase"]
    J --> M["[Memory] Live state"]
    L --> N["[Metric] Budget-specific comparison"]
    M --> N
    N --> O["[Process] Controlled ablation"]
~~~

Equivalent structure:

- The task contract selects an architectural family.
  - Attention visibility defines admissible dependencies.
  - Depth and width determine head partition, feed-forward dimensions, and normalization/residual structure.
  - Embeddings and the output head complete unique parameter ownership.
- The workload contract and architecture determine the operator ledger.
  - FLOPs by phase and live state describe different resource demands.
  - A budget-specific comparison defines a controlled ablation.

## Position in the book

| Relation | Canonical connection | Consequence here |
|---|---|---|
| Prerequisites | [Transformer primitives, Chapter 05](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/README.md); [Chapter 10 tokenization contract in the Part II index](../../part-02-data-and-representation-engineering/README.md) | Use existing attention, residual, and token-interface definitions |
| Siblings (same part) | [Part III map](../README.md) | Chapter 14 changes attention/state representation; later siblings change position handling, sparsity, and model families |
| Downstream | [Part IV: training science and adaptation](../../part-04-training-science-and-adaptation/README.md) | Chapters 19 and 21 require architecture-specific compute and ablation controls |
| Trades off with | [Width and depth, §13.2](13-2-width-depth-and-heads.md); [vocabulary allocation, §13.5](13-5-embeddings-and-heads.md); [comparison boundaries, §13.6](13-6-architectural-ablations.md) | Parameter, compute, memory, and latency budgets constrain different choices |

## Sections

| Section | Title | What changes here | Primary evidence labels |
|---|---|---|---|
| [13.1](13-1-architectural-families.md) | Architectural families | Visibility and task heads determine which operators execute | PAPER-REPORTED; MATHEMATICALLY-DERIVED |
| [13.2](13-2-width-depth-and-heads.md) | Width, depth, and heads | A scalar parameter budget becomes a shape-constrained allocation | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [13.3](13-3-feed-forward-alternatives.md) | Feed-forward alternatives | Gating changes projection count and intermediate-state requirements | PAPER-REPORTED; MATHEMATICALLY-DERIVED |
| [13.4](13-4-normalization-and-residuals.md) | Normalization and residuals | Placement and scaling change local derivatives and signal propagation | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [13.5](13-5-embeddings-and-heads.md) | Embeddings and heads | Shared weights and projected positions separate ownership from execution | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [13.6](13-6-architectural-ablations.md) | Architectural ablations | The comparison names its matched budget and exposes remaining differences | DERIVED; MATHEMATICALLY-DERIVED |

## Artifact

**DERIVED — proposed deliverable.** The **parameter/FLOP model for a family of dense architectures** is specified as a set of auditable records, with complete fields in [verification.md](verification.md):

1. **Architecture specification:** family, layer counts, residual and attention widths, head partition, feed-forward map, normalization placement, vocabulary, sharing, biases, and task heads.
2. **Parameter inventory:** tensor shapes, unique ownership, aliases, trainability, and exact totals including small terms.
3. **Operator ledger:** shape, execution multiplicity, FLOP convention, phase, and excluded work for every counted operation.
4. **State ledger:** parameter, gradient, optimizer, activation, cache, and workspace categories with lifetimes and placement.
5. **Workload contract:** source and target lengths, projected positions, masks, batching, precision, and training or inference boundary.
6. **Comparison record:** matched quantities, tolerances, remaining differences, quality evaluation, latency boundary, and uncertainty.
7. **Evidence manifest:** primary sources, access dates, pinned implementation identities when available, and unresolved claims.

**DERIVED.** These are semantic records rather than a prescribed software format. Their purpose is to make every total reconstructible from dimensions and ownership. A table shared by lookup and projection appears once in the parameter inventory and twice in the relevant operator roles. A temporarily materialized tensor appears in the state ledger with its lifetime; its bytes are not silently added to a persistent-state total.

**DERIVED.** The artifact separates forward arithmetic from training-step arithmetic and separates logical attention pairs from executed matrix products. Its accuracy depends on those boundaries. An implementation can avoid storing a full score matrix without changing the mathematical attention definition, while padding or recomputation can add executed work absent from a logical count. These differences become explicit adjustments to the ledger.

## Verification

**PROPOSAL.** Reconstruct exact parameter totals from an independent tensor inventory, then use the fixtures in [verification.md](verification.md) to falsify incomplete accounting. In particular, hold all ordinary multi-head-attention projection shapes fixed while changing the head partition: total parameters remain fixed, but an explicitly materialized score tensor changes size. Separately compare body-matched depth–width pairs and show the unequal embedding totals and sequence-dependent FLOP difference. A valid report must explain both results and must not claim measured latency from either derivation.

## Lineage

**KNOWN — dated research identity.** Dates below identify the cited work's first preprint or publication year, as specified in [references.md](references.md); they are not dates at which the mechanism became universally adopted.

- **2016 · Layer Normalization · conceptual ancestor.** [R13.4](references.md#r134) supplies the centered normalization mechanism.
- **2016 · Using the Output Embedding to Improve Language Models · alternative branch.** [R13.18](references.md#r1318) studies sharing between input and output embeddings.
- **2017 · Attention Is All You Need · conceptual ancestor.** [P01](references.md#p01) anchors the dense encoder–decoder architecture.
- **2019 · Root Mean Square Layer Normalization · alternative branch.** [R13.5](references.md#r135) removes centering from the normalization map.
- **2020 · GLU Variants Improve Transformer · alternative branch.** [R13.2](references.md#r132) studies gated feed-forward maps.
- **2020 · On Layer Normalization in the Transformer Architecture · conceptual ancestor.** [R13.6](references.md#r136) connects placement to initialization behavior.
- **2022 · DeepNet · alternative branch.** [R13.17](references.md#r1317) couples residual modification to initialization.
- **2025 · Transformers without Normalization · alternative branch.** [R13.16](references.md#r1316) reports a Dynamic Tanh replacement in its tested settings.

~~~figure
id: fig-13.1
kind: lineage
title: Dense architecture branches
caption: Dated mechanisms supply alternatives and analysis tools; the sequence does not rank their quality or imply that a later work supersedes every earlier design.
placement: inline
evidence: KNOWN
source: [R13.4, P01, R13.5, R13.2, R13.17, R13.16]
alt: LayerNorm in 2016 and the Transformer in 2017 precede RMSNorm in 2019, GLU variants in 2020, DeepNet in 2022, and Dynamic Tanh in 2025.
spec:
  entries:
    - {year: 2016, work: Layer Normalization, cite: R13.4, relation: conceptual ancestor}
    - {year: 2017, work: Transformer, cite: P01, relation: conceptual ancestor}
    - {year: 2019, work: RMSNorm, cite: R13.5, relation: alternative branch}
    - {year: 2020, work: GLU variants, cite: R13.2, relation: alternative branch}
    - {year: 2022, work: DeepNet, cite: R13.17, relation: alternative branch}
    - {year: 2025, work: Dynamic Tanh, cite: R13.16, relation: alternative branch}
~~~

~~~figure
id: fig-13.2
kind: diagram
title: Ownership and execution are separate ledgers
caption: Eq. 13.4 counts unique parameters. FLOPs require operator uses and workload dimensions; live memory additionally requires lifetimes and an execution policy.
placement: inline
evidence: DERIVED
source: [DERIVED:eq-13.4, DERIVED:eq-13.5, DERIVED:eq-13.15]
alt: Tensor shapes feed unique parameter ownership and operator uses. Workload dimensions join operator uses to determine FLOPs and live state.
spec:
  direction: LR
  nodes:
    - {id: shape, kind: tensor, label: tensor shapes}
    - {id: owner, kind: memory, label: unique ownership}
    - {id: uses, kind: process, label: operator uses}
    - {id: workload, kind: dataset, label: workload}
    - {id: arithmetic, kind: metric, label: FLOPs}
    - {id: policy, kind: process, label: lifetimes and execution}
    - {id: live, kind: memory, label: live state}
  edges:
    - {from: shape, to: owner}
    - {from: shape, to: uses}
    - {from: workload, to: uses}
    - {from: uses, to: arithmetic}
    - {from: uses, to: policy}
    - {from: policy, to: live}
~~~

## Terms owned here

**KNOWN — canonical ownership index.** Basic attention, feed-forward, and residual definitions remain in Chapter 05. The following accounting terms receive their operational definitions here.

| Term | Meaning | Owning section |
|---|---|---|
| Body parameter budget | Parameters allocated to block matrices, with embeddings and other terms listed separately | [§13.2](13-2-width-depth-and-heads.md#formulation) |
| Projection-matched feed-forward comparison | Equality of feed-forward projection parameters under explicitly chosen map shapes | [§13.3](13-3-feed-forward-alternatives.md#formulation) |
| Projected-position count | Number of positions at which a specified output projection actually executes | [§13.5](13-5-embeddings-and-heads.md#formulation) |
| Budget-conditioned architectural comparison | Comparison whose matched resource, tolerance, and residual differences are declared | [§13.6](13-6-architectural-ablations.md#formulation) |

## Reference-stack coverage

**KNOWN — routing.** Entry numbers identify positions in the supplied reference pack. Surface URLs below retain that pack's exact routes; the source register records the specific pages actually inspected.

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #14 NVIDIA Research | — | Official Megatron-Core and Transformer Engine repository routes | https://github.com/NVIDIA | 13.1–13.6 | OFFICIAL-DOCUMENTATION |
| §1 lab | #27 Hugging Face Research | — | Official model configuration and task-head documentation routes | https://github.com/huggingface | 13.1–13.3, 13.5 | OFFICIAL-DOCUMENTATION |
| §2 conference | #2 ICML | — | Archival normalization-placement analysis | https://proceedings.mlr.press/ | 13.4, 13.6 | PAPER-REPORTED |
| §3 discovery source | #1 arXiv | — | Transformer and mechanism papers with explicit publication dates | https://arxiv.org/ | 13.1–13.6 | PAPER-REPORTED |
| §3 discovery source | #3 PMLR | — | Xiong et al. proceedings identity | https://proceedings.mlr.press/ | 13.4, 13.6 | PAPER-REPORTED |
| §3 discovery source | #5 ACL Anthology | — | Archival BERT identity | https://aclanthology.org/ | 13.1 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Normalization, activation and attention interface semantics | https://pytorch.org/docs/stable/ | 13.1, 13.3, 13.4, 13.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #26 Hugging Face Transformers | Model definition / adaptation | BERT task heads and Llama configuration surfaces | https://huggingface.co/docs/transformers/ | 13.1–13.3, 13.5 | OFFICIAL-DOCUMENTATION |
| §4 system | #23 NVIDIA Megatron-Core | Distributed training | Tensor-parallel layer and vocabulary partitioning documentation | https://docs.nvidia.com/megatron-core/index.html | 13.1, 13.2, 13.5 | OFFICIAL-DOCUMENTATION |
| §4 system | #7 NVIDIA Transformer Engine | Kernels / numerics / collectives | Layer integration surface through official repository fallback | https://docs.nvidia.com/deeplearning/transformer-engine/ | 13.3–13.6 | OFFICIAL-DOCUMENTATION |
| Outside the reference stack (routed via book_plan.md anchors) | Stanford CS336 | Plan-anchored course | Chapter 13 explicitly names CS336; Spring 2026 model, systems, and scaling curriculum | https://cs336.stanford.edu/ | 13.2, 13.6 | OFFICIAL-DOCUMENTATION |

**DERIVED — Inspection dimensions applied.** **Parallelism** and **Communication** enter through shape divisibility and vocabulary partitioning (§§13.2, 13.5). **Precision**, **Memory**, and **Kernels** constrain activation, normalization, and attention accounting (§§13.2–13.5). **Checkpointing** enters through recomputation cost and tied-parameter ownership (§§13.5–13.6). **Inference** separates prefill, decode, and projected positions. **Metrics**, **Reliability**, and **Reproducibility** govern the ablation and verification protocol. **Post-training** is limited to the implications of changing or adding a task head; optimizer recipes are owned downstream.

## Source route

**KNOWN — required search order.** Follow the pack's §1.1 official-source route, §2.1 archival venue workflow, §3.1 paper-to-code cascade, and §4.3 official documentation and compatibility checks. Filled-in queries include:

~~~text
site:arxiv.org/abs "GLU Variants Improve Transformer"
site:proceedings.mlr.press "Layer Normalization" "ICML"
"NVIDIA Megatron-Core" official documentation distributed training
site:github.com "NVIDIA Transformer Engine" (architecture OR design OR RFC OR benchmark)
site:github.com "Hugging Face Transformers" (OOM OR deadlock OR NCCL OR RCCL OR checkpoint OR hang)
~~~

**KNOWN — evidence discipline.** Search results locate candidate sources; attribution depends on opening the primary page. Historical research is retained when it establishes the mechanism. Current documentation is inspected for interfaces that can change. The 2026 edition does not convert an older architectural default into a present-day universal rule, and it does not call a recent paper superior merely because it is recent.

## Status

**KNOWN.** Manuscript draft with six sections, a parameter/FLOP artifact specification, a falsifiable verification protocol, a typed source register, and chapter-local visual instruments. Exposition and worked derivations are original. Experiments are proposals; illustrative numerical examples are not training or deployment measurements.

**UNVERIFIED.** Exact runtime compatibility, moving-repository commits, selected kernel traces, measured resource use, quality improvements, and the proposed experiments remain unresolved. **NOT-DISCLOSED.** No public source inspected here supplies an architecture-independent latency or energy function. Those quantities require the declared execution and measurement context.
