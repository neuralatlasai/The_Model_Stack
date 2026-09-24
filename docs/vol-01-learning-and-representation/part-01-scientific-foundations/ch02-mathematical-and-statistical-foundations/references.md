---
id: ms.references.2
entity_type: references
title: References — Chapter 02
short_title: References 02
volume: 1
part: 1
chapter: 2
section: null
slug: references
parent: ms.chapter.2
prev_sibling: ms.verification.2
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
siblings_by_mechanism: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: [P03, P08, P09, P25, P50]
implementations: [impl.pytorch, impl.jax, impl.liger-kernel]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED], empirically_observed: false}
word_count_target: 300
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# References — Chapter 02

Spine papers use their Appendix D ids. Other works use `R2.n`. A preprint's presence is not a claim of peer review. "Accessed" records the date the primary URL was opened by the author; works whose URL could not be attributed with confidence have `null` URL and Status = UNVERIFIED, and their bibliographic details are stated from memory.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P03 | paper | The Pile: An 800GB Dataset of Diverse Text for Language Modeling | Gao, Biderman, Black, Golding, Hoppe, Foster, Phang, He, Thite, Nabeshima, Presser, Leahy (EleutherAI) | arXiv, 2020 | https://arxiv.org/abs/2101.00027 | null | preprint | 2026-09-20 | §02.3: bits-per-byte definition (L_T/L_B · ℓ/ln 2) and the stated rationale of tokenizer invariance |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan, McCandlish, Henighan, Brown, Chess, Child, Gray, Radford, Wu, Amodei | arXiv, 2020 | https://arxiv.org/abs/2001.08361 | null | preprint | 2026-09-20 | §02.6: power-law loss dependence on N, D, C; allocation conclusion contrasted with P09 |
| P09 | paper | Training Compute-Optimal Large Language Models | Hoffmann, Borgeaud, Mensch, Buchatskaya, Cai, Rutherford, de Las Casas, Hendricks, Welbl, Clark, Hennigan, Noland, Millican, van den Driessche, Damoc, Guy, Osindero, Simonyan, Elsen, Rae, Vinyals, Sifre (Google DeepMind) | arXiv, 2022 | https://arxiv.org/abs/2203.15556 | null | preprint | 2026-09-20 | §02.6: parametric loss form fitted with Huber loss and L-BFGS; "scaled equally" allocation; differing exponents across three approaches |
| P25 | paper | DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models | Shao, Wang, Zhu, Xu, Song, Bi, Zhang, Zhang, Li, Wu, Guo (DeepSeek) | arXiv, 2024 | https://arxiv.org/abs/2402.03300 | null | preprint | 2026-09-20 | §02.2, §02.3: GRPO's per-token sampled KL estimator (its Eq. 4), described as unbiased and guaranteed positive |
| P50 | paper | Holistic Evaluation of Language Models | Liang, Bommasani, Lee et al. (Stanford CRFM) | arXiv 2022; TMLR 2023 | https://arxiv.org/abs/2211.09110 | null | peer-reviewed | 2026-09-20 | §02.5: multi-scenario, multi-metric evaluation design; scenario as a natural cluster |
| R2.1 | paper | A Mathematical Theory of Communication | Shannon | Bell System Technical Journal, 1948 | null | null | UNVERIFIED | — | README lineage: entropy and coding length |
| R2.2 | paper | Bootstrap Methods: Another Look at the Jackknife | Efron | Annals of Statistics, 1979 | null | null | UNVERIFIED | — | README lineage; §02.5: origin of resampling inference |
| R2.3 | paper | Simple statistical gradient-following algorithms for connectionist reinforcement learning (REINFORCE) | Williams | Machine Learning, 1992 | null | null | UNVERIFIED | — | README lineage: score-function estimator |
| R2.4 | paper | Auto-Encoding Variational Bayes | Kingma, Welling | arXiv, 2013 (ICLR 2014) | https://arxiv.org/abs/1312.6114 | null | preprint | 2026-09-20 | §02.4: reparameterisation estimator ("a reparameterization of the variational lower bound yields a lower bound estimator…") |
| R2.5 | paper | Optimizing Neural Networks with Kronecker-factored Approximate Curvature | Martens, Grosse | ICML 2015, PMLR 37:2408–2417 (archival page https://proceedings.mlr.press/v37/martens15.html opened) | https://arxiv.org/abs/1503.05671 | null | peer-reviewed | 2026-09-20 | §02.4: K-FAC as Kronecker-product approximation of per-layer Fisher blocks |
| R2.6 | paper | Automatic differentiation in machine learning: a survey | Baydin, Pearlmutter, Radul, Siskind | JMLR 18(153), 2018 (arXiv 2015) | https://arxiv.org/abs/1502.05767 | null | peer-reviewed | 2026-09-20 | README lineage; §02.4: forward vs reverse accumulation terminology |
| R2.7 | paper | Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations | Miller (Anthropic; affiliation confirmed on title page and on https://www.anthropic.com/research/statistical-approach-to-model-evals) | arXiv, 2024 | https://arxiv.org/abs/2411.00640 | null | preprint | 2026-09-20 | §02.5: CLT standard error (Eq. 1), clustered SE (Eq. 4), paired SE (Eq. 7), sample-size formula (Eq. 9); non-independence of question inclusion |
| R2.8 | documentation | PyTorch documentation, version 2.14: "Broadcasting semantics" and `torch.Tensor.expand` | PyTorch | docs.pytorch.org, 2.14 | https://docs.pytorch.org/docs/2.14/notes/broadcasting.html ; https://docs.pytorch.org/docs/2.14/generated/torch.Tensor.expand.html | https://github.com/pytorch/pytorch | official documentation | 2026-09-20 | §02.1: broadcasting rule; expand is a stride-0 view; operations on expanded views may materialise |
| R2.9 | repository | Liger Kernel README (`LigerFusedLinearCrossEntropyLoss`, chunk-by-chunk computation) | LinkedIn (Liger Kernel project) | GitHub, accessed 2026 | https://github.com/linkedin/Liger-Kernel | https://github.com/linkedin/Liger-Kernel | official documentation | 2026-09-20 | §02.3, §02.4: fused linear cross-entropy avoiding full logits materialisation; release-specific chunking UNVERIFIED |
| R2.10 | documentation | JAX documentation, "The Autodiff Cookbook" | JAX (Google) | docs.jax.dev, latest | https://docs.jax.dev/en/latest/notebooks/autodiff_cookbook.html | https://github.com/jax-ml/jax | official documentation | 2026-09-20 | §02.4: VJP/JVP ≈ 3× forward cost; reverse-mode memory scales with depth; forward-over-reverse HVP |
| R2.11 | documentation | PyTorch documentation, version 2.14: "Autograd mechanics" | PyTorch | docs.pytorch.org, 2.14 | https://docs.pytorch.org/docs/2.14/notes/autograd.html | https://github.com/pytorch/pytorch | official documentation | 2026-09-20 | §02.4: graph recording, saved tensors, `save_for_backward` |
| R2.12 | paper | New insights and perspectives on the natural gradient method | Martens | arXiv, 2014 (rev. 2020; JMLR) | https://arxiv.org/abs/1412.1193 | null | preprint | 2026-09-20 | §02.4: Fisher information equivalent to the generalized Gauss–Newton matrix in many cases |
| R2.13 | paper | Estimating or Propagating Gradients Through Stochastic Neurons for Conditional Computation | Bengio, Léonard, Courville | arXiv, 2013 | https://arxiv.org/abs/1308.3432 | null | preprint | 2026-09-20 | §02.4: straight-through estimator |
| R2.14 | paper | Gradient Estimation Using Stochastic Computation Graphs | Schulman, Heess, Weber, Abbeel | arXiv, 2015 (NIPS 2015) | https://arxiv.org/abs/1506.05254 | null | preprint | 2026-09-20 | §02.4: unified treatment of score-function and pathwise estimators |
| R2.15 | paper | Monte Carlo Gradient Estimation in Machine Learning | Mohamed, Rosca, Figurnov, Mnih | arXiv, 2019 (JMLR 2020) | https://arxiv.org/abs/1906.10652 | null | preprint | 2026-09-20 | §02.4: survey of pathwise, score-function, measure-valued estimators and their variance |
| R2.16 | paper | Deep Reinforcement Learning at the Edge of the Statistical Precipice | Agarwal, Schwarzer, Castro, Courville, Bellemare | NeurIPS 2021 (proceedings.neurips.cc abstract page opened) | https://arxiv.org/abs/2108.13264 | https://github.com/google-research/rliable | peer-reviewed | 2026-09-20 | §02.5: stratified bootstrap interval estimates and interquartile mean for few-run reporting |
| R2.17 | paper | Accounting for Variance in Machine Learning Benchmarks | Bouthillier et al. | arXiv, 2021 (MLSys 2021) | https://arxiv.org/abs/2103.03098 | null | preprint | 2026-09-20 | §02.5: variance from data sampling, initialisation, and hyperparameters; randomise many sources |
| R2.18 | course | CS336: Language Modeling from Scratch (Spring 2026) | Stanford University | cs336.stanford.edu, 2026 | https://cs336.stanford.edu/ | null | official documentation | 2026-09-20 | Chapter source anchor: stated prerequisites (calculus, linear algebra, probability and statistics, ML, Python, deep learning and systems) and syllabus topics |
| R2.19 | course | CS336: Language Modeling from Scratch (Spring 2025 archive) | Stanford University | cs336.stanford.edu, 2025 | https://cs336.stanford.edu/spring2025/ | null | official documentation | 2026-09-20 | Reproducible assignment references (Basics, Systems, Scaling, Data, Alignment and Reasoning RL) |

Notes on official code: `null` means no official repository was identified for the work; it is not a claim that none exists. The `rliable` repository for R2.16 is the one named by the paper's authors as their released library.
