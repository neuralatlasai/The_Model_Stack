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
word_count_target: 2600
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 02.3 Information theory

## Scope

For a probability law p, entropy quantifies expected self-information; cross-entropy evaluates a second law q on p-distributed events; KL divergence measures their expected log-likelihood ratio. These quantities become different language-model reports when their events are tokens, terminated sequences, or decoded byte strings. Their units and denominators are part of the mathematical object, rather than a presentation choice. A token-level improvement, a byte-normalized improvement, and a downstream task improvement consequently require distinct evidence.

This section derives the discrete identities, their support and finiteness conditions, conditional and mutual information, likelihood-based predictive risk, ideal coding bounds, canonical-token versus marginal-byte likelihood, and sampled KL estimation. It then examines the Pile's likelihood protocol and DeepSeekMath's KL-regularized procedure as source-specific applications. Continuous differential entropy and practical arithmetic-coder implementations require additional measure and precision contracts and are not identified with the discrete results below [PAPER-REPORTED · R2.1, Part I §§6–9; P03, §3; P25, §4].

## Why this exists

A next-token model specifies conditional probabilities, but an evaluation report may average negative log probabilities over tokens, documents, bytes, or selected response positions. Those averages assign different weights to the underlying data. In addition, the same byte string may have several token paths, so the probability of its canonical tokenization need not equal the total probability of decoding to that string. A common byte denominator resolves the event-count problem without resolving either probability-model or context-policy differences.

A sampled log-ratio introduces another distinction: estimating a divergence value and differentiating that value are separate tasks when the sampling law depends on the trained parameters. Nonnegative samples also do not imply lower variance. These distinctions determine which claims can be obtained from an identity, which require a source protocol, and which need an independently executed comparison [MATHEMATICALLY-DERIVED · DERIVED:eq-2.10; DERIVED:eq-2.13; DERIVED:eq-2.18].

## Intuition

The elementary object is the surprisal −log q(x) of a specified event x. Averaging it under p yields cross-entropy. Replacing q by p gives entropy; subtracting those averages gives KL when the subtraction is well-defined. Conditioning changes the probability law used for each event. In an autoregressive model, the total sequence surprisal is a sum of conditional token surprisals by the probability chain rule; independence of those tokens is unnecessary for that equality.

An ideal coding construction gives a second interpretation of the same logarithm. It assigns intervals with widths proportional to sequence probabilities and selects a binary subinterval to identify a terminated message. The resulting bound is about ideal message identification under an agreed model, not about the physical size of model weights or the runtime of a deployed compressor [MATHEMATICALLY-DERIVED · DERIVED:eq-2.12].

## Formulation

### Entropy, cross-entropy, and support

Let p and q be normalized probability mass functions on a finite or countable alphabet 𝒳. Use the convention 0 log 0=0. With natural logarithms,

$$
H(p)=-\sum_xp(x)\log p(x),\qquad
H(p,q)=-\sum_xp(x)\log q(x),\qquad
\mathrm{KL}(p\|q)=\sum_{x:p(x)>0}p(x)\log\frac{p(x)}{q(x)}.
$$

If p(x)>0 while q(x)=0, cross-entropy and KL are infinite. Absolute continuity p≪q excludes that support failure but does not ensure a finite divergence on a countably infinite alphabet. For a finite alphabet with q positive on p's support, every term is finite. Then

$$
H(p,q)=H(p)+\mathrm{KL}(p\|q),\qquad
\mathrm{KL}(p\|q)\ge0,
$$
*(Eq. 2.10)* with equality in the inequality exactly when p=q. On a countably infinite alphabet, the decomposition requires care when entropy or cross-entropy is infinite: subtracting ∞−∞ is undefined. A reported finite KL should therefore not be reconstructed by subtracting two divergent entropies. Base-2 logarithms give bits; natural logarithms give nats, with one nat equal to 1/ln2 bits [MATHEMATICALLY-DERIVED · DERIVED:eq-2.10].

For a direct proof, write S={x:p(x)>0}. Since log u≤u−1,
−KL(p‖q)=Σ_S p log(q/p)≤Σ_S(q−p)=q(S)−1≤0. Equality requires q/p=1 on S and no residual q mass outside S. Expanding −log q=−log p+log(p/q) gives the decomposition under the finiteness conditions above. This proof also identifies why zero reference probability cannot be repaired merely by averaging more samples.

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

### Conditional entropy and mutual information

For p(x,y), define p(x|y) only on y with p(y)>0; choices on null y do not affect the expectation. Conditional entropy is H(X|Y)=Σ_y p(y)H(p(·|y)). Expanding log p(x,y)=log p(y)+log p(x|y) gives the chain rule H(X,Y)=H(Y)+H(X|Y). Repeating it gives H(X₁,…,X_T)=Σ_t H(X_t|X_{<t}); no Markov assumption appears in this identity. A first-order Markov assumption changes the conditionals, rather than the chain rule itself [MATHEMATICALLY-DERIVED · DERIVED:eq-2.11; PAPER-REPORTED · R2.1, Part I §6, conditional-entropy discussion].

$$
I(X;Y)=\mathrm{KL}\big(p_{XY}\|p_Xp_Y\big)
=H(X)-H(X|Y)=H(X)+H(Y)-H(X,Y)\ge0.
$$
*(Eq. 2.11)* The KL definition remains primary when entropy differences are not finite. On finite alphabets these identities give symmetry, I(X;Y)=I(Y;X), the bound I(X;Y)≤min{H(X),H(Y)}, and independence if and only if I(X;Y)=0. Conditional mutual information is
I(X;Y|Z)=Σ_zp(z)KL[p_{XY|z}‖p_{X|z}p_{Y|z}]≥0. Consequently H(X|Y,Z)≤H(X|Y) after averaging. Conditioning does not guarantee H(X|Y=y)≤H(X) for every realized y: for example, if P(X=1)=.01 and a rare event Y=1 selects a subpopulation with P(X=1|Y=1)=.5, that event's conditional entropy is larger even though average conditional entropy cannot increase [MATHEMATICALLY-DERIVED · DERIVED:eq-2.11].

Additional conditioning can either raise or lower mutual information. For independent fair bits X,Y and Z=X XOR Y, I(X;Y)=0 but I(X;Y|Z)=1 bit. If instead Z=X=Y is a fair bit, I(X;Y)=1 bit while I(X;Y|Z)=0. Thus the inequality for conditional entropy must not be transferred to mutual information without its own conditions.

The chain rule I(X;Y,Z)=I(X;Z)+I(X;Y|Z) gives data processing. If X→Z→Y is a Markov chain, I(X;Y|Z)=0, so I(X;Z)=I(X;Y)+I(X;Z|Y)≥I(X;Y). This limits information recoverable by postprocessing under that chain; supplying new side information breaks the assumed graph. If a stored representation has at most 2^z discrete states, H(Z)≤z bits and I(X;Z)≤z. A z-dimensional real vector does not have this finite-state bound without quantization, noise, precision, or another capacity restriction. Differential entropy can be negative and changes under coordinate transformations; it cannot be substituted for discrete entropy in this capacity argument [MATHEMATICALLY-DERIVED · DERIVED:eq-2.11].

### Coding length and likelihood units

For a finite terminated token stream u with probability q(u)>0, its ideal surprisal in bits is −log₂q(u). An interval-code construction, specified below, yields

$$
-\log_2 q(u)\le\ell_{\rm code}(u)<-\log_2q(u)+2.
$$
*(Eq. 2.12)* If q(u)=∏_i q(s_i) for independently reset documents assembled into one coded stream, its negative log is the sum of document negative logs. The bound's two-bit overhead belongs to that single stream. Separately coding each document incurs a separate termination overhead. A model description, length framing, finite-precision coding, and any transmitted side information are outside this ideal bound [MATHEMATICALLY-DERIVED · DERIVED:eq-2.12; PAPER-REPORTED · R2.1, Part I §9, Theorem 9].

For an evaluation corpus, let S be total scored negative log probability in nats, L_T its scored-token count, and L_B>0 the byte count of the declared target text. Define ℓ=S/L_T when L_T>0. Then

$$
\mathrm{BPB}=\frac{S}{L_B\ln2}
=\frac{L_T}{L_B}\frac{\ell}{\ln2},\qquad
\mathrm{PPL}=\exp(\ell),\qquad
\mathrm{BPB}=\frac{L_T}{L_B}\log_2\mathrm{PPL}.
$$
*(Eq. 2.13)* This conversion is an accounting identity for the selected terms in S. A complete text-code interpretation additionally requires that those terms encode the declared target text under the agreed conditional/framing policy. Masking arbitrary text tokens while retaining all raw bytes can still produce a numerical ratio, but it no longer represents the complete code length of those bytes. Conditional completion BPB can instead score a response while treating the prompt as known side information and counting only response bytes; that is a different estimand from unconditional corpus BPB [MATHEMATICALLY-DERIVED · DERIVED:eq-2.13].

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

## Mechanism

### Methodology

A likelihood comparison first fixes its event space, conditioning information, sampling population, and reduction. For a fixed fitted q_θ and independent held-out documents S_i∼p_data, n⁻¹Σ_i−log q_θ(S_i) estimates sequence cross-entropy. Dependence among tokens inside a document does not change sequence factorization, but it affects uncertainty if those tokens are incorrectly treated as independent observations. If the model was selected on the same evaluation set, the held-out independence required for that straightforward interpretation no longer holds.

### Maximum likelihood and predictive risk

For a normalized model family {q_θ}, define predictive log risk R(θ)=E_{S∼p_data}[−log q_θ(S)]. When source entropy is finite, R(θ)=H(p_data)+KL(p_data‖q_θ). Minimizing population log risk therefore selects the forward-KL projection into the model family. It recovers p_data only if that law belongs to the family and the optimization reaches an appropriate optimum. The empirical maximum-likelihood estimate minimizes the observed negative log-likelihood; it does not minimize an unobserved population risk by algebra alone. Finite data, model selection, distribution shift, and imperfect optimization separate the two [MATHEMATICALLY-DERIVED · DERIVED:eq-2.10].

For conditional prediction with context C and target X, risk is E_C H[p(·|C),q_θ(·|C)]. Expanding Eq. 2.10 separately for each context gives H(X|C)+E_C KL[p(·|C)‖q_θ(·|C)]. Thus observed-context weighting is part of the objective. For fixed-length sequences, dividing the document sum by the fixed length changes its scale but not its minimizer. For variable lengths, mean document loss, mean document-normalized loss, and pooled token loss weight documents differently. If document i has token count T_i and summed NLL S_i, the pooled statistic Σ_i S_i/Σ_i T_i targets E[S]/E[T] under iid document sampling and finite first moments. It is generally not an unbiased finite-n estimator of that ratio, nor equal to E[S/T]. Conditioning on a particular recorded corpus makes it a deterministic statistic [MATHEMATICALLY-DERIVED · DERIVED:eq-2.13].

Perplexity exponentiates the pooled token log loss. It is the inverse geometric mean probability assigned to scored events, not a count of semantically plausible continuations. Even if ℓ estimates a population quantity without bias in a fixed-length setting, exp(ℓ) is generally biased by convexity. Neither monotonicity of exp nor log-score propriety establishes a monotonic relationship to a separate task-success metric. Those require the specified evaluation distribution and capability protocol in [§04.6](../ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md).

### Coding construction and token-to-byte probability

Sequential interval subdivision associates a terminated message of probability q(u) with an interval of width q(u) in [0,1). For h=ceil[−log₂q(u)]+1, a binary cell of width 2⁻ʰ≤q(u)/2 fits inside any such interval: choose the first grid boundary at or after its left endpoint, leaving a full cell within the interval. Identifying that contained cell requires h bits, and containment identifies the intended message when the terminated-message intervals are disjoint. Since h<−log₂q(u)+2 and a contained cell cannot be wider than its parent, Eq. 2.12 follows. Finite precision and termination rules of an actual coder require separate analysis.

The entropy lower bound is an expected-length statement. For a prefix code with lengths h_j, Kraft's inequality gives K=Σ_j2⁻ʰʲ≤1. Put r_j=2⁻ʰʲ/K. Then Σ_jp_jh_j=H₂(p)+KL₂(p‖r)−log₂K≥H₂(p). This does not require each realized message to be longer than its own source surprisal; it bounds the average under p. Shannon's noiseless-coding result supplies the source foundation, while these interval and Kraft arguments explicitly reconstruct the conditions [MATHEMATICALLY-DERIVED · DERIVED:eq-2.10; DERIVED:eq-2.12; PAPER-REPORTED · R2.1, Theorem 9].

Let a deterministic tokenizer t and decoder d satisfy d(t(s))=s for the declared byte string s. This guarantees a canonical lossless path but need not make that path unique. With normalized probabilities on terminated token sequences,
q_bytes(s)=Σ_{u:d(u)=s}q_tokens(u). Canonical-path probability is one term, so −log₂q_tokens(t(s))≥−log₂q_bytes(s). The excess is log₂[q_bytes(s)/q_tokens(t(s))], whose size is unknown from losslessness alone. If q_tokens(t(s))=.2 and another path decoding to s has mass .3, the canonical and marginal surprisals are −log₂(.2) and −log₂(.5), separated by log₂2.5 bits. This is an exact hypothetical distribution, not a measured tokenizer result [MATHEMATICALLY-DERIVED · DERIVED:eq-2.13].

Equality with marginal byte likelihood requires either uniqueness of positive-probability token paths or explicit marginalization. It also requires a consistent termination policy: a prefix likelihood without an EOS term is not automatically the probability of a terminated byte string. A fixed-length or externally framed conditional score remains valid under its own contract, but must not silently be read as a normalized distribution over all terminated documents.

A shared raw UTF-8 byte count removes dependence of the denominator on token segmentation. It does not make BPB invariant to q, to the canonical-path gap, to lossy Unicode normalization, or to which preceding tokens are available. Comparability requires the same declared text, counted bytes, conditioning/reset policy, target coverage, and framing interpretation. Different vocabularies can then be compared by the resulting code-rate report; no theorem makes their numerical BPB equal. The Pile's term “invariance” concerns its metric choice across tokenization schemes, not independence of model predictions from tokenization [PAPER-REPORTED · P03, §3.1; MATHEMATICALLY-DERIVED · DERIVED:eq-2.13].

```figure
id: fig-2.16
kind: diagram
title: Where the tokenizer enters bits per byte and perplexity
caption: >-
  Follow the emphasised path: the byte count L_B is read from the string
  before any tokenizer runs, so the BPB denominator cannot move when the
  vocabulary does. Everything inside the boundary depends on the tokenizer:
  L_T, the per-token mean ℓ, and perplexity. The numerator is the canonical token-path surprisal under the declared
  framing. For normalized terminated token sequences it upper-bounds the
  marginal byte-string surprisal; losslessness alone does not fix the gap.
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
    - { id: tok, kind: process, label: "tokenizer t(s), lossless", sub: "tokenization determines L_T", group: tz }
    - { id: ids, kind: tensor, label: "token ids", sub: "[L_T]", group: tz }
    - { id: q, kind: model, label: "model q, windows and stride", sub: "Algorithm 2.3 lines 5–8" }
    - { id: code, kind: metric, label: "total code length", sub: "−log₂ q(t(s)) bits" }
    - { id: lt, kind: metric, label: "token count L_T", sub: "a property of the tokenizer", group: tz }
    - { id: ell, kind: metric, label: "per-token loss ℓ", sub: "NLL_total / L_T, nats", group: tz }
    - { id: ppl, kind: metric, label: "perplexity exp(ℓ)", sub: "not comparable across tokenizers", group: tz }
    - { id: bpb, kind: objective, label: "bits per byte", sub: "code length / L_B, Eq. 2.13", emphasis: true }
    - { id: nc, kind: dependency, label: "mass on non-canonical tokenisations", sub: "canonical rate ≥ marginal rate, with framing" }
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

### KL support, estimation, and differentiation

At a fixed context, let a∼q and r=p(a)/q(a). The sampled log-ratio k₁=−log r estimates KL(q‖p) when the expectation exists. It can be negative on samples where p(a)>q(a). The nonnegative expression k₃=r−log r−1 satisfies k₃≥0 because log r≤r−1. Its expectation equals KL(q‖p) only when E_qr=1, requiring p to assign no mass outside q's support. Finite KL additionally needs p>0 wherever q>0, along with the appropriate integrability. On a finite full-support softmax alphabet these conditions hold; truncation can break them. If p has mass outside q's support, E_qr=p[supp(q)]<1 and k₃ has an additional negative expectation offset [MATHEMATICALLY-DERIVED · DERIVED:eq-2.10; PAPER-REPORTED · P25, §4.1, Eq. (4)].

The term r−1 is a zero-mean control variate under that support condition. Consequently Var(k₃)=Var(k₁)+Var(r−1)+2Cov(k₁,r−1), when these moments exist. Nonnegativity alone does not determine the sign of the variance change. On countably infinite alphabets k₃ can have infinite variance when E_qr² is infinite even if KL is finite. For a finite alphabet its variance can still be large when q is tiny on outcomes carrying substantial p mass. Exact KL needs O(V) arithmetic after both vectors exist; one sampled ratio needs O(1) post-gather arithmetic, but still needs model normalization and the required policy/reference evaluations.

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

For parameter-dependent q_θ and h_θ, differentiation gives
∇_θE_{q_θ}h_θ=E_{q_θ}[∇_θh_θ+h_θ∇_θlog q_θ], under the interchange conditions in §02.4. With h_θ=log q_θ−log p and fixed p, the explicit-derivative expectation vanishes, leaving the score-weighted log-ratio contribution. Holding sampled outputs fixed and differentiating k₃ omits a sampling-law term unless the optimization procedure supplies the relevant correction. A value estimator's unbiasedness therefore does not by itself establish an unbiased stochastic gradient.

DeepSeekMath samples groups from π_old in Eq. (3), uses a clipped policy-ratio objective, and puts the Eq. (4) KL term directly in the loss rather than inside its group-relative advantage. Its stored-output distribution and objective must be analyzed together. Replacing π_θ samples by π_old samples changes the expectation unless a justified weighting or approximation is specified; Eq. (4) alone is not a proof of equivalence between off-policy surrogate and on-policy divergence gradients [PAPER-REPORTED · P25, §4.1, Eqs. (3)–(4); MATHEMATICALLY-DERIVED · DERIVED:eq-2.18].

## Algorithm

```text
Algorithm 2.3 — Byte-normalized log score under an explicit context policy
INPUT   byte documents s_i; lossless tokenizer tok; model q; context limit T_max;
        target-window partition and context policy; BOS/EOS and reset policy
OUTPUT  BPB, token mean ell, scored count L_T, raw byte count L_B, scoring manifest
STATE   NLL_total = 0; L_T = 0; L_B = 0
INVARIANT target token positions are scored once; context-only positions are unscored;
          each declared target byte is counted once; loss and denominator refer to that target
1  reject an empty target corpus or invalid target/context partition
2  for each document s_i:
3      verify decode(tok(s_i)) = s_i; L_B += length of declared target bytes
4      form ids and target positions under the recorded BOS/EOS policy
5      for each disjoint target block [a,b):
6          choose legal preceding context C_t using the fixed context policy
7          evaluate log q(ids[t] | C_t) for t in [a,b), using stable log-softmax
8          NLL_total += sum of negative target log probabilities
9          L_T += count of target positions
10 ell = NLL_total / L_T; BPB = NLL_total / (L_B * ln 2)
11 return BPB, ell, L_T, L_B, scoring manifest
```

Each target is scored once, but overlapping context can be recomputed. Report both scored positions and total model-input positions. The workload is the sum of forward-window costs, which depend on their lengths and the model; O(L_T) total cost is justified only after fixing the per-target context/work boundary. A block-reset policy and a sliding-window policy generally define different scores. The Pile's historical protocol below is one specific blockwise policy, not a hidden default of this algorithm. A prompt-conditioned response score must count response bytes and identify the prompt as uncharged side information. Arbitrary target masks cannot be combined with an unconditional full-document coding interpretation [MATHEMATICALLY-DERIVED · DERIVED:eq-2.13].

## Implementation

For hidden states [B,T,D], an output projection [D,V] produces logits [B,T,V]. Stable log-softmax followed by target gather gives [B,T] target log probabilities; a recorded mask selects scored positions. The sum of their negative log probabilities and the sum of mask entries are separate accumulators. A per-document mean must not be averaged again to obtain a pooled token mean unless weighted by its scored-token count. A corpus BPB is likewise the total bit numerator divided by total bytes, not an unweighted average of document or component BPB values [MATHEMATICALLY-DERIVED · DERIVED:eq-2.13].

Materializing logits takes BTVb bytes for b bytes per value. Whether this is the largest activation depends on architecture, sequence length, attention storage, and fusion; it is not a universal property of language models. The Liger README documents chunked fused linear cross-entropy, but no inspected kernel or immutable commit establishes its allocation policy for a particular workload here [OFFICIAL-DOCUMENTATION · R2.9, low-level API example]. Full-distribution teacher KL requires V teacher probabilities per scored position or an equivalent computation. Top-k and sampled substitutes change the target/access contract and are developed in [§39.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/39-2-information-access.md).

Byte counts must be measured on the exact declared serialized text, with encoding, newline policy, normalization, separators, and empty-document handling fixed. Computing the denominator after a lossy transform changes the scored target. If preprocessing is intentionally lossy, the resulting score describes the processed text, not a lossless code for the original bytes. Log-space evaluation prevents avoidable exponential underflow but does not make a genuinely zero reference probability positive.

## Experimental design

### Reported experiments

The Pile holds out .1% each for validation and test, while warning that cross-split duplicates may remain. Its GPT-2/GPT-3 evaluation scores documents separately and subsamples one tenth of test documents for most components because of API cost; Ubuntu IRC, BookCorpus2, and PhilPapers are exceptions. Appendix E.2 partitions documents into model-length segments, with limits 1024 for GPT-2 and 2048 for GPT-3, scores each token once, and aggregates sums rather than averaging component perplexities [PAPER-REPORTED · P03, §§3.1–3.2; Appendix E.2].

Table 2 reports whole-Pile BPB 1.2253 for GPT-2 small, 1.0468 for GPT-2 xl, and .7177 for the historical GPT-3 davinci endpoint. GPT-2 and GPT-3 share a tokenizer in this protocol, so this is not an experiment isolating tokenizer choice. API endpoint parameter counts used in its scaling plot are explicitly assumed by the source; they are not verified architectural disclosures [PAPER-REPORTED · P03, Table 2; §3.2 footnote 10]. Hardware-normalized throughput and seed-level uncertainty are NOT-DISCLOSED for this comparison.

DeepSeekMath applies RL to its 7B instruction model using approximately 144K GSM8K/MATH-related questions. It reports policy learning rate 10⁻⁶, KL coefficient .04, 64 outputs per question, length limit 1024, batch size 1024, and one update per exploration stage. The no-tool MATH score changes from 46.8% for Instruct to 51.7% for RL in Table 5 [PAPER-REPORTED · P25, §4.2; Table 5]. Group normalization, reward modeling, data selection, and KL regularization are part of that procedure together. No k₁-versus-k₃-only ablation isolates the KL estimator's contribution. These results therefore support a source-specific training comparison, not a general claim that nonnegative estimators improve capability.

Entropy, the chain rule, Gibbs' inequality, and the ideal coding bounds are mathematical statements, so their training dataset and benchmark fields are N/A. Proposed book checks are recorded in [verification.md](verification.md); no new likelihood, estimator-variance, or capability measurement is reported here.

## Observations

Equation 2.10 separates irreducible source uncertainty from model mismatch for a fixed event distribution. Changing context, target masks, or document weights changes that distribution or its risk functional. Equation 2.13 converts units for a recorded score, but it cannot recover information missing from the scoring manifest. The Pile comparison illustrates a reported byte-normalized protocol; it does not establish one universally correct context policy.

For a deterministic tokenizer, losslessness establishes recovery of the input bytes. It does not establish unique token paths, canonical-path/marginal equality, or negligible noncanonical mass. The gap is bounded in direction by the construction above, while its numerical size is NOT-DISCLOSED by the sources inspected. Two models with identical marginal byte distributions can therefore have different canonical-path BPB if their token-path allocations differ. Such a difference need not indicate an implementation error [MATHEMATICALLY-DERIVED · DERIVED:eq-2.13].

For sampled KL, nonnegativity is a pointwise property of r−log r−1; unbiasedness is an expectation property with support conditions; finite variance is a moment property; optimization correctness additionally concerns the sampling-law derivative. None substitutes for the others. DeepSeekMath's end-to-end score comparison does not isolate these statistical properties [MATHEMATICALLY-DERIVED · DERIVED:eq-2.10; DERIVED:eq-2.18; PAPER-REPORTED · P25, §§4.1–4.2].

## Failure modes

A base conversion error rescales a loss by ln2. A reduction error changes document weights. An inconsistent target-byte boundary changes BPB's estimand. These errors can be detected by reconstructing total nats, total scored tokens, and total target bytes from the same scoring manifest; recomputing only perplexity cannot distinguish them.

A support mismatch can produce infinite KL legitimately. Numerical underflow is a different failure, in which a representable log probability was converted to zero probability before taking the log. Stable log-space computation addresses the latter. Adding smoothing or truncating a reference changes the distribution and therefore the divergence; it is not an exact repair of the former.

A pathwise/autograd derivative through stored KL samples can disagree with the desired on-policy gradient even when each sampled value has the right on-policy expectation. The sampling distribution, detached quantities, policy-ratio weights, clipping, and explicit integrand derivative must all be included in the procedure specification. The derivative identity and score-function conditions are developed in [§02.4](02-4-differential-calculus.md).

## Siblings

Forward KL, reverse KL, temperature-scaled distillation, and perplexity share log-probability primitives but answer different questions. Forward-KL risk weights outcomes by the data law; reverse-KL regularization weights outcomes by the policy law. The terms “mode covering” and “mode seeking” describe behavior in restricted approximation families, not universal guarantees that one direction preserves all modes or that the other always collapses. Both are minimized at equality when the common target is representable. Full-distribution distillation replaces one observed target with a distribution over outcomes; sampling or truncation changes that information access. Perplexity is a monotone report of token log loss and inherits its tokenizer and reduction dependence [MATHEMATICALLY-DERIVED · DERIVED:eq-2.10; DERIVED:eq-2.13].

```figure
id: fig-2.18
kind: compare
title: Four likelihood objectives and reports, by sampling source and price
caption: >-
  Read the "samples drawn from" row first: it decides everything below it.
  Cross-entropy uses data samples; policy-sampled reverse KL is one
  estimable regularizer, though exact summation or importance sampling can
  use other access patterns. Full-distribution distillation requires all
  teacher probabilities and their computation or transfer. Perplexity
  exponentiates token-normalized cross-entropy; every token-space quantity
  here depends on the tokenizer and evaluation protocol.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.10", "DERIVED:eq-2.13", P25]
alt: >-
  Comparison of four columns. Cross-entropy or forward KL, maximum
  likelihood (§02.3): samples from the data; estimates H(p_data, p_θ), which
  is H(p_data) plus KL(p_data‖p_θ); penalises low model mass where the data
  has mass, mode-covering; costs one log-softmax and gather over V per token;
  has no direct summand on data-absent outcomes, although normalization couples their mass. Reverse KL, policy
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
    - { dimension: "new failure mode", values: { fwd: "no direct summand on unobserved outcomes; normalization still matters", rev: "mode collapse", dist: "teacher-logit access and bandwidth", ppl: "incomparable across tokenizers" } }
```

## Extensions

### Improvements

The Pile's byte denominator removes token-count variation from the reporting denominator while retaining a source-defined text and context protocol. Its methodological contribution is therefore a more explicit comparison boundary. DeepSeekMath's k₃ construction supplies nonnegative realizations of the reported KL value under the stated sampling/support assumptions; the paper does not isolate a general variance or capability advantage for that estimator. These are bounded improvements in measurement or procedure, not a ranking of current models [PAPER-REPORTED · P03, §3.1; P25, §4.1].

For a conditional interface, mutual information and data processing can analyze what a representation preserves only after the random variables and graph are specified. Retrieval can add side information absent from a compressed state, and an agent trajectory can include environment tokens that the policy did not generate. Scoring only policy tokens then defines a conditional policy likelihood, not the joint probability of the environment trajectory. Modality-specific targets also require their own event and denominator definitions; file byte counts for compressed images or audio are not automatically a meaningful common predictive unit.

## Limitations

The entropy-difference identities above assume finite discrete entropies where stated; a measure-theoretic KL treatment extends beyond this finite/countable exposition. The code bound is ideal and excludes model transmission, framing, and finite-precision coder behavior. Canonical BPB can differ from marginal byte likelihood, and likelihood can differ from task capability. Source omissions in runtime configuration, uncertainty, and estimator-isolating ablations prevent stronger empirical conclusions. No book experiment fills those gaps in this revision.

## Reproducibility

A reproducible score records the exact data revision and serialized target bytes; tokenizer/decoder revision; model/checkpoint or endpoint and access date; event space and termination policy; context length, window partition and stride; document resets; BOS/EOS and separators; target mask; log base and numerical dtype; total NLL, scored-token count and target-byte count; weighting and uncertainty unit. An estimator additionally records its sampling law, support modifications, ratio direction, detached terms, and any policy-ratio correction. The source ledger distinguishes inspected primary text from mutable documented interfaces and unexecuted verification.

## References

P03, §§3.1–3.2, Table 2 and Appendix E.2 (byte-normalized evaluation); P25, §4.1 Eqs. (3)–(4), §4.2 and Table 5 (sampled KL and reported RL protocol); R2.1, Part I §§6–9 and Theorem 9 (entropy and noiseless coding); R2.9, README low-level API example (documented fused-loss interface); R2.14, §2.1 (differentiating expectations). Revisions, dates, and limitations are recorded in [references.md](references.md).
