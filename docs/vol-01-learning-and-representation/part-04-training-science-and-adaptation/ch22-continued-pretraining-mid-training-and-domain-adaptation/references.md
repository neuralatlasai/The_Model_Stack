---
id: ms.references.22
entity_type: references
title: References — Chapter 22
short_title: References — Chapter 22
volume: 1
part: 4
chapter: 22
section: null
slug: references
parent: ms.chapter.22
prev_sibling: ms.verification.22
next_sibling: null
children: []
prerequisites: [ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.19, ms.chapter.20, ms.chapter.21]
downstream: [ms.chapter.23, ms.chapter.24, ms.chapter.31]
related: [ms.chapter.49, ms.chapter.50, ms.chapter.63]
relations: []
axes: {lifecycle: [continued_training, adaptation], mechanism: [distribution_transition, retention, adaptation_decision], feedback_setting: [], modality: [text]}
papers: [P13, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# References — Chapter 22

Primary sources were inspected on **2026-10-08**. Publication status, inspected revision, and execution evidence are separate fields. No training method below was executed for the book. A mutable page or unversioned PDF is identified as such; a source's current availability does not certify an installed implementation.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R22.1 | paper | Don’t Stop Pretraining: Adapt Language Models to Domains and Tasks | Suchin Gururangan, Ana Marasović, Swabha Swayamdipta, Kyle Lo, Iz Beltagy, Doug Downey, Noah A. Smith; Ai2 and collaborators | ACL 2020, pp. 8342–8360 | [Archival PDF](https://aclanthology.org/2020.acl-main.740.pdf) | null | peer-reviewed | 2026-10-08 | §22.1: §§3–4, Table 3, Appendix B; DAPT/TAPT and task-classification protocol |
| R22.2 | technical report | DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models | Zhihong Shao et al.; DeepSeek-AI | 2024 | [Full text v3](https://arxiv.org/html/2402.03300v3) | null | preprint | 2026-10-08 | §§22.1–22.4: §§2.1–2.3, Tables 1 and 4, §5.1; corpus continuation and exact starting checkpoint |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek-AI | 2024; inspected revision 2025 | [Full text v2](https://arxiv.org/html/2412.19437v2) | null | preprint | 2026-10-08 | §§22.2–22.3: §§4.2–4.3 and Figure 8; context-extension schedule and disclosure boundary |
| R22.3 | paper | Simple and Scalable Strategies to Continually Pre-train Large Language Models | Adam Ibrahim, Benjamin Thérien, Kshitij Gupta, Mats L. Richter, Quentin Anthony, Timothée Lesort, Eugene Belilovsky, Irina Rish; Mila and collaborators | TMLR 2024; inspected arXiv revision | [Full text v4](https://arxiv.org/html/2403.08763v4) | null | peer-reviewed | 2026-10-08 | §22.3: §§4–6, Appendix A.4, Figure 13; rewarming, replay, and moment-state ablation |
| R22.4 | technical report | Olmo 3 | Olmo Team; Allen Institute for AI | 2025 | [Full text v1](https://arxiv.org/html/2512.13961v1) | null | preprint | 2026-10-08 | §§22.1–22.2: §2.1, §§3.5.1–3.5.4, Tables 5–10, Appendix A.1; staged curriculum and mixture screening |
| R22.5 | paper | Scaling Laws for Forgetting during Finetuning with Pretraining Data Injection | Louis Béthune, David Grangier, Dan Busbridge, Eleonora Gualdoni, Marco Cuturi, Pierre Ablin; Apple | ICML 2025, PMLR 267:4020–4042 | [Inspected full text v2](https://arxiv.org/html/2502.06042v2) | null | peer-reviewed | 2026-10-08 | §22.4: §§2–4, Table 1, Figures 1, 3, 6; data injection and pretraining-loss retention |
| R22.6 | documentation | Optimizer.load_state_dict | PyTorch contributors | PyTorch 2.14 documentation namespace | [API reference](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Optimizer.load_state_dict.html) | null | official documentation | 2026-10-08 | §22.3: warning and parameter-name note; scheduler/load order and name-matching limits |
| R22.7 | documentation | AdamW | PyTorch contributors | PyTorch 2.14 documentation namespace | [API reference](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html) | null | official documentation | 2026-10-08 | §22.3: algorithm and state_dict note; moments, counters, and order-based parameter association |
| R22.8 | documentation | Trainer | Hugging Face Transformers team | Unpinned online documentation | [Trainer reference](https://huggingface.co/docs/transformers/main_classes/trainer) | null | official documentation | 2026-10-08 | §22.1: train resume_from_checkpoint, save_model, save_state; model versus trainer state |
| R22.9 | technical report | Nemotron 3 Ultra: Open, Efficient Mixture-of-Experts Hybrid Mamba-Transformer Model for Agentic Reasoning | NVIDIA | Inspected PDF dated 2026-06-09 | [Official full text](https://research.nvidia.com/labs/nemotron/files/NVIDIA-Nemotron-3-Ultra-Technical-Report.pdf) | null | preprint | 2026-10-08 | §§22.3,22.6: §2.2 and Figure 3; §§2.4,2.7 and Figures 5–7; precision branches and recovery |
| P40 | paper | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | Patrick Lewis et al.; FAIR and collaborators | NeurIPS 2020 | [Inspected full PDF](https://arxiv.org/pdf/2005.11401) | null | peer-reviewed | 2026-10-08 | §22.5: §§2–4, Tables 1–2; originating retrieval-generator mechanism and evaluation scope |

## R22.1

**Version and locator.** ACL Anthology archival proceedings PDF, DOI 10.18653/v1/2020.acl-main.740. Inspected §§3–4 and Appendix B. The historical study uses masked-language-model continuation and task classifiers. Its task results are not decoder deployment measurements.

**Evidence boundary.** The chapter uses this source to distinguish domain and task-input roles. It does not transfer its model, hardware, or adaptation steps into a recommended contemporary recipe.

## R22.2

**Version and locator.** arXiv:2402.03300v3, 2024-04-27. Inspected §2 data/training, Table 1 corpus screening, Table 4's dagger-marked starting checkpoint, and §5.1 negative observations.

**Evidence boundary.** The exact pre-decay starting artifact matters for retention interpretation. Full optimizer-state carry-over is NOT-DISCLOSED in the inspected training description. The book does not infer it from peak LR or the checkpoint family name.

## P13

**Version and locator.** arXiv:2412.19437v2, 2025-02-18. Inspected §§4.2–4.3 and the Figure 8 caption. The context-extension description gives length, batch, LR, and positional configuration.

**Evidence boundary.** The NIAH figure describes the post-SFT model. It cannot isolate the effect of extension from every subsequent transformation. Moment-state carry-over at the extension boundaries is NOT-DISCLOSED in the inspected passage.

## R22.3

**Version and locator.** arXiv:2403.08763v4, 2024-09-04. The corresponding TMLR publication record was identified through OpenReview; method and results here were read in the explicitly pinned arXiv revision. Inspected §§4–6 and Appendix A.4/Figure 13.

**Evidence boundary.** The moment-state comparison is one controlled setting. Its similarity of final losses does not establish trajectory identity or universal restart equivalence. Complete independent reproduction of the paper is UNVERIFIED.

## R22.4

**Version and locator.** arXiv:2512.13961v1, 2025-12-15. Inspected §2.1, §§3.5.1–3.5.4, and Appendix A.1, including Tables 34–35. The chapter emphasizes the source-screening and integration protocol.

**Evidence boundary.** Some disclosed screening variants lack a compute-matched web-only control. Their evidence is therefore weaker for an equal-budget causal comparison than the standard matched microanneal. No benchmark ranking or transferred performance estimate is taught.

## R22.5

**Version and locator.** arXiv:2502.06042v2, 2025-05-26. The [PMLR proceedings record](https://proceedings.mlr.press/v267/bethune25a.html) verifies the ICML publication identity. The archival PDF retrieval failed in this session; full method/results were inspected in v2, not asserted identical to an unseen archival PDF.

**Evidence boundary.** Pretraining validation loss is the study's retention proxy. Its small injected fractions are reported operating points, not guarantees for every capability. The book's deployment gate adds behavioral requirements and is a proposed evaluation contract.

## R22.6

**Version and locator.** PyTorch 2.14 documentation namespace; contents are not commit-pinned. Inspected the load-state warning and the parameter-name note. Installed package version and executable compatibility are UNVERIFIED.

## R22.7

**Version and locator.** Same 2.14 namespace, unpinned contents. Inspected the documented AdamW recurrence and state_dict parameter-association note. No optimizer implementation was executed for this chapter. The mathematical history expansion is the book's derivation under fixed coefficients.

## R22.8

**Version and locator.** Unpinned Transformers online Trainer API, inspected 2026-10-08. Locators: train/resume_from_checkpoint, save_model, save_state. The chapter uses the disclosed state interfaces only. Runtime behavior, installed version, and compatibility remain UNVERIFIED.

## R22.9

**Version and locator.** Official NVIDIA PDF path, fetched on the access date. The title page is dated **2026-06-09**; the path is mutable and no commit/content hash was established. Inspected §2.2/Figure 3, §2.4, and §2.7/Figures 5–7.

**Evidence boundary.** The precision branches diagnose training behavior; they are not a domain-adaptation experiment. The later divergence is explicitly undetermined in the report. No inference-throughput claim, vendor pricing, or economic dominance is imported.

## P40

**Version and locator.** Unversioned arXiv PDF fetched on 2026-10-08; exact served revision is UNVERIFIED. Inspected §§2–4, including task setup and Tables 1–2. The work's identity is the Appendix D spine record.

**Evidence boundary.** The historical mechanism jointly trains retrieval and generation. The book separately defines a frozen-context comparison and does not attribute that experimental design to the paper.

## Evidence gaps

| Gap | Status | Consequence |
|---|---|---|
| Complete optimizer-state policy at the DeepSeekMath and V3 context boundaries | NOT-DISCLOSED | Published rates cannot reconstruct a complete continuation trajectory. |
| Exact revision of the served RAG PDF and content hash of the NVIDIA PDF | UNVERIFIED | Keep access date and locators; pin artifacts before a reproduction. |
| Runtime compatibility of the inspected API pages | UNVERIFIED | Reading documents is not executing the implementation. |
| Archival ICML PDF contents | UNVERIFIED | Full technical claims cite inspected arXiv v2; archival identity is verified separately. |
| Common fixed-domain comparison across retrieval, SFT, continued pretraining, and adapters | UNVERIFIED | Book protocol remains a proposal. |
| Local training, retention, serving, money, and energy measurements | UNVERIFIED | No newly measured results or global best-method claim. |
