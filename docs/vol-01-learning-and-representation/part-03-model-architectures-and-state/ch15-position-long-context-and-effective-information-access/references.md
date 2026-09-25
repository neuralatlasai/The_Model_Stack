---
id: ms.references.15
entity_type: references
title: Chapter 15 references
short_title: Chapter 15 references
section: null
slug: references
parent: ms.chapter.15
prev_sibling: ms.verification.15
next_sibling: null
children: []
prerequisites: [ms.chapter.10, ms.chapter.13, ms.chapter.14]
downstream: [ms.chapter.27, ms.chapter.42, ms.chapter.49]
word_count_target: 1500
volume: 1
part: 3
chapter: 15
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [position_representation, long_context], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P01, P46]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# Chapter 15 — References and evidence boundaries

Primary sources were inspected on **2026-09-25**. The source routes follow Instruction/AI_REFERENCE_STACK.md; Chapter 15's explicit plan anchor is P46. Publication dates, inspected revisions, and documentation access dates have different meanings and are recorded separately.

**Evidence policy.** PAPER-REPORTED identifies attributed research statements, not independently reproduced results. OFFICIAL-DOCUMENTATION identifies an inspected documented interface or behavior, not a tested installation. Mathematical constructions are labeled MATHEMATICALLY-DERIVED or DERIVED in the manuscript. No model benchmark, adaptation run, or serving measurement was performed for this chapter.

## Typed reference records

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin | arXiv 2017 (NeurIPS 2017) | https://arxiv.org/abs/1706.03762 | null | peer-reviewed | Absolute position addition; 15.1 | 2026-09-25 |
| P46 | technical report | Gemini 2.5: Pushing the Frontier with Advanced Reasoning, Multimodality, Long Context, and Next Generation Agentic Capabilities | Gemini Team, Google | arXiv 2025; inspected v6, 2025-12-19 | https://arxiv.org/abs/2507.06261 | null | preprint | Task-specific long-context evidence and protocol comparability; 15.4, 15.6 | 2026-09-25 |
| R15.1 | paper | RoFormer: Enhanced Transformer with Rotary Position Embedding | Jianlin Su; Yu Lu; Shengfeng Pan; Ahmed Murtadha; Bo Wen; Yunfeng Liu | arXiv 2021; inspected v5, 2023 | https://arxiv.org/abs/2104.09864 | null | preprint | Rotary position mechanism; 15.1 | 2026-09-25 |
| R15.2 | paper | Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation | Ofir Press; Noah A. Smith; Mike Lewis | arXiv 2021; inspected v2, 2022 | https://arxiv.org/abs/2108.12409 | null | preprint | Distance-proportional attention bias; 15.1 | 2026-09-25 |
| R15.3 | paper | Extending Context Window of Large Language Models via Positional Interpolation | Shouyuan Chen; Sherman Wong; Liangjian Chen; Yuandong Tian | arXiv 2023; inspected v2 | https://arxiv.org/abs/2306.15595 | null | preprint | Position interpolation and adaptation; 15.2, 15.3 | 2026-09-25 |
| R15.4 | paper | YaRN: Efficient Context Window Extension of Large Language Models | Bowen Peng; Jeffrey Quesnelle; Honglu Fan; Enrico Shippole | arXiv 2023; inspected v3, 2026-02-06 | https://arxiv.org/abs/2309.00071 | null | preprint | Frequency-selective extension and attention scaling; 15.2 | 2026-09-25 |
| R15.5 | paper | LongRoPE2: Near-Lossless LLM Context Window Scaling | Ning Shang; Li Lyna Zhang; Siyuan Wang; Gaokai Zhang; Gilsinia Lopez; Fan Yang; Weizhu Chen; Mao Yang | arXiv 2025; inspected v1 | https://arxiv.org/abs/2502.20082 | null | preprint | Search and mixed-window training mechanism attribution; 15.2, 15.3 | 2026-09-25 |
| R15.6 | paper | Self-Attention with Relative Position Representations | Peter Shaw; Jakob Uszkoreit; Ashish Vaswani | arXiv 2018; inspected v2 | https://arxiv.org/abs/1803.02155 | null | preprint | Relative-position research branch; 15.1 | 2026-09-25 |
| R15.7 | paper | Lost in the Middle: How Language Models Use Long Contexts | Nelson F. Liu; Kevin Lin; John Hewitt; Ashwin Paranjape; Michele Bevilacqua; Fabio Petroni; Percy Liang | arXiv 2023 | https://arxiv.org/abs/2307.03172 | null | preprint | Position-sensitive evaluation motivation; 15.4 | 2026-09-25 |
| R15.8 | paper | RULER: What's the Real Context Size of Your Long-Context Language Models? | Cheng-Ping Hsieh; Simeng Sun; Samuel Kriman; Shantanu Acharya; Dima Rekesh; Fei Jia; Yang Zhang; Boris Ginsburg | arXiv 2024, v3; COLM 2024 noted by authors | https://arxiv.org/abs/2404.06654 | https://github.com/NVIDIA/RULER | preprint | Multiple-needle, tracing, and aggregation task design; 15.4 | 2026-09-25 |
| R15.9 | paper | Retrieval Augmented Generation or Long-Context LLMs? A Comprehensive Study and Hybrid Approach | Zhuowan Li; Cheng Li; Mingyang Zhang; Qiaozhu Mei; Michael Bendersky | arXiv 2024; inspected v2 | https://arxiv.org/abs/2407.16833 | null | preprint | Comparative and hybrid context-construction framing; 15.5 | 2026-09-25 |
| R15.10 | documentation | Rotary embeddings utilities | Hugging Face Transformers | Moving main documentation; package revision not pinned | https://huggingface.co/docs/transformers/main/en/internal/rope_utils | https://github.com/huggingface/transformers | official documentation | Current rotary configuration surface; 15.1, 15.2 | 2026-09-25 |
| R15.11 | documentation | Context Parallel Package | NVIDIA Megatron-Core | Moving latest documentation; package revision not pinned | https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/context_parallel.html | https://github.com/NVIDIA/Megatron-LM | official documentation | Sequence partitioning and attention communication; 15.3 | 2026-09-25 |
| R15.12 | documentation | torch.nn.functional.scaled_dot_product_attention | PyTorch | Versioned documentation path 2.14 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html | https://github.com/pytorch/pytorch | official documentation | Reference masking and dropout boundary; 15.3 | 2026-09-25 |
| R15.13 | documentation | Cache strategies | Hugging Face Transformers | Moving documentation surface; package revision not pinned | https://huggingface.co/docs/transformers/en/kv_cache | https://github.com/huggingface/transformers | official documentation | Cache strategy, prefix reuse, and window-limited growth; 15.5, 15.6 | 2026-09-25 |

The status column describes the inspected surface. It is not a claim that a paper has no archival publication. A null official-code field means no project-specific repository is asserted in this register.

## P01

**PAPER-REPORTED.** The paper's positional-encoding discussion is the historical anchor for adding positional representations to token embeddings. Equation 15.1 expands the chapter's explicitly stated column-vector convention. No original benchmark results are transferred. [Primary record](https://arxiv.org/abs/1706.03762).

## P46

**PAPER-REPORTED.** The [v6 full text](https://arxiv.org/html/2507.06261v6) was inspected, especially the quantitative evaluation and Appendix 8.1. The report's long-context task descriptions are used as protocol-specific evidence. Changes to the MRCR setup constrain comparisons with earlier reporting. The chapter does not infer rotary details, training mixtures, provider cache implementation, or present-day API limits from this report.

## R15.1

**PAPER-REPORTED.** The [v5 full text](https://arxiv.org/html/2104.09864v5) grounds rotary query/key position encoding. The manuscript states its own fixed-frequency assumptions and independently derives the rotation identity. Pairing layout, cache offsets, and partial-rotation checks are explicit implementation contracts rather than claims about every RoFormer deployment.

## R15.2

**PAPER-REPORTED.** The [primary record](https://arxiv.org/abs/2108.12409) supports distance-proportional score bias and the paper's extrapolation investigation. The chapter specifies a causal sign convention without reproducing the complete source slope schedule or transferring its performance numbers.

## R15.3

**PAPER-REPORTED.** The [v2 full text](https://arxiv.org/html/2306.15595v2) was inspected. Its rendered title uses “Position Interpolation,” while the abstract record uses “Positional Interpolation.” The register preserves the abstract-record title. The manuscript distinguishes the interval-mapping identity from learned task performance.

## R15.4

**PAPER-REPORTED.** The [v3 full text](https://arxiv.org/html/2309.00071v3), dated 2026-02-06 in the revision history, was inspected. First publication remains 2023. The chapter attributes frequency-selective treatment and attention scaling, while explicitly identifying Eq. 15.6 as an explanatory family rather than a full YaRN reproduction. No source efficiency ratio is reused.

## R15.5

**PAPER-REPORTED.** The [v1 primary record](https://arxiv.org/abs/2502.20082) supports limited attribution of evolutionary rescaling search and mixed context-window training. The paper's title is bibliographic text, not this manuscript's guarantee of near-lossless behavior on arbitrary checkpoints. Implementation and comparative reproduction remain UNVERIFIED.

## R15.6

**PAPER-REPORTED.** The [primary record](https://arxiv.org/abs/1803.02155) establishes the relative-position research branch. The chapter's distinctions between vector terms, scalar biases, clipping, and coordinate visibility are mathematical and engineering synthesis; it does not attribute every relative scheme to this paper.

## R15.7

**PAPER-REPORTED.** The [primary record](https://arxiv.org/abs/2307.03172) motivates evidence-position interventions. Its findings concern the models and tasks evaluated by the authors. The manuscript does not describe positional failure as an unavoidable property of every newer model.

## R15.8

**PAPER-REPORTED.** The [v3 paper record](https://arxiv.org/abs/2404.06654v3) and [official repository](https://github.com/NVIDIA/RULER) were inspected. The chapter takes task-family motivation, not leaderboard rankings or scores. The repository was not installed or pinned to a commit. The proposed chapter matrix is an original evaluation specification, not a claim of exact RULER reproduction.

## R15.9

**PAPER-REPORTED.** The [primary record](https://arxiv.org/abs/2407.16833) supports comparison of retrieval, long context, and a hybrid approach. The manuscript supplies its own evidence-coverage and amortized-cost accounting. It does not transfer historical prices, quality rankings, or routing efficacy to the current deployment.

## R15.10

**OFFICIAL-DOCUMENTATION.** The [inspected guide](https://huggingface.co/docs/transformers/main/en/internal/rope_utils) documents **rope_parameters**, rotary variants, validation, and per-layer-type configuration. Moving main documentation is explicitly unpinned. Compatibility with an installed package or checkpoint must be checked separately.

## R15.11

**OFFICIAL-DOCUMENTATION.** The [inspected guide](https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/context_parallel.html) distinguishes context parallelism from sequence parallelism and explains the attention communication requirement. The chapter's loss-weighting and memory-boundary arguments are independently stated. No hardware scaling result is imported.

## R15.12

**OFFICIAL-DOCUMENTATION.** The [2.14 documentation path](https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html) was inspected for explicit mask and dropout behavior. This establishes the documented reference surface, not that the workspace or proposed experiment has that version installed.

## R15.13

**OFFICIAL-DOCUMENTATION.** The [inspected cache guide](https://huggingface.co/docs/transformers/en/kv_cache) supplies cache-strategy and prefix-reuse context. Its moving surface does not establish a particular provider's cache persistence, physical sharing, pricing, or workload hit rate.

## Claim audit boundaries

**MATHEMATICALLY-DERIVED.** Equations 15.1–15.19 use explicitly defined dimensions, domains, and probability conditions. Their illustrative calculator inputs are authored fixtures, not measurements from named models. Equation 15.12 requires independent observations within a cell and predeclared simultaneous claims. Equation 15.18 excludes physical allocation overhead. Equation 15.19 excludes prompt and output overhead.

**UNVERIFIED.** Every proposed empirical outcome remains unmeasured. Future reproduction must pin source and runtime revisions, preserve dataset provenance, and report unsuccessful configurations. No use of an evidence label converts an unexecuted experiment into a result.
