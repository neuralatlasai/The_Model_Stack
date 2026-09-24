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
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 1.2 Levels of analysis

## Scope

Objective: separate seven levels at which a claim about a foundation model can be made and assign each the evidence that can support it. Baseline: "model X is better", which attributes nothing. Success: any reported gain is attributed to one level with the other six held fixed or accounted for. Boundaries: controlled-comparison methodology is [§6.3](../ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md); mechanistic evidence is [§64.1](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch64-mechanistic-interpretability-and-causal-model-analysis/64-1-behavioral-versus-mechanistic-evidence.md). Algorithm and Implementation are short: this is a conceptual section.

## Why this exists

Results were reported as properties of a named model when the variable that changed was the tokenizer, chat template, serving engine, decoding temperature, or harness. A single run varies many levels at once, so attribution needs a design that holds levels fixed or a reanalysis that partials them out; holding levels fixed means re-running, which the budget forbids. This book therefore gives each level an owner chapter and an admissible evidence type so a claim can be checked for the level it actually supports.

## Intuition

The seven levels are the seven places where behavior can be changed by spending a resource: the objective re-spends training FLOPs; the representation re-spends parameters and memory; the algorithm re-spends optimizer steps; the implementation re-spends engineering time and may change numerics; the runtime re-spends memory traffic and latency; the infrastructure re-spends communication and money; product behavior (prompts, retrieval, filters) spends nothing on the model but changes what the user sees. A product-level gain could have been bought at any of the six levels beneath it.

Heuristically, the levels resemble the computational, algorithmic, and implementational levels of computational neuroscience, extended by the runtime and infrastructure layers a deployed model cannot avoid; the analogy orders levels and licenses no inference between them.

> **Historical note.** The three-level scheme is Marr's (1982) [R1.6]; the seven-level expansion is this book's editorial choice, not a neuroscience claim.

## Formulation

> **Definition — level of analysis.** One of seven strata at which a foundation-model system is described and varied: objective, representation, algorithm, implementation, runtime, infrastructure, product behavior. A claim is attributed to the level whose variable changed.

> **Definition — held-fixed rule.** A claim about level i is supported by a comparison only if the other six levels were held fixed, or their variation was measured and its effect subtracted with stated uncertainty.

Write a system as ψ = (O, Rp, A, I, Rt, If, Pb) with outcome Y(ψ). The effect attributed to O → O′ is

$$
\Delta_O = Y(O', \mathrm{Rp}, A, I, \mathrm{Rt}, \mathrm{If}, \mathrm{Pb}) - Y(O, \mathrm{Rp}, A, I, \mathrm{Rt}, \mathrm{If}, \mathrm{Pb})
$$
*(Eq. 1.3)* where O = objective, Rp = representation (architecture, parameterization, tokenizer), A = optimization algorithm and schedule, I = implementation (framework, kernels), Rt = runtime (engine, decoding, batching), If = infrastructure (accelerators, fabric, precision), Pb = product behavior, Y = outcome under the success criterion of [§1.1](01-1-problem-formulation.md).

> **Claim [DERIVED · DERIVED:eq-1.3].** If two levels change together, Eq. 1.3 measures their joint effect plus interaction; the report must name both or run single-level comparisons. A difference between two released models is a sum over all seven levels plus data and is evidence about none of them.

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

Data is not a level; it is an input every level consumes and the most common hidden co-variable. It appears in the ledger of [§1.5](01-5-resource-accounting.md) as tokens.

## Mechanism

Attribution proceeds by elimination: for a reported gain, walk the seven levels and ask what evidence shows each was held fixed. Three recurrent category errors: a low-rank adapter changes which parameters are trainable (representation and algorithm levels) and is not compression, since the base model is unchanged at inference and adds no latency once merged (PAPER-REPORTED · P14); an IO-aware exact attention kernel changes the implementation level only, leaving objective, representation, and outputs unchanged within tolerance while reducing HBM reads and writes by tiling (PAPER-REPORTED · P19), so a speedup credited to "the architecture" is a level error; paged cache allocation is a runtime-level change that reduces KV waste from fragmentation and duplication and raises throughput at fixed weights without changing outputs (PAPER-REPORTED · P36).

When two levels co-vary, the joint difference decomposes exactly. For objective and algorithm,

$$
Y(O',A') - Y(O,A) = \underbrace{Y(O',A) - Y(O,A)}_{\Delta_O} + \underbrace{Y(O,A') - Y(O,A)}_{\Delta_A} + \underbrace{Y(O',A') - Y(O',A) - Y(O,A') + Y(O,A)}_{\Delta_{O\times A}}
$$
*(Eq. 1.10)* where the other five levels and data are held fixed in all four arms, and Δ_{O×A} is the interaction.

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.10].** Eq. 1.10 is an identity, and its three terms are identified only by all four arms. With k co-varied levels and s seeds per arm, full attribution costs s·2^k runs; a report with two arms identifies only the sum. This is why attribution is affordable at pilot scale ([§21.5](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md)) and rarely at release scale, and why additivity (Δ_{O×A} = 0) is an assumption to be stated, not a default.

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
  design of the Experimental design, which identifies main effects but no
  interactions.
placement: rail
anchor: mechanism
evidence: DERIVED
source: "DERIVED:eq-1.10"
alt: >-
  Calculator for Eq. 1.10 with four arm outcomes as accepted-task rates,
  Y(O, A) = 60%, Y(O′, A) = 64%, Y(O, A′) = 62% and Y(O′, A′) = 70%
  (illustrative, not measurements), co-varied levels k = 2 and seeds per arm
  s = 3. Outputs: Δ_O = 4 points, Δ_A = 2 points, interaction Δ_O×A = 4
  points, joint difference 10 points, runs for full attribution s·2^k = 12,
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
    - { symbol: Rf, label: "runs for full attribution, s·2^k", formula: "s*2^k", format: integer }
    - { symbol: Ro, label: "runs, one level per arm, s·(k + 1)", formula: "s*(k + 1)", format: integer }
  presets:
    - { label: "additive: Δ_O×A = 0", values: { Y11: 0.66 } }
    - { label: "all seven levels", values: { k: 7 } }
```

Worked attribution maps from the cited disclosures (fixed / varied / ND = NOT-DISCLOSED):

| Report | O | Rp | A | I | Rt, If | Pb | Data | Verdict |
|---|---|---|---|---|---|---|---|---|
| P19: IO-aware kernel vs standard attention | fixed (exact attention) | fixed | fixed | varied | as set by the authors; not re-checked here (UNVERIFIED) | fixed | fixed | conditional: single-level, implementation, only if runtime and infrastructure were matched, which is UNVERIFIED here; as checked, Algorithm 1.2 puts three levels in V (I, Rt, If) and returns no single-level attribution. The reported 15% end-to-end gain on BERT-large at sequence length 512 and 3× on GPT-2 at sequence length 1K (PAPER-REPORTED · P19) are the authors' figures on their hardware, implementation-level only under that condition |
| P21: 1.3B InstructGPT vs 175B GPT-3 | varied | varied (N) | varied | ND | ND | same prompt distribution | varied | joint effect of four disclosed co-variables (O, Rp, A, data) and three undisclosed levels (I, Rt, If); a same-size arm removes Rp but leaves O, A and data co-varied, so it is still not a single-level comparison |
| P26: R1-Zero vs DeepSeek-V3-Base | varied (rule-based rewards) | fixed (same base) | varied (GRPO) | ND | ND | varied (format reward imposes a template) | varied (RL prompts) | joint effect; P28 supplies the missing base arm |

```figure
id: fig-1.13
kind: compare
title: Attribution maps of three cited comparisons
caption: >-
  Count the cells in each column that are not 'fixed'. P19 has two:
  implementation, and the runtime and infrastructure cell, which this
  chapter has not re-checked; P21 and P26 each have four disclosed
  co-variables and three undisclosed levels. Algorithm 1.2 marks a level
  fixed only on cited evidence, so as checked here none licenses a
  single-level claim: P19 would, for implementation, once its runtime and
  hardware are shown matched; the other two are joint effects, and P28 is
  the arm the third is missing.
placement: wide
evidence: PAPER-REPORTED
source: [P19, P21, P26, P28]
concepts: [ms.section.1.2]
alt: >-
  Comparison of three reports on the seven levels plus data, each marked
  fixed, varied or NOT-DISCLOSED from the cited disclosures. P19, IO-aware
  kernel against standard attention: objective fixed (exact attention),
  representation and algorithm fixed, implementation varied, runtime and
  infrastructure as set by the authors and UNVERIFIED here, product behavior
  and data fixed; verdict single-level (implementation) only if runtime and
  infrastructure were matched, so none as checked. P21, 1.3B InstructGPT
  against 175B GPT-3: objective, representation (N) and algorithm varied;
  implementation, runtime and infrastructure not disclosed; same prompt
  distribution; data varied; verdict joint effect of four disclosed
  co-variables and three undisclosed levels, and a same-size arm still
  leaves objective, algorithm and data co-varied. P26, R1-Zero against
  DeepSeek-V3-Base: objective varied
  (rule-based rewards), representation fixed (same base), algorithm varied
  (GRPO), implementation, runtime and infrastructure not disclosed, product
  behavior varied (format reward imposes a template), data varied (RL
  prompts); verdict joint effect, with P28 supplying the missing base arm.
spec:
  axis: >-
    Which levels and the data were fixed, varied or not disclosed in each
    cited comparison, and the claim Algorithm 1.2 lets it support
  columns:
    - { id: p19, label: "P19: IO-aware vs standard attention" }
    - { id: p21, label: "P21: 1.3B InstructGPT vs 175B GPT-3" }
    - { id: p26, label: "P26: R1-Zero vs DeepSeek-V3-Base" }
  rows:
    - { dimension: "O, objective", values: { p19: "fixed (exact attention)", p21: "varied", p26: "varied (rule-based rewards)" } }
    - { dimension: "Rp, representation", values: { p19: "fixed", p21: "varied (N)", p26: "fixed (same base)" } }
    - { dimension: "A, algorithm", values: { p19: "fixed", p21: "varied", p26: "varied (GRPO)" } }
    - { dimension: "I, implementation", values: { p19: "varied", p21: "NOT-DISCLOSED", p26: "NOT-DISCLOSED" } }
    - { dimension: "Rt, If, runtime and infrastructure", values: { p19: "as set by the authors; UNVERIFIED here", p21: "NOT-DISCLOSED", p26: "NOT-DISCLOSED" } }
    - { dimension: "Pb, product behavior", values: { p19: "fixed", p21: "same prompt distribution", p26: "varied (format reward imposes a template)" } }
    - { dimension: "data", values: { p19: "fixed", p21: "varied", p26: "varied (RL prompts)" } }
    - { dimension: "disclosed co-variables", values: { p19: "I", p21: "O, Rp, A, data", p26: "O, A, Pb, data" } }
    - { dimension: "verdict", values: { p19: "conditional: single-level, implementation, only if Rt and If were matched (UNVERIFIED here); as checked, no single-level claim", p21: "joint effect of four disclosed co-variables and three undisclosed levels (I, Rt, If); a same-size arm still leaves O, A, data co-varied", p26: "joint effect; P28 supplies the missing base arm" } }
```

Cost line: evaluation FLOPs per arm actually run (s·2^k arms for full attribution), plus reanalysis time; memory, communication, and energy are those of the underlying runs; where a level cannot be held fixed, the entry is UNVERIFIED, not inferred.

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
 5. if |V| = 1 and data ∉ V: claim := "ΔY attributable to that level"
 6. else: claim := "ΔY is a joint effect of V; no single-level attribution"
 7. return α, claim
TERMINATION  seven iterations
```

Complexity: constant; dominated by locating configurations. Implementation link: the model record of [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md).

## Implementation

The implementation-level check is a pinned configuration: repository, commit, container, driver and runtime version, model revision, tokenizer, kernel flags (Reproducibility dimension, `AI_REFERENCE_STACK.md` §4.2). Two systems differing only in *Inference engine* (vLLM versus SGLang) are a runtime-level comparison; two differing only in the *Kernels / numerics / collectives* layer are implementation-level. Without pinned versions the comparison is UNVERIFIED.

## Experimental design

Proposal: a seven-arm ablation on a small reference model, one level changed per arm against a control, with data, seeds, and steps fixed; bootstrap intervals over independent units; runtime and infrastructure arms report latency and throughput with the boundary stated. Budget small enough for three seeds. Design for [§6.3](../ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md); not run.

## Observations

**What the paper claims.** A reanalysis of R1-Zero-style training reports that DeepSeek-V3-Base already exhibits an "Aha moment" and Qwen2.5 base models show strong reasoning outputs without prompt templates, and identifies "an optimization bias in Group Relative Policy Optimization (GRPO), which artificially increases response length (especially for incorrect outputs) during training" (PAPER-REPORTED · P28, abstract, accessed 2026-09-20). DeepSeek-R1 reports that R1-Zero was trained by GRPO directly on DeepSeek-V3-Base with rule-based accuracy and format rewards and no SFT, and exhibited poor readability and language mixing (PAPER-REPORTED · P26, Sections 2.2–2.3).

**What the evidence shows.** P28's finding is a level attribution: part of a product-level behavior credited to the algorithm was present at the representation-plus-data level (the base checkpoint). P28 is a preprint not reproduced here.

**What we infer.** DERIVED: every post-training claim must run Algorithm 1.2 with the base checkpoint's behavior as the control arm. ASSUMED: where the base is unavailable, α is NOT-DISCLOSED at the representation level and no algorithm-level attribution is possible.

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

Domain adaptation adds a data axis held fixed across adaptation methods ([§23.6](../../part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/23-6-evaluation.md)); long context couples representation and runtime through cache state; multimodality multiplies the representation level by encoders; agents add environment and tool implementations as product-level co-variables ([§63.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-3-stage-attribution.md)); embodiment adds the physical plant. Proposals for extending ψ.

## Limitations

Valid regime: systems disclosed enough to mark levels. Falsification: if single-level arms reproduce a joint gain additively, the interaction is negligible for that system; otherwise joint attribution stands. Decision consequence: a gain with |V| > 1 is no reason to adopt the named method alone.

## Reproducibility

Artifacts: attribution maps per cited comparison. Configurations: pinned per §4.2 or UNVERIFIED. Unresolved: no public dataset of level-attributed comparisons (UNVERIFIED).

## References

P14, P19, P26, P28, P36; R1.6; `AI_REFERENCE_STACK.md` §4.1–4.2.
