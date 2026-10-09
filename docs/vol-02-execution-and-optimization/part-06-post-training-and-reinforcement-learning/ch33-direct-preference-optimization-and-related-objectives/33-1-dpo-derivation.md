---
id: "ms.section.33.1"
entity_type: "section"
title: "DPO derivation"
short_title: "DPO derivation"
volume: 2
part: 6
chapter: 33
section: 33.1
slug: "33-1-dpo-derivation"
parent: "ms.chapter.33"
prev_sibling: null
next_sibling: "ms.section.33.2"
children: []
prerequisites: ["ms.chapter.2", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32"]
downstream: ["ms.chapter.34", "ms.chapter.35", "ms.chapter.36"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["preference_optimization", "offline_optimization"], "feedback_setting": ["human_preference", "ai_feedback", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.hugging-face-trl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 33.1 — DPO derivation

## Scope

[DERIVED] Derive a response-level preference objective from a declared KL-regularized reward problem, then identify the additional feedback, support and realizability assumptions needed to train a parameterized policy. The baseline is an instruction-tuned conditional policy. Success means an auditable relationship between its probability ratios and an observed comparison likelihood; it does not mean that likelihood fit guarantees task correctness. This section owns the derivation. Annotation design belongs to Chapter 32, and policy-gradient estimators belong to Chapter 34.

## Why this exists

[DERIVED] An explicit reward model followed by policy optimization creates two estimation problems and an interface between their units. A direct objective can eliminate that learned intermediate module when a particular preference likelihood and policy reparameterization agree. The computational simplification does not eliminate the statistical assumptions. The label still describes a comparison drawn from a particular response population, and a model can fit it while remaining poor outside that population.

[PAPER-REPORTED] The 2026 rating-informed study treats response comparisons and numerical rating gaps as different supervision channels [R33.1, §§2–4]. This distinction motivates keeping the underlying reward objective separate from the data likelihood. A rating is not automatically the latent utility that a binary choice model assumes.

[DERIVED] The dominant constraint is identification. Preference data often constrain differences between a few candidate responses. They do not reveal a prompt's additive reward offset, a missing response's quality, or an absolute likelihood target for the chosen response. Substituting policy log ratios produces a trainable surrogate, but these information limits remain. A technically valid derivation must expose them before discussing optimization speed.

## Intuition

[MATHEMATICALLY-DERIVED] A reference policy supplies a probability measure. Exponentiating reward tilts that measure toward higher-utility responses, while a positive KL coefficient limits the tilt. A same-prompt comparison removes the normalizing constant because both candidates share it. The resulting logit is a difference of reference-relative sequence log probabilities. This cancellation is about a common conditioning event; it does not license cancellation between different prompts or arbitrary autoregressive histories.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $x\sim\nu$ | Prompt and its target population | Prompt |
| $y\in\mathcal Y_x$ | Complete response, including declared terminator | Token sequence |
| $q(y\mid x)$ | Frozen reference distribution | Probability |
| $r(x,y)$ | Declared scalar utility | Reward units |
| $\beta>0$ | KL penalty coefficient | Reward units per nat |
| $\pi_\theta(y\mid x)$ | Parameterized trainable policy | Probability |
| $z\in\{0,1\}$ | Preference for first candidate in an unordered pair | Binary outcome |

> **Assumption.** [ASSUMED] For each prompt use a finite response set, or a countable set with finite $Z_\beta(x)$ and the integrability required below; $q>0$ on the admitted set. Policies satisfy $\pi\ll q$, and the compared responses have strictly positive policy probability. *Sensitivity:* a zero reference probability forbids finite-KL mass there; an infinite partition function invalidates the claimed optimum.

[MATHEMATICALLY-DERIVED] Define, for one prompt,

$$
J_\beta(\pi;x)=\sum_y\pi(y\mid x)r(x,y)-\beta\sum_y\pi(y\mid x)\log\frac{\pi(y\mid x)}{q(y\mid x)},\qquad
Z_\beta(x)=\sum_yq(y\mid x)e^{r(x,y)/\beta}.
$$
*(Eq. 33.1)*

where the sums range over the declared response support; $0\log0=0$ and a positive numerator over zero reference mass has infinite KL.

[MATHEMATICALLY-DERIVED] Let $\pi^*(y\mid x)=q(y\mid x)e^{r(x,y)/\beta}/Z_\beta(x)$. Substitution gives

$$
J_\beta(\pi;x)=\beta\log Z_\beta(x)-\beta\operatorname{KL}(\pi\Vert\pi^*),\qquad
r(x,y)=\beta\log\frac{\pi^*(y\mid x)}{q(y\mid x)}+\beta\log Z_\beta(x).
$$
*(Eq. 33.2)*

The nonnegative KL proves optimality and uniqueness as a distribution on the admitted support. It says nothing about whether a particular neural parameterization can realize that distribution or whether gradient training reaches it.

```figure
{
  "id": "fig-33.1",
  "kind": "diagram",
  "title": "From reward problem to comparison likelihood",
  "caption": "The policy optimum and the label model are separate assumptions. Only their combination yields a response-level direct preference loss.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.2",
  "alt": "The policy optimum and the label model are separate assumptions. Only their combination yields a response-level direct preference loss.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "q",
        "kind": "state",
        "label": "Frozen reference measure"
      },
      {
        "id": "r",
        "kind": "objective",
        "label": "Utility and positive beta"
      },
      {
        "id": "tilt",
        "kind": "process",
        "label": "Normalized exponential tilt"
      },
      {
        "id": "bt",
        "kind": "objective",
        "label": "Binary comparison model"
      },
      {
        "id": "ratio",
        "kind": "tensor",
        "label": "Same-prompt log ratios"
      },
      {
        "id": "loss",
        "kind": "objective",
        "label": "Empirical preference loss"
      }
    ],
    "edges": [
      {
        "from": "q",
        "to": "tilt"
      },
      {
        "from": "r",
        "to": "tilt"
      },
      {
        "from": "tilt",
        "to": "ratio"
      },
      {
        "from": "bt",
        "to": "loss"
      },
      {
        "from": "ratio",
        "to": "loss"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-33.2",
  "kind": "calculator",
  "title": "Two-response KL optimum",
  "caption": "Analytical two-action response set. Change reference mass, utility gap and positive beta to see the normalized optimum; this is not an LLM benchmark.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.2",
  "alt": "Analytical two-action response set. Change reference mass, utility gap and positive beta to see the normalized optimum; this is not an LLM benchmark.",
  "spec": {
    "tex": "\\pi^*(a)=\\frac{q(a)e^{d/\\beta}}{q(a)e^{d/\\beta}+1-q(a)}",
    "equation": "33.2",
    "inputs": [
      {
        "symbol": "q",
        "label": "Reference mass of a",
        "default": 0.4,
        "min": 0.1,
        "max": 0.9,
        "step": 0.1,
        "format": "raw"
      },
      {
        "symbol": "d",
        "label": "Utility gap",
        "default": 1,
        "min": -2,
        "max": 2,
        "step": 0.1,
        "format": "fixed3"
      },
      {
        "symbol": "b",
        "label": "KL coefficient beta",
        "default": 1,
        "min": 0.2,
        "max": 2,
        "step": 0.1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "Optimal mass of a",
        "formula": "q*exp(d/b)/(q*exp(d/b)+1-q)",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "Z",
        "label": "Partition value",
        "formula": "q*exp(d/b)+1-q",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Reference prior",
      "variables": {
        "d": 0
      }
    },
    {
      "anchor": "mechanism",
      "label": "Reward tilts reference",
      "variables": {
        "d": 1
      }
    },
    {
      "anchor": "limitations",
      "label": "Stronger KL price",
      "variables": {
        "d": 1,
        "b": 2
      }
    }
  ]
}
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] The identity follows by expanding $\log(\pi/\pi^*)=\log(\pi/q)-r/\beta+\log Z$. Multiplication by $\pi$ and summation uses $\sum_y\pi(y\mid x)=1$. For countably infinite sequences one must ensure the expectations exist; exchanging undefined differences of infinite expectations is not a proof. A bounded reward on a normalized reference makes $Z$ finite and positive. An unbounded reward requires its own exponential-moment condition.

[MATHEMATICALLY-DERIVED] Now declare the response-level Bradley–Terry observation model $P(z=1\mid x,a,b)=\sigma(r(x,a)-r(x,b))$, where reward has already been expressed in the comparison model's noise units. If an explicit comparison temperature $s>0$ is retained, the logit is $(r_a-r_b)/s$ and the policy log-ratio coefficient becomes $\beta/s$. Mixing these conventions while calling both parameters beta changes the model. An additive prompt-only shift in reward leaves both the tilted policy and comparison probabilities unchanged.

[MATHEMATICALLY-DERIVED] Under policy realizability, replace the unknown optimum by a candidate $\pi_\theta$ and define

$$
g_\theta(x,y)=\log\pi_\theta(y\mid x)-\log q(y\mid x),\quad
\Delta_\theta=g_\theta(x,y^+)-g_\theta(x,y^-),\quad
\ell_{\mathrm{DPO}}=\log(1+e^{-\beta\Delta_\theta}).
$$
*(Eq. 33.3)*

where $y^+$ is the observed preferred candidate, not a globally optimal response. The partition term cancels because the two responses share $x$. The empirical objective averages this loss over valid comparisons, with any nonuniform weights declared separately.

[MATHEMATICALLY-DERIVED] The loss derivative with respect to the margin is $-\beta\sigma(-\beta\Delta_\theta)$. Thus

$$
\nabla_\theta\ell=-\beta\sigma(-\beta\Delta_\theta)
\left(\nabla_\theta\log\pi_\theta(y^+\mid x)-\nabla_\theta\log\pi_\theta(y^-\mid x)\right).
$$
*(Eq. 33.4)*

Reference gradients are zero only when the reference is actually frozen. The update favors a relative score difference; shared neural parameters and probability normalization prevent an unconditional claim that every chosen sequence's likelihood increases.

[MATHEMATICALLY-DERIVED] In a finite unconstrained comparison model with a consistently preferred edge, increasing its margin drives its loss toward zero without attaining a finite minimum. Contradictory or probabilistic labels can provide a finite optimum for that edge. Generalization, regularization, early stopping and capacity restrictions therefore matter independently of the closed-form reward optimum. The latter optimizes a known reward; empirical direct training estimates a policy from incomplete comparisons.

[DERIVED] The data pipeline must preserve the comparison unit. Deduplicate prompt families before splitting; retain both response strings and their token boundaries; record annotation identity and orientation; reject empty or support-invalid comparisons. Reordering a pair requires flipping its binary label. A deterministic all-chosen-first training representation is convenient, but calibration needs randomized orientation or explicit representation of both outcomes. A mask change alters which sequence event is scored, even if its visible text is unchanged.

```figure
{
  "id": "fig-33.3",
  "kind": "chart",
  "title": "Relative margin and binary loss",
  "caption": "This analytical curve illustrates a single correctly oriented comparison. Low training loss alone does not identify task quality or out-of-support behavior.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.3",
  "alt": "This analytical curve illustrates a single correctly oriented comparison. Low training loss alone does not identify task quality or out-of-support behavior.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Reference-relative margin",
      "domain": [
        -6,
        6
      ]
    },
    "y": {
      "label": "Binary negative log likelihood"
    },
    "variables": {
      "b": 1
    },
    "series": [
      {
        "id": "loss",
        "label": "Response comparison loss",
        "formula": "ln(1+exp(-b*x))",
        "sample": {
          "from": -6,
          "to": 6,
          "count": 33
        },
        "emphasis": true,
        "dashed": false
      }
    ],
    "annotations": [
      {
        "x": 0,
        "y": 0.6931471805599453,
        "label": "Indifference loss ln2"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-33.4",
  "kind": "matrix",
  "title": "What one comparison identifies",
  "caption": "Rows represent the observed edge, prompt offset, unobserved response and task outcome. Only the edge logit is directly constrained by this likelihood. These are logical dependencies, not measurements.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.3",
  "alt": "Rows represent the observed edge, prompt offset, unobserved response and task outcome. Only the edge logit is directly constrained by this likelihood. These are logical dependencies, not measurements.",
  "spec": {
    "rows": 4,
    "cols": 3,
    "pattern": "explicit",
    "cells": [
      [
        1,
        0,
        0
      ],
      [
        0,
        0,
        0
      ],
      [
        0,
        0,
        0
      ],
      [
        0,
        0,
        0
      ]
    ],
    "rowLabel": "Edge / offset / missing / task",
    "colLabel": "Fit / absolute utility / task",
    "legend": "Filled = required; empty = not sufficient alone."
  }
}
```

## Algorithm

### Algorithm 33.1 — Bounded response-level preference update

[DERIVED] Inputs are a finite pair dataset, immutable reference, tokenizer/mask contract, positive beta, optimizer, maximum update count $K$ and finite cursor-attempt cap $A$. Initialize $k=0$, attempt counter $a=0$ and the declared data cursor. Output is a terminal checkpoint and a ledger of admitted/rejected pairs. State comprises $\theta_k$, optimizer moments, update index and deterministic data cursor. This is an explanatory reconstruction, not an executed trainer.

$$
\begin{aligned}
1.&\quad a\leftarrow a+1;\quad (x,y^+,y^-)\leftarrow\operatorname{next\_batch}(D,a);\quad M\leftarrow\operatorname{validate\_tokens\_support}(x,y^+,y^-).\\
2.&\quad |M|=0\ \Longrightarrow\ \operatorname{record\_empty\_batch};\quad a<A\ ?\ \operatorname{continue\_at\_1}\ :\ \operatorname{stop\_with\_ledger}.\\
3.&\quad l^\pm\leftarrow\operatorname{masked\_sequence\_logp}(\pi_{\theta_k},M^\pm);\quad h^\pm\leftarrow\operatorname{stopgrad}(\log q(M^\pm)).\\
4.&\quad d_i\leftarrow(l_i^+-h_i^+)-(l_i^--h_i^-);\quad L\leftarrow |M|^{-1}\sum_i\operatorname{softplus}(-\beta d_i).\\
5.&\quad \neg\operatorname{finite}(L,\nabla L)\ \Longrightarrow\ \operatorname{fail\_with\_batch\_identity}.\\
6.&\quad (\theta_{k+1},s_{k+1})\leftarrow\operatorname{optimizer}(\theta_k,s_k,\nabla L);\quad k\leftarrow k+1.\\
7.&\quad k=K\ \lor\ a=A\ \lor\ \operatorname{declared\_early\_stop}\ \Longrightarrow\ \operatorname{save}(\theta_k,s_k,\operatorname{ledger}).
\end{aligned}
$$
*(Eq. 33.5)*

[DERIVED] The invariant is one immutable reference and one declared scoring event per comparison. Skipped batches cannot silently advance an optimizer schedule whose contract counts successful updates. A finite cursor traversal or rejected-batch limit prevents endless retry. Batched scoring requires two response branches per pair; the loss arithmetic is linear in valid response tokens after model evaluation. Reference scoring adds a forward pass over the same branches unless cached, and a full reference copy adds parameter residency independently of trainable optimizer state.

## Implementation

[OFFICIAL-DOCUMENTATION] Hugging Face TRL, **Post-training / RL**, v1.13.0 exposes the sigmoid comparison loss and masked completion log-probability summation [R33.5–R33.6, `compute_ref_log_probs`, `_compute_loss`]. This is a tagged 2026 implementation fact, not a claim that the underlying foundation originated in 2026.

[DERIVED] The tensor path is paired token streams to causal logits to shifted target-token log probabilities to masked sums to one scalar margin per pair. The logits can occupy $O(BTV)$ elements for batch $B$, sequence length $T$ and vocabulary $V$; selective/fused paths can avoid retaining the full projection, but the exact kernel and reduction policy require their own parity check. Activations, optimizer moments, reference parameters and padding remain separate memory categories. Data-parallel workers must aggregate comparison numerators and valid-pair counts, rather than averaging unequal local means.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R33.1 §6 and Appendix F compare rating-informed losses on UltraFeedback using Zephyr-7B-SFT, Mistral-7B-SFT and Llama-3.1-Tulu-3-8B-SFT. Its rating-trust sweep is evidence about that augmented objective, not a standalone test of Eq. 33.2.

| Protocol field | Inspected disclosure |
|---|---|
| Evaluation | AlpacaEval / ArenaHard; Claude Sonnet 3.5 v2 judge against GPT-4 answers |
| Optimization | Most sequence losses: beta0.1, learning rate1e-6; IPO uses a different normalized recipe |
| Uncertainty | Fig1 varies reference models; Appendix F distinguishes prompt uncertainty |
| Hardware / precision / training seeds | NOT-DISCLOSED in the inspected experimental account |

## Observations

**What the paper claims.** [PAPER-REPORTED] Accurate rating information can improve statistical guarantees under its stated assumptions [R33.1, Theorems4.3–4.4].

**What the evidence shows.** [DERIVED] That claim depends on rating accuracy, realizability and coverage; it does not equate empirical preference fitting with solving every neural reward problem.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 33.1–4 justify a particular ratio likelihood under explicit conditions. They leave additive offsets and unobserved actions unidentified.

**What remains unknown.** [UNVERIFIED] This edition has not trained a policy or independently reproduced those experiments.

```figure
{
  "id": "fig-33.5",
  "kind": "compare",
  "title": "Three objectives that must remain distinct",
  "caption": "The known-reward variational problem, observed-label likelihood and deployment task have different inputs and success criteria.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.3",
  "alt": "The known-reward variational problem, observed-label likelihood and deployment task have different inputs and success criteria.",
  "spec": {
    "axis": "What is optimized",
    "columns": [
      {
        "id": "reward",
        "label": "Known reward problem"
      },
      {
        "id": "label",
        "label": "Comparison fitting"
      },
      {
        "id": "task",
        "label": "Task evaluation"
      }
    ],
    "rows": [
      {
        "dimension": "Input",
        "values": {
          "reward": "Utility on admitted support",
          "label": "Observed candidate pairs",
          "task": "New prompts and generated answers"
        }
      },
      {
        "dimension": "Quantity",
        "values": {
          "reward": "Expected reward minus KL",
          "label": "Binary negative log likelihood",
          "task": "Independent correctness or utility"
        }
      },
      {
        "dimension": "Guarantee",
        "values": {
          "reward": "Distribution optimum under premises",
          "label": "Fit on observed measure",
          "task": "Measured only by task protocol"
        }
      }
    ]
  }
}
```

## Failure modes

> **Failure mode — Invalid partition.** [DERIVED] *Symptom:* a claimed optimum cannot be normalized. *Cause:* unbounded utility without exponential integrability. *Detection:* check the partition condition in the declared response space. *Mitigation:* restrict support or establish the required moment bound before applying the identity.

> **Failure mode — False absolute improvement.** [DERIVED] *Symptom:* increasing margin is reported as increasing chosen quality. *Cause:* a relative score is mistaken for an absolute task measure. *Detection:* log both branch likelihoods and independent task outcomes. *Mitigation:* retain all three quantities separately.

## Siblings

[DERIVED] IPO changes the finite margin target, KTO changes feedback from pairs to labeled responses, and ORPO combines chosen likelihood with odds contrast; their canonical treatment is [§33.3](33-3-objective-families.md). Explicit reward modeling in Chapter32 retains a learned reward interface. Policy gradients in Chapter34 sample an action measure and estimate a different update; direct preference training does not become on-policy RL merely because its data were generated recently.

## Extensions

### Improvements

[DERIVED] Rating gaps, prefix feedback and prompt-dependent scales change distinct parts of this construction: supervision, observation factorization and comparison units. The eligible 2026 studies are taught at their owning sections. Their experiments cannot establish that every change dominates ordinary sigmoid training. No older founding paper is admitted through a newer revision date.

## Limitations

[DERIVED] The response-level likelihood assumes a coherent scalar comparison model in fixed units. Intransitive preferences, annotator mixtures, ties and selection mechanisms can violate it. Neural expressivity and finite optimization introduce additional approximation even if the feedback model is correct. The derivation supplies no task-level lower bound without a link between utility, deployment distribution and measured outcomes.

## Reproducibility

[DERIVED] Record the exact response support, terminator policy, beta convention, label orientation, valid-pair denominator, reference revision, initialization and optimizer/data state. Retain every rejected pair and reason. The unexecuted falsification protocol is in [verification](verification.md). Analytical figures evaluate declared equations; they contain no fabricated experimental points.

```figure
{
  "id": "fig-33.6",
  "kind": "systems-trace",
  "title": "Derivation premises enter at different transitions",
  "caption": "Eq.33.2 requires positive common support and a finite partition before preference fitting. Realizability and independent outcome evaluation are separate transitions; no measured hardware quantities are asserted.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.2",
  "alt": "A derivation trace checks reference support, exponential normalization, comparison likelihood, approximation/realizability and final evaluation in that order. Failure at an early premise cannot be repaired by a small final training loss.",
  "spec": {
    "columns": [
      "compute",
      "memory",
      "failure"
    ],
    "stages": [
      {
        "name": "Reference measure",
        "values": {
          "compute": "Define positive common support",
          "memory": "Frozen reference identity",
          "failure": "Zero reference mass removes support"
        }
      },
      {
        "name": "Normalized optimum",
        "values": {
          "compute": "Finite exponential partition",
          "memory": "Reward and beta units",
          "failure": "Infinite partition invalidates optimum"
        }
      },
      {
        "name": "Comparison construction",
        "values": {
          "compute": "Declared binary event likelihood",
          "memory": "Chosen/rejected identity",
          "failure": "Ties or shifted feedback need another model"
        }
      },
      {
        "name": "Policy fitting",
        "values": {
          "compute": "Realizable optimum or stated approximation",
          "memory": "Trainable policy state",
          "failure": "Low pair loss does not identify all probabilities"
        }
      },
      {
        "name": "Independent outcome",
        "values": {
          "compute": "Frozen task/checker evaluation",
          "memory": "Untouched audit records",
          "failure": "Preference fit is not correctness"
        }
      }
    ]
  },
  "anchor": "limitations"
}
```

## References

[R33.1](references.md#r331), [R33.5](references.md#r335), [R33.6](references.md#r336). Eqs. 33.1–5 are explanatory mathematical reconstructions under the stated premises, with no claim of historical novelty.
