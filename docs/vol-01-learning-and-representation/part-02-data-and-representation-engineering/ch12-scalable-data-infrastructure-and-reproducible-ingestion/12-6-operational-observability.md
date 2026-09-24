---
id: ms.section.12.6
entity_type: section
title: Operational observability
short_title: Operational observability
section: 12.6
slug: 12-6-operational-observability
parent: ms.chapter.12
prev_sibling: ms.section.12.5
next_sibling: null
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.section.12.5]
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

# 12.6 Operational observability

## Scope

**KNOWN — chapter matrix.** This section owns input throughput, stalls, corruption, missing objects, lineage audits, and deletion propagation. The monitoring boundary runs from selected snapshot objects to committed training exposure. Success requires both resource observability and conservation of records and targets. A dashboard showing high device utilization is insufficient if the input stream silently changes.

## Why this exists

**DERIVED.** A stalled training loop can reflect storage latency, decode saturation, host memory pressure, an empty prefetch queue, or a rank waiting for a failed peer. Each mechanism needs a different corrective action. Aggregate tokens per second cannot identify the bottleneck unless the measurement boundary and token population are explicit.

**DERIVED.** Throughput can even improve after a defect: skipping a slow shard reduces I/O and makes the remaining stream faster. A monitor that treats every skipped item as successful recovery then rewards a changed dataset. Performance and semantic completeness must be observed together.

## Intuition

**DERIVED.** Use two linked views. The resource view tracks bytes, queue occupancy, stage times, and backpressure. The semantic view tracks identities and counts as records are accepted, rejected, split, packed, delivered, and committed. Resource measurements locate delay; semantic accounting detects a changed experiment.

> **Definition — ingestion conservation ledger.** A stage-by-stage account of input identities and their accepted, rejected, failed, or still-pending outcomes, with explicit mappings for one-to-many transformations.

> **Definition — deletion propagation.** Traversal from revoked source identities through recorded dependencies to invalidate or rebuild affected retained artifacts and prevent further admissible consumption.

**DERIVED.** Removing a source object is not equivalent to removing derived copies, and neither establishes that a trained model has forgotten its influence.

## Formulation

**MATHEMATICALLY-DERIVED — lossless classification of inputs.** At a record-local stage with mutually exclusive, exhaustive terminal dispositions,

$$
n_{\mathrm{in}}=
n_{\mathrm{accepted}}+n_{\mathrm{rejected}}+
n_{\mathrm{failed}}+n_{\mathrm{pending}}.
$$
*(Eq. 12.14)*

where counts refer to distinct input identities at a fixed observation boundary. The equality does not imply that output-record count equals accepted-input count: extraction can emit several children. Track child multiplicity separately.

**MATHEMATICALLY-DERIVED — input-stage capacity.** If a serial decode stage processes $v_{\mathrm{decode}}$ decoded bytes per second and an output occurrence requires an average of $\bar q_{\mathrm{decode}}>0$ decoded bytes under the measured workload, its average service capacity is bounded by

$$
r_{\mathrm{decode}}\le
\frac{v_{\mathrm{decode}}}{\bar q_{\mathrm{decode}}}.
$$
*(Eq. 12.15)*

where $r_{\mathrm{decode}}$ is occurrences per second. Similar stage bounds must use compatible units before taking their minimum. Compression ratio, tokenizer expansion, and supervised-target fraction prevent an unqualified conversion from storage bandwidth to training tokens per second.

**MATHEMATICALLY-DERIVED — transient stall coverage.**

$$
t_{\mathrm{cover}}=\frac{K_{\mathrm{ready}}}{r_{\mathrm{consume}}},
\qquad
\Delta K=(r_{\mathrm{produce}}-r_{\mathrm{consume}})\Delta t.
$$
*(Eq. 12.16)*

where $K_{\mathrm{ready}}$ is ready occurrences and rates are occurrences per second. The first relation assumes production stops and consumption remains constant; the second describes constant-rate queue evolution before capacity or emptiness changes behavior. Buffering delays starvation but cannot repair a persistent average production deficit.

~~~figure
id: fig-12.18
kind: calculator
title: Ready-queue outage coverage
caption: Eq. 12.16 is illustrative arithmetic with production stopped and constant consumption; it is not a measured latency or throughput result.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-12.16
alt: A ready queue of 128 occurrences covers 0.5 seconds at a configured consumption rate of 256 occurrences per second when no new work arrives.
spec:
  tex: t_{\mathrm{cover}}=K_{\mathrm{ready}}/r_{\mathrm{consume}}
  equation: "12.16"
  inputs:
    - {symbol: ready, label: ready occurrences, default: 128, min: 0, max: 1000000, format: integer}
    - {symbol: rate, label: configured occurrences per second, default: 256, min: 1, max: 1000000, format: fixed3}
  outputs:
    - {symbol: seconds, label: outage coverage in seconds, formula: ready/rate, format: fixed3}
~~~

## Mechanism

**DERIVED.** Instrument the transitions between fetch, decode, transform, collate, transfer, and consumption. Measure durations with a monotonic clock local to the process. A timestamp's nanosecond unit does not establish nanosecond accuracy; report clock resolution and aggregation overhead if they affect the interpretation. Cross-host timestamps need a synchronization error model before being subtracted.

~~~figure
id: fig-12.19
kind: systems-trace
title: Input-stage evidence boundaries
caption: Each stage exposes a different resource and failure boundary. No timing values are asserted without an executed workload.
placement: inline
evidence: DERIVED
source: DERIVED:eq-12.14
alt: Fetch observes requests and bytes, decode observes expansion and corruption, collate observes masks and retained targets, and commit observes acknowledged occurrence identities.
spec:
  columns: [latency, memory, compute, communication, failure]
  stages:
    - {name: fetch, values: {latency: request and retry time, memory: compressed buffers, communication: fetched bytes, failure: missing or mismatched object}}
    - {name: decode, values: {memory: decoded bytes, compute: parser and decompressor work, failure: corruption or expansion limit}}
    - {name: collate, values: {memory: tensors and segment metadata, compute: packing and mask construction, failure: invalid target boundary}}
    - {name: transfer, values: {latency: device-ready wait, communication: host-to-device bytes, failure: allocation or copy failure}}
    - {name: commit, values: {latency: exposed input wait, failure: occurrence or counter mismatch}}
~~~

**DERIVED.** Attribute input wait only at the consumer boundary where unavailable input delays required work. Summing fetch durations over parallel workers overstates exposed delay. Summing overlapping decode and transfer spans double-counts wall time. Record both service work and critical-path waiting, with their aggregation definitions.

**DERIVED.** Missing objects and corrupt objects require distinct handling. A transient transport failure can be retried against the same immutable identity within a bounded budget. A verified digest mismatch is an integrity failure; silently accepting a different replica defeats the manifest. A permanently missing object should stop an exact-run contract, or trigger an explicit revised-snapshot policy with recorded excluded identities. “Skip and continue” changes the experiment.

**DERIVED.** Quarantine preserves an error descriptor, source identity, stage, and reason without indiscriminately copying sensitive payloads into logs. Metrics should use bounded reason codes. Per-record identities belong in an access-controlled audit ledger rather than as unbounded metric labels, which can make monitoring memory grow with corpus size.

**DERIVED.** Lineage audits sample consumed occurrences and trace them backward through pack, token, transform, and source identities. Sampling measures coverage on the selected audit population; it cannot certify that every unsampled record has complete lineage. For an exact completeness claim, validate referential integrity over the whole relevant inventory.

**MATHEMATICALLY-DERIVED — audit sensitivity.** If an audit samples $m$ records independently with replacement from a population where the violation fraction is $p_{\mathrm{bad}}$, the probability of observing no violation is

$$
P(\mathrm{zero\ findings})=(1-p_{\mathrm{bad}})^m.
$$
*(Eq. 12.17)*

where the independence and sampling design are explicit mathematical conditions. With $p_{\mathrm{bad}}=0.01$ and $m=100$, this probability is approximately $0.366$. Zero findings in that fixture would not justify claiming zero defects.

**DERIVED.** Deletion propagates over a dependency graph. Revoke the source identity, determine reachable descendants, invalidate affected snapshots or rebuild their partitions, and advance the admissible-snapshot pointer. Cached shards, tokenized copies, packed files, exported subsets, and saved iterator state may all retain references. An active reader needs a declared revocation boundary: immediate interruption or an explicitly authorized later boundary. The technical implementation cannot choose policy authority implicitly.

**DERIVED.** Aggregate artifacts complicate deletion. If a dictionary, filter statistic, or duplicate representative was computed from the removed input, its descendants can change even when they do not contain literal copies. A record-level reverse index that tracks only byte containment misses those semantic dependencies. Retain both content lineage and transform-dependency lineage.

## Algorithm

**DERIVED — proposed invalidation procedure.**

~~~text
Algorithm 12.6 — Propagate revocation through a finite lineage graph
INPUT: revoked source identities; dependency graph; active snapshot inventory
OUTPUT: Result(affected artifacts and replacement plan, lineage error)
STATE: bounded traversal queue; visited set; invalidation ledger
INVARIANT: an artifact is selectable only if its required ancestors are admissible
1. Validate source identities and the dependency graph's version.
2. Traverse descendants, recording each visited artifact once.
3. Mark containing shards, derived statistics, indexes, and packs as affected.
4. Block new selection of affected snapshots under the declared policy.
5. Rebuild or remove affected artifacts; verify remaining dependency identities.
6. Validate replacement snapshots before selecting them for new readers.
7. Reconcile active readers, caches, exports, and checkpoint references.
8. Report unresolved copies and model-training influence separately.
~~~

**DERIVED — complexity.** With indexed adjacency, graph traversal takes $O(n_{\mathrm{visited}}+n_{\mathrm{edges,visited}})$ time. A dense finite artifact index permits a bitset visited structure; a general key store needs an explicitly analyzed lookup cost. Rebuilding affected bytes is additional work. Traversal success is not evidence that an unregistered external export was found.

## Implementation

**OFFICIAL-DOCUMENTATION — [R12.11](references.md#r1211).** TorchTitan's README identifies logging and profiling facilities alongside checkpointable loading. **DERIVED.** This establishes an inspection route under *Distributed training*, not a claim that the full conservation and revocation design is built in. PyTorch is the *Model / autograd framework* boundary; NVIDIA Megatron-Core and MosaicML LLM Foundry are other *Distributed training* consumers whose data adapters must expose comparable identities.

**DERIVED.** Track producer, ready, delivered, and committed counters as separate quantities. Include per-stage input/output bytes, rejection reasons, retry counts, queue high-water marks, and partial-pack occupancy. Sampling expensive traces can control observer cost, but exact conservation counters must not depend on randomly sampled events if exact accounting is claimed.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 12.6 — Fault localization without silent data change

- **Hypothesis:** each injected fault produces a classified symptom and preserves the selected semantic policy.
- **Setup:** inject faults at object retrieval, decoding, collation, and snapshot selection.
- **Independent variables:** delayed object, missing object, corrupt bytes, expansion limit, and revoked ancestor.
- **Controlled variables:** immutable corpus, scheduled occurrences, transforms, and retry budget.
- **Dataset/workload:** the Chapter 12 fixture plus a dependency graph with shared descendants.
- **Hardware:** record host, storage, network, device, precision, and runtime when timings are collected.
- **Metrics:** Eq. 12.14, input wait, bytes, retries, omitted identities, and invalidation coverage.
- **Baselines:** uninterrupted run and an intentionally silent-skip implementation.
- **Expected result:** faults remain visible; exact continuation either succeeds against fixed identities or stops explicitly.
- **Ablation:** disable lineage edges for one derived statistic and require the audit to fail.
- **Interpretation:** distinguish recovered availability from preserved experiment identity.
- **Threats to validity:** incomplete fault models and faults injected only at convenient boundaries.

## Observations

**What the paper claims.** **PAPER-REPORTED — P05.** Dolma documents construction and intermediate corpus analysis; it is evidence for inspectable curation, not proof of complete deletion propagation.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Conservation and queue equations expose distinct semantic and resource constraints.

**What we infer.** **DERIVED.** A correct operational dashboard must connect measured activity to committed occurrence identity.

**What remains unknown.** **UNVERIFIED.** Fault frequencies, timing distributions, and deletion coverage of any deployment require retained operational evidence.

## Failure modes

~~~figure
id: fig-12.20
kind: stat-panel
title: Semantic conservation
caption: Proposed invariants for this section; these are design requirements, not measured deployment status.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-12.14
alt: >-
  population: input identities at one boundary. outcomes: accepted / rejected / failed / pending. child records: separate multiplicity ledger. revocation: known dependency closure.
spec:
  header: SEMANTIC CONSERVATION
  rows:
    - {key: "population", value: "input identities at one boundary"}
    - {key: "outcomes", value: "accepted / rejected / failed / pending"}
    - {key: "child records", value: "separate multiplicity ledger"}
    - {key: "revocation", value: "known dependency closure"}
~~~

> **Failure mode — silent shard omission.** **DERIVED.** *Symptom:* throughput improves while exposure changes. *Cause:* unrecoverable reads treated as successful skips. *Detection:* compare planned and committed occurrence counts. *Mitigation:* stop or publish a revised snapshot explicitly.

> **Failure mode — incomplete deletion closure.** **DERIVED.** *Symptom:* revoked source content remains selectable through derived artifacts. *Cause:* incomplete reverse lineage or stale caches. *Detection:* descendant and active-reader audit. *Mitigation:* invalidate the full recorded dependency closure and report unknown exports.

## Siblings

**DERIVED.** Stage timing diagnoses delay; conservation accounting diagnoses exposure; integrity verification diagnoses bytes; lineage traversal diagnoses dependency reachability. None substitutes for the others. [§12.5](12-5-resume-semantics.md) owns checkpoint consistency, while [§7.4](../ch07-data-provenance-acquisition-and-dataset-semantics/07-4-rights-and-governance-metadata.md) owns admissible-use metadata and governance decisions.

## Extensions

**DERIVED.** For online collection, monitor accepted environment events separately from generated tokens and policy updates. For media, track bytes and duration alongside text tokens. A common “samples per second” counter can hide a shift from expensive videos to cheap text records.

## Limitations

**DERIVED.** Finite audits cannot establish universal absence of defects without exhaustive scope. Dataset deletion does not establish model unlearning. The chapter specifies technical propagation and explicit unknowns; it does not make a jurisdiction-specific legal compliance claim.

## Reproducibility

**DERIVED — required artifact.** Retain metric definitions, measurement boundaries, clock information, sampling policy, conservation ledgers, fault schedule, retry outcomes, dependency graph, revocation ledger, and unresolved-copy inventory. Performance reports must include workload, topology, precision, software revisions, concurrency, and cache state.

## References

[P05 — Dolma](references.md#p05); [R12.5 — PyTorch data](references.md#r125); [R12.6 — Megatron data pipeline](references.md#r126); [R12.9 — LLM Foundry](references.md#r129); [R12.11 — TorchTitan](references.md#r1211).
