---
id: ms.references.23
entity_type: references
title: References — Parameter-efficient adaptation and model composition
short_title: References 23
volume: 1
part: 4
chapter: 23
section: null
slug: references
parent: ms.chapter.23
prev_sibling: ms.verification.23
next_sibling: null
children: []
prerequisites: [ms.chapter.13, ms.chapter.19, ms.chapter.20, ms.chapter.21, ms.chapter.22]
downstream: [ms.chapter.24, ms.chapter.40, ms.chapter.44]
related: []
relations: []
axes: {lifecycle: [adaptation, evaluation, serving], mechanism: [parameter_efficient_adaptation], feedback_setting: [], modality: [text, image]}
papers: [P14, P15]
implementations: [impl.hugging-face-peft, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1500
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# References — Chapter 23

Primary methods/results were inspected on **2026-10-08**, with the dated successor search and version follow-up on **2026-10-09**. Access records describe reading, not execution. An archival venue and an inspected revision are separate fields: a conference paper retrieved through an unpinned arXiv URL is explicitly unpinned unless its PDF identifies the revision. Documentation versions are namespaces, not installed-runtime checks.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P14 | paper | LoRA: Low-Rank Adaptation of Large Language Models | Edward J. Hu et al.; Microsoft and collaborators | ICLR 2022; fetched PDF revision unpinned | [Full PDF](https://arxiv.org/pdf/2106.09685); [first-party publication route](https://www.microsoft.com/en-us/research/?p=759361) | null | peer-reviewed | 2026-10-08 | §4.1 Eq. 3, §4.2, §5–7; factors, initialization, targets, merge and original comparisons |
| P15 | paper | QLoRA: Efficient Finetuning of Quantized LLMs | Tim Dettmers, Artidoro Pagnoni, Ari Holtzman, Luke Zettlemoyer | NeurIPS 2023 archival proceedings | [Archival NeurIPS PDF](https://proceedings.neurips.cc/paper_files/paper/2023/file/1feb87871436031bdc0f2beaa62a049b-Paper-Conference.pdf) | null | peer-reviewed | 2026-10-08 | §3 Eq. 4–6, §4 Tables 2–3, §5, §7; storage/compute, comparisons and disclosed limits |
| R23.1 | paper | Parameter-Efficient Transfer Learning for NLP | Neil Houlsby et al. | ICML 2019, PMLR 97 | [Archival ICML PDF](https://proceedings.mlr.press/v97/houlsby19a/houlsby19a.pdf) | null | peer-reviewed | 2026-10-08 | §2.1 Fig. 2; §3.1, §3.6; bottleneck placement, trained extras and transfer protocol |
| R23.2 | paper | The Power of Scale for Parameter-Efficient Prompt Tuning | Brian Lester, Rami Al-Rfou, Noah Constant | EMNLP 2021 | [Archival EMNLP PDF](https://aclanthology.org/2021.emnlp-main.243.pdf) | null | peer-reviewed | 2026-10-08 | §2–3, Fig. 1, §5; input prompts, scale study, repeated runs and transfer |
| R23.3 | paper | Prefix-Tuning: Optimizing Continuous Prompts for Generation | Xiang Lisa Li, Percy Liang | ACL-IJCNLP 2021 | [Archival ACL PDF](https://aclanthology.org/2021.acl-long.353.pdf) | null | peer-reviewed | 2026-10-08 | §3–4, §5–7; layer prefixes, reparameterization, GPT-2/BART evaluations |
| R23.4 | paper | BitFit: Simple Parameter-efficient Fine-tuning for Transformer-based Masked Language-models | Elad Ben Zaken, Yoav Goldberg, Shauli Ravfogel | ACL 2022 | [Archival ACL PDF](https://aclanthology.org/2022.acl-short.1.pdf) | null | peer-reviewed | 2026-10-08 | §3–4, Tables 1–3; bias selection, task head, masked-LM comparison |
| R23.5 | documentation | PEFT LoRA API | Hugging Face contributors | Official docs, v0.21.0 namespace | [Versioned API](https://huggingface.co/docs/peft/v0.21.0/package_reference/lora) | null | official documentation | 2026-10-08 | LoraConfig; add_weighted_adapter; merge_and_unload |
| R23.6 | paper | A Rank Stabilization Scaling Factor for Fine-Tuning with LoRA | Damjan Kalajdzievski | arXiv:2312.03732v1, 2023-11-28 | [Full PDF](https://arxiv.org/pdf/2312.03732) | null | preprint | 2026-10-08 | §3 Definition 3.1/Theorem 3.2; §4; rank asymptotics and scaling |
| R23.7 | paper | LoRA+: Efficient Low Rank Adaptation of Large Models | Soufiane Hayou, Nikhil Ghosh, Bin Yu | ICML 2024; PDF identifies arXiv v2, 2024-07-04 | [Full PDF](https://arxiv.org/pdf/2402.12354); [archival identity](https://proceedings.mlr.press/v235/hayou24a.html) | null | peer-reviewed | 2026-10-08; revision follow-up 2026-10-09 | §3–5, Algorithm 1; factor learning rates and comparison |
| R23.8 | paper | DoRA: Weight-Decomposed Low-Rank Adaptation | Shih-Yang Liu et al. | ICML 2024; inspected arXiv PDF unpinned | [Full PDF](https://arxiv.org/pdf/2402.09353); [archival identity](https://proceedings.mlr.press/v235/liu24bn.html) | null | peer-reviewed | 2026-10-08 | §3–5 Eq. 5–7; magnitude/direction, normalization and evaluation |
| R23.9 | documentation | PEFT checkpoint format | Hugging Face contributors | Official docs, v0.21.0 namespace | [Versioned guide](https://huggingface.co/docs/peft/v0.21.0/developer_guides/checkpoint) | null | official documentation | 2026-10-08 | “PEFT files”, “Adapter weights”; saved task state versus base and restart |
| R23.10 | paper | LoftQ: LoRA-Fine-Tuning-Aware Quantization for Large Language Models | Yixiao Li et al. | ICLR 2024; inspected PDF unpinned | [Full PDF](https://arxiv.org/pdf/2310.08659) | null | peer-reviewed | 2026-10-08 | §3 Algorithm 1, §4 Tables 1–4; alternating quantization/residual factorization |
| R23.11 | paper | Editing Models with Task Arithmetic | Gabriel Ilharco et al. | ICLR 2023; inspected PDF unpinned | [Full PDF](https://arxiv.org/pdf/2212.04089) | null | peer-reviewed | 2026-10-08 | §2–5, Appendix D; common-base deltas and task/control evaluation |
| R23.12 | paper | TIES-Merging: Resolving Interference When Merging Models | Prateek Yadav et al. | NeurIPS 2023; inspected PDF unpinned | [Full PDF](https://arxiv.org/pdf/2306.01708) | null | peer-reviewed | 2026-10-08 | §4.2 Algorithm 1, §6–7 Tables 1–2, 6; trim/elect/disjoint mean and ablations |
| R23.13 | paper | Language Models are Super Mario: Absorb Abilities from Homologous Models as a Free Lunch | Le Yu et al. | ICML 2024; inspected arXiv v3 | [Versioned full HTML](https://arxiv.org/html/2311.03099v3) | null | peer-reviewed | 2026-10-08 | §3 Eq. 1, §4.2–4.7; DARE, combinations, base-mismatch failure |
| R23.14 | paper | Punica: Multi-Tenant LoRA Serving | Le Chen et al. | MLSys 2024; inspected PDF unpinned | [Full PDF](https://arxiv.org/pdf/2310.18547) | null | peer-reviewed | 2026-10-08 | §4–5, §7; segmented correction kernels and workload protocol |
| R23.15 | paper | S-LoRA: Serving Thousands of Concurrent LoRA Adapters | Ying Sheng et al. | MLSys 2024; inspected PDF unpinned | [Full PDF](https://arxiv.org/pdf/2311.03285) | null | peer-reviewed | 2026-10-08 | §5, §7 Table 1/Fig. 9; unified paging, heterogeneous ranks and serving evaluation |
| R23.16 | paper | RandLoRA: Full-Rank Parameter-Efficient Fine-Tuning of Large Models | Paul Albert et al. | ICLR 2025 archival proceedings | [Archival main PDF](https://proceedings.iclr.cc/paper_files/paper/2025/file/382b95a6580cfb0b5ca33c74b4e0e770-Paper-Conference.pdf); [archival supplement](https://proceedings.iclr.cc/paper_files/paper/2025/file/382b95a6580cfb0b5ca33c74b4e0e770-Supplemental-Conference.pdf) | null | peer-reviewed | 2026-10-08; follow-up 2026-10-09 | §4 Eq. 3–4, §5; supplement B.1/C.6.1 Table 10; frozen bases, coefficients and comparison boundaries |
| R23.17 | paper | Activated LoRA: Fine-tuned LLMs for Intrinsics | Kristjan Greenewald et al.; IBM Research | Inspected arXiv v3, 2025-05-23; NeurIPS 2025 publication independently identified by IBM record | [Versioned full HTML](https://arxiv.org/html/2504.12397v3); [IBM publication record](https://research.ibm.com/publications/activated-lora-fine-tuned-llms-for-intrinsics) | null | peer-reviewed | 2026-10-08; identity follow-up 2026-10-09 | §2 Eq. 6/Proposition 1, §3–4, Appendix E–G; activation/cache boundary and learned-task evaluation |
| R23.18 | paper | Efficient Multi-Adapter LLM Serving via Cross-Model KV-Cache Reuse with Activated LoRA | Allison Li, Kristjan Greenewald, Thomas Parnell, Navid Azizan | arXiv v1; fetched HTML header states 2025-11-26 | [Versioned full HTML](https://arxiv.org/html/2512.17910v1) | null | preprint | 2026-10-08 | §3–5, Appendix A–B; hashing, masking, disclosed runtime, timing boundary and future work |
| R23.19 | documentation | vLLM LoRA adapters | vLLM contributors | Mutable latest page; exact revision UNVERIFIED | [Official feature guide](https://docs.vllm.ai/en/latest/features/lora/) | null | official documentation | 2026-10-08 | Per-request selection; maximum adapters/rank; artifact/version interfaces |
| R23.20 | paper | LoRA Learns Less and Forgets Less | Dan Biderman et al.; Databricks Mosaic Research and Columbia | TMLR, August 2024; PDF identifies arXiv v2, 2024-09-20 | [Full PDF](https://arxiv.org/pdf/2405.09673) | null | peer-reviewed | 2026-10-08; revision follow-up 2026-10-09 | §3–4, Appendix A; controlled exposure, tuning, target and retention metrics |
| R23.21 | paper | LoRA vs Full Fine-tuning: An Illusion of Equivalence | Reece Shuttleworth, Jacob Andreas, Antonio Torralba, Pratyusha Sharma; MIT CSAIL | NeurIPS 2025; PDF identifies arXiv v3, 2025-10-22 | [Full PDF](https://arxiv.org/pdf/2410.21228) | null | peer-reviewed | 2026-10-08; revision follow-up 2026-10-09 | Definition 3.1/Algorithm 1, §3–5, Appendix B/G/N; spectra, intervention and generalization |

## P14

**PAPER-REPORTED.** The inspected full method fixes factor shapes, Gaussian/zero initialization and $\alpha/r$ scaling; source experiments and rank/target ablations are read from §5–7 rather than from the abstract. The first-party Microsoft route identifies the work. **UNVERIFIED.** The unversioned PDF's precise arXiv revision was not established in the retained initial inspection; no source-code or training execution is asserted.

## P15

**PAPER-REPORTED.** The stable NeurIPS paper supplies NF4, nested scale quantization, BF16 computation, paging and comparison protocols. §7 explicitly limits claims about large-model full-fine-tuning controls. The chapter's byte-count examples are analytical reconstructions with stated block sizes, not the paper's measured peak-memory totals.

## R23.1

**PAPER-REPORTED.** §2.1 fixes adapter placement and additional trained task variables. §3 states models/tasks, hyperparameter search and repeated runs. The chapter's one-module count excludes layer normalization and heads until added explicitly.

## R23.2

**PAPER-REPORTED.** §2 defines prepended learned embeddings and frozen T5. §3/Fig. 1 compare scale with repeated runs; §5 supplies shifted-domain evidence. The source does not establish universal prompt equivalence for arbitrary architectures or tasks.

## R23.3

**PAPER-REPORTED.** §4 distinguishes layer activation prefixes from their training-time reparameterization. §5–7 disclose GPT-2 table-to-text and BART summarization protocols, including lower-data and topic shifts. The chapter's direct KV count is a decoder-attention reconstruction; source variants have different interfaces.

## R23.4

**PAPER-REPORTED.** §3 selects biases and the task head; §4 evaluates masked-LM transfer. Bias-only adaptation is not attributed to every modern decoder or to unchanged head state.

## R23.5

**OFFICIAL-DOCUMENTATION.** The requested LoRA developer route resolved to the v0.21.0 API namespace. Inspected fields include targets, rank/alpha patterns, extra saved modules, rsLoRA, DoRA and initializers; inspected operations include weighted composition and merge. **UNVERIFIED.** No installed PEFT version or supported model/backend combination was checked by execution.

## R23.6

**PAPER-REPORTED.** The PDF explicitly identifies v1. Definition 3.1 and Theorem 3.2 impose a rank-asymptotic setting, including initialization/scaling assumptions. §4 tests finite-rank Llama-2 adaptation. The theorem is not a finite-sample quality guarantee.

## R23.7

**PAPER-REPORTED.** §3–4/Algorithm 1 distinguish factor learning rates under width/optimization assumptions; §5 supplies empirical comparisons. The archival identity page was inspected; the complete PDF identifies arXiv v2, 2024-07-04. **UNVERIFIED.** Local optimizer behavior remains unchecked.

## R23.8

**PAPER-REPORTED.** §4 Eq. 5–7 specify magnitude/direction and initialization; the efficiency discussion states detached norm handling. §5 covers language and vision-language settings. The method was read in an unpinned PDF; transposed book notation is explicitly a reconstruction.

## R23.9

**OFFICIAL-DOCUMENTATION.** The guide lists adapter tensor/config/model-card files and separates base weights. It does not turn adapter-only export into an optimizer/RNG/data-cursor restart. Namespace v0.21.0 is recorded without claiming executable parity.

## R23.10

**PAPER-REPORTED.** §3 Algorithm 1 alternates quantization with a residual low-rank approximation; §4 tests several tasks/bit widths. The inspected PDF prints ICLR 2024, but its precise arXiv revision remains **UNVERIFIED**.

## R23.11

**PAPER-REPORTED.** Common-reference task differences, validation-selected scales, task combination/negation and controls are read in §2–5/Appendix D. Reduced task performance after negation is not certified unlearning. Exact inspected PDF revision is **UNVERIFIED**.

## R23.12

**PAPER-REPORTED.** §4.2 Algorithm 1 defines the trim/elect/disjoint operator; §6–7 report T5/T0/CLIP comparisons and ablations. The book adds an explicit deterministic zero/tie policy. Exact inspected PDF revision is **UNVERIFIED**.

## R23.13

**PAPER-REPORTED.** Version v3 is fixed in the URL. §3 defines dropping/rescaling; §4.2–4.7 test drop rates, alternative combinations and incorrect-base failures. Unbiased coordinates do not establish unbiased nonlinear model outputs.

## R23.14

**PAPER-REPORTED.** §4–5 describe segmented adapter operators and scheduling. §7 uses random task weights for performance, disclosed A100 testbeds, workload lengths/popularity and historical software baselines. Those comparisons are not a current-vLLM feature audit. Exact inspected PDF revision is **UNVERIFIED**.

## R23.15

**PAPER-REPORTED.** §5 describes unified paging and distributed state; §7 supplies ranks, devices, arrivals and paging/merging comparisons. The large-model evaluation includes disclosed architectural adjustments. Neither historical merged/unmerged crossover nor random adapters establishes a present deployment threshold. Exact inspected PDF revision is **UNVERIFIED**.

## R23.16

**PAPER-REPORTED.** Main §4 Eq. 3–4 specify frozen random factors and trainable diagonal coefficients; §5 and supplement B/C disclose vision/language comparisons, repetitions and cost. Full-rank representability requires the stated basis conditions. The language cost table does not contain a full-fine-tuning Llama-3 control.

## R23.17

**PAPER-REPORTED.** The inspected v3 gives the causal cache argument and training convention; §4 and Appendix F/G disclose learned-task evaluations. IBM's later publication record establishes NeurIPS 2025 identity without making the earlier inspected v3 an archival proceedings revision. The chapter does not reuse promotional speed claims.

## R23.18

**PAPER-REPORTED.** v1 describes base-aligned hashes and execution masks, BF16/H100 configurations, random adapters, different conventional/activated ranks and context/arrival sweeps. The evaluation timing boundary is the adapter stage. Its header date is recorded as served, rather than inferred from the arXiv identifier's month.

## R23.19

**OFFICIAL-DOCUMENTATION.** The latest feature guide was read for operational API semantics. **UNVERIFIED.** No revision identifier or installed-runtime validation was established. Source-study runtimes are separately disclosed in their papers and must not inherit this page's current capabilities.

## R23.20

**PAPER-REPORTED.** The PDF explicitly identifies v2 and TMLR publication. §3 fixes token budgets, training data, generation protocols and retention metrics; §4/Appendix A supply learning-rate/rank/target comparisons. Its code/math settings do not establish universal adaptation behavior.

## R23.21

**PAPER-REPORTED.** The PDF explicitly identifies v3 and NeurIPS 2025. Full method/results include singular-vector diagnostics, matched-performance analyses, intervention controls and repeated-seed analysis. The manuscript's absolute-cosine formula states the sign-invariant convention; no out-of-span interpretation is made.

## Dated frontier search

**UNVERIFIED.** The 2026-10-08 initial search and 2026-10-09 follow-up covered lab disclosures, 2025 proceedings and 2026 adaptation/composition discovery. Follow-up queries included “site:research.ibm.com/publications Activated LoRA”, “site:proceedings.iclr.cc RandLoRA 2025”, “site:proceedings.mlr.press 2026 LoRA”, and “site:arxiv.org 2026 adapter model merging”. RandLoRA and aLoRA receive full reconstruction because their primary methods/results were opened. Search-only 2026 leads, including CT-Merging and speech timestamp adaptation, are not taught as established mechanisms or benchmark leaders. This is a dated selection, not an exhaustive frontier survey.
