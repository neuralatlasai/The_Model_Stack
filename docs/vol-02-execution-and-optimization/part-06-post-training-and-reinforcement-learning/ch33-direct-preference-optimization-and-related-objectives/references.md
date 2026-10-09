---
id: "ms.references.33"
entity_type: "references"
title: "Chapter 33 references"
short_title: "Chapter 33 references"
volume: 2
part: 6
chapter: 33
section: null
slug: "references"
parent: "ms.chapter.33"
prev_sibling: null
next_sibling: null
children: []
prerequisites: ["ms.chapter.2", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32"]
downstream: ["ms.chapter.34", "ms.chapter.35", "ms.chapter.36"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["preference_optimization", "offline_optimization"], "feedback_setting": ["human_preference", "ai_feedback", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.hugging-face-trl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1400
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter 33 references

## Admission and provenance

[DERIVED] Retrieval and source inspection date: **2026-10-09**. The active window is first public release2025-12-01 through2026-10-09 inclusive. Every admitted canonical source family below first appeared in2026: four primary scholarly works plus one official implementation release, **5/5families**. Versioned files from the same TRL release are three records in one family, not three independent replications. All substantive empirical discussion uses2026sources. Older models, datasets and evaluators named in a2026protocol are workload identifiers, not separately admitted older scientific evidence.

[DERIVED] Primary arXiv manuscripts were found through the reference stack's §3 #1 arXiv route. That route does not establish top-lab affiliation, acceptance at a conference, or independent review. TRL is §4 #29 Hugging Face TRL, Post-training / RL, and an explicit Chapter33 plan anchor. First-party code is admitted for its versioned2026behavior; the original historical objective is not relabeled as a2026invention. Browser search was followed by inspection of full method and experiment text, relevant appendices and the named tagged code paths. No abstract-only performance assertion is used.

| Key | Type | Work | Organization | Venue | URL | Code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R33.1 | paper | Direct Preference Optimization with Rating Information: Practical Algorithms and Provable Gains | Viano, Zhou, Sun, Namazifar, Cevher, Sabach, Ghavamzadeh | arXiv | https://arxiv.org/html/2602.00603v1 | null | preprint | 2026-10-09 | Rating channels; constrained statistical guarantees; actual comparative protocol |
| R33.2 | paper | Autoregressive Direct Preference Optimization | Oi, Ukai, Kaneko, Okazaki, Inoue | arXiv | https://arxiv.org/html/2602.09533v1 | null | preprint | 2026-10-09 | Response versus block feedback; actual math/dialogue evaluation |
| R33.3 | paper | Uncertainty-Normalized Margins for Direct Preference Optimization | Khorasani, Mikkola, Grossglauser | arXiv | https://arxiv.org/html/2609.38647v1 | null | preprint | 2026-10-09 | AO/WR distinction; identification; scale provenance; conditional evaluation |
| R33.4 | paper | How Much Online RL is Enough? Informative Rollouts for Offline Preference Optimization in RLVR | Verma, Ravindran | arXiv | https://arxiv.org/html/2605.21266v1 | null | preprint | 2026-10-09 | Warm-up/harvest/fresh-offline separation; negative duration and IPO results |
| R33.5 | documentation | TRL v1.13.0 | Hugging Face | GitHub official release | https://github.com/huggingface/trl/releases/tag/v1.13.0 | https://github.com/huggingface/trl/tree/v1.13.0 | official documentation | 2026-10-09 | Dated implementation family;2026-09-10; commit3d9261f |
| R33.6 | repository | TRL v1.13.0 DPOTrainer | Hugging Face | Official tagged source | https://raw.githubusercontent.com/huggingface/trl/v1.13.0/trl/trainer/dpo_trainer.py | https://github.com/huggingface/trl/blob/v1.13.0/trl/trainer/dpo_trainer.py | official documentation | 2026-10-09 | Completion masks, summed scores, normalized IPO, robust loss, reference cache |
| R33.7 | repository | TRL v1.13.0 KTOTrainer | Hugging Face | Official tagged source | https://raw.githubusercontent.com/huggingface/trl/v1.13.0/trl/trainer/kto_trainer.py | https://github.com/huggingface/trl/blob/v1.13.0/trl/trainer/kto_trainer.py | official documentation | 2026-10-09 | Unpaired labels, detached nonnegative mismatched-pair baseline, class weights |
| R33.8 | repository | TRL v1.13.0 experimental ORPOTrainer | Hugging Face | Official tagged source | https://raw.githubusercontent.com/huggingface/trl/v1.13.0/trl/experimental/orpo/orpo_trainer.py | https://github.com/huggingface/trl/blob/v1.13.0/trl/experimental/orpo/orpo_trainer.py | official documentation | 2026-10-09 | Mean response log probabilities, stable odds, decoder full-sequence chosen NLL |

## R33.1

[PAPER-REPORTED] Originating history: [2602.00603v1](https://arxiv.org/abs/2602.00603v1), **2026-01-31**,08:38:21UTC. Pin v1. Inspected §2 background, §3.1 reward/rating modification, §3.2 joint likelihood, Assumptions4.1–4.2, Theorems4.3–4.4, Appendix B.2 heterogeneous feedback and Appendix C proofs/constraints, §6 and Appendix F experiments/error bars. Manuscript claims are restricted to those locators.

[DERIVED] Crucial interpretation: Theorem4.3 changes the effective KL coefficient to $\beta\beta_1/(\beta+\beta_1)$ and tunes $\beta_1$ using error quantities. It is not a universal convergence-rate claim for the unchanged neural DPO problem. Appendix F.3's selected epoch and Appendix F's different uncertainty constructions prevent treating every plotted bar as independent training-seed uncertainty. Public code release, complete hardware/precision lock and independent replication remain NOT-DISCLOSED or UNVERIFIED at this inspected boundary. The primary text, not a search snippet, supports the claims.

## R33.2

[PAPER-REPORTED] Originating history: [2602.09533v1](https://arxiv.org/abs/2602.09533v1), **2026-02-10**,08:45:30UTC. v2 exists dated2026-06-10, but this chapter pins the inspected v1 and does not merge its claims with uninspected version differences. Inspected §§3–5, Appendix A's prefix-energy derivation, Appendix B KL construction, Appendix C feedback-length partition, §6 and Appendix E's hyperparameter, rank, length and scaling tables.

[DERIVED] A product of blockwise feedback events differs from one sequence comparison. Prefix-specific normalizers cannot generally be canceled across different histories by the same-prompt argument of §33.1. The book defines the implemented block surrogate explicitly and restricts its interpretation. Appendix E implementation details disclose four NVIDIA H100 GPUs; precision and exact seed counts are NOT-DISCLOSED in the inspected experimental text. An appendix standard deviation without a disclosed repetition unit is not independently assumed to be a seed estimate.

## R33.3

[PAPER-REPORTED] Originating history: [2609.38647v1](https://arxiv.org/abs/2609.38647v1), **2026-09-29**,23:08:57UTC. Pin v1. Inspected §§2–4, equations8–14, Theorem4.1 and Appendix B.3 incidence/cycle proof, Appendix B.1–B.2 scale/length conditions, §5 tables, Appendix E.1–E.6 full training/evaluation/version/provenance and Appendix F alternative-scale confounds/negative comparisons.

[DERIVED] The paper uses prompt symbol $y$ and response symbol $x$; this chapter maps them to shared-book prompt $x$ and response $y$. Five-fold pilot scores are out of fold for pilot training, while the pooled scale network is fitted on all eligible score rows. Geometric centering is over unique training prompts and is frozen at evaluation. Neither condition identifies free per-prompt latent noise on a one-edge comparison graph. Source checksums establish an integrity boundary, not test independence or a multi-seed result. No released executable artifact is represented as locally run.

## R33.4

[PAPER-REPORTED] Originating history: [2605.21266v1](https://arxiv.org/abs/2605.21266v1), **2026-05-20**,14:53:43UTC. Pin v1. Inspected §2 pipeline and pairability definitions, §4 setup/results, Appendix A temperature/quantity/loss/difficulty ablations, Appendix B limitations and training configuration. The final offline policy restarts from the original instruction-tuned model; it does not continue the warm-up policy.

[DERIVED] The source's abstract compute multiplier and its GPU-hour table do not yield the same ratio. Harvest duration/inclusion and exact long harvest cap are not fully reconstructable from the inspected account. Consequently this chapter reports no derived end-to-end speedup. The Appendix A temperature table's0.8row does not partition to100%; its values are not copied into a new normalized chart. Its quantity-matched and limited-GRPO-tuning boundaries remain explicit.

## R33.5

[OFFICIAL-DOCUMENTATION] Official release **2026-09-10**,00:50,tag **v1.13.0**,short commit **3d9261f**. The immutable tag is the source target, rather than mutable `main` documentation or the installed project. No local package installation, source execution, benchmark or compatibility check is claimed. All three code records below belong to this release family for date counting.

## R33.6

[OFFICIAL-DOCUMENTATION] Inspected tagged `compute_ref_log_probs` (lines1132–1169), `_compute_loss` and objective branches (approximately1333–1494), mask/collation and reference-cache identity machinery. The code's IPO uses per-response average scores. The chosen SFT component has its own token-weighted reduction. The robust branch requires a noise convention distinct from ordinary soft-label smoothing. These are implementation-specific conventions; no old historical paper enters the admitted bibliography through this record.

## R33.7

[OFFICIAL-DOCUMENTATION] Inspected tagged `_compute_kl_logps` (1206–1254), `_compute_loss` (1388–1492) and Liger variant (1255–1387). Cyclic mismatching creates additional prompt/response scores; the gathered, detached mean is clamped nonnegative. This finite-batch proxy is not automatically the exact conditional KL under policy samples. Class weights and missing-class batch behavior are part of the objective contract.

## R33.8

[OFFICIAL-DOCUMENTATION] Inspected tagged `odds_ratio_loss` (606–634), `get_batch_logps` (636–671), `concatenated_forward` (702–741) and `get_batch_loss_metrics` (743–791). The decoder-only chosen NLL includes prompt and completion, whereas its response odds use averaged completion log probabilities. Its stable `log1mexp` path and experimental module location are recorded. A response-only NLL adaptation is a distinct configuration, not silently assigned to this tag.

## Exclusions and closure

[DERIVED] Excluded by originating-date rule: the original DPO, IPO, KTO, ORPO and SimPO papers, and earlier reward-model, dataset/model and evaluation papers. Their historical priority and empirical conclusions are not sourced here. Foundational identities are explicitly reconstructed under premises and are not2026novelty claims. An older paper revised in2026 remains excluded. Later than2026-10-09material and search-only candidates are excluded. TPMM-DPO was discovered but not admitted because its full protocol was not completed in this chapter's inspected evidence scope.

[UNVERIFIED] No independent scientific replication, installed trainer/kernel parity, universal objective ranking, annotation-noise identification, calibrated task-success probability, total monetary/energy advantage or externally assigned review score is established. The manuscript's finite examples and controls are analytical illustrations or unexecuted protocols, never fabricated observations.
