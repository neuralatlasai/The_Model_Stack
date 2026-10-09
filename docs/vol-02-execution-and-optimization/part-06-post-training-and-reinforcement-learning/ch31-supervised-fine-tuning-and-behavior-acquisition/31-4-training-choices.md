---
id: ms.section.31.4
entity_type: section
title: Training choices
short_title: Training choices
volume: 2
part: 6
chapter: 31
section: '31.4'
slug: 31-4-training-choices
parent: ms.chapter.31
prev_sibling: ms.section.31.3
next_sibling: ms.section.31.5
children: []
prerequisites:
- ms.chapter.10
- ms.chapter.11
- ms.chapter.12
- ms.chapter.19
- ms.chapter.20
- ms.chapter.21
- ms.chapter.22
- ms.chapter.23
- ms.chapter.24
- ms.chapter.30
downstream:
- ms.chapter.32
- ms.chapter.33
- ms.chapter.34
- ms.chapter.35
- ms.chapter.36
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - supervised_fine_tuning
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.hugging-face-trl
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 31.4 — Training choices

## Scope

[DERIVED] This section owns the SFT recipe decisions: full tuning versus parameter-efficient adaptation, learning rate, epochs, mixture balance, curriculum and sequence length. The canonical adapter mechanism belongs to Chapter 23 and the optimizer to Chapter 20. Here their choices are coupled through an explicit update, target-exposure, retention and resource budget. The output is a bounded selection protocol with independent run state, declared acceptance constraints and a held-out final test.

## Why this exists

[MATHEMATICALLY-DERIVED] At fixed examples per epoch, reducing global batch increases optimizer transitions; at fixed optimizer transitions, increasing batch increases consumed examples. At fixed examples, increasing maximum sequence length can change both admitted targets and attention work. These are different comparisons. A recommendation such as “use two epochs” or “increase adapter learning rate” has no portable meaning without the masking, sampling, schedule, initialization and selection metric that defined it.

[DERIVED] A recipe search must distinguish a feasible run from a successful adaptation. Feasibility means the live state fits memory and the numerical computation completes. Adaptation means a declared utility improves without violating retention, compliance or correctness limits. An optimizer configuration that lowers validation cross-entropy can still fail the artifact's acceptance rule; omitting that run as an outlier would hide the actual tradeoff.

## Intuition

[MATHEMATICALLY-DERIVED] Full tuning changes all admitted parameter coordinates. A fixed adapter parameterization restricts which local function changes are reachable. Restricting trainable coordinates reduces optimizer-state size, but the frozen backbone still participates in forward computation and may need backward propagation to earlier trainable adapters. The memory saving is therefore not “all training memory multiplied by trainable fraction”. Saved activations, reconstruction work, output-head loss and communication require their own terms.

[MATHEMATICALLY-DERIVED] Learning rate is meaningful relative to parameterization and curvature. Scaling an adapter's output changes the Jacobian seen by the optimizer; an unchanged numerical learning rate does not preserve the function-space step. Epochs describe repeated traversal of a defined population. Once sampling is weighted, repeated, length-filtered or curriculum-dependent, an epoch label must be accompanied by actual consumed source identities and effective target mass.

## Formulation

| Quantity | Definition | Boundary |
|---|---|---|
| $N_{\rm train}$ | Number of trainable scalar parameters | Excludes frozen tensors |
| $K$ | Number of committed optimizer steps | Rejected/OOM steps counted separately |
| $G$ | Global examples per committed step | Defined after distributed grouping |
| $E$ | Complete passes over the declared admitted population | Only for deterministic full traversal |
| $n$ | Number of admitted source examples | Distinct from repeated exposures |
| $R$ | Consumed effective target mass | After masks, truncation and weights |

[MATHEMATICALLY-DERIVED] For a low-rank update to a matrix of shape $[d_{\rm out},d_{\rm in}]$, count the trainable factors rather than multiplying the original parameter count by an informal fraction:

$$
\Delta W=\gamma BA,\quad A\in\mathbb R^{k\times d_{\rm in}},\quad B\in\mathbb R^{d_{\rm out}\times k},\quad N_{\rm train}=k(d_{\rm in}+d_{\rm out}).
$$
*(Eq. 31.13)*

where this local accounting excludes optional biases and other trainable modules; $k$ is rank and $\gamma$ the declared scaling. Adapter definitions are owned by Chapter 23.

```figure
id: fig-31.19
kind: calculator
title: Adapter state count
caption: Illustrative one-matrix adapter. This fraction describes factor parameters, not total training-memory or FLOP savings.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.13
alt: Adjust the declared illustrative inputs; trainable factor parameters=rank*(din+dout), fraction of dense matrix parameters=rank*(din+dout)/(din*dout). Illustrative one-matrix adapter. This fraction describes factor parameters, not total training-memory or FLOP savings.
spec:
  tex: N_{\rm train}=k(d_{\rm in}+d_{\rm out})
  equation: "31.13"
  inputs:
    - symbol: rank
      label: adapter rank
      default: 32
      min: 1
      max: 256
      format: integer
      step: 1
    - symbol: din
      label: input width
      default: 4096
      min: 1
      max: 32768
      format: integer
      step: 1
    - symbol: dout
      label: output width
      default: 4096
      min: 1
      max: 32768
      format: integer
      step: 1
  outputs:
    - symbol: train
      label: trainable factor parameters
      formula: rank*(din+dout)
      format: fixed3
      emphasis: true
    - symbol: frac
      label: fraction of dense matrix parameters
      formula: rank*(din+dout)/(din*dout)
      format: raw
      emphasis: false
anchor: formulation
states:
  - anchor: formulation
    label: Rank 32
    variables:
      rank: 32
    highlight:
      - train
    note: Trainable factor size grows linearly with rank.
  - anchor: mechanism
    label: Rank 128
    variables:
      rank: 128
    highlight:
      - train
      - frac
    note: Higher rank increases optimizer state; activation memory remains separate.
```

## Mechanism

### Methodology

[DERIVED] Select the adaptation parameterization before the learning-rate grid. Record every trainable tensor, adapter target module and factor scaling. Check the count explicitly, particularly for sparse models where adapting every expert can create substantial trainable state despite low activated compute. Keep initialization fixed for paired comparisons; random adapter initialization is part of run state. A configuration that trains extra embeddings or an output head is not the same parameter-efficient arm as one that freezes them.

[MATHEMATICALLY-DERIVED] Persistent training state can be counted with separate dtype and ownership factors. For an illustrative unsharded mixed-precision scheme with two-byte weights/gradients, four-byte master weights and two four-byte optimizer moments, full tuning requires sixteen bytes per parameter. If frozen weights use two bytes and trainable weights use that same sixteen-byte scheme, persistent bytes are:

$$
M_{\rm full}=16N,\qquad M_{\rm adapter}=2N_{\rm frozen}+16N_{\rm train},\qquad M_{\rm peak}=M_{\rm persistent}+M_{\rm act}+M_{\rm workspace}+M_{\rm comm}.
$$
*(Eq. 31.14)*

where these are declared analytical storage choices, not universal framework defaults; quantization, sharding, offload and optimizer formats change individual terms.

```figure
id: fig-31.20
kind: memory-stack
title: Persistent state by trainable ownership
caption: Illustrative unsharded storage choices from Eq.31.14. Activations, workspaces and communication buffers are omitted
  and must be added before checking capacity.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.14
alt: Full tuning stores two-byte weights and gradients, four-byte masters and eight-byte moments. The adapter arm retains
  frozen weights and adds the same trainable-state scheme only for adapter factors.
spec:
  format: bytes
  variables:
    N: 1000000000
    Nfrozen: 1000000000
    Ntrain: 10000000
  bars:
  - label: full tuning
    segments:
    - label: weights and gradients
      kind: tensor
      formula: 4*N
    - label: masters and moments
      kind: memory
      formula: 12*N
  - label: adapter tuning
    segments:
    - label: frozen weights
      kind: tensor
      formula: 2*Nfrozen
    - label: trainable state
      kind: memory
      formula: 16*Ntrain
```

[MATHEMATICALLY-DERIVED] Adapter tuning and full tuning may have different communication volume because gradient payload scales with trainable coordinates, but synchronizing a smaller payload need not improve latency if the collective is launch-bound or poorly overlapped. A frozen tensor may still be gathered under parameter sharding. Likewise, activation checkpointing trades recomputation for retained tensors without changing the objective. These dimensions belong in the recipe, not in an unqualified trainable-parameter count.

[MATHEMATICALLY-DERIVED] For complete passes with no dropped examples and global batch $G$, the step count per epoch is a ceiling; repeated traversals multiply example exposure but not unique identities:

$$
K=E\left\lceil\frac nG\right\rceil,\qquad X=En,\qquad R=E\sum_{i=1}^n A_i.
$$
*(Eq. 31.15)*

where the final step can be smaller and the partial batch is flushed at each epoch boundary; this assumes no replacement sampling, no changing mixture and no rejected transitions. Carrying an unfinished batch across epoch boundaries changes the ceiling to $\lceil En/G\rceil$. Sampled curricula require actual exposure logs rather than this identity.

```figure
id: fig-31.21
kind: stat-panel
title: Exposure and transition ledger
caption: Illustrative complete traversals with constant target mass. This readout does not predict task quality or hardware
  time.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.15
alt: 'Analytical readout: optimizer transitions=Epochs*ceil(Examples/GlobalBatch), example exposures=Epochs*Examples, effective
  target mass=Epochs*Examples*Targets. Illustrative complete traversals with constant target mass. This readout does not predict
  task quality or hardware time.'
spec:
  header: EXPOSURE AND TRANSITION LEDGER
  variables:
    Epochs: 4
    Examples: 5000
    GlobalBatch: 32
    Targets: 512
  rows:
  - key: optimizer transitions
    formula: Epochs*ceil(Examples/GlobalBatch)
    format: fixed3
  - key: example exposures
    formula: Epochs*Examples
    format: fixed3
  - key: effective target mass
    formula: Epochs*Examples*Targets
    format: fixed3
anchor: implementation
```

[DERIVED] Sweep maximum length jointly with data admission. If a longer limit admits previously rejected reasoning targets, the data population has changed. If it merely reduces truncation, the same example contributes more target mass. To isolate sequence-kernel efficiency, compare identical token/mask fixtures under different execution layouts. To study useful context length, compare a prespecified evidence-position protocol and report the resulting population difference. Those are separate studies.

[MATHEMATICALLY-DERIVED] A simple local quadratic illustrates why learning rate cannot be transferred from a number alone. For a scalar error coordinate $u$ and positive curvature $h$, gradient descent updates $u'=(1-\eta h)u$. Loss contracts for $0<\eta h<2$, while overshoot changes the sign of the coordinate:

$$
\mathcal Q(u)=\tfrac12hu^2,\qquad \frac{\mathcal Q(u')}{\mathcal Q(u)}=(1-\eta h)^2,\qquad 0<\eta h<2.
$$
*(Eq. 31.16)*

where this is an exact scalar quadratic calculation, not an AdamW stability theorem or an empirical curvature estimate for an SFT model.

```figure
{
  "id": "fig-31.22",
  "kind": "chart",
  "title": "Local-step stability",
  "caption": "An analytical scalar quadratic. The ratio exceeds one beyond a dimensionless step of two; model training is not reduced to this example.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-31.16",
  "alt": "Analytical curves: quadratic error multiplier equals (1-x)^2. An analytical scalar quadratic. The ratio exceeds one beyond a dimensionless step of two; model training is not reduced to this example.",
  "spec": {
    "type": "line",
    "x": {
      "label": "dimensionless step eta times curvature",
      "scale": "linear",
      "domain": [
        0,
        3
      ]
    },
    "y": {
      "label": "one-step loss ratio",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "quadratic error multiplier",
        "formula": "(1-x)^2",
        "sample": {
          "to": 3,
          "count": 121,
          "from": 0
        }
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 0,
        "label": "One-step optimum for the declared quadratic"
      },
      {
        "x": 2,
        "y": 1,
        "label": "Beyond this step, the quadratic loss grows"
      }
    ]
  }
}
```

[DERIVED] Mixture curricula change $p_k$ over time. Record the rule and the observation that drives each transition; otherwise a “curriculum” can become undeclared selection on the final test. A fixed-length schedule, an uncertainty-based resampler and a task-success-based selector implement different feedback loops. Resume state must include the curriculum state, random generator and source position, or a restarted run does not follow the same optimization trajectory.

## Algorithm

### Algorithm 31.4 — Bounded recipe selection with retention gates

[DERIVED] Inputs are an immutable dataset/split, finite candidate grid, fixed compute ceiling, baseline and acceptance thresholds. Output is an accepted checkpoint or an explicit no-accepted-candidate result. Candidate state is independent; partial results retain failure reasons.

$$
\begin{aligned}
1.&\quad \text{For each candidate }c:\ (\theta_c,s_c,\omega_c)\leftarrow\operatorname{IndependentInitialState}(c).\\
2.&\quad \operatorname{require}(\operatorname{fixtureParity}(c));\quad\operatorname{predictPeakMemory}(c).\\
3.&\quad \text{Train at most }K_c\text{ committed steps and declared resource ceiling; log rejected steps}.\\
4.&\quad \text{At prespecified checkpoints, evaluate utility, compliance, retention and calibration on validation}.\\
5.&\quad \text{Reject a checkpoint if any acceptance constraint fails or a required metric is missing}.\\
6.&\quad \hat c\leftarrow\operatorname{SelectByDeclaredUtility}(\text{accepted validation records}).\\
7.&\quad \text{If empty, return none; otherwise evaluate }\hat c\text{ once on untouched final test}.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] The invariant is that no candidate consumes another candidate's optimizer, RNG or validation-derived curriculum state. Finite candidates and step ceilings ensure termination. Search cost is the sum of candidate training and validation costs, not the winner's cost. A checkpoint rejected for retention may remain informative but cannot be relabeled a successful adaptation. A final test used to revise the grid becomes validation and requires a new held-out test.

## Implementation

[DERIVED] **Hugging Face TRL**, §4 #29, Post-training / RL, is the pinned orchestration boundary [R31.1]. The recipe must pin its model/processor dependencies separately; a library release does not lock a complete environment. Inspect target labels before enabling packing, attention kernels or mixed precision. Gradient accumulation must preserve §31.1's denominator, and checkpoint/recovery follows Chapter 30. Parameter-efficient adaptation requires the canonical tensor/scale manifest from Chapter 23, even when the trainer accepts a compact adapter config.

[DERIVED] Resource reporting separates parameter count, consumed target/context tokens, estimated architecture-specific FLOPs, persistent/peak memory, gradient/gather traffic, exposed latency and measured throughput. Joules and currency remain UNVERIFIED without device-energy and allocation records. A decrease in trainable parameters alone establishes none of those latter quantities.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Post-Training Science sweeps Qwen3/Llama base models across four anonymized customer tasks, using 5,000 examples, assistant-only targets, one epoch, fixed splits/seeds and LoRA/full-tuning arms. Its rank-64, alpha-32 all-linear LoRA grid crosses batch 8/16/32/64 with learning rates; full tuning uses a smaller grid. Selection admits only cells beating the base validation NLL. Sections 2–3 report a broad LoRA optimum near $10^{-3}$ and rank saturation in that testbed; §7's separate 1/2/4/8-epoch runs show validation loss and general instruction-following diverging from task-judge scores. Customer data/evaluators and selection eligibility limit transfer. [R31.6], §§2.1–3.3, 7, Appendices A–D.

[PAPER-REPORTED] The long-CoT repetition study instead uses Qwen3-4B/8B and Olmo3-7B, nested filtered first-turn Dolci subsets, batch one, BF16, 8-bit Adam, cosine schedules and 10% warmup. It matches update budgets up to 51,200, with independent schedules per run, on one H100 94GB. AIME uses 16 generations/problem and GPQA four; outputs can reach 30,000 tokens. It reports a repetition advantage, saturation near memorization and no additional forgetting on its measured suite. Its learning rate is selected using benchmark accuracy, a selection/assessment entanglement that limits an untouched-test interpretation. [R31.7], §§2–4, Appendices A–B.

## Observations

**What the paper claims.** [PAPER-REPORTED] The two 2026 studies favor different repetition regimes on their different tasks and selection metrics. [R31.6; R31.7]

**What the evidence shows.** [DERIVED] A customer task judged by a target-aligned evaluator and long-CoT competition performance are different axes; matching optimizer updates also does not match tokens when lengths differ.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 31.15 exposes what a repeated-data comparison actually holds fixed. There is no mathematical universal epoch ceiling.

**What remains unknown.** [UNVERIFIED] The winning regime for this unexecuted recipe and its end-to-end cost require an independent matched protocol.

## Failure modes

> **Failure mode — Adapter count illusion.** *Symptom:* optimizer memory is much larger than expected. *Cause:* all-expert or auxiliary trainable modules omitted from counting. *Detection:* tensor-level trainable inventory. *Mitigation:* use Eq. 31.13 per actual matrix and count other modules separately. [MATHEMATICALLY-DERIVED]

> **Failure mode — Search contamination.** *Symptom:* the final reported benchmark also chose the learning rate. *Cause:* using the assessment set as a selector. *Detection:* decision log. *Mitigation:* label it validation and acquire an independent final assessment. [DERIVED]

```figure
id: fig-31.23
kind: compare
title: Recipe budget equivalence
caption: No single budget axis fixes every confound; report the complete comparison record.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.15
alt: 'Comparison on What remains fixed across candidate runs. Unique data: epochs=may differ, steps=may differ, tokens=may
  differ. Optimizer transitions: epochs=depends on n and G, steps=fixed, tokens=depends on batch mass. Input compute: epochs=not
  fixed, steps=not fixed, tokens=not fixed if context differs'
spec:
  axis: What remains fixed across candidate runs
  columns:
  - id: epochs
    label: Equal epochs
  - id: steps
    label: Equal steps
  - id: tokens
    label: Equal target mass
  rows:
  - dimension: Unique data
    values:
      epochs: may differ
      steps: may differ
      tokens: may differ
  - dimension: Optimizer transitions
    values:
      epochs: depends on n and G
      steps: fixed
      tokens: depends on batch mass
  - dimension: Input compute
    values:
      epochs: not fixed
      steps: not fixed
      tokens: not fixed if context differs
```

```figure
id: fig-31.24
kind: diagram
title: Recipe state and acceptance
caption: Checkpoint selection uses a validation vector; an untouched test assesses the selected artifact only after choices
  are frozen.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.15
alt: The information path is Immutable population, then Candidate configuration, then Independent run state, then Bounded
  training, then Validation vector, then Final held-out test. Checkpoint selection uses a validation vector; an untouched
  test assesses the selected artifact only after choices are frozen.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: dataset
    label: Immutable population
    sub: mask and split hashes
  - id: n1
    kind: branch
    label: Candidate configuration
    sub: parameterization and schedule
  - id: n2
    kind: state
    label: Independent run state
    sub: weights optimizer RNG sampler
  - id: n3
    kind: process
    label: Bounded training
    sub: committed and failed steps
  - id: n4
    kind: metric
    label: Validation vector
    sub: utility and constraints
  - id: n5
    kind: boundary
    label: Final held-out test
    sub: one selected artifact
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n2
    to: n3
  - from: n3
    to: n4
  - from: n4
    to: n5
```

## Siblings

[DERIVED] [Parameter-efficient adaptation](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/README.md) changes update parameterization. [Continued training](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/README.md) targets a different data/objective population. Retrieval changes inference context rather than this optimizer trajectory. Their comparison requires a common task and total adaptation cost.

## Extensions

### Improvements

[DERIVED] The inspected studies supply empirical interventions for learning rate, rank, repetitions and fresh data, with workload-specific outcomes. They do not establish that newer tuning always dominates older parameterizations. For curriculum changes, the necessary improvement evidence is a controlled change in sampling rule at fixed information boundary and reported target exposure; no such result is invented here.

## Limitations

[MATHEMATICALLY-DERIVED] Local quadratic stability does not characterize adaptive optimizer dynamics, heavy-tailed gradients or sequence-distribution shift. Storage identities do not predict memory fragmentation. The anonymous-task study cannot provide a public recipe for undisclosed customer data. Repetition gains on tiny competition sets do not establish broad domain retention or privacy protection.

## Reproducibility

[DERIVED] Retain exact trainable tensors, factor scaling, initialization, mask hashes, population/sampling schedule, consumed identities, committed/rejected step counts, checkpoint-selection metric, optimizer states and runtime dependencies. Record all failed candidates. No named model's recipe is inferred from the analytical examples or recommended as universally optimal.

## References

[R31.1] Versioned trainer boundary. [R31.6] Customer-task recipe sweeps. [R31.7] Long-CoT repetition study. First-publication/version/access records are in [references](references.md).
