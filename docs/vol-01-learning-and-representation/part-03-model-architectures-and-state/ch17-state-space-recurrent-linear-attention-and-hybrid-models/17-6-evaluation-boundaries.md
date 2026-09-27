---
id: ms.section.17.6
entity_type: section
title: "Evaluation boundaries"
short_title: "Evaluation boundaries"
section: 17.6
slug: 17-6-evaluation-boundaries
parent: ms.chapter.17
prev_sibling: ms.section.17.5
next_sibling: null
children: []
prerequisites: [ms.chapter.2, ms.chapter.13, ms.chapter.14, ms.chapter.15]
downstream: [ms.chapter.27, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 17
related: []
relations: []
axes: {lifecycle: [pretraining, inference, evaluation], mechanism: [recurrent_state, state_space, linear_attention], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P11, P12]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.triton-language]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-27
editorial_status: manuscript_draft
---


# 17.6 — Evaluation boundaries

## Scope

This section defines a sequence-model comparison that measures recall and generation quality as length grows while accounting separately for persistent state and computation. It covers associative recall, exact copying, length extrapolation, throughput, and workload-dependent crossovers. Success is a reproducible quality-resource frontier with declared training, model, numerical, and system boundaries. Every experiment is a proposal. Analytical curves illustrate mechanisms; they do not substitute for measured model performance.

## Why this exists

**DERIVED.** “Long-context performance” can refer to accepting a long input, recalling one embedded item, copying an arbitrary sequence, maintaining language-model loss, or sustaining generation throughput. These are different outcomes. An architecture can improve one while degrading another. A benchmark that reports only an average over tasks hides the reason for a difference.

Sequence length also entangles several variables. A longer prompt may contain more relevant associations, more distractors, longer query distances, or simply more repeated material. A fixed-state model may be sensitive to the number of independent associations rather than raw token count. An attention model may be limited by cache capacity or memory traffic even when its retrieval behavior is adequate.

**PAPER-REPORTED.** Zoology studies associative recall as a diagnostic for efficient sequence models and develops multi-query recall workloads [R17.3]. This chapter uses that motivation while specifying its own controlled extensions and budget ledger. It does not transfer the paper's measured ordering to later checkpoints.

## Intuition

**DERIVED.** Evaluate the information problem and the execution problem separately, then join them at a declared acceptance threshold. First establish that two implementations compute their own intended operators. Next determine which trained models answer the task correctly. Finally measure the cost of producing those answers on the selected hardware and workload.

A single “tokens per second” value omits whether tokens were processed in parallel during prefill or generated sequentially, how many requests ran concurrently, and whether output lengths differed. Likewise, peak memory is not persistent state: peak includes temporary allocations, while persistent state is what remains available across the next-token boundary.

> **Definition — State-budget comparison.** An evaluation that constrains and reports all prefix-dependent persistent storage for each request while measuring task quality and execution cost under separately declared model and training budgets.

State-budget matching is one experimental axis. It cannot simultaneously guarantee equal parameters, training FLOPs, active arithmetic, and wall-clock optimization effort unless the configurations actually satisfy all those constraints.

## Formulation

**MATHEMATICALLY-DERIVED.** For $n$ held-out requests in a specified length/task cell, define

$$
\widehat a_{\mathrm{exact}}=\frac1n\sum_{j=1}^{n}
\mathbf1[\widehat y_j=y_j],\qquad
\widehat e_{\mathrm{token}}=
\frac{\sum_j\sum_{t=1}^{m_j}\mathbf1[\widehat y_{j,t}\ne y_{j,t}]}
{\sum_jm_j}.
$$
*(Eq. 17.19)*

where $y_j$ is the complete required output, $\widehat y_j$ the generated output under the declared decoding policy, and $m_j$ the reference output length.

Specify how extra or missing tokens are scored; an exact-match metric rejects them. For token error, use a fixed alignment rule rather than silently discarding unmatched tokens. A separately reported edit-distance metric can handle variable-length copying without pretending that positions remain aligned.

For a fixed target continuation, the probability of an exact sampled sequence is

$$
p(y_{1:m}\mid x)=
\prod_{t=1}^{m}p(y_t\mid x,y_{1:t-1}).
$$
*(Eq. 17.20)*

where $x$ is the prompt and each factor conditions on the correct preceding target tokens.

This is the chain rule, not an independence assumption. It explains why a long exact-copy requirement is stricter than a high average token probability. It does not predict greedy-decoding exact match from perplexity, and an average token probability cannot generally be substituted into every factor.

For a local descriptive latency model at fixed concurrency and configuration,

$$
t_{\mathrm{attn}}(S)=a+cS,\qquad
t_{\mathrm{rec}}(S)=d,\qquad
S_\star=\frac{d-a}{c}\quad(c>0,\ d>a).
$$
*(Eq. 17.21)*

where $S$ is retained prefix length, $a,d$ are latency intercepts, $c$ latency increase per retained token, and $S_\star$ a positive intersection only under the stated conditions.

**ASSUMED.** This is a restricted explanatory fit, not a universal hardware law. Kernel transitions, batching, cache policies, and capacity limits can invalidate the linear/constant forms. Fits require residual inspection and measured coefficients; this manuscript supplies none.

The persistent-state payload from previous sections must be separated from total live allocation:

$$
M_{\mathrm{live}}(t)=M_{\mathrm{weights}}+
M_{\mathrm{persistent}}(t)+M_{\mathrm{temporary}}(t)+M_{\mathrm{other}}(t),
\qquad
M_{\mathrm{peak}}=\max_t M_{\mathrm{live}}(t).
$$
*(Eq. 17.22)*

where the categories are disjoint live allocations within a specified device or process boundary, and $M_{\mathrm{other}}$ includes explicitly enumerated metadata and runtime allocations.

Allocator reservation is a separate measurement when reserved blocks exceed live allocation. Do not sum category maxima attained at different times and call the result an observed peak.

~~~figure
id: fig-17.18
kind: calculator
title: "Exact-copy chain rule fixture"
caption: "Illustrative equal conditional probabilities from Eq. 17.20, not measured model performance. The equal-factor setting is a chosen mathematical fixture, not an independence claim."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.20"
alt: "Illustrative equal conditional probabilities from Eq. 17.20, not measured model performance. The equal-factor setting is a chosen mathematical fixture, not an independence claim."
spec: {"tex": "p(y_{1:m}\\mid x)=\\prod_t p(y_t\\mid x,y_{1:t-1})", "equation": "17.20", "inputs": [{"symbol": "p", "label": "each conditional probability", "default": 0.99, "min": 0.8, "max": 1, "step": 0.001, "format": "fixed2"}, {"symbol": "m", "label": "required output tokens", "default": 128, "min": 1, "max": 4096, "step": 1, "format": "fixed2"}], "outputs": [{"symbol": "exact", "label": "sequence probability", "formula": "p^m", "format": "fixed2"}, {"symbol": "logp", "label": "log sequence probability", "formula": "m*ln(p)", "format": "fixed2"}]}
states: [{"anchor":"formulation","label":"Short copy","variables":{"m":32},"note":"All conditional probabilities are fixed to the same illustrative value."},{"anchor":"mechanism","label":"Longer copy","variables":{"m":512},"note":"Exact sequence success compounds conditional errors."},{"anchor":"failure-modes","label":"Higher conditionals","variables":{"p":0.999,"m":512},"note":"This curve does not predict greedy-decoding success."}]
~~~

## Mechanism

**DERIVED — evaluation design.** Construct a factorial workload over prefix length, number of independent associations, query distance, key similarity, revision count, distractor density, and required output length. Vary one factor at a time in diagnostic slices, then include interactions. A model may retain a single distinctive needle while failing many ordinary associations; those are different stress conditions.

Randomize key/value mappings after the model's training data have been fixed. Use disjoint mapping seeds across development and final evaluation. Keep the query unavailable until after the information-bearing prefix when testing the delayed-recall bound. If the query is known early, the model can preferentially preserve the requested item, changing the information problem.

Separate last-write-wins tasks from all-history retrieval. Repeated keys with revised values favor mechanisms that can overwrite; tasks requesting every historical version require preserving more information. A metric that does not specify which answer is correct can reward mutually incompatible memory behaviors.

Length extrapolation needs a training-length record. Evaluate both within and beyond the training distribution while controlling information density. A system can maintain loss at longer lengths by exploiting local predictability while failing remote retrieval. Report both outcomes rather than treating either as a complete measure of context use.

For performance, time prefill separately from decode. Fix generated token count in a controlled timing experiment or stratify by actual output length; otherwise an early-stopping model can appear faster by doing less work. Use the actual decoding policy for a separate end-to-end quality measurement. Record warm-up, compilation, synchronization, scheduling, and whether tokenization and transfers are inside the boundary.

A crossover is admissible only where both configurations meet the task-quality requirement. If the recurrent model is faster but falls below the required recall threshold, the performance intersection alone does not establish a useful replacement. Conversely, demanding worst-case exact copying may exclude a model that is appropriate for a summarization workload. The acceptance criterion belongs to the task specification.

~~~figure
id: fig-17.19
kind: diagram
title: "From correctness to a useful comparison"
caption: "Operator equivalence is checked before task quality, resource accounting, and execution timing. A joint acceptance decision uses all four records."
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.22"
alt: "Operator equivalence is checked before task quality, resource accounting, and execution timing. A joint acceptance decision uses all four records."
spec: {"direction":"LR","nodes":[{"id":"n0","kind":"tensor","label":"Operator correctness"},{"id":"n1","kind":"process","label":"Task cells and quality"},{"id":"n2","kind":"process","label":"Persistent-state ledger"},{"id":"n3","kind":"process","label":"Execution boundary and timing"},{"id":"n4","kind":"metric","label":"Quality-resource frontier"}],"edges":[{"from":"n0","to":"n1","kind":"flow"},{"from":"n1","to":"n2","kind":"flow"},{"from":"n2","to":"n3","kind":"flow"},{"from":"n3","to":"n4","kind":"flow"}]}
~~~

## Algorithm

~~~text
Algorithm 17.6 — Controlled sequence-model evaluation
INPUT model revisions, task generator, length grid, budgets, metric definitions
OUTPUT per-cell records, uncertainty estimates, quality-resource frontier
STATE immutable workload manifest and append-only result records
INVARIANT every comparison row refers to the same declared task cell
1. Freeze tokenizer, checkpoints, runtime revisions, seeds, and scoring rules.
2. Validate each operator against its own small reference and boundary replay.
3. Generate disjoint development and evaluation mappings with bounded lengths.
4. For each model, task cell, and seed:
5.   Evaluate quality with the declared prompt and decoding policy.
6.   Enumerate persistent state and measure peak allocation separately.
7.   Measure prefill and fixed-work decode inside the declared timing boundary.
8. Retain failures, out-of-memory events, and invalid outputs as explicit records.
9. Compute paired comparisons and uncertainty over the declared sampling units.
10. Report only crossovers within measured ranges and accepted quality regions.
~~~

**DERIVED.** Evaluation work scales with the declared number of models, task cells, seeds, and processed tokens; cap each dimension before execution. Cache immutable tokenized workloads, not model-dependent answers. Batching must preserve per-request resets. Reusing a previous request's recurrent state would contaminate both quality and memory accounting.

## Implementation

**DERIVED — implementation design.** PyTorch at the **Model / autograd framework** layer is the tensor-reference and allocation-inspection boundary. Hugging Face Transformers at the **Model definition / adaptation** layer supplies model interfaces whose actual state and decoding behavior must be inspected. Triton language at the **Kernels / numerics / collectives** layer may implement optimized operators; record the selected kernel and precision rather than merely noting that Triton is installed [R17.7].

Source documentation establishes interfaces, not measured throughput. Separate compiler specialization and warm-up from steady-state timing, while reporting cold-start cost when relevant. Synchronize the declared device work at timing boundaries. For serving experiments, include queueing and request arrival distributions as additional fields; a microbenchmark excludes them by design.

## Experimental design

**PROPOSAL.**

### Experiment 17.6 — Recall, generation, and cost versus length

- **Hypothesis:** Architecture rankings depend on information density, exactness requirements, and the resource constraint.
- **Setup:** Compare attention, selective SSM, normalized linear attention, gated delta, and hybrid families using explicit matched-budget panels.
- **Independent variables:** Prefix length, association count, query distance, revisions, copy length, concurrency, state precision.
- **Controlled variables:** Tokenization, held-out requests, decoding policy, training budget within each panel, hardware, evaluator.
- **Dataset/workload:** Fresh random associative recall, exact copying, controlled revision tasks, and separately documented held-out natural text.
- **Hardware:** Record devices, count, interconnect, memory, driver, runtime, compiler, and kernel revisions.
- **Metrics:** Exact match, token error, conditional loss, uncertainty, persistent bytes, peak/reserved memory, prefill and decode latency distributions.
- **Baselines:** Equal-parameter, equal-training-compute, and equal-state-budget panels reported separately.
- **Expected result:** No universal winner is assumed; failure boundaries and feasible operating regions are the intended findings.
- **Ablation:** Hold information count fixed while adding distractors, then increase information count at fixed length.
- **Interpretation:** Accept an architecture only within a declared quality/resource envelope.
- **Threats to validity:** Unequal training maturity, hidden state retention, data leakage, output-length mismatch, thermal drift, and selecting favorable lengths after inspection.

## Observations

**What the paper claims — PAPER-REPORTED.** Zoology motivates recall-focused diagnostics for efficient sequence models [R17.3].

**What the evidence shows — MATHEMATICALLY-DERIVED.** The chain rule and state ledger show why token-level quality, exact sequence success, and memory consumption are distinct quantities.

**What we infer — DERIVED.** A useful comparison reports task-specific feasible regions, rather than an unqualified architecture ranking.

**What remains unknown — UNVERIFIED.** All proposed model scores, latency curves, energy costs, and hardware crossovers remain unmeasured.

## Failure modes

> **Failure mode — Unequal generated work.** *Symptom:* A model appears faster while producing shorter or incomplete answers. *Cause:* Throughput aggregates runs with different output lengths. *Detection:* Inspect generated tokens and termination reasons per request. *Mitigation:* Use a fixed-work timing panel alongside natural stopping behavior.

**DERIVED.** A second failure is pseudoreplication: many correlated queries from one generated document are treated as independent samples. Bootstrap or aggregate at the document or mapping-seed level, and preserve pairing between models. Repeated timing trials do not replace independent training seeds when the claim concerns architecture quality.

~~~figure
id: fig-17.20
kind: stat-panel
title: "Evaluation boundary"
caption: "Declared mathematical and experimental boundaries; these are not measured model results."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.22"
alt: "Declared mathematical and experimental boundaries; these are not measured model results."
spec: {"header":"EVALUATION BOUNDARY","rows":[{"key":"Quality","value":"by task and length"},{"key":"State","value":"all persistent components"},{"key":"Timing","value":"prefill and decode separated"},{"key":"Crossover","value":"measured and quality-qualified"}]}
~~~

## Siblings

**DERIVED.** [Chapter 15](../ch15-position-long-context-and-effective-information-access/README.md) distinguishes nominal context from effective information access. This section changes the comparison axis to state representation and storage budget while retaining that distinction.

[§17.1](17-1-recurrent-state.md) provides a worst-case capacity argument; empirical evaluation estimates behavior on a specified distribution. Neither replaces the other. [§17.5](17-5-hybrid-composition.md) provides the state ledger for heterogeneous architectures, which must be completed before interpreting an apparent memory advantage.

## Extensions

**DERIVED.** For multimodal streams, report tokens per unit of media and evaluate both elapsed-time distance and token distance. For agents, add branch count, rollback frequency, and external retrieval traffic. For deployment economics, measure energy and resource time within the same quality-qualified workload; a smaller asymptotic state does not determine electricity use or monetary cost.

## Limitations

**DERIVED.** Synthetic diagnostics deliberately simplify semantics and may overemphasize exact memory. Natural corpora introduce uncontrolled redundancy and possible contamination. Both are needed, with their scope stated. A negative result on one diagnostic falsifies the corresponding capability claim; it does not establish universal inferiority.

## Reproducibility

The concrete record schema and acceptance gates are in [verification.md](verification.md). Archive per-request outputs, complete configurations, generator hashes, seeds, metric implementations, state ledgers, and measurement boundaries. **UNVERIFIED:** no benchmark outcomes are supplied. The chapter's analytical figures are labeled illustrations and contain no invented model scores.

## References

[R17.3](references.md#r173); [R17.7](references.md#r177). Equations 17.19–17.22 and the experimental design are the chapter's explicit mathematical and methodological analysis.

