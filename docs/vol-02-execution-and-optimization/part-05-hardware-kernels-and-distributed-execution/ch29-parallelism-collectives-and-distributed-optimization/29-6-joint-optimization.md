---
id: ms.section.29.6
entity_type: section
title: Joint optimization
short_title: Joint optimization
volume: 2
part: 5
chapter: 29
section: 29.6
slug: 29-6-joint-optimization
parent: ms.chapter.29
prev_sibling: ms.section.29.5
next_sibling: null
children: []
prerequisites: [ms.chapter.16, ms.chapter.19, ms.chapter.20, ms.chapter.25, ms.chapter.26, ms.chapter.27, ms.chapter.28]
downstream: [ms.chapter.30, ms.chapter.36, ms.chapter.44]
related: []
relations: []
axes: {lifecycle: [pretraining, continued_training], mechanism: [distributed_training, parallelism, communication], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch-fsdp2, impl.nvidia-megatron-core, impl.nvidia-nccl]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 29.6 — Joint optimization

## Scope

[DERIVED] This section owns hierarchical group composition, topology-aware placement, overlap, recomputation, offload, lower bounds and layout transitions. It combines the previous sections into a placement and communication plan. The target is the lowest feasible complete-step time under fixed logical training semantics and declared reliability constraints. It does not rank frameworks by source prestige, infer private lab configurations, or claim measurements that this manuscript did not perform.

## Why this exists

[MATHEMATICALLY-DERIVED] A placement changes memory, computation and communication together. Full sharding lowers persistent state but inserts gathers. Smaller pipeline chunks expose overlap but increase boundaries. Larger context degrees can reduce per-rank work while increasing exchange. Expert placement changes dynamic traffic cuts. Optimizing each degree independently ignores the shared HBM, SM, NIC and switch resources on which their operations contend.

[PAPER-REPORTED] Piper models computation and communication together in a global DAG, while DynaTrain maps distributed training-state layouts through a logical coordinate space and stages migration under memory constraints. [R29.3], §4; [R29.4], §4.1–4.4. These are complementary problems: scheduling one layout and safely transitioning between layouts. Neither makes the full joint optimization space trivial.

[DERIVED] A plan therefore needs more than a tuple of parallel degrees. It needs parameter-family ownership, tensor placements, collective groups, stage mapping, event dependencies, lifetime budgets, executable versions and a correctness oracle. “Communication is hidden” is incomplete unless it identifies the independent work doing the hiding and the resource interference incurred during that overlap.

## Intuition

[MATHEMATICALLY-DERIVED] Independent operations can overlap in time only if their combined resource demands fit. Two kernels on different streams can compete for the same SMs or HBM. Two collectives on separate communicators can share one NIC cut. The unconstrained maximum of compute and communication duration is a lower bound for perfect overlap, not a guaranteed step time. Memory adds another temporal constraint: an otherwise legal task cannot start if its outputs and live inputs exceed capacity.

[MATHEMATICALLY-DERIVED] Recomputation and offload trade different resources. Recomputation replaces retained bytes with additional operators; offload replaces device residence with host storage and transfers. Their benefits depend on what was on the critical path and whether transfers can finish before the next use. Freeing bytes at one point can allow a better batch or schedule, but that second-order improvement must be measured rather than added as a free benefit.

## Formulation

| Symbol | Meaning | Shape / unit |
|---|---|---|
| $\mathcal G=(\mathcal V,\mathcal E)$ | Compute, transfer and synchronization DAG | Directed acyclic graph |
| $\pi$ | Tensor placement, groups, physical mapping, schedule policy | Plan |
| $s_a,\tau_a$ | Start and modeled duration of task $a$ | Seconds |
| $r_{ak},R_k$ | Task demand and capacity for resource $k$ | Consistent resource units |
| $M_r(t),M_r^{\max}$ | Live device memory and capacity | Bytes |
| $F_r,V_{r,k}$ | Device FLOPs and traffic through resource $k$ | FLOPs, bytes |
| $H$ | Remaining optimizer steps before a planning horizon | Count |

[MATHEMATICALLY-DERIVED] A constrained makespan objective is

$$
\begin{aligned}
\min_{\pi,s}\quad &T=\max_a(s_a+\tau_a),\\
s_a&\ge0\quad\forall a\in\mathcal V,\qquad s_b\ge s_a+\tau_a\quad\forall(a,b)\in\mathcal E,\\
\sum_{a:s_a\le t<s_a+\tau_a}r_{ak}&\le R_k,\qquad
M_r(t)\le M_r^{\max},\\
\operatorname{logicalUpdate}(\pi)&\equiv\operatorname{referenceUpdate}.
\end{aligned}
$$

*(Eq. 29.18)*

[DERIVED] Constant resource demands and durations are approximations. Actual duration can depend on concurrent tasks, memory pressure and thermal state. A planner that uses isolated profiles must validate interference predictions on held-out configurations. A numerical equivalence condition is distinct from exact bitwise equality and must name the reference precision and tolerance.

## Mechanism

### Bounds before search

[MATHEMATICALLY-DERIVED] Let $\mathcal P$ range over dependency paths. With compatible definitions of device compute, HBM and link capacity,

$$
T\ge\max\left\{
\max_{\mathcal P}\sum_{a\in\mathcal P}\tau_a^{\rm lb},
\max_r F_r/P_r,
\max_r V_{r,\rm HBM}/B_{r,\rm HBM},
\max_{\rm cut}Q_{\rm cut}/B_{\rm cut}
\right\}.
$$

*(Eq. 29.19)*

[DERIVED] The path term requires valid per-task duration lower bounds $\tau_a^{\rm lb}$ for every admitted interference/cache state. A fitted or isolated duration $\tau_a$ from Eq. 29.18 is not automatically such a bound; a change in cache or execution path can invalidate that substitution. With those conditions, the terms are lower bounds, so taking their maximum is justified; adding them assumes serialization that may not exist. Advertised peak compute or bandwidth produces an optimistic bound, not a prediction. For collective traffic, count what must cross each cut rather than summing NIC line rates. For expert traffic, use the observed or explicitly assumed routing matrix. For context work, preserve the actual document mask and length distribution.

```figure
id: fig-29.16
kind: hierarchy
title: Placement follows physical resource domains
caption: This qualitative hierarchy separates local execution, device-to-device links, node egress and the fabric cut. No vendor bandwidth is assumed; each level needs a measured or documented capacity for the chosen deployment.
evidence: DERIVED
source: DERIVED:eq-29.19
alt: Operators consume local SM and HBM resources, then device links, node NICs and a shared fabric cut. Parallel groups map onto these domains rather than arbitrary adjacent rank numbers.
spec:
  levels:
    - {label: Local operator, kind: process, note: FLOPs and tensor layout}
    - {label: GPU resources, kind: hardware, note: SM occupancy and HBM traffic}
    - {label: Fast device domain, kind: boundary, note: Frequent tensor and local sharding exchange}
    - {label: Node egress, kind: hardware, note: GPU to NIC affinity and rail assignment}
    - {label: Shared fabric cut, kind: boundary, note: Competing DP CP EP and pipeline traffic, emphasis: true}
```

### Overlap, retention, and offload

[MATHEMATICALLY-DERIVED] If independent compute and communication have isolated durations $t_c,t_n$, and concurrent interference stretches them by factors $\eta_c,\eta_n\ge1$, the overlapped interval satisfies

$$
T_{\rm overlap}\ge\max(\eta_ct_c,\eta_nt_n).
$$

*(Eq. 29.20)*

```figure
id: fig-29.21
kind: calculator
title: Overlap lower bound under separate interference
caption: Adjust compute and communication intervals and their separate interference multipliers. Eq. 29.20 yields a critical-path lower bound for the concurrent interval, while the isolated serial sum is shown for comparison. Neither value is a measured complete-step time or guaranteed speedup.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.20
alt: With ten milliseconds of isolated compute, six milliseconds of communication and interference multipliers of 1.2 and 1.5, the stretched paths are twelve and nine milliseconds. Their maximum is a twelve-millisecond lower bound, compared with a sixteen-millisecond isolated serial sum.
spec:
  tex: 'T_{overlap}\ge\max(\eta_c t_c,\eta_n t_n)'
  equation: '29.20'
  inputs:
    - {symbol: tc, label: Isolated compute interval, default: 0.01, min: 0.0001, max: 0.1, scale: log10, format: seconds}
    - {symbol: tn, label: Isolated communication interval, default: 0.006, min: 0.0001, max: 0.1, scale: log10, format: seconds}
    - {symbol: ec, label: Compute interference multiplier, default: 1.2, min: 1, max: 4, step: 0.1, format: fixed1}
    - {symbol: en, label: Communication interference multiplier, default: 1.5, min: 1, max: 4, step: 0.1, format: fixed1}
  outputs:
    - {symbol: C, label: Stretched compute path, formula: ec*tc, format: seconds}
    - {symbol: N, label: Stretched communication path, formula: en*tn, format: seconds}
    - {symbol: L, label: Concurrent interval lower bound, formula: 'max(ec*tc,en*tn)', format: seconds, emphasis: true}
    - {symbol: S, label: Isolated serial sum, formula: tc+tn, format: seconds}
  presets:
    - {label: Ideal independent resources, values: {tc: 0.01, tn: 0.006, ec: 1, en: 1}}
    - {label: Compute contention, values: {tc: 0.01, tn: 0.006, ec: 2, en: 1}}
    - {label: Both paths stretched, values: {tc: 0.01, tn: 0.006, ec: 2, en: 2}}
```

[DERIVED] With launch and synchronization overhead it can exceed even $t_c+t_n$. A separate stream permits concurrency; it does not set either interference factor to one. Fine-grained chunking can reduce a critical dependency delay but increases launch and startup counts. Scheduling DP reduction behind latency-critical expert dispatch may improve the step even if its isolated bandwidth looks worse. The correct outcome is complete-step time with unchanged update semantics.

[MATHEMATICALLY-DERIVED] Offloading an activation of $A$ bytes requires at least $A/B_{\rm out}+A/B_{\rm in}$ transfer time if outbound and inbound paths are serial for that tensor. It also requires host storage and staging buffers. If $t_{\rm next}$ is the next-use deadline, a prefetch starting at $s$ must satisfy $s+A/B_{\rm in}\le t_{\rm next}$ in the ideal model. Recomputation instead adds a subgraph with FLOPs and HBM traffic. Choose by the resulting makespan and peak, not by bytes freed in isolation.

[DERIVED] Hierarchical groups must be defined per parameter family. Dense, routed-expert and shared-expert parameters can have different replica sets. Tensor, context and pipeline dimensions are not always independent Cartesian factors for every family. Verify the world-size relationship from actual memberships, not an unqualified product of degree labels. Placement legality includes divisibility, tied identities, head layout, kernel support and group-order constraints.

```figure
id: fig-29.17
kind: chart
title: Overlap under resource interference
caption: Illustrative compute interval of ten milliseconds and communication interval of six milliseconds. As both interference factors increase together, nominal concurrency can approach or exceed serial execution.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.20
alt: The perfect-overlap lower bound starts at ten milliseconds. With a shared interference multiplier of two it reaches twenty milliseconds, exceeding the sixteen-millisecond isolated serial sum. This is a sensitivity calculation.
spec:
  type: line
  x: {label: Shared interference multiplier, domain: [1, 2], format: fixed1}
  y: {label: Interval duration, format: seconds}
  variables: {tc: 0.01, tn: 0.006}
  series:
    - {id: overlap, label: Interfered overlap lower bound, formula: 'max(x*tc,x*tn)', sample: {from: 1, to: 2, count: 60}, emphasis: true}
    - {id: serial, label: Isolated serial sum, formula: tc+tn, sample: {from: 1, to: 2, count: 60}, dashed: true}
```

### Layout transition and a proof boundary

[PAPER-REPORTED] DynaTrain represents state as logical coordinate regions, derives source/destination transfers, coalesces them and stages migration under a memory budget. [R29.4], §4.1–4.3. The manuscript's transition algorithm below adopts the coordinate-intersection idea as an explanatory construction rather than reproducing its implementation.

[MATHEMATICALLY-DERIVED] For state tensor region $\Omega$, source ownership $R_r^{\rm old}$ and destination ownership $R_s^{\rm new}$, the required unique-owner transfer region is

$$
\mathcal T_{rs}=R_r^{\rm old}\cap R_s^{\rm new},\qquad
\bigcup_r\mathcal T_{rs}=R_s^{\rm new}.
$$

*(Eq. 29.21)*

[DERIVED] Replicated source regions require a canonical source choice to avoid duplicate writes. Every destination element must be covered once, and parameters, moments, step counters, RNG/data position and layout metadata must refer to one consistent training boundary. Moving weights alone is not an equivalent training-state transition.

[MATHEMATICALLY-DERIVED] DynaTrain v1 Algorithm 1 uses peers $r\mathbin{\mathrm{xor}}u$ for $u=1,\ldots,n-1$ and discards peers outside $n$ ranks. [R29.4], §4.3. For $n=3$, ranks 1 and 2 pair only at $u=3$, absent from that range. Thus the printed schedule does not cover arbitrary rank counts. Symmetric peer matching proves paired participation for selected rounds; it does not prove complete pair coverage. This is a mathematical counterexample to generality of the printed procedure, not an observed failure of released code or the paper's power-of-two evaluations.

## Algorithm

**Algorithm 29.6 — Capacity-checked layout transition.** [DERIVED] Inputs are consistent old state, old/new logical regions, canonical owners for replicated sources, available staging capacity, and $n$ participating ranks. Output is the same logical state in a new layout. Use $u=1,\ldots,2^{\lceil\log_2n\rceil}-1$ with valid-peer filtering to cover all XOR pairings, including non-power-of-two rank counts.

$$
\begin{aligned}
1.\quad &\operatorname{quiesceAtBoundary};\quad
\mathcal T_{rs}\gets R_r^{\rm old}\cap R_s^{\rm new}.\\
2.\quad &\neg\operatorname{uniqueCoverage}(\mathcal T,R^{\rm new})
\Rightarrow\operatorname{return}(\bot).\\
3.\quad &\mathcal C\gets\operatorname{agreePeerChunks}(\mathcal T;M^{\rm staging});\quad
\neg\operatorname{wholeLifetimeFits}(\mathcal C)\Rightarrow\operatorname{return}(\bot).\\
&\forall r:\operatorname{retainAliasOrSafeLocalCopy}(\mathcal T_{rr};R^{\rm new}_r).\\
4.\quad &\forall C,\ \forall u\in[1,2^{\lceil\log_2n\rceil}-1]:
\quad s\gets r\mathbin{\mathrm{xor}}u.\\
5.\quad &s<n\Rightarrow\operatorname{postMatchedTransfers}(C_{rs},C_{sr});\quad
\operatorname{awaitAndValidate}(C).\\
6.\quad &\operatorname{completeCoverage}\land\operatorname{stateIdentity}
\Rightarrow\operatorname{commitNewLayout};\quad
\text{otherwise}\Rightarrow\operatorname{abortTransition}.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] For any distinct valid $r,s$, $u=r\mathbin{\mathrm{xor}}s$ lies in the enlarged range, and $s\mathbin{\mathrm{xor}}u=r$. This establishes pair coverage and symmetric matching. It does not by itself prove transport progress, buffer safety or crash recovery; those remain additional obligations. Local intersections $\mathcal T_{rr}$ are retained by a proven compatible alias or copied/repacked locally before remote rounds; nonzero XOR rounds never visit them. Peer-agreed chunks carry matching logical coordinates, byte counts and stage identities, including explicit empty sides where needed. Capacity checks include retained old state, accumulated new state and all staging at each point, not just one chunk in isolation. These requirements are separate from the XOR coverage proof. The invariant is retained old-state authority until validated new coverage commits. A rollback-capable implementation needs either retained source state or a durable recovery artifact; freeing every source early removes that rollback guarantee.

## Implementation

[DERIVED] NVIDIA Megatron-Core, PyTorch FSDP2 and related placement abstractions occupy **Distributed training**; local kernels and collectives occupy **Kernels / numerics / collectives**. Piper and DynaTrain are outside the named stack, routed through the plan's distributed-systems anchors. Their papers were inspected, but no code execution or arbitrary-composition compatibility is claimed. A practical planner must produce explicit task/event and lifetime records, not a list of flags whose interactions remain undocumented.

```figure
id: fig-29.18
kind: systems-trace
title: Placement transition as a transaction
caption: >-
  Logical-state identity must survive layout changes. Source release is a
  transactional decision: freeing old state before validating destination
  coverage requires another recovery path.
evidence: DERIVED
source: DERIVED:eq-29.21
alt: At a consistent optimizer boundary, the planner derives unique source-to-destination intersections, reserves staging, executes matched chunks, validates complete destination coverage and commits the new layout. Failure requires an explicit recovery artifact.
spec:
  columns: [memory, communication, failure]
  stages:
    - {name: Quiesce, values: {memory: Consistent old state, communication: Complete pending collectives, failure: Mixed optimizer versions}}
    - {name: Plan intersections, values: {memory: Region metadata, communication: Canonical source selection, failure: Duplicate destination coverage}}
    - {name: Reserve and chunk, values: {memory: Old state plus bounded staging, communication: Peer-round plan, failure: Transient OOM}}
    - {name: Transfer, values: {memory: Source and destination lifetimes, communication: Matched payload and completion, failure: Missing non-power-of-two pair}}
    - {name: Validate and commit, values: {memory: New authoritative state, communication: Coverage and identity checks, failure: No rollback after early source release}}
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] DynaTrain evaluates a 16-node A800-80GB cluster with eight GPUs and eight 200-Gbps NICs per node, compares checkpoint-based and hot-switching baselines, and includes convergence and transition ablations. [R29.4], §6.1–6.5. Its reported transition timings do not establish universal non-power-of-two scheduling or local failure recovery. No result here is independently reproduced.

### Proposed verification

[ASSUMED] Search legal degree/placement/schedule tuples, reject incorrect or capacity-infeasible candidates, and compare predicted versus measured step time on held-out layouts. Ablate overlap, recomputation, offload and hierarchy individually and jointly. Include routing skew, heterogeneous document lengths and deliberate resource contention. Validate layout transitions with three, five and power-of-two rank counts and require exact integer coordinate coverage before any floating-point test. Experiments in [verification](verification.md) are unexecuted.

## Observations

**What the paper claims.** [PAPER-REPORTED] DynaTrain supports logical-coordinate state migration with memory-aware staging. [R29.4], §4.

**What the evidence shows.** [DERIVED] Its evaluated transitions support those tested settings; the printed peer loop has a separate coverage condition.

**What we infer.** [MATHEMATICALLY-DERIVED] The three-rank counterexample limits the generality of that loop, while Eq. 29.19 bounds any proposed joint plan.

**What remains unknown.** [UNVERIFIED] The implementation's actual non-power-of-two behavior, failure recovery and local performance remain unchecked.

## Failure modes

[DERIVED] Independent tuning can oversubscribe the same fabric cut or HBM path. Isolated profiles can underestimate interference. Offload prefetch can miss a reuse deadline. Recomputation can change RNG behavior. Layout migration can omit optimizer moments or duplicate replica sources. A coordinate-correct transfer can still deadlock because of unmatched posts or buffer dependencies. Reconfiguration that improves steady-state time can lose overall if its cost exceeds the remaining savings.

[MATHEMATICALLY-DERIVED] If the old/new step times are $t_o,t_n$ and transition cost is $t_m$, changing layout within a horizon of $H$ steps is beneficial only if $H(t_o-t_n)>t_m$, excluding risk and future changes. A smaller $t_n$ does not alone justify switching. Include validation and compilation overhead in $t_m$ if they interrupt useful training.

## Siblings

[DERIVED] [State sharding](29-1-data-state-parallelism.md) primarily changes persistent ownership; [TP/PP](29-2-tensor-and-pipeline-parallelism.md) changes operator or layer assignment; [CP](29-3-sequence-and-context-parallelism.md) changes token/context ownership; [EP](29-4-expert-parallelism.md) changes routed parameter ownership. Joint optimization selects their composition under one update contract. Automatic search and expert-authored schedules differ in how candidates are chosen, not in the correctness obligations they must satisfy.

## Extensions

[DERIVED] Adaptive planners can update cost estimates from trace feedback and use hysteresis to avoid oscillating layouts. Preserve a stable correctness oracle and retain failed predictions as evidence rather than silently refitting them away. Reliability-aware objectives can include expected interruption and recovery costs, but those terms require measured failure rates and explicit recovery semantics. Sparse or multimodal operators need task-specific work estimates; dense FLOP proxies cannot simply be inherited.

## Limitations

[MATHEMATICALLY-DERIVED] The makespan model assumes an explicit finite DAG and modeled resources. Lower bounds are not attainable-performance guarantees. Pair coverage does not prove recovery or numerical equivalence. Empirical cost, energy and money remain **UNVERIFIED** without execution and pricing. Primary prestige, recent publication and an apparently formal pseudocode box do not substitute for checking its quantifiers, rank-domain assumptions and conservation invariants.

## Reproducibility

[DERIVED] Deliver the placement plan, parameter-family groups, global tensor regions, DAG/events, lifetime budgets, topology, model/runtime revisions, cost-model inputs, prediction residuals and recovery policy. Preserve source-reported and book-derived claims separately. **UNVERIFIED:** no planner benchmark, migration test, failure injection or independent source reproduction was performed. The chapter remains a manuscript draft pending mathematical and scientific review.

## References

[R29.3](references.md#r293), Piper v1 §4 and §6; [R29.4](references.md#r294), DynaTrain v1 §4 and §6. The counterexample concerns the printed Algorithm 1, not an inspected implementation.
