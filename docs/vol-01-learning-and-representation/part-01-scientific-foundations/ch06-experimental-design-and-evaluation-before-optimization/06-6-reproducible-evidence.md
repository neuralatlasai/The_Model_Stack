---
id: ms.section.6.6
entity_type: section
title: Reproducible evidence
short_title: Reproducible evidence
volume: 1
part: 1
chapter: 6
section: 6.6
slug: 06-6-reproducible-evidence
parent: ms.chapter.6
prev_sibling: ms.section.6.5
next_sibling: ms.verification.6
children: []
prerequisites: [ms.section.1.6, ms.section.3.6, ms.section.6.1, ms.section.6.2, ms.section.6.3, ms.section.6.4, ms.section.6.5]
downstream: [ms.chapter.12, ms.chapter.30, ms.chapter.61, ms.chapter.66]
related: [ms.frontmatter.notation]
siblings_by_mechanism: [ms.section.3.6]
relations:
  - {type: supported_by, target: paper.P50}
  - {type: supported_by, target: reference.R6.4}
  - {type: evaluated_by, target: experiment.6.6}
axes: {lifecycle: [evaluation, pretraining, serving], mechanism: [immutable_manifest, outcome_provenance, reproducible_analysis], feedback_setting: [], modality: [text]}
papers: [P07, P50]
implementations: [impl.hugging-face-transformers, impl.pytorch, impl.vllm, impl.sglang]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 6.6 Reproducible evidence

## Scope

Objective: bind hypotheses, immutable manifests, raw outcomes, provenance, negative results, and extrapolation limits into one auditable evidence package. Baseline: a score table plus a command containing mutable model and dataset names. Success: another researcher can reconstruct every reported statistic, identify every failed or excluded run, and distinguish a registered test from exploratory analysis. Numerical repeatability is owned by [§3.6](../ch03-numerical-computation-and-trustworthy-training/03-6-reproducibility-limits.md); dataset provenance is developed in [Chapter 07](../../part-02-data-and-representation-engineering/ch07-data-provenance-acquisition-and-dataset-semantics/README.md), ingestion in [Chapter 12](../../part-02-data-and-representation-engineering/ch12-scalable-data-infrastructure-and-reproducible-ingestion/README.md), and release assurance in [Chapter 66](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch66-release-decisions-reproducibility-and-research-to-production-closure/README.md).

## Why this exists

**PAPER-REPORTED · [P50](references.md).** HELM releases raw prompts and completions alongside its evaluation framework. **PAPER-REPORTED · [R6.4](references.md).** The LM Evaluation Harness authors identify protocol sensitivity and incomplete reporting as obstacles to reproducible language-model evaluation. **PAPER-REPORTED · [R6.30](references.md).** Nosek et al. distinguish generating hypotheses from testing predictions and motivate specifying the analysis before observing outcomes.

**DERIVED.** The missing object is often neither a model nor a metric: it is the relationship between the exact input, the exact execution, the exact scoring rule, and the published aggregate. A repository can retain code while losing that relationship through mutable datasets, overwritten results, or silent parser fixes. The resource constraint is storage and operational discipline sufficient to retain evidence without placing unbounded logging on the model's critical path.

## Intuition

**DERIVED.** A reproducible claim is a directed dependency chain. If a result depends on a checkpoint, prompt, response, and scorer, each dependency must be retrievable and identified. A hash detects changed bytes when compared with a trusted digest; it does not prove that the bytes were correct, lawful to distribute, or recorded before outcomes were inspected. Timing of preregistration therefore requires an independently retained timestamp or witnessed record in addition to content hashes.

**ASSUMED.** The proposal uses an append-only evidence store with bounded asynchronous writers, immutable published snapshots, and explicit access controls for restricted data. A public index may expose hashes and aggregate statistics while authorised reviewers receive the underlying restricted records. Restricted evidence limits public replay; it must be declared rather than described as fully open reproduction.

## Formulation

> **Definition — preregistration.** A retained, dated commitment to hypotheses, design, analysis, and stopping rules made before the relevant outcomes are observed; changes are recorded as deviations rather than replacing the commitment.

> **Definition — benchmark manifest.** The immutable record binding the evaluation-unit components, benchmark protocols, partitions, and implementation revisions to identified artifact bytes.

> **Definition — raw-outcome log.** An append-only record of attempted evaluations, their responses or failure states, and the information required to recompute scoring and aggregation.

> **Definition — negative-result record.** A result record for an arm that did not support its registered hypothesis, preserving the estimate, uncertainty, failures, and the limits of the conclusion.

> **Definition — extrapolation envelope.** The tested range of system components, workloads, populations, and budgets outside which the recorded evidence does not establish the claim.

| Local symbol | Meaning | Representation |
|---|---|---|
| M | benchmark manifest | canonical serialized bytes |
| H | cryptographic content digest | fixed-length digest |
| O | finite raw-outcome records | append-only shards |
| v_score | scorer identity | code revision plus configuration digest |
| v_analysis | estimator identity | code revision plus configuration digest |
| A | deterministic analysis function on retained outcomes | declared estimator |
| E | tested extrapolation envelope | categorical values and observed ranges |

**ASSUMED.** The evidence dependency rule is

$$
\mathrm{result}=A_{v_{\mathrm{analysis}}}
\big(\mathrm{score}_{v_{\mathrm{score}}}(O),M\big),\qquad
\mathrm{result\_record}=\big(H(M),H(O),v_{\mathrm{score}},v_{\mathrm{analysis}},E\big).
$$
*(Eq. 6.14)* where H(O) denotes a digest of an ordered shard index and its content digests, not an order-insensitive sum of record hashes. This is a proposed artifact contract, not a claim about an existing framework implementation.

```figure
id: fig-6.28
kind: diagram
title: The dependency chain behind one result record
caption: >-
  Eq. 6.14 as a provenance graph. The heavy path is what makes a result
  recomputable: raw outcomes O, scored by a pinned v_score, reduced by a
  pinned v_analysis against the manifest M, into a record that carries both
  digests and the envelope E. As the reader scrolls, the lit nodes follow
  the section: the equation, then what is frozen before the job, then what
  the algorithm commits, then which edge each failure mode breaks. A broken
  edge leaves the score standing but its reconstruction UNVERIFIED.
placement: rail
anchor: formulation
evidence: ASSUMED
source: ["DERIVED:eq-6.14", "DERIVED:alg-6.6", R6.30]
concepts: [ms.section.6.6]
alt: >-
  Diagram of the evidence dependency chain. A witnessed preregistration
  freezes the manifest M, whose digest is H(M). M feeds the run node (data
  shards, code revision, environment, execution window), which produces a
  checkpoint. The evaluation node joins the checkpoint and rendered prompts
  and writes raw outcomes O, digested as H(O) over an ordered shard index.
  The emphasised path: O is scored by score with v_score, then reduced by
  the analysis A with v_analysis, which also reads M, to the result record
  (H(M), H(O), v_score, v_analysis, E). The extrapolation envelope E feeds
  the record. A dashed model-alias node marks a location standing in for a
  content version, which breaks the run's identity.
spec:
  direction: TB
  nodes:
    - { id: prereg, kind: state, label: "preregistration", sub: "witnessed timestamp, not a self-dated file" }
    - { id: M, kind: memory, label: "manifest M → H(M)", sub: "canonical bytes, one serialisation" }
    - { id: alias, kind: dependency, label: "model alias or path", sub: "a location, not a content version" }
    - { id: run, kind: process, label: "run", sub: "shards, code revision, environment, window" }
    - { id: ckpt, kind: model, label: "checkpoint", sub: "shards, config, tokenizer, template" }
    - { id: ev, kind: process, label: "evaluation", sub: "checkpoint + rendered prompts" }
    - { id: O, kind: memory, label: "raw outcomes O → H(O)", sub: "ordered shard index, append-only" }
    - { id: sc, kind: process, label: "score, v_score", sub: "code revision + config digest" }
    - { id: A, kind: process, label: "analysis A, v_analysis", sub: "declared estimator" }
    - { id: E, kind: boundary, label: "extrapolation envelope E", sub: "tested components, workloads, budgets" }
    - { id: rec, kind: metric, label: "result_record", sub: "(H(M), H(O), v_score, v_analysis, E)", emphasis: true }
  edges:
    - { from: prereg, to: M, label: "freezes" }
    - { from: M, to: run }
    - { from: alias, to: run, kind: dependency, label: "substitutes for a revision" }
    - { from: run, to: ckpt }
    - { from: ckpt, to: ev }
    - { from: ev, to: O }
    - { from: O, to: sc, kind: emphasis }
    - { from: sc, to: A, kind: emphasis }
    - { from: M, to: A, kind: dependency, label: "M" }
    - { from: A, to: rec, kind: emphasis }
    - { from: E, to: rec }
states:
  - { anchor: formulation, label: "Eq. 6.14", highlight: [O, sc, A, rec, M], note: "result = A(score(O), M). The record binds both digests and both code identities, so another reader can recompute the statistic without regenerating a single output." }
  - { anchor: mechanism, label: "freeze before the job", highlight: [prereg, M, run, ckpt], note: "Freeze the claim, then the representation, then hash. A checkpoint index includes shards, config, tokenizer, added tokens and chat template; a dirty tree is recorded as a patch." }
  - { anchor: algorithm, label: "Algorithm 6.6, lines 3–8", highlight: [ev, O, sc, A], note: "Attempts are registered before dispatch, shards commit with checksum and row count, and the pinned scorer and estimator run only on committed shards." }
  - { anchor: failure-modes, label: "three broken edges", highlight: [alias, prereg, O], note: "A mutable identifier breaks run identity, an unwitnessed registration breaks the timing claim, and a success-only log breaks O. The score survives each; its reconstruction does not." }
```

**ASSUMED.** A logical attempt key is `(manifest_id, arm_id, training_seed, task_id, item_id, sample_id, attempt_id)`. Each physical retry has a distinct attempt id and points to its logical request. The registered policy determines which attempts contribute to a scientific score. Product evaluation includes user-visible retry costs; an intrinsic single-attempt model evaluation cannot silently take the best retry.

```figure
id: fig-6.29
kind: stat-panel
title: The logical attempt key and its duplicate rules
caption: >-
  The seven-field key of this section, read as an instrument. It is the
  granularity at which outcomes.jsonl is unique. The first seven rows
  identify one attempt. The rest are the rules that stop retries,
  retransmissions and provider-side timeouts from turning into extra
  independent samples, the pseudoreplication of §6.4 arriving through the
  storage layer. This is a proposed contract, not the schema of an existing
  harness.
placement: rail
anchor: formulation
evidence: ASSUMED
source: ["DERIVED:eq-6.14", "DERIVED:alg-6.6"]
alt: >-
  Instrument panel of the logical attempt key. Fields: manifest_id, the
  frozen manifest; arm_id, the registered arm; training_seed, the
  independent seed block; task_id, a task with a fixed weight; item_id, an
  item with its cluster id stored alongside; sample_id, a generation h of m;
  attempt_id, one per physical retry. Rules: a retry takes a new attempt_id
  under the same logical request; an identical retransmission is stored
  once; the same id with different bytes is an integrity failure; the
  registered policy decides which attempts count, never a silent best of
  retries; a timeout after the provider accepted the request leaves
  execution uncertain and is not a new sample.
spec:
  header: "ATTEMPT KEY · outcomes.jsonl"
  rows:
    - { key: "manifest_id", value: "frozen manifest served" }
    - { key: "arm_id", value: "registered arm" }
    - { key: "training_seed", value: "independent seed block" }
    - { key: "task_id", value: "task, fixed weight w_j" }
    - { key: "item_id", value: "item; cluster id stored alongside" }
    - { key: "sample_id", value: "generation h of m" }
    - { key: "attempt_id", value: "one per physical retry" }
    - { key: "retry", value: "new attempt_id, same logical request" }
    - { key: "identical retransmission", value: "stored once, idempotent" }
    - { key: "same id, different bytes", value: "integrity failure" }
    - { key: "which attempts count", value: "registered policy, never best-of" }
    - { key: "timeout after acceptance", value: "execution uncertain, not a sample" }
states:
  - { anchor: formulation, label: "seven-field key", highlight: [manifest_id, arm_id, training_seed, task_id, item_id, sample_id, attempt_id], note: "One committed record per attempt key. Cluster ids travel with items, so §6.4's clustered interval can be recomputed from the log alone." }
  - { anchor: mechanism, label: "exactly-once is not claimed", highlight: ["identical retransmission", "same id, different bytes", "timeout after acceptance"], note: "A client log cannot prove exactly-once generation. It can enforce one record per id, reject conflicting duplicates, and keep uncertain executions out of the estimator." }
  - { anchor: failure-modes, label: "success-only log", highlight: [attempt_id, retry, "which attempts count"], note: "Attempts registered before dispatch make missing outcomes visible. Without them a failed job never reaches the writer and the log shows only survivors." }
```

## Mechanism

**DERIVED.** Freeze the claim before the job. The hypothesis specifies population, intervention, primary metric, practical margin, resource boundary, independent replication, and falsification condition. A stopping rule specifies when the planned information collection ends. A fixed seed list alone is insufficient: it leaves the researcher free to choose a favourable task subset, aggregation, or checkpoint. Archive the full selection procedure and tuning budget so the procedure being evaluated can itself be reproduced.

**DERIVED.** Freeze the representation before hashing. Choose one serialisation encoding, ordering, numeric representation, and policy for missing values. Store original files as immutable bytes and hash them directly; if semantic canonicalisation is used, retain its specification and version. A path or model alias identifies a location, not a content version. A checkpoint index must include tensor shards, configuration, tokenizer, added tokens, and chat template where these affect execution. Record a dirty working-tree patch rather than claiming that a clean commit alone identifies local modifications.

**ASSUMED.** Provenance is a finite graph of consumed and produced artifacts. A run node links the input manifest, data shard list, code revision, environment, execution window, and output checkpoint. An evaluation node links the checkpoint and rendered prompts to raw outcomes. A scoring node links outcomes to scorer revision and score records. A summary node links those records to the estimator and confidence policy. Missing edges make the corresponding reconstruction UNVERIFIED even when the final score exists.

**DERIVED.** Retain raw outcomes at the granularity required by the analysis. Clustered uncertainty needs item and cluster ids, not only task averages. Exact-match rescoring needs response text or an authorised equivalent, not just correctness bits. Timing analysis needs request start and delivery events under one monotonic clock boundary; a wall-clock timestamp alone is inadequate for subtracting durations across hosts. Include cancellation, refusal, truncation, parse failure, timeout, and transport failure as distinguishable states. This permits different registered estimands without pretending those outcomes are interchangeable.

**ASSUMED.** A bounded writer records attempts before dispatch, streams bounded response chunks, and finalises records after the outcome. If the buffer fills, backpressure pauses dispatch or fails the run visibly; silent dropping is prohibited. A completed shard is published through a conditional or atomic storage operation only after its checksum and row count are recorded. Storage-specific guarantees are UNVERIFIED until the chosen backend is tested. A restart reads committed shards and resumes unfinished logical requests according to the registered retry policy.

**DERIVED.** Exactly-once physical generation is usually not established by a client log: a timeout can occur after a provider accepted the request. The evidence store can still enforce one committed record per attempt id, preserve uncertainty about provider execution, and prevent duplicate records from entering the estimator. A conflicting duplicate with the same id but different bytes is an integrity failure; an identical retransmission is an idempotent storage retry. Do not convert either into a new independent sample.

**DERIVED.** Negative outcomes are informative only with their precision and completion state. A wide interval failing to exceed δ is inconclusive. An interval inside the equivalence margin supports a bounded practical statement. A numerical divergence or OOM is a feasibility result for the tested configuration, not a low capability score unless that was the registered operational metric. Report the full planned run count, completed count, failure count, and exclusion reasons before interpreting an average over survivors.

**DERIVED.** Corrections produce new result versions. If a scorer bug is found after release, preserve the original responses and published summary, document the bug and affected runs, and compute a new summary with a new scorer identity. If the bug changed generation or selected checkpoints, rescoring cannot repair the experiment. That requires a new execution or an explicit limitation. An audit trail distinguishes a repaired metric from a reconstructed training history that never existed.

```figure
id: fig-6.30
kind: compare
title: What each registered outcome supports, and what must travel with it
caption: >-
  Six terminal states of a registered contrast, read on one axis: the claim
  each licenses and the misreading it invites. The "not to be read as" row
  is the section's argument. A wide interval is not equivalence, an OOM is
  not a low score, and an integrity failure says nothing about the model.
  The last column is the correction path. A scorer bug found after release
  produces a new version, and only if generation was untouched.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-6.14", "DERIVED:alg-6.6"]
concepts: [ms.section.6.6]
alt: >-
  Comparison of six outcome states. Lower bound above δ: supports practical
  improvement at that boundary; not transfer outside E; published with the
  estimate, interval, δ and independent counts; recorded in the result
  record. Interval inside ±δ: supports a bounded equivalence statement; not
  "no effect anywhere"; δ must predate the results; recorded in
  negative_results.md. Wide interval: inconclusive; not equivalence;
  published with planned and completed runs; negative_results.md.
  Divergence or OOM: a feasibility result for the tested configuration; not
  a low capability score unless registered as the operational metric;
  published with planned, completed and failed counts; negative_results.md
  and terminal statuses in outcomes.jsonl. Integrity failure: no
  complete-evidence claim; not evidence about model quality; published with
  the named failure and affected records; deviations.md or a new version.
  Scorer bug after release: a new result version with a new scorer
  identity; not a repaired experiment if generation or checkpoint selection
  was affected; a new version linked to the old.
spec:
  axis: >-
    What a registered outcome licenses, the misreading it invites, and what
    must be published with it; outcomes are not ranked
  columns:
    - { id: imp, label: "lower bound > δ" }
    - { id: eqv, label: "interval inside ±δ" }
    - { id: inc, label: "wide interval" }
    - { id: feas, label: "divergence or OOM" }
    - { id: integ, label: "integrity failure" }
    - { id: fix, label: "scorer bug after release" }
  rows:
    - { dimension: "licenses", values: { imp: "practical improvement at the registered boundary", eqv: "a bounded practical-equivalence statement", inc: "inconclusive: neither improvement nor equivalence", feas: "a feasibility result for the tested configuration", integ: "no complete-evidence claim", fix: "a new result version with a new v_score" } }
    - { dimension: "not to be read as", values: { imp: "transfer outside the envelope E", eqv: "no effect anywhere", inc: "equivalence", feas: "a low capability score, unless registered as the metric", integ: "evidence about model quality", fix: "a repaired experiment if generation or selection changed" } }
    - { dimension: "published with", values: { imp: "estimate, interval, δ, independent counts", eqv: "interval and a δ fixed before results", inc: "planned vs completed runs; the missing independent evidence", feas: "planned, completed and failed counts; configuration", integ: "the named failure and affected records", fix: "bug, affected runs, original summary retained" } }
    - { dimension: "record", values: { imp: "result_record (Eq. 6.14)", eqv: "negative_results.md", inc: "negative_results.md", feas: "negative_results.md; terminal status in outcomes.jsonl", integ: "deviations.md or a new version", fix: "new version linked to the old; never replaced" } }
```

**DERIVED — cost line.** Evidence retention does not add model parameters, but storing r checkpoints costs roughly r times checkpoint bytes before deduplication. Raw-response bytes scale with attempted output tokens; event logs scale with attempts and deliveries. Hashing and serialization require linear CPU work and memory traffic in artifact bytes. Bounded buffers cap resident memory; network traffic includes replication of the retained evidence. Asynchronous logging can hide some latency but cannot eliminate its bandwidth or energy cost. Money depends on storage, retention, retrieval, and execution policies; all numerical overheads remain UNVERIFIED.

## Algorithm

```text
Algorithm 6.6 — Publish an auditable evidence package
INPUT   frozen preregistration; manifest; finite registered run list; bounded event stream
OUTPUT  immutable evidence index and analysis records, or a typed integrity failure
STATE   committed shard index; logical request registry; pending attempt set
INVARIANT  no published record is overwritten; every aggregate identifies its dependencies
1  Validate required identities and retain a witnessed preregistration timestamp.
2  Hash exact input artifacts; reject unresolved required revisions before dispatch.
3  Register logical requests and attempts; append start events before execution.
4  Persist bounded response/failure records; use backpressure when buffers are full.
5  On shard completion, verify checksum and row count; commit a new immutable shard.
6  Reconcile all registered runs and requests against completed or failed terminal states.
7  Reject conflicting duplicate attempt ids; retain identical storage retries once.
8  Run the pinned scorer and estimator on the committed shard set.
9  Publish every registered arm, deviations, negative results, and the tested envelope.
10 If any dependency changes, create a new version linked to the old one; never replace it.
```

**DERIVED.** Hashing is O(Z) in total retained bytes Z; uniqueness validation by sorting bounded keys is O(n log n) for n attempts. External sorting bounds memory for large logs. Provenance traversal is O(V_nodes + E_edges), independent of model FLOPs. Execution terminates at the finite run list or explicit failure. Runtime scheduling and a production storage implementation are outside this manuscript.

```figure
id: fig-6.31
kind: diagram
title: One attempt through Algorithm 6.6
caption: >-
  The life of a single logical request, with Algorithm 6.6's line numbers.
  Registration happens before dispatch. That is what makes a missing outcome
  visible instead of silently absent. Every terminal state, including all
  six failure kinds, lands in the same bounded buffer. The buffer applies
  backpressure rather than dropping records. The heavy path is the
  commit-and-reconcile tail, where duplicates are sorted into idempotent
  retransmissions and integrity failures before any estimator runs.
placement: inline
evidence: ASSUMED
source: ["DERIVED:alg-6.6", "DERIVED:eq-6.14"]
concepts: [ms.section.6.6]
alt: >-
  Diagram of one attempt in Algorithm 6.6. A witnessed preregistration (line
  1) precedes hashing of the exact input artifacts, which rejects unresolved
  revisions (line 2). The logical request and attempt id are registered and
  a start event appended before dispatch (line 3). The attempt goes to an
  engine or endpoint and reaches a terminal branch: a response, or one of
  cancellation, refusal, truncation, parse failure, timeout and transport
  failure. Both enter a bounded buffer that applies backpressure when full
  and never drops (line 4). A retry loops back as a new attempt id. The
  emphasised path: an immutable shard committed with checksum and row count
  (line 5); reconciliation of registered runs against terminal states (line
  6); a duplicate check (line 7) that sends conflicting bytes to an
  integrity failure and passes unique ids or identical retransmissions on;
  the pinned scorer and estimator (line 8); and publication of every arm,
  deviation, negative result and envelope (line 9). A changed dependency
  creates a new version linked to the old (line 10).
spec:
  direction: LR
  nodes:
    - { id: pre, kind: state, label: "witnessed preregistration", sub: "line 1" }
    - { id: hash, kind: process, label: "hash exact inputs", sub: "line 2; reject unresolved revisions" }
    - { id: reg, kind: process, label: "register request + attempt id", sub: "line 3; start event before dispatch" }
    - { id: exec, kind: process, label: "dispatch to engine or endpoint" }
    - { id: term, kind: branch, label: "terminal state?" }
    - { id: resp, kind: state, label: "response" }
    - { id: fail, kind: state, label: "failure state", sub: "cancel · refusal · truncation · parse · timeout · transport" }
    - { id: retry, kind: feedback, label: "retry", sub: "new attempt id, same logical request" }
    - { id: buf, kind: memory, label: "bounded buffer", sub: "line 4; full → backpressure, never drop" }
    - { id: shard, kind: memory, label: "immutable shard", sub: "line 5; checksum + row count" }
    - { id: rec, kind: process, label: "reconcile runs vs terminal states", sub: "line 6" }
    - { id: dup, kind: branch, label: "duplicate attempt id?", sub: "line 7" }
    - { id: integ, kind: state, label: "integrity failure", sub: "same id, different bytes" }
    - { id: est, kind: process, label: "pinned scorer + estimator", sub: "line 8" }
    - { id: pub, kind: metric, label: "publish arms, deviations, negatives, E", sub: "line 9", emphasis: true }
    - { id: ver, kind: state, label: "new version linked to old", sub: "line 10; never replace" }
  edges:
    - { from: pre, to: hash }
    - { from: hash, to: reg }
    - { from: reg, to: exec }
    - { from: exec, to: term }
    - { from: term, to: resp }
    - { from: term, to: fail }
    - { from: resp, to: buf }
    - { from: fail, to: buf }
    - { from: fail, to: retry, kind: feedback, label: "policy allows" }
    - { from: retry, to: reg, kind: feedback }
    - { from: buf, to: shard, kind: emphasis }
    - { from: shard, to: rec, kind: emphasis }
    - { from: rec, to: dup, kind: emphasis }
    - { from: dup, to: integ, label: "conflicting bytes" }
    - { from: dup, to: est, kind: emphasis, label: "unique or identical retransmission" }
    - { from: est, to: pub, kind: emphasis }
    - { from: pub, to: ver, kind: dependency, label: "dependency changes" }
```

## Implementation

**OFFICIAL-DOCUMENTATION · [R6.3](references.md).** LM Evaluation Harness documents sample logging, cache controls, and seed settings. **OFFICIAL-DOCUMENTATION · [R6.5](references.md).** HELM exposes run, summarisation, and inspection commands; its repository states that it entered maintenance mode on 1 June 2026. Both are outside the §4 stack and are routed by the plan's evaluation anchors. Neither documentation statement certifies this chapter's proposed artifact contract.

**OFFICIAL-DOCUMENTATION · [R6.36](references.md).** Hugging Face Transformers documents chat templates and warns against duplicated special tokens. **ASSUMED.** At the *Model definition / adaptation* layer, archive those template bytes with tokenizer artifacts. At the *Model / autograd framework* layer, record PyTorch configuration and numerical settings. At the *Inference engine* layer, record vLLM or SGLang configuration, batching, cache policy, and revision. Driver/compiler, kernels, and hardware identity complete the execution boundary. No pinned implementation or executed benchmark is claimed.

## Experimental design

### Experiment 6.6 — Independent replay and fault injection

- **Hypothesis:** the retained package reproduces the registered statistics and exposes incomplete evidence without regenerating model outputs.
- **Setup:** proposal; two independent analysis implementations consume the same immutable raw records.
- **Independent variables:** parser revision; record ordering; injected duplicate, missing record, truncated shard, and modified manifest.
- **Controlled variables:** original raw bytes, metric semantics, task weights, cluster ids, registered failure handling.
- **Dataset/workload:** the finite outcomes planned in [verification.md](verification.md); no outcomes exist yet.
- **Hardware:** CPU analysis environments with versions recorded; model hardware is irrelevant to pure rescoring but retained in provenance.
- **Metrics:** exact count agreement; score and interval agreement within registered numerical tolerances; detection of corrupt dependencies.
- **Baselines:** published aggregate only, and a complete package with verified dependencies.
- **Expected result:** the complete package permits replay; each integrity violation produces a named failure rather than a silently altered score.
- **Ablation:** remove cluster ids or the scorer version and identify which claims become unreconstructable.
- **Interpretation:** a missing dependency rejects the package's replay claim; it does not by itself refute model quality.
- **Threats to validity:** two implementations may share the same misunderstood metric; restricted inputs may prevent independent access.

## Observations

**What the paper claims.** PAPER-REPORTED: P50 advocates broad, transparent evaluation; R6.4 documents reproducibility challenges; R6.30 explains the role of preregistration in separating prediction from postdiction.

**What the evidence shows.** DERIVED: retaining raw outputs makes rescoring possible when the scoring inputs are complete. It does not make future stochastic executions identical.

**What we infer.** DERIVED: publish the dependency chain, selection procedure, and rejected hypotheses with the statistic, so the claim's exact boundary remains inspectable.

**What remains unknown.** UNVERIFIED: replay fidelity, storage-failure behaviour, runtime pins, and all overhead measurements for the proposed implementation. NOT-DISCLOSED: hidden provider execution details that a client manifest cannot recover.

## Failure modes

> **Failure mode — Mutable identifier [DERIVED].** *Symptom:* rerunning a model name yields different bytes. *Cause:* an alias substituted for a revision. *Detection:* compare retained artifact digests. *Mitigation:* pin the complete artifact set and publish a new manifest when it changes.

> **Failure mode — Unwitnessed registration [DERIVED].** *Symptom:* a file contains a date but has no independent record of when it existed. *Cause:* self-reported time treated as proof. *Detection:* inspect the timestamp provenance. *Mitigation:* describe it as a planning record until a witnessed commitment exists.

> **Failure mode — Success-only log [DERIVED].** *Symptom:* planned run ids are absent from outcomes. *Cause:* failed jobs never reached the result writer. *Detection:* reconcile registered attempts with terminal records. *Mitigation:* register attempts before dispatch and preserve failure states.

## Siblings

**Numerical repeatability — [§3.6](../ch03-numerical-computation-and-trustworthy-training/03-6-reproducibility-limits.md).** DERIVED: holds execution conditions fixed to examine repeated computations. The objective is numerical agreement; evidence replay instead reconstructs a statistic from retained outcomes and cannot guarantee identical future generations.

**Dataset provenance — [Chapter 07](../../part-02-data-and-representation-engineering/ch07-data-provenance-acquisition-and-dataset-semantics/README.md).** ASSUMED forward route: traces acquisition and transformation of data. The changed primitive is dataset lineage rather than result lineage; a complete source history still needs an execution record showing what a run consumed.

**Release assurance — [Chapter 66](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch66-release-decisions-reproducibility-and-research-to-production-closure/README.md).** ASSUMED forward route: connects evidence to deployment criteria and accountability. A reproducible score may still be insufficient for release if the intended workload lies outside E.

## Extensions

**ASSUMED.** Agent evidence adds tool input/output, environment state references, retries, and side-effect receipts. Multimodal evidence adds exact media bytes, decoding libraries, sampling rates, and frame selection. Long-context evidence retains truncation and retrieval order. Domain adaptation adds starting-checkpoint lineage and data selection. Each extension is a new dependency set with a corresponding storage and confidentiality boundary.

## Limitations

**DERIVED.** Content identity is not scientific validity. A perfectly replayable contaminated benchmark remains contaminated. Closed endpoints may prevent execution replay despite complete client logs. Legal or privacy constraints can restrict raw-data distribution; disclose the restricted boundary and available audit path. No manifest turns an untested workload into supported extrapolation.

## Reproducibility

**ASSUMED.** [verification.md](verification.md) specifies the proposed six-file package, required fields, and acceptance criteria. It is an illustrative design rather than an executed or witnessed preregistration. Source pages were opened on 2026-09-20; moving documentation has no implied implementation commit. Every proposed experiment remains unexecuted.

## References

[Chapter reference register](references.md): P07, P50; R6.2, R6.3, R6.4, R6.5, R6.30, R6.33, R6.35, R6.36. Numerical boundary: [§3.6](../ch03-numerical-computation-and-trustworthy-training/03-6-reproducibility-limits.md).
