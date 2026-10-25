---
id: ms.verification.43
entity_type: verification
title: Chapter 43 verification and topic audit
volume: 2
part: 8
chapter: 43
section: null
slug: verification
parent: ms.chapter.43
prev_sibling: ms.section.43.6
next_sibling: ms.references.43
children: []
prerequisites: [ms.section.43.6]
downstream: [ms.chapter.44, ms.chapter.45, ms.chapter.46, ms.chapter.47, ms.chapter.48]
related: []
relations: []
axes: {lifecycle: [evaluation, inference, serving], mechanism: [runtime_verification], feedback_setting: [], modality: [text]}
papers: [P36, P37]
implementations: [impl.vllm, impl.sglang, impl.tensorrt-llm, impl.hugging-face-transformers, impl.onnx-runtime, impl.openvino]
benchmarks: []
datasets: []
status: {maturity: open, disputed: false}
evidence_summary: {labels_used: [ASSUMED, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2400
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 43 — Verification and topic-completeness audit

## Artifact specification

[KNOWN] The planned artifact is **a version-pinned engine comparison**. These proposed records do not claim that a comparison was executed.

| Proposed record | Required fields |
|---|---|
| candidates.json | Engine/repository/commit/release/container digest; source model/revision/hash; tokenizer/template hash; quantized artifact/config; device/topology; runtime/driver; supported/rejected/undetermined |
| resolved-inputs.jsonl | Immutable example identity; raw request; rendered template; token IDs; BOS/EOS additions; positions/masks; adapters/modal input; token cap; stop rules |
| execution-paths.csv | Model class; linear/attention/MoE/collective kernels; operand/accumulation/cache dtypes; packing/scales; graph/capture settings; backend fallback; provider partitions; buffer residency |
| decoding.json | Sampler implementation; resolved temperature/top-k/top-p/penalties; RNG algorithm/seed/draw mapping; grammar backend/schema; greedy tie policy |
| numerical-parity.jsonl | Identical prefix/operator inputs; shapes; reference/candidate outputs; max/relative errors; nonfinite counts; conditional probability discrepancy; top-two margin; tolerance/pass/fail |
| task-results.jsonl | Independent acceptance identity; generated outputs; score/evaluator/version; termination reason; prompt/output length; per-problem samples; paired difference |
| service-traces.jsonl | Offered/admitted times; client request start; first/last delivery; token-versus-chunk timing; server spans; cache/compile state; output count; status/cancel/deadline |
| resources.csv | Weights/cache/workspace/reservation/peak bytes; process count; CPU load; device utilization; transfers/collectives; warmup/compile time; measurement window |
| operations.jsonl | Worker failure; cancellation; stale epoch; overload; drain/rollback; duplicate work; resource reclamation; partial-stream terminal behavior |
| decision.md | Feasibility gates; uncertainty; Pareto-incomparable candidates; unresolved discrepancies; migration ledger/horizon; independent acceptance boundary |

[DERIVED] Artifact closure requires all these identities to join by candidate and request. A result with only a server version and aggregate tokens/s cannot identify whether a difference came from numerical representation, execution, input semantics or workload.

## Verification task

### Experiment 43.1 — Semantic and numerical engine differential

**Hypothesis.** [ASSUMED] Candidate engines preserve declared input/decoding semantics and meet preregistered numerical criteria on common prefixes before task evaluation.

**Setup.** [ASSUMED] Select one model supported by all initial candidates, pin source artifacts, and begin with the same unquantized weight representation and supported device. Pin a reference evaluator and at least vLLM/SGLang; add TensorRT-LLM only if the exact model/dtype/device tuple is supported. Unsupported candidates are explicit rejections, not removed observations.

**Independent variables.** [ASSUMED] Engine tuple, cold/warm prefix state, eager/compiled/captured paths and representative batch shapes. Change one variable at a time in diagnostic ablations.

**Controlled variables.** [ASSUMED] Source weights, exact input token IDs, positions/masks, adapters, decoding rules, hardware, reference boundary and output cap. Different quantized artifacts belong to a separate experiment.

**Dataset/workload.** [ASSUMED] Use finite fixtures spanning empty/short/long prompts, repeated prefixes, non-ASCII text, special tokens, stop strings, tie-adjacent logits and supported constraints. Common-prefix operator probes use a diagnostic set separate from final task acceptance.

**Hardware.** [ASSUMED] One common supported accelerator configuration; write device, memory, topology, driver/runtime and available workspace before executing. Equipment identity is presently unresolved.

**Metrics.** [ASSUMED] Exact input-ID/parameter parity; per-operator and logit absolute/relative error; nonfinite counts; conditional-distribution discrepancy; argmax margins; dispatched paths; termination and published-output differences.

**Baselines.** [ASSUMED] Pinned reference model loop; same decoded artifact in the reference evaluator when evaluating a deployment-specific artifact.

**Expected result.** [ASSUMED] Token/decoding identity must be exact unless a declared semantic difference is an intentional treatment. Numerical tolerances are calibrated and frozen by operator/dtype/shape before acceptance; no universal unexplained tolerance is supplied here. Unresolved failures prevent speed ranking.

**Ablation.** [ASSUMED] Toggle prefix reuse, graph mode and batching independently. Negative fixtures alter BOS handling, one position or penalty; the harness must detect them.

**Interpretation.** [DERIVED] Passing shows exercised conditional behavior under the declared tolerance. It does not establish all free-running trajectories, task quality or cross-hardware identity.

**Threats to validity.** [DERIVED] Shared faulty preprocessing, wrapper-version ambiguity, unobserved fallback and reference arithmetic differences can hide causes. Same seeds do not imply common random draws.

### Experiment 43.2 — Independent task and matched service frontier

**Hypothesis.** [ASSUMED] Numerically accepted candidates remain within a chosen task-quality tolerance and meet a declared p95 latency/goodput contract on matched workloads.

**Setup.** [ASSUMED] Freeze engine settings after Experiment 43.1 and tuning on a separate selection set. Use an independent acceptance set. Retain all quality and service failures.

**Independent variables.** [ASSUMED] Candidate tuple, offered load, prompt/output length strata and declared prefix-sharing regime; separate cold-start and warm-service experiments.

**Controlled variables.** [ASSUMED] Weights, template/input IDs, decoding, hardware budget, arrival trace, task evaluator, resource boundary and client implementation. Record actual cache/quantized kernel paths rather than assuming matching flags imply matching execution.

**Dataset/workload.** [ASSUMED] Preregister held-out reasoning, code, instruction and structured-output tasks with exact snapshots; stratify by prompt/output length. Use at least three matched arrival-trace families: low load, near-capacity and bursty overload. This is a chosen test design, not a claim about production demand.

**Hardware.** [ASSUMED] Same hardware tuple as Experiment 43.1; isolate other workloads and record clocks/power policy. Multi-device candidates form a separate fixed-budget comparison.

**Metrics.** [ASSUMED] Paired task quality, completion/format/error rates, client-visible TTFT/E2E p50/p95/p99, ITL only when token delivery is observable, TPOT, offered/admitted/completed requests, SLO goodput and memory/compilation costs. Report uncertainty at independent problem/window units.

**Baselines.** [ASSUMED] Reference task evaluator and a pinned accepted engine at the same observation boundary. Offline model calls are not used as HTTP latency baselines.

**Expected result.** [ASSUMED] Initial quality tolerance is one percentage point per declared primary stratum, with the lower bound of a paired95% interval exceeding −1 point; this threshold is a choice and must be varied for sensitivity. Service limits are application-selected before execution. Insufficient precision is undetermined, not passing.

**Ablation.** [ASSUMED] Match then vary cache warmth, graph setup and client buffering; compare open-loop traces with explicitly separate closed-loop tests.

**Interpretation.** [DERIVED] A quality-passing but SLO-failing tuple is infeasible for that contract. Better aggregate tokens/s without higher SLO goodput does not establish the desired service benefit. An observed frontier remains workload-specific.

**Threats to validity.** [DERIVED] Dependent arrivals, pooled workload quantiles, tuning on acceptance data, success-only samples, evaluator bias and unequal cold starts can invalidate conclusions. I.i.d. formulas in §43.6 are used only when their conditions hold.

### Experiment 43.3 — State lifecycle and migration contract

**Hypothesis.** [ASSUMED] Selected candidates reclaim resources safely and preserve declared client terminal behavior under cancellation, worker failure and rollback.

**Setup.** [ASSUMED] Use finite, bounded fault injection on an isolated service; inject cancellation before admission, during forward, after token commitment and during publication. Repeat with shared prefixes and active constraints.

**Independent variables.** [ASSUMED] Failure phase, cache sharing, worker loss, client disconnect, restart and migration route.

**Controlled variables.** [ASSUMED] Request identities/epochs, artifacts, input trace, retry policy, token caps and state capacity.

**Dataset/workload.** [ASSUMED] Finite mixed-length requests including branch/shared-prefix cases and stop-string boundaries.

**Hardware.** [ASSUMED] Isolated pinned deployment with explicit device completion instrumentation and accessible process/resource records.

**Metrics.** [ASSUMED] Resource ownership/reclamation, stale output rejection, duplicate work, partial stream contents, terminal/error semantics, restart/load time and migration effort/cost ledger.

**Baselines.** [ASSUMED] Fault-free run and reference contract; historical/current TensorRT workflows are separate environments, not interchangeable commands.

**Expected result.** [ASSUMED] No released resource may be read by unfinished work; no stale epoch output may be committed; each request must end in a declared terminal state within its bounded deadline. These categorical criteria are stricter than final-text similarity.

**Ablation.** [ASSUMED] Controlled negative fixtures omit an epoch check or delay a completion event in a harness model; production code is not deliberately corrupted.

**Interpretation.** [DERIVED] Passing supports exercised lifecycle transitions. It does not certify every asynchronous interleaving or failure mode. Migration break-even remains conditional on quality/service feasibility.

**Threats to validity.** [DERIVED] Instrumentation can alter timing; rare races may require systematic interleaving exploration. Repeated successful runs do not prove absence of races.

## Acceptance criteria

[ASSUMED] A candidate is eligible for comparative performance only after exact input/decoding identity or an explicitly declared difference, exercised numerical criteria and independent task acceptance. Every claimed supported path needs an executed check at a pinned revision/configuration. Missing traces, unresolved output causes or undocumented fallback produce **undetermined**, not a passing score. Source pins alone do not satisfy execution acceptance.

[ASSUMED] The study returns a feasible frontier rather than a universal winner. Operational/migration findings are reported alongside service metrics. Threshold sensitivity and the population/observation boundary must accompany the decision.

## What this edition did not do

[UNVERIFIED] No engine was installed, imported, compiled or run; no local correctness, performance, quality, fault or migration experiment occurred. Static source files were fetched/read at immutable official commits and their byte hashes retained in the ledger. This establishes only the narrow source structure stated in the manuscript. The planned artifact remains unexecuted.

## Topic-completeness audit

[KNOWN] This is an editorial coverage audit against the chapter matrix and CONTENT_CONTRACT§4.1, not an experimental result.

Obligation codes: **P** problem/prior limitation; **F** formal contract; **M** full methodology; **A** mathematical account; **X** bounded procedure; **I** implementation/execution; **R** resource accounting; **E** reported protocol; **O** observations; **S** alternatives; **L** improvement/lineage; **V** validity/failures; **C** reproducibility/closure.

[DERIVED] Every row uses its section's Scope/Why(P), Formulation(F/A), Mechanism(M/R), Algorithm(X), Implementation(I), Experimental design(E), Observations(O), Siblings(S), Extensions(L), Failure modes/Limitations(V) and Reproducibility/References(C), with topic-specific anchors below. Training-data construction is not applicable because these are inference/runtime methods. Where architecture documents disclose no controlled experiment, E/O explicitly record that absence; no benchmark of another engine substitutes for that topic.

| Required item / variant | Manuscript anchors and obligation focus | Primary key and exact locator | Unresolved gap | Review consequence |
|---|---|---|---|---|
| Frontend/API | [43.1 Mechanism](43-1-runtime-decomposition.md#mechanism), P/F/M/I/R/X/V/C | R43.1 “V1 Process Architecture”; R43.16 online/offline interfaces | API/tokenization/stream timing unexecuted | No measured overhead/reliability claim |
| Tokenizer/template | [43.1](43-1-runtime-decomposition.md#mechanism), F/M/I/V; [43.6](43-6-selection-methodology.md#mechanism), E/O | R43.5 config/tokenizer resolution; R43.29§6.1 BOS ablation | Exact model artifacts not loaded | Input identity gate remains pending |
| Request state/commit/publication | [43.1 Formulation](43-1-runtime-decomposition.md#formulation), Eq43.1, X/V | R43.1 engine roles; book state contract; R43.31step657–687 | Full cancellation interleavings unchecked | No event-safety certification |
| Scheduler/executor interface | [43.1 Algorithm](43-1-runtime-decomposition.md#algorithm), M/X/I/R; [43.4](43-4-tensorrt-llm.md#mechanism) | R43.13PyExecutor/Scheduler; R43.31step; R43.34_schedule7083 | Runtime dispatch not executed | Distinguish static interface from compatibility |
| Kernels and critical path | [43.1 Formulation](43-1-runtime-decomposition.md#formulation), Eq43.2–4, A/R | R43.2 graph processing; R43.4 backend validation; explicit DAG/pipeline model | Effective stage times unknown | Equations are conditional models |
| Cache manager/distributed workers | [43.1 Mechanism](43-1-runtime-decomposition.md#mechanism), F/M/I/R/V | R43.1 Worker/ModelRunner; R43.13ResourceManager | Device lifetime and cross-rank order unchecked | No reliability claim; Chapter 42 owns bytes |
| vLLM paged integration | [43.2 Mechanism](43-2-vllm.md#mechanism), F/M/A/X/I/R | P36§§4–5; R43.3 block pool/free queue | Current allocation execution absent | Historical study/current interface separated |
| vLLM scheduling/output update | [43.2 Algorithm](43-2-vllm.md#algorithm), X/I/V/C | R43.31core.py657–687,698–791 | No server run | Pinned static ordering only |
| vLLM prefix namespace/hash | [43.2 Formulation](43-2-vllm.md#formulation), Eq43.6, F/M/A/R/V | R43.3 hash parent/tokens/extras; serialization | Namespace completeness not locally tested | No token-only/bitwise-equivalence assumption |
| vLLM compilation/cache/guards | [43.2 Mechanism](43-2-vllm.md#mechanism), Eq43.7–8, M/A/R/V | R43.2 “Compilation Cache,” “Computation Graph Processing” | Compile/capture domain unexecuted | No latency/compatibility inference |
| vLLM model/backend integration | [43.2 Implementation](43-2-vllm.md#implementation), I/C | R43.4 generated support tables; R43.5 loading; R43.31 | Actual linear/attention/MoE paths unresolved | Record all paths before comparison |
| vLLM historical experiments | [43.2 Experimental design](43-2-vllm.md#experimental-design), E/O/L | P36§6.1, Fig13; disclosed oracle reconstruction | Not current V1 replication | Outcomes bounded to paper setup |
| SGLang structured program lineage | [43.3 Why/Extensions](43-3-sglang.md#why-this-exists), P/M/S/L | P37§§2–5 | Historical program/backend differs from current | No automatic current implementation identity |
| SGLang radix/prefix ownership | [43.3 Mechanism](43-3-sglang.md#mechanism), Eq43.9–10, F/M/A/X/R/V | P37§3, Appendix A; R43.7 sessions | Current cache safety/benefit unexecuted | Soft session does not imply history |
| Session-aware variant | [43.3 Mechanism](43-3-sglang.md#mechanism), F/I/V/C | R43.7 UnifiedRadixCache, full-prompt/no-append behavior | Retention/cancellation rates undisclosed | No durable-history guarantee |
| Structured output integration | [43.3 Formulation/Algorithm](43-3-sglang.md#formulation), Eq43.11, F/M/A/X/V | R43.6 backend/constraint specification; P37§4 historical only | Every schema/backend combination untested | Syntactic/semantic acceptance separated |
| Asynchronous scheduler/graph segments | [43.3 Mechanism](43-3-sglang.md#mechanism), Eq43.12, A/X/I/R | R43.10graph boundaries; R43.33event_loop_overlap1975–2048 | No all-path event proof | Source barrier is narrow evidence |
| SGLang determinism variant | [43.3 Mechanism](43-3-sglang.md#mechanism), I/E/O/V/C | R43.8 backend table | Modes not executed | No cross-engine/hardware bitwise claim |
| SGLang DP/DPA/EP/router | [43.3 Mechanism](43-3-sglang.md#mechanism), F/M/I/R/S/V | R43.9 “How DPA Works,” “Activation Logic,” SMG | Collective/capacity behavior unmeasured | No near-linear scaling inference |
| SGLang plugin/model interface | [43.3 Implementation](43-3-sglang.md#implementation), I/C/V | R43.30entrypoint/ownership; R43.33run_batch4490 | Plugin compatibility unchecked | CLI compatibility is insufficient |
| SGLang source experiments | [43.3 Experimental design/Observations](43-3-sglang.md#experimental-design), E/O/L | P37§6.1–6.2/Appendix C; R43.11runtime/performance/reproduction | Independent quality/tail evidence absent | Historical maxima/current11% bounded separately |
| Current TensorRT-LLM backend | [43.4 Scope/Mechanism](43-4-tensorrt-llm.md#scope), P/F/M/I/C | R43.14-15 development removal docs; R43.35-36 tagged/development source conflict | Runtime release not installed | Executable revision explicit; first released removal version unresolved |
| PyExecutor/resources | [43.4 Mechanism/Algorithm](43-4-tensorrt-llm.md#mechanism), Eq43.14, M/X/I/R/V | R43.13components; R43.34_schedule7083/forward8254/resource calls | Doc/source revisions differ; execution absent | No automatic compatibility join |
| Optimized kernels/fusion/precision | [43.4 Formulation/Mechanism](43-4-tensorrt-llm.md#formulation), Eq43.13/15, A/I/R/V | R43.18precision/optimization; explicit book triangle/cost derivations | Actual operator parity unknown | Separate artifact and execution deviations |
| Distributed optimized execution | [43.4 Mechanism](43-4-tensorrt-llm.md#mechanism), Eq43.16, F/M/R/S | R43.19Offline Load Balancer | Topology/bandwidth/redundancy budget unmeasured | No free-replication or hidden-overlap claim |
| Serving integration | [43.4 Implementation](43-4-tensorrt-llm.md#implementation), I/V/C | R43.12Triton/Dynamo; R43.16LLM/trtllm-serve | Protocol timing/failure equivalence untested | Offline/online boundaries remain distinct |
| Explicit legacy TRT workflow | [43.4 Why/Failure modes](43-4-tensorrt-llm.md#why-this-exists), P/S/L/V | R43.15removed commands; R43.17v0.11build language | Historical environment not reconstructed | No old flag transplanted into current API |
| TensorRT-LLM reported performance | [43.4 Experimental design/Observations](43-4-tensorrt-llm.md#experimental-design), E/O/L | R43.18eight B200/concurrency 1/lengths/precision/67→253→368 | Full quality/uncertainty not disclosed | Combined interventions, no pure-kernel rank |
| ONNX capability/partition | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), Eq43.17, F/M/A/X/I/R | R43.20GetCapability/partition/boundary representation | Target graph not exported/run | Feasible capability is not generation closure |
| ONNX optimizations/I/O | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), Eq43.18, M/I/R/V | R43.21basic/extended/layout; R43.22BindInput/Output/Run | Actual fallback/copy trace missing | No claimed acceleration |
| OpenVINO HETERO | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), F/M/A/R/V | R43.23query_model/manual/greedy/topology warning | No target assignment/latency | Graph-cut example is analytical |
| OpenVINO GenAI | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), F/M/I/S/V | R43.24LLMPipeline/text generation/streamers | Conversion/generation behavior unexecuted | Base runtime not equated to pipeline |
| MLC compile/library | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), F/M/X/I/R/C | R43.25target outputs/WebGPU limits | No library compiled | Library/weights/config identity required |
| MLC serving modes | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), I/R/V | R43.26server/model-lib/modes/overrides/JIT | Actual inferred capacity unavailable | Mode presets not performance guarantees |
| Vendor provider routes | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), F/I/S/V | R43.32provider summary/priority API | Model-specific coverage not verified | Provider listing only a retrieval route |
| Historical TGI | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), P/I/S/L/V/C | R43.27archive banner2026-03-21/maintenance/README | Private/current forks outside scope | Historical/migration case only |
| Historical MII | [43.5 Mechanism](43-5-other-deployment-routes.md#mechanism), P/I/S/L | R43.28Key Technologies/MII Legacy | Controlled2026protocol not disclosed | No README multiplier adopted |
| Other-route experimental boundary | [43.5 Experimental design/Observations](43-5-other-deployment-routes.md#experimental-design), E/O | R43.20–28architecture/usage sources | No same-model controlled study in inspected pages | Explicit absence; no substituted evidence |
| Model/dtype/hardware feasibility | [43.6 Formulation](43-6-selection-methodology.md#formulation), Eq43.19, P/F/M/X/I | Engine-specific support sources R43.4/9/14/20/32 | Deployment tuple unresolved | Unsupported/undetermined retained |
| Correctness: inputs/operators/tasks | [43.6 Mechanism](43-6-selection-methodology.md#mechanism), margin/ Eq43.20, A/M/V | R43.29§§4–6/AppendicesA–D | Current releases not tested | Same seed/weight name not sufficient |
| p95/client stream boundary | [43.6 Mechanism](43-6-selection-methodology.md#mechanism), Eq43.21, F/A/R/V | Shared notation§2.8; book binomial derivation | Dependent trace uncertainty unresolved | No i.i.d.interval without conditions |
| Goodput and offered-load accounting | [43.6 Mechanism](43-6-selection-methodology.md#mechanism), F/M/R/E/O | Shared metric vocabulary; explicit proposal | Service trace unexecuted | No success-only performance frontier |
| Operations/migration cost | [43.6 Mechanism](43-6-selection-methodology.md#mechanism), Eq43.22, M/A/R/X/V/C | R43.15migration boundary; explicit cost model | Team effort/failure behavior unknown | Cost break-even conditional on feasibility |
| Current backend-reproducibility study | [43.6 Experimental design/Observations](43-6-selection-methodology.md#experimental-design), E/O/L | R43.29§4/Table 1/§6/Appendix A | Preprint, historical versions, no book replication | Raw spread not pure numerical effect |

## Research questions and evidence needed

[DERIVED] **Trajectory stability.** Which common-prefix discrepancies predict task changes over long generated histories? A useful answer must connect controlled perturbations, argmax margins and conditional-law differences to independent task outcomes across lengths, including rare failures; early token disagreement alone does not settle quality.

[DERIVED] **Joint dispatch and capacity optimization.** Can the fastest isolated attention/MoE/graph path lower service goodput by consuming workspace or constraining compatible batch shapes? Evidence requires fixed artifacts/hardware, actual dispatch traces and capacity-qualified client metrics, with kernel and resource interventions separately ablated.

[DERIVED] **Nonstationary prefix routing.** When does local cached state justify a more congested replica? Evidence requires matched arrivals and branch structure, measured state movement/recomputation and deadline-qualified service outcomes. Cache-hit ratio alone is insufficient.

[DERIVED] **Asynchronous correctness.** Which executable invariants or systematic interleaving checks can scale across graph capture, speculation, cancellation and distributed workers? Evidence requires explicit event/resource models and counterexample search, then targeted execution at immutable revisions. Static presence of a barrier is not a proof of global safety.

## Evidence gaps and review consequence

[UNVERIFIED] All proposed comparison artifacts, runtime compatibility, numerical parity, task acceptance, tail performance and recovery remain pending. The three immutable source inspections are useful implementation anchors but do not close these gaps. [NOT-DISCLOSED] Architecture documents omit controlled cross-route experiments; selected first-party performance reports omit complete quality/uncertainty and isolating ablations. The chapter is a manuscript draft with bounded scientific claims, not a reviewed empirical reference for a deployed tuple.
