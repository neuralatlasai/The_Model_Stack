---
id: ms.section.1.2
entity_type: section
title: Levels of analysis
short_title: Levels of analysis
volume: 1
part: 1
chapter: 1
section: 1.2
slug: 01-2-levels-of-analysis
parent: ms.chapter.1
prev_sibling: ms.section.1.1
next_sibling: ms.section.1.3
children: []
prerequisites: [ms.section.1.1]
downstream: [ms.section.6.3, ms.section.13.6, ms.section.35.6, ms.section.63.3, ms.section.64.1]
related: [ms.section.1.6]
siblings_by_mechanism: []
relations:
  - {type: prerequisite_of, target: ms.section.6.3}
  - {type: supported_by, target: paper.P28}
  - {type: supported_by, target: paper.P36}
axes:
  lifecycle: [evaluation, assurance]
  mechanism: [levels_of_analysis, attribution]
  feedback_setting: []
  modality: [text]
papers: [P14, P19, P26, P28, P36]
implementations: [impl.vllm, impl.sglang, impl.flashattention]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [KNOWN, DERIVED, PAPER-REPORTED, UNVERIFIED, NOT-DISCLOSED, ASSUMED]
  empirically_observed: false
word_count_target: 1700
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 1.2 Levels of analysis

## Scope

The seven analysis levels distinguish objective, representation, algorithm, implementation, runtime, infrastructure, and product behavior; data exposure and evaluation protocol cut across them. The subject is attribution of a measured contrast to a defined intervention. Matched settings alone do not guarantee causal identification, and a jointly changed system supports a package comparison. The section develops a disclosure/contrast record; controlled experimental design is treated in Chapter 6 and component-level analysis in Chapter 64.

## Why this exists

PAPER-REPORTED · [P19, §§2–4](https://arxiv.org/html/2205.14135v2) and [P36, §§3–6](https://arxiv.org/pdf/2309.06180): exact attention and cache management change execution without constituting a new language-model objective. PAPER-REPORTED · [P28, §§2–3](https://arxiv.org/html/2503.20783v1): reasoning-style outputs also depend on the initial checkpoint, prompt template, and optimization normalization. These studies motivate distinct attribution questions. DERIVED: a comparison between released systems measures the effect of their complete disclosed configuration; attributing that difference to a particular component requires additional controls and an explicitly defined estimand.

## Intuition

DERIVED: the seven levels are an editorial decomposition of variables, not an established causal hierarchy or seven independent physical systems. Their purpose is to ask what changed and which measurements can detect its effect. A prompt modification may leave weights unchanged while changing input tokens, retrieval calls, acceptance, and latency. A new kernel may preserve the real-arithmetic function while changing floating-point rounding and feasible batch sizes. The observed outcome includes these interactions unless the comparison explicitly holds them fixed.

## Formulation

> **Definition — level of analysis.** One of seven strata at which a foundation-model system is described and varied: objective, representation, algorithm, implementation, runtime, infrastructure, product behavior. A claim is attributed to the level whose variable changed.

> **Definition — held-fixed rule.** A single-level effect is identified by a comparison that holds other outcome-relevant variables fixed, or by an explicitly justified identification model. Listing co-variables does not remove their effects; statistical adjustment requires additional causal and statistical conditions.

Write a system as ψ = (O, Rp, A, I, Rt, If, Pb) with outcome Y(ψ). The effect attributed to O → O′ is

$$
\Delta_O = Y(O', \mathrm{Rp}, A, I, \mathrm{Rt}, \mathrm{If}, \mathrm{Pb}) - Y(O, \mathrm{Rp}, A, I, \mathrm{Rt}, \mathrm{If}, \mathrm{Pb})
$$
*(Eq. 1.3)* where O = objective, Rp = representation (architecture, parameterization, tokenizer), A = optimization algorithm and schedule, I = implementation (framework, kernels), Rt = runtime (engine, decoding, batching), If = infrastructure (accelerators, fabric, precision), Pb = product behavior, Y = outcome under the success criterion of [§1.1](01-1-problem-formulation.md).

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.3].** A comparison that changes multiple coordinates measures a joint configuration difference. Without cross-comparisons or identification conditions it does not identify Eq. 1.3's single-coordinate effect. It remains valid evidence about the tested complete systems.

| Level | What varies | Admissible evidence | Owner |
|---|---|---|---|
| Objective | loss, targets, masks, normalization, reward | MATHEMATICALLY-DERIVED for properties; PAPER-REPORTED with held-fixed data for effects | [04](../ch04-language-modeling-and-learning-objectives/README.md), [19.1](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-1-objective-selection.md), [32](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch32-preferences-reward-models-verifiers-and-oversight/README.md) |
| Representation | architecture, N, state, tokenizer | matched-budget ablation ([13.6](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-6-architectural-ablations.md)) | [13–18](../../part-03-model-architectures-and-state/README.md), [10](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/README.md) |
| Algorithm | optimizer, schedule, batch semantics, RL construction | ablation with identical data, initialization, steps | [19–21](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/README.md), [33–35](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch33-direct-preference-optimization-and-related-objectives/README.md) |
| Implementation | framework, kernels, numerics, parallelism code | reference comparison within tolerance; OFFICIAL-DOCUMENTATION for a pinned version | [03](../ch03-numerical-computation-and-trustworthy-training/README.md), [26–29](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/README.md) |
| Runtime | engine, batching, cache policy, decoding | same weights and inputs; latency/throughput with boundary stated | [42–45](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md) |
| Infrastructure | accelerator, memory, fabric, precision, cluster | measured under a declared workload; vendor peaks are not evidence | [25](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch25-accelerators-memory-hierarchy-and-performance-models/README.md), [30](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/README.md) |
| Product behavior | prompts, templates, retrieval, filters, tools | behavioral evaluation with model, runtime, data fixed | [49–54](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/README.md), [61–63](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/README.md) |

```figure
id: fig-1.10
kind: hierarchy
title: Seven levels of analysis and what each re-spends
caption: >-
  The seven places where behavior can be changed by spending a resource,
  from the objective down to what the user sees. Product behavior spends
  nothing on the model, so a product-level gain could have been bought at
  any of the six rows above it. Scroll: the lit rows follow the section, from
  the single row Eq. 1.3 varies to the rows each category error confuses.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-1.3", P14, P19, P36, P28]
concepts: [ms.section.1.2]
alt: >-
  Seven-level hierarchy, top to bottom. Objective: loss, targets, masks,
  normalization, reward; re-spends training FLOPs. Representation:
  architecture, N, state, tokenizer; re-spends parameters and memory.
  Algorithm: optimizer, schedule, batch semantics, RL construction;
  re-spends optimizer steps. Implementation: framework, kernels, numerics;
  evidence is a reference comparison within tolerance. Runtime: engine,
  batching, cache policy, decoding; re-spends memory traffic and latency.
  Infrastructure: accelerator, fabric, precision; re-spends communication
  and money, and vendor peaks are not evidence. Product behavior: prompts,
  templates, retrieval, filters, tools; spends nothing on the model. States
  light the objective row for Eq. 1.3; representation, algorithm,
  implementation and runtime for the three category errors; representation
  and algorithm for P28's reanalysis; implementation, runtime and product
  behavior for the failure modes; representation for the sibling that
  attributes inside it.
states:
  - { anchor: formulation, label: "Eq. 1.3 · Δ_O", highlight: ["Objective O"], note: "Eq. 1.3 changes one row and holds six fixed. A difference between two released models changes all seven plus data and is evidence about none of them." }
  - { anchor: mechanism, label: "three category errors", highlight: ["Representation Rp", "Algorithm A", "Implementation I", "Runtime Rt"], note: "LoRA sits at representation and algorithm and is not compression (P14); IO-aware exact attention is implementation only (P19); paged KV allocation is runtime only (P36)." }
  - { anchor: observations, label: "P28 on R1-Zero", highlight: ["Representation Rp", "Algorithm A"], note: "P28 moves part of a behavior credited to GRPO (algorithm) down to the base checkpoint (representation plus data). The base arm is the control every post-training claim needs." }
  - { anchor: failure-modes, label: "cross-level attribution", highlight: ["Implementation I", "Runtime Rt", "Product behavior Pb"], note: "A kernel or engine speed-up reported as a modeling advance, a template or harness change moving a score with weights fixed, and 'reasoning' listed as a method." }
  - { anchor: siblings, label: "levels, layers, components", highlight: ["Representation Rp"], note: "Stack layers (§4.1) are packages, not variables of a claim; §64.1 attributes inside the representation row rather than across rows." }
spec:
  direction: down
  levels:
    - { label: "Objective O", kind: objective, note: "loss, targets, masks, normalization, reward · re-spends training FLOPs" }
    - { label: "Representation Rp", kind: model, note: "architecture, N, state, tokenizer · re-spends parameters and memory" }
    - { label: "Algorithm A", kind: process, note: "optimizer, schedule, batch semantics, RL construction · re-spends steps" }
    - { label: "Implementation I", kind: process, note: "framework, kernels, numerics · evidence: reference comparison in tolerance" }
    - { label: "Runtime Rt", kind: state, note: "engine, batching, cache policy, decoding · re-spends traffic and latency" }
    - { label: "Infrastructure If", kind: hardware, note: "accelerator, fabric, precision · vendor peaks are not evidence" }
    - { label: "Product behavior Pb", kind: node, note: "prompts, templates, retrieval, filters, tools · spends nothing on the model" }
```

DERIVED: data is a separate input to this decomposition. Its identity, mixture, order, duplication, and train/evaluation separation cannot be represented by token count alone. Eq. 1.3 suppresses these inputs only to keep the notation short; an attribution record must retain them. Precision is recorded at the implementation and hardware boundary, since a dtype is a numerical choice and hardware support determines its execution cost.

## Mechanism

### Methodology

DERIVED: first define the outcome Y as an expectation over evaluation units and execution randomness, or explicitly as the result of a particular deterministic run. Eq. 1.3 describes a contrast, not an estimator: estimating it requires paired evaluation units, a defined training/decoding randomness distribution, and uncertainty appropriate to those units. Matching a random seed does not establish identical random trajectories when implementations consume random values in different orders.

PAPER-REPORTED · [P14, §4.1](https://arxiv.org/html/2106.09685v2): LoRA freezes a pretrained matrix W₀ and parameterizes its update as BA. The base checkpoint initializes training; after merging, the deployed matrix is W₀+BA rather than unchanged W₀. The additional factors reduce trainable state; they do not remove the dense base weights. DERIVED: distinguish changed parameterization and optimization state from compression of the deployed artifact. Whether an adapter remains separate or is merged also changes the execution contract.

PAPER-REPORTED · [P19, §3.1 and Algorithm 1](https://arxiv.org/html/2205.14135v2): FlashAttention tiles query/key/value operations and maintains running row maxima and normalizers, avoiding materialization of the full score/probability matrices in HBM. It reconstructs intermediates during the backward pass. DERIVED: real-arithmetic attention is preserved while the execution graph and memory traffic change; floating-point equivalence requires tolerance-based tests. The mechanism's owner is [Chapter 27](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch27-attention-latent-attention-and-expert-kernels/README.md), which must establish exact kernel-version claims.

PAPER-REPORTED · [P36, §§4–5](https://arxiv.org/pdf/2309.06180): PagedAttention maps logical KV blocks to physical storage and uses reference counting and copy-on-write for sharing. Its serving system also changes scheduling and batch admission. DERIVED: an end-to-end vLLM comparison therefore tests a runtime package, not the cache kernel alone. A throughput improvement accompanied by a larger resident batch is consistent with the capacity mechanism; identifying a kernel-only contribution requires its own matched-batch experiment.

When two levels co-vary, the joint difference decomposes exactly. For objective and algorithm,

$$
Y(O',A') - Y(O,A) = \underbrace{Y(O',A) - Y(O,A)}_{\Delta_O} + \underbrace{Y(O,A') - Y(O,A)}_{\Delta_A} + \underbrace{Y(O',A') - Y(O',A) - Y(O,A') + Y(O,A)}_{\Delta_{O\times A}}
$$
*(Eq. 1.10)* where the other five levels and data are held fixed in all four arms, and Δ_{O×A} is the interaction.

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.10].** Four arm outcomes determine this two-factor decomposition without an additivity condition. For k binary factors, evaluating every configuration with s replications costs s·2^k runs. Baseline-plus-single-factor comparisons cost s·(k+1) runs and estimate effects at the baseline configuration, leaving interactions unresolved. This is a design cost, not a claim that every attribution study requires an unrestricted full factorial.

```figure
id: fig-1.11
kind: matrix
title: Four arms of the objective × algorithm decomposition
caption: >-
  Each cell is one training arm with the other five levels and the data held
  fixed. A comparison of two released systems runs only the lit diagonal,
  (O, A) against (O′, A′), which measures Δ_O + Δ_A + Δ_O×A and cannot
  separate them; the two off-diagonal arms are what identify each term. With
  k co-varied levels the grid has 2^k cells, each run s times.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-1.10"
alt: >-
  Two by two grid. Rows are the objective level, O and O′; columns are the
  algorithm level, A and A′. All four cells are filled because Eq. 1.10 needs
  all four arms. The diagonal cells (O, A) and (O′, A′) are highlighted: they
  are the only two arms a comparison of two released systems runs, and they
  identify only the sum Δ_O + Δ_A + Δ_O×A. The off-diagonal arms (O′, A) and
  (O, A′) give Δ_O and Δ_A, and the interaction follows from all four.
spec:
  rows: 2
  cols: 2
  pattern: explicit
  cells: [[1, 1], [1, 1]]
  rowLabel: "objective level"
  colLabel: "algorithm level"
  rowTicks: ["O", "O′"]
  colTicks: ["A", "A′"]
  highlight:
    - { row: 0, col: 0 }
    - { row: 1, col: 1 }
  legend: "all four arms identify Δ_O, Δ_A and Δ_O×A; the lit diagonal alone gives only their sum"
```

```figure
id: fig-1.12
kind: calculator
title: Attribution identity and its run cost, Eq. 1.10
caption: >-
  Defaults are illustrative arm outcomes, not measurements of any system. At
  them a 10-point joint gain splits into 4 points of Δ_O, 2 of Δ_A and 4 of
  interaction, so the additive reading of the single-level arms predicts 6
  and misses 40% of the joint effect; the 'additive' preset makes the
  interaction vanish. The run rows are the claim's s·2^k, 12 at k = 2 and
  384 at k = 7, against s·(k + 1) = 24 at k = 7 for the one-level-per-arm
  design of the Experimental design, which estimates baseline-conditional single-factor contrasts and does not identify all interactions.
placement: rail
anchor: mechanism
evidence: DERIVED
source: "DERIVED:eq-1.10"
alt: >-
  Calculator for Eq. 1.10 with four arm outcomes as accepted-task rates,
  Y(O, A) = 60%, Y(O′, A) = 64%, Y(O, A′) = 62% and Y(O′, A′) = 70%
  (illustrative, not measurements), co-varied levels k = 2 and seeds per arm
  s = 3. Outputs: Δ_O = 4 points, Δ_A = 2 points, interaction Δ_O×A = 4
  points, joint difference 10 points, runs for the complete binary factorial s·2^k = 12,
  and runs for one level per arm s·(k + 1) = 9. Preset 'additive' sets
  Y(O′, A′) = 66% and the interaction is 0. Preset 'all seven levels' sets
  k = 7: 384 runs against 24.
spec:
  tex: >-
    Y(O',A') - Y(O,A) = \Delta_O + \Delta_A + \Delta_{O\times A},\qquad \text{runs} = s\,2^{k}
  equation: "1.10"
  inputs:
    - { symbol: Y00, label: "Y(O, A), control arm", default: 0.6, min: 0, max: 1, step: 0.01, format: percent }
    - { symbol: Y10, label: "Y(O′, A), objective changed", default: 0.64, min: 0, max: 1, step: 0.01, format: percent }
    - { symbol: Y01, label: "Y(O, A′), algorithm changed", default: 0.62, min: 0, max: 1, step: 0.01, format: percent }
    - { symbol: Y11, label: "Y(O′, A′), both changed", default: 0.7, min: 0, max: 1, step: 0.01, format: percent }
    - { symbol: k, label: "co-varied levels k", default: 2, min: 1, max: 7, step: 1, format: integer }
    - { symbol: s, label: "seeds per arm s", default: 3, min: 1, max: 10, step: 1, format: integer }
  outputs:
    - { symbol: dO, label: "Δ_O = Y(O′, A) − Y(O, A)", formula: "Y10 - Y00", format: percent }
    - { symbol: dA, label: "Δ_A = Y(O, A′) − Y(O, A)", formula: "Y01 - Y00", format: percent }
    - { symbol: dOA, label: "interaction Δ_O×A", formula: "Y11 - Y10 - Y01 + Y00", format: percent, emphasis: true }
    - { symbol: J, label: "joint difference, all two arms can see", formula: "Y11 - Y00", format: percent }
    - { symbol: Rf, label: "runs for the complete binary factorial, s·2^k", formula: "s*2^k", format: integer }
    - { symbol: Ro, label: "runs, one level per arm, s·(k + 1)", formula: "s*(k + 1)", format: integer }
  presets:
    - { label: "additive: Δ_O×A = 0", values: { Y11: 0.66 } }
    - { label: "all seven levels", values: { k: 7 } }
```

Worked attribution maps distinguish comparison types rather than assigning causality by counting changed configuration fields.

| Reported comparison | Controlled or changed object | Supported scope |
|---|---|---|
| P19 attention microbenchmarks | fixed tensor shape and accelerator; implementation and IO schedule changed | execution comparison for the tested operator; numerical equivalence is checked separately |
| P21 1.3B InstructGPT versus 175B GPT-3 | size, post-training data, objectives, and optimization route change together | preference comparison between those systems on the study's prompt population; no isolated size or algorithm effect |
| P26 R1-Zero versus its starting base | additional RL prompts, rule rewards, optimizer updates, and output distribution | effect of the reported post-training package; the base comparison is already part of P26 and P28 further investigates base behavior |

```figure
id: fig-1.13
kind: compare
title: Attribution scope of three published comparisons
caption: >-
  The source-defined comparison determines the conclusion. Matched operator
  inputs identify a different quantity from a multi-stage training comparison.
placement: wide
evidence: PAPER-REPORTED
source: [P19, P21, P26, P28]
alt: >-
  FlashAttention compares operator execution on matched shapes and hardware;
  InstructGPT compares jointly changed systems; R1-Zero compares a training
  package with its starting policy. Component attribution remains separate.
spec:
  axis: "Comparison and attribution boundary"
  columns:
    - { id: kernel, label: "P19 · attention operator" }
    - { id: instruct, label: "P21 · instruction-following system" }
    - { id: rl, label: "P26 · R1-Zero training package" }
  rows:
    - { dimension: "matched object", values: { kernel: "tensor shapes and accelerator in microbenchmark", instruct: "evaluation prompt population", rl: "starting base checkpoint" } }
    - { dimension: "changed object", values: { kernel: "implementation and IO schedule", instruct: "size, data, objectives, training route", rl: "RL data, rewards, updates, resulting policy" } }
    - { dimension: "conclusion", values: { kernel: "operator execution in tested setting", instruct: "joint-system preference comparison", rl: "post-training-package outcomes; component causes unresolved" } }
    - { dimension: "additional boundary", values: { kernel: "end-to-end gains depend on model workload", instruct: "not an isolated size effect", rl: "P26 already measures base; P28 adds base and normalization analysis" } }
```

Cost line: a factorial design with s repetitions of each of 2^k configurations costs s–2^k runs; a smaller design estimates fewer contrasts or requires structural assumptions. Reanalysis uses the underlying runs' resource records. Missing configuration evidence is a gap, not a measured change.

## Algorithm

```text
Algorithm 1.2 — Level attribution for a reported gain
INPUT   report ρ with difference ΔY between systems ψ_a, ψ_b; disclosed configs
OUTPUT  map α: level → {fixed, varied, NOT-DISCLOSED}; supported claim
INVARIANT  a level is marked fixed only with cited evidence (config, version, checksum)
 1. for ℓ in (O, Rp, A, I, Rt, If, Pb): compare ψ_a.ℓ with ψ_b.ℓ from disclosed configs
 2.     α[ℓ] := fixed if identical by cited evidence; varied if disclosed and different; else NOT-DISCLOSED
 3. data_fixed := training data identical by cited evidence
 4. V := {ℓ : α[ℓ] ≠ fixed}; if not data_fixed: V := V ∪ {data}
 5. check assignment, comparable data exposure, measurement protocol, randomness, and uncertainty
 6. claim := design-supported contrast; single-level attribution requires identification, not only |V| = 1
 7. return α, claim
TERMINATION  seven iterations
```

Complexity: O(m) in disclosed configuration fields after the seven-level schema is fixed; causal validity additionally depends on the experiment design. Implementation link: the model record of [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md).

## Implementation

The implementation-level check is a pinned configuration: repository, commit, container, driver and runtime version, model revision, tokenizer, kernel flags (Reproducibility dimension, `AI_REFERENCE_STACK.md` §4.2). Two systems differing only in *Inference engine* (vLLM versus SGLang) are a runtime-level comparison; two differing only in the *Kernels / numerics / collectives* layer are implementation-level. Without pinned versions the comparison is UNVERIFIED.

## Experimental design

### Reported experiments

PAPER-REPORTED · [P19, §4.3, Appendix E.5–E.6](https://arxiv.org/html/2205.14135v2): attention microbenchmarks compare implementations on fixed Q/K/V shapes and several GPUs; the A100 sweep uses batch 8, 12 heads, and head dimension 64, with sequence length varied. Forward and backward timing, masking, and dropout are distinguished. The end-to-end BERT/GPT-2 experiments answer a different question because the fraction of total time spent in attention changes with the model. This chapter retains the protocol distinction without importing a speed ratio as a hardware-independent constant.

PAPER-REPORTED · [P28, §3.2 and Fig. 6](https://arxiv.org/html/2503.20783v1): the GRPO/Dr. GRPO comparison starts from Qwen2.5-1.5B, uses the R1 template, MATH training questions, and a binary answer-verification reward. It tracks training reward and response length and evaluates on five mathematical benchmark sets. The alternative removes both response-length normalization and group reward-standard-deviation normalization. The reported comparison tests that combined modification; it is not a separate ablation of each term. Hardware, repeated-seed uncertainty, and exact implementation commits are not established by the inspected section.

## Observations

**What the paper claims.** PAPER-REPORTED · P28, §§2.3, 3.2: self-reflection expressions occur in the tested base-model outputs; the revised normalization reduces continued growth of incorrect response lengths relative to the GRPO arm. PAPER-REPORTED · P26, §2.2: R1-Zero is trained without preliminary SFT and displays readability and language-consistency problems.

**What the evidence shows.** PAPER-REPORTED: P28's base outputs are evidence that the observed expressions are not exclusive to RL-trained checkpoints. They do not isolate which pretraining data caused them. Its optimizer comparison supports an effect of the jointly changed normalization in its setup. This chapter provides no independent reproduction.

**What we infer.** DERIVED: a claim that a behavior first appeared during post-training requires a measurement of the starting policy under a compatible protocol. Without that arm the timing of acquisition is unresolved, even when the final-policy score is well measured.

**What remains unknown.** Training data and intermediate checkpoints of most released models are NOT-DISCLOSED, so the fraction of reported gains attributable to each level is UNVERIFIED in general.

## Failure modes

> **Failure mode — cross-level attribution.** *Symptom:* a kernel or engine speedup reported as a modeling advance, or a data change as an algorithm advance. *Cause:* two levels varied; one named. *Detection:* Algorithm 1.2 returns |V| > 1. *Mitigation:* report the joint effect or run single-level arms.

> **Failure mode — template drift.** *Symptom:* a benchmark score changes with unchanged weights. *Cause:* template, tokenizer normalization, or harness version changed. *Detection:* checksum serialized prompts ([§10.4](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-4-conversation-serialization.md)). *Mitigation:* pin harness and template.

> **Failure mode — behavior named as mechanism.** *Symptom:* "reasoning" listed as a method. *Cause:* a product-level behavior placed at the algorithm level. *Detection:* the term names no objective, algorithm, or feedback source. *Mitigation:* the RLVR/GRPO/reasoning distinction of [§35.1](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-1-rlvr-formulation.md).

## Siblings

**Software stack layers** — `AI_REFERENCE_STACK.md` §4.1
Why it exists: to place a software project. What assumption changed: strata are packages, not variables of a claim. What objective changed: none; a catalog. What problem it solved: naming a system's role. What new failure mode: a layer mistaken for an explanatory level. Changed primitive: variable → package.

**Inspection dimensions** — `AI_REFERENCE_STACK.md` §4.2
Why it exists: an audit checklist for a training stack. What assumption changed: dimensions cut across levels. What objective changed: completeness of an audit. What problem it solved: missed configuration details. What new failure mode: none at this level. Changed primitive: level → checklist item.

**Behavioral versus mechanistic evidence** — [§64.1](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/64-1-behavioral-versus-mechanistic-evidence.md)
Why it exists: to distinguish what a model does from how. What assumption changed: internal access. What objective changed: attribution inside the representation rather than across levels. What problem it solved: behavior without mechanism. What new failure mode: over-reach from partial circuits. Changed primitive: level → component.

## Extensions

### Improvements

PAPER-REPORTED · P19, §§2–3: the predecessor computes and stores full attention intermediates; tiling and recomputation change IO while retaining exact attention. The resource benefit is therefore attributable to a changed execution method under the benchmark's conditions, with additional recomputation in backward. PAPER-REPORTED · P28, §3.2: Dr. GRPO changes normalization to target biases the authors derive; the observed length dynamics support that correction on the reported tasks. DERIVED: these are improvements at different levels and cannot be ranked on one axis. Long-context, multimodal, and agent comparisons additionally require matched context construction, encoder inputs, tool implementations, and environment state; their canonical protocols are linked in [§63.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-3-stage-attribution.md).

## Limitations

Valid regime: systems disclosed enough to mark levels. Falsification: if the estimated interaction is within a prespecified equivalence margin with adequate precision, an additive approximation is supported in that setting; otherwise joint attribution stands. Decision consequence: a gain with |V| > 1 is no reason to adopt the named method alone.

## Reproducibility

Artifacts: attribution maps per cited comparison. Configurations: pinned per §4.2 or UNVERIFIED. Unresolved: no public dataset of level-attributed comparisons (UNVERIFIED).

## References

P14, P19, P21, P26, P28, P36; inspected revisions and locators in [references.md](references.md); `AI_REFERENCE_STACK.md` §4.1–4.2. The seven levels and factorial decomposition are book-defined analytical records.
