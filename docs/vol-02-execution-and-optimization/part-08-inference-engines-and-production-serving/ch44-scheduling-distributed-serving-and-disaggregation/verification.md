---
id: "ms.verification.44"
entity_type: "verification"
title: "Chapter 44 — Verification"
volume: 2
part: 8
chapter: 44
section: null
slug: "verification"
parent: "ms.chapter.44"
prev_sibling: "ms.section.44.6"
next_sibling: "ms.references.44"
children: []
prerequisites: ["ms.chapter.29","ms.chapter.42","ms.chapter.43"]
downstream: ["ms.chapter.46","ms.chapter.47","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["scheduling","distributed_serving","disaggregation"],"feedback_setting":[],"modality":["text"]}
papers: ["P37","P38"]
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED","ASSUMED"],"empirically_observed":false}
word_count_target: 1500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# Chapter 44 verification

## Artifact specification

[DERIVED] The planned artifact is a **serving-scheduler and placement experiment**. This manuscript specifies its records and falsifiable tests; it does not create an executed benchmark or claim a winning configuration. Every future artifact carries a schema version, immutable identifier, units, and parent release tuple.

| Record | Required fields |
|---|---|
| release-manifest | Model/checkpoint/tokenizer/template hashes; adapters; state-policy identity; engine/compiler/kernel/transport commits; driver/toolkit; dtype/accumulator; graph/capture mode; supported layouts |
| workload-ledger | Arrival timestamps; exact tokenized prompts and prefix families; output stopping rules/lengths; tenant/class; namespace authorization; deadlines; cancellation times; trace provenance/split; warm/cold state |
| topology-manifest | GPU/CPU/NIC identifiers; rank/phase groups; expert maps; node/rack placement; memory capacities; physical bandwidth topology; shared traffic; transport path and registration |
| schedule-events | Decision timestamp/epoch; eligible/running/waiting sets; per-request offsets/context; work/token/state budgets; estimator inputs; batch descriptors; priority/credit; allocation failure and policy reason |
| state-events | Physical block owner/reference count; model/namespace identity; pin/unpin; eviction; replica creation; copy ranges/bytes; pack/reshard; source/destination reservation; completion and commit acknowledgement |
| outcome-events | Offered/accepted/rejected/cancelled/completed identities; first and every later visible token timestamp; EOS; terminal outcome once; failed epoch/retry; duplicate publication check; client backpressure |
| resource-samples | CPU scheduler cost; kernel time/traffic; resident/pinned/temporary state; repeated FLOPs/tokens; collective/transfer times; effective bandwidth; device/host power sample source/rate; idle/startup/drain/transition |
| analysis-record | Metric boundary and aggregation order; useful-work/quality criterion; offered and accepted denominators; paired comparisons; uncertainty method; negative conditions; violated invariants; unsupported cases |
| decision-record | Claimed benefit and falsifying observation; policy/placement selection rule; tuning budget; held-out trace; rollout/rollback owner; residual evidence gaps |

[DERIVED] Equal GPU counts alone do not define equal budgets when topology, GPU types, prefill/decode weight duplication, host tiers, and reserved transition capacity differ. The comparison declares all those resources and reports both device-time and total charged time. A fallback is retained in the result category rather than silently assigned to the intended fast path.

## Verification task

[DERIVED] The book-plan task is to identify where disaggregation loses to colocation because state movement or queueing dominates. The experiments below test numerical/state correctness first, then critical-path/resource tradeoffs, then nonstationary adaptation. All setup choices are proposed analytical inputs and remain unexecuted.

### Experiment 44.1 — Admission, chunk, and ownership correctness

**Hypothesis.** [ASSUMED] Changing membership or chunk boundaries preserves the declared model computation and causal state contract within a predefined dtype/backend tolerance.

**Setup.** [ASSUMED] Implement static/request-dynamic/continuous membership over the same engine, then full versus consecutive chunked prefill. Compare final prompt logits before sampling. Include exact-prefix hits/misses, multi-block tails, empty/BOS prompts, one-token outputs, shared active blocks, allocation exhaustion, and invalid namespace/model/layout identities.

**Independent variables.** [ASSUMED] Admission boundary, chunk/token budget, context length, active set, state reservation mode, cache hit amount, and deliberately invalid compatibility metadata.

**Controlled variables.** [ASSUMED] Model/tokenizer/adapter, exact token sequence and positions, dtype/accumulation, attention backend, output criterion, device layout, and total available state.

**Dataset/workload.** [ASSUMED] Deterministic small prompts with retained seeds plus a fixed licensed trace snapshot. Prefix sharing is explicitly constructed and labeled; no claim of production representativeness follows.

**Hardware.** [ASSUMED] Record actual available devices and supported backend paths. Unsupported configurations are rejected explicitly rather than replaced with assumed kernels.

**Metrics.** [ASSUMED] Absolute/relative logit error, prefix-position correctness, completed offsets, tokens processed once, no output before readiness, pinned-block safety, leaked reservations, duplicate terminal/publication events, CPU construction time, workspace/state bytes.

**Baselines.** [ASSUMED] Unchunked single-request reference, fixed cohort, and identical continuous scheduler with cache reuse disabled.

**Expected result.** [ASSUMED] Valid configurations satisfy semantic and ownership invariants. Invalid identities never become hits; exhausted allocations defer/recover; zero-decode cohorts avoid undefined utilization. These are acceptance criteria, not observations.

**Ablation.** [ASSUMED] Reset chunk positions, omit a prefix block, mutate an adapter identifier, evict a pinned block, and replay a stale completion epoch. The test must expose each violation.

**Interpretation.** [DERIVED] A performance result is inadmissible if it changes token semantics or releases memory still referenced by kernels/transports. Floating-point reordering alone is assessed against the predefined tolerance rather than declared an architectural failure.

**Threats to validity.** [DERIVED] A tiny reference can miss large-shape fallback behavior; deterministic output alone can hide logit drift. Correctness tests are stratified by real serving shapes before their findings are generalized.

### Experiment 44.2 — Equal-budget disaggregation break-even

**Hypothesis.** [ASSUMED] Separation improves service only when removed interference and phase specialization exceed extra queue, exposed handoff, routing, and lost batching costs in Eq.44.17.

**Setup.** [ASSUMED] Compare a tuned colocated chunked scheduler with phase-separated plans under the same total hardware/state/host/network budget. Select plans on a tuning trace and evaluate on a held-out trace. Record whether the first token is streamed from prefill or gated by decode readiness. Tune all candidates with the same evaluation budget.

**Independent variables.** [ASSUMED] Prompt/output-length distribution, reuse, arrival rate/burstiness, phase ratio/mesh, cache capacity, physical placement, shared-link background traffic, packing/message granularity, early/delayed destination reservation.

**Controlled variables.** [ASSUMED] Exact requests and stopping semantics, model/precision/backend, total allocated devices and charged time, warmup policy, client path, deadline definitions, allocator capacity, and iteration tuning budget.

**Dataset/workload.** [ASSUMED] Retain a licensed trace with exact token prefixes and independently vary timestamp replay. Use analytical low-load/equal-length and long-context cases as explicit stress inputs. Do not call a time-dilated or resampled workload the original production trace.

**Hardware.** [ASSUMED] Use actual fast-local and slower-cross-node paths when available; otherwise label topology emulation separately. Retain GPU/NIC affinity and competing traffic rather than substituting advertised bandwidth.

**Metrics.** [ASSUMED] Offered-population goodput, accepted/offered attainment, TTFT, each visible-token gap, request-average TPOT and its percentile order, phase queues, transfer/pack/reshard/overlap, source/destination byte-seconds, CPU scheduling, device-time, energy and cost per useful completion.

**Baselines.** [ASSUMED] Competitive equal-budget colocation; separate phases with and without constrained placement; source-only fastest placement as an explanatory upper bound, explicitly not a realizable equal-budget policy if resources differ.

**Expected result.** [ASSUMED] The low-load case in §44.4 should show no latency gain when phase execution is equal and exposed handoff is positive. Other cases may cross the symbolic break-even boundary. The experiment is designed to retain losses, not guarantee a separated winner.

**Ablation.** [ASSUMED] Disable overlap, force cross-node handoff, remove queue-aware routing, disable prefix reuse, constrain/unconstrain phase meshes, and switch publication gating while keeping the token-gap metric.

**Interpretation.** [DERIVED] Agreement between traced Eq.44.17 components and total latency supports the explanatory accounting. A residual requires investigating unmodeled contention/control/measurement boundaries. A lower TTFT with a larger first gap is not an unqualified streaming improvement.

**Threats to validity.** [DERIVED] Placement search can overfit a trace; client/network bottlenecks can hide server gains; measurement can count overlap twice. State compatibility and equal resource budgets are prerequisites, not after-the-fact caveats.

### Experiment 44.3 — Burst, long-tail, cancellation, and controller composition

**Hypothesis.** [ASSUMED] Adaptation improves useful service only when recovery/transition cost and exported class-conditioned latency remain bounded.

**Setup.** [ASSUMED] Replay a held-out nonstationary trace with bounded bursts, heavy-tailed outputs, authenticated tenant classes, changing prefix popularity, and explicit cancellations. Add request migration, recovery priority, network-stage arbitration, expert remapping, and frequency control incrementally. Retain each component's action and estimator error.

**Independent variables.** [ASSUMED] Burst magnitude/duration, length tail, class weights, low-reuse share, migration bandwidth/concurrency, priority promotion thresholds, expert-load shift, model/power error, cancellation timing, and rank/network faults.

**Controlled variables.** [ASSUMED] Same offered requests, total hardware/host/network/state, service criteria, model/precision, admitted work budget, initial warmup, event replay, and finite retry/deadline limits.

**Dataset/workload.** [ASSUMED] Use fixed provenance/splits and record artificial stress modifications. A trace's long-tail parameters and correlation structure are retained; aggregate means alone are insufficient.

**Hardware.** [ASSUMED] Faults are injected only into an isolated test deployment with explicit physical completion handling. Frequency/transport actions use supported actual interfaces and immutable releases.

**Metrics.** [ASSUMED] Offered goodput, per-class TTFT/gaps/completion/rejection, oldest waiting age, repeated preemptions/recompute tokens, migration contraction and downtime, duplicated state, failed epochs, terminal correctness, expert mean/max load, blocked collective time, transition-inclusive energy/device-time.

**Baselines.** [ASSUMED] Static equal-budget policy; adaptation one component at a time; same placement without live migration; same frequency placement without fine control; priority-neutral scheduler with identical admission.

**Expected result.** [ASSUMED] Some regimes should expose noncontracting migration, stale-load remapping, or transition cost exceeding isolated savings. Successful regimes must improve useful offered service without violating the declared class/fairness constraints.

**Ablation.** [ASSUMED] Remove starvation promotion, use instantaneous rather than forecast decode load, omit source/destination reservation, ignore rank epoch, exclude transition energy, or report only accepted requests. Each ablation targets a specific misleading conclusion or failure.

**Interpretation.** [DERIVED] Component gains are not added arithmetically; the joint experiment determines whether another bottleneck or oscillation appears. Faster recovery of capacity does not imply preserved progress of every in-flight request.

**Threats to validity.** [DERIVED] Synthetic cancellations/faults may not match production correlations; predicted output length can leak retrospective ground truth; selective trace filtering changes denominators. Retain censored/unresolved outcomes and distinguish simulation from physical replay.

## Topic-completeness audit

[DERIVED] Each topic below maps the contract's obligations to its canonical section. In every row, **Scope/Why this exists** state problem, baseline and success; **Formulation/Mechanism** provide inputs, units, assumptions and derivation; **Algorithm/Implementation** provide bounded execution and resource accounting; **Experimental design/Observations** provide source protocol and four-layer interpretation; **Siblings/Extensions** provide differentials and lineage; **Failure modes/Limitations/Reproducibility/References** close validity and evidence. The table makes the topic-specific instantiation explicit; an omitted source measurement is not filled with a proposed result.

| Required topic | Formal/method/procedure/resource anchors | Reported protocol and observations | Alternatives/improvement/validity closure | Primary locator |
|---|---|---|---|---|
| Static batching | [44.1 Formulation](44-1-batching.md#formulation), Eq.44.1 decode slots; Mechanism cohort/packing distinction; Algorithm44.1 contrast | 44.1 Experimental design, Orca engine/end-to-end controls | Siblings membership lifetime; Limitations equal-duration premise | R44.1 §§3,6.1–6.2 |
| Request-dynamic batching | 44.1 Mechanism collection window, analytical arrival wait, state budget | Orca custom FasterTransformer cohort scheduler and low-load exception | Siblings versus fixed/continuous; Reproducibility timeout/padding | R44.1 §6.2 |
| Continuous iteration admission | 44.1 Eq.44.2, Algorithm44.1 transaction/rollback | Same protocol, observations avoid isolated universal factor | Failure growth deadlock; Extensions chunking | R44.1 §§3–4; R44.9 Preemption |
| Token budgets and length heterogeneity | 44.1 Eq.44.3 context pairs, memory/headroom and O(R log R) cost | Prompt/output-length sampling; no modern tail inference | Work-budget confusion; resource metrics distinct | R44.1 §6.2; R44.9 Chunked Prefill |
| Chunked prefill | [44.2](44-2-prefill-management.md) Eqs.44.6–44.9, causal offsets and complete Algorithm44.2 | Sarathi Table4/ Figure14, exact hardware/budget | Incorrect chunk boundary; full-versus-chunk semantic tolerance | R44.2 §4, §5.4; R44.13 scheduler |
| Decode interference | 44.2 residual gap budget Eq.44.7, mixed-time model | Hybrid-only/chunk-only/combined results with negative TTFT control | Siblings full-prefill/strict-decode/disaggregated | R44.2 Table4 |
| Starvation and fairness | 44.2 deficit units/conditions, Algorithm44.2, zero residual capacity | Preble fairness ablation linked to 44.3 | No unconditional waiting bound; oldest-age detection | R44.4 §§4.3,5.4 |
| Latency/throughput tradeoff | 44.2 launch/traffic Eq.44.8, pipeline variability | Table4 mean-TTFT/tail-TBT difference | Limitations kernel/shape dependence, current adoption not replication | R44.2 §§5.3–5.4 |
| Cache-aware routing/locality | [44.3](44-3-prefix-and-state-placement.md) Eq.44.11, E2 reconstructed/prose discrepancy, Algorithm44.3 | Preble five workloads/physical configurations | Round-robin/load/prefix/joint differentials | R44.4 §§4–5; P37 §3 |
| State fetch and eviction | 44.3 Eqs.44.12–44.13, pin/copy lifetime and metadata costs | Preble component ablation; SGLang local cache ablation | Hotspot/stale index failure; no active-reader eviction | R44.4 §§4.2–4.3; P37 §6.3; R44.16 |
| Tenant isolation | 44.3 authenticated key namespace and compatible model/policy contract | Current documented salt mechanics; no isolation experiment invented | Other timing channels and quotas remain distinct | R44.10 Cache Isolation for Security |
| Shared-prefix economics/replication | 44.3 marginal byte-second opportunity cost Eq.44.13 | Programming/long-output limited benefit, oracle-partition caveat | Replication capacity/network counterexample and open question | R44.4 §5.3; P37 §6.2 |
| Separate phase pools/placement | [44.4](44-4-disaggregation.md) offline/online loops, phase capacity Eq.44.18 | DistServe physical versus simulated placement/parallel controls | Equal-budget colocation and stage-alignment regime | P38 §§4,6 |
| KV handoff/transport/serialization | 44.4 Eqs.44.16,44.20 transaction, pack/reshard/memory cost | Transfer CDF tied to aligned local fabric | Explicit failure return; completion before buffer reuse | P38 §6.3; R44.14 engine; R44.15 header |
| Break-even and queueing | 44.4 Eqs.44.17–44.19, low-load non-gain proof | Physical transfer not generalized to cross-node | TTFT publication versus first-gap distinction | P38 §§3.3,6.3; R44.11 allocation policy |
| Parallel degrees/heterogeneous pools | [44.5](44-5-distributed-execution.md) actual groups, Eq.44.21 critical path | MFS physical/simulation context separate | Flag products not assumed independent; slowest-rank regime | P38 §4; R44.7 §§3,6; R44.17 |
| MoE/expert balance | 44.5 Eq.44.22, Algorithm44.6 exact replication/packing with finite slots, cost | EPLB source has calculator, no executed benchmark claimed | Identical replicas preserve semantics; stale stats/transition limits | R44.18 named functions; R44.17 Workload Balancer |
| Multi-node communication | 44.5 Eq.44.23 MLU/RLI, RED and bounded Algorithm44.5 | MFS Figure10 measured TTFT/CCT; Figures11–15 simulation | SJF/EDF/fair sharing distinct; ideal theorem conditions retained | R44.7 §§3–6, Theorem1 |
| Failure behavior | 44.5 epoch/collective ordering and explicit infeasible/idle guards | No physical failure study attributed to MFS | NCCL abort/recreate versus request replay distinction | R44.12 error handling |
| Bursty/long-tailed traffic | [44.6](44-6-load-adaptation.md) unknown work, feedback queues/forecast consequences | FastServe ratio/recovery controls; Llumnix Gamma/power-law; Mooncake rejection | Low-load recovery equality and false early rejection | R44.6 §6.3; R44.5 §6.1; R44.3 §6 |
| Cancellation/preemption | 44.6 Eqs.44.28,44.31 bounded action/terminal protocol | vLLM default source; current transport timeout contract | Recompute cascade/resurrection; failed action-set termination | R44.9 Preemption; R44.15 waitFor |
| Migration/classes | 44.6 virtual-usage versus physical bytes, Eq.44.27 contraction | Llumnix migration microbenchmark versus serving boundary | Priority service versus headroom; g>=B counterexample | R44.5 §§4.2–4.4,6.2 |
| Goodput under SLOs | 44.6 Eq.44.26 offered/accepted denominators | Mooncake counts; MFS TTFT-only versus streaming caveat | Class-conditioned outcomes; cancellation treatment explicit | R44.3 Table2; R44.7 §6 |
| Adaptive energy and transition cost | 44.6 Eqs.44.29–44.30 ILP/power units/transition inequality | BiScale isolated windows/ramp exclusion, exact aggregation | Table feasibility not robust guarantee; average power versus energy | R44.8 §§4.3–4.6,6.1–6.2 |

## Review gates and evidence gaps

[DERIVED] Promotion beyond manuscript_draft requires resolved source locators, valid figure schemas/formulas/reading order, exact manifest identities, complete relative links, and a claim audit distinguishing source reports from original deductions. No executable or empirical evidence label is earned by passing a Markdown compiler.

[UNVERIFIED] Exact runtime commits, compatibility/fault/cancellation checks, calibrated workload predictors, and transition-inclusive comparisons remain open. Source-disclosure omissions are recorded separately in [references.md](references.md). Current papers establish useful conditional methods; they do not settle joint controller optimality, multi-tenant fairness under correlated overload, or whole-service exactly-once behavior.
