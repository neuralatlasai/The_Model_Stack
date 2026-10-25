---
id: ms.section.59.6
entity_type: section
title: "Limitations and transfer"
volume: 3
part: 10
chapter: 59
section: 59.6
slug: 59-6-limitations-and-transfer
parent: ms.chapter.59
prev_sibling: ms.section.59.5
next_sibling: ms.verification.59
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

# 59.6 - Geometry, uncertainty, limitations and transfer

## Scope

[DERIVED] This section asks what connects a well-behaved latent distribution to a useful planning metric and what survives deployment shift. Marginal matching, relational preservation, predictive accuracy, calibration and physical task alignment are distinct requirements.

## Why this exists

[DERIVED] A planner compares distances between particular states. Matching an aggregate latent distribution does not fix which physical state maps to which point. A model can pass a global normality test while distorting neighborhoods used for novelty detection or goal selection.

## Intuition

[DERIVED] Relabel the points in a finite cloud: its marginal histogram stays unchanged while nearby physical states can become distant. An orthogonal rotation preserves Euclidean distances, but general measure-preserving remappings do not. The latter distinction is why a distributional constraint alone cannot supply a task metric.

## Formulation

[MATHEMATICALLY-DERIVED] Sliced transport regularization takes

$$
 \Omega_W(P)=\mathbb E_{u\sim Unif(S^{d-1})}W_2^2(P_u,\mathcal N(0,1)).
$$

_(Eq. 59.23)_

[DERIVED] Finite-batch evaluation projects, sorts and compares empirical quantiles with Gaussian quantile intervals. Exact interval integration differs from simply matching midpoint quantiles. With P directions and B samples, sorting costs O(PB logB) after O(BdP) projection. Finite P still misses untested directions; a batch objective cannot certify the population distribution. Finite-frequency matching and exact one-dimensional transport have different blind spots, not universal empirical dominance.

[MATHEMATICALLY-DERIVED] For standardized, scale-normalized pairwise distances D_z,D_p, a relational loss is

$$
 \Omega_R=n_{\rm states}^{-2}\sum_{i,j}(D_z(i,j)-\operatorname{sg}(D_p(i,j)))^2.
$$

_(Eq. 59.24)_

[DERIVED] Here $n_{\rm states}$ is the number of aligned states; the full ordered distance matrix has $n_{\rm states}^2$ entries. It is not the global parameter-count symbol $N$.

[DERIVED] Positive variance floors and mean-distance floors are needed for degenerate batches. Stop-gradient fixes the anchor during one update, not across training when a shared encoder changes. Pairwise memory is O(N squared); exact all-pairs work is quadratic in batch size. Sampling pairs changes the estimator.

[MATHEMATICALLY-DERIVED] If predicted candidate costs differ from an anchor cost by at most epsilon_plan, and the anchor differs from task cost by at most epsilon_anchor, Eq.59.17 gives

$$
 J_{task}(\hat i)-\min_iJ_{task}(i)\leq2(\epsilon_{plan}+\epsilon_{anchor}).
$$

_(Eq. 59.25)_

[DERIVED] The second assumption is indispensable. Relational preservation can protect a bad anchor perfectly. A finite-candidate bound does not certify a continuous optimizer or safety outside the candidate pool.

[MATHEMATICALLY-DERIVED] For an event forecast q and outcome y in{0,1}, proper-score evaluation can use

$$
 \operatorname{Brier}=n^{-1}\sum_j(q_j-y_j)^2,\qquad
 \widehat R(\tau)=\frac{\sum_j\mathbf1[u_j\leq\tau]\ell_j}{\sum_j\mathbf1[u_j\leq\tau]},
 \quad\sum_j\mathbf1[u_j\leq\tau]>0.
$$

_(Eq. 59.26)_

[DERIVED] The latter is selected risk at a fixed uncertainty threshold, not a certificate unless selection and confidence procedures justify one. An ensemble variance or kNN distance is a score, not a calibrated error probability. Tune on validation and assess final thresholds on untouched test episodes; distribution shift can invalidate calibration.

```figure
{
  "id": "fig-59.18",
  "kind": "diagram",
  "title": "A complete decision bound needs task alignment",
  "caption": "Marginal statistics, relationships, prediction and task cost constrain different gaps. A guarantee at one interface does not remove the others.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.18",
  "alt": "Marginal statistics, relationships, prediction and task cost constrain different gaps. A guarantee at one interface does not remove the others.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "m",
        "kind": "state",
        "label": "Marginal distribution"
      },
      {
        "id": "r",
        "kind": "state",
        "label": "State relationships"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Predicted candidate costs"
      },
      {
        "id": "a",
        "kind": "branch",
        "label": "Anchor ranking"
      },
      {
        "id": "t",
        "kind": "node",
        "label": "Physical task cost"
      }
    ],
    "edges": [
      {
        "from": "m",
        "to": "p",
        "kind": "flow",
        "label": "scale/nondegeneracy"
      },
      {
        "from": "r",
        "to": "a",
        "kind": "flow",
        "label": "geometry"
      },
      {
        "from": "p",
        "to": "a",
        "kind": "flow",
        "label": "prediction gap"
      },
      {
        "from": "a",
        "to": "t",
        "kind": "flow",
        "label": "task-alignment gap"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] ATLAS combines projected Wasserstein matching with relational transfer from mean-pooled encoder patches. Its TwoRoom higher-novelty success is41.2% for LeWM and61.0% for ATLAS; these are median-split expert-path novelty subsets, not independently sampled new domains. Goals are drawn from all valid episodes, not a held-out test split. Five evaluation seeds share training seed3072. WEMReg alone lowers Cube success48.1% to 46.9%, and broader baseline dominance is absent. Its task-cost corollary requires anchor/task alignment in addition to geometry/prediction conditions. [R59.9, Table 1; AppendicesA/C.9]

[DERIVED] This is useful evidence for a representation bottleneck under the stated harness, while leaving independent training variance, episode leakage sensitivity and true domain transfer unresolved. A novelty score based on privileged expert paths can define an evaluation stratum; it cannot be silently used as an online deployable OOD detector.

```figure
{
  "id": "fig-59.19",
  "kind": "compare",
  "title": "Different shifts need different tests",
  "caption": "A within-corpus novelty stratum and a deployment change answer different questions.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.19",
  "alt": "A within-corpus novelty stratum and a deployment change answer different questions.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "split",
        "label": "Split"
      },
      {
        "id": "claim",
        "label": "Supported comparison"
      },
      {
        "id": "remaining",
        "label": "Remaining uncertainty"
      }
    ],
    "rows": [
      {
        "dimension": "Novelty median",
        "values": {
          "split": "Same valid episode pool",
          "claim": "Relative performance on harder stratum",
          "remaining": "New domain and leakage sensitivity"
        }
      },
      {
        "dimension": "Held-out episodes",
        "values": {
          "split": "Disjoint trajectories",
          "claim": "Within-environment generalization",
          "remaining": "Dynamics/sensor change"
        }
      },
      {
        "dimension": "Held-out dynamics",
        "values": {
          "split": "New friction/mass/delay",
          "claim": "Specified intervention shift",
          "remaining": "Unmodeled physical effects"
        }
      },
      {
        "dimension": "Physical deployment",
        "values": {
          "split": "Real sensors/actuators",
          "claim": "Tested system behavior",
          "remaining": "Rare conditions and long-term drift"
        }
      }
    ]
  }
}
```

[PAPER-REPORTED] V-JEPA Policy freezes a pretrained V-JEPA2.1 encoder and trains future queries plus a flow action expert. Layerwise context key/value states, updated by bidirectional interaction with future queries, condition actions. Future prediction is conditioned on observations, language and proprioception, not the candidate action sequence. DROID pretraining omits action labels but still uses embodied video/language/state. Real-task success improves from 55/35% to 75/85% with predictor pretraining in 20 trials/task; successful-only durations and differently tuned baselines do not establish equal-compute, all-attempt efficiency. [R59.8, Sec. 3; Tables3/8; implementation appendix]

[DERIVED] This connects predictive representations to policy transfer without claiming a general counterfactual simulator. Inference may need only feature conditioning; adding a planning interface is justified only when candidate-action queries are actually trained and validated.

## Algorithm

### Algorithm 59.6 — Validate a deployment trust region

[DERIVED] Inputs: frozen model/policy, training feature bank, held-out shifts, fixed task costs, monitor family and deadline. Output: a declared operating region and fallbacks, not a universal safety certificate.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad(\mathcal B,\xi)\leftarrow\operatorname{FitMonitor}(\mathcal D_{\rm train/val});
\quad\operatorname{freeze}(E,P,\mathcal B,\xi);\\
2.&\quad j=1,\ldots,J_{\max}:\quad r_j\leftarrow\operatorname{Regime}(j),
\quad u_j\leftarrow\operatorname{Monitor}(h_j;\mathcal B,\xi);\\
3.&\quad a_j\leftarrow\begin{cases}\operatorname{Plan}(h_j),&u_j\le\xi\land\operatorname{DeadlineValid},\\
\operatorname{DeclaredFallback}(h_j),&\text{otherwise};\end{cases}\\
4.&\quad\mathcal L_j\leftarrow(\mathrm{prediction},\mathrm{ranking},\mathrm{closed\ loop},
\mathrm{latency},\mathrm{failure})\text{ under the complete policy};\\
5.&\quad\operatorname{return}(\operatorname{ValidatedRegion}(\{r_j,\mathcal L_j\}),
\mathrm{unresolved\ shifts});\quad r'\ne r\Rightarrow\mathrm{revalidate}.
\end{aligned}
$$

1. Separate episode, appearance, dynamics, action-support and sensor-timing shifts; retain joint-shift cases.
2. Fit feature-bank statistics/monitor thresholds on training/validation only; label privileged diagnostic scores separately from deployable scores.
3. Evaluate fresh prediction, fixed-bank ranking and closed-loop outcomes at each horizon. Include model-search exploitability and deadline misses.
4. Calibrate event readouts on held-out episodes; report proper scores and risk/coverage by consequential subgroup.
5. Predeclare shorten-horizon, reobserve, fallback and abstain conditions. Evaluate the complete selected policy including monitor/fallback cost.
6. Freeze thresholds and test untouched shifts. A violated assumption invalidates the associated guarantee rather than triggering an unsupported confidence claim.

[DERIVED] A bank kNN query can require O(Md) brute-force work for M bank entries; approximate indexes trade recall for latency. Evaluate that approximation's effect on monitor decisions. Ensembles multiply model work unless sharing is explicitly implemented. Resource and interaction budgets include monitor, fallback, reset and failed attempts.

## Implementation

[DERIVED] Store bank provenance and normalizers with the encoder hash. Updating an encoder invalidates old distance thresholds unless revalidated. A relational anchor detached during training is not frozen through an entire run. A monitor using future expert-path states is evaluation-only. A deployed policy's future-conditioned features must not consume teacher future tokens; training target availability and inference query availability are different.

[DERIVED] OOD score inversion is possible: an unfamiliar but harmless texture can score high, while a familiar-looking dangerous contact scores low. Calibration must target a declared outcome and horizon. A low monitor score does not establish support coverage or a causal model. Deployment fallbacks require their own assumptions and may fail under the same shift.

## Experimental design

### Reported experiments

[DERIVED] The ATLAS case controls objective changes within a harness, while the V-JEPA Policy case studies predictive-feature transfer. Neither proves sim-to-real causal invariance. Their strengths and supervision/input differences should determine experiments, not be averaged into a ranking.

[DERIVED] Experiment59.3 adds held-out friction, latency and actuator scaling; Experiment59.4 compares readout/benchmark/control correlation. A complete transfer report needs independent model seeds, untouched episode splits and all-attempt resource costs. Explicitly report a failed transfer instead of restricting results to familiar successful conditions.

## Observations

**What the paper claims.** [PAPER-REPORTED] ATLAS proposes relational preservation alongside marginal matching; V-JEPA Policy proposes future-informed context conditioning for actions [R59.8,R59.9].

**What we infer.** [DERIVED] Marginal matching does not fix relational geometry; relational geometry does not fix task alignment; calibration does not survive arbitrary shift.

**What the evidence shows.** [DERIVED] Current sources offer controlled objective improvements and policy transfer with meaningful denominator and supervision limits.

**Engineering consequence.** [DERIVED] Freeze encoder/bank/monitor identity and evaluate the complete decision path, including abstention/fallback/deadline costs.

**What remains unknown.** [UNVERIFIED] Task-aligned uncertainty, robust action-support extrapolation and reliable transfer to contact-rich changing environments remain unresolved.

## Failure modes

[DERIVED] Correlated seed reuse, within-corpus goals called test transfer, future-path OOD scores called deployable, reused calibration thresholds, successful-only timings and privileged feature leakage can each invalidate a conclusion. A calibrated event model can still be insufficient for an unmeasured consequence.

```figure
{
  "id": "fig-59.20",
  "kind": "compare",
  "title": "Decisions and reversal conditions",
  "caption": "These are proposed operating rules requiring held-out validation, not source-reported policies.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.20",
  "alt": "These are proposed operating rules requiring held-out validation, not source-reported policies.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "choose",
        "label": "Choose"
      },
      {
        "id": "evidence",
        "label": "Required evidence"
      },
      {
        "id": "reverse",
        "label": "Reverse when"
      }
    ],
    "rows": [
      {
        "dimension": "Longer rollout",
        "values": {
          "choose": "Extend H",
          "evidence": "Ranking and deadline utility improve",
          "reverse": "Uniform errors or stale observations grow"
        }
      },
      {
        "dimension": "Relational objective",
        "values": {
          "choose": "Preserve anchor geometry",
          "evidence": "Task-aligned ranking improves",
          "reverse": "Anchor preserves wrong distinctions"
        }
      },
      {
        "dimension": "Monitor",
        "values": {
          "choose": "Gate model decisions",
          "evidence": "Selected risk and coverage validate",
          "reverse": "Shift breaks calibration"
        }
      },
      {
        "dimension": "Feature policy",
        "values": {
          "choose": "Condition policy on predicted context",
          "evidence": "All-attempt task utility improves",
          "reverse": "Candidate planning is required but unavailable"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.chapter.60 operationalizes actuation and simulation transfer; @ms.chapter.52 supplies agent-level decision principles; @ms.chapter.42 and @ms.chapter.48 supply evaluation and deployment evidence boundaries. @ms.chapter.63 develops the broader assurance connection when available.

## Extensions

### Improvements and their evidence

[DERIVED] Adopt relational preservation when its anchor supports task-aligned ranking under held-out shifts; reverse on anchor mismatch or collapsed batch geometry. Use future-feature policies when their complete-task utility improves; add action-conditioned planning only after an intervention interface is validated. Use uncertainty gating when untouched selected-risk/coverage improves after monitor costs; reverse if new domains invalidate calibration.

## Limitations

[DERIVED] Finite-candidate theorems are conditional statements, not empirical certificates for neural world models. Novelty subsets, simulator interventions and short physical studies each leave different gaps. No inspected source resolves all of them.

## Reproducibility

[DERIVED] Archive model/bank/monitor hashes, training and evaluation seed hierarchy, split source, thresholds, shift parameters, all attempted trajectories and complete timing boundaries. Preserve negative transfers and undefined metrics. The chapter supplies no executed deployment result.

## References

[R59.8] V-JEPA Policy, 2609.37250v2, Sec. 3; Tables3/8. [R59.9] ATLAS, 2609.36333v2, Secs. 3-5 and AppendicesA-C. Exact scope: @ms.references.59.
