---
id: "ms.section.36.2"
entity_type: "section"
title: "Credit assignment"
short_title: "Credit assignment"
volume: 2
part: 6
chapter: 36
section: 36.2
slug: "36-2-credit-assignment"
parent: "ms.chapter.36"
prev_sibling: "ms.section.36.1"
next_sibling: "ms.section.36.3"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.29", "ms.chapter.30", "ms.chapter.34", "ms.chapter.35"]
downstream: ["ms.chapter.38", "ms.chapter.39"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["agent_rl", "distributed_rollout"], "feedback_setting": ["environment_return", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.verl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 36.2 — Credit assignment

## Scope

[DERIVED] Assign outcome information to agent decisions without confusing reward design, value estimation, token weighting and hierarchical role ownership. The baseline broadcasts a terminal return to every generated token. This section develops terminal/dense feedback, intermediate checks, delayed and censored outcomes, SAPO's shared causal value model, ActFocus's token intervention and PARL's frozen-role boundary. Success means an explicit estimator with an identified target, information boundary, normalization and failure behavior; a favorable benchmark alone does not establish correct causal credit.

## Why this exists

[DERIVED] A long episode can contain many harmless tokens and one consequential command. Uniform return broadcasting supplies an association but little localization. Dense reward can improve localization while rewarding a shortcut. A value model can propagate delayed feedback while bootstrapping a wrong terminal state. Token weighting can improve a task metric while optimizing a different surrogate. These are distinct interventions with distinct evidence requirements.

[DERIVED] The dominant constraint is which information was available at a decision boundary. A baseline that reads the selected action is not an action-independent state baseline. An intermediate checker that exposes hidden tests changes the environment. An aborted episode has an unknown future return unless the task explicitly defines the budget stop as terminal. The training interface must retain these distinctions before comparing estimators.

## Intuition

[MATHEMATICALLY-DERIVED] Return decomposition determines what is predicted; causal conditioning determines what a value head is allowed to know. A pre-action estimate can predict average future return, while a post-action estimate can additionally use the selected response. Neither is allowed to consume its future observation. A token weight changes the coefficient of an already constructed policy-gradient term; it does not by itself create a less biased advantage estimate.

## Formulation

| Symbol | Definition | Unit |
|---|---|---|
| $r_t,G_t$ | Turn reward and discounted return | Reward |
| $d_t$ | True task termination after turn $t$ | Boolean |
| $V_t,Q_t$ | Pre-action and post-action causal values | Reward |
| $\gamma,\lambda$ | Discount and trace factors in $[0,1]$ | Dimensionless |
| $R_s>0,\tau_v>0$ | Value-target scale and logit readout scale | Reward; dimensionless |
| $m_{t,j},w_{t,j}$ | Generated-token mask and detached token weight | Boolean; dimensionless |

$$
G_t=\sum_{k=t}^{T}\gamma^{k-t}r_k,\qquad
r'_t=r_t+\gamma\Phi(h_{t+1})-\Phi(h_t),\qquad
G'_1=G_1-\Phi(h_1)+\gamma^T\Phi(h_{T+1}).
$$
*(Eq. 36.7)*

[MATHEMATICALLY-DERIVED] The shaping identity follows by telescoping. A fixed initial potential and zero terminal potential preserve the episodic objective up to a task-dependent constant. Arbitrary progress bonuses, learned checker changes, variable terminal potentials and an incorrect discount do not inherit that result. Potential shaping is an analytical construction here, not a claim that a cited 2026 system used it.

$$
v_\theta(c)=\frac{z_{\theta,w^+}(c)-z_{\theta,w^-}(c)}{\tau_v},\quad
V_t=R_s v_\theta(c_t^s),\quad Q_t=R_s v_\theta(c_t^{sa}),\quad
\pi_\theta(a\mid c)=\frac{e^{z_{\theta,a}(c)}}{\sum_{w\notin\{w^+,w^-\}}e^{z_{\theta,w}(c)}}.
$$
*(Eq. 36.8)*

[MATHEMATICALLY-DERIVED] The displayed policy formula applies only to $a\notin\{w^+,w^-\}$; reserved-entry action probabilities are zero.

[PAPER-REPORTED] SAPO v3 uses this unconstrained logit difference, excludes its two reserved entries from sampling/likelihood/regularization, and reads values before and after the response [R36.4, §4.1]. It applies neither a sigmoid nor output clipping. The paper's $R_{\max}$ serves as $R_s$ here; target scaling does not prove a hard bound on learned values.

```figure
{
  "id": "fig-36.7",
  "kind": "diagram",
  "title": "Causal value boundaries share parameters",
  "caption": "The state readout precedes the response; the action readout follows the response and precedes its consequence. Observation tokens never enter the policy-action mask.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.8",
  "alt": "The state readout precedes the response; the action readout follows the response and precedes its consequence. Observation tokens never enter the policy-action mask.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "dataset",
        "label": "History before action"
      },
      {
        "id": "V",
        "kind": "tensor",
        "label": "Pre-action V readout"
      },
      {
        "id": "a",
        "kind": "tensor",
        "label": "Generated response"
      },
      {
        "id": "Q",
        "kind": "tensor",
        "label": "Post-action Q readout"
      },
      {
        "id": "o",
        "kind": "state",
        "label": "Reward and next observation"
      },
      {
        "id": "target",
        "kind": "objective",
        "label": "Detached turn targets"
      },
      {
        "id": "joint",
        "kind": "process",
        "label": "Shared policy and value update"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "V"
      },
      {
        "from": "h",
        "to": "a"
      },
      {
        "from": "a",
        "to": "Q"
      },
      {
        "from": "Q",
        "to": "o"
      },
      {
        "from": "o",
        "to": "target"
      },
      {
        "from": "V",
        "to": "target"
      },
      {
        "from": "Q",
        "to": "target"
      },
      {
        "from": "target",
        "to": "joint"
      },
      {
        "from": "a",
        "to": "joint"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Terminal feedback sets intermediate rewards to zero and places the outcome at the declared terminal event. Dense feedback records a reward at each turn. Delayed feedback requires a join key identifying the exact episode, action boundary and checker revision; a late verdict must not update a different occurrence that happens to reuse a task index. Intermediate checks are observations when exposed to the agent and training-only labels when kept private. Those two protocols define different decision problems.

[PAPER-REPORTED] SAPO v3 computes old-policy turn targets, normalizes over valid turns before broadcasting to generated response tokens, and uses $V$-based GAE rather than $Q-V$ as its policy advantage [R36.4, §§4.2–4.3]. Its finite task horizon is terminal. That convention must not be silently transferred to an infrastructure interruption in a continuing task.

$$
\begin{aligned}
\delta_t&=r_t+\gamma(1-d_t)V^{\rm old}_{t+1}-V^{\rm old}_t,\\
A_t&=\delta_t+\gamma\lambda(1-d_t)A_{t+1},\qquad A_{T+1}=0,\\
y_t^V&=V_t^{\rm old}+A_t,\qquad y_t^Q=r_t+\gamma(1-d_t)Q_{t+1}^{\rm old},\\
\widehat A_t&=\operatorname{sg}\left[(A_t-c_{\rm inv}m_t^{\rm inv}-\mu_{\rm turns})/(\sigma_{\rm turns}+\epsilon_{\rm adv})\right].
\end{aligned}
$$
*(Eq. 36.9)*

[MATHEMATICALLY-DERIVED] The SARSA target uses the actual next action from the same old-policy trajectory; it is not a maximization over actions. At a true terminal both bootstrap terms vanish. For a censored continuing trajectory, use an explicitly valid continuation estimate or exclude the affected target; setting the bootstrap to zero estimates a different finite-horizon problem. Invalid-action penalties require declared units and an identified indicator, not an infrastructure-failure code.

[MATHEMATICALLY-DERIVED] With all old values zero, one terminal reward $R$, and no intervening termination, recursion gives

$$
A_t=(\gamma\lambda)^{T-t}R.
$$
*(Eq. 36.10)*

This simple special case exposes the attenuation distance and does not represent a trained critic. Learned $V$ changes each residual, and an erroneous value can reverse an early advantage.

```figure
{
  "id": "fig-36.8",
  "kind": "calculator",
  "title": "Delayed terminal feedback attenuation",
  "caption": "Zero-value analytical case of Eq36.10. Moving the terminal event farther from a decision attenuates its trace when gamma times lambda is below one.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.10",
  "alt": "Zero-value analytical case of Eq36.10. Moving the terminal event farther from a decision attenuates its trace when gamma times lambda is below one.",
  "spec": {
    "tex": "A_t=(\\gamma\\lambda)^{T-t}R",
    "equation": "36.10",
    "inputs": [
      {
        "symbol": "g",
        "label": "Discount gamma",
        "default": 0.95,
        "min": 0.5,
        "max": 1,
        "step": 0.05,
        "format": "raw"
      },
      {
        "symbol": "l",
        "label": "Trace lambda",
        "default": 0.95,
        "min": 0.5,
        "max": 1,
        "step": 0.05,
        "format": "raw"
      },
      {
        "symbol": "d",
        "label": "Turns until terminal reward",
        "default": 8,
        "min": 0,
        "max": 50,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "R",
        "label": "Terminal reward",
        "default": 10,
        "min": 1,
        "max": 10,
        "step": 1,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "a",
        "label": "Early turn advantage",
        "formula": "(g*l)^d*R",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "r",
        "label": "Retained terminal fraction",
        "formula": "(g*l)^d",
        "format": "raw",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "d": 0
      },
      "note": "No intervening decisions means no trace attenuation."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "d": 8
      },
      "note": "A delayed terminal residual attenuates by the declared discount-trace product."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "d": 50,
        "g": 0.5,
        "l": 0.5
      },
      "note": "A tiny nonzero retained fraction is displayed without rounding it to zero."
    }
  ]
}
```

[MATHEMATICALLY-DERIVED] SAPO's policy surrogate and turn-level regression must retain their different reductions. Write $\rho_{t,j}=\pi_\theta/b_{\rm old}$ on the restricted action support and $u_t^X=y_t^X/R_s$. Then

$$
\begin{aligned}
L_\pi&=-N_{\rm tok}^{-1}\sum_{t,j}m_{t,j}\min(\rho_{t,j}\widehat A_t,\operatorname{clip}(\rho_{t,j},1-\varepsilon,1+\varepsilon)\widehat A_t),\\
v_t^{X,c}&=v_t^{X,\rm old}+\operatorname{clip}(v_t^X-v_t^{X,\rm old},-\varepsilon_X,\varepsilon_X),\\
L_X&=(2N_{\rm turn})^{-1}\sum_t\max((v_t^X-\operatorname{sg}u_t^X)^2,(v_t^{X,c}-\operatorname{sg}u_t^X)^2),\quad X\in\{V,Q\},\\
L&=L_\pi+c_VL_V+c_QL_Q+\beta L_{\rm KL}-c_H H(\pi_\theta).
\end{aligned}
$$
*(Eq. 36.11)*

[DERIVED] Clipped regression penalizes certain changes; it does not constrain the scalar output to an interval. Shared transformer/head parameters receive all gradients, so separate loss terms do not imply independent optimization. Token averaging still weights longer turns more in policy loss, despite equal-turn advantage statistics and value loss. Removing an independent critic saves its parameters, optimizer state and passes; it does not eliminate actor activations or reference evaluation.

[PAPER-REPORTED] ActFocus retains the underlying PPO/GRPO advantage and changes token aggregation using reasoning/action spans and frozen-reference logits [R36.5, §4]. Its main rule uses batch-standardized action energy; Appendix C.3 Eq16 adds epsilon inside the variance square root for the signal-ablation pipeline.

$$
E_j=-\log\sum_v e^{z^{\rm ref}_{j,v}},\quad
w_j=\begin{cases}\alpha,&j\in\mathcal T_{\rm think},\\1+\beta_E\sigma((E_j-\mu_E)/\sigma_E),&j\in\mathcal T_{\rm action},\end{cases}\quad
L_w=-\frac{\sum_jm_j\operatorname{sg}(w_j)\,\min(\rho_j\widehat A_j,\operatorname{clip}(\rho_j)\widehat A_j)}{\sum_jm_jw_j}.
$$
*(Eq. 36.12)*

[MATHEMATICALLY-DERIVED] The literal main rule requires $\sigma_E>0$; an implementation adopting Appendix C.3 instead declares $\sigma_E=\sqrt{\operatorname{Var}(E)+\epsilon_E}$ with $\epsilon_E>0$. In Eq36.12, $\operatorname{clip}(\rho_j)=\operatorname{clip}(\rho_j,1-\varepsilon,1+\varepsilon)$ with $0<\varepsilon<1$. For $0\le\alpha\le1$, $\beta_E\ge0$, action weights lie in $[1,1+\beta_E]$. A positive action-token count makes the denominator positive; a reasoning-only batch with $\alpha=0$ must be skipped. No statement about the norm of the parameter gradient follows from token counts alone: scores, advantages and vector cancellation also matter.

$$
\operatorname{softmax}(z+c\mathbf1)=\operatorname{softmax}(z),\qquad
E(z+c\mathbf1)=E(z)-c.
$$
*(Eq. 36.13)*

[MATHEMATICALLY-DERIVED] This is a counterexample to interpreting energy as invariant confidence. Context-dependent shifts can arbitrarily reorder energy while preserving every policy probability and entropy. Freezing reference weights does not remove this cross-context gauge dependence. Batch standardization removes a common shift, not arbitrary shifts per context. Observed energy correlations and useful weighting interventions remain empirical findings under the specific model parameterization; they are not a theorem that lower energy means a more peaked distribution.

```figure
{
  "id": "fig-36.9",
  "kind": "compare",
  "title": "Three interventions change different objects",
  "caption": "Terminal reward construction, turn values and token weights have different targets and costs; favorable outcomes do not make their estimators identical.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.13",
  "alt": "Terminal reward construction, turn values and token weights have different targets and costs; favorable outcomes do not make their estimators identical.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "r",
        "label": "Reward design"
      },
      {
        "id": "v",
        "label": "SAPO v3"
      },
      {
        "id": "w",
        "label": "ActFocus"
      }
    ],
    "rows": [
      {
        "dimension": "Object changed",
        "values": {
          "r": "Return definition",
          "v": "Value representation and targets",
          "w": "Token surrogate weights"
        }
      },
      {
        "dimension": "Information boundary",
        "values": {
          "r": "Checker and exposure policy",
          "v": "Pre/post-action causal contexts",
          "w": "Frozen-reference action logits"
        }
      },
      {
        "dimension": "Extra work",
        "values": {
          "r": "Checks and environment access",
          "v": "Shared value regression",
          "w": "Reference logits and reductions"
        }
      },
      {
        "dimension": "Main risk",
        "values": {
          "r": "Reward shortcut or leakage",
          "v": "Shared-gradient interference",
          "w": "Gauge-sensitive score interpretation"
        }
      }
    ]
  }
}
```

```figure
{
  "id": "fig-36.10",
  "kind": "chart",
  "title": "Energy changes without changing probabilities",
  "caption": "Two fixed logits shifted together by c. Softmax probability is constant while raw energy changes linearly; an analytical gauge counterexample. Energy and probability are distinct dimensionless readouts; their numeric equality is not an equivalence of estimands.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.13",
  "alt": "Two fixed logits shifted together by c. Softmax probability is constant while raw energy changes linearly; an analytical gauge counterexample.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Common logit shift c",
      "domain": [
        -4,
        4
      ]
    },
    "y": {
      "label": "Energy or probability"
    },
    "variables": {},
    "series": [
      {
        "id": "E",
        "label": "Energy of logits [c,c+1]",
        "formula": "-x-ln(1+exp(1))",
        "sample": {
          "from": -4,
          "to": 4,
          "count": 9
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "p",
        "label": "Probability of second token",
        "formula": "exp(1)/(1+exp(1))",
        "sample": {
          "from": -4,
          "to": 4,
          "count": 9
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0,
        "y": 0.7310585786300049,
        "label": "Token probability invariant to common shift"
      },
      {
        "x": -4,
        "y": 2.6867383124817774,
        "label": "Raw energy changes under the same shift"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 36.2 — Validated turn-credit update.** Inputs: immutable scored episodes, fixed old/reference digests, positive target scales and epsilon, finite positive integer update/epoch caps $K,E$, optimizer/scheduler state, and reserved compute/memory budget. Output: current parameter/optimizer/scheduler state, accepted step count and status; prior successful steps remain committed if a later step fails. This reconstruction combines target construction with optional detached weighting; it does not claim the papers evaluated this combined configuration. Initialize $k=0$, accepted set $\mathcal B=\varnothing$ and zero gradient.

$$
\begin{aligned}
1.&\quad\text{reserve training/reference capacity};\quad\text{failure}\Rightarrow\operatorname{return}(\text{no update}).\\
2.&\quad\text{for each bounded input occurrence }e:\ \text{invalid identity, ambiguous effect, nonfinite reward/value/ratio or missing terminal/bootstrap}\Rightarrow\operatorname{reject}(e);\operatorname{continue}.\\
3.&\quad\text{for }t=T_e,\ldots,1:\ \operatorname{compute}(\delta_t,A_t,y_t^V,y_t^Q)\text{ by Eq36.9 with fixed old values};\quad\mathcal B\leftarrow\mathcal B\cup\{e\}.\\
4.&\quad N_{\rm turn}=0\text{ or }N_{\rm tok}=0\Rightarrow\operatorname{release};\operatorname{return}(\text{empty}).\\
5.&\quad\widehat A\leftarrow\operatorname{normalize}_{\epsilon}(\text{valid turns});\quad w\leftarrow\operatorname{sg}(\text{declared token rule});\quad\sum mw\le0\Rightarrow\operatorname{release};\operatorname{return}(\text{zero weight}).\\
6.&\quad\text{for epochs }1,\ldots,E\text{ while }k<K:\ L\leftarrow\operatorname{masked\_loss}(\mathcal B);\quad\text{nonfinite}\Rightarrow\operatorname{release};\operatorname{return}(\theta,\mathrm{opt},\mathrm{sched},k,\text{failed current step}).\\
7.&\quad g\leftarrow\nabla_\theta L;\quad\text{nonfinite }g\Rightarrow\operatorname{release};\operatorname{return}(\theta,\mathrm{opt},\mathrm{sched},k,\text{failed current step});\quad\theta\leftarrow\operatorname{optimizer}(\theta,g);\ k\leftarrow k+1.\\
8.&\quad\operatorname{seal}(\text{targets, masks, normalizers, versions});\operatorname{release};\operatorname{return}(\theta,\mathrm{opt},\mathrm{sched},k,\text{complete}).
\end{aligned}
$$
*(Eq. 36.14)*

[DERIVED] All distributed ranks agree on admission and skip decisions before reduction. A rejected current step skips optimizer, momentum, scheduler and version advancement for that step; earlier accepted steps and their state remain in the returned record. Fixed targets never read current predictions. Complexity is linear in turn/token metadata plus the model forward/backward costs; epsilon and value scale are part of the artifact rather than hidden numerical defaults.

## Implementation

[OFFICIAL-DOCUMENTATION] **verl — RL post-training layer** is the relevant stack family [R36.6]. The paper's `verl-agent` and ActFocus's RAGEN configurations are their own experimental implementations, not assertions about unconfigured verl v0.9.1 defaults. AReaL's pinned guide explicitly warns that decoupled loss may conflict with SAPO [R36.7, asynchronous guide]; compatibility requires a matched objective audit.

[DERIVED] Gather pre/post-action logits by causal positions before padding/packing obscures boundaries. Store turn masks separately from token masks. Accumulate turn statistics in adequate precision and all-reduce the intended sums/counts. Shared-head readout adds two coordinate gathers rather than a full new vocabulary projection, but the actor still produces the needed hidden states/logits. Full-reference energy needs a vocabulary log-sum-exp, reference parameters and their forward activations; a baseline without an existing reference pass cannot call that free. Account for reference/model residency, vocabulary traffic, tool/checker calls and delayed-verdict storage independently.


```figure
{
  "id": "fig-36.11",
  "kind": "hierarchy",
  "title": "A verdict has a causal release boundary",
  "caption": "Training-only checks remain private; exposed intermediate checks become observations and change the policy context.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.9",
  "alt": "Training-only checks remain private; exposed intermediate checks become observations and change the policy context.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Task objective",
        "kind": "objective",
        "note": "Declares terminal and intermediate reward semantics"
      },
      {
        "label": "Executed command",
        "kind": "process",
        "note": "Commits a known environment effect"
      },
      {
        "label": "Private checker",
        "kind": "process",
        "note": "Produces a versioned delayed verdict"
      },
      {
        "label": "Episode join",
        "kind": "dataset",
        "note": "Immutable occurrence and action identity"
      },
      {
        "label": "Turn targets",
        "kind": "tensor",
        "note": "Terminal, bootstrap, or exclusion decision"
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

| Study | Models, workload and controls | Budget/hardware/uncertainty |
|---|---|---|
| SAPO v3 [R36.4, §5, Appendix B] | Qwen2.5-1.5B/7B-Instruct, Qwen3-14B; ALFWorld/WebShop; matched PPO uses turn-GAE; Q-loss/normalization ablations | 150iterations; horizons50/15; LR1e-6, gamma=lambda.95, KL.01; 1.5B:4A40 or1H200, 7B:2H200,14B:32H20; three-seed mean/SD |
| SAPO resource comparison | Figure2 matched workload/model; H200 peak memory;1.5B1GPU/7B2GPUs | Training precision, exact code commit and repeated timing uncertainty not disclosed |
| ActFocus [R36.5, §5, Appendix C] | Qwen2.5 .5B/1.5B/3B; Sokoban/FrozenLake/Sudoku/WebShop; Uniform versus alpha.1,beta.5; PPO/GRPO; alpha/beta/signal ablations |4H100;200iterations symbolic/100WebShop;128trajectories before filtering; eval512symbolic/256WebShop,temp.5; independent training-seed uncertainty not disclosed |

## Observations

**What the paper claims.** [PAPER-REPORTED] SAPO v3 matches PPO approximately while reducing ALFWorld iteration time22.6%/23.6% at1.5B/7B and peak memory15.2–35.6%; removing Q-loss lowers ALFWorld94.6→92.2/96.1→91.2 [R36.4, §5.2–5.3]. ActFocus reports WebShop3B strict success22.7→36.7; its beta sweep is nonmonotonic and alpha0 can collapse [R36.5, Table2, §§5.4–5.6].

**What the evidence shows.** [DERIVED] These studies support specific architectural and weighting interventions. SAPO's historical v1 superiority/runtime headline is superseded by its changed v3 baseline. ActFocus's source interpretation of energy as confidence does not follow from its mathematics.

**What we infer.** [DERIVED] A shared critic can save model state while retaining temporal targets; a token intervention may help without establishing causal per-token credit. Neither result proves universal dominance or zero additional compute.

**What remains unknown.** [NOT-DISCLOSED] Release-pinned experimental code, all independent timing/seed uncertainty and broad asynchronous compatibility remain incomplete.

```figure
{
  "id": "fig-36.12",
  "kind": "chart",
  "title": "A delayed residual reaches earlier decisions with attenuation",
  "caption": "Eq.36.10 with zero values, one terminal residual10 and gamma=lambda0.95: bars at decisions1–9 are10×0.9025^(9−t). This is a declared eligibility-trace estimator, not causal proof that early actions produced the terminal outcome.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.10",
  "alt": "Nine decision bars rise from10 times0.9025^8 to10 at the terminal decision. No intermediate residual is present and all value estimates are zero; different truncation or bootstrap rules change the target.",
  "spec": {
    "type": "bar",
    "categories": [
      "Decision1",
      "Decision2",
      "Decision3",
      "Decision4",
      "Decision5",
      "Decision6",
      "Decision7",
      "Decision8",
      "Decision9:terminal"
    ],
    "x": {
      "label": "decision before the same terminal residual"
    },
    "y": {
      "label": "estimated advantage in reward units",
      "domain": [
        0,
        10
      ],
      "format": "raw"
    },
    "series": [
      {
        "id": "trace",
        "label": "gamma=lambda0.95; zero values",
        "values": [
          4.401266686517656,
          4.876749791155298,
          5.403600876626369,
          5.987369392383788,
          6.634204312890624,
          7.3509189062499996,
          8.1450625,
          9.025,
          10
        ],
        "emphasis": true
      }
    ]
  },
  "anchor": "failure-modes"
}
```

## Failure modes

[DERIVED] Dense reward can reward repeated intermediate checks rather than completion. A checker can leak hidden targets through error messages. A delayed verdict joined by task ID alone can attach to a different rollout. Treating infrastructure cancellation as terminal zero can penalize slow but successful strategies. Clipped readouts copied from SAPO v1 silently implement a different v3 method. Zero action counts, degenerate variance and nonfinite reference logits require explicit rejection or a documented epsilon convention.

## Siblings

[PAPER-REPORTED] Kimi PARL trains the orchestrator while freezing subagents; its reward combines task outcome with parallelism and subtask-finish signals that are annealed away [R36.2, §3]. [DERIVED] The orchestrator receives subagent results as observations. Jointly training subagents would require additional role-specific score terms and nonstationary transition accounting. A terminal group-normalized advantage, a learned turn baseline and hierarchical auxiliary rewards therefore solve different estimation problems.

## Extensions

[DERIVED] Potential-based dense feedback preserves the declared terminal objective only under Eq36.7's boundary conditions. Hierarchical task decomposition can reduce the horizon seen by a particular role while increasing total work. Source-supported improvements above should be tested with the same checker and task distribution; changing reward, environment and baseline together prevents attribution to a value architecture alone.

## Limitations

[DERIVED] GAE uses an approximate value and its lambda tradeoff does not disappear when the value shares parameters. Batch normalization changes the estimator and couples independent turns. ActFocus's frozen score is fixed only for the same context; context occupancy changes during training. Gradient reweighting is a chosen surrogate, not an invariant decomposition of responsibility. A correlation between a readout and sampled return does not certify calibration or correct counterfactual action ranking.

## Reproducibility

[DERIVED] Pin the manuscript revision, reserved token IDs, action support, causal positions, reward scaling, terminal/censor handling, turn and token reductions, detached targets, epsilon conventions, reference logits and all regularizers. Preserve v1/v3 distinctions in the run manifest. Proposed falsification and source-reproduction protocols belong to [verification.md](verification.md).

## References

[R36.4](references.md) v3 §§4–5,Appendices A–C; [R36.5](references.md) §§3–5,Appendices B–C; [R36.2](references.md) §3; [R36.6](references.md); [R36.7](references.md).
