---
id: ms.section.34.2
entity_type: section
title: Policy gradients
short_title: Policy gradients
volume: 2
part: 6
chapter: 34
section: '34.2'
slug: 34-2-policy-gradients
parent: ms.chapter.34
prev_sibling: ms.section.34.1
next_sibling: ms.section.34.3
children: []
prerequisites:
- ms.chapter.2
- ms.chapter.30
- ms.chapter.31
- ms.chapter.32
downstream:
- ms.chapter.35
- ms.chapter.36
- ms.chapter.38
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - policy_optimization
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.verl
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

# 34.2 — Policy gradients

## Scope

[DERIVED] This section owns the score-function gradient, causal credit assignment, action-independent baselines, variance, sequence/token aggregation and supported importance correction. It does not rename a clipped surrogate as an unbiased policy gradient. The artifact is an estimator declaration that identifies the target trajectory distribution, sampled distribution, advantage construction and reduction measure before an optimizer consumes the batch.

## Why this exists

[DERIVED] A scalar reward can be copied onto every response token, divided by length, centered within a group and multiplied by a probability ratio. These operations look similar in code but answer different statistical questions. Some reduce variance without changing expectation under explicit conditions. Others change prompt weighting, replace the objective or introduce bias. A training curve alone cannot distinguish these cases, especially when the rollout and scoring engines do not compute the same processed distribution.

[DERIVED] The review question is precise: expectation under which distribution equals the gradient of which objective? The answer must account for variable length, stopping, tool observations and policy-dependent prefix occupancy. Calling a batch “on-policy” is insufficient after its first update. Calling a weight an “importance ratio” is insufficient if its numerator and denominator represent different events, or if a geometric length normalization has replaced the joint probability ratio.

## Intuition

[MATHEMATICALLY-DERIVED] The score function measures how a small parameter change alters the probability of a sampled action. Multiplying it by a favorable outcome increases probability in expectation. Rewards that happened before the action can be subtracted from the action's multiplier because, conditional on the past, their product with the score has expectation zero. Future rewards cannot be discarded in that way. This causal argument is the source of reward-to-go, not a statement that every token independently caused the final outcome.

[MATHEMATICALLY-DERIVED] A baseline can be inaccurate and still leave the expected gradient unchanged if it is independent of the sampled action given the state and is detached during the actor update. A good baseline reduces dispersion of gradient contributions. A baseline chosen after observing the same action or reward can violate that cancellation. The relevant property is conditional dependence, not whether the code calls the tensor a value estimate.

## Formulation

[MATHEMATICALLY-DERIVED] Differentiate the finite supported trajectory sum in Eq. 34.1, then remove past rewards using conditional score cancellation:

$$
\nabla_\theta J=\mathbb E_{p_\theta}\!\left[\sum_{t=1}^{H}\gamma^{t-1}G_t\,g_t\right],\qquad g_t=\nabla_\theta\log\pi_\theta(a_t\mid s_t).
$$
*(Eq. 34.5)*

where $J$ and $G_t$ are Eq.34.2. The outer $\gamma^{t-1}$ is required for that discounted start-state objective; it disappears when $\gamma=1$ or is absorbed into an explicitly defined discounted occupancy measure.

[MATHEMATICALLY-DERIVED] For any detached state-only $b(s)$, conditional normalization gives the baseline identity. Minimizing the conditional trace of the covariance of $(G-b)g$ gives a score-norm-weighted optimal scalar baseline:

$$
\mathbb E[b(s_t)g_t\mid s_t]=b(s_t)\nabla_\theta\sum_a\pi_\theta(a\mid s_t)=0,\qquad b^*(s)=\frac{\mathbb E[G\|g\|_2^2\mid s]}{\mathbb E[\|g\|_2^2\mid s]}.
$$
*(Eq. 34.6)*

where the denominator is positive; if it is zero the score is identically zero and the choice is immaterial. $v(s)=\mathbb E[G\mid s]$ equals this optimum only under additional score-norm conditions.

```figure
{
  "id": "fig-34.7",
  "kind": "calculator",
  "title": "A terminal reward needs suffix correction",
  "caption": "Two binary actions; reward is one only when both actions equal one. The first behavior probability must have interior support; it cancels analytically. Values are chosen counterexamples, not measurements.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.7",
  "alt": "Adjust the declared illustrative inputs; exact first-logit gradient=p*(1-p)*q, prefix-weighted behavior reward=p*(1-p)*qb, signed estimator error=p*(1-p)*(qb-q). Two binary actions; reward is one only when both actions equal one. The first behavior probability must have interior support; it cancels analytically. Values are chosen counterexamples, not measurements.",
  "spec": {
    "tex": "g_{\\rm true}=p(1-p)q,\\quad g_{\\rm prefix}=p(1-p)q_b",
    "equation": "34.7",
    "inputs": [
      {
        "symbol": "p",
        "label": "target first-action probability",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "raw",
        "step": 0.01
      },
      {
        "symbol": "q",
        "label": "target second-action success probability",
        "default": 0.8,
        "min": 0,
        "max": 1,
        "format": "raw",
        "step": 0.01
      },
      {
        "symbol": "qb",
        "label": "behavior second-action success probability",
        "default": 0.2,
        "min": 0,
        "max": 1,
        "format": "raw",
        "step": 0.01
      }
    ],
    "outputs": [
      {
        "symbol": "truth",
        "label": "exact first-logit gradient",
        "formula": "p*(1-p)*q",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "prefix",
        "label": "prefix-weighted behavior reward",
        "formula": "p*(1-p)*qb",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "err",
        "label": "signed estimator error",
        "formula": "p*(1-p)*(qb-q)",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Matched suffix distribution",
      "variables": {
        "q": 0.8,
        "qb": 0.8
      }
    },
    {
      "anchor": "mechanism",
      "label": "Behavior suffix differs",
      "variables": {
        "q": 0.8,
        "qb": 0.2
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Large omitted correction",
      "variables": {
        "q": 0.9,
        "qb": 0.1
      }
    }
  ]
}
```

## Mechanism

[MATHEMATICALLY-DERIVED] Let behavior $mu$ and target $pi$ have the same prompt/environment/ending process and target support covered by behavior. Full trajectory ratios change measure for any integrable trajectory functional $F$. Prefix ratios change measure only for prefix-measurable functionals $f_t$:

$$
\rho_{1:H}=\prod_{k=1}^{H}\frac{\pi(a_k\mid s_k)}{\mu(a_k\mid s_k)},\quad \mathbb E_\mu[\rho_{1:H}F]=\mathbb E_\pi[F],\qquad \mathbb E_\mu[\rho_{1:t}f_t]=\mathbb E_\pi[f_t].
$$
*(Eq. 34.7)*

where $f_t$ depends only on the prompt and events through action $t$, including a true current-policy conditional advantage if available. A behavior-sampled terminal reward generally depends on the suffix and is not such an $f_t$.

```figure
id: fig-34.8
kind: diagram
title: The suffix dependence test
caption: The two right-hand objects have different probability contracts. A terminal reward does not become a target-policy
  advantage merely by being copied to earlier tokens.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.7
alt: The information path is Behavior episode, then Multiplier depends on suffix?, then Conditional target advantage, then
  Observed terminal reward. The two right-hand objects have different probability contracts. A terminal reward does not become
  a target-policy advantage merely by being copied to earlier tokens.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: dataset
    label: Behavior episode
    sub: sampled complete outcome
  - id: n1
    kind: branch
    label: Multiplier depends on suffix?
    sub: test measurability
  - id: n2
    kind: objective
    label: Conditional target advantage
    sub: prefix correction can apply
  - id: n3
    kind: boundary
    label: Observed terminal reward
    sub: full correction or valid conditional estimate
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n1
    to: n3
```

[MATHEMATICALLY-DERIVED] The calculator exhibits the gap. With target first-action probability $p$, conditional success probability $q$, and reward $a_1a_2$, the first-logit derivative is $p(1-p)q$. Prefix correction of the first action while keeping the second behavior action yields $p(1-p)q_b$. At the declared settings these are 0.20 and 0.05. Replacing the sampled terminal outcome by the actual target conditional expectation $a_1q$ restores the prefix identity. That replacement is a substantive estimator assumption, not a notation change.

[MATHEMATICALLY-DERIVED] Prefix weights can have lower variance because, for fixed valid prefixes and a supported continuation, their conditional expectation relation is $\mathbb E_\mu[\rho_{1:H}\mid\mathcal F_t]=\rho_{1:t}$. Consequently $\operatorname{Var}(\rho_{1:H})\geq\operatorname{Var}(\rho_{1:t})$. For a prefix-measurable multiplier the same conditional-expectation argument applies to its weighted contribution. It does not transfer unchanged to an arbitrary terminal-reward multiplier. Strict reduction additionally requires nonzero conditional suffix variation on a set that contributes to the quantity being estimated.

$$
\log\rho_{1:t}=\sum_{k=1}^t\Delta_k,\qquad \operatorname{Var}(\log\rho_{1:t})=\sum_k\operatorname{Var}(\Delta_k)+2\sum_{j<k}\operatorname{Cov}(\Delta_j,\Delta_k).
$$
*(Eq. 34.8)*

where $\Delta_k=\log\pi(a_k\mid s_k)-\log\mu(a_k\mid s_k)$. Square-root growth requires covariance control; independence cannot be assumed for autoregressive trajectories.

```figure
id: fig-34.9
kind: compare
title: Estimator and surrogate boundaries
caption: An estimator identity does not automatically describe the implemented optimizer.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.7
alt: 'Comparison on Expected quantity. Needed condition: mc=current supported rollout law, prefix=prefix-measurable current-policy
  multiplier, clip=explicit approximation contract. Advantage: mc=return minus action-independent baseline, prefix=target
  conditional quantity, clip=frozen estimated advantage. Guarantee: mc=gradient under declared integrability, prefix=change-of-measure
  identity only, clip=no general unbiasedness'
spec:
  axis: Expected quantity
  columns:
  - id: mc
    label: On-policy reward-to-go
  - id: prefix
    label: Prefix correction
  - id: clip
    label: Clipped reused batch
  rows:
  - dimension: Needed condition
    values:
      mc: current supported rollout law
      prefix: prefix-measurable current-policy multiplier
      clip: explicit approximation contract
  - dimension: Advantage
    values:
      mc: return minus action-independent baseline
      prefix: target conditional quantity
      clip: frozen estimated advantage
  - dimension: Guarantee
    values:
      mc: gradient under declared integrability
      prefix: change-of-measure identity only
      clip: no general unbiasedness
```

[MATHEMATICALLY-DERIVED] The natural episodic estimator averages a sum of action contributions over independently sampled episodes. Averaging all valid tokens instead divides by a random total length and changes the finite-sample weighting; its large-batch limit is a length-normalized occupancy quantity. Averaging each trajectory's contributions by its own length gives equal episode mass but generally differs from the gradient of expected reward. In particular, the gradient of $\mathbb E[R/H]$ uses $(R/H)\sum_t g_t$ for the full trajectory; dividing each reward-to-go by $H$ while removing past rewards is not automatically equivalent because $H$ depends on future actions. The reduction must be stated as part of the surrogate.

## Algorithm

### Algorithm 34.2 — supported episodic score estimation

[DERIVED] Algorithm 34.2 builds a diagnostic score estimator from sealed episodes and a frozen baseline. Input includes the target/behavior distributions, return clock and chosen estimator mode. State contains per-episode numerator vectors, log weights and rejection reasons. Output contains a gradient estimate and support diagnostics, not an optimizer update.

$$
\begin{aligned}
&1.\quad \widehat g\leftarrow0;\ n\leftarrow\text{number of admitted episodes};\ \text{require }n>0.\\
&2.\quad \textbf{for each episode }i:\ \text{verify process/version identities and boundary targets.}\\
&3.\qquad G_{it}\leftarrow\text{declared reward-to-go};\ b_{it}\leftarrow\operatorname{stopgrad}(b(s_{it})).\\
&4.\qquad u_{it}\leftarrow\gamma^{t-1}(G_{it}-b_{it})g_{it};\ \text{on-policy mode: }u_i\leftarrow\sum_tu_{it}.\\
&5.\qquad \text{full-IS mode: }w_i\leftarrow\exp\!\left(\sum_t(\ell_{\pi,it}-\ell_{\mu,it})\right);\ u_i\leftarrow w_i\sum_tu_{it}.\\
&6.\qquad \text{prefix mode: require certified prefix multiplier }f_{it};\ u_i\leftarrow\sum_t\rho_{i,1:t}f_{it}.\\
&7.\qquad \widehat g\leftarrow\widehat g+u_i/n;\ \text{record weight range and all failures.}\\
&8.\quad \text{return }\widehat g\text{ and estimator contract; do not silently clip or self-normalize weights.}
\end{aligned}
$$

[DERIVED] In step 5, $u_{it}$ is evaluated at the target policy with behavior outcomes; the baseline remains state-only. Invariants are common event definitions, detached nuisance estimates and inclusion of all assistant actions. The finite batch and finite episode caps guarantee stopping. Unsupported actions, unresolved censored outcomes and nonfinite weights invalidate the requested identity. Weight clipping or self-normalization can be useful alternatives, but they must be returned under a different approximation label. Computation is linear in sampled action count after model scoring; full correction increases estimator variance, not necessarily arithmetic complexity.

```figure
id: fig-34.10
kind: matrix
title: Prefix versus terminal dependence
caption: Rows are a first-action conditional quantity and a terminal outcome; columns are first action and suffix. Filled
  cells mark possible dependence.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-34.7
alt: Each filled cell denotes an admitted relationship. Rows are a first-action conditional quantity and a terminal outcome;
  columns are first action and suffix. Filled cells mark possible dependence.
spec:
  rows: 2
  cols: 2
  pattern: explicit
  cells:
  - - 1
    - 0
  - - 1
    - 1
  rowLabel: conditional quantity / terminal outcome
  colLabel: first action / suffix
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

## Implementation

[DERIVED] Implementation route: **verl** (reference-stack §4 #37, **RL post-training**; §4.1 **Post-training / RL**), pinned at v0.9.1. The role-specific mechanism and its evidence boundary are stated below.

[DERIVED] Compute ratios in log space and expose overflow rather than concealing it in an unnamed clamp. Store actual behavior scores once; recomputing “old” scores under another numerical engine creates a third policy in the contract. Baseline fitting should use independent data, cross-fitting or a declared reuse approximation when action independence is questionable. Detached advantages prevent actor differentiation through reward/value targets, but detachment alone does not remove statistical dependence on the sampled action.

[DERIVED] A distributed reducer must preserve the chosen episode denominator. Equal averaging of per-rank means is wrong when ranks contain unequal admitted episode counts. Reduce the summed numerator and global denominator, while accounting for whether gradient collectives sum or average. Padding and microbatch partition must leave the result invariant. Norm-based diagnostics should be computed after the same loss scaling that the optimizer uses.

```figure
{
  "id": "fig-34.11",
  "kind": "chart",
  "title": "Two reduction rules assign different episode mass",
  "caption": "Eq.34.5 analytical episodes have16 and128 actions. A global token mean assigns shares1/9 and8/9; an episode mean assigns1/2 each. These are aggregation weights, not measured gradient norms.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.5",
  "alt": "Grouped bars compare token-mean episode mass0.111/0.889 against episode-mean mass0.5/0.5 for short16-action and long128-action trajectories.",
  "spec": {
    "type": "bar",
    "categories": [
      "16-action episode",
      "128-action episode"
    ],
    "x": {
      "label": "declared trajectory"
    },
    "y": {
      "label": "aggregation mass",
      "domain": [
        0,
        1
      ],
      "format": "raw"
    },
    "series": [
      {
        "id": "token",
        "label": "Global token mean",
        "values": [
          0.1111111111111111,
          0.8888888888888888
        ],
        "emphasis": true
      },
      {
        "id": "episode",
        "label": "Episode mean",
        "values": [
          0.5,
          0.5
        ]
      }
    ]
  },
  "anchor": "implementation"
}
```

## Experimental design

[PAPER-REPORTED] CTPO evaluates cumulative-token surrogates on mathematical tool use. The source's prefix identity and its implemented clipped, group-normalized terminal-outcome surrogate must be assessed separately. [R34.3, §3, Appendix A](references.md#r34-3)

| Protocol | Disclosed setting |
|---|---|
| Models / workload | Qwen3-4B/14B; roughly 40k DeepScaleR problems; Python tools, five turns, 8k cap |
| Collection / update | 512 prompts × 8 responses; learning rate $10^{-6}$; verl |
| Hardware | Single node, eight H100 or H200; exact model mapping NOT-DISCLOSED |
| Evaluation / uncertainty | AIME25/26, HMMT25, BRUMO25, Avg@32; precision, seeds and optimizer details NOT-DISCLOSED |

[ASSUMED] Proposed estimator audit: enumerate the two-action calculator exactly under both policies, compare full IS, prefix conditional-value IS and prefix terminal-reward weighting, then vary suffix behavior independently. Hold the first-action distribution fixed. Measure analytic gradient discrepancy and second moments; no neural model or GPU is required. A second ablation changes episode lengths while preserving outcomes to isolate the reduction measure. Expected equality is confined to the declared identities, not every surrogate.

## Observations

**What the paper claims.** [PAPER-REPORTED] CTPO motivates cumulative prefix correction as a less variable alternative to full-sequence weighting and uses position-adaptive clipping in its practical method. [R34.3, §3](references.md#r34-3)

**What the evidence shows.** [PAPER-REPORTED] Its 4B average is 51.4 versus GSPO 47.7; the 14B BRUMO result is 63.0 versus GSPO 63.3. These results support task-specific utility, not universal dominance or unbiasedness of the implemented surrogate. [R34.3, Tables 2–3](references.md#r34-3)

**What we infer.** [MATHEMATICALLY-DERIVED] The finite counterexample shows why an outcome-level behavior reward cannot inherit a prefix-measurability theorem. Empirical success can coexist with a biased surrogate. The correct scientific account states both without treating one as a refutation of the other.

**What remains unknown.** [NOT-DISCLOSED] Seed sensitivity and the missing execution details prevent a complete variance/cost comparison. The manuscript has not run CTPO or measured its gradient distribution on neural workloads.

## Failure modes

[DERIVED] An action-dependent baseline changes expectation. An unsupported target action defeats IS. A sequence geometric mean is not a trajectory likelihood ratio. Clipping changes the estimator; self-normalization is generally biased at finite sample size. A long response can dominate a token mean even with moderate reward. Stale batch reuse silently converts a current-policy estimator into an off-policy surrogate. Group centering with the sample's own reward is not an independent baseline; Chapter 35 derives that distinction.

## Siblings

[DERIVED] Value-based bootstrapping trades estimation variance against critic error; Monte Carlo returns avoid that bootstrap but retain outcome variance. Offline preference objectives use a different data likelihood and do not require this rollout estimator. Group-relative methods avoid a learned critic while introducing their own coupling and normalization; their canonical treatment remains Chapter 35.

## Extensions

[DERIVED] Cross-fitted conditional advantages can make prefix correction operational when their target-policy meaning is justified. Control variates beyond scalar baselines can reduce variance but require their own zero-mean proof. Per-decision correction of individual rewards can avoid a full terminal ratio only when the reward's measurability and the corresponding prefix weight are matched. None repairs missing support or changed tool dynamics.

## Limitations

[DERIVED] The exact identities assume differentiation under the expectation, finite integrable contributions, supported actions and a fixed environment process. Learned advantages and numerical probability approximations weaken those assumptions. Variance of a ratio alone is not variance of the final gradient vector. Finite-state counterexamples diagnose an invalid guarantee without predicting which large-model surrogate will perform best.

## Reproducibility

[DERIVED] Export action scores under both measures, return construction, baseline inputs, detach points, reduction mode and the support policy. Include exact finite-state sums, rank-partition invariance and behavior-equals-target checks. Record unclipped and effective weights separately. Publish rejected trajectory counts and the reason a prefix multiplier is considered measurable.

```figure
{
  "id": "fig-34.12",
  "kind": "chart",
  "title": "Small local shifts compound",
  "caption": "Chosen constant per-action ratios illustrate products. Real autoregressive log-ratio increments need not be independent. Points represent legal integer configurations; no fractional-decision/reuse interpolation is asserted.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-34.8",
  "alt": "Analytical curves: ratio 1.01 each action equals 1.01^x, ratio 0.99 each action equals 0.99^x. Chosen constant per-action ratios illustrate products. Real autoregressive log-ratio increments need not be independent.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "prefix length",
      "scale": "linear",
      "domain": [
        1,
        64
      ]
    },
    "y": {
      "label": "cumulative ratio",
      "scale": "log2"
    },
    "series": [
      {
        "id": "s0",
        "label": "ratio 1.01 each action",
        "formula": "1.01^x",
        "sample": {
          "to": 64,
          "count": 64,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "ratio 0.99 each action",
        "formula": "0.99^x",
        "sample": {
          "to": 64,
          "count": 64,
          "from": 1
        }
      }
    ],
    "annotations": [
      {
        "x": 64,
        "y": 1.8904618694795547,
        "label": "Sixty-four multiplicative factors"
      }
    ]
  }
}
```

## References

[R34.3](references.md#r34-3) provides the inspected contemporary method and experiments. [R34.1](references.md#r34-1) records version-specific correction code. The estimator identities, counterexample and analytical figures are independently derived here.
