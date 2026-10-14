---
id: ms.references.45
entity_type: references
title: "Chapter 45 references"
volume: 2
part: 8
chapter: 45
section: null
slug: references
parent: ms.chapter.45
prev_sibling: ms.verification.45
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.llama-cpp, impl.apple-mlx-mlx-lm, impl.onnx-runtime, impl.openvino]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 45 references

[DERIVED] All entries below were actually opened and inspected on 2026-10-14. Revision identities describe the inspected surface, not an executed compatibility check. First-party documentation is distinguished from experimental evidence; preprint status is retained unless an archival venue was independently verified.

| Key | Type | Title | Authors / organization | Venue | Primary URL | Code / companion route | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R45.1 | documentation | Unified Memory | MLX contributors | MLX 0.32.3 | https://raw.githubusercontent.com/ml-explore/mlx/64ea011cb65f14d9ce2737e60db9a4ae91ed7441/docs/src/usage/unified_memory.rst | https://github.com/ml-explore/mlx | official documentation | 2026-10-14 | Commit 64ea011cb65f14d9ce2737e60db9a4ae91ed7441; Unified Memory lines 7–44, shared arrays and dependency insertion; rendered 0.32.3 page also inspected. |
| R45.2 | paper | ThermE: Predictive Management of Shared Thermal Headroom for Sustained LLM Inference on Thermally Constrained Edge SoCs | Rui Lu; Yuheng Wang; Bozheng Liu | arXiv 2026 | https://arxiv.org/html/2610.00267v1 | https://anonymous.4open.science/r/ThermE-codebase-D37B/ | preprint | 2026-10-14 | v1 full text; §§4.2–4.4 workload/heat, reduced thermal predictor, uncertainty/search; §5 controls; §6.1/Table 1 protocol; §6.2/Fig. 12 throttle/SLO distinction; §6.4/Table 3 ablations. Anonymous code linked, not checked/executed. |
| R45.3 | documentation | llama.cpp README | ggml-org contributors | 2026 inspected source | https://raw.githubusercontent.com/ggml-org/llama.cpp/df18bee11e96557b07aa7b12db0976f3c7ac9165/README.md | https://github.com/ggml-org/llama.cpp | official documentation | 2026-10-14 | Commit df18bee11e96557b07aa7b12db0976f3c7ac9165; Description lines 51–63 and Supported backends 64–83. Backend list is not full-model coverage. |
| R45.4 | documentation | GGUF specification | GGML contributors | format version 3 | https://raw.githubusercontent.com/ggml-org/ggml/3612c0af93f2cfc8f048295300a61187723b12ae/docs/gguf.md | https://github.com/ggml-org/ggml | official documentation | 2026-10-14 | Commit 3612c0af93f2cfc8f048295300a61187723b12ae; Specification/File Structure: header, typed metadata, tensor info, alignment, relative offsets and tensor data. Structural version is distinct from evolving metadata. |
| R45.5 | repository | GGML backend interface | llama.cpp/GGML contributors | 2026 inspected source | https://raw.githubusercontent.com/ggml-org/llama.cpp/df18bee11e96557b07aa7b12db0976f3c7ac9165/ggml/include/ggml-backend.h | https://github.com/ggml-org/llama.cpp | official documentation | 2026-10-14 | Commit df18bee11e96557b07aa7b12db0976f3c7ac9165; buffer lines 34–68; stream/async-copy 70–105; events 109–115; device support 131–175; scheduler 236–333, especially reserve/split/copy/reset. Static inspection only. |
| R45.6 | repository | llama_model_loader | llama.cpp contributors | 2026 inspected source | https://raw.githubusercontent.com/ggml-org/llama.cpp/df18bee11e96557b07aa7b12db0976f3c7ac9165/src/llama-model-loader.cpp | https://github.com/ggml-org/llama.cpp | official documentation | 2026-10-14 | Commit df18bee11e96557b07aa7b12db0976f3c7ac9165; create_tensor/buft_for_tensor 1063–1185; select_weight_buft, mmap host-buffer path 1142–1173; init_mappings 1295–1329; load_data_range 1406–1424; load_all_data 1425 onward. No executed check. |
| R45.7 | documentation | llama.cpp HTTP Server | llama.cpp contributors | 2026 inspected source | https://raw.githubusercontent.com/ggml-org/llama.cpp/df18bee11e96557b07aa7b12db0976f3c7ac9165/tools/server/README.md | https://github.com/ggml-org/llama.cpp | official documentation | 2026-10-14 | Commit df18bee11e96557b07aa7b12db0976f3c7ac9165; Features; Common params (thread/affinity/NUMA/device/context); chat-completions routes; slots/monitoring. No API parity or security certification. |
| R45.8 | documentation | llama-bench | llama.cpp contributors | 2026 inspected source | https://raw.githubusercontent.com/ggml-org/llama.cpp/df18bee11e96557b07aa7b12db0976f3c7ac9165/tools/llama-bench/README.md | https://github.com/ggml-org/llama.cpp | official documentation | 2026-10-14 | Commit df18bee11e96557b07aa7b12db0976f3c7ac9165; Usage lines 79–91: pp/tg/pg, repetitions, context depth, tokenization/sampling exclusion; Output formats includes build identity and per-repetition samples. Example timings are not used as current results. |
| R45.9 | paper | MELTing point: Mobile Evaluation of Language Transformers | Stefanos Laskaridis; Kleomenis Katevas; Lorenzo Minto; Hamed Haddadi | arXiv 2024 | https://arxiv.org/html/2403.12844v2 | https://github.com/brave-experiments/MELT | preprint | 2026-10-14 | v2 full text; §§3–4 monitoring/automation, separate intrusive profiling and power boundaries; Table 3 historical versions; §5.1 repetitions; §5.2.3/Fig. 8 sustained 50-prompt traces. HTML contains placeholder venue fields; no invented archival venue. |
| R45.10 | documentation | llama.cpp build guide | llama.cpp contributors | 2026 inspected source | https://raw.githubusercontent.com/ggml-org/llama.cpp/df18bee11e96557b07aa7b12db0976f3c7ac9165/docs/build.md | https://github.com/ggml-org/llama.cpp | official documentation | 2026-10-14 | Commit df18bee11e96557b07aa7b12db0976f3c7ac9165; Metal build; Vulkan; WebGPU sections. Build route alone does not establish operator/model coverage. |
| R45.11 | documentation | MLX-LM README | MLX-LM contributors | 2026 inspected repository | https://github.com/ml-explore/mlx-lm | https://github.com/ml-explore/mlx-lm | official documentation | 2026-10-14 | Unpinned main; generation/load/tokenizer, chat template, stream_generate, samplers/logits processors, conversion/quantization. No executed model compatibility. |
| R45.12 | documentation | Exploring LLMs with MLX and the Neural Accelerators in the M5 GPU | Apple Machine Learning Research | 19 November 2025 | https://machinelearning.apple.com/research/exploring-llms-mlx-m5 | https://github.com/ml-explore/mlx | official documentation | 2026-10-14 | Unpinned page; Table 1 and footnotes: 24 GB M4/M5, 4,096 prompt/128 output, formats and macOS 26.2; GPU neural accelerators/Metal facilities. Exact MLX commit, uncertainty and sustained duration not disclosed. |
| R45.13 | documentation | Exporting to ExecuTorch | PyTorch/ExecuTorch contributors | stable displays 1.5 | https://docs.pytorch.org/executorch/stable/using-executorch-export.html | https://github.com/pytorch/executorch | official documentation | 2026-10-14 | Unpinned stable; Model Preparation; Export and Lowering; dynamic shape constraints; .pte and optional external .ptd weights. Export domain and delegated operators remain conditional. |
| R45.14 | documentation | Qualcomm backend | PyTorch/ExecuTorch contributors | stable displays 1.5 | https://docs.pytorch.org/executorch/stable/backends-qualcomm.html | https://github.com/pytorch/executorch | official documentation | 2026-10-14 | Unpinned stable; Qualcomm AI Engine Direct overview; documented Hexagon/Adreno backend paths and SDK/platform requirements. Vendor XPU names are not universal graph support. |
| R45.15 | documentation | ExecuTorch MLX backend overview | PyTorch/ExecuTorch contributors | stable displays 1.5 | https://docs.pytorch.org/executorch/stable/backends/mlx/mlx-overview.html | https://github.com/pytorch/executorch | official documentation | 2026-10-14 | Unpinned stable; Overview/Features/Requirements: MLX GPU execution, dynamic shapes/mutable state, experimental real-iOS path, simulator limitation and CI caveat. No observed phone result. |
| R45.16 | documentation | Execution Providers | ONNX Runtime contributors | 2026 inspected surface | https://onnxruntime.ai/docs/execution-providers/ | https://github.com/microsoft/onnxruntime | official documentation | 2026-10-14 | Unpinned page; GetCapability node/subgraph partitioning and ordered provider selection. Installed provider dependencies and model support must be validated. |
| R45.17 | documentation | I/O Binding | ONNX Runtime contributors | 2026 inspected surface | https://onnxruntime.ai/docs/performance/tune-performance/iobinding.html | https://github.com/microsoft/onnxruntime | official documentation | 2026-10-14 | Unpinned page; default input/output CPU copies; BindInput/BindOutput device allocation and reusable output binding. Ownership/lifetime retained. |
| R45.18 | documentation | Heterogeneous Execution | OpenVINO contributors | 2026 documentation | https://docs.openvino.ai/2026/openvino-workflow/running-inference/inference-devices-and-modes/hetero-execution.html | https://github.com/openvinotoolkit/openvino | official documentation | 2026-10-14 | Unpinned 2026 page; affinity/subgraph compilation, greedy priority fallback, manual affinity/topology limits; PIPELINE_PARALLEL preview. No uniform multi-device acceleration claim. |
| R45.19 | documentation | Compile Models | MLC-LLM contributors | docs display 0.1.0 | https://llm.mlc.ai/docs/compilation/compile_models.html | https://github.com/mlc-ai/mlc-llm | official documentation | 2026-10-14 | Unpinned page; convert_weight, gen_config and compile stages; model/quantization/context/prefill target configuration; platform-specific libraries and shared converted weights. |
| R45.20 | documentation | Using WebGPU in ONNX Runtime Web | ONNX Runtime contributors | 2026 inspected surface | https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html | https://github.com/microsoft/onnxruntime | official documentation | 2026-10-14 | Unpinned page; WebGPU provider selection, GPU tensors/I/O binding, output ownership and buffer destruction. Browser/device coverage remains runtime-dependent. |
| R45.21 | paper | PowerInfer-2: Fast Large Language Model Inference on a Smartphone | Zhenliang Xue; Yixin Song; Zeyu Mi; Le Chen; Yubin Xia; Haibo Chen | arXiv 2024 | https://arxiv.org/html/2406.06282v1 | https://www.powerinfer.ai/v2 | preprint | 2026-10-14 | v1 full text, CC BY 4.0; §§3–5 neuron clusters/cache/loading/pipeline/planner; §6 privileged Android implementation; §7.1/Table 3 hardware, sparse-model baselines, 10 repetitions and decode bounds. |
| R45.22 | documentation | Token generation performance troubleshooting | llama.cpp contributors | 2026 inspected mutable source | https://raw.githubusercontent.com/ggml-org/llama.cpp/master/docs/development/token_generation_performance_tips.md | https://github.com/ggml-org/llama.cpp | official documentation | 2026-10-14 | Unpinned master; GPU-path diagnostics and CPU thread oversaturation. Historical A6000/GGML example inspected but no example number is used as a current comparative result. |
| R45.23 | documentation | Call for Submission: Edge Agentic Inference Benchmark for MLPerf Inference v6.1 | MLCommons Edge LLM Taskforce / Inference Working Group | July 2026 call | https://mlcommons.org/2026/07/mlperf-inference-v61-edge-agentic/ | https://github.com/mlcommons/endpoints | official documentation | 2026-10-14 | Unpinned call/specification; Benchmark Task: separate BFCL gate/performance replay; Performance Metrics: closed-loop concurrency 1, pauses, TTFT/TPOT/E2E; Join the Benchmark/config. Not a final device result. |
| R45.24 | documentation | Lazy Evaluation | MLX contributors | MLX 0.32.3 | https://raw.githubusercontent.com/ml-explore/mlx/64ea011cb65f14d9ce2737e60db9a4ae91ed7441/docs/src/usage/lazy_evaluation.rst | https://github.com/ml-explore/mlx | official documentation | 2026-10-14 | Commit 64ea011cb65f14d9ce2737e60db9a4ae91ed7441; Why Lazy Evaluation and When to Evaluate, especially explicit/implicit materialization triggers and graph overhead. Historical no-compilation sentence is not adopted as a current capability claim. |
| R45.25 | documentation | Using Streams | MLX contributors | MLX 0.32.3 | https://raw.githubusercontent.com/ml-explore/mlx/64ea011cb65f14d9ce2737e60db9a4ae91ed7441/docs/src/usage/using_streams.rst | https://github.com/ml-explore/mlx | official documentation | 2026-10-14 | Commit 64ea011cb65f14d9ce2737e60db9a4ae91ed7441; Specifying the Stream lines 7–16: stream/device defaults. Dependencies cross-checked against R45.1. |
| R45.26 | documentation | Running LLMs with ExecuTorch: Getting Started | PyTorch/ExecuTorch contributors | stable displays 1.5 | https://docs.pytorch.org/executorch/stable/llm/getting-started.html | https://github.com/pytorch/executorch | official documentation | 2026-10-14 | Unpinned stable; deployment/export overview and C++/Swift/Java integration. Navigation backend lists are not taken as a tested full-model matrix. |
| R45.27 | documentation | NUMA Memory Policy | Linux kernel documentation contributors | latest inspected 2026 | https://www.kernel.org/doc/html/latest/admin-guide/mm/numa_memory_policy.html | https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/ | official documentation | 2026-10-14 | Unpinned latest; Scope: Task/VMA/Shared Policy, existing-page placement and file-backed page-cache rules; Components: BIND/PREFERRED/INTERLEAVE. No measured locality claim. |
| R45.28 | paper | EnerInfer: Energy-Aware On-Device LLM Inference | Bohua Zou; Nian Liu; Binqi Sun; Matteo Mascherin; Debayan Roy; Yutao Liu; Yu Peng; Ning Jia; Haibo Chen | arXiv 2026 | https://arxiv.org/html/2606.23001v1 | null | preprint | 2026-10-14 | v1; §§4–5 predictors/control; Table 2 component boundary; §6.3 thermal protocol; §6.4/Fig. 15 whole-device boundary; Algorithm 2 timestamp-order ambiguity. |

## Evidence and revision policy

[DERIVED] Git ls-remote resolved the immutable llama.cpp and GGML commits above before the pinned files were reopened. MLX 0.32.3 documentation sources were independently opened at the recorded commit. These actions establish the inspected text/interface identity only. No repository build, model run, profiler or device test was executed; No original experiment or executed implementation verification is claimed.

[UNVERIFIED] Mutable ExecuTorch, ORT, OpenVINO, MLC and MLX-LM pages may change. Deployment requires pinned package/compiler/driver identities and model-specific validation. Displayed documentation versions are not a guarantee that every page is internally synchronized. Anonymous/preprint artifacts and first-party benchmark disclosures require independent replication before stronger claims.

## Screened boundaries

[DERIVED] HeatCache (https://arxiv.org/html/2609.12449v1) was screened as a 2026 thermal/cache lead. Its liquid-cooled edge-server setting was not used as phone evidence. No source-ranked speedup is assembled from unmatched devices or runtime generations. Source-reported details are paraphrased compactly; analytical equations and deployment audits are original derivations under stated assumptions.

## R45.1

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.2

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.3

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.4

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.5

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.6

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.7

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.8

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.9

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.10

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.11

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.12

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.13

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.14

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.15

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.16

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.17

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.18

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.19

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.20

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.21

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.22

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.23

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.24

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.25

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.26

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.27

See the corresponding ledger row for URL, revision, locator and evidence boundary.

## R45.28

See the corresponding ledger row for URL, revision, locator and evidence boundary.
