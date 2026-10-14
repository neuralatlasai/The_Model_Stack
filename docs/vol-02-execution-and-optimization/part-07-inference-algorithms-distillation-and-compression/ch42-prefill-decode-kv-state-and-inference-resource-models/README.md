---
id: ms.chapter.42
entity_type: chapter
title: Prefill, decode, KV state, and inference resource models
short_title: Inference resource models
volume: 2
part: 7
chapter: 42
section: null
slug: ch42-prefill-decode-kv-state-and-inference-resource-models
parent: ms.part.7
prev_sibling: ms.chapter.41
next_sibling: ms.chapter.43
children: [ms.section.42.1, ms.section.42.2, ms.section.42.3, ms.section.42.4, ms.section.42.5, ms.section.42.6, ms.verification.42, ms.references.42]
prerequisites: [ms.chapter.14, ms.chapter.15, ms.chapter.16, ms.chapter.17, ms.chapter.25, ms.chapter.37, ms.chapter.38, ms.chapter.39, ms.chapter.40, ms.chapter.41]
downstream: [ms.chapter.43, ms.chapter.44, ms.chapter.48]
related: []
relations:
  - {type: supported_by, target: paper.P36}
  - {type: implemented_by, target: impl.vllm}
axes: {lifecycle: [inference, serving], mechanism: [resource_accounting, cache_representation], feedback_setting: [], modality: [text]}
papers: [P36]
implementations: [impl.vllm, impl.pytorch, impl.hugging-face-transformers, impl.nvidia-cuda, impl.triton-language, impl.nvidia-nccl]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1300
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

VOLUME II / PART VII — INFERENCE ALGORITHMS, DISTILLATION, AND COMPRESSION / CHAPTER 42

# 42 — Prefill, decode, KV state, and inference resource models

[DERIVED] Inference resource prediction becomes defensible only when causal work, represented state, physical allocation, parallel placement and workload-dependent service are accounted for separately and then joined over the same execution boundary.

6 sections · 1 spine paper · 6 implementation layers · prerequisites: 14–17, 25, 37–41 · artifact: an inference memory/latency estimator with a measurement-validation protocol (planned) · updated 2026-10-14

## Why this chapter exists

[DERIVED] A weight-size estimate answers whether parameter tensors fit, but leaves the central serving question unanswered: which requests can remain resident and advance within the required delivery time? During generation, state grows, requests overlap and their output lengths are unknown. The resulting capacity depends on the representation and allocator. Two engines executing the same checkpoint can therefore admit different batches without changing the model's attention domain.

[DERIVED] Allocation improvements eventually reach a second constraint. Once useful state fills the recovered capacity, every decode step still reads its history, executes learned maps and joins any distributed partial results. More admitted sequences amortize weights while increasing history reads, memory occupancy and synchronization. An intervention that improves one resource can move the bottleneck to another, or increase client waiting despite improving isolated GPU throughput.

[DERIVED] The solution is a hierarchy of claims. Exact tensor identities establish state bytes; physical resource accounting establishes lower bounds; calibrated execution surfaces predict conditional iteration times; an explicit arrival and scheduler model predicts request delivery. Prefix sharing, quantization, retention, offload and recomputation enter different layers of that hierarchy. Their effects cannot be compressed into a universal utilization constant.

[DERIVED] This chapter builds the accounting needed to inspect those interventions. It preserves the distinction between mathematical equivalence and finite-precision behavior, between a cache miss and a correctness failure, and between fitted mean error and validated tail latency. Published 2026 modeling studies extend the historical memory-management evidence, while their homogeneous-request, Markovian and calibration-domain assumptions remain visible.

## Concept map

~~~mermaid
flowchart LR
 A["[Dataset] Request bytes"] --> B["[Process] Encode and template"]
 B --> C["[State] Admission wait"]
 C --> D["[Process] Causal prefill"]
 D --> E["[Process] First-token selection"]
 E --> F["[Process] Decode advancement"]
 F --> E
 E --> G["[Flow] Client-visible stream"]
 D --> H["[Memory] Retained model state"]
 H --> I["[Process] Logical-to-physical mapping"]
 I --> J["[Memory] Shared immutable pages"]
 H --> K["[Branch] Reduce or relocate state"]
 F --> L["[Hardware] Parallel replica"]
 L --> M["[Flow] Collective and stage traffic"]
 H --> N["[Metric] Per-rank capacity"]
 M --> O["[Metric] Conditional iteration cost"]
 N --> O
 O --> P["[Process] Workload and queue model"]
 P --> Q["[Metric] Delivery prediction"]
~~~

[DERIVED] Equivalent text structure:

- Request bytes → encoding/template → admission wait → causal prefill.
  - Prefill → first-token selection → decode advancement → selection.
  - Selection → client-visible stream.
- Prefill → retained model state.
  - State → logical-to-physical mapping → shared immutable pages.
  - State → representation/retention/location decision.
  - State → per-rank capacity.
- Decode → parallel replica → collective/stage traffic.
  - Traffic and capacity → conditional iteration cost.
  - Iteration cost → workload/queue model → delivery prediction.

## Position in the book

| Relation | Canonical destinations |
|---|---|
| Prerequisites | [Attention/state architectures](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch14-attention-architectures-and-cache-representations/README.md), [recurrent models](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch17-state-space-recurrent-linear-attention-and-hybrid-models/README.md), [hardware](../../part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/README.md), [decoding](../ch37-decoding-constrained-generation-and-speculative-execution/README.md) |
| Siblings (same part) | [Distillation](../ch39-knowledge-response-and-policy-distillation/README.md), [quantization](../ch40-quantization-from-numerical-model-to-deployable-artifact/README.md), [sparsity/adaptive execution](../ch41-pruning-sparsity-rank-reduction-and-adaptive-execution/README.md) |
| Downstream | [Runtime architecture](../../part-08-inference-engines-and-production-serving/ch43-runtime-architecture-and-inference-engine-selection/README.md), [scheduling](../../part-08-inference-engines-and-production-serving/ch44-scheduling-distributed-serving-and-disaggregation/README.md), [measurement/economics](../../part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) |
| Trades off with | [Cache reduction](42-4-cache-reduction.md) exchanges numerical/retention error or recovery work for resident capacity; [parallel placement](42-5-parallel-inference.md) exchanges storage and local work for communication and replication |

## Sections

| Section | Title | What changes here | Primary evidence labels |
|---|---|---|---|
| [42.1](42-1-phase-decomposition.md) | Phase decomposition | Separate computed, selected and visible tokens | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [42.2](42-2-state-accounting.md) | State accounting | Replace a parameter-size estimate with a per-rank liveness ledger | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [42.3](42-3-cache-organization.md) | Cache organization | Address noncontiguous/shared state under correctness invariants | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [42.4](42-4-cache-reduction.md) | Cache reduction | Declare which values, positions or locations change | PAPER-REPORTED; OFFICIAL-DOCUMENTATION; DERIVED |
| [42.5](42-5-parallel-inference.md) | Parallel inference | Account for rank-local state and dependent communication | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [42.6](42-6-predictive-models.md) | Predictive models | Join physical bounds to calibrated service and workload distributions | MATHEMATICALLY-DERIVED; PAPER-REPORTED |

## Artifact

[DERIVED] The planned estimator is specified in [verification.md](verification.md), not represented as an executed software artifact. Its reviewable records are: model/execution identity; tensor/allocation inventory; cache-group/page/scale ledger; rank-placement map; phase/token event trace; workload joint distribution; conditional cost surface with calibration domain; prediction-versus-measurement residuals; recovery/cancellation events; and evidence-gap register. Every record carries units, boundary, revision and provenance. Inventory equations and illustrative calculators are authored in the manuscript; deployment measurements remain outstanding.

[DERIVED] Keeping these records separate permits a useful failure diagnosis. A state-byte mismatch rejects the inventory or representation claim. A physically impossible fitted time rejects the count/rate boundary. A valid local fit that fails online points to workload, scheduling or queue assumptions. Each diagnosis changes a concrete model component rather than adding an opaque correction factor.


```figure
{
  "id": "fig-42.1",
  "kind": "cycle",
  "title": "Estimator calibration and rejection loop",
  "caption": "Prediction remains conditional on inventory, workload and measured domain. A failed residual check returns to the relevant model layer.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-42.14",
  "alt": "Inventory leads to bounds, calibration, prediction and residual checking. Failed checks feed back to inventory or calibration.",
  "spec": {
    "stages": [
      {
        "id": "i",
        "label": "Inventory",
        "kind": "tensor"
      },
      {
        "id": "b",
        "label": "Physical bounds",
        "kind": "metric"
      },
      {
        "id": "c",
        "label": "Calibration",
        "kind": "process"
      },
      {
        "id": "p",
        "label": "Prediction",
        "kind": "metric"
      },
      {
        "id": "r",
        "label": "Residual check",
        "kind": "feedback"
      }
    ],
    "edges": [
      {
        "from": "i",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "p"
      },
      {
        "from": "p",
        "to": "r"
      },
      {
        "from": "r",
        "to": "i",
        "kind": "feedback"
      },
      {
        "from": "r",
        "to": "c",
        "kind": "feedback"
      }
    ]
  }
}
```

## Verification

[DERIVED] Reconcile logical KV bytes with physical pages, allocator reserve and process counters across independently varied prompt/output lengths. Compare cold/warm prefixes and fixed versus varying batch composition; hold model, tokenizer, decoding and numerical path fixed before attributing latency differences. A substantial unexplained allocation residual or reproducible state/output error rejects the corresponding estimator/correctness claim. Prediction errors outside declared holdout tolerances reject its validated domain. The complete proposed protocol and rejection conditions are in [verification.md](verification.md); no book-authored measurement was run.

## Lineage

- 2023 · PagedAttention · **conceptual ancestor**: [PAPER-REPORTED] exact logical attention with paged/sharable placement [P36].
- 2023 · H2O · **alternative branch**: [PAPER-REPORTED] online importance-based retention [R42.8].
- 2024 · StreamingLLM · **alternative branch**: [PAPER-REPORTED] sink plus rolling-window retention [R42.7].
- 2024 · KIVI · **engineering optimization**: [PAPER-REPORTED] asymmetric online low-bit state [R42.5].
- 2024 · Sarathi-Serve · **engineering optimization**: [PAPER-REPORTED] bounded prompt chunks and mixed iterations [R42.6].
- 2026 · Ramani and Tantawi · **current frontier**: [PAPER-REPORTED] approximate state-dependent mean-latency modeling [R42.14].
- 2026 · Lin et al. · **current frontier**: [PAPER-REPORTED] empirically calibrated multiclass fluid control [R42.15].


```figure
{
  "id": "fig-42.2",
  "kind": "lineage",
  "title": "Inference accounting lineage",
  "caption": "Paging, numerical reduction, retention and queue prediction change different parts of the resource contract; the branches are not a ranking.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": [
    "P36",
    "R42.5",
    "R42.6",
    "R42.7",
    "R42.14",
    "R42.15"
  ],
  "alt": "The lineage runs from 2023 paging through 2024 numerical and retention alternatives to two 2026 workload and queue models.",
  "spec": {
    "entries": [
      {
        "year": 2023,
        "work": "PagedAttention",
        "cite": "P36",
        "relation": "conceptual ancestor"
      },
      {
        "year": 2024,
        "work": "KIVI",
        "cite": "R42.5",
        "relation": "engineering optimization"
      },
      {
        "year": 2024,
        "work": "StreamingLLM",
        "cite": "R42.7",
        "relation": "alternative branch"
      },
      {
        "year": 2024,
        "work": "Sarathi-Serve",
        "cite": "R42.6",
        "relation": "engineering optimization"
      },
      {
        "year": 2026,
        "work": "Mean queue model",
        "cite": "R42.14",
        "relation": "current frontier"
      },
      {
        "year": 2026,
        "work": "Multiclass fluid control",
        "cite": "R42.15",
        "relation": "current frontier"
      }
    ]
  }
}
```

## Terms owned here

- **Inference phase ledger** — the request's joined compute/selection/delivery event accounting; §42.1.
- **Computed versus selected token** — a processed position with committed state versus a token chosen for a subsequent position; §42.1.
- **Inference state ledger** — disjoint per-rank live allocations and reserve boundaries; §42.2.
- **KV page-tail waste** — unused token slots in allocated final blocks; §42.3.
- **Reuse-key sufficiency** — equal identities imply the same conditional state under the declared namespace; §42.3.
- **Inference prediction domain** — the explicitly validated model/backend/workload region of an estimator; §42.6.

## Reference-stack coverage

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #4 Meta AI / FAIR | — | StreamingLLM originating author disclosure, routed to full paper | https://ai.meta.com/results/?content_types%5B0%5D=publication | 42.4 | PAPER-REPORTED |
| §1 lab | #13 Microsoft Research / Microsoft AI | — | Sarathi-Serve technical study | https://www.microsoft.com/research/publications/ | 42.1,42.5 | PAPER-REPORTED |
| §1 lab | #24 IBM Research AI | — | September 2026 mean queue-model paper | https://research.ibm.com/publications | 42.6 | PAPER-REPORTED |
| §2 conference | #2 ICML | — | KIVI archival identity; full method read in arXiv v2 | https://proceedings.mlr.press/ | 42.4 | PAPER-REPORTED |
| §3 discovery source | #1 arXiv | — | Full primary texts and revision metadata; no ranking evidence | https://arxiv.org/ | all | PAPER-REPORTED |
| §3 discovery source | #4 NeurIPS Proceedings | — | 2025 successor search; no uninspected candidate taught | https://proceedings.neurips.cc/ | 42.4 search boundary | UNVERIFIED |
| §4 system | #1 NVIDIA CUDA | Accelerator / driver / compiler | KIVI's reported fused implementation layer | https://docs.nvidia.com/cuda/ | 42.4 | PAPER-REPORTED |
| §4 system | #4 NVIDIA NCCL | Kernels / numerics / collectives | Collective boundary only; no executed algorithm selection claim | https://docs.nvidia.com/deeplearning/nccl/ | 42.5 | UNVERIFIED |
| §4 system | #6 Triton language | Kernels / numerics / collectives | KIVI's reported group-quantization kernel layer | https://triton-lang.org/ | 42.4 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Versioned allocator and graph-pool semantics | https://pytorch.org/docs/stable/ | 42.1–42.3,42.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #26 Hugging Face Transformers | Model definition / adaptation | KIVI's reported model integration | https://huggingface.co/docs/transformers/ | 42.4 | PAPER-REPORTED |
| §4 system | #41 vLLM | Inference engine | Prefix/hybrid state, memory, offload, FP8 and parallel contracts | https://docs.vllm.ai/ | all | OFFICIAL-DOCUMENTATION |
| Outside the reference stack (routed via book_plan.md anchors) | PagedAttention/SOSP; KIVI; H2O; Lin et al.; phase-aware accelerator study | — | Plan42 explicitly owns paging, cache reduction, parallel costs and predictive models; P36 is the spine anchor, other papers supply mechanism-specific evidence | Exact primary URLs in references.md | all | PAPER-REPORTED |

**Inspection dimensions applied.** [DERIVED] Parallelism (§42.5), Precision (§42.2,42.4), Memory (all), Communication (§42.4–42.6), Kernels (§42.1,42.3–42.5), Inference (all), Metrics (§42.1,42.6), Reliability (§42.3–42.6), Reproducibility (each section). Checkpointing and Post-training enter only through immutable inference artifact identity; this chapter does not teach their procedures.

## Source route

[DERIVED] Apply the reference stack's lab search, conference workflow, paper cascade and official-documentation-first systems protocol with these filled queries:

- Lab → primary paper: site:arxiv.org/abs "Microsoft Research" "Sarathi".
- Lab → primary paper: site:research.ibm.com/publications "queueing" "inference".
- Conference → exact paper → code: site:proceedings.mlr.press "KIVI" "International Conference on Machine Learning".
- Recent conference search: site:proceedings.neurips.cc "KV cache" 2025 OR 2026.
- Exact source/revision: "Efficient Memory Management for Large Language Model Serving with PagedAttention" (SOSP OR arXiv).
- Official system design/failure: site:github.com "vLLM" (architecture OR design OR OOM OR NCCL).

## Status

[DERIVED] **Manuscript draft; scientific review pending.** All six planned coverage rows have a detailed audit. Inspected sources include three 2026 studies and current unpinned official vLLM surfaces. Foundational method papers retain their historical dates. No code execution establishes model/runtime compatibility, allocation accuracy or prediction performance. NOT-DISCLOSED items include missing source artifact hashes, some runtime/precision/seed details and common matched comparisons. UNVERIFIED items include independent reproduction, current backend combinations, reuse races and out-of-domain tails. These gaps block reviewed status; they do not license guessed implementation details or results.
