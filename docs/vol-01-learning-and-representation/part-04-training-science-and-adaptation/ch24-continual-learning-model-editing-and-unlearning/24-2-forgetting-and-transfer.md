---
id: ms.section.24.2
entity_type: section
title: Forgetting and transfer
short_title: Retention and transfer
volume: 1
part: 4
chapter: 24
section: 24.2
slug: 24-2-forgetting-and-transfer
parent: ms.chapter.24
prev_sibling: ms.section.24.1
next_sibling: ms.section.24.3
children: []
prerequisites: [ms.chapter.6, ms.section.24.1]
downstream: [ms.section.24.3, ms.section.24.4, ms.section.24.5]
related: []
relations: []
axes: {lifecycle: [continued_training, evaluation], mechanism: [continual_learning, retention, transfer], feedback_setting: [], modality: [text, image]}
papers: []
implementations: []
benchmarks: [TRACE]
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 24.2 — Forgetting and transfer

## Scope

[DERIVED] Measure acquisition, historical retention, forward transfer, backward transfer, and order sensitivity as distinct quantities. The principal artifact is a versioned matrix of scores across checkpoints and tasks, accompanied by raw outputs, denominators, and resource counters. A final average alone cannot distinguish a model that never learned a task from one that learned and subsequently lost it.

## Why this exists

[PAPER-REPORTED] GEM defines a test-performance matrix after successive tasks and derives final average accuracy, backward transfer, and forward transfer against an initialization baseline. It also notes that more frequent evaluations turn matrix columns into learning curves. [R24.3], §2, Eqs. 2–4.

[MATHEMATICALLY-DERIVED] Suppose two methods end with the same historical average. One may improve an initially weak task and damage an initially strong task; the other may leave both unchanged. The average identifies neither direction. A method that freezes all parameters can have excellent retention relative to its initial checkpoint while acquiring nothing. Stability and plasticity are separate constraints, so a useful comparison specifies acceptable regions in both rather than maximizing a single retention number.

[DERIVED] A pretrained model adds an important baseline: it already has competence before the sequence. Historical task scores and inherited capability scores must both be retained. Measuring only newly introduced tasks misses degradation on behaviors that were never included in the stream. The retention matrix is therefore accompanied by a fixed base-capability panel, without treating unrelated metrics as a common physical unit.

## Intuition

[MATHEMATICALLY-DERIVED] The diagonal of a phase-by-task matrix records acquisition immediately after training each task. Entries below the diagonal record later retention; entries above it record performance before direct exposure. Comparing a later entry with the diagonal measures net backward change. Comparing it with the largest previous entry measures loss from peak capability. These questions differ when positive transfer temporarily improves a task before later degradation.

[MATHEMATICALLY-DERIVED] Metrics also depend on the clock. Equal numbers of phases need not imply equal tokens or FLOPs. A replay method can retain more by processing more old data; an on-policy method can spend more compute generating its training trajectories. Plot quality against consumed tokens and compute as well as phase index. Otherwise resource expansion is embedded in the apparent algorithmic advantage.

## Formulation

| Symbol | Meaning | Unit or shape |
|---|---|---|
| $r_{k,j}$ | Higher-is-better score on task $j$ after phase $k$ | Task-specific score |
| $r_{0,j}$ | Initial-checkpoint score on task $j$ | Same score |
| $K$ | Sequence length | Count |
| $w_j$ | Declared aggregate weight | Nonnegative, sums to one |
| $u$ | Consumed training-token or compute clock | Tokens or FLOPs; specify |
| $\sigma$ | Permutation of phase order | Element of a declared order set |
| $g_{k,h}$ | Score on inherited capability $h$ | Capability-specific score |

> **Definition — Retention matrix.** [DERIVED] The matrix of declared task scores across evaluated checkpoints, including the initial checkpoint before sequential training.

[DERIVED] Use one oriented score per evaluation task. Accuracy is already oriented upward; a loss can be transformed to its negative for sign bookkeeping, but its scale remains distinct. Record the raw metric in addition to any transformed score. The complete matrix includes row zero:

$$
\mathbf R=(r_{k,j})_{0\leq k\leq K,\ 1\leq j\leq K}.
$$

*(Eq. 24.6)*

[MATHEMATICALLY-DERIVED] For $K>1$, choose the following explicit normalization, aligned with the GEM convention:

$$
\begin{aligned}
\mathrm{ACC}_K&=\frac1K\sum_{j=1}^{K}r_{K,j},\\
\mathrm{BWT}_K&=\frac1{K-1}\sum_{j=1}^{K-1}(r_{K,j}-r_{j,j}),\\
\mathrm{FWT}_K&=\frac1{K-1}\sum_{j=2}^{K}(r_{j-1,j}-r_{0,j}).
\end{aligned}
$$

*(Eq. 24.7)*

[DERIVED] BWT and FWT are undefined for $K=1$, not zero. Some papers use different denominators; store the exact formula with the record. In pretrained systems, $r_{0,j}$ refers to the shared initial checkpoint rather than random initialization. Evaluating a future task before exposure is permitted only through a sealed evaluator; its test feedback must not determine training choices.

## Mechanism

### Methodology

```figure
id: fig-24.6
kind: diagram
title: Retention matrix comparisons
caption: >-
  Each task column has an initial score, an acquisition diagonal, later scores,
  and a final score. Signed backward change and loss from peak use different
  reference entries, so they can both be positive.
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: [DERIVED:eq-24.6, DERIVED:eq-24.7, DERIVED:eq-24.8]
alt: >-
  Initial capability precedes acquisition. Later evaluation rows create a
  historical peak. Final score is compared separately with the acquisition
  diagonal for backward transfer and with the peak for peak forgetting.
spec:
  direction: TB
  nodes:
    - { id: initial, kind: model, label: Initial checkpoint }
    - { id: acquisition, kind: metric, label: Acquisition diagonal }
    - { id: later, kind: metric, label: Later evaluations }
    - { id: peak, kind: metric, label: Historical maximum }
    - { id: final, kind: metric, label: Final checkpoint score }
    - { id: bwt, kind: objective, label: Final minus diagonal }
    - { id: forgotten, kind: objective, label: Peak minus final }
  edges:
    - { from: initial, to: acquisition, kind: flow }
    - { from: acquisition, to: later, kind: flow }
    - { from: later, to: peak, kind: dependency }
    - { from: later, to: final, kind: flow }
    - { from: acquisition, to: bwt, kind: dependency }
    - { from: final, to: bwt, kind: dependency }
    - { from: peak, to: forgotten, kind: dependency }
    - { from: final, to: forgotten, kind: dependency }
```

> **Definition — Peak forgetting.** [MATHEMATICALLY-DERIVED] The current task-score loss relative to the greatest observed score since that task's acquisition.

[MATHEMATICALLY-DERIVED] For previously learned task $j<k$,

$$
f_{k,j}=\max_{j\leq i\leq k}r_{i,j}-r_{k,j},\qquad
\overline f_k=\frac1{k-1}\sum_{j<k}f_{k,j}.
$$

*(Eq. 24.8)*

Including the current row ensures nonnegative forgetting. This definition differs from signed BWT. If scores increase after first acquisition and later fall while remaining above their diagonal values, BWT is positive even though peak forgetting is positive. If the initial capability exceeds the diagonal, diagonal-relative retention misses the loss incurred while learning that task. Report base-relative changes $r_{k,j}-r_{0,j}$ alongside the matrix.

[ASSUMED] Consider a declared analytical example with initial task score $0.40$, acquisition score $0.70$, later peak $0.90$, and final score $0.80$. These values are chosen inputs, not measured benchmark results. [MATHEMATICALLY-DERIVED] The final diagonal-relative change is $+0.10$ while peak forgetting is $0.10$. These simultaneous values are consistent; interpreting positive BWT as absence of any forgetting is incorrect.

```figure
id: fig-24.7
kind: calculator
title: Diagonal change and peak forgetting
caption: >-
  An analytical score configuration demonstrates that positive backward
  change can coexist with forgetting from a later peak. Inputs are chosen
  examples, not benchmark measurements; enforce peak at least final and diagonal.
  The paired outputs compose Eqs. 24.7 and 24.8.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.8
alt: >-
  With acquisition 0.70, later peak 0.90, and final score 0.80, the net
  backward change is plus 0.10 while peak forgetting is 0.10. The calculator
  exposes both quantities and a consistency residual for invalid peaks.
spec:
  tex: \Delta_{\mathrm{diag}}=r_{K,j}-r_{j,j},\quad f=\max_i r_{i,j}-r_{K,j}
  equation: "24.8"
  inputs:
    - {symbol: diagonal, label: acquisition score, default: 0.7, min: 0, max: 1, step: 0.01}
    - {symbol: peak, label: maximum observed score, default: 0.9, min: 0, max: 1, step: 0.01}
    - {symbol: final, label: final score, default: 0.8, min: 0, max: 1, step: 0.01}
  outputs:
    - {symbol: backward, label: net backward change, formula: final-diagonal, emphasis: true}
    - {symbol: forgotten, label: loss from peak, formula: peak-final}
    - {symbol: invalid, label: peak inconsistency, formula: "max(0,max(diagonal,final)-peak)"}
```

[MATHEMATICALLY-DERIVED] Plasticity is measured through the task learning curve, not inferred from a final retention score. Given a task-specific baseline and a clock interval $[0,U_k]$, a normalized area of acquisition is

$$
\mathcal A_k=\frac1{U_k}\int_0^{U_k}
\big[r_{k(u),k}-r_{k(0),k}\big]\,du.
$$

*(Eq. 24.9)*

The integration clock must be the same across methods. A method reaching a threshold sooner has higher learning efficiency under that clock; this does not establish greater final capacity. Report target thresholds and censored runs that never reach them. Repeated evaluation can itself dominate compute, so separate training and measurement costs.

[MATHEMATICALLY-DERIVED] Order sensitivity is a property of update composition. For two update maps,

$$
\mathsf U_b\!\circ\!\mathsf U_a(\mathcal S_0)
\ne\mathsf U_a\!\circ\!\mathsf U_b(\mathcal S_0)
$$

*(Eq. 24.10)*

can hold because gradients, optimizer moments, replay composition, or parameter allocation depend on state. Define an order spread for a declared metric $m$ as $\max_{\sigma\in\Sigma}m(\sigma)-\min_{\sigma\in\Sigma}m(\sigma)$. A sampled order set does not establish the worst case over all $K!$ orders. Match the same permutations, initialization seeds, and budgets between methods; separate between-order variability from within-order training variability.

[DERIVED] Long-horizon evaluation adds delayed probes, recurring tasks, and the age of retained knowledge. Index each retention value by both updates since acquisition and cumulative new tokens. A single recurrence can reveal whether a model rapidly recovers forgotten behavior, but recovery is a new acquisition event rather than proof that retention never failed. Keep immutable historical columns and time-qualified current-world columns when ground truth evolves.

## Algorithm

**Algorithm 24.2 — Sealed retention ledger.** [DERIVED] $\mathsf E_j$ returns raw per-example scores and denominators for fixed test set $j$; $\mathsf H_h$ handles inherited capabilities. $\mathsf M$ computes metrics using the stored normalization and reports undefined entries explicitly. $\mathsf U_k$ is the authorized update of §24.1. $\operatorname{valid}$ checks test identity, scorer revision, decoding configuration, and complete denominators.

$$
\begin{aligned}
1.\quad&r_{0,j}\gets\mathsf E_j(\mathcal S_0),\quad j=1,\ldots,K.\\
2.\quad&\mathcal S_k\gets\mathsf U_k(\mathcal S_{k-1}),\quad k=1,\ldots,K.\\
3.\quad&(r_{k,j},n_{k,j},o_{k,j})\gets\mathsf E_j(\mathcal S_k),\quad j=1,\ldots,K.\\
4.\quad&g_{k,h}\gets\mathsf H_h(\mathcal S_k),\quad h=1,\ldots,J.\\
5.\quad&\neg\operatorname{valid}(r_{k,:},n_{k,:},o_{k,:})
 \Longrightarrow\operatorname{return}(\mathrm{incomplete},k).\\
6.\quad&\mathcal L_k\gets\operatorname{append}(\mathcal L_{k-1},
 r_{k,:},g_{k,:},\mathcal C_k,\operatorname{id}(\mathcal S_k)).\\
7.\quad&k=K\Longrightarrow\operatorname{return}(\mathcal L_K,\mathsf M(\mathcal L_K)).
\end{aligned}
$$

*(Eq. 24.11)*

[DERIVED] Lines 2–6 repeat in order; line 1 executes once. No row is used for hyperparameter search. A separate validation ledger may guide checkpoint selection according to a fixed rule. Failed evaluations remain missing with a reason; they are never converted to zeros or dropped from an average. The procedure terminates at the declared horizon or the first unrecoverable measurement failure.

## Implementation

[MATHEMATICALLY-DERIVED] The score matrix requires $O(K^2)$ scalars, but reproducibility is usually dominated by raw generations and evaluation compute. For $n_j$ examples and mean evaluated/generated length $\bar T_j$, full evaluation after every phase processes approximately $(K+1)\sum_j n_j\bar T_j$ tokens, excluding inherited panels and retries. A streaming sufficient-statistic reduction saves score-storage space; preserving paired outputs remains necessary for many uncertainty analyses. Model weights and optimizer memory do not increase because a matrix is recorded.

[DERIVED] Pair differences at the example level when comparing checkpoints on fixed examples. Resample at the independent unit appropriate to the data: questions sharing a document, edits sharing an entity, and turns sharing a conversation can be dependent. Multiple task tests introduce a multiplicity problem; distinguish exploratory panels from predeclared acceptance gates. Canonical statistical definitions and inference methods are owned by Chapter 06.

[NOT-DISCLOSED] This chapter has no measured evaluation throughput, accelerator energy, or monetary cost. Network communication is absent from single-process metric aggregation; distributed generation adds model-parallel collectives and output gathering. Neither a matrix dimension nor a parameter count predicts those costs without the execution configuration.

## Experimental design

### Reported experiments

[PAPER-REPORTED] GEM studies twenty-task MNIST permutations, MNIST rotations, and incremental CIFAR-100 sequences, with one-pass exposure and task-specific evaluation. The paper reports transfer metrics and varies memory, passes, and task order; its architectures and SGD setup are disclosed in §4 and Appendix B. Those protocols concern task-conditioned classifiers, not pretrained conversational models. [R24.3], §§4.1–4.4.1.

[PAPER-REPORTED] TRACE supplements target-task scores with deltas on inherited general ability, instruction following, and safety. Its replay condition uses historical examples and alignment data, so its benefits must be interpreted under that data-access condition. [R24.2], §§4.2–4.4. The benchmark's historical model versions are not proxies for the present frontier.

## Observations

**What the paper claims.** [PAPER-REPORTED] GEM reports favorable retention/transfer behavior under its memory-constrained evaluated sequences; TRACE reports forgetting beyond the target tasks. [R24.3], §4.4; [R24.2], §4.4.

**What the evidence shows.** [DERIVED] These studies justify inspecting complete trajectories and inherited panels. They provide no universal mapping from one aggregate retention score to deployment reliability.

**What we infer.** [MATHEMATICALLY-DERIVED] Positive BWT and positive peak forgetting can coexist; stability without acquisition can be trivial; order variation and seed variation answer separate questions.

**What remains unknown.** [UNVERIFIED] Independent replication of the cited numerical results, behavior over substantially longer sequences, and robustness under changed task weights have not been established here.

## Failure modes

> **Failure mode — Final-average cancellation.** [MATHEMATICALLY-DERIVED] *Symptom:* unchanged mean despite large task-level changes. *Cause:* gains cancel losses. *Detection:* inspect the matrix and worst affected column. *Mitigation:* report acquisition, signed backward change, peak forgetting, and inherited deltas separately.

[DERIVED] Changing the scorer, target alias set, prompt, temperature, or class mask between rows confounds model change with evaluator change. A zero-shot baseline evaluated with fewer demonstrations than the final checkpoint confounds transfer with extra context. Label both configurations as distinct evaluation protocols instead of splicing them into one matrix.

## Siblings

```figure
id: fig-24.8
kind: stat-panel
title: Full matrix evaluation count
caption: >-
  Eq. 24.6 contains an initial row and one row after each of K phases. The
  illustrative eight-task configuration stores 72 task-checkpoint cells;
  this excludes inherited panels and per-example output storage.
placement: rail
anchor: implementation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.6
alt: >-
  For eight tasks there are nine checkpoint rows and eight columns, giving
  72 cells. These are structural counts, not measured benchmark scores.
spec:
  header: ANALYTICAL MATRIX SHAPE
  variables: { K: 8 }
  rows:
    - { key: tasks, formula: K, format: integer }
    - { key: checkpoint rows, formula: K+1, format: integer }
    - { key: task-checkpoint cells, formula: (K+1)*K, format: integer }
    - { key: inherited panels, value: counted separately }
    - { key: missing results, value: explicit missing status }
```

[DERIVED] [Regime definition](24-1-sequential-learning-regimes.md) determines which comparisons are legal. [Editing evaluation](24-4-model-editing.md) adds local efficacy, collateral effects, and composition. [Unlearning evaluation](24-5-unlearning.md) intentionally seeks deletion relative to retraining; a high historical-retention score can directly oppose its objective.

## Extensions

### Improvements

[DERIVED] Replace task columns with entities, languages, capabilities, or temporal snapshots when those are the relevant independent targets. Keep the original metric units and provenance. A dense full matrix can be supplemented by a budgeted probe schedule, but unobserved intervals remain unobserved; interpolation does not recover an undocumented collapse or recovery event.

## Limitations

[MATHEMATICALLY-DERIVED] A finite evaluation matrix characterizes a finite protocol. It does not prove preservation of an entire function. Aggregate normalized scores cannot establish that all tasks meet a minimum requirement. Acceptance should therefore be a conjunction of task-specific constraints when failure on any critical task is unacceptable.

## Reproducibility

[DERIVED] Preserve checkpoint hashes, order/seed identities, evaluation-set and scorer revisions, raw outputs, counts, orientation and normalization, confidence procedure, and resource clocks. Proposed matched-order experiments and analytical identity checks are specified in [verification.md](verification.md); no model sequence was run for this edition.

## References

[R24.2](references.md#r242), [R24.3](references.md#r243).
