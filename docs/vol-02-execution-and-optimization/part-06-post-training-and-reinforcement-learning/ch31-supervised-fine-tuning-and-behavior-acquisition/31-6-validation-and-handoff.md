---
id: ms.section.31.6
entity_type: section
title: Validation and handoff
short_title: Validation and handoff
volume: 2
part: 6
chapter: 31
section: '31.6'
slug: 31-6-validation-and-handoff
parent: ms.chapter.31
prev_sibling: ms.section.31.5
next_sibling: null
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

# 31.6 — Validation and handoff

## Scope

[DERIVED] This section owns SFT acceptance and handoff: task utility, instruction compliance, retained domain capabilities, calibration and compatibility with later preference/RL stages. It does not teach the downstream objectives, which belong to Chapters 32–36. The output is a checkpoint package with immutable interfaces, disjoint evaluation records and explicit unsupported claims. A manuscript compilation is not a model validation, and a benchmark score is not a scientific review rating.

## Why this exists

[MATHEMATICALLY-DERIVED] Different validation quantities answer different questions. Teacher-forced NLL measures fit to supplied tokens. Task success measures a generated artifact under a checker. Instruction compliance measures constraints on that artifact. Retention compares a fixed old-task distribution. Calibration compares a declared confidence variable to correctness events. None is algebraically determined by the others. Selecting by one scalar and claiming all five improve is an unsupported inference.

[DERIVED] Handoff adds interface obligations. The downstream stage needs the exact tokenizer, template, masks, termination policy, adapters and parameter revision that produced the checkpoint. A reward model may expect a complete answer while a policy emits a reasoning channel plus answer; a reference policy may score different token boundaries. Those mismatches can change the optimized quantity or invalidate cached scores without producing an obvious tensor-shape error.

## Intuition

[MATHEMATICALLY-DERIVED] A probability must name its event and conditioning information. The probability of an answer token after a supplied reasoning trace is not generally the probability that the answer is correct before that trace is generated. Once the trace commits to a label, predicting that label can be easy even when the trace's conclusion is wrong. Likewise, a verbal confidence string is a generated claim, not automatically a calibrated estimate.

[MATHEMATICALLY-DERIVED] A complete validation vector is a constrained decision, not a ranking of model brands. Required-domain deterioration cannot be offset by an unrelated utility gain unless that tradeoff was explicitly authorized in the acceptance rule. A missing required metric prevents acceptance. The scientific evidence boundary is therefore part of the package: what was evaluated, what was inferred mathematically and what remains unexecuted.

## Formulation

| Object | Meaning | Required declaration |
|---|---|---|
| $q_i$ | Predicted class distribution | Atomic class encoding and normalization |
| $y_i$ | Observed correctness/class outcome | Independent checker and dataset boundary |
| $\hat p_i$ | Confidence used for abstention | Raw token, class-normalized or other estimator |
| $U$ | Task utility | Unit, timeout/retry and partial-credit policy |
| $\Delta_j$ | Retention change for required domain $j$ | Same task/decoder/checker before and after |
| $\pi_{\rm ref}$ | Frozen downstream reference distribution | Exact checkpoint, conditioning and support |

[MATHEMATICALLY-DERIVED] For normalized finite-class probabilities, two proper-score identities can be derived directly. The Brier score's conditional expectation separates irreducible label variation from probability error:

$$
\operatorname{BS}=\frac1n\sum_i\sum_{v=1}^{K}(q_{iv}-\mathbf1[y_i=v])^2,\qquad\mathbb E[\operatorname{BS}\mid x]=1-\lVert p^*(\cdot\mid x)\rVert^2+\lVert q(\cdot\mid x)-p^*(\cdot\mid x)\rVert^2.
$$
*(Eq. 31.21)*

where the second identity is for one input with true class distribution $p^*$; it follows by expanding the square and taking the expectation of the one-hot label. It does not supply $p^*$ in an actual evaluation.

```figure
id: fig-31.31
kind: diagram
title: Validation quantities and package boundary
caption: The package is accepted only against predeclared constraints; interface hashes prevent silently rescoring a different
  policy.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.23
alt: The information path is Candidate checkpoint, then Frozen evaluation protocol, then Utility and compliance, then Retention
  and calibration, then Acceptance constraints, then Handoff package. The package is accepted only against predeclared constraints;
  interface hashes prevent silently rescoring a different policy.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: model
    label: Candidate checkpoint
    sub: exact revision and adapters
  - id: n1
    kind: process
    label: Frozen evaluation protocol
    sub: tasks templates decoding
  - id: n2
    kind: metric
    label: Utility and compliance
    sub: generated outputs
  - id: n3
    kind: metric
    label: Retention and calibration
    sub: per-domain vector
  - id: n4
    kind: branch
    label: Acceptance constraints
    sub: missing means unresolved
  - id: n5
    kind: boundary
    label: Handoff package
    sub: reference and interface hashes
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

## Mechanism

### Methodology

[DERIVED] Freeze the evaluation task groups before candidate selection. Task utility should require the actual requested artifact: executed code, verified answer, schema-valid call plus environment result, or independently annotated multimodal answer. Count failures, timeouts and refusals according to a declared policy. Instruction compliance needs its own predicates, including output-length constraints, allowed tools and required evidence. Retention uses the same assessment before and after SFT; changing prompts or sampling temperature changes the comparison.

[MATHEMATICALLY-DERIVED] For a class represented by several possible token strings, the probability of the class is a sum over disjoint accepted strings under a declared termination convention. A single selected-token probability does not equal that mass. If evaluation renormalizes scores over a small allowed label set, it estimates a conditional distribution given membership in that set. It must also report the probability mass outside the set or invalid-generation frequency; renormalization can conceal refusal or malformed-output behavior.

[MATHEMATICALLY-DERIVED] Let $r$ be a complete generated reasoning trace and $d$ an atomic decision. The decision probability before observing the trace is a marginal:

$$
p_\theta(d\mid x)=\sum_rp_\theta(r\mid x)p_\theta(d\mid x,r),\qquad p_\theta(d\mid x,r)\ne\Pr(\text{decision correct}\mid x)\ \text{in general}.
$$
*(Eq. 31.22)*

where the sum ranges over a properly normalized finite trace space or a terminating countable process; truncation/forced termination must be included in the event definition.

```figure
id: fig-31.32
kind: calculator
title: Trace-conditional versus marginal confidence
caption: Illustrative two-family trace space, not a measured model. Near-certain conditional extraction can coexist with uncertain
  marginal choice.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.22
alt: Adjust the declared illustrative inputs; marginal decision probability=w*p1+(1-w)*p2, difference from trace-one probability=p1-(w*p1+(1-w)*p2).
  Illustrative two-family trace space, not a measured model. Near-certain conditional extraction can coexist with uncertain
  marginal choice.
spec:
  tex: p(d\mid x)=w p_1+(1-w)p_2
  equation: '31.22'
  inputs:
  - symbol: w
    label: trace-family one probability
    default: 0.5
    min: 0
    max: 1
    format: fixed3
    step: 0.01
  - symbol: p1
    label: decision probability after trace one
    default: 0.99
    min: 0
    max: 1
    format: fixed3
    step: 0.01
  - symbol: p2
    label: same decision after trace two
    default: 0.01
    min: 0
    max: 1
    format: fixed3
    step: 0.01
  outputs:
  - symbol: marg
    label: marginal decision probability
    formula: w*p1+(1-w)*p2
    format: fixed3
    emphasis: true
  - symbol: gap
    label: difference from trace-one probability
    formula: p1-(w*p1+(1-w)*p2)
    format: fixed3
    emphasis: false
anchor: formulation
states:
- anchor: formulation
  label: Conflicting traces
  variables:
    w: 0.5
  highlight:
  - marg
  - gap
  note: The two trace families support opposite decisions.
- anchor: mechanism
  label: Skewed trace mass
  variables:
    w: 0.9
  highlight:
  - marg
  note: Marginal confidence changes with trace probability, not just final-token extraction.
```

[DERIVED] Calibration estimation then fixes the confidence variable, binning rule, task distribution and grouping unit. A reliability diagram should be accompanied by sample counts and the confidence distribution. Equal-width and equal-count bins answer different finite-sample questions; neither should be changed post hoc to make a curve look diagonal. Evaluate proper scores and utility at selected coverage alongside a binned calibration statistic. A confidence estimator can look calibrated on an easy population while failing a difficult required subgroup.

[MATHEMATICALLY-DERIVED] A constrained acceptance rule can be written without inventing a universal utility function. Given predeclared thresholds, accept only when each required quantity is available and passes its condition:

$$
\operatorname{Accept}(c)=\mathbf1[U_c\ge u_{\min}]\prod_j\mathbf1[\Delta_{cj}\ge-\delta_j]\mathbf1[\operatorname{Cal}_c\le\kappa]\mathbf1[\operatorname{Cost}_c\le B]\mathbf1[\operatorname{Complete}(c)].
$$
*(Eq. 31.23)*

where thresholds are chosen protocol inputs, not research findings; uncertainty-aware acceptance must specify which confidence bounds or noninferiority procedure replaces each point estimate.

```figure
id: fig-31.33
kind: compare
title: Acceptance dimensions
caption: These axes form a decision vector; a scalar loss cannot certify all of them.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.23
alt: 'Comparison on What each evaluation axis can certify. Conditioning: nll=supplied target histories, task=generated trajectories,
  retain=fixed prior-task population, cal=declared confidence event. Positive outcome: nll=better fit to targets, task=more
  accepted artifacts, retain=bounded task decline, cal=probabilities align with outcomes. Does not establish: nll=deployment
  correctness, task=all-domain retention, retain=truth everywhere, cal=high accuracy'
spec:
  axis: What each evaluation axis can certify
  columns:
  - id: nll
    label: Teacher-forced NLL
  - id: task
    label: Task utility
  - id: retain
    label: Domain retention
  - id: cal
    label: Calibration
  rows:
  - dimension: Conditioning
    values:
      nll: supplied target histories
      task: generated trajectories
      retain: fixed prior-task population
      cal: declared confidence event
  - dimension: Positive outcome
    values:
      nll: better fit to targets
      task: more accepted artifacts
      retain: bounded task decline
      cal: probabilities align with outcomes
  - dimension: Does not establish
    values:
      nll: deployment correctness
      task: all-domain retention
      retain: truth everywhere
      cal: high accuracy
```

[DERIVED] Handoff requires two kinds of state. The policy state includes model tensors, adapters, precision/merge convention, tokenizer and template. The learning-state package includes optimizer/scheduler state if resumed, sampler position, curriculum state and checkpoint-selection record. A downstream method may intentionally start with a new optimizer; that is a declared transition rather than an accidental omission. Reward/verifier inputs, reasoning-channel visibility and generation termination must be specified before collecting the next stage's data.

[MATHEMATICALLY-DERIVED] When two autoregressive policies share the same complete finite sequence space and support, sequence KL decomposes by the chain rule. Substituting probability products into the log ratio and exchanging a finite sum with expectation gives:

$$
\operatorname{KL}(\pi_\theta\Vert\pi_{\rm ref})=\mathbb E_{y\sim\pi_\theta}\left[\sum_t\log\frac{\pi_\theta(y_t\mid x,y_{<t})}{\pi_{\rm ref}(y_t\mid x,y_{<t})}\right].
$$
*(Eq. 31.24)*

where the reference is positive wherever the policy has mass; both distributions use identical token/termination support. A masked partial-token sum or differently truncated generation is not automatically this sequence KL.

```figure
id: fig-31.34
kind: tensor-flow
title: Reference-score interface trace
caption: Cached scores are meaningful only for the same token sequence, legal prefix, target support and reference revision.
  A differently masked sum is a different quantity.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.24
alt: A batch of token sequences maps to legal contexts and target positions, then policy/reference log probabilities, token
  log ratios and sequence sums. The trace preserves batch and sequence identity.
spec:
  dims:
    B: sequences
    T: sequence positions
    R: selected response positions
  steps:
  - shape: '[B, T]'
    label: rendered token identifiers
  - shape: '[B, R]'
    op: gather declared complete-response targets
    cost: retain prefix and termination identity
  - shape: '[B, R]'
    op: policy and frozen reference log probabilities
    cost: two model scoring boundaries
  - shape: '[B]'
    op: sum token log ratios
    cost: sequence identity preserved
```

[MATHEMATICALLY-DERIVED] Freezing parameters is not enough to freeze the reference distribution if tokenizer, template, sampling constraints or termination support changes. Cached reference log probabilities also depend on the complete prefix. A cache keyed only by answer text can therefore return a different conditional score for the same token sequence under another prompt. Downstream Chapters 33–35 own the choice of reference regularization and estimator; this section hands them a distributionally well-defined artifact.

## Algorithm

### Algorithm 31.6 — Freeze and hand off a validated SFT artifact

[DERIVED] Inputs are candidate records, predeclared constraints and immutable downstream interface fixtures. Output is a signed-off package candidate or rejection record; no organizational approval is implied by schema validation.

$$
\begin{aligned}
1.&\quad \operatorname{verify}(\text{source-group splits, mask fixtures, evaluation completeness}).\\
2.&\quad \operatorname{compute}(U,\Delta,\operatorname{Cal},\operatorname{Cost});\quad\operatorname{apply}(\text{declared uncertainty rule}).\\
3.&\quad \text{If any required constraint fails or is missing, return rejected with reason}.\\
4.&\quad P\leftarrow\operatorname{Freeze}(\theta,\text{adapters, tokenizer, template, termination, revisions}).\\
5.&\quad \operatorname{replay}(\text{training/inference/reference-scoring interface fixtures},P);\quad\text{any required failure}\Longrightarrow\operatorname{return\_rejected}.\\
6.&\quad \text{Invalidate caches with mismatched prefix, mask, support or revision hashes}.\\
7.&\quad \operatorname{return}(P,\text{evaluation vectors, evidence gaps, downstream data contract}).
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] The invariant is that every cached score and evaluation refers to the frozen package and declared conditioning. Finite fixture replay terminates. Packaging costs linear time in serialized state bytes plus fixture inference; full evaluation costs include all candidate/seed generations, reference scoring and external validators. A rejected package cannot be made accepted by deleting an inconvenient domain from its record.

## Implementation

[DERIVED] **Hugging Face TRL**, §4 #29, Post-training / RL, is the inspected SFT boundary [R31.1]. Subsequent preference/RL trainers are not assumed to share every loss or sequence convention. Export adapter provenance with the underlying base revision, and retain merge/dtype details if materializing full weights. Check that training, serving and reference scoring render identical fixture prefixes. Distributed optimizer checkpoints remain the reliability boundary in Chapter 30.

[MATHEMATICALLY-DERIVED] The package's storage cost includes every artifact necessary to reconstruct the policy, not just adapter factors. Reference scoring adds a second forward-model boundary when no valid cache exists. Communication depends on inference placement and external tool/judge calls. Token throughput cannot replace accepted-task throughput when failures or verbosity differ. Energy and currency require an executor's measured allocation; no such measurement was performed here.

```figure
id: fig-31.35
kind: stat-panel
title: Handoff scoring budget
caption: Illustrative finite assessment plan. Shared-prefix reuse and kernel costs are not assumed; reference scoring and
  generation are distinct work.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.24
alt: 'Analytical readout: generation attempts=Tasks*Repeats, response tokens for reference scoring=Tasks*Repeats*MeanResponse,
  prefix plus response scoring tokens=Tasks*Repeats*(MeanPrefix+MeanResponse). Illustrative finite assessment plan. Shared-prefix
  reuse and kernel costs are not assumed; reference scoring and generation are distinct work.'
spec:
  header: HANDOFF SCORING BUDGET
  variables:
    Tasks: 500
    Repeats: 4
    MeanResponse: 1024
    MeanPrefix: 2048
  rows:
  - key: generation attempts
    formula: Tasks*Repeats
    format: fixed3
  - key: response tokens for reference scoring
    formula: Tasks*Repeats*MeanResponse
    format: fixed3
  - key: prefix plus response scoring tokens
    formula: Tasks*Repeats*(MeanPrefix+MeanResponse)
    format: fixed3
anchor: implementation
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] The decision-calibration study uses Qwen3-1.7B/4B/8B, 500 training examples per in-domain CommonsenseQA or moderation task, and OpenBookQA/XSTest as out-of-domain assessments. SFT directly targets the final decision; GRPO generates reasoning, so accuracy differences are not isolated to optimizer choice. LoRA rank 16/alpha 32/dropout .1 runs on four A100 40GB devices; unspecified hyperparameters use TRL defaults without a complete version lock. Confidence is the final-token probability; equal-count bins are used despite the “ECE” label. Table 1's Qwen3-1.7B CSQA SFT/GRPO accuracy is 68.55/73.67 and calibration error 7.36/24.39. [R31.9], §§2–4, Table 1, Appendix B.

[PAPER-REPORTED] Magic Correlations compares 240M/1B decoder models over nine pretraining mixtures and 20 benchmarks. SFT uses tulu-v2-mix, BF16, batch 256, length 4,096, cosine schedules and 6,365/12,730 steps with learning rates $2\times10^{-5}$/$10^{-5}$. Its accuracy/confidence cross-stage correlations vary by domain and scale; correlation is not a calibration guarantee. Larger-scale transfer, alternative SFT protocols and complete hardware/seed reconstruction are unresolved here. [R31.10], §§3–4, Appendix A/B.1–B.4/C.

## Observations

**What the paper claims.** [PAPER-REPORTED] The studies report distinct behavior of accuracy, confidence and calibration under their disclosed post-training protocols. [R31.9; R31.10]

**What the evidence shows.** [DERIVED] Final-token extraction confidence and cross-model confidence correlation are different variables; neither can certify unrestricted factual reliability.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 31.22 explains why trace-conditional confidence needs its own calibration assessment, while Eq. 31.24 explains why a reference must preserve support and context.

**What remains unknown.** [UNVERIFIED] This chapter's candidate checkpoint, downstream compatibility and calibrated deployment behavior remain unexecuted requirements.

## Failure modes

> **Failure mode — Wrong confidence event.** *Symptom:* near-certain answer tokens coexist with frequent wrong answers. *Cause:* confidence conditions on a committed trace or renormalizes away invalid mass. *Detection:* specify and test the actual probability event. *Mitigation:* calibrate that event on disjoint data and report coverage/invalid outputs. [MATHEMATICALLY-DERIVED]

> **Failure mode — Stale reference cache.** *Symptom:* preference/RL ratios change after a template migration. *Cause:* cached scores belong to another conditional distribution. *Detection:* prefix/support/revision hash mismatch. *Mitigation:* invalidate and rescore before optimization. [MATHEMATICALLY-DERIVED]

## Siblings

[DERIVED] [Failure diagnosis](31-5-behavioral-failure-modes.md) establishes the observed defect; this section establishes acceptance and interface closure. Chapter 32 owns verifiers/reward calibration and Chapter 33 preference optimization. A new reward model cannot retroactively validate an SFT evaluation whose test data leaked into selection.

```figure
{
  "id": "fig-31.36",
  "kind": "chart",
  "title": "The same extracted confidence can imply different marginals",
  "caption": "Analytical trace mixture: decision probability is0.99 after trace family one and0.01 after family two. Altering the trace mixture changes the marginal from0.0198 to0.9802 while the trace-one conditional stays0.99. These are specified categorical probabilities, not calibrated model measurements.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-31.22",
  "alt": "Three trace-mixture settings have marginal probabilities0.0198,0.5,0.9802; every setting has conditional probability0.99 after trace family one.",
  "spec": {
    "type": "bar",
    "x": {
      "label": "Probability assigned to trace family one"
    },
    "y": {
      "label": "Probability of the fixed decision",
      "domain": [
        0,
        1
      ],
      "ticks": [
        0,
        0.25,
        0.5,
        0.75,
        1
      ]
    },
    "categories": [
      "0.01",
      "0.50",
      "0.99"
    ],
    "series": [
      {
        "id": "marginal",
        "label": "Marginal decision probability",
        "values": [
          0.0198,
          0.5,
          0.9802
        ],
        "emphasis": true
      },
      {
        "id": "conditional",
        "label": "Conditional on trace family one",
        "values": [
          0.99,
          0.99,
          0.99
        ]
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The inspected 2026 calibration intervention belongs to downstream RL methodology; this chapter uses its SFT/RL comparison to delimit confidence claims. A later preference or reward stage can improve task utility and still require a fresh calibration/retention audit. The acceptance vector and package hashes provide continuity across stages without assuming monotonic improvement.

## Limitations

[MATHEMATICALLY-DERIVED] Finite validation samples do not establish all deployment conditions. Source-group uncertainty, calibration under shift and tail task cost must be evaluated at their own boundaries. The complete-sequence KL identity is not a proof that a practical masked estimator is unbiased. Scientific review can reject missing evidence even when all manuscript schemas compile correctly.

## Reproducibility

[DERIVED] Deliver the checkpoint/base/adapter hashes, tokenizer/template/processor revisions, termination and mask fixtures, source-group splits, candidate-selection log, all outcome vectors, uncertainty procedure and downstream scoring cache keys. Missing metrics remain unresolved; no “10/10” rating is asserted. The package is manuscript specification, not an executed model handoff.

## References

[R31.9] Decision calibration v1, protocol and Table 1. [R31.10] Magic Correlations v1, cross-stage protocols and Appendix B. [R31.1] Versioned SFT training boundary. All inspected 2026-10-09; full records in [references](references.md).
