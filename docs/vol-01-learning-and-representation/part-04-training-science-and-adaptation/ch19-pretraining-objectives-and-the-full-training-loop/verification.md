---
id: ms.verification.19
entity_type: verification
title: Verification — Pretraining objectives and the full training loop
short_title: Verification 19
volume: 1
part: 4
chapter: 19
section: null
slug: verification
parent: ms.chapter.19
prev_sibling: ms.section.19.6
next_sibling: ms.references.19
children: []
prerequisites: [ms.chapter.6, ms.section.19.1, ms.section.19.2, ms.section.19.3, ms.section.19.4, ms.section.19.5, ms.section.19.6]
downstream: [ms.chapter.20, ms.chapter.29, ms.chapter.30]
related: []
relations: []
axes: {lifecycle: [pretraining, evaluation], mechanism: [verification, training_loop], feedback_setting: [], modality: [text]}
papers: [P02, P13, P44]
implementations: [impl.pytorch, impl.torchtitan]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [DERIVED, ASSUMED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1200
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# Verification — Chapter 19

## Artifact specification

[DERIVED] The artifact named by the plan is a complete single-device reference training recipe. This chapter specifies it mathematically; no programming listings are required. An implementation must materialize the following versioned records before its measurements can validate the recipe.

| Record | Required fields |
|---|---|
| Objective | Corpus/processor identities; transform law and boundary; inputs/targets; visibility; masks; per-component counts and weights |
| Window | Ordered records; microbatch partition; scored targets by sequence/component; total denominator; final-window policy |
| Update | Unique parameter identities and groups; initializer; dtypes; numerical scale; clipping boundary; optimizer/scheduler identity and clocks |
| Checkpoint | Complete state in Eq. 19.12; immutable configuration identity; next logical record; payload lengths/digests; publication guarantee |
| Monitoring | Slice definitions; raw sums/counts; attempts and acceptances; numerical failures; gradient/parameter/activation diagnostics; timing boundary |
| Handoff | Changed execution factor; invariant/tolerance tests; tested shapes; resources; outcomes; unresolved conditions |

## Verification task

[ASSUMED] The proposed local protocol uses a small decoder-only model and a fixed, authorized tiny corpus with no stochastic record transformation. Choose dimensions that fit the available device and record them before execution; no named model or accelerator is implied. Disable dropout for the deterministic reference comparisons. Use FP64 where supported for a numerical reference and FP32 for the first candidate; other precision paths require their own tolerances. Fix tokenizer, boundary handling, model initialization, optimizer groups, and objective counts.

### Experiment 19.1 — Finite-objective and state checks

[ASSUMED] Use a horizon of at most 1,000 accepted updates for the fitting diagnostic and a restart comparison horizon of 20 accepted updates. Require the tiny-corpus target loss to fall by at least 50% from its initial finite value, with exact data/mask identity. These thresholds are proposed diagnostic inputs, not source-reported results or a convergence theorem. If the fit criterion fails, investigate expressivity, initialization, objective alignment, gradients, and optimization before attributing the failure to one mechanism.

[DERIVED] The accumulation test starts from an identical state and compares the same finite scored-event set as one batch versus several unequal-count microbatches. Include the 2/6-target analytical example, a zero-target microbatch within a positive-count window, a completely empty window, and an accepted partial final window. Compare scalar loss and all pre-clipping gradients, then parameters and moments after one update. A comparison that matches only the scalar loss does not pass.

[DERIVED] The checkpoint test branches at an accepted boundary: continue one branch uninterrupted and restore the other in a fresh process. Check the next record identity, augmentation state, target mask, denominator, learning rate, normalized gradient, optimizer moments, parameters, and accepted-update counter. Inject an incomplete unpublished generation and verify that recovery refuses it. A changed parameter count, tokenizer identity, or state schema must fail validation rather than silently warm start.

[DERIVED] The monitoring test constructs fixed slice losses with changing target proportions and checks Eq. 19.15. Inject a nonfinite attempt and verify that its raw diagnostic/status remain visible while the finite ratio excludes it and accepted counters remain consistent. Record whether the series includes all attempts or accepted updates. Verify overlapping-slice reporting cannot be mistaken for an exhaustive partition.

### Acceptance criteria

| Gate | Proposed criterion | Rejection consequence |
|---|---|---|
| Record and target identity | Exact equality of discrete identities, boundaries, masks and counts | Objective mismatch |
| FP64/FP32 local comparison | Absolute error at most 1e-6 and relative L2 error at most 1e-5, with a declared 1e-12 norm floor | Numerical-path investigation; tolerances must be justified before loosening |
| Empty/rejected window | Exact equality of accepted parameter/optimizer/scheduler state; explicit attempt/data policy | State-transition mismatch |
| Restart, same deterministic environment | Identical discrete state; numerical tolerances declared per tensor and replay horizon | State-closure or transition-map investigation |
| Partial generation | Not selectable as a published checkpoint | Storage-commit failure |
| Monitoring | Correct numerator/denominator and attempt/accept identities | Metric-estimand mismatch |
| Handoff | All declared gates resolved and resource measurements within the predetermined budget | Candidate remains unaccepted or unresolved |

[ASSUMED] Numerical thresholds above are starting protocol choices for the declared local comparison, not universal BF16/FP8 tolerances. The reference norm floor, absolute bound, and relative bound have to be scaled to each quantity's units where necessary. Exact deterministic replay is requested only inside an unchanged deterministic environment; other cases require a separately specified statistical comparison.

## What this edition did not do

No model was trained, no checkpoint replay experiment was executed, and no engine throughput, power, energy, or cost was measured for this chapter. Mathematical/example arithmetic, manuscript compilation, figure validation, and browser rendering checks are editorial/software checks; they do not constitute empirical training evidence. No training result is labelled EMPIRICALLY-OBSERVED.

## Topic-completeness audit

This audit maps the chapter matrix to substantive manuscript treatment. A mapped heading does not certify exhaustive literature coverage, successful experiments, or reviewed scientific status.

| Required topic / variant | Manuscript anchors | Primary locator / derivation | Remaining gap and consequence |
|---|---|---|---|
| Autoregressive, denoising, infilling | 19.1 Formulation, Mechanism, Experimental design, Extensions | P02 §§3.1–3.3; R19.18 §§3,4.4; Eqs.19.1–19.2 | Exact fetched FIM PDF revision UNVERIFIED; no contemporary universal objective optimum |
| Auxiliary multi-token objectives | 19.1 Mechanism, Algorithm, Implementation | R19.19 §2 and Figure 2; Eq. 19.2 | Exact fetched PDF revision UNVERIFIED; no generic zero-overhead claim |
| Multimodal generative/contrastive objectives | 19.1 Mechanism; 19.2 additivity boundary | P44 §2.3 and Figure 3; contrastive singleton derivation | No matched cross-family study; conditional likelihood and candidate-set objective stay distinct |
| Microbatch and optimizer-step batch | 19.2 Formulation and Methodology | Eqs.19.3–19.5; R19.23 defect analysis | Training equivalence unexecuted |
| Accumulation, valid-target counts, variable lengths | 19.2 Mechanism and Algorithm | Eqs.19.4–19.7; R19.20 class-index reduction; R19.22 accumulation | Runtime numerical tolerance UNVERIFIED |
| Weighted/sequence objectives and distributed reduction | 19.2 Sequence means and Distributed averaging | Eq. 19.6; R19.21 averaging note | Custom reducers and target ownership need exact-path checks |
| Initialization, forward/backward, optimizer and clipping | 19.3 Mechanism and Algorithm | Eqs.19.8–19.11; R19.24 algorithm; R19.25 norm contract | Architecture-specific initializer and installed fused path need configuration-level checks |
| Schedule and numerical checks | 19.3 clock and acceptance contract | Eqs.19.8,19.11; R19.22 scale ordering | No convergence or globally optimal schedule claim |
| Iterator, RNG, scheduler, optimizer, model state | 19.4 Formulation and Methodology | Eqs.19.12–19.13; R19.26 general checkpoint; R19.27 reproducibility boundary | Loader/storage-specific closure UNVERIFIED; ingestion mechanics canonical in12.5 |
| Checkpoint contents and resume invariants | 19.4 Algorithm, Implementation, Failure modes | State-closure induction; generation-consistency procedure | Storage publication guarantee and fresh-process replay UNVERIFIED |
| Slice loss, gradient/parameter norms, activations | 19.5 Formulation and Mechanism | Eqs.19.10,19.14–19.16; R19.28 §§3.1–3.3 | Alert calibration and instrumentation overhead unmeasured |
| Learning-rate traces and early instability | 19.5 Methodology, Observations | R19.28 §3.2 and Figure 8; accepted/attempt-clock derivation | No universal causal diagnostic or false-alarm rate |
| Correctness gates and pilot design | 19.6 Methodology and Algorithm | Eqs.19.17,19.19; proposed protocol above | Book pilot unexecuted |
| Resource estimates and distributed prerequisites | 19.6 resource ledger and prerequisites | Eq. 19.18; P13 Appendix B.1; 19.2 ring payload accounting | Exact kernels/topology/energy/cost UNVERIFIED or NOT-DISCLOSED |

**Applicable completeness obligations.** Every section supplies its problem, formal contract, methodology, mathematical procedure, costs, implementation boundary, observations, alternatives, extensions, failures, and reproducibility conditions. §§19.3–19.4 use inspected interface disclosures rather than originating performance experiments: a training benchmark is not applicable to their API semantics, and no performance gain is asserted. Their transition correctness remains subject to the proposed tests. Algorithmic accounting has no observed hardware latency until executed. Hardware- and storage-specific results are therefore not fabricated to fill a completeness cell.

**Review consequence.** Keep `editorial_status: manuscript_draft`. Exact source revision gaps, unresolved execution/storage contracts, and unexecuted training verification remain visible. The chapter is authored; it is not independently validated or released.
