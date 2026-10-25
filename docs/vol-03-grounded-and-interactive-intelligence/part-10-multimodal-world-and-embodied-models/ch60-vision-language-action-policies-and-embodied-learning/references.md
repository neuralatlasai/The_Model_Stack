---
id: ms.references.60
entity_type: references
title: "Chapter 60 primary evidence ledger"
volume: 3
part: 10
chapter: 60
section: null
slug: references
parent: ms.chapter.60
prev_sibling: ms.verification.60
next_sibling: null
children: []
prerequisites:
  [
    ms.chapter.18,
    ms.chapter.24,
    ms.chapter.34,
    ms.chapter.35,
    ms.chapter.36,
    ms.chapter.52,
    ms.chapter.55,
    ms.chapter.56,
    ms.chapter.57,
    ms.chapter.58,
    ms.chapter.59,
  ]
downstream: []
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [action_generation, embodied_control, predictive_representation],
    feedback_setting: [],
    modality: [image, text, video, action],
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

# Chapter60 - Primary evidence ledger

[PAPER-REPORTED] Seven retained research reports first appeared within 2026-03-01 through 2026-10-24. Actual inspection was2026-10-25. Unversioned arXiv histories were checked; latest eligible pi0.7v2 and MolmoAct2v2 supersede v1. The other five inspected records havev1. First release, revision and access dates remain distinct. Preprint status is conservative; venue year is not first release.

[OFFICIAL-DOCUMENTATION] One dated originating release and two pinned implementation artifacts supplement the reports. Source/code inspection is static. No checkpoint, robot, simulator, training, runtime compatibility or benchmark was executed by the book.

| Key    | Type          | Work                                                                              | Authors / organisation                                                                                      | Venue / year                                                                       | Primary URL                                                                                                  | Official code                                                                          | Status                 | Accessed   | Used for                                                                                                     |
| ------ | ------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| R60.1  | paper         | pi0.7: a Steerable Generalist Robotic Foundation Model with Emergent Capabilities | Physical Intelligence; Bo Ai et al.                                                                         | 2026; first public 2026-04-16; inspected 2604.15483v2, 2026-04-24                  | [inspected full text](https://arxiv.org/html/2604.15483v2)                                                   | https://www.pi.website/blog/pi07                                                       | preprint               | 2026-10-25 | Mixed-quality context, knowledge insulation, modes, subgoals and coaching/autonomy distinctions              |
| R60.2  | paper         | MolmoAct2: Action Reasoning Models for Real-world Deployment                      | Haoquan Fang; Jiafei Duan et al.; Ai2/UW                                                                    | 2026; first public 2026-05-04; inspected 2605.02881v2, 2026-05-08                  | [inspected full text](https://arxiv.org/html/2605.02881v2)                                                   | https://github.com/allenai/molmoact2                                                   | preprint               | 2026-10-25 | Action tokenizer, units/padding, detached per-layer KVs, flow objective and packed context                   |
| R60.3  | paper         | piR2: Reactive Real-time Flow Policies                                            | Sungjae Park; Shubham Tulsiani                                                                              | 2026; first public 2026-07-28; inspected 2607.26055v1, 2026-07-28                  | [inspected full text](https://arxiv.org/html/2607.26055v1)                                                   | https://github.com/pi-r2-flow/pi-r2-flow                                               | preprint               | 2026-10-25 | Fast/slow channels, per-position staircase, warm-start, in-flight action prefix and timing                   |
| R60.4  | paper         | Trust-Calibrated VLA Policy Post-Training with Evolving Imagination               | Wenzhan Li; Yiran Qin; Heng Zhou; Huirui Wang; Yulan Guo; Ruimao Zhang                                      | 2026; first public 2026-10-12; inspected 2610.16517v1, 2026-10-12                  | [inspected full text](https://arxiv.org/html/2610.16517v1)                                                   | NOT-DISCLOSED in inspected implementation account                                      | preprint               | 2026-10-25 | Simulator/proxy, measured/no-oracle residuals, schedules, replay/weighting and bounded empirical comparisons |
| R60.5  | paper         | Object-Centric Residual RL for Zero-Shot Sim-to-Real VLA Enhancement              | Kinam Kim; Namiko Saito; Heecheol Kim; Katsushi Ikeuchi; Jaegul Choo; Yasuyuki Matsushita                   | 2026; first public 2026-06-17; inspected 2606.18953v1, 2026-06-17                  | [inspected full text](https://arxiv.org/html/2606.18953v1)                                                   | See originating project; code not pinned here                                          | preprint               | 2026-10-25 | Paired teleoperation replay, object/proprio/base-action residual interface, noise/dropout and failure modes  |
| R60.6  | paper         | Taming VLAs under Robot Execution Errors: Self-Compensation and Stress Testing    | Sohyun Lee; Yoonjae Baek; Jaesang Won; Jinnyeong Kim; Hyunwoo Kang; Seung-Hwan Baek; Ivan Laptev; Suha Kwak | 2026; first public 2026-09-29; inspected 2609.37334v1, 2026-09-29                  | [inspected full text](https://arxiv.org/html/2609.37334v1)                                                   | See originating report; code not pinned here                                           | preprint               | 2026-10-25 | Residual/pseudo-target, LoRA anchor, mechanics models and chronological adaptation protocol                  |
| R60.7  | paper         | BOKBO (Best of K Bad Options): Calibrated Abstention for VLA Policies             | Anya Singh; Cabrel Happi; Jai Relan; Varun Nair; Vidyut Baradwaj                                            | 2026; first public 2026-05-28; inspected 2605.30660v1, 2026-05-28                  | [inspected full text](https://arxiv.org/html/2605.30660v1)                                                   | NOT-DISCLOSED in inspected implementation account                                      | preprint               | 2026-10-25 | Best-of-K perturbation/temperature diagnostics, selective risk and proof/force-proxy audit                   |
| R60.8  | documentation | NVIDIA Isaac GR00T N1.7 early-access release                                      | NVIDIA                                                                                                      | 2026; inspected artifact 2026-04-17; dated release, not an immutable code snapshot | [originating source](https://huggingface.co/blog/nvidia/gr00t-n1-7)                                          | https://huggingface.co/blog/nvidia/gr00t-n1-7                                          | official documentation | 2026-10-25 | Dated release distinction; not method or safety certification                                                |
| R60.9  | documentation | MolmoAct2 originating action expert                                               | allenai/molmoact2                                                                                           | 2026; inspected artifact 2026-10-02; 6070080a20321b4f498ab30f28e1d09ac465edb7      | [originating source](https://github.com/allenai/molmoact2/tree/6070080a20321b4f498ab30f28e1d09ac465edb7)     | https://github.com/allenai/molmoact2/tree/6070080a20321b4f498ab30f28e1d09ac465edb7     | official documentation | 2026-10-25 | Static shape validation, self/cross masks, padded embeddings and per-layer KVs                               |
| R60.10 | documentation | piR2 originating deployment client                                                | pi-r2-flow/pi-r2-flow                                                                                       | 2026; inspected artifact 2026-07-30; 3af52ca400a6ec7d141416879aa531a6f62f697a      | [originating source](https://github.com/pi-r2-flow/pi-r2-flow/tree/3af52ca400a6ec7d141416879aa531a6f62f697a) | https://github.com/pi-r2-flow/pi-r2-flow/tree/3af52ca400a6ec7d141416879aa531a6f62f697a | official documentation | 2026-10-25 | Static request locks, timestamp domain, streaming reset/startup and invalid option combinations              |

## R60.1

[PAPER-REPORTED] **pi0.7: a Steerable Generalist Robotic Foundation Model with Emergent Capabilities.** First public 2026-04-16; inspected 2604.15483v2, dated 2026-04-24; accessed 2026-10-25. Exact locators: Secs.III/V/VI/VII/IX; AppendicesA.B-A.G. [Primary text](https://arxiv.org/html/2604.15483v2).

[DERIVED] The subgoal CFM display prints a maximization of a quantity called loss; the chapter uses an explicit minimizing convention, not that ambiguous sign. Coaching and learned high-level autonomy have different access. Policy-only latency excludes a separate14B subgoal generator using4H100s. No universal compositional-generalization or human-equivalence claim is made.

## R60.2

[PAPER-REPORTED] **MolmoAct2: Action Reasoning Models for Real-world Deployment.** First public 2026-05-04; inspected 2605.02881v2, dated 2026-05-08; accessed 2026-10-25. Exact locators: Secs. 4.1-4.3; Sec. 6; AppendicesA/B. [Primary text](https://arxiv.org/html/2605.02881v2).

[DERIVED] One-second source-rate chunks and padded tensors are not one identical physical interface. Multiple noise samples reuse one robot trajectory. Forward-code inspection does not establish active checkpoint/recipe identity. Aggregate fine-tuning gains do not constitute dependable-use certification.

## R60.3

[PAPER-REPORTED] **piR2: Reactive Real-time Flow Policies.** First public 2026-07-28; inspected 2607.26055v1, dated 2026-07-28; accessed 2026-10-25. Exact locators: Sec. 3; Sec. 4.2/Table 1; AppendicesA.1-A.3. [Primary text](https://arxiv.org/html/2607.26055v1).

[DERIVED] AppendixA.2: method2RTXA5000 versus baselines1. Control tick25 Hz is not every inference completing in 40ms; source d=1-2ticks. H>2d is needed for the displayed ramp. Startup and delay-change transients are not free. Resource comparison is system-level, not equal-device4x.

## R60.4

[PAPER-REPORTED] **Trust-Calibrated VLA Policy Post-Training with Evolving Imagination.** First public 2026-10-12; inspected 2610.16517v1, dated 2026-10-12; accessed 2026-10-25. Exact locators: Secs. 3-4; Tables1-3; AppendicesA/B/C.2-C.5/D.4/E. [Primary text](https://arxiv.org/html/2610.16517v1).

[DERIVED] S2T-H counts outer refinement stages under a shared interaction allowance, not wall time or identical realized transitions. Three training seeds and source ports are explicit. Physical fixed-data trials do not establish online physical RL;80.0 versus77.5 intervals overlap. Proxy-bias bounds are conditional, not policy convergence/safety.

## R60.5

[PAPER-REPORTED] **Object-Centric Residual RL for Zero-Shot Sim-to-Real VLA Enhancement.** First public 2026-06-17; inspected 2606.18953v1, dated 2026-06-17; accessed 2026-10-25. Exact locators: Secs. 3-5; Tables1/2; AppendicesA.5-A.7/A.11. [Primary text](https://arxiv.org/html/2606.18953v1).

[DERIVED] Zero-shot applies to residual transfer, not all training/data/engineering. Shared labels do not prove identical base outputs or dynamics. Simulation SD and physical20trial counts have different seed meanings. Confidence-gate failures and tracker/object asset costs remain explicit. Residual-MLP time is not complete-system latency.

## R60.6

[PAPER-REPORTED] **Taming VLAs under Robot Execution Errors: Self-Compensation and Stress Testing.** First public 2026-09-29; inspected 2609.37334v1, dated 2026-09-29; accessed 2026-10-25. Exact locators: Sec. 3; Sec. 4; Tables3-6; AppendicesB.1-B.6. [Primary text](https://arxiv.org/html/2609.37334v1).

[DERIVED] Simulator delta-pose and physical absolute-joint residuals differ. Physical gripper excluded. Policy/Adam/buffer persist across 25 episodes/task and evaluated episodes also adapt. Direct residual correction regresses. Parameter anchor is not an action/safety bound.

## R60.7

[PAPER-REPORTED] **BOKBO (Best of K Bad Options): Calibrated Abstention for VLA Policies.** First public 2026-05-28; inspected 2605.30660v1, dated 2026-05-28; accessed 2026-10-25. Exact locators: Secs. 3-5; Eq.2/Theorem1; Tables4-8; AppendicesA/C. [Primary text](https://arxiv.org/html/2605.30660v1).

[DERIVED] Eq.2 uses all calibration decisions in denominator for execute-and-violate while Theorem1 claims conditional executed risk; AppendixA does not justify the conversion. Its inf over a nondecreasing-loss feasible set needs threshold-direction clarification. efc_force constraint entries and expert p99 do not automatically establish physical-force or population safety guarantees. HTML heading and abstract title differ; arXiv identity is pinned.

## R60.8

[OFFICIAL-DOCUMENTATION] **NVIDIA Isaac GR00T N1.7 early-access release.** Inspected artifact dated release, not an immutable code snapshot, dated 2026-04-17; accessed 2026-10-25. Exact locators: What is N1.7; training; deployment. [Originating artifact](https://huggingface.co/blog/nvidia/gr00t-n1-7). Dated release distinction; not method or safety certification. Static inspection only; no execution/provenance equivalence claim.

## R60.9

[OFFICIAL-DOCUMENTATION] **MolmoAct2 originating action expert.** Inspected artifact 6070080a20321b4f498ab30f28e1d09ac465edb7, dated 2026-10-02; accessed 2026-10-25. Exact locators: experiments/olmo/nn/action_expert.py. [Originating artifact](https://github.com/allenai/molmoact2/tree/6070080a20321b4f498ab30f28e1d09ac465edb7). Static shape validation, self/cross masks, padded embeddings and per-layer KVs. Static inspection only; no execution/provenance equivalence claim.

## R60.10

[OFFICIAL-DOCUMENTATION] **piR2 originating deployment client.** Inspected artifact 3af52ca400a6ec7d141416879aa531a6f62f697a, dated 2026-07-30; accessed 2026-10-25. Exact locators: deployment/mindex/policy/groot_client.py; deployment/apps/run_policy.py. [Originating artifact](https://github.com/pi-r2-flow/pi-r2-flow/tree/3af52ca400a6ec7d141416879aa531a6f62f697a). Static request locks, timestamp domain, streaming reset/startup and invalid option combinations. Static inspection only; no execution/provenance equivalence claim.

## Source contradictions and independent replacements

[MATHEMATICALLY-DERIVED] R60.7's printed calibration loss controls joint exposure q=P(A and V); conditional risk is r=q/P(A) for positive coverage. With1%coverage and every executed decision violating, q=.01,r=1. This directly invalidates deriving its stated conditional theorem from the printed joint loss alone. An inf threshold in a monotone increasing acceptance/loss family also cannot be silently treated as maximal feasible coverage. The actual implementation was not inspected, so the chapter does not claim its code necessarily follows the apparent printed direction error.

[DERIVED] The book's fixed-family IID Hoeffding construction is an independent conditional certificate with accepted-count denominator and no certificate at zero count. It is not attributed to BOKBO or to exchangeability alone. Calibration-selected thresholds/learned scorers need different arguments; adaptive trajectories need dependence-aware validation. See @ms.section.60.6 and @ms.section.62.5.

[DERIVED] R60.8 is a release description. Its production-readiness language is not empirical physical safety evidence; the current GA repository/backbone must not be conflated with April early access or with the2025N1paper. R60.9/R60.10 pin actual files but do not prove the reported checkpoint or a complete transitive environment.

## Excluded foundations and remaining work

[DERIVED] Original OpenVLA, pi0/pi0.5/pi0.6, FAST, diffusion policy, TD3 and earlier JEPA/world-model work are historical comparators/foundations linked to canonical chapters. They are not redated as new research because a2026report uses them. A pre-window public version excludes a candidate from new evidence even if its arXiv record or conference year is later; first-release ambiguity is not resolved in favor of inclusion.

[UNVERIFIED] Independent source replication, complete checkpoint/config provenance, worst-case timing, physical force interpretation, long-duration adaptation, rare severe failures and broad real-world transfer remain unresolved. No source claim or structural check changes manuscript_draft status.
