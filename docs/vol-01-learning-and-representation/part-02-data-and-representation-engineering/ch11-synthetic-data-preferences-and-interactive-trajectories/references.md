---
id: ms.references.11
entity_type: references
title: "References — Chapter 11"
volume: 1
part: 2
chapter: 11
section: null
slug: references
parent: ms.chapter.11
prev_sibling: ms.verification.11
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [data, evaluation], mechanism: [data_provenance, controlled_comparison], feedback_setting: [], modality: [text]}
papers: [P22, P26, P29, P42, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# References — Chapter 11

This ledger restores the historical sources already cited in §§11.1–11.5 and records the current research newly introduced in §11.6. Historical work retains its actual first-public date and is not presented as a 2026 release. New §11.6 research first appeared between 2026-03-01 and 2026-10-24; unversioned arXiv histories were checked on 2026-10-25 and all four new research texts were still v1. Access dates describe source inspection, never model execution. Earlier sections retain their separately dated historical inspection accounts.

R11.1/R11.22 identify one study; P29/R11.21 describe one project. Moving documentation and repository URLs are explicitly weaker reproducibility surfaces than full commit pins. A versioned documentation namespace does not establish its first-public release date. No benchmark, training or generation result was reproduced for this book.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P22 | paper | Constitutional AI: Harmlessness from AI Feedback | Yuntao Bai et al. | arXiv 2022; first 2022-12-15; v1 | https://arxiv.org/abs/2212.08073v1 | null | preprint | Historical critique/revision and AI preference supervision; distinct from correctness certification | 2026-10-25 |
| P26 | paper | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning | DeepSeek | Source version described in next column | https://arxiv.org/html/2501.12948v1 | null | preprint | Canonical spine version retained; rejection-sampled targets and student SFT; newer revisions are not silently substituted | 2026-10-25 |
| P29 | paper | Tulu 3: Pushing Frontiers in Open Language Model Post-Training | Nathan Lambert et al. | arXiv; first 2024-11-22; v5 2025-04-14 | https://arxiv.org/abs/2411.15124v5 | https://github.com/allenai/open-instruct | preprint | Historical data recipes, decontamination and negative training results; developer technical account separately R11.21 | 2026-10-25 |
| P42 | paper | SWE-bench: Can Language Models Resolve Real-World GitHub Issues? | Carlos E. Jimenez et al. | ICLR 2024; first 2023-10-10; v3 2024-11-11 | https://arxiv.org/abs/2310.06770v3 | https://github.com/SWE-bench/SWE-bench | peer-reviewed | Issue-to-patch outcome supervision; harness test outcomes do not establish general software correctness | 2026-10-25 |
| P43 | paper | τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains | Shunyu Yao, Noah Shinn, Pedram Razavi, Karthik Narasimhan | arXiv 2024; v1 2024-06-17 | https://arxiv.org/html/2406.12045v1 | https://github.com/sierra-research/tau-bench | preprint | Canonical spine version; environment state, user interaction and repeated outcome assessment | 2026-10-25 |
| R11.1 | paper | Self-Instruct: Aligning Language Models with Self-Generated Instructions | Yizhong Wang et al. | First 2022-12-20; arXiv v2 2023-05-25; ACL 2023 | https://arxiv.org/abs/2212.10560v2 | null | peer-reviewed | Seed bootstrapping and quality audit; same research work as R11.22 | 2026-10-25 |
| R11.2 | paper | WizardLM: Empowering Large Language Models to Follow Complex Instructions | Can Xu et al. | First 2023-04-24; inspected v3 2025-05-27; ICLR 2024 listed | https://arxiv.org/abs/2304.12244v3 | null | peer-reviewed | Evol-Instruct transformations; student/teacher/evaluator differences limit cross-study comparisons | 2026-10-25 |
| R11.3 | paper | Scaling Synthetic Data Creation with 1,000,000,000 Personas | Tao Ge et al. | First 2024-06-28; v3 2025-05-08 | https://arxiv.org/abs/2406.20094v3 | null | preprint | Persona conditioning; population size does not establish validated diversity or downstream benefit | 2026-10-25 |
| R11.4 | paper | STaR: Bootstrapping Reasoning With Reasoning | Eric Zelikman et al. | First 2022-03-28; v2 2022-05-20 | https://arxiv.org/abs/2203.14465v2 | null | preprint | Answer-conditioned rationale selection and restart-from-base protocol | 2026-10-25 |
| R11.5 | paper | Llama 2: Open Foundation and Fine-Tuned Chat Models | Hugo Touvron et al. | First 2023-07-18; v2 2023-07-19 | https://arxiv.org/abs/2307.09288v2 | null | preprint | Historical rejection-sampling and preference-data construction | 2026-10-25 |
| R11.6 | paper | The Llama 3 Herd of Models | Aaron Grattafiori et al. | First 2024-07-31; v3 2024-11-23 | https://arxiv.org/abs/2407.21783v3 | null | preprint | Historical synthetic data and verification recipe; reported system evidence is not an isolated selector ablation | 2026-10-25 |
| R11.7 | paper | The Curse of Recursion: Training on Generated Data Makes Models Forget | Ilia Shumailov et al. | First 2023-05-27; pinned v3 2024-04-14 | https://arxiv.org/abs/2305.17493v3 | null | preprint | Recursive distribution distortion in this pinned version; later Nature title/version not substituted | 2026-10-25 |
| R11.9 | paper | Is Model Collapse Inevitable? Breaking the Curse of Recursion by Accumulating Real and Synthetic Data | Matthias Gerstgrasser et al. | First 2024-04-01; v2 2024-04-29 | https://arxiv.org/abs/2404.01413v2 | null | preprint | Accumulate versus replace distinction under the studied generation/training regimes | 2026-10-25 |
| R11.10 | paper | UltraFeedback: Boosting Language Models with Scaled AI Feedback | Ganqu Cui et al. | First 2023-10-02; v2 2024-07-16; ICML 2024 camera-ready | https://arxiv.org/abs/2310.01377v2 | null | peer-reviewed | Model-produced preferences; evaluator dependence and label semantics | 2026-10-25 |
| R11.11 | documentation | TRL v1.13.0: Dataset formats and types | Hugging Face TRL maintainers | Versioned documentation; first-public date not established | https://huggingface.co/docs/trl/v1.13.0/dataset_formats | null | official documentation | Prompt/completion, preference and conversational schemas; static documentation, no trainer execution | 2026-10-25 |
| R11.12 | documentation | verl documentation | verl maintainers | Moving latest documentation; first-public date not established | https://verl.readthedocs.io/en/latest/ | null | official documentation | Framework data and rollout interfaces; URL is not a reproducible dependency pin | 2026-10-25 |
| R11.13 | documentation | verl: Multi-turn Rollout Support | verl maintainers | Moving latest documentation; displayed update date not normalized | https://verl.readthedocs.io/en/latest/sglang_multiturn/multiturn.html | null | official documentation | Delta tokenization and assistant loss masks; static interface evidence only | 2026-10-25 |
| R11.14 | repository | OpenRLHF repository README | OpenRLHF maintainers | Moving repository; commit not pinned in historical section | https://github.com/OpenRLHF/OpenRLHF | https://github.com/OpenRLHF/OpenRLHF | official documentation | Preference/rollout input fields; no version-specific compatibility or execution claim | 2026-10-25 |
| R11.15 | documentation | vLLM v0.32.0 SamplingParams | vLLM maintainers | Versioned API documentation; first-public date not established | https://docs.vllm.ai/en/v0.32.0/api/vllm/sampling_params/ | null | official documentation | Sampling fields; batch-invariant seed warning applies only under its documented conditional branch | 2026-10-25 |
| R11.17 | repository | DeepSeek-R1 official model repository | DeepSeek | Historical model README; inspected current surface, not a commit pin | https://github.com/deepseek-ai/DeepSeek-R1 | https://github.com/deepseek-ai/DeepSeek-R1 | official documentation | Published sampling recommendations; recommendations do not guarantee engine-independent identical draws | 2026-10-25 |
| R11.18 | repository | SWE-bench evaluation harness repository | SWE-bench maintainers | Moving repository; commit not pinned here | https://github.com/SWE-bench/SWE-bench | https://github.com/SWE-bench/SWE-bench | official documentation | FAIL_TO_PASS and PASS_TO_PASS records; static schema inspection | 2026-10-25 |
| R11.19 | repository | τ-bench repository | Sierra Research | Moving historical benchmark implementation; commit not pinned here | https://github.com/sierra-research/tau-bench | https://github.com/sierra-research/tau-bench | official documentation | reward, info and trajectory records; not a completed policy evaluation | 2026-10-25 |
| R11.21 | documentation | Tülu 3: The next era in open post-training | Allen Institute for AI | Official technical account, 2024-11-21 | https://allenai.org/blog/tulu-3-technical | https://github.com/allenai/open-instruct | official documentation | Data mixture and decontamination account; same project as P29, not independent replication | 2026-10-25 |
| R11.22 | paper | Self-Instruct: Aligning Language Models with Self-Generated Instructions | Yizhong Wang et al. | ACL 2023, pp. 13484–13508; DOI 10.18653/v1/2023.acl-long.754 | https://aclanthology.org/2023.acl-long.754/ | null | peer-reviewed | Proceedings identity for R11.1; alias of one work, not a second experimental study | 2026-10-25 |
| R11.23 | paper | How Much Is an AI Token Worth? Scaling Laws for Wild AI-Generated Web Text | Russell, Glickenhaus, Thai, Wieting, Iyyer, Spero, Emi | First 2026-09-30; 2609.40295v1 | https://arxiv.org/html/2609.40295v1 | https://github.com/pangramlabs/WildAI | preprint | §11.6: bounded-scale, target-dependent human/AI text substitution; paper fits versus actual measurements distinguished | 2026-10-25 |
| R11.24 | paper | Effective Synthetic Data Curation Requires Group-Level Signals | Cathy Jiao, Chenyan Xiong | First 2026-09-30; 2610.00779v1 | https://arxiv.org/html/2610.00779v1 | null | preprint | §11.6: non-additive group value, privileged reference-set oracle and scoring cost; book SGD counterexample is separate | 2026-10-25 |
| R11.25 | paper | FinSafeGuard: A Quality-Driven Synthetic Dataset for Financial AI Safety | Thacil, Harsh, Saxena, Sarmah, Pasquali | First 2026-10-19; 2610.26066v1 | https://arxiv.org/html/2610.26066v1 | null | preprint | §11.6: construction funnel; abstract/body rejection-rate discrepancy and deferred downstream validation retained | 2026-10-25 |
| R11.26 | paper | Synthetic Data Characterization via Training Dynamics | Lago, Ezquerro, Vilares | First 2026-09-30; 2609.39447v1 | https://arxiv.org/html/2609.39447v1 | null | preprint | §11.6: selected encoder/task regime, label repair and similarity graph filtering; author-reported venue acceptance is not independently certified | 2026-10-25 |
| R11.27 | repository | WildAI released code and experiment pipeline | Pangram Labs | Commit 795a71852d569173fcdaca1db2a466109cd80814, 2026-10-01T15:22:33Z | https://github.com/pangramlabs/WildAI/commit/795a71852d569173fcdaca1db2a466109cd80814 | https://github.com/pangramlabs/WildAI/tree/795a71852d569173fcdaca1db2a466109cd80814 | official documentation | Pinned README inspected: data/labeling/training/evaluation/law-fit layout and requirements; no retraining or full-code audit | 2026-10-25 |

## Evidence boundaries

The newer WildAI code record is a static README inspection at the stated full commit. A commit timestamp alone does not prove the first date on which a repository was public. Its CPU figure extra and CUDA training requirements are different environments; an available script is not proof that its output was independently regenerated. Dataset and code license conditions require separate review before reuse; this chapter cites sources and supplies its own derivations rather than copying their assets.

The §11.6 acceptance-cost calculator implements only Eq. 11.17 under stationary independent trials. Figure 11.2 plots an analytical occupancy expectation under fixed classes. Neither is a fit to a cited dataset. FinSafeGuard construction counts do not establish student safety improvement; group-curation oracle rankings and WildAI bounded-scale fits do not establish a universal synthetic-data exchange rate. The proposed experiments in [verification.md](verification.md) remain unexecuted.
