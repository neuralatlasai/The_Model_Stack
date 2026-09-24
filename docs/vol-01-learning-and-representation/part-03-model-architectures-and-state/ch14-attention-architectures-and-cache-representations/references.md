---
id: ms.references.14
entity_type: references
title: Chapter 14 references
short_title: References
section: null
slug: references
parent: ms.chapter.14
prev_sibling: ms.verification.14
next_sibling: null
children: []
prerequisites: []
downstream: []
word_count_target: 1300
volume: 1
part: 3
chapter: 14
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [attention, cache_representation], feedback_setting: [], modality: [text, image, audio, video]}
papers: [P13, P19, P20]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.flashattention]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# Chapter 14 references

**KNOWN — source register.** These primary sources were opened on **25 September 2026** through the supplied `Instruction/AI_REFERENCE_STACK.md` routes and explicit book-plan anchors. Fixed research versions, versioned documentation paths and moving repositories are distinguished below. An access date records inspection; it does not pin a repository or establish a tested installation.

## Typed reference records

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek | arXiv 2024 (v2 2025) | https://arxiv.org/abs/2412.19437 | https://github.com/deepseek-ai | preprint | §2.1.1: latent KV and separate positional state; §14.2 | 2026-09-25 |
| P19 | paper | FlashAttention (full title: FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness) | Dao et al. | arXiv 2022; NeurIPS 2022 | https://arxiv.org/abs/2205.14135 | https://github.com/Dao-AILab/flash-attention | preprint | IO-aware attention and temporary-memory boundary; §14.5 | 2026-09-25 |
| P20 | paper | FlashAttention-4: Algorithm and Kernel Pipelining Co-Design for Asymmetric Hardware Scaling | Ted Zadouri; Markus Hoehnerbach; Jay Shah; Timmy Liu; Vijay Thakkar; Tri Dao | arXiv 2026, v1 | https://arxiv.org/abs/2603.05451 | https://github.com/Dao-AILab/flash-attention | preprint | 2026 hardware/algorithm co-design and numerical audit boundary; §14.5 | 2026-09-25 |
| R14.1 | paper | Fast Transformer Decoding: One Write-Head is All You Need | Noam Shazeer | arXiv 2019, v1 | https://arxiv.org/abs/1911.02150 | null | preprint | Shared KV projections and incremental-decoding motivation; §14.1 | 2026-09-25 |
| R14.2 | paper | GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints | Joshua Ainslie; James Lee-Thorp; Michiel de Jong; Yury Zemlyanskiy; Federico Lebron; Sumit Sanghai | EMNLP 2023 | https://aclanthology.org/2023.emnlp-main.298/ | null | peer-reviewed | Grouped KV heads and conversion/adaptation distinction; §14.1 | 2026-09-25 |
| R14.3 | paper | Longformer: The Long-Document Transformer | Iz Beltagy; Matthew E. Peters; Arman Cohan | arXiv 2020, v2 | https://arxiv.org/abs/2004.05150 | null | preprint | Local plus task-motivated global attention; §14.3 | 2026-09-25 |
| R14.4 | paper | Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention | Jingyang Yuan et al. | arXiv 2025; v1 mechanism and v2 metadata inspected | https://arxiv.org/abs/2502.11089 | null | preprint | Compressed information, selected detail and local branch; §14.3 | 2026-09-25 |
| R14.5 | documentation | torch.nn.functional.scaled_dot_product_attention | PyTorch | Versioned documentation path 2.14 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html | https://github.com/pytorch/pytorch | official documentation | GQA constraints, rectangular causal alignment, masks and dropout; §§14.1, 14.4, 14.5 | 2026-09-25 |
| R14.6 | documentation | Cache strategies | Hugging Face Transformers | Moving documentation surface; package revision not pinned | https://huggingface.co/docs/transformers/en/kv_cache | https://github.com/huggingface/transformers | official documentation | Cache strategies and window-limited layer growth; §§14.1, 14.3, 14.6 | 2026-09-25 |
| R14.7 | repository | FlashMLA README | DeepSeek | Moving main branch; commit not pinned | https://github.com/deepseek-ai/FlashMLA | https://github.com/deepseek-ai/FlashMLA | official documentation | MLA execution modes and named mixed-precision row layout; §14.2 | 2026-09-25 |
| R14.8 | repository | FlashAttention README and documented interfaces | FlashAttention maintainers | Moving main branch; commit not pinned | https://github.com/Dao-AILab/flash-attention | https://github.com/Dao-AILab/flash-attention | official documentation | Grouped heads, local windows and rectangular cache-mask alignment; §§14.1, 14.3, 14.5 | 2026-09-25 |
| R14.9 | paper | RULER: What's the Real Context Size of Your Long-Context Language Models? | Cheng-Ping Hsieh; Simeng Sun; Samuel Kriman; Shantanu Acharya; Dima Rekesh; Fei Jia; Yang Zhang; Boris Ginsburg | arXiv 2024, v3 | https://arxiv.org/abs/2404.06654 | https://github.com/NVIDIA/RULER | preprint | Configurable synthetic context tasks beyond one-needle retrieval; §14.6 | 2026-09-25 |

## P13

**PAPER-REPORTED.** The full-text mechanism at https://arxiv.org/html/2412.19437v2 was opened. Its latent and positional cache construction is the research anchor. Equations 14.5–14.8 independently specify the chapter's reference dimensions and accounting; no later model's layout is inferred from this report.

## P19

**PAPER-REPORTED.** Authors are Tri Dao, Daniel Y. Fu, Stefano Ermon, Atri Rudra and Christopher Ré. The arXiv v2 full text at https://arxiv.org/html/2205.14135v2 was opened. Status identifies the inspected preprint surface; the work's NeurIPS venue remains in the bibliographic field. The chapter derives its own tile-merge identity and does not reproduce performance measurements.

## P20

**PAPER-REPORTED.** The abstract and version metadata were opened directly. The chapter uses the reported Blackwell scheduling and non-matmul design directions without transferring throughput, utilization or speedup figures. Detailed kernel ownership remains in Chapters 25–27 as specified by the plan.

## R14.1

**PAPER-REPORTED.** The abstract grounds the MQA mechanism and its motivation. The chapter's head map, parameter count, state count and reuse analysis are explicit mathematical constructions, not quoted experimental results.

## R14.2

**PAPER-REPORTED.** The archival metadata and abstract were opened. The chapter does not treat converting distinct projections into shared projections as a function-preserving identity or extrapolate the paper's adaptation results to arbitrary models.

## R14.3

**PAPER-REPORTED.** The abstract supports the limited mechanism attribution. The chapter's causal coverage, eviction and dependency arguments are independently stated and are not presented as a description of every Longformer configuration.

## R14.4

**PAPER-REPORTED.** The full text at https://arxiv.org/html/2502.11089v1 and current abstract record were opened. The source motivates analyzing selection and training together. The chapter's generic sparse-set equations do not reproduce the paper's complete architecture or claim its reported speedups.

## R14.5

**OFFICIAL-DOCUMENTATION.** The stable route redirected; the versioned 2.14 page was opened directly. API semantics are documentation evidence, not a locally tested package. Backend selection and numerical behavior remain execution-dependent.

## R14.6

**OFFICIAL-DOCUMENTATION.** The cache-strategy guide was opened. Its implementation-level distinctions support the allocation audit; it does not establish that arbitrary cross-request sharing or every model/backend combination is supported.

## R14.7

**OFFICIAL-DOCUMENTATION.** The README's mode descriptions and FP8-with-scale layout were inspected. Its DeepSeek-V3.2 sparse format is the explicitly named example used here. Later formats in the repository are not generalized from it. The route is DeepSeek's §1 code surface plus the plan's Chapter 27 FlashMLA anchor.

## R14.8

**OFFICIAL-DOCUMENTATION.** The documented attention and KV-cache interfaces were inspected, including the non-square causal-alignment examples. Interface contracts do not establish executed kernel performance or a complete compatibility matrix for an unpinned installation.

## R14.9

**PAPER-REPORTED.** The abstract, version record and official NVIDIA repository were opened. The proposed chapter protocol is not an executed RULER evaluation and does not reuse the paper's historical leaderboard as a 2026 ranking.

## Evidence boundaries

**DERIVED.** The chapter's tensor capacities, page-allocation fixtures, head-sharing arithmetic, latent absorption, omitted-mass bound, tile merge and lifetime analyses are original derivations under stated conditions. They are not copied benchmark tables or reconstructed proprietary internals.

**KNOWN — 2026 inspection boundary.** FlashAttention-4 is identified by its verified March 2026 paper. The current FlashMLA README is used only for the explicitly named mode and layout claims. Foundational papers retain their original dates. No claim of an exhaustive latest-method ranking is made.

**UNVERIFIED.** Exact moving-branch commits, installed package compatibility, actual dispatch, allocated GPU tensors, gradient checks, runtime traffic, latency, energy, quality and experimental outcomes remain unestablished until the verification protocol is executed. **NOT-DISCLOSED.** The inspected public sources do not supply a complete deployment contract for every model or hardware configuration.

**KNOWN — originality boundary.** Source prose and benchmark tables are not reproduced. Attribution accompanies the mechanisms taken from sources, and mathematical adaptations state their conditions. No comprehensive external similarity audit is claimed.
