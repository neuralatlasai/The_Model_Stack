---
id: ms.references.13
entity_type: references
title: Chapter 13 references
short_title: References
section: null
slug: references
parent: ms.chapter.13
prev_sibling: ms.verification.13
next_sibling: null
children: []
prerequisites: []
downstream: []
word_count_target: 1600
volume: 1
part: 3
chapter: 13
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [dense_architecture, parameter_allocation], feedback_setting: [], modality: [text]}
papers: [P01, P02]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core, impl.nvidia-transformer-engine]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# Chapter 13 references

**KNOWN — source register.** Primary sources were inspected on **24–25 September 2026** through the routes in `Instruction/AI_REFERENCE_STACK.md`. The table records the actual access date, inspected documentation surface, and bounded use of each source. Publication dates describe research history; access dates describe this edition's checks. An unpinned repository or documentation page is not a reproducible software revision.

## Typed reference records

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin | NeurIPS 2017; arXiv v7 inspected | https://arxiv.org/abs/1706.03762 | null | peer-reviewed | §§3.1–3.4: encoder–decoder structure, attention projections, feed-forward maps and shared embeddings | 2026-09-24 |
| P02 | paper | Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer | Raffel, Shazeer, Roberts, Lee, Narang, Matena, Zhou, Li, Liu | JMLR 21(140), 2020; preprint 2019 | https://jmlr.org/papers/v21/20-074.html | null | peer-reviewed | Text-to-text formulation and encoder–decoder research anchor; §13.1 | 2026-09-24 |
| R13.1 | paper | BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding | Devlin, Chang, Lee, Toutanova | NAACL 2019; preprint 2018 | https://aclanthology.org/N19-1423/ | null | peer-reviewed | Bidirectional encoder and masked-language-model objective; §13.1 | 2026-09-24 |
| R13.2 | paper | GLU Variants Improve Transformer | Noam Shazeer | arXiv 2020, v1 | https://arxiv.org/abs/2002.05202 | null | preprint | Gated feed-forward definitions and two-thirds intermediate-width adjustment; §13.3 | 2026-09-24 |
| R13.3 | paper | Gaussian Error Linear Units (GELUs) | Dan Hendrycks; Kevin Gimpel | arXiv 2016 | https://arxiv.org/abs/1606.08415 | null | preprint | GELU research identity; §13.3 | 2026-09-24 |
| R13.4 | paper | Layer Normalization | Jimmy Lei Ba; Jamie Ryan Kiros; Geoffrey E. Hinton | arXiv 2016 | https://arxiv.org/abs/1607.06450 | null | preprint | Normalization over hidden coordinates; §13.4 | 2026-09-24 |
| R13.5 | paper | Root Mean Square Layer Normalization | Biao Zhang; Rico Sennrich | arXiv 2019 | https://arxiv.org/abs/1910.07467 | null | preprint | RMS normalization without centering; §13.4 | 2026-09-24 |
| R13.6 | paper | On Layer Normalization in the Transformer Architecture | Ruibin Xiong et al. | ICML 2020, PMLR 119 | https://proceedings.mlr.press/v119/xiong20b.html | null | peer-reviewed | Mean-field initialization analysis of normalization placement; §§13.4, 13.6 | 2026-09-24 |
| R13.7 | documentation | torch.nn.LayerNorm | PyTorch | Versioned documentation path 2.14 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.LayerNorm.html | https://github.com/pytorch/pytorch | official documentation | Normalized axes, population variance and affine interface; §13.4 | 2026-09-24 |
| R13.8 | documentation | torch.nn.GELU | PyTorch | Versioned documentation path 2.14 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.GELU.html | https://github.com/pytorch/pytorch | official documentation | Exact GELU and tanh approximation option; §13.3 | 2026-09-24 |
| R13.9 | documentation | BERT model documentation | Hugging Face Transformers | Moving main documentation; no package revision pinned | https://huggingface.co/docs/transformers/main/en/model_doc/bert | https://github.com/huggingface/transformers | official documentation | Task-head interfaces; §§13.1, 13.5 | 2026-09-24 |
| R13.10 | documentation | Llama model documentation | Hugging Face Transformers | Unpinned documentation surface | https://huggingface.co/docs/transformers/en/model_doc/llama | https://github.com/huggingface/transformers | official documentation | Architectural configuration fields; §§13.2, 13.3, 13.5 | 2026-09-24 |
| R13.11 | documentation | torch.nn.RMSNorm | PyTorch | Versioned documentation path 2.14 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.RMSNorm.html | https://github.com/pytorch/pytorch | official documentation | RMS normalization interface; §13.4 | 2026-09-24 |
| R13.12 | documentation | scaled_dot_product_attention | PyTorch | Versioned documentation path 2.14 | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.scaled_dot_product_attention.html | https://github.com/pytorch/pytorch | official documentation | Boolean mask meaning, dropout argument and backend selection; §§13.1, 13.6 | 2026-09-24 |
| R13.13 | repository | Tensor-parallel layer documentation in layers.py | NVIDIA Megatron-Core | Moving main branch; no commit pinned | https://github.com/NVIDIA/Megatron-LM/blob/main/megatron/core/tensor_parallel/layers.py | https://github.com/NVIDIA/Megatron-LM | official documentation | Projection interfaces and vocabulary partitioning docstrings; §§13.1, 13.2, 13.5 | 2026-09-24 |
| R13.14 | repository | Transformer Engine repository and FSDP example | NVIDIA Transformer Engine | Moving main branch; no commit pinned | https://github.com/NVIDIA/TransformerEngine/blob/main/examples/pytorch/fsdp/fsdp.py | https://github.com/NVIDIA/TransformerEngine | official documentation | Documented layer integration surface, including LayerNormMLP; §§13.3–13.6 | 2026-09-25 |
| R13.15 | course | CS336: Language Modeling from Scratch | Stanford University; Tatsunori Hashimoto and Percy Liang | Spring 2026 course website | https://cs336.stanford.edu/ | null | official documentation | Model construction, systems and scaling curriculum; §§13.2, 13.6 | 2026-09-24 |
| R13.16 | paper | Transformers without Normalization | Jiachen Zhu; Xinlei Chen; Kaiming He; Yann LeCun; Zhuang Liu | arXiv 2025, v2; record identifies CVPR 2025 | https://arxiv.org/abs/2503.10622 | null | preprint | Dynamic Tanh as an alternative branch; §13.4 | 2026-09-25 |
| R13.17 | paper | DeepNet: Scaling Transformers to 1,000 Layers | Hongyu Wang; Shuming Ma; Li Dong; Shaohan Huang; Dongdong Zhang; Furu Wei | arXiv 2022, v1 | https://arxiv.org/abs/2203.00555 | null | preprint | Coupled residual modification and initialization; §13.4 | 2026-09-25 |
| R13.18 | paper | Using the Output Embedding to Improve Language Models | Ofir Press; Lior Wolf | arXiv 2016; v3 full text inspected | https://arxiv.org/abs/1608.05859 | null | preprint | Input/output weight tying; §13.5 | 2026-09-24 |

## P01

**PAPER-REPORTED.** The full-text architecture sections ground the graph and tensor dimensions. Equations 13.1–13.6 are independently stated accounting models with explicit exclusions; they are not benchmark results from this paper.

## P02

**PAPER-REPORTED.** The archival JMLR record and https://arxiv.org/abs/1910.10683 were opened. Text-to-text task expression does not imply that a task's attention graph or output loss is fixed by its interface.

## R13.1

**PAPER-REPORTED.** The archival record and https://arxiv.org/abs/1810.04805 identify the work. Its architecture/objective combination supplies a family example, not a present-day quality ranking.

## R13.2

**PAPER-REPORTED.** The full text at https://arxiv.org/html/2002.05202v1 was inspected for gated maps and width adjustment. The chapter derives projection counts and activation-buffer consequences separately; equal projection parameters do not establish equal training memory.

## R13.3

**PAPER-REPORTED.** The paper record identifies the activation. The exact and approximate framework interfaces are checked separately against R13.8; no paper-level performance improvement is transferred to the chapter's proposed workloads.

## R13.4

**PAPER-REPORTED.** The chapter fixes population moments, affine parameters, and epsilon explicitly before deriving a Jacobian. Those conventions must be matched when testing any implementation.

## R13.5

**PAPER-REPORTED.** The full text at https://arxiv.org/html/1910.07467v1 was inspected. The manuscript distinguishes the paper's mechanism from its own positive-epsilon Jacobian and invariance analysis. This record identifies the inspected preprint surface.

## R13.6

**PAPER-REPORTED.** The proceedings record and https://arxiv.org/abs/2002.04745 were opened. Warm-up conclusions retain the paper's theoretical and experimental scope; the chapter makes no universal warm-up-removal recommendation.

## R13.7

**OFFICIAL-DOCUMENTATION.** The documented variance convention supports comparison with Eq. 13.10. A versioned documentation path is an inspected interface, not evidence of a locally installed package or tested kernel.

## R13.8

**OFFICIAL-DOCUMENTATION.** The inspected interface distinguishes the exact expression from its approximation. The experiment must retain the chosen option rather than treating all activation implementations as numerically identical.

## R13.9

**OFFICIAL-DOCUMENTATION.** The page documents BERT configurations and task heads. Its presence does not establish performance, compatibility with a future release, or a trained checkpoint's undisclosed configuration.

## R13.10

**OFFICIAL-DOCUMENTATION.** Configuration fields are an inspection route. The chapter does not assign their defaults to an arbitrary Llama checkpoint or infer every model in a family from one framework class.

## R13.11

**OFFICIAL-DOCUMENTATION.** The manuscript requires explicit epsilon, axes, gain, and accumulation conventions in any comparison. It does not hard-code a presumed default epsilon from an older release.

## R13.12

**OFFICIAL-DOCUMENTATION.** The functional interface documents participating positions for a true Boolean mask and application of the supplied dropout probability. A backend's actual selection and materialization policy must still be recorded for an executed run.

## R13.13

**OFFICIAL-DOCUMENTATION.** The official repository docstrings supply the limited interface claims. The attempted developer-guide tensor-parallel URL returned an error; the accessible official repository is the fallback. Eq. 13.16 is an independent distributed-loss derivation, not a verified trace of this unpinned implementation.

## R13.14

**OFFICIAL-DOCUMENTATION.** The repository root was opened on 24 September and this example on 25 September 2026. The example's layer map lists LayerNormMLP. The API documentation endpoint could not be retrieved; no claim of a particular fused execution path, supported hardware combination, or measured speedup rests on that failed fetch.

## R13.15

**OFFICIAL-DOCUMENTATION.** This course is an explicit Chapter 13 anchor in book_plan.md, outside the reference stack's system list. The inspected Spring 2026 schedule supports the methodology connection; it is not experimental evidence for the chapter's candidates.

## R13.16

**PAPER-REPORTED.** The abstract describes replacing normalization layers with an elementwise Dynamic Tanh operation and reports results in the authors' settings. The chapter uses this only to delimit what normalization is logically required to do; no exhaustive 2026 frontier ranking or transferred quality result is claimed.

## R13.17

**PAPER-REPORTED.** The abstract describes DeepNorm together with theoretically derived initialization. The manuscript does not extract one residual multiplier and claim that it independently inherits the paper's reported deep-training behavior.

## R13.18

**PAPER-REPORTED.** The full text at https://arxiv.org/html/1608.05859v3 was opened. The chapter derives unique parameter savings and gradient coupling without claiming that tying removes the output projection or universally improves quality.

## Evidence boundaries

**DERIVED.** Counts, Jacobians, covariance identities, matching counterexamples, and frontier algorithms are original derivations under the conditions beside their equations. They are distinguished from reported research results and documented framework contracts. The chapter's proposed workloads and configurations are experimental design choices, not descriptions of proprietary systems.

**UNVERIFIED.** Package compatibility, exact moving-branch commits, selected kernels, realized latency, memory peaks, training quality, and proposed experiment outcomes have not been established by this manuscript. **NOT-DISCLOSED.** No cited source supplies a complete implementation and workload contract for every model that might be described as a dense Transformer.

**KNOWN — originality boundary.** The manuscript uses original exposition, equations with explicit derivation, and claim-local attribution. It does not reproduce source prose or tables. No comprehensive similarity audit is claimed.

