---
id: ms.section.13.6
entity_type: section
title: Architectural ablations
short_title: Architectural ablations
section: 13.6
slug: 13-6-architectural-ablations
parent: ms.chapter.13
prev_sibling: ms.section.13.5
next_sibling: null
children: []
prerequisites: [ms.chapter.5, ms.chapter.10, ms.section.13.5]
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

# 13.6 Architectural ablations

## Scope

**KNOWN — chapter matrix.** This section owns matched-parameter versus matched-FLOP comparisons, quality/latency tradeoffs, and domain sensitivity. Chapter 06 owns general experimental design. Here the intervention is a dense architecture, and the required outcome is a defensible comparison whose resource constraints and changed mechanisms are explicit.

## Why this exists

**DERIVED.** An architecture can appear better because it has more parameters, sees more tokens, receives more hyperparameter tuning, or happens to dispatch a better kernel. Conversely, a mathematically cheaper design can lose wall time because its matrices are too small for the chosen execution regime. Reporting only final loss and model size confounds these explanations.

**DERIVED.** The central difficulty is that budgets are multidimensional. Equal parameters, equal training tokens, equal total FLOPs, equal accelerator hours, and equal inference latency are different constraints. Some can be approximately matched together; others cannot. A rigorous ablation names its primary constraint and reports residual differences instead of describing every comparison as “fair” without qualification.

## Intuition

**DERIVED.** Separate an architecture effect from an implementation effect. An architecture comparison asks what learned computation is useful under a stated resource budget. An implementation comparison asks how efficiently a fixed computation executes. Both matter, but combining an architectural substitution with a new fused kernel prevents attributing the observed change to either factor alone.

**DERIVED.** The appropriate result is often a frontier rather than one winner. A design may have lower loss at greater latency or lower memory at greater training cost. A product or research objective chooses among those tradeoffs; model size does not supply that objective.

## Formulation

> **Definition — Budget-conditioned architectural comparison.** A comparison declaring the matched resource, tolerance, workload, and remaining uncontrolled differences before interpreting quality or cost.

**MATHEMATICALLY-DERIVED — run-level compute ledger.**

$$
C_{\mathrm{run}}=
\sum_{u=1}^{n_{\mathrm{update}}}
\left(F_{\mathrm{forward},u}+F_{\mathrm{backward},u}
+F_{\mathrm{recompute},u}+F_{\mathrm{optimizer},u}\right),
\qquad
C_{\mathrm{search}}=\sum_{r=1}^{n_{\mathrm{run}}}C_{\mathrm{run},r}.
$$
*(Eq. 13.18)*

where $C$ is training compute, $u$ indexes updates, and $r$ includes successful, failed, and discarded trials in the declared search. The ledger excludes preprocessing and evaluation only when those costs are reported separately. A fixed multiple of forward FLOPs is a model requiring validation, not an exact substitute for this decomposition.

**MATHEMATICALLY-DERIVED — shape-dependent difference.** For the A/B body-matched designs of §13.2, using full-position vocabulary projection and the same vocabulary $V$,

$$
\Delta F_{\mathrm{token}}
=F_{\mathrm{A,token}}-F_{\mathrm{B,token}}
=4T(L_Ad_A-L_Bd_B)+2V(d_A-d_B).
$$
*(Eq. 13.19)*

where the equal body-projection term cancels. This is a forward matrix-work comparison; total parameters are not matched because the vocabulary terms differ.

**MATHEMATICALLY-DERIVED.** With the stated A/B dimensions and $V=32768$, the difference is $49152T-67108864$ FLOPs per token. It is negative at $T=1024$ and positive at $T=4096$. Thus even the direction of a compute comparison can depend on the sequence distribution. These are constructed arithmetic results, not throughput measurements.

**MATHEMATICALLY-DERIVED — dominance.** For a fixed quality metric where lower is better and a fixed resource metric where lower is better, candidate $i$ dominates candidate $j$ when

$$
\ell_i\le\ell_j,\quad c_i\le c_j,
\quad\text{and at least one inequality is strict}.
$$
*(Eq. 13.20)*

where $\ell$ is a measured quality loss on the same evaluation population and $c$ a comparable measured or analytically specified cost. Empirical uncertainty must be retained before making a scientific superiority claim.

~~~figure
id: fig-13.18
kind: calculator
title: Sequence-dependent forward-work difference
caption: Eq. 13.19 compares the constructed body-matched designs, not equal total parameters. Positive output means the deeper design has more counted matrix work per token.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: "Length 1024", variables: {T: 1024, V: 32768}, note: "A minus B is -16,777,216 FLOPs per token under the declared matrix-work model."}
  - {anchor: mechanism, label: "Length 4096", variables: {T: 4096, V: 32768}, note: "A minus B becomes +134,217,728 FLOPs per token; the sign changes."}
  - {anchor: failure-modes, label: "Broader vocabulary", variables: {T: 4096, V: 131072}, note: "The selected matrix-work terms cancel; latency equality does not follow."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-13.19
alt: With vocabulary 32768, the deeper-minus-wider difference is minus 16,777,216 FLOPs at length 1024 and plus 134,217,728 FLOPs at length 4096.
spec:
  tex: \Delta F_{\mathrm{token}}=49152T-2048V
  equation: "13.19"
  inputs:
    - {symbol: T, label: sequence length, default: 1024, min: 1, max: 131072, format: integer}
    - {symbol: V, label: vocabulary size, default: 32768, min: 256, max: 262144, format: integer}
  outputs:
    - {symbol: delta, label: A minus B FLOPs per token, formula: 49152*T-2048*V, format: flops}
~~~

## Mechanism

**DERIVED.** A matched-parameter experiment asks how a fixed quantity of unique parameters should be allocated. Hold all parameter categories in the constraint, including embeddings, norm parameters, biases, and task heads. If integral dimensions prevent exact matching, publish the absolute and relative mismatch. Do not remove inconvenient terms from the count after seeing the result.

**DERIVED.** A matched-FLOP experiment asks how a fixed counted training-compute budget should be spent. Models may then see different token counts, especially if long-context attention or output heads differ. That is not a defect if it is the intended constraint, but data exposure becomes part of the causal interpretation. Report quality against both consumed tokens and total compute.

**DERIVED.** A matched-time experiment includes hardware and implementation efficiency. It can answer a deployment-relevant question while being unsuitable for isolating a mathematical architecture effect. The compute budget expended by failed tuning runs is also relevant when claiming resource efficiency; selecting the best result from many more trials changes the evidence.

~~~figure
id: fig-13.19
kind: compare
title: Distinct controls for architectural comparisons
caption: Each column answers a different question. Residual differences remain reportable variables instead of disappearing under a generic fairness label.
placement: inline
evidence: DERIVED
source: DERIVED:eq-13.18
alt: Parameter matching controls unique model size, FLOP matching controls counted training work, and time matching controls elapsed resource use on a specified execution system.
spec:
  axis: Primary resource held fixed during an architecture intervention
  columns:
    - {id: params, label: Matched parameters}
    - {id: flops, label: Matched FLOPs}
    - {id: time, label: Matched time}
  rows:
    - {dimension: controlled quantity, values: {params: "all unique parameters", flops: "complete compute ledger", time: "declared elapsed boundary"}}
    - {dimension: can still differ, values: {params: "FLOPs and activation state", flops: "tokens and wall time", time: "FLOPs and data exposure"}}
    - {dimension: implementation sensitivity, values: {params: "must report", flops: "must report", time: "part of the objective"}}
    - {dimension: tuning budget, values: {params: "record all trials", flops: "record all trials", time: "record all trials"}}
~~~

**MATHEMATICALLY-DERIVED — exact equal-total counterexample.** Keep all matrix dimensions, norms, embeddings, and biases fixed at $d_a=d=1024$, but use eight heads of dimension 128 or sixteen heads of dimension 64. Unique parameter count remains identical. Under materialized-score attention, the score tensor in Eq. 13.6 doubles in size because $H$ doubles. The example establishes unequal intermediate allocation under a specified implementation without claiming unequal leading attention-product FLOPs or measured latency.

**DERIVED.** Training and inference require separate phase profiles. Training retains or recomputes activations and computes gradients. Prefill processes a known prefix. Decode repeatedly invokes the body for newly generated tokens and reads growing attention state. A design's advantage at one phase need not transfer to another. The parameter/FLOP artifact must expose phase-specific inputs rather than one universal “cost per model.”

**DERIVED.** Domain sensitivity requires controlled evaluation slices. Code, multilingual text, mathematical notation, and ordinary prose can differ in token lengths and output demands. Keep the tokenizer fixed when isolating architecture; when vocabulary is the intervention, normalize evaluation to a compatible population and report the change in tokenization. Averaging domain losses with changing weights can manufacture an apparent improvement.

**DERIVED.** Hyperparameter transfer is another intervention. Applying one learning rate and initialization to every depth may advantage the reference design. Independently tuning each candidate can be appropriate, but equalize or disclose the search budget and hold out model-selection data. The final test set must not choose the architecture, tuning schedule, or preferred evaluation slice.

**DERIVED.** Numerical correctness comes before a quality comparison. Verify primitive outputs, target masks, shared-parameter semantics, loss denominators, and optimizer updates on bounded fixtures. A faster incorrect model is not an architectural improvement. A slower reference is valuable when it provides an independent oracle for the optimized implementation.

## Algorithm

**DERIVED — two-axis frontier with fixed-width scalar keys.**

~~~text
Algorithm 13.6 — Construct a bounded architecture comparison frontier
INPUT: finite candidate records with valid cost, loss, context, and uncertainty
OUTPUT: comparable frontier records plus rejected or incomparable records
STATE: candidates sorted by cost then loss; best loss at lower/equal cost
INVARIANT: a retained candidate is not strictly dominated on the declared axes
1. Reject non-finite metrics, missing contexts, and incompatible populations.
2. Group candidates by the exact comparability contract.
3. Within each group, sort by ascending cost, then ascending loss.
4. Process equal-cost groups together; identify their minimum loss.
5. Retain only minima improving the best lower-cost loss.
6. Preserve tied records with identical coordinates as equivalent points.
7. Attach uncertainty and all secondary metrics to every retained point.
8. Report that empirical dominance may remain unresolved under uncertainty.
~~~

**DERIVED — complexity.** Sorting $n_{\mathrm{cand}}$ finite records requires $O(n_{\mathrm{cand}}\log n_{\mathrm{cand}})$ scalar comparisons and the sweep costs $O(n_{\mathrm{cand}})$. Precompute numeric metrics and comparison-contract keys rather than parsing long configuration strings inside the comparator. This avoids an unnecessary all-pairs dominance scan for the two-axis case. More objectives require a different frontier algorithm and analysis.

## Implementation

**OFFICIAL-DOCUMENTATION — [R13.15](references.md#r1315).** The inspected Spring 2026 CS336 curriculum connects model construction with profiling and scaling exercises. **DERIVED.** That is a method route, not benchmark evidence. Use PyTorch at *Model / autograd framework* for reference operators, Hugging Face Transformers at *Model definition / adaptation* for configurations, NVIDIA Megatron-Core at *Distributed training* for placement, and NVIDIA Transformer Engine at *Kernels / numerics / collectives* for the selected execution path.

**DERIVED.** Record resolved dispatch, warm-up, synchronization, compilation boundaries, and cache state for timing. Compare observed peak allocated memory separately from allocator reservation and analytical live tensors. A profiler can attribute operator time but does not automatically measure end-to-end request latency or exposed communication.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 13.6 — Budget-specific architectural frontier

- **Hypothesis:** depth, width, gate, normalization, and head allocation have budget- and domain-dependent tradeoffs.
- **Setup:** define separate parameter-, compute-, and time-constrained experiment groups.
- **Independent variables:** one architectural factor at a time, followed by selected interaction studies.
- **Controlled variables:** corpus snapshot, evaluation populations, tokenizer where applicable, and tuning budget.
- **Dataset/workload:** independent general and domain slices plus prefill/decode length distributions.
- **Hardware:** record exact device, interconnect, runtime, precision, backend, and concurrency.
- **Metrics:** unique parameters, Eq. 13.18 compute, retained state, held-out loss, task quality, and phase latency.
- **Baselines:** reference architecture and unfused correctness oracle.
- **Expected result:** a measured frontier rather than a presumed winner.
- **Ablation:** separately toggle an optimized kernel for the same trained architecture.
- **Interpretation:** report uncertainty across training seeds and evaluation units under Chapter 06's protocol.
- **Threats to validity:** test-set tuning, tokenization confounds, hidden failed runs, and changing length distributions.

## Observations

**What the paper claims.** **PAPER-REPORTED.** The cited architectural papers evaluate specific experimental regimes, not every deployment budget.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Equal unique parameters can coexist with unequal materialized attention memory; the body-matched cost difference changes with sequence length.

**What we infer.** **DERIVED.** Architecture selection requires a stated workload and objective before a frontier is meaningful.

**What remains unknown.** **UNVERIFIED.** No trained quality/latency frontier is established by this manuscript.

## Failure modes

~~~figure
id: fig-13.20
kind: stat-panel
title: Run budget and search budget
caption: The search budget includes successful, failed and discarded runs within the declared boundary.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-13.18
alt: The search budget includes successful, failed and discarded runs within the declared boundary.
spec:
  header: ACCOUNTING BOUNDARY
  rows:
    - {key: "run compute", value: "forward + backward + other"}
    - {key: "recomputation", value: "explicit contribution"}
    - {key: "search compute", value: "all declared trials"}
    - {key: "evaluation", value: "separate or explicitly included"}
~~~

> **Failure mode — hidden tuning advantage.** **DERIVED.** *Symptom:* one candidate receives substantially more successful trials. *Cause:* reporting only the selected run. *Detection:* search ledger. *Mitigation:* disclose and control the full tuning budget.

> **Failure mode — aggregate domain reversal.** **DERIVED.** *Symptom:* reported mean improves while key domains regress. *Cause:* changed evaluation weights or lengths. *Detection:* fixed-population slice metrics. *Mitigation:* predeclare aggregation and report slices.

## Siblings

**DERIVED.** Parameter matching, FLOP matching, and time matching are alternative budget constraints. Primitive equivalence tests address implementation correctness; training ablations address learning behavior; serving profiles address workload execution. The [Chapter 06 protocol](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md) provides the statistical foundation.

## Extensions

**DERIVED.** For adaptation, distinguish frozen and trainable parameters without confusing trainable-state savings with deployed model size. For conditional models, include source-state reuse. For multimodal models, add modality-specific compute and quality axes rather than forcing all cost into text-token counts.

## Limitations

**DERIVED.** A frontier is conditional on the candidate set, budgets, implementations, and evaluation population. It is not a proof of global optimality or current universal SOTA. Results can shift when hardware or input distributions change.

## Reproducibility

**DERIVED — required record.** Retain every architecture and runtime configuration, unique-parameter inventory, complete budget ledger, data/exposure identity, tuning history, seed plan, evaluation slices, measurement boundaries, uncertainty estimates, and rejected candidates.

## References

[P01](references.md#p01); [R13.2](references.md#r132); [R13.6](references.md#r136); [R13.12](references.md#r1312); [R13.13](references.md#r1313); [R13.14](references.md#r1314); [R13.15](references.md#r1315).
