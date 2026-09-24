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
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 4.5 Conditional and multimodal learning

## Scope

Objective: generalise the conditioning variable c of Eq. N.1 from a text prefix to documents, images, audio, actions, and environment observations; state what stays fixed in the ledger (targets, mask, normalisation) and what changes (the conditioning interface and its cost); and separate generative objectives, which normalise over the target space, from discriminative and contrastive objectives, which normalise over a candidate set. Baseline: the causal row with text c. Success: the reader can write the ledger row for a captioning model, a speech model, an action-conditioned model, and a contrastive encoder, and can say which of them defines a sampler. Boundaries: encoders, adapters, and fusion are owned by Chapter 18; modality-specific systems by Part X.

## Why this exists

What failed before was the assumption that conditioning is a prefix of the same kind as the target. Once c became an image, an audio clip, or a robot state, the objective did not change but the *interface* did, and reports began to describe fusion architectures as if they were objectives. The bottleneck was two-fold: the cost of the conditioning encoder is paid on every training example whether or not it receives gradient, and the loss mask must exclude conditioning placeholders or the model is trained to reproduce them. The constraint that became dominant for alignment objectives is batch size: a contrastive loss over N pairs normalises over N candidates, so N is part of the objective and not merely an optimisation setting. What changed is the recognition that "generative versus discriminative" is a statement about what the softmax runs over.

## Intuition

Physically, a conditional generative objective pays the encoder's FLOPs on c plus the decoder's FLOPs on x, and stores the encoder output as a prefix in attention (cross-attention K/V or prefix tokens); a contrastive objective pays two encoders and an N×N similarity matrix per batch, and stores no decoder at all. Heuristically one may describe a vision–language model as "seeing"; the resource fact is that image features occupy prefix positions and are attended like tokens. Distributionally, a generative objective must assign probability to every possible target; a discriminative objective only ranks a finite candidate set, which is why it can be cheaper and why it cannot sample.

## Formulation

> **Definition — Conditional generative objective.** The application of Eq. N.2 to targets x with a conditioning c that enters the model through an interface (prefix tokens, cross-attention memory, or state) and carries m_t = 0 at every conditioning position.

$$
\mathcal{L}_{\text{gen}}(\theta) = -\frac{\sum_{t} m_t \log p_\theta(x_t \mid x_{<t}, \phi(c))}{\sum_t m_t},\qquad \phi = \text{conditioning encoder / adapter}
$$
*(Eq. 4.12)* where φ(c) is the encoded conditioning in the decoder's representation space; the softmax at each t runs over the target vocabulary V.

> **Definition — Discriminative objective.** An objective whose softmax (or scoring) runs over a finite candidate set 𝒴 rather than over sequences, p_θ(y | c) for y ∈ 𝒴, with no defined sampler over the target modality.

The contrastive alignment objective is owned by [§18.4 Learning objectives](../../part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/18-4-learning-objectives.md); recalled here in one sentence: a discriminative objective in which the candidate set is the other elements of the batch: for N paired samples (a_i, b_i), maximise the score of the N matched pairs against the N² − N unmatched pairs.

For encoders f_a, f_b with ℓ₂-normalised outputs and learned temperature τ_c > 0:

$$
\mathcal{L}_{\text{con}} = \frac{1}{2N}\sum_{i=1}^{N}\left[-\log\frac{e^{s_{ii}/\tau_c}}{\sum_{j} e^{s_{ij}/\tau_c}} - \log\frac{e^{s_{ii}/\tau_c}}{\sum_{j} e^{s_{ji}/\tau_c}}\right],\qquad s_{ij} = f_a(a_i)^\top f_b(b_j)
$$
*(Eq. 4.13)* where N = pairs in the batch, s_ij = cosine similarity, τ_c = temperature (local symbol; distinct from the distillation τ of notation). This is the symmetric cross-entropy of P44 written out (PAPER-REPORTED · P44 §2.3 for the form; the equation transcription is DERIVED).

```figure
id: fig-4.26
kind: calculator
title: The contrastive candidate set and its chance-level loss
caption: >-
  Eq. 4.13 with every s_ij equal (as at a symmetric start) reduces to ln N_g
  per row, where N_g = W·N is the candidate set after cross-rank gathering.
  The per-device batch N is held fixed in the states below; only the number of
  gathered ranks W changes, and with it the loss value that means chance.
  Batch sizes are illustrative, not P44's.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.13", P44]
alt: >-
  Calculator for Eq. 4.13 over the gathered candidate set. Inputs: local
  pairs per rank N and data-parallel ranks W. Outputs: candidates per row
  N_g = W·N; negatives per row N_g − 1; similarities scored per rank and
  direction N·N_g; negatives in the global matrix N_g² − N_g; and the loss at
  uniform similarity, ln N_g nats. At N = 256 and W = 1 (illustrative): 256
  candidates, 255 negatives per row, 65,536 similarities, 65,280 negatives,
  ln 256 = 5.545 nats. At W = 8: 2,048 candidates, a [256, 2,048] block per
  rank, 7.625 nats. At W = 32: 8,192 candidates, 9.011 nats.
spec:
  tex: >-
    \mathcal{L}_{\text{con}}\big|_{s_{ij}\ \text{equal}} = \ln N_g,\qquad
    N_g = W N,\qquad \text{negatives per row} = N_g - 1
  equation: "4.13"
  inputs:
    - { symbol: N, label: "local pairs per rank, N", default: 256, min: 8, max: 4096, scale: log2, format: integer }
    - { symbol: W, label: "data-parallel ranks gathered, W", default: 1, min: 1, max: 64, scale: log2, format: integer }
  outputs:
    - { symbol: Ng, label: "candidates per row, N_g = W·N", formula: "W*N", format: integer }
    - { symbol: neg, label: "negatives per row, N_g − 1", formula: "Ng - 1", format: integer }
    - { symbol: blk, label: "similarities per rank and direction, N·N_g", formula: "N*Ng", format: integer }
    - { symbol: allneg, label: "negatives in the global matrix, N_g² − N_g", formula: "Ng^2 - Ng", format: integer }
    - { symbol: L0, label: "loss at uniform similarity, ln N_g (nats)", formula: "ln(Ng)", format: fixed3, emphasis: true }
states:
  - { anchor: formulation, label: "one device, N = 256", variables: { N: 256, W: 1 }, highlight: [Ng, L0], note: "Each row's softmax runs over the 256 candidates of the batch; at uniform similarity the loss is ln 256 = 5.545 nats. The batch size sits inside the objective." }
  - { anchor: mechanism, label: "sharded over W = 4", variables: { N: 256, W: 4 }, highlight: [Ng, neg], note: "The negatives are the batch: with the batch sharded over 4 ranks, only an all-gather keeps each row's candidate set at W·N = 1024 (1023 negatives) rather than the 256 on one rank." }
  - { anchor: algorithm, label: "W = 8 ranks, gathered", variables: { N: 256, W: 8 }, highlight: [Ng, blk, L0], note: "After all_gather the candidate set is W·N = 2048: each rank scores a [256, 2048] block per direction and the chance-level loss rises to 7.625 nats." }
  - { anchor: failure-modes, label: "W = 32, same local N", variables: { N: 256, W: 32 }, highlight: [L0], note: "Batch-size aliasing: identical per-device batches, but the chance level is ln 8192 = 9.011 nats; loss values from different cluster sizes do not share an axis." }
```

$$
\mathcal{L}_{\text{action}} = -\frac{\sum_{t} m_t \log p_\theta(a_t \mid \hat{R}_{\le t}, s_{\le t}, a_{<t})}{\sum_t m_t}
$$
*(Eq. 4.14)* where a_t = discretised action, s_t = state/observation, R̂_t = return-to-go; the return-conditioned sequence-modeling form of R4.20 with loss on action tokens only (PAPER-REPORTED · R4.20 for the conditioning set; the mask statement is the book's ledger transcription, DERIVED).

## Mechanism

**Documents as conditioning.** With c a document, the row is the causal row with m_t = 0 over the document span; this is the response-only loss of [§31.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-1-sft-objectives.md) and the retrieval-conditioned generation of Part IX. Cost: the document's tokens are processed by the full backbone and stored in the KV cache without contributing gradient; the gradient-bearing fraction is ρ = |x| / (|c| + |x|) (DERIVED).

**Images as conditioning.** Two interfaces appear in the spine. Prefix-token: LLaVA maps CLIP visual features through "a trainable projection matrix W to convert visual features into language embedding tokens" and trains auto-regressively where "only assistant answers … are used to compute the loss", in two stages (projection only on image–text pairs; then projection and LLM on instruction data) (PAPER-REPORTED · R4.19). Cross-attention memory: the encoder–decoder attention of P01, "queries come from the previous decoder layer, and the memory keys and values come from the output of the encoder" (PAPER-REPORTED · P01 §3.2.3), generalises to any encoder output; the cost is that of §4.2's cross-attention line with T_enc = number of visual tokens. In both, the ledger row is Eq. 4.12 with m_t = 0 on image positions; what differs is where φ(c) enters and whether φ receives gradient (stage-dependent in R4.19).

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

**Audio as conditioning.** Whisper is "an encoder-decoder Transformer" trained on 680,000 hours of weakly supervised audio; its decoder is "an audio-conditional language model" in which "special tokens serve as task specifiers or classification targets" — language, transcribe/translate, timestamps — and the decoder conditions "on the history of text of the transcript" (PAPER-REPORTED · R4.18). The ledger row is Eq. 4.12 with c = (audio, task tokens), targets = transcript tokens; the task tokens are conditioning, not targets, unless the report says otherwise (which for language identification it does, as a "classification target"). Cost: encoder FLOPs on the audio frames per example, plus cross-attention (DERIVED). Developed in [§56.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch56-audio-speech-and-real-time-interaction/56-2-task-families.md).

**Actions and environments as conditioning.** Decision Transformer "casts the problem of RL as conditional sequence modeling" and, "By conditioning an autoregressive model on the desired return (reward), past states, and actions", generates future actions "by leveraging a causally masked Transformer" (PAPER-REPORTED · R4.20). Gato serialises text, images, proprioception, and actions into one token stream so that "the same network with the same weights" decides "whether to output text, joint torques, button presses, or other tokens" (PAPER-REPORTED · R4.21). The row is Eq. 4.14: the conditioning set is the interleaved history, the targets are action tokens, and the mask is the design decision — loss on actions only, or on observations too (a world-model objective). That choice is exactly the boundary between a policy objective ([§60.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch60-vision-language-action-policies-and-embodied-learning/60-2-action-generation.md)) and a predictive objective ([§59.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch59-predictive-representations-jepa-and-world-models/59-2-predictive-learning.md)) (DERIVED from the mask field).

**Contrastive alignment.** P44 trains on 400 million image–text pairs by predicting, for a batch of N pairs, "which of the N × N possible (image, text) pairings across a batch actually occurred", maximising cosine similarity of the N real pairs and minimising it for the N² − N incorrect pairs with "a symmetric cross entropy loss over these similarity scores", with the temperature "directly optimized during training as a log-parameterized multiplicative scalar" (PAPER-REPORTED · P44 §2.3). Cost: two encoder passes per pair, an N×N similarity matrix (N² · d FLOPs, negligible next to the encoders), and — the important line — the negatives are the batch, so the effective objective changes with N and with how N is sharded across devices (gathering embeddings across data-parallel ranks is required to keep the global N as the candidate set) (DERIVED). The mechanism and its use in fusion is developed in [§18.4](../../part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/18-4-learning-objectives.md) and [§55.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/55-2-alignment-and-fusion.md); this section owns only its ledger row.

**Generative versus discriminative.** A generative row defines p_θ(x | c) over all x and hence a sampler and a likelihood; a discriminative or contrastive row defines scores over a candidate set and hence a classifier or retriever but no sampler and no likelihood of x (MATHEMATICALLY-DERIVED). Consequently a contrastive encoder has no perplexity, and a captioning decoder has no retrieval accuracy without an external candidate set; comparing them on "loss" is a category error.

```figure
id: fig-4.28
kind: compare
title: Six conditional ledger rows, by what the softmax runs over
caption: >-
  The first four columns share a softmax over a vocabulary at every scored
  position, and so each defines a sampler and a likelihood; they differ only
  in the interface and the mask over c. The last two normalise over a finite
  candidate set, which is why they are cheap to score, cannot sample, and
  have no perplexity to compare with the others.
placement: wide
evidence: PAPER-REPORTED
source: [R4.19, R4.18, R4.20, R4.21, P44, R4.1]
concepts: [ms.section.4.5, ms.section.18.4]
alt: >-
  Comparison of six ledger rows from verification §1.1. Document c: text
  prefix in the same stack; m_t = 0 on c; softmax over the vocabulary V;
  defines a sampler and likelihood; ρ = |x|/(|c| + |x|); c costs backbone
  FLOPs and KV cache without gradient. Image prefix (R4.19): projected image
  features as prefix tokens; loss on answer tokens only; softmax over V;
  sampler of the answer; encoder FLOPs and n_img KV positions. Audio
  encoder–decoder (R4.18): cross-attention to the audio encoder with task
  tokens as conditioning; loss on the transcript, with some task tokens as
  targets; softmax over V; sampler of the transcript. Action-conditioned
  (R4.20, R4.21): interleaved returns, states and actions; loss on actions, or
  on actions and observations for a world model; sampler of actions. Contrastive
  pair (P44): two encoders; one target per pair; softmax over the gathered
  batch; no sampler and no perplexity; two encoders, an N by N similarity
  matrix and an all-gather. Discriminative head: encoder plus a head over the
  label set; softmax over the labels; no sampler.
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
    - { dimension: "softmax runs over", values: { doc: "vocabulary V at each position", img: "V at each answer position", aud: "V at each transcript position", act: "action-token vocabulary at each position", con: "the W·N gathered candidates", disc: "the finite label set 𝒴" } }
    - { dimension: "defines a sampler and a likelihood of x", values: { doc: "yes", img: "yes, of the answer", aud: "yes, of the transcript", act: "yes, of actions", con: "no: scores only, no perplexity", disc: "no: a classifier" } }
    - { dimension: "gradient-bearing fraction ρ", values: { doc: "|x|/(|c| + |x|)", img: "|ans|/(n_img + |prompt| + |ans|)", aud: "|transcript|/|frames|", act: "design-dependent", con: "not defined", disc: "not defined" } }
    - { dimension: "cost beyond the causal row", values: { doc: "c through the full backbone and KV cache, no gradient", img: "encoder FLOPs; n_img KV positions", aud: "encoder FLOPs + cross-attention", act: "a tokeniser per modality", con: "two encoders, N×N similarities, all-gather", disc: "head [d, |𝒴|]; no sampler" } }
```

## Algorithm

```text
Algorithm 4.5 — Contrastive alignment step (P44 form) with cross-rank gathering
INPUT   batch of N local pairs (a_i, b_i), encoders f_a, f_b, log-temperature ℓτ, DP world size W
OUTPUT  L_con, gradients
STATE   local embeddings E_a, E_b ∈ ℝ^{N×d}; gathered Ê_a, Ê_b ∈ ℝ^{WN×d}
INVARIANT  rows of E_a, E_b are ℓ2-normalised; the candidate set is the global batch of WN
1  E_a ← normalise(f_a(a_{1:N}));  E_b ← normalise(f_b(b_{1:N}))
2  Ê_a ← all_gather(E_a);  Ê_b ← all_gather(E_b)             # candidate set = global batch
3  S ← (E_a Ê_b^T) · exp(ℓτ)                                  # local rows vs global columns, [N, WN]
4  S' ← (E_b Ê_a^T) · exp(ℓτ)
5  targets ← global indices of the local diagonal
6  L_con ← ½ [ CE(S, targets) + CE(S', targets) ]              # Eq. 4.13, mean over local rows
7  backprop; gradients w.r.t. the gathered tensors flow back through all_gather if differentiable, else only through local rows
```
Complexity: O(N·WN·d) for the similarity products; memory O(WN·d) for the gathered embeddings. Implementation link: no reference-stack implementation was inspected (UNVERIFIED); line 7's gradient-through-gather choice is a known source of silent objective differences between codebases (ASSUMED as a risk; not measured here).

```figure
id: fig-4.29
kind: matrix
title: Rank 0's similarity block after all_gather, N = 4, W = 2
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
  Four by eight grid for rank 0 of W = 2 ranks with N = 4 local pairs. Rows
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
  colLabel: "gathered text columns, W·N = 8"
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
Tensor trace (prefix-token image conditioning, R4.19 layout)
[B, 3, H, W] image → frozen vision encoder → [B, n_img, d_vis] → W ∈ [d_vis, d] → [B, n_img, d] prefix
[B, T_txt] text ids → Emb → [B, T_txt, d]
concat → [B, n_img + T_txt, d] → causal LM → [B, n_img + T_txt, V] → CE with m_t = 0 on image and prompt positions, 1 on answer positions
```

Memory: the image prefix occupies n_img cache positions per layer at inference, so a conditioning image costs 2·L·n_img·H_kv·d_h·b bytes of KV (DERIVED from Eq. N.8). Communication: contrastive training adds an all-gather of embeddings per step (Algorithm 4.5 line 2); conditional generation adds nothing beyond the causal row. Kernels: cross-attention with a fixed encoder memory can cache the encoder K/V across decode steps (DERIVED).

## Experimental design

### Experiment 4.5 — Mask placement over conditioning positions

- **Hypothesis:** applying loss to conditioning placeholders (m_t = 1 on image or document positions) measurably degrades answer-slice NLL at equal token budget relative to m_t = 0, because gradient is spent reproducing inputs.
- **Setup:** §3.5 reference model with a synthetic prefix-conditioning task (document → question → answer).
- **Independent variables:** mask over conditioning positions ∈ {0, 1}.
- **Controlled variables:** tokens, seeds, data, tokenizer, schedule.
- **Dataset/workload:** public QA-style corpus with clear document/answer segmentation.
- **Hardware:** one accelerator.
- **Metrics:** answer-slice NLL (nats/token); full-sequence NLL reported separately and labelled incomparable.
- **Baselines:** m_t = 0 on conditioning.
- **Expected result:** higher answer-slice NLL with loss on conditioning at fixed budget; the size of the effect depends on ρ.
- **Ablation:** vary |c| / |x|.
- **Interpretation:** establishes the mask field as consequential, not cosmetic.
- **Threats to validity:** the effect may reverse if the conditioning domain is under-represented in pretraining, where loss on c acts as continued pretraining.

Proposal only; no run was executed.

## Observations

**What the paper claims.** P44 claims contrastive pair prediction is more efficient than predictive captioning for zero-shot transfer in its setting (PAPER-REPORTED · P44). R4.19 claims a projection-only alignment stage followed by end-to-end tuning suffices for multimodal instruction following at its scale (PAPER-REPORTED · R4.19). R4.18 claims weak supervision at scale yields robust zero-shot speech recognition with a multitask token format (PAPER-REPORTED · R4.18). R4.20 and R4.21 claim that return- or context-conditioned sequence modeling yields competent policies in their benchmarks (PAPER-REPORTED).

**What the evidence shows.** Each claim is within one report; the ledger rows are nonetheless well-specified because the reports state interface, targets, and mask. Efficiency comparisons between contrastive and generative objectives (P44) are at one scale and with one downstream metric and do not transfer as a general ranking.

**What we infer.** The unifying fact is that only the conditioning interface and the mask change across modalities; the normalisation and target set are inherited from §4.1 (DERIVED). We infer, marked ASSUMED, that many production multimodal decoders use m_t = 0 on conditioning positions, as R4.19 does; for any named model this is NOT-DISCLOSED.

**What remains unknown.** Whether gradient flows to the conditioning encoder is a per-stage design choice that reports often leave unstated (NOT-DISCLOSED in general). Cross-rank gradient handling in contrastive implementations is UNVERIFIED for every reference-stack system.

## Failure modes

> **Failure mode — Loss on placeholders.** *Symptom:* the model emits image-placeholder or document text in answers. *Cause:* m_t = 1 over conditioning positions. *Detection:* per-segment loss logging. *Mitigation:* segment-aware mask construction (§10.5 serialisation contract).

> **Failure mode — Batch-size aliasing.** *Symptom:* contrastive loss values differ across cluster sizes at the same per-device batch. *Cause:* candidate set = global batch, which changed. *Detection:* loss vs W at fixed local N. *Mitigation:* fix the global N; gather across ranks.

> **Failure mode — Temperature collapse.** *Symptom:* contrastive loss saturates near log N or diverges. *Cause:* learned τ_c unbounded. *Detection:* log exp(ℓτ). *Mitigation:* clamp the log-temperature (P44 reports a learned log-parameterisation; clamping is the book's suggestion, ASSUMED).

> **Failure mode — Frozen-encoder drift.** *Symptom:* multimodal quality degrades when the language model is updated without the projection. *Cause:* the interface φ was trained for a different decoder representation. *Detection:* alignment-stage loss on a fixed probe set. *Mitigation:* retrain the projection after decoder changes.

## Siblings

**Causal LM with text c** — [04-1-autoregressive-modeling.md](04-1-autoregressive-modeling.md)
Why it exists: the base row. What assumption changed here: c is text. What objective changed: none. What problem it solved: none of the interface ones. What new failure mode it introduced: none. Changed primitive: encoder/adapter → none.

**Encoder–decoder span corruption** — [04-2-alternative-objectives.md](04-2-alternative-objectives.md)
Why it exists: text-to-text denoising. What assumption changed: c is corrupted text, same modality as x. What objective changed: reconstruction targets. What problem it solved: bidirectional text encoding. What new failure mode it introduced: sentinels. Changed primitive: cross-modal encoder → text encoder.

**Fill-in-the-middle** — [04-3-code-and-structured-sequences.md](04-3-code-and-structured-sequences.md)
Why it exists: suffix conditioning. What assumption changed: c includes text that follows x in the document. What objective changed: none. What problem it solved: infilling. What new failure mode it introduced: sentinel handling. Changed primitive: modality interface → document rearrangement.

## Extensions

For diffusion and flow objectives over continuous targets (images, actions), the generative row keeps its conditioning field but replaces the categorical softmax with a regression on noise or velocity, developed in [§58.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch58-generative-multimodal-models-and-alternative-generation-paths/58-2-objectives.md); the mask and normalisation fields still apply (DERIVED). For latent prediction (JEPA-family), the target is an encoded representation rather than observed data, developed in [§59.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch59-predictive-representations-jepa-and-world-models/59-2-predictive-learning.md). For agents, environment observations enter as c and tool outputs are untrusted conditioning whose boundary is fixed in [§10.5](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-5-tool-and-multimodal-interfaces.md).

## Limitations

Generative rows are valid where a sampler over the target modality is needed and the target is discretisable or has a tractable density; contrastive rows are valid where a candidate set exists at inference. Each is falsified as a choice if the deployment needs the other's output. Decision consequence: choose the row from the required output (samples vs scores), then record the interface, the gradient path into φ, the mask over c, and — for contrastive rows — the global N.

## Reproducibility

Versions: P44 arXiv 2103.00020 (ar5iv, accessed 2026-09-20); R4.18, R4.19, R4.20, R4.21 arXiv abs/ar5iv pages accessed 2026-09-20; P01 §3.2.3. Artifacts: ledger rows `cond_gen_doc`, `cond_gen_image_prefix`, `cond_gen_audio_encdec`, `action_conditioned`, `contrastive_pair`, `discriminative_head` in [verification.md](verification.md). Configuration: interface type, gradient into φ, mask over c, global N, τ_c parameterisation. Metrics: answer-slice NLL; contrastive accuracy over the stated candidate set. Unresolved: cross-rank gradient semantics in reference implementations (UNVERIFIED); production mask choices (NOT-DISCLOSED).

## References

P01, P44; R4.18, R4.19, R4.20, R4.21.
