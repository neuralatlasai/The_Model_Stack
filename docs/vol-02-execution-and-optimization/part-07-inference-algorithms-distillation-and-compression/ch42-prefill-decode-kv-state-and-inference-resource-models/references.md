---
id: ms.references.42
entity_type: references
title: "Chapter 42 references"
volume: 2
part: 7
chapter: 42
section: null
slug: references
parent: ms.chapter.42
prev_sibling: ms.verification.42
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [resource_accounting], feedback_setting: [], modality: [text]}
papers: [P36]
implementations: [impl.vllm, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 42 references

[DERIVED] Access dates below are actual inspections on 2026-10-14. Full-text method, experiment, appendix or named official documentation sections were opened using web retrieval; metadata/abstracts were used only for bibliographic identity. Repository links identify authors' artifacts and are not claims of code execution. No repository/commit check was executed. All mutable stable documentation is explicitly unpinned unless an exact documentation version is given.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P36 | paper | Efficient Memory Management for Large Language Model Serving with PagedAttention | Woosuk Kwon, Zhuohan Li, Siyuan Zhuang, Ying Sheng, Lianmin Zheng, Cody Hao Yu, Joseph E. Gonzalez, Hao Zhang, Ion Stoica | SOSP 2023 | https://arxiv.org/pdf/2309.06180v1 | https://github.com/vllm-project/vllm | peer-reviewed | 2026-10-14 | v1, 12 Sep 2023; §2.2 phases; §3/Fig.3 fragmentation; §§4.1–4.6 paging, sharing, preemption/distribution; Table1/§6.1 protocol; Figs.2,14–16 memory/reuse |
| R42.1 | documentation | Automatic Prefix Caching | vLLM project | 2026 inspected surface | https://docs.vllm.ai/en/stable/design/prefix_caching/ | https://github.com/vllm-project/vllm | official documentation | 2026-10-14 | Unpinned stable; opening hash/serialization notes; Data Structure; Operations: Block Allocation, Free, Eviction; cache-salt example |
| R42.2 | documentation | Hybrid KV Cache Manager | vLLM project | 2026 inspected surface | https://docs.vllm.ai/en/stable/design/hybrid_kv_cache_manager/ | https://github.com/vllm-project/vllm | official documentation | 2026-10-14 | Unpinned stable page states based on historical commit458e74; Definitions: distinct page-size conventions; Allocation Cases1–4; Prefix caching Cases0–3; Implementation |
| R42.3 | documentation | CUDA semantics | PyTorch contributors | PyTorch2.14 | https://docs.pytorch.org/docs/2.14/notes/cuda.html | https://github.com/pytorch/pytorch | official documentation | 2026-10-14 | Versioned2.14 docs, no repository commit checked; Memory management: allocated/reserved, allocator-backend caveat; Graph memory management: graph-private pools and address stability |
| R42.4 | documentation | Conserving Memory | vLLM project | 2026 inspected surface | https://docs.vllm.ai/en/stable/configuration/conserving_memory/ | https://github.com/vllm-project/vllm | official documentation | 2026-10-14 | Unpinned stable; Context length and batch size; Reduce CUDA Graphs; Adjust cache size; tensor-parallel memory controls |
| R42.5 | paper | KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache | Zirui Liu, Jiayi Yuan, Hongye Jin, Shaochen Zhong, Zhaozhuo Xu, Vladimir Braverman, Beidi Chen, Xia Hu | ICML2024, PMLR235:32332–32344 | https://arxiv.org/pdf/2402.02750v2 | https://github.com/jy-yuan/KIVI | peer-reviewed | 2026-10-14 | v2,25Jul2024; §§3.2–3.3 axes/system path; §4.1 protocol; §4.2/Table3 model dependence; AppendixA Algorithm1 online residual/flush; PMLR identity cross-checked |
| R42.6 | paper | Taming Throughput-Latency Tradeoff in LLM Inference with Sarathi-Serve | Amey Agrawal, Nitin Kedia, Ashish Panwar, Jayashree Mohan, Nipun Kwatra, Bhargav S. Gulavani, Alexey Tumanov, Ramachandran Ramjee | OSDI2024 | https://arxiv.org/pdf/2403.02310v3 | https://github.com/microsoft/sarathi-serve | peer-reviewed | 2026-10-14 | v3,17Jun2024; §2.3 parallel costs; §§4.1–4.4 chunking/mixed schedules/pipelines; §5 Tables2–3 workloads/SLOs, §5.3 distributed study, §5.4 ablations |
| R42.7 | paper | Efficient Streaming Language Models with Attention Sinks | Guangxuan Xiao, Yuandong Tian, Beidi Chen, Song Han, Mike Lewis | ICLR2024 | https://arxiv.org/html/2309.17453v4 | https://github.com/mit-han-lab/streaming-llm | peer-reviewed | 2026-10-14 | v4,7Apr2024; §3.2 cache-relative positions and pre-RoPE keys; §4.1 PG19 protocol; Table1 sink ablation; §§4.3–4.4 and AppendicesC–D limitations |
| R42.8 | paper | H2O: Heavy-Hitter Oracle for Efficient Generative Inference of Large Language Models | Zhenyu Zhang, Ying Sheng, Tianyi Zhou, Tianlong Chen, Lianmin Zheng, Ruisi Cai, Zhao Song, Yuandong Tian, Christopher Ré, Clark Barrett, Zhangyang Wang, Beidi Chen | NeurIPS2023 | https://arxiv.org/pdf/2306.14048v3 | https://github.com/FMInference/H2O | peer-reviewed | 2026-10-14 | v3,18Dec2023; §4.1 Algorithm1; §4.2 theorem/implementation; §5 protocol; AppendixA systems; AppendixD.6 detailed accumulated-score procedure and assumptions |
| R42.9 | documentation | KV Offloading Usage Guide | vLLM project | 2026 inspected surface | https://docs.vllm.ai/en/stable/features/kv_offloading_usage/ | https://github.com/vllm-project/vllm | official documentation | 2026-10-14 | Unpinned stable; Overview: CPU and secondary-tier staging; Per-request load control: aligned cap/recompute; completed prefix block transfer semantics |
| R42.10 | paper | Prefill/Decode-Aware Evaluation of LLM Inference on Emerging AI Accelerators | Shun Usami, Venkatram Vishwanath, E. Wes Bethel | arXiv2026 | https://arxiv.org/html/2606.17104v1 | null | preprint | 2026-10-14 | v1,14Jun2026; §§III–IV execution/protocol; Algorithm1/TableII token-counter ambiguity; §V conditional phase findings; not a semantic-quality or client-streaming test |
| R42.11 | documentation | Quantized KV Cache | vLLM project | 2026 inspected surface | https://docs.vllm.ai/en/stable/features/quantization/quantized_kvcache/ | https://github.com/vllm-project/vllm | official documentation | 2026-10-14 | Unpinned stable; opening Flash Attention3 arithmetic note; Supported FP8 KV-Cache Quantization Schemes; Scale Calibration Approaches; layer skipping |
| R42.12 | documentation | Parallelism and Scaling | vLLM project | 2026 inspected surface | https://docs.vllm.ai/en/stable/serving/parallelism_scaling/ | https://github.com/vllm-project/vllm | official documentation | 2026-10-14 | Unpinned stable; Distributed inference strategies for a single-model replica; capacity/concurrency log definitions; multi-node network boundaries |
| R42.13 | documentation | Expert Parallel Deployment | vLLM project | 2026 inspected surface | https://docs.vllm.ai/en/stable/serving/expert_parallel_deployment/ | https://github.com/vllm-project/vllm | official documentation | 2026-10-14 | Unpinned stable; Backend Selection Guide; Layer Behavior with EP Enabled; Expert Parallel Load Balancer and Memory Footprint Overhead; Performance Optimization |
| R42.14 | paper | An Approximate Queueing Model of LLM Inference Serving for SLO-Driven Autoscaling | Vishakha Ramani, Asser N. Tantawi; IBM T. J. Watson Research Center | arXiv2026 | https://arxiv.org/html/2609.20957v1 | null | preprint | 2026-10-14 | v1,17Sep2026; §§IV–V conditions/work/occupancy; Eqs.6–10; §VI/TableI 224-point joint fit and excluded saturation; §VII tuner; §VIII controller boundary |
| R42.15 | paper | Large-Scale LLM Inference with Heterogeneous Workloads: Prefill-Decode Contention and Asymptotically Optimal Control | Ruihan Lin, Zezhen Ding, Zean Han, Jiheng Zhang | arXiv2026 | https://arxiv.org/html/2602.02987v1 | null | preprint | 2026-10-14 | v1,3Feb2026; §2.2 Eqs.1–4 mixed/solo rates; §2.3 exponential service assumptions; §3 fluid model; §§6.1–6.2 calibration/simulation/Figs.3–5 |
| R42.16 | documentation | Reproducibility | vLLM project | 2026 inspected surface | https://docs.vllm.ai/en/stable/usage/reproducibility/ | https://github.com/vllm-project/vllm | official documentation | 2026-10-14 | Unpinned stable; opening offline/online reproducibility settings and same-hardware/version qualification; no cross-version reproducibility claim |

## P36

[DERIVED] The Appendix D identity is preserved exactly. The inspected PDF is v1 and includes the SOSP proceedings identity. Its arXiv license link resolves to [CC BY4.0](https://creativecommons.org/licenses/by/4.0/). This manuscript supplies original explanation and independent accounting; the original authors retain attribution. Historical results are not transferred to current vLLM releases.

## R42.1

[OFFICIAL-DOCUMENTATION] Opened the full design surface, including hash extras, serialization notes and allocation/free/eviction subsections. No repository revision was pinned or executed. A documented reusable-key schema is not evidence that every supported model's conditioning dependencies were independently audited.

## R42.2

[OFFICIAL-DOCUMENTATION] The page names 458e74 as its design basis. That short historical reference is recorded as a documentation disclosure only. It must not be read as a commit-verified current implementation. The page remains a moving stable surface.

## R42.3

[OFFICIAL-DOCUMENTATION] The stable CUDA notes redirected to the versioned2.14 URL above. Tensor occupancy, allocator reserve and global process counters have different scopes. The allocator-backend qualification and graph pool's liveness are part of the claim.

## R42.4

[DERIVED] Documented configuration controls identify execution choices that change the ledger. Their names do not establish a measured byte saving for any configuration in this chapter.

## R42.5

[DERIVED] Bibliographic identity also checked at https://proceedings.mlr.press/v235/liu24bz.html. Full method/appendix inspection used arXiv v2. Its license resolves to CC BY4.0. Code is identified by the paper, not executed; reported outcomes remain source outcomes.

## R42.6

[DERIVED] Method, environment, SLO construction and ablation passages were inspected. The manuscript's account is compact; the independently derived ring and fill/drain examples are analytical cases, not new Sarathi-Serve measurements.

## R42.7

[DERIVED] The inspected HTML explicitly lists CC BY4.0. Stable streaming perplexity and retained-context retrieval are separated. Source-relative positional conventions are retained rather than replaced by an unspecified rolling-window implementation.

## R42.8

[DERIVED] Detailed AppendixD.6 clarifies accumulated scores and fixed-budget transitions. The theorem's score-function conditions are not elevated to a task-accuracy theorem. No historical speedup is imported as a current-engine result.

## R42.9

[DERIVED] This documentation concerns tiered completed-prefix blocks and demand promotion. Generic active-state remote attention is not implied.

## R42.10

[UNVERIFIED] Algorithm1's output-loop counter versus first-token selection needs executable artifact clarification. The chapter reports the ambiguity, not a fabricated correction to the study. Exact binary hashes and the semantic-quality boundary remain unresolved.

## R42.11

[DERIVED] Backend-conditioned scale granularity and arithmetic precision were inspected. Runtime support is a documentation promise at access time; no compatibility check was performed.

## R42.12

[DERIVED] Storage-based maximum concurrency is distinguished from measured throughput and online goodput. No illustrative log value from the guide is treated as a chapter benchmark.

## R42.13

[DERIVED] The EP group relation and attention-versus-expert ownership were inspected. No dependency installation or multi-node deployment was performed; missing local execution stays UNVERIFIED.

## R42.14

[DERIVED] Numerical errors are joint-fit errors in the evaluated light/moderate domain, not held-out performance or quantile guarantees. Mean independent lengths, occupancy-only Markovian service and Poisson arrivals delimit the model. The paper's hardware-plausibility calculation does not substitute for kernel profiling.

## R42.15

[DERIVED] Physical calibration and event simulation are separate evidence layers. Five-seed simulations at growing cluster sizes are not physical measurements of those cluster sizes. The basic router's class-wise occupancy drift is retained as a negative result.

## R42.16

[OFFICIAL-DOCUMENTATION] Reproducibility guidance is explicitly conditional on the same hardware and vLLM version. A seed alone is not documented as a universal cross-schedule or cross-version guarantee.

## Evidence gaps and search boundary

| Gap | Evidence status | Consequence |
|---|---|---|
| Exact current runtime commits, model hashes, driver/container and backend configurations | UNVERIFIED | No compatibility or executable performance certification |
| Full peak allocation and communication traces for manuscript configurations | UNVERIFIED | Estimator artifact remains proposed |
| Current hybrid design versus historical page basis | UNVERIFIED | Use documentation contract, not asserted current code identity |
| Source omissions in seeds, evaluator/binary hashes, common runtime and matched method comparisons | NOT-DISCLOSED | Restrict conclusions to disclosed studies |
| Numerical/reuse equivalence across warm state, batch, ranks and backend | UNVERIFIED | No bitwise-output guarantee |
| Source R42.10 output accounting ambiguity | UNVERIFIED | No exact cross-study token-throughput normalization |
| Mean prediction transferred to nonstationary/near-saturation tails | UNVERIFIED | No p95/p99 guarantee |
| 2025 NeurIPS successor search (NSNQuant, PolarQuant, KVzip and others) | UNVERIFIED for detailed claims not inspected to usable method depth | Search candidates omitted from taught methodology and results |

[DERIVED] The search covered the plan's P36/vLLM anchors, originating reports, arXiv revisions, archival KIVI identity and 2025/2026 discovery queries. It was not an exhaustive review of all publications through October2026. A failed/mismatched candidate retrieval was excluded rather than assigned invented content.
