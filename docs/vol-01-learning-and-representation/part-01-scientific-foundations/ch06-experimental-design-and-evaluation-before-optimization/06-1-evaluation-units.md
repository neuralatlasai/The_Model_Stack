---
id: ms.section.6.1
entity_type: section
title: Evaluation units
short_title: Evaluation units
volume: 1
part: 1
chapter: 6
section: 6.1
slug: 06-1-evaluation-units
parent: ms.chapter.6
prev_sibling: null
next_sibling: ms.section.6.2
children: []
prerequisites: [ms.section.1.1, ms.section.1.2, ms.section.2.5, ms.section.3.6, ms.section.4.6, ms.section.5.5]
downstream: [ms.section.6.3, ms.section.6.5, ms.section.6.6, ms.section.43.6, ms.section.48.6, ms.section.61.3, ms.section.62.6, ms.section.63.3]
related: [ms.section.10.4, ms.appendix.g]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P50}
  - {type: supported_by, target: paper.P51}
  - {type: implemented_by, target: impl.hugging-face-transformers}
  - {type: implemented_by, target: impl.vllm}
  - {type: evaluated_by, target: experiment.6.1}
axes: {lifecycle: [evaluation, serving], mechanism: [evaluation_unit, attribution], feedback_setting: [human_preference], modality: [text]}
papers: [P50, P51]
implementations: [impl.hugging-face-transformers, impl.vllm, impl.sglang, impl.tensorrt-llm, impl.llama-cpp]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, KNOWN, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 6.1 Evaluation units

## Scope

Objective: define the object to which a score belongs — the evaluation unit — as a tuple of nine components (model, checkpoint, tokenizer, prompt, scaffold, endpoint, engine, hardware system, complete product), and state the rule that decides when a difference between two scores may be attributed to one component. Baseline: the practice of attaching a score to a model name. Success: given any reported number the reader can list which components were specified, which were not, and which comparisons the number can enter. Boundaries: the statistics of the difference are in [§6.4](06-4-measurement-uncertainty.md); benchmark validity in [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md); pairwise preference aggregation in [§62.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-2-pairwise-aggregation.md); stage-level attribution in agents in [§63.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-3-stage-attribution.md).

## Why this exists

What failed before was the noun. "Model X scores 71 on benchmark Y" has a grammatical subject that does not exist as an experimental object: nobody evaluates a model, only a particular set of weights, serialised in a numeric format, fed token ids by a tokenizer under a prompt template, run by an engine on hardware, with a program around it that samples, extracts an answer, and sometimes retries. The bottleneck that appeared was that these unnamed components move the score by amounts that exceed the differences being claimed. The LM Evaluation Harness authors report one model moving from 38.0% to 26.6% on ARC Challenge, and from 72.4 ± 1.80% to 26.5 ± 1.78% on ARC-Easy, when only the prompt style changes between a cloze form and an MMLU-style form (PAPER-REPORTED · R6.4; workload: GPT-NeoX-20B, their Table 1, harness defaults otherwise). Sclar et al. report "performance differences of up to 76 accuracy points" from formatting changes that preserve meaning, and weak correlation of format rankings between models (PAPER-REPORTED · R6.22; workload: LLaMA-2-13B, few-shot classification tasks). The constraint that became dominant is attribution under the [held-fixed rule](../ch01-foundation-model-lifecycle/01-2-levels-of-analysis.md): a claim about one level requires the other levels held fixed or accounted for. What changed is that the unit is written down as a typed tuple before measurement, so the comparison that a number can enter is decidable from its record.

```figure
id: fig-6.4
kind: stat-panel
title: Reported prompt-format and engine sensitivity
caption: >-
  The sources for this section's claim that unnamed components move a score
  by more than the differences being claimed. Every format row holds the
  weights fixed. The ARC-Easy row loses 45.9 points to a change of prompt
  style alone. The engine rows are documented mechanisms without
  magnitudes. No inspected source gives an engine effect size, and the last
  row keeps that gap visible rather than filling it.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: [R6.4, R6.22, R6.33, R6.35, R6.13]
context:
  hardware: "NOT-DISCLOSED in the pages read for R6.4 and R6.22"
  model: "GPT-NeoX-20B (R6.4 Table 1); LLaMA-2-13B (R6.22)"
  precision: "NOT-DISCLOSED in the pages read"
  sequenceLength: "task-defined prompts; NOT-DISCLOSED"
  ioDistribution: "ARC Challenge and ARC-Easy, cloze vs MMLU-style prompt (R6.4); few-shot classification tasks (R6.22)"
  concurrency: "not applicable: offline accuracy evaluation"
  runtimeVersion: "LM Evaluation Harness defaults as of R6.4 v2; exact commit NOT-DISCLOSED"
  measurementBoundary: "benchmark accuracy with only the prompt format changed; engine rows are documentation, not measurements"
alt: >-
  Instrument panel of reported sensitivities. From R6.4 Table 1, for
  GPT-NeoX-20B, ARC Challenge accuracy falls from 38.0 % to 26.6 % and
  ARC-Easy from 72.4 ± 1.80 % to 26.5 ± 1.78 % when the prompt changes from
  cloze to MMLU style. The derived ARC-Easy loss is 45.9 points.
  R6.22 reports differences of up to 76 accuracy points from
  meaning-preserving formatting changes on LLaMA-2-13B, and weakly
  correlated format rankings across models. vLLM gives no reproducibility
  guarantee by default, and its deterministic settings hold only on the same
  hardware and vLLM version (R6.33). SGLang attributes nondeterminism to
  batch size changing the reduction order (R6.35). The Open LLM Leaderboard
  notes results vary with batch size (R6.13). The magnitude of engine
  effects on scores is UNVERIFIED.
spec:
  header: "SAME WEIGHTS · DIFFERENT UNIT"
  rows:
    - { key: "ARC Challenge, cloze → MMLU-style", value: "38.0 % → 26.6 %", note: "R6.4 Table 1; GPT-NeoX-20B, harness defaults" }
    - { key: "ARC-Easy, cloze → MMLU-style", value: "72.4 ± 1.80 → 26.5 ± 1.78 %", note: "R6.4 Table 1; same checkpoint" }
    - { key: "ARC-Easy points lost to prompt style", formula: "72.4 - 26.5", format: fixed1, note: "DERIVED from the row above" }
    - { key: "meaning-preserving format changes", value: "up to 76 accuracy points", note: "R6.22; LLaMA-2-13B, few-shot classification" }
    - { key: "format rankings across models", value: "weakly correlated", note: "R6.22" }
    - { key: "vLLM default", value: "no reproducibility guarantee", note: "R6.33, 'for the sake of performance'" }
    - { key: "vLLM deterministic settings hold on", value: "same hardware + same vLLM version", note: "R6.33" }
    - { key: "SGLang mechanism", value: "batch size changes reduction order", note: "R6.35; floating-point non-associativity" }
    - { key: "Open LLM Leaderboard", value: "results vary with batch size", note: "R6.13, attributed to padding" }
    - { key: "engine effect on scores, magnitude", value: "UNVERIFIED", note: "no inspected source reports one; Experiment 6.1 would" }
states:
  - { anchor: why-this-exists, label: "prompt format", highlight: ["ARC Challenge, cloze → MMLU-style", "ARC-Easy, cloze → MMLU-style", "ARC-Easy points lost to prompt style", "meaning-preserving format changes"], note: "Weights untouched, prompt style changed: ARC-Easy loses 45.9 points (R6.4), and meaning-preserving formats move scores by up to 76 points (R6.22)." }
  - { anchor: mechanism, label: "engine and batch", highlight: ["vLLM default", "vLLM deterministic settings hold on", "SGLang mechanism", "Open LLM Leaderboard"], note: "u_eng and u_hw enter through reduction order: batch composition changes addition order, and a changed low-order bit can flip a greedy argmax at a near-tie." }
  - { anchor: observations, label: "what is not known", highlight: ["engine effect on scores, magnitude", "format rankings across models"], note: "Prompt and scaffold effects have several independent reports. Engine effects have a documented mechanism but no reported magnitude, so they stay UNVERIFIED." }
```

## Intuition

Physically, a score is the output of a pipeline with nine stages, each of which transforms bytes: weights are loaded in some format, text is mapped to ids, ids are wrapped in control tokens, the engine chooses kernels and a batch composition that fix the order of floating-point reductions, the hardware executes them, the scaffold decides how many samples to draw and which substring counts as the answer, and an endpoint or product may add routing, caching, system prompts, and filters that the evaluator cannot see. A change at any stage changes the bytes that reach the scorer. Heuristically, one may say a benchmark "measures what the model knows"; that is a cognitive analogy and carries no evidential weight here. The resource fact is narrower: the benchmark measures the input–output behaviour of the whole pipeline on a finite sample.

```figure
id: fig-6.5
kind: diagram
title: The nine components between an item and its score
caption: >-
  Each component transforms the bytes that reach the scorer. The heavy path
  is the one every evaluated item takes, and every stage on it is a
  component that can change s_{i,r}(u) with the weights untouched. The
  provider-side group is drawn apart because it is not a stage the evaluator
  can pin. An endpoint wraps the engine, the hardware and part of the
  scaffold, and a product adds retrieval, memory and filters on top.
  u_model sits off the path as a dependency: one model yields many
  checkpoints.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-6.1", R6.36, R6.33, R6.35, R6.7]
concepts: [ms.section.6.1]
alt: >-
  Left-to-right diagram. An item i from the task distribution is rendered by
  u_prompt (template, few-shot examples, system prompt) and mapped to token
  ids by u_tok (tokenizer hash and special tokens). The ids and the weights
  of u_ckpt (one set of weights: hash, dtype, quantisation) enter u_eng
  (engine commit, kernels, batching, determinism mode), which executes on
  u_hw (accelerator, driver, runtime), where reduction order is fixed. The
  engine's continuations enter u_scaf (n_r samples, answer extraction,
  retries, tools, judge), which emits the scored outcome s_{i,r}(u) in
  [0, 1]. Averaging gives q̂(u) by Eq. 6.1. The emphasised path is prompt,
  tokenizer, engine, scaffold, score, q̂. u_model is a dependency of
  u_ckpt: one model, many checkpoints. A provider-side group holds u_endp
  (routing, caching, hidden preprocessing), which hides the engine and the
  hardware, and u_prod (retrieval, memory, filters), which sits on top of
  the endpoint. Both are NOT-DISCLOSED to the evaluator.
spec:
  direction: LR
  nodes:
    - { id: item, kind: dataset, label: "item i", sub: "task distribution (§1.1)" }
    - { id: model, kind: model, label: "u_model", sub: "architecture + training lineage" }
    - { id: ckpt, kind: model, label: "u_ckpt: one set of weights", sub: "hash, dtype, quantisation", group: pin }
    - { id: prompt, kind: process, label: "u_prompt: template, few-shot, system", sub: "rendered string", group: pin }
    - { id: tok, kind: process, label: "u_tok: text → ids", sub: "tokenizer hash, special tokens", group: pin }
    - { id: eng, kind: process, label: "u_eng: kernels, batching, cache", sub: "commit, flags, determinism mode", group: pin }
    - { id: hw, kind: hardware, label: "u_hw: accelerator, driver, runtime", sub: "fixes reduction order", group: pin }
    - { id: scaf, kind: process, label: "u_scaf: samples, extraction, retries", sub: "n_r per item; judge; tools", group: pin }
    - { id: score, kind: metric, label: "s_{i,r}(u) ∈ [0, 1]" }
    - { id: qhat, kind: metric, label: "q̂(u)", sub: "Eq. 6.1: mean over n items, n_r samples", emphasis: true }
    - { id: endp, kind: boundary, label: "u_endp: routing, caching, preprocessing", sub: "provider, endpoint id, window", group: prov }
    - { id: prod, kind: boundary, label: "u_prod: retrieval, memory, filters", sub: "product version, access path", group: prov }
  edges:
    - { from: item, to: prompt }
    - { from: prompt, to: tok, kind: emphasis }
    - { from: tok, to: eng, kind: emphasis, label: "ids" }
    - { from: model, to: ckpt, kind: dependency, label: "one model, many checkpoints" }
    - { from: ckpt, to: eng, label: "weights" }
    - { from: eng, to: hw, kind: dependency, label: "executes on" }
    - { from: eng, to: scaf, kind: emphasis, label: "continuations, log-probs" }
    - { from: scaf, to: score, kind: emphasis }
    - { from: score, to: qhat, kind: emphasis }
    - { from: endp, to: eng, kind: dependency, label: "hides" }
    - { from: endp, to: hw, kind: dependency, label: "hides" }
    - { from: prod, to: endp, kind: dependency, label: "adds on top" }
  groups:
    - { id: pin, label: "evaluator can record and pin" }
    - { id: prov, label: "provider side: NOT-DISCLOSED" }
```

## Formulation

> **Definition — evaluation unit.** The tuple u = (u_model, u_ckpt, u_tok, u_prompt, u_scaf, u_endp, u_eng, u_hw, u_prod) that fully determines the conditional distribution of scored outcomes on a fixed item; a score is a property of u, never of u_model alone.

| Component | What it fixes | Minimum record |
|---|---|---|
| u_model | Architecture family and training lineage as disclosed | Model-record fields of [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md); undisclosed fields NOT-DISCLOSED |
| u_ckpt | One set of weights: training step, post-training stage, merge, numeric format, quantisation | Artifact hash, revision id, dtype, quantisation scheme |
| u_tok | Text ↔ id map, special tokens, normalisation | Tokenizer file hash, vocabulary size |
| u_prompt | Instruction text, few-shot examples and their order, chat template, system prompt | Rendered prompt strings or the template plus its inputs |
| u_scaf | Sampling settings, samples per item, answer extraction, tools, retries, aggregation (majority vote, best-of-n), judge | Scaffold code revision and configuration |
| u_endp | A hosted interface with provider-side routing, caching, rate limits, hidden preprocessing | Provider, endpoint id, region, date-time window, API parameters |
| u_eng | Inference engine, version, enabled kernels, batching and cache policy | Engine commit, flags, determinism mode |
| u_hw | Accelerator type and count, interconnect, driver, runtime | Device, driver, runtime versions, parallel configuration |
| u_prod | Complete product: endpoint plus retrieval, memory, safety filters, UI-level system prompts | Product version and the evaluator's access path |

> **Definition — evaluation scaffold.** The program surrounding model calls during evaluation — sampling settings, number of samples, answer extraction, tool access, retry and aggregation logic, and any judge — that converts a prompt into a scored outcome.

> **Definition — comparability class.** A set of evaluation units that agree on every component except those declared as factors of the comparison; a score difference is attributable to the declared factors only within one comparability class.

For item i drawn from a task distribution (owned by [§1.1](../ch01-foundation-model-lifecycle/01-1-problem-formulation.md)) and unit u, let s_i(u) ∈ [0, 1] be the scored outcome of one run. The reported score is

$$
\hat{q}(u) = \frac{1}{n}\sum_{i=1}^{n} \frac{1}{n_r}\sum_{r=1}^{n_r} s_{i,r}(u)
$$
*(Eq. 6.1)* where n = items, n_r = samples per item drawn by the scaffold, s_{i,r}(u) = score of sample r on item i under unit u.

For two units u, u′ that differ in a set of components Δ(u, u′) ⊆ {model, ckpt, tok, prompt, scaf, endp, eng, hw, prod},

$$
\hat{q}(u) - \hat{q}(u') = \sum_{j \in \Delta(u,u')} \gamma_j \;+\; \sum_{\substack{J \subseteq \Delta,\ |J|\ge 2}} \gamma_J \;+\; \varepsilon
$$
*(Eq. 6.2)* where γ_j = main effect of changing component j alone, γ_J = interaction among the components in J, ε = sampling error (§6.4). With |Δ| = 1 the difference estimates one γ_j; with |Δ| ≥ 2 and a single pair of measurements the individual terms are not identifiable (MATHEMATICALLY-DERIVED: one equation, 2^{|Δ|} − 1 unknowns).

```figure
id: fig-6.6
kind: calculator
title: Unknowns in Eq. 6.2 against the units actually measured
caption: >-
  The counting argument of Eq. 6.2. Changing |Δ| two-level components opens
  2^|Δ| − 1 effects, |Δ| main effects plus every interaction. c measured
  units supply at most c − 1 contrasts, and only when they are cells of the
  2^|Δ| factorial with independent contrasts. The emphasised output is
  therefore a lower bound on what stays unidentified. The rail follows the
  section: one factor, then an endpoint comparison, then Experiment 6.1's
  full crossing, then a score with nothing recorded.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.2"
alt: >-
  Calculator for Eq. 6.2 with inputs |Δ|, the number of components that
  differ between units, and c, the number of units measured. It outputs the
  unknown effects 2^|Δ| − 1, the main effects |Δ|, the interaction terms,
  the c − 1 available contrasts, the unknowns left unidentified at best, and
  the 2^|Δ| cells of a full factorial. At |Δ| = 1 and c = 2 there is one
  unknown and one contrast. At |Δ| = 3 and c = 2, for example an endpoint
  against a self-hosted engine, there are 7 unknowns, 1 contrast and 6 left
  unidentified. At |Δ| = 3 and c = 8, Experiment 6.1's 2 × 2 × 2 design,
  there are 7 contrasts for 7 effects and none is left. At |Δ| = 9 and
  c = 2, a score attached to a model name only, there are 511 unknowns and
  510 are left.
spec:
  tex: >-
    \hat{q}(u) - \hat{q}(u') = \sum_{j \in \Delta}\gamma_j + \sum_{J \subseteq \Delta,\,|J|\ge 2}\gamma_J + \varepsilon,\qquad \#\text{unknowns} = 2^{|\Delta|}-1
  equation: "6.2"
  inputs:
    - { symbol: d, label: "components that differ, |Δ|", default: 1, min: 1, max: 9, step: 1, format: integer }
    - { symbol: c, label: "units measured, c", default: 2, min: 2, max: 512, options: [2, 4, 8, 16, 32, 64, 128, 256, 512], format: integer }
  outputs:
    - { symbol: U, label: "unknown effects, 2^|Δ| − 1", formula: "2^d - 1", format: integer }
    - { symbol: M, label: "main effects γ_j", formula: "d", format: integer }
    - { symbol: I, label: "interaction terms γ_J, |J| ≥ 2", formula: "2^d - 1 - d", format: integer }
    - { symbol: E, label: "contrasts available, c − 1", formula: "c - 1", format: integer }
    - { symbol: L, label: "unknowns left unidentified, at best", formula: "max(U - E, 0)", format: integer, emphasis: true }
    - { symbol: F, label: "cells in a full 2^|Δ| factorial", formula: "2^d", format: integer }
  presets:
    - { label: "endpoint vs self-hosted", values: { d: 3, c: 2 } }
    - { label: "Experiment 6.1, 2 × 2 × 2", values: { d: 3, c: 8 } }
    - { label: "nothing recorded", values: { d: 9, c: 2 } }
states:
  - { anchor: formulation, label: "|Δ| = 1", variables: { d: 1, c: 2 }, highlight: [d, U, L], note: "One differing component: the pair gives one equation for one unknown, and the difference estimates γ_j plus sampling error ε." }
  - { anchor: mechanism, label: "endpoint vs engine, |Δ| = 3", variables: { d: 3, c: 2 }, highlight: [d, U, I, L], note: "An endpoint against a self-hosted engine differs in u_endp, and in u_eng and u_hw, which are undisclosed and so count as differing. One pair gives 1 equation for 7 unknowns." }
  - { anchor: experimental-design, label: "Experiment 6.1, c = 8", variables: { d: 3, c: 8 }, highlight: [c, E, L, F], note: "Template × extraction × engine, fully crossed: eight cells give seven contrasts for γ_prompt, γ_scaf, γ_eng, three pairwise terms and one three-way term. None is left unidentified." }
  - { anchor: failure-modes, label: "score attached to a name", variables: { d: 9, c: 2 }, highlight: [U, L], note: "With no tuple recorded, all nine components count as differing (the Assumption). One pair of scores then faces 511 unknowns, and Algorithm 6.1 returns UNDERSPECIFIED." }
```

> **Assumption.** Components not recorded are treated as differing · *sensitivity:* if an unrecorded component was in fact equal, the comparison is admissible but cannot be shown to be; the claim stays UNVERIFIED rather than becoming false.

## Mechanism

**Why the score is a tuple property.** Each component enters Eq. 6.1 through s_{i,r}(u), and each has a documented path by which it moves the outcome with the weights untouched.

*Checkpoint versus model.* One u_model yields many u_ckpt: intermediate steps, base and post-trained stages, merges, and quantised copies. A quantised artifact is a different checkpoint, not the same checkpoint run more cheaply; its accuracy relation to the original is an empirical question owned by Chapter 40 (DERIVED from the definition of u_ckpt). DERIVED — cost line: k identical-cost checkpoint evaluations multiply inference work by k; actual work varies with architecture and generated length. Tokenised inputs may be reused with the same tokenizer, but checkpoint-dependent KV state is not generally reusable across changed weights.

*Tokenizer.* Per-token likelihood metrics are not comparable across tokenizers ([§4.6](../ch04-language-modeling-and-learning-objectives/04-6-likelihood-and-capability.md), perplexity comparability conditions). For generation tasks the tokenizer also fixes how few-shot separators and answer prefixes are segmented, which is one mechanism behind format sensitivity (DERIVED; the magnitude on any task is UNVERIFIED here).

*Prompt and chat template.* The Transformers documentation states that chat models fine-tuned from the same base can expect different control tokens and warns that incompatible control tokens or duplicate special tokens can degrade performance (OFFICIAL-DOCUMENTATION · R6.36, living documentation; release pin UNVERIFIED). The Open LLM Leaderboard's reproduction instructions accordingly require `--apply_chat_template` and `fewshot_as_multiturn` for instruction models (OFFICIAL-DOCUMENTATION · R6.13). Serialisation correctness is developed in [§10.4](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-4-conversation-serialization.md). Cost line: the prompt sets prefill tokens per item; five-shot prompting multiplies prefill FLOPs by roughly the ratio of prompt lengths, by the 2N-per-token rule of [§5.6](../ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md) (DERIVED).

*Scaffold.* Majority vote over n_r samples, best-of-n with a verifier, tool access, and retry-on-parse-failure are different estimands, not implementation details: pass@1 and majority-vote accuracy of the same checkpoint are two units (DERIVED from Eq. 6.1, which averages rather than votes). HELM fixes this component by construction: it treats a model as a black box that receives a prompt string and decoding parameters, and adapts all models by the same few-shot prompting so that "the strategy for adapting an LM to a scenario should be controlled for" (PAPER-REPORTED · P50 §1.1, §2.2). Cost line: a scaffold drawing n_r samples costs n_r decode passes per item; inference-budget accounting is owned by [§38.6](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/38-6-evaluation-and-economics.md).

*Engine and hardware.* vLLM's documentation states that it "does not guarantee the reproducibility of the results by default, for the sake of performance" and that even with its deterministic settings it "only provides reproducibility when it runs on the same hardware and the same vLLM version" (OFFICIAL-DOCUMENTATION · R6.33). SGLang's documentation gives the mechanism: "Different batch sizes cause GPU kernels to split reduction operations differently, leading to different addition orders", which by floating-point non-associativity gives different results (OFFICIAL-DOCUMENTATION · R6.35). This is the reduction-order nondeterminism of [§3.6](../ch03-numerical-computation-and-trustworthy-training/03-6-reproducibility-limits.md) appearing at the evaluation boundary: under greedy decoding a changed low-order bit can flip an argmax at a near-tie and the continuations diverge from that token on (DERIVED). The Open LLM Leaderboard notes the same effect operationally: "You can expect results to vary slightly for different batch sizes because of padding" (OFFICIAL-DOCUMENTATION · R6.13). Cost line: deterministic or batch-invariant modes trade throughput for repeatability; the overhead is NOT-DISCLOSED on the pages inspected.

*Endpoint.* A hosted endpoint adds components the evaluator cannot inspect. Artificial Analysis's methodology distinguishes models from endpoints — "A single model may have multiple endpoints across different providers" — measures "the end-to-end performance experienced by customers of AI inference services", normalises all throughput to one tokenizer ("All 'tokens per second' metrics refer to OpenAI tokens"), and reports medians over a rolling window from a test server in one cloud zone (OFFICIAL-DOCUMENTATION · R6.7, R6.8). Every one of those choices is a component of u_endp. [Appendix G](../../../appendices/appendix-g-curricula-reference-ecosystems-and-independent-measurement.md) states the consequence as a boundary on interpretation: "endpoint results are not intrinsic model constants" (KNOWN · book_plan.md Appendix G). The engine, numeric format, batch policy, and hardware behind a provider's endpoint are NOT-DISCLOSED, so an endpoint measurement cannot be decomposed by Eq. 6.2 at all; it supports claims about that endpoint in that window.

*Complete product.* A product adds retrieval, memory, system prompts, and filters. Its evaluation is legitimate and is what users experience; it is evidence about u_prod only.

**Preference rankings are a different estimand, not a noisier version of the same one.** Chatbot Arena collects pairwise human votes on user-written prompts — "over 240K votes" at the time of the paper (PAPER-REPORTED · P51) — while the current leaderboard display could not be revalidated (UNVERIFIED · R6.11). The unit voted on is an endpoint-level system under the platform's sampling of prompts and voters; the measured quantity is the probability that a voter from that population prefers one response. The plan's corrections table separates this from capability: "Human preference, task correctness, robustness, system performance, and economic efficiency are separate evaluation axes" (KNOWN · book_plan.md corrections table). A preference score therefore cannot enter Eq. 6.2 alongside a task-accuracy score: the two have different s_i, different item distributions, and different units. Two source boundaries matter for partitioning (§6.2): the earlier draft's platform attribution concerning pre-release testing since March 2024 remains UNVERIFIED because its exact source was not recovered (R6.12); Singh et al. report that private testing of multiple variants and unequal sampling rates advantage some providers (PAPER-REPORTED · R6.32; not independently verified, and disputed points are not adjudicated here). Aggregation models for pairwise data are owned by [§62.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-2-pairwise-aggregation.md).

**What each measurement source measures.** The four independent sources that the reference stack itself uses as ranking signals measure four different units.

| Source | Unit actually measured | Components fixed by the source | Components NOT-DISCLOSED to the reader | Label |
|---|---|---|---|---|
| Artificial Analysis | u_endp (provider endpoint in a time window) | Workload lengths, schedule, token convention, test location | Engine, format, batching, hardware behind the endpoint | OFFICIAL-DOCUMENTATION · R6.7, R6.8 |
| LMArena / Chatbot Arena | u_endp or u_prod under voter-chosen prompts | Pairwise protocol, anonymity in battle mode | Voter population per arena, prompt mixture per model, serving stack | PAPER-REPORTED · P51; current display UNVERIFIED · R6.11 |
| Epoch AI Benchmarking Hub | u_endp with a fixed scaffold for internally run benchmarks | Inspect-based task code, empty system prompt, API-default temperature, zero-shot chain-of-thought, repeated runs | Serving stack; protocols of externally sourced results vary | OFFICIAL-DOCUMENTATION · R6.10 |
| Hugging Face Open LLM Leaderboard | (u_ckpt, u_tok, u_prompt, u_scaf) on the operator's engine and hardware | Harness fork, task list, shots, normalisation | Operating status as of the access date is UNVERIFIED | OFFICIAL-DOCUMENTATION · R6.13 |

Epoch AI's data page marks several of its datasets as estimates (OFFICIAL-DOCUMENTATION · R6.9); the plan requires preserving "estimation methods, uncertainty, measured versus estimated fields, and benchmark scope" when citing it (KNOWN · book_plan.md Appendix G). None of these sources is ranked against the others here; they answer different questions.

## Algorithm

```text
Algorithm 6.1 — Evaluation-unit resolution and comparability check
INPUT   two result records r, r′ (each a partial map component → value-or-hash);
        declared factor set Φ ⊆ {model, ckpt, tok, prompt, scaf, endp, eng, hw, prod}
OUTPUT  verdict ∈ {ATTRIBUTABLE, CONFOUNDED, UNDERSPECIFIED}; the offending component list
STATE   diff, unknown
INVARIANT  a component missing from either record is never treated as equal
1  diff ← ∅; unknown ← ∅
2  for j in the nine components:
3      if j ∉ dom(r) or j ∉ dom(r′):            unknown ← unknown ∪ {j}
4      else if hash(r[j]) ≠ hash(r′[j]):         diff ← diff ∪ {j}
5  if endp ∈ dom(r) ∪ dom(r′):                   # hosted endpoint hides eng, hw, and part of scaf
6      unknown ← unknown ∪ ({eng, hw} \ fields disclosed by the provider)
7  if diff ⊄ Φ:                                   return CONFOUNDED, diff \ Φ
8  if unknown \ Φ ≠ ∅:                            return UNDERSPECIFIED, unknown \ Φ
9  return ATTRIBUTABLE, diff
```

Complexity: O(1) per pair (nine hash comparisons); over a table of R records, O(R²) pairs or O(R) after grouping by the hash of the non-factor components, which partitions the table into comparability classes. Termination: the loop is over a fixed list. State transition: records move from UNDERSPECIFIED to ATTRIBUTABLE only by adding recorded fields, never by assumption. Implementation: the record fields are those of `benchmark_manifest.yaml` in [verification.md](verification.md).

```figure
id: fig-6.7
kind: diagram
title: Algorithm 6.1 and its three verdicts
caption: >-
  Two sets leave the loop, and the invariant is visible in which set a
  missing field joins. diff holds hashes that disagree. unknown holds fields
  absent from either record, and it grows again at line 6 when an endpoint
  hides the engine and hardware. The heavy path to ATTRIBUTABLE needs both
  sets to sit inside Φ. A record reaches it only by adding recorded fields,
  never by assuming an unrecorded field equal. Grouping by the hash of the
  non-factor components turns the same test into comparability classes in
  O(R).
placement: inline
evidence: DERIVED
source: ["DERIVED:alg-6.1", "DERIVED:eq-6.2"]
concepts: [ms.section.6.1]
alt: >-
  Diagram of Algorithm 6.1. Two result records r and r′ enter a loop over
  the nine components (lines 2 to 4). A component missing from either record
  joins the set unknown. A component whose hashes differ joins the set diff.
  A branch asks whether an endpoint appears in either record (line 5). If
  so, line 6 adds engine and hardware, minus any fields the provider
  discloses, to unknown. The declared factor set Φ feeds two tests. First,
  is diff a subset of Φ? If not, the verdict is CONFOUNDED with diff minus Φ
  (line 7). If so, is unknown minus Φ empty? If not, the verdict is
  UNDERSPECIFIED (line 8). If so, the verdict is ATTRIBUTABLE with diff
  (line 9), on the emphasised path. A side node groups records by the hash
  of their non-factor components into comparability classes in O(R).
spec:
  direction: LR
  nodes:
    - { id: r1, kind: dataset, label: "record r", sub: "component → value or hash" }
    - { id: r2, kind: dataset, label: "record r′", sub: "component → value or hash" }
    - { id: loop, kind: process, label: "compare the nine components", sub: "lines 2–4, O(1) per pair" }
    - { id: diff, kind: state, label: "diff: hashes differ" }
    - { id: unk, kind: state, label: "unknown: missing in either record", sub: "never treated as equal" }
    - { id: ep, kind: branch, label: "endpoint in either record?", sub: "line 5" }
    - { id: hide, kind: process, label: "unknown ∪= {eng, hw} \\ disclosed", sub: "line 6" }
    - { id: phi, kind: dependency, label: "declared factor set Φ" }
    - { id: t1, kind: branch, label: "diff ⊆ Φ?", sub: "line 7" }
    - { id: t2, kind: branch, label: "unknown \\ Φ = ∅?", sub: "line 8" }
    - { id: conf, kind: state, label: "CONFOUNDED", sub: "returns diff \\ Φ" }
    - { id: under, kind: state, label: "UNDERSPECIFIED", sub: "returns unknown \\ Φ" }
    - { id: attr, kind: state, label: "ATTRIBUTABLE", sub: "returns diff; line 9", emphasis: true }
    - { id: cls, kind: process, label: "group by hash of non-factor components", sub: "comparability classes, O(R)" }
  edges:
    - { from: r1, to: loop }
    - { from: r2, to: loop }
    - { from: loop, to: diff, kind: emphasis }
    - { from: loop, to: unk }
    - { from: loop, to: ep }
    - { from: ep, to: hide, label: "yes" }
    - { from: hide, to: unk, kind: dependency }
    - { from: diff, to: t1, kind: emphasis }
    - { from: phi, to: t1, kind: dependency }
    - { from: t1, to: conf, label: "no" }
    - { from: t1, to: t2, kind: emphasis, label: "yes" }
    - { from: unk, to: t2 }
    - { from: phi, to: t2, kind: dependency }
    - { from: t2, to: under, label: "no" }
    - { from: t2, to: attr, kind: emphasis, label: "yes" }
    - { from: phi, to: cls, kind: dependency, label: "non-factor components" }
```

## Implementation

The components map onto reference-stack systems by layer. u_ckpt, u_tok, and the chat-template part of u_prompt are artifacts of the *Model definition / adaptation* layer: Hugging Face Transformers stores the template with the tokenizer and exposes it through `apply_chat_template` (OFFICIAL-DOCUMENTATION · R6.36). u_eng is an *Inference engine* layer choice — vLLM, SGLang, TensorRT-LLM, llama.cpp — and the LM Evaluation Harness reaches several of these behind one task definition (`--model hf`, `--model vllm`, `--model sglang`, `--model gguf`, and API-backed models) (OFFICIAL-DOCUMENTATION · R6.2), which is what makes an engine-swap experiment cheap to specify. The harness is outside the reference stack and is used under the plan's Appendix B evaluation row. u_hw belongs to the *Accelerator / driver / compiler* layer (NVIDIA CUDA, AMD ROCm) and must be recorded with driver and runtime versions per the §4.2 *Reproducibility* dimension. u_endp and u_prod sit above the *Serving / portable runtime* layer and are outside the evaluator's control; no property of TensorRT-LLM or llama.cpp is asserted here beyond their role as engine levels (NOT-DISCLOSED for their determinism behaviour, not inspected).

```text
Systems trace (one evaluated item)
render prompt   → latency: CPU µs–ms / memory: prompt string / failure: template mismatch, duplicated BOS
tokenise        → latency: CPU / memory: ids / failure: tokenizer revision drift changes ids silently
engine prefill  → compute: ≈2N FLOPs × prompt tokens / memory: KV for the prompt / failure: truncation at context limit
engine decode   → compute: ≈2N FLOPs × output tokens × n_r / failure: batch-dependent reduction order, stop-string mismatch
scaffold score  → latency: regex, execution, or judge call / failure: extraction rejects a correct answer
endpoint (if any) → latency: network + queue / failure: silent model or routing update inside the measurement window
```

Cost line for recording the full tuple: a few hundred bytes of hashes per result row and the engineering cost of capturing engine flags and driver versions at run time; the cost of not recording it is that the row can enter no comparison (DERIVED from Algorithm 6.1 line 8).

## Experimental design

### Experiment 6.1 — Component-swap attribution for one checkpoint

- **Hypothesis:** with the checkpoint fixed, swapping the prompt template, the scaffold's extraction rule, or the engine each moves the benchmark score by an amount that is not negligible relative to typical between-checkpoint differences on the same benchmark, and at least one pairwise interaction is non-zero.
- **Setup:** one open-weight instruction-tuned checkpoint (hash pinned); 2 × 2 × 2 full factorial over template ∈ {model's own chat template, plain concatenation}, extraction ∈ {strict format, lenient last-number/last-letter}, engine ∈ {Hugging Face Transformers eager, vLLM}; greedy decoding; n_r = 1.
- **Independent variables:** u_prompt (template), u_scaf (extraction), u_eng.
- **Controlled variables:** u_ckpt, u_tok, numeric format, item set and order, few-shot examples, maximum output tokens, hardware, driver.
- **Dataset/workload:** one multiple-choice and one free-form generative task from a versioned harness task set, test split, all items.
- **Hardware:** one accelerator type; device, driver, and runtime recorded.
- **Metrics:** Eq. 6.1 per cell; paired item-level differences between cells; fraction of items whose scored outcome changes between engines.
- **Baselines:** the cell (own template, strict extraction, Transformers) re-run twice to measure the run-to-run floor.
- **Expected result:** template and extraction main effects larger than the run-to-run floor; engine main effect small on the multiple-choice task (log-likelihood scoring) and larger on the generative task (divergent continuations); a template × extraction interaction on the generative task.
- **Ablation:** repeat the engine factor with the engine's deterministic mode enabled to separate engine-implementation differences from batch-composition effects.
- **Interpretation:** estimates γ_prompt, γ_scaf, γ_eng and their interactions for this checkpoint only; supports the rule that unrecorded components void attribution.
- **Threats to validity:** effects are checkpoint- and task-specific; greedy decoding removes sampling variance but maximises sensitivity to near-ties; eight cells on one item set share item-level noise, which the paired analysis of §6.4 handles.

Proposal only; no run was executed.

## Observations

**What the paper claims.** HELM claims that standardising adaptation is a precondition for comparing models and reports sensitivity to prompt format and in-context examples across all its models (PAPER-REPORTED · P50). Biderman et al. and Sclar et al. report large prompt-format effects (PAPER-REPORTED · R6.4, R6.22). vLLM and SGLang document batch-dependent nondeterminism and its conditions (OFFICIAL-DOCUMENTATION · R6.33, R6.35). Artificial Analysis and Epoch AI document that what they measure are endpoints under stated workloads and scaffolds (OFFICIAL-DOCUMENTATION · R6.7, R6.8, R6.10).

**What the evidence shows.** The existence of prompt and scaffold effects has multiple independent reports (P50, R6.4, R6.22). The engine-level effect on benchmark scores has documented mechanism (R6.33, R6.35) but no magnitude in the sources inspected. That endpoint results differ across providers of nominally one model is stated by the measuring organisation itself and is not separately reproduced here.

**What we infer.** A score difference between two rows of a public table that differ in undisclosed components is CONFOUNDED or UNDERSPECIFIED under Algorithm 6.1 (DERIVED). We infer, marked ASSUMED, that most cross-report comparisons in model announcements fall in those two verdicts; no sample has been audited for this edition.

**What remains unknown.** The size of engine and hardware main effects on generative benchmarks for a given checkpoint is UNVERIFIED until Experiment 6.1 is run. The complete serving stacks behind the endpoints discussed here are NOT-DISCLOSED at the granularity required for component attribution. The voter and prompt mixture per model on preference platforms is NOT-DISCLOSED at the granularity Eq. 6.2 would need.

## Failure modes

> **Failure mode — Score attached to a name.** *Symptom:* two reports give different scores for "the same model" on "the same benchmark". *Cause:* different u_prompt, u_scaf, or u_eng under one u_model label. *Detection:* Algorithm 6.1 returns UNDERSPECIFIED. *Mitigation:* publish the tuple; refuse the comparison otherwise.

> **Failure mode — Endpoint read as checkpoint.** *Symptom:* an endpoint's latency, price, or accuracy is quoted as a property of open weights. *Cause:* u_endp hides u_eng, u_hw, format, and batching. *Detection:* the record has a provider and date but no engine commit. *Mitigation:* attribute to the endpoint and window; re-measure on a controlled engine for checkpoint claims ([§48.6](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-6-external-measurements.md)).

> **Failure mode — Preference score used as capability evidence.** *Symptom:* a pairwise-preference rank is cited for task correctness. *Cause:* different estimand and item distribution. *Detection:* the metric's unit is a win probability, not an accuracy. *Mitigation:* report axes separately ([§62.6](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-6-interpreting-scores.md)).

> **Failure mode — Silent scaffold change.** *Symptom:* a score jumps between harness versions with identical weights. *Cause:* changed extraction regex, stop strings, or few-shot sampling seed. *Detection:* task version and harness commit differ. *Mitigation:* pin both in the manifest (§6.6).

> **Failure mode — Batch-dependent outcome flips.** *Symptom:* re-running with a different batch size changes a few percent of item outcomes under greedy decoding. *Cause:* reduction-order differences at near-tied logits. *Detection:* item-level diff between runs. *Mitigation:* deterministic mode where documented, or treat as a variance term in §6.4.

## Siblings

**System-under-test benchmarking (MLPerf-style)** — [§48.2 Load-test methodology](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-2-load-test-methodology.md)
Why it exists: hardware and software vendors needed comparable system measurements. What assumption changed: the unit is the complete hardware/software system under a named load scenario (single-stream, multistream, server, offline; PAPER-REPORTED · R6.28), with the model held as a fixed reference. What objective changed: performance under a quality floor instead of quality. What problem it solved: attributable system comparisons. What new failure mode it introduced: results do not transfer to other models or workloads. Changed primitive: checkpoint-centred tuple → system-centred tuple.

**Black-box standardised adaptation (HELM)** — this chapter, [§6.6](06-6-reproducible-evidence.md)
Why it exists: models were evaluated on disjoint scenario sets under private prompts. What assumption changed: every model is a text interface adapted identically. What objective changed: none. What problem it solved: dense, like-for-like coverage (P50 reports core-scenario coverage rising from 17.9% to 96.0%; PAPER-REPORTED · P50). What new failure mode it introduced: a fixed generic prompt may understate units that depend on a specific template. Changed primitive: per-paper prompt → shared adaptation procedure.

**Pairwise preference platforms** — [§62.2 Pairwise aggregation](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-2-pairwise-aggregation.md)
Why it exists: static benchmarks miss open-ended use. What assumption changed: the item distribution is whatever users submit. What objective changed: win probability under a voter population. What problem it solved: coverage of open-ended prompts. What new failure mode it introduced: population, prompt-mixture, and exposure effects. Changed primitive: scored item → voted pair.

**Stage-level attribution in agents** — [§63.3 Stage attribution](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-3-stage-attribution.md)
Why it exists: agent scaffolds dominate outcomes. What assumption changed: u_scaf is itself a multi-stage system. What objective changed: none. What problem it solved: locating failures by stage. What new failure mode it introduced: combinatorial factor space. Changed primitive: single scaffold component → staged scaffold.

## Extensions

Domain adaptation adds the adaptation artifact (adapter weights, retrieval index) as a sub-component of u_ckpt or u_scaf; which one must be declared, because an adapter is weights and an index is scaffold (DERIVED). Long context makes truncation policy part of u_scaf and cache policy part of u_eng. Multimodality adds a preprocessing component (image resizing, audio resampling) that belongs with u_tok as the input map. Agents enlarge u_scaf to tools, environments, and budgets; embodiment adds the physical platform to u_hw. Proposal: extend the tuple by sub-fields rather than new top-level components, so that Algorithm 6.1 is unchanged.

## Limitations

The tuple is complete only relative to what can be recorded; provider-side components are unobservable and no amount of record-keeping by the evaluator repairs that. Hash equality is sufficient for equality of behaviour only up to the nondeterminism documented for the engine. Falsification: if Experiment 6.1 found every non-checkpoint main effect and interaction inside the run-to-run floor across several checkpoints and task types, the nine-component record would be unnecessary overhead for that regime and a two-component (checkpoint, task) record would suffice. Decision consequence: every score in this book is reported with its tuple or with an explicit list of the components that are NOT-DISCLOSED.

## Reproducibility

Versions: P50 arXiv 2211.09110 v2; P51 arXiv 2403.04132; R6.4 arXiv 2405.14782 (HTML); R6.22 arXiv 2310.11324; R6.2 LM Evaluation Harness README (main branch, accessed 2026-09-20, no commit pinned); R6.13 Open LLM Leaderboard About page; R6.33 vLLM stable documentation (moving stable page, engine version not pinned); R6.35 SGLang documentation (version not shown); R6.36 Transformers living documentation (release pin UNVERIFIED); R6.7–R6.10 accessed 2026-09-20; R6.11–R6.12 could not be revalidated. Artifacts: the unit-tuple block of `benchmark_manifest.yaml`. Metric definition: Eq. 6.1 with n, n_r, and the scoring rule stated. Unresolved: serving stacks of hosted endpoints (NOT-DISCLOSED); engine effect magnitudes (UNVERIFIED).

## References

P50, P51; R6.2, R6.4, R6.7, R6.8, R6.9, R6.10, R6.11, R6.12, R6.13, R6.22, R6.28, R6.32, R6.33, R6.35, R6.36; book_plan.md corrections table and Appendix G.
