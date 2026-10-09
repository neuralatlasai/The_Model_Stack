---
id: "ms.section.32.3"
entity_type: "section"
title: "Reward-model training"
short_title: "Reward-model training"
volume: 2
part: 6
chapter: 32
section: 32.3
slug: "32-3-reward-model-training"
parent: "ms.chapter.32"
prev_sibling: "ms.section.32.2"
next_sibling: "ms.section.32.4"
children: []
prerequisites: ["ms.chapter.2", "ms.chapter.6", "ms.chapter.11", "ms.chapter.31"]
downstream: ["ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.38", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["preference_modeling", "reward_modeling", "verification", "oversight"], "feedback_setting": ["human_preference", "ai_feedback", "verifiable_reward", "learned_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2200
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 32.3 — Reward-model training

## Scope

[DERIVED] Train a reward estimator whose ranking, probability calibration and uncertainty are evaluated on a declared deployment population. The section owns ranking losses, reference comparisons, calibration, shift, ensembles and uncertainty. It does not treat predictive confidence as a certificate of correctness. The handoff to policy optimization includes the reward's valid input domain, score gauge, calibration protocol, unsupported regions and a reproducible inference interface.

## Why this exists

[DERIVED] Ranking accuracy throws away the magnitude of probability errors. Two models can order every held-out pair identically while assigning very different odds and therefore very different gradients or policy incentives. A reward model can also learn a shortcut shared by its entire ensemble. Dispersion measures disagreement among chosen estimators; absent a coverage argument, it is not the probability that all of them are wrong.

[PAPER-REPORTED] RewardUQ compares head ensembles, adapter ensembles, dropout and Bayesian linear heads with a common accuracy/calibration evaluation. IRPM trains a stochastic generative evaluator whose critique and score are sampled jointly. These offer different computational and statistical interfaces; generating an explanation does not by itself make a score calibrated. [R32.3, §3–5; R32.1, §3.1–3.3].

## Intuition

[MATHEMATICALLY-DERIVED] The pairwise likelihood constrains a difference. Thus adding the same prompt-dependent offset to both rewards leaves the loss unchanged. A calibration procedure should operate on margins or on a explicitly fixed reward gauge. Otherwise two numerically different ensembles can disagree about absolute reward while agreeing about every preference. The relevant uncertainty for choosing between two candidates is uncertainty in their difference, including covariance.

[DERIVED] Separate fitting, model selection, calibration and final evaluation. If the same held-out set chooses architecture, fits temperature and reports final accuracy, it is a development set. Reserving a final independent test split does not remove distribution shift, but it prevents repeated tuning from being mislabeled as independent confirmation. A reference comparison set is an empirical measurement anchor; it is distinct from the reference policy used by a later KL-regularized optimizer.


```figure
{
  "id": "fig-32.13",
  "kind": "diagram",
  "title": "Training and evaluation have separate roles",
  "caption": "Data lineage is partitioned into fitting, development, calibration and final evaluation before a reward model is handed to policy optimization.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "Data lineage is partitioned into fitting, development, calibration and final evaluation before a reward model is handed to policy optimization. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "raw",
        "kind": "dataset",
        "label": "Grouped comparisons",
        "sub": "prompt and candidate lineage"
      },
      {
        "id": "train",
        "kind": "process",
        "label": "Fit reward",
        "sub": "training only"
      },
      {
        "id": "dev",
        "kind": "metric",
        "label": "Select model",
        "sub": "development only"
      },
      {
        "id": "cal",
        "kind": "process",
        "label": "Calibrate",
        "sub": "calibration only"
      },
      {
        "id": "test",
        "kind": "metric",
        "label": "Audit",
        "sub": "final and shifted sets"
      },
      {
        "id": "policy",
        "kind": "objective",
        "label": "Policy handoff",
        "sub": "frozen reward version"
      }
    ],
    "edges": [
      {
        "from": "raw",
        "to": "train"
      },
      {
        "from": "train",
        "to": "dev"
      },
      {
        "from": "dev",
        "to": "cal"
      },
      {
        "from": "cal",
        "to": "test"
      },
      {
        "from": "test",
        "to": "policy"
      }
    ]
  }
}
```


## Formulation

| Symbol | Meaning | Domain |
|---|---|---|
| $\phi$ | Trainable reward-model parameters | Encoder and/or head |
| $\Delta_i$ | $r_\phi(x_i,y_i^+)-r_\phi(x_i,y_i^-)$ | Scalar margin |
| $w_i$ | Declared nonnegative comparison weight | Sum strictly positive |
| $q_i$ | Probability assigned to the observed chosen direction | $\sigma(\Delta_i)$ |
| $k$ | Number of ensemble members | Integer at least two |
| $v_e,\rho_e$ | Member error variance and equal error correlation in an analytical model | $v_e\ge0$, $0\le\rho_e\le1$ |
| $P_{\rm tr},P_{\rm dep}$ | Training and deployment comparison distributions | Explicit support |

[MATHEMATICALLY-DERIVED] Weighted binary maximum likelihood is

$$
\mathcal L(\phi)=\frac{\sum_iw_i\log(1+e^{-\Delta_i})}{\sum_iw_i}.
$$
*(Eq. 32.6)*

The normalization defines a comparison-weighted mean. If prompts contribute different numbers of pairs, unit weights give more influence to prompts with more comparisons. Equal prompt influence instead requires within-prompt normalization, followed by a prompt mean. Gradient accumulation and distributed reduction must preserve whichever denominator is declared.

[MATHEMATICALLY-DERIVED] Differentiating one unweighted term gives

$$
\frac{\partial\ell_i}{\partial\Delta_i}=q_i-1,
\qquad
\frac{\partial^2\ell_i}{\partial\Delta_i^2}=q_i(1-q_i),
\qquad
\nabla_\phi\ell_i=(q_i-1)(\nabla r_i^+-\nabla r_i^-).
$$
*(Eq. 32.7)*

Curvature is at most one quarter and vanishes for saturated logits. This is convex in an independently free margin, not generally convex in neural parameters. Correctly signed saturated margins contribute little gradient; wrongly signed large margins retain a large first derivative. Compute softplus directly instead of exponentiating extreme logits.

## Mechanism

[DERIVED] Establish a reference data ledger before training. Group by prompt lineage, candidate-generation checkpoint and evaluation rubric. Split on groups rather than rows so paraphrases or duplicate candidates do not appear on both sides. Store chosen and rejected strings exactly as judged; preprocessing that changes one response changes the observation. If a label is produced under a different context than the model input, the estimator is being trained on a partially observed target.

[DERIVED] Calibration predicts an event frequency, not an absolute truth score. Let $z_i\in\{0,1\}$ denote the observed direction after randomizing pair orientation. A temperature $a_t>0$ changes $q_i$ to $\sigma(\Delta_i/a_t)$ without changing strict rankings. Fit it on a distinct calibration split by a proper scoring rule. The binary Brier loss admits

$$
\mathbb E[(q-Z)^2\mid X]=
(q-p_\star)^2+p_\star(1-p_\star),\qquad
p_\star=\Pr(Z=1\mid X).
$$
*(Eq. 32.8)*

The first term is reducible probability error; the second is intrinsic label variance under the chosen observation distribution. Low loss need not mean every annotator agrees. Reliability diagrams need counts and uncertainty per bin; expected calibration error depends on binning and can hide severe failures in a small but operationally important slice.


```figure
{
  "id": "fig-32.14",
  "kind": "chart",
  "title": "Ranking and calibration are different",
  "caption": "At fixed signed margin, changing the temperature changes probability while retaining the sign. Curves execute the logistic observation model analytically.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.3",
  "alt": "At fixed signed margin, changing the temperature changes probability while retaining the sign. Curves execute the logistic observation model analytically. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "reward margin",
      "domain": [
        -6,
        6
      ]
    },
    "y": {
      "label": "predicted preference probability",
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
    "variables": {},
    "series": [
      {
        "id": "one",
        "label": "temperature 1",
        "formula": "1/(1+exp(-x))",
        "sample": {
          "from": -6,
          "to": 6,
          "count": 161
        },
        "emphasis": true
      },
      {
        "id": "two",
        "label": "temperature 2",
        "formula": "1/(1+exp(-x/2))",
        "sample": {
          "from": -6,
          "to": 6,
          "count": 161
        },
        "dashed": true
      },
      {
        "id": "half",
        "label": "temperature 0.5",
        "formula": "1/(1+exp(-2*x))",
        "sample": {
          "from": -6,
          "to": 6,
          "count": 161
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0,
        "y": 0.5,
        "label": "All temperatures preserve the ranking boundary"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] For ensemble candidate rewards, compute each member's margin before taking dispersion. If $r^+$ and $r^-$ share uncertainty, $\operatorname{Var}(r^+-r^-)=\operatorname{Var}(r^+)+\operatorname{Var}(r^-)-2\operatorname{Cov}(r^+,r^-)$. Ignoring covariance can overstate or understate uncertainty. Under an equal-variance, equal-correlation error model,

$$
\operatorname{Var}(\bar e)=v_e\left[\rho_e+\frac{1-\rho_e}{k}\right],\qquad
k_{\rm eff}=\frac{k}{1+(k-1)\rho_e}.
$$
*(Eq. 32.9)*

The effective-count identity matches §32.1's observation accounting, now applied to estimator errors. The equality is a conditional analytical model, not a measured ensemble property. A common bias persists even if variance vanishes. A lower-confidence score formed by subtracting a multiple of estimated dispersion is a heuristic unless its coverage has been independently established on the intended distribution.


```figure
{
  "id": "fig-32.15",
  "kind": "calculator",
  "title": "Correlated ensemble error floor",
  "caption": "Eq. 32.9 shows variance reduction under equal member error variance and equal correlation. The settings are illustrative and do not estimate a real ensemble.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.9",
  "alt": "Eq. 32.9 shows variance reduction under equal member error variance and equal correlation. The settings are illustrative and do not estimate a real ensemble. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "tex": "\\operatorname{Var}(\\bar e)=v_e[\\rho_e+(1-\\rho_e)/k]",
    "equation": "32.9",
    "inputs": [
      {
        "symbol": "k",
        "label": "ensemble members",
        "default": 8,
        "min": 2,
        "max": 16,
        "format": "integer",
        "options": [
          2,
          4,
          8,
          16
        ]
      },
      {
        "symbol": "rho",
        "label": "member error correlation",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "ve",
        "label": "member error variance",
        "default": 1,
        "min": 0.01,
        "max": 4,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "variance",
        "label": "ensemble mean error variance",
        "formula": "ve*(rho+(1-rho)/k)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "effective",
        "label": "effective member count",
        "formula": "k/(1+(k-1)*rho)",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "mechanism"
}
```


[MATHEMATICALLY-DERIVED] Under covariate shift with unchanged $P(Z\mid X)$ and deployment support contained in training support,

$$
\mathbb E_{P_{\rm dep}}[\ell]=
\mathbb E_{P_{\rm tr}}\left[
\frac{dP_{\rm dep}}{dP_{\rm tr}}(X)\,\ell(X,Z)\right].
$$
*(Eq. 32.10)*

This change-of-measure identity does not supply the density ratio. Heavy-tailed weights can make estimation unusable; clipping them introduces bias. If preference semantics change or optimized candidates leave training support, the assumptions fail and importance weighting does not repair the target. Updating the reward model on new candidates creates a new estimator/version, requiring a fresh audit rather than reusing the old calibration label.

## Algorithm

[DERIVED] Algorithm 32.3 is a bounded training and handoff specification. It deliberately separates model selection from calibration and scientific evaluation.

**Algorithm 32.3 — Reward fitting, selection, calibration and handoff.** Let $\mathcal D_{\rm tr},\mathcal D_{\rm dev},\mathcal D_{\rm cal},\mathcal D_{\rm test}$ be lineage-disjoint inputs; $\phi_t^{(j)}$ the $j$th member state; $a_{\rm cal}^{(j)}>0$ a calibration temperature. The schedules, member seeds, serializer and finite training cap are frozen. Before lines 2–5, require finite nonnegative batch weights with strictly positive total mass; reject an invalid batch before forming its quotient. These lines run only for live members.

$$
\begin{aligned}
(1)\;&\phi_0^{(j)}\leftarrow\operatorname{Initialize}(v_j,s_j)\quad(j=1,\ldots,k).\\
(2)\;&\Delta_i^{(j)}\leftarrow r_{\phi_t^{(j)}}(x_i,y_i^+)-r_{\phi_t^{(j)}}(x_i,y_i^-).\\
(3)\;&\mathcal L_t^{(j)}\leftarrow\frac{\sum_{i\in\mathcal B_t}w_i\operatorname{softplus}(-\Delta_i^{(j)})}{\sum_{i\in\mathcal B_t}w_i}.\\
(4)\;&g_t^{(j)}\leftarrow\nabla\mathcal L_t^{(j)}.\\
(5)\;&\phi_{t+1}^{(j)}\leftarrow\begin{cases}\phi_t^{(j)}-\eta_tg_t^{(j)},&\operatorname{Finite}(\mathcal L_t^{(j)},g_t^{(j)}),\\
\mathrm{FAILED},&\text{otherwise; retain failure record}.\end{cases}\\
(6)\;&\text{repeat lines 2--5 for }0\le t<t_{\max}\text{ on training data only}.\\
(7)\;&\phi_*^{(j)}\leftarrow\operatorname{Select}_{\rm dev}(\{\phi_t^{(j)}\}_t).\\
(8)\;&a_*^{(j)}\leftarrow\operatorname{FitTemperature}_{\rm cal}(\phi_*^{(j)};a>0).\\
(9)\;&v_*\leftarrow\operatorname{Freeze}(\phi_*^{(1:k)},a_*^{(1:k)},\text{serializer, decision rule}).\\
(10)\;&\mathcal E\leftarrow\operatorname{Evaluate}_{\rm test,shift}(v_*).\\
(11)\;&\text{return }(v_*,\mathcal E,\text{failed members, unsupported slices}).
\end{aligned}
$$

A FAILED member exits its training loop immediately and follows the frozen failure policy; it is never silently discarded after the final evaluation. Unless that policy already declares a replacement procedure, a failed required member prevents promotion of the ensemble. No data-dependent choice after line 9 is labeled an independent test of the original version. FitTemperature is itself a bounded minimization procedure recorded with its range, tolerance and step cap.

[DERIVED] Training data may be bootstrapped by prompt group, but duplicated rows do not create independent annotations. Every ensemble member must retain its initialization and data-resampling identity. A failed member cannot be silently removed after evaluating the test set; that removal is an additional selection decision. Termination follows the finite configuration/step budgets, and no checkpoint is promoted when its admissibility checks fail.

## Implementation

[DERIVED] A frozen encoder with multiple lightweight heads shares expensive token processing, reducing trainable state while making feature errors shared. Adapter ensembles change internal features but require member-specific forward work unless an explicitly verified implementation shares computation. Full independent models multiply parameter residency. Batched candidate scoring is not a guarantee that all heads or adapters see identical padding and ending tokens; verify the serializer-to-head index mapping on fixtures.

[MATHEMATICALLY-DERIVED] For feature width $d_f$, $k$ linear heads require $k(d_f+1)$ parameters. With a stored feature matrix of $n_u$ candidates, feature memory is $n_ud_fb$ bytes; it can dominate head state. A dense last-layer covariance requires quadratic storage in $d_f$ and a cubic naive factorization, although structured or iterative solvers alter this boundary. Explicitly distinguish a posterior approximation from an exact Bayesian posterior over the full language model. A Hessian approximation dropping likelihood curvature weights is a different estimator, not merely a faster implementation of an unchanged matrix.

[DERIVED] Generative evaluators add sampled critique tokens and score parsing. For $m$ candidates and $k$ independent score rollouts per candidate, inference requires $mk$ generation episodes. Pairwise all-pairs judging requires $m(m-1)/2$ comparison episodes at one repeat, but token counts per episode differ. Thus episode-count complexity does not establish a speedup. Distributed communication, KV memory, timeouts, retry volume and cost per usable score must be measured under the same serving boundary. Energy, money and achieved latency remain UNVERIFIED here.


```figure
{
  "id": "fig-32.16",
  "kind": "memory-stack",
  "title": "Shared features and independent heads",
  "caption": "Illustrative tensor storage separates frozen candidate features from trainable linear heads; it excludes encoder parameters, optimizer state and allocator overhead.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "Illustrative tensor storage separates frozen candidate features from trainable linear heads; it excludes encoder parameters, optimizer state and allocator overhead. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "format": "bytes",
    "variables": {
      "nu": 4096,
      "df": 2048,
      "k": 8,
      "bv": 4
    },
    "bars": [
      {
        "label": "stored feature training",
        "segments": [
          {
            "label": "candidate features",
            "kind": "tensor",
            "formula": "nu*df*bv"
          },
          {
            "label": "linear heads",
            "kind": "model",
            "formula": "k*(df+1)*bv"
          }
        ]
      }
    ]
  }
}
```


## Experimental design

[PAPER-REPORTED] The reported protocols are estimator-specific. The following table reconstructs the inspected experiment, not a configuration executed for this chapter.

| Source and field | Disclosed protocol | Locator |
|---|---|---|
| R32.3 backbone families | Qwen3 0.6–32B; reward-initialized Skywork-Qwen3 0.6–8B; adapter/dropout study at most 4B | §5.1 |
| R32.3 data | UltraFeedback approximately 62K train/1K validation; Skywork approximately 77K and Tulu3 approximately 273K alternate training; RewardBench final evaluation | §5.1 |
| R32.3 preprocessing/selection | Remove sequences above 2,048 tokens; ECE at most 0.05, EBCE at most 0.01, then $RS_{0.2}$ | §5.1, B.3 |
| R32.3 fitting | AdamW $(0.9,0.999,10^{-8})$, zero decay; one epoch, cosine schedule, 5% warmup; effective batch 64, adapter ensemble 16 | B.2 |
| R32.3 estimator sizes | 20 two-layer 128-wide MLP heads; eight rank-16 adapters, scaling 32; 20 inference dropout masks; linear posterior head | B.2 |
| R32.3 hardware/unknowns | Four GH200 GPUs; exact package pins, repeated-training seeds and cross-seed intervals: NOT-DISCLOSED in inspected protocol | B.1–2 |
| R32.1 training | Approximately 21K filtered HelpSteer3 pairs; Qwen3 8/14/32B; two epochs, batch 96, four rollouts, learning rate $5\times10^{-6}$ | §4.1, B.1 |
| R32.1 ablation | Preference-strength reward collapses; mean-based reward evaluated separately | §4.3, Fig. 3 |

[DERIVED] RewardUQ's shared-head and posterior-head estimators require informative frozen embeddings; changing heads cannot recover information absent from those features. Its adapter estimator can change representations, while dropout samples a stochastic inference subnetwork rather than new training data. For a linear feature head with prior precision $\alpha_0 I$ and observed feature differences $d_i$, a local Gaussian approximation uses a precision matrix $H=\alpha_0 I+\sum_i w_i^{\rm curv}d_id_i^\top$ and predictive variance $d^\top H^{-1}d$. The curvature weights are likelihood second derivatives. RewardUQ §4.4 explicitly uses an unweighted approximation for incremental practicality; this approximation must not be attributed the exact curvature-weighted posterior's semantics. This is an explanatory matrix reconstruction; no posterior coverage theorem is asserted.

[DERIVED] For IRPM's sampled score groups, averaging logistic cross-group margins estimates an expectation over score pairs, whereas applying a logistic function to averaged scores estimates a different quantity. Nonlinearity prevents exchanging the expectation and sigmoid. Within-group rollouts are reused across many cross-group terms, so $k^2$ terms do not mean $k^2$ independent draws. The source's observed variance-collapse ablation therefore concerns reward design and stochastic score distributions, not merely fitting the deterministic loss in Eq. 32.6.

[DERIVED] Preference accuracy alone cannot establish probability calibration, accepted-task correctness or resistance to optimization against the score. Those are different evaluation axes; the reported RewardUQ protocol and its estimator-specific selection rule must remain attached to its comparison. The book's unexecuted artifact protocol is specified separately in [verification](verification.md).

## Observations

**What the paper claims.** [PAPER-REPORTED] RewardUQ's comparisons depend strongly on model size, initialization and dataset; IRPM demonstrates that an apparently natural intergroup reward can destabilize training. [R32.3, §5.2; R32.1, Fig. 3].

**What the evidence shows.** [DERIVED] These are controlled comparisons within their disclosed studies, not independent certification of uncertainty intervals or a guarantee for future optimized policies.

**What we infer.** [MATHEMATICALLY-DERIVED] Correlated ensemble errors leave a variance floor in Eq. 32.9. Independent score noise and common bias require different diagnostics; simply increasing $k$ cannot remove both.

**What remains unknown.** [UNVERIFIED] Actual error correlation, out-of-support calibration, robust serving cost and independent replication for the book's artifact remain unresolved.

## Failure modes

[DERIVED] Symptoms include reward-offset drift with constant rankings, excellent calibration pooled over data but severe subgroup failure, large ensemble agreement on adversarial candidates, and calibration improvements that disappear after the policy changes. Repeated test-set temperature tuning contaminates evaluation. Numerical saturation can disguise reward-scale divergence; inspect logits and gradients rather than only loss.


```figure
{
  "id": "fig-32.17",
  "kind": "stat-panel",
  "title": "Calibration is a versioned contract",
  "caption": "The audit keeps target event, conditioning population and selection roles explicit. A new policy checkpoint can change the population without changing the reward code.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "The audit keeps target event, conditioning population and selection roles explicit. A new policy checkpoint can change the population without changing the reward code. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "header": "REWARD HANDOFF",
    "variables": {},
    "rows": [
      {
        "key": "prediction event",
        "value": "declared comparison"
      },
      {
        "key": "calibration population",
        "value": "candidate version bound"
      },
      {
        "key": "confidence",
        "value": "requires coverage audit"
      },
      {
        "key": "outside support",
        "value": "unverified"
      }
    ]
  },
  "anchor": "failure-modes"
}
```


## Siblings

[DERIVED] [Preference models](32-2-preference-models.md) own the observation likelihood; this section owns estimation and validation for it. [Verification](32-4-outcome-and-process-verification.md) changes from predicted preference to a domain-limited correctness procedure. [Oversight](32-5-oversight-strategies.md) can defer low-confidence cases to independent evidence, but its routing rule requires its own risk audit. No estimator architecture eliminates these boundaries.

## Extensions

[DERIVED] Active acquisition can select uncertain comparisons, but this changes the label distribution. Preserve acquisition probabilities when population-risk estimates require reweighting. An online reward-model refresh must isolate newly labeled data from final evaluation and preserve old versions for rollback. An ensemble of identical prompts on one model is a sampling ensemble, not independent training evidence.


```figure
{
  "id": "fig-32.18",
  "kind": "compare",
  "title": "Uncertainty interfaces and costs",
  "caption": "The axis is which uncertainty is represented and which computation is shared; no method is certified by this analytical comparison.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "The axis is which uncertainty is represented and which computation is shared; no method is certified by this analytical comparison. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "axis": "Shared computation and uncertainty representation",
    "columns": [
      {
        "id": "heads",
        "label": "Shared heads"
      },
      {
        "id": "adapter",
        "label": "Adapters"
      },
      {
        "id": "full",
        "label": "Independent models"
      },
      {
        "id": "gen",
        "label": "Generative repeats"
      }
    ],
    "rows": [
      {
        "dimension": "shared encoder",
        "values": {
          "heads": "yes by design",
          "adapter": "implementation dependent",
          "full": "no",
          "gen": "same model repeated"
        }
      },
      {
        "dimension": "trainable state",
        "values": {
          "heads": "small heads",
          "adapter": "adapters",
          "full": "full models",
          "gen": "none for sampling"
        }
      },
      {
        "dimension": "common blind spot",
        "values": {
          "heads": "shared representation",
          "adapter": "shared initialization/data",
          "full": "shared objective/data",
          "gen": "shared judge/rubric"
        }
      },
      {
        "dimension": "cost driver",
        "values": {
          "heads": "feature extraction",
          "adapter": "member forwards",
          "full": "model residency",
          "gen": "generated tokens"
        }
      }
    ]
  }
}
```


## Limitations

[DERIVED] Confidence labels are meaningful only against a target event and coverage definition. Reward models generally cannot certify arbitrary truth, policy safety or deployment utility from finite preference data. The strongest supported handoff is a versioned predictive instrument with documented operating regimes and failure slices. A downstream optimizer can reveal failures that ordinary held-out ranking never exposed.

## Reproducibility

[DERIVED] Retain exact source-model checkpoints, trainable-tensor selection, prompt serializer, tokenizer, loss denominator, group weights, random seeds, candidate provenance, calibration split, threshold-selection rule and final test manifest. Publish all tried configurations and their selection roles. Record source experiments as PAPER-REPORTED and the book's proposed calibration study as unexecuted. Primary versions and gaps are in [references](references.md).

## References

[R32.3] RewardUQ, §3–5 and Appendices A–B. [R32.1] IRPM v2, §3.1–3.4, §4.3 and Appendix B. No newer access date is used to admit an older source.
