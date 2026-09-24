---
id: ms.chapter.14
entity_type: chapter
title: Attention architectures and cache representations
short_title: Attention and cache representations
section: null
slug: ch14-attention-architectures-and-cache-representations
parent: ms.part.3
prev_sibling: ms.chapter.13
next_sibling: ms.chapter.15
children: [ms.section.14.1, ms.section.14.2, ms.section.14.3, ms.section.14.4, ms.section.14.5, ms.section.14.6, ms.verification.14, ms.references.14]
prerequisites: [ms.chapter.5, ms.chapter.13]
downstream: [ms.chapter.15, ms.chapter.27, ms.chapter.42]
word_count_target: 1500
volume: 1
part: 3
chapter: 14
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [attention, cache_representation], feedback_setting: [], modality: [text, image, audio, video]}
papers: [P13, P19, P20]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

VOLUME I / PART III — MODEL ARCHITECTURES AND STATE / CHAPTER 14

# 14 — Attention architectures and cache representations

**DERIVED — thesis.** An attention architecture determines which information can be accessed and represented, while its cache and execution contracts determine what must be stored, transferred and recomputed.

6 sections · 3 spine papers · 3 reference-stack systems plus plan-anchored FlashMLA · prerequisites: 05, 13 · artifact: an attention-family comparison with explicit cached state · updated 2026-09-25

## Why this chapter exists

**DERIVED.** Parameter accounting cannot explain an attention system's recurrent state. A model can keep the same weights while its cache grows with sequence length, changes dtype, moves between devices or acquires page-allocation slack. Two implementations of one architecture can retain different physical tensors. Two architectures with similar stored bytes can preserve different information paths. Treating all these differences as an undifferentiated “attention optimization” makes both correctness and resource claims difficult to audit.

**DERIVED.** The bottleneck changes across phases. Training evaluates many query/key interactions and retains or reconstructs activations for gradients. Prefill builds representations and cache state. Decode revisits retained history while producing new queries. Source-conditioned decoding can reuse fixed projections across multiple continuations. An improvement at one boundary need not improve another, and a smaller mathematical state does not automatically imply proportionally fewer memory transfers.

**DERIVED.** The dominant constraint is keeping the model's information contract aligned with its physical representation. This chapter separates KV-head sharing, latent compression, sparse visibility, source-state reuse, numerical approximation and IO-aware scheduling. Each mechanism receives a stated tensor layout and a verification boundary. The solution is a comparison record that can reconstruct bytes from retained tensors, distinguish architectural changes from equivalent execution, and require task evidence before claiming that resource savings preserve useful behavior.

## Concept map

**DERIVED — information and state accounting.**

~~~mermaid
flowchart TD
    A["[Objective] Task evidence requirement"] --> B["[Model] Attention contract"]
    B --> C["[Tensor] Query and KV head map"]
    B --> D["[Tensor] Latent and positional state"]
    B --> E["[Dependency] Sparse coverage"]
    B --> F["[Dataset] Conditioning source"]
    C --> G["[Memory] Logical retained state"]
    D --> G
    E --> G
    F --> H["[State] Source cache lifetime"]
    H --> G
    G --> I["[Memory] Physical allocation"]
    I --> J["[Flow] Executed transfers"]
    B --> K["[Process] Exactness and precision"]
    K --> L["[Process] Prefill and decode execution"]
    J --> L
    L --> M["[Metric] Resource measurements"]
    A --> N["[Metric] Independent task evaluation"]
    M --> O["[Objective] Admissible comparison"]
    N --> O
~~~

Equivalent structure:

- Task evidence requirements constrain the attention contract.
  - The query/KV head map and latent/positional representation determine state per position.
  - Sparse coverage determines permitted reads and future retention obligations.
  - Conditioning sources introduce separate cache lifetimes.
- Logical retained state maps to physical allocation and executed transfers.
  - Exactness and precision constrain prefill and decode execution.
  - Resource measurements and independent task evaluation jointly determine admissible comparisons.

## Position in the book

| Relation | Canonical connection | Consequence here |
|---|---|---|
| Prerequisites | [Chapter 05 primitives](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/README.md); [Chapter 13 allocation](../ch13-dense-transformer-design-and-parameter-allocation/README.md) | Use existing attention equations and architecture accounting |
| Siblings (same part) | [Part III map](../README.md) | Chapter 15 owns position and effective context; later siblings cover other state-bearing architectures |
| Downstream | [Part V kernel map](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/README.md); [atlas chapter index](../../../README.md) | Chapter 27 realizes attention kernels; Chapter 42 manages cache state |
| Trades off with | [Latent layout, §14.2](14-2-latent-attention.md); [coverage, §14.3](14-3-sparse-and-local-attention.md); [quality/state, §14.6](14-6-quality-state-tradeoffs.md) | Representation, visibility, numerical fidelity and execution have different costs |

## Sections

| Section | Title | What changes here | Primary evidence labels |
|---|---|---|---|
| [14.1](14-1-mha-mqa-and-gqa.md) | MHA, MQA, and GQA | Query-specific distributions share a declared number of KV projections | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [14.2](14-2-latent-attention.md) | Latent attention | Retained latent and positional state replace explicit expanded heads under a specified computation | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [14.3](14-3-sparse-and-local-attention.md) | Sparse and local attention | Selected reads are separated from future retention obligations | DERIVED; PAPER-REPORTED |
| [14.4](14-4-cross-attention.md) | Cross-attention | Source-state identity and lifetime differ from target histories | MATHEMATICALLY-DERIVED; DERIVED |
| [14.5](14-5-exact-versus-approximate-computation.md) | Exact versus approximate computation | Mathematical equivalence is separated from mask and numerical conventions | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [14.6](14-6-quality-state-tradeoffs.md) | Quality–state tradeoffs | Resource accounting becomes conditional on independently evaluated task behavior | DERIVED; MATHEMATICALLY-DERIVED |

## Artifact

**DERIVED — proposed deliverable.** The **attention-family comparison with explicit cached state** consists of seven records:

1. **Attention specification:** query/KV heads, dimensions, projection ownership, visibility, positions, score scale and output transformation.
2. **Persistent-state inventory:** tensor role, logical shape, dtype, unique owner, aliases, source dependencies and lifetime.
3. **Physical-layout inventory:** strides, packed values, scales, page size, padding, replicas, pool reserve and temporary conversion buffers.
4. **Execution record:** training/prefill/decode phase, query and key lengths, selected positions, operator multiplicity and transfer boundary.
5. **Equivalence record:** independent reference, fixtures, mask semantics, score transformations, dtype, numerical tolerance and negative controls.
6. **Quality/workload record:** task construction, source revisions, context distribution, output budget, evaluator, seeds and tuning controls.
7. **Evidence record:** source keys, inspected pages, access dates, implementation revisions when available and unresolved claims.

**DERIVED.** The artifact is specified in [verification.md](verification.md); these are semantic fields rather than a mandated serialization format. Each comparison must reconstruct its own state. A latent cache is not assigned the MHA equation with a guessed multiplier. A sparse-read implementation is not assigned a window-limited retention formula unless its future coverage justifies eviction.

**DERIVED.** Tensor ownership is central. Multiple names can refer to one allocation, several requests can reference one immutable source, and several devices can hold replicas of one logical KV head. Conversely, packing components into a single tensor does not eliminate their distinct numerical roles. The inventory preserves these distinctions before calculating aggregate bytes.

## Verification

**PROPOSAL.** Derive MHA, MQA and GQA storage from explicit K/V shapes, then derive one latent implementation separately from its retained latent, positional and metadata tensors. Reconcile these predictions with unique allocated storage under a pinned future execution, including pages, aliases and replicas. Use independent expanded/absorbed attention, tile-merge and rectangular-mask fixtures to verify semantics. Deliberately incomplete ledgers must fail. Mathematical capacities in this manuscript are worked examples; GPU allocation validation and task experiments remain proposed.

## Lineage

**KNOWN — dated source identity.** Years identify the cited research record, not a claim of universal adoption or superiority.

- **2019 · Multi-query attention · alternative branch.** [R14.1](references.md#r141) supplies shared KV projections.
- **2020 · Longformer · alternative branch.** [R14.3](references.md#r143) supplies local/global attention motivation.
- **2022 · FlashAttention · engineering optimization.** [P19](references.md#p19) supplies the IO-aware execution anchor.
- **2023 · GQA · alternative branch.** [R14.2](references.md#r142) studies intermediate KV grouping.
- **2024 · DeepSeek-V3 Technical Report · conceptual ancestor.** [P13](references.md#p13), revised in 2025, documents the MLA construction used here.
- **2025 · Native Sparse Attention · alternative branch.** [R14.4](references.md#r144) connects sparse selection with native training.
- **2026 · FlashAttention-4 · engineering optimization.** [P20](references.md#p20) extends the execution discussion to contemporary hardware and numerical choices.

~~~figure
id: fig-14.1
kind: lineage
title: Attention representation and execution branches
caption: The dated works change different axes. A later entry does not imply that earlier architectures or kernels are universally superseded.
placement: inline
evidence: KNOWN
source: [R14.1, R14.3, P19, R14.2, P13, R14.4, P20]
alt: MQA in 2019, Longformer in 2020, FlashAttention in 2022, GQA in 2023, DeepSeek-V3 in 2024, Native Sparse Attention in 2025, and FlashAttention-4 in 2026 anchor distinct design axes.
spec:
  entries:
    - {year: 2019, work: Multi-query attention, cite: R14.1, relation: alternative branch}
    - {year: 2020, work: Longformer, cite: R14.3, relation: alternative branch}
    - {year: 2022, work: FlashAttention, cite: P19, relation: engineering optimization}
    - {year: 2023, work: GQA, cite: R14.2, relation: alternative branch}
    - {year: 2024, work: DeepSeek-V3 report, cite: P13, relation: conceptual ancestor}
    - {year: 2025, work: Native Sparse Attention, cite: R14.4, relation: alternative branch}
    - {year: 2026, work: FlashAttention-4, cite: P20, relation: engineering optimization}
~~~

~~~figure
id: fig-14.2
kind: diagram
title: Four boundaries of an attention claim
caption: A claim about state capacity does not establish traffic, numerical equivalence or task quality. The comparison must retain each boundary.
placement: inline
evidence: DERIVED
source: [DERIVED:eq-14.3, DERIVED:eq-14.17, DERIVED:eq-14.21]
alt: An attention contract produces a state ledger and an equivalence test. Execution measurements and independent task evidence are both required for a useful comparison.
spec:
  direction: LR
  nodes:
    - {id: contract, kind: model, label: attention contract}
    - {id: state, kind: memory, label: stored tensors}
    - {id: exact, kind: process, label: equivalence audit}
    - {id: runtime, kind: metric, label: executed resource cost}
    - {id: task, kind: objective, label: task evidence}
    - {id: report, kind: dataset, label: comparison record}
  edges:
    - {from: contract, to: state}
    - {from: contract, to: exact}
    - {from: state, to: runtime}
    - {from: exact, to: runtime}
    - {from: runtime, to: report}
    - {from: task, to: report}
~~~

## Terms owned here

**KNOWN — canonical ownership index.** The chapter owns the operational definitions below; core attention and residual primitives remain in Chapter 05.

| Term | Meaning | Owning section |
|---|---|---|
| KV-head sharing | Query heads share a declared key/value projection and cached representation | [§14.1](14-1-mha-mqa-and-gqa.md#intuition) |
| Latent KV state | Retained representation supporting the specified linear key/value reconstruction | [§14.2](14-2-latent-attention.md#intuition) |
| Attention coverage contract | Permitted reads and future retention obligations | [§14.3](14-3-sparse-and-local-attention.md#intuition) |
| Cross-attention cache validity | Equality of source-state dependencies and interpretation | [§14.4](14-4-cross-attention.md#intuition) |
| Attention equivalence contract | Mathematical semantics and numerical tolerance for execution comparison | [§14.5](14-5-exact-versus-approximate-computation.md#intuition) |
| Quality–state comparison contract | Task evidence bound to representation, state and workload | [§14.6](14-6-quality-state-tradeoffs.md#intuition) |

## Reference-stack coverage

**KNOWN — routing.** Entry numbers are positions in the supplied pack. Surface URLs preserve its canonical routes; [references.md](references.md) identifies the opened primary pages.

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #8 DeepSeek | — | MLA report, sparse-attention research and official FlashMLA route | https://github.com/deepseek-ai | 14.2, 14.3 | PAPER-REPORTED; OFFICIAL-DOCUMENTATION |
| §1 lab | #14 NVIDIA Research | — | Official RULER repository and paper route | https://github.com/NVIDIA | 14.6 | PAPER-REPORTED |
| §1 lab | #27 Hugging Face Research | — | Official cache-strategy documentation route | https://github.com/huggingface | 14.1, 14.3, 14.6 | OFFICIAL-DOCUMENTATION |
| §2 conference | #6 EMNLP | — | Archival GQA record | https://aclanthology.org/venues/emnlp/ | 14.1 | PAPER-REPORTED |
| §3 discovery source | #1 arXiv | — | Versioned primary mechanism and 2026 kernel papers | https://arxiv.org/ | 14.1–14.6 | PAPER-REPORTED |
| §3 discovery source | #5 ACL Anthology | — | GQA bibliographic identity | https://aclanthology.org/ | 14.1 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Attention interface, grouped-head constraints and rectangular mask semantics | https://pytorch.org/docs/stable/ | 14.1, 14.4, 14.5 | OFFICIAL-DOCUMENTATION |
| §4 system | #26 Hugging Face Transformers | Model definition / adaptation | Cache strategies and window-limited state | https://huggingface.co/docs/transformers/ | 14.1, 14.3, 14.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #39 FlashAttention | Kernels / numerics / collectives | Grouped heads, local windows and cache-mask conventions | https://github.com/Dao-AILab/flash-attention | 14.1, 14.3, 14.5 | OFFICIAL-DOCUMENTATION |
| Outside the reference stack (routed via book_plan.md anchors) | FlashMLA | Kernels / numerics / collectives | Explicit Chapter 27 and Appendix B implementation anchor; official DeepSeek repository supplies one inspected layout | https://github.com/deepseek-ai/FlashMLA | 14.2 | OFFICIAL-DOCUMENTATION |

**DERIVED — Inspection dimensions applied.** **Parallelism** and **Communication** enter through replicas and source sharing. **Precision**, **Memory**, and **Kernels** enter through layouts, masks, quantization metadata and IO-aware execution. **Checkpointing** concerns state reconstruction and retained activation boundaries, not a complete trainer protocol. **Inference** separates prefill, decode and source reuse. **Metrics**, **Reliability**, and **Reproducibility** govern allocation and task audits. **Post-training** is limited to the distinction between architecture conversion and subsequent adaptation; recipes are owned downstream.

## Source route

**KNOWN — search protocol.** Use §1.1's official lab routes, §2.1's archival venue workflow, §3.1's paper-to-code cascade and §4.3's official documentation inspection. Concrete queries include:

~~~text
site:arxiv.org/abs "DeepSeek" "sparse attention"
site:aclanthology.org "EMNLP" "GQA"
site:arxiv.org/abs "FlashAttention-4"
"PyTorch" official documentation distributed training
site:github.com "FlashAttention" (architecture OR design OR RFC OR benchmark)
~~~

**KNOWN — inspection discipline.** Search results are discovery aids; the source register lists pages actually opened. Moving documentation is marked unpinned. The 2026 edition checks present interfaces and includes verified contemporary research while retaining dated foundations. It does not promote historical defaults, repository labels or isolated performance claims into architecture-wide guarantees.

## Status

**KNOWN.** Manuscript draft with six complete sections, chapter-local instruments, original derivations, an explicit cache-comparison artifact specification, and a verification protocol. All training, profiling and task evaluations are proposals.

**UNVERIFIED.** Allocated-tensor reconciliation on an accelerator, exact moving-repository commits, numerical/backend compatibility and realized quality/latency remain pending execution. **NOT-DISCLOSED.** No inspected source defines every deployment's physical cache layout or operational cost. The manuscript preserves these boundaries rather than filling them with inferred values.
