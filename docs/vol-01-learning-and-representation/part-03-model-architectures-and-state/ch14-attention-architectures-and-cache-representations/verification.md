---
id: ms.verification.14
entity_type: verification
title: Verify attention state and equivalence
short_title: Verification
section: null
slug: verification
parent: ms.chapter.14
prev_sibling: ms.section.14.6
next_sibling: ms.references.14
children: []
prerequisites: [ms.chapter.5, ms.chapter.13, ms.section.14.1, ms.section.14.2, ms.section.14.3, ms.section.14.4, ms.section.14.5, ms.section.14.6]
downstream: [ms.chapter.27, ms.chapter.42]
word_count_target: 1700
volume: 1
part: 3
chapter: 14
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [attention, cache_representation], feedback_setting: [], modality: [text, image, audio, video]}
papers: [P13, P19, P20]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# Verify attention state and equivalence

**PROPOSAL.** Build the attention-family comparison specified by Chapter 14. Derive MHA, MQA and GQA state from explicit tensor shapes, then derive one MLA-style implementation from its own latent, positional and metadata tensors. Reconcile the results with allocated storage under a pinned future runtime. This document is the artifact specification and falsification protocol; it is not a report of executed accelerator measurements.

## Artifact contract

**DERIVED.** The comparison must preserve the following records. Logical records can be serialized in any format that retains their field meanings and identities.

| Record | Required fields | Acceptance invariant |
|---|---|---|
| Attention specification | Architecture; layers; query/KV heads and map; residual/key/value/latent/positional widths; projections; normalization; masks; positions; explicit score scale | The mathematical operation is reconstructible without inferring defaults |
| Persistent-state inventory | Role; shape; dtype; valid positions; unique owner; aliases; layer/request/source identity; lifetime; trainable dependency revisions | Each logically required value is counted once before placement |
| Physical-layout inventory | Allocation owner; byte extent; strides; alignment; page size; packed format; scales; padding; replicas; reserve; workspace lifetime | Physical bytes reconcile with the actual representation |
| Workload trace | Source and target identities; lengths; query positions; selected sets; batch/concurrency; output budget; phase; cache updates | The same comparison boundary is used for every candidate |
| Equivalence record | Independent oracle; test fixture; masks; precision; dropout; tolerance; output/gradient discrepancy; failing controls | A correctness claim names the function and numerical boundary |
| Quality record | Task construction; support locations; evaluator; data revision; seeds; tuning budget; context/domain slices; uncertainty | Quality is measured independently of resource savings |
| Execution identity | Model and tokenizer revisions; framework/kernel commits; device/topology; driver/runtime; backend; dispatch; precision policy | Missing implementation identities remain unresolved |
| Evidence manifest | Primary-source key; inspected location; access date; claim label; original derivation link | Reported mechanisms, documentation and original calculations remain distinct |

**DERIVED.** Bound sequence length, batch, heads, selected count and page count before allocation. Validate divisibility and index ranges before grouping or gathering. Count bytes using checked integer arithmetic in the eventual implementation. A malformed configuration must produce an explicit failure, not wrap an allocation size or silently select a different architecture.

## Formulation

**MATHEMATICALLY-DERIVED — uniform logical fixtures.** Unless stated otherwise, use 32 layers, one sequence, 8192 cached positions, 32 query heads, key and value width 128, and two-byte K/V storage. These dimensions are illustrative and do not identify a named checkpoint.

| Fixture | Count boundary | Expected bytes |
|---|---|---:|
| MHA, 32 KV heads | Eq. 14.3, one logical copy | 4,294,967,296 = 4 GiB |
| GQA, 8 KV heads | Same workload and dimensions | 1,073,741,824 = 1 GiB |
| MQA, 1 KV head | Same workload and dimensions | 134,217,728 = 128 MiB |
| Latent, width 512 plus shared positional width 64 | Eq. 14.7; both components two bytes; same layers/batch/length | 301,989,888 = 288 MiB |
| Specified mixed row, 656 bytes | Eq. 14.8 applied to the named R14.7 row layout; same layers/batch/length | 171,966,464 = 164 MiB before page metadata |
| Pure local window, 4096 retained positions | Eq. 14.10 with 8 KV heads and no other retained history | 536,870,912 = 512 MiB |
| Source cache | Eq. 14.13; 4 cross layers, 4096 source positions, 8 KV heads, key/value width 64, two-byte storage | 33,554,432 = 32 MiB |
| One page boundary | Eq. 14.19; 32 layers, one sequence, 4096-byte token stride, 128-token pages, length 128 | 16,777,216 = 16 MiB |
| One token past the page boundary | Same layout, length 129 | 33,554,432 = 32 MiB |

**DERIVED.** The mixed-row calculation uses an inspected format's byte composition but a constructed workload. It is not an allocation measurement of DeepSeek-V3.2. An implementation may allocate additional indices, summaries, tables, padding or reserve; those must be restored before comparison. A later FlashMLA format requires its own inventory.

**MATHEMATICALLY-DERIVED.** MHA/GQA/MQA logical ratios are determined by KV-head count under fixed dimensions. MLA's ratio is determined by the independently declared latent and positional terms. None of these ratios establishes equal parameter counts, equal model quality, equal arithmetic or equal physical memory traffic.

## Mechanism

**PROPOSAL — independent tensor reconciliation.** Derive predictions from equations, then inspect storage from a separate runtime inventory rather than restating the same formula in another counter. For each cache component record shape, stride, storage offset, scalar dtype, packed-byte format, underlying storage identity and extent. Sum unique allocation owners; do not sum every view's reported elements as if each view owned memory.

**DERIVED.** Packed quantized state may be represented as byte tensors whose shape no longer exposes the logical scalar dimensions. Decode its documented row contract and count scales explicitly. A storage extent can include unused slots, while a tensor view can describe only valid positions. Both values are meaningful and must remain separately named.

**PROPOSAL.** Take synchronized snapshots at four boundaries: after initialization, after prefill, during a bounded decode sequence, and after request release. Retain peak temporary memory during prefill/layout conversion and steady persistent cache after temporaries are released. Separate allocated bytes from allocator reservation and process-wide memory. In distributed tests, record each rank and reconstruct unique logical state plus replicas.

**DERIVED.** A post-release allocator reserve is not necessarily a live cache leak. Conversely, a low steady decode footprint does not prove that the same request can survive prefill's peak. The acceptance boundary must name the phase at which capacity is required.

**PROPOSAL — operator fixtures.** Use small independently constructed tensors before any large allocation:

1. **Head mapping:** distinct values per KV group, multiple query heads, and an explicit repeated-KV oracle.
2. **Latent absorption:** expanded versus absorbed keys/values with the same positional term and score scale; compare both outputs and gradients when training is in scope.
3. **Position omission:** nonzero positional terms as a failing control for a latent-only cache formula.
4. **Sparse union:** overlapping local/global/selected lists, invalid indices, and a future-dependent summary.
5. **Cross-source reuse:** immutable source sharing across branches, then source revision and encoder-parameter changes.
6. **Tile reduction:** several tile partitions and extreme score offsets; compare stable full softmax with merged sufficient statistics.
7. **Rectangular masks:** two final queries over five keys, with expected keep rows 11110 and 11111; test the different upper-left rule as a failing control.
8. **Page boundaries:** zero retained tokens where the implementation permits an empty cache, exactly one page, one token beyond a page, and mixed request lengths.

**DERIVED.** A test should fail when its targeted invariant is deliberately violated. A shared bug in both reference and candidate can pass output comparison, so hand-audited positions and independently enumerated allocation owners are necessary controls. Random tensors supplement those controls; they do not replace them.

## Algorithm

**DERIVED — proposed reconciliation procedure.**

~~~text
Algorithm 14.7 — Reconcile predicted state with allocated tensors
INPUT: bounded attention specification, pinned execution, allocation snapshots
OUTPUT: Result(reconciled comparison report, discrepancy report)
STATE: logical owners, physical allocation owners and phase-specific lifetimes
INVARIANT: every byte is assigned to one declared category at each boundary
1. Validate dimensions, masks, head map, positions and required cache components.
2. Compute logical state independently for each attention family.
3. Enumerate unique physical storage and associate views, pages and replicas.
4. Reconcile logical payload, metadata, slack, reserve and temporary workspace.
5. Run bounded equivalence fixtures and require targeted negative controls to fail.
6. Record prefill, decode and release boundaries separately.
7. Add task evidence only from the predeclared independent evaluation protocol.
8. Return unresolved facts explicitly rather than imputing missing measurements.
~~~

**DERIVED — complexity.** Sorting $n$ fixed-width storage-owner IDs costs $O(n\log n)$; reconciliation and lifetime scanning are linear after ordering. Runtime attention costs remain those of the audited mechanism. The audit does not allocate a dense full-length reference for every production workload; numerical oracles are deliberately bounded.

## Experimental design

**PROPOSAL — future execution.**

### Experiment 14.7 — Falsify incomplete attention cache accounting

- **Hypothesis:** independently reconstructed tensor inventories distinguish logical state from actual allocation and expose invalid cross-family cache formulas.
- **Setup:** instantiate bounded MHA/GQA/MQA fixtures and one explicitly specified latent layout; retain all artifact records.
- **Independent variables:** head sharing, latent/positional widths, row format, page size, replication and execution phase.
- **Controlled variables:** comparison dimensions, workload, dtype where applicable, reference semantics, backend identity and allocation boundary.
- **Dataset/workload:** deterministic synthetic tensors and request-length traces for accounting; a separately pinned task set for quality claims.
- **Hardware:** NOT-DISCLOSED until execution; record device memory, topology, driver/runtime and selected kernels.
- **Metrics:** exact logical/allocated bytes, metadata and slack, peak temporary bytes, forward/gradient error, phase traffic, task quality and latency uncertainty.
- **Baselines:** independent shape enumeration, stable full attention on bounded tensors, explicit expanded MLA, and unshared source construction.
- **Expected result:** integer fixtures agree under their boundaries; omitted position/scales, duplicated aliases and incorrect masks fail.
- **Ablation:** omit one required state category, count tensor views twice, substitute a family-wide cache ratio, and report only steady decode memory.
- **Interpretation:** passing the audit establishes the specified representation and equivalence boundary, not a universal quality or speed advantage.
- **Threats to validity:** shared oracle logic, allocator caching, asynchronous snapshots, unsupported layouts, hidden replication, sparse selector state and unequal quality controls.

## Limitations

**DERIVED — acceptance rules.** Integer shape and byte counts must reconcile exactly after all categories are included. Numerical tolerances must be declared before comparison and must reflect dtype and conditioning. All-masked rows require an explicit policy. A measured latency comparison must retain hardware, model, precision, query/key lengths, input/output distribution, concurrency, runtime revision and measurement boundary.

**DERIVED — rejection rules.** Reject a cache claim that omits a required positional component, quantization scale or persistent selector structure. Reject a bandwidth claim inferred solely from logical bytes. Reject an exactness claim using different masks or score scales. Reject a quality conclusion based only on operator error or nominal context acceptance.

**UNVERIFIED — execution status.** No GPU allocation reconciliation, training run, kernel benchmark, or task evaluation is reported as executed. The manuscript supplies original derivations, arithmetic expectations and a reproducible proposal. Editorial document and arithmetic checks do not establish accelerator or model performance.

## References

[§14.1](14-1-mha-mqa-and-gqa.md); [§14.2](14-2-latent-attention.md); [§14.3](14-3-sparse-and-local-attention.md); [§14.4](14-4-cross-attention.md); [§14.5](14-5-exact-versus-approximate-computation.md); [§14.6](14-6-quality-state-tradeoffs.md); [primary-source register](references.md).
