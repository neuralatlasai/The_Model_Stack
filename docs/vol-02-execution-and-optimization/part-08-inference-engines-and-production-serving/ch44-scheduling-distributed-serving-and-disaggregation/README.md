---
id: "ms.chapter.44"
entity_type: "chapter"
title: "Scheduling, distributed serving, and disaggregation"
volume: 2
part: 8
chapter: 44
section: null
slug: "ch44-scheduling-distributed-serving-and-disaggregation"
parent: "ms.part.8"
prev_sibling: "ms.chapter.43"
next_sibling: "ms.chapter.45"
children: ["ms.section.44.1","ms.section.44.2","ms.section.44.3","ms.section.44.4","ms.section.44.5","ms.section.44.6","ms.verification.44","ms.references.44"]
prerequisites: ["ms.chapter.29","ms.chapter.42","ms.chapter.43"]
downstream: ["ms.chapter.46","ms.chapter.47","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["scheduling","distributed_serving","disaggregation"],"feedback_setting":[],"modality":["text"]}
papers: ["P37","P38"]
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 1500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

VOLUME II / PART VIII — INFERENCE ENGINES AND PRODUCTION SERVING / CHAPTER 44

# 44 — Scheduling, distributed serving, and disaggregation

[DERIVED] A serving scheduler succeeds only when its work admission, state ownership, placement, communication, and recovery decisions jointly improve useful service under explicit resource and latency constraints.

6 sections · 2 spine papers · 4 reference-stack implementations · prerequisites: 29, 42–43 · artifact: a serving-scheduler and placement experiment (planned) · updated 2026-10-14

## Why this chapter exists

[MATHEMATICALLY-DERIVED] An efficient model kernel does not determine when a request runs, where its state resides, or whether it finishes before its deadline. Autoregressive serving introduces persistent state and unknown remaining work: a balanced request count can become an unbalanced memory footprint, a full batch can contain few useful slots, and a fast prefill can create a backlog at decode. Once execution is distributed, communication and ownership become part of the critical path.

[DERIVED] The dominant constraint changes with the workload. Long uncached prompts can interrupt streaming; hot shared prefixes can overload a warm replica; large outputs can accumulate state; a burst can fill decode before prefill admission notices; a rank error can leave an entire group waiting. Optimizing one average quantity can worsen another tail or move waiting into an unreported buffer. The solution must therefore represent requests as work plus compatible state plus service obligations.

[DERIVED] This chapter develops those decisions through explicit resource constraints and bounded state transitions. Historical papers establish the admission, chunking, reuse, disaggregation, and migration mechanisms. Inspected 2026 research adds network-stage urgency and phase-specific energy control, with physical tests separated from simulation and steady-state studies separated from transitions. The purpose is a defensible mechanism-level comparison, including the regimes where separation, aggressive reuse, or adaptation loses. The proposed executable study is specified separately; the manuscript does not claim book-run measurements.

## Concept map

~~~mermaid
flowchart TB
    A["[Dataset] Offered request trace"] --> B["[State] Service class and deadline"]
    B --> C["[Process] Iteration admission"]
    C --> D["[Branch] Prefill or decode work"]
    D --> E["[Process] Consecutive prompt chunks"]
    D --> F["[Process] Autoregressive step"]
    G["[Memory] Compatible prefix state"] --> H["[Process] Locality and load placement"]
    H --> C
    E --> I["[Branch] Colocated or separated phases"]
    I --> J["[Flow] State handoff"]
    J --> F
    K["[Hardware] Parallel rank groups"] --> E
    K --> F
    L["[Process] Expert and network arbitration"] --> K
    F --> M["[Metric] Visible token and terminal outcome"]
    M --> N["[Feedback] Load and recovery control"]
    N --> C
    N --> H
    N --> L
~~~

Text equivalent:

- Offered request traces carry service classes and deadlines into iteration admission.
  - Admission selects prefill or decode work.
  - Prefill advances through consecutive prompt chunks; decode advances an autoregressive step.
- Compatible prefix state feeds locality/load placement, which constrains admission.
  - Colocated or separated phases determine whether a state handoff precedes decode.
- Expert/network arbitration determines parallel rank groups.
  - Those groups execute prompt chunks and autoregressive steps.
- Visible tokens and terminal outcomes feed load/recovery control.
  - Control revises admission, placement and expert/network arbitration.

## Position in the book

| Relation | Canonical location |
|---|---|
| Prerequisites | [29 — Distributed execution](../../part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/README.md); [42 — Inference resources](../../part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md); [43 — Runtime selection](../ch43-runtime-architecture-and-inference-engine-selection/README.md) |
| Siblings (same part) | [45 — Local and heterogeneous inference](../ch45-local-edge-and-heterogeneous-inference/README.md) |
| Downstream | [46 — Serving control plane](../ch46-admission-control-routing-autoscaling-and-service-contracts/README.md); [47 — Observability and recovery](../ch47-observability-deployment-changes-and-incident-recovery/README.md); [48 — Capacity and economics](../ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) |
| Trades off with | [44.2 — Chunk granularity](44-2-prefill-management.md), [44.3 — Reuse versus capacity](44-3-prefix-and-state-placement.md), [44.4 — Separation versus movement](44-4-disaggregation.md), [44.6 — Recovery versus useful work](44-6-load-adaptation.md) |

## Sections

| Section | Title | What changes here | Primary evidence |
|---|---|---|---|
| [44.1](44-1-batching.md) | Batching | Membership can change at an iteration boundary | DERIVED; PAPER-REPORTED |
| [44.2](44-2-prefill-management.md) | Prefill management | Consecutive chunks bound inserted work and expose progress obligations | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [44.3](44-3-prefix-and-state-placement.md) | Prefix and state placement | Compatible reuse competes with queueing and occupied capacity | DERIVED; PAPER-REPORTED; OFFICIAL-DOCUMENTATION |
| [44.4](44-4-disaggregation.md) | Disaggregation | Independent phase plans add explicit state movement and tandem queues | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [44.5](44-5-distributed-execution.md) | Distributed execution | Rank, expert, and network critical paths become scheduling objects | DERIVED; PAPER-REPORTED; OFFICIAL-DOCUMENTATION |
| [44.6](44-6-load-adaptation.md) | Load adaptation | Unknown remaining work requires bounded recovery and terminal accounting | MATHEMATICALLY-DERIVED; PAPER-REPORTED |

## Artifact

[DERIVED] The planned **serving-scheduler and placement experiment** comprises immutable release/configuration, workload, execution-event, state/transfer, terminal-outcome, and energy/cost records. It compares equal-budget scheduling/placement policies and retains every offered request, cancellation, rejection, recomputation, and failed transfer. Its deliverable is a reproducible critical-path and useful-goodput analysis, with explicit unsupported configurations and negative results. Field-level schemas and unexecuted experiments appear in [verification.md](verification.md).

## Verification

[DERIVED] The central falsifiable question is where disaggregation loses to a competitive colocated scheduler because exposed state movement, extra queueing, or reduced batching outweighs removed interference. The verification protocol varies state volume, effective topology, reuse, arrivals, phase ratio, and handoff publication, then evaluates Eq. 44.17 against traced outcomes. Separate correctness and failure tests establish that an apparently faster policy has not reused incompatible state or omitted unsuccessful work.

## Lineage

- **2022 · Orca · conceptual ancestor.** [PAPER-REPORTED] Iteration-level scheduling and selective batching [R44.1](references.md), §§3–4.
- **2024 · SGLang / RadixAttention · engineering optimization.** [PAPER-REPORTED] Persistent prefix reuse and cache-aware scheduling [P37](references.md), §3.
- **2024 · Sarathi-Serve · engineering optimization.** [PAPER-REPORTED] Chunked prompt work and bounded mixed iterations [R44.2](references.md), §4.
- **2024 · DistServe · alternative branch.** [PAPER-REPORTED] Phase-specific plans constrained by handoff topology [P38](references.md), §4.
- **2024 · Preble · engineering optimization.** [PAPER-REPORTED] Global/local reuse and load decisions [R44.4](references.md), §4.
- **2024 · Llumnix · alternative branch.** [PAPER-REPORTED] Live request placement repair [R44.5](references.md), §4.
- **2025 · Mooncake FAST release · engineering optimization.** [OFFICIAL-DOCUMENTATION] Released traces and distributed-state implementation surfaces [R44.15](references.md), README dated updates.
- **2026 · MFS · current frontier.** [PAPER-REPORTED] Stage-aware communication arbitration [R44.7](references.md), §§3–5.
- **2026 · BiScale · current frontier.** [PAPER-REPORTED] Phase-specific placement/frequency control, with transition exclusions [R44.8](references.md), §§4–6.

```figure
{
  "id": "fig-44.1",
  "kind": "lineage",
  "title": "Serving decision lineage",
  "caption": "The dated branches change admission, work granularity, state placement, or control. They are not an engine ranking or additive speedup claim.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": [
    "R44.1",
    "P37",
    "R44.2",
    "P38",
    "R44.4",
    "R44.5",
    "R44.7",
    "R44.8"
  ],
  "alt": "Orca 2022 introduces iteration scheduling; 2024 work develops chunking, prefix reuse, placement and migration; 2026 MFS and BiScale add network and energy control.",
  "spec": {
    "entries": [
      {
        "year": 2022,
        "work": "Orca",
        "cite": "R44.1",
        "relation": "conceptual ancestor"
      },
      {
        "year": 2024,
        "work": "SGLang / RadixAttention",
        "cite": "P37",
        "relation": "engineering optimization"
      },
      {
        "year": 2024,
        "work": "Sarathi-Serve",
        "cite": "R44.2",
        "relation": "engineering optimization"
      },
      {
        "year": 2024,
        "work": "DistServe",
        "cite": "P38",
        "relation": "alternative branch"
      },
      {
        "year": 2024,
        "work": "Preble",
        "cite": "R44.4",
        "relation": "engineering optimization"
      },
      {
        "year": 2024,
        "work": "Llumnix",
        "cite": "R44.5",
        "relation": "alternative branch"
      },
      {
        "year": 2026,
        "work": "MFS",
        "cite": "R44.7",
        "relation": "current frontier"
      },
      {
        "year": 2026,
        "work": "BiScale",
        "cite": "R44.8",
        "relation": "current frontier"
      }
    ]
  }
}
```

[DERIVED] These relations describe changes in the decision primitive, not a performance ranking. Independent branches can compose only when their state, timing, and failure contracts agree. Historical baseline releases are preserved in source records; current official surfaces are explicitly unpinned. The 2026 boundary is evidence inspected on the stated access date, not a claim that every paper or production implementation has been surveyed.

## Terms owned here

| Term | Canonical definition |
|---|---|
| Continuous batching | Iteration-boundary reconstruction of admitted membership; [44.1](44-1-batching.md#formulation) |
| Iteration token budget | Bound on newly executed positions, distinct from cached context; [44.1](44-1-batching.md#formulation) |
| Chunked prefill | Consecutive prompt evaluation preserving earlier state and positions; [44.2](44-2-prefill-management.md#formulation) |
| Cache-aware routing | Compatible locality plus queue/service cost selection; [44.3](44-3-prefix-and-state-placement.md#formulation) |
| Cache-sharing namespace | Authorized reuse identity domain; [44.3](44-3-prefix-and-state-placement.md#formulation) |
| Prefill/decode disaggregation | Separately scheduled phases joined by explicit state handoff; [44.4](44-4-disaggregation.md#formulation) |
| SLO goodput | Useful completions meeting declared joint criteria per time boundary; [44.6](44-6-load-adaptation.md#formulation) |
| Virtual usage | Policy accounting augmenting physical occupancy; [44.6](44-6-load-adaptation.md#formulation) |

## Reference-stack coverage

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence |
|---|---|---|---|---|---|---|
| §1 lab | #7 Moonshot AI / Kimi | — | Mooncake origin and source route; no private architecture inference | Code: https://github.com/MoonshotAI | 44.3–44.6 | PAPER-REPORTED |
| §1 lab | #8 DeepSeek | — | EPLB replication/packing source | Code: https://github.com/deepseek-ai | 44.5 | OFFICIAL-DOCUMENTATION |
| §1 lab | #13 Microsoft Research / Microsoft AI | — | Sarathi-Serve archival mechanism and official repository | Code: https://github.com/microsoft | 44.2 | PAPER-REPORTED; OFFICIAL-DOCUMENTATION |
| §3 discovery source | #1 arXiv | — | Versioned full text and revision-specific locators | Search/API: https://arxiv.org/search/advanced | all | DERIVED retrieval route |
| §4 system | #4 NVIDIA NCCL | Kernels / numerics / collectives | Communication completion and fatal-error handling | docs/code: https://docs.nvidia.com/deeplearning/nccl/ | 44.1–44.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #17 PyTorch | Model / autograd framework | Source-reported tensor/execution substrate; no untested API claim | docs/code: https://pytorch.org/docs/stable/ | all | PAPER-REPORTED |
| §4 system | #41 vLLM | Inference engine | Current chunk/preemption and cache identity documentation | docs/code: https://docs.vllm.ai/ | 44.1–44.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #42 SGLang | Inference engine | Radix source, PD reservation, EP execution documentation | docs/code: https://docs.sglang.ai/ | 44.1–44.6 | PAPER-REPORTED; OFFICIAL-DOCUMENTATION |
| Outside the reference stack (routed via book_plan.md anchors) | Orca, DistServe, Sarathi-Serve, Preble, Llumnix, FastServe, Mooncake | Method-specific systems | Required batching, cache routing, disaggregation, and adaptation mechanisms; archival USENIX is the paper route | Exact inspected URLs in [references.md](references.md) | all | PAPER-REPORTED |
| Outside the reference stack (routed via book_plan.md anchors) | MFS, BiScale, EPLB source; HKUST/Purdue/UCSD and collaborators | Method-specific research | 2026 network/energy advances and expert placement; no inferred institute ownership | Exact primary full text/code in [references.md](references.md) | 44.3–44.6 | PAPER-REPORTED; OFFICIAL-DOCUMENTATION |

**Inspection dimensions applied.** [DERIVED] Parallelism and communication are developed in §§44.4–44.5; precision/state compatibility and memory in §§44.1–44.4; kernels in §§44.1–44.2 and 44.5; inference/metrics in all sections; reliability in §§44.4–44.6; reproducibility in each source record and verification protocol. Training checkpoint construction and post-training are not the mechanisms owned here. Energy/cost boundaries enter §§44.4–44.6 and link to Chapter 48.

```figure
{
  "id": "fig-44.2",
  "kind": "cycle",
  "title": "Serving adaptation and evidence loop",
  "caption": "Observed work, state, and outcomes update decisions. Every new decision remains constrained by compatible state and finite failure/terminal rules.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.31",
  "alt": "Measure request queues and state, estimate work and urgency, select admission and placement, execute with ownership, record useful outcomes, then update the next decision.",
  "spec": {
    "stages": [
      {
        "id": "measure",
        "label": "Queue and state events",
        "kind": "dataset"
      },
      {
        "id": "estimate",
        "label": "Work and urgency estimates",
        "kind": "process"
      },
      {
        "id": "decide",
        "label": "Admission and placement",
        "kind": "branch"
      },
      {
        "id": "execute",
        "label": "Bounded execution epoch",
        "kind": "state"
      },
      {
        "id": "outcome",
        "label": "Useful service and failure",
        "kind": "metric"
      }
    ],
    "edges": [
      {
        "from": "measure",
        "to": "estimate"
      },
      {
        "from": "estimate",
        "to": "decide"
      },
      {
        "from": "decide",
        "to": "execute"
      },
      {
        "from": "execute",
        "to": "outcome"
      },
      {
        "from": "outcome",
        "to": "measure",
        "kind": "feedback",
        "label": "update observed load"
      }
    ]
  }
}
```

## Source route

[DERIVED] Apply the stack's §1.1 order: official research/publication index → primary paper/revision → official code/config/license → exact-version independent checks if available → bibliographic identity. Apply §2.1 by resolving the archival venue and artifact; USENIX OSDI/FAST are chapter-anchor routes outside the numbered AI conference list. Apply §3.1 paper → citations/authors/institution → GitHub/model artifacts → official implementation context. Apply §4.3 system docs → configuration → actual execution path → reproducibility fields.

Concrete filled-in queries:

- Lab protocol: site:arxiv.org/abs ("Moonshot AI" OR "Kimi") "KVCache".
- Lab protocol: site:github.com/deepseek-ai "EPLB".
- Conference workflow: site:usenix.org "Taming Throughput-Latency Tradeoff" "2024".
- Paper cascade: ti:"Multi-stage Flow Scheduling" AND cat:cs.NI.
- Stack protocol: site:docs.vllm.ai "max_num_batched_tokens" "Preemption".
- Stack protocol: site:docs.sglang.ai "disaggregation" "allocation policy".

## Status

[DERIVED] **Manuscript draft.** Six full sections, 20 authored figures, source-reported studies, mathematical procedures, and topic-completeness audit are present. Exact serving commits, deployment-specific load distributions, end-to-end fault/cancellation checks, and transition-inclusive energy comparisons remain UNVERIFIED. Source omissions include uncertainty for selected comparisons and precision/concurrency details for particular protocols. An Orca executable release was not established by the inspected primary route. No empirical study was run for this edition, and no draft is promoted to reviewed by source browsing alone.
