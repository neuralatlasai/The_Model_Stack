---
id: ms.references.46
entity_type: references
title: Chapter 46 sources and evidence ledger
volume: 2
part: 8
chapter: 46
section: null
slug: references
parent: ms.chapter.46
prev_sibling: ms.verification.46
next_sibling: null
children: []
prerequisites: [ms.chapter.6, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45]
downstream: [ms.chapter.47, ms.chapter.48, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [serving_control_plane], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.tensorrt-llm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-14
editorial_status: manuscript_draft
---


# Chapter 46 — Primary sources and evidence ledger

[KNOWN] Every entry below was opened on 2026-10-14 at the method, result, standard or implementation locator stated. A fixed paper revision is distinct from a mutable documentation surface. Source inspection establishes attributed text/source properties; it does not certify executable service behavior.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| R46.1 | paper | OpScale: Operator-level Provisioning and Autoscaling for LLM Serving | Xingqi Cui et al. | arXiv 2026 | [OpScale](https://arxiv.org/html/2608.13499v1) | nano-vLLM integration described; exact artifact unpinned | preprint | v1, 2026-08-13; CC BY-NC-SA 4.0; §§3–4 optimization/profiling/placement/execution; §§5.1–5.7, Figures 13/19 and Tables 1/2; Appendix B. Common-backend comparison and cadence confound. | 2026-10-14 |
| R46.2 | paper | Decomposing Predictive Kubernetes Autoscaling for Large Language Model Serving Under Long Startup Delays | Tianrui Liu; Xiaohai Hu | arXiv 2026; author-reported CloudCom acceptance | [Predictive autoscaling](https://arxiv.org/html/2609.20874v1) | Not released in inspected §VII | preprint | v1, 2026-09-16; §§III–V; forecast/margin/capacity equations; Table I five-seed simulation; Table III distinct five-minute hardware experiment; §VII availability. No calibrated-UCB theorem. | 2026-10-14 |
| R46.3 | paper | RouteLLM: Learning to Route LLMs with Preference Data | Isaac Ong et al. | arXiv 2024 | [RouteLLM: Learning to Route LLMs with Preference Data](https://arxiv.org/html/2406.18665v1) | https://github.com/lm-sys/RouteLLM | preprint | v1, 2024-06-26; §2 objective/threshold; §3.2 Eqs. 10–11 matrix factorization; §4 training/evaluation; Tables 1–3 and §4.2 shift analysis. Historical model pair and judged/gold augmentation. | 2026-10-14 |
| R46.4 | documentation | Ray Serve production best practices | Ray project | current | [Ray Serve production best practices](https://docs.ray.io/en/latest/serve/production-guide/best-practices.html) | https://github.com/ray-project/ray | official documentation | Unpinned latest, displayed Ray 2.59.0; Load shedding / max_queued_requests and max_ongoing_requests. Per-handle scope, BackPressureError, default 503 and custom 429. | 2026-10-14 |
| R46.5 | documentation | Horizontal Pod Autoscaling | Kubernetes project | current | [Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | https://github.com/kubernetes/kubernetes | official documentation | Unpinned; Algorithm details, missing metrics/not-yet-ready handling, multiple metrics, downscale stabilization. Replica-ratio rule and default control intervals are configuration semantics. | 2026-10-14 |
| R46.6 | documentation | Pod Lifecycle | Kubernetes project | current | [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/) | same | official documentation | Unpinned; Pod termination flow, terminating endpoints, termination grace period, force deletion. API object deletion is not proof that all work has stopped. | 2026-10-14 |
| R46.7 | documentation | Circuit breaking | Envoy project | current | [Circuit breaking](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking.html) | https://github.com/envoyproxy/envoy | official documentation | Unpinned latest, displayed 1.41.0-dev; resource ceilings, retry budgets and worker-thread eventual consistency. Displayed build hash changed across fetches, so no immutable revision is claimed. | 2026-10-14 |
| R46.8 | documentation | Timeouts, retries, and backoff with jitter | Marc Brooker / AWS | first-party engineering disclosure | [Timeouts, retries, and backoff with jitter](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter) | Not supplied | official documentation | Unpinned republication displayed 2026-06-12, modified 2026-06-15; Timeouts, Retries and backoff, Jitter. Original Builders Library URL redirected here; republication date is not invention date. | 2026-10-14 |
| R46.9 | documentation | RFC 9110: HTTP Semantics | Roy Fielding; Mark Nottingham; Julian Reschke / IETF | RFC, 2022 | [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) | Not applicable | official documentation | Fixed RFC, June 2022; §6.2 control data, §9.2.2 idempotency, §10.2.3 Retry-After. HTTP intended-effect semantics do not certify external exactly-once actions. | 2026-10-14 |
| R46.10 | documentation | RFC 9457: Problem Details for HTTP APIs | IETF | RFC, 2023 | [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html) | Not applicable | official documentation | Fixed RFC; §§3.1.1–3.1.5 type/status/title/detail/instance; §3.2 extension members. Machine-readable error identity is separate from human detail. | 2026-10-14 |
| R46.11 | documentation | HTML Living Standard: Server-sent events | WHATWG | living standard | [HTML Living Standard: Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html) | https://github.com/whatwg/html | official documentation | Unpinned living text; §§9.2.3–9.2.6 processing, Last-Event-ID, UTF-8 parsing and event dispatch. Browser EventSource reconnection does not establish POST streaming-resume semantics. | 2026-10-14 |
| R46.12 | documentation | vLLM Security | vLLM project | current | [vLLM Security](https://docs.vllm.ai/en/stable/usage/security/) | https://github.com/vllm-project/vllm | official documentation | Unpinned stable; API Key Authentication Limitations, guarded/unguarded routes, internal-port exposure and plugin boundaries. | 2026-10-14 |
| R46.13 | repository | AuthenticationMiddleware | vLLM project | immutable source inspection | [AuthenticationMiddleware](https://github.com/vllm-project/vllm/blob/a2fb4827324bf023075799ef3d70d347834b8137/vllm/entrypoints/serve/middleware/authenticate.py) | same | official documentation | Commit a2fb4827324bf023075799ef3d70d347834b8137; lines 11/14 guarded prefixes/class; verify_token lines 30–45; __call__ lines 47–62. Raw source fetched/read; SHA-256 ceb576aa3c053a5bcf145cfbe3f81def0f7213480c4aa1531fc4c00e32955225. No runtime check. | 2026-10-14 |
| R46.14 | documentation | Load-aware routing | vLLM Production Stack | current | [Load-aware routing](https://docs.vllm.ai/projects/production-stack/en/latest/use_cases/loadaware-routing.html) | https://github.com/vllm-project/production-stack | official documentation | Unpinned latest; How It Works, cache-match fraction, relative in-flight load, beta tradeoff and fallback route. Documented score, no independent latency measurement. | 2026-10-14 |
| R46.15 | documentation | Autoscaling with KEDA | vLLM Production Stack | current | [Autoscaling with KEDA](https://docs.vllm.ai/projects/production-stack/en/latest/use_cases/autoscaling-keda.html) | same | official documentation | Unpinned latest; requirements and Prometheus/KEDA configuration example. Deployment route and waiting-request metric, not a universal scaling policy. | 2026-10-14 |
| R46.16 | documentation | Dynamo Planner | NVIDIA | current v1.5.1 surface | [Dynamo Planner](https://docs.nvidia.com/dynamo/kubernetes/auto-deployment/dynamo-planner) | https://github.com/ai-dynamo/dynamo | official documentation | Unpinned latest URL displayed v1.5.1; Optimization targets, SLA planner flags/intervals, profiling/bootstrap, advisory mode, Guardrails. Explicit current no-drain scale-down limitation. | 2026-10-14 |
| R46.17 | documentation | Dynamo Python API: KvRouterConfig | NVIDIA | current v1.5.1 surface | [Dynamo Python API: KvRouterConfig](https://docs.nvidia.com/dynamo/reference/api/python/_core) | same | official documentation | Unpinned latest; KvRouterConfig field descriptions including overlap/load weights, tracking and experimental decode-active-request weight. No inferred source implementation. | 2026-10-14 |
| R46.18 | paper | A Unified Approach to Routing and Cascading for LLMs | Jasper Dekoninck; Maximilian Baader; Martin Vechev | ICML 2025 / PMLR 267 | [A Unified Approach to Routing and Cascading for LLMs](https://arxiv.org/html/2410.10347v3) | Paper-linked artifact not executed | peer-reviewed | Inspected v3, 2025-05-22, CC BY 4.0; §2 Theorem 1/Appendix A expected-budget LP; §§3–4 Theorems 2/3, Algorithm 3, Lemma 1; §5.1 Table 1, §5.2 Table 2, Appendices D/E. Archival metadata separately inspected at https://proceedings.mlr.press/v267/dekoninck25a.html. | 2026-10-14 |
| R46.19 | paper | R2-Router: A New Paradigm for LLM Routing with Reasoning | Jiaqi Xue; Qian Lou; Jiarong Xing; Heng Huang | ICML 2026 / PMLR 306 | [R2-Router](https://arxiv.org/html/2602.02823v1) | Paper-linked artifact not executed | peer-reviewed | Inspected v1, 2026-02-02, CC BY 4.0; §3 dataset; §4 Eqs. 1–9, Theorem 4.3 set inclusion; §§5–6, Table 1, Appendix B. Archival metadata inspected at https://proceedings.mlr.press/v306/xue26h.html. The abs page now lists v2 dated 2026-05-29; v1 is the explicit method/result boundary here. | 2026-10-14 |
| R46.20 | documentation | Ray Serve HTTP guide | Ray project | current | [Ray Serve HTTP guide](https://docs.ray.io/en/latest/serve/http-guide.html) | https://github.com/ray-project/ray | official documentation | Unpinned latest displayed 2.59.0; Request cancellation and Terminating a stream. Async cancellation occurs at an await boundary; cancellation is not device preemption. | 2026-10-14 |
| R46.21 | documentation | TensorRT-LLM overview | NVIDIA | 2026 documentation | [TensorRT-LLM overview](https://nvidia.github.io/TensorRT-LLM/overview.html) | https://github.com/NVIDIA/TensorRT-LLM | official documentation | Generated documentation build cc63e66, updated 2026-10-09; PyTorch-native LLM/runtime and serving integration boundaries. No controller execution. | 2026-10-14 |
| R46.22 | documentation | Outlier detection | Envoy project | current | [Outlier detection](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier.html) | https://github.com/envoyproxy/envoy | official documentation | Unpinned 1.41.0-dev; Ejection algorithm, split local/external origin failures, bounded ejection and active-health-check interaction. Separate from resource circuit breaking. | 2026-10-14 |
| R46.23 | documentation | RFC 6585: Additional HTTP Status Codes | IETF | RFC, 2012 | [RFC 6585: Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585.html) | Not applicable | official documentation | Fixed RFC; §4 Too Many Requests / 429. Counting scope is server policy; Retry-After is optional. | 2026-10-14 |
| R46.24 | documentation | Envoy router filter | Envoy project | current | [Envoy router filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter.html) | https://github.com/envoyproxy/envoy | official documentation | Unpinned 1.41.0-dev; x-envoy-max-retries, x-envoy-retry-on, route timeout/per-try timeout and fully jittered backoff; HTTP/gRPC retry condition boundaries. | 2026-10-14 |

## Keyed evidence boundaries

### R46.1

[KNOWN] v1, 2026-08-13; CC BY-NC-SA 4.0; §§3–4 optimization/profiling/placement/execution; §§5.1–5.7, Figures 13/19 and Tables 1/2; Appendix B. Common-backend comparison and cadence confound.

### R46.2

[KNOWN] v1, 2026-09-16; §§III–V; Eq. (forecast/margin/capacity); Table I five-seed simulation; Table III distinct five-minute hardware experiment; §VII availability. No calibrated-UCB theorem.

### R46.3

[KNOWN] v1, 2024-06-26; §2 objective/threshold; §3.2 Eqs. 10–11 matrix factorization; §4 training/evaluation; Tables 1–3 and §4.2 shift analysis. Historical model pair and judged/gold augmentation.

### R46.4

[KNOWN] Unpinned latest, displayed Ray 2.59.0; Load shedding / max_queued_requests and max_ongoing_requests. Per-handle scope, BackPressureError, default 503 and custom 429.

### R46.5

[KNOWN] Unpinned; Algorithm details, missing metrics/not-yet-ready handling, multiple metrics, downscale stabilization. Replica-ratio rule and default control intervals are configuration semantics.

### R46.6

[KNOWN] Unpinned; Pod termination flow, terminating endpoints, termination grace period, force deletion. API object deletion is not proof that all work has stopped.

### R46.7

[KNOWN] Unpinned latest, displayed 1.41.0-dev; resource ceilings, retry budgets and worker-thread eventual consistency. Displayed build hash changed across fetches, so no immutable revision is claimed.

### R46.8

[KNOWN] Unpinned republication displayed 2026-06-12, modified 2026-06-15; Timeouts, Retries and backoff, Jitter. Original Builders Library URL redirected here; republication date is not invention date.

### R46.9

[KNOWN] Fixed RFC, June 2022; §6.2 control data, §9.2.2 idempotency, §10.2.3 Retry-After. HTTP intended-effect semantics do not certify external exactly-once actions.

### R46.10

[KNOWN] Fixed RFC; §§3.1.1–3.1.5 type/status/title/detail/instance; §3.2 extension members. Machine-readable error identity is separate from human detail.

### R46.11

[KNOWN] Unpinned living text; §§9.2.3–9.2.6 processing, Last-Event-ID, UTF-8 parsing and event dispatch. Browser EventSource reconnection does not establish POST streaming-resume semantics.

### R46.12

[KNOWN] Unpinned stable; API Key Authentication Limitations, guarded/unguarded routes, internal-port exposure and plugin boundaries.

### R46.13

[KNOWN] Commit a2fb4827324bf023075799ef3d70d347834b8137; lines 11/14 guarded prefixes/class; verify_token lines 30–45; __call__ lines 47–62. Raw source fetched/read; SHA-256 ceb576aa3c053a5bcf145cfbe3f81def0f7213480c4aa1531fc4c00e32955225. No runtime check.

### R46.14

[KNOWN] Unpinned latest; How It Works, cache-match fraction, relative in-flight load, beta tradeoff and fallback route. Documented score, no independent latency measurement.

### R46.15

[KNOWN] Unpinned latest; requirements and Prometheus/KEDA configuration example. Deployment route and waiting-request metric, not a universal scaling policy.

### R46.16

[KNOWN] Unpinned latest URL displayed v1.5.1; Optimization targets, SLA planner flags/intervals, profiling/bootstrap, advisory mode, Guardrails. Explicit current no-drain scale-down limitation.

### R46.17

[KNOWN] Unpinned latest; KvRouterConfig field descriptions including overlap/load weights, tracking and experimental decode-active-request weight. No inferred source implementation.

### R46.18

[KNOWN] Inspected v3, 2025-05-22, CC BY 4.0; §2 Theorem 1/Appendix A expected-budget LP; §§3–4 Theorems 2/3, Algorithm 3, Lemma 1; §5.1 Table 1, §5.2 Table 2, Appendices D/E. Archival metadata separately inspected at https://proceedings.mlr.press/v267/dekoninck25a.html.

### R46.19

[KNOWN] Inspected v1, 2026-02-02, CC BY 4.0; §3 dataset; §4 Eqs. 1–9, Theorem 4.3 set inclusion; §§5–6, Table 1, Appendix B. Archival metadata inspected at https://proceedings.mlr.press/v306/xue26h.html. Mean routing overhead contextualized.

### R46.20

[KNOWN] Unpinned latest displayed 2.59.0; Request cancellation and Terminating a stream. Async cancellation occurs at an await boundary; cancellation is not device preemption.

### R46.21

[KNOWN] Generated documentation build cc63e66, updated 2026-10-09; PyTorch-native LLM/runtime and serving integration boundaries. No controller execution.

### R46.22

[KNOWN] Unpinned 1.41.0-dev; Ejection algorithm, split local/external origin failures, bounded ejection and active-health-check interaction. Separate from resource circuit breaking.

### R46.23

[KNOWN] Fixed RFC; §4 Too Many Requests / 429. Counting scope is server policy; Retry-After is optional.

### R46.24

[KNOWN] Unpinned 1.41.0-dev; x-envoy-max-retries, x-envoy-retry-on, route timeout/per-try timeout and fully jittered backoff; HTTP/gRPC retry condition boundaries.

## Static source inspection record

[OFFICIAL-DOCUMENTATION] R46.13 is a concrete immutable source inspection. The inspected middleware defines four guarded path prefixes, hashes configured/provided Bearer tokens, compares digests and delegates nonmatching paths; the manuscript confines attribution to those operations. The file was retrieved and read without import or server execution. No CODE-VERIFIED label is used because no executable check certified this path.

[NOT-DISCLOSED] OpScale's inspected text does not supply a complete precision/commit/repeated-run identity, and the main dynamic SLO panel lacks a fully resolved joint timing threshold. The predictive paper's simulation and small hardware experiment implement different demand signals. These omissions block broad attribution of performance to one mechanism or a current production engine.

[DERIVED] AWS, HTTP/SSE, Envoy and Ray describe different levels of behavior. An HTTP standard cannot establish ledger consistency; an async cancellation example cannot establish safe device reclamation; a router score cannot establish legal data access. The chapter composes them as explicit design obligations with separate formal conditions, rather than assigning a measured service guarantee to their conjunction.

[UNVERIFIED] No trained router, controller, fault replay, service launch, persistent ledger or stream-resume implementation was executed. All proposed empirical records and acceptance thresholds are confined to [verification](verification.md). No unavailable future paper is treated as inspected evidence.
