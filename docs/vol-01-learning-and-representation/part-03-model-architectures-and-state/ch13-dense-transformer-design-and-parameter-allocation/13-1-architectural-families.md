---
id: ms.section.13.1
entity_type: section
title: Architectural families
short_title: Architectural families
section: 13.1
slug: 13-1-architectural-families
parent: ms.chapter.13
prev_sibling: null
next_sibling: ms.section.13.2
children: []
prerequisites: [ms.chapter.5, ms.chapter.10]
downstream: [ms.chapter.14, ms.chapter.19, ms.chapter.21]
word_count_target: 1800
volume: 1
part: 3
chapter: 13
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [dense_architecture, parameter_allocation], feedback_setting: [], modality: [text]}
papers: [P01, P02]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core, impl.nvidia-transformer-engine]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 13.1 Architectural families

## Scope

**KNOWN — chapter matrix.** This section compares decoder-only, encoder-only, and encoder–decoder computation, including conditional generation and task-specific heads. Chapter 04 owns learning objectives; Chapter 05 owns the elementary Transformer execution trace. Here the task is to choose a computation graph and account for its parameters, attention domains, reusable state, and outputs. A family name alone does not specify a loss, mask, tokenizer, or deployment workload.

## Why this exists

**DERIVED.** The same attention and feed-forward primitives can support fundamentally different information paths. An encoder representation may read both sides of a token. An autoregressive decoder state may read only its allowed prefix. An encoder–decoder can repeatedly query a separately computed source representation. These distinctions determine whether an intermediate state remains valid when another token is appended.

**DERIVED.** Comparisons become misleading when model size replaces the workload definition. An encoder performing one classification pass and a decoder generating a long answer do not execute the same number of positions or output projections. A conditional-generation comparison must specify source length, target length, number of generated continuations, and which preprocessing is reused. Otherwise “faster architecture” is an unidentified claim.

## Intuition

**DERIVED.** Treat the family as a visibility graph with an output interface. Visibility defines which token can influence which representation. The output interface defines whether one pooled vector, all token vectors, or a newly generated token is required. The physical cost follows from the graph and interface jointly.

**KNOWN — canonical terminology.** The [model-category discussion in §1.3](../../part-01-scientific-foundations/ch01-foundation-model-lifecycle/01-3-model-categories.md) owns the broad taxonomy. This section adds the architecture accounting; it does not equate bidirectional attention with one mandatory pretraining objective.

## Formulation

**MATHEMATICALLY-DERIVED — permitted interactions.** For one sequence with source length $T_x$, target length $T_y$, $L_e$ encoder blocks, and $L_d$ decoder blocks, a conventional encoder–decoder visibility graph has

$$
n_{\mathrm{pairs}}=
L_eT_x^2+
L_d\frac{T_y(T_y+1)}{2}
+L_dT_xT_y.
$$
*(Eq. 13.1)*

where the terms count full encoder self-attention, causal decoder self-attention, and decoder-to-encoder cross-attention per head. Padding and task-specific restrictions are excluded. This is a semantic interaction count, not a guarantee that the kernel skips every masked operation.

**MATHEMATICALLY-DERIVED — cross-attention projections.** Let $d_e$ be encoder width, $d$ decoder width, and $d_a$ the total projected attention width. With separate bias-free query, key, value, and output maps,

$$
N_{\mathrm{cross}}=2dd_a+2d_ed_a.
$$
*(Eq. 13.2)*

where query and output contribute $2dd_a$, and encoder key/value maps contribute $2d_ed_a$. For batch size $B$, computing the projections once and the dense attention products costs

$$
F_{\mathrm{cross}}=
4BT_ydd_a+4BT_xd_ed_a+4BT_xT_yd_a.
$$
*(Eq. 13.3)*

where $F$ denotes forward FLOPs with multiply-add counted as two. Softmax, bias, normalization, and data movement are excluded. Cross-attention keys and values are reusable across target positions only while their encoder states and projection weights remain unchanged.

~~~figure
id: fig-13.3
kind: calculator
title: Cross-attention projection parameters
caption: Eq. 13.2 counts four bias-free maps; it excludes self-attention, feed-forward blocks, embeddings, normalization, and task heads.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: "Equal widths", variables: {d: 1024, de: 1024, da: 1024}, note: "Four bias-free matrices contain 4,194,304 parameters."}
  - {anchor: mechanism, label: "Wider encoder", variables: {d: 1024, de: 2048, da: 1024}, note: "Encoder width enlarges K/V projections while decoder width stays fixed."}
  - {anchor: failure-modes, label: "Baseline accounting", variables: {d: 1024, de: 1024, da: 1024}, note: "The parameter count leaves execution multiplicities unspecified."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-13.2
alt: With encoder width, decoder width, and projected attention width all equal to 1024, cross-attention contains 4,194,304 matrix parameters per decoder block.
spec:
  tex: N_{\mathrm{cross}}=2dd_a+2d_ed_a
  equation: "13.2"
  inputs:
    - {symbol: d, label: decoder width, default: 1024, min: 64, max: 16384, format: integer}
    - {symbol: de, label: encoder width, default: 1024, min: 64, max: 16384, format: integer}
    - {symbol: da, label: projected attention width, default: 1024, min: 64, max: 16384, format: integer}
  outputs:
    - {symbol: Ncross, label: matrix parameters, formula: 2*d*da+2*de*da, format: params}
~~~

## Mechanism

**PAPER-REPORTED — [P01](references.md#p01), §3.1.** The original Transformer combines an encoder, a causal decoder, and decoder cross-attention. **DERIVED.** The third component must be counted explicitly: describing an encoder–decoder as two copies of a decoder-only stack omits a parameter and compute term.

**PAPER-REPORTED — [R13.1](references.md#r131).** BERT develops bidirectional representations with masked-language-model pretraining and downstream adaptation. **DERIVED.** A bidirectional encoder normally recomputes representations when the visible input changes, because earlier positions may now depend on newly introduced content. Reusing an autoregressive-style cache without an independence argument changes the computation.

**PAPER-REPORTED — [P02](references.md#p02).** T5 studies a unified text-to-text transfer framework. **DERIVED.** Its existence demonstrates why conditional generation is not a synonym for decoder-only architecture. A decoder-only model can condition by placing source tokens in a prefix; an encoder–decoder can condition through a separate source representation. Those paths have distinct projection and state lifetimes.

~~~figure
id: fig-13.4
kind: diagram
title: Conditional generation through separate source state
caption: The encoder state is computed on source tokens; decoder cross-attention reads that state while causal self-attention reads the target prefix.
placement: inline
evidence: DERIVED
source: [P01, DERIVED:eq-13.3]
alt: Source tokens feed an encoder and retained source states. A target prefix feeds a causal decoder, whose cross-attention also reads source states before producing target logits.
spec:
  direction: LR
  nodes:
    - {id: x, kind: tensor, label: source tokens, sub: "[B, Tx]"}
    - {id: enc, kind: model, label: encoder}
    - {id: state, kind: memory, label: source states, sub: "[B, Tx, de]"}
    - {id: y, kind: tensor, label: target prefix, sub: "[B, Ty]"}
    - {id: dec, kind: model, label: causal decoder}
    - {id: cross, kind: process, label: cross-attention}
    - {id: out, kind: tensor, label: target logits}
  edges:
    - {from: x, to: enc}
    - {from: enc, to: state}
    - {from: y, to: dec}
    - {from: dec, to: cross}
    - {from: state, to: cross, kind: dependency}
    - {from: cross, to: out}
~~~

**DERIVED.** For a decoder-only prefix of length $T_x$ followed by $T_y$ target tokens, ordinary causal attention also constrains source-token representations causally. A prefix-LM mask can instead permit source-to-source bidirectionality while preserving target causality. These are different visibility graphs even when the same weight tensors are reused. The loss mask can exclude source-token prediction independently of either graph.

**DERIVED.** Teacher forcing makes all known target inputs available for parallel training computation, but the causal mask must still prohibit access to the target being predicted through future positions. Parallel execution does not remove autoregressive factorization. During generation, later target values are unavailable, so repeated incremental execution is required unless a separately specified generation algorithm changes that process.

**DERIVED.** Heads add a second architectural decision. Sequence classification can map a selected or pooled representation of width $d$ to $K$ classes, using $dK+K$ parameters for an affine head. Token classification applies that map to multiple positions. A span head can produce start/end scores. A vocabulary head projects to $V$ symbols; its cost is developed in [§13.5](13-5-embeddings-and-heads.md). Pooling, hidden transformations, and task-specific normalization add parameters and must be included rather than inferred from a task label.

**DERIVED.** State reuse is workload-specific. One encoded source can serve multiple target continuations under fixed weights and source preprocessing. Its projected cross-attention keys and values are layer-specific. A decoder prefix cache can likewise be reused for identical prefixes, but compatibility includes position convention and model configuration. Neither reuse entitlement follows from equal text alone if tokenization or masks differ.

## Algorithm

**DERIVED — reuse boundary.** Reusing source states across target continuations requires the source computation to have the same dependencies and stochastic realization. Evaluation with dropout disabled is one admissible contract. During training, reusing a stochastic source encoding instead of recomputing it can change correlations between continuations, even when weights and token IDs are unchanged. Autograd ownership also matters: shared source work can receive gradients from several target losses, so its memory lifetime and backward multiplicity must be recorded. A cache-validity claim must therefore distinguish deterministic inference reuse from a deliberately shared training computation.

**DERIVED — proposed architecture inventory.**

~~~text
Algorithm 13.1 — Construct a family-specific accounting graph
INPUT: family; source/target shapes; block specifications; task-head contract
OUTPUT: Result(operator inventory and state lifetimes, specification error)
STATE: typed tensor graph and parameter-identity registry
INVARIANT: every operator has explicit input visibility, shape, and parameter owner
1. Validate source, target, padding, and target-loss domains.
2. Instantiate encoder, decoder, and cross-attention blocks only when specified.
3. Attach each projection's input/output dimensions and unique parameter identity.
4. Attach the task head at exactly the positions required by the workload.
5. Mark persistent state valid only under unchanged dependencies and weights.
6. Sum parameters by unique identity; sum work by actual operator invocation.
7. Return excluded costs and unresolved implementation choices explicitly.
~~~

**DERIVED — complexity.** For $n_{\mathrm{op}}$ operators and $n_{\mathrm{edge}}$ tensor dependencies, graph construction and a topological traversal cost $O(n_{\mathrm{op}}+n_{\mathrm{edge}})$ after identities are resolved. Parameter deduplication using a sorted fixed-width registry costs $O(n_{\mathrm{param}}\log n_{\mathrm{param}})$ comparisons over parameter objects, not over individual scalar values. Dense attention has an explicitly bounded sequence-length contract; this manuscript does not prescribe quadratic work on unbounded user input.

## Implementation

**OFFICIAL-DOCUMENTATION — [R13.9](references.md#r139).** Hugging Face Transformers documents BERT task-head interfaces. Its stack layer is *Model definition / adaptation*. PyTorch (*Model / autograd framework*) supplies the operator interfaces, including explicitly documented attention-mask semantics [R13.12](references.md#r1312). NVIDIA Megatron-Core (*Distributed training*) is a distribution route rather than a distinct architectural family [R13.13](references.md#r1313).

**DERIVED.** A class name is not enough to identify the computation. Inspect resolved configuration, head attachment, weight sharing, and mask construction. Implementations can expose an encoder-derived model with decoder or cross-attention options; those options change the graph and should trigger a fresh accounting record.

## Experimental design

**PROPOSAL — no training or timing results reported.**

### Experiment 13.1 — Family accounting under a conditional workload

- **Hypothesis:** equal total parameters do not equate source processing, target processing, or reusable state.
- **Setup:** inventory an encoder–decoder and a decoder-only conditional model with explicit configurations.
- **Independent variables:** source length, target length, number of continuations, and head type.
- **Controlled variables:** tokenizer, task, target loss, precision, and allowed information.
- **Dataset/workload:** permitted source/target pairs with a held-out length distribution.
- **Hardware:** record only when executing; include device, memory, runtime, and concurrency.
- **Metrics:** parameter categories, counted FLOPs, state bytes, target quality, and measured phase latency.
- **Baselines:** independent source processing for each continuation and valid source-state reuse.
- **Expected result:** accounting differs by graph; no quality or speed ranking is assumed.
- **Ablation:** omit cross-attention from the inventory and verify that the count audit detects it.
- **Interpretation:** compare conditional tasks under matched information, not incompatible loss values.
- **Threats to validity:** unequal source masks, different tokenization, and unreported head parameters.

## Observations

**What the paper claims.** **PAPER-REPORTED.** P01, P02, and R13.1 establish different architecture/objective combinations; they do not establish a universal family ranking.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Cross-attention adds Eq. 13.2 parameters and Eq. 13.3 work under the stated dimensions.

**What we infer.** **DERIVED.** The workload must be specified before architecture cost is comparable.

**What remains unknown.** **UNVERIFIED.** Quality and latency for a chosen matched-budget comparison require execution.

## Failure modes

~~~figure
id: fig-13.5
kind: stat-panel
title: Family comparison boundary
caption: Cross-attention accounting requires source and target lengths and both stream widths.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-13.3
alt: Cross-attention accounting requires source and target lengths and both stream widths.
spec:
  header: ACCOUNTING BOUNDARY
  rows:
    - {key: "source length", value: "Tx required"}
    - {key: "target length", value: "Ty required"}
    - {key: "source K/V projection", value: "count or declare reuse"}
    - {key: "task head", value: "count executed positions"}
~~~

> **Failure mode — objective leakage.** **DERIVED.** *Symptom:* implausibly good teacher-forced loss. *Cause:* target information is visible through an incorrect mask. *Detection:* perturb future target tokens. *Mitigation:* independently audit visibility and loss domains.

> **Failure mode — stale source state.** **DERIVED.** *Symptom:* cached and fresh outputs disagree. *Cause:* source preprocessing, weights, or position semantics changed. *Detection:* compare dependency identities. *Mitigation:* invalidate state when any defining dependency changes.

## Siblings

**DERIVED.** Encoder-only, decoder-only, and encoder–decoder are peers in this section, distinguished by visibility and conditioning paths. Task heads are output interfaces, not a fourth mutually exclusive family. [§13.2](13-2-width-depth-and-heads.md) changes capacity within a specified graph; the [Part III map](../README.md) routes specialized attention and recurrent alternatives to Chapters 14 and 17.

## Extensions

**DERIVED.** A multimodal encoder can provide conditioning states to a language decoder, but modality projections and time/position alignment enlarge the interface contract. Retrieval can provide additional source states or prefix tokens; those alternatives change memory and computation differently. Their canonical mechanisms are developed later.

## Limitations

**DERIVED.** The equations exclude implementation-specific fusion and padding. They count declared work rather than predict throughput. A family with fewer admitted attention pairs can still execute a less efficient kernel or require more serial calls.

## Reproducibility

**DERIVED — required record.** Retain architecture configuration, visibility graph, source/target tokenization, task head, weight identities, position rules, state-validity conditions, and the exact phase boundaries used in cost comparisons.

## References

[P01](references.md#p01); [P02](references.md#p02); [R13.1 — BERT](references.md#r131); [R13.9 — task heads](references.md#r139); [R13.12 — attention interface](references.md#r1312); [R13.13 — distributed projections](references.md#r1313).
