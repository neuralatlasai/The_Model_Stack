---
id: ms.references.1
entity_type: references
title: References — Chapter 01
short_title: References
volume: 1
part: 1
chapter: 1
section: null
slug: references
parent: ms.chapter.1
prev_sibling: ms.verification.1
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
siblings_by_mechanism: []
relations: []
axes:
  lifecycle: []
  mechanism: []
  feedback_setting: []
  modality: []
papers: [P02, P05, P08, P09, P10, P11, P13, P14, P19, P21, P25, P26, P28, P32, P36, P40, P44, P47, P50, P52]
implementations: []
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION]
  empirically_observed: false
word_count_target: 300
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# References — Chapter 01

Every URL below was opened on the date in its "Accessed" column (2026-09-20, or 2026-09-24 for R1.16) and the cited claim was checked against the page (abstract, listed section, README, or model card). On 2026-09-24, P19 (abstract, Tables 1–2), P26 (v1 Section 2.4 list of distillation targets), and R1.15 (distilled-model table) were re-opened to check §1.2 and §1.4 wording; their Accessed dates record the first check. A preprint's presence is not a claim of peer review. Spine keys, short names, and URLs match Appendix D of `book_plan.md` exactly; where Appendix D abbreviates a title, the full title from the opened page follows in parentheses.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P02 | paper | Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer | Raffel et al., Google | arXiv 2019 (v4 2023); JMLR | https://arxiv.org/abs/1910.10683 | null | preprint | §1.3 denoising/text-to-text family; C4 | 2026-09-20 |
| P05 | paper | Dolma (full title: Dolma: an Open Corpus of Three Trillion Tokens for Language Model Pretraining Research) | Soldaini et al., Allen Institute for AI (Ai2) | arXiv 2024; ACL 2024 | https://arxiv.org/abs/2402.00159 | null | peer-reviewed | §1.3 reproducible-training data disclosure | 2026-09-20 |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan et al., OpenAI | arXiv 2020 | https://arxiv.org/abs/2001.08361 | null | preprint | §1.5 loss as function of N, D, C; §1.6 competing allocations | 2026-09-20 |
| P09 | paper | Training Compute-Optimal Large Language Models | Hoffmann et al., Google DeepMind | arXiv 2022; NeurIPS 2022 | https://arxiv.org/abs/2203.15556 | null | preprint | §1.5 equal scaling of N and D; §1.6 attribution of disagreement | 2026-09-20 |
| P10 | paper | Switch Transformers (full title: Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity) | Fedus, Zoph, Shazeer, Google Research | arXiv 2021 (v2 2022); JMLR | https://arxiv.org/abs/2101.03961 | null | preprint | §1.3 sparse mechanism, constant per-example compute | 2026-09-20 |
| P11 | paper | Mamba (full title: Mamba: Linear-Time Sequence Modeling with Selective State Spaces) | Gu and Dao | arXiv 2023 (v2 2024) | https://arxiv.org/abs/2312.00752 | null | preprint | §1.3 recurrent-state autoregressive family; linear scaling claim | 2026-09-20 |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek | arXiv 2024 (v2 2025) | https://arxiv.org/abs/2412.19437 | https://github.com/deepseek-ai | preprint | §1.3 placement (671B total / 37B activated, 14.8T tokens); §1.5 GPU-hours as occupancy entry | 2026-09-20 |
| P14 | paper | LoRA (full title: LoRA: Low-Rank Adaptation of Large Language Models) | Hu et al., Microsoft | arXiv 2021; ICLR 2022 | https://arxiv.org/abs/2106.09685 | null | preprint | §1.2 adaptation is not compression; §1.4 adaptation cost line | 2026-09-20 |
| P19 | paper | FlashAttention (full title: FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness) | Dao et al. | arXiv 2022; NeurIPS 2022 | https://arxiv.org/abs/2205.14135 | https://github.com/Dao-AILab/flash-attention | preprint | §1.2 implementation-level change; §1.5 traffic as binding entry | 2026-09-20 |
| P21 | paper | Training language models to follow instructions with human feedback | Ouyang et al., OpenAI | arXiv 2022; NeurIPS 2022 | https://arxiv.org/abs/2203.02155 | null | preprint | §1.1 task distribution vs size; §1.4 three-stage route | 2026-09-20 |
| P25 | paper | DeepSeekMath (full title: DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models) | Shao et al., DeepSeek | arXiv 2024 | https://arxiv.org/abs/2402.03300 | https://github.com/deepseek-ai | preprint | §1.3 specialization by continued pretraining (120B math tokens) | 2026-09-20 |
| P26 | paper | DeepSeek-R1 (full title: DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning) | DeepSeek | arXiv 2025 (v1; v2 2026) | https://arxiv.org/abs/2501.12948 | https://github.com/deepseek-ai/DeepSeek-R1 | preprint | §1.2 R1-Zero as GRPO on base; §1.4 branching routes, SFT-only distillation (v1 §2.4, §4.1); §1.6 rung comparison | 2026-09-20 |
| P28 | paper | Understanding R1-Zero-Like Training: A Critical Perspective | Liu et al., Sea AI Lab and collaborators | arXiv 2025 | https://arxiv.org/abs/2503.20783 | null | preprint | §1.2, §1.6 base-checkpoint and optimizer-bias hypotheses | 2026-09-20 |
| P32 | paper | Distilling the Knowledge in a Neural Network | Hinton, Vinyals, Dean, Google | arXiv 2015; NeurIPS 2014 workshop | https://arxiv.org/abs/1503.02531 | null | preprint | §1.4 distillation edge (soft-target transfer) | 2026-09-20 |
| P36 | paper | Efficient Memory Management for Large Language Model Serving with PagedAttention | Kwon et al., UC Berkeley | arXiv 2023; SOSP 2023 | https://arxiv.org/abs/2309.06180 | https://docs.vllm.ai/ | preprint | §1.2 runtime-level change; §1.5 capacity as binding entry | 2026-09-20 |
| P40 | paper | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | Lewis et al., Meta AI / FAIR and collaborators | arXiv 2020; NeurIPS 2020 | https://arxiv.org/abs/2005.11401 | null | preprint | §1.4 retrieval edge; verification application | 2026-09-20 |
| P44 | paper | Learning Transferable Visual Models From Natural Language Supervision | Radford et al., OpenAI | arXiv 2021; ICML 2021 | https://arxiv.org/abs/2103.00020 | https://github.com/openai | preprint | §1.3 contrastive family | 2026-09-20 |
| P47 | technical report | V-JEPA 2 (full title: V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning) | Meta AI / FAIR | arXiv 2025 | https://arxiv.org/abs/2506.09985 | null | preprint | §1.3 joint-embedding predictive family | 2026-09-20 |
| P50 | paper | Holistic Evaluation of Language Models | Liang et al., Stanford CRFM | arXiv 2022 (v2 2023); TMLR | https://arxiv.org/abs/2211.09110 | https://github.com/stanford-crfm | preprint | §1.1 seven metrics × 16 core scenarios, trade-offs exposed | 2026-09-20 |
| P52 | technical report | Circuit Tracing: Revealing Computational Graphs in Language Models | Anthropic | Transformer Circuits Thread, 2025-03-27 | https://transformer-circuits.pub/2025/attribution-graphs/methods.html | null | official documentation | §1.6 rung-2 validation by perturbation; stated limitations | 2026-09-20 |
| R1.1 | course | CS336: Language Modeling from Scratch, Spring 2026 | Hashimoto and Liang, Stanford | Stanford, 2026 | https://cs336.stanford.edu/ | null | official documentation | README lineage and source route; five assignments (basics, systems, scaling, data, alignment and reasoning RL) | 2026-09-20 |
| R1.2 | course | CS336: Language Modeling from Scratch, Spring 2025 archive | Hashimoto and Liang, Stanford | Stanford, 2025 | https://cs336.stanford.edu/spring2025/ | null | official documentation | reproducible assignment references | 2026-09-20 |
| R1.3 | paper | Model Cards for Model Reporting | Mitchell et al., Google | arXiv 2018; FAT* 2019 | https://arxiv.org/abs/1810.03993 | null | peer-reviewed | §1.1 intended use, evaluation across conditions | 2026-09-20 |
| R1.4 | paper | Datasheets for Datasets | Gebru et al. | arXiv 2018; CACM 2021 | https://arxiv.org/abs/1803.09010 | null | peer-reviewed | §1.1 documenting motivation, composition, collection, recommended uses | 2026-09-20 |
| R1.5 | paper | Hidden Technical Debt in Machine Learning Systems | Sculley et al., Google | NIPS 2015 (Advances in Neural Information Processing Systems 28) | https://papers.nips.cc/paper/5656-hidden-technical-debt-in-machine-learning-systems | null | peer-reviewed | README lineage: hidden feedback loops, data dependencies, configuration debt | 2026-09-20 |
| R1.6 | paper | Vision: A Computational Investigation into the Human Representation and Processing of Visual Information (monograph, 1982; MIT Press edition) | David Marr | W. H. Freeman 1982; MIT Press | https://academic.oup.com/mit-press-scholarship-online/book/13528 | null | peer-reviewed | §1.2 historical note: computational, algorithmic, implementational levels | 2026-09-20 |
| R1.7 | paper | OLMo: Accelerating the Science of Language Models | Groeneveld et al., Allen Institute for AI (Ai2) | arXiv 2024; ACL 2024 | https://arxiv.org/abs/2402.00838 | https://github.com/allenai | preprint | §1.3 weights + training data + training and evaluation code | 2026-09-20 |
| R1.8 | paper | Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling | Biderman et al., EleutherAI | arXiv 2023; ICML 2023 | https://arxiv.org/abs/2304.01373 | null | preprint | §1.3 reproducible-training suite (16 models, 154 checkpoints each) | 2026-09-20 |
| R1.9 | paper | BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding | Devlin et al., Google | arXiv 2018; NAACL 2019 | https://arxiv.org/abs/1810.04805 | null | preprint | §1.3 bidirectional masked-prediction family | 2026-09-20 |
| R1.10 | paper | Denoising Diffusion Probabilistic Models | Ho, Jain, Abbeel, UC Berkeley | arXiv 2020; NeurIPS 2020 | https://arxiv.org/abs/2006.11239 | null | preprint | §1.3 iterative-refinement family generalizing autoregressive decoding | 2026-09-20 |
| R1.11 | paper | Energy and Policy Considerations for Deep Learning in NLP | Strubell, Ganesh, McCallum | arXiv 2019; ACL 2019 | https://arxiv.org/abs/1906.02243 | null | peer-reviewed | §1.5 energy entry; reporting recommendations | 2026-09-20 |
| R1.12 | paper | Carbon Emissions and Large Neural Network Training | Patterson et al., Google | arXiv 2021 | https://arxiv.org/abs/2104.10350 | null | preprint | §1.5 factors determining energy and carbon (algorithm, processor, datacenter, energy mix) | 2026-09-20 |
| R1.13 | measurement source | Epoch AI data and measurement programs | Epoch AI | 2026 (living) | https://epoch.ai/data | null | official documentation | README source route; compute, hardware, and economic measurement | 2026-09-20 |
| R1.14 | technical report | GPT-4 Technical Report | OpenAI | arXiv 2023 (v6 2024) | https://arxiv.org/abs/2303.08774 | null | preprint | §1.3 NOT-DISCLOSED example (Section 2 scope statement, PDF p. 2) | 2026-09-20 |
| R1.15 | repository | DeepSeek-R1 repository README (distilled model list, license) | DeepSeek | GitHub, 2025 | https://github.com/deepseek-ai/DeepSeek-R1 | https://github.com/deepseek-ai/DeepSeek-R1 | official documentation | §1.4 six distilled models on Qwen2.5 and Llama-3 checkpoints; MIT license | 2026-09-20 |
| R1.16 | model card | Llama-3.3-70B-Instruct model card | Meta AI / FAIR | Hugging Face; 70B Instruct released 2024-12-06 | https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct | null | official documentation | §1.4 the sixth R1 distillation student starts from an instruction-tuned model ("an instruction tuned generative model in 70B"; tuned with SFT and RLHF), not a base checkpoint | 2026-09-24 |

Notes on status. Venue fields other than arXiv are given where the arXiv page or the fetched page states them (Dolma: ACL 2024; Datasheets: CACM 2021; Model Cards: FAT* 2019; Strubell et al.: ACL 2019; Sculley et al.: NIPS 2015). Where a later peer-reviewed version exists but was not opened, Status remains "preprint". Official-code cells give the official organization or repository only where the fetched page or `Instruction/AI_REFERENCE_STACK.md` names it; otherwise null.
