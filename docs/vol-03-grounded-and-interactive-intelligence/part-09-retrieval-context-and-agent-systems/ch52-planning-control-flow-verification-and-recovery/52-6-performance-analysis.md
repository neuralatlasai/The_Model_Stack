---
id: ms.section.52.6
entity_type: section
title: Performance analysis
volume: 3
part: 9
chapter: 52
section: 52.6
slug: 52-6-performance-analysis
parent: ms.chapter.52
prev_sibling: ms.section.52.5
next_sibling: ms.verification.52
children: []
prerequisites: [ms.chapter.36, ms.chapter.38, ms.chapter.50, ms.chapter.51]
downstream: [ms.chapter.53, ms.chapter.54, ms.chapter.63]
related: [ms.chapter.46, ms.chapter.47]
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [agent_control, verification, recovery], feedback_setting: [environment_return], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 52.6 — Performance analysis

## Scope

[DERIVED] Performance analysis measures verified success, completion steps, wasted calls, end-to-end latency, total cost and sensitivity to faults. The baseline reports only average task success or successful-run token use. Success is a reproducible, denominator-explicit comparison under matched tools, effects, feedback and budgets. Detailed model/task evaluation belongs to Chapters 61–63; this section owns controller-specific accounting.

## Why this exists

[DERIVED] A controller can increase reported success by accepting graceful abandonment, reduce average latency by excluding timeouts, or lower cost by omitting failed search branches. These are changes to the estimand, not necessarily better execution. Recovery metrics add another complication: agents can avoid the injected fault, encounter it and fail, or recover locally but fail the final task.

[PAPER-REPORTED] ToolMaze explicitly separates overall TSR, exposure-conditioned PRR and recovery cost averaged over all runs [R52.2, §3.5, Eqs. 1–4]. τ-bench distinguishes all-trials reliability from at-least-one-trial discovery [P43, §3]. [DERIVED] A single scalar cannot preserve these distinctions. The dominant constraint is identifying which population and event each denominator represents.

## Intuition

[DERIVED] Evaluate the entire attempted request, including planning, searching, testing, tool execution, repair and final verification. A branch that was discarded still consumed resources. A failed API response can provide useful information, so failure and waste are not synonyms. A shorter trajectory can be premature termination.

[DERIVED] Fault sensitivity is a response surface over failure type, activation point, persistence and available alternatives. Comparing one clean average with one corrupted average hides whether the controller detected the anomaly, chose a valid repair or merely avoided exposure.

## Formulation

> **Definition — Controller fault sensitivity.** [DERIVED] The change in declared outcome and resource metrics across controlled fault types, activation boundaries and available alternatives.

| Local symbol | Meaning |
|---|---|
| $n_{\rm eval}\ge1$ | Number of attempted evaluation units |
| $Y_i\in\{0,1\}$ | Independently verified business-goal completion |
| $Z_i\in\{0,1\}$ | Fault exposure |
| $H_i\in\{0,1\}$ | Valid local recovery, including any declared safe-abandonment case |
| $C_i,\ell_i$ | Total cost and request-to-terminal elapsed time |
| $W_i,N_i$ | Declared wasted-call count and total attempted calls |
| $d_i$ | Paired per-unit metric difference |
| $p_i$ | Within-task independent-trial success probability |

[MATHEMATICALLY-DERIVED] Basic estimators are

$$
\widehat S=\frac1{n_{\rm eval}}\sum_iY_i,\qquad
\widehat{\operatorname{PRR}}=
\frac{\sum_i Z_iH_i}{\sum_iZ_i},\qquad
\widehat w=\frac{\sum_iW_i}{\sum_iN_i}.
$$
*(Eq. 52.25)*

PRR is undefined when no trial is exposed; waste fraction is undefined with no calls. Report denominator counts and a declared undefined convention, not fabricated zeros.

[DERIVED] ToolMaze's per-exposed-run recovery penalty is, using local notation,

$$
r_i=1-
\frac{c_i^*}{\max(c_i,c_i^*)}\,Y_i^{\rm bench},
\qquad
\widehat{\operatorname{RC}}=\frac1{n_{\rm eval}}\sum_iZ_ir_i.
$$
*(Eq. 52.26)* — notation-adapted R52.2, Eqs. 3–4.

Here $c_i,c_i^*$ are observed and modeled minimum post-fault call counts, and $Y_i^{\rm bench}$ uses the benchmark's success definition, including its graceful-termination cases. Define $Z_ir_i=0$ for unexposed runs without evaluating an undefined post-fault ratio. For exposed runs the ratio requires a positive denominator; zero/zero needs a separate declared convention.

[MATHEMATICALLY-DERIVED] At the population level,

$$
\mathbb E[Zr]=\Pr(Z=1)\,\mathbb E[r\mid Z=1].
$$
*(Eq. 52.27)*

Consequently, an unconditional RC difference can reflect exposure frequency rather than better recovery among exposed trials.

[MATHEMATICALLY-DERIVED] Realized cost per verified success is

$$
\widehat C_{\rm success}=
\frac{\sum_i C_i}{\sum_iY_i},
\qquad \sum_iY_i>0.
$$
*(Eq. 52.28)*

It differs from mean cost conditional on success because it charges failed attempts to the delivered successful outcomes. With no successes, report undefined/infinite under a declared convention.

[MATHEMATICALLY-DERIVED] For $n_{\rm eval}\ge2$ i.i.d. paired evaluation units with finite variance,

$$
\bar d=\frac1{n_{\rm eval}}\sum_id_i,\qquad
\widehat{\operatorname{SE}}(\bar d)=
\sqrt{\frac{\sum_i(d_i-\bar d)^2}
{n_{\rm eval}(n_{\rm eval}-1)}}.
$$
*(Eq. 52.29)*

Repeated trials of the same task are clustered; fixed stratified designs require their weighted design-aware variance rather than this formula applied to all rows.

[MATHEMATICALLY-DERIVED] Under independent identically distributed trials *within each task*,

$$
\operatorname{pass}^{k}=\mathbb E_i[p_i^k],
\qquad
\operatorname{pass}@k=\mathbb E_i[1-(1-p_i)^k].
$$
*(Eq. 52.30)* — probability interpretation of P43, §3.

For integer $k\ge1$, Jensen's inequality gives $\mathbb E[p_i^k]\ge(\mathbb E[p_i])^k$. Heterogeneity means that exponentiating aggregate success is not the all-trials metric.

## Mechanism

### Methodology

[DERIVED] Define evaluation units before running a controller: task, initial state, user/observation simulator seed, policy revision, tool inventory and fault script. Include every attempted unit in the completion denominator. Separate verified business completion, safe abandonment, policy stop, resource exhaustion and unresolved effects. A task that becomes unsolvable after a permanent fault can justify safe abandonment without becoming a completed purchase or reservation.

[PAPER-REPORTED] ToolMaze includes graceful termination for permanent failures in single-path tasks and allows recovery to count independently of final task success [R52.2, §3.5]. [DERIVED] Report its TSR using that definition, then avoid transferring the number to a business-completion claim. Likewise, PRR compares the exposed subset, which can vary with controller behavior. To isolate recovery ability, use controlled activation at matched decision boundaries or report exposure rates separately.

[DERIVED] Steps to completion need an explicit unit: model turns, external calls, graph supersteps or committed actions. Report successful-run distributions alongside the full terminal-status distribution. A failed run has no completion step count; replacing it with the budget cap changes the estimand and should be stated. Include parallel calls separately from controller turns so batching cannot manufacture apparent step efficiency.

[DERIVED] Waste requires an operational taxonomy. Structurally invalid calls, repeated calls with unchanged inputs/state and calls on an already disproven branch are observable categories. An unsuccessful exploratory query may still remove uncertainty. Excess over a modeled shortest path measures model-relative inefficiency, not necessarily avoidable waste under partial observability. Preserve both raw attempt counts and the adjudication rule; audit disagreements instead of asserting an oracle waste label.

[PAPER-REPORTED] PlanBench-XL's EGT precision counts trusted successfully produced datatypes; it can stay 100% despite invalid/noisy calls [R52.1, Appendix B.8]. [DERIVED] Precision over selected valid outputs is therefore distinct from all-attempt efficiency. This denominator issue can recur in production dashboards that omit rejected or timed-out work.

[DERIVED] End-to-end latency starts at the declared client submission boundary and ends at verified terminal publication. Decompose model queuing/prefill/decode, tool transport/service, critic/test execution, checkpoint writes, backoff and final verification. For an asynchronous dependency graph, elapsed time follows the realized critical path plus contention and synchronization, not the sum of all worker durations. Report cold/warm caches, client streaming boundaries and whether final verification occurs before the user-visible success claim.

[DERIVED] Timeouts and abandoned requests are distinct terminal outcomes, not missing data to discard. A success-only p95 describes a selected population. Report deadline-success curves or success-at-time alongside terminal latency, and preserve unresolved requests at the observation cutoff. A controller that returns failure quickly can have excellent terminal latency and poor utility. Avoid equating low latency with task performance.

[DERIVED] Cost includes every model invocation, input/output token, cache charge, critic, simulated branch, tool fee, storage write and evaluation overhead under a declared boundary. For infrastructure-owned execution also record device time, memory and network traffic. Token counts cannot uniquely determine FLOPs or dollars across caching and engines. Report source prices with dates only when actually inspected; this chapter makes no current API price claim.

[PAPER-REPORTED] LATS's token comparison is conditioned on success [R52.4, Table 9]. [DERIVED] That selected statistic is useful for the successful subset but cannot establish Eq. 52.28 without failed-run costs. Similarly, additional critique that improves reward is an intervention with extra compute, not an architecture-only gain at equal budget.

[DERIVED] Fault sensitivity should stratify explicit versus implicit errors, transient versus permanent faults, fault location, path redundancy and remaining budget. Inject faults at specified causal boundaries. Replacing a tool with a wrong but schema-valid response tests anomaly detection; returning a transport error tests a different mechanism. Preserve identical fault logic across controllers while acknowledging that their action choices can change which faults activate.

[DERIVED] Statistical comparisons should pair tasks and initial states when possible, preserve independent task clusters and disclose repeated-run variation. Temperature 0 does not guarantee determinism across providers, kernels or user simulators. A fixed seed controls only the randomness actually connected to it. Avoid treating a handful of family-level model sizes as a controlled scaling experiment.

[DERIVED] Analysis costs include full trace retention, outcome checking and manual adjudication. For $n_{\rm eval}$ traces of average $n_t$ events and $n_b$ bytes/event, raw event storage is $O(n_{\rm eval}n_tn_b)$. Aggregate metrics are linear-time once labels exist; establishing trustworthy labels can dominate. No source supplies a common production hardware, energy and latency comparison across the controller families.

```figure
id: fig-52.18
kind: diagram
title: "All-attempt evaluation with explicit denominators"
caption: "One fixed attempt manifest feeds outcome, fault and resource accounting. Missing traces stay in the attempted population; exposure-conditioned recovery and all-attempt cost remain separate outputs."
placement: inline
evidence: DERIVED
source: DERIVED:eq-52.25
alt: "A fixed attempt manifest joins complete traces to independent outcome labels, fault exposure labels and total resources. These produce business success, conditional recovery and cost per verified success, while missing records remain visible."
spec:
  direction: LR
  nodes:
    - {id: manifest, kind: dataset, label: "Attempt manifest"}
    - {id: trace, kind: memory, label: "Complete traces + receipts"}
    - {id: goal, kind: metric, label: "Independent goal labels"}
    - {id: fault, kind: metric, label: "Exposure + local recovery"}
    - {id: cost, kind: metric, label: "All branches and costs"}
    - {id: success, kind: metric, label: "Business success"}
    - {id: prr, kind: metric, label: "Recovery given exposure"}
    - {id: unitcost, kind: metric, label: "Cost per verified success"}
    - {id: missing, kind: state, label: "Missing / unknown visible"}
  edges:
    - {from: manifest, to: trace}
    - {from: manifest, to: missing, label: "Trace absent / invalid"}
    - {from: trace, to: goal}
    - {from: trace, to: fault}
    - {from: trace, to: cost}
    - {from: goal, to: success}
    - {from: fault, to: prr}
    - {from: goal, to: unitcost}
    - {from: cost, to: unitcost}
    - {from: trace, to: missing}
```

## Algorithm

[DERIVED] **Algorithm 52.6 — Denominator-preserving controller analysis.** Inputs are a fixed evaluation manifest and complete trace/receipt records. Outputs are stratified metrics, missingness and uncertainty records. This is an analysis procedure; the book did not execute it. Processing caps prevent corrupt traces from producing an unbounded parser.

$$
\begin{aligned}
1.\;&\mathcal M\leftarrow\operatorname{ValidateAttemptManifest};
\quad\text{duplicate/missing IDs}\Rightarrow
\operatorname{ReturnAuditFailure}.\\
2.\;&\forall i\in\mathcal M:\space
r_i\leftarrow\operatorname{BoundedLoadAndValidateTrace}(i);
\quad\text{missing}\Rightarrow
\operatorname{RetainMissingEntryAndSkipTraceDependentSteps3And4}.\\
3.\;&(Y_i,Z_i,H_i)\leftarrow
\operatorname{IndependentGoalFaultRecoveryLabels}(r_i);
\quad\text{unknown}\Rightarrow\operatorname{RetainUnknownCategory}.\\
4.\;&(N_i,W_i,C_i,\ell_i)\leftarrow
\operatorname{AccountAllAttemptsBranchesChecksAndTerminalStatus}(r_i).\\
5.\;&\operatorname{GroupByDeclaredTaskAndFaultStrata};
\quad\operatorname{ComputeMetricsWithDenominatorsAndUndefinedFlags}.\\
6.\;&\operatorname{ComputePairedOrClusterAwareUncertainty};
\quad\operatorname{RejectIncompatibleEstimands}.\\
7.\;&\operatorname{ReturnMetricsPlusMissingnessConfigurationsAndAudit}.
\end{aligned}
$$

[DERIVED] Unknown outcome labels remain visible. A conservative lower bound can count only verified successes while retaining all attempted units; it must be named as such. Excluding unknowns silently estimates a different population.

[DERIVED] If $n_{\rm known}$ units have known outcomes and $n_{\rm unknown}$ do not, completion lies between verified successes divided by all attempts and verified successes plus unknowns divided by all attempts. Unknown cost records make total-cost metrics unresolved unless independently justified cost bounds are available; do not insert zero costs or average symbolic unknowns.

## Implementation

[DERIVED] No numbered reference-stack system defines these task metrics. The outside-stack benchmark implementations supply particular environments and evaluators, not universal semantics. Join traces using logical request, plan revision, action identity and ownership epoch. Model telemetry, tool receipts and database outcomes need a shared event schema while preserving their distinct trust levels.

[DERIVED] Separate measurement from control: final evaluators must not leak hidden goals into action selection unless the protocol explicitly allows that feedback. Preserve raw timestamps and clock domains; cross-service elapsed components may not sum exactly under unsynchronized clocks. No benchmark code or local instrumentation was executed here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] τ-bench's v1 main study has 115 retail and 50 airline tasks, at most 30 actions and at least three trials, using a GPT-4-0613 user simulator. GPT-4o function calling scores 61.2 retail, 35.2 airline and 48.2 domain-macro average [P43, Tables 1–2, §5]. The average is not weighted by task count. Its repeated-trial figure reports retail pass^8 below 25%, despite pass^1 above 60% [P43, Figure 4].

[PAPER-REPORTED] ToolMaze's Figure 5 fits log-linear slopes across six different open model families: 17.85 percentage points/order for clean TSR and 4.88 for PRR, yielding 3.66 [R52.2, §4.3]. Architectures, training and total versus active parameters differ. This is a cross-model association, not a controlled scaling law or causal proof that parameter scaling cannot improve recovery.

## Observations

**What the paper claims.** [PAPER-REPORTED] Repeated-task reliability and fault-conditioned metrics expose behavior missed by average clean success [P43, §5; R52.2, §§3.5–4.3].

**What the evidence shows.** [PAPER-REPORTED] τ-bench's all-trials reliability drops with repeated trials; ToolMaze's implicit faults remain difficult and its recovery metric has an exposure-dependent denominator.

**What we infer.** [DERIVED] Report verified completion, exposure, local recovery, total attempts and total cost together. A favorable scalar does not establish a favorable service contract.

**What remains unknown.** [NOT-DISCLOSED] Full confidence intervals, immutable provider backends and common production cost/latency traces are absent from the cited comparisons.

## Failure modes

> **Failure mode — Successful-run selection bias.** [DERIVED] *Symptom:* a controller appears cheaper after more expensive failures disappear from the metric. *Cause:* costs are averaged only over successful runs. *Detection:* reconcile attempt manifest and billing/trace totals. *Mitigation:* report Eq. 52.28 and conditional cost separately.

[DERIVED] Further failures include zero-exposure PRR reported as zero, graceful termination called goal completion, hidden retries omitted from calls and cross-model slopes described as controlled scaling.

## Siblings

[DERIVED] Goal success measures delivered outcomes; recovery rate measures response after exposure; waste measures adjudicated unnecessary work; latency measures elapsed boundaries; cost measures consumed resources. None is a substitute for the others, and composite weights express a chosen utility rather than a scientific law.

## Extensions

### Improvements

[PAPER-REPORTED] Relative to answer-only evaluation, τ-bench adds state outcomes and repeated reliability; ToolMaze adds controlled topology/fault axes [P43, §3; R52.2, §3]. [DERIVED] Their improvement is diagnostic resolution. Remaining limitations include synthetic users/worlds, incomplete policy checks and nonidentical resource envelopes.

## Limitations

[DERIVED] An open problem is estimating recovery utility under realistic correlated failures and hidden drift without selection through controller-specific exposure. Evidence needs matched causal fault opportunities, independent effect truth and complete resource traces. Static clean benchmarks and arbitrary composite scores cannot resolve it.

## Reproducibility

[UNVERIFIED] Preserve task/fault manifests, seeds and actual sampling settings, model/agent/tool revisions, prompts, all attempted traces, missingness, independent labels, metric code and cost boundaries. This edition performed source and manuscript checks, not controller experiments.

```figure
id: fig-52.19
kind: calculator
title: "Exposure changes unconditional recovery penalty"
caption: "Illustrative mixture identity. Lower unconditional penalty can come entirely from fewer exposed runs, even when recovery among exposed runs is unchanged."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-52.27
alt: "Unconditional recovery penalty equals fault exposure probability times conditional penalty. Changing exposure alone changes the aggregate metric."
states:
  - {anchor: formulation, label: "Denominator", note: "The aggregate includes unexposed runs with zero contribution."}
  - {anchor: mechanism, label: "Mixture", note: "Compare exposure and conditional recovery separately."}
  - {anchor: failure-modes, label: "Selection", note: "An aggregate improvement can arise without better recovery."}
spec:
  tex: "\\mathbb E[Zr]=\\Pr(Z=1)\\mathbb E[r\\mid Z=1]"
  equation: "52.27"
  inputs:
    - {symbol: exposure, label: "fault exposure probability", default: 0.5, min: 0, max: 1, format: fixed2}
    - {symbol: penalty, label: "mean penalty when exposed", default: 0.8, min: 0, max: 1, format: fixed2}
  outputs:
    - {symbol: result, label: "unconditional mean penalty", formula: "exposure*penalty", format: fixed3}
```

```figure
id: fig-52.20
kind: stat-panel
title: "Reliability and discovery use different events"
caption: "Repeated-trial metrics require a within-task sampling model. Exponentiating aggregate success ignores task heterogeneity."
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-52.25
alt: "All-trials success, at-least-one success and one-trial average success use different events, with separate cluster-aware uncertainty."
spec:
  header: CONTRACT BOUNDARY
  rows:
    - {key: "all trials", value: "task mean of p_i^k"}
    - {key: "any trial", value: "task mean of 1-(1-p_i)^k"}
    - {key: "uncertainty", value: "preserve task clusters and missingness"}
```

## References

[P43](references.md#p43), [R52.1](references.md#r52-1), [R52.2](references.md#r52-2), [R52.4](references.md#r52-4).
