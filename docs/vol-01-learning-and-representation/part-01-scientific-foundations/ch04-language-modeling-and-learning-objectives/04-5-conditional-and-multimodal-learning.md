---
id: ms.section.4.5
entity_type: section
title: Conditional and multimodal learning
short_title: Conditioning and contrast
volume: 1
part: 1
chapter: 4
section: 4.5
slug: 04-5-conditional-and-multimodal-learning
parent: ms.chapter.4
prev_sibling: ms.section.4.4
next_sibling: ms.section.4.6
children: []
prerequisites: [ms.section.4.1, ms.section.4.2, ms.section.2.3]
downstream: [ms.section.18.4, ms.section.31.1, ms.section.55.2, ms.section.56.2, ms.section.58.2, ms.section.59.2, ms.section.60.2]
related: [ms.section.10.5]
siblings_by_mechanism: [ms.section.4.1, ms.section.4.2, ms.section.4.3]
relations:
  - {type: supported_by, target: paper.P44}
  - {type: supported_by, target: paper.P01}
  - {type: variant_of, target: concept.likelihood-objective}
axes: {lifecycle: [pretraining, adaptation], mechanism: [objective, conditioning, contrastive], feedback_setting: [], modality: [text, image, audio, action]}
papers: [P01, P44]
implementations: []
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 4.5 Conditional and multimodal learning

## Scope

Conditional generation extends the model's context from a text prefix to documents, images, audio, actions, or environment observations while retaining an explicitly defined target distribution. The conditioning representation can consume compute and receive gradients even when it bears no direct prediction loss. Contrastive encoders instead compare examples within a declared candidate set; the candidate count and the return of remote candidate gradients are part of a distributed implementation's mathematical specification. Discrete action classification and continuous action regression also require different loss units. (PAPER-REPORTED; P44 section2.3; R4.18 method; R4.19 sections3-4; R4.21 section3.)

Boundaries: encoders, adapters, and fusion are owned by Chapter 18; modality-specific systems by Part X.

## Why this exists

Conditioning can be a document, image, audio recording, return/state/action history, or environment observation. Naming the modality does not specify the learning problem. A system may generate a target sequence, choose one label, align two encoders, or predict a continuous action. The interface, target space, visibility, and loss units determine what is learned and which computations are required (DERIVED).

CLIP, Whisper, LLaVA, and Decision Transformer supply distinct published constructions. Their methods cannot be collapsed into a token-loss row merely by calling every input context: CLIP discriminates paired embeddings, Whisper generates task-conditioned token sequences, LLaVA conditions a language decoder on projected image features, and Decision Transformer uses an action-space-dependent prediction loss (PAPER-REPORTED: P44 section 2.3; R4.18 section 2; R4.19 section 3; R4.20 section 3).

## Intuition

An answer-only mask removes the direct loss on conditioning positions. It does not detach their representations: the answer loss can differentiate through attention to the conditioning encoder, projection, and prompt representations. Freezing parameters or detaching a tensor is an independent implementation choice (MATHEMATICALLY-DERIVED).

A contrastive row instead normalizes a match score over a declared candidate set. Changing the candidate set changes the objective, including its chance-level loss. A finite-label classifier can sample labels from its categorical distribution; it simply does not define an autoregressive sampler over an unrestricted target sequence. Continuous action regression has different units again and cannot be relabeled token cross-entropy.

## Formulation

> **Definition — Conditional generative objective.** The application of Eq. N.2 to targets x with conditioning c entering through prefix tokens, cross-attention memory, or state. The response-only row here excludes direct conditioning-token losses; a joint model may also score conditioning tokens.

$$
\mathcal{L}_{\text{gen}}(\theta) = -\frac{\sum_{t} m_t \log p_\theta(x_t \mid x_{<t}, \phi(c))}{\sum_t m_t},\qquad \phi = \text{conditioning encoder / adapter}
$$
*(Eq. 4.12)* where φ(c) is the encoded conditioning in the decoder's representation space; the softmax at each t runs over the target vocabulary V.

> **Definition — Discriminative objective.** An objective whose softmax (or scoring) runs over a finite candidate set 𝒴 rather than over sequences, p_θ(y | c) for y ∈ 𝒴, with a categorical distribution over labels; this does not define an unrestricted sequence sampler.

The contrastive alignment objective is owned by [§18.4 Learning objectives](../../part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/18-4-learning-objectives.md); recalled here in one sentence: a discriminative objective in which the candidate set is the other elements of the batch: for B_c paired samples (a_i, b_i), maximise the scores of the B_c matched pairs against the B_c² − B_c unmatched pairs.

For encoders f_a, f_b with ℓ₂-normalised outputs and learned temperature τ_c > 0:

$$
\mathcal{L}_{\text{con}} = \frac{1}{2B_c}\sum_{i=1}^{B_c}\left[-\log\frac{e^{s_{ii}/\tau_c}}{\sum_{j} e^{s_{ij}/\tau_c}} - \log\frac{e^{s_{ii}/\tau_c}}{\sum_{j} e^{s_{ji}/\tau_c}}\right],\qquad s_{ij} = f_a(a_i)^\top f_b(b_j)
$$
*(Eq. 4.13)* where B_c = pairs in the global batch, s_ij = cosine similarity, τ_c = temperature (local symbol; distinct from the distillation τ of notation). This is the symmetric cross-entropy of P44 written out (PAPER-REPORTED · P44 §2.3 for the form; the equation transcription is DERIVED).

```figure
id: fig-4.26
kind: calculator
title: The contrastive candidate set and its chance-level loss
caption: >-
  Eq. 4.13 with every s_ij equal (as at a symmetric start) reduces to ln N_g
  per row, where N_g = W·B_local is the candidate set after cross-rank gathering.
  The per-device batch B_local is held fixed in the states below; only the number of
  gathered ranks W changes, and with it the loss value that means chance.
  Batch sizes are illustrative, not P44's.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.13", P44]
alt: >-
  Calculator for Eq. 4.13 over the gathered candidate set. Inputs: local
  pairs per rank B_local and data-parallel ranks W. Outputs: candidates per row
  N_g = W·B_local; negatives per row N_g − 1; similarities scored per rank and
  direction B_local·N_g; negatives in the global matrix N_g² − N_g; and the loss at
  uniform similarity, ln N_g nats. At B_local = 256 and W = 1 (illustrative): 256
  candidates, 255 negatives per row, 65,536 similarities, 65,280 negatives,
  ln 256 = 5.545 nats. At W = 8: 2,048 candidates, a [256, 2,048] block per
  rank, 7.625 nats. At W = 32: 8,192 candidates, 9.011 nats.
spec:
  tex: >-
    \mathcal{L}_{\text{con}}\big|_{s_{ij}\ \text{equal}} = \ln N_g,\qquad
    N_g = W B_local,\qquad \text{negatives per row} = N_g - 1
  equation: "4.13"
  inputs:
    - { symbol: B_local, label: "local pairs per rank, B_local", default: 256, min: 8, max: 4096, scale: log2, format: integer }
    - { symbol: W, label: "data-parallel ranks gathered, W", default: 1, min: 1, max: 64, scale: log2, format: integer }
  outputs:
    - { symbol: Ng, label: "candidates per row, N_g = W·B_local", formula: "W*B_local", format: integer }
    - { symbol: neg, label: "negatives per row, N_g − 1", formula: "Ng - 1", format: integer }
    - { symbol: blk, label: "similarities per rank and direction, B_local·N_g", formula: "B_local*Ng", format: integer }
    - { symbol: allneg, label: "negatives in the global matrix, N_g² − N_g", formula: "Ng^2 - Ng", format: integer }
    - { symbol: L0, label: "loss at uniform similarity, ln N_g (nats)", formula: "ln(Ng)", format: fixed3, emphasis: true }
states:
  - { anchor: formulation, label: "one device, B_local = 256", variables: { B_local: 256, W: 1 }, highlight: [Ng, L0], note: "Each row's softmax runs over the 256 candidates of the batch; at uniform similarity the loss is ln 256 = 5.545 nats. The batch size sits inside the objective." }
  - { anchor: mechanism, label: "sharded over W = 4", variables: { B_local: 256, W: 4 }, highlight: [Ng, neg], note: "The negatives are the batch: with the batch sharded over 4 ranks, cross-rank candidate exchange keeps each row's candidate set at W·B_local = 1024 (1023 negatives) rather than the 256 on one rank." }
  - { anchor: algorithm, label: "W = 8 ranks, gathered", variables: { B_local: 256, W: 8 }, highlight: [Ng, blk, L0], note: "After all_gather the candidate set is W·B_local = 2048: each rank scores a [256, 2048] block per direction and the chance-level loss rises to 7.625 nats." }
  - { anchor: failure-modes, label: "W = 32, same local B_local", variables: { B_local: 256, W: 32 }, highlight: [L0], note: "Batch-size aliasing: identical per-device batches, but the chance level is ln 8192 = 9.011 nats; loss values from different cluster sizes do not share an axis." }
```

$$
\mathcal{L}_{\text{action}} = -\frac{\sum_{t} m_t \log p_\theta(a_t \mid \hat{R}_{\le t}, s_{\le t}, a_{<t})}{\sum_t m_t}
$$
*(Eq. 4.14)* where a_t = discretised action, s_t = state/observation, R̂_t = return-to-go; the discrete-action case of the return-conditioned sequence model; R4.20 uses MSE for continuous actions (PAPER-REPORTED · R4.20 for the conditioning set; the mask statement is the book's ledger transcription, DERIVED).

## Mechanism

### Methodology

Specify c and the target first. For a retrieved document, c can be tokenized into a known prefix with a response-only scoring mask. For an image, an encoder can produce features mapped into the decoder's embedding space. For audio, an encoder can supply cross-attention memory and task/language tokens can select the requested output. In each case, record which modules are trained, which visibility is permitted, and which conditioning or output symbols are actually scored (DERIVED).

LLaVA's original two-stage procedure aligns visual features with a language model through a projection, then instruction-tunes the projection and language model while using the stated frozen visual encoder ([R4.19](references.md#r419), section 3, PAPER-REPORTED). This is a specific architecture and trainable-parameter schedule, not evidence that every image-conditioned model uses the same interface. The target is the assistant response under its conversation construction.

Whisper uses a multitask sequence format with task, language, timestamp, and transcript conventions ([R4.18](references.md#r418), section 2, PAPER-REPORTED). Reproduction requires the exact task sequence, because some task-related symbols are predicted outputs rather than only unscored prompts. Cross-attention to an audio encoder and causal output decoding have separate compute and cache costs. Neither this format nor its reported robustness establishes streaming behavior without a chunking/visibility protocol.

Decision Transformer constructs return-to-go, state, and action sequences from offline trajectories and predicts actions from their causal history. The paper uses cross-entropy for discrete actions and mean-squared error for continuous actions ([R4.20](references.md#r420), section 3, PAPER-REPORTED). Equation 4.14 describes the categorical case; for continuous actions the corresponding mean squared distance is a different loss, not a categorical probability assigned to a token. Gato's heterogeneous serialization includes modality-specific representation and loss-mask decisions (R4.21 method); action and environment observations must retain their temporal order, units, and episode boundaries.

For CLIP, normalize image and text embeddings, form the scaled pairwise similarity matrix, and apply cross-entropy in both directions with matched indices as labels. Use B_c for the global paired-example count, preserving N for model parameters. At identical similarities the loss is ln B_c; a larger candidate set changes this baseline. Duplicate or semantically equivalent pairs can violate the one-positive assumption by becoming false negatives (MATHEMATICALLY-DERIVED; objective form attributed to [P44](references.md#p44), section 2.3).

Distributed contrastive gradients require both the local query paths and the candidate-embedding paths contributed by queries on other ranks. Gathering detached candidate tensors and differentiating only local rows generally omits those remote candidate contributions. A differentiable gather must return and sum candidate gradients to the owning rank, or an explicitly equivalent distributed formulation must be used. Parameter-gradient averaging and loss scaling must together reproduce the global mean; candidate gathering alone is insufficient (MATHEMATICALLY-DERIVED).

The original CLIP report describes learned logit scaling and clipping for training stability (P44 section 2.5, PAPER-REPORTED). The temperature is therefore an optimized part of the training objective, with a disclosed bound in that recipe; it is not an author-invented stability assumption. The separate calibration temperature discussed in section 4.6 has a different fitting protocol and purpose.

Cost boundary: a prefix adds backbone positions and, when cached, approximately 2L*n_prefix*H_kv*d_h*b KV bytes. A cross-attention interface adds encoder execution, projections, memory, and decoder-to-source attention. Exact all-pairs contrastive scoring is quadratic in the explicitly bounded batch count: O(B_c^2 d_embed) arithmetic and O(B_c^2) full similarity storage; row sharding uses O(b_local B_c) local similarity storage but does not remove total pairwise work. Tiling bounds workspace without changing the all-pairs objective. It is not justified to call this work universally negligible (DERIVED).

```figure
id: fig-4.27
kind: diagram
title: Two conditioning interfaces feeding one masked objective
caption: >-
  The heavy path is R4.19's prefix-token interface: image features become n_img
  prefix positions of the same causal sequence, carry m_t = 0, and still
  occupy KV cache at inference. The cross-attention interface (P01, R4.18)
  reaches the decoder from the side instead. Either way the objective node is
  the same Eq. 4.12; only where φ(c) enters changes.
placement: wide
evidence: PAPER-REPORTED
source: [R4.19, R4.18, P01, "DERIVED:eq-4.12"]
alt: >-
  Diagram of Eq. 4.12 with two interfaces. Prefix-token interface, after
  R4.19: an image [B, 3, H, W] passes through a frozen vision encoder φ and a
  projection W of shape [d_vis, d], trained in both stages, to become image
  prefix tokens [B, n_img, d] with m_t = 0; prompt and answer ids [B, T_txt]
  are embedded and concatenated after them into one sequence
  [B, n_img + T_txt, d]; a causal decoder, frozen in stage 1 and trained in
  stage 2, produces the cross-entropy of Eq. 4.12 with m_t = 1 on answer
  tokens only. A dashed edge ties the image prefix to the KV cache, which
  holds 2·L·n_img·H_kv·d_h·b bytes for it at inference. Cross-attention interface,
  after P01 and R4.18: audio with task tokens passes through an audio encoder
  whose output supplies the keys and values of a cross-attention memory that
  the decoder reads.
spec:
  direction: LR
  nodes:
    - { id: img, kind: dataset, label: "image c", sub: "[B, 3, H, W]" }
    - { id: venc, kind: model, label: "vision encoder φ", sub: "frozen (R4.19)" }
    - { id: proj, kind: process, label: "projection W", sub: "[d_vis, d]; trained in both stages", group: pre }
    - { id: ptok, kind: tensor, label: "image prefix tokens", sub: "[B, n_img, d]; m_t = 0", group: pre }
    - { id: txt, kind: tensor, label: "prompt + answer ids, embedded", sub: "[B, T_txt, d]", group: pre }
    - { id: seq, kind: tensor, label: "one causal sequence", sub: "[B, n_img + T_txt, d]", group: pre }
    - { id: lm, kind: model, label: "causal decoder", sub: "frozen in stage 1, trained in stage 2" }
    - { id: ce, kind: objective, label: "CE of Eq. 4.12", sub: "m_t = 1 on answer tokens only" }
    - { id: aud, kind: dataset, label: "audio + task tokens", sub: "Whisper layout (R4.18)", group: xa }
    - { id: aenc, kind: model, label: "audio encoder", sub: "bidirectional", group: xa }
    - { id: xatt, kind: process, label: "cross-attention memory", sub: "K, V from the encoder output (P01)", group: xa }
    - { id: kv, kind: memory, label: "KV cache for the image prefix", sub: "2·L·n_img·H_kv·d_h·b bytes" }
  edges:
    - { from: img, to: venc }
    - { from: venc, to: proj, kind: emphasis }
    - { from: proj, to: ptok, kind: emphasis }
    - { from: ptok, to: seq, kind: emphasis }
    - { from: txt, to: seq }
    - { from: seq, to: lm, kind: emphasis }
    - { from: lm, to: ce, kind: emphasis }
    - { from: aud, to: aenc }
    - { from: aenc, to: xatt }
    - { from: xatt, to: lm, kind: dependency, label: "cross-attention interface" }
    - { from: ptok, to: kv, kind: dependency, label: "n_img positions per layer" }
  groups:
    - { id: pre, label: "prefix-token interface (R4.19)" }
    - { id: xa, label: "cross-attention interface (P01; R4.18)" }
```

```figure
id: fig-4.28
kind: compare
title: Six conditional ledger rows, by what the softmax runs over
caption: >-
  Text, image, and audio generation score target-token conditionals. Action
  learning can instead use categorical or continuous-regression targets.
  Contrastive and finite-label objectives normalize over declared candidate
  sets and can sample within them, but do not alone define unrestricted
  sequence generation. Their cost depends on the encoders and set size.
placement: wide
evidence: PAPER-REPORTED
source: [R4.19, R4.18, R4.20, R4.21, P44, R4.1]
concepts: [ms.section.4.5, ms.section.18.4]
alt: >-
  Comparison of six ledger rows from verification §1.1. Document c: text
  prefix in the same stack; m_t = 0 on c; softmax over the vocabulary V;
  defines a sampler and likelihood; ρ = |x|/(|c| + |x|); c costs backbone
  FLOPs and KV cache without direct prediction losses. Image prefix (R4.19): projected image
  features as prefix tokens; loss on answer tokens only; softmax over V;
  sampler of the answer; encoder FLOPs and n_img KV positions. Audio
  encoder–decoder (R4.18): cross-attention to the audio encoder with task
  tokens as conditioning; loss on the transcript, with some task tokens as
  targets; softmax over V; sampler of the transcript. Action-conditioned
  (R4.20, R4.21): interleaved returns, states and actions; loss on actions, or
  on actions and observations for a world model; sampler of actions. Contrastive
  pair (P44): two encoders; one target per pair; softmax over the gathered
  batch; no unrestricted sequence sampler or autoregressive perplexity; two encoders, a B_c by B_c similarity
  matrix and an all-gather. Discriminative head: encoder plus a head over the
  label set; categorical softmax permits label sampling.
spec:
  axis: >-
    What the softmax normalises over, where the conditioning c enters and what
    the loss mask does to it, for one ledger row per column (verification §1.1)
  columns:
    - { id: doc, label: "Document c (cond_gen_doc)" }
    - { id: img, label: "Image prefix (R4.19)" }
    - { id: aud, label: "Audio enc–dec (R4.18)" }
    - { id: act, label: "Action-conditioned (R4.20; R4.21)" }
    - { id: con, label: "Contrastive pair (P44)" }
    - { id: disc, label: "Discriminative head" }
  rows:
    - { dimension: "interface for c", values: { doc: "text prefix in the same stack", img: "W·φ(image) as prefix tokens", aud: "cross-attention to the audio encoder; task tokens as conditioning", act: "interleaved (R̂_t, s_t, a_t) history in one stream", con: "none: separate encoders f_a and f_b", disc: "encoder output into a head [d, |𝒴|]" } }
    - { dimension: "loss mask over c", values: { doc: "m_t = 0 on c, 1 on x", img: "0 on image and prompt, 1 on the answer", aud: "1 on the transcript; some task tokens are targets (R4.18)", act: "1 on actions (policy) or actions + observations (world model)", con: "one term per pair", disc: "one term per example" } }
    - { dimension: "softmax runs over", values: { doc: "vocabulary V at each position", img: "V at each answer position", aud: "V at each transcript position", act: "discrete: action vocabulary; continuous MSE: no softmax", con: "the global B_c gathered candidates", disc: "the finite label set 𝒴" } }
    - { dimension: "defines a sampler and a likelihood of x", values: { doc: "yes", img: "yes, of the answer", aud: "yes, of the transcript", act: "categorical action sampler; MSE alone is not a normalized action law", con: "candidate-set probabilities; no unrestricted sequence sampler", disc: "categorical label sampling; no sequence sampler" } }
    - { dimension: "directly scored target fraction ρ", values: { doc: "|x|/(|c| + |x|)", img: "|ans|/(n_img + |prompt| + |ans|)", aud: "declared target tokens / encoded source positions; units differ", act: "design-dependent", con: "not defined", disc: "not defined" } }
    - { dimension: "cost beyond the causal row", values: { doc: "c through the full backbone and KV cache, no direct loss; conditioning gradients may flow", img: "encoder FLOPs; n_img KV positions", aud: "encoder FLOPs + cross-attention", act: "a tokeniser per modality", con: "two encoders, B_c×B_c similarities, all-gather", disc: "head [d, |𝒴|]; categorical label sampler" } }
```

## Algorithm

```text
Algorithm 4.5 — Distributed symmetric contrastive objective
INPUT b_local paired examples per rank, W ranks, two encoders, logit scale alpha
PRECONDITIONS B_c=W*b_local>0; paired global indices are unique and aligned;
              gather backward returns summed candidate gradients to owners
OUTPUT global-mean objective estimate and corresponding encoder/scale gradients
1 Encode and L2-normalize local image/text embeddings E_a,E_b[b_local,d_embed]
2 Differentiably gather embeddings to E_a_all,E_b_all[B_c,d_embed]
3 S_ab <- exp(alpha)*E_a*E_b_all^T; S_ba <- exp(alpha)*E_b*E_a_all^T
4 labels <- global matched indices for the local rows
5 L_local <- (CE_mean(S_ab,labels)+CE_mean(S_ba,labels))/2
6 Differentiate; combine candidate and query gradients; average parameter gradients
INVARIANT the resulting parameter gradient equals the global objective in Eq. 4.13
```

The gradient equivalence assumes the stated gather backward and averaging semantics; a reducer with different scaling needs an adjusted scalar. Per-rank similarity work is O(b_local B_c d_embed); stored embeddings require O(B_c d_embed), and untiled local logits add O(b_local B_c). The book reconstructed this algorithm mathematically and did not inspect or execute a distributed CLIP training implementation.

```figure
id: fig-4.29
kind: matrix
title: Rank 0's similarity block after all_gather, B_local = 4, W = 2
caption: >-
  Line 3 of Algorithm 4.5 as a grid: 4 local image rows against 8 gathered
  text columns. Each row's positive sits at its global index (full shade) and
  the other 7 columns are its negatives, 4 of them from rank 1. Without the
  gather, each row would see 3 negatives and the objective would change. The
  S′ direction is the same block with the roles swapped. Toy sizes.
placement: rail
anchor: algorithm
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.13", "DERIVED:alg-4.5", P44]
alt: >-
  Four by eight grid for rank 0 of W = 2 ranks with B_local = 4 local pairs. Rows
  are local image embeddings a_0 to a_3; columns are gathered text embeddings
  b_0 to b_7, of which b_4 to b_7 come from rank 1. The diagonal cells (0,0),
  (1,1), (2,2) and (3,3) are full shade and highlighted: the positive pair of
  each row at its global index. The other 28 cells are light shade: 7
  negatives per row. Without cross-rank gathering each row would have only 3
  negatives.
spec:
  rows: 4
  cols: 8
  pattern: explicit
  cells:
    - [1, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]
    - [0.3, 1, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]
    - [0.3, 0.3, 1, 0.3, 0.3, 0.3, 0.3, 0.3]
    - [0.3, 0.3, 0.3, 1, 0.3, 0.3, 0.3, 0.3]
  rowLabel: "local image rows, rank 0"
  colLabel: "gathered text columns, W·B_local = 8"
  rowTicks: ["a_0", "a_1", "a_2", "a_3"]
  colTicks: ["b_0", "b_1", "b_2", "b_3", "b_4", "b_5", "b_6", "b_7"]
  highlight:
    - { row: 0, col: 0 }
    - { row: 1, col: 1 }
    - { row: 2, col: 2 }
    - { row: 3, col: 3 }
  legend: "full: positive at its global index; light: 7 negatives per row, 4 from rank 1"
```

## Implementation

```text
image prefix: image -> frozen/trainable encoder phi -> projection -> prefix embeddings
              prefix + prompt + shifted answer -> causal decoder -> answer-target CE
cross-attention: audio -> encoder memory; task/previous-output tokens -> decoder
contrastive: paired inputs -> two encoders -> normalized vectors -> global candidates -> two CEs
action prediction: return/state/action history -> causal model -> categorical or continuous head
```

A modality position with m_t=0 can still receive gradient through later outputs. Freeze parameters explicitly when the recipe requires it; never implement a loss mask by detaching conditioning unless that different optimization graph is intended. At batching boundaries retain modality masks, segment/episode IDs, sequence alignment, and padding rules. A scalar sum of token CE and action MSE is meaningful only with declared reductions and coefficients, since the units differ (DERIVED).

For contrastive training, log candidate count and scale with the loss. A local negative set, global negative set, memory queue, and multiple-positive objective are different specifications. Record communication topology and gather gradient behavior when interpreting distributed throughput. The source papers supply empirical results for their systems; the chapter has not measured latency, energy, money, or throughput for these reconstructed rows.

## Experimental design

### Reported experiments

CLIP evaluates transfer by constructing text representations of candidate class names/prompts and comparing them with image representations, with zero-shot and other transfer evaluations across its reported suite. The learned pretraining objective discriminates paired image/text examples; zero-shot classification measures a separate downstream use of the encoders ([P44](references.md#p44), sections 2-3, PAPER-REPORTED). Prompt construction, label set, and test distribution therefore belong in the evaluation record; a contrastive loss number alone is not a classification result.

Whisper evaluates speech recognition and translation across the report's datasets and languages, including robustness analyses (R4.18 experiments). LLaVA evaluates its visual instruction-tuning procedure with the source's instruction/evaluation construction (R4.19 section 4). These test their complete data/interface/training choices and cannot isolate the effect of a loss mask without a matched intervention.

Decision Transformer evaluates offline control with specified datasets and desired-return conditioning, including discrete Atari and continuous-control settings (R4.20 section 4, PAPER-REPORTED). Its metrics are task returns under the evaluation environment, not token perplexity. Conditioning on a desired return does not supply an online reward-learning guarantee or establish behavior outside the offline data's coverage. The chapter proposes no invented multimodal experiment as a published result.

## Observations

**What the paper claims.** The sources report transferable paired representations, multitask speech generation, visual instruction-following, and return-conditioned offline control under distinct architectures and protocols (PAPER-REPORTED: P44; R4.18-R4.20).

**What the evidence shows.** Each result combines a target space, data distribution, interface, and evaluation procedure. Discrete and continuous action settings use different losses; contrastive training depends on its candidate set; multimodal generation depends on its sequence and trainable-parameter schedule.

**What we infer.** A complete objective ledger must specify conditioning visibility, gradient paths, target type, normalization, and candidate set. A response-only loss mask removes direct prompt losses without necessarily removing prompt/encoder gradients (MATHEMATICALLY-DERIVED).

**What remains unknown.** An uninspected production system's modality loss weights, training mask, distributed gradient behavior, or deployment schedule is NOT-DISCLOSED or UNVERIFIED. The cited results do not identify a universally best interface across modalities.

## Failure modes

> **Failure mode — Incorrect conditioning gradient policy.** *Symptom:* projection/encoder training differs from the recipe. *Cause:* confusing zero direct loss with detachment or frozen parameters. *Detection:* inspect trainable parameter sets and gradients from response losses. *Mitigation:* specify masks, freezes, and detach operations independently (DERIVED).

> **Failure mode — Candidate-set or gather-gradient drift.** *Symptom:* a distributed objective differs from a global reference. *Cause:* local-only negatives or lost remote candidate gradients. *Detection:* compare a small global batch's loss and parameter gradients. *Mitigation:* preserve global pairing, differentiable gather semantics, and reducer scaling (DERIVED).

> **Failure mode — Uncontrolled contrastive scale.** *Symptom:* unstable large similarity logits. *Cause:* an unsuitable learned-scale trajectory is one possible contributor. *Detection:* log scale and per-direction loss. *Mitigation:* reproduce the bounded scale reported in the original CLIP recipe when reproducing that experiment (P44 section2.5, PAPER-REPORTED).

> **Failure mode — Mixed loss units or episode leakage.** *Symptom:* one modality/episode dominates feedback or future actions become visible. *Cause:* combining CE/MSE without declared reductions or packing without temporal masks. *Detection:* inspect per-term units, counts, and admissible context. *Mitigation:* define weights and episode boundaries explicitly (DERIVED).

## Siblings

Text-prefix generation, image-prefix generation, and encoder-decoder generation can all score a conditional target distribution while using different context interfaces and trainable-parameter schedules. An encoder-decoder denoiser makes the source a corrupted text sequence; FIM instead makes the suffix available earlier in a causal serialization. Their conditional targets and visibility are described in [§4.2](04-2-alternative-objectives.md) and [§4.3](04-3-code-and-structured-sequences.md).

Contrastive classification defines a distribution over a declared candidate set, and a discriminative head defines one over its labels. Both can support categorical sampling within that finite set, but neither alone specifies unrestricted autoregressive sequence generation. Continuous action regression specifies another output geometry and loss unit; identifying it with a probability model requires an explicit observation/noise model rather than the presence of a scalar training loss.



## Extensions

### Improvements

Two-stage visual alignment followed by instruction tuning changes which parameters receive supervised feedback and which task distribution is optimized (R4.19 section 3). Multitask speech tokens expose the requested operation in the decoder's conditioning sequence (R4.18 section 2). Both are documented methodological choices, not consequences of adding a new modality name.

Contrastive pretraining can supply an encoder to a conditional generator, but the downstream generative loss and interface still require their own specification. Multiple-positive objectives or altered negative sampling change the contrastive estimand and should be separate ledger rows. Their benefit must be established by their own sources rather than inferred from CLIP's result.

For control, replacing tokenized action classification by a continuous regression head changes output geometry and units. A later online feedback or verifier stage changes the learning setup again; offline return conditioning alone is not that stage (DERIVED).

## Limitations

Generative, discriminative, contrastive, and continuous-regression objectives serve different output and supervision contracts. A classifier can sample labels; a contrastive model can score new candidates; neither alone specifies unrestricted autoregressive generation. Joint models can combine objectives, but then require explicit heads, masks, reductions, and coefficients.

Cross-modal alignment and control results are conditional on training data and evaluation distributions. The cited reports do not identify a universally preferred interface or provide measurements for this chapter's reconstructed implementation.

## Reproducibility

Record conditioning/target schemas, encoder and tokenizer identifiers, feature dimensions, trainable parameters by stage, visibility and response/task masks, candidate set and pairing policy, temperature parameterization/bounds, loss units and coefficients, and distributed gradient scaling. Control records require trajectory/episode boundaries, action units, desired-return construction, and environment versions. Source locators are in [references.md](references.md); no training or distributed-gradient check was executed.

## References

P01, P44; R4.18, R4.19, R4.20, R4.21.
