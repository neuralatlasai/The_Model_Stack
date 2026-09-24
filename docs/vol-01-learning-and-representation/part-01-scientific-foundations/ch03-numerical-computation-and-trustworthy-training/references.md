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
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# References — Chapter 03

Every work cited in Chapter 03. *Accessed* records 2026-09-20 only for URLs that were actually opened while writing; a source that was not opened has Status = UNVERIFIED and Accessed = null, and the chapter rests no source-dependent claim on it (the claims that cite R3.7, R3.9, and R3.10 are MATHEMATICALLY-DERIVED in the text, with the derivation given or sketched, so they do not depend on the unopened book or article).

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin | arXiv 2017 (NeurIPS 2017) | https://arxiv.org/abs/1706.03762 | null | peer-reviewed | 2026-09-20 (abs page) | Causal masking that Eq. 3.19 encodes (§3.5) |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek-AI | arXiv 2024 | https://arxiv.org/abs/2412.19437 | https://github.com/deepseek-ai | preprint | 2026-09-20 (PDF pp. 14–18, §3.2.3–§3.3.3 read) | FP8 recipe: E4M3 on all tensors, 1×128 tiles / 128×128 blocks, online scaling, FP32 promotion at N_C = 128, "around 14 bits", < 0.25% relative loss error on two scales for ≈ 1T tokens, BF16 moments with FP32 master weights and gradients, E5M6 cache, recomputation of RMSNorm and MLA up-projections (§3.1, §3.3, §3.4) |
| P18 | paper | ZeRO: Memory Optimizations Toward Training Trillion Parameter Models | Rajbhandari, Rasley, Ruwase, He | arXiv 2019 (SC 2020) | https://arxiv.org/abs/1910.02054 | https://www.deepspeed.ai/ | peer-reviewed | 2026-09-20 (PDF pp. 6–8 read) | 2Ψ + 2Ψ + 12Ψ = 16Ψ bytes for mixed-precision Adam; ≈ 33% recomputation overhead (§3.3, §3.4) |
| P19 | paper | FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness | Dao, Fu, Ermon, Rudra, Ré | arXiv 2022 (NeurIPS 2022) | https://arxiv.org/abs/2205.14135 | https://github.com/Dao-AILab/flash-attention | peer-reviewed | 2026-09-20 (abs page) | Tiled exact attention; online softmax identity of Algorithm 3.2; recomputation in backward (§3.2, §3.3) |
| R3.1 | documentation | IEEE Standard for Floating-Point Arithmetic (IEEE Std 754-2019; first edition 1985) | IEEE | 2019 | null | null | UNVERIFIED | null | Format layouts and round-to-nearest-even; Table 3.1 values are re-derived from Eq. 3.1–3.3, not taken from the standard's text (§3.1) |
| R3.2 | paper | FP8 Formats for Deep Learning | Micikevicius, Stosic, Burgess, Cornea, Dubey, Grisenthwaite, Ha, Heinecke, Judd, Kamalu, Mellempudi, Oberman, Shoeybi, Siu, Wu | arXiv 2022 (v2, 29 Sep 2022) | https://arxiv.org/abs/2209.05433 | null | preprint | 2026-09-20 (abs page and PDF pp. 1–6 read) | Table 1: bias 7/15, max 448 / 57,344, min normal 2^−6 / 2^−14, min subnormal 2^−9 / 2^−16; E4M3 without infinities, one NaN pattern; E4M3 for weights/activations, E5M2 for gradients; per-tensor scaling; saturating conversion; simulated-FP8 results up to 175B parameters (§3.1, §3.4) |
| R3.3 | paper | Mixed Precision Training | Micikevicius, Narang, Alben, Diamos, Elsen, Garcia, Ginsburg, Houston, Kuchaiev, Venkatesh, Wu | ICLR 2018 | https://arxiv.org/abs/1710.03740 | null | peer-reviewed | 2026-09-20 (abs page) | FP32 master copy, loss scaling, FP16 storage; "nearly 2x" memory reduction (§3.4, README) |
| R3.4 | paper | A Study of BFLOAT16 for Deep Learning Training | Kalamkar, Mudigere, Mellempudi, Das, et al. | arXiv 2019 | https://arxiv.org/abs/1905.12322 | null | preprint | 2026-09-20 (abs page) | BF16 has FP32's range; same iterations, no hyperparameter changes (§3.1, §3.4) |
| R3.5 | paper | Microscaling Data Formats for Deep Learning | Rouhani, Zhao, More, Hall, Khodamoradi, Deng, et al. | arXiv 2023 (v3, 19 Oct 2023) | https://arxiv.org/abs/2310.10537 | null | preprint | 2026-09-20 (abs page and PDF pp. 1–4 read) | Table 1: block size 32, E8M0 8-bit scale, MXFP8 (E4M3/E5M2), MXFP6 (E2M3/E3M2), MXFP4 (E2M1), MXINT8; Algorithm 1 (block conversion); FP32 master copy in the compute flow (§3.1, §3.4) |
| R3.6 | documentation | OCP Microscaling Formats (MX) Specification v1.0 | Open Compute Project | 2023 | null | null | UNVERIFIED | null | Named by R3.5 as the normative source for E2M1 and E8M0 encodings; E2M1 constants in Table 3.1 are derived from Eq. 3.1–3.3 under the no-infinity/no-NaN assumption [UNVERIFIED against the specification text] (§3.1) |
| R3.7 | paper | Accuracy and Stability of Numerical Algorithms, 2nd ed. | N. J. Higham | SIAM, 2002 | null | null | UNVERIFIED | null | Standard model of floating-point arithmetic; γ_k notation; summation error bounds (derivation reproduced in §3.2) |
| R3.8 | paper | What Every Computer Scientist Should Know About Floating-Point Arithmetic | D. Goldberg | ACM Computing Surveys, 1991 | null | null | UNVERIFIED | null | Lineage only (README) |
| R3.9 | paper | Further Remarks on Reducing Truncation Errors | W. Kahan | Communications of the ACM, 1965 | null | null | UNVERIFIED | null | Compensated summation (named in §3.2, §3.4) |
| R3.10 | paper | Note on a Method for Calculating Corrected Sums of Squares and Products | B. P. Welford | Technometrics, 1962 | null | null | UNVERIFIED | null | One-pass mean/variance recurrence of Algorithm 3.3 (recurrence verified algebraically in the text's invariant) |
| R3.11 | documentation | PyTorch documentation, stable (resolved to 2.14): *Autograd mechanics*; *Automatic Mixed Precision package*; *Reproducibility*; *CUDA semantics*; `clip_grad_norm_`; `gradcheck`; `torch.utils.checkpoint` | PyTorch | accessed 2026 | https://pytorch.org/docs/stable/ | https://github.com/pytorch/pytorch | official documentation | 2026-09-20 (seven pages under docs.pytorch.org/docs/2.14/) | Saved tensors and version counters; `.grad` accumulation; autocast op lists; GradScaler defaults 65536 / 2.0 / 0.5 / 2000; BF16 default reduced-precision reduction; TF32 "10 bits of mantissa"; clip-norm semantics; gradcheck FP64 defaults; checkpoint `use_reentrant=False` and RNG juggling; reproducibility non-guarantees (§3.1–§3.6) |
| R3.12 | documentation | NVIDIA Transformer Engine documentation: *Using FP8 and FP4 with Transformer Engine* (2.14.0); *MXFP8* (2.13.0); *FP8 Delayed Scaling*, *FP8 Current Scaling*, *NVFP4*, *FP8 Blockwise Scaling* (2.14.0) | NVIDIA | accessed 2026 | https://docs.nvidia.com/deeplearning/transformer-engine/ | https://github.com/NVIDIA | official documentation | 2026-09-20 (release-2.13 and release-2.14 pages opened; the delayed-scaling, current-scaling, NVFP4 and blockwise pages returned navigation only, and the statements quoted from them were read from docs.nvidia.com search-index excerpts of the same pages) | Recipe classes `DelayedScaling`, `Float8CurrentScaling`, `MXFP8BlockScaling`, `NVFP4BlockScaling`, `Float8BlockScaling`; MXFP8: 32 consecutive values, E8M0, max_fp8 = 448, non-transposable, Blackwell requirement; current scaling: two reads, amax synchronization; NVFP4: E4M3 scale per block of 16, 16×16 for weights (§3.1, §3.4) |
| R3.13 | documentation | cuBLAS library documentation | NVIDIA | accessed 2026 | https://docs.nvidia.com/cuda/cublas/ | null | official documentation | 2026-09-20 | `cublasComputeType_t` as a precision mode separate from operand types; bitwise reproducibility statement (same toolkit, architecture, SM count); multi-stream caveat; `CUBLAS_WORKSPACE_CONFIG` `:16:8` / `:4096:8` (≈ 24 MiB); atomics note (§3.1, §3.2, §3.6) |
| R3.14 | repository | TorchAO (repository README and training workflow docs) | PyTorch | accessed 2026 | https://github.com/pytorch/ao | https://github.com/pytorch/ao | official documentation | 2026-09-20 (README; docs.pytorch.org/ao/main/workflows/training.html) | float8 training recipes `tensorwise`, `rowwise`, `rowwise_with_gw_hp`; `convert_to_float8_training`; documented Llama3-8b 8×H100 and 512-GPU/405B figures; MXFP8 training as prototype (§3.4) |
| R3.15 | course | Stanford CS336: Language Modeling from Scratch, Spring 2026 | Stanford University | 2026 | https://cs336.stanford.edu/ | null | official documentation | 2026-09-20 | Assignment 1 (tokenizer, Transformer, optimizer from scratch) and Lecture 2 (resource accounting) as the curriculum anchor (§3.5, README) |
| R3.16 | documentation | JAX documentation: *Pseudorandom numbers*; *Automatic differentiation*; *Gradient checkpointing*; `jax.default_matmul_precision` | JAX authors | accessed 2026 | https://docs.jax.dev/ | https://github.com/jax-ml/jax | official documentation | 2026-09-20 (four pages under docs.jax.dev/en/latest/) | Explicit PRNG keys and `split()`; `check_grads`; `jax.checkpoint`/`jax.remat` residual recomputation and policies; matmul precision levels (§3.1, §3.3, §3.6) |
| R3.17 | documentation | cuDNN backend API reference, `cudnn_graph` library | NVIDIA | accessed 2026 | https://docs.nvidia.com/deeplearning/cudnn/ | null | official documentation | 2026-09-20 (backend/latest/api/cudnn-graph-library.html) | `CUDNN_NUMERICAL_NOTE_NONDETERMINISTIC`; heuristic engine-selection modes (§3.6) |
| R3.18 | paper | Automatic Differentiation in Machine Learning: a Survey | Baydin, Pearlmutter, Radul, Siskind | JMLR 18(153), 2018 | https://arxiv.org/abs/1502.05767 | null | peer-reviewed | 2026-09-20 (abs page) | Background for forward/reverse mode (§3.3) |
| R3.19 | paper | Evaluating Derivatives: Principles and Techniques of Algorithmic Differentiation, 2nd ed. | Griewank, Walther | SIAM, 2008 | null | null | UNVERIFIED | null | Background only (§3.3) |
| R3.20 | paper | Root Mean Square Layer Normalization | Zhang, Sennrich | NeurIPS 2019 | https://arxiv.org/abs/1910.07467 | null | peer-reviewed | 2026-09-20 (abs page) | RMSNorm statistic of Eq. 3.8 (§3.2) |
| R3.21 | paper | Layer Normalization | Ba, Kiros, Hinton | arXiv 2016 | https://arxiv.org/abs/1607.06450 | null | preprint | 2026-09-20 (abs page) | LayerNorm statistics of Eq. 3.8 (§3.2) |
| R3.22 | paper | On the Difficulty of Training Recurrent Neural Networks | Pascanu, Mikolov, Bengio | arXiv 2012 (ICML 2013) | https://arxiv.org/abs/1211.5063 | null | peer-reviewed | 2026-09-20 (abs page) | Gradient-norm clipping (§3.3, README lineage) |
| R3.23 | paper | 8-bit Optimizers via Block-wise Quantization | Dettmers, Lewis, Shleifer, Zettlemoyer | ICLR 2022 | https://arxiv.org/abs/2110.02861 | null | peer-reviewed | 2026-09-20 (abs page) | Block-wise quantized optimizer states as a sibling (§3.4) |
| R3.24 | paper | Training Deep Nets with Sublinear Memory Cost | Chen, Xu, Zhang, Guestrin | arXiv 2016 | https://arxiv.org/abs/1604.06174 | null | preprint | 2026-09-20 (abs page) | O(√n) activation memory for one extra forward pass (§3.3, README lineage) |
| R3.25 | documentation | Floating Point and IEEE 754 Compliance for NVIDIA GPUs | NVIDIA | accessed 2026 | https://docs.nvidia.com/cuda/ | null | official documentation | 2026-09-20 (docs.nvidia.com/cuda/floating-point/index.html) | Round-to-nearest default; `-ftz=true` flush-to-zero; FMA single rounding; CPU/GPU and reordering differences (§3.1, §3.2, §3.6) |

## URLs that could not be opened

- `https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/index.html` and the unversioned `…/user-guide/examples/fp8_primer.html`, `…/fp8_delayed_scaling/…`, `…/fp8_current_scaling/…`, `…/fp8_blockwise_scaling/…` returned HTTP 404 on 2026-09-20; the release-versioned pages listed under R3.12 were used instead.
- `https://docs.nvidia.com/deeplearning/cudnn/latest/reference/api/cudnn-graph-library.html`, `https://docs.jax.dev/en/latest/notes/type_promotion.html`, and `https://docs.jax.dev/en/latest/advanced-autodiff.html` returned HTTP 404; no claim rests on them.
- The DelayedScaling formula (margin, `amax_history_len`, `amax_compute_algo`) was not visible in the fetched page body; Algorithm 3.9 is therefore presented as a concept with its formula details labelled UNVERIFIED.
