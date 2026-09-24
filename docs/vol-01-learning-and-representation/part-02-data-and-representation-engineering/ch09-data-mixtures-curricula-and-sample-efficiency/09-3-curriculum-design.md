---
id: ms.section.9.3
entity_type: section
title: Curriculum design
short_title: Curriculum design
volume: 1
part: 2
chapter: 9
section: 9.3
slug: 09-3-curriculum-design
parent: ms.chapter.9
prev_sibling: ms.section.9.2
next_sibling: ms.section.9.4
children: []
prerequisites: [ms.section.5.6, ms.section.6.3, ms.section.9.1, ms.section.9.2]
downstream: [ms.section.9.4, ms.section.9.5, ms.section.12.4, ms.section.20.3, ms.section.22.1, ms.section.22.2, ms.section.31.4]
related: [ms.section.20.5]
siblings_by_mechanism: [ms.section.9.1, ms.section.22.2]
relations:
  - {type: supported_by, target: paper.P07}
  - {type: supported_by, target: paper.P25}
  - {type: trades_off_with, target: ms.section.20.3}
axes:
  lifecycle: [pretraining, continued_training]
  mechanism: [curriculum, data_mixture, scheduling]
  feedback_setting: []
  modality: [text]
papers: [P07, P25]
implementations: [impl.mosaicml-llm-foundry]
benchmarks: []
datasets: [dolmino-mix-1124, dclm-baseline]
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2300
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# 9.3 Curriculum design

## Scope

Objective: make the mixture policy time-indexed and separate four ordering rules — difficulty (easy-to-hard, self-paced, competence-based), sequence length, domain, and the late-stage quality upsampling that open recipes report — from the learning-rate schedule they ride on. Baseline: a static mixture under the same schedule. Success criterion: the reader can write a phase table for Algorithm 9.1, state which FLOP accounting a length curriculum breaks, and design a comparison that attributes a late-stage gain to the data shift rather than to the decay. Boundaries: the learning-rate schedules themselves (cosine, WSD, linear-to-zero) are owned by [§20.3](../../part-04-training-science-and-adaptation/ch20-optimization-schedules-and-training-stability/20-3-scheduling.md); the definition of mid-training as a stage and the optimizer transitions across stages are owned by [§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md)–[§22.3](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-3-optimizer-transitions.md); packing of variable-length sequences is [§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md).

## Why this exists

What failed before was the assumption that order does not matter for a stochastic-gradient learner over a stationary mixture. PAPER-REPORTED (R9.16): Bengio et al. formalised a curriculum as a sequence of reweighted training distributions of increasing entropy and hypothesised that it acts as a continuation method for non-convex objectives; PAPER-REPORTED (R9.19): Li, Zhang and He found that long sequences early in GPT-2-scale pretraining drive extreme gradient variance and that warming up the sequence length allowed stable training at 8× the batch size and 4× the learning rate. The bottleneck that made order a first-order decision at scale, however, was scarcity rather than optimisation: the high-quality pools of [§9.2](09-2-quality-and-diversity.md) are small, and a static weight either wastes them by repetition or dilutes them. PAPER-REPORTED (R9.9): MiniCPM's WSD schedule uses "large-scale coarse-quality pre-training data" in the stable stage and mixes "diverse and high-quality knowledge and ability-oriented SFT data" into the decay stage; PAPER-REPORTED (R9.7): OLMo 2 trains a second stage on Dolmino Mix 1124 with the learning rate decayed linearly to zero; PAPER-REPORTED (R9.8): Llama 3 anneals on 40M final tokens with the learning rate linearly annealed to zero while upsampling "data sources of very high quality". The dominant constraint is the interaction between the time at which tokens are consumed and the learning rate at that time. What changed is that the terminal phase became the place where scarce data is spent, and short annealing runs became a measurement instrument for data quality — which also means that a reported late-stage gain is a joint effect of data and schedule until an experiment separates them.

```figure
id: fig-9.15
kind: stat-panel
title: Size of the terminal phase in reported recipes
caption: >-
  The recipes of this section on one ledger, tokens as reported and shares
  derived from them. The terminal phase spans almost five orders of magnitude
  of share, from 0.0003% of Llama 3 405B's run to 14% for Qwen3's S2, so
  "late-stage upsampling" is not one intervention. MiniCPM states no decay
  length: a 1.1T-token run over a stable stage of "around 1T" implies about
  9%, near the ≈10% the paper found sufficient; its 20B figure is the decay's
  half-life, not its length. Scroll: the recipes the Why paragraph names,
  their shares, the 405B exception, and the replay guard.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: [R9.7, R9.8, R9.9, P07, R9.21, R9.30]
alt: >-
  Instrument panel of terminal-phase sizes. OLMo 2 7B stage 2: 50B tokens per
  data order, three orders averaged, 1.2% of a 4.05T run per order. Llama 3 8B
  annealing probe: 40B tokens from a 50%-trained checkpoint, of which 12B are
  the candidate at 30%. Llama 3 405B final anneal: 40M tokens, 0.00026% of
  15.6T. MiniCPM 2.4B: a run listed at 1.1T tokens with a stable stage of
  around 1T, so a decay of about 100B tokens, 9.1% of the run, derived because
  the length is not stated; the exponential decay's half-life is 20B tokens.
  DCLM 7B: two cool-downs of 200B and 270B, souped. R9.21: the final 5–30% of
  a 1T-token 7B run, 10–20% best. Qwen3 S2: about 5T tokens, 13.9% of 36T.
spec:
  header: "TERMINAL PHASE · TOKENS AND SHARE OF RUN"
  variables: { olmo: 50.0e9, olmoS1: 4.0e12, l3Probe: 40.0e9, l3Final: 40.0e6, l3Tot: 15.6e12, mcTot: 1.1e12, mcStable: 1.0e12, qS2: 5.0e12, qTot: 36.0e12 }
  rows:
    - { key: "OLMo 2 7B stage 2, one order", formula: "olmo", format: tokens, note: "three orders, then averaged" }
    - { key: "OLMo 2 per-order share of run", formula: "olmo/(olmoS1 + olmo)", format: percent }
    - { key: "Llama 3 8B annealing probe", formula: "l3Probe", format: tokens, note: "from a 50%-trained checkpoint" }
    - { key: "candidate tokens in the probe", formula: "0.3*l3Probe", format: tokens, note: "30% candidate, 70% default mix" }
    - { key: "Llama 3 405B final anneal", formula: "l3Final", format: tokens }
    - { key: "Llama 3 405B share of 15.6T", formula: "l3Final/l3Tot", format: percent }
    - { key: "MiniCPM 2.4B decay stage", formula: "mcTot - mcStable", format: tokens, note: "DERIVED: 1.1T run − ≈1T stable; stated 20B is the half-life" }
    - { key: "MiniCPM decay share of run", formula: "(mcTot - mcStable)/mcTot", format: percent, note: "DERIVED; R9.9 found ≈10% suffices" }
    - { key: "DCLM 7B cool-downs, souped", value: "200B + 270B" }
    - { key: "R9.21 best upsampled tail, 7B", value: "100B–200B of 1T", note: "tested 5–30% of the run; 10–20% best" }
    - { key: "Qwen3 S2 reasoning stage", formula: "qS2", format: tokens }
    - { key: "Qwen3 S2 share of 36T", formula: "qS2/qTot", format: percent }
states:
  - { anchor: why-this-exists, label: "three recipes, three scales", highlight: ["OLMo 2 7B stage 2, one order", "Llama 3 405B final anneal", "MiniCPM 2.4B decay stage"], note: "The recipes the Why paragraph names differ by more than three orders of magnitude in terminal tokens: 40M for Llama 3 405B, about 100B implied for MiniCPM, three orders of 50B for OLMo 2 7B." }
  - { anchor: mechanism, label: "phase share of each run", highlight: ["OLMo 2 per-order share of run", "Llama 3 405B share of 15.6T", "MiniCPM decay share of run", "Qwen3 S2 share of 36T", "R9.21 best upsampled tail, 7B"], note: "As shares: 0.0003% for Llama 3 405B, 1.2% per OLMo 2 order, about 9% implied for MiniCPM, 13.9% for Qwen3 S2, against R9.21's 10–20% best. No two recipes use the same f." }
  - { anchor: observations, label: "the 405B exception", highlight: ["Llama 3 405B final anneal", "Llama 3 405B share of 15.6T"], note: "The largest run has the smallest terminal phase, and it is where Llama 3 calls the annealing gain negligible, against +24.0% GSM8K and +6.4% MATH at 8B." }
  - { anchor: failure-modes, label: "replay against over-specialisation", highlight: ["candidate tokens in the probe", "R9.21 best upsampled tail, 7B"], note: "Over-specialisation guard: the probe keeps 70% of the default mix as replay, and R9.21 reports the trade-off across 5–30% of the run with 10–20% best." }
```

## Intuition

Physically, a parameter update at step t is `−η(t)·g(t)` where g(t) is the batch gradient under the mixture at t; the total displacement attributable to domain i over a run is approximately `Σ_t η(t)·w_i(t)·ḡ_i(t)`, so the displacement a domain contributes scales with its learning-rate-weighted exposure, not its exposure. Under a decaying schedule, tokens consumed late move the parameters less per token but are not overwritten by later updates; tokens consumed early move them more and are then partially undone. That is the whole mechanism of late-stage upsampling: it places tokens where their effect persists — a persistence that the displacement sum, and Eq. 9.11 below, do not contain. It also means that a curriculum cannot be evaluated at equal tokens alone — the same tokens under a different η(t) are a different intervention. Heuristically, the easy-to-hard literature speaks of "shaping"; the physical content that survives scrutiny is the gradient-variance argument of R9.19 (long sequences early raise variance) and the continuation view of R9.16, which is a hypothesis about the loss landscape and has not been established for Transformer pretraining by intervention.

## Formulation

Let w(t) ∈ Δ^{k−1} be the domain weights at training position t (in tokens), η(t) the learning rate, and S the total tokens.

> **Definition — data curriculum.** A mixture policy whose weight vector depends on training position through a difficulty, competence, sequence-length or domain rule, `w(t) = π(t)`, as opposed to a static w.

> **Definition — late-stage quality upsampling.** A terminal schedule phase, of fraction f of the run, in which the weights of scarce high-quality pools are raised while the learning rate decays toward zero; the phase may coincide with a mid-training stage ([§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md)) or with the tail of a single schedule.

**Curriculum as reweighting (Bengio form).** With target distribution P over units z and weights 0 ≤ W_λ(z) ≤ 1, W_1(z) = 1:

$$
Q_\lambda(z) \propto W_\lambda(z)\,P(z), \qquad H(Q_\lambda) < H(Q_{\lambda+\epsilon}), \qquad W_{\lambda+\epsilon}(z) \ge W_\lambda(z)
$$
*(Eq. 9.8)* where λ ∈ [0, 1] indexes the curriculum, H is entropy, and the two conditions (increasing entropy, monotone weights) are the paper's definition of a curriculum. PAPER-REPORTED (R9.16, §3, Eq. 1–4).

**Competence-based gating.** With per-unit difficulty ϑ(z) ∈ [0, 1] (a CDF-normalised score) and a competence function c(t) ∈ (0, 1] rising to 1:

$$
w_z(t) \propto P(z)\,\mathbb{1}\big[\vartheta(z) \le c(t)\big], \qquad c(t) = \min\!\Big(1,\ \sqrt{t\,\tfrac{1 - c_0^2}{t_c} + c_0^2}\Big)
$$
*(Eq. 9.9)* where c_0 is the initial competence and t_c the position at which the full distribution is reached. PAPER-REPORTED (R9.18, abstract): the framework decides "which training samples are shown to the model at different times during training, based on the estimated difficulty of a sample and the current competence of the model" and reports up to a 70% decrease in NMT training time; the square-root form written here is the book's parametrisation and is ASSUMED — the paper's own family of competence functions was not re-read beyond the abstract for this edition. Self-paced learning (PAPER-REPORTED, R9.17) is the special case in which ϑ(z) is the learner's own current loss and c(t) is an annealed threshold.

**Sequence-length curriculum and the FLOP budget.** Per token, dense-Transformer training costs approximately

$$
C_{\text{token}}(T) \approx 6N + 6\,L\,T\,d_{\text{model}}
$$
*(Eq. 9.10)* where the second term is the attention-score contribution at full (non-causal-averaged) length, following the accounting of [§5.6](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md) and [notation.md](../../../front-matter/notation.md) §2.2; with causal masking exploited by the kernel the term halves. MATHEMATICALLY-DERIVED. Consequently a length curriculum at equal tokens is *not* at equal FLOPs: the ratio of the attention term to the weight term is `L·T·d_model/N`, which for a 7B-class model at T = 8K is of order 0.1–0.2 and at T = 128K exceeds 1. PAPER-REPORTED (R9.20): dataset decomposition — buckets of same-length sequences from single documents, sampled with a length curriculum — trains "an 8k context-length 1B model at the same cost as a 2k context-length model trained with the baseline approach" and reaches target accuracy up to 6× faster.

```figure
id: fig-9.16
kind: chart
title: Attention-to-weight FLOP ratio against sequence length
caption: >-
  The ratio of Eq. 9.10's two terms, L·T·d_model/N. With the non-embedding
  approximation N ≈ 12·L·d_model² it reduces to T/(12·d_model), independent of
  depth, so each width has one crossing, at T = 12·d_model: 24K tokens for
  d = 2048, 48K for 4096, 96K for 8192. An illustrative 7B-class
  configuration (L = 32, d = 4096, N = 7·10⁹; not a named model) gives 0.15 at
  8K and 2.45 at 128K, the section's "0.1–0.2" and "exceeds 1"; the
  approximation gives 0.17 and 2.67. A causal-skipping kernel halves every
  curve. Equal tokens are equal FLOPs only while T is held fixed.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-9.10"
alt: >-
  Log–log line chart of the attention-score term over the weight term of Eq.
  9.10, L·T·d_model/N ≈ T/(12·d_model), against sequence length T from 1K to
  128K tokens, for model widths 2048, 4096 and 8192. For d = 4096 the ratio is
  0.021 at 1K, 0.17 at 8K, 0.67 at 32K, 1.0 at 48K and 2.67 at 128K. For
  d = 2048 it reaches 1 at 24K and 5.3 at 128K; for d = 8192 it is 0.083 at 8K
  and 1.33 at 128K. A dashed line at 1 marks where attention FLOPs equal
  weight FLOPs. An illustrative 7B-class configuration (L = 32, d = 4096,
  N = 7·10⁹, not a named model) gives 0.15 at 8K and 2.45 at 128K.
spec:
  type: line
  x: { label: "sequence length T", scale: log2, format: tokens, domain: [1024, 131072] }
  y: { label: "attention ÷ weight FLOPs per token", scale: log2, format: raw }
  variables: { da: 2048, db: 4096, dc: 8192 }
  series:
    - { id: d2k, label: "d_model = 2048", formula: "x/(12*da)", sample: { from: 1024, to: 131072, count: 8 } }
    - { id: d4k, label: "d_model = 4096", formula: "x/(12*db)", sample: { from: 1024, to: 131072, count: 8 }, emphasis: true }
    - { id: d8k, label: "d_model = 8192", formula: "x/(12*dc)", sample: { from: 1024, to: 131072, count: 8 } }
    - { id: parity, label: "attention = weights", formula: "1", sample: { from: 1024, to: 131072, count: 2 }, dashed: true }
  annotations:
    - { x: 8192, label: "d = 4096: 0.17 (7B-class exact: 0.15)" }
    - { x: 49152, label: "crossing at T = 12·d_model" }
    - { x: 131072, label: "d = 4096: 2.67 (7B-class exact: 2.45)" }
```

**Learning-rate-weighted exposure.** The chapter's quantity for comparing curricula:

$$
\tilde{d}_i = \frac{\sum_t \eta(t)\, d_i(t)}{\sum_t \eta(t)}
$$
*(Eq. 9.11)* where d_i(t) is domain i's consumed tokens at step t; two policies with equal d_i but different d̃_i are different interventions. DERIVED; the artifact reports d̃_i per domain alongside d_i.

```figure
id: fig-9.17
kind: chart
title: Phase table of Experiment 9.3 as learning rate and upsampled share
caption: >-
  The time axis a curriculum lives on. The solid schedule is η constant, then
  linear to zero over the last f = 10% of the run (the ASSUMED shape of the
  decay arms); arm B puts the high-quality pool H at 30% of the stream inside
  that window, arm C spreads the same total d_H = 3% of the run uniformly, and
  arm D keeps B's data shift under a constant η. The cursor follows the text:
  the stable phase, the decay phase where shift and decay coincide, and the
  arms that pull them apart. Illustrative phase table, not a named recipe.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-9.11", "DERIVED:alg-9.3"]
alt: >-
  Line chart over training position t/S from 0 to 1. The learning rate
  relative to its peak is 1 until t/S = 0.9 and then falls linearly to 0 at
  t/S = 1; a dashed line at 1 shows arm D's constant learning rate. Arm B's
  share of the high-quality pool H is 0 until 0.9 and 30% afterwards. Arm C's
  share is a constant 3%, which gives the same total d_H. The cursor sits at
  t/S = 0.5 in the stable phase, then at 0.95, where η is half its peak and
  arm B draws 30% of its tokens from H.
spec:
  type: line
  x: { label: "training position t/S", scale: linear, format: percent, domain: [0, 1] }
  y: { label: "η/η₀, or share of the stream from H", scale: linear, format: percent, domain: [0, 1] }
  variables: { f: 0.1, sH: 0.3 }
  series:
    - { id: eta, label: "η(t)/η₀, arms A, B, C, E", formula: "min(1, (1 - x)/f)", sample: { from: 0, to: 1, count: 101 } }
    - { id: etaD, label: "η(t)/η₀, arm D (constant)", formula: "1", sample: { from: 0, to: 1, count: 2 }, dashed: true }
    - { id: wB, label: "share of H, arm B (late)", formula: "sH*clamp(floor((x - (1 - f))/f + 1), 0, 1)", sample: { from: 0, to: 1, count: 101 }, emphasis: true }
    - { id: wC, label: "share of H, arm C (uniform)", formula: "sH*f", sample: { from: 0, to: 1, count: 2 } }
  annotations:
    - { x: 0.9, label: "decay and upsampling begin, f = 10%" }
    - { x: 0.95, label: "η = 0.5·η₀; B draws 30% from H" }
states:
  - { anchor: formulation, label: "t = 0.5·S, stable phase", variables: { x: 0.5 }, highlight: [eta, wC], note: "Mid-run: η at its plateau and only arm C has H in the stream, at 3%. Eq. 9.11 weights each of these tokens by the full η." }
  - { anchor: mechanism, label: "t = 0.95·S, decay phase", variables: { x: 0.95 }, highlight: [eta, wB], note: "Inside the terminal 10%: arm B draws 30% of its tokens from H while η has fallen to half. Every recipe row entangles the shift with the decay in exactly this way." }
  - { anchor: experimental-design, label: "arms B, C, D at equal d_H", variables: { x: 0.95 }, highlight: [wB, wC, etaD], note: "B and C consume the same d_H = 3% of S at different times; B and D share the data shift but not η. Only this grid separates data from schedule." }
```

> **Assumption.** The late phase's effect is set by where its tokens sit in the schedule — their η(t) and their distance from the end of training — rather than by the specific ordering inside the phase · *sensitivity:* if intra-phase order matters, phase tables must specify it, and Experiment 9.3's "same tokens, spread uniformly" arm will not be an adequate control.

## Mechanism

**Easy-to-hard and competence gating** filter the stream by a difficulty score and a competence clock. Cost: a difficulty score per unit (one classifier or a reference-model loss per unit, a forward pass over the pool — NOT-DISCLOSED for any production run), plus rejected draws early in training that must be re-drawn from the accepted set; Algorithm 9.3 makes the rejection deterministic so the ledger stays exact. No paper opened for this chapter reports a difficulty curriculum improving a Transformer *pretraining* run at scale; the evidence is from NMT (R9.18) and latent-variable models (R9.17), and this chapter treats difficulty curricula for pretraining as UNVERIFIED.

**Sequence-length curricula** change the unit: early phases draw short packed sequences, later phases long ones. Cost: Eq. 9.10 makes FLOPs per token phase-dependent, and activation memory per sequence scales with T ([§5.6](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md)); the benefit reported by R9.19 is stability at larger batch and learning rate, and by R9.20 a lower cost per token at a given final context. PAPER-REPORTED (R9.8): Llama 3 405B increased context in six stages from 8K to 128K over approximately 800B tokens; PAPER-REPORTED (R9.30): Qwen3's long-context stage trains on hundreds of billions of tokens at 32,768 with 75% of text between 16,384 and 32,768 tokens and 25% between 4,096 and 16,384. Both are length curricula placed after the main stage, and both change the FLOP-per-token rate of the run.

**Domain curricula** vary w(t) across domains without changing the unit. PAPER-REPORTED (R9.2, §5): DoGE tested stage-wise domain weights obtained by averaging its proxy's step-wise weights over K = 2, 3, 10 stages, keeping total per-domain samples equal to the global weights, and found "none of the time-varying strategies show clear improvement over the global averaged domain weights in average perplexity", with K = 2, 3 helping the hard domains. PAPER-REPORTED (P25): DeepSeekMath found code training benefits mathematical reasoning "both under the two-stage training and one-stage training settings", and that mixing code and math tokens "effectively mitigates the issue of catastrophic forgetting" of coding ability — an ordering-versus-mixing result in the specialist setting of [§9.5](09-5-multilingual-and-specialist-mixtures.md). Cost: none in FLOPs; the risk is the retention loss of [§22.4](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-4-retention-and-interference.md) when a domain's weight falls to zero for a long stretch.

**Late-stage quality upsampling** is the domain curriculum with the strongest reported effects, always coupled to a decaying learning rate:

| Recipe | Terminal phase | Data shift | Schedule in phase | Reported effect (context) | Label |
|---|---|---|---|---|---|
| OLMo 2 7B (R9.7) | Stage 2, three runs of 50B tokens, different data orders, then averaged | Dolmino Mix 1124: high-quality web (DCLM fastText top 7% + FineWeb-Edu ≥ 2, 752B available), FLAN, peS2o, Wikipedia, StackExchange, plus a math mix (TuluMath, TinyGSM-MIND, MathCoder2, Metamath, GSM8K train split) | LR decayed linearly to zero | Table 9 average 53.0 → 62.9; GSM8K 24.1 → 67.5; MMLU 59.8 → 63.7 (the mix contains the GSM8K train split and FLAN, so part of the GSM8K gain is in-distribution exposure) | PAPER-REPORTED |
| Llama 3 8B (R9.8) | Annealing on final tokens | Upsample very-high-quality sources; for the quality probe, 30% new dataset + 70% default mix over 40B tokens from a 50%-trained checkpoint | LR linearly to 0; Polyak averaging of checkpoints | GSM8K +24.0% and MATH +6.4% on the 8B validation sets; "negligible" on 405B | PAPER-REPORTED |
| Llama 3 405B (R9.8) | Final 40M tokens at 128K context | Upsample very-high-quality sources | LR linearly to 0 | Not separately quantified | PAPER-REPORTED |
| MiniCPM 2.4B (R9.9) | Decay stage after a stable stage of "around 1T" tokens, in a run listed at 1.1T tokens (Table 2); the decay length is not stated, and the difference, about 0.1T or 9% of the run, is DERIVED from two rounded figures. Separately, the paper's WSD experiments on 0.036B models found a decay of 10% of total tokens sufficient and 2.5% short | SFT-style high-quality data mixed into pretraining data during decay | Exponential decay `f(s−T) = 0.5^{(s−S)/T}` within WSD, T = 5000 steps (20B tokens): the decay's half-life, not its length | Table 1: C-Eval 40.0 (decay on pretraining data only, then SFT) vs 52.6 (SFT data mixed into decay) | PAPER-REPORTED; run share DERIVED |
| DCLM 7B (P07) | Two cool-downs of 200B and 270B tokens, souped | 70% DCLM-baseline at a tighter fastText threshold + 30% math datasets | Cool-down (decay) | Used to produce the final model; not isolated as an ablation | PAPER-REPORTED |
| Domain upsampling (R9.21) | Final 5–30% of a 1T-token 7B run | Domain-specific datasets upsampled relative to CommonCrawl | Existing schedule | Up to +6.90 pp MMLU, +8.26 pp GSM8K, +6.17 pp HumanEval versus the base mix; 10–20% of training found best | PAPER-REPORTED |
| Qwen3 (R9.30) | Reasoning stage S2, about 5T tokens | More STEM, coding, reasoning and synthetic data | "accelerate the learning rate decay" | Not separately quantified; domain weights NOT-DISCLOSED | PAPER-REPORTED / NOT-DISCLOSED |

Two mechanisms are entangled in every row: the data shift and the decay. PAPER-REPORTED (R9.9): in WSD the loss "experiences a significant rapid decline" once the learning rate decays, on unchanged data. Therefore the counterfactual for a late-stage gain is the *same decay on the base mixture*, and only MiniCPM's Table 1 and R9.21's ablations report something close to that control; OLMo 2's Table 9 compares the end of stage 1 with the end of stage 2 and does not isolate the shift from the decay. DERIVED. Cost of the phase: the scarce pool is consumed at e_i ≈ 1 in the phase rather than repeated across the run; the phase's tokens are a fraction f of the budget at unchanged FLOPs per token unless the context length also changes; checkpoint averaging across data orders multiplies the phase cost by the number of orders (three for OLMo 2 7B).

**Annealing as a measurement instrument.** PAPER-REPORTED (R9.8): Llama 3 assesses a candidate dataset by annealing a 50%-trained 8B checkpoint on 40B tokens with 30% weight on the candidate, and found this "more efficient" than scaling-law experiments for that purpose; PAPER-REPORTED (R9.7): OLMo 2's "microanneals" found that domain-specific data helps in small proportions, that some duplication is beneficial, and that rewriting can help dramatically. Cost: one short decay run per candidate at 8B — roughly 40B tokens × 6N FLOPs — which is the price of a data-quality measurement at that scale. The instrument measures the joint effect of (candidate, decay, checkpoint); its transfer to a different base checkpoint or to a full run is UNVERIFIED and is the subject of [§9.4](09-4-learned-mixture-selection.md)'s transfer discussion.

## Algorithm

```text
Algorithm 9.3 — Phase-table curriculum executor with competence gating
INPUT   phase table Φ = [(t_start, t_end, w, unit, T_seq, c_0, t_c)]; difficulty scores ϑ(z) ∈ [0,1] (or null);
        Algorithm 9.1 sampler state; learning-rate schedule η(t) (read-only)
OUTPUT  the emitted stream of Algorithm 9.1 with per-phase weights and per-unit acceptance; η-weighted exposure d̃_i
STATE   phase pointer; rejected[i] counters; d̃_num[i], d̃_den; per-domain accepted-set cursors
INVARIANT within a phase, accepted draws are exactly proportional to w (Algorithm 9.1 invariant on the accepted stream);
          a rejected unit is deferred, never discarded, and its exposure is not counted
1.  for t in training positions:
2.      φ ← phase containing t; set Algorithm 9.1 weights ← φ.w, unit ← φ.unit, T ← φ.T_seq
3.      c ← min(1, sqrt(t·(1 − φ.c_0²)/φ.t_c + φ.c_0²))                 # Eq. 9.9; c = 1 disables gating
4.      (i, j, e) ← Algorithm 9.1 draw
5.      if ϑ ≠ null and ϑ(U_i[j]) > c: rejected[i] += 1; push j to deferred_i; goto 4   # deterministic: same seed, same order
6.      if deferred_i non-empty and ϑ(head(deferred_i)) ≤ c: j ← pop(deferred_i)         # release deferred units first
7.      emit (i, j, e); on COMMIT: d̃_num[i] += η(t)·len; d̃_den += η(t)
8.      if t == φ.t_end: assert Σ_i consumed_in_phase[i] matches φ.w·(t_end − t_start) within one unit per domain
9.  return d̃_i = d̃_num[i]/d̃_den for all i
TERMINATION: end of the phase table.
```

Complexity: O(1) per draw beyond Algorithm 9.1 when ϑ is precomputed; a deferred queue of size bounded by the number of units above competence at any time. The deferred-first rule (line 6) keeps the accepted stream a deterministic function of the seed, so a restart reproduces it. Implementation link: `mixture_policy.yaml` phase rows in [verification.md](verification.md).

```figure
id: fig-9.18
kind: diagram
title: Algorithm 9.3, one training position
caption: >-
  Follow the heavy path: a draw from Algorithm 9.1 passes the competence gate,
  is emitted, and is counted in both ledgers only when the training loop
  commits it. A rejected unit is deferred, never discarded, and released
  first once c(t) reaches it, so the accepted stream stays a pure function of
  the seed. η(t) is read, never written: the executor records the schedule
  that Eq. 9.11 needs but does not set it. The difficulty scores are a
  precomputed input whose cost is NOT-DISCLOSED for production runs.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:alg-9.3", "DERIVED:eq-9.9", "DERIVED:eq-9.11"]
alt: >-
  Left-to-right diagram of Algorithm 9.3. The phase table Φ, holding t_start,
  t_end, weights, unit, sequence length, c_0 and t_c, sets the weights of an
  Algorithm 9.1 draw and the parameters of the competence clock c(t) of Eq.
  9.9. Each draw (i, j, e) meets a gate that compares the precomputed
  difficulty ϑ of the unit with c(t). If ϑ exceeds c the unit goes to a
  per-domain deferred queue and the sampler redraws; deferred units are
  released first once ϑ ≤ c. Accepted units are emitted and, on COMMIT from
  the training loop, added to the consumed counts d_i and to the η-weighted
  sums of Eq. 9.11, which read the learning-rate schedule. At each phase end an
  assertion checks consumed tokens against w·(t_end − t_start) within one unit
  per domain.
spec:
  direction: LR
  nodes:
    - { id: phi, kind: state, label: "phase table Φ", sub: "t_start, t_end, w, unit, T, c₀, t_c" }
    - { id: comp, kind: process, label: "competence clock c(t)", sub: "Eq. 9.9; c = 1 disables gating" }
    - { id: score, kind: dependency, label: "difficulty scores ϑ(z)", sub: "precomputed; scorer cost NOT-DISCLOSED" }
    - { id: draw, kind: process, label: "Algorithm 9.1 draw (i, j, e)", sub: "exactly proportional to φ.w" }
    - { id: gate, kind: branch, label: "ϑ(U_i[j]) ≤ c(t)?" }
    - { id: defer, kind: memory, label: "deferred queue per domain", sub: "never discarded, released first" }
    - { id: emit, kind: flow, label: "emit (i, j, e)", sub: "global index t" }
    - { id: commit, kind: feedback, label: "COMMIT from the training loop", sub: "retained optimiser step" }
    - { id: eta, kind: dependency, label: "learning-rate schedule η(t)", sub: "read-only, §20.3" }
    - { id: ledger, kind: metric, label: "d_i and d̃_i", sub: "Eq. 9.11, exposure_report.csv" }
    - { id: check, kind: metric, label: "phase-end assertion", sub: "w·(t_end − t_start) ± 1 unit" }
  edges:
    - { from: phi, to: draw, label: "w, unit, T" }
    - { from: phi, to: comp, label: "c₀, t_c" }
    - { from: draw, to: gate, kind: emphasis }
    - { from: comp, to: gate, kind: dependency, label: "c(t)" }
    - { from: score, to: gate, kind: dependency, label: "ϑ" }
    - { from: gate, to: emit, kind: emphasis, label: "ϑ ≤ c" }
    - { from: gate, to: defer, label: "ϑ > c" }
    - { from: defer, to: draw, kind: feedback, label: "redraw (line 5)" }
    - { from: defer, to: emit, label: "release when ϑ ≤ c (line 6)" }
    - { from: emit, to: commit, kind: emphasis }
    - { from: commit, to: ledger, kind: emphasis, label: "len and η(t)·len" }
    - { from: eta, to: ledger, kind: dependency, label: "η(t)" }
    - { from: ledger, to: check }
```

Cost line: parameters 0; tokens — rejected draws are re-drawn, so consumed tokens per phase equal the plan; FLOPs — the difficulty scorer's pass over the pool (NOT-DISCLOSED for production) plus phase-dependent Eq. 9.10 for length phases; memory capacity — deferred queues; memory traffic — one scorer read per unit; communication — none; latency — none on the training path; energy and money — NOT-DISCLOSED.

## Implementation

Tensors → operators: length phases change the packed shape `[B, T]` per phase and, with document masking, the attention mask; framework-level batch-size changes usually accompany a T change to hold tokens per step constant ([§19.2](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics.md)). Named reference-stack systems with §4.1 layer: **MosaicML LLM Foundry** (Distributed training) — StreamingDataset's per-stream `proportion` / `repeat` / `choose` (R9.33) define one static mixture per dataset object; a phase table is realised by constructing a new dataset per phase and resuming the loader state at the boundary, since the docs opened describe no in-run reweighting (NOT-DISCLOSED); **Megatron-LM** (Distributed training) — the blended sample index (R9.36) is built once, so a phase change is a rebuild with a new blend and an offset, which is how staged recipes are typically run (UNVERIFIED for any specific release); **Hugging Face TRL** (Post-training / RL) is not used here; late-stage SFT-style data inside pretraining (R9.9) is a pretraining-loader concern, not a post-training one. Kernels: long phases use FlashAttention-class kernels whose cost scales as Eq. 9.10 ([§27.1](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/27-1-io-aware-attention.md)). Memory: activation memory per sequence rises with T. Communication: context-parallel collectives appear at long T ([§29.3](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-3-sequence-and-context-parallelism.md)). Deployment: the phase table is versioned with the policy; checkpoint averaging across data orders is a post-phase step whose cost is the number of orders.

> **Implementation note [impl.mosaicml-llm-foundry · Streaming docs "stable", accessed 2026-09-20].** `batching_method='stratified'` (R9.33) enforces the mixture per global batch; inside a late phase with a small high-quality stream that setting prevents the stream from being absent from some batches and over-represented in others, at the cost of fixed per-batch composition.

## Experimental design

### Experiment 9.3 — Data shift versus decay in a late phase

- **Hypothesis.** Part, but not all, of the reported late-phase gain is due to the data shift; at equal raw exposure d_H, placing H in the last f (arm B) beats spreading it over the run (arm C) even though Eq. 9.11 gives B the smaller η-weighted exposure — d̃_H^B/d̃_H^C = 0.5/(1 − f/2) ≈ 0.53 at f = 0.1 when η is constant and then linear to zero over the last f, MATHEMATICALLY-DERIVED — so the persistence of late tokens outweighs the smaller steps they receive; and the upsampled pool's *held-out* neighbour domain does not degrade beyond a pre-registered margin.
- **Setup.** A base run of a 1B-class model on an open web mix for D tokens; a high-quality pool H of size ≤ 0.1·D; final fraction f = 0.1.
- **Independent variables.** Arm A: base mix throughout, constant LR then linear-to-zero over the last f (decay only). Arm B: H upsampled to 30% in the last f, same decay (shift + decay). Arm C: H spread uniformly over the whole run at the same total d_H, same decay (same exposure, different d̃_H). Arm D: H upsampled in the last f under a *constant* LR (shift only). Arm E: H replaced in the last f by a random web sample of equal size, same decay (control for novelty).
- **Controlled variables.** Total tokens, total FLOPs (fixed T and N, so equal tokens ⇒ equal FLOPs), tokenizer, seeds (3), evaluator; per-arm ledger with d_i and d̃_i.
- **Dataset / workload.** Open pools; held-out validation per domain; one held-out domain adjacent to H (e.g. math if H is educational web) and one distant.
- **Hardware.** Any.
- **Metrics.** Token-mean loss per domain; a small benchmark suite scored by an evaluator independent of the pool construction ([§6.1](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md)); d_i, d̃_i.
- **Baselines.** Arm A.
- **Expected result.** B > A (the recipe effect); B > C at equal d_H (the timing effect, as the persistence hypothesis predicts). The B–C contrast separates three accounts: if the effect scales with raw exposure d_H, B ≈ C; if it scales with η-weighted exposure d̃_H (Eq. 9.11), C > B; if late tokens persist, B > C; B ≈ C refutes the timing effect, and C > B refutes persistence in favour of d̃_H. D > A on H-domain loss but < B (decay contributes); E ≈ A (no novelty effect). Held-out adjacent domain: B not worse than A beyond margin — if it is, the phase over-specialised.
- **Ablation.** f ∈ {0.05, 0.1, 0.2, 0.3}; R9.21 reports 10–20% best at 7B/1T.
- **Interpretation.** Separates the two entangled mechanisms; assigns the residual to the schedule.
- **Threats to validity.** Small-scale results may not transfer (Llama 3 reports negligible gains at 405B); H may contain benchmark-adjacent data (decontaminate per [§8.5](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md)); constant-LR arm D may be unstable.

```figure
id: fig-9.19
kind: calculator
title: Learning-rate-weighted exposure of arms B, C and D
caption: >-
  Eq. 9.11 evaluated for Experiment 9.3's arms under an ASSUMED schedule: η
  constant, then linear to zero over the last fraction f. Arms B and C consume
  the same d_H; B's tokens meet the decaying half of η, so its d̃_H is only
  0.53 of C's at f = 0.1, and arm D, with η held constant, matches C. Notice
  the direction: Eq. 9.11 as written ranks the uniform arm above the late arm,
  so a B > C result would have to come from the persistence argument of the
  Intuition, not from d̃ alone. Illustrative run size.
placement: rail
anchor: experimental-design
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-9.11"
alt: >-
  Calculator for Eq. 9.11 over run tokens S, terminal fraction f and the share
  of the high-quality pool H in the terminal phase, with η constant and then
  linear to zero over the last f. At the illustrative defaults S = 20B,
  f = 0.1 and a 30% share, arm B consumes d_H = 600M tokens of H; its
  learning-rate-weighted exposure is 0.526 of arm C's, which consumes the same
  600M uniformly; arm D, the same shift under a constant η, is 1.0 of arm C's.
  The terminal 10% of tokens carries 5.3% of the total learning-rate mass. At
  f = 0.3 the B-to-C ratio is 0.588.
spec:
  tex: >-
    \tilde{d}_H = \frac{\sum_t \eta(t)\,d_H(t)}{\sum_t \eta(t)},\qquad \frac{\tilde{d}_H^{\,B}}{\tilde{d}_H^{\,C}} = \frac{1/2}{1 - f/2}
  equation: "9.11"
  inputs:
    - { symbol: S, label: "run tokens S", default: 2.0e10, min: 1.0e9, max: 1.0e13, scale: log10, format: tokens }
    - { symbol: f, label: "terminal fraction f", default: 0.1, min: 0.05, max: 0.3, options: [0.05, 0.1, 0.2, 0.3], format: percent }
    - { symbol: sH, label: "share of H in the terminal phase", default: 0.3, min: 0.05, max: 1, step: 0.05, format: percent }
  outputs:
    - { symbol: dH, label: "d_H, tokens of H in arms B, C and D", formula: "sH*f*S", format: tokens }
    - { symbol: rB, label: "d̃_H of arm B ÷ arm C", formula: "0.5/(1 - f/2)", format: ratio, emphasis: true }
    - { symbol: rD, label: "d̃_H of arm D ÷ arm C", formula: "1", format: ratio }
    - { symbol: etaLate, label: "share of Σ η in the last f", formula: "(f/2)/(1 - f/2)", format: percent }
    - { symbol: tokLate, label: "share of tokens in the last f", formula: "f", format: percent }
```

## Observations

**What the paper claims.** PAPER-REPORTED (R9.7, R9.8, R9.9, R9.21, P07): late-phase quality upsampling with a decaying learning rate raises benchmark scores by the amounts tabulated above, at the scales stated. PAPER-REPORTED (R9.19, R9.20): sequence-length curricula improve stability and reduce cost per token. PAPER-REPORTED (R9.2): stage-wise domain weights did not beat the global average. PAPER-REPORTED (R9.16, R9.17, R9.18): difficulty curricula help in their original settings.

**What the evidence shows.** The late-phase effect has been reported by at least five independent groups at 1B–8B scale; that is the strongest replication in this chapter. What is not established is the split between shift and decay — only R9.9 (Table 1) and R9.21 approximate the control — and whether the effect persists at the largest scales, where R9.8 reports it as negligible for 405B. Difficulty curricula for pretraining have no scale evidence in the sources opened. Length curricula have two independent reports with different mechanisms (stability, cost).

**What we infer.** DERIVED: equal tokens is insufficient for any late-phase claim; the η-weighted exposure of Eq. 9.11 belongs in the ledger beside d_i because it separates arms that equal tokens conflate, but as an account of the gain it is one candidate, alongside the persistence of late tokens, and Experiment 9.3's B–C contrast is what decides between them. DERIVED: because benchmark-adjacent data (GSM8K train, FLAN) appears in some terminal mixes, some of the reported gain is in-distribution exposure and must be separated by held-out domains before it is called sample efficiency.

**What remains unknown.** NOT-DISCLOSED: the phase tables, fractions and per-source weights of closed models. UNVERIFIED: the shift/decay split at any scale above 2.4B; transfer of the annealing probe's verdicts to full runs; the competence function that would suit pretraining.

## Failure modes

> **Failure mode — schedule confound.** *Symptom:* a late-phase gain is attributed to data and disappears when the base mix is annealed. *Cause:* no decay-only control. *Detection:* Experiment 9.3 arm A. *Mitigation:* always run the decay-only arm.

> **Failure mode — over-specialisation.** *Symptom:* the upsampled domain improves; an adjacent held-out domain and general perplexity degrade. *Cause:* f too large or the phase mix too narrow; R9.21 reports the trade-off across 5–30%. *Detection:* held-out domain margin in [verification.md](verification.md). *Mitigation:* keep a replay share of the base mix (Llama 3's 70%, R9.8).

> **Failure mode — FLOP accounting broken by length phases.** *Symptom:* two runs "at equal tokens" differ in wall-clock and energy by a large factor. *Cause:* Eq. 9.10's attention term. *Detection:* report FLOPs from Eq. 9.10 per phase. *Mitigation:* compare at equal FLOPs as well ([verification.md](verification.md)).

> **Failure mode — retention collapse under a domain curriculum.** *Symptom:* a domain whose weight went to zero for a long stretch shows a loss jump. *Cause:* interference ([§22.4](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-4-retention-and-interference.md)). *Detection:* per-domain validation at phase boundaries. *Mitigation:* a floor weight per domain in every phase.

> **Failure mode — non-deterministic rejection.** *Symptom:* a resumed curriculum run consumes a different accepted stream. *Cause:* competence gating that depends on a worker-local clock or on a live loss. *Detection:* stream hash mismatch after restart. *Mitigation:* Algorithm 9.3's deferred-first rule with a precomputed ϑ.

## Siblings

**Static mixture** — [§9.1](09-1-mixture-formulation.md)
Why it exists: simplest policy; one weight vector. What assumption changed (relative to a curriculum): order is irrelevant. What objective changed: none. What problem it solved: reproducibility and analysis. What new failure mode it introduced: scarce pools either repeated or diluted. Changed primitive: w(t) → w.

**Difficulty / competence curriculum** — this file, Eq. 9.8–9.9
Why it exists: hard examples early may hurt optimisation (R9.16, R9.19). What assumption changed: a difficulty score exists and is meaningful. What objective changed: a gated sampling distribution. What problem it solved: early gradient variance; convergence speed in NMT. What new failure mode it introduced: scorer cost; deferred-unit bookkeeping; unverified benefit for pretraining. Changed primitive: acceptance by ϑ ≤ c(t).

**Sequence-length curriculum** — this file, Eq. 9.10; [§12.4](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md)
Why it exists: long sequences are expensive and destabilising early. What assumption changed: the unit may change during the run. What objective changed: none. What problem it solved: stability (R9.19), cost per token (R9.20). What new failure mode it introduced: equal tokens ≠ equal FLOPs. Changed primitive: fixed T → T(t).

**Late-stage quality upsampling** — this file
Why it exists: scarce high-quality pools. What assumption changed: η-weighted exposure matters. What objective changed: none. What problem it solved: spends scarce tokens where they persist. What new failure mode it introduced: schedule confound, over-specialisation. Changed primitive: static θ, w → terminal phase (θ′, w′) with decay.

**Mid-training as a stage** — [§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md), [§22.2](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-2-distribution-transitions.md)
Why it exists: the late phase became a separately checkpointed, separately optimised stage. What assumption changed: the stage may restart the optimizer and change the schedule. What objective changed: sometimes (added losses, context). What problem it solved: modular recipes; checkpoint averaging across orders. What new failure mode it introduced: optimizer-state transitions ([§22.3](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-3-optimizer-transitions.md)). Changed primitive: one run → a chain of runs.

## Extensions

Domain adaptation reuses the late phase with the target domain as the upsampled pool and the base mix as replay ([§22.2](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-2-distribution-transitions.md)). Long context is itself a length phase (R9.8, R9.30). For multimodal training the phase table needs per-modality units and Eq. 9.10 analogues per encoder (proposal). For agents, SFT-style trajectories introduced during decay (R9.9's pattern) carry large loss masks, so d̃_i must be computed on unmasked tokens (proposal). Supervised fine-tuning proper is [§31.4](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/31-4-training-choices.md).

## Limitations

Eq. 9.11 is a first-order accounting that ignores the optimizer's state (momentum, second-moment estimates) and the interaction between the batch composition and the effective step; it is a comparison device, not a prediction. The recipe table reports what papers state under their own evaluation suites, which differ; the numbers are not comparable across rows. Falsification: if Experiment 9.3 finds B ≈ C at equal d_H across seeds, timing does not matter and the late phase is merely a mixture change; if C > B, η-weighted exposure outweighs persistence and a uniform spread is the better use of the pool at that scale; if B ≈ A, the gain was the decay.

## Reproducibility

Phase table (as in `mixture_policy.yaml`), η(t) schedule, difficulty scorer version and scores, seeds, and per-phase d_i and d̃_i in `exposure_report.csv`. Sources opened: R9.7 (arXiv HTML, v3), R9.8 (ar5iv), R9.9 (arXiv HTML), R9.21 (arXiv abs), P07 (arXiv HTML), P25 (ar5iv), R9.2 (arXiv PDF, text extracted), R9.16 (PDF, text extracted), R9.17 (proceedings abstract), R9.18–R9.20 (arXiv abs), R9.30 (arXiv HTML). Unknowns: the competence form for pretraining is ASSUMED; no run executed (UNVERIFIED).

## References

P07 · P25 · R9.2 · R9.7 · R9.8 · R9.9 · R9.16 · R9.17 · R9.18 · R9.19 · R9.20 · R9.21 · R9.30 · R9.33 · R9.36 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
