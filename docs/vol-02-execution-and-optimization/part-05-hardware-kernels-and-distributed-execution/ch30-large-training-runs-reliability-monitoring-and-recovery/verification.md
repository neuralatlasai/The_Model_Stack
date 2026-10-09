---
id: "ms.verification.30"
entity_type: "verification"
title: "Chapter 30 verification"
short_title: "Chapter 30 verification"
volume: 2
part: 5
chapter: 30
section: null
slug: "verification"
parent: "ms.chapter.30"
prev_sibling: null
next_sibling: null
children: []
prerequisites: ["ms.chapter.12", "ms.chapter.19", "ms.chapter.20", "ms.chapter.21", "ms.chapter.25", "ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29"]
downstream: ["ms.chapter.31", "ms.chapter.36", "ms.chapter.44"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "continued_training"], "mechanism": ["distributed_training", "fault_tolerance", "checkpointing"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.torchtitan", "impl.megatron-lm", "impl.nvidia-megatron-core"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1400
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter 30 — Verification protocol and completeness audit

[DERIVED] This document specifies **a training runbook and fault-injection report**, the artifact required by the chapter plan. Every experiment below is a book-authored proposal. [UNVERIFIED] No training, fault injection, source reproduction or operational cost experiment was executed for this edition. Published protocols and actual findings remain in each section's Experimental design and Observations headings.

## Artifact specification

[DERIVED] The artifact consists of the following records. Paths are proposed outputs of a future experiment, not files claimed to exist in this manuscript. All byte digests bind non-secret immutable artifacts. Include schema versions and explicit nulls for unavailable fields.

| File/table | Required fields |
|---|---|
| `runbook.yaml` | experiment digest; model/tokenizer/objective/data/optimizer identities; code/dependency/container/driver/runtime/kernel pins; numerical and reduction policy; seeds; global loss denominator; batch/accumulation; phase deadlines; exact admission predicates |
| `rank-map.json` | generation; logical shard coordinates; physical endpoint; DP/TP/PP/CP/EP membership; unique and replica state owners; rack/node failure domains; spare reservation; capability/health predicates |
| `capacity.csv` | state family; dtype; unique/replica shard factor; lifetime intervals; device/host/pinned/NVMe bytes; workspace; allocator reserved/allocated peaks; producer/drain rates; outstanding-byte bounds; violated predicate |
| `checkpoint-manifests.jsonl` | identity/generation/logical update; schema; immutable shard keys; coordinate coverage; digests/sizes; optimizer/RNG/data/scheduler state inventory; compression/error contract; base/delta dependencies; durable publication evidence; valid failure domains |
| `exposures.jsonl` | canonical exposure ID; sample/token IDs; epoch/repetition identity; mask/valid-token count; packing leftovers; sampler/RNG cursor; attempted/accepted/rejected/rolled-back update; replay predecessor |
| `telemetry.jsonl` | generation/step/rank/role; schema/clock/stream; ordered stages/residual; arithmetic count convention; loss numerator/denominator; unique gradient stats; nonfinite counts; collective sequence/message/transport; queue/drop/gather quality; observer resource cost |
| `incidents.csv` | actual versus injected provenance; fault class/site/time/distribution; affected ranks; initial symptom; alternative causes; detector threshold/false alarms; fencing/containment decision; selected version; repair qualification; each recovery phase; unresolved evidence |
| `comparisons.csv` | baseline and resumed branch; full state-family digests; exact exposure/counter differences; predeclared tolerance/bitwise level; per-transition discrepancies; failed attempts; complete step-time tails; acceptance result |
| `cost-ledger.csv` | allocation intervals and spares; device-hours; retained/executed tokens; discarded/replayed work; save/recovery/storage/transfer service; disclosed or assumed unit prices; overhead-model residuals |
| `report.md` | hypotheses; disclosed environment; experimental groups; all outcomes and failures; uncertainty unit; causal conclusion level; rejected claims; source/version provenance; limitations and follow-up tests |

[DERIVED] State families include parameter tensors, master weights, optimizer moments and counters, scalar/gradient scaling state, learning-rate schedule, dataset-mixture/sampler cursor, packing residue and all relevant RNG streams. Mid-accumulation snapshots additionally require partial gradients and the accumulation index; otherwise that capture mode is unsupported. Directory names, a global step scalar or a successful model load do not substitute for this inventory.

## Common proposed setup

[ASSUMED] Use a fully specified decoder configuration:12 layers, hidden 768,12 attention heads, vocabulary 32768, context 1024, tied input/output weights and documented normalization/positional policy. Resolve its exact parameter count from the implementation's tensor inventory rather than guessing it. Generate an immutable synthetic corpus of 10000 sequences from a versioned deterministic generator keyed by sample ID and seed; fix masks, order and batch boundaries. Its purpose is state/replay testing, not language-quality evaluation. Retain256 fixed diagnostic sequences separately. Freeze the generator digest and token artifact digests before any branch starts.

[ASSUMED] Allocate four identical accelerators across two nodes, two per node, with enough verified memory for the declared reference model. Use one recorded hardware model, fixed transport and immutable software image. Strict mode uses deterministic FP32 operations supported by that environment and fixed reduction/layout; if strict determinism is unavailable, record that failure and evaluate a separately declared tolerance mode. BF16/FP16 and dynamic scaling are independent groups, not assumed equivalent to FP32. Select a pinned TorchTitan or Megatron implementation adapter only after confirming its full state schema. No compatibility is inferred solely from the documentation read for this chapter.

[ASSUMED] Run300 optimizer updates with five warmup updates excluded only from timing, never from correctness records. Use seeds0–4 as independent paired branch units. Save at completed optimizer boundaries; fork interrupted and uninterrupted branches from the same immutable initial state and input ledger. Capture full timing tails rather than trimming slow steps. For statistical timing uncertainty, resample paired runs or complete run blocks, not dependent individual steps. Resource constraints can require smaller shapes, but every change must define a new recorded experimental group.

## Verification task

### Experiment 30.1 — Fenced launch and worker-loss recovery

| Field | Proposed protocol |
|---|---|
| Hypothesis | A worker can be lost and replaced without duplicate commits or omitted full-state obligations. |
| Setup | Common setup; fork uninterrupted, interrupted and deliberate stale-writer branches at update100. |
| Independent variables | Kill before capture, during shard write, after publication and during update; stale generation retained versus forcibly retired. |
| Controlled variables | Model/data/dependencies, logical batch, topology, numerical policy, seed and checkpoint interval. |
| Dataset/workload | Immutable synthetic corpus and canonical exposure ledger defined above. |
| Hardware | Four fixed accelerators/two nodes; node-loss group removes both local workers. |
| Metrics | Commit identity uniqueness; full state-family equality; exact exposure/scheduler counters; phase deadlines; retained throughput. |
| Baselines | Uninterrupted branch; model-only restore as a deliberately insufficient negative control. |
| Expected result | Qualified restore passes its declared equivalence; obsolete writes and incomplete state are rejected. This is a hypothesis, not an observed outcome. |
| Ablation | Remove generation check, optimizer state, data cursor or scheduler one at a time. |
| Interpretation | Passing isolates the tested environment and failure phases; a successful loop without state agreement rejects the central recovery claim. |
| Threats to validity | Synthetic inputs, determinism limitations, correlated failure and real controller partitions may differ from the test. |

### Experiment 30.2 — Memory lifetimes and legal offload

| Field | Proposed protocol |
|---|---|
| Hypothesis | A lifetime-valid policy respects device/host capacity and its stated update-parity contract. |
| Setup | Common model; profile actual tensor lifetimes, workspaces and allocator counters; establish no-offload reference. |
| Independent variables | Recompute segment length; selective save set; optimizer-shard degree; CPU/activation offload; bounded staging depth; dynamic sequence shapes. |
| Controlled variables | Update input, optimizer, numerical policy, software, topology and transfer-stream dependency graph. |
| Dataset/workload | Fixed batches plus recorded short/long-shape alternation; no hidden input reordering. |
| Hardware | Same accelerator/node allocation; record host RAM/pinned/NVMe/fabric capacities. |
| Metrics | Allocated/reserved peaks; exposed D2H/H2D time; CPU work; staging bytes; step tails; full update parity. |
| Baselines | No recomputation/offload; uniform-chain analytical bound only as a clearly scoped model. |
| Expected result | Every admitted policy remains within budgets; measured deviations from the surrogate are recorded, not fitted away. |
| Ablation | Remove a stream wait, exceed staging bound, or omit RNG restoration during recomputation as negative controls. |
| Interpretation | Memory savings with changed updates reject exact-mode correctness; planner speed and GPU training speed remain separate metrics. |
| Threats to validity | Shape-dependent kernel workspaces, caching, allocator history and background I/O can confound a short run. |

### Experiment 30.3 — Checkpoint publication, integrity and retention

| Field | Proposed protocol |
|---|---|
| Hypothesis | No partial/mixed-version or dependency-broken checkpoint is eligible. |
| Setup | Save immutable full-state shards; inject interruption at each capture/write/manifest/publication/reclamation boundary. |
| Independent variables | Missing shard, stale shard, byte corruption, false marker, unavailable base, backend write delay and model-only export. |
| Controlled variables | Source update, shard schema, expected digests, coordinate map, storage semantics and retention rule. |
| Dataset/workload | Same training state; synthetic storage faults and delayed acknowledgments explicitly labeled. |
| Hardware | Same nodes plus declared backend; power-loss durability requires a separately authorized real backend test. |
| Metrics | Eligible-set decisions; dependency closure; content/shape/dtype/state inventory; rollback version; storage/drain cost. |
| Baselines | Complete checkpoint; metadata-only discovery negative control. |
| Expected result | Every manipulated incomplete/invalid version is rejected; retained valid fallback reconstructs. |
| Ablation | Disable content validation, base retention or consistent capture separately. |
| Interpretation | Acceptance of one invalid state falsifies eligibility implementation; successful file reads alone are insufficient. |
| Threats to validity | Emulated faults do not establish physical power-loss persistence or every object-store consistency behavior. |

### Experiment 30.4 — Fault classification and silent-error containment

| Field | Proposed protocol |
|---|---|
| Hypothesis | Declared detectors contain tested corruption before commit while reporting missed events and clean alarms. |
| Setup | Record clean paired runs; inject finite and nonfinite errors at explicitly named tensor/operator sites before update. |
| Independent variables | Device/process loss; collective omission/hang; rank-local compute delay; link/storage delay; finite exponent/mantissa corruption; numerical instability. |
| Controlled variables | Fault schedule, randomized site distribution, seed, numerical policy, model/data and detector thresholds. |
| Dataset/workload | Same synthetic update sequence; injection rate is a stress-test parameter, never an assumed production rate. |
| Hardware | Fixed two-node system; device-damage claims are out of scope for software injection. |
| Metrics | Event/step precision and recall; clean false-alarm counts and uncertainty; global reject agreement; recovery latency; state drift; cost. |
| Baselines | Clean, injected/unprotected, injected/protected; replay with and without repeated injection. |
| Expected result | Coverage and failures are measured under the stated distribution; rank-local skipping or false global agreement rejects containment. |
| Ablation | Finite-only check; summary detector alone; redundant compute alone; shared versus independent execution path. |
| Interpretation | A missed finite error narrows coverage rather than being omitted; detector calibration is separate from deployment evaluation. |
| Threats to validity | Software bit flips do not reproduce all gate-level, persistent, common-mode or correlated errors. |

### Experiment 30.5 — Observer cost, missingness and diagnostic evidence

| Field | Proposed protocol |
|---|---|
| Hypothesis | Bounded observation preserves training behavior and marks incomplete windows without unsupported causal labels. |
| Setup | Pair logger-off/logger-on runs; collect ordered stages and selected traces; randomize order when feasible. |
| Independent variables | Sampling fraction; queue bound; export sink stall; missing rank; wrong generation; role heterogeneity; upstream delay. |
| Controlled variables | Workload, allocation, clock/stage schema, logical steps and identical injection schedule. |
| Dataset/workload | Common setup; targeted host/device waits labeled as synthetic interventions. |
| Hardware | Same nodes; record observer CPU/RAM/pinned/device/fabric budget separately. |
| Metrics | Stage closure; correct retained-token denominator; rank coverage; queue high-water/drops; observer overhead/tails; candidate versus confirmed-cause output. |
| Baselines | Observer off; per-stage maximum/average; bounded selected-window trace. |
| Expected result | The queue remains within its byte bound; stalled telemetry cannot block training beyond its declared path/deadline; incomplete windows downgrade. |
| Ablation | Remove bounded queue, role grouping, residual stage or identity check one at a time. |
| Interpretation | Accounting equality supports accounting only; causal repair claims require matching dependency/intervention evidence. |
| Threats to validity | Short windows can miss long-run cardinality growth, rare gather failures or large-cluster topology effects. |

### Experiment 30.6 — Replay, elasticity and resource cost

| Field | Proposed protocol |
|---|---|
| Hypothesis | Eligible recovery modes preserve the declared equivalence level and disclose their complete resource boundary. |
| Setup | Restore full state at known checkpoint ages; compare the next20updates and full300update trajectory with paired reference. |
| Independent variables | Checkpoint age; local/peer/durable source; qualified transient repair;4-to2-to4 rank layout; numerical policy; schema conversion. |
| Controlled variables | Logical global batch, exposure order, scheduler/optimizer counters and immutable artifacts. |
| Dataset/workload | Common deterministic corpus; stateless sample-keyed randomness only if every operator supports it. |
| Hardware | Same two nodes; count reserved/idle spare capacity; permanently lost state must use surviving qualified copies. |
| Metrics | Full-state equality/tolerance; exact data coverage; handle/reference audit; phase times; allocated device-hours; retained/executed exposures; cost-model residuals. |
| Baselines | Durable cold restore; uninterrupted; unsupported elastic or mid-update repair negative control. |
| Expected result | Unsupported changes are rejected or explicitly forked; qualified modes pass predeclared gates; all idle/replayed resources remain counted. |
| Ablation | Omit data reassignment, optimizer-coordinate mapping, RNG mapping, cached-reference replacement or spare allocation cost. |
| Interpretation | A parameter-only match does not establish full continuation; failure of topology-independent randomness rejects bitwise elastic replay. |
| Threats to validity | Slow-test-fabric gains may not transfer; event rates may be nonstationary; fixed seeds and limited horizons cannot prove all-future equality. |

## Acceptance criteria

[DERIVED] **Categorical correctness:** zero accepted incomplete/mixed-identity checkpoints; zero obsolete-generation commits; zero missing/duplicated canonical exposures; exact restored state-family/schema/coordinate agreement; exact optimizer/scheduler counters. In strict mode require byte equality of canonical tensors at restore and for the next20updates under the same deterministic execution contract. If strict mode is unavailable or fails, report that fact; do not relabel it as success in a weaker mode.

[ASSUMED] **Separately declared tolerance mode:** FP32 tensor comparisons use absolute tolerance1e-6 plus relative tolerance1e-5; BF16 groups use separately preregistered, justified tensor/metric bounds before inspecting treatment outcomes. The FP32 numbers are proposed engineering gates, not universal numerical guarantees. Every state family and horizon needs a stated comparison; loss alone is insufficient. Revisit a tolerance only as a new experiment, with the original failure retained.

[DERIVED] **Systems bounds:** queue bytes must never exceed the declared budget; every phase terminates or fails within its recorded deadline; no incomplete telemetry window receives a strong distributed cause label. Report all missed injections and clean alarms, including denominator and confidence interval. Timing/resource acceptance uses paired complete-run summaries and full tails. No universal overhead or detector target is fabricated in advance of an operational requirement; the runbook must declare its numeric service objective before execution.

## What this edition did not do

[UNVERIFIED] This edition did not allocate training hardware, run these experiments, reproduce source results, test physical power-loss durability, validate real gate-level faults, measure production prevalence, or establish framework compatibility. Its figures and sliders evaluate stated analytical models. The present validation is editorial/schema/mathematical checking of manuscript artifacts, not scientific or operational execution.

## Topic-completeness audit

[DERIVED] Obligation keys map to CONTENT_CONTRACT §4.1: **A** objective/boundary; **B** symbols/math/premises; **C** full methodology; **D** bounded algorithm/invariants; **E** resource/implementation boundary; **F** actual-source protocol; **G** four-layer observations; **H** failure/detection/mitigation; **I** sibling differential; **J** documented improvements; **K** limitations/falsification; **L** reproducibility/artifacts; **M** closure/evidence gaps. A–M apply to every listed concept, with the owning section's exact Scope, Formulation, Mechanism, Algorithm, Implementation, Experimental design, Observations, Failure modes, Siblings, Extensions, Limitations and Reproducibility anchors supplying the corresponding treatment. The anchors below locate the concept-specific center; algorithms and equations supply explicit shared state transitions rather than unrelated name lists.

| Plan concept or substantive variant | Manuscript anchor | Applicable obligations | Primary key and exact locator | Unresolved gap | Review consequence |
|---|---|---|---|---|---|
| Launch/admission and generation fencing | [30.1 Algorithm](30-1-training-orchestration.md#algorithm), Eq30.4 | A–M | R30.1 §4/6.1; R30.3 full config README | Controller-partition and stale-sink tests unexecuted | Draft; no implemented fencing guarantee |
| Placement and failure domains | [30.1 Mechanism](30-1-training-orchestration.md#mechanism) | A–M | R30.1 §4.1; book-derived mapping predicates | No isolated placement ablation | Draft; topology-specific test required |
| Configuration validation/dependency pins/identity | [30.1 Formulation](30-1-training-orchestration.md#formulation), Eq30.1–2 | A–M | R30.2 release; R30.3 --module/--config/NGPU | Installed closure not resolved | No compatibility claim |
| Quotas, staging stability and bounded reservations | [30.1 Mechanism](30-1-training-orchestration.md#mechanism), Eq30.2 | A–M | R30.12 bounded-stage release; derived byte conservation | Quota/backpressure experiment absent | No measured safe capacity |
| Activation recomputation/uniform chain | [30.2 Formulation](30-2-memory-management.md#formulation), Eq30.5–6 | A–M | R30.4 §3; foundational chain derivation | Nonuniform graph differs from surrogate | Scoped bound only |
| Selective checkpoint/knapsack planner | [30.2 Mechanism](30-2-memory-management.md#mechanism), Eq30.7 | A–M | R30.4 Algorithm1/§4 | Candidate dependencies violate independent-item assumptions | No global planner optimality claim |
| Optimizer sharding/state families | [30.2 Mechanism](30-2-memory-management.md#mechanism), Eq30.9 | A–M | R30.5 §3.2; R30.11 memory release | Actual allocator/replica factors unmeasured | Inventory required |
| Activation/optimizer CPU or NVMe offload | [30.2 Mechanism](30-2-memory-management.md#mechanism), Eq30.8–10 | A–M | R30.5 §3.2–3.5/Appendices C–G | Restricted final solve, no update-parity execution | No unrestricted optimality/compatibility claim |
| Fragmentation, reserved memory and dynamic lifetimes | [30.2 Formulation](30-2-memory-management.md#formulation), Eq30.5 | A–M | Derived live allocation; R30.11 Memory | No isolated source allocator-fragmentation study | Source experiment not applicable to derived bound; proposed stress test required |
| Sharded full-state capture | [30.3 Formulation](30-3-checkpoint-design.md#formulation), Eq30.11 | A–M | R30.14 guide; R30.15 state registration | RNG/application data audit incomplete | No complete source-manager guarantee |
| Atomic publication/integrity/consistent cut | [30.3 Algorithm](30-3-checkpoint-design.md#algorithm), Eq30.12/16 | A–M | R30.6 §3; R30.15 _find_load_step; derived protocol | Backend durability not tested | Metadata presence alone rejected |
| Optimizer/RNG/data/scheduler and mid-accumulation | [30.3 Mechanism](30-3-checkpoint-design.md#mechanism) | A–M | R30.14 model-only/exclusions; R30.15 registered states | Extended capture unsupported unless implemented | Reject incomplete continuation |
| Compression/differential numerical contract | [30.3 Mechanism](30-3-checkpoint-design.md#mechanism), Eq30.13 | A–M | R30.6 §3.2–3.3/§5.3 | Lipschitz bound premise not calibrated | No bitwise inference |
| Format conversion and model-only export | [30.3 Implementation](30-3-checkpoint-design.md#implementation) | A–M | R30.14 model-only/export; R30.12 migration | Cross-framework round trip absent | Converter must pass separate gate |
| Retention and base/delta dependency closure | [30.3 Mechanism](30-3-checkpoint-design.md#mechanism), Eq30.15 | A–M | R30.6 §3.4/Exp9 | Backend reclamation fault tests absent | No durability certification |
| Device/node loss | [30.4 Mechanism](30-4-failure-taxonomy.md#mechanism) | A–M | R30.1 §6.1; R30.6 Exp4; R30.7 §V-C | Correlated domains not measured here | Mode conditional on surviving copies |
| Collective hang, control failure and sequence mismatch | [30.4 Algorithm](30-4-failure-taxonomy.md#algorithm), Eq30.20 | A–M | R30.13 §III-C; R30.11 Known Issues | No generic hang-root-cause proof | Preserve hypotheses and bounded fallback |
| Stragglers versus waiting victims | [30.4 Mechanism](30-4-failure-taxonomy.md#mechanism) | A–M | R30.18 §6/9; R30.19 §3–4 | Summary ambiguity | Router conclusion only until confirmation |
| Network and storage faults | [30.4 Mechanism](30-4-failure-taxonomy.md#mechanism) | A–M | R30.18 §9.2; R30.6 §5.2 | Real rate/transport extrapolation absent | No universal event rate |
| Numerical divergence/nonfinite states | [30.4 Formulation](30-4-failure-taxonomy.md#formulation), Eq30.18–19 | A–M | R30.11 Known Issues; R30.8 §VI | Threshold and kernel validity unexecuted | Distinguish model/kernel/transport cause |
| Finite SDC/instruction versus gate patterns | [30.4 Experimental design](30-4-failure-taxonomy.md#experimental-design) | A–M | R30.8 §IV/VII; R30.9 §3/5; R30.10 §IV–V | Injection distributions do not establish prevalence | Scope detector to declared faults |
| Rare-event precision and global rejection | [30.4 Formulation](30-4-failure-taxonomy.md#formulation), Eq30.17–18 | A–M | Derived Bayes/global-consensus equations; R30.9 Appendix A/Table5 | Prevalence and independent calibration absent | No numerical PPV claim for deployment |
| Tokens/sec and retained versus executed exposures | [30.5 Mechanism](30-5-observability.md#mechanism), Eq30.22 | A–M | Derived ledger; R30.13 §IV goodput protocol | No own throughput measurement | Counters need canonical identities |
| Step decomposition/overlap/frontier accounting | [30.5 Mechanism](30-5-observability.md#mechanism), Eq30.23 | A–M | R30.19 §3–4/Appendix D; R30.18 §4/6 | Coarse data not causally identifiable | Exact accounting only under closure |
| MFU/HFU/arithmetic and peak conventions | [30.5 Formulation](30-5-observability.md#formulation), Eq30.21 | A–M | Derived arithmetic identity; source testbed precision records | No hardware-counter calibration | Estimated HFU named explicitly |
| Loss/gradient statistics/unique ownership | [30.5 Mechanism](30-5-observability.md#mechanism), Eq30.24–25 | A–M | R30.8 §VI; R30.9 §4/Appendix A | Distributed summary parity untested | No detector transfer assertion |
| Network health/role-aware metrics | [30.5 Implementation](30-5-observability.md#implementation) | A–M | R30.18 §6.1–6.2/§9.2 | Hardware root cause requires confirmation | Do not blame longest waiting rank |
| Observer backpressure/restart overhead | [30.5 Algorithm](30-5-observability.md#algorithm), Eq30.26 | A–M | R30.16 handlers; R30.18 Appendix A; R30.19 §5/6.4 | Own overhead/long-run gather failures absent | Bound resources and downgrade missing data |
| Checkpoint selection with holes | [30.6 Formulation](30-6-recovery-and-reproducibility.md#formulation), Eq30.27 | A–M | R30.6 §3.3–3.4; derived set counterexample | Continuous recoverability premise may fail | Select intersection, not min-latest without premise |
| Replay and exact/tolerance/statistical levels | [30.6 Mechanism](30-6-recovery-and-reproducibility.md#mechanism) | A–M | R30.7 §V-C; R30.13 §IV-G; derived complete-state contract | Full own audit not executed | Parameter-only check insufficient |
| Elastic membership and changed global batch | [30.6 Mechanism](30-6-recovery-and-reproducibility.md#mechanism) | A–M | R30.1 §4 cohort semantics; R30.3 world-size convention | General input/RNG topology independence absent | Reject exact elastic claim unless mapped |
| Altered parallelism/format coordinate coverage | [30.6 Mechanism](30-6-recovery-and-reproducibility.md#mechanism), Eq30.29 | A–M | R30.14 resharding docs; R30.12 migration | Converter and tied/optimizer mapping unexecuted | Separate equivalence gate |
| Qualified communicator repair | [30.6 Implementation](30-6-recovery-and-reproducibility.md#implementation), Eq30.31 | A–M | R30.13 §III/VI | FSDP2/DTensor not evaluated adapter | No generic healthy-state assumption |
| Incident analysis and falsifiable follow-up | [30.6 Failure modes](30-6-recovery-and-reproducibility.md#failure-modes) | A–M | R30.18 §9; derived incident ledger | Post-repair confounding | Preserve unresolved cause |
| Lost-work/interval/resource and dollar cost | [30.6 Mechanism](30-6-recovery-and-reproducibility.md#mechanism), Eq30.28/30 | A–M | R30.7 §VII modeled events; foundational approximation | Event rates/prices unmeasured | Scenario model only; no invented invoice |

[DERIVED] No plan concept is omitted. A source lacking an isolated experiment is marked as a gap rather than being represented by the book's proposed test. Empirical learning-quality claims are not applicable to the synthetic verification workload: its objective is execution-state consistency, and that restriction prevents the artifact from being used as a language-quality benchmark. “A–M covered” records editorial treatment, not successful execution or external review.
