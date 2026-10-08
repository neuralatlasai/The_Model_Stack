---
id: ms.references.20
entity_type: references
title: References - Optimization and training stability
short_title: References 20
volume: 1
part: 4
chapter: 20
section: null
slug: references
parent: ms.chapter.20
prev_sibling: null
next_sibling: null
children: []
prerequisites: [ms.chapter.2, ms.chapter.3, ms.chapter.19]
downstream: [ms.chapter.21, ms.chapter.22, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.6, ms.chapter.13]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, continued_training, evaluation], mechanism: [optimization, training_stability], feedback_setting: [], modality: [text, image]}
papers: [P13]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---
# References - Chapter 20

[DERIVED] The table registers the primary works and official documentation used by this chapter. Full-text inspection occurred on 2026-10-08. Status describes the work, not an independent reproduction. Documentation version numbers describe the inspected pages; no installed runtime version is asserted. Official code is left unclaimed because repositories and training runs were not executed or audited.

| Key | Type | Work | Authors/organisation | Venue/year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P13 | paper | DeepSeek-V3 Technical Report | DeepSeek-AI | Technical report, 2024/2025 | [Primary source](https://arxiv.org/html/2412.19437v2) | - | preprint | 2026-10-08 | Router control, FP8 ablations, production schedule |
| R20.1 | paper | Adam: A Method for Stochastic Optimization | Diederik P. Kingma; Jimmy Ba | ICLR 2015 | [Primary source](https://arxiv.org/pdf/1412.6980v9) | - | peer-reviewed | 2026-10-08 | Raw moments, bias correction, original algorithm |
| R20.2 | paper | Decoupled Weight Decay Regularization | Ilya Loshchilov; Frank Hutter | ICLR 2019 | [Primary source](https://arxiv.org/html/1711.05101v3) | - | peer-reviewed | 2026-10-08 | AdamW versus coupled L2 regularization |
| R20.3 | paper | Adafactor: Adaptive Learning Rates with Sublinear Memory Cost | Noam Shazeer; Mitchell Stern | 2018 | [Primary source](https://arxiv.org/pdf/1804.04235v1) | - | preprint | 2026-10-08 | Factored statistics, update clipping, relative steps, WMT ablations |
| R20.4 | paper | Muon is Scalable for LLM Training | Moonshot AI research team | 2025 | [Primary source](https://arxiv.org/html/2502.16982v1) | - | preprint | 2026-10-08 | Moonlight, rectangular calibration, distributed state, compute fit |
| R20.5 | paper | Tensor Programs V: Tuning Large Neural Networks via Zero-Shot Hyperparameter Transfer | Greg Yang et al. | 2022 | [Primary source](https://arxiv.org/pdf/2203.03466) | - | preprint | 2026-10-08 | Maximal-update parameterization and IWSLT transfer protocol |
| R20.6 | paper | An Empirical Model of Large-Batch Training | Sam McCandlish; Jared Kaplan; Dario Amodei; OpenAI Dota Team | OpenAI, 2018 | [Primary source](https://arxiv.org/pdf/1812.06162) | - | preprint | 2026-10-08 | Gradient-noise scale, curvature-aware and simplified proxies |
| R20.7 | paper | Scaling Laws and Compute-Optimal Training Beyond Fixed Training Durations | Alexander Hagele et al. | NeurIPS 2024 | [Primary source](https://arxiv.org/html/2405.18392v3) | - | peer-reviewed | 2026-10-08 | Reusable cooldowns, 1-sqrt schedule, duration ablations |
| R20.8 | paper | Understanding Warmup-Stable-Decay Learning Rates: A River Valley Loss Landscape Perspective | Kaiyue Wen; Zhiyuan Li; Jason Wang; David Hall; Percy Liang; Tengyu Ma | 2024 | [Primary source](https://arxiv.org/html/2410.05192v3) | - | preprint | 2026-10-08 | WSD, WSD-S, reciprocal cooldown, branch-budget comparisons |
| R20.9 | paper | Straight to Zero: Why Linearly Decaying the Learning Rate to Zero Works Best for LLMs | Shane Bergsma; Nolan Dey; Gurpreet Gosal; Gavia Gray; Daria Soboleva; Joel Hestness | ICLR 2025 | [Primary source](https://arxiv.org/html/2502.15938v2) | - | peer-reviewed | 2026-10-08 | Linear decay-to-zero, budget-dependent negative evidence, replication slice |
| R20.10 | paper | 2 OLMo 2 Furious | OLMo Team; Allen Institute for AI | 2025 | [Primary source](https://arxiv.org/html/2501.00656v2) | - | preprint | 2026-10-08 | Initialization, norms, epsilon, repetition, z-loss backward discrepancy |
| R20.11 | paper | Kimi K2: Open Agentic Intelligence | Kimi Team; Moonshot AI | 2025/2026 | [Primary source](https://arxiv.org/html/2507.20534v2) | - | preprint | 2026-10-08 | MuonClip, positive attention maxima, MLA-specific control, production evidence |
| R20.12 | paper | Depthwise Hyperparameter Transfer in Residual Networks: Dynamics and Scaling Limit | Blake Bordelon; Lorenzo Noci; Mufan Li; Boris Hanin; Cengiz Pehlevan | 2023/2024 | [Primary source](https://arxiv.org/html/2309.16620v2) | - | preprint | 2026-10-08 | Residual depth scaling and conditional transfer |
| R20.13 | paper | Hyperparameter Transfer Enables Consistent Gains of Matrix-Preconditioned Optimizers Across Scales | Shikai Qiu; Zixi Chen; Hoang Phan; Qi Lei; Andrew Gordon Wilson | NeurIPS 2025 | [Primary source](https://arxiv.org/html/2512.05620v2) | - | peer-reviewed | 2026-10-08 | Optimizer-specific width transfer and compute comparisons |
| R20.14 | paper | Completed Hyperparameter Transfer across Modules, Width, Depth, Batch and Duration | Bruno Mlodozeniec; Pierre Ablin; Louis Bethune; Dan Busbridge; Michal Klein; Jason Ramapuram; Marco Cuturi | 2025 | [Primary source](https://arxiv.org/html/2512.22382v1) | - | preprint | 2026-10-08 | Complete(d)P and per-module, multi-axis transfer |
| R20.15 | paper | Muon+: Towards More Effective Muon via One Additional Normalization Step for LLM Pre-training | Ruijie Zhang; Yequan Zhao; Ziyue Liu; Zhengyang Wang; Yupeng Su; Liyan Tan; Zheng Zhang | 2026 | [Primary source](https://arxiv.org/html/2602.21545v3) | - | preprint | 2026-10-08 | Post-transform normalization, imbalance analysis, GPT/Llama comparisons |
| R20.16 | paper | Spectral Scaling Laws of Muon | Gagik Magakyan; Pablo Parrilo; Asuman Ozdaglar | 2026 | [Primary source](https://arxiv.org/html/2606.04058v2) | - | preprint | 2026-10-08 | Momentum spectra and bounded frontier extrapolation |
| R20.17 | paper | Scaling Muon for Diffusion Transformers | Chenghao Li et al.; USC and Meta | 2026 | [Primary source](https://arxiv.org/html/2608.20818v3) | - | preprint | 2026-10-08 | Periodic row geometry, sharding, time/quality distinction |
| R20.18 | paper | On the Convergence of Adam and Beyond | Sashank J. Reddi; Satyen Kale; Sanjiv Kumar | ICLR 2018 | [Primary source](https://arxiv.org/pdf/1904.09237v1) | - | peer-reviewed | 2026-10-08 | Adam counterexample and conditional AMSGrad convergence |
| R20.19 | documentation | torch.optim.AdamW | PyTorch contributors | PyTorch 2.14 | [Primary source](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html) | - | official documentation | 2026-10-08 | Formula, implementation paths, memory, state loading |
| R20.20 | documentation | torch.optim.Muon | PyTorch contributors | PyTorch 2.14 | [Primary source](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Muon.html) | - | official documentation | 2026-10-08 | Finite coefficients, parameter eligibility, rate adjustment |
| R20.21 | documentation | torch.optim.Adafactor | PyTorch contributors | PyTorch 2.14 | [Primary source](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Adafactor.html) | - | official documentation | 2026-10-08 | Implementation differences from the paper |
| R20.22 | documentation | torch.optim.SGD | PyTorch contributors | PyTorch 2.14 | [Primary source](https://docs.pytorch.org/docs/2.14/generated/torch.optim.SGD.html) | - | official documentation | 2026-10-08 | Momentum initialization, dampening and rate conventions |
| R20.23 | documentation | torch.optim | PyTorch contributors | PyTorch 2.14 | [Primary source](https://docs.pytorch.org/docs/2.14/optim.html) | - | official documentation | 2026-10-08 | Parameter groups, schedule ordering and optimizer interface |
| R20.24 | documentation | torch.optim.lr_scheduler.CosineAnnealingLR | PyTorch contributors | PyTorch 2.14 | [Primary source](https://docs.pytorch.org/docs/2.14/generated/torch.optim.lr_scheduler.CosineAnnealingLR.html) | - | official documentation | 2026-10-08 | Cosine schedule without automatic restarts |
| R20.25 | documentation | torch.nn.utils.clip_grad_norm_ | PyTorch contributors | PyTorch 2.14 | [Primary source](https://docs.pytorch.org/docs/2.14/generated/torch.nn.utils.clip_grad_norm_.html) | - | official documentation | 2026-10-08 | Global norm semantics and nonfinite handling |
| R20.26 | documentation | Automatic Mixed Precision examples | PyTorch contributors | PyTorch 2.14 | [Primary source](https://docs.pytorch.org/docs/2.14/notes/amp_examples.html) | - | official documentation | 2026-10-08 | Unscale, clipping, accumulation and per-optimizer skip behavior |
| R20.27 | paper | The Llama 3 Herd of Models | Aaron Grattafiori et al.; Meta | 2024 | [Primary source](https://arxiv.org/html/2407.21783v3) | - | preprint | 2026-10-08 | Numerical configuration checks and infrastructure recovery statistics |
| R20.28 | documentation | CS336: Language Modeling from Scratch, Spring 2026 | Stanford University | 2026 | [Primary source](https://cs336.stanford.edu/) | - | official documentation | 2026-10-08 | Curriculum anchor for optimization and training science |
| R20.29 | paper | MiniCPM: Unveiling the Potential of Small Language Models with Scalable Training Strategies | Shengding Hu et al. | 2024 | [Primary source](https://arxiv.org/html/2404.06395v2) | - | preprint | 2026-10-08 | Production WSD lineage and mixed recipe changes |
| R20.30 | documentation | Muon: An optimizer for hidden layers in neural networks | Keller Jordan | Author technical article, 2024 | [Primary source](https://kellerjordan.github.io/posts/muon/) | - | official documentation | 2026-10-08 | Originating finite Newton-Schulz algorithm and design motivation |
| R20.31 | paper | Fantastic Pretraining Optimizers and Where to Find Them | Kaiyue Wen; David Hall; Tengyu Ma; Percy Liang | 2025 | [Primary source](https://arxiv.org/pdf/2509.02046v2) | - | preprint | 2026-10-08 | Tuning allocation, multi-budget endpoint comparison, fitted token equivalents |

## Full-text inspection ledger

| Source | Revision and inspected locators | Boundary |
|---|---|---|
| P13 | v 2; Sections 2.1, 3.3, 4.2; full HTML | Source-reported methods/results; no independent execution. |
| R20.1 | v 9, 2017-01-30; Algorithm 1, Sections 2-3, 6; full PDF | Source-reported methods/results; no independent execution. |
| R20.2 | v 3; Section 2, Algorithm 2, Section 4; full HTML | Source-reported methods/results; no independent execution. |
| R20.3 | v 1, 2018-04-11; Algorithms 4-6, Section 3, Table 2; full PDF | Source-reported methods/results; no independent execution. |
| R20.4 | v 1; Sections 2-3 and appendices; full HTML; v 2 HTML unavailable at inspection | Source-reported methods/results; no independent execution. |
| R20.5 | Retrieved full PDF; Tables 3, 8-9, Section 7, Appendix D; no unverified revision identifier assigned | Source-reported methods/results; no independent execution. |
| R20.6 | Retrieved full PDF; Section 2, Equations 2.5-2.10, Section 3, Appendices A-B | Source-reported methods/results; no independent execution. |
| R20.7 | v 2 and v 3 full HTML inspected; v 3 Sections 3-4, Figures 3-6, Appendix B | Source-reported methods/results; no independent execution. |
| R20.8 | v 2 and v 3 full HTML inspected; Section 5 and experimental appendices | Source-reported methods/results; no independent execution. |
| R20.9 | v 1 and v 2 full HTML inspected; v 2 Sections 3-6, Figures 5-8, Appendix C | Source-reported methods/results; no independent execution. |
| R20.10 | v 2; Section 3.3 and Figures 3-10; full HTML | Source-reported methods/results; no independent execution. |
| R20.11 | v 2, 2026-02-03; Section 2.1, Algorithm 1, Appendix D; full HTML | Source-reported methods/results; no independent execution. |
| R20.12 | v 2; theory sections, convolution/ViT experiments and depth ablations; full HTML | Source-reported methods/results; no independent execution. |
| R20.13 | v 1 and v 2 full HTML inspected; v 2 Sections 3-4, Appendices B, E, H | Source-reported methods/results; no independent execution. |
| R20.14 | v 1; Sections 2-3, Table 1, Appendix C; full HTML | Source-reported methods/results; no independent execution. |
| R20.15 | v 1 and v 3 full HTML inspected; v 3 Sections 2-3, Tables 1-2, Appendix C/E/F; revision 2026-05-14 | Source-reported methods/results; no independent execution. |
| R20.16 | v 1 and v 2 full HTML inspected; v 2 Section 3, Appendix A; revision 2026-06-05 | Source-reported methods/results; no independent execution. |
| R20.17 | v 1 and v 3 full HTML inspected; v 3 Sections 2-4, Tables 1-2, Appendices B-E; revision 2026-08-26; v 2 withdrawn | Source-reported methods/results; no independent execution. |
| R20.18 | v 1, 2019-04-19; Sections 3-5 and proof appendices; full PDF | Source-reported methods/results; no independent execution. |
| R20.19 | Versioned 2.14 page; algorithm, options, state_dict/load_state_dict; full page | Documented interface/design; no runtime test. |
| R20.20 | Versioned 2.14 page; algorithm, warnings, adjust_lr_fn, state loading; full page | Documented interface/design; no runtime test. |
| R20.21 | Versioned 2.14 page; algorithm and implementation-difference notes; full page | Documented interface/design; no runtime test. |
| R20.22 | Versioned 2.14 page; algorithm and momentum notes; full page | Documented interface/design; no runtime test. |
| R20.23 | Versioned 2.14 page; per-parameter options and learning-rate scheduling; full page | Documented interface/design; no runtime test. |
| R20.24 | Versioned 2.14 page; definition, T_max, recurrence and restart distinction; full page | Documented interface/design; no runtime test. |
| R20.25 | Versioned 2.14 page; function contract, error_if_nonfinite, return value; full page | Documented interface/design; no runtime test. |
| R20.26 | Versioned 2.14 page; working with unscaled gradients, accumulation, multiple optimizers; full page | Documented interface/design; no runtime test. |
| R20.27 | v 3; Sections 3.3.2-3.3.4; full HTML; 466 interruptions, 47 planned, 419 unexpected | Source-reported methods/results; no independent execution. |
| R20.28 | Spring 2026 course page inspected; curriculum only, not a source of experimental claims | Documented interface/design; no runtime test. |
| R20.29 | v 2; scaling and WSD sections, experimental appendices; full HTML | Source-reported methods/results; no independent execution. |
| R20.30 | Full author article; code and update definition; not used as a convergence theorem | Documented interface/design; no runtime test. |
| R20.31 | v 2; Sections 3-4, Tables 1-4, Appendix B/G; full 108-page PDF; arXiv stamp 2025-09-04, cover 2025-09-08 | Source-reported methods/results; no independent execution. |

## Version and evidence limits

[DERIVED] Several source pages have later revisions than their first inspected text. Their latest accessible revisions were additionally checked where the manuscript relies on updated 2026 evidence: R20.15 v 3, R20.16 v 2, and R20.17 v 3. Earlier and current schedule/transfer revisions are recorded separately in the ledger. R20.4 remains pinned to v 1 because the attempted v 2 HTML did not yield a readable full text; its claims are not silently attributed to v 2.

[DERIVED] R20.28 establishes the curriculum connection only. R20.30 is the originating author article for the finite algorithm, not peer-reviewed empirical confirmation. Experimental outcomes elsewhere are attributed to the corresponding primary paper. The manuscript includes no new training results, benchmark runs, seed confidence intervals, or independently verified production incident trace.
