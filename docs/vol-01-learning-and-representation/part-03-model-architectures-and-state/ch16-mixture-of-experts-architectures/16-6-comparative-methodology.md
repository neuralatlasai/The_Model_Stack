---
id: ms.section.16.6
entity_type: section
title: Comparative methodology
short_title: Comparative methodology
section: 16.6
slug: 16-6-comparative-methodology
parent: ms.chapter.16
prev_sibling: ms.section.16.5
next_sibling: null
children: []
prerequisites: [ms.chapter.13, ms.chapter.14, ms.section.16.5]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 16.6 — Comparative methodology

## Scope

Comparative methodology determines which MoE claim an experiment can support. This section covers equal active compute, equal total memory, dense baselines, batch-size effects, and long-tail routing. The required outcome is a joint quality and resource report containing expert-load histograms, token or assignment drops, communication bytes, and tail latency. No single parameter ratio or throughput measurement substitutes for that report.

## Why this exists

**DERIVED.** MoE and dense architectures distribute resources differently. A sparse model can have more stored parameters at similar selected-expert arithmetic, while a dense model can use its weights more uniformly within a small batch. Comparing them without a declared constraint makes the conclusion ambiguous.

Training and deployment introduce further differences. Equal inference arithmetic does not imply equal training compute, data exposure, tuning budget, or optimizer memory. A checkpoint that was expensive to train may be efficient to serve, but that is a different claim from equal-budget training superiority.

The dominant constraint is comparability. The experiment must identify what is held equal, what is allowed to vary, and which costs fall outside the boundary. Otherwise a quality improvement may come from more training data, and a speed improvement may come from dropping work or excluding difficult requests.

## Intuition

**DERIVED.** There are several legitimate baselines. An active-compute-matched dense layer asks how extra selectively used parameters change quality at similar leading arithmetic. A total-memory-matched dense layer asks what sparsity achieves with a similar stored parameter budget. A latency-matched system asks which configuration delivers better quality within the same measured service target.

These comparisons cannot generally be satisfied by one dense model. Present multiple baselines when the question spans multiple constraints. Explicitly state which quantities differ in each row instead of describing all rows as “fair.”

> **Definition — MoE comparison boundary.** The set of matched resources, controlled training and evaluation conditions, and included execution costs under which an MoE-versus-baseline conclusion is interpreted.

## Formulation

**MATHEMATICALLY-DERIVED.** Consider equal-width ungated experts with hidden width \(h\), top-k routed activation, and \(s\) always-active shared experts of the same width. Ignoring routing and non-FFN costs, dense hidden widths matching selected-expert arithmetic and total expert parameters are respectively

$$
h_{\mathrm{dense,active}}=(k+s)h,\qquad
h_{\mathrm{dense,total}}=(E+s)h.
$$
*(Eq. 16.17)*

These are leading-term layer matches, not full-model equality. Router cost, dense attention, different activations, padding, and communication must be restored in an end-to-end comparison.

For a mathematical occupancy reference only, suppose tokens independently select uniformly distributed subsets of \(k\) distinct experts from \(E\). For a fixed expert \(e\), \(p=k/E\), so

$$
\mathbb E[n_e]=Mp,\qquad
\operatorname{Var}(n_e)=Mp(1-p),\qquad
\mathbb E[U]=E\left[1-(1-k/E)^M\right].
$$
*(Eq. 16.18)*

The union expectation follows because a given expert is untouched with probability \((1-k/E)^M\), then by summing touch indicators. This is an explicit synthetic reference distribution, **not an assumption about learned routing**. Correlated tokens and nonuniform preferences change these quantities.

Let measured request latency have cumulative distribution \(F_L\). Define a quantile and a joint acceptance rule:

$$
q_\tau=\inf\{\ell:F_L(\ell)\ge\tau\},\qquad
Q\ge Q_{\min},\quad
r_{\mathrm{drop}}\le r_{\max},\quad
q_\tau\le L_{\max},\quad
M_{\mathrm{peak}}\le M_{\max}.
$$
*(Eq. 16.19)*

Here \(Q\) is the predeclared quality metric and the remaining quantities use fixed workload and counting boundaries. Communication bytes remain a reported metric even when no hard byte limit is imposed. Thresholds are experimental choices to declare before seeing outcomes.


~~~figure
id: fig-16.18
kind: calculator
title: "Batch expert union under a synthetic null model"
caption: "Illustrative independent uniform top-two selection among 64 experts. Expected touched experts is a mathematical reference, not measured learned-router behavior."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.18"
alt: "Illustrative independent uniform top-two selection among 64 experts. Expected touched experts is a mathematical reference, not measured learned-router behavior."
spec: {"tex":"\\mathbb E[U]=64[1-(1-2/64)^M]","equation":"16.18","inputs":[{"symbol":"M","label":"tokens in routing batch","default":32,"min":1,"max":1024,"format":"integer"}],"outputs":[{"symbol":"union","label":"expected touched experts","formula":"64*(1-(1-2/64)^M)","format":"fixed2"},{"symbol":"mean","label":"mean assignments per expert","formula":"M*2/64","format":"fixed2"}]}
states: [{"anchor":"formulation","label":"Moderate batch","variables":{"M":32},"note":"Per-token sparsity coexists with a larger batch-wide expert union."},{"anchor":"mechanism","label":"Single token","variables":{"M":1},"note":"Exactly two experts are touched under the stated reference."},{"anchor":"failure-modes","label":"Large reference batch","variables":{"M":1024},"note":"Near-complete union does not describe real routing without checking its distribution."}]
~~~


## Mechanism

**DERIVED.** Begin with the scientific question. If the question is parameter efficiency, hold training exposure and selected arithmetic as closely as possible and disclose remaining differences. If it is deployment efficiency, freeze quality requirements and compare measured resource frontiers. If it is training efficiency, include optimizer state, communication, failed runs, and search expenditure.

A dense baseline must have a documented architecture, not merely a target parameter count. Match tokenization, context distribution, data eligibility, objective, and evaluation prompts. Changes to normalization, attention, or activation function can confound an expert-routing comparison. Where exact matching is impossible, state the mismatch and include an ablation when feasible.

Batch size changes the executed problem. With more tokens, experts can accumulate larger matrix batches and more weight reuse. At small decoding concurrency, each expert may receive only a few rows; the union of touched experts can still be large relative to useful arithmetic. Report the token count entering each routed layer, not only the number of user requests.

Equation 16.18 gives a diagnostic null model. Compare real histograms against it cautiously. A deviation can reflect specialization, correlated documents, skewed domains, or a routing defect. It is not automatically evidence of collapse. The null model helps explain why even uniform independent routing produces variation in finite batches.


~~~figure
id: fig-16.19
kind: diagram
title: "Joint comparison preserves configuration identity"
caption: "One immutable configuration supplies both quality and resource outcomes; the acceptance rule evaluates their joint constraints."
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.19"
alt: "One immutable configuration supplies both quality and resource outcomes; the acceptance rule evaluates their joint constraints."
spec: {"direction":"LR","nodes":[{"id":"question","kind":"objective","label":"Declared comparison boundary"},{"id":"config","kind":"model","label":"Frozen candidate and baseline"},{"id":"quality","kind":"metric","label":"Held-out task quality"},{"id":"load","kind":"metric","label":"Loads drops and communication"},{"id":"latency","kind":"metric","label":"Memory and tail latency"},{"id":"accept","kind":"boundary","label":"Joint acceptance criteria"}],"edges":[{"from":"question","to":"config","kind":"flow"},{"from":"config","to":"quality","kind":"flow"},{"from":"config","to":"load","kind":"flow"},{"from":"config","to":"latency","kind":"flow"},{"from":"quality","to":"accept","kind":"flow"},{"from":"load","to":"accept","kind":"flow"},{"from":"latency","to":"accept","kind":"flow"}]}
~~~


Long-tail routing requires temporal and conditional analysis. Aggregate histograms can hide hot-expert bursts, domain-specific concentration, and persistent underexposure of rare experts. Retain per-step or per-window statistics with a bounded logging policy, then stratify by domain, sequence length, and request type.

Report both expert and rank distributions. The same expert histogram can map to different rank loads under different placements. Communication bytes should distinguish logical payload from physical measurements and state whether local transfers, backward traffic, and metadata are included.

Drop reporting needs the definitions from 16.4. At minimum, give assignment-drop rate, fraction of tokens losing any branch, fraction losing all routed branches, and dropped coefficient mass when applicable. A single average can hide concentrated harm to one domain or late-arriving tokens.

Latency requires a complete attempt policy. Define admission, batching, warm-up, cache state, timeouts, retries, and the measurement interval. A percentile among successful requests alone can improve when slow requests fail. Report completion and rejection rates alongside latency, and preserve the distinction between per-token service time and end-to-end request time.

Uncertainty belongs to each relevant axis. Task scores need independent evaluation units; latency estimates need enough requests and a workload sampling design; rare overload events need a sufficiently long observation horizon. Repeated timing of one warm synthetic batch does not establish production tail behavior.

## Algorithm

**DERIVED — predeclared comparison study.**

~~~text
Algorithm 16.6 — Compare MoE under explicit resource boundaries
INPUT: scientific question, candidate architectures, dense baselines,
       training/evaluation budgets, workload strata, acceptance thresholds
OUTPUT: joint quality-resource report with uncertainty and limitations
STATE: immutable configuration records and complete attempt ledgers
INVARIANT: every reported comparison identifies matched and unmatched quantities
1. Declare the comparison boundary and choose corresponding dense baselines.
2. Validate parameter, routing, assignment, and communication accounting.
3. Freeze data eligibility, training budget, and candidate-selection protocol.
4. Evaluate quality on held-out tasks and domains.
5. Replay declared batch-size and routing-tail workload strata.
6. Collect expert/rank histograms, drops, bytes, memory, and latency together.
7. Include failed, rejected, and retried attempts under the declared policy.
8. Estimate uncertainty at the correct sampling unit.
9. Report feasible configurations and trade-offs without collapsing them to one rank.
~~~

Streaming histogram updates cost \(O(A+E)\) per logged routing scope. Exact retention of every assignment scales with total routed work, so long runs need a declared bounded retention or sampling policy. Approximate quantile sketches require their own error contract; they are not silently interchangeable with exact offline quantiles.

## Implementation

**DERIVED.** PyTorch, **Model / autograd framework**, defines numerical and instrumentation boundaries. NVIDIA Megatron-Core, **Distributed training**, supplies an inspectable MoE execution configuration [R16.4]. Hugging Face Transformers, **Model definition / adaptation**, supplies checkpoint-specific configuration and tokenizer provenance [R16.5]. Record actual versions rather than assuming documentation describes the installed stack.

Separate warm-up from measurement while reporting what warm-up establishes. Kernel compilation, allocator growth, and communication setup may affect cold behavior. If the product includes cold starts, measure them as a separate workload stratum rather than removing them from all results.

Instrumentation can perturb the workload. Per-token logging, synchronous device reads, and global histogram reductions may add overhead. Compare an appropriately instrumented validation run with the performance measurement path, and document which diagnostics are sampled. Do not claim nanosecond accuracy from a timer resolution alone.

Quality scoring and systems instrumentation should consume the same configuration identifier. A common reporting error combines a quality score from one capacity policy with throughput from another. Immutable records prevent this mismatch.

## Experimental design

**PROPOSAL — the chapter specifies a study, not a completed model ranking.**

### Experiment 16.6 — Joint MoE quality and resource frontier

- **Hypothesis:** MoE trade-offs depend on the matched resource boundary, batch size, and routing-tail workload.
- **Setup:** Compare predeclared MoE candidates with separate active-compute and total-memory dense baselines.
- **Independent variables:** Expert count, top-k, capacity policy, placement, batch size, and workload stratum.
- **Controlled variables:** Data eligibility, training budget within each comparison, tokenizer, objective, and evaluator.
- **Dataset/workload:** Held-out mixed-domain tasks, homogeneous-domain bursts, rare-domain inputs, and prefill/decode strata.
- **Hardware:** Record model precision, devices, topology, runtime versions, input/output distributions, concurrency, and timing boundary.
- **Metrics:** Quality, expert/rank load histograms, assignment/token drops, dropped mass, communication bytes, memory, throughput, and tail latency.
- **Baselines:** Dense active-compute match, dense total-parameter match, and no-drop MoE reference where feasible.
- **Expected result:** Conclusions are conditional on the declared boundary; no universal MoE advantage is predicted.
- **Ablation:** Change one of routing, capacity, placement, or expert count while retaining the other contracts.
- **Interpretation:** A candidate is acceptable only under its jointly measured quality and resource conditions.
- **Threats to validity:** Unequal tuning budgets, omitted failures, hidden work dropping, changing data mixtures, and insufficient tail samples.

## Observations

**What the paper claims — PAPER-REPORTED.** Switch Transformers and DeepSeek-V3 present sparse-model results under their own architecture and training regimes [P10, P13].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Active-compute and total-parameter matching imply different dense widths; finite-batch occupancy has its own distribution.

**What we infer — DERIVED.** A defensible comparison needs multiple baselines and joint outcome reporting.

**What remains unknown — UNVERIFIED.** Every proposed quality-resource frontier and long-tail latency result remains unmeasured.

## Failure modes

**DERIVED.** Failures include mixing configuration identities, omitting router cost, averaging away overload bursts, and declaring a speedup from a path that drops more assignments.


~~~figure
id: fig-16.20
kind: stat-panel
title: "Required MoE comparison record"
caption: "Check these independent boundaries before interpreting an MoE quality or resource claim."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.19"
alt: "Check these independent boundaries before interpreting an MoE quality or resource claim."
spec: {"header":"Required distinctions","rows":[{"key":"Quality","value":"Held-out score and uncertainty"},{"key":"Routing","value":"Loads drops and dropped mass"},{"key":"Movement","value":"Declared communication byte boundary"},{"key":"Service","value":"Memory completion and tail latency"}]}
~~~


Another failure is tuning all MoE candidates extensively while giving the dense baseline a single configuration. Search compute and evaluation reuse belong in the comparison boundary. Report them even when the final deployment only uses one selected model.

## Siblings

**DERIVED.** Parameter efficiency, training efficiency, inference latency, throughput, and memory efficiency are different claims. Pareto comparisons preserve their trade-offs; a scalar score requires an explicit utility function and can hide unacceptable failures.

## Extensions

**DERIVED.** Adaptation studies should include rare-expert retention and domain shift. Heterogeneous hardware needs placement-specific baselines. Multimodal models require modality-conditioned histograms and quality metrics because token counts alone may not represent comparable work.

## Limitations

**DERIVED.** The occupancy reference deliberately assumes independent uniform selection and should not be used to predict learned-router tails. Leading-term matching omits systems overhead. A measured frontier transfers only to the recorded workload and software/hardware boundary.

## Reproducibility

Publish architecture inventories, matched-budget definitions, data splits, training/search ledgers, routing traces or bounded summaries, capacity settings, placements, raw attempt outcomes, and uncertainty procedures. Preserve all rejected configurations and unresolved measurements.

## References

[P10](references.md#p10); [P13](references.md#p13); [R16.4](references.md#r164); [R16.5](references.md#r165); [verification protocol](verification.md).

