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
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 4.6 Likelihood and capability

## Scope

Objective: define perplexity and bits-per-byte from Eq. N.2, prove their dependence on tokenizer, normalisation, context window, document boundaries, and evaluation set, define calibration for token predictions, and state precisely why held-out likelihood is a necessary but incomplete deployment objective. Baseline: the causal row and its token-mean NLL. Success: given two perplexity reports the reader can decide whether they share an axis, and can convert a per-token loss to a tokenizer-independent unit when the byte count is known. Boundaries: evaluation units and splits are owned by [§6.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md)–[§6.2](../ch06-experimental-design-and-evaluation-before-optimization/06-2-data-partitioning.md); capability prediction from loss by [§21.6](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-6-capability-prediction.md); validity threats by [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md).

## Why this exists

What failed before was the use of perplexity as a universal scalar: a number computed with one tokenizer, one context length, and one boundary convention was placed beside another computed differently, and the smaller was called better. The bottleneck was that each of those conventions changes the number by amounts comparable to the differences between models — the Hugging Face documentation's own worked example shows the same model and dataset moving from a reported 19.44 to 16.44 by changing only the evaluation stride (OFFICIAL-DOCUMENTATION · R4.22). The constraint that became dominant was that deployment metrics are thresholded (a test passes or fails, a user accepts or rejects), while likelihood is continuous, so a monotone relation between them is an empirical hypothesis, not a theorem. What changed is that the comparability conditions can be enumerated and a report can be checked against them.

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
  1,024 (disjoint windows) the guaranteed context is 0 tokens, the forward
  cost is 1 times disjoint scoring, the reported perplexity is 19.44, which is
  ℓ = 2.967 nats per token or 4.281 bits per token. At stride 512 the
  guaranteed context is 512 tokens, the forward cost is 2 times, the reported
  perplexity is 16.44, ℓ = 2.800 nats or 4.039 bits per token. The difference
  of 0.168 nats per token comes from the stride alone. The Transformers
  version is not pinned on the page.
spec:
  header: "GPT-2-LARGE · WIKITEXT-2 RAW · k = 1024"
  variables: { k: 1024, s: 1024, PPL: 19.44 }
  rows:
    - { key: "context window k", formula: "k", format: integer }
    - { key: "stride s", formula: "s", format: integer }
    - { key: "guaranteed context, k − s", formula: "k - s", format: integer }
    - { key: "forward passes vs disjoint, k/s", formula: "k/s", format: ratio }
    - { key: "reported PPL (R4.22)", formula: "PPL", format: fixed2 }
    - { key: "ℓ = ln PPL, nats/token", formula: "ln(PPL)", format: fixed3 }
    - { key: "bits/token, ℓ/ln 2", formula: "ln(PPL)/ln(2)", format: fixed3 }
    - { key: "Transformers version", value: "not pinned on the page" }
states:
  - { anchor: why-this-exists, label: "stride 1024, disjoint", variables: { s: 1024, PPL: 19.44 }, highlight: ["reported PPL (R4.22)", "ℓ = ln PPL, nats/token"], note: "Disjoint 1024-token windows: the documentation reports PPL 19.44, ℓ = 2.967 nats/token. Nothing about the model changes in the next state." }
  - { anchor: mechanism, label: "stride 512", variables: { s: 512, PPL: 16.44 }, highlight: ["stride s", "guaranteed context, k − s", "reported PPL (R4.22)"], note: "Stride 512: every scored token keeps at least 512 tokens of context and PPL reads 16.44 (ℓ = 2.800): 0.168 nats/token from the convention alone." }
  - { anchor: algorithm, label: "cost of stride 512", variables: { s: 512, PPL: 16.44 }, highlight: ["forward passes vs disjoint, k/s"], note: "Algorithm 4.6 runs ⌈N/s⌉ passes of length at most k: stride 512 costs 2× the forward passes of disjoint scoring for the same text." }
```

## Intuition

Physically, perplexity is the exponential of a coding length per symbol: it says how many equally likely choices the model is effectively facing per token, given everything it was allowed to see. Change the symbol (tokenizer), the amount it was allowed to see (context, boundaries), or the set of symbols averaged over (mask, evaluation set), and the quantity changes without the model changing. Heuristically, lower perplexity "understands better"; the resource fact is that lower coding length on the evaluation distribution is all that is measured, and deployment samples come from the model, not the evaluation set.

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

Bits per byte is owned by [§2.3 Information theory](../ch02-mathematical-and-statistical-foundations/02-3-information-theory.md): cross-entropy expressed in bits per UTF-8 byte of the original text. Eq. 4.16 applies that definition to a tokenised evaluation set, which removes the tokenizer's token count from the unit.

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
  - { anchor: mechanism, label: "1.30× tokens per byte", variables: { ell: 1.6154, tpb: 0.325 }, highlight: [PPL, BPB], note: "The same bytes cut into 1.30× more tokens (0.325 per byte): ℓ falls to 1.615 nats and PPL to 5.03 while BPB stays 0.757. The tokenizer moved PPL; the model did not." }
  - { anchor: failure-modes, label: "detect with BPB", variables: { ell: 2.1, tpb: 0.25 }, highlight: [BPB, PPL13], note: "Cross-tokenizer comparison: PPL 8.17 against 5.03 is one and the same 0.757 bits per byte. Report BPB with L_B, or do not compare." }
```

> **Definition — Perplexity comparability conditions.** Two perplexities share an axis only if they agree on (i) tokenizer, (ii) normalisation and mask, (iii) context window and evaluation stride, (iv) document-boundary treatment, and (v) evaluation set and preprocessing. Violating any one makes the pair incomparable.

```figure
id: fig-4.32
kind: diagram
title: Five conventions every perplexity silently depends on
caption: >-
  Every dashed input changes ℓ without touching the checkpoint. The heavy
  path ends at BPB because BPB is the only unit that removes one of them, the
  tokenizer, through L_T/L_B; conditions (ii) to (v) pass through to BPB
  unchanged. A report must name all five before its number has an axis.
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
  (L_T/L_B)·ℓ/ln 2 (Eq. 4.16), which removes the tokenizer condition only.
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
    - { id: bpb, kind: metric, label: "BPB = (L_T/L_B)·ℓ/ln 2", sub: "Eq. 4.16; removes (i) only", emphasis: true }
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

For an evaluation set that is a mixture of D documents with token counts n_d and per-document mean NLL ℓ_d:

$$
\ell_{\text{tok}} = \frac{\sum_d n_d \ell_d}{\sum_d n_d}\ \neq\ \ell_{\text{doc}} = \frac{1}{D}\sum_d \ell_d \quad\text{unless all } n_d \text{ are equal or all } \ell_d \text{ are equal}
$$
*(Eq. 4.18)* (MATHEMATICALLY-DERIVED; the same fact as Eq. 4.2 applied to evaluation).

## Mechanism

**Tokenizer dependence.** ℓ is a mean per token; a tokenizer that produces more tokens per byte spreads the same total coding length over more units, so its per-token ℓ is lower and its PPL is lower for the same model of the bytes (MATHEMATICALLY-DERIVED: total nats are invariant to a bijective re-segmentation only if the model is the same; per-token means are not). The Hugging Face documentation states this directly: "the tokenization procedure has a direct impact on a model's perplexity which should always be taken into consideration when comparing different models" (OFFICIAL-DOCUMENTATION · R4.22). P03 chooses BPB "due to its invariance to different tokenization schemes and the ambiguity of measuring characters in Unicode" (PAPER-REPORTED · P03). The chapter's rule: perplexities across tokenizers are reported as BPB or not compared; the vocabulary-economics consequences are developed in [§10.3](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md).

**Normalisation and mask.** Eq. 4.18 shows token-mean and document-mean differ whenever long and short documents have different losses. Whether BOS, EOS, or special tokens are scored changes both numerator and denominator. Reports that do not state m_t and the mean are underspecified (DERIVED from Eq. 4.15).

**Context window and stride.** With a fixed context k, a token at position t > k is scored with at most k−1 tokens of context; scoring disjoint chunks gives most tokens little context and "will typically yield a higher (worse) PPL"; a sliding window with stride s gives each token at least k − s tokens of context at the cost of a forward pass per stride (OFFICIAL-DOCUMENTATION · R4.22). The worked example on GPT-2-large and WikiText-2 reports 19.44 at stride 1024 (no overlap) and 16.44 at stride 512 (OFFICIAL-DOCUMENTATION · R4.22; workload: GPT-2-large, WikiText-2 raw test split joined with double newlines, context 1024, measured inside the process with the documentation's script; version of Transformers not pinned on the page, so the numbers are the documentation's and not the book's). Cost line: sliding-window evaluation with stride s multiplies forward FLOPs by k/s relative to disjoint chunks (DERIVED).

**Document boundaries.** Packing documents into a context without an attention reset lets tokens of document j condition on document j−1; with a reset (block-diagonal mask) they cannot. The two conventions score different conditionals and yield different ℓ; the same holds for whether EOS between documents is scored (DERIVED). Which convention a report used is frequently NOT-DISCLOSED.

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

**Evaluation set.** Different corpora, different preprocessing (whitespace normalisation, deduplication, the choice of raw versus tokenised WikiText variants), and contamination (§61.4) all move ℓ. The evaluation set is part of the metric's identity, not a parameter (DERIVED; contamination treatment is owned by §8 and §61).

**Distribution mismatch.** ℓ is an expectation under the evaluation distribution; deployment inputs come from users and deployment outputs from the model's own samples (§4.1 exposure bias). A model can have lower ℓ on a held-out corpus and worse behaviour on a deployment distribution that the corpus does not represent (MATHEMATICALLY-DERIVED: the two expectations are over different measures). Test-time interventions — sampling temperature, truncation, constrained decoding (§37) — change the deployed distribution without changing ℓ at all.

**Calibration.** R4.17 reports that modern classifiers "are poorly calibrated" and that "temperature scaling — a single-parameter variant of Platt Scaling — is surprisingly effective", and notes that "because the parameter T does not change the maximum of the softmax function, the class prediction remains unchanged" (PAPER-REPORTED · R4.17). For a language model the same statement holds per token: temperature changes ECE and the sampled distribution but not greedy decoding (MATHEMATICALLY-DERIVED). Label smoothing (R4.23, P01) is the training-time analogue: it raises ℓ and can improve a thresholded metric (PAPER-REPORTED · P01 §5.4), which is the cleanest demonstration that ℓ and capability are not monotone in each other.

**Why likelihood is incomplete as a deployment objective.** (1) It scores the evaluation distribution, not the deployment distribution (mismatch). (2) It is continuous, while deployment success is typically thresholded (pass/fail, accept/reject), and the map from continuous loss to thresholded metrics is empirical and can be sharply non-linear, developed in [§21.6](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-6-capability-prediction.md). (3) It is unit-dependent (Eq. 4.16) and convention-dependent (comparability conditions). (4) Interventions that improve deployment metrics can raise it (label smoothing; post-training objectives of Part VI, whose SFT and preference objectives are defined in [§31.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-1-sft-objectives.md) and later chapters, and Eq. N.6 of the RL contract, which optimises a reward, not ℓ). (5) It does not measure execution-grounded correctness (§4.3) or human preference ([§61](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/README.md)). None of this makes ℓ useless: it is the cheapest, most stable, least contaminable signal available during pretraining and the quantity scaling fits (Eq. N.3) are made on (PAPER-REPORTED · P08 for the fit family); it is incomplete, not wrong.

```figure
id: fig-4.34
kind: compare
title: What moves ℓ and what moves the deployed output
caption: >-
  Read the first two rows against each other: in no column does the change
  in ℓ fix the change in the task metric. Label smoothing and post-training
  can move them in opposite directions; stride and tokenizer move ℓ with the
  model untouched; temperature and decoding interventions move what is
  deployed while ℓ is unchanged or beside the point. Directions are the ones
  §4.6 states; magnitudes appear only where a source reports them.
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
  PPL in R4.22, with no model change and no output change. More tokens per
  byte: per-token ℓ falls with BPB unchanged (Eq. 4.16); no capability change
  is implied. Post-training: ℓ can rise while task metrics improve, because
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
    - { dimension: "held-out ℓ", values: { ls: "rises: “hurts perplexity” (P01 §5.4)", temp: "changes with T", stride: "falls: PPL 19.44 → 16.44 (R4.22)", tok: "falls per token; BPB unchanged (Eq. 4.16)", post: "can rise (likelihood–capability inversion)", dec: "unchanged: ℓ is scored before decoding" } }
    - { dimension: "thresholded or task metric", values: { ls: "BLEU improves (P01 §5.4)", temp: "unchanged under greedy decoding", stride: "unchanged: same model", tok: "no change implied", post: "the target: optimises reward, not ℓ", dec: "can change; ℓ cannot see it" } }
    - { dimension: "greedy output", values: { ls: "a different trained model", temp: "unchanged: argmax preserved (R4.17)", stride: "unchanged: evaluation only", tok: "a different tokenizer and model", post: "changes", dec: "changes under constraints" } }
    - { dimension: "what else changes", values: { ls: "entropy of the predictions rises", temp: "ECE (Eq. 4.17) and sampled outputs", stride: "k/s times the forward passes", tok: "L_T, so the PPL unit", post: "the deployed distribution", dec: "the deployed distribution" } }
    - { dimension: "source", values: { ls: "P01 §5.4; R4.23", temp: "R4.17", stride: "R4.22", tok: "Eq. 4.16; R4.22", post: "Eq. N.6; §31.1", dec: "§4.6 distribution mismatch" } }
```

## Algorithm

```text
Algorithm 4.6 — Strided-window token-mean NLL and BPB
INPUT   token ids x ∈ ℕ^N over the evaluation text, byte count L_B, context k, stride s ≤ k, model f_θ
OUTPUT  ℓ (nats/token), PPL, BPB, L_T
STATE   nll_sum, n_scored, prev_end
INVARIANT  each token is scored exactly once; each scored token at position t ≥ k has ≥ k − s tokens of context
1  nll_sum ← 0; n_scored ← 0; prev_end ← 0
2  for begin in 0, s, 2s, …:
3     end ← min(begin + k, N);  trg ← end − prev_end
4     inp ← x[begin:end];  tgt ← inp.clone();  tgt[: −trg] ← IGNORE      # context-only tokens unscored
5     nll ← Σ over scored positions of −log p_θ(tgt_t | inp_{<t})          # one forward pass
6     nll_sum += nll;  n_scored += (number of scored targets)
7     prev_end ← end;  if end = N: break
8  ℓ ← nll_sum / n_scored;  PPL ← exp(ℓ);  BPB ← (n_scored / L_B) · ℓ / ln 2;  return ℓ, PPL, BPB, n_scored
```
Complexity: ⌈N/s⌉ forward passes of length ≤ k, i.e. about k/s times the cost of disjoint scoring. Implementation link: the loop is the documentation's procedure (OFFICIAL-DOCUMENTATION · R4.22), restated with the book's variable names; line 8's BPB is Eq. 4.16.

## Implementation

```text
Systems trace (perplexity evaluation)
tokenise text → latency: CPU / memory: N ids / failure: tokenizer version drift changes N
strided forward passes → latency: ⌈N/s⌉ × prefill(k) / memory: one [1, k, V] logits per pass / compute: k/s × disjoint / failure: OOM at large V without chunked loss
reduce → failure: mixing per-pass means instead of summing nll and counts (a normalisation error)
report → must state tokenizer, k, s, boundary rule, set, mask, units
```

Numerics: nll must be accumulated in FP32 from a log-sum-exp (§3.2); BF16 logits with a large V lose precision in the normaliser (DERIVED). Kernels: the fused losses of §4.1 apply unchanged.

## Experimental design

### Experiment 4.6 — Same model, five conventions

- **Hypothesis:** for one fixed checkpoint and one fixed text, changing each comparability condition in turn moves PPL by an amount comparable to typical between-model differences.
- **Setup:** one open checkpoint with two candidate tokenizers (its own; a re-tokenisation for BPB only), context k, strides {k, k/2, k/8}, boundary rule ∈ {packed, reset}, two evaluation sets.
- **Independent variables:** tokenizer unit (PPL vs BPB), normalisation (token vs document mean), stride, boundary rule, evaluation set.
- **Controlled variables:** checkpoint, precision, hardware, script.
- **Dataset/workload:** two public held-out corpora with byte counts recorded.
- **Hardware:** one accelerator; latency recorded per stride.
- **Metrics:** ℓ, PPL, BPB, cost in forward passes.
- **Baselines:** stride = k, packed, token-mean, native tokenizer.
- **Expected result:** monotone PPL decrease with smaller stride; token-mean ≠ document-mean whenever lengths vary; boundary rule shifts ℓ; sets differ.
- **Ablation:** score/unscore EOS.
- **Interpretation:** quantifies each convention's effect; supports the rule that unstated conventions make reports incomparable.
- **Threats to validity:** effects are checkpoint- and corpus-specific; the magnitudes do not transfer, only the existence of the effects.

Proposal only; no run was executed.

## Observations

**What the paper claims.** P03 claims BPB is tokenizer-invariant and adopts it (PAPER-REPORTED · P03). The Transformers documentation claims a stride-dependent PPL on its example and states tokenizer dependence (OFFICIAL-DOCUMENTATION · R4.22). R4.17 claims modern networks are miscalibrated and temperature scaling fixes it without changing predictions (PAPER-REPORTED · R4.17). P01 claims label smoothing worsens perplexity while improving BLEU (PAPER-REPORTED · P01).

**What the evidence shows.** The stride, tokenizer, and normalisation effects follow from definitions and need no independent reproduction; the documentation example illustrates a magnitude for one model. The calibration and label-smoothing results are within-paper measurements whose *mechanism* (temperature does not change argmax; smoothing raises entropy) is exact even where the magnitudes are setting-specific.

**What we infer.** A perplexity without its five conventions is a number without a unit (DERIVED). We infer, marked ASSUMED, that most cross-paper perplexity comparisons in the literature violate at least one condition; the book has not audited a sample and states this as a risk, not a finding.

**What remains unknown.** How tightly ℓ predicts thresholded capability at a given scale is UNVERIFIED here and is the subject of §21.6. Boundary conventions of most published evaluations are NOT-DISCLOSED.

## Failure modes

> **Failure mode — Mean of means.** *Symptom:* reported PPL changes with batch composition. *Cause:* averaging per-pass or per-document means instead of summing nll and counts. *Detection:* recompute from raw sums. *Mitigation:* Algorithm 4.6 lines 6–8.

> **Failure mode — Cross-tokenizer comparison.** *Symptom:* a model with a larger vocabulary "wins" on PPL against every baseline. *Cause:* fewer tokens per byte. *Detection:* compute BPB. *Mitigation:* report BPB with L_B.

> **Failure mode — Boundary leakage.** *Symptom:* PPL improves after changing packing. *Cause:* conditioning across document boundaries. *Detection:* compare packed vs reset. *Mitigation:* state the rule; prefer reset for reporting.

> **Failure mode — Likelihood–capability inversion.** *Symptom:* a post-trained checkpoint has higher ℓ and better task metrics. *Cause:* the post-training objective is not ℓ (Eq. N.6; label smoothing). *Detection:* expected; not a bug. *Mitigation:* stop using ℓ as the gate after pretraining; use §6 evaluation units.

> **Failure mode — Miscalibrated confidence in deployment.** *Symptom:* high-confidence wrong tokens. *Cause:* overconfident softmax. *Detection:* ECE (Eq. 4.17) on a held-out slice. *Mitigation:* temperature scaling; it changes samples but not greedy outputs (R4.17).

## Siblings

This section has no objective-family siblings; it is the measurement counterpart of §4.1–§4.5. Its measurement siblings are owned elsewhere and are linked, not re-explained:

**Evaluation units** — [§6.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md)
Why it exists: what is being measured (checkpoint, tokenizer, prompt, engine). What assumption changed: the unit is not "the model". What objective changed: none. What problem it solved: attributable comparisons. What new failure mode it introduced: combinatorial unit space. Changed primitive: scalar metric → typed evaluation unit.

**Capability prediction from loss** — [§21.6](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-6-capability-prediction.md)
Why it exists: continuous loss vs thresholded metrics. What assumption changed: the map is empirical and possibly non-linear. What objective changed: none. What problem it solved: extrapolation risk. What new failure mode it introduced: apparent emergence. Changed primitive: ℓ → metric-specific link function.

**Validity threats** — [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md)
Why it exists: contamination, saturation, selection. What assumption changed: the evaluation set may be in the training set. What objective changed: none. What problem it solved: audit. What new failure mode it introduced: none. Changed primitive: trusted set → audited set.

## Extensions

For long context, the stride and boundary conditions dominate: a 128k-context evaluation with disjoint chunks and one with a 1k stride measure different conditionals, and per-position loss curves (loss vs t) are more informative than a scalar (DERIVED). For multimodality, BPB has no analogue for images or audio; per-modality units must be stated and are never comparable across modalities (DERIVED). For agents, likelihood of a trajectory under the policy is defined (Eq. N.1 over the model's turns) but is not the deployment objective; episodic success is (Part IX, XI).

## Limitations

Perplexity is valid as a within-convention, within-tokenizer, within-set progress signal during pretraining and as the fitted quantity of scaling analyses; it is falsified as a *capability* claim whenever a thresholded metric moves against it. Decision consequence: every reported ℓ or PPL in this book carries its five conventions; every cross-model comparison uses BPB or is refused.

## Reproducibility

Versions: P03 arXiv 2101.00027 (ar5iv, accessed 2026-09-20); R4.22 Hugging Face Transformers perplexity documentation page (accessed 2026-09-20; library version not pinned on the page); R4.17 arXiv 1706.04599 (ar5iv, accessed 2026-09-20); R4.23; P01 §5.4; P08. Artifacts: the incomparability demonstration in [verification.md](verification.md) §2.2. Configuration: tokenizer id, k, s, boundary rule, set id and preprocessing, mask, units. Metrics: ℓ in nats/token; BPB per Eq. 4.16; ECE with M bins stated. Unresolved: boundary conventions of published evaluations (NOT-DISCLOSED); loss-to-capability link (UNVERIFIED, §21.6).

## References

P01, P03, P08; R4.17, R4.22, R4.23; Eq. N.2, N.3, N.6.
