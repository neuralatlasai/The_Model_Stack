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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# References - Chapter 05

The ledger records the exact primary full text or official operator surface inspected for this revision. ArXiv versions are specified in their URLs; a source's archival status is separate from the inspected version. A mutable repository or documentation page is not a pinned executed implementation. The chapter claims no CODE-VERIFIED model or independently reproduced training result.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin (Google Brain / Google Research / U. Toronto) | NeurIPS 2017; arXiv v7 | https://arxiv.org/html/1706.03762v7 | https://github.com/tensorflow/tensor2tensor | peer-reviewed | Sections3-6, Eq. 1-3, Table 3: attention/FFN/norm/position methods and source translation protocol | 2026-10-08 (specified full text or official API surface inspected) |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan, McCandlish, Henighan, Brown, Chess, Child, Gray, Radford, Wu, Amodei (OpenAI) | arXiv 2020 | https://arxiv.org/html/2001.08361v1 | null | preprint | Section2.1/Table 1: non-embedding parameter and approximate compute convention; section 2.2 default training protocol | 2026-10-08 (specified full text or official API surface inspected) |
| P19 | paper | FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness | Dao, Fu, Ermon, Rudra, Ré | NeurIPS 2022; arXiv 2022 | https://arxiv.org/html/2205.14135v2 | https://github.com/Dao-AILab/flash-attention | peer-reviewed | Section3, Algorithm 1, Theorems1-2, section 4: online normalization, exact attention, recomputation and source IO/timing boundaries | 2026-10-08 (specified full text or official API surface inspected) |
| R5.1 | paper | Gaussian Error Linear Units (GELUs) | Hendrycks, Gimpel | arXiv 2016 | https://arxiv.org/html/1606.08415v5 | null | preprint | Section2: GELU definition; analytic derivative in 5.3 is separately derived | 2026-10-08 (specified full text or official API surface inspected) |
| R5.2 | technical report | Language Models are Unsupervised Multitask Learners | Radford, Wu, Child, Luan, Amodei, Sutskever (OpenAI) | OpenAI 2019 | https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf | null | official documentation | Section2.3: pre-LayerNorm, final normalization, residual initialization scaling; Table 2 architecture context | 2026-10-08 (specified full text or official API surface inspected) |
| R5.3 | paper | Root Mean Square Layer Normalization | Zhang, Sennrich | NeurIPS 2019; arXiv 2019 | https://arxiv.org/html/1910.07467v1 | null | peer-reviewed | RMSNorm method: root-mean-square statistic without centering; finite-epsilon/gain distinctions derived separately | 2026-10-08 (specified full text or official API surface inspected) |
| R5.4 | paper | On Layer Normalization in the Transformer Architecture | Xiong, Yang, He, Zheng, Zheng, Xing, Zhang, Lan, Wang, Liu | ICML 2020; arXiv 2020 | https://arxiv.org/html/2002.04745v2 | null | peer-reviewed | Theorem 1 and section 3.2 premises/restricted gradient upper bounds; section 4 and AppendixA initialization/training protocols | 2026-10-08 (specified full text or official API surface inspected) |
| R5.5 | paper | GLU Variants Improve Transformer | Shazeer (Google) | arXiv 2020 | https://arxiv.org/html/2002.05202v1 | null | preprint | Sections2-4/Eq. 5-6/Table 1: T5/C4 matched projection budget, short/long training protocols, held-out observations | 2026-10-08 (specified full text or official API surface inspected) |
| R5.6 | paper | Fast Transformer Decoding: One Write-Head is All You Need | Shazeer (Google) | arXiv 2019 | https://arxiv.org/html/1911.02150v1 | null | preprint | Incremental decoding and multi-query projection/cache analysis; source-specific resource and experiment boundaries | 2026-10-08 (specified full text or official API surface inspected) |
| R5.7 | paper | RoFormer: Enhanced Transformer with Rotary Position Embedding | Su, Lu, Pan, Murtadha, Wen, Liu | arXiv 2021 | https://arxiv.org/html/2104.09864v5 | null | preprint | Sections2-3: position-method lineage and rotary Q/K construction; Chapter 15 owns detailed treatment | 2026-10-08 (specified full text or official API surface inspected) |
| R5.8 | paper | LLaMA: Open and Efficient Foundation Language Models | Touvron et al. (Meta AI / FAIR) | arXiv 2023 | https://arxiv.org/html/2302.13971v1 | null | preprint | Sections2.2/2.4: pre-RMSNorm, SwiGLU, RoPE, exact causal attention and checkpointing; adoption rather than isolated causality | 2026-10-08 (specified full text or official API surface inspected) |
| R5.9 | paper | PaLM: Scaling Language Modeling with Pathways | Chowdhery et al. (Google Research) | arXiv 2022 | https://arxiv.org/html/2204.02311v5 | null | preprint | Section2: parallel block equation, SwiGLU, shared KV, shared embeddings, bias policy; source-specific ablation caveats | 2026-10-08 (specified full text or official API surface inspected) |
| R5.10 | paper | DeepNet: Scaling Transformers to 1,000 Layers | Wang, Ma, Dong, Huang, Zhang, Wei (Microsoft Research) | arXiv 2022 | https://arxiv.org/html/2203.00555v1 | null | preprint | Sections3-4: DeepNorm residual/initialization joint design and source deep-translation experiments | 2026-10-08 (specified full text or official API surface inspected) |
| R5.11 | course | CS336 Assignment 1 (basics): Building a Transformer LM, Version 26.0.3, Spring 2026 | CS336 Staff (Stanford) | Stanford CS336, Spring 2026 | https://raw.githubusercontent.com/stanford-cs336/assignment1-basics/main/cs336_assignment1_basics.pdf | https://github.com/stanford-cs336/assignment1-basics | official documentation | Version 26.0.3, sections 3.3-3.5: truncated initialization, SwiGLU nearby64 rounding, pre-RMSNorm/final norm,2mnp and GPT-2-XL-shaped exercise | 2026-10-08 (47-page official raw PDF downloaded and text extracted; SHA-256 in verification.md) |
| R5.12 | course | CS336: Language Modeling from Scratch (course page) | Stanford | Spring 2026 | https://cs336.stanford.edu/ | https://github.com/stanford-cs336 | official documentation | Course/assignment source route; not a primary experiment result | 2026-10-08 (specified full text or official API surface inspected) |
| R5.13 | documentation | torch.nn.functional.scaled_dot_product_attention — PyTorch 2.14.0 documentation | PyTorch | 2.14.0 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html | https://github.com/pytorch/pytorch | official documentation | SDPA Notes and API: p0 dropout, Boolean allowed entries, three total implementations including C++ math, non-square upper-left causal alignment | 2026-10-08 (specified full text or official API surface inspected) |
| R5.14 | documentation | torch.nn.RMSNorm — PyTorch 2.14.0 documentation | PyTorch | 2.14.0 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.RMSNorm.html | https://github.com/pytorch/pytorch | official documentation | RMSNorm formula, epsilon inside root, opmath dtype-dependent default epsilon; kernel accumulator is not inferred | 2026-10-08 (specified full text or official API surface inspected) |
| R5.15 | repository | FlashAttention repository README | Dao-AILab | GitHub, accessed 2026 | https://github.com/Dao-AILab/flash-attention | https://github.com/Dao-AILab/flash-attention | official documentation | Unpinned README: cached attention and bottom-right alignment; not CODE-VERIFIED | 2026-10-08 (specified full text or official API surface inspected) |
| R5.16 | repository | CS336 assignment1-basics repository README | Stanford CS336 | Mutable repository main; inspected2026-10-08 | https://github.com/stanford-cs336/assignment1-basics | https://github.com/stanford-cs336/assignment1-basics | official documentation | Unpinned README: assignment source and test entry; tests were not run | 2026-10-08 (specified full text or official API surface inspected) |
| R5.17 | documentation | vLLM documentation source route | vLLM project | Unpinned; no version claim | https://docs.vllm.ai/ | https://github.com/vllm-project/vllm | UNVERIFIED | Historical source route only; not relied on for revised scientific/API claims | Not re-inspected for this revision; historical access claim not adopted |
| R5.18 | documentation | NVIDIA cuBLAS documentation source route | NVIDIA | Unpinned; no version claim | https://docs.nvidia.com/cuda/cublas/ | null | UNVERIFIED | Historical source route only; not relied on for revised scientific/API claims | Not re-inspected for this revision; historical access claim not adopted |
| R5.19 | documentation | Transformers documentation source route | Hugging Face | Unpinned; no version claim | https://huggingface.co/docs/transformers/ | https://github.com/huggingface/transformers | UNVERIFIED | Historical source route only; not relied on for revised scientific/API claims | Not re-inspected for this revision; historical access claim not adopted |
| R5.20 | documentation | causal_lower_right: non-square causal attention bias | PyTorch contributors | PyTorch 2.14 documentation | https://docs.pytorch.org/docs/2.14/generated/torch.nn.attention.bias.causal_lower_right.html | null | official documentation | Version 2.14 function/example: lower-right non-square bias, diagonal offset T_k-T_q | 2026-10-08 (specified full text or official API surface inspected) |

P08's Table 1 uses its own non-embedding approximation, including a2*L*T*d context term. This chapter separately counts both dense pair products, or sums ideal allowed causal pairs, to make the mask-work convention explicit. It does not claim that P08 omitted the value product or that source compute conventions are universally interchangeable. N_dense in 5.6 additionally includes the output head and excludes positions/gains/input-only embeddings.

The CS336 raw PDF identifies Version 26.0.3, Spring 2026. Its inspected content hash is recorded in verification.md. Its nearest/nearby width-rounding and initialization instructions are source-specific; the chapter's GELU/learned-position reference differs from the assignment's complete architecture.

Live software roots R5.17-R5.19 retain their identifiers for historical continuity but supply no current-version or mechanism evidence. No commit was pinned and no associated tests or benchmarks were executed.
