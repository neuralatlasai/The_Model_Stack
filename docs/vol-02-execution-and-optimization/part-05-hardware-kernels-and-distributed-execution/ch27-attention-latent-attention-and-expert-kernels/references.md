---
id: ms.references.27
entity_type: references
title: References — Attention, latent-attention, and expert kernels
short_title: References 27
volume: 2
part: 5
chapter: 27
section: null
slug: references
parent: ms.chapter.27
prev_sibling: ms.verification.27
next_sibling: null
children: []
prerequisites: [ms.chapter.14, ms.chapter.16, ms.chapter.25, ms.chapter.26]
downstream: [ms.chapter.28, ms.chapter.29, ms.chapter.42]
related: []
relations: []
axes: {lifecycle: [pretraining, inference, serving], mechanism: [attention, latent_attention, mixture_of_experts, kernel_dispatch], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.flashattention, impl.liger-kernel]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# References — Chapter 27

Primary texts were opened and inspected on **2026-10-09**. The eligible interval is **2025-12-01 through 2026-10-09**. “First publication” means v1 for a research report and the identified release/disclosure for implementation evidence; a recent revision does not re-date an old paper. A new report's retrospective statements are not proof of new invention. No prewindow spine paper is cited in this chapter.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R27.1 | paper | FlashAttention-4: Algorithm and Kernel Pipelining Co-Design for Asymmetric Hardware Scaling | Ted Zadouri; Markus Hoehnerbach; Jay Shah; Timmy Liu; Vijay Thakkar; Tri Dao | arXiv 2026; first 2026-03-05 | [Full text v1](https://arxiv.org/html/2603.05451v1) | [Official repository](https://github.com/Dao-AILab/flash-attention) | preprint | 2026-10-09 | §§27.1–27.2: §2.1 operator/derivatives; §§3.1–3.3 pipelines/rescaling/scheduling; §§4–5 implementation/protocol; Appendix A.1 disclosure conflict |
| R27.2 | technical report | DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models | DeepSeek-AI | arXiv 2025; first 2025-12-02 | [Full text v1](https://arxiv.org/html/2512.02556v1) | [Official model release](https://huggingface.co/deepseek-ai/DeepSeek-V3.2) | preprint | 2026-10-09 | §27.4: §2.1 Eqs.1–4 selector and training; Appendix A latent execution modes; §2.2 identifies inherited September evaluation, excluded here |
| R27.3 | paper | Where Activation Sparsity and KV-Cache Sparsity Cross in LLM Decoding | Jungseob Lee; Seungyoon Lee; Seongtae Hong; Sugyeong Eo; Heuiseok Lim | arXiv 2026; first 2026-09-27 | [Full text v1](https://arxiv.org/html/2609.33889v1) | [Author repository](https://github.com/js-lee-AI/ByteCross) | preprint | 2026-10-09 | §27.3: §§4.1–4.4 matched attention paths and baseline sensitivity; §5 selection-quality controls; AppendicesB–F protocol |
| R27.4 | repository | FlashMLA release for Ascend 950 and breaking cache/model compatibility | DeepSeek | First release 2026-09-30; commit 2e5429f | [Pinned README](https://github.com/deepseek-ai/FlashMLA/blob/2e5429fc5653bab6e081f09477126f731882a6a9/README.md) | [Pinned tree](https://github.com/deepseek-ai/FlashMLA/tree/2e5429fc5653bab6e081f09477126f731882a6a9) | official documentation | 2026-10-09 | §§27.4,27.6: breaking notice; Requirements; sparse decode/prefill Usage, index semantics, cache format, empty-row conventions |
| R27.5 | documentation | MegaMoE in FlashInfer: Fused Expert-Parallel MoE Kernels | Anerudhan Gopal; Kaustubh Rao; Md Saidul Hoque Anik; Faradawn Yang; FlashInfer | First disclosure 2026-09-22 | [Technical disclosure](https://flashinfer.ai/2026/09/22/mega-moe.html) | [Official project](https://github.com/flashinfer-ai/flashinfer) | official documentation | 2026-10-09 | §27.5: Our approach; Usage; Performance; split-path microbenchmarks; Accuracy gate; Future work |
| R27.6 | documentation | FlashInfer v0.7.0 release highlights | FlashInfer contributors | First release 2026-09-22 | [Release highlights](https://flashinfer.ai/releases/#v070) | [Release v0.7.0](https://github.com/flashinfer-ai/flashinfer/releases/tag/v0.7.0) | official documentation | 2026-10-09 | §§27.3,27.6: unified MoE API; PrimTS attention plan/run and paged support; precision-specific restrictions; experimental/autotuning boundaries |
| R27.7 | documentation | Move Fast. Don't Break Things. — FlashInfer's Experimental Path | FlashInfer contributors | First disclosure 2026-09-22 | [Technical disclosure](https://flashinfer.ai/2026/09/22/experimental-path.html) | [Official project](https://github.com/flashinfer-ai/flashinfer) | official documentation | 2026-10-09 | §27.6: explicit opt-in; correctness/hardware admission; graduation and removal policy; experimental-backend distinction |
| R27.8 | repository | Liger Kernel v0.8.4 | LinkedIn Liger Kernel contributors | First release 2026-09-30 | [Release notes](https://github.com/linkedin/Liger-Kernel/releases/tag/v0.8.4) | [Release tag](https://github.com/linkedin/Liger-Kernel/tree/v0.8.4) | official documentation | 2026-10-09 | §§27.5–27.6: Summary; What's Changed items #1424,#1492,#1497,#1498,#1499; integration, indexing, statistics, transport/configuration |
| R27.9 | repository | xFormers v0.0.35: Rely on upstream FA3 | Meta xFormers contributors | First release 2026-02-20 | [Release notes](https://github.com/facebookresearch/xformers/releases/tag/v0.0.35) | [Release tag](https://github.com/facebookresearch/xformers/tree/v0.0.35) | official documentation | 2026-10-09 | §27.6: wheel/framework compatibility statement and Removed section; upstream FA3 dependency distribution |
| R27.10 | documentation | FlashInfer Autotuner v2: Tune the Way You Serve | Yang Xu; Albert Cheng; Vincent Tombari; Alex Yang; BrianK.Ryu; Jingfan Sun; Lee Nau; Xin Li; Po-Han Huang | First disclosure 2026-09-22 | [Technical disclosure](https://flashinfer.ai/2026/09/22/autotuner-v2.html) | [Official project](https://github.com/flashinfer-ai/flashinfer) | official documentation | 2026-10-09 | §27.6: §§1–3 measurement/persistence identity; §§4–5 methodology/observations; rank coordination; “What the measurements changed” |

## R27.1

Inspected arXiv:2603.05451v1; [submission history](https://arxiv.org/abs/2603.05451) confirms 2026-03-05. Full-text method and experimental sections were inspected. **Disclosure conflict:** §5 calls the benchmark device B200, whereas Appendix A.1 says B100 180GB SXM6 and “March 2025.” We do not silently correct either statement or transport its headline ratios. The manuscript uses bounded mechanism attribution and separately derived identities. Archival peer review and exact code/paper equivalence were not established. Resolve the device/date inconsistency with author artifacts before a reviewed benchmark claim.

## R27.2

Inspected arXiv:2512.02556v1; [history](https://arxiv.org/abs/2512.02556) confirms first 2025-12-02. §2.1 provides the selector and its training boundary; Appendix A distinguishes latent execution modes. §2.2 labels its parity study September 2025, and §2.1 states the inherited Exp architecture. Those prewindow results are not used as new empirical evidence. The book's linear absorption and omitted-mass bounds are conditional mathematics, not global model-quality guarantees.

## R27.3

Inspected arXiv:2609.33889v1; [history](https://arxiv.org/abs/2609.33889) confirms 2026-09-27. Methods, same-attention-path comparisons, retrieval controls, and experimental appendices were inspected. The reference is used narrowly for baseline sensitivity and the separation of selection quality from cache-read savings. Its checkpoint/hardware-specific results are not a ranking of libraries or evidence for a production SLA. No independent replication was performed.

## R27.4

Pinned commit: `2e5429fc5653bab6e081f09477126f731882a6a9`; the official repository's commit metadata dates it 2026-09-30 with release message “Open-source release for Ascend 950.” The pinned README declares the breaking device/model/cache change. Its current sparse-prefill all-invalid convention uses zero output with special nonfinite statistics, so the manuscript does not impose a generic mathematical LSE convention on that ABI. Reading the API is OFFICIAL-DOCUMENTATION; no compiled code path or numerical behavior was tested.

## R27.5

Dated first-party disclosure, 2026-09-22; mutable page inspected 2026-10-09, without a content commit. The performance boundary names vLLM 0.25.1 and separates same-kernel integration from changed-precision execution. Accuracy gate is a small 200-question GSM8K check, not broad equivalence. Future work explicitly includes backpropagation. The chapter therefore keeps forward, backward, integration overhead, and checkpoint quality separate. Exact independent reproducibility remains unresolved.

## R27.6

Only the v0.7.0 entry is used; the release index contains other dates outside the selected record. Publication is anchored to the dated release, not a mutable documentation crawl time. Backend restrictions, pending qualification, and experimental status are retained. Current documentation may expose later patches; this chapter does not transfer them into v0.7.0 without separate evidence.

## R27.7

Dated first-party disclosure, 2026-09-22; mutable unpinned page. Inspected admission, explicit opt-in, warning/automatic-selection treatment, focused validation, ownership, and graduation/removal conditions. A policy is evidence of the declared release process, not proof that every candidate passed all scientific or deployment tests. No graduation date is inferred for a particular kernel.

## R27.8

Official release metadata confirms 2026-09-30T20:45:42Z. The inspected tag is v0.8.4; release commit is displayed as `43293d8`. The chapter uses named release changes only. It does not infer a whole model's correctness from a patch title or assert that the runtime in this workspace uses this package. Complete local dependency/build compatibility remains UNVERIFIED.

## R27.9

Official release metadata confirms 2026-02-20T15:02:00Z. The inspected release tag is v0.0.35; commit displayed `03b91d7`. The wheel and upstream dependency change are primary release claims. Kernel capability, installed wheel provenance, and graph/autograd support require a separate executed check; they are not supplied by the package's version number.

## R27.10

Dated first-party disclosure, 2026-09-22; mutable unpinned page. Inspected measurement policy, environment/operation identity, atomic persistence, candidate validation, multi-rank coordination, oracle comparisons, and timer/key audit. The book's finite feasible-set optimization and preparation break-even are original explanatory derivations. The source's observed regret and coordination counts are not imported as our results.

## Evidence gaps and review consequence

[UNVERIFIED] No GPU kernel, distributed layer, cache conversion, package installation, numerical gradient comparison, or serving benchmark was run for this edition. No record establishes universal library superiority, compatibility of current FlashMLA with earlier models, or independent replication. [NOT-DISCLOSED] Complete author environment reconciliation for R27.1, deployment-specific resource measurements, broad cross-checkpoint quality equivalence, energy, and monetary costs remain unavailable. Mutable first-party posts are version-bounded by their dated disclosures but not content-commit-pinned. These gaps preserve **manuscript_draft** and block scientific-reviewed or benchmark-reproduced status.
