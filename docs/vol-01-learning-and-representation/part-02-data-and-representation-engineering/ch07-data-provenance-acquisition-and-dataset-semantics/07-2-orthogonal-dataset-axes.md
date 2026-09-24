---
id: ms.section.7.2
entity_type: section
title: Orthogonal dataset axes
short_title: Dataset axes
volume: 1
part: 2
chapter: 7
section: 7.2
slug: 07-2-orthogonal-dataset-axes
parent: ms.chapter.7
prev_sibling: ms.section.7.1
next_sibling: ms.section.7.3
children: []
prerequisites: [ms.section.4.1, ms.section.6.1, ms.section.6.2, ms.section.7.1]
downstream: [ms.section.7.6, ms.section.9.1, ms.section.11.2, ms.section.22.1, ms.section.49.1, ms.section.66.2]
related: [ms.section.9.5, ms.section.10.3]
siblings_by_mechanism: [ms.section.7.1]
relations:
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P06}
  - {type: prerequisite_of, target: ms.section.9.1}
axes: {lifecycle: [data, pretraining, continued_training, post_training, evaluation], mechanism: [dataset_semantics, attribute_vector, training_role, token_accounting], feedback_setting: [], modality: [text, code]}
papers: [P05, P06, P07]
implementations: [impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 7.2 Orthogonal dataset axes

## Scope

Objective: replace dataset *names by lifecycle stage* ("pretraining data", "SFT data", "RL data") with a typed attribute vector over nine independent axes — modality, language, domain, origin, supervision, training role, chronology, quality, difficulty — and show formally that training role is a relation between a dataset and a run, not a property of the dataset. Baseline: a flat list of datasets grouped by the stage that first consumed them. Success: any dataset in the inventory has all nine coordinates or an explicit `unknown`, and the same snapshot can appear under several roles without being duplicated or renamed. Boundaries: how roles are *mixed* is [§9.1](../ch09-data-mixtures-curricula-and-sample-efficiency/09-1-mixture-formulation.md); stage definitions are [§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md); target types for supervised data are [§11.2](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-2-target-types.md).

## Why this exists

What failed before is recorded in the corrections table of `book_plan.md` and stated at the head of [Appendix C](../../../appendices/appendix-c-dataset-atlas-and-training-role-taxonomy.md): "A dataset is not identified solely by where it appears in the training cycle. Its provenance, modality, supervision, domain, language, generation method, version, and restrictions are independent attributes" (KNOWN · book_plan.md Appendix C). Stage-named datasets fail as soon as one corpus is used twice. The Dolma v1.7 card lists the Flan Collection — instruction data — as a *pretraining* source, "Reformatted for pretraining with newlines separating instruction and demonstration" (OFFICIAL-DOCUMENTATION · R7.19); FineWeb-Edu is web text whose membership was decided by a classifier trained on labels from Llama3-70B-Instruct (OFFICIAL-DOCUMENTATION · R7.6). Neither fits a one-word label. The bottleneck that appeared was governance and evaluation hygiene: a dataset that is "evaluation" in one run and "pretraining" in another is a contamination event ([§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md)) that a stage-named catalogue cannot even represent. The dominant constraint became that restrictions, contamination status, and token accounting must attach to the *snapshot*, while masks, templates, and sampling rates attach to the *use*. What changed is the data model: snapshot attributes and role assignments are separate tables.

## Intuition

A dataset snapshot is a physical object: bytes with a hash. What a training run does with it — which positions carry loss, how often each record is drawn, whether it is held out — is a property of the run's configuration. Confusing the two is like labelling a disk by the last program that read it. The nine axes are chosen so that each answers a question some later chapter must ask independently: *Can the tokenizer encode it well?* (language, modality) · *Which population wrote it?* (origin, language, chronology) · *What gradient signal can it carry?* (supervision) · *What is it being used for here?* (role) · *Can it leak the future or the test set?* (chronology) · *Who decided it was good, and how?* (quality) · *How hard is it for the current model?* (difficulty). Orthogonality is a modelling convention — a claim that each axis can be set without fixing the others — not an empirical claim that the axes are statistically independent in real corpora; they are strongly correlated (DERIVED from the definition; see Limitations).

## Formulation

> **Definition — Dataset attribute vector.** For a dataset snapshot d, the typed tuple a(d) = (a_mod, a_lang, a_dom, a_org, a_sup, a_chr, a_qual, a_diff) whose coordinates take values in the domains of Table 7.2a, each coordinate carrying a value, a *method* by which the value was assigned, and an evidence label. The ninth axis, training role, is deliberately not a coordinate of a(d); it is the relation of Eq. 7.4.

$$
a : \mathcal{G} \to \mathcal{A}_{\text{mod}} \times \mathcal{A}_{\text{lang}} \times \mathcal{A}_{\text{dom}} \times \mathcal{A}_{\text{org}} \times \mathcal{A}_{\text{sup}} \times \mathcal{A}_{\text{chr}} \times \mathcal{A}_{\text{qual}} \times \mathcal{A}_{\text{diff}}
$$
*(Eq. 7.3)* where 𝒢 = the set of dataset snapshots (content-hashed), and each 𝒜 is a typed domain that includes the element `unknown`; set-valued and distribution-valued coordinates are permitted (a corpus has a language *distribution*, not a language).

> **Definition — Training role.** The function a dataset snapshot serves in one specific run: base pretraining, continued/mid-training, SFT, preferences, reward-model training, RL rollout, verifier training, distillation, retrieval corpus, agent memory, evaluation, or embodied interaction (the twelve rows of Appendix C). A role is assigned by a run, carries run-side parameters (loss mask, template, sampling rate), and leaves the snapshot's attribute vector unchanged.

$$
\Gamma \;\subseteq\; \mathcal{G} \times \mathcal{K} \times \mathcal{U}, \qquad (d, r, u) \in \Gamma \iff \text{run } u \text{ consumes snapshot } d \text{ in role } r
$$
*(Eq. 7.4)* where 𝒦 = the role set of Appendix C, 𝒰 = the set of runs (training, evaluation, or serving configurations). "Pretraining data" is then the *derived* set {d : ∃u, (d, base_pretraining, u) ∈ Γ}, a query result and not an identity.

> **Proposition 7.1.** If a catalogue identifies datasets by role, then either (i) a snapshot used in two roles is stored as two entities whose shared restrictions and deletion obligations must be kept consistent by hand, or (ii) the constraint "no snapshot is both an evaluation set and a training set for the same model lineage" is inexpressible.

*Proof sketch.* Identification by role means the key is (name, role). Under (i) the two entities share no key, so an update to licence, deletion, or contamination fields of one does not reach the other. If instead one key is kept and the role overwritten, the catalogue holds at most one role per snapshot and cannot state that both roles occurred, which is (ii). With Γ as a separate relation, the constraint is the query ∄ d, u, u′ in one lineage with (d, evaluation, u) ∈ Γ and (d, r, u′) ∈ Γ, r ≠ evaluation. ∎ (MATHEMATICALLY-DERIVED)

```figure
id: fig-7.8
kind: diagram
title: "Role as a relation: one snapshot, several (role, run) rows"
caption: >-
  One snapshot, one attribute vector, and as many Γ rows as there are uses.
  The Flan snapshot enters Dolma v1.7 as base-pretraining input (R7.19) and
  can enter an SFT run as a second row without being copied or renamed. Its
  template and mask live on the row, not on the bytes. The emphasised
  attempt is the collision of Proposition 7.1: the evaluation snapshot E
  requested for training in the same lineage ℓ. With Γ as a table, Algorithm
  7.2 line 2 rejects it by lookup. Runs u2 to u4 are illustrative, not named
  runs.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-7.4", R7.19]
concepts: [ms.section.7.2, ms.section.8.5]
alt: >-
  Diagram of the role relation Γ. The Flan Collection snapshot depends on one
  attribute vector a(d), set at acquisition with values per Table 7.2a. It has
  two Γ rows. The first is (Flan, base pretraining,
  OLMo 7B-v1.7), reformatted with newlines and sampled at 100% per the Dolma
  v1.7 card. The second is (Flan, SFT, run u2), with a template and a
  response-only mask. Neither row changes a(d). An evaluation snapshot E has
  the row (E, evaluation, run u4) in lineage ℓ. The emphasised edge is an
  attempted row (E, base pretraining, run u3) in the same lineage, which
  Algorithm 7.2 line 2 rejects as an evaluation snapshot in a training lineage.
  Runs u2, u3 and u4 are illustrative.
spec:
  direction: LR
  nodes:
    - { id: flan, kind: dataset, label: "Flan Collection snapshot", sub: "one content hash" }
    - { id: attr, kind: state, label: "a(Flan)", sub: "set at acquisition; values per Table 7.2a" }
    - { id: g1, kind: flow, label: "(Flan, base pretraining, OLMo 7B-v1.7)", sub: "newline-joined, q = 100% (R7.19)" }
    - { id: g2, kind: flow, label: "(Flan, SFT, u2)", sub: "template id, response-only mask" }
    - { id: u1, kind: model, label: "OLMo 7B-v1.7 run", sub: "Dolma v1.7 mixture" }
    - { id: u2, kind: model, label: "SFT run u2", sub: "illustrative" }
    - { id: ev, kind: dataset, label: "evaluation snapshot E", sub: "held out in lineage ℓ" }
    - { id: g4, kind: flow, label: "(E, evaluation, u4)", sub: "protocol id, exposure count", group: lin }
    - { id: u4, kind: model, label: "evaluation run u4", sub: "ℓ(u4) = ℓ", group: lin }
    - { id: g3, kind: branch, label: "requested (E, base pretraining, u3)", sub: "ℓ(u3) = ℓ", group: lin }
    - { id: rej, kind: boundary, label: "REJECT: evaluation snapshot in training lineage", sub: "Algorithm 7.2 line 2" }
  edges:
    - { from: flan, to: attr, kind: dependency, label: "unchanged by any row" }
    - { from: flan, to: g1 }
    - { from: g1, to: u1 }
    - { from: flan, to: g2 }
    - { from: g2, to: u2 }
    - { from: ev, to: g4 }
    - { from: g4, to: u4 }
    - { from: ev, to: g3, kind: emphasis }
    - { from: g3, to: rej, kind: emphasis, label: "lookup on Γ" }
  groups:
    - { id: lin, label: "one model lineage ℓ" }
```

> **Definition — Token-count qualifier (available / sampled / consumed).** *Available* tokens D_avail^(tok): tokens of the whole snapshot under tokenizer tok. *Sampled* tokens: tokens of the subset a run's sampler may draw from, after sub-selection. *Consumed* tokens: tokens actually processed by the optimizer in a run, counting repetition. The symbol D of [notation](../../../front-matter/notation.md) always carries one of these three qualifiers; exposure accounting across epochs is owned by [§9.1](../ch09-data-mixtures-curricula-and-sample-efficiency/09-1-mixture-formulation.md).

$$
D_{\text{cons}}(u) \;=\; \sum_{k} q_k(u)\, D_{\text{avail},k}^{(\text{tok}_u)}
$$
*(Eq. 7.5)* where k indexes snapshots consumed by run u, q_k(u) ≥ 0 = the run's sampling proportion for snapshot k (q_k < 1 sub-samples, q_k > 1 repeats), tok_u = the run's tokenizer. The identity holds only when every D_avail,k is counted under tok_u.

```figure
id: fig-7.9
kind: calculator
title: Eq. 7.5 on the Dolma v1.7 card's own rows
caption: >-
  The card's fifteen source rows, grouped by sampling proportion, all under
  the OLMo tokenizer, so the identity is well-typed. Evaluated row by row,
  Σ q_k·D_avail,k is 1,645.2 B. The card's stated pool is 1,715.1 B. The
  instrument keeps both numbers visible. The gap is a fact about the card
  (DERIVED from its rows), not a correction of it. The third state is a
  what-if that closes the gap; it is not a claim about what the run did.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-7.5", R7.19]
alt: >-
  Calculator for Eq. 7.5 with the Dolma v1.7 card rows in billions of OLMo
  tokens. Dolma's CC 1,195.5 B at q = 50%; C4 138.4 B at 50%; the twelve
  sources at 100% sum to 970.8 B (RefinedWeb 456.4, StarCoder 263.8, Reddit
  79.9, Semantic Scholar 57.2, arXiv 28.0, StackExchange 19.6, Flan 16.5, CC
  News 14.3, OpenWebMath 12.6, Algebraic Stack 12.6, Project Gutenberg 5.3,
  MegaWika 4.6); Wikipedia and Wikibooks 3.7 B at 200%. Available total
  2,308.4 B (card: 2,308.5). Σ q·D = 1,645.2 B, against the card's stated
  1,715.1 B: a gap of 69.9 B, 4.1%, effective mean q 0.713. Setting C4 to 100%
  gives 1,714.4 B, within 0.75 B of the card; the card does not state which is
  right.
spec:
  tex: >-
    D_{\text{cons}}(u) = \sum_{k} q_k(u)\, D_{\text{avail},k}^{(\text{tok}_u)}
  equation: "7.5"
  inputs:
    - { symbol: Dcc, label: "Dolma's CC, B OLMo tokens", default: 1195.5, min: 0, max: 2000, step: 0.1, format: fixed1 }
    - { symbol: qcc, label: "q, Dolma's CC", default: 0.5, min: 0.5, max: 2, options: [0.5, 1, 2], format: ratio }
    - { symbol: Dc4, label: "C4, B OLMo tokens", default: 138.4, min: 0, max: 500, step: 0.1, format: fixed1 }
    - { symbol: qc4, label: "q, C4", default: 0.5, min: 0.5, max: 2, options: [0.5, 1, 2], format: ratio }
    - { symbol: Done, label: "12 sources tabled at 100%, B OLMo tokens", default: 970.8, min: 0, max: 2000, step: 0.1, format: fixed1 }
    - { symbol: qone, label: "q, those 12 sources", default: 1, min: 0.5, max: 2, options: [0.5, 1, 2], format: ratio }
    - { symbol: Dwk, label: "Wikipedia & Wikibooks, B OLMo tokens", default: 3.7, min: 0, max: 20, step: 0.1, format: fixed1 }
    - { symbol: qwk, label: "q, Wikipedia & Wikibooks", default: 2, min: 0.5, max: 2, options: [0.5, 1, 2], format: ratio }
  outputs:
    - { symbol: Dav, label: "available Σ D, B (card total 2,308.5)", formula: "Dcc + Dc4 + Done + Dwk", format: raw }
    - { symbol: S, label: "sampled pool Σ q·D, B", formula: "qcc*Dcc + qc4*Dc4 + qone*Done + qwk*Dwk", format: raw, emphasis: true }
    - { symbol: gap, label: "card's 1,715.1 B minus Σ q·D, B", formula: "1715.1 - S", format: raw }
    - { symbol: rel, label: "gap relative to the card's pool", formula: "(1715.1 - S)/1715.1", format: percent }
    - { symbol: qbar, label: "effective mean q, Σ q·D ÷ Σ D", formula: "S/Dav", format: ratio }
states:
  - { anchor: formulation, label: "card rows as tabled", variables: { qcc: 0.5, qc4: 0.5, qone: 1, qwk: 2 }, highlight: [Dav, S], note: "Eq. 7.5 on the card's own rows, all under the OLMo tokenizer: 2,308.4 B available and Σ q·D = 1,645.2 B." }
  - { anchor: mechanism, label: "card states 1,715.1 B", variables: { qcc: 0.5, qc4: 0.5, qone: 1, qwk: 2 }, highlight: [gap, rel], note: "The worked instance equates 1,715.1 B with Σ q·D. The card's rows give 69.9 B (4.1%) less, outside the 1% identity tolerance of verification §3." }
  - { anchor: failure-modes, label: "what-if: C4 at 100%", variables: { qcc: 0.5, qc4: 1, qone: 1, qwk: 2 }, highlight: [qc4, S, gap], note: "One reading closes the gap to 0.75 B: C4 sampled at 100%, not 50%. The card does not say which is right (UNVERIFIED). A mismatched identity like this is what detection looks for." }
```

## Mechanism

**Table 7.2a — The eight snapshot axes.**

| Axis | Domain (typed) | Assignment method recorded | What it gates downstream | Cost line |
|---|---|---|---|---|
| Modality | set ⊆ {text, code, image, audio, video, action, tabular, …} | container/MIME inspection | tokenizer and serialisation choice ([§10.5](../ch10-tokenization-serialization-and-interface-correctness/10-5-tool-and-multimodal-interfaces.md)) | one pass over headers; negligible (DERIVED) |
| Language | distribution over language(-script) labels | LID model id + threshold | tokenizer fertility, filter thresholds, mixture ([§9.5](../ch09-data-mixtures-curricula-and-sample-efficiency/09-5-multilingual-and-specialist-mixtures.md)) | one classifier pass per document; FineWeb stores `language_score` per record (OFFICIAL-DOCUMENTATION · R7.5) |
| Domain | distribution over a declared topic/genre taxonomy | URL rules, source field, or classifier id | mixture weights, evaluation slices | classifier pass; taxonomy maintenance is human cost |
| Origin | (source category §7.1) × {human-authored, machine-generated, mixed, unknown} × generator/policy id if synthetic | custody chain; generator logs | rights inheritance, distributional risk ([§11.4](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-4-distributional-risks.md)) | free if logged at generation; unrecoverable afterwards (ASSUMED) |
| Supervision | label schema: none · reference target · comparison · scalar · process label · verifier verdict · trajectory return | schema declaration | which objectives the data can feed ([§4.1](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md), [§11.2](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-2-target-types.md)) | labels cost annotator or generator time; amounts NOT-DISCLOSED for every lab inspected |
| Chronology | (content-creation interval, acquisition time, snapshot time) | source timestamps, crawl ids | temporal splits and contamination analysis ([§6.2](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md)) | metadata retention only (§7.3) |
| Quality | a *named estimator's* output distribution (rule set id, classifier id, human rubric id) | estimator id + version | selection ([§8.2](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation.md)) | estimator inference; FineWeb-Edu reports "The classification of FineWeb 15T tokens took 6k H100 GPU hours" (OFFICIAL-DOCUMENTATION · R7.6) |
| Difficulty | a *reference model's* statistic (loss, pass rate) or a declared grade level | reference model id + metric | curricula ([§9.3](../ch09-data-mixtures-curricula-and-sample-efficiency/09-3-curriculum-design.md)) | reference-model inference over the snapshot (DERIVED); no public corpus inspected ships this field (UNVERIFIED as a general statement) |

Two axes deserve a warning. *Quality* and *difficulty* are not properties of text; they are outputs of an estimator applied to text, so the coordinate is meaningless without the estimator's identity. FineWeb-Edu makes this explicit: its scores come from a regression model fine-tuned on 0–5 annotations by Llama3-70B-Instruct, thresholded at 3, which "removed 92% of the dataset" (OFFICIAL-DOCUMENTATION · R7.6). Recording `quality = high` would discard exactly the information needed to reason about what was removed.

```figure
id: fig-7.10
kind: stat-panel
title: "One filled attribute vector: a(FineWeb-Edu)"
caption: >-
  Table 7.2a filled from two cards. Read the rows in two blocks. The first
  five coordinates are assigned by inspection or by a named LID model at a
  stated threshold. The quality block is an estimator's output and needs
  four rows (annotator, threshold, removal rate, cost) to mean anything.
  Difficulty is the coordinate no inspected corpus ships.
placement: rail
anchor: mechanism
evidence: OFFICIAL-DOCUMENTATION
source: [R7.5, R7.6]
alt: >-
  Instrument panel for the attribute vector of FineWeb-Edu from the FineWeb
  and FineWeb-Edu cards. Modality: text. Language: English, fastText score at
  least 0.65, with language_score stored per record. Domain: uncontrolled web.
  Origin: web from Common Crawl WARC, not synthetic. Supervision: none,
  self-supervised. Chronology: Common Crawl dumps from 2013 to 2025, with a
  crawl date per record. Quality estimator: a regression model on
  Snowflake-arctic-embed trained on 500 k samples annotated by
  Llama3-70B-Instruct. Threshold: score 3 or more on a 0 to 5 scale. Removed:
  92% of the dataset. Binary F1: 82%. Cost: 6k H100 GPU-hours to classify
  FineWeb's 15 T tokens. Difficulty: unknown, not shipped.
spec:
  header: "a(FineWeb-Edu) · CARDS v1.4.0"
  variables: { rm: 0.92, f1: 0.82 }
  rows:
    - { key: "modality", value: "text" }
    - { key: "language", value: "en, fastText ≥ 0.65", note: "language_score per record" }
    - { key: "domain", value: "uncontrolled web" }
    - { key: "origin", value: "web (CC WARC), not synthetic" }
    - { key: "supervision", value: "none (self-supervised)" }
    - { key: "chronology", value: "CC dumps 2013–2025", note: "date per record = crawl date" }
    - { key: "quality: annotator → estimator", value: "Llama3-70B-Instruct → regressor", note: "Snowflake-arctic-embed, 500 k annotated samples" }
    - { key: "quality: threshold", value: "score ≥ 3 on 0–5" }
    - { key: "quality: removed by threshold", formula: "rm", format: percent, note: "'removed 92% of the dataset'" }
    - { key: "quality: binary F1", formula: "f1", format: percent, note: "regressor thresholded as a classifier" }
    - { key: "quality: cost of the coordinate", value: "6k H100 GPU-hours", note: "classification of FineWeb 15T tokens" }
    - { key: "difficulty", value: "unknown (not shipped)" }
states:
  - { anchor: mechanism, label: "estimator-defined quality", highlight: ["quality: annotator → estimator", "quality: threshold", "quality: removed by threshold", "quality: cost of the coordinate"], note: "Quality is an estimator's output: annotator, regressor, threshold 3, 92% removed, 6k H100 GPU-hours. Without these rows the coordinate means nothing." }
  - { anchor: observations, label: "what the card discloses", highlight: ["language", "chronology", "quality: binary F1"], note: "The card already publishes most of a(d), with method. What it does not publish is a role relation; that lives in Γ." }
  - { anchor: failure-modes, label: "estimator-free quality", highlight: ["quality: annotator → estimator", "difficulty"], note: "Estimator-free quality: store quality = high and the annotator, threshold and removed 92% vanish. Difficulty shows the other failure, a coordinate with no method at all." }
```

**Table 7.2b — Training-role taxonomy (Appendix C), recast as a relation.** The first three columns are Appendix C verbatim in substance; the last column is this section's addition: which fields live on the *role assignment* (Γ) rather than on the snapshot.

| Role r ∈ 𝒦 | Data unit and supervision | Required distinctions (Appendix C) | Run-side fields on (d, r, u) |
|---|---|---|---|
| Base pretraining | documents or multimodal sequences; self-supervised | source mix, deduplication, document boundaries, token counts, language/domain coverage | q_k, tokenizer tok_u, boundary/packing rule, loss mask |
| Continued/mid-training | domain/length/task-focused sequences | starting checkpoint, exposure changes, replay mixture, retention evaluation | starting checkpoint id, replay q |
| SFT | context–target examples or conversations | demonstrator/generator, target masks, tool turns, task coverage, template | template id, response-only mask |
| Preferences | chosen/rejected pairs, rankings, scalar feedback | annotator population, rubric, ties, noise, provenance | pair construction rule |
| Reward-model training | examples with preference/outcome/process labels | label semantics, calibration distribution, evaluator independence | label mapping, held-out policy |
| RL rollout | policy/environment trajectories | policy revision, sampling settings, state/action/observation, rewards, termination | policy id, sampler settings |
| Verifier training | answers/steps/actions with correctness evidence | execution/proof criteria, hidden tests, ambiguity, error rates | verifier target definition |
| Distillation | soft targets, responses, features, trajectories | teacher revision, accessible information, temperature, selection, reuse rights | teacher id, distillation temperature |
| Retrieval corpus | documents plus identifiers/metadata | freshness, permissions, chunk lineage, update/delete behaviour, provenance | index build id, chunking rule |
| Agent memory | selected experiences/facts/procedures | source evidence, confidence, timestamps, scope, retention, invalidation | memory scope, TTL |
| Evaluation | independent tasks, environments, labels | version, contamination checks, task distribution, protocol, non-reuse for tuning | protocol id, exposure count |
| Embodied interaction | observations, actions, state, outcomes | units, coordinate systems, embodiment, control rate, resets, interventions | embodiment id, control rate |

**Worked instance of Eq. 7.5 from a published card.** The Dolma v1.7 card lists per-source "OLMo tokens (billions)" totalling 2,308.5 with a "Sample Proportion" per source (50%, 100%, 200%), and states: "taking into account sampling proportion gives the final actual token counts used for training --- 1.715 trillion tokens" (OFFICIAL-DOCUMENTATION · R7.19). In this section's terms 2,308.5 B is D_avail under the OLMo tokenizer, the proportions are q_k, and 1,715.1 B is the run's sampled pool Σ q_k D_avail,k; whether the run consumed exactly one pass over that pool is a run fact the card does not state (NOT-DISCLOSED · R7.19). The same card reports the earlier v1.6 in *Llama* tokens (3,059 B); the two totals are under different tokenizers and different source sets and are not comparable as a ratio (DERIVED from the card's own column headers).

```figure
id: fig-7.11
kind: compare
title: Three meanings of D, filled from published cards and papers
caption: >-
  Read down a column to see where each qualifier lives: available on the
  snapshot, sampled on the Γ row, consumed on the run. Read across a corpus
  row to see how rarely all three are published. Consumed tokens are
  disclosed only by DCLM. Dolma's sampled cell carries two numbers, because
  the card's stated pool and the Σ q·D of its own rows differ. Tokenizers
  differ between rows, so no cell may be divided by a cell in another row.
placement: wide
evidence: OFFICIAL-DOCUMENTATION
source: [R7.19, P05, R7.5, P06, P07, "DERIVED:eq-7.5"]
concepts: [ms.section.7.2, ms.section.9.1]
alt: >-
  Comparison of the three token-count qualifiers. Available: tokens of the
  whole snapshot under a tokenizer, attached to the snapshot. Sampled: tokens
  of the subset a run's sampler may draw from, attached to the role
  assignment, q_k times D_avail,k. Consumed: tokens the optimizer processed,
  counting repetition, attached to the run. Dolma v1.7: 2,308.5 B OLMo tokens
  available; sampled stated as 1,715.1 B, while Σ q_k·D_k over the card's
  fifteen rows is 1,645.2 B; consumed not disclosed. Dolma v1.6: 3,059 B Llama
  tokens available; the rest not disclosed. FineWeb: 18,527.0 B gpt2 tokens
  available on card v1.4.0; 27 B and 350 B sampled for ablations; consumed not
  disclosed separately. DCLM: 240 T GPT-NeoX tokens in the pool and 3.8 T in
  the baseline available; 2.6 T consumed by the reported 7B run.
spec:
  axis: "Where each qualifier of D attaches, and what the case-study sources publish for it, each under its own tokenizer"
  columns:
    - { id: av, label: "available D_avail^(tok)" }
    - { id: sa, label: "sampled q_k · D_avail,k" }
    - { id: co, label: "consumed D_cons(u)" }
  rows:
    - { dimension: "definition", values: { av: "tokens of the whole snapshot under tokenizer tok", sa: "tokens of the subset the run's sampler may draw from", co: "tokens processed by the optimizer, counting repetition" } }
    - { dimension: "attaches to", values: { av: "the snapshot (a(d) side)", sa: "the role assignment (d, r, u) ∈ Γ", co: "the run u" } }
    - { dimension: "Eq. 7.5 term", values: { av: "D_avail,k^(tok_u)", sa: "q_k(u) · D_avail,k", co: "Σ_k q_k · D_avail,k, if one pass over the pool" } }
    - { dimension: "Dolma v1.7 (R7.19), OLMo tokenizer", values: { av: "2,308.5 B", sa: "card: 1,715.1 B; its 15 rows give 1,645.2 B (DERIVED)", co: "NOT-DISCLOSED for any OLMo run" } }
    - { dimension: "Dolma v1.6 (P05), Llama tokenizer", values: { av: "3,059 B", sa: "NOT-DISCLOSED", co: "NOT-DISCLOSED" } }
    - { dimension: "FineWeb (R7.5, P06), gpt2 tokenizer", values: { av: "18,527.0 B (card v1.4.0)", sa: "27 B and 350 B in the paper's ablations", co: "NOT-DISCLOSED as a separate figure" } }
    - { dimension: "DCLM (P07), GPT-NeoX tokenizer", values: { av: "240 T pool; 3.8 T baseline (tokenizer UNVERIFIED)", sa: "NOT-DISCLOSED", co: "2.6 T by the reported 7B run" } }
```

Cost line: the attribute vector is tens of bytes per snapshot and a few bytes per record for record-level coordinates (language score, quality score, timestamps); the role relation is one row per (snapshot, role, run). The expensive coordinates are the estimator-derived ones, whose cost is one model inference pass over the corpus (DERIVED).

## Algorithm

```text
Algorithm 7.2 — Role-assignment check against snapshot attributes
INPUT   snapshot d with a(d) and rights record (§7.4); requested role r; run u with lineage id ℓ(u); relation Γ
OUTPUT  ACCEPT with run-side fields, or REJECT with reason
STATE   Γ (append-only)
INVARIANT  a(d) is never modified by a role assignment; every REJECT is logged with the failing coordinate
1  if any coordinate of a(d) required by r is `unknown`:            REJECT("missing:"+coordinate)   # e.g. supervision schema for SFT
2  if r ≠ evaluation and ∃u′ with ℓ(u′)=ℓ(u), (d, evaluation, u′) ∈ Γ:   REJECT("evaluation snapshot in training lineage")
3  if r = evaluation and ∃u′ with ℓ(u′)=ℓ(u), (d, r′, u′) ∈ Γ, r′ ≠ evaluation:  REJECT("training snapshot as evaluation")
4  if a_sup(d) cannot express the targets r needs (Table 7.2b):      REJECT("supervision schema mismatch")
5  if not admissible(d, r, u):                                       REJECT("rights")               # predicate of §7.4, Eq. 7.8
6  if D_avail(d) recorded under tok ≠ tok_u:                             recount under tok_u before computing q   # Eq. 7.5 precondition
7  Γ ← Γ ∪ {(d, r, u)} with run-side fields; ACCEPT
```
Complexity: O(|Γ_ℓ|) per check with an index on lineage; terminates after at most seven tests. Lines 2–3 check identity of snapshots only; overlap between *different* snapshots is the contamination analysis of [§8.5](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md).

## Implementation

Reference-stack placement: **Hugging Face Transformers** (#26, *Model definition / adaptation*) provides the tokenizer that fixes tok_u on line 6; **PyTorch** (#17, *Model / autograd framework*) and the trainers above it — **TorchTitan** (#21) and **Nanotron** (#35), both *Distributed training* — are where run-side fields (mask, packing, q) are realised, developed in [§12.3](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-3-sampling-and-loading.md) and not here. *Outside the reference stack (plan anchor: Appendix B "Datasets"; FineWeb/Dolma anchors):* Hugging Face Hub dataset-card YAML, which carries a small part of a(d) as machine-readable metadata — `license`, `language`, `task_categories`, `size_categories`, `pretty_name`, `tags` (OFFICIAL-DOCUMENTATION · R7.29) — and the Croissant format, "a metadata format for datasets that creates a shared representation across ML tools, frameworks, and platforms" (PAPER-REPORTED · R7.26). Neither expresses role as a relation; both conflate it with `task_categories` (DERIVED from the documented field lists).

> **Implementation note [impl.hugging-face-transformers · UNVERIFIED version].** Record the tokenizer by repository id *and* revision hash, not by family name: "gpt2", "Llama", "GPT-NeoX", and "OLMo" in the case studies of §7.6 are four different vocabularies, and later revisions of a tokenizer repository may change special tokens.

## Experimental design

### Experiment 7.2 — Inter-annotator agreement on axis assignment and role-collision detection

- **Hypothesis:** two engineers given the same dataset card and paper assign identical coordinates on modality, language, origin, supervision, and chronology for ≥ 90% of datasets, but agree substantially less on domain, quality, and difficulty unless the estimator id is supplied (thresholds ASSUMED).
- **Setup:** 40 public datasets spanning all twelve roles; two independent annotators; then Algorithm 7.2 over a synthetic run history with planted evaluation/training collisions.
- **Independent variables:** axis; whether estimator identity is provided.
- **Controlled variables:** source documents, annotation guide, time budget.
- **Dataset/workload:** the case-study corpora of §7.6 plus post-training datasets from Appendix C's resource table.
- **Hardware:** none.
- **Metrics:** Cohen's κ per axis with bootstrap interval over datasets; recall of planted collisions.
- **Baselines:** stage-named catalogue (role as key).
- **Expected result:** collisions are undetectable in the baseline by construction (Proposition 7.1) and detected with recall 1.0 by Algorithm 7.2 lines 2–3.
- **Ablation:** drop the `method` sub-field from quality and difficulty.
- **Interpretation:** which axes are well-defined enough to be mandatory.
- **Threats to validity:** annotators share a training culture; 40 datasets is a convenience sample.

Proposal only; no run was executed.

## Observations

**What the paper claims.** The Dolma v1.7 card reports per-source available tokens, sampling proportions, and a resulting 1.715 T-token training pool under the OLMo tokenizer, and includes reformatted Flan instruction data among pretraining sources (OFFICIAL-DOCUMENTATION · R7.19). The FineWeb-Edu card reports a classifier-defined subset with the annotator model, threshold, and removal rate stated (OFFICIAL-DOCUMENTATION · R7.6). FineWeb2's card declines to report subword tokens at all, because the count "heavily depends on whether the tokenizer was trained with that language, and its script, in mind" (OFFICIAL-DOCUMENTATION · R7.7).

**What the evidence shows.** These cards demonstrate that builders already publish most coordinates of a(d) and, in Dolma's case, the run-side q_k. None publishes role as a relation, and none was independently audited by this edition.

**What we infer.** That one instruction dataset serves as base-pretraining input in one release and as SFT input elsewhere is direct evidence for Eq. 7.4 (DERIVED). We infer (ASSUMED) that most "data leakage" incidents in multi-stage pipelines are role collisions that a relation-based catalogue would have blocked at line 2–3 of Algorithm 7.2; no public incident database supports a rate.

**What remains unknown.** Difficulty metadata in any production corpus is NOT-DISCLOSED. Whether the axes are sufficient for multimodal and embodied data is UNVERIFIED; Appendix C's embodied row suggests additional typed fields (units, control rate) that this section treats as supervision-schema details.

## Failure modes

> **Failure mode — Role baked into the artefact.** *Symptom:* "the SFT version" and "the pretraining version" of one source drift apart in licence or deletion state. *Cause:* role used as identity; two copies. *Detection:* identical content hashes under different catalogue keys. *Mitigation:* one snapshot, many Γ rows; templates applied at load time.

> **Failure mode — Estimator-free quality.** *Symptom:* a "high-quality" subset cannot be regenerated or audited for what it excluded. *Cause:* quality stored as a boolean. *Detection:* `quality.method` empty. *Mitigation:* store estimator id, version, threshold, and — as FineWeb2 does with its `_removed` subsets (OFFICIAL-DOCUMENTATION · R7.7) — keep what was removed.

> **Failure mode — Mixed-tokenizer arithmetic.** *Symptom:* Σ q_k D_avail,k does not match the trainer's consumed-token counter. *Cause:* D_avail,k recorded under a different tokenizer than tok_u. *Detection:* tokenizer ids differ across rows of Eq. 7.5. *Mitigation:* Algorithm 7.2 line 6.

> **Failure mode — Chronology collapse.** *Symptom:* a temporal split leaks because only the crawl date was stored. *Cause:* content-creation time conflated with acquisition time. *Detection:* documents whose content references events after their recorded date. *Mitigation:* keep the three timestamps of Table 7.2a separately; mark creation time `unknown` when it is.

## Siblings

**Source categories** — [07-1-source-categories.md](07-1-source-categories.md)
Why it exists: custody-chain classification. What assumption changed here: origin is one axis among nine. What objective changed: none. What problem it solved: per-source cost and risk. What new failure mode it introduced: content-based mislabelling. Changed primitive: typed vector → single enum.

**Mixture formulation** — [§9.1](../ch09-data-mixtures-curricula-and-sample-efficiency/09-1-mixture-formulation.md)
Why it exists: choosing q_k. What assumption changed: the attribute vector is given; the weights are the decision variable. What objective changed: downstream quality per consumed token. What problem it solved: allocation. What new failure mode it introduced: over-repetition of small high-weight sources. Changed primitive: description → optimisation.

**Stage definitions** — [§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md)
Why it exists: naming what a *run* is doing. What assumption changed: stages are properties of runs and checkpoints. What objective changed: none. What problem it solved: stage vocabulary. What new failure mode it introduced: stage names leaking back onto datasets. Changed primitive: relation Γ → the run side of it.

## Extensions

Long-context training adds a record-level coordinate (document length distribution) under chronology-like metadata rather than a new axis (ASSUMED). Multimodal data makes modality set-valued per record and adds alignment metadata to the supervision schema. Agents and embodiment add generator/policy identity to origin and move most governance weight onto the RL-rollout and agent-memory roles, whose retention and invalidation fields are mandatory in Appendix C.

## Limitations

Orthogonality is definitional: in real corpora language predicts domain, chronology predicts machine-generated share, and quality estimators correlate with dialect — FineWeb's authors avoided "gold"-similarity classifiers because such methods "disproportionately remove content in specific dialects" (OFFICIAL-DOCUMENTATION · R7.5). The vector therefore supports *bookkeeping*, not causal attribution. The section's claim is falsified if Experiment 7.2 shows κ below a usable level on the five "objective" axes, which would mean the domains in Table 7.2a are underspecified.

## Reproducibility

Versions: Dolma card (v1_7 default, accessed 2026-09-20); FineWeb-Edu card (v1.4.0 changelog head); FineWeb2 card (v2.1.1 changelog head); Hub dataset-card documentation (`hub-docs` main, commit not pinned). Artifacts: inventory columns for a(d) and the `role_assignments` table in [verification.md](verification.md). Exact definitions: Eq. 7.3–7.5. Unresolved: the consumed-token count of any run trained on Dolma v1.7 beyond the card's pool size (NOT-DISCLOSED).

## References

P05, P06, P07, R7.5, R7.6, R7.7, R7.19, R7.26, R7.29; book_plan.md Appendix C; Eq. 7.3–7.5; Proposition 7.1.
