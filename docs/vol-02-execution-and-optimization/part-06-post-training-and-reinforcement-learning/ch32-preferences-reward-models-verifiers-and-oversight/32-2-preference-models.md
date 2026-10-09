---
id: "ms.section.32.2"
entity_type: "section"
title: "Preference models"
short_title: "Preference models"
volume: 2
part: 6
chapter: 32
section: 32.2
slug: "32-2-preference-models"
parent: "ms.chapter.32"
prev_sibling: "ms.section.32.1"
next_sibling: "ms.section.32.3"
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

# 32.2 — Preference models

## Scope

[DERIVED] Identify the mathematical commitments that convert human or AI comparisons into a preference model. The section owns Bradley–Terry conditions, pairwise and listwise observations, ties, annotator disagreement and contextual preference. A successful fit states which population and rubric it predicts, its identifiability constraints and the evidence against its structural assumptions. Optimization of a policy from preferences belongs to Chapter 33; this section establishes the statistical interface that such an objective consumes.

## Why this exists

[DERIVED] Comparative labels do not uniquely specify a scalar reward. The modeler chooses whether preferences are transitive, whether presentation changes the comparison, whether labels share one population and whether a tie means indifference or missing information. A flexible neural encoder cannot recover information removed by these choices. Excellent pairwise training accuracy can coexist with contradictory candidate rankings if the target relation is cyclic or changes with context.

[PAPER-REPORTED] The 2026 ordinal-feedback study fits learned ordered thresholds instead of treating preference strength only as a manually selected margin. HRC explicitly separates scalar and cyclic components. They address different failures of a binary scalar model: discarded ordinal information and relational structure, respectively. [R32.2, §3; R32.12, §4–5].

## Intuition

[MATHEMATICALLY-DERIVED] A scalar utility assigns each candidate a location on one axis. Pairwise probabilities depend on differences, so adding a prompt-specific constant changes no comparison. If $a$ is preferred to $b$, $b$ to $c$, and $c$ to $a$, with each probability strictly above one half in the same context, no scalar difference model can represent all three. Summing the required positive differences gives zero, a contradiction. More parameters in the encoder cannot remove that algebraic obstruction.

[DERIVED] A tie is not merely an unconfident strict label. A judge can be certain that two outputs satisfy the rubric equally well. Conversely, a judge can be uncertain which output is correct without believing they are equivalent. Model the observation the annotation process actually produces; do not infer the psychological reason from a numerical zero.


```figure
{
  "id": "fig-32.7",
  "kind": "diagram",
  "title": "Scalar preference and cyclic residual",
  "caption": "Three strictly positive edge preferences around one fixed-context cycle cannot all be differences of scalar utilities; the cycle is a constructed counterexample.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "Three strictly positive edge preferences around one fixed-context cycle cannot all be differences of scalar utilities; the cycle is a constructed counterexample. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "Candidate A",
        "sub": "r_A"
      },
      {
        "id": "b",
        "kind": "state",
        "label": "Candidate B",
        "sub": "r_B"
      },
      {
        "id": "c",
        "kind": "state",
        "label": "Candidate C",
        "sub": "r_C"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "b",
        "label": "positive log odds"
      },
      {
        "from": "b",
        "to": "c",
        "label": "positive log odds"
      },
      {
        "from": "c",
        "to": "a",
        "label": "positive log odds"
      }
    ]
  }
}
```


## Formulation

| Symbol | Meaning | Conditions |
|---|---|---|
| $r_i=r_\phi(x,y_i,c)$ | Scalar preference utility | Context $c$ includes rubric and population |
| $\Delta=r_i-r_j$ | Utility difference | Dimensionless log-odds scale |
| $\sigma(v)$ | Logistic function | $1/(1+e^{-v})$ |
| $\pi$ | Ordering of a finite candidate set | Each candidate appears once |
| $z_o$ | Ordered preference category | $1,\ldots,q$ |
| $a_0,\ldots,a_q$ | Ordered cutpoints | $a_0=-\infty$, $a_q=+\infty$ |
| $h$ | Symmetric indifference threshold | $h>0$ |

[MATHEMATICALLY-DERIVED] Suppose latent utilities are $r_i+\epsilon_i$ with independent unit-scale Gumbel noise and a fixed comparison context. A common nonunit noise scale must first be absorbed into the reward units. Equivalently, compare independent exponential arrival times with rates $e^{r_i}$. Integrating the first-arrival density gives

$$
\Pr(i\succ j)=\int_0^\infty e^{r_i}e^{-t(e^{r_i}+e^{r_j})}\,dt
=\frac{e^{r_i}}{e^{r_i}+e^{r_j}}=\sigma(\Delta).
$$
*(Eq. 32.3)*

This is an original derivation of the Bradley–Terry likelihood under declared conditions, not a claim of a new 2026 invention. Equal noise scale fixes the reward unit; heteroskedastic or correlated errors do not automatically preserve this form. Conditional independence of annotations is an additional likelihood assumption, distinct from noise independence within one comparison.

[MATHEMATICALLY-DERIVED] Applying the same exponential-race construction to a complete ordering gives the listwise likelihood

$$
\Pr(\pi\mid x,c)=\prod_{j=1}^{m-1}
\frac{e^{r_{\pi_j}}}{\sum_{\ell=j}^{m}e^{r_{\pi_\ell}}}.
$$
*(Eq. 32.4)*

The remaining-candidate ratios impose independence of irrelevant alternatives under the stated model. An arbitrary ranking annotation need not satisfy that condition. Partial rankings require conditioning on the observed event, not pretending an unobserved suffix was ordered.


```figure
{
  "id": "fig-32.8",
  "kind": "tensor-flow",
  "title": "Listwise likelihood reuses candidate scores",
  "caption": "A candidate set produces one score per candidate; suffix normalization evaluates the ordering without treating its derived pairs as independent observations.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "A candidate set produces one score per candidate; suffix normalization evaluates the ordering without treating its derived pairs as independent observations. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "dims": {
      "M": "candidate count",
      "Q": "ordinal categories"
    },
    "steps": [
      {
        "shape": "[M]",
        "label": "candidate rewards"
      },
      {
        "shape": "[M]",
        "op": "ordering permutation",
        "cost": "one observed ordering"
      },
      {
        "shape": "[M]",
        "op": "suffix log-sum-exp",
        "cost": "linear auxiliary work"
      },
      {
        "shape": "[1]",
        "op": "sum observed log probabilities",
        "cost": "one listwise likelihood"
      }
    ]
  }
}
```


## Mechanism

[MATHEMATICALLY-DERIVED] Pairwise learning identifies differences on the comparison graph. If that graph has disconnected components, each has an independently free offset. Comparisons across those components are unconstrained by the likelihood. Even a connected graph does not ensure a finite unregularized maximum when one candidate always wins along a separating direction. Centering rewards removes an offset gauge but does not resolve separation, label shift or missing comparison support. Regularization introduces a prior or preference for finite parameters; it is not evidence that the true utility scale has been recovered.

[MATHEMATICALLY-DERIVED] An ordered-logistic construction treats the observed category as an interval of a noisy margin. With logistic margin noise,

$$
\Pr(z_o=j\mid\Delta)=\sigma(a_j-\Delta)-\sigma(a_{j-1}-\Delta).
\qquad
\Pr(\mathrm{tie}\mid\Delta)=\sigma(h-\Delta)-\sigma(-h-\Delta).
$$
*(Eq. 32.5)*

Ordered finite cutpoints make category probabilities nonnegative, and telescoping makes them sum to one. Symmetric cutpoints preserve the mapping between swapped candidates and reversed labels; asymmetric cutpoints model a presentation asymmetry unless some other observation process justifies them. At $h\rightarrow0$, tie probability vanishes. At large $h$, the model can assign most mass to a tie without assigning equal probability to every strict ordering.

[DERIVED] A loss that assigns the target probability one half to a tie optimizes a different observation model from Eq. 32.5. It asks the binary classifier to predict random preference direction on tied cases; it does not estimate the probability of a third observed event. Both can be useful engineering choices, but they cannot be called equivalent by exchanging labels. With seven ordinal levels, collapsing magnitude to sign discards constraints on threshold crossings. Conversely, treating ordinal category distance as cardinal utility imposes equal spacing that the annotation instruction may never have requested.


```figure
id: fig-32.9
kind: calculator
title: Tie probability under an ordered model
caption: Eq. 32.5 assigns probability to a third event rather than turning a tie into a binary soft label. Margin and threshold are illustrative.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-32.5
alt: Eq. 32.5 assigns probability to a third event rather than turning a tie into a binary soft label. Margin and threshold are illustrative. The structure is an analytical construction; it is not a measured result for a named model.
spec:
  tex: P_{tie}=\sigma(h-\Delta)-\sigma(-h-\Delta)
  equation: "32.5"
  inputs:
    - symbol: delta
      label: reward margin
      default: 0
      min: -6
      max: 6
      format: fixed3
    - symbol: h
      label: tie threshold
      default: 1
      min: 0.05
      max: 4
      format: fixed3
  outputs:
    - symbol: tie
      label: tie probability
      formula: 1/(1+exp(delta-h))-1/(1+exp(delta+h))
      format: raw
      emphasis: true
anchor: mechanism
```


[DERIVED] Annotator disagreement can arise from stochastic error, stable taste differences, expertise limits or different interpretations of the task. A mixture $\sum_a w_a\sigma(\Delta_a)$ is generally not equal to $\sigma(\sum_a w_a\Delta_a)$, because the logistic map is nonlinear. Majority aggregation therefore does not imply a single latent annotator. Keep a contextual population model or explicitly declare that the target is the aggregate observation distribution. A preference reversal after changing the user constraint is not necessarily inconsistency; it is inconsistency only if the conditioning context was intended to remain fixed.

[MATHEMATICALLY-DERIVED] To inspect a cycle, compute the observed three-edge log-odds sum $\Gamma=\operatorname{logit}(p_{ab})+\operatorname{logit}(p_{bc})+\operatorname{logit}(p_{ca})$. Any exact scalar Bradley–Terry relation has $\Gamma=0$ through cancellation. A nonzero estimate can reflect finite sample noise, presentation effects or structural cyclicity. Uncertainty must be clustered by prompt and annotator; the sum alone does not identify which cause produced the violation.

[PAPER-REPORTED] HRC adds a skew-bilinear term to a scalar difference, with context gating. Its zero-integral interpretation requires a zero-mean embedding distribution; unit normalization alone is insufficient. [R32.12, §4.1–4.2, source theorem numbered 4.6].

[MATHEMATICALLY-DERIVED] For the local reconstruction $s_{ij}=r_i-r_j+v_i^\top Wv_j$ with $W^\top=-W$, swapping candidates gives $s_{ji}=-s_{ij}$ because $v_j^\top Wv_i=-v_i^\top Wv_j$. Skew symmetry therefore preserves complementary binary probabilities but permits nonzero cycle sums. If $\mathbb E[v_j]=0$, the cyclic term averages to zero against that reference population. Reweighting the population can change that mean, so this interpretation is population-dependent. The scalar term can supply a hierarchy while the relational term models pair-specific residual structure. It is not generally possible to replace the whole relation by one cached scalar score.

[DERIVED] A cyclic embedding of width $d_c$ adds $d_cd_f+d_c$ projection parameters before any gate or operator parameters. Scoring a candidate set once costs its shared encoder forwards; comparing arbitrary pairs then requires relational operations whose cost depends on the operator structure and requested ranking rule. An assertion of linear feature extraction is different from a guarantee that every pairwise matrix is computed in linear work. Gate functions, norm-zero handling and scalar clipping are part of the model definition. A clipping plateau changes gradients; it is not merely a rendering constraint.

```figure
{
  "id": "fig-32.39",
  "kind": "chart",
  "title": "A tie model assigns three mutually exclusive outcomes",
  "caption": "Ordered-logistic analytical probabilities with unit noise scale and tie thresholdh=1. At margins−2,0,2, loss/tie/win probabilities sum toone in every group. A zero margin gives a tie probability about0.462, with the remaining probability split equally between win and loss; it does not force a tie.",
  "alt": "Ordered-logistic analytical probabilities with unit noise scale and tie thresholdh=1. At margins−2,0,2, loss/tie/win probabilities sum toone in every group. A zero margin gives a tie probability about0.462, with the remaining probability split equally between win and loss; it does not force a tie.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.5",
  "spec": {
    "type": "bar",
    "x": {
      "label": "Reward margin with tie threshold h = 1"
    },
    "y": {
      "label": "Outcome probability",
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
      "-2",
      "0",
      "2"
    ],
    "series": [
      {
        "id": "lose",
        "label": "Candidate one loses",
        "values": [
          0.7310585786300049,
          0.2689414213699951,
          0.04742587317756678
        ]
      },
      {
        "id": "tie",
        "label": "Tie",
        "values": [
          0.22151554819242833,
          0.4621171572600098,
          0.22151554819242847
        ],
        "emphasis": true
      },
      {
        "id": "win",
        "label": "Candidate one wins",
        "values": [
          0.04742587317756678,
          0.2689414213699951,
          0.7310585786300049
        ]
      }
    ]
  }
}
```

## Algorithm

[DERIVED] Algorithm 32.2 fits the ordered observation model while retaining a held-out structural audit. It is an explanatory procedure, not the verbatim algorithm of R32.2. Its threshold parameterization uses positive softplus increments plus a strictly positive numerical floor, making ordering a maintained invariant.

**Algorithm 32.2 — Ordered-likelihood fitting with guarded updates.** Let $\Phi=(\phi,u)$ contain reward parameters and threshold parameters, $\eta_t>0$ a fixed learning-rate schedule, $\epsilon_a>0$ an explicitly chosen minimum cutpoint gap, and $t_{\max}$ the finite step cap. The data split, rubric, weights and regularizer $\Omega$ are frozen inputs. $\mathcal B_t$ contains training comparisons only.

$$
\begin{aligned}
(1)\;&\Phi_0\leftarrow\operatorname{Initialize}(\text{checkpoint, seed});\quad t\leftarrow0.\\
(2)\;&a_1\leftarrow u_1;\quad a_j\leftarrow a_{j-1}+\log(1+e^{u_j})+\epsilon_a\quad(2\le j<q).\\
(3)\;&a_0\leftarrow-\infty;\quad a_q\leftarrow+\infty.\\
(4)\;&\Delta_i\leftarrow r_\phi(x_i,y_i,c_i)-r_\phi(x_i,y'_i,c_i).\\
(5)\;&\ell_i\leftarrow-\log[\sigma(a_{z_i}-\Delta_i)-\sigma(a_{z_i-1}-\Delta_i)].\\
(6)\;&\mathcal L_t\leftarrow\frac{\sum_{i\in\mathcal B_t}w_i\ell_i}{\sum_{i\in\mathcal B_t}w_i}+\Omega(\Phi_t).\\
(7)\;&g_t\leftarrow\nabla_\Phi\mathcal L_t;\quad b_t\leftarrow\operatorname{Finite}(\mathcal L_t,g_t).\\
(8)\;&\Phi_{t+1}\leftarrow\begin{cases}\Phi_t-\eta_tg_t,&b_t=1,\\\Phi_t,&b_t=0\ \text{and record failure}.\end{cases}\\
(9)\;&t\leftarrow t+1;\quad\text{repeat lines 2--8 while }t<t_{\max}.\\
(10)\;&t^*\leftarrow\operatorname*{argmin}_{t\in\mathcal T_{\rm valid}}\mathcal L_{\rm dev}(\Phi_t).\\
(11)\;&\text{return }\Phi_{t^*},\operatorname{Audit}_{\rm heldout}(\Phi_{t^*})\text{, or FAILURE if }\mathcal T_{\rm valid}=\varnothing.
\end{aligned}
$$

Lines 2–3 enforce strict threshold order at every finite update. Line 5 is evaluated through stable log-CDF differences. The display shows guarded gradient descent as an explanatory optimizer; using another optimizer requires its state and update rule in the artifact. The audit includes order swaps, ties, contexts and cycle residuals; it never selects $t^*$.

[DERIVED] Stability matters when adjacent CDF values are almost equal. Direct subtraction followed by a log can underflow; use log-CDF identities with `log1p`/`expm1` equivalents and retain an explicit diagnostic for near-collapsed intervals. Silently clamping every probability changes both the likelihood and its gradient. The algorithm terminates at the step cap; early stopping is a selection rule whose validation set cannot later become a reported independent test set.


```figure
{
  "id": "fig-32.10",
  "kind": "stat-panel",
  "title": "Identifiability ledger",
  "caption": "The score offset remains free within each connected comparison component; more fitted parameters do not create missing comparisons.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "The score offset remains free within each connected comparison component; more fitted parameters do not create missing comparisons. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "header": "COMPARISON SUPPORT",
    "variables": {},
    "rows": [
      {
        "key": "connected components",
        "value": "each has a free offset"
      },
      {
        "key": "reward unit",
        "value": "fixed by noise scale"
      },
      {
        "key": "strict separation",
        "value": "may have no finite MLE"
      },
      {
        "key": "ties",
        "value": "retain the observed event"
      }
    ]
  },
  "anchor": "formulation"
}
```


## Implementation

[DERIVED] Reward encoders consume prompt–response pairs with identical conversation serialization across compared outputs. Batch padding and last-token indexing must distinguish true sequence endings from padding. Scalar rewards are computed once per candidate; a listwise likelihood reuses them. For $m$ candidates, scoring cost is $m$ encoder forwards, and the ordering likelihood can use suffix log-sum-exp in linear auxiliary work. Expanding one ranking into every pair creates $m(m-1)/2$ labels but no corresponding multiplication of independent evidence.

[MATHEMATICALLY-DERIVED] With hidden width $d_f$ and a scalar head, head parameter count is $d_f+1$. A seven-category ordinal model adds six finite cutpoints before symmetry constraints. These small head counts do not imply cheap encoder execution: sequence length, attention layout, activation checkpointing and sharding determine dominant FLOPs and memory. Repeated annotator judgments add data and inference cost, not encoder parameters. Cross-rank communication follows the chosen distributed training plan. No concrete training engine is claimed to have been reproduced here; reference-stack implementation details remain version-specific and UNVERIFIED.

[DERIVED] Context features must be available at deployment. Training a model conditioned on an annotator ID and then dropping that ID at inference requires a defined mixture or default population. Likewise, using gold correctness as a training-side context field creates an unavailable input for deployment unless the field is independently observable. Serialization is part of the statistical model, because an omitted system constraint changes $x,c$ rather than merely changing typography.

## Experimental design

[PAPER-REPORTED] The inspected source protocols fix the model and evaluation boundary as follows.

| Source | Model and fitting | Evaluation |
|---|---|---|
| R32.2, Appendix F/H.3 | Llama-3.1-Tulu-3-8B; BF16; 2,048 tokens; model LR $10^{-6}$, threshold LR $10^{-3}$; batch 64; five epochs; seed 0 | HelpSteer2: 8,677 train/448 test; joint versus frozen-score post-hoc thresholds |
| R32.12, §6/C.3 | Gemma-2B-it and Llama-3.1-8B-Instruct; Skywork-Reward-Preference-80K-v0.2; shared pairwise loss | Synthetic mixed relations and RewardBench 2; cross-seed intervals: NOT-DISCLOSED in the cited comparison |

[DERIVED] These experiments evaluate particular preference datasets and representations. They do not establish that the population has one transitive utility, that ordinal labels are equally spaced, or that an evaluator remains calibrated after policy optimization. The proposed book audit includes duplicate annotations, order-swapped inputs and prompt-disjoint held-out contexts; these checks remain unexecuted.

## Observations

**What the paper claims.** [PAPER-REPORTED] On the 448-example test, ordinal NLL-Symmetric has MAE 1.060 versus 1.725 for post-hoc Soft Label; exact accuracy is 29.7% versus 16.1% for Margin BT. HRC reports representation-specific gains. [R32.2, Table 5; R32.12, §6].

**What the evidence shows.** [DERIVED] Those results support method-specific comparisons under the reported protocols. They do not identify a universal preference geometry or certify preference-to-task transfer.

**What we infer.** [MATHEMATICALLY-DERIVED] A measured preference cycle cannot be fitted exactly by one scalar difference model. Adding ordered labels changes the observation alphabet, while adding cyclic terms changes the representable relation; neither substitution repairs the other automatically.

**What remains unknown.** [UNVERIFIED] Population-level threshold transport, robustness under newly optimized candidates and independent reproduction are unresolved for this manuscript.

## Failure modes

[DERIVED] Vanishing threshold gaps cause huge ordinal losses or numerical cancellation. Reward magnitudes can diverge under separable labels. Removing ties changes the task distribution. Duplicated rankings yield narrow but invalid uncertainty intervals if treated as independent. Contradictory order swaps reveal presentation sensitivity; stable cycles after controlling context reveal a structural mismatch worth investigating. All are observable symptoms with different corrective actions.


```figure
{
  "id": "fig-32.11",
  "kind": "compare",
  "title": "Preference assumptions by model class",
  "caption": "The comparison axis is the probability model and representable relation, not a ranking of preference-learning methods.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "The comparison axis is the probability model and representable relation, not a ranking of preference-learning methods. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "axis": "Observation alphabet and representable relation",
    "columns": [
      {
        "id": "bt",
        "label": "Binary scalar"
      },
      {
        "id": "ord",
        "label": "Ordinal scalar"
      },
      {
        "id": "cyc",
        "label": "Relational model"
      }
    ],
    "rows": [
      {
        "dimension": "observed event",
        "values": {
          "bt": "strict choice",
          "ord": "ordered category",
          "cyc": "pairwise relation"
        }
      },
      {
        "dimension": "ties",
        "values": {
          "bt": "external convention",
          "ord": "interval probability",
          "cyc": "explicit convention"
        }
      },
      {
        "dimension": "cycles",
        "values": {
          "bt": "not exact",
          "ord": "not solved by thresholds",
          "cyc": "representable if designed"
        }
      },
      {
        "dimension": "identification",
        "values": {
          "bt": "difference gauge",
          "ord": "gauge plus thresholds",
          "cyc": "representation dependent"
        }
      }
    ]
  }
}
```


## Siblings

[DERIVED] Binary and ordinal models differ in the observed event being modeled; scalar and cyclic models differ in relation class. [Reward training](32-3-reward-model-training.md) changes estimation and calibration for a chosen class. [Outcome verification](32-4-outcome-and-process-verification.md) supplies a correctness predicate with a different target. [Direct preference optimization](../ch33-direct-preference-optimization-and-related-objectives/README.md) changes how preference evidence updates a policy, and does not eliminate its observational assumptions.

## Extensions

[DERIVED] Listwise annotations with ties require probabilities of equivalence classes or partial-order events. Arbitrarily breaking a tie with candidate position creates fabricated strict comparisons. Contextual user preferences may require a conditional relation or a declared social aggregation rule. A new user population is a distribution shift even if the language and task names stay the same.


```figure
{
  "id": "fig-32.12",
  "kind": "chart",
  "title": "The indifference region",
  "caption": "Eq. 32.5 produces a tie-probability peak near zero margin. The three curves vary only the declared threshold, with no benchmark data.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.5",
  "alt": "Eq. 32.5 produces a tie-probability peak near zero margin. The three curves vary only the declared threshold, with no benchmark data. The structure is an analytical construction; it is not a measured result for a named model.",
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
      "label": "tie probability",
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
        "id": "narrow",
        "label": "h = 0.5",
        "formula": "1/(1+exp(x-0.5))-1/(1+exp(x+0.5))",
        "sample": {
          "from": -6,
          "to": 6,
          "count": 161
        },
        "emphasis": true
      },
      {
        "id": "mid",
        "label": "h = 1",
        "formula": "1/(1+exp(x-1))-1/(1+exp(x+1))",
        "sample": {
          "from": -6,
          "to": 6,
          "count": 161
        },
        "dashed": true
      },
      {
        "id": "wide",
        "label": "h = 2",
        "formula": "1/(1+exp(x-2))-1/(1+exp(x+2))",
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
        "y": 0.4621171572600098,
        "label": "Equal reward need not mean an almost-certain tie"
      }
    ]
  }
}
```


## Limitations

[DERIVED] Likelihood fit does not prove the latent-utility story. Many latent mechanisms generate similar pairwise observations on finite support. A model may predict labels usefully without its utility being identifiable beyond a gauge or without its representation supporting policy-wide optimization. The valid operating regime is the declared population, context and comparison support; extrapolation must be evaluated separately.

## Reproducibility

[DERIVED] Record annotation instructions, ties/abstentions, presentation randomization, comparison graph connectivity, candidate lineage, threshold initialization and regularization, optimizer budget and checkpoint-selection rule. Publish pairwise and ordinal metrics separately with group-aware uncertainty. All equations here state their premises; first-publication dates and inspected source locators are retained in [references](references.md).

## References

[R32.2] Ordinal-feedback framework, §3, Appendix F and H.3. [R32.12] HRC, §4–6 and Appendix C.3. Foundational likelihoods are derived locally and are not presented as recent inventions.
