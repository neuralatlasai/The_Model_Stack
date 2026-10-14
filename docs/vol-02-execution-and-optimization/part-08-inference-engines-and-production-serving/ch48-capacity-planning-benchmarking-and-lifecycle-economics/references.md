---
id: ms.references.48
entity_type: references
title: "Chapter 48 references"
volume: 2
part: 8
chapter: 48
section: null
slug: references
parent: ms.chapter.48
prev_sibling: ms.verification.48
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [inference, serving], mechanism: [resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.nvidia-triton-inference-server]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 48 references

[DERIVED] Actual inspection date is 2026-10-14 for every entry. Full-text paper/protocol inspection is distinguished from abstract-only or mutable-source access. Repository inspection establishes narrow text/interface properties, not executed implementation behavior.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| R48.1 | paper | ServeGen: Workload Characterization and Generation of Large Language Model Serving in Production | Yuxing Xiang; Xue Li; Kun Qian; Wenyuan Yu; Ennan Zhai; Xin Jin | arXiv 2025 | https://arxiv.org/html/2505.09999v1 | null | preprint | v1, CC BY-SA 4.0; §§3.1–3.3 rate/client/length fits; §5 sessions/reasoning; §6.1 generator and sanitized release; §6.3/Fig. 20 provisioning; §7 content/cache limits. | 2026-10-14 |
| R48.2 | paper | A Year in LLM Serving: Workload Evolution, Caching and Load-Balancing | William Nixon; Jon Durbin; Florian Standhartinger; Haryadi S. Gunawi; Juncheng Yang | arXiv 2026 | https://arxiv.org/html/2608.13573v1 | null | preprint | v1; §§3–5/Tables 2–3 longitudinal fields/mix; §6 realized cache logging only final two months; Introduction footnote 1 trace release promised. No downloaded trace or reproduction. | 2026-10-14 |
| R48.3 | paper | Towards Efficient and Reliable LLM Serving: A Real-World Workload Study | Yuxin Wang; Yuhan Chen; Zeyu Li; Zhenheng Tang; Rui Guo; Xin Wang; Qiang Wang; Amelie Chi Zhou; Xiaowen Chu | arXiv 2024 | https://arxiv.org/html/2401.17644v1 | https://github.com/HPMLL/BurstGPT | preprint | v1 full text, CC BY 4.0; III workload/BurstGPT; IV generator; V case-study structure. Later abstract title/scale differs; manuscript does not import later-version counts into v1. | 2026-10-14 |
| R48.4 | repository | wrk2 README | Gil Tene and wrk2 contributors | inspected 2026 | https://raw.githubusercontent.com/giltene/wrk2/44a94c17d8e6a0bac8559b53da76848e430cb7a7/README.md | https://github.com/giltene/wrk2 | official documentation | Commit 44a94c17d8e6a0bac8559b53da76848e430cb7a7; intended-time accounting discussion lines 272–337; Examples 1–2 HTTP demonstrations. Static text inspection, no load executed. | 2026-10-14 |
| R48.5 | documentation | GenAI-Perf | NVIDIA / Triton contributors | 2026 inspected surface | https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/perf_analyzer/genai-perf/README.html | https://github.com/triton-inference-server/perf_analyzer | official documentation | Unpinned guide; Model Inputs, concurrency/request rate, Metrics lines 451–464 (response/chunk/native-count boundary), GPU Telemetry. Printed output is illustrative, not a current benchmark result. | 2026-10-14 |
| R48.6 | documentation | vllm bench serve | vLLM contributors | stable inspected 2026 | https://docs.vllm.ai/en/stable/cli/bench/serve/ | https://github.com/vllm-project/vllm | official documentation | Unpinned stable; dataset/input/output controls; request-rate/burstiness/max-concurrency; goodput allowed ttft/tpot/e2el in milliseconds. No task-quality evaluator inferred. | 2026-10-14 |
| R48.7 | repository | vLLM serving benchmark source | vLLM contributors | inspected 2026 | https://raw.githubusercontent.com/vllm-project/vllm/badfcdbf919532624b2296eeacb85c6dd9fe2e58/vllm/benchmarks/serve.py | https://github.com/vllm-project/vllm | official documentation | Commit badfcdbf919532624b2296eeacb85c6dd9fe2e58; get_request 374 onward; calculate_metrics 534–709, short-output TPOT 583–589; benchmark/limited_request_func 900–915 client_queue_time. Static inspection only. | 2026-10-14 |
| R48.8 | paper | MLPerf Inference Benchmark | Vijay Janapa Reddi et al. | arXiv 2019 inspected revision | https://arxiv.org/html/1911.02549v1 | https://github.com/mlcommons/inference | preprint | v1 full text; §§3–4 goals/SUT/query/quality/scenarios; §4.5 scenario metrics; §4.6 confidence; §4.7 LoadGen. Historical rules, not 2026 task prescriptions. | 2026-10-14 |
| R48.9 | paper | Vidur: A Large-Scale Simulation Framework for LLM Inference | Amey Agrawal; Nitin Kedia; Jayashree Mohan; Ashish Panwar; Nipun Kwatra; Bhargav S. Gulavani; Ramachandran Ramjee; Alexey Tumanov | MLSys 2024 | https://proceedings.mlsys.org/paper_files/paper/2024/file/b74a8de47d2b3c928360e0a011f48351-Paper-Conference.pdf | https://github.com/microsoft/vidur | peer-reviewed | Archival PDF; §§4–6 operator/event/search method; §7.1 hardware/models/traces; §7.2/Figs. 3–4 metric domains; Appendix A near-capacity errors. Abstract-page <5% headline differs from full-paper qualifications; no universal ceiling used. | 2026-10-14 |
| R48.10 | paper | A Proof for the Queuing Formula: L = λW | John D. C. Little | Operations Research 9(3):383–387, 1961 | https://pubsonline.informs.org/doi/10.1287/opre.9.3.383 | null | peer-reviewed | Publisher abstract/identity inspected; finite stationary means/nonzero ergodic arrival condition. PDF route redirected to abstract; full original proof unavailable in this inspection. Book sample-path derivation is explicitly original. | 2026-10-14 |
| R48.11 | measurement source | MLCommons Sets Participation Record with New MLPerf Inference v6.1 Benchmark Results | MLCommons | 16 September 2026 | https://mlcommons.org/2026/09/mlperf-inference-v6-1-results/ | https://github.com/mlcommons/inference | official documentation | Unpinned page; new RAG/edge-agentic tests and API-centric harness discussion. No individual hardware speedup copied without original row/configuration inspection. | 2026-10-14 |
| R48.12 | documentation | MLPerf Endpoints Submitter Documentation | MLCommons | 2026 inspected v1.0 draft | https://docs.mlcommons.org/endpoints-submission-docs/ | https://github.com/mlcommons/endpoints-submission-docs | official documentation | Home/Round status: October 12 opening, v1.0 draft/WIP and policy precedence; What is Endpoints; Plan your curve; Metrics and regions; Requirements inspected. | 2026-10-14 |
| R48.13 | repository | MLPerf Endpoints Rules | MLCommons Endpoints Rules Task Force | v1.0 draft, v1.0_rules_dev | https://raw.githubusercontent.com/mlcommons/endpoints_policies/a6428d38e6691c0d90cb8a27ec4acbe98c2bf90f/endpoints_rules.md | https://github.com/mlcommons/endpoints_policies | official documentation | Commit a6428d38e6691c0d90cb8a27ec4acbe98c2bf90f; §§4.1/4.4 metrics/windows; §4.5 provisioned-power model; §§5–6 fixed concurrency/offline/WIP duration rules. Explicit tentative sections retained. | 2026-10-14 |
| R48.14 | repository | steady_state_diagnostics guide | MLCommons endpoints contributors | pinned 2026 source | https://raw.githubusercontent.com/mlcommons/endpoints/3a51022c2f52dea27fc0338b91df781c3871f538/scripts/steady_state_diagnostics.md | https://github.com/mlcommons/endpoints | official documentation | Commit 3a51022c2f52dea27fc0338b91df781c3871f538; What it does, Interpreting output (reciprocal mean TPOT), Anomaly/Warning and Caveats tokenization parity. No diagnostic executed. | 2026-10-14 |
| R48.15 | documentation | Introducing the MLPerf End-to-End RAG Inference Benchmark | MLCommons Inference Working Group | 26 August 2026 | https://mlcommons.org/2026/08/endtoend-inference/ | https://github.com/mlcommons/inference | official documentation | Unpinned page; Dataset and task selection (FRAMES frozen corpus); Model selection/judge; Performance metrics: Offline ingestion documents/s and QnA tasks/s, Server future. No benchmark run reproduced. | 2026-10-14 |
| R48.16 | measurement source | Artificial Analysis Benchmarking Methodology | Artificial Analysis | 2026 inspected surface | https://artificialanalysis.ai/methodology | null | official documentation | Unpinned page; Scope and Definitions: model/endpoint/system; external text tokens versus native pricing units. Not originating architecture evidence. | 2026-10-14 |
| R48.17 | measurement source | Language Model API Performance Benchmarking Methodology | Artificial Analysis | v2.2.0, 2 March 2026 | https://artificialanalysis.ai/methodology/performance-benchmarking | null | official documentation | Unpinned versioned page; Workload Types/Load Scenarios/Representation; client location; token/answer/reasoning definitions; Known Limitations; Version History. No endpoint number independently replicated. | 2026-10-14 |
| R48.18 | measurement source | System Load Test (AA-SLT) Methodology | Artificial Analysis | 2026 inspected surface | https://artificialanalysis.ai/methodology/system-load-test | null | official documentation | Unpinned page; Overview fixed-concurrency completion replacement; Specifications three-minute 1K/1K phases; Metrics response rate means at least one token. No task-success inference. | 2026-10-14 |
| R48.19 | dataset card | Data on AI models | Epoch AI | page updated 14 October 2026 | https://epoch.ai/data/ai-models | https://epoch.ai/data/all_ai_models.csv | official documentation | Mutable page; Documentation/Downloads/FAQ: non-exhaustive development metadata and directly sourced/estimated fields. CSV was not downloaded or audited here; CC attribution terms disclosed. | 2026-10-14 |
| R48.20 | dataset card | AI models documentation: Overview | Epoch AI | 2026 inspected surface | https://epoch.ai/data/ai-models-documentation | null | official documentation | Unpinned Overview: inclusion, records, estimates and daily CSV revisions. Dataset metadata is not an inference endpoint/capacity measurement. | 2026-10-14 |
| R48.21 | paper | SpotServe: Serving Generative Large Language Models on Preemptible Instances | Xupeng Miao; Chunan Shi; Jiangfei Duan; Xiaoli Xi; Dahua Lin; Bin Cui; Zhihao Jia | ASPLOS 2024; inspected arXiv v1 | https://arxiv.org/html/2311.15566v1 | https://github.com/Hsword/SpotServe | preprint | v1, CC BY 4.0; §§3–5 controller/migration/recovery; §6.1 traces/T4/models/baselines; §6.2/Fig. 7 paired cost/latency tradeoff; §8 strict-SLO/grace-period limits. Historical tariffs not reused as current prices. | 2026-10-14 |
| R48.22 | repository | SpotServe Artifact | SpotServe authors | inspected 2026 repository | https://github.com/Hsword/SpotServe | https://github.com/Hsword/SpotServe | official documentation | Unpinned repository README; hardware/dependency requirements and global server/params client/modified FasterTransformer components. No build, compatibility or reproduction executed. | 2026-10-14 |

## Inspection and limits

[DERIVED] Git ls-remote resolved the pinned wrk2, vLLM and MLCommons development-policy commits before the immutable files were reopened. The Endpoints diagnostic revision is the exact commit linked by the inspected policy. No source build, simulator, load generator, endpoint test or financial measurement was executed. Documentation version and benchmark round remain part of each claim.

[UNVERIFIED] The 2026 Charon MLSys paper was screened at its official abstract; full-PDF retrieval timed out, so no method/result claim relies on it. An unrelated arXiv identifier opened during discovery was discarded. The longitudinal workload artifact release remains promised in inspected text. Little's PDF route returned the abstract; its full proof is not claimed inspected. Mutable endpoint/data surfaces cannot establish permanent current prices or reproducible private execution.

## R48.1

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.2

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.3

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.4

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.5

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.6

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.7

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.8

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.9

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.10

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.11

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.12

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.13

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.14

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.15

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.16

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.17

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.18

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.19

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.20

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.21

See its ledger row for the inspected URL, revision, locator and claim boundary.

## R48.22

See its ledger row for the inspected URL, revision, locator and claim boundary.
