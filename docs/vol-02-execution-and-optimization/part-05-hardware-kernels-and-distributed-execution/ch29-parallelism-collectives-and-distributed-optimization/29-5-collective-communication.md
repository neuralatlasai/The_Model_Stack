---
id: ms.section.29.5
entity_type: section
title: Collective communication
short_title: Collective communication
volume: 2
part: 5
chapter: 29
section: 29.5
slug: 29-5-collective-communication
parent: ms.chapter.29
prev_sibling: ms.section.29.4
next_sibling: ms.section.29.6
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

# 29.5 — Collective communication

## Scope

[DERIVED] This section owns collective semantics, idealized ring/tree costs, all-to-all and point-to-point exchange, and the boundaries between NCCL/RCCL, MPI/UCX and NVSHMEM. The target is a correct logical tensor transformation with declared completion and ordering semantics. Faster device time is useful only if it reduces exposed application time without violating numerical or buffer-lifetime contracts. Primary artifact claims are pinned to eligible 2025-12-01–2026-10-09 releases; the algebra is an original derivation.

## Why this exists

[MATHEMATICALLY-DERIVED] Distributed placement creates information dependencies that a transport must satisfy. A collective names the global result, not a unique implementation or physical route. The same all-reduce can use different algorithms, protocols, channels and hierarchy choices. Its performance depends on message size, launch latency, reduction arithmetic, topology, concurrent traffic and resource occupancy. Replacing a communication call without preserving its mathematical and completion contracts can corrupt training while apparently improving a microbenchmark.

[OFFICIAL-DOCUMENTATION] NCCL 2.29.7 adds hierarchical symmetric reduce-scatter kernels with stated prerequisites, communicator suspend/resume, and changes to GIN ordering and compatibility. [R29.8], named release sections. NVSHMEM 3.8.0 describes scoped completion/visibility limitations. [R29.12], Limitations. These disclosures make clear that a library name alone does not settle the ordering, capability or memory budget of an application.

[DERIVED] Measure what is exposed on the application's critical path. A collective overlapped with independent computation can have high isolated duration but low step-time impact. Conversely, a short all-to-all that delays a pipeline dependency can dominate a bubble. Network bandwidth and application throughput are related by the execution graph, not interchangeable metrics.

## Intuition

[MATHEMATICALLY-DERIVED] Reduction combines values; gathering preserves distinct values; scattering assigns different results to different owners. All-to-all transposes source/destination ownership without reducing data. These distinctions determine both payload and backward algebra. Point-to-point is an elementary transport interface; using it to implement a collective still requires a complete schedule and matching peer contracts.

[MATHEMATICALLY-DERIVED] The latency/bandwidth tradeoff follows from the number of serial rounds and bytes per round. A ring has many small stages but distributes large payload efficiently. Recursive halving/doubling uses fewer stages under suitable rank counts and routing. Those statements are properties of the analytical algorithms defined below, not guarantees that a particular library selects them on a given machine.

## Formulation

| Symbol | Meaning | Shape / unit |
|---|---|---|
| $d$ | Participant count | Integer |
| $S$ | Full logical tensor payload | Bytes |
| $\alpha$ | Per-serial-stage startup cost | Seconds |
| $\beta$ | Per-byte transfer cost in the model | Seconds/byte |
| $\gamma$ | Per-byte reduction cost in the model | Seconds/byte |
| $x_r$ | Rank-local input | Declared common shape |
| $Q_{\rm cut},B_{\rm cut}$ | Required crossing bytes and available cut bandwidth | Bytes, bytes/s |

[MATHEMATICALLY-DERIVED] The semantic contracts are

$$
\begin{aligned}
\operatorname{AR}(x)_r&=\sum_jx_j,\\
\operatorname{RS}(x)_r&=\left[\sum_jx_j\right]_{\mathcal I_r},\\
\operatorname{AG}(x)_r&=\operatorname{concat}_j x_j,\\
\operatorname{A2A}(x)_r&=\operatorname{concat}_j x_{j\to r}.
\end{aligned}
$$

*(Eq. 29.14)*

[DERIVED] The reduce-scatter owner sets are disjoint and exhaustive. All-gather concatenation order and all-to-all split sizes are part of the contract. An averaging all-reduce includes an additional factor $1/d$; substituting it for the sum without changing loss normalization changes the result. Unequal splits and zero-length messages need explicit support and peer agreement.

## Mechanism

### Ring accounting

[MATHEMATICALLY-DERIVED] Divide $S$ into $d$ equal chunks. A ring reduce-scatter executes $d-1$ serial exchanges of $S/d$ bytes, accumulating partial reductions. Each rank ends with one reduced chunk. A ring all-gather circulates those reduced chunks over another $d-1$ stages. Hence

$$
T_{\rm ring}\approx2(d-1)\alpha+
2\frac{d-1}{d}S\beta+\frac{d-1}{d}S\gamma.
$$

*(Eq. 29.15)*

[MATHEMATICALLY-DERIVED] The adjustable instrument substitutes $\beta=1/B$ and $\gamma=1/R$, where $B$ and $R$ are assumed transfer and reduction service rates in bytes/s. These are coefficients of the uniform additive model, not advertised device bandwidth or independently established collective throughput.

```figure
id: fig-29.20
kind: calculator
title: Ring payload and service decomposition
caption: Change payload, rank count, startup and the assumed service rates in Eq. 29.15. Per-rank sent bytes, startup, transfer and reduction are separated. This uniform additive model deliberately excludes congestion and transfer/reduction overlap; the outputs are analytical examples.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.15
alt: An eight-rank ring sends seven quarters of the full input tensor per rank. Increasing ranks adds startup rounds even as the sent-byte factor approaches two. The displayed modeled time includes separate transfer and reduction terms.
spec:
  tex: 'T=2(d-1)\alpha+2\frac{d-1}{d}\frac{S}{B}+\frac{d-1}{d}\frac{S}{R}'
  equation: '29.15'
  inputs:
    - {symbol: S, label: Full input tensor bytes, default: 268435456, min: 1024, max: 1073741824, scale: log2, format: bytes}
    - {symbol: d, label: Participating ranks, default: 8, min: 2, max: 128, options: [2, 4, 8, 16, 32, 64, 128], format: integer}
    - {symbol: alpha, label: Startup per serial exchange, default: 0.000005, min: 0.0000001, max: 0.001, scale: log10, format: seconds}
    - {symbol: B, label: Assumed transfer service rate, default: 50000000000, min: 1000000000, max: 1000000000000, scale: log10, format: bytes/s}
    - {symbol: R, label: Assumed reduction service rate, default: 1000000000000, min: 1000000000, max: 10000000000000, scale: log10, format: bytes/s}
  outputs:
    - {symbol: V, label: Sent payload per rank, formula: 2*(d-1)*S/d, format: bytes}
    - {symbol: A, label: Serial startup term, formula: 2*(d-1)*alpha, format: seconds}
    - {symbol: X, label: Transfer term, formula: 2*(d-1)*S/(d*B), format: seconds}
    - {symbol: Q, label: Reduction term, formula: (d-1)*S/(d*R), format: seconds}
    - {symbol: T, label: Additive ring model time, formula: 2*(d-1)*alpha+2*(d-1)*S/(d*B)+(d-1)*S/(d*R), format: seconds, emphasis: true}
  presets:
    - {label: Small startup-sensitive tensor, values: {S: 1024, d: 16, alpha: 0.000005, B: 50000000000, R: 1000000000000}}
    - {label: Large payload at eight ranks, values: {S: 1073741824, d: 8, alpha: 0.000005, B: 50000000000, R: 1000000000000}}
    - {label: Lower assumed transfer service, values: {S: 268435456, d: 8, alpha: 0.000005, B: 10000000000, R: 1000000000000}}
```

[MATHEMATICALLY-DERIVED] Sent payload per rank is $2(d-1)S/d$. This is not the logical input size, nor the sum of sent and received bytes. The reduction term counts the reduce-scatter work under a uniform per-byte cost. Real implementations can overlap transfer/reduction and pipeline chunks, so the additive expression is a teaching model and must be fitted or replaced before prediction.

### Recursive schedules and irregular exchange

[MATHEMATICALLY-DERIVED] For power-of-two $d$, recursive halving reduce-scatter and recursive doubling all-gather have $2\log_2d$ serial stages and the same total payload as the ring:

$$
T_{\rm hd}\approx2\log_2d\,\alpha+
2\frac{d-1}{d}S\beta+\frac{d-1}{d}S\gamma.
$$

*(Eq. 29.16)*

[DERIVED] Equal $\beta$ and $\gamma$ across these schedules are explicit simplifications. Real routes, channel occupancy, congestion and synchronization can differ, so fewer rounds alone do not prove a faster large-message algorithm. A generic tree reduction followed by broadcast can have different byte and bottleneck properties; it should not be assigned Eq. 29.16 merely because both use a logarithmic stage count.

```figure
id: fig-29.13
kind: diagram
title: All-reduce as ownership transitions
caption: The decomposition first combines values into unique reduced owner shards, then replicates the complete reduced tensor. The intermediate state is useful when the optimizer consumes only owner gradients.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-29.14
alt: Distinct rank contributions enter reduce-scatter, producing nonoverlapping reduced owner shards. All-gather then creates a full reduced tensor on every rank. An owner optimizer can consume the shards before replication.
spec:
  direction: LR
  nodes:
    - {id: inputs, kind: tensor, label: Rank-local contributions}
    - {id: rs, kind: process, label: Reduce-scatter sum}
    - {id: owners, kind: tensor, label: Unique reduced owner shards}
    - {id: ag, kind: process, label: All-gather}
    - {id: full, kind: tensor, label: Full reduced tensor on all ranks}
    - {id: optimizer, kind: state, label: Owner optimizer update}
  edges:
    - {from: inputs, to: rs}
    - {from: rs, to: owners, kind: emphasis}
    - {from: owners, to: ag}
    - {from: ag, to: full}
    - {from: owners, to: optimizer, kind: dependency}
```

[MATHEMATICALLY-DERIVED] A balanced pairwise all-to-all with $S/d$ bytes for every destination sends $(d-1)S/d$ remote bytes per rank over $d-1$ peer rounds. Irregular expert traffic instead requires its full count matrix. For any physical partition of the machine,

$$
T\ge Q_{\rm cut}/B_{\rm cut}.
$$

*(Eq. 29.17)*

[DERIVED] The cut bound needs the traffic's direction and a matching aggregate bandwidth definition. A sum of NIC line rates is not a valid substitute if the switch cut is oversubscribed or traffic cannot use all rails. Application packing and registration can add constraints before bytes reach the cut. Point-to-point scheduling must also avoid circular waits and protect buffers until local/remote completion obligations are met.

```figure
id: fig-29.14
kind: chart
title: Serial-round cost in an idealized all-reduce
caption: Illustrative sixteen-rank model with five-microsecond startup and a shared analytical transfer coefficient. The comparison isolates round count; equal coefficients deliberately omit real routing and protocol differences.
evidence: MATHEMATICALLY-DERIVED
source: [DERIVED:eq-29.15, DERIVED:eq-29.16]
alt: At small payloads the ring's thirty serial startups exceed the halving-doubling schedule's eight. At large payloads their identical assumed bandwidth term dominates. These curves are calculated, not measured.
spec:
  type: line
  x: {label: Full tensor bytes, scale: log10, domain: [1024, 1073741824], format: bytes}
  y: {label: Analytical duration, scale: log10, format: seconds}
  variables: {d: 16, alpha: 0.000005, beta: 0.00000000002, gamma: 0.000000000001}
  series:
    - {id: ring, label: Ring model, formula: 2*(d-1)*alpha+2*(d-1)*x*beta/d+(d-1)*x*gamma/d, sample: {from: 1024, to: 1073741824, count: 80}}
    - {id: hd, label: Halving and doubling model, formula: 2*log2(d)*alpha+2*(d-1)*x*beta/d+(d-1)*x*gamma/d, sample: {from: 1024, to: 1073741824, count: 80}, emphasis: true}
```

### Collective adjoints

[MATHEMATICALLY-DERIVED] A collective is a linear map $y=Ax$ when shapes, splits and reduction operator are fixed. Reverse-mode differentiation requires $A^{\mathsf T}\bar y$, not a second arbitrary communication call. Under a global sum of losses across output replicas, the adjoint of all-gather is reduce-scatter sum; the adjoint of reduce-scatter sum is all-gather. All-to-all reverses its ownership permutation and split mapping. Averaging adds its corresponding scale. This follows from $\langle Ax,\bar y\rangle=\langle x,A^{\mathsf T}\bar y\rangle$.

[OFFICIAL-DOCUMENTATION] PyTorch 2.11 announces differentiable collectives for distributed training. [R29.13], distributed-training section. The release claim does not exempt an application from specifying how replicated losses and collective normalization compose. An autograd-enabled API cannot infer an intended global objective from ambiguous local loss definitions.

## Algorithm

**Algorithm 29.5 — Collective contract admission.** [DERIVED] Inputs are operation type, group order, input/output shapes, dtypes, splits, step/sequence identity, stream dependencies and buffer lifetimes. Output is a completed transformation or a rejected step. The handshake is a correctness model; production implementations may amortize it without removing its invariants.

$$
\begin{aligned}
1.\quad &D_r\gets(\mathrm{op,group,shape,dtype,splits,sequence});\quad\sigma_r\gets\operatorname{hash}(D_r).\\
2.\quad &\neg\operatorname{compatible}(\{D_r\})
\Rightarrow\operatorname{return}(\bot,\mathrm{contract}).\\
3.\quad &\operatorname{await}(\mathrm{producerEvents});\quad
e\gets\operatorname{enqueue}(A,x).\\
4.\quad &\operatorname{awaitDeviceCompleteOrFailure}(e);\quad[\operatorname{error}(e)\lor\operatorname{timeout}(e)]
\Rightarrow\{\operatorname{coordinatedInvalidateStep};\ \operatorname{return}(\bot)\}.\\
5.\quad &\operatorname{publish}(y,\mathrm{consumerEvents})\quad\text{after established device completion}.\\
6.\quad &\operatorname{registerDeferredRelease}(x,y;\operatorname{lastConsumerComplete}).\\
7.\quad &\operatorname{return}(y,A^{\mathsf T}\text{ contract for backward}).
\end{aligned}
$$

[DERIVED] Compatible variable splits are complementary across peers rather than identical arrays. The admission test uses structured descriptors: each source-to-destination send count must match the corresponding receive count, with agreed group ordering, dtype and operation-specific shapes. Hashes record descriptor identity but cannot reconstruct or prove complementary split compatibility by themselves. Line 4 waits for transport completion before returning a completed output; line 6 registers later safe reclamation without waiting for a caller that has not yet consumed the returned result. Timeout handling must be coordinated with the training transaction; continuing after one rank abandons a collective does not preserve Eq. 29.14. The invariant is matched participation, completed producers before reads, and no reuse before last consumption. Termination requires either completed transport or a bounded coordinated failure path.

## Implementation

[OFFICIAL-DOCUMENTATION] AMD RCCL's ROCm 7.2.0 release identifies RCCL 2.27.7 and revised fatal-error reporting. [R29.9], release title and Changed. UCX v1.20.0 describes GPU communication/device signaling and direct-NIC paths. [R29.10], UCP/UCT sections. NVSHMEM 3.8.0 describes symmetric GPU memory, host/device RMA, and explicitly limits certain ordering/visibility guarantees to source and destination processing elements. [R29.12], description, Features and Limitations.

[DERIVED] NCCL/RCCL are collective implementations in **Kernels / numerics / collectives**. MPI is an application communication interface family; an implementation such as Open MPI can select components backed by UCX. UCX is a communication substrate, not an optimizer or a universal collective scheduler. NVSHMEM exposes a partitioned-global-address-space interface and one-sided operations; application-visible completion and visibility still need a protocol. These are different layers, so substituting their names in a throughput comparison is not a controlled experiment.

[OFFICIAL-DOCUMENTATION] The inspected Open MPI v5.0.10 tag contains February 2026 changelog entries for UCX/OFI components and fault-handling changes, while the changelog heading still says release candidate 2. [R29.11], first release entry. The tag identity is recorded; stable-release qualification is **UNVERIFIED**. Neither a tag nor a launcher choice proves GPU-aware transport is active in a particular installation.

```figure
id: fig-29.15
kind: compare
title: Communication interfaces at different layers
caption: Compare semantic responsibility rather than branding. Every path still needs an application-level dependency and buffer-lifetime contract; the interfaces expose different units of control.
evidence: DERIVED
source: [R29.8, R29.9, R29.10, R29.11, R29.12]
alt: NCCL and RCCL expose collective or peer operations, MPI exposes application messaging and collectives, UCX supplies communication substrate operations, and NVSHMEM exposes symmetric-memory one-sided operations. None specifies optimizer semantics.
spec:
  axis: Which dependency and ownership contract the application delegates to the interface
  columns:
    - {id: nccl, label: NCCL or RCCL}
    - {id: mpi, label: MPI implementation}
    - {id: ucx, label: UCX substrate}
    - {id: shmem, label: NVSHMEM}
  rows:
    - dimension: Main application unit
      values: {nccl: Tensor collective or peer exchange, mpi: Message and communicator operation, ucx: Endpoint and transport operation, shmem: Symmetric-memory RMA or collective}
    - dimension: Required application proof
      values: {nccl: Matching groups and stream dependencies, mpi: Matching participation and completion, ucx: Endpoint and memory lifetime, shmem: Visibility and completion scope}
    - dimension: Optimizer transition
      values: {nccl: Outside interface, mpi: Outside interface, ucx: Outside interface, shmem: Outside interface}
```

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] The inspected NCCL/RCCL/UCX/Open MPI release records describe features and fixes, not a common cross-library workload with uncertainty estimates. [R29.8–R29.11]. They cannot establish a ranking. NVSHMEM states its tested compatibility and limitations, which are narrower than all environments an application might use. [R29.12], Compatibility and Limitations.

### Proposed verification

[ASSUMED] Test each required operation over message size, group size, dtype, split skew and physical placement. Record correctness, complete device latency, application-visible latency, payload convention, concurrent-compute slowdown, CPU progress cost and buffer allocation. Then repeat inside the training graph. A faster isolated collective with worse step time is not an improvement under the chapter's target. The protocol remains unexecuted.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] Eligible releases expose additional scheduling, device-operation and observability capabilities. [R29.8–R29.13], cited release sections.

**What the evidence shows.** [DERIVED] Feature records establish version-specific claims, not independent performance comparisons.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 29.15–29.17 bound the cost of explicit algorithms and physical cuts under stated assumptions.

**What remains unknown.** [UNVERIFIED] Installed capability, selected routes, numerical behavior and complete-step effects remain unmeasured.

## Failure modes

[DERIVED] Group-order mismatches, inconsistent collective sequences, wrong variable splits and early buffer reuse can hang or corrupt data. A one-sided flag without the necessary visibility relation can expose stale payload. A CPU progress path starved by affinity choices can stall otherwise idle GPUs. Reduction order changes rounding, so bitwise comparison is stronger than mathematical equivalence. Forced algorithms or protocol knobs can bypass beneficial selection and must be evaluated with their exact scope recorded.

## Siblings

[DERIVED] All-reduce yields replicated reduced results; reduce-scatter yields unique reduced owners; all-gather yields replicated concatenation; all-to-all redistributes distinct payloads. Choosing among them follows the consumer's placement. [State sharding](29-1-data-state-parallelism.md) can consume owner gradients directly; [expert parallelism](29-4-expert-parallelism.md) needs dynamic token exchange; [pipeline parallelism](29-2-tensor-and-pipeline-parallelism.md) needs stage-specific peer transfers. Their common transport does not make their dependency patterns equivalent.

## Extensions

[DERIVED] Hierarchical collectives can reduce locally before crossing a constrained inter-node cut, then distribute results locally. Chunking can expose overlap but adds startups and temporary buffers. Device initiation changes launch/control placement, not the fundamental required information. Dynamic group recovery additionally requires state consistency and a declared optimizer transaction boundary; a communicator surviving a port failure does not prove the entire training step remains valid.

## Limitations

[MATHEMATICALLY-DERIVED] The models omit routing variation, headers, retransmission, registration, overlap and SM contention. They do not identify the algorithm a library actually chooses. Cost and energy require complete-device/CPU/network measurements. Versioned release statements are not execution evidence. A recent documentation wrapper around an older standard does not make that standard new research; only the dated release-specific disclosures are used as factual evidence here.

## Reproducibility

[DERIVED] Retain operation/split semantics, group order, sequence IDs, payload convention, topology, NIC mapping, algorithms/protocols, channels, registration flags, process affinity, streams and event boundaries. Pin library build, plugin, driver and firmware. **UNVERIFIED:** no collective benchmark, GPU-aware transport check or cross-library comparison was executed.

## References

[R29.8](references.md#r298), NCCL 2.29.7; [R29.9](references.md#r299), RCCL ROCm 7.2.0; [R29.10](references.md#r2910), UCX v1.20.0; [R29.11](references.md#r2911), Open MPI v5.0.10 tag; [R29.12](references.md#r2912), NVSHMEM 3.8.0; [R29.13](references.md#r2913), PyTorch 2.11.
