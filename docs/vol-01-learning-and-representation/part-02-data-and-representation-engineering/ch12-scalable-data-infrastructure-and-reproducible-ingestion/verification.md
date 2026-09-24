---
id: ms.verification.12
entity_type: verification
title: Chapter 12 verification
short_title: Verification
section: null
slug: verification
parent: ms.chapter.12
prev_sibling: ms.section.12.6
next_sibling: ms.references.12
children: []
prerequisites: [ms.section.12.1, ms.section.12.2, ms.section.12.3, ms.section.12.4, ms.section.12.5, ms.section.12.6]
downstream: [ms.chapter.19, ms.chapter.30]
word_count_target: 1500
volume: 1
part: 2
chapter: 12
related: []
relations: []
axes: {lifecycle: [data, pretraining], mechanism: [data_ingestion, reproducibility], feedback_setting: [], modality: [text, code]}
papers: [P05]
implementations: [impl.pytorch, impl.nvidia-megatron-core, impl.torchtitan, impl.mosaicml-llm-foundry]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# Chapter 12 verification

## Artifact specification

**DERIVED — proposed artifact contract.** The deliverable is a resumable dataset build and loading pipeline with the records below. This manuscript specifies their semantics; it does not claim to supply or have executed a training runtime. Physical encodings are implementation choices, but required identities and transitions must remain inspectable.

| Record | Required fields | Invariant |
|---|---|---|
| Snapshot manifest | snapshot digest; ordered objects; object revisions and content digests; sizes; record counts; schema; tokenizer; transform identities; compression; index units | Every selected record resolves to immutable, interpretable bytes |
| Build ledger | semantic keys; dependency identities; partition keys; attempts; resource limits; dispositions; selected outputs | One selected validated result per required task |
| Source-to-output lineage | source record; transform; child ordinal or retained span; output identity; dependency edges | Every produced item has a traceable parent or an explicit generated-origin record |
| Occurrence schedule | snapshot; source record; draw index; occurrence identity; epoch; sampling weight; rank/worker ownership | Intentional repeated draws remain distinguishable from duplicate delivery |
| Packing ledger | occurrence; source token range; segment; physical row; local position; target mask; EOS/truncation policy | Every retained target has its declared context and weight |
| Input checkpoint | state-schema version; RNG; cursors; shuffle contents or reconstruction rule; pending work; partial packs; counters; topology | Captured state closes every dependency of future input |
| Training checkpoint descriptor | update index; model/optimizer/scheduler/precision component identities; accumulation status | Components correspond to one declared input boundary |
| Commit manifest | checkpoint generation; all component descriptors; snapshot; configuration; commit step | Recovery selects complete compatible state atomically |
| Exposure ledger | selected/fetched/delivered/processed/committed occurrence identity; timestamps with clock domain; attempt identity | Physical re-execution is separated from logical committed exposure |
| Operational report | bytes and counts by stage; ready-queue bounds; retries; exposed input wait; reason codes | Resource and semantic measurements have explicit boundaries |
| Invalidation ledger | revoked source; affected descendants; replacement snapshot; cache/export/checkpoint reconciliation; unknown copies | New admissible consumption excludes known revoked dependencies |
| Verification report | fixture definition; configuration; versions; fault plan; oracle trace; resumed trace; discrepancy; unresolved cases | A third party can distinguish a passed check from a proposed one |

**DERIVED.** Records that contain sensitive text should use appropriate access controls; the audit index can retain opaque identifiers and digests where raw payload retention is unnecessary. This is a design boundary, not a legal-compliance assertion. Upstream rights and retention policies remain authoritative.

## Verification task

**KNOWN — plan requirement.** Interrupt and resume a miniature run; detect duplicated or skipped examples and quantify replay discrepancy.

**PROPOSAL — execution has not occurred.**

### Experiment 12.7 — End-to-end ingestion and recovery contract

- **Hypothesis:** with immutable inputs and complete checkpoint state, the resumed input suffix equals the uninterrupted suffix from the last committed boundary.
- **Setup:** build one fixture through the documented stages; retain a single-consumer oracle before testing parallel placement and interruption.
- **Independent variables:** number of workers, prefetch depth, shuffle buffer, packing policy, interruption point, retry outcome, and topology compatibility.
- **Controlled variables:** input digests, transform identities, tokenizer, occurrence selection, loss convention, seeds, and intended update grouping.
- **Dataset/workload:** the finite constructed fixture below, with no benchmark or private corpus required.
- **Hardware:** record CPU, memory, filesystem/object store, network, and operating system. Record accelerator, model, precision, kernels, and driver only for optional training-equivalence checks.
- **Metrics:** exact occurrence and tensor comparisons, Eq. 12.13 discrepancies, Eq. 12.14 conservation, target counts, bounded memory, and recovery work.
- **Baselines:** uninterrupted execution; complete-state restore; cursor-only restore; seed-only restore; deliberately replicated iterable.
- **Expected result:** the complete-state variant meets its declared equivalence boundary; defective controls fail at least one designed check.
- **Ablation:** remove shuffle-buffer state, partial-pack state, or consumer alignment individually.
- **Interpretation:** distinguish structural input equivalence, numerical model equivalence, and operational recovery time.
- **Threats to validity:** a shared oracle defect, untested fault boundaries, nondeterministic transforms, and silently changing the snapshot to make recovery pass.

### Finite fixture and oracle

**DERIVED — proposed fixture.** Use seven immutable records, with predeclared post-tokenization segment lengths of 2, 3, 4, 5, 6, 9, and 13 tokens. These are deliberately chosen test parameters, not observations of natural text. Give each record a unique identity and unambiguous token sequence. Use three shards with unequal record counts, and explicitly schedule one record twice using distinct occurrence identities.

**DERIVED.** Select a physical row width of eight tokens to force boundary decisions. The length-nine and length-thirteen records must trigger the declared oversized-record policy. Keep tokenization out of the first oracle by using predeclared integer tokens; test tokenizer integration separately against a pinned tokenizer. Include an additional zero-supervision example for the zero-denominator branch rather than mixing it invisibly into the principal trace.

**DERIVED.** The oracle records ordered tuples of occurrence identity, retained source span, input-token digest, target-token digest, attention/segment metadata digest, position digest, loss-mask digest, weight, physical batch, and intended optimizer update. This trace is stronger than a list of source-record IDs. A trace can preserve source membership while changing masks, order, or update grouping.

### Interruption matrix

**DERIVED — proposed fault schedule.** Test each point below with a bounded number of controlled fault injections and preserve the selected failure schedule.

| Interruption point | State at risk | Required behavior |
|---|---|---|
| Before a fetch completes | Outstanding read | Retry or fail against the same object identity |
| After fetch, before delivery | Prefetch contents | Restore contents or regenerate from the consumer boundary |
| After shuffle replacement | Buffer membership and RNG | Preserve both under an exact replay claim |
| During a partial pack | Retained spans and segment state | Restore the unfinished row or deterministically regenerate it |
| After delivery, before update commit | Uncommitted exposure | Roll back together with corresponding trainer progress |
| During gradient accumulation | Partial gradient and denominator | Capture them or roll back to a full-update boundary |
| During checkpoint component writes | Mixed generations | Keep the prior complete manifest selected |
| After manifest publication | New committed generation | Restore the newly selected complete state |
| After a worker-count change | Ownership and state compatibility | Preserve the declared invariant or reject the configuration |
| After source revocation | Admissible snapshot selection | Stop or establish a new explicit run boundary |

### Ordered verification procedure

**DERIVED.**

1. Validate all source and transform identities before building the fixture.
2. Build serially and in parallel; compare logical output membership and canonical order.
3. Verify incremental rebuild against a clean rebuild after changing one declared dependency.
4. Generate the full occurrence schedule and its ownership map independently of loader execution.
5. Run uninterrupted; retain the complete oracle and each committed checkpoint boundary.
6. Interrupt at the selected point, restore, and compare from the **last committed checkpoint**, not from the later failure time.
7. Compare ordered identities, multiplicities, tokens, masks, weights, positions, and batch grouping.
8. Reconcile source, retained, truncated, supervised, delivered, and committed token counts.
9. Inject missing and corrupt objects; require explicit classified outcomes and no silent substitution.
10. Revoke one source with shared descendants; inspect affected packs, indexes, cached artifacts, and checkpoint references.
11. Run the incomplete-state controls and verify that the audit detects their intended defects.
12. Write the result ledger, including rejected configurations and checks not executed.

## Acceptance criteria

**DERIVED — categorical and exact structural gates.**

| Gate | Accept when | Reject when |
|---|---|---|
| Snapshot identity | Every object and interpretation identity matches the selected manifest | A mutable alias or mismatched digest is accepted |
| Build determinism | Canonical logical records agree across declared schedules | Timing selects a different output record |
| Incremental equivalence | Clean and incremental rebuilds agree | A changed dependency reuses stale output |
| Ownership | Every intended occurrence has exactly one owner | An occurrence is omitted or assigned twice |
| Packing | All retained targets, contexts, positions, and weights match the oracle | EOS is treated as an implicit attention barrier or target shift is wrong |
| Token reduction | Summed loss and count implement Eq. 12.11 | Unequal rank means are averaged as though counts were equal |
| Exact input replay | $d_{\mathrm{order}}=0$, $d_{\mathrm{mult}}=0$, equal lengths, and all tensor/metadata digests match | Any required structural component differs |
| Approximate replay | Relaxed invariants and discrepancies are reported explicitly | Approximate state is labeled exact |
| Counter consistency | All declared conservation equations hold at the same boundary | Fetched work is silently counted as committed |
| Fault semantics | Retries are bounded and errors remain classified | Missing/corrupt input is silently skipped or substituted |
| Invalidation | All known reachable affected artifacts are blocked or replaced | A known revoked descendant remains admissible |
| Negative controls | Each deliberately introduced defect triggers the intended gate | The audit passes its defective control |

**DERIVED — numerical gate.** Exact input replay uses exact structural comparisons. Optional packed/unpacked model comparisons require separately declared absolute and relative tolerances appropriate to dtype and kernel behavior. Do not invent one tolerance as a universal standard. Establish the tolerance from the intended numerical contract and retain the reference calculation. Any zero-target batch must take a declared synchronized branch rather than divide by zero.

**DERIVED — performance gate.** No throughput threshold is prescribed without a deployment budget and measurement context. If performance is measured, report hardware, model, precision, sequence lengths, length distribution, concurrency, runtime revisions, warm/cold cache state, and the measurement boundary. Verify exposure equivalence before comparing speed.

## What this edition did not do

**KNOWN.** This chapter provides authored technical content, source verification, mathematical fixtures, and a proposed experiment. It did not run a training job, execute fault injection, benchmark a loader, verify a storage service's transactional primitive, or demonstrate model unlearning. Manuscript-schema and arithmetic checks are editorial validation; they are not empirical evidence for the proposed pipeline.

**UNVERIFIED.** Exact behavior of moving repository versions and deployment-specific adapters remains open until a pinned implementation executes this protocol. The current status remains \`manuscript_draft\`.

## References

[Chapter overview](README.md); [primary-source register](references.md); [packing derivation](12-4-packing-and-masks.md); [replay derivation](12-5-resume-semantics.md); [observability derivation](12-6-operational-observability.md).

