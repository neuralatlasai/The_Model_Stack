---
id: ms.section.62.2
entity_type: section
title: "Pairwise aggregation"
volume: 3
part: 11
chapter: 62
section: 62.2
slug: 62-2-pairwise-aggregation
parent: ms.chapter.62
prev_sibling: ms.section.62.1
next_sibling: ms.section.62.3
children: []
prerequisites: [ms.chapter.6, ms.chapter.61]
downstream: [ms.chapter.63, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [evaluation_validity], feedback_setting: [], modality: [text, image, audio, video]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 62.2 Pairwise aggregation

## Scope

[DERIVED] Pairwise aggregation converts judgments into estimates of comparative preference under a declared task/rater population. It does not create an absolute quality scale. This section covers Bradley–Terry and Elo-style constructions, ties, uncertainty, population dependence and non-transitivity. Preference collection belongs to [62.1](62-1-human-evaluation-design.md); reward-model training objectives remain at their canonical post-training chapters.

[DERIVED] A ranking is useful when a scalar projection answers the intended selection question and its residual failures are acceptable. If tasks or users exhibit cycles, strong interactions or disconnected comparison groups, a single order can conceal decision-relevant structure. Preserve the pairwise matrix and subgroup results even when publishing scores.

## Why this exists

[DERIVED] Raw win counts confound candidate strength with the opponents and prompts encountered. A system facing easier opponents can win more often without being preferred in a matched comparison. A paired-comparison model attempts to share information across this comparison graph, but its assumptions become part of the instrument.

[DERIVED] The obstruction is identification. Adding the same constant to all latent scores changes no pairwise difference; fitting judge sensitivity adds a scale symmetry. Position, length and family effects can be confounded with quality. More optimization iterations or a ridge penalty cannot turn observationally equivalent parameters into separately identified scientific quantities.

## Intuition

[DERIVED] Bradley–Terry represents preference odds through score differences. It is a parsimonious response model, not a proof that users possess a one-dimensional utility. Elo-style updates are an online optimization rule for a related logistic model after a scale convention; the update schedule and order affect finite-data results.

[DERIVED] Ties require a declared meaning. Coding them as half a win estimates a tie-adjusted mean through fractional log loss. Modeling a tie category explicitly estimates a three-outcome distribution. These are not the same likelihood, even when they produce similar candidate orderings. Dropping ties instead conditions on decisive judgments and can change the target population.

## Formulation

[MATHEMATICALLY-DERIVED] For a binary comparison $y_t=1$ when candidate $i_t$ beats $j_t$, define scores $s_i\in\mathbb R$ and

$$
p_t=\sigma(s_{i_t}-s_{j_t}),\qquad \mathcal L_{\mathrm{BT}}=-\sum_t[y_t\log p_t+(1-y_t)\log(1-p_t)],\qquad \sum_i s_i=0.
$$
*(Eq. 62.4)*

[DERIVED] The location constraint fixes a gauge. A connected graph is necessary to compare all scores, but complete separation can still make unpenalized estimates diverge; finite estimation needs suitable win connectivity or explicit regularization. An Elo-style stochastic-gradient step changes $s_i$ by $\eta(y_t-p_t)$ and $s_j$ by its negative, for a declared positive step size. One pass is not batch maximum likelihood.

[MATHEMATICALLY-DERIVED] For an explicit tie model, let $v_i=e^{s_i}$, $\nu\ge0$ and $Z_{ij}=v_i+v_j+2\nu\sqrt{v_iv_j}$. A normalized three-outcome construction is

$$
P(i\succ j)=\frac{v_i}{Z_{ij}},\qquad P(j\succ i)=\frac{v_j}{Z_{ij}},\qquad P(i\sim j)=\frac{2\nu\sqrt{v_iv_j}}{Z_{ij}}.
$$
*(Eq. 62.5)*

[DERIVED] The probabilities sum to one and reduce to the binary model when $\nu=0$. This tied construction is not claimed as a new 2026 invention. For position-aware judge aggregation, a declared conditional-mean model is

$$
\begin{aligned}
p_t&=\sigma\!\left(\gamma_{k_t}(s_{a_t}-s_{b_t})+\zeta_{k_t}+\ell_{k_t}L_t+f_{k_t}F_t\right),\quad \gamma_k>0,\\
q_{ij}&=\sigma\!\left(\bar\gamma(s_i-s_j)\right),\qquad \bar\gamma=K_j^{-1}\sum_k\gamma_k,\quad \sum_i s_i=0,\quad\gamma_{\mathrm{ref}}=1.
\end{aligned}
$$
*(Eq. 62.6)*

[DERIVED] $a_t,b_t$ are actual display slots, $L_t$ signed length contrast, $F_t$ a declared family contrast, and $\zeta,\ell,f$ judge-specific nuisance coefficients. $q_{ij}$ sets those effects to zero at average sensitivity. It is not the average of all judges' nonlinear probabilities, nor an empirical human-population preference by definition.

```figure
{
  "id": "fig-62.6",
  "kind": "calculator",
  "title": "Binary paired preference scale",
  "caption": "Illustrative Bradley–Terry probability under Eq. 62.4 with the displayed score convention. Score differences are log odds, not percentage-point quality, and the scalar model can fail under cycles.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.4",
  "alt": "Illustrative Bradley–Terry probability under Eq. 62.4 with the displayed score convention. Score differences are log odds, not percentage-point quality, and the scalar model can fail under cycles.",
  "spec": {
    "tex": "p=1/(1+\\exp(-(s_i-s_j)))",
    "equation": "62.4",
    "inputs": [
      {
        "symbol": "delta",
        "label": "Latent score difference",
        "default": 0,
        "min": -5,
        "max": 5,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "Conditional binary preference",
        "formula": "1/(1+exp(-delta))",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Equal latent scores",
      "variables": {
        "delta": 0
      },
      "highlight": [
        "p"
      ],
      "note": "The binary model predicts parity under its score convention."
    },
    {
      "anchor": "mechanism",
      "label": "Positive score margin",
      "variables": {
        "delta": 2
      },
      "highlight": [
        "p"
      ],
      "note": "A score margin changes conditional preference under the scalar model."
    },
    {
      "anchor": "failure-modes",
      "label": "Model parity is conditional",
      "variables": {
        "delta": 0
      },
      "highlight": [
        "p"
      ],
      "note": "This scalar calculator cannot represent a three-candidate cycle or prove equal truth."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Preserve actual candidate IDs, display slots, prompt clusters, judge IDs, ties, and assignment probabilities. Do not relabel every winner as slot A before fitting position effects. Inspect the comparison graph for disconnected components and the design matrix/Jacobian for confounding. If candidate family is inseparable from a putative family-preference coefficient, report the identifiable prediction or contrast rather than a uniquely estimated causal bias.

[DERIVED] Fit the binary log loss or an explicitly selected tie model. If using half-valued outcomes, label the fit fractional quasi-likelihood and use uncertainty appropriate to its mean model. Regularization makes estimation stable under separation but introduces a declared penalty; it does not validate the scalar representation. Joint scores and positive judge sensitivities make the objective nonconvex, so initialization, multiple starts, convergence criteria and sensitivity checks matter.

[DERIVED] Evaluate held-out prompt predictions and subgroup residuals. Detect cycles and task-specific reversals before interpreting a single ranking. A candidate score is conditional on the comparison pool and population. Changing who votes or which tasks appear changes the target, even when the software and candidates stay fixed.

[DERIVED] Construct intervals for decision-relevant pairwise probabilities or differences, not only rank numbers. Prompt-cluster resampling preserves repeated judgments of one prompt; crossed rater effects may require additional treatment. A narrow model-based interval under a misspecified mean model can be centered on the wrong projection. Bias adjustment and dependence-aware uncertainty solve different problems.

```figure
{
  "id": "fig-62.7",
  "kind": "diagram",
  "title": "Comparison graph before latent interpretation",
  "caption": "The pipeline checks connectivity, separation and identifying variation before fitting. Held-out residuals and cluster-aware uncertainty determine whether the projected scalar target is useful for the stated decision.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.6",
  "alt": "The pipeline checks connectivity, separation and identifying variation before fitting. Held-out residuals and cluster-aware uncertainty determine whether the projected scalar target is useful for the stated decision.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Actual slots and judgments"
      },
      {
        "id": "n1",
        "kind": "branch",
        "label": "Connected and identified?"
      },
      {
        "id": "n2",
        "kind": "state",
        "label": "Incomparable or constrained target"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Declared tie/mean objective"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Fit and convergence audit"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Held-out and cycle diagnostics"
      },
      {
        "id": "n6",
        "kind": "metric",
        "label": "Conditional pairwise intervals"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2",
        "label": "no"
      },
      {
        "from": "n1",
        "to": "n3",
        "label": "yes"
      },
      {
        "from": "n3",
        "to": "n4"
      },
      {
        "from": "n4",
        "to": "n5"
      },
      {
        "from": "n5",
        "to": "n6"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 62.2 — Fit and audit a paired-comparison model.**

1. Freeze target population, tie handling, candidate/judge roster and display-order records; reject incompatible pooling.
2. Check comparison connectivity, separation and nuisance identifiability. Preserve disconnected components as incomparable if no justified bridge exists.
3. Select binary, fractional-mean or explicit-tie objective; fix location/scale conventions and any penalty before fitting.
4. Optimize with finite iteration/time limits, numerical safeguards and multiple starts where the objective is nonconvex. Record objective, gradient/convergence diagnostics and boundary estimates.
5. Predict held-out prompt outcomes and inspect subgroup calibration, cycles and influence. Compare simpler and nuisance-adjusted models on identical folds.
6. Estimate pairwise targets with prompt/assignment-aware uncertainty, keeping all uncertainty sources and selected-model assumptions explicit.
7. Apply the practical decision margin; publish pairwise matrix, residual limits and candidate/order sensitivity. Leave nonidentified quantities unresolved.

[DERIVED] A converged optimizer establishes a numerical stopping condition, not a correct preference ontology, global optimum for the joint model, or deployment superiority.

## Implementation

[DERIVED] Evaluate logistic loss with stable softplus/log-sigmoid operations rather than computing overflowing exponentials. Reparameterize positive sensitivities through log coordinates and enforce score location in an identified subspace. Store label and slot separately. For a zero-variance length covariate, remove or explicitly constrain the column instead of dividing by zero.

[DERIVED] For $n_j$ judgments, the plain score-difference gradient touches two candidate coordinates per record and can be evaluated in $O(n_j)$ arithmetic per pass. Extra judge covariates remain sparse. A dense $p\times p$ curvature matrix uses $O(p^2)$ storage and a direct solve can cost $O(p^3)$; prompt-cluster score accumulation adds its own pass. These are analysis costs, distinct from generation and human labeling. Hardware latency, memory traffic, energy and money require an actual implementation/run.

[DERIVED] Elo display units are arbitrary affine conventions. A rating difference is not a percentage-point difference, and equal numerical ratings across disconnected studies need not share a scale. Frozen historical ratings require new bridge comparisons before a current model is placed on that scale.

## Experimental design

### Reported experiments

[PAPER-REPORTED] OSCAR v2 reanalyzes 65,208 released judgments across four datasets, uses prompt-disjoint evaluation, and compares nuisance-adjusted models on identical folds. Position adjustment reduces held-out log loss by 14–23% relative to the judge-sensitive baseline. The fixed-score attenuation summary excludes three judges with zero/undefined ratios while retaining them in fitting [R62.2, §§3–7, Table 1, Appendices D–F].

[DERIVED] These results support a particular adjustment and its conditional predictive target. They do not show that every low-sensitivity judge is inaccurate or that removing a family coefficient recovers an intrinsic quality. Candidate/judge populations are fixed in the paper's cluster-inference conditions, and additional nuisance parameters still need identifying variation.

## Observations

**What the paper claims.** [PAPER-REPORTED] Omitted position effects can attenuate fitted judge sensitivity even with balanced display orders [R62.2, §4].

**What the evidence shows.** [DERIVED] Mean-model adjustment and clustered uncertainty address distinct errors.

**What we infer.** [DERIVED] Preserve actual slots and test identification before interpreting latent scores or judge weights.

**What remains unknown.** [NOT-DISCLOSED] The adjusted reference target need not equal preference for a new user/task distribution.

## Failure modes

> **Failure mode — A scalar ranking hides a cycle.** [DERIVED] *Symptom:* each candidate loses to another despite a confident total order. *Cause:* a one-dimensional preference model projects non-transitive task/population behavior onto score differences. *Detection:* inspect the pairwise matrix, subgroup outcomes and held-out residuals. *Mitigation:* report the cycle or conditional choices and restrict the scalar interpretation.

[MATHEMATICALLY-DERIVED] Under Eq. 62.4, odds ratios satisfy $\exp(s_A-s_B)\exp(s_B-s_C)\exp(s_C-s_A)=1$. A population with all three cyclic preference probabilities equal to 0.75 has odds product 27, so it cannot be represented exactly by those scores. The fit is a projection rather than a recovered universal ordering.

[DERIVED] An online rating can also depend on which matches were processed first, on step size and on the initialization. A large reported rating gap can reflect an unstable comparison component or regularization convention. Report those conditions rather than interpreting the numerical scale as absolute competence.

```figure
{
  "id": "fig-62.8",
  "kind": "compare",
  "title": "Tie-adjusted mean and explicit tie distribution",
  "caption": "A half-win quasi-likelihood and a three-outcome model target different objects. Dropping ties creates a third, decisive-only population.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.5",
  "alt": "A half-win quasi-likelihood and a three-outcome model target different objects. Dropping ties creates a third, decisive-only population.",
  "spec": {
    "axis": "Statistical object represented by tie handling",
    "columns": [
      {
        "id": "a",
        "label": "Half-win mean"
      },
      {
        "id": "b",
        "label": "Explicit tie category"
      }
    ],
    "rows": [
      {
        "dimension": "Outcome",
        "values": {
          "a": "0, one half or 1",
          "b": "A, B or tie"
        }
      },
      {
        "dimension": "Objective",
        "values": {
          "a": "Fractional log loss for conditional mean",
          "b": "Three-outcome likelihood"
        }
      },
      {
        "dimension": "Supported target",
        "values": {
          "a": "Tie-adjusted preference",
          "b": "Win/loss/tie probabilities"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer a simple Bradley–Terry model when it predicts held-out comparisons adequately and the decision tolerates its scalar projection. Prefer a tie model when tie frequency/meaning is consequential; prefer position-aware adjustment when randomized order leaves systematic slot effects. Reverse a complex-model preference if added terms are nonidentified, unstable or fail to improve relevant held-out behavior.

[DERIVED] [Judge failure modes](62-4-judge-failure-modes.md) derives the nonlinear effect of swap averaging. [Interpreting scores](62-6-interpreting-scores.md) connects pairwise targets to truth, utility and endpoint attribution. [Chapter 61](../ch61-capability-portfolios-and-benchmark-validity/61-6-reporting.md) supplies general reporting and multiplicity obligations.

## Extensions

[DERIVED] Active comparison allocation can reduce labeling expense by targeting uncertain decision boundaries, but changes assignment probabilities and may neglect disconnected or rare populations. Preserve exploratory selection and independent confirmation. A method contributes useful evidence if it improves an identified target or reduces required expense at a matched decision margin, not merely if its ranking resembles an existing leaderboard.

[DERIVED] New bridge comparisons are consequential when a candidate set changes; independent user sampling is consequential when preference populations change. More optimization over the same disconnected graph cannot establish between-component ordering.

## Limitations

[DERIVED] Scalar models can miss interactions, cycles and heterogeneous preferences. Quasi-likelihood coefficients describe a mean projection, and zeroing nuisance covariates defines a model reference rather than a naturally occurring user. Penalties and gauge choices affect individual parameters even when predictions are equivalent.

[UNVERIFIED] No paired-comparison model was fitted by the book and no Elo or candidate ranking was measured. The equations are conditional constructions; OSCAR results remain source-reported under the inspected revision.

## Reproducibility

[DERIVED] Archive raw slots/outcomes, comparison graph, prompt/judge identities, assignment probabilities, tie policy, parameter constraints, penalty, optimization starts, convergence diagnostics, held-out folds, influence checks and uncertainty procedure. Save both predictions and parameter conventions so equivalence can be assessed at the claimed level.

[ASSUMED] [Experiment 62.2](verification.md#experiment-622--judge-validation-and-bias-controls) includes comparison-model controls. It is unexecuted and cannot certify any new candidate ordering.

## References

[R62.2] Liu et al., OSCAR, inspected v2 (2026-10-13), §§3–7 and Appendices B–F. v1 was a retrieval lead; current claims use v2. Full scope: [references](references.md).
