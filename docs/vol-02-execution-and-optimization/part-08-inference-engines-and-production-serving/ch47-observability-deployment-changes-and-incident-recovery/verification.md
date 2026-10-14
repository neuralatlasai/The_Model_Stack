---
id: "ms.verification.47"
entity_type: "verification"
title: "Chapter 47 — Verification"
volume: 2
part: 8
chapter: 47
section: null
slug: "verification"
parent: "ms.chapter.47"
prev_sibling: "ms.section.47.6"
next_sibling: "ms.references.47"
children: []
prerequisites: ["ms.chapter.30","ms.chapter.43","ms.chapter.44","ms.chapter.45","ms.chapter.46"]
downstream: ["ms.chapter.48","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["observability","deployment","recovery"],"feedback_setting":[],"modality":["text"]}
papers: []
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 1500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# Chapter 47 verification

## Artifact specification

[DERIVED] The artifact is an **instrumented deployment and rollback runbook**. Its records are append-only or versioned; raw sensitive inputs are retained only within the authorized boundary. This specification is a proposed engineering synthesis, not an executed implementation.

| Record | Required fields | Correctness invariant |
|---|---|---|
| release_manifest | Tuple Eq. 47.9; content/build digests; hardware/topology; compatibility predicates; signatures | Mutable tags never determine executable identity |
| assignment | Eligible unit, release, stage/epoch, assignment probability, endpoint family/alpha allocation | Assignment precedes outcome; stage statistics do not silently reuse alpha |
| request_events | Logical/attempt IDs, semantic event ID, sequence, host/boot/clock domain, prompt/cached/generated/visible tokens, release, terminal reason | Duplicates do not inflate semantic counters; incomplete/censored remain visible |
| collection_loss | Sampling probability, record/event/byte cap, ingress/drop counts, dedup horizon | Estimates retain inclusion mechanism; retention is bounded |
| quality_ledger | Prediction time, exact observation age, label arrival/revision/provenance, abstention, cohort, proxy schema/model revision | Missing label is unknown, not success; later corrections are separate |
| ownership_state | Durable controller lease, epoch CAS, per-request drain leases, cache namespace, integrity classification, pending writes | Stale owner cannot commit or publish |
| recovery_decision | Eligible actions, remaining deadline, memory compatibility, action outcome, replay cap, visible prefix, committed effects | No unsafe reuse or blind duplicated external action |
| incident_evidence | Source/timestamp intervals, inclusion rule, hypothesis/falsifier, all mitigations, replay boundary, negative checks | Mitigation, observation and causal conclusion remain distinct |

## Verification task

[ASSUMED] The central task injects a template or cache-key regression into an isolated candidate and demonstrates detection, localization and fenced restoration. The following three experiments are **not executed**. Every protocol requires pinned artifacts, authorized synthetic/redacted inputs, isolated side effects and equal declared comparison boundaries.

### Experiment 47.1 ? Observation and delayed-label validity

**Hypothesis.** [ASSUMED] Do sampling, duplicates, retention caps and label delays preserve the declared population estimates and unknown states?

**Setup.** [ASSUMED] Construct a finite synthetic event ledger with known request/attempt identities, token publication, errors, cancellations, and clock domains.

**Independent variables.** [ASSUMED] Independently generate observation delays with a declared missing-at-random model, then a deliberately outcome-dependent model. Vary record/event/byte caps, duplicated ingress and cross-host offsets without changing ground-truth outcomes.

**Controlled variables.** [ASSUMED] Freeze cohort membership and label age exactly at $d$; report later revisions separately.

**Dataset/workload.** [ASSUMED] Use the finite synthetic event ledger specified in Setup, retaining its complete known request, token, error and cancellation outcomes.

**Hardware.** [UNVERIFIED] Hardware is not yet selected for this proposal. Record the collection host, memory, storage and clock domains before execution, including any device synchronization.

**Metrics.** [ASSUMED] Unconditional semantic counters, estimated totals, trace loss, inclusion probabilities, label coverage, IPW estimate, mature-cohort estimate, abstention coverage and loss bounds. Report repeated-seed uncertainty for the simulated collection/label mechanism, rather than treating one stochastic sample as proof. Record collection bytes, CPU time, host memory, ingestion/storage cost and any device synchronization.

**Baselines.** [ASSUMED] Retain the unsampled ground-truth ledger; compare uniform sampling, known unequal-probability sampling and an unknown capacity-drop mechanism.

**Expected result.** [ASSUMED] Eq. 47.2 should recover totals in expectation under its sampling premises; naive unweighted selected traces should fail. Eq. 47.5 should fail under deliberately unrecorded outcome-dependent observation. Exact marginal proxy alignment must coexist with joint TV one in Eq. 47.7. No empty/one-token request may trigger division by zero, and bounded collectors must account for every deliberate drop.

**Ablation.** [ASSUMED] Separate the sampling, duplicate-ingress, retention-cap and label-delay conditions listed in Independent variables while retaining the same ground-truth ledger.

**Interpretation.** [ASSUMED] This experiment's synthetic arithmetic is not an engine-overhead benchmark.

**Threats to validity.** [ASSUMED] A source-side loss outside the collector must remain explicitly unmeasured. Estimator conclusions require their declared sampling and label-observation premises.

### Experiment 47.2 ? Template/cache regression, localization and rollback

**Hypothesis.** [ASSUMED] Can the evidence identify the earliest divergent boundary and restore the prior behavior?

**Setup.** [ASSUMED] Use a pinned small model, immutable control/candidate tuples, deterministic diagnostic configuration where supported, and synthetic conversations with known token sequences. Run bounded isolated shadows; use stable assignment units in a finite canary. Record sequential gates with stage-specific alpha allocation. Trigger containment, retain selected healthy drain leases, fence affected owners, revoke drain leases at cutoff, commit the new epoch, restore control and reject late old-owner outputs.

**Independent variables.** [ASSUMED] Introduce exactly one template change or deliberately omitted semantic cache-key component.

**Controlled variables.** [ASSUMED] Preserve raw/rendered inputs and token IDs. Keep a fixed pre-treatment cohort and distinguish unconstrained generation from forced-token numerical diagnostics. Compare equal offered traffic/hardware and report diagnostic-mode overhead separately from production-mode performance.

**Dataset/workload.** [ASSUMED] Use the synthetic conversations with known token sequences specified in Setup, preserving the fixed pre-treatment cohort.

**Hardware.** [UNVERIFIED] The specific model host is not yet selected. Pin hardware with the model/runtime tuple before execution; the comparison requires the equal-hardware boundary stated in Controlled variables.

**Metrics.** [ASSUMED] Detection delay with client/server boundaries; localization ledger; token/render/cache differences; observed errors and unknowns; restoration readiness versus request replay; duplicate/stale output attempts; committed external effects; quality/coverage and SLO outcomes by release. Do not drop failed or partial streams from the denominator. Include duplicated model/KV/runtime memory, shadow work, warm-up, retained evidence and control reserve.

**Baselines.** [ASSUMED] Compare cold isolated namespaces, warm compatible namespaces, and the deliberately defective key.

**Expected result.** [ASSUMED] Template changes must appear before prefill in token IDs. Cache defects must depend on the incompatible retained state and disappear under correctly keyed isolation. Rollback must restore the declared contract while rejecting stale publication. No fixed speedup threshold is assumed.

**Ablation.** [ASSUMED] Evaluate the single template-change condition separately from the single omitted-cache-key condition, using the fixed raw inputs and namespaces.

**Interpretation.** [ASSUMED] Successful rollback alone does not prove one component caused a spontaneous live incident.

**Threats to validity.** [ASSUMED] Any judge remains secondary to exact token/key/state assertions and independently specified task checks. Deterministic diagnostics are conditional on backend support and are reported separately from production-mode performance.

### Experiment 47.3 ? Recovery eligibility, deadlines and counterfactual limits

**Hypothesis.** [ASSUMED] Does the runbook choose only eligible recovery paths and terminate under repeated failures?

**Setup.** [ASSUMED] Inject process termination separately from device invalidation; never simulate safe integrity merely by hiding an error flag.

**Independent variables.** [ASSUMED] Include an empty feasible-action set, corrupted/incompatible snapshot, second failure during replenishment, cancellation, and an external action with ambiguous commit status.

**Controlled variables.** [ASSUMED] Pin model precision/shards, engine, driver, topology, storage, memory utilization and initial KV occupancy. Use the same complete detection-to-useful boundary as well as separately reported ready boundaries.

**Dataset/workload.** [ASSUMED] Use the finite affected-request and failure scenarios specified by the independent variables, with the same declared workload and measurement boundary across eligible recovery arms.

**Hardware.** [UNVERIFIED] The specific device/host configuration is not yet selected. Record it with the precision/sharding, driver, topology and storage configuration before execution.

**Metrics.** [ASSUMED] Readiness, useful-capacity refill, per-request replay/partial failures, lost GPU-seconds, extra work/communication, shadow memory, healthy throughput, tail latency, energy and provisioning cost. Record concurrent recovery-controller races and action timeouts with their cleanup.

**Baselines.** [ASSUMED] Compare warm rebuild, compatible snapshot, trusted resident weights and a private-runtime shadow only where the implementation supports them.

**Expected result.** [ASSUMED] Only one controller may commit ownership; stale workers may not publish. Every action consumes remaining deadline and invalidates partial state before fallback. Cancelled requests remain terminal. Unsafe external-effect replay must return partial failure.

**Ablation.** [ASSUMED] Keep process-termination and device-invalidation conditions separate; inspect each supported recovery mechanism under the same eligibility and deadline policy.

**Interpretation.** [ASSUMED] Faster readiness can coexist with lower healthy KV capacity; report both rather than assuming positive net benefit. Recompute Eq. 47.20 with explicit eligible events and uncertainty intervals, then compare with an actually replayed queue only if authorized and reconstructable. A duration-replacement estimate must not be labeled live production savings.

**Threats to validity.** [ASSUMED] Detection, reserved capacity, replenishment and correlated failures remain separate assumptions. The replay comparison is conditional on authorization and reconstructability.

## Acceptance criteria

[ASSUMED] Correctness acceptance is categorical: zero accepted stale-epoch publications, zero incompatible cache reuse, zero unaccounted intentional retention drops, zero blind external-effect replays, and all terminal cancellation/failure branches exercised. Collector peak retained records/events/bytes must remain within declared caps. Every diagnostic/recovery action must respect its reserved budget and enforced timeout. Statistical acceptance uses the predeclared stage endpoint tolerances and alpha allocations; an inconclusive stage does not pass.

[ASSUMED] Restoration acceptance requires the prior immutable contract on the authorized cohort, separately reporting deterministic diagnostic equality and task/transport outcomes. Performance acceptance has no invented speedup target: report readiness, useful refill, healthy-capacity cost and uncertainty under equal boundaries. A faster ready event with worse useful goodput falsifies the claim that this configuration improves service.

## What this edition did not do

[UNVERIFIED] This edition did not execute the three experiments, deploy a service, inject a real incident, reproduce private traces, or measure quality/latency/energy. All acceptance criteria above are proposed gates, not achieved outcomes.

## Topic-completeness audit

[DERIVED] The matrix maps every planned topic to manuscript evidence. “Proposal” identifies an unexecuted verification step; it is never a substitute for main-text mechanism coverage.

| Required topic | Mechanism / formulation / algorithm | Implementation / cost | Evidence / negative condition | Verification |
|---|---|---|---|---|
| Request traces | 47.1 partial order, event identity, Eq. 47.4 | Bounded events/bytes and cardinality | R47.1/R47.9; missing events explicit | Proposal 47.1 |
| Queue and phase timing | 47.1 event boundaries, Eq. 47.1 | Clock compatibility and preemption | R47.1; cross-host subtraction invalid | Proposal 47.1 |
| Token counts | 47.1 generated/visible/cached/attempt distinction | Semantic dedup and event bundles | R47.1; ITL differs from TPOT | Proposal 47.1 |
| Hardware/errors by version | 47.1 device join and immutable identities | Shared-device attribution boundary | No exclusive attribution assumed | Proposal 47.1 |
| Task outcomes/corrections | 47.2 provenance ledger, Eq. 47.8 | Label revisions and adjudication | R47.3; selected feedback not truth | Proposal 47.1 |
| Drift | 47.2 JSD/proxy tree, Eq. 47.7 | Pair-table/tree costs | R47.3; marginals miss joint shift | Proposal 47.1 |
| Safety and abstention | 47.2 Eq. 47.6 and zero-count bound | Detector calibration/coverage | Incomplete detection and selection | Proposal 47.1 |
| Delayed ground truth | 47.2 Eq. 47.5 | Exact age d and later revisions | MAR/positivity may fail | Proposal 47.1 |
| Immutable artifacts | 47.3 Eq. 47.9 | Content/build/topology tuple | Mutable tags insufficient | Proposal 47.2 |
| Shadow traffic | 47.3 isolated sinks/namespaces | Duplicated work and retention | Side effects / shared resource contamination | Proposal 47.2 |
| Canaries/staging | 47.3 Eqs. 47.10–12 | Stable units/stage alpha | R47.4; stationarity/interference limits | Proposal 47.2 |
| Compatibility | 47.3 artifact/API/cache predicates | Runtime/hardware dependencies | Executable does not imply behavioral match | Proposal 47.2 |
| Data/model changes | 47.4 Eq. 47.13 and boundary checks | Cohort support and hashes | Mixture decomposition not causal | Proposal 47.2 |
| Quantization/templates | 47.4 token and numerical boundaries | Scale/layout/token comparison | R47.11; output length post-treatment | Proposal 47.2 |
| Kernel/compiler | 47.4 Eq. 47.14 diagnostic recall | Deterministic-mode overhead | R47.10; seed alone insufficient | Proposal 47.2 |
| Cache/serving policy | 47.4 hypothesis signatures, Eq. 47.15 | Key/epoch/shape/queue checks | Cache-off changes more than cache | Proposal 47.2 |
| Drain/rollback | 47.5 Eq. 47.19 | Leases, epoch CAS, publication fences | Healthy drain and affected fences separate | Proposal 47.2 |
| Invalidation/migration | 47.5 semantic compatibility and transaction | Quiescence/transfer/format costs | Invalid integrity disallows reuse | Proposal 47.3 |
| Replay | 47.5 bounded attempts/visible prefix | Repeated prefill/side-effect ledger | R47.6; shadow loses KV progress | Proposal 47.3 |
| Degraded operation | 47.5 explicit terminal contract | Capabilities/quality/resource monitoring | Empty action set is not healthy | Proposal 47.3 |
| Incident timeline | 47.6 source intervals/partial order | Provenance retention | R47.7 severity and missingness selection | Proposal 47.3 |
| Counterfactual replay | 47.6 Eqs. 47.20–21 | Capacity/queue/energy boundary | R47.6 79% estimate not live gain | Proposal 47.3 |
| Root-cause evidence | 47.6 hypotheses/falsifiers, Eq. 47.22 | Bounded diagnostics | Annotation agreement not causal proof | Proposal 47.2 |
| Remediation/test updates | 47.6 invariant-driven tests | Secure evidence and replay cost | Exact-prompt overfit / changed detector | All proposals |

## Review gates and evidence gaps

[UNVERIFIED] Status remains **manuscript_draft**. No proposed experiment has run. Before review, pin every executable revision, validate event/label/ownership schemas, execute correctness and failure branches, report source-versus-book evidence separately, and complete independent scientific review. Private traces and incident logs remain unavailable; current docs/source are mutable.

[NOT-DISCLOSED] ProxyDrift has unresolved model-family revision and denominator ambiguities. Dynamo's controlled study is single-node and restores ready capacity rather than request KV progress. Historical Spectroscope cases are not LLM localization trials. Canary guidance does not supply an inference-specific power calculation. These limitations remain in the main text rather than being silently repaired.

[DERIVED] Self-check expectations are exactly nine manifest files, six sections with the prescribed 15 H2 headings, 20 uniquely numbered valid figure blocks, resolved local source keys, canonical references/verification slugs and draft evidence metadata. Compiler validation is performed separately in memory by the parent workflow; no generated app assets belong in this folder.


## Locator and review-consequence supplement

[DERIVED] The following locators bind the audit's evidence column to inspected primary text. Mechanism/objective/cost/failure obligations apply to every row; no model-training objective or optimizer update is applicable to this operational chapter because its procedures govern observation and state transitions.

| Topics | Exact source locator | Unresolved gap | Review consequence |
|---|---|---|---|
| Request traces / phase times / token counts | R47.1 V1 design and metrics; R47.9 RequestStateStats/FinishedRequestStats | Mutable semantics; no runtime check | Pin and reconcile client/server events |
| Hardware / errors by version | R47.1 metric definitions; R47.6 §5.1 | Shared-resource attribution | No exclusive request cost claim |
| Outcomes / corrections / drift | R47.3 §§3–5, Tables 1/3 | Model-family wildcards, denominator contradictions | Independent labels and clarification |
| Safety / abstention / delayed truth | 47.2 Eqs. 47.5–8, original derivation | Observation model may fail | No unqualified population-quality estimate |
| Immutable artifacts / compatibility | R47.11 Reproducibility; R47.10 Implementation Details | No complete deployed tuple | Execute compatibility predicates |
| Shadows / canaries / staging | R47.4 worked example and representative metrics; 47.3 Eqs. 47.10–12 | Interference/stationarity and power | Stage-specific inference, isolated effects |
| Data/model / quantization / template | R47.5 §§3–5; R47.11 seed/platform scope | No inference localization trial | Run matched boundary checks |
| Kernel/compiler / cache/policy | R47.10 implementation; 47.4 hypotheses | Diagnostic mode changes execution | Separate diagnostic and live estimands |
| Drain / rollback / invalidation / migration | R47.6 §§2.2–3.4; 47.5 Eq. 47.19 synthesis | No executed ownership transaction | Concurrency/fencing tests required |
| Replay / degraded operation | R47.6 §3.4 and §6; 47.5 terminal branches | Request KV and effects not preserved | Partial-failure contract required |
| Timeline / causal evidence | R47.7 §3, §6 Case B, §8 | Confidential raw records and severity selection | Descriptive claims only |
| Counterfactual replay | R47.6 §5.6 / Appendix B; R47.8 Introduction/Integration | Eligibility, detection and queue interactions | No live-gain/quality claim |
| Remediation / test updates | R47.7 limitations; 47.6 Eq. 47.22 synthesis | Prevention effect unmeasured | Prospective invariant checks |
