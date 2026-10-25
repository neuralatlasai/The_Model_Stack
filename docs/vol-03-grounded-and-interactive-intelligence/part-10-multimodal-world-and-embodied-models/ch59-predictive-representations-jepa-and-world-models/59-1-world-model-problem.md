---
id: ms.section.59.1
entity_type: section
title: "World-model problem"
volume: 3
part: 10
chapter: 59
section: 59.1
slug: 59-1-world-model-problem
parent: ms.chapter.59
prev_sibling: null
next_sibling: ms.section.59.2
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

# 59.1 - The world-model problem

## Scope

[DERIVED] A world model specifies what may happen after a history and action sequence. Observation process, intervention interface and uncertainty representation are part of that specification. A rendered frame is not a state; a predictive embedding is not necessarily a belief.

## Why this exists

[DERIVED] A single image can hide velocity, contact state, a container's contents or delayed commands. If histories with different hidden states map to the same z, a deterministic predictor cannot produce both correct action-conditioned futures. Increasing predictor depth cannot restore absent information. Retaining every pixel, however, can consume resources without preserving the distinctions needed for decisions.

## Intuition

[DERIVED] Identical ball positions can have opposite velocities. Position suffices for localization, but not collision prediction. Two frames may identify velocity in a noise-free setting; irregular intervals, delay and occlusion change that inference. Time intervals and action history belong in the interface rather than being inferred from row indices.

## Formulation

[MATHEMATICALLY-DERIVED] With transition kernel P and observation likelihood O, a known-model belief update is

$$
 b_{t+1}(s')=\frac{O(o_{t+1}|s')\int P(s'|s,a_t)b_t(s)ds}{\int O(o_{t+1}|u)\int P(u|s,a_t)b_t(s)dsdu}.
$$

_(Eq. 59.1)_

[DERIVED] The denominator must be positive and finite; sums replace integrals for discrete states. Action-dependent sensors require that conditioning in O. This reference equation does not imply an inspected neural model performs exact filtering.

[MATHEMATICALLY-DERIVED] Sufficiency for target Y and intervention sequence A means

$$
 \mathcal L(Y_{t+H}|h_t,\operatorname{do}(A))=\mathcal L(Y_{t+H}|z_t,\operatorname{do}(A)),\qquad z_t=E(h_t).
$$

_(Eq. 59.2)_

[DERIVED] Recorded behavior-policy conditionals do not generally identify do(A). Intervention claims require recorded actions, support, a consistent command interface and sufficient control for confounding. A policy may choose actions from hidden variables unavailable to the model. More observations from that same policy need not identify unsupported interventions.

[MATHEMATICALLY-DERIVED] Ordinary vectors can encode distributions: (p,1-p) encodes a two-state belief. Conditional averaging instead follows from a point-valued squared-loss objective:

$$
 f^*(h,A)=\mathbb E[Y|h,A],\quad\Pr(Y=-1|h,A)=\Pr(Y=1|h,A)=\tfrac12\ \Rightarrow\ f^*=0.
$$

_(Eq. 59.3)_

[DERIVED] Zero is outside the target's support. A mean can still be useful if decisions do not need its modes. Particles and distribution-valued decoders use vectors too; no universal impossibility for vector representations follows.

[MATHEMATICALLY-DERIVED] A structured matrix latent instead constrains

$$
 \rho\succeq0,\quad\rho=\rho^\dagger,\quad\operatorname{tr}\rho=1,\quad
 \rho'=U(a)\rho U(a)^\dagger,\quad U(a)=\exp[-i\Delta(H_0+aH_1)].
$$

_(Eq. 59.4)_

[DERIVED] Hermitian H gives unitary U and an unchanged joint spectrum. Partial trace and learned projection need not preserve usable information. A fixed unitary orbit cannot represent arbitrary joint eigenvalue changes during blind prediction. The finite environment register and observation updates must be assessed through the actual task readout, not the invariant alone.

```figure
{
  "id": "fig-59.3",
  "kind": "calculator",
  "title": "An impossible conditional mean",
  "caption": "A two-point future has a mean between its modes. This objective-level counterexample does not imply all vectors discard uncertainty.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-59.3",
  "alt": "A two-point future has a mean between its modes. This objective-level counterexample does not imply all vectors discard uncertainty.",
  "spec": {
    "equation": "59.3",
    "tex": "\\mu=(1-p)y_0+py_1",
    "inputs": [
      {
        "symbol": "p",
        "label": "Positive-mode probability",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "y0",
        "label": "First outcome",
        "default": -1,
        "min": -10,
        "max": 0,
        "format": "raw"
      },
      {
        "symbol": "y1",
        "label": "Second outcome",
        "default": 1,
        "min": 0,
        "max": 10,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "mean",
        "label": "Squared-loss optimal mean",
        "formula": "(1-p)*y0+p*y1",
        "format": "raw"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Define the target event/horizon, enumerate hidden variables, identify available history, specify action coordinates/duration/delay, and then choose representation and readout. A belief claim declares which events its probabilities describe. Entropy of a learned matrix is not calibrated physical uncertainty automatically.

[PAPER-REPORTED] UWM-JEPA uses a16-by 16 joint matrix with system dimension 8 and environment dimension 2. Positive-operator observation updates are trace-normalized; action-conditioned unitary prediction is read after partial trace/projection. Counterfactual targets require simulator-state access. Its hidden-velocity experiment reports0.770±0.011 accuracy against0.530 for the matched LSTM configuration over three seeds. Beyond horizon 10 both have low or negative blind-probe scores. This bounded experiment neither proves calibration nor establishes vector models' inability to retain uncertainty. [R59.5, Secs. 2-6 and supplement]

```figure
{
  "id": "fig-59.4",
  "kind": "diagram",
  "title": "An invariant is upstream of its readout",
  "caption": "Joint isospectrality survives unitary rollout. Reduced-state and task readouts require separate validation.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.4",
  "alt": "Joint isospectrality survives unitary rollout. Reduced-state and task readouts require separate validation.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "o",
        "kind": "node",
        "label": "History"
      },
      {
        "id": "rho",
        "kind": "state",
        "label": "Joint density matrix"
      },
      {
        "id": "u",
        "kind": "process",
        "label": "Action unitary"
      },
      {
        "id": "red",
        "kind": "process",
        "label": "Partial trace"
      },
      {
        "id": "read",
        "kind": "node",
        "label": "Task readout"
      }
    ],
    "edges": [
      {
        "from": "o",
        "to": "rho",
        "kind": "flow",
        "label": "update"
      },
      {
        "from": "rho",
        "to": "u",
        "kind": "flow",
        "label": "roll out"
      },
      {
        "from": "u",
        "to": "red",
        "kind": "flow",
        "label": "invariant"
      },
      {
        "from": "red",
        "to": "read",
        "kind": "flow",
        "label": "test"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 59.1 — Validate a controlled prediction interface

[DERIVED] Inputs: episode-disjoint trajectories, clocks, action schema, event Y and finite H. Output: accepted interface or a failure report.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad \mathcal D_{\rm eval}\leftarrow\operatorname{SplitByEpisode}(\mathcal D);\quad j\leftarrow0;\\
2.&\quad h_t\leftarrow\{o_i,a_i:\operatorname{available}(i)\le t\};
\quad\operatorname{ClockSchemaValid}=0\Rightarrow\operatorname{return}(\mathrm{invalid});\\
3.&\quad j=1,\ldots,J_{\max}:\quad z_j\leftarrow E(h_j),\quad
\widehat Y_j\leftarrow f(z_j,A_j),\quad\widehat Y_j^{(0)}\leftarrow f_0(h_j);\\
4.&\quad \mathcal L_j\leftarrow(\ell(\widehat Y_j,Y_j),\ell(\widehat Y_j^{(0)},Y_j),
\mathrm{matched\ action\ controls});\\
5.&\quad \operatorname{return}(\operatorname{Decision}(\{\mathcal L_j\}),
\mathrm{tested\ population},\mathrm{unsupported\ counterfactuals}).
\end{aligned}
$$

1. Align sensor, command-issue and effective-actuation times. Reject missing/nonmonotone clocks.
2. Build h_t only from data available by the decision deadline. Exclude future observations and deployment-unavailable state.
3. Test aliased observations with different histories; fit history-only and action-free controls.
4. Enumerate action support and mark simulator-only counterfactual access.
5. Fit common readouts under an equal fitting budget. Test action interventions with matching shape and duration.
6. Reject sufficiency when held-out histories still distinguish outcomes conditional on z; investigate an inert action pathway.

[MATHEMATICALLY-DERIVED] A useful empirical contrast is

$$
 \widehat\Delta_A=|D|^{-1}\sum_{j\in D}[\ell(f(z_j,\tilde A_j),Y_j)-\ell(f(z_j,A_j),Y_j)].
$$

_(Eq. 59.5)_

[DERIVED] This is not a causal certificate: shuffled actions can be unsupported and policy correlations can be spurious. Prefer randomized or simulator counterfactuals where available. Cost is O(|D|) model calls per control, with memory set by the largest history batch.

## Implementation

[DERIVED] Records need episode/reset IDs, sensor/command timestamps, units, frames, duration, latency and missing-data masks. Windows must not cross resets. Quantized commands can merge distinct actions before prediction. Irregular sampling needs elapsed-time inputs. Configuration must declare whether action precedes or follows its indexed frame.

[DERIVED] Matrix code must monitor Hermiticity, minimum eigenvalue and positive finite trace. Dense matrix exponentials generally scale cubically and matrix storage quadratically in joint dimension; these are complexity statements, not measured UWM timings. Enlarging the environment register changes expressivity and compute and must be included in comparisons.

## Experimental design

### Reported experiments

[DERIVED] The structured-latent case is a controlled simulator experiment with counterfactual targets, not a recipe for raw video without intervention data. Parameter matching does not equalize optimization quality.

[DERIVED] Experiment59.1 in @ms.verification.59 proposes balanced hidden-velocity episodes, paired interventions and held-out textures. Compare point-MSE, a vector-distribution model and structured matrices using common history and probabilistic events. Report proper scores and realized decisions separately.

## Observations

**What the paper claims.** [PAPER-REPORTED] UWM-JEPA proposes joint-state non-forgetting under unitary rollout, with a reduced-state operational readout [R59.5].

**What we infer.** [DERIVED] A spectral invariant does not establish Eq.59.2.

**What the evidence shows.** [DERIVED] The retained matrix study demonstrates action-sensitive behavior within its configured simulator and retains explicit long-horizon negatives.

**Engineering consequence.** [DERIVED] Validate collision probability if that is what a controller consumes. Latent entropy/error is not a substitute.

**What remains unknown.** [UNVERIFIED] Sufficiency and calibration under different sensors, action coverage and physical horizons remain unestablished.

## Failure modes

[DERIVED] Hidden delay, controller state, history truncation, reset leakage and changing target encoders can invalidate comparisons. Small action sensitivity can mean a collapsed pathway, weak interventions or an action-insensitive task. Large sensitivity can expose unrealistic shuffled commands instead of meaningful action use.

```figure
{
  "id": "fig-59.5",
  "kind": "compare",
  "title": "Matched controls resolve different ambiguities",
  "caption": "Controls must remain separate measurements instead of a composite physical-intelligence score.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.5",
  "alt": "Controls must remain separate measurements instead of a composite physical-intelligence score.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "test",
        "label": "Test"
      },
      {
        "id": "control",
        "label": "Control"
      }
    ],
    "rows": [
      {
        "dimension": "Velocity",
        "values": {
          "test": "Same image, different history",
          "control": "Randomized action with common state"
        }
      },
      {
        "dimension": "Action binding",
        "values": {
          "test": "Correct vs perturbed command",
          "control": "Counterfactual simulator target"
        }
      },
      {
        "dimension": "Calibration",
        "values": {
          "test": "Event score by horizon",
          "control": "Balanced base rate and vector distribution"
        }
      },
      {
        "dimension": "Memory",
        "values": {
          "test": "Blind task readout",
          "control": "Teacher-forced and copy-last readouts"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.section.59.2 determines target information. @ms.section.59.4 adds planning; @ms.chapter.60 adds actuator constraints; @ms.chapter.42 supplies evaluation methodology.

## Extensions

### Improvements and their evidence

[DERIVED] Add time-aware history when aliasing controls identify delays; reverse if a matched instantaneous model performs equally. Add distributional readouts when their proper scores and decision utility improve; reverse if neither does. Add an invariant when the task readout retains useful information at deployment horizons. These are proposals, not reported gains.

## Limitations

[DERIVED] Exact filtering assumes a known model; learned approximations can be misspecified. Simulator state may omit compliance and contact effects. Observational action contrasts alone do not identify causal effects.

## Reproducibility

[DERIVED] Archive state/render definitions, split hashes, interventions, clocks, history construction, readout budget and seeds. Label simulation-only variables. All book protocols remain proposed.

## References

[R59.5] UWM-JEPA, 2605.25313v1, Secs. 2-6 and supplement; exact limits: @ms.references.59. Canonical filtering: @ms.chapter.24.
