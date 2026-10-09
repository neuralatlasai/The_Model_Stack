---
id: "ms.section.33.6"
entity_type: "section"
title: "Controlled comparison"
short_title: "Controlled comparison"
volume: 2
part: 6
chapter: 33
section: 33.6
slug: "33-6-controlled-comparison"
parent: "ms.chapter.33"
prev_sibling: "ms.section.33.5"
next_sibling: null
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

# 33.6 — Controlled comparison

## Scope

[DERIVED] Define a comparison record that can distinguish an objective effect from changed supervision, initialization, token budget or evaluator. The baseline includes the untouched instruction-tuned policy and a chosen-response SFT arm under a declared mask. Success requires held-out preference fit, independent task outcomes, calibration and complete resource accounting. This section owns comparison semantics and evidence interpretation; concrete unexecuted experiment recipes remain in verification.md.

## Why this exists

[DERIVED] Preference methods are often compared through one win-rate table even when they use different initializations, dataset filters, reference models and auxiliary preparation. Such a table can establish a ranking of complete recipes under its evaluator. It cannot establish that the named loss caused the difference. Matching successful optimizer updates also fails to match compute when one recipe trains five pilots, scores a reference or generates online candidates.

[DERIVED] A second constraint is evaluator validity. Held-out pair accuracy measures discrimination on supplied candidates. A reward-model judge measures a particular proxy. A task verifier measures a declared correctness event. A length-controlled estimator adjusts a specified confound under its own model. None substitutes for the others without assumptions. The comparison artifact must retain these axes instead of aggregating incompatible units into one score.

## Intuition

[MATHEMATICALLY-DERIVED] A controlled comparison identifies a contrast between interventions under a shared contract. Equal-data and equal-compute questions have different controls. Paired prompt evaluation removes some prompt variation, while multiple training seeds expose policy-training variation. A bootstrap over prompts at one checkpoint cannot estimate the latter. Calibration further asks whether predicted probabilities correspond to outcomes, not merely whether their ordering is correct.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $C_g,C_a,C_r,C_p,C_f,C_e$ | Generation, annotation, reference, pilot, final-fit and evaluation costs | Device-hours or separately reported resource units |
| $S,N$ | Training seeds and independent evaluation prompt groups | Counts |
| $d_{sj}$ | Candidate-minus-baseline outcome for seed s, prompt group j | Metric-specific |
| $z_j\in\{0,1\}$ | Outcome under randomized candidate orientation | Binary |
| $p_j$ | Declared modeled comparison probability | Ratio |
| $w_j\ge0$ | Prespecified evaluation weight | Dimensionless |

[MATHEMATICALLY-DERIVED] For a common device-time boundary,

$$
C_{\mathrm{total}}=C_g+C_a+C_r+C_p+C_f+C_e,\qquad
C_p=\sum_{j=1}^{P}C_{p,j},\qquad C_{\mathrm{allocated}}=\sum_d\int\mathbf1\{d\text{ reserved at }t\}\,dt.
$$
*(Eq. 33.32)*

Device-time is additive only in compatible units; CPU annotation hours and GPU hours must not be summed without a declared conversion. Parallel phase durations do not add to elapsed wall time, while their allocated device-hours do. Price and energy conversion need actual prices/power measurements and remain unknown otherwise.

```figure
{
  "id": "fig-33.31",
  "kind": "diagram",
  "title": "Comparison boundary includes preparation and evaluation",
  "caption": "An objective contrast shares a declared starting policy and data contract, then records every auxiliary resource before independent evaluation.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.32",
  "alt": "An objective contrast shares a declared starting policy and data contract, then records every auxiliary resource before independent evaluation.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "contract",
        "kind": "state",
        "label": "Frozen study contract"
      },
      {
        "id": "initial",
        "kind": "model",
        "label": "Shared instruction-tuned start"
      },
      {
        "id": "sft",
        "kind": "process",
        "label": "Chosen-response SFT"
      },
      {
        "id": "direct",
        "kind": "process",
        "label": "Named preference objective"
      },
      {
        "id": "aux",
        "kind": "memory",
        "label": "Generation, references and pilots"
      },
      {
        "id": "eval",
        "kind": "metric",
        "label": "Frozen independent evaluation"
      },
      {
        "id": "record",
        "kind": "state",
        "label": "Comparison and cost record"
      }
    ],
    "edges": [
      {
        "from": "contract",
        "to": "initial"
      },
      {
        "from": "initial",
        "to": "sft"
      },
      {
        "from": "initial",
        "to": "direct"
      },
      {
        "from": "aux",
        "to": "direct"
      },
      {
        "from": "sft",
        "to": "eval"
      },
      {
        "from": "direct",
        "to": "eval"
      },
      {
        "from": "eval",
        "to": "record"
      },
      {
        "from": "aux",
        "to": "record"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-33.32",
  "kind": "calculator",
  "title": "Auxiliary work changes total training cost",
  "caption": "Illustrative allocation arithmetic only. Pilot count and hours are chosen inputs, not measured costs of UNM or any named method. Annotation and evaluation are outside this displayed sub-boundary.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.32",
  "alt": "Illustrative allocation arithmetic only. Pilot count and hours are chosen inputs, not measured costs of UNM or any named method. Annotation and evaluation are outside this displayed sub-boundary.",
  "spec": {
    "tex": "C_{\\mathrm{sub}}=P C_{\\mathrm{pilot}}+C_f+C_g",
    "equation": "33.32",
    "inputs": [
      {
        "symbol": "P",
        "label": "Pilot count",
        "default": 5,
        "min": 0,
        "max": 8,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "u",
        "label": "Device-hours per pilot",
        "default": 2,
        "min": 0.5,
        "max": 10,
        "step": 0.5,
        "format": "fixed3"
      },
      {
        "symbol": "f",
        "label": "Final-fit device-hours",
        "default": 10,
        "min": 1,
        "max": 40,
        "step": 1,
        "format": "fixed3"
      },
      {
        "symbol": "g",
        "label": "Generation device-hours",
        "default": 3,
        "min": 0,
        "max": 20,
        "step": 1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "C",
        "label": "Displayed subtotal device-hours",
        "formula": "P*u+f+g",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "R",
        "label": "Subtotal divided by final fit",
        "formula": "(P*u+f+g)/f",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "No pilots in subtotal",
      "variables": {
        "P": 0
      }
    },
    {
      "anchor": "mechanism",
      "label": "Five pilot fits",
      "variables": {
        "P": 5
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Preparation changes ranking",
      "variables": {
        "P": 8
      }
    }
  ]
}
```

## Mechanism

### Methodology

#### Baselines and causal contrast

[DERIVED] The untouched instruction-tuned model identifies what changes at all. A chosen-response SFT arm identifies the contribution of likelihood training on the same preferred examples. The SFT mask must match its stated objective: completion-only and full-chat NLL are different. A preference arm's auxiliary chosen-likelihood term must be documented rather than hidden under a method name. If all arms start from different checkpoints, their differences are recipe contrasts, not isolated loss contrasts.

[DERIVED] Equal-data comparison holds prompt identities, candidate texts, labels, deduplication, split, tokenizer/template and exclusion policy fixed. Methods requiring different feedback cannot always receive identical information: KTO uses criterion labels, while RDPO requires gaps. Record both a common-information comparison and a full-method comparison if they answer distinct questions. Treat an extra label channel as an intervention with acquisition cost and uncertainty, rather than merely another hyperparameter.

[DERIVED] Equal-compute comparison holds a declared total resource budget, including auxiliary preparation, and allows each recipe to allocate that budget. It does not simultaneously guarantee equal row exposures or equal updates. Report both axes when needed. A model receiving fewer valid tokens because long pairs are zero weighted can have the same loader-update count but less optimization signal. Packing, activation recomputation, adapters and reference caching likewise affect cost without changing an objective's algebraic name.

#### Splits, seeds and paired outcomes

[DERIVED] Split before candidate generation when practical, and otherwise group all related prompt/template/user families together. Keep model selection on a development split and freeze selected configurations before confirmation. Candidate duplicates and paraphrases can create leakage even if row ids differ. A judge that labels training candidates and evaluates outputs can carry correlated preferences into the outcome, so evaluator independence needs a substantive explanation rather than a different endpoint name.

[MATHEMATICALLY-DERIVED] Under an explicitly analytical random-effects model $d_{sj}=\delta+a_s+e_{sj}$ with independent zero-mean seed effects and residuals,

$$
\operatorname{Var}(\bar d)=\frac{\sigma_a^2}{S}+\frac{\sigma_e^2}{SN},\qquad
\operatorname{Var}(\bar d\mid a_s)=\frac{\sigma_e^2}{SN}.
$$
*(Eq. 33.33)*

This toy decomposition explains the missing component in checkpoint-conditional prompt uncertainty. Shared prompts across seeds or annotator clusters require richer covariance handling; the formula is not a claim about a source dataset. A paired prompt bootstrap resamples complete candidate/baseline prompt outcomes together. A seed bootstrap or hierarchical design addresses a different sampling level and needs enough independent training runs.

[DERIVED] Preserve all training failures, interrupted runs and seed-level outcomes. Selecting the best seed and reporting prompt confidence intervals around it conditions on selection. Likewise, choosing among many objective variants on the same evaluation panel introduces multiple-comparison optimism. A disjoint confirmation panel reduces direct reuse of those prompt outcomes but does not erase earlier model-family selection or guarantee independence from all research decisions.

#### Preference fit and probability calibration

[MATHEMATICALLY-DERIVED] For randomized candidate orientation, evaluate

$$
\operatorname{Brier}=\frac{\sum_jw_j(p_j-z_j)^2}{\sum_jw_j},\qquad
\operatorname{NLL}=-\frac{\sum_jw_j[z_j\log p_j+(1-z_j)\log(1-p_j)]}{\sum_jw_j},\quad\sum_jw_j>0.
$$
*(Eq. 33.34)*

The probabilities must belong to the modeled event. A margin-exceedance surrogate or KTO bounded utility is not automatically a calibrated probability of raw annotator preference. A dataset represented only as chosen-first pairs sets all outcomes to one by construction; calibration on that orientation conflates representation with genuine probabilities. Randomize orientation using retained true labels, or include both orientations with a declared dependence-aware analysis.

[MATHEMATICALLY-DERIVED] Binary classification accuracy uses whether $p_j>1/2$, whereas log loss responds to confidence. Two models can have identical accuracy and sharply different calibration. Fitting a temperature on held-out calibration data changes probability reporting; it must not use the final test outcomes. Empty bins, chosen bin boundaries and weighting alter an expected calibration error estimate, so report proper scores and sample counts alongside any binned plot.

#### Independent task outcomes and length

[MATHEMATICALLY-DERIVED] For one generated answer per prompt under frozen decoding, define

$$
\widehat{\operatorname{pass@1}}=\frac1N\sum_{j=1}^{N}\mathbf1\{\operatorname{verify}(x_j,y_j)=\mathrm{pass}\},\qquad
\widehat W=\frac{n_{\mathrm{win}}+\tfrac12n_{\mathrm{tie}}}{N}.
$$
*(Eq. 33.35)*

These estimate different events. Record verifier parse failures, unsupported outputs and abstentions rather than dropping them without changing the denominator. Greedy pass@1 is conditional on one decoding rule; sampled pass@1 is conditional on another. Judge win rate needs opponent, rubric, candidate order, tie threshold and decoding budget. Character-length ratios are not token counts, and ordinary win rates are not length-controlled estimators.

[DERIVED] Report task outcomes by prespecified difficulty, domain and response-length slices together with uncertainty and subgroup counts. Do not select favorable slices after viewing results. Length is both a potential confound and an outcome affected by training; adjusting for it answers a different question from the total recipe effect. A comparison can legitimately report both raw and controlled measures, provided their estimands are explained and no one number is claimed to represent all utility.

```figure
{
  "id": "fig-33.33",
  "kind": "compare",
  "title": "Equal data and equal compute answer different questions",
  "caption": "Neither control implies the other. The comparison artifact preserves which resource and information boundary is held fixed.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.32",
  "alt": "Neither control implies the other. The comparison artifact preserves which resource and information boundary is held fixed.",
  "spec": {
    "axis": "Controlled contrast",
    "columns": [
      {
        "id": "data",
        "label": "Equal information/data"
      },
      {
        "id": "compute",
        "label": "Equal total compute"
      }
    ],
    "rows": [
      {
        "dimension": "Held fixed",
        "values": {
          "data": "Prompts, candidates, labels and masks",
          "compute": "Declared generation, auxiliary and fitting budget"
        }
      },
      {
        "dimension": "May vary",
        "values": {
          "data": "Reference cost and execution overhead",
          "compute": "Updates, rows and token exposure"
        }
      },
      {
        "dimension": "Interpretation",
        "values": {
          "data": "Loss/recipe effect on the same information",
          "compute": "Resource allocation performance"
        }
      },
      {
        "dimension": "Required caveat",
        "values": {
          "data": "Additional feedback is not identical data",
          "compute": "Budget does not equal device utilization"
        }
      }
    ]
  }
}
```

```figure
{
  "id": "fig-33.34",
  "kind": "matrix",
  "title": "Metric families do not imply one another",
  "caption": "Rows and columns denote preference fit, calibration, judge outcome and verified task correctness. Only self-evidence is indicated; cross-task implication needs an additional justified model.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.35",
  "alt": "Rows and columns denote preference fit, calibration, judge outcome and verified task correctness. Only self-evidence is indicated; cross-task implication needs an additional justified model.",
  "spec": {
    "rows": 4,
    "cols": 4,
    "pattern": "explicit",
    "cells": [
      [
        1,
        0,
        0,
        0
      ],
      [
        0,
        1,
        0,
        0
      ],
      [
        0,
        0,
        1,
        0
      ],
      [
        0,
        0,
        0,
        1
      ]
    ],
    "rowLabel": "Fit / calibration / judge / task",
    "colLabel": "Measured outcome family",
    "legend": "Filled = required; empty = not sufficient alone."
  }
}
```

## Algorithm

### Algorithm 33.6 — Admission of a controlled comparison record

[DERIVED] Inputs are finite frozen source/run records, target comparison question, mandatory field schema and evidence locators. Output is an admitted bounded claim or a specific noncomparability/gap record. State is the comparison inventory, not a training process. This is an explanatory review procedure for evidence; proposed training experiments remain separate.

$$
\begin{aligned}
1.&\quad Q\leftarrow\operatorname{declare}(\mathrm{equal\ data, equal\ compute, or\ complete\ recipe});\quad R\leftarrow\operatorname{freeze\_records}.\\
2.&\quad I\leftarrow\operatorname{check}(\mathrm{initialization,data,masks,objective,coefficients,reference,versions}).\\
3.&\quad C\leftarrow\operatorname{inventory}(C_g,C_a,C_r,C_p,C_f,C_e);\quad\operatorname{mark\_unknowns}(C).\\
4.&\quad E\leftarrow\operatorname{check}(\mathrm{splits,seeds,judge,decoding,metrics,uncertainty,selection}).\\
5.&\quad \neg\operatorname{controls\_satisfy}(Q,I,C,E)\ \Longrightarrow\begin{cases}Q\leftarrow\mathrm{complete\ recipe};\ \operatorname{attach\_limitations},&\mathrm{recipe\ contrast\ supported},\\\operatorname{return\_gap},&\mathrm{otherwise}.\end{cases}\\
6.&\quad \operatorname{claim}\leftarrow\operatorname{bounded\_contrast}(Q,I,C,E,\mathrm{actual\ outcomes});\quad\operatorname{attach\_locators}.\\
7.&\quad \operatorname{return}(\operatorname{claim},\mathrm{negative\ results},\mathrm{NOT\!DISCLOSED},\mathrm{UNVERIFIED}).
\end{aligned}
$$
*(Eq. 33.36)*

[DERIVED] Every finite record is either admitted under its actual controls or explicitly downgraded; missing fields never receive invented defaults. Inspection terminates after the finite inventory or an unresolved required field. Work is linear in record fields plus outcome aggregation; reconstructing a training run is outside this review algorithm. Large raw evaluation outputs need bounded streaming aggregation and durable per-prompt identities, not just a rendered summary table.

## Implementation

[DERIVED] Hugging Face TRL, **Post-training / RL**, supplies pinned objective paths [R33.5–R33.8], while this chapter's comparison artifact is framework independent. Record loss numerators/denominators, optimizer state, valid pair/token counts and reference/cache identity. Distributed logging must use the same reductions as training. A displayed mean of rank means can disagree with the actual global objective when exclusions are uneven.

[DERIVED] Numerical parity is a separate admission axis: compare per-row scores, losses and selected gradients between a transparent reference calculation and the chosen implementation under fixed inputs. That establishes arithmetic agreement for those cases, not scientific replication or a universal convergence claim. Device time, memory traffic, peak allocated/reserved bytes, communication and cache construction require execution to measure; no such measurements are claimed here.

```figure
{
  "id": "fig-33.35",
  "kind": "hierarchy",
  "title": "Evidence moves through separate admission levels",
  "caption": "A claim should stop at the strongest level its retained evidence supports. Code inspection does not become a trained-model replication.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.36",
  "alt": "A claim should stop at the strongest level its retained evidence supports. Code inspection does not become a trained-model replication.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Artifact identity",
        "kind": "state",
        "note": "Pinned paper/release and full locators"
      },
      {
        "label": "Objective contract",
        "kind": "objective",
        "note": "Feedback, scores and denominators"
      },
      {
        "label": "Execution contract",
        "kind": "hardware",
        "note": "Actual precision, kernels and budget"
      },
      {
        "label": "Outcome protocol",
        "kind": "metric",
        "note": "Splits, evaluator and uncertainty"
      },
      {
        "label": "Bounded interpretation",
        "kind": "boundary",
        "note": "Recipe contrast or isolated effect"
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[DERIVED] The source-specific protocol tables in [§33.1](33-1-dpo-derivation.md#experimental-design), [§33.3](33-3-objective-families.md#experimental-design), [§33.4](33-4-offline-versus-online-data.md#experimental-design) and [§33.5](33-5-bias-and-pathology.md#experimental-design) are the actual inspected studies. The following audit identifies their comparison boundaries rather than repeating their results as a new combined benchmark.

| Study | Actual control boundary | Remaining reconstruction limit |
|---|---|---|
| R33.1 §6/F | Multiple reference initializations and rating-trust ablations | Reference variation is not seed replication; selected epochs and hardware gaps |
| R33.2 §6/E | DPO/cDPO versus block variants, partition/rank/coefficient sweeps | Preparation differs; precision and repetition unit omitted |
| R33.4 §4/A/B | Warm-up duration with fresh offline restart; quantity and loss controls | GRPO tuning limited; cost reconciliation unresolved |
| R33.3 §5/E/F | Fixed final update budget and frozen checkpoint panels | Pilots add cost; scale provenance varies; prompt CIs conditional |

## Observations

**What the paper claims.** [PAPER-REPORTED] Each admitted2026study reports gains under its own recipe and evaluator [R33.1–R33.4, protocol locators above].

**What the evidence shows.** [DERIVED] Their different data, baselines, score units, auxiliary budgets and judges prevent a cross-paper league table. The negative partition, duration and provenance caveats are material to interpretation.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 33.32–35 require separate resource, training-variation, preference-probability and task-outcome records. One improving metric cannot establish all four.

**What remains unknown.** [UNVERIFIED] No fully matched all-family current benchmark or independent book-authored training study has been executed.

## Failure modes

> **Failure mode — Equal updates called equal cost.** [DERIVED] *Symptom:* preparation disappears from a method's budget. *Cause:* only the final fit is counted. *Detection:* phase-specific allocation ledger. *Mitigation:* report complete and marginal-reuse costs separately.

> **Failure mode — Conditional interval called robustness.** [DERIVED] *Symptom:* a one-seed prompt CI is presented as training reproducibility. *Cause:* uncertainty levels are conflated. *Detection:* identify the actual resampling unit and training-run count. *Mitigation:* retain the conditional statement and independent seed evidence separately.

## Siblings

[DERIVED] Chapter31 owns SFT's training semantics; Chapter32 owns preference data and reward evaluation. Chapter33 owns direct objective comparisons. Chapter34's policy-gradient experiments add on-policy sampling and estimator controls. The artifact here links those contracts without substituting one metric for another.

## Extensions

### Improvements

[DERIVED] The inspected2026studies improve reporting through explicit partition, trust, duration, scale and conditional-panel analyses, but none supplies every matched-family control. Source-specific refinements remain bounded by their disclosed ablations. The unexecuted verification sheet specifies how to falsify arithmetic and comparison assumptions without claiming those tests have already improved a model.

## Limitations

[DERIVED] A controlled benchmark only supports its tasks, sampling, budget and evaluator. Finite seed counts and selected hyperparameters limit external validity. Calibration against one label process need not transfer to another; task verifiers can be incomplete or exploitable. No numerical pass threshold can certify an external10/10review score or scientific truth across all deployment distributions.

## Reproducibility

[DERIVED] Release the objective-comparison sheet, immutable run/source records, masks, preprocessing, initial/reference revisions, hyperparameter search budget, failed runs, auxiliary allocations, seed-level outputs, per-prompt predictions and exact aggregation scripts. Mark every unavailable field rather than filling it from an unrelated release. All proposed training and robustness experiments remain unexecuted in [verification](verification.md).

```figure
{
  "id": "fig-33.36",
  "kind": "chart",
  "title": "Preparation is part of the displayed cost subtotal",
  "caption": "Eq.33.32 worked inputs use five pilots×2 device-hours,10 final-fit hours and3 generation hours, totaling23. Annotation/evaluation are outside this displayed sub-boundary. These are illustrative inputs, not costs of UNM or a named training run.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.32",
  "alt": "Three bars show illustrative pilot cost10,final fitting10 and generation3 device-hours. Their23-hour subtotal exceeds final-fit-only10. No empirical method or hardware performance is encoded.",
  "spec": {
    "type": "bar",
    "categories": [
      "Pilot fitting",
      "Final fitting",
      "Generation"
    ],
    "x": {
      "label": "displayed preparation/training component"
    },
    "y": {
      "label": "illustrative device-hours",
      "domain": [
        0,
        12
      ]
    },
    "series": [
      {
        "id": "cost",
        "label": "Declared cost subtotal components",
        "values": [
          10,
          10,
          3
        ],
        "emphasis": true
      }
    ]
  },
  "anchor": "reproducibility"
}
```

## References

[R33.1](references.md#r331), [R33.2](references.md#r332), [R33.3](references.md#r333), [R33.4](references.md#r334), [R33.5](references.md#r335), [R33.6](references.md#r336), [R33.7](references.md#r337), [R33.8](references.md#r338). The proposed controlled preference experiment is an artifact specification, not a reported execution.
