---
id: ms.section.24.6
entity_type: section
title: Parametric versus external memory
short_title: Where persistent changes live
volume: 1
part: 4
chapter: 24
section: 24.6
slug: 24-6-parametric-versus-external-memory
parent: ms.chapter.24
prev_sibling: ms.section.24.5
next_sibling: ms.verification.24
children: []
prerequisites: [ms.chapter.6, ms.chapter.12, ms.section.24.1, ms.section.24.4, ms.section.24.5]
downstream: [ms.chapter.49, ms.chapter.50, ms.chapter.53, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [adaptation, inference, serving, assurance], mechanism: [memory_boundary, provenance, versioned_state], feedback_setting: [], modality: [text]}
papers: []
implementations: []
benchmarks: [MQuAKE]
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 24.6 — Parametric versus external memory

## Scope

[DERIVED] Choose the persistence boundary for a change: shared weights, task-specific parameters, a versioned evidence store, or bounded service state. Compare acquisition, retention, freshness, provenance, deletion scope, and lifetime cost under the same workload. This section owns the adaptation decision and its state contract; retrieval algorithms, context construction, and agent-memory policies belong to Chapters 49, 50, and 53.

## Why this exists

[MATHEMATICALLY-DERIVED] A parameter update changes a function shared by many inputs. A document update changes which evidence can be retrieved, while leaving the generator unchanged. Their failure surfaces therefore differ: a successful local weight edit can damage unrelated behavior; an accurate replacement document can be missed, misinterpreted, or overridden. Neither update automatically repairs the complete service.

[PAPER-REPORTED] RAG combines a trainable retriever and generator with an external document index. Its index-swapping experiment changes the accessible Wikipedia snapshot without updating model parameters and evaluates questions about leaders who changed between snapshots. This demonstrates a particular test-time update route, with substantial residual error rather than universal factual replacement. [R24.21], §§2,4.5, “Index hot-swapping.”

[DERIVED] The dominant constraint depends on the required change. A stable reusable skill can justify parameter training. Rapidly changing records with source attribution can favor external evidence. A behavioral restriction can require a service control even when the underlying knowledge remains. The choice must specify what is allowed to persist, which readers may observe it, and how a failed update is reversed. These requirements precede the choice of editing, continual training, or retrieval.

## Intuition

[MATHEMATICALLY-DERIVED] Externalizing a fact makes its storage identity explicit; it does not make the final answer causally depend on that fact. Consider a generator that ignores all retrieved text. Its document store can be perfectly fresh while answer accuracy is unchanged. Conversely, a generator can correctly copy stale evidence. Store freshness and evidence use are independently testable properties.

[DERIVED] A system can combine both paths: weights supply language and procedural competence, while external records supply current values and citations. The required consistency boundary then includes their interaction. A new index built with an incompatible embedding model can reduce retrieval despite fresher content. An old response cache can conceal a correct index rollout. A stored summary can retain information that was removed from the source store. Treat these as distinct state identities rather than calling all of them “the model.”

## Formulation

| Symbol | Meaning | Unit or shape |
|---|---|---|
| $\theta_v$ | Generator parameter version | Parameter vector |
| $\mathcal D_v,\mathcal I_v$ | Document snapshot and associated index | Versioned sets/artifacts |
| $\psi_v$ | Retriever/embedding configuration | Versioned parameters/configuration |
| $\mathcal C_v,\mathcal H_v$ | Response cache and retained application history | Versioned stores |
| $\mathcal P_v$ | Access, provenance, and retention policy | Predicate/configuration |
| $U$ | Number of updates during a declared horizon | Count |
| $Q$ | Number of serviced queries in that horizon | Count |
| $c_{\mathrm{train}},c_{\mathrm{index}}$ | Incremental cost per respective update | Same chosen cost unit |
| $c_{\mathrm{base}},c_{\mathrm{ext}}$ | Base inference cost and added external-evidence cost per query | Same cost unit |

[DERIVED] Define the released service artifact and its evidence-conditioned output as

$$
\begin{aligned}
\mathcal S_v&=(\theta_v,\psi_v,\mathcal D_v,\mathcal I_v,
\mathcal C_v,\mathcal H_v,\mathcal P_v),\\
E_v(x,a)&=\operatorname{Retrieve}_{\psi_v}
(x,\mathcal I_v,\mathcal P_v(a)),\\
Y_v(x,a)&\sim p_{\theta_v}(\,\cdot\mid x,E_v(x,a),\mathcal H_v(a)).
\end{aligned}
$$

*(Eq. 24.30)*

[DERIVED] The caller identity $a$ enters evidence and history permissions. The equation specifies the uncached path; a cache hit must additionally satisfy the same version and authorization predicate. Identical weights do not imply identical service behavior when any other component differs. The artifact identity is a digest of the full manifest, including configuration rather than just tensor files.

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Compare four intervention classes by the state they modify. Full continual training changes $\theta$ and usually optimizer state. Adapter training adds route-dependent parameters while preserving a base only under the conditions in §24.3. Editing changes a chosen parameter subspace and requires locality tests from §24.4. External updating changes $\mathcal D,\mathcal I$ and possibly $\psi$, leaving $\theta$ fixed. The last intervention guarantees unchanged generator tensors, not unchanged answers, because the conditioning changes.

[DERIVED] A versioned external update has three separable invariants:

$$
\begin{aligned}
\mathsf{Link}(v)&:\quad
\operatorname{ids}(\mathcal I_v)\subseteq\operatorname{ids}(\mathcal D_v),\\
\mathsf{Compat}(v)&:\quad
\operatorname{embedVersion}(\mathcal I_v)=\operatorname{version}(\psi_v),\\
\mathsf{Allowed}(v,a)&:\quad
E_v(x,a)\subseteq\{d\in\mathcal D_v:\mathcal P_v(d,a)=1\}.
\end{aligned}
$$

*(Eq. 24.31)*

[DERIVED] Link consistency catches dangling identifiers; compatibility catches mixed embedding spaces; authorization catches cross-boundary evidence exposure. These predicates do not measure semantic retrieval quality. That requires held-out questions whose supporting records and intended temporal versions are known. Provenance additionally records source identity, acquisition time, valid-time interval, transformations, and descendants. Publication time and the time at which a fact was true need not coincide.

```figure
id: fig-24.18
kind: diagram
title: Persistent state and update boundaries
caption: >-
  A document update follows the external path. Its acceptance boundary includes
  index compatibility and reachable descendants; unchanged weights do not imply
  either fresh answers or removal of parametric knowledge.
placement: inline
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-24.30
alt: >-
  A change request branches into parameter modification or versioned document
  modification. Both meet service evaluation. The document branch also validates
  the index, permissions, cache, and retained summaries before publication.
spec:
  direction: TB
  nodes:
    - { id: request, kind: objective, label: Change contract }
    - { id: parameter, kind: model, label: Parameter version }
    - { id: document, kind: dataset, label: Evidence version }
    - { id: index, kind: dependency, label: Compatible index }
    - { id: policy, kind: boundary, label: Access and descendants }
    - { id: evaluate, kind: metric, label: End-to-end acceptance }
    - { id: release, kind: state, label: Published service manifest }
  edges:
    - { from: request, to: parameter, kind: flow }
    - { from: request, to: document, kind: flow }
    - { from: document, to: index, kind: flow }
    - { from: index, to: policy, kind: flow }
    - { from: parameter, to: evaluate, kind: flow }
    - { from: policy, to: evaluate, kind: flow }
    - { from: evaluate, to: release, kind: emphasis }
```

[DERIVED] Deletion of an external record means making that record and specified descendants unreachable through the declared interfaces. Removing an index pointer while leaving a directly accessible source, cached answer, or application summary does not satisfy that contract. Conversely, successful store deletion says nothing about information learned into $\theta$ during earlier training. If external evidence subsequently becomes training data, the intervention must cross both boundaries.

[MATHEMATICALLY-DERIVED] Under a deliberately simple additive accounting model, common base inference cancels when comparing alternatives:

$$
\begin{aligned}
C_{\mathrm{param}}&=Uc_{\mathrm{train}}+Qc_{\mathrm{base}},\\
C_{\mathrm{external}}&=Uc_{\mathrm{index}}+Q(c_{\mathrm{base}}+c_{\mathrm{ext}}),\\
C_{\mathrm{external}}<C_{\mathrm{param}}
&\iff Qc_{\mathrm{ext}}<U(c_{\mathrm{train}}-c_{\mathrm{index}}).
\end{aligned}
$$

*(Eq. 24.32)*

[MATHEMATICALLY-DERIVED] If $c_{\mathrm{ext}}>0$ and training updates cost more than index updates, the crossover query count is $Q^*=U(c_{\mathrm{train}}-c_{\mathrm{index}})/c_{\mathrm{ext}}$. More frequent updates favor external storage in this model; more queries amortize parameter training. This is a cost identity, not a quality-equivalence result. Different accuracy, latency, availability, or authorization behavior invalidates an unconstrained cost-only choice.

## Algorithm

[DERIVED] **Algorithm 24.6 — Publish a bounded external-state update.** Inputs are current manifest $\mathcal S_v$, a shared atomic publication pointer $h$, authorized change set $\Delta$, a descendant map $\Gamma$, a finite validation suite $\mathcal V$, and acceptance predicate $G$. Local state is the immutable candidate manifest $\widetilde{\mathcal S}$ and the observed pointer value $v_{\mathrm{seen}}$. Output is a new accepted manifest or the prior version with a recorded failure. $\operatorname{CAS}$ denotes a compare-and-swap publication primitive; whether a storage system supplies it is an implementation obligation, not a claimed guarantee of a particular implementation.

$$
\begin{aligned}
1.\;&v_{\mathrm{seen}}\leftarrow\operatorname{Load}(h),\quad
\big(v_{\mathrm{seen}}\ne\operatorname{id}(\mathcal S_v)\big)
\lor\neg\mathsf{Authorized}(\Delta,\mathcal P_v)
\Rightarrow\operatorname{halt}(\mathcal S_v,\mathsf{denied});\\
2.\;&\widetilde{\mathcal D}\leftarrow
\mathsf{Apply}(\mathcal D_v,\Delta),\quad
\widetilde{\mathcal I}\leftarrow
\mathsf{Build}(\widetilde{\mathcal D},\psi_v);\\
3.\;&(\widetilde{\mathcal C},\widetilde{\mathcal H})\leftarrow
\mathsf{InvalidateOrRecompute}(\mathcal C_v,\mathcal H_v,\Gamma(\Delta));\\
4.\;&\widetilde{\mathcal S}\leftarrow
(\theta_v,\psi_v,\widetilde{\mathcal D},\widetilde{\mathcal I},
\widetilde{\mathcal C},\widetilde{\mathcal H},\mathcal P_v);\\
5.\;&z\leftarrow\mathsf{Evaluate}(\widetilde{\mathcal S},\mathcal V),\quad
\neg G(z,\mathsf{Link},\mathsf{Compat},\mathsf{Allowed})
\Rightarrow\operatorname{halt}(\mathcal S_v,\mathsf{rejected});\\
6.\;&\neg\operatorname{CAS}(h,v_{\mathrm{seen}},\operatorname{id}(\widetilde{\mathcal S}))
\Rightarrow\operatorname{halt}(\mathcal S_v,\mathsf{conflict});\\
7.\;&\operatorname{return}(\widetilde{\mathcal S},z,\operatorname{digest}(\Delta)).
\end{aligned}
$$

*(Eq. 24.33)*

[DERIVED] Execute lines once in order. The finite validation budget determines termination; failed or concurrent candidates are not silently retried against another version. Readers pin a manifest for each request, preventing mixed old documents and new index identifiers. An inability to enumerate relevant descendants is an unresolved deletion boundary. The unchanged-weights invariant is $\widetilde\theta=\theta_v$; evidence correctness remains a separate empirical gate.

## Implementation

```figure
id: fig-24.19
kind: calculator
title: Lifetime update cost crossover
caption: >-
  Eq. 24.32 uses illustrative common cost units with equal base inference.
  Compare incremental costs at Q queries and the crossover count; this identity
  assumes comparable quality and does not predict a deployment's measured cost.
  A nonpositive crossover means external updating cannot be cheaper for positive Q.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.32
alt: >-
  Ten updates costing 100 units each parametrically or one unit each for
  indexing, with external overhead 0.01 unit per query, cross at 99000 queries.
  At 10000 queries the incremental costs are 1000 and 110 units respectively.
states:
  - { anchor: formulation, label: Frequent updates, variables: { Q: 10000 }, note: Update cost dominates this illustrative horizon. }
  - { anchor: mechanism, label: Many queries, variables: { Q: 200000 }, note: Added external inference work can dominate at large query counts. }
spec:
  tex: Q^*=U(c_{\mathrm{train}}-c_{\mathrm{index}})/c_{\mathrm{ext}}
  equation: "24.32"
  inputs:
    - { symbol: U, label: updates in horizon, default: 10, min: 1, max: 100, step: 1, format: integer }
    - { symbol: train, label: parameter update cost, default: 100, min: 1, max: 1000, step: 1 }
    - { symbol: index, label: index update cost, default: 1, min: 0, max: 100, step: 1 }
    - { symbol: extra, label: added external cost per query, default: 0.01, min: 0.001, max: 0.1, step: 0.001 }
    - { symbol: Q, label: queries in horizon, default: 10000, min: 0, max: 1000000, step: 1000, format: integer }
  outputs:
    - { symbol: parameter, label: parameter incremental cost, formula: U*train }
    - { symbol: external, label: external incremental cost, formula: U*index+Q*extra }
    - { symbol: crossover, label: crossover queries, formula: U*(train-index)/extra, format: integer, emphasis: true }
```

[DERIVED] No reference-stack retrieval system is assigned to this abstract publication algorithm: its storage, indexing, and transaction semantics require a concrete deployment choice in Chapter 49. A learned document encoder has versioned tensors and an index with dimension and similarity conventions; generator input construction adds retrieved tokens and provenance. The retriever, storage service, and generator need not share a device or trust boundary.

[MATHEMATICALLY-DERIVED] For $n$ vectors of dimension $d$ using $b$ bytes per component, uncompressed embedding storage is $ndb$ bytes, before graph/inverted-file overhead, metadata, source text, and replicas. Adding $T_e$ evidence tokens changes generator prefill and attention costs; Eq. 24.32 treats those increments through $c_{\mathrm{ext}}$, rather than assuming retrieval has zero inference cost. Index construction and network transfer must also be charged. Architecture-specific token costs remain owned by Parts III and V.

[DERIVED] Record p50/p95/p99 latency, retrieval failures, authorized-evidence coverage, stale-version responses, and rollback behavior under the target concurrency. A mean added cost cannot bound tail latency. Permission changes must invalidate cache keys and historical evidence according to the contract; binding a cache only to the query text is insufficient. Atomic publication prevents mixed manifests but does not ensure that every previously running request immediately adopts a new version.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The original RAG hot-swap test compares December 2016 and December 2018 Wikipedia indexes on 82 templated leader questions; matched-time answers outperform mismatched-index answers, without perfect accuracy. This limited temporal test does not establish arbitrary record-level deletion or cite-faithful generation. [R24.21], §4.5. Its retrieval ablations and QA/generation tasks are separate evidence about retrieval usefulness, not guarantees for a future deployment.

[PAPER-REPORTED] MeLLo stores edits as sentences and retrieves them during an iterative language-model decomposition of multi-hop questions. It checks proposed intermediate answers against retrieved edits before continuing. MQuAKE evaluates this external-memory alternative alongside parameter editors; its multi-hop metric counts an item as correct when any of its three paraphrased questions is answered correctly. [R24.14], §§4,5.1–5.2, Appendix H. That item-level statistic must not be presented as per-query accuracy.

[DERIVED] A matched comparison freezes the initial generator, update stream, temporal questions, and evaluator. Measure acquisition/retention matrices, evidence coverage, source faithfulness, stale-answer rate, authorization failures, latency distribution, and total horizon cost. Separate an external-store failure from a generator that ignores correctly retrieved evidence. The concrete benign version-switch proposal appears in [verification.md](verification.md).

## Observations

**What the paper claims.** [PAPER-REPORTED] RAG demonstrates knowledge updates through index replacement in its temporal test; MeLLo reports stronger multi-hop editing performance than its compared parameter-editing baselines within MQuAKE. [R24.21], §4.5; [R24.14], §5.2.

**What the evidence shows.** [DERIVED] An external update can change answers without changing generator tensors. Its successful scope depends on retrieval, evidence use, prompt protocol, and the tested query family.

**What we infer.** [MATHEMATICALLY-DERIVED] The appropriate update boundary follows from the required persistence and observable contract. Store mutation, parameter mutation, and output filtering establish different invariants.

**What remains unknown.** [UNVERIFIED] No measured cost crossover, deletion-complete descendant inventory, or present-frontier model comparison has been established for this chapter's proposed system.

## Failure modes

> **Failure mode — Fresh store, stale answer.** [DERIVED] *Symptom:* the new record is retrievable but the service emits an old value. *Cause:* stale cache/history, incorrect retrieval, or generator reliance on a parametric association. *Detection:* log pinned versions and retrieved source identities, then compare uncached evidence-conditioned generations. *Mitigation:* repair the failing boundary and rerun the end-to-end temporal test.

[MATHEMATICALLY-DERIVED] Cross-tenant retrieval, embedding-version mismatch, partial publication, missing descendants, and source contradiction are distinct failure classes. A successful tensor checksum cannot detect them. A conformally calibrated response filter changes output selection without changing parameters; its marginal verifier guarantee does not certify external-store deletion either. [R24.20], §3.2.

## Siblings

```figure
id: fig-24.20
kind: stat-panel
title: External publication invariants
caption: >-
  Atomic publication applies to a complete candidate manifest. It does not
  invent a descendant inventory, guarantee semantic evidence use, or alter
  information already stored in generator parameters.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: [DERIVED:eq-24.31, DERIVED:eq-24.33]
alt: >-
  Publication validates document-index links, encoder compatibility, caller
  authorization, cache and history descendants, and the observed shared pointer.
  Unchanged generator tensors are a separate invariant.
spec:
  header: VERSIONED SERVICE BOUNDARY
  rows:
    - { key: links, value: index IDs resolve to documents }
    - { key: compatibility, value: index and encoder agree }
    - { key: access, value: caller permissions enforced }
    - { key: descendants, value: caches and summaries invalidated }
    - { key: publication, value: compare observed shared pointer }
    - { key: weights, value: unchanged generator version }
```

[DERIVED] [Continual mechanisms](24-3-mechanism-families.md) internalize or isolate learned behavior; [editing](24-4-model-editing.md) imposes targeted changes with locality tests; [unlearning](24-5-unlearning.md) compares an intervention with an absent-data training process. External evidence changes the conditioning state. None of these definitions can substitute for another's acceptance criterion.

## Extensions

### Improvements

[DERIVED] A hybrid can retrieve current records, accumulate an authorized training corpus, and periodically distill stable reusable behavior into an adapter. At that point provenance must connect store versions to training descendants, and deletion can require both store mutation and parameter intervention. MeLLo documents a different branch: repeated evidence reconciliation supports multi-hop consistency without weight editing. Its prompt and retrieval dependencies remain part of the method. [R24.14], §5.1.

## Limitations

[MATHEMATICALLY-DERIVED] A versioned store provides inspectable record identity, not automatic truth. Eq. 24.32 assumes additive comparable costs and equal base inference; batching, shared infrastructure, changed answer length, and unequal quality can violate it. A hidden pretraining corpus prevents a complete claim about all parametric copies of a removed record. State these limits before choosing an intervention by cost or convenience.

## Reproducibility

[DERIVED] Preserve full manifests, document/index/encoder hashes, valid-time metadata, authorization policies, descendant maps, cache-version rules, raw questions and outputs, retrieved identifiers, transaction conflicts, latency distributions, and cost boundaries. Forward ownership: [retrieval and indexing, Chapter 49](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/README.md), [context construction, Chapter 50](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch50-context-construction-and-retrieval-augmented-generation/README.md), and [agent state, Chapter 53](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch53-agent-memory-persistent-state-and-long-horizon-consistency/README.md). No service update experiment was executed for this edition.

## References

[R24.14](references.md#r2414), [R24.20](references.md#r2420), [R24.21](references.md#r2421).
