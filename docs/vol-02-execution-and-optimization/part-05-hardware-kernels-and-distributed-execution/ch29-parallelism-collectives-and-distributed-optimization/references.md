---
id: ms.references.29
entity_type: references
title: References — Distributed execution
short_title: References 29
volume: 2
part: 5
chapter: 29
section: null
slug: references
parent: ms.chapter.29
prev_sibling: ms.verification.29
next_sibling: null
children: []
prerequisites: [ms.chapter.16, ms.chapter.19, ms.chapter.20, ms.chapter.25, ms.chapter.26, ms.chapter.27, ms.chapter.28]
downstream: [ms.chapter.30, ms.chapter.36, ms.chapter.44]
related: []
relations: []
axes: {lifecycle: [pretraining, continued_training], mechanism: [distributed_training, parallelism, communication], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch, impl.pytorch-fsdp2, impl.nvidia-megatron-core, impl.nvidia-nccl, impl.amd-rccl]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, MATHEMATICALLY-DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# References — Chapter 29

All listed primary surfaces were inspected on **2026-10-09**. Eligibility requires first publication or release from **2025-12-01 through 2026-10-09**, rather than an eligible revision date on an older study. Historical spine papers are excluded from this chapter's factual evidence. The numbered derivations are original explanatory mathematics and do not imply that their underlying concepts were invented in this window. Reading, schema validation and integer/mathematical reasoning are separate from distributed execution; no experiment is represented as reproduced.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R29.1 | documentation | PyTorch 2.13 Release Blog | PyTorch Foundation | Release 2026-07-08 | [Dated disclosure](https://pytorch.org/blog/pytorch-2-13-release-blog/) | null | official documentation | 2026-10-09 | Distributed Training → FSDP2 Separate Reduce-Scatter Group; opt-in AG/RS communicator separation; unstable API boundary |
| R29.2 | repository | NVIDIA Megatron Core 0.19.0 | NVIDIA Megatron-Core contributors | Release 2026-08-19; tag core_v0.19.0, commit 5be9626 | [Tagged release](https://github.com/NVIDIA/Megatron-LM/releases/tag/core_v0.19.0) | [Tagged tree](https://github.com/NVIDIA/Megatron-LM/tree/core_v0.19.0) | official documentation | 2026-10-09 | MoE, Model Architecture and Support, Parallelism, Datasets, Known Issues; release-specific routing/dispatcher/shared-expert/DSA-CP disclosures |
| R29.3 | paper | Piper: A Programmable Distributed Training System | Megan Frisella, Shubham Tiwari, Andy Ruan, Yi Pan, Parker Gustafson, Mat Jacob, Gilbert Bernstein, Stephanie Wang | arXiv:2606.11169v1; first 2026-06-09 | [Versioned full text](https://arxiv.org/html/2606.11169v1); [submission history](https://arxiv.org/abs/2606.11169) | null | preprint | 2026-10-09 | §2 ownership background; §4.1 directives; §4.2–4.3 compiler/runtime and scheduling limitation; §6.1–6.4 experiment scope |
| R29.4 | paper | DynaTrain: Fast Online Parallelism Switching for Elastic LLM Training | Yuanqing Wang, Yuchen Zhang, Hao Lin, Junhao Hu, Chunyang Zhu, Quanlu Zhang, Boxun Li, Guohao Dai, Zhi Yang, Daning Cheng, Yunquan Zhang, Yu Wang | arXiv:2605.18815v1; first 2026-05-12 | [Versioned full text](https://arxiv.org/html/2605.18815v1); [submission history](https://arxiv.org/abs/2605.18815) | null | preprint | 2026-10-09 | §4.1 logical state regions; §4.2 transfers; §4.3 Algorithm 1 and XOR peer-domain qualification; §4.4 groups; §6.1–6.5 evaluation |
| R29.5 | paper | FlashCP: Load-Balanced Communication-Efficient Context Parallelism for LLM Training | Zheng Wang, Eric Liu, Linan Jiang, Zhongkai Yu, Zaifeng Pan, Yue Guan, Yuke Wang, Yufei Ding | arXiv:2606.08476v1; first 2026-06-07 | [Versioned full text](https://arxiv.org/html/2606.08476v1); [submission history](https://arxiv.org/abs/2606.08476) | null | preprint | 2026-10-09 | §3.1–3.4 document-aware placement, selective communication, Algorithm 1; §4.1 setup, Fig. 5–6 timing boundary |
| R29.6 | paper | HyDra: Demystifying and Taming Dynamic Context Parallelism at Production Scale | Zihao Fan, Yunzhuo Liu, Bo Jiang, Changgang Zheng, Lin Zheng, Ray Ying, Key Zhang | arXiv:2609.34318v1; first 2026-09-28 | [Versioned full text](https://arxiv.org/html/2609.34318v1); [submission history](https://arxiv.org/abs/2609.34318) | null | preprint | 2026-10-09 | §3–4 background/diagnosis; §5.1–5.2 load-driven scheduler and hierarchical engine; §6.1–6.4 testbed/production and ablation boundaries |
| R29.7 | paper | UCCL-EP: Portable Expert-Parallel Communication | Ziming Mao, Yihan Zhang, Chihan Cui, Kaichao You, Zhongjie Chen, Zhiying Xu, Scott Shenker, Costin Raiciu, Yang Zhou, Ion Stoica | arXiv:2512.19849v1; first 2025-12-22 | [Versioned full text](https://arxiv.org/html/2512.19849v1); [submission history](https://arxiv.org/abs/2512.19849) | null | preprint | 2026-10-09 | §3 GPU/CPU control and ordering; §4 platform adaptation; Table 2 and §5.1 methodology; §5.2 small-batch counterexample; §5.3 end-to-end boundary |
| R29.8 | repository | NCCL v2.29.7 Release | NVIDIA NCCL contributors | Release 2026-02-27; v2.29.7-1, commit b91894b | [Tagged release](https://github.com/NVIDIA/nccl/releases/tag/v2.29.7-1) | [Tagged tree](https://github.com/NVIDIA/nccl/tree/v2.29.7-1) | official documentation | 2026-10-09 | Device API and GIN Enhancements; Dynamic Memory Offload; hybrid symmetric ReduceScatter prerequisites; Known Limitations |
| R29.9 | repository | RCCL 2.27.7 for ROCm 7.2.0 | AMD RCCL contributors | Release 2026-01-21; rocm-7.2.0, commit 0d2c4fd | [Tagged release](https://github.com/ROCm/rccl/releases/tag/rocm-7.2.0) | [Tagged tree](https://github.com/ROCm/rccl/tree/rocm-7.2.0) | official documentation | 2026-10-09 | Release identity and Changed: fatal-error verbosity and gfx950 pipelining change; no performance ranking |
| R29.10 | repository | UCX v1.20.0 | OpenUCX contributors | NEWS date 2025-12-02; GitHub release 2026-02-05; commit 4b7a6ca | [Tagged release](https://github.com/openucx/ucx/releases/tag/v1.20.0) | [Tagged tree](https://github.com/openucx/ucx/tree/v1.20.0) | official documentation | 2026-10-09 | UCP/UCT GPU/device API and direct-NIC release disclosures; dates recorded independently |
| R29.11 | repository | Open MPI v5.0.10 tag and bundled release changelog | Open MPI contributors | Tag 2026-02-11; commit 0d48030; bundled heading v5.0.10rc2 | [Tag](https://github.com/open-mpi/ompi/releases/tag/v5.0.10); [pinned changelog](https://raw.githubusercontent.com/open-mpi/ompi/v5.0.10/docs/release-notes/changelog/v5.0.x.rst) | [Tagged tree](https://github.com/open-mpi/ompi/tree/v5.0.10) | official documentation | 2026-10-09 | First changelog entry, 11 February 2026: UCX/OFI and fault-handling changes; stable qualification unresolved |
| R29.12 | repository | NVIDIA NVSHMEM 3.8.0 Release Notes | NVIDIA NVSHMEM contributors | Release 2026-09-22; v3.8.0-0, commit 270759e | [Tagged release](https://github.com/NVIDIA/nvshmem/releases/tag/v3.8.0-0) | [Tagged tree](https://github.com/NVIDIA/nvshmem/tree/v3.8.0-0) | official documentation | 2026-10-09 | PGAS/symmetric memory description; RMA/device features; Compatibility; Limitations, especially ordering and visibility scope |
| R29.13 | documentation | PyTorch 2.11 Release Blog | PyTorch Foundation | Release 2026-03-23 | [Dated disclosure](https://pytorch.org/blog/pytorch-2-11-release-blog/) | null | official documentation | 2026-10-09 | Differentiable Collectives for Distributed Training; release capability only, not proof of application normalization |

## R29.1

**OFFICIAL-DOCUMENTATION.** The dated 2.13 disclosure names `FSDPModule.set_separate_reduce_scatter_group(enable=True)` and labels the API unstable. No workload-specific speedup number is imported. **NOT-DISCLOSED:** a complete reproducible FSDP2 benchmark protocol for that feature is absent from the inspected announcement. Versioned 2.13 API-documentation retrieval did not succeed, so the chapter does not claim that those pages were inspected or that an installed runtime matches them.

## R29.2

**OFFICIAL-DOCUMENTATION.** Release metadata identifies core_v0.19.0 and its 19 August publication. Its MoE/CP/packed-layout bullets are scoped to this release. **UNVERIFIED:** no tagged implementation code was executed, and no arbitrary joint configuration is represented as tested. The release also carries explicit numerical/transport limitations, so a feature listing must not be read as an unconditional correctness promise.

## R29.3

**PAPER-REPORTED.** The inspected v1 supplies background, placement/directive interfaces, global-DAG lowering, runtime scheduling and experiment design. The manuscript uses its methodological separation, not a transferable speedup claim. **UNVERIFIED:** code revision, measured configurations and independent replication. The v1 evaluation names software versions; their compatibility and precise build provenance were not independently resolved. Treat source-reported environment text as reported, not installed evidence.

## R29.4

**PAPER-REPORTED.** The inspected v1 defines logical state regions and memory-aware transfers, with power-of-two evaluation settings. **MATHEMATICALLY-DERIVED:** §29.6 shows that the printed XOR round range fails complete pair coverage for three ranks. This concerns the pseudocode's quantifier domain. **UNVERIFIED:** the implementation's behavior for those ranks, whether a later artifact corrects it, and operational recovery after a failed transition. No experimental failure is asserted.

## R29.5

**PAPER-REPORTED.** The method and heuristic were inspected, together with §4's eight-H100 intra-node setup and document distributions. The chapter derives its own exact-mask algebra and illustrative figures. **UNVERIFIED:** multi-node transferability, code revision and independent numerical/performance reproduction. No original ring-attention paper is cited as an eligible new source.

## R29.6

**PAPER-REPORTED.** The load model, scheduler, hierarchical context engine and evaluation were inspected in v1. The diagnosis scale and separate evaluation scales are not conflated. **UNVERIFIED:** independent access to production traces, full runtime configuration and local reproduction. Broad claims about competing systems in the source abstract are not adopted as established facts.

## R29.7

**PAPER-REPORTED.** The full method and platform-specific ordering discussion were inspected. Methodology includes CPU proxy resources and available baselines; the paper supplies a small-batch counterexample to a universal speed claim. **UNVERIFIED:** firmware equivalence, exact benchmark commits and local execution. The paper's treatment of other systems is not substituted for direct inspection of their contemporary releases.

## R29.8

**OFFICIAL-DOCUMENTATION.** GitHub release metadata establishes 2026-02-27. The release describes features, prerequisites and GIN recompilation limitations. Mutable vendor-document headers showed inconsistent old version/date strings during discovery; they are not used to establish original publication. **UNVERIFIED:** installed prerequisites, selected algorithm and application benefit.

## R29.9

**OFFICIAL-DOCUMENTATION.** The release identifies RCCL 2.27.7 within ROCm 7.2.0 and its dated changes. **UNVERIFIED:** no Radeon Instinct/ROCm transport or GPU-aware correctness test was run. No claim of equivalent behavior to a specific NCCL build follows from similar API names.

## R29.10

**OFFICIAL-DOCUMENTATION.** UCX's NEWS date and GitHub publication date are separate metadata fields; both are within the permitted interval. The tagged release is the evidence boundary for new device/path capabilities. **UNVERIFIED:** enabled transport components, build flags, progress behavior and accelerator compatibility in an executable deployment.

## R29.11

**OFFICIAL-DOCUMENTATION.** The source tag and first changelog entry identify a February 2026 artifact, but the embedded heading remains `v5.0.10rc2`. **UNVERIFIED:** stable-release qualification and installed GPU-awareness. Older entries in the same historical changelog are outside the evidence window and were not used as chapter evidence.

## R29.12

**OFFICIAL-DOCUMENTATION.** The tagged 3.8.0 release supplies symmetric-memory/RMA scope and explicit completion/visibility limitations. **UNVERIFIED:** local compatibility and performance. The chapter does not infer global ordering from pairwise completion or present a transport's survival as proof of optimizer-state consistency.

## R29.13

**OFFICIAL-DOCUMENTATION.** The dated 2.11 announcement identifies differentiable collectives. The adjoint equations in §29.5 are book-derived for the declared linear maps and global loss convention, rather than an assertion about every API's implicit scaling. **UNVERIFIED:** installed API coverage and application-level gradient parity.

## Evidence gaps and exclusions

| Item | Classification | Consequence |
|---|---|---|
| Historical ZeRO, Megatron and Ring Attention papers | Excluded by first-publication cutoff | No `P17`/`P18` or old-paper revision is used as factual evidence |
| Conference publication without eligible first appearance | Excluded pending original-date check | A 2026 proceedings date cannot reset a pre-December-2025 origin |
| Installed software, exact kernels and firmware | UNVERIFIED | No executable compatibility promise |
| Release-specific performance without full protocol | NOT-DISCLOSED where absent | No generic gain or source-ranking figure |
| Independent replication and uncertainty of source timings | UNVERIFIED | Source findings remain attributed |
| Energy, prices and monetary savings | UNVERIFIED | No invented resource-price conversion |
| Non-power-of-two migration implementation | UNVERIFIED | Printed-procedure counterexample stays separate from runtime claims |

The final bibliographic status is **manuscript draft**. Null code entries mean no exact official code revision was inspected sufficiently to support an implementation-level claim; they are not claims that code is unavailable.
