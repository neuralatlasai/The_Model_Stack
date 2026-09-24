---
id: ms.section.2.3
entity_type: section
title: Information theory
short_title: Information theory
volume: 1
part: 1
chapter: 2
section: 2.3
slug: 02-3-information-theory
parent: ms.chapter.2
prev_sibling: ms.section.2.2
next_sibling: ms.section.2.4
children: []
prerequisites: [ms.section.2.2]
downstream: [ms.section.4.1, ms.section.4.6, ms.section.10.3, ms.section.21.1, ms.section.33.1, ms.section.34.2, ms.section.39.2]
related: [ms.section.35.2]
siblings_by_mechanism: []
relations:
  - {type: prerequisite_of, target: ms.section.4.6}
  - {type: supported_by, target: paper.P03}
  - {type: supported_by, target: paper.P25}
axes: {lifecycle: [pretraining, post_training, evaluation], mechanism: [information_theory, likelihood], feedback_setting: [], modality: [text]}
papers: [P03, P25]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, ASSUMED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 02.3 Information theory

## Scope

Objective: define entropy, cross-entropy, KL divergence, and mutual information; identify negative log-likelihood with coding length; and fix bits per byte as the tokenizer-independent unit of language-model fit. Baseline: "perplexity" reported without tokenizer, base, or normalisation. Success: every likelihood figure in the book states its unit (nats or bits), its denominator (token, sequence, byte), and its tokenizer, and comparisons across tokenizers are made only in bits per byte. Boundaries: perplexity's dependence on tokenizer and distribution mismatch is developed in [§04.6](../ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md); vocabulary economics in [§10.3](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md); distillation losses in [§39.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/39-2-information-access.md).

## Why this exists

What failed: perplexities from models with different vocabularies were compared as if they measured the same quantity; a larger vocabulary lowers per-token loss by putting more bytes in each token, without the model predicting the text any better. The bottleneck: scaling studies (P08, P09) and data comparisons need a fit metric that is stable across tokenizers and time. The dominant constraint: the denominator. What changed: the total code length of the byte string — a tokenizer-free quantity — divided by bytes, which P03 adopted for exactly this reason.

## Intuition

Physically, a model is a compressor: an arithmetic coder driven by q produces a code for the byte string whose length is, to within two bits, −log₂ q(string). Training minimises the expected code length of held-out data; cross-entropy is that length in bits or nats per symbol. KL divergence is the *excess* code length paid for coding p-distributed data with a q-designed code. Mutual information is the code length saved on one variable by knowing another. No cognitive analogy is needed; the compressor picture is literal.

## Formulation

> **Definition — entropy, cross-entropy, KL divergence.** For distributions p, q on a discrete set 𝒳 with q(x) > 0 wherever p(x) > 0: H(p) = −Σ p log p; H(p,q) = −Σ p log q; KL(p‖q) = Σ p log(p/q).

$$
H(p,q) = H(p) + \mathrm{KL}(p\,\|\,q), \qquad \mathrm{KL}(p\,\|\,q) \ge 0 \text{ with equality iff } p = q
$$
*(Eq. 2.10)* where the logarithm base sets the unit: natural → nats, base 2 → bits; 1 nat = 1/ln 2 ≈ 1.4427 bits.

```figure
id: fig-2.14
kind: chart
title: Cross-entropy, entropy and KL for a binary target
caption: >-
  Eq. 2.10 for p = Bernoulli(0.3) coded with q = Bernoulli(x), in bits. The
  cross-entropy curve sits above the flat H(p) line by exactly KL(p‖q) and
  touches it only at q = p: that gap is the excess code length paid for a
  mis-specified code. The dashed reverse KL(q‖p) prices the same mismatch
  differently, which is what separates maximum likelihood from policy
  regularisation in the Mechanism and the Siblings.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.10"
alt: >-
  Line chart in bits against the model probability q(1) = x from 0.01 to
  0.99, for a target p(1) = 0.3. Entropy H(p) is flat at 0.881 bits.
  Cross-entropy H(p, q) is 2.003 bits at x = 0.01, 0.881 at x = 0.3 and 4.655
  at x = 0.99, always H(p) plus the forward KL(p‖q). Forward KL is 1.122 bits
  at x = 0.01, 0.467 at 0.05, zero at 0.3, 1.490 at 0.9 and 3.774 at 0.99.
  Reverse KL(q‖p) is 0.446, 0.289, zero, 1.146 and 1.644 at the same points.
spec:
  type: line
  x: { label: "q(1) = x, with p(1) = 0.3", scale: linear, format: fixed2, domain: [0.01, 0.99] }
  y: { label: "bits", scale: linear, format: fixed2 }
  variables: { p: 0.3 }
  series:
    - { id: ce, label: "cross-entropy H(p, q)", formula: "-(p*log2(x) + (1 - p)*log2(1 - x))", sample: { from: 0.01, to: 0.99, count: 99 }, emphasis: true }
    - { id: h, label: "entropy H(p)", formula: "-(p*log2(p) + (1 - p)*log2(1 - p))", sample: { from: 0.01, to: 0.99, count: 2 }, dashed: true }
    - { id: fkl, label: "forward KL(p‖q)", formula: "p*log2(p/x) + (1 - p)*log2((1 - p)/(1 - x))", sample: { from: 0.01, to: 0.99, count: 99 } }
    - { id: rkl, label: "reverse KL(q‖p)", formula: "x*log2(x/p) + (1 - x)*log2((1 - x)/(1 - p))", sample: { from: 0.01, to: 0.99, count: 99 }, dashed: true }
  annotations:
    - { x: 0.3, label: "q = p: KL = 0, H(p, q) = H(p) = 0.881" }
states:
  - { anchor: formulation, label: "q = p = 0.3", variables: { x: 0.3 }, highlight: [ce, h], note: "At q = p the code is ideal: H(p, q) = H(p) = 0.881 bits and both KL directions are zero." }
  - { anchor: mechanism, label: "q = 0.05", variables: { x: 0.05 }, highlight: [fkl, rkl], note: "q starves an outcome p gives 30 %: forward KL 0.467 bits, reverse 0.289. Maximum likelihood minimises the forward one." }
  - { anchor: siblings, label: "q = 0.9", variables: { x: 0.9 }, highlight: [fkl, rkl], note: "Overshoot to q = 0.9: forward 1.490 bits, reverse 1.146. The direction chosen is part of the objective, not a detail." }
```

> **Definition — mutual information.** I(X;Y) = KL(p(x,y) ‖ p(x)p(y)) = H(X) − H(X|Y) = H(Y) − H(Y|X) ≥ 0.

$$
I(X;Y) = \sum_{x,y} p(x,y)\log\frac{p(x,y)}{p(x)\,p(y)} = H(X) - H(X \mid Y)
$$
*(Eq. 2.11)* where H(X|Y) = E_y[H(p(·|y))] is the conditional entropy.

> **Definition — coding length.** The coding length of x under model q is ℓ_q(x) = −log₂ q(x) bits; the negative log-likelihood of a dataset is its total coding length under the model.

$$
\sum_{i=1}^{n} -\log_2 q(x_i) \;\le\; \text{(arithmetic-code length in bits)} \;<\; \sum_{i=1}^{n} -\log_2 q(x_i) + 2
$$
*(Eq. 2.12)* where x_i = the i-th document, q = the model's sequential distribution; the bound is the standard arithmetic-coding guarantee, taken here as MATHEMATICALLY-DERIVED from the coding literature and not re-proved.

> **Definition — bits per byte.** For a corpus of L_T tokens and L_B UTF-8 bytes whose mean per-token loss under the model is ℓ nats,

$$
\text{BPB} = \frac{L_T}{L_B}\cdot\frac{\ell}{\ln 2}, \qquad \text{PPL} = \exp(\ell), \qquad \text{BPB} = \frac{L_T}{L_B}\log_2 \text{PPL}
$$
*(Eq. 2.13)* where ℓ = token-mean negative log-likelihood in nats (Eq. N.2 with all m_t = 1), L_T/L_B = tokens per byte (the inverse of bytes per token; related to tokenizer fertility, §10.3), PPL = perplexity.

```figure
id: fig-2.15
kind: calculator
title: Bits per byte, bits per token and perplexity from one loss
caption: >-
  Eq. 2.13 from a token-mean loss ℓ in nats and the corpus's tokens per byte
  L_T/L_B. BPB divides total code length by bytes, which no tokenizer can
  change; perplexity exponentiates a per-token quantity, which the tokenizer
  sets. The states hold BPB at 0.361 while the tokenizer packs 4 and then 5
  bytes into a token: the bytes are predicted equally well, yet ℓ moves from
  1.00 to 1.25 nats and PPL from 2.72 to 3.49. Illustrative tokenizer
  ratios, not measured ones.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.13", P03]
alt: >-
  Calculator for Eq. 2.13 with inputs token-mean loss ℓ in nats and tokens
  per byte L_T/L_B. At the defaults ℓ = 1.00 and L_T/L_B = 0.25 (4 bytes per
  token, illustrative): 1.443 bits per token, 0.361 bits per byte and
  perplexity 2.72. At L_T/L_B = 0.20 (5 bytes per token) the same 0.361 bits
  per byte requires ℓ = 1.25 nats, perplexity 3.49. One nat is
  1/ln 2 ≈ 1.443 bits.
spec:
  tex: >-
    \text{BPB} = \frac{L_T}{L_B}\cdot\frac{\ell}{\ln 2},\qquad \text{PPL} = \exp(\ell),\qquad \text{BPB} = \frac{L_T}{L_B}\log_2 \text{PPL}
  equation: "2.13"
  inputs:
    - { symbol: ell, label: "token-mean loss ℓ, nats", default: 1, min: 0.1, max: 5, step: 0.05, format: fixed2 }
    - { symbol: tpb, label: "tokens per byte L_T/L_B", default: 0.25, min: 0.1, max: 1, step: 0.01, format: fixed2 }
  outputs:
    - { symbol: bpt, label: "bits per token, ℓ/ln 2", formula: "ell/ln(2)", format: fixed3 }
    - { symbol: bpb, label: "bits per byte", formula: "tpb*ell/ln(2)", format: fixed3, emphasis: true }
    - { symbol: ppl, label: "perplexity exp(ℓ), per token", formula: "exp(ell)", format: fixed2 }
    - { symbol: Bt, label: "bytes per token L_B/L_T", formula: "1/tpb", format: fixed2 }
  presets:
    - { label: "5 bytes per token, same BPB", values: { ell: 1.25, tpb: 0.2 } }
states:
  - { anchor: formulation, label: "4 bytes per token", variables: { ell: 1, tpb: 0.25 }, highlight: [bpb, ppl], note: "ℓ = 1 nat per token at 4 bytes per token: BPB 0.361 and PPL 2.72." }
  - { anchor: mechanism, label: "5 bytes per token", variables: { ell: 1.25, tpb: 0.2 }, highlight: [tpb, ell, bpb, ppl], note: "Same bytes, same fit, BPB still 0.361; the coarser tokenizer raises ℓ to 1.25 nats and PPL to 3.49. Only BPB compares." }
  - { anchor: failure-modes, label: "nats or bits?", variables: { ell: 1, tpb: 0.25 }, highlight: [ell, bpt], note: "Base confusion: a loss of 1.0 nat is 1.443 bits per token. State the unit next to every number." }
```

> **Claim [PAPER-REPORTED · P03].** P03 defines bits per byte exactly as Eq. 2.13 ("bpb = (L_T/L_B) log₂(e^ℓ) = (L_T/L_B) ℓ/ln 2, where L_T is the length of the dataset in tokens and L_B is the length of the dataset in UTF-8 encoded bytes") and states that it "is preferred over bits per character or perplexity when using Pile as a metric due to its invariance to different tokenization schemes and the ambiguity of measuring characters in Unicode".

> **Assumption.** The tokenizer is a deterministic, lossless encoding of the byte string · *sensitivity:* if it is lossy (normalisation, dropped bytes) the byte count and the coded string differ and BPB values are not comparable across tokenizers.

## Mechanism

**Why BPB is tokenizer-independent and perplexity is not.** Let s be a byte string and t(s) its canonical tokenisation. The model's total code length for s is −log₂ q(t(s)) bits, and it is a property of the model's induced distribution over byte strings (up to the mass q assigns to non-canonical tokenisations of the same bytes, which only makes −log₂ q(t(s)) an upper bound on the true byte-level code length). Dividing by L_B, a quantity that depends only on s, yields a number comparable across models with any tokenizer. Perplexity instead divides by L_T, which is a property of the tokenizer: a tokenizer with larger vocabulary produces fewer tokens for the same bytes, so ℓ per token rises or falls with L_T/L_B independently of how well the bytes are predicted, and exp(ℓ) is not comparable across tokenizers [MATHEMATICALLY-DERIVED · DERIVED:eq-2.13]. The concrete failure — two reported perplexities that cannot be compared — is the verification task of Chapter 04 ([§04.6](../ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md)).

```figure
id: fig-2.16
kind: diagram
title: Where the tokenizer enters bits per byte and perplexity
caption: >-
  Follow the emphasised path: the byte count L_B is read from the string
  before any tokenizer runs, so the BPB denominator cannot move when the
  vocabulary does. Everything inside the boundary depends on the tokenizer:
  L_T, the per-token mean ℓ, and perplexity. The numerator, total code
  length, is a property of the model's distribution over byte strings, up
  to the mass on non-canonical tokenisations, which only makes reported BPB
  an upper bound.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.13", "DERIVED:eq-2.12", P03]
alt: >-
  Left-to-right diagram of Algorithm 2.3. A UTF-8 byte string s feeds two
  paths. The emphasised path goes straight to the byte count L_B, which
  depends on s alone, and from there to BPB. The other path enters a
  boundary labelled tokenizer-dependent: the lossless tokenizer produces
  token ids of length L_T; the model q scores them to give the total code
  length −log₂ q(t(s)) in bits, which also feeds BPB as its numerator; the
  token count L_T divides the total NLL to give the per-token loss ℓ in
  nats, and ℓ gives perplexity exp(ℓ). A dependency node, mass on
  non-canonical tokenisations, points at the code length and marks BPB as
  an upper bound on the byte-level code length.
spec:
  direction: LR
  nodes:
    - { id: s, kind: dataset, label: "byte string s", sub: "UTF-8, raw" }
    - { id: lb, kind: metric, label: "byte count L_B", sub: "depends on s only" }
    - { id: tok, kind: process, label: "tokenizer t(s), lossless", sub: "vocabulary size sets L_T", group: tz }
    - { id: ids, kind: tensor, label: "token ids", sub: "[L_T]", group: tz }
    - { id: q, kind: model, label: "model q, windows and stride", sub: "Algorithm 2.3 lines 5–8" }
    - { id: code, kind: metric, label: "total code length", sub: "−log₂ q(t(s)) bits" }
    - { id: lt, kind: metric, label: "token count L_T", sub: "a property of the tokenizer", group: tz }
    - { id: ell, kind: metric, label: "per-token loss ℓ", sub: "NLL_total / L_T, nats", group: tz }
    - { id: ppl, kind: metric, label: "perplexity exp(ℓ)", sub: "not comparable across tokenizers", group: tz }
    - { id: bpb, kind: objective, label: "bits per byte", sub: "code length / L_B, Eq. 2.13", emphasis: true }
    - { id: nc, kind: dependency, label: "mass on non-canonical tokenisations", sub: "BPB is an upper bound" }
  edges:
    - { from: s, to: lb, kind: emphasis, label: "count bytes" }
    - { from: lb, to: bpb, kind: emphasis, label: "denominator" }
    - { from: s, to: tok }
    - { from: tok, to: ids }
    - { from: tok, to: lt, kind: dependency }
    - { from: ids, to: q }
    - { from: q, to: code }
    - { from: code, to: bpb, label: "numerator" }
    - { from: code, to: ell }
    - { from: lt, to: ell, kind: dependency, label: "divides" }
    - { from: ell, to: ppl }
    - { from: nc, to: code, kind: dependency }
  groups:
    - { id: tz, label: "tokenizer-dependent" }
```

<details><summary>Derivation of Eq. 2.10 (Gibbs' inequality)</summary>

With log x ≤ x − 1 for x > 0: −KL(p‖q) = Σ p log(q/p) ≤ Σ p (q/p − 1) = Σ q − Σ p ≤ 0, so KL ≥ 0. Equality in log x ≤ x − 1 requires x = 1, i.e. q = p wherever p > 0. Expanding H(p,q) = −Σ p log q = −Σ p log p + Σ p log(p/q) = H(p) + KL(p‖q).

</details>

**Likelihood as cross-entropy.** The token-mean loss of Eq. N.2 is an unbiased estimate of H(p_data, p_θ) per token when the data are sampled from p_data; minimising it minimises KL(p_data ‖ p_θ) since H(p_data) is fixed. This is the *forward* KL: it penalises q for assigning low mass where p has mass (mode-covering). The *reverse* KL, KL(q‖p), is what RL and DPO regularise with (Eq. N.6, [§33.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch33-direct-preference-optimization-and-related-objectives/33-1-dpo-derivation.md)) and it is mode-seeking: q is penalised for placing mass where p has none, never for missing p's modes [MATHEMATICALLY-DERIVED · DERIVED:eq-2.10].

**Sampled KL estimators.** KL(π_θ‖π_ref) per token over V is exact at O(V) cost when both distributions are available; RL trainers instead use a single sample o ∼ π_θ. With r = π_ref(o)/π_θ(o): (i) k₁ = −log r is unbiased but can be negative; (ii) k₃ = r − log r − 1 is unbiased (because E_{π_θ}[r] = 1 and E[−log r] = KL) and non-negative for every sample (because x − log x − 1 ≥ 0) [MATHEMATICALLY-DERIVED]. P25 uses k₃ as its Eq. 4 and describes it as unbiased and guaranteed positive [PAPER-REPORTED · P25]; being non-negative per sample lowers variance relative to k₁ but does not change the expectation. Cost: two log-probability evaluations per token (policy and reference forward passes) instead of a full-vocabulary sum — the same two passes the importance ratio of §02.2 already requires.

```figure
id: fig-2.17
kind: chart
title: Per-sample KL estimators k₁ and k₃ against the ratio r
caption: >-
  One sample o ∼ π_θ and r = π_ref(o)/π_θ(o). Both estimators have the same
  expectation, KL(π_θ‖π_ref), because E[r] = 1; they differ sample by sample.
  k₁ = −log r goes negative whenever the reference likes the sample more
  than the policy does (r > 1). k₃ = r − log r − 1 adds the zero-mean term
  r − 1 and is never negative, touching zero only at r = 1, where it is
  second order in r − 1 while k₁ is first order. This is the estimator P25
  describes as unbiased and guaranteed positive (its Eq. 4).
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.10", P25]
alt: >-
  Line chart of two per-sample KL estimates in nats against the ratio
  r = π_ref(o)/π_θ(o) on a log axis from 0.05 to 10. k₁ = −log r falls from
  3.00 at r = 0.05 through 0.69 at r = 0.5 and zero at r = 1 to −0.69 at
  r = 2 and −2.30 at r = 10. k₃ = r − log r − 1 is 2.05 at r = 0.05, 0.19 at
  r = 0.5, zero at r = 1, 0.31 at r = 2 and 6.70 at r = 10, never negative.
spec:
  type: line
  x: { label: "ratio r = π_ref(o)/π_θ(o)", scale: log10, format: raw, domain: [0.05, 10] }
  y: { label: "per-sample estimate, nats", scale: linear, format: fixed2 }
  series:
    - { id: k1, label: "k₁ = −log r, can be negative", formula: "-ln(x)", sample: { from: 0.05, to: 10, count: 41 } }
    - { id: k3, label: "k₃ = r − log r − 1, never negative", formula: "x - ln(x) - 1", sample: { from: 0.05, to: 10, count: 41 }, emphasis: true }
  annotations:
    - { x: 1, label: "r = 1: k₁ = k₃ = 0" }
    - { x: 2, label: "r = 2: k₁ = −0.69, k₃ = 0.31" }
    - { x: 0.5, label: "r = 0.5: k₁ = 0.69, k₃ = 0.19" }
```

**Mutual information as a budget.** For an encoder–decoder or retrieval interface, I(X;Z) bounds how much of X the representation Z can carry; a representation of z bits cannot carry more than z bits of information about X (H(Z) ≥ I(X;Z)). This is the accounting used for compressed caches ([Chapter 42](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md)) and for the impossibility of recovering dropped information downstream [MATHEMATICALLY-DERIVED · DERIVED:eq-2.11].

## Algorithm

```text
Algorithm 2.3 — Bits per byte over a document set
INPUT   documents s_1..s_n (byte strings); tokenizer tok (lossless); model q; context length T_max; stride
OUTPUT  BPB, token-mean loss ℓ (nats), L_T, L_B
STATE   NLL_total (nats), L_T, L_B
INVARIANT every scored token is counted exactly once in L_T; every byte of every document exactly once in L_B
1  NLL_total, L_T, L_B ← 0
2  for each document s_i:
3      L_B += len_bytes_utf8(s_i)
4      ids ← [BOS] + tok(s_i)                        # BOS is conditioned on, never scored
5      for each window (start, end) covering ids[1:] with the stated stride:
6          logits ← q(ids[start−ctx : end])           # forward pass; cost per §02.4
7          NLL_total += Σ_{t in scored range} −log q(ids[t] | ids[<t])   # LSE form, §03.2
8          L_T += number of scored tokens in window
9  ℓ ← NLL_total / L_T
10 BPB ← (L_T / L_B) · ℓ / ln 2
11 return BPB, ℓ, L_T, L_B
```

Complexity: one forward pass per window, O(L_T · cost per token); with stride < context, tokens are recomputed and the ratio of forward tokens to scored tokens must be reported. Termination: after the last document. Whether document boundaries are scored, whether documents are concatenated, and whether the BOS token is scored change ℓ and must be stated; they do not change L_B.

## Implementation

```text
Tensor trace
[B, T, D] hidden → lm_head [D, V] → [B, T, V] logits → log_softmax over V → gather(target) → [B, T] token NLL → mask m_t → Σ / Σ m_t → ℓ
```

The [B, T, V] logits tensor costs B·T·V·b bytes and is typically the largest single activation in a language model; for the loss only the gathered target log-probability and the log-sum-exp per position are needed, which is what fused linear–cross-entropy kernels exploit. Liger Kernel documents a `LigerFusedLinearCrossEntropyLoss` that performs "chunk-by-chunk computation to reduce memory" (README, accessed 2026-09-20; the exact chunking policy and release behaviour are UNVERIFIED here) [OFFICIAL-DOCUMENTATION · R2.9]. Full-vocabulary KL for distillation (Eq. N.7) needs the teacher's V logits per token transferred or recomputed; the bytes are V·b per token per layer of teacher output, and [§39.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/39-2-information-access.md) develops the top-k and sampled alternatives.

## Experimental design

Proposal (developed as the Chapter 04 verification): score one held-out byte corpus with two tokenizers of different vocabulary size using the same model family and training data; report ℓ, PPL, L_T/L_B, and BPB. Prediction: PPL differs by roughly the ratio of L_T/L_B raised to a power that has nothing to do with model quality, while BPB differences reflect fit. Controlled: context length, stride, boundary handling, UTF-8 normalisation. Not run in this edition.

## Observations

**What the paper claims.** P03 reports BPB as its evaluation metric for the stated reason of tokenizer invariance [PAPER-REPORTED · P03]. P25 reports the k₃ KL estimator as unbiased and positive [PAPER-REPORTED · P25].

**What the evidence shows.** Both claims are consequences of definitions (Eq. 2.13; E[r] = 1) and hold regardless of any experiment [MATHEMATICALLY-DERIVED].

**What we infer.** The book infers (DERIVED) that the non-canonical-tokenisation mass makes reported BPB an upper bound on the model's true byte-level code length; the size of the gap is ASSUMED small for standard tokenizers and is not measured.

**What remains unknown.** Whether vendor-reported perplexities are token-mean or sequence-mean, and over which stride and boundary convention, is typically NOT-DISCLOSED, which is why Chapter 04 treats undocumented perplexities as incomparable.

## Failure modes

> **Failure mode — base and unit confusion.** *Symptom:* a "loss" of 1.0 reported as 1 bit when it was 1 nat (1.44 bits). *Cause:* natural logs in frameworks, base-2 in reports. *Detection:* recompute one value by hand. *Mitigation:* state the unit next to every number.

> **Failure mode — denominator drift.** *Symptom:* BPB improves after a tokenizer change with no model change. *Cause:* L_B computed after lossy normalisation, or BOS/boundary tokens scored inconsistently. *Detection:* L_B must be identical across tokenizers for the same corpus. *Mitigation:* compute L_B from raw UTF-8 bytes once and store it with the corpus manifest ([§06.6](../ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md)).

> **Failure mode — KL with disjoint support.** *Symptom:* infinite or NaN KL. *Cause:* q(x) = 0 where p(x) > 0 (e.g. after truncation or in FP16 underflow). *Detection:* check min log-probabilities. *Mitigation:* compute in log-space with the LSE form of §03.2; never truncate the reference distribution.

## Siblings

**Cross-entropy / forward KL (maximum likelihood)** — this file, Eq. 2.10. Why it exists: unbiased, mode-covering, samples from data only. New failure mode: mass on data-absent regions is not penalised.

**Reverse KL (policy regularisation)** — [§33.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch33-direct-preference-optimization-and-related-objectives/33-1-dpo-derivation.md) and [§34.2](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch34-policy-gradients-ppo-and-rlhf/34-2-policy-gradients.md). Why it exists: keep a policy near a reference while sampling from the policy. What assumption changed: samples come from q, not p. What objective changed: KL direction. What problem it solved: tractable regularisation from policy samples. New failure mode: mode collapse.

**Temperature-scaled KL (distillation)** — [§39.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/39-2-information-access.md), Eq. N.7. Why it exists: transfer the teacher's full distribution. Changed primitive: one-hot target → soft target. New failure mode: teacher-logit access and bandwidth.

**Perplexity** — [§04.6](../ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md). Why it exists: per-token interpretability. What assumption changed: a fixed tokenizer. New failure mode: incomparability across tokenizers. Changed primitive: byte denominator → token denominator.

```figure
id: fig-2.18
kind: compare
title: Four likelihood objectives and reports, by sampling source and price
caption: >-
  Read the "samples drawn from" row first: it decides everything below it.
  Forward KL can be estimated from data alone, reverse KL only from the
  policy's own samples, and distillation needs the teacher's whole
  distribution at every position, which is a bandwidth bill rather than a
  FLOP bill. Perplexity is not an objective at all but a report, and it is
  the only column whose value depends on the tokenizer.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.10", "DERIVED:eq-2.13", P25]
alt: >-
  Comparison of four columns. Cross-entropy or forward KL, maximum
  likelihood (§02.3): samples from the data; estimates H(p_data, p_θ), which
  is H(p_data) plus KL(p_data‖p_θ); penalises low model mass where the data
  has mass, mode-covering; costs one log-softmax and gather over V per token;
  fails to penalise mass on data-absent regions. Reverse KL, policy
  regularisation (§33.1): samples from the policy; penalises policy mass
  where the reference has none, mode-seeking; exact at O(V) per token or two
  log-probability evaluations with the k₃ estimator; failure mode mode
  collapse. Temperature-scaled KL, distillation (§39.2): the teacher's full
  distribution; soft instead of one-hot targets; V·b bytes of teacher output
  per token; failure mode teacher-logit access and bandwidth. Perplexity
  (§04.6): exp of the per-token loss; a report, not an objective; token
  instead of byte denominator; incomparable across tokenizers.
spec:
  axis: >-
    Which distribution supplies the samples, which mismatch is penalised, and
    what one token costs to evaluate; fit quality is not ranked
  columns:
    - { id: fwd, label: "Cross-entropy / forward KL", node: ms.section.2.3 }
    - { id: rev, label: "Reverse KL, policy regularisation", node: ms.section.33.1 }
    - { id: dist, label: "Temperature-scaled KL, distillation", node: ms.section.39.2 }
    - { id: ppl, label: "Perplexity", node: ms.section.4.6 }
  rows:
    - { dimension: "samples drawn from", values: { fwd: "the data, p_data", rev: "the policy, π_θ", dist: "the teacher's full distribution at each position", ppl: "the data, through one tokenizer" } }
    - { dimension: "quantity", values: { fwd: "H(p_data, p_θ) = H(p_data) + KL(p_data‖p_θ)", rev: "KL(π_θ‖π_ref)", dist: "KL between softened teacher and student (Eq. N.7)", ppl: "exp(ℓ), ℓ per token" } }
    - { dimension: "penalises", values: { fwd: "low q where p has mass: mode-covering", rev: "q mass where p has none: mode-seeking", dist: "mismatch across all V outcomes", ppl: "nothing: a report of fit, not an objective" } }
    - { dimension: "cost per token", values: { fwd: "one log-softmax and gather over V", rev: "O(V) exact, or two log-probability evaluations with k₃", dist: "teacher's V logits: V·b bytes transferred or recomputed", ppl: "as forward, then exponentiated" } }
    - { dimension: "changed primitive", values: { fwd: "reference column", rev: "samples from q instead of p", dist: "one-hot target → soft target", ppl: "byte denominator → token denominator" } }
    - { dimension: "new failure mode", values: { fwd: "mass on data-absent regions is not penalised", rev: "mode collapse", dist: "teacher-logit access and bandwidth", ppl: "incomparable across tokenizers" } }
```

## Extensions

For multimodal inputs the byte count of an image or audio segment is not a natural denominator, and fit is reported per modality-specific unit (patch, frame, sample) with the same caveats ([Chapter 55](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/README.md)). For long context the window and stride in Algorithm 2.3 dominate the result. For agents the likelihood of a tool trajectory mixes model tokens with environment tokens, and only the former are scored (m_t in Eq. N.2). These are cross-references, not proposals.

## Limitations

Eq. 2.13 assumes UTF-8 byte counts of raw text; a different encoding changes L_B. BPB measures fit, not capability; the relation between likelihood and downstream capability is the subject of [§04.6](../ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md) and is not assumed here. Falsification: two models with identical byte-level distributions but different tokenizers reporting different BPB on the same corpus would indicate a lossy tokenizer or a scoring-convention difference, not a failure of the identity.

## Reproducibility

Symbols: H, KL, I, ℓ, L_T, L_B, BPB, PPL, r, k₁, k₃ (local); p_θ, π_θ, π_ref, m_t from notation.md. Every reported ℓ must state: unit, denominator, tokenizer name and version, context length, stride, boundary and BOS handling, and the UTF-8 byte count of the corpus. No measurement was made.

## References

P03 (bits-per-byte definition and rationale), P25 (k₃ KL estimator), R2.9 (Liger Kernel README). See [references.md](references.md).
