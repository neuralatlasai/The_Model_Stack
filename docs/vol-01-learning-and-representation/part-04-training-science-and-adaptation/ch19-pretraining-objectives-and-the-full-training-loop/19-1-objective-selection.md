---
id: ms.section.19.1
entity_type: section
title: Objective selection
short_title: Objective selection
volume: 1
part: 4
chapter: 19
section: 19.1
slug: 19-1-objective-selection
parent: ms.chapter.19
prev_sibling: null
next_sibling: ms.section.19.2
children: []
prerequisites: [ms.chapter.4, ms.chapter.6, ms.chapter.12, ms.chapter.13, ms.chapter.14, ms.chapter.15, ms.chapter.16, ms.chapter.17, ms.chapter.18, ms.frontmatter.notation]
downstream: [ms.chapter.20, ms.chapter.21, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.3]
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.torchtitan}
axes: {lifecycle: [pretraining, evaluation], mechanism: [training_loop, optimization, reproducibility], feedback_setting: [], modality: [text, code, image]}
papers: [P02, P44]
implementations: [impl.pytorch, impl.torchtitan]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 19.1 Objective selection

## Scope

The pretraining objective determines the admissible context, scored events, reduction weights, and additional parameter paths of a training recipe. Architecture specifies which conditional distributions can be evaluated; the data transform decides which ones are presented. A causal decoder can learn both continuation and infilling when the serialization changes, while a contrastive encoder learns scores over a supplied candidate set. These are distinct statistical experiments, even when every implementation invokes cross-entropy. The canonical probability constructions are in [Chapter 04](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/README.md); here they become an executable training contract. (DERIVED from that chapter's factorization and masking conditions.)

## Why this exists

A loss name leaves several scientific choices unresolved. A denoising objective requires the corruption distribution, an infilling objective requires a split and serialization distribution, and a multimodal objective requires an explicit relation between conditioning and targets. Changing these choices changes the data-generating experiment for the gradient. Treating them as interchangeable configuration flags can therefore change both the objective and the compute budget while preserving a familiar scalar named `loss`. (MATHEMATICALLY-DERIVED from Eq. 19.1.)

The training-loop representation must retain these distinctions before batching. For example, a padding mask removes positions from loss, whereas an attention mask removes paths by which information enters a representation. A position can be excluded from direct scoring and still receive a gradient through later predictions. Conversely, a correctly masked loss cannot repair an attention pattern that exposes the answer. The reference recipe consequently carries both visibility metadata and scoring metadata rather than deriving one from the other. (MATHEMATICALLY-DERIVED by the chain rule.)

## Intuition

For a transformed example, write the sum of scored losses as $s(\theta)$ and its normalization count as $n$. A microbatch contribution is $s(\theta)/n_{\mathrm{step}}$ when the intended objective is a step-wide token mean. The transform controls $s$ by changing contexts and targets; it also controls $n$ by changing how many events are scored. A loss mixture whose weights are constant before normalization need not retain the same effective gradient mixture after each component chooses a different denominator. This is a property of the objective algebra, independent of optimizer choice. (MATHEMATICALLY-DERIVED.)

## Formulation

Let $u$ denote a clean training record drawn from a specified corpus distribution $q$, and let $a$ be an augmentation or corruption draw from $q_a(\cdot\mid u)$. A deterministic transform $F$ returns model inputs, labels, visibility metadata, a binary target mask, and component identifiers. The record may contain text, code, image features, or another modality; no distribution over an unmodeled modality is implied. (MATHEMATICALLY-DERIVED definition.)

$$
\mathcal J(\theta)=\sum_{h=1}^{K_{\mathrm{obj}}}\omega_h\,
\mathbb E_{u\sim q,\,a\sim q_a(\cdot\mid u)}
\left[\mathcal L_h\big(\theta;F_h(u,a)\big)\right],
\qquad \omega_h\geq0.
$$
*(Eq. 19.1)*

Here $K_{\mathrm{obj}}$ is the number of objective components, $\omega_h$ is a declared component coefficient, and each $\mathcal L_h$ includes its own event measure and denominator. We do not silently reuse the global two-term mixing symbol $\lambda$ or the distillation temperature $\tau$ for new quantities. Finite expectations and an admissible interchange of differentiation and expectation are needed when interpreting the sampled gradient as a gradient of $\mathcal J$. (MATHEMATICALLY-DERIVED; differentiation conditions are established in §2.4.)

For categorical events, the contract identifies the vocabulary, EOS convention, label shift, valid contexts, masks, and sum-versus-mean reduction. For regression, it identifies the target coordinates and their scale: squared error in pixels and squared error in normalized latent coordinates are different objectives. For contrastive learning, it identifies positive matches, candidate construction, duplicate handling, and the score scale. Those fields define $F_h$ and $\mathcal L_h$ rather than merely documenting an implementation. (MATHEMATICALLY-DERIVED.)

## Mechanism

### Methodology: matching the objective to the modeled event

An autoregressive decoder assigns normalized next-token conditionals to a serialized sequence. The training record contains shifted inputs and labels, and its causal mask enforces the conditioning order. Raw-document pretraining can score ordinary text and boundary tokens according to the chosen document model. Conditional generation can retain a conditioning prefix in attention while scoring only the answer. Both use the same chain-rule construction, but their sampling distribution over contexts and their directly scored events differ. (MATHEMATICALLY-DERIVED; canonical derivation in §4.1.)

Denoising introduces a corruption draw. An encoder-only selected-position classifier predicts hidden labels from corrupted visible context; an encoder-decoder can reconstruct either the whole clean record or a shorter serialization of removed spans. The latter changes decoder length as well as the statistical task. T5's method replaces removed spans with sentinels and predicts those spans with matching sentinels; its comparison explicitly includes prefix language modeling, full reconstruction, and shorter-target variants. (PAPER-REPORTED: [P02], §§3.1–3.3.) The loop must save or reconstruct the corruption draw when replaying a batch, and count sentinel targets according to the implemented loss mask. (DERIVED from the transform's stochastic state.)

Infilling can preserve a decoder-only architecture while changing serialization. Prefix, middle, and suffix are drawn from a clean record; control tokens expose the prefix and suffix before the model predicts the middle. The source's PSM and SPM constructions, tokenization order, and document-versus-context transform boundary are material parts of this method. (PAPER-REPORTED: [R19.18], §3.) A recipe that permutes token IDs after tokenization is not automatically equivalent to one that splits text and retokenizes it, because token boundaries can cross the selected cut. (MATHEMATICALLY-DERIVED from non-compositional tokenization.)

Auxiliary prediction adds terms with distinct parameter paths. For multi-offset prediction, a shared trunk produces a context representation and separate heads predict later offsets from that representation. The offsets have different boundary masks: head $h$ can score a location only if its target exists within the permitted document. The original multi-token method describes sequential head forward/backward execution with gradient accumulation at the trunk to limit simultaneous vocabulary-logit storage. (PAPER-REPORTED: [R19.19], §2, Figure 2.) The loop therefore needs component counts and weights, not one scalar token count applied indiscriminately to every head. (DERIVED.)

A multimodal generative objective scores an output conditional on an image, audio segment, or other input. A contrastive objective instead classifies the paired item among a candidate set. CLIP uses normalized image and text representations with a symmetric cross-entropy over pairwise similarities. (PAPER-REPORTED: [P44], §2.3, Figure 3.) Increasing an ordinary language-model microbatch can preserve the event definition; increasing a contrastive candidate batch changes the denominator inside each event. Gradient accumulation over independent small contrastive batches consequently does not recreate one large contrastive batch. The missing cross-batch negatives are mathematical terms, not a numerical rounding difference. (MATHEMATICALLY-DERIVED.)

### Objective weighting and directly scored events

For component $h$, let $s_h$ be its summed loss over the optimizer-step batch and $n_h>0$ its valid-event count. Then

$$
\mathcal L_{\mathrm{step}}=\sum_h\omega_h\frac{s_h}{n_h},
\qquad
\nabla_\theta\mathcal L_{\mathrm{step}}=\sum_h\frac{\omega_h}{n_h}\nabla_\theta s_h.
$$
*(Eq. 19.2)*

This construction gives each component its declared mean and then applies its coefficient. Dividing $\sum_h\omega_hs_h$ by $\sum_hn_h$ instead weights a component in proportion to its event count. Neither expression is universally correct; they implement different specified mixtures. A zero-count component contributes no measured mean and requires an explicit branch. Replacing its denominator by one may be a safe implementation of a zero summed contribution, but it must not turn an absent component into a reported zero loss. (MATHEMATICALLY-DERIVED.)

```figure
id: fig-19.2
kind: calculator
title: Component means and pooled-event weighting
caption: >-
  Two components with different valid-event counts receive different effective
  weights when their sums are pooled. The defaults are an analytical example,
  not losses measured from a model.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-19.2
alt: >-
  With 100 events at loss 2 and 20 events at loss 4, an equal mixture of
  component means is 3, while the pooled-event mean is 280 divided by 120,
  or about 2.333. Equal event counts make these two expressions agree.
spec:
  tex: L_{mix}=(s_1/n_1+s_2/n_2)/2
  equation: "19.2"
  inputs:
    - {symbol: n1, label: component one events, default: 100, min: 1, max: 10000, format: integer}
    - {symbol: n2, label: component two events, default: 20, min: 1, max: 10000, format: integer}
    - {symbol: l1, label: component one mean, default: 2, min: 0, max: 20}
    - {symbol: l2, label: component two mean, default: 4, min: 0, max: 20}
  outputs:
    - {symbol: mixture, label: equal component mixture, formula: (l1+l2)/2, emphasis: true}
    - {symbol: pooled, label: pooled-event mean, formula: (n1*l1+n2*l2)/(n1+n2)}
```

## Algorithm

**Algorithm 19.1 — Construct a training record.** Input: a versioned clean record, objective identifier, transform configuration, and augmentation RNG state. Output: inputs, targets, visibility metadata, per-component masks/counts, and the next augmentation state. This is a mathematical reconstruction of the contract rather than a claim of an executed trainer. (DERIVED.)

[DERIVED] Let $u$ be the record, $r$ the augmentation RNG state, $\chi$ the versioned objective configuration, $\mathsf V$ the record validator, $\mathsf D$ the configured stochastic draw, $\mathsf F$ the declared transform, and $\mathsf A$ its alignment check. The visible-position relation $v$ and scoring masks $m_h$ are distinct outputs of $\mathsf F$; $\bot$ denotes a rejected record.

$$
\begin{aligned}
1.\quad &\neg\mathsf V(u,\chi)\ \Longrightarrow\ \operatorname{return}(\bot,r).\\
2.\quad &(h,a,r^+)\gets\mathsf D(u,\chi,r).\\
3.\quad &(x,y,v,(m_j)_j)\gets\mathsf F_h(u,a;\chi).\\
4.\quad &\neg\mathsf A(x,y,v,(m_j)_j;\chi)
 \ \Longrightarrow\ \operatorname{return}(\bot,r^+).\\
5.\quad &n_j\gets\sum_t m_{jt},\quad
 \mathcal H^+\gets\{j:n_j>0\}.\\
6.\quad &\operatorname{return}
 (x,y,v,(m_j,n_j)_j,\mathcal H^+,\operatorname{id}(u,\chi),r^+).
\end{aligned}
$$

[DERIVED] Alignment in line 3 includes the objective-specific label shift exactly once. Both rejection branches terminate immediately; any external replacement policy must bound the number of attempts. The returned RNG state records draws even when an aligned candidate is rejected, so a replay policy can specify whether to restore or consume them.

The invariant is that every scored target has exactly the intended admissible context. Termination follows from a bounded input record and bounded transform; repeated rejection requires a bounded data policy rather than an unbounded retry loop. The transform is linear in processed text/token count when its chosen tokenizer and sampling algorithm have that cost; no general complexity bound for an arbitrary tokenizer is asserted. (MATHEMATICALLY-DERIVED.)

## Implementation

**PyTorch**, the Framework layer, executes the model, objective reduction, and autograd. **TorchTitan**, the Distributed training layer, provides a concrete inspected loss interface: summed cross-entropy can be divided by supplied global objective counts. Its pinned trainer gathers loss and routing counts across all microbatch groups before forward/backward. (OFFICIAL-DOCUMENTATION: [R19.2], `Trainer.train_step`; [R19.3], `BaseLoss` and `CrossEntropyLoss`.) The source inspection establishes interface behavior; this chapter does not claim to have executed that revision.

For causal categorical training, inputs/labels/masks have shape `[B,T]`, hidden states `[B,T,d_model]`, and an unfused full output tensor `[B,T,V]`. The output alone occupies $BTVb_{\mathrm{logit}}$ bytes. Selected scoring can reduce output work only if the implementation actually gathers selected hidden states before projection; a mask applied after full projection leaves that allocation and its matrix multiplication intact. Multi-head objectives add head parameters and projection work, even when serial execution limits simultaneous activation storage. (MATHEMATICALLY-DERIVED accounting.)

Image processing, corruption, and serialization contribute host work and data transfer. Single-device execution has no inter-rank communication. Contrastive distributed candidate exchange and sharded vocabulary reductions have distinct communication costs; they are handed to Chapters 18 and 29 rather than conflated with local accumulation. Energy and monetary costs require measured power and allocated device/storage time and are NOT-DISCLOSED for the book's unexecuted recipe.

## Experimental design

### Reported experiments

T5's baseline uses a roughly 220M-parameter encoder-decoder, C4 pretraining for 524,288 steps, maximum length 512, and batch size 128, followed by task-specific fine-tuning. Its controlled objective comparisons change one aspect of the pipeline at a time and report downstream task scores, not just reconstruction loss. (PAPER-REPORTED: P02, §3.1 and Tables 4–7.)

The FIM study trains paired ordinary/FIM model series from 50M to 6.9B parameters for 100B tokens in code and natural language, and evaluates continuation plus infilling. Its context-versus-document transform ablation uses sampling benchmarks in addition to loss. (PAPER-REPORTED: R19.18, §§1.1, 4.4.) These are source studies; there is no book-authored objective ablation on this page.

## Observations

**What the paper claims.** T5 favors denoising over its language-modeling and deshuffling alternatives in the tested transfer setup, with smaller differences among denoising variants. The FIM study reports similar continuation performance while adding infilling capability in its tested paired runs. (PAPER-REPORTED: P02, §3.3.5; R19.18, Figures 1–2.)

**What the evidence shows.** The comparisons support their stated architectures, data budgets, transforms, and evaluation tasks. They do not identify a universally optimal objective across encoder-only, decoder-only, encoder-decoder, and multimodal families. (DERIVED from the experimental interventions.)

**What we infer.** Objective selection and implementation budgeting must be solved together: a shorter decoder target changes attention and output-projection work, and a changed candidate set changes the contrastive event itself. (MATHEMATICALLY-DERIVED from the constructions above.)

**What remains unknown.** The cited sources do not disclose a single matched contemporary experiment covering every objective family under identical hardware, data, compute, and inference requirements. Such a cross-family optimum is NOT-DISCLOSED.

## Failure modes

A label shift applied twice predicts the wrong future position. A leaked target can lower loss without learning the intended conditional. A corruption mask reused as an attention mask can remove necessary context. Packed-document targets can cross boundaries accidentally. A contrastive duplicate can become a false negative. Auxiliary heads can silently score nonexistent offsets. Each failure changes $F$ or the event measure in Eq. 19.1; a smooth loss trajectory alone cannot distinguish it from a valid objective. (MATHEMATICALLY-DERIVED.)

## Siblings

Continuation preserves the original token order; infilling changes the order so a future suffix becomes available conditioning. Selected-position denoising exposes corrupted bidirectional context, while encoder-decoder reconstruction introduces a separate autoregressive target sequence. Auxiliary prediction retains the base event and adds gradient paths with separate counts. Contrastive alignment changes the modeled event to a pairing decision among candidates; multimodal generation instead retains an output likelihood conditional on non-text input. Their canonical mechanisms are developed in §§4.1–4.5 and Chapter 18. (DERIVED from those explicit event definitions.)

## Extensions

### Documented improvements and their boundary

T5's span reconstruction reduces target length relative to full reconstruction; its selected span lengths have closely matched downstream scores in the reported setup. The FIM context-level transform improves sampling outcomes over document-level transformation despite a small loss difference. Multi-token prediction limits logit residency by serializing head backward passes. (PAPER-REPORTED: P02, §§3.3.2–3.3.4; R19.18, §4.4; R19.19, §2.) These are distinct improvements to event construction, training representation, and execution. None establishes that all extra objectives have zero compute or zero parameter cost.

## Limitations

Eq. 19.1 describes a specified training distribution and finite loss components; it supplies no theorem about downstream capability. Matching a likelihood to a desired interface is necessary for that probability model, but generalization also depends on data, architecture, capacity, and optimization. A single-device reference establishes local semantics, while large contrastive candidate sets and model-sharded objectives require additional distributed contracts. (MATHEMATICALLY-DERIVED; distributed details are outside this section's accounting boundary.)

## Reproducibility

The objective record retains corpus and tokenizer revisions, transform boundary, split/corruption law, special-token IDs, attention layout, target masks, denominators, component weights, and auxiliary-head identities. References were inspected on 2026-10-08; TorchTitan code is pinned to `dd4d4830c121aa5dc73ffeee85b1a5009bf91122`, while paper revisions are recorded individually. No default setting is promoted to a universal recipe. Unexecuted objective checks belong to [verification.md](verification.md).

## References

[P02](references.md#p02), [P44](references.md#p44), [R19.2](references.md#r192), [R19.3](references.md#r193), [R19.18](references.md#r1918), [R19.19](references.md#r1919).
