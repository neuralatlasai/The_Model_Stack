---
id: "ms.references.47"
entity_type: "references"
title: "Chapter 47 — References"
volume: 2
part: 8
chapter: 47
section: null
slug: "references"
parent: "ms.chapter.47"
prev_sibling: "ms.verification.47"
next_sibling: null
children: []
prerequisites: ["ms.chapter.30","ms.chapter.43","ms.chapter.44","ms.chapter.45","ms.chapter.46"]
downstream: ["ms.chapter.48","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["observability","deployment","recovery"],"feedback_setting":[],"modality":["text"]}
papers: []
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 1500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# Chapter 47 references

[DERIVED] Primary surfaces below were actually inspected on **2026-10-14**. Versioned papers are pinned to the stated revision; current documentation and branch source are explicitly unpinned. Inspection does not imply execution or independent replication. No private logs or raw production trace were available.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| R47.1 | documentation | Metrics | vLLM project | Documentation / 2026 access | https://docs.vllm.ai/en/stable/design/metrics/ | https://github.com/vllm-project/vllm | official documentation | mutable stable, unpinned; 47.1: request timing definitions, output-event ITL, token counters, V1 event boundaries and collection semantics; “V1 design” and metric descriptions. Source clock claims checked separately against R47.2 | 2026-10-14 |
| R47.2 | documentation | time — Time access and conversions | Python Software Foundation | Python 3.15.0 docs / 2026 access | https://docs.python.org/3/library/time.html#time.monotonic | https://github.com/python/cpython | official documentation | 3.15 documentation surface, unpinned; 47.1: time.monotonic and change notes, shared-process clock qualifications, reference point and duration semantics | 2026-10-14 |
| R47.3 | paper | Privacy-Preserving Data Drift Detection and Recovery for Large-Scale LLM Applications via Proxy Representations | Michael Levit et al.; Microsoft | arXiv / 2026 | https://arxiv.org/html/2608.08245v1 | Not disclosed | preprint | v1, 2026-08-08; CC BY 4.0; 47.2: §§3–5 proxy extraction, JSD normalization, redundancy and Chow–Liu-style recovery; §§6–7 protocols/Tables 1–3/discriminator/feedback; GenAI usage. Conflicting round-trip baseline and satisfaction denominators explicitly retained | 2026-10-14 |
| R47.4 | documentation | Canarying Releases | Alec Warner, Štěpán Davidovič et al.; Google SRE | Site Reliability Workbook / 2018 | https://sre.google/workbook/canarying-releases/ | Worked example links in chapter | official documentation | mutable workbook HTML, unpinned; 47.3: worked App Engine candidate, Figures 16-3–16-4, risk/population/duration and attributable metrics. Illustrative defect, not inference experiment | 2026-10-14 |
| R47.5 | paper | Diagnosing Performance Changes by Comparing Request Flows | Raja R. Sambasivan et al. | USENIX NSDI / 2011 | https://www.usenix.org/legacy/events/nsdi11/tech/full_papers/Sambasivan.pdf | Not independently inspected | peer-reviewed | archival proceedings PDF; 47.4: §§3–5 flow categories, timing/structural mutation and precursor matching; §7 assumptions; §§8.1–8.3 six-case protocol and configuration-change case. Historical storage/distributed workloads, not LLM experiment | 2026-10-14 |
| R47.6 | paper | Fast Recovery for LLM Serving via Decoupled Device Memory Lifetime in Dynamo | Schwinn Saereesitthipitak et al.; NVIDIA | arXiv / 2026 | https://arxiv.org/html/2609.25451v1 | https://github.com/ai-dynamo/dynamo ; https://github.com/ai-dynamo/snapshot | preprint | v1, 2026-09-21; CC BY 4.0; 47.1/47.5/47.6: §§2–4 state/failure model, snapshot/GMS/shadow mechanisms; §5.1 testbed; Table 3; Figures 9–11; §5.6 counterfactual; Appendix A eligibility and Appendix B scrape uncertainty. Full methods/results inspected | 2026-10-14 |
| R47.7 | paper | Enhancing reliability in AI inference services: An empirical study on real production incidents | Bhala Ranganathan, Mickey Zhang, Kai Wu; Microsoft | arXiv / 2025 | https://arxiv.org/html/2511.07424v1 | Raw logs/code unavailable | preprint | v1; arXiv nonexclusive license; 47.6: §3 retrospective corpus/annotation; Tables 3–4; §6 Case B; §8 limitations and confidentiality. No acceptance inferred from placeholder conference field | 2026-10-14 |
| R47.8 | repository | MLPerf Inference LoadGen README | MLCommons | Official repository / 2026 access | https://raw.githubusercontent.com/mlcommons/inference/master/loadgen/README.md | https://github.com/mlcommons/inference | official documentation | master branch unpinned, not executed; 47.6: Introduction/Integration, SUT/QSL/QuerySampleComplete and external accuracy scorer; boundary only, no benchmark result claimed. Plan anchor https://mlcommons.org/benchmarks/inference-datacenter/ also opened | 2026-10-14 |
| R47.9 | repository | vllm/v1/metrics/stats.py | vLLM project | Official source / 2026 access | https://raw.githubusercontent.com/vllm-project/vllm/main/vllm/v1/metrics/stats.py | https://github.com/vllm-project/vllm | official documentation | main unpinned, not executed; 47.1: RequestStateStats, FinishedRequestStats, queued/scheduled/first/last token fields and timing-domain comments. No executed source validation | 2026-10-14 |
| R47.10 | documentation | Batch Invariance | vLLM project | Documentation / 2026 access | https://docs.vllm.ai/en/stable/features/batch_invariance/ | https://github.com/vllm-project/vllm | official documentation | mutable stable, unpinned; displayed 2026-09-27 update; 47.3–47.4: beta status, hardware/tested-model scope, deterministic kernels, disabled custom all-reduce/sequence parallelism and performance caveat | 2026-10-14 |
| R47.11 | documentation | Reproducibility | PyTorch project | PyTorch 2.14 documentation / 2026 access | https://docs.pytorch.org/docs/2.14/notes/randomness.html | https://github.com/pytorch/pytorch | official documentation | versioned docs surface, unpinned; 47.3–47.4: reproducibility across releases/platforms, seed scope, deterministic algorithms and cost; sections “Controlling sources” and “Avoiding nondeterministic algorithms” | 2026-10-14 |
| R47.12 | repository | Snapshot README | NVIDIA / ai-dynamo | Official source / 2026 access | https://raw.githubusercontent.com/ai-dynamo/snapshot/main/README.md | https://github.com/ai-dynamo/snapshot | official documentation | main unpinned; Apache-2.0 badge; 47.5: checkpoint/restore primitives, orchestration boundary, compatibility prerequisites and evolving-API note. README benchmark headline not used as paper evidence | 2026-10-14 |

## Evidence and licensing boundaries

[DERIVED] R47.3 and R47.6 explicitly carry CC BY 4.0. Their mechanisms and experiments are attributed adaptations; the chapter's estimators, counterexamples, release controller, fencing protocol and evidence-ledger synthesis are independently developed explanations. Other source-derived case prose is compact, with no long quotations. R47.7's annotation agreement is descriptive reliability rather than causal validation.

[NOT-DISCLOSED] Private production logs, exact ProxyDrift classifier/generator/judge revisions, and consistent feedback denominators are unavailable. The incident study does not expose an independently executable artifact. Its placeholder venue field is not evidence of publication acceptance. Shadow evaluation and retrospective recovery estimates do not establish evaluated multi-node failures.

[UNVERIFIED] No repository was pinned to a commit or executed. Documentation may change after access. Bitwise reproducibility, serving overhead, failure-injection timings, diagnostic accuracy, rollback success, and task-quality calibration are not book-measured. Proposed checks appear only in [verification](verification.md).
