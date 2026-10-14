---
id: ms.section.48.3
entity_type: section
title: "Metrics"
volume: 2
part: 8
chapter: 48
section: 48.3
slug: 48-3-metrics
parent: ms.chapter.48
prev_sibling: ms.section.48.2
next_sibling: ms.section.48.4
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

# 48.3 Metrics

## Scope

[DERIVED] Metrics connect request/token events to accepted service, resource use and uncertainty. The baseline is one output tokens/s value plus successful-request mean latency. Success is an internally consistent event/population ledger reporting latency distributions, offered/admitted/completed rates, quality-and-SLO goodput, errors and physical resource boundaries. Chapter 6 owns general evaluation design; Chapter 42 owns inference work accounting.

## Why this exists

[DERIVED] Aggregate throughput can improve while interactive service worsens. A scheduler can admit more work, lengthen queues, drop difficult requests or truncate outputs. Successful-only latency can then improve even though more users fail. A model producing more reasoning/output tokens can raise token throughput without completing more accepted tasks. The metric must preserve the task and its complete population before it can support a capacity or cost comparison.

[DERIVED] Metric names alone do not establish equivalence. "Token" can mean native model token, externally retokenized text or a streamed response chunk. "TPOT" can mean a per-request average, while "ITL" may pool individual gaps or divide chunk intervals by chunk token counts. Quantiles and reciprocal transforms also differ. A scientifically defensible comparison retains the formula and sample population, not only the dashboard label.

## Intuition

[MATHEMATICALLY-DERIVED] A latency distribution is a distribution over specified events. Per-token pooling weights long outputs more heavily than per-request pooling. A ratio of totals weights durations differently from a mean of individual ratios. A tail percentile computed from completed cases excludes unresolved/failing users. These are algebraic differences, not implementation noise.

[DERIVED] Useful service requires several conditions simultaneously: a terminal response, correct task behavior, and required latency. Reporting each condition separately helps diagnosis, but their joint intersection determines accepted-task goodput. A system can meet separate aggregate thresholds while failing the joint requirement on different requests.

## Formulation

[MATHEMATICALLY-DERIVED] For request $i$, let $a_i$ be the declared start and $\tau_{i,j}$ arrival of model-token $j$ under a valid token-level observation contract. Let $S_{o,i}$ count output tokens and $d_i$ task completion. Then

$$
\mathrm{TTFT}_i=\tau_{i,1}-a_i,\quad
\mathrm{ITL}_{i,j}=\tau_{i,j}-\tau_{i,j-1}\ (j\ge2),\quad
\mathrm{TPOT}_i=\frac{\tau_{i,S_{o,i}}-\tau_{i,1}}{S_{o,i}-1}
\ (S_{o,i}\ge2),\quad
\mathrm{E2E}_i=d_i-a_i.
$$
*(Eq. 48.3)*

All durations are seconds. TPOT is undefined for zero/one token; zero-token requests have no TTFT. Completion may follow last-token arrival because output validation or tool processing remains. If only chunks are observed, retain chunk timestamps and counts; do not invent individual token timestamps.

[MATHEMATICALLY-DERIVED] On a duration $T>0$, define offered/admitted/completed counts $N_o,N_a,N_c$ for a consistent cohort or interval. With acceptance indicator $A_i={\bf1}\{\text{completed, quality-valid and all required SLOs}\}$,

$$
\lambda_o=N_o/T,\quad \lambda_a=N_a/T,\quad
X_c=N_c/T,\quad
G=\frac{\sum_i A_i}{T},\qquad
0\le G\le X_c\le\lambda_a\le\lambda_o
$$
*(Eq. 48.4)*

The inequalities assume one terminal completion per admitted offer and a common closed accounting population; interval boundary crossings require explicit correction. Retries are attempts, not additional unique user tasks. Accepted-token goodput needs a separately declared token utility/ownership rule.



```figure
{
  "id": "fig-48.9",
  "kind": "calculator",
  "title": "Maximum-based quantile coverage",
  "caption": "Under iid continuous sampling only, compute the chance that the maximum exceeds a population quantile. This is not precision or rare-failure certification.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-48.5",
  "alt": "Under iid continuous sampling only, compute the chance that the maximum exceeds a population quantile. This is not precision or rare-failure certification.",
  "spec": {
    "tex": "\\Pr(X_{(n)}\\ge q_p)=1-p^n",
    "equation": "48.5",
    "inputs": [
      {
        "symbol": "n",
        "label": "Independent samples",
        "default": 100,
        "min": 1,
        "max": 100000,
        "format": "integer"
      },
      {
        "symbol": "p",
        "label": "Population quantile",
        "default": 0.99,
        "min": 0.5,
        "max": 0.9999,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "coverage",
        "label": "One-sided coverage",
        "formula": "1-p^n",
        "format": "percent"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Start with monotonic client events and task/request/attempt identity. Define whether the first observable event includes reasoning or tool-call content, and whether TTFT ends on any transport response or nonempty content. Network chunks may contain several model tokens; buffered delivery can create identical observed arrival times without simultaneous model execution. Native-token generation speed and externally retokenized visible text speed answer different questions.

[OFFICIAL-DOCUMENTATION] GenAI-Perf defines first-response latency and chunk-normalized intermediate-response latency, and distinguishes aggregate output throughput from per-user generation speed [R48.5, Metrics]. Its client observation is not automatically a trace of individual internal model-token completion.

[MATHEMATICALLY-DERIVED] A pooled gap mean is
$\sum_i\sum_j\mathrm{ITL}_{i,j}/\sum_i(S_{o,i}-1)$,
while mean request TPOT gives each eligible request equal weight. Likewise,
$\sum_i(S_{o,i}-1)/\sum_i(\tau_{i,S_o}-\tau_{i,1})$
is not generally $\frac1n\sum_i1/\mathrm{TPOT}_i$.
These distinctions matter when output lengths vary. Report the weighting, excluded short/empty cases and whether non-visible tokens enter the count.

[OFFICIAL-DOCUMENTATION] The pinned MLPerf Endpoints draft defines per-user speed through reciprocal P90 TPOT and TTFT through its nonempty-fragment rule [R48.13, §4.1]. Its separate diagnostic guide illustrates reciprocal mean TPOT [R48.14, Interpreting output]. [DERIVED] Those statistics are different; a diagnostic field must not silently replace the submission metric.

[MATHEMATICALLY-DERIVED] For illustrative request TPOT values of 1 and 9 ms, reciprocal mean TPOT is 200 tokens/s, while mean reciprocal TPOT is approximately 556 tokens/s. Neither equals a reciprocal tail quantile by definition. These are analytical examples, not benchmark measurements. Tokenization-path differences can also change per-request denominators nonuniformly; scale-invariance arguments apply only to transformations satisfying the relevant constant-scaling assumptions.

[DERIVED] Goodput adds quality to timing explicitly. A latency-SLO count can be useful, but it is not task-quality acceptance unless the output was evaluated. For multiple model/tool attempts, deduplicate successful user tasks and charge every attempt's resource use. A partial response that emits one token and then fails is a first-response success under one metric and a failed task under another. Retain both states.

[MATHEMATICALLY-DERIVED] Separate P99 TTFT and P99 TPOT thresholds imply only
$\Pr(\text{both pass})\ge1-0.01-0.01=0.98$
by the union bound, before adding quality/errors. They do not imply 99% joint acceptance. Directly evaluate the intersection or explicitly allocate a failure budget across conditions. Correlation can tighten or worsen the realized joint rate within the allowed range; independence cannot be assumed from separate summaries.

[DERIVED] Latency reporting must retain failed, rejected and censored cases. Timeouts are known service failures at a deadline, while an unfinished follow-up case is right-censored for its eventual completion time. A completed-only percentile is conditional on completion. If operational latency defines unsuccessful tasks as infinite, a success fraction below the target percentile makes that operational percentile nonfinite. If the goal is eventual completion latency instead, censoring prevents identifying the missing tail without additional assumptions.

[MATHEMATICALLY-DERIVED] Finite-sample tail uncertainty can be made explicit. For iid continuous latencies with true $p$-quantile $q_p$, the number $B$ at or below $q_p$ is $\operatorname{Binomial}(n,p)$. With order statistics $X_{(l)},X_{(u)}$,

$$
\Pr\{X_{(l)}\le q_p\le X_{(u)}\}
=\sum_{b=l}^{u-1}{n\choose b}p^b(1-p)^{n-b},\qquad \Pr\{X_{(n)}\ge q_p\}=1-p^n.
$$
*(Eq. 48.5)*

Choose ranks using the binomial tails; $X_{(0)}=-\infty$ and $X_{(n+1)}=+\infty$ allow valid unbounded intervals. This is a book derivation under iid/continuity, not an unconditional production-confidence theorem.

[MATHEMATICALLY-DERIVED] The probability that the sample maximum exceeds $q_{0.99}$ is $1-0.99^n$. With 100 independent samples it is only about 0.634. A finite maximum-based one-sided 95% upper bound for the population P99 requires at least
$\lceil\log(0.05)/\log(0.99)\rceil=299$
independent samples. This does not make 299 samples sufficient for a precise P99 estimate, rare-failure coverage or a nonstationary workload.

[DERIVED] Autocorrelation and shared incidents violate the iid calculation. Repeated requests within one burst are not automatically independent evidence of reliability. Analyze independent sessions/blocks where justified and preserve temporal traces; a bootstrap cannot reveal unseen operating regimes by resampling existing cases. Selecting a favorable window or repeatedly testing until a point passes changes inference unless that selection is included in the uncertainty procedure.

[DERIVED] Memory metrics separate live allocation, allocator reserve, unique physical/shared pages and device capacity. Utilization requires an explicit counter and denominator: busy-time GPU utilization, achieved FLOPs/peak, memory-bandwidth use and cache occupancy are different quantities. High utilization can coexist with poor goodput because work is repeated, late or rejected. Low utilization can reflect a latency-appropriate batch rather than a defect.

[DERIVED] Resource accounting joins every offered/admitted/attempted state to FLOPs, parameter/state bytes, traffic, communication, CPU/network/storage work and event logging. Metric collection itself consumes time and memory. Energy uses a stated device/system boundary; money uses all charged work and retained idle capacity. These counts support causal diagnosis only when tied to the same task population and interval.



```figure
{
  "id": "fig-48.10",
  "kind": "diagram",
  "title": "From offers to accepted tasks",
  "caption": "Counts follow one declared cohort. Timing-only completion does not establish task quality and all required SLOs.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.4",
  "alt": "The diagram shows Offered tasks to Admission; Admission to Terminal completion; Terminal completion to Quality and all SLO checks; Quality and all SLO checks to Accepted-task goodput; Admission to Rejected/failed/censored; Terminal completion to Rejected/failed/censored; Quality and all SLO checks to Rejected/failed/censored.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "o",
        "kind": "dataset",
        "label": "Offered tasks"
      },
      {
        "id": "a",
        "kind": "process",
        "label": "Admission"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "Terminal completion"
      },
      {
        "id": "q",
        "kind": "process",
        "label": "Quality and all SLO checks"
      },
      {
        "id": "g",
        "kind": "metric",
        "label": "Accepted-task goodput"
      },
      {
        "id": "f",
        "kind": "state",
        "label": "Rejected/failed/censored"
      }
    ],
    "edges": [
      {
        "from": "o",
        "to": "a"
      },
      {
        "from": "a",
        "to": "c"
      },
      {
        "from": "c",
        "to": "q"
      },
      {
        "from": "q",
        "to": "g"
      },
      {
        "from": "a",
        "to": "f"
      },
      {
        "from": "c",
        "to": "f"
      },
      {
        "from": "q",
        "to": "f"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 48.3 — Bounded metric-ledger construction.** [DERIVED] Inputs are finite event records, token/chunk contract, task-quality evaluator, SLOs and follow-up cutoff. Output is formulas/populations, metrics and explicit unidentified quantities.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateIdentityClockOrderAndUnits};\
\operatorname{EnumerateEveryOfferAndAttempt}.\\
2.&\quad \operatorname{JoinTerminalAndStreamEvents};\
\operatorname{MissingAtCutoff}\Rightarrow\mathrm{CENSORED}.\\
3.&\quad \operatorname{ComputeDefinedDurations};\
S_o<2\Rightarrow\mathrm{TPOT\_UNDEFINED};\
S_o=0\Rightarrow\mathrm{TTFT\_UNDEFINED}.\\
4.&\quad A_i\leftarrow\operatorname{Completed}(i)\land
\operatorname{QualityValid}(i)\land\operatorname{AllSLOsPass}(i).\\
5.&\quad \operatorname{AggregateWithDeclaredWeightsAndCohort};\
\operatorname{RetainFailureAndExclusionCounts}.\\
6.&\quad \operatorname{UncertaintyUnderDeclaredDependenceModel};\
\operatorname{Return}(\text{ledger},\text{metrics},\text{unknown tails}).
\end{aligned}
$$

[DERIVED] Invariants are no fabricated token timestamps, no short-output division by zero, no failure removed from the offered-task ledger, and no timing-only predicate relabelled task quality. Finite records/cutoff bound processing. Sorting $n$ durations for exact quantiles costs $O(n\log n)$ time and $O(n)$ retained values; streaming approximations require stated error/rank guarantees and cannot recover absent cases.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** exposes timing-SLO goodput controls [R48.6, goodput]. Its pinned benchmark source calculates successful-request latency arrays and good-completion counts in calculate_metrics, while separately retaining client semaphore delay [R48.7, calculate_metrics; benchmark/limited_request_func]. Static inspection supports these narrow accounting distinctions, not an executed output-quality check.

[DERIVED] Export raw outcomes alongside histogram/quantile summaries, including metric formula version and tokenizer. Validate counters against event counts. A dashboard should expose successful-only distributions as conditional, with the offered population/error rate nearby. Otherwise an outage can improve the displayed percentile by removing the slowest requests.

[OFFICIAL-DOCUMENTATION] The pinned source sets short-output TPOT to zero for timing-goodput checks while excluding it from TPOT samples [R48.7, lines 583–589]. This documented implementation convention differs from the book\'s undefined-average domain; callers must preserve the distinction.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] The current GenAI-Perf documentation supplies input/load configuration and metric formulas, not a matched experiment proving a universal latency/quality tradeoff [R48.5]. Its printed example output is illustrative and is not reused as current performance evidence.

[NOT-DISCLOSED] A common experiment jointly measuring task quality, all offered failures, native-token arrival and percentile uncertainty across every runtime is absent from the inspected tool documentation.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The tools document client-observed throughput/latency and timing-SLO accounting [R48.5–R48.7].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Formula and population choices differ across metric surfaces [R48.5; R48.13–R48.14]; labels alone do not establish parity.

**What we infer.** [MATHEMATICALLY-DERIVED] Equations 48.3–48.5 explain weighting, joint-acceptance and finite-tail uncertainty differences without assuming a deployment result.

**What remains unknown.** [UNVERIFIED] Actual task-quality goodput, unresolved tails and resource use require a complete executed event ledger.



```figure
{
  "id": "fig-48.11",
  "kind": "stat-panel",
  "title": "Metric identity",
  "caption": "Formula, weighting and population belong with every metric name.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.3",
  "alt": "Formula, weighting and population belong with every metric name.",
  "spec": {
    "header": "METRIC IDENTITY",
    "rows": [
      {
        "key": "tokens",
        "value": "Native, text-retokenized or chunk"
      },
      {
        "key": "tpot",
        "value": "Average; short cases undefined"
      },
      {
        "key": "tail",
        "value": "Conditional population and uncertainty"
      },
      {
        "key": "goodput",
        "value": "Quality and joint SLO intersection"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Successful-only tail improvement.** [DERIVED] *Symptom:* P99 falls during increased errors/timeouts. *Cause:* failures vanished from the percentile population. *Detection:* reconcile offered, admitted, completed and accepted counts. *Mitigation:* report conditional latency with full failures and joint goodput.

[DERIVED] Other failures include chunk gaps labelled internal token timings, reciprocal means substituted for tail speed, normalized E2E hiding a long first response, and quantiles averaged across replicas without their sample populations. Pooling raw samples is different from averaging quantiles.

## Siblings

[DERIVED] [§48.2](48-2-load-test-methodology.md) owns event generation/cohorts; [§48.4](48-4-queueing-and-capacity.md) owns capacity inference; [§48.5](48-5-economics.md) uses accepted denominators. Chapter 47 owns observability plumbing. Compare metric implementations only after formulas, populations and timing boundaries agree.

## Extensions

### Improvements

[DERIVED] The methodological progression adds per-request/token events, failure-aware populations, joint task/SLO acceptance and uncertainty to aggregate throughput. Versioned benchmark policies improve comparability but can also change the metric between rounds. Preserve old definitions when comparing historical results rather than relabelling them with a current formula.

## Limitations

[DERIVED] Hidden reasoning tokens and transport buffering can prevent internal timing reconstruction. Finite, correlated traces cannot establish rare-event tails without assumptions. A quality evaluator is itself an experimental component whose error belongs in the acceptance claim.

> **Open question.** [UNVERIFIED] Can compact streaming summaries preserve task-level tail/quality uncertainty under correlated failures and changing tokenization/channel behavior? *Settling evidence:* raw-ledger comparisons across held-out sessions and incidents, with declared approximation error.

## Reproducibility

[DERIVED] Retain raw timestamps, token/chunk units, metric versions, cohort/weighting rules, undefined cases, evaluator, failures and dependence assumptions. Source revisions and static-inspection boundaries are in references; no metric-producing inference run was executed.

## References

[R48.5](references.md#r48-5), [R48.6](references.md#r48-6), [R48.7](references.md#r48-7), [R48.13](references.md#r48-13), [R48.14](references.md#r48-14).
