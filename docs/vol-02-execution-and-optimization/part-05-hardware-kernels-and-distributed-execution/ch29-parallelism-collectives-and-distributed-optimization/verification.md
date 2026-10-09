---
id: ms.verification.29
entity_type: verification
title: Verification — Placement and communication plan
short_title: Verification 29
volume: 2
part: 5
chapter: 29
section: null
slug: verification
parent: ms.chapter.29
prev_sibling: ms.section.29.6
next_sibling: ms.references.29
children: []
prerequisites: [ms.chapter.16, ms.chapter.19, ms.chapter.20, ms.chapter.25, ms.chapter.26, ms.chapter.27, ms.chapter.28]
downstream: [ms.chapter.30, ms.chapter.36, ms.chapter.44]
related: []
relations: []
axes: {lifecycle: [pretraining, continued_training, evaluation], mechanism: [distributed_training, parallelism, communication], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch-fsdp2, impl.nvidia-megatron-core, impl.nvidia-nccl]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# Verification — Chapter 29

[DERIVED] This page specifies the artifact, mathematical acceptance identities and proposed experiments. **No GPU training, collective benchmark, layout migration, fault injection or source-result reproduction was executed for this edition.** Figure/schema and manuscript checks validate presentation contracts, not numerical or systems performance. The explicit three-rank counterexample is mathematical reasoning about printed pseudocode, not a reported implementation failure.

## Artifact contract

| Record | Mandatory fields | Rejection condition |
|---|---|---|
| Logical update | Model/checkpoint, tokenizer, token IDs, valid-target mask, attention mask, router decisions, objective reduction, optimizer policy and version | A distributed candidate changes tokens, edges, assignments or parameter version |
| State families | Logical tensor ID/shape, alias identity, storage and accumulation dtype, owner coordinates, replica set, optimizer counters | Duplicate or missing logical coordinates; different experts reduced together |
| Groups/topology | Ordered memberships per family and operation, GPU/NIC mapping, node/rail/cut, physical link capacities and their provenance | Degree product used without actual group mapping |
| Execution graph | Compute/transfer nodes, shapes, producer/consumer events, streams, collectives, task version, buffer last use | Unmet dependency, mismatched participation or reuse before completion |
| Memory ledger | Persistent shards, reconstructed buckets, activations, communication buffers, workspace and temporal peak | Independently timed maxima represented as exact shared-trace peak |
| Traffic ledger | Logical payload, sent/received convention, metadata, local copies, physical-cut traffic, compression/dedup rules | Double-counted collectives or omitted packing/metadata |
| Cost model | Resource capacities, isolated profiles, interference assumptions, critical paths, predicted complete-step time and residuals | Lower bound advertised as achieved throughput |
| Numerical reference | FP32 or higher-precision oracle, output/gradient/update metrics, conditioning, tolerances and rejection policy | Tolerance chosen after seeing candidate errors |
| Environment | Code/container hashes, framework/kernel/collective/plugin builds, driver/firmware, affinity and flags | Cited documentation version substituted for an installed build |
| Transition/recovery | Consistent old boundary, source/destination regions, canonical replica sources, staging bound, commit/recovery artifacts | Weights moved without matching optimizer/state identity |

[DERIVED] All candidate plans, predictions, rejections and measurements must be retained under immutable identities. Preserve the distinction between a semantic failure, capacity failure, unsupported configuration and slow candidate. Do not discard numerical failures and then describe the fastest surviving run as evidence for universal equivalence.

## Analytical acceptance checks

[ASSUMED] These fixtures are explicit illustrative inputs. Their expected outputs follow from the chapter equations, not from hardware measurements. They do not choose a universal model-error tolerance.

| Check | Inputs and expected identity | Reject if |
|---|---|---|
| Token normalization | Rank target counts 1 and 3, local summed gradients 2 and 0: Eq. 29.1 gives 0.5 | Rank means are averaged to obtain 1 |
| State ownership | $N=10^9,d=8,b_w=2,b_g=4,b_o=12$: Eq. 29.2 gives replicated 18 GB and fully sharded 2.25 GB, decimal units | Reconstruction/activation peak is claimed to equal either persistent figure |
| Reconstruction traffic | Same $N,d,b_w,b_g$, two weight gathers: Eq. 29.4 gives 7 GB sent payload/rank | Bidirectional bytes or metadata are silently compared with this payload |
| TP operator | Eq. 29.5 partitions the intermediate MLP width, then sums partial second-matrix outputs | A nonlinear function is moved across an unfinished sum without proof |
| Pipeline slot model | $p=4,m=8$: utilization $8/11$, bubble $3/11$ | The model is called measured MFU or exact 1F1B timing |
| Attention mask | Eq. 29.9 merges disjoint permitted keys into the same real-arithmetic normalized output | Missing/duplicate keys or cross-document leakage |
| Document work | One length-8 document has 36 causal pairs; two length-4 documents have 20 | Equal tokens are assumed to imply equal pair count |
| Expert conservation | $q$ tokens, $k$ selections: $\sum_e n_e=qk$ in the declared dropless contract | Overflow silently drops or reroutes assignments |
| Collective ownership | All-gather of reduce-scatter sums equals all-reduce under the same split/order | Averaging and sum normalization are mixed |
| Peer coverage | For three ranks, pair 1↔2 requires XOR round 3 | Rounds 1..2 are claimed to cover every pair |
| Migration economics | Transition cost $t_m$ versus remaining savings $H(t_o-t_n)$ | Switch justified solely by a faster new steady-state step |
| Pipeline calculator (Fig. 29.19) | $p=4,m=8,\tau=0.005$ s: Eq. 29.6 gives $T=0.055$ s, $u=8/11$ and $f=3/11$ | Slot-model utilization is described as measured device utilization or exact 1F1B timing |
| Ring calculator (Fig. 29.20) | $d=8,S=268435456$ bytes, $\alpha=5\times10^{-6}$ s, $B=5\times10^{10}$ bytes/s, $R=10^{12}$ bytes/s: sent payload is $469762048$ bytes/rank and Eq. 29.15 gives $0.009700121984$ s | Sent bytes are doubled by counting receive bytes, or modeled service is presented as measured collective throughput |
| Overlap calculator (Fig. 29.21) | $t_c=0.01,t_n=0.006$ s and $\eta_c=1.2,\eta_n=1.5$: stretched paths are $0.012$ and $0.009$ s, so Eq. 29.20 gives a $0.012$ s lower bound versus $0.016$ s isolated serial sum | The lower bound is presented as an achieved complete-step time or guaranteed speedup |

[MATHEMATICALLY-DERIVED] Exact integer coordinate and assignment checks require zero discrepancy. Floating-point equivalence needs a predeclared absolute/relative error rule appropriate to precision, conditioning and reduction order. Real-arithmetic equalities do not imply bitwise identity. Group membership and semantic normalization are checked before any tolerance is applied.

## Proposed experiments

### Experiment 29.1 — Placement, parity and scaling explanation

- **Hypothesis.** [DERIVED] A legal placement preserves the declared logical update, while step-time and peak-memory changes can be explained through its ownership, dependencies and resource traffic. No parallel degree is assumed universally optimal.
- **Setup.** [ASSUMED] Use a small dense model and a small MoE model with executable unpartitioned references. Freeze initialization, token stream, masking and router decisions for correctness panels. Restore learned routing only for a separately labeled end-to-end panel. Exact model/checkpoint/dataset revisions remain **UNVERIFIED** until selected by an executor.
- **Independent variables.** [ASSUMED] Data/state ownership pattern, TP/PP/CP/EP degrees, microbatch count, virtual chunks, bucket size, parameter retention, context placement, expert skew, hierarchy, overlap, recomputation and offload.
- **Controlled variables.** [DERIVED] Global valid-target batch, tokens processed, objective denominator, optimizer schedule, logical attention mask, expert assignments for frozen-routing panels, precision/accumulation contract and update count. If a larger local batch is enabled by freed memory, present it as a separate operational configuration rather than silently changing the controlled panel.
- **Dataset/workload.** [ASSUMED] Include equal tokens with different document-length distributions, unequal rank token counts, balanced/skewed expert matrices, and short/long microbatch waves. Synthetic fixtures isolate mechanisms; a versioned real training workload is required before a deployment claim.
- **Hardware.** [UNVERIFIED] Device model/count, node topology, NIC/fabric, CPU affinity, storage, driver and firmware are not selected. Record measured available capacity and topology-specific transfer paths; no price or bandwidth is invented here.
- **Metrics.** [DERIVED] Output/gradient/update error; parameter-version identity; assignment/mask conservation; per-rank peak allocated and reserved memory; reconstruction counts; sent/received/metadata bytes; compute and collective intervals; fill/drain and straggler intervals; complete-step p50/p95/p99; tokens/s/GPU at identical logical tokens. Energy and monetary cost require additional measured power and declared prices.
- **Baselines.** [DERIVED] Unpartitioned reference where feasible; replicated synchronous execution; each ownership family with identical update semantics. Include a serial schedule and isolated communication microbenchmark only as diagnostic panels, not replacements for full-step timing.
- **Ablation.** [ASSUMED] Disable one overlap path at a time and then test joint contention. Hold placement fixed while changing buckets; hold mask fixed while changing context placement; hold routing fixed while changing expert dispatch. Record infeasible configurations instead of omitting them.
- **Seeds and repeats.** [ASSUMED] Predeclare at least three independent initialization/data-order seeds for trajectory comparisons and repeated timing windows after stabilization. Exact counts must be set before execution. Raw per-step/per-rank traces support uncertainty over independent runs; thousands of correlated steps are not thousands of independent experimental units.
- **Expected result.** [DERIVED] A correct candidate matches the declared numerical oracle within preselected tolerances, preserves all discrete invariants, and has measured peaks/traffic consistent with its lifetime and payload boundary. A prediction model can be wrong even when the algorithm is correct.
- **Failure/rejection.** [DERIVED] Reject equivalence for lost assignments, changed masks, mixed parameter versions, wrong normalization or omitted gradients. Reject a capacity claim on observed OOM or uncounted buffers. Reject a predictive claim whose held-out residual exceeds its predeclared error budget. A speedup observed only after changing tokens or dropping work does not pass.
- **Statistical report.** [DERIVED] Keep paired run differences, confidence intervals and workload distributions. State the selection procedure and tuning budget. Report the complete tested grid and the chosen deployment configuration; do not combine the best isolated numbers from different configurations into an unattained result.
- **Interpretation.** [DERIVED] Attribute a measured difference only after logical-work equivalence passes. A lower full-step time with unchanged work supports the tested configuration; disagreement between the trace and the cost model limits the model rather than proving a universal advantage.
- **Threats to validity.** [DERIVED] Small models can exaggerate launch overhead; synthetic routing can suppress production skew; short windows can hide thermal or network variability; a best-of-grid winner can overfit the tuning workload. Separate these threats from correctness failures and use held-out workload distributions.

### Experiment 29.2 — Layout-transition coverage and recovery

- **Hypothesis.** [DERIVED] A transition maps one consistent logical training state into a new layout with unique destination coverage and bounded transient memory.
- **Setup.** [ASSUMED] Construct integer-labeled parameter, gradient and moment tensors so every coordinate has an exact identity. Test replicated and unique sources, retained local intersections and remote slices. Use three, five, eight and sixteen ranks where available; the non-power-of-two cases specifically probe the printed-loop qualification in §29.6.
- **Independent variables.** [ASSUMED] Old/new layouts, state families, rank count, staging chunk size, canonical-source rule and peer-round domain. Test the printed $1..n-1$ loop as an analytical baseline separately from the corrected coverage range.
- **Controlled variables.** [DERIVED] Identical logical state, consistent optimizer boundary, complete source manifests and deterministic destination expectations. An executor must pin the actual implementation separately from the paper's printed pseudocode.
- **Dataset/workload.** [ASSUMED] Integer-labeled synthetic state tensors with uneven final chunks, empty intersections, replicated sources and non-power-of-two rank groups. A later end-to-end training-resume workload must additionally freeze the input cursor and random state.
- **Hardware.** [UNVERIFIED] Devices, capacity, topology and transport are unselected. Begin with the exact coordinate oracle; run transport and failure injection only on a recorded hardware/software manifest with the relevant rank counts.
- **Metrics.** [DERIVED] Missing/duplicate coordinates, state hash by logical identity, optimizer-counter equality, migration wall time, maximum staging/live bytes, and recovery outcome after each injected failure boundary.
- **Baselines.** [ASSUMED] Checkpoint-based restore and a simple correct pairwise reference with full coordinate validation. Compare transition costs only under the same transferred state and recovery requirement.
- **Failure injection.** [ASSUMED] Interrupt before transfer, during a chunk, after a chunk and before commit. Require the declared old or new consistent state, or a recoverable durable artifact. If old sources are released eagerly, test the replacement recovery path explicitly.
- **Acceptance.** [DERIVED] Exact integer coverage and state identity; no unmatched peer schedule; measured staging within the declared budget; coherent optimizer/data/RNG state; specified recovery behavior. A correct transport on power-of-two groups does not establish arbitrary-rank coverage.
- **Expected result.** [DERIVED] The corrected round domain covers every distinct valid peer pair, and a conforming implementation preserves every destination coordinate before commit. The printed truncated domain fails the three-rank coverage fixture; this expectation concerns the mathematical loop, not uninspected runtime code.
- **Ablation.** [ASSUMED] Change only the peer-round domain, canonical-source rule or staging budget in each panel. Test failure recovery separately from ordinary completion, and distinguish local retained intersections from actual network transfers.
- **Interpretation.** [DERIVED] Passing coordinate checks establishes the tested state transformation. Runtime progress, bounded physical memory and recoverability need their corresponding execution measurements; they do not follow from pair coverage alone.
- **Threats to validity.** [DERIVED] Integer fixtures omit floating-point serialization effects; a transport may internally pad groups; fault injection may not reproduce abrupt node loss; source code can differ from printed pseudocode. Report these boundaries and preserve the exact build identity.
- **What would falsify the claim.** [DERIVED] A missing required pair, duplicate source write, omitted moment tensor, transient OOM or unrecoverable partial commit rejects the corresponding transition guarantee. A mathematical loop counterexample is distinct from a runtime result and must remain labeled accordingly.

## Topic-completeness audit

The table records editorial coverage and unresolved evidence, not experiment completion. Mathematics, algorithms, implementation boundaries, source-reported protocols, observations, failure modes, siblings, extensions and reproducibility are present in each section. Nonapplicable empirical obligations are replaced with explicit proposed tests rather than fabricated results.

[DERIVED] **Interactive coverage audit.** All six sections include adjustable native calculators. Figures 29.19–29.21 add pipeline fill/drain, ring service decomposition and overlap-bound sensitivity to §§29.2, 29.5 and 29.6 while preserving their three existing visuals. Their formulas bind to existing Eqs. 29.6, 29.15 and 29.20; inputs and presets are authored analytical cases. Native grammar/formula validation and browser interaction checks establish rendering behavior, not empirical validity of the models. Browser verification of the new controls remains pending with the integrator.

| Required coverage item / variant | Canonical manuscript anchor | Primary key and exact locator | Unresolved gap | Review consequence |
|---|---|---|---|---|
| Replicated DP; synchronization; token weighting | [§29.1 Formulation](29-1-data-state-parallelism.md#formulation), Algorithm 29.1 | R29.3 §2; original Eq. 29.1 | Local parity unexecuted | Review normalization and unique-coordinate norms |
| Optimizer, gradient and parameter sharding; ZeRO stages | [§29.1 Mechanism](29-1-data-state-parallelism.md#mechanism) | R29.3 §2 and §4.1; Eq. 29.2 | Exact installed bucket policy unverified | Ownership patterns taught without old-source date laundering |
| FSDP variants; communicator separation | [§29.1 Implementation](29-1-data-state-parallelism.md#implementation) | R29.1 named FSDP2 heading | API unstable; benchmark protocol absent | No universal speedup or compatibility promise |
| Matrix partitions; activation exchange; backward | [§29.2 Mechanism](29-2-tensor-and-pipeline-parallelism.md#mechanism) | R29.3 §2; Eq. 29.5 | Kernel/configuration parity unexecuted | Check bias, gate and gradient layout algebra |
| Pipeline bubbles; microbatches; interleaving; topology | [§29.2 Mechanism](29-2-tensor-and-pipeline-parallelism.md#mechanism) | R29.3 §4, §6.1; Eq. 29.6 | Slot model is not exact runtime timing | Require stage trace and common optimizer version |
| Activation partitioning versus context distribution | [§29.3 Mechanism](29-3-sequence-and-context-parallelism.md#mechanism) | R29.5 §2–3; Eqs. 29.7–29.9 | Framework-specific naming/shape contract | Reject naming-only equivalence claims |
| Exact mask, stable merge, document-aware load | [§29.3 Algorithm](29-3-sequence-and-context-parallelism.md#algorithm) | R29.5 §3.2–3.4; R29.6 §5.1–5.2; Eqs. 29.9–29.10 | Rounding/dropout and local runtime unverified | Preserve edges and logical RNG identity |
| Expert placement; router imbalance | [§29.4 Mechanism](29-4-expert-parallelism.md#mechanism) | R29.7 §2–4; R29.2 MoE; Eqs. 29.11–29.13 | Actual routing distribution unknown | Use full count matrix and grouped-kernel costs |
| All-to-all; hybrid DP/EP; shared experts | [§29.4 Algorithm](29-4-expert-parallelism.md#algorithm) and Implementation | R29.7 §3–5; R29.2 shared-expert bullet | Exact family groups and overflow handling unverified | Require assignment conservation and per-family synchronization |
| AR/RS/AG/A2A/P2P semantics and algorithms | [§29.5 Mechanism](29-5-collective-communication.md#mechanism) | R29.8 release; original Eqs. 29.14–29.17 | Library-selected physical algorithm unknown | Model payload/rounds separately from measured time |
| NCCL/RCCL | [§29.5 Implementation](29-5-collective-communication.md#implementation) | R29.8 feature/prerequisite headings; R29.9 Changed | No cross-library controlled experiment | No ranking or installed compatibility claim |
| MPI/UCX/NVSHMEM | [§29.5 Implementation](29-5-collective-communication.md#implementation) | R29.10 UCP/UCT; R29.11 first entry; R29.12 Limitations | MPI tag heading ambiguity; transport activation unverified | Keep layer, completion and visibility scopes distinct |
| Hierarchical groups; topology; lower bounds | [§29.6 Formulation](29-6-joint-optimization.md#formulation) and Mechanism | R29.3 §4; Eqs. 29.18–29.19 | Resource profiles unmeasured | Lower bound cannot be represented as achieved speed |
| Overlap, recomputation, offload | [§29.6 Mechanism](29-6-joint-optimization.md#mechanism) | R29.3 §4.3; Eq. 29.20 | Interference and transfer deadlines unknown | Require joint ablations and peak-lifetime trace |
| Placement transition; peer schedule | [§29.6 Algorithm](29-6-joint-optimization.md#algorithm) | R29.4 §4.3 Algorithm 1 | Printed loop incomplete for non-power-of-two domain; code uninspected | Qualify source generality; test corrected coverage separately |
| Cost/energy/money; reliability | Limitations and Reproducibility in all six sections | Logical cost derivations; release limitations | Power, prices, failure rates and recovery unverified | No invented savings or reliability result |

## What this edition did not do

[UNVERIFIED] It did not run distributed training, benchmark a communication library, install the cited framework versions, measure numerical parity or energy, reproduce source speedups, inject faults or deploy a migration system. The publication window and primary reading records constrain factual claims; they do not replace independent scientific review. All proposed experiments remain pending, and editorial status remains **manuscript_draft**.
