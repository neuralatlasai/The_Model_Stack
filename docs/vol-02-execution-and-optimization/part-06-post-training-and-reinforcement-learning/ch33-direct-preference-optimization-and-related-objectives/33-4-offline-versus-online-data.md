---
id: "ms.section.33.4"
entity_type: "section"
title: "Offline versus online data"
short_title: "Offline versus online data"
volume: 2
part: 6
chapter: 33
section: 33.4
slug: "33-4-offline-versus-online-data"
parent: "ms.chapter.33"
prev_sibling: "ms.section.33.3"
next_sibling: "ms.section.33.5"
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

# 33.4 — Offline versus online data

## Scope

[DERIVED] Separate the preference objective from the process that generates its data. The baseline is a fixed offline pair set. This section owns candidate resampling, iterative labeling, stale support, deployment mismatch and accounting for warm-up/harvest pipelines. Success requires a versioned data measure and a controlled interpretation of distribution changes; recent data alone do not make a supervised comparison update an on-policy policy gradient.

## Why this exists

[DERIVED] A fixed dataset is operationally attractive because training can reuse immutable rows and reference scores. Its weakness is that the policy can move toward responses that the dataset never compared. More training then improves fit on familiar edges without providing information about new actions. Replacing the loss cannot manufacture observations outside its data support.

[DERIVED] Online generation addresses one part of this problem by producing candidates from a recent policy. It introduces generation cost, labeling latency, policy-version staleness and a feedback loop: the policy changes which errors are visible, and the selection process changes which prompts become training examples. Iterative optimization must record that loop rather than describe all resulting rows as draws from one stationary dataset.

[PAPER-REPORTED] The2026G2D study deliberately separates online warm-up, frozen-policy harvesting and fresh-initialization offline fitting [R33.4, §2]. This is useful evidence about the data-generation axis; it does not identify an inherent superiority of every offline objective.

## Intuition

[MATHEMATICALLY-DERIVED] An objective is an integrand; a data process supplies its measure. Changing either changes the expected training problem. A recent policy can yield more informative contrast on some prompts while yielding all-correct or all-wrong samples on others. Conditioning on a mixed group reweights the prompt population toward intermediate success probabilities. That may help a specific task, but it is a selection mechanism rather than an unbiased sample of deployment difficulty.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $\mu_t(x,a,b,z)$ | Round-t comparison distribution | Probability measure |
| $\rho_t(y\mid x)$ | Candidate-generating behavior policy | Probability |
| $\nu_*(x)$ | Declared deployment prompt population | Probability |
| $G\ge2$ | Candidate group size | Integer |
| $p_x$ | Success probability under one fixed sampling/verifier contract | Ratio |
| $S$ | Mixed-success selection event | Binary event |
| $L(\theta;\mu)$ | Expected comparison loss under a specified measure | Nats or method-specific loss |

[MATHEMATICALLY-DERIVED] A candidate-generation contract can be decomposed as

$$
\mu_t(x,a,b,z)=\nu_t(x)\,C_t(a,b\mid x;\rho_t)\,A_t(z\mid x,a,b),\qquad
L_t(\theta)=\mathbb E_{\mu_t}[\ell_\theta(x,a,b,z)].
$$
*(Eq. 33.19)*

where $C_t$ includes sampling, deduplication, rejection and pairing, and $A_t$ includes annotator or verifier behavior. This factorization is definitional; it does not assert independent candidates or a correct evaluator.

```figure
{
  "id": "fig-33.19",
  "kind": "diagram",
  "title": "Data generation and optimization are different paths",
  "caption": "A versioned behavior policy creates candidates; selection and labeling define a dataset measure. The trainable policy can restart from a separate initialization.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.19",
  "alt": "A versioned behavior policy creates candidates; selection and labeling define a dataset measure. The trainable policy can restart from a separate initialization.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "init",
        "kind": "model",
        "label": "Declared initialization"
      },
      {
        "id": "warm",
        "kind": "process",
        "label": "Optional bounded warm-up"
      },
      {
        "id": "behavior",
        "kind": "model",
        "label": "Frozen behavior snapshot"
      },
      {
        "id": "sample",
        "kind": "dataset",
        "label": "Generated candidate groups"
      },
      {
        "id": "label",
        "kind": "feedback",
        "label": "Verifier or annotation"
      },
      {
        "id": "select",
        "kind": "branch",
        "label": "Selection and pairing"
      },
      {
        "id": "offline",
        "kind": "process",
        "label": "Offline preference updates"
      },
      {
        "id": "final",
        "kind": "model",
        "label": "Final policy"
      }
    ],
    "edges": [
      {
        "from": "init",
        "to": "warm"
      },
      {
        "from": "warm",
        "to": "behavior"
      },
      {
        "from": "behavior",
        "to": "sample"
      },
      {
        "from": "sample",
        "to": "label"
      },
      {
        "from": "label",
        "to": "select"
      },
      {
        "from": "select",
        "to": "offline"
      },
      {
        "from": "init",
        "to": "offline"
      },
      {
        "from": "offline",
        "to": "final"
      }
    ]
  }
}
```

## Mechanism

### Methodology

#### Fixed datasets and candidate refresh

[DERIVED] A fixed offline run holds prompts, candidates, labels and selection rules constant while changing policy parameters. Its train/held-out split should be by prompt family and provenance, because related candidate rows share information. A fixed held-out preference set measures generalization on that collection process. It does not measure generated-answer quality under the final policy's own response distribution.

[DERIVED] Resampling candidates while keeping prompts and labeling rules fixed changes response coverage. Iterative labeling also changes annotation exposure and may change the judge or its rubric. Refreshing the reference changes the loss anchor. Restarting the optimizer or policy changes initialization and history. These interventions can be combined, but their comparison record must name each one. A dataset refresh is not an isolated objective ablation if it simultaneously switches models, judges and decoding budgets.

[MATHEMATICALLY-DERIVED] At a fixed prompt, represent compared responses as graph vertices and comparisons as oriented edges. Pairwise likelihood constrains utility differences along observed edges. Each disconnected component admits its own additive utility shift without changing those edge probabilities. A new response with no incident edge remains unconstrained by that prompt's data likelihood. Neural parameter sharing can produce an extrapolation, but the graph alone provides no evidence for its sign. Mathematical full support from softmax is therefore much weaker than effective data coverage.

#### Mixed-success selection and pairability

> **Assumption.** [ASSUMED] For the following calculator only, $G$ responses have independent Bernoulli verifier outcomes with common probability $p_x$ under a fixed prompt, behavior snapshot and decoding contract. *Sensitivity:* correlated generations, duplicate outputs or verifier errors invalidate the binomial expression.

[MATHEMATICALLY-DERIVED] A group is pairable when it contains both outcomes:

$$
P(S\mid x)=s_G(p_x)=1-p_x^G-(1-p_x)^G,\qquad G\ge2.
$$
*(Eq. 33.20)*

The expression follows by subtracting the disjoint all-success and all-failure events. It is symmetric around one half and vanishes at the endpoints. More candidates increase pairability under this independent model but require more generation, scoring and retained storage.

```figure
{
  "id": "fig-33.20",
  "kind": "calculator",
  "title": "Mixed-success pairability",
  "caption": "Binomial analytical example with integral group size. This is not an estimate of a model success rate or measured training yield.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.20",
  "alt": "Binomial analytical example with integral group size. This is not an estimate of a model success rate or measured training yield.",
  "spec": {
    "tex": "s_G(p)=1-p^G-(1-p)^G",
    "equation": "33.20",
    "inputs": [
      {
        "symbol": "p",
        "label": "Single-rollout success probability",
        "default": 0.5,
        "min": 0.05,
        "max": 0.95,
        "step": 0.05,
        "format": "raw"
      },
      {
        "symbol": "G",
        "label": "Independent candidates per prompt",
        "default": 8,
        "min": 2,
        "max": 32,
        "step": 1,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "s",
        "label": "Mixed-group probability",
        "formula": "1-p^G-(1-p)^G",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "a",
        "label": "All-success probability",
        "formula": "p^G",
        "format": "raw",
        "emphasis": false
      },
      {
        "symbol": "f",
        "label": "All-failure probability",
        "formula": "(1-p)^G",
        "format": "raw",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Balanced prompt",
      "variables": {
        "p": 0.5,
        "G": 8
      }
    },
    {
      "anchor": "mechanism",
      "label": "Easy prompt",
      "variables": {
        "p": 0.95,
        "G": 8
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Smaller group",
      "variables": {
        "p": 0.95,
        "G": 2
      }
    }
  ]
}
```

```figure
{
  "id": "fig-33.21",
  "kind": "chart",
  "title": "Candidate count changes the selected population",
  "caption": "Analytical independent-rollout pairability for three integral group sizes. The curves are not empirical model calibration or token entropy.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.20",
  "alt": "Analytical independent-rollout pairability for three integral group sizes. The curves are not empirical model calibration or token entropy.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Single-rollout success probability",
      "domain": [
        0,
        1
      ]
    },
    "y": {
      "label": "Pairable-group probability"
    },
    "variables": {},
    "series": [
      {
        "id": "two",
        "label": "Two candidates",
        "formula": "1-x^2-(1-x)^2",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 33
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "eight",
        "label": "Eight candidates",
        "formula": "1-x^8-(1-x)^8",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 33
        },
        "emphasis": false,
        "dashed": true
      },
      {
        "id": "sixteen",
        "label": "Sixteen candidates",
        "formula": "1-x^16-(1-x)^16",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 33
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0.5,
        "y": 0.5,
        "label": "Two-candidate maximum1/2"
      },
      {
        "x": 0.5,
        "y": 0.9921875,
        "label": "Eight-candidate maximum"
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] If one pair is retained per selected prompt, its prompt marginal becomes

$$
\nu_S(x)=\frac{\nu(x)s_G(p_x)}{\sum_{x'}\nu(x')s_G(p_{x'})},\qquad P(S)>0.
$$
*(Eq. 33.21)*

Selecting uniformly within correct and incorrect subsets changes the conditional response distribution too. Neither operation is represented by simply substituting $\rho_t$ into an unconditioned two-independent-candidate model. Equal retained-pair counts do not imply equal information, prompt difficulty or response support.

[DERIVED] A binary-outcome entropy $-p\log p-(1-p)\log(1-p)$ describes verifier success uncertainty under this model. It is not token-distribution entropy, semantic diversity, confidence calibration or an uncertainty estimate for the utility function. Estimate it with its sampling uncertainty and identify whether the average is over all prompts or only pairable prompts. Conditioning the metric on selection can reverse its relationship with the whole workload.

#### Iterative rounds, stale data and transport

[DERIVED] A round-based process freezes a behavior snapshot, generates bounded candidates, labels them, validates provenance and then trains against a declared reference. New rounds may discard, mix or retain old rows. A mixture with coefficients $\alpha_t$ optimizes $\sum_t\alpha_tL(\theta;\mu_t)$ if the coefficients and reductions are implemented as declared. Uniformly sampling pooled rows instead weights rounds by their row counts. Neither is automatically the current deployment measure.

[MATHEMATICALLY-DERIVED] An exact measure-transport identity is available only with absolute continuity and integrability:

$$
\mathbb E_{\mu_*}[\ell_\theta]=\mathbb E_{\mu_D}\!\left[w\ell_\theta\right],\qquad
w=\frac{d\mu_*}{d\mu_D},\quad \mu_*\ll\mu_D.
$$
*(Eq. 33.22)*

If prompt probabilities and independent candidate behavior probabilities are known and the conditional label model is unchanged, the weight factors accordingly. Selection, deduplication, unknown human propensities or a changed verifier require their own factors. Missing support makes the ratio undefined; clipping the ratio defines a biased surrogate. A finite set with one observed label per pair rarely supplies every density required for exact transport.

[MATHEMATICALLY-DERIVED] A diagnostic for realized nonnegative weights is

$$
N_{\mathrm{eff}}=\frac{(\sum_iw_i)^2}{\sum_iw_i^2},\qquad 1\le N_{\mathrm{eff}}\le N\quad\text{when some }w_i>0.
$$
*(Eq. 33.23)*

The bounds follow from nonnegative cross terms and Cauchy–Schwarz. This weight-concentration statistic is not a guarantee of independent effective observations: shared prompts, duplicates and correlated annotations remain. A large value cannot certify missing coverage or correct propensity models.

```figure
{
  "id": "fig-33.22",
  "kind": "matrix",
  "title": "Disconnected comparison components leave gaps",
  "caption": "A block-diagonal illustrative comparison graph has no cross-component edges. Empty cross blocks convey missing relative information, not low response quality.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.19",
  "alt": "A block-diagonal illustrative comparison graph has no cross-component edges. Empty cross blocks convey missing relative information, not low response quality.",
  "spec": {
    "rows": 4,
    "cols": 4,
    "pattern": "explicit",
    "cells": [
      [
        1,
        1,
        0,
        0
      ],
      [
        1,
        1,
        0,
        0
      ],
      [
        0,
        0,
        1,
        1
      ],
      [
        0,
        0,
        1,
        1
      ]
    ],
    "rowLabel": "Response groups",
    "colLabel": "Compared response groups",
    "legend": "Filled = required; empty = not sufficient alone."
  }
}
```

## Algorithm

### Algorithm 33.4 — Versioned bounded data-refresh round

[DERIVED] Inputs are prompt manifest, behavior/reference/initialization identities, finite round count $R$, candidate cap $G$, generation/token/time budgets, label contract and update cap $K$. Initialize round $t=0$. Output is final policy plus immutable datasets and cost ledger. State separates behavior snapshot, optimization policy and reference rather than conflating all three.

$$
\begin{aligned}
1.&\quad \rho_t\leftarrow\operatorname{freeze\_behavior}(\theta_t);\quad q_t\leftarrow\operatorname{declared\_reference}(t).\\
2.&\quad Y_t\leftarrow\operatorname{sample\_within\_caps}(\rho_t,X,G);\quad\operatorname{record}(\mathrm{tokens,time,stops,versions}).\\
3.&\quad Z_t\leftarrow\operatorname{label\_within\_deadline}(Y_t);\quad D_t\leftarrow\operatorname{validate\_select\_pair}(Y_t,Z_t).\\
4.&\quad D_t=\varnothing\ \Longrightarrow\ \operatorname{stop\_no\_signal};\quad\text{never retry indefinitely}.\\
5.&\quad \theta'_t\leftarrow\operatorname{declared\_start}(\theta_0,\theta_t);\quad \theta_{t+1}\leftarrow\operatorname{fit}_{\le K}(\theta'_t,D_t,q_t).\\
6.&\quad \operatorname{seal}(D_t,\rho_t,q_t,\mathrm{label\ policy},\mathrm{selection},\mathrm{costs});\quad t\leftarrow t+1.\\
7.&\quad t=R\ \lor\ \operatorname{budget\_exhausted}\ \Longrightarrow\ \operatorname{save\_and\_stop};\quad\text{otherwise return to1}.
\end{aligned}
$$
*(Eq. 33.24)*

[DERIVED] The invariant is that every retained row names the exact generating and labeling process. Timeouts and partial groups are recorded; they are not completed with invented outcomes. Training and labeling each have finite caps. Inference cost includes up to $|X|G$ generated responses per round, verifier/annotator cost, rejected groups, dataset bytes and optional reference-cache construction. Sequential decoding and batched training have different utilization and memory behavior, so token counts alone do not determine wall time.

## Implementation

[DERIVED] Hugging Face TRL, **Post-training / RL**, supplies the inspected direct-training route [R33.5–R33.6]. G2D uses that ecosystem for distinct warm-up and offline phases [R33.4, Appendix B]; its paper does not pin the trainer revision, so v1.13.0 is not retroactively assigned to its May experiment. The versioned procedure above is book-authored explanatory logic, not a claim about that paper's exact scheduler.

[DERIVED] Preserve immutable rollout ids, behavior log probabilities where transport is intended, sampling temperature/top-p, random seeds, verifier version, truncation/failure states and pair selection. Behavior probabilities must describe the actual constrained/temperature-adjusted sampling distribution if they enter importance weights. A raw base-model log probability is not that distribution after truncation or masking. Caches must include round-specific reference and event identities from §33.2.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R33.4 §4 and Appendix B report the following setting.

| Field | Disclosed protocol |
|---|---|
| Models / task | Qwen2.5-7B-Instruct, Llama3.1-8B-Instruct; MATH training; MATH500/GSM8K greedy pass@1 |
| Device / adaptation | One A10080GB; LoRA rank16,alpha32,dropout0.05; precision NOT-DISCLOSED |
| Warm-up / harvest | GRPO group2,384-token cap; K in0/150/300/500/700/1000; harvest8candidates at temperature1.3 |
| Offline / comparator | Fresh initial model; DPO3epochs,beta0.1,lr5e-5;1000-step GRPO group2/4 |
| Repetition / ablations | Five seeds reported; duration, quantity, difficulty, temperature and IPO substitution |
| Cost boundary | GPU-hour table and abstract multiplier disagree; complete harvest accounting NOT-DISCLOSED |

## Observations

**What the paper claims.** [PAPER-REPORTED] Moderate warm-up improves its offline outcomes; larger K is not uniformly better. Its IPO substitution underperforms DPO in the reported setting [R33.4, §4, Appendix A].

**What the evidence shows.** [DERIVED] The fresh restart helps separate data-generation effects from continuing warm-up parameters. Limited GRPO tuning and incomplete cost reconstruction prevent a universal offline/online ranking.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 33.21 explains a selection-induced prompt shift even under an ideal verifier. Pairability and coverage must be reported separately from retained row count.

**What remains unknown.** [UNVERIFIED] Independent replication, fully matched end-to-end costs and transfer beyond the disclosed math workloads are unestablished here.

```figure
{
  "id": "fig-33.23",
  "kind": "compare",
  "title": "Refresh interventions change different objects",
  "caption": "The comparison records which part of the expected learning problem changes; it makes no empirical ranking.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.24",
  "alt": "The comparison records which part of the expected learning problem changes; it makes no empirical ranking.",
  "spec": {
    "axis": "Intervention boundary",
    "columns": [
      {
        "id": "sample",
        "label": "Resample candidates"
      },
      {
        "id": "label",
        "label": "Refresh labels"
      },
      {
        "id": "reference",
        "label": "Refresh reference"
      }
    ],
    "rows": [
      {
        "dimension": "Changed object",
        "values": {
          "sample": "Response measure C",
          "label": "Conditional label process A",
          "reference": "Reference-relative score"
        }
      },
      {
        "dimension": "Required identity",
        "values": {
          "sample": "Behavior and decoding",
          "label": "Judge/rubric/version",
          "reference": "Reference/cache generation"
        }
      },
      {
        "dimension": "Unchanged by itself",
        "values": {
          "sample": "Loss formula",
          "label": "Response coverage",
          "reference": "Observed data coverage"
        }
      },
      {
        "dimension": "New cost",
        "values": {
          "sample": "Generation and verification",
          "label": "Annotation or judge inference",
          "reference": "Reference scoring/cache rebuild"
        }
      }
    ]
  }
}
```

## Failure modes

> **Failure mode — Stale-support optimism.** [DERIVED] *Symptom:* held-out fixed-pair fit improves while generated task performance falls. *Cause:* evaluation shares the old candidate measure and misses new actions. *Detection:* separately evaluate current-policy generations on independent prompts. *Mitigation:* record deployment mismatch and refresh coverage under a controlled process.

> **Failure mode — Selection masquerading as calibration.** [DERIVED] *Symptom:* mixed-group entropy is called calibrated model confidence. *Cause:* conditioning and binary-verifier statistics are confused with probabilities of correctness. *Detection:* compare population, pairable subset and independent calibration outcomes. *Mitigation:* name the measured event and denominator.

## Siblings

[DERIVED] Objective families in [§33.3](33-3-objective-families.md) change the integrand. This section changes the data measure. On-policy policy gradients in Chapter34 additionally define policy-sampled update estimators. A dataset produced by a recent policy can still support purely offline fitting after its generation phase is frozen.

## Extensions

### Improvements

[DERIVED] G2D's documented change is a short online preparation phase followed by static-data training, with quantity and duration controls. Its negative duration result bounds the claim: more warm-up is not a monotonic improvement. The candidate quality and difficulty interventions are not proofs that all response-distribution mismatch has disappeared. No uninspected iterative-merging successor is asserted.

## Limitations

[DERIVED] The independent-rollout calculator excludes correlated sampling, duplicate trajectories and verifier error. Graph coverage is local to observed responses and does not characterize neural generalization. Exact transport requires known measures and support; approximate weights do not repair absent actions. An iterative reference sequence supplies no automatic telescoping guarantee for one fixed reward problem.

## Reproducibility

[DERIVED] Retain per-round policy/reference/initialization revisions, complete generation settings, prompt-selection rule, raw candidate outcomes, duplicate map, discarded groups, pair construction, annotation costs and optimizer history. Do not charge only retained useful pairs. Proposed verification checks are separate in verification.md and have not been run.

```figure
{
  "id": "fig-33.24",
  "kind": "memory-stack",
  "title": "Filtering changes retained groups, not generated work",
  "caption": "Eq.33.20:1000 iid groups of G=8 at p=0.5 have expected mixed-group count992.188. All-correct and all-wrong groups are discarded for pair construction, but all8000 rollout attempts remain preparation work. Fractional counts are expectations.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.20",
  "alt": "An expected1000-group stack separates mixed groups, all-correct groups and all-wrong groups under a declared iid Bernoulli model. At p0.5,G8 the retained expectation is992.188; generated attempts remain8000. This is not observed training yield.",
  "spec": {
    "format": "fixed3",
    "variables": {
      "N": 1000,
      "p": 0.5,
      "G": 8
    },
    "bars": [
      {
        "label": "Expected candidate groups",
        "segments": [
          {
            "label": "Mixed and pairable",
            "kind": "dataset",
            "formula": "N*(1-p^G-(1-p)^G)"
          },
          {
            "label": "All correct",
            "kind": "dependency",
            "formula": "N*p^G"
          },
          {
            "label": "All wrong",
            "kind": "dependency",
            "formula": "N*(1-p)^G"
          }
        ]
      }
    ],
    "budget": {
      "label": "All collected groups",
      "formula": "N"
    }
  },
  "anchor": "reproducibility",
  "states": [
    {
      "anchor": "formulation",
      "label": "Balanced outcomes",
      "variables": {
        "p": 0.5
      }
    },
    {
      "anchor": "mechanism",
      "label": "Very easy prompts",
      "variables": {
        "p": 0.95
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Very hard prompts",
      "variables": {
        "p": 0.05
      }
    }
  ]
}
```

## References

[R33.4](references.md#r334), [R33.5](references.md#r335), [R33.6](references.md#r336). Distribution, selection and transport identities are book-derived under explicit premises.
