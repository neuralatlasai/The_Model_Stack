---
id: ms.appendix.d
entity_type: appendix
title: "Primary-paper spine"
short_title: Appendix D
volume: null
part: null
chapter: null
section: null
slug: appendix-d-primary-paper-spine
parent: ms.appendices
prev_sibling: ms.appendix.c
next_sibling: ms.appendix.e
children: []
prerequisites: []
downstream: []
related: [ms.chapter.6, ms.chapter.66]
relations: []
axes: {lifecycle: [evaluation, assurance], mechanism: [evidence_audit, provenance], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Appendix D — Primary-paper spine

[DERIVED] These 52 identifiers preserve the mechanism-organized spine in the book plan. They identify works, not a ranking or exhaustive current-research list. Foundational works retain their historical dates. New eligible 2026 research appears in chapter-local ledgers; linking the spine does not relabel older work as new research.

## Mechanism map

| ID | Primary work | Mechanism or question | Chapters |
|---|---|---|---|
| P01 | [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | Transformer computation and reference architecture | 04–05, 13–14 |
| P02 | [Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) | Denoising, transfer learning, and C4 | 04, 07–08, 19 |
| P03 | [The Pile](https://arxiv.org/abs/2101.00027) | Diverse corpus composition | 07–09 |
| P04 | [The RefinedWeb Dataset for Falcon LLM](https://arxiv.org/abs/2306.01116) | Web-data filtering and deduplication | 07–09 |
| P05 | [Dolma](https://arxiv.org/abs/2402.00159) | Open corpus engineering and provenance | 07–12 |
| P06 | [The FineWeb Datasets](https://arxiv.org/abs/2406.17557) | Controlled web-data preparation | 07–09 |
| P07 | [DataComp-LM](https://arxiv.org/abs/2406.11794) | Data-selection experiments | 06–09, 21 |
| P08 | [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) | Empirical loss/compute relationships | 21 |
| P09 | [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) | Parameter–data compute allocation | 09, 21 |
| P10 | [Switch Transformers](https://arxiv.org/abs/2101.03961) | Sparse conditional computation | 16, 29 |
| P11 | [Mamba](https://arxiv.org/abs/2312.00752) | Selective state-space sequence modeling | 17 |
| P12 | [Gated Delta Networks](https://arxiv.org/abs/2412.06464) | Gating and targeted recurrent-state updates | 17 |
| P13 | [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) | Joint architecture/training/systems design | 14, 16, 19–21, 27–30 |
| P14 | [LoRA](https://arxiv.org/abs/2106.09685) | Low-rank parameter adaptation | 23 |
| P15 | [QLoRA](https://arxiv.org/abs/2305.14314) | Adaptation of quantized base models | 23, 40 |
| P16 | [Overcoming catastrophic forgetting in neural networks](https://arxiv.org/abs/1612.00796) | Parameter anchoring and sequential retention | 24 |
| P17 | [Megatron-LM](https://arxiv.org/abs/1909.08053) | Transformer model parallelism | 29–30 |
| P18 | [ZeRO](https://arxiv.org/abs/1910.02054) | Partitioning training state | 29–30 |
| P19 | [FlashAttention](https://arxiv.org/abs/2205.14135) | Exact attention with IO-aware execution | 14, 26–27 |
| P20 | [FlashAttention-4](https://arxiv.org/abs/2603.05451) | Algorithm/pipeline co-design under asymmetric hardware scaling | 25–27 |
| P21 | [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) | SFT and RLHF pipeline | 31–34 |
| P22 | [Constitutional AI](https://arxiv.org/abs/2212.08073) | AI feedback and oversight | 11, 32, 65 |
| P23 | [Direct Preference Optimization](https://arxiv.org/abs/2305.18290) | Preference objectives through policy reparameterization | 33 |
| P24 | [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347) | Clipped policy optimization | 34 |
| P25 | [DeepSeekMath](https://arxiv.org/abs/2402.03300) | Mathematical adaptation and group-relative RL | 22, 35 |
| P26 | [DeepSeek-R1](https://arxiv.org/abs/2501.12948) | Reasoning RL and student-model pathways | 11, 35, 39 |
| P27 | [DAPO](https://arxiv.org/abs/2503.14476) | Scaled RL optimization choices | 35–36 |
| P28 | [Understanding R1-Zero-Like Training: A Critical Perspective](https://arxiv.org/abs/2503.20783) | Bias and interpretation in reasoning RL | 35 |
| P29 | [Tulu 3](https://arxiv.org/abs/2411.15124) | Open post-training recipes and data mixtures | 11, 31–36 |
| P30 | [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) | Process supervision and verification | 32, 38 |
| P31 | [Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters](https://arxiv.org/abs/2408.03314) | Inference-budget allocation | 38 |
| P32 | [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531) | Teacher–student soft-target learning | 39 |
| P33 | [GPTQ](https://arxiv.org/abs/2210.17323) | Post-training weight quantization | 40 |
| P34 | [AWQ](https://arxiv.org/abs/2306.00978) | Activation-aware weight quantization | 40 |
| P35 | [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) | Draft/verify generation and distribution preservation | 37 |
| P36 | [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) | KV allocation, sharing, and serving | 42–44 |
| P37 | [SGLang: Efficient Execution of Structured Language Model Programs](https://arxiv.org/abs/2312.07104) | Program/runtime co-design and reuse | 43–44 |
| P38 | [DistServe](https://arxiv.org/abs/2401.09670) | Prefill/decode disaggregation and goodput | 44, 48 |
| P39 | [Dense Passage Retrieval](https://arxiv.org/abs/2004.04906) | Learned retrieval representations | 49 |
| P40 | [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | Parametric and nonparametric evidence | 49–50, 53 |
| P41 | [ReAct](https://arxiv.org/abs/2210.03629) | Interleaved reasoning and environment actions | 51–52 |
| P42 | [SWE-bench](https://arxiv.org/abs/2310.06770) | Repository-level software-task evaluation | 61, 63 |
| P43 | [τ-bench](https://arxiv.org/abs/2406.12045) | Tool–agent–user interaction evaluation | 51–54, 63 |
| P44 | [Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/abs/2103.00020) | Contrastive vision–language learning | 18, 55 |
| P45 | [BLIP-2](https://arxiv.org/abs/2301.12597) | Connecting visual encoders to language models | 18, 55 |
| P46 | [Gemini 2.5 Technical Report](https://arxiv.org/abs/2507.06261) | Reasoning, multimodality, and long-context system study | 15, 38, 55–57 |
| P47 | [V-JEPA 2](https://arxiv.org/abs/2506.09985) | Predictive representations, planning, and action-conditioned transfer | 57, 59–60 |
| P48 | [OpenVLA](https://arxiv.org/abs/2406.09246) | Vision–language–action policies | 60 |
| P49 | [π0](https://arxiv.org/abs/2410.24164) | Flow-based action generation | 58, 60 |
| P50 | [Holistic Evaluation of Language Models](https://arxiv.org/abs/2211.09110) | Multi-dimensional evaluation design | 06, 61–63, 66 |
| P51 | [Chatbot Arena](https://arxiv.org/abs/2403.04132) | Human-preference measurement | 62 |
| P52 | [Circuit Tracing: Revealing Computational Graphs in Language Models](https://transformer-circuits.pub/2025/attribution-graphs/methods.html) | Mechanistic attribution and intervention | 64 |

## Authoritative identity ledger

[DERIVED] Existing identities are reconciled with chapter ledgers; claim locators, inspection scope and chapter-specific revisions remain in those uses. Missing historical identities were restored from primary abstract/history or proceedings records on 2026-10-25. This identity check is not a new full-text or implementation audit of every entry. Deliberately pinned versions remain pinned; later revisions are not silently substituted. A preprint label does not imply peer review, and an available repository does not prove replication.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani et al. | arXiv v7; NeurIPS2017 | https://arxiv.org/html/1706.03762v7 | https://github.com/tensorflow/tensor2tensor | peer-reviewed | Spine route: Transformer computation and reference architecture; chapters 04–05, 13–14. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P02 | paper | Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer | Raffel et al. | Source version described in next column | https://arxiv.org/pdf/1910.10683 | null | peer-reviewed | Spine route: Denoising, transfer learning, and C4; chapters 04, 07–08, 19. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P03 | paper | The Pile: An 800GB Dataset of Diverse Text for Language Modeling | Gao et al.; EleutherAI | arXiv, 2020 | https://arxiv.org/html/2101.00027v1 | null | preprint | Spine route: Diverse corpus composition; chapters 07–09. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P04 | paper | The RefinedWeb Dataset for Falcon LLM: Outperforming Curated Corpora with Web Data, and Web Data Only | Penedo, Malartic, Hesslow, et al. (Technology Innovation Institute; LightOn affiliations as printed) | arXiv 2023 (v1) | https://arxiv.org/abs/2306.01116 | null | preprint | Spine route: Web-data filtering and deduplication; chapters 07–09. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P05 | paper | Dolma: an Open Corpus of Three Trillion Tokens for Language Model Pretraining Research | Soldaini et al. | Source version described in next column | https://arxiv.org/html/2402.00159v2 | null | preprint | Spine route: Open corpus engineering and provenance; chapters 07–12. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P06 | paper | The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale | Guilherme Penedo et al.; Hugging Face Research | arXiv, 2024 | https://arxiv.org/abs/2406.17557 | null | preprint | Spine route: Controlled web-data preparation; chapters 07–09. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P07 | paper | DataComp-LM: In search of the next generation of training sets for language models | Jeffrey Li et al. | arXiv, 2024; inspected v4, 2025 | https://arxiv.org/abs/2406.11794 | null | preprint | Spine route: Data-selection experiments; chapters 06–09, 21. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan et al. | Source version described in next column | https://arxiv.org/pdf/2001.08361 | null | preprint | Spine route: Empirical loss/compute relationships; chapters 21. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P09 | paper | Training Compute-Optimal Large Language Models | Hoffmann et al. | Source version described in next column | https://arxiv.org/pdf/2203.15556 | null | preprint | Spine route: Parameter–data compute allocation; chapters 09, 21. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P10 | paper | Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity | Fedus, Zoph, Shazeer | Source version described in next column | https://arxiv.org/html/2101.03961v3 | null | preprint | Spine route: Sparse conditional computation; chapters 16, 29. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P11 | paper | Mamba: Linear-Time Sequence Modeling with Selective State Spaces | Gu and Dao | Source version described in next column | https://arxiv.org/html/2312.00752v2 | null | preprint | Spine route: Selective state-space sequence modeling; chapters 17. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P12 | paper | Gated Delta Networks: Improving Mamba2 with Delta Rule | Songlin Yang; Jan Kautz; Ali Hatamizadeh | arXiv 2024; v3 2025, ICLR 2025 camera-ready record | https://arxiv.org/abs/2412.06464 | null | preprint | Spine route: Gating and targeted recurrent-state updates; chapters 17. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek | Source version described in next column | https://arxiv.org/html/2412.19437v2 | null | preprint | Spine route: Joint architecture/training/systems design; chapters 14, 16, 19–21, 27–30. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P14 | paper | LoRA: Low-Rank Adaptation of Large Language Models | Hu et al. | Source version described in next column | https://arxiv.org/html/2106.09685v2 | null | preprint | Spine route: Low-rank parameter adaptation; chapters 23. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P15 | paper | QLoRA: Efficient Finetuning of Quantized LLMs | Tim Dettmers, Artidoro Pagnoni, Ari Holtzman, Luke Zettlemoyer | NeurIPS 2023 archival proceedings | https://proceedings.neurips.cc/paper_files/paper/2023/file/1feb87871436031bdc0f2beaa62a049b-Paper-Conference.pdf | null | peer-reviewed | Spine route: Adaptation of quantized base models; chapters 23, 40. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P16 | paper | Overcoming catastrophic forgetting in neural networks | James Kirkpatrick et al.; DeepMind | PNAS / 2017; origin 2016 | https://arxiv.org/html/1612.00796v2 | null | peer-reviewed | Spine route: Parameter anchoring and sequential retention; chapters 24. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P17 | paper | Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism | Mohammad Shoeybi et al. | First 2019-09-17; v4 2020-03-13 | https://arxiv.org/abs/1909.08053v4 | null | preprint | Historical identity restoration: Transformer model parallelism; chapters 29–30. Abstract/history identity checked; no new full methods audit or replication. | 2026-10-25 |
| P18 | paper | ZeRO: Memory Optimizations Toward Training Trillion Parameter Models | Rajbhandari et al. | arXiv v3; SC2020 | https://arxiv.org/html/1910.02054v3 | https://github.com/microsoft/DeepSpeed | peer-reviewed | Spine route: Partitioning training state; chapters 29–30. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P19 | paper | FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness | Dao et al. | Source version described in next column | https://arxiv.org/html/2205.14135v2 | null | preprint | Spine route: Exact attention with IO-aware execution; chapters 14, 26–27. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P20 | paper | FlashAttention-4: Algorithm and Kernel Pipelining Co-Design for Asymmetric Hardware Scaling | Ted Zadouri; Markus Hoehnerbach; Jay Shah; Timmy Liu; Vijay Thakkar; Tri Dao | arXiv 2026, v1 | https://arxiv.org/abs/2603.05451 | https://github.com/Dao-AILab/flash-attention | preprint | Spine route: Algorithm/pipeline co-design under asymmetric hardware scaling; chapters 25–27. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P21 | paper | Training language models to follow instructions with human feedback | Ouyang et al. | Source version described in next column | https://arxiv.org/pdf/2203.02155 | null | preprint | Spine route: SFT and RLHF pipeline; chapters 31–34. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P22 | paper | Constitutional AI: Harmlessness from AI Feedback | Yuntao Bai et al. | arXiv 2022; first 2022-12-15; v1 | https://arxiv.org/abs/2212.08073v1 | null | preprint | Spine route: AI feedback and oversight; chapters 11, 32, 65. Historical critique/revision and AI preference supervision; distinct from correctness certification | 2026-10-25 |
| P23 | paper | Direct Preference Optimization: Your Language Model is Secretly a Reward Model | Rafael Rafailov et al. | First 2023-05-29; v3 2024-07-29 | https://arxiv.org/abs/2305.18290v3 | null | preprint | Historical identity restoration: Preference objectives through policy reparameterization; chapters 33. Abstract/history identity checked; no new full methods audit or replication. | 2026-10-25 |
| P24 | paper | Proximal Policy Optimization Algorithms | John Schulman et al. | First 2017-07-20; v2 2017-08-28 | https://arxiv.org/abs/1707.06347v2 | null | preprint | Historical identity restoration: Clipped policy optimization; chapters 34. Abstract/history identity checked; no new full methods audit or replication. | 2026-10-25 |
| P25 | paper | DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models | Shao et al. | Source version described in next column | https://arxiv.org/html/2402.03300v3 | null | preprint | Spine route: Mathematical adaptation and group-relative RL; chapters 22, 35. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P26 | paper | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning | DeepSeek | Source version described in next column | https://arxiv.org/html/2501.12948v1 | null | preprint | Spine route: Reasoning RL and student-model pathways; chapters 11, 35, 39. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P27 | paper | DAPO: An Open-Source LLM Reinforcement Learning System at Scale | Qiying Yu et al. | First 2025-03-18; v2 2025-05-20 | https://arxiv.org/abs/2503.14476v2 | null | preprint | Historical identity restoration: Scaled RL optimization choices; chapters 35–36. Abstract/history identity checked; no new full methods audit or replication. | 2026-10-25 |
| P28 | paper | Understanding R1-Zero-Like Training: A Critical Perspective | Liu et al. | Source version described in next column | https://arxiv.org/html/2503.20783v1 | null | preprint | Spine route: Bias and interpretation in reasoning RL; chapters 35. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P29 | paper | Tulu 3: Pushing Frontiers in Open Language Model Post-Training | Nathan Lambert et al. | arXiv; first 2024-11-22; v5 2025-04-14 | https://arxiv.org/abs/2411.15124v5 | https://github.com/allenai/open-instruct | preprint | Spine route: Open post-training recipes and data mixtures; chapters 11, 31–36. Historical data recipes, decontamination and negative training results; developer technical account separately R11.21 | 2026-10-25 |
| P30 | paper | Let's Verify Step by Step | Hunter Lightman et al. | First 2023-05-31; v1 | https://arxiv.org/abs/2305.20050v1 | null | preprint | Historical identity restoration: Process supervision and verification; chapters 32, 38. Abstract/history identity checked; no new full methods audit or replication. | 2026-10-25 |
| P31 | paper | Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters | Charlie Snell, Jaehoon Lee, Kelvin Xu, Aviral Kumar | Historical origin 2024; primary abstract/history identity inspected 2026-10-25 | https://arxiv.org/abs/2408.03314 | null | preprint | Historical identity restoration: Inference-budget allocation; chapters 38. Abstract/history identity checked; no new full methods audit or replication. | 2026-10-25 |
| P32 | paper | Distilling the Knowledge in a Neural Network | Hinton, Vinyals, Dean | Source version described in next column | https://arxiv.org/pdf/1503.02531 | null | preprint | Spine route: Teacher–student soft-target learning; chapters 39. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P33 | paper | GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers | Elias Frantar, Saleh Ashkboos, Torsten Hoefler, Dan Alistarh | ICLR 2023 | https://arxiv.org/pdf/2210.17323 | https://github.com/IST-DASLab/gptq | peer-reviewed | Spine route: Post-training weight quantization; chapters 40. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P34 | paper | AWQ: Activation-aware Weight Quantization for On-Device LLM Compression and Acceleration | Ji Lin et al. | MLSys 2024 | https://arxiv.org/html/2306.00978v5 | https://github.com/mit-han-lab/llm-awq | peer-reviewed | Spine route: Activation-aware weight quantization; chapters 40. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P35 | paper | Fast Inference from Transformers via Speculative Decoding | Leviathan et al. | ICML2023 proceedings PDF | https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf | null | UNVERIFIED | Spine route: Draft/verify generation and distribution preservation; chapters 37. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P36 | paper | Efficient Memory Management for Large Language Model Serving with PagedAttention | Kwon et al. | Source version described in next column | https://arxiv.org/pdf/2309.06180 | null | preprint | Spine route: KV allocation, sharing, and serving; chapters 42–44. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P37 | paper | SGLang: Efficient Execution of Structured Language Model Programs | Lianmin Zheng et al. | NeurIPS 2024 | https://arxiv.org/html/2312.07104v2 | https://github.com/sgl-project/sglang | peer-reviewed | Spine route: Program/runtime co-design and reuse; chapters 43–44. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P38 | paper | DistServe: Disaggregating Prefill and Decoding for Goodput-optimized Large Language Model Serving | Yinmin Zhong et al. | arXiv, 2024 | https://arxiv.org/abs/2401.09670 | null | preprint | Spine route: Prefill/decode disaggregation and goodput; chapters 44, 48. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P39 | paper | Dense Passage Retrieval | Vladimir Karpukhin et al. | EMNLP 2020 | https://aclanthology.org/2020.emnlp-main.550.pdf | https://github.com/facebookresearch/DPR | peer-reviewed | Spine route: Learned retrieval representations; chapters 49. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P40 | paper | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | Lewis et al. | Source version described in next column | https://arxiv.org/pdf/2005.11401 | null | preprint | Spine route: Parametric and nonparametric evidence; chapters 49–50, 53. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P41 | paper | ReAct | Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao | ICLR / 2023 | https://arxiv.org/html/2210.03629v3 | https://react-lm.github.io/ | peer-reviewed | Spine route: Interleaved reasoning and environment actions; chapters 51–52. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P42 | paper | SWE-bench: Can Language Models Resolve Real-World GitHub Issues? | Carlos E. Jimenez et al. | ICLR 2024; first 2023-10-10; v3 2024-11-11 | https://arxiv.org/abs/2310.06770v3 | https://github.com/SWE-bench/SWE-bench | peer-reviewed | Spine route: Repository-level software-task evaluation; chapters 61, 63. Issue-to-patch outcome supervision; harness test outcomes do not establish general software correctness | 2026-10-25 |
| P43 | paper | τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains | Shunyu Yao, Noah Shinn, Pedram Razavi, Karthik Narasimhan | arXiv 2024 | https://arxiv.org/html/2406.12045v1 | null | preprint | Spine route: Tool–agent–user interaction evaluation; chapters 51–54, 63. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P44 | paper | Learning Transferable Visual Models From Natural Language Supervision | Radford et al. | Source version described in next column | https://arxiv.org/pdf/2103.00020 | null | preprint | Spine route: Contrastive vision–language learning; chapters 18, 55. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P45 | paper | BLIP-2: Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models | Li, Li, Savarese, Hoi / Salesforce AI Research | ICML 2023 | https://arxiv.org/html/2301.12597v3 | https://github.com/salesforce/LAVIS | preprint | Spine route: Connecting visual encoders to language models; chapters 18, 55. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P46 | technical report | Gemini 2.5: Pushing the Frontier with Advanced Reasoning, Multimodality, Long Context, and Next Generation Agentic Capabilities | Gemini Team, Google | arXiv 2025; inspected v6, 2025-12-19 | https://arxiv.org/abs/2507.06261 | null | preprint | Spine route: Reasoning, multimodality, and long-context system study; chapters 15, 38, 55–57. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P47 | technical report | V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning | Meta | Source version described in next column | https://arxiv.org/html/2506.09985v1 | null | preprint | Spine route: Predictive representations, planning, and action-conditioned transfer; chapters 57, 59–60. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P48 | paper | OpenVLA: An Open-Source Vision-Language-Action Model | Moo Jin Kim et al. | First 2024-06-13; v3 2024-09-05 | https://arxiv.org/abs/2406.09246v3 | null | preprint | Historical identity restoration: Vision–language–action policies; chapters 60. Abstract/history identity checked; no new full methods audit or replication. | 2026-10-25 |
| P49 | paper | π0: A Vision-Language-Action Flow Model for General Robot Control | Kevin Black et al. | Historical origin 2024-10-31; index identity checked against current arXiv history | https://arxiv.org/abs/2410.24164 | null | preprint | Historical identity restoration: Flow-based action generation; chapters 58, 60. Abstract/history identity checked; no new full methods audit or replication. | 2026-10-25 |
| P50 | paper | Holistic Evaluation of Language Models | Liang et al. | Source version described in next column | https://arxiv.org/pdf/2211.09110 | null | preprint | Spine route: Multi-dimensional evaluation design; chapters 06, 61–63, 66. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P51 | paper | Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference | Wei-Lin Chiang et al. | arXiv, 2024 | https://arxiv.org/abs/2403.04132 | null | preprint | Spine route: Human-preference measurement; chapters 62. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |
| P52 | technical report | Circuit Tracing: Revealing Computational Graphs in Language Models | Anthropic | Source version described in next column | https://transformer-circuits.pub/2025/attribution-graphs/methods.html | null | official documentation | Spine route: Mechanistic attribution and intervention; chapters 64. Exact claim locators and inspection scope remain in chapter uses. | 2026-10-25 |

## From an index entry to a scientific study

[DERIVED] Specify the problem and prior baseline, accessible information, representation, objective, assumptions, estimator and algorithm. Derive compute, memory and communication consequences under declared execution conventions. Bind an empirical claim to dataset/task, model, hardware, budget, seeds, baselines, ablations, metrics and uncertainty. Retain negative findings, missing disclosures and alternative explanations.

[DERIVED] Each inspected implementation needs an immutable identity and evidence level: read, built, exercised or independently reproduced. A paper/code discrepancy remains visible until resolved. Author-reported outcomes remain PAPER-REPORTED. A derivation establishes a result under its premises; it does not execute a model or qualify a benchmark. An unexecuted verification proposal is not supporting empirical evidence.

[DERIVED] Cross-paper comparisons require compatible populations, objectives, accessible information and resources. Use the paper inspector for chapter-specific uses. Historical position in this index does not establish frontier status in 2026. Corrections and revisions require claim-level updates rather than simply replacing a URL.
