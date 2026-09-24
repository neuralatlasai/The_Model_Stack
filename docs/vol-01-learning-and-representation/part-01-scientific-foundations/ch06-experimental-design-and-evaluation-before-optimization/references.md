---
id: ms.references.6
entity_type: references
title: Chapter 06 references and evidence boundaries
short_title: References
volume: 1
part: 1
chapter: 6
section: null
slug: references
parent: ms.chapter.6
prev_sibling: ms.verification.6
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [source_provenance], feedback_setting: [], modality: [text]}
papers: [P06, P07, P09, P38, P50, P51]
implementations: [impl.hugging-face-transformers, impl.vllm, impl.sglang]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1200
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Chapter 06 — References and evidence boundaries

Primary sources below were opened during continuation of this chapter. Access dates record source inspection, not code execution or independent reproduction. Paper records support only the attributed methodological statements; the chapter's illustrative calculations and proposed protocols are separately labelled. A `null` code field means no official implementation was inspected for that record, not that none exists.

## Primary-paper spine

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P06 | paper | The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale | Guilherme Penedo et al.; Hugging Face Research | arXiv, 2024 | [Abstract](https://arxiv.org/abs/2406.17557); [v1 full text](https://arxiv.org/html/2406.17557v1) | null | preprint | 2026-09-20 | §6.3 filtering ablations and their replication boundary; no independent reproduction |
| P07 | paper | DataComp-LM: In search of the next generation of training sets for language models | Jeffrey Li et al. | arXiv, 2024; inspected v4, 2025 | [Abstract](https://arxiv.org/abs/2406.11794); [v4 full text](https://arxiv.org/html/2406.11794v4) | null | preprint | 2026-09-20 | §3.2–3.5 fixed-scale design; §4.6 overlap checks; §6 limitations; Appendix R compute accounting; Chapter 06 verification anchor |
| P09 | paper | Training Compute-Optimal Large Language Models | Jordan Hoffmann et al.; Google DeepMind | arXiv, 2022 | [Primary record](https://arxiv.org/abs/2203.15556) | null | preprint | 2026-09-20 | Fixed training-compute allocation; no transfer of a fitted optimum to this chapter's proposed configuration |
| P38 | paper | DistServe: Disaggregating Prefill and Decoding for Goodput-optimized Large Language Model Serving | Yinmin Zhong et al. | arXiv, 2024 | [Primary record](https://arxiv.org/abs/2401.09670) | null | preprint | 2026-09-20 | Latency-constrained serving comparison in §6.5; no speedup figure reused |
| P50 | paper | Holistic Evaluation of Language Models | Percy Liang et al.; Stanford CRFM | TMLR, 2023; preprint 2022 | [Primary record, v2](https://arxiv.org/abs/2211.09110v2) | [HELM](https://github.com/stanford-crfm/helm) | peer-reviewed | 2026-09-20 | Multi-metric scenario design, standardised evaluation, retained prompts/completions; Chapter 06 anchor |
| P51 | paper | Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference | Wei-Lin Chiang et al. | arXiv, 2024 | [Primary record](https://arxiv.org/abs/2403.04132) | null | preprint | 2026-09-20 | Preference evaluation as a different estimand from task correctness |

The `preprint` status records the inspected arXiv surface; it is not a claim that no archival version exists. P50's journal status is explicitly stated on its arXiv record. Bibliographic keys match Appendix D of `book_plan.md`.

## Chapter-specific sources

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R6.1 | paper | Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations | Evan Miller; Anthropic | arXiv, 2024 | [Record](https://arxiv.org/abs/2411.00640); [v1 full text](https://arxiv.org/html/2411.00640v1) | null | preprint | 2026-09-20 | Paired/clustered inference and planning; §6.4's crossed-effects model is the book's explicit derivation |
| R6.2 | repository | LM Evaluation Harness | EleutherAI and contributors | moving default branch | [Repository](https://github.com/EleutherAI/lm-evaluation-harness) | [Repository](https://github.com/EleutherAI/lm-evaluation-harness) | official documentation | 2026-09-20 | Backend roles and configuration-driven evaluation; outside §4, routed by Appendix B |
| R6.3 | documentation | LM Evaluation Harness command-line interface | EleutherAI and contributors | moving main branch | [Interface documentation](https://github.com/EleutherAI/lm-evaluation-harness/blob/main/docs/interface.md) | [Repository](https://github.com/EleutherAI/lm-evaluation-harness) | official documentation | 2026-09-20 | Sample logging, cache and seed controls; no execution compatibility asserted |
| R6.4 | paper | Lessons from the Trenches on Reproducible Evaluation of Language Models | Stella Biderman et al. | arXiv, 2024; full text inspected at v2 | [Record](https://arxiv.org/abs/2405.14782); [v2 full text](https://arxiv.org/html/2405.14782v2) | [Harness](https://github.com/EleutherAI/lm-evaluation-harness) | preprint | 2026-09-20 | Prompt sensitivity, evaluation protocol, reproducibility; latest record also lists a 2026 revision, whose changes are not attributed to v2 |
| R6.5 | repository | Holistic Evaluation of Language Models | Stanford CRFM | README inspected 2026 | [Repository](https://github.com/stanford-crfm/helm) | [Repository](https://github.com/stanford-crfm/helm) | official documentation | 2026-09-20 | Run/summarise/inspect separation; maintenance-mode notice effective 2026-06-01 |
| R6.6 | technical report | A statistical approach to model evaluations | Anthropic | research article, 2024 | [Research article](https://www.anthropic.com/research/statistical-approach-to-model-evals) | null | official documentation | 2026-09-20 | Lab route to R6.1; explanatory context, not independent replication |
| R6.7 | documentation | Artificial Analysis Benchmarking Methodology | Artificial Analysis | living methodology | [Methodology](https://artificialanalysis.ai/methodology) | null | official documentation | 2026-09-20 | Model/endpoint distinction, customer-visible boundary, token convention |
| R6.8 | documentation | Language Model API Performance Benchmarking | Artificial Analysis | living methodology | [Performance methodology](https://artificialanalysis.ai/methodology/performance-benchmarking) | null | official documentation | 2026-09-20 | Workload, load scenario, measurement window and limitations; no endpoint ranking |
| R6.9 | measurement source | Data on the Trajectory of AI | Epoch AI | living data index | [Data index](https://epoch.ai/data) | null | official documentation | 2026-09-20 | Preserve estimated versus measured field status |
| R6.10 | measurement source | AI Benchmarks & Capabilities | Epoch AI | living benchmarking hub | [Benchmarking hub](https://epoch.ai/benchmarks) | null | official documentation | 2026-09-20 | Internally versus externally administered protocols; repeated evaluation and displayed standard errors |
| R6.11 | measurement source | LMArena leaderboards | LMArena | current page not retrievable | [Listed surface](https://lmarena.ai/leaderboard) | null | UNVERIFIED | null | Current layout/interval display could not be revalidated; use P51 for the published protocol |
| R6.12 | documentation | Candidate platform disclosure about pre-release testing | LMArena | exact source unresolved | null | null | UNVERIFIED | null | Earlier draft's March 2024 disclosure attribution could not be revalidated; it is not used as established evidence |
| R6.13 | documentation | Open LLM Leaderboard — About | Hugging Face | living documentation | [About](https://huggingface.co/docs/leaderboards/open_llm_leaderboard/about) | [Harness fork linked by the page](https://github.com/huggingface/lm-evaluation-harness) | official documentation | 2026-09-20 | Six-task protocol, template flags, batch-size caveat and gated GPQA handling; operating status of the Space remains UNVERIFIED |
| R6.14 | paper | Do ImageNet Classifiers Generalize to ImageNet? | Benjamin Recht et al. | arXiv, 2019 | [Primary record](https://arxiv.org/abs/1902.10811) | null | preprint | 2026-09-20 | Fresh-test-set difficulty and ranking stability; no universal conclusion about language benchmarks |
| R6.15 | paper | Generalization in Adaptive Data Analysis and Holdout Reuse | Cynthia Dwork et al. | arXiv, 2015 | [Primary record](https://arxiv.org/abs/1506.02629) | null | preprint | 2026-09-20 | Adaptive holdout reuse requires explicit mechanisms and assumptions |
| R6.16 | paper | The Ladder: A Reliable Leaderboard for Machine Learning Competitions | Avrim Blum and Moritz Hardt | arXiv, 2015 | [Primary record](https://arxiv.org/abs/1502.04585) | null | preprint | 2026-09-20 | Controlled leaderboard disclosure under adaptivity |
| R6.17 | paper | Leakage and the Reproducibility Crisis in ML-based Science | Sayash Kapoor and Arvind Narayanan | arXiv, 2022 | [Primary record](https://arxiv.org/abs/2207.07048) | null | preprint | 2026-09-20 | Leakage taxonomy and methodological motivation |
| R6.18 | paper | Stop Uploading Test Data in Plain Text: Practical Strategies for Mitigating Data Contamination by Evaluation Benchmarks | Alon Jacovi et al. | EMNLP, 2023, as stated on the primary record | [Primary record](https://arxiv.org/abs/2305.10160) | null | peer-reviewed | 2026-09-20 | Proposed publication and benchmark-contamination controls; no guarantee of exclusion |
| R6.19 | paper | Mind the Gap: Assessing Temporal Generalization in Neural Language Models | Angeliki Lazaridou et al. | NeurIPS, 2021, as stated on the primary record | [Primary record](https://arxiv.org/abs/2102.01951) | null | peer-reviewed | 2026-09-20 | Temporal generalisation and future-data evaluation |
| R6.20 | paper | LiveBench: A Challenging, Contamination-Limited LLM Benchmark | Colin White et al. | ICLR, 2025, as stated on the primary record | [Primary record](https://arxiv.org/abs/2406.19314) | null | peer-reviewed | 2026-09-20 | Refreshing recent questions and objective scoring; current update cadence not audited |
| R6.21 | paper | Language Models are Few-Shot Learners | Tom B. Brown et al.; OpenAI | arXiv, 2020 | [Primary record](https://arxiv.org/abs/2005.14165) | null | preprint | 2026-09-20 | Historical disclosure of web-training evaluation contamination issues |
| R6.22 | paper | Quantifying Language Models' Sensitivity to Spurious Features in Prompt Design or: How I learned to start worrying about prompt formatting | Melanie Sclar et al. | ICLR, 2024, as stated on the primary record | [Primary record](https://arxiv.org/abs/2310.11324) | null | peer-reviewed | 2026-09-20 | Meaning-preserving formatting can change evaluation outcomes |
| R6.24 | paper | Show Your Work: Improved Reporting of Experimental Results | Jesse Dodge et al. | arXiv, 2019 | [Primary record](https://arxiv.org/abs/1909.03004) | null | preprint | 2026-09-20 | Tuning budget and performance reporting |
| R6.25 | paper | Accounting for Variance in Machine Learning Benchmarks | Xavier Bouthillier et al. | arXiv, 2021 | [Primary record](https://arxiv.org/abs/2103.03098) | null | preprint | 2026-09-20 | Variability across data, initialisation, and hyperparameter selection |
| R6.26 | paper | With Little Power Comes Great Responsibility | Dallas Card et al. | EMNLP, 2020 | [Archival paper record](https://aclanthology.org/2020.emnlp-main.745/) | null | peer-reviewed | 2026-09-20 | Statistical power and experimental design in NLP |
| R6.28 | paper | MLPerf Inference Benchmark | Vijay Janapa Reddi et al. | arXiv, 2019 | [Primary record](https://arxiv.org/abs/1911.02549) | null | preprint | 2026-09-20 | Complete hardware/software system as benchmark unit; named inference scenarios |
| R6.29 | paper | Scaling Data-Constrained Language Models | Niklas Muennighoff et al. | arXiv, 2023 | [Primary record](https://arxiv.org/abs/2305.16264) | null | preprint | 2026-09-20 | Repeated-data scaling as a possible filter-by-budget confound |
| R6.30 | paper | The preregistration revolution | Brian A. Nosek, Charles R. Ebersole, Alexander C. DeHaven, David T. Mellor | PNAS, 2018 | [Published article](https://www.pnas.org/doi/10.1073/pnas.1708274114) | null | peer-reviewed | 2026-09-20 | Prediction/postdiction distinction; preregistered analysis |
| R6.31 | paper | A Careful Examination of Large Language Model Performance on Grade School Arithmetic | Hugh Zhang et al. | arXiv, 2024 | [Primary record](https://arxiv.org/abs/2405.00332) | null | preprint | 2026-09-20 | GSM1k replication and model-dependent gaps; not a universal estimate of contamination |
| R6.32 | paper | The Leaderboard Illusion | Shivalika Singh et al. | arXiv, 2025 | [Primary record](https://arxiv.org/abs/2504.20879) | null | preprint | 2026-09-20 | Authors' reported private-testing and selective-disclosure concerns; not independently reproduced or adjudicated here |
| R6.33 | documentation | Reproducibility | vLLM | moving stable documentation | [Documentation](https://docs.vllm.ai/en/stable/usage/reproducibility/) | null | official documentation | 2026-09-20 | No default reproducibility guarantee; documented modes and same-hardware/same-version boundary |
| R6.34 | documentation | vllm bench serve | vLLM | moving stable documentation | [CLI reference](https://docs.vllm.ai/en/stable/cli/bench/serve/) | null | official documentation | 2026-09-20 | Percentile metrics and time-based goodput arguments; no correctness guarantee |
| R6.35 | documentation | Deterministic Inference | SGLang | living documentation | [Documentation](https://docs.sglang.io/docs/advanced_features/deterministic_inference) | null | official documentation | 2026-09-20 | Batch/reduction-order sensitivity, deterministic-inference option and backend restrictions |
| R6.36 | documentation | Chat templates | Hugging Face Transformers | living documentation; release pin UNVERIFIED | [Documentation](https://huggingface.co/docs/transformers/chat_templating) | null | official documentation | 2026-09-20 | Control tokens, template application, duplicated special-token warning |

Keys R6.23 and R6.27 are intentionally unassigned; no text depends on them. Existing keys remain stable during continuation.

## Inspection boundaries

- **PAPER-REPORTED.** P07 §6 says that dimensions could be ablated individually, while broader joint/scale exploration and run-to-run variation were limited. The earlier draft's reversal of “could only” into “could not” has been corrected. Appendix R reports aggregate training costs; it does not provide the per-arm incremental curation ledger required by the proposed total-resource comparison.
- **UNVERIFIED.** R6.11 and R6.12 could not be retrieved and confirmed in this continuation. Their claims are downgraded in the manuscript. Reachability failure is not evidence that the platform no longer exists or that a historical disclosure was false.
- **OFFICIAL-DOCUMENTATION.** R6.13 was recovered through the official documentation, rather than the unsuccessful candidate Space file URL. R6.35 redirected from the older documentation path to the URL recorded above.
- **UNVERIFIED.** The previous draft's exact Transformers documentation version and vLLM page-date pin were not established by the newly opened pages. They have been replaced by explicit moving-documentation boundaries. No engine commit was inspected or benchmark executed.
- **PAPER-REPORTED.** Research reports motivate the design; the chapter's own variance models, numeric examples, data splits, budget top-ups, and acceptance rules remain derivations or declared assumptions. None is presented as a reproduced result.

## Source routing

P07 and P50 are Chapter 06's explicit `book_plan.md` anchors. P06, P09, P38, and P51 are additional Appendix D spine entries. Other methodology papers were reached through the reference stack's arXiv/proceedings cascade; R6.26 was opened in ACL Anthology and R6.30 on the publisher's primary article page. LM Evaluation Harness and HELM are permitted by the plan's Appendix B evaluation-tool route despite not being §4 stack entries. R6.1 is tied to Anthropic through the paper and R6.6; framework and engine claims use official project documentation. The chapter page records exact stack names, ranks, layers, and inspection dimensions.
