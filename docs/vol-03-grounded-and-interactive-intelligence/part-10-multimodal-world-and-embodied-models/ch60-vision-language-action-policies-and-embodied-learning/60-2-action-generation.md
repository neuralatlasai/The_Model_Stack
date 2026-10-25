---
id: ms.section.60.2
entity_type: section
title: "Action generation"
volume: 3
part: 10
chapter: 60
section: 60.2
slug: 60-2-action-generation
parent: ms.chapter.60
prev_sibling: ms.section.60.1
next_sibling: ms.section.60.3
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

# 60.2 - Action generation

## Scope

[DERIVED] Autoregressive tokens, parallel action chunks, diffusion/flow experts and hierarchical subgoals distribute computation and commitment differently. Their outputs still pass through the same physical contract. This section reconstructs the objectives and distinguishes faster inference from fresher feedback.

## Why this exists

[DERIVED] A chunk amortizes expensive vision/language computation, but executing it open-loop ignores observations arriving midway. An iterative action generator can model multimodality while missing a deadline. A high-level semantic planner may specify a plausible subgoal that the low-level controller cannot reach.

## Intuition

[DERIVED] One image encoding can support many action-denoising evaluations, just as one instruction can support many low-level control steps. Reuse saves work but ages context. A fast proprioceptive pathway can correct joint motion while remaining unaware of an object moved since the last camera update.

## Formulation

[MATHEMATICALLY-DERIVED] For action-token sequence c with a declared decoder D,

$$
 p_\theta(c|h,\ell)=\prod_{i=1}^{L_c}p_\theta(c_i|h,\ell,c_{<i}),\qquad u=D(c).
$$

_(Eq. 60.5)_

[DERIVED] Token probabilities are categorical sequence probabilities. A many-to-one or lossy decoder does not turn them into a continuous action density by substitution. Token length and physical action horizon differ; compression can represent an entire chunk with fewer symbols but requires reconstruction validation.

[MATHEMATICALLY-DERIVED] A noise-to-data flow convention is

$$
 x_s=(1-s)\epsilon+sa,\quad v^*=a-\epsilon,\qquad
 \mathcal L_{FM}=\mathbb E\frac{\sum_{h,j}m_{hj}(v_\theta(x_s,s,c)_{hj}-v^*_{hj})^2}{\sum_{h,j}m_{hj}}.
$$

_(Eq. 60.6)_

[DERIVED] Require at least one valid element. Sample time/noise independently under the declared distribution. A data-to-noise convention reverses interpolation/velocity and integration direction; mixing conventions is an implementation error. Multiple noise/time samples per demonstration estimate this expectation with more action-expert work, not more independent robot trajectories.

[MATHEMATICALLY-DERIVED] Reusing one context computation gives an analytical work model

$$
 W=C_V+nC_A+C_D,
$$

_(Eq. 60.7)_

[DERIVED] C_V is context/backbone work, C_A one action-field evaluation, n the evaluation count and C_D decoding/controller-adapter work in a common operation unit. Overlap, memory bandwidth, devices and synchronization prevent interpreting this sum as wall-clock latency without measurement. Conditional/unconditional guidance can multiply the action/context work.

[MATHEMATICALLY-DERIVED] A latency-aware streaming schedule with H positions and integer delay d can use

$$
 \tau_p=\begin{cases}1,&p<d,\\1-(p-d)/(H-2d),&d\leq p<H-d,\\0,&p\geq H-d,\end{cases}
 \quad0\leq p<H,\quad0<2d<H.
$$

_(Eq. 60.8)_

[DERIVED] The front represents in-flight actions and must not be overwritten retroactively. The denominator requires H>2d; d=0 needs a separate warm-start/standard-flow branch. Changing measured delay can disturb a previously consistent schedule. A running delay average does not bound a future latency spike.

```figure
{
  "id": "fig-60.6",
  "kind": "calculator",
  "title": "Context reuse and action-field work",
  "caption": "Eq.60.7 analytical operation counts use common arbitrary work units. The result is not wall-clock latency or measured hardware speed.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-60.7",
  "alt": "Eq.60.7 analytical operation counts use common arbitrary work units. The result is not wall-clock latency or measured hardware speed.",
  "spec": {
    "equation": "60.7",
    "tex": "W=C_V+nC_A+C_D",
    "inputs": [
      {
        "symbol": "CV",
        "label": "Context work",
        "default": 100,
        "min": 0,
        "max": 1000,
        "format": "raw"
      },
      {
        "symbol": "CA",
        "label": "One field evaluation work",
        "default": 5,
        "min": 0,
        "max": 100,
        "format": "raw"
      },
      {
        "symbol": "n",
        "label": "Field evaluations",
        "default": 5,
        "min": 1,
        "max": 50,
        "format": "integer"
      },
      {
        "symbol": "CD",
        "label": "Decode/adapter work",
        "default": 1,
        "min": 0,
        "max": 100,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "work",
        "label": "Total work",
        "formula": "CV+n*CA+CD",
        "format": "raw"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] A flow expert cross-attending to detached per-layer context KVs receives a richer interface than a final hidden vector while preventing its continuous loss from updating the backbone through that path. The backbone may still train through discrete objectives. Detach therefore describes a gradient edge, not an entirely frozen model. Packed examples require isolation from another example's context and from their own target action tokens.

[PAPER-REPORTED] piR2 splits fresh proprioception from asynchronously cached vision/language and trains per-position noise schedules with delayed slow-context conditioning. It warm-starts a full buffer, then emits actions using one field evaluation per call. Its physical setup uses 50absolute joint-target positions over 18controlled dimensions,25 Hz commands and20 trials/task. AppendixA.2 uses twoRTXA5000s for the method versus one for baselines; reported control frequency is not proof of equal-hardware latency. [R60.3, Sec. 3; Sec. 4.2; AppendixA.2]

| Timing context    | piR2 physical setup                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Hardware          | xArm6 plus12 DoF XHand; method2xRTXA5000, baselines1xRTXA5000                                           |
| Model / precision | GR00T-N1.7 action-head adaptation with frozen backbone; timing dtype not separately established here    |
| Inputs / outputs  | Overhead640x480RGB, instruction,45-dimensional proprioception; H=50absolute18-dimensional joint targets |
| Concurrency       | Asynchronous VLM and action workers, separate GPUs for method                                           |
| Runtime           | Source deployment stack; no book execution                                                              |
| Boundary          | Per-call action delay and slow-context age are different; transport/control drivers remain relevant     |
| Aggregation       | 25 Hz control ticks; source calls use roughly1-2ticks for method,4-5for baselines                       |
| Quality condition | Four tasks,20 trials each; different deployment device allocation retained                              |

```figure
{
  "id": "fig-60.7",
  "kind": "diagram",
  "title": "Fast and slow feedback have different ages",
  "caption": "Fresh joint state can reach the action head while vision/language remains cached. Each channel carries its own acquisition time and validity bound.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.7",
  "alt": "Fresh joint state can reach the action head while vision/language remains cached. Each channel carries its own acquisition time and validity bound.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "cam",
        "kind": "node",
        "label": "Image and instruction"
      },
      {
        "id": "vlm",
        "kind": "model",
        "label": "Slow context worker"
      },
      {
        "id": "cache",
        "kind": "memory",
        "label": "Versioned KVs"
      },
      {
        "id": "prop",
        "kind": "node",
        "label": "Fresh proprioception"
      },
      {
        "id": "head",
        "kind": "model",
        "label": "One streaming field step"
      },
      {
        "id": "q",
        "kind": "memory",
        "label": "Committed action queue"
      }
    ],
    "edges": [
      {
        "from": "cam",
        "to": "vlm",
        "kind": "flow",
        "label": "encode"
      },
      {
        "from": "vlm",
        "to": "cache",
        "kind": "flow",
        "label": "publish epoch"
      },
      {
        "from": "cache",
        "to": "head",
        "kind": "flow",
        "label": "bounded age"
      },
      {
        "from": "prop",
        "to": "head",
        "kind": "flow",
        "label": "current tick"
      },
      {
        "from": "head",
        "to": "q",
        "kind": "flow",
        "label": "future positions only"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 60.2 — Stream a chunk without rewriting committed actions

[DERIVED] Inputs: warm-started buffer, H, measured delay d, slow/fast timestamps, per-position flow model and command deadline. Output: a fresh feasible action segment or fallback.

[DERIVED] The mathematical transitions below formalize the proposed audit; the numbered notes specify the operators and controls. Every fitting, rollout and evaluation operator has a finite update, example or deadline cap. Invalid inputs return a recorded failure; exhausted evidence returns inconclusive. These transitions are not a claim that the source implementation was executed.

$$
\begin{aligned}
1.&\quad 0<2d<H\ \land\operatorname{EpochAgeValid}=1\text{ required};
\quad\text{otherwise return startup/fallback};\\
2.&\quad\mathcal P\leftarrow\operatorname{CommittedPrefix}(\mathcal B),
\quad c\leftarrow\operatorname{LatestCompleteContext},\quad x\leftarrow\operatorname{Snapshot}(\mathcal B);\\
3.&\quad v\leftarrow v_\theta(x,\tau,c,o_{\rm fast}),\quad
x'_p\leftarrow x_p+\Delta\tau_pv_p,\quad\Delta\tau_p=0\text{ for }p\in\mathcal P;\\
4.&\quad\mathcal E\leftarrow\operatorname{ContiguousCleanUncommittedPrefix}(x\prime,\tau\prime,\mathcal P);\\
5.&\quad\operatorname{PublishOnce}(\mathcal E,\mathrm{absolute\ actuation\ indices});
\quad\mathcal B'\leftarrow\operatorname{SlideAppendNoise}(\mathcal B,|\mathcal E|);\\
6.&\quad\mathrm{underrun}\lor\mathrm{late}\lor\mathrm{epoch\ change}
\Rightarrow\operatorname{return}(\mathrm{fallback});\quad\operatorname{return}(\mathcal B').
\end{aligned}
$$

1. Validate0<2d<H, current episode/context epochs and bounded observation ages. Use a separately trained startup path when no valid buffer exists.
2. Snapshot the in-flight prefix and its intended actuation indices; keep those actions immutable.
3. Evaluate one field step with fresh proprioception and the newest complete slow-context snapshot, with its age encoded only if trained for that convention.
4. Apply position-specific increments and emit only positions certified clean by the schedule. Never label a noisy intermediate output executable merely because a call returned.
5. Atomically publish future actions keyed by absolute actuation index; reject late, duplicate, stale-epoch or nonfinite outputs.
6. Slide the buffer exactly by the committed/emitted count and append fresh noise. On underrun, delay outside support or epoch change, invoke the declared fallback instead of extrapolating the schedule.

[DERIVED] Self-attention over H action positions is generally quadratic in H; cross-attention also depends on cached context length/depth. One NFE per call does not make backbone compute, warm-up or multiple-device memory free. Concurrency must preserve cache identity and cannot partially publish a new set of layer KVs.

## Implementation

[OFFICIAL-DOCUMENTATION] The pinned piR2 client uses separate request locks, caches visual embeddings with client-domain image timestamps and exposes streaming reset/warm-start endpoints. run_policy.py rejects some incoherent checkpoint/query/inpainting combinations. Its comments also tie buffer slide count to measured delay. These are static contracts, not verified race-freedom, real-time completion or equivalence to every reported checkpoint. [R60.10]

[OFFICIAL-DOCUMENTATION] NVIDIA's April17N1.7 early-access release describes a new backbone/action cascade and human-video pretraining. The current repository can later describe a general-availability backbone. These releases must not be treated as one immutable model or explained by the2025N1paper. [R60.8]

## Experimental design

### Reported experiments

[DERIVED] The piR2 study separates zero-delay execution-horizon sweeps from deployment with inference delay. Those are different experiments. Its physical comparison changes hardware allocation, so matched-device and complete-system comparisons should be reported separately.

[DERIVED] Experiment60.2 proposes both comparisons, varying slow-channel age, action-head delay, jitter, queue depth and K. Count warm-up, encoding, transport, synchronization and fallback costs. Evaluate abrupt scene changes independently from proprioceptive perturbations.

## Observations

**What the paper claims.** [PAPER-REPORTED] Streaming per-position flow and asynchronous context can improve reactivity within the tested setup [R60.3].

**What the evidence shows.** [DERIVED] The source specifies fresh/slow channels and task trials, while its two-GPU deployment differs from baselines.

**What we infer.** [DERIVED] Faster field evaluations and fresher joint feedback solve different bottlenecks. Neither guarantees visual reactivity or a hard deadline.

**What remains unknown.** [UNVERIFIED] Worst-case latency, active checkpoint identity and long-duration queue behavior were not executed here.

## Failure modes

[DERIVED] Invalid H-2d, stale image features, partial KV publication, buffer-index drift, revised committed actions, startup mismatch and noisy emitted actions can each invalidate the scheme. Temporal averaging can smooth commands while hiding a needed rapid correction. A fallback may also fail if its assumptions match the violated operating conditions.

```figure
{
  "id": "fig-60.8",
  "kind": "compare",
  "title": "Generation and commitment are separate",
  "caption": "Choose the interface by feedback and cost evidence rather than a shared model-family name.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-60.8",
  "alt": "Choose the interface by feedback and cost evidence rather than a shared model-family name.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "ar",
        "label": "Tokens"
      },
      {
        "id": "flow",
        "label": "Chunk flow"
      },
      {
        "id": "stream",
        "label": "Streaming flow"
      }
    ],
    "rows": [
      {
        "dimension": "Sequential path",
        "values": {
          "ar": "Token decoding",
          "flow": "Field evaluations",
          "stream": "One step/call after startup"
        }
      },
      {
        "dimension": "Feedback age",
        "values": {
          "ar": "Depends on query schedule",
          "flow": "Fixed context within executed chunk",
          "stream": "Fresh fast channel; aged slow channel"
        }
      },
      {
        "dimension": "Validation",
        "values": {
          "ar": "Decoder/quantization and token support",
          "flow": "Solver/limit and chunk horizon",
          "stream": "Schedule, queue identity and delay support"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.section.60.1 defines command meaning; @ms.chapter.58 derives flow/guidance fundamentals; @ms.chapter.56 supplies publication/clock principles; @ms.section.60.6 evaluates deadlines and recovery.

## Extensions

### Improvements and their evidence

[DERIVED] Use cached context when complete-system utility improves despite age; reverse under visual perturbations that exceed its operating region. Use streaming only after startup, schedule and queue tests pass. Increase n when quality gains exceed deadline cost; reverse when fewer evaluations preserve utility. Add hierarchy when subgoal reachability and intervention counts improve, not solely when generated images look plausible.

## Limitations

[DERIVED] No generation family supplies an actuator guarantee. A one-step streaming call is not one-step generation from fresh noise. Generalization across changing delays needs empirical coverage of those delays.

## Reproducibility

[DERIVED] Archive checkpoint/release, flow convention, masks, solver schedule, startup path, cache epochs, channel timestamps, devices and actual queue events. No source deployment was run.

## References

[R60.2] MolmoAct2. [R60.3] piR2. [R60.8] N1.7 release. [R60.9-R60.10] Pinned implementations: @ms.references.60.
