---
id: ms.section.60.4
entity_type: section
title: "World-model integration"
volume: 3
part: 10
chapter: 60
section: 60.4
slug: 60-4-world-model-integration
parent: ms.chapter.60
prev_sibling: ms.section.60.3
next_sibling: ms.section.60.5
children: []
prerequisites:
  [
    ms.chapter.18,
    ms.chapter.24,
    ms.chapter.34,
    ms.chapter.35,
    ms.chapter.36,
    ms.chapter.52,
    ms.chapter.55,
    ms.chapter.56,
    ms.chapter.57,
    ms.chapter.58,
    ms.chapter.59,
  ]
downstream: []
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [action_generation, embodied_control, predictive_representation],
    feedback_setting: [],
    modality: [image, text, video, action],
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

# 60.4 - World-model integration

## Scope

[DERIVED] A world model can supply a latent state, a visual subgoal, candidate-action predictions or imagined training experience. These interfaces need different evidence. This section connects them without treating a plausible image, a low prediction error or a trust score as a control certificate.

## Why this exists

[DERIVED] Model-based search and learning amplify errors by optimizing against them. A policy may exploit an optimistic reward proxy on unrealistic predicted observations. Updating the simulator can reduce stale-model bias while simultaneously changing the calibration target. Reliability must be measured on grounded continuations and revalidated as the policy distribution changes.

## Intuition

[DERIVED] A generated image of a closed drawer specifies an outcome; it does not describe which forces or actions close it. A latent dynamics model queried with actions can support planning, but its metric must preserve task-relevant distinctions. Imagining thousands of favorable outcomes does not add thousands of real successes.

## Formulation

[MATHEMATICALLY-DERIVED] A subgoal-conditioned hierarchy factors a policy as

$$
 g\sim p_\psi(g|h,\ell),\qquad a\sim\pi_\theta(a|h,\ell,g).
$$

_(Eq. 60.13)_

[DERIVED] This is not necessarily p(o_future|h,do(A)). A subgoal can be unreachable, stale or inconsistent across views. Hierarchical utility requires the low-level policy to realize useful progress and a high-level mechanism to detect completion/failure, not only generate attractive targets.

[MATHEMATICALLY-DERIVED] If a fixed-action reward proxy Q is L_Q-Lipschitz in observation features and prediction discrepancy at step j is delta_j,

$$
 \left|\sum_{j=1}^H\gamma^{j-1}[Q(\hat o_j,u_j)-Q(o_j,u_j)]\right|
 \leq L_Q\sum_{j=1}^H\gamma^{j-1}\delta_j.
$$

_(Eq. 60.14)_

[DERIVED] This bounds imagined-versus-grounded evaluation of the same proxy under the same actions. It does not bound error relative to true reward unless proxy/task error is also bounded. The Lipschitz and feature-domain premises must cover the imagined states. Visual similarity alone can miss a crucial contact variable.

[MATHEMATICALLY-DERIVED] A stage-level heuristic may map a nonnegative reliability error e to

$$
 \chi=(1+(e/e_0)^\kappa)^{-1},\quad
 \rho=\rho_{min}+(\rho_{max}-\rho_{min})\chi,\quad
 H=\lfloor H_{min}+(H_{max}-H_{min})\chi\rfloor.
$$

_(Eq. 60.15)_

[DERIVED] Require e0>0,kappa>0 and valid ordered bounds. chi is a monotone scheduling score, not a calibrated probability. Floors and non-multiple action chunks require explicit partial-chunk masks. Parameter choices determine how quickly an error increase shortens imagination.

[MATHEMATICALLY-DERIVED] Reliability-biased replay and loss weighting induce

$$
 \mathcal L=(1-\rho)\mathbb E_{real}\ell+\rho\sum_i p_iw_i\ell_i,
 \quad p_i\propto(e_i+\zeta)^{-\alpha},\quad\zeta>0.
$$

_(Eq. 60.16)_

[DERIVED] Sampling and loss weights multiply: effective unnormalized weight is p_iw_i. Without a declared importance correction this is a deliberately changed objective, not an unbiased estimate of uniform imagined replay. It may reduce exposure to unreliable data while discarding useful rare examples. A lower estimated error only helps if it orders actual consequential errors sufficiently well.

```figure
{
  "id": "fig-60.12",
  "kind": "calculator",
  "title": "Five-step proxy-bias component",
  "caption": "Eq.60.14 specialized to H=5 and a common feature-discrepancy bound delta. This assumes a valid proxy Lipschitz bound and the same actions; true-reward error is excluded.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-60.14",
  "alt": "Eq.60.14 specialized to H=5 and a common feature-discrepancy bound delta. This assumes a valid proxy Lipschitz bound and the same actions; true-reward error is excluded.",
  "spec": {
    "equation": "60.14",
    "tex": "b\\leq L_Q\\delta(1+\\gamma+\\gamma^2+\\gamma^3+\\gamma^4)",
    "inputs": [
      {
        "symbol": "LQ",
        "label": "Proxy Lipschitz bound",
        "default": 1,
        "min": 0,
        "max": 10,
        "format": "raw"
      },
      {
        "symbol": "delta",
        "label": "Feature discrepancy bound",
        "default": 0.02,
        "min": 0,
        "max": 1,
        "format": "raw"
      },
      {
        "symbol": "gamma",
        "label": "Discount",
        "default": 0.9,
        "min": 0,
        "max": 1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "bound",
        "label": "Proxy aggregate deviation bound",
        "formula": "LQ*delta*(1+gamma+gamma^2+gamma^3+gamma^4)",
        "format": "raw"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] MeRL updates an action-conditioned visual simulator and success-to-go proxy, calibrates on stored grounded action continuations, and schedules imagined ratio/horizon plus chunk replay/gradient weights. A separately fitted residual predictor scores recursive chunks without future ground truth and is frozen during imagination. Its main comparison uses three training seeds on perturbed LIBERO-PRO. The10.9% threshold-attainment improvement counts outer refinement stages under a shared interaction allowance, not measured wall time or identical realized transitions. Physical results use fixed50 demonstrations/task and20 trials on each of two tasks;80.0% versus77.5% visual-only intervals overlap. [R60.4, Secs. 3-4; AppendicesA/C/D/E]

[DERIVED] This supplies a useful two-level reliability mechanism with bounded evidence. Grounded calibration must remain separate from unpaired recursive scoring. Otherwise future observations can leak into a purported no-oracle predictor. A small measured residual on stored action sequences does not certify a new optimized action bank.

```figure
{
  "id": "fig-60.13",
  "kind": "diagram",
  "title": "Grounded calibration and recursive imagination",
  "caption": "Future ground truth exists for stored continuations but must not enter unpaired recursive scoring. Simulator and trust versions freeze during each policy update.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.13",
  "alt": "Future ground truth exists for stored continuations but must not enter unpaired recursive scoring. Simulator and trust versions freeze during each policy update.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "r",
        "kind": "dataset",
        "label": "Grounded action continuations"
      },
      {
        "id": "wm",
        "kind": "model",
        "label": "Updated simulator/proxy"
      },
      {
        "id": "cal",
        "kind": "metric",
        "label": "Measured residuals"
      },
      {
        "id": "trust",
        "kind": "model",
        "label": "No-oracle residual predictor"
      },
      {
        "id": "imag",
        "kind": "dataset",
        "label": "Recursive imagination"
      },
      {
        "id": "up",
        "kind": "process",
        "label": "Weighted policy update"
      }
    ],
    "edges": [
      {
        "from": "r",
        "to": "wm",
        "kind": "flow",
        "label": "fit"
      },
      {
        "from": "wm",
        "to": "cal",
        "kind": "flow",
        "label": "paired replay"
      },
      {
        "from": "r",
        "to": "cal",
        "kind": "flow",
        "label": "observed future"
      },
      {
        "from": "cal",
        "to": "trust",
        "kind": "flow",
        "label": "fit then freeze"
      },
      {
        "from": "wm",
        "to": "imag",
        "kind": "flow",
        "label": "generate"
      },
      {
        "from": "trust",
        "to": "imag",
        "kind": "flow",
        "label": "score"
      },
      {
        "from": "imag",
        "to": "up",
        "kind": "flow",
        "label": "selected weighted data"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 60.4 — Audit one model-based policy-update stage

[DERIVED] Inputs: grounded replay, current policy, simulator/proxy, trust estimator and fixed stage budgets. Output: versioned policy update or a rejected stage.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad (F,\widehat e)\leftarrow\operatorname{FitGrounded}_{u\le U_{\max}}
(\mathcal D_{\rm train},\mathcal D_{\rm val});\quad\operatorname{freeze}(F,\widehat e);\\
2.&\quad e\leftarrow\widehat e(h),\quad(\rho,H)\leftarrow\operatorname{BoundedSchedule}(e);\\
3.&\quad\operatorname{FiniteSupported}(e,\rho,H)=0\Rightarrow\operatorname{return}(\mathrm{rejected\ stage});\\
4.&\quad i=1,\ldots,n_{\rm imagined}:\quad
\widehat o_{i,1:H}\leftarrow\operatorname{Rollout}(F,h_i,\pi_\theta);\\
5.&\quad p_i\leftarrow\frac{(e_i+\zeta)^{-\alpha}}{\sum_j(e_j+\zeta)^{-\alpha}},
\quad\mathcal J\leftarrow(1-\rho)\widehat{\mathbb E}_{\rm real}\ell+
\rho\sum_i p_iw_i\ell_i;\\
6.&\quad\theta'\leftarrow\operatorname{AllowedPolicyUpdate}(\theta,\mathcal J);
\quad\operatorname{return}(\theta',F,\widehat e,\mathrm{untouched\ episode\ evaluation}).
\end{aligned}
$$

1. Update simulator/proxy only on permitted grounded training data; keep held-out continuations for diagnostic calibration.
2. Replay recorded actions from their actual anchors and compare predicted/observed futures under the same timestamps and schema.
3. Refresh the no-oracle estimator on measured residuals using a separate fitting/validation split; freeze model and estimator for imagination.
4. Select bounded ratio/horizon from a declared schedule. Reject undefined reliability or a horizon outside validated support.
5. Generate recursive chunks without future observations. Compute priorities and weights, validate finite normalizers and log effective p_iw_i.
6. Update policy with declared token/action likelihoods and grounded/imagined objectives. Evaluate on untouched episodes, including proxy exploitation and deadline/failure outcomes.

[DERIVED] Imagined computation scales with candidate count, horizon and simulator generation cost; it is not free because interaction count stays fixed. Retraining a simulator, residual predictor and proxy adds optimizer memory and synchronization. Their versions must be stored with each imagined batch.

## Implementation

[DERIVED] Distinguish action tokens used for policy ratios from continuous decoded commands consumed by the simulator. A ratio over token probabilities is not a ratio over decoded continuous densities. If a continuous flow policy lacks exact likelihoods, choose and justify another RL estimator rather than substituting its MSE. Log schedule units as primitive steps or action chunks explicitly.

[DERIVED] Visual goals require identity, acquisition time and task epoch. A background worker that returns an old subgoal after a task change must not overwrite a new goal. Multiview goals must share a scene/time interpretation. Physically impossible generated arrangements should trigger a declared reobserve/replan path, not blind low-level pursuit.

## Experimental design

### Reported experiments

[DERIVED] pi0.7's generated-subgoal workflow refreshes on subtask changes or a timer and runs asynchronously (R60.1, Sec.VII). This is distinct from candidate-action model search. The source subgoal branch is a separate14B generator using4H100s (AppendixA.D); a policy-only timing number excludes that resource path. The world-model branch also has its own learned generator and resource cost; policy-only latency cannot describe the complete hierarchy.

[DERIVED] Experiment60.4 proposes fixed-data versus interaction-matched policy updates with real-only, static-model, updated-model and trust variants. Pair horizons and sample counts, then separately compare complete compute. Evaluate task-aligned model errors, not only visual residuals.

## Observations

**What the paper claims.** [PAPER-REPORTED] Reliability-conditioned scheduling and replay can improve model-based VLA refinement under the tested shifts [R60.4].

**What the evidence shows.** [DERIVED] The source distinguishes paired and no-oracle scoring and bounds the physical proxy-only conclusion by overlapping intervals.

**What we infer.** [DERIVED] Estimated trust is another learned interface. It must be validated after policy/model changes and cannot certify physical correctness.

**What remains unknown.** [UNVERIFIED] Uniform model/proxy error bounds, broad task transfer and long-horizon safety remain unestablished.

## Failure modes

[DERIVED] Simulator hallucination, proxy exploitation, future-ground-truth leakage, stale reliability, rare-example suppression, double weighting, unnormalized replay and step/chunk confusion can produce apparent improvement. A successful image decoder can conceal hidden-state error. Fixed interaction budgets can hide enormous compute differences.

```figure
{
  "id": "fig-60.14",
  "kind": "compare",
  "title": "World-model interfaces require different evidence",
  "caption": "The same model name can expose one or several interfaces; test each exported contract.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.14",
  "alt": "The same model name can expose one or several interfaces; test each exported contract.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "goal",
        "label": "Subgoal"
      },
      {
        "id": "plan",
        "label": "Action-conditioned planner"
      },
      {
        "id": "learn",
        "label": "Imagined learning"
      }
    ],
    "rows": [
      {
        "dimension": "Query",
        "values": {
          "goal": "Desired future under instruction",
          "plan": "Future under candidate actions",
          "learn": "Generated training continuation"
        }
      },
      {
        "dimension": "Required check",
        "values": {
          "goal": "Reachability and low-level realization",
          "plan": "Action use and task ranking",
          "learn": "Proxy/model bias and policy exploitation"
        }
      },
      {
        "dimension": "Cost boundary",
        "values": {
          "goal": "Goal generator plus policy",
          "plan": "Search plus model plus controller",
          "learn": "Model updates plus imagination plus policy updates"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.chapter.59 supplies predictive sufficiency and finite-candidate bounds. @ms.section.60.3 defines RL likelihood/support requirements; @ms.section.60.5 tests dynamics shift; @ms.section.60.6 defines risk/coverage and authorization.

## Extensions

### Improvements and their evidence

[DERIVED] Increase imagined horizon only when held-out task-aligned errors and complete utility support it; reverse under deeper-error growth. Use reliability weights when policy utility improves at matched samples and compute; reverse when rare consequential states are suppressed. Add subgoal generation when realized progress and intervention burden improve; reverse when stale/unreachable goals dominate.

## Limitations

[DERIVED] Conditional proxy bounds do not establish policy improvement or convergence. A trust predictor can fail precisely on new imagined states. Fixed-data physical trials establish a bounded deployment result, not online physical RL or general autonomy.

## Reproducibility

[DERIVED] Save every simulator/proxy/trust/policy version, grounded/imagination split, actions, schedules, valid masks, weights, stage interactions and compute. Report not-reached thresholds and failure trajectories. No such experiment was executed here.

## References

[R60.4] MeRL, 2610.16517v1. [R60.1] pi0.7 subgoal interface. Exact locators and limits: @ms.references.60.
