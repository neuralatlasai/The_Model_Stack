---
id: ms.section.24.1
entity_type: section
title: Sequential learning regimes
short_title: Sequential regimes
volume: 1
part: 4
chapter: 24
section: 24.1
slug: 24-1-sequential-learning-regimes
parent: ms.chapter.24
prev_sibling: null
next_sibling: ms.section.24.2
children: []
prerequisites: [ms.chapter.6, ms.chapter.19, ms.chapter.22, ms.chapter.23]
downstream: [ms.section.24.2, ms.section.24.3]
related: [ms.chapter.12]
relations: []
axes: {lifecycle: [continued_training, adaptation, evaluation], mechanism: [continual_learning, distribution_shift], feedback_setting: [], modality: [text, image]}
papers: []
implementations: []
benchmarks: [TRACE]
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 24.1 — Sequential learning regimes

## Scope

[DERIVED] A sequential-learning claim is a statement about an information-constrained update process. Specify the changing distributions, observable task identity, prediction space, revisitation policy, retained state, and evaluation horizon before selecting a forgetting mitigation. This section owns task-, domain-, and class-incremental regimes and replay permissions. Retention metrics are developed in [§24.2](24-2-forgetting-and-transfer.md); mechanisms in [§24.3](24-3-mechanism-families.md).

## Why this exists

[PAPER-REPORTED] Hsu et al. distinguish domain-, class-, and task-incremental scenarios by input/output distribution changes, shared label space, and availability of task identity. Their Split MNIST construction shows that selecting a task-specific head at evaluation changes the problem relative to prediction over all classes. [R24.1], §2.2 and Table 1.

[MATHEMATICALLY-DERIVED] The essential distinction is information available to the predictor. A learner supplied with an oracle task identifier can optimize a conditional decision rule. A learner without that identifier must also resolve ambiguity between tasks. A comparison that removes the identifier from one method but retains it for another measures both adaptation and task inference. Neither an identical parameter count nor a shared dataset name repairs this mismatch.

[DERIVED] A second constraint is permission to revisit information. An algorithm allowed a cumulative corpus solves a different resource-constrained problem from one allowed only current examples and fixed auxiliary state. The phrase “replay-free” must identify whether it excludes raw records, generated samples, cached logits, curvature statistics, old checkpoints, or all data-derived state. A storage restriction is a contract over artifacts and transitions; it is not implied by the absence of an explicit replay buffer.

## Intuition

[MATHEMATICALLY-DERIVED] Let the environment select a phase $k$ and then a sample from $q_k(x,y)$. Training changes the predictor because the latest phase changes the gradient distribution. Retention asks whether the same resulting predictor remains useful under earlier $q_j$. If the deployment distribution itself evolves, preserving every historical answer can be incorrect: an old factual target and its updated target may contradict each other for the same input. Retain the ability to answer historical, time-qualified queries while updating current queries; otherwise the target functions are inconsistent.

[MATHEMATICALLY-DERIVED] Consider two equally likely phases with the same input $x_0$ but opposite deterministic binary labels. A phase-conditioned predictor attains zero classification error. A predictor receiving only $x_0$ has error at least one half under the balanced mixture. No regularizer can overcome this missing-information bound. Adding time or task context changes the input contract and can remove the contradiction; presenting that change as reduced forgetting would obscure the actual intervention.

## Formulation

| Symbol | Local meaning | Shape or unit |
|---|---|---|
| $K$ | Number of phases in the evaluated sequence | Count |
| $q_k$ | Joint distribution in phase $k$ | Distribution over input and target |
| $\mathcal D_k$ | Training records available during phase $k$ | Finite set or ordered stream |
| $\mathcal E_j$ | Sealed evaluation set for distribution $q_j$ | Finite set |
| $z_k$ | Task identifier, if supplied | Discrete context |
| $\mathcal S_k$ | Persistent learning state after phase $k$ | Parameters plus authorized auxiliary state |
| $\Gamma_k$ | Permission predicate for reading, retaining, and using an artifact | Boolean function |
| $a_{k,j}$ | Deployment or evaluation weight on distribution $j$ | Nonnegative, sums to one |

> **Definition — Sequential learning regime.** [DERIVED] An ordered sequence of learning distributions together with its observation interface, historical-access permissions, resource budgets, and evaluation contract.

[DERIVED] Represent the regime by the tuple

$$
\mathfrak R=\big((q_k,\mathcal D_k)_{k=1}^{K},\ \mathcal X,\mathcal Y,
\ \operatorname{obs}(z_k),\ \Gamma_{1:K},\ \mathcal B,\ \mathcal E_{1:K}\big),
$$

*(Eq. 24.1)*

where $\mathcal B$ contains token, compute, retained-byte, and update budgets. A phase update is $\mathcal S_k=\mathsf U_k(\mathcal S_{k-1},\mathcal D_k;\Gamma_k,\mathcal B)$. Parameters $\theta$ are one component of $\mathcal S$; optimizer moments, teachers, generators, adapter identities, and statistics can also preserve information.

[MATHEMATICALLY-DERIVED] At phase $k$, a deployment risk can be defined as

$$
\mathcal R_k(\theta)=\sum_{j=1}^{K}a_{k,j}
\mathbb E_{(x,y)\sim q_j}\ell(f_\theta(x,\operatorname{obs}(z_j)),y).
$$

*(Eq. 24.2)*

The coefficients are declared evaluation inputs, not inferred prevalence. Uniform historical weights measure equal task retention; traffic weights measure a deployment mixture. Report both when they answer different questions. A fixed $q$ with changing finite samples is stationary sampling; changing $q_k$ is distributional evolution. Finite-sample fluctuations cannot by themselves establish drift.

## Mechanism

### Methodology

[DERIVED] **Task-incremental learning** permits a task-conditioned prediction interface. A separate head or adapter may be selected from $z_k$, but its identity must be available at inference under the stated protocol. **Domain-incremental learning** changes input distribution while retaining an aligned target interpretation; the evaluator does not supply an oracle head selection merely because phases have names. **Class-incremental learning** expands the set of recognized classes and evaluates competition across the accumulated class space. The class mapping is part of the model interface, not incidental loader metadata. These operational definitions refine the distinctions in [R24.1] into a reproducible interface contract.

[MATHEMATICALLY-DERIVED] For class increments with accumulated label set $\mathcal Y_{\leq k}$, the correct normalized predictor is

$$
p_\theta(y\mid x)=\frac{\exp h_\theta(x)_y}
{\sum_{v\in\mathcal Y_{\leq k}}\exp h_\theta(x)_v}.
$$

*(Eq. 24.3)*

Masking the denominator to the true task's classes supplies side information. It can improve measured accuracy even when parameters are unchanged. For language models the vocabulary is often shared, so task increments instead alter prompt semantics, target distributions, or capabilities; a fixed vocabulary does not make a sequence stationary.

[DERIVED] Separate a **phase boundary** supplied to the learner from a **boundary-free stream**. In the first case, a method may consolidate statistics, allocate an adapter, or reset a clock at the boundary. In the second, a detector must infer when to act, introducing false positives, missed changes, detection delay, and extra state. Evaluation with known boundaries cannot establish detector performance. Also separate one-pass learning from multiple epochs within each phase and from recurring phases. Revisiting a task with new records is distinct from rereading its original records.

[MATHEMATICALLY-DERIVED] Replay permissions can be represented without conflating them with algorithms. Let each persistent artifact $u$ carry source lineage $\operatorname{anc}(u)$, type, expiry, and allowed purposes. A legal transition satisfies

$$
\forall u\in\operatorname{Read}(\mathsf U_k)\cup\operatorname{Keep}(\mathsf U_k),
\qquad \Gamma_k(u,\operatorname{purpose},\operatorname{anc}(u))=1.
$$

*(Eq. 24.4)*

This permits separate policies for current records, bounded historical exemplars, synthetic replay, aggregate statistics, and checkpoint retention. A generated example is a descendant of its generator's training history; calling it synthetic does not prove that it satisfies a permission rule. Conversely, whether a particular statistic is permitted is an external contract, not a property established by a matrix equation.

```figure
id: fig-24.3
kind: diagram
title: Sequential information boundary
caption: >-
  The same training sequence defines different problems when task identity,
  historical artifacts, or prediction-space restrictions change. Audit the
  information boundary before comparing retention.
placement: wide
evidence: DERIVED
source: DERIVED:eq-24.1
alt: >-
  Phase data and permission rules enter an authorized update. Persistent
  parameters and auxiliary memory pass to the next phase. The sealed
  evaluator receives the declared prediction interface and task identity
  policy, without returning test targets to training.
spec:
  direction: TB
  nodes:
    - {id: data, kind: dataset, label: Current phase records}
    - {id: rules, kind: boundary, label: Artifact permissions}
    - {id: state, kind: state, label: Prior persistent state}
    - {id: update, kind: process, label: Authorized update}
    - {id: next, kind: model, label: Next parameters and auxiliary state}
    - {id: interface, kind: dependency, label: Task identity and label space}
    - {id: test, kind: dataset, label: Sealed evaluation sets}
    - {id: eval, kind: metric, label: Retention and acquisition matrix}
  edges:
    - {from: data, to: update}
    - {from: rules, to: update, kind: dependency}
    - {from: state, to: update}
    - {from: update, to: next, kind: emphasis}
    - {from: next, to: eval}
    - {from: interface, to: eval, kind: dependency}
    - {from: test, to: eval, kind: dependency}
```

## Algorithm

**Algorithm 24.1 — Permission-constrained phase transition.** [DERIVED] Inputs are state $\mathcal S_{k-1}$, ordered current data, permission predicate, a budgeted update map $\mathsf U$, and sealed evaluator $\mathsf E$. $\mathsf A$ constructs the authorized artifact view; $\mathsf V$ checks lineage, interface identity, finite state, and budget accounting. $\bot$ denotes a rejected transition. No test label enters $\mathsf U$.

$$
\begin{aligned}
1.\quad &\mathcal A_k\gets\mathsf A(\mathcal S_{k-1},\mathcal D_k;\Gamma_k).\\
2.\quad &\neg\operatorname{legal}(\mathcal A_k,\Gamma_k)
 \Longrightarrow\operatorname{return}(\bot,\mathrm{permission}).\\
3.\quad &(\widetilde{\mathcal S}_k,\mathcal C_k)
 \gets\mathsf U(\mathcal A_k;\mathcal B_k).\\
4.\quad &\neg\mathsf V(\widetilde{\mathcal S}_k,\mathcal C_k;\mathfrak R)
 \Longrightarrow\operatorname{return}(\bot,\mathrm{invalid}).\\
5.\quad &\mathcal S_k\gets\operatorname{commit}(\widetilde{\mathcal S}_k),\qquad
 r_{k,:}\gets\mathsf E(\mathcal S_k,\mathcal E_{1:K};\operatorname{obs}(z)).\\
6.\quad &\operatorname{return}(\mathcal S_k,r_{k,:},\mathcal C_k).
\end{aligned}
$$

*(Eq. 24.5)*

[DERIVED] The invariant is authorized ancestry for every retained artifact and an unchanged declared evaluation interface. The outer sequence terminates after $K$ phases or an explicit failure; each update terminates at its token/update budget. A failed phase is recorded, not silently omitted from the retention matrix. State publication follows [§19.4](../ch19-pretraining-objectives-and-the-full-training-loop/19-4-training-state-transitions.md).

## Implementation

```figure
id: fig-24.4
kind: calculator
title: Deployment mixture risk
caption: >-
  Eq. 24.2 with two declared component risks. These are illustrative analysis
  inputs, not measured scores; changing traffic weights changes the evaluated
  objective without changing either component's performance.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.2
alt: >-
  Two component risks are 0.2 and 0.8. A weight of 0.75 on the first gives
  aggregate risk 0.35. Equal weights give 0.5. The components remain unchanged.
states:
  - { anchor: formulation, label: Declared traffic, variables: { w: 0.75 }, note: The aggregate follows the declared mixture. }
  - { anchor: mechanism, label: Equal task weight, variables: { w: 0.5 }, note: Equal task weight answers a different evaluation question. }
spec:
  tex: R=w r_1+(1-w)r_2
  equation: "24.2"
  inputs:
    - { symbol: w, label: first distribution weight, default: 0.75, min: 0, max: 1, step: 0.05 }
    - { symbol: r1, label: first component risk, default: 0.2, min: 0, max: 1, step: 0.05 }
    - { symbol: r2, label: second component risk, default: 0.8, min: 0, max: 1, step: 0.05 }
  outputs:
    - { symbol: risk, label: weighted risk, formula: w*r1+(1-w)*r2, emphasis: true }
```

[DERIVED] Regime enforcement is dataset and artifact orchestration rather than a special tensor kernel. A loader resolves stable example identities, phase membership, permission purpose, target mapping, and expiration before constructing a batch. The model receives only fields declared observable. Task identifiers hidden in filenames, prompt prefixes, adapter selectors, or batching order can violate a nominally task-agnostic protocol. Maintain separate training and evaluation processes when the evaluator must retain historical test sets unavailable to the learner.

[MATHEMATICALLY-DERIVED] Retaining $m$ records of average serialized size $s$ costs approximately $ms$ payload bytes plus indexes and provenance. A teacher of $N$ parameters with $b$ bytes per parameter adds $Nb$ resident or streamed bytes before runtime workspaces. Neither is counted as “zero memory” because the original records are absent. Training token and FLOP costs follow the selected update mechanism; evaluation of $K$ sets after each of $K$ phases requires $K^2$ set evaluations in the full matrix protocol. For a single-device metadata audit, inter-rank communication is inapplicable. Distributed training and model serving add their own boundaries. Energy, monetary cost, and realized throughput are unmeasured for this manuscript.

## Experimental design

### Reported experiments

[PAPER-REPORTED] TRACE constructs eight sequential language tasks, including domain, multilingual, code, and reasoning tasks, with balanced training/test samples. It compares full sequential tuning, sequential LoRA, historical replay, and six-shot prompting, and separately evaluates general capability, instruction following, and safety changes. The inspected setup uses five aligned models, rather than an unrestricted claim about all language models. [R24.2], §§4.1–4.3.

[PAPER-REPORTED] Hsu et al. evaluate Split and Permuted MNIST under distinct prediction interfaces and compare regularization and replay baselines. Their central experimental control is scenario definition; results under oracle task identity do not transfer directly to the single-head class-incremental setting. [R24.1], §§3–4 and appendices. Runtime/precision details sufficient for an equivalent contemporary accelerator run are NOT-DISCLOSED in this chapter's retained protocol record.

## Observations

**What the paper claims.** [PAPER-REPORTED] TRACE reports that adapting to sequential target tasks can degrade capabilities outside the training sequence, motivating separate evaluation of inherited behavior. [R24.2], §4.4.

**What the evidence shows.** [DERIVED] The inspected studies support their particular sequences and interfaces. They do not establish equivalence between task-conditioned classification, task-agnostic generation, and an evolving deployment stream.

**What we infer.** [MATHEMATICALLY-DERIVED] Missing task context can produce irreducible conflicting targets; available historical data changes the feasible update class. Both must be controlled before interpreting a retention advantage.

**What remains unknown.** [UNVERIFIED] Performance on an unseen order, unannounced boundary, larger horizon, or newly permission-restricted replay stream requires a distinct evaluation.

## Failure modes

> **Failure mode — Oracle interface leakage.** [DERIVED] *Symptom:* accuracy improves when phase labels are supplied without a weight change. *Cause:* the evaluator selects the true head or masks competing labels. *Detection:* compare the declared interface against every selector and output mask. *Mitigation:* report oracle and inferred-routing results separately.

[DERIVED] Expired replay records, teachers containing withdrawn information, and evaluation examples accidentally reused for model selection invalidate different parts of the contract. Permission failure is not a model-quality result. Boundary-detector error is not parameter forgetting. Store these failure categories separately so a failed run remains interpretable.

## Siblings

```figure
id: fig-24.5
kind: stat-panel
title: Sequential interface audit
caption: >-
  Audit the prediction interface and historical information before comparing
  mechanisms. A phase name does not authorize oracle routing or raw replay.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-24.1
alt: >-
  The audit separates task identity, prediction space, phase boundary, permitted
  historical artifacts, and the evaluation mixture. Each is declared independently.
spec:
  header: REGIME CONTRACT
  rows:
    - { key: task identity, value: supplied or hidden }
    - { key: prediction space, value: shared or task-conditioned }
    - { key: phase boundary, value: known or detected }
    - { key: historical access, value: explicit permission predicate }
    - { key: mixture, value: declared task or traffic weights }
```

[DERIVED] [Continued pretraining](../ch22-continued-pretraining-mid-training-and-domain-adaptation/README.md) changes a model using additional data; this chapter adds explicit sequential retention and permission obligations. [Adapter tuning](../ch23-parameter-efficient-adaptation-and-model-composition/README.md) changes the trainable representation; it does not specify task identity or replay access. [Unlearning](24-5-unlearning.md) deliberately removes an influence that continual retention might otherwise protect.

## Extensions

### Improvements

[DERIVED] A multimodal stream adds modality availability and target alignment to $\mathfrak R$. A tool-using stream adds versioned action semantics and environment outcomes; an old API call may become invalid while its underlying skill remains useful. These are changes to distributions and interfaces, not evidence that a text-only forgetting mitigation generalizes. Boundary-free and recurring-task variants require the same artifact lineage plus explicit boundary and recurrence policies.

## Limitations

[MATHEMATICALLY-DERIVED] No finite shared predictor can satisfy mutually contradictory deterministic targets for identical observed input. No statistical test over a finite evaluation set establishes retention on every historical input. Regime specification makes a claim testable; it does not guarantee that a feasible high-quality solution exists.

## Reproducibility

[DERIVED] Record phase order, data revisions, sampling/epoch policy, tokenizer and templates, class mapping, observable identifiers, permission matrix, artifact ancestry, budgets, and evaluator isolation. The [chapter verification protocol](verification.md) proposes controlled orders and replay conditions; it has not been executed.

## References

[R24.1](references.md#r241), [R24.2](references.md#r242).
