---
id: ms.section.19.4
entity_type: section
title: Training-state transitions
short_title: Training-state transitions
volume: 1
part: 4
chapter: 19
section: 19.4
slug: 19-4-training-state-transitions
parent: ms.chapter.19
prev_sibling: ms.section.19.3
next_sibling: ms.section.19.5
children: []
prerequisites: [ms.chapter.12, ms.section.19.3]
downstream: [ms.chapter.29, ms.chapter.30]
related: [ms.chapter.3]
relations: []
axes: {lifecycle: [pretraining], mechanism: [training_state, checkpointing, reproducibility], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch, impl.torchtitan]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 19.4 Training-state transitions

## Scope

[DERIVED] A resumable training state contains everything that determines the next declared transition. This section derives that state closure, distinguishes exact replay from statistical continuation, and specifies a checkpoint commit/recovery procedure. Data-ingestion cursor mechanics are owned by §12.5; distributed checkpoint layouts and resharding belong to Part V. The local reference checkpoints at accepted-update boundaries with no pending accumulated gradient.

## Why this exists

[OFFICIAL-DOCUMENTATION] PyTorch's checkpoint tutorial explicitly distinguishes model-only loading from resuming training and includes optimizer state in its general-checkpoint construction. Model weights alone therefore do not meet the documented training-resume use case. The example is a starting interface, not an exhaustive closure over arbitrary loaders, augmentation systems, and schedulers. [R19.26], “Saving & Loading a General Checkpoint.”

[MATHEMATICALLY-DERIVED] Two processes with identical weights can produce different next weights when their moments, learning rate, next examples, masks, or random draws differ. Saving the output of an earlier transition does not identify its future input. The recovery question is which state determines the next update, not whether a tensor file can be deserialized.

## Intuition

[MATHEMATICALLY-DERIVED] A deterministic transition map makes replay a state-equality problem. If $\mathsf T$ is the same map in both runs and their complete starting states agree, induction makes all later states agree. Omitted state or a changed map breaks the premise. This supplies a precise boundary for claims of reproducibility; it does not require that all accelerators implement identical floating-point maps.

## Formulation

[MATHEMATICALLY-DERIVED] Define the state at an accepted-update boundary as

$$
\mathcal S_k=(\theta_k,o_k,h_k,r_k,d_k,a_k,b_k,v_k),\qquad
\mathcal S_{k+1}=\mathsf T_{\chi}(\mathcal S_k).
$$
*(Eq. 19.12)*

[MATHEMATICALLY-DERIVED] Here $o_k$ contains optimizer statistics and counters; $h_k$ scheduler state; $r_k$ all random-generator states used by model, sampling, and transforms; $d_k$ the logical next-record cursor; $a_k$ packing/augmentation state; $b_k$ persistent model buffers; and $v_k$ the consumption, attempt, acceptance, and numerical-scaler counters. The immutable identity $\chi$ fixes model/configuration, tokenizer, data manifests, software, hardware-sensitive numerical policy, and transition semantics. A state component is removable only when it is a deterministic function of the retained components under $\chi$.

[MATHEMATICALLY-DERIVED] At a mid-window checkpoint, extend the state by accumulated gradients, the window denominator, current microbatch index, numerical scale, and any not-yet-consumed staged records. The boundary-only reference avoids that larger state. “Checkpoint every step” is insufficient unless step identifies the exact commit boundary.

## Mechanism

### Methodology: snapshot a consistent accepted state

[DERIVED] The recipe completes the accepted parameter transition, advances the declared scheduler and acceptance counters, and establishes the next logical data position. Only then does it snapshot the state. Pending asynchronous device mutations must be ordered before the snapshot reads the affected tensors. An asynchronous writer needs an immutable snapshot or an equivalent copy-on-write guarantee; a writer observing live optimizer buffers while training mutates them can serialize a mixture of updates.

[MATHEMATICALLY-DERIVED] Logical consumption and physical prefetch differ. If a loader has fetched records $u_{j+1},\ldots,u_{j+p}$ but the committed update ends at $u_j$, restoring from the physical cursor without the prefetch buffer skips those records. A correct recovery restores the logical cursor and regenerates the prefetched records, or saves the buffer with its transform state. Packed records need the residual document fragment and boundary metadata for the same reason. Their implementation is owned by §12.5.

[DERIVED] A checkpoint consists of versioned state payloads plus a manifest containing schema, transition/configuration identity, accepted-update number, next logical data position, payload lengths, and integrity digests. Payloads are first written under a new immutable identity; publication occurs only after required payloads are complete. Recovery selects a published manifest, validates its payloads and identities, and rejects a partial generation. Rename or manifest-publication atomicity must come from the selected storage contract; it is not assumed for arbitrary object stores or filesystems.

[MATHEMATICALLY-DERIVED] A digest checks accidental content mismatch against a trusted manifest; it does not authenticate an untrusted source by itself. A checkpoint is also an input trust boundary. Schema validation, declared loading semantics, and authorized artifact provenance precede execution. Compatibility migration is a new transition map and requires its own numerical check.

## Algorithm

**Algorithm 19.4 — Publish and restore a boundary checkpoint.** [DERIVED] Let $\mathsf E$ and $\mathsf D$ be the versioned encoder and decoder, $\mathsf P$ the storage publication operation with its explicitly supplied atomicity contract, and $\mathsf V$ the schema/identity/integrity validator. The procedure terminates on validation or write failure; retries are bounded by a configured attempt limit. It does not assume storage operations succeed.

$$
\begin{aligned}
1.\quad &\mathcal S_k^{\mathrm{snap}}\gets
 \operatorname{snapshot}_{\mathrm{consistent}}(\mathcal S_k;\chi).\\
2.\quad &(p_k,\mu_k)\gets\mathsf E(\mathcal S_k^{\mathrm{snap}},\chi).\\
3.\quad &\neg\operatorname{write\_complete}(p_k,\mu_k)
 \ \Longrightarrow\ \operatorname{return}(\mathrm{unpublished}).\\
4.\quad &\mathsf P(\mu_k)\gets\mathrm{published}.\\
5.\quad &\neg\mathsf V(\mu_k,p_k;\chi)
 \ \Longrightarrow\ \operatorname{return}(\mathrm{rejected}).\\
6.\quad &\mathcal S_k'\gets\mathsf D(p_k,\mu_k;\chi).\\
7.\quad &\operatorname{return}(\mathcal S_k',\mathrm{restored}).
\end{aligned}
$$
*(Eq. 19.13)*

[MATHEMATICALLY-DERIVED] Lines 1–4 are the save procedure and lines 5–7 the restore procedure; recovery accepts only a published manifest. The invariant is generation consistency: every restored payload belongs to the same committed state. Exact replay additionally requires $\mathsf D(\mathsf E(\mathcal S_k,\chi))=\mathcal S_k$ on all transition-relevant components and an unchanged deterministic $\mathsf T_\chi$. A failure to meet either premise invalidates exact-replay claims.

```figure
id: fig-19.6
kind: diagram
title: Checkpoint state closure
caption: >-
  Weights are one member of the state determining the next update. A
  consistent snapshot must also close over optimizer, schedule, randomness,
  data position, transform residuals, persistent buffers, and counters.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-19.12
alt: >-
  Model weights, optimizer and schedule state, RNG state, logical data
  cursor and packing residuals, buffers and counters all feed a consistent
  snapshot. Complete payloads feed a published manifest, which is validated
  before restoration.
spec:
  direction: TB
  nodes:
    - {id: weights, kind: model, label: Weights and buffers}
    - {id: optim, kind: state, label: Optimizer and schedule}
    - {id: random, kind: state, label: RNG and scaler state}
    - {id: data, kind: dataset, label: Cursor and packing residual}
    - {id: counters, kind: metric, label: Accepted and consumed counters}
    - {id: snapshot, kind: process, label: Consistent snapshot}
    - {id: publish, kind: process, label: Publish complete generation}
    - {id: restore, kind: process, label: Validate then restore}
  edges:
    - {from: weights, to: snapshot, kind: dependency}
    - {from: optim, to: snapshot, kind: dependency}
    - {from: random, to: snapshot, kind: dependency}
    - {from: data, to: snapshot, kind: dependency}
    - {from: counters, to: snapshot, kind: dependency}
    - {from: snapshot, to: publish, kind: flow}
    - {from: publish, to: restore, kind: flow}
```

## Implementation

[OFFICIAL-DOCUMENTATION] **PyTorch**, the Model / autograd framework layer, provides model and optimizer state dictionaries in its general checkpoint example and explicitly sets training mode when resuming. Its reproducibility note warns that reproducible results are not guaranteed across releases, commits, platforms, or CPU/GPU execution even with identical seeds. [R19.26], general checkpoint; [R19.27], opening reproducibility boundary.

[MATHEMATICALLY-DERIVED] If the serialized payload is $P_{\mathrm{ckpt}}$ bytes, a full host snapshot can add $O(P_{\mathrm{ckpt}})$ transient host memory and requires reading/copying that payload. A simple nonoverlapped save has time components $t_{\mathrm{sync}}+t_{\mathrm{snapshot}}+t_{\mathrm{encode}}+t_{\mathrm{write}}+t_{\mathrm{publish}}$. Effective write bandwidth supplies a lower bound $t_{\mathrm{write}}\geq P_{\mathrm{ckpt}}/B_{\mathrm{storage}}$ only for the stated transfer boundary; durability and metadata costs are additional. No model parameters are added. Hashing/encoding require at least a payload traversal for a full integrity pass.

[NOT-DISCLOSED] Snapshot overlap, storage bandwidth, device-to-host time, failure rate, energy, and monetary charges for the book recipe are not measured. Single-device checkpointing requires no inter-rank communication; distributed synchronization, state ownership, and resharding costs are deferred to Part V and cannot be inferred from a local payload size.

## Experimental design

### Reported experiments

[DERIVED] The inspected PyTorch tutorial demonstrates checkpoint interfaces but reports no controlled exact-replay benchmark covering all state components in Eq. 19.12. Its example cannot supply a tolerance or failure probability for this recipe. The chapter's falsification branches one trajectory at boundary $k$: one branch continues uninterrupted, the other restores in a fresh process and consumes the same logical records. Parameters, moments, data identities, and clocks are compared over a declared horizon.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] PyTorch requires more than model weights for its general training-resume example and limits cross-environment reproducibility guarantees. [R19.26]; [R19.27].

**What the evidence shows.** [DERIVED] The inspected interfaces support storage of selected state. They do not certify closure over a particular external data pipeline or prove exact replay on different hardware.

**What we infer.** [MATHEMATICALLY-DERIVED] Exact replay is conditional on state closure and transition-map equality. Statistical continuation is a weaker, separately evaluated criterion.

**What remains unknown.** [UNVERIFIED] Storage atomicity, schema migration correctness, data-pipeline restoration, and numerical replay tolerance require checks on the chosen runtime and storage system.

## Failure modes

[MATHEMATICALLY-DERIVED] A missing moment state changes adaptive updates; a reset scheduler changes learning rates; an omitted RNG state changes stochastic forwards; a physical prefetch cursor can skip examples; a live-buffer save can mix generations. A deserialization success establishes none of these invariants. Compare the first post-restore record, mask, learning rate, gradient, moment, and parameter transition to locate the earliest divergence.

## Siblings

[DERIVED] Model export preserves an inference artifact; training checkpointing preserves future training transitions. Warm starting intentionally changes some state; exact resumption preserves all transition-relevant state. Mid-window checkpoints save additional gradient and data state; boundary checkpoints reduce that closure. Asynchronous save reduces blocking only if its snapshot semantics prevent mutation races.

## Extensions

[DERIVED] Incremental checkpoints and sharded checkpoints change payload ownership and storage representation. Their acceptance condition remains a complete logical state under a single published identity. No performance advantage is asserted without a versioned storage/workload measurement. Resharding changes ownership, not the intended mathematical state, but that equivalence requires an explicit tensor-layout and reduction check.

## Limitations

[MATHEMATICALLY-DERIVED] The induction argument proves equality only for a deterministic unchanged map. A numerically close trajectory may diverge later under sensitive dynamics; one short replay test does not establish indefinite closeness. An exact resume test also does not establish model quality or protection against training-data contamination.

## Reproducibility

[DERIVED] The checkpoint manifest records schema/version, full configuration identity, accepted-update count, logical next-record position, data/processor revisions, payload names/lengths/digests, and environment identity. Recovery retains validation failures and selected generation. The proposed uninterrupted/restored comparison remains unexecuted in [verification.md](verification.md).

## References

[R19.26](references.md#r1926), [R19.27](references.md#r1927).
