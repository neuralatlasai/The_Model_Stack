---
id: ms.section.31.5
entity_type: section
title: Behavioral failure modes
short_title: Behavioral failure modes
volume: 2
part: 6
chapter: 31
section: '31.5'
slug: 31-5-behavioral-failure-modes
parent: ms.chapter.31
prev_sibling: ms.section.31.4
next_sibling: ms.section.31.6
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

# 31.5 — Behavioral failure modes

## Scope

[DERIVED] This section owns SFT-specific behavioral failures: stylistic overfitting, loss of base capabilities, fabricated tool calls/results, verbose imitation and demonstration leakage. It separates a mathematical failure mechanism from a source-reported failure rate. The output is a falsifiable failure inventory linked to masks, data and checkpoint selection. Security architecture, authorization and general evaluation design remain in their canonical chapters; a training objective cannot replace a runtime boundary.

## Why this exists

[MATHEMATICALLY-DERIVED] Conditional imitation rewards agreement with the supplied target at supplied histories. It contains no automatic term for preserving an unrelated base capability, for executing a tool rather than writing its output, or for avoiding an exact memorized demonstration. If those properties matter, they must enter the data contract, explicit constraints, independent tests or runtime enforcement. A declining training loss is compatible with each failure because the optimized measure and deployment utility differ.

[DERIVED] Failure analysis must preserve the trigger and observable symptom. “Overfitting” is too broad to explain a model that adopts a teacher's formatting while losing task robustness, a model that repeats long traces without reaching a final answer, and a model that recalls a contaminated benchmark answer. These require different interventions. A single aggregate accuracy can conceal one failure while another improvement raises the mean.

## Intuition

[MATHEMATICALLY-DERIVED] The gradient of the new task need not align with the gradient of a retained task. A parameter update can decrease the new objective and increase the old objective simultaneously. Limiting step norm bounds some local changes under smoothness conditions, but does not guarantee that the update direction preserves an arbitrary capability. Likewise, a low-rank restriction limits reachable directions without identifying which directions contain retained behavior.

[MATHEMATICALLY-DERIVED] Teacher forcing exposes the model to demonstration histories. During generation, an early deviation changes the next conditioning state. Even if the target action is reliable at demonstrated states, no mathematical conclusion follows at unseen states without a coverage condition. Tool observations make this particularly concrete: a failed call places the model on a branch absent from a success-only dataset. Writing the expected successful observation does not restore the actual environment state.

## Formulation

| Quantity | Meaning | Evaluation boundary |
|---|---|---|
| $\mathcal L_{\rm old}$ | Retained-task loss | Fixed held-out old-task population |
| $g_{\rm new}$ | Gradient of the admitted SFT objective | One declared normalized step |
| $H$ | Upper bound on old-loss Hessian operator norm | Along the complete update segment |
| $e$ | Conditional failure probability per decision | Defined under the actual rollout distribution |
| $h$ | Finite number of decisions | Truncation and termination rule fixed |
| $\rho$ | Pairwise correlation in an analytical cluster model | Not inferred from token overlap |

[MATHEMATICALLY-DERIVED] If the old loss is twice differentiable and its Hessian norm along the update is bounded by $H$, an SGD step obeys:

$$
\mathcal L_{\rm old}(\theta-\eta g_{\rm new})-\mathcal L_{\rm old}(\theta)\le-\eta\langle\nabla\mathcal L_{\rm old},g_{\rm new}\rangle+\tfrac12H\eta^2\lVert g_{\rm new}\rVert^2.
$$
*(Eq. 31.17)*

where the inequality follows by integrating the second derivative along the update segment; it is a local smoothness bound, not a certified constant for any named model.

```figure
id: fig-31.25
kind: diagram
title: Behavioral failure causal chain
caption: The training objective and the deployed task measure occupy distinct boundaries; each failure must be assigned to
  a testable transition.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.17
alt: The information path is Demonstration population, then Masked imitation, then Parameter update, then Generated histories,
  then Independent task tests. The training objective and the deployed task measure occupy distinct boundaries; each failure
  must be assigned to a testable transition.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: dataset
    label: Demonstration population
    sub: styles and visited states
  - id: n1
    kind: objective
    label: Masked imitation
    sub: target measure
  - id: n2
    kind: process
    label: Parameter update
    sub: direction and magnitude
  - id: n3
    kind: model
    label: Generated histories
    sub: new conditioning states
  - id: n4
    kind: boundary
    label: Independent task tests
    sub: retention tools leakage
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n2
    to: n3
  - from: n3
    to: n4
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Expand the old loss along $\theta(s)=\theta-s\eta g_{\rm new}$. Its first derivative at zero is the negative gradient inner product, while the integrated second derivative is bounded by $H\eta^2\lVert g_{\rm new}\rVert^2/2$. If the gradients oppose, the first-order term already predicts an increase in retained loss. If they align, the bound can be negative for a sufficiently small step, but it remains local. Large-scale optimizer preconditioning and momentum replace the raw gradient with another direction; the same path argument applies to that actual direction, not to a theorem silently transferred from SGD.

[DERIVED] Style overfitting is tested by task-preserving changes to presentation: shorter requested answers, alternate valid schemas, different instruction placement or removal of a repeated teacher phrase. Define which transformation preserves task semantics; otherwise a “style perturbation” can change the task. Evaluate utility and compliance separately. A model that produces the usual verbose answer after an explicit concise instruction fails compliance even if an answer extractor finds the correct result.

[MATHEMATICALLY-DERIVED] Repeating boilerplate adds supervision mass and can dominate token-mean learning. End-of-turn targets control a stopping event, but a longer demonstration gives more nonterminal prediction terms before that event. This is an allocation effect, not a theorem that token likelihood necessarily produces long answers. To establish a verbosity problem, report generated length conditional on success, truncation rate and requested output constraints; a raw average mixes useful reasoning with failed endless generation.

[MATHEMATICALLY-DERIVED] For a finite horizon, a union bound needs no independence. If every conditional decision failure probability is bounded by $e$ along the actual surviving rollout, failure before completion is at most $he$, capped at one. The familiar product is exact only under an explicitly constant conditional hazard:

$$
\Pr(\text{any failure by }h)\le\min(1,he),\qquad \Pr(\text{failure})=1-(1-e)^h\quad\text{under constant conditional hazard }e.
$$
*(Eq. 31.18)*

where teacher-forced error on demonstration states is not the required rollout-hazard bound; no empirical failure probability is inserted into this analytical example.

```figure
id: fig-31.26
kind: calculator
title: Finite-horizon error accumulation
caption: Chosen analytical inputs, not a measured model. Constant conditional hazard gives the product; the union bound uses
  only a valid per-step bound.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.18
alt: Adjust the declared illustrative inputs; constant-hazard failure probability=1-(1-err)^horizon, union-bound ceiling=min(1,err*horizon).
  Chosen analytical inputs, not a measured model. Constant conditional hazard gives the product; the union bound uses only
  a valid per-step bound.
spec:
  tex: P=1-(1-e)^h
  equation: '31.18'
  inputs:
  - symbol: err
    label: illustrative conditional error probability
    default: 0.01
    min: 0
    max: 0.2
    format: fixed3
    step: 0.01
  - symbol: horizon
    label: decision horizon
    default: 20
    min: 1
    max: 200
    format: integer
    step: 1
  outputs:
  - symbol: exact
    label: constant-hazard failure probability
    formula: 1-(1-err)^horizon
    format: fixed3
    emphasis: true
  - symbol: bound
    label: union-bound ceiling
    formula: min(1,err*horizon)
    format: fixed3
    emphasis: false
anchor: formulation
states:
- anchor: formulation
  label: Short horizon
  variables:
    horizon: 20
  highlight:
  - exact
  note: The illustrative hazard compounds over a finite trajectory.
- anchor: failure-modes
  label: Long horizon
  variables:
    horizon: 100
  highlight:
  - exact
  - bound
  note: This does not substitute teacher-forced loss for rollout error.
```

[DERIVED] Tool-call fabrication has at least three contracts: syntactically parseable call, schema-valid arguments and externally executed state change. A call may pass the first two and still target a nonexistent record or unauthorized operation. SFT can teach format and observed recovery behavior, but only the executor can attest an actual return. Preserve call identifiers and invocation/result pairing. During evaluation, a model-generated success string without a matching execution event is a failure even when its wording matches the demonstration.

[MATHEMATICALLY-DERIVED] Demonstration leakage contaminates the assessment population. A held-out row is not independent if a near-duplicate source problem, repository patch or paraphrased answer appears in training. To show why raw row count can misstate uncertainty, consider equal-variance observations grouped in clusters of $m$ with within-cluster correlation $\rho$ and independent clusters. The variance of their average equals the independent-row variance multiplied by $1+(m-1)\rho$, giving:

$$
n_{\rm eff}=\frac{n}{1+(m-1)\rho}.
$$
*(Eq. 31.19)*

where this is an exchangeable equal-variance cluster model with admissible correlation; it is not a deduplication score or a measured leakage rate, and variable cluster sizes require a different calculation.

```figure
{
  "id": "fig-31.27",
  "kind": "chart",
  "title": "Clustered assessment uncertainty",
  "caption": "Illustrative 1,000-row equal-variance assessment with independent clusters. Correlation assumptions are analytical, not estimated from any dataset.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-31.19",
  "alt": "Analytical curves: clusters of ten equals 1000/(1+9*x), clusters of one hundred equals 1000/(1+99*x). Illustrative 1,000-row equal-variance assessment with independent clusters. Correlation assumptions are analytical, not estimated from any dataset.",
  "spec": {
    "type": "line",
    "x": {
      "label": "within-cluster correlation",
      "scale": "linear",
      "domain": [
        0,
        1
      ]
    },
    "y": {
      "label": "effective independent rows",
      "scale": "linear",
      "domain": [
        0,
        1000
      ]
    },
    "series": [
      {
        "id": "s0",
        "label": "clusters of ten",
        "formula": "1000/(1+9*x)",
        "sample": {
          "to": 1,
          "count": 201,
          "from": 0
        }
      },
      {
        "id": "s1",
        "label": "clusters of one hundred",
        "formula": "1000/(1+99*x)",
        "sample": {
          "to": 1,
          "count": 201,
          "from": 0
        }
      }
    ],
    "annotations": [
      {
        "x": 0.1,
        "y": 91.74311926605505,
        "label": "100-row clusters: about92 effective rows"
      }
    ]
  }
}
```

[DERIVED] Audit leakage by source identity and task lineage before training, retain overlap findings and exclude contaminated assessments from claims about generalization. A string-matching detector is insufficient to prove absence of semantic overlap. Conversely, overlap in common boilerplate does not establish answer leakage. Evidence must identify what information could reveal the assessed target and whether the evaluator's expected answer was available in the training lineage.

[MATHEMATICALLY-DERIVED] A controlled counterfactual pair can quantify sensitivity without treating a stylistic preference as correctness. For $n$ paired task-preserving transformations and a fixed utility function $U$, define:

$$
\Delta_{\rm presentation}=\frac1n\sum_{i=1}^{n}\left[U(f_\theta(x_i))-U(f_\theta(\tilde x_i))\right].
$$
*(Eq. 31.20)*

where each pair has the same task, evidence and allowed answer set; generation policy and scoring are fixed, and uncertainty is clustered by source task.

```figure
id: fig-31.28
kind: compare
title: Failure diagnosis by intervention
caption: Distinct defects require distinct falsification tests; aggregate training loss is not the common detector.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.20
alt: 'Comparison on Which contract the intervention tests. Variable changed: style=surface expression, retain=task distribution,
  tool=actual environment state, leak=shared source lineage. Success criterion: style=utility and compliance retained, retain=declared
  noninferiority, tool=attested side effect or return, leak=generalization without overlap. Cannot establish: style=truthfulness
  everywhere, retain=all base capabilities, tool=unrestricted authorization, leak=absence of all memorization'
spec:
  axis: Which contract the intervention tests
  columns:
  - id: style
    label: Presentation swap
  - id: retain
    label: Retained task
  - id: tool
    label: Execution-required task
  - id: leak
    label: Source-group holdout
  rows:
  - dimension: Variable changed
    values:
      style: surface expression
      retain: task distribution
      tool: actual environment state
      leak: shared source lineage
  - dimension: Success criterion
    values:
      style: utility and compliance retained
      retain: declared noninferiority
      tool: attested side effect or return
      leak: generalization without overlap
  - dimension: Cannot establish
    values:
      style: truthfulness everywhere
      retain: all base capabilities
      tool: unrestricted authorization
      leak: absence of all memorization
```

## Algorithm

### Algorithm 31.5 — Failure-preserving checkpoint triage

[DERIVED] Inputs are immutable checkpoints, disjoint task-grouped assessments, finite perturbation fixtures and explicit failure predicates. Outputs retain every outcome, including missing evaluations. No diagnosis grants permission for actual external side effects; execution checks use an authorized sandbox.

$$
\begin{aligned}
1.&\quad \text{For each checkpoint and source-grouped task, generate under the fixed policy}.\\
2.&\quad \operatorname{record}(\text{utility, compliance, length, termination, tool events, overlap status}).\\
3.&\quad \text{Apply paired task-preserving presentation and feedback perturbations}.\\
4.&\quad \text{Classify failures by the first violated contract, preserving secondary failures}.\\
5.&\quad \text{Reject claims whose required assessment is missing, contaminated or changed post-selection}.\\
6.&\quad \operatorname{return}(\text{checkpoint-level vectors, source-cluster uncertainty, unresolved causes}).
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] Finite checkpoint/task/perturbation sets ensure termination. Each result is associated with exactly one generation record and its event trace, preventing a later successful retry from erasing initial failure. With $K$ checkpoints, $n$ tasks and $p$ perturbations, generation count is $O(Knp)$ before repeats; token work additionally depends on generated lengths. Environment resets, judge calls and source-overlap retrieval add separately attributable costs.

## Implementation

[DERIVED] **Hugging Face TRL**, §4 #29, Post-training / RL, supplies the pinned training boundary [R31.1]; failure analysis is an external evaluation contract. Do not generate assessment data with a mutable training template and then reuse an older target mask. Keep source-group identities outside packed storage, execute tools through typed sandbox adapters and record actual returns separately from model text. The model's checkpoint hash must appear on every evaluation record.

[DERIVED] Memory includes checkpoint residency, generation KV state and evaluator buffers; compute includes all attempted outputs, including failures and repeats. Network communication includes tool and judge requests as well as training collectives if evaluation is colocated. Tail latency can be dominated by retries and nontermination, so report wall-clock boundaries and timeout outcomes. No specific latency, energy or monetary saving is claimed for this unexecuted triage.

```figure
id: fig-31.29
kind: stat-panel
title: Evaluation generation budget
caption: Declared finite evaluation plan. Mean output length is an illustrative input; timeouts, tools and judge work require
  additional records.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.20
alt: 'Analytical readout: maximum planned generations=Checkpoints*Tasks*Variants*Repeats, illustrative generated tokens=Checkpoints*Tasks*Variants*Repeats*MeanTokens.
  Declared finite evaluation plan. Mean output length is an illustrative input; timeouts, tools and judge work require additional
  records.'
spec:
  header: EVALUATION GENERATION BUDGET
  variables:
    Checkpoints: 4
    Tasks: 200
    Variants: 3
    Repeats: 2
    MeanTokens: 512
  rows:
  - key: maximum planned generations
    formula: Checkpoints*Tasks*Variants*Repeats
    format: fixed3
  - key: illustrative generated tokens
    formula: Checkpoints*Tasks*Variants*Repeats*MeanTokens
    format: fixed3
anchor: implementation
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] FINCH derives a loss-adaptive step-size motivation under bounded inputs/parameters and smooth softmax-network assumptions for SGD, then evaluates capped EMA-based learning rates with AdamW. Its settings use Qwen3-4B-Instruct and Llama-3-8B on Galician Alpaca, Chemistry L-3 SciKnowEval and synthetic-author TOFU; retained tasks include HellaSwag, WinoGrande, MMLU and IFEval. Baselines are hyperparameter-swept and selected by validation task performance, with clipping norm one. In Table 1's Qwen knowledge-acquisition comparison, SFT/FINCH task accuracies are 83.5/83.3 while average retained-score changes are -9.6/+0.1 points. Table 2 still reports FINCH degradation on TruthfulQA and Brier score. Thus mitigation is not complete preservation. [R31.8], §§3–5, Tables 1–2, Appendix A/B.

| Protocol field | Inspected boundary |
|---|---|
| Comparison axis | PAPER-REPORTED: task adaptation versus retained benchmark change [R31.8, §4] |
| Hardware / exact runtime | NOT-DISCLOSED in the main comparison inspected; do not infer from model size |
| Split and selection | PAPER-REPORTED: held-out target evaluation, validation-selected checkpoint; exact source settings in Appendix B |
| Seeds / uncertainty | UNVERIFIED for a complete run-level reconstruction; no new confidence interval invented |
| Ablation | PAPER-REPORTED: smaller clipping thresholds trade retention against target quality, Appendix B.5 |

## Observations

**What the paper claims.** [PAPER-REPORTED] FINCH improves its measured adaptation/retention tradeoff. [R31.8]

**What the evidence shows.** [DERIVED] Signed averages can hide individual retained-task declines; the cited negative cells prevent interpreting the aggregate as universal preservation.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 31.17 requires the actual update direction and a valid smoothness bound. A source's SGD analysis is not an AdamW guarantee merely because both use a learning rate.

**What remains unknown.** [UNVERIFIED] The same intervention's effectiveness on arbitrary tool, style or leakage failures is not established.

## Failure modes

> **Failure mode — Aggregate retention cancellation.** *Symptom:* mean retention is flat while one required task collapses. *Cause:* improvements and declines cancel. *Detection:* per-domain noninferiority constraints. *Mitigation:* reject on the required vector, not only its mean. [MATHEMATICALLY-DERIVED]

> **Failure mode — Success after invented evidence.** *Symptom:* a plausible final answer follows an unexecuted tool return. *Cause:* model text is mistaken for environment state. *Detection:* call/result identity reconciliation. *Mitigation:* count unsupported results as failure and enforce executor provenance. [DERIVED]

## Siblings

[DERIVED] [Continual learning](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch24-continual-learning-model-editing-and-unlearning/README.md) owns retention mechanisms broadly; this section owns SFT-specific diagnostics. [Validation](31-6-validation-and-handoff.md) converts the failure inventory into acceptance decisions. Changing decoding length limits is an inference intervention and cannot be reported as a training improvement without an ablation.

```figure
id: fig-31.30
kind: systems-trace
title: Failure-visible evaluation trace
caption: Each stage retains its failure instead of replacing it with a later retry. Resource accounting covers the complete
  attempted-task boundary.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.20
alt: The trace proceeds from source-group selection through generation, sandbox execution, scoring and aggregation. It records
  overlap, truncation, unsupported tool returns, evaluator failure and hidden domain decline.
spec:
  columns:
  - compute
  - memory
  - communication
  - failure
  stages:
  - name: select source group
    values:
      compute: overlap search
      failure: leaked task lineage
  - name: generate
    values:
      compute: all attempted tokens
      memory: KV and weights
      failure: verbosity or nontermination
  - name: execute sandbox
    values:
      communication: typed call and actual return
      failure: fabricated or invalid result
  - name: score and aggregate
    values:
      compute: independent checks
      failure: judge error or hidden domain decline
```

## Extensions

### Improvements

[DERIVED] The source's schedule changes update magnitude while retaining its objective; this differs from deleting hard targets or adding replay. Its comparisons support only the disclosed tasks. Tool-perturbation augmentation [R31.5] is a separate intervention with a different mechanism and evaluation axis. Neither addresses demonstration leakage without a source-group audit.

## Limitations

[MATHEMATICALLY-DERIVED] The cluster model is illustrative and does not identify actual sample dependence. The rollout hazard must be bounded on encountered states, which teacher-forced loss does not provide. Pairwise presentation tests require task-preserving transformations. Failure classification remains ambiguous when multiple mechanisms co-occur; unresolved causes must stay unresolved rather than being assigned to the most convenient hypothesis.

## Reproducibility

[DERIVED] Retain exact failure predicates, task groups, perturbation definitions, checkpoint hashes, generation seeds, complete token/event traces, termination reasons, evaluator versions and per-domain outcomes. Preserve missing records as missing. The independent proposed study remains in [verification](verification.md), with no fabricated model failure frequency.

## References

[R31.8] FINCH v1 method conditions, adaptation/retention experiments and negative cells. [R31.5] Tool-shift diagnostic, linked to §31.3. [R31.1] Versioned training boundary. Accessed 2026-10-09; details in [references](references.md).
