---
id: ms.section.43.6
entity_type: section
title: Selection methodology
volume: 2
part: 8
chapter: 43
section: 43.6
slug: 43-6-selection-methodology
parent: ms.chapter.43
prev_sibling: ms.section.43.5
next_sibling: ms.verification.43
children: []
prerequisites: [ms.chapter.6, ms.chapter.28, ms.chapter.29, ms.chapter.37, ms.chapter.40, ms.chapter.42, ms.section.43.1, ms.section.43.2, ms.section.43.3, ms.section.43.4, ms.section.43.5]
downstream: [ms.chapter.44, ms.chapter.45, ms.chapter.46, ms.chapter.47, ms.chapter.48]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [runtime_selection, differential_validation], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.sglang, impl.tensorrt-llm, impl.onnx-runtime, impl.openvino, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 43.6 — Selection methodology

## Scope

[DERIVED] Engine selection is constrained inference over executable deployment tuples. The objective is acceptable model behavior and service performance at manageable operating/migration cost. The baseline fixes source weights, template, decoding, hardware and workload. Different numerical artifacts form a separate frontier. A feature table can filter candidates; it cannot rank measured latency or reliability.

## Why this exists

[DERIVED] Serving projects expose overlapping features while executing different code paths. Identical public API arguments can resolve to different templates, penalties, kernels, accumulation and cache modes. A faster result can therefore come from less work, a changed task, an altered numerical method or better execution. Those explanations have different engineering consequences.

[PAPER-REPORTED] A 2026 backend study finds both systematic default differences and residual numerical divergence after standardization [R43.29, §§4–6]. This motivates investigation before speed ranking, rather than assuming that equal weight names and seeds establish equivalence.

## Intuition

[DERIVED] Selection should proceed through nested gates: capability, semantic/numerical acceptance, task acceptance, performance and operations. The gates are related but not interchangeable. A wrong template is a semantic failure; a changed reduction order is a numerical difference; a different valid answer is not necessarily a task failure. The method must retain evidence sufficient to distinguish them.

## Formulation

> **Definition — Engine selection tuple.** [DERIVED] An immutable description of model artifacts, preprocessing, decoding, engine revision, kernels, resource settings, hardware topology and measurement boundary used as one candidate in a controlled comparison.

| Local symbol | Meaning |
|---|---|
| $e\in\mathcal E$ | Candidate executable tuple |
| $S_e$ | Indicator of required model/dtype/hardware/operator support |
| $Q_e,G_e,L_e,C_e$ | Task quality, SLO goodput, p95 latency and recurring cost |
| $\varepsilon_Q,L_{\max},G_{\min}$ | Declared quality tolerance and service requirements |
| $z,\widehat z$, $\delta_\infty$ | Reference/deployed logits and maximum absolute logit error |
| $d_i$, $n$ | Paired task difference and number of evaluation units |
| $K_{\rm mig},\Delta C,H$ | Migration cost, recurring savings per period and horizon |

[DERIVED] Candidate feasibility is

$$
\mathcal E_{\rm feasible}=
\{e:S_e=1,\ Q_e-Q_{\rm ref}\ge-\varepsilon_Q,\
L_e\le L_{\max},\ G_e\ge G_{\min},
\ \text{required operational contracts pass}\}.
$$
*(Eq. 43.19)*

Estimates and their uncertainty replace unknown population quantities in practice. Missing evidence does not become a passing value. Multiple feasible candidates may remain incomparable because cost, latency and operational burden trade off.

[MATHEMATICALLY-DERIVED] For a fixed prefix, if $\|\widehat z-z\|_\infty\le\delta_\infty$ and the reference top-two margin exceeds $2\delta_\infty$, greedy argmax is preserved. Each contender's gap can shrink by at most $2\delta_\infty$. This is a single-step sufficient condition; it says nothing about all future prefixes unless corresponding bounds hold there. Chapter 40 provides the related numerical evaluation framework.

## Mechanism

### Methodology

[DERIVED] Begin with a capability contract: exact architecture/version, context and modality, adapters, weight/cache dtypes, constraints, speculative mode and target devices. Resolve support for each required operator/configuration. Separate documented support from executed checks. An engine that loads the model but silently falls back to an unsupported performance path has not established the required resource behavior.

[DERIVED] Next compare actual token IDs, positions, masks and decoder settings before comparing logits. External template application reduces one difference but does not prove that an API adds no BOS token or penalty. Hash the resulting tokens and retain resolved sampler parameters. Different precision names can hide different accumulation. Cache dtype, quantized scales and actual linear/attention/MoE kernels must appear in the candidate tuple.

[DERIVED] Teacher-forced testing keeps every candidate on identical prefixes. It can compare operator outputs, logits, conditional probabilities and constraint masks without the confound of diverged generations. Report absolute/relative errors, denominators, finite-value checks and tolerance by dtype/operator. For sampled decoding, compare declared conditional distributions or acceptance criteria; identical seed values do not guarantee identical random-number algorithms or draw assignment.

[DERIVED] Free-running evaluation answers a different question: whether the deployed system completes tasks acceptably. Once a token differs, later logits are conditioned on different histories. Comparing those logits as if they were a numerical operator test is invalid. Token equality, answer equality, task score and completion behavior should be separate records. A long reasoning trace can diverge yet reach the same answer; exact text equality can conceal a shared evaluator error.

[MATHEMATICALLY-DERIVED] For i.i.d. finite-variance task units with paired score differences $d_i$, the usual estimates are

$$
\widehat\Delta=\frac1n\sum_{i=1}^n d_i,\qquad
\widehat{\operatorname{SE}}(\widehat\Delta)
=\sqrt{\frac{\sum_i(d_i-\widehat\Delta)^2}{n(n-1)}}.
$$
*(Eq. 43.20)*

The variance estimate is unbiased for the mean's variance under those conditions. Approximate confidence intervals require their own large-sample or distributional justification. Repeated generations of one problem are clustered observations, not independent task units. Stratified fixed designs need design-aware weighted estimates. Comparing many candidates or selecting settings on the final evaluation set introduces selection effects.

[DERIVED] Performance comparison then fixes an arrival/workload trace, request distribution, numerical artifacts and observation boundary. Record offered versus admitted load, completed/failing/cancelled requests, prompt/output lengths, prefix sharing, warm-cache policy and compilation state. Open-loop arrivals expose overload differently from a closed-loop client that waits for responses before issuing more work; results cannot be combined without stating that distinction.

[DERIVED] Use the [shared latency definitions](../../../front-matter/notation.md#2-8-latency-chapter-48-mathematically-derived-definitions). Specify whether request start precedes network transmission or occurs inside the server, and whether delivery timestamps are client-visible. A streamed chunk can contain several model tokens. Token ITL is not identifiable from chunk arrival alone unless the transport exposes the necessary token timing. TPOT is an average, not p95 token delay. A complete response's E2E tail and the distribution of per-token ITL are different estimands.

[MATHEMATICALLY-DERIVED] For continuous i.i.d. request latencies, let $q_p$ be the population quantile, $X_{(a)}$ sorted observations, and $K=\sum_i\mathbf1[X_i<q_p]\sim\operatorname{Binomial}(n,p)$. Then

$$
\Pr[X_{(a)}\le q_p\le X_{(b)}]
=\Pr[a\le K\le b-1].
$$
*(Eq. 43.21)*

Choose order-statistic indices for the desired coverage, with endpoint conventions when needed. This exposes why a small sample gives weak tail evidence. Real serving traces are commonly dependent and nonstationary, so this exact i.i.d. interval cannot be applied automatically; independent workload windows, block methods or an explicit arrival/process model are needed.

[DERIVED] Goodput counts requests meeting the declared SLO over the declared window. Task-quality acceptance should be reported alongside it; if defining an additional quality-qualified rate, name its denominator explicitly. A high tokens/s result can coexist with low goodput when long requests miss deadlines. Failures and rejected work remain in offered-load accounting rather than disappearing from a success-only sample.

[DERIVED] Operational complexity is observable work: build/release integration, model onboarding, configuration surface, monitoring, failure localization, cancellation cleanup, rollout and rollback. Counting feature boxes is a weak proxy. A version-pinned artifact should record which team-owned adapters or patches are necessary and what happens when a worker fails midstream. Repeated local retries can increase load and duplicate model work even if a final response succeeds.

[MATHEMATICALLY-DERIVED] Under constant recurring savings $\Delta C>0$ per period and one-time migration cost $K_{\rm mig}$, cost-only break-even is

$$
H\Delta C>K_{\rm mig}.
$$
*(Eq. 43.22)*

Discounting, changing demand and rollback probability require a richer model. A migration also has a quality/service feasibility constraint; favorable arithmetic cannot compensate for a violated contract. The cost ledger includes conversion, validation, parallel operation and maintenance, not just accelerator price.

[DERIVED] The candidate frontier should retain uncertainty and unresolved differences. If two engines' p95 estimates overlap substantially, a total ordering is unsupported. If one requires a changed artifact to fit, report a joint artifact/runtime comparison separately. If one uses warm shared state and another is cold, report that as a treatment, not a hidden advantage.

```figure
id: fig-43.18
kind: diagram
title: Correctness gates precede performance comparison
caption: Common-prefix numerical checks and free-running task checks answer different questions. Both feed the feasible deployment set.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.19
alt: Supported candidate tuples pass input identity checks, split into numerical and task evaluation, then enter service and migration evaluation.
spec:
  direction: LR
  nodes:
    - {id: candidate, kind: process, label: resolved executable tuple}
    - {id: support, kind: process, label: capability gate}
    - {id: input, kind: tensor, label: exact input and decoding}
    - {id: numeric, kind: metric, label: teacher-forced numerical behavior}
    - {id: task, kind: metric, label: free-running task behavior}
    - {id: service, kind: metric, label: client latency and goodput}
    - {id: ops, kind: process, label: operations and migration}
    - {id: feasible, kind: state, label: feasible frontier}
  edges:
    - {from: candidate, to: support}
    - {from: support, to: input}
    - {from: input, to: numeric}
    - {from: input, to: task}
    - {from: numeric, to: service}
    - {from: task, to: service}
    - {from: service, to: ops}
    - {from: ops, to: feasible}
```

## Algorithm

### Algorithm 43.6 — Bounded engine comparison

[DERIVED] Inputs are a finite candidate set, immutable workload, acceptance contract and finite evaluation budgets. Outputs are rejected/feasible/undetermined tuples with evidence, not a compulsory winner.

$$
\begin{aligned}
1.\;&\text{freeze requirements, workloads, metrics and independent acceptance set}.\\
2.\;&\text{for }e\in\mathcal E:\ \operatorname{ResolveAndRecord}(e);
\quad S_e=0\Rightarrow\operatorname{RejectUnsupported}.\\
3.\;&\operatorname{CompareInputAndDecodingIdentity}(e);
\quad\text{difference}\Rightarrow\operatorname{LocalizeAndRepairOrReject}.\\
4.\;&\operatorname{TeacherForce}(e);\quad
\text{unexplained criterion failure}\Rightarrow\operatorname{Undetermined}.\\
5.\;&\operatorname{EvaluateTasks}(e);
\quad\text{quality criterion fails}\Rightarrow\operatorname{Reject}.\\
6.\;&\operatorname{MeasureMatchedServiceWorkloads}(e);
\quad\operatorname{CountAllTerminalOutcomes}.\\
7.\;&\operatorname{EvaluateOperationsMigrationAndUncertainty}(e);
\quad\operatorname{ReturnFrontier}(\mathcal E_{\rm feasible}).
\end{aligned}
$$

[DERIVED] Invariants are unchanged declared inputs/artifacts within an experiment, independent acceptance data and complete failure accounting. Finite candidates, requests and token caps bound model work; timeout budgets bound failed execution. Cost scales with candidate count times evaluated token work, plus compilation, task scoring, service replays and operational exercises. A feature survey alone does not execute this algorithm.

## Implementation

[DERIVED] vLLM, SGLang, TensorRT-LLM and MLC-LLM are **Inference engine**; ONNX Runtime/OpenVINO **Serving / portable runtime**; Hugging Face Transformers **Model definition / adaptation**. MLC-LLM is outside the reference stack and is routed through the plan's portable-runtime coverage. The common harness must observe actual preprocessing, dispatch and stream boundaries rather than silently substituting defaults.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Pape, Evertz and Schönherr compare five engines with a Transformers reference on five models and four task families. Their fixed setup uses FP16/GGUF-FP16, external templates, greedy batch-one decoding, twelve seeds and a single H100; standard/reasoning output caps are 2,048/32,768. Appendix A specifies Transformers 4.57.0, vLLM 0.10.2, SGLang 0.5.2, LMDeploy 0.10.1, llama_cpp_python 0.3.16 and Ollama 0.13.5 [R43.29, §§4.1–4.2; Appendix A]. These historical versions differ from this chapter's inspected current source pins.

[PAPER-REPORTED] The study includes task accuracy, disagreement, length differences and common-prefix logprob analysis, then ablates defaults, batching and selected optimizations [R43.29, §§5–6; Appendices B–D]. Its paper is CC BY 4.0; the following analysis is attributed synthesis, not independent replication.

## Observations

**What the paper claims.** [PAPER-REPORTED] Backend choice changes reported behavior, with both correctable defaults and numerical effects [R43.29].

**What the evidence shows.** [PAPER-REPORTED] Table 1's DeepSeek-R1-distill GSM8K spread is 16.60 percentage points; §6 attributes large outliers partly to injected BOS tokens and a default repetition penalty. Disabling Ollama's penalty reports an 11.67-point improvement on that model. Smaller changes persist under optimization toggles.

**What we infer.** [DERIVED] The largest raw spread cannot be attributed purely to kernel arithmetic because the ablations identify semantic defaults. Nominal FP16 also does not fix accumulation. The study supports engine-aware validation, but not a current speed or quality ranking. Greedy seed repeats probe execution variation, not training uncertainty.

**What remains unknown.** [UNVERIFIED] Current releases, larger concurrency, other hardware and long-running service reliability are not established by these results. Common-prefix logprob errors before divergence are not full teacher-forced coverage of all later prefixes.

## Failure modes

> **Failure mode — Ranking before resolving output differences.** [DERIVED] *Symptom:* a fast engine produces shorter or systematically different answers. *Cause:* changed preprocessing, stopping, penalties or numerics. *Detection:* exact token/parameter comparison followed by common-prefix probes. *Mitigation:* resolve the cause and repeat the affected evaluation.

[DERIVED] Other failures are successful-response selection, pooled latency quantiles across different workloads, treating equal seeds as common random draws and ignoring cold compilation or cache state.

## Siblings

[DERIVED] Feature-based filtering answers support; numerical parity answers operator behavior; task evaluation answers utility; service replay answers workload-specific performance. These are complementary estimands. [Engine-specific sections](43-2-vllm.md) supply candidate contracts, not substitutes for controlled comparison.

## Extensions

### Improvements

[DERIVED] The 2026 backend study extends earlier feature/performance comparisons by localizing semantic defaults and numerical divergence. A stronger method then separates numerical, task and service estimands and records actual paths. This is a methodological synthesis; no source is claimed to have executed the complete book protocol.

## Limitations

[DERIVED] Finite acceptance workloads cannot certify every input distribution. A genuine open question is how local numerical discrepancy predicts long-trajectory task changes, especially near repeated token ties. Settling it requires common-prefix measurements, controlled perturbations and independent task outcomes across lengths, rather than assuming that one norm or early mismatch predicts quality.

## Reproducibility

[UNVERIFIED] No comparison was executed for this edition. Preserve source/container pins, artifact hashes, exact input IDs, resolved decoding, dispatch traces, cache/graph states, arrival/client traces, failures and paired task records. Proposed thresholds and protocols are confined to [verification](verification.md).

```figure
id: fig-43.19
kind: calculator
title: Migration break-even
caption: A constant-cost arithmetic model; quality and service feasibility remain separate gates.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.22
alt: Migration cost and recurring savings determine the modeled break-even horizon.
states:
  - {anchor: formulation, label: Declared model, note: Inputs are hypothetical analysis values.}
  - {anchor: mechanism, label: Inspect dependencies, note: Actual costs require measurement at the stated boundary.}
  - {anchor: failure-modes, label: Check the omitted cost, note: A favorable calculation cannot certify a deployment.}
spec:
  tex: "K/Delta C"
  equation: "43.22"
  inputs:
    - {symbol: migration, label: one-time migration cost, min: 1000, max: 100000, default: 20000, format: fixed2}
    - {symbol: saving, label: savings per period, min: 100, max: 10000, default: 2000, format: fixed2}
  outputs:
    - {symbol: horizon, label: break-even periods, formula: "migration/saving", format: fixed2}
```

```figure
id: fig-43.20
kind: stat-panel
title: Equal seeds do not establish parity
caption: Random-number implementation, draw assignment, reductions and sampler defaults remain part of the execution contract.
placement: rail
anchor: mechanism
evidence: PAPER-REPORTED
source: R43.29
alt: A stat card separates fixed seed from verified numerical and task equivalence.
spec:
  header: EXECUTION CONTRACT
  rows:
    - {key: reproducibility contract, value: conditional}
    - {key: boundary, value: inspect inputs and conditional law}
```

## References

[R43.29](references.md#r43-29); source-reported engine interfaces are recorded in [references](references.md). Shared definitions: [notation](../../../front-matter/notation.md).
