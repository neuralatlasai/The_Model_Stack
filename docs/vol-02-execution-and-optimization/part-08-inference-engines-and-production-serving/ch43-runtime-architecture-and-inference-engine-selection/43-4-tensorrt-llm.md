---
id: ms.section.43.4
entity_type: section
title: TensorRT-LLM
volume: 2
part: 8
chapter: 43
section: 43.4
slug: 43-4-tensorrt-llm
parent: ms.chapter.43
prev_sibling: ms.section.43.3
next_sibling: ms.section.43.5
children: []
prerequisites: [ms.chapter.26, ms.chapter.28, ms.chapter.29, ms.chapter.40, ms.chapter.42, ms.section.43.1]
downstream: [ms.chapter.44, ms.chapter.46, ms.chapter.47]
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [runtime_architecture, optimized_execution], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.tensorrt-llm, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 43.4 — TensorRT-LLM

## Scope

[DERIVED] TensorRT-LLM must be described by its current execution backend, not inferred from its project name. This section treats the PyTorch-native runtime as the current path and the removed TensorRT backend as a historical workflow. It follows model loading, PyExecutor integration, optimized operators, distributed execution and serving boundaries. Quantizer derivations belong to Chapter 40; cache allocation and scheduling policies belong to Chapters 42 and 44.

## Why this exists

[OFFICIAL-DOCUMENTATION] Release 1.2 removes the TensorRT backend and makes PyTorch the sole backend. The migration guide removes the former engine-build/conversion path and directs users toward loading Hugging Face or Model Optimizer checkpoints [R43.14, “TensorRT Backend Removal”; R43.15, replacement table]. This changes the deployable artifact contract, available commands and reproduction procedure.

[DERIVED] A chapter that still prescribes conversion followed by an ahead-of-time TensorRT engine build as the universal TensorRT-LLM workflow would give an obsolete method. Conversely, a historical result produced with an engine binary cannot be silently reinterpreted as a measurement of the PyTorch-native path. Backend identity is part of the experiment.

## Intuition

[DERIVED] PyTorch-native execution can still use highly specialized attention, quantized matrix multiplication, MoE and communication kernels. “PyTorch” names a framework/interface path; it does not imply ordinary eager operators throughout. The useful comparison is between concrete tensor contracts and dispatched operators, including how the executor supplies positions, resource handles and decoding state.

[DERIVED] Think of the runtime as a coordinator around a device program. The coordinator determines admissible work and valid resource lifetimes; optimized operators implement local transformations. A fast operator is useful only when its layout, accumulation type and synchronization fit the surrounding program. A release migration changes this coordinator and artifact boundary even when some kernels remain related.

## Formulation

> **Definition — Executable backend identity.** [DERIVED] A tuple that fixes the artifact loader, model implementation, operator registry, runtime/executor configuration and device/software target used to realize model semantics.

| Local symbol | Meaning |
|---|---|
| $\beta$ | Executable backend identity |
| $\theta,\widehat\theta$ | Reference weights and decoded deployed numerical weights |
| $f_\theta(x)$, $\widehat f_{\widehat\theta,\beta}(x)$ | Reference and deployed logits on the same input prefix |
| $K_j,\mu_j$ | Resource handles and metadata for iteration $j$ |
| $t_{\rm launch},t_{\rm mem},t_{\rm compute}$ | Launch, memory-transfer and compute contributions |
| $B_{\rm cut},b,\alpha$ | Boundary bytes, effective bandwidth and message/launch latency |
| $m$ | Number of serial communication stages |

[MATHEMATICALLY-DERIVED] Separate artifact and execution deviations by adding and subtracting a reference evaluation of the deployed weights:

$$
\|\widehat f_{\widehat\theta,\beta}(x)-f_\theta(x)\|
\le
\|\widehat f_{\widehat\theta,\beta}(x)-f_{\widehat\theta}(x)\|
+
\|f_{\widehat\theta}(x)-f_\theta(x)\|.
$$
*(Eq. 43.13)*

The first term captures execution differences relative to a specified reference evaluator; the second includes numerical artifact changes. Neither term is automatically small. In particular, a low-precision checkpoint and a new executor are two interventions, even if both belong to one deployment recipe.

[DERIVED] The runtime's per-iteration interface can be written

$$
(z_j,K_{j+1})=
\operatorname{ModelEngine}_{\beta}
(\mathcal B_j,\mu_j,K_j),\qquad
\mu_j \models \operatorname{Valid}(K_j,\mathcal B_j).
$$
*(Eq. 43.14)*

Validity includes positions, shapes, cache interpretation, rank groups and completed prerequisites. Numerical parity cannot be established by checking tensor shapes alone.

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] The inspected architecture document decomposes PyExecutor into a model engine, decoder, scheduler and resource manager. ModelEngine has a forward interface; scheduling includes capacity and microbatch stages; resources are prepared, updated and freed around execution [R43.13, “PyExecutor,” “ModelEngine,” “Scheduler,” “ResourceManager”]. Its footer identifies documentation build cc63e66, updated 2026-10-09.

[DERIVED] The resulting iteration has three different decisions. Capacity admission decides whether a request has valid resources. Microbatch construction chooses the work presented together. Decoding consumes model output and changes logical request state. Combining those decisions into “batching” hides which condition failed. A request may have free token-work slots but insufficient state capacity, or enough state while a selected kernel cannot handle its shape.

[OFFICIAL-DOCUMENTATION] The same architecture overview retains introductory wording about execution “besides TensorRT.” That wording conflicts with the explicit release-1.2 removal/migration documentation [R43.13–15]. This chapter gives the release and migration statements precedence for current backend availability. The inconsistency is documented rather than reconciled by assumption.

[DERIVED] A resource manager's prepare phase must establish ownership before operators dereference handles. An update phase must distinguish completed device writes from planned future positions. Freeing a request is not simply decrementing a host counter: all device readers and cross-rank operations must have passed their last use. Those are the same invariants as §43.1, reconstructed at the documented executor boundary.

[OFFICIAL-DOCUMENTATION] The current quick start exposes an offline LLM API and an online trtllm-serve API using a model repository/checkpoint directly [R43.16, “Deploy Online Serving,” “Run Offline Inference”]. The overview describes integrations with Triton Inference Server and Dynamo [R43.12]. These are serving integration surfaces; protocol compatibility does not establish matching preprocessing, sampler defaults or client timing.

[DERIVED] Offline and online APIs share model computation but can differ in queueing, tokenization, serialization, streaming and cancellation. Measuring an offline generate call and comparing it with a remote HTTP server conflates these boundaries. The chapter's selection procedure requires declaring the observation point before interpreting latency.

[DERIVED] Kernel fusion removes intermediate materialization and launch boundaries when algebra, layout and synchronization permit. Suppose two consecutive operators otherwise write and reread $n$ elements of $b_e$ bytes each. Fusion can avoid up to $2nb_e$ boundary bytes in the simple materialization model. It can also increase register pressure, reduce occupancy or prevent a better specialized algorithm; saved bytes do not prove lower latency.

$$
t_{\rm unfused}-t_{\rm fused}
\approx \Delta t_{\rm launch}
+\frac{B_{\rm eliminated}}{b}
-\Delta t_{\rm compute}-\Delta t_{\rm pressure}.
$$
*(Eq. 43.15)*

[MATHEMATICALLY-DERIVED] This is an accounting model with measured effective bandwidth and explicit residual costs, not a roofline equality. If fusion changes accumulation or intermediate rounding, Eq. 43.13's execution term must also be checked. For a quantized matrix product, the output depends on scales, packing, accumulation and epilogue semantics; advertising a numeric format does not specify those details.

[DERIVED] Distributed operators require a consistent group topology. Tensor parallelism partitions transformations and introduces collectives; expert parallelism routes token activations to expert owners and restores ordering after combination. The execution DAG includes both computation and communication. A simplified serial-stage cost is

$$
t_{\rm comm}\approx m\alpha+\frac{B_{\rm cut}}{b},
$$
*(Eq. 43.16)*

where $B_{\rm cut}$ is actual transferred traffic and $b$ incorporates the realized topology/protocol. Overlap can hide only communication that is independent of concurrently executing compute. Small low-concurrency workloads are often sensitive to latency $\alpha$; large batches may be sensitive to bandwidth, expert imbalance or temporary buffers.

[OFFICIAL-DOCUMENTATION] The expert-parallelism engineering report describes redundant expert placement and load-balancing metadata [R43.19, “Offline Load Balancer”]. Redundancy changes both resource use and work distribution. It should not be treated as a free scheduling improvement.

[DERIVED] If a hot expert has multiple replicas, routing can lower its queue or device imbalance, but replicas consume memory that might otherwise hold request state. A migration preserving total GPU count can still change available batch capacity by changing this placement. The fair comparison records expert slots, routing and communication backend alongside TP/EP labels.

[OFFICIAL-DOCUMENTATION] The paged-attention/IFB page includes versioned v0.11 build flags and engine-building language [R43.17, “max_batch_size,” “max_num_tokens”]. Those passages are historical configuration evidence, not instructions to build a current removed backend. The abstract distinction among request count, sequence length and per-iteration token work remains useful; current arguments must be resolved from the selected current API.

[DERIVED] This separation prevents a dangerous form of apparent reproducibility: preserving the spelling of an old parameter while changing what object it constrains. A maximum sequence limit can affect memory and semantics; a token-work limit affects per-iteration execution; a graph capture size constrains replay eligibility. None is interchangeable.

```figure
id: fig-43.12
kind: diagram
title: Current executor and historical artifact boundary
caption: Current PyTorch-native execution loads checkpoints into an executor. Legacy TensorRT engine workflows are historical reproduction paths.
placement: inline
evidence: OFFICIAL-DOCUMENTATION
source: R43.15
alt: A checkpoint enters the current model engine, connected to scheduling, resources and decoding. A separate legacy engine artifact is explicitly historical.
spec:
  direction: LR
  nodes:
    - {id: ckpt, kind: tensor, label: model checkpoint}
    - {id: engine, kind: process, label: current PyTorch ModelEngine}
    - {id: sched, kind: process, label: scheduler}
    - {id: res, kind: memory, label: resource manager}
    - {id: decode, kind: process, label: decoder}
    - {id: output, kind: tensor, label: outputs}
    - {id: legacy, kind: memory, label: legacy TensorRT engine artifact}
  edges:
    - {from: ckpt, to: engine}
    - {from: sched, to: engine, kind: dependency}
    - {from: res, to: engine, kind: dependency}
    - {from: engine, to: decode}
    - {from: decode, to: output}
    - {from: decode, to: sched, kind: feedback}
```

## Algorithm

### Algorithm 43.4 — Backend-explicit execution and migration

[DERIVED] Inputs are a model artifact, requested backend, finite generation limits and device configuration. Outputs are responses plus an auditable resolved execution tuple.

$$
\begin{aligned}
1.\;&\beta\leftarrow\operatorname{ResolveVersionBackendDevice};
\quad\text{removed backend}\Rightarrow\operatorname{RejectAndRecord}.\\
2.\;&(\widehat\theta,\mathcal T)\leftarrow\operatorname{LoadCheckpointAndTensorContracts};
\quad\text{unsupported tuple}\Rightarrow\operatorname{Fail}.\\
3.\;&\operatorname{ValidateCommonPrefixOutputs}(\beta,\mathcal T);
\quad\text{criterion fails}\Rightarrow\operatorname{InvestigateBeforeTiming}.\\
4.\;&\mathcal B_j\leftarrow\operatorname{CapacityThenMicrobatchSchedule};
\quad K_j\leftarrow\operatorname{PrepareResources}(\mathcal B_j).\\
5.\;&(z_j,K_{j+1})\leftarrow\operatorname{Forward}(\mathcal B_j,\mu_j,K_j);
\quad\operatorname{AwaitRequiredEvents}.\\
6.\;&\operatorname{DecodeCommitAndUpdateResources}(z_j);
\quad\operatorname{PublishAfterOutputProcessing}.\\
7.\;&\text{terminal request}\Rightarrow\operatorname{FreeAfterLastUse};
\quad\text{otherwise repeat 4 within limits}.
\end{aligned}
$$

[DERIVED] Invariants are explicit backend identity, compatible numerical contracts, rank-consistent communication and event-safe resource lifetimes. The procedure terminates per request on stop, error, cancellation or token cap. Loading and parity validation have setup costs; per-iteration model, metadata and collective work remain separate terms. This is an explanatory contract, not an executed implementation.

## Implementation

[OFFICIAL-DOCUMENTATION] TensorRT-LLM is **Inference engine**, PyTorch **Model / autograd framework**, and TensorRT **Accelerator / driver / compiler** in the explicit historical path (outside the numbered stack; routed through the TensorRT-LLM anchor). Current use of specialized NVIDIA kernels does not reinstate the removed TensorRT backend [R43.14–16].

[DERIVED] Record release/container digest, model and quantization revision, current API arguments, attention/MoE/linear/communication kernel paths, graph mode, hardware topology and serving integration. A documentation-build commit is a source revision, not a tested runtime commit. No current compatibility claim is CODE-VERIFIED here.

[OFFICIAL-DOCUMENTATION] Immutable source commit 5c7fc3c7d60131ff0080e52736646691ed1867b3 exposes PyExecutor._schedule, _forward_step and resource prepare/update/free calls [R43.34, py_executor.py:7083,8254,3142,3772,8765]. The inspected source is a different revision from documentation build cc63e66. The evidence establishes named integration boundaries, while model/device compatibility and event safety remain unexecuted.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] NVIDIA's DeepSeek-R1 latency report uses eight B200 GPUs, concurrency one and 1k/2k input/output lengths. The disclosed path mixes BF16 components with NVFP4 dense/MoE weights and uses TP/EP placement. It reports 67→253→368 output tokens/s across combined optimization/speculative configurations [R43.18, “Performance,” “Model Precision,” optimization sections]. This does not isolate a single kernel or preserve a pure BF16 baseline.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] Specialized runtime/kernel changes reduce latency in the reported minimum-latency setup [R43.18].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The reported tokens/s improvement co-occurs with several interventions, including speculative execution. It is conditional on disclosed precision, concurrency, lengths and eight-device placement.

**What we infer.** [DERIVED] Executor overhead and collective latency can matter at concurrency one, but the report cannot assign each share of improvement without independent ablations. Low-precision quality equivalence requires separate evidence.

**What remains unknown.** [NOT-DISCLOSED] A full task-quality confidence analysis and universal p95 serving comparison are not established by that report. [UNVERIFIED] The book has not reproduced its recipe.

## Failure modes

> **Failure mode — Historical engine recipe presented as current.** [DERIVED] *Symptom:* removed commands or backend arguments fail. *Cause:* combining legacy build documentation with current release assumptions. *Detection:* resolve backend/version before artifact loading. *Mitigation:* use current checkpoint flow or explicitly pin a historical reproduction environment.

[DERIVED] Other failures include valid shapes with incompatible scale layouts, mismatched collective groups and freeing resources before outstanding work completes. A successful server startup proves little about long-context or cancellation correctness.

## Siblings

[DERIVED] [vLLM](43-2-vllm.md) and [SGLang](43-3-sglang.md) expose different coordination and integration paths. The comparison axis is resolved model/operator behavior and service boundaries, not the framework name or presence of a branded kernel.

## Extensions

### Improvements

[DERIVED] The lineage moves from historical ahead-of-time engine conversion toward current direct checkpoint loading and PyTorch-native orchestration, while retaining specialized kernels and distributed execution. This reduces one artifact-conversion boundary but increases the importance of resolved runtime configuration. Redundant expert placement and graph tuning target different bottlenecks and should be evaluated separately.

## Limitations

[DERIVED] Vendor specialization can constrain hardware portability and increase migration work. A substantive open question is joint optimization of kernel dispatch, graph capture and request-state capacity: the fastest isolated operator may reserve enough workspace to lower deadline-qualified throughput. Settling it requires workload-controlled measurements of both operator time and feasible service capacity at identical quality.

## Reproducibility

[UNVERIFIED] Documentation build cc63e66 and access 2026-10-14 identify the inspected sources; no server/container execution occurred. Historical measurements retain their original backend identity. Future reproduction must pin executable source/container, artifacts and actual dispatch, then validate correctness before measuring [selection criteria](43-6-selection-methodology.md).

```figure
{
  "id": "fig-43.13",
  "kind": "calculator",
  "title": "Communication latency model",
  "caption": "Illustrative nonoverlapped communication: serial stages pay per-stage latency, and decimal MB divided by decimal GB/s is converted to seconds. Topology, contention and overlap require separate measurement.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-43.16",
  "alt": "Controls vary serial stage count, microsecond latency, decimal megabytes and gigabytes per second. The default gives 1.04 milliseconds; no overlap or congestion benefit is assumed.",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared model",
      "note": "Inputs are hypothetical analysis values."
    },
    {
      "anchor": "mechanism",
      "label": "Inspect dependencies",
      "note": "Actual costs require measurement at the stated boundary."
    },
    {
      "anchor": "failure-modes",
      "label": "Check the omitted cost",
      "note": "A favorable calculation cannot certify a deployment."
    }
  ],
  "spec": {
    "tex": "m alpha+B/b",
    "equation": "43.16",
    "inputs": [
      {
        "symbol": "stages",
        "label": "serial stages",
        "min": 1,
        "max": 32,
        "default": 4,
        "format": "integer"
      },
      {
        "symbol": "alpha",
        "label": "Per-stage latency (microseconds)",
        "min": 1,
        "max": 100,
        "default": 10,
        "format": "fixed2"
      },
      {
        "symbol": "bytes",
        "label": "Total traffic (decimal MB)",
        "min": 1,
        "max": 1000,
        "default": 100,
        "format": "fixed2"
      },
      {
        "symbol": "bandwidth",
        "label": "Effective bandwidth (decimal GB/s)",
        "min": 1,
        "max": 1000,
        "default": 100,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "time",
        "label": "Serial communication time",
        "formula": "stages*alpha/1000000+bytes/(1000*bandwidth)",
        "format": "seconds"
      }
    ]
  }
}
```

```figure
id: fig-43.14
kind: stat-panel
title: Release boundary
caption: TensorRT-LLM release 1.2 removes the TensorRT backend; the PyTorch backend is the sole current path in the inspected release documentation.
placement: rail
anchor: mechanism
evidence: OFFICIAL-DOCUMENTATION
source: R43.14
alt: Release 1.2 is the documented TensorRT backend removal boundary.
spec:
  header: EXECUTION CONTRACT
  rows:
    - {key: backend removal boundary, value: "1.2"}
    - {key: boundary, value: legacy workflows are historical}
```

## References

[R43.12](references.md#r43-12), [R43.13](references.md#r43-13), [R43.14](references.md#r43-14), [R43.15](references.md#r43-15), [R43.16](references.md#r43-16), [R43.17](references.md#r43-17), [R43.18](references.md#r43-18), [R43.19](references.md#r43-19), [R43.34](references.md#r43-34).
