---
id: ms.section.18.2
entity_type: section
title: Encoders and adapters
short_title: Encoders and adapters
volume: 1
part: 3
chapter: 18
section: 18.2
slug: 18-2-encoders-and-adapters
parent: ms.chapter.18
prev_sibling: ms.section.18.1
next_sibling: ms.section.18.3
children: []
prerequisites: [ms.section.18.1, ms.chapter.13]
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

# 18.2 Encoders and adapters

## Scope

An encoder converts a modality into features; a connector changes their width, number or conditioning semantics before they enter a language backbone. The training boundary may include any subset of these components. This section compares linear projection, fixed-query resampling and query-transformer adaptation, with explicit attention to gradient propagation through frozen networks. The canonical examples are the original LLaVA, Flamingo and BLIP-2 configurations; later systems sharing those names need their own revision-specific specifications.

## Why this exists

PAPER-REPORTED · LLaVA connects a frozen vision encoder to a language model with a learned projection; Flamingo learns a resampler and inserted cross-attention blocks; BLIP-2 learns a Q-Former between frozen encoders and language models (R18.5, §4; R18.2, §3; P45, §3). DERIVED: trainable parameter count does not identify the total model footprint or required backward computation. A frozen component may still lie on the derivative path needed to update an upstream connector.

## Intuition

MATHEMATICALLY-DERIVED: write $u=E_\psi(x)$, $v=C_\phi(u)$, and prediction $p=F_\theta(v,t)$ for text context $t$. With loss $\ell$, training the connector requires

$$
\nabla_\phi\ell=J_{C,\phi}^{\mathsf T}J_{F,v}^{\mathsf T}\nabla_p\ell. \tag{18.4}
$$

Holding $\theta$ fixed removes parameter updates and parameter-gradient storage for $F$; it does not remove the input Jacobian $J_{F,v}$. Detaching $v$ or executing the entire language model without input differentiation destroys this gradient. Conversely, if $E$ is frozen and no trainable computation precedes it, its outputs can be detached before $C$. The distinction is between parameter gradients and derivatives with respect to activations.

## Formulation

DERIVED: define the trainability mask $b=(b_E,b_C,b_F)\in\{0,1\}^3$ and a complete initialization record $\omega_0=(\psi_0,\phi_0,\theta_0)$. A training run is determined jointly by $b$, initialization, objective, data sampling, optimizer, schedule, numerical precision and checkpoint selection. Comparing two masks with different datasets or training budgets measures a package change. Treating frozen versus trainable as a scalar property of the whole model hides the component under intervention.

For input features $U\in\mathbb R^{n\times d_e}$, a linear projector gives $V=UW+b\in\mathbb R^{n\times d_l}$. It changes width while preserving sequence length. A resampler instead maps $n$ observations to $q$ output vectors. An attention-based instance uses learned queries $Q_0\in\mathbb R^{q\times d}$ and

$$
A=\operatorname{softmax}\!\left(\frac{(Q_0W_Q)(UW_K)^{\mathsf T}}{\sqrt{d_k}}+M\right),\qquad
V=A(UW_V), \tag{18.5}
$$

before output projection and any residual/MLP layers. This equation defines a basic cross-attention connector, not the full Flamingo or BLIP-2 network. The mask $M$ specifies which inputs are admissible. Query count limits output length; it is not a count of objects or a theorem about semantic capacity.

## Mechanism

### Methodology: linear adaptation and staged unfreezing

PAPER-REPORTED · The inspected LLaVA revision uses a linear projection of CLIP ViT-L/14 features. Its first stage trains that projection on 595,000 filtered image–caption pairs with both pretrained components frozen. Its instruction stage updates the projector and language model while retaining the frozen vision encoder; assistant responses supply the token loss (R18.5, §§4.1–4.2). DERIVED: the first stage can alter which combinations of fixed visual features the language model receives, but cannot restore distinctions absent from those features. The second stage changes the receiving model's response to the projected features and may change text-only behavior too.

MATHEMATICALLY-DERIVED: expanding width from $d_e$ to $d_l>d_e$ does not add independent linear information: $\operatorname{rank}(UW)\leq\min(\operatorname{rank}(U),\operatorname{rank}(W))$. A nonlinear projector can change the geometry available to later layers, but identical encoder outputs remain identical after any deterministic connector. Thus projector depth, feature-layer selection and backbone adaptation solve different constraints. An observed gain after changing all three does not isolate a nonlinear projection effect.

### Methodology: learned resampling

PAPER-REPORTED · Flamingo's frozen NFNet-F6 produces image features or independently encoded video frames. Its Perceiver Resampler outputs 64 learned-query vectors; its keys and values include both visual features and latent vectors (R18.2, §3.1.1). DERIVED: unlike mean pooling, Eq. 18.5 permits different queries to form input-dependent weighted combinations. Unlike full self-attention over all input features, the query side has fixed length. The source-specific latent concatenation changes the key/value set and must be included when reproducing the resampler.

MATHEMATICALLY-DERIVED: the score/value products in a basic resampler cost approximately $4qnd$ FLOPs when key and value widths equal $d$, excluding projections, heads, softmax and MLPs. If latent keys/values are appended, replace $n$ by $n+q$ for these terms. The resulting output consumes $qd_l b$ bytes at $b$ bytes per element. This moves some work into the connector while limiting later visual-conditioning length. It does not remove the encoder's dependence on resolution or frame count. Cross-attention layers inserted at multiple backbone depths incur their own query/key/value and activation costs.

### Methodology: BLIP-2's query transformer

PAPER-REPORTED · BLIP-2 uses 32 queries of width 768. Image cross-attention and query/text self-attention support three first-stage objectives with different masks: image–text contrastive alignment, image-grounded text generation, and image–text matching. A second stage projects query outputs into a frozen language model. OPT uses conditional language modeling; FlanT5 uses a text-prefix/suffix split (P45, §§3.1–3.3). DERIVED: reproducing the architecture without its masks changes the information available to each objective. In particular, contrastive text features that already attend to their paired image no longer represent an independently encoded text candidate in the same retrieval experiment.

The three masks enforce different paths. Unimodal contrastive encoding isolates the queries from the text stream. The generative configuration permits text to use visual queries and earlier text while preventing query states from reading target text. Bidirectional matching permits joint examination of a candidate pair. These are conditional-independence constraints, not interchangeable implementations of the same loss. Section 18.4 develops their objective distinctions.

PAPER-REPORTED · BLIP-2 scores contrastive pairs through the maximum query–text similarity; its matching head averages per-query two-class logits (P45, §3.2). Let $u_{iq}$ be normalized query $q$ for image $i$ and $v_j$ the normalized text feature. The contrastive score can be written

$$
s_{ij}=\max_q u_{iq}^{\mathsf T}v_j/\tau. \tag{18.5a}
$$

MATHEMATICALLY-DERIVED: with a unique maximizing query, the derivative of this score reaches that query through the maximum; ties require a declared subgradient convention. Different candidate texts can select different queries. This is distinct from averaging query vectors into one universal image descriptor. For matching logits $a_q\in\mathbb R^2$, the probability $\operatorname{softmax}(Q^{-1}\sum_{q=1}^Q a_q)$ generally differs from $Q^{-1}\sum_{q=1}^Q\operatorname{softmax}(a_q)$. The reduction order therefore belongs in a reproduction, not merely the number of queries. The symbol $Q$ denotes the query count, separately from the query index $q$.

MATHEMATICALLY-DERIVED: sharing parameters across masks couples their optimization even when the forward dependency graphs differ. The accumulated gradient is the weighted sum of each objective's gradient on the shared parameters. A first stage can therefore train a connector to support several views of the same features before the receiving language model is involved. Whether this helps a particular downstream task is empirical; the graph alone does not establish improved alignment.

### Methodology: audio encoders and mixed interfaces

PAPER-REPORTED · Qwen2.5-Omni describes separate audio and visual encoders feeding its text-generating Thinker, with speech generation handled by a distinct Talker path (R18.6, §2). DERIVED: an audio encoder trained for transcription and a codec trained for reconstruction expose different losses and output contracts. They should not share a connector solely because both can be flattened into vectors. The connector must preserve the intended frame/time association and whether it accepts continuous acoustic features or discrete code indices.

## Algorithm

DERIVED: a staged adaptation run first fixes the exact encoder output layer, normalization and token layout. Initialize and train the connector under the declared first-stage objective and trainability mask. Save a checkpoint containing all trainable states and immutable identifiers for frozen components. For the next stage, change the mask explicitly, initialize any newly required optimizer states, define the supervised target mask and run the new schedule. At inference, construct precisely the same interface; omit training-only losses without changing input serialization. A checkpoint name alone is insufficient to reconstruct these transitions.

Before each update, verify that every intended trainable component receives finite gradients and that frozen parameters remain unchanged. Zero gradients are not sufficient evidence of intentional freezing: disconnected graphs, saturated gates and masked losses can also produce them. These are methodological checks specified by the book, not executed implementation checks.

## Implementation

MATHEMATICALLY-DERIVED: parameter memory is $b_w(N_E+N_C+N_F)$ when all weights are resident at width $b_w$. Gradient and optimizer-state memory depend on the trainable subset and optimizer representation. Activation memory depends on the derivative paths and checkpoint schedule, not only the number of trainable parameters. Frozen encoder features can be cached only when preprocessing and encoder outputs remain invariant across the intended training examples; stochastic crops or encoder unfreezing invalidate a cache keyed merely by image identity. Cache storage then scales with dataset size times feature tensor size and trades encoder computation against I/O.

DERIVED: device placement must account for both forward features and backward activation gradients across the connector boundary. A split frozen language model can still require communication during differentiation with respect to its input. Latency, throughput, energy and money require the actual placement, sequence distributions, batch size and precision. Those measurements are UNVERIFIED here; a small connector does not imply a small deployment.

## Experimental design

PAPER-REPORTED · BLIP-2 compares encoder/language-model combinations and COCO retrieval-finetuning objectives, and evaluates zero-shot VQA with specified prompts and beam search. The retrieval ablation changes its finetuning losses, while zero-shot VQA uses the unadapted evaluation configuration (P45, §§4.1, 4.4, Tables 2, 6). The compared systems differ in pretrained components and data. Flamingo's architecture ablations examine conditioning and resampling choices within its own development protocol (R18.2, §4.4).

## Observations

PAPER-REPORTED · BLIP-2's ViT-g/FlanT5-XXL configuration reaches 65.0 VQAv2 test-dev accuracy, while its OK-VQA result does not exceed Flamingo-80B's reported value (P45, §4.1, Table 2). DERIVED: this supports a task-specific comparison of the reported configurations, not a universal connector ranking.

DERIVED: fixed-query length, width projection and weight freezing address distinct costs. The first limits downstream sequence size; the second reconciles dimensions; the third limits update state and constrains representational change. Their effects interact through the objective and data. A connector evaluated only through generated answers can conceal whether failures originate in visual encoding, compression, language interpretation or decoding. The verification page specifies a controlled component study to distinguish these effects without representing it as a published result.

## Failure modes

DERIVED: detaching the frozen backbone input blocks connector learning; caching under changing image transforms silently changes the training distribution; swapping the feature layer changes normalization and semantic content; query compression can merge task-relevant distinctions; and changing a Q-Former mask can leak target text. Expanding the trainable set without recording optimizer initialization changes both adaptation capacity and optimization dynamics.

## Siblings

Section 18.1 owns the meaning of each feature element. Section 18.3 owns its subsequent fusion graph. Section 18.4 owns loss functions and target masks. Section 18.6 develops the retention and interference consequences of adapting shared components.

## Extensions

### Improvements and their evidence

DERIVED: LLaVA's staged projector/backbone training, Flamingo's fixed-query visual path and BLIP-2's objective-specific query training are documented alternatives with different controls, not a single linear progression. The sources support their own ablations and evaluations. A new encoder, more queries or a trainable backbone is an improvement only relative to a specified outcome and resource boundary; additional parameters alone supply no such conclusion.

## Limitations

UNVERIFIED: no matched reproduction establishes the best connector across these source models. NOT-DISCLOSED: the papers do not supply a shared end-to-end traffic/energy/money accounting boundary. Their reported trainable counts cannot substitute for that measurement.

## Reproducibility

Record the trainability mask per stage, feature layer, query count, masks, projection dimensions, initialization, parameter dtypes, optimizer state, preprocessing and target masking. The published studies were inspected; no source implementation was pinned and executed for this chapter.

## References

P45 §§3–4; R18.2 §§3, 4.4; R18.5 §4; R18.6 §2. See [References](references.md) for the inspected full texts.
