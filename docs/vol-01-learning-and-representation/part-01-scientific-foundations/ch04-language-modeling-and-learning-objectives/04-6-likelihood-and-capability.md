---
id: ms.section.4.6
entity_type: section
title: Likelihood and capability
short_title: Perplexity and its limits
volume: 1
part: 1
chapter: 4
section: 4.6
slug: 04-6-likelihood-and-capability
parent: ms.chapter.4
prev_sibling: ms.section.4.5
next_sibling: ms.verification.4
children: []
prerequisites: [ms.section.4.1, ms.section.2.3, ms.section.2.5]
downstream: [ms.section.6.1, ms.section.6.2, ms.section.10.3, ms.section.21.6, ms.section.31.6, ms.section.61.4]
related: [ms.section.4.3, ms.section.37.1]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P03}
  - {type: supported_by, target: paper.P01}
  - {type: evaluated_by, target: ms.verification.4}
axes: {lifecycle: [evaluation], mechanism: [likelihood, perplexity, calibration], feedback_setting: [], modality: [text]}
papers: [P01, P03, P08]
implementations: [impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 4.6 Likelihood and capability

## Scope

Held-out negative log-likelihood measures a model under a particular tokenizer, target set, conditioning window, and aggregation rule. Perplexity exponentiates a token mean; bits per byte changes the reporting unit when the same byte event is represented and its likelihood is defined. Neither unit makes incompatible evaluation protocols equivalent. This section specifies exact target coverage for fixed-context evaluation, derives the difference between token-weighted and document-weighted means, and distinguishes token calibration and execution-based capability from language-model likelihood. (MATHEMATICALLY-DERIVED; Eq4.15-4.18; R4.22 evaluation construction; R4.10 section3.)

Boundaries: evaluation units and splits are owned by [§6.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md)–[§6.2](../ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md); capability prediction from loss by [§21.6](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-6-capability-prediction.md); validity threats by [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md).

## Why this exists

Likelihood evaluates probabilities of reference targets under a declared conditioning distribution. Deployment may instead require correct answers, executable programs, calibrated uncertainty, safe tool actions, or a latency budget. The distinction is measurable: the Transformer study reports a label-smoothing trade-off between perplexity and translation metrics, while HumanEval evaluates generated code with tests (P01 section 5.4; R4.10 section 3, PAPER-REPORTED).

Even a likelihood comparison can be underspecified. Tokenization changes its unit, document weighting changes its estimator, and context/stride changes its conditioning. The Hugging Face fixed-context example demonstrates different reported perplexities for one model and text under different windowing procedures ([R4.22](references.md#r4-22), OFFICIAL-DOCUMENTATION). The purpose here is to make each comparison's probability space and counted events explicit.

```figure
id: fig-4.30
kind: stat-panel
title: One model, one text, two strides in the documentation example
caption: >-
  The reported perplexities are the documentation's (R4.22); the ℓ, bits and
  cost rows are arithmetic on them (Eq. 4.15, Algorithm 4.6). Nothing about
  the checkpoint changes between the states: 0.168 nats per token of
  apparent improvement comes from the evaluation stride alone, bought with
  twice the forward passes.
placement: rail
anchor: why-this-exists
evidence: OFFICIAL-DOCUMENTATION
source: [R4.22, "DERIVED:eq-4.15"]
context:
  hardware: "not stated on the documentation page"
  model: "GPT-2-large"
  precision: "not stated on the documentation page"
  sequenceLength: "context k = 1024; strides 1024 and 512"
  ioDistribution: "WikiText-2 raw test split, joined with double newlines"
  concurrency: "single process, documentation script"
  runtimeVersion: "Transformers version not pinned on the page"
  measurementBoundary: "inside the process, with the documentation's evaluation script"
alt: >-
  Instrument panel for the Hugging Face perplexity documentation example:
  GPT-2-large on the WikiText-2 raw test split, context k = 1,024. At stride
  1,024 (disjoint windows) the steady-state context lower bound is 0 tokens, the forward
  cost is 1 times disjoint scoring, the reported perplexity is 19.44, which is
  ℓ = 2.967 nats per token or 4.281 bits per token. At stride 512 the
  steady-state context lower bound is 512 tokens, the forward cost is 2 times, the reported
  perplexity is 16.44, ℓ = 2.800 nats or 4.039 bits per token. The difference
  of 0.168 nats per token comes from the stride alone. The Transformers
  version is not pinned on the page.
spec:
  header: "GPT-2-LARGE · WIKITEXT-2 RAW · k = 1024"
  variables: { k: 1024, s: 1024, PPL: 19.44 }
  rows:
    - { key: "context window k", formula: "k", format: integer }
    - { key: "stride s", formula: "s", format: integer }
    - { key: "steady-state context lower bound, k − s", formula: "k - s", format: integer }
    - { key: "forward passes vs disjoint, k/s", formula: "k/s", format: ratio }
    - { key: "reported PPL (R4.22)", formula: "PPL", format: fixed2 }
    - { key: "ℓ = ln PPL, nats/token", formula: "ln(PPL)", format: fixed3 }
    - { key: "bits/token, ℓ/ln 2", formula: "ln(PPL)/ln(2)", format: fixed3 }
    - { key: "Transformers version", value: "not pinned on the page" }
states:
  - { anchor: why-this-exists, label: "stride 1024, disjoint", variables: { s: 1024, PPL: 19.44 }, highlight: ["reported PPL (R4.22)", "ℓ = ln PPL, nats/token"], note: "Disjoint 1024-token windows: the documentation reports PPL 19.44, ℓ = 2.967 nats/token. Nothing about the model changes in the next state." }
  - { anchor: mechanism, label: "stride 512", variables: { s: 512, PPL: 16.44 }, highlight: ["stride s", "steady-state context lower bound, k − s", "reported PPL (R4.22)"], note: "Stride 512: after warm-up the overlap supplies at least 512 context tokens in the declared window convention and PPL reads 16.44 (ℓ = 2.800): 0.168 nats/token from the convention alone." }
  - { anchor: algorithm, label: "cost of stride 512", variables: { s: 512, PPL: 16.44 }, highlight: ["forward passes vs disjoint, k/s"], note: "Algorithm 4.6 runs ⌈N/s⌉ passes of length at most k: stride 512 has approximately twice the steady-state window work; exact counts and target policies differ." }
```

## Intuition

The total NLL is a sum of conditional code lengths. Dividing by scored tokens gives nats per token; dividing by ln 2 and by corresponding source bytes gives bits per byte. A coarser tokenizer can assign more uncertainty to each token while using fewer tokens for the same bytes. Consequently token perplexity cannot isolate model quality across tokenizers (MATHEMATICALLY-DERIVED).

A decoder's output policy is another distribution. Temperature, top-k/top-p truncation, grammar constraints, rejection, or reranking can alter generated outputs without changing the stored model's reference-token likelihood. State whether a metric scores the underlying model distribution or a transformed policy; neither can stand in for the other without a specified relationship.

## Formulation

For a token-mean NLL ℓ in nats per token over an evaluation set with L_T tokens and L_B UTF-8 bytes:

$$
\mathrm{PPL} = \exp(\ell),\qquad \ell = -\frac{\sum_t m_t \log p_\theta(x_t \mid x_{<t})}{\sum_t m_t}
$$
*(Eq. 4.15)* where m_t = evaluation loss mask (which tokens are scored), and the conditioning x_{<t} is truncated to the model's context window unless stated.

$$
\mathrm{BPB} = \frac{L_T}{L_B}\cdot\frac{\ell}{\ln 2}
$$
*(Eq. 4.16)* where L_T = number of scored tokens, L_B = number of UTF-8 bytes of the same text; this is the P03 definition "bpb = (L_T/L_B) log₂(e^ℓ) = (L_T/L_B) ℓ/ln(2)" (PAPER-REPORTED · P03).

Bits per byte is owned by [§2.3 Information theory](../ch02-mathematical-and-statistical-foundations/02-3-information-theory.md): cross-entropy expressed in bits per UTF-8 byte of the original text. Eq. 4.16 applies that definition to a tokenised evaluation set, which changes the reporting unit; it does not make the learned likelihood invariant to tokenization.

```figure
id: fig-4.31
kind: calculator
title: One loss in three units, and what a tokenizer does to it
caption: >-
  Eq. 4.15 and Eq. 4.16 together. The same text scored by the same model of
  its bytes has one BPB; a tokenizer that cuts it into more tokens spreads
  the same total bits over more units, lowering per-token ℓ and PPL. The last
  two outputs apply the 1.30× token ratio of the verification table's
  placeholder reports. The 0.25 tokens per byte is illustrative.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.15", "DERIVED:eq-4.16", P03]
alt: >-
  Calculator for Eq. 4.15 and 4.16. Inputs: token-mean NLL ℓ in nats per
  token and scored tokens per UTF-8 byte L_T/L_B. Outputs: perplexity exp(ℓ);
  bits per token ℓ/ln 2; bits per byte (L_T/L_B)·ℓ/ln 2; and the per-token ℓ
  and perplexity if the same bytes were cut into 1.30 times as many tokens,
  at unchanged bits per byte. At ℓ = 2.1 and 0.25 tokens per byte
  (illustrative): PPL 8.17, 3.030 bits per token, 0.757 bits per byte; at
  1.30 times the tokens, ℓ = 1.615 and PPL 5.03 with the same 0.757 bits per
  byte.
spec:
  tex: >-
    \mathrm{PPL} = e^{\ell},\qquad \text{bits/token} = \frac{\ell}{\ln 2},\qquad
    \mathrm{BPB} = \frac{L_T}{L_B}\cdot\frac{\ell}{\ln 2}
  equation: "4.16"
  inputs:
    - { symbol: ell, label: "ℓ, token-mean NLL, nats/token", default: 2.1, min: 0.5, max: 6, format: fixed3 }
    - { symbol: tpb, label: "L_T/L_B, scored tokens per UTF-8 byte", default: 0.25, min: 0.1, max: 1, format: fixed3 }
  outputs:
    - { symbol: PPL, label: "PPL = exp(ℓ), Eq. 4.15", formula: "exp(ell)", format: fixed2 }
    - { symbol: bpt, label: "bits per token, ℓ/ln 2", formula: "ell/ln(2)", format: fixed3 }
    - { symbol: BPB, label: "bits per byte, Eq. 4.16", formula: "tpb*ell/ln(2)", format: fixed3, emphasis: true }
    - { symbol: ell13, label: "ℓ with 1.30× tokens, same BPB", formula: "ell/1.3", format: fixed3 }
    - { symbol: PPL13, label: "PPL with 1.30× tokens, same BPB", formula: "exp(ell/1.3)", format: fixed2 }
states:
  - { anchor: formulation, label: "a bare “loss 2.1”", variables: { ell: 2.1, tpb: 0.25 }, highlight: [PPL, bpt, BPB], note: "“Loss 2.1” is PPL 8.17 and 3.03 bits per token; it becomes 0.757 bits per byte only once L_T/L_B is stated (0.25 here, illustrative)." }
  - { anchor: mechanism, label: "1.30× tokens per byte", variables: { ell: 1.6154, tpb: 0.325 }, highlight: [PPL, BPB], note: "The same bytes cut into 1.30× more tokens (0.325 per byte): ℓ falls to 1.615 nats and PPL to 5.03 while BPB stays 0.757. This illustrates units across compatible model/tokenizer pairs, not swapping one checkpoint's tokenizer." }
  - { anchor: failure-modes, label: "detect with BPB", variables: { ell: 2.1, tpb: 0.25 }, highlight: [BPB, PPL13], note: "Cross-tokenizer comparison: PPL 8.17 against 5.03 is one and the same 0.757 bits per byte. Report BPB with L_B, or do not compare." }
```

> **Definition — Perplexity comparability conditions.** Two perplexities share an axis only if they agree on (i) tokenizer, (ii) normalisation and mask, (iii) context window and evaluation stride, (iv) document-boundary treatment, and (v) evaluation set and preprocessing. Violating any one makes the pair incomparable.

```figure
id: fig-4.32
kind: diagram
title: Five conventions every perplexity silently depends on
caption: >-
  The inputs define the evaluated probability events and their weighting.
  Byte normalization replaces the token denominator with a declared byte
  count. Compatible tokenization, target recovery, conditioning, and boundary
  policies still determine the numerator; a tokenizer cannot be swapped
  arbitrarily on a fixed checkpoint.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.15", "DERIVED:eq-4.16", P03, R4.22]
alt: >-
  Diagram of the perplexity comparability conditions. The evaluation set and
  its preprocessing, condition (v), determine the evaluation text of L_B
  bytes. The tokenizer, condition (i), turns it into L_T token ids. The masked
  sum of negative log-probabilities computed by Algorithm 4.6 depends on the
  checkpoint and on three more conditions: (ii) normalisation and mask, (iii)
  context window k and stride s, and (iv) document boundaries (packed or
  reset, EOS scored or not). The sum gives ℓ in nats per token (Eq. 4.15),
  which gives PPL = exp(ℓ), inheriting all five conditions, and BPB =
  (L_T/L_B)·ℓ/ln 2 (Eq. 4.16), which changes the denominator while
  retaining model-tokenizer and probability-event conditions.
spec:
  direction: LR
  nodes:
    - { id: set, kind: dependency, label: "(v) evaluation set and preprocessing", sub: "raw vs normalised; dedup; contamination" }
    - { id: text, kind: dataset, label: "evaluation text", sub: "L_B UTF-8 bytes" }
    - { id: tok, kind: dependency, label: "(i) tokenizer", sub: "sets L_T" }
    - { id: msk, kind: dependency, label: "(ii) normalisation and mask", sub: "m_t; token- vs document-mean" }
    - { id: ctx, kind: dependency, label: "(iii) context k and stride s", sub: "at least k − s tokens of context" }
    - { id: bnd, kind: dependency, label: "(iv) document boundaries", sub: "packed vs reset; EOS scored?" }
    - { id: ckpt, kind: model, label: "checkpoint θ", sub: "fixed" }
    - { id: nll, kind: process, label: "Σ m_t · (−log p_θ(x_t | x_{<t}))", sub: "Algorithm 4.6" }
    - { id: ell, kind: metric, label: "ℓ, nats per token", sub: "Eq. 4.15" }
    - { id: ppl, kind: metric, label: "PPL = exp(ℓ)", sub: "inherits all five conditions" }
    - { id: bpb, kind: metric, label: "BPB = (L_T/L_B)·ℓ/ln 2", sub: "Eq. 4.16; aligns byte units, retains probability differences", emphasis: true }
  edges:
    - { from: set, to: text, kind: dependency }
    - { from: text, to: tok }
    - { from: tok, to: nll, label: "L_T token ids" }
    - { from: msk, to: nll, kind: dependency }
    - { from: ctx, to: nll, kind: dependency }
    - { from: bnd, to: nll, kind: dependency }
    - { from: ckpt, to: nll, kind: dependency }
    - { from: nll, to: ell, kind: emphasis }
    - { from: ell, to: ppl }
    - { from: ell, to: bpb, kind: emphasis }
    - { from: tok, to: bpb, kind: dependency, label: "L_T/L_B" }
```

Calibration of the token predictor: with confidence p̂ = max_v p_θ(v | ·) and correctness 1[argmax = x_t],

$$
\mathrm{ECE} = \sum_{m=1}^{M}\frac{|B_m|}{n}\,\big|\mathrm{acc}(B_m) - \mathrm{conf}(B_m)\big|
$$
*(Eq. 4.17)* where B_m = predictions whose confidence falls in bin m, n = predictions, acc/conf = mean correctness and mean confidence in the bin (PAPER-REPORTED · R4.17 for the definition; perfect calibration is ℙ(Ŷ = Y | P̂ = p) = p).

For an evaluation set that is a mixture of D_doc documents with token counts n_d and per-document mean NLL ℓ_d:

$$
\ell_{\text{tok}} = \frac{\sum_d n_d \ell_d}{\sum_d n_d},\qquad \ell_{\text{doc}} = \frac{1}{D_{\text{doc}}}\sum_d \ell_d,\qquad \ell_{\text{tok}}-\ell_{\text{doc}}=\frac{\operatorname{Cov}_d(n_d,\ell_d)}{\operatorname{mean}_d(n_d)}
$$
*(Eq. 4.18)* (MATHEMATICALLY-DERIVED; the same fact as Eq. 4.2 applied to evaluation).

## Mechanism

### Methodology

Declare the evaluation text and preprocessing, compatible tokenizer/checkpoint, conditioning source, document boundaries, BOS/EOS handling, target set, and reduction. Sum unsmoothed target NLLs and valid counts before forming token-mean loss. A mean of document means weights documents equally; a token mean weights them by length. Their difference is Cov_d(n_d,ell_d)/mean_d(n_d), with covariance over uniformly weighted documents. They coincide exactly when that covariance is zero; equal lengths or equal losses are sufficient but not necessary (MATHEMATICALLY-DERIVED).

Byte normalization removes the token-count unit, not the effects of tokenization on learned probabilities. BPB comparisons require the same original byte stream and a declared, recoverable encoding. Lossy normalization, omitted targets, extra special-token likelihoods, and different boundary policies can invalidate a claim to score the same byte-level event. A fixed checkpoint generally cannot be evaluated by replacing its tokenizer with an unrelated one; IDs and embeddings are coupled. Compare compatible model-tokenizer pairs, not two arbitrary encodings fed to one unchanged vocabulary (DERIVED; [P03](references.md#p03), BPB evaluation).

For a finite context, specify which left context each target receives. A strided evaluator reuses overlapping windows but scores only newly eligible targets. The first token of a window has no preceding input position for a conventional internally shifted decoder loss. At stride equal to full window width, this can leave one token unscored at each boundary unless a separate initial-context/BOS convention is used. An exactly-once algorithm therefore requires enough overlap or explicit context handling, and its counted-target set must be reported (MATHEMATICALLY-DERIVED).

More available context does not mathematically guarantee lower NLL for a fixed learned model: its estimated conditionals may assign a lower probability to the actual target after receiving additional context. The documentation's improvement is an observed example, not a monotonicity theorem ([R4.22](references.md#r4-22), OFFICIAL-DOCUMENTATION). Prefix positions near the beginning of the corpus also lack the full steady-state context bound; state the warm-up exception.

Document reset changes the conditional distribution. Packing without reset scores later documents conditioned on earlier documents; resetting scores each document from its declared start context. Neither is universally preferable: the correct convention matches the evaluation question. Training/evaluation contamination and distribution mismatch are additional concerns, not repaired by a lower loss number (section 61).

For calibration, distinguish token top-label confidence from factual-answer or sequence-level correctness. Equation 4.17 compares confidence and top-label accuracy within bins. Its estimate depends on binning, sample size, and correlated observations. Temperature scaling fits a positive scalar on a separate calibration set, normally by held-out NLL; it preserves logit argmax but changes probabilities. It is not guaranteed to improve ECE on every test distribution or binning scheme ([R4.17](references.md#r4-17), sections 3-4, PAPER-REPORTED for the classification method; application conditions DERIVED). That paper studies classifiers and is not evidence that an LLM's answer correctness is calibrated by the same scalar.

Cost boundary: loss evaluation requires model forward work, vocabulary reduction, and token/byte accounting. Overlap increases processed positions relative to scored positions. A fixed-shape implementation has an approximate steady-state work multiplier governed by window/stride, but exact cost depends on the first/last window, attention implementation, packing, and reuse. ECE accumulation is O(n+M) for n predictions and M bins; retaining full vocabulary probabilities is unnecessary for top-label ECE. Energy, latency, and money require measured execution settings (DERIVED).

```figure
id: fig-4.33
kind: matrix
title: Packed versus reset visibility for two documents in one context
caption: >-
  Two 6-slot documents packed into one 12-slot context. Full-shade cells are
  admitted under both conventions; the light block is admitted only when the
  context is packed without an attention reset. The highlighted row, B1, is
  scored given all of document A in one convention and given nothing in the
  other: the same token, two conditionals, two contributions to ℓ.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-4.15"
alt: >-
  Twelve by twelve lower-triangular grid for two documents, A1 to A5 plus EOS
  and B1 to B5 plus EOS, packed into one context. Cells within the same
  document on or below the diagonal are full shade: 42 pairs admitted with or
  without an attention reset. The 6 by 6 block where document B rows attend to
  document A columns is light shade: 36 pairs admitted only when the context
  is packed without a reset, for 78 in total. Row B1 is highlighted across
  columns A1 to EOS of document A. Whether the EOS slots are scored is a
  second, separate convention.
spec:
  rows: 12
  cols: 12
  pattern: explicit
  cells:
    - [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    - [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    - [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    - [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]
    - [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]
    - [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 1, 0, 0, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 1, 1, 0, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 1, 1, 1, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 1, 1, 1, 1, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 1, 1, 1, 1, 1, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 1, 1, 1, 1, 1, 1]
  rowLabel: "scored slot (query)"
  colLabel: "slot it may condition on"
  rowTicks: ["A1", "A2", "A3", "A4", "A5", "EOS", "B1", "B2", "B3", "B4", "B5", "EOS"]
  colTicks: ["A1", "A2", "A3", "A4", "A5", "EOS", "B1", "B2", "B3", "B4", "B5", "EOS"]
  highlight:
    - { row: 6, col: 0 }
    - { row: 6, col: 1 }
    - { row: 6, col: 2 }
    - { row: 6, col: 3 }
    - { row: 6, col: 4 }
    - { row: 6, col: 5 }
  legend: "full: admitted packed or reset (42); light: packed without reset only (36)"
```

```figure
id: fig-4.34
kind: compare
title: What moves ℓ and what moves the deployed output
caption: >-
  Read the first two rows against each other: in no column does the change
  in ℓ fix the change in the task metric. Label smoothing and post-training
  can move them in opposite directions; stride changes evaluation context without changing weights. Compatible
  model-tokenizer pairs can have different event units. Temperature changes
  probabilities while preserving argmax, and decoding can change deployed
  samples without changing the underlying reference score. Directions below
  are source-specific or explicitly conditional.
placement: wide
evidence: PAPER-REPORTED
source: [P01, R4.23, R4.17, R4.22, "DERIVED:eq-4.16"]
concepts: [ms.section.4.6, ms.section.21.6]
alt: >-
  Comparison of six interventions on the relation between held-out ℓ and the
  deployed output. Label smoothing with ε = 0.1: ℓ rises (P01 says it hurts
  perplexity) while BLEU improves; the trained model differs. Temperature
  scaling: ℓ and ECE change, the argmax and so greedy output do not (R4.17);
  sampled outputs change. Smaller evaluation stride: ℓ falls, 19.44 to 16.44
  PPL in R4.22, with no model change and no output change. If the total NLL and bytes are held fixed while the token count grows,
  per-token ℓ falls and BPB is unchanged. General tokenizer/model changes
  need not satisfy that premise. Post-training: ℓ can rise while task metrics improve, because
  the objective is not ℓ (Eq. N.6). Truncation or constrained decoding: ℓ is
  unchanged while the deployed distribution changes.
spec:
  axis: >-
    Direction of change in held-out ℓ against the change in what is deployed,
    for the interventions §4.6 names; no magnitudes beyond those reported
  columns:
    - { id: ls, label: "Label smoothing, ε = 0.1" }
    - { id: temp, label: "Temperature scaling" }
    - { id: stride, label: "Smaller evaluation stride" }
    - { id: tok, label: "More tokens per byte" }
    - { id: post, label: "Post-training (Eq. N.6)", node: ms.section.31.1 }
    - { id: dec, label: "Truncation, constrained decoding" }
  rows:
    - { dimension: "held-out ℓ", values: { ls: "rises: “hurts perplexity” (P01 §5.4)", temp: "changes with the positive calibration temperature", stride: "falls: PPL 19.44 → 16.44 (R4.22)", tok: "at fixed total NLL/bytes: falls per token; BPB unchanged; otherwise undetermined", post: "can rise (likelihood–capability inversion)", dec: "unchanged: ℓ is scored before decoding" } }
    - { dimension: "thresholded or task metric", values: { ls: "BLEU improves (P01 §5.4)", temp: "unchanged under greedy decoding", stride: "unchanged: same model", tok: "no change implied", post: "the target: optimises reward, not ℓ", dec: "can change; ℓ cannot see it" } }
    - { dimension: "greedy output", values: { ls: "a different trained model", temp: "unchanged: argmax preserved (R4.17)", stride: "unchanged: evaluation only", tok: "a different tokenizer and model", post: "changes", dec: "changes under constraints" } }
    - { dimension: "what else changes", values: { ls: "smoothing changes targets; higher test entropy is not guaranteed", temp: "ECE (Eq. 4.17) and sampled outputs", stride: "approximately k/s steady-state work; endpoint and target policy matter", tok: "L_T, so the PPL unit", post: "the deployed distribution", dec: "the deployed distribution" } }
    - { dimension: "source", values: { ls: "P01 §5.4; R4.23", temp: "R4.17", stride: "R4.22", tok: "Eq. 4.16; R4.22", post: "Eq. N.6; §31.1", dec: "§4.6 distribution mismatch" } }
```

## Algorithm

```text
Algorithm 4.6 — Exactly-once conditional NLL for a finite-context decoder
INPUT stream z[0:T_eval+1], where z[0] is the declared initial context token;
      maximum input length k>=2; stride 1<=s<=k-1; model/tokenizer; scored byte count L_B
STATE next_target=1; nll_sum=0; n_scored=0
OUTPUT ell, PPL, BPB, scored count, and context/target manifest
1 while next_target<=T_eval:
2   last <- min(next_target+s-1,T_eval)              # inclusive endpoint
3   first <- max(0,last-k+1)                        # k or fewer tokens
4   require first<next_target                     # each target has a predecessor
5   run model on z[first:last+1] under declared positions/visibility
6   for j=next_target...last:
7     add -log p(z[j] | z[first:j]) from logits at slot j-1-first
8   n_scored += last-next_target+1; next_target <- last+1
9 require n_scored=T_eval and L_B>0
10 ell <- nll_sum/n_scored; PPL <- exp(ell); BPB <- nll_sum/(L_B*ln 2)
INVARIANT targets 1...next_target-1 have each been scored exactly once
```

The first new target in a full window has at least k-s preceding tokens; early windows have less because the stream has not supplied them. Inputs include the final target token only to permit one common full-window forward call; the gathered prediction is from its predecessor under causal visibility. If a model has no BOS/initial-context distribution, leave the first corpus token unscored and disclose that change instead of inventing its probability. Likewise, exclude or account for synthetic BOS/EOS likelihoods consistently with L_B.

The algorithm is a mathematical reconstruction, not a verbatim transcription of the documentation loop. It uses ceil(T_eval/s) windows, each of at most k positions. A disjoint-window protocol with s=k has a different target/context policy unless it supplies additional predecessor context; it must not silently claim the same exactly-once invariant.

## Implementation

Accumulate summed NLL in a declared dtype and keep the exact valid-target count. Model arithmetic precision and loss-reduction precision are separate choices. Use a suitable higher-precision reference for numerical auditing when needed, but neither FP32 nor BF16 alone proves the absence or presence of a material evaluation error (section 3). Avoid exponentiating large losses until the final report; NLL or log perplexity remains representable when perplexity overflows (DERIVED).

For each chunk, log original target indices and the visibility interval so duplicate/missing scores are detectable independently of loss values. Save corpus byte counts before tokenizer normalization if the stated metric concerns original UTF-8 bytes, and verify that the encoding actually preserves that stream. A byte-normalized number with an incompatible byte/target denominator is not a corrected cross-tokenizer comparison.

For calibration, use separate fitting and evaluation data, retain bin counts and confidence/correctness sums, and report binning. Sequence/factual confidence requires its own event definition and verifier; token top-label ECE does not answer it. Distributed evaluation must sum numerators and counts rather than average rank means with unequal counts (DERIVED).

## Experimental design

### Reported experiments

The Hugging Face fixed-context page evaluates GPT-2 Large on the WikiText-2 raw test data using its tokenizer and context limit and compares windowing conventions. It reports perplexities 19.44 for a disjoint treatment and 16.44 for its smaller-stride example ([R4.22](references.md#r4-22), OFFICIAL-DOCUMENTATION). Those values are source-reported examples, not measurements reproduced by the book. Exact checkpoint, dataset/configuration, code, special-token and counted-target conventions accompany the example; the figure does not claim a universal context improvement or hardware speedup.

The Pile uses byte-normalized evaluation to compare predictions across models/tokenizers (P03 evaluation, PAPER-REPORTED). This aligns the reporting unit; it does not remove differences in model probabilities or corpus conditioning. The Transformer smoothing observation and HumanEval execution evaluation provide separate evidence that task metrics and reference-token likelihood need not order systems identically (P01 section 5.4; R4.10 section 3).

Guo et al. evaluate calibration and temperature scaling on the paper's classification datasets/networks, fitting calibration on held-out data (R4.17 sections 3-4, PAPER-REPORTED). Its ECE definition can be mathematically applied to other categorical events, but its measured improvement cannot be transferred to LLM factuality without an LLM-specific study.

## Observations

**What the paper claims.** The sources report a fixed-context perplexity example, byte-normalized language-model evaluation, a smoothing/task-metric trade-off, and classifier calibration results under their stated protocols (R4.22 OFFICIAL-DOCUMENTATION; P03, P01, R4.17 PAPER-REPORTED).

**What the evidence shows.** Metric values depend on evaluation conditions. A lower token loss is not a complete deployment result, and classifier calibration evidence does not establish sequence-level answer confidence for a generative model.

**What we infer.** Every likelihood report needs a numerator, denominator, probability model, and conditioning contract. Byte units and exactly-once target accounting make the measurement auditable but do not remove distribution mismatch or prove capability (MATHEMATICALLY-DERIVED).

**What remains unknown.** An unreported model's boundary/stride convention is NOT-DISCLOSED. The cited evidence does not settle the best decoding policy, factual calibration method, or loss/capability relationship for an arbitrary checkpoint and deployment distribution.

## Failure modes

> **Failure mode — Mean of means.** *Symptom:* reported loss depends on rank/batch partition. *Cause:* averaging unequal-count means. *Detection:* recompute from summed NLL and valid counts. *Mitigation:* preserve the intended token or document estimator (DERIVED).

> **Failure mode — Unit or byte-event mismatch.** *Symptom:* a cross-tokenizer PPL comparison is treated as capability evidence. *Cause:* different token units, normalization, or recovered byte streams. *Detection:* inspect total NLL, tokens, bytes, and compatibility. *Mitigation:* report valid byte-normalized likelihood with its probability-event conditions; BPB does not make models invariant to tokenization (DERIVED).

> **Failure mode — Lost/duplicated window targets.** *Symptom:* counts disagree with the declared evaluation set. *Cause:* internally shifted labels or overlapping masks handled incorrectly. *Detection:* enumerate original target indices. *Mitigation:* use exactly-once accounting or disclose excluded boundary tokens (DERIVED).

> **Failure mode — Conditioning or calibration overclaim.** *Symptom:* a lower PPL or ECE is presented as universal answer correctness. *Cause:* a changed context distribution or a different correctness event. *Detection:* compare the actual conditioning, labels, calibration fit, and deployment task. *Mitigation:* report separate likelihood, task, and calibrated-event metrics with their evaluation protocols (DERIVED).

## Siblings

An evaluation unit includes the compatible checkpoint/tokenizer, conditioning protocol, target population, and any decoding or engine configuration relevant to the measured result [§6.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md). Reference-token likelihood and execution/answer success then measure different functions of that unit. A capability predictor fitted to loss requires a task-specific empirical relationship and uncertainty model; monotonicity of perplexity in NLL supplies no such relationship [§21.6](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-6-capability-prediction.md).

Contamination, selection, saturation, and distribution mismatch can alter the evidential meaning of a benchmark without changing its arithmetic reduction [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md). Byte normalization addresses a reporting denominator; dependency-aware intervals address precision; neither independently establishes benchmark validity or deployment utility.



## Extensions

### Improvements

Overlapping evaluation windows supply more left context to most newly scored targets than a disjoint-reset procedure; the source documentation demonstrates a favorable result in one setting (R4.22). Exactly-once index accounting improves the validity of that comparison by exposing missing/duplicated targets; it is a correctness condition rather than a new empirical gain.

Byte-normalized reporting supports comparisons across tokenization units when the underlying text event is preserved (P03). Temperature scaling supplies a simple held-out probability recalibration procedure for the classifier setting studied by R4.17. Neither changes the model's knowledge or proves improved execution correctness.

Deployment assessment adds task verifiers, distribution slices, abstention/calibration events, latency, and resource budgets. These are additional measurement axes with their own protocols; an aggregate likelihood should not erase them.

## Limitations

Likelihood remains useful for a declared predictive distribution and data set; a disagreement with one capability metric limits that proxy claim, not the mathematical validity of likelihood. Same-tokenizer comparisons can be valid in token units when their remaining conventions align. Cross-tokenizer byte normalization is useful only with compatible byte events and explicit special-token/boundary accounting.

The cited calibration study concerns classifiers; no factual or sequence-level LLM calibration result is claimed. The book performed no evaluation or timing measurement.

## Reproducibility

Record corpus identity/checksum and preprocessing, compatible checkpoint/tokenizer, original bytes, scored tokens, BOS/EOS policy, segmentation, context/stride, position IDs, visible intervals, precision, sum/count reductions, and total NLL before exponentiation. Calibration additionally requires its event definition, calibration split, fit objective, temperature, bins, and evaluation uncertainty procedure. The chapter reports no executed evaluation; its fixture and counterexamples remain in [verification.md](verification.md).

## References

P01, P03, P08; R4.17, R4.22, R4.23; Eq. N.2, N.3, N.6.
