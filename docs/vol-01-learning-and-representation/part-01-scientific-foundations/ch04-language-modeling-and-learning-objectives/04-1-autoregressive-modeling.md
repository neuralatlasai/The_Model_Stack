---
id: ms.section.4.1
entity_type: section
title: Autoregressive modeling
short_title: Autoregressive modeling
volume: 1
part: 1
chapter: 4
section: 4.1
slug: 04-1-autoregressive-modeling
parent: ms.chapter.4
prev_sibling: null
next_sibling: ms.section.4.2
children: []
prerequisites: [ms.section.2.2, ms.section.2.3, ms.section.3.2, ms.section.3.5, ms.frontmatter.notation]
downstream: [ms.section.4.2, ms.section.4.4, ms.section.4.6, ms.section.5.5, ms.section.19.1, ms.section.31.1, ms.section.37.1]
related: [ms.section.34.1]
siblings_by_mechanism: [ms.section.4.2, ms.section.4.3, ms.section.4.5]
relations:
  - {type: supported_by, target: paper.P01}
  - {type: variant_of, target: concept.likelihood-objective}
  - {type: implemented_by, target: impl.pytorch}
  - {type: implemented_by, target: impl.torchtitan}
axes: {lifecycle: [pretraining], mechanism: [objective, likelihood, masking], feedback_setting: [], modality: [text]}
papers: [P01]
implementations: [impl.pytorch, impl.torchtitan, impl.liger-kernel, impl.nvidia-megatron-core, impl.megatron-lm]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, KNOWN, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 4.1 Autoregressive modeling

## Scope

An autoregressive language model assigns an ordered token sequence a joint probability through successive conditional distributions. Teacher forcing evaluates the observed next token at each position under its observed prefix; causal attention permits these conditionals to be evaluated together in a Transformer training pass. The sequence log-likelihood, token mean, and mean of per-sequence losses retain different weighting conventions, so their denominators and distributed reduction rules form part of the objective. This section derives those distinctions from the shared mathematical contract and specifies their input, target, mask, and gradient alignment. (MATHEMATICALLY-DERIVED; P01 section3.1; Eq4.1-4.2.)

Boundaries: sampling and decoding belong to §37; the Transformer block that computes the conditionals belongs to §5.

## Why this exists

A next-token objective specifies a probability model, a conditioning protocol, and an estimator. These choices can disagree even when two trainers both use cross-entropy. Predicting an unshifted token allows direct access to the answer. Averaging micro-batch means changes the weight of examples when valid-token counts differ. Reporting a smoothed training loss as perplexity changes the evaluated quantity. The appropriate baseline is the chain-rule likelihood with explicit scored positions, not the name of a loss function (MATHEMATICALLY-DERIVED: Eq. 4.1-4.2).

The Transformer provides a concrete construction: shifted decoder inputs and masked self-attention make each output depend only on admissible earlier outputs (PAPER-REPORTED: [P01](references.md#p01), section 3.1). Teacher forcing supplies those earlier outputs during training. Parallel evaluation additionally depends on the architecture; the causal Transformer computes position states together, whereas a recurrent teacher-forced decoder still has recurrent state dependencies.

## Intuition

For logits a_t, the scored negative log-likelihood is log sum_v exp(a_{t,v}) - a_{t,x_t}. Its derivative with respect to a_{t,v} is p_theta(v | x_{<t},c) - 1[v=x_t], multiplied by the mask and reduction weight. The target logit receives the negative component and competing logits receive probability-proportional positive components. The same prefix representation therefore receives feedback about the entire categorical distribution, not only whether the top-ranked token was correct (MATHEMATICALLY-DERIVED).

Training and generation evaluate the same factorization with different available inputs. In training, all reference prefixes are already known. In generation, the next prefix depends on a preceding sampled output. This dependence explains the sequential sampling critical path; it does not imply that sampled prefixes have disjoint support from the training data.

## Formulation

Symbols follow [notation](../../../front-matter/notation.md): θ parameters, x = (x_1,…,x_T) a token sequence with x_t ∈ {1,…,V}, c conditioning (possibly empty), m_t ∈ {0,1} the loss mask, p_θ the model distribution.

> **Definition — Autoregressive factorisation.** The decomposition of a joint distribution over a sequence into an ordered product of per-position conditionals, each conditioned on all earlier positions and on c.

$$
\log p_\theta(x \mid c) = \sum_{t=1}^{T} \log p_\theta(x_t \mid x_{<t}, c)
$$
*(Eq. 4.1)* where T = sequence length, x_{<t} = (x_1,…,x_{t−1}), and x_{<1} is empty; Eq. 4.1 is the logarithm of Eq. N.1.

> **Definition — Teacher forcing.** Evaluating each conditional p_θ(x_t | x_{<t}, c) with the ground-truth prefix x_{<t} rather than with tokens sampled from p_θ.

> **Definition — Loss mask.** The binary vector m ∈ {0,1}^T whose entry m_t selects whether position t contributes to the loss; the symbol m_t is fixed by notation and this section owns its semantics.

The two normalisations of the shared contract are made explicit as distinct estimators. For a batch of B sequences with lengths T_i and masks m^{(i)}:

$$
\mathcal{L}_{\text{tok}} = -\frac{\sum_{i=1}^{B}\sum_{t=1}^{T_i} m^{(i)}_t \log p_\theta(x^{(i)}_t \mid x^{(i)}_{<t}, c^{(i)})}{\sum_{i=1}^{B}\sum_{t=1}^{T_i} m^{(i)}_t}
\qquad
\mathcal{L}_{\text{seq}} = -\frac{1}{B}\sum_{i=1}^{B}\frac{\sum_{t} m^{(i)}_t \log p_\theta(x^{(i)}_t \mid \cdot)}{\sum_{t} m^{(i)}_t}
$$
*(Eq. 4.2)* where L_tok = token-mean loss (Eq. N.2 applied to the whole batch), L_seq = sequence-mean loss, B = sequences per batch.

```figure
id: fig-4.3
kind: calculator
title: Token-mean against sequence-mean loss for a two-sequence batch
caption: >-
  Eq. 4.2 for B = 2 sequences with n_1 and n_2 masked tokens and per-token
  mean NLLs ℓ_1 and ℓ_2 (illustrative values, not measurements). L_tok gives
  every token the weight 1/(n_1 + n_2); L_seq gives every sequence 1/2, so a
  token of the short sequence weighs 1/(2·n_1). At the derivation's 10 and
  1,000 tokens the two estimators disagree by 0.49 nats on identical
  per-token losses.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-4.2"
alt: >-
  Calculator for Eq. 4.2 with two sequences. Inputs: masked tokens n_1 and
  n_2, and per-token mean NLLs ℓ_1 and ℓ_2 in nats (illustrative). At the
  defaults n_1 = 10, n_2 = 1,000, ℓ_1 = 3.0 and ℓ_2 = 2.0, the token-mean loss
  is 2,030/1,010 = 2.010 nats and the sequence-mean loss is 2.500 nats, a gap
  of 0.490. Each token weighs 1/1,010 under L_tok; each token of the short
  sequence weighs 1/20 under L_seq, 50.5 times more; the long sequence
  carries 100 times the short one's total weight under L_tok and the same
  weight under L_seq. With n_1 = n_2 = 500 the two estimators are equal at
  2.500.
spec:
  tex: >-
    \mathcal{L}_{\text{tok}} = \frac{n_1\ell_1 + n_2\ell_2}{n_1 + n_2},\qquad
    \mathcal{L}_{\text{seq}} = \tfrac{1}{2}\left(\ell_1 + \ell_2\right),\qquad
    n_i = \textstyle\sum_t m^{(i)}_t
  equation: "4.2"
  inputs:
    - { symbol: n1, label: "masked tokens in sequence 1, n_1", default: 10, min: 1, max: 1000, options: [1, 10, 100, 500, 1000], format: integer }
    - { symbol: n2, label: "masked tokens in sequence 2, n_2", default: 1000, min: 10, max: 10000, options: [10, 100, 500, 1000, 10000], format: integer }
    - { symbol: l1, label: "mean NLL of sequence 1, nats/token", default: 3, min: 0.5, max: 6, step: 0.1, format: fixed2 }
    - { symbol: l2, label: "mean NLL of sequence 2, nats/token", default: 2, min: 0.5, max: 6, step: 0.1, format: fixed2 }
  outputs:
    - { symbol: Ltok, label: "L_tok, token-mean (global count)", formula: "(n1*l1 + n2*l2)/(n1 + n2)", format: fixed3, emphasis: true }
    - { symbol: Lseq, label: "L_seq, sequence-mean", formula: "(l1 + l2)/2", format: fixed3, emphasis: true }
    - { symbol: Dgap, label: "L_seq − L_tok, nats", formula: "Lseq - Ltok", format: fixed3 }
    - { symbol: wtok, label: "weight of any token under L_tok", formula: "1/(n1 + n2)", format: raw }
    - { symbol: wseq, label: "weight of a sequence-1 token under L_seq", formula: "1/(2*n1)", format: raw }
    - { symbol: R, label: "total weight, sequence 2 ÷ sequence 1, L_tok", formula: "n2/n1", format: ratio }
states:
  - { anchor: formulation, label: "10 vs 1,000 tokens", variables: { n1: 10, n2: 1000 }, highlight: [Ltok, Lseq], note: "Same per-token losses, two estimators: L_tok = 2.010 and L_seq = 2.500 nats, because the 1,000-token sequence dominates one denominator and not the other." }
  - { anchor: mechanism, label: "weights, 1:100 vs 1:1", variables: { n1: 10, n2: 1000 }, highlight: [R, wtok, wseq], note: "The derivation's case: the two sequences weigh 1:100 under L_tok and 1:1 under L_seq, so a short-sequence token weighs 1/20 instead of 1/1010, 50.5 times more." }
  - { anchor: experimental-design, label: "equal-count identity", variables: { n1: 500, n2: 500 }, highlight: [Dgap], note: "The equal-count identity: on balanced lengths the two modes coincide exactly, gap 0.000, whatever ℓ_1 and ℓ_2 are." }
  - { anchor: failure-modes, label: "per-micro-batch mean", variables: { n1: 10, n2: 1000 }, highlight: [Lseq, Dgap], note: "Micro-batch denominator: one sequence per micro-batch, each normalised by its own count, then averaged, is L_seq = 2.500, not the global token-mean 2.010." }
```

> **Assumption.** Logarithms are natural; loss is reported in nats per token unless stated · *sensitivity:* a report in bits divides by ln 2 and a report per byte changes the denominator entirely (§4.6).

## Mechanism

### Methodology

Begin with a sequence and declare whether BOS, EOS, padding, separators, and document boundaries are scored. Insert BOS as context when the tokenizer/model convention supplies it. Shift the target one position relative to the input. Build attention visibility independently of the loss mask: visibility determines which information a prediction may use, whereas the loss mask determines which predictions are scored. A response-only objective may exclude prompt tokens from its direct loss while retaining their influence on response representations and their gradients (MATHEMATICALLY-DERIVED: chain rule and differentiation through the conditioning path).

For a causal Transformer, input slot j contains x_j and predicts x_{j+1}; the attention row permits keys at indices at most j. Packed sequences require a separate choice about cross-document attention. An EOS token alone does not reset attention. If documents are independent training examples, use segment-aware visibility and exclude targets that cross their boundaries; if the corpus is modeled as a single concatenated stream, document-to-document transitions are part of that declared distribution. Neither convention is implied by Eq. 4.1.

Let S_i be the summed NLL of sequence i and n_i its valid-target count. Equation 4.2 gives grad L_tok = sum_i grad S_i/sum_i n_i and grad L_seq = (1/B)*sum_i grad S_i/n_i. Thus a valid token in a short sequence has greater weight under the second estimator. A sequence with n_i=0 has no defined per-sequence mean. Reject an all-masked token-mean batch; for sequence means, either reject zero-target rows or explicitly exclude them and change the sequence denominator. Multiplication by zero after an undefined operation does not repair it (MATHEMATICALLY-DERIVED).

Across gradient accumulation and data-parallel ranks, preserve the numerator and denominator of the intended global objective. For W ranks whose gradient reducer averages rank gradients, define each rank's backward scalar as W*S_r/n_global, where S_r sums that rank's valid losses over the accumulation interval and n_global is the globally summed valid count. Averaging these gradients produces sum_r grad S_r/n_global. If the reducer sums gradients, omit W. Any framework-provided accumulation division must also be accounted for; an unconditional extra division by the number of micro-batches changes the gradient scale (MATHEMATICALLY-DERIVED).

Scheduled Sampling and sequence-level training study the mismatch between reference-prefix training and sampled-prefix generation in recurrent sequence models ([R4.7](references.md#r47), method and experiments; [R4.6](references.md#r46), sequence-level training). Their empirical scope does not establish a universal magnitude for this mismatch in post-trained foundation models. Mixing sampled inputs also changes the training estimator and is not algebraically identical to maximum likelihood.

Cost boundary: a dense output projection needs approximately 2d_model V forward FLOPs per scored hidden state; its two matrix-product gradients add approximately 4d_model V when both inputs and weights are differentiated. Softmax/reduction work and the backbone are additional. Unfused logits need BTV*b bytes at element width b; whether they dominate peak activation memory depends on sequence length, architecture, checkpointing, and the kernel. Objective arithmetic alone supplies neither wall-clock time nor energy or monetary cost; these require an implementation and measurement boundary (DERIVED).

```figure
id: fig-4.4
kind: matrix
title: Causal visibility on the 13-slot audit sequence
caption: >-
  Rows are the input slots of the causal_lm row of the verification audit
  (BOS plus 12 tokens); columns are the slots each may attend to. Every row
  predicts the token one slot to its right, so the highlighted row, ▁return
  at slot 9, must produce ▁a while ▁a sits above the diagonal and is masked
  to −∞. All 13 rows carry loss: Σm = 13, ρ = 1.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.1", P01]
alt: >-
  Thirteen by thirteen grid for the verification sequence BOS, def, ▁add, (,
  a, comma, ▁b, ), colon, ▁return, ▁a, +, ▁b. Query slots run down the rows
  and key slots across the columns. Cells on and below the diagonal are
  admitted; cells above it are masked. Row 9 (▁return) is highlighted across
  keys 0 to 9: it predicts ▁a from BOS through ▁return. In total 91 of the
  169 pairs are admitted, T(T+1)/2 with T = 13, and all 13 slots carry a
  target, so the loss-mask denominator is 13 and ρ = 1.
spec:
  rows: 13
  cols: 13
  pattern: causal
  rowLabel: "input slot t (predicts slot t+1)"
  colLabel: "slot j visible to it"
  rowTicks: ["BOS", "def", "▁add", "(", "a", ",", "▁b", ")", ":", "▁return", "▁a", "+", "▁b"]
  colTicks: ["BOS", "def", "▁add", "(", "a", ",", "▁b", ")", ":", "▁return", "▁a", "+", "▁b"]
  highlight:
    - { row: 9, col: 0 }
    - { row: 9, col: 1 }
    - { row: 9, col: 2 }
    - { row: 9, col: 3 }
    - { row: 9, col: 4 }
    - { row: 9, col: 5 }
    - { row: 9, col: 6 }
    - { row: 9, col: 7 }
    - { row: 9, col: 8 }
    - { row: 9, col: 9 }
  legend: "admitted j ≤ i: 91 of 169 pairs; all 13 slots scored, Σm = 13"
```

```figure
id: fig-4.5
kind: diagram
title: One factorisation, two data dependences
caption: >-
  Follow the heavy path: in training every conditional reads the corpus's
  own prefix, so all T positions are scored in one parallel pass and one
  backward pass returns ∇θ. The lower group uses the same θ and the same
  factorisation, but each prefix is the model's own sample, appended one
  position per pass. The boundary node is exposure bias: a mismatch by
  definition, of UNVERIFIED size at foundation-model scale.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.1", R4.6, R4.7]
alt: >-
  Diagram with two groups sharing the parameters θ. Training group, teacher
  forcing per Algorithm 4.1: the ground-truth sequence feeds f_θ over the true
  prefix x before t with a causal mask in one parallel pass over all T
  positions, producing p_θ(x_t given x before t) as [B, T, V] logits, which
  feed the masked NLL of Eq. 4.2; a feedback edge returns the gradient to θ in
  one backward pass. Inference group: an own-sample prefix feeds f_θ at one
  new position per pass, T sequential passes; a sample is drawn and appended
  back to the prefix by a feedback edge. A boundary node, exposure bias,
  depends on both the training prefixes and the inference prefixes; its
  magnitude at scale is UNVERIFIED.
spec:
  direction: TB
  nodes:
    - { id: corpus, kind: dataset, label: "ground-truth sequence x", sub: "ids [B, T+1], BOS-prefixed", group: train }
    - { id: tf, kind: process, label: "f_θ over the true x_{<t}, causal mask", sub: "one parallel pass, all T positions", group: train }
    - { id: probs, kind: tensor, label: "p_θ(x_t | x_{<t}) at every t", sub: "[B, T, V] logits", group: train }
    - { id: loss, kind: objective, label: "masked NLL, Eq. 4.2", sub: "token-mean or sequence-mean", group: train }
    - { id: theta, kind: model, label: "parameters θ", sub: "shared by both paths" }
    - { id: prefix, kind: state, label: "own-sample prefix x̂_{<t}", sub: "sampled-prefix distribution", group: infer }
    - { id: step, kind: process, label: "f_θ at one new position", sub: "T sequential passes", group: infer }
    - { id: draw, kind: process, label: "sample x̂_t from p_θ", sub: "decoding rules: §37" , group: infer }
    - { id: gap, kind: boundary, label: "exposure bias: train and inference prefixes differ", sub: "magnitude at scale UNVERIFIED" }
  edges:
    - { from: corpus, to: tf, kind: emphasis, label: "teacher forcing" }
    - { from: tf, to: probs, kind: emphasis }
    - { from: probs, to: loss, kind: emphasis, label: "gather x_t, multiply by m_t" }
    - { from: loss, to: theta, kind: feedback, label: "∇θ, one backward pass" }
    - { from: theta, to: tf, kind: dependency }
    - { from: theta, to: step, kind: dependency }
    - { from: prefix, to: step }
    - { from: step, to: draw }
    - { from: draw, to: prefix, kind: feedback, label: "append x̂_t" }
    - { from: corpus, to: gap, kind: dependency, label: "training prefixes" }
    - { from: prefix, to: gap, kind: dependency, label: "inference prefixes" }
  groups:
    - { id: train, label: "training: teacher forcing (Algorithm 4.1)" }
    - { id: infer, label: "inference: sampling the same factorisation" }
```

## Algorithm

```text
Algorithm 4.1 — Teacher-forced causal objective, explicit reductions
INPUT ids[B,T+1], valid[B,T], visibility, parameters theta, reduction
PRECONDITIONS T>=1; ids are vocabulary indices; valid is binary;
              visibility admits no future target; all scored counts are positive
OUTPUT scalar objective and gradients of exactly the stated reduction
1 inp <- ids[:,0:T]; tgt <- ids[:,1:T+1]
2 h <- causal_backbone_theta(inp, visibility)
3 a <- output_projection_theta(h)                       # [B,T,V], or fused
4 nll <- logsumexp(a,axis=V) - gather(a,tgt)              # [B,T]
5 S_i <- sum_t valid[i,t]*nll[i,t]; n_i <- sum_t valid[i,t]
6 if reduction=token_mean: L <- sum_i S_i / sum_i n_i
7 if reduction=sequence_mean: require every n_i>0; L <- mean_i(S_i/n_i)
8 backpropagate L, with the global scaling described in Methodology when distributed
INVARIANT a[i,j,:] is unchanged when ids[i,j+1:] are perturbed
```

The loss reduction and shifting cost O(BT); dense projection costs O(BTd_model V) forward. Backbone attention and feed-forward costs must be added rather than hidden in a parameter-count approximation. PyTorch's class-index cross-entropy accepts class dimension second, so flatten logits to [BT,V] and targets to [BT], or transpose logits to [B,V,T]. The unweighted mean with ignored class-index targets implements a local valid-target mean; class weights change its denominator, and probability targets have different ignore semantics (OFFICIAL-DOCUMENTATION: [R4.24](references.md#r424), PyTorch 2.14 documentation, Parameters and Shape; no runtime was tested).

```figure
id: fig-4.6
kind: tensor-flow
title: Teacher-forcing shift and loss masking in Algorithm 4.1
caption: >-
  The only objective-specific steps are the two slices of one [B, T+1] id
  tensor: step 1 keeps columns 0…T−1 as input, step 4 gathers the targets from
  columns 1…T. Everything between them is the backbone. The mask enters only
  at step 5 and the denominator only at step 6, which is where token-mean and
  sequence-mean part ways.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.2", R4.24]
alt: >-
  Seven-step tensor trace of Algorithm 4.1. Step 0: BOS-prefixed ids of shape
  [B, T+1]. Step 1: input ids [B, T], taken as ids columns 0 to T−1 by
  dropping the last column, no arithmetic. Step 2: hidden states [B, T, D]
  after the embedding and L causal blocks. Step 3: logits [B, T, V] after the
  output head W_out of shape [D, V], costing 2·D·V FLOPs per token forward
  and B·T·V·b bytes. Step 4: per-token NLL [B, T], by log-softmax over V and a
  gather at the shifted targets, ids columns 1 to T. Step 5: the NLL
  multiplied by the loss mask m, shape [B, T]. Step 6: a scalar, the masked
  sum divided by the global mask count for token-mean, or the mean of
  per-sequence means for sequence-mean.
spec:
  dims: { B: "sequences in the micro-batch", T: "scored positions", D: "model width d_model", V: "vocabulary size" }
  steps:
    - { shape: "[B, T+1]", label: "ids, BOS-prefixed" }
    - { shape: "[B, T]", label: "inp = ids[:, 0:T]", op: "line 1: drop the last column", cost: "no arithmetic" }
    - { shape: "[B, T, D]", label: "hidden states", op: "embed + L causal blocks (§5), line 3", cost: "backbone FLOPs under the causal mask" }
    - { shape: "[B, T, V]", label: "logits, accumulation dtype", op: "· W_out ∈ [D, V]", cost: "2·D·V FLOPs/token forward; B·T·V·b bytes" }
    - { shape: "[B, T]", label: "nll", op: "−log_softmax, gather at tgt = ids[:, 1:T+1], line 4", cost: "log-sum-exp over V (§3.2)" }
    - { shape: "[B, T]", label: "mask ⊙ nll", op: "multiply by m ∈ {0,1}^{B×T}", cost: "m = 0 removes direct loss; context can still receive gradient" }
    - { shape: "[1]", label: "L", op: "Σ(mask ⊙ nll)/Σ mask, or mean of per-row means", cost: "lines 5–6; token_mean needs the global Σ mask" }
```

## Implementation

```text
[B,T+1] ids -> shift -> [B,T] inputs/targets
inputs -> causal backbone -> [B,T,d_model] hidden states
hidden states * [d_model,V] weights -> [B,T,V] logits
logsumexp - target-logit -> [B,T] NLL -> valid-target sums and counts -> scalar
```

Memory reduction must preserve this scalar and its gradients. A chunked linear-cross-entropy path computes projection and reduction for subsets of flattened positions, avoiding a full BT-by-V live logits allocation. The inspected Liger implementation exposes this fused path; it also has explicit handling for unsupported combinations, so kernel availability is not a general equivalence guarantee for every loss option ([R4.26](references.md#r426), `LigerFusedLinearCrossEntropyFunction.forward`, unpinned source). PyTorch's `linear_cross_entropy` documentation describes a related fused interface on the inspected `main` documentation surface; the API's stated backend, transform, and higher-order differentiation restrictions must be checked for the selected configuration ([R4.31](references.md#r431), official documentation). Neither source establishes speed or memory gains for an unmeasured workload.

For a vocabulary partition across tensor-parallel ranks, compute the global maximum, the global exponential sum after subtracting that maximum, and the target logit from its owner shard. In the inspected Megatron Core implementation these use MAX, SUM for the selected target contribution, and SUM for the exponential denominator: three forward all-reduces in that path, not a universal two-collective rule ([R4.27](references.md#r427), `_VocabParallelCrossEntropy.forward`). Fused or combined implementations may organize communication differently. Payload is O(BT) scalars per reduction, while projection weights are vocabulary-sharded.

At BT=2^20 and V=131,072, FP32 logits alone occupy 2^20*131072*4 bytes = 512 GiB; at V=128,000 they occupy 500 GiB. These are allocation calculations, not measured peaks. The [B,T] FP32 NLL array at the same BT occupies 4 MiB. Chunking trades the live logits buffer against launch overhead, repeated weight access, and the schedule for accumulating gradients; total device memory still includes weights, optimizer state, backbone activations, workspaces, and communication buffers (DERIVED).

```figure
id: fig-4.7
kind: systems-trace
title: Where the causal-LM loss lives in the training stack
caption: >-
  The emphasised stage is the one that forces the rest: unfused FP32 logits
  are 512 GiB at 2^20 tokens and V = 131,072. Fused chunking removes that
  tensor; the inspected vocabulary-parallel path performs three forward
  all-reduces. The
  last stage decides whether the result is L_tok or a micro-batch-weighted
  imitation of it.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-4.2", R4.24, R4.25, R4.26, R4.27]
alt: >-
  Systems trace of the loss computation in six stages, with memory, compute,
  communication and failure columns. Output head: 2·D·V FLOPs per token
  forward and about twice that backward, producing [B, T, V] logits in the
  accumulation dtype. Unfused FP32 logits, emphasised: B·T·V·4 bytes, 512 GiB
  at 2^20 tokens and V = 131,072; this allocation must be compared with available memory.
  Fused linear cross-entropy in Liger Kernel: one chunk of logits live at a
  time, loss and gradient computed in the forward pass, weight gradient
  accumulated across chunks; the normalisation must be fixed before the
  kernel is called. Vocabulary-parallel softmax in Megatron-LM: an all-reduce
  MAX of logit maxima, a SUM of the owner-shard target contribution, and a
  SUM of shifted exponentials across the tensor-parallel group in its
  inspected forward path. Masked sum with F.cross_entropy: reduction sum with
  ignore_index; reduction mean is a per-call token-mean only. Global
  normalisation in TorchTitan: divide the summed loss by global_valid_tokens;
  per-micro-batch denominators make loss curves depend on accumulation steps.
spec:
  columns: [memory, compute, communication, failure]
  stages:
    - { name: "output head, W_out ∈ [D, V]", values: { memory: "[B, T, V] logits in the accumulation dtype", compute: "2·D·V FLOPs/token forward, about twice that backward" } }
    - { name: "unfused logits, FP32", values: { memory: "B·T·V·4 bytes: 512 GiB at B·T = 2^20, V = 131,072", failure: "allocation may exceed device capacity; no measured OOM is claimed" }, emphasis: true }
    - { name: "fused linear cross-entropy (Liger Kernel)", values: { memory: "one chunk of the B·T tokens' logits at a time", compute: "loss and gradient in the forward pass; weight gradient accumulated over chunks", failure: "normalisation mode must be fixed before the kernel call" } }
    - { name: "vocabulary-parallel softmax (Megatron-LM)", values: { compute: "target logit read on the rank that owns its vocabulary slice", communication: "three forward all-reduces: MAX logit maximum, SUM target contribution, SUM shifted exponentials (R4.27)" } }
    - { name: "masked sum (F.cross_entropy)", values: { compute: "reduction='sum' with ignore_index: masked targets add no gradient", failure: "reduction='mean' is a token-mean within one call only" } }
    - { name: "global normalisation (TorchTitan)", values: { compute: "summed loss divided by global_valid_tokens", failure: "per-micro-batch denominators: curves depend on accumulation steps" } }
```

```figure
id: fig-4.8
kind: stat-panel
title: Logits bytes at the Implementation's scale
caption: >-
  Every row is a byte rule from this paragraph evaluated at 2^20 tokens and
  V = 131,072 = 2^17. The logits outweigh the [B, T] NLL they reduce to by V,
  a factor of 131,072, which is why the loss is chunked or fused rather than
  materialised. The chunk count is illustrative, not a Liger Kernel default.
placement: rail
anchor: implementation
evidence: DERIVED
source: ["DERIVED:eq-4.2", R4.26, R4.27]
alt: >-
  Instrument panel for the logits of one micro-batch at B·T = 1,048,576
  tokens and V = 131,072. FP32 logits B·T·V·4 are 512 GiB; BF16 logits are
  256 GiB; logits per token are 512 KiB in FP32; with an illustrative 1,024
  chunks the live logits per chunk are 512 MiB; the per-token NLL tensor
  [B, T] in FP32 is 4 MiB. With vocabulary-parallel heads, three forward reductions in the inspected path
  per micro-batch (MAX and SUM) are needed for the log-sum-exp.
spec:
  header: "LOGITS · B·T = 2^20 TOKENS · V = 131,072"
  variables: { BT: 1048576, V: 131072, nc: 1024 }
  rows:
    - { key: "tokens per micro-batch, B·T", formula: "BT", format: integer }
    - { key: "vocabulary V", formula: "V", format: integer }
    - { key: "logits, FP32, B·T·V·4", formula: "BT*V*4", format: bytes }
    - { key: "logits, BF16, B·T·V·2", formula: "BT*V*2", format: bytes }
    - { key: "logits per token, FP32", formula: "V*4", format: bytes }
    - { key: "live per chunk, 1,024 chunks", formula: "BT*V*4/nc", format: bytes, note: "illustrative chunk count" }
    - { key: "per-token NLL [B, T], FP32", formula: "BT*4", format: bytes }
    - { key: "TP collectives per micro-batch", value: "2 (MAX, SUM)" }
```

## Experimental design

### Reported experiments

The Transformer study trains encoder-decoder translation models on WMT 2014 English-German and English-French and evaluates decoded translation with BLEU. Its training objective uses teacher-forced decoder likelihood with label smoothing; section 5.1 specifies data and batching, section 5.2 reports hardware and training schedules, section 5.4 specifies regularization, and Tables 2-3 report translation results and model variations ([P01](references.md#p01), PAPER-REPORTED). This protocol tests a complete translation system. It is not an experiment isolating token-mean versus sequence-mean normalization.

The relevant separation is between the scalar optimized during training, unsmoothed held-out likelihood, and the metric on generated sequences. The authors report that their smoothing choice worsens perplexity while improving translation accuracy and BLEU. Their architecture comparisons also vary attention and network dimensions, so they do not identify teacher forcing's isolated contribution. The original training measurements belong to the source's model, hardware, precision, and schedule; this section transfers no throughput number to current hardware.

The recurrent-model studies [R4.6](references.md#r46) and [R4.7](references.md#r47) provide distinct published interventions on sequence training and prefix construction. Their reported tasks, policies, and baselines should accompany any attributed benefit. A controlled normalization intervention for the book remains an unexecuted proposal in [verification.md](verification.md); its outcome is not a published observation.

## Observations

**What the paper claims.** The shifted and masked Transformer decoder enforces causal conditioning; the translation study also reports a task-metric/perplexity trade-off under label smoothing (PAPER-REPORTED: P01 section 3.1 and section 5.4).

**What the evidence shows.** The paper supplies a concrete causal construction and translation experiments. It does not establish a universal preferred loss denominator, an exposure-bias effect size for current foundation models, or the performance of an arbitrary fused loss kernel.

**What we infer.** Numerator, denominator, visibility, target shift, and smoothing belong in the objective specification. The distributed gradient must equal the gradient of that declared scalar; the equality can be checked algebraically before training (MATHEMATICALLY-DERIVED).

**What remains unknown.** Production normalization and packing rules for a named model remain NOT-DISCLOSED unless its own report or inspected implementation states them. The cited translation studies do not settle whether changing normalization improves any particular modern model's downstream capability.

## Failure modes

> **Failure mode — Target leakage.** *Symptom:* suspiciously easy reference prediction or unstable generation. *Cause:* unshifted targets or future-visible attention. *Detection:* perturb future IDs and compare earlier logits; compare full/incremental paths. *Mitigation:* correct target shift, visibility, and segmentation. Low loss alone is not proof (DERIVED).

> **Failure mode — Denominator drift.** *Symptom:* accumulation or rank partition changes the estimator. *Cause:* averaging unequal-count local means. *Detection:* compare gradients with a combined-batch reference at a declared tolerance. *Mitigation:* preserve global summed numerators/counts and reducer scaling (DERIVED).

> **Failure mode — Empty target set.** *Symptom:* undefined loss or nonfinite gradients. *Cause:* division by zero valid targets. *Detection:* validate global/per-sequence counts before reduction. *Mitigation:* reject invalid batches or explicitly define an exclusion policy (DERIVED).

> **Failure mode — Incorrect class axis or smoothing metric.** *Symptom:* wrong loss or shape failure. *Cause:* class dimension misalignment or treating smoothed loss as unsmoothed NLL. *Detection:* verify tensor axes and per-target reference arithmetic. *Mitigation:* flatten/transpose explicitly and specify the target distribution (R4.24 OFFICIAL-DOCUMENTATION; DERIVED).

## Siblings

Masked reconstruction changes the conditioning information and scores a selected target set; the stated MLM conditionals need not define an ordered joint likelihood. Prefix modeling instead retains a causal continuation while giving the known prefix bidirectional internal visibility. Fill-in-the-middle changes the serialized order so a causal decoder sees suffix information before predicting the missing middle. These transformations preserve or replace different parts of the probability contract and are developed in [§4.2](04-2-alternative-objectives.md) and [§4.3](04-3-code-and-structured-sequences.md).

Conditional generation can retain the same target cross-entropy while changing how text, image, or audio context reaches the decoder. Its direct target mask does not determine which conditioning parameters receive gradients. The encoder/adapter schedule and admissible visibility therefore enter the method alongside the scored target set [§4.5](04-5-conditional-and-multimodal-learning.md).



## Extensions

### Improvements

Label smoothing modifies target probabilities rather than causal factorization. It supplies gradients on non-target classes and prevents the one-hot objective from favoring arbitrarily confident fits, but its translation benefit is source- and task-specific; the Transformer observation is not a guarantee of improved calibration ([R4.23](references.md#r423); P01 section 5.4, PAPER-REPORTED).

Fused linear-cross-entropy and vocabulary sharding improve execution of the declared objective by changing intermediate storage or distribution, provided their supported options reproduce its reductions and derivatives ([R4.26](references.md#r426), [R4.27](references.md#r427), [R4.31](references.md#r431), OFFICIAL-DOCUMENTATION). They do not establish a different statistical objective merely by reducing memory.

Alternative supervision changes the specification itself: span reconstruction changes visible information and scored targets (section 4.2), FIM changes sequence construction (section 4.3), and MTP adds prediction terms (section 4.4). Each extension therefore requires a new ledger row rather than an undocumented implementation switch.

## Limitations

The chain rule guarantees a normalized joint distribution for a fixed finite sequence convention with normalized conditionals. It does not guarantee correct facts, executable code, calibrated confidence, or efficient generation. A masked objective is a selected conditional loss and is not automatically the log-likelihood of every token in the original document. EOS/termination and conditioning conventions must be included when making claims about probabilities of variable-length strings (MATHEMATICALLY-DERIVED).

The FLOP and allocation formulas above exclude optimizer updates, data loading, recomputation, communication overlap, and hardware utilization. Energy, money, and latency are NOT-DISCLOSED for this reconstructed objective; the chapter reports no execution measurement.

## Reproducibility

Record tokenizer and checkpoint identifiers, BOS/EOS rules, original/shifted tensors, visibility, document boundaries, scored-target masks, reduction denominators, smoothing, precision, and the rank/accumulation scaling equation. Save summed evaluation NLL and valid counts so that another reader can recompute the reported mean. For implementation claims, [references.md](references.md) identifies the inspected paths and actual access date; unpinned `main` reads are OFFICIAL-DOCUMENTATION, not CODE-VERIFIED.

The book has not executed Algorithm 4.1 or trained a normalization ablation. Proposed numerical and gradient checks are confined to [verification.md](verification.md).

## References

P01; R4.6, R4.7, R4.23, R4.24, R4.25, R4.26, R4.27, R4.31; notation §2.1 (Eq. N.1, N.2).
