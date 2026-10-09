---
id: ms.section.29.1
entity_type: section
title: Data/state parallelism
short_title: Data/state parallelism
volume: 2
part: 5
chapter: 29
section: 29.1
slug: 29-1-data-state-parallelism
parent: ms.chapter.29
prev_sibling: null
next_sibling: ms.section.29.2
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

# 29.1 — Data/state parallelism

## Scope

[DERIVED] This section owns replicated data parallelism and the partitioning of parameter, gradient, and optimizer state. The correctness target is the same token-weighted synchronous update as a declared unpartitioned reference, within stated floating-point tolerance. The performance target is feasible peak memory and explained exposed communication. Sources were first published or released between 2025-12-01 and 2026-10-09. The mathematical mechanisms are taught through original derivations; they are not claimed to have originated within that interval.

## Why this exists

[MATHEMATICALLY-DERIVED] Replication duplicates persistent state. Increasing the data-parallel degree reduces the local batch, not replicated parameter or optimizer bytes. Once this state exceeds available memory, faster computation cannot make the layout feasible. Sharding changes which rank owns each state element and introduces reconstruction or reduction edges wherever an operator requires a different representation. The correctness obligation is to retain one logical optimizer transition across those physical ownership changes.

[PAPER-REPORTED] Piper explicitly distinguishes replicated data parallelism from optimizer/gradient/parameter sharding and studies composition with pipeline parallelism. Its background and scheduling interface expose these choices separately. This supports treating placement and execution order as different controls, without establishing universal framework support for every combination. [R29.3], §2, §4.1, §6.2.

[DERIVED] Two questions follow: does the algorithm implement the intended update, and can its live tensors be scheduled within the device budget? Persistent bytes alone answer neither the reconstruction peak nor synchronization correctness. A sharding configuration remains incomplete until groups, dtypes, buckets, prefetch policy, parameter retention, and optimizer boundaries are specified. A smaller persistent state can coexist with a larger peak if aggressive prefetching retains several reconstructed buckets.

## Intuition

[MATHEMATICALLY-DERIVED] Gradient summation is linear; adaptive optimization generally is not. It is legal to distribute a gradient sum and assign separate parameter coordinates to owners. Applying nonlinear local updates and averaging resulting weights generally changes the algorithm. State sharding preserves coordinate ownership of one global optimizer; independent local optimizers require a separate equivalence argument.

[MATHEMATICALLY-DERIVED] Averaging rank means also differs from averaging target losses. If one rank has one valid target with gradient two and another has three targets with zero gradient, the rank mean is one and the target mean is one half. Packing, padding, and variable-length examples make this distinction operational. Equal sequence counts do not imply equal valid-target counts, and the loss reduction must be chosen before a collective's averaging convention.

## Formulation

| Symbol | Meaning | Shape / unit |
|---|---|---|
| $d$ | Data-parallel group size | Integer |
| $n_r$ | Valid targets on rank $r$ per optimizer step | Tokens |
| $N$ | Parameter count in the considered model partition | Parameters |
| $b_w,b_g,b_o$ | Weight, gradient, combined optimizer-state storage | Bytes/parameter |
| $A_r(t),Q_r(t),W_r(t)$ | Live activations, communication buffers, workspace | Bytes |
| $g_r$ | Gradient of local summed loss | $\mathbb R^N$ |

[MATHEMATICALLY-DERIVED] Starting from common weights, the target gradient is

$$
g=\frac{\sum_{r=0}^{d-1}g_r}{\sum_{r=0}^{d-1}n_r},\qquad
g_r=\nabla_\theta\sum_{i\in\mathcal B_r}\ell_i(\theta).
$$

*(Eq. 29.1)*

[MATHEMATICALLY-DERIVED] Disjoint owner sets $\mathcal I_r$ cover every parameter coordinate once. An update $(\theta_i,s_i)\mapsto\mathsf U(\theta_i,s_i,g_i)$ can run on owner $i$ after global reduction if its state transition is coordinate-separable. Global clipping adds a scalar coupling; compute its norm from unique gradient shards. Matrixwise optimizers can require larger coupled tensors, so a scalar norm reduction alone does not establish equivalence.

## Mechanism

### Ownership, precision, and live state

[MATHEMATICALLY-DERIVED] Equal shards and negligible padding yield persistent bytes

$$
\begin{aligned}
M_{\rm rep}&=N(b_w+b_g+b_o),\\
M_{\rm opt}&=N(b_w+b_g+b_o/d),\\
M_{\rm grad}&=N(b_w+(b_g+b_o)/d),\\
M_{\rm full}&=N(b_w+b_g+b_o)/d.
\end{aligned}
$$

*(Eq. 29.2)*

[DERIVED] These ownership patterns are conventionally named ZeRO stages 0, 1, 2, and 3. Here those names identify the table's partitioning patterns, without relying on an excluded historical citation. An FSDP variant must still specify actual placements. A stage number does not state whether a master weight exists, whether accumulated gradients use FP32, or whether full parameters persist between operations. A low-precision weight is not evidence of low-precision optimizer moments.

[MATHEMATICALLY-DERIVED] Peak memory is

$$
M_{r,\rm peak}=\max_t\left[M_{r,\rm persistent}+M_{r,\rm reconstructed}(t)
+A_r(t)+Q_r(t)+W_r(t)\right].
$$

*(Eq. 29.3)*

[DERIVED] Current and prefetched buckets may coexist. Keeping reconstructed weights through backward saves communication but extends their lifetime. The decision variable is a lifetime schedule. Adding independently observed maxima from different times provides a conservative bound, not the exact shared-trace peak. Allocation and reserved-memory measurements also have different boundaries; neither alone describes registration caches, transport allocation, or other device users.

```figure
id: fig-29.1
kind: memory-stack
title: Persistent state by ownership pattern
caption: Illustrative billion-parameter partition across eight ranks, using two-byte weights, four-byte gradients and twelve-byte optimizer state. Reconstruction, activations and transport allocation are excluded.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.2
alt: Replication stores eighteen billion bytes per rank. Optimizer sharding stores 7.5 billion, gradient sharding four billion, and full sharding 2.25 billion bytes.
spec:
  format: bytes
  variables: {N: 1000000000, d: 8, bw: 2, bg: 4, bo: 12}
  bars:
    - label: Replicated
      segments:
        - {label: Weights, formula: N*bw}
        - {label: Gradients, formula: N*bg}
        - {label: Optimizer, formula: N*bo}
    - label: Optimizer sharded
      segments:
        - {label: Weights, formula: N*bw}
        - {label: Gradients, formula: N*bg}
        - {label: Optimizer, formula: N*bo/d}
    - label: Gradients sharded
      segments:
        - {label: Weights, formula: N*bw}
        - {label: Gradients, formula: N*bg/d}
        - {label: Optimizer, formula: N*bo/d}
    - label: Fully sharded
      segments:
        - {label: Weights, formula: N*bw/d}
        - {label: Gradients, formula: N*bg/d}
        - {label: Optimizer, formula: N*bo/d}
```

### Synchronization and reconstruction traffic

[MATHEMATICALLY-DERIVED] Count bytes sent by one rank, excluding received traffic, headers, and retransmission. An equal-shard ring all-reduce of $Nb_g$ bytes sends $2(d-1)Nb_g/d$. A fully sharded step with $k$ full-weight reconstructions and one gradient reduce-scatter sends

$$
V_{\rm full}=\frac{d-1}{d}N(kb_w+b_g).
$$

*(Eq. 29.4)*

[DERIVED] The reconstruction count $k$ is a schedule input. Retention, recomputation, accumulation, and bucket reuse can change it. A distributed optimizer with replicated weights also exchanges updated owner shards. Counting both a complete gradient all-reduce and a complete owner exchange without identifying how they are composed can double-count communication. Distinguish application payload from link traffic and bidirectional accounting before comparing a trace against this equation.

```figure
id: fig-29.2
kind: calculator
title: Reconstruction traffic sensitivity
caption: Weight reconstruction count controls the communication price of transient-memory savings. This ideal ring payload model is illustrative and does not predict measured bandwidth.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.4
alt: Per-rank sent bytes equal the nonlocal fraction times the parameter count times reconstructed weight bytes plus gradient bytes. More reconstructions raise traffic linearly.
spec:
  tex: V=(d-1)N(kb_w+b_g)/d
  equation: '29.4'
  inputs:
    - {symbol: N, label: Parameters, default: 1000000000, min: 1000000, max: 100000000000, scale: log10, format: params}
    - {symbol: d, label: Data ranks, default: 8, min: 2, max: 256, scale: log2, format: integer}
    - {symbol: k, label: Weight reconstructions, default: 2, min: 1, max: 8, format: integer}
    - {symbol: bw, label: Weight bytes, default: 2, min: 1, max: 4, options: [1, 2, 4]}
    - {symbol: bg, label: Gradient bytes, default: 4, min: 2, max: 4, options: [2, 4]}
  outputs:
    - {symbol: V, label: Sent bytes per rank, formula: (d-1)*N*(k*bw+bg)/d, format: bytes, emphasis: true}
```

## Algorithm

**Algorithm 29.1 — Token-normalized owner update.** [MATHEMATICALLY-DERIVED] Inputs are common step-$t$ weights, disjoint ownership, local summed gradients, valid-target counts, clipping threshold $c$, and a coordinate-separable optimizer. Output is one logically complete updated state. The collective sums, rather than averages; an averaging implementation requires one explicit correction.

$$
\begin{aligned}
1.\quad &n\gets\operatorname{AllReduce}_{\rm sum}(n_r),\quad n=0\Rightarrow\operatorname{return}(\bot).\\
2.\quad &\bar g_{\mathcal I_r}\gets\operatorname{ReduceScatter}_{\rm sum}(g_r)/n.\\
3.\quad &\operatorname{AllReduce}_{\rm min}(\operatorname{finite}(\bar g_{\mathcal I_r}))=0\Rightarrow\operatorname{return}(\mathcal S_t,\mathrm{skip}).\\
4.\quad &q\gets\operatorname{AllReduce}_{\rm max}\bigl(\max(\{0\}\cup\{|\bar g_i|:i\in\mathcal I_r\})\bigr).\\
5.\quad &z\gets\begin{cases}0,&q=0,\\\operatorname{AllReduce}_{\rm sum}(\sum_{i\in\mathcal I_r}(\bar g_i/q)^2),&q>0;\end{cases}\\
6.\quad &a\gets\begin{cases}1,&q=0,\\\min(1,(c/q)/\sqrt z),&q>0;\end{cases}\quad h_{\mathcal I_r}\gets a\bar g_{\mathcal I_r}.\\
7.\quad &\operatorname{AllReduce}_{\rm min}(\operatorname{finite}(h_{\mathcal I_r}))=0\Rightarrow\operatorname{return}(\mathcal S_t,\mathrm{skip}).\\
8.\quad &(\theta_{t+1,\mathcal I_r},s_{t+1,\mathcal I_r})\gets\mathsf U(\theta_{t,\mathcal I_r},s_{t,\mathcal I_r},h_{\mathcal I_r});\quad\operatorname{return}(\mathcal S_{t+1}).
\end{aligned}
$$

[DERIVED] The invariant is unique ownership and a common optimizer clock. Termination follows completion of all owner updates; a transport failure rejects the logical transition. Accumulation sums token losses across microbatches before line 2. Require finite $c>0$. Lines 4-6 form a scaled global norm: $\|\bar g\|_2=q\sqrt z$ in real arithmetic, while the clip factor can be computed without materializing that possibly overflowing product. Naively squaring large finite gradients can overflow the norm, produce a zero clip factor, and silently accept finite zero gradients; checking finiteness only after clipping does not prevent that error. Accumulation for $z$ must still cover its declared count/range, and any numerical-range failure rejects the step. Replicated gradients must not be counted repeatedly in line 5. Tensor-sharded parameters require a norm group containing each logical coordinate once across model and data axes. Weight decay, bias correction, loss scaling, and step skipping must use the same update counter on every owner.

## Implementation

[OFFICIAL-DOCUMENTATION] PyTorch 2.13 documents an opt-in separate reduce-scatter group for FSDP2, enabling concurrency with all-gather instead of sharing a serialized communicator. The release marks the API unstable. [R29.1], “FSDP2 Separate Reduce-Scatter Group”. The version-specific capability does not establish a speedup on an unspecified topology.

[DERIVED] PyTorch FSDP2 occupies **Distributed training**; PyTorch occupies **Model / autograd framework**; NVIDIA NCCL occupies **Kernels / numerics / collectives**. Specify shard representations, local optimizer construction, mixed-precision conversion, bucket events, and post-backward ownership. Host enqueue completion is not device completion. A buffer becomes reusable only after every consumer and transport has completed access. Merely placing operations on different streams does not create independent network capacity.

```figure
id: fig-29.3
kind: systems-trace
title: One sharded bucket lifetime
caption: Ownership changes impose event dependencies. Prefetching adds simultaneously live full weights; successful reduction alone does not authorize early buffer reuse.
evidence: DERIVED
source: DERIVED:eq-29.3
alt: A resident owner shard becomes full weights, is consumed, is released after its last read, and produces reduced gradients for an owner update. Each stage identifies memory and a failure condition.
spec:
  columns: [memory, communication, failure]
  stages:
    - {name: Owner resident, values: {memory: Weight and optimizer shards, communication: None, failure: Wrong owner mapping}}
    - {name: Reconstruct, values: {memory: Full weights plus owner state, communication: All-gather, failure: Read before device completion}}
    - {name: Consume, values: {memory: Activations and full weights, communication: Next-bucket prefetch, failure: Prefetch exceeds headroom}}
    - {name: Reduce, values: {memory: Gradient input and owner output, communication: Reduce-scatter sum, failure: Double token normalization}}
    - {name: Update, values: {memory: Owner state and gradient shard, communication: Norm and finite reductions, failure: Divergent optimizer clocks}}
```

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] The inspected release announcement identifies the communicator change without supplying a workload-specific FSDP2 timing distribution or convergence experiment. [R29.1], distributed-training section. Its API claim is documented; the local performance outcome remains **UNVERIFIED**. Reading a release does not measure allocator headroom or establish that other installed packages expose the same option.

### Proposed verification

[ASSUMED] Compare all four ownership patterns at identical logical tokens, initialization, masking, hyperparameters, and update count. Include deliberately unequal valid-target counts. Compare one step and a short trajectory against an FP32 reference before timing. Sweep bucket size and retention; record per-rank allocated/reserved memory, reconstruction count, sent payload, exposed communication, and step-time quantiles. Preserve token identifiers to reject accidental changes in training data. [Experiment 29.1](verification.md) is unexecuted.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The eligible release exposes a separate communicator for FSDP2 sharding collectives. [R29.1], cited heading.

**What the evidence shows.** [DERIVED] This establishes a scheduling control, without independent convergence or throughput evidence for this manuscript's environment.

**What we infer.** [MATHEMATICALLY-DERIVED] Equations 29.2–29.4 permit lower persistent bytes with higher traffic or a larger reconstruction peak.

**What remains unknown.** [UNVERIFIED] Local numerical parity, allocator behavior, and the optimum retention policy remain unmeasured.

## Failure modes

[MATHEMATICALLY-DERIVED] Rank-mean averaging changes the target objective when token counts differ. Local clipping changes the update because clipping is nonlinear. Local finite decisions can diverge optimizer clocks. Releasing reconstructed weights while delayed backward reads remain violates liveness even if the final memory total is correct. Diagnose with token counts, owner intervals, bucket IDs, collective sequence numbers, and optimizer counters; throughput cannot reveal these errors.

[DERIVED] Tied weights and padded shards need explicit identity rules. Two physical views of one logical parameter must not receive duplicate updates. A parameter unused by one rank cannot simply disappear from a collective required by peers. A hang, missing gradient, or divergence requires a correctness trace before tuning transport settings. Checkpoint state must preserve the logical owner-independent parameter identity, not rely on incidental rank numbering.

## Siblings

[DERIVED] Replication removes reconstruction at the memory cost in Eq. 29.2. Full sharding changes storage ownership while preserving the objective. [Tensor parallelism](29-2-tensor-and-pipeline-parallelism.md) partitions operators and introduces activation exchange. [Expert parallelism](29-4-expert-parallelism.md) assigns token-dependent destinations and dynamic counts. Their GPU multipliers are not interchangeable: the binding capacity and dependency constraints differ.

## Extensions

[DERIVED] Hybrid sharding can reconstruct inside a fast local group and synchronize corresponding shard replicas across slower links. The groups have distinct ownership and reduction obligations; a local reduction alone omits remote data contributions. Communication quantization changes the numerical representation and needs its own error analysis. Offload relocates state rather than eliminating it; its transfer and live-buffer tradeoffs belong in [§29.6](29-6-joint-optimization.md).

## Limitations

[MATHEMATICALLY-DERIVED] State estimates assume balanced shards; traffic assumes a ring without compression or deduplication. They do not estimate energy or money without measured power, duration, and pricing. The optimizer argument assumes coordinate-separable transitions after declared reductions. Matrix-coupled updates, stale gradients, asynchronous local steps, and changing membership need additional invariants. Violating these assumptions invalidates equivalent synchronous-update claims.

## Reproducibility

[DERIVED] Retain tensor IDs and shapes, owner intervals, state dtypes, group order, loss normalization, clipping/finite-check groups, bucket boundaries, prefetch distance, reshard policy, and optimizer counters. Record builds, transport settings, and topology. A cited release is a reading boundary, not an installed environment. **UNVERIFIED:** no distributed training, numerical comparison, energy, cost, or throughput experiment was executed.

## References

[R29.1](references.md#r291), PyTorch 2.13 distributed-training disclosure; [R29.3](references.md#r293), Piper §2, §4.1, §6.2. Analytical figures cite this section's equations.
