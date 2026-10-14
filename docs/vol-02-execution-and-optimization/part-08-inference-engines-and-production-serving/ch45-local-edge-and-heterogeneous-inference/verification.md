---
id: ms.verification.45
entity_type: verification
title: "Chapter 45 verification"
volume: 2
part: 8
chapter: 45
section: null
slug: verification
parent: ms.chapter.45
prev_sibling: ms.section.45.6
next_sibling: ms.references.45
children: []
prerequisites: [ms.chapter.25, ms.chapter.37, ms.chapter.40, ms.chapter.41, ms.chapter.42, ms.chapter.43]
downstream: [ms.chapter.46, ms.chapter.47, ms.chapter.48]
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [resource_accounting, heterogeneous_execution], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.llama-cpp, impl.apple-mlx-mlx-lm, impl.onnx-runtime, impl.openvino]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [ASSUMED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2500
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 45 verification

## Status and scientific question

[UNVERIFIED] This is a proposed constrained-device deployment profile, not an executed device experiment. Manuscript/source/figure checks can validate structure and inspect mathematical consistency; they cannot establish compatibility, sustained speed, quality, energy, thermal safety or privacy. No model, accelerator, phone, power meter or security test was run.

[DERIVED] The question is whether a fixed application/model/runtime configuration delivers accepted tasks across declared initial states and sustained workloads while respecting physical memory, latency, energy, thermal, offline and privacy requirements. The null engineering claim is that successful loading and a short warm token benchmark are insufficient to establish this service.

## Artifact and identity

[DERIVED] Retain model/tokenizer/template hashes, tensor types and quantization provenance, runtime/compiler/backend/driver/OS/firmware, hardware/enclosure/cooling/power source, permission model, exported shape/state domain, operator partition, physical allocation/lifetime inventory, transfer recurrence map, arrival/context/stopping policy, accepted-task definition and sensor calibration. Store raw event/trace records with every failure. Do not replace exact revisions with a latest/stable label.

[OFFICIAL-DOCUMENTATION] The immutable inspected identities are llama.cpp df18bee11e96557b07aa7b12db0976f3c7ac9165, GGML 3612c0af93f2cfc8f048295300a61187723b12ae and MLX 64ea011cb65f14d9ce2737e60db9a4ae91ed7441 (0.32.3 documentation sources). These establish source-inspection provenance. Execution at those revisions, compiler flags, kernel selection and model artifacts remain outstanding. Other official surfaces retain explicit mutable versions in [references](references.md).

## Topic-completeness and evidence audit

[DERIVED] Each row maps a required topic to its mechanism, mathematical/cost boundary, source and proposed rejection test. Static official interfaces support narrow properties only. Numerical quality and task acceptance must be held fixed before a resource improvement is attributed to placement or runtime choice.

| ID / required topic | Owner and claim/mechanism | Evidence/locator | Formulation, cost and variants | Proposed verification and present gap |
|---|---|---|---|---|
| D1 Capacity | 45.1 simultaneous physical occupancy | DERIVED; R45.1 shared arrays | Eq. 45.1; bytes incl. other apps/reserve; discrete/shared domains | Reconcile inventory against device counters and pressure failures; no device inventory |
| D2 Bandwidth | 45.1 shared CPU/GPU traffic contention | MATHEMATICALLY-DERIVED | $Q/B$ bound; concurrent aggregate interface, not summed peaks | Vary background traffic at fixed task; no achieved-bandwidth trace |
| D3 Unified memory | 45.1/45.3 removes required discrete copy, preserves reads/waits | R45.1 lines 7–44 | Eq. 45.5; shared DRAM, dependencies, driver limits | Observe CPU producer/GPU consumer completion and allocations; no executed stream check |
| D4 Thermal | 45.1 cumulative heat and equilibrium | Eq. 45.2; R45.2 §4, R45.28 §4 | Time constant/crossing domain; shared versus one-node model | Fit held-out trajectories and uncertainty; no calibration |
| D5 Energy | 45.1 cumulative whole-device budget | Eq. 45.1, 45.9 | J/run, J/accepted task; zero denominator undefined | Integrate aligned meter intervals; no measured energy |
| D6 Offline/interactive | 45.1 dependency closure and deadline | DERIVED; 45.6 threat boundary | Initialization/network/template/publication included as declared | Disconnect actual application and verify complete tasks; no offline validation |
| L1 GGML compute | 45.2 tensor graph and backend assignment | R45.5 buffer/device/scheduler | Op support, buffers, graph splitting/copies; Eq. 45.4 | Retain operator/kernel graph; no model graph captured |
| L2 GGUF artifacts | 45.2 typed metadata, offsets, extents | R45.4 File Structure | Eq. 45.3; encoded blocks/alignment, safe integer arithmetic | Reject truncated/overflow/shape-invalid fixtures; no parser execution |
| L3 Loading | 45.2 mapping, allocation, repack/upload | R45.6 create_tensor/init_mappings/load_all_data | File bytes differ from resident/device/scratch bytes | Join load events and physical ledger; no loading trace |
| L4 Quantization | 45.2 interpret actual block type, link Chapter 40 | R45.4; R45.5 | Packed computation versus expansion; scales/metadata and quality | Inspect tensor types and matched quality; no numerical run |
| L5 Backend dispatch | 45.2 support/location/compatibility choices | R45.5 scheduler 236–333 | Eq. 45.4; fallback cuts and lifetime/reset | Match runtime split/copy record to predicted cuts; no executed dispatch |
| L6 Server | 45.2 template/context/slots/output boundary | R45.7 Common params/routes | CPU processing, request limits, serialization; API resemblance conditional | Compare direct and service paths at equal semantics; no endpoint |
| L7 Bench boundary | 45.2/45.6 pp/tg/pg exclude tokenization/sampling | R45.8 Usage 79–91 | Kernel timing differs from application latency | Join benchmark and application event spans; not executed |
| A1 MLX arrays/streams | 45.3 shared allocation and dependencies | R45.1/R45.25 | Eq. 45.5 DAG/stream recurrence | Compare dependent/independent completion; no trace |
| A2 Lazy evaluation | 45.3 graph construction vs materialization | R45.24 When to Evaluate | Preparation and completed-work timing | Fix eval/synchronization boundary; no timed evaluation |
| A3 MLX-LM | 45.3 load/template/sampler/stream contract | R45.11 README | Tokenization, generation state and visibility | Preserve identities/stopping/logits transforms; no model execution |
| A4 Metal/M5 | 45.3 GPU neural matrix facilities distinct from ANE | R45.12 Table 1/footnote | First-party 4,096/128 protocol; sustained/variance absent | Pin platform/runtime and sustained rerun; no independent replication |
| A5 ExecuTorch | 45.3 export/lower/.pte and bounded domain | R45.13 Export and Lowering | Dynamic shapes, state mutation, external weights | Boundary-shape/state tests with output tolerances; no exporter |
| A6 Mobile processors | 45.3 CPU/GPU/NPU delegated subgraphs | R45.14/R45.15 Requirements | QNN paths; experimental real-iOS MLX caveats | Verify actual delegate/kernel and ordinary permissions; no device matrix |
| P1 ONNX provider | 45.4 GetCapability and provider order | R45.16 | Eq. 45.6 support predicate; fallback coverage | Export operator/type/shape/attribute matrix; no model coverage proof |
| P2 I/O binding | 45.4 retain device state/ownership | R45.17 | Repeated CPU/device copies vs device bindings | Trace per-step state transfers/lifetime; no execution |
| P3 OpenVINO | 45.4 affinity/subgraph heterogeneity | R45.18 HETERO/preview pipeline | Greedy priority not global optimum; stage memory | Inspect actual graph/affinity and preview support; no matched benchmark |
| P4 MLC-LLM | 45.4 weights/config/target-library split | R45.19 | Eq. 45.7 preparation amortization; target ABI | Pin export/config/compiler/library identity; no compiled model |
| P5 Vulkan | 45.4 backend build route vs support | R45.10 Vulkan | Operator/layout/kernel limits and boundary costs | Audit exact model/shape path; no Vulkan compatibility test |
| P6 WebGPU | 45.4 target/device buffers and ownership | R45.20 GPU tensors | Repeated upload/download, browser/runtime availability | Check buffer destruction/materialization/output location; no browser model run |
| P7 Coverage | 45.4 support is conditional and weighted | Eq. 45.6 | Count coverage differs from weighted duration/bytes | Record unsupported/fallback cases; no common five-runtime trial |
| H1 Static offload | 45.5 stationary weights, recurring activation/state cuts | R45.5/R45.6; Eq. 45.8 | Payload $ndb$; contiguous vs alternating | Trace cuts, separate startup from each step; no placement measurement |
| H2 Streaming | 45.5 recurring nonresident weight reads | R45.21 §§3–5 | Cache misses/storage/staging/pipeline overlap | Equal-model/static/stream comparison; sparse confounding retained |
| H3 mmap | 45.5 virtual/page-cache/resident distinction | R45.6 init_mappings | Cold faults, reclaim, extra repack/device copies | Record page/cache state and unique physical occupancy; no OS trace |
| H4 NUMA | 45.5 affinity/policy/history/locality | R45.27 Scope/Shared Policy | Remote link traffic; existing/file-cache page caveats | Observe page distribution and migration at fixed workers; no NUMA run |
| H5 Transfer | 45.5 critical-path cuts and conversion | Eq. 45.8; two-stage ideal schedule | $t_c-t_g>h$; overlap assumptions explicit | Timeline plus shared-resource counters; no achieved overlap |
| H6 Sparse smartphone | 45.5 cluster/cache/NPU-prefill/CPU-decode | R45.21 §§6–7.1 | Rooted phones, sparse vs dense baselines, 10 repeats | Match quality and permissions; no ordinary-sandbox replication |
| E1 Cold/warm | 45.6 initial-state vector | DERIVED | Process/page/kernel/prefix/thermal states separate | Factorial state preparation, failures retained; not performed |
| E2 Sustained | 45.6 aligned work/context/thermal trajectories | R45.9 Fig. 8; R45.2 | Stationary temperature differs from stationary service | Fixed-context and growing-history traces; no sustained run |
| E3 Battery/energy | 45.6 voltage/current/whole vs incremental | Eq. 45.9; R45.28 Table 2/Fig. 15 | mAh is charge; peripherals/display/idle boundaries | Calibrated meter and matched baseline; no battery test |
| E4 Thermal attribution | 45.6 retain clocks/control/ambient | R45.9 §5.2.3 hypothesis | Context drift vs firmware vs temperature | Matched workload/control traces; no causal intervention |
| E5 Context limits | 45.6 configured/executable/useful length | DERIVED; export domains | Cache capacity, positional/task quality and compiler domain | Boundary-length tests and truncation audit; no long-context validation |
| E6 Privacy | 45.6 threat/data-flow boundary | DERIVED | Local execution, network/storage/tools/logging distinct | Adversary-specific data-flow/permission tests; no privacy proof |
| E7 Agentic evaluation | 45.6 closed-loop conversation and separate accuracy | R45.23 Task/Metrics | Concurrency 1, pauses, 20/1,007 replay, 32K configuration | Pin actual benchmark round; call is not a final result |
| E8 Energy control | 45.1/45.6 rate/power ranking and measurement boundary | R45.28 §§4–6 | Component vs whole-task energy; control access required | Independent artifact/revision and paired measurements absent |
| E9 Pseudocode ambiguity | 45.6 printed timestamp update precedes interval | R45.28 Algorithm 2 lines 5–8 | Zero interval in printed ordering, not proven code bug | Obtain exact artifact and check intended order; unresolved |

## Obligation-to-anchor routing

[DERIVED] The 41 topic rows above inherit all 13 obligations below from their owning section. The routing table instantiates actual manuscript links for every obligation; multi-heading obligations include both anchors. Exact primary-source locators remain in each topic row and the references ledger. This is the editorial coverage map, not the proposed experiment. No shared experiment is imputed to a documentation-only topic.

| Code | Contract obligation | Owning H2 anchor(s) | Required interpretation |
|---|---|---|---|
| P | Problem and prior limitation | scope; why-this-exists | Question, baseline and evaluation axis; factual historical premises use row sources. |
| F | Formal contract | formulation | Inputs/outputs, representations, units, constraints and domains. |
| M | Full methodology | mechanism | Methodology reconstructs consequential stages and choices within the owned topic. |
| Q | Mathematical account | formulation; mechanism | Numbered book derivations are separate from source equations; assumptions/boundaries explicit. |
| A | Executable procedure | algorithm | Bounded explanatory algorithm, state/update order, invariants and failure/termination. |
| I | Implementation/execution | implementation | Operators, allocation, ownership, precision and backend path; static versus executed status. |
| C | Resource accounting | mechanism; algorithm; implementation | FLOPs, physical bytes/traffic, synchronization, latency, energy and money boundary/unknowns. |
| E | Reported experimental protocol | experimental-design | Reported experiments only; documentation-only gaps explicitly routed below. |
| O | Observations/interpretation | observations | Four-part claims/evidence/inference/unknown treatment inherits row scope. |
| S | Alternatives | siblings | Declared compatible comparison axis; canonical prerequisite links avoid duplication. |
| L | Improvements/lineage | extensions | Changed mechanism, supporting source comparison or explicit absence; chapter Lineage. |
| V | Validity/failures | failure-modes; limitations | Regime, counterexamples, symptom/detection/mitigation and open questions. |
| R | Reproducibility/closure | reproducibility; references | Immutable/mutable source identity, artifacts and claim-blocking gaps. |

| Topic IDs | Owning section | Exact obligation anchors |
|---|---|---|
| D1–D6 | [45-1](45-1-device-constraints.md) | [P 1](45-1-device-constraints.md#scope) / [P 2](45-1-device-constraints.md#why-this-exists); [F](45-1-device-constraints.md#formulation); [M](45-1-device-constraints.md#mechanism); [Q 1](45-1-device-constraints.md#formulation) / [Q 2](45-1-device-constraints.md#mechanism); [A](45-1-device-constraints.md#algorithm); [I](45-1-device-constraints.md#implementation); [C 1](45-1-device-constraints.md#mechanism) / [C 2](45-1-device-constraints.md#algorithm) / [C 3](45-1-device-constraints.md#implementation); [E](45-1-device-constraints.md#experimental-design); [O](45-1-device-constraints.md#observations); [S](45-1-device-constraints.md#siblings); [L](45-1-device-constraints.md#extensions); [V 1](45-1-device-constraints.md#failure-modes) / [V 2](45-1-device-constraints.md#limitations); [R 1](45-1-device-constraints.md#reproducibility) / [R 2](45-1-device-constraints.md#references) |
| L1–L7 | [45-2](45-2-llamacpp-stack.md) | [P 1](45-2-llamacpp-stack.md#scope) / [P 2](45-2-llamacpp-stack.md#why-this-exists); [F](45-2-llamacpp-stack.md#formulation); [M](45-2-llamacpp-stack.md#mechanism); [Q 1](45-2-llamacpp-stack.md#formulation) / [Q 2](45-2-llamacpp-stack.md#mechanism); [A](45-2-llamacpp-stack.md#algorithm); [I](45-2-llamacpp-stack.md#implementation); [C 1](45-2-llamacpp-stack.md#mechanism) / [C 2](45-2-llamacpp-stack.md#algorithm) / [C 3](45-2-llamacpp-stack.md#implementation); [E](45-2-llamacpp-stack.md#experimental-design); [O](45-2-llamacpp-stack.md#observations); [S](45-2-llamacpp-stack.md#siblings); [L](45-2-llamacpp-stack.md#extensions); [V 1](45-2-llamacpp-stack.md#failure-modes) / [V 2](45-2-llamacpp-stack.md#limitations); [R 1](45-2-llamacpp-stack.md#reproducibility) / [R 2](45-2-llamacpp-stack.md#references) |
| A1–A6 | [45-3](45-3-apple-and-mobile-execution.md) | [P 1](45-3-apple-and-mobile-execution.md#scope) / [P 2](45-3-apple-and-mobile-execution.md#why-this-exists); [F](45-3-apple-and-mobile-execution.md#formulation); [M](45-3-apple-and-mobile-execution.md#mechanism); [Q 1](45-3-apple-and-mobile-execution.md#formulation) / [Q 2](45-3-apple-and-mobile-execution.md#mechanism); [A](45-3-apple-and-mobile-execution.md#algorithm); [I](45-3-apple-and-mobile-execution.md#implementation); [C 1](45-3-apple-and-mobile-execution.md#mechanism) / [C 2](45-3-apple-and-mobile-execution.md#algorithm) / [C 3](45-3-apple-and-mobile-execution.md#implementation); [E](45-3-apple-and-mobile-execution.md#experimental-design); [O](45-3-apple-and-mobile-execution.md#observations); [S](45-3-apple-and-mobile-execution.md#siblings); [L](45-3-apple-and-mobile-execution.md#extensions); [V 1](45-3-apple-and-mobile-execution.md#failure-modes) / [V 2](45-3-apple-and-mobile-execution.md#limitations); [R 1](45-3-apple-and-mobile-execution.md#reproducibility) / [R 2](45-3-apple-and-mobile-execution.md#references) |
| P1–P7 | [45-4](45-4-portable-runtimes.md) | [P 1](45-4-portable-runtimes.md#scope) / [P 2](45-4-portable-runtimes.md#why-this-exists); [F](45-4-portable-runtimes.md#formulation); [M](45-4-portable-runtimes.md#mechanism); [Q 1](45-4-portable-runtimes.md#formulation) / [Q 2](45-4-portable-runtimes.md#mechanism); [A](45-4-portable-runtimes.md#algorithm); [I](45-4-portable-runtimes.md#implementation); [C 1](45-4-portable-runtimes.md#mechanism) / [C 2](45-4-portable-runtimes.md#algorithm) / [C 3](45-4-portable-runtimes.md#implementation); [E](45-4-portable-runtimes.md#experimental-design); [O](45-4-portable-runtimes.md#observations); [S](45-4-portable-runtimes.md#siblings); [L](45-4-portable-runtimes.md#extensions); [V 1](45-4-portable-runtimes.md#failure-modes) / [V 2](45-4-portable-runtimes.md#limitations); [R 1](45-4-portable-runtimes.md#reproducibility) / [R 2](45-4-portable-runtimes.md#references) |
| H1–H6 | [45-5](45-5-hybrid-placement.md) | [P 1](45-5-hybrid-placement.md#scope) / [P 2](45-5-hybrid-placement.md#why-this-exists); [F](45-5-hybrid-placement.md#formulation); [M](45-5-hybrid-placement.md#mechanism); [Q 1](45-5-hybrid-placement.md#formulation) / [Q 2](45-5-hybrid-placement.md#mechanism); [A](45-5-hybrid-placement.md#algorithm); [I](45-5-hybrid-placement.md#implementation); [C 1](45-5-hybrid-placement.md#mechanism) / [C 2](45-5-hybrid-placement.md#algorithm) / [C 3](45-5-hybrid-placement.md#implementation); [E](45-5-hybrid-placement.md#experimental-design); [O](45-5-hybrid-placement.md#observations); [S](45-5-hybrid-placement.md#siblings); [L](45-5-hybrid-placement.md#extensions); [V 1](45-5-hybrid-placement.md#failure-modes) / [V 2](45-5-hybrid-placement.md#limitations); [R 1](45-5-hybrid-placement.md#reproducibility) / [R 2](45-5-hybrid-placement.md#references) |
| E1–E9 | [45-6](45-6-device-evaluation.md) | [P 1](45-6-device-evaluation.md#scope) / [P 2](45-6-device-evaluation.md#why-this-exists); [F](45-6-device-evaluation.md#formulation); [M](45-6-device-evaluation.md#mechanism); [Q 1](45-6-device-evaluation.md#formulation) / [Q 2](45-6-device-evaluation.md#mechanism); [A](45-6-device-evaluation.md#algorithm); [I](45-6-device-evaluation.md#implementation); [C 1](45-6-device-evaluation.md#mechanism) / [C 2](45-6-device-evaluation.md#algorithm) / [C 3](45-6-device-evaluation.md#implementation); [E](45-6-device-evaluation.md#experimental-design); [O](45-6-device-evaluation.md#observations); [S](45-6-device-evaluation.md#siblings); [L](45-6-device-evaluation.md#extensions); [V 1](45-6-device-evaluation.md#failure-modes) / [V 2](45-6-device-evaluation.md#limitations); [R 1](45-6-device-evaluation.md#reproducibility) / [R 2](45-6-device-evaluation.md#references) |

[DERIVED] Topic-specific exceptions and gaps:

| Topic group | Applicable obligation restriction | Consequence |
|---|---|---|
| D1–D3/D5–D6 | Book feasibility identities and dependency contracts have no training dataset; calibration is required only for empirical coefficients. E is NOT-DISCLOSED as a matched device experiment. | Mathematical/contract claims retained; no measured feasibility/latency or privacy conclusion. |
| D4/E8–E9 | ThermE/EnerInfer are narrowly used control-study evidence, not a reconstruction of every proprietary runtime. Their disclosed methods/protocols and ambiguity locators remain distinct. | No claim of replicated predictor, controller, global optimality or general phone portability. |
| L1–L7 | Format/library/loader/server documentation has no model-training split. MELT is historical context, not a substitute experiment for GGUF parsing or current backend support. | E is NOT-DISCLOSED for matched current performance; O reports interfaces and absent execution; no empirical improvement claim. |
| A1–A3/A5–A6 | Shared-memory, lazy/export/delegate contracts are documentation evidence. Apple's M5 study applies only to A4, not all ExecuTorch/mobile paths. | E missing for the other contracts; no blanket backend/model/phone compatibility or speed claim. |
| P1–P7 | Provider/compilation/ownership methods are documented; no inspected matched ORT/OpenVINO/MLC/Vulkan/WebGPU experiment. | E NOT-DISCLOSED; L describes documented refinements conditionally, not measured cross-runtime superiority. |
| H1/H3–H5 | Placement/page/NUMA derivations have no training data; PowerInfer-2's protocol supports H2/H6 only under its sparse/rooted setting. | No transfer of sparse-model speedup to ordinary dense/static placement; execution/locality remains UNVERIFIED. |
| E1–E7 | Measurement definitions are book analysis. MELT/MLCommons have their own distinct boundaries; privacy has no source-supplied adversarial validation here. | No synthetic aggregation of results or security proof; proposed checks remain separate. |

[DERIVED] For documentation topics, the absence of a measured successor comparison is a limit on the improvement claim, not a waiver of mechanism/cost explanation. Every row's unresolved gap prevents reviewed status where execution or empirical generalization would be required.

## Proposed experimental design

[ASSUMED] A reviewable initial study would choose one discrete CPU/GPU host, one Apple unified-memory machine and one ordinary-permission mobile device whose runtime/model combination is explicitly supported. These are proposed platform classes, not an assertion that a selected model runs on all three. A rooted/control-enabled platform forms a separate deployment class. A failed installation/export/operator case is a coverage result.

[ASSUMED] Use a fixed task-quality suite plus controlled token workloads. Independently vary prompt length, generated-length cap and retained context; preserve joint natural-text distributions in a second phase. Include short and long sessions, fixed-context resets and growing conversations. Decode uses the book's first-token convention. Hold tokenizer/template, numerical format, sampling/stop policy and task acceptance constant whenever runtime variants are compared. A changed model or sparse retraining is an additional experimental factor.

[ASSUMED] Compare CPU-only, feasible static offload and supported portable/delegate paths; include dynamic streaming only with a documented implementation and quality-matched model. Record placement/copy events, memory liveness, storage faults and NUMA placement where available. Include a no-inference idle baseline at the same display/radio/foreground state. Do not infer invisible rail power from utilization.

[ASSUMED] Define cold states independently: new process, nonresident model pages where the OS permits controlled preparation, absent compiled kernels, absent prefix and cooled package. Record exactly which states were achieved. Warm trials retain model/kernel residency and state only as declared. Randomize or balance variant order; repeat independently prepared sessions and report run-to-run dispersion plus complete time series.

[ASSUMED] Sustained sessions should exceed both initial thermal transition and the intended use duration, subject to platform safety limits. A provisional design can require at least 30 minutes and several stable analysis windows, but these are protocol choices, not universal scientific thresholds. If stability is not reached before the declared cap, report the transient trajectory and reject the steady-state claim. Changes in ambient, fan or workload invalidate a simple equilibrium interpretation.

[ASSUMED] Measure application TTFT, token-gap distribution, completion/accepted-task latency, all physical-memory domains, temperatures/clocks, valid whole-device energy intervals and failure statuses. Preserve startup and idle periods in their declared boundaries. Report J/token alongside J/accepted task with nonzero denominators. No universal power or temperature threshold is imposed beyond the platform's documented limits and a separately declared product comfort requirement.

## Acceptance, ablations and falsification

[DERIVED] Reject a capability claim when a required operator/shape/state fails or fallback is hidden. Reject a memory model when a persistent unexplained allocation or concurrent staging term remains. Reject a cold-start claim when the relevant cache state was warm. Reject transfer-overlap attribution when matched traces show contention or conversion explains the gain. Reject a sustained-domain extrapolation outside held-out calibration and retain uncertainty rather than inventing a correction factor.

[ASSUMED] Predeclare numerical/logit/task tolerances, latency SLOs, energy boundary and uncertainty targets before runs. Numerical acceptance depends on the model/task and quantization method, so this manuscript provides no arbitrary universal threshold. Ablate provider order/I/O binding, contiguous versus alternating cuts, thread/NUMA policy and thermal-control components only where supported, keeping output quality fixed. Analyze permissions and control availability as factors.

[DERIVED] A lower component J/token does not prove lower whole-device J/accepted task. A warm throughput gain does not prove improved initial response. A disconnected successful run does not prove storage isolation. A stable temperature does not prove stable throughput. Each counterexample rejects an overbroad inference while preserving the narrower measured result.

## Coverage gaps and open research

[UNVERIFIED] Outstanding work includes immutable package/driver pins beyond the inspected sources, model-specific export/operator matrices, actual numerical/task matching, allocation/transfer traces, sustained battery/thermal measurements, ordinary-sandbox applicability and adversary-specific privacy validation. EnerInfer's printed timestamp order requires artifact clarification. First-party M5 disclosures lack sufficient revision/dispersion/sustained detail for independent reproduction here.

[DERIVED] Missing execution is distinct from unresolved science. Generalizing placement and thermal predictions across nonstationary shared-resource workloads, identifying service-relevant thermal state without privileged sensors, and selecting compact profiles that predict accepted-task quality/latency remain research questions. Settling evidence requires held-out multi-device traces with complete boundaries, failures and uncertainty, rather than merely running the proposed checks once.

## Source-search and screening record

[DERIVED] On 2026-10-14, primary-source searches included "site:arxiv.org 2026 on-device LLM inference thermal sustained heterogeneous", "site:machinelearning.apple.com/research 2025 2026 MLX inference M5" and "site:docs.pytorch.org/executorch 2026 LLM NPU GPU mobile". ThermE and EnerInfer were inspected through methods/protocol/results. Apple event/demo pages were discovery context only. The sustained-load preprint 2603.23640v1 was screened: unequal output stopping and platform-dependent power visibility prevent treating it as a uniform device-energy comparison. HybridInfer 2609.30270v1 was screened as capability-tier routing, outside this chapter's equal-model placement mechanism. HeatCache was excluded from phone evidence because its thermal setting is liquid-cooled edge servers.

## Executed manuscript checks

[DERIVED] Chapter-local figure validation checked 20 authored blocks with zero schema problems. Six sections contain the 15 normative H2 regions and mathematical bounded algorithms. These are manuscript checks only; scientific execution/measurement acceptance remains pending. No compiler CLI was run and no shared app/input/index artifact was modified by this chapter author.
