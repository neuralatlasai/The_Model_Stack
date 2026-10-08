---
id: ms.section.4.4
entity_type: section
title: Auxiliary prediction
short_title: MTP and auxiliary losses
volume: 1
part: 1
chapter: 4
section: 4.4
slug: 04-4-auxiliary-prediction
parent: ms.chapter.4
prev_sibling: ms.section.4.3
next_sibling: ms.section.4.5
children: []
prerequisites: [ms.section.4.1, ms.section.3.2]
downstream: [ms.section.16.3, ms.section.19.1, ms.section.20.4, ms.section.37.5]
related: [ms.section.39.1]
siblings_by_mechanism: [ms.section.4.1, ms.section.4.2, ms.section.4.3]
relations:
  - {type: supported_by, target: paper.P13}
  - {type: supported_by, target: paper.P10}
  - {type: variant_of, target: concept.likelihood-objective}
axes: {lifecycle: [pretraining, inference], mechanism: [objective, auxiliary_loss, output_head], feedback_setting: [], modality: [text]}
papers: [P10, P13, P35]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 4.4 Auxiliary prediction

## Scope

Multi-token prediction adds supervised targets at future offsets to next-token training. Independent prediction heads and sequential prediction modules introduce different hidden-state dependencies and parameter costs, and their loss weights depend on which eligible targets each denominator counts. Regularizers such as softmax z-loss contribute separate additive terms with their own coefficients. The presence of these training terms does not by itself specify a multi-token generation algorithm: candidate construction, verification, acceptance, and fallback determine the inference procedure. (PAPER-REPORTED; R4.13 section2; P13 section2.2; R4.15 method; P35 Algorithm1.)

Boundaries: router mechanics belong to [§16.3](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-3-training-dynamics.md); stability instrumentation to [§20.4](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-4-stability-instrumentation.md); speculative decoding to [§37.5](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-5-speculative-decoding.md).

## Why this exists

What failed before was the conflation of three different things that all appear as "extra loss terms": auxiliary *prediction* heads that add supervision, auxiliary *regularisers* that shape logits or routing, and inference *algorithms* that reuse trained heads. The bottleneck that surfaced with sparse and very large models was stability: unbounded softmax normalisers and collapsed routers produce loss spikes that the primary objective does not prevent, so additive terms were introduced with small fixed weights (PAPER-REPORTED · R4.14, R4.15, P10). The constraint that became dominant is that every added head costs output-head FLOPs at vocabulary width, the most expensive per-token matrix product in the model. What changed is that reports now state head structure, loss weight, and whether the head is discarded at inference, which makes a ledger row possible.

## Intuition

Physically, an output head is a [d_model, V] matrix product per position; a second head at a second offset doubles that product's cost and its [B, T, V] logits. Sequential MTP modules that also contain a Transformer block add one layer's worth of FLOPs per depth. An auxiliary regulariser such as z-loss costs nothing beyond a scalar per position already available from the log-sum-exp. Heuristically, one might say MTP makes the model "plan ahead"; the resource statement is only that gradient at position t now also carries information about x_{t+2}, and that the trained head can serve as a draft proposal at inference *if* an acceptance algorithm is run.

## Formulation

Use the zero-based sequence z_0,...,z_T, with z_0 the declared initial context token. The main state h_j^0 sees z_0,...,z_j and predicts z_(j+1). Let K_mtp be the auxiliary depth count, v_j^k its binary valid-target mask, and n_k=sum_j v_j^k>0. The following reconstructs the sequential module of P13 section2.2 using the indexing of Algorithm4.4 (PAPER-REPORTED mechanism; MATHEMATICALLY-DERIVED transcription):

$$
u_j^k=M_k[\operatorname{RMSNorm}(h_j^{k-1});\operatorname{RMSNorm}(\operatorname{Emb}(z_{j+k}))],\quad
h_j^k=\operatorname{TRM}_k(u_{0:j}^k),\quad
P^k_{j+k+1}=\operatorname{softmax}(\operatorname{OutHead}(h_j^k)).
$$
*(Eq. 4.9)* for k=1,...,K_mtp and j=0,...,T-k-1 before additional masks. M_k has shape [d_model,2d_model]; TRM_k operates causally over the valid segment; Emb/OutHead weights are shared with the main model. OutHead in this equation returns logits, so softmax is shown explicitly.

$$
\mathcal L_{\mathrm{MTP}}^k=-\frac{1}{n_k}\sum_{j=0}^{T-k-1}v_j^k\log P^k_{j+k+1}(z_{j+k+1}),\qquad
\mathcal L_{\mathrm{MTP}}=\frac{1}{K_{\mathrm{mtp}}}\sum_{k=1}^{K_{\mathrm{mtp}}}\mathcal L_{\mathrm{MTP}}^k.
$$
*(Eq. 4.10)* L_MTP is an unweighted depth mean; Eq. 4.11 applies lambda_MTP once. The module at depth k can see intervening observed tokens up to z_(j+k), never its target z_(j+k+1). Padding and document eligibility further restrict v_j^k. If a depth has no eligible targets, its mean is undefined; reject it or explicitly redefine which depths enter the denominator.

```figure
id: fig-4.21
kind: matrix
title: Which audit slots carry a target at each prediction depth
caption: >-
  Row k marks the slots that have a depth-k target x_{t+k+1}; each deeper row
  loses one more slot at the end. Rows 0 and 1 are exactly the audit's
  next-token and depth-1 masks (13 and 12 targets, K_mtp = 1 as in P13). Rows 2
  and 3, at half shade, extend the index range of Eq. 4.10 to depths P13 does
  not train. Document-reset objectives additionally mask targets that cross segment boundaries.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.10", P13]
alt: >-
  Four by thirteen grid. Rows are prediction depths: next-token (k = 0),
  k = 1, k = 2 and k = 3. Columns are the 13 input slots of the verification
  sequence, BOS through ▁b. Row 0 is filled on all 13 slots; row 1 on slots 0
  to 11, 12 targets, ending with EOS at slot 11 (highlighted); row 2, at half
  shade, on slots 0 to 10, 11 targets; row 3, at half shade, on slots 0 to 9,
  10 targets. The last k slots of each row are empty because their depth-k
  target lies beyond the sequence.
spec:
  rows: 4
  cols: 13
  pattern: explicit
  cells:
    - [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    - [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0]
  rowLabel: "prediction depth k"
  colLabel: "input slot t of the audit"
  rowTicks: ["NTP, k = 0", "k = 1", "k = 2", "k = 3"]
  colTicks: ["BOS", "def", "▁add", "(", "a", ",", "▁b", ")", ":", "▁return", "▁a", "+", "▁b"]
  highlight:
    - { row: 1, col: 11 }
  legend: "filled: slot t has a depth-k target; 13, 12, 11, 10 targets; half shade: depths P13 does not train"
```

> **Definition — Multi-token prediction (training head).** An auxiliary output path trained to predict tokens at offsets beyond t+1 from the representation at t, whose loss is added to the next-token loss with a weight, and which may or may not be retained at inference.

> **Definition — Auxiliary loss.** A term added to the primary objective whose purpose is regularisation or stability of training (logit scale, routing balance) rather than the definition of the deployed predictive distribution.

The general weighted sum is

$$
\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{NTP}} + \lambda_{\text{MTP}}\,\mathcal{L}_{\text{MTP}} + c_z\,\mathcal{L}_z + c_B\,\mathcal{L}_B
$$
*(Eq. 4.11)* where L_NTP = Eq. N.2 for the next-token head, L_z = z-loss, L_B = balance loss, c_z, c_B = fixed coefficients; each term's own normalisation (token-mean, per-router-layer mean) must be stated separately because the coefficients are only meaningful relative to those normalisations (MATHEMATICALLY-DERIVED).

```figure
id: fig-4.22
kind: calculator
title: Per-target weight of the next-token and MTP terms
caption: >-
  Eq. 4.10 inside Eq. 4.11: L_NTP is a mean over n_main targets, each depth-k term
  a mean over n_main − k, and the depth terms share λ/K_mtp. A coefficient therefore
  sets a per-target weight only together with its denominator. At the audit's
  n_main = 13 a depth-1 target weighs 0.325 of a next-token target, not the 0.3
  that λ suggests; the gap closes as n_main grows.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.10", "DERIVED:eq-4.11", P13]
alt: >-
  Calculator for Eq. 4.10 and 4.11. Inputs: next-token targets per sequence n_main
  (13, 512 or 4,096), MTP weight λ (0.1, 0.3 or 1) and depth K_mtp (1 to 4).
  Outputs: the weight of one next-token target, 1/n_main; the number of depth-1
  targets, n_main − 1; the weight of one depth-1 target, λ/(K_mtp·(n_main − 1)); their
  ratio; the MTP share of the loss coefficients, λ/(1 + λ); and the targets
  at depth K_mtp, n_main − K_mtp. At the defaults n_main = 13, λ = 0.3, K_mtp = 1: 1/13 = 0.0769,
  12 depth-1 targets, 0.3/12 = 0.025, ratio 0.325, share 23.1%. At n_main = 4,096
  and λ = 0.1 the ratio is 0.100 and the share 9.1%. At λ = 1 and K_mtp = 3 the
  share is 50% and 4,093 depth-3 targets remain.
spec:
  tex: >-
    \mathcal{L}_{\text{total}} = \mathcal{L}_{\text{NTP}} + \frac{\lambda}{K_{\mathrm{mtp}}}\sum_{k=1}^{K_{\mathrm{mtp}}}\mathcal{L}^{k}_{\text{MTP}},
    \qquad w_{\text{NTP}} = \frac{1}{n_main},\qquad w_{1} = \frac{\lambda}{K_mtp\,(n_main-1)}
  equation: "4.10"
  inputs:
    - { symbol: n_main, label: "next-token targets per sequence, n_main", default: 13, min: 13, max: 4096, options: [13, 512, 4096], format: integer }
    - { symbol: lam, label: "MTP loss weight λ", default: 0.3, min: 0.1, max: 1, options: [0.1, 0.3, 1], format: fixed2 }
    - { symbol: K_mtp, label: "MTP depth K_mtp", default: 1, min: 1, max: 4, options: [1, 2, 3, 4], format: integer }
  outputs:
    - { symbol: wN, label: "weight of one next-token target, 1/n_main", formula: "1/n_main", format: raw }
    - { symbol: n1, label: "depth-1 targets, n_main − 1", formula: "n_main - 1", format: integer }
    - { symbol: w1, label: "weight of one depth-1 target, λ/(K_mtp·(n_main−1))", formula: "lam/(K_mtp*(n_main - 1))", format: raw }
    - { symbol: R, label: "depth-1 ÷ next-token weight per target", formula: "w1/wN", format: fixed3, emphasis: true }
    - { symbol: S, label: "MTP share of loss coefficients, λ/(1 + λ)", formula: "lam/(1 + lam)", format: percent }
    - { symbol: nD, label: "targets at depth K_mtp, n_main − K_mtp", formula: "n_main - K_mtp", format: integer }
states:
  - { anchor: formulation, label: "audit, λ = 0.3, K_mtp = 1", variables: { n_main: 13, lam: 0.3, K_mtp: 1 }, highlight: [wN, w1, R], note: "On the audit L_NTP averages 13 targets and L_MTP 12: a depth-1 target weighs 0.3/12 = 0.025 against 1/13 = 0.077, a ratio of 0.325 rather than λ = 0.3." }
  - { anchor: mechanism, label: "λ = 0.1 after 10T tokens", variables: { n_main: 4096, lam: 0.1, K_mtp: 1 }, highlight: [S, R], note: "P13's second phase uses λ = 0.1 for the last 4.8T of 14.8T tokens: the MTP share of the loss coefficients falls from 23.1% to 9.1%; at long n_main the per-target ratio is λ itself." }
  - { anchor: failure-modes, label: "λ = 1, K_mtp = 3", variables: { n_main: 4096, lam: 1, K_mtp: 3 }, highlight: [S, nD], note: "At an illustrative λ = 1 the auxiliary term holds half the coefficient mass; at K_mtp = 3 the last 3 positions of every packed document lack a depth-3 target and must be masked." }
```

## Mechanism

### Methodology

Separate three objects: a training graph with additional prediction losses, an inference graph that retains or discards auxiliary modules, and a verification/acceptance rule that converts proposed tokens into deployed samples. Their costs and correctness claims differ. A training improvement can remain when only the first prediction head is used; a faster draft path can exist without demonstrating better first-head capability (DERIVED).

DeepSeek-V3's sequential module combines the preceding prediction-depth representation with the embedding of the next observed token, normalizes both, projects their concatenation, and applies a causal Transformer block. Its embedding and vocabulary output weights are shared with the main model ([P13](references.md#p13), section 2.2, PAPER-REPORTED). Teacher forcing supplies the intervening token during training. During speculative use that input must instead come from an accepted or proposed continuation, with acceptance handled by the decoding algorithm.

Use K_mtp for the auxiliary depth count; global D continues to denote training tokens. Define each depth loss as an unweighted mean over its own valid targets, then average over depths and apply lambda_MTP exactly once in Eq. 4.11. For a sequence with n main targets, depth k has n-k targets before additional masks. Different denominators mean lambda is not the per-target gradient-weight ratio. Padding, context truncation, document segmentation, and target availability all enter depth validity (MATHEMATICALLY-DERIVED).

The independent-head construction of Gloeckle et al. uses a shared trunk, a separate Transformer layer for each prediction offset, and a shared unembedding. It is not merely n unrelated d_model-by-V matrices and does not have zero additional block cost ([R4.13](references.md#r4-13), section 2, PAPER-REPORTED). Its memory-efficient schedule computes head forward/backward passes sequentially and accumulates the gradient into the shared trunk. The cited asymptotic memory reduction concerns the head/logits working set; it does not eliminate stored weights, optimizer state, or the trunk activations.

For the sequential construction, one auxiliary depth adds its block parameters and approximately 2d_model^2 projection parameters, plus normalization parameters, while reusing embedding/output weights. Dense projection forward work adds approximately 4d_model^2 per position; the shared output projection still executes again at approximately 2d_model V FLOPs. Extra block attention/MLP work and backward work are additional. Stored-weight fraction is not activated-compute fraction in a sparse model, and no architecture-independent overhead percentage follows from the depth count (DERIVED).

Auxiliary regularizers use different feedback. PaLM's output z-loss and ST-MoE's router z-loss penalize a squared log-normalizer at different sites ([R4.14](references.md#r4-14), section 5; [R4.15](references.md#r4-15), router z-loss, PAPER-REPORTED). For a logit vector a with Z=sum_j exp a_j, the derivative of c_z(log Z)^2 is 2c_z log Z*softmax(a). A reused log-sum-exp reduces forward work but does not eliminate that derivative, reduction work, or distributed synchronization (MATHEMATICALLY-DERIVED).

Switch's balancing term couples dispatched-token fractions and mean routing probabilities, whereas DeepSeek-V3 combines bias-based balancing with a small sequence-wise auxiliary term ([P10](references.md#p10), section 2.2; P13 section 2.1, PAPER-REPORTED). Define the expert count locally as E_expert, preserving N for model parameters. Router accounting, dropped/capacity-limited tokens, and per-layer versus per-sequence means belong to the term's normalization contract.

Coefficient interpretation requires both loss units and gradient scales. Doubling a summed loss's target count doubles its gradient at fixed coefficient; a mean behaves differently. Monitoring primary/auxiliary gradient norms and conflict can diagnose weighting effects, but it does not establish an optimal coefficient without an empirical intervention (DERIVED).

Exact stochastic speculative decoding uses a specified proposal distribution, acceptance probability, and residual correction; tree verification or choosing a plausible head output alone does not guarantee the target distribution ([P35](references.md#p35), Algorithm 1, PAPER-REPORTED). Medusa's verification/acceptance variants must be named when comparing quality and speed (R4.16 section 3). A universal distribution-preservation claim cannot be inferred from the presence of multiple heads.

```figure
id: fig-4.23
kind: diagram
title: One sequential MTP module (K_mtp = 1) in the training graph
caption: >-
  The heavy path is the depth-1 module: it reads h⁰ and the embedding of the
  next token, so the prediction of x_{t+2} keeps the full causal chain. Its
  only private weights are M_1 and TRM_1; the embedding and output head are
  the main model's. The two dashed exits are the inference choices: discard
  the module, or use it as a draft, which changes nothing without an
  acceptance rule.
placement: wide
evidence: PAPER-REPORTED
source: [P13, P35, "DERIVED:eq-4.9"]
alt: >-
  Diagram of Eq. 4.9 to 4.11 with K_mtp = 1, following Algorithm 4.4. Token ids
  [B, T+1] enter the main trunk f_θ of L blocks, giving h⁰ [B, T, d]. The
  main path applies the shared output head to h⁰ and scores the next token,
  L_NTP. The emphasised MTP path takes h⁰ for positions up to T − 1 and the
  shared embedding of x_{t+1}, RMS-normalises both and concatenates them to
  [B, T−1, 2d], projects with M_1 in ℝ^{d×2d} (2d² parameters), runs one
  Transformer block TRM_1 under a causal mask, and applies the same shared
  output head (another 2·d·V FLOPs per token) to score x_{t+2}, L_MTP. Both
  losses feed L_total = L_NTP + λ·L_MTP with λ = 0.3 then 0.1 in P13. At
  inference the module is either discarded, leaving the main model unchanged,
  or repurposed as a draft for speculative decoding, which needs an
  acceptance rule (P35).
spec:
  direction: LR
  nodes:
    - { id: ids, kind: tensor, label: "token ids", sub: "[B, T+1], Algorithm 4.4" }
    - { id: trunk, kind: model, label: "main trunk f_θ", sub: "L blocks" }
    - { id: h0, kind: tensor, label: "h⁰, main representation", sub: "[B, T, d]" }
    - { id: head0, kind: process, label: "OutHead, next token", sub: "shared [d, V]", group: shared }
    - { id: ntp, kind: objective, label: "L_NTP, token-mean CE", sub: "targets x_{t+1}" }
    - { id: emb, kind: process, label: "Emb(x_{t+1})", sub: "shared embedding, [B, T−1, d]", group: shared }
    - { id: cat, kind: process, label: "RMSNorm both, concatenate", sub: "[B, T−1, 2d]", group: mod }
    - { id: mk, kind: process, label: "projection M_1 ∈ ℝ^{d×2d}", sub: "2d² parameters", group: mod }
    - { id: trm, kind: process, label: "TRM_1, one Transformer block", sub: "causal mask; [B, T−1, d]", group: mod }
    - { id: head1, kind: process, label: "OutHead, depth 1", sub: "same weights; +2·d·V FLOPs/token", group: shared }
    - { id: mtp, kind: objective, label: "L_MTP, targets x_{t+2}", sub: "positions 3 … T+1" }
    - { id: tot, kind: objective, label: "L_total = L_NTP + λ·L_MTP", sub: "λ = 0.3, then 0.1 (P13)", emphasis: true }
    - { id: drop, kind: state, label: "inference: module discarded", sub: "main model runs unchanged" }
    - { id: spec, kind: process, label: "speculative decoding with the module as draft", sub: "needs an acceptance rule (P35)" }
  edges:
    - { from: ids, to: trunk }
    - { from: trunk, to: h0 }
    - { from: h0, to: head0 }
    - { from: head0, to: ntp }
    - { from: h0, to: cat, kind: emphasis, label: "h⁰ for t ≤ T − 1" }
    - { from: ids, to: emb, label: "x_{t+1}" }
    - { from: emb, to: cat }
    - { from: cat, to: mk, kind: emphasis }
    - { from: mk, to: trm, kind: emphasis }
    - { from: trm, to: head1, kind: emphasis }
    - { from: head1, to: mtp }
    - { from: ntp, to: tot }
    - { from: mtp, to: tot, label: "× λ (K_mtp = 1)" }
    - { from: trm, to: drop, kind: dependency, label: "discard" }
    - { from: trm, to: spec, kind: dependency, label: "or repurpose as a draft" }
  groups:
    - { id: shared, label: "shared with the main model" }
    - { id: mod, label: "MTP module 1, private weights" }
```

```figure
id: fig-4.24
kind: stat-panel
title: DeepSeek-V3's MTP ledger row as disclosed
caption: >-
  Every value is from the report (P13) or the repository README (R4.29,
  OFFICIAL-DOCUMENTATION); the two percentage rows are arithmetic on them. The
  block glyph shows why the stored-weight share, about 2%, says nothing about
  compute: the model is sparse, and the module's share of activated FLOPs is
  not disclosed.
placement: rail
anchor: mechanism
evidence: PAPER-REPORTED
source: [P13, R4.29]
alt: >-
  Instrument panel for DeepSeek-V3's multi-token prediction as reported. MTP
  depth K_mtp = 1. Loss weight λ = 0.3 for the first 10T tokens and 0.1 for the
  remaining 4.8T, of 14.8T pre-training tokens, so 67.6% of tokens are
  trained at λ = 0.3. Stored weights 685B, of which 671B main model and 14B
  MTP module, a 2.04% share. Sequence-wise balance coefficient α = 0.0001.
  The module's share of activated FLOPs is NOT-DISCLOSED. At inference the
  module is discarded or used as a speculative draft. A block glyph compares
  671B main-model weights with 14B module weights.
spec:
  header: "DEEPSEEK-V3 · MTP AS REPORTED"
  variables: { main: 671, mtp: 14, t1: 10, t2: 4.8 }
  rows:
    - { key: "MTP depth K_mtp", value: "1" }
    - { key: "λ, first 10T tokens", value: "0.3" }
    - { key: "λ, remaining 4.8T tokens", value: "0.1" }
    - { key: "pre-training tokens, trillions", formula: "t1 + t2", format: fixed1 }
    - { key: "share of tokens at λ = 0.3", formula: "t1/(t1 + t2)", format: percent }
    - { key: "stored weights, billions", formula: "main + mtp", format: integer, note: "R4.29 README" }
    - { key: "MTP module weights, billions", formula: "mtp", format: integer }
    - { key: "MTP share of stored weights", formula: "mtp/(main + mtp)", format: percent }
    - { key: "sequence-wise balance α", value: "0.0001" }
    - { key: "MTP share of activated FLOPs", value: "NOT-DISCLOSED" }
    - { key: "at inference", value: "discarded, or a speculative draft" }
  glyph:
    type: blocks
    items:
      - { label: "main model 671B", weight: 671 }
      - { label: "MTP module 14B", weight: 14, emphasis: true }
```

```figure
id: fig-4.25
kind: compare
title: Training heads, regularisers and inference algorithms kept apart
caption: >-
  The row to read is the second-to-last: in no column does a trained head
  fix the deployed distribution by itself. Heads add a term to the training
  graph and a cost at vocabulary width; the sampler is fixed by the next-token
  head or by an acceptance or verification rule. The z-loss and balance
  column changes the objective but never the sampler.
placement: wide
evidence: PAPER-REPORTED
source: [P13, R4.13, R4.16, P35, R4.14, R4.15, P10]
concepts: [ms.section.4.4, ms.section.37.5]
alt: >-
  Comparison of five mechanisms. Sequential MTP (P13): a training head that
  may later serve as a draft; adds λ·L_MTP; one block plus 2d² parameters per
  depth with the embedding and output head shared; about one block plus
  2·d·V plus 4·d² forward FLOPs per token per depth; one extra [B, T, V]
  logits tensor unless fused; the sampler is the next-token head if the
  module is discarded, or an acceptance rule if drafted; λ = 0.3 then 0.1,
  K_mtp = 1. Parallel heads (R4.13): a CE term per head; (n − 1)·d·V parameters
  and (n − 1) extra output-head evaluations; peak memory O(nV + d) reduced to
  O(V + d) by sequential head backward; used for self-speculative decoding.
  Medusa heads (R4.16): extra decoding heads verified by tree attention.
  Speculative decoding (P35): an inference algorithm with no objective change;
  its acceptance rule keeps the target distribution. z-loss and balance
  losses (R4.14, R4.15, P10): regularisers with reduction and gradient costs; coefficients
  10⁻⁴·log²Z, c_z = 0.001, α = 10⁻², and 0.0001 in P13; the sampler is
  unchanged.
spec:
  axis: >-
    What each mechanism adds to the training graph, what it costs per token,
    and what fixes the deployed sampler's distribution
  columns:
    - { id: seq, label: "Sequential MTP (P13)", node: ms.section.4.4 }
    - { id: par, label: "Parallel heads (R4.13)", node: ms.section.4.4 }
    - { id: med, label: "Medusa heads (R4.16)" }
    - { id: spd, label: "Speculative decoding (P35)", node: ms.section.37.5 }
    - { id: reg, label: "z-loss, balance losses" }
  rows:
    - { dimension: "category", values: { seq: "training head; optional draft", par: "training heads; self-speculative draft", med: "extra decoding heads", spd: "inference algorithm", reg: "auxiliary regulariser" } }
    - { dimension: "term added to the objective", values: { seq: "λ·L_MTP, Eq. 4.10", par: "one CE term per head", med: "not costed in §4.4", spd: "none", reg: "c_z·L_z or c_B·L_B, Eq. 4.11" } }
    - { dimension: "extra parameters", values: { seq: "one block + 2d² per depth; Emb and OutHead shared", par: "(n − 1)·d·V", med: "not stated in §4.4", spd: "a draft source", reg: "none" } }
    - { dimension: "extra FLOPs per token", values: { seq: "≈ one block + 2·d·V + 4·d² forward, per depth", par: "(n − 1) output-head evaluations", med: "not stated in §4.4", spd: "draft proposals + verification by the target model", reg: "≈ 0: one square per position" } }
    - { dimension: "peak logits memory", values: { seq: "one extra [B, T, V] unless fused", par: "O(nV + d) → O(V + d), sequential head backward", med: "not stated in §4.4", spd: "not a training cost", reg: "none" } }
    - { dimension: "what fixes the deployed distribution", values: { seq: "next-token head if discarded; acceptance rule if drafted", par: "acceptance rule of self-speculative decoding", med: "tree-attention verification of candidates", spd: "acceptance rule: target distribution unchanged", reg: "the next-token head; sampler unchanged" } }
    - { dimension: "disclosed coefficient", values: { seq: "λ = 0.3 → 0.1, K_mtp = 1", par: "not given here", med: "not given here", spd: "none", reg: "10⁻⁴·log²Z; c_z = 0.001; α = 10⁻²; 0.0001 (P13)" } }
```

## Algorithm

```text
Algorithm 4.4 — One sequential auxiliary depth, explicit zero-based alignment
INPUT z[B,T+1] with initial context token z[:,0], main-valid[B,T],
      segment IDs, main trunk, auxiliary projection/block, shared Emb/OutHead, lambda
PRECONDITIONS T>=2; valid target counts for each retained loss are positive
OUTPUT declared scalar objective, valid target counts, and gradients/metadata
1 h0 <- main_trunk(z[:,0:T], segment-aware causal visibility)       # [B,T,d_model]
2 L_NTP <- masked_mean_CE(OutHead(h0), z[:,1:T+1], main-valid)
3 e <- Emb(z[:,1:T])                                              # [B,T-1,d_model]
4 u <- M1*concat(RMSNorm(h0[:,:T-1]), RMSNorm(e))                   # [B,T-1,d_model]
5 h1 <- auxiliary_block(u, segment-aware causal visibility)
6 valid1[j] <- target z[j+2] exists and is eligible, and positions
                j,j+1,j+2 belong to the same permitted segment
7 L_MTP <- masked_mean_CE(OutHead(h1), z[:,2:T+1], valid1)
8 L_total <- L_NTP + lambda*L_MTP; differentiate shared and private parameters
INVARIANT auxiliary state at j sees at most z[0:j+2] (exclusive upper bound);
          its target z[j+2] is unseen; lambda is applied once
```

BOS/segment-start conventions may require special segment assignment; the validity predicate must match the declared document model. This algorithm reconstructs the paper's causal alignment and makes a book boundary policy explicit; it is not a claim about an uninspected training implementation. Complexity is the main graph plus projection, one auxiliary block, and one vocabulary projection over T-1 positions. Cross-entropy already includes its stated mean, so there is no second division by the target count.

## Implementation

```text
main: z[:,:T] -> trunk -> h0[B,T,d_model] -> shared output head -> main mean CE
aux:  h0[:,:T-1] + Emb(z[:,1:T]) -> normalize/concatenate/project
      -> causal auxiliary block -> shared output head -> CE against z[:,2:T+1]
```

Unfused heads can materialize both [B,T,V] and [B,T-1,V] logits. Fusing each projection/loss or sequencing head backward passes can reduce the live logits buffer; the actual peak depends on retained graphs and saved tensors. Each vocabulary-parallel loss also requires its global normalizer and target contribution, whose communication schedule is implementation-specific (section 4.1). A private block introduces activation and weight-gradient communication according to the selected parallelism layout (DERIVED).

The inspected DeepSeek-V3 README documents separately released main-model and MTP weights ([R4.29](references.md#r4-29), OFFICIAL-DOCUMENTATION). Weight availability does not establish support in every inference runtime. Pipeline placement, balance, draft scheduling, and cache organization require an inspected implementation; this chapter does not infer them from module position in an architecture diagram. Energy, money, latency, and speedup remain UNVERIFIED for the reconstructed graph.

## Experimental design

### Reported experiments

Gloeckle et al. compare next-token and multi-token training over code and natural-language settings, separating first-head capability evaluation from self-speculative inference. Their code benchmarks estimate pass@k from sampled candidates; the source's Table 1 uses 200 candidates per problem and selects temperatures using test scores. The latter is an oracle selection protocol, not a held-out calibration procedure, and affects interpretation of the reported comparison ([R4.13](references.md#r4-13), section 3 and Appendix G, PAPER-REPORTED). Reported execution-time findings belong to their architectures, head scheduling, hardware, and batching, rather than proving auxiliary computation is free.

DeepSeek-V3 section 4.5.1 Table 4 compares models with and without one MTP depth at two disclosed scales. Within each pair it holds the data amount and other architecture choices fixed, and discards MTP for ordinary inference (P13, PAPER-REPORTED). Equal training tokens here do not mean equal training FLOPs because the auxiliary path adds work. These experiments support a capability comparison under that token budget, not an isolated matched-compute optimality result.

The 2026 planning study evaluates graph path finding, Countdown, and SAT, then analyzes a restricted two-layer Transformer on a specified star-graph construction ([R4.34](references.md#r4-34), sections 4-5, PAPER-REPORTED). Its mechanistic/theoretical statements carry those architecture and data assumptions; they do not establish that all MTP foundation models learn a universal planning algorithm.

## Observations

**What the paper claims.** The independent-head study reports capability and self-speculative decoding benefits in its tested settings. DeepSeek-V3 reports favorable benchmark differences with MTP retained during training and discarded during standard inference (PAPER-REPORTED: R4.13 section 3; P13 section 4.5.1).

**What the evidence shows.** First-head quality and draft utility are different measured outcomes. The DeepSeek comparisons control tokens rather than total FLOPs, and the independent-head code results include oracle temperature selection. The 2026 planning analysis is conditional on its explicitly restricted mathematical setting (R4.34 section 5).

**What we infer.** Training overhead must count auxiliary blocks and repeated vocabulary projection even when weights are shared. Coefficients must be interpreted with their own valid-target denominators. A claimed draft speedup requires measured acceptance, verification work, and scheduling, beyond an architectural diagram (MATHEMATICALLY-DERIVED).

**What remains unknown.** The cited evidence does not establish a universal MTP depth/weight, a matched-compute advantage across scales, or distribution preservation for an unspecified acceptance heuristic. No implementation or benchmark was run for this chapter.

## Failure modes

> **Failure mode — Weighting or double normalization error.** *Symptom:* total loss changes unexpectedly with offset counts or depth. *Cause:* applying lambda twice, dividing an already averaged CE again, or mixing sums and means. *Detection:* expand scalar weights for a small fixture. *Mitigation:* define unweighted depth means and apply each coefficient once (DERIVED).

> **Failure mode — Cross-boundary targets.** *Symptom:* targets use an unrelated document or unavailable future slot. *Cause:* slicing offsets without segment/padding eligibility. *Detection:* inspect target indices and segment IDs. *Mitigation:* enforce the declared same-segment policy; concatenated-stream modeling requires a different explicit contract (DERIVED).

> **Failure mode — Draft mistaken for exact sampler.** *Symptom:* quality or sample frequencies change under accelerated decoding. *Cause:* missing or different acceptance/residual correction. *Detection:* audit the algorithm and compare the stated target/proposal distributions. *Mitigation:* use the exact acceptance rule when distribution preservation is required (P35, PAPER-REPORTED).

> **Failure mode — Misattributed instability.** *Symptom:* nonfinite logits/losses. *Cause:* potentially multiple numerical or optimization failures. *Detection:* trace finite values and each weighted loss/gradient before attributing a normalizer cause. *Mitigation:* apply a source-supported regularizer only with its site and normalization specified (R4.14-R4.15; DERIVED).

## Siblings

Single-head next-token training scores one immediate continuation per eligible state. Multi-token training adds offset-specific prediction paths with their own denominators, private blocks, and repeated output-projection work. Span corruption changes the input and target distribution instead of adding future-offset heads; its sentinel reconstruction therefore changes the conditioning contract [§4.2](04-2-alternative-objectives.md).

Distillation supplies a teacher distribution or teacher-generated responses rather than extra ground-truth offsets. Full-distribution KL requires teacher output access and a declared temperature/reduction, whereas response distillation can retain ordinary token cross-entropy on a changed dataset. Combining distillation with MTP requires separately specified targets, weights, and gradients [§39.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/39-1-distillation-objectives.md).



## Extensions

### Improvements

Sequential prediction-depth modules preserve intermediate-token conditioning, while independent parallel heads predict offsets from a shared trunk. These methods have different train/inference conditioning contracts and should not share an undifferentiated head-cost row (P13 section 2.2; R4.13 section 2).

MuToR introduces register tokens for multi-token prediction ([R4.32](references.md#r4-32), method and experiments, PAPER-REPORTED). Its mechanism changes how prediction-specific state is represented; it is a distinct alternative to adding independent vocabulary matrices. The curriculum study compares ordering of next-token and multi-token phases and distinguishes quality gains from the availability of useful self-speculative heads ([R4.33](references.md#r4-33), method and experiments, PAPER-REPORTED). These descendants broaden the experimental design space; their findings do not settle a universal preferred ordering.

The 2026 planning study links its restricted empirical tasks and mathematical analysis to how future supervision shapes learned computation (R4.34 sections 4-5). A reader should retain its assumptions and tests when using that explanation, rather than turning the word planning into an unmeasured general capability.

### Register state, curriculum, and a bounded planning mechanism

MuToR interleaves learned register inputs after ordinary tokens. A register after x_t predicts x_(t+d), with d sampled per sequence from a bounded offset set. Ordinary token rows cannot attend registers; register rows cannot attend other registers and receive only admissible earlier ordinary-token information. The offset is represented by the register position ID t+d-1, while ordinary positions retain their original IDs. Embeddings, blocks, and output head are otherwise shared, permitting register removal at inference (R4.32 section3.2, PAPER-REPORTED).

This construction separates the ordinary-token path from prediction-specific state. Removing registers leaves that path's visibility unchanged, provided positions and masks implement the stated contract. It does not remove training work: full register insertion increases processed rows and output projections. If a naive implementation doubles sequence length, dense attention score allocation can approach four times the original length-squared allocation; a structured mask avoids invalid interactions but requires a suitable kernel to realize savings. These are shape-derived bounds, not reported runtime measurements (DERIVED).

The curriculum study changes the number of active prediction offsets in stages. A forward schedule adds offsets; a reverse schedule removes them, ending with next-token training. It compares both linear-layer and Transformer-layer heads, model sizes1.3B/3B, and byte/subword settings. Its measured inference axis counts forward passes rather than wall-clock latency. The source reports main-head and auxiliary-draft outcomes separately; improvements over static MTP do not universally exceed its NTP baseline (R4.33 sections2.2-3.3, PAPER-REPORTED).

The2026 planning analysis supplies a narrower optimization explanation. In its two-layer disentangled Transformer and star-graph construction, a shallow future-token loss bypasses the second layer's parameters. Theorem2 analyzes a staged gradient-flow procedure with a fixed zero content weight, a Toeplitz positional structure, then freezing the learned first-layer positional component before optimizing the second layer. Theorem3's NTP comparison additionally fixes its stated graph length and zero initialization. These premises support the paper's particular gradient/circuit analysis; they do not prove an impossibility for arbitrary NTP architectures, initialization, optimization, or tasks (R4.34 section5.3, PAPER-REPORTED).

## Limitations

MTP defines additional supervised offsets and can be studied for first-head capability even if no auxiliary draft is deployed. Its validity does not require a small output-head cost or a speculative decoder. Efficiency depends on the full block/projection/loss execution graph and the chosen comparison budget.

The cited token-budget ablations and oracle-selected evaluations do not establish universal matched-FLOP superiority. Regularization effects, capability, exact sampling, and measured speed are separate claims. No training or decoding experiment was performed here.

## Reproducibility

Record trunk/head block allocations, shared versus private weights, depth/offset indexing, intervening-token inputs, document/padding validity, each loss reduction, coefficient schedule, and gradient-accumulation scaling. Report training tokens and FLOPs separately. For capability, record which heads are active and how decoding temperature was selected; for acceleration, additionally record proposal/acceptance rules, precision, runtime, lengths, batching, hardware, and measurement boundary. The book has performed no training or decoding benchmark; proposed alignment checks reside in [verification.md](verification.md).

## References

P10, P13, P35; R4.13, R4.14, R4.15, R4.16, R4.29, R4.32, R4.33, R4.34.
