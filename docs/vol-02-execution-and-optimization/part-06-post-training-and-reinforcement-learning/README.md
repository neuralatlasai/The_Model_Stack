---
id: ms.part.6
entity_type: part
title: Part VI — Post-Training and Reinforcement Learning
short_title: Part VI
volume: 2
part: 6
chapter: null
section: null
slug: part-06-post-training-and-reinforcement-learning
parent: ms.volume.2
prev_sibling: ms.part.5
next_sibling: ms.part.7
children: [ms.chapter.31, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36]
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
word_count_target: 500
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

VOLUME II / PART VI

# Part VI — Post-Training and Reinforcement Learning

**Principal development outcome:** Auditable supervised, preference, and reinforcement-learning pipelines.

**Navigation:** [Volume II](../README.md) · [Atlas index](../../README.md) · previous part: [Part V](../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/README.md) · next part: [Part VII](../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [31](ch31-supervised-fine-tuning-and-behavior-acquisition/README.md) | Supervised fine-tuning and behavior acquisition | 10–12, 19–24, 30 | an SFT recipe with exact target masks and template fixtures | [31.1](ch31-supervised-fine-tuning-and-behavior-acquisition/31-1-sft-objectives.md) · [31.2](ch31-supervised-fine-tuning-and-behavior-acquisition/31-2-data-families.md) · [31.3](ch31-supervised-fine-tuning-and-behavior-acquisition/31-3-conversation-semantics.md) · [31.4](ch31-supervised-fine-tuning-and-behavior-acquisition/31-4-training-choices.md) · [31.5](ch31-supervised-fine-tuning-and-behavior-acquisition/31-5-behavioral-failure-modes.md) · [31.6](ch31-supervised-fine-tuning-and-behavior-acquisition/31-6-validation-and-handoff.md) |
| [32](ch32-preferences-reward-models-verifiers-and-oversight/README.md) | Preferences, reward models, verifiers, and oversight | 02, 06, 11, 31 | a reward/verification specification and calibration study | [32.1](ch32-preferences-reward-models-verifiers-and-oversight/32-1-feedback-ontology.md) · [32.2](ch32-preferences-reward-models-verifiers-and-oversight/32-2-preference-models.md) · [32.3](ch32-preferences-reward-models-verifiers-and-oversight/32-3-reward-model-training.md) · [32.4](ch32-preferences-reward-models-verifiers-and-oversight/32-4-outcome-and-process-verification.md) · [32.5](ch32-preferences-reward-models-verifiers-and-oversight/32-5-oversight-strategies.md) · [32.6](ch32-preferences-reward-models-verifiers-and-oversight/32-6-reward-exploitation.md) |
| [33](ch33-direct-preference-optimization-and-related-objectives/README.md) | Direct preference optimization and related objectives | 02, 23, 31–32 | an objective-comparison sheet and controlled preference experiment | [33.1](ch33-direct-preference-optimization-and-related-objectives/33-1-dpo-derivation.md) · [33.2](ch33-direct-preference-optimization-and-related-objectives/33-2-reference-policy-effects.md) · [33.3](ch33-direct-preference-optimization-and-related-objectives/33-3-objective-families.md) · [33.4](ch33-direct-preference-optimization-and-related-objectives/33-4-offline-versus-online-data.md) · [33.5](ch33-direct-preference-optimization-and-related-objectives/33-5-bias-and-pathology.md) · [33.6](ch33-direct-preference-optimization-and-related-objectives/33-6-controlled-comparison.md) |
| [34](ch34-policy-gradients-ppo-and-rlhf/README.md) | Policy gradients, PPO, and RLHF | 02, 30–32 | a transparent rollout-to-update implementation specification | [34.1](ch34-policy-gradients-ppo-and-rlhf/34-1-sequential-decision-process.md) · [34.2](ch34-policy-gradients-ppo-and-rlhf/34-2-policy-gradients.md) · [34.3](ch34-policy-gradients-ppo-and-rlhf/34-3-ppo.md) · [34.4](ch34-policy-gradients-ppo-and-rlhf/34-4-rlhf-components.md) · [34.5](ch34-policy-gradients-ppo-and-rlhf/34-5-stability-and-exploitation.md) · [34.6](ch34-policy-gradients-ppo-and-rlhf/34-6-resource-accounting.md) |
| [35](ch35-verifiable-reward-rl-and-reasoning-policy-optimization/README.md) | Verifiable-reward RL and reasoning policy optimization | 11, 32–34 | a verifier-grounded RL experiment with failure analysis | [35.1](ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-1-rlvr-formulation.md) · [35.2](ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-2-group-relative-optimization.md) · [35.3](ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-3-reasoning-policy-development.md) · [35.4](ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-4-algorithmic-refinements.md) · [35.5](ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-5-what-improved.md) · [35.6](ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-6-scientific-boundaries.md) |
| [36](ch36-agent-rl-and-distributed-rollout-systems/README.md) | Agent RL and distributed rollout systems | 11, 29–30, 34–35 | a versioned environment/rollout/update architecture | [36.1](ch36-agent-rl-and-distributed-rollout-systems/36-1-agent-trajectories.md) · [36.2](ch36-agent-rl-and-distributed-rollout-systems/36-2-credit-assignment.md) · [36.3](ch36-agent-rl-and-distributed-rollout-systems/36-3-environment-infrastructure.md) · [36.4](ch36-agent-rl-and-distributed-rollout-systems/36-4-distributed-roles.md) · [36.5](ch36-agent-rl-and-distributed-rollout-systems/36-5-asynchrony-and-mismatch.md) · [36.6](ch36-agent-rl-and-distributed-rollout-systems/36-6-efficiency-and-reproducibility.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
