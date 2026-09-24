---
id: ms.references.5
entity_type: references
title: References — Chapter 05
short_title: References 05
volume: 1
part: 1
chapter: 5
section: null
slug: references
parent: ms.chapter.5
prev_sibling: ms.verification.5
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
siblings_by_mechanism: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: [P01, P08, P19]
implementations: [impl.pytorch, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION], empirically_observed: false}
word_count_target: null
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# References — Chapter 05

Every work cited in the chapter. Spine papers keep their Appendix D ids. "Accessed" records the date on which the primary URL (or the file it serves) was actually opened for this chapter; a preprint's presence is not a claim of peer review. Where an arXiv PDF was opened and its text extracted locally, the Accessed cell says so.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin (Google Brain / Google Research / U. Toronto) | NeurIPS 2017; arXiv v7 | https://arxiv.org/abs/1706.03762 | https://github.com/tensorflow/tensor2tensor | peer-reviewed | Eq. 5.5–5.7 (scaled dot-product and multi-head attention, √d_k footnote), FFN Eq. 5.9, post-norm Eq. 5.13, base hyperparameters, tied embeddings and √d_model scaling, sinusoidal vs learned positions, Table 1 sequential operations, Adam/warm-up | 2026-09-20 (arXiv HTML v7) |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan, McCandlish, Henighan, Brown, Chess, Child, Gray, Radford, Wu, Amodei (OpenAI) | arXiv 2020 | https://arxiv.org/abs/2001.08361 | null | preprint | §5.6: non-embedding N ≈ 12·n_layer·d_model², C_forward ≈ 2N + 2·n_layer·n_ctx·d_attn, C ≈ 6N per token, d_model ≫ n_ctx/12 regime (§2.1, Table 1) | 2026-09-20 (arXiv PDF, text extracted) |
| P19 | paper | FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness | Dao, Fu, Ermon, Rudra, Ré | NeurIPS 2022; arXiv 2022 | https://arxiv.org/abs/2205.14135 | https://github.com/Dao-AILab/flash-attention | peer-reviewed | §5.2: exact attention without a materialised score matrix; forward pointer to §27.1 only | 2026-09-20 (arXiv abstract) |
| R5.1 | paper | Gaussian Error Linear Units (GELUs) | Hendrycks, Gimpel | arXiv 2016 | https://arxiv.org/abs/1606.08415 | null | preprint | §5.3: GELU(x) = x·Φ(x) | 2026-09-20 (arXiv abstract) |
| R5.2 | technical report | Language Models are Unsupervised Multitask Learners | Radford, Wu, Child, Luan, Amodei, Sutskever (OpenAI) | OpenAI 2019 | https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf | null | official documentation | §5.4: layer norm moved to sub-block input, final norm, 1/√N residual-layer initialisation scaling (§2.3); §5.6: Table 2 (117M, 12 layers, d_model 768; vocabulary 50,257; context 1024) | 2026-09-20 (PDF, text extracted) |
| R5.3 | paper | Root Mean Square Layer Normalization | Zhang, Sennrich | NeurIPS 2019; arXiv 2019 | https://arxiv.org/abs/1910.07467 | null | peer-reviewed | §5.4: RMSNorm drops re-centering; Eq. 5.16 | 2026-09-20 (arXiv abstract) |
| R5.4 | paper | On Layer Normalization in the Transformer Architecture | Xiong, Yang, He, Zheng, Zheng, Xing, Zhang, Lan, Wang, Liu | ICML 2020; arXiv 2020 | https://arxiv.org/abs/2002.04745 | null | peer-reviewed | §5.4: post-LN output-side gradients large at initialisation; pre-LN gradients well-behaved; warm-up removal | 2026-09-20 (arXiv abstract) |
| R5.5 | paper | GLU Variants Improve Transformer | Shazeer (Google) | arXiv 2020 | https://arxiv.org/abs/2002.05202 | null | preprint | §5.3: GLU/GEGLU/SwiGLU definitions, FFN_SwiGLU, hidden width reduced to 2/3·d_ff to match parameters and compute; T5-base d_model 768, d_ff 3072 → 2048 | 2026-09-20 (arXiv PDF) |
| R5.6 | paper | Fast Transformer Decoding: One Write-Head is All You Need | Shazeer (Google) | arXiv 2019 | https://arxiv.org/abs/1911.02150 | null | preprint | §5.2, §5.5: incremental inference is memory-bandwidth-bound by loading K and V; lineage of cached decoding; MQA as sibling (owned by §14.1) | 2026-09-20 (arXiv abstract) |
| R5.7 | paper | RoFormer: Enhanced Transformer with Rotary Position Embedding | Su, Lu, Pan, Murtadha, Wen, Liu | arXiv 2021 | https://arxiv.org/abs/2104.09864 | null | preprint | Lineage only: RoPE as the forward link to §15.1 | 2026-09-20 (arXiv abstract) |
| R5.8 | paper | LLaMA: Open and Efficient Foundation Language Models | Touvron et al. (Meta AI / FAIR) | arXiv 2023 | https://arxiv.org/abs/2302.13971 | null | preprint | §5.1, §5.3–§5.5: pre-normalisation with RMSNorm, SwiGLU with 2/3·4d hidden width, RoPE (§2.2); causal attention implementation that does not store attention weights, activation checkpointing (§2.4) | 2026-09-20 (arXiv PDF, text extracted) |
| R5.9 | paper | PaLM: Scaling Language Modeling with Pathways | Chowdhery et al. (Google Research) | arXiv 2022 | https://arxiv.org/abs/2204.02311 | null | preprint | §5.3–§5.4: SwiGLU with three matrices, parallel block formulation and reported ~15% training speed-up, multi-query attention, shared input–output embeddings, no biases in dense kernels or layer norms (§2) | 2026-09-20 (arXiv PDF, text extracted) |
| R5.10 | paper | DeepNet: Scaling Transformers to 1,000 Layers | Wang, Ma, Dong, Huang, Zhang, Wei (Microsoft Research) | arXiv 2022 | https://arxiv.org/abs/2203.00555 | null | preprint | §5.4 sibling: residual-connection modification with derived initialisation | 2026-09-20 (arXiv abstract) |
| R5.11 | course | CS336 Assignment 1 (basics): Building a Transformer LM, Version 26.0.3, Spring 2026 | CS336 Staff (Stanford) | Stanford CS336, Spring 2026 | https://github.com/stanford-cs336/assignment1-basics/blob/main/cs336_assignment1_basics.pdf | https://github.com/stanford-cs336/assignment1-basics | official documentation | §5.3: SwiGLU with d_ff = 8/3·d_model rounded to a multiple of 64, no bias terms; §5.4: initialisation (trunc-normal var 2/(d_in+d_out), embeddings N(0,1), RMSNorm gains 1), pre-norm block with final norm; §5.6: 2mnp FLOPs rule and the GPT-2 XL-shaped accounting exercise | 2026-09-20 (PDF via repository raw file, text extracted) |
| R5.12 | course | CS336: Language Modeling from Scratch (course page) | Stanford | Spring 2026 | https://cs336.stanford.edu/ | https://github.com/stanford-cs336 | official documentation | Source route: assignment list (Assignment 1: Basics — tokenizer, model architecture, optimizer) | 2026-09-20 |
| R5.13 | documentation | torch.nn.functional.scaled_dot_product_attention — PyTorch 2.14.0 documentation | PyTorch | 2.14.0 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html | https://github.com/pytorch/pytorch | official documentation | §5.1, §5.2, §5.5: signature (attn_mask, dropout_p, is_causal, scale, enable_gqa), three fused implementations (FlashAttention-2, memory-efficient, C++), PyTorch fallback, error when attn_mask and is_causal are both set | 2026-09-20 |
| R5.14 | documentation | torch.nn.RMSNorm — PyTorch 2.14.0 documentation | PyTorch | 2.14.0 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.RMSNorm.html | https://github.com/pytorch/pytorch | official documentation | §5.4: formula with ε inside the root, default ε = torch.finfo(float32).eps for fp16/bf16/fp32, elementwise_affine default and ones initialisation | 2026-09-20 |
| R5.15 | repository | FlashAttention repository README | Dao-AILab | GitHub, accessed 2026 | https://github.com/Dao-AILab/flash-attention | https://github.com/Dao-AILab/flash-attention | official documentation | §5.2, §5.5: fp16/bf16 support, head dimensions up to 256, bottom-right causal alignment when query and key lengths differ, `flash_attn_with_kvcache`, PyTorch ≥ 2.2 and CUDA ≥ 12.0 requirements | 2026-09-20 |
| R5.16 | repository | CS336 assignment1-basics repository README | Stanford CS336 | GitHub, Spring 2025 handout name | https://github.com/stanford-cs336/assignment1-basics | https://github.com/stanford-cs336/assignment1-basics | official documentation | Source route: component list (BPE, RMSNorm, SwiGLU, RoPE, SDPA, MHA, AdamW, cross-entropy), `uv run pytest` test entry | 2026-09-20 |
| R5.17 | documentation | vLLM documentation landing page (latest developer preview) | vLLM project | accessed 2026 | https://docs.vllm.ai/ | https://github.com/vllm-project/vllm | official documentation | README reference-stack coverage: PagedAttention KV management, continuous batching, chunked prefill, prefix caching — forward pointer only | 2026-09-20 |
| R5.18 | documentation | cuBLAS documentation (cuBLAS 13.4) | NVIDIA | 13.4 | https://docs.nvidia.com/cuda/cublas/ | null | official documentation | README reference-stack coverage; §5.1, §5.3: cuBLASLt as a GEMM-dedicated library with programmable layouts, types and epilogues | 2026-09-20 |
| R5.19 | documentation | Transformers documentation landing page (v5.17.0 links) | Hugging Face | v5.17.0 | https://huggingface.co/docs/transformers/ | https://github.com/huggingface/transformers | official documentation | README reference-stack coverage: documented role as the model-definition framework shared by training frameworks and inference engines | 2026-09-20 |

Notes.

- The NeurIPS 2017 archival version of P01 was not separately opened; equation and hyperparameter quotations are from the arXiv v7 HTML rendering.
- P08's Table 1 counts the attention "mask" term as `2·n_layer·n_ctx·d_attn`; §5.6 counts both score matmuls (`4·L·T·D`) and states the difference explicitly.
- R5.2 is hosted on OpenAI's domain as a report, not on arXiv; its Status is recorded as official documentation rather than as a peer-reviewed or preprint record.
- R5.7 and R5.9 may have later journal versions; those were not checked and their Status is recorded as preprint from the arXiv record opened.
- No work with an unopened URL is cited in the chapter; the UNVERIFIED status is therefore not used in this table.
