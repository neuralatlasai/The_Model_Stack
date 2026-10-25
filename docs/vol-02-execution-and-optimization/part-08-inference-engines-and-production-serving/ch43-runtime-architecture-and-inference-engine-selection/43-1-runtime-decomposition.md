---
id: ms.section.43.1
entity_type: section
title: Runtime decomposition
volume: 2
part: 8
chapter: 43
section: 43.1
slug: 43-1-runtime-decomposition
parent: ms.chapter.43
prev_sibling: null
next_sibling: ms.section.43.2
children: []
prerequisites: [ms.chapter.26, ms.chapter.28, ms.chapter.29, ms.chapter.37, ms.chapter.40, ms.chapter.42]
downstream: [ms.chapter.44, ms.chapter.46, ms.chapter.47]
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [runtime_architecture, state_ownership], feedback_setting: [], modality: [text]}
papers: [P36, P37]
implementations: [impl.vllm, impl.sglang, impl.tensorrt-llm, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 43.1 — Runtime decomposition

## Scope

[DERIVED] An inference runtime is a stateful implementation of model execution, decoding and resource ownership. This section follows a request from API bytes through tokens, scheduler state, device execution and streamed output. Success means semantic preservation, finite resource ownership and a trace that explains execution cost. The baseline is a synchronous reference model loop. Scheduling policies belong to Chapter 44; state-allocation mathematics belongs to Chapter 42.

## Why this exists

[DERIVED] A synchronous loop hides coordination inside one call stack. Serving separates that stack into processes and asynchronous streams to use accelerators efficiently. The separation creates new obligations: which component owns tokenization, when cache space is reserved, how completed GPU work becomes a committed token, and when cancellation permits memory reuse. Faster kernels cannot repair a request whose template changed, whose output was sampled twice or whose resource was freed before a device read completed.

[OFFICIAL-DOCUMENTATION] The inspected vLLM V1 architecture separates API processes, engine cores and device workers; TensorRT-LLM's PyExecutor separates model execution, decoding, scheduling and resource management [R43.1, “V1 Process Architecture”; R43.13, “PyExecutor”]. These interfaces expose a useful decomposition, but their presence does not establish performance or reliability in an untested deployment.

## Intuition

[DERIVED] The runtime has a semantic path and a physical path. The semantic path determines the conditional distribution and stopping behavior. The physical path determines operators, dependencies and buffers. A scheduling decision can move physical work without intentionally changing the semantic path, but floating-point order, random-number assignment or prefix-state reuse can still alter outputs. Correctness therefore consists of explicit equivalence criteria at each boundary rather than a single claim that the model weights match.

## Formulation

> **Definition — Runtime execution contract.** [DERIVED] The model/input/decoding semantics, state transitions and resource lifetimes that an inference implementation promises for a specified artifact, configuration and device tuple.

| Local symbol | Meaning |
|---|---|
| $r=(i,e,x,\psi,\omega)$ | Request identity, generation epoch, token input, decoding specification and operational limits |
| $s_j$ | Request state at engine iteration $j$ |
| $\mathcal B_j$ | Ordered scheduled work with request IDs, positions and resource references |
| $E_j$ | Device-completion event for the corresponding work |
| $h_j,g_j,o_j$ | Host preparation, device execution and output-processing time per iteration |
| $\mathcal G=(\mathcal V,\mathcal E)$ | Execution dependency DAG with nonnegative stage durations $t_v$ |
| $n_{\rm flight},m_{\rm desc}$ | Maximum in-flight descriptors and bytes per descriptor |

[DERIVED] A request's logical state can be represented as

$$
s_j=(\text{phase},\text{committed tokens},\text{pending positions},
\text{resource handles},\text{grammar/RNG state},e).
$$
*(Eq. 43.1)*

where committed model-prefix tokens are accepted into model state, while published tokens are the subset delivered after output/stop processing; pending positions may still be executing. The state additionally retains the published-token cursor. A computed stop token or withheld stop-string suffix can belong to the model prefix without appearing in the client stream. The epoch disambiguates a reused external identifier from stale responses. Cache references alone do not reconstruct a conversation's intended token input.

## Mechanism

### Methodology

[DERIVED] The frontend validates an API request and resolves the immutable model/configuration identity. Tokenizer/template processing turns messages and modality inputs into exact model inputs. It must decide special tokens, truncation, position construction and target output format before scheduling. Different API wrappers can otherwise produce different token sequences for the same apparent message list.

[DERIVED] The request-state component owns committed output, limits, cancellation and decoding state. The scheduler produces work descriptors; the cache manager supplies resource handles and position mappings. The executor translates descriptors into tensors for one or more workers. Workers invoke model operators, kernels and collectives. A decoder turns logits into candidate tokens, then commits tokens according to the configured rule. Output processing converts committed tokens into client-visible stream events. These roles can share a process without becoming the same conceptual responsibility.

[DERIVED] A descriptor must include sufficient versioned identity to interpret every tensor: request epoch, model revision, adapter identity, cache format, token positions, batch order and valid-token mask. A buffer reused between iterations has to be protected until all consuming streams finish. Logical request completion is not by itself proof of device completion. Conversely, a completed forward pass is not proof that its result was accepted into the request's output.

[DERIVED] The critical-path latency of a dependency DAG is

$$
t_{\rm critical}=\max_{p\in\operatorname{Paths}(\mathcal G)}
\sum_{v\in p}t_v .
$$
*(Eq. 43.2)*

where paths respect both data and resource dependencies. Summing all observed CPU and GPU durations double-counts overlap; taking their maximum ignores dependencies that cannot overlap. A trace must show events and ordering, not only aggregate utilization.

[DERIVED] If host preparation for iteration $j+1$ is independent of the unresolved token value from iteration $j$, its metadata can overlap current device work. If preparation needs that token, a runtime may prepare structural fields using a future reference and resolve token-dependent fields later. This does not remove the dependency; it moves its resolution into a narrower stage. Any claimed overlap must preserve the relation between request order and generated tokens.

[DERIVED] For a repeated two-stage pipeline with constant host/device durations $h,g$ and $n$ iterations, idealized completion time is

$$
t_n=h+g+(n-1)\max(h,g),\qquad
t_{\rm serial}=n(h+g).
$$
*(Eq. 43.3)*

where output processing is excluded, no contention occurs, and buffering suffices. The limiting step time is the slower stage. A “zero overhead” label describes hidden host work in a particular trace, not zero CPU work, synchronization or memory traffic.

[DERIVED] Asynchrony requires bounded buffering:

$$
M_{\rm descriptors}\le n_{\rm flight}m_{\rm desc}.
$$
*(Eq. 43.4)*

where descriptor storage excludes device tensors and caches. If the consumer stops, an unbounded output queue can grow even though accelerator memory remains stable. Backpressure, deadlines and bounded retries are operational policies developed in Chapter 46; this section requires their state to reach the engine rather than disappearing at the HTTP boundary.

[DERIVED] Resource accounting follows the path. Tokenization costs scale with processed input bytes/tokens and can become CPU-limiting when many API processes share cores. Descriptor construction scales with scheduled tokens and active requests. Model execution retains parameters, activation/workspace and persistent state; kernel launch and collective coordination add non-model operations. Multiple workers add control messages plus actual tensor communication. Buffering raises memory and can improve overlap. No new trainable parameters are introduced by decomposition, but duplicated model/metadata state can increase resident bytes. Energy and money require measured device/host activity across the service boundary.

```figure
id: fig-43.3
kind: systems-trace
title: Request ownership through execution
caption: Each boundary changes the representation or owner of state; cancellation and completion must travel through the same path.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.1
alt: API bytes become templated tokens, request state, scheduled descriptors, worker tensors, candidate logits and committed stream events. Failures include template mismatch, stale handles and incomplete cancellation.
spec:
  columns: [compute, memory, communication, failure]
  stages:
    - {name: frontend, values: {compute: validate and tokenize, memory: input buffers, failure: wrong template}}
    - {name: engine state, values: {memory: committed and pending positions, failure: stale epoch}}
    - {name: scheduling, values: {compute: descriptor preparation, memory: cache handles, failure: invalid ownership}}
    - {name: workers, values: {compute: kernels and collectives, communication: control plus tensor traffic, failure: rank disagreement}}
    - {name: output, values: {memory: bounded stream queue, failure: unpropagated cancellation}}
```

## Algorithm

### Algorithm 43.1 - Cancellable request state machine

[DERIVED] Inputs are an immutable execution contract, nonnegative integer output cap $n_{\max}$ and absolute monotonic deadline $t_d$. Output is a committed stream plus one logical terminal result from the current owner. State contains Eq. 43.1, expected output position and pending device event. Reject invalid caps; a zero cap returns an empty completed stream before dispatch. This is an explanatory contract, not an implementation claim for a named engine.

$$
\begin{aligned}
1.\;&s\leftarrow(\text{validated},\varnothing,\varnothing,\varnothing,\psi,e);\quad
 \text{invalid inputs or unsupported contract}\Rightarrow\text{terminal reject}.\\
2.\;&\text{stop, cancel, expired deadline or output cap reached}\Rightarrow\text{go to 7}.\\
3.\;&\operatorname{Reserve}(s,\text{remaining budget})\text{ fails}
 \Rightarrow\text{bounded wait or terminal rejection};\quad\text{recheck line 2 before retry}.\\
4.\;&\mathcal B_j\leftarrow\operatorname{Prepare}(s);\quad
 (E_j,z_j)\leftarrow\operatorname{DispatchOnce}(\mathcal B_j);\quad\text{mark pending}.\\
5.\;&\text{cancel or deadline}\Rightarrow\text{go to 7};\quad
 E_j\text{ incomplete}\Rightarrow
 (\operatorname{RetainReferences};\ \operatorname{WaitNextEvent};\ \text{return to 5});\quad
 y_j\leftarrow\operatorname{Decode}(z_j,\psi).\\
6.\;&\text{stale epoch}\Rightarrow\operatorname{RetireAttemptAndReturn};\quad
 \text{active, expected position and }t<t_d\Rightarrow\operatorname{CommitOnce}(s,y_j);\quad
 \text{return to 2}.\\
7.\;&\operatorname{StopNewWork};\quad\operatorname{PublishTerminalOnce};\quad
 \operatorname{DrainOrQuarantineReferencedResources};\quad\text{return}.
\end{aligned}
$$

[DERIVED] `WaitNextEvent` uses the remaining absolute budget and can wake on cancellation; it never authorizes a second dispatch of the pending iteration. Only successful completion reaches decoding. The commit check revalidates epoch, position, cancellation and deadline immediately before publication; a failed check discards the provisional output. The current owner emits the one logical terminal result; retirement of an obsolete attempt does not terminate a newer owner. Physical reclamation follows last use: a hung kernel or failed collective can outlive the host deadline, requiring pinned/quarantined buffers and worker fencing before reuse. Thus caps and deadlines bound authorized logical work and host waiting under the declared scheduling bound, not an unconditional time to free device memory. These responsibilities connect [local cache commit](../../part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-3-cache-organization.md), [cross-worker handoff](../ch44-scheduling-distributed-serving-and-disaggregation/44-4-disaggregation.md) and [service retry/cancellation semantics](../ch46-admission-control-routing-autoscaling-and-service-contracts/46-5-resilience.md).

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM, SGLang and TensorRT-LLM occupy **Inference engine**; PyTorch occupies **Model / autograd framework**. vLLM documents ZMQ API-to-core communication and dedicated workers; TensorRT-LLM documents prepare/update/free resource interfaces [R43.1; R43.13]. Exact deployment/process behavior remains UNVERIFIED until a revision/configuration is executed.

[DERIVED] Distributed workers must agree on batch order and collective sequence. One rank entering an all-reduce for a request another rank has canceled can hang even when each rank's local tensors are valid. Cancellation therefore removes future logical work while safely completing or aborting current shared work. Restarting only a frontend does not restore device-state consistency. Recovery requires the owning execution group and its resource/version boundary.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The 2026 backend study standardizes external templates, greedy decoding, FP16, batch one and fixed software on an H100, while examining conditional and generated differences [R43.29, §4–5, Appendix A]. Its setup makes runtime semantics an experimental variable rather than assuming weights identify behavior. Detailed task results and methodological limitations are developed in §43.6.

[NOT-DISCLOSED] The architecture documentation itself supplies no controlled experiment isolating process decomposition from kernels, scheduler policy and model implementation. Architecture interfaces are implementation evidence, not causal speed measurements.

## Observations

**What the paper claims.** [PAPER-REPORTED] Backend execution can change outputs despite fixed weights and externally aligned input processing [R43.29, §5].

**What the evidence shows.** [PAPER-REPORTED] The study distinguishes systematic defaults from numerical drift and records engine versions. It does not prove that every later engine revision behaves the same.

**What we infer.** [DERIVED] A request's execution contract must identify more than weights. Eq. 43.3 also shows why CPU/GPU overlap depends on the slower stage rather than a product-wide label.

**What remains unknown.** [UNVERIFIED] No local process trace, cancellation stress test or distributed recovery experiment was executed for this chapter.

## Failure modes

> **Failure mode — Premature resource reuse.** [DERIVED] *Symptom:* intermittent corrupted outputs after cancellation. *Cause:* logical completion frees storage still referenced by a device stream. *Detection:* event/handle trace and delayed-completion fixtures. *Mitigation:* event-aware lifetime ownership and request epochs.

[DERIVED] Additional symptoms include duplicated stream tokens from repeated commits, inconsistent stops from frontend/backend disagreement, unbounded host queues after slow clients and collective hangs after rank-local state changes. A successful isolated forward pass does not exercise these failures.

## Siblings

[DERIVED] The axis is runtime ownership. A [monolithic framework loop](43-5-other-deployment-routes.md) keeps generation control close to model execution; [vLLM](43-2-vllm.md) separates API/core/workers; [SGLang](43-3-sglang.md) additionally exposes structured program and reuse interfaces; [TensorRT-LLM](43-4-tensorrt-llm.md) organizes execution around its model engine, decoder and resource managers. These are integration differentials, not quality rankings.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Current engines extend decomposition through plugin interfaces, composite attention paths and graph segmentation [R43.4; R43.10; R43.30]. They increase composability while multiplying compatibility tuples. An extension that retains its own process topology cannot inherit the parent CLI's runtime guarantees merely by sharing its executable name.

## Limitations

[DERIVED] The model above treats stage durations as known nonnegative costs. Contention, variable shapes and synchronization make actual durations state-dependent. Asynchrony changes throughput potential but complicates debugging and cancellation. A correct local state machine is necessary but insufficient for fault-tolerant distributed execution.

## Reproducibility

[DERIVED] Preserve process topology, request epochs, exact tokens, decoding/stop contract, cache and adapter identities, device event dependencies, worker ranks, kernel/collective choices and client delivery boundaries. These fields make an observed output or latency attributable. This edition supplies analytical reconstruction and inspected documentation, not an executed runtime artifact.

## References

[P36](references.md#p36), [P37](references.md#p37), [R43.1](references.md#r43-1), [R43.4](references.md#r43-4), [R43.10](references.md#r43-10), [R43.13](references.md#r43-13), [R43.29](references.md#r43-29), [R43.30](references.md#r43-30).

```figure
id: fig-43.4
kind: calculator
title: Ideal overlapped iteration time
caption: Eq. 43.3 assumes constant independent host and device stages without output processing or contention; values are analytical, not engine measurements.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.3
alt: Ten iterations with host time two and device time five take seventy serial units and fifty-two ideally overlapped units. Faster host work helps only until device work dominates.
states:
  - {anchor: formulation, label: Serial baseline, variables: {h: 2, g: 5}, note: Baseline sums both stages each iteration.}
  - {anchor: mechanism, label: Host becomes slow, variables: {h: 8, g: 5}, note: The host stage now limits the pipeline.}
  - {anchor: failure-modes, label: No free overlap, variables: {h: 8, g: 5}, note: The expression excludes synchronization and contention.}
spec:
  tex: t_n=h+g+(n-1)\max(h,g)
  equation: "43.3"
  inputs:
    - {symbol: h, label: host time units, default: 2, min: 0.1, max: 20, format: fixed2}
    - {symbol: g, label: device time units, default: 5, min: 0.1, max: 20, format: fixed2}
    - {symbol: n, label: iterations, default: 10, min: 1, max: 100, format: integer}
  outputs:
    - {symbol: serial, label: serial time, formula: n*(h+g), format: fixed2}
    - {symbol: overlap, label: overlapped time, formula: "h+g+(n-1)*max(h,g)", format: fixed2}
```

```figure
id: fig-43.5
kind: stat-panel
title: State ownership invariants
caption: These invariants are required independently of which process or language hosts a component.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.1
alt: Every pending token has an epoch and position, every buffer has an event owner, every request has one terminal result, and client cancellation reaches the execution owner.
spec:
  header: REQUEST OWNERSHIP
  rows:
    - {key: token identity, value: epoch and position}
    - {key: buffer lifetime, value: dependent events complete}
    - {key: terminal state, value: exactly one result}
    - {key: cancellation, value: propagated to owner}
```
