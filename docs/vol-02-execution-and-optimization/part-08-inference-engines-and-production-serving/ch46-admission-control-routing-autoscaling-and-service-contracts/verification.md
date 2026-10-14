---
id: ms.verification.46
entity_type: verification
title: Chapter 46 verification and topic audit
volume: 2
part: 8
chapter: 46
section: null
slug: verification
parent: ms.chapter.46
prev_sibling: ms.section.46.6
next_sibling: ms.references.46
children: []
prerequisites: [ms.chapter.6, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45]
downstream: [ms.chapter.47, ms.chapter.48, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [serving_control_plane], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.tensorrt-llm]
benchmarks: []
datasets: []
status: {maturity: open, disputed: false}
evidence_summary: {labels_used: [ASSUMED, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2600
updated_at: 2026-10-14
editorial_status: manuscript_draft
---



# Chapter 46 — Verification and topic-completeness audit

## Artifact specification

[KNOWN] The planned artifact is **an SLO-driven serving control-plane design**. The following are proposed records, not evidence of an executed deployment.

| Proposed record | Required fields |
|---|---|
| contract.yaml | Tenant/route/version; eligible population; TTFT/delivery/completion boundaries; availability denominator; independent quality threshold; quota/token/deadline/cancellation policy |
| identity.jsonl | Logical request; immutable request hash; attempt; owner epoch/fencing token; event sequence; engine/model/template revision; authorization/data scope |
| admission.jsonl | Offered/admitted/rejected/expired timestamps; request/byte/work reservations; token-bucket balances; fairness class; reconciliation and rollback |
| routing.jsonl | Hard eligibility set/reasons; policy epoch; model/provider/replica action; estimator/budget version; cache/load observations and age; fallback authorization |
| capacity.jsonl | Desired/ready/pending/failed/draining instances; profile identity; predicted readiness; observed readiness; model-loading and drain times; state readers; release reason |
| attempts.jsonl | Persisted count; original and per-try deadlines; retry reason/work allowance; backoff; cancellation receipt/quiescence; duplicate active work; fenced commit outcome |
| streams.jsonl | Client/server clock boundary; event IDs and sizes; generated/published tokens; bytes produced/drained/retained; terminal marker/error; disconnect/resume cursor |
| outcomes.jsonl | Complete valid answer, rejection, expiry, cancellation, partial failure or ambiguity; quality evaluator; usage certainty; physical work and billed work |
| measurements.csv | Offered/admitted/completed goodput; stratified timing distributions; queue/work/byte peaks; retry amplification; readiness lag; resource and retained-state cost |
| decisions.md | Accepted/rejected hypotheses; uncertainty; source-versus-local results; unsupported configurations; rollout/drain prerequisites and unresolved boundaries |

[DERIVED] Every row must join by logical request and, where applicable, attempt and ownership epoch. Record clocks with domains/synchronization uncertainty. A single successful final result does not erase failed attempts, a published partial stream or work remaining after cancellation.

## Verification task

### Experiment 46.1 — Burst admission, bounded queues and recovery

**Hypothesis.** [ASSUMED] With finite queue/work budgets and finite retries, the declared service rejects or expires excess load explicitly and recovers after the offered workload returns below its measured sustainable region.

**Setup.** [ASSUMED] Pin one supported engine/model/runtime tuple and an admission controller. Establish a correctness/quality baseline before load replay. Declare each queue, buffer and handle count, token caps, reservation model, retry layer and finite fleet limit.

**Independent variables.** [ASSUMED] Arrival bursts, prompt/output-length strata, tenant mixture, queue/work caps and output-size prediction error. Controlled ablations change one quota or retry mechanism while keeping the replay fixed.

**Controlled variables.** [ASSUMED] Model/precision, template, decoding, hardware/topology, client boundary, fairness policy, deadlines, capacity and quality acceptance. Do not silently change the model to improve overload recovery.

**Dataset/workload.** [ASSUMED] A finite timestamped open-loop workload includes short and long requests, identical arrival replay across configurations and a recovery interval. Preserve offered requests even when the server rejects them; closed-loop clients alone would censor demand.

**Hardware.** [ASSUMED] A common supported accelerator and CPU/network configuration, recorded before execution. Hardware is unresolved in this edition.

**Metrics.** [ASSUMED] Every queue's request/byte/work maximum, reservation overshoot, admitted/rejected/expired counts, client TTFT/completion distributions, quality-qualified goodput, physical attempts and time to recovery. Separate tenant strata and report work offered but not served.

**Baselines.** [ASSUMED] Finite request-count gating, finite predicted-work gating, and the same controller with retries disabled. An intentionally unbounded queue is unnecessary; analytical counterexamples already explain that failure.

**Expected result.** [ASSUMED] Finite caps should produce classified overload outcomes and reconciled reservations; a quality-qualified goodput advantage over either finite baseline remains an empirical question.

**Ablation.** [ASSUMED] Toggle distributed-handle queue multiplication, cost reconciliation, heavy-output underprediction and outer deadline propagation. Keep total available resources fixed.

**Interpretation.** [ASSUMED] Attribute a cap failure to the enforcing boundary before comparing goodput. A passing finite replay supports the tested workload/configuration only.

**Threats to validity.** [ASSUMED] Arrival-trace misspecification, omitted hidden buffers, output-length shift, clock error and correlated requests can conceal overload or bias tail estimates.

**Acceptance criteria.** [ASSUMED] Zero recorded queue/byte/work-cap violations at the declared exact enforcement boundary; all overflow has a named outcome; each logical request has at most its persisted K attempts; finite reservations reconcile after terminal completion/quiescence. Recovery deadline and SLO thresholds must be selected before replay.

**Result that rejects the hypothesis.** [ASSUMED] Any unbounded hidden queue, unresolved reservation leak, infinite retry chain, or continuing growth after offered load returns inside the validated capacity region rejects the control-plane claim.

**Reproducibility.** [ASSUMED] Preserve the complete offered trace, policy/configuration, random draw records where relevant, retry topology, clocks and all rejected observations. Repeat over independently generated workload traces; time-correlated samples are not i.i.d. request replicates.

### Experiment 46.2 — Eligibility-preserving model, provider and replica selection

**Hypothesis.** [ASSUMED] Hard eligibility remains invariant under cache/load optimization, estimator drift, fallback and ownership change; learned selection meets preregistered independent quality/cost criteria.

**Setup.** [ASSUMED] Build immutable model/provider/replica capability and data-policy records. Separate estimator training, threshold selection and final acceptance populations. Pin actual tokenizer/template/budget instructions, provider revisions and prices as dated inputs.

**Independent variables.** [ASSUMED] Cache locality, stale load, model/budget actions, provider failure and prohibited data boundaries. Include a deliberately high soft score on an ineligible endpoint.

**Controlled variables.** [ASSUMED] Query IDs, authorization policy, evaluation labels, service boundary and per-request hard caps. Same seed/template is insufficient for bit-identical cross-engine generation; declare distributional/task tolerance and teacher-forced diagnostics separately.

**Dataset/workload.** [ASSUMED] Finite domain strata with both repeated prefixes and new tasks, including unseen query classes and sensitive/region-restricted requests. Training-set benchmark overlap is audited before acceptance.

**Hardware.** [ASSUMED] Record router CPU/GPU and destination hardware separately; include routing latency and network transfer in the client boundary.

**Metrics.** [ASSUMED] Eligibility violations, stale-policy commits, actual token/latency/cost, independent quality, budget adherence, fallback frequency and router overhead. Estimate quality/cost curves with uncertainty; do not substitute judge correlation for calibration.

**Baselines.** [ASSUMED] Legal random routing, legal fixed-model routing and legal cache/load routing. Compare model/budget methods only on the same available action space or explicitly price its expansion.

**Expected result.** [ASSUMED] Hard eligibility and accepted per-request caps should remain satisfied through permitted fallback paths. A learned router need not outperform the eligible baseline.

**Ablation.** [ASSUMED] Uniform versus query-conditioned budgets, fresh versus stale signals, ex-ante versus post-hoc cascade estimates, and eligibility-first versus diagnostic blocked soft-score temptation. Unsafe routes are blocked during the diagnostic.

**Interpretation.** [ASSUMED] Evaluate constraint violations separately from paired quality/cost effects; average budget compliance cannot establish a per-request cap.

**Threats to validity.** [ASSUMED] Development/acceptance leakage, unobserved tenant-policy changes, miscalibrated quality proxies and shared-template dependence can bias selection comparisons.

**Acceptance criteria.** [ASSUMED] Zero unauthorized/geographically forbidden actions, including fallbacks and cached-state reuse; no accepted per-request hard-cap violation. Quality-loss/cost thresholds and confidence procedure are preregistered, with cluster-aware uncertainty where queries share templates or documents.

**Result that rejects the hypothesis.** [ASSUMED] Any hard-policy violation rejects eligibility preservation. Independently measured quality/cost outside the preregistered frontier rejects the learned-selection claim even when an oracle action-space theorem holds.

**Reproducibility.** [ASSUMED] Preserve the complete eligibility set, scores, policy epochs, action/cascade histories, actual usage and evaluator versions. Re-evaluate after model/provider changes rather than retaining a stale ranking.

### Experiment 46.3 — Delay, drain, partial-stream failure and retry takeover

**Hypothesis.** [ASSUMED] Unready capacity never serves current admission credit; scale-down and takeover preserve active obligations; bounded retry yields an explicit client-visible terminal result without stale-owner publication.

**Setup.** [ASSUMED] Pin the engine/control plane and durable store. Define absolute deadlines, finite drain/lease/retention periods, epoch checks at output/effect commits, bounded output buffers and terminal protocol. External effects use a mock transaction system with explicit idempotency/fencing support.

**Independent variables.** [ASSUMED] Loading-delay distributions, failed pending starts, metric lag, process pauses beyond lease expiry, partitions, disconnects, slow consumers, duplicate delivery and post-publication engine failure.

**Controlled variables.** [ASSUMED] Offered trace, model/quality criterion, resource budget, original deadline, persisted attempt cap and policy scope. Injected startup delays are marked as injections rather than natural model-loading measurements.

**Dataset/workload.** [ASSUMED] Finite long-generation requests with event identities and a recovery period, plus mocked side-effect outcomes spanning before/after external commit and before/after durable completion recording.

**Hardware.** [ASSUMED] Record device readers and synchronization boundaries, not just application process exit. A control-store failover test requires its actual consistency configuration.

**Metrics.** [ASSUMED] Desired/pending/ready/draining timeline; forecast error by horizon; offered versus processed work; safe-reclamation delay; persisted attempts; stale commits rejected; duplicate compute/effects; partial failures and client outcome; retained bytes and cleanup.

**Baselines.** [ASSUMED] Reactive versus delay-aware scaling under matched cadence/capacity profiles; warm reserve priced explicitly; resource breakers versus health ejection; retry disabled versus bounded durable retry.

**Expected result.** [ASSUMED] Pending instances should add no current credit; fenced takeover should preserve durable attempt limits and return explicit partial or terminal stream status.

**Ablation.** [ASSUMED] Isolate cadence from actuation granularity, lookahead from uncertainty margin, output replay retention from rerun, and lease ownership from fenced commits. The unfenced case is restricted to a mock effect path.

**Interpretation.** [ASSUMED] Separate capacity-readiness failure, resource-lifetime failure and ownership/effect failure. A successful mock takeover does not validate every real effect sink.

**Threats to validity.** [ASSUMED] Fault timing coverage, incomplete observation of external effects, correlated infrastructure failures and unrealistic drain/startup distributions limit transfer.

**Acceptance criteria.** [ASSUMED] No pending instance contributes present service credit; no release before the final permitted reader; zero stale-owner output/effect commits; no reset of persisted attempts on redelivery; all unsafe ambiguous ledger states terminate or reconcile before launch. Every started stream has one declared terminal outcome or a documented transport loss distinguishable from clean completion.

**Result that rejects the hypothesis.** [ASSUMED] A stale epoch committing output, an ambiguous side effect replayed unsafely, a reset retry budget, premature state release or silent truncated success rejects the corresponding contract. Recovery speed alone cannot compensate.

**Reproducibility.** [ASSUMED] Retain fault schedule, action epochs, store histories, device completion evidence, byte/event logs and client traces. Repeat faults at multiple transition boundaries; a single successful run is not a reliability estimate.

## Acceptance criteria

[DERIVED] Exact invariants and statistical claims have different acceptance rules. Hard-policy, finite-count and ownership checks require complete event accounting at the stated boundary. Timing/quality/cost claims require finite-population definitions, appropriate uncertainty and comparable workloads. A p95 cannot represent all tenants or all long requests without its denominator and stratification.

[ASSUMED] Each experimental plan must preregister timing/quality thresholds, tolerance for clock uncertainty, workload duration, independent repetitions and acceptable recovery horizon. This edition supplies categorical invariants and explicitly leaves equipment-specific numeric SLO values unresolved. Filling those values after observing results would invalidate confirmatory interpretation.

## What this edition did not do

[UNVERIFIED] No runtime was launched, controller/router trained, fault injected, queue measured or quality acceptance executed. The mathematical procedures are explanatory designs. One immutable authentication source file was inspected statically; it does not verify the composed service, authorization, ledger or device-cancellation path. All manuscript files remain manuscript_draft.

## Topic-completeness audit

[KNOWN] Obligations below refer to CONTENT_CONTRACT §4.1: A problem/prior limitation; B formal contract; C full methodology; D mathematical account; E bounded procedure; F implementation; G resources; H reported protocol; I observations; J alternatives; K improvements/lineage; L validity/failures; M reproducibility/closure. The anchor map applies to every row, with topic-specific source/gap records in the table.

| Obligation | Canonical manuscript anchors |
|---|---|
| A | Each owning section #scope and #why-this-exists |
| B, D | #formulation and #mechanism, with Eq. 46.1–46.29 and explicit adaptation conditions |
| C, G | #mechanism, #implementation and the cost paragraph before the inline figure |
| E | #algorithm; terminal-operator convention in 46.1 and finite per-section budgets |
| F | #implementation; current documentation or R46.13 immutable file; no runtime certification |
| H, I | #experimental-design and #observations; absent controlled evidence stated explicitly |
| J, K | #siblings and #extensions; dated chapter lineage |
| L, M | #failure-modes, #limitations, #reproducibility and source ledger |

[KNOWN] All rows require A–M unless a stated exception applies. “No training” excludes training-data construction only, not the method's representations, estimation, execution or source-reported observations. Interface specifications have no controlled research experiment to invent; H/I document that absence and its review consequence.

| Required concept / substantive variant | Owning manuscript anchor | Applicable obligations | Primary key and exact locator | Unresolved gap | Review consequence |
|---|---|---|---|---|---|
| TTFT and useful-first-delivery | [46.1](46-1-service-contracts.md#formulation) | A–M; no training | R46.1 §5; R46.2 §§IV–V; R46.11 §9.2.6 | Clock/client boundary unexecuted | No client-SLO claim |
| Token delivery versus chunks/heartbeats | [46.1](46-1-service-contracts.md#mechanism) | A–M; no training | R46.11 §§9.2.5–6; R46.20 streaming | Actual transport trace absent | No token ITL from chunk gaps |
| Completion deadlines | [46.1](46-1-service-contracts.md#mechanism) | A–M; no training | R46.9 §6.2; R46.24 timeout sections; Eq. 46.3 | End-to-end propagation unverified | Finite budget is design condition |
| Availability/quality joint acceptance | [46.1](46-1-service-contracts.md#formulation) | A–M; no training | R46.2 Table I; Eq. 46.1–2 original union bound | Independent quality/denominator absent | No availability improvement from relabeling |
| Quota accounting | [46.1](46-1-service-contracts.md#mechanism) | A–M; no training | R46.4 Load shedding; R46.23 §4 | Generated/published/billed counts unresolved | Quota guarantee scoped explicitly |
| Cancellation lifecycle | [46.1](46-1-service-contracts.md#algorithm) | A–M; no training | R46.20 Request cancellation; Eq. 46.4 | Device quiescence unexecuted | Async cancellation not safe-release proof |
| Bounded request/byte/work queues | [46.2](46-2-admission-and-backpressure.md#formulation) | A–M; no training | R46.4 Load shedding; Eq. 46.5–6 | Hidden queues unmeasured | No whole-service bound from one handle |
| Request/token bucket quotas | [46.2](46-2-admission-and-backpressure.md#mechanism) | A–M; no training | R46.7 resources; Eq. 46.7 original deduction | Distributed atomicity unresolved | Exact bound conditional |
| Predicted output/cost reservations | [46.2](46-2-admission-and-backpressure.md#mechanism) | A–M; estimator training not supplied | R46.1 §3 profiling; Eq. 46.6 | Cost-model error/calibration absent | Estimate cannot become hard worst-case cap |
| Overload rejection and backpressure | [46.2](46-2-admission-and-backpressure.md#algorithm) | A–M; no training | R46.4 BackPressureError; R46.23 §4 | Physical propagation unexecuted | Named overflow state required |
| FIFO wait model | [46.2](46-2-admission-and-backpressure.md#formulation) | A–M; no training | Eq. 46.8 original lower-service model | Service lower bound unknown | No universal deadline promise |
| Cost-aware deficit fairness | [46.2](46-2-admission-and-backpressure.md#mechanism) | A–M; no training | Eq. 46.10 explanatory credit model | Multi-resource fairness unmeasured | Credit bound is conditional, no latency theorem |
| Distributed handle limits | [46.2](46-2-admission-and-backpressure.md#implementation) | A–M; no training | R46.4 per-DeploymentHandle scope; Eq. 46.9 | Handle count/topology absent | Per-handle setting is not global cap |
| Hard capability/ACL/geography eligibility | [46.3](46-3-routing.md#formulation) | A–M; no training | Eq. 46.11 original intersection; R46.12 security limits | End-to-end policy enforcement absent | Soft scores cannot authorize |
| Model preference routing | [46.3](46-3-routing.md#mechanism) | A–M | R46.3 §3.2 Eqs. 10–11, §4 Tables 1–3 | Local training/independent evaluation absent | Historical model pair only |
| Expected cost-budget LP | [46.3](46-3-routing.md#formulation) | A–M | R46.18 §2 Theorem 1 / Appendix A | True estimator error unknown | Expected budget is not per-request cap |
| Post-hoc cascade / subset routing | [46.3](46-3-routing.md#mechanism) | A–M | R46.18 §§3–4 Algorithm 3/Lemma 1; §5.1 Table 1 | Estimator overhead/calibration absent | Oracle/synthetic-noise bounds retained |
| Model plus output-budget selection | [46.3](46-3-routing.md#mechanism) | A–M | R46.19 §§3–4, Theorem 4.3; §§5–6 Table 1 | Prompt budget adherence/shift unverified | Set dominance is oracle-only |
| Utility-error regret / interpolation | [46.3](46-3-routing.md#formulation) | A–M; no independent training | Eq. 46.15 original proof; R46.19 interpolation | Uniform action error unavailable | Average error does not yield bound |
| Provider routing | [46.3](46-3-routing.md#mechanism) | A–M; no training | R46.9 semantics; R46.19 actual-token accounting | Provider defaults/revisions unresolved | No transparent-equivalence claim |
| Cache affinity versus load | [46.3](46-3-routing.md#implementation) | A–M; no training | R46.14 How It Works; R46.17 KvRouterConfig | No independent latency/ACL test | Documented score only |
| Queue/load/offered-demand signals | [46.4](46-4-autoscaling.md#formulation) | A–M; no training | R46.2 §§III–IV; R46.15 metric configuration | Saturation censoring unmeasured | Processed counters not offered demand |
| Warm reserve/model-loading delay | [46.4](46-4-autoscaling.md#mechanism) | A–M; no training | R46.1 Table 1; R46.2 Table III; Eq. 46.16 | Natural startup distribution absent | Injected delay remains explicit |
| Joint phase capacity | [46.4](46-4-autoscaling.md#formulation) | A–M; no training | R46.2 capacity formula; Eq. 46.17/19 counterexample | Joint profile absent | Phase maximum not sufficient |
| Reactive HPA/hysteresis | [46.4](46-4-autoscaling.md#mechanism) | A–M; no training | R46.5 Algorithm details; Eq. 46.20 | Service-tail experiment absent | Stabilization not safe drain |
| Predictive margin/lookahead | [46.4](46-4-autoscaling.md#mechanism) | A–M; estimator initialization supplied | R46.2 §§III–V Tables I/III; Eq. 46.18 | Margin coverage theorem absent | UCB name is heuristic |
| Operator-level elasticity | [46.4](46-4-autoscaling.md#mechanism) | A–M; profiling not supervised training | R46.1 §§3–4; §§5.1–5.7 Figures 13/19, Tables 1/2 | Precision/commit/main-panel SLO incomplete | Common backend, cadence confound explicit |
| Pending/ready reconciliation | [46.4](46-4-autoscaling.md#algorithm) | A–M; no training | R46.5 readiness; R46.16 Planner targets | Readiness prediction unverified | Pending grants no current credit |
| Scale-down drain / KV state | [46.4](46-4-autoscaling.md#mechanism) | A–M; no training | R46.6 Pod termination; R46.16 Guardrails | Current Planner explicitly lacks drain | No inferred transparent downscale |
| Deadline/backoff accounting | [46.5](46-5-resilience.md#mechanism) | A–M; no training | R46.8 Timeouts/Retry/Jitter; R46.24 retry controls; Eq. 46.23 | Real timeout scope unexecuted | Original deadline governs |
| Finite retry/amplification | [46.5](46-5-resilience.md#formulation) | A–M; no training | Eq. 46.21–22 original derivations; R46.8 nested retries | Independent constant failure invalid in overload | Hard attempt bound retained |
| Load-dependent retry feedback | [46.5](46-5-resilience.md#mechanism) | A–M; no training | Eq. 46.24 original local contraction model | Empirical failure-load function absent | Not a global stability theorem |
| Resource breaker/health ejection | [46.5](46-5-resilience.md#mechanism) | A–M; no training | R46.7 resources; R46.22 Ejection algorithm | No complete controlled LLM trial | Different mechanisms preserved |
| Eligible failover | [46.5](46-5-resilience.md#algorithm) | A–M; no training | R46.24 retry reasons; Eq. 46.11 inherited | Destination capacity/quality unverified | Re-admission and eligibility required |
| Idempotency/ambiguous effects | [46.5](46-5-resilience.md#mechanism) | A–M; no training | R46.9 §9.2.2; Eq. 46.25 original ledger | External transaction protocol absent | No exactly-once claim |
| Durable attempt count/epoch fencing | [46.5](46-5-resilience.md#algorithm) | A–M; no training | Algorithm 46.5 explanatory design; Chapter 47 release owner | Store consistency/effect fence unexecuted | Redelivery cannot reset budget |
| Duplicate work / stream replay | [46.5](46-5-resilience.md#mechanism) | A–M; no training | R46.20 cancellation; R46.11 Last-Event-ID | Replay retention/quiescence absent | One outcome not one execution |
| Authentication versus authorization | [46.6](46-6-api-behavior.md#mechanism) | A–M; no training | R46.12 limitations; R46.13 lines 11,30–62 | Middleware execution/route policy absent | Prefix guard not complete authorization |
| Streaming state and event cursor | [46.6](46-6-api-behavior.md#formulation) | A–M; no training | R46.11 §§9.2.3–6; Eq. 46.26–27 | Proposed terminal schema not implemented | SSE framing not durable resume |
| Partial failure after HTTP success | [46.6](46-6-api-behavior.md#mechanism) | A–M; no training | R46.9 §6.2; R46.20 Terminating a stream | End-to-end disconnect test absent | Initial 200 not completed validity |
| Structured errors/version contracts | [46.6](46-6-api-behavior.md#mechanism) | A–M; no training | R46.10 §§3.1–3.2; R46.23 §4 | Compatibility suite absent | Extension identity explicit |
| Finite output bytes / slow consumer | [46.6](46-6-api-behavior.md#formulation) | A–M; no training | Eq. 46.28–29 original conservation/fill model | Producer throttle unexecuted | Proxy cap not whole-service cap |
| Client-observed metrics/usage | [46.6](46-6-api-behavior.md#experimental-design) | A–M; no training | R46.11 dispatch; R46.20 cancellation/streaming | No joined client/device logs | Chunk gaps and missing usage remain distinct |

## Research questions and decisive evidence

[DERIVED] **Coupled control with uncertain capacity.** How can admission, routing and delayed scaling jointly constrain deadline risk when model phases contend and readiness forecasts are uncertain? A useful result needs a valid joint capacity model, stated uncertainty assumptions and either a proof under those assumptions or sustained fault/load experiments that falsify them. Adding independent per-phase margins does not resolve shared-resource contention.

[DERIVED] **Quality-aware routing under drift.** Can low-overhead estimators maintain calibrated decision risk across new models, budget instructions and task populations? Decisive evidence would combine independent acceptance data, actual budget adherence, time-separated updates, uncertainty calibration and legal action constraints. An expanded oracle action set establishes opportunity, not learned robustness.

[DERIVED] **Streaming identity across recovery.** What minimal retained state permits bounded-cost resume while preserving publication and effect semantics after partitions? Evidence must include stale-owner fencing, event-cursor reconciliation, external-effect ambiguity and retention expiry. A finite controller budget establishes termination; it does not alone establish success, safety or exactly-once execution.
