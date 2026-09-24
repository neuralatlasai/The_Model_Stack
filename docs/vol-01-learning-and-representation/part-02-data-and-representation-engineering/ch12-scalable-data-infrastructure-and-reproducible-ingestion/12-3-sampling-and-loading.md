---
id: ms.section.12.3
entity_type: section
title: Sampling and loading
short_title: Sampling and loading
section: 12.3
slug: 12-3-sampling-and-loading
parent: ms.chapter.12
prev_sibling: ms.section.12.2
next_sibling: ms.section.12.4
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.section.12.2]
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

# 12.3 Sampling and loading

## Scope

**KNOWN — chapter matrix.** This section owns execution of a sampling policy through streaming, shuffling, bucketing, worker partitioning, sample weights, and replication control. Chapter 09 owns the statistical mixture policy; the loader must realize that policy without silently changing exposure. The baseline is a set of independent workers that each iterate the same source. Success requires explicit ownership of every scheduled occurrence and agreement between intended and delivered order, multiplicity, and weights.

## Why this exists

**DERIVED.** A worker is an execution unit, not a statistically independent dataset. Starting the same iterator in several processes can duplicate the source. Conversely, applying rank sharding in two layers can discard records. Neither error necessarily changes tensor shapes or produces an exception, so ordinary training progress can conceal a wrong exposure distribution.

**DERIVED.** Another distortion occurs when scheduling favors records that decode quickly. With a fixed stopping time, long documents or expensive media can be underrepresented even when the initial draw was correct. Bucket formation, padding, tail handling, and queue ordering are therefore part of the realized data distribution.

## Intuition

**DERIVED.** Separate selection from placement. Selection creates a logical occurrence stream according to the experiment's sampling policy. Placement assigns those occurrences to data-parallel consumers and their workers. Physical prefetch may run ahead, but it must not redefine logical consumption order unless the experiment explicitly studies such a policy.

> **Definition — occurrence identity.** A stable identifier for one scheduled draw of a record, incorporating the sampling epoch or draw position so intentional repeated draws remain distinguishable from accidental replication.

**DERIVED.** A source record can appear twice legitimately. An occurrence identifier should appear once in the committed exposure stream unless the replay policy explicitly counts re-execution after rollback separately.

## Formulation

**MATHEMATICALLY-DERIVED — disjoint placement.** For a finite stream of $n_{\mathrm{occ}}$ globally indexed occurrences and $p$ consumers, define

$$
\mathcal{I}_r=\{j:0\le j<n_{\mathrm{occ}},\ j\bmod p=r\},
\qquad r\in\{0,\ldots,p-1\}.
$$
*(Eq. 12.5)*

where $\mathcal{I}_r$ is the set owned by consumer $r$. Unique integer remainder gives pairwise disjointness and complete union. With $p_{\mathrm{dp}}$ data-parallel ranks and $w$ workers per rank, $p=p_{\mathrm{dp}}w$ and the flattened identity is $r=r_{\mathrm{dp}}w+r_{\mathrm{worker}}$, where $r_{\mathrm{dp}}$ and $r_{\mathrm{worker}}$ are zero-based rank and worker indices.

**DERIVED.** The formula states ownership, not an efficient access plan. Having every worker read and discard all nonowned records multiplies scanning. Resolve ownership at shard or indexed-range granularity where possible while retaining the occurrence-level proof. When shard lengths differ, equal shard counts do not imply equal token loads.

**MATHEMATICALLY-DERIVED — weighted estimator.** If record $i$ is drawn with positive probability $q_i$, while the intended record-level objective has normalized weight $a_i$, then

$$
\mathbb{E}_{i\sim q}\left[\frac{a_i}{q_i}\ell_i\right]
=\sum_i a_i\ell_i.
$$
*(Eq. 12.6)*

where $\ell_i$ is a declared record-level loss and $q_i>0$ wherever $a_i>0$. This elementary identity clarifies a loader obligation; [§9.1](../ch09-data-mixtures-curricula-and-sample-efficiency/09-1-mixture-formulation.md) owns mixture design. Drawing according to $a_i$ and multiplying by $a_i$ again generally targets a different objective.

**MATHEMATICALLY-DERIVED — bounded prefetch.**

$$
M_{\mathrm{prefetch}}\le w f M_{\mathrm{batch,max}},
\qquad
M_{\mathrm{shuffle}}\le K M_{\mathrm{record,max}}.
$$
*(Eq. 12.7)*

where $f$ is the enforced queued-batch limit per worker, $K$ is shuffle-buffer capacity, and the two maximum sizes are verified byte bounds. Decoder workspaces, worker processes, collator copies, pinned buffers, and allocator overhead are excluded and require separate budgets.

~~~figure
id: fig-12.9
kind: calculator
title: Bounded prefetch payload
caption: Eq. 12.7 bounds queued payload only. Worker memory, decode workspaces, pinned copies, and model tensors are additional.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-12.7
alt: Eight workers with two queued batches each and a 16 MiB maximum batch need at most 256 MiB of queued payload.
spec:
  tex: M_{\mathrm{prefetch}}\le w f M_{\mathrm{batch,max}}
  equation: "12.7"
  inputs:
    - {symbol: w, label: workers, default: 8, min: 1, max: 128, format: integer}
    - {symbol: f, label: queued batches per worker, default: 2, min: 1, max: 32, format: integer}
    - {symbol: mb, label: maximum batch bytes, default: 16777216, min: 1024, max: 1073741824, format: bytes}
  outputs:
    - {symbol: M, label: payload bound, formula: w*f*mb, format: bytes}
~~~

## Mechanism

**OFFICIAL-DOCUMENTATION — [R12.5](references.md#r125).** PyTorch documents that iterable datasets are replicated across worker processes and require distinct worker configuration to avoid duplicates. Its distributed sampler can pad with additional indices or drop a tail to obtain divisibility. **DERIVED.** Those are explicit sampling policies, not invisible implementation details; record either repeated or excluded occurrences.

**DERIVED.** Exact uniform shuffling of an in-memory list can use a descending swap process: at position $j$, select uniformly among positions $0$ through $j$. By induction, each of the $n!$ permutations occurs with probability $1/n!$ under independent uniform integer draws. This costs $O(n)$ swaps and $O(n)$ stored identifiers, with random-access storage traffic.

**OFFICIAL-DOCUMENTATION — [R12.2](references.md#r122).** Hugging Face's iterable shuffle samples from a finite buffer and can shuffle shard order. **DERIVED.** A buffer of capacity $K<n$ cannot realize every global permutation: the first emitted record must come from the initially reachable buffered prefix. Seed reproducibility does not remove that support restriction. Increasing $K$ changes the mixing scale and memory requirement together.

**DERIVED.** Bucketing limits padding by grouping similar lengths, but a global length sort creates a curriculum. A bounded-window bucket policy reduces that coupling: first select a fixed logical window, sort its references by precomputed length, form batches, and apply a declared batch-order shuffle. For window size $K$, this costs $O(K\log K)$ fixed-width comparisons and $O(K)$ references. It is a different sequence distribution from a global shuffle, so preserve the policy in the experiment identity.

~~~figure
id: fig-12.10
kind: diagram
title: Selection before worker placement
caption: Statistical selection defines occurrences. Rank and worker ownership distribute them; prefetch does not independently draw from the corpus.
placement: inline
evidence: DERIVED
source: DERIVED:eq-12.5
alt: A snapshot feeds a selected occurrence stream, followed by rank ownership, worker ownership, bounded queues, and ordered consumption.
spec:
  direction: LR
  nodes:
    - {id: snap, kind: dataset, label: immutable snapshot}
    - {id: select, kind: process, label: declared sampling policy}
    - {id: occ, kind: state, label: occurrence sequence}
    - {id: own, kind: process, label: rank and worker ownership}
    - {id: queue, kind: memory, label: bounded prefetch}
    - {id: consume, kind: process, label: ordered consumption}
  edges:
    - {from: snap, to: select}
    - {from: select, to: occ}
    - {from: occ, to: own}
    - {from: own, to: queue}
    - {from: queue, to: consume}
~~~

**DERIVED.** Data-parallel placement must follow the training topology, not the global accelerator rank. Tensor- or pipeline-parallel participants can cooperate on the same logical examples. Sharding the data independently across every device can give cooperating ranks inconsistent inputs. The trainer must specify the data-parallel group and any input broadcast policy; this chapter does not infer topology from device count.

**DERIVED.** Tail handling has two separate boundaries. A sampler can equalize rank sample counts; a batcher can drop a partial batch. Either can remove or duplicate exposure, and both can act together. In synchronous execution, unequal collective participation can also prevent progress. Resolve the tail policy before comparing quality or speed.

## Algorithm

**DERIVED — finite indexed reference procedure.**

~~~text
Algorithm 12.3 — Deliver disjoint scheduled occurrences
INPUT: immutable occurrence array; data-parallel topology; worker topology
OUTPUT: Result(ordered batches with occurrence identities, loading error)
STATE: next logical position; bounded outstanding requests; completed queue
INVARIANT: each occurrence has one owner and at most one accepted completion
1. Validate occurrence identity uniqueness and all referenced snapshot digests.
2. Compute the explicit owner of each logical occurrence.
3. Dispatch bounded indexed reads only for the current owner's assigned ranges.
4. Verify returned record identity, payload, and weight against the schedule.
5. Reorder completed reads by local logical position within a bounded window.
6. Form batches using the declared bucket and tail policy.
7. Deliver tensors, identities, and supervised-token metadata together.
8. Advance the consumer cursor only after the trainer's declared acknowledgement.
9. Return a classified error on missing data, exhausted retry budget, or mismatch.
~~~

**DERIVED — complexity.** Indexed ownership and dispatch are $O(n_{\mathrm{occ}})$ metadata work. A ring of bounded reorder slots offers $O(1)$ insertion by relative sequence index if the dispatch window is enforced. A general heap costs $O(\log K)$ per completion. The procedure does not include record decoding cost. An unbounded “wait until all earlier records arrive” completion map violates the memory contract; backpressure must stop dispatch.

## Implementation

**OFFICIAL-DOCUMENTATION.** PyTorch (*Model / autograd framework*) documents loader and sampler behavior [R12.5](references.md#r125). NVIDIA Megatron-Core (*Distributed training*) documents sample mappings [R12.6](references.md#r126). MosaicML LLM Foundry (*Distributed training*) links training to StreamingDataset-format preparation [R12.9](references.md#r129).

**DERIVED.** Treat these as alternatives with different scheduling and state contracts. Do not stack multiple samplers without tracing which layer owns each split. A useful adapter returns an occurrence manifest beside tensors; stripping that metadata at collation makes later duplication audits unnecessarily indirect. Host-to-device overlap requires measured transfer and compute timelines; queue capacity alone does not establish overlap.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 12.3 — Exposure under topology changes

- **Hypothesis:** the intended occurrence set survives changes in worker count at fixed data-parallel ownership.
- **Setup:** assign stable identities to every synthetic record and log ordered delivered batches.
- **Independent variables:** ranks, workers, buffer size, bucket window, and decode delays.
- **Controlled variables:** snapshot, selection policy, seed, number of scheduled occurrences.
- **Dataset/workload:** prime-sized record counts, unequal shard sizes, repeated draws, and heavy-tailed lengths.
- **Hardware:** record host topology and storage; a device is unnecessary for ownership checks.
- **Metrics:** multiplicity, omissions, order divergence, token exposure, queue bytes, and stall durations.
- **Baselines:** a single-consumer oracle and an intentionally replicated iterator.
- **Expected result:** the oracle and compliant placement agree on declared invariants.
- **Ablation:** apply sharding twice; ensure the audit detects lost exposure.
- **Interpretation:** differences allowed by a declared ordering policy remain separate from accidental omissions.
- **Threats to validity:** treating intentional sampling repeats as loader duplicates.

## Observations

**What the paper claims.** **OFFICIAL-DOCUMENTATION.** The loading references describe partitioning, shuffling, and sampler behavior rather than an independent quality comparison.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** Eq. 12.5 proves disjoint ownership only for its stated topology and occurrence sequence.

**What we infer.** **DERIVED.** Statistical policy and execution placement should have separate recorded identities.

**What remains unknown.** **UNVERIFIED.** Whether a production adapter preserves those identities under worker failures requires an execution trace.

## Failure modes

~~~figure
id: fig-12.11
kind: stat-panel
title: Occurrence ownership
caption: Proposed invariants for this section; these are design requirements, not measured deployment status.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-12.5
alt: >-
  selection: one logical schedule. placement: data-parallel group + worker. intentional repeat: distinct occurrence identity. acknowledgement: consumer boundary.
spec:
  header: OCCURRENCE OWNERSHIP
  rows:
    - {key: "selection", value: "one logical schedule"}
    - {key: "placement", value: "data-parallel group + worker"}
    - {key: "intentional repeat", value: "distinct occurrence identity"}
    - {key: "acknowledgement", value: "consumer boundary"}
~~~

> **Failure mode — accidental replication.** **DERIVED.** *Symptom:* the same occurrence appears on multiple consumers. *Cause:* identical iterable replicas. *Detection:* count occurrence multiplicities. *Mitigation:* one explicit ownership function.

> **Failure mode — fast-record preference.** **DERIVED.** *Symptom:* expensive records lose exposure before a fixed cutoff. *Cause:* completion-order consumption. *Detection:* compare delivered and selected distributions by decoding cost. *Mitigation:* ordered consumption or a declared alternative policy.

## Siblings

**DERIVED.** Indexed sampling trades an index and access traffic for direct placement; streaming trades direct addressability for sequential locality. Full permutation trades identifier memory for a uniform permutation; finite-buffer shuffle preserves bounded memory but changes ordering support. Length bucketing changes batch composition rather than source eligibility. These alternatives are owned here; [§12.4](12-4-packing-and-masks.md) addresses layout after occurrences have been selected.

## Extensions

**DERIVED.** Interactive trajectories require episode-aware ownership when adjacent events cannot be independently shuffled. Multimodal bucketing may need joint text, image, and audio cost estimates; text length alone can leave extreme memory imbalance. These are proposed scheduling extensions, not verified recipe recommendations.

## Limitations

**DERIVED.** Disjointness is not representativeness. A perfectly partitioned schedule can still have a wrong mixture, and exact record weights can still yield a wrong token-level objective after truncation. Audit actual supervised tokens at [§12.4](12-4-packing-and-masks.md).

## Reproducibility

**DERIVED — required artifact.** Record occurrence construction, topology, rank grouping, worker mapping, shuffle implementation, seed derivation, bucket windows, tail rules, weights, prefetch caps, and completion-order policy. Store both requested and resolved values.

## References

[R12.2 — streaming](references.md#r122); [R12.5 — PyTorch data](references.md#r125); [R12.6 — Megatron data pipeline](references.md#r126); [R12.9 — LLM Foundry](references.md#r129).
