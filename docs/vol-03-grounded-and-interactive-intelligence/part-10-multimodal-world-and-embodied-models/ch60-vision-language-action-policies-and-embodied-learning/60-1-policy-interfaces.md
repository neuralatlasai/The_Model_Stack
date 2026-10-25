---
id: ms.section.60.1
entity_type: section
title: "Policy interfaces"
volume: 3
part: 10
chapter: 60
section: 60.1
slug: 60-1-policy-interfaces
parent: ms.chapter.60
prev_sibling: null
next_sibling: ms.section.60.2
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

# 60.1 - Policy interfaces

## Scope

[DERIVED] A VLA maps language, vision and robot state to an action distribution, but the action contract determines what any emitted number means. This section specifies that contract before discussing model size or success rates.

## Why this exists

[DERIVED] A normalized value0.1 can mean a joint angle, a joint increment, velocity or a Cartesian displacement. A controller expecting absolute targets cannot safely consume deltas. The same seven numbers can describe different joints, grippers and rotation conventions across embodiments. Shared tensor width is not a shared physical interface.

## Intuition

[DERIVED] Translating a wrist-frame displacement into base coordinates rotates its direction. Repeating a delta command keeps moving; repeating an absolute position holds a target. Changing command rate changes the trajectory produced by velocities and repeated deltas even when the tensor sequence is unchanged.

## Formulation

[MATHEMATICALLY-DERIVED] Let N_e map physical command u for embodiment e to normalized action a. A percentile affine convention is

$$
 a_j=2\frac{u_j-l_j}{h_j-l_j}-1,\qquad
 u_j=l_j+\tfrac12(a_j+1)(h_j-l_j),\quad h_j>l_j.
$$

_(Eq. 60.1)_

[DERIVED] Clipping a to[-1,1] makes this map noninvertible outside the fitted range. Zero-range dimensions need an explicit constant/mask rule. A gripper's discrete state should not inherit a continuous percentile transform accidentally. Fit l/h on training data and serialize them with embodiment/action-mode identity.

[MATHEMATICALLY-DERIVED] With column-vector convention, base-from-effector transform T maps effector coordinates into base coordinates. Body and spatial twists update differently:

$$
 T'=T\exp(\hat\xi_b),\qquad T'=\exp(\hat\xi_s)T,\quad
 \xi_s=\operatorname{Ad}_T\xi_b.
$$

_(Eq. 60.2)_

[DERIVED] Declare translation units and angular units, rotation parameterization, handedness and multiplication side. Finite rotations do not commute. Euler-angle subtraction is not generally the rotation logarithm. Near pi, the logarithm's branch needs a specified convention and continuity handling.

[MATHEMATICALLY-DERIVED] A command stream with K executed samples at period Delta commits an interval

$$
 T_{exec}=K\Delta,\qquad \dot q_i\approx(q_{i+1}-q_i)/\Delta.
$$

_(Eq. 60.3)_

[DERIVED] This velocity estimate assumes aligned positions and a fixed period; low-level interpolation and inner servo rates add another interface. Sensor frame rate, model-query rate and actuator command rate are different quantities.

[MATHEMATICALLY-DERIVED] Independent scalar quantization with physical bin widths delta_j has worst-case reconstruction norm

$$
 \|u-\hat u\|_2\leq\tfrac12\sqrt{\sum_{j=1}^{d}\delta_j^2},
$$

_(Eq. 60.4)_

[DERIVED] This assumes nearest-bin rounding within range and no additional compression distortion. It does not apply unchanged to transform-domain lossy compression, clipping or a discontinuous gripper command. Task effects depend on controller/dynamics sensitivity, not the token error alone.

```figure
{
  "id": "fig-60.3",
  "kind": "calculator",
  "title": "Uniform-bin action reconstruction bound",
  "caption": "Eq.60.4 specialized to d independent coordinates with common physical bin width delta, nearest rounding and no clipping. The output has the same physical units as each coordinate.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-60.4",
  "alt": "Eq.60.4 specialized to d independent coordinates with common physical bin width delta, nearest rounding and no clipping. The output has the same physical units as each coordinate.",
  "spec": {
    "equation": "60.4",
    "tex": "e\\leq\\sqrt d\\,\\delta/2",
    "inputs": [
      {
        "symbol": "d",
        "label": "Coordinates with common units",
        "default": 6,
        "min": 1,
        "max": 32,
        "format": "integer"
      },
      {
        "symbol": "delta",
        "label": "Bin width in declared common units",
        "default": 0.002,
        "min": 1e-05,
        "max": 0.1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "bound",
        "label": "Euclidean reconstruction bound",
        "formula": "sqrt(d)*delta/2",
        "format": "raw"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] MolmoAct2 represents one second of motion with source-rate-dependent action count, pads actions to 32 dimensions, uses 1st/99th-percentile normalization and handles grippers separately. Its frequency-transform/quantization/BPE tokenizer uses a2048-token vocabulary. Post-training adds a continuous expert, with masks for padded steps/dimensions and per-example context isolation in packed sequences. These interfaces coexist; compact tokens are not lossless physical commands. [R60.2, Secs. 4.1-4.2]

[DERIVED] State and command schemas must be separately versioned: absolute joint state can condition delta end-effector actions. Padding is not a real actuator coordinate. Missing sensors need validity masks, and state normalization must use the same joint ordering as the policy checkpoint. Camera calibration and image preprocessing belong to the sensor contract because they determine spatial grounding.

```figure
{
  "id": "fig-60.4",
  "kind": "diagram",
  "title": "Normalization is inside the physical contract",
  "caption": "Tensor conversion must retain embodiment, mode, frames and timestamp identity. A model output is only a proposal until all fields are consistent.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.4",
  "alt": "Tensor conversion must retain embodiment, mode, frames and timestamp identity. A model output is only a proposal until all fields are consistent.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "node",
        "label": "Images/language/state"
      },
      {
        "id": "p",
        "kind": "model",
        "label": "Policy output"
      },
      {
        "id": "n",
        "kind": "process",
        "label": "Unnormalize and decode"
      },
      {
        "id": "v",
        "kind": "boundary",
        "label": "Validate schema and age"
      },
      {
        "id": "u",
        "kind": "node",
        "label": "Physical command"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "p",
        "kind": "flow",
        "label": "declared schema"
      },
      {
        "from": "p",
        "to": "n",
        "kind": "flow",
        "label": "normalized action"
      },
      {
        "from": "n",
        "to": "v",
        "kind": "flow",
        "label": "units/frame/mode"
      },
      {
        "from": "v",
        "to": "u",
        "kind": "flow",
        "label": "accepted proposal"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 60.1 — Validate an action contract in simulation

[DERIVED] Inputs: checkpoint schema, normalizers, controller adapter and simulated robot. Output: accepted mapping or explicit rejection.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad\Gamma\leftarrow(\mathrm{embodiment,joints,mode,units,frame,rate,normalizer});\\
2.&\quad\Gamma_{\rm checkpoint}\ne\Gamma_{\rm adapter}
\Rightarrow\operatorname{return}(\mathrm{schema\ rejection});\\
3.&\quad u\in\mathcal U_{\rm test}:\quad a\leftarrow\operatorname{Normalize}(u),
\quad\widehat u\leftarrow\operatorname{Decode}(a),\quad
\widehat y\leftarrow\operatorname{Simulate}(\widehat u);\\
4.&\quad\mathcal L_u\leftarrow(\mathrm{roundtrip,geometry,mode,clock,reset\ checks});
\quad\operatorname{finite}(\widehat u,\widehat y)=0\Rightarrow\operatorname{return}(\mathrm{failed});\\
5.&\quad\operatorname{return}\left(\bigwedge_{u\in\mathcal U_{\rm test}}\operatorname{Pass}(\mathcal L_u),
\Gamma,\mathrm{simulation\ scope}\right).
\end{aligned}
$$

1. Match embodiment, joint names/order, action mode, units, rate and coordinate frame by exact versioned identifiers.
2. Check normalizer ranges and validity masks; reject nonfinite or unrecognized fields.
3. Decode reference commands, including zero, a single-coordinate perturbation and boundary values. Verify physical direction/magnitude against analytic expectations.
4. Test absolute versus delta repetition, rotation composition and gripper semantics independently.
5. Align observation, issued command and measured result timestamps; verify no window crosses a reset.
6. Export only after all schema/geometry checks pass. This simulation acceptance does not authorize physical execution.

[DERIVED] Scalar conversion is O(Hd); controller inverse kinematics may dominate and can fail or choose a different branch. Failed IK must be reported, not replaced silently with an arbitrary previous action. The test uses bounded perturbations, not unconstrained exploration.

## Implementation

[OFFICIAL-DOCUMENTATION] The pinned originating MolmoAct2 action expert has separate self/cross-attention masks, validates action-mask shape and accepts projected per-layer KVs. Padded action embeddings are explicitly masked. The inspected file alone does not establish the active checkpoint, tokenizer or training loss/config identity. [R60.9, experiments/olmo/nn/action_expert.py]

[DERIVED] Use explicit shape metadata H-by-d, validity masks and unit-bearing schemas instead of padding by convention. Round-trip tests detect coordinate/order errors but cannot validate contact dynamics. A command envelope should carry policy/normalizer hashes, episode and task epochs, acquisition time and intended actuation time. Replayed commands from a previous reset must be invalid even when their numerical values remain in range.

## Experimental design

### Reported experiments

[DERIVED] The current tokenizer/expert source supplies a reconstructable interface, not a guarantee that all embodiments share comparable action precision. A seven-dimensional Franka command and a bimanual joint command need distinct interpretation despite a common padded tensor.

[DERIVED] Experiment60.1 proposes schema/property checks and simulator trajectories across action modes, rates, clipping and quantization. Evaluate physical tracking error, task success and failure severity separately. Zero simulated schema violations are necessary but not sufficient for hardware deployment.

## Observations

**What the paper claims.** [PAPER-REPORTED] MolmoAct2 combines common discrete pretraining and continuous deployment interfaces [R60.2].

**What the evidence shows.** [DERIVED] The described normalization, masking and per-embodiment control account makes those interfaces explicit, while active recipe identity remains unverified here.

**What we infer.** [DERIVED] A tensor's shape cannot establish physical meaning. Schema, units, frames and clocks are model inputs/outputs with scientific consequences.

**What remains unknown.** [UNVERIFIED] Actual adapter compatibility and hardware tracking behavior were not executed.

## Failure modes

[DERIVED] Degrees/radians, body/base frame, absolute/delta mode, joint order, gripper polarity, stale normalizers, invalid padding and reset-crossing queues can each defeat a competent model. Clipping may prevent a range violation while producing a physically inappropriate trajectory.

```figure
{
  "id": "fig-60.5",
  "kind": "compare",
  "title": "The same vector has different physical meanings",
  "caption": "A controller must choose one declared interpretation; silently guessing changes the experiment.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.5",
  "alt": "A controller must choose one declared interpretation; silently guessing changes the experiment.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "joint",
        "label": "Absolute joint"
      },
      {
        "id": "delta",
        "label": "Joint increment"
      },
      {
        "id": "cart",
        "label": "Cartesian twist"
      }
    ],
    "rows": [
      {
        "dimension": "Repeat",
        "values": {
          "joint": "Hold target",
          "delta": "Continue incrementing",
          "cart": "Compose motion in declared frame"
        }
      },
      {
        "dimension": "Units",
        "values": {
          "joint": "Radians/meters by actuator",
          "delta": "Radians/meters per command",
          "cart": "Translation and angle; frame required"
        }
      },
      {
        "dimension": "Rate change",
        "values": {
          "joint": "Changes tracking schedule",
          "delta": "Changes accumulated motion",
          "cart": "Changes integration unless duration included"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.chapter.55 and @ms.chapter.56 define perception/time interfaces. @ms.section.60.2 generates actions; @ms.section.60.6 adds execution gates. @ms.chapter.59 supplies state/action identifiability.

## Extensions

### Improvements and their evidence

[DERIVED] Use typed schemas when cross-embodiment ambiguity exists; reverse only if an equally explicit alternative passes the same checks. Increase token precision when reconstructed physical error changes task outcomes; reverse when extra tokens cost more without utility. Add a different action mode when held-out tracking/control improves under the same controller budget.

## Limitations

[DERIVED] Exact conversion does not establish actuator feasibility or safety. Quantization bounds do not include learned prediction error. Calibration and geometry tests cannot cover arbitrary contact behavior.

## Reproducibility

[DERIVED] Save schemas, normalizers, transforms, clocks, action masks, controller gains, IK choices and reset IDs. This chapter provides proposed simulation checks only.

## References

[R60.2] MolmoAct2, 2605.02881v2, Secs. 4.1-4.2. [R60.9] Pinned action expert; exact paths: @ms.references.60.
