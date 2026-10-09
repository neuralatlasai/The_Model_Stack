---
id: ms.references.28
entity_type: references
title: References
short_title: References
volume: 2
part: 5
chapter: 28
section: null
slug: references
parent: ms.chapter.28
prev_sibling: null
next_sibling: null
children: []
prerequisites:
- ms.chapter.19
- ms.chapter.25
- ms.chapter.26
- ms.chapter.27
downstream:
- ms.chapter.29
- ms.chapter.30
- ms.chapter.42
related: []
relations: []
axes:
  lifecycle:
  - pretraining
  - inference
  - serving
  mechanism:
  - graph_compilation
  - runtime_integration
  feedback_setting: []
  modality:
  - text
  - image
  - audio
papers: []
implementations:
- impl.nvidia-cuda
- impl.triton-language
- impl.nvidia-cutlass
- impl.amd-hip
- impl.pytorch
- impl.jax
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - OFFICIAL-DOCUMENTATION
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1200
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# References — Chapter 28

Primary texts were opened and inspected on **2026-10-09**. Eligible originating disclosures and release artifacts span **2025-12-01 through 2026-10-09 inclusive**. A versioned documentation snapshot is cited as the contract of that release; its release date does not become the invention date of tracing, automatic differentiation, compiler passes or graph replay. No older paper is made eligible by a later revision. All equations and analytical figures are authored derivations, not copied experimental results.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code / artifact | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R28.1 | technical report | PyTorch 2.14 Release Blog | PyTorch Foundation | Official release, 2026-09-02 | [Release text](https://pytorch.org/blog/pytorch-2-14-release-blog/) | [v2.14.0](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | NVGEMM, dynamic specifications, control-flow operators, Python 3.15, XPU graphs, AOTInductor loading/external constants, CUDA graph pools and Helion registry; §§28.1–28.6 |
| R28.2 | documentation | Autograd mechanics, PyTorch 2.14 | PyTorch contributors | Released snapshot, 2026-09-02 | [Versioned notes](https://docs.pytorch.org/docs/2.14/notes/autograd.html) | [v2.14.0](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | Saved tensors; in-place correctness checks and version counters; grad/no-grad/inference modes; complex differentiation convention; §§28.1, 28.5 |
| R28.3 | repository | JAX 0.11.2 release and JIT compilation snapshot | The JAX authors | Official release, 2026-09-17 | [Release record](https://github.com/jax-ml/jax/releases/tag/jax-v0.11.2) | [Pinned JIT guide](https://github.com/jax-ml/jax/blob/jax-v0.11.2/docs/jit-compilation.md) | official documentation | 2026-10-09 | Tracing and jaxpr, pure functions, static arguments, caching, temporary function identity, block_until_ready; release notes symbolic dimension bounds and inline phase; §§28.1–28.3, 28.6 |
| R28.4 | repository | JAX 0.9.0 release | The JAX authors | Official release, 2026-01-20 | [Release record](https://github.com/jax-ml/jax/releases/tag/jax-v0.9.0) | [Release tree](https://github.com/jax-ml/jax/tree/jax-v0.9.0) | official documentation | 2026-10-09 | NamedSharding serialization includes abstract mesh names; explicit thread guard and pmap rank behavior; §28.1. These are version-specific semantics, not sharding invention claims |
| R28.5 | documentation | Dynamo core concepts, PyTorch 2.14 | PyTorch contributors | Released snapshot, 2026-09-02 | [Versioned guide](https://docs.pytorch.org/docs/2.14/user_guide/torch_compiler/compile/programming_model.dynamo_core_concepts.html) | [v2.14.0](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | Graph capture, graph breaks, guards, recompilation and dynamic shapes; §§28.2, 28.6. Inspected the resolved user_guide path rather than the old redirect shell |
| R28.6 | documentation | torch.compiler, PyTorch 2.14 | PyTorch contributors | Released snapshot, 2026-09-02 | [Versioned compiler guide](https://docs.pytorch.org/docs/2.14/user_guide/torch_compiler/torch.compiler.html) | [v2.14.0](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | TorchDynamo capture, AOTAutograd forward/backward and TorchInductor backend responsibilities; §§28.2–28.3 |
| R28.7 | repository | LLVM/MLIR 22.1.0 pass-management artifact | LLVM Project contributors | Official release, 2026-02-24 | [Release record](https://github.com/llvm/llvm-project/releases/tag/llvmorg-22.1.0) | [Pinned PassManagement.md](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.0/mlir/docs/PassManagement.md) | official documentation | 2026-10-09 | Operation Pass, Pass Manager, operation scope and state/threading constraints. No sibling operation inspection/modification by an operation pass; §28.3 |
| R28.8 | repository | Apache TVM 0.23.0 architecture artifact | Apache TVM community | GitHub release, 2026-02-01 | [Release record](https://github.com/apache/tvm/releases/tag/v0.23.0) | [Pinned architecture](https://github.com/apache/tvm/blob/v0.23.0/docs/arch/index.rst) | official documentation | 2026-10-09 | Relax functions/TIR PrimFunc in IRModule, LegalizeOps, FuseOps/FuseTIR, schedule search, target translation, runtime Module/PackedFunc; §28.3 |
| R28.9 | documentation | CUDA Programming Guide 13.1: CUDA Graphs | NVIDIA | Rewritten guide release, 2025-12-04 | [Versioned graph guide](https://docs.nvidia.com/cuda/archive/13.1.0/cuda-programming-guide/04-special-topics/cuda-graphs.html) | [CUDA samples](https://github.com/NVIDIA/cuda-samples) | official documentation | 2026-10-09 | Creating/instantiating/executing graphs, graph update restrictions, conditional nodes and graph memory nodes; §28.4. Guide date paired with originating 13.1 announcement below |
| R28.10 | documentation | CUDA semantics, PyTorch 2.14 | PyTorch contributors | Released snapshot, 2026-09-02 | [Versioned notes](https://docs.pytorch.org/docs/2.14/notes/cuda.html) | [v2.14.0](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | CUDA graphs constraints, graph memory management, pool sharing order, stable addresses, streams, events, allocator backend caveats; §§28.4–28.6 |
| R28.11 | documentation | torch.library, PyTorch 2.14 | PyTorch contributors | Released snapshot, 2026-09-02 | [Versioned library API](https://docs.pytorch.org/docs/2.14/library.html) | [v2.14.0](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | custom_op, mutates_args, register_fake, register_autograd, opcheck checks and distinction from mathematical gradcheck, dynamic AOT dispatch checks; §28.5 |
| R28.12 | documentation | Foreign Function Interface, JAX 0.11.2 snapshot | The JAX authors | Released snapshot, 2026-09-17 | [Pinned FFI guide](https://github.com/jax-ml/jax/blob/jax-v0.11.2/docs/ffi.md) | [Release tree](https://github.com/jax-ml/jax/tree/jax-v0.11.2) | official documentation | 2026-10-09 | Typed FFI handler, registration, result shape/dtype, attributes and custom derivative example; §28.5. The guide retains 2024 copyright; the citation denotes the 2026 API artifact, not new tutorial authorship |
| R28.13 | documentation | Persistent compilation cache, JAX 0.11.2 snapshot | The JAX authors | Released snapshot, 2026-09-17 | [Pinned cache guide](https://github.com/jax-ml/jax/blob/jax-v0.11.2/docs/persistent_compilation_cache.md) | [Release tree](https://github.com/jax-ml/jax/tree/jax-v0.11.2) | official documentation | 2026-10-09 | Cache key components, storage configuration, minimum compile/time-size thresholds, multi-node rank-zero writing, mocked topology and security boundary; §§28.3, 28.6 |
| R28.14 | documentation | DTensor, PyTorch 2.14 | PyTorch contributors | Released snapshot, 2026-09-02 | [Versioned API](https://docs.pytorch.org/docs/2.14/distributed.tensor.html) | [v2.14.0](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | DeviceMesh, Shard, Replicate and Partial placements, redistribution and pending reduction semantics; §28.1 |
| R28.15 | technical report | NVIDIA CUDA 13.1 Powers Next-Gen GPU Programming with NVIDIA CUDA Tile and Performance Gains | Jonathan Bentz; Tony Scudiero; NVIDIA | Originating disclosure, 2025-12-04 | [Release announcement](https://developer.nvidia.com/blog/nvidia-cuda-13-1-powers-next-gen-gpu-programming-with-nvidia-cuda-tile-and-performance-gains/) | [cuTile Python](https://github.com/NVIDIA/cutile-python) | official documentation | 2026-10-09 | Rewritten CUDA Programming Guide disclosure establishing R28.9's release boundary; quantitative vendor gains not imported |

## Publication and inspection boundaries

LLVM's release API timestamp is February 24, 2026. TVM's actual GitHub release is February 1; a tentative January schedule is not substituted for it. PyTorch documentation uses the explicit 2.14 namespace and the release record anchors its artifact. JAX guides are pinned to a release tag, paired with that tag's release date. Older copyright or freshness comments are retained provenance, not hidden: the work selected is the released API snapshot, and established mechanisms are explained as book-authored reasoning.

Search and retrieval followed the reference stack's official documentation/release → full text → versioned repository sequence. Full HTML bodies or raw tagged files were inspected, including constraints and examples beyond abstracts or search snippets. Mutable project homes are discovery routes, not frozen executable artifacts. Release notes establish reported capability, not this book's successful execution of that capability.

## Evidence gaps

No matched PyTorch/JAX compiler experiment, cross-vendor graph replay, binary compatibility test, custom-operation gradient check or deployment benchmark has been executed for the book. No independent speed ranking is asserted. Numerical identities are derived under stated assumptions; framework implementation details are bounded to inspected snapshots. Performance remains UNVERIFIED until the protocol is run, and inaccessible compiler decisions are NOT-DISCLOSED. User-selected reference websites inform presentation and are not technical authority.
