---
id: ms.references.16
entity_type: references
title: Chapter 16 references
short_title: Chapter 16 references
section: null
slug: references
parent: ms.chapter.16
prev_sibling: ms.verification.16
next_sibling: null
children: []
prerequisites: [ms.chapter.13, ms.chapter.14]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
word_count_target: 1600
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# Chapter 16 — References and evidence boundaries

Primary sources were inspected on **2026-09-25** through the routes in Instruction/AI_REFERENCE_STACK.md. The chapter's explicit book-plan anchors are Switch Transformers [P10] and DeepSeek-V3 [P13]. Current documentation is distinguished from historical research and from a tested installation.

## Typed reference records

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P10 | paper | Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity | Fedus, Zoph, Shazeer | JMLR 2022 / arXiv 2021 | https://arxiv.org/abs/2101.03961 | null | peer-reviewed | Top-one sparse routing and auxiliary balancing; 16.1–16.3 | 2026-09-25 |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek | arXiv 2024 (v2 2025) | https://arxiv.org/abs/2412.19437 | https://github.com/deepseek-ai | preprint | Shared/routed experts, complementary balancing terms, and distributed design; 16.1, 16.3, 16.5 | 2026-09-25 |
| R16.1 | paper | Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer | Noam Shazeer et al. | arXiv 2017 | https://arxiv.org/abs/1701.06538 | null | preprint | Conditional expert capacity; 16.1 | 2026-09-25 |
| R16.2 | paper | MegaBlocks: Efficient Sparse Training with Mixture-of-Experts | Trevor Gale; Deepak Narayanan; Cliff Young; Matei Zaharia | arXiv 2022, v1 | https://arxiv.org/abs/2211.15841 | null | preprint | Block-sparse response to dropping/padding trade-offs; 16.4 | 2026-09-25 |
| R16.3 | paper | Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts | Lean Wang; Huazuo Gao; Chenggang Zhao; Xu Sun; Damai Dai | arXiv 2024, v1 | https://arxiv.org/abs/2408.15664 | null | preprint | Bias-based selection balancing; 16.3 | 2026-09-25 |
| R16.4 | documentation | Mixture of Experts | NVIDIA Megatron-Core | Moving latest documentation; package revision not pinned | https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/moe.html | https://github.com/NVIDIA/Megatron-LM | official documentation | Router, balancing, capacity, grouped execution, and dispatch interfaces; 16.1–16.6 | 2026-09-25 |
| R16.5 | documentation | Switch Transformers | Hugging Face Transformers | Moving main documentation; package revision not pinned | https://huggingface.co/docs/transformers/main/en/model_doc/switch_transformers | https://github.com/huggingface/transformers | official documentation | Model-specific implementation and configuration surface; 16.1–16.6 | 2026-09-25 |
| R16.6 | documentation | Distributed communication package — torch.distributed | PyTorch | Versioned documentation path 2.14 | https://docs.pytorch.org/docs/2.14/distributed.html | https://github.com/pytorch/pytorch | official documentation | All-to-all communication and split-size contract; 16.5 | 2026-09-25 |
| R16.7 | paper | Mixture-of-Experts with Expert Choice Routing | Yanqi Zhou; Tao Lei; Hanxiao Liu; Nan Du; Yanping Huang; Vincent Zhao; Andrew Dai; Zhifeng Chen; Quoc Le; James Laudon | arXiv 2022; inspected v2 | https://arxiv.org/abs/2202.09368 | null | preprint | Expert-selected token assignment alternative; 16.2 | 2026-09-25 |

A null code field means that this register does not assert a project-specific repository. The status column describes the cited surface, except where an archival publication was explicitly inspected. It is not an assertion that other works lack peer-reviewed versions.

## P10

**PAPER-REPORTED.** The [arXiv record](https://arxiv.org/abs/2101.03961), [JMLR archival page](https://www.jmlr.org/papers/v23/21-0998.html), and [archival PDF](https://www.jmlr.org/papers/volume23/21-0998/21-0998.pdf) were inspected. The authors are William Fedus, Barret Zoph, and Noam Shazeer; the archival publication is JMLR 23(120):1–39, 2022.

The chapter uses top-one routing and the auxiliary objective in the paper's sparse-routing discussion. It derives the local softmax gradient independently. The top-k assignment-capacity formula in 16.4 is explicitly a generalized reference convention, not a quotation of the paper's top-one capacity definition. No source speedup or benchmark score is transferred.

## P13

**PAPER-REPORTED.** The [v2 full text](https://arxiv.org/html/2412.19437v2) was inspected. Sections 2.1.2 and 3 provide the limited architecture and systems anchors used here. The manuscript preserves the distinction between bias-based balancing and the report's complementary sequence-wise auxiliary term. It does not infer that every auxiliary loss is absent.

Shared/routed expert structure and node-limited execution are source-specific examples. The chapter's symbolic counts, communication reference, and replica ledger are independently defined accounting models. They are not descriptions of every physical buffer in the reported system.

## R16.1

**PAPER-REPORTED.** The [primary record](https://arxiv.org/abs/1701.06538) was initially accessible; later record requests returned service errors. The [paper PDF](https://arxiv.org/pdf/1701.06538) was accessible and supplies the historical sparse-gating anchor. The chapter makes no copied performance claim and does not present sparse gating as a guarantee of useful semantic specialization.

## R16.2

**PAPER-REPORTED.** The [primary record](https://arxiv.org/abs/2211.15841) grounds the block-sparse approach to MoE's dropping/padding trade-off. The manuscript's row-rounding formula is a simplified independent construction, not an exact inventory of MegaBlocks kernels or metadata. The paper is routed through arXiv and is not added as a new §4 implementation entry.

## R16.3

**PAPER-REPORTED.** The [v1 record](https://arxiv.org/abs/2408.15664) supports expert-wise biases updated from load to influence selection. Equation 16.9 is explicitly an illustrative proportional controller, not a reproduction of the source's complete update procedure. No convergence or universal quality guarantee is attributed to that equation.

## R16.4

**OFFICIAL-DOCUMENTATION.** The [current MoE guide](https://docs.nvidia.com/megatron-core/developer-guide/latest/user-guide/features/moe.html) was inspected for routing, balancing scopes, dropless execution, grouped GEMM, permutation, and expert-parallel dispatch. It is a moving latest surface. The attempted latest API-guide path failed; the successful feature-guide URL is the reference used throughout.

The chapter avoids claiming package installation, backend activation, universal hardware compatibility, or measured overlap. Reproduction requires a pinned runtime and resolved configuration.

## R16.5

**OFFICIAL-DOCUMENTATION.** The [Switch Transformers model guide](https://huggingface.co/docs/transformers/main/en/model_doc/switch_transformers) was inspected as a model-definition surface. Moving main documentation is not a stable release guarantee. The manuscript does not assume that its interface and a distributed training backend have interchangeable configuration fields or defaults.

## R16.6

**OFFICIAL-DOCUMENTATION.** The stable documentation URL returned a redirect-only surface in the browser. The [versioned 2.14 page](https://docs.pytorch.org/docs/2.14/distributed.html) was accessible and is the inspected source. All-to-all split-size semantics support the interface discussion; consistency, buffer lifetime, and traffic accounting remain explicit application responsibilities.

## R16.7

**PAPER-REPORTED.** The [v2 full text](https://arxiv.org/html/2202.09368v2), dated 2022-10-14, was inspected after the abstract endpoint intermittently failed. The mechanism reverses token-choice selection by allowing experts to choose tokens. The chapter discusses assignment constraints without transferring source quality or speed claims.

## Evidence audit

**MATHEMATICALLY-DERIVED.** Equations 16.1–16.19 specify their own domains and accounting boundaries. The calculator values are illustrative fixtures. The uniform independent routing model in Eq. 16.18 is a declared synthetic reference, not a claim about learned-router distributions.

**UNVERIFIED.** Model quality, specialization, training convergence, kernel performance, network efficiency, tail latency, energy, and financial cost are not measured in this chapter. Proposed experiments remain proposals. No inspected documentation page converts those unknowns into results.

