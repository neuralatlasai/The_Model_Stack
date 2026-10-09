---
id: ms.references.26
entity_type: references
title: References
short_title: References
volume: 2
part: 5
chapter: 26
section: null
slug: references
parent: ms.chapter.26
prev_sibling: null
next_sibling: null
children: []
prerequisites:
- ms.chapter.3
- ms.chapter.5
- ms.chapter.25
downstream:
- ms.chapter.27
- ms.chapter.28
- ms.chapter.29
- ms.chapter.30
related: []
relations: []
axes:
  lifecycle:
  - pretraining
  - inference
  - serving
  mechanism:
  - kernel_programming
  - numerical_equivalence
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

# References — Chapter26

Primary surfaces were opened on **2026-10-09**. The eligibility window is **2025-12-01 through2026-10-09 inclusive**. Every cited work is a dated originating disclosure or specifically released documentation/repository artifact inside it. Release dates are **not invention dates**. No out-of-window paper is relabelled by a later revision. Mathematical specifications, identities and analytical figures are book-authored derivations.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R26.1 | documentation | CUDA Programming Guide 13.1: Writing CUDA SIMT Kernels | NVIDIA | Released/disclosed 2025-12-04 | [Primary text](https://docs.nvidia.com/cuda/archive/13.1.0/cuda-programming-guide/02-basics/writing-cuda-kernels.html) | [Artifact](https://github.com/NVIDIA/cuda-samples) | official documentation | 2026-10-09 | 26.1: sections2.2.2–2.2.7 hierarchy, memory, coalescing, occupancy; release snapshot, not mechanism origin |
| R26.2 | technical report | CUDA13.1 and CUDA Tile originating disclosure | Jonathan Bentz; Tony Scudiero; NVIDIA | Released/disclosed 2025-12-04 | [Primary text](https://developer.nvidia.com/blog/nvidia-cuda-13-1-powers-next-gen-gpu-programming-with-nvidia-cuda-tile-and-performance-gains/) | [Artifact](https://github.com/NVIDIA/cutile-python) | official documentation | 2026-10-09 | 26.1–26.2: CUDA Tile programming, first-version capability limits, rewritten guide disclosure; no speedup imported |
| R26.3 | repository | Triton3.6.0 release artifact | Triton contributors | Released/disclosed 2026-01-20 | [Primary text](https://github.com/triton-lang/triton/releases/tag/v3.6.0) | [Artifact](https://github.com/triton-lang/triton/tree/v3.6.0) | official documentation | 2026-10-09 | 26.1–26.2: Dialect and Frontend; Backend and Compiler; Gluon layouts. PyPI first publicationJan20; GitHubreleaseJan21; tag7c56a5e |
| R26.4 | documentation | HIP programming model, ROCm7.2.0 | AMD | Released/disclosed 2026-01-21 | [Primary text](https://rocm.docs.amd.com/projects/HIP/en/docs-7.2.0/understand/programming_model.html) | [Artifact](https://github.com/ROCm/HIP) | official documentation | 2026-10-09 | 26.1–26.2: Hierarchical thread model, Memory model, Device programming; date crosschecked ROCm7.2.0 release history |
| R26.5 | repository | CUTLASS/CuTeDSL4.3.5 release and overview | NVIDIA CUTLASS contributors | Released/disclosed 2026-01-09 | [Primary text](https://github.com/NVIDIA/cutlass/releases/tag/v4.3.5) | [Artifact](https://github.com/NVIDIA/cutlass/blob/v4.3.5/media/docs/pythonDSL/overview.rst) | official documentation | 2026-10-09 | 26.2: Core CuTeDSL abstractions; Key concepts; Relationship to CUTLASS C++; stale roadmap excluded |
| R26.6 | repository | JAX0.9.0: released Pallas interface | JAX authors | Released/disclosed 2026-01-20 | [Primary text](https://github.com/jax-ml/jax/releases/tag/jax-v0.9.0) | [Artifact](https://github.com/jax-ml/jax/blob/jax-v0.9.0/docs/pallas/quickstart.md) | official documentation | 2026-10-09 | 26.2: Pallas programming model, Grid semantics, Block specs; release contract only, not tutorial origin |
| R26.7 | repository | TileLang0.1.8 release artifact | TileLang contributors | Released/disclosed 2026-02-16 | [Primary text](https://github.com/tile-ai/tilelang/releases/tag/v0.1.8) | [Artifact](https://github.com/tile-ai/tilelang/blob/v0.1.8/README.md) | official documentation | 2026-10-09 | 26.2: Quick Start shared/fragment/pipelined GEMM; Latest NewsDec18,2025 CuTeDSL backend; tag41b2552 |
| R26.8 | technical report | ThunderKittens2.0: Even Faster Kernels for Your GPUs | Stuart Sul; Chris Ré; Hazy Research | Released/disclosed 2026-02-19 | [Primary text](https://hazyresearch.stanford.edu/blog/2026-02-19-tk-2) | [Artifact](https://github.com/HazyResearch/ThunderKittens) | official documentation | 2026-10-09 | 26.2: Memory consistency; tensor/memory pipelining; Occupancy; Benchmarking GPU kernels properly and Figure1 caption; linked mutable repo not executed |
| R26.9 | documentation | CUDA13.1 Asynchronous Data Copies | NVIDIA | Released/disclosed 2025-12-04 | [Primary text](https://docs.nvidia.com/cuda/archive/13.1.0/cuda-programming-guide/04-special-topics/async-copies.html) | [Artifact](https://github.com/NVIDIA/cuda-samples) | official documentation | 2026-10-09 | 26.4: sections4.11.1–4.11.2 LDGSTS, producer/consumer specialization, TMA alignment/fallback/undefined preconditions |
| R26.10 | technical report | Better Bug Detection: Compute Sanitizer Compile-Time Instrumentation | Mark Stephenson; Sana Damani; Anis Ladram; NVIDIA | Released/disclosed 2025-12-10 | [Primary text](https://developer.nvidia.com/blog/better-bug-detection-how-compile-time-instrumentation-for-compute-sanitizer-enhances-memory-safety/) | null | official documentation | 2026-10-09 | 26.6: Improving coverage with a compiler analysis; instrumentation costs and allocation/race caveats |
| R26.11 | technical report | PyTorch2.14 Release Blog | PyTorch Foundation | Released/disclosed 2026-09-02 | [Primary text](https://pytorch.org/blog/pytorch-2-14-release-blog/) | [Artifact](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | 26.2–26.5: NVGEMM, a CuTeDSL GEMM Backend for Inductor; candidate selection/epilogue integration, no universal gain |
| R26.12 | technical report | Boosting MoE Training Throughput with Advanced Fusion Kernels | Rachit Garg; Matthew Nicely; NVIDIA | Released/disclosed 2026-06-15 | [Primary text](https://developer.nvidia.com/blog/boosting-moe-training-throughput-with-advanced-fusion-kernels/) | [Artifact](https://github.com/NVIDIA/cudnn-frontend) | official documentation | 2026-10-09 | 26.3–26.4: bottlenecks, GLU epilogue weight repacking, host-device synchronization; no quantitative gain reused |
| R26.13 | documentation | Embedding functional API, PyTorch2.14 | PyTorch contributors | Released/disclosed 2026-09-02 | [Primary text](https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.embedding.html) | [Artifact](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | 26.3: input/weight, padding_idx notes, max_norm, frequency scaling, sparse gradient parameters |
| R26.14 | documentation | Cross-entropy functional API, PyTorch2.14 | PyTorch contributors | Released/disclosed 2026-09-02 | [Primary text](https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.cross_entropy.html) | [Artifact](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | 26.3: target representations, ignore_index restriction, reduction, label_smoothing; derived procedure explicitly restricted |
| R26.15 | documentation | AdamW API, PyTorch2.14 | PyTorch contributors | Released/disclosed 2026-09-02 | [Primary text](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html) | [Artifact](https://github.com/pytorch/pytorch/tree/v2.14.0) | official documentation | 2026-10-09 | 26.3: displayed update, initialization and foreach/fused/capturable/differentiable/AMSGrad modes |
| R26.16 | repository | Triton3.8.0 release and autotuner | Triton contributors | Released/disclosed 2026-08-28 | [Primary text](https://github.com/triton-lang/triton/releases/tag/v3.8.0) | [Artifact](https://github.com/triton-lang/triton/blob/v3.8.0/python/triton/runtime/autotuner.py) | official documentation | 2026-10-09 | 26.5: autotuning listener, deterministic JIT keys, incomplete caches; Autotuner.__init__/run reset_to_zero/restore_value; tutorial03 configs inspected |
| R26.17 | technical report | PyTorch2.10 Release Blog | PyTorch Foundation | Released/disclosed 2026-01-21 | [Primary text](https://pytorch.org/blog/pytorch-2-10-release-blog/) | [Artifact](https://github.com/pytorch/pytorch/tree/v2.10.0) | official documentation | 2026-10-09 | 26.6: DebugMode/tensor hashing; no arbitrary-kernel bitwise guarantee |
| R26.18 | repository | JAX0.11.2 release artifact | JAX authors | Released/disclosed 2026-09-17 | [Primary text](https://github.com/jax-ml/jax/releases/tag/jax-v0.11.2) | [Artifact](https://github.com/jax-ml/jax/tree/jax-v0.11.2) | official documentation | 2026-10-09 | 26.6: Bug fixes arccosh/acosh, Bessel/eigh gradients and sinc; version sensitivity, no defect claimed in unexecuted book kernels |

## Publication and inspection boundaries

The CUDA guide is the rewritten13.1 release announced December4,2025; archive paths identify the snapshot. HIP uses the7.2.0 namespace and PyTorch uses2.14. Source text retained in a release can predate it: these artifacts document current release contracts, not new discovery of established mathematics. JAX's Pallas quickstart contains an older editorial freshness comment; the cited work is the **released0.9.0 artifact**, paired with its release record, not a purported January2026 research invention. CUTLASS's stale roadmap is excluded. ThunderKittens' inspected technical deep dive is a distinct February19 work, separate from its repository's January announcement.

Triton3.6's release history reports first PyPI publication January20, while its GitHub page is timestamped January21. Both fall inside the window. Linked mutable repositories are retrieval routes; their binary compatibility remains UNVERIFIED until a commit/build is pinned by an executor. No conference paper was inserted from outside the window to satisfy a prestige quota.

## Evidence gaps

No matched eight-interface study, independent replication, installed-driver check, sanitizer run, power trace or cloud-price observation was performed. Vendor charts are not reproduced as book results. No executed speedup, pass rate, best-language ranking or production-readiness claim is made. Proposed tests remain UNVERIFIED. Missing matched protocols or uncertainty are NOT-DISCLOSED, not invented. User-selected comparison sites guide presentation and are not mechanism authority.
