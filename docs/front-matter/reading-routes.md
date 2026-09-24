---
id: ms.frontmatter.reading-routes
entity_type: frontmatter
title: Reading routes and integrated studies
short_title: Reading routes
volume: null
part: null
chapter: null
section: null
slug: reading-routes
parent: ms.frontmatter
prev_sibling: ms.frontmatter.notation
next_sibling: ms.frontmatter.glossary
children: []
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
word_count_target: 700
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Reading routes and integrated studies

A reading route is an ordered traversal through existing chapters. It changes reading order, not chapter ownership; cross-referenced prerequisites still apply.

## 1. The central relationship

A learning objective induces a representation and an algorithm; those choices determine execution, memory, communication, and deployment behaviour; deployment evidence then informs the next learning intervention. Architecture, data, optimisation, hardware, and evaluation are therefore studied jointly.

## 2. Reader entry routes

| Reader | Route | Why |
|---|---|---|
| Model researcher | Volume I (01–24) → Part VI (31–36) → 61–62 | Objectives, data, architecture, training science, then post-training and evaluation |
| Systems engineer | 01–06 → 13–17 → Volume II (25–48) → 63, 66 | Foundations and architecture state, then hardware, kernels, distributed execution, inference, serving |
| Application / agent engineer | 06 → 10 → 37–38 → 42–54 → 61–66 | Evaluation first, interfaces, decoding, inference resource models, retrieval, tools, agents, assurance |
| Multimodal / embodied researcher | 04, 18 → 24 → 34–36 → 55–60 → 63–66 | Objectives and modality primitives, then policies, world models, and evaluation |

## 3. Integrated studies

Proposed deliverables that connect chapters into complete studies. None has been executed in Edition 1.0.

| Study | Chapter route | Required outcome |
|---|---|---|
| A — Build and audit a base model | 01–12 → 13–21 → 25–30 → 61 | Reproducible tokenizer/data/training pipeline; contamination report; scaling pilot; matched-budget baseline |
| B — Adapt a specialist model | 06–12 → 22–24 → 31–33 → 39–40 → 61–62 | Compare retrieval, continued pretraining, full tuning, adapters; report retention, quality, cost |
| C — Train a reasoning policy | 11 → 31–36 → 37–39 → 61–63 | Independent verifier; SFT/RL ablations; fixed-budget pass@1/pass@k; reward-exploitation analysis |
| D — Build a serving system | 14–17 → 25–29 → 37–48 → 63, 66 | Predict/measure memory; compare engines; load-test SLOs; inject faults; demonstrate rollback |
| E — Build a grounded agent | 46–54 → 61–66 | Evidence-aware context construction; typed tools; persistent state; retry/side-effect tests; budget-matched baselines |
| F — Study embodied transfer | 18, 24, 34–36 → 55–60 → 63–66 | Perception/dynamics/action ablations; simulation perturbations; real-time constraints; documented transfer limits |

## 4. Curated paths for the Atlas UI

Each path is an ordered list of existing section ids. No duplicate content.

- **Understand modern LLM training:** 04.1 → 05.1 → 09.1 → 10.1 → 19.1–19.6 → 20.1 → 21.2 → 29.1 → 30.3
- **Inference engineering:** 05.5 → 14.1 → 42.1–42.6 → 37.5 → 44.1 → 44.2 → 43.2 → 46.1 → 48.3
- **Reasoning-model training:** 11.2 → 32.4 → 34.2 → 35.1 → 35.2 → 35.4 → 38.2 → 39.3 → 63.2
- **Mixture-of-experts systems:** 13.3 → 16.1–16.6 → 27.5 → 29.4 → 44.5
- **GPU kernel optimisation:** 25.2 → 25.3 → 26.1 → 26.4 → 27.1 → 27.2 → 28.2
- **Long-context systems:** 10.3 → 15.1–15.6 → 17.6 → 42.4 → 50.5
- **Agent architecture:** 51.1 → 51.3 → 52.1 → 53.1 → 54.1 → 63.3
- **VLA systems:** 18.1 → 55.1 → 59.1 → 60.1–60.6

## 5. The lifecycle is a conditional graph

Training and deployment form a branching, iterative process, not a fixed pipeline. Evaluation may reject a transformation or return it for revision; deploying an uncompressed model is valid; distillation can create new training data or a new student; a quantised artifact requires its own evaluation; production logs become training data only after selection, permissions, sanitisation, and leakage checks. The permissible routes are drawn in `book_plan.md` and are owned by Chapter 01 (§01.4).
