---
id: ms.section.48.2
entity_type: section
title: "Load-test methodology"
volume: 2
part: 8
chapter: 48
section: 48.2
slug: 48-2-load-test-methodology
parent: ms.chapter.48
prev_sibling: ms.section.48.1
next_sibling: ms.section.48.3
children: []
prerequisites: [ms.chapter.6, ms.chapter.21, ms.chapter.25, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.chapter.46, ms.chapter.47]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [capacity_planning, benchmarking, resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.nvidia-triton-inference-server]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 48.2 Load-test methodology

## Scope

[DERIVED] Load testing defines how intended requests become actual offers, how the system responds, and which time interval supports a capacity claim. The baseline is a concurrency sweep reported as an arbitrary-load throughput limit. Success is a reproducible offered-load/service curve with explicit generator, warmup, duration, saturation, failure and timing boundaries. Workload semantics come from §48.1; service and economic interpretation follow in §§48.3–48.5.

## Why this exists

[DERIVED] A server can look responsive because its test client stops sending during stalls. A load generator can saturate first and silently lower the actual offer rate. A short run can finish before a queue grows visibly or before memory/thermal conditions change. A selected warm plateau can omit later degradation. These are measurement mechanisms, not minor reporting differences: they change the population of requests and delays that the result describes.

[DERIVED] The relevant question must precede the tool configuration. Fixed concurrent users, independent external arrivals, finite offline backlog and response-dependent conversations each define legitimate experiments. They do not have interchangeable notions of capacity. A system's maximum aggregate tokens/s under unconstrained latency cannot establish how much external demand meets a P99 deadline.

## Intuition

[MATHEMATICALLY-DERIVED] In an open-loop experiment, intended arrivals are independent of current completion times under the declared workload process. In a closed-loop experiment, completion frees a client slot or causes the next turn. A slowdown therefore reduces closed-loop offers automatically. The feedback is part of a realistic user model when intended; it becomes coordinated omission when the result is interpreted as though those missing offers had occurred.

[DERIVED] Measuring from actual transmission answers how long a transmitted request waited. Measuring from intended offer additionally captures generator delay/backpressure. Both can be useful, but they differ during overload. A histogram cannot reconstruct demands never represented in the run without an arrival model; post-hoc correction is conditional on that model.

## Formulation

[MATHEMATICALLY-DERIVED] Let $a_i$ be intended offer time, $s_i\ge a_i$ actual transmission time and $d_i\ge s_i$ terminal response time on one monotonic client clock. Then

$$
L_i^{\rm sent}=d_i-s_i,\qquad
L_i^{\rm offered}=d_i-a_i
=L_i^{\rm sent}+(s_i-a_i).
$$
*(Eq. 48.2)*

The nonnegative lag $s_i-a_i$ is part of intended-demand latency. It can reflect generator saturation or intentional backpressure, whose cause must be retained. Rejected/unsent cases need explicit terminal states rather than invented response times.

[MATHEMATICALLY-DERIVED] For a stationary closed population of $n$ clients, each alternating a response time $R$ and think time $Z$, the interactive mean relation is
$X=n/(\mathbb E[R]+\mathbb E[Z])$ under a consistent cycle boundary and finite stable averages. With zero think time, doubling response duration halves offers if the client count stays fixed. This relation is not an exogenous-rate capacity theorem; §48.4 derives the corresponding population/time accounting.



```figure
{
  "id": "fig-48.6",
  "kind": "calculator",
  "title": "Intended-time latency",
  "caption": "Illustrative same-clock delays. Offered latency includes generator lag; unsent/rejected offers need explicit outcomes.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-48.2",
  "alt": "Illustrative same-clock delays. Offered latency includes generator lag; unsent/rejected offers need explicit outcomes.",
  "spec": {
    "tex": "L_{\\rm offered}=L_{\\rm sent}+L_{\\rm lag}",
    "equation": "48.2",
    "inputs": [
      {
        "symbol": "sent",
        "label": "Send-to-terminal seconds",
        "default": 0.2,
        "min": 0,
        "max": 10,
        "format": "seconds"
      },
      {
        "symbol": "lag",
        "label": "Intended-to-send seconds",
        "default": 0.8,
        "min": 0,
        "max": 10,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "offered",
        "label": "Offer-to-terminal seconds",
        "formula": "sent+lag",
        "format": "seconds"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] An open-loop generator samples or replays intended times before observing completions. It attempts each event at its scheduled time and records actual sends. A finite implementation still has connection, CPU, socket and outstanding-request limits. When those limits bind, it must record a late send, explicit rejected offer or test-invalid condition. Silently waiting for a free slot turns the intended process into an undeclared hybrid load.

[DERIVED] A closed-loop generator maintains a declared population or active-concurrency target. Each completion schedules another request, possibly after a think/tool delay. This directly measures aggregate service versus concurrent users. At a throughput plateau, additional concurrency mainly increases residence time; the offered rate remains endogenous. A conversation replay can be closed-loop within each session while independent sessions start exogenously. Record that two-level process rather than assigning a single label to the whole application.

[MATHEMATICALLY-DERIVED] Consider an analytical server stall of length $D$ during demand scheduled every $\Delta$. Roughly $D/\Delta$ intended offers fall within the stall. A single sequential client waiting on its first blocked request observes only that request until completion; it does not create the other scheduled offers. Its successful-request latency histogram therefore describes a different demand population. Adding synthetic delayed samples can approximate a specified constant-rate counterfactual, but cannot recover the actual batching, rejection or queue interactions of an unrun workload.

[OFFICIAL-DOCUMENTATION] wrk2 documents intended-time latency accounting and constant-throughput generation, contrasting it with completion-paced measurements [R48.4, README coordinated-omission discussion]. This establishes the mechanism it intends to measure, not a guarantee that an HTTP tool directly supplies correct LLM streaming-token or task metrics.

[DERIVED] Validate the generator before accepting a server result. Compare intended, actually sent and server-received counts/rates; inspect send lag, client CPU, connection limits and event-loop scheduling. The generator should have enough headroom for the tested envelope. A client bottleneck is a test boundary, and can be a relevant application limit, but it cannot be attributed to model-kernel capacity. Remote network path and TLS/client serialization are similarly real costs on an endpoint boundary.

[DERIVED] Warmup has separate purposes: populate model/allocator/kernel state, stabilize concurrency, initialize permitted prefixes and establish a representative operating state. It must not silently award unrealistically perfect cache residency. A repeated dataset can create cross-request reuse absent from production. Keep warmup records and declare which caches persist into measurement. A model/configuration change between points creates a different curve unless the comparison explicitly studies adaptive configuration.

[DERIVED] Duration must be long enough for the scientific claim, not merely a fixed number of requests. Short tests may miss burst cycles, scaling delay, cache eviction, memory growth or thermal transitions. Repeated independently prepared sessions measure reproducibility, while one long run exposes temporal drift; neither universally substitutes for the other. Track queue depth and unfinished work through the end. Ending offers and draining requests changes the denominator and the sampled population.

[MATHEMATICALLY-DERIVED] For an issue-time cohort $a_i\in[t_0,t_1)$, retain all terminal outcomes, including those after $t_1$, under a finite follow-up limit. Its completion-latency distribution differs from a completion-time cohort $d_i\in[t_0,t_1)$, which can overrepresent short requests and omit long unfinished ones. Aggregate throughput over a wall-time interval is another quantity. A cohort-selected numerator divided by issue-span duration can be valid, but must not be described as a literal count of tokens delivered inside that same interval unless it is.

[OFFICIAL-DOCUMENTATION] The pinned 2026 MLPerf Endpoints draft uses fixed-concurrency points and issue-time steady windows, with whole-run supplementary metrics and explicit insufficient-window handling [R48.13, §§4.4/6.1]. Its evolving rules are a benchmark contract, not a universal definition of production stability.

[OFFICIAL-DOCUMENTATION] Its pinned diagnostic guide groups queries by issue order, selects a first admissible plateau and flags later shifts/drift [R48.14, What it does/Warnings]. [DERIVED] A local plateau is conditional evidence. Retain anomalies and the full-run service trajectory; choosing a steady interval cannot make later production degradation disappear.

[DERIVED] Saturation has several possible mechanisms: compute/DRAM/link throughput, resident-state capacity, scheduler limits, CPU/tokenization, transport or an external dependency. Increasing offered rate while throughput stops rising and unfinished work grows indicates an unstable operating point under that load; increasing concurrency while throughput plateaus describes a different experiment. Identify the bottleneck with the phase/resource ledger from Chapter 42 and supporting telemetry rather than inferring it from the curve shape alone.

[DERIVED] Capacity search should bracket valid operating regions and retain all points. Binary search assumes an appropriate monotone predicate under stable configuration and workload. Cache warmness, autoscaling, discrete batching and noise can violate empirical monotonicity. Repeat boundary points, report uncertainty and investigate inconsistent outcomes before declaring a maximum. The highest observed passing rate is not automatically a statistically established limit.

[DERIVED] Test costs include workload preparation, generator CPU/memory/network, endpoint inference and all idle/ramp/drain activity within the chosen boundary. A finite event schedule needs $O(n)$ retained outcomes if every case is preserved; streaming summaries can reduce working memory but raw audit logs still require storage. Arithmetic and device bytes follow actual executed requests, including failed/retried work. Energy and money include the complete test window when reporting total experiment cost; a cropped steady-state throughput denominator does not erase the excluded resources.



```figure
{
  "id": "fig-48.7",
  "kind": "diagram",
  "title": "Open offers and completion feedback",
  "caption": "An exogenous schedule preserves intended offers; a completion-paced branch changes future offered rate. Both require complete event records.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.2",
  "alt": "The diagram shows Intended schedule to Generator resource gate; Generator resource gate to Actual sends; Generator resource gate to Lag and rejected offers; Actual sends to SUT execution; SUT execution to Terminal outcome; Terminal outcome to Closed-loop next offer; Closed-loop next offer to Generator resource gate.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "p",
        "kind": "dataset",
        "label": "Intended schedule"
      },
      {
        "id": "g",
        "kind": "process",
        "label": "Generator resource gate"
      },
      {
        "id": "s",
        "kind": "flow",
        "label": "Actual sends"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "SUT execution"
      },
      {
        "id": "d",
        "kind": "state",
        "label": "Terminal outcome"
      },
      {
        "id": "f",
        "kind": "feedback",
        "label": "Closed-loop next offer"
      },
      {
        "id": "l",
        "kind": "metric",
        "label": "Lag and rejected offers"
      }
    ],
    "edges": [
      {
        "from": "p",
        "to": "g"
      },
      {
        "from": "g",
        "to": "s"
      },
      {
        "from": "g",
        "to": "l"
      },
      {
        "from": "s",
        "to": "e"
      },
      {
        "from": "e",
        "to": "d"
      },
      {
        "from": "d",
        "to": "f"
      },
      {
        "from": "f",
        "to": "g"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 48.2 — Bounded open-loop load audit.** [DERIVED] Inputs are a finite intended schedule $\{(a_i,w_i)\}_{i=1}^n$, bounded generator resources, per-case deadline, measurement/follow-up intervals and immutable SUT identity. Output is a complete event/outcome log and valid/invalid experiment status.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateClockIdentityAndGeneratorHeadroom};\
\mathcal E\leftarrow\varnothing.\\
2.&\quad \text{For each scheduled }i:\quad
t<a_i\Rightarrow\operatorname{WaitUntil}(a_i).\\
3.&\quad \operatorname{CapacityUnavailable}\Rightarrow\operatorname{ApplyDeclaredPolicy};\\
 &\quad \text{Reject/unsent}\Rightarrow\operatorname{TerminalRecordWithoutSendTime}(i);\ \operatorname{NextEvent};\\
 &\quad \text{Late-send allowed}\Rightarrow\operatorname{RecordLagAndProceed}(i).\\
4.&\quad \operatorname{SendWithinPolicy}(i)\Rightarrow s_i;\
\mathcal E\leftarrow\mathcal E\cup\{\operatorname{OfferSendRecord}(i,a_i,s_i)\}.\\
5.&\quad \operatorname{CollectStreamAndTerminalStatusUntilDeadline}(i)
\Rightarrow\operatorname{OutcomeRecord}(i).\\
6.&\quad t\ge t_{\rm followup,max}\Rightarrow
\operatorname{MarkEveryUnresolvedCaseCensored};\
\operatorname{Return}(\mathcal E,\text{all outcomes},\text{validity flags}).
\end{aligned}
$$

[DERIVED] Sending and collection are concurrent event processes; line order expresses state dependencies, not a blocking sequential request loop. Invariants are intended schedule independent of completions, every offer represented, monotonic same-clock durations and no unresolved case silently counted as success. Finite events and follow-up time ensure termination. A generator-headroom violation can invalidate a server-capacity claim while its observed endpoint behavior remains reportable.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** exposes request-rate, burstiness and maximum-concurrency benchmark controls [R48.6, load arguments]. **NVIDIA Triton Inference Server — Serving / portable runtime** routes to GenAI-Perf's rate/concurrency modes [R48.5]. Their interaction must be inspected at the pinned version: a concurrency cap can alter an intended open-rate process.

[OFFICIAL-DOCUMENTATION] The inspected vLLM commit records client semaphore delay separately from send time in benchmark/limited_request_func [R48.7, lines 900–915]. This static observation supports a narrow accounting property; it is not a load-generator performance test.

[DERIVED] Separate client timestamps from server/device traces. Client-clock differences yield endpoint latency without cross-host clock subtraction. Joining server stages requires synchronization/error bounds or correlation identifiers and careful interval accounting. GPU events exclude client queues/network/output policy; they should explain endpoint spans rather than replace them.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] wrk2's historical README demonstration compares intended-time and uncorrected histograms, including a paused Apache server, constant-rate load and a finite run [R48.4, Examples 1–2]. It is an illustrative HTTP experiment; model state, streaming tokens and quality are outside its scope.

[NOT-DISCLOSED] A matched modern LLM open-loop/closed-loop/generator-saturation study with identical task quality and full failure cohorts is not supplied by these documentation sources.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] wrk2's design aims to retain demand-time delays missed by completion-paced sampling [R48.4].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Its supplied HTTP example exhibits the intended measurement distinction [R48.4, Examples 1–2]. No independent LLM replication is claimed.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 48.2 isolates send lag exactly; missing offers cannot be recovered from successful-request timestamps alone.

**What remains unknown.** [UNVERIFIED] Generator headroom, stationary operating windows and actual server capacity for a specified LLM deployment remain untested.



```figure
{
  "id": "fig-48.8",
  "kind": "stat-panel",
  "title": "Load-test boundary",
  "caption": "A valid result retains state preparation, time population and generator validity.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.2",
  "alt": "A valid result retains state preparation, time population and generator validity.",
  "spec": {
    "header": "LOAD-TEST BOUNDARY",
    "rows": [
      {
        "key": "load",
        "value": "Open, closed, offline or hybrid"
      },
      {
        "key": "warm",
        "value": "Model/kernel/cache/concurrency"
      },
      {
        "key": "window",
        "value": "Issue cohort versus delivery interval"
      },
      {
        "key": "end",
        "value": "Failures, drain and follow-up"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Generator backpressure presented as server capacity.** [DERIVED] *Symptom:* nominal request rate rises but actual offers do not. *Cause:* client resource/concurrency limits. *Detection:* intended-versus-send/receipt timelines. *Mitigation:* scale or bound the generator and retain invalid points instead of attributing them to the model.

[DERIVED] Other failures include no drain/follow-up accounting, repeated-prefix warmup, inconsistent configurations across a curve, selecting only favorable plateaus and dropping timed-out requests. A correctly implemented closed-loop benchmark is still misinterpreted when advertised as an exogenous-arrival SLO limit.

## Siblings

[DERIVED] [§48.1](48-1-workload-specification.md) owns demand semantics; [§48.3](48-3-metrics.md) owns populations/denominators; [§48.4](48-4-queueing-and-capacity.md) converts valid operating points into conditional capacity. Chapter 47 owns instrumentation and change diagnosis.

## Extensions

### Improvements

[DERIVED] Intended-time accounting, durable event logs and versioned steady-window diagnostics improve different parts of load testing. Their costs are retained scheduling/logging state and analysis. None replaces an accurate workload or guarantees that a selected plateau represents future service. Current benchmark prescriptions must be cited by revision rather than merged with historical scenario rules.

## Limitations

[DERIVED] No finite test proves indefinite stability. An offered schedule is a counterfactual when users would adapt to responses. Generator/network limitations can prevent reaching the desired envelope; statistical selection and autocorrelation complicate confidence intervals.

> **Open question.** [UNVERIFIED] How can load tests retain reproducible exogenous demand while modeling response-dependent agent conversations and cache state? *Settling evidence:* paired session-aware and exogenous replays with complete outcomes and independently varied service conditions.

## Reproducibility

[DERIVED] Retain intended schedule, send lag, generator/SUT revisions, connection policy, clock boundary, warmup/cache state, full-run/cohort windows, follow-up cap and all failures. R48.13/R48.14 are pinned inspection surfaces; no load was executed here.

## References

[R48.4](references.md#r48-4), [R48.5](references.md#r48-5), [R48.6](references.md#r48-6), [R48.13](references.md#r48-13), [R48.14](references.md#r48-14).
