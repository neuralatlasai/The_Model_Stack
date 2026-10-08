---
id: ms.references.3
entity_type: references
title: References — Numerical computation and a trustworthy training program
short_title: References 03
volume: 1
part: 1
chapter: 3
section: null
slug: references
parent: ms.chapter.3
prev_sibling: ms.verification.3
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
siblings_by_mechanism: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: [P01, P13, P18, P19]
implementations: [impl.pytorch, impl.jax, impl.nvidia-transformer-engine, impl.nvidia-cublas-cublaslt, impl.nvidia-cudnn, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# References — Chapter 03

[DERIVED] This ledger records primary full texts and exact official documentation surfaces actually opened on **2026-10-07**. Locators identify inspected method, experiment, or implementation material; an abstract alone is not used for detailed attribution. Documentation surface identifiers are recorded as displayed and do not establish a release announcement or tested installation. Repository links identify official projects only; no commit-level code audit is claimed.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani et al. | arXiv v7; NeurIPS2017 | https://arxiv.org/html/1706.03762v7 | https://github.com/tensorflow/tensor2tensor | peer-reviewed | 2026-10-07 | §§3.2.3,5–6; causal mask, training/evaluation protocol, Table 2; contextual architecture evidence, not validation of the book listing |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek-AI | arXiv v2,18Feb2025 | https://arxiv.org/html/2412.19437v2 | https://github.com/deepseek-ai/DeepSeek-V3 | preprint | 2026-10-07 | §3.3–3.3.3, AppendixB.1–B.2; role-specific precision, scaling/promotion, two-scale convergence and destabilizing ablation |
| P18 | paper | ZeRO: Memory Optimizations Toward Training Trillion Parameter Models | Rajbhandari et al. | arXiv v3; SC2020 | https://arxiv.org/html/1910.02054v3 | https://github.com/microsoft/DeepSpeed | peer-reviewed | 2026-10-07 | §§3–4; model-state accounting16P; distributed results are outside this chapter's numerical claim |
| P19 | paper | FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness | Dao et al. | arXiv v2; NeurIPS2022 | https://arxiv.org/html/2205.14135v2 | https://github.com/Dao-AILab/flash-attention | peer-reviewed | 2026-10-07 | §3 Algorithms1–2; online normalization, tiled attention, backward recomputation; architecture taught in Chapter 27 |
| R3.2 | paper | FP8 Formats for Deep Learning | Micikevicius et al. | arXiv v2,29Sep2022 | https://arxiv.org/html/2209.05433v2 | null | preprint | 2026-10-07 | §§2–4, Table 1, ImageNet Table 2; element encodings, scaling, emulated input quantization and controlled baseline comparisons |
| R3.3 | paper | Mixed Precision Training | Micikevicius et al. | arXiv v3,15Feb2018; ICLR2018 | https://arxiv.org/html/1710.03740v3 | null | peer-reviewed | 2026-10-07 | §§3.1–3.3,4.1–4.3; FP32 persistent updates, wider accumulation, task-dependent scaling, detection Table 2 and big-LSTM protocol |
| R3.4 | paper | A Study of BFLOAT16 for Deep Learning Training | Kalamkar et al. | arXiv v1,29May2019 | https://arxiv.org/html/1905.12322v1 | null | preprint | 2026-10-07 | §§2–4, Table 1 and image/language study descriptions; Quantlib emulation and FP32 accumulation/master; its subnormal handling is study-specific |
| R3.5 | paper | Microscaling Data Formats for Deep Learning | Rouhani et al. | arXiv v3,19Oct2023 | https://arxiv.org/html/2310.10537v3 | null | preprint | 2026-10-07 | §§2–4, Table 1, Algorithm 1, Tables2–5; block representation, conversion, compute flow and separate direct-cast/fine-tune/training studies |
| R3.6 | documentation | OCP Microscaling Formats (MX) Specification | Open Compute Project | v1.0,Sep2023 | https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf | null | official documentation | 2026-10-07 | §§5.3.3,5.4,6.3; FP4E2M1 Table 5, E8M0, rounding/saturation and exceptional-input conversion |
| R3.11 | documentation | PyTorch numerical and training documentation | PyTorch | inspected surface identifies2.14 | https://docs.pytorch.org/docs/2.14/ | https://github.com/pytorch/pytorch | official documentation | 2026-10-07 | Collection key for instruments; exact opened pages follow. Documentation identifier is not a release-status or executable-compatibility claim |
| R3.31 | documentation | Autograd mechanics | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/notes/autograd.html | null | official documentation | 2026-10-07 | How autograd encodes history; saved tensors; in-place correctness checks; gradient accumulation; division-by-zero graph example |
| R3.32 | documentation | Automatic Mixed Precision examples | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/notes/amp_examples.html | null | official documentation | 2026-10-07 | Typical mixed precision; gradient clipping; gradient accumulation; effective-batch scale invariant and once-per-optimizer unscaling |
| R3.33 | documentation | Numerical accuracy | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/notes/numerical_accuracy.html | null | official documentation | 2026-10-07 | Batched computations; extremal values; TF32 controls; reduced-precision reductions including split-K tuple; SDPA math upcasting |
| R3.34 | documentation | Automatic Mixed Precision package | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/amp.html | null | official documentation | 2026-10-07 | Autocast eligibility and CUDA op lists; gradient scaling; GradScaler signature/defaults and scale-below-one caveat |
| R3.35 | documentation | Reproducibility | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/notes/randomness.html | null | official documentation | 2026-10-07 | Randomness control; data-loader workers; cuDNN benchmarking; deterministic algorithms; cross-platform/version limitations |
| R3.36 | documentation | Gradcheck mechanics | PyTorch | 2.14 surface; page updated6May2026 | https://docs.pytorch.org/docs/2.14/notes/gradcheck.html | null | official documentation | 2026-10-07 | Default backward-mode real-to-real numerical Jacobian and fast backward-mode checks; mathematical procedure, not book-code execution |
| R3.37 | documentation | scaled_dot_product_attention | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html | null | official documentation | 2026-10-07 | Boolean mask semantics; dropout warning; backend selection; numerical differences and FP64 math backend |
| R3.38 | documentation | cross_entropy | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.cross_entropy.html | null | official documentation | 2026-10-07 | Input/target shapes; class-index domain; ignore_index; none/mean/sum reduction and smoothing semantics |
| R3.39 | documentation | torch.utils.checkpoint | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/checkpoint.html | null | official documentation | 2026-10-07 | Non-reentrant recommendation/differences, early-stop replay and RNG/device-state warning |
| R3.40 | documentation | clip_grad_norm_ | PyTorch | 2.14 surface | https://docs.pytorch.org/docs/2.14/generated/torch.nn.utils.clip_grad_norm_.html | null | official documentation | 2026-10-07 | Global concatenated norm; in-place scaling; returned norm and error_if_nonfinite option |
| R3.12 | documentation | Transformer Engine low-precision documentation | NVIDIA | current inspected surface2.20.2 | https://docs.nvidia.com/deeplearning/transformer-engine/ | https://github.com/NVIDIA/TransformerEngine | official documentation | 2026-10-07 | Collection key; exact accessed feature/API pages below, not earlier navigation-only user-guide paths |
| R3.41 | documentation | NVFP4 training | NVIDIA | 2.20.2 surface | https://docs.nvidia.com/deeplearning/transformer-engine/features/low_precision_training/nvfp4/nvfp4.html | null | official documentation | 2026-10-07 | Data format; local E4M3 and global FP32 scales; granularity, hardware requirements and recipe methodology |
| R3.42 | documentation | Common API recipes | NVIDIA | 2.20.2 surface | https://docs.nvidia.com/deeplearning/transformer-engine/api/common.html | null | official documentation | 2026-10-07 | DelayedScaling/Float8CurrentScaling/MXFP8BlockScaling/NVFP4BlockScaling parameters and defaults |
| R3.43 | documentation | FP8 delayed scaling | NVIDIA | 2.20.2 surface | https://docs.nvidia.com/deeplearning/transformer-engine/features/low_precision_training/fp8_delayed_scaling/fp8_delayed_scaling.html | null | official documentation | 2026-10-07 | Scaling mechanism; amax history rotation, ratio scale, history reduction and PyTorch/JAX context behavior |
| R3.44 | documentation | FP8 current scaling | NVIDIA | 2.20.2 surface | https://docs.nvidia.com/deeplearning/transformer-engine/features/low_precision_training/fp8_current_scaling/fp8_current_scaling.html | null | official documentation | 2026-10-07 | Current-tensor maximum pass, scaling workflow, distributed maximum synchronization and overhead boundary |
| R3.45 | documentation | MXFP8 training | NVIDIA | 2.20.2 surface | https://docs.nvidia.com/deeplearning/transformer-engine/features/low_precision_training/mxfp8/mxfp8.html | null | official documentation | 2026-10-07 | 32-element E8M0 blocks, row/column representation mismatch and hardware constraints |
| R3.13 | documentation | cuBLAS library | NVIDIA | 13.4 surface | https://docs.nvidia.com/cuda/cublas/index.html | null | official documentation | 2026-10-07 | §2.1.4 Results Reproducibility, including streams, workspace, fixed-point-emulation and atomic-routine exceptions; compute-type API as applicable |
| R3.14 | documentation | TorchAO training workflow | PyTorch | unpinned main; page updated30Sep2026 | https://docs.pytorch.org/ao/main/workflows/training.html | https://github.com/pytorch/ao | official documentation | 2026-10-07 | Float8 Linear recipes; prototype labels; H100 benchmark table, workload/compile/FSDP2/SAC settings and historical benchmark commits |
| R3.15 | course | CS336 Language Modeling from Scratch | Stanford University | Spring2026 course page | https://cs336.stanford.edu/ | null | official documentation | 2026-10-07 | Assignment/lecture sequence as book_plan.md curriculum anchor; no research result attributed to a course homepage |
| R3.16 | documentation | JAX autodiff and execution documentation | JAX authors | unpinned latest | https://docs.jax.dev/ | https://github.com/jax-ml/jax | official documentation | 2026-10-07 | Collection key; exact accessed notebook, PRNG, precision and checkpoint pages below |
| R3.46 | documentation | Autodiff cookbook | JAX authors | unpinned latest | https://docs.jax.dev/en/latest/notebooks/autodiff_cookbook.html | null | official documentation | 2026-10-07 | JVP/VJP construction and numerical directional checks |
| R3.47 | documentation | Pseudorandom numbers | JAX authors | unpinned latest | https://docs.jax.dev/en/latest/random-numbers.html | null | official documentation | 2026-10-07 | Explicit immutable keys; splitting; consequences of key reuse |
| R3.48 | documentation | jax.default_matmul_precision | JAX authors | unpinned latest | https://docs.jax.dev/en/latest/_autosummary/jax.default_matmul_precision.html | null | official documentation | 2026-10-07 | Operand-precision control and backend-dependent support |
| R3.49 | documentation | Gradient checkpointing | JAX authors | unpinned latest | https://docs.jax.dev/en/latest/gradient-checkpointing.html | null | official documentation | 2026-10-07 | Residual saving, rematerialization and checkpoint policies |
| R3.17 | documentation | cudnn_graph library | NVIDIA | unpinned backend/latest | https://docs.nvidia.com/deeplearning/cudnn/backend/latest/api/cudnn-graph-library.html | null | official documentation | 2026-10-07 | cudnnBackendNumericalNote_t query and CUDNN_NUMERICAL_NOTE_NONDETERMINISTIC; no runtime engine-selection audit |
| R3.18 | paper | Automatic Differentiation in Machine Learning: a Survey | Baydin et al. | JMLR18(153),2018 | https://jmlr.org/papers/volume18/17-468/17-468.pdf | null | peer-reviewed | 2026-10-07 | §§3–4; forward/reverse graph mechanics; book DAG derivation is stated independently |
| R3.20 | paper | Root Mean Square Layer Normalization | Zhang and Sennrich | arXiv v1; NeurIPS2019 | https://arxiv.org/html/1910.07467v1 | null | peer-reviewed | 2026-10-07 | Eq 4, invariance Table 1, §6.1 and AppendixA.1, timing Table 2; distinct L2-normalization comparison |
| R3.21 | paper | Layer Normalization | Ba, Kiros, Hinton | arXiv v1,2016 | https://arxiv.org/html/1607.06450v1 | null | preprint | 2026-10-07 | §3 Eq 3; feature-axis statistics and learned affine parameters |
| R3.22 | paper | On the difficulty of training Recurrent Neural Networks | Pascanu, Mikolov, Bengio | arXiv v2; ICML2013 | https://arxiv.org/html/1211.5063v2 | null | peer-reviewed | 2026-10-07 | Gradient norm clipping algorithm; §4.2 natural-task design, Tables1–2; clipping separated from regularizer |
| R3.23 | paper | 8-bit Optimizers via Block-wise Quantization | Dettmers et al. | arXiv v2; ICLR2022 | https://arxiv.org/html/2110.02861v2 | null | peer-reviewed | 2026-10-07 | Background sibling route only; optimizer-state methods remain canonical in Chapter 20 |
| R3.24 | paper | Training Deep Nets with Sublinear Memory Cost | Chen et al. | arXiv v1,2016 | https://arxiv.org/html/1604.06174v1 | null | preprint | 2026-10-07 | §§4.1–4.4 Algorithms1–3 and equal-state chain analysis; §5 experimental accounting, ResNet/LSTM measurements |
| R3.25 | documentation | Floating Point and IEEE754 Compliance for NVIDIA GPUs | NVIDIA | 13.4 documentation surface; historical examples | https://docs.nvidia.com/cuda/floating-point/index.html | null | official documentation | 2026-10-07 | §§2–5; arithmetic/FMA/dot schedules and compiler flags. Historical CPU-without-FMA statements are not general 2026 claims |
| R3.26 | paper | Accurate Computation of the Log-Sum-Exp and Softmax Functions | Blanchard, D.J.Higham, N.J.Higham | arXiv v1,8Sep2019 | https://arxiv.org/pdf/1909.03469 | null | preprint | 2026-10-07 | Full PDF §§2–5; conditioning/rounding analysis, Algorithms1–4, MNIST-logit experiment and division-free comparison; v1 confirmed on abstract history |
| R3.27 | technical report | Pretraining Large Language Models with NVFP4 | NVIDIA authors | arXiv v1,29Sep2025 | https://arxiv.org/html/2509.25149v1 | null | preprint | 2026-10-07 | §§2–4, AppendixB/E; representation, rotation, square weight scaling, stochastic gradients, high-precision exemptions,12B/10T protocol and ablations |
| R3.28 | paper | QuartetII: Accurate LLM Pre-Training in NVFP4 by Improved Unbiased Gradient Estimation | QuartetII authors | arXiv v1,30Jan2026 | https://arxiv.org/html/2601.22813v1 | null | preprint | 2026-10-07 | §3.3 Algorithm 1, §6.1–6.2 controlled backward variants and Nanochat, §7 post-hoc range alignment and speedup boundaries; benchmark claims not independently reproduced |
| R3.29 | paper | Full-Stack FP4: Stable LLM Pretraining with Quantized Projections, Optimizers, and Attention | Full-Stack FP4 authors | arXiv v1,5Jul2026 | https://arxiv.org/html/2607.04422v1 | null | preprint | 2026-10-07 | §§3.2–3.4,4,6; second-moment transform, sensitive attention exceptions, fake-quantization A800 protocol, Table 3 ablations, AppendixH; prospective code |
| R3.30 | paper | Understanding the difficulty of training deep feedforward neural networks | Glorot and Bengio | PMLR9,2010 | https://proceedings.mlr.press/v9/glorot10a/glorot10a.pdf | null | peer-reviewed | 2026-10-07 | §§3–4, especially4.2.1 Eqs 4–12; initialization conditions and forward/backward variance compromise |
| R3.1 | paper | IEEE Standard for Floating-Point Arithmetic | IEEE | 2019 | null | null | UNVERIFIED | null | Historical candidate; text not inspected; no source-dependent claim rests on it |
| R3.7 | paper | Accuracy and Stability of Numerical Algorithms, second edition | Higham | 2002 | null | null | UNVERIFIED | null | Historical candidate; text not inspected; no source-dependent claim rests on it |
| R3.8 | paper | What Every Computer Scientist Should Know About Floating-Point Arithmetic | Goldberg | 1991 | null | null | UNVERIFIED | null | Historical candidate; text not inspected; no source-dependent claim rests on it |
| R3.9 | paper | Further Remarks on Reducing Truncation Errors | Kahan | 1965 | null | null | UNVERIFIED | null | Historical candidate; text not inspected; no source-dependent claim rests on it |
| R3.10 | paper | Note on a Method for Calculating Corrected Sums of Squares and Products | Welford | 1962 | null | null | UNVERIFIED | null | Historical candidate; text not inspected; no source-dependent claim rests on it |
| R3.19 | paper | Evaluating Derivatives, second edition | Griewank and Walther | 2008 | null | null | UNVERIFIED | null | Historical candidate; text not inspected; no source-dependent claim rests on it |

## Historical candidates without source authority

[UNVERIFIED] Earlier drafts listed IEEE754 (R3.1), Higham2002 (R3.7), Goldberg1991 (R3.8), Kahan1965 (R3.9), Welford1962 (R3.10), and Griewank/Walther2008 (R3.19) without inspecting their texts. They remain historical candidates, with no inherited access date or reviewed status. The manuscript states its rounding/reduction/variance derivations directly; these unopened works are not cited as empirical or implementation evidence.

## Access and revision boundaries

[OFFICIAL-DOCUMENTATION] The inspected PyTorch stable route identified a2.14 destination; exact2.14 pages above supplied readable content. Transformer Engine's feature/API routes supplied2.20.2 content. JAX latest, TorchAO main, and cuDNN backend/latest remain explicitly unpinned snapshots. The TorchAO benchmark embeds older development revisions that belong to that benchmark, not to the page's current software environment.

[UNVERIFIED] Some legacy Transformer Engine user-guide routes and an attempted arXiv HTML conversion of R3.26 failed; the exact readable routes above replace them. The JAX default_dtypes page returned only a redirect in this inspection and supports no additional64-bit-default claim. No compiled code, fixture, native FP4 execution, or independent source benchmark reproduction is asserted.

[DERIVED] Source routes follow the chapter's reference-stack coverage. TorchAO and CS336 are explicit Chapter 03 plan anchors. OCP is the normative format document reached through the microscaling primary paper and required FP4 coverage; PMLR/initialization and the numerical-analysis/AD papers supply primary detail for the plan's initialization, stable-primitive, and differentiation obligations. They are not used to introduce unrelated implementations or lab rankings.
