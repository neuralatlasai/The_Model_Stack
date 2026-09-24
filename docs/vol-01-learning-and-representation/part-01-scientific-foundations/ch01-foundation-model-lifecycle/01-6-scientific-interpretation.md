---
id: ms.section.1.6
entity_type: section
title: Scientific interpretation
short_title: Interpretation stance
volume: 1
part: 1
chapter: 1
section: 1.6
slug: 01-6-scientific-interpretation
parent: ms.chapter.1
prev_sibling: ms.section.1.5
next_sibling: ms.verification.1
children: []
prerequisites: [ms.section.1.2, ms.section.1.4]
downstream: [ms.section.6.3, ms.section.21.6, ms.section.35.5, ms.section.35.6, ms.section.62.6, ms.section.64.1, ms.section.64.4]
related: [ms.section.1.5]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P52}
  - {type: supported_by, target: paper.P28}
  - {type: prerequisite_of, target: ms.section.64.1}
axes:
  lifecycle: [evaluation, assurance]
  mechanism: [scientific_method, causal_inference, falsification]
  feedback_setting: []
  modality: [text]
papers: [P08, P09, P26, P28, P52, P50]
implementations: [impl.vllm, impl.sglang, impl.pytorch-fsdp2, impl.torchtitan, impl.hugging-face-trl, impl.verl, impl.openrlhf, impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [KNOWN, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1700
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 1.6 Scientific interpretation

## Scope

Objective: fix the interpretive stance of the book: what counts as a mechanistic explanation, when a physical constraint is the explanation, how cognitive analogies are admitted, what causal evidence is, how competing hypotheses are held, and what falsification requires. Baseline: interpretation by narrative ("the model learned to reason"). Success criterion: every claim in the book can be classified by the kind of evidence behind it and carries the measurement that would reject it. Boundaries: the methods of mechanistic analysis are owned by [Chapter 64](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/README.md); controlled comparison by [§6.3](../ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md); the RL-specific attribution problem by [§35.5](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-5-what-improved.md)–[35.6](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-6-scientific-boundaries.md). Algorithm and Implementation are brief: this section is methodological.

## Why this exists

What failed: behaviors were named in mental vocabulary (knows, reasons, remembers, wants) and the names were then used as explanations; benchmark differences were read as capability differences without controls; and gains were credited to the last intervention applied. The bottleneck is that the cheapest evidence (a score) supports the weakest inference, while the evidence that supports mechanism (intervention on the model or on training) costs FLOPs the budget rarely allows. What changed: attribution-graph methods made it routine to state a mechanistic hypothesis and test it by perturbing the model (OFFICIAL-DOCUMENTATION · P52), and critical reanalyses of reasoning-RL results showed how much of a reported gain can sit in the base checkpoint or the optimizer's bias rather than in the claimed mechanism (PAPER-REPORTED · P28). This section sets the rules those examples obey.

## Intuition

Physically, the first explanation to test for any behavior is a resource constraint, because it is the cheapest to check and the most often sufficient. A model that answers long-context questions poorly may have a cache policy that truncates; a "reasoning" gain may be a length increase that a per-token accuracy metric rewards; a latency regression is traffic before it is anything else. Only when the ledger of [§1.5](01-5-resource-accounting.md) and the level attribution of [§1.2](01-2-levels-of-analysis.md) leave a residual does a claim about internal computation become necessary.

Heuristically, cognitive vocabulary is admissible as a hypothesis generator: "the model is retrieving a fact" suggests looking for a feature that activates on the fact and an intervention that removes it. The heuristic becomes a claim only after the intervention. Analogies are introduced as "heuristically" throughout the book for this reason.

## Formulation

> **Definition — cognitive analogy.** A description of model behavior in mental-state vocabulary, admissible only when marked as heuristic; it is not itself evidence for any mechanism.

> **Definition — falsification condition.** A pre-stated measurement outcome (population, metric, estimator, threshold, and the direction of the result) that would reject a claim; a claim without one is not a claim of this book.

> **Definition — competing hypotheses.** The set of alternative explanations for an observed effect that a design must discriminate before any one is asserted; at minimum, a data explanation, a base-checkpoint explanation, an evaluation-protocol explanation, and a resource explanation.

Evidence is ordered by the intervention it involves. Let an observed effect Δ be as in [Eq. 1.3](01-2-levels-of-analysis.md). The ladder is:

| Rung | Evidence | What it can support | Cost |
|---|---|---|---|
| 0 | A score on a benchmark | that the score was obtained under that protocol | evaluation FLOPs |
| 1 | A controlled comparison with levels held fixed ([§6.3](../ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md)) | that the varied level caused Δ on that population | re-run FLOPs per arm |
| 2 | An intervention on the trained model (ablation, activation patching, feature steering; [§64.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/64-4-causal-tracing.md)) | that a component is necessary or sufficient for the behavior on tested inputs | forward passes per intervention |
| 3 | An intervention on training (re-run with one variable changed; [§21.5](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md)) | that a training choice causes the mechanism to form | full or pilot training FLOPs |

```figure
id: fig-1.29
kind: hierarchy
title: The evidence ladder, what each rung supports and costs
caption: >-
  Evidence ordered by the intervention it involves, cheapest at the bottom.
  The stance never demands the top rung; it demands that the rung be stated,
  and it fixes the minimum: rung 1 for 'X caused Δ', rung 2 for 'by
  mechanism m'. Scroll: the lit rungs follow the section from the minimums
  to the worked hypotheses, the two cited works, the failure modes, and the
  sibling chapters that own each rung.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-1.3", P52, P28]
concepts: [ms.section.1.6]
alt: >-
  Four-rung ladder read bottom to top. Rung 0, a benchmark score: supports
  only that the score was obtained under that protocol; costs evaluation
  FLOPs. Rung 1, a controlled comparison with levels held fixed: supports
  that the varied level caused Δ on that population; costs re-run FLOPs per
  arm. Rung 2, an intervention on the trained model (ablation, activation
  patching, feature steering): supports that a component is necessary or
  sufficient on tested inputs; costs forward passes per intervention. Rung
  3, an intervention on training: supports that a training choice causes the
  mechanism to form; costs full or pilot training FLOPs. States light rungs 1
  and 2 for the minimum claims; rungs 0, 1 and 2 for the worked RLVR
  hypotheses; rungs 1 and 2 for P28 and P52; rung 0 for the failure modes;
  rungs 0 to 2 for the sibling chapters.
states:
  - { anchor: formulation, label: "minimum rungs", highlight: ["Rung 1 · controlled comparison", "Rung 2 · intervene on the model"], note: "'X caused Δ' needs rung 1; 'by mechanism m' needs rung 2. A rung-0 score is consistent with every competing hypothesis by construction and selects none." }
  - { anchor: mechanism, label: "RLVR claim, five arms", highlight: ["Rung 0 · benchmark score", "Rung 1 · controlled comparison", "Rung 2 · intervene on the model"], note: "Base, length and reward-source hypotheses are rung-1 arms; contamination is a rung-0 audit; 'a mechanism formed' needs rung-2 ablation of candidate features." }
  - { anchor: observations, label: "P52 · P28", highlight: ["Rung 1 · controlled comparison", "Rung 2 · intervene on the model"], note: "P52's validation is rung 2 on its tested prompts; P28's base-model finding is rung 1 against the R1-Zero claim. Different rungs about different quantities, so no contradiction." }
  - { anchor: failure-modes, label: "analogy · last intervention", highlight: ["Rung 0 · benchmark score"], note: "Analogy-as-explanation and last-intervention credit both assert a rung-1 or rung-2 conclusion from rung-0 evidence; Algorithm 1.6 step 3 flags the missing base arm." }
  - { anchor: siblings, label: "who owns each rung", highlight: ["Rung 0 · benchmark score", "Rung 1 · controlled comparison", "Rung 2 · intervene on the model"], note: "§64.1 develops rung 2, §6.3 designs rung 1, §62.6 reads rung-0 preferences, and §35.6 applies the whole ladder to reasoning RL." }
spec:
  direction: up
  levels:
    - { label: "Rung 3 · intervene on training", kind: process, note: "supports: a training choice causes the mechanism to form · cost: training FLOPs" }
    - { label: "Rung 2 · intervene on the model", kind: process, note: "supports: a component is necessary or sufficient on tested inputs · cost: forward passes" }
    - { label: "Rung 1 · controlled comparison", kind: branch, note: "supports: the varied level caused Δ on that population · cost: re-runs per arm" }
    - { label: "Rung 0 · benchmark score", kind: metric, note: "supports: the score was obtained under that protocol · cost: evaluation FLOPs" }
```

> **Caveat.** Leaderboard positions, including the ranking signals of `AI_REFERENCE_STACK.md` §0 (the Artificial Analysis Intelligence Index, LMArena leaderboards), are rung-0 evidence about one protocol and one voter or task pool. The plan's corrections table separates human preference, task correctness, robustness, system performance, and economic efficiency as evaluation axes (KNOWN · `book_plan.md`). No leaderboard value is cited in this chapter, and none may be cited in the book without the exact model version and access date.

A mechanistic explanation is a claim at rung 2 or 3 stated in terms of components (features, heads, layers, states) and their causal roles; a physical explanation is a rung-1 claim whose varied level is resource-bearing (runtime, infrastructure, ledger); a behavioral description is rung 0.

```figure
id: fig-1.30
kind: compare
title: Behavioral, physical and mechanistic explanation, and the analogy
caption: >-
  The physical column is tested first because it is the cheapest to check
  and the most often sufficient; only a residual left by the ledger and the
  level attribution makes a claim about internal computation necessary. The
  analogy column never becomes an explanation on its own: it earns a place
  only by naming a feature and an intervention that would remove it.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-1.3", P52]
alt: >-
  Comparison of four kinds of statement. Behavioral description: rung 0;
  a score under one protocol; example, a leaderboard position, rung-0
  evidence about one protocol and one voter or task pool; it cannot select
  among competing hypotheses. Physical explanation: rung 1 with a
  resource-bearing level varied (runtime, infrastructure, ledger); examples,
  a long-context failure from a cache policy that truncates and a latency
  regression that is traffic; tested by a controlled comparison or by the
  ledger itself. Mechanistic explanation: rung 2 or 3, stated in components
  (features, heads, layers, states) and their causal roles; example,
  attribution-graph hypotheses validated by perturbation (P52); costs
  forward passes plus replacement-model training whose cost P52 does not
  disclose. Cognitive analogy: no rung, a hypothesis generator in mental
  vocabulary; example, 'the model is retrieving a fact', which becomes a
  claim only after a rung-2 test of the feature it suggests.
spec:
  axis: >-
    Kind of statement by the rung of evidence behind it and the terms it is
    stated in; the columns are not ranked for every purpose
  columns:
    - { id: beh, label: "Behavioral description" }
    - { id: phys, label: "Physical explanation" }
    - { id: mech, label: "Mechanistic explanation" }
    - { id: anal, label: "Cognitive analogy" }
  rows:
    - { dimension: "rung", values: { beh: "0", phys: "1, with a resource-bearing level varied", mech: "2 or 3", anal: "none: a hypothesis generator" } }
    - { dimension: "stated in terms of", values: { beh: "a score under one protocol", phys: "runtime, infrastructure or ledger entries", mech: "components (features, heads, layers, states) and their causal roles", anal: "mental vocabulary: knows, reasons, remembers, wants" } }
    - { dimension: "example from this section", values: { beh: "a leaderboard position: one protocol, one voter or task pool", phys: "a cache policy that truncates; a latency regression that is traffic", mech: "attribution-graph hypotheses validated by perturbation (P52)", anal: "'the model is retrieving a fact'" } }
    - { dimension: "what makes it a claim", values: { beh: "nothing: it cannot select among competing hypotheses", phys: "a controlled comparison with the other levels fixed", mech: "an intervention on the model or on training", anal: "a rung-2 test of the feature it suggests" } }
    - { dimension: "cost of the check", values: { beh: "evaluation FLOPs", phys: "one re-run per hypothesis, or the ledger itself", mech: "forward passes plus replacement-model training (cost NOT-DISCLOSED in P52)", anal: "the cost of the rung-2 test it proposes" } }
```

> **Claim [DERIVED · DERIVED:eq-1.3].** A rung-0 observation is consistent with every competing hypothesis by construction, so it cannot select among them; the minimum rung for asserting "X caused Δ" is 1, and for asserting "by mechanism m" is 2.

## Mechanism

Falsification in practice is a claim template with five fields, filled before measurement:

```text
Claim template
  population:   the task distribution and split identifier (§1.1)
  metric:       fixed-vocabulary name and estimator; normalization stated
  threshold:    the value and direction that would confirm
  rejects if:   the measured interval lies on the other side of the threshold
  competing:    the hypotheses the design discriminates, and the arm that tests each
```

```figure
id: fig-1.31
kind: stat-panel
title: Claim template and its RLVR audit
caption: >-
  The five fields are filled before measurement; a claim with an empty
  'rejects if' is returned as not a claim. The dot row counts the worked
  RLVR table below: four of five competing hypotheses have a rung-1 or
  rung-2 arm, and the contamination hypothesis has only a rung-0 audit that
  public information cannot close.
placement: rail
anchor: mechanism
evidence: DERIVED
source: ["DERIVED:alg-1.6", "DERIVED:eq-1.3"]
alt: >-
  Instrument panel for the claim template. Population: the task distribution
  and split identifier of §1.1. Metric: fixed-vocabulary name, estimator and
  normalization. Threshold: the value and direction that would confirm.
  Rejects if: the measured interval lies on the other side. Competing: the
  hypotheses and the arm that tests each. Minimum rung for 'X caused Δ': 1;
  for 'by mechanism m': 2. An empty rejects-if returns 'not a claim'
  (Algorithm 1.6 line 1). A dot glyph fills four of five dots for the RLVR
  hypotheses tested at rung 1 or 2; the hollow dot is contamination, rung 0
  with an audit.
spec:
  header: "CLAIM TEMPLATE · FIVE FIELDS"
  rows:
    - { key: "population", value: "𝒟_task and split id (§1.1)" }
    - { key: "metric", value: "fixed name, estimator, normalization" }
    - { key: "threshold", value: "value and direction that confirm" }
    - { key: "rejects if", value: "interval on the other side" }
    - { key: "competing", value: "hypotheses, and the arm for each" }
    - { key: "minimum rung, 'X caused Δ'", value: "1" }
    - { key: "minimum rung, 'by mechanism m'", value: "2" }
    - { key: "empty 'rejects if'", value: "not a claim (Algorithm 1.6 line 1)" }
  glyph:
    type: dots
    total: 5
    filled: 4
    legend:
      - { marker: filled, label: "RLVR hypothesis with a rung 1–2 arm", value: "4 of 5" }
      - { marker: hollow, label: "rung-0 audit only", value: "contamination" }
```

Worked application to the claim "reinforcement learning with verifiable rewards improved mathematical reasoning of model m":

| Competing hypothesis | Arm that tests it | Rung |
|---|---|---|
| The base checkpoint already produced the behavior at lower frequency; RL sharpened sampling | evaluate the base with matched sampling budget and pass@k ([§35.5](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-5-what-improved.md)); P28 reports base models exhibiting the patterns before RL | 1 |
| The optimizer's construction biased length, and the metric rewards length | control for response length; P28 reports GRPO artificially increasing length, especially for incorrect outputs | 1 |
| Evaluation items or paraphrases were in training data | contamination audit of the gate set ([§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md)) | 0 with audit |
| The reward source, not the algorithm, carried the gain | swap reward source with algorithm fixed (RLVR vs GRPO distinction, [§35.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-1-rlvr-formulation.md)) | 1 |
| A mechanism formed (verification-like features) | locate and ablate candidate features; test transfer to held-out problem types | 2 |

```figure
id: fig-1.32
kind: compare
title: Competing hypotheses for one reasoning-RL claim
caption: >-
  Four of the five hypotheses are closed by arms that cost evaluation and at
  most one re-run each (rung 1, or rung 0 with an audit); only the mechanism
  column needs rung 2. The contamination column cannot be closed from public
  information because the base models' training data are NOT-DISCLOSED, so
  any claim about this gain carries that hypothesis open.
placement: wide
evidence: PAPER-REPORTED
source: [P28, P26]
alt: >-
  Comparison of five competing explanations of the claim that reinforcement
  learning with verifiable rewards improved mathematical reasoning of a
  model. Base already had it: tested by evaluating the base at a matched
  sampling budget and pass@k, rung 1; P28 reports base models exhibiting the
  patterns before RL. Length bias: tested by controlling for response
  length, rung 1; P28 reports GRPO artificially increasing length,
  especially for incorrect outputs. Contamination: tested by a contamination
  audit of the gate set, rung 0 with audit; the base models' training data
  are NOT-DISCLOSED. Reward source: tested by swapping the reward source with
  the algorithm fixed, rung 1; no such swap is cited here. A mechanism
  formed: tested by locating and ablating candidate features and testing
  transfer to held-out problem types, rung 2; no account surviving rung-3
  tests is cited.
spec:
  axis: >-
    Explanations of 'RLVR improved mathematical reasoning of model m', each
    with the arm and rung that discriminates it
  columns:
    - { id: base, label: "Base already had it" }
    - { id: len, label: "Length bias" }
    - { id: contam, label: "Contamination" }
    - { id: rew, label: "Reward source" }
    - { id: mech, label: "A mechanism formed" }
  rows:
    - { dimension: "hypothesis", values: { base: "the base produced the behavior at lower frequency; RL sharpened sampling", len: "the optimizer biased length and the metric rewards length", contam: "evaluation items or paraphrases were in training data", rew: "the reward source, not the algorithm, carried the gain", mech: "verification-like features formed" } }
    - { dimension: "arm that tests it", values: { base: "evaluate the base at matched sampling budget and pass@k (§35.5)", len: "control for response length", contam: "contamination audit of the gate set (§61.4)", rew: "swap the reward source, algorithm fixed (§35.1)", mech: "locate and ablate candidate features; test transfer to held-out problem types" } }
    - { dimension: "rung", values: { base: "1", len: "1", contam: "0 with audit", rew: "1", mech: "2" } }
    - { dimension: "what the cited work reports", values: { base: "P28: DeepSeek-V3-Base already shows an 'Aha moment'; Qwen2.5 bases reason without templates", len: "P28: GRPO artificially increases length, especially for incorrect outputs", contam: "base training data NOT-DISCLOSED; not closable from public information", rew: "no single-variable swap cited in this section", mech: "no account surviving rung-3 tests cited; UNVERIFIED" } }
```

The scaling literature provides a second example of hypothesis competition: P08 and P09 fit different allocations of N and D at fixed C; P09 attributes the difference to learning-rate schedule and fitting method, which is a claim that a level other than the scaling variables was not held fixed in the earlier work (PAPER-REPORTED · P09; the attribution is the authors', not independently reproduced here).

Cost line: rung 0 costs evaluation FLOPs; rung 1 costs one re-run per hypothesis; rung 2 costs forward passes plus the replacement-model training that attribution graphs require (P52 reports training cross-layer transcoders; their cost is NOT-DISCLOSED in the cited page); rung 3 costs pilot training. The stance does not require the highest rung for every claim; it requires that the rung be stated.

## Algorithm

```text
Algorithm 1.6 — Claim audit
INPUT   claim κ with fields (population, metric, threshold, rejects-if, competing); evidence set 𝔈
OUTPUT  audited claim with rung r, label, and status ∈ {supported, contradicted, undetermined}
INVARIANT  a claim with an empty rejects-if field is returned as "not a claim"
 1. if κ.rejects-if = ∅: return not-a-claim
 2. r := max rung of evidence in 𝔈 that addresses κ.population and κ.metric
 3. for each h in κ.competing: if no arm in 𝔈 discriminates h: status := undetermined; record h
 4. if all h discriminated and interval on the confirming side: status := supported at rung r
 5. if interval on the rejecting side: status := contradicted
 6. label := by 𝔈's provenance (PAPER-REPORTED if authors' own; MATHEMATICALLY-DERIVED if a derivation; UNVERIFIED if unchecked)
 7. return (κ, r, label, status)
TERMINATION  |competing| iterations
```

```figure
id: fig-1.33
kind: diagram
title: Claim audit, Algorithm 1.6
caption: >-
  Two exits come before any interval is read: a claim with no rejection
  condition is not a claim, and a claim with an undiscriminated competing
  hypothesis cannot be supported, only left undetermined or contradicted.
  'Supported' is reachable only along the emphasized path, and it always
  reads 'supported at rung r', never unqualified.
placement: inline
evidence: DERIVED
source: "DERIVED:alg-1.6"
alt: >-
  Top-to-bottom diagram of Algorithm 1.6. A claim κ with five fields enters a
  branch on whether its rejects-if field is empty; if so it is returned as
  not a claim. Otherwise the rung r is the highest rung of evidence in the
  evidence set 𝔈 that addresses the claim's population and metric. A branch
  asks whether an arm discriminates every competing hypothesis; any open
  hypothesis makes the status undetermined and is recorded. If all are
  discriminated, a branch on the side of the threshold on which the interval
  lies leads to supported at rung r (confirming side, the emphasized path)
  or contradicted (rejecting side); an interval on the rejecting side
  contradicts the claim even while a hypothesis is open. Every outcome
  receives a label from the provenance of 𝔈: PAPER-REPORTED,
  MATHEMATICALLY-DERIVED or UNVERIFIED.
spec:
  direction: TB
  nodes:
    - { id: k, kind: objective, label: "claim κ", sub: "population · metric · threshold · rejects-if · competing" }
    - { id: ev, kind: dataset, label: "evidence set 𝔈" }
    - { id: empty, kind: branch, label: "rejects-if empty?" }
    - { id: nac, kind: state, label: "not a claim" }
    - { id: rung, kind: metric, label: "r := max rung addressing population and metric" }
    - { id: disc, kind: branch, label: "every competing h discriminated by an arm?" }
    - { id: und, kind: state, label: "undetermined; open h recorded" }
    - { id: side, kind: branch, label: "interval side of the threshold" }
    - { id: sup, kind: state, label: "supported at rung r", emphasis: true }
    - { id: con, kind: state, label: "contradicted" }
    - { id: lab, kind: metric, label: "label from the provenance of 𝔈", sub: "PAPER-REPORTED · MATHEMATICALLY-DERIVED · UNVERIFIED" }
  edges:
    - { from: k, to: empty }
    - { from: empty, to: nac, label: "yes" }
    - { from: empty, to: rung, label: "no" }
    - { from: ev, to: rung, kind: dependency }
    - { from: rung, to: disc }
    - { from: disc, to: und, label: "some h open" }
    - { from: disc, to: side, label: "all discriminated" }
    - { from: side, to: sup, kind: emphasis, label: "confirming side" }
    - { from: side, to: con, label: "rejecting side" }
    - { from: und, to: con, label: "rejecting side still contradicts" }
    - { from: sup, to: lab }
    - { from: con, to: lab }
    - { from: und, to: lab }
```

Complexity: linear in the number of competing hypotheses. Implementation link: the observation layer of every section (What the paper claims / What the evidence shows / What we infer / What remains unknown) is the rendered output of this audit.

## Implementation

The stance is implemented editorially: the evidence label on every non-trivial statement; the four-part observation layer in every section; the Limitations heading's falsification line; and the rule that analogies are introduced as "heuristically". The rungs are realised on reference-stack systems: rung 0 on an *Inference engine* (vLLM, SGLang) under a pinned harness; rung 1 and rung 3 re-runs on the *Distributed training* layer (PyTorch FSDP2, TorchTitan) or the *Post-training / RL* layer (Hugging Face TRL, verl, OpenRLHF); rung 2 interventions as forward passes with hooks in PyTorch (*Model / autograd framework*) over Hugging Face Transformers model definitions (*Model definition / adaptation*). Attribution-graph tooling is outside the §4 system list and is reached through the Anthropic research surface (§1, #1). No software is pinned; versions are UNVERIFIED.

## Experimental design

Proposal: take one published reasoning-RL gain on an open base model and run the five arms of the worked table at matched sampling budgets, with contamination audit, three seeds, and paired bootstrap over problems; report which hypotheses survive. This is Study C of the plan's integrated experiments in miniature; it was not executed.

## Observations

**What the paper claims.** The attribution-graph method states that hypotheses read from a graph are validated by perturbation experiments on the underlying model, and lists as limitations missing attention-circuit explanations, incomplete reconstruction ("dark matter"), and uncertainty about the faithfulness of the replacement model (OFFICIAL-DOCUMENTATION · P52, accessed 2026-09-20). P28 claims that a minimalist recipe with its bias-corrected optimizer reaches a stated AIME 2024 accuracy from a 7B base (PAPER-REPORTED · P28); the number is not repeated here because its protocol is not reviewed in this chapter.

**What the evidence shows.** P52's own validation is rung 2 on its tested prompts; generalization to other prompts is stated by the authors as a limitation. P28's base-model finding is rung 1 relative to the R1-Zero claim: it varies the training arm (none) and holds the base fixed.

**What we infer.** DERIVED: the R1-Zero result (P26) and the P28 reanalysis are not contradictory; they are claims at different rungs about different quantities (behavior after RL versus behavior present before RL). ASSUMED: the residual after P28's controls is the object that a mechanism claim would need to explain; its size is a matter for the matched-budget arms.

**What remains unknown.** Whether any mechanistic account of reasoning behavior survives rung-3 tests is UNVERIFIED. The training data of the base models involved is NOT-DISCLOSED, so the contamination hypothesis cannot be closed from public information.

## Failure modes

> **Failure mode — analogy as explanation.** *Symptom:* a sentence of the form "the model reasons/knows/wants, therefore …". *Cause:* heuristic used as premise. *Detection:* no intervention cited. *Mitigation:* rewrite as a hypothesis with a rung-2 test.

> **Failure mode — last-intervention credit.** *Symptom:* the final edge of a route receives the whole gain. *Cause:* no base arm. *Detection:* Algorithm 1.6 step 3 flags the base-checkpoint hypothesis. *Mitigation:* evaluate the input artifact of the edge.

> **Failure mode — unfalsifiable claim.** *Symptom:* every outcome is read as support. *Cause:* rejects-if empty or threshold set after the data. *Detection:* Algorithm 1.6 step 1; timestamps. *Mitigation:* preregistration ([§6.6](../ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md)).

> **Failure mode — survivorship.** *Symptom:* the literature reports only routes that worked. *Cause:* negative results unpublished. *Detection:* absence of matched-budget failures in the record. *Mitigation:* the book's What-remains-unknown paragraphs record what has not been shown.

## Siblings

**Behavioral versus mechanistic evidence** — [§64.1](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/64-1-behavioral-versus-mechanistic-evidence.md)
Why it exists: to develop rung 2 methods. What assumption changed: internal access. What objective changed: faithfulness of an explanation. What problem it solved: behavior without mechanism. What new failure mode it introduced: over-reading partial circuits. Changed primitive: rung ladder → component-level causal graph.

**Controlled comparisons** — [§6.3](../ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md)
Why it exists: to design rung 1. What assumption changed: re-runs are affordable at pilot scale. What objective changed: minimize confounding. What problem it solved: attribution. What new failure mode it introduced: pilot results that do not transfer to scale. Changed primitive: hypothesis table → experimental design.

**Scientific boundaries of reasoning RL** — [§35.6](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-6-scientific-boundaries.md)
Why it exists: to apply the stance to one contested literature. What assumption changed: the domain is fixed. What objective changed: none. What problem it solved: an inventory of what has and has not been shown. What new failure mode it introduced: none. Changed primitive: general template → domain audit.

**Interpreting scores** — [§62.6](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-6-interpreting-scores.md)
Why it exists: rung 0 evidence from human and judge preferences. What assumption changed: the metric is a preference. What objective changed: none. What problem it solved: reading a win-rate correctly. What new failure mode it introduced: judge bias as a hidden hypothesis. Changed primitive: falsification condition → score interpretation rules.

## Extensions

Domain adaptation adds the hypothesis "the domain corpus contained the test distribution". Long context adds "the retrieval or cache policy, not the model, changed". Multimodality adds encoder-level hypotheses. Agents add "the tool or environment changed" and require trajectory-level audits ([§63.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-3-stage-attribution.md)). Embodiment adds simulator-to-real hypotheses. Each is a row added to the competing-hypotheses table; proposals only.

## Limitations

Valid regime: claims about measurable behavior or measurable internals. Falsification of the stance itself: if rung-0 evidence were shown to predict rung-2 findings reliably across a documented sample of claims, the ladder could be flattened; no such study is cited. Decision consequence: a claim's rung, not its source's reputation, determines how much decision weight it carries.

## Reproducibility

Artifacts: claim records with the five fields. Configurations: none. Unresolved: replacement-model training cost for attribution graphs (NOT-DISCLOSED in the cited page); public inventory of level-attributed reasoning-RL claims (UNVERIFIED).

## References

P08, P09, P26, P28, P50, P52.
