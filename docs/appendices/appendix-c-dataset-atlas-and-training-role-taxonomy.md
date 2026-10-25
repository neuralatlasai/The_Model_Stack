---
id: ms.appendix.c
entity_type: appendix
title: "Dataset atlas and training-role taxonomy"
short_title: Appendix C
volume: null
part: null
chapter: null
section: null
slug: appendix-c-dataset-atlas-and-training-role-taxonomy
parent: ms.appendices
prev_sibling: ms.appendix.b
next_sibling: ms.appendix.d
children: []
prerequisites: []
downstream: []
related: [ms.chapter.6, ms.chapter.66]
relations: []
axes: {lifecycle: [evaluation, assurance], mechanism: [evidence_audit, provenance], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Appendix C — Dataset atlas and training-role taxonomy

[DERIVED] A dataset has independent provenance, modality, supervision, domain, language, generation, version and permission axes. Its role in one training pipeline is not its identity. The same records can be used for SFT, verifier training or evaluation under different information and leakage constraints; changing that role changes the experiment.

## Training-role taxonomy

| Training/evaluation role | Data unit and supervision | Required distinctions |
|---|---|---|
| Base pretraining | Documents or multimodal sequences; self-supervised targets | Source mix, deduplication, document boundaries, token counts, language/domain coverage |
| Continued/mid-training | Domain/length/task-focused sequences | Starting checkpoint, exposure changes, replay mixture, and retention evaluation |
| SFT | Context–target examples or conversations | Demonstrator/generator, target masks, tool turns, task coverage, and template |
| Preferences | Chosen/rejected pairs, rankings, or scalar feedback | Annotator population, rubric, ties, noise, and provenance |
| Reward-model training | Examples with preference/outcome/process labels | Label semantics, calibration distribution, and evaluator independence |
| RL rollout | Policy/environment trajectories | Policy revision, sampling settings, state/action/observation sequence, rewards, and termination |
| Verifier training | Answers/steps/actions with correctness evidence | Execution/proof criteria, hidden tests, ambiguity, and error rates |
| Distillation | Soft targets, responses, features, or trajectories | Teacher revision, accessible information, temperature, selection, and reuse rights |
| Retrieval corpus | Documents plus identifiers/metadata | Freshness, permissions, chunk lineage, update/delete behavior, and provenance |
| Agent memory | Selected experiences/facts/procedures | Source evidence, confidence, timestamps, scope, retention, and invalidation |
| Evaluation | Independent tasks, environments, and labels | Version, contamination checks, task distribution, protocol, and non-reuse for tuning |
| Embodied interaction | Observations, actions, state, and outcomes | Units, coordinate systems, embodiment, control rate, resets, and intervention records |

## Mandatory dataset record

| Required field | What it must establish |
|---|---|
| Dataset ID and snapshot/hash | A reconstructible population, including versions of deleted/replaced shards; a current URL alone is insufficient |
| Origin and acquisition time | Source provenance and when the bytes were acquired; distinguish source publication from collection time |
| Modality, language and domain | Declared coverage and any measurement/classification procedure; unknown coverage remains unknown |
| Sampling unit and counts | Document, sequence, token, pair, episode or trajectory; available, sampled and consumed counts remain separate and name the tokenizer |
| Label schema and producer | Human/model/executable-verifier/process/outcome semantics, rubric, ties, missingness and independent label audit |
| Generator or policy | Exact synthetic teacher/policy, prompts, decoding, accessible information, environment and lineage; raw and transformed identities |
| Permission record | Exact license/permission source and restrictions, retained obligations, retention/deletion conditions; availability is not legal permission |
| Extraction/filter/dedup revisions | Transform order, thresholds, representative selection, removal ledger and any changed population-dependent state |
| Training role and membership | Train/development/final-test membership and permitted feedback channels; prevent a final suite from entering generation or curation |
| Contamination results | Relation checked, detector and audit population, false-positive/recall limits and unchecked relations |
| Known limits | Missing provenance, mislabeled/unknown outcomes, selected coverage, duplication, sensitive content and unresolved access constraints |

## Resource studies and source routes

The plan's representative resources are retained as historical case-study routes. They are not a common benchmark of corpus sizes, current availability or interchangeable licenses.

These are coverage anchors, not a claim of license equivalence, unchanged download availability, or directly comparable corpus sizes.

| Resource | Why it belongs in the book | Source |
|---|---|---|
| C4 / T5 | Web cleaning and text-to-text/denoising objectives | [T5 paper](https://arxiv.org/abs/1910.10683) |
| The Pile | Multi-domain corpus composition and documentation | [The Pile paper](https://arxiv.org/abs/2101.00027) |
| RedPajama | Reproducible corpus-preparation infrastructure and source mixtures | [Official data repository](https://github.com/togethercomputer/RedPajama-Data) |
| RefinedWeb | Web filtering/deduplication as an experimental variable | [RefinedWeb paper](https://arxiv.org/abs/2306.01116) |
| Dolma | Open corpus construction, provenance, and research reproducibility | [Dolma paper](https://arxiv.org/abs/2402.00159) |
| FineWeb / FineWeb-Edu | Filtering, quality selection, and educational-data selection | [FineWeb paper](https://arxiv.org/abs/2406.17557), [dataset card](https://huggingface.co/datasets/HuggingFaceFW/fineweb) |
| FineWeb2 | Multilingual data coverage and language-sensitive data engineering | [Official dataset card](https://huggingface.co/datasets/HuggingFaceFW/fineweb-2) |
| DCLM | Controlled data-selection experiments and matched training recipes | [DCLM paper](https://arxiv.org/abs/2406.11794) |
| Code corpora | Repository provenance, licenses, file/repository splits, deduplication, execution, and benchmark contamination | Use exact official dataset cards; integrate into 07–12 and 61 |
| Mathematics/science corpora | Symbolic parsing, formulas, proofs, verification, and domain mixtures | [DeepSeekMath](https://arxiv.org/abs/2402.03300) as a method/data account |
| Tulu-family post-training data | Mixtures spanning SFT, preferences, and verifiable tasks | [Tulu 3 report](https://arxiv.org/abs/2411.15124) |
| Process-supervision data | Intermediate-step labels and verifier reliability | [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) |
| Distilled reasoning data | Teacher generation, selection, student supervision, and disclosure limits | [DeepSeek-R1](https://arxiv.org/abs/2501.12948) |
| Agent/software environments | State, actions, repository snapshots, tests, and reproducibility | [SWE-bench](https://arxiv.org/abs/2310.06770), [τ-bench](https://arxiv.org/abs/2406.12045) |
| Multimodal/robot trajectories | Time alignment, embodiment, action semantics, and transfer | [OpenVLA](https://arxiv.org/abs/2406.09246), [V-JEPA 2](https://arxiv.org/abs/2506.09985) |

## Estimands and operational consequences

[DERIVED] A token count is a tokenizer-dependent representation measurement. It does not establish the number of independent examples or useful learning signals. Distinguish raw, accepted, unique, sampled and consumed populations. Selection can change task difficulty and subgroup coverage, so comparing pre/post-filter aggregates without an audit can confound quality with a shifted population.

[DERIVED] Trajectories need action/observation order, state/reset identity, units, clocks, terminal reason and outcome observation. A timeout is an observed operational event; it may leave task outcome unknown. Retrieval corpora and agent memories additionally need permission scope, update/delete lineage and invalidation. Robot actions require coordinate systems, actuator semantics and embodiment; converting them to text does not remove those contracts.

[DERIVED] Chapters 7–12 develop construction and exposure accounting; Chapters 31–36 develop learning from the resulting supervision; Chapters 49–60 develop retrieval, interaction and modality-specific state; Chapters 61–66 evaluate what conclusions the evidence permits. This appendix specifies records and routes, not a fresh audit or an executed training result for every listed dataset.
