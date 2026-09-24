---
id: ms.references.12
entity_type: references
title: Chapter 12 references
short_title: References
section: null
slug: references
parent: ms.chapter.12
prev_sibling: ms.verification.12
next_sibling: null
children: []
prerequisites: []
downstream: []
word_count_target: 1200
volume: 1
part: 2
chapter: 12
related: []
relations: []
axes: {lifecycle: [data, pretraining], mechanism: [data_ingestion, reproducibility], feedback_setting: [], modality: [text, code]}
papers: [P05]
implementations: [impl.pytorch, impl.nvidia-megatron-core, impl.torchtitan, impl.mosaicml-llm-foundry]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# Chapter 12 references

**KNOWN — source register.** Primary sources were opened on **24 September 2026**. The table distinguishes a fixed publication from a moving documentation surface. An access date identifies when a claim was checked; it does not pin the software implementation. No runtime benchmarks or framework compatibility tests were executed for this manuscript.

## Typed reference records

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P05 | paper | Dolma (full title: Dolma: an Open Corpus of Three Trillion Tokens for Language Model Pretraining Research) | Soldaini et al., Allen Institute for AI (Ai2) | arXiv 2024; ACL 2024 | https://arxiv.org/abs/2402.00159 | null | peer-reviewed | Abstract and archival metadata: documented corpus construction and released curation toolkit; official toolkit separately registered as R12.10 | 2026-09-24 |
| R12.1 | documentation | Datasets and Arrow | Hugging Face Research | Unpinned documentation, accessed 2026 | https://huggingface.co/docs/datasets/en/about_arrow | https://github.com/huggingface/datasets | official documentation | “What is Arrow?” and memory-mapping discussion; §12.1 representation boundary | 2026-09-24 |
| R12.2 | documentation | Stream | Hugging Face Research | Unpinned documentation, accessed 2026 | https://huggingface.co/docs/datasets/en/stream | https://github.com/huggingface/datasets | official documentation | Parquet projection; “Shuffle”; “Save a dataset checkpoint and resume iteration”; §§12.1, 12.3, 12.5 | 2026-09-24 |
| R12.3 | documentation | Process | Hugging Face Research | Unpinned documentation, accessed 2026 | https://huggingface.co/docs/datasets/en/process | https://github.com/huggingface/datasets | official documentation | “Multiprocessing” and batched mapping; §12.2 | 2026-09-24 |
| R12.4 | documentation | The cache | Hugging Face Research | Unpinned documentation, accessed 2026 | https://huggingface.co/docs/datasets/en/about_cache | https://github.com/huggingface/datasets | official documentation | “Fingerprint”; §12.2 cache identity, distinguished from the proposed semantic build key | 2026-09-24 |
| R12.5 | documentation | torch.utils.data | PyTorch | Versioned documentation path 2.14 | https://docs.pytorch.org/docs/2.14/data.html | https://github.com/pytorch/pytorch | official documentation | Iterable worker replication, DataLoader, DistributedSampler tail policy and epoch handling; §§12.1–12.6 | 2026-09-24 |
| R12.6 | repository | Data Pipeline: megatron/core/datasets/readme.md | NVIDIA | Moving main branch, accessed 2026; commit not pinned | https://github.com/NVIDIA/Megatron-LM/blob/main/megatron/core/datasets/readme.md | https://github.com/NVIDIA/Megatron-LM | official documentation | “IndexedDataset” and “GPTDataset”: storage and lookup structures; §§12.1–12.4 | 2026-09-24 |
| R12.7 | documentation | Packed Sequences | NVIDIA | Moving latest documentation, accessed 2026 | https://docs.nvidia.com/nemo/megatron-bridge/latest/training/packed-sequences.html | https://github.com/NVIDIA/Megatron-Bridge | official documentation | “What It Is”, “When to Use It”, “Stable Constraints”; §12.4 scope and recipe support | 2026-09-24 |
| R12.8 | documentation | Fast Resumption | MosaicML / Databricks | Moving stable documentation, accessed 2026 | https://docs.mosaicml.com/projects/streaming/en/stable/distributed_training/fast_resumption.html | https://github.com/mosaicml/streaming | official documentation | “Saving and loading state”; §12.5 documented StreamingDataLoader interface | 2026-09-24 |
| R12.9 | repository | LLM Foundry README | Databricks / Mosaic AI Research | Moving main branch, accessed 2026; commit not pinned | https://github.com/mosaicml/llm-foundry | https://github.com/mosaicml/llm-foundry | official documentation | Repository structure and dataset-conversion route; §§12.1–12.3 | 2026-09-24 |
| R12.10 | repository | Dolma toolkit README | Allen Institute for AI (Ai2) | Moving main branch, accessed 2026; commit not pinned | https://github.com/allenai/dolma | https://github.com/allenai/dolma | official documentation | Toolkit overview: parallel curation and taggers; §12.2 | 2026-09-24 |
| R12.11 | repository | TorchTitan README | PyTorch | Moving main branch, accessed 2026; commit not pinned | https://github.com/pytorch/torchtitan | https://github.com/pytorch/torchtitan | official documentation | Feature list: checkpointable loading, logging, profiling; §§12.5–12.6 | 2026-09-24 |

## P05

**PAPER-REPORTED.** Dolma supplies a documented corpus and curation toolkit. The chapter uses that limited claim to motivate inspectable build artifacts; its snapshot transaction, state-closure proof, and deletion algorithm are original engineering derivations, not attributed Dolma mechanisms.

**KNOWN — bibliographic cross-check.** The [ACL archival record](https://aclanthology.org/2024.acl-long.840/) confirms the title, authors, 2024 venue, pages, and DOI [10.18653/v1/2024.acl-long.840](https://doi.org/10.18653/v1/2024.acl-long.840). The arXiv record and archival record were both opened. The manuscript does not reproduce experiments from the paper.

## R12.1

**OFFICIAL-DOCUMENTATION.** The inspected guide describes a columnar memory representation and memory-mapped access. The book's separate accounting of device transfer, decoding, and page residency is a systems deduction, not a claim that every interchange path is copy-free.

## R12.2

**OFFICIAL-DOCUMENTATION.** The inspected sections support projected Parquet reads, finite-buffer iterable shuffling, and state save/restore. The documented shuffle-buffer loss on resume is retained explicitly. The chapter does not infer exact shuffled replay from the presence of a state API.

## R12.3

**OFFICIAL-DOCUMENTATION.** The process guide documents batched mapping and a process-count option. The proposed deterministic task ledger, retry protocol, and publication transaction are not presented as Datasets features.

## R12.4

**OFFICIAL-DOCUMENTATION.** The cache guide describes fingerprints derived from earlier state and transforms. The manuscript's requirement to identify arbitrary external dependencies is an explicit extension of the experimental contract.

## R12.5

**OFFICIAL-DOCUMENTATION.** The stable route redirected through an intermediate page to the **2.14** documentation path, which was opened directly. This identifies the inspected documentation version; no installed PyTorch runtime was checked. Worker replication and sampler padding/dropping are documented behavior.

## R12.6

**OFFICIAL-DOCUMENTATION.** The README distinguishes payload and index files and describes lookup mappings. Its moving branch is unpinned. No implementation commit was audited, and the chapter's simple offset-array equation is deliberately not the library's exact storage specification.

## R12.7

**OFFICIAL-DOCUMENTATION.** The requested NeMo Framework URL redirected to the cited Megatron Bridge URL. The page distinguishes fine-tuning packing from ordinary pretraining concatenation and limits support by recipe. The manuscript deliberately omits a universal pack length and any speedup claim.

## R12.8

**OFFICIAL-DOCUMENTATION.** The page documents state save/restore through StreamingDataLoader. Exactness with custom transforms, changed topology, or changed global batches is not established here. The manuscript does not generalize a fixed configuration's documented behavior to those cases.

## R12.9

**OFFICIAL-DOCUMENTATION.** The official repository supplies the dataset-conversion route when the reference stack's documentation root could not be retrieved. No release number is inferred from examples or dependency tags.

## R12.10

**OFFICIAL-DOCUMENTATION.** The official toolkit README supports the stated component inventory. The text does not adopt its promotional performance descriptions as benchmark evidence.

## R12.11

**OFFICIAL-DOCUMENTATION.** The README lists checkpointable loading and observability features. Presence in that list does not establish compatibility with every loader state or a particular interruption scenario.

## Source-access limitations

**UNVERIFIED — exact deployment pins.** Moving documentation and branch pages were inspected, but their backing commits were not pinned. Any executable reproduction must record package versions, source commits, resolved configuration, and environment independently.

**KNOWN — retrieval outcomes.** The initially attempted Megatron-Core dataset API URL returned 404; the official repository's dataset README was used instead. The LLM Foundry documentation root and a candidate Streaming elastic-determinism page could not be retrieved; the manuscript takes no claim from those failed pages. It uses the official LLM Foundry repository and the successfully opened Fast Resumption page.

**NOT-DISCLOSED — documentation scope.** The inspected pages do not disclose one universal deployment's storage transaction semantics, hardware profile, full checkpoint-state closure, or deletion coverage. No such universal behavior is asserted.

## Original synthesis and derivation register

**DERIVED — authorship boundary.** Equations 12.1–12.17, Algorithms 12.1–12.6, the occurrence/manifest contracts, and the bounded fixtures are the book's own formulation of the stated conditions. They are not copied source algorithms or empirical results. Mathematical statements are accompanied by their conditions and interpretation in the owning sections.

**KNOWN — editorial method.** Source descriptions are paraphrased narrowly with local attribution. API identifiers and exact project names are retained for precision. No prose-similarity audit against an exhaustive external corpus was performed; the chapter makes no absolute plagiarism-detection guarantee.

