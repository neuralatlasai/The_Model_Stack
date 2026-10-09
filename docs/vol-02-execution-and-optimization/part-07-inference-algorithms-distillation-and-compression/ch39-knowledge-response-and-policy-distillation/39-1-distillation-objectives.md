---
id: "ms.section.39.1"
entity_type: "section"
title: "39.1 — Distillation objectives"
short_title: "39.1 — Distillation objectives"
volume: 2
part: 7
chapter: 39
section: 39.1
slug: "39-1-distillation-objectives"
parent: "ms.chapter.39"
prev_sibling: null
next_sibling: "ms.section.39.2"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.37", "ms.chapter.38"]
downstream: ["ms.chapter.40", "ms.chapter.41", "ms.chapter.42", "ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "adaptation", "inference"], "mechanism": ["distillation", "distribution_matching"], "feedback_setting": ["ai_feedback", "verifiable_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: ["impl.pytorch", "impl.megatron-lm", "impl.verl", "impl.vllm", "impl.sglang"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2200
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 39.1 — Distillation objectives

## Scope

[DERIVED] This section specifies what a teacher–student objective actually transfers: a conditional categorical law, a sampled response, or an intermediate representation. The baseline is response-only supervised fine-tuning from Chapter 31. The success criterion is a loss whose support, temperature, mask, denominator and gradient agree with its stated information access. It does not equate agreement with correctness or establish that a smaller network can realize its teacher.

## Why this exists

[DERIVED] Replacing a teacher's response by a one-hot target destroys information about competing continuations. Replacing that one-hot target by a distribution preserves alternatives, but introduces choices with different mathematical consequences: which model supplies the expectation, which temperature defines each law, and whether low-probability teacher tokens remain available. A large loss can reflect a wrong student, an unreliable teacher, a mismatched prefix or a missing tail. These causes require different interventions.

[PAPER-REPORTED] The 2026 CaRE-KD study explicitly questions teacher reliability and switches between forward and reverse KL using normalized entropy [R39.2, §§2–3]. The offline top-k study changes the information retained from the teacher to remove online execution [R39.1, §3]. RED combines representation alignment and language-model supervision while changing the student initialization [R39.9, §5; Appendices B–C]. These are distinct interventions. They should not be described as interchangeable ways of implementing the same objective.

## Intuition

[MATHEMATICALLY-DERIVED] Forward KL averages penalties under the teacher and therefore penalizes missing teacher-supported alternatives. Reverse KL averages under the student and severely penalizes student mass assigned where the teacher has almost none. Their familiar coverage and concentration descriptions are tendencies of a specified distribution pair, not guarantees of a neural optimizer. Temperature changes both distributions before either direction is computed. A feature loss compares coordinates whose identities and dimensions must first be aligned.

## Formulation

> **Definition — Distillation temperature.** [DERIVED] A positive scalar defining the soft-target teacher and student laws by scaling their logits before normalization. Its value and loss scaling are separate parts of the objective.

| Symbol | Definition and unit |
|---|---|
| $p_t^\tau,q_t^\tau$ | Frozen teacher and trainable student categorical laws at the same prefix; probability |
| $a_t,z_t\in\mathbb R^V$ | Teacher and student logits; dimensionless |
| $m_t,Z_m$ | Response mask and its positive token count, $Z_m=\sum_t m_t$ |
| $\tau>0,\lambda\in[0,1]$ | Shared temperature and soft-target mixing weight |
| $\phi(j),A_j$ | Declared teacher-layer correspondence and student-to-teacher width map |

[MATHEMATICALLY-DERIVED] With finite logits on a common vocabulary,

$$
\begin{aligned}
p_{tv}^\tau&=\frac{e^{a_{tv}/\tau}}{\sum_u e^{a_{tu}/\tau}},&q_{tv}^\tau&=\frac{e^{z_{tv}/\tau}}{\sum_u e^{z_{tu}/\tau}},\\
F_t&=\sum_vp_{tv}^\tau\log\frac{p_{tv}^\tau}{q_{tv}^\tau},&R_t&=\sum_vq_{tv}^\tau\log\frac{q_{tv}^\tau}{p_{tv}^\tau},\\
\mathcal L&=\frac{1}{Z_m}\sum_tm_t\left[\lambda\tau^2F_t-(1-\lambda)\log q_{t,y_t}^{1}\right].
\end{aligned}
$$
*(Eq. 39.1)*

where soft targets use temperature $\tau$ on both models while hard-label likelihood uses temperature one. The token denominator makes longer responses contribute more total weight; an example mean is a different objective. Prompt tokens remain visible as context while their target mask is zero. Teacher gradients are disabled.

[MATHEMATICALLY-DERIVED] Differentiating the softmax normalizer gives

$$
\begin{aligned}
\frac{\partial(\tau^2F_t)}{\partial z_{tv}}&=\tau(q_{tv}^\tau-p_{tv}^\tau),\\
\frac{\partial(\tau^2R_t)}{\partial z_{tv}}&=\tau q_{tv}^\tau\left(\log\frac{q_{tv}^\tau}{p_{tv}^\tau}-R_t\right).
\end{aligned}
$$
*(Eq. 39.2)*

where each gradient sums to zero across vocabulary. Without $\tau^2$, the corresponding prefactor is $1/\tau$. At high temperature with fixed bounded logits, $q^\tau-p^\tau$ is approximately $(z-\bar z-a+\bar a)/(V\tau)$; multiplying by $\tau$ prevents this particular gradient from vanishing as $1/\tau^2$. This asymptotic explanation does not make gradient magnitudes identical at every temperature, and does not compensate for changed entropy, support truncation or loss reduction.


```figure
{
  "id": "fig-39.1",
  "kind": "calculator",
  "title": "Temperature and two-action distillation",
  "caption": "Analytical two-action laws use the same positive temperature. The displayed gradient includes tau squared; these values are not model measurements.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.1",
  "alt": "Analytical two-action laws use the same positive temperature. The displayed gradient includes tau squared; these values are not model measurements.",
  "spec": {
    "tex": "p=\\sigma(a/\\tau),\\ q=\\sigma(z/\\tau),\\ \\partial_z(\\tau^2F)=\\tau(q-p)",
    "equation": "39.1",
    "inputs": [
      {
        "symbol": "a",
        "label": "Teacher logit gap",
        "default": 2,
        "min": -6,
        "max": 6,
        "step": 0.1,
        "scale": "linear",
        "format": "fixed2"
      },
      {
        "symbol": "z",
        "label": "Student logit gap",
        "default": 0.5,
        "min": -6,
        "max": 6,
        "step": 0.1,
        "scale": "linear",
        "format": "fixed2"
      },
      {
        "symbol": "tau",
        "label": "Shared temperature",
        "default": 1,
        "min": 0.25,
        "max": 8,
        "step": 0.05,
        "scale": "linear",
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "Teacher first-action mass",
        "formula": "1/(1+exp(-a/tau))",
        "format": "raw"
      },
      {
        "symbol": "q",
        "label": "Student first-action mass",
        "formula": "1/(1+exp(-z/tau))",
        "format": "raw"
      },
      {
        "symbol": "g",
        "label": "Soft loss gradient",
        "formula": "tau*(1/(1+exp(-z/tau))-1/(1+exp(-a/tau)))",
        "format": "fixed3"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] CaRE's confidence score is $c(r)=1-H(r)/\log V$. Let $g=\sigma(c(p)-c(q)-\delta)$ for its differentiable soft gate and $\delta$ its margin. The local blend is $gF+(1-g)R$. Its derivative contains the usual weighted KL derivatives and the additional term $(F-R)\nabla g$. Since $\nabla g=-g(1-g)\nabla c(q)$, the gate contribution to a **negative-gradient update** is $g(1-g)(F-R)\nabla c(q)$. The direction depends on the divergence difference, not entropy order alone. For $p=(.1,.2,.7)$ and $q=(.8,.1,.1)$, $H(p)>H(q)$, yet $F\approx1.2928<R\approx1.3997$. This finite counterexample limits an entropy-only interpretation; it does not invalidate the reported optimization comparisons [R39.2, §3].

[MATHEMATICALLY-DERIVED] Because normalized confidence lies in $[0,1]$, the unscaled zero-margin gate lies in $[\sigma(-1),\sigma(1)]\approx[.269,.731]$. It never selects a nearly pure KL direction. A hard gate, detached before differentiation, is a different method. An additional slope could change this range, but is not silently inserted into the inspected formulation. Confidence also describes distribution concentration, not factual accuracy.

[DERIVED] A representation term can be defined after declaring layer and width correspondence:

$$
\mathcal L_{\rm rep}=\frac{1}{Z_m}\sum_{t,j}\frac{\omega_jm_t}{d_j}
\left\|h^{S}_{tj}A_j-\operatorname{sg}(h^{T}_{t,\phi(j)})\right\|_2^2.
$$
*(Eq. 39.3)*

where $h^S_{tj}\in\mathbb R^{d^S_j}$, $A_j\in\mathbb R^{d^S_j\times d_j}$ and $h^T\in\mathbb R^{d_j}$. This is a book-defined width-normalized version; RED's Appendix B uses its own token-normalized Frobenius expression. Dividing by width changes the relative scale and must be recorded. Token alignment, padding removal and whether a map is trainable are part of the objective. Equal tensor shapes do not establish that residual coordinates have the same meaning.


```figure
{
  "id": "fig-39.2",
  "kind": "diagram",
  "title": "Three supervision interfaces",
  "caption": "The distribution, observed response and hidden feature supply different targets. Each branch needs its own alignment and normalization contract.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.1",
  "alt": "The distribution, observed response and hidden feature supply different targets. Each branch needs its own alignment and normalization contract.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "p",
        "kind": "tensor",
        "label": "Teacher conditional law"
      },
      {
        "id": "y",
        "kind": "dataset",
        "label": "Observed response target"
      },
      {
        "id": "h",
        "kind": "tensor",
        "label": "Aligned teacher features"
      },
      {
        "id": "f",
        "kind": "objective",
        "label": "Forward or reverse KL"
      },
      {
        "id": "ce",
        "kind": "objective",
        "label": "Masked hard-label CE"
      },
      {
        "id": "rep",
        "kind": "objective",
        "label": "Mapped feature distance"
      },
      {
        "id": "s",
        "kind": "model",
        "label": "Student parameter update"
      }
    ],
    "edges": [
      {
        "from": "p",
        "to": "f"
      },
      {
        "from": "y",
        "to": "ce"
      },
      {
        "from": "h",
        "to": "rep"
      },
      {
        "from": "f",
        "to": "s"
      },
      {
        "from": "ce",
        "to": "s"
      },
      {
        "from": "rep",
        "to": "s"
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.3",
  "kind": "chart",
  "title": "Soft confidence gate has bounded reach",
  "caption": "With zero margin and normalized confidence difference between minus one and one, the unscaled sigmoid stays between .269 and .731. It is not a hard switch.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.1",
  "alt": "With zero margin and normalized confidence difference between minus one and one, the unscaled sigmoid stays between .269 and .731. It is not a hard switch.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Confidence difference",
      "format": "raw"
    },
    "y": {
      "label": "Gate weight",
      "format": "fixed3"
    },
    "series": [
      {
        "id": "s0",
        "label": "Unscaled sigmoid",
        "points": [
          [
            -1.0,
            0.2689414213699951
          ],
          [
            -0.9,
            0.289050497374996
          ],
          [
            -0.8,
            0.31002551887238755
          ],
          [
            -0.7,
            0.3318122278318339
          ],
          [
            -0.6,
            0.35434369377420455
          ],
          [
            -0.5,
            0.3775406687981454
          ],
          [
            -0.3999999999999999,
            0.401312339887548
          ],
          [
            -0.29999999999999993,
            0.4255574831883411
          ],
          [
            -0.19999999999999996,
            0.45016600268752216
          ],
          [
            -0.09999999999999998,
            0.47502081252106
          ],
          [
            0.0,
            0.5
          ],
          [
            0.10000000000000009,
            0.52497918747894
          ],
          [
            0.20000000000000018,
            0.549833997312478
          ],
          [
            0.30000000000000004,
            0.574442516811659
          ],
          [
            0.40000000000000013,
            0.5986876601124521
          ],
          [
            0.5,
            0.6224593312018546
          ],
          [
            0.6000000000000001,
            0.6456563062257954
          ],
          [
            0.7000000000000002,
            0.6681877721681662
          ],
          [
            0.8,
            0.6899744811276125
          ],
          [
            0.9000000000000001,
            0.710949502625004
          ],
          [
            1.0,
            0.7310585786300049
          ]
        ]
      }
    ]
  }
}
```


[DERIVED] The full-vocabulary local losses take $O(Z_mV)$ arithmetic after output projection and require stable log-normalizers. Feature matching adds $O(Z_m\sum_jd^S_jd_j)$ for dense maps and potentially many retained activations. Teacher forward work, response generation and cache construction are additional costs. A loss coefficient does not reveal their monetary or memory contribution.

## Algorithm

**Algorithm 39.1 — Masked conditional distillation transaction.** [DERIVED] Inputs are aligned teacher/student tokens, masks, finite logits, a declared direction or gate, positive temperature, nonnegative weights, and positive integer update/attempt budgets $U,J$. Output is either a committed student checkpoint with a loss manifest or a named failure. Teacher parameters and tokenizer identities are immutable during each transaction.

$$
\begin{aligned}
1.&\quad u\leftarrow0;\ j\leftarrow0;\quad \theta_{\rm committed}\leftarrow\theta;\quad N\leftarrow0;\quad Z\leftarrow0.\\
2.&\quad \text{For each batch while }u<U,\ j<J:\ j\leftarrow j+1;\ \text{verify prefix, vocabulary, shift and mask identities.}\\
3.&\quad \text{On mismatch return ALIGNMENT\_FAILURE; compute }Z\leftarrow\sum_tm_t.\\
4.&\quad Z=0\Rightarrow\text{record EMPTY\_TARGET and continue without optimizer or scheduler step.}\\
5.&\quad \text{Compute FP32 log-softmax}(a/\tau),\ \text{log-softmax}(z/\tau);\ \text{reject nonfinite losses.}\\
6.&\quad N\leftarrow\sum_tm_t[\lambda\tau^2D_t+(1-\lambda)\operatorname{CE}_t+\eta\operatorname{REP}_t].\\
7.&\quad \text{Reduce numerator and count under the declared rank convention; backpropagate }N/Z.\\
8.&\quad \text{If gradients or proposed state are nonfinite, rollback and return NUMERICAL\_FAILURE.}\\
9.&\quad \theta_{\rm committed}\leftarrow\operatorname{Update}(\theta);\quad u\leftarrow u+1;\quad\text{append objective manifest.}
\end{aligned}
$$

[DERIVED] Invariants are a frozen teacher within an update, exactly one temperature application, zero loss on masked tokens, globally consistent normalization and no optimizer mutation on empty supervision. Distributed mean-of-gradient implementations need the rank factor from Chapter 31; dividing separately by each rank's count violates a global token mean. Return BUDGET_EXHAUSTED if $J$ attempts do not provide $U$ committed updates. Complexity is bounded by $J$, batch limits and the local costs above. The book procedure is an explanatory contract, not claimed CaRE production code.

## Implementation

[DERIVED] Compute log probabilities with log-softmax and use probabilities only where an expectation requires them. Finite-precision underflow can produce effective zeros despite finite real logits; flooring probabilities changes the loss. A reverse-KL term with student mass outside teacher support is infinite and should trigger a support decision, rather than an unexplained numerical epsilon. Cache the teacher's temperature identity. Changing only the student temperature against a fixed teacher-probability cache is not Eq. 39.1.

[PAPER-REPORTED] CaRE's Revival estimates epistemic uncertainty using Monte Carlo dropout, predictive entropy minus mean stochastic-pass entropy, with running teacher and student quantiles [R39.2, §§2,8]. Its rejection condition compares each model to its own threshold. The threshold percentile is not the joint rejection fraction. Zeroing a scalar loss does not freeze Adam moments, weight decay or a learning-rate scheduler; an actual skipped update requires explicit state control across ranks.


```figure
{
  "id": "fig-39.4",
  "kind": "compare",
  "title": "Gradient and information audit",
  "caption": "Changing the prefix population at the same time as the loss destroys a clean comparison of these information channels.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.1",
  "alt": "Changing the prefix population at the same time as the loss destroys a clean comparison of these information channels.",
  "spec": {
    "axis": "Compare objectives on one frozen prefix population",
    "columns": [
      {
        "id": "f",
        "label": "Forward KL"
      },
      {
        "id": "r",
        "label": "Reverse KL"
      },
      {
        "id": "h",
        "label": "Hard target"
      },
      {
        "id": "m",
        "label": "Feature loss"
      }
    ],
    "rows": [
      {
        "dimension": "Expectation",
        "values": {
          "f": "Teacher",
          "r": "Student",
          "h": "Observed label",
          "m": "Matched feature coordinates"
        }
      },
      {
        "dimension": "Support concern",
        "values": {
          "f": "Missing teacher alternatives",
          "r": "Student mass at teacher zero",
          "h": "Only observed targets",
          "m": "Coordinate and width mapping"
        }
      },
      {
        "dimension": "Additional cost",
        "values": {
          "f": "Full or declared partial law",
          "r": "Full or declared partial law",
          "h": "Target index only",
          "m": "Teacher activations and maps"
        }
      }
    ]
  }
}
```


## Experimental design

### Reported experiments

| Protocol field | CaRE-KD, inspected v1 [R39.2, §4; Appendices 8,10,13] |
|---|---|
| Models and data | Eight teacher–student pairs across instruction, chat, code and math; Dolly15k, UltraChat, WizardCoder and MetaMath families |
| Optimization | LoRA rank16 on attention/MLP linear layers; LR $5\cdot10^{-5}$; temperature selected from .5/1/3/5; default MC passes3 |
| Budget | Small instruction students: batch32, up to20 epochs; larger students: batch8,10 epochs; chat3, code/math2 epochs |
| Hardware/selection | Single A10080GB; validation ROUGE-L checkpoint selection for instruction experiments |
| Evaluation | Instruction temperature.8/top-p.95/cap512; code/math greedy/cap1024; GPT-5 Mini judge temperature0, three calls |
| Uncertainty/artifacts | Five random seeds reported; exact evaluator commits, optimizer-state skip behavior and artifact hashes NOT-DISCLOSED |

[PAPER-REPORTED] Dropout is forced to .1 for stochastic passes and restored afterward; reported uncertainty behavior is not evidence that every architecture's ordinary inference mode has nonzero epistemic variance. Fixed reference/candidate judge ordering remains a possible position effect, despite repeated calls. Single-reference correctness and confidence calibration are different estimands.

## Observations

**What the paper claims.** [PAPER-REPORTED] CaRE combines local confidence-dependent divergence and epistemic rejection to improve teacher-signal reliability [R39.2, §§2–4].

**What the evidence shows.** [PAPER-REPORTED] Table3 reports MBPP62.4 versus60.3 for the strongest listed baseline, GSM8K73.9 versus72.2 and CollegeMath46.1 versus44.3. Results are not uniformly best: Gemma's Dolly score17.0 trails Skewed-RKL19.7, and OpenLLaMA average26.2 trails26.4. Appendix13 reports default CaRE ECE.34 versus forward-KL.22 under its diagnostic, so better task scores do not establish universally better calibration. Factuality-linked masking differences have reported $p=.06$ and $.26$, insufficient for a blanket hallucination-filter claim.

**What we infer.** [DERIVED] Adaptive supervision can change the optimization tradeoff, but the gate's entropy and derivative must be audited separately from the empirical gains. Feature and output matching are complementary information channels whose coefficients cannot be inferred from benchmark scores.

**What remains unknown.** [NOT-DISCLOSED] Exact evaluator revisions, generality beyond the reported families, true teacher-error detection rates and fully specified all-rejected optimizer transitions remain unresolved.


```figure
{
  "id": "fig-39.5",
  "kind": "matrix",
  "title": "Masks control targets without deleting context",
  "caption": "Rows describe context visibility and loss inclusion; columns are prompt and response tokens. Both are visible, while only the response is a target.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.1",
  "alt": "Rows describe context visibility and loss inclusion; columns are prompt and response tokens. Both are visible, while only the response is a target.",
  "spec": {
    "rows": 2,
    "cols": 2,
    "pattern": "explicit",
    "cells": [
      [
        1,
        1
      ],
      [
        0,
        1
      ]
    ],
    "rowLabel": "Quantity",
    "colLabel": "Access or choice",
    "rowTicks": [
      "Visible",
      "Loss target"
    ],
    "colTicks": [
      "Prompt",
      "Response"
    ],
    "legend": "Cell values are the stated quantities; they are not empirical performance."
  }
}
```


```figure
{
  "id": "fig-39.6",
  "kind": "stat-panel",
  "title": "Gate audit",
  "caption": "Keep these three distinctions in view when interpreting adaptive confidence selection. They are analytical limits, not performance estimates.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.1",
  "alt": "Keep these three distinctions in view when interpreting adaptive confidence selection. They are analytical limits, not performance estimates.",
  "spec": {
    "header": "Gate audit",
    "rows": [
      {
        "key": "range",
        "value": ".269 to .731",
        "note": "Zero margin, no extra sigmoid slope"
      },
      {
        "key": "entropy",
        "value": "Concentration only",
        "note": "Not a factuality certificate"
      },
      {
        "key": "skip",
        "value": "State transition",
        "note": "Zero loss alone does not freeze optimizer"
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Temperature or support mismatch.** [DERIVED] *Symptom:* gradients change when a cache is reused under a new temperature, or reverse KL becomes nonfinite. *Cause:* the retained probabilities do not describe the declared law. *Detection:* reconstruct normalization and compare cache identities. *Mitigation:* recompute the teacher distribution or explicitly adopt a different approximation.

[DERIVED] An all-rejected batch can still move parameters through decay and optimizer momentum. Feature maps can absorb a mismatch while the student's output quality deteriorates. A confidence gate can confidently select a wrong teacher. None of these is detected merely by decreasing training loss.

## Siblings

[DERIVED] On a fixed prefix population, hard-label CE transfers one observed target; forward KL transfers teacher-weighted alternatives; reverse KL evaluates student-weighted alternatives; representation loss aligns internal coordinates. Preference objectives from Chapter33 instead encode comparisons. The appropriate comparison axis is information transmitted and resulting gradient, with prefix distribution held fixed. Changing the sampler at the same time prevents attribution to KL direction alone.

## Extensions

### Improvements

[PAPER-REPORTED] Offline top-k targets reduce teacher residency but change the retained law [R39.1, §3; §39.2]. RED changes initialization and temperature together in its main comparison, with a factorial temperature ablation separating them more clearly [R39.9, Table6; §39.5]. CaRE adds selection overhead, including stochastic teacher/student passes; its task gains are not a free reduction in compute.

## Limitations

[DERIVED] These local derivatives assume a fixed prefix. When prefixes are sampled from the student, differentiating the conditional KL alone does not differentiate the sampling distribution. Section39.4 makes that distinction explicit. No finite conditional-law agreement proves factual truth, successful tool use or retention on an untouched domain.

## Reproducibility

[DERIVED] Record temperature on both models, response shift, masks, token/example/rank denominator, KL direction, gate detach behavior, feature correspondence, numerical floors and every optimizer mutation on rejection. The analytical formulas and finite counterexample are reproducible without a GPU. Reported training outcomes remain source observations; no new model experiment was executed for this chapter.

## References

[R39.1](references.md#r391), [R39.2](references.md#r392), [R39.9](references.md#r399). Exact versions, first dates and claim locators are in the chapter ledger.
