---
id: ms.references.4
entity_type: references
title: Chapter 04 references
short_title: References 04
volume: 1
part: 1
chapter: 4
section: null
slug: references
parent: ms.chapter.4
prev_sibling: ms.verification.4
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
siblings_by_mechanism: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: [P01, P02, P03, P08, P10, P13, P35, P44]
implementations: [impl.pytorch, impl.torchtitan, impl.liger-kernel, impl.nvidia-megatron-core, impl.megatron-lm, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, KNOWN, UNVERIFIED], empirically_observed: false}
word_count_target: 300
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# References - Chapter 04

The following primary full texts and official surfaces were inspected on **2026-10-07**. Each row records the actual surface and methodological locator. Unpinned renderings and repository branches are explicitly identified. Source inspection is not code execution, empirical reproduction, or a new verification of every publication venue. Abstract-only inspection supports identity only.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/1706.03762 | null | UNVERIFIED | 2026-10-07 | 3.1 shifted causal decoder; 3.2 cross-attention; 5.1-5.4 protocol and smoothing; Tables2-3; PAPER-REPORTED |
| P02 | paper | Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer | Raffel et al. | JMLR21(140),2020, full journal PDF | https://www.jmlr.org/papers/volume21/20-074/20-074.pdf | null | UNVERIFIED | 2026-10-07 | 3.1 baseline; 3.2 architecture; 3.3.1-3.3.4 objectives; Tables4-7; 3.7 final model distinguished from ablations; PAPER-REPORTED |
| P03 | paper | The Pile: An 800GB Dataset of Diverse Text for Language Modeling | Gao et al. | Full-text rendering, revision not pinned; arXiv2021 | https://ar5iv.labs.arxiv.org/html/2101.00027 | null | UNVERIFIED | 2026-10-07 | Evaluation and bits-per-byte definition; byte and tokenizer comparability; PAPER-REPORTED |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/2001.08361 | null | UNVERIFIED | 2026-10-07 | Loss-scaling formulation; lineage only here, quantitative teaching belongs to21; PAPER-REPORTED |
| P10 | paper | Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity | Fedus et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/2101.03961 | null | UNVERIFIED | 2026-10-07 | 2.2 balancing loss; expert count distinguished from global parameter symbol; PAPER-REPORTED |
| P13 | paper | DeepSeek-V3 Technical Report | DeepSeek-AI | arXivv2,2025-02-18 | https://arxiv.org/html/2412.19437v2 | null | UNVERIFIED | 2026-10-07 | 2.1 balancing; 2.2 sequential MTP; 4 training/depth/weight schedule; 4.5.1 Table4 paired token-budget ablations; PAPER-REPORTED |
| P35 | paper | Fast Inference from Transformers via Speculative Decoding | Leviathan et al. | ICML2023 proceedings PDF | https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf | null | UNVERIFIED | 2026-10-07 | Algorithm1 and acceptance/residual-correction conditions; PAPER-REPORTED |
| P44 | paper | Learning Transferable Visual Models From Natural Language Supervision | Radford et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/2103.00020 | null | UNVERIFIED | 2026-10-07 | 2.3 Figure3 symmetric contrastive objective; 2.5 learned-scale clipping and sharded similarities; 3 transfer protocol; PAPER-REPORTED |
| R4.1 | paper | BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding | Devlin et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/1810.04805 | null | UNVERIFIED | 2026-10-07 | 3.1 selected positions, replacement mixture, and prediction targets; PAPER-REPORTED |
| R4.2 | paper | Language Models are Few-Shot Learners | Brown et al. | Abstract/identity only | https://arxiv.org/abs/2005.14165 | null | UNVERIFIED | 2026-10-07 | Bibliographic lineage only; no method detail inferred from this inspection; PAPER-REPORTED |
| R4.3 | paper | BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension | Lewis et al. | ACL2020 archival PDF | https://aclanthology.org/2020.acl-main.703.pdf | null | UNVERIFIED | 2026-10-07 | 2 noising/reconstruction; 3-5 noising and task experiments; PAPER-REPORTED |
| R4.4 | paper | UL2: Unifying Language Learning Paradigms | Tay et al. | arXivv1 | https://arxiv.org/html/2205.05131v1 | null | UNVERIFIED | 2026-10-07 | 3 mixture regimes and mode conditioning; experimental comparisons; PAPER-REPORTED |
| R4.5 | paper | Efficient Training of Language Models to Fill in the Middle | Bavarian et al. | arXivv1 | https://arxiv.org/html/2207.14255v1 | null | UNVERIFIED | 2026-10-07 | 3 construction; 4.2-4.5 interventions; Tables1-2; AppendixC tokenization/packing; AppendixD exact compatible SPM layout; PAPER-REPORTED |
| R4.6 | paper | Sequence Level Training with Recurrent Neural Networks | Ranzato et al. | Full PDF at unversioned URL | https://arxiv.org/pdf/1511.06732 | null | UNVERIFIED | 2026-10-07 | Sequence-level training method and recurrent task experiments; no foundation-model effect size transferred; PAPER-REPORTED |
| R4.7 | paper | Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks | Bengio et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/1506.03099 | null | UNVERIFIED | 2026-10-07 | Scheduled-prefix construction and recurrent-model experiments; PAPER-REPORTED |
| R4.8 | paper | Unified Language Model Pre-training for Natural Language Understanding and Generation | Dong et al. | arXivv1 | https://arxiv.org/html/1905.03197v1 | null | UNVERIFIED | 2026-10-07 | 2 attention visibility for shared-network conditioning objectives; PAPER-REPORTED |
| R4.9 | paper | InCoder: A Generative Model for Code Infilling and Synthesis | Fried et al. | arXivv1 | https://arxiv.org/html/2204.05999v1 | null | UNVERIFIED | 2026-10-07 | Causal masking construction and infilling evaluation; PAPER-REPORTED |
| R4.10 | paper | Evaluating Large Language Models Trained on Code | Chen et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/2107.03374 | null | UNVERIFIED | 2026-10-07 | 3 functional correctness; pass@k estimator; overlap metrics versus test outcomes; PAPER-REPORTED |
| R4.11 | paper | StarCoder: may the source be with you! | Li et al. | arXivv2 | https://arxiv.org/html/2305.06161v2 | null | UNVERIFIED | 2026-10-07 | Training/infilling method and evaluations; no undocumented mask inferred; PAPER-REPORTED |
| R4.12 | paper | Code Llama: Open Foundation Models for Code | Roziere et al. | arXivv3 | https://arxiv.org/html/2308.12950v3 | null | UNVERIFIED | 2026-10-07 | 2.3 infilling eligibility/rate/encoding; 3.2 infilling protocol; AppendixE split-subtoken limitation; PAPER-REPORTED |
| R4.13 | paper | Better & Faster Large Language Models via Multi-token Prediction | Gloeckle et al. | arXivv1 | https://arxiv.org/html/2404.19737v1 | null | UNVERIFIED | 2026-10-07 | 2 Transformer prediction heads/shared unembedding/head schedule; 3 Table1 samples and oracle temperatures; AppendixG evaluation; AppendixM hyperparameters; PAPER-REPORTED |
| R4.14 | paper | PaLM: Scaling Language Modeling with Pathways | Chowdhery et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/2204.02311 | null | UNVERIFIED | 2026-10-07 | 5 output log-normalizer z-loss; PAPER-REPORTED |
| R4.15 | paper | ST-MoE: Designing Stable and Transferable Sparse Expert Models | Zoph et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/2202.08906 | null | UNVERIFIED | 2026-10-07 | Router z-loss, coefficient sweeps, and total-loss normalization context; PAPER-REPORTED |
| R4.16 | paper | Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads | Cai et al. | arXivv1 | https://arxiv.org/html/2401.10774v1 | null | UNVERIFIED | 2026-10-07 | 3 heads/tree verification/acceptance variants; no universal exact-sampling inference; PAPER-REPORTED |
| R4.17 | paper | On Calibration of Modern Neural Networks | Guo et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/1706.04599 | null | UNVERIFIED | 2026-10-07 | 3 Eq3 ECE; 4 temperature fit and classifier datasets; not an LLM factuality study; PAPER-REPORTED |
| R4.18 | paper | Robust Speech Recognition via Large-Scale Weak Supervision | Radford et al. | arXivv1 | https://arxiv.org/html/2212.04356v1 | null | UNVERIFIED | 2026-10-07 | 2 architecture/task serialization; speech evaluation and robustness experiments; PAPER-REPORTED |
| R4.19 | paper | Visual Instruction Tuning | Liu et al. | arXivv2 | https://arxiv.org/html/2304.08485v2 | null | UNVERIFIED | 2026-10-07 | 3 projection/two-stage parameter schedule/response objective; 4 evaluations; PAPER-REPORTED |
| R4.20 | paper | Decision Transformer: Reinforcement Learning via Sequence Modeling | Chen et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/2106.01345 | null | UNVERIFIED | 2026-10-07 | 3 training: discrete CE versus continuous MSE; 4 Atari/continuous control protocol; PAPER-REPORTED |
| R4.21 | paper | A Generalist Agent | Reed et al. | arXivv1 | https://arxiv.org/html/2205.06175v1 | null | UNVERIFIED | 2026-10-07 | Modality serialization, action/observation masking, multi-embodiment experiments; PAPER-REPORTED |
| R4.22 | documentation | Perplexity of fixed-length models | Hugging Face | Moving documentation; no package release pinned | https://huggingface.co/docs/transformers/perplexity | null | official documentation | 2026-10-07 | Definition; fixed-context/strided code; GPT-2 Large WikiText-2 raw example; source numbers not reproduced; OFFICIAL-DOCUMENTATION |
| R4.23 | paper | Rethinking the Inception Architecture for Computer Vision | Szegedy et al. | Full-text rendering, revision not pinned | https://ar5iv.labs.arxiv.org/html/1512.00567 | null | UNVERIFIED | 2026-10-07 | Label-smoothing target distribution; PAPER-REPORTED |
| R4.24 | documentation | torch.nn.functional.cross_entropy | PyTorch | Documentation header2.14; not a runtime/release compatibility test | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.cross_entropy.html | null | official documentation | 2026-10-07 | Parameters and Shape: class axis, class-index ignore_index, reductions and smoothing; OFFICIAL-DOCUMENTATION |
| R4.25 | documentation | TorchTitan loss source | PyTorch | Unpinned main; source read, no execution | https://raw.githubusercontent.com/pytorch/torchtitan/main/torchtitan/components/loss.py | null | official documentation | 2026-10-07 | cross_entropy_loss summed/nonreduced paths; _LossParallelCrossEntropy three forward reductions; trainer normalization not established by this file; OFFICIAL-DOCUMENTATION |
| R4.26 | documentation | Liger fused linear-cross-entropy source | LinkedIn | Unpinned main; source read, no execution | https://raw.githubusercontent.com/linkedin/Liger-Kernel/main/src/liger_kernel/ops/fused_linear_cross_entropy.py | null | official documentation | 2026-10-07 | LigerFusedLinearCrossEntropyFunction and chunked projection/loss/gradient path; OFFICIAL-DOCUMENTATION |
| R4.27 | documentation | Megatron Core vocabulary-parallel loss source | NVIDIA | Unpinned main; source read, no execution | https://raw.githubusercontent.com/NVIDIA/Megatron-LM/main/megatron/core/tensor_parallel/cross_entropy.py | null | official documentation | 2026-10-07 | _VocabParallelCrossEntropy.forward: MAX, selected-target SUM, exponential-sum SUM; OFFICIAL-DOCUMENTATION |
| R4.28 | documentation | T5 model documentation | Hugging Face | Moving documentation; package version not pinned | https://huggingface.co/docs/transformers/model_doc/t5 | null | official documentation | 2026-10-07 | Sentinel extra IDs, label handling, decoder input shifting; OFFICIAL-DOCUMENTATION |
| R4.29 | documentation | DeepSeek-V3 README | DeepSeek-AI | Unpinned repository README | https://github.com/deepseek-ai/DeepSeek-V3 | null | official documentation | 2026-10-07 | Main/MTP released weight accounting and inference integration; no runtime benchmark by book; OFFICIAL-DOCUMENTATION |
| R4.30 | documentation | HumanEval README | OpenAI | Unpinned repository README | https://github.com/openai/human-eval | null | official documentation | 2026-10-07 | Generated-code execution boundary and harness requirements; OFFICIAL-DOCUMENTATION |
| R4.31 | documentation | torch.nn.functional.linear_cross_entropy | PyTorch | Moving main documentation; not a stable-version compatibility claim | https://docs.pytorch.org/docs/main/generated/torch.nn.functional.linear_cross_entropy.html | null | official documentation | 2026-10-07 | Fused interface and supported backend/autodiff restrictions; OFFICIAL-DOCUMENTATION |
| R4.32 | paper | Multi-Token Prediction Needs Registers | Gerontopoulos et al. | arXivv1 | https://arxiv.org/html/2505.10518v1 | null | UNVERIFIED | 2026-10-07 | MuToR register-token methodology and experiments; PAPER-REPORTED |
| R4.33 | paper | Pre-Training Curriculum for Multi-Token Prediction in Language Models | Aynetdinov and Akbik | arXivv1 | https://arxiv.org/html/2505.22757v1 | null | UNVERIFIED | 2026-10-07 | NTP/MTP ordering, reported capability versus self-speculative behavior; no universal ordering claim; PAPER-REPORTED |
| R4.34 | paper | How Transformers Learn to Plan via Multi-Token Prediction | Huang et al. | arXivv1,2026-04-13 | https://arxiv.org/html/2604.11912v1 | null | UNVERIFIED | 2026-10-07 | 4 graph/Countdown/SAT experiments; 5 restricted two-layer star-graph analysis and its assumptions; PAPER-REPORTED |

## Inspected locators

### P01

[Attention Is All You Need](https://ar5iv.labs.arxiv.org/html/1706.03762). Full-text rendering, revision not pinned. Inspected 2026-10-07: 3.1 shifted causal decoder; 3.2 cross-attention; 5.1-5.4 protocol and smoothing; Tables2-3. Evidence: PAPER-REPORTED.

### P02

[Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://www.jmlr.org/papers/volume21/20-074/20-074.pdf). JMLR21(140),2020, full journal PDF. Inspected 2026-10-07: 3.1 baseline; 3.2 architecture; 3.3.1-3.3.4 objectives; Tables4-7; 3.7 final model distinguished from ablations. Evidence: PAPER-REPORTED.

### P03

[The Pile: An 800GB Dataset of Diverse Text for Language Modeling](https://ar5iv.labs.arxiv.org/html/2101.00027). Full-text rendering, revision not pinned; arXiv2021. Inspected 2026-10-07: Evaluation and bits-per-byte definition; byte and tokenizer comparability. Evidence: PAPER-REPORTED.

### P08

[Scaling Laws for Neural Language Models](https://ar5iv.labs.arxiv.org/html/2001.08361). Full-text rendering, revision not pinned. Inspected 2026-10-07: Loss-scaling formulation; lineage only here, quantitative teaching belongs to21. Evidence: PAPER-REPORTED.

### P10

[Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://ar5iv.labs.arxiv.org/html/2101.03961). Full-text rendering, revision not pinned. Inspected 2026-10-07: 2.2 balancing loss; expert count distinguished from global parameter symbol. Evidence: PAPER-REPORTED.

### P13

[DeepSeek-V3 Technical Report](https://arxiv.org/html/2412.19437v2). arXivv2,2025-02-18. Inspected 2026-10-07: 2.1 balancing; 2.2 sequential MTP; 4 training/depth/weight schedule; 4.5.1 Table4 paired token-budget ablations. Evidence: PAPER-REPORTED.

### P35

[Fast Inference from Transformers via Speculative Decoding](https://proceedings.mlr.press/v202/leviathan23a/leviathan23a.pdf). ICML2023 proceedings PDF. Inspected 2026-10-07: Algorithm1 and acceptance/residual-correction conditions. Evidence: PAPER-REPORTED.

### P44

[Learning Transferable Visual Models From Natural Language Supervision](https://ar5iv.labs.arxiv.org/html/2103.00020). Full-text rendering, revision not pinned. Inspected 2026-10-07: 2.3 Figure3 symmetric contrastive objective; 2.5 learned-scale clipping and sharded similarities; 3 transfer protocol. Evidence: PAPER-REPORTED.

### R4.1

[BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://ar5iv.labs.arxiv.org/html/1810.04805). Full-text rendering, revision not pinned. Inspected 2026-10-07: 3.1 selected positions, replacement mixture, and prediction targets. Evidence: PAPER-REPORTED.

### R4.2

[Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). Abstract/identity only. Inspected 2026-10-07: Bibliographic lineage only; no method detail inferred from this inspection. Evidence: PAPER-REPORTED.

### R4.3

[BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://aclanthology.org/2020.acl-main.703.pdf). ACL2020 archival PDF. Inspected 2026-10-07: 2 noising/reconstruction; 3-5 noising and task experiments. Evidence: PAPER-REPORTED.

### R4.4

[UL2: Unifying Language Learning Paradigms](https://arxiv.org/html/2205.05131v1). arXivv1. Inspected 2026-10-07: 3 mixture regimes and mode conditioning; experimental comparisons. Evidence: PAPER-REPORTED.

### R4.5

[Efficient Training of Language Models to Fill in the Middle](https://arxiv.org/html/2207.14255v1). arXivv1. Inspected 2026-10-07: 3 construction; 4.2-4.5 interventions; Tables1-2; AppendixC tokenization/packing; AppendixD exact compatible SPM layout. Evidence: PAPER-REPORTED.

### R4.6

[Sequence Level Training with Recurrent Neural Networks](https://arxiv.org/pdf/1511.06732). Full PDF at unversioned URL. Inspected 2026-10-07: Sequence-level training method and recurrent task experiments; no foundation-model effect size transferred. Evidence: PAPER-REPORTED.

### R4.7

[Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks](https://ar5iv.labs.arxiv.org/html/1506.03099). Full-text rendering, revision not pinned. Inspected 2026-10-07: Scheduled-prefix construction and recurrent-model experiments. Evidence: PAPER-REPORTED.

### R4.8

[Unified Language Model Pre-training for Natural Language Understanding and Generation](https://arxiv.org/html/1905.03197v1). arXivv1. Inspected 2026-10-07: 2 attention visibility for shared-network conditioning objectives. Evidence: PAPER-REPORTED.

### R4.9

[InCoder: A Generative Model for Code Infilling and Synthesis](https://arxiv.org/html/2204.05999v1). arXivv1. Inspected 2026-10-07: Causal masking construction and infilling evaluation. Evidence: PAPER-REPORTED.

### R4.10

[Evaluating Large Language Models Trained on Code](https://ar5iv.labs.arxiv.org/html/2107.03374). Full-text rendering, revision not pinned. Inspected 2026-10-07: 3 functional correctness; pass@k estimator; overlap metrics versus test outcomes. Evidence: PAPER-REPORTED.

### R4.11

[StarCoder: may the source be with you!](https://arxiv.org/html/2305.06161v2). arXivv2. Inspected 2026-10-07: Training/infilling method and evaluations; no undocumented mask inferred. Evidence: PAPER-REPORTED.

### R4.12

[Code Llama: Open Foundation Models for Code](https://arxiv.org/html/2308.12950v3). arXivv3. Inspected 2026-10-07: 2.3 infilling eligibility/rate/encoding; 3.2 infilling protocol; AppendixE split-subtoken limitation. Evidence: PAPER-REPORTED.

### R4.13

[Better & Faster Large Language Models via Multi-token Prediction](https://arxiv.org/html/2404.19737v1). arXivv1. Inspected 2026-10-07: 2 Transformer prediction heads/shared unembedding/head schedule; 3 Table1 samples and oracle temperatures; AppendixG evaluation; AppendixM hyperparameters. Evidence: PAPER-REPORTED.

### R4.14

[PaLM: Scaling Language Modeling with Pathways](https://ar5iv.labs.arxiv.org/html/2204.02311). Full-text rendering, revision not pinned. Inspected 2026-10-07: 5 output log-normalizer z-loss. Evidence: PAPER-REPORTED.

### R4.15

[ST-MoE: Designing Stable and Transferable Sparse Expert Models](https://ar5iv.labs.arxiv.org/html/2202.08906). Full-text rendering, revision not pinned. Inspected 2026-10-07: Router z-loss, coefficient sweeps, and total-loss normalization context. Evidence: PAPER-REPORTED.

### R4.16

[Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/html/2401.10774v1). arXivv1. Inspected 2026-10-07: 3 heads/tree verification/acceptance variants; no universal exact-sampling inference. Evidence: PAPER-REPORTED.

### R4.17

[On Calibration of Modern Neural Networks](https://ar5iv.labs.arxiv.org/html/1706.04599). Full-text rendering, revision not pinned. Inspected 2026-10-07: 3 Eq3 ECE; 4 temperature fit and classifier datasets; not an LLM factuality study. Evidence: PAPER-REPORTED.

### R4.18

[Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/html/2212.04356v1). arXivv1. Inspected 2026-10-07: 2 architecture/task serialization; speech evaluation and robustness experiments. Evidence: PAPER-REPORTED.

### R4.19

[Visual Instruction Tuning](https://arxiv.org/html/2304.08485v2). arXivv2. Inspected 2026-10-07: 3 projection/two-stage parameter schedule/response objective; 4 evaluations. Evidence: PAPER-REPORTED.

### R4.20

[Decision Transformer: Reinforcement Learning via Sequence Modeling](https://ar5iv.labs.arxiv.org/html/2106.01345). Full-text rendering, revision not pinned. Inspected 2026-10-07: 3 training: discrete CE versus continuous MSE; 4 Atari/continuous control protocol. Evidence: PAPER-REPORTED.

### R4.21

[A Generalist Agent](https://arxiv.org/html/2205.06175v1). arXivv1. Inspected 2026-10-07: Modality serialization, action/observation masking, multi-embodiment experiments. Evidence: PAPER-REPORTED.

### R4.22

[Perplexity of fixed-length models](https://huggingface.co/docs/transformers/perplexity). Moving documentation; no package release pinned. Inspected 2026-10-07: Definition; fixed-context/strided code; GPT-2 Large WikiText-2 raw example; source numbers not reproduced. Evidence: OFFICIAL-DOCUMENTATION.

### R4.23

[Rethinking the Inception Architecture for Computer Vision](https://ar5iv.labs.arxiv.org/html/1512.00567). Full-text rendering, revision not pinned. Inspected 2026-10-07: Label-smoothing target distribution. Evidence: PAPER-REPORTED.

### R4.24

[torch.nn.functional.cross_entropy](https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.cross_entropy.html). Documentation header2.14; not a runtime/release compatibility test. Inspected 2026-10-07: Parameters and Shape: class axis, class-index ignore_index, reductions and smoothing. Evidence: OFFICIAL-DOCUMENTATION.

### R4.25

[TorchTitan loss source](https://raw.githubusercontent.com/pytorch/torchtitan/main/torchtitan/components/loss.py). Unpinned main; source read, no execution. Inspected 2026-10-07: cross_entropy_loss summed/nonreduced paths; _LossParallelCrossEntropy three forward reductions; trainer normalization not established by this file. Evidence: OFFICIAL-DOCUMENTATION.

### R4.26

[Liger fused linear-cross-entropy source](https://raw.githubusercontent.com/linkedin/Liger-Kernel/main/src/liger_kernel/ops/fused_linear_cross_entropy.py). Unpinned main; source read, no execution. Inspected 2026-10-07: LigerFusedLinearCrossEntropyFunction and chunked projection/loss/gradient path. Evidence: OFFICIAL-DOCUMENTATION.

### R4.27

[Megatron Core vocabulary-parallel loss source](https://raw.githubusercontent.com/NVIDIA/Megatron-LM/main/megatron/core/tensor_parallel/cross_entropy.py). Unpinned main; source read, no execution. Inspected 2026-10-07: _VocabParallelCrossEntropy.forward: MAX, selected-target SUM, exponential-sum SUM. Evidence: OFFICIAL-DOCUMENTATION.

### R4.28

[T5 model documentation](https://huggingface.co/docs/transformers/model_doc/t5). Moving documentation; package version not pinned. Inspected 2026-10-07: Sentinel extra IDs, label handling, decoder input shifting. Evidence: OFFICIAL-DOCUMENTATION.

### R4.29

[DeepSeek-V3 README](https://github.com/deepseek-ai/DeepSeek-V3). Unpinned repository README. Inspected 2026-10-07: Main/MTP released weight accounting and inference integration; no runtime benchmark by book. Evidence: OFFICIAL-DOCUMENTATION.

### R4.30

[HumanEval README](https://github.com/openai/human-eval). Unpinned repository README. Inspected 2026-10-07: Generated-code execution boundary and harness requirements. Evidence: OFFICIAL-DOCUMENTATION.

### R4.31

[torch.nn.functional.linear_cross_entropy](https://docs.pytorch.org/docs/main/generated/torch.nn.functional.linear_cross_entropy.html). Moving main documentation; not a stable-version compatibility claim. Inspected 2026-10-07: Fused interface and supported backend/autodiff restrictions. Evidence: OFFICIAL-DOCUMENTATION.

### R4.32

[Multi-Token Prediction Needs Registers](https://arxiv.org/html/2505.10518v1). arXivv1. Inspected 2026-10-07: MuToR register-token methodology and experiments. Evidence: PAPER-REPORTED.

### R4.33

[Pre-Training Curriculum for Multi-Token Prediction in Language Models](https://arxiv.org/html/2505.22757v1). arXivv1. Inspected 2026-10-07: NTP/MTP ordering, reported capability versus self-speculative behavior; no universal ordering claim. Evidence: PAPER-REPORTED.

### R4.34

[How Transformers Learn to Plan via Multi-Token Prediction](https://arxiv.org/html/2604.11912v1). arXivv1,2026-04-13. Inspected 2026-10-07: 4 graph/Countdown/SAT experiments; 5 restricted two-layer star-graph analysis and its assumptions. Evidence: PAPER-REPORTED.

## Evidence boundaries

The chapter derives accounting and gradient consequences separately from paper-reported findings. No training, benchmark, kernel equivalence, distributed gradient, or code-harness check was executed. Unpinned implementation readings are OFFICIAL-DOCUMENTATION and never CODE-VERIFIED. Historical sources teach foundations; the2025-2026 descendants extend the comparison without implying superiority from publication date. Source-specific protocol gaps are recorded in verification.md.
