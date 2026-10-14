---
id: "ms.references.50"
entity_type: "references"
title: "Chapter 50 — References"
volume: 3
part: 9
chapter: 50
section: null
slug: "references"
parent: "ms.chapter.50"
prev_sibling: "ms.verification.50"
next_sibling: null
children: []
prerequisites: ["ms.chapter.10","ms.chapter.15","ms.chapter.37","ms.chapter.38","ms.chapter.49"]
downstream: ["ms.chapter.51","ms.chapter.52","ms.chapter.53","ms.chapter.54"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["retrieval","context_construction","grounding"],"feedback_setting":[],"modality":["text"]}
papers: ["P40","P50"]
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.vllm"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 1500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# Chapter 50 references

[DERIVED] These primary texts, methods, evaluation sections and official source paths were actually inspected on **2026-10-14**. A source-reported result is not an independent replication. Branch documentation/source is explicitly unpinned and unexecuted. Bibliographic routes are distinguished from mechanism evidence.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P40 | paper | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | Patrick Lewis et al.; Facebook AI Research/UCL/NYU | NeurIPS / 2020 | https://arxiv.org/html/2005.11401v4 | https://github.com/huggingface/transformers | peer-reviewed | Inspected arXiv v4, 2021-04-12; §§2.1–2.5 latent models, frozen document encoder, training and approximate decoding; §3/Table 1 historical QA protocol/results. 50.3 derives normalized restricted mixtures independently of the paper's truncated notation | 2026-10-14 |
| R50.2 | paper | Leveraging Passage Retrieval with Generative Models for Open Domain Question Answering | Gautier Izacard, Edouard Grave | EACL / 2021 | https://aclanthology.org/2021.eacl-main.74.pdf | https://github.com/facebookresearch/FiD | peer-reviewed | Archival PDF, pp. 874–880; §3/Figure 2 encoder independence/decoder fusion; §4/Table 1 and Table 2 protocol, passage-count/training effects. Full method and experiments inspected; original attention-count derivation in 50.5 | 2026-10-14 |
| R50.3 | paper | LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models | Huiqiang Jiang et al.; Microsoft | EMNLP / 2023 | https://arxiv.org/html/2310.05736v2 | https://github.com/microsoft/LLMLingua | peer-reviewed | Inspected v2, 2023-12-06; §§3–4 objectives/budget controller/iterative scoring/alignment; §5.1 implementation; Tables 2–3 quality/ablation. §4.2 Eq. 7 probability/PPL notation tension is not an implementation-bug claim | 2026-10-14 |
| R50.4 | paper | Enabling Large Language Models to Generate Text with Citations | Tianyu Gao, Howard Yen, Jiatong Yu, Danqi Chen | EMNLP / 2023 | https://arxiv.org/html/2305.14627v2 | https://github.com/princeton-nlp/ALCE | peer-reviewed | Inspected v2, 2023-10-31; §§2–4 dataset/metrics/prompting; §3.3 citation recall/precision; §5/Table 4 and §6/Tables 8–9 human comparison. Official proceedings identity/license checked at https://aclanthology.org/2023.emnlp-main.398/ | 2026-10-14 |
| R50.5 | paper | Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection | Akari Asai et al.; University of Washington/AI2/IBM | ICLR / 2024 | https://arxiv.org/html/2310.11511v1 | https://github.com/AkariAsai/self-rag | peer-reviewed | Inspected original 2023 v1; §§3.1–3.3 critic/generator training, masked evidence loss, adaptive retrieval and segment search; §§4–5/Table 2/Figure 3 component protocols. Main 150k and ablation 50k training kept distinct | 2026-10-14 |
| R50.6 | paper | Retrieval Augmented Generation or Long-Context LLMs? A Comprehensive Study and Hybrid Approach | Zhuowan Li, Cheng Li, Mingyang Zhang, Qiaozhu Mei, Michael Bendersky | EMNLP Industry / 2024 | https://aclanthology.org/2024.emnlp-industry.66.pdf | Not independently inspected | peer-reviewed | Archival pp. 881–893, §§3–4/Table 1; arXiv v1 https://arxiv.org/html/2407.16833v1 also inspected. Both surfaces show prose/table aggregate inconsistencies. Published Table 1 supplies quoted values; provided-document rather than global-corpus comparison | 2026-10-14 |
| R50.7 | paper | Lost in the Middle: How Language Models Use Long Contexts | Nelson F. Liu et al. | TACL / 2024 | https://arxiv.org/html/2307.03172v3 | https://github.com/nelson-liu/lost-in-the-middle | peer-reviewed | Inspected v3; §§2.1–2.3 controlled NQ paragraph task, distractor/position manipulations, model revisions and Table 1. Historical position sensitivity, not a universal current-model claim | 2026-10-14 |
| R50.8 | paper | DS@GT ARC at LongEval: Citation Integrity and Factual Grounding in Scientific QA | Brandon Michaels, Brendon Johnson; Georgia Tech | CLEF working-note / 2026 | https://arxiv.org/html/2607.14400v1 | Not independently inspected | preprint | v1, 2026-07-15; CC BY 4.0; full §§3–6, Tables 1–4 and Figure 1. Ten pre-retrieved candidates, relevance-versus-entailment distinction, 47-query nonsignificant paired test, static payload and judge limits | 2026-10-14 |
| R50.9 | paper | CiteGuard-RAG: A Validation-Centered AI System for Evidence-Grounded Question Answering | Sumit Barua et al.; Western Michigan University | arXiv / 2026 | https://arxiv.org/html/2609.15830v1 | Not disclosed | preprint | v1, 2026-09-14; arXiv nonexclusive; full §§2–4/Algorithm 1/Tables 1–12 inspected. 50.4 uses §2.6 thresholds, evaluation cohort and Table 11 domain shift; no zero-risk claim or invented counts/revisions | 2026-10-14 |
| R50.10 | paper | The Laws of Context Allocation: Causal Measurement and Closed-Loop Orchestration in Generative Search | Peiyang Liu, Xi Wang, Di Liang, Wei Ye | arXiv / 2026 | https://arxiv.org/html/2608.23252v1 | https://github.com/PeiYangLiu/ascp | preprint | v1, 2026-08-24; CC BY 4.0; §§3–8, Tables 7/10/11 and Appendix A.1 inspected. Fixed-round submodular proxy, LOO controls, held-out protocol, negative contrasts. Placeholder TOIS volume/DOI is not publication evidence; code not executed | 2026-10-14 |
| R50.11 | technical report | Introducing the MLPerf End-to-End RAG Inference Benchmark | Ramesh Chukka, Manasa Kankanala, Rajesh Poornachandran, Saehanseul Yi; MLCommons | Official technical disclosure / 2026 | https://mlcommons.org/2026/08/endtoend-inference/ | Official reference links in disclosure | official documentation | 2026-08-26 disclosure, mutable unpinned page; task/model selection, Performance metrics, Accuracy metrics and Compliance inspected. Recorded stage/hop inputs, Offline-only initial scenario, separate accuracy, final-only TEST09; no measured hardware speedup | 2026-10-14 |
| P50 | paper | Holistic Evaluation of Language Models | Percy Liang et al.; Stanford CRFM | TMLR / 2023 | https://arxiv.org/html/2211.09110v2 | https://github.com/stanford-crfm/helm | peer-reviewed | v2, 2023-10-01; §§2.1–2.3 scenario/adaptation/metric, §§4.3–4.5 multi-metric/calibration/selective evaluation. General framework only; current live dashboard not used as method evidence | 2026-10-14 |
| R50.13 | repository | modeling_rag.py | Hugging Face Transformers | Official source / 2026 access | https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/models/rag/modeling_rag.py | https://github.com/huggingface/transformers | official documentation | main unpinned, not executed; RagSequenceForGeneration.get_nll lines 929–981 and RagTokenForGeneration.get_nll lines 1481–1512 at access: document softmax, sum/log-sum-exp order and padding masks | 2026-10-14 |
| R50.14 | repository | ALCE eval.py | Princeton NLP | Official source / 2026 access | https://raw.githubusercontent.com/princeton-nlp/ALCE/main/eval.py | https://github.com/princeton-nlp/ALCE | official documentation | main unpinned, not executed; _run_nli_autoais and compute_autoais lines 245–392: joint/individual/removal support, segmentation, averaging and skipped empty-output boundary | 2026-10-14 |
| R50.15 | documentation | Chat templates | Hugging Face Transformers | Documentation / 2026 access | https://huggingface.co/docs/transformers/main/en/chat_templating | https://github.com/huggingface/transformers | official documentation | main unpinned; guide “Using apply_chat_template”, special-token note, generation prompt and final-message continuation; structured role serialization and mutually exclusive modes. No executable compatibility claim | 2026-10-14 |

## Licensing and interpretation

[OFFICIAL-DOCUMENTATION] The ACL Anthology's official footer states that ACL materials published in or after 2016 are CC BY 4.0. The proceedings surfaces identify FiD, LLMLingua, ALCE and Self-Route as ACL works; attributed explanatory adaptations retain their source identities. [ACL licensing statement](https://aclanthology.org/2023.emnlp-main.398/), footer, inspected 2026-10-14.

[DERIVED] R50.8/R50.10 explicitly carry CC BY 4.0. Other source-specific prose is compact; original probability, optimization, calibration and cost reasoning predominates. Source rhetoric about universal laws, upper bounds or guaranteed grounding is not adopted when the proof or experiment has narrower premises.

[NOT-DISCLOSED] CiteGuard lacks immutable generator revisions and clear denominators for some percentages. Self-Route's table and nearby aggregate prose disagree. The allocation paper's fixed-round guarantee does not prove adaptive/token-budget optimality; its reported context widths do not exercise the advertised million-token capacity. LongEval's reference-free judge does not identify causal evidence use.

[UNVERIFIED] No model, repository or proposed experiment was executed. Mutable code/docs are not commit-pinned; no book-measured quality, latency, energy or rollback result is claimed. Exact versions, complete cost boundaries and independent labels remain requirements in [verification](verification.md).
