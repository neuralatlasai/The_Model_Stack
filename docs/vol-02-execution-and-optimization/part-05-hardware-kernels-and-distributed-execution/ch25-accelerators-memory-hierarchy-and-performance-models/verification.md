---
id: "ms.verification.25"
entity_type: "verification"
title: "Verification — Chapter 25"
short_title: "Verification — Chapter 25"
volume: 2
part: 5
chapter: 25
section: null
slug: "verification"
parent: "ms.chapter.25"
prev_sibling: "ms.section.25.6"
next_sibling: "ms.references.25"
children: []
prerequisites: ["ms.chapter.1", "ms.chapter.2", "ms.chapter.3", "ms.chapter.5", "ms.chapter.13", "ms.chapter.14", "ms.chapter.15", "ms.chapter.16", "ms.chapter.17"]
downstream: ["ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29", "ms.chapter.30"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "inference", "serving"], "mechanism": ["hardware", "performance_model", "memory_hierarchy"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.nvidia-cuda", "impl.amd-rocm", "impl.google-tpu-xla"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED", "ASSUMED"], "empirically_observed": false}
word_count_target: 1200
updated_at: "2026-10-09"
editorial_status: "manuscript_draft"
---

# Verification — Chapter 25

[DERIVED] This page specifies a falsifiable hardware/resource-model artifact and audits the manuscript's coverage. **No accelerator benchmark, profiler experiment, cross-platform comparison, cluster admission trial, or independent paper replication below was executed.** Figure execution evaluates analytical expressions only. The proposed protocols require an executor to supply versioned hardware and raw observations.

## Artifact contract

| Record | Required fields | Reject the artifact when |
|---|---|---|
| Workload | DAG, shapes, strides, masks, forward/backward scope, operation-count convention, input distribution and numerical/quality/deadline contract | A compared implementation changes the problem or output acceptance rule |
| Execution mapping | Matrix/vector/control/transfer path, padded work, launch and completion events, fallback operators | Source-level layers are counted while executed conversions/fallback are omitted |
| Hardware | SKU/stepping, count, driver/firmware/compiler, clocks, power cap, thermal conditions, usable capacity and disclosed peak provenance | A peak changes precision/sparsity/scope or an unmeasured sustained rate is presented as observed |
| Memory | Allocation/storage identity, aliases, owner, creation and safe last-completion time, reserved/allocated/resident convention, tier traffic | Aliases are double-counted or asynchronous consumers outlive recycled storage |
| Physical route | Endpoint/rank placement, scale-up and scale-out domains, link direction, cut capacity, routing/protocol, degradation and contention | Sum-of-endpoint rates substitutes for a shared cut |
| Model | Equation/version, calibrated inputs, uncertainty intervals, fit/holdout split, predictions frozen before inspection | Holdout shapes tune per-case multipliers or missing rates become optimistic constants |
| Observations | Raw repeated intervals, synchronization boundary, profiler/tool versions, cache/warm-up policy, co-tenancy and rejected cases | Profiler and wall-time totals are inconsistent or overlapped intervals are summed twice |
| Decision | Numerical pass/fail, feasible constraints, quality/deadline, accepted-work rate, cost/energy boundary, unknowns | An infeasible candidate receives a performance rank |

[DERIVED] Store the hardware disclosures separately from measured calibration. A vendor page is an eligible architecture disclosure only within its inspected date/version scope. A report-derived protocol is not book-executed code. The artifact must retain all rejected predictions and configurations necessary to reconstruct why a decision was made.

## Analytical acceptance checks

[ASSUMED] The following selected inputs illustrate the chapter equations. They are not device measurements or calibration data. An implementation can check these identities without claiming a scientific experiment.

| Check | Exact analytical expectation | Claim rejected if |
|---|---|---|
| Serialized service | Matrix1ms plus dependent vector4ms takes5ms; doubling matrix rate gives4.5ms and speedup10/9 | The full path is credited with a2× speedup |
| Padded useful work (Eq. 25.14) | $M=129,N=257,K=65,t=64$: useful work2MKN versus issued $2(192)(320)(128)$ | Useful and issued FLOPs share the same count without a declared tail path |
| Staging capacity | $m=n=64,k=32,b=2$: one operand stage8192bytes, double stage16384bytes, FP32 accumulator16384bytes | Accumulator or second buffer disappears from occupancy accounting |
| Lifetime peak | Disjoint x/y then y/z overlaps, x=1MiB,y=2MiB,z=4MiB: peak6MiB, sum7MiB | The sum is called peak or a last-use event precedes the last consumer completion |
| Service roof | $F=10^9,P=10^{15},Q=10^7,B=10^{12}$: compute1μs, memory10μs; exposed launch5μs gives first-order15μs | This lower/service model is called a measured runtime |
| Shared physical cut | Eight ranks each send1GB across a directional100GB/s cut: necessary service80ms | Eight100GB/s endpoint rates imply10ms across the one cut |
| Direction convention | A symmetric200GB/s TX+RX total means100GB/s one direction;1GB requires at least10ms | The aggregate is silently used as one-direction capacity |
| Accepted-work cost | Chosen2currencyunits/hour and100accepted outputs/s: $2/360000$ units/output | Failed/late outputs are counted accepted or the price is called a cloud quote |
| Checkpoint sensitivity | $c=10$ s, $\Delta=1000$ s, $\Lambda=10^{-6}$/s, $r=60$ s gives $0.01056$ overhead; unconstrained optimum $\sqrt{2c/\Lambda}\approx4472.14$ s | The rare-event, serialized model is extended to frequent/overlapped failures without revision |

[MATHEMATICALLY-DERIVED] The inequalities are necessary service/capacity conditions under their stated assumptions. A matching identity checks arithmetic; it does not validate an actual resource model. Model validation requires independent workload cases, physical observations, and a frozen interpretation policy.

## Proposed experiments

### Experiment 25.1 — Predict bottlenecks before inspecting the profiler

- **Hypothesis.** [DERIVED] Boundary-specific arithmetic intensity and compatible resource rates can predict a dominant service term for a restricted operator/configuration family; exposed overhead and insufficient parallelism can invalidate a two-term classification.
- **Setup.** [DERIVED] Choose one physical accelerator. Pin a correctness reference and qualify the candidate implementation before timing. Calibrate sustained arithmetic and boundary rates on a declared training subset of shapes. Freeze the model and bottleneck rule, then inspect profiler evidence on held-out GEMM, GEMV and reduction shapes. Retain ambiguous interval classifications.
- **Independent variables.** [ASSUMED] Matrix dimensions, reduction length, layout, batch, cache-residency condition and launch-count regime; choose the grid before reading held-out measurements.
- **Controlled variables.** [DERIVED] Device, software/driver, input values and acceptance tolerances, clock/power policy, synchronization interval, warm-up, compiler specialization, graph capture and co-tenancy. Instrumentation and uninstrumented timing are separate panels.
- **Dataset/workload.** [ASSUMED] Synthetic seeded tensors spanning aligned and tail shapes, small and large working sets, and enough held-out cases to distinguish interpolation from extrapolation. Exact counts and seeds remain UNVERIFIED until the manifest is supplied.
- **Hardware.** [UNVERIFIED] SKU, driver/runtime, firmware, clock range, power cap and thermal policy remain unselected. Do not substitute the paper's B200 row for a book-run machine.
- **Metrics.** [DERIVED] Correctness residual; raw wall times and repeated distribution; compatible arithmetic count and convention; measured bytes at the named boundary; model residual; launch contribution; occupancy and stall evidence; predeclared bottleneck classification versus observed intervention response. Profiler counters alone are not causal ground truth.
- **Baselines.** [DERIVED] Qualified vendor-library/eager reference, simple two-resource service roof, overhead-aware model, and a holdout-independent calibrated model. Preserve each method's assumptions and calibration budget.
- **Expected result.** [UNVERIFIED] No predictive error, speedup or agreement fraction is promised. [MATHEMATICALLY-DERIVED] A valid lower bound cannot exceed the matching observed execution interval beyond declared measurement uncertainty; such a violation falsifies its counts, rate, boundary or assumptions.
- **Ablation.** [DERIVED] Remove exposed overhead, use disclosed instead of sustained rates, conflate cache bytes with HBM bytes, and permit per-case fitting in a separately labeled diagnostic panel. Deliberately bad models reveal which correction is necessary.
- **Interpretation.** [DERIVED] Accept a restricted model only for the supported shape/configuration domain. A prediction can agree for the wrong reason; test the claimed bottleneck with a controlled change in the implicated demand or resource. Recalibration is required when the compiled path changes.
- **Threats to validity.** [DERIVED] Frequency drift, cache history, measurement overhead, thermal throttling, shape specialization, hidden dtype/padding changes, selected successful cases, noisy neighbors and test-set fitting.

### Experiment 25.2 — Test route cuts, lifetime peaks, and fallback boundaries

- **Hypothesis.** [DERIVED] A candidate can satisfy endpoint rates and static tensor capacity while violating a shared-cut or asynchronous-lifetime constraint; an unsupported graph stage can add a material transfer/host path.
- **Setup.** [DERIVED] Build a small qualified workload with explicit buffer ownership and instrumented completion. Compare two placements that preserve semantics but change the shared physical cut. Include a fully device-resident route and a declared host-fallback route. Reconstruct peak live/reserved bytes and directional crossing demand from the actual execution.
- **Independent variables.** [ASSUMED] Placement, concurrent sender count, message size, buffering degree, asynchronous depth and the presence of a selected unsupported stage.
- **Controlled variables.** [DERIVED] Workload outputs, precision, global batch, route policy, collective/runtime version, synchronization, numerical tolerance, cache conditions and traffic generators. A topology change that also changes the implementation requires a separate panel.
- **Dataset/workload.** [ASSUMED] Reproducible synthetic operator graph plus identical tensor-transfer payloads; no benchmark dataset or workload has been run for this edition.
- **Hardware.** [UNVERIFIED] At least one inspectable shared fabric cut and device/host memory path are required. The exact topology, network adapter, switch, protocol and memory capacities remain executor inputs.
- **Metrics.** [DERIVED] Numerical equivalence; allocated/reserved/resident and peak-live bytes separately; producer/consumer completion timestamps; per-direction crossing bytes, cut service time, fallback transfer/host time and end-to-end latency.
- **Baselines.** [DERIVED] No-overlap safe-lifetime implementation, qualified overlapped implementation, endpoint-only estimator, cut-aware estimator, and complete graph timing. An intentionally unsafe premature reuse is a bounded sanitizer fixture rather than an accepted deployment.
- **Expected result.** [MATHEMATICALLY-DERIVED] The demand/capacity lower bounds hold under their definitions. [UNVERIFIED] Their tightness, overlap benefit and fallback penalty require observations.
- **Ablation.** [DERIVED] Change one shared cut while preserving endpoint rates; remove double buffering; account aliases once versus the invalid per-view sum; include/exclude the host path in clearly labeled timing panels.
- **Interpretation.** [DERIVED] If a shared cut dominates, adding endpoint bandwidth cannot by itself serve the unchanged crossing demand faster. If a buffer is reused before final completion, timing improvements do not rescue its correctness. A fallback route is a different physical execution requiring complete accounting.
- **Threats to validity.** [DERIVED] Unobserved routing, protocol retransmission, burst shaping, asynchronous counter attribution, allocator pooling, instrumentation-dependent schedule and host contention.

### Experiment 25.3 — Reconcile rack admission with retained progress

- **Hypothesis.** [DERIVED] Passing independent compute and memory checks is insufficient for a placement whose simultaneous power/cooling/input/recovery requirements exceed the declared envelope.
- **Setup.** [DERIVED] Use an authorized controlled test environment or a trace-driven analytical replay explicitly labeled as such. Declare power/cooling boundaries, storage service, failure model and checkpoint semantics. Compare placements under healthy, synchronized-checkpoint and degraded-domain conditions. Reconcile an exclusive causal state timeline with retained progress.
- **Independent variables.** [ASSUMED] Active accelerator count, placement, power cap, input demand, checkpoint interval and injected recoverable-event schedule.
- **Controlled variables.** [DERIVED] Numerical objective, global workload/token count, recovery correctness, elapsed-time boundary, retained-progress definition and complete workload/software identity.
- **Dataset/workload.** [ASSUMED] One fixed versioned workload with a repeatable data stream and verifiable recovery position. Event schedules and run duration must be predeclared; none are executed here.
- **Hardware.** [UNVERIFIED] Rack electrical metering, cooling conditions, topology, storage and checkpoint destination remain unspecified. Safety limits and operational procedures come from the real environment, not this manuscript's analytical defaults.
- **Metrics.** [DERIVED] Retained useful work per wall second and the separately defined retained-progress time fraction $T_u/T_w$, busy time separately, rejected/rolled-back work, energy at its meter boundary, peak/burst storage demand, checkpoint service, recovery time and each exclusive loss category. Reconcile all categories with wall time before attributing a gain.
- **Baselines.** [DERIVED] Conservative admission, capacity-only admission in analytical replay, staggered versus synchronized checkpoint scheduling, and identical placements with/without the declared degraded domain.
- **Expected result.** [UNVERIFIED] No measured utilization or reliability target is claimed. [MATHEMATICALLY-DERIVED] Negative envelope headroom rejects the selected steady-state placement under those supplied budgets; it does not predict the transient failure mechanism.
- **Ablation.** [DERIVED] Remove shared input service, omit recovery/rollback, replace burst demand with the average, and sum overlapping wait causes in a separately labeled invalid accounting demonstration.
- **Interpretation.** [DERIVED] An accepted placement is conditional on the supplied budgets and failure model. More busy accelerators can yield less retained progress. A constant-rate envelope cannot establish tail reliability or common-cause resilience.
- **Threats to validity.** [DERIVED] Nonstationary service, common-cause events, unrealistic injected faults, operator intervention, thermal transients, incomplete checkpoint state and trace replay that suppresses feedback between scheduling and contention.

## Topic-completeness audit

[DERIVED] This is an editorial traceability map, not an experimental pass. Each topic is owned by its listed section. Within that section, **P** means Scope/Why this exists (problem and bottleneck); **F** means Formulation (contract and symbols); **M** means Mechanism (full method and math); **A** means Algorithm (procedure, invariant and termination); **I** means Implementation (execution path and resources); **E** means Experimental design (source-reported protocol separated from proposals); **O** means the four Observations paragraphs; **S** means Siblings/Extensions and the chapter's dated lineage; **L** means Failure modes/Limitations; **R** means Reproducibility. These anchors cover all thirteen contract obligations, with the topic-specific mechanism and source locator below. A missing empirical result is recorded as missing rather than filled by another topic's experiment.

| Required topic / variant | Canonical section and method/formal obligation | Resource and evidence locator | Protocol, alternatives, failures and closure |
|---|---|---|---|
| GPU execution units | [25.1 P/F/M/A](25-1-accelerator-organization.md#mechanism): resource DAG and dependency-limited completion | I: compatible service classes; R25.3 §§III–V | E/O: microbenchmark boundaries; S: compiler-managed route; L/R: path and clocks |
| Tensor/matrix units | [25.1 F/M](25-1-accelerator-organization.md#formulation): tile padding, useful/issued arithmetic | I: operands, accumulator and vector epilogue; R25.1 GPU section; R25.2 execution section | E/O: no matched application speedup; S/L/R: tail path and precision contract |
| Warps/wavefronts | [25.1 M/A](25-1-accelerator-organization.md#mechanism): logical, resident, eligible and issued groups | I: predication/divergence; R25.2 Wave32 disclosure | E/O: no occupancy-to-throughput equivalence; S/L/R: dispatch and lane usefulness |
| Vector/control units | [25.1 F/M](25-1-accelerator-organization.md#formulation): separate compatible rates and serialized epilogue | I: reduction, address/control, nonlinear service; R25.1; R25.5 pp.2–6 | E/O: source organizational claims; S/L/R: serial bottleneck counterexample |
| TPUs | [25.1 M/I](25-1-accelerator-organization.md#implementation): matrix/vector/scalar/sparse and compiler-managed transfer | R25.5 Table1 and Software Stack | P/F/A/E/O/S/L/R: resource graph with no matched GPU ranking |
| Other AI accelerators | [25.1 M/I](25-1-accelerator-organization.md#mechanism): nonfavored operators and host boundaries | R25.6/R25.11 disclosure; §25.5 feasibility | P/F/A/E/O/S/L/R: unqualified paths remain UNVERIFIED |
| Registers | [25.2 F/M/A](25-2-memory-hierarchy.md#mechanism): local allocation, spills and resident-block capacity | I: register demand versus capacity; R25.3 memory/occupancy protocol | E/O/S/L/R: declared compiler path, not logical tensor bytes |
| Shared memory/SRAM | [25.2 F/M](25-2-memory-hierarchy.md#formulation): single/double staging plus accumulator | I: explicit storage and alignment; R25.3; R25.5 VMEM | P/A/E/O/S/L/R: extra buffering exchanges overlap for residency |
| Caches | [25.2 M](25-2-memory-hierarchy.md#mechanism): cache-history-dependent traffic, not allocation ownership | I: boundary counters; R25.3 cache protocol | P/F/A/E/O/S/L/R: cold/warm panels and reuse assumptions |
| HBM | [25.2 F/M](25-2-memory-hierarchy.md#formulation): device capacity and physical bytes | I: active/reserved/resident distinctions; R25.1/R25.2 memory disclosures | P/A/E/O/S/L/R: specification versus measured rate |
| Host DRAM | [25.2 M/I](25-2-memory-hierarchy.md#implementation): ownership and transfer/coherence route | R25.9 §§2–4,5: host memory pooling boundary | P/F/A/E/O/S/L/R: addressability does not merge service rates |
| Persistent storage | [25.2 M/I](25-2-memory-hierarchy.md#mechanism): I/O, serialization, service and buffer demand | R25.5 Software Stack; derived storage boundary | P/F/A/E/O/S/L/R: input/checkpoint contention in§25.6 |
| Placement and lifetime | [25.2 F/M/A](25-2-memory-hierarchy.md#algorithm): storage aliases and last asynchronous completion | Eq.25.3–25.4; I: safe event sweep | P/E/O/S/L/R: peak-overlap fixture and rejected premature reuse |
| Arithmetic intensity | [25.3 F/M](25-3-roofline-reasoning.md#formulation): work divided by named-boundary bytes | I: GEMM/GEMV shape/layout; R25.4 §§IV-A–G | P/A/E/O/S/L/R: cache/HBM boundaries remain distinct |
| Bandwidth ceiling | [25.3 F/M/A](25-3-roofline-reasoning.md#formulation): byte service bound and rate interval | R25.4 calibration; I: sustained versus disclosed | P/E/O/S/L/R: falsification on held-out shapes |
| Compute ceiling | [25.3 F/M](25-3-roofline-reasoning.md#formulation): compatible precision/resource rate | R25.3 instruction protocol; R25.4 calibration | P/A/I/E/O/S/L/R: padded and useful work conventions |
| Launch overhead | [25.3 M/A](25-3-roofline-reasoning.md#mechanism): exposed serialized dispatch, no double counting | R25.4 overhead terms; I: timing boundary | P/F/E/O/S/L/R: capture and asynchronous launch panels |
| Occupancy | [25.3 M/I](25-3-roofline-reasoning.md#mechanism): register/SRAM/architectural block bound | Eq.25.5 model discussion; R25.3 protocol | P/F/A/E/O/S/L/R: residency is not eligible work or latency hiding |
| Bottleneck transitions | [25.3 M/A](25-3-roofline-reasoning.md#algorithm): interval classification and ambiguity | R25.4 §§IV–V; I: calibration versus holdout | P/F/E/O/S/L/R: controlled intervention, no universal fit claim |
| PCIe | [25.4 M/I](25-4-physical-connectivity.md#mechanism): endpoint-to-cut route and one-direction convention | Derived cut Eq.25.7–25.8; R25.1 platform paths | P/F/A/E/O/S/L/R: shared-root contention and actual route |
| NVLink/NVSwitch | [25.4 M/I](25-4-physical-connectivity.md#mechanism): local switched domain and shared cut | R25.1 NVLink6/scale-up disclosure | P/F/A/E/O/S/L/R: no endpoint-sum substitution |
| Scale-up/scale-out | [25.4 F/M/A](25-4-physical-connectivity.md#formulation): physical domain, host/rack cuts and topology | R25.1/R25.2 platform domains | P/I/E/O/S/L/R: actual placement and degraded-route identity |
| RDMA | [25.4 M/I](25-4-physical-connectivity.md#mechanism): transport interface plus physical route | R25.12 pp.22–24 adapter/support table | P/F/A/E/O/S/L/R: zero-copy label is not zero service cost |
| Ethernet/RoCE | [25.4 M/I](25-4-physical-connectivity.md#mechanism): RoCE carries RDMA over Ethernet | R25.12 dated support table; R25.2 networking disclosure | P/F/A/E/O/S/L/R: congestion and retransmission remain path inputs |
| InfiniBand | [25.4 M/I](25-4-physical-connectivity.md#mechanism): distinct fabric route for RDMA | R25.12 pp.22–24 | P/F/A/E/O/S/L/R: adapter support is not bandwidth validation |
| CXL | [25.4 M/I](25-4-physical-connectivity.md#mechanism): coherent host-memory interconnect, not storage media | R25.9 §§2–4,5.1–5.7 | P/F/A/E/O/S/L/R: host testbed cannot establish GPU/KV-offload benefit |
| NVIDIA | [25.5 P/F/M/A](25-5-platform-comparison.md#mechanism): feasible GPU route before performance score | R25.1/R25.3/R25.10; I: complete numerical/software boundary | E/O/S/L/R: confidential-compute within-row comparators |
| AMD | [25.5 M/I](25-5-platform-comparison.md#implementation): ROCm/device/precision qualification | R25.2 execution, memory and rack disclosures | P/F/A/E/O/S/L/R: disclosed architecture is not numerical parity |
| TPU/JAX | [25.5 M/I](25-5-platform-comparison.md#implementation): graph/shape/engine and buffer contract | R25.5 pp.2–8, Software Stack | P/F/A/E/O/S/L/R: bridge/runtime qualification remains unrun |
| Trainium | [25.5 M/I](25-5-platform-comparison.md#implementation): Neuron/NKI version and graph coverage | R25.6 launch; R25.11 versioned interface | P/F/A/E/O/S/L/R: specification and accepted-work rate separated |
| Inferentia | [25.5 M/L](25-5-platform-comparison.md#limitations): explicit unqualified deployment branch | No eligible detailed successor artifact adopted; evidence gap | P/F/A/I/E/O/S/R: require device/versioned implementation before ranking |
| CPU/Apple silicon | [25.5 M/I](25-5-platform-comparison.md#mechanism): shared-memory host/accelerator and full fallback | R25.7 GPU/NeuralEngine distinctions | P/F/A/E/O/S/L/R: host/co-tenant/thermal envelope and accepted outputs |
| NPUs | [25.5 M/I](25-5-platform-comparison.md#implementation): operator support and graph partitioning | R25.8 originating launch; R25.13 dated2026.3 coverage | P/F/A/E/O/S/L/R: inaccessible datasheet excluded, fallback timed |
| Specialized ASICs | [25.5 M/L](25-5-platform-comparison.md#limitations): shape/precision/coverage feasibility predicate | R25.5/R25.6 disclosed branches; other candidates UNVERIFIED | P/F/A/I/E/O/S/R: no unsupported internal architecture invented |
| Rack topology | [25.6 P/F/M/A](25-6-cluster-constraints.md#mechanism): placement-linked shared demands | R25.1/R25.2 rack disclosures; Eq.25.11 | I/E/O/S/L/R: healthy versus declared degraded placement |
| Power/cooling | [25.6 F/M/A](25-6-cluster-constraints.md#formulation): simultaneous electrical/thermal inequality | Eq.25.11; R25.1/R25.2 disclosure scope | P/I/E/O/S/L/R: meter boundary and conditions, not nameplate average |
| Failure domains | [25.6 M/A](25-6-cluster-constraints.md#mechanism): event scope, rollback and checkpoint sensitivity | Eq.25.12; R25.5 resilience discussion | P/F/I/E/O/S/L/R: rare-event assumption and common-cause exclusion |
| Storage throughput | [25.6 F/M](25-6-cluster-constraints.md#formulation): average input and burst checkpoint service | Eq.25.11; derived queue/admission boundary | P/A/I/E/O/S/L/R: shared path and simultaneous write windows |
| Scheduling | [25.6 M/A](25-6-cluster-constraints.md#algorithm): accept only simultaneous feasible placement | Eq.25.11; route/resource ledger | P/F/I/E/O/S/L/R: necessary model, no scheduler benefit measured |
| Achieved utilization | [25.6 F/M](25-6-cluster-constraints.md#mechanism): exclusive causal ledger and retained progress | Eq.25.13; source resilience context R25.5 | P/A/I/E/O/S/L/R: avoid overlap double counting and discarded work |

## Source-window and reproducibility closure

[DERIVED] All thirteen reference records are originating publications or dated releases within2025-12-01–2026-10-09. Later revisions are listed separately from first publication. Full-text inspection and exact limitations are recorded in [references.md](references.md). The chapter retains a disagreement between Blackwell reports' SM counts without selecting an unverified count; it excludes inaccessible Intel datasheet internals and refuses cross-platform rankings without a matched experiment.

[UNVERIFIED] Scientific closure requires the complete artifact, raw observations, independent implementation review, held-out prediction evaluation, numerical qualification and the real operational envelope. Neither successful Markdown compilation nor calculator execution supplies that evidence. Editorial completion means the method, assumptions, source boundary, alternatives, failure modes and proposed falsification are explicit, while unavailable empirical support stays visible.
