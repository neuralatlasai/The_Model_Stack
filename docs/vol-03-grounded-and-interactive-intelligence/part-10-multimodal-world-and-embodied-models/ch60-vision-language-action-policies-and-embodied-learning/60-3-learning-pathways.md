---
id: ms.section.60.3
entity_type: section
title: "Learning pathways"
volume: 3
part: 10
chapter: 60
section: 60.3
slug: 60-3-learning-pathways
parent: ms.chapter.60
prev_sibling: ms.section.60.2
next_sibling: ms.section.60.4
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

# 60.3 - Learning pathways

## Scope

[DERIVED] Demonstration learning, offline/online RL, mixed-quality training, residual policies and execution compensation learn from different signals and induce different deployment distributions. This section specifies their objectives and access assumptions rather than treating post-training as a single procedure.

## Why this exists

[DERIVED] A policy trained only on expert states encounters its own errors at deployment. Offline RL can extrapolate unsupported actions, while online RL incurs interaction/reset costs. A residual or small adapter limits parameter changes but does not guarantee small physical effects. Reusing robot rollouts as context or pseudo-labels changes evaluation independence.

## Intuition

[DERIVED] Learning what an expert did is different from learning what succeeds after an error. A mixed dataset can teach both good and bad behavior; quality labels/context can help distinguish them, but prompting high quality does not enforce it. A measured tracking residual can be useful supervision without revealing whether the intended task was correct.

## Formulation

[MATHEMATICALLY-DERIVED] Behavior cloning minimizes

$$
 \mathcal L_{BC}=\mathbb E_{(h,\ell,a)\sim D}[-\log\pi_\theta(a|h,\ell)].
$$

_(Eq. 60.9)_

[DERIVED] Use categorical probabilities for tokens; a continuous flow matching loss is a different estimator/objective unless a likelihood relation is established. Mixture sampling weights change the training distribution. Dataset size alone does not describe independent episodes, tasks or embodiments.

[MATHEMATICALLY-DERIVED] With per-step error probability at most epsilon while the learned and expert histories still agree, bounded per-step excess cost at most1 and horizon T,

$$
 \mathbb E[\text{excess cumulative cost}]\leq\sum_{t=1}^T\min(1,t\epsilon)\leq\epsilon T(T+1)/2.
$$

_(Eq. 60.10)_

[DERIVED] This union-bound illustration explains compounding; it is not a measured failure rate or a universal exact scaling law. Recovery behavior, stochastic dynamics and different cost assumptions change the bound. Interactive correction can expose off-expert states but requires a data-collection policy and access budget.

[MATHEMATICALLY-DERIVED] A likelihood-ratio policy gradient needs

$$
 \nabla J(\theta)=\mathbb E_{\tau\sim\pi_\theta}\sum_t\nabla\log\pi_\theta(a_t|h_t)A_t,
 \quad r_t=\pi_\theta(a_t|h_t)/\pi_{old}(a_t|h_t).
$$

_(Eq. 60.11)_

[DERIVED] The identity needs differentiability/integrability and actions sampled from the stated policy. Ratios require positive old-policy support. A denoising MSE or variational lower bound is not automatically the exact continuous log-density, so substituting it into r_t needs a separate justification. Offline ratios over long histories can have severe variance and cannot repair zero support.

[MATHEMATICALLY-DERIVED] With aligned normalized commanded/achieved displacements, an execution pseudo-target can be

$$
 \eta=\Delta x-a,\quad a^{target}=a-\eta,\quad
 \mathcal L_{adapt}=\mathcal L_{flow}(a^{target})+\lambda\|\phi-\phi_0\|^2.
$$

_(Eq. 60.12)_

[DERIVED] The residual arrives after execution and cannot correct the past command. A parameter anchor limits adapter distance, not action norm or task risk. In a scalar actuator y=g a, repeating the direct correction target gives a_new=(2-g)a; it need not solve the desired tracking problem, especially with delay, sign errors or saturation.

```figure
{
  "id": "fig-60.9",
  "kind": "diagram",
  "title": "Different supervision routes",
  "caption": "Task outcomes, expert actions and tracking residuals supervise different quantities. Their costs and failure modes must remain separate.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.9",
  "alt": "Task outcomes, expert actions and tracking residuals supervise different quantities. Their costs and failure modes must remain separate.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "demo",
        "kind": "dataset",
        "label": "Demonstrations"
      },
      {
        "id": "bc",
        "kind": "objective",
        "label": "Imitation loss"
      },
      {
        "id": "env",
        "kind": "state",
        "label": "Grounded interaction"
      },
      {
        "id": "rl",
        "kind": "objective",
        "label": "Return/advantage"
      },
      {
        "id": "res",
        "kind": "metric",
        "label": "Execution residual"
      },
      {
        "id": "adapt",
        "kind": "objective",
        "label": "Adapter pseudo-target"
      }
    ],
    "edges": [
      {
        "from": "demo",
        "to": "bc",
        "kind": "flow",
        "label": "action labels"
      },
      {
        "from": "env",
        "to": "rl",
        "kind": "flow",
        "label": "outcome labels"
      },
      {
        "from": "env",
        "to": "res",
        "kind": "flow",
        "label": "aligned measured motion"
      },
      {
        "from": "res",
        "to": "adapt",
        "kind": "flow",
        "label": "future updates"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] pi0.7 combines subtask instructions, generated subgoals, episode quality/speed/mistake metadata and action-mode identifiers, with component dropout and mixed data including autonomous/suboptimal episodes. Continuous-expert gradients are insulated from the discretely supervised backbone. More lower-quality data can degrade the no-metadata control. Some novel long tasks are coached; autonomous high-level policies subsequently learn from coaching episodes. Those are different data-access conditions, not one zero-shot autonomy result. [R60.1, Secs.III/V/IX]

[DERIVED] Offline value learning needs a transition/reward dataset and a support strategy. Conservatism can limit overestimation but may discard useful actions; it does not create absent outcomes. Online learning needs exploration, resets, intervention policy and outcome detection. A task-success classifier is another learned component and can be exploited. Residual RL can preserve a base prior while optimizing corrections, but its boundedness must be enforced in action space if required.

[PAPER-REPORTED] Self-compensating VLA updates rank4 action-expert adapters from execution pseudo-targets plus an anchor. In simulation its mean direct residual-correction baseline is23.6% versus41.7% base and44.2% learned compensation. Physical evaluation retains adapters, Adam state and feedback across 25consecutive episodes per task, resetting at task boundaries; the evaluated episodes also supply adaptation data. It is online adaptation performance, not independent frozen-policy trials. Physical joint residuals exclude the gripper and use a different coordinate construction from the simulator's delta-pose case. [R60.6, Sec. 3; Table 4; AppendixB.6]

```figure
{
  "id": "fig-60.10",
  "kind": "compare",
  "title": "Learning access must be counted",
  "caption": "Each pathway has a different data and deployment contract.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.10",
  "alt": "Each pathway has a different data and deployment contract.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "im",
        "label": "Imitation"
      },
      {
        "id": "off",
        "label": "Offline RL"
      },
      {
        "id": "on",
        "label": "Online/residual adaptation"
      }
    ],
    "rows": [
      {
        "dimension": "Signal",
        "values": {
          "im": "Demonstrated actions",
          "off": "Recorded transitions/outcomes",
          "on": "New outcomes or tracking residuals"
        }
      },
      {
        "dimension": "Access cost",
        "values": {
          "im": "Teleoperation and annotation",
          "off": "Coverage and reward labeling",
          "on": "Interactions, resets and intervention"
        }
      },
      {
        "dimension": "Key failure",
        "values": {
          "im": "Off-expert states",
          "off": "Unsupported value extrapolation",
          "on": "Unsafe exploration or biased feedback"
        }
      },
      {
        "dimension": "Evaluation",
        "values": {
          "im": "Frozen held-out policy",
          "off": "Frozen policy with support audit",
          "on": "Chronological adaptive sequence plus frozen control"
        }
      }
    ]
  }
}
```

## Algorithm

### Algorithm 60.3 — Separate learning, adaptation and evaluation state

[DERIVED] Inputs: episode records, training pathway, feedback permissions, policy/optimizer state and a simulation-only evaluation schedule. Output: reproducible learning/evaluation phases.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad(\mathcal D_{\rm train},\mathcal D_{\rm val},\mathcal D_{\rm test})
\leftarrow\operatorname{SplitByEpisodeTaskEmbodiment}(\mathcal D);\\
2.&\quad s_0\leftarrow(\theta_0,\mathrm{optimizer}_0,\mathrm{buffer}_0,\mathrm{epoch}_0);\\
3.&\quad k=0,\ldots,U_{\max}-1:\quad
\mathcal F_k\leftarrow\operatorname{FeedbackWithValidCommandIDs};\\
4.&\quad s_{k+1}\leftarrow\operatorname{AllowedUpdate}(s_k,\mathcal F_k);
\quad\operatorname{UpdateChecksFail}\Rightarrow\operatorname{return}(\mathrm{rejected\ update});\\
5.&\quad\widehat\theta_{k+1}\leftarrow\operatorname{AtomicSnapshot}(s_{k+1});
\quad\mathrm{reset\ boundary}\Rightarrow s\leftarrow\operatorname{DeclaredReset}(s);\\
6.&\quad\operatorname{return}(\mathrm{frozen/adaptive\ test\ results},
\mathrm{carryover\ policy},\mathrm{all\ attempt/update\ records}).
\end{aligned}
$$

1. Partition by episode/task/embodiment as required. Fit normalizers and mixture weights without test leakage.
2. Declare the training signal and all privileged inputs: action labels, success labels, simulator state, counterfactual rollouts or measured residuals.
3. Freeze a base checkpoint and an equal-budget control. For RL, specify action likelihood/objective support rather than substituting a convenient surrogate silently.
4. For adaptation, align feedback to issued command IDs and retain only finite valid targets. Apply bounded updates and record policy/optimizer/buffer epochs.
5. Evaluate frozen and adaptive protocols separately. Declare state carry-over and whether evaluation interactions also train the policy.
6. Count every attempt, reset, intervention, update and rejected feedback item. Reinitialize exactly at the declared boundaries.

[DERIVED] Small adapters reduce optimizer-state memory but the backbone forward and action generation may still dominate work. Online update cadence can contend with inference for device resources. A separate update worker needs immutable model versions at prediction boundaries; it cannot alter tensors mid-query.

## Implementation

[DERIVED] Detach pseudo-target construction so a model cannot reduce the loss by changing its own target through the wrong gradient path. Record physical scale before residual subtraction. Use SO(3) logs or joint coordinates consistently and retain controller-side corrections separately. A residual can reflect contact, observation delay or desired intentional compliance, so aggressive cancellation is not always appropriate.

[DERIVED] Mixture sampling should expose per-source effective counts, not just raw hours. Closely repeated trajectories inflate frame counts without comparable behavioral diversity. Human-video pretraining can improve representations while lacking a robot action interface. Any mapping from human motion to robot commands brings retargeting/calibration assumptions.

## Experimental design

### Reported experiments

[DERIVED] The retained source cases distinguish mixed-quality context training from online execution compensation. Their improvements use different feedback, interaction and annotation budgets and cannot be compared as one post-training ranking.

[DERIVED] Experiment60.3 proposes matched imitation/offline/residual/compensation arms, separating frozen evaluation from chronological adaptation. Evaluate reset frequency, changing payload, delayed feedback, task performance and safety-relevant failure severity. Preserve the direct-correction negative rather than assuming a residual signal must help.

## Observations

**What the paper claims.** [PAPER-REPORTED] Rich context can exploit mixed-quality data; execution residuals can train robot-specific compensation [R60.1,R60.6].

**What the evidence shows.** [DERIVED] The sources expose a lower-quality-data negative and a failed direct-correction control, with explicit adaptive episode carry-over.

**What we infer.** [DERIVED] Label learning signals and chronology before attributing generalization or adaptation gains. Parameter-efficient updates do not certify safe physical changes.

**What remains unknown.** [UNVERIFIED] Robustness to feedback faults, prolonged drift and unseen contact consequences is not established by these bounded studies.

## Failure modes

[DERIVED] Unsupported actions, inaccurate rewards, false task labels, future outcome metadata in deployment inputs, stale feedback, coordinate mismatch, unbounded adapter influence and evaluation/training leakage can invalidate conclusions. Online adaptation can improve one arm/task while forgetting another. Resetting only parameters but retaining optimizer/buffer state is not a reset.

```figure
{
  "id": "fig-60.11",
  "kind": "compare",
  "title": "A result needs a chronology",
  "caption": "Frozen and adaptive evaluations estimate different system behaviors.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.11",
  "alt": "Frozen and adaptive evaluations estimate different system behaviors.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "frozen",
        "label": "Frozen test"
      },
      {
        "id": "adaptive",
        "label": "Adaptive sequence"
      }
    ],
    "rows": [
      {
        "dimension": "State",
        "values": {
          "frozen": "Policy fixed across trials",
          "adaptive": "Policy/optimizer/buffer evolve"
        }
      },
      {
        "dimension": "Uncertainty",
        "values": {
          "frozen": "Independent episodes if resets justify it",
          "adaptive": "Temporal dependence and warm-up effects"
        }
      },
      {
        "dimension": "Required record",
        "values": {
          "frozen": "Checkpoint and reset state",
          "adaptive": "Every update, feedback item and episode order"
        }
      },
      {
        "dimension": "Reversal condition",
        "values": {
          "frozen": "Held-out utility fails",
          "adaptive": "Drift, severity or adaptation cost exceeds gain"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.chapter.24 supplies RL foundations; @ms.chapter.34 through @ms.chapter.36 supply post-training/adaptation context. @ms.section.60.4 studies model-generated training data; @ms.section.60.5 tests physical mismatch.

## Extensions

### Improvements and their evidence

[DERIVED] Use quality conditioning when held-out context interventions improve utility, reversing when metadata merely leaks outcomes or reduces robustness. Use residual RL when support and correction bounds validate. Use execution adaptation when chronological gains exceed severity/intervention/update costs; reverse under delayed or confounded residuals. Keep a rollback checkpoint and a frozen comparator.

## Limitations

[DERIVED] No pathway removes the need for valid feedback and action support. A finite trial sequence does not establish long-term adaptation stability. Counterfactual improvement cannot be inferred from successful demonstrations alone.

## Reproducibility

[DERIVED] Publish mixture weights, effective episode counts, all labels, action probabilities/objectives, optimizer states, update cadence, intervention/reset logs and trial chronology. No book learning experiment was run.

## References

[R60.1] pi0.7, 2604.15483v2. [R60.6] Self-compensating VLA, 2609.37334v1. Exact methods and negative findings: @ms.references.60.
