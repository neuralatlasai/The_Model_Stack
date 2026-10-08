---
id: ms.section.18.6
entity_type: section
title: Transfer and interference
short_title: Transfer and interference
volume: 1
part: 3
chapter: 18
section: 18.6
slug: 18-6-transfer-and-interference
parent: ms.chapter.18
prev_sibling: ms.section.18.5
next_sibling: ms.verification.18
children: []
prerequisites: [ms.section.18.5, ms.chapter.13]
downstream: [ms.chapter.19, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60]
related: [ms.chapter.10, ms.chapter.13]
siblings_by_mechanism: []
relations: []
axes:
  lifecycle: [pretraining, adaptation, inference, evaluation]
  mechanism: [multimodal_interfaces]
  feedback_setting: []
  modality: [text, image, audio, video, action]
papers: [P44, P45]
implementations: []
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, DERIVED, MATHEMATICALLY-DERIVED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 18.6 Transfer and interference

## Scope

Multimodal training changes a shared system under an uneven mixture of tasks, token lengths and supervision. Transfer is an improvement on a specified target evaluation attributable to the training intervention under its comparison design; interference and forgetting are corresponding adverse effects, including loss of previously measured capabilities. This section treats mixture weighting, gradient interaction, frozen-function retention, representation bottlenecks, missing modalities and evaluation controls. It does not infer transfer merely from joint training or from a shared embedding space.

## Why this exists

PAPER-REPORTED · PaLM-E reports both benefits of mixed embodied/vision-language training and degradation on inherited language evaluations. ImageBind studies transfer between modalities without requiring every modality pair in training (R18.7, §6; R18.9, §§3–5). DERIVED: a generalist can improve one endpoint while losing another. A single aggregate score cannot reveal whether modality exposure, connector compression, backbone updates or benchmark construction caused the change.

## Intuition

MATHEMATICALLY-DERIVED: sharing parameters creates a common update direction, but the losses can prefer different directions. In addition, a shared interface can discard distinctions needed by only one task. These are separate mechanisms: gradient interference is an optimization statement at a parameter state, while bottleneck insufficiency is a statement about information available through an interface. A missing input is a third issue because it changes the conditional problem rather than merely reducing training weight.

## Formulation

For modality/task mixture probabilities $\pi_m$, loss weights $\lambda_m$ and per-task risks $L_m(\theta)$,

$$
L(\theta)=\sum_m\pi_m\lambda_mL_m(\theta),\qquad \sum_m\pi_m=1. \tag{18.18}
$$

MATHEMATICALLY-DERIVED: sampling probability and loss weight appear multiplicatively in this expected-gradient expression under the declared sampling procedure, but their variance and batching effects can differ. A modality with longer sequences can dominate token-reduced training even when example counts are equal. If batches concatenate all target tokens and average token losses, an example with $n_i$ targets has weight proportional to $n_i$; averaging each example's mean gives it equal example weight. Changing the reduction denominator is therefore a change to the effective training objective.

For two task gradients $g_a=\nabla L_a$ and $g_b=\nabla L_b$, a step $\theta'=\theta-\eta g_b$ yields

$$
L_a(\theta')=L_a(\theta)-\eta g_a^{\mathsf T}g_b+O(\eta^2). \tag{18.19}
$$

This Taylor expansion requires local differentiability and control of the remainder. A negative inner product predicts a first-order increase in $L_a$ for that step. It does not prove persistent forgetting, and positive alignment does not guarantee a downstream metric improvement. Momentum, adaptive preconditioning, clipping and finite steps change the actual update; its dot product with $g_a$ is the relevant first-order quantity.

## Mechanism

### Methodology: modality exposure and mixture state

DERIVED: a mixture record needs example probabilities, modality-specific sequence lengths, supervised-token counts, loss reductions, accumulation rules and optimizer updates. Repeating a rare dataset changes exposure and overfitting risk even when its nominal mixture coefficient is unchanged. Batch composition also changes contrastive negatives, so identical expected weights need not define an identical contrastive training problem. An epoch is not a common exposure unit when datasets are resampled or mixtures draw from unequal streams.

MATHEMATICALLY-DERIVED: over $K$ independent example draws with modality probability $\pi_m$, expected example count is $K\pi_m$. If the supervised length has conditional expectation $\mathbb E[n\mid m]$, expected supervised token exposure is $K\pi_m\mathbb E[n\mid m]$. This equation distinguishes exposure from the parameter gradient, which also depends on loss values, masks and reduction. It does not justify choosing weights by token count alone. Energy and money follow the executed batches, not just this expectation.

### Methodology: forgetting and freezing

PAPER-REPORTED · PaLM-E evaluates 21 general language benchmarks relative to its inherited PaLM models. Its §6.6 prose reports relative NLG degradation of 87.3% for the 12B model and 3.9% for the 562B model; Appendix Table 8 lists 3.8% for the latter. This small source discrepancy is retained rather than resolved through guessed unrounded scores. Its robotic studies also compare mixtures and frozen/adapted language components (R18.7, §6.6, Figure 6, Appendix Table 8). DERIVED: this is a scale-associated observation in those model/training configurations, not an architecture-independent law that larger models cannot forget. Task definitions, mixtures and initialization are part of the evidence.

MATHEMATICALLY-DERIVED: freezing all parameters on an unchanged deterministic text-only path preserves that path's function. The qualifications matter: inserting active cross-attention, changing token positions, preprocessing, numerical execution or decoding can change outputs even with the original backbone parameters fixed. A frozen backbone receiving newly trained visual prefixes is intentionally evaluated on different inputs. Parameter retention and behavioral retention therefore require distinct checks.

If the entire language backbone is adapted, a retention metric must compare the same evaluation protocol before and after. Let $S_{m,0}$ and $S_{m,1}$ denote comparable scores on task $m$. The difference $S_{m,1}-S_{m,0}$ is interpretable only with the metric direction, sampling uncertainty and adaptation rules. Relative loss $(S_{m,0}-S_{m,1})/S_{m,0}$ is undefined at zero baseline and can magnify small absolute changes for weak baselines. Reporting absolute and relative changes avoids that ambiguity.

### Methodology: representation bottlenecks

MATHEMATICALLY-DERIVED: write the downstream representation as $z=C(E(x))$. If two inputs have identical $z$ but require distinct target distributions under the same remaining context, no downstream decoder using only $z$ and that context can fit both exactly. This follows because the decoder evaluates the same conditional input. The result applies to any deterministic connector, including nonlinear ones. A linear rank limit is one way to establish collisions, but width or query count alone does not identify semantic insufficiency on natural inputs.

DERIVED: a bottleneck test should distinguish encoder information, connector retention and decoder accessibility. An encoder probe can detect a property in $E(x)$ without proving that the connector preserves it. A probe on $C(E(x))$ can detect retained information without proving that the deployed language model uses it. Generated answers test the complete path. The three evaluations answer progressively different questions, not increasingly infallible ones; probe capacity, data and shortcuts must be controlled.

### Methodology: missing modalities and pairwise binding

PAPER-REPORTED · ImageBind aligns audio, depth, thermal and IMU representations with images while retaining pretrained image/text encoders. It evaluates zero-shot recognition and retrieval involving modality pairs not directly trained together, and ablates alignment, augmentations and encoder scale (R18.9, §§3–5). DERIVED: independent encoders permit computing an available modality's embedding without every other input. This does not establish that an arbitrary joint generator or controller remains calibrated when an input disappears.

MATHEMATICALLY-DERIVED: for unit vectors, cosine similarity determines Euclidean distance by $\|u-v\|^2=2-2u^{\mathsf T}v$. If $u$ and $v$ are each close to the *same* image embedding $w$, the triangle inequality bounds $\|u-v\|\leq\|u-w\|+\|v-w\|$. This is a local geometric statement. Training audio against one collection of images and depth against another does not guarantee that corresponding semantic events meet its premises. Pairwise training through images therefore supplies an empirical route to transfer, not a universal transitivity theorem.

DERIVED: a missing modality needs an explicit availability indicator or a defined missing-input path. An all-zero tensor can also be a legitimate normalized feature or silent segment; substituting zeros without a trained convention changes the conditional input ambiguously. Modality dropout is a possible training intervention, but no efficacy claim for a particular dropout policy is established by the inspected studies here. Missingness can also correlate with labels or environments; evaluating random removal alone need not cover that pattern.

## Algorithm

DERIVED: define the target and retained-task portfolio before training. Freeze the evaluation protocols and data splits. Record mixture probabilities, length distributions, token masks and component trainability. During training, retain checkpoints and all persistent sampling/optimizer state. Evaluate each endpoint with its own metric and uncertainty, including text-only, single-modality and required-joint-modality conditions where appropriate. Attribute differences only to the controlled intervention. Report unresolved component causes separately from measured package changes. The chapter's proposed controlled freeze/unfreeze protocol is specified in [Verification](verification.md), and has not been executed.

## Implementation

MATHEMATICALLY-DERIVED: per-modality step cost is not proportional to its sampling probability alone. Expected serial work per draw is $\sum_m\pi_m\mathbb E[C_m]$ under a fixed execution policy; padding and batching make actual cost depend on batch composition. Shared weights save duplicated parameter storage only relative to a specified separate-model baseline; private encoders, connectors, heads and optimizer states still consume memory. Gradient diagnostics add backward/communication work and should be measured as part of a training study rather than assumed free.

DERIVED: evaluation must preserve modality identity and missingness at the data loader boundary. Cache keys include the encoder revision, preprocessing and feature layer; otherwise a frozen-versus-adapted comparison can silently read stale features. Resource reporting separates training, model selection and evaluation. A matched ledger for FLOPs, memory traffic, communication, latency, throughput, energy and money is UNVERIFIED for a cross-paper comparison in this chapter.

## Experimental design

PAPER-REPORTED · PaLM-E's TAMP study compares input representations and mixtures, with only 320 examples per evaluated planning task in its one-percent-data condition; its tables identify whether language weights are frozen (R18.7, §6.2, Table 1). ImageBind's ablations hold other modality encoder sizes fixed while varying the image encoder, and evaluate downstream zero-shot tasks (R18.9, §5). DERIVED: these are concrete controls for their research questions. They do not jointly isolate every encoder, connector and language-backbone interaction, and proprietary/pretrained differences remain relevant to reproduction.

## Observations

PAPER-REPORTED · PaLM-E's TAMP comparison improves planning success when the ViT-4B configuration uses its full mixture rather than single-robot training, with the language model frozen in those arms (R18.7, §6.2, Table 1). DERIVED: this demonstrates the source's directional mixture-transfer result; its separately reported language-retention losses show why transfer and forgetting require separate endpoints.

DERIVED: transfer can be directional: training on one task can improve another without the reverse intervention having the same effect. Gains on joint tasks can coexist with losses on text-only tasks. Shared embeddings can support unseen-pair retrieval while failing a generation task that needs fine spatial or temporal distinctions. A source's aggregate result should therefore be decomposed by the required information, modality availability and evaluation adaptation.

## Failure modes

DERIVED: long modalities can dominate token-weighted loss; short benchmarks can hide temporal bottlenecks; an answerable-from-text benchmark can overstate visual dependence; random missingness can understate deployment-correlated missingness; and changed prompts or probes can mimic retention or forgetting. Selecting the best checkpoint separately for each task reports a portfolio of specialists rather than the performance of one retained checkpoint unless explicitly declared.

## Siblings

Chapter 6 owns general experimental identification and uncertainty. Chapters 22–24 own domain adaptation, parameter-efficient adaptation and continual learning. This section owns their multimodal consequences: exposure imbalance, interface sufficiency, missing inputs and cross-modal endpoints. Section 18.2 defines the component trainability masks used in the chapter verification.

## Extensions

### Improvements and their evidence

DERIVED: freezing a component limits its parameter change; increasing encoder coverage can improve the features available to another modality; changing mixture weights can redirect shared updates. The inspected sources evaluate particular versions of these interventions. None guarantees simultaneous improvement on every task. Improvements require task-level gains, retained-capability measurements and the corresponding resource changes under the same checkpoint-selection policy.

## Limitations

UNVERIFIED: no book experiment establishes a preferred mixture or trainability mask. NOT-DISCLOSED: the inspected studies do not supply a common, fully factorial encoder/connector/backbone comparison with identical pretrained histories. Local gradient geometry does not replace a longitudinal retention study, and probe accessibility does not prove operational use by the deployed decoder.

## Reproducibility

Retain the starting and ending checkpoints, trainability masks, mixture state, source splits, token reductions, target masks, missingness mechanism, probe/generator protocols and checkpoint-selection rules. Results are PAPER-REPORTED where cited. No new transfer, forgetting or missing-modality result is claimed for this manuscript.

## References

R18.7 §6, Appendix Table 8; R18.9 §§3–5; P45 §§3–4. See [References](references.md).
