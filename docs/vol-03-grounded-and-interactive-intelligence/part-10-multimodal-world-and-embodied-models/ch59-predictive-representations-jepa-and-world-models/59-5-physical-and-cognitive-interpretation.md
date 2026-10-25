---
id: ms.section.59.5
entity_type: section
title: "Physical and cognitive interpretation"
volume: 3
part: 10
chapter: 59
section: 59.5
slug: 59-5-physical-and-cognitive-interpretation
parent: ms.chapter.59
prev_sibling: ms.section.59.4
next_sibling: ms.section.59.6
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

# 59.5 - Physical interpretation, memory and diagnostic controls

## Scope

[DERIVED] Physical understanding is not a single scalar. State decoding, action-conditioned prediction, hidden-object carry-over, expectation violation and task success test different interfaces. This section gives an operational readout and examines when a memory analogy exceeds the experiment.

## Why this exists

[DERIVED] A high benchmark score can be achieved by background continuity, local texture changes or a context/masking rule unrelated to a hidden object. Conversely, failure of one probe need not prove the representation contains no relevant information. The experiment must specify the route by which past evidence could affect the tested output.

## Intuition

[DERIVED] A ball hidden in a moving opaque box should move with the box in a physical model, but a predictor may instead fill the region with background or freeze the ball at its last position. A copy-last baseline can preserve a stationary object's appearance without representing containment. Distinguishing these possibilities requires present, absent and stationary worlds and controls that share visible pixels.

## Formulation

[MATHEMATICALLY-DERIVED] Given a predicted hidden-region embedding zhat and paired references z_present,z_absent, define

$$
 e=\frac{\|\hat z-z_{absent}\|_1-\|\hat z-z_{present}\|_1}{\|z_{present}-z_{absent}\|_1}.
$$

_(Eq. 59.19)_

[DERIVED] The denominator must be strictly positive. The triangle inequality bounds e in[-1,1]; e>0 favors the present reference, but e is not a probability or a calibrated physical belief. A near-zero reference separation makes the readout unstable. Encoders and token subsets must be identical across comparisons.

[MATHEMATICALLY-DERIVED] Across n scenes, a decision proportion is

$$
 \hat p_h=n^{-1}\sum_{j=1}^n\mathbf1[e_{j,h}>0].
$$

_(Eq. 59.20)_

[DERIVED] This is a population proportion over scenes, not the probability represented inside any individual model. Successive horizons reuse scenes, so they are correlated. Confidence intervals for each point do not provide simultaneous time-curve coverage without adjustment. An empirically chosen last above-threshold point has selection uncertainty.

[MATHEMATICALLY-DERIVED] A difference-in-differences control for hidden-object evidence is

$$
 \Delta_h=(\bar e_{present,h}-\bar e_{never,h})_{model}
          -(\bar e_{present,h}-\bar e_{never,h})_{copy}.
$$

_(Eq. 59.21)_

[DERIVED] This diagnostic subtracts readout bias and a specific copying baseline; it does not identify a psychological mechanism. Negative controls should include the object leaving the frame, never being rendered, and a stationary versus transported container. Pair resampling at the episode/scene level preserves repeated-time dependence.

[MATHEMATICALLY-DERIVED] For two contexts c1,c2 with identical visible frames after occlusion, the prediction contrast

$$
 \delta_h=\|P(E(c_1))_h-P(E(c_2))_h\|
$$

_(Eq. 59.22)_

[DERIVED] measures sensitivity to the differing past. It need not establish correct memory: a model can retain texture or timestamp differences. Factorial scene controls are required to make the contrast about the intended hidden variable.

```figure
{
  "id": "fig-59.15",
  "kind": "diagram",
  "title": "Minimal worlds constrain the interpretation",
  "caption": "Visible observations are matched while hidden futures differ. An explicit control blocks background completion from being counted as object memory.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.15",
  "alt": "Visible observations are matched while hidden futures differ. An explicit control blocks background completion from being counted as object memory.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "past",
        "kind": "node",
        "label": "Same pre-occlusion event"
      },
      {
        "id": "mask",
        "kind": "process",
        "label": "Hide target region"
      },
      {
        "id": "p",
        "kind": "state",
        "label": "Present future"
      },
      {
        "id": "a",
        "kind": "state",
        "label": "Absent future"
      },
      {
        "id": "read",
        "kind": "node",
        "label": "Signed paired readout"
      }
    ],
    "edges": [
      {
        "from": "past",
        "to": "mask",
        "kind": "flow",
        "label": "matched visibility"
      },
      {
        "from": "mask",
        "to": "p",
        "kind": "flow",
        "label": "world one"
      },
      {
        "from": "mask",
        "to": "a",
        "kind": "flow",
        "label": "world two"
      },
      {
        "from": "p",
        "to": "read",
        "kind": "flow",
        "label": "reference"
      },
      {
        "from": "a",
        "to": "read",
        "kind": "flow",
        "label": "reference"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] Tracking Is Not Permanence evaluates released V-JEPA2 checkpoints, not V-JEPA2.1. Its moving-object readout uses 60 scenes per time point and paired controls; a reported present proportion is across scenes, not a model probability. Encoder probes can retain object information while predictor readouts lose it. Predictor-only synthetic-container training improves a containment readout and IntPhys-2019, but another curriculum without containment masks also improves the benchmark. IntPhys2 gains are not uniform, and scoring/context rules change ordering. The diagnostic supports a specific functional mismatch, not an intrinsic incapacity of all JEPA models. [R59.7, Secs. 3-4; AppendicesI/J]

[DERIVED] A state probe establishes accessible information within its hypothesis class. A predictor readout tests whether that information is used in a particular future output. Their disagreement is scientifically useful: it localizes an interface failure more precisely than declaring the entire encoder ignorant. A source's intuitive label should be translated into its measured quantity before generalization.

```figure
{
  "id": "fig-59.16",
  "kind": "compare",
  "title": "Interpretation must match the readout",
  "caption": "Different positive results support different bounded statements.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-59.16",
  "alt": "Different positive results support different bounded statements.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "measure",
        "label": "Measured"
      },
      {
        "id": "support",
        "label": "Supported"
      },
      {
        "id": "gap",
        "label": "Not established"
      }
    ],
    "rows": [
      {
        "dimension": "State probe",
        "values": {
          "measure": "Held-out label prediction",
          "support": "Label information accessible to that probe",
          "gap": "Predictor uses it"
        }
      },
      {
        "dimension": "VoE",
        "values": {
          "measure": "Impossible vs possible prediction error",
          "support": "Sensitivity under the scoring rule",
          "gap": "Persistent hidden-state belief"
        }
      },
      {
        "dimension": "Action control",
        "values": {
          "measure": "Correct vs counterfactual action target",
          "support": "Configured action pathway matters",
          "gap": "All interventions identified"
        }
      },
      {
        "dimension": "Task success",
        "values": {
          "measure": "Declared goal criterion",
          "support": "Utility in tested conditions",
          "gap": "Universal physical understanding"
        }
      }
    ]
  }
}
```

## Algorithm

### Algorithm 59.5 — Test functional carry-over with paired worlds

[DERIVED] Inputs: scene generator, frozen encoder/predictor, visibility mask, reference worlds and predeclared time grid. Output: signed trajectories, paired contrasts and explicit undefined cases.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad j=1,\ldots,n_{\rm scenes}:\quad
(x_j^+,x_j^-,x_j^{\rm control})\leftarrow\operatorname{PairedWorlds}(j);\\
2.&\quad\operatorname{VisiblePixelsEqual}=0\Rightarrow\operatorname{return}(\mathrm{invalid\ pair},j);\\
3.&\quad\widehat z_{j,h}\leftarrow P(E(x_{j,C}),h),
\quad(z_{j,h}^+,z_{j,h}^-)\leftarrow(E(x_{j,h}^+),E(x_{j,h}^-));\\
4.&\quad\|z_{j,h}^+-z_{j,h}^-\|_1\le\epsilon_{\rm sep}
\Rightarrow e_{j,h}\leftarrow\mathrm{undefined};
\quad\text{otherwise use Eq.59.19};\\
5.&\quad\operatorname{return}(\{e_{j,h}\},\mathrm{paired\ scene\ bootstrap},
\mathrm{undefined\ counts},\mathrm{control\ contrasts}).
\end{aligned}
$$

1. Generate present/absent/stationary worlds sharing all permitted visible pixels. Verify pixel identity outside the manipulated region.
2. Apply the same mask to context. Prevent future reference tokens from entering the prediction path.
3. Encode reference worlds with the same frozen encoder and normalization; select the same hidden-region positions.
4. Reject near-zero reference separation. Compute Eq.59.19 and the tie rule for Eq.59.20.
5. Run never-rendered, exits-frame, copy-last and transported-container controls with identical visibility.
6. Aggregate by independent scene; bootstrap paired scenes for curves and predeclared carry-over statistics. Keep encoder and predictor readouts separate.

[DERIVED] Runtime grows with scenes times worlds times encoder/predictor evaluations; storage grows with time points and selected tokens. Dense full-video references need not have the same cost as masked context prediction. Declare that asymmetry rather than calling the entire test one forward pass.

## Implementation

[DERIVED] Tubelets span multiple frames, so a score's time coordinate must declare start, center or end. Spatial regions should track the intended object without exposing its hidden ground-truth location as a deployment input. The diagnostic is allowed to use privileged locations for evaluation, but must label them. A mask that covers all frames versus only future frames changes the task fundamentally.

[DERIVED] For physical violations, visual and physical perturbations must be matched as carefully as possible. A teleport changes pixels and dynamics together; a color change changes pixels with different magnitude/statistics. A larger surprise to teleportation is suggestive but does not isolate a physical law without salience controls. Decoder visualizations add decoder error and can create plausible-looking futures that do not reflect predictor precision.

## Experimental design

### Reported experiments

[DERIVED] LeWM's inspected violation-of-expectation setup compares color changes with object teleportations in three simulators (R59.1, Sec. 5.2; AppendixF.3). It supplies a useful perturbation contrast, while the rendering/dynamics confound above limits interpretation. It is not an object-permanence or causal-law proof.

[DERIVED] Experiment59.4 proposes a common frozen-model battery covering moving/static occlusion, transported containers, action perturbations and physically possible/impossible pairs. Keep each readout and scoring rule separate; do not combine them into an arbitrary overall intelligence score. Test model versions explicitly rather than transferring a result to a successor by family name.

## Observations

**What the paper claims.** [PAPER-REPORTED] The hidden-object study diagnoses a mismatch between encoder retention, predictor carry-over and benchmark scores in the tested released checkpoints [R59.7].

**What we infer.** [DERIVED] Eq.59.19 is a bounded relative-distance readout. Its sign and scene proportion have distinct meanings.

**What the evidence shows.** [DERIVED] Current work shows encoder retention, predictor use and physical-benchmark scores can disagree, including after targeted training.

**Engineering consequence.** [DERIVED] Store the readout, context/mask rule and timing convention with every reported result. A benchmark name alone is insufficient.

**What remains unknown.** [UNVERIFIED] Whether these functional readouts predict physical control under novel occlusion and contact is not established.

## Failure modes

[DERIVED] Reference separation collapse, hidden-token leakage, camera-motion cues, background completion, static copying and post-hoc context selection can inflate claims. Probe failure can reflect a weak readout; probe success can reflect a nuisance. Reusing scenes across horizons creates false precision if every time point is treated as independent.

```figure
{
  "id": "fig-59.17",
  "kind": "calculator",
  "title": "Signed readout on a one-dimensional reference pair",
  "caption": "Eq.59.19 specialized to absent=-1 and present=+1 with scalar predicted x. Its L1 distances enforce the triangle inequality and a positive denominator2.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-59.19",
  "alt": "Eq.59.19 specialized to absent=-1 and present=+1 with scalar predicted x. Its L1 distances enforce the triangle inequality and a positive denominator2.",
  "spec": {
    "equation": "59.19",
    "tex": "e=(|x+1|-|x-1|)/2",
    "inputs": [
      {
        "symbol": "x",
        "label": "Predicted scalar",
        "default": 0.2,
        "min": -3,
        "max": 3,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "e",
        "label": "Signed readout",
        "formula": "(abs(x+1)-abs(x-1))/2",
        "format": "raw"
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.section.59.1 defines hidden-state uncertainty; @ms.section.59.2 distinguishes decoding/forecastability; @ms.section.59.6 asks whether diagnostics transfer. @ms.chapter.42 supplies paired evaluation and uncertainty principles.

## Extensions

### Improvements and their evidence

[DERIVED] Add temporally partial masks when controlled carry-over improves without merely freezing objects; reverse if action-conditioned transport deteriorates. Add object-centric state only when it improves matched unseen scenes and decisions; reverse if segmentation supervision or cost explains the gain. Use memory analogies only after stating the exact operational test.

## Limitations

[DERIVED] Synthetic minimal pairs offer control but limited realism. Natural-video pairs seldom isolate one hidden factor perfectly. Neither a successful readout nor a benchmark score proves a human cognitive mechanism.

## Reproducibility

[DERIVED] Release scene seeds, visibility masks, object regions, checkpoint/version hashes, reference embeddings, scoring code, tie/zero rules and paired uncertainty calculations. Do not claim that this proposed battery was executed.

## References

[R59.7] Tracking Is Not Permanence, 2610.07355v1, Secs. 3-4 and AppendicesI/J. [R59.1] LeWM, Sec. 5.2 and AppendixF.3; exact source scope: @ms.references.59.
