---
id: ms.section.59.4
entity_type: section
title: "Action-conditioned dynamics"
volume: 3
part: 10
chapter: 59
section: 59.4
slug: 59-4-action-conditioned-dynamics
parent: ms.chapter.59
prev_sibling: ms.section.59.3
next_sibling: ms.section.59.5
children: []
prerequisites:
  [
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.24,
    ms.chapter.38,
    ms.chapter.57,
    ms.chapter.58,
  ]
downstream: [ms.chapter.60]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [multimodal_generation, predictive_representation, control],
    feedback_setting: [],
    modality: [image, text, audio, video],
  }
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        OFFICIAL-DOCUMENTATION,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 59.4 - Action-conditioned dynamics and bounded planning

## Scope

[DERIVED] Prediction becomes a control model when candidate actions can be queried through an explicit transition interface. This section distinguishes autoregressive rollout, direct action-prefix prediction and future-feature policy conditioning, then derives finite-horizon ranking conditions and a bounded CEM procedure.

## Why this exists

[DERIVED] A low teacher-forced loss can coexist with unstable blind rollout. A planner searches precisely for sequences on which its model predicts low cost, potentially exploiting errors that random evaluation seldom visits. Horizon, action skip, candidate count and execution schedule jointly determine both reliability and compute.

## Intuition

[DERIVED] Recursive rollout repeatedly consumes its own output; prefix prediction repeatedly references an observed anchor. The latter removes one recurrence path but must still learn every queried horizon and action composition. Replanning helps only when new measurements arrive before errors cause irreversible consequences.

## Formulation

[MATHEMATICALLY-DERIVED] Under a uniform one-step error epsilon on all relevant true states and an L-Lipschitz predictor over true/predicted states,

$$
 e_{h+1}\leq Le_h+\epsilon,\quad e_0=0,\quad
 e_H\leq\epsilon\sum_{j=0}^{H-1}L^j
 =\begin{cases}\epsilon H,&L=1,\\\epsilon(L^H-1)/(L-1),&L\ne1.\end{cases}
$$

_(Eq. 59.15)_

[DERIVED] The domain assumption matters: on-policy one-step error does not supply a uniform bound on imagined states. L can exceed1, and state aliasing can violate the assumed transition map entirely. For L=0 the sum is1 for H at least1; avoid arithmetic0-to-the-zero conventions in implementations by summing the finite series.

[MATHEMATICALLY-DERIVED] Direct prefix prediction uses

$$
 \hat z_{t+h}=G(z_t,E_A(a_{t:t+h-1})),\quad
 \mathcal L_{prefix}=H^{-1}\sum_{h=1}^H\|\hat z_{t+h}-z_{t+h}\|^2.
$$

_(Eq. 59.16)_

[DERIVED] A causal prefix representation cannot depend on actions after h. This removes recurrent latent-error multiplication from the forward graph but not approximation error, distribution shift or quadratic attention work in the prefix encoder. Predicting H outputs is not constant total work.

[MATHEMATICALLY-DERIVED] For a finite common candidate bank C, if |Jhat_i-J_i| is at most epsilon_J for every candidate and ihat minimizes Jhat, then

$$
 J_{\hat i}-\min_iJ_i\leq2\epsilon_J.
$$

_(Eq. 59.17)_

[DERIVED] Insert Jhat_ihat and Jhat_istar and use optimality plus the two uniform deviations. A unique reference minimizer is preserved when every competing gap exceeds2epsilon_J. This is a candidate-bank result, not global action optimality. Model error, goal-metric mismatch and simulator/task mismatch all contribute to the cost error; an encoder norm alone need not upper-bound physical cost.

[MATHEMATICALLY-DERIVED] With r primitive steps per model action, model horizon H and execution chunk K,

$$
 T_{lookahead}=rH\Delta_{env},\qquad T_{open}=rK\Delta_{env},\quad1\leq K\leq H.
$$

_(Eq. 59.18)_

[DERIVED] These are physical intervals only if environment step duration is fixed and commands have that duration. Wall-clock solve time and sensor/actuator delay add a separate stale-observation interval. Simulation pausing during planning can conceal this issue.

```figure
{
  "id": "fig-59.12",
  "kind": "calculator",
  "title": "Five-step rollout amplification",
  "caption": "Exact H=5 component of Eq.59.15, assuming a uniform one-step error and Lipschitz bound; not a fitted source-model guarantee.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-59.15",
  "alt": "Exact H=5 component of Eq.59.15, assuming a uniform one-step error and Lipschitz bound; not a fitted source-model guarantee.",
  "spec": {
    "equation": "59.15",
    "tex": "e_H\\leq\\epsilon\\sum_{j=0}^{H-1}L^j",
    "inputs": [
      {
        "symbol": "eps",
        "label": "One-step error bound",
        "default": 0.01,
        "min": 0,
        "max": 1,
        "format": "raw"
      },
      {
        "symbol": "L",
        "label": "Lipschitz bound",
        "default": 1.1,
        "min": 0,
        "max": 2,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "bound",
        "label": "Finite-horizon bound",
        "formula": "eps*(1+L+L^2+L^3+L^4)",
        "format": "raw"
      }
    ]
  }
}
```

[DERIVED] The calculator specializes Eq.59.15 to H=5 and evaluates its exact finite sum, including L=1. It has no adjustable horizon; the general equation requires the actual H-term sum.

## Mechanism

### Methodology

[PAPER-REPORTED] Fast-LeWM uses a causal action-prefix Transformer and parallel latent predictor; an optional direct-versus-decomposed terminal consistency term changes candidate scoring. Its seven-seed planning appendix reports mean success81.2% versus85.7% with per-task SDs, distinct from the original single-seed main comparison. AppendixE's19.7-to 4.1 seconds dynamics and33.7-to 16.1 seconds CEM times are accumulated over the entire evaluation workload, not per-call latency. [R59.4, Sec. 3; Tables2/5; AppendicesD/E]

| Timing context    | Source condition for the preceding Fast-LeWM measurements                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Hardware          | One RTX4090                                                                                                                   |
| Model / precision | Shared ViT encoder; causal prefix/parallel predictor versus LeWM; timing precision not separately disclosed                   |
| Inputs / outputs  | Four simulator tasks; horizon 5 and action skip5                                                                              |
| Concurrency       | 300 candidates/iteration,30 elites; task-specific CEM budget shared across methods                                            |
| Runtime           | Source implementation; exact software stack not reconstructed here                                                            |
| Boundary          | Dynamics includes action encoding/prediction; CEM adds encoding/optimization; neither includes environment stepping/rendering |
| Aggregation       | Sum across all planning calls and evaluation trajectories                                                                     |
| Quality condition | Same planning protocol; seven-seed appendix is separate from single-seed main table                                           |

[DERIVED] Agreement between two decompositions is not calibrated uncertainty: both can share the same systematic error. A consistency penalty can improve source performance while favoring a self-consistent but physically wrong sequence elsewhere.

```figure
{
  "id": "fig-59.13",
  "kind": "diagram",
  "title": "Recurrence and action-prefix prediction",
  "caption": "Recurrence feeds imagined state forward; prefix prediction returns to the observed anchor. Both still require action support and horizon validation.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.13",
  "alt": "Recurrence feeds imagined state forward; prefix prediction returns to the observed anchor. Both still require action support and horizon validation.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "obs",
        "kind": "node",
        "label": "Observed z"
      },
      {
        "id": "a",
        "kind": "node",
        "label": "Action sequence"
      },
      {
        "id": "rec",
        "kind": "process",
        "label": "Repeated transition"
      },
      {
        "id": "pref",
        "kind": "process",
        "label": "Causal prefixes"
      },
      {
        "id": "out",
        "kind": "node",
        "label": "Future candidates"
      }
    ],
    "edges": [
      {
        "from": "obs",
        "to": "rec",
        "kind": "flow",
        "label": "recursive state"
      },
      {
        "from": "a",
        "to": "rec",
        "kind": "flow",
        "label": "one action/step"
      },
      {
        "from": "obs",
        "to": "pref",
        "kind": "flow",
        "label": "shared anchor"
      },
      {
        "from": "a",
        "to": "pref",
        "kind": "flow",
        "label": "prefixes"
      },
      {
        "from": "rec",
        "to": "out",
        "kind": "flow",
        "label": "terminal"
      },
      {
        "from": "pref",
        "to": "out",
        "kind": "flow",
        "label": "all queried horizons"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 59.4 — Deadline-bounded CEM with an explicit execution chunk

[DERIVED] Inputs: observed history, goal, action bounds/support, H,r,K,N,I, elite count E and wall-clock deadline. Require1<=E<=N and1<=K<=H. Output: feasible chunk or declared fallback.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad z\leftarrow E(h),\quad\nu_0\leftarrow\operatorname{InitSearch},
\quad A_*\leftarrow A_{\rm fallback},\quad i\leftarrow0;\\
2.&\quad i<I\ \land\ t<t_{\rm deadline}:\quad
A_{1:n_{\rm cand}}\sim\nu_i,\quad J_j\leftarrow\operatorname{PredictCost}(z,A_j);\\
3.&\quad\mathcal V\leftarrow\{j:\operatorname{finite}(J_j)\land\operatorname{Admissible}(A_j)\};
\quad|\mathcal V|<E\Rightarrow\operatorname{stop};\\
4.&\quad\mathcal E\leftarrow\operatorname{LowestCost}_E(\mathcal V),\quad
\nu_{i+1}\leftarrow\operatorname{FitMoments}(A_{\mathcal E},\sigma_{\min}^2),\quad i\leftarrow i+1;\\
5.&\quad A_*\leftarrow\operatorname{BestFeasibleSeen}(A_*,A_{\mathcal V});
\quad\text{return to 2 while budgets hold};\\
6.&\quad\operatorname{AgeDeadlineValid}(h)=0\Rightarrow\operatorname{return}(\mathrm{fallback});
\quad\operatorname{return}(A_*[1:K],r,\mathrm{cost\ ledger}).
\end{aligned}
$$

1. Encode current/goal once under the active normalizer; initialize the candidate distribution and retain a known feasible reference sequence.
2. For at most I iterations and before the deadline, sample N bounded sequences; evaluate the same declared cost using recurrence or prefix prediction.
3. Reject nonfinite predictions, invalid actions and unsupported states under the specified monitor. If fewer than E valid candidates remain, stop with the feasible fallback.
4. Rank deterministically with a declared tie rule; fit elite moments with a variance floor. Clipping and truncated sampling define different search distributions and must not be silently interchanged.
5. Select the best feasible sequence seen, not an unevaluated final mean. Execute exactly K model actions, each r primitive steps, only if its observation age remains valid.
6. Acquire a new history and replan; invalidate warm starts after resets, task changes or action-schema changes.

[DERIVED] Recursive dynamics requires O(INH) sequential transition applications before batching effects; prefix models trade that path for action-prefix attention and parallel predictors. Memory includes N-by-H actions and candidate states. Chunked evaluation must preserve candidate IDs and reductions. Deadline overrun is a control outcome, not a request to keep waiting.

## Implementation

[DERIVED] LeWM's paper AppendixD executes the complete optimized five-model-step sequence, each spanning five primitive actions, before replanning. Calling it MPC does not mean one primitive action is executed. Its generic CEM appendix gives a30iteration example, while task-specific details use10 for some tasks. Record actual task overrides. Adaptive-prefix rollout additionally remasks every predicted state before reuse.

[DERIVED] Action-conditioned dynamics must accept a proposed candidate sequence as input. A model that predicts likely future features from current observations, instruction and proprioception can condition a policy without exposing that intervention interface. Exported schemas should distinguish predict_future(context) from predict_under_actions(context,actions) to avoid accidentally treating a policy feature model as a simulator.

## Experimental design

### Reported experiments

[PAPER-REPORTED] V-JEPA2.1's real-robot Table 6 distinguishes an800candidate/10iteration/H1 matched planner from a300candidate/15iteration/H8 planner. Grasp success changes60% to 70% in the matched comparison and to 80% with the longer planner; ten tasks per skill are a small sample. The larger gain is a model-plus-planner comparison. [R59.2, Sec. 3.3; Table 6]

| Timing context    | Source Table 6 planner comparison                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Hardware          | Franka Panda with one A100                                                                              |
| Model / precision | Action-conditioned predictor with V-JEPA2/2.1 features; precision not separately disclosed for this row |
| Inputs / outputs  | Robot observations and Reach/Grasp/Pick-place actions                                                   |
| Concurrency       | 800 candidates/10iterations/H1 versus300/15/H8                                                          |
| Runtime           | Source robot planning setup; exact runtime version unverified                                           |
| Boundary          | Table reports planning time, not end-to-end sensor-to-actuator latency                                  |
| Aggregation       | Source planning times3s versus14s; aggregation detail not fully specified                               |
| Quality condition | 10 tasks/skill; matched and changed-planner comparisons remain separate                                 |

[DERIVED] Experiment59.3 proposes equal-bank/equal-work and deadline-constrained comparisons separately. Vary H and K independently; retain candidate-ranking errors and realized outcomes, including timeouts. Do not pool planning randomness with independent model-training uncertainty.

## Observations

**What the paper claims.** [PAPER-REPORTED] Fast-LeWM proposes action-prefix prediction as a replacement for repeated local rollout [R59.4].

**What we infer.** [DERIVED] Eq.59.17 bounds finite selection only with uniform cost error and a meaningful reference cost.

**What the evidence shows.** [DERIVED] Direct prefix prediction improves reported planning/runtime under its protocol. Robot comparisons expose planner-budget confounding.

**Engineering consequence.** [DERIVED] Publish primitive-step units, execution chunk, timing aggregation and actual candidate workload.

**What remains unknown.** [UNVERIFIED] Uniform cost-error bounds and robustness beyond trained horizons are not supplied for the inspected deployed systems.

## Failure modes

[DERIVED] Search exploits model errors; mean candidates can be infeasible; action clipping can distort elite statistics; delayed observations invalidate plans; long open-loop chunks hide errors until too late. Shortening H reduces one risk but can remove required lookahead. A model can be consistently wrong under both direct and decomposed prediction.

```figure
{
  "id": "fig-59.14",
  "kind": "compare",
  "title": "Planner comparisons require two budgets",
  "caption": "Equal candidate counts do not equal work, and equal work does not equal interactive delay. Report both views.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.14",
  "alt": "Equal candidate counts do not equal work, and equal work does not equal interactive delay. Report both views.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "bank",
        "label": "Common bank"
      },
      {
        "id": "work",
        "label": "Common model work"
      },
      {
        "id": "deadline",
        "label": "Common deadline"
      }
    ],
    "rows": [
      {
        "dimension": "Controls",
        "values": {
          "bank": "Same sequences and costs",
          "work": "Same evaluated operations/tokens",
          "deadline": "Same sensor-to-decision budget"
        }
      },
      {
        "dimension": "Reveals",
        "values": {
          "bank": "Ranking fidelity",
          "work": "Efficiency-quality tradeoff",
          "deadline": "Usable closed-loop behavior"
        }
      },
      {
        "dimension": "Misses",
        "values": {
          "bank": "Optimized search exploitability",
          "work": "Different hardware scheduling",
          "deadline": "Cause of model vs planner changes"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.section.59.1 supplies action identifiability; @ms.section.59.6 supplies geometry/task alignment. @ms.chapter.56 provides timing/state publication principles; @ms.chapter.60 adds actuator deployment boundaries.

## Extensions

### Improvements and their evidence

[DERIVED] Use prefix prediction when equal-bank fidelity and complete workload cost improve; reverse if unseen compositions fail. Shorten K when fresher measurements improve utility enough to pay replanning cost. Add consistency penalties only after matched task-cost validation; remove when they suppress useful diverse actions or reward shared errors.

## Limitations

[DERIVED] CEM is stochastic finite search, not a global optimizer. Its best candidate is only as good as the action bank and cost. No inspected source provides a blanket real-time safety guarantee.

## Reproducibility

[DERIVED] Record H,r,K, candidates/elites/iterations, bounds, sampling rule, warm starts, seeds, timing start/end, device synchronization and all timeout outcomes. Archive realized trajectories separately from imagined ones.

## References

[R59.1] LeWM AppendixD. [R59.2] V-JEPA2.1 Table 6. [R59.4] Fast-LeWMv2 Sec. 3 and AppendicesA/D/E. Exact locators: @ms.references.59.
