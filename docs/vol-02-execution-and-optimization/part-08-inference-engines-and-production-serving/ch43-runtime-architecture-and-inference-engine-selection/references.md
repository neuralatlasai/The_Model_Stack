---
id: ms.references.43
entity_type: references
title: Chapter 43 references
volume: 2
part: 8
chapter: 43
section: null
slug: references
parent: ms.chapter.43
prev_sibling: ms.verification.43
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: [P36, P37]
implementations: [impl.vllm, impl.sglang, impl.tensorrt-llm, impl.pytorch, impl.hugging-face-transformers, impl.flashattention, impl.onnx-runtime, impl.openvino, impl.hugging-face-text-generation-inference-tgi]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 43 — Primary evidence ledger

[OFFICIAL-DOCUMENTATION] Every successful inspection below occurred on **2026-10-14**. Research methods, reported protocols, documentation bodies and selected official code functions were opened during authoring. A pinned source file supports narrow static observations; it does not establish executable compatibility, numerical parity or performance. No engine was run. Mutable stable/current documentation remains explicitly unpinned.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P36 | paper | Efficient Memory Management for Large Language Model Serving with PagedAttention | Woosuk Kwon et al. | SOSP 2023 | [inspected full PDF](https://arxiv.org/pdf/2309.06180) | [vLLM](https://github.com/vllm-project/vllm) | peer-reviewed | 2026-10-14 | Unversioned PDF URL; §§4–5 integration, §6.1 protocol, Fig.13 active batch example; not current V1 execution evidence |
| P37 | paper | SGLang: Efficient Execution of Structured Language Model Programs | Lianmin Zheng et al. | NeurIPS 2024 | [v2 full text](https://arxiv.org/html/2312.07104v2), [archival PDF](https://proceedings.neurips.cc/paper_files/paper/2024/file/724be4472168f31ba1c9ac630f15dec8-Paper-Conference.pdf) | [SGLang](https://github.com/sgl-project/sglang) | peer-reviewed | 2026-10-14 | v2 dated 2024-06-06 and archival paper opened; §§2–5 methods, §6.1–6.2 experiments, Appendices A–C; historical backend versions retained |
| R43.1 | documentation | vLLM architecture overview | vLLM project | current | [architecture](https://docs.vllm.ai/en/stable/design/arch_overview/) | [repository](https://github.com/vllm-project/vllm) | official documentation | 2026-10-14 | Unpinned stable; “V1 Process Architecture,” “Process Count Summary,” Worker/ModelRunner/Model interfaces |
| R43.2 | documentation | vLLM torch.compile integration | vLLM project | current | [compile design](https://docs.vllm.ai/en/stable/design/torch_compile/) | same | official documentation | 2026-10-14 | Unpinned stable; “Compilation Cache,” “Computation Graph Processing,” symbolic token dimension, custom attention boundary, guard modes |
| R43.3 | documentation | vLLM prefix caching | vLLM project | current | [prefix design](https://docs.vllm.ai/en/stable/design/prefix_caching/) | same | official documentation | 2026-10-14 | Unpinned stable; “Hash-based KV Cache,” hash inputs/serialization, block pool/free queue, get_computed_blocks and allocate_slots |
| R43.4 | documentation | vLLM attention backends | vLLM project | current | [attention backend design](https://docs.vllm.ai/en/stable/design/attention_backends/) | same | official documentation | 2026-10-14 | Unpinned stable; “Backend Selection Behavior,” generated validation/support tables and composite paths |
| R43.5 | documentation | vLLM Hugging Face integration | vLLM project | current | [integration](https://docs.vllm.ai/en/stable/design/huggingface_integration/) | same | official documentation | 2026-10-14 | Unpinned stable; config resolution, model registry, tokenizer/artifact revision and loading |
| R43.6 | documentation | SGLang structured outputs | SGLang project | current | [structured outputs](https://docs.sglang.io/docs/advanced_features/structured_outputs) | [repository](https://github.com/sgl-project/sglang) | official documentation | 2026-10-14 | Unpinned current; XGrammar/Outlines/llguidance and mutually alternative schema/regex/EBNF request constraints |
| R43.7 | documentation | Session-Aware Radix Cache | SGLang project | current | [sessions](https://docs.sglang.io/docs/advanced_features/session_radix_cache) | same | official documentation | 2026-10-14 | Unpinned current; soft session references, UnifiedRadixCache requirement, full-prompt/no-history-append behavior |
| R43.8 | documentation | Deterministic inference | SGLang project | current | [determinism](https://docs.sglang.io/docs/advanced_features/deterministic_inference) | same | official documentation | 2026-10-14 | Unpinned current; reduction/batch variation and backend support table including radix-cache distinction |
| R43.9 | documentation | DP, DPA and SGLang DP Router | SGLang project | current | [distributed guide](https://docs.sglang.io/docs/advanced_features/dp_dpa_smg_guide) | same | official documentation | 2026-10-14 | Unpinned current; “Data Parallelism,” “How DPA Works,” “Activation Logic,” divisibility and dp_size/attn_dp_size interface constraints, SMG routing |
| R43.10 | documentation | Breakable CUDA Graph | SGLang project | current | [graph boundaries](https://docs.sglang.io/docs/advanced_features/breakable_cuda_graph) | same | official documentation | 2026-10-14 | Unpinned current; segmented captured/eager execution and debugging path, not a speed measurement |
| R43.11 | documentation | Serving GLM5.2 NVFP4 Agentic Workload with SGLang: Reaching 500 TPS in 2 Weeks | SGLang Team / LMSYS | 2026-07-14 | [first-party technical disclosure](https://www.lmsys.org/blog/2026-07-13-glm52-optimization) | linked PRs/reproduction branch | official documentation | 2026-10-14 | Unpinned article; “Runtime Optimization” reports 11% E2E gain; “Performance Results”/“Reproduction” v0.5.15.post1, B300, workload/precision/cache configuration |
| R43.12 | documentation | TensorRT-LLM overview | NVIDIA | current | [overview](https://nvidia.github.io/TensorRT-LLM/overview.html) | [repository](https://github.com/NVIDIA/TensorRT-LLM) | official documentation | 2026-10-14 | Generated documentation build cc63e66, updated 2026-10-09; LLM API, PyTorch-native overview and serving integrations |
| R43.13 | documentation | PyTorch backend architecture | NVIDIA | current | [architecture](https://nvidia.github.io/TensorRT-LLM/torch/arch_overview.html) | same | official documentation | 2026-10-14 | Build cc63e66; “PyExecutor,” ModelEngine, Scheduler, ResourceManager; stale opening TensorRT wording explicitly contrasted with release/removal guide |
| R43.14 | documentation | TensorRT-LLM release notes | NVIDIA | releases through inspected 2026 surface | [release notes](https://nvidia.github.io/TensorRT-LLM/release-notes.html) | same | official documentation | 2026-10-14 | Build cc63e66; release 1.2 API changes/TensorRT backend removal; release 1.0 PyTorch default; not a claim that every release was executed |
| R43.15 | documentation | Migration Guide: TensorRT Backend Removed | NVIDIA | current | [migration guide](https://nvidia.github.io/TensorRT-LLM/legacy/tensorrt-backend-removal.html) | same | official documentation | 2026-10-14 | Build cc63e66; removed/replacement table for backend, engine classes, trtllm-build and conversion workflows |
| R43.16 | documentation | TensorRT-LLM Quick Start Guide | NVIDIA | current | [quick start](https://nvidia.github.io/TensorRT-LLM/quick-start-guide.html) | same | official documentation | 2026-10-14 | Build cc63e66; “Deploy Online Serving with trtllm-serve,” “Run Offline Inference with LLM API” direct checkpoint/repository input |
| R43.17 | documentation | Paged Attention, IFB, and Request Scheduling | NVIDIA | mixed historical/current page | [IFB page](https://nvidia.github.io/TensorRT-LLM/features/paged-attention-ifb-scheduler.html) | same | official documentation | 2026-10-14 | Build cc63e66; “max_batch_size,” “max_seq_len,” “max_num_tokens,” “Chunked Context”; v0.11 flags/build language treated as historical |
| R43.18 | documentation | Pushing Latency Boundaries: Optimizing DeepSeek-R1 Performance on NVIDIA B200 GPUs | NVIDIA | historical 2025 report in current docs | [technical report](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog01_Pushing_Latency_Boundaries_Optimizing_DeepSeek-R1_Performance_on_NVIDIA_B200_GPUs.html) | linked TensorRT-LLM code | official documentation | 2026-10-14 | Build cc63e66; performance/model precision/optimization sections: 8 B200, concurrency 1, ISL1k/OSL2k, mixed BF16/NVFP4, 67→253→368 TPS combined interventions |
| R43.19 | documentation | Scaling Expert Parallelism in TensorRT-LLM | NVIDIA | technical report | [expert placement](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog04_Scaling_Expert_Parallelism_in_TensorRT-LLM.html) | linked code | official documentation | 2026-10-14 | Build cc63e66; “Offline Load Balancer,” redundant expert slots and placement/resource trade; no universal multiplier adopted |
| R43.20 | documentation | ONNX Runtime Architecture | ONNX Runtime maintainers | current | [architecture](https://onnxruntime.ai/docs/reference/high-level-design.html) | [official repository](https://github.com/microsoft/onnxruntime) | official documentation | 2026-10-14 | Unpinned; “High-level system architecture,” “More about partitioning,” GetCapability/provider assignment and representation boundaries |
| R43.21 | documentation | Graph optimizations in ONNX Runtime | ONNX Runtime maintainers | current | [optimization](https://onnxruntime.ai/docs/performance/model-optimizations/graph-optimizations.html) | same | official documentation | 2026-10-14 | Unpinned; basic/extended/layout transformations and online/offline optimization |
| R43.22 | documentation | I/O Binding | ONNX Runtime maintainers | current | [I/O binding](https://onnxruntime.ai/docs/performance/tune-performance/iobinding.html) | same | official documentation | 2026-10-14 | Unpinned; body paragraphs and BindInput/BindOutput/Run examples; device residency and hidden transfer boundaries |
| R43.23 | documentation | Heterogeneous Execution | Intel / OpenVINO | 2026 docs | [HETERO](https://docs.openvino.ai/2026/openvino-workflow/running-inference/inference-devices-and-modes/hetero-execution.html) | [official repository](https://github.com/openvinotoolkit/openvino) | official documentation | 2026-10-14 | Versioned 2026 documentation, source commit unpinned; query_model/manual affinity/automatic greedy assignment and topology-overhead warnings |
| R43.24 | documentation | Inference with OpenVINO GenAI | Intel / OpenVINO | 2026 docs | [GenAI](https://docs.openvino.ai/2026/openvino-workflow-generative/inference-with-genai.html) | [GenAI repository](https://github.com/openvinotoolkit/openvino.genai) | official documentation | 2026-10-14 | Versioned 2026, source commit unpinned; GenAI/base-runtime distinction, “Text Generation,” “Streaming the Output,” LLMPipeline/generation settings |
| R43.25 | documentation | Compile Model Libraries | MLC-LLM project | current docs | [compilation](https://llm.mlc.ai/docs/compilation/compile_models.html) | [official repository](https://github.com/mlc-ai/mlc-llm) | official documentation | 2026-10-14 | Unpinned docs display 0.1.0; target library/config/weight outputs, WebGPU memory constraints, “Verify output and chat” |
| R43.26 | documentation | MLC-LLM REST API | MLC-LLM project | current docs | [server interface](https://llm.mlc.ai/docs/deploy/rest.html) | same | official documentation | 2026-10-14 | Unpinned; “Launch the Server,” model-lib, local/interactive/server modes, overrides/JIT path and tracing |
| R43.27 | repository | Text Generation Inference | Hugging Face | archived 2026 | [repository/README](https://github.com/huggingface/text-generation-inference) | same | archived | 2026-10-14 | Unpinned archived main; repository banner archive date 2026-03-21, README maintenance notice, Rust/Python/gRPC and streaming/batching interfaces |
| R43.28 | repository | DeepSpeed Model Implementations for Inference | DeepSpeed maintainers | historical 2022–2024 designs in current README | [repository](https://github.com/deepspeedai/DeepSpeed-MII) | same | official documentation | 2026-10-14 | Unpinned main; redirected from microsoft/DeepSpeed-MII; “Key Technologies,” “MII Legacy,” distinction through v0.0.9 versus FastGen path |
| R43.29 | paper | The Silent Hyperparameter: Quantifying the Impact of Inference Backends on LLM Reproducibility | David Pape, Jonathan Evertz, Lea Schönherr | preprint 2026 | [v1 full text](https://arxiv.org/html/2605.19537v1) | source-linked artifacts not executed | preprint | 2026-10-14 | v1, 2026-05-19, CC BY4.0; §§4–6, Table 1, Appendices A–D; task/default/numerical distinctions, historical engine versions |
| R43.30 | documentation | Add an out-of-tree serve backend | SGLang project | current | [plugin interface](https://docs.sglang.io/docs/developer_guide/serve_backend_plugins) | [official repository](https://github.com/sgl-project/sglang) | official documentation | 2026-10-14 | Unpinned current; versioned plugin interface, sglang.serve_backends entrypoint, extension topology/dependency/endpoint ownership |
| R43.31 | repository | vLLM V1 engine core | vLLM project | source inspected 2026 | [immutable core.py](https://github.com/vllm-project/vllm/blob/a2fb4827324bf023075799ef3d70d347834b8137/vllm/v1/engine/core.py) | same | official documentation | 2026-10-14 | Commit a2fb4827324bf023075799ef3d70d347834b8137; EngineCore.step lines657–687; step_with_batch_queue lines698–791; static read only |
| R43.32 | documentation | ONNX Runtime Execution Providers | ONNX Runtime maintainers | current | [provider index](https://onnxruntime.ai/docs/execution-providers/) | [official repository](https://github.com/microsoft/onnxruntime) | official documentation | 2026-10-14 | Unpinned; summary table and provider priority APIs; vendor interface routes, not target-model compatibility |
| R43.33 | repository | SGLang scheduler | SGLang project | source inspected 2026 | [immutable scheduler.py](https://github.com/sgl-project/sglang/blob/6f646563a253d6e573fe340a30ec4bbfa642eafa/python/sglang/srt/managers/scheduler.py) | same | official documentation | 2026-10-14 | Commit 6f646563a253d6e573fe340a30ec4bbfa642eafa; event_loop_normal1940, event_loop_overlap1975–2048, get_next_batch_to_run3766, run_batch4490, process_batch_result4921; static read |
| R43.34 | repository | TensorRT-LLM PyExecutor | NVIDIA | source inspected 2026 | [immutable py_executor.py](https://github.com/NVIDIA/TensorRT-LLM/blob/5c7fc3c7d60131ff0080e52736646691ed1867b3/tensorrt_llm/_torch/pyexecutor/py_executor.py) | same | official documentation | 2026-10-14 | Commit 5c7fc3c7d60131ff0080e52736646691ed1867b3; PyExecutor381, _schedule7083, _forward_step8254, resource calls3142/3772/8765; static read |

## P36

[PAPER-REPORTED] The paper's study is kept separate from current V1. Its workloads use synthesized lengths and arrivals rather than original production timestamps; its oracle comparison is author-implemented. Figure 13 is an active-batch mechanism example, not a 2026 engine leaderboard. Full cache-allocation derivations remain in Chapter 42.

## P37

[PAPER-REPORTED] The current SGLang section uses the originating method and compact reported protocol/outcomes, with separate current documentation for sessions, constraints, determinism and distributed configuration. Historical vLLM 0.2.5 comparisons cannot be transferred to inspected current releases. The archival version and v2 were both opened; no version-specific implementation equivalence is presumed.

## R43.1

[OFFICIAL-DOCUMENTATION] Current process roles and process-count terms are source-reported. The book's critical-path/pipeline/resource equations are explanatory derivations under their stated assumptions.

## R43.2

[UNVERIFIED] A compile-cache description does not establish guard correctness or capture eligibility for a selected deployment. No compiler was executed.

## R43.3

[DERIVED] Hash collision resistance and semantic identity completeness are separate conditions. The documentation's output-preservation intent is not promoted to cross-path bitwise equivalence.

## R43.4

[UNVERIFIED] Generated support tables are configuration checks in the documentation, not a locally observed attention dispatch.

## R43.5

[UNVERIFIED] Resolved tokenizer/model revision must be retained in a real artifact; it has not been loaded here.

## R43.6

[DERIVED] The book's mask/transition equation reconstructs the generic integration obligation. The current page does not certify every schema or semantic requirement.

## R43.7

[OFFICIAL-DOCUMENTATION] Soft references and full-prompt requirements are central interface claims. No session-retention rate is inferred.

## R43.8

[UNVERIFIED] Backend-specific deterministic modes have not been run. Cross-engine, cross-hardware or cross-release identity is not established.

## R43.9

[OFFICIAL-DOCUMENTATION] The inspected guide's activation logic is current as accessed, including separate attention-DP arguments. Its future removal notice is a documented plan, not a completed event assumed by this chapter.

## R43.10

[UNVERIFIED] Captured/eager boundaries are source-documented; speed and memory effects are not measured.

## R43.11

[NOT-DISCLOSED] The selected 11% combined-runtime intervention does not isolate each synchronization or metadata change. The book does not adopt the article's peak headline as a general serving prediction. Reproduction commands/branches are source routes, not executed checks.

## R43.12

[UNVERIFIED] Integration existence does not establish tested client/protocol equivalence.

## R43.13

[OFFICIAL-DOCUMENTATION] The stale introductory backend wording is retained as an evidence conflict. Explicit removal documentation determines the chapter's current path.

## R43.14

[OFFICIAL-DOCUMENTATION] Release 1.2 is the documented removal boundary, not the sole release existing in2026.

## R43.15

[DERIVED] Historical engine artifacts remain valid objects of historical reproduction only when their original environment is explicitly pinned.

## R43.16

[UNVERIFIED] The quick-start interface was read, not executed.

## R43.17

[OFFICIAL-DOCUMENTATION] Legacy flags are not transplanted into the current executor. The page supports the distinction between resource limits, not present-day flag compatibility.

## R43.18

[NOT-DISCLOSED] The report does not supply the chapter's full quality/service uncertainty analysis. Its mixed precision, speculative settings and topology prevent pure-kernel attribution.

## R43.19

[DERIVED] Expert replication consumes capacity; the book makes no unmeasured end-to-end gain claim.

## R43.20

[UNVERIFIED] Graph capability/partition interfaces do not certify complete language-model generation.

## R43.21

[DERIVED] Real-arithmetic rewrite validity and finite-precision equivalence are distinguished.

## R43.22

[UNVERIFIED] Device binding requires actual ownership/synchronization checks in a deployment.

## R43.23

[DERIVED] The graph-cut model is original analysis. No OpenVINO target-model latency is measured.

## R43.24

[OFFICIAL-DOCUMENTATION] Base runtime and generation pipeline are separate interfaces. No conversion recipe was run.

## R43.25

[UNVERIFIED] The compilation outputs are documented artifacts; no library was compiled.

## R43.26

[UNVERIFIED] API compatibility and mode presets do not certify output equivalence or capacity.

## R43.27

[OFFICIAL-DOCUMENTATION] Archive status is supported by the repository banner; maintenance wording is separately supported by the README. Neither establishes behavior of a private maintained fork.

## R43.28

[NOT-DISCLOSED] Current controlled performance/quality evidence is not supplied by the inspected README. Its historical features are not evidence of current universal model support.

## R43.29

[PAPER-REPORTED] The paper is a preprint, not treated as peer reviewed. Its CC BY4.0 license was explicitly inspected. Root-cause/default ablations constrain interpretation of its headline spread. Source claims about software/hardware independence are not promoted to universal causal conclusions; engine versions and tested hardware remain explicit.

## R43.30

[UNVERIFIED] Plugin-interface compatibility must be version-matched and executed before deployment acceptance.

## R43.31

[OFFICIAL-DOCUMENTATION] Static inspection confirms the named method contains scheduling, asynchronous execution, completion, abort processing and scheduler output update calls. Source bytes were fetched in memory and read; SHA256 **20e44418e3db7c12d6333a0a227eeeb606cb5bcd93bd9dc44326a1c480099611**. This is not CODE-VERIFIED runtime behavior or a determinism check.

## R43.32

[UNVERIFIED] Provider listings are routes to inspect, not evidence that a particular artifact executes entirely on its advertised device.

## R43.33

[OFFICIAL-DOCUMENTATION] The inspected overlap loop queues batch results, processes previous results and launches sampling after dependent prior result processing. It includes a write-after-read barrier call. SHA256 **ab23556739fc4a1a089da5d33f8cb925c14b7c68ae564294b5ed13d96b427c36**. Static source structure is narrower than a proof that every asynchronous path is safe.

## R43.34

[OFFICIAL-DOCUMENTATION] The inspected file exposes scheduling/forward and prepare/update/free resource calls. SHA256 **1dd4cfba96d9f24033315a686cd8f7ed654d974178e36599ec675c567b06aaf7**. This current main source pin differs from documentation build cc63e66 and historical report releases. No binary/runtime compatibility claim joins them automatically.

## Evidence boundary

[UNVERIFIED] Current source pins were resolved through GitHub's public commits API, then exact immutable source URLs were opened and source bodies inspected. No checkout, package import, kernel execution, compilation, server launch or benchmark ran. All current compatibility, performance, quality and recovery claims remain unverified until the proposed protocol is executed. Documentation omissions are recorded as NOT-DISCLOSED rather than supplied by assumptions.
