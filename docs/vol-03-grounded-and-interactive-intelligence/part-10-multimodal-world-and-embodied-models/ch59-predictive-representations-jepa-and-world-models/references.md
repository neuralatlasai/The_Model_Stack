---
id: ms.references.59
entity_type: references
title: "Chapter 59 primary evidence ledger"
volume: 3
part: 10
chapter: 59
section: null
slug: references
parent: ms.chapter.59
prev_sibling: ms.verification.59
next_sibling: null
children: []
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

# Chapter 59 - Primary evidence ledger

[PAPER-REPORTED] Nine retained reports first appeared within 2026-03-01 through 2026-10-24. Actual access was2026-10-25. Unversioned submission histories were checked before selecting the latest eligible revisions below. Revision date, first release and access date are distinct. Preprint is the conservative status; proceedings appearance is not independent proof of review.

[OFFICIAL-DOCUMENTATION] Two originating implementation artifacts were inspected statically at current-window commits. No model execution, compatibility validation, metric replication or training was performed. A2025 repository's2026V-JEPA2.1 path is a new artifact, not a redating of the entire repository.

| Key    | Type          | Work                                                                                | Authors / organisation                                                       | Venue / year                                                      | Primary URL                                                                                               | Official code                                     | Status                 | Accessed   | Used for                                                                                                           |
| ------ | ------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| R59.1  | paper         | LeWorldModel: Stable End-to-End Joint-Embedding Predictive Architecture from Pixels | Lucas Maes; Quentin Le Lidec; Damien Scieur; Yann LeCun; Randall Balestriero | 2026; first public 2026-03-13; inspected 2603.19312v3, 2026-06-03 | [inspected full text](https://arxiv.org/html/2603.19312v3)                                                | https://github.com/lucas-maes/le-wm               | preprint               | 2026-10-25 | Online targets, projections, SIGReg, control schedule, probes and perturbation contrasts                           |
| R59.2  | paper         | V-JEPA2.1: Unlocking Dense Features in Video Self-Supervised Learning               | Lorenzo Mur-Labadia et al.; Meta FAIR                                        | 2026; first public 2026-03-15; inspected 2603.14482v3, 2026-06-11 | [inspected full text](https://arxiv.org/html/2603.14482v3)                                                | https://github.com/facebookresearch/vjepa2        | preprint               | 2026-10-25 | Weighted context, four target levels, tokenizers and distinct matched/long-horizon robot planners                  |
| R59.3  | paper         | Adaptive Latent Capacity for World Models                                           | Idan Achituve; Lior Dikstein; Idit Diamant; Arnon Netzer; Hai Victor Habi    | 2026; first public 2026-09-26; inspected 2609.32921v2, 2026-10-06 | [inspected full text](https://arxiv.org/html/2609.32921v2)                                                | https://arm-research.github.io/AAIR-ALeWM         | preprint               | 2026-10-25 | Hard-prefix surrogate, mixture characteristic functions, modal episode capacity, seed/statistic distinctions       |
| R59.4  | paper         | Fast LeWorldModel                                                                   | Yuntian Gao; Xiangyu Xu                                                      | 2026; first public 2026-06-24; inspected 2606.26217v2, 2026-09-28 | [inspected full text](https://arxiv.org/html/2606.26217v2)                                                | https://github.com/Yuntian-Gao/Fast-LeWorldModel  | preprint               | 2026-10-25 | Causal prefixes, parallel predictor, optional consistency and complete runtime aggregation                         |
| R59.5  | paper         | UWM-JEPA: Predictive World Models That Imagine in Belief Space                      | Santosh Kumar Radha; Oktay Goktas                                            | 2026; first public 2026-05-25; inspected 2605.25313v1, 2026-05-25 | [inspected full text](https://arxiv.org/html/2605.25313v1)                                                | https://github.com/santoshkumarradha/uwm-jepa     | preprint               | 2026-10-25 | Joint density-matrix invariants, partial trace, simulator counterfactual targets, bounded indicator/probe evidence |
| R59.6  | paper         | JEPA-x: Cross-Predictive Physics Grounding for Forecastable Latent Dynamics         | Kehan Wen; Ziming Li; Siyuan Luo; Fan Shi                                    | 2026; first public 2026-08-25; inspected 2608.24044v3, 2026-08-28 | [inspected full text](https://arxiv.org/html/2608.24044v3)                                                | NOT-DISCLOSED in inspected implementation account | preprint               | 2026-10-25 | Four equal predictive terms, physical state interface, fresh predictor and rank controls                           |
| R59.7  | paper         | Tracking Is Not Permanence: What Video World Models Keep of a Hidden Object         | Peng Xie; Amr Alanwar                                                        | 2026; first public 2026-10-05; inspected 2610.07355v1, 2026-10-05 | [inspected full text](https://arxiv.org/html/2610.07355v1)                                                | See originating report; code not pinned here      | preprint               | 2026-10-25 | Minimal pairs, signed readout, scene denominators, encoder/predictor separation, scoring controls                  |
| R59.8  | paper         | V-JEPA Policy: Building Effective World-Action Models on Predictive Visual Latents  | Yang Zhang et al.                                                            | 2026; first public 2026-09-29; inspected 2609.37250v2, 2026-10-10 | [inspected full text](https://arxiv.org/html/2609.37250v2)                                                | https://github.com/breez3young/VJEPA-Policy       | preprint               | 2026-10-25 | Observed-context path, future queries, layerwise context KVs, flow expert and video pretraining transfer           |
| R59.9  | paper         | ATLAS: Aligned Transport of Latent Structure for Reliable World Model Planning      | Ke Fang; Yupu Yao; Lu Cheng                                                  | 2026; first public 2026-09-28; inspected 2609.36333v2, 2026-09-30 | [inspected full text](https://arxiv.org/html/2609.36333v2)                                                | https://github.com/Annie969/atlas-world-model     | preprint               | 2026-10-25 | Projected transport, relational loss, finite-candidate bound and novelty strata                                    |
| R59.10 | documentation | LeWM originating implementation                                                     | Originating authors                                                          | 2026; inspected artifact commit 2026-05-22                        | [pinned source](https://github.com/lucas-maes/le-wm/tree/8edfeb336732b5f3ce7b8b210d0ba370a09e2cac)        | https://github.com/lucas-maes/le-wm               | official documentation | 2026-10-25 | Online training target gradients, mean loss, projectors and default/paper differences                              |
| R59.11 | documentation | V-JEPA2.1 originating implementation                                                | Originating authors                                                          | 2026; inspected artifact commit 2026-03-23                        | [pinned source](https://github.com/facebookresearch/vjepa2/tree/204698b45b3712590f06245fbfba32d3be539812) | https://github.com/facebookresearch/vjepa2        | official documentation | 2026-10-25 | Teacher no_grad/normalization, weighted context, EMA, singleton-shape hazards and example recipe identity          |

## R59.1

[PAPER-REPORTED] **LeWorldModel: Stable End-to-End Joint-Embedding Predictive Architecture from Pixels.** First public 2026-03-13; inspected 2603.19312v3, dated 2026-06-03; accessed 2026-10-25. Exact locators: Secs. 3-5; AppendicesA/B/D/F/G. [Primary text](https://arxiv.org/html/2603.19312v3).

[DERIVED] Generic CEM description and task overrides differ; tuning bisection lacks a monotone planning oracle; projected finite tests are not exact population normality.

## R59.2

[PAPER-REPORTED] **V-JEPA2.1: Unlocking Dense Features in Video Self-Supervised Learning.** First public 2026-03-15; inspected 2603.14482v3, dated 2026-06-11; accessed 2026-10-25. Exact locators: Sec. 2.3; Tables1/2/5/6; Sec. 3.3; AppendixA. [Primary text](https://arxiv.org/html/2603.14482v3).

[DERIVED] Dense/global tradeoff is retained. Later progressive rows change data/scale/cooldown. Robot longer-horizon gains include planner changes; small task counts remain explicit.

## R59.3

[PAPER-REPORTED] **Adaptive Latent Capacity for World Models.** First public 2026-09-26; inspected 2609.32921v2, dated 2026-10-06; accessed 2026-10-25. Exact locators: Sec. 3; Table 1; AppendicesB/E. [Primary text](https://arxiv.org/html/2609.32921v2).

[DERIVED] Full future is predicted during training; rollout remasks. Training-window selector and initial/goal deployment inputs differ. Dimension is not bits or measured kernel work.

## R59.4

[PAPER-REPORTED] **Fast LeWorldModel.** First public 2026-06-24; inspected 2606.26217v2, dated 2026-09-28; accessed 2026-10-25. Exact locators: Secs. 3.3-3.7; Tables2/5; AppendicesA/B/D/E. [Primary text](https://arxiv.org/html/2606.26217v2).

[DERIVED] Seven planning seeds do not establish independent retraining. All-workload accumulated seconds are not per-call latency. Consistency is not calibration.

## R59.5

[PAPER-REPORTED] **UWM-JEPA: Predictive World Models That Imagine in Belief Space.** First public 2026-05-25; inspected 2605.25313v1, dated 2026-05-25; accessed 2026-10-25. Exact locators: Secs. 2-6; Tables1/2; SupplementS1. [Primary text](https://arxiv.org/html/2605.25313v1).

[DERIVED] Joint-state invariance is not reduced-readout retention or calibration. Vector codes can represent distributions. Simulator-state access and long-horizon negatives remain explicit.

## R59.6

[PAPER-REPORTED] **JEPA-x: Cross-Predictive Physics Grounding for Forecastable Latent Dynamics.** First public 2026-08-25; inspected 2608.24044v3, dated 2026-08-28; accessed 2026-10-25. Exact locators: Sec. 4; Sec. 5; Tables1/8; AppendicesC/D/E. [Primary text](https://arxiv.org/html/2608.24044v3).

[DERIVED] Currentv3 title differs from initial XP-JEPA. Privileged training excludes velocity/force/goal but still supplies synchronized state. Mean success is simulation evidence, not physical transfer.

## R59.7

[PAPER-REPORTED] **Tracking Is Not Permanence: What Video World Models Keep of a Hidden Object.** First public 2026-10-05; inspected 2610.07355v1, dated 2026-10-05; accessed 2026-10-25. Exact locators: Secs. 3-4; AppendicesI/J. [Primary text](https://arxiv.org/html/2610.07355v1).

[DERIVED] Tests released V-JEPA2, not2.1. Present proportion is over scenes. IntPhys improvement is not uniquely containment learning; source does not reproduce every earlier scoring result.

## R59.8

[PAPER-REPORTED] **V-JEPA Policy: Building Effective World-Action Models on Predictive Visual Latents.** First public 2026-09-29; inspected 2609.37250v2, dated 2026-10-10; accessed 2026-10-25. Exact locators: Secs. 3.1-3.2; Tables3/8; implementation appendices. [Primary text](https://arxiv.org/html/2609.37250v2).

[DERIVED] No candidate-action-conditioned future query is supplied by this interface. Frozen encoder is pretrained. Successful-only times and baseline recipe differences do not establish all-attempt equal-budget efficiency.

## R59.9

[PAPER-REPORTED] **ATLAS: Aligned Transport of Latent Structure for Reliable World Model Planning.** First public 2026-09-28; inspected 2609.36333v2, dated 2026-09-30; accessed 2026-10-25. Exact locators: Secs. 3-5; Tables1-3; AppendicesA/B/C.8-C.9. [Primary text](https://arxiv.org/html/2609.36333v2).

[DERIVED] OOD means a median split of expert-path novelty, not a new domain. Goals include all valid episodes. One training seed/five evaluation seeds; WEM-only Cube regression and task-alignment premise retained.

## R59.10

[OFFICIAL-DOCUMENTATION] **LeWM originating implementation.** Inspected artifact commit 8edfeb336732b5f3ce7b8b210d0ba370a09e2cac, dated 2026-05-22, accessed 2026-10-25. [Pinned originating source](https://github.com/lucas-maes/le-wm/tree/8edfeb336732b5f3ce7b8b210d0ba370a09e2cac). Exact locators: train.py; jepa.py; config/train/model/lewm.yaml; config/train/lewm.yaml. Online training target gradients, mean loss, projectors and default/paper differences. Static inspection via GitHub; no source training or model execution.

## R59.11

[OFFICIAL-DOCUMENTATION] **V-JEPA2.1 originating implementation.** Inspected artifact commit 204698b45b3712590f06245fbfba32d3be539812, dated 2026-03-23, accessed 2026-10-25. [Pinned originating source](https://github.com/facebookresearch/vjepa2/tree/204698b45b3712590f06245fbfba32d3be539812). Exact locators: app/vjepa_2_1/train.py; models/utils/masks_dist.py; configs/train_2_1/vitl16/pretrain-256px-16f.yaml. Teacher no_grad/normalization, weighted context, EMA, singleton-shape hazards and example recipe identity. Static inspection via GitHub; no source training or model execution.

## Conflicts, exclusions and unresolved evidence

[DERIVED] Paper and code defaults are not silently reconciled: LeWM's inspected config has100epochs/0.09 versus the main paper recipe's10epochs/approximately 0.1; the V-JEPA2.1 pinned example mixture is not the full VisionMix recipe. Neither checkout is claimed to reproduce the paper checkpoint. SIGReg is imported from dependencies in the LeWM path; this ledger does not claim independent inspection of every transitive implementation.

[DERIVED] Current ATLAS textv2 supersedes its earlier anonymous-code pointer; the official link is the originating GitHub repository above, whose implementation was not inspected. Fast-LeWM's seven seeds are reported as planning evaluations, not independent training runs. UWM's counterfactual target needs simulator state; JEPA-x's physical branch is training privilege. These are substantive supervision/denominator differences, not presentation details.

[DERIVED] Earlier I-JEPA, V-JEPA, V-JEPA2, DINO-WM, Dreamer, TD-MPC and predictive coding are contextual foundations/comparators owned by earlier chapters. Their appearance in a2026reference list is not a new first-publication record. No earlier work is promoted to current evidence by venue year alone.

[UNVERIFIED] Complete training environments, active checkpoint/config identity, independent evaluator behavior, physical calibration, hardware energy/cost and general deployment transfer remain unexecuted. The manuscript retains draft status. Equations and pure fixtures establish only their declared mathematical properties.
