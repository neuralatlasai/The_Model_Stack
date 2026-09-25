---
id: ms.section.15.4
entity_type: section
title: Effective context
short_title: Effective context
section: 15.4
slug: 15-4-effective-context
parent: ms.chapter.15
prev_sibling: ms.section.15.3
next_sibling: ms.section.15.5
children: []
prerequisites: [ms.chapter.10, ms.chapter.13, ms.chapter.14, ms.section.15.3]
downstream: [ms.chapter.27, ms.chapter.42, ms.chapter.49]
word_count_target: 1900
volume: 1
part: 3
chapter: 15
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [position_representation, long_context], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P01, P46]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 15.4 — Effective context

## Scope

Effective context is measured information access under a specified task distribution. This section constructs the chapter's experiment matrix over length, evidence position, distractors, required facts, and task type. It covers single-needle retrieval, multi-hop aggregation, distributed evidence, negative controls, and uncertainty. The baseline is a frozen checkpoint and context-construction policy. Success is a qualified statement about tested conditions; an advertised input limit is only an admissibility constraint.

## Why this exists

**PAPER-REPORTED.** Lost in the Middle reports sensitivity to relevant-information position in its evaluated settings [R15.7]. RULER broadens synthetic long-context evaluation beyond a single needle to multiple needles, tracing, and aggregation [R15.8]. These findings motivate a multidimensional test rather than a single maximum-length demonstration.

**DERIVED.** An input can be accepted, processed without numerical failure, and still fail its task. A correct answer can also arise without using the supplied evidence, for example when an answer is predictable from prior knowledge. Measuring information access therefore requires controls that distinguish successful evidence use from plausible answer production.

The dominant constraint is identifiability: determine which component failed. Was the evidence absent, inaccessible, contradicted by a distractor, incorrectly combined, or correctly used but scored incorrectly? A single aggregate score generally cannot answer that question. The matrix makes these alternatives inspectable while preserving the complete end-to-end success metric.

## Intuition

**DERIVED.** A needle task principally asks whether a supplied item can be located and reproduced. A multi-hop task additionally requires composing relationships. An aggregation task requires collecting a set without omissions or duplicate counting. Increasing the number of required facts can make the task harder even when the total sequence length remains fixed.

Evidence position is a vector when several facts are required. Placing all facts together near the beginning tests a different condition from distributing them across the context. Distractor density is also insufficient alone: a random irrelevant paragraph and a plausible conflicting statement impose different discrimination requirements. Record distractor type as well as quantity.

> **Definition — Effective-context envelope.** The explicitly tested set of context lengths and task conditions under which a frozen system satisfies predeclared quality and resource criteria, with stated uncertainty.

## Formulation

**DERIVED.** Define a test cell \(c=(T,\mathbf p,d,k,\tau)\): token length \(T\); evidence positions \(\mathbf p\); distractor specification \(d\); required-fact count \(k\); and task family \(\tau\). Preserve both absolute token offsets and normalized positions. Normalization must specify its denominator and evidence-span convention.

**MATHEMATICALLY-DERIVED.** For binary success \(Y_{c,i}\in\{0,1\}\) on \(n_c>0\) independently sampled examples from a fixed cell distribution,

$$
\widehat q_c=\frac{1}{n_c}\sum_{i=1}^{n_c}Y_{c,i}.
$$
*(Eq. 15.11)*

A conservative simultaneous lower bound across \(K\ge1\) predeclared cells is

$$
q_c^{\mathrm{lower}}
=\max\!\left(0,\widehat q_c-
\sqrt{\frac{\ln(K/\delta)}{2n_c}}\right),
\qquad 0<\delta<1.
$$
*(Eq. 15.12)*

The bound uses the one-sided concentration inequality for independent bounded observations within each cell, followed by a union bound over cells. Set the per-cell failure probability to \(\delta/K\); solving \(\exp(-2n_c\epsilon_c^2)=\delta/K\) gives the displayed margin. Cross-cell independence is unnecessary for the union bound. Reusing correlated variants as independent examples within a cell violates the premise.

Let \(\mathcal G\) be a finite length grid and \(\mathcal C(T)\) its predeclared cells. For quality threshold \(q_\star\), define the passing tested lengths:

$$
\mathcal G_{\mathrm{pass}}
=\left\{T\in\mathcal G:
\min_{c\in\mathcal C(T)}q_c^{\mathrm{lower}}\ge q_\star
\;\land\; \text{resource criteria pass at }T
\right\}.
$$
*(Eq. 15.13)*

Do not replace this set with a claim about every length below its largest member. Intermediate untested lengths remain untested; observed performance need not be monotonic.

~~~figure
id: fig-15.12
kind: calculator
title: Simultaneous uncertainty margin
caption: "This calculator shows the conservative mathematical margin for a proposed independent-sample design. It contains no observed model score."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-15.12
alt: "The uncertainty margin grows with the number of predeclared cells and decreases with independent samples per cell."
spec:
  tex: \epsilon=\sqrt{\ln(K/\delta)/(2n)}
  equation: "15.12"
  inputs:
    - {symbol: K, label: predeclared cells, default: 60, min: 1, max: 1000, format: integer}
    - {symbol: n, label: independent examples per cell, default: 1000, min: 10, max: 10000, format: integer}
    - {symbol: delta, label: family failure probability, default: 0.05, min: 0.001, max: 0.1, format: fixed3}
  outputs:
    - {symbol: margin, label: conservative probability margin, formula: "sqrt(ln(K/delta)/(2*n))", format: fixed3}
states:
  - {anchor: formulation, label: Planned matrix, variables: {K: 60, n: 1000, delta: 0.05}, note: "Cells and error budget are fixed before examining scores."}
  - {anchor: mechanism, label: More independent examples, variables: {K: 60, n: 4000, delta: 0.05}, note: "Fourfold sample count halves this margin."}
  - {anchor: failure-modes, label: Larger comparison family, variables: {K: 600, n: 1000, delta: 0.05}, note: "Adding claims without adding data weakens the simultaneous bound."}
~~~

## Mechanism

**DERIVED.** Construct tasks from an evidence ledger before generating distractors. The ledger identifies each required fact, its source span, and the operation needed to produce the answer. For tracing, preserve the chain of references; for aggregation, preserve the complete membership set. This allows failure analysis against a known dependency structure.

Position interventions should preserve semantic content. Move evidence while retaining document markers and enough surrounding context to keep it interpretable. Verify the final serialized prompt after tokenization: moving a paragraph can alter token count, separators, and truncation. A nominal position assignment is not evidence that the requested span survived serialization.

Negative controls sharpen interpretation. Remove the evidence; replace a decisive fact with a counterfactual value; introduce an irrelevant look-alike identifier; or supply conflicting versions with an explicit precedence rule. If answers do not respond to decisive evidence changes, accuracy alone does not establish grounded access.

For several facts, distinguish local recall from joint use. A system can reproduce every fact when asked separately and fail to combine them in one answer. Conversely, an aggregate answer may accidentally be correct despite a missing fact. Score both the final answer and the required support mapping, while keeping their definitions separate.

~~~figure
id: fig-15.13
kind: diagram
title: Effective-context evidence pipeline
caption: "The generator records ground truth before the model runs; independent scoring separates answer correctness from evidence support."
placement: inline
evidence: DERIVED
source: DERIVED:eq-15.11
alt: "An evidence ledger and test-cell specification produce a serialized prompt. The frozen model produces an answer that an independent scorer checks against the original evidence ledger."
spec:
  direction: LR
  nodes:
    - {id: ledger, kind: dataset, label: Required facts and source spans}
    - {id: cell, kind: dependency, label: Length position distractors task}
    - {id: prompt, kind: tensor, label: Verified serialized prompt}
    - {id: model, kind: model, label: Frozen evaluated system}
    - {id: answer, kind: state, label: Answer and support claims}
    - {id: score, kind: metric, label: Independent cell metrics}
  edges:
    - {from: ledger, to: prompt, kind: flow}
    - {from: cell, to: prompt, kind: dependency}
    - {from: prompt, to: model, kind: flow}
    - {from: model, to: answer, kind: flow}
    - {from: answer, to: score, kind: flow}
    - {from: ledger, to: score, kind: dependency}
~~~

**PAPER-REPORTED.** The Gemini 2.5 report includes long-context evaluation with named tasks and additional methodological details [P46]. Its MRCR-V2 discussion changes the task setup relative to earlier reporting. **DERIVED.** Treat such protocol changes as comparability boundaries; do not align scores merely because both tables contain a long-context label. This chapter transfers no report score or current API limit.

Evaluation cost scales with the number of examples, their token lengths, and the inference policy. A larger matrix can spend substantial prefill compute even with short answers. Report total input and generated tokens, retries, failed requests, and evaluator cost. Those costs are separate from the quality estimand.

When examples share a source document, keep that grouping in the statistical record. A thousand rearrangements of one document do not supply a thousand independent draws from a population of documents. A useful paired design can compare position interventions within each source while estimating generalization across independently sampled sources. Predeclare whether the reported uncertainty concerns new placements of existing material or new source material; those are different targets of inference.

## Algorithm

**DERIVED — sealed evaluation matrix.**

~~~text
Algorithm 15.4 — Measure an effective-context envelope
INPUT: fixed cell grid, independent example generators, source ledger,
       frozen system, scoring rules, quality threshold, resource limits
OUTPUT: per-cell outcomes, uncertainty, passing tested-length set
STATE: immutable prompt and output records with failure categories
INVARIANT: all required evidence spans survive final serialization
1. Generate examples from held-out seeds and source documents.
2. Place evidence and distractors according to the selected cell.
3. Tokenize and validate length, positions, source identifiers, and answerability.
4. Run the frozen system under the declared decoding and retry policy.
5. Score correctness and support independently of the generation process.
6. Record execution failures and abstentions under the predeclared denominator.
7. Aggregate at the declared independent sampling unit.
8. Compute uncertainty and report every cell, including failed cells.
9. Construct the passing set without inferring untested lengths.
~~~

Generation and span validation should be bounded by total serialized input size. Avoid pairwise comparison of all distractors unless the dataset size is explicitly bounded and the extra cost is justified. Sort identifiers or use indexed membership checks for duplicate detection.

## Implementation

**DERIVED.** Hugging Face Transformers, **Model definition / adaptation**, supplies an inspectable local checkpoint and tokenizer path. PyTorch, **Model / autograd framework**, supports deterministic reference checks and numerical instrumentation. NVIDIA Megatron-Core, **Distributed training**, contributes training provenance when the evaluated checkpoint was adapted with context parallelism. None defines the quality metric on the evaluator's behalf.

The RULER primary paper and official repository route provide a benchmark starting point [R15.8]. Freeze a commit before reproduction; the manuscript does not claim an executed installation. Log serialized prompts rather than only generator parameters. For hosted systems, preserve the model identifier and access date and mark undisclosed internals explicitly.

## Experimental design

**PROPOSAL — the matrix is an artifact specification, not a completed benchmark.**

### Experiment 15.4 — Position and evidence-composition stress matrix

- **Hypothesis:** Usable context depends on evidence placement, distractor properties, and the number and composition of required facts.
- **Setup:** Cross a finite length grid with task-specific position layouts and difficulty conditions.
- **Independent variables:** Length, evidence-position vector, distractor density and type, fact count, and task family.
- **Controlled variables:** Checkpoint, tokenizer, prompt schema, generation budget, evaluator, and source eligibility.
- **Dataset/workload:** Held-out synthetic retrieval, tracing, aggregation, and document-grounded composition with explicit source spans.
- **Hardware:** Record local runtime context or hosted-service identification; undisclosed hardware stays NOT-DISCLOSED.
- **Metrics:** Answer success, complete support coverage, abstention, failure rate, per-cell uncertainty, and measured latency.
- **Baselines:** Short evidence-only inputs, no-evidence controls, single-needle tasks, and counterfactual evidence variants.
- **Expected result:** Differences between cells determine the envelope; no direction or magnitude is asserted in advance.
- **Ablation:** Move evidence without changing its content, then alter distractors or fact count separately.
- **Interpretation:** Report the tested passing set and failed conditions, never only the largest successful example.
- **Threats to validity:** Correlated templates, leaked answers, evaluator contamination, position-dependent truncation, and unreported retries.

## Observations

**What the paper claims — PAPER-REPORTED.** RULER motivates tasks beyond simple retrieval; Lost in the Middle investigates positional sensitivity [R15.7, R15.8].

**What the evidence shows — PAPER-REPORTED.** The cited findings belong to their model sets, task definitions, and evaluation dates. They do not establish the performance of an arbitrary 2026 deployment.

**What we infer — DERIVED.** A useful operational claim needs multiple evidence conditions and a defined uncertainty calculation.

**What remains unknown — UNVERIFIED.** All proposed per-cell scores and deployment thresholds remain unmeasured.

## Failure modes

**DERIVED.** Common failures include selecting only successful cells, counting repeated templates as independent samples, omitting timeouts from denominators, and treating answer fluency as evidence support.

~~~figure
id: fig-15.14
kind: stat-panel
title: Claim boundaries for context evaluation
caption: "A valid claim remains attached to its task, sampling unit, serialization, and tested length grid."
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-15.13
alt: "Accepted input, correct answer, complete support, and simultaneous uncertainty are different evaluation properties."
spec:
  header: Separate properties
  rows:
    - {key: Admissibility, value: "The runtime accepts the serialized input"}
    - {key: Correctness, value: "The answer meets the task scoring rule"}
    - {key: Grounding, value: "Required evidence supports the answer"}
    - {key: Generalization, value: "Declare the sampling regime"}
~~~

## Siblings

**DERIVED.** Perplexity measures predictive fit, needle retrieval measures a constrained access task, and distributed-evidence reasoning measures composition. They are complementary axes. A lower loss does not logically imply a passing multi-hop evaluation.

## Extensions

**DERIVED.** Multimodal evidence requires source coordinates such as frame intervals or image regions in addition to token offsets. Agent histories require turn and tool-output positions. Preserve original coordinates so serialization changes can be audited.

## Limitations

**DERIVED.** Synthetic control improves identifiability but does not reproduce every natural workload. The conservative bound can demand many independent samples. If independence is unavailable, use an analysis appropriate to the sampling clusters and document its conditions instead of reporting Eq. 15.12.

## Reproducibility

Release the matrix specification, source and generator hashes, held-out seeds, serialized prompts, raw outputs, scorer version, retry policy, denominators, and uncertainty procedure. Leave outcome fields explicitly unmeasured until execution.

## References

[P46](references.md#p46); [R15.7](references.md#r157); [R15.8](references.md#r158).
