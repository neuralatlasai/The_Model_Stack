---
id: ms.verification.13
entity_type: verification
title: Verify dense architecture accounting
short_title: Verification
section: null
slug: verification
parent: ms.chapter.13
prev_sibling: ms.section.13.6
next_sibling: ms.references.13
children: []
prerequisites: [ms.chapter.5, ms.chapter.10, ms.section.13.1, ms.section.13.2, ms.section.13.3, ms.section.13.4, ms.section.13.5, ms.section.13.6]
downstream: [ms.chapter.14, ms.chapter.19, ms.chapter.21]
word_count_target: 1700
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

# Verify dense architecture accounting

**PROPOSAL.** Produce the parameter/FLOP model specified by Chapter 13 and demonstrate why equal parameter counts do not determine equal training or inference costs. This protocol specifies an executable research artifact; the deliverable in this folder is its documentation. No training, profiling, or deployment experiment is claimed as completed.

## Artifact contract

**DERIVED.** The artifact must reconstruct each aggregate from independently inspectable records. A single total without its contributing tensors, operations, and exclusions is insufficient. Suggested record names below are logical interfaces; they do not mandate a file format.

| Record | Required fields | Invariant |
|---|---|---|
| Architecture specification | Family; encoder/decoder depths; residual widths; Q/K/V and output projection dimensions; head counts and head dimensions; feed-forward map and widths; biases; normalization axes, epsilon, gain and offset; residual scale and placement; positional parameters; vocabulary and task heads | Every executed learned map has an explicit shape and owner |
| Parameter inventory | Stable logical tensor ID; shape; scalar count; ownership/alias group; trainable/frozen status; logical and padded dimensions; physical placement | Sum distinct logical owners once; report padding and replicas separately |
| Operator ledger | Operator ID; phase; input/output shapes; invocation count; multiply-add convention; counted arithmetic; exclusions | Every FLOP total is reproducible from this ledger |
| State ledger | Tensor category; elements; storage and accumulation dtype; bytes; allocation/free boundary; retention and recomputation policy; rank placement | Peak live bytes are a maximum over simultaneous lifetimes, not a sum of all temporaries |
| Workload contract | Batch and length distributions; source/target roles; masks; objective; projected-position count; prefill/decode boundary; generated lengths; concurrency | Compared runs use the same declared population or explicitly report the difference |
| Execution identity | Framework version; repository commits; model/tokenizer revisions; device and topology; driver/runtime; precision policy; kernel flags; parallelism; checkpointing | Missing identities remain unresolved; a moving URL does not replace a commit |
| Comparison record | Matched budget; tolerance; residual mismatches; seeds; search budget; quality metrics and evaluation population; latency boundary; uncertainty | Conclusions are conditional on the stated controls |
| Evidence manifest | Source keys; primary URLs; inspected sections; access dates; claim label; derivation dependencies | Source claims and original calculations remain distinguishable |

**DERIVED.** Check integer dimensions, divisibility, nonnegative lengths, valid vocabulary ranges, and alias consistency before computing totals. Reject nonintegral or unsupported architecture candidates instead of silently rounding them. If hardware alignment requires padding, retain both the logical count and the allocated count and identify which one the comparison matches.

**DERIVED.** Count matrices from shapes independently of the closed-form expression being tested. Repeating Eq. 13.4 in another function only checks duplicated arithmetic. A stronger check enumerates the architecture's distinct tensor owners and reconciles the resulting sum with the formula, including norm gains, biases, positional parameters, auxiliary heads, and final normalization.

## Formulation

**MATHEMATICALLY-DERIVED.** The following fixtures are constructed from the chapter's equations. They are exact arithmetic targets within their stated boundaries, not performance observations.

| Fixture | Declared inputs and boundary | Expected result | Defect exposed |
|---|---|---|---|
| Cross-attention projections | Eq. 13.2; decoder, encoder and projected widths all 1024; four bias-free matrices | 4,194,304 parameters | Missing encoder-side K/V projections |
| Body allocation A | Eq. 13.4 body only; 24 blocks, residual/attention width 1024, two-matrix FFN width 4096 | 301,989,888 parameters | Confusing body allocation with whole-model total |
| Body allocation B | Eq. 13.4 body only; 6 blocks, residual/attention width 2048, two-matrix FFN width 8192 | 301,989,888 parameters | Inferring equal embeddings from equal body totals |
| Projection-matched FFN | Eq. 13.8; residual width 1536; plain width 6144; gated width 4096; no biases | 18,874,368 projection parameters in either branch | Keeping expansion width fixed when adding a third matrix |
| Output projection | Eq. 13.15; 1024 projected positions, width 1024, vocabulary 32768; multiply-add = 2 FLOPs | 68,719,476,736 FLOPs; materialized logits at 2 bytes/element occupy 67,108,864 bytes | Equating tied parameters with eliminated output computation |
| Full score tensor, 8 heads | Eq. 13.6; one batch element, length 1024, 2 bytes/element | 16,777,216 bytes per materialized score tensor | Omitting head multiplicity |
| Full score tensor, 16 heads | Same batch, length, dtype, residual and projected widths; head dimension halved | 33,554,432 bytes per materialized score tensor | Treating fixed projection shapes as fixed activation storage |
| Body-matched forward difference | Eq. 13.19; A minus B; full-position head; vocabulary 32768; full-square attention matrix work | −16,777,216 FLOPs/token at length 1024; +134,217,728 at length 4096 | Claiming a sequence-independent ordering |
| Residual variance | Eq. 13.13; stream and branch variances 1, covariance 0, branch scale 0.1 | 1.01 | Dropping or mis-scaling the quadratic term |

**MATHEMATICALLY-DERIVED.** The exact whole-model counterexample fixes all learned tensor shapes, including vocabulary and normalization, and changes only the head partition from 8 heads of dimension 128 to 16 heads of dimension 64, with projected width 1024. Choose ordinary multi-head attention with no head-specific learned tensors and identical remaining architectural choices. Unique parameter counts are equal. The two explicitly materialized score tensors above differ by a factor of two. Leading QK and AV matrix arithmetic remains unchanged at fixed total projected width, while elementwise score operations have a different head multiplicity. This establishes a resource difference under the declared execution without predicting realized latency.

**DERIVED.** A kernel that avoids full score materialization invalidates that particular storage model, not the parameter-count equality. Its live-state ledger must be analyzed separately. Prefill and training have different retention requirements; decode changes the query length and cache boundary. A demonstration must name which phase it covers rather than reusing the full-square fixture for every phase.

**MATHEMATICALLY-DERIVED.** In the A/B fixture, a tied vocabulary table contributes 33,554,432 parameters to A and 67,108,864 to B. Their body equality therefore does not establish total equality, even before norm terms. The forward difference cancels only the body-projection term. This second example tests a different claim from the exact head-partition counterexample and must remain separately labeled.

## Mechanism

**PROPOSAL.** For Eq. 13.11, compare analytic Jacobian–vector products with central finite differences in a declared high-precision reference calculation. Include a zero vector, a nonzero constant vector, a nonconstant vector, a constant perturbation, and a radial perturbation. Retain epsilon, gain, affine offset, perturbation magnitude, norm of the discrepancy, and the tolerance rule. Sweep perturbation magnitude to distinguish truncation from roundoff; one hand-selected step is insufficient.

**MATHEMATICALLY-DERIVED.** Constant shifts leave the centered LayerNorm map unchanged in exact arithmetic. With positive epsilon, RMSNorm's radial derivative before gain is epsilon divided by the cubed RMS denominator, so treating it as exactly zero is an intentional failing control. At zero input, the derivative remains finite because epsilon is positive. Negative “updated variance” arising from inadmissible covariance inputs is an invalid fixture, not a discovery about residual streams.

**PROPOSAL.** Verify distributed vocabulary loss against an unsharded reference on a bounded synthetic fixture. Include uneven vocabulary partitions, a target on each rank, padded rows excluded from the normalization, large logits, and repeated target positions. Check both loss and gradients. Local denominators, accidentally included padding, and duplicated tied-parameter updates must be deliberately injected as negative controls.

**DERIVED.** A local maximum and local exponential sum do not alone define the global softmax. Eq. 13.16 requires the common global shift and normalization, plus the target logit under the same vocabulary ownership contract. Passing a parameter-count test cannot establish this semantic correctness.

## Experimental design

**PROPOSAL.** The following experiment is specified for future execution.

### Experiment 13.7 — Independent architecture-ledger reconciliation

- **Hypothesis:** Exact tensor ownership can agree across two architectures while their operator or state ledgers differ; a scalar parameter budget cannot certify resource equivalence.
- **Setup:** Instantiate a bounded dense-model family and retain the eight artifact records above. Reconcile shapes and aliases before selecting an execution backend.
- **Independent variables:** Head partition, depth/width allocation, gated/plain branch, tied/untied vocabulary, projected-position count, and score-materialization policy; vary one contrast at a time.
- **Controlled variables:** Objective, tokenizer, eligible inputs, initialization policy, precision, hardware, runtime, and measurement boundary within each contrast; report any infeasible control.
- **Dataset/workload:** Deterministic synthetic token fixtures for accounting and semantic checks; a separately versioned held-out corpus is required for any quality claim. The fixture alone is not a language-model benchmark.
- **Hardware:** NOT-DISCLOSED until execution; retain accelerator/CPU identity, memory, device count, topology, clock policy where controlled, and relevant runtime versions.
- **Metrics:** Exact unique parameter totals; phase-specific FLOPs with exclusions; logical and allocated bytes; peak live state; correctness discrepancy; and, only if measured, latency distributions under declared concurrency.
- **Baselines:** Independent tensor enumeration, unsharded full-precision loss, the chapter's analytic fixtures, and a deliberately incomplete ledger.
- **Expected result:** Constructed integer fixtures agree exactly; controlled head-partition variants preserve parameter count while changing explicitly materialized score storage. No quality or speed winner is predicted.
- **Ablation:** Remove one cross-attention projection, duplicate an alias, omit output-head work, include padded vocabulary rows, and conflate forward compute with full training cost.
- **Interpretation:** Each incomplete control must fail its targeted invariant. A matching result establishes only the tested accounting or semantic boundary.
- **Threats to validity:** Shared counting logic, compiler-eliminated work, asynchronous timing, allocator caching, padding, mixed precision, warm-up effects, hidden recomputation, and comparing different evaluated token populations.

## Limitations

**DERIVED.** Accept the accounting artifact when exact integer fixtures agree, every tensor owner has a reconciled contribution, each counted operation has a stated convention, and exclusions are visible. Reject a claimed total-parameter match that matches only block matrices. Reject an equivalence statement that lacks a phase and workload. Reject a performance conclusion drawn solely from analytic FLOPs or logical tensor capacity.

**PROPOSAL.** Numerical checks must declare their error metric and tolerance before candidate comparison; tolerances depend on dtype, conditioning, and the reference procedure. Profiling must synchronize the specified boundary and separate warm-up from retained samples. Quality comparisons must preserve evaluator independence, report seed variability and domain slices, and disclose the full tuning budget described in §13.6.

**UNVERIFIED — execution status.** The manuscript provides derivations, fixture expectations, and proposed checks. It does not contain executed training results, device traces, a pinned implementation reproduction, or a latency benchmark. Editorial arithmetic and document-schema checks do not change that status.

## References

[§13.1 — graph accounting](13-1-architectural-families.md); [§13.2 — allocation](13-2-width-depth-and-heads.md); [§13.3 — feed-forward matching](13-3-feed-forward-alternatives.md); [§13.4 — derivatives](13-4-normalization-and-residuals.md); [§13.5 — vocabulary ownership](13-5-embeddings-and-heads.md); [§13.6 — comparison design](13-6-architectural-ablations.md); [primary-source register](references.md).
