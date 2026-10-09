---
id: "ms.section.35.2"
entity_type: "section"
title: "Group-relative optimization"
short_title: "Group-relative optimization"
volume: 2
part: 6
chapter: 35
section: 35.2
slug: "35-2-group-relative-optimization"
parent: "ms.chapter.35"
prev_sibling: "ms.section.35.1"
next_sibling: "ms.section.35.3"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34"]
downstream: ["ms.chapter.36", "ms.chapter.38", "ms.chapter.39", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["reinforcement_learning", "verification", "policy_optimization"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2300
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 35.2 — Group-relative optimization

## Scope

[DERIVED] Construct within-prompt group-relative estimators and distinguish their baselines, standard deviations, clipping rules and reference penalties. The section owns GRPO construction and its statistical contract, including leave-one-out alternatives. It does not present these canonical estimators as inventions of 2026. Current implementation details are grounded in the eligible TRL v1.13.0 release, while later sections separate algorithmic refinements and empirical claims. Success means that a reviewer can reconstruct the gradient surrogate from the stored group, token mask and loss-reduction configuration.

## Why this exists

[DERIVED] A single terminal reward per response gives no direct estimate of how much better that response is than other responses to the same task. A group provides an internal comparison without fitting a critic. The resulting convenience introduces dependence: each response contributes to the mean and scale against which it is judged. Treating that baseline as action independent loses a finite-group factor. Treating standardized advantages as merely a harmless learning-rate change loses prompt-dependent weighting.

[DERIVED] The dominant constraint is reproducible estimator identity. Two runs both called GRPO may differ in sample versus population standard deviation, zero-variance handling, response-length reduction, KL placement and generation distribution. These differences can be larger than a named algorithm change. A complete specification therefore records every reduction axis and every detached statistic.

## Intuition

[MATHEMATICALLY-DERIVED] Centering rewards removes an offset, but a response partly subtracts its own reward. Leave-one-out centering subtracts only other responses and therefore has a different expectation under independent sampling. Dividing by a random group standard deviation further makes the weight assigned to one response depend on every reward in the group. This is an estimator choice, not a theorem that the result remains unbiased for expected reward.

[DERIVED] A binary group containing one success and seven failures illustrates the distinction. Positive and negative samples receive different standardized magnitudes. An all-success group has no relative contrast even though every response is correct; an all-failure group has the same absence of contrast for a different reason. Both supply information about task difficulty and both must remain in collection statistics.


```figure
{
  "id": "fig-35.7",
  "kind": "diagram",
  "title": "A response participates twice",
  "caption": "Each reward contributes to its own centered numerator and to the shared group statistic; detachment preserves the chosen surrogate.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.5",
  "alt": "Each reward contributes to its own centered numerator and to the shared group statistic; detachment preserves the chosen surrogate. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "tensor",
        "label": "G rewards"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Group mean"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Group scale"
      },
      {
        "id": "n3",
        "kind": "tensor",
        "label": "Detached advantages"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Token surrogate"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n0",
        "to": "n2"
      },
      {
        "from": "n1",
        "to": "n3",
        "label": "center"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "scale"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "broadcast"
      }
    ]
  }
}
```


## Formulation

[MATHEMATICALLY-DERIVED] Fix prompt $x$ and draw $G\ge2$ independent responses $Y_i$ from the same policy. Let $R_i$ be bounded terminal rewards, $s_i=\nabla_\theta\log\pi_\theta(Y_i\mid x)$ and $g_x=\mathbb E[R_i s_i]$. Under differentiable common support, $\mathbb E[s_i]=0$. Define

$$
\bar R=\frac1G\sum_iR_i,\quad
s_{\rm pop}^2=\frac1G\sum_i(R_i-\bar R)^2,\quad
s_{\rm sample}^2=\frac1{G-1}\sum_i(R_i-\bar R)^2.
$$
*(Eq. 35.4)*

where rewards and both standard deviations use the same dimensionless reward unit; $G=1$ makes the sample standard deviation undefined.

[MATHEMATICALLY-DERIVED] Three distinct advantages are

$$
A_i^{\rm own}=R_i-\bar R,\quad
A_i^{\rm loo}=R_i-\frac1{G-1}\sum_{j\ne i}R_j,\quad
A_i^{\rm std}=\frac{R_i-\bar R}{s_*+\epsilon_s}.
$$
*(Eq. 35.5)*

where $s_*$ explicitly selects sample or population standard deviation and $\epsilon_s>0$ is a declared reward-unit stabilizer. These statistics are detached before policy differentiation.


```figure
{
  "id": "fig-35.8",
  "kind": "calculator",
  "title": "Own-mean finite-group factor",
  "caption": "Eq.35.6 compares own-mean and leave-one-out expected factors for integer group sizes under iid sampling.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.6",
  "alt": "Eq.35.6 compares own-mean and leave-one-out expected factors for integer group sizes under iid sampling. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "35.6",
    "tex": "E[\\hat g_{\\rm own}]=(1-1/G)g",
    "inputs": [
      {
        "symbol": "G",
        "label": "Group size",
        "default": 8,
        "min": 2,
        "max": 64,
        "format": "integer",
        "options": [
          2,
          4,
          8,
          16,
          32,
          64
        ]
      }
    ],
    "outputs": [
      {
        "symbol": "own",
        "label": "Own-mean factor",
        "formula": "1-1/G",
        "format": "ratio",
        "emphasis": true
      },
      {
        "symbol": "loo",
        "label": "Leave-one-out factor",
        "formula": "1",
        "format": "ratio",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Small group",
      "variables": {
        "G": 2
      }
    },
    {
      "anchor": "mechanism",
      "label": "Eight responses",
      "variables": {
        "G": 8
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Larger group",
      "variables": {
        "G": 32
      }
    }
  ]
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Expand the expectation of the own-sample centered contribution:

$$
\begin{aligned}
\mathbb E[(R_i-\bar R)s_i]
&=\mathbb E[R_is_i]-\frac1G\mathbb E[R_is_i]
-\frac1G\sum_{j\ne i}\mathbb E[R_j]\mathbb E[s_i]\\
&=\left(1-\frac1G\right)g_x,\qquad
\mathbb E[A_i^{\rm loo}s_i]=g_x .
\end{aligned}
$$
*(Eq. 35.6)*

where independence is conditional on the same prompt and policy, and the reward procedure must not couple different candidates.

[DERIVED] The factor tends to one with larger groups and is one half at $G=2$. Multiplying centered advantages by $G/(G-1)$ recovers the leave-one-out numerator algebraically. This conclusion does not survive arbitrary correlated generation, group-dependent judging or differentiating through sampled statistics. With fixed $G$ across prompts, the unstandardized own-mean factor rescales the expected reward gradient. Variable group sizes can reweight prompts.

[MATHEMATICALLY-DERIVED] Because $s_{\rm sample}=s_{\rm pop}\sqrt{G/(G-1)}$, sample and population standardized advantages differ by a constant only when $\epsilon_s=0$, group size is fixed and the group variance is positive. With positive epsilon the ratio is $(s_{\rm pop}+\epsilon_s)/(s_{\rm pop}\sqrt{G/(G-1)}+\epsilon_s)$ and depends on observed variance. Neither expectation can generally move the random denominator outside the expectation.

[MATHEMATICALLY-DERIVED] In a mixed binary group with empirical success rate $\hat p=m/G$, population standardization without epsilon gives

$$
A_+=\sqrt{\frac{1-\hat p}{\hat p}},\qquad
A_-=-\sqrt{\frac{\hat p}{1-\hat p}},\qquad 0<m<G.
$$
*(Eq. 35.7)*

where boundary groups are separately assigned zero centered advantage rather than evaluated through these singular expressions.

[DERIVED] The group is conditioned on its observed count, so these magnitudes are not a population-level unbiasedness proof. Changing $G$ changes the distribution of counts and therefore the effective task weighting. A verifier with stochastic false acceptance changes that count distribution as well. The calculator shows only the exact conditional algebra for the chosen count.


```figure
{
  "id": "fig-35.9",
  "kind": "chart",
  "title": "One success balances seven negative advantages",
  "caption": "Eq.35.7 mixed group with population SD,epsilon0:one positive advantage√7 and seven negative advantages−1/√7 sum to zero. Advantage mass is not true gradient norm or correctness evidence.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.7",
  "alt": "Eight candidate bars contain one positive2.646 and seven negatives−0.378. Their unweighted sum is zero under the declared population-standardized binary group.",
  "spec": {
    "type": "bar",
    "categories": [
      "Success",
      "Failure2",
      "Failure3",
      "Failure4",
      "Failure5",
      "Failure6",
      "Failure7",
      "Failure8"
    ],
    "x": {
      "label": "candidate in the mixed group"
    },
    "y": {
      "label": "standardized advantage",
      "domain": [
        -0.5,
        3
      ]
    },
    "series": [
      {
        "id": "adv",
        "label": "Population SD; epsilon0",
        "values": [
          2.6457513110645907,
          -0.3779644730092272,
          -0.3779644730092272,
          -0.3779644730092272,
          -0.3779644730092272,
          -0.3779644730092272,
          -0.3779644730092272,
          -0.3779644730092272
        ],
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation"
}
```


[DERIVED] For token $t$ in response $i$, let $m_{it}\in\{0,1\}$ indicate a generated action, $L_i=\sum_tm_{it}>0$ and $\rho_{it}=\pi_\theta(y_{it}\mid h_{it})/\pi_{\rm old}(y_{it}\mid h_{it})$. A declared token surrogate is

$$
\ell_{it}=-\min\!\left(\rho_{it}A_i,
\operatorname{clip}(\rho_{it},1-\epsilon_{\rm lo},1+\epsilon_{\rm hi})A_i\right)
+\beta k_{it}.
$$
*(Eq. 35.8)*

where the old-policy probabilities and $A_i$ are detached; $k_{it}$ is a separately specified reference-KL estimator.

[DERIVED] Here $\pi$ denotes the actual declared target/behavior distribution, including any decoding processors; stored probabilities must match that distribution. If only raw-model probabilities are available after temperature, top-p or grammar processing, this ratio contract is not satisfied. This is a clipped optimization surrogate, not an unbiased full-trajectory off-policy estimator and not a hard KL constraint. Temperature, top-p and grammar processors determine the actual behavior distribution; raw model probabilities require an explicit compatibility argument. Sequence versus token reduction is treated in §35.4. A reference-free variant sets $\beta=0$ and need not load reference weights. It does not thereby remove old-policy probabilities needed for the ratio.

## Algorithm

**Algorithm 35.2 — Group statistics and guarded surrogate updates.** Inputs are finite candidate groups of declared size $G\ge2$, frozen behavior log probabilities, masks, $s_*$ choice, $\epsilon_s>0$, clipping bounds, reference contract and $K$ optimizer steps. State is policy parameters and an optimizer state initialized by a recorded seed. This explanatory procedure uses gradient descent; production optimizers must supply their own state transitions.

$$
\begin{aligned}
(1)\;&(\theta_0,\mathcal F)\leftarrow(\theta_{\rm old},\varnothing).\\
(2)\;&L_{bi}\leftarrow\sum_tm_{bit};\quad
\mathcal B_0\leftarrow\{b:\operatorname{CompleteGroup}(b,G),\ \min_iL_{bi}>0,\ \operatorname{Finite}(R_b)\}.\\
(3)\;&(\bar R_b,s_b)\leftarrow\operatorname{Stats}_{s_*}(R_{b,1:G});\quad
A_{bi}\leftarrow\operatorname{stopgrad}[(R_{bi}-\bar R_b)/(s_b+\epsilon_s)]\quad(b\in\mathcal B_0).\\
(4)\;&\mathcal B\leftarrow\{b\in\mathcal B_0:\operatorname{Finite}(s_b,A_b)\};\quad
\mathcal F\leftarrow\{b:b\notin\mathcal B\}\quad\text{with reason per group}.\\
(5)\;&\mathcal B=\varnothing\Longrightarrow\text{return ABSTAIN};\quad k\leftarrow0.\\
(6)\;&\rho_{bit}^{(k)}\leftarrow
\exp[\log\pi_{\theta_k}(y_{bit}\mid h_{bit})-\log\pi_{\rm old}(y_{bit}\mid h_{bit})].\\
(7)\;&\mathcal L_k\leftarrow
\frac1{|\mathcal B|G}\sum_{b\in\mathcal B}\sum_i
\frac{\sum_tm_{bit}\ell_{bit}^{(k)}}{L_{bi}}.\\
(8)\;&g_k\leftarrow\nabla_{\theta_k}\mathcal L_k;\quad
\theta_{k+1}\leftarrow
\begin{cases}\theta_k-\eta_kg_k,&\operatorname{Finite}(\mathcal L_k,g_k),\\
\theta_k,&\text{otherwise; record FAILED update}.
\end{cases}\\
(9)\;&k\leftarrow k+1;\quad\text{repeat lines 6--8 while }k<K.\\
(10)\;&\text{return }(\theta_K,\mathcal F,\text{all update diagnostics}).
\end{aligned}
$$

[DERIVED] Invariants are immutable group membership, unchanged behavior identities, detached statistics and no division by an empty response. Failed groups and failed updates remain counted in cost and coverage. Computing statistics is $O(BG)$; token ratios and reductions are $O(BGL)$, excluding model passes. Storage is $O(BGL)$ for tokens, masks and log probabilities. Reusing a rollout for $K$ updates increases forward/backward cost and policy staleness; clipping does not erase that change.

## Implementation

[OFFICIAL-DOCUMENTATION] In pinned TRL v1.13.0, reward grouping uses a within-group mean; helper nanstd applies Bessel correction, and group scaling divides by standard deviation plus $10^{-4}$. Trainer loss types separately select response-mean, fixed-length and global-token reductions. [R35.1, grpo_trainer.py lines2591–2637,3014–3037; utils.py789–820].

[DERIVED] Hugging Face TRL and verl occupy the reference stack's post-training layer; vLLM occupies inference/serving. The analytical contract does not infer kernel equivalence from those names. Group identities must survive distributed gather/scatter, and missing rewards must not reshape a group accidentally. If only one finite reward remains, sample standard deviation is undefined. A framework's NaN-to-zero policy is an implementation decision whose coverage and gradient consequences require explicit logging.


```figure
{
  "id": "fig-35.10",
  "kind": "matrix",
  "title": "Within-prompt coupling",
  "caption": "Rows and columns index eight responses in two independent groups of four. Filled blocks indicate shared reward statistics.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.5",
  "alt": "Rows and columns index eight responses in two independent groups of four. Filled blocks indicate shared reward statistics. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "rows": 8,
    "cols": 8,
    "pattern": "block-diagonal",
    "parameter": 4,
    "rowLabel": "affected response",
    "colLabel": "reward contributor",
    "legend": "Filled = same-prompt group statistic; cross-group cells are excluded."
  }
}
```


[DERIVED] Keep log-probability differences in a precision that avoids overflow and use finite guards around exponentiation. Allreduce the declared denominator when losses span ranks. Mean-of-local-means is not the global mean when valid-token counts differ. The reference computation can be omitted at $\beta=0$; allocating a frozen reference anyway adds memory and inference work without changing that objective.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] R35.1 is an inspected versioned implementation, not a benchmark experiment. Its evidence establishes code-path definitions, not comparative accuracy. Release publication is 2026-09-10; peeled commit is 3d9261f1fec9f9a8140099c78a65c7da73dce79c.

| Field | Pinned implementation audit |
|---|---|
| Models/data/hardware/seeds | Not applicable to a code-path reading |
| Inspected variables | Group scale; epsilon; completion masks; loss type; KL placement |
| Precision/runtime performance | NOT-DISCLOSED by this audit |
| Executed check | No GPU training; analytical checks only |
| Current comparison evidence | AsymGRPO and ARCUS protocols are reconstructed in §35.4 |

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The TRL release documents distinct configurable loss reductions and reward scaling. Its names do not imply that every configuration reproduces an originating historical paper.

**What the evidence shows.** [DERIVED] The inspected code fixes the sample-standard-deviation and epsilon conventions for this release. No independent training comparison follows from reading those operators.

**What we infer.** [MATHEMATICALLY-DERIVED] Equation 35.6 proves a finite-group factor under its iid assumptions. Equation 35.7 explains the mixed-group magnitude asymmetry. Neither result proves standardized GRPO is unbiased for expected reward.

**What remains unknown.** [UNVERIFIED] Framework behavior under an arbitrary distributed configuration, custom reward service or decoding processor remains unverified until that configuration is tested.


```figure
{
  "id": "fig-35.11",
  "kind": "compare",
  "title": "Baseline and scale are separate",
  "caption": "These estimators differ in both statistical expectation and dependence.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.6",
  "alt": "These estimators differ in both statistical expectation and dependence. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Own mean"
      },
      {
        "id": "n1",
        "label": "Leave one out"
      },
      {
        "id": "n2",
        "label": "Standardized"
      }
    ],
    "rows": [
      {
        "dimension": "Baseline",
        "values": {
          "n0": "Includes self",
          "n1": "Excludes self",
          "n2": "Includes self"
        }
      },
      {
        "dimension": "iid expectation",
        "values": {
          "n0": "(1−1/G) g",
          "n1": "g",
          "n2": "Generally coupled"
        }
      },
      {
        "dimension": "Reward scale",
        "values": {
          "n0": "Retained",
          "n1": "Retained",
          "n2": "Random denominator"
        }
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Group identity corruption.** *Symptom:* advantage statistics disagree between workers or apparently identical prompts receive incompatible group means. *Cause:* missing/reordered responses or cross-prompt reshaping. *Detection:* recompute statistics from immutable prompt and attempt IDs. *Mitigation:* gather by identity and reject incomplete groups under a declared policy.

[DERIVED] Other symptoms include exploding standardized values at tiny scales, silent all-zero gradients, reference penalties dominating a sparse reward and loss changes caused by unequal rank token counts. Log raw rewards, group counts, both standard deviations, epsilon-to-scale ratio and policy/KL terms separately. A single aggregate training reward hides all of them.


```figure
{
  "id": "fig-35.12",
  "kind": "chart",
  "title": "The group-size effect",
  "caption": "Eq.35.6 points are legal integer group sizes. Own-mean expected scaling approaches one; leave-one-out removes this iid mean-inclusion factor, not every source of bias.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.6",
  "alt": "Eq.35.6 approaches one with increasing integer group size; the line is the analytical extension between admissible sizes. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "group size",
      "domain": [
        2,
        64
      ]
    },
    "y": {
      "label": "expected gradient factor"
    },
    "series": [
      {
        "id": "n0",
        "label": "Own mean",
        "formula": "1-1/x",
        "sample": {
          "from": 2,
          "to": 64,
          "count": 63
        },
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "Leave one out",
        "formula": "1",
        "sample": {
          "from": 2,
          "to": 64,
          "count": 63
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 2,
        "y": 0.5,
        "label": "Own mean loses half at G2"
      },
      {
        "x": 8,
        "y": 0.875,
        "label": "Own-mean factor7/8"
      }
    ]
  }
}
```


## Siblings

[DERIVED] Leave-one-out baselines avoid own-sample centering bias under iid assumptions, at the cost of a different variance profile. A learned critic generalizes baselines across states but introduces fitting error and model state, owned by Chapter34. Unscaled group centering retains reward units; standardization changes scale by group. Reference-free and KL-regularized variants trade reference computation against a changed objective, not merely implementation speed.

## Extensions

### Improvements

[PAPER-REPORTED] AsymGRPO explicitly changes success/failure advantage magnitudes; ARCUS changes which prompts are sampled; OPEFO changes token weights using an entropy-flow diagnostic. Their source protocols and mathematical boundaries are treated separately in §35.4. None is represented here as a universal correction of all GRPO limitations. [R35.4–R35.6].

## Limitations

[DERIVED] The unbiasedness calculation assumes independent samples and an action-independent reward process conditional on each response. Correlated branching, common randomness, group-relative judges and adaptive rejection violate those premises. Standardization and clipping define useful surrogates without acquiring a general unbiasedness guarantee.

## Reproducibility

[DERIVED] Record $G$, grouping keys, missingness policy, sample/population scale, epsilon, detached quantities, action masks, reduction axes, clipping bounds, reference identity, behavior probabilities, update reuse and optimizer state. A label such as GRPO without those fields is insufficient to reproduce the estimator.

## References

[R35.1] TRL v1.13.0 pinned source. [R35.4–R35.6] ARCUS, AsymGRPO and OPEFO as current comparison sources; their historical citations are not admitted as new references.
