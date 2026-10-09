---
id: ms.section.26.5
entity_type: section
title: Tuning and portability
short_title: Tuning and portability
volume: 2
part: 5
chapter: 26
section: 26.5
slug: 26-5-tuning-and-portability
parent: ms.chapter.26
prev_sibling: ms.section.26.4
next_sibling: ms.section.26.6
children: []
prerequisites:
- ms.chapter.3
- ms.chapter.5
- ms.chapter.25
downstream:
- ms.chapter.27
- ms.chapter.28
- ms.chapter.29
- ms.chapter.30
related: []
relations: []
axes:
  lifecycle:
  - pretraining
  - inference
  - serving
  mechanism:
  - kernel_programming
  - numerical_equivalence
  feedback_setting: []
  modality:
  - text
  - image
  - audio
papers: []
implementations:
- impl.nvidia-cuda
- impl.triton-language
- impl.nvidia-cutlass
- impl.amd-hip
- impl.pytorch
- impl.jax
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - OFFICIAL-DOCUMENTATION
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1800
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 26.5 — Tuning and portability

## Scope

[DERIVED] Tuning chooses a valid schedule for a shape/dtype/device envelope; portability preserves the operator contract when that envelope changes. This section owns specialization keys, candidate search, occupancy, compiler effects, target families and explicit fallback. The objective is complete-operator cost under a declared workload, constrained by correctness and resource capacity. No candidate is accepted because it compiles or wins one noisy timing sample.

## Why this exists

[OFFICIAL-DOCUMENTATION] Triton 3.8, released August 28, 2026, adds reporting of selected autotune configurations, timings, tuning duration and cache status, and changes runtime cache handling. Its pinned autotuner includes state-reset/restoration hooks and configurable keys. [R26.16], release “Autotuning listener”, “Runtime resources and caches”, and `Autotuner.__init__/run`. [DERIVED] These are precisely the records needed to distinguish a fast kernel from an expensive search or a stale selection. The existence of autotuning does not make the selected configuration scientifically optimal; it optimizes the measured objective over the candidates and states it actually evaluates.

[DERIVED] Portability failures often originate in an incomplete key. Shape may match while dtype, strides, alignment, numerical mode or device capabilities differ. A schedule that requires a particular instruction or layout cannot be reused merely because the logical matrix dimensions are unchanged. A valid fallback is therefore part of the implementation rather than an embarrassment to omit from the benchmark.

## Intuition

[MATHEMATICALLY-DERIVED] Specialization partitions the input space into equivalence classes. Inputs in one class reuse a schedule because its preconditions and semantic choices are identical. More classes permit better local schedules but increase compilation, cache size and cold-start costs. Fewer classes reduce those costs but may require dynamic masking or conservative layouts. The tuning problem is a partition-and-selection problem, not just a choice of tile width.

## Formulation

| Symbol | Meaning |
|---|---|
| $x$ | Operator input and metadata |
| $\kappa(x)$ | Specialization key |
| $\mathcal C_k$ | Candidate schedules for key $k$ |
| $\mathcal V(c,x)$ | Validity predicate for schedule $c$ and input $x$ |
| $T_c(x)$ | Complete-operator duration |
| $A_k$ | Compile plus tuning cost for key $k$ |
| $n_k$ | Expected reuse count, declared rather than observed here |
| $R_c,S_c$ | Registers and shared bytes per resident block |
| $R_{\rm SM},S_{\rm SM}$ | Target-specific available resources |

[MATHEMATICALLY-DERIVED] A deployment cost model is

$$
T_{\rm total}=\sum_k\left(A_k+\sum_{i:\kappa(x_i)=k}T_{c_k}(x_i)\right),\qquad
c_k\in\bigcap_{x:\kappa(x)=k}\{c:\mathcal V(c,x)=1\},\qquad
T_{\rm base}=nt_0,\quad T_{\rm tuned}=A+nt_1.
$$

*(Eq. 26.7)*

The intersection is essential: a cached candidate must be valid for every input permitted by its key. If not, refine the key, add a runtime guard or dispatch to fallback. A speed comparison with an omitted $A_k$ answers only the warmed reuse question. The last two expressions specialize the ledger to one key with reuse $n$, baseline per-call time $t_0$, tuned time $t_1$, and additional one-time cost $A$.

## Mechanism

[DERIVED] **Shape/dtype specialization** records every assumption used to select or generate the kernel. Distinguish sizes from strides, storage dtype from accumulator dtype, and logical dimensions from padded dimensions. Alignment guarantees can follow from allocator and offset contracts but not from shape alone. A key for a transposed view must capture or guard the relevant layout. Scalar values belong in a key only when compilation specializes on them; otherwise they should remain runtime inputs. Putting a changing training step in the key can create one executable per update.

[MATHEMATICALLY-DERIVED] **Autotuning** evaluates a finite candidate set, so it cannot discover a schedule absent from that set. It should prune configurations violating instruction, tile, shared-memory or numerical preconditions before timing. For mutable operators, every candidate must begin from the same state. Otherwise the search compares different gradients, moment histories or accumulation buffers. A candidate that fails correctness is excluded rather than assigned a favorable duration. Record errors separately from timeouts and resource exhaustion; these imply different next steps.


```figure
id: fig-26.15
kind: diagram
title: Validity precedes timing selection
caption: A candidate enters selection only after its static and numerical contracts pass. The cache stores both
  its identity and applicability conditions; an empty valid set routes explicitly to fallback.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.7
alt: A candidate enters selection only after its static and numerical contracts pass. The cache stores both its
  identity and applicability conditions; an empty valid set routes explicitly to fallback.
concepts:
- ms.section.26.5
spec:
  direction: LR
  nodes:
  - id: x
    kind: tensor
    label: Input metadata and state
  - id: key
    kind: process
    label: Complete specialization key
  - id: valid
    kind: boundary
    label: Static and numerical validity
  - id: bench
    kind: metric
    label: Independent timing confirmation
  - id: cache
    kind: memory
    label: Schedule and binary identity
  - id: fallback
    kind: branch
    label: Exact fallback
  edges:
  - from: x
    to: key
  - from: key
    to: valid
  - from: valid
    to: bench
    kind: emphasis
  - from: bench
    to: cache
  - from: valid
    to: fallback
  - from: bench
    to: fallback
```


[DERIVED] **Occupancy** is bounded by several resource allocations. A schematic block-residency upper bound is

$$
B_{\rm resident}\leq\min\left(B_{\rm architectural},\left\lfloor R_{\rm SM}/R_c\right\rfloor,
\left\lfloor S_{\rm SM}/S_c\right\rfloor,\left\lfloor u_{\rm SM}/u_c\right\rfloor\right).
$$

*(Eq. 26.8)*

Here $u_c$ denotes threads per block and $u_{\rm SM}$ the target thread capacity, both counts. These symbols are separate from duration $T_c(x)$. A zero resource demand contributes no restriction (interpret that quotient as infinity); nonzero demands require compatible units and positive available budgets. Real allocation granularity and instruction-specific constraints may lower residency further. More resident blocks can hide latency, but larger tiles can improve reuse while lowering residency. A theoretical occupancy fraction therefore cannot rank schedules without instruction and memory evidence. Registers that spill can improve apparent residency while worsening memory traffic.

[DERIVED] **Compiler effects** make the generated artifact part of the candidate identity. A frontend expression can lower differently after a compiler update even when source and launch dimensions match. Changes in common-subexpression elimination, address analysis, scheduling or register allocation can affect both duration and numerical order. Keep source-level schedule parameters and binary hash together. A timing result cannot be attributed solely to tile size when the compared candidates were compiled by different toolchains or with different fast-math settings.

[DERIVED] **Device families** change supported instructions, execution-group width, memory hierarchy and capacity constraints. Use exact capability checks for the selected path. Backend acceptance of a dtype does not establish equal accumulation precision or equal numerical tolerances across targets. A portable implementation may retain the same mathematical spec while using different tiles, reduction trees or libraries. Cross-device bitwise equality is a stronger requirement than accepted numerical equivalence and can rule out otherwise useful schedules.


```figure
id: fig-26.16
kind: calculator
title: Compile and tuning amortization
caption: Illustrative seconds, not a measured implementation. Increasing reuse can repay a one-time search only
  when the accepted steady-state saving is positive.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.7
alt: Illustrative seconds, not a measured implementation. Increasing reuse can repay a one-time search only when
  the accepted steady-state saving is positive.
concepts:
- ms.section.26.5
spec:
  equation: '26.7'
  tex: T_{\rm base}=nt_0,\quad T_{\rm tuned}=A+nt_1
  inputs:
  - symbol: n
    label: reuse count
    default: 10000
    min: 1
    max: 1000000
    format: integer
  - symbol: A
    label: compile and tune seconds
    default: 5
    min: 0
    max: 100
    format: seconds
  - symbol: t0
    label: baseline seconds per call
    default: 0.001
    min: 1.0e-06
    max: 0.1
    format: seconds
  - symbol: t1
    label: accepted seconds per call
    default: 0.0008
    min: 1.0e-06
    max: 0.1
    format: seconds
  outputs:
  - symbol: base
    label: baseline total
    formula: n*t0
    format: seconds
  - symbol: tuned
    label: tuned total
    formula: A+n*t1
    format: seconds
  - symbol: saving
    label: total seconds saved
    formula: n*t0-A-n*t1
    format: seconds
```


[MATHEMATICALLY-DERIVED] **Tuning noise** can select an apparent winner even when true durations are equal. Assume independent zero-mean timing errors satisfying $\Pr(|e_j|>u)\leq2\exp[-u^2/(2\sigma^2)]$. A union bound gives $\Pr(\max_j|e_j|>u)\leq2J\exp[-u^2/(2\sigma^2)]$ for $J$ candidates. Taking $u=\sigma\sqrt{2\log(2J/\delta)}$ bounds all errors with probability at least $1-\delta$. This analytical result uses stated sub-Gaussian assumptions; GPU timing noise is not asserted to satisfy them. It explains why increasing the search space without independent confirmation can increase selection bias.

[DERIVED] **Fallback paths** must preserve the caller's full semantic contract. A fallback that supports the output shape but drops alias semantics, ignores an epsilon choice, or casts to a lower precision is invalid. Log a categorical dispatch reason such as unsupported architecture, stride, dtype, workspace capacity or numerical mode. Keep fallback frequency and latency in deployment accounting. A common-shape fast path plus exact fallback can be preferable to many rarely reused specializations, especially when cold-start and cache capacity matter.

## Algorithm

[DERIVED] The book-authored bounded tuner takes finite candidate set $\mathcal C_k$, sealed correctness inputs $\mathcal Q_k$, separate timing inputs $\mathcal B_k$, and a budget $A_{\max}$. It returns a valid schedule or fallback.

$$
\begin{aligned}
(1)&\quad\mathcal C'\gets\{c\in\mathcal C_k:\operatorname{StaticPreconditions}(c,k)\};\quad\mathcal C_{\rm passed}\gets\varnothing;\quad a\gets0.\\
(2)&\quad\text{for }c\text{ in randomized }\mathcal C':\quad a\ge A_{\max}\Rightarrow\mathrm{break};\quad\operatorname{setTimeout}(A_{\max}-a).\\
(3)&\quad\neg\operatorname{ParityFromRestoredState}(c,\mathcal Q_k)\Rightarrow\{\operatorname{chargeCost}(a,c);\ \mathrm{continue}\}.\\
(4)&\quad\operatorname{measureFromRestoredState}(c,\mathcal B_k);\quad\operatorname{chargeCost}(a,c);\quad\operatorname{completed}(c)\Rightarrow c\in\mathcal C_{\rm passed}.\\
(5)&\quad\mathcal C_{\rm passed}=\varnothing\Rightarrow\operatorname{returnFallback};\quad c^*\gets\arg\min_{c\in\mathcal C_{\rm passed}}\operatorname{declaredStatistic}(T_c).\\
(6)&\quad\neg\operatorname{IndependentConfirm}(c^*)\Rightarrow\operatorname{returnFallback}.\\
(7)&\quad\operatorname{cache}(k,c^*,\mathrm{binaryHash},\mathrm{conditions});\quad\operatorname{return}(c^*).
\end{aligned}
$$

The invariant is that no unvalidated candidate enters the reusable cache. Stop after the budget or finite set is exhausted. Complexity is the sum of compilation and repeated execution costs; metadata alone is linear in candidates times test cells. An empty passed set is a valid outcome. Restore mutable inputs before each measured invocation, not just once per candidate. Compilation, parity checks and timed search all consume the search budget, including failed candidates; a timed-out candidate is discarded and process/device health must be requalified before continuing. Confirmation uses a separately declared budget and fresh restored state. A hard time budget requires an executor capable of cancellation; a post-hoc stopwatch alone only detects an overrun. Independent confirmation is a proposed measurement, not a check performed in this edition.

## Implementation

[OFFICIAL-DOCUMENTATION] **Triton language**, in *Kernels / numerics / collectives*, exposes configuration search and reset/restore controls in the inspected 3.8 artifact. [R26.16], `python/triton/runtime/autotuner.py`. [DERIVED] **NVIDIA CUDA** and **AMD HIP**, in *Accelerator / driver / compiler*, provide target-specific compilation and device capability boundaries; **NVIDIA CUTLASS** supplies architecture-specific instances. Keep a shape manifest, capability predicate, numerical policy, selected configuration, compilation logs and fallback implementation together. The manifest is a testable dispatch contract, not a claim that all targets were run.


```figure
id: fig-26.17
kind: compare
title: Portability has multiple acceptance boundaries
caption: This analytical comparison keeps mathematical validity separate from source compatibility and warmed timing.
  Every cell requires the target-specific evidence named in the row.
placement: wide
evidence: DERIVED
source: DERIVED:eq-26.7
alt: This analytical comparison keeps mathematical validity separate from source compatibility and warmed timing.
  Every cell requires the target-specific evidence named in the row.
concepts:
- ms.section.26.5
spec:
  axis: What must remain valid when a kernel route changes target or compiler
  columns:
  - id: source
    label: Same source
  - id: semantic
    label: Same operator
  - id: cost
    label: Accepted deployment cost
  rows:
  - dimension: Changed architecture
    values:
      source: May compile through another backend
      semantic: Recheck supported instructions and ordering
      cost: Retune and measure all required cells
  - dimension: Changed dtype
    values:
      source: May share frontend syntax
      semantic: Recheck accumulation and tolerance
      cost: Count scale/cast/workspace costs
  - dimension: Changed compiler
    values:
      source: Source can remain identical
      semantic: Recheck output and gradient parity
      cost: Archive new binary and cold cost
  - dimension: Unsupported input
    values:
      source: Compilation may reject it
      semantic: Exact fallback must cover it
      cost: Include fallback latency and frequency
```


[DERIVED] Tuning leaves the operator semantics, learned parameter count and valid token count fixed. Its extra cost is compilation, failed and accepted trials, restored state, candidate storage and any conversion needed by the selected route. Those costs belong in cold amortization even if the chosen warm kernel is faster. Cross-device tuning needs separately recorded transfer and provisioning costs. No energy or money optimum follows from a latency optimum without measured power, dated pricing and an explicit objective; those outcomes are UNVERIFIED.

## Experimental design

[NOT-DISCLOSED] The inspected autotuner artifact does not provide a source-independent benchmark proving best schedule selection across all devices and input families. [ASSUMED] The proposed experiment holds candidate set and correctness policy fixed while varying specialization key granularity. Measure fresh-process cold cost, warmed operator cost, cache entries/bytes, fallback cells and total duration over a sealed request sequence. Confirm finalists on an independent timing pass; retain per-repetition events. Change one compiler revision at a time and rerun numerical checks before comparing duration. Report thermal state and cache regime rather than assuming noise is independent.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] Triton 3.8 exposes tuning diagnostics and cache-related runtime changes. It does not promise globally optimal or portable candidate selection.

**What the evidence shows.** [DERIVED] Selection inputs and outcomes are inspectable in the pinned artifact. They do not substitute for an independent workload test.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 26.7 makes compile/tune amortization explicit. The stated union-bound example explains how search multiplicity can amplify noisy selection.

**What remains unknown.** [UNVERIFIED] Actual reuse counts, timing distributions, target residency, optimal key partition and cross-device numerical behavior remain unmeasured.

## Failure modes

[DERIVED] Missing strides or numerical flags in a key can reuse an invalid schedule. Tuning a mutable update without restoration changes the problem between candidates. Cache entries can outlive the compiler or binary assumptions that justified them. A timeout can poison process state and contaminate later measurements. A warm-cache winner can lose under streaming data. Diagnose these with key audits, state hashes, fresh-process confirmation and explicit cache-regime ablations.

## Siblings

[DERIVED] Static specialization spends compilation/storage for local efficiency; dynamic kernels spend runtime checks and conservative schedules for broader coverage; library dispatch delegates candidate construction. None removes the validity condition. Graph-level recompilation is developed in [§28.2](../ch28-frameworks-graph-compilers-and-runtime-integration/28-2-compilation-pipeline.md).

## Extensions

[OFFICIAL-DOCUMENTATION] PyTorch 2.14's NVGEMM route competes with other valid compiler candidates. [R26.11], NVGEMM heading. [DERIVED] Adding a backend enlarges the candidate set and its integration burden; it requires the same correctness filters and independent timing confirmation.

## Limitations

[DERIVED] The analytical cost model assumes a finite request sequence and excludes service queueing, device sharing and distributed contention. The occupancy bound is a resource upper bound, not a predictor of achieved throughput. No claimed speedup is inferred from candidate count.

## Reproducibility

[DERIVED] Store all tried configurations, rejection reasons, state-reset policy, exact cache key, binary/compiler hashes and raw samples. Preserve the fallback and a way to disable cached tuning. Verification remains unexecuted.

## References

[R26.16] Triton 3.8 release and pinned autotuner; [R26.11] PyTorch 2.14 release. Dated provenance is in [references.md](references.md).
