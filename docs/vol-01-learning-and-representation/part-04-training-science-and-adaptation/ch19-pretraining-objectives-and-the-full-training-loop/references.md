---
id: ms.references.19
entity_type: references
title: References — Pretraining objectives and the full training loop
short_title: References 19
volume: 1
part: 4
chapter: 19
section: null
slug: references
parent: ms.chapter.19
prev_sibling: ms.verification.19
next_sibling: null
children: []
prerequisites: [ms.chapter.4, ms.chapter.6, ms.chapter.12]
downstream: [ms.chapter.20, ms.chapter.29, ms.chapter.30]
related: []
relations: []
axes: {lifecycle: [pretraining, evaluation], mechanism: [training_loop], feedback_setting: [], modality: [text, image]}
papers: [P02, P13, P44]
implementations: [impl.pytorch, impl.torchtitan, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [OFFICIAL-DOCUMENTATION, PAPER-REPORTED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# References — Chapter 19

Primary texts below were inspected on 2026-10-08 for §§19.1–19.6. The ledger distinguishes publication status, inspected revision, and executable verification. Reading a repository establishes its disclosed implementation surface; no entry asserts that its training procedure was executed.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P02 | paper | Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer | Colin Raffel et al.; Google | JMLR 21(140), 2020 | [Archival full text](https://jmlr.org/papers/volume21/20-074/20-074.pdf) | null | peer-reviewed | 2026-10-08 | §19.1: §3.1 baseline; §§3.3.1–3.3.5 and Tables 4–7 objective comparisons |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek-AI | 2024; inspected revision 2025 | [arXiv v2 full text](https://arxiv.org/html/2412.19437v2) | null | preprint | 2026-10-08 | §19.2: §4.2 Training Hyper-Parameters and §4.3 Long Context Extension; batch and sequence-length schedules |
| P44 | paper | Learning Transferable Visual Models From Natural Language Supervision | Alec Radford et al.; OpenAI | ICML, PMLR 139, 2021 | [Archival full text](https://proceedings.mlr.press/v139/radford21a/radford21a.pdf) | null | peer-reviewed | 2026-10-08 | §§19.1–19.2: §2.3 and Figure 3; symmetric batch-candidate objective |
| R19.2 | repository | TorchTitan trainer | PyTorch contributors | Commit-pinned repository | [Trainer](https://raw.githubusercontent.com/pytorch/torchtitan/dd4d4830c121aa5dc73ffeee85b1a5009bf91122/torchtitan/trainer.py) | [Official repository](https://github.com/pytorch/torchtitan) | official documentation | 2026-10-08 | §§19.1–19.2: Trainer.train_step, microbatch-group construction and valid-token-count collection/reduction |
| R19.3 | repository | TorchTitan loss components | PyTorch contributors | Commit-pinned repository | [Loss components](https://raw.githubusercontent.com/pytorch/torchtitan/dd4d4830c121aa5dc73ffeee85b1a5009bf91122/torchtitan/components/loss.py) | [Official repository](https://github.com/pytorch/torchtitan) | official documentation | 2026-10-08 | §§19.1–19.2: BaseLoss.__call__, global count division; CrossEntropyLoss and summed cross-entropy |
| R19.18 | paper | Efficient Training of Language Models to Fill in the Middle | Mohammad Bavarian et al.; OpenAI | 2022 | [Full text](https://arxiv.org/pdf/2207.14255) | null | preprint | 2026-10-08 | §19.1: §1.1 paired scale series; §3 PSM/SPM serialization; §4.4 context/document transform comparison |
| R19.19 | paper | Better & Faster Large Language Models via Multi-token Prediction | Fabian Gloeckle et al.; FAIR at Meta and collaborators | 2024 | [Full text](https://arxiv.org/pdf/2404.19737) | null | preprint | 2026-10-08 | §19.1: §2 methodology, shared trunk and independent heads; Figure 2 serialized head backward passes |
| R19.20 | documentation | CrossEntropyLoss | PyTorch contributors | 2.14 documentation namespace | [Reference](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html) | null | official documentation | 2026-10-08 | §19.2: class-index unreduced/mean equations, class weights and ignored targets; separate probability-target reduction |
| R19.21 | documentation | DistributedDataParallel | PyTorch contributors | 2.14 documentation namespace | [Reference](https://docs.pytorch.org/docs/2.14/generated/torch.nn.parallel.DistributedDataParallel.html) | null | official documentation | 2026-10-08 | §19.2: gradient-averaging note and no_sync warning requiring the forward pass inside the context |
| R19.22 | documentation | Automatic Mixed Precision examples | PyTorch contributors | 2.14 documentation namespace | [Examples](https://docs.pytorch.org/docs/2.14/notes/amp_examples.html) | null | official documentation | 2026-10-08 | §19.2: Gradient accumulation; Gradient clipping; scale constancy and effective-batch update ordering |
| R19.23 | documentation | Fixing Gradient Accumulation | Hugging Face Transformers team | First-party technical disclosure, 2024-10-16 | [Disclosure](https://huggingface.co/blog/gradient_accumulation) | null | official documentation | 2026-10-08 | §19.2: Where does it stem from? and How we're fixing it; historical mean-of-means defect and count-based correction |
| R19.24 | documentation | AdamW | PyTorch contributors | 2.14 documentation namespace | [Reference](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html) | null | official documentation | 2026-10-08 | §19.3: documented algorithm, state initialization and parameter groups |
| R19.25 | documentation | clip_grad_norm_ | PyTorch contributors | 2.14 documentation namespace | [Reference](https://docs.pytorch.org/docs/2.14/generated/torch.nn.utils.clip_grad_norm_.html) | null | official documentation | 2026-10-08 | §19.3: concatenated gradient norm, in-place mutation, nonfinite option |
| R19.26 | documentation | Saving and Loading Models | PyTorch contributors | Online tutorial | [Tutorial](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html) | null | official documentation | 2026-10-08 | §19.4: Saving & Loading a General Checkpoint for Inference and/or Resuming Training |
| R19.27 | documentation | Reproducibility | PyTorch contributors | 2.14 documentation namespace | [Note](https://docs.pytorch.org/docs/2.14/notes/randomness.html) | null | official documentation | 2026-10-08 | §19.4: opening reproducibility limits, sources of randomness and deterministic-operation scope |
| R19.28 | technical report | 2 OLMo 2 Furious | Allen Institute for AI research team | 2025 | [arXiv v1 full text](https://arxiv.org/html/2501.00656v1) | null | preprint | 2026-10-08 | §19.5: §§3.1,3.2,3.3.3; spike-batch investigation, diagnostic definition, initialization ablation, forward/backward discrepancy |

## P02

The stable JMLR article is the inspected version. §3.1.1 specifies the approximately 220M-parameter baseline; §3.1.2 specifies 524,288 pretraining steps, length 512, and 128 sequences. §3.3 defines and compares the objective alternatives. Historical settings are not recommended defaults for a 2026 run.

## P13

Revision: arXiv:2412.19437v2, 2025-02-18. Only the disclosed schedules are used in §19.2; no reconstruction of undisclosed microbatch decomposition is attributed to this report. The reported sequence-count schedule is not a direct measurement of valid-target counts after every objective mask.

## P44

Version: ICML 2021 archival PMLR PDF. The inspected method and Figure 3 specify candidate coupling. The book's singleton counterexample is independently derived and is not a reported CLIP experiment.

## R19.2

Commit: `dd4d4830c121aa5dc73ffeee85b1a5009bf91122`. Locator: `torchtitan/trainer.py`, `Trainer.train_step`, lines 313–356 in the fetched raw file. These lines collect local objective counts across microbatch groups and reduce counts over the data-parallel mesh. This inspection does not validate all downstream engine reductions or provide runtime measurements.

## R19.3

Same TorchTitan commit. Locator: `torchtitan/components/loss.py`, `BaseLoss.__call__`, lines 270–290; `CrossEntropyLoss` immediately below. The source accepts global loss counts and divides the computed summed loss by them. No CODE-VERIFIED claim is made because an executable check of that training path was not performed.

## R19.18

Inspected surface: the full PDF served by the unversioned arXiv URL on the access date. Its exact revision identifier was not established from the fetched text and remains UNVERIFIED. §3 states that the document is split before tokenization and that the separately encoded pieces are serialized with control tokens. §4.4 distinguishes context-level and document-level transformation. The paper's “free” claim is scoped to the paired capability comparison, not zero additional system overhead in every implementation.

## R19.19

Inspected surface: the full PDF served by the unversioned arXiv URL on the access date. Its exact revision identifier was not established from the fetched text and remains UNVERIFIED. §2 and Figure 2 support the memory-lifetime construction. The cited result concerns the proposed multi-head architecture; it does not establish a generic cost-free auxiliary objective.

## R19.20

Inspected surface: PyTorch 2.14 online API reference; page contents are not commit-pinned. Class-index weighted normalization and probability-target normalization must not be conflated. Installed package version and compatibility are UNVERIFIED.

## R19.21

Inspected surface: PyTorch 2.14 online API reference; page contents are not commit-pinned. The documented default averaging premise does not establish the behavior of a custom communication hook or another distributed engine. Installed runtime behavior is UNVERIFIED.

## R19.22

Inspected surface: PyTorch 2.14 online examples; page contents are not commit-pinned. Example ordering supports the numerical contract only. No accelerator, scaler configuration, or measured equivalence tolerance is inferred.

## R19.23

Inspected surface: dated 2024 first-party disclosure, online contents unpinned. The announced correction and rollout are historical. Claims about a current installed Transformers release remain UNVERIFIED until its exact code path is inspected and tested.

## R19.24

Inspected surface: PyTorch 2.14 AdamW reference, online contents not commit-pinned. The documented algorithm is used to locate optimizer mutation within the loop; Chapter 20 owns its full recurrence and alternatives. Installed fused/foreach behavior is UNVERIFIED.

## R19.25

Inspected surface: PyTorch 2.14 norm-clipping reference, online contents not commit-pinned. The returned norm and mutation semantics support the local boundary only; a distributed global norm requires separate ownership and reduction checks.

## R19.26

Inspected surface: online PyTorch tutorial, unpinned; its rendered header identified 2.14.0+cu130 documentation. That header does not identify an installed package or device runtime. The general-checkpoint example supports saving optimizer state and selecting training mode; full external-loader and storage closure is the book's explicit derived contract.

## R19.27

Inspected surface: PyTorch 2.14 reproducibility note, online contents not commit-pinned. Its environment boundary prevents a claim that an identical seed guarantees equality across devices or versions.

## R19.28

Revision: arXiv:2501.00656v1. Inspected locators: §3.1 for the non-deterministic relationship between repetition and spikes; §3.2 for the diagnostic and warmup-manipulated initialization comparison; §3.3.3 and Figure 8 for the forward/backward diagnostic discrepancy. The chapter does not transfer the source's alert threshold or infer a causal failure rule from it. Exact runtime details and independent replication of those experiments are not supplied by this book.

## Reference-stack coverage

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | 2 OpenAI | — | CLIP candidate construction and FIM serialization | https://github.com/openai | 19.1–19.2 | PAPER-REPORTED |
| §1 lab | 18 Google Research | — | T5 historical objective study | https://research.google/pubs/ | 19.1 | PAPER-REPORTED |
| §1 lab | 4 Meta AI / FAIR | — | Shared-trunk multi-token prediction and serial head execution | https://github.com/facebookresearch | 19.1 | PAPER-REPORTED |
| §1 lab | 8 DeepSeek | — | DeepSeek-V3 disclosed pretraining and context-extension schedules | https://github.com/deepseek-ai | 19.2 | PAPER-REPORTED |
| §1 lab | 22 Allen Institute for AI (Ai2) | — | OLMo 2 monitoring and stability ablations | https://allenai.org/papers | 19.5 | PAPER-REPORTED |
| §2 conference | 2 ICML | — | Archival CLIP paper, PMLR 139 | https://proceedings.mlr.press/ | 19.1–19.2 | PAPER-REPORTED |
| §3 discovery source | 1 arXiv | — | Full-text retrieval of identified reports; discovery is not independent evidence | https://arxiv.org/ | 19.1–19.2 | OFFICIAL-DOCUMENTATION |
| §4 system | 17 PyTorch | MODEL / AUTOGRAD FRAMEWORK | Reduction, numerical-scale ordering, updates, checkpointing and reproducibility | https://pytorch.org/docs/stable/ | 19.2–19.4 | OFFICIAL-DOCUMENTATION |
| §4 system | 21 TorchTitan | DISTRIBUTED TRAINING | Pinned trainer and loss interfaces | https://github.com/pytorch/torchtitan | 19.1–19.2 | OFFICIAL-DOCUMENTATION |
| §4 system | 26 Hugging Face Transformers | MODEL DEFINITION / ADAPTATION | Historical normalization-defect disclosure | https://huggingface.co/docs/transformers/ | 19.2 | OFFICIAL-DOCUMENTATION |

**Inspection dimensions applied.** Parallelism: rank averaging versus summation and target ownership (§§19.2,19.6). Precision: accumulation dtype and numerical scale (§§19.2–19.3). Memory: gradient/state arrays, snapshots, current graphs and logits (§§19.1–19.4,19.6). Communication: count reduction and gradient payload (§19.2). Checkpointing: consistent state and publication boundary (§19.4). Metrics: target counts and slice reductions (§§19.2,19.5). Reliability: empty/nonfinite windows, acceptance and replay (§§19.2–19.6). Reproducibility: record ordering, masks, revisions, reduction and state identities (all sections). Kernels are discussed through allocation and fusion boundaries; executable compatibility is UNVERIFIED. Post-training and inference-engine behavior are outside the training-loop derivation.

**Outside the reference stack (routed via book_plan.md anchors).** JMLR hosts the archival P02 paper named by Appendix D. The multi-token prediction work R19.19 elaborates the auxiliary-objective coverage required by the Chapter 19 matrix and the P13 source spine; it is a research source, not an additional unlisted training system.

## Evidence gaps

| Gap | Status | Consequence |
|---|---|---|
| Reader's installed framework, kernels, communication hooks, and runtime | UNVERIFIED | No executable compatibility claim |
| Independent execution of Algorithm 19.2 and training-resume protocol | UNVERIFIED | Keep manuscript_draft; do not claim measured training equivalence |
| Matched cross-family contemporary objective comparison | NOT-DISCLOSED | No universal objective ranking |
| Measured energy, money, latency, or throughput for the book recipe | NOT-DISCLOSED | No performance or economics claim |
| Training procedures and proposed gates | UNVERIFIED | All six sections remain manuscript_draft; no measured validation is claimed |
