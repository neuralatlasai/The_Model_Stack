---
id: ms.section.18.4
entity_type: section
title: Learning objectives
short_title: Learning objectives
volume: 1
part: 3
chapter: 18
section: 18.4
slug: 18-4-learning-objectives
parent: ms.chapter.18
prev_sibling: ms.section.18.3
next_sibling: ms.section.18.5
children: []
prerequisites: [ms.section.18.3, ms.chapter.13]
downstream: [ms.chapter.19, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60]
related: [ms.chapter.10, ms.chapter.13]
siblings_by_mechanism: []
relations: []
axes:
  lifecycle: [pretraining, adaptation, inference, evaluation]
  mechanism: [multimodal_interfaces]
  feedback_setting: []
  modality: [text, image, audio, video, action]
papers: [P44, P45, P47]
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

# 18.4 Learning objectives

## Scope

Multimodal objectives select which distinctions the representation must support. Contrastive pairing, conditional sequence likelihood, pixel reconstruction and prediction of learned latent targets differ in targets, available information and optimization state. A modality or architecture does not determine its loss. This section gives the loss definitions, derives their local gradients or statistical consequences, and separates their published evaluation protocols.

## Why this exists

PAPER-REPORTED · CLIP learns paired image/text embeddings; MAE predicts masked pixels; V-JEPA 2 predicts masked latent representations; BLIP-2 combines several image/text objectives before conditioning a language model (P44, §2; R18.8, §3; P47, §2.1; P45, §3). DERIVED: reconstruction quality, retrieval accuracy and conditional answer quality measure different properties. The target definition and evaluation adaptation must accompany an objective comparison.

## Intuition

MATHEMATICALLY-DERIVED: two losses can assign different gradients to the same representation because they condition on different observed variables or penalize different errors. Matching a paired caption among candidates need not model every word of the caption. Predicting a missing patch need not distinguish that image from every other batch member. Predicting a teacher feature does not require a decoder that recreates pixels. None of these implications establishes a universal ordering of semantic quality.

## Formulation

For $B$ paired examples, let normalized image/text features be $u_i,v_i$ and $s_{ij}=u_i^{\mathsf T}v_j/\tau$, $\tau>0$. Symmetric contrastive cross-entropy is

$$
L_{\rm con}=-\frac1{2B}\sum_i\left[\log\frac{e^{s_{ii}}}{\sum_j e^{s_{ij}}}+\log\frac{e^{s_{ii}}}{\sum_j e^{s_{ji}}}\right]. \tag{18.10}
$$

PAPER-REPORTED · This is CLIP's paired, in-batch classification construction (P44, §2.3). MATHEMATICALLY-DERIVED: defining row probabilities $p_{ij}$ and column probabilities $q_{ij}$ gives

$$
\frac{\partial L_{\rm con}}{\partial s_{ij}}=\frac{p_{ij}+q_{ij}-2\mathbf1[i=j]}{2B}. \tag{18.11}
$$

The gradient pulls the labeled pair relative to its batch alternatives. A semantically compatible off-diagonal caption is still a negative in this labeling scheme. An image with several valid descriptions therefore requires either accepting that sampling construction or modifying the target relation; semantic validity cannot be recovered from the diagonal index alone. Temperature changes both softmax concentration and the derivative with respect to unscaled dot products. It is not merely an inference calibration parameter when trained jointly.

For conditional generation of target tokens $y$ from modalities $x$, context $c$ and target mask $m_\ell$,

$$
L_{\rm gen}=-\frac{1}{Z}\sum_\ell m_\ell\log p_\theta(y_\ell\mid y_{<\ell},x,c),\qquad Z=\sum_\ell m_\ell>0. \tag{18.12}
$$

The denominator here is a declared per-example token normalization. A dataset-level average over tokens or examples is a different weighting scheme. The target mask determines which predictions contribute loss; attention masks determine which inputs those predictions can read. They are different objects.

## Mechanism

### Methodology: contrastive alignment and zero-shot evaluation

PAPER-REPORTED · CLIP trains image/text encoders on 400 million collected pairs with a symmetric loss and learned logit scale. Its zero-shot classifier encodes descriptions of candidate classes; its study also evaluates linear probes and natural distribution shifts (P44, §§2–3, Appendix A). DERIVED: zero-shot here means no target-dataset classifier training for that protocol, not absence of related concepts in pretraining. Prompt templates and ensembling define the class vectors and are part of the evaluation method.

MATHEMATICALLY-DERIVED: for normalized class vectors $v_c$, the decision is $\arg\max_c u^{\mathsf T}v_c$. Multiplying all logits by the same positive scale preserves that argmax but changes probabilities and cross-entropy. Averaging several description embeddings and then renormalizing changes the direction and can change the classifier. A linear probe instead learns weights from labeled target examples and may use different features. These procedures answer different transfer questions; their scores cannot be merged as repeated measurements of one fixed classifier.

### Methodology: conditional generation and target masking

PAPER-REPORTED · LLaVA applies autoregressive loss to assistant responses in serialized multimodal instruction dialogues; BLIP-2's generative stage conditions a frozen language model on projected queries (R18.5, §4.2; P45, §3.3). DERIVED: setting image-prefix loss weights to zero does not remove the influence of visual inputs on answer loss. Gradients still reach image/connector states through attention paths used by the answer predictions, subject to trainability and graph detachment.

MATHEMATICALLY-DERIVED: Eq. 18.12 is a teacher-forced factorization: the observed earlier target tokens are supplied when evaluating each conditional term. At inference, earlier tokens are generated and the conditioning distribution changes. A low training loss therefore neither guarantees correct free-running sequences nor identifies whether the model relied on visual evidence rather than correlated text. A prompt-only baseline, counterfactual input or controlled ablation can test that reliance, but those are additional measurements rather than consequences of likelihood optimization.

### Methodology: masked pixel prediction

PAPER-REPORTED · MAE randomly removes a large fraction of patch tokens before its encoder, uses a lightweight decoder with mask tokens and restored positions, and evaluates mean-squared reconstruction loss only on masked patches. Its study compares pixel targets, patch-normalized pixels and discrete targets, then evaluates representations through fine-tuning and linear probing (R18.8, §§3–4). DERIVED: masking changes encoder input count; it is not equivalent to replacing every missing patch with a token inside the expensive encoder.

For visible index set $V$ and masked set $M$, write

$$
L_{\rm pix}=\frac1{|M|}\sum_{j\in M}\|D_\phi(E_\theta(x_V),j)-x_j\|_2^2. \tag{18.13}
$$

MATHEMATICALLY-DERIVED: with fixed representation/context and unrestricted predictor, the conditional mean minimizes expected squared error when the second moment exists. This follows by writing $X=\mathbb E[X\mid C]+\epsilon$, expanding the square and using $\mathbb E[\epsilon\mid C]=0$. Averaging plausible pixel configurations can therefore minimize the objective without producing a sharp sampled image. This is a property of squared-error point prediction, not a claim that every MAE output is blurred or that its encoder lacks useful features.

If a fraction $r$ is removed, the encoder's dense attention score term changes from $n^2$ to $(1-r)^2n^2$, ignoring integer rounding. At $r=0.75$, that term is one sixteenth of the unmasked term. Projection/MLP terms scale differently and the decoder still processes restored positions; total training cannot be declared sixteen times faster from this ratio.

### Methodology: prediction in a learned latent space

PAPER-REPORTED · V-JEPA 2 trains an encoder/predictor to regress masked video representations using L1 loss against an exponential-moving-average target encoder. Its action-conditioned stage freezes the video encoder and learns a new predictor from video features, actions and end-effector states (P47, §§2.1, 3). DERIVED: the target space and its update rule are optimization state. They must be reproduced alongside the online parameters; copying only the online encoder omits part of the training procedure.

A schematic target update is $\bar\theta\leftarrow\mu\bar\theta+(1-\mu)\theta$. With stopped target gradients, a masked latent loss has the form

$$
L_{\rm lat}=\frac1{|M|}\sum_{j\in M}\|P_\phi(E_\theta(x_V),j)-\operatorname{sg}(E_{\bar\theta}(x)_j)\|_1. \tag{18.14}
$$

MATHEMATICALLY-DERIVED: for fixed targets and scalar L1 prediction, a conditional median is an optimum; nonuniqueness is possible. Because the teacher evolves during training, this fixed-target characterization is not a complete convergence analysis. Stop-gradient prevents direct differentiation into the target branch; it is not by itself a theorem that all collapsed representations are impossible. Source performance and ablations supply evidence about the actual training recipe.

### Methodology: reconstruction and quantized state

PAPER-REPORTED · EnCodec combines reconstruction, adversarial and feature-matching terms, and balances training losses through their gradient scales; residual quantization uses a straight-through encoder path and codebook updates (R18.4, §§3.2–3.4). DERIVED: a finite index selection is nondifferentiable at code boundaries. The surrogate derivative used for training is an algorithmic choice and must not be described as the exact derivative of nearest-neighbor selection. Waveform quality depends on the decoder and losses as well as codebook rate.

## Algorithm

DERIVED: for each batch, construct the observed/target partition and attention masks before the forward pass. Compute target features with the declared teacher state and stop-gradient policy, or compute pixel/token targets using the declared preprocessing. Evaluate each loss with its explicit normalization. Accumulate weighted gradients over shared parameters; update online parameters, codebooks and teacher state in their declared order. Save all persistent optimization state. During evaluation, use the source's specified probe, classifier or generator; a different adaptation procedure changes the question being measured.

## Implementation

MATHEMATICALLY-DERIVED: contrastive training includes an all-pairs batch similarity matrix; distributed training also needs the relevant remote embeddings and gradient semantics. Masked encoding reduces the visible sequence length but adds target/decoder work. Teacher-based latent training stores target parameters and executes a target forward path without its backward pass. Conditional generation retains the conditioning state needed by target predictions. None of these costs is represented by a single trainable-parameter count. Achieved memory traffic, latency, throughput, energy and monetary cost remain UNVERIFIED for a common workload.

## Experimental design

PAPER-REPORTED · MAE's ImageNet study separates full fine-tuning, partial fine-tuning and linear probing; its target/masking ablations show that sharper reconstruction or lower reconstruction loss need not identify the best downstream representation (R18.8, §4). V-JEPA 2 evaluates frozen representations using attentive probes across six appearance/motion tasks and separately evaluates video-language adaptation and action-conditioned planning (P47, §§2.2, 5–7). These are different endpoints. A planning success result cannot be attributed to masked pretraining alone without considering the subsequent predictor and planner.

## Observations

PAPER-REPORTED · MAE's grid-sampling ablation produces sharper reconstructions and lower reconstruction loss but weaker downstream representation quality than its random-sampling configuration (R18.8, §4.1, Figure 6). DERIVED: optimizing or inspecting the reconstruction endpoint cannot substitute for the intended representation evaluation.

DERIVED: each loss imposes a partial requirement. Contrastive pairing distinguishes sampled alternatives; generation models conditional token distributions; reconstruction predicts chosen source coordinates; latent prediction matches a learned target space. Combining them adds gradient paths and weights, not an automatic proof that the representation satisfies every downstream task. Loss normalization and available context are part of the mechanism.

## Failure modes

DERIVED: false-negative pairings, target leakage, an incorrect loss mask, stale teacher state, unmatched normalization and codebook collapse can alter the trained problem. Evaluating a reconstruction decoder as if it were a generative sampler or equating probe accuracy with a fixed pretrained classifier changes the estimand. These errors require separate diagnostics.

## Siblings

Chapter 19 owns the general pretraining loop. This section owns the modality-specific targets and conditional graphs. Sections 18.2–18.3 define the paths through which these gradients flow; Section 18.6 owns mixed-task weighting and retention.

## Extensions

### Improvements and their evidence

DERIVED: MAE's asymmetric visible-token encoder reduces an identified computation term; V-JEPA 2 changes the prediction target to learned video features; BLIP-2 stages discriminative and generative objectives around fixed pretrained components. Their reported evaluations establish benefits within their respective protocols. They are alternatives for different targets, not a universal chronology in which a newer loss supersedes the earlier one.

## Limitations

UNVERIFIED: no shared source experiment holds data, architecture, training compute and evaluation adaptation fixed across all objectives. The statistical minimizer derivations assume fixed conditional targets and sufficient moments where stated; they do not prove convergence or task sufficiency of jointly learned encoders.

## Reproducibility

Record positive-pair construction, negative pool, temperature rule, target mask, reduction denominator, teacher initialization/update, codebook updates, augmentation, target normalization and evaluation adaptation. No training or reproduction was executed for this chapter.

## References

P44 §§2–3; P45 §3; P47 §§2–3, 5–7; R18.4 §3; R18.5 §4; R18.8 §§3–4. See [References](references.md).
