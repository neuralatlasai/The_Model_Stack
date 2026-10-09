---
id: ms.section.31.1
entity_type: section
title: SFT objectives
short_title: SFT objectives
volume: 2
part: 6
chapter: 31
section: '31.1'
slug: 31-1-sft-objectives
parent: ms.chapter.31
prev_sibling: null
next_sibling: ms.section.31.2
children: []
prerequisites:
- ms.chapter.10
- ms.chapter.11
- ms.chapter.12
- ms.chapter.19
- ms.chapter.20
- ms.chapter.21
- ms.chapter.22
- ms.chapter.23
- ms.chapter.24
- ms.chapter.30
downstream:
- ms.chapter.32
- ms.chapter.33
- ms.chapter.34
- ms.chapter.35
- ms.chapter.36
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - supervised_fine_tuning
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.hugging-face-trl
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 31.1 — SFT objectives

## Scope

[DERIVED] This section owns the supervised target distribution, response/full-sequence masking, example/token normalization and target weighting. The deliverable is a loss specification whose gradient is invariant to padding, microbatch partition and physical rank placement. Canonical probability factorization remains in Chapter 04; optimizer mechanisms remain in Chapter 20. All empirical disclosures cited here originated in 2026. The mathematical constructions below are original explanatory derivations of established objectives, not claims of recent invention.

## Why this exists

[MATHEMATICALLY-DERIVED] A dataset does not specify an objective. The same serialized conversation can train the probability of user questions, assistant answers, tool observations or any selected subset. Likewise, an average over examples and an average over selected tokens define different empirical distributions. An apparent improvement can therefore be a change in which outcomes receive probability mass, rather than better optimization of an unchanged target. Recording only a scalar cross-entropy erases the distinction.

[DERIVED] The appropriate review unit is a tuple: source example, rendered token stream, target mask, nonnegative target weight, conditioning relation and denominator. A model checkpoint without that tuple cannot explain whether a lower loss represents better conditional imitation or easier target selection. Empty targets, discarded reasoning suffixes and duplicated completions must remain visible in the data audit; removing them changes the population to which the loss applies.

## Intuition

[MATHEMATICALLY-DERIVED] For a fixed conditioning prefix, cross-entropy decomposes into target entropy plus a divergence from the model distribution. A binary response mask changes which conditional distributions are fitted. A weight changes their frequency in the empirical measure. Neither changes the model softmax into a probability distribution restricted to supervised vocabulary tokens: the denominator still ranges over the complete vocabulary. Masking a target position is different from removing that position from the context.

[MATHEMATICALLY-DERIVED] Conditional likelihood of an entire response includes every token, including its termination event. A product over selected response positions is a valid composite training criterion; if positions within the response are omitted, it is generally not the normalized likelihood of the full response. This distinction matters when supervising only the final answer while feeding an externally supplied reasoning trace. The objective conditions on that trace; it does not establish the ability to generate it.

## Formulation

| Symbol | Meaning | Shape or unit |
|---|---|---|
| $z_i$ | Rendered training sequence | $[T_i]$ token identifiers |
| $m_{it}$ | Target inclusion indicator at token $t$ | Binary |
| $w_{it}$ | Declared fixed or detached target weight | Nonnegative scalar |
| $a_{it}=m_{it}w_{it}$ | Effective target mass | Dimensionless |
| $A_i$ | Sum of effective target mass in example $i$ | Dimensionless |
| $\ell_{it}$ | Negative log probability of token $z_{it}$ given legal context | Nats |

[MATHEMATICALLY-DERIVED] For nonempty mass $A_i>0$, the weighted token objective and the equally weighted example objective are:

$$
A_i=\sum_t a_{it},\qquad \mathcal L_{\rm tok}=\frac{\sum_i\sum_t a_{it}\ell_{it}}{\sum_i A_i},\qquad \mathcal L_{\rm ex}=\frac1n\sum_i\frac{\sum_t a_{it}\ell_{it}}{A_i}.
$$
*(Eq. 31.1)*

where all sums cover valid shifted targets, $n$ is the number of admitted nonempty examples, and weights are fixed during the gradient calculation.

```figure
id: fig-31.1
kind: calculator
title: Example versus token influence
caption: Illustrative constant-length families with unit weights. Equal example counts need not give equal influence under a token mean.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.2
alt: Adjust the declared illustrative inputs; family-one token mass=n1*r1/(n1*r1+n2*r2), family-one example mass=n1/(n1+n2). Illustrative constant-length families with unit weights. Equal example counts need not give equal influence under a token mean.
spec:
  tex: q_1=\frac{n_1 r_1}{n_1r_1+n_2r_2}
  equation: "31.2"
  inputs:
    - symbol: n1
      label: examples in family one
      default: 100
      min: 1
      max: 10000
      format: integer
      step: 1
    - symbol: r1
      label: target tokens per example one
      default: 128
      min: 1
      max: 8192
      format: integer
      step: 1
    - symbol: n2
      label: examples in family two
      default: 100
      min: 1
      max: 10000
      format: integer
      step: 1
    - symbol: r2
      label: target tokens per example two
      default: 1024
      min: 1
      max: 8192
      format: integer
      step: 1
  outputs:
    - symbol: q
      label: family-one token mass
      formula: n1*r1/(n1*r1+n2*r2)
      format: raw
      emphasis: true
    - symbol: p
      label: family-one example mass
      formula: n1/(n1+n2)
      format: raw
      emphasis: false
anchor: formulation
states:
  - anchor: formulation
    label: Unequal lengths
    variables:
      r1: 128
      r2: 1024
    highlight:
      - q
    note: The longer family supplies more target mass.
  - anchor: mechanism
    label: Matched lengths
    variables:
      r1: 1024
      r2: 1024
    highlight:
      - q
      - p
    note: Example and target-token proportions coincide under constant equal lengths.
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Write each per-example normalized loss as $u_i$. The token mean becomes a convex combination with coefficients $A_i/\sum_j A_j$; the example mean uses $1/n$. Their gradients agree only under restrictive conditions, such as equal effective masses, or accidental cancellation of the differently weighted gradients. For two constant-length families, their relative influence is therefore determined before any optimizer step:

$$
q_1=\frac{n_1r_1}{n_1r_1+n_2r_2},\qquad p_1=\frac{n_1}{n_1+n_2}.
$$
*(Eq. 31.2)*

where family $k$ has $n_k>0$ examples, each with $r_k>0$ selected unit-weight targets; $q_1$ is token mass and $p_1$ is example mass.

```figure
id: fig-31.2
kind: diagram
title: Supervision measure construction
caption: The attention relation and target mask are separate inputs; reduction occurs after target selection.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.1
alt: The information path is Rendered example, then Legal contexts, then Target mask, then Weighted sum, then Global reduction.
  The attention relation and target mask are separate inputs; reduction occurs after target selection.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: dataset
    label: Rendered example
    sub: tokens and boundaries
  - id: n1
    kind: tensor
    label: Legal contexts
    sub: attention relation
  - id: n2
    kind: tensor
    label: Target mask
    sub: shifted positions
  - id: n3
    kind: objective
    label: Weighted sum
    sub: numerator and mass
  - id: n4
    kind: process
    label: Global reduction
    sub: one denominator
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n2
    to: n3
  - from: n3
    to: n4
```

[MATHEMATICALLY-DERIVED] Response-only and full-sequence policies differ by a second objective term. Let $U$ be the user/system/tool-context targets admitted only by full-sequence training, and $R$ the assistant targets admitted by both. With unit weights, full-sequence loss is a target-count-weighted sum of the two region means. An easy-to-predict repeated system instruction can lower the aggregate scalar while assistant loss rises. Consequently a full-sequence loss cannot be compared directly to response-only loss, even on identical input bytes.

[MATHEMATICALLY-DERIVED] Logits $h\in\mathbb R^V$ give the local derivative $\partial\ell/\partial h_v=p_v-\mathbf1[v=z_t]$. A detached multiplier $a_t$ scales this derivative. If the multiplier is differentiated, an additional $\ell\nabla a_t$ term appears; if the denominator depends on parameters, its derivative also appears. Such an objective is a different method. A manuscript must say whether weighting is a fixed empirical measure, a detached adaptive estimator, or a fully differentiated scalar objective.

[MATHEMATICALLY-DERIVED] With rank-averaged distributed gradients, a local numerator cannot simply be divided by its own local mass when masses differ. For $d$ ranks and global mass $A>0$, backpropagating $d$ times each rank's local numerator divided by $A$ makes the subsequent gradient average equal the desired global token gradient:

$$
g=\frac1d\sum_{r=1}^{d}\nabla_\theta\left(\frac{dN_r}{A}\right)=\frac{\sum_r\nabla_\theta N_r}{\sum_r A_r},\qquad A=\sum_r A_r>0.
$$
*(Eq. 31.3)*

where each $N_r$ includes all accumulation microbatches for the logical step; $A_r$ is their detached mass; the collective convention is averaging.

```figure
id: fig-31.3
kind: compare
title: Reduction contracts
caption: Changing a physical partition must not silently change the intended empirical measure.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.3
alt: 'Comparison on Influence at unequal valid-target counts. Rank contribution: rank=equal, token=proportional to target
  mass, example=proportional to examples. Required statistics: rank=local means, token=sum and mass, example=per-example means
  and count. Partition invariant: rank=only with equal masses, token=yes, same targets, example=yes, intact example weights'
spec:
  axis: Influence at unequal valid-target counts
  columns:
  - id: rank
    label: Mean of rank means
  - id: token
    label: Global target mean
  - id: example
    label: Global example mean
  rows:
  - dimension: Rank contribution
    values:
      rank: equal
      token: proportional to target mass
      example: proportional to examples
  - dimension: Required statistics
    values:
      rank: local means
      token: sum and mass
      example: per-example means and count
  - dimension: Partition invariant
    values:
      rank: only with equal masses
      token: yes, same targets
      example: yes, intact example weights
```

```figure
{
  "id": "fig-31.39",
  "kind": "chart",
  "title": "Equal example frequency does not give equal token weight",
  "caption": "Two equally frequent example families have128and2048response targets. The global token mean assigns1/17and16/17of the supervision mass; averaging example means assignsone half each. These are exact weights from the declared response lengths, independent of model quality.",
  "alt": "Two equally frequent example families have128and2048response targets. The global token mean assigns1/17and16/17of the supervision mass; averaging example means assignsone half each. These are exact weights from the declared response lengths, independent of model quality.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-31.2",
  "spec": {
    "type": "bar",
    "x": {
      "label": "Family response length"
    },
    "y": {
      "label": "Share of supervision mass",
      "domain": [
        0,
        1
      ],
      "ticks": [
        0,
        0.25,
        0.5,
        0.75,
        1
      ]
    },
    "categories": [
      "128 tokens",
      "2048 tokens"
    ],
    "series": [
      {
        "id": "tokens",
        "label": "Global token mean",
        "values": [
          0.058823529411764705,
          0.9411764705882353
        ],
        "emphasis": true
      },
      {
        "id": "examples",
        "label": "Mean of example means",
        "values": [
          0.5,
          0.5
        ]
      }
    ]
  }
}
```

## Algorithm

### Algorithm 31.1 — Exact masked logical step

[DERIVED] Inputs are the checkpoint, finite microbatch plan, immutable mask/weight policy, legal attention relation and collective averaging degree $d$. Outputs are one optimizer transition and an audit record. Precompute global mass from the finalized shifted labels before allocating backward graphs. Reject nonfinite weights, negative weights and a zero global denominator. Ranks with no local targets still participate in the same collective order with zero numerator and gradient contribution.

$$
\begin{aligned}
1.&\quad A_r\leftarrow\sum_{i,t\in r}a_{it};\quad A\leftarrow\operatorname{AllReduceSum}(A_r).\\
2.&\quad \operatorname{require}(A>0);\quad g_r\leftarrow0;\quad N_r\leftarrow0.\\
3.&\quad \text{For each planned microbatch }b:\quad N_b\leftarrow\sum_{i,t\in b}a_{it}\ell_{it}.\\
4.&\quad g_r\leftarrow g_r+\nabla_\theta(dN_b/A);\quad N_r\leftarrow N_r+N_b.\\
5.&\quad g\leftarrow\operatorname{AllReduceMean}(g_r);\quad \operatorname{require}(\operatorname{finite}(g)).\\
6.&\quad N\leftarrow\operatorname{AllReduceSum}(N_r);\quad (\theta',s')\leftarrow\operatorname{OptimizerStep}(\theta,s,g);\quad \operatorname{emit}(A,N,\theta').
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] The invariant after microbatch $k$ is a gradient sum over exactly the first $k$ disjoint target sets, scaled by the same global mass. Termination follows from the finite plan. A rejected step must not advance scheduler or data-consumption state as if committed. This algorithm specifies mathematical reductions; framework-native synchronization must avoid applying the averaging twice. The loss evaluator costs one vocabulary normalization per selected prediction unless a fused implementation shares work; attention still processes conditioning positions.

## Implementation

[OFFICIAL-DOCUMENTATION] **Hugging Face TRL**, reference-stack §4 #29, Post-training / RL, documents completion-only and assistant-only policies in v1.13.0. The tagged trainer builds labels from applicable masks and the padding-free collator suppresses sequence-start targets. These are version-specific interface/code disclosures, not an executed compatibility result. [R31.1], tagged docs “Train on assistant messages only” / “Train on completion only”; tagged code `_prepare_dataset`, `DataCollatorForLanguageModeling`.

[MATHEMATICALLY-DERIVED] Dense logits occupy $bBTV$ bytes before gradients and optimizer state. Masking reduces the number of loss terms but does not automatically reduce this allocation or backbone compute. If only $R$ target positions are projected through a dense output head of width $d_{\rm model}$, the projection arithmetic is approximately:

$$
C_{\rm head,fwd}=2R\,d_{\rm model}V,\qquad M_{\rm logits}=bRV.
$$
*(Eq. 31.4)*

where this counts a dense matrix multiplication only, excludes softmax/backward/backbone and assumes a genuinely gathered target-only projection; a loss mask alone does not implement it.

```figure
id: fig-31.4
kind: stat-panel
title: Target-head accounting
caption: Illustrative target-only projection, not a trainer measurement. Backbone activations and backward state are additional.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.4
alt: 'Analytical readout: forward projection FLOPs=2*R*Dmodel*Vocab, materialized logits bytes=bytes*R*Vocab. Illustrative
  target-only projection, not a trainer measurement. Backbone activations and backward state are additional.'
spec:
  header: TARGET-HEAD ACCOUNTING
  variables:
    R: 1024
    Dmodel: 4096
    Vocab: 65536
    bytes: 2
  rows:
  - key: forward projection FLOPs
    formula: 2*R*Dmodel*Vocab
    format: fixed3
  - key: materialized logits bytes
    formula: bytes*R*Vocab
    format: fixed3
anchor: implementation
```

```figure
{
  "id": "fig-31.5",
  "kind": "chart",
  "title": "Length-weighted influence",
  "caption": "Equal example counts and a fixed 128-token family-one response; the token mean shifts weight as the other response grows.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-31.2",
  "alt": "Analytical curves: token mean equals 128/(128+x), example mean equals 0.5. Equal example counts and a fixed 128-token family-one response; the token mean shifts weight as the other response grows.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "family-two response length",
      "scale": "linear",
      "domain": [
        1,
        4096
      ]
    },
    "y": {
      "label": "family-one target share",
      "scale": "linear",
      "domain": [
        0,
        1
      ],
      "ticks": [
        0,
        0.25,
        0.5,
        0.75,
        1
      ]
    },
    "series": [
      {
        "id": "s0",
        "label": "token mean",
        "formula": "128/(128+x)",
        "sample": {
          "to": 4096,
          "count": 274,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "example mean",
        "formula": "0.5",
        "sample": {
          "to": 4096,
          "count": 274,
          "from": 1
        }
      }
    ],
    "annotations": [
      {
        "x": 128,
        "y": 0.5,
        "label": "Equal length: equal token influence"
      },
      {
        "x": 2048,
        "y": 0.058823529411764705,
        "label": "16x longer peer receives 16x token weight"
      }
    ]
  }
}
```

[DERIVED] Communication depends on trainable parameter placement and belongs to Chapters 29–30; the loss adds a scalar mass reduction and audit statistics. GPU throughput, joules and currency are NOT-DISCLOSED for this mathematical evaluator because no hardware execution was performed. Predicting them from the number of supervised positions would omit context attention, kernel selection, optimizer updates and synchronization. Count consumed context tokens and effective target mass separately in the manifest.

## Experimental design

### Reported experiments

[PAPER-REPORTED] RankTuner modulates an underlying token weight using an approximate inverse probability/entropy scale, informed by target and expected ranks. Math weights use target probability; general tuning uses unit weights. Table 2 includes an AMC23 Pass@16 decrease for Qwen2.5-Math despite aggregate gains. Its adaptive estimator must not silently replace Eq.31.1's fixed-weight contract. [R31.2], §§4.1–4.5/5.1, Table2, AppB.1/B.6.

| RankTuner protocol | Inspected disclosure, R31.2 §5.1 |
|---|---|
| Model/data | Qwen2.5-Math-7B/Qwen3-8B; first 10,000 NuminaMath-CoT instances |
| Training | Four A800-SXM4-80GB; AdamW LR 5e-5, batch 256, length 2,048, cosine/10% warmup |
| Evaluation | Five math benchmarks; 16 samples, temperature 1, length 4,096; Pass@1/16 |
| Missing fields | Training precision, total update/epoch budget, repeated fit seeds: NOT-DISCLOSED |

## Observations

**What the paper claims.** [PAPER-REPORTED] The stated weighting method improves its aggregate reasoning comparisons; its detailed protocol is above. [R31.2]

**What the evidence shows.** [DERIVED] Different decoding budgets and benchmark cells prevent a universal dominance claim. No book reproduction was executed.

**What we infer.** [MATHEMATICALLY-DERIVED] Adaptive weighting must be audited as its own gradient estimator; Eq. 31.1's fixed-weight derivation does not establish that estimator's optimum.

**What remains unknown.** [NOT-DISCLOSED] Transfer to an arbitrary production mixture and precise weighting overhead are not established by the inspected evidence.

## Failure modes

> **Failure mode — Wrong denominator.** *Symptom:* changing accumulation or rank count changes gradients. *Cause:* averaging local means with unequal masses. *Detection:* numerator/mass parity against Eq. 31.3. *Mitigation:* reduce the declared global statistics. [MATHEMATICALLY-DERIVED]

> **Failure mode — Nonempty context, empty target.** *Symptom:* NaN or a silent zero-loss step. *Cause:* truncation or an absent assistant span. *Detection:* shifted-mask mass zero. *Mitigation:* reject or explicitly skip before optimizer commitment. [DERIVED]

## Siblings

[DERIVED] [Pretraining objectives](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/README.md) select a different empirical target population. [Adaptation mechanisms](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/README.md) change the trainable parameterization while the SFT objective can remain fixed. Preference optimization is downstream in Chapter 33; replacing demonstrations with pairwise comparisons changes the feedback contract, not merely the mask.

```figure
id: fig-31.6
kind: matrix
title: Context and supervision independence
caption: Rows are context visibility and loss inclusion; columns are a prompt token and an assistant token. A prompt is visible
  without being a supervised target.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.1
alt: Each filled cell denotes an admitted relationship. Rows are context visibility and loss inclusion; columns are a prompt
  token and an assistant token. A prompt is visible without being a supervised target.
spec:
  rows: 2
  cols: 2
  pattern: explicit
  cells:
  - - 1
    - 1
  - - 0
    - 1
  rowLabel: contract
  colLabel: token region
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

## Extensions

### Improvements

[DERIVED] Rank-aware weighting supplies a documented 2026 alternative to uniform weights [R31.2]; it is not a successor that invalidates uniform conditional maximum likelihood. A comparison must hold masks, data, trainable tensors and generation protocol fixed. The source's rank statistic costs additional vocabulary work; this chapter does not convert an unmeasured auxiliary pass into a negligible overhead claim.

## Limitations

[MATHEMATICALLY-DERIVED] Teacher-forced loss evaluates supplied histories. The distribution of model-generated histories is a different measure; small training loss alone does not bound task failure there without coverage and stability conditions. Token probabilities do not certify factual truth. The present objective also says nothing about privacy leakage or a tool's authorization boundary; those require independent evaluation and runtime enforcement.

## Reproducibility

[DERIVED] Retain tokenizer and template hashes, raw example identifiers, rendered tokens, shifted masks, detached weights, legal contexts, total numerator/mass, accumulation schedule, collective convention and optimizer-state version. Record whether terminal tokens are targets. [UNVERIFIED] GPU numerical parity and the adaptive method's experimental claims have not been independently executed. The proposed falsification protocol is in [verification](verification.md).

## References

[R31.1] TRL v1.13.0 tagged trainer and docs, inspected 2026-10-09. [R31.2] RankTuner v1, §§4–5 and Appendix B, inspected 2026-10-09. Source identities, first dates and excluded surfaces are in [references](references.md).
