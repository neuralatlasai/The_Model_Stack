---
id: ms.section.4.2
entity_type: section
title: Alternative objectives
short_title: Masked, span, prefix, enc–dec
volume: 1
part: 1
chapter: 4
section: 4.2
slug: 04-2-alternative-objectives
parent: ms.chapter.4
prev_sibling: ms.section.4.1
next_sibling: ms.section.4.3
children: []
prerequisites: [ms.section.4.1, ms.section.2.3]
downstream: [ms.section.4.3, ms.section.18.4, ms.section.19.1, ms.section.58.2]
related: [ms.section.13.1]
siblings_by_mechanism: [ms.section.4.1, ms.section.4.3, ms.section.4.5]
relations:
  - {type: supported_by, target: paper.P02}
  - {type: supported_by, target: paper.P01}
  - {type: variant_of, target: concept.likelihood-objective}
axes: {lifecycle: [pretraining], mechanism: [objective, masking, denoising], feedback_setting: [], modality: [text]}
papers: [P01, P02]
implementations: [impl.hugging-face-transformers, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 4.2 Alternative objectives

## Scope

Objective: specify masked language modeling, span corruption, sequence denoising, prefix language modeling, and encoder–decoder objectives as ledger rows that differ from the causal LM in *visibility* (which positions a prediction may attend to), *target set* (which positions are predicted), and *target-length ratio*. Baseline: the causal row of §4.1. Success: for each family the reader can write the corrupted input, the target sequence, the loss mask, and the attention mask for the hand-audited sequence in [verification.md](verification.md), and can state its cost relative to the causal row. Boundaries: architectural consequences (encoder stacks, cross-attention layout) belong to §13; objective *selection* for a training run belongs to [§19.1](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-1-objective-selection.md).

## Why this exists

What failed before was the identification of "language model" with a left-to-right decoder. Encoder representations for classification and retrieval were trained by reconstruction of masked positions, not by ordered likelihood, and the two were conflated as "pretraining". The bottleneck was that these objectives have no shared scalar: a masked-LM loss is a mean over roughly 15% of positions under bidirectional visibility; a causal loss is a mean over all positions under causal visibility; they do not sit on one axis (MATHEMATICALLY-DERIVED from the differing denominators and conditioning sets). The constraint that became dominant is cost per useful gradient: reconstruction objectives receive gradient at only the corrupted positions, which motivated span corruption with short targets in P02 and, later, mixtures of denoisers. What changed is that visibility and target set became explicit dials.

## Intuition

Physically, every objective in this section pays the same backbone cost per input token but differs in (a) how many positions receive gradient and (b) whether a second stack of parameters and a cross-attention path exist. Denoising with a separate decoder pays backbone cost on the encoder side for *all* input tokens and decoder cost only for the short target — this asymmetry is the resource argument for encoder–decoder span corruption (DERIVED). Heuristically, one might say bidirectional models "understand" and causal models "generate"; the resource view is that bidirectional visibility forbids exact sequential sampling, nothing more.

## Formulation

Let x ∈ {1,…,V}^T be a clean sequence, and let a corruption function κ map x to an input x̃ and a target sequence y with a visibility relation A ⊆ {1,…,T̃}² stating which input positions attend to which. For the decoder-only families, the loss is Eq. N.2 applied to a *constructed* sequence with a constructed m_t; for the encoder–decoder families, it is Eq. N.2 applied to y with c = encoder(x̃).

> **Definition — Masked language modeling.** The reconstruction objective in which a subset M ⊂ {1,…,T} of positions is replaced (in the input) by a mask token or a corruption and the model, with bidirectional visibility, predicts the original x_t for t ∈ M only.

$$
\mathcal{L}_{\text{MLM}} = -\frac{\sum_{t\in M} \log p_\theta(x_t \mid \tilde{x})}{|M|}
$$
*(Eq. 4.3)* where M = masked positions, x̃ = corrupted input, |M| = number of masked positions; m_t = 𝟙[t ∈ M].

> **Definition — Span corruption.** The corruption that replaces each of K contiguous spans of x by a single sentinel token s_k in the input and sets the target to the concatenation s_1 ∘ span_1 ∘ s_2 ∘ span_2 ∘ … ∘ s_{K+1}.

$$
\mathcal{L}_{\text{span}} = -\frac{1}{|y|}\sum_{j=1}^{|y|}\log p_\theta(y_j \mid y_{<j}, \text{enc}(\tilde{x}))
$$
*(Eq. 4.4)* where y = sentinel-delimited target, |y| = Σ_k |span_k| + K + 1, enc = bidirectional encoder.

> **Definition — Prefix language modeling.** The objective on a single sequence x = (x_{1:P}, x_{P+1:T}) in which positions 1…P attend bidirectionally among themselves, positions P+1…T attend causally to everything before them, and loss is taken on t > P only.

$$
\mathcal{L}_{\text{prefix}} = -\frac{\sum_{t=P+1}^{T}\log p_\theta(x_t \mid x_{<t})}{T-P}
$$
*(Eq. 4.5)* where P = prefix length; m_t = 𝟙[t > P]; visibility A = {(i,j): j ≤ P} ∪ {(i,j): j ≤ i}.

> **Definition — Target-length ratio.** ρ = (number of loss-bearing target tokens) / (number of input tokens processed by the backbone) for one ledger row.

$$
\rho_{\text{causal}} = 1,\quad \rho_{\text{MLM}} = \tfrac{|M|}{T},\quad \rho_{\text{span}} = \tfrac{|y|}{|\tilde{x}|},\quad \rho_{\text{prefix}} = \tfrac{T-P}{T}
$$
*(Eq. 4.6)* where symbols are as above; ρ multiplies the decoder-side FLOPs per input token for encoder–decoder rows and the gradient-bearing fraction for single-stack rows.

```figure
id: fig-4.9
kind: calculator
title: Target-length ratio of span corruption and masked LM
caption: >-
  Eq. 4.6 composed with lines 1 and 3–4 of Algorithm 4.2: n = round(r·T)
  tokens are dropped into K spans, the encoder keeps T − n + K positions and
  the decoder scores n + K + 1. The T = 12 option reproduces the verification
  audit exactly (ρ = 6/11); the other lengths are illustrative. ρ_MLM uses the
  same rate as |M|/T.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.6", "DERIVED:alg-4.2", P02]
alt: >-
  Calculator for Eq. 4.6 with Algorithm 4.2. Inputs: sequence length T,
  corruption rate r and mean span length μ. At the defaults T = 512
  (illustrative), r = 15% and μ = 3: 77 tokens are corrupted in 26 spans, the
  encoder input has 461 tokens, the decoder target has 104, so ρ_span = 0.226,
  and ρ_MLM at the same rate is 0.150. At r = 50% with μ = 3 the target (342
  tokens) is longer than the encoder input (341), ρ = 1.003. At T = 12,
  r = 25%, μ = 2, the verification audit: 3 corrupted tokens, 2 spans, 11
  encoder tokens, 6 target tokens, ρ = 0.545.
spec:
  tex: >-
    n = \mathrm{round}(rT),\quad K = \max\!\big(1, \mathrm{round}(n/\mu)\big),\quad
    \rho_{\text{span}} = \frac{|y|}{|\tilde{x}|} = \frac{n + K + 1}{T - n + K},\quad
    \rho_{\text{MLM}} = \frac{n}{T}
  equation: "4.6"
  inputs:
    - { symbol: T, label: "clean sequence length T", default: 512, min: 12, max: 2048, options: [12, 64, 512, 2048], format: integer }
    - { symbol: r, label: "corruption rate r", default: 0.15, min: 0.15, max: 0.5, options: [0.15, 0.25, 0.5], format: percent }
    - { symbol: mu, label: "mean span length μ", default: 3, min: 2, max: 10, options: [2, 3, 5, 10], format: raw }
  outputs:
    - { symbol: n, label: "corrupted tokens, round(r·T)", formula: "round(r*T)", format: integer }
    - { symbol: K, label: "spans K, one sentinel each", formula: "max(1, round(n/mu))", format: integer }
    - { symbol: X, label: "encoder input |x̃| = T − n + K", formula: "T - n + K", format: integer }
    - { symbol: Y, label: "decoder target |y| = n + K + 1", formula: "n + K + 1", format: integer }
    - { symbol: rs, label: "ρ_span = |y|/|x̃|", formula: "Y/X", format: fixed3, emphasis: true }
    - { symbol: rm, label: "ρ_MLM = |M|/T at the same rate", formula: "n/T", format: fixed3 }
states:
  - { anchor: formulation, label: "15%, μ = 3 (P02 setting)", variables: { T: 512, r: 0.15, mu: 3 }, highlight: [rs, Y, X], note: "At P02's 15% rate with mean span 3 the decoder scores 104 target tokens for 461 encoder tokens: ρ_span ≈ 0.23 against ρ = 1 for the causal row. T = 512 is illustrative." }
  - { anchor: mechanism, label: "r ≈ 50% (UL2 X-denoiser rate)", variables: { T: 512, r: 0.5, mu: 3 }, highlight: [rs, Y], note: "At the X-denoiser's ~50% masking, with μ held at 3, the target (342) outgrows the encoder input (341): the decoder side now costs as much as the encoder." }
  - { anchor: algorithm, label: "the 12-token audit", variables: { T: 12, r: 0.25, mu: 2 }, highlight: [n, K, X, Y, rs], note: "Algorithm 4.2 on the verification sequence: 3 tokens in 2 spans leave |x̃| = 11 and |y| = 6, so ρ = 6/11, exactly the §2.1 row." }
  - { anchor: experimental-design, label: "Exp. 4.2 MLM arm", variables: { T: 512, r: 0.15, mu: 3 }, highlight: [rm], note: "Experiment 4.2's MLM arm, |M| = 0.15T: 15% of positions bear gradient at unchanged backbone FLOPs per input token." }
```

## Mechanism

**Masked LM.** BERT states "we mask 15% of all WordPiece tokens in each sequence at random" and, of those, replaces 80% with [MASK], 10% with a random token, and 10% unchanged, because otherwise "we are creating a mismatch between pre-training and fine-tuning, since the [MASK] token does not appear during fine-tuning"; and "we only predict the masked words rather than reconstructing the entire input" (PAPER-REPORTED · R4.1 §3.1). The mask is therefore a *loss* mask and an *input corruption* together; visibility is full. Consequence: no ordered product exists, so Eq. N.1 is not defined for the trained model; the objective is a pseudo-likelihood, and "perplexity" of an MLM is not the perplexity of §4.6 (MATHEMATICALLY-DERIVED).

```figure
id: fig-4.10
kind: matrix
title: Masked-LM visibility and loss rows on the audit sequence
caption: >-
  Every cell is filled: under bidirectional visibility each position sees all
  12, including the [MASK] slots and the tokens after them. The loss lives
  only on the three highlighted rows, t ∈ M. The masked positions are the
  ones the verification audit hand-picks for its span row (25%, above
  BERT's 15%, for legibility); under R4.1's rule only 80% of chosen positions
  would actually show [MASK].
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.3", R4.1]
alt: >-
  Twelve by twelve grid, fully filled, for the corrupted audit sequence def,
  ▁add, (, [MASK], [MASK], ▁b, ), colon, ▁return, ▁a, [MASK], ▁b. Every query
  position may attend to every key position, 144 of 144 pairs. Rows 4, 5 and
  11 (1-based), the masked positions, are highlighted across all columns:
  they are the only rows with a target, the original tokens a, comma and +.
  |M|/T = 3/12, and the loss is the mean over those three positions (Eq.
  4.3).
spec:
  rows: 12
  cols: 12
  pattern: full
  rowLabel: "corrupted position t (query)"
  colLabel: "position visible to it"
  rowTicks: ["def", "▁add", "(", "[MASK]", "[MASK]", "▁b", ")", ":", "▁return", "▁a", "[MASK]", "▁b"]
  colTicks: ["def", "▁add", "(", "[MASK]", "[MASK]", "▁b", ")", ":", "▁return", "▁a", "[MASK]", "▁b"]
  highlight:
    - { row: 3, col: 0 }
    - { row: 3, col: 1 }
    - { row: 3, col: 2 }
    - { row: 3, col: 3 }
    - { row: 3, col: 4 }
    - { row: 3, col: 5 }
    - { row: 3, col: 6 }
    - { row: 3, col: 7 }
    - { row: 3, col: 8 }
    - { row: 3, col: 9 }
    - { row: 3, col: 10 }
    - { row: 3, col: 11 }
    - { row: 4, col: 0 }
    - { row: 4, col: 1 }
    - { row: 4, col: 2 }
    - { row: 4, col: 3 }
    - { row: 4, col: 4 }
    - { row: 4, col: 5 }
    - { row: 4, col: 6 }
    - { row: 4, col: 7 }
    - { row: 4, col: 8 }
    - { row: 4, col: 9 }
    - { row: 4, col: 10 }
    - { row: 4, col: 11 }
    - { row: 10, col: 0 }
    - { row: 10, col: 1 }
    - { row: 10, col: 2 }
    - { row: 10, col: 3 }
    - { row: 10, col: 4 }
    - { row: 10, col: 5 }
    - { row: 10, col: 6 }
    - { row: 10, col: 7 }
    - { row: 10, col: 8 }
    - { row: 10, col: 9 }
    - { row: 10, col: 10 }
    - { row: 10, col: 11 }
  legend: "all 144 pairs admitted; loss only on rows t ∈ M = {4, 5, 11} (1-based), |M|/T = 3/12"
```

**Span corruption.** P02's baseline "randomly samples and then drops out 15% of tokens in the input sequence. All consecutive spans of dropped-out tokens are replaced by a single sentinel token", with the target being "all of the dropped-out spans of tokens, delimited by the same sentinel tokens used in the input sequence plus a final sentinel token to mark the end of the target sequence" (PAPER-REPORTED · P02 §3.1.4). Its span-length study then "corrupts contiguous, randomly-spaced spans of tokens", compares "average span lengths of 2, 3, 5 and 10", and reports that "using an average span length of 3 slightly (but significantly) outperforms the i.i.d. objective on most non-translation benchmarks" while the "span-corruption objective also provides some speedup during training compared to the i.i.d. noise approach because span corruption produces shorter sequences on average" (PAPER-REPORTED · P02 §3.3.4). Across objectives, the report states that "denoising objectives outperformed language modeling and deshuffling for pre-training", and across architectures that "the encoder-decoder architecture with the denoising objective performed best" and "the shared parameter encoder-decoder outperforms the decoder-only prefix LM" (PAPER-REPORTED · P02 §3.3, §3.2). The book does not generalise these findings beyond the P02 setting (its scale, C4, and its downstream suite).

```figure
id: fig-4.11
kind: chart
title: Target and total length against mean span length at 15% corruption
caption: >-
  Algorithm 4.2 in the large-T limit, rounding ignored: |y|/T = r + r/μ and
  |x̃|/T = 1 − r + r/μ. Longer spans need fewer sentinels, so both stacks see
  shorter sequences; that is the mechanism behind P02's reported training
  speedup of span corruption over i.i.d. noise. μ = 1 means single-token spans
  with no merging. The quality claim at μ = 3 is P02's; the curves carry no
  quality information.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.6", "DERIVED:alg-4.2", P02]
alt: >-
  Line chart against mean span length μ from 1 to 10 at a corruption rate of
  15%. The target-length ratio ρ_span = (r + r/μ)/(1 − r + r/μ) falls from
  0.300 at μ = 1 to 0.243 at μ = 2, 0.222 at μ = 3, 0.205 at μ = 5 and 0.191
  at μ = 10. The decoder target per clean token, r + r/μ, falls from 0.30 to
  0.225, 0.20, 0.18 and 0.165. Tokens processed by both stacks per clean
  token, 1 + 2r/μ, fall from 1.30 to 1.15, 1.10, 1.06 and 1.03. Annotations
  mark the span lengths 2, 3, 5 and 10 of P02's study, and note that P02
  reports μ = 3 slightly but significantly outperforming i.i.d. corruption on
  most non-translation benchmarks.
spec:
  type: line
  x: { label: "mean span length μ", scale: linear, format: raw, domain: [1, 10] }
  y: { label: "tokens per clean input token", scale: linear, format: fixed2, domain: [0, 1.4] }
  variables: { r: 0.15 }
  series:
    - { id: rho, label: "ρ_span = |y|/|x̃|", formula: "(r + r/x)/(1 - r + r/x)", sample: { from: 1, to: 10, count: 37 }, emphasis: true }
    - { id: tgt, label: "|y|/T, decoder target", formula: "r + r/x", sample: { from: 1, to: 10, count: 37 } }
    - { id: tot, label: "(|x̃| + |y|)/T, both stacks", formula: "1 + 2*r/x", sample: { from: 1, to: 10, count: 37 }, dashed: true }
  annotations:
    - { x: 2, label: "μ = 2: ρ = 0.243" }
    - { x: 3, label: "μ = 3: beats i.i.d. on most non-translation (P02)" }
    - { x: 5, label: "μ = 5: ρ = 0.205" }
    - { x: 10, label: "μ = 10: ρ = 0.191, 1.03 tokens per token" }
```

**Denoising (BART-style).** A full-sequence reconstruction: R4.3 describes "corrupting text with an arbitrary noising function" and "learning a model to reconstruct the original text", with the best-performing noising combining sentence permutation ("randomly shuffling the order of the original sentences") and text infilling ("spans of text are replaced with a single mask token") (PAPER-REPORTED · R4.3 abstract). The decoder reproduces the *entire* clean document, so ρ ≈ 1 on the decoder side rather than the short-target ρ of span corruption; decoder FLOPs scale with T rather than with |y| (DERIVED).

**Mixture of denoisers.** UL2 proposes "Mixture-of-Denoisers (MoD), a pre-training objective that combines diverse pre-training paradigms together": an R-denoiser with "a range of 2 to 5 tokens as the span length, which masks about 15% of input tokens", an S-denoiser that "observe[s] a strict sequential order when framing the inputs-to-targets task, i.e., prefix language modeling", and an X-denoiser in which "approximately 50% of the input sequence is masked"; a paradigm token from {[R], [S], [X]} is prepended so that "downstream fine-tuning is associated with specific pre-training schemes" (PAPER-REPORTED · R4.4 abstract, §3). In ledger terms, MoD is a per-example switch among three rows with the row identity exposed as a token. Whether the mixture's reported gains hold at other scales is UNVERIFIED here.

**Prefix LM.** Visibility over the prefix is bidirectional, loss over the continuation only; UniLM trains "three types of language modeling tasks: unidirectional, bidirectional, and sequence-to-sequence prediction" in one network by "utilizing specific self-attention masks to control what context the prediction conditions on" (PAPER-REPORTED · R4.8 abstract), and the prefix LM is a comparison arm in P02. Its distinctive cost is that ρ < 1 while backbone FLOPs are unchanged; at fixed compute it therefore receives fewer gradient-bearing tokens than the causal row (DERIVED).

```figure
id: fig-4.12
kind: matrix
title: Prefix-LM block mask on the audit sequence, P = 8
caption: >-
  The verification prefix row: BOS and the eight prefix tokens (slots 0–8)
  attend to one another in both directions; slots 9–12 attend causally. The
  36 highlighted cells are exactly what the prefix adds over the causal mask
  of §4.1, the upper triangle of the 9 × 9 block. Loss sits on slots 8–12
  only, Σm = 5, so the extra visibility buys representations, not targets.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.5", R4.8]
alt: >-
  Thirteen by thirteen grid for the audit slots BOS through ▁b with a prefix
  of 9 slots (BOS plus P = 8 tokens). Every row sees columns 0 to 8; rows 9 to
  12 additionally see columns up to themselves. 127 of 169 pairs are
  admitted, against 91 for the causal mask. The 36 cells above the diagonal
  inside the first 9 by 9 block are highlighted: they are the pairs the prefix
  mask adds. Loss-bearing slots are 8 to 12, five targets, ρ = 5/13 in the
  audit's slot convention.
spec:
  rows: 13
  cols: 13
  pattern: prefix
  parameter: 9
  rowLabel: "input slot t (query)"
  colLabel: "slot j visible to it"
  rowTicks: ["BOS", "def", "▁add", "(", "a", ",", "▁b", ")", ":", "▁return", "▁a", "+", "▁b"]
  colTicks: ["BOS", "def", "▁add", "(", "a", ",", "▁b", ")", ":", "▁return", "▁a", "+", "▁b"]
  highlight:
    - { row: 0, col: 1 }
    - { row: 0, col: 2 }
    - { row: 0, col: 3 }
    - { row: 0, col: 4 }
    - { row: 0, col: 5 }
    - { row: 0, col: 6 }
    - { row: 0, col: 7 }
    - { row: 0, col: 8 }
    - { row: 1, col: 2 }
    - { row: 1, col: 3 }
    - { row: 1, col: 4 }
    - { row: 1, col: 5 }
    - { row: 1, col: 6 }
    - { row: 1, col: 7 }
    - { row: 1, col: 8 }
    - { row: 2, col: 3 }
    - { row: 2, col: 4 }
    - { row: 2, col: 5 }
    - { row: 2, col: 6 }
    - { row: 2, col: 7 }
    - { row: 2, col: 8 }
    - { row: 3, col: 4 }
    - { row: 3, col: 5 }
    - { row: 3, col: 6 }
    - { row: 3, col: 7 }
    - { row: 3, col: 8 }
    - { row: 4, col: 5 }
    - { row: 4, col: 6 }
    - { row: 4, col: 7 }
    - { row: 4, col: 8 }
    - { row: 5, col: 6 }
    - { row: 5, col: 7 }
    - { row: 5, col: 8 }
    - { row: 6, col: 7 }
    - { row: 6, col: 8 }
    - { row: 7, col: 8 }
  legend: "admitted j ≤ 8 or j ≤ i: 127 of 169; highlighted: 36 pairs beyond causal; loss on slots 8–12"
```

```figure
id: fig-4.13
kind: stat-panel
title: Pair counts and dense-mask bytes of the prefix-LM block mask
caption: >-
  The visibility set A of Eq. 4.5 counted in slots. At P = T/2 the block mask
  admits 5/8 of all pairs against just over 1/2 for causal, and a kernel
  without block-mask support must materialise the full [T, T] additive mask:
  T²·b bytes per copy, quadrupling with every doubling of T. The long-T
  states are illustrative lengths, not a named model.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-4.5"
alt: >-
  Instrument panel for a prefix-LM mask over T slots with P bidirectional
  slots and b bytes per mask value. On the audit, T = 13 and P = 9: causal
  pairs T(T+1)/2 = 91, prefix-LM pairs P² + (T − P)(T + P + 1)/2 = 127, 36
  pairs added over causal, 75.1% of T² admitted, and a dense BF16 mask of 338
  bytes. At T = 8,192 with P = 4,096, 41,945,088 of 67,108,864 pairs (62.5%)
  are admitted and a dense BF16 mask is 128 MiB per copy. At T = 32,768 with
  P = 16,384 the dense mask is 2 GiB per copy.
spec:
  header: "PREFIX-LM MASK · T SLOTS · P BIDIRECTIONAL"
  variables: { T: 13, P: 9, b: 2 }
  rows:
    - { key: "slots T", formula: "T", format: integer }
    - { key: "bidirectional slots P", formula: "P", format: integer }
    - { key: "causal pairs, T(T+1)/2", formula: "T*(T+1)/2", format: integer }
    - { key: "prefix-LM pairs", formula: "P^2 + (T-P)*(T+P+1)/2", format: integer, note: "P² + (T − P)(T + P + 1)/2" }
    - { key: "pairs added over causal", formula: "P*(P-1)/2", format: integer, note: "P(P − 1)/2" }
    - { key: "admitted share of T²", formula: "(P^2 + (T-P)*(T+P+1)/2)/T^2", format: percent }
    - { key: "dense [T, T] mask, BF16", formula: "T^2*b", format: bytes, note: "per materialised copy" }
states:
  - { anchor: mechanism, label: "audit, T = 13, P = 9", variables: { T: 13, P: 9 }, highlight: ["prefix-LM pairs", "pairs added over causal"], note: "The verification row: BOS plus 8 prefix tokens attend bidirectionally, 127 of 169 pairs, 36 more than causal. The dense mask is negligible at this length." }
  - { anchor: implementation, label: "T = 8K, P = T/2", variables: { T: 8192, P: 4096 }, highlight: ["admitted share of T²", "dense [T, T] mask, BF16"], note: "At an illustrative T = 8192 the block mask admits 62.5% of pairs; a dense additive BF16 fallback is 128 MiB per copy that a block-mask kernel never builds." }
  - { anchor: failure-modes, label: "fallback at T = 32K", variables: { T: 32768, P: 16384 }, highlight: ["dense [T, T] mask, BF16"], note: "Block-mask fallback: the dense mask reaches 2 GiB per copy at T = 32768, 16 times the 8K value, which is the T² memory growth the failure mode names." }
```

**Encoder–decoder cross-attention cost.** For a decoder of L_dec layers attending to an encoder output of length T_enc, each decoder position performs cross-attention with 2·T_enc·d_model FLOPs per layer for QK and AV products plus the K/V projections of the encoder output, which are shared across decoder positions and cost 4·T_enc·d_model² per layer (DERIVED · P01 layout). The encoder K/V for cross-attention are computed once per sequence and cached at inference; the decoder's own self-attention KV cache is separate (DERIVED).

## Algorithm

```text
Algorithm 4.2 — Span corruption (P02 layout)
INPUT   x ∈ ℕ^T, corruption rate r ∈ (0,1), mean span length μ, sentinel ids s_1…s_K+1
OUTPUT  x̃ (encoder input), y (decoder target), m ∈ {1}^{|y|}
STATE   span set S = {(start_k, len_k)}; sentinel counter k
INVARIANT  spans are disjoint and non-adjacent; |y| = Σ len_k + K + 1; every token of x is in exactly one of x̃ or y (excluding sentinels)
1  n_corrupt ← round(r · T);  K ← max(1, round(n_corrupt / μ))
2  S ← sample K disjoint, non-adjacent spans with total length n_corrupt
3  x̃ ← x with each span_k replaced by s_k (in order of position)
4  y  ← s_1 ∘ span_1 ∘ s_2 ∘ span_2 ∘ … ∘ s_K ∘ span_K ∘ s_{K+1}
5  m  ← 1 for all positions of y                   # loss on every target token
6  return x̃, y, m                                    # terminates; no state carried across examples
```
Complexity: O(T) per example; the resulting decoder cost per example is O(|y|·N_dec + |y|·T̃·d_model·L_dec) for the cross-attention term. Implementation link: Hugging Face Transformers' T5 tokenizer reserves `extra_ids` (default 100) "for use as sentinels", its model documentation gives the canonical example input `"The <extra_id_0> walks in <extra_id_1> park"` with target `"<extra_id_0> cute dog <extra_id_1> the <extra_id_2>"`, creates decoder inputs with `_shift_right` (teacher forcing), and ignores labels set to −100 in the loss (OFFICIAL-DOCUMENTATION · Transformers v5.17.0 T5 model page [R4.28], accessed 2026-09-20). The sampling of span positions inside any particular data collator was not inspected and is UNVERIFIED here.

```figure
id: fig-4.14
kind: matrix
title: Encoder–decoder visibility of span corruption on the audit
caption: >-
  Algorithm 4.2's output for the verification sequence, drawn as one grid:
  the 11 encoder slots see each other both ways (half shade, no loss); each
  of the 6 decoder slots sees all 11 encoder slots through cross-attention and
  its own causal prefix of the target. Only the six full-shade rows are
  scored, so Σm = 6 and ρ = 6/11. Cross-attention and decoder self-attention
  are separate sub-layers, overlaid here.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.4", "DERIVED:alg-4.2", P02, R4.28]
alt: >-
  Seventeen by seventeen grid. The first 11 rows and columns are the encoder
  input def, ▁add, (, S0, ▁b, ), colon, ▁return, ▁a, S1, ▁b; the last 6 are
  the shifted decoder inputs start, S0, a, comma, S1, +, whose targets are S0,
  a, comma, S1, +, S2. Encoder rows admit all 11 encoder columns at half
  shade and no decoder columns. Decoder row r admits all 11 encoder columns
  (cross-attention) and decoder columns 0 to r (causal self-attention) at full
  shade. 208 of 289 cells are admitted: 121 encoder, 66 cross, 21 decoder
  self. Loss is on the 6 decoder rows only, ρ = 6/11.
spec:
  rows: 17
  cols: 17
  pattern: explicit
  cells:
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 0]
    - [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
    - [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]
    - [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0]
    - [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
    - [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
    - [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  rowLabel: "encoder slots, then decoder slots"
  colLabel: "slot visible to it"
  rowTicks: ["def", "▁add", "(", "S0", "▁b", ")", ":", "▁return", "▁a", "S1", "▁b", "start→S0", "S0→a", "a→,", ",→S1", "S1→+", "+→S2"]
  colTicks: ["def", "▁add", "(", "S0", "▁b", ")", ":", "▁return", "▁a", "S1", "▁b", "start", "S0", "a", ",", "S1", "+"]
  legend: "half shade: encoder, bidirectional, no loss; full: decoder, cross + causal, scored; Σm = 6, ρ = 6/11"
```

## Implementation

```text
Tensor trace (encoder–decoder span corruption)
[B, T̃] x̃ → encoder (bidirectional) → [B, T̃, D] enc
[B, |y|] y_shifted → decoder self-attn (causal) + cross-attn over enc → [B, |y|, D] → W_out → [B, |y|, V] → CE over all |y| positions
```

```text
Tensor trace (prefix LM, single stack)
[B, T] x → block mask: prefix bidirectional / rest causal → [B, T, D] → W_out → [B, T, V] → CE with m_t = 1[t > P]
```

Memory: the prefix-LM block mask is a [T, T] pattern that FlashAttention-style kernels support only if the kernel exposes a custom or block-diagonal mask; falling back to a dense additive mask costs O(T²) bytes (DERIVED; kernel support is version-specific and UNVERIFIED). For encoder–decoder training, activation memory holds both stacks; parameter memory holds two stacks plus cross-attention projections, which is the parameter cost of the row.

## Experimental design

### Experiment 4.2 — Target-length ratio at matched backbone compute

- **Hypothesis:** at matched backbone FLOPs, single-stack rows with smaller ρ (prefix LM, MLM) reach a higher held-out causal NLL on the continuation slice than the causal row, because fewer tokens bear gradient.
- **Setup:** §3.5 reference model; three runs (causal, prefix with P = T/2, MLM with |M| = 0.15T) at equal input-token budget.
- **Independent variables:** objective row.
- **Controlled variables:** data, seeds, tokenizer, batch tokens, schedule.
- **Dataset/workload:** a public text corpus; evaluation on held-out continuations with prefix length P.
- **Hardware:** one accelerator.
- **Metrics:** continuation NLL per token (nats), gradient-bearing tokens per step.
- **Baselines:** causal row.
- **Expected result:** ordering by ρ on continuation NLL; MLM evaluated only on masked-position pseudo-NLL, reported separately because it is not comparable.
- **Ablation:** prefix row with P = 0 (should coincide with causal).
- **Interpretation:** separates the gradient-count effect from the visibility effect.
- **Threats to validity:** the MLM arm has no causal NLL at all; only the prefix/causal comparison is on one axis.

Proposal only; no run was executed.

## Observations

**What the paper claims.** P02 reports that span corruption with average span length 3 "slightly (but significantly)" outperforms i.i.d. corruption on most non-translation benchmarks while producing shorter sequences, that denoising objectives outperform language modeling, and that the encoder–decoder with denoising performs best among its architectures (PAPER-REPORTED · P02 §3.2–3.3). BERT reports its 15% / 80-10-10 corruption rule and masked-position-only loss (PAPER-REPORTED · R4.1). UL2 reports that its mixture of denoisers with paradigm tokens improves over single objectives in its setting (PAPER-REPORTED · R4.4).

**What the evidence shows.** The P02 comparisons are controlled within one codebase and one data source, which is stronger than cross-paper comparison; they are, however, at a scale and on a downstream suite that later decoder-only reports do not replicate, and the book knows of no matched-budget independent reproduction at foundation-model scale — UNVERIFIED.

**What we infer.** The durable content is the ledger, not the ranking: visibility, target set, and ρ are independent dials, and ρ directly sets decoder-side cost (DERIVED). We infer, marked ASSUMED, that the decoder-only convergence of later systems reflects inference-side simplicity (one stack, one KV cache) at least as much as objective quality; this is a systems inference, not a reproduced finding.

**What remains unknown.** Production corruption rates and span lengths of any named contemporary model are NOT-DISCLOSED. Whether prefix visibility helps at scale when post-training follows is UNVERIFIED.

## Failure modes

> **Failure mode — Sentinel leakage.** *Symptom:* the model emits sentinel ids in downstream generation. *Cause:* sentinel tokens present in the vocabulary and in targets but never suppressed at inference. *Detection:* count sentinel ids in sampled outputs. *Mitigation:* logit masking at inference; a sentinel-free fine-tuning stage.

> **Failure mode — [MASK] distribution shift.** *Symptom:* encoder quality drops on unmasked inputs. *Cause:* 100% [MASK] replacement so the encoder never sees clean tokens at masked positions. *Detection:* compare masked-position accuracy with and without the 80-10-10 rule. *Mitigation:* the R4.1 replacement mixture.

> **Failure mode — Block-mask fallback.** *Symptom:* prefix-LM training memory grows as T². *Cause:* dense additive mask because the attention kernel lacks block-mask support. *Detection:* activation memory versus T. *Mitigation:* kernel with block-diagonal mask support; or split the sequence into encoder-like and causal parts.

## Siblings

**Causal LM** — [04-1-autoregressive-modeling.md](04-1-autoregressive-modeling.md)
Why it exists: exact ordered likelihood and sequential sampling. What assumption changed (relative to this section): none of x_{>t} is visible. What objective changed: all positions are targets, ρ = 1. What problem it solved: one stack, one sampler. What new failure mode it introduced: no bidirectional encoder representations. Changed primitive: bidirectional/block mask → causal mask.

**Fill-in-the-middle** — [04-3-code-and-structured-sequences.md](04-3-code-and-structured-sequences.md)
Why it exists: suffix conditioning without an encoder. What assumption changed: the document may be reordered. What objective changed: causal loss on a rearranged sequence; no encoder. What problem it solved: infilling in decoder-only models. What new failure mode it introduced: sentinel handling at inference. Changed primitive: corruption function → reordering function.

**Contrastive alignment** — [04-5-conditional-and-multimodal-learning.md](04-5-conditional-and-multimodal-learning.md)
Why it exists: pair-level supervision across modalities. What assumption changed: no token targets at all. What objective changed: per-position CE → pairwise InfoNCE over a batch. What problem it solved: alignment of separately encoded modalities. What new failure mode it introduced: batch size enters the objective. Changed primitive: output head over V → similarity matrix over the batch.

## Extensions

For multimodality, masked prediction over image patches and latent prediction are developed in [§18.4](../../part-03-model-architectures-and-state/ch18-multimodal-architectural-primitives/18-4-learning-objectives.md) and [§59.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch59-predictive-representations-jepa-and-world-models/59-2-predictive-learning.md); the ledger fields are identical with "token" replaced by "patch" or "latent". For discrete diffusion and masked generation of text and images, developed in [§58.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch58-generative-multimodal-models-and-alternative-generation-paths/58-2-objectives.md), the MLM row is iterated with a schedule of mask rates (forward pointer; ASSUMED mapping).

## Limitations

These rows are valid where the deployment task matches the visibility pattern: encoders for classification and retrieval, encoder–decoders for conditional generation with fully known inputs, prefix LMs where the prefix is known in full. They are falsified as choices when the deployment requires streaming generation conditioned on partial inputs, where only the causal row applies without re-encoding. Decision consequence: choose visibility from the inference contract, then record ρ and the parameter cost in the ledger.

## Reproducibility

Versions: P02 arXiv 1910.10683 (ar5iv rendering accessed 2026-09-20); R4.1, R4.3, R4.4, R4.8 arXiv abs/ar5iv pages accessed 2026-09-20; Transformers v5.17.0 T5 documentation [R4.28]. Artifacts: ledger rows `mlm`, `span_corruption`, `denoising_bart`, `prefix_lm`, `enc_dec_supervised` in [verification.md](verification.md). Configurations: corruption rate, mean span, sentinel ids, P. Metrics: nats per target token, with the target set stated. Unresolved: span-sampling implementation details in current collators (UNVERIFIED); production settings (NOT-DISCLOSED).

## References

P01, P02; R4.1, R4.3, R4.4, R4.8, R4.28.
