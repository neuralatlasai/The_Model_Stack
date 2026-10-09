---
id: ms.references.31
entity_type: references
title: References — Supervised fine-tuning
short_title: References — Supervised fine-tuning
volume: 2
part: 6
chapter: 31
section: null
slug: references
parent: ms.chapter.31
prev_sibling: ms.verification.31
next_sibling: null
children: []
prerequisites:
- ms.chapter.10
- ms.chapter.11
- ms.chapter.12
- ms.chapter.19
- ms.chapter.20
- ms.chapter.21
- ms.chapter.22
- ms.chapter.23
- ms.chapter.24
- ms.chapter.30
downstream:
- ms.chapter.32
- ms.chapter.33
- ms.chapter.34
- ms.chapter.35
- ms.chapter.36
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - supervised_fine_tuning
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.hugging-face-trl
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1400
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# References — Chapter 31

[DERIVED] Every primary surface below was actually inspected on **2026-10-09** before the related claims were drafted. First-publication eligibility is **2025-12-01 through 2026-10-09**. All ten admitted evidence records originate in **2026 (100%)**; versioned software is a 2026 release artifact, not a claim that SFT or the API concepts were invented in 2026. Submission history and archival identity are distinguished from the full-text revision inspected. These records do not assert executed reproductions.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R31.1 | repository | Hugging Face TRL v1.13.0 | Hugging Face TRL contributors | Release 2026-09-10; tag v1.13.0, short commit 3d9261f | [Inspected primary text](https://github.com/huggingface/trl/releases/tag/v1.13.0) | [Originating repository](https://raw.githubusercontent.com/huggingface/trl/v1.13.0/trl/trainer/sft_trainer.py) | official documentation | 2026-10-09 | Tagged docs Train on assistant messages only / Train on completion only; tagged trainer _prepare_dataset and DataCollatorForLanguageModeling; release Chunked-CE and Training beyond 1M tokens |
| R31.2 | paper | Probability-Entropy Calibration: An Elastic Indicator for Adaptive Fine-tuning | Wenhao Yu, Shaohang Wei, Jiahong Liu, Yifan Li, Minda Hu, Aiwei Liu, Hao Zhang, Irwin King | First 2026-02-02; inspected arXiv:2602.01745v1; ICML 2026 archival identity verified | [Inspected primary text](https://arxiv.org/html/2602.01745v1) | null | peer-reviewed | 2026-10-09 | Sections 4.1–4.5, equations 1–11, 5.1, Table 2, Appendices B.1/B.6; v1 method is the inspected version, not an asserted match to archival PDF |
| R31.3 | paper | Less Data, Faster Convergence: Goal-Driven Data Optimization for Multimodal Instruction Tuning | Rujie Wu, Haozhe Zhao, Hai Ci, Yizhou Wang | First 2026-03-12; arXiv:2603.12478v1 | [Inspected primary text](https://arxiv.org/html/2603.12478v1) | null | preprint | 2026-10-09 | Sections 2.1–2.4 subset/descriptor/feasibility method; 3.1–3.5 experimental protocol and ablations; Table 1; Appendix D limitations |
| R31.4 | paper | TopoCurate: Modeling Interaction Topology for Tool-Use Agent Training | Jinluan Yang, Yuxin Liu, Zhengyu Chen, Chengcheng Han, Yueqing Sun, Qi Gu, Hui Su, Xunliang Cai, Fei Wu, Kun Kuang | First 2026-03-02; arXiv:2603.01714v1; under review stated by authors | [Inspected primary text](https://arxiv.org/html/2603.01714v1) | null | preprint | 2026-10-09 | Sections 3.1–3.2, 4.2 Eq.3 similarity predicate, 4.3 Eqs.4–7 trajectory scoring, 5.1–5.4, Appendix C.1–C.2; transitivity qualification derived independently |
| R31.5 | paper | Can Agents Generalize to the Open World? Unveiling the Fragility of Static Training in Tool Use | Song-Lin Lv, Weiming Wu, Rui Zhu, Zi-Jian Cheng, Lan-Zhe Guo | First 2026-07-01; arXiv:2607.01084v1; ICML 2026 acceptance stated by authors | [Inspected primary text](https://arxiv.org/html/2607.01084v1) | null | preprint | 2026-10-09 | Sections 3.1–3.2 interaction/shift setup; 4.2–4.5 tier perturbations; 5 observations; 6 PAFT; Appendices C–D exact setup and results |
| R31.6 | paper | Post-Training Science for Supervised Fine-Tuning | Charles O’Neill, Mudith Jayasekara, Harry Partridge | First 2026-09-01; arXiv:2609.01244v1 | [Inspected primary text](https://arxiv.org/html/2609.01244v1) | null | preprint | 2026-10-09 | Sections 2.1–2.7 LR/batch experiment and selection; 3 rank/alpha; 4 metric comparison; 7 epoch sweep; Appendices A–D costs, data and retention |
| R31.7 | paper | Data Repetition Beats Data Scaling in Long-CoT Supervised Fine-Tuning | Dawid J. Kopiczko, Sagar Vaze, Tijmen Blankevoort, Yuki M. Asano | First 2026-02-11; arXiv:2602.11149v1 | [Inspected primary text](https://arxiv.org/html/2602.11149v1) | [Originating repository](https://github.com/dkopi/data-repetition) | preprint | 2026-10-09 | Sections 2.1–2.3 fixed update budget and batch-one protocol; 3 teacher/negative traces; 4 memorization/termination/forgetting; Appendices A–B |
| R31.8 | paper | Fine-Tuning Without Forgetting via Loss-Adaptive Learning Rates | Parjanya Prajakta Prashant, Jiongli Zhu, Aldan Creo, Babak Salimi | First 2026-05-19; arXiv:2605.20005v1 | [Inspected primary text](https://arxiv.org/html/2605.20005v1) | null | preprint | 2026-10-09 | Sections 3.1–3.3 theorem conditions, SGD derivation and capped EMA schedule; 4 adaptation/retention experiments; 5.3 calibration; Appendix A proof |
| R31.9 | paper | Balancing Classification and Calibration Performance in Decision-Making LLMs via Calibration Aware Reinforcement Learning | Duygu Nur Yaldiz, Evangelia Spiliopoulou, Zheng Qi, Siddharth Varia, Srikanth Doss, Nikolaos Pappas | First 2026-01-19; arXiv:2601.13284v1 | [Inspected primary text](https://arxiv.org/html/2601.13284v1) | null | preprint | 2026-10-09 | Section 2 decision-token confidence/equal-count bins; 3.1–3.3 SFT/GRPO protocol, Table 1; 4 reasoning-swap diagnosis; Appendix B experimental details |
| R31.10 | paper | The Magic Correlations: Understanding Knowledge Transfer from Pretraining to Supervised Fine-Tuning | Simin Fan, Dimitris Paparas, Natasha Noy, Binbin Xiong, Noveen Sachdeva, Berivan Isik | First 2026-02-11; arXiv:2602.11217v1 | [Inspected primary text](https://arxiv.org/html/2602.11217v1) | null | preprint | 2026-10-09 | Sections 3 protocols, 4.1–4.4 accuracy/confidence/calibration correlation; Appendix A scope, B.1–B.4 architectures/hyperparameters/data/evaluation and C results |

## Primary surfaces and identity checks

[OFFICIAL-DOCUMENTATION] R31.1 is pinned to its [release](https://github.com/huggingface/trl/releases/tag/v1.13.0), [tagged SFT documentation](https://raw.githubusercontent.com/huggingface/trl/v1.13.0/docs/source/sft_trainer.md) and [tagged implementation](https://raw.githubusercontent.com/huggingface/trl/v1.13.0/trl/trainer/sft_trainer.py). Claims are attributed as documentation; no executable CODE-VERIFIED status is asserted. The short release commit is the identifier shown by the originating release page; a full environment lock remains an execution requirement.

[OFFICIAL-DOCUMENTATION] R31.2's [ICML proceedings identity](https://proceedings.mlr.press/v306/yu26bc.html) is verified separately. The archival PDF request failed during this inspection, so detailed equations are attributed to the inspected v1 full text. Its [submission history](https://arxiv.org/abs/2602.01745) reports first submission 2026-02-02 and v2 2026-05-27; the v2 date does not replace the original date. R31.5's venue acceptance is author-reported, not independently converted into archival publication status.

[DERIVED] The remaining versioned full-text headers show the original submission dates. Source authors' use of older models, datasets or cited theories is described only as part of the eligible 2026 experiment; no pre-window artifact is admitted as independent factual evidence. Model internals, historical mechanisms and unsupported current capabilities are not filled from the bibliography of a newer paper.

## Evidence gaps and exclusions

| Candidate or unresolved field | Status | Consequence |
|---|---|---|
| InstructGPT, arXiv:2203.02155, the plan's historical anchor | Excluded: first publication before cutoff | No factual claims or results imported; conditional likelihood is derived explicitly |
| Older DFT, LoRA, generic SFT tutorials and earlier model reports | Excluded as standalone evidence | Canonical parameterization links point to book ownership; no old result relabeled by a current access date |
| TRL stable rendered documentation endpoint for v1.13.0 | UNVERIFIED access: tool returned internal error | Tagged raw documentation and implementation are the inspected surfaces |
| RankTuner archival PDF | UNVERIFIED access: request failed | v1 equations retained with exact revision; no claim of archival equivalence |
| TopoCurate similarity relation's transitivity | MATHEMATICALLY-DERIVED counterexample class | Threshold similarity alone does not define a quotient; merge/closure policy must be specified |
| TopoCurate released code/data, OpenAgent repository execution | UNVERIFIED | Availability announcements do not establish runnable reproduction |
| Production model training masks, hidden data mixtures and undisclosed hyperparameters | NOT-DISCLOSED | No defaults inferred from a lab name or model brand |
| Independent book GPU training, joules, dollar cost or measured latency | UNVERIFIED / unexecuted | Verification remains a proposed protocol |
| Anonymous customer data and proprietary evaluators in R31.6 | NOT-DISCLOSED for full public reconstruction | Results restricted to the source's testbed; no universal hyperparameter rule |

## Source route and interpretation

[DERIVED] Discovery followed reference-stack §3 arXiv and §2 ICML / §3 PMLR, then exact originating methods, experiment sections, appendices and tagged code. Search results, summaries, lab reputation and venue labels were not used as mechanism evidence. Concrete queries included `site:arxiv.org 2026 supervised fine tuning loss masking instruction tuning data packing`, `2026 supervised fine-tuning calibration arxiv`, and `site:proceedings.mlr.press 2026 Probability-Entropy Calibration`. The proceedings route verifies venue identity; a paper's actual evidence is its disclosed comparison protocol. All formula-driven chapter visuals are original derivations or declared analytical examples, with no copied benchmark curves.
