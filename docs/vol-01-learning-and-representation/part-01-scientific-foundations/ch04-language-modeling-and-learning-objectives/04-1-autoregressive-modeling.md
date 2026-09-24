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
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, KNOWN, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 4.1 Autoregressive modeling

## Scope

Objective: derive the autoregressive objective from the chain rule, fix the token-level and sequence-level likelihoods as distinct quantities with distinct normalisations, and state teacher forcing and causal conditioning as the procedure that makes the objective computable in one forward pass. Baseline: Eq. N.1/N.2 of the shared contract, which this section develops but does not redefine. Success: a reader can write the input, target, and mask tensors of a causal LM step from the ledger row alone and can say which gradient each normalisation produces. Boundaries: sampling and decoding belong to §37; the Transformer block that computes the conditionals belongs to §5.

## Why this exists

What failed before was the treatment of "next-token prediction" as a self-explanatory phrase. It hides three separate decisions: the factorisation order, the training-time conditioning (ground truth or model samples), and the normalisation of the summed log-likelihood. The bottleneck was that reported losses became incomparable once teams normalised over different denominators — the shared contract now requires every chapter to state whether a mean is over tokens, sequences, or ranks (KNOWN: [notation](../../../front-matter/notation.md) §2.1). The dominant constraint is compute: the factorisation must be evaluated for all T positions in one pass, which forces teacher forcing and a causal mask. What changed is that the procedure is written out as tensors and gradients rather than as a slogan.

## Intuition

Physically, a causal model is a machine that, per position, must produce a categorical distribution over V symbols from a state that summarises the prefix; its objective measures coding length. The cost of evaluating the objective over a sequence is T output-head evaluations plus the backbone; the cost of *sampling* from the model is also T evaluations but sequential, which is why training and inference have different critical paths (MATHEMATICALLY-DERIVED: the factorisation is the same, the data dependence is not). Heuristically, one may say the model "learns to predict"; that analogy explains nothing about why the gradient at position t depends only on prefixes, so the derivation below is the explanation.

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
  - { anchor: experimental-design, label: "balanced ablation", variables: { n1: 500, n2: 500 }, highlight: [Dgap], note: "Experiment 4.1's ablation: on balanced lengths the two modes coincide exactly, gap 0.000, whatever ℓ_1 and ℓ_2 are." }
  - { anchor: failure-modes, label: "per-micro-batch mean", variables: { n1: 10, n2: 1000 }, highlight: [Lseq, Dgap], note: "Micro-batch denominator: one sequence per micro-batch, each normalised by its own count, then averaged, is L_seq = 2.500, not the global token-mean 2.010." }
```

> **Assumption.** Logarithms are natural; loss is reported in nats per token unless stated · *sensitivity:* a report in bits divides by ln 2 and a report per byte changes the denominator entirely (§4.6).

## Mechanism

Eq. 4.1 is exact for any ordering by the chain rule; left-to-right is a choice, not a theorem (MATHEMATICALLY-DERIVED). The choice becomes a *conditioning constraint* on the network: the representation at position t that produces p_θ(x_t | x_{<t}) must not depend on x_{≥t}. In a Transformer this is implemented as an additive −∞ mask on attention logits for key positions j > i (PAPER-REPORTED · P01, decoder self-attention). Because every conditional uses the ground-truth prefix, all T conditionals are evaluated in one parallel forward pass, which is what makes the objective affordable: without teacher forcing, position t would need samples from positions < t and the evaluation would be sequential (MATHEMATICALLY-DERIVED).

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

The gradient of the two estimators differs in how sequences are weighted (MATHEMATICALLY-DERIVED · DERIVED:eq-4.2):

<details><summary>Derivation of the weighting difference in Eq. 4.2</summary>

Let ℓ_i = −Σ_t m^{(i)}_t log p_θ(x^{(i)}_t | ·) and n_i = Σ_t m^{(i)}_t. Then ∇L_tok = Σ_i ∇ℓ_i / Σ_i n_i, so each *token* has weight 1/Σ_i n_i regardless of which sequence it came from. ∇L_seq = (1/B) Σ_i ∇ℓ_i / n_i, so each *sequence* has total weight 1/B and each token inside it has weight 1/(B n_i). A 10-token response and a 1,000-token response contribute equally under L_seq and contribute in a 1:100 ratio under L_tok. With gradient accumulation across micro-batches the denominator of L_tok must be the *global* token count, otherwise micro-batches with fewer valid tokens are over-weighted.

</details>

Exposure bias names the consequence of teacher forcing: at inference the prefix is the model's own sample, a distribution never encountered during training. That this mismatch exists is a matter of definition (MATHEMATICALLY-DERIVED). That it matters was argued for recurrent models: R4.6 states that the train/test discrepancy "makes generation brittle, as errors may accumulate along the way", and R4.7 states that "This discrepancy between training and inference can yield errors that can accumulate quickly" and proposes a curriculum "from a fully guided scheme using the true previous token, towards a less guided scheme which mostly uses the generated token instead" (PAPER-REPORTED · R4.6, R4.7). Neither abstract uses the phrase "exposure bias"; the term is the field's later name for the phenomenon (KNOWN · R4.6, R4.7 abstracts, accessed 2026-09-20). Whether the effect is material at foundation-model scale, where post-training on sampled sequences follows pretraining, is UNVERIFIED in this edition; the book does not assert a magnitude.

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
    - { id: prefix, kind: state, label: "own-sample prefix x̂_{<t}", sub: "never seen in training", group: infer }
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

Cost line: the objective adds no parameters beyond the output head; per training token the output head costs 2·d_model·V FLOPs forward and about twice that backward, and the logits tensor is [B, T, V] in the accumulation dtype, which for large V is the single largest activation in the step (DERIVED from the matrix shapes; see [§3.4](../ch03-numerical-computation-and-trustworthy-training/03-4-mixed-precision-execution.md) for dtype choices).

## Algorithm

```text
Algorithm 4.1 — Teacher-forced causal LM step
INPUT   ids ∈ ℕ^{B×(T+1)} (BOS-prefixed token ids), mask ∈ {0,1}^{B×T}, params θ, mode ∈ {token_mean, seq_mean}
OUTPUT  scalar loss L, gradient ∇θ L
STATE   logits ∈ ℝ^{B×T×V} in accumulation dtype
INVARIANT  logits[:, t, :] depends only on ids[:, 0..t] (causal); loss uses only positions with mask = 1
1  inp    ← ids[:, 0:T]                          # x_0 = BOS, …, x_{T-1}
2  tgt    ← ids[:, 1:T+1]                        # shifted targets x_1, …, x_T
3  logits ← f_θ(inp, causal_mask)                # one parallel forward pass
4  nll    ← −log_softmax(logits).gather(tgt)     # ℝ^{B×T}, via log-sum-exp (§3.2)
5  if mode = token_mean:  L ← Σ(mask ⊙ nll) / Σ mask          # global token count
6  else:                  L ← mean_i [ Σ_t(mask_i ⊙ nll_i) / Σ_t mask_i ]
7  ∇θ L ← backprop(L)                            # terminates after one backward pass
```
Complexity: O(B·T·(N_backbone + d_model·V)) FLOPs per step; the shift in lines 1–2 is the only objective-specific operation. Implementation link: `torch.nn.functional.cross_entropy` documents `ignore_index` as "a target value that is ignored and does not contribute to the input gradient" and, for `reduction='mean'`, that "the loss is averaged over non-ignored targets" — so it implements mask ⊙ nll and the token-mean of line 5 *within one call*; the global denominator across micro-batches must be supplied by the caller (OFFICIAL-DOCUMENTATION · PyTorch 2.14.0 documentation for `cross_entropy` [R4.24], accessed 2026-09-20). TorchTitan's reference loss does exactly this: its `cross_entropy_loss` calls `F.cross_entropy(pred.float(), labels, reduction="sum", ignore_index=IGNORE_INDEX)` and the trainer divides by `global_valid_tokens` (KNOWN · `torchtitan/components/loss.py` on the `main` branch [R4.25], accessed 2026-09-20; commit not pinned).

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
    - { shape: "[B, T]", label: "mask ⊙ nll", op: "multiply by m ∈ {0,1}^{B×T}", cost: "m = 0 positions carry no gradient" }
    - { shape: "[1]", label: "L", op: "Σ(mask ⊙ nll)/Σ mask, or mean of per-row means", cost: "lines 5–6; token_mean needs the global Σ mask" }
```

## Implementation

Tensor trace for one micro-batch:

```text
Tensor trace
[B, T] ids → embed → [B, T, D] → L causal blocks (§5) → [B, T, D] → W_out ∈ [D, V] → [B, T, V] logits → log_softmax over V → gather targets → [B, T] nll → mask ⊙ → reduce → []
```

The framework layer (PyTorch) provides `cross_entropy(ignore_index=…)`. At the Kernels / numerics layer, Liger Kernel's fused linear cross-entropy handles "the forward and backward pass of the final linear layer via cross-entropy loss by avoiding the materialization of the large logits tensor": it partitions the BT tokens into chunks, computes each chunk's logits against the output-head weight, computes loss *and* gradient in the forward pass ("Since Cross Entropy Loss is the last layer, we can compute the gradient at the forward pass"), and accumulates the weight gradient across chunks (KNOWN · `src/liger_kernel/ops/fused_linear_cross_entropy.py` on `main` [R4.26], accessed 2026-09-20; commit not pinned). The consequence for the ledger is that per-token losses are reduced inside the kernel, so the normalisation mode must be decided before the kernel is called. At the Distributed training layer, the `vocab_parallel_cross_entropy` of the NVIDIA/Megatron-LM repository — whose README states "This repository contains two components: Megatron-LM and Megatron Core", the file living under `megatron/core/`, i.e. in the NVIDIA Megatron-Core component — computes the loss when "logits are split across tensor parallel ranks" with an `all_reduce(…, ReduceOp.MAX)` of the per-rank logit maximum followed by an `all_reduce(…, ReduceOp.SUM)` of the per-rank sum of exponentials, gathering the target logit only on the rank that owns that vocabulary slice (KNOWN · `megatron/core/tensor_parallel/cross_entropy.py` on `main` [R4.27], accessed 2026-09-20; commit not pinned). Memory: unfused logits occupy [B, T, V] × 4 bytes in FP32; for B·T = 2^20 tokens and V = 128k this is 512 GiB before chunking (DERIVED), which is why chunked or fused losses are not optional at scale. Communication: with vocabulary-parallel output heads the log-sum-exp requires exactly two small collectives (max and sum-exp) per micro-batch across the tensor-parallel group (DERIVED from the softmax denominator; consistent with R4.27; the collective cost is developed in §29).

```figure
id: fig-4.7
kind: systems-trace
title: Where the causal-LM loss lives in the training stack
caption: >-
  The emphasised stage is the one that forces the rest: unfused FP32 logits
  are 512 GiB at 2^20 tokens and V = 128k. Fused chunking removes that
  tensor, vocabulary sharding adds exactly two small collectives, and only the
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
  at 2^20 tokens and V = 128k; failure is out-of-memory before any chunking.
  Fused linear cross-entropy in Liger Kernel: one chunk of logits live at a
  time, loss and gradient computed in the forward pass, weight gradient
  accumulated across chunks; the normalisation must be fixed before the
  kernel is called. Vocabulary-parallel softmax in Megatron-LM: an all-reduce
  MAX of logit maxima and an all-reduce SUM of sum-exp across the
  tensor-parallel group per micro-batch; the target logit is read on the
  owning shard. Masked sum with F.cross_entropy: reduction sum with
  ignore_index; reduction mean is a per-call token-mean only. Global
  normalisation in TorchTitan: divide the summed loss by global_valid_tokens;
  per-micro-batch denominators make loss curves depend on accumulation steps.
spec:
  columns: [memory, compute, communication, failure]
  stages:
    - { name: "output head, W_out ∈ [D, V]", values: { memory: "[B, T, V] logits in the accumulation dtype", compute: "2·D·V FLOPs/token forward, about twice that backward" } }
    - { name: "unfused logits, FP32", values: { memory: "B·T·V·4 bytes: 512 GiB at B·T = 2^20, V = 128k", failure: "out of memory before any chunking" }, emphasis: true }
    - { name: "fused linear cross-entropy (Liger Kernel)", values: { memory: "one chunk of the B·T tokens' logits at a time", compute: "loss and gradient in the forward pass; weight gradient accumulated over chunks", failure: "normalisation mode must be fixed before the kernel call" } }
    - { name: "vocabulary-parallel softmax (Megatron-LM)", values: { compute: "target logit read on the rank that owns its vocabulary slice", communication: "all_reduce MAX of logit maxima, then all_reduce SUM of sum-exp, per micro-batch, TP group" } }
    - { name: "masked sum (F.cross_entropy)", values: { compute: "reduction='sum' with ignore_index: masked targets add no gradient", failure: "reduction='mean' is a token-mean within one call only" } }
    - { name: "global normalisation (TorchTitan)", values: { compute: "summed loss divided by global_valid_tokens", failure: "per-micro-batch denominators: curves depend on accumulation steps" } }
```

```figure
id: fig-4.8
kind: stat-panel
title: Logits bytes at the Implementation's scale
caption: >-
  Every row is a byte rule from this paragraph evaluated at 2^20 tokens and
  V = 128k = 2^17. The logits outweigh the [B, T] NLL they reduce to by V,
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
  [B, T] in FP32 is 4 MiB. With vocabulary-parallel heads, two collectives
  per micro-batch (MAX and SUM) are needed for the log-sum-exp.
spec:
  header: "LOGITS · B·T = 2^20 TOKENS · V = 128k"
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

### Experiment 4.1 — Token-mean versus sequence-mean normalisation under length imbalance

- **Hypothesis:** with a length-imbalanced mixture, L_seq up-weights short sequences and measurably shifts held-out loss on the short-sequence slice relative to L_tok at equal token budget.
- **Setup:** the §3.5 reference Transformer; two runs differing only in line 5/6 of Algorithm 4.1.
- **Independent variables:** normalisation mode.
- **Controlled variables:** data order, seeds, tokenizer, batch token count, optimizer, schedule.
- **Dataset/workload:** a public corpus with a bimodal length distribution; splits per §6.2.
- **Hardware:** one accelerator; irrelevant to the hypothesis but recorded.
- **Metrics:** token-mean held-out NLL on short-slice and long-slice separately (Eq. 4.2 left), in nats/token.
- **Baselines:** L_tok run.
- **Expected result:** short-slice NLL lower under L_seq; long-slice NLL higher; aggregate token-mean NLL higher under L_seq.
- **Ablation:** balanced-length corpus, where the two modes should coincide within seed variance.
- **Interpretation:** confirms that the normalisation is part of the objective, not a reporting detail.
- **Threats to validity:** seed variance (§6.4); length correlating with domain.

This is a proposal; no run was executed.

## Observations

**What the paper claims.** P01 modifies "the self-attention sub-layer in the decoder stack to prevent positions from attending to subsequent positions", which "combined with fact that the output embeddings are offset by one position, ensures that the predictions for position i can depend only on the known outputs at positions less than i"; it trains with "label smoothing of value ε_ls = 0.1" and states that "This hurts perplexity, as the model learns to be more unsure, but improves accuracy and BLEU score" (PAPER-REPORTED · P01 §3.1, §5.4). Label smoothing itself is the regulariser of R4.23, q′(k|x) = (1−ε)δ_{k,y} + ε/K (PAPER-REPORTED · R4.23).

**What the evidence shows.** The factorisation and mask semantics are definitional and need no independent support. The label-smoothing observation of P01 is a direct demonstration that a lower held-out likelihood and a better task metric can move in opposite directions, which §4.6 develops. That a reference trainer normalises by the global valid-token count is directly supported by the TorchTitan source (KNOWN · R4.25).

**What we infer.** Any reported loss that omits the normalisation mode and the mask definition should be treated as underspecified (DERIVED from Eq. 4.2). We further infer, and mark ASSUMED, that most decoder-only pretraining runs use L_tok with the global token denominator, because it matches the token-budget accounting of §21 and the one open reference trainer inspected does so; no lab report inspected for this edition states its choice explicitly, so for any named model it is NOT-DISCLOSED.

**What remains unknown.** The practical magnitude of exposure bias at scale is UNVERIFIED; whether sequence-mean normalisation in pretraining changes downstream capability rather than only slice losses is an open question.

> **Open question.** Does teacher-forced likelihood at pretraining scale leave a measurable exposure-bias signature after post-training on sampled sequences? · *what evidence would settle it:* matched-budget runs with and without a sampled-prefix term, evaluated on long-horizon generation with independent verifiers.

## Failure modes

> **Failure mode — Off-by-one target shift.** *Symptom:* training loss near log V or near zero immediately. *Cause:* targets not shifted (predicting x_t from a prefix including x_t) or shifted twice. *Detection:* a tiny-batch overfit (§3.5) that succeeds in one step, or a loss below the unigram entropy at step 0. *Mitigation:* assert `tgt = ids[:,1:]`, `inp = ids[:,:-1]` in a fixture test.

> **Failure mode — Micro-batch denominator.** *Symptom:* loss curves depend on gradient-accumulation steps at fixed global batch. *Cause:* each micro-batch normalised by its own token count then averaged. *Detection:* compare a run with accumulation 1 and accumulation k at the same global token count; curves should coincide. *Mitigation:* divide by the global masked-token count.

> **Failure mode — Causal-mask leak.** *Symptom:* implausibly low training loss, catastrophic sampled text. *Cause:* mask applied after softmax, or padding mask overriding the causal mask. *Detection:* the §5.5 check that full-sequence and incremental decoding agree. *Mitigation:* additive −∞ mask before softmax with log-sum-exp (§3.2).

## Siblings

**Masked language modeling** — [04-2-alternative-objectives.md](04-2-alternative-objectives.md)
Why it exists: representations for classification wanted bidirectional context. What assumption changed: the network may see x_{>t}. What objective changed: reconstruct a masked subset instead of the full ordered product. What problem it solved: bidirectional encoders. What new failure mode it introduced: no exact sequence likelihood; generation needs a separate decoder. Changed primitive: causal mask → bidirectional mask plus [MASK] tokens.

**Prefix LM** — [04-2-alternative-objectives.md](04-2-alternative-objectives.md)
Why it exists: conditioning text is known in full at inference. What assumption changed: prefix positions may attend bidirectionally. What objective changed: loss only on the continuation. What problem it solved: encoder-like prefix representations in one parameter stack. What new failure mode it introduced: the loss covers fewer tokens per sequence (lower target-length ratio). Changed primitive: full causal mask → block mask.

**Fill-in-the-middle** — [04-3-code-and-structured-sequences.md](04-3-code-and-structured-sequences.md)
Why it exists: editors need infilling. What assumption changed: the document may be rearranged before the causal objective is applied. What objective changed: none; the sequence changed. What problem it solved: suffix conditioning in a causal model. What new failure mode it introduced: sentinel misuse at inference. Changed primitive: document order.

**Conditional generation p(x | c) with non-text c** — [04-5-conditional-and-multimodal-learning.md](04-5-conditional-and-multimodal-learning.md)
Why it exists: images, audio, actions. What assumption changed: c is not a token sequence. What objective changed: none in form; the conditioning interface changed. What problem it solved: multimodal decoders. What new failure mode it introduced: loss silently applied to conditioning placeholders. Changed primitive: text prefix → encoder outputs in the prefix.

## Extensions

Long context changes nothing in Eq. 4.1 but changes which positions dominate the mean: a token-mean over 128k-token documents is dominated by late positions with rich context, so losses across context lengths are not comparable (DERIVED; §4.6). For agents, the sequence interleaves model turns, tool outputs, and user text, and m_t must zero the non-model spans, developed in [§31.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-1-sft-objectives.md). For embodiment, the "tokens" may be discretised actions, developed in [§60.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch60-vision-language-action-policies-and-embodied-learning/60-2-action-generation.md); the factorisation is unchanged (proposal-level mapping, ASSUMED).

## Limitations

The objective is valid wherever the data are sequences with a fixed order and the deployment task is sampling continuations. It is falsified as a *deployment* objective whenever the metric of interest is not monotone in likelihood — P01's label-smoothing result is one such case. Decision consequence: choose the normalisation from the deployment unit (token cost vs task cost) and record it in the ledger before training, not after.

## Reproducibility

Versions: PyTorch 2.14.0 documentation for `cross_entropy` [R4.24]; TorchTitan `main` [R4.25], Liger Kernel `main` [R4.26], Megatron-LM `main` [R4.27] — all accessed 2026-09-20 with no commit pinned, so any behaviour stated here is KNOWN for that date only. Artifacts: the ledger row `causal_lm` in [verification.md](verification.md). Configuration: mode ∈ {token_mean, seq_mean}, BOS handling, global denominator. Metric definitions: nats per masked token. Unresolved: production normalisation choices of named labs are NOT-DISCLOSED.

## References

P01; R4.6, R4.7, R4.23, R4.24, R4.25, R4.26, R4.27; notation §2.1 (Eq. N.1, N.2).
