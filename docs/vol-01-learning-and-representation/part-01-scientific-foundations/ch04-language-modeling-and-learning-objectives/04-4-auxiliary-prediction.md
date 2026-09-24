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
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 4.4 Auxiliary prediction

## Scope

Objective: specify multi-token prediction (MTP) as a training head with its own ledger row, specify auxiliary losses (softmax z-loss, router balance losses) as additive regularisers with explicit weights, state the loss-weighting problem, and draw the line between a *training head* and an *inference algorithm*. Baseline: the causal row of §4.1 with a single next-token head. Success: the reader can write the MTP loss of P13 with its positions and weight, can cost an MTP module in parameters and FLOPs, and can explain why "the model predicts several tokens at once" is true of the training graph and false of the deployed sampler unless a separate decoding algorithm is used. Boundaries: router mechanics belong to [§16.3](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-3-training-dynamics.md); stability instrumentation to [§20.4](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-4-stability-instrumentation.md); speculative decoding to [§37.5](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-5-speculative-decoding.md).

## Why this exists

What failed before was the conflation of three different things that all appear as "extra loss terms": auxiliary *prediction* heads that add supervision, auxiliary *regularisers* that shape logits or routing, and inference *algorithms* that reuse trained heads. The bottleneck that surfaced with sparse and very large models was stability: unbounded softmax normalisers and collapsed routers produce loss spikes that the primary objective does not prevent, so additive terms were introduced with small fixed weights (PAPER-REPORTED · R4.14, R4.15, P10). The constraint that became dominant is that every added head costs output-head FLOPs at vocabulary width, the most expensive per-token matrix product in the model. What changed is that reports now state head structure, loss weight, and whether the head is discarded at inference, which makes a ledger row possible.

## Intuition

Physically, an output head is a [d_model, V] matrix product per position; a second head at a second offset doubles that product's cost and its [B, T, V] logits. Sequential MTP modules that also contain a Transformer block add one layer's worth of FLOPs per depth. An auxiliary regulariser such as z-loss costs nothing beyond a scalar per position already available from the log-sum-exp. Heuristically, one might say MTP makes the model "plan ahead"; the resource statement is only that gradient at position t now also carries information about x_{t+2}, and that the trained head can serve as a draft proposal at inference *if* an acceptance algorithm is run.

## Formulation

Let h_t^0 be the main-model representation at position t and P^k_t the distribution produced by MTP module k. P13's sequential MTP (PAPER-REPORTED · P13 §2.2) is:

$$
h'^{\,k}_t = M_k\big[\mathrm{RMSNorm}(h^{k-1}_t);\ \mathrm{RMSNorm}(\mathrm{Emb}(x_{t+k}))\big],\qquad h^k_{1:T-k} = \mathrm{TRM}_k\big(h'^{\,k}_{1:T-k}\big),\qquad P^k_{t+k+1} = \mathrm{OutHead}(h^k_t)
$$
*(Eq. 4.9)* where M_k ∈ ℝ^{d×2d} = projection of module k, TRM_k = the module's Transformer block, Emb and OutHead = the embedding and output head shared with the main model, [·;·] = concatenation.

$$
\mathcal{L}^{k}_{\text{MTP}} = \mathrm{CrossEntropy}\big(P^k_{2+k:T+1},\ x_{2+k:T+1}\big),\qquad
\mathcal{L}_{\text{MTP}} = \frac{\lambda}{D}\sum_{k=1}^{D}\mathcal{L}^{k}_{\text{MTP}}
$$
*(Eq. 4.10)* where D = MTP depth, λ = MTP loss weight; the total training loss is the main next-token loss plus L_MTP (PAPER-REPORTED · P13 §2.2). The mask for depth k covers positions 2+k … T+1, i.e. the last k positions of the sequence have no depth-k target (MATHEMATICALLY-DERIVED from the index range).

```figure
id: fig-4.21
kind: matrix
title: Which audit slots carry a target at each prediction depth
caption: >-
  Row k marks the slots that have a depth-k target x_{t+k+1}; each deeper row
  loses one more slot at the end. Rows 0 and 1 are exactly the audit's
  next-token and depth-1 masks (13 and 12 targets, D = 1 as in P13). Rows 2
  and 3, at half shade, extend the index range of Eq. 4.10 to depths P13 does
  not train. In packed sequences the same loss recurs at every document end.
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
  Eq. 4.10 inside Eq. 4.11: L_NTP is a mean over N targets, each depth-k term
  a mean over N − k, and the depth terms share λ/D. A coefficient therefore
  sets a per-target weight only together with its denominator. At the audit's
  N = 13 a depth-1 target weighs 0.325 of a next-token target, not the 0.3
  that λ suggests; the gap closes as N grows.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.10", "DERIVED:eq-4.11", P13]
alt: >-
  Calculator for Eq. 4.10 and 4.11. Inputs: next-token targets per sequence N
  (13, 512 or 4,096), MTP weight λ (0.1, 0.3 or 1) and depth D (1 to 4).
  Outputs: the weight of one next-token target, 1/N; the number of depth-1
  targets, N − 1; the weight of one depth-1 target, λ/(D·(N − 1)); their
  ratio; the MTP share of the loss coefficients, λ/(1 + λ); and the targets
  at depth D, N − D. At the defaults N = 13, λ = 0.3, D = 1: 1/13 = 0.0769,
  12 depth-1 targets, 0.3/12 = 0.025, ratio 0.325, share 23.1%. At N = 4,096
  and λ = 0.1 the ratio is 0.100 and the share 9.1%. At λ = 1 and D = 3 the
  share is 50% and 4,093 depth-3 targets remain.
spec:
  tex: >-
    \mathcal{L}_{\text{total}} = \mathcal{L}_{\text{NTP}} + \frac{\lambda}{D}\sum_{k=1}^{D}\mathcal{L}^{k}_{\text{MTP}},
    \qquad w_{\text{NTP}} = \frac{1}{N},\qquad w_{1} = \frac{\lambda}{D\,(N-1)}
  equation: "4.10"
  inputs:
    - { symbol: N, label: "next-token targets per sequence, N", default: 13, min: 13, max: 4096, options: [13, 512, 4096], format: integer }
    - { symbol: lam, label: "MTP loss weight λ", default: 0.3, min: 0.1, max: 1, options: [0.1, 0.3, 1], format: fixed2 }
    - { symbol: D, label: "MTP depth D", default: 1, min: 1, max: 4, options: [1, 2, 3, 4], format: integer }
  outputs:
    - { symbol: wN, label: "weight of one next-token target, 1/N", formula: "1/N", format: raw }
    - { symbol: n1, label: "depth-1 targets, N − 1", formula: "N - 1", format: integer }
    - { symbol: w1, label: "weight of one depth-1 target, λ/(D·(N−1))", formula: "lam/(D*(N - 1))", format: raw }
    - { symbol: R, label: "depth-1 ÷ next-token weight per target", formula: "w1/wN", format: fixed3, emphasis: true }
    - { symbol: S, label: "MTP share of loss coefficients, λ/(1 + λ)", formula: "lam/(1 + lam)", format: percent }
    - { symbol: nD, label: "targets at depth D, N − D", formula: "N - D", format: integer }
states:
  - { anchor: formulation, label: "audit, λ = 0.3, D = 1", variables: { N: 13, lam: 0.3, D: 1 }, highlight: [wN, w1, R], note: "On the audit L_NTP averages 13 targets and L_MTP 12: a depth-1 target weighs 0.3/12 = 0.025 against 1/13 = 0.077, a ratio of 0.325 rather than λ = 0.3." }
  - { anchor: mechanism, label: "λ = 0.1 after 10T tokens", variables: { N: 4096, lam: 0.1, D: 1 }, highlight: [S, R], note: "P13's second phase uses λ = 0.1 for the last 4.8T of 14.8T tokens: the MTP share of the loss coefficients falls from 23.1% to 9.1%; at long N the per-target ratio is λ itself." }
  - { anchor: failure-modes, label: "λ = 1, D = 3", variables: { N: 4096, lam: 1, D: 3 }, highlight: [S, nD], note: "At an illustrative λ = 1 the auxiliary term holds half the coefficient mass; at D = 3 the last 3 positions of every packed document lack a depth-3 target and must be masked." }
```

## Mechanism

**Sequential MTP (P13).** Each MTP module is built from "a shared embedding layer Emb(·), a shared output head OutHead(·), a Transformer block TRM_k(·), and a projection matrix M_k ∈ ℝ^{d×2d}"; "Different from Gloeckle et al. (2024), which parallelly predicts D additional tokens using independent output heads, we sequentially predict additional tokens and keep the complete causal chain at each prediction depth" (PAPER-REPORTED · P13 §2.2). For DeepSeek-V3, "The multi-token prediction depth D is set to 1, i.e., besides the exact next token, each token will predict one additional token", and "The MTP loss weight λ is set to 0.3 for the first 10T tokens, and to 0.1 for the remaining 4.8T tokens" of a 14.8T-token pre-training run (PAPER-REPORTED · P13 §4). At inference, "we can directly discard the MTP modules and the main model can function independently and normally. Additionally, we can also repurpose these MTP modules for speculative decoding to further improve the generation latency" (PAPER-REPORTED · P13 §2.2). The report's ablation table attributes benchmark improvements to MTP with the modules discarded at inference (PAPER-REPORTED · P13 §4.5); an acceptance-rate figure for the second token under speculative use is discussed in the report's evaluation section but could not be confirmed in the rendering fetched for this edition, so the book quotes none (UNVERIFIED).

```figure
id: fig-4.23
kind: diagram
title: One sequential MTP module (D = 1) in the training graph
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
  Diagram of Eq. 4.9 to 4.11 with D = 1, following Algorithm 4.4. Token ids
  [B, T+2] enter the main trunk f_θ of L blocks, giving h⁰ [B, T, d]. The
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
    - { id: ids, kind: tensor, label: "token ids", sub: "[B, T+2], Algorithm 4.4" }
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
    - { from: mtp, to: tot, label: "× λ (D = 1)" }
    - { from: trm, to: drop, kind: dependency, label: "discard" }
    - { from: trm, to: spec, kind: dependency, label: "or repurpose as a draft" }
  groups:
    - { id: shared, label: "shared with the main model" }
    - { id: mod, label: "MTP module 1, private weights" }
```

Cost line for one sequential MTP module with a block of the main model's size (DERIVED from Eq. 4.9): parameters = one Transformer block + 2d² for M_k (embedding and output head shared, so zero additional); FLOPs per token ≈ one extra block forward/backward + one extra output-head evaluation (2·d·V forward) + the M_k product (4·d² forward); activation memory = one extra [B, T, V] logits tensor unless fused. For a model with L layers the relative training overhead is roughly (1 + share of the output head)/L per depth — small for large L, but the output-head term does not shrink with L (DERIVED). The released artifact gives the one disclosed size: "The total size of DeepSeek-V3 models on Hugging Face is 685B, which includes 671B of the Main Model weights and 14B of the Multi-Token Prediction (MTP) Module weights", and the same README notes that "MTP support is currently under active development within the community" for inference frameworks (OFFICIAL-DOCUMENTATION · R4.29, DeepSeek-V3 repository README, accessed 2026-09-20). A 14B module against a 671B main model is about 2% of stored weights for D = 1; because the model is sparse, the module's share of *activated* compute per token is not the same ratio and is NOT-DISCLOSED as a FLOP figure.

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
  depth D = 1. Loss weight λ = 0.3 for the first 10T tokens and 0.1 for the
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
    - { key: "MTP depth D", value: "1" }
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

**Parallel independent heads (R4.13).** The alternative predicts "the following n tokens using n independent output heads, operating on top of a shared model trunk", and the paper trains the heads sequentially in the backward pass — "we sequentially compute the forward and backward pass of each independent output head, accumulating gradients at the trunk" — which reduces peak memory "from O(nV+d) to O(V+d), at no expense in runtime" (PAPER-REPORTED · R4.13). Cost: n−1 extra [d, V] heads in parameters and n−1 extra output-head evaluations per token; no extra block (DERIVED).

**z-loss.** PaLM adds "an auxiliary loss of z_loss = 10⁻⁴·log²Z to encourage the softmax normalizer log(Z) to be close to 0, which we found increases the stability of training" (PAPER-REPORTED · R4.14 §5). ST-MoE applies the same form to the router: L_z = (1/B) Σ_i (log Σ_j exp x^{(i)}_j)², which "penalizes large logits into the gating network", with a recommended coefficient of 0.001 chosen by sweep, in a total loss L_CE + c_B L_B + c_z L_z (PAPER-REPORTED · R4.15). Cost: one square and one add per position from a quantity the log-sum-exp already computes; effectively zero (DERIVED).

**Router balance loss.** Switch Transformers use loss = α·N·Σ_i f_i·P_i with f_i "the fraction of tokens dispatched to expert i", P_i "the fraction of the router probability allocated for expert i", and α = 10⁻² chosen as "sufficiently large to ensure load balancing while small enough to not overwhelm the primary cross-entropy objective" (PAPER-REPORTED · P10 §2.2). P13 instead uses an auxiliary-loss-free bias-based balancing strategy with a complementary sequence-wise balance loss whose coefficient is "α to 0.0001, just to avoid extreme imbalance within any single sequence" (PAPER-REPORTED · P13 §2.1). Mechanics are developed in [§16.3](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-3-training-dynamics.md); here they are ledger rows with weight, normalisation unit (per router layer, per sequence), and a stated purpose.

**Loss weighting.** The coefficients in Eq. 4.11 are hyperparameters with no principled scale: P13 reports a *schedule* for λ, P10 and R4.15 report *sweeps* for α and c_z (PAPER-REPORTED). Because each term has its own normalisation, a coefficient reported for one codebase does not transfer to another that normalises differently (MATHEMATICALLY-DERIVED).

**Training head versus inference algorithm.** The MTP loss defines a training graph. The deployed sampler is defined by a decoding algorithm: standard decoding uses only the next-token head; speculative decoding (P35) uses a draft to propose tokens and an acceptance rule that keeps the target model's distribution "without changing the distribution" (PAPER-REPORTED · P35); Medusa adds "extra decoding heads to predict multiple subsequent tokens in parallel" and verifies candidates with "a tree-based attention mechanism" (PAPER-REPORTED · R4.16); R4.13 uses its heads for "self-speculative decoding". In every case the *objective* is unchanged by the inference algorithm and the *sampler's distribution* is fixed by the acceptance rule, not by the head. A head without an acceptance rule is a training device; an acceptance rule without a head is an inference device that needs some draft source (MATHEMATICALLY-DERIVED).

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
  D = 1. Parallel heads (R4.13): a CE term per head; (n − 1)·d·V parameters
  and (n − 1) extra output-head evaluations; peak memory O(nV + d) reduced to
  O(V + d) by sequential head backward; used for self-speculative decoding.
  Medusa heads (R4.16): extra decoding heads verified by tree attention.
  Speculative decoding (P35): an inference algorithm with no objective change;
  its acceptance rule keeps the target distribution. z-loss and balance
  losses (R4.14, R4.15, P10): regularisers with near-zero cost; coefficients
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
    - { dimension: "disclosed coefficient", values: { seq: "λ = 0.3 → 0.1, D = 1", par: "not given here", med: "not given here", spd: "none", reg: "10⁻⁴·log²Z; c_z = 0.001; α = 10⁻²; 0.0001 (P13)" } }
```

## Algorithm

```text
Algorithm 4.4 — Training step with one sequential MTP module (D = 1), P13 layout
INPUT   ids ∈ ℕ^{B×(T+2)}, mask ∈ {0,1}^{B×T}, main model f_θ, module (M_1, TRM_1), shared Emb/OutHead, λ
OUTPUT  L_total, ∇θ
STATE   h^0 ∈ ℝ^{B×T×d} (main trunk output), h^1 ∈ ℝ^{B×(T−1)×d}
INVARIANT  P^0_t depends on ids[≤ t−1]; P^1_{t+2} depends on ids[≤ t+1] (causal chain preserved at depth 1)
1  h^0    ← f_θ.trunk(ids[:, 0:T])                                   # main model
2  L_NTP  ← CE(OutHead(h^0), ids[:, 1:T+1]; mask) / Σ mask            # Eq. N.2, token-mean
3  e      ← Emb(ids[:, 1:T])                                          # x_{t+1} for t = 1..T−1
4  h'     ← M_1 [RMSNorm(h^0[:, 0:T−1]); RMSNorm(e)]                  # Eq. 4.9
5  h^1    ← TRM_1(h', causal_mask)
6  L_MTP  ← CE(OutHead(h^1), ids[:, 2:T+1]; mask[:, 1:T]) / Σ mask[:, 1:T]   # positions 3..T+1 in 1-based terms
7  L_total ← L_NTP + λ · L_MTP                                        # Eq. 4.10 with D = 1
8  ∇θ ← backprop(L_total); terminates after one backward pass
```
Complexity: main step + one block + one output-head evaluation over T−1 positions. Implementation link: no reference-stack implementation was inspected for this edition (UNVERIFIED); the algorithm is transcribed from P13's description, not from code.

## Implementation

```text
Tensor trace (D = 1 MTP)
[B, T, d] h^0 ─┬→ OutHead → [B, T, V] → CE → L_NTP
               └→ slice [B, T−1, d] ⊕ Emb(x_{t+1}) [B, T−1, d] → concat [B, T−1, 2d] → M_1 → [B, T−1, d] → TRM_1 → [B, T−1, d] → OutHead → [B, T−1, V] → CE → L_MTP
```

Memory: two logits tensors of [B, T, V] unless the head loss is fused (§4.1 Implementation); R4.13's sequential head backward is the unfused mitigation, freeing each head's logits before the next (PAPER-REPORTED · R4.13). Communication: with vocabulary-parallel heads, each additional head adds one more max/sum-exp collective pair per micro-batch (DERIVED from §4.1). With pipeline parallelism the MTP block sits at the last stage, adding to that stage's imbalance (DERIVED; P13's pipeline placement of the MTP module is NOT-DISCLOSED beyond the report's general description).

## Experimental design

### Experiment 4.4 — MTP head retained versus discarded, at matched training compute

- **Hypothesis:** at matched *training* FLOPs (the MTP run trains fewer tokens to pay for its head), the MTP run's next-token held-out NLL with the module discarded is not better than the baseline's; any gain appears only in thresholded task metrics or in decode latency when the head is used for speculation.
- **Setup:** §3.5 reference model; baseline vs D = 1 sequential MTP with λ from a small sweep.
- **Independent variables:** MTP on/off; λ ∈ {0.1, 0.3}; head discarded vs used as draft.
- **Controlled variables:** training FLOPs (not tokens), seeds, data order, tokenizer.
- **Dataset/workload:** public text corpus; decode workload with fixed prompt distribution.
- **Hardware:** one accelerator; latency measured inside the process.
- **Metrics:** next-token NLL (nats/token); tokens/s in decode with and without draft use; acceptance rate of drafted tokens; p50/p95 ITL.
- **Baselines:** no MTP.
- **Expected result:** the report's benchmark gains (P13) are not guaranteed to appear as NLL gains at matched FLOPs; decode speedup depends on acceptance rate.
- **Ablation:** λ schedule vs constant λ.
- **Interpretation:** separates the training-signal effect from the inference-algorithm effect.
- **Threats to validity:** the reference model is far below P13's scale; acceptance rates are workload-dependent.

Proposal only; no run was executed.

## Observations

**What the paper claims.** P13 claims MTP with D = 1 and a scheduled λ improves benchmark performance with the modules discarded at inference, and that the modules can be repurposed for speculative decoding (PAPER-REPORTED · P13). R4.13 claims gains that grow with model size and up to 3× faster inference through self-speculative decoding (PAPER-REPORTED · R4.13). R4.14 and R4.15 claim z-loss improves stability; P10 claims its balance loss keeps experts loaded (PAPER-REPORTED).

**What the evidence shows.** All are within-report ablations. P13's ablation is at matched *tokens* as described, not matched FLOPs including the module (UNVERIFIED as to the exact accounting); no independent matched-compute reproduction of either MTP formulation is known to the book. The stability claims for z-loss are consistent across two independent reports (R4.14, R4.15), which is the strongest evidence in this section.

**What we infer.** The head is cheap relative to a deep trunk but not free, and the output-head term does not amortise with depth (DERIVED). We infer, marked ASSUMED, that the decode benefit of MTP heads is bounded by the acceptance rule and the workload exactly as for any draft model, so a training-time head should be evaluated by §37.5's methodology, not by its training loss.

**What remains unknown.** Whether MTP improves next-token NLL at matched FLOPs is UNVERIFIED. The interaction of MTP with document-boundary masking in packed sequences is NOT-DISCLOSED in P13. Coefficient transfer across codebases with different normalisations is untested.

## Failure modes

> **Failure mode — Auxiliary term dominates.** *Symptom:* next-token NLL stalls while total loss falls. *Cause:* coefficient too large relative to the primary term's normalisation. *Detection:* log each term separately, always. *Mitigation:* sweep coefficients per codebase; schedule λ downward as P13 does.

> **Failure mode — Cross-boundary MTP targets.** *Symptom:* MTP loss anomalously high at fixed offsets. *Cause:* depth-k targets crossing packed-document boundaries. *Detection:* per-position MTP loss histogram aligned to boundaries. *Mitigation:* zero the MTP mask for the last k positions of each document.

> **Failure mode — Head mistaken for sampler.** *Symptom:* a claimed "k tokens per step" speedup that does not reproduce. *Cause:* using head outputs directly without an acceptance rule, which changes the sampled distribution. *Detection:* distributional test of outputs against next-token decoding (§37.5). *Mitigation:* implement acceptance/rejection (P35).

> **Failure mode — Unbounded normaliser.** *Symptom:* loss spikes, NaNs in BF16 logits. *Cause:* softmax normaliser drifting large. *Detection:* track log Z statistics (§20.4). *Mitigation:* z-loss (R4.14).

## Siblings

**Causal LM (single head)** — [04-1-autoregressive-modeling.md](04-1-autoregressive-modeling.md)
Why it exists: the base row. What assumption changed here: only t+1 is a target. What objective changed: none. What problem it solved: minimal head cost. What new failure mode it introduced: none of the weighting ones. Changed primitive: several heads → one.

**Span corruption** — [04-2-alternative-objectives.md](04-2-alternative-objectives.md)
Why it exists: denser bidirectional supervision. What assumption changed: targets are removed from the input, not predicted in addition to it. What objective changed: reconstruction rather than added prediction. What problem it solved: encoder training. What new failure mode it introduced: sentinels. Changed primitive: auxiliary head → corruption plus decoder.

**Distillation objectives** — [§39.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/39-1-distillation-objectives.md)
Why it exists: soft targets from a teacher. What assumption changed: the extra term targets a distribution, not future tokens. What objective changed: KL to teacher added (Eq. N.7). What problem it solved: transfer to a smaller student. What new failure mode it introduced: teacher access and cost. Changed primitive: future-token head → teacher-logit term.

## Extensions

For MoE the balance term is part of the architecture's training contract, developed in [§16.3](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-3-training-dynamics.md). For long context, MTP's extra logits scale with T and make fused losses more important. For multimodality, auxiliary heads over image or action tokens follow the same ledger row with a different V (ASSUMED mapping, developed in Part X). For agents, no auxiliary head changes the tool-call contract; that is a serialisation matter (§10.5).

## Limitations

The MTP row is valid where the output head's cost is small relative to the trunk and where a draft-acceptance algorithm exists to realise decode gains; it is falsified as a *quality* intervention if Experiment 4.4 shows no matched-FLOP NLL or task gain. Auxiliary regularisers are valid as stability devices; any capability claim for them is unsupported here. Decision consequence: log every term separately, record its normalisation, and never report a speedup from a head without the acceptance rule that produced it.

## Reproducibility

Versions: P13 arXiv 2412.19437 (HTML rendering accessed 2026-09-20); R4.13 arXiv 2404.19737 (HTML, accessed 2026-09-20); R4.14, R4.15, P10, R4.16, P35 arXiv pages accessed 2026-09-20. Artifacts: ledger rows `mtp_sequential`, `mtp_parallel_heads`, `z_loss`, `router_balance` in [verification.md](verification.md). Configuration: D, λ schedule, c_z, c_B, normalisation per term. Metrics: each term in nats per its own unit. Unresolved: acceptance-rate figure (UNVERIFIED); pipeline placement and boundary masking of MTP in P13 (NOT-DISCLOSED).

## References

P10, P13, P35; R4.13, R4.14, R4.15, R4.16, R4.29.
