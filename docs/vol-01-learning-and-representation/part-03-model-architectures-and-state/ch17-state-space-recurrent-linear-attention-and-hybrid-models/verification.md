---
id: ms.verification.17
entity_type: verification
title: "Chapter 17 verification"
short_title: "Chapter 17 verification"
section: null
slug: verification
parent: ms.chapter.17
prev_sibling: null
next_sibling: null
children: []
prerequisites: [ms.chapter.2, ms.chapter.13, ms.chapter.14, ms.chapter.15]
downstream: [ms.chapter.27, ms.chapter.42]
word_count_target: 1200
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


# Chapter 17 — Verification and reproducibility protocol

## Artifact and scientific question

**PROPOSAL.** Build **a sequence-model comparison under explicit state budgets**. Test how recall and generation quality change with sequence length while measuring persistent state and compute separately. The comparison includes attention, selective state-space, normalized feature-attention, delta-rule, and hybrid configurations. It does not assume that one family is best.

The artifact is a research record, not a deployment implementation. This chapter supplies its schema and acceptance criteria. The proposed model runs have not been performed, and no result file should be populated with invented measurements.

## Implementation

| Record | Required fields | Reason |
|---|---|---|
| Operator manifest | Equation identifier, tensor orientation, feature map, masks, read/write order, initialization, resets, gate ranges, normalization, denominator policy | Distinguish operator changes from implementation changes |
| Architecture ledger | Ordered layer types, dimensions, attention-head sharing, windows, feed-forward form, parameter-count convention | Make matched-budget claims auditable |
| State inventory | Component name, shape, dtype, logical owner, bytes, lifetime, prefix boundary, reset and restoration method | Count all prefix-dependent storage |
| Training record | Checkpoint hash, tokenizer hash, data/split identity, token budget, training-length distribution, objective, optimizer, seeds, precision | Identify quality confounders |
| Workload manifest | Generator revision, mapping seeds, task family, length, association count, distance, revisions, key similarity, distractor density, target length | Separate information load from token load |
| Quality record | Request identity, prompt, reference, full generated output, decoding policy, stopping reason, score, invalid-output status | Permit independent rescoring |
| Execution record | Hardware, device count, topology, precision, runtime/compiler/kernel revisions, concurrency, input/output distribution, warm-up, timing boundary | Make cost comparisons interpretable |
| Memory record | Persistent payload, temporary live allocation, peak live allocation, allocator reservation, weights, metadata, measurement boundary | Prevent category overlap |
| Decision record | Quality threshold, resource limit, accepted cells, rejected cells, uncertainty method, failures, limitations | Restrict conclusions to measured conditions |

No unknown field receives a plausible default. Use **NOT-DISCLOSED** for missing public training details and **UNVERIFIED** for a check not performed. Exclude configurations from comparisons that require unavailable matching information, or label the comparison observational rather than controlled.

## Gate A — Mathematical and operator correctness

**MATHEMATICALLY-DERIVED.** The following fixtures have exact expected behavior independent of a trained checkpoint.

1. **Affine composition.** Compare three sequential affine updates with both parenthesizations of Eq. 17.4. Preserve chronological order. Include noncommuting transitions in the eventual tensor reference.
2. **Discretization at zero.** Verify that the scalar input coefficient tends to $\Delta b_{\mathrm{in}}$ as $a\to0$ and that the transition tends to one. Compare direct subtraction with cancellation-aware evaluation.
3. **Normalized feature attention.** Compare explicit causal sums with Eq. 17.9 for strictly positive features. Test current-inclusive and strict-past variants separately.
4. **Collision construction.** Two identical key features with distinct values must produce their normalized average when no other pairs are admitted and overlap is positive.
5. **Delta overwrite.** At a unit key with full update strength, Eq. 17.14 must recover the incoming value immediately after writing.
6. **Orthogonal correction.** An orthogonal query receives no delta correction relative to the already-decayed state.
7. **Gate placement.** The worked state $(4,7)$, first-coordinate key, incoming value $2$, decay $1/2$, and update strength one yields $(2,3.5)$ under Eq. 17.13. Applying decay after the complete ungated update yields $(1,3.5)$.
8. **State ledger.** Direct tensor-element counts must equal the corresponding symbolic payload formula, including the linear-attention normalizer.

For gradient checks, compare the scalar loss derivative with respect to inputs, gates, and initial state on short bounded cases. A forward-only match does not validate a training kernel. Declare absolute and relative tolerances before evaluating the optimized path and record maximum errors by tensor.

## Gate B — Complete-state continuation

**PROPOSAL.** Split each bounded test sequence at several positions, including inside a nominal training chunk. Continue from the saved state on the same suffix. Compare outputs and final states with uninterrupted evaluation.

For a hybrid, include recurrent matrices, convolution buffers, attention valid lengths, positional metadata, and any normalization accumulator. A logical boundary must refer to the same accepted prefix for every layer. Test independent-sequence resets, padding, zero-length continuation, and interleaved requests.

Then branch the same prefix into two different suffixes. Verify that one branch's writes cannot alter the other's state. Test rejection of one, several, and all speculative tokens. Truncating an attention cache alone is insufficient when recurrent state has advanced. The proposed acceptance condition is equality to the non-branching reference within declared numerical tolerance.

## Gate C — Information-access evaluation

**PROPOSAL.** Use disjoint development and held-out mapping seeds. Generate unpredictable key/value assignments after the training data are fixed. Evaluate at a predeclared grid spanning within-training lengths and longer lengths.

The task grid must include:

- Single delayed association with varied distractor length.
- Multiple independent associations at fixed total length.
- Fixed association count with varied query distance.
- Repeated keys with explicit last-write-wins semantics.
- Queries for historical versions, scored separately from revision tasks.
- Exact copying with varied target length and a fixed alignment policy.
- Held-out natural-text prediction and generation under a separately described corpus protocol.

A query revealed before the prefix permits selective retention of its target and does not test the same bound as an unknown delayed query. Preserve this distinction in task metadata. Masking the answer in the displayed text is insufficient if generation templates leak it through identifiers, lengths, or deterministic ordering.

Report exact-match and token-level metrics separately. Use paired evaluation requests across models. Estimate uncertainty at the independent document or mapping-seed level, not at the level of correlated queries alone. Training-seed variation is a separate source of uncertainty.

## Gate D — Resource and timing boundaries

**PROPOSAL.** Enumerate actual state tensors at several sequence lengths before timing. Confirm whether storage is fixed, window-bounded, or grows with the full prefix. Report persistent state independently of weights and temporary activations.

Measure prefill and decode separately. Use a fixed generated-token workload for controlled timing and a natural stopping workload for end-to-end quality. Record both rather than conflating them. Warm compilation and kernel selection before steady-state measurements; retain a separate cold-start record if startup matters.

Every latency or throughput number must appear with the following context:

| Hardware | Model | Precision | Sequence length | Input/output distribution | Concurrency | Runtime version | Measurement boundary |
|---|---|---|---|---|---|---|---|
| UNVERIFIED until measured | Exact checkpoint and architecture | Weights, operands, accumulation, state | Prompt and retained lengths | Declared prompt distribution and generated length | Declared requests/batch | Framework, compiler, kernels, driver | Prefill, decode, or end-to-end; included transfers and synchronization |

This row is a schema, not a performance result. Record out-of-memory events and numerical failures without silently removing them from the evaluated region. For energy or cost studies, add measurement instrumentation and the same quality threshold; neither is inferred from FLOPs alone.

## Gate E — Matched comparisons and crossovers

**DERIVED.** Equal-parameter, equal-training-compute, and equal-state-budget comparisons answer different questions. Publish them as separate panels. If widths are adjusted to meet a state budget, record the resulting parameter and arithmetic changes.

Fit the local latency model in Eq. 17.21 only within a measured regime where its residuals are acceptable. A negative or undefined intersection does not become a meaningful positive crossover. A fit outside the observed length range is an extrapolation, not a measured result. Kernel changes or memory limits may require separate regimes.

Apply the quality threshold before selecting a cost winner. A faster configuration that fails exact recall is outside the feasible set for an exact-recall application, even if it remains appropriate for a less stringent workload. Preserve this task dependence in the conclusion.

## Failure modes

Reject or narrow a claim when any of the following occurs:

- “Constant state” excludes a growing cache, retained transcript, or auxiliary index.
- “Equivalent implementation” fails operator or continuation checks.
- “Exact overwrite” is asserted without the required key normalization and gate conditions.
- “Softmax-equivalent” is inferred merely from feature-map reassociation.
- “Better extrapolation” changes independent information count or training exposure without reporting it.
- “Faster generation” compares different generated work or omits synchronization.
- “Hybrid memory savings” counts layers instead of actual tensor payload.
- “General winner” is inferred from one task, length, or hardware configuration.

These are scope and correctness criteria. A failure should identify the violated premise and the affected claim, rather than invalidate unrelated observations.

## Reproducibility

**Editorial checks, 2026-09-27.** The six sections follow the required fifteen-part structure and each exceeds 1,500 prose words. The chapter contains twenty unique figure records and twenty-two numbered equations. Chapter-local figures, references, frontmatter, and experiment fields were checked with the existing compiler in memory; no application build outputs were written. Planned downstream chapters link through the existing book index.

Independent bounded arithmetic checks confirmed affine associativity, the scalar discretization limit, recurrent versus explicit normalized feature attention, the delta overwrite fixture and alternative gate placement, hybrid payload arithmetic, and the equal-factor chain-rule illustration. These checks concern authored mathematical examples, not trained models or accelerator performance.

Repository-wide validation remains separate: existing Chapter 8 figure diagnostics are outside this chapter's scope. They are not concealed by the chapter-specific checks and were not edited here.

**UNVERIFIED:** all trained-model quality, accelerator timing, gradient-kernel equivalence, energy, deployment cost, and empirical crossover claims remain open. The final editorial check must preserve this distinction.

## References

The source versions and access dates are recorded in [references.md](references.md). The mechanisms and formulas under test are specified in [17.1](17-1-recurrent-state.md), [17.2](17-2-state-space-models.md), [17.3](17-3-linear-attention.md), [17.4](17-4-delta-rule-mechanisms.md), [17.5](17-5-hybrid-composition.md), and [17.6](17-6-evaluation-boundaries.md).

