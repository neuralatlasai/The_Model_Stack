---
id: ms.section.60.5
entity_type: section
title: "Simulation and transfer"
volume: 3
part: 10
chapter: 60
section: 60.5
slug: 60-5-simulation-and-transfer
parent: ms.chapter.60
prev_sibling: ms.section.60.4
next_sibling: ms.section.60.6
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

# 60.5 - Simulation and transfer

## Scope

[DERIVED] Simulation controls interventions cheaply, but transfer depends on sensor, action, dynamics and reset fidelity. Domain randomization, system identification and deployable-state interfaces address different parts of this mismatch. None supplies a universal sim-to-real guarantee.

## Why this exists

[DERIVED] A policy can solve a simulator by exploiting its contact solver, reset state, privileged observation or unrealistically prompt feedback. Randomizing textures does not repair incorrect friction or hidden actuator delay. Matching task success in simulation does not establish that failure severity or recovery will transfer.

## Intuition

[DERIVED] A residual controller trained on object pose avoids some pixel-domain differences, but depends on the real pose estimator and base policy behaving as assumed. A confidently wrong tracker can turn a corrective residual into an error amplifier. Matching command labels across sim/real datasets is helpful evidence, not equality of their closed-loop state distributions.

## Formulation

[MATHEMATICALLY-DERIVED] A randomized training objective is

$$
 \max_\pi\mathbb E_{\theta\sim p_{train}}J(\pi;\theta),
$$

_(Eq. 60.17)_

[DERIVED] theta can include mass, friction, latency, gains, sensor errors and initial state. An average over p_train does not bound the worst case or an unseen deployment distribution. Wider randomization can increase coverage while making the task unlearnable or encouraging overly cautious behavior.

[MATHEMATICALLY-DERIVED] A local identification problem is

$$
 \hat\theta=\arg\min_\theta\sum_t\|y_{t+1}-f_\theta(y_t,u_t)\|_W^2,
 \qquad\operatorname{rank}\left(\frac{\partial(f_\theta)_t}{\partial\theta}\right)_{t\in D}=\dim\theta.
$$

_(Eq. 60.18)_

[DERIVED] Full column rank is a sufficient first-order regular local-identification condition for a differentiable observation map, not a necessary condition for every locally injective model or a global uniqueness theorem. For example, the scalar map $y=\theta^3$ is injective near $\theta=0$ although its derivative there is zero; its inverse is nonregular at that point. Measurement noise, unobserved state and model misspecification can bias estimates. Excitation, train/validation trajectories and uncertainty intervals matter. Do not tune physical parameters against the final transfer score and call that an independent test.

[MATHEMATICALLY-DERIVED] If transition and policy perturbations satisfy local Lipschitz bounds,

$$
 e_{t+1}\leq(L_s+L_aL_\pi)e_t+L_a\epsilon_{obs}+\epsilon_{dyn}.
$$

_(Eq. 60.19)_

[DERIVED] Here e is a common-state discrepancy, $\epsilon_{obs}$ bounds the action-space command error induced by observation noise, and epsilon_dyn is residual dynamics mismatch. If raw sensor error is bounded by $\epsilon_{sensor}$ and the policy is $L_\pi$-Lipschitz in that observation metric, use $\epsilon_{obs}\le L_\pi\epsilon_{sensor}$; omitting that conversion would mix state and action units. The coefficient can exceed1; small pose error alone does not establish small trajectory error. The state/action metric and validity region must be shared across domains. Contact discontinuities may violate the local assumptions.

[MATHEMATICALLY-DERIVED] For failure-severity loss L and confidence level alpha in(0,1), upper-tail CVaR is

$$
 \operatorname{CVaR}_\alpha(L)=\inf_\eta\left[\eta+\frac{\mathbb E(L-\eta)_+}{1-\alpha}\right].
$$

_(Eq. 60.20)_

[DERIVED] This is a tail-risk functional, not another name for success rate. Estimating extreme tails requires enough independent trials. A severity proxy must have a physically meaningful definition and calibrated units; a simulator contact-constraint scalar does not automatically measure real contact force.

```figure
{
  "id": "fig-60.15",
  "kind": "diagram",
  "title": "Transfer has several coupled gaps",
  "caption": "A shared pose vector reduces one sensor gap but does not eliminate base-policy, dynamics, timing or reset mismatch.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.15",
  "alt": "A shared pose vector reduces one sensor gap but does not eliminate base-policy, dynamics, timing or reset mismatch.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "sim",
        "kind": "state",
        "label": "Simulation"
      },
      {
        "id": "sens",
        "kind": "boundary",
        "label": "Sensor/pose gap"
      },
      {
        "id": "act",
        "kind": "boundary",
        "label": "Action/base-policy gap"
      },
      {
        "id": "dyn",
        "kind": "boundary",
        "label": "Dynamics and timing gap"
      },
      {
        "id": "real",
        "kind": "state",
        "label": "Physical system"
      }
    ],
    "edges": [
      {
        "from": "sim",
        "to": "sens",
        "kind": "flow",
        "label": "render/estimate"
      },
      {
        "from": "sens",
        "to": "act",
        "kind": "flow",
        "label": "same schema"
      },
      {
        "from": "act",
        "to": "dyn",
        "kind": "flow",
        "label": "execute"
      },
      {
        "from": "dyn",
        "to": "real",
        "kind": "flow",
        "label": "closed-loop consequences"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] Object-centric residual RL replays task teleoperation in simulation, trains a sim counterpart to the real base VLA, and learns a TD3 residual using object poses, proprioception and base actions. Pose noise/dropout train robustness; deployment uses tracked poses. Five FR3 tasks report42% to 76% real success,20 trials/task; simulation SDs use three seeds, while real counts have no independent-training SD. Its zero-shot qualifier applies to residual transfer, not absence of task demonstrations/simulator construction. Reported failures include wrong or drifting poses passing the confidence gate. [R60.5, Secs. 3-5; Table 1; AppendicesA.6/A.11]

[DERIVED] Its stated small-noise transfer condition is an assumption to test. Proprioception, base-policy outputs and contact dynamics are not guaranteed domain invariant by construction. A manually chosen task-object set and pose model are additional supervision/engineering costs. A dropout vector can coincide with a valid physical zero unless accompanied by an explicit validity convention.

```figure
{
  "id": "fig-60.16",
  "kind": "compare",
  "title": "Randomization and identification answer different questions",
  "caption": "Use held-out perturbations to test coverage rather than assuming a chosen distribution contains reality.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.16",
  "alt": "Use held-out perturbations to test coverage rather than assuming a chosen distribution contains reality.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "id",
        "label": "Identification"
      },
      {
        "id": "rand",
        "label": "Randomization"
      },
      {
        "id": "adapt",
        "label": "Adaptation"
      }
    ],
    "rows": [
      {
        "dimension": "Purpose",
        "values": {
          "id": "Estimate parameters from motion",
          "rand": "Train across parameter variation",
          "adapt": "Change behavior from deployment feedback"
        }
      },
      {
        "dimension": "Needs",
        "values": {
          "id": "Informative observations/excitation",
          "rand": "Plausible distribution and budget",
          "adapt": "Valid aligned feedback and update rules"
        }
      },
      {
        "dimension": "Risk",
        "values": {
          "id": "Unidentifiable/misspecified model",
          "rand": "Missing rare coupled changes",
          "adapt": "Unsafe drift or confounded residual"
        }
      }
    ]
  }
}
```

## Algorithm

### Algorithm 60.5 — Simulation-first transfer audit

[DERIVED] Inputs: task/controller model, demonstrations, candidate physical parameters, sensor models and a held-out perturbation matrix. Output: bounded transfer evidence and unresolved gaps.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad\operatorname{SchemaClockValid}=0\Rightarrow\operatorname{return}(\mathrm{invalid});\\
2.&\quad\widehat\theta\leftarrow\operatorname{FitDynamics}_{u\le U_{\max}}(\mathcal D_{\rm train});
\quad\mathcal T\leftarrow\operatorname{UnresolvedParameterSet}(\mathcal D_{\rm val});\\
3.&\quad\pi\leftarrow\operatorname{Train}_{u\le U_{\rm policy}}
(p_{\rm train}(\theta),\mathcal D_{\rm train});\quad\operatorname{freeze}(\pi);\\
4.&\quad j=1,\ldots,n_{\rm tests}:\quad
s_j\leftarrow\operatorname{ResetAll}(\mathrm{simulator,controller,policy,queue,RNG});\\
5.&\quad\mathcal L_j\leftarrow\operatorname{Evaluate}_{t\le T_{\max}}
(\pi,s_j,\theta_j^{\rm heldout},\mathrm{sensor\ shift}_j);\\
6.&\quad\operatorname{return}(\{\mathcal L_j\},\mathcal T,
\mathrm{all\ failures/resets},\mathrm{simulation\ scope}).
\end{aligned}
$$

1. Validate action/state schemas and time alignment before fitting dynamics. Record simulator engine, integrator, contact settings and controller gains.
2. Fit identifiable parameters on training trajectories; quantify residuals on different validation motions. Preserve unidentifiable parameter ranges rather than choosing a convenient point.
3. Define randomization over plausible joint parameter changes, with separate marginal and coupled-shift cases. Keep final test values untouched.
4. Train only with deployable observations or explicitly record teacher-student privilege and distillation cost. Test the real estimator's noise, dropout and confident-error modes.
5. Reset policy/optimizer/queue, simulator hidden state, contact memory and random generators according to the declared protocol.
6. Evaluate all attempts for task success, severity, recovery, tracking, latency and intervention burden. A physical stage requires separate system-specific validation and authorization after these results exist.

[DERIVED] Simulation throughput must count actual physics steps, control steps and policy queries separately. More parallel environments alter observation/replay correlations and memory. Engine-time speedups do not imply faster perception or policy inference.

## Implementation

[DERIVED] Randomize delays and sensor errors with temporal correlation where physically justified; IID action noise cannot represent backlash or thermal drift. Backlash needs history, compliance needs internal state, and gravity error depends on configuration/payload. Resetting only visible q leaves hidden simulator state that changes the next trial.

[DERIVED] The source self-compensation benchmark models friction, backlash, compliance and gravity errors at distinct controller stages, with explicit hidden-state resets (R60.6, Sec. 4; AppendixB). This is a more targeted stress test than generic Gaussian noise, but is still a model of particular error mechanisms. Validate measured motion before attributing an observed residual to one mechanism.

## Experimental design

### Reported experiments

[DERIVED] The object-centric source includes task-specific simulator/data construction, training hyperparameters and perception failures. These conditions are central to its transfer claim, not optional implementation details. Its tiny residual-MLP time excludes the complete pose/tracker/base-policy pipeline; no full-system speedup follows from that component time.

[DERIVED] Experiment60.3 proposes independent variations of mechanics, sensing and delay, including coupled shifts and stale trackers. Compare randomization, identification and bounded adaptation with matched interaction budgets. Report how often confidence gates admit wrong poses.

## Observations

**What the paper claims.** [PAPER-REPORTED] A deployable object-pose interface can transfer a simulation-trained residual without physical residual RL [R60.5].

**What the evidence shows.** [DERIVED] The source demonstrates five tasks with task-specific demonstrations/simulation and retains perception failures that bypass confidence.

**What we infer.** [DERIVED] Observation-space consistency is useful but not a dynamics, calibration or safety guarantee. Joint shifts and reset semantics require explicit tests.

**What remains unknown.** [UNVERIFIED] New object geometry, severe occlusion, changing contact models and long-duration wear are not resolved by these bounded results.

## Failure modes

[DERIVED] Unrealistic contact, weak excitation, test-tuned physics, privileged-state leakage, missing delay correlation, incomplete reset, wrong object identity and confidence miscalibration can defeat transfer. A successful task may still apply unacceptable forces. Averaging tasks can conceal a severe regression in one contact-rich condition.

```figure
{
  "id": "fig-60.17",
  "kind": "calculator",
  "title": "Observation age and unseen displacement",
  "caption": "A constant-speed kinematic component: displacement=v*tau. This is not a stopping-distance or collision guarantee and excludes acceleration and object-motion uncertainty.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-60.21",
  "alt": "A constant-speed kinematic component: displacement=v*tau. This is not a stopping-distance or collision guarantee and excludes acceleration and object-motion uncertainty.",
  "spec": {
    "equation": "60.21",
    "tex": "d=v\\tau",
    "inputs": [
      {
        "symbol": "v",
        "label": "Object speed in meters/second",
        "default": 0.2,
        "min": 0,
        "max": 2,
        "format": "raw"
      },
      {
        "symbol": "tau",
        "label": "Observation age in milliseconds",
        "default": 100,
        "min": 0,
        "max": 1000,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "d",
        "label": "Unseen displacement in meters",
        "formula": "v*tau/1000",
        "format": "raw"
      }
    ]
  }
}
```

[DERIVED] For this instrument, the dimensional time conversion and displacement component are made explicit in Eq.60.21 of @ms.section.60.6; its equation binding points to that expression rather than the earlier command-duration relation.

## Siblings

[DERIVED] @ms.section.60.1 defines frames/units; @ms.section.60.3 defines learning access; @ms.chapter.59 distinguishes predictive/probe/transfer evidence; @ms.section.60.6 supplies the execution gate.

## Extensions

### Improvements and their evidence

[DERIVED] Expand randomization when held-out residuals reveal a missed physical factor; reverse when unrealistic variation harms validated utility. Add identification when parameters are observable and validation error drops; retain uncertainty otherwise. Add pose verification when wrong confident estimates drive failures; reverse if added delay/intervention cost exceeds benefit. No improvement is claimed before those tests.

## Limitations

[DERIVED] A finite simulator matrix cannot span all real conditions. Local Lipschitz/identification arguments can fail at contact boundaries. Simulation-only evidence does not authorize hardware operation.

## Reproducibility

[DERIVED] Release engine/controller versions, parameter priors/fits, trajectories, object/pose assets, reset code, hidden-state definitions, seed hierarchy, all attempts and severity metrics. Keep physical stage permissions separate from simulation results.

## References

[R60.5] Object-centric residual RL, 2606.18953v1. [R60.6] Self-compensation benchmark, 2609.37334v1. Exact evidence: @ms.references.60.
