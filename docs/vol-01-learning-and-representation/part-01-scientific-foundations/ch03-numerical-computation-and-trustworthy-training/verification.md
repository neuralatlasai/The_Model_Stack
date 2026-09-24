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
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Verification — Chapter 03

Plan statement: *compare forward values and gradients against a high-precision reference across ordinary and extreme inputs.* This file expands that statement into an artifact specification, six proposed experiments, and acceptance criteria whose tolerances are derived from the unit roundoff of each format ([§3.1](03-1-numeric-representations.md), Table 3.1) and from the summation bounds of [§3.2](03-2-stable-primitives.md) (Eq. 3.9). No tolerance below is a vendor figure, and none was tuned against a run.

## 1. Artifact specification

The chapter artifact is a **numerically checked single-device training skeleton**.

| File | Contents | Fields |
|---|---|---|
| `formats.md` | Table 3.1 and the tolerance table of §3 below | format · bits · exponent bits · stored mantissa bits · ε · u · x_max · x_min^norm · x_min^sub · source label |
| `primitives.py` | Reference primitives and FP64 twins | `lse`, `softmax`, `log_softmax`, `rms_stats`, `ln_stats` (Algorithm 3.3), `blocked_sum` (Algorithm 3.4), `online_lse` (Algorithm 3.2); each takes `accum_dtype` explicitly |
| `skeleton.py` | The reference skeleton of [§3.5](03-5-reference-implementation.md) | `set_deterministic`, `attention_mask`, `shift_targets`, `masked_token_mean_ce`, `ModelStub`, `train_step`, `overfit_tiny_batch` |
| `fixtures/ordinary/` | Stored deterministic fixtures (Algorithm 3.11) | `ids.pt` [B,T] int64 · `key_mask.pt` [B,T] bool · `loss_mask.pt` [B,T] bool · `theta64.pt` · `y64.pt` [B,T,V] · `loss64.pt` · `grad64.pt` · `meta.json` (seed, shapes, versions, SHA-256 of each tensor) |
| `fixtures/extreme/` | Extreme-input cases E1–E8 (§2) with FP64 expected outputs | same fields plus `case_id`, `expected_finite` (bool mask), `defined_output` for fully masked rows |
| `checks.py` | Experiments 3.1–3.6 as executable checks | per check: `name`, `metric`, `observed`, `bound`, `headroom`, `verdict`, `first_failing_layer` |
| `manifest.json` | Algorithm 3.13 manifest | framework version+commit · device model · SM count · driver · toolkit · cuBLAS/cuDNN versions · deterministic flags · reduced-precision-reduction flags · `CUBLAS_WORKSPACE_CONFIG` · autocast dtype · FP8 recipe (or none) · all seeds · RNG-state hashes · fixture hashes · tolerance table used |
| `report.md` | Human-readable result | one row per check with verdict and attribution |

## 2. Verification task

**Central claim under test.** Every deviation of the skeleton's forward values and gradients from an FP64 reference is bounded by a tolerance derivable from the formats' unit roundoff and the reduction lengths involved; any excess indicates a defect (wrong primitive, wrong accumulation dtype, wrong VJP, wrong mask), not "noise".

**Extreme-input set.**

| Case | Input | What it exercises | Reference behavior |
|---|---|---|---|
| E1 | logits with max magnitude 10^4 | exp overflow (FP16 at z > 11.09, FP32 at z > 88.7) | finite log-probs by Eq. 3.6 |
| E2 | all logits equal | softmax = 1/V exactly representable only approximately | uniform; LSE = z + ln V |
| E3 | one finite logit, rest −∞ | masked rows with one survivor | probability 1 on the survivor |
| E4 | fully masked row | l = 0 in Algorithm 3.2 | `defined_output` = 0 and loss mask 0 |
| E5 | normalization row with |μ| ≈ 10^3, σ² ≈ 10^−6 | cancellation (Eq. 3.10) | non-negative variance within bound |
| E6 | activations in [2^−20, 2^−12] | FP16 subnormal/underflow region | nonzero in BF16/FP32; FP16 requires scaling |
| E7 | near-cancelling vector (x, −x + δ), |δ| ≈ u·|x| | reduction conditioning | error bounded relative to Σ|x_i| |
| E8 | reduction length 2^16 in BF16 storage | accumulation dtype | FP32-accumulated bound holds; BF16-accumulated bound does not |

### Experiment 3.1 — Format conversion obeys the unit-roundoff bound

- **Hypothesis.** For every in-range value, |fl(x) − x| ≤ u_fmt·|x| with u from Table 3.1.
- **Setup.** Convert FP64 values to FP32, FP16, BF16, `float8_e4m3fn`, `float8_e5m2`; convert back to FP64; compare.
- **Independent variables.** Target format; magnitude band 2^−30 … 2^30; values straddling x_max and x_min^sub.
- **Controlled variables.** Rounding mode (framework default), device, seed.
- **Dataset/workload.** 10^6 log-uniform magnitudes with random signs plus the boundary set.
- **Hardware.** Any; CPU suffices. Device recorded in manifest.
- **Metrics.** max relative error per band; count of non-finite outputs; count of saturations.
- **Baselines.** Algorithm 3.1 implemented in FP64 integer arithmetic.
- **Expected result.** Bound holds in the normal range; above x_max IEEE formats give ±∞ and E4M3 gives NaN or saturates (mode recorded).
- **Ablation.** Repeat under a fast-math/flush-to-zero build if available; expect subnormal-band violations.
- **Interpretation.** A normal-range violation means a non-round-to-nearest conversion path.
- **Threats to validity.** Framework casts may route through an intermediate dtype; the FP8 overflow mode is kernel-specific.

### Experiment 3.2 — Stable primitives versus FP64 twins

- **Hypothesis.** Each primitive of §3.2 satisfies bound T2 (below) on ordinary rows and cases E1–E8; the naive forms violate it or return non-finite values on E1, E5, E8.
- **Setup.** Run `primitives.py` in FP32, and in BF16 storage with FP32 accumulation; FP64 twins receive the *same rounded inputs*, so representation error and arithmetic error are separated.
- **Independent variables.** Primitive; naive vs stable form; accumulation dtype; reduction length n ∈ {2^8, 2^12, 2^16}.
- **Controlled variables.** Inputs, seed, device, deterministic flags, reduced-precision-reduction flags off.
- **Dataset/workload.** Rows ~ N(0,1) of width n, plus E1–E8.
- **Hardware.** One accelerator plus CPU FP64.
- **Metrics.** max_i |ŷ_i − y_i| / σ_i with σ_i = Σ|terms| of the reduction producing y_i; finiteness mask agreement.
- **Baselines.** FP64 twin; naive forms as negative controls.
- **Expected result.** Stable forms within T2; BF16-accumulated sum at n = 2^16 outside any useful bound.
- **Ablation.** Set `allow_bf16_reduced_precision_reduction = True` (the documented default) for the GEMM-based cases and report the change.
- **Interpretation.** Failure of a stable form localizes to accumulation dtype or reduction order.
- **Threats to validity.** Vendor kernels' internal order is NOT-DISCLOSED; the recursive-sum bound is therefore used for framework kernels and the blocked bound only for the reference implementation.

### Experiment 3.3 — FP64 finite-difference gradient check

- **Hypothesis.** The analytic gradient of the skeleton in FP64 agrees with central differences within T5.
- **Setup.** Algorithm 3.7 with h = 10^−5, R = 64 random unit directions, FP64 model on CPU.
- **Independent variables.** Fixture (ordinary, E1–E5); micro-batch structure (K = 1; K = 2 with unequal n_k).
- **Controlled variables.** Parameters, masks, deterministic settings.
- **Dataset/workload.** Stored fixtures.
- **Hardware.** CPU FP64 (or an accelerator with FP64 kernels).
- **Metrics.** |d̂_r − g·v_r| against atol + rtol·|g·v_r|.
- **Baselines.** `torch.autograd.gradcheck` with its documented FP64 defaults (eps 1e−6, atol 1e−5, rtol 1e−3) as a looser cross-check [OFFICIAL-DOCUMENTATION — R3.11].
- **Expected result.** Pass on all fixtures; the unequal-n_k case fails if accumulation uses equal weights instead of Eq. 3.12.
- **Ablation.** Repeat in FP32: expected error floor ≈ u_32·|f|/h ≈ 6e−3·|f|, i.e. uninformative; and mutate a saved tensor in place to confirm the version-counter error.
- **Interpretation.** A failure after Experiment 3.2 passes isolates the defect to a VJP or to the composition.
- **Threats to validity.** Non-smooth points (ties in max, clipping boundary) invalidate Eq. 3.14; fixtures avoid exact ties.

### Experiment 3.4 — Precision recipes and the lost-update prediction

- **Hypothesis.** Eq. 3.17 predicts which parameter elements fail to change on step 1 when the master copy is BF16; recipes with an FP32 master show none.
- **Setup.** Four recipes on the tiny-batch fixture: FP32; FP16 + dynamic loss scaling + FP32 master; BF16 + FP32 master; BF16 master.
- **Independent variables.** Recipe; learning rate ∈ {10^−3, 10^−4, 10^−5}.
- **Controlled variables.** Seed, fixture, optimizer hyperparameters, deterministic flags.
- **Dataset/workload.** Tiny-batch fixture.
- **Hardware.** One accelerator with BF16 and FP16 support.
- **Metrics.** norm-wise gradient error versus FP64 before step 1; fraction of elements with θ_1 = θ_0 and g ≠ 0; loss after N steps; count of skipped steps (FP16).
- **Baselines.** FP32 recipe; FP64 reference gradient.
- **Expected result.** Lost-update fraction equals the fraction of elements with |Δ| < 2^−8|w| for the BF16-master recipe and is zero otherwise.
- **Ablation.** Kahan-compensated BF16 update (one extra BF16 residual per parameter).
- **Interpretation.** Agreement confirms the master-weight requirement as a format consequence rather than folklore.
- **Threats to validity.** Tiny models have atypical |w|/|Δ| ratios; the prediction, not the fraction, is what transfers.

### Experiment 3.5 — Skeleton end-to-end and mutation tests

- **Hypothesis.** The skeleton's FP32 and BF16 forward values and gradients agree with stored FP64 values within T4/T6, it overfits the tiny batch to ℓ_min, and each seeded defect is caught.
- **Setup.** Algorithms 3.11 and 3.12; mutations: `triu` mask; padding term dropped from Eq. 3.20; `mean()` instead of masked mean; clip before unscale; equal-weight accumulation with unequal n_k; one-pass variance.
- **Independent variables.** Mutation; recipe.
- **Controlled variables.** Fixture, seed, deterministic flags.
- **Dataset/workload.** Ordinary and extreme fixtures.
- **Hardware.** One accelerator plus CPU FP64.
- **Metrics.** logits and gradient errors (T4, T6); final loss; per-mutation detection (which check fired).
- **Baselines.** Unmutated skeleton; FP64 twin.
- **Expected result.** Zero undetected mutations.
- **Ablation.** Remove each check in turn to show which mutations it alone detects.
- **Interpretation.** An undetected mutation is a gap in the test suite and is recorded as such.
- **Threats to validity.** The stub lacks attention, so the mask mutations are exercised fully only with the Chapter 05 model.

### Experiment 3.6 — Two-run step equivalence

- **Hypothesis.** With every manifest field pinned and deterministic flags on, two fresh-process runs are bitwise identical; otherwise they are tolerance-equivalent under T8 with an attributable cause.
- **Setup.** Algorithm 3.13 under settings (a) deterministic, single stream; (b) deterministic off; (c) a device with a different SM count; (d) CPU FP64 reference.
- **Independent variables.** Setting.
- **Controlled variables.** Fixture, seeds, framework build.
- **Dataset/workload.** Ordinary fixture, one forward+backward.
- **Hardware.** As declared per setting.
- **Metrics.** byte equality; max violation of Eq. 3.22; first differing layer; manifest diff.
- **Baselines.** Run A of each pair.
- **Expected result.** (a) bitwise; (b), (c) tolerance-equivalent; (d) within T4/T6.
- **Ablation.** Unset `CUBLAS_WORKSPACE_CONFIG` with two active streams.
- **Interpretation.** A non-bitwise result under (a) reveals an unlisted nondeterministic path.
- **Threats to validity.** Nondeterminism that did not manifest in two runs is not thereby absent.

**What would reject the central claim.** (i) Any ordinary-input comparison exceeding the hard bounds T1, T2, T4, or T6 with the reference primitives and accumulation flags as specified; (ii) any extreme case E1–E3, E5–E8 yielding a non-finite value where the FP64 reference is finite, or E4 yielding anything other than the defined output; (iii) a T5 failure at a smooth point; (iv) a lost-update fraction in Experiment 3.4 that departs from the Eq. 3.17 prediction; (v) a non-bitwise pair under setting (a) that cannot be attributed to a manifest field or a documented nondeterministic operation.

```figure
id: fig-3.34
kind: diagram
title: The Chapter 03 verification protocol
caption: >-
  Every experiment ends at the same gate, and every gate threshold comes
  from the tolerance table, not from a run. The emphasised path is the one
  the artifact exists for. The stored ordinary fixture goes through the
  end-to-end skeleton check with its mutations, and only a clean pass
  reaches acceptance before any scale-up. Extreme cases E1–E8 enter only the
  experiments whose failure modes they target. No experiment here has been
  executed. The diagram shows the proposed protocol.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-3.2", "DERIVED:eq-3.9", "DERIVED:eq-3.14", "DERIVED:eq-3.17", "DERIVED:eq-3.22"]
alt: >-
  Left-to-right diagram of the proposed verification protocol. Three inputs:
  10^6 log-uniform values with a boundary set, stored ordinary fixtures
  (Algorithm 3.11), and the extreme set E1 to E8. The CPU FP64 reference
  serves as ground truth. Six experiments: 3.1 format conversion (T1),
  3.2 stable primitives against FP64 twins (T2a, T2b, T3), 3.3 FP64
  finite-difference check (T5, h = 1e−5, R = 64), 3.4 precision recipes and
  the lost-update prediction (T10), 3.5 the skeleton end to end with mutation
  tests (T4, T6, T7, T9), and 3.6 two-run equivalence (T8, Algorithm 3.13).
  The tolerance table T1 to T10, derived from u and n and recorded in
  manifest.json, supplies the bounds. All experiments feed one gate: is any
  hard bound exceeded, or does any finiteness mask differ? If yes, the
  central claim is rejected under conditions (i) to (v). If no, the skeleton
  is accepted before any scale-up (§19.6). The emphasised path runs from the
  ordinary fixture through Experiment 3.5 and the gate to acceptance.
spec:
  direction: LR
  nodes:
    - { id: lu, kind: dataset, label: "10⁶ log-uniform values", sub: "2^−30 … 2^30 plus boundary set" }
    - { id: fo, kind: dataset, label: "ordinary fixtures", sub: "Algorithm 3.11, stored, hashed" }
    - { id: fe, kind: dataset, label: "extreme set E1–E8", sub: "10⁴ logits … n = 2^16 in BF16" }
    - { id: ref, kind: model, label: "FP64 reference", sub: "CPU twin" }
    - { id: e1, kind: process, label: "Exp. 3.1 format conversion", sub: "T1: |fl(x) − x| ≤ u·|x|", group: exps }
    - { id: e2, kind: process, label: "Exp. 3.2 stable primitives", sub: "T2a, T2b, T3", group: exps }
    - { id: e3, kind: process, label: "Exp. 3.3 FP64 finite differences", sub: "T5; h = 1e−5, R = 64", group: exps }
    - { id: e4, kind: process, label: "Exp. 3.4 precision recipes", sub: "T10: lost-update fraction", group: exps }
    - { id: e5, kind: process, label: "Exp. 3.5 skeleton and mutations", sub: "T4, T6, T7, T9", group: exps }
    - { id: e6, kind: process, label: "Exp. 3.6 two-run equivalence", sub: "T8; Algorithm 3.13", group: exps }
    - { id: tt, kind: metric, label: "tolerance table T1–T10", sub: "derived from u and n; never tuned" }
    - { id: man, kind: dependency, label: "manifest.json", sub: "records every tolerance used" }
    - { id: gate, kind: branch, label: "any hard bound exceeded or finiteness mismatch?", sub: "per check: observed vs bound" }
    - { id: rej, kind: state, label: "central claim rejected", sub: "conditions (i)–(v)" }
    - { id: acc, kind: state, label: "skeleton accepted", sub: "before any scale-up (§19.6)" }
  edges:
    - { from: lu, to: e1 }
    - { from: fo, to: e2 }
    - { from: fo, to: e3 }
    - { from: fo, to: e4 }
    - { from: fo, to: e5, kind: emphasis }
    - { from: fo, to: e6 }
    - { from: fe, to: e2 }
    - { from: fe, to: e3 }
    - { from: fe, to: e5 }
    - { from: ref, to: e2, kind: dependency }
    - { from: ref, to: e3, kind: dependency }
    - { from: ref, to: e5, kind: dependency }
    - { from: ref, to: e6, kind: dependency, label: "setting (d)" }
    - { from: e1, to: gate }
    - { from: e2, to: gate }
    - { from: e3, to: gate }
    - { from: e4, to: gate }
    - { from: e5, to: gate, kind: emphasis }
    - { from: e6, to: gate }
    - { from: tt, to: gate, kind: dependency, label: "bounds" }
    - { from: man, to: tt, kind: dependency }
    - { from: gate, to: rej, label: "yes" }
    - { from: gate, to: acc, kind: emphasis, label: "no" }
  groups:
    - { id: exps, label: "six proposed experiments" }
```

## 3. Acceptance criteria

Constants: u_64 = 2^−53 ≈ 1.11e−16; u_32 = 2^−24 ≈ 5.96e−8; u_fp16 = 2^−11 ≈ 4.88e−4; u_bf16 = 2^−8 ≈ 3.91e−3; γ_k(u) = k·u/(1 − k·u) [MATHEMATICALLY-DERIVED — Eq. 3.2, Eq. 3.9].

```figure
id: fig-3.35
kind: stat-panel
title: The tolerance table, recomputed from its derivations
caption: >-
  The table's numeric rows, recomputed from the constants line at
  n = 4096, c = 4, K = 128. Each value matches the table to the digits the
  table prints (8.2e−6, 2.4e−4, 3.1e−5, 1.2e−2). The T5 ratio confirms that
  atol = 1e−8 is about 5× the Eq. 3.14 truncation-plus-rounding sum at the
  stated norms. If a row here and the table ever disagree, one of them has
  been tuned.
placement: rail
anchor: 3-acceptance-criteria
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.9", "DERIVED:eq-3.14", "DERIVED:eq-3.23"]
alt: >-
  Instrument panel recomputing the acceptance tolerances at n = 4096,
  headroom c = 4 and block size K = 128. u₃₂ = 2^−24 ≈ 5.96e−8. T2a, the
  blocked reference bound γ_{K+⌈log₂(n/K)⌉+c}(u₃₂) = γ_{137}: 8.17e−6. T2b,
  the hard bound γ_{n+c}(u₃₂) = γ_{4100}: 2.44e−4. T2b review gate
  8·√n·u₃₂: 3.05e−5. T3, 3·u_bf16 + T2b: 1.20e−2. T8, twice T2b: 4.89e−4.
  T5: atol 1e−8 is 5.63 times the sum of the truncation bound
  h²/6·100 ≈ 1.67e−9 and the rounding bound u₆₄·10/h ≈ 1.11e−10. T9 floor
  0.01 nats within 300 steps. T10 tolerance 0.01 absolute.
spec:
  header: "TOLERANCES · DERIVED, NOT TUNED"
  variables: { n: 4096, c: 4, K: 128 }
  rows:
    - { key: "u₃₂ = 2^−24", formula: "2^-24", format: raw }
    - { key: "T2a, γ_{K+⌈log₂(n/K)⌉+c}(u₃₂)", formula: "(K + ceil(log2(n/K) - 0.000001) + c)*2^-24/(1 - (K + ceil(log2(n/K) - 0.000001) + c)*2^-24)", format: raw }
    - { key: "T2b, γ_{n+c}(u₃₂)", formula: "(n + c)*2^-24/(1 - (n + c)*2^-24)", format: raw }
    - { key: "T2b review gate, 8·√n·u₃₂", formula: "8*sqrt(n)*2^-24", format: raw }
    - { key: "T3, 3·u_bf16 + T2b", formula: "3*2^-8 + (n + c)*2^-24/(1 - (n + c)*2^-24)", format: raw }
    - { key: "T8, 2 × T2b", formula: "2*(n + c)*2^-24/(1 - (n + c)*2^-24)", format: raw }
    - { key: "T5 atol", value: "1e−8" }
    - { key: "T5 atol ÷ (truncation + rounding)", formula: "0.00000001/(0.00001^2/6*100 + 2^-53*10/0.00001)", format: ratio, note: "‖f‴‖ ≤ 100, |f| ≤ 10, h = 1e−5" }
    - { key: "T9 floor", value: "0.01 nats in 300 steps" }
    - { key: "T10 tolerance", value: "0.01 absolute" }
```

| Id | Comparison | Metric | Hard bound (reject if exceeded) | Review gate (flag) | Derivation |
|---|---|---|---|---|---|
| T1 | format conversion, normal range | \|fl(x) − x\| / \|x\| | u_fmt (Table 3.1) | — | Eq. 3.2 |
| T2a | reference primitive, FP32 accumulation, blocked K = 128, length n, c elementwise ops per term | err / Σ\|terms\| | γ_{K+⌈log₂(n/K)⌉+c}(u_32); n = 4096, c = 4 → 8.2e−6 | — | Eq. 3.9 pairwise/blocked |
| T2b | framework kernel of unknown order, FP32 accumulation | err / Σ\|terms\| | γ_{n+c}(u_32); n = 4096 → 2.4e−4; n = 65536 → 3.9e−3 | 8·√n·u_32: 3.1e−5; 1.2e−4 | Eq. 3.9 recursive; Eq. 3.23 for the gate |
| T3 | BF16-stored operands vs unrounded FP64 inputs (representation error, reported separately) | err / Σ\|terms\| | 2u_bf16 + u_bf16 + T2b ≈ 1.2e−2 for dot products | — | two operand roundings + output rounding |
| T4 | skeleton logits, FP32 vs FP64, layer-isolated (each layer fed the FP64 input cast down) | per-layer err / Σ\|terms\| | T2b with that layer's n | end-to-end: N_red·γ_{n_max}(u_32)·κ with κ = 10 | per-layer DERIVED; κ ASSUMED — sensitivity: a larger κ loosens only the *flag*, not the per-layer hard bound |
| T5 | FP64 analytic vs central difference, h = 10^−5 | \|d̂ − g·v\| | atol = 1e−8, rtol = 1e−6 | — | Eq. 3.14: truncation h²/6·‖f'''‖ ≤ 1.7e−9 for ‖f'''‖ ≤ 100; rounding u_64·\|f\|/h ≤ 1.1e−10 for \|f\| ≤ 10; atol is ≈ 5× the sum |
| T6 | FP32 (or BF16-operand, FP32-accumulated) gradients vs FP64 gradients, per parameter tensor | ‖g − g_64‖₂ / ‖g_64‖₂ | layer-isolated: T2b with the VJP's n | end-to-end as T4 | VJPs are reductions of the same lengths |
| T7 | extreme inputs | finiteness mask; defined outputs | exact agreement of the finiteness mask with the reference; E4 equals `defined_output` | — | categorical |
| T8 | two-run equivalence | Eq. 3.22 | bitwise under setting (a); otherwise atol/rtol = 2× the T2b/T4/T6 bound of each output | — | both runs lie within the bound of the exact value (triangle inequality) |
| T9 | tiny-batch overfit | final token-mean loss | ≤ ℓ_min = 0.01 nats within N_steps = 300 | — | ASSUMED acceptance value for a memorizable fixture; sensitivity: fixture size and learning rate |
| T10 | lost-update prediction | \|observed fraction − predicted fraction\| | ≤ 0.01 absolute | — | Eq. 3.17 is elementwise-exact up to ties at the rounding boundary |

All errors for reductions are measured against Σ|terms|, not against the result, because Eq. 3.9 bounds the former and the latter is unbounded under cancellation (Eq. 3.10). Tolerances are recorded in `manifest.json`; a tolerance may be changed only by changing its derivation.

## 4. What this edition did not do

This protocol is a proposal. No experiment above was executed for Edition 1.0; no fixture was generated; the reference skeleton in §3.5 was written against the PyTorch 2.14 documentation (accessed 2026-09-20) and was not run. Expected results are predictions from the derivations in §3.1–§3.6, not observations. No statement in this chapter carries either of the two Appendix H labels reserved for executed experiments and inspected code; every experiment here is a proposal.
