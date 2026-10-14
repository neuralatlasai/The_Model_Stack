---
id: ms.section.40.6
entity_type: section
title: Evaluation
volume: 2
part: 7
chapter: 40
section: 40.6
slug: 40-6-evaluation
parent: ms.chapter.40
prev_sibling: ms.section.40.5
next_sibling: ms.verification.40
children: []
prerequisites: [ms.chapter.6, ms.chapter.25, ms.section.40.5]
downstream: [ms.chapter.42, ms.chapter.48, ms.chapter.61, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [evaluation, inference, serving], mechanism: [quantization_evaluation, resource_accounting], feedback_setting: [], modality: [text]}
papers: [P33]
implementations: [impl.vllm, impl.llama-cpp, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 40.6 — Evaluation

## Scope

[DERIVED] Quantization evaluation has four axes: decoded/operator numerical error, task behavior across workload strata, complete live memory and client-relevant execution cost. The baseline is the same source model in BF16 with identical tokenization and prompts. Historical sources using FP16 retain that baseline explicitly. Success is a supported quality/resource frontier, not a smaller file or one faster matrix multiply.

## Why this exists

[DERIVED] Teacher-forced perplexity keeps prefixes fixed. Generated outputs change prefixes after the first altered token. Long contexts change cache size and attention patterns; long responses repeat exposure to a perturbed policy. Runtime batching changes arithmetic intensity. A quantizer that passes a short likelihood test can still fail on task termination or a different deployment phase. Conversely, a changed generated response can be equally correct. Numerical identity and application utility must be evaluated separately.

[PAPER-REPORTED] The 2026 Ascend case study distinguishes fake-quantized accuracy evaluation from a partial real INT8 deployment [R40.21, §3.2, §4]. That distinction prevents a simulated quality result from being mistaken for executable acceleration.

## Intuition

[DERIVED] Quantization error matters through the next decision boundary and through the runtime bottleneck. A small logit perturbation near a tie can change greedy decoding; a larger perturbation far from a tie can leave it unchanged. Smaller weights matter only to the fraction of execution actually dominated by their transfer or arithmetic. Evaluation therefore needs conditional quantities: error relative to decision margin and speed relative to the measured phase decomposition.

## Formulation

| Local symbol | Meaning |
|---|---|
| $z,\widehat z$ | Reference and quantized logits at an identical prefix |
| $\delta_\infty$ | Maximum absolute logit error |
| $P,Q$ | Reference and quantized sequence distributions |
| $n_o$ | Fixed output-token horizon, including an explicit EOS convention |
| $f_w,r_w$ | Baseline time fraction changed by a weight optimization and its acceleration |
| $t_{\rm add}$ | Added overhead normalized by baseline time |
| $d_i^{\rm task}$ | Paired task outcome difference for example $i$ |

[MATHEMATICALLY-DERIVED] If reference winning logit margin is $m=z_{(1)}-z_{(2)}$,

$$
\|\widehat z-z\|_\infty\le\delta_\infty,\quad m>2\delta_\infty
\quad\Rightarrow\quad \arg\max_v\widehat z_v=\arg\max_vz_v .
$$
*(Eq. 40.22)*

where subtracting the worst winner perturbation and adding the worst competitor perturbation leaves a positive margin. The converse is false: a small margin does not prove a token flip. Shared additive logit shifts leave probabilities unchanged, so raw logit MSE alone can overstate a harmless difference.

[MATHEMATICALLY-DERIVED] For compatible support and fixed horizon, the probability chain rule gives

$$
\operatorname{KL}(P\|Q)
=\sum_{t=1}^{n_o}\mathbb E_{x_{<t}\sim P}
\operatorname{KL}\!\left(P(\cdot|x_{<t})\|Q(\cdot|x_{<t})\right).
$$
*(Eq. 40.23)*

where the expectation uses reference-distributed prefixes. Expanding the log sequence-likelihood ratio into a sum and applying conditional expectation proves equality. Measuring KL only on a convenient fixed corpus does not estimate this sequence KL unless its prefix population matches the required expectation. Free-running evaluation remains necessary.

## Mechanism

### Methodology

[DERIVED] Numerical evaluation should separate decoded-weight error, layer-output error, attention-output error and conditional output-law error on identical inputs. Report norm denominators and zero-handling. A relative error can diverge when the reference is near zero while absolute error is benign. Compare both common-prefix teacher forcing and independent free-running generation. For sampled generation, paired random seeds reduce some noise but do not create identical trajectories after distributions diverge.

[DERIVED] Task evaluation stratifies by domain, language, prompt length, output length and required tool/format constraints. Perplexity uses a declared token reduction and context-window policy. Accuracy requires exact answer extraction and evaluator versions. Code correctness requires execution limits and tests. Termination failures are counted rather than hidden by truncation. These choices determine whether a quantized model delivers accepted tasks, not merely plausible tokens.

[DERIVED] Calibration, precision search and recovery-checkpoint selection consume information from their datasets. An evaluation benchmark used to choose among checkpoints becomes a selection set; reporting the winner on the same set is optimistically biased. A final untouched set or explicitly corrected selection analysis is necessary for independent acceptance. Multiple generation samples on the same problem estimate sampling variability, not independent model-training replications.

[MATHEMATICALLY-DERIVED] For paired outcomes,

$$
\widehat\Delta=\frac1{n_e}\sum_{i=1}^{n_e}d_i^{\rm task},\qquad
\operatorname{SE}(\widehat\Delta)=
\sqrt{\frac{\sum_i(d_i^{\rm task}-\widehat\Delta)^2}{n_e(n_e-1)}} .
$$
*(Eq. 40.24)*

where $n_e>1$ i.i.d. evaluation units with finite variance are assumed within the declared population or stratum. Fixed stratified designs require a weighted, design-aware variance estimate. Problems with several samples should be clustered by problem when estimating task-population uncertainty. Dependence across near-duplicate prompts invalidates the independent-unit interpretation.

[DERIVED] Memory evaluation counts packed codes, scales, zero points, indices, padding, unquantized parameters, cache, runtime workspace and allocator reservation. Record loading peak separately from steady state. For mixed precision, sum actual tensor bytes; an average bit count over eligible matrices omits embeddings and other exclusions. A cache-saving estimate from payload bits excludes pages and recent residuals.

[MATHEMATICALLY-DERIVED] The deployment time decomposition obeys

$$
\operatorname{Speedup}
=\frac1{(1-f_w)+f_w/r_w+t_{\rm add}} .
$$
*(Eq. 40.25)*

where this analytical model assumes unchanged nonoptimized work and normalized added overhead. If 60% of time is accelerated fourfold with zero added overhead, total speedup is $1/(0.4+0.15)\approx1.82$, not four. Dynamic encoding, fallback layers and communication increase the denominator. A capacity reduction can also change feasible batch size; that is a separate workload comparison, not a fixed-concurrency speedup.

[DERIVED] Measure prefill, decode and queueing separately, using [shared latency definitions](../../../front-matter/notation.md#2-8-latency-chapter-48-mathematically-derived-definitions). Report TTFT, TPOT, tail ITL, E2E latency, throughput and goodput at a declared arrival process. An average per-token time from an offline batch does not determine a serving p99. Energy requires integrating power over the declared boundary; money requires charging conversion/recovery and recurring serving against an amortization horizon.

```figure
id: fig-40.18
kind: diagram
title: Quantization acceptance boundaries
caption: Quality and resource acceptance converge only after artifact correctness and workload-compatible execution are established.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.25
alt: Artifact correctness feeds numerical evaluation and executed-path evaluation. Numerical evaluation feeds task evaluation; executed paths feed memory and latency measurements. Both are required for acceptance.
spec:
  direction: LR
  nodes:
    - {id: artifact, kind: memory, label: artifact identity}
    - {id: numerical, kind: metric, label: common-prefix divergence}
    - {id: task, kind: metric, label: independent task quality}
    - {id: path, kind: process, label: actual kernel path}
    - {id: cost, kind: metric, label: complete memory and time}
    - {id: accept, kind: state, label: workload acceptance}
  edges:
    - {from: artifact, to: numerical}
    - {from: numerical, to: task}
    - {from: artifact, to: path}
    - {from: path, to: cost}
    - {from: task, to: accept}
    - {from: cost, to: accept}
```

## Algorithm

### Algorithm 40.6 — Paired evaluation with explicit failures

[MATHEMATICALLY-DERIVED] Inputs are immutable reference/quantized artifacts, finite workload $\mathcal E$, declared metrics and resource boundary. Output is paired results including failures, not a preselected success subset.

$$
\begin{aligned}
1.\;&\operatorname{AssertSameTokensTemplateInputs}(\mathcal E);
\quad\text{reject provenance mismatch}.\\
2.\;&\forall i\le n_e:\ (z_i,\widehat z_i)\leftarrow
\operatorname{CommonPrefixForward}(i);\ \text{record divergence}.\\
3.\;&\forall i\le n_e:\ (y_i,\widehat y_i)\leftarrow
\operatorname{Generate}(i,\text{declared sampler and caps}).\\
4.\;&\text{timeout, invalid output, OOM or missing termination}
\Rightarrow\text{retain failure under declared scoring}.\\
5.\;&d_i^{\rm task}\leftarrow
\operatorname{Score}(\widehat y_i)-\operatorname{Score}(y_i);
\quad\text{aggregate by workload stratum}.\\
6.\;&\text{join quality records with kernel, memory and timing records};
\quad\text{return frontier and unresolved failures}.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] Generation caps make the procedure bounded. Shared tokenization is invariant; successful execution is not assumed. Evaluation costs two model executions per condition plus scoring, repeated for selected workloads. Timing instrumentation adds overhead and must be calibrated or separated from profiling.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM and llama.cpp occupy **Inference engine**; PyTorch occupies **Model / autograd framework**. vLLM's hardware chart and backend controls are inspected documentation, not this edition's kernel traces [R40.15]. Record dispatch under every exercised shape because supported formats do not imply a single implementation path.

[MATHEMATICALLY-DERIVED] Warmup and compile time belong to a separate cold-start record unless the service boundary includes them. Prefix-cache state, concurrency, scheduler settings and graph-capture behavior must be fixed or exposed as independent variables. A model fitting on fewer devices can reduce communication, but the gain combines representation and topology changes.

## Experimental design

### Reported experiments

[PAPER-REPORTED] GPTQ Table 6 studies OPT-175B batch-one generation of 128-token sequences, comparing FP16 with three-bit execution [P33, §5; Appendix A.2.2]. Its device count changes. The historical record is:

| Quantity | Disclosed context |
|---|---|
| Reported latency | A100: 230 ms/token FP16, 71 ms/token three-bit |
| Hardware | A100-80GB; five GPUs reference versus one GPU quantized |
| Model/precision | OPT-175B; FP16 versus GPTQ three-bit, other retained tensors as disclosed |
| Sequence/input-output | Generated sequences length 128; prompt-distribution details NOT-DISCLOSED in table |
| Concurrency | Batch size one |
| Runtime | Paper's custom kernel/Hugging Face-based harness; exact software revisions NOT-DISCLOSED |
| Boundary | Average per-token generation latency; not a client-visible tail latency |

[PAPER-REPORTED] The Ascend study evaluates reasoning with temperature 0.6, top-p 0.95 and maximum sequence length 32,768, using vLLM-Ascend; its quality comparisons are fake-quantized [R40.21, §3.1–3.2]. The separate INT8 prototype covers only part of execution.

## Observations

**What the paper claims.** [PAPER-REPORTED] GPTQ reports a practical generation benefit; the Ascend study reports numerical and implementation sensitivity [P33, Table 6; R40.21, §3–4].

**What the evidence shows.** [PAPER-REPORTED] GPTQ's A100 ratio is approximately 3.24 under changed device count. The Ascend study observes unstable aggressive weight/activation/cache fake quantization and reports dynamic quantization overhead limiting its partial native path. Neither supports a universal fixed-hardware speedup.

**What we infer.** [MATHEMATICALLY-DERIVED] File compression, numerical retention and execution acceleration are independently falsifiable. Eqs. 40.22–25 explain why a successful result on one axis cannot establish another.

**What remains unknown.** [UNVERIFIED] This chapter supplies no independently measured quality, memory, throughput, energy or cost frontier. The Ascend comparison device designated X2000 is not fully identified in the inspected disclosure.

## Failure modes

> **Failure mode — Success-only throughput.** [MATHEMATICALLY-DERIVED] *Symptom:* reported tokens/s rises while task completion falls. *Cause:* failed/truncated requests are omitted or counted as useful output. *Detection:* join completion and resource logs by request. *Mitigation:* report goodput and cost per accepted task.

[MATHEMATICALLY-DERIVED] Comparing different templates confounds representation with input changes. Evaluating only short outputs misses length-conditioned failure. Ignoring fallback kernels hides the executed method. Selecting precision on the final benchmark invalidates independent acceptance.

## Siblings

[MATHEMATICALLY-DERIVED] [Numerical checks](40-1-quantization-formulation.md) diagnose local representation error; [artifact checks](40-5-artifact-runtime-interfaces.md) establish decoding and dispatch; task evaluation establishes utility on a population; serving evaluation establishes service behavior under load. Their estimands differ, so they should be reported together without collapsing them into one score.

## Extensions

### Improvements

[PAPER-REPORTED] The QAD report evaluates multiple generation runs but also selects among ten validation-preferred checkpoints using average benchmark performance [R40.10, §3.4]. Repeated sampling reduces sampling noise; benchmark-based checkpoint selection leaves an independence limitation. The 2026 mixed-cache disclosure separates modeled payload from task deltas [R40.20]; it does not provide E2E speed evidence. These reporting distinctions improve interpretation without filling missing measurements.

## Limitations

[MATHEMATICALLY-DERIVED] A finite benchmark cannot certify every deployment distribution. Common-prefix KL measures a conditional discrepancy, not factual correctness. Confidence intervals address sampling variability under their unit assumptions, not contamination, evaluator bias or hidden selection. Measured speed transfers only within the hardware/runtime/workload boundary.

## Reproducibility

[MATHEMATICALLY-DERIVED] Retain per-example outcomes, logits or sufficient divergence statistics, length strata, failure codes, precision map, full memory ledger, dispatch manifest and raw timing boundaries. Pair records by immutable input identity. Book-authored verification remains an unexecuted proposal in [verification.md](verification.md).

## References

[P33](references.md#p33), [R40.10](references.md#r40-10), [R40.15](references.md#r40-15), [R40.20](references.md#r40-20), [R40.21](references.md#r40-21).

```figure
id: fig-40.19
kind: calculator
title: End-to-end acceleration ceiling
caption: Eq. 40.25 is an analytical phase model, not a benchmark. Added overhead can reverse a kernel-level gain.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.25
alt: Accelerating sixty percent of baseline time by four with no added overhead yields about 1.82 total speedup. A ten-percent added overhead lowers this to about 1.54.
states:
  - {anchor: formulation, label: No added overhead, variables: {added: 0}, note: A fourfold kernel gain is not a fourfold request gain.}
  - {anchor: mechanism, label: Encoding overhead, variables: {added: 0.1}, note: Runtime quantization consumes part of the saving.}
  - {anchor: failure-modes, label: Expensive fallback, variables: {added: 0.5}, note: Added work can remove the benefit.}
spec:
  tex: R=1/((1-f)+f/r+t_{\rm add})
  equation: "40.25"
  inputs:
    - {symbol: f, label: optimized time fraction, default: 0.6, min: 0, max: 1, format: fixed2}
    - {symbol: r, label: component acceleration, default: 4, min: 1, max: 16, format: fixed2}
    - {symbol: added, label: added baseline time, default: 0, min: 0, max: 1, format: fixed2}
  outputs:
    - {symbol: speed, label: total speedup, formula: 1/((1-f)+f/r+added), format: fixed2}
```

```figure
id: fig-40.20
kind: stat-panel
title: Evaluation estimands
caption: State the quantity each study measures before comparing reported results.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-40.23
alt: Common-prefix divergence, free-running task quality, total live bytes and client-visible service cost are distinct quantities.
spec:
  header: FOUR ACCEPTANCE AXES
  rows:
    - {key: numerics, value: identical-prefix error}
    - {key: task, value: generated outcome}
    - {key: memory, value: total live bytes}
    - {key: service, value: accepted work and latency}
```
