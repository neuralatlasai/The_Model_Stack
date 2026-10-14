---
id: ms.references.49
entity_type: references
title: Chapter 49 sources and evidence ledger
volume: 3
part: 9
chapter: 49
section: null
slug: references
parent: ms.chapter.49
prev_sibling: ms.verification.49
next_sibling: null
children: []
prerequisites: [ms.chapter.6, ms.chapter.7, ms.chapter.8, ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.18, ms.chapter.48]
downstream: [ms.chapter.50, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.55, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, serving], mechanism: [evidence_access], feedback_setting: [], modality: [text, image]}
papers: [P39, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 49 — Primary sources and evidence ledger

[KNOWN] Sources were opened on 2026-10-14 at the stated full-text methods, results, appendices, documentation or source functions. Fixed revisions and mutable surfaces remain distinct. Source inspection establishes narrow attributed properties, not runtime correctness, deployment compatibility or measured local performance.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P39 | paper | Dense Passage Retrieval | Vladimir Karpukhin et al. | EMNLP 2020 | [primary text](https://aclanthology.org/2020.emnlp-main.550.pdf) | https://github.com/facebookresearch/DPR | peer-reviewed | 2026-10-14 | Archival full paper inspected; full title Dense Passage Retrieval for Open-Domain Question Answering; §2 top-k accuracy; §3 Eqs. 1–2 / in-batch negatives; §4.1 corpus and §4.2 labels; §5 Tables 2–3 / ablations. ACL CC BY 4.0 policy cross-checked R49.21. |
| P40 | paper | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | Patrick Lewis et al. | NeurIPS 2020 | [primary text](https://arxiv.org/html/2005.11401v4) | https://github.com/huggingface/transformers | peer-reviewed | 2026-10-14 | Inspected v4 dated 2021-04-12; §§2.1–2.5 latent-document retrieval/generation, fixed document encoder/index and query/generator updates. Only retrieval boundary taught here; Chapter 50 owns full RAG factorization. |
| R49.1 | paper | How Far Is Document Parsing from Solved? PureDocBench: A Source-Traceable Benchmark across Clean, Degraded, and Real-World Settings | Zhiheng Li et al. | arXiv 2026 | [primary text](https://arxiv.org/html/2605.07492v1) | Paper-linked released artifact; not executed | preprint | 2026-10-14 | v1, 2026-05-08; CC BY 4.0; §2.1 corpus generation; §3.1 metrics/configuration, §3.2 Table 2; Appendix A audit population/default-OK bucket; Appendix E exact backend exceptions; Appendix H source validation. |
| R49.2 | paper | The Probabilistic Relevance Framework: BM25 and Beyond | Stephen Robertson; Hugo Zaragoza | Foundations and Trends in Information Retrieval 3(4), 2009 | [primary text](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf) | Not supplied | peer-reviewed | 2026-10-14 | Author-hosted 59-page fixed PDF; §§2.2–2.5 relevance/rank equivalence; §3.1 binary independence; §§3.4.1–3.4.5 eliteness/2-Poisson/saturation; Eqs. 3.10,3.12–3.15; §3.5 parameter selection. Mathematical/empirical status kept separate. |
| R49.3 | paper | SPLADE v2: Sparse Lexical and Expansion Model for Information Retrieval | Thibault Formal; Carlos Lassance; Benjamin Piwowarski; Stéphane Clinchant | arXiv 2021 | [primary text](https://arxiv.org/pdf/2109.10086v1) | https://github.com/naver/splade | preprint | 2026-10-14 | v1, 2021-09-21, CC BY-NC-SA 4.0; §§2–3 pooling/regularization/distillation/mining; §4 optimizer/data/hardware, Table 1, Figures 1–2 and §4.1 max-pooling comparison. Library FLOPS surrogate is not actual accelerator FLOPs. |
| R49.4 | paper | Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs | Yu. A. Malkov; D. A. Yashunin | arXiv historical HNSW manuscript | [primary text](https://arxiv.org/pdf/1603.09320v4) | https://github.com/nmslib/hnswlib | preprint | 2026-10-14 | v4 fixed PDF inspected; §4 Algorithms 1–5; §4.2 idealized complexity conditions/high-dimensional gap; Figure 7 clustering; Figure 10 construction; §5.1 historical nmslib baseline. No universal logarithmic query theorem adopted. |
| R49.5 | paper | The Faiss Library | Matthijs Douze et al. | arXiv 2024 | [primary text](https://arxiv.org/html/2401.08281v2) | https://github.com/facebookresearch/faiss | preprint | 2026-10-14 | v2, 2024-09-06, CC BY 4.0; §§3.1–3.5 exact/approximate metrics/refinement; §4.1 PQ/ADC/codecs, §4.2 transforms; §§5.1–5.4 IVF/graph/benchmarking; §§6–7 updates/filtering/external storage. Originating library report supports implementation synthesis. |
| R49.6 | documentation | Faiss indexes | Faiss maintainers | current wiki | [primary text](https://github.com/facebookresearch/faiss/wiki/Faiss-indexes) | https://github.com/facebookresearch/faiss | official documentation | 2026-10-14 | Unpinned wiki; Summary of methods; Flat indexes; Cell-probe methods; IndexHNSW variants/Supported operations; Product Quantization. Uneven lists and implementation-specific removal limits inspected. |
| R49.7 | documentation | Special operations on indexes | Faiss maintainers | current wiki | [primary text](https://github.com/facebookresearch/faiss/wiki/Special-operations-on-indexes) | same | official documentation | 2026-10-14 | Unpinned wiki; Direct Map for an IndexIVF; Removing elements; Splitting and merging. NoMap/Array/Hashtable; Array cannot remove; Hashtable plus IDSelectorArray exception to full scan; sequential-ID shifts. |
| R49.8 | documentation | Index IO, cloning and hyper parameter tuning | Faiss maintainers | current wiki | [primary text](https://github.com/facebookresearch/faiss/wiki/Index-IO,-cloning-and-hyper-parameter-tuning) | same | official documentation | 2026-10-14 | Unpinned wiki; I/O and deep copying; loaded-artifact integrity warning; Auto-tuning runtime parameters; Reliability. GPU indexes require conversion for documented serialization. |
| R49.9 | documentation | Indexes that do not fit in RAM | Faiss maintainers | current wiki | [primary text](https://github.com/facebookresearch/faiss/wiki/Indexes-that-do-not-fit-in-RAM) | same | official documentation | 2026-10-14 | Unpinned wiki; Distributed index/demo security warning; On-disk storage / layout / OnDiskInvertedLists; Caching; OS support. Explicit on-disk IVF contradicts a universal RAM-only reading of shorthand guidelines. |
| R49.10 | paper | Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods | G. V. Cormack; C. L. A. Clarke; Stefan Büttcher | SIGIR 2009 | [primary text](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) | Not supplied | peer-reviewed | 2026-10-14 | Author-hosted fixed two-page paper; §1 RRF equation/offset pilot; Tables 1–3 TREC/LETOR protocols/results; post-pilot sign test and §2 discussion. No universal dominance theorem claimed. |
| R49.11 | paper | Passage Re-ranking with BERT | Rodrigo Nogueira; Kyunghyun Cho | arXiv 2019/2020 revision | [primary text](https://arxiv.org/pdf/1901.04085v5) | https://github.com/nyu-dl/dl4marco-bert | preprint | 2026-10-14 | v5, 2020-04-14; §2 paired segments/truncation/classification, Eq. 1; §3.1 MS MARCO and Table 1. Historical candidate/model configuration retained. |
| R49.12 | paper | ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction | Keshav Santhanam; Omar Khattab; Jon Saad-Falcon; Christopher Potts; Matei Zaharia | NAACL 2022; earlier inspected revision | [primary text](https://arxiv.org/html/2112.01488v2) | https://github.com/stanford-futuredata/ColBERT | peer-reviewed | 2026-10-14 | Inspected v2, 2021-12-16, CC BY 4.0; §§4.1–4.5 MaxSim, denoised supervision, residual compression, indexing/retrieval; §6 Table 4 and §6.3 20/29/154 GiB. Archival metadata separately opened https://aclanthology.org/2022.naacl-main.272/; later archival abstract has different headline compression range. |
| R49.13 | paper | Precise Zero-Shot Dense Retrieval without Relevance Labels | Luyu Gao; Xueguang Ma; Jimmy Lin; Jamie Callan | ACL 2023 | [primary text](https://arxiv.org/pdf/2212.10496v1) | https://github.com/texttron/hyde | peer-reviewed | 2026-10-14 | Inspected v1, 2022-12-20; §3 Eqs. 5–8 generated-document embedding average; §4.1 setup; Tables 1–2; Appendix A prompts. Archival metadata opened https://aclanthology.org/2023.acl-long.99/; hypothetical content remains outside evidence. |
| R49.14 | paper | Interleaving Retrieval with Chain-of-Thought Reasoning for Knowledge-Intensive Multi-Step Questions | Harsh Trivedi; Niranjan Balasubramanian; Tushar Khot; Ashish Sabharwal | ACL 2023 | [primary text](https://arxiv.org/pdf/2212.10509v2) | https://github.com/stonybrooknlp/ircot | peer-reviewed | 2026-10-14 | v2, 2023-06-23; §3.1 interleaving/eight-step/fifteen-paragraph caps; §4 splits/demonstrations/metrics; §5 Figures 3–4 negative IIRC QA case. Archival metadata opened https://aclanthology.org/2023.acl-long.557/. |
| R49.15 | paper | From Local to Global: A GraphRAG Approach to Query-Focused Summarization | Darren Edge et al. | arXiv 2024; revised 2025 | [primary text](https://arxiv.org/html/2404.16130v2) | https://github.com/microsoft/graphrag | preprint | 2026-10-14 | v2, 2025-02-19, CC BY 4.0; §§3.1.1–3.1.6 extraction/entity matching/communities/summaries; §§3.2–3.3 generated questions/judge criteria; §§4–5 Figure 2/Table 2 protocols and outcomes. Global sensemaking, not exact local evidence recall. |
| R49.16 | paper | BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models | Nandan Thakur; Nils Reimers; Andreas Rücklé; Abhishek Srivastava; Iryna Gurevych | NeurIPS Datasets and Benchmarks 2021 | [primary text](https://arxiv.org/html/2104.08663v4) | https://github.com/beir-cellar/beir | peer-reviewed | 2026-10-14 | v4, 2021-10-21, CC BY-SA 4.0; §§3–4 corpus/tasks/checkpoints/truncation; §5 Table 2 positive/negative transfer; §5.1 Table 3 systems boundary. Nineteen table rows include in-domain MS MARCO and eighteen transfer datasets. |
| R49.17 | technical report | Qwen3-VL-Embedding and Qwen3-VL-Reranker: A Unified Framework for State-of-the-Art Multimodal Retrieval and Ranking | Mingxin Li et al. / Tongyi Lab, Alibaba Group | arXiv 2026 | [primary text](https://arxiv.org/html/2601.04720v1) | https://github.com/QwenLM/Qwen3-VL-Embedding | preprint | 2026-10-14 | v1, 2026-01-08; §2 pooling/causal backbone; §§3.3–4 mining/stages/merging; §5.2 yes/no objective; §6.4 Table 5 top-100 reranking; §7.3 Table 6 stage tradeoff. Abstract January 2025 ranking date conflicts with revision/introduction; not used as a current ranking. |
| R49.18 | paper | Re-ranking and Late Interaction Drive Retrieval Quality: A Controlled Comparison of RAG Strategies for Scientific Question Answering | Bhagyesh Rathi; Eshan Chawla; William B. Andreopoulos | arXiv 2026 | [primary text](https://arxiv.org/html/2609.38473v1) | Paper-linked source/artifact; not executed | preprint | 2026-10-14 | v1, 2026-09-29, CC BY 4.0; §§3.1–3.5 source-derived query construction/date semantics/models/budgets/answer-only judge; §4.4 Table 5 direct gold-paper metrics, §4.5 paired analysis; §6 limitations. Different encoders/indexes and candidate depth prevent architecture-only attribution. |
| R49.19 | repository | Faiss IVF search and PQ code layout | Meta / Faiss maintainers | immutable source inspection | [primary text](https://github.com/facebookresearch/faiss/blob/a643100c88dbf3a0f06f23fa8d9d7c0b76885200/faiss/IndexIVF.cpp) | https://github.com/facebookresearch/faiss | official documentation | 2026-10-14 | Commit a643100c88dbf3a0f06f23fa8d9d7c0b76885200; raw IndexIVF.cpp search lines 399–455, search_preassigned 495–564, update_vectors 1363–1387; ProductQuantizer.cpp set_derived_values raw lines 61–71. Static fetch/read only; exact secondary URL/hash in keyed note. |
| R49.20 | documentation | PostgreSQL row security and table expressions | PostgreSQL Global Development Group | 18 documentation surface | [primary text](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | https://github.com/postgres/postgres | official documentation | 2026-10-14 | Unpinned current displayed PostgreSQL 18; §5.9 row-policy enforcement/bypass/combination; companion https://www.postgresql.org/docs/current/queries-table-expressions.html §§7.2.1–7.2.3 joins/WHERE/grouping/null semantics. No query executed. |
| R49.21 | documentation | What is the copyright for materials in the ACL Anthology? | ACL Anthology | current policy | [primary text](https://aclanthology.org/faq/copyright/) | Not applicable | official documentation | 2026-10-14 | Unpinned FAQ opened; paragraphs specifying CC BY 4.0 for ACL materials from 2016 onward; site build a75fcdc dated 2026-10-12. Used only for licensed primary-paper adaptation, not retrieval claims. |

## Keyed source records

### P39

[KNOWN] Archival full paper inspected; full title Dense Passage Retrieval for Open-Domain Question Answering; §2 top-k accuracy; §3 Eqs. 1–2 / in-batch negatives; §4.1 corpus and §4.2 labels; §5 Tables 2–3 / ablations. ACL CC BY 4.0 policy cross-checked R49.21.

### P40

[KNOWN] Inspected v4 dated 2021-04-12; §§2.1–2.5 latent-document retrieval/generation, fixed document encoder/index and query/generator updates. Only retrieval boundary taught here; Chapter 50 owns full RAG factorization.

### R49.1

[KNOWN] v1, 2026-05-08; CC BY 4.0; §2.1 corpus generation; §3.1 metrics/configuration, §3.2 Table 2; Appendix A audit population/default-OK bucket; Appendix E exact backend exceptions; Appendix H source validation.

### R49.2

[KNOWN] Author-hosted 59-page fixed PDF; §§2.2–2.5 relevance/rank equivalence; §3.1 binary independence; §§3.4.1–3.4.5 eliteness/2-Poisson/saturation; Eqs. 3.10,3.12–3.15; §3.5 parameter selection. Mathematical/empirical status kept separate.

### R49.3

[KNOWN] v1, 2021-09-21, CC BY-NC-SA 4.0; §§2–3 pooling/regularization/distillation/mining; §4 optimizer/data/hardware, Table 1, Figures 1–2 and §4.1 max-pooling comparison. Library FLOPS surrogate is not actual accelerator FLOPs.

### R49.4

[KNOWN] v4 fixed PDF inspected; §4 Algorithms 1–5; §4.2 idealized complexity conditions/high-dimensional gap; Figure 7 clustering; Figure 10 construction; §5.1 historical nmslib baseline. No universal logarithmic query theorem adopted.

### R49.5

[KNOWN] v2, 2024-09-06, CC BY 4.0; §§3.1–3.5 exact/approximate metrics/refinement; §4.1 PQ/ADC/codecs, §4.2 transforms; §§5.1–5.4 IVF/graph/benchmarking; §§6–7 updates/filtering/external storage. Originating library report supports implementation synthesis.

### R49.6

[KNOWN] Unpinned wiki; Summary of methods; Flat indexes; Cell-probe methods; IndexHNSW variants/Supported operations; Product Quantization. Uneven lists and implementation-specific removal limits inspected.

### R49.7

[KNOWN] Unpinned wiki; Direct Map for an IndexIVF; Removing elements; Splitting and merging. NoMap/Array/Hashtable; Array cannot remove; Hashtable plus IDSelectorArray exception to full scan; sequential-ID shifts.

### R49.8

[KNOWN] Unpinned wiki; I/O and deep copying; loaded-artifact integrity warning; Auto-tuning runtime parameters; Reliability. GPU indexes require conversion for documented serialization.

### R49.9

[KNOWN] Unpinned wiki; Distributed index/demo security warning; On-disk storage / layout / OnDiskInvertedLists; Caching; OS support. Explicit on-disk IVF contradicts a universal RAM-only reading of shorthand guidelines.

### R49.10

[KNOWN] Author-hosted fixed two-page paper; §1 RRF equation/offset pilot; Tables 1–3 TREC/LETOR protocols/results; post-pilot sign test and §2 discussion. No universal dominance theorem claimed.

### R49.11

[KNOWN] v5, 2020-04-14; §2 paired segments/truncation/classification, Eq. 1; §3.1 MS MARCO and Table 1. Historical candidate/model configuration retained.

### R49.12

[KNOWN] Inspected v2, 2021-12-16, CC BY 4.0; §§4.1–4.5 MaxSim, denoised supervision, residual compression, indexing/retrieval; §6 Table 4 and §6.3 20/29/154 GiB. Archival metadata separately opened https://aclanthology.org/2022.naacl-main.272/; later archival abstract has different headline compression range.

### R49.13

[KNOWN] Inspected v1, 2022-12-20; §3 Eqs. 5–8 generated-document embedding average; §4.1 setup; Tables 1–2; Appendix A prompts. Archival metadata opened https://aclanthology.org/2023.acl-long.99/; hypothetical content remains outside evidence.

### R49.14

[KNOWN] v2, 2023-06-23; §3.1 interleaving/eight-step/fifteen-paragraph caps; §4 splits/demonstrations/metrics; §5 Figures 3–4 negative IIRC QA case. Archival metadata opened https://aclanthology.org/2023.acl-long.557/.

### R49.15

[KNOWN] v2, 2025-02-19, CC BY 4.0; §§3.1.1–3.1.6 extraction/entity matching/communities/summaries; §§3.2–3.3 generated questions/judge criteria; §§4–5 Figure 2/Table 2 protocols and outcomes. Global sensemaking, not exact local evidence recall.

### R49.16

[KNOWN] v4, 2021-10-21, CC BY-SA 4.0; §§3–4 corpus/tasks/checkpoints/truncation; §5 Table 2 positive/negative transfer; §5.1 Table 3 systems boundary. Nineteen table rows include in-domain MS MARCO and eighteen transfer datasets.

### R49.17

[KNOWN] v1, 2026-01-08; §2 pooling/causal backbone; §§3.3–4 mining/stages/merging; §5.2 yes/no objective; §6.4 Table 5 top-100 reranking; §7.3 Table 6 stage tradeoff. Abstract January 2025 ranking date conflicts with revision/introduction; not used as a current ranking.

### R49.18

[KNOWN] v1, 2026-09-29, CC BY 4.0; §§3.1–3.5 source-derived query construction/date semantics/models/budgets/answer-only judge; §4.4 Table 5 direct gold-paper metrics, §4.5 paired analysis; §6 limitations. Different encoders/indexes and candidate depth prevent architecture-only attribution.

### R49.19

[KNOWN] Commit a643100c88dbf3a0f06f23fa8d9d7c0b76885200; raw IndexIVF.cpp search lines 399–455, search_preassigned 495–564, update_vectors 1363–1387; ProductQuantizer.cpp set_derived_values raw lines 61–71. Static fetch/read only; exact secondary URL/hash in keyed note.

### R49.20

[KNOWN] Unpinned current displayed PostgreSQL 18; §5.9 row-policy enforcement/bypass/combination; companion https://www.postgresql.org/docs/current/queries-table-expressions.html §§7.2.1–7.2.3 joins/WHERE/grouping/null semantics. No query executed.

### R49.21

[KNOWN] Unpinned FAQ opened; paragraphs specifying CC BY 4.0 for ACL materials from 2016 onward; site build a75fcdc dated 2026-10-12. Used only for licensed primary-paper adaptation, not retrieval claims.

## Immutable implementation inspection

[OFFICIAL-DOCUMENTATION] R49.19 includes the exact companion [ProductQuantizer.cpp](https://raw.githubusercontent.com/facebookresearch/faiss/a643100c88dbf3a0f06f23fa8d9d7c0b76885200/faiss/impl/ProductQuantizer.cpp). The retrieved raw file computes code_size as integer byte rounding, requires a positive subspace count and divisible dimension, and allocates d times 2^nbits centroid scalars. File SHA-256: dd510ac3918acc9f1a70dd1afec1f920b4c40f37fa04c360c1cb0aef21618baf.

[OFFICIAL-DOCUMENTATION] Retrieved raw IndexIVF.cpp SHA-256: c1480a79d829f1554c2e49fbc78ef20e9761f572fe69acd75e8476ebd4354614. Its search and search_preassigned functions expose the inspected nprobe, selector and scan-budget boundary. Web rendering collapses some blank lines; raw-file line numbers above identify the fetched bytes. No import, compilation, unit test, search or update was executed; CODE-VERIFIED is not used.

## Version and evidence gaps

[KNOWN] The ColBERTv2 methods/storage numbers are explicitly the earlier v2 manuscript; archival metadata confirms publication but does not replace that inspected result boundary. BEIR's table includes an in-domain reference in addition to transfer rows. HyDE/IRCoT PDF headers were read to resolve their actual versions rather than attributing the current arXiv URL to an assumed revision.

[UNVERIFIED] The original 2011 PQ author PDF could not be retrieved reliably from its old host, and HAL returned an access-denied page. No detailed claim is attributed to an inspected 2011 text. The originating Faiss library authors' full, licensed report and pinned official codec source provide the actual evidence used for the reconstructed PQ implementation. Failed publisher/course-mirror BM25 routes were replaced by the successfully inspected author-hosted PDF.

[NOT-DISCLOSED] Several historical papers omit complete uncertainty, precision or current executable configuration for performance figures. The manuscript confines their results to disclosed datasets, candidate budgets, hardware and revisions. Current mutable wiki/docs do not establish a current measured speed ranking.

[DERIVED] Original derivations and engineering synthesis are predominant. Licensed primary papers support attributed adaptations with source locators; nonexclusive papers and documentation are paraphrased compactly. No long source prose or benchmark artifact is reproduced.

[UNVERIFIED] No corpus was ingested, encoder/router trained, index built, policy enforced or retrieval benchmark executed. The [verification artifact](verification.md) remains a proposal, and every chapter file remains manuscript_draft.
