---
id: ms.verification.3
entity_type: verification
title: Verification — Numerical computation and a trustworthy training program
short_title: Verification 03
volume: 1
part: 1
chapter: 3
section: null
slug: verification
parent: ms.chapter.3
prev_sibling: ms.section.3.6
next_sibling: ms.references.3
children: []
prerequisites: [ms.section.3.1, ms.section.3.2, ms.section.3.3, ms.section.3.4, ms.section.3.5, ms.section.3.6]
downstream: [ms.section.5.6, ms.section.19.6, ms.section.26.6]
related: [ms.section.6.4]
siblings_by_mechanism: []
relations:
  - {type: evaluated_by, target: ms.chapter.3}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, evaluation], mechanism: [numerical_verification], feedback_setting: [], modality: [text]}
papers: [P13]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, OFFICIAL-DOCUMENTATION, UNVERIFIED], empirically_observed: false}
word_count_target: 1500
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# Verification - Chapter 03

[DERIVED] This file defines the plan's forward/gradient comparison and audits CONTENT_CONTRACT section 4.1. Every experiment below is an **unexecuted book proposal**. Source experiments appear in the six manuscripts. Verification is conditional: establish the objective and numerical premises before asserting a bound. Unit roundoff and reduction length alone do not bound an arbitrary training program.

## 1. Artifact specification

[DERIVED] Proposed components are a converter, stable primitive/reference module, the causal reference of section 3.5, stored fixtures, checks, a state/environment manifest and a report. Executable files and fixtures have not been materialized. Manuscript syntax inspection is distinct from runtime and numerical validation.

| Proposed component | Responsibility | Required record |
|---|---|---|
| formats.py | Neighboring-value and exceptional conversion | Format, rounding, saturation, subnormal and scale rules |
| primitives.py | Stable exponential sums, normalization, reductions | Input/accumulator/output types, schedule, reference boundary |
| skeleton.py | Causal reference, shifted loss and update gate | Loaded state, masks, counts, expected connectivity |
| fixtures/ | Realized inputs, parameters and reference values | Shapes, hashes, objective, finite flags, RNG metadata |
| checks.py | Categorical, local-bound and diagnostic comparisons | Premises, metric, threshold provenance, failure location |
| manifest.json | Numerical and execution state | Versions, device, kernels, flags, workspace, RNG, scales, counters |
| report.md | Supported results and unresolved causes | Observed value, budget/gate, verdict and limitations |

## 2. Verification task

[ASSUMED] The initial bounded fixture uses B=2,T=16,D=32,V=64 and FP64 stored parameters, with ordinary and boundary inputs. These are test choices, not paper settings. Store realized tensors before comparisons. Use CPU FP64 and one recorded accelerator if available; unsupported native FP8/FP4 paths remain unsupported.

| Case | Boundary | Required interpretation |
|---|---|---|
| E1 | Large finite logits, including opposite-sign extremes | Shift does not independently prevent subtraction overflow |
| E2 | Equal logits | Uniform probabilities need not be exactly representable |
| E3 | One admitted key | Probability one on that key |
| E4 | Empty attention and empty supervision | Zero extension before invalid arithmetic; empty effective loss rejected |
| E5 | Large mean, small variance | Distinguish pre- and post-quantized references |
| E6 | Half-minsub, minsub, minnormal, zero | Neighbor/tie behavior; no subnormal relative guarantee |
| E7 | Nearly/exactly cancelling sums | Absolute error and conditioning |
| E8 | Long narrow/wide reductions | Verify ku<1 before using gamma bounds |
| E9 | BF16 neighbors at binade boundaries | Direction-dependent half spacing and ties |
| E10 | Zero/nonfinite/stale maxima; transposed blocks | Explicit scale handling and conversion axes |

### Experiment 3.1 - Encoding boundaries

- **Hypothesis.** [ASSUMED] Under the declared conversion premises, a separately implemented neighbor oracle and a framework cast select the same representable value.
- **Setup.** Store 10000 FP64 values plus exact midpoints, finite maxima, signed zeros, infinities and NaNs; compare the independent converter with each supported cast.
- **Independent variables.** Format, rounding mode, saturation mode and documented subnormal policy.
- **Controlled variables.** Realized FP64 inputs, device, conversion path and output interpretation.
- **Dataset/workload.** The bounded synthetic fixture E6, E9 and E10; these are proposed test inputs, not a reported training dataset.
- **Hardware.** CPU FP64 plus one recorded accelerator when supported; do not emulate a vendor native path under the same label.
- **Metrics.** Selected neighbor, tie parity, absolute/relative error, saturation and nonfinite counts.
- **Baselines.** Independent nearest-neighbor enumeration and the documented framework cast; distinguish OCP E2M1 emulation from native FP4.
- **Expected result.** Normal relative and subnormal absolute criteria hold only under their rounding premises; unsupported conversion remains unsupported.
- **Ablation.** Insert an intermediate cast or a flush-to-zero policy to test whether conversion composition changes the answer.
- **Interpretation.** A mismatch localizes a conversion contract failure; agreement does not validate a complete training kernel.
- **Threats to validity.** Shared implementation logic, intermediate rounding, undocumented flush behavior and incorrect exceptional-value handling.

### Experiment 3.2 - Stable primitives

- **Hypothesis.** [ASSUMED] Stable reformulations avoid identified exceptional paths while retaining the declared exact-arithmetic objective.
- **Setup.** Compare direct, shifted and online exponential sums; direct and division-free softmax; raw, centered and Welford variance; sequential, tree and blocked sums.
- **Independent variables.** Widths 16,128,4096 and supported storage/accumulation policies.
- **Controlled variables.** Stored inputs, target expression, reduction schedule within each variant and backend flags.
- **Dataset/workload.** Boundary fixtures E1-E8, including cancellation and large-mean small-variance arrays.
- **Hardware.** Recorded CPU and accelerator paths with their elementary-function and reduction implementations identified where available.
- **Metrics.** Absolute/conditioned error, probability-sum defect, finite flags and peak memory.
- **Baselines.** FP64 evaluation, naive alternatives and independent scalar reference; separate f(x) from f(Q(x)).
- **Expected result.** Eq.3.9 bounds only its finite sum schedule when ku<1. Composite exp/log/normalization errors remain diagnostic without additional budgets.
- **Ablation.** Change only the reduction order, accumulator type or stable reformulation; retain the failing naive alternative as a negative control.
- **Interpretation.** Distinguish representation error, arithmetic error and sensitivity. FP64 is a reference with its own errors, not exact ground truth.
- **Threats to validity.** Hidden kernel schedules, elementary-function errors, nonfinite subtraction and comparing different quantized inputs.

### Experiment 3.3 - Derivatives, DAGs and accumulation

- **Hypothesis.** [ASSUMED] Cotangent accumulation and valid-token weighting reproduce the derivative of the declared objective.
- **Setup.** Sweep directional finite-difference steps from 1e-2 through 1e-7 on the FP64-preserving reference; add coordinate checks on small custom primitives.
- **Independent variables.** Step size, direction, DAG sharing and microbatch partition with unequal valid counts.
- **Controlled variables.** Objective, stored parameters, masks, realized randomness and effective batch.
- **Dataset/workload.** Shared-node DAG, unequal-count microbatches and a deliberate saved-value mutation.
- **Hardware.** Recorded FP64-capable backend; inspect whether the actual path preserves FP64.
- **Metrics.** Perturbation representability, derivative discrepancy over the sweep and effective-batch gradient differences.
- **Baselines.** Analytical custom-primitive derivatives and one effective-batch evaluation.
- **Expected result.** Eq.3.14 is a bound only with justified M3, endpoint evaluation and quotient errors; otherwise report a prespecified diagnostic gate.
- **Ablation.** Overwrite cotangents, average unequal means or clip before accumulation as deliberate negative controls.
- **Interpretation.** A step sweep separates some truncation and rounding effects but does not by itself prove the implemented objective is correct.
- **Threats to validity.** Nonsmooth points, aliasing, perturbations that round away, shared bugs and replay changes.

### Experiment 3.4 - Precision state and update retention

- **Hypothesis.** [ASSUMED] Local neighbor intervals predict lost persistent updates, and scaler rejection preserves the documented optimizer state.
- **Setup.** Compare FP32 execution/parameters, FP16 AMP with FP32 parameters, BF16 autocast with FP32 parameters and deliberately BF16 persistent parameters.
- **Independent variables.** Precision roles, prescribed update magnitude and direction, loss scale and accumulated microbatch count.
- **Controlled variables.** Initial state, data, optimizer equation and accepted-update schedule.
- **Dataset/workload.** Stored midpoint/binade fixtures and injected nonfinite effective batches.
- **Hardware.** Recorded native or emulated cast paths; memory measurements require a declared allocator boundary.
- **Metrics.** Changed elements, zeroing/saturation, scales, skipped batches, update/moment counters, retained copies and allocation.
- **Baselines.** Exact adjacent-value conversion for Eq.3.17; u|w| is a deliberately inadequate proxy at binade boundaries.
- **Expected result.** Fixed scale across accumulated microbatches, one-time unscale and clipping after unscale; rejected steps retain parameters and moments under the documented scaler path.
- **Ablation.** Persist parameters in BF16, change scale mid-accumulation or clip scaled gradients to expose the corresponding failure.
- **Interpretation.** FP32 parameters reduce lost increments but do not preserve every arbitrarily small update; custom rejection requires its own state policy.
- **Threats to validity.** Hidden master copies, optimizer-specific side effects, saturation policies and interpreting allocator totals as tensor payload.

### Experiment 3.5 - Objective semantics and overfitting

- **Hypothesis.** [ASSUMED] The implemented mask/shift/count contract matches the intended causal objective; compatible finite fixtures can serve as an optimization diagnostic.
- **Setup.** Hand-audit target shifts and valid counts; change future and padded tokens separately. Separately fit a fixture with consistent labels for identical visible contexts.
- **Independent variables.** Causal orientation, key masking, padding supervision, document boundaries and count normalization.
- **Controlled variables.** Stored FP64 state for comparisons; for fitting, disable dropout/augmentation and declare optimizer, rate, schedule and 300 accepted-update budget.
- **Dataset/workload.** Bounded causal fixture plus a finite compatible-label corpus; conflicting labels are a separate negative control.
- **Hardware.** Recorded backend running the actual attention implementation that consumes the mask.
- **Metrics.** Earlier/valid prediction changes, finite-row/connectivity flags, forward/gradient diagnostics, loss curve and conditional-entropy floor.
- **Baselines.** Hand-computed target/count cases and the same FP64 state; no mismatched objectives in numerical comparisons.
- **Expected result.** Mask/count assertions are categorical. The proposed 0.01-nat fit target is a review gate, not a convergence theorem.
- **Ablation.** Reverse causality, remove key masking, supervise padding, omit document boundaries or divide by array size.
- **Interpretation.** Derivative agreement cannot certify target semantics. Failure to fit may reflect capacity or optimization rather than a numerical bug.
- **Threats to validity.** Conflicting labels, inaccessible context, insufficient capacity, optimization failure and leakage between packed documents.

### Experiment 3.6 - Replay and attribution

- **Hypothesis.** [ASSUMED] Stored complete state permits the declared replay comparison; changing a single field tests a specific execution dependency.
- **Setup.** Run fresh processes from stored state under a declared deterministic configuration, then vary one stream/workspace, backend, precision or hardware field.
- **Independent variables.** One identified execution field at a time, including process restart.
- **Controlled variables.** Realized data, parameters, optimizer state, RNG state, scheduler, precision state and accepted-update count.
- **Dataset/workload.** The stored short-run reference trajectory, with a separately identified diagnostic replay for localization.
- **Hardware.** Record exact devices, libraries, kernels, workspace and streams; unsupported deterministic operations remain reported outcomes.
- **Metrics.** Pair-specific logits, gradients, moments, parameters, scale/counter and RNG hashes; first divergent state when localizable.
- **Baselines.** Same-configuration fresh-process replay before cross-configuration comparisons.
- **Expected result.** Report byte identity, agreement under justified budgets, or absent budgets; no identity guarantee follows merely from a matching manifest.
- **Ablation.** Change one field while retaining stored state, and repeat the original configuration to check the attribution attempt.
- **Interpretation.** A differing manifest field is a candidate cause, not proof; unresolved causes stay unresolved.
- **Threats to validity.** Hidden state, diagnostic perturbation, unsupported determinism, tolerance nontransitivity and timing without its own warmup/synchronization boundary.

```figure
id: fig-3.34
kind: diagram
title: Proposed checks with distinct evidence strengths
caption: >-
  Categorical contracts, conditional bounds and proposed diagnostic gates
  answer different questions. Every result records premises and unresolved
  causes. None of these experiments has been executed.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-3.9", "DERIVED:eq-3.14", "DERIVED:eq-3.17", "DERIVED:eq-3.22"]
alt: >-
  Stored state feeds six proposed checks. Each check is categorical,
  conditionally bounded or diagnostic. The report retains failures,
  missing premises and unresolved attribution.
spec:
  direction: LR
  nodes:
    - { id: data, kind: dataset, label: "stored inputs and state" }
    - { id: checks, kind: process, label: "six proposed experiments" }
    - { id: contracts, kind: branch, label: "categorical contracts" }
    - { id: bounds, kind: branch, label: "conditional analytical bounds" }
    - { id: gates, kind: branch, label: "diagnostic review gates" }
    - { id: report, kind: state, label: "report including unresolved outcomes" }
  edges:
    - { from: data, to: checks, kind: emphasis }
    - { from: checks, to: contracts }
    - { from: checks, to: bounds }
    - { from: checks, to: gates }
    - { from: contracts, to: report }
    - { from: bounds, to: report, kind: emphasis }
    - { from: gates, to: report }
```

## 3. Acceptance criteria

[DERIVED] Hard bounds apply after establishing their mathematical and implementation premises. Diagnostic gates are chosen review thresholds: passing does not prove correctness, and failure does not automatically identify a bug. Missing premises are a separate outcome.

| ID | Comparison | Criterion | Premises/consequence |
|---|---|---|---|
| T1 | Normal conversion | Error <= u|x| | Finite in-range normal nearest rounding |
| T1s | Subnormal conversion | Absolute error <= minsub/2 | Gradual underflow and declared tie/flush rule |
| T2 | Analyzed scalar sum | gamma_k sum|xi| | Concrete rounding depth, ku<1, finite operations |
| T3 | Rounded-input dot product | [(1+uop)^2(1+gamma_n(uacc))-1] sum|xiyi| | Normal conversions and serial rounded FMA; output rounding separate |
| T4 | Complete logits/gradients | No universal bound supplied | Require operation errors and layer sensitivities; report diagnostics |
| T5 | Directional derivative | Eq.3.14 with bounded terms | Otherwise sweep diagnostic; no automatic1e-8 certificate |
| T6 | Masks/counts/empty rows/connectivity | Exact declared semantics | Independent of derivative agreement |
| T7 | Two computations of same target | BA+BB when each budget valid | Otherwise no analytical closeness assertion |
| T8 | Unchanged parameter | Eq.3.17 with local neighbors/ties | Directional binade boundaries included |
| T9 | Tiny-batch fit | Proposed0.01nats/300accepted updates | ASSUMED gate on compatible fixture |

```figure
id: fig-3.35
kind: stat-panel
title: Conditional scalar-sum budgets
caption: >-
  These are local sum budgets under Eq.3.9, not model tolerances. Two
  computations of the same exact sum have the sum of their justified
  budgets. Composite logits and gradients require additional analysis.
placement: rail
anchor: 3-acceptance-criteria
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.9", "DERIVED:eq-3.22"]
alt: >-
  At n4096 in FP32, unit roundoff is 2^-24. A sequential sum has gamma4095
  budget per sum of input magnitudes. Two such budgets add. Complete
  model and gradient budgets remain unverified.
spec:
  header: "LOCAL BUDGETS - PREMISES REQUIRED"
  variables: { n: 4096 }
  rows:
    - { key: "FP32 unit roundoff", formula: "2^-24", format: raw }
    - { key: "sequential gamma_(n-1)", formula: "(n-1)*2^-24/(1-(n-1)*2^-24)", format: raw }
    - { key: "two such budgets", formula: "2*(n-1)*2^-24/(1-(n-1)*2^-24)", format: raw }
    - { key: "complete model/gradient budget", value: "UNVERIFIED" }
    - { key: "experiment execution", value: "not run" }
```

## 4. Evidence gaps and review consequence

| Gap | Status | Consequence |
|---|---|---|
| Runtime/numerical validation of listing | UNVERIFIED | No executable correctness or generated fixture claimed |
| Full model/gradient/trajectory error budget | UNVERIFIED | Local reductions cannot certify composed training |
| Closed-kernel schedules/saved-state layout | NOT-DISCLOSED where unavailable | Bounds/accounting restricted to analyzed implementations |
| Missing source seeds/trial uncertainty | NOT-DISCLOSED | No uncertainty or default seed invented |
| Native FP4/source experiment reproduction | UNVERIFIED | Results remain attributed and workload-specific |
| Historical candidate numerical texts | UNVERIFIED | No inherited access status; derivations state premises |
| Runtime/release compatibility | UNVERIFIED | Inspected docs identify semantics, not a tested installation |
| QuartetII zero-denominator/production corners | UNVERIFIED for execution | Method summary is not a production reimplementation |

## 5. Topic-completeness audit

[DERIVED] All13 obligations are abbreviated: P problem/baseline; F formal contract; M methodology; E equations/conditions; A procedure/state; I implementation; C resources; X reported protocol; O observations; S alternatives; L lineage; V validity/failures; R closure. Each linked section's fixed headings supply P/F/M/E/A/I/C/S/V/R where applicable. Rows identify source-specific X/O/L and gaps. Analytical identities have no training dataset; source studies evaluate their consequences, not prove identities empirically. The audit is editorial coverage and does not claim independent scientific review.

| Required concept/variant | Manuscript anchor; obligations | Primary locator | Experimental/lineage boundary and gap |
|---|---|---|---|
| FP32/FP16 normals, exponents, epsilon/u | [3.1 Formulation](03-1-numeric-representations.md#formulation); P/F/M/E/A/I/C/S/V/R | Eqs 3.1-3.3; R3.25 sections 2-4 | Analytical encoding; R3.3 section 4 training consequences; casts unexecuted |
| BF16 range/precision | [3.1 Mechanism](03-1-numeric-representations.md#mechanism); all applicable | R3.4 sections 2-4/Table 1 | Study-specific emulation/subnormals; no universal convergence |
| FP8 E4M3/E5M2 | [3.1 Formulation](03-1-numeric-representations.md#formulation); all applicable | R3.2 sections 2-4/Table 1/2 | Controlled conversion study; native speed not inferred |
| FP4 E2M1, MXFP4/NVFP4 | [3.1 Mechanism](03-1-numeric-representations.md#mechanism); all applicable | R3.6 sections 5.3.3/5.4/6.3; R3.41 format | Source studies R3.27-29; native reproduction gap |
| Integer formats/accumulator overflow | [3.1 Mechanism](03-1-numeric-representations.md#mechanism); P/F/M/E/A/I/C/S/V/R | Integer-capacity proof; R3.5 Table 1 | Analytical capacity; calibrated quantization owned by Chapter 40 |
| Nearest/stochastic rounding, overflow, subnormals | [3.1 Mechanism](03-1-numeric-representations.md#mechanism); all applicable | Eqs 3.1-3.5; R3.6 conversion; R3.25 section 4 | Midpoint/tie proof; source training consequences; flush behavior execution gap |
| Log-sum-exp/log-softmax | [3.2 Mechanism](03-2-stable-primitives.md#mechanism); all applicable | R3.26 sections 3-5/Algorithms1-4 | Actual fixed MNIST logits; complete elementary-function budget absent |
| Shifted/division-free softmax | [3.2 Experimental design](03-2-stable-primitives.md#experimental-design); all applicable | R3.26 sections 4-5 | Reported error/overflow comparison; no independent replication |
| Online exponential sum/empty rows | [3.2 Algorithm](03-2-stable-primitives.md#algorithm); P/F/M/E/A/I/C/S/L/V/R | P19 Algorithms1-2; book empty-row extension | Streaming invariant; fused attention results owned by Chapter 27 |
| LayerNorm/RMSNorm | [3.2 Formulation](03-2-stable-primitives.md#formulation); all applicable | R3.21 Eq 3; R3.20 Eq 4/section 6.1/Table 2/AppA.1 | Actual RNNSearch controls/timing; architectural and arithmetic evidence separated |
| Raw/centered/Welford variance | [3.2 Algorithm](03-2-stable-primitives.md#algorithm); P/F/M/E/A/I/C/S/V/R | Centered-sum recurrence proof | No universal relative bound or invented accuracy benchmark |
| Sequential/tree/blocked sums | [3.2 Mechanism](03-2-stable-primitives.md#mechanism); P/F/M/E/A/I/C/S/L/V/R | Eq 3.9 proof; R3.25 section 3 | Documented worked comparisons; ku<1/finite premises |
| Accumulation type/dot product | [3.2 Implementation](03-2-stable-primitives.md#implementation); all applicable | R3.33 reduction/split-K; R3.13 compute types | Representation/arithmetic separated; hidden schedule gap |
| Cancellation/conditioning | [3.2 Formulation](03-2-stable-primitives.md#formulation); P/F/M/E/A/C/S/V/R | Eq 3.10; R3.26 sections 2-4 | Analytical; exact cancellation uses absolute error |
| Graph construction/shared nodes | [3.3 Algorithm](03-3-automatic-differentiation.md#algorithm); P/F/M/E/A/I/C/S/V/R | Eq 3.11; R3.31 history; R3.18 sections 3-4 | Chain rule requires no dataset; executable composition unverified |
| Saved tensors/in-place mutation | [3.3 Mechanism](03-3-automatic-differentiation.md#mechanism); all applicable | R3.31 saved tensors/version checks | Official semantics; custom kernels not globally certified |
| Accumulation/unequal counts | [3.3 Formulation](03-3-automatic-differentiation.md#formulation); P/F/M/E/A/I/C/S/V/R | Eq 3.12; R3.32 effective batches | Objective identity; distributed treatment Chapter 19 |
| Global/value clipping and norms | [3.3 Mechanism](03-3-automatic-differentiation.md#mechanism); all applicable | R3.22 algorithm/section 4.2/Table 2; R3.40 | Source clipping distinct from regularizer; reference norm unexecuted |
| FP64 gradient checking | [3.3 Formulation](03-3-automatic-differentiation.md#formulation); P/F/M/E/A/I/C/S/V/R | Eq 3.14; R3.36/R3.46 | Conditional evaluation-error analysis; no universal threshold |
| Recomputation/checkpointing | [3.3 Extensions](03-3-automatic-differentiation.md#extensions); all applicable | R3.24 sections 4-5; R3.39/R3.49 | Actual MXNet ResNet/LSTM memory boundaries; replay-state limits |
| Storage/compute/accumulator roles | [3.4 Formulation](03-4-mixed-precision-execution.md#formulation); all applicable | R3.34; R3.3 section 3; P18 sections 3-4 | Retained-copy counting; allocation unmeasured |
| Static/dynamic loss scaling | [3.4 Algorithm](03-4-mixed-precision-execution.md#algorithm); all applicable | Eq 3.15; R3.32/R3.34; R3.3 section 4 | Actual SSD/LSTM protocol; skip/counter semantics explicit |
| Current/delayed scaling | [3.4 Mechanism](03-4-mixed-precision-execution.md#mechanism); all applicable | R3.43/R3.44 mechanism/history | Official ratio/history; staleness/zero boundaries; native test gap |
| MX/block scales and transposes | [3.4 Algorithm](03-4-mixed-precision-execution.md#algorithm); all applicable | R3.5 Algorithm 1/section 4; R3.45 | Separate cast/fine-tune/training studies; layout/copy costs |
| Master weights/update retention | [3.4 Formulation](03-4-mixed-precision-execution.md#formulation); all applicable | Eq 3.17; R3.3 section 3.1 | Neighbor interval; FP32-parameter AMP distinct from classic copies |
| Optimizer-state precision | [3.4 Mechanism](03-4-mixed-precision-execution.md#mechanism); all applicable at boundary | P13 section 3.3.3; P18; R3.29 section 3.3 | Representation/accounting here; full optimizer algorithms Chapter 20 |
| Fine-grained FP8/promotion | [3.4 Experimental design](03-4-mixed-precision-execution.md#experimental-design); all applicable | P13 section 3.3/AppB | Two-scale token budgets and failing ablation; hypothetical13B/parameter not model total |
| NVFP4/QuartetII/Full-Stack successors | [3.4 Extensions](03-4-mixed-precision-execution.md#extensions); P/F/M/E/I/C/X/O/S/L/V/R | R3.27 sections 3-4/AppE; R3.28 sections 3.3/6-7; R3.29 sections 3-4/AppH | Changed mechanisms, distinct studies; corner paths/native replication block review |
| Shapes/causal/padding/loss masks | [3.5 Formulation](03-5-reference-implementation.md#formulation); all applicable | Eqs 3.19-3.20; P01 sections 3.2.3/5-6; R3.37/R3.38 | Actual translation context; code consumes mask; packed boundaries caller-supplied |
| Initialization | [3.5 Formulation](03-5-reference-implementation.md#formulation); P/F/M/E/A/I/C/X/O/S/V/R | Eq 3.21; R3.30 section 4.2.1 | Source variance conditions; realized fixture state stored; no overflow guarantee |
| Deterministic fixtures | [3.5 Algorithm](03-5-reference-implementation.md#algorithm); P/F/M/E/A/I/C/S/V/R | Algorithm 3.11; R3.35/R3.47 | Reproducibility mechanism; fixtures ungenerated |
| Tiny-batch overfitting | [3.5 Observations](03-5-reference-implementation.md#observations); P/F/M/E/A/I/C/S/V/R | Conditional-entropy argument; proposed Experiment3.5 | Diagnostic only; no source guarantee of 0.01/300 |
| Seeds/RNG state and consumption | [3.6 Mechanism](03-6-reproducibility-limits.md#mechanism); P/F/M/E/A/I/C/S/L/V/R | R3.35 worker/randomness; R3.47 keys/split | Official semantics; stored-state replay unexecuted |
| Nondeterministic kernels/selection | [3.6 Implementation](03-6-reproducibility-limits.md#implementation); all applicable | R3.35; R3.13 section 2.1.4; R3.17 notes | Selection distinct from execution; guarantees library-scoped |
| Reduction order/hardware/version changes | [3.6 Mechanism](03-6-reproducibility-limits.md#mechanism); all applicable | R3.25 sections 3-5; R3.13 section 2.1.4 | Worked comparisons; no obsolete universal CPU/FMA or causal assertion |
| Tolerance relation/trajectory | [3.6 Formulation](03-6-reproducibility-limits.md#formulation); P/F/M/E/A/I/C/S/V/R | Eqs 3.22-3.23; Eq 3.9 | Asymmetric/nontransitive relation; conditional amplification, unresolved full budgets |

## 6. Revision closure

[DERIVED] The revision replaces universal error claims with conditional derivations, reconstructs actual source protocols and adds a reference that exercises its masks. Structural/syntax checks are separate from executable tests. All pages remain manuscript_draft. No fixture, benchmark, training, native precision kernel or two-run numerical comparison was executed; the audit does not claim exhaustive literature review.
