---
id: ms.section.12.5
entity_type: section
title: Resume semantics
short_title: Resume semantics
section: 12.5
slug: 12-5-resume-semantics
parent: ms.chapter.12
prev_sibling: ms.section.12.4
next_sibling: ms.section.12.6
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.section.12.4]
downstream: [ms.chapter.19, ms.chapter.30]
word_count_target: 1800
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

# 12.5 Resume semantics

## Scope

**KNOWN — chapter matrix.** This section owns shard versions, iterator state, random-number-generator state, consumed-token counters, and exact versus approximate replay. Chapter 30 develops full training-checkpoint infrastructure; this section establishes the input-state consistency that infrastructure must preserve. Success means that a restart claim identifies its equivalence boundary and can be falsified against a retained uninterrupted trace.

## Why this exists

**DERIVED.** A loader may fetch record 120 while the trainer has committed only through record 100. Saving the producer cursor as the training position skips the intervening records after restart. Saving an old consumer cursor beside newer model weights repeats their influence. The checkpoint must describe one coherent logical instant across stateful components.

**DERIVED.** A seed is not that instant. A shuffle operation has both a random-generator state and a buffer containing particular records. A packer may hold a partially assembled row. An asynchronous loader may have issued reads that have not been acknowledged. Restoring only the seed and number of yielded batches loses state that determines future outputs.

## Intuition

**DERIVED.** Distinguish fetched, delivered, processed, and committed occurrences. A fetched record has crossed an I/O boundary; a delivered record has reached the trainer; a processed record may have contributed to an uncommitted update; a committed record belongs to a published checkpoint boundary. These counters have different purposes and should not share a field called “consumed” without qualification.

> **Definition — exact input replay.** Equality of the future ordered occurrence stream, token payloads, masks, weights, and batch grouping relative to a declared checkpoint boundary.

> **Definition — approximate input replay.** A restart policy that intentionally relaxes at least one exact-input invariant and reports the resulting discrepancy.

**DERIVED.** Exact input replay is weaker than bitwise training replay. Device nondeterminism, changed reduction order, optimizer state, and precision can change model evolution even when inputs match perfectly.

## Formulation

**DERIVED — state closure.** Represent the input state at checkpoint boundary $k$ by

$$
\mathcal{S}_k=
(\mathcal{M},\mathcal{T},\mathcal{P},\mathcal{R}_k,
\mathcal{B}_k,\mathcal{Q}_k,\mathcal{G}_k,\mathcal{C}_k).
$$
*(Eq. 12.12)*

where $\mathcal{M}$ is immutable manifest identity, $\mathcal{T}$ transformation identities, $\mathcal{P}$ sampling and topology policy, $\mathcal{R}_k$ RNG states, $\mathcal{B}_k$ shuffle buffers, $\mathcal{Q}_k$ outstanding or reconstructible queue state, $\mathcal{G}_k$ partial-pack state, and $\mathcal{C}_k$ counters and cursors. This is the chapter's logical specification, not a serialized framework API.

**MATHEMATICALLY-DERIVED — sufficient condition.** If the future-input transition is deterministic given $\mathcal{S}_k$ and immutable external inputs, restoring equal state yields equal next output and equal successor state. Induction gives equality of the entire future stream. The condition fails if a hidden dependency, clock, completion order, or nondeterministic transform affects the transition.

**MATHEMATICALLY-DERIVED — discrepancy metrics.** For equal-length reference and resumed occurrence traces of length $n_{\mathrm{trace}}>0$, define

$$
d_{\mathrm{order}}=
\frac{1}{n_{\mathrm{trace}}}
\sum_{j=1}^{n_{\mathrm{trace}}}\mathbf{1}[o_j\ne\widehat{o}_j],
\quad
d_{\mathrm{mult}}=
\frac{\sum_o|c(o)-\widehat{c}(o)|}{2n_{\mathrm{trace}}}.
$$
*(Eq. 12.13)*

where $o_j$ is reference occurrence identity and $c(o)$ is its multiplicity. The first detects order differences; the second detects multiplicity differences. Report unequal trace lengths separately rather than hiding them through truncation.

**MATHEMATICALLY-DERIVED.** Reordering \`[a,b,c,d]\` to \`[b,a,c,d]\` gives $d_{\mathrm{order}}=1/2$ and $d_{\mathrm{mult}}=0$. Replacing the final occurrence with a second \`c\` gives both metrics $1/4$. These are constructed fixtures, not observed restart results.

~~~figure
id: fig-12.15
kind: calculator
title: Replay discrepancy accounting
caption: Eq. 12.13 uses equal-length traces. Reordering can change position mismatch while leaving multiplicity discrepancy at zero.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-12.13
alt: Four compared occurrences with two mismatched positions and zero absolute count difference give order discrepancy 0.5 and multiplicity discrepancy zero.
spec:
  tex: d_{\mathrm{order}}=n_{\mathrm{mismatch}}/n,\quad d_{\mathrm{mult}}=\Delta_{\mathrm{counts}}/(2n)
  equation: "12.13"
  inputs:
    - {symbol: n, label: trace length, default: 4, min: 1, max: 1000000, format: integer}
    - {symbol: mismatch, label: position mismatches, default: 2, min: 0, max: 1000000, format: integer}
    - {symbol: delta, label: absolute count difference, default: 0, min: 0, max: 2000000, format: integer}
  outputs:
    - {symbol: order, label: order discrepancy, formula: mismatch/n, format: fixed3}
    - {symbol: mult, label: multiplicity discrepancy, formula: delta/(2*n), format: fixed3}
~~~

**DERIVED.** Valid counts satisfy $0\le n_{\mathrm{mismatch}}\le n$ and $0\le\Delta_{\mathrm{counts}}\le2n$. An audit must reject incompatible counts instead of clipping their ratios.

## Mechanism

**OFFICIAL-DOCUMENTATION — [R12.2](references.md#r122).** Hugging Face Datasets documents iterable state save/restore and explicitly warns that shuffle-buffer examples are lost on resume. **DERIVED.** That surface supports a stateful iterator claim but does not justify exact shuffled-stream replay. State labels must describe the behavior that was documented or tested.

**OFFICIAL-DOCUMENTATION — [R12.8](references.md#r128).** MosaicML Streaming documents mid-epoch state save/restore through StreamingDataLoader. **DERIVED.** A documented deterministic-resume interface still requires validation of its composition with the chosen transforms, topology, and trainer. The chapter does not infer arbitrary elastic-resize support from a fixed-topology resume description.

**DERIVED.** There are two sound ways to handle prefetched work. Capture enough queue contents, positions, and ordering information to reconstruct its continuation, or roll the producer back to a deterministic consumer boundary and regenerate discarded prefetch. The latter exchanges checkpoint size for repeated I/O and computation. It is exact only when regeneration includes every relevant random and partial-pack state.

~~~figure
id: fig-12.16
kind: diagram
title: Checkpoint consistency boundary
caption: One committed manifest binds model progress and input progress. A producer cursor ahead of the committed consumer cannot replace the consumer state.
placement: inline
evidence: DERIVED
source: DERIVED:eq-12.12
alt: Fetched work enters a prefetch queue before delivery and optimizer processing. The commit manifest references both trainer state and consumer-aligned loader state.
spec:
  direction: LR
  nodes:
    - {id: fetch, kind: process, label: fetch ahead}
    - {id: queue, kind: memory, label: uncommitted prefetch}
    - {id: deliver, kind: state, label: consumer boundary}
    - {id: train, kind: model, label: trainer state}
    - {id: loader, kind: state, label: input state closure}
    - {id: commit, kind: dataset, label: checkpoint manifest}
  edges:
    - {from: fetch, to: queue}
    - {from: queue, to: deliver}
    - {from: deliver, to: train}
    - {from: deliver, to: loader}
    - {from: train, to: commit}
    - {from: loader, to: commit}
~~~

**DERIVED.** The simplest proposed checkpoint boundary is a completed optimizer update with no unrecorded accumulation. Every participating rank snapshots the same logical step. Persist the state objects first, validate their descriptors, then publish a manifest selecting the complete set. A failed upload leaves the previous manifest as the recovery point; successful uploads alone do not advance it.

**DERIVED.** Gradient accumulation complicates this boundary. Saving halfway through an update requires accumulated gradients, accumulation index, loss normalization state, and consumed microbatch identities, or a deliberate rollback to the previous full update. A data counter that advances while the corresponding gradients are discarded introduces omissions even if weights restore correctly.

**DERIVED.** Topology changes are a separate compatibility question. Partitioning by physical rank can change future batches after resizing. A globally defined occurrence sequence can be repartitioned, but changed global batch composition may still change optimization. State whether “elastic” preserves occurrence membership, global order, update grouping, or merely a distributional target; those guarantees are not interchangeable.

## Algorithm

**DERIVED — proposed checkpoint protocol.**

~~~text
Algorithm 12.5 — Commit and restore one coherent input boundary
INPUT: completed update k; trainer state; loader state; immutable snapshot
OUTPUT: Result(committed checkpoint identity, checkpoint error)
STATE: previous manifest; unpublished component descriptors
INVARIANT: selected checkpoint components refer to the same logical update
1. Stop advancing the committed consumer boundary at update k.
2. Capture or deterministically discard outstanding work under a declared policy.
3. Snapshot RNG, shuffle buffers, partial packs, cursors, and token counters.
4. Snapshot model, optimizer, scheduler, and precision state at the same boundary.
5. Persist immutable components and verify completeness across participating ranks.
6. Publish one manifest binding component identities, topology, and update k.
7. On restore, reject incompatible snapshot, schema, policy, or topology changes.
8. Restore every required state before dispatching future reads or random draws.
9. Compare the resumed suffix against the retained oracle under declared metrics.
~~~

**DERIVED — complexity.** Serialization is linear in captured state bytes. If the shuffle buffer holds $K$ records, saving payloads costs $O(KM_{\mathrm{record,max}})$ bytes; saving stable references costs $O(K)$ references but adds reconstruction reads. Auditing fixed-width occurrence identifiers by comparison sort costs $O(n_{\mathrm{trace}}\log n_{\mathrm{trace}})$ worst-case time and bounded external-sort buffers. Do not claim guaranteed linear time from an unrestricted hash table.

## Implementation

**OFFICIAL-DOCUMENTATION — [R12.11](references.md#r1211).** TorchTitan documents checkpointable data loading. Its stack layer is *Distributed training*, alongside MosaicML LLM Foundry. PyTorch supplies the *Model / autograd framework* context. **DERIVED.** These references identify integration points; they do not certify bitwise equivalence or every custom pipeline.

**DERIVED.** The adapter contract should expose state completeness explicitly. A state object containing only a shard and row offset is sufficient only when every omitted component is absent or reconstructible. Record the restore schema version and reject unknown fields or missing required components through a typed failure outcome. Silently accepting an old schema is not graceful degradation when exact replay is the requirement.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 12.5 — Interruption at every state boundary

- **Hypothesis:** complete state closure reproduces the committed suffix.
- **Setup:** retain an uninterrupted oracle and restart at controlled interruption points.
- **Independent variables:** failure point, prefetch depth, shuffle, partial packs, and topology.
- **Controlled variables:** immutable data, policy, seeds, model state, and target count.
- **Dataset/workload:** finite distinct occurrences with intentional repeated source records.
- **Hardware:** record execution backend; a host-only loader run establishes input equivalence first.
- **Metrics:** Eq. 12.13, payload/mask/weight digests, batch grouping, and counter equality.
- **Baselines:** complete-state restore, cursor-only restore, and restart-from-beginning.
- **Expected result:** the declared exact variant matches; negative controls expose discrepancies.
- **Ablation:** omit RNG, shuffle buffer, or partial-pack state one at a time.
- **Interpretation:** input equality and model-state equality are reported separately.
- **Threats to validity:** comparing from the failure time rather than the last committed checkpoint.

## Observations

**What the paper claims.** **OFFICIAL-DOCUMENTATION.** The inspected loader projects expose restart mechanisms with different stated scope.

**What the evidence shows.** **DERIVED.** The state-closure argument establishes a sufficient condition, while Eq. 12.13 distinguishes two failure classes.

**What we infer.** **DERIVED.** “Resumable” should be accompanied by a precise equivalence claim and interruption tests.

**What remains unknown.** **UNVERIFIED.** Exact replay under changed topology or custom transforms is unestablished until the relevant composition is tested.

## Failure modes

~~~figure
id: fig-12.17
kind: stat-panel
title: Replay state closure
caption: Proposed invariants for this section; these are design requirements, not measured deployment status.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-12.12
alt: >-
  source: snapshot and transforms. randomness: RNG plus buffer membership. progress: consumer-aligned counters. unfinished work: queues and partial packs.
spec:
  header: REPLAY STATE CLOSURE
  rows:
    - {key: "source", value: "snapshot and transforms"}
    - {key: "randomness", value: "RNG plus buffer membership"}
    - {key: "progress", value: "consumer-aligned counters"}
    - {key: "unfinished work", value: "queues and partial packs"}
~~~

> **Failure mode — producer cursor checkpoint.** **DERIVED.** *Symptom:* post-restart omissions. *Cause:* prefetched but uncommitted records counted as consumed. *Detection:* compare committed occurrence suffixes. *Mitigation:* capture consumer-aligned state.

> **Failure mode — mixed checkpoint generation.** **DERIVED.** *Symptom:* repeated influence or missing influence after restore. *Cause:* model and loader states from different updates. *Detection:* manifest step and component checks. *Mitigation:* select all components through one commit record.

## Siblings

**DERIVED.** Exact replay retains or reconstructs full state; approximate replay trades those costs for a declared discrepancy. Epoch-boundary restart simplifies state but can repeat substantial work. Deterministic regeneration trades storage for recomputation. [§12.2](12-2-transformation-execution.md) owns build retry idempotence; training replay additionally has to align optimizer progress with data progress.

## Extensions

**DERIVED.** An interactive collector may depend on an external environment that cannot be restored. Retaining observations can replay a training dataset without reproducing the original environment interaction. Separate dataset replay, environment replay, and policy-update replay in the artifact specification.

## Limitations

**DERIVED.** An immutable input may later be revoked. Continuing from an old snapshot can satisfy mathematical replay while violating the newly selected data policy. Stop exact continuation and document a new admissible run boundary; reproducibility does not justify silently bypassing revocation.

## Reproducibility

**DERIVED — required artifact.** Preserve checkpoint manifests, component digests, state schemas, commit step, topology, RNG implementation, iterator and shuffle state, pending-pack state, counter definitions, and the uninterrupted comparison trace. State what was not captured.

## References

[R12.2 — iterable resume limitation](references.md#r122); [R12.8 — StreamingDataLoader resume](references.md#r128); [R12.11 — TorchTitan](references.md#r1211).
