---
id: "ms.section.47.1"
entity_type: "section"
title: "47.1 — Telemetry"
volume: 2
part: 8
chapter: 47
section: 47.1
slug: "47-1-telemetry"
parent: "ms.chapter.47"
prev_sibling: null
next_sibling: "ms.section.47.2"
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
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 47.1 — Telemetry

## Scope

[DERIVED] Telemetry reconstructs what happened to a request across admission, tokenization, prefill, decode, publication, cancellation, and completion. Its scientific unit is an event with a defined boundary, clock domain, request identity, and release identity. A dashboard value without those fields cannot distinguish a slower model from a longer prompt, a blocked publisher, or a changed accounting convention. This section develops instrumentation and inference from observations; [Chapter 44](../ch44-scheduling-distributed-serving-and-disaggregation/README.md) owns scheduling policy and Chapter 48 owns capacity experiments.

## Why this exists

[DERIVED] Autoregressive serving exposes several kinds of progress simultaneously. GPU kernels may complete while a client receives nothing; an engine may finish a request that the gateway already timed out; a tokenizer change may increase token counts at fixed user text. Consequently, successful process execution, successful transport, and successful task completion need separate denominators. Telemetry must preserve the chain from user arrival through the final externally visible event rather than reconstruct it from an average latency and a throughput counter.

[DERIVED] Failure recovery presents the same problem at a slower time scale. Readiness polling brackets a transition; it does not reveal the exact instant an engine becomes useful. A restart counter also excludes replacement pods unless their lineage is joined explicitly. A defensible observation includes what the sensor could observe, what it excluded, and how those choices affect an estimate. These requirements apply before optimizing the collection pipeline.

## Intuition

[DERIVED] Think of a trace as a partially ordered execution record. Within a compatible clock domain, timestamps determine durations. Across processes or machines, request and message identities establish causality even when clock alignment is uncertain. Concurrent spans do not add to wall time: two parallel transfers lasting ten milliseconds contribute at most their critical-path duration, rather than twenty milliseconds, unless execution actually serializes them.

```figure
{
  "id": "fig-47.3",
  "kind": "diagram",
  "title": "A request has several completion boundaries",
  "caption": "Engine progress, visible streaming progress and terminal user outcome are joined by identity; they are different timestamps.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.4",
  "alt": "Engine progress, visible streaming progress and terminal user outcome are joined by identity; they are different timestamps. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "client arrival"
      },
      {
        "id": "q",
        "kind": "process",
        "label": "admission and queues"
      },
      {
        "id": "g",
        "kind": "hardware",
        "label": "prefill / decode"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "publish events"
      },
      {
        "id": "e",
        "kind": "state",
        "label": "visible terminal"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "q",
        "kind": "flow"
      },
      {
        "from": "q",
        "to": "g",
        "kind": "flow"
      },
      {
        "from": "g",
        "to": "p",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "e",
        "kind": "flow"
      }
    ]
  }
}
```

[OFFICIAL-DOCUMENTATION] Current vLLM documentation distinguishes per-output-event inter-token latency from request-average time per output token. Its frontend arrival boundary begins at tokenization, and its engine timing fields use queued, scheduled, preempted, and new-token events. The metrics source separately stores frontend arrival and engine timestamps. These are version-specific instrumentation semantics, not a universal client timing definition. [R47.1, design/metrics, “V1 design”; R47.9, RequestStateStats and FinishedRequestStats]

## Formulation

[MATHEMATICALLY-DERIVED] Let $a_r$ be client request start, $b_r$ the first visible token, and $e_r$ the terminal visible response or terminal error, all on the same client clock. For $o_r\ge2$ output tokens published individually at $v_{r,1},\ldots,v_{r,o_r}$, the telescoping identity is

$$
 \mathrm{TTFT}_r=b_r-a_r,\qquad
 \mathrm{E2E}_r=e_r-a_r,\qquad
 \frac{\sum_{j=2}^{o_r}(v_{r,j}-v_{r,j-1})}{o_r-1}
 =\frac{v_{r,o_r}-v_{r,1}}{o_r-1}.
$$

(Eq. 47.1)

[DERIVED] The last expression equals $(\mathrm{E2E}-\mathrm{TTFT})/(o_r-1)$ only when the terminal timestamp is the last-token publication timestamp. An extra terminal envelope or flush changes that equality. Requests with zero or one output token require a missing/not-applicable decoding statistic, rather than division by zero. If an event bundles several tokens, event-gap samples cannot recover individual token gaps without further timestamps. Pooling events weights long outputs more heavily than averaging request statistics.

[MATHEMATICALLY-DERIVED] For finite population requests with outcome $Y_r$, known inclusion probability $\pi_r>0$, and sample indicator $I_r$, the Horvitz–Thompson total and its expectation satisfy

$$
 \widehat S=\sum_r \frac{I_rY_r}{\pi_r},\qquad
 \mathbb E[\widehat S\mid \{Y_r,\pi_r\}]=\sum_rY_r .
$$

(Eq. 47.2)

[DERIVED] Equation 47.2 justifies unequal-probability sampling only when inclusion probabilities are recorded and the estimator targets the declared population. Sampling every error and one percent of successes biases an unweighted error fraction. A ratio of estimated totals is generally not exactly unbiased in finite samples. Tail-based retention also needs the outcome-dependent inclusion probability, including whether buffer pressure dropped the trace. An unknown drop mechanism prevents this correction.

[MATHEMATICALLY-DERIVED] Suppose a healthy readiness poll occurs at $h_i$, the next unhealthy poll at $u_i$, the last unhealthy poll at $l_i$, and the next healthy poll at $z_i$, with no intervening state transitions and reliable polls. Failure and recovery lie in their respective brackets, giving

$$
 f_i\in[h_i,u_i],\quad q_i\in[l_i,z_i],\qquad
 \max(0,l_i-u_i)\le q_i-f_i\le z_i-h_i .
$$

(Eq. 47.3)

[DERIVED] Repeated crashes between polls violate the single-transition premise. Missing scrapes widen or destroy the brackets. Summing point estimates without propagating this uncertainty produces false precision even if there are thousands of incidents. Hardware GPU-hours multiply each bounded duration by the number of provisioned GPUs, not by the number of requests.

## Mechanism

[DERIVED] The minimal event schema contains request ID, attempt ID, parent operation ID, conversation identity when permitted, release digest, tenant class, process/host/boot identity, clock API and unit, event sequence, and terminal reason. A logical request can have multiple attempts; retries must not inflate completed-user-request throughput. Prompt tokens, cached tokens, generated tokens, visible tokens, and discarded speculative tokens have different meanings and should remain separate counters.

[DERIVED] Queue time needs an explicit queue owner. Gateway waiting, router waiting, engine waiting, and preemption are different intervals. A request rescheduled after preemption must not silently replace its first admission timestamp when the intended metric is total waiting. Prefill work and decode work are annotated with context length, new positions, and kernel completion, while client publication records transport batching. These fields permit diagnosis of scheduler interference without treating every token as equal work.

[OFFICIAL-DOCUMENTATION] Python 3.15 documentation states that the monotonic reference point is unspecified and durations use differences; it also documents a shared clock across processes on supported implementations. Therefore, “all processes have incomparable monotonic clocks” is too broad. Cross-host compatibility, boot epoch, units, and the chosen API still require verification. [R47.2, time.monotonic and change notes]

[DERIVED] GPU utilization, memory bandwidth, clocks, temperatures, errors, and collective stalls are device-level observations. They can be joined to a request's execution window, but shared kernels and concurrent tenants prevent automatic exclusive attribution. Allocate aggregate costs only under a documented model, such as proportional token work, and label the result as an estimate. Never convert a utilization percentage directly into request FLOPs without an operational counter definition and the appropriate normalization.

```figure
{
  "id": "fig-47.4",
  "kind": "calculator",
  "title": "Retained telemetry traffic",
  "caption": "Illustrative collection traffic before indexing or replication; event rate and encoded bytes determine the boundary.",
  "placement": "rail",
  "anchor": "implementation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-47.4",
  "alt": "Request rate, events per request, retention fraction and encoded bytes multiply into retained traffic. Defaults produce 128 kilobytes per second before indexes and replicas.",
  "spec": {
    "tex": "R=\\lambda kps",
    "inputs": [
      {
        "symbol": "r",
        "label": "requests per second",
        "default": 100,
        "min": 1,
        "max": 100000,
        "format": "integer"
      },
      {
        "symbol": "k",
        "label": "events per request",
        "default": 50,
        "min": 1,
        "max": 10000,
        "format": "integer"
      },
      {
        "symbol": "p",
        "label": "retention fraction",
        "default": 0.1,
        "min": 0.001,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "s",
        "label": "bytes per event",
        "default": 256,
        "min": 16,
        "max": 65536,
        "format": "bytes"
      }
    ],
    "outputs": [
      {
        "symbol": "R",
        "label": "bytes retained per second",
        "formula": "r*k*p*s",
        "format": "bytes/s",
        "emphasis": true
      }
    ]
  }
}
```

## Algorithm

### Algorithm 47.1 — Telemetry collection

[DERIVED] Algorithm 47.1 is a bounded trace collector with accountable loss. Inputs are a finite event batch $E$, retention policy with known probabilities, record cap $B$, total retained event cap $K$, total retained byte cap $M$, and expiry time $D$. State consists of per-attempt records $H$, counters $C$, and loss counters $L$, initially empty. Its outputs are completed records, explicitly censored records, and collection-loss counts. No incomplete request is relabeled successful.

$$
\begin{aligned}
1.\;&\text{For each }e\in E\text{ once, validate identity, release, sequence and clock domain;}\\
 &\text{invalid}\Rightarrow L_{\mathrm{schema}}\leftarrow L_{\mathrm{schema}}+1;\ \text{continue}.\\
2.\;&\text{Deduplicate semantic event identity before incrementing request/token counters }C(e);\\
 &\text{a duplicate increments a separate ingress counter and continues};\\
 &\text{if sampling rejects }e,\text{ retain policy/inclusion accounting and continue}.\\
3.\;&\text{If appending violates }B,K\text{ or }M,\text{ drop }e,\space
 L_{\mathrm{capacity}}\mathrel{+}=1,\ \text{mark the attempt incomplete; continue}.\\
4.\;&\text{Append the accepted event; update retained event/byte counts;}\\
 &\text{compute differences only within compatible clocks}.\\
5.\;&\text{Terminal event}\Rightarrow\text{emit record with terminal reason and completeness mask; release its retained events/bytes; remove from }H.\\
6.\;&\text{At }D,\text{ emit surviving records as right-censored; return }(H_{\mathrm{emitted}},C,L).
\end{aligned}
$$

(Eq. 47.4)

[DERIVED] The invariant is that counters include all validated events covered by the collector, whereas sampled trace estimates carry their own inclusion mechanism. Time, record, total-event and byte caps make overload behavior visible. Deduplication state also has a bounded retention horizon; events outside that horizon carry an explicit late/duplicate ambiguity flag rather than an exact-once claim. The algorithm does not guarantee every event reaches the collector; source-side emission loss is a separate boundary. A trace assembly error therefore cannot be hidden by an apparently normal request-success counter.

## Implementation

[DERIVED] The implementation route is AI_REFERENCE_STACK §4 **#41 vLLM**, layer **Inference engine**, for request instrumentation; **#42 SGLang**, layer **Inference engine**, supplies a sibling engine boundary. **#17 PyTorch**, layer **Model / autograd framework**, and **#4 NVIDIA NCCL**, layer **Kernels / numerics / collectives**, identify execution components whose versions belong in the trace. Snapshot and readiness polling are outside these catalog entries and are sourced separately through NVIDIA Research §1 #14.

[DERIVED] Collection cost scales with events, not parameters alone. For arrival rate $\lambda$, average events $k$, retained fraction $p$, and encoded bytes $s$, retained traffic is approximately $\lambda kps$ bytes/s before indexing and replication. Histogram storage with $h$ buckets and $c$ label combinations grows as $O(hc)$; request IDs as metric labels can make $c$ grow with traffic. Put high-cardinality identities in bounded trace records, and use bounded release/cohort labels for counters.

[DERIVED] Model FLOPs and weight bytes are unchanged by a passive observer, but synchronization, event serialization, CPU allocation, network traffic, and device-counter collection can change throughput and latency. GPU memory overhead includes any profiler buffers; host retention needs a cap. Energy and monetary cost include telemetry ingestion and retained storage as well as perturbation of serving. The source does not provide a universal overhead constant; choosing collection rates requires measuring that boundary on the deployed stack.

## Experimental design

### Methodology

[PAPER-REPORTED] Dynamo's trace analysis uses restart counters and readiness scrapes, followed by finer re-querying and event checks. Appendix B explicitly studies timestamp bias and ambiguity. It excludes pods with no served queries that week and frequent crash loops, so its population is not every deployment failure. These exclusions are part of the estimand. [R47.6, §2.2 and Appendix B]

### Reported experiments

[PAPER-REPORTED] The trace covers 18 weeks. Appendix B describes 15-second scraping, a coarse search, finer 30-second query resolution, and a 108-event cross-check. Its reported restart-start estimate is a median 15 seconds late, with 90% below 32 seconds; recovery-end uncertainty is bracketed by sampling. This is a concrete example of sensor limitations affecting GPU-hour accounting rather than a benchmark of request tracing. [R47.6, Appendix B]

## Observations

**What the paper claims.** [PAPER-REPORTED] The recovery trace supports a large opportunity for faster restoration of ready capacity, subject to device-preserving failure classification. [R47.6, §5.6]

**What the evidence shows.** [PAPER-REPORTED] The authors investigate scrape-induced bias and ambiguous failures rather than treating readiness measurements as exact. Their trace and controlled failure injections have distinct timing boundaries. [R47.6, Appendix B and §5.2]

**What we infer.** [DERIVED] Scientific observability includes uncertainty about the observer. Explicit event boundaries and exclusion rules can change the conclusion even when the displayed metric name stays the same.

**What remains unknown.** [NOT-DISCLOSED] The chapter has no executed overhead measurement or access to the private raw trace. A different scrape cadence, pod-replacement pattern, or request publisher can change the observed error and latency distributions.

## Failure modes

[DERIVED] Success-only latency histograms omit timeouts and cancellations, making overload appear faster. Partial streams need terminal reasons and visible-token counts; a backend's eventual success cannot overwrite an earlier client failure. Unsynchronized cross-host subtraction can create negative queue times. Overlapping spans double-count work when summed. Counter resets, release-label reuse, and scrape gaps can fabricate apparent improvements unless identities and missingness remain explicit.

## Siblings

[DERIVED] Metrics give cheap population summaries; traces preserve causal structure; logs preserve rich local facts; profilers expose execution detail. Each loses information the others retain. A histogram cannot identify a corrupted template, while full traces may still lack the tensor values needed to diagnose a kernel. Connect them through identity and time boundaries, rather than declaring one universally sufficient.

```figure
{
  "id": "fig-47.5",
  "kind": "compare",
  "title": "Observation surfaces",
  "caption": "Different instruments preserve different evidence and fail in different ways.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.4",
  "alt": "Different instruments preserve different evidence and fail in different ways. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "axis": "Evidence retained and boundary",
    "columns": [
      {
        "id": "m",
        "label": "Metrics"
      },
      {
        "id": "t",
        "label": "Traces"
      },
      {
        "id": "p",
        "label": "Profilers"
      }
    ],
    "rows": [
      {
        "dimension": "Unit",
        "values": {
          "m": "population aggregate",
          "t": "attempt and causal events",
          "p": "execution activity"
        }
      },
      {
        "dimension": "Typical missing fact",
        "values": {
          "m": "request ordering",
          "t": "tensor / kernel detail",
          "p": "user outcome"
        }
      },
      {
        "dimension": "Cost pressure",
        "values": {
          "m": "label cardinality",
          "t": "events and retention",
          "p": "collection perturbation"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage proceeds from request-flow comparison in Spectroscope to engine event instrumentation and then failure-trace uncertainty analysis. The improvement is the ability to ask a narrower question with a more appropriate observation boundary. Adaptive retention can prioritize errors and rare release/cohort combinations, but must keep selection probabilities and unconditional counters if the goal is a population estimate.

[DERIVED] An unresolved question is how much execution detail is necessary to localize rare shared-GPU failures without materially disturbing them. Settling evidence would jointly report diagnostic recall, trace loss under overload, latency perturbation, and storage cost for the same faults and workloads; a low average collection cost alone does not settle it.

## Limitations

[DERIVED] A trace establishes observed ordering, not causality of a regression. Hidden workload changes and shared-resource interference remain alternative explanations. Privacy constraints may prevent retaining prompt text; token counts and hashes then cannot reconstruct all semantic changes. Instrumentation also cannot infer unobserved client behavior after a network disconnect.

## Reproducibility

[UNVERIFIED] This manuscript inspects official documentation and source without executing an engine. Reproduction requires pinned engine/source revisions, clock and event schemas, sampling configuration, drop counters, histogram buckets, release labels, and a declared client/server boundary. The unexecuted fault-injection protocol is in [verification](verification.md). No book-measured telemetry overhead is claimed.

## References

[DERIVED] [R47.1, vLLM metrics](https://docs.vllm.ai/en/stable/design/metrics/); [R47.2, Python clocks](https://docs.python.org/3/library/time.html#time.monotonic); [R47.6, Dynamo recovery](https://arxiv.org/html/2609.25451v1), Appendix B; [R47.9, metrics source](https://raw.githubusercontent.com/vllm-project/vllm/main/vllm/v1/metrics/stats.py). Exact access and revision records appear in [references](references.md).
