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
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 4.2 Alternative objectives

## Scope

Masked, span-corruption, sequence-denoising, and prefix objectives alter the conditioning information, sampled corruption, scored positions, and normalization relative to ordered next-token prediction. Encoder-decoder denotes an architecture rather than a unique objective: T5 reconstructs removed spans, whereas BART reconstructs the original sequence from a corrupted input. Their target counts and cross-attention workloads therefore cannot be recovered from a masking percentage alone. The comparison here fixes each construction, its loss-bearing targets, its attention visibility, and the reported experimental protocol before considering the resulting costs. (PAPER-REPORTED; P02 sections3.1-3.3; R4.1 section3.1; R4.3 sections2-3; R4.4 section3.)

Boundaries: architectural consequences (encoder stacks, cross-attention layout) belong to §13; objective *selection* for a training run belongs to [§19.1](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-1-objective-selection.md).

## Why this exists

A causal objective restricts each prediction to a left context. Representation learning and conditional generation also use observations on both sides of a missing region or a complete source sequence. The methodological question is which information is visible, which original tokens are predicted, and whether predictions form an ordered conditional distribution. BERT, T5, BART, and UniLM implement different answers, rather than interchangeable names for bidirectional training (PAPER-REPORTED: R4.1 section 3.1; P02 section 3; R4.3 section 2; R4.8 section 2).

A comparison must separate architecture from corruption. A bidirectional encoder with selected-position predictions, a decoder-only prefix model, and an encoder-decoder reconstruction model differ in conditional access, target count, parameter allocation, and attention work. Equal clean-token budgets do not imply equal training FLOPs.

## Intuition

Corruption constructs a conditional prediction task. Masking an isolated token allows both neighboring regions to inform its reconstruction. Replacing a span by one sentinel removes its internal token count from the encoder sequence and makes the decoder generate that span autoregressively. Full-document denoising additionally scores uncorrupted content during reconstruction. A prefix model exposes the known prefix bidirectionally but scores the continuation causally (DERIVED from Eq. 4.3-4.5).

The target-length ratio counts direct prediction positions. It does not count all positions that receive gradient: an unscored context token can influence a scored prediction through attention. It also does not convert encoder work into decoder work, since those stacks have different sequence lengths and attention interfaces.

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
*(Eq. 4.6)* where symbols are as above; ρ converts a declared per-decoder-position cost to a per-encoder-input-position accounting for encoder–decoder rows; for single-stack rows it counts directly scored positions, not all positions receiving gradients.

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
  - { anchor: mechanism, label: "r ≈ 50% (UL2 X-denoiser rate)", variables: { T: 512, r: 0.5, mu: 3 }, highlight: [rs, Y], note: "At the X-denoiser's ~50% masking, with μ held at 3, the target (342) outgrows the encoder input (341): the decoder target length exceeds the encoder input length; equal lengths do not imply equal FLOPs." }
  - { anchor: algorithm, label: "the 12-token audit", variables: { T: 12, r: 0.25, mu: 2 }, highlight: [n, K, X, Y, rs], note: "Algorithm 4.2 on the verification sequence: 3 tokens in 2 spans leave |x̃| = 11 and |y| = 6, so ρ = 6/11, exactly the §2.1 row." }
  - { anchor: experimental-design, label: "Exp. 4.2 MLM arm", variables: { T: 512, r: 0.15, mu: 3 }, highlight: [rm], note: "The selected-position MLM row, |M| = 0.15T: 15% of positions carry direct prediction losses; context positions can still receive gradients." }
```

## Mechanism

### Methodology

For each example, retain the clean token sequence, sampled corruption decisions, corrupted input, ordered target, attention visibility, and target mask. This record is necessary to distinguish a token selected for prediction from a token actually replaced by a mask symbol. In BERT's recipe, selected positions may be replaced, randomized, or retained; every selected position remains a supervised prediction ([R4.1](references.md#r41), section 3.1, PAPER-REPORTED).

Equation 4.3 averages conditional log scores over the selected set M. It is not an autoregressive factorization of the clean sequence. A general corruption mixture is also not identical to leave-one-out pseudolikelihood: the conditioning can contain several corrupted positions and, for unchanged selected tokens, the token itself. The loss alone need not specify compatible conditionals of one normalized joint distribution. This does not prove that no joint model or sampling procedure can ever be associated with a masked model; it limits what follows from the stated objective (MATHEMATICALLY-DERIVED).

For T5-style span corruption, sort disjoint spans by position, replace each span with its own sentinel, and concatenate sentinel-span blocks into the target, with a final sentinel. A corrupted token appears in the target and not in the encoder input; an uncorrupted token remains in the encoder input. Sentinels occur in both. With n corrupted tokens and K spans, encoder length is T-n+K and target length is n+K+1 before any separately specified EOS handling. Teacher forcing applies to this target, so generation remains autoregressive within the decoder ([P02](references.md#p02), section 3.1.4 and section 3.3.4, PAPER-REPORTED; lengths DERIVED).

BART reconstructs the full clean sequence after noising rather than only removed spans; consequently its target length is T, while its corrupted input length depends on the noise operator ([R4.3](references.md#r43), section 2). Prefix modeling leaves the sequence intact, permits prefix-to-prefix bidirectional attention, excludes prefix-to-continuation access, and scores only continuation targets. UniLM changes admissible self-attention connections to train several conditioning patterns in one shared network ([R4.8](references.md#r48), section 2, PAPER-REPORTED).

The parameter and compute boundary matters. An encoder-decoder may allocate distinct or shared parameters to its stacks; it is not necessarily twice the parameters of a particular decoder baseline. Per decoder layer, dense cross-attention QK and AV products cost approximately 4T_enc d_model FLOPs per decoder position. The encoder-side K/V projections cost 4T_enc d_model^2 per layer, shared over decoder positions; decoder Q and output projections are additional. Decoder self-attention, feed-forward work, embeddings, and output projection must also be counted (MATHEMATICALLY-DERIVED from the matrix shapes). At inference, fixed encoder K/V can be cached independently of the decoder self-attention cache.

UL2's mixture selects denoising regimes with different corruption extents and ordering, exposes the regime through mode tokens, and trains the corresponding conditional task ([R4.4](references.md#r44), section 3, PAPER-REPORTED). The regime probability weights an expectation over objectives. If regime losses are each token means, their mixing coefficients weight regime means; concatenating targets and using one global mean instead weights regimes additionally by target count. The two estimators need not agree (MATHEMATICALLY-DERIVED).

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

## Algorithm

```text
Algorithm 4.2 — Span transformation with explicit sampling contract
INPUT clean ids x[0:T], corruption count n, ordered span lengths and clean-gap lengths,
      distinct sentinel ids s_1...s_(K+1), decoder-start/EOS policy
PRECONDITIONS T>=2; 1<=n<T; 1<=K<=min(n,T-n+1);
              K positive span lengths sum to n; internal clean gaps are positive;
              all clean gaps sum to T-n; enough sentinel ids are reserved
OUTPUT x_tilde, decoder input, y, target mask, and corruption metadata
1 Form K disjoint non-adjacent spans S from the supplied gap/span segmentation
2 Scan x once; copy clean gaps to x_tilde and replace span k by sentinel s_k
3 Append s_k followed by span k's original ids to y, in increasing k
4 Append final sentinel s_(K+1) to y; apply declared EOS policy separately
5 Decoder input -> decoder-start token followed by y[:-1]; targets -> y
6 Score every nonpadding target, requiring a positive target count
INVARIANTS |x_tilde|=T-n+K; |y|=n+K+1 before EOS;
           every original token occurs once in either x_tilde or y
```

The transformation is O(T) time and O(T+K) output storage. Sampling is an explicit input contract: the paper specifies its corruption regime, but this algorithm does not pretend that every collator uses the same integer rounding or segmentation distribution. A chosen rate/mean must yield feasible counts before constructing spans. Empty or nearly full corruption cannot be handled by blindly setting K=max(1,round(n/mu)). A constructive sampler can draw positive compositions for span lengths and internal gaps; its distribution must be documented if exact reproduction is required (DERIVED).

The inspected Hugging Face T5 page describes sentinel extra IDs and shifted decoder labels ([R4.28](references.md#r428), official model documentation, unpinned surface inspected 2026-10-07). It does not establish the span sampler of an uninspected training pipeline.

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
span row: x_tilde[B,T_enc] -> bidirectional encoder -> memory[B,T_enc,d_model]
          shifted y[B,T_dec] -> causal decoder + cross-attention(memory)
          -> logits[B,T_dec,V] -> target loss
prefix row: shifted constructed sequence[B,T] -> prefix/causal block visibility
            -> hidden[B,T,d_model] -> scored continuation positions -> target loss
```

Prefix visibility can be represented by a predicate rather than a materialized T-by-T array. A dense additive mask uses O(T^2) storage per copy; a compatible attention backend may avoid that allocation. This is an implementation capability to verify against the selected backend and revision, not a property guaranteed by the words FlashAttention or block mask. Also check padding, document segmentation, and whether an API's causal shortcut would override the intended prefix region (DERIVED).

Selected-position output projection can reduce MLM head work by gathering selected hidden states before the vocabulary projection. It does not remove context positions from encoder computation or their gradients. Encoder-decoder target shortening can reduce decoder work, but total time includes encoder execution, cross-attention, packing, and kernel utilization. Latency, throughput, energy, and monetary improvements for the reconstructed rows are UNVERIFIED without measurements; the source studies' settings bound their own findings.

## Experimental design

### Reported experiments

T5 separates architecture comparisons (section 3.2) from objective studies (section 3.3). The latter compare reconstruction variants, corruption rates, and mean span lengths under the paper's baseline pretraining/fine-tuning regime and downstream suite, which includes GLUE, SuperGLUE, SQuAD, summarization, and translation. Tables 4-7 provide the relevant comparisons: rate variants include 10%, 15%, 25%, and 50%; the span study compares mean lengths 2, 3, 5, and 10 at the stated corruption regime ([P02](references.md#p02), PAPER-REPORTED). Read these tables with the baseline budget and repetition procedure in section 3.1, rather than assigning the final large-model training budget in section 3.7 to every ablation.

The causal intervention in the span study is corruption structure, while architecture and downstream evaluation are held to its baseline. Its outcome measures are fine-tuned task metrics and the source's training-efficiency discussion. Target length supplies an explanatory cost mechanism; it is not itself a device throughput measurement. The architecture study has a different intervention and cannot be combined with the objective study as though one table isolated both variables.

BART evaluates noising alternatives before reporting task results (R4.3 sections 3-5). UL2 evaluates mixtures and downstream behavior (R4.4 experiments); its mixtures also introduce mode conditioning. Neither paper establishes that one corruption operator dominates across all parameter counts, corpora, modalities, or deployment objectives. The book's proposed mask fixture remains in [verification.md](verification.md).

## Observations

**What the paper claims.** T5 reports favorable results for denoising and its encoder-decoder baseline; its span-length study reports a modest advantage for mean span length 3 on most nontranslation tasks and a shorter-sequence efficiency benefit (PAPER-REPORTED: P02 section 3.2-3.3.4).

**What the evidence shows.** The comparisons are conditional on the source's corpus, architecture allocation, training budget, tuning, and task suite. They distinguish full reconstruction from removed-token reconstruction and show that corruption extent and span structure are experimental variables. They do not prove that shorter targets are always better.

**What we infer.** Equal numbers of clean tokens, scored targets, and FLOPs are different controls. A fair objective comparison must name which is fixed and account for the remaining quantities. Context tokens can receive gradient even when their own positions have no direct loss (MATHEMATICALLY-DERIVED).

**What remains unknown.** Exact behavior of an uninspected collator, custom-mask kernel, or named production trainer is UNVERIFIED. Published findings here do not settle the optimal corruption mixture for another scale or task distribution.

## Failure modes

> **Failure mode — Incorrect selected-target accounting.** *Symptom:* the loss count differs from sampled prediction positions. *Cause:* treating unchanged/randomly replaced selected tokens as unscored. *Detection:* compare corruption metadata with target masks. *Mitigation:* score the selected set independently of replacement type (R4.1 section3.1, PAPER-REPORTED).

> **Failure mode — Sentinel or segment mismatch.** *Symptom:* reconstruction omits or duplicates original tokens. *Cause:* overlapping spans, inconsistent sentinel order, or EOS counted twice. *Detection:* reconstruct clean IDs from encoder and target segments. *Mitigation:* validate disjoint spans, sentinel capacity, and final-sentinel/EOS policy (DERIVED).

> **Failure mode — Visibility fallback.** *Symptom:* prefix targets see future continuation or dense mask storage dominates. *Cause:* substituting a generic causal flag or dense mask for the declared predicate. *Detection:* inspect admissible pairs and backend allocations. *Mitigation:* use a verified compatible backend and retain a small visibility fixture (DERIVED).

## Siblings

Causal likelihood scores ordered conditionals under earlier-token visibility. Masked reconstruction scores selected corrupted-position conditionals; encoder-decoder denoising scores an ordered target given a corrupted source; prefix modeling scores the continuation given a bidirectionally represented prefix. The direct target count, processed source count, and architecture determine different costs even when all implementations call cross-entropy.

Fill-in-the-middle supplies right context through serialization instead of a separate bidirectional source encoder [§4.3](04-3-code-and-structured-sequences.md). Contrastive alignment instead normalizes match scores over examples in a candidate set, so candidate count changes its probability space rather than its token target length [§4.5](04-5-conditional-and-multimodal-learning.md). A shared loss primitive does not make these estimands interchangeable.



## Extensions

### Improvements

Span corruption improves target economy relative to reconstructing every clean token: one sentinel represents a removed region in the input and only removed regions are decoded. The benefit is conditional on span count and the full architecture cost, not merely on the corruption percentage (DERIVED; P02 section 3.3.4).

BART expands the noising family to transformations such as infilling and sentence permutation while reconstructing the full document (R4.3 sections 2-3, PAPER-REPORTED). UL2 then combines denoising regimes to train several conditioning demands in one model (R4.4 section 3, PAPER-REPORTED). These are documented methodological changes with different target/visibility contracts; a mixture's reported gain does not make every constituent independently superior.

Prefix modeling offers bidirectional processing of known conditioning in a shared stack. Encoder-decoder processing instead stores an independently encoded source with cross-attention access. Choosing between them requires a comparison of parameter allocation, target lengths, supported masks, source reuse, and the intended generation interface; architectural labels alone do not determine efficiency.

## Limitations

The losses train conditionals selected by corruption, not a universal representation of task utility. MLM scoring does not directly define the autoregressive perplexity of section 4.6. Denoising generation is sequential in its decoder despite bidirectional encoding. Streaming encoder-decoder systems are possible when their visibility and chunking protocol is specified; causality of the decoder alone does not establish streaming behavior for an entire multimodal system.

The target-length calculations omit padding, packing losses, extra task/EOS tokens, and backend effects unless expressly included. A reported training speedup belongs to its source configuration. No throughput or end-to-end resource measurement was made for this chapter.

## Reproducibility

Retain clean/corrupted sequences, sampled spans and gaps, exact sentinel IDs, final-sentinel/EOS rules, decoder-start convention, attention visibility, target mask, mixture choice and probability, loss denominator, architecture sharing, and source/target length distributions. Verify source and target reconstruction before using downstream task scores as evidence about the objective. Source locators and access dates appear in [references.md](references.md); the toy fixture is an unexecuted verification proposal.

## References

P01, P02; R4.1, R4.3, R4.4, R4.8, R4.28.
