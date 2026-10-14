---
id: ms.section.43.5
entity_type: section
title: Other deployment routes
volume: 2
part: 8
chapter: 43
section: 43.5
slug: 43-5-other-deployment-routes
parent: ms.chapter.43
prev_sibling: ms.section.43.4
next_sibling: ms.section.43.6
children: []
prerequisites: [ms.chapter.26, ms.chapter.28, ms.chapter.40, ms.chapter.42, ms.section.43.1]
downstream: [ms.chapter.45, ms.chapter.46]
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [graph_partitioning, compilation, runtime_architecture], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.onnx-runtime, impl.openvino, impl.hugging-face-text-generation-inference-tgi]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 43.5 — Other deployment routes

## Scope

[DERIVED] ONNX Runtime, OpenVINO, MLC-LLM and vendor integration routes solve deployment problems at different abstraction levels. Historical TGI and MII designs provide relevant service/execution cases. This section compares graph transformation, partitioning, compilation, state interfaces and lifecycle boundaries. Device-specific edge behavior belongs to Chapter 45. The baseline is the same model/operator semantics in a reference evaluator, not another route's default quantized example.

## Why this exists

[DERIVED] A generative model requires more than a graph executor: tokenizer/template resolution, repeated stateful evaluation, sampling, stopping and output publication must be supplied somewhere. A portable graph representation can coexist with hardware-specific kernels. A server-compatible API can coexist with different tensor semantics. Selection must identify which layer a tool supplies and which obligations remain with the application.

[OFFICIAL-DOCUMENTATION] ONNX Runtime partitions a graph across execution providers; OpenVINO offers heterogeneous-device partitioning and separate GenAI pipelines; MLC-LLM compiles target-specific model libraries [R43.20, R43.23–25]. Those capabilities establish possible deployment paths, not measured equivalence or comparative service performance.

## Intuition

[DERIVED] Portability has three distinct meanings: the model can be represented, the target can execute every required operation, and the complete application preserves acceptable behavior. Export success addresses only the first. Provider fallback may make execution succeed while introducing transfers or different arithmetic. A compiler can improve one target while producing an artifact that needs rebuilding for another. The method should expose these tradeoffs rather than compress them into a single portability score.

## Formulation

> **Definition — Deployment closure.** [DERIVED] A deployment tuple is closed when all operators, state updates, decoding rules and external interfaces required by the application have specified supported implementations and bounded resource lifetimes.

| Local symbol | Meaning |
|---|---|
| $G=(V,E)$ | Operator graph with tensor-carrying edges |
| $\pi(v)$ | Assigned execution target/provider |
| $\mathcal C_d$ | Operators/configurations supported by target $d$ |
| $c_v(d)$ | Execution time model for operator/subgraph $v$ on $d$ |
| $s_e,\alpha_e,b_e$ | Boundary bytes, transfer latency and effective bandwidth |
| $q$ | Repeated decode iterations |
| $\mathcal L,\mathcal W,\mathcal J$ | Compiled library, numerical weights and generation configuration |

[MATHEMATICALLY-DERIVED] A feasible assignment satisfies $v\in\mathcal C_{\pi(v)}$ for the actual dtype, shape and attributes. A sequential graph approximation is

$$
T(\pi)=
\sum_{v\in V}c_v(\pi(v))+
\sum_{e=(u,v)\in E:\pi(u)\ne\pi(v)}
\left(\alpha_e+\frac{s_e}{b_e}\right).
$$
*(Eq. 43.17)*

Independent branches require critical-path rather than summed time, and transfers may overlap under explicit dependencies. The formula shows why local “fastest supported device” assignment need not minimize complete execution time.

[MATHEMATICALLY-DERIVED] For a repeated decoder boundary of $s$ bytes, an avoidable transfer contributes approximately

$$
T_{\rm boundary}=q\left(\alpha+\frac{s}{b}\right).
$$
*(Eq. 43.18)*

For a hypothetical $q=500$, $s=4$ MB, $b=20$ GB/s and $\alpha=0.02$ ms, this is 110 ms of serial boundary cost. This arithmetic example is not an engine benchmark. Repeatedly transferring a growing cache can be substantially worse than this fixed-size model.

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] ONNX Runtime loads an ONNX graph, applies provider-independent transformations, queries provider capabilities and assigns supported subgraphs in provider-priority order. Provider boundaries must convert their internal tensor representation to/from the runtime representation [R43.20, “High-level system architecture,” “More about partitioning”]. A successful fallback therefore does not imply a single-device execution path.

[DERIVED] Capability is a predicate on the full operator configuration. An attention operator supported at one head size, dtype or mask does not establish support for all attention variants. Dynamic axes in an export specify a permitted shape domain; they do not prove that every provider implementation handles the domain efficiently. If export rewrites an operation, parity must be checked after the rewrite and again after provider partitioning.

[OFFICIAL-DOCUMENTATION] Graph-optimization documentation separates basic, extended and layout transformations and online/offline optimization [R43.21, corresponding headings]. Offline artifacts depend on optimization settings and target compatibility.

[DERIVED] The correctness argument has two layers. Algebraic transformations preserve a real-arithmetic graph under their preconditions. Finite-precision execution may change associativity, accumulation and rounding. Eliminating a reshape that only changes metadata is different from fusing normalization and matrix operations with different intermediates. Operator-level tests on common inputs diagnose where a deployed graph diverges; task-level tests determine whether that divergence matters.

[OFFICIAL-DOCUMENTATION] ONNX Runtime I/O binding lets callers bind inputs and outputs to target-device memory. Otherwise transfers can occur inside Run, including copying unbound outputs to CPU [R43.22, “I/O Binding”]. This is a measurement-boundary issue as well as an optimization interface.

[DERIVED] A generative loop should make ownership explicit for past/present state, token inputs, positions and outputs. Binding device buffers is safe only if the producer has completed and the consumer respects shape/lifetime. A pointer alone does not carry synchronization. Keeping cache on device can remove repeated copies; copying logits to a host sampler can remain an intentional boundary. Moving the sampler to device changes the boundary and may change random-number behavior, so it needs its own comparison.

[OFFICIAL-DOCUMENTATION] OpenVINO HETERO queries device capability and supports manual affinity. Its automatic priority assignment is greedy and does not globally optimize topology/transfer effects [R43.23, “How Heterogeneous Execution Works,” “Automatic Subgraph Assignment”]. The documentation explicitly warns about cross-device overhead.

[DERIVED] Consider two supported accelerator subgraphs separated by a small CPU-only operation. Offloading both subgraphs introduces two cuts. The combined route wins only when accelerator compute savings exceed both cuts and any layout conversions. Assigning the intervening operation to a less specialized but compatible device can be faster overall. This is the graph-cut implication of Eq. 43.17, not a claim about any particular OpenVINO model.

[OFFICIAL-DOCUMENTATION] OpenVINO GenAI extends the base runtime with generation pipelines. The inspected text-generation examples use LLMPipeline, generation configuration and streamers; the page warns that base OpenVINO alone does not supply the documented GenAI interface [R43.24, “Text Generation,” “Streaming the Output”].

[DERIVED] That layer owns repeated execution and generation behavior that a one-shot graph API leaves to its caller. Conversion precision, tokenizer files, default decoding and streamer stopping semantics therefore enter the deployment identity. Comparing an INT4 demonstration with an FP16 reference measures representation and runtime together. If the goal is engine execution parity, use numerically equivalent artifacts first; a separate experiment can evaluate the deployable quality/resource frontier.

[OFFICIAL-DOCUMENTATION] MLC-LLM's compilation guide produces a model library, weight shards, tokenizer/configuration artifacts, with target-dependent libraries. It gives a WebGPU example where prefill chunk or context settings may need reduction to fit device constraints [R43.25, “Compile the model library,” “Verify output and chat”].

[DERIVED] The deployment object is $(\mathcal L,\mathcal W,\mathcal J)$, plus runtime and target identity. Loading the same weights with a mismatched compiled layout or quantization contract is invalid. Changing the conversation template changes input semantics even if the library remains identical. A target-specific library is not an engine-independent interchange format.

[OFFICIAL-DOCUMENTATION] MLC's server interface accepts model/library paths and exposes local, interactive and server modes whose inferred capacity settings differ; explicit overrides and request tracing are available [R43.26, “Launch the Server”]. A documented mode name is not a measured capacity guarantee.

[DERIVED] Compiler specialization trades setup effort and portability for repeated execution opportunities. A compiled shape limit can constrain context length, batch work or supported operators. That is distinct from a runtime scheduler choosing smaller work inside a supported limit. Server startup may include JIT compilation when no library is supplied, so cold timing must disclose artifact-cache state.

[OFFICIAL-DOCUMENTATION] Vendor execution-provider routes include NVIDIA TensorRT, Intel OpenVINO, AMD MIGraphX and Qualcomm QNN in the inspected ONNX Runtime provider index [R43.32, “Summary of supported Execution Providers”]. Their listing does not establish support for a particular language model, quantized format or complete generation pipeline.

[DERIVED] A vendor route can be direct through a vendor library or indirect through a provider/plugin. These have different ownership of graph partitioning, buffer allocation, compilation and diagnostics. An integration adapter adds its own version constraint. In particular, ONNX Runtime's TensorRT provider and the removed TensorRT-LLM backend are different interfaces; §43.4's removal does not imply removal of every TensorRT use elsewhere.

[OFFICIAL-DOCUMENTATION] TGI's repository is archived as of 2026-03-21 and its README states maintenance mode while recommending downstream engines. It documents a Rust/Python/gRPC service with streaming and batching [R43.27, repository banner; README]. This chapter treats it as a historical design and migration case, not an unqualified current default.

[DERIVED] The historical split illustrates independent protocol and model-worker layers. Migrating the worker can preserve an HTTP shape while changing template defaults, error codes, cancellation and stream chunking. A migration test must therefore include partial outputs and terminal reasons, rather than only final text.

[OFFICIAL-DOCUMENTATION] MII's README distinguishes legacy releases through v0.0.9 from the FastGen-related path, listing blocked cache, continuous batching, Dynamic SplitFuse and specialized CUDA kernels [R43.28, “Key Technologies,” “MII Legacy”]. The inspected repository alone does not establish present model coverage or a 2026 performance ranking.

[DERIVED] Its historical lesson is that model implementations and service orchestration are separate optimization surfaces. Replacing a reference model with optimized transformations creates operator/numerical obligations; splitting prompt work changes interference and scheduling. Chapter 44 develops these policies without treating a historical marketing multiplier as current evidence.

```figure
{
  "id": "fig-43.15",
  "kind": "diagram",
  "title": "Portability requires complete execution closure",
  "caption": "Capability partitioning assigns supported nodes to the target provider and unsupported nodes to a fallback when permitted. Transfers occur only at actual cross-provider graph cuts; both paths rejoin before generation semantics are checked.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-43.17",
  "alt": "Exported graph nodes branch by provider capability into target and permitted fallback subgraphs. Their dependency outputs rejoin for sampling/stopping; generation state feeds the selected paths and updates after decoding.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "model",
        "kind": "tensor",
        "label": "Reference model"
      },
      {
        "id": "export",
        "kind": "process",
        "label": "Representation and export"
      },
      {
        "id": "partition",
        "kind": "branch",
        "label": "Capability-based assignment"
      },
      {
        "id": "fast",
        "kind": "process",
        "label": "Target subgraph"
      },
      {
        "id": "fallback",
        "kind": "process",
        "label": "Permitted fallback subgraph"
      },
      {
        "id": "join",
        "kind": "process",
        "label": "Rejoin graph dependencies"
      },
      {
        "id": "state",
        "kind": "memory",
        "label": "Generation state"
      },
      {
        "id": "sample",
        "kind": "process",
        "label": "Sampling and stopping"
      }
    ],
    "edges": [
      {
        "from": "model",
        "to": "export"
      },
      {
        "from": "export",
        "to": "partition"
      },
      {
        "from": "partition",
        "to": "fast",
        "label": "supported nodes"
      },
      {
        "from": "partition",
        "to": "fallback",
        "label": "unsupported nodes, if allowed"
      },
      {
        "from": "fast",
        "to": "join"
      },
      {
        "from": "fallback",
        "to": "join"
      },
      {
        "from": "fast",
        "to": "fallback",
        "label": "only at an actual graph cut",
        "kind": "dependency"
      },
      {
        "from": "join",
        "to": "sample"
      },
      {
        "from": "state",
        "to": "fast",
        "kind": "dependency"
      },
      {
        "from": "state",
        "to": "fallback",
        "kind": "dependency"
      },
      {
        "from": "sample",
        "to": "state",
        "kind": "feedback"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 43.5 — Close a portable deployment

[DERIVED] Inputs are a finite model/operator graph, target set, numerical artifact and bounded generation contract. Output is a supported executable tuple or an explicit rejection.

$$
\begin{aligned}
1.\;&G'\leftarrow\operatorname{ExportOrLower}(G,\text{shape domain});
\quad\text{unsupported semantics}\Rightarrow\operatorname{Reject}.\\
2.\;&\pi\leftarrow\operatorname{Assign}(G',\{\mathcal C_d\});
\quad\exists v\notin\mathcal C_{\pi(v)}\Rightarrow\operatorname{Reject}.\\
3.\;&\operatorname{EnumerateCutsLayoutsCopies}(\pi);
\quad\operatorname{CompileAndBind}(\mathcal L,\mathcal W,\mathcal J).\\
4.\;&\operatorname{CheckCommonInputOperatorsAndLogits};
\quad\text{failure}\Rightarrow\operatorname{LocalizeBeforePerformance}.\\
5.\;&\text{for each finite request: initialize state, execute, sample and stop};\\
&\text{invalid shape, lifetime or device failure}\Rightarrow\operatorname{RecordTerminalError}.\\
6.\;&\operatorname{CheckTaskAndProtocolContract};
\quad\text{pass}\Rightarrow\operatorname{AdmitToComparison}.
\end{aligned}
$$

[DERIVED] Invariants are complete operator coverage, compatible layout/precision, valid buffer ownership and declared decoding. Graph inspection costs at least $O(|V|+|E|)$; compilation cost is target/method dependent. Per-request cost includes all graph cuts for every repeated iteration. This procedure specifies verification obligations, not a locally executed backend.

## Implementation

[OFFICIAL-DOCUMENTATION] ONNX Runtime and OpenVINO are **Serving / portable runtime**; MLC-LLM is **Inference engine** with a compilation route; TGI and DeepSpeed-MII are **Inference engine** in the historical cases. MLC-LLM and DeepSpeed-MII are outside the numbered reference stack and are routed through the plan's portable-runtime and historical-design coverage. Their stack roles do not assert equal API levels. Adapter/provider versions and resolved execution paths remain unverified.

## Experimental design

### Reported experiments

[NOT-DISCLOSED] The inspected architecture/usage documents do not supply a controlled same-model, same-precision, same-hardware cross-route experiment with paired quality and p95 latency. MII's README headline does not disclose enough of its protocol to use as such a result. This section therefore derives costs and records interfaces rather than fabricating benchmark outcomes. The contemporary controlled backend study is examined in §43.6.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] Providers, heterogeneous partitioning and target compilation enable specified deployment paths [R43.20–26].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Documentation establishes capability and configuration interfaces, including fallback and transfer boundaries. It does not measure the chapter's target model.

**What we infer.** [DERIVED] Portability and efficiency require deployment closure; maximizing supported accelerator nodes alone is insufficient.

**What remains unknown.** [UNVERIFIED] Actual dispatched operators, complete generation parity, sustained latency and operational failure behavior have not been executed here.

## Failure modes

> **Failure mode — Hidden fallback inside a repeated loop.** [DERIVED] *Symptom:* device utilization is low despite a supported export. *Cause:* an unsupported operation crosses devices each token. *Detection:* inspect assignment and transfer traces. *Mitigation:* change partitioning, supply a compatible operator or reject the route.

[DERIVED] Other failures include compiled-library/weight mismatches, changed conversion precision and protocol-equivalent servers with different stop processing.

## Siblings

[DERIVED] §§43.2–4 specialize complete language-model serving paths. This section examines lower-level graph routes and historical service designs. Chapter 45 extends the comparison to device memory, thermals and local operation.

## Extensions

### Improvements

[DERIVED] The lineage progresses from generic graph execution to provider capability partitioning, target specialization and generation-aware pipelines. Improved portability can increase the number of boundaries requiring validation. Better deployment methods expose provider assignments, conversion decisions and state lifetimes as inspectable artifacts.

## Limitations

[DERIVED] A graph cost model omits concurrent contention unless modeled explicitly. Compiler support changes with releases; provider indices are mutable. A research question is whether generation-aware partitioning can optimize repeated state movement jointly with operator placement under memory constraints. Evidence requires complete iteration traces and comparison with a topology-aware assignment, not only per-operator benchmarks.

## Reproducibility

[UNVERIFIED] All sources were accessed 2026-10-14; mutable documentation/repositories are unpinned. Preserve exporter/opset, conversion settings, runtime/providers, assignments, target library, quantized weights, tokenizer/template and generation configuration before execution. Proposed book checks remain in [verification](verification.md).

```figure
{
  "id": "fig-43.16",
  "kind": "calculator",
  "title": "Repeated boundary cost",
  "caption": "Illustrative nonoverlapped copies across actual provider cuts. Decode iterations multiply microsecond boundary latency plus decimal MB / GB/s transfer time; the result is converted to seconds before formatting.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-43.18",
  "alt": "Each of five hundred illustrative decode iterations pays twenty microseconds plus a four-MB transfer at twenty GB/s, totaling 110 milliseconds before overlap or contention.",
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
    "tex": "q(alpha+s/b)",
    "equation": "43.18",
    "inputs": [
      {
        "symbol": "iterations",
        "label": "decode iterations",
        "min": 1,
        "max": 1000,
        "default": 500,
        "format": "integer"
      },
      {
        "symbol": "size",
        "label": "Bytes per actual cut (decimal MB)",
        "min": 1,
        "max": 100,
        "default": 4,
        "format": "fixed2"
      },
      {
        "symbol": "bandwidth",
        "label": "Effective bandwidth (decimal GB/s)",
        "min": 1,
        "max": 100,
        "default": 20,
        "format": "fixed2"
      },
      {
        "symbol": "latency",
        "label": "boundary latency microseconds",
        "min": 0,
        "max": 100,
        "default": 20,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "cost",
        "label": "Cumulative serial boundary time",
        "formula": "iterations*(latency/1000000+size/(1000*bandwidth))",
        "format": "seconds"
      }
    ]
  }
}
```

```figure
id: fig-43.17
kind: stat-panel
title: Export is one gate
caption: Successful representation does not certify provider coverage, numerical parity or generation behavior.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-43.17
alt: A stat card separates graph export from complete deployment closure.
spec:
  header: EXECUTION CONTRACT
  rows:
    - {key: representation execution semantics, value: "3"}
    - {key: boundary, value: Separate acceptance obligations}
```

## References

[R43.20](references.md#r43-20), [R43.21](references.md#r43-21), [R43.22](references.md#r43-22), [R43.23](references.md#r43-23), [R43.24](references.md#r43-24), [R43.25](references.md#r43-25), [R43.26](references.md#r43-26), [R43.27](references.md#r43-27), [R43.28](references.md#r43-28), [R43.32](references.md#r43-32).
