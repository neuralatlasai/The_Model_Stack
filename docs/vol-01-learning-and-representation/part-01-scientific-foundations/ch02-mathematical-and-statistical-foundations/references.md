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
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# References — Chapter 02

Inspection date is **2026-10-07** for rows carrying that date. Each inspected item below records the full-text or official API surface actually opened; an earlier draft's access date is not inherited. A versioned documentation URL identifies the inspected documentation edition, not an executed package. Mutable `main`/`latest` surfaces are unpinned. Original papers can be inspected through an institutional archival copy without making the hosting institution the author.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P03 | paper | The Pile: An 800GB Dataset of Diverse Text for Language Modeling | Gao et al.; EleutherAI | arXiv, 2020 | https://arxiv.org/html/2101.00027v1 | null | preprint | 2026-10-08 | Initially inspected 2026-10-07; supplemental inspection 2026-10-08. Inspected v1 full text: §3.1 BPB definition and split policy; §3.2 document-level evaluation; Table 7 token/byte ratios; Appendix E.2 and Tables 2/8 likelihood protocol. Used in §02.3. |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan et al.; OpenAI, Johns Hopkins University | arXiv, 2020 | https://arxiv.org/html/2001.08361v1 | null | preprint | 2026-10-07 | Inspected v1: §§2.1–2.3 training/accounting/data; §6.1, Eq. (6.1), Figure 14 allocation; §6.3 caveats. Historical comparison in §02.6; no current universal allocation claim. |
| P09 | paper | Training Compute-Optimal Large Language Models | Hoffmann et al.; DeepMind | arXiv, 2022 | https://arxiv.org/html/2203.15556v1 | null | preprint | 2026-10-07 | Inspected v1: §§3.1–3.3; Eqs. (2)–(4); Table 2; Appendix D.2 fitting; Appendix F FLOP accounting. Positive fitted family, Huber/log-loss/L-BFGS, multiple starts, approach-dependent allocation in §02.6. |
| P25 | paper | DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models | Shao et al.; DeepSeek-AI and collaborators | arXiv, 2024 | https://arxiv.org/html/2402.03300v2 | null | preprint | 2026-10-08 | Initially inspected 2026-10-07; supplemental inspection 2026-10-08. Inspected v2: §§4.1–4.2, Eqs. (3)–(4), Algorithm 1 and Table 5; sampled KL expression and its placement relative to old-policy rollout distribution. §02.2/02.3 derive support/value-versus-gradient conditions independently; no isolated KL-estimator gain claimed. |
| P50 | paper | Holistic Evaluation of Language Models | Liang et al.; Stanford CRFM and collaborators | TMLR, 2023; preprint 2022 | https://arxiv.org/html/2211.09110v2 | null | peer-reviewed | 2026-10-07 | Inspected v2: evaluation scenario/metric framework and evaluation setup. §02.5 uses only scenario-versus-metric separation; a scenario is not automatically an independent resampling unit. |
| R2.1 | paper | A Mathematical Theory of Communication | Claude E. Shannon | Bell System Technical Journal 27, 1948 | https://www.cs.yale.edu/homes/yry/readings/general/shannon1948.pdf | null | peer-reviewed | 2026-10-08 | Corrected reprint of original two-part paper, full PDF opened; Part I §§6–9, entropy properties and noiseless coding, especially Theorem 9. §02.3 supplies its own interval/Kraft derivations, rather than attributing modern arithmetic implementation details to Shannon. |
| R2.2 | paper | Bootstrap Methods: Another Look at the Jackknife | Bradley Efron | Annals of Statistics 7(1), 1979 | https://projecteuclid.org/journals/annals-of-statistics/volume-7/issue-1/Bootstrap-Methods-Another-Look-at-the-Jackknife/10.1214/aos/1176344552.full | null | UNVERIFIED | null | Historical bibliography only. Publisher full/PDF fetch returned no usable primary text on attempted inspection; no method detail or BCa guarantee is attributed to this uninspected item. Current bootstrap treatment is explicitly reconstructed and bounded; reported protocol comes from R2.16. |
| R2.3 | paper | Simple statistical gradient-following algorithms for connectionist reinforcement learning | Ronald J. Williams | Machine Learning 8, 1992 | https://doi.org/10.1007/BF00992696 | null | UNVERIFIED | null | Historical bibliography only. Publisher metadata located; original full-text fetch unsuccessful. No full-method claim inherits verification from the prior draft; the score identity is derived in §02.4 and stochastic-DAG treatment uses inspected R2.14. |
| R2.4 | paper | Auto-Encoding Variational Bayes | Diederik P. Kingma, Max Welling | ICLR, 2014 | https://arxiv.org/html/1312.6114v11 | null | preprint | 2026-10-07 | Inspected v11: §§2.3–2.4, Eqs. (4)–(7), Algorithm 1; §5 experiments and Appendices C–E. §02.4 reconstructs transformed-noise gradient and limits its empirical comparison to latent-variable experiments. |
| R2.5 | paper | Optimizing Neural Networks with Kronecker-factored Approximate Curvature | James Martens, Roger Grosse | ICML, 2015; expanded preprint | https://arxiv.org/html/1503.05671v5 | null | preprint | 2026-10-07 | Inspected expanded v5: §§3–4 factored blocks/inverse approximation; §§6–8 damping/efficiency; §13 experiments on MNIST/CURVES/FACES autoencoders and momentum baseline. §02.4 distinguishes simplified block-diagonal reconstruction from full paper variants and corrects application complexity. |
| R2.6 | paper | Automatic Differentiation in Machine Learning: A Survey | Baydin, Pearlmutter, Radul, Siskind | JMLR 18(153), 2018 | https://jmlr.org/papers/volume18/17-468/17-468.pdf | null | peer-reviewed | 2026-10-07 | Archival JMLR PDF opened; §3, automatic differentiation and accumulation modes. Lineage/terminology only; derivative identities and work counts are shown in §02.4. |
| R2.7 | paper | Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations | Evan Miller; Anthropic | arXiv, 2024 | https://arxiv.org/pdf/2411.00640 | null | preprint | 2026-10-07 | PDF identifies arXiv v1, November 2024. Inspected §§2.1–2.2, Eqs. (1)–(4); §3 conditional variance; §4.2, Eq. (7); §5, Eq. (9); Appendix A. Table 4 contains actual clustered/naive SE comparison; Tables 1–3/5 fictional models are not empirical evidence. |
| R2.8 | documentation | Broadcasting semantics; torch.Tensor.expand | PyTorch | Documentation 2.14 | https://docs.pytorch.org/docs/2.14/notes/broadcasting.html | https://github.com/pytorch/pytorch | official documentation | 2026-10-07 | Stable-route Continue link followed to 2.14. Inspected General semantics and In-place semantics, plus https://docs.pytorch.org/docs/2.14/generated/torch.Tensor.expand.html, description/Note/Warning. §02.1: trailing-axis rules, stride-zero view, materialization and mutation caveats. |
| R2.9 | repository | Liger Kernel README | LinkedIn / Liger Kernel project | GitHub main, unpinned | https://github.com/linkedin/Liger-Kernel/blob/main/README.md | https://github.com/linkedin/Liger-Kernel | official documentation | 2026-10-07 | Inspected Low-level APIs, LigerFusedLinearCrossEntropyLoss example and chunked-computation comment. Interface-level support in §§02.3–02.4; exact commit, chunk selection, measured memory/time UNVERIFIED. |
| R2.10 | documentation | The Autodiff Cookbook | JAX contributors | latest, unpinned | https://docs.jax.dev/en/latest/notebooks/autodiff_cookbook.html | https://github.com/jax-ml/jax | official documentation | 2026-10-07 | Inspected Jacobian-vector products; Vector-Jacobian products; Jacobians/Hessians using jacfwd/jacrev; Hessian-vector products using both forward- and reverse-mode. §02.4 transformation contracts and qualified arithmetic/memory discussion; no executed package or wall-time multiplier. |
| R2.11 | documentation | Autograd mechanics | PyTorch | Documentation 2.14 | https://docs.pytorch.org/docs/2.14/notes/autograd.html | https://github.com/pytorch/pytorch | official documentation | 2026-10-07 | Stable-route Continue link followed to 2.14. Inspected How autograd encodes the history; Saved tensors; Gradients for non-differentiable functions; Division by Zero in Autograd. §02.4 execution contract; numerical implementation details canonically Chapter 03. |
| R2.12 | paper | New insights and perspectives on the natural gradient method | James Martens | revised preprint; JMLR version 2020 | https://arxiv.org/html/1412.1193v8 | null | preprint | 2026-10-07 | Inspected v8: §§8–9, Eqs. (5)–(6), Fisher/GGN conditions; §10 damping; §11 empirical Fisher distinction. §02.4 limits equality to the applicable output distribution/parameterization. |
| R2.13 | paper | Estimating or Propagating Gradients Through Stochastic Neurons for Conditional Computation | Bengio, Léonard, Courville | arXiv, 2013 | https://arxiv.org/html/1308.3432v1 | null | preprint | 2026-10-07 | Inspected v1: §3 baseline analysis; §4 Straight-Through Estimator, Eq. (13); §5 conditional-computation experiments and Table 1. §02.4 copied/surrogate derivative and its bias; no universal accuracy claim. |
| R2.14 | paper | Gradient Estimation Using Stochastic Computation Graphs | Schulman, Heess, Weber, Abbeel | NIPS, 2015 | https://arxiv.org/html/1506.05254v3 | null | preprint | 2026-10-07 | Inspected v3: §2.1 score/pathwise estimators and conditions; §2.2 stochastic DAG; §3 Theorem 1 and surrogate-loss construction. §02.4 gradient contributions and descendant-cost selection. |
| R2.15 | paper | Monte Carlo Gradient Estimation in Machine Learning | Mohamed, Rosca, Figurnov, Mnih | JMLR 21, 2020 | https://jmlr.org/papers/volume21/19-346/19-346.pdf | null | peer-reviewed | 2026-10-07 | Archival PDF opened; gradient-estimation families and estimator-selection discussion. Supplemental taxonomy only; original-method claims use R2.4/R2.13/R2.14 and explicit derivations. |
| R2.16 | paper | Deep Reinforcement Learning at the Edge of the Statistical Precipice | Agarwal et al. | NeurIPS, 2021 | https://arxiv.org/html/2108.13264v1 | https://github.com/google-research/rliable | preprint | 2026-10-07 | Inspected v1: §2 estimand; §3 Atari 100k protocol; §§4.1–4.3 stratified intervals/profiles/IQM; Figure 6 coverage; Appendix A.5 bootstrap methods. §02.5 source-reported repeated-run evidence; library code not executed. |
| R2.17 | paper | Accounting for Variance in Machine Learning Benchmarks | Bouthillier et al. | MLSys, 2021 | https://proceedings.mlsys.org/paper_files/paper/2021/file/0184b0cd3cfb185989f858a1d9f5c1eb-Paper.pdf | null | peer-reviewed | 2026-10-07 | Archival proceedings PDF opened; §§2–4 training-pipeline model, variance sources, comparison estimators/experiments. §02.5 distinguishes uncertainty conditional on a checkpoint from pipeline variation. |
| R2.18 | course | CS336: Language Modeling from Scratch | Stanford University | Spring 2026 | https://cs336.stanford.edu/ | null | official documentation | 2026-10-07 | Current course page opened; prerequisites, syllabus/schedule, assignments. Chapter-plan route for mathematical prerequisites only; course is not the evidence for originating method findings. |
| R2.19 | course | CS336: Language Modeling from Scratch | Stanford University | Spring 2025 archive | https://cs336.stanford.edu/spring2025/ | null | official documentation | 2026-10-07 | Archived course page opened; prerequisites and assignment list. Historical curriculum route only. |
| R2.20 | documentation | torch.multinomial; torch.nn.functional.cross_entropy | PyTorch | Documentation 2.14 | https://docs.pytorch.org/docs/2.14/generated/torch.multinomial.html | https://github.com/pytorch/pytorch | official documentation | 2026-10-07 | Inspected multinomial signature/Note/Parameters: finite nonnegative weights, nonzero row sum, replacement distinction. Also inspected https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.cross_entropy.html, shape/reduction contracts. §02.2 does not infer a sampling kernel from the API. |

## Evidence gaps and review consequence

R2.2 and R2.3 remain uninspected original texts; their historical entries are not evidence for a detailed mechanism or result. Mathematical derivations are explicit in the manuscript, and later inspected method papers support attributed mechanisms. Exact historical attribution review remains open.

No repository commit, executable environment, package behavior, timing, energy, or memory-profile check was performed. API documentation and an unpinned README do not warrant CODE-VERIFIED. Published omitted run configurations remain NOT-DISCLOSED at the relevant claim; no value was inferred from an organization or model name. Chapter status remains `manuscript_draft` until its mathematical, numerical, provenance, and full topic-completeness gates are independently checked.
