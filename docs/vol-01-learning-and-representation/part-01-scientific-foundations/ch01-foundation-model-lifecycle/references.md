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
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# References — Chapter 01

The primary fulltexts and official records below were inspected on **2026-10-07** for this revision. Locators identify the methods, protocols, and results used in the manuscript. An access date records inspection, not independent reproduction. Explicit HTML version suffixes are pinned source revisions. An unversioned PDF URL identifies the inspected fulltext surface but is not an immutable artifact; that remaining version-pinning gap is stated rather than inferred away. No repository was executed, and no software commit is certified by this ledger.

P-keys follow the book's source spine. R1-keys identify chapter-specific sources. Publication status and the version inspected are separate: the analysis here uses the linked fulltext, including where a peer-reviewed edition also exists. Generalized performance claims are not taken from abstracts alone.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P02 | paper | Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer | Raffel et al. | Source version described in next column | https://arxiv.org/pdf/1910.10683 | null | peer-reviewed | PDF served at unversioned URL; header identifies v4, 2023-09-19; JMLR paper; §2.1 autoregressive decoder; §3.3 denoising/span corruption; §1.3 separates objective from inference procedure | 2026-10-07 |
| P05 | paper | Dolma: an Open Corpus of Three Trillion Tokens for Language Model Pretraining Research | Soldaini et al. | Source version described in next column | https://arxiv.org/html/2402.00159v2 | null | preprint | arXiv v2 HTML; §§2–4 corpus composition, processing, and curation toolkit; disclosure example in §1.3 | 2026-10-07 |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan et al. | Source version described in next column | https://arxiv.org/pdf/2001.08361 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §§1–4 loss/resource relationships and compute allocation; used as historical comparator to P09, not a universal exponent | 2026-10-07 |
| P09 | paper | Training Compute-Optimal Large Language Models | Hoffmann et al. | Source version described in next column | https://arxiv.org/pdf/2203.15556 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §3 three estimation approaches; Eqs. 2–4 loss fit and constrained optimum; Table 2 bootstrap ranges; Appendix D.4 matched-compute validation; Appendix F operation accounting | 2026-10-07 |
| P10 | paper | Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity | Fedus, Zoph, Shazeer | Source version described in next column | https://arxiv.org/html/2101.03961v3 | null | preprint | arXiv v3 HTML; §§2–4 routing, expert capacity, overflow, balancing, precision/stability; Table 1 capacity trade-offs; FLOP-matched C4/T5 comparisons in §1.3 | 2026-10-07 |
| P11 | paper | Mamba: Linear-Time Sequence Modeling with Selective State Spaces | Gu and Dao | Source version described in next column | https://arxiv.org/html/2312.00752v2 | null | preprint | arXiv v2 HTML; §3 selective state-space computation; §4.5 and Appendix E.5 throughput setup, including the untrained 6.9B execution comparator; state size is not a universal speed guarantee | 2026-10-07 |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek | Source version described in next column | https://arxiv.org/html/2412.19437v2 | null | preprint | arXiv v2 HTML, 2025-02-18; §1 and Table 1 parameters, tokens, GPU-hours, $2/H800-hour assumption and $5.576M training estimate; §2 MLA and expert mechanisms; §4 training/ablations; exact corpus and facility energy remain absent | 2026-10-07 |
| P14 | paper | LoRA: Low-Rank Adaptation of Large Language Models | Hu et al. | Source version described in next column | https://arxiv.org/html/2106.09685v2 | null | preprint | arXiv v2 HTML; §4.1 frozen W₀ and trainable BA; merged W₀+BA; §5 and Appendix D experimental configurations; adaptation state reduction differs from model compression | 2026-10-07 |
| P19 | paper | FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness | Dao et al. | Source version described in next column | https://arxiv.org/html/2205.14135v2 | null | preprint | arXiv v2 HTML; §3 and Algorithm 1 tiling, online normalization, backward recomputation and IO account; §4.3 and Appendix E.5–E.6 operator versus end-to-end timings; A100 tensor-shape controls | 2026-10-07 |
| P21 | paper | Training language models to follow instructions with human feedback | Ouyang et al. | Source version described in next column | https://arxiv.org/pdf/2203.02155 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §§3.1–3.6 route, prompt selection, user splits, labelers, grouped ranking loss and PPO objective; Eqs. 1–2; Appendix A Table 6 data counts; §4.2 PPO-ptx retention comparison | 2026-10-07 |
| P25 | paper | DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models | Shao et al. | Source version described in next column | https://arxiv.org/html/2402.03300v3 | null | preprint | arXiv v3 HTML; §2 iterative web classification/selection and 120B math-oriented tokens; continued-training route and evaluation; domain focus is distinct from architecture | 2026-10-07 |
| P26 | paper | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning | DeepSeek | Source version described in next column | https://arxiv.org/html/2501.12948v1 | null | preprint | **arXiv v1**, 2025-01-22; historical version deliberately pinned; §2.2 R1-Zero rewards and problems; §2.3 four-stage R1 route and language-consistency trade-off; §2.4 800k-response student SFT; §3 evaluation settings; §4.1 and Tables 5–6 small-model RL comparison | 2026-10-07 |
| P28 | paper | Understanding R1-Zero-Like Training: A Critical Perspective | Liu et al. | Source version described in next column | https://arxiv.org/html/2503.20783v1 | null | preprint | arXiv v1 HTML; §2.3 DeepSeek-V3-Base sampling on 500 MATH questions; §§3.1–3.2 normalization biases and Dr. GRPO; Fig. 6 length dynamics; Appendix A estimator analysis | 2026-10-07 |
| P32 | paper | Distilling the Knowledge in a Neural Network | Hinton, Vinyals, Dean | Source version described in next column | https://arxiv.org/pdf/1503.02531 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §2 shared-temperature soft targets, optional hard labels, temperature-squared scaling; distinguished from response-only student SFT | 2026-10-07 |
| P36 | paper | Efficient Memory Management for Large Language Model Serving with PagedAttention | Kwon et al. | Source version described in next column | https://arxiv.org/pdf/2309.06180 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §§4–5 logical/physical KV blocks, sharing, reference counts, copy-on-write; §6.1 Table 1 hardware/model/workload; Poisson arrivals from ShareGPT/Alpaca length distributions; engine-package comparisons | 2026-10-07 |
| P40 | paper | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | Lewis et al. | Source version described in next column | https://arxiv.org/pdf/2005.11401 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §§2.1–2.4 DPR/BART initialization, latent-document marginalization, query-encoder/generator updates, fixed document index; §3 task evaluation | 2026-10-07 |
| P44 | paper | Learning Transferable Visual Models From Natural Language Supervision | Radford et al. | Source version described in next column | https://arxiv.org/pdf/2103.00020 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §2.3 symmetric image/text contrastive objective and zero-shot classification; embedding comparison is not native caption generation | 2026-10-07 |
| P47 | technical report | V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning | Meta | Source version described in next column | https://arxiv.org/html/2506.09985v1 | null | preprint | arXiv v1 HTML; §2.1 masked latent L1 prediction, EMA targets/stop-gradient; §3 distinct action-conditioned prediction; objective and later planner are not conflated | 2026-10-07 |
| P50 | paper | Holistic Evaluation of Language Models | Liang et al. | Source version described in next column | https://arxiv.org/pdf/2211.09110 | null | preprint | full PDF at unversioned URL; TMLR August 2023 header; immutable arXiv revision not pinned; §§2–4 scenario/adaptation/metric construction; §7 Table 7 five-shot, three demonstration selections and evaluation caps; §8.1 Figs. 24–25 calibration/accuracy differences | 2026-10-07 |
| P52 | technical report | Circuit Tracing: Revealing Computational Graphs in Language Models | Anthropic | Source version described in next column | https://transformer-circuits.pub/2025/attribution-graphs/methods.html | null | official documentation | dated 2025-03-27 web methodology; live page, no content hash pinned; cross-layer transcoders and local replacement model; validation/limitations; appendices “Validating Node-to-Logit Attributions” and feature-to-feature validation, 20-prompt procedures and Spearman 0.72; reconstruction versus perturbation faithfulness | 2026-10-07 |
| R1.1 | course | CS336: Language Modeling from Scratch | Stanford | Source version described in next column | https://cs336.stanford.edu/ | null | official documentation | live official course page; no content hash pinned; course's basics/systems/scaling/data/alignment organization; chapter source route, not a research-performance result | 2026-10-07 |
| R1.2 | course | CS336 Spring 2025 archive | Stanford | Source version described in next column | https://cs336.stanford.edu/spring2025/ | null | official documentation | dated course archive; archived course/assignment route; no claim that an assignment was executed | 2026-10-07 |
| R1.3 | paper | Model Cards for Model Reporting | Mitchell et al. | Source version described in next column | https://arxiv.org/pdf/1810.03993 | null | peer-reviewed | PDF header v2, 2019-01-14; FAT* 2019 paper; §4 and Fig. 1 reporting fields; §5 examples; supports reporting methodology, not a measured deployment-benefit claim | 2026-10-07 |
| R1.4 | paper | Datasheets for Datasets | Gebru et al. | Source version described in next column | https://arxiv.org/pdf/1803.09010 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §3 questionnaire: motivation, composition, collection, processing, uses, distribution, maintenance; routed through book_plan §07.5 | 2026-10-07 |
| R1.5 | paper | Hidden Technical Debt in Machine Learning Systems | Sculley et al. | Source version described in next column | https://papers.nips.cc/paper/5656-hidden-technical-debt-in-machine-learning-systems.pdf | null | peer-reviewed | NIPS 2015 full proceedings PDF; §§2–4 dependencies, entanglement, and feedback loops; supports system-level dependencies without establishing a universal mandatory training recipe | 2026-10-07 |
| R1.7 | paper | OLMo: Accelerating the Science of Language Models | Groeneveld et al. | Source version described in next column | https://arxiv.org/html/2402.00838v2 | null | preprint | arXiv v2 HTML; §§1, 3, 6 release scope, training, checkpoints and intermediate artifacts; report statements distinguished from current repository availability and independent rerun | 2026-10-07 |
| R1.9 | paper | BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding | Devlin et al. | Source version described in next column | https://arxiv.org/pdf/1810.04805 | null | peer-reviewed | PDF header v2, May 2019; NAACL paper; §3.1 masked bidirectional prediction; not a native autoregressive text generator | 2026-10-07 |
| R1.10 | paper | Denoising Diffusion Probabilistic Models | Ho, Jain, Abbeel | Source version described in next column | https://arxiv.org/pdf/2006.11239 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §3 Algorithms 1–2 training and iterative reverse sampling; routed through Berkeley AI Research | 2026-10-07 |
| R1.11 | paper | Energy and Policy Considerations for Deep Learning in NLP | Strubell, Ganesh, McCallum | Source version described in next column | https://aclanthology.org/P19-1355.pdf | null | peer-reviewed | ACL 2019 archival fulltext; §2 CPU/GPU/DRAM power, training duration, assumed PUE, energy estimates; recommendations distinguish reporting and measured outcomes; routed through ACL source surface | 2026-10-07 |
| R1.12 | paper | Carbon Emissions and Large Neural Network Training | Patterson et al. | Source version described in next column | https://arxiv.org/pdf/2104.10350 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; energy/carbon accounting and processor, datacenter, electricity-source factors; no cross-workload ratio is generalized in this chapter | 2026-10-07 |
| R1.14 | technical report | GPT-4 Technical Report | OpenAI | Source version described in next column | https://arxiv.org/pdf/2303.08774 | null | preprint | full PDF at unversioned URL; immutable revision not pinned; §2 report scope, autoregressive Transformer description and withheld technical fields; absence is specific to stated fields | 2026-10-07 |
| R1.15 | repository | DeepSeek-R1 repository README | DeepSeek | Source version described in next column | https://github.com/deepseek-ai/DeepSeek-R1 | null | official documentation | mutable default branch; commit not pinned; six distilled models and starting-checkpoint table; repository MIT license and upstream model-license qualifications | 2026-10-07 |
| R1.16 | model card | Llama-3.3-70B-Instruct model card | Meta | Source version described in next column | https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct | null | official documentation | mutable model-card page; revision not pinned; instruction-tuned 70B model, SFT/RLHF alignment, model-license conditions; corrects P26's broad “base models” wording for this student | 2026-10-07 |
| R1.17 | technical report | On the Opportunities and Risks of Foundation Models | Bommasani et al. | Source version described in next column | https://arxiv.org/html/2108.07258v3 | null | preprint | arXiv v3, 2022-07-12; §1.1 definition; §4.3 adaptation conditioned on access/data/resources; §4.4 evaluation and resource accounting; §4.10 pretraining/adaptation theoretical distinctions | 2026-10-07 |

The source routes are enumerated in the [chapter README](README.md#reference-stack-coverage). No ranking position, current endpoint price, or current engine-performance figure is asserted. Live pages and unversioned PDF surfaces require immutable pinning before the chapter can claim a complete reproducibility audit. Sources removed from the manuscript are not retained as supporting records.
