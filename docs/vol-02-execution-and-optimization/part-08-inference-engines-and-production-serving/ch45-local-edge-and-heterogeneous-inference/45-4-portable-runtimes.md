---
id: ms.section.45.4
entity_type: section
title: "Portable runtimes"
volume: 2
part: 8
chapter: 45
section: 45.4
slug: 45-4-portable-runtimes
parent: ms.chapter.45
prev_sibling: ms.section.45.3
next_sibling: ms.section.45.5
children: []
prerequisites: [ms.chapter.25, ms.chapter.37, ms.chapter.40, ms.chapter.41, ms.chapter.42, ms.chapter.43]
downstream: [ms.chapter.46, ms.chapter.47, ms.chapter.48]
related: []
siblings_by_mechanism: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [heterogeneous_execution, resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.llama-cpp, impl.apple-mlx-mlx-lm, impl.onnx-runtime, impl.openvino]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 45.4 Portable runtimes

## Scope

[DERIVED] The objective is to determine what portability means for a concrete model, numerical representation and device. This section owns ONNX Runtime, OpenVINO, MLC-LLM and Vulkan/WebGPU execution routes, with emphasis on operator coverage, graph partitioning and compiled artifacts. The baseline is a successful export or a backend name in a support table. Success requires repeated stateful execution within a declared shape domain and measured placement/copy boundaries.

## Why this exists

[DERIVED] A graph format expresses computation; a runtime/provider must implement its particular operators, types, attributes and shapes. Export can decompose a fused attention operation into more primitives, while a backend can require a fused pattern to achieve useful performance. Compatibility therefore exists at several levels: structural parsing, operator semantics, graph topology, mutable state and application control. Passing one level cannot certify the others.

[DERIVED] Portable execution often introduces fallback. That can preserve correctness while changing latency, memory and energy. A graph with almost all operators delegated can still spend most of its time copying large state around one unsupported operator. Conversely, leaving a small control operator on CPU can be efficient if it avoids expensive accelerator setup. Operator-count coverage is a weak metric unless weighted by the actual workload and boundary traffic.

## Intuition

[MATHEMATICALLY-DERIVED] Treat support as a predicate on a full operator contract, not just its name. Partition a finite graph into supported connected regions, compile or instantiate them, and connect their tensors. Portability then means that every required input/state in the declared domain has a valid semantics-preserving execution path. Performance portability adds the stronger condition that this path remains useful under the device's constraints.

[DERIVED] Vulkan and WebGPU provide GPU programming/execution routes. They do not define language-model architectures, tokenization or cache semantics. MLC-LLM compiles a model-library/configuration for a target; ONNX Runtime selects execution providers; OpenVINO compiles/partitions through device plugins. Their common dependency is implementable tensor computation, while their artifact and optimization contracts differ.

## Formulation

[MATHEMATICALLY-DERIVED] For operator $v$, backend $b$ and input/state domain point $x$, define

$$
\operatorname{support}(v,b,x)=
\operatorname{opset}\land\operatorname{dtype}\land\operatorname{shape}
\land\operatorname{attributes}\land\operatorname{state}\land\operatorname{layout}.
$$
*(Eq. 45.6)*

| Symbol | Meaning / unit |
|---|---|
| $v,b,x$ | operator, backend, input/state configuration |
| $w_v$ | measured or analytically declared reference work weight |
| $\mathcal V_{\rm acc}$ | operators actually executed by the selected accelerator |
| $C_w$ | weighted coverage fraction |

[MATHEMATICALLY-DERIVED] A declared weighted-coverage metric is
$C_w=\sum_{v\in\mathcal V_{\rm acc}}w_v/\sum_{v\in\mathcal V}w_v$, assuming nonnegative weights and positive total. Choosing $w_v=1$ measures operator counts, while reference latency or bytes measure different axes. Even $C_w=1$ cannot establish fast execution: all operations can be supported by inefficient kernels or execute with excessive synchronization. Coverage and performance remain separate estimands.



```figure
{
  "id": "fig-45.12",
  "kind": "calculator",
  "title": "Preparation amortization",
  "caption": "Illustrative times, not a runtime comparison. Preparation is paid once and reused for the positive request count.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-45.7",
  "alt": "Illustrative times, not a runtime comparison. Preparation is paid once and reused for the positive request count.",
  "spec": {
    "tex": "\\bar t=t_{\\rm req}+t_{\\rm prep}/n",
    "equation": "45.7",
    "inputs": [
      {
        "symbol": "prep",
        "label": "Preparation seconds",
        "default": 60,
        "min": 0,
        "max": 600,
        "format": "fixed3"
      },
      {
        "symbol": "req",
        "label": "Steady request seconds",
        "default": 2,
        "min": 0,
        "max": 30,
        "format": "fixed3"
      },
      {
        "symbol": "n",
        "label": "Reused request count",
        "default": 100,
        "min": 1,
        "max": 10000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "avg",
        "label": "Amortized seconds/request",
        "formula": "req+prep/n",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] ONNX Runtime's execution-provider contract uses capability queries to assign supported nodes/subgraphs and applies ordered provider priority with CPU fallback when configured [R45.16, GetCapability/APIs for Execution Provider]. The provider package and dependent libraries must be present. This establishes an explicit partition mechanism, not universal coverage for every exported model.

[DERIVED] Export first fixes operator versions, constants, dynamic axes and state interfaces. A decoder graph may receive token identifiers, masks, positions and past state, and return logits plus updated state. Inspect whether past/present state aliases one buffer, concatenates into a new tensor, or requires host orchestration. Those choices determine memory growth and per-step transfer. An exported stateless forward that recomputes the entire prefix is not comparable to a stateful decoder without identifying the work difference.

[OFFICIAL-DOCUMENTATION] ONNX Runtime's I/O binding documentation explains that ordinary calls can copy CPU inputs to a non-CPU provider and copy requested outputs back to CPU; binding device buffers can avoid those implicit transfers [R45.17, I/O Binding]. Avoiding a copy requires correct lifetime and placement, not simply enabling a provider.

[MATHEMATICALLY-DERIVED] If a decoder's past/present state has $Q_s$ bytes and is unnecessarily returned to host then uploaded for each of $S_o-1$ steps, it adds approximately $2(S_o-1)Q_s$ transferred bytes under a fixed-size state assumption. With growing state, sum the actual $Q_s(j)$ instead. The copy time is bounded below by bytes over effective link rate; synchronization and packing are additional. Holding buffers on device changes that traffic, not the conditional model.

[OFFICIAL-DOCUMENTATION] OpenVINO's heterogeneous mode assigns operation affinities, compiles connected same-affinity subgraphs and connects them through intermediate tensors. Its automatic priority-based affinity is greedy; unsupported topology combinations can require manual affinity. The inspected 2026 page labels pipeline distribution preview and describes memory-aware sequential stages [R45.18, Heterogeneous Execution; Automatic Mode; Pipeline Parallelism]. These are documented capabilities, not measured benefits for an arbitrary LLM.

[DERIVED] A useful OpenVINO inspection therefore retains both query support and compiled graph topology. Several individually supported operations need not form a backend-supported fused subgraph. Constant folding, layout transforms and quantization scale placement can affect that topology. Manual affinity must preserve related constants/state and semantic assumptions; an arbitrary layer-by-layer device label can create more conversions than it saves. Pipeline placement uses sequential stage execution for one token; concurrency across independent requests is a separate scheduling question.

[OFFICIAL-DOCUMENTATION] MLC-LLM's model-library configuration includes architecture, quantization, context/window/prefill metadata and target platform. Its documented flow converts weights, generates tokenizer/conversation configuration and compiles target libraries, with Metal/Vulkan/WebGPU/mobile examples [R45.19, “Generate mlc-chat-config and compile”]. The displayed documentation version 0.1.0 is not an executable compatibility pin.

[DERIVED] Target compilation moves optimization work before deployment. A model-library cache key must include every code-generating choice: architecture, numerical layout, shape bounds, target features, compiler/runtime ABI and relevant optimization flags. Compatible weights may be reused across targets under the documented format, but executable libraries remain target-specific. Loading a library for an incompatible driver/device or silently changing context metadata can invalidate memory planning.

[MATHEMATICALLY-DERIVED] Suppose preparation takes $t_{\rm prep}$ seconds and steady requests take $t_{\rm req}$. Across a positive integer $n$ requests,

$$
\bar t_n=t_{\rm req}+t_{\rm prep}/n.
$$
*(Eq. 45.7)*

[MATHEMATICALLY-DERIVED] This assumes preparation is reused and the system remains in the same regime. A precompiled route can improve warm execution while worsening first-use latency or package size. A benchmark that excludes compilation cannot establish the time for a newly installed offline application to answer its first request.

[OFFICIAL-DOCUMENTATION] ONNX Runtime Web's WebGPU guide supports GPU-buffer input/output binding and distinguishes buffers owned by application code from buffers owned by runtime-created outputs [R45.20, “Keep tensor data on GPU”; “GPU tensor life cycle management”]. Destroying a backing buffer before inference invalidates the execution. WebGPU availability, adapter features and browser limits remain environmental conditions; this chapter does not inherit a moving browser-support list as a permanent fact.

[DERIVED] Browser deployment adds model download/cache, permission/origin policy, shader compilation, GPU-buffer limits and device-loss recovery. A model may need shards because one buffer cannot represent its full weights; a browser can evict cached artifacts or suspend background execution. These are application-lifecycle conditions, not transformer mechanisms. Offline operation requires the complete executable/weight/tokenizer asset set and a tested cache policy. Avoiding server inference does not automatically exclude network traffic from the hosting page.

[DERIVED] Vulkan routes similarly require a compiled backend, device/driver capabilities and numerical operator coverage. A shader-supported integer format is not equivalent to a fast matrix primitive. Shader compilation and memory mapping can differ from native CUDA/Metal paths. Validate exact packed tensor layouts and accumulation rather than inferring them from a common quantized artifact. The inspected llama.cpp build documentation supplies the route's presence [R45.10]; runtime compatibility is unexecuted.

[DERIVED] Resource accounting includes exporter/compiler CPU time, compiled-library size, transformed constants, original/packed executable copies, state, boundary tensors, FLOPs, DRAM/link traffic and synchronization. Dynamic-shape specialization can create several executable variants and preparation spikes. Energy must include the relevant preparation or amortization window; monetary cost needs a declared device or service boundary. Documentation alone supplies neither an application throughput nor a sustained power result.



```figure
{
  "id": "fig-45.13",
  "kind": "diagram",
  "title": "Coverage and fallback cuts",
  "caption": "Operator support is conditional on types, shapes, attributes and state. Every provider cut needs explicit ownership and conversion.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": [
    "R45.16",
    "R45.17",
    "R45.18",
    "R45.19"
  ],
  "alt": "The diagram shows Model/export contract to Query operation support; Query operation support to Partition graph; Partition graph to Fallback processor; Partition graph to Target processor; Fallback processor to Boundary tensor/state; Target processor to Boundary tensor/state; Boundary tensor/state to Validate outputs/domain.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "dataset",
        "label": "Model/export contract"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Query operation support"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Partition graph"
      },
      {
        "id": "f",
        "kind": "hardware",
        "label": "Fallback processor"
      },
      {
        "id": "g",
        "kind": "hardware",
        "label": "Target processor"
      },
      {
        "id": "b",
        "kind": "flow",
        "label": "Boundary tensor/state"
      },
      {
        "id": "v",
        "kind": "process",
        "label": "Validate outputs/domain"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "s"
      },
      {
        "from": "s",
        "to": "p"
      },
      {
        "from": "p",
        "to": "f"
      },
      {
        "from": "p",
        "to": "g"
      },
      {
        "from": "f",
        "to": "b"
      },
      {
        "from": "g",
        "to": "b"
      },
      {
        "from": "b",
        "to": "v"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 45.4 — Bounded portable-execution audit.** [DERIVED] Inputs are a fixed model graph, finite representative/boundary cases, declared shape domain, provider/target configuration and resource limits. Output is a supported execution manifest and validation record, or a precise rejection.

$$
\begin{aligned}
1.&\quad \operatorname{FreezeGraphOpsetsConstantsState};\
\operatorname{DeclareDomain}(\mathcal D);\
\mathcal C\leftarrow\operatorname{FiniteBoundaryCases}(\mathcal D).\\
2.&\quad \text{For each }x\in\mathcal C:\operatorname{QueryFullContracts}(45.6);\
\operatorname{RecordDelegatesFallbacksAndTransforms}.\\
3.&\quad \operatorname{CompileOrInstantiate};\
\text{unsupported topology/ABI}\Rightarrow\mathrm{COMPILATION\_FAILURE}.\\
4.&\quad \operatorname{BindPersistentBuffers};\
\operatorname{CountPeakAndTransfers};\
\text{resource violation}\Rightarrow\mathrm{CAPACITY\_FAILURE}.\\
5.&\quad \operatorname{RunRepeatedStatefulCases};\
\operatorname{CompareOutputsAndState};\
\text{mismatch}\Rightarrow\mathrm{SEMANTIC\_FAILURE}.\\
6.&\quad \operatorname{CommitManifest};\
\text{out-of-domain input/device loss}\Rightarrow\operatorname{RejectOrValidatedRecovery}.
\end{aligned}
$$

[DERIVED] Finite validation cases do not prove all real-valued inputs correct; they establish the tested domain/boundaries and supplement implementation review. Invariants are no invisible fallback, no stale compiled identity, no freed backing buffers and no context/mask change disguised as portability. Procedure cost is finite case count times preparation/run cost; preparation complexity is target/compiler-specific and remains NOT-DISCLOSED as a universal function.

## Implementation

[OFFICIAL-DOCUMENTATION] **ONNX Runtime — Serving / portable runtime** and **OpenVINO — Serving / portable runtime** supply provider/plugin contracts [R45.16–R45.18,R45.20]. MLC-LLM, TVM, Vulkan and WebGPU are outside §4's system list but explicitly routed through Chapter 45's required portable-runtime coverage [R45.19,R45.10]. They should not acquire invented stack indices.

[DERIVED] The execution trace is graph/operator contract → partition/fusion → executable library/provider → kernel → memory domain → copies/synchronization → model state and delivery. Preserve a diagnostic for each transition. Compare raw input tokens/state, not only API parameter names, when replacing one runtime with another.

## Experimental design

### Reported experiments

[NOT-DISCLOSED] The inspected provider, heterogeneous-execution and compilation guides do not disclose one matched LLM experiment across ONNX Runtime, OpenVINO, MLC-LLM, Vulkan and WebGPU. They provide workflows and constraints. No comparative performance number is inferred from them.

[PAPER-REPORTED] MELT's device study includes a version-pinned MLC route and other local implementations [R45.9, Table 3/§5]. It supports a historical device/framework observation, not current operator coverage across all listed runtimes. Its full protocol and limits are developed in §45.6.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The sources disclose capability-based partitioning, affinity compilation, target-model libraries and device-buffer binding [R45.16–R45.20].

**What the evidence shows.** [DERIVED] These are inspected implementation contracts. No executed common-model comparison establishes that one route is faster, smaller or more energy efficient on the user's device.

**What we infer.** [MATHEMATICALLY-DERIVED] Avoidable state copies can scale with every output step; preparation amortization depends on application lifetime. Operator-count coverage alone cannot identify either cost.

**What remains unknown.** [UNVERIFIED] Current model/type/shape support, numerical equivalence and sustained device behavior for each compiled configuration remain untested.



```figure
{
  "id": "fig-45.14",
  "kind": "stat-panel",
  "title": "Portable does not mean uniform",
  "caption": "A successful artifact needs all four contracts. Listed targets alone do not prove full-model acceleration.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-45.6",
  "alt": "A successful artifact needs all four contracts. Listed targets alone do not prove full-model acceleration.",
  "spec": {
    "header": "PORTABLE DOES NOT MEAN UNIFORM",
    "rows": [
      {
        "key": "semantics",
        "value": "Operator/dtype/shape/state"
      },
      {
        "key": "target",
        "value": "Architecture and compiler ABI"
      },
      {
        "key": "ownership",
        "value": "Buffers and synchronization"
      },
      {
        "key": "coverage",
        "value": "Costs weighted by work/traffic"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — High coverage, repeated state copies.** [DERIVED] *Symptom:* many operators are accelerated but decode remains slow. *Cause:* state or intermediates cross providers each iteration. *Detection:* count actual transfers and buffer locations. *Mitigation:* bind compatible persistent state or revise the supported partition.

[DERIVED] Other failures include incompatible target libraries, dynamic-shape guards outside the exported range, GPU-buffer lifetime errors, silent CPU fallback, device loss and a stale browser asset cache. A larger package can contain multiple executable variants without changing model quality; distinguish footprint from numerical compression.

## Siblings

[DERIVED] [§45.2](45-2-llamacpp-stack.md) constructs the model through GGML/backend contracts; [§45.3](45-3-apple-and-mobile-execution.md) uses array execution or mobile delegates. The comparison axis is actual semantic domain, physical partition and application lifecycle, not a runtime logo or file extension.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] I/O binding and graph/device-specific compilation add control over placement and repeated-call overhead [R45.17,R45.19–R45.20]. OpenVINO's preview pipeline route adds memory-aware stages [R45.18]. Their benefit remains conditional on supported topology, preparation cost and workload; no isolated benchmark is invented.

## Limitations

[DERIVED] Portability is a conjunction of format, graph, numerical, state and deployment compatibility. A fallback can preserve correctness while violating latency. A successfully compiled example cannot certify untested context lengths or a new device/driver.

## Reproducibility

[DERIVED] Record source graph/opsets, exporter, weight/config/compiler hashes, target features, provider priority, actual partitions, shape guards, state aliases, I/O bindings, browser/driver and warm/cold lifecycle. All cited docs are mutable; no current executable was tested.

## References

[R45.9](references.md#r45-9), [R45.10](references.md#r45-10), [R45.16](references.md#r45-16), [R45.17](references.md#r45-17), [R45.18](references.md#r45-18), [R45.19](references.md#r45-19), [R45.20](references.md#r45-20).
