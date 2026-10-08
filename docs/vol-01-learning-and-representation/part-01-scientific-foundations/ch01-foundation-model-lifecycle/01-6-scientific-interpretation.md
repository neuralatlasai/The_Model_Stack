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
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 1.6 Scientific interpretation

## Scope

This section distinguishes behavioral measurements, physical accounting, mechanistic hypotheses, and causal effects of training choices. It specifies how a claim becomes testable, how alternative explanations are compared, and what perturbation evidence establishes. The examples are the circuit-tracing methodology of Anthropic (P52), the R1-Zero analysis of Liu et al. (P28), and the compute-allocation experiments of Hoffmann et al. (P09). The output is a claim record with a defined estimand, evidence provenance, assumptions, and a possible rejecting outcome. Component-analysis techniques are developed in [Chapter 64](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/README.md); experiment design is developed in [Chapter 6](../ch06-experimental-design-and-evaluation-before-optimization/README.md).

## Why this exists

A measured improvement and an explanation of that improvement are different scientific objects. DeepSeek-R1 reports improved mathematical performance after reinforcement learning; Liu et al. investigate how base-model behavior and optimization normalization contribute to R1-Zero-like results (P26, §§2–4; P28, §§2–3). The latter questions cannot be settled by repeating the post-training score alone. Similarly, an attribution graph depicts a hypothesis about internal computation; its correspondence to the original model requires validation rather than visual plausibility (P52, “Validating the Replacement Model” and appendices).

These sources support a discipline of matching conclusions to measurements. They do not establish that every benchmark result is causally uninterpretable, that physical explanations always precede internal analysis, or that increasingly expensive experiments form a universal hierarchy of truth. A sufficiently discriminating observational prediction can reject a hypothesis; a poorly designed intervention can leave the causal quantity unidentified.

## Intuition

An explanation must specify the quantity it explains. A latency change may follow from transferred bytes and achieved bandwidth. A change in answer frequency may follow from decoding settings or altered conditional probabilities. An internal-feature intervention addresses how the trained network computes a response under a particular perturbation. A training intervention addresses how the training procedure changes behavior or internal structure. These questions can be related, but their estimands differ.

Cognitive expressions such as “retrieves,” “plans,” or “checks” are admissible only as operationally defined task or behavior labels. They do not identify an internal process by themselves. “Retrieval” may mean an observed query to an external index; an assertion about internal retrieval must instead name the measured representation, intervention, and predicted downstream effect. This chapter uses those definitions directly, without relying on a cognitive analogy to supply missing evidence.

## Formulation

> **Definition — mechanistic hypothesis.** A proposed account of model computation in terms of specified components, representations, interactions, and their effects on a defined output. Its scope includes the input population, model checkpoint, intervention semantics, and omitted components.

> **Definition — physical explanation.** An account based on required work, state, transfers, scheduling, or another resource-bearing process at a stated measurement boundary. A lower bound constrains possible execution; identifying the observed bottleneck additionally requires evidence about achieved execution.

> **Definition — falsification condition.** An outcome that conflicts with a claim's stated prediction under its measurement and identification assumptions. For stochastic claims, the record states an error-controlled decision procedure rather than treating a single contrary sample as decisive.

The following classification is editorial. The numbers identify evidence types; they are not a universal ordering of reliability or cost.

| Type | Measurement | Supported conclusion and boundary |
|---|---|---|
| 0: behavioral | outputs under a documented protocol | the measured behavior and its uncertainty on that population; hypotheses predicting incompatible distributions may be rejected |
| 1: controlled comparison | an intervention with comparable arms and a specified assignment/design | an effect of the intervention under the design's identification assumptions; a package intervention need not identify its components |
| 2: internal perturbation | ablation, activation replacement, or steering with controls | sensitivity or a defined intervention effect for tested components and inputs; necessity or sufficiency needs its own operational test |
| 3: training intervention | controlled changes to data, objective, optimization, or architecture | an effect of the training choice on the measured outcome; formation of a particular mechanism requires measuring that mechanism too |

```figure
id: fig-1.29
kind: hierarchy
title: Four evidence types and their identification requirements
caption: >-
  Numbers identify measurement types used by the chapter. The arrangement
  does not imply that reliability or cost increases monotonically. Each
  type answers a different question and requires a matching estimand.
placement: rail
anchor: formulation
evidence: ASSUMED
source: [P52, P28, P09]
concepts: [ms.section.1.6]
alt: >-
  Four labeled evidence types: behavioral measurements, controlled comparisons,
  internal perturbations, and training interventions. Behavioral data require
  a population and protocol; comparisons require identification assumptions;
  internal perturbations require semantics and controls; training interventions
  require measurement of the outcome, including any claimed internal mechanism.
spec:
  direction: up
  levels:
    - { label: "Type 3 · training intervention", kind: process, note: "training choice → measured outcome; mechanism formation needs a mechanism measurement" }
    - { label: "Type 2 · internal perturbation", kind: process, note: "specified perturbation → output effect on tested inputs" }
    - { label: "Type 1 · controlled comparison", kind: branch, note: "intervention effect under design and identification assumptions" }
    - { label: "Type 0 · behavioral measurement", kind: metric, note: "population, protocol, estimator, uncertainty" }
```

An ablation reducing a behavior is evidence about removal under that ablation. It need not establish unique necessity in the unmodified network: the intervention may shift activations outside their usual distribution, remove several computations, or interact with redundant routes. A sufficiency test must specify the background into which a component is inserted or activated and whether the behavior follows there. A training change that alters both a proposed mediator and behavior does not by itself establish mediation; alternative paths remain possible.

```figure
id: fig-1.30
kind: compare
title: Behavioral, physical, mechanistic, and cognitive statements
caption: >-
  Statements are compared by their measured object and missing inference.
  Cognitive vocabulary supplies no extra identification; physical and
  mechanistic claims may both be needed for the same system.
placement: wide
evidence: ASSUMED
source: [P52, P28, "DERIVED:eq-1.6"]
alt: >-
  Four columns distinguish output measurements, resource accounts, component
  hypotheses, and cognitive labels. Each is paired with a required definition
  or validation; no column automatically outranks the others.
spec:
  axis: "Kind of statement and the evidence required for its use"
  columns:
    - { id: beh, label: "Behavioral" }
    - { id: phys, label: "Physical" }
    - { id: mech, label: "Mechanistic" }
    - { id: cog, label: "Cognitive label" }
  rows:
    - { dimension: "object", values: { beh: "outputs under a protocol", phys: "work, state, transfer, scheduling", mech: "components and their effects", cog: "task or process vocabulary" } }
    - { dimension: "required evidence", values: { beh: "population and uncertainty", phys: "boundary and accounting assumptions; execution measurements", mech: "intervention semantics, controls, validation", cog: "operational definition; otherwise no additional evidence" } }
    - { dimension: "remaining inference", values: { beh: "internal implementation and training causes", phys: "actual bottleneck if only a lower bound is known", mech: "generalization, redundancy, omitted components", cog: "which observable or internal process the word denotes" } }
```

## Mechanism

### Methodology

P52 trains cross-layer transcoders to approximate a language model's MLP computations with sparse features. Features read from residual-stream representations at one layer and can contribute to reconstructed MLP outputs at multiple later layers. For an analyzed prompt, a local replacement model uses these reconstructed computations and models the original computation's unreconstructed contribution with error terms. Attribution edges estimate contributions between features and output logits in this constructed model. The graph is consequently a model of selected computation, not a complete recording of every causal operation in the original Transformer.

The source distinguishes three questions. Reconstruction asks whether the replacement model reproduces original activations and outputs. Perturbation faithfulness asks whether changes to replacement-model features predict changes in the original model. Graph faithfulness asks whether the displayed edges capture the replacement model's relevant interactions. Original attention patterns and other quantities are held fixed in parts of the analysis; nonlinear downstream changes can therefore escape the graph. Sparse features, error nodes, graph pruning, and prompt-specific construction each restrict the interpretation (P52, methodology and limitations).

P28 uses a different method. It samples base models under controlled prompt templates to test whether behaviors described after R1-Zero training already occur before it. Separately, it analyzes the GRPO objective's response-length normalization and within-group reward standard deviation. Its Dr. GRPO objective removes those normalizations and uses a constant response-length scale. This is a change to the optimization estimator, not a change in the verifier's mathematical correctness criterion. The paper's derivation concerns the estimator; its training curves supply empirical evidence for consequences under specified models and tasks. Removing both terms in one comparison does not independently estimate each term's contribution (P28, §3 and Appendix A).

A claim record therefore contains the following fields. Descriptive claims need a measurement definition; causal claims additionally need a treatment, comparison, and identification argument. An incomplete record is returned for clarification as an editorial matter, rather than declared scientifically meaningless.

```text
Claim record
  target:       descriptive quantity or causal estimand
  population:   tasks, sampling unit, split, and model checkpoint
  protocol:     prompting, decoding, intervention, assignment, controls
  prediction:   expected value/range or directional contrast
  uncertainty:  estimator, dependence structure, error-control procedure
  rejects_if:   outcome inconsistent with the prediction under assumptions
  alternatives: explanations addressed, remaining, or outside the claim's scope
  provenance:   exact source and locator, or an explicitly unexecuted proposal
```

```figure
id: fig-1.31
kind: stat-panel
title: Claim-record fields
caption: >-
  These fields describe an audit record. They are not a completeness score
  for a published paper, and no experiment is represented as executed here.
placement: rail
anchor: mechanism
evidence: ASSUMED
source: [P52, P28]
alt: >-
  Claim record containing a target estimand, population, protocol, prediction,
  uncertainty procedure, rejecting outcome, alternatives, and provenance.
spec:
  header: "CLAIM AUDIT · editorial record"
  rows:
    - { key: "target", value: "quantity or causal estimand" }
    - { key: "population", value: "tasks, units, split, checkpoint" }
    - { key: "protocol", value: "prompt, decoding, intervention, controls" }
    - { key: "prediction", value: "value, range, or contrast" }
    - { key: "uncertainty", value: "estimator and dependence assumptions" }
    - { key: "rejects_if", value: "incompatible measured outcome" }
    - { key: "alternatives", value: "addressed and remaining explanations" }
    - { key: "provenance", value: "source locator or unexecuted proposal" }
```

## Algorithm

```text
Algorithm 1.6 — Audit a claim against evidence
INPUT   claim record κ; evidence records E with protocol, scope, and provenance
OUTPUT  status ∈ {supported_within_scope, contradicted, undetermined, incomplete}; reasons
INVARIANT  evidence type is never converted into a universal confidence rank
 1. if target, population, protocol, or prediction is undefined: return incomplete
 2. identify records addressing κ.target under comparable populations and protocols
 3. check estimator assumptions, intervention semantics, and causal identification if claimed
 4. if a valid result meets the prespecified rejecting condition: return contradicted, with scope
 5. if adequate evidence supports the prediction and required assumptions/controls hold:
       return supported_within_scope, with unresolved alternatives and transfer limits
 6. return undetermined, with the missing comparison, precision, or validation
TERMINATION  after each evidence record and alternative has been inspected
```

The audit costs O(n + h) for n already indexed evidence records and h listed alternatives. Obtaining those records has no fixed cost: evaluation can exceed a pilot-training budget, internal analysis may require auxiliary-model training, and some controls can reuse existing outputs. The algorithm prevents a provenance label such as PAPER-REPORTED from being treated as causal identification.

```figure
id: fig-1.33
kind: diagram
title: Claim audit with scoped conclusions
caption: >-
  A rejecting result can contradict a precise prediction without resolving
  every alternative explanation. Support requires the controls needed for
  the particular claim, and its scope remains explicit.
placement: inline
evidence: ASSUMED
source: "DERIVED:alg-1.6"
alt: >-
  A claim first receives a completeness check, then a scope and assumption
  check. Valid rejecting evidence leads to contradicted; adequate supporting
  evidence leads to supported within scope; missing evidence leads to
  undetermined. Each exit records reasons and limitations.
spec:
  direction: TB
  nodes:
    - { id: claim, kind: objective, label: "claim record and evidence" }
    - { id: complete, kind: branch, label: "target and protocol defined?" }
    - { id: incomplete, kind: state, label: "incomplete" }
    - { id: valid, kind: process, label: "check scope, estimator, identification" }
    - { id: reject, kind: branch, label: "valid rejecting evidence?" }
    - { id: con, kind: state, label: "contradicted within scope" }
    - { id: enough, kind: branch, label: "adequate support for this claim?" }
    - { id: sup, kind: state, label: "supported within scope", emphasis: true }
    - { id: und, kind: state, label: "undetermined; missing evidence recorded" }
  edges:
    - { from: claim, to: complete }
    - { from: complete, to: incomplete, label: "no" }
    - { from: complete, to: valid, label: "yes" }
    - { from: valid, to: reject }
    - { from: reject, to: con, label: "yes" }
    - { from: reject, to: enough, label: "no" }
    - { from: enough, to: sup, label: "yes", kind: emphasis }
    - { from: enough, to: und, label: "no" }
```

## Implementation

Each evidence record links the original model, any replacement model, intervention code, inputs, and outputs. Internal perturbations need the exact hook location and whether a feature is removed, clamped, replaced with another input's activation, or injected at a selected magnitude. Logit differences, probabilities, generated-answer frequencies, and task accuracy are separate outcomes. Generation adds sampling variance and sequential feedback beyond a one-step logit test. PyTorch hooks and model definitions are implementation surfaces, not evidence that the experiment was executed; this chapter pins no intervention software.

For training comparisons, record input checkpoints, data exposure, objective implementation, optimizer configuration, stopping rule, and evaluation budget. For resource explanations, record the actual boundary and the assumptions in [§1.5](01-5-resource-accounting.md). For all claims, preserve author-reported findings separately from book derivations and hypotheses. Proposed experiments appear in [verification](verification.md), not as manuscript observations.

## Experimental design

### Reported experiments

P52's “Validating Node-to-Logit Attributions” appendix compares predicted and observed output-logit changes for feature perturbations across 20 prompts. Its feature-to-feature validation also uses 20 prompts and restricts intervention/measurement layer separation to a small local range; the reported Spearman correlation is 0.72. These are tests of the method's prediction under the chosen perturbations and sampling procedure, not a census of all model circuits. Faithfulness experiments compare original-model and replacement-model responses to upstream perturbations using cosine similarity and mean-squared error. The authors explain why direct effects partly follow from clamping choices, while indirect downstream effects provide a less trivial test. Reconstruction error can compound as interventions propagate.

P28 samples DeepSeek-V3-Base on 500 MATH questions using an R1-style template and identifies response patterns with self-reflection-related phrases (§2.3). The presence of such phrases before RL rejects the particular claim that the phrases first appear only after RL; it does not prove their causal role in solving the problems. Its optimization experiments use Qwen2.5 models, MATH training prompts, a binary mathematical verifier, and several held-out mathematical benchmarks (§3). Length and accuracy curves are outcomes of those model/objective/training combinations. They do not identify a general cognitive mechanism, and a full hardware-and-seed uncertainty analysis is not supplied by this chapter.

```figure
id: fig-1.32
kind: compare
title: Published reasoning-RL evidence and remaining explanations
caption: >-
  The table separates tests reported by P28 from questions requiring further
  evidence. No proposed control is counted as completed, and no claim of
  complete contamination exclusion or internal-mechanism identification is made.
placement: wide
evidence: PAPER-REPORTED
source: [P28, P26]
alt: >-
  Three columns compare base-response sampling, optimizer normalization,
  and unresolved causal questions. Source sections and limits accompany
  the reported measurements.
spec:
  axis: "What was measured and what it does not identify"
  columns:
    - { id: base, label: "Base behavior" }
    - { id: norm, label: "Normalization" }
    - { id: open, label: "Remaining questions" }
  rows:
    - { dimension: "source", values: { base: "P28 §2.3", norm: "P28 §3 and Appendix A", open: "not resolved by these comparisons" } }
    - { dimension: "measurement", values: { base: "samples on 500 MATH questions with R1 template", norm: "length and accuracy after changed GRPO normalization", open: "contamination, matched lifetime cost, internal mediation" } }
    - { dimension: "supported boundary", values: { base: "selected phrases occur before RL", norm: "estimator effects in tested training settings", open: "additional evidence required" } }
    - { dimension: "does not establish", values: { base: "phrases cause correct reasoning", norm: "separate effect of every changed term", open: "a universally novel or uniquely necessary mechanism" } }
```

## Observations

**What the paper claims.** P52 presents attribution graphs and tests their faithfulness against perturbations of the original model, while acknowledging incomplete reconstruction and limitations involving attention. P28 argues that base models and normalization biases contribute to R1-Zero-like behavior and proposes Dr. GRPO. P09 supplies compute-matched tests of allocation predictions.

**What the evidence shows.** These sources use different outcomes: internal activation/logit effects, generated-response patterns and task scores, and language-model loss. The 20-prompt circuit-validation tests support local method fidelity under the reported conditions. Base-model phrase observations establish presence, and controlled training comparisons establish effects only to the extent their controls and estimators identify them.

**What we infer.** A result can support post-training improvement and still leave its proposed internal explanation unresolved. A benchmark can distinguish hypotheses with different observable predictions; it cannot establish an arbitrary internal implementation when several mechanisms predict the same output distribution. This is an identification limit, not a prohibition on behavioral evidence.

**What remains unknown.** This chapter independently reproduces none of these experiments. It does not establish complete contamination exclusion, universal transfer of circuit findings, or the mediation of reasoning improvements by a specific set of internal features. Missing public training records restrict contamination audits; disclosure of coarse mixture categories does not close that gap.

## Failure modes

An explanation fails when its conclusion exceeds its estimand: a phrase count becomes proof of reasoning, a removed feature becomes uniquely necessary, a training-package gain becomes the effect of one objective term, or a lower bound becomes an identified runtime bottleneck. Detection requires comparing the sentence's causal verb with the actual intervention and measured outcome. The remedy is a narrower conclusion or an additional identifying comparison.

Post hoc thresholds and repeated examination of the same evaluation set can inflate support. Record selection procedures and uncertainty, retain negative outcomes, and reserve independent confirmation where the claim depends on a chosen configuration. An absent failure report is not evidence that failures never occurred.

## Siblings

[§64.1](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/64-1-behavioral-versus-mechanistic-evidence.md) develops component-level interpretation and its faithfulness criteria. [§6.3](../ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md) develops assignment, confounding, and comparative estimands. [§35.6](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-6-scientific-boundaries.md) applies those distinctions to reasoning-RL claims; [§62.6](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-6-interpreting-scores.md) addresses preference-score interpretation. The changed primitive is respectively an internal intervention, an identified contrast, a domain-specific claim, and a preference estimator.

## Extensions

### Improvements

Cross-layer transcoders change the reconstruction architecture relative to per-layer transcoders by allowing features to write across later layers; P52 evaluates reconstruction and perturbation behavior rather than treating sparsity alone as fidelity. Its explicit error nodes and validation procedures improve the inspectability of an explanation while preserving visible limitations. Dr. GRPO changes objective normalization and reports corresponding training behavior; interpreting the improvement still requires its matched comparator and task regime (P28, §3).

For retrieval, agents, or multimodal systems, the hypothesis set expands to the retriever, tools, encoders, environment, and policies. Stage-level measurements become necessary when the claimed intervention spans those components. The claim-record format extends to those estimands without asserting that any unrun experiment has established them.

## Limitations

The evidence-type classification is an editorial taxonomy, not an empirical law and not a completeness proof. A finite list of alternatives cannot establish that every possible explanation has been excluded. Intervention effects depend on their semantics and background; transfer beyond the tested inputs requires additional sampling and validation. Supported claims remain conditional on measurement quality and identification assumptions.

## Reproducibility

Retain source revision and locator, checkpoint identity, prompt set, perturbation definition, generated samples, score extraction, and uncertainty procedure. The references page records fulltexts inspected on 2026-10-07; the verification page distinguishes unexecuted controls from reported experiments. Replacement-model code and weights, training costs, and a complete source-artifact audit remain unverified here. The section retains manuscript_draft status.

## References

P09, P26, P28, P52; P50 for protocol-defined evaluation. Source revisions and inspected locators are recorded in [references](references.md).
