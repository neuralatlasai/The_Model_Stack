---
id: ms.section.12.2
entity_type: section
title: Transformation execution
short_title: Transformation execution
section: 12.2
slug: 12-2-transformation-execution
parent: ms.chapter.12
prev_sibling: ms.section.12.1
next_sibling: ms.section.12.3
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.section.12.1]
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

# 12.2 Transformation execution

## Scope

**KNOWN — chapter matrix.** This section covers distributed parsing and filtering, map/reduce boundaries, resource estimates, skew, and incremental rebuilds. The predicates themselves belong to Chapter 08; here the issue is whether concurrent execution preserves their declared semantics. The baseline is an ad hoc transformation whose outputs depend on worker completion order or stale caches. Success requires an auditable build graph, bounded tasks, explicit failure outcomes, and publication of one complete output snapshot.

## Why this exists

**DERIVED.** Parallelism introduces several orders: source order, task assignment order, completion order, and publication order. Only the first is normally part of the dataset definition. If a builder concatenates results as they finish, a transient slow machine changes the output order. If the next operation keeps the first duplicate, timing can change corpus membership as well as order.

**DERIVED.** A second problem appears when a build is rerun. Reusing output is correct only when every semantic input remains unchanged. The transform function can be identical while an external classifier, tokenizer file, or allowlist changes. A cache keyed only by the function name then conflates distinct computations. Reproducible execution requires explicit dependency identity and an output validation boundary.

## Intuition

**DERIVED.** A task should represent a finite transformation of named input revisions, not “whatever records this worker finds.” Workers can execute tasks in arbitrary order if the coordinator interprets outcomes by stable task identity. This separates scheduling freedom from semantic freedom. Faster workers may process more tasks, but must not acquire authority to choose which records survive.

> **Definition — semantic build key.** A digest of all declared inputs that can affect a transformation's logical output, including dependency revisions and the treatment of randomness.

**DERIVED.** A byte digest is necessary for identity but cannot discover an undeclared dependency. The build key is only as complete as the boundary around the transform.

## Formulation

**DERIVED — functional contract.** Let $F$ be a versioned transform, $\mathcal{X}$ its ordered input partitions, $\gamma$ its configuration, $\eta$ its external dependency identities, and $r_F$ its explicit randomness description. The proposed cache key is

$$
k_F=H\!\left(\operatorname{canon}
(\mathcal{X},F_{\mathrm{id}},\gamma,\eta,r_F)\right).
$$
*(Eq. 12.3)*

where $H$ is a declared cryptographic hash and $\operatorname{canon}$ is a versioned canonical serialization. Hash collisions are treated as a residual integrity risk, not an algebraic impossibility.

**MATHEMATICALLY-DERIVED — scheduling lower bound.** For $p$ interchangeable workers, positive task times $t_j$, and a dependency graph with critical-path duration $t_{\mathrm{path}}$,

$$
t_{\mathrm{build}}\ge
\max\left(\frac{\sum_{j=1}^{n_{\mathrm{task}}}t_j}{p},
\max_j t_j,\ t_{\mathrm{path}}\right).
$$
*(Eq. 12.4)*

where durations include the work represented by each task. The inequality assumes a worker executes at most one modeled task at once; separate shared-storage constraints can increase the lower bound. It is not a wall-clock prediction.

**MATHEMATICALLY-DERIVED.** If one task requires 100 work units while nine require one each, ten workers still need at least 100 units under indivisible-task execution. Total-work division yields only 10.9. The gap is caused by granularity, so adding workers cannot close it.

~~~figure
id: fig-12.6
kind: calculator
title: Parallel build lower bound
caption: Eq. 12.4 exposes the independent limits from total work, the longest task, and the critical path. Values are illustrative work units.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-12.4
alt: With 109 work units, ten workers, a 100-unit longest task and critical path, the lower bound remains 100 units.
spec:
  tex: t_{\mathrm{build}}\ge\max(t_{\mathrm{sum}}/p,t_{\mathrm{max}},t_{\mathrm{path}})
  equation: "12.4"
  inputs:
    - {symbol: work, label: total work, default: 109, min: 1, max: 10000, format: fixed3}
    - {symbol: p, label: workers, default: 10, min: 1, max: 256, format: integer}
    - {symbol: longest, label: longest task, default: 100, min: 1, max: 10000, format: fixed3}
    - {symbol: path, label: critical path, default: 100, min: 1, max: 10000, format: fixed3}
  outputs:
    - {symbol: lower, label: lower bound, formula: "max(work/p,longest,path)", format: fixed3}
~~~

## Mechanism

**OFFICIAL-DOCUMENTATION — [R12.3](references.md#r123), [R12.4](references.md#r124).** Hugging Face Datasets documents batched and multiprocess mapping, along with cache fingerprints that incorporate previous dataset state and the transform. **DERIVED.** Such fingerprints support reuse within their documented scope; they are not proof that an arbitrary network lookup or mutable file read inside a callback is captured.

**DERIVED.** Divide the build into record-local and global operations. Parsing a document and applying a fixed classifier can be record-local. Selecting a canonical representative of a duplicate group is global with respect to that group. Computing an exact corpus statistic and then filtering by it requires a materialized dependency or a defined approximation. Treating all three as freely reorderable maps changes the algorithm.

**DERIVED.** For a global keyed stage, partition by a stable key and use a deterministic tie-breaker independent of arrival. A total order such as source priority followed by stable record identity makes representative selection reproducible. A comparison-sort implementation costs $O(n\log n)$ comparisons for $n$ records; the comparison must operate on precomputed fixed-width keys if a bounded per-comparison cost is claimed. Repeatedly parsing the full document inside a comparator introduces an additional document-length factor.

**DERIVED.** Skew requires a semantic diagnosis before resharding. Large independent documents can be assigned as separate tasks. A huge duplicate group cannot simply be split and reduced independently unless the merge operation preserves the intended representative and metadata. An associative summary, such as the minimum under a declared total order plus an exact count, permits hierarchical reduction. A nonassociative heuristic needs a specified reduction tree or a different algorithm.

~~~figure
id: fig-12.7
kind: diagram
title: Deterministic publication after parallel work
caption: Task completion can be unordered. Output selection and manifest ordering remain functions of declared task identities.
placement: inline
evidence: DERIVED
source: DERIVED:eq-12.3
alt: A semantic build key creates finite tasks. Workers write staged outputs. Validation selects one result per task before canonical manifest publication.
spec:
  direction: LR
  nodes:
    - {id: key, kind: state, label: semantic build key}
    - {id: tasks, kind: dataset, label: finite task inventory}
    - {id: workers, kind: process, label: parallel bounded transforms}
    - {id: stage, kind: memory, label: staged outputs}
    - {id: valid, kind: process, label: validate and select}
    - {id: manifest, kind: dataset, label: committed manifest}
  edges:
    - {from: key, to: tasks}
    - {from: tasks, to: workers}
    - {from: workers, to: stage}
    - {from: stage, to: valid}
    - {from: tasks, to: valid, kind: dependency}
    - {from: valid, to: manifest}
~~~

**DERIVED.** Incremental rebuilds invalidate the dependency closure of changed inputs. A changed document can invalidate one parse partition, the duplicate groups it participates in, any global counts that include it, and later tokenized or packed artifacts. A manifest of stage-level dependencies is conservative but can rebuild much more than necessary. Record- or key-level lineage narrows the affected set at the cost of a larger index and more complicated validation.

**DERIVED.** A content-preserving re-encoding and a semantic change should have different audit descriptions, even if both generate new physical digests. The former can reuse logical identity after an equivalence check; the latter must advance transformation identity. Reusing a semantic identifier because output sizes happen to match is invalid.

## Algorithm

**DERIVED — proposed task state machine.**

~~~text
Algorithm 12.2 — Build with deterministic retry and publication
INPUT: dependency DAG; immutable inputs; resource caps; finite retry budget
OUTPUT: Result(complete snapshot, classified build failure)
STATE: task ledger with pending/running/succeeded/failed outcomes
INVARIANT: each logical task contributes at most one validated result
1. Validate acyclicity and resolve every dependency to an immutable identity.
2. Derive stable task keys from semantic build keys and partition identities.
3. Reuse a cached result only after descriptor and output validation.
4. Dispatch ready tasks subject to aggregate memory and I/O admission limits.
5. Write each attempt to its own unpublished artifact identity.
6. Validate outcome, counts, reason ledger, and output hashes.
7. Select one successful outcome per task; record other attempts as redundant.
8. Retry transient failures within budget; terminate on semantic failures.
9. Canonically assemble results only when every required task is successful.
10. Publish a new snapshot; on failure keep the previous snapshot selected.
~~~

**DERIVED — complexity.** Dependency traversal takes $O(n_{\mathrm{stage}}+n_{\mathrm{edge}})$ with adjacency lists. Record-local passes cost $O(Q)$ only when the parser and predicate are themselves bounded linear-time operations over $Q$ input bytes; that is a requirement to verify, not a property implied by “map.” External sorting introduces $O(n\log n)$ comparisons plus spill I/O. Retain at most the admitted task buffers and bounded in-flight metadata; reject unbounded whole-corpus accumulation.

## Implementation

**OFFICIAL-DOCUMENTATION — [R12.10](references.md#r1210).** The Dolma toolkit documents parallel processing, taggers, and data-curation components. **DERIVED.** Its role here is a routed corpus-build example, not evidence that the proposed publication protocol is its implementation.

**DERIVED — stack placement.** Hugging Face Datasets supplies the plan-anchored map interface. PyTorch, at *Model / autograd framework*, consumes tensorized outputs. NVIDIA Megatron-Core and MosaicML LLM Foundry, at *Distributed training*, provide downstream dataset representations [R12.5](references.md#r125), [R12.6](references.md#r126), [R12.9](references.md#r129). A build adapter must preserve record identities across those boundaries.

**DERIVED.** Budget resident input, decoded output, serialization buffers, and spill space separately. A task cap based only on input bytes fails when decoding or tokenization expands data. Shared storage bandwidth and CPU decompression capacity are admission constraints. Launching one process per logical core is not a capacity model when each process also invokes multithreaded libraries.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 12.2 — Scheduler independence and incremental equivalence

- **Hypothesis:** a declared deterministic build returns identical logical records despite task-order and retry changes.
- **Setup:** run one serial build and parallel builds with controlled delays and failed attempts.
- **Independent variables:** worker count, task order, partition skew, and retry point.
- **Controlled variables:** input digests, transform and dependency versions, seeds, canonical order.
- **Dataset/workload:** bounded fixtures containing duplicate keys, malformed records, oversized inputs, and one-to-many extraction.
- **Hardware:** record CPU, RAM, storage, and per-process thread limits.
- **Metrics:** output digest, membership differences, reason counts, critical-path time, and peak bytes.
- **Baselines:** clean serial rebuild and clean full rebuild after one dependency change.
- **Expected result:** semantic equivalence; physical bytes match only if encoding is deterministic too.
- **Ablation:** intentionally omit one external dependency from the key to test stale-cache detection.
- **Interpretation:** an incremental build is correct only when it agrees with the clean rebuild.
- **Threats to validity:** incomplete fixtures and a shared bug in both builders.

## Observations

**What the paper claims.** **PAPER-REPORTED — P05.** Dolma makes corpus construction inspectable; the chapter does not extrapolate a throughput guarantee.

**What the evidence shows.** **OFFICIAL-DOCUMENTATION.** Multiprocess mapping and fingerprint reuse are documented mechanisms. Distributed transactional publication is not established by those interfaces.

**What we infer.** **DERIVED.** Parallel scheduling can be changed independently of dataset semantics when task identity, tie-breaking, and publication are explicit.

**What remains unknown.** **UNVERIFIED.** Exact recovery behavior and determinism of any unpinned end-to-end deployment require the proposed checks.

## Failure modes

~~~figure
id: fig-12.8
kind: stat-panel
title: Build commit contract
caption: Proposed invariants for this section; these are design requirements, not measured deployment status.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-12.3
alt: >-
  task identity: semantic key + partition. attempts: bounded and isolated. selection: one validated outcome. rollback: prior manifest remains selected.
spec:
  header: BUILD COMMIT CONTRACT
  rows:
    - {key: "task identity", value: "semantic key + partition"}
    - {key: "attempts", value: "bounded and isolated"}
    - {key: "selection", value: "one validated outcome"}
    - {key: "rollback", value: "prior manifest remains selected"}
~~~

> **Failure mode — timing-dependent representative.** **DERIVED.** *Symptom:* membership changes after retry. *Cause:* first-arrival duplicate selection. *Detection:* compare group representatives across schedules. *Mitigation:* deterministic total-order reduction.

> **Failure mode — stale semantic cache.** **DERIVED.** *Symptom:* changing a classifier leaves output unchanged unexpectedly. *Cause:* missing dependency identity. *Detection:* compare incremental and clean rebuilds. *Mitigation:* complete the key and invalidate affected descendants.

## Siblings

**DERIVED.** Materialized transformations, owned here, spend storage to make stages inspectable and independently recoverable. On-the-fly transforms in [§12.3](12-3-sampling-and-loading.md) save intermediate storage but execute again during replay and couple failures to training. A global reduce changes the coordination boundary relative to a record-local map; it must preserve grouping and tie-breaking, not merely match output schema. Snapshot publication in [§12.1](12-1-storage-and-formats.md) is the common commit boundary.

## Extensions

**DERIVED.** Model-based filtering adds weight identity, precision, decoding policy, and potentially nondeterministic device execution to the semantic contract. For live trajectories, closed event windows can become immutable build inputs; an open-ended stream requires a watermark policy and a separate record of late events.

## Limitations

**DERIVED.** Logical determinism does not imply equal resource use. Different task schedules may produce identical outputs with different spill traffic. Equally, byte-identical output does not certify that the predicate is scientifically appropriate; predicate validity remains an upstream evaluation responsibility.

## Reproducibility

**DERIVED — required artifact.** Retain dependency keys, task inventory, limits, retry classifications, selected attempt identities, validation results, and canonical output order. Record whether timestamps and compression headers are included in physical equivalence. Never report byte nondeterminism as record nondeterminism without locating the changed field.

## References

[P05 — Dolma](references.md#p05); [R12.3 — processing](references.md#r123); [R12.4 — fingerprints](references.md#r124); [R12.5 — PyTorch](references.md#r125); [R12.6 — indexed datasets](references.md#r126); [R12.9 — LLM Foundry](references.md#r129); [R12.10 — Dolma toolkit](references.md#r1210).
