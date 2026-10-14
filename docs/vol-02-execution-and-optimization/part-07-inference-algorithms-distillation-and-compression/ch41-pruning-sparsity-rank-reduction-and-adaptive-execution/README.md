---
id: "ms.chapter.41"
entity_type: "chapter"
title: "Pruning, sparsity, rank reduction, and adaptive execution"
short_title: "Pruning and adaptive execution"
volume: 2
part: 7
chapter: 41
section: null
slug: "ch41-pruning-sparsity-rank-reduction-and-adaptive-execution"
parent: "ms.part.7"
prev_sibling: "ms.chapter.40"
next_sibling: "ms.chapter.42"
children: ["ms.section.41.1","ms.section.41.2","ms.section.41.3","ms.section.41.4","ms.section.41.5","ms.section.41.6","ms.verification.41","ms.references.41"]
prerequisites: ["ms.chapter.13","ms.chapter.14","ms.chapter.15","ms.chapter.16","ms.chapter.17","ms.chapter.25","ms.chapter.26","ms.chapter.27","ms.chapter.28","ms.chapter.39","ms.chapter.40"]
downstream: ["ms.chapter.42","ms.chapter.43","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference","adaptation"],"mechanism":["pruning","sparsity","adaptive_computation"],"feedback_setting":[],"modality":["text","image"]}
papers: []
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.nvidia-cutlass","impl.nvidia-cuda"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 1500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

VOLUME II / PART VII — INFERENCE ALGORITHMS, DISTILLATION, AND COMPRESSION / CHAPTER 41

# 41 — Pruning, sparsity, rank reduction, and adaptive execution

[DERIVED] Compression becomes an engineering benefit only when a justified reduction in capacity survives recovery, representation, kernel, quality, and amortization constraints.

6 sections · 0 spine papers · 4 reference-stack implementations · prerequisites: 13–17, 25–28, 39–40 · artifact: an executable compression comparison (planned) · updated 2026-10-14

## Why this chapter exists

[MATHEMATICALLY-DERIVED] The failure preceding executable compression is a mismatch between what is counted and what is performed. A numerical zero is not a missing stored value; a missing stored value is not an avoided multiply; an avoided multiply is not necessarily a shorter request. The representation, operator, workload, and accepted quality determine which savings survive. This distinction is decisive when comparing irregular masks, hardware-constrained support, smaller dense matrices, and input-dependent paths.

[PAPER-REPORTED] SparseGPT and Wanda show that data-aware selection can produce useful one-shot sparse checkpoints in their studied model families [R41.1](references.md), §4; [R41.2](references.md), §4. Later approaches change the constraint rather than merely improve a score: SliceGPT rotates and slices dense representations, Puzzle searches under hardware resource constraints, PATCH selects dense versus 2:4 tiles, and the 2026 MoE coverage method allocates aligned per-expert channels [R41.4](references.md), §3; [R41.8](references.md), §4; [R41.10](references.md), §§3–4; [R41.15](references.md), §4.

[DERIVED] The dominant decision is therefore a joint statistical and systems choice. A selection rule defines a surrogate loss; a recovery budget changes the resulting model; an export defines its physical representation; a backend determines the work actually executed. Their interactions must be analyzed before declaring a smaller checkpoint preferable. This chapter reconstructs those interactions with explicit mathematical conditions, source-reported protocols, and bounded execution contracts. It preserves useful historical mechanisms while checking 2025–2026 developments, and records missing evidence instead of filling undocumented details. The proposed executable comparison remains separate from the manuscripts' reported source results.

## Concept map

~~~mermaid
flowchart TB
    A["[Model] Parent checkpoint"] --> B["[Branch] Support family"]
    B --> C["[Tensor] Unstructured or block mask"]
    B --> D["[Tensor] N:M mask"]
    B --> E["[Process] Structural extraction"]
    B --> F["[Process] Adaptive policy"]
    G["[Dataset] Calibration inputs"] --> H["[Objective] Selection surrogate"]
    H --> C
    H --> D
    H --> E
    E --> I["[Tensor] Reduced width depth or rank"]
    F --> J["[State] Causal cache contract"]
    C --> K["[Process] Optional recovery"]
    D --> K
    I --> K
    K --> L["[Memory] Payload and metadata"]
    L --> M["[Hardware] Supported kernel"]
    J --> M
    M --> N["[Metric] Accepted quality and resource cost"]
    N --> O["[Feedback] Revise or accept"]
    O --> B
~~~

Text equivalent:

- Parent checkpoint branches into a support family.
  - Unstructured/block masks and N:M masks use calibration-driven selection.
  - Structural extraction produces reduced width, depth, or rank.
  - Adaptive policy requires a causal cache contract.
- Calibration inputs determine a selection surrogate.
- Optional recovery produces payload and metadata.
- A supported kernel consumes the representation or adaptive state.
- Accepted quality/resource evaluation feeds back to revision or acceptance.

## Position in the book

| Relation | Location and boundary |
|---|---|
| Prerequisites | [Shared notation](../../../front-matter/notation.md); architecture mechanisms in Chapters13–17; physical execution in Chapters25–28; [distillation](../ch39-knowledge-response-and-policy-distillation/README.md) and [quantization](../ch40-quantization-from-numerical-model-to-deployable-artifact/README.md). |
| Siblings (same part) | [Decoding/speculation](../ch37-decoding-constrained-generation-and-speculative-execution/README.md), [inference-time search](../ch38-inference-time-reasoning-search-and-adaptive-compute/README.md), [distillation](../ch39-knowledge-response-and-policy-distillation/README.md), [quantization](../ch40-quantization-from-numerical-model-to-deployable-artifact/README.md). |
| Downstream | [Inference state/resource models](../ch42-prefill-decode-kv-state-and-inference-resource-models/README.md); engine/serving integration in PartVIII. |
| Trades off with | [Recovery information access](../ch39-knowledge-response-and-policy-distillation/39-2-information-access.md), [quantized artifact interfaces](../ch40-quantization-from-numerical-model-to-deployable-artifact/40-5-artifact-runtime-interfaces.md), and [KV accounting](../ch42-prefill-decode-kv-state-and-inference-resource-models/42-2-state-accounting.md). |

## Sections

| Section | Title | What changes here | Primary evidence |
|---|---|---|---|
| [41.1](41-1-sparsity-taxonomy.md) | Sparsity taxonomy | Separate support freedom, encoded bytes, and skipped operators | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [41.2](41-2-selection-criteria.md) | Selection criteria | Specify the counterfactual loss estimated by saliency | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [41.3](41-3-structural-reduction.md) | Structural reduction | Close dependencies and extract executable dimensions/ranks | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [41.4](41-4-recovery.md) | Recovery | Optimize inside retained capacity and charge teacher/student costs | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [41.5](41-5-adaptive-computation.md) | Adaptive computation | Allocate work with causal state and calibrated risk | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [41.6](41-6-hardware-realization.md) | Hardware realization | Test support, overhead, and accepted-task amortization | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |

## Artifact

[DERIVED] The planned deliverable is an **executable compression comparison**, specified rather than executed in this edition. It comprises artifact manifests, support/shape maps, calibration and recovery ledgers, numerical checks, quality records, dispatch traces, latency samples, memory attribution, energy traces, and an accepted-task cost table. [verification.md](verification.md) defines fields and falsifiable acceptance rules. These records keep a zeroed dense baseline distinct from packed sparse and structurally extracted variants. Each stage retains the immutable parent and transformation provenance so a rejected candidate can be rolled back without guessing how it was constructed.

## Verification

[DERIVED] The central task is to determine whether fewer logical operations translate to wall-clock and energy gains under a declared quality bound and actually supported kernels. The comparison includes masked dense execution and explicit fallback as controls. A negative result is informative: acceptable quality with no E2E improvement rejects a speed claim at that workload; lower latency with unchanged or greater energy rejects an energy claim. Recovery/search costs are charged separately before amortization. The unexecuted protocol and topic audit are in [verification.md](verification.md).

## Lineage

- 2023 · SparseGPT · conceptual ancestor — local curvature compensation [R41.1](references.md).
- 2023 · Wanda · alternative branch — activation-weighted selection without reconstruction [R41.2](references.md).
- 2024 · SliceGPT · alternative branch — rotated dense extraction [R41.4](references.md).
- 2024 · Minitron · engineering optimization — structured pruning and recovery [R41.6](references.md).
- 2025 · SVD-LLM v5 · engineering optimization — sequential factor-wise recovery, distinct from v3's closed-form update [R41.5](references.md).
- 2025 · Puzzle · engineering optimization — deployment-constrained block selection [R41.8](references.md).
- 2025 · PATCH · current frontier — hybrid support and source-specific kernels [R41.10](references.md).
- 2026 · Attribution/coverage MoE pruning · current frontier — expert channels and alignment [R41.15](references.md).

```figure
{
  "id": "fig-41.1",
  "kind": "lineage",
  "title": "From masks to deployment-constrained models",
  "caption": "The lineage changes selection information, graph structure, recovery, and execution constraints. Dates identify works, not a ranking of methods.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": [
    "R41.1",
    "R41.2",
    "R41.4",
    "R41.8",
    "R41.10",
    "R41.15"
  ],
  "alt": "SparseGPT and Wanda establish contrasting one-shot selection. SliceGPT changes dense dimensions; Puzzle searches deployment constraints; PATCH and coverage-based MoE pruning address executable patterns and aligned channels.",
  "spec": {
    "entries": [
      {
        "year": 2023,
        "work": "SparseGPT",
        "cite": "R41.1",
        "relation": "conceptual ancestor"
      },
      {
        "year": 2023,
        "work": "Wanda",
        "cite": "R41.2",
        "relation": "alternative branch"
      },
      {
        "year": 2024,
        "work": "SliceGPT",
        "cite": "R41.4",
        "relation": "alternative branch"
      },
      {
        "year": 2025,
        "work": "Puzzle",
        "cite": "R41.8",
        "relation": "engineering optimization"
      },
      {
        "year": 2025,
        "work": "PATCH",
        "cite": "R41.10",
        "relation": "current frontier"
      },
      {
        "year": 2026,
        "work": "Attribution and coverage MoE pruning",
        "cite": "R41.15",
        "relation": "current frontier"
      }
    ]
  }
}
```


## Terms owned here

| Term | Canonical meaning | Owner |
|---|---|---|
| Executable sparsity | Zero contributions omitted by actual operators for a declared workload | [41.1](41-1-sparsity-taxonomy.md) |
| Storage sparsity | Zero payload omitted with reconstructible positional information | [41.1](41-1-sparsity-taxonomy.md) |
| N:M sparsity | At most N retained entries in each specified consecutive group of M along a declared axis | [41.1](41-1-sparsity-taxonomy.md) |
| Pruning saliency | Objective- and distribution-specific estimate of deletion damage | [41.2](41-2-selection-criteria.md) |
| Structural pruning | Coupled graph/tensor reduction deleting executable dimensions or blocks | [41.3](41-3-structural-reduction.md) |
| Compression recovery | Constrained optimization of a selected compressed model | [41.4](41-4-recovery.md) |
| Early exit | Ending a token's internal computation before full model depth | [41.5](41-5-adaptive-computation.md) |

## Reference-stack coverage

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #14 NVIDIA Research | — | Originating Minitron/Puzzle/MaskLLM work | https://research.nvidia.com/publications | 41.1–41.4, 41.6 | PAPER-REPORTED |
| §1 lab | #4 Meta AI / FAIR | — | Wanda and LayerSkip | https://ai.meta.com/research/ | 41.2, 41.5 | PAPER-REPORTED |
| §1 lab | #13 Microsoft Research / Microsoft AI | — | SliceGPT | https://www.microsoft.com/research/publications/ | 41.3–41.4 | PAPER-REPORTED |
| §1 lab | #3 Google DeepMind | — | Mixture-of-Depths routing | https://deepmind.google/research/publications/ | 41.5 | PAPER-REPORTED |
| §1 lab | #18 Google Research | — | CALM quality-aware exits | https://research.google/pubs/ | 41.5 | PAPER-REPORTED |
| §2 conference | #2 ICML | — | SparseGPT/Puzzle and 2026 MoE provenance | https://proceedings.mlr.press/ | 41.2–41.4, 41.6 | PAPER-REPORTED |
| §2 conference | #3 ICLR | — | Wanda/SliceGPT/SVD-LLM venue route | https://openreview.net/group?id=ICLR.cc/2026/Conference | 41.2–41.4 | PAPER-REPORTED |
| §2 conference | #1 NeurIPS | — | LLM-Pruner/MaskLLM/CALM/DynamicViT lineage | https://proceedings.neurips.cc/ | 41.1–41.5 | PAPER-REPORTED |
| §3 discovery source | #1 arXiv | — | Versioned full primary texts including 2025–2026 | https://arxiv.org/ | All | PAPER-REPORTED |
| §3 discovery source | #2 OpenReview | — | Wanda and Puzzle PDFs | https://openreview.net/ | 41.2–41.4 | PAPER-REPORTED |
| §3 discovery source | #3 PMLR | — | Archival SparseGPT and 2026 identity | https://proceedings.mlr.press/ | 41.2–41.3 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Sparse conversion and local operator substrate | https://pytorch.org/docs/stable/ | All | OFFICIAL-DOCUMENTATION |
| §4 system | #26 Hugging Face Transformers | Model definition / adaptation | Source implementation family; no executed release claim | https://huggingface.co/docs/transformers/ | 41.2–41.5 | PAPER-REPORTED |
| §4 system | #1 NVIDIA CUDA | Accelerator / driver / compiler | cuSPARSELt execution boundary | https://docs.nvidia.com/cuda/ | 41.1, 41.5–41.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #5 NVIDIA CUTLASS | Kernels / numerics / collectives | Dtype/layout/architecture-specific sparse operators | https://github.com/NVIDIA/cutlass | 41.3, 41.6 | OFFICIAL-DOCUMENTATION |
| Outside the reference stack (routed via book_plan.md anchors) | NVIDIA Model Optimizer | Model definition / adaptation | Explicit Chapter41 anchor: pruning/export states [R41.16–17, R41.21](references.md) | https://github.com/NVIDIA/Model-Optimizer | 41.1, 41.3–41.4 | OFFICIAL-DOCUMENTATION |
| Outside the reference stack (routed via book_plan.md anchors) | Method-specific academic implementations | — | Mandatory method-specific sources: SVD-LLM, DynamicViT, PATCH/STOICC and 2026 coverage method | URLs in [references.md](references.md) | 41.3–41.6 | PAPER-REPORTED |

[DERIVED] Surface URLs preserve the reference stack's canonical entry points; exact inspected downstream primary texts are recorded in references. Conference and discovery entries identify retrieval/provenance routes and do not establish a mechanism without its full primary text.

**Inspection dimensions applied.** Parallelism and Communication: partitions and score aggregation (§§41.2–41.3, 41.5–41.6). Precision and Kernels: moments, factors, quantization and support (§§41.2–41.4, 41.6). Memory: payload/indices, curvature, factor intermediates and state (all sections). Checkpointing and Reliability: metadata, parent preservation, bounded fallback (§§41.1, 41.3–41.6). Post-training: recovery (§41.4). Inference and Metrics: causal paths and quality/time/energy boundaries (§§41.5–41.6). Reproducibility: revisions, missing commits, and a separate proposed protocol (all sections).

## Source route

[KNOWN] The reference-stack protocols control retrieval: official research index → publication index → primary revision → official code → independent measurement → bibliographic cross-check (§1.1); topic → proceedings → exact paper → supplement/code → lab → citations (§2.1); arXiv/OpenReview → proceedings → scholarly identity → GitHub/model artifacts → first-party context (§3.1). Systems inspection follows official documentation, architecture, performance, compatibility, and failure paths (§4.3). Discovery routes never establish a result by themselves.

Concrete queries for repeatable retrieval:

- site:research.nvidia.com/publications "pruning" "Minitron"
- site:arxiv.org/abs "Google DeepMind" "Mixture-of-Depths"
- site:proceedings.mlr.press "pruning" "2026"
- site:openreview.net "SVD-LLM" "ICLR"
- "NVIDIA Model Optimizer" official documentation pruning
- site:github.com "NVIDIA CUTLASS" (architecture OR benchmark OR OOM)

## Status

[DERIVED] **Manuscript draft.** All planned rows have substantive treatment, mathematical procedures, figures, source-reported experiments, four-part observations, and a topic audit. This is not scientific-review approval or independently reproduced performance. The inspected frontier includes 2025–2026 work and is not an exhaustive literature census.

[NOT-DISCLOSED] Some reported deployment contexts and recovery data details remain incomplete. [UNVERIFIED] Numerical/dispatch/energy execution and full-text ROSE/RobOP case studies are absent; these gaps constrain claims and preserve draft status.

> **Open question.** [DERIVED] Which calibration statistics predict task damage after interacting structural edits? · *what evidence would settle it:* independent matched-budget multi-edit ablations across held-out domains with downstream-sensitive predictors.

> **Open question.** [DERIVED] Can adaptive depth preserve causal long-context state with bounded repair cost and calibrated quality under workload drift? · *what evidence would settle it:* complete state-validity contracts, causal traces, independent shifted-domain calibration, and measured tail costs.

> **Open question.** [DERIVED] When do learned masks and recovery outperform smaller dense models after full construction energy and accepted-task economics? · *what evidence would settle it:* matched quality targets, reusable-parent accounting, exact dispatch, and integrated construction/deployment energy over a declared horizon.

```figure
{
  "id": "fig-41.2",
  "kind": "cycle",
  "title": "Compression artifact acceptance",
  "caption": "Selection and recovery produce a candidate. Quality and dispatch gates can reject it; acceptance retains an auditable artifact and a rollback parent.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-41.24",
  "alt": "Parent model enters selection, recovery, export, and validation. Failed quality or execution checks feed back to candidate selection; acceptance retains provenance and rollback.",
  "spec": {
    "stages": [
      {
        "id": "p",
        "kind": "model",
        "label": "parent artifact"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "selection and extraction"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "optional recovery"
      },
      {
        "id": "e",
        "kind": "state",
        "label": "exported candidate"
      },
      {
        "id": "v",
        "kind": "metric",
        "label": "quality and dispatch gates"
      },
      {
        "id": "a",
        "kind": "state",
        "label": "accepted artifact"
      }
    ],
    "edges": [
      {
        "from": "p",
        "to": "s"
      },
      {
        "from": "s",
        "to": "r"
      },
      {
        "from": "r",
        "to": "e"
      },
      {
        "from": "e",
        "to": "v"
      },
      {
        "from": "v",
        "to": "s",
        "kind": "feedback",
        "label": "reject or revise"
      },
      {
        "from": "v",
        "to": "a"
      }
    ]
  }
}
```
