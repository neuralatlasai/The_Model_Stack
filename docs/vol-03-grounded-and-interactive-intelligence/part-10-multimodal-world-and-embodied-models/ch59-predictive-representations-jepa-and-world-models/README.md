---
id: ms.chapter.59
entity_type: chapter
title: "Predictive representations, JEPA, and world models"
volume: 3
part: 10
chapter: 59
section: null
slug: ch59-predictive-representations-jepa-and-world-models
parent: ms.part.10
prev_sibling: ms.chapter.58
next_sibling: ms.chapter.60
children:
  [
    "ms.section.59.1",
    "ms.section.59.2",
    "ms.section.59.3",
    "ms.section.59.4",
    "ms.section.59.5",
    "ms.section.59.6",
    "ms.verification.59",
    "ms.references.59",
  ]
prerequisites:
  [
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.24,
    ms.chapter.38,
    ms.chapter.57,
    ms.chapter.58,
  ]
downstream: [ms.chapter.60]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [multimodal_generation, predictive_representation, control],
    feedback_setting: [],
    modality: [image, text, audio, video],
  }
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        OFFICIAL-DOCUMENTATION,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 59 - Predictive representations, JEPA, and world models

[DERIVED] A useful world model preserves distinctions needed by a downstream decision and predicts how interventions change those distinctions. Low latent prediction error addresses neither requirement automatically: the representation defines the target, the dataset defines which action effects are identifiable, and the planner defines which errors matter.

[PAPER-REPORTED] Current evidence spans nine reports first released between March and October2026, with their latest eligible revisions inspected on 2026-10-25. Two originating implementations are statically inspected at exact commits. Earlier foundations remain in canonical chapters. No book training, rollout, robot experiment or performance replication was executed.

## Scope

[DERIVED] Six sections connect observation histories to state uncertainty, predictive objectives to sufficiency, anti-collapse mechanisms to finite estimators, and action-conditioned prediction to bounded planning. A predictor used as a policy feature extractor and one queried under candidate actions expose different interfaces even when both are called world-action models.

## Prerequisites

[DERIVED] Use @ms.chapter.17 for objectives; @ms.chapter.18 for gradients and numerical stability; @ms.chapter.24 for feedback and reinforcement learning; @ms.chapter.38 for video tokens; @ms.chapter.57 for temporal prediction; @ms.chapter.58 for generative multimodal representations.

## Learning outcomes

- [DERIVED] Specify partial observability without identifying a rendered frame with hidden state.
- [DERIVED] Diagnose collapse, conditional averaging and task-relevant information loss separately.
- [DERIVED] Reconstruct EMA-target, Gaussian-regularized and privileged cross-predictive objectives.
- [DERIVED] Audit recurrence, prefix prediction and CEM with explicit primitive-step and replanning units.
- [DERIVED] Separate decoding, forecastability, action use, physical-expectation tests and transfer.
- [DERIVED] Design episode-disjoint studies whose proposed outcomes cannot be mistaken for execution.

## Notation and chapter-local terms

[DERIVED] o_t is an observation; s_t an environment state; a_t an intervention; h_t the available history including timestamps/actions. z_t is a learned representation, not necessarily Markov. H counts model steps, r primitive steps per model action and K model actions executed before replanning. B is a training batch, N a candidate count, I planner iterations. Physical labels may be available for evaluation without being deployment inputs.

> **Definition — Predictive sufficiency.** [DERIVED] A representation preserves a specified future target's conditional law given history, for the stated intervention family, horizon and distribution.

> **Definition — Forecastability.** [DERIVED] Future prediction supported by a frozen representation and a fresh, separately fitted predictor under a fixed split and fitting budget.

> **Definition — Candidate-ranking fidelity.** [DERIVED] Agreement of predicted and declared reference cost orderings over the same finite action bank.

> **Definition — Functional carry-over.** [DERIVED] Persistence of a specified hidden-object readout in predicted states relative to matched controls; an operational test, not human object permanence.

> **Definition — Planner exploitability.** [DERIVED] The extent to which optimizing model cost selects actions with worse realized cost than a fixed reference bank/controller under equal search and interaction budgets.

## Chapter map

```mermaid
flowchart LR
 A[History and partial observability] --> B[Task-relative target]
 B --> C[JEPA and anti-collapse]
 C --> D[Action-conditioned prediction]
 D --> E[Candidate ranking]
 E --> F[Physical and fresh-predictor tests]
 F --> G[Closed-loop transfer]
 G --> A
```

- History and partial observability determine the predictive target.
  - The target and anti-collapse mechanism determine the learned representation.
  - Action-conditioned prediction supplies candidate costs.
    - Candidate ranking must be tested against physical and fresh-predictor diagnostics.
    - Closed-loop transfer supplies new observations and revises the history interface.

```figure
{
  "id": "fig-59.1",
  "kind": "diagram",
  "title": "Separate rungs of evidence",
  "caption": "A probe does not establish counterfactual prediction or control. Each edge requires another held-out test.",
  "placement": "inline",
  "anchor": "scope",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.1",
  "alt": "A probe does not establish counterfactual prediction or control. Each edge requires another held-out test.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "node",
        "label": "History"
      },
      {
        "id": "z",
        "kind": "state",
        "label": "Latent"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Fresh predictor"
      },
      {
        "id": "r",
        "kind": "branch",
        "label": "Candidate ranking"
      },
      {
        "id": "c",
        "kind": "node",
        "label": "Realized result"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "z",
        "kind": "flow",
        "label": "encode"
      },
      {
        "from": "z",
        "to": "p",
        "kind": "flow",
        "label": "predict"
      },
      {
        "from": "p",
        "to": "r",
        "kind": "flow",
        "label": "score"
      },
      {
        "from": "r",
        "to": "c",
        "kind": "flow",
        "label": "act"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-59.2",
  "kind": "compare",
  "title": "Which uncertainty is represented?",
  "caption": "Point prediction, distribution encoding and calibration are different promises. Geometry alone establishes none of their empirical validity.",
  "placement": "inline",
  "anchor": "scope",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.2",
  "alt": "Point prediction, distribution encoding and calibration are different promises. Geometry alone establishes none of their empirical validity.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "p",
        "label": "Point"
      },
      {
        "id": "d",
        "label": "Distribution code"
      },
      {
        "id": "b",
        "label": "Calibrated belief"
      }
    ],
    "rows": [
      {
        "dimension": "Output",
        "values": {
          "p": "One future latent",
          "d": "Parameters or structured state",
          "b": "Validated conditional event law"
        }
      },
      {
        "dimension": "Ambiguity",
        "values": {
          "p": "May average incompatible futures",
          "d": "Can retain modes",
          "b": "Must match held-out frequencies"
        }
      },
      {
        "dimension": "Evidence",
        "values": {
          "p": "Error by horizon",
          "d": "Readout and action controls",
          "b": "Proper scores and conditional coverage"
        }
      }
    ]
  }
}
```

## Sections

| Section          | Mechanism                                   | Decision                                          |
| ---------------- | ------------------------------------------- | ------------------------------------------------- |
| @ms.section.59.1 | Observation, state, belief and intervention | Which history/action support identifies a target? |
| @ms.section.59.2 | Reconstruction, prediction and sufficiency  | Which details can be removed?                     |
| @ms.section.59.3 | Targets, masks, EMA and regularization      | Which constraints oppose collapse?                |
| @ms.section.59.4 | Recurrence, prefixes and CEM                | Which horizon/budget preserves ranking?           |
| @ms.section.59.5 | Probes, surprise and occlusion              | What does a physical test demonstrate?            |
| @ms.section.59.6 | Geometry, OOD and transfer                  | When should the model be bypassed?                |

## Lineage

- 2026 · LeWorldModel [R59.1] · **current frontier** — [PAPER-REPORTED] Joint pixel-to-latent dynamics with explicit anti-collapse regularization.
- 2026 · V-JEPA2.1 [R59.2] · **current frontier** — [PAPER-REPORTED] Dense and multi-level targets, with global/dense tradeoffs.
- 2026 · Adaptive Latent Capacity [R59.3] · **alternative branch** — [PAPER-REPORTED] Learned prefix capacity and mixture-aware matching.
- 2026 · Fast LeWorldModel [R59.4] · **engineering optimization** — [PAPER-REPORTED] Direct multi-horizon action-prefix prediction.
- 2026 · UWM-JEPA [R59.5] · **alternative branch** — [PAPER-REPORTED] Density-matrix rollout with a bounded joint invariant.
- 2026 · JEPA-x [R59.6] · **alternative branch** — [PAPER-REPORTED] Training-time physical trajectories constrain dynamics.
- 2026 · Tracking Is Not Permanence [R59.7] · **current frontier** — [PAPER-REPORTED] Controlled hidden-object diagnosis of released earlier models.
- 2026 · V-JEPA Policy [R59.8] · **engineering optimization** — [PAPER-REPORTED] Future-informed context conditions flow actions.
- 2026 · ATLAS [R59.9] · **alternative branch** — [PAPER-REPORTED] Marginal and relational constraints address different failures.

## Reference-stack coverage

| Stack section                                                 | Entry                                 | Stack layer                | What this chapter takes from it                              | Surface used                     | Sections  | Evidence label                               |
| ------------------------------------------------------------- | ------------------------------------- | -------------------------- | ------------------------------------------------------------ | -------------------------------- | --------- | -------------------------------------------- |
| §3 discovery source                                           | #1 arXiv                              | —                          | Histories and latest eligible full methods/tables/appendices | https://arxiv.org/               | 59.1-59.6 | PAPER-REPORTED; index is not method evidence |
| §4 system                                                     | #17 PyTorch                           | MODEL / AUTOGRAD FRAMEWORK | Loss, EMA, projector and config inspection                   | https://pytorch.org/docs/stable/ | 59.2-59.4 | OFFICIAL-DOCUMENTATION; static only          |
| Outside the reference stack (routed via book_plan.md anchors) | Originating JEPA/world-model projects | —                          | Sources reached from plan topics and primary citations       | references.md                    | 59.1-59.6 | PAPER-REPORTED / OFFICIAL-DOCUMENTATION      |

[DERIVED] Inspection covers leakage, batch dependence, precision, memory/planner work, timing boundaries, uncertainty, negatives and recipe identity. Queries followed2026JEPA, action-prefix planning, physics grounding and occlusion readouts to originating full texts; fixed code commits were inspected through GitHub. Venue year was not substituted for first release.

## Status and evidence gaps

[DERIVED] **Editorial status: manuscript_draft.** Structural completeness does not establish a quality rating. Source experiments remain source claims. Calibration under shift, independent training replication, checkpoint/recipe identity and physical task alignment remain open. Read @ms.verification.59 and @ms.references.59 before a model decision.
