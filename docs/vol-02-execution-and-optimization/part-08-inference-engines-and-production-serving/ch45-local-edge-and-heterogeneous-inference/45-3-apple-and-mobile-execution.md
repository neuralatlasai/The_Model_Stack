---
id: ms.section.45.3
entity_type: section
title: "Apple and mobile execution"
volume: 2
part: 8
chapter: 45
section: 45.3
slug: 45-3-apple-and-mobile-execution
parent: ms.chapter.45
prev_sibling: ms.section.45.2
next_sibling: ms.section.45.4
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

# 45.3 Apple and mobile execution

## Scope

[DERIVED] This section reconstructs MLX/MLX-LM and mobile export/delegation routes, distinguishing CPU, GPU and available NPU paths. The baseline is assuming that a device's accelerator label establishes execution. Success means a supported model/operator/state contract, explicit synchronization, and a deployable application profile. Numerical quantization belongs to Chapter 40; placement optimization belongs to §45.5. Mobile API/version claims are restricted to inspected official surfaces.

## Why this exists

[DERIVED] A desktop array framework and a mobile ahead-of-time program solve related but different problems. The former prioritizes flexible model code and dynamic execution; the latter must package supported operators, memory plans and delegates into a bounded application artifact. Both need consistent persistent state and a tokenizer/sampler around the graph. A missing shape or unsupported operator can change the path from accelerator execution to CPU fallback, or prevent loading entirely.

[DERIVED] The Apple Neural Engine, neural matrix facilities inside an Apple GPU and a GPU runtime are different execution resources. An application using Metal or MLX does not thereby use the Neural Engine. Likewise, an Android framework that can export through an NPU backend does not guarantee that every attention, cache update or sampling operation is delegated. The actual operator partition is the evidence boundary.

## Intuition

[MATHEMATICALLY-DERIVED] Execution is a dependency graph, regardless of whether its construction is eager, lazy or ahead of time. Shared memory changes edge placement costs; it does not remove data dependencies. Export changes when graph validity is checked; it does not make unsupported dynamic behavior disappear. The deployment contract must include both the permitted tensor domain and the state mutation order between calls.

[OFFICIAL-DOCUMENTATION] MLX documents lazy evaluation and stream-managed dependencies [R45.24, evaluation triggers;R45.25, streams]. A timer around graph construction can omit queued computation. Conversely, synchronizing after every small operator changes the schedule and can overstate the cost of an ordinarily fused/asynchronous graph.

## Formulation

[MATHEMATICALLY-DERIVED] Let graph node $v$ have duration $d_v$, predecessor set $\operatorname{pred}(v)$ and an assigned processor stream. Ignoring contention beyond the chosen stream ordering, completion obeys

$$
f_v=d_v+\max\left(\max_{u\in\operatorname{pred}(v)}f_u,\ f_{\operatorname{prevstream}(v)}\right),
\qquad
t_{\rm graph}=\max_v f_v.
$$
*(Eq. 45.5)*

| Symbol | Meaning / unit |
|---|---|
| $d_v,f_v,t_{\rm graph}$ | operator duration/completion/graph elapsed, seconds |
| $\operatorname{pred},\operatorname{prevstream}$ | data predecessors and preceding operation on the assigned stream |
| $\mathcal D_{\rm export}$ | supported input/state shape and dtype domain |

[DERIVED] An absent predecessor has completion 0. This recurrence exposes the wait required when a GPU operation consumes a CPU result even in shared memory. It is a scheduling model under declared durations, not a measured MLX kernel trace. Timings need an actual completion boundary to be comparable.



```figure
{
  "id": "fig-45.9",
  "kind": "calculator",
  "title": "Dependency wait survives shared memory",
  "caption": "Illustrative two-operation durations. Dependent operations serialize; independent operations on separate streams overlap only under the model assumptions.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-45.5",
  "alt": "Illustrative two-operation durations. Dependent operations serialize; independent operations on separate streams overlap only under the model assumptions.",
  "spec": {
    "tex": "t_{\\rm dep}=d_c+d_g,\\quad t_{\\rm indep}=\\max(d_c,d_g)",
    "equation": "45.5",
    "inputs": [
      {
        "symbol": "dc",
        "label": "CPU duration seconds",
        "default": 0.004,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "dg",
        "label": "GPU duration seconds",
        "default": 0.006,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "dep",
        "label": "Dependent elapsed seconds",
        "formula": "dc+dg",
        "format": "fixed3"
      },
      {
        "symbol": "ind",
        "label": "Ideal independent seconds",
        "formula": "max(dc,dg)",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] MLX's unified arrays are accessed by specifying the operation's device/stream, and dependent CPU/GPU operations are ordered automatically [R45.1, "Unified Memory"]. MLX-LM adds model/tokenizer loading, prompt templating, samplers/logit processors and streaming generation [R45.11, Python API/Streaming/Sampling]. The model architecture still determines its state and operator requirements.

[DERIVED] A complete MLX-LM trace is artifact resolution, immutable local loading, template/token encoding, prompt execution, output selection, state update and incremental publication. Offline deployment must pin the locally resolved artifact set instead of depending on a moving Hub identifier. Keep model arrays, quantization metadata and retained state in the memory ledger; lazy expressions can keep source arrays live longer than expected. Materialization and synchronization points belong in a performance profile because they determine when work and allocation actually occur.

[DERIVED] The GPU path maps supported array operators to Metal execution; a CPU operator accesses the same physical array pool under the documented shared-memory contract. This can avoid a discrete CPU-to-GPU buffer copy, but cache coherence, producer/consumer completion, DRAM reads and allocation pressure remain. A tiny CPU-friendly operator can be beneficial only when saved GPU work/launch cost exceeds synchronization and shared-resource interference. The recurrence in Eq. 45.5 makes this comparison explicit.

[OFFICIAL-DOCUMENTATION] Apple's November 2025 technical disclosure states that MLX uses Metal 4 Tensor Operations and Metal Performance Primitives for matrix facilities in the M5 GPU [R45.12, "Inference Performance on M5 with MLX"]. These are GPU neural accelerators; the disclosure is not a claim that MLX-LM routes its model through the separate Neural Engine.

[DERIVED] For mobile application packaging, establish which language/runtime layer owns model state, callbacks and cancellation. A wrapper's asynchronous API does not guarantee the underlying model call is cancellable at every operator. Bound prompt/output/context memory before admitting work; retain a committed prefix and release native buffers only after completion. Platform backgrounding, memory-pressure termination and device loss need named outcomes. A model file's existence on disk is not proof that the application bundle contains every tokenizer/library/delegate dependency.

[OFFICIAL-DOCUMENTATION] ExecuTorch's inspected 1.5 documentation exports a PyTorch graph, transforms/lowers supported partitions and serializes a program for C++ or Swift/Java execution [R45.13, Export and Lowering;R45.26, Next steps]. The export contract specifies example inputs and dynamic-shape constraints. Backends include CPU and vendor/GPU routes, with support details supplied by each delegate rather than inferred from the source model.

[MATHEMATICALLY-DERIVED] If a compiled graph is valid only for $\mathcal D_{\rm export}$, an inference input/state pair outside that domain requires rejection or a separately validated graph. Padding to an allowed length changes compute and mask/state semantics; truncating context changes conditioning. Neither is a neutral compatibility repair. For a mutable cache, declared capacity can remain fixed while a logical-length scalar advances, but the graph must preserve mask bounds and avoid writing beyond capacity. Persistent-buffer aliasing and update order must be checked across consecutive calls, not just on one stateless example.

[DERIVED] Delegation can split a graph into accelerated subgraphs and portable operators. Each boundary needs a compatible tensor representation, layout, quantization scale and ownership. Quantize/dequantize boundaries can erase an accelerator's arithmetic benefit or change numerical behavior. Token sampling is often a different control/data type from matrix operations; its placement must be included in the trace. A backend's list of supported operator names is insufficient without dtype, shape, attributes and mutable-state constraints.

[OFFICIAL-DOCUMENTATION] ExecuTorch's Qualcomm guide distinguishes its AI Engine Direct API family from the particular backend, which currently delegates to Hexagon processors and Adreno GPU [R45.14, "What's Qualcomm AI Engine Direct?"]. Available CPU/GPU/NPU paths are thus runtime-specific. The source does not justify a generic statement that any Qualcomm model executes wholly on an NPU.

[OFFICIAL-DOCUMENTATION] The inspected ExecuTorch MLX delegate compiles an export-time bytecode and executes MLX GPU primitives. It is explicitly experimental; physical iOS-device execution is not covered by CI and the iOS simulator has no usable Metal device for this path [R45.15, overview/Target Requirements]. These qualifications matter more than merely listing MLX as a mobile backend.

[MATHEMATICALLY-DERIVED] If $k$ graph partitions execute repeatedly for $S_o-1$ ordinary decode steps, a fixed boundary overhead $h_j$ adds $(S_o-1)\sum_{j=1}^{k-1}h_j$ seconds before any payload-dependent cost. A negligible one-call overhead can become material over a long response. Parameter bytes do not grow because of delegation itself, but executable constants can be duplicated/transformed, and temporary boundary tensors can overlap with persistent cache. Record both artifact and runtime memory.

[DERIVED] Cost accounting includes conversion/export time and host resources, model-library size, persistent weights/cache, intermediate copies/quantization, compute, shared DRAM/link traffic, synchronization and callback/publication time. Quantization savings require an actual packed path rather than a full intermediate expansion. Whole-device energy and sustained latency remain separate from GPU-kernel speed. Monetary/energy comparisons are NOT-DISCLOSED without the platform and duration boundary.



```figure
{
  "id": "fig-45.10",
  "kind": "diagram",
  "title": "Export domain and mobile delegation",
  "caption": "An exported graph is lowered only within its supported shape/state domain. Shared arrays still require producer completion before consumption.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": [
    "R45.1",
    "R45.13",
    "R45.14",
    "R45.15"
  ],
  "alt": "The diagram shows Model and state semantics to Export constrained graph; Export constrained graph to Delegate supported subgraphs; Delegate supported subgraphs to CPU fallback; Delegate supported subgraphs to GPU or NPU path; CPU fallback to Join state/output; GPU or NPU path to Join state/output.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "m",
        "kind": "model",
        "label": "Model and state semantics"
      },
      {
        "id": "x",
        "kind": "process",
        "label": "Export constrained graph"
      },
      {
        "id": "d",
        "kind": "branch",
        "label": "Delegate supported subgraphs"
      },
      {
        "id": "c",
        "kind": "hardware",
        "label": "CPU fallback"
      },
      {
        "id": "g",
        "kind": "hardware",
        "label": "GPU or NPU path"
      },
      {
        "id": "j",
        "kind": "process",
        "label": "Join state/output"
      }
    ],
    "edges": [
      {
        "from": "m",
        "to": "x"
      },
      {
        "from": "x",
        "to": "d"
      },
      {
        "from": "d",
        "to": "c"
      },
      {
        "from": "d",
        "to": "g"
      },
      {
        "from": "c",
        "to": "j"
      },
      {
        "from": "g",
        "to": "j"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 45.3 — Export/delegate/run validity transaction.** [DERIVED] Inputs are immutable model/tokenizer identity, bounded export domain, ordered delegate policy, finite reference cases and deployment limits. Output is an artifact/execution manifest or a named failure.

$$
\begin{aligned}
1.&\quad \mathcal D_{\rm export}\leftarrow\operatorname{DeclareShapesTypesState};\
G\leftarrow\operatorname{ExportInEvaluationMode};\
\text{capture failure}\Rightarrow\mathrm{EXPORT\_FAILURE}.\\
2.&\quad (G_1,\ldots,G_k)\leftarrow\operatorname{LowerSupportedPartitions}(G);\
\operatorname{RecordFallbacksAndBoundaries}.\\
3.&\quad \operatorname{SerializeProgramAndDependencies};\
\operatorname{CheckPeakMemoryAndDeviceSupport};\
\text{failure}\Rightarrow\mathrm{DEPLOYMENT\_FAILURE}.\\
4.&\quad \text{For each bounded reference case: verify outputs and successive state mutations against the declared reference}.\\
5.&\quad (x,\mathcal K)\notin\mathcal D_{\rm export}\Rightarrow\mathrm{DOMAIN\_REJECTION};\
\operatorname{RunAndAwaitRequiredCompletion}.\\
6.&\quad \operatorname{CommitStateAndDeliver};\
\text{cancel/device loss/nonfinite state}\Rightarrow\operatorname{AbortConsistently}.
\end{aligned}
$$

[DERIVED] Invariants are identical conditioning, visible delegated/fallback partitions, valid mutable-state lengths and no buffer release before use completes. Finite case/output budgets and timeouts bound execution. Compilation time is compiler/model dependent and NOT-DISCLOSED as a general bound; runtime costs follow the graph plus boundary counts above. This is a verification-oriented book procedure, not an assertion of executed framework compatibility.

## Implementation

[OFFICIAL-DOCUMENTATION] **Apple MLX / MLX-LM — Serving / portable runtime** provides the array/model layers [R45.1,R45.11,R45.24–25]. **PyTorch — Model / autograd framework** supplies exported source graphs; ExecuTorch and its vendor delegates are outside §4's listed systems but explicitly required by the Chapter 45 matrix [R45.13–R45.15]. Metal is an implementation API, not a model format or a synonym for Neural Engine execution.

[DERIVED] Preserve export logs, delegated operator inventory, runtime feature/version checks, physical device versus simulator identity and intermediate tensor/state comparisons. For lazy execution, benchmark materialized results. For mobile delegates, benchmark the entire repeated stateful loop. A CPU fallback is a valid correctness path only when its memory/time consequences remain within the service contract.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] Apple's M5 disclosure compares 24 GB M5/M4 MacBook Pro configurations using MLX-LM generation, 4,096-token prompts and 128 outputs. It includes BF16 and 4-bit Qwen models plus MoE/MXFP4 cases; Table 1 reports phase speedups and memory [R45.12]. Exact MLX commit, trial dispersion, background load and sustained thermal duration are NOT-DISCLOSED. The disclosed macOS requirement is 26.2 or later for the highlighted GPU facilities.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The disclosure attributes different prompt/decode gains to GPU matrix facilities and memory bandwidth in its tested workload [R45.12, Table 1].

**What the evidence shows.** [DERIVED] It is a bounded first-party configuration study, not a sustained mobile benchmark. ExecuTorch's documentation establishes available export/delegate contracts, not a common benchmark across those routes.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 45.5 shows why shared addressing preserves dependency waits. Repeated-boundary cost scales with generated steps even when a one-call graph looks efficient.

**What remains unknown.** [UNVERIFIED] Matched MLX/ExecuTorch/CPU/NPU comparisons, exact current commits and physical-device correctness at maximum state sizes remain unexecuted.



```figure
{
  "id": "fig-45.11",
  "kind": "stat-panel",
  "title": "Apple and mobile boundaries",
  "caption": "Backend names do not establish equal processor paths or deployment maturity.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": [
    "R45.12",
    "R45.13",
    "R45.15"
  ],
  "alt": "Backend names do not establish equal processor paths or deployment maturity.",
  "spec": {
    "header": "APPLE AND MOBILE BOUNDARIES",
    "rows": [
      {
        "key": "m5",
        "value": "GPU neural facilities differ from ANE"
      },
      {
        "key": "export",
        "value": "Shape/state domain explicit"
      },
      {
        "key": "mlx",
        "value": "Experimental iOS delegate caveat"
      },
      {
        "key": "sync",
        "value": "Time completed materialization"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Lazy construction timed as inference.** [DERIVED] *Symptom:* an implausibly short call is followed by a long later access. *Cause:* computation was deferred. *Detection:* time a defined materialization/completion boundary. *Mitigation:* preserve synchronization semantics and separate graph preparation from execution.

[DERIVED] Other failures include simulator capabilities mistaken for physical-device support, export valid only at an example shape, incorrect cache mutation under a delegate, excessive quantization boundaries and a GPU path mislabeled NPU. These failures have distinct checks; a single final text sample cannot exclude them.

## Siblings

[DERIVED] [§45.2](45-2-llamacpp-stack.md) uses a format/model/backend stack; [§45.4](45-4-portable-runtimes.md) uses provider/compiler routes. Compare supported model domain, statefulness, synchronization and actual partition. Programming-language wrappers are not evidence of a different physical accelerator.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The experimental ExecuTorch MLX delegate adds mutable persistent buffers and dynamic-shape support to its GPU bytecode route [R45.15, Features]. This is a documented capability with explicit CI/device limitations, not a demonstrated universal advantage over native MLX-LM.

## Limitations

[DERIVED] Export and shared memory reduce particular integration burdens while leaving operator coverage, numerical behavior and sustained resource limits. A documented model family or GPU capability does not establish every quantization/context combination.

## Reproducibility

[OFFICIAL-DOCUMENTATION] MLX documentation sources were also inspected at commit 64ea011cb65f14d9ce2737e60db9a4ae91ed7441 (v0.32.3), including unified_memory.rst, lazy_evaluation.rst and using_streams.rst. This pins the shared-array, materialization and stream-default contracts; it does not establish a tested device/kernel matrix.

[DERIVED] Pin model arrays, tokenizer/template, MLX/MLX-LM or ExecuTorch/delegate/toolchain, OS/device, export domain, state aliases, sampler and synchronization. Mutable docs display MLX 0.32.3 / ExecuTorch 1.5 but no executed local build was checked. All performance remains attributed to the disclosed study.

## References

[R45.1](references.md#r45-1), [R45.11](references.md#r45-11), [R45.12](references.md#r45-12), [R45.13](references.md#r45-13), [R45.14](references.md#r45-14), [R45.15](references.md#r45-15), [R45.24](references.md#r45-24), [R45.25](references.md#r45-25), [R45.26](references.md#r45-26).
