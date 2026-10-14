---
id: ms.section.45.2
entity_type: section
title: "llama.cpp stack"
volume: 2
part: 8
chapter: 45
section: 45.2
slug: 45-2-llamacpp-stack
parent: ms.chapter.45
prev_sibling: ms.section.45.1
next_sibling: ms.section.45.3
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

# 45.2 llama.cpp stack

## Scope

[DERIVED] The objective is to reconstruct the local execution stack from serialized model to delivered tokens. This section owns llama.cpp's loading, GGML computation/backend contracts and server integration. [Chapter 40](../../part-07-inference-algorithms-distillation-and-compression/ch40-quantization-from-numerical-model-to-deployable-artifact/README.md) owns GGUF/quantization definitions and numerical methods; Chapter 42 owns state accounting. Success means identifying the actual model, representation, operators and execution path, not inferring support or performance from a filename.

## Why this exists

[DERIVED] A downloadable artifact is not an executable contract by itself. A runtime must recognize architecture metadata, tensor names/shapes, quantization layouts, tokenizer behavior and positional rules. It must then choose kernels that implement those operations on available devices. A file can parse successfully and still fail at a missing operator, exceed memory after context allocation, or produce a different conditional sequence because its template/tokenizer differs.

[OFFICIAL-DOCUMENTATION] llama.cpp builds on GGML and documents multiple CPU and accelerator backends plus a server interface [R45.3, Description/Supported backends]. GGUF stores typed metadata and tensor information with alignment and data offsets [R45.4, Specification/File Structure]. These are separate layers: serialized format, tensor computation library, inference implementation and service process. A model-management application wrapping them adds another independent configuration boundary.

## Intuition

[MATHEMATICALLY-DERIVED] The computation needs tensor values and a graph with correct semantics. Serialization determines how to locate the values; layout/quantization determines how to interpret them; backend dispatch determines where operations run. Replacing an artifact's name with a familiar label cannot establish any of these contracts. The evidence should follow the values from file extent through loaded buffer to operator and output.

[DERIVED] Portability is therefore conditional. The same logical matrix can have different packed byte counts, alignment, accumulator precision and supported kernels on different backends. A quantized weight can remain packed until a fused dot product or be expanded into a temporary. The second path can have different capacity and traffic despite identical persistent file bytes. Runtime logs and operator traces are needed to distinguish them.

## Formulation

[MATHEMATICALLY-DERIVED] Let tensor $j$ have file-relative data offset $o_j$, encoded payload extent $e_j$, file data-section base $o_0$ and alignment $a>0$. A basic safe-loading contract includes

$$
o_j\bmod a=0,\qquad
0\le o_0+o_j,\qquad
o_0+o_j+e_j\le F_{\rm bytes},
\qquad
\operatorname{shape/type}_j\in\mathcal S_{\rm model}.
$$
*(Eq. 45.3)*

| Symbol | Meaning / unit |
|---|---|
| $o_0,o_j,e_j,F_{\rm bytes},a$ | offsets, encoded extent, file extent and alignment, bytes |
| $\mathcal S_{\rm model}$ | accepted architecture/tensor contracts |
| $G=(\mathcal V,\mathcal E)$ | operator dependency DAG |

[DERIVED] Arithmetic used to verify extents must be overflow-safe; integer wraparound defeats an otherwise correct inequality. For block-quantized tensors, $e_j$ comes from encoded blocks and their metadata, not a naive nominal bits/weight multiplication. File size and resident runtime size are distinct. The conditions establish structural admissibility, not trust in model behavior or correctness of its weights.



```figure
{
  "id": "fig-45.6",
  "kind": "calculator",
  "title": "One serial backend boundary",
  "caption": "Illustrative durations in seconds, not measured runtime performance. Two serial subgraphs and one crossing instantiate Eq. 45.4.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-45.4",
  "alt": "Illustrative durations in seconds, not measured runtime performance. Two serial subgraphs and one crossing instantiate Eq. 45.4.",
  "spec": {
    "tex": "t=t_c+t_g+h",
    "equation": "45.4",
    "inputs": [
      {
        "symbol": "tc",
        "label": "CPU subgraph seconds",
        "default": 0.02,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "tg",
        "label": "GPU subgraph seconds",
        "default": 0.005,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "h",
        "label": "Boundary seconds",
        "default": 0.003,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "t",
        "label": "Serial elapsed seconds",
        "formula": "tc+tg+h",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] The GGUF specification defines a header with version/tensor/metadata counts, typed key-value records and tensor records containing name, dimensions, type and data-section-relative aligned offsets [R45.4, File Structure]. Its current specification describes structural version 3 while metadata can evolve independently. Readers must validate the version and required architecture keys rather than treat all files ending in the same extension as interchangeable.

[DERIVED] A robust reconstruction begins with a manifest: content hash, source model revision, conversion tool revision/options, tensor inventory and tokenizer/template identity. Inspect tensor names against the runtime's architecture mapping. Verify dimensions and required tensors before allocating large buffers. Missing optional metadata needs a documented model-specific default or explicit rejection. Guessing a default from a model family name can silently change attention, context or sampling.

[OFFICIAL-DOCUMENTATION] The inspected llama.cpp loader has explicit tensor-buffer selection, mmap initialization and data loading paths [R45.6, functions selecting weight buffer types, init_mappings and load_all_data]. These source declarations support an implementation description at the inspected moving master surface; no commit was executed. Loading can map file data or populate backend buffers, and device-specific support controls whether mapped host pointers can be used directly.

[DERIVED] After metadata parsing, model construction instantiates the architecture's operator graph. For a decoder step, input token identifiers become embeddings, pass through layer operators and state updates, and reach logits for selection. GGML is the tensor/graph layer beneath that model construction. Its operator shapes, strides and buffer types constrain kernel choices. The model's cache representation and retained length determine additional allocations; a small checkpoint does not imply a small maximum-context deployment.

[OFFICIAL-DOCUMENTATION] GGML's backend header separates devices, buffer types, backends/streams, events and a multi-backend scheduler. The scheduler contract assigns tensors using operation support and preallocated tensor location, handles allocation/copies and exposes graph split/copy counts [R45.5, Backend buffer; Backend device; Backend scheduler]. Support checks are per operation/tensor contract, not just a global "GPU enabled" boolean.

[MATHEMATICALLY-DERIVED] Let $p(v)$ assign operator $v$ to an admissible backend. A serial explanatory execution cost is

$$
t_{\rm graph}(p)=\sum_{v\in\mathcal V}t_v(p(v))+
\sum_{(u,v)\in\mathcal E:p(u)\ne p(v)}t_{\rm boundary}(u,v).
$$
*(Eq. 45.4)*

where times are seconds and boundary cost includes copies, synchronization, repacking or layout conversion. This expression is exact only for a specified serial schedule; a concurrent schedule requires a critical path and resource contention. It shows why accelerating many operators can lose to a single repeated boundary around an unsupported operation.

[DERIVED] Persistent weights should be placed before repeated decode whenever capacity and backend support permit. For a statically placed GPU layer, weights are not necessarily copied from CPU for every token. Activations cross a CPU/GPU partition boundary; state usually resides with the operators that access it. Dynamic weight streaming is a different design with recurring parameter transfer, developed in §45.5. The word "offload" alone cannot identify which path a runtime uses.

[DERIVED] Quantization enters as both artifact and kernel contracts. Record each tensor's actual type mixture, group/block metadata and accumulation path; a filename can advertise an encoding family while some tensors remain at higher precision. Conversion and quantization are separate transformations. A converted checkpoint can preserve numerical values while changing container/layout; quantization changes represented values and requires independent quality evaluation from Chapter 40. Requantizing an already compressed artifact can add error without reproducing a quantization performed from original weights.

[OFFICIAL-DOCUMENTATION] The build guide documents backend-specific build routes including Metal, Vulkan and WebGPU [R45.10, respective backend headings]. Backend compilation and device enumeration establish only that a path is present. The selected model's operators, numerical type and driver features still determine whether it executes completely on that path.

[DERIVED] Server integration adds tokenizer/template parsing, request limits, context/slot management, sampling, streaming and cancellation. Preserve the exact rendered token input when comparing a server with a CLI. An API that resembles another service's interface does not imply identical templates, stop behavior or all optional fields. A local server also needs an explicit binding/authentication boundary; "runs on my machine" does not specify which clients can access it.

[OFFICIAL-DOCUMENTATION] llama.cpp's server documentation exposes generation, chat, slots, context, cache and backend-related options as a separate service surface [R45.7, Common params; endpoints; slots/metrics sections]. The inspected moving documentation is not a frozen compatibility guarantee. This manuscript does not prescribe command flags as executable instructions without a pinned version.

[DERIVED] Resource accounting follows the complete path: stored parameters and metadata; mapped/resident host regions; backend weight copies or repacking; per-context state; graph compute buffers; generated tokens; operator FLOPs; memory/link traffic; server CPU work and delivery latency. Startup includes reading, validating, conversion if performed, kernel preparation and state allocation. An application may reuse prepared state across requests, so amortization depends on its lifetime. Energy and money are NOT-DISCLOSED without device-duration and deployment-cost observations.



```figure
{
  "id": "fig-45.7",
  "kind": "diagram",
  "title": "Artifact to service execution",
  "caption": "GGUF parsing, tensor interpretation, graph construction, backend allocation/dispatch and service publication are separate correctness boundaries.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": [
    "R45.3",
    "R45.4",
    "R45.5",
    "R45.7"
  ],
  "alt": "The diagram shows GGUF artifact to Parse metadata/extents; Parse metadata/extents to Interpret typed tensors; Interpret typed tensors to Build model graph; Build model graph to Dispatch supported work; Dispatch supported work to Publish service output.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "f",
        "kind": "dataset",
        "label": "GGUF artifact"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Parse metadata/extents"
      },
      {
        "id": "t",
        "kind": "tensor",
        "label": "Interpret typed tensors"
      },
      {
        "id": "g",
        "kind": "process",
        "label": "Build model graph"
      },
      {
        "id": "d",
        "kind": "process",
        "label": "Dispatch supported work"
      },
      {
        "id": "s",
        "kind": "flow",
        "label": "Publish service output"
      }
    ],
    "edges": [
      {
        "from": "f",
        "to": "p"
      },
      {
        "from": "p",
        "to": "t"
      },
      {
        "from": "t",
        "to": "g"
      },
      {
        "from": "g",
        "to": "d"
      },
      {
        "from": "d",
        "to": "s"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 45.2 — Validate, load and dispatch transaction.** [DERIVED] Inputs are a finite artifact, immutable expected model contract, available backend list, memory/context/output caps and deadline. Output is a loaded deployment with an execution manifest, or a named failure. It is an explanatory reference procedure, not a claim to reproduce every current llama.cpp code path.

$$
\begin{aligned}
1.&\quad \operatorname{HashArtifact};\
\operatorname{ParseBoundedHeaderAndMetadata};\
\text{unsupported structure}\Rightarrow\mathrm{FORMAT\_FAILURE}.\\
2.&\quad \text{For each tensor }j:\operatorname{Validate}(45.3);\
\text{missing/type/extent mismatch}\Rightarrow\mathrm{MODEL\_FAILURE}.\\
3.&\quad \mathcal B\leftarrow\operatorname{EnumerateBackends};\
G\leftarrow\operatorname{BuildArchitectureGraph};\
p\leftarrow\operatorname{SupportedPlacement}(G,\mathcal B).\\
4.&\quad \operatorname{InventoryPeak}(p)>M_{\rm usable}\Rightarrow\mathrm{CAPACITY\_FAILURE};\
\operatorname{LoadOrMapAndPrepare}(p).\\
5.&\quad \operatorname{ReserveBoundedStateAndScratch};\
\operatorname{EvaluateReferenceCases};\
\text{numerical mismatch}\Rightarrow\mathrm{VALIDATION\_FAILURE}.\\
6.&\quad \operatorname{CommitManifest};\
\operatorname{ServeWithinCaps};\
\text{cancel/deadline/error}\Rightarrow\operatorname{ReleaseAfterCompletion}.
\end{aligned}
$$

[DERIVED] Invariants are immutable artifact identity, no out-of-range extent, consistent tokenizer/template, only supported operators and no state buffer freed before its readers finish. Parsing is bounded by file/count limits; graph planning is bounded by finite nodes; generation is bounded by output/context/deadline. Validation costs one pass over records plus chosen tensor checks; full integrity hashing costs $O(F_{\rm bytes})$ reads, which belongs in cold-start accounting when performed.

## Implementation

[OFFICIAL-DOCUMENTATION] **llama.cpp — Inference engine** owns model construction and local service; GGML and GGUF are underlying library/format surfaces of that routed project [R45.3–R45.7]. **NVIDIA CUDA — Accelerator / driver / compiler** and backend-specific Metal/Vulkan/WebGPU routes are implementation targets, not separate model architectures. Metal/Vulkan/WebGPU are outside the reference-stack system list but explicitly required by the Chapter 45 plan.

[DERIVED] Inspect logs for physical buffer allocation, operation placement, unsupported fallback and context geometry. Compare raw logits on identical tokens before interpreting final text differences, because selection amplifies small numerical discrepancies. A successful parser, selected GPU name or one generated sentence does not certify maximum-context correctness. Keep allocation, operator coverage and service checks separate.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] The llama-bench guide provides separate prompt-processing and token-generation workloads, warmup/repetition and machine-readable reporting controls [R45.8, Usage/Output]. These are documented measurement procedures, not measurements produced here. Their model-computation boundary is distinct from client-visible service latency.

[PAPER-REPORTED] MELT's historical device study uses pinned llama.cpp/MLC/LLMFarm implementations and automation with synchronized latency, memory, power and thermal traces [R45.9, §§4–5/Table 3]. The full measurement protocol is owned by §45.6; its old commits do not describe current backend behavior.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The project discloses portable inference and backend/benchmark interfaces [R45.3;R45.8].

**What the evidence shows.** [DERIVED] Inspected declarations establish how to identify loading and dispatch boundaries. They contain no executed result for this chapter's model/device combination. Historical device measurements and current interfaces are different evidence classes.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 45.4 explains why per-operator acceleration is insufficient when repeated placement boundaries dominate. Eq. 45.3 explains why encoded blocks and data-section offsets must be validated before interpreting file bytes.

**What remains unknown.** [UNVERIFIED] Current model/backend compatibility, exact loading peak and server-tail behavior remain unexecuted.



```figure
{
  "id": "fig-45.8",
  "kind": "stat-panel",
  "title": "Loader validity",
  "caption": "Parsing and execution support are separate from model/task validity.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-45.3",
  "alt": "Parsing and execution support are separate from model/task validity.",
  "spec": {
    "header": "LOADER VALIDITY",
    "rows": [
      {
        "key": "file",
        "value": "Bounds and aligned offsets"
      },
      {
        "key": "tensor",
        "value": "Shape/type/layout contract"
      },
      {
        "key": "backend",
        "value": "Supported operator/buffer"
      },
      {
        "key": "task",
        "value": "Tokenizer/template/output contract"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Format support mistaken for executable support.** [DERIVED] *Symptom:* an artifact parses but fails or falls back during graph execution. *Cause:* architecture/operator/type support differs from container support. *Detection:* record tensor contracts and backend split/operator traces. *Mitigation:* reject or use a supported path with a new measured profile.

[DERIVED] Other failures include stale tokenizer metadata, truncated shards, overflowed extents, temporary dequantization exceeding memory, a server context cap different from the benchmark and cancellation that retains state. Silent fallback can preserve output while invalidating a performance claim.

## Siblings

[DERIVED] [§45.3](45-3-apple-and-mobile-execution.md) follows MLX/ExecuTorch-specific execution; [§45.4](45-4-portable-runtimes.md) follows graph-export/provider compilation. Compare artifact semantics, actual operator coverage, placement boundaries and application integration. Container names and wrapper products are not alternative kernels.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The inspected GGML interface exposes explicit support/buffer/event and graph-split accounting rather than a single undifferentiated device path [R45.5]. That permits more precise auditing; no isolated performance improvement follows from API presence. Current backend additions require model/dtype/version-specific checks.

## Limitations

[DERIVED] This reconstruction describes inspected contracts, not a verified implementation at an executable commit. Moving master APIs and formats need pinning before deployment. A minimal dependency footprint does not establish numerical fidelity, privacy or thermal sustainability.

## Reproducibility

[OFFICIAL-DOCUMENTATION] R45.4 pins the GGUF specification to GGML commit 3612c0af93f2cfc8f048295300a61187723b12ae. R45.5–R45.6 pin backend/loader interfaces to llama.cpp commit df18bee11e96557b07aa7b12db0976f3c7ac9165, including ggml_backend_sched_* and llama_model_loader::init_mappings/load_all_data. This is static inspection; no check was executed.

[DERIVED] Retain artifact/converter/build hashes, metadata/tensor inventory, backend configuration, physical buffers, graph splits/copies, template/sampling/context caps and exact benchmark/server boundary. No binary was built or model run; all source-level claims are OFFICIAL-DOCUMENTATION.

## References

[R45.3](references.md#r45-3), [R45.4](references.md#r45-4), [R45.5](references.md#r45-5), [R45.6](references.md#r45-6), [R45.7](references.md#r45-7), [R45.8](references.md#r45-8), [R45.9](references.md#r45-9), [R45.10](references.md#r45-10).
