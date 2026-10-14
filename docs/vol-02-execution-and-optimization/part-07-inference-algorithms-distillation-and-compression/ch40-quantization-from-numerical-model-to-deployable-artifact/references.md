---
id: ms.references.40
entity_type: references
title: Chapter 40 references
volume: 2
part: 7
chapter: 40
section: null
slug: references
parent: ms.chapter.40
prev_sibling: ms.verification.40
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: [P15, P33, P34]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.torchtune, impl.vllm, impl.llama-cpp]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 40 — Primary evidence ledger

[KNOWN] All successful inspections below occurred on **2026-10-14**. Full method, experimental or format surfaces were opened with web retrieval. A repository link is an artifact route, not proof that code was executed. Unversioned PDF URLs and mutable documentation are explicitly marked unpinned where the retrieved surface did not expose a reliable revision. No benchmark was reproduced.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P33 | paper | GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers | Elias Frantar, Saleh Ashkboos, Torsten Hoefler, Dan Alistarh | ICLR 2023 | [full text](https://arxiv.org/pdf/2210.17323) | [originating repository](https://github.com/IST-DASLab/gptq) | peer-reviewed | 2026-10-14 | Retrieved PDF internally identifies v2, 22 March 2023; §3 Eqs. 1–3, §4 Algorithm 1, §5 Tables 5–6, Appendix A.2.2 |
| P34 | paper | AWQ: Activation-aware Weight Quantization for On-Device LLM Compression and Acceleration | Ji Lin et al. | MLSys 2024 | [v5 full text](https://arxiv.org/html/2306.00978v5) | [originating repository](https://github.com/mit-han-lab/llm-awq) | peer-reviewed | 2026-10-14 | v5, 18 July 2024; §3.1 Tables 1–2, §3.2 Eqs. 1–5, §4.2 packing/fusion, §5 calibration/quality |
| R40.3 | paper | SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models | Guangxuan Xiao, Ji Lin, Mickael Seznec, Hao Wu, Julien Demouth, Song Han | ICML / PMLR 202, 2023 | [archival PDF](https://proceedings.mlr.press/v202/xiao23c/xiao23c.pdf) | [originating repository](https://github.com/mit-han-lab/smoothquant) | peer-reviewed | 2026-10-14 | Archival proceedings surface; §2 Fig. 3, §3 Table 1, §4 Eq. 3/Table 2, §5.3–5.5, Table 7 |
| P15 | paper | QLoRA | Tim Dettmers, Artidoro Pagnoni, Ari Holtzman, Luke Zettlemoyer | 2023 | [inspected PDF](https://arxiv.org/pdf/2305.14314) | [originating repository](https://github.com/artidoro/qlora) | preprint | 2026-10-14 | Retrieved PDF internally identifies v1, 23 May 2023, “under review”; §3 Eq. 4, NF4, double quantization and storage/compute separation; Appendix G state accounting |
| R40.4 | paper | 8-bit Optimizers via Block-wise Quantization | Tim Dettmers, Mike Lewis, Sam Shleifer, Luke Zettlemoyer | ICLR 2022 | [full text](https://arxiv.org/pdf/2110.02861) | [originating implementation route](https://github.com/bitsandbytes-foundation/bitsandbytes) | peer-reviewed | 2026-10-14 | Unpinned PDF, internally ICLR 2022; §1.2–1.3 Eq. 3, §2.1–2.3 block coding/update/stable embeddings, §3 experiments |
| R40.5 | paper | Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference | Benoit Jacob et al. | CVPR 2018 | [full text](https://arxiv.org/pdf/1712.05877) | null | peer-reviewed | 2026-10-14 | Unpinned PDF; §2.1–2.4 affine mapping, integer multiplication and requantization; §3 simulated quantization; §4.2 ImageNet/COCO/mobile-core protocol |
| R40.6 | paper | Deep Learning with Limited Numerical Precision | Suyog Gupta, Ankur Agrawal, Kailash Gopalakrishnan, Pritish Narayanan | ICML 2015 | [full text](https://arxiv.org/pdf/1502.02551) | null | peer-reviewed | 2026-10-14 | Unpinned PDF; §3 stochastic rounding and saturation, §4.1 MNIST, §4.2 CIFAR10 and precision recovery |
| R40.7 | paper | Up or Down? Adaptive Rounding for Post-Training Quantization | Markus Nagel, Rana Ali Amjad, Mart van Baalen, Christos Louizos, Tijmen Blankevoort | ICML / PMLR 119, 2020 | [archival PDF](https://proceedings.mlr.press/v119/nagel20a/nagel20a.pdf) | null | peer-reviewed | 2026-10-14 | Archival surface; §3.1 Taylor conditions, §3.2 Eqs. 14–20 diagonal preactivation-curvature assumptions, §3.3 Eqs. 21–25 relaxation, §5 Table 2 |
| R40.8 | paper | LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale | Tim Dettmers, Mike Lewis, Younes Belkada, Luke Zettlemoyer | NeurIPS 2022 | [full text](https://arxiv.org/pdf/2208.07339) | [implementation route](https://github.com/bitsandbytes-foundation/bitsandbytes) | peer-reviewed | 2026-10-14 | Unpinned PDF; §3.1 vectorwise scaling, §3.2 mixed-precision decomposition, Fig. 2; used only for mechanism differential |
| R40.9 | paper | KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache | Zirui Liu, Jiayi Yuan, Hongye Jin, Shaochen Zhong, Zhaozhuo Xu, Vladimir Braverman, Beidi Chen, Xia Hu | ICML 2024 | [v2 full text](https://arxiv.org/html/2402.02750v2) | [originating repository](https://github.com/jy-yuan/KIVI) | peer-reviewed | 2026-10-14 | v2, 25 July 2024; CC BY 4.0; §3.1 Table 1, §3.2 Table 2/Eq. 2, §3.3 Algorithm 1/Eq. 3, §4.1 setup, §4.2.2 Tables 3–4, §4.2.3 residual/group ablations |
| R40.10 | technical report | Quantization-Aware Distillation for NVFP4 Inference Accuracy Recovery | Meng Xin et al., NVIDIA | 2026 | [full report](https://arxiv.org/pdf/2601.20088) | [official ModelOpt](https://github.com/NVIDIA/Model-Optimizer) | preprint | 2026-10-14 | Unpinned PDF, internal report date 4 March 2026; §3.1 Eq. 1/Table 1, §3.2 Tables 2–3, §3.4 configuration and checkpoint selection, §4.1–4.2 ablations, Appendix A |
| R40.11 | paper | TorchAO: PyTorch-Native Training-to-Serving Model Optimization | Andrew Or et al. | ICML CODEML workshop 2025 | [full text](https://arxiv.org/pdf/2507.16099) | [official repository](https://github.com/pytorch/ao) | preprint | 2026-10-14 | Unpinned PDF, internally CODEML 2025; §2–3 tensor representations and optimization integration, §4 experiments; no claim of main-conference acceptance |
| R40.12 | repository | NVIDIA Model Optimizer | NVIDIA | current repository | [README](https://github.com/NVIDIA/Model-Optimizer) | same | official documentation | 2026-10-14 | Unpinned main README; transformation/export boundaries, “Techniques,” “Model Support Matrix,” dated announcement links; not execution evidence |
| R40.13 | documentation | GGUF specification | GGML / ggml-org | current specification | [format specification](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) | same | official documentation | 2026-10-14 | Unpinned master; structural format version 3, gguf_header_t, gguf_tensor_info_t, alignment, standardized general.quantization_version |
| R40.14 | documentation | safetensors format | safetensors maintainers | current specification | [README format](https://github.com/safetensors/safetensors/blob/main/README.md) | same | official documentation | 2026-10-14 | Unpinned main, redirected from huggingface/safetensors; “Format” header length, dtype/shape/offsets, string metadata, endianness and row-major layout |
| R40.15 | documentation | vLLM quantization | vLLM project | latest documentation | [quantization page](https://docs.vllm.ai/en/latest/features/quantization/) | [official repository](https://github.com/vllm-project/vllm) | official documentation | 2026-10-14 | Unpinned latest; “Selecting Linear Backends per Quantization,” “Supported Hardware,” quantization config dispatch; no compatibility execution |
| R40.16 | documentation | bitsandbytes Linear4bit | bitsandbytes maintainers / Hugging Face | current documentation | [Linear4bit reference](https://huggingface.co/docs/bitsandbytes/en/reference/nn/linear4bit) | [official repository](https://github.com/bitsandbytes-foundation/bitsandbytes) | official documentation | 2026-10-14 | Unpinned documentation; Linear4bit constructor quant_type, compute_dtype, compress_statistics; LinearNF4/LinearFP4 |
| R40.17 | documentation | Introducing NVFP4 for Efficient and Accurate Low-Precision Inference | NVIDIA | 24 June 2025 | [first-party disclosure](https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/) | null | official documentation | 2026-10-14 | Unpinned article; Table 1, “What is NVFP4?” and Fig. 2 specify E2M1 values, E4M3 scales, group16/globalFP32; MXFP4 group32/power-of-two scale |
| R40.18 | documentation | AutoQuantize: A Fast Automatic Mixed-Precision Assignment | NVIDIA Model Optimizer Team | 24 August 2026 | [method disclosure](https://nvidia.github.io/Model-Optimizer/announcements/autoquantize.html) | [official repository](https://github.com/NVIDIA/Model-Optimizer) | official documentation | 2026-10-14 | Mutable generated docs identify 0.0.1.dev1+g2758c046f, not pinned execution; “How AutoQuantize works,” sensitivity, effective-bit cost, grouped deployment restrictions |
| R40.19 | documentation | Scale Learning: Training NVFP4 Block Scales to Recover Accuracy | NVIDIA Model Optimizer Team | 16 September 2026 | [method disclosure](https://nvidia.github.io/Model-Optimizer/announcements/scale-learning.html) | [official repository](https://github.com/NVIDIA/Model-Optimizer) | official documentation | 2026-10-14 | Same unpinned generated-doc surface; “How Scale Learning Works” tied/dual scale derivatives, FP8 scale quantization, export; “Results” Nemotron3.5Lightning comparison |
| R40.20 | documentation | AutoQuant KV: Automatic Mixed-Precision KV Cache Quantization | NVIDIA Model Optimizer Team | 8 October 2026 | [method and results](https://nvidia.github.io/Model-Optimizer/announcements/autoquant-kv.html) | [official repository](https://github.com/NVIDIA/Model-Optimizer) | official documentation | 2026-10-14 | Same unpinned generated-doc surface; “How KV AutoQuant works,” ILP/storage budget, candidate exclusion; “Combining KV and GEMM AutoQuant”; “Mixed-precision results” |
| R40.21 | paper | A Case Study of Selected PTQ Baselines for Reasoning LLMs on Ascend NPU | Yuchen Luo, Fangyue Zhu, Ruining Zhou, Mingzhe Huang, Jian Zhu, Fanyu Fan, Wei Shao | preprint 2026 | [v1 full text](https://arxiv.org/html/2602.17693v1) | null | preprint | 2026-10-14 | v1; §3.1 setup/sampling/hardware, §3.2 fake-quantization boundary and failure behavior, §3.3 Fig. 1, §4 partial real INT8 path, §5 bounded conclusion |
| R40.22 | repository | TorchAO README | PyTorch contributors | current repository | [official README](https://github.com/pytorch/ao) | same | official documentation | 2026-10-14 | Unpinned main; “Quantization-Aware Training” prepare/convert, “Memory-efficient optimizers,” integration routes. Not all dated news items are imported |
| R40.23 | documentation | llama.cpp quantize tool | ggml-org contributors | current repository | [quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md) | [official repository](https://github.com/ggml-org/llama.cpp) | official documentation | 2026-10-14 | Unpinned master; quantization usage and named GGUF types; no executable compatibility claim |

## P33

[PAPER-REPORTED] Manuscript §40.4 reconstructs the quadratic through its own Lagrange derivation and explicitly separates direct inverse pseudocode from GPTQ's Cholesky/lazy implementation. Table 6's five-to-one GPU change is retained in §40.6. The unversioned URL returned a PDF identifying v2; later versions were not assumed.

## P34

[PAPER-REPORTED] Only the originating scaling diagnostics and method are imported. The manuscript does not generalize TinyChat's advertised speedups, cross-domain claims or current project adoption. The nonmonotonic scale diagnostic has a fixed model/precision/group/task context.

## R40.3

[PAPER-REPORTED] Table 1 is a granularity diagnostic, not a final supported kernel comparison. The manuscript preserves this restriction rather than treating per-channel activation accuracy as executable INT8-GEMM evidence.

## P15

[PAPER-REPORTED] Spine identifier matches Appendix D's QLoRA entry. The fetched PDF is v1 despite the work's later publication history; claims are restricted to inspected §3. The chapter links to Chapter 23 for adapter methodology and does not duplicate it.

## R40.4

[PAPER-REPORTED] The source explains state decoding/update/encoding in registers. No modern bitsandbytes version or throughput is inferred from that historical implementation.

## R40.5

[PAPER-REPORTED] Affine quantization and exact-zero motivation are historical foundations. LLM performance is not inferred from mobile vision results.

## R40.6

[PAPER-REPORTED] Stochastic rounding's in-range condition and saturation are preserved. The manuscript derives conditional expectation explicitly and declines an optimizer-unbiasedness inference.

## R40.7

[PAPER-REPORTED] Local reconstruction follows source approximations about downstream preactivation curvature. The manuscript's relaxed penalty is an explanatory mathematical form, not an undocumented exact package configuration.

## R40.8

[PAPER-REPORTED] This source supports only the outlier-decomposition differential in §40.4. It is not evidence for NF4 or optimizer coding.

## R40.9

[PAPER-REPORTED] Streaming key groups and the recent residual are retained. Cache layout/resource ownership is developed further in Chapter 42; the source's headline speedup is not repeated without its complete performance record.

## R40.10

[PAPER-REPORTED] The report's §3.4 says it evaluates ten validation-preferred checkpoints and selects by benchmark average. That is a selection-dependence limitation, even though generation uses repeated sampling runs. No universal claim that RL-trained models require QAD is adopted. Appendix A's QAT parity case remains a counterexample to such a claim.

## R40.11

[PAPER-REPORTED] The paper and mutable README are separate records. Tensor-subclass descriptions establish framework design; they do not establish a locally executed kernel.

## R40.12

[OFFICIAL-DOCUMENTATION] The README supplied originating links to the 2026 disclosures. Announced throughput improvements are not imported without their primary workload context.

## R40.13

[OFFICIAL-DOCUMENTATION] Format version and quantization version are separate metadata. This chapter does not claim every GGUF tensor type is supported by every llama.cpp backend.

## R40.14

[OFFICIAL-DOCUMENTATION] Retrieval redirected to the safetensors organization. The raw header schema is inspected; the container's safety properties do not imply arbitrary external model code is safe.

## R40.15

[OFFICIAL-DOCUMENTATION] The latest hardware table excludes combinations and warns of change. No “supported” claim is elevated to an executed dispatch result.

## R40.16

[OFFICIAL-DOCUMENTATION] Constructor fields support an interface contract only. GPU/kernel support is not inferred from default arguments.

## R40.17

[OFFICIAL-DOCUMENTATION] Only format structure is used; vendor peak arithmetic rates are not represented as application throughput.

## R40.18

[OFFICIAL-DOCUMENTATION] The first-order-term omission and diagonal-Fisher approximation are source method assumptions, not consequences of a model merely being trained. Eligible-bit cost excludes embeddings/norms outside the search.

## R40.19

[OFFICIAL-DOCUMENTATION] Dual-scale export discards the pre-scale. The manuscript distinguishes its training-only role from the retained decoder scale. A complete independent replication remains UNVERIFIED.

## R40.20

[OFFICIAL-DOCUMENTATION] The example names commit 1d392999b45626f9c06ff0bc9797b03529fe24e3, but it was not checked out or executed here. The generated documentation revision is not an execution pin. Reported 5.76-bit payload reduction is modeled and KV-only with BF16 weights.

## R40.21

[PAPER-REPORTED] Main accuracy comparisons use fake quantization; native execution is a partial prototype. X2000 is an incompletely disclosed comparator identity, not a guessed device model.

## R40.22

[OFFICIAL-DOCUMENTATION] Preparation/conversion and integrations were inspected. Headline speedups and later-dated news were not adopted as chapter evidence.

## R40.23

[OFFICIAL-DOCUMENTATION] The tool documentation is an interface/format route. No quantized checkpoint was generated.

## Evidence gaps and closure boundary

| Gap | Status | Consequence |
|---|---|---|
| Exact locally tested package/driver/kernel combinations | UNVERIFIED | No executable compatibility or speed claim |
| Final quantized checkpoint and retained runtime logs | UNVERIFIED | Planned artifact is not delivered as an experimental result |
| Complete seeds, dataset hashes and uncertainty for 2026 vendor studies | NOT-DISCLOSED | Restrict comparisons to their disclosed settings |
| Independent replication of QAD/AutoQuant/scale learning | UNVERIFIED | Source attribution remains explicit |
| Full native Ascend quantized inference and X2000 identity | NOT-DISCLOSED | No generalized NPU speed or hardware comparison |
| Global literature coverage through all of 2026 | UNVERIFIED | Dated inspection boundary; no exhaustive frontier claim |
