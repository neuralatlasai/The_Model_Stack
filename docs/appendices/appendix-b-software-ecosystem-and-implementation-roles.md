---
id: ms.appendix.b
entity_type: appendix
title: "Software ecosystem and implementation roles"
short_title: Appendix B
volume: null
part: null
chapter: null
section: null
slug: appendix-b-software-ecosystem-and-implementation-roles
parent: ms.appendices
prev_sibling: ms.appendix.a
next_sibling: ms.appendix.c
children: []
prerequisites: []
downstream: []
related: [ms.chapter.6, ms.chapter.66]
relations: []
axes: {lifecycle: [evaluation, assurance], mechanism: [evidence_audit, provenance], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Appendix B — Software ecosystem and implementation roles

[DERIVED] Software names occupy different layers of an experiment. A tensor library, checkpoint container, graph compiler, model runtime, server and model-management product cannot be compared as interchangeable implementations. This appendix maps the coverage layers; the chapter ledgers own release-specific inspected behavior. Inclusion is not a claim of current maintenance, hardware coverage or superiority.

## Layer map

| Layer | Representative projects / objects | Role and chapter ownership |
|---|---|---|
| Model and data interchange | Hugging Face Hub, model/dataset cards, safetensors, GGUF | Registries/documentation versus tensor/container formats; 07, 10–12, 40, 43 |
| Data tooling | Datasets, Tokenizers, SentencePiece, corpus-specific pipelines | Loading/transformation/tokenization; 07–12 |
| Model frameworks | Transformers, PyTorch, JAX | Model implementations and tensor/autodiff frameworks; 05, 13–20, 28 |
| Training launch and adaptation | Accelerate, PEFT, torchtune, Axolotl, LlamaFactory, Unsloth | Launch/adaptation/recipe layers; implementation boundaries differ; 23, 30–31 |
| Distributed training | Megatron-Core, DeepSpeed, FSDP/DTensor, TorchTitan, MaxText, NeMo, ColossalAI | Parallel execution, state distribution, and training recipes; 28–30 |
| Historical distributed-system studies | Alpa and other paper-specific systems | Algorithmic/partitioning case studies; verify maintenance separately; 28–29 |
| Post-training | TRL, verl, OpenRLHF, AReaL, slime | Trainer and rollout/environment orchestration roles; 31–36 |
| GPU kernel programming | CUDA, ROCm/HIP, Triton, CUTLASS, CuTe/CuTeDSL, Pallas, TileLang, ThunderKittens | Languages, compiler interfaces, and kernel libraries; 25–28 |
| Model kernels | FlashAttention, FlashInfer, FlashMLA, Liger Kernel, xFormers | Operator implementations with shape/dtype/device constraints; 26–27 |
| Graph compilation | torch.compile/Inductor, XLA, MLIR, TVM | Capture, transformation, lowering, and runtime integration; 28 |
| Communication | NCCL, RCCL, NVSHMEM, MPI, UCX | Collectives, one-sided communication, transport and runtime interfaces; 29–30 |
| Quantization/compression | TorchAO, NVIDIA ModelOpt, bitsandbytes; GPTQ/AWQ method implementations | Separate algorithm, artifact format, transformation tool, and execution kernel; 23, 39–41 |
| Datacenter inference | vLLM, SGLang, TensorRT-LLM | Model runtime/serving frameworks with overlapping responsibilities; 42–44 |
| Portable inference | ONNX Runtime, OpenVINO, MLC-LLM | Model representation, compilation, and target runtime routes; 43, 45 |
| Local inference | llama.cpp, GGML, MLX, MLX-LM, ExecuTorch | Engine, tensor library/framework, model layer, and edge runtime; 45 |
| Model-management interfaces | Ollama and comparable products | Packaging, model lifecycle, and serving interfaces; 43, 45–47 |
| Serving control/integration | NVIDIA Dynamo, Triton Inference Server, routing/scheduling infrastructure | Disaggregated serving/control integration; distinguish Triton Server from Triton kernel language; 43–47 |
| Evaluation | LM Evaluation Harness, HELM, benchmark-specific harnesses, MLPerf tooling | Reproducible task/system measurement; 06, 48, 61–63 |
| Tool connectivity | MCP implementations and typed tool adapters | Interoperability interfaces, not planning algorithms or authorization substitutes; 51–54 |
| Legacy/migration coverage | TGI, DeepSpeed-MII, older TensorRT-backend workflows, AutoGPTQ/AutoAWQ-era integrations | Retain important mechanisms and migration lessons; verify each project's status before adoption |

## Comparison record

| Boundary | Fields required for a defensible comparison |
|---|---|
| Model/interface | Exact weights, tokenizer/template/processor, quantization state and any quality-changing transformation |
| Software | Framework and engine full revisions, dependency lockfile, enabled kernels, graph/compiler settings, adapters and patches |
| Hardware/numerics | Device model/count, memory/interconnect, driver/compiler, dtype/accumulation, parallel configuration and determinism settings |
| Workload | Prompt/output distributions, lengths and modalities, offered arrival process, request corpus, task/scaffold and allowed retries |
| State | Cold/warm start, cache contents and hit policy, compilation/autotuning, warmup and allocator state |
| Outcomes | Primary quality gate; successful and offered denominators; latency/throughput units; tail distribution; errors, timeouts and censoring; independent-unit uncertainty |
| Resource account | Peak and retained memory, device work, communication, wall time and paid cost in their own units; construction versus steady-state costs |
| Provenance | Runnable entry point, input/manifest hashes, emitted artifacts, environment lock, inspection/execution status and known omissions |

[DERIVED] A compatibility statement must bind model, backend, dtype, shape, device and software revision. One executed case does not establish all combinations in a support matrix. A README claim is documentation evidence; a static code path is implementation evidence; an exercised test is execution evidence under its fixtures. Keep these labels distinct.

## Formats, methods and runtimes

[DERIVED] GGUF is a container and metadata format; GGML is a tensor library; llama.cpp is an inference implementation; Ollama adds packaging and lifecycle/serving interfaces. Quantization methods similarly differ from file layouts, conversion tools and kernels. A stored low-bit tensor cannot establish that a runtime executes a low-bit kernel or preserves a declared quality level.

[DERIVED] The Triton kernel language and Triton Inference Server serve different roles. A graph compiler can select an operator implementation while a server schedules requests around it; both can alter performance without changing the mathematical model. Attribute a measured change to the full controlled configuration, then use ablations to isolate layers if that is the scientific question.

## Acceptance at an integration boundary

[DERIVED] First qualify numerical and interface parity on meaningful edge cases. Then measure the offered workload, including failures, cold-state cost and state growth. A fast successful-request subset can conceal lower service reliability. A fused kernel's allocation improvement is not automatically an application latency improvement; a smaller client entry module is not automatically a field-measured faster reading experience.

[DERIVED] Chapter 28 owns capture/lowering/runtime boundaries, Chapters 29–30 own distributed state and recovery, Chapters 42–48 own inference/serving measurement, and Chapter 66 owns release acceptance. The reference-stack registry links fifty implementation surfaces to their using chapters and lab targets. Those labs are planned experiments unless a dated execution artifact says otherwise.
