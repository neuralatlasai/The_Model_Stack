---
id: "ms.chapter.47"
entity_type: "chapter"
title: "Observability, deployment changes, and incident recovery"
volume: 2
part: 8
chapter: 47
section: null
slug: "ch47-observability-deployment-changes-and-incident-recovery"
parent: "ms.part.8"
prev_sibling: "ms.chapter.46"
next_sibling: "ms.chapter.48"
children: ["ms.section.47.1","ms.section.47.2","ms.section.47.3","ms.section.47.4","ms.section.47.5","ms.section.47.6","ms.verification.47","ms.references.47"]
prerequisites: ["ms.chapter.30","ms.chapter.43","ms.chapter.44","ms.chapter.45","ms.chapter.46"]
downstream: ["ms.chapter.48","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["observability","deployment","recovery"],"feedback_setting":[],"modality":["text"]}
papers: []
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 1500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

VOLUME II / PART VIII — INFERENCE ENGINES AND PRODUCTION SERVING / CHAPTER 47

# 47 — Observability, deployment changes, and incident recovery

[DERIVED] A trustworthy deployment binds outcomes to immutable execution identities, preserves observation uncertainty, and recovers only state whose ownership, integrity and compatibility remain valid.

6 sections · 0 spine papers · 4 implementations · prerequisites: 30, 43–46 · artifact: an instrumented deployment and rollback runbook (planned) · updated 2026-10-14

## Why this chapter exists

[DERIVED] Process health originally offered a convenient proxy for service health: if the worker responded and the GPU remained busy, the deployment appeared operational. Autoregressive services make that proxy inadequate. A backend can finish after the client times out; a response can be fast and wrong; a replacement can become ready while interrupted requests still need replay. Model, tokenizer, template, numerical execution and cache semantics change independently, so restoring a weight file alone cannot reconstruct behavior.

[DERIVED] The dominant constraint is the validity of the observation and transition being claimed. Selective traces bias estimates. Delayed feedback confounds quality with observation age. Shared resources contaminate release comparisons. Recovery can reuse resident weights only under an integrity/compatibility boundary, while stale owners must be prevented from publishing after replacement. These problems require identities, estimands, clocks, provenance and bounded state machines.

[DERIVED] The solution is a connected scientific and operational contract. Instrumentation retains collection losses and timing boundaries. Quality monitoring distinguishes proxies from outcomes. Releases become immutable tuples exposed through isolated bounded stages. Localization tests mechanisms instead of promoting coincidence to cause. Recovery separates capacity from progress, and incident learning preserves counterfactual assumptions. Inspected 2026 papers supply methods and negative results; the proposed deployment exercise remains unexecuted.

## Concept map

~~~mermaid
flowchart TB
 A["[State] Immutable release tuple"] --> B["[Process] Request execution"]
 B --> C["[Metric] Client-visible events"]
 B --> D["[Process] Bounded trace collection"]
 D --> E["[State] Clock and sampling uncertainty"]
 C --> F["[Feedback] Delayed outcome ledger"]
 F --> G["[Branch] Proxy or task evidence"]
 A --> H["[Process] Isolated shadow"]
 H --> I["[Branch] Bounded canary decision"]
 I --> B
 D --> J["[Process] Regression localization"]
 J --> K["[State] Hypothesis and falsifier"]
 K --> L["[Process] Fenced recovery"]
 L --> M["[Memory] Trusted model and runtime state"]
 M --> B
 L --> N["[State] Replay or partial failure"]
 N --> O["[Feedback] Incident evidence and tests"]
 O --> A
~~~

Text equivalent:

- An immutable release tuple defines request execution and an isolated shadow candidate.
  - Execution produces client-visible events and bounded traces.
  - Traces retain clock/sampling uncertainty and support regression localization.
- Client events feed a delayed outcome ledger.
  - The ledger distinguishes proxy signals from task evidence.
- Isolated shadow evaluation feeds a bounded canary decision that controls request exposure.
- Regression localization records a hypothesis and falsifier before fenced recovery.
  - Trusted model/runtime state can return to execution.
  - Replay or partial failure feeds incident evidence and tests.
  - Incident evidence revises the next immutable release tuple.

## Position in the book

| Relation | Canonical location |
|---|---|
| Prerequisites | [30 — Recovery](../../part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/README.md); [43 — Runtime](../ch43-runtime-architecture-and-inference-engine-selection/README.md); [44 — Scheduling](../ch44-scheduling-distributed-serving-and-disaggregation/README.md); [45 — Heterogeneous inference](../ch45-local-edge-and-heterogeneous-inference/README.md); [46 — Service contracts](../ch46-admission-control-routing-autoscaling-and-service-contracts/README.md) |
| Siblings (same part) | [48 — Capacity planning](../ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) |
| Downstream | [48 — Measurement and economics](../ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) |
| Trades off with | [47.1 — Collection cost](47-1-telemetry.md); [47.3 — Exposure](47-3-release-control.md); [47.5 — State preservation](47-5-recovery.md) |

## Sections

| Section | Title | What changes here | Primary evidence |
|---|---|---|---|
| [47.1](47-1-telemetry.md) | Telemetry | Collection mechanisms determine the estimand | MATHEMATICALLY-DERIVED; OFFICIAL-DOCUMENTATION |
| [47.2](47-2-quality-observability.md) | Quality observability | Selected labels/proxies constrain identification | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [47.3](47-3-release-control.md) | Release control | Immutable tuples and bounded exposure protect comparisons | DERIVED; MATHEMATICALLY-DERIVED |
| [47.4](47-4-regression-localization.md) | Regression localization | Boundary differences support falsifiable hypotheses | DERIVED; PAPER-REPORTED |
| [47.5](47-5-recovery.md) | Recovery | State lifetime and fencing select eligible actions | PAPER-REPORTED; DERIVED |
| [47.6](47-6-operational-learning.md) | Operational learning | Evidence survives into remediation | PAPER-REPORTED; MATHEMATICALLY-DERIVED |

## Artifact

[DERIVED] The **instrumented deployment and rollback runbook** contains release-manifest, assignment, request-event, quality-label, ownership/cache-epoch, incident-evidence and decision records. Each includes immutable identities, timing/provenance fields and terminal states. The runbook connects detection, containment, localization, drain, rollback, state compatibility, replay and review. Its deliverable includes negative checks and unresolved observations, rather than only successful restart. Schemas and proposed checks are in [verification](verification.md).

## Verification

[DERIVED] The central exercise injects a template or semantic-cache-key regression into an isolated candidate, asks whether monitoring localizes the first divergent boundary, and checks whether fenced rollback restores prior behavior without stale output or duplicated effects. Separate sampling/delayed-label and recovery-action exercises test observation and ownership premises. These are proposals; no deployment or book-measured performance is claimed.

## Lineage

- **2011 · Spectroscope · conceptual ancestor.** [PAPER-REPORTED] Request-flow structure/timing comparison [R47.5](references.md).
- **2018 · Canarying Releases · engineering optimization.** [OFFICIAL-DOCUMENTATION] Candidate exposure and per-version evidence [R47.4](references.md).
- **2025 · Production inference incidents · alternative branch.** [PAPER-REPORTED] Retrospective evidence and annotation limits [R47.7](references.md).
- **2026 · ProxyDrift · current frontier.** [PAPER-REPORTED] Proxy alignment and evaluation recovery [R47.3](references.md).
- **2026 · Dynamo recovery · current frontier.** [PAPER-REPORTED] Initialized-state lifetime and shadow promotion [R47.6](references.md).

```figure
{
  "id": "fig-47.1",
  "kind": "lineage",
  "title": "Observability and recovery lineage",
  "caption": "Dated methods improve different evidence or state boundaries; this is not a performance ranking.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": [
    "R47.5",
    "R47.7",
    "R47.3",
    "R47.6"
  ],
  "alt": "2011 request-flow diagnosis, 2025 incident evidence, and 2026 proxy monitoring and initialized-state recovery.",
  "spec": {
    "entries": [
      {
        "year": 2011,
        "work": "Spectroscope",
        "cite": "R47.5",
        "relation": "conceptual ancestor"
      },
      {
        "year": 2025,
        "work": "Inference incident study",
        "cite": "R47.7",
        "relation": "alternative branch"
      },
      {
        "year": 2026,
        "work": "ProxyDrift",
        "cite": "R47.3",
        "relation": "current frontier"
      },
      {
        "year": 2026,
        "work": "Dynamo recovery",
        "cite": "R47.6",
        "relation": "current frontier"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-47.2",
  "kind": "cycle",
  "title": "Evidence and release-control loop",
  "caption": "Outcomes update hypotheses and tests; every exposure and recovery remains constrained by immutable identity and ownership.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.22",
  "alt": "Outcomes update hypotheses and tests; every exposure and recovery remains constrained by immutable identity and ownership. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "stages": [
      {
        "id": "o",
        "label": "Events and outcomes",
        "kind": "dataset"
      },
      {
        "id": "e",
        "label": "Qualified evidence",
        "kind": "process"
      },
      {
        "id": "d",
        "label": "Exposure / recovery decision",
        "kind": "branch"
      },
      {
        "id": "x",
        "label": "Fenced execution",
        "kind": "state"
      },
      {
        "id": "t",
        "label": "Updated tests",
        "kind": "feedback"
      }
    ],
    "edges": [
      {
        "from": "o",
        "to": "e"
      },
      {
        "from": "e",
        "to": "d"
      },
      {
        "from": "d",
        "to": "x"
      },
      {
        "from": "x",
        "to": "t"
      },
      {
        "from": "t",
        "to": "o",
        "kind": "feedback"
      }
    ]
  }
}
```

## Terms owned here

| Term | Definition and owner |
|---|---|
| Observation ledger | Provenance and availability mechanism for outcomes; [47.2](47-2-quality-observability.md) |
| Immutable release tuple | Content-addressed model-to-policy specification; [47.3](47-3-release-control.md) |
| Diagnostic hypothesis ledger | Signatures, falsifiers and alternatives; [47.4](47-4-regression-localization.md) |
| Ready-capacity recovery | Initialized capability, distinct from progress; [47.5](47-5-recovery.md) |
| Device-preserving recovery boundary | Conditions permitting trusted resident-state reuse; [47.5](47-5-recovery.md) |
| Duration-replacement counterfactual | Eligible outage savings under replacement assumptions; [47.6](47-6-operational-learning.md) |

## Reference-stack coverage

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #13 Microsoft Research / Microsoft AI | — | ProxyDrift/incident studies | https://www.microsoft.com/research/publications/ | 47.2, 47.6 | PAPER-REPORTED |
| §1 lab | #14 NVIDIA Research | — | State-lifetime recovery | https://research.nvidia.com/publications | 47.1, 47.5–47.6 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Reproducibility limits | https://pytorch.org/docs/stable/ | 47.1, 47.3–47.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #41 vLLM | Inference engine | Metrics/source, invariance, recovery engine | https://docs.vllm.ai/ | 47.1, 47.3–47.6 | OFFICIAL-DOCUMENTATION; PAPER-REPORTED |
| §4 system | #42 SGLang | Inference engine | Versioned recovery engine | https://docs.sglang.ai/ | 47.1, 47.5–47.6 | PAPER-REPORTED |
| §4 system | #1 NVIDIA CUDA | Accelerator / driver / compiler | Virtual-memory/context boundary through paper | https://docs.nvidia.com/cuda/ | 47.3–47.5 | PAPER-REPORTED |
| §4 system | #4 NVIDIA NCCL | Kernels / numerics / collectives | Private collective state through paper | https://docs.nvidia.com/deeplearning/nccl/ | 47.1, 47.3–47.5 | PAPER-REPORTED |
| Outside the reference stack (routed via book_plan.md anchors) | Spectroscope, Google SRE, Python clocks, MLPerf LoadGen, Snapshot | — | Diagnostic ancestor, canary guidance, clock semantics, plan's measurement anchor and paper's implementation | Exact URLs in [references](references.md) | All | PAPER-REPORTED; OFFICIAL-DOCUMENTATION |

[DERIVED] **Inspection dimensions applied:** Parallelism/Communication in runtime compatibility; Precision/Kernels in numerical localization; Memory in trace retention, cache namespaces and shared weights; Checkpointing/Reliability in recovery; Inference/Metrics/Reproducibility throughout. Post-training is outside scope. CUDA/NCCL are analyzed through the primary recovery paper, not separately executed.

## Source route

[DERIVED] Start with the plan's vLLM/MLPerf anchors. Apply the reference stack's lab-to-paper and paper-to-official-code cascade. Concrete filled-in queries preserve its protocols:

- §1.1: "site:arxiv.org/abs NVIDIA inference recovery".
- §1.1: "site:microsoft.com/research/publication data drift OR site:arxiv.org/abs Microsoft Research data drift".
- §3.1: "Diagnosing performance changes by comparing request flows paper official code".
- §4.3: "site:docs.vllm.ai metrics request_queue_time_seconds".
- §4.3: "site:github.com/ai-dynamo snapshot GMS".

[DERIVED] Read assumptions, implementation paths, protocols and negative conditions before extracting results. Source records preserve exact revisions/locators and mutable status. Historical foundations remain useful when their regimes survive the adaptation; a 2026 timestamp does not strengthen an unsupported mechanism claim.

## Status

[UNVERIFIED] **Editorial status: manuscript_draft.** Six manuscripts, mathematical procedures, 20 local figure blocks, primary experiments and the topic audit are present. No engine/recovery/quality benchmark was executed. Private traces, confidential incident logs, exact ProxyDrift model revisions and conflicting denominators remain unavailable. Current docs/source is unpinned. The [verification](verification.md) gates must pass before reviewed status.

[DERIVED] Unsettled questions include whether compact proxies preserve task-relevant shifts, how shared-resource interference changes release-effect identification, and when progress preservation beats capacity preservation. Sections name settling evidence. These are scientific limitations, distinct from the unexecuted artifact.
