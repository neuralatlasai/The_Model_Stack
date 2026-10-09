---
id: "ms.references.30"
entity_type: "references"
title: "Chapter 30 references"
short_title: "Chapter 30 references"
volume: 2
part: 5
chapter: 30
section: null
slug: "references"
parent: "ms.chapter.30"
prev_sibling: null
next_sibling: null
children: []
prerequisites: ["ms.chapter.12", "ms.chapter.19", "ms.chapter.20", "ms.chapter.21", "ms.chapter.25", "ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29"]
downstream: ["ms.chapter.31", "ms.chapter.36", "ms.chapter.44"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "continued_training"], "mechanism": ["distributed_training", "fault_tolerance", "checkpointing"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.torchtitan", "impl.megatron-lm", "impl.nvidia-megatron-core"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1400
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter 30 — References and evidence provenance

[DERIVED] **Edition cutoff:**2026-10-09. **Originating-source window:**2025-12-01 through 2026-10-09 inclusive. Primary texts below were inspected on2026-10-09, including their methods, experiment sections, relevant appendices and named versioned implementation surfaces. Every admitted research paper originates in 2026; older research is not reclassified through a later revision. Versioned documentation establishes the 2026 artifact's disclosed behavior, not the invention date of every included feature. A preprint remains a preprint unless an actual archival review record is established.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R30.1 | paper | Training LLMs with Fault Tolerant HSDP on100,000 GPUs | Omkar Salpekar et al.; Meta Platforms and coauthors | arXiv2602.00277v1; first 2026-01-30 | [Full text](https://arxiv.org/html/2602.00277v1) | null; custom stack not independently available here | preprint |2026-10-09 | §4.1–4.4 cohorts, FTAR and catch-up; §5 offload/emulation; §6.1 single98K deployment and disclosed stalls; §6.2 smaller studies |
| R30.2 | documentation | TorchTitan v0.3.0 release | PyTorch/TorchTitan contributors | Release2026-09-03;086bf6c | [Release](https://github.com/pytorch/torchtitan/releases/tag/v0.3.0) | [Tagged code](https://github.com/pytorch/torchtitan/tree/v0.3.0) | official documentation |2026-10-09 | Release identity, typed configuration and checkpoint policy surfaces; no installed compatibility claim |
| R30.3 | documentation | TorchTitan v0.3.0 configuration README | PyTorch/TorchTitan contributors | v0.3.0 artifact2026-09-03 | [Pinned file](https://raw.githubusercontent.com/pytorch/torchtitan/v0.3.0/torchtitan/config/README.md) | [Tagged directory](https://github.com/pytorch/torchtitan/tree/v0.3.0/torchtitan/config) | official documentation |2026-10-09 | Trainer.Config, --module/--config, CLI precedence and NGPU/world-size distinction; full66-line file inspected |
| R30.4 | paper | Memory-Efficient Activation Checkpointing with Sliding Window and Hirschberg's Algorithm for 0/1Knapsack Solving inPyTorch | Jędrzej Maczan | arXiv2608.08740v1;2026-08-09 | [Full text](https://arxiv.org/html/2608.08740v1) | null; no executable reproduction claimed | preprint |2026-10-09 | §3/Algorithm1 profile reconstruction, DP buffers/output/stack; §4 synthetic capacities,1000 repeats and host timings |
| R30.5 | paper | LazyTrain: Limited-resource Allocation toward Zero-waste Yield Optimization inLarge Language Model Training | Xiaojun Wu, Cehao Yang, Honghao Liu, Xueyuan Lin, Xuhui Jiang, Chengjin Xu, Jia Li, Jian Guo | arXiv2608.11919v1;2026-08-12 | [Full text](https://arxiv.org/html/2608.11919v1) | [Associated code](https://github.com/DataArcTech/LazyTrain); unpinned, unexecuted | preprint |2026-10-09 | §3.2–3.5 placement/MILP and incremental exposure; §4.1/4.4 model/data/ablations; Appendices A–G solver, restricted final solve and reproducibility |
| R30.6 | paper | TierCheck: Tiered Checkpointing forFault Tolerance inLarge Language Model Training | Shujie Han, Feng Jiang, Patrick P.C. Lee, Xiao Zhang, Zhijie Huang, Nannan Zhao, Xiaonan Zhao, Lichen Pan | arXiv2605.17821v1;2026-05-18 | [Full text](https://arxiv.org/html/2605.17821v1) | null; promised release not independently established | preprint |2026-10-09 | §3.1–3.4 tiers, compression, explicit nonbitwise replay and watermark; §4 implementation; §5.1–5.3 testbed, Table3 recovery, convergence and retention |
| R30.7 | paper | DeadPool: Resilient LLMTraining withHot-Swapping viaZero-Overhead Checkpoint | Haotian Xie, Junlin Chen, Mingkai Zheng, Lishan Yang, Zhao Zhang | arXiv2607.01646v1;2026-07-02 | [Full text](https://arxiv.org/html/2607.01646v1) | null; no pinned execution artifact admitted | preprint |2026-10-09 | §V-B/C asymmetric backup and correctness premises; §VI double buffers/control; §VII precision,8–512 GPU study, trimming and simulated-event cost; Vista description excluded |
| R30.8 | paper | Exploring Silent Data Corruption asaReliability Challenge inLLMTraining | Anton Altenbernd, Philipp Wiesner, Odej Kao | arXiv2604.00726v1;2026-04-01 | [Full text](https://arxiv.org/html/2604.00726v1) | [Associated code](https://github.com/aaltenbernd/llm-sdc-training); unpinned, unexecuted | preprint |2026-10-09 | §IV HMMA/NVBit injection; §V propagation; §VI optimizer-statistic detector; §VII/TableI models,seeds,10000 steps and replay without reinjection; §VII-D single-GPU limit |
| R30.9 | paper | TrainSDC: Characterizing andMitigating Silent Data Corruption inLarge Language Model Training | Zhipeng Xia, Haotian Xu, Siyu Yun, Liqi Lin, Hu Liu, Yu Li, Cheng Zhuo | arXiv2608.30769v1;2026-08-31 | [Full text](https://arxiv.org/html/2608.30769v1) | null; no pinned executable compatibility claim | preprint |2026-10-09 | §3 injection characterization; §4 Q/K checks,residual/exponent protection; §5 evaluation; Appendix A Tables3–6 calibration, clean alarms, missed events and restart-history boundary |
| R30.10 | paper | TheAnatomy ofSilent Data Corruption:GPUError Pattern Study andModeling Guidance | Chung-Hsuan Tung, Yanxiang Huang, Nirmal Saxena, Philip Shirvani, Saurabh Hukerikar, Twinkle Jain, Abhishek Tyagi, Sanjay Gongalore | arXiv2605.04213v1;2026-05-05 | [Full text](https://arxiv.org/html/2605.04213v1) | null; underlying production GPU design undisclosed | preprint |2026-10-09 | §II gate-level fault model; §IV setup; §V600M corruption-pattern observations across63 microbenchmarks; §VI modeling guidance; not fleet prevalence |
| R30.11 | documentation | NVIDIA Megatron-Core0.19.0 release | NVIDIA/Megatron contributors | core_v0.19.0;2026-08-19;5be9626 | [Release](https://github.com/NVIDIA/Megatron-LM/releases/tag/core_v0.19.0) | [Tagged code](https://github.com/NVIDIA/Megatron-LM/tree/core_v0.19.0) | official documentation |2026-10-09 | Performance/Memory and Known Issues: graph-compatible offload, TE fused-CE numerical issue and conditional NCCL transport payload issue; mitigation not executed |
| R30.12 | documentation | MaxText v0.2.5 release | Google/AI-Hypercomputer contributors | maxtext-v0.2.5;2026-10-02;493d592 | [Release](https://github.com/AI-Hypercomputer/maxtext/releases/tag/maxtext-v0.2.5) | [Tagged code](https://github.com/AI-Hypercomputer/maxtext/tree/maxtext-v0.2.5) | official documentation |2026-10-09 | Checkpointing:Orbaxv1 migration, bounded host staging, parameter-only warm-start distinction; plan-explicit source anchor |
| R30.13 | paper | Zero-I/OFault Recovery forSharded Deep Learning viaDynamic Framework Dependency Rebinding | Genlang Chen, Junyi Zhu | arXiv2609.18178; first 2026-09-16; inspectedv2,2026-10-04 | [Full text v2](https://arxiv.org/html/2609.18178v2) | null; no code-execution claim | preprint |2026-10-09 | §III-A/C/D qualified committed frontier, out-of-band consensus and cached-reference repair; §IV-A/G hardware and repeated state tests; §VI FSDP2/DTensor boundary |
| R30.14 | documentation | TorchTitan v0.3.0 checkpoint guide | PyTorch/TorchTitan contributors | v0.3.0 artifact2026-09-03 | [Pinned guide](https://raw.githubusercontent.com/pytorch/torchtitan/v0.3.0/docs/checkpoint.md) | [Tagged code](https://github.com/pytorch/torchtitan/tree/v0.3.0) | official documentation |2026-10-09 | Full guide: model-only/dtype export, exclude_from_loading and seed checkpoint; resharding documentation is not a full RNG/data audit |
| R30.15 | repository | TorchTitan v0.3.0 DCP manager | PyTorch/TorchTitan contributors | v0.3.0 artifact2026-09-03 | [Pinned implementation](https://raw.githubusercontent.com/pytorch/torchtitan/v0.3.0/torchtitan/components/checkpointer/dcp.py) | [Tagged file](https://github.com/pytorch/torchtitan/blob/v0.3.0/torchtitan/components/checkpointer/dcp.py) | official documentation |2026-10-09 | Constructor state registration; async Gloo group; _find_load_step metadata/index discovery; _states_to_load; _save_last_step. Reading does not establish whole-artifact checksums or complete RNG capture |
| R30.16 | documentation | TorchTitan v0.3.0 structured logger README | PyTorch/TorchTitan contributors | v0.3.0 artifact2026-09-03 | [Pinned README](https://raw.githubusercontent.com/pytorch/torchtitan/v0.3.0/torchtitan/observability/structured_logger/README.md) | [Tagged directory](https://github.com/pytorch/torchtitan/tree/v0.3.0/torchtitan/observability/structured_logger) | official documentation |2026-10-09 | Full171-line README: record fields/spans/scalars/handlers/trace rendering; stated nonblocking principle not a guarantee for custom handlers |
| R30.18 | paper | ARGUS:Production-Scale Tracing andPerformance Diagnosis forover10,000-GPUClusters | Jiasheng Zhou, Longbin Zeng, Clavis Chen, Ruiming Lu, Qinwei Yang, Leyi Ye, Ray Ying, Key Zhang | arXiv2606.20374v1;2026-06-18 | [Full text](https://arxiv.org/html/2606.20374v1) | null; full executable artifact not established | preprint |2026-10-09 | §4 stream-aware observation; §5 clustered summaries; §6 progressive diagnosis; §8 always-on experiment; §9 cases; Appendices A–D bounded buffers/algorithms/model/diagnostic mapping |
| R30.19 | paper | StageFrontier:Synchronization-Aware Stage Accounting forDistributed MLTraining | Boram Yoon, Wei Chen, Ville Kallioniemi | arXiv2606.06751v1;2026-06-04 | [Full text](https://arxiv.org/html/2606.06751v1) | Named stagefrontier-artifact in paper; direct immutable code URL NOT-DISCLOSED in inspected text | preprint |2026-10-09 | §3 identity/bounds; §4 label semantics; §5 collection; §6.1–6.6 routing/overhead/negative controls; Appendices A–F schema, gates, proofs and experiment groups |

## Chronology and canonical-family accounting

[DERIVED] There are18 keyed records and14 canonical evidence families after the five TorchTitan records collapse to one release family. All14 originate as research disclosures or versioned artifacts in 2026, so the 2026-family share is14/14. This calculation avoids increasing the date share through repeated citations to the same release. No record predates2025-12-01. The inclusion test for papers uses their first public disclosure; R30.13 explicitly separates its September origin from the October revision. R30.1 was first submitted January30 despite its February arXiv identifier.

[DERIVED] TorchTitan v0.3.0 files are pinned to a2026 release; their underlying feature introduction dates are not asserted. The same rule applies to Megatron-Core and MaxText releases. Newer mutable main branches are not silently substituted. Release reading is labeled OFFICIAL-DOCUMENTATION, not a claim that a complete pinned execution was performed. Exact environments must still be resolved for the proposed experiments.

## Retrieval and inspection ledger

[DERIVED] Discovery used the reference stack's arXiv route and Meta AI/FAIR route, then followed full primary texts and official versioned repositories. Queries included `site:arxiv.org/abs "checkpointing" "2026"`, `site:arxiv.org/abs "silent data corruption" "2026"`, `site:arxiv.org/abs "fault tolerant" "HSDP"`, `site:arxiv.org/abs "StageFrontier"`, and exact tagged release searches for TorchTitan, Megatron-Core and MaxText. Candidate titles and original dates were checked before admitting claims. Methods, protocols, appendices and implementation locators are in the table; metadata or abstracts alone were not used to establish mechanisms.

[DERIVED] Source-reported model names, older datasets and baseline software can appear inside an eligible2026 experiment without making their older originating papers admitted chapter evidence. The book's foundational equations are explicitly reconstructed from stated premises; no novelty or2026-invention attribution is attached to conservation laws, knapsack recurrence, conditional probability, coordinate repartitioning or the first-order checkpoint-cost approximation.

## Exclusions and quarantined claims

| Candidate or assertion | Decision and consequence |
|---|---|
| Original Megatron-LM2019 and ZeRO2019 papers | Outside window; not admitted as spine evidence. Plan implementations remain versioned anchors. |
| TorchTitan2025 paper | Outside window; use the 2026 release documentation only for artifact disclosure. |
| ByteRobust2025-10-20; Mycroft2025-09-03 | Outside originating-date window; no2026 revision laundering. |
| TTrace, first 2025-06-12 | Outside window even when retrieved beside2026 material. |
| SSDTrain2024; MLP-Offload2025-09; earlier SDC2025-02; Adacc2025-08 | Outside window; no attributed performance claims imported. |
| Historical2024 production failure rates quoted inside2026 papers | Not independently admitted; no fleet failure-rate constant inferred. |
| DeadPool Vista “H20096 GB/GraceHopper” description | Internally inconsistent device description quarantined; no guessed correction. Its Perlmutter/FP32 study is separately identified. |
| FT-HSDP projected1.5 minute stall after fixes | Projection kept distinct from observed approximately 3 minute stall; no fabricated rerun. |
| ARGUS header's November2026 conference event | Future to cutoff; source classified as current arXiv preprint, not completed peer-reviewed proceedings. |
| TierCheck compressed differential replay | Source explicitly acknowledges numerical nonidentity; no bitwise claim inferred from convergence. |
| TorchTitan checkpoint metadata discovery | Metadata presence is not content-integrity proof; complete checksum/RNG guarantees not inferred. |
| StageFrontier perfect selected-window broad-stage agreement | Shared reducer and selected-window protocol retained; not full native diagnostic equivalence or always-on profiler ranking. |

## Evidence gaps and review consequence

[NOT-DISCLOSED] Some reports lack complete dependency locks, all baseline commits, repeated-run uncertainty, raw production incident distributions or public complete schemas. The large FT-HSDP result is a single disclosed allocation study. TierCheck's promised public release was not established as an executable artifact here. Several recovery papers report particular state checks without this edition's full data/scheduler/optimizer audit.

[UNVERIFIED] No named source was independently reproduced, no source repository was executed, and no fault-injection protocol from [verification](verification.md) was run. No unconditional source-to-installed-version compatibility is claimed. These gaps prevent marking the manuscript reviewed or claiming universal fault tolerance. The explicit proposal remains falsifiable using its state-family, generation, replay and observer-budget acceptance gates.
