---
id: ms.section.48.5
entity_type: section
title: "Economics"
volume: 2
part: 8
chapter: 48
section: 48.5
slug: 48-5-economics
parent: ms.chapter.48
prev_sibling: ms.section.48.4
next_sibling: ms.section.48.6
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

# 48.5 Economics

## Scope

[DERIVED] Inference economics compares the total cost of delivering a declared quality-and-latency service over a workload horizon. The baseline is nominal price per generated token or peak tokens per rented accelerator dollar. Success is a complete accepted-task cost ledger with training/preparation amortization, idle/reserve capacity, retries, tools, energy and storage/network boundaries. Chapter 21 owns training allocation; this section accounts for its downstream economic consequences.

## Why this exists

[DERIVED] Cheap tokens can produce expensive tasks. Longer reasoning, repeated failures, tool calls and late outputs increase consumed resources without proportionally increasing accepted service. Dedicated hardware charges continue during idle periods and recovery; redundancy preserves availability by paying for capacity that may not produce unique output. A per-token quote does not reveal these costs or certify that the output meets the task.

[DERIVED] An economic comparison must hold the service contract fixed. A small model can be cheaper but fail a quality requirement. A more aggressive scheduler can improve tokens/dollar while increasing the fraction of missed deadlines. A lower spot-instance bill can accompany much worse tails. These can be valid tradeoffs, but a claim of lower accepted-task cost requires the joint acceptance definition and all rejected work.

## Intuition

[MATHEMATICALLY-DERIVED] Cost per accepted task is a ratio over the whole decision horizon. Its numerator includes resources spent on unsuccessful attempts and idle/reserve infrastructure; its denominator includes unique tasks that satisfy the declared contract. Reducing one component improves the ratio only if the other components and acceptance do not offset it. Hardware throughput and token prices are inputs, not the conclusion.

[DERIVED] Distinguish accounting from a forward decision. Historical training expenditure may belong in a lifecycle cost report while being sunk for an immediate routing decision. A new training/fine-tuning investment can be justified by future service savings only under an explicit forecast and equal accepted quality. Different decisions legitimately use different cost boundaries; name them rather than mixing them.

## Formulation

[MATHEMATICALLY-DERIVED] For horizon $[0,T]$, a nonoverlapping cost ledger can be written

$$
C_{\rm total}
=\alpha C_{\rm train}+C_{\rm prepare}
+\int_0^T\sum_r n_r(t)p_r(t)\,dt
+C_{\rm tools}+C_{\rm storage}+C_{\rm network}+C_{\rm energy}+C_{\rm other},
\qquad
c_{\rm accepted}=\frac{C_{\rm total}}{N_{\rm accepted}},
\quad N_{\rm accepted}>0.
$$
*(Eq. 48.8)*

Here costs use one declared currency/date basis; $p_r$ is charged currency per resource-second, $n_r$ charged resource count, $\alpha$ the explicitly allocated training-cost fraction and $N_{\rm accepted}$ unique accepted tasks. With zero accepted tasks, cost efficiency is undefined and no accepted service is reported. Energy is added only when separately borne, avoiding double counting electricity already included in a rental price.

[MATHEMATICALLY-DERIVED] For alternatives with fixed costs $F_A,F_B$ and stable marginal accepted-task costs $c_A,c_B$, equal-quality break-even volume is

$$
N^*=\frac{F_A-F_B}{c_B-c_A}
$$
*(Eq. 48.9)*

when $F_A>F_B$ and $c_B>c_A$. The formula is conditional on comparable task acceptance, constant marginal cost and a meaningful common horizon. Other sign cases may have no positive crossing.



```figure
{
  "id": "fig-48.15",
  "kind": "calculator",
  "title": "Cost per accepted task",
  "caption": "Illustrative complete nonoverlapping cost total and positive accepted count; no current tariff is implied.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-48.8",
  "alt": "Illustrative complete nonoverlapping cost total and positive accepted count; no current tariff is implied.",
  "spec": {
    "tex": "c=C_{\\rm total}/N_{\\rm accepted}",
    "equation": "48.8",
    "inputs": [
      {
        "symbol": "C",
        "label": "Complete cost in declared currency",
        "default": 1000,
        "min": 0,
        "max": 100000,
        "format": "fixed3"
      },
      {
        "symbol": "N",
        "label": "Unique accepted tasks",
        "default": 100000,
        "min": 1,
        "max": 10000000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "cost",
        "label": "Currency/accepted task",
        "formula": "C/N",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Begin with offered user tasks and their complete attempt graph. Attach model calls, retries, tool/subagent work, retrieval, storage operations and network transfers to the parent task. Deduplicate accepted tasks while retaining every charged attempt. Include tasks that produced no response. For a multistep agent, a fluent answer after an unauthorized or failed environment operation is not accepted merely because its final text exists; the evaluation contract determines the denominator.

[DERIVED] Separate pricing units from work units. Native input/output/cached/reasoning tokens, external text-token counts and billable provider units can differ. A cached-token rate may carry separate read/write/storage charges; a cache hit does not necessarily make all conditioning free. Preserve the invoice or published dated tariff identity and actual billed usage. No timeless price is asserted in this chapter.

[MATHEMATICALLY-DERIVED] Under a deliberately simplified retry model with independent per-attempt success probability $q>0$, constant attempt cost $c$ and at most positive integer $K$ attempts,
$\mathbb E[N_{\rm attempts}]=\sum_{j=0}^{K-1}(1-q)^j=[1-(1-q)^K]/q$,
while acceptance probability is $1-(1-q)^K$. Thus cohort cost per accepted task is $c/q$ under those assumptions, before fixed cost. Raising $K$ changes total spend and success coverage but does not change this simplified ratio. Real retries are correlated, may miss deadlines and can have changing costs/cache state; the identity is an analytical reference, not a retry policy recommendation.

[DERIVED] Dedicated capacity requires a time ledger rather than charging only active kernels. Include provisioned idle time, warm replicas, replacement pools, deployment overlap and failure recovery. A resource paid for at an hourly rate incurs cost even when it waits on a tool or network dependency. Autoscaling can lower idle cost while adding startup/cold-state risk. The service envelope from §48.4 determines which of these allocations are necessary to meet the contract.

[MATHEMATICALLY-DERIVED] In a stable regime with average cost rate $\dot C$ and accepted-task rate $G>0$, marginal steady cost is $\dot C/G$ on the same time boundary. If a reserve raises $\dot C$ but prevents enough failures to raise $G$ proportionally more, accepted-task cost can fall. Conversely, maximizing raw output throughput can raise cost if accepted-task rate falls. The sign requires both measured changes; utilization alone cannot decide it.

[DERIVED] Training amortization needs an explicit allocation rule and forecast. Include the chosen training/fine-tuning/search/evaluation costs and identify which are shared across workloads or model versions. Dividing by a speculative lifetime token count produces a scenario, not a measured unit cost. A model retired early, a new task mix or a changed quality threshold can eliminate the forecast volume. Report sensitivity to accepted volume and deployment lifetime rather than one overprecise amortized number.

[MATHEMATICALLY-DERIVED] Equation 48.9 follows by equating $F_A+Nc_A$ and $F_B+Nc_B$. If fixed-cost difference is uncertain over $[\Delta F_-,\Delta F_+]$ and positive marginal saving over $[\Delta c_-,\Delta c_+]$, a conditional crossing range is
$[\Delta F_-/\Delta c_+,\Delta F_+/\Delta c_-]$ for positive endpoints. If the saving interval includes zero, a finite guaranteed crossing is unidentified. Correlated forecasts require a joint scenario analysis rather than independent interval endpoints treated as probabilities.

[DERIVED] Energy accounting must use the cost owner's boundary. Owned hardware may bear electricity and facility overhead separately; a cloud renter often pays an inclusive rental rate. Measured processor power excludes other system components, while provisioned power is a capacity rating/model, not a measured energy integral. Electricity cost is $\int p_E(t)P(t)dt$ when $p_E$ is currency/J and $P$ watts. Cooling/PSU overhead belongs exactly once, at the stated system boundary.

[DERIVED] Storage/network costs include weights, checkpoints, logs, vector indexes, retained state, data movement and replication as actually charged. A RAG deployment pays ingestion and index maintenance before serving queries; amortizing build cost over future accepted queries requires their forecast and refresh cadence. Tools can charge per call or carry independent infrastructure cost. Waiting on a tool can also consume reserved model/cache capacity, coupling external latency to internal economics.

[PAPER-REPORTED] SpotServe combines adaptive parallel configurations, context migration and stateful recovery to exploit preemptible instances [R48.21, §§3–5]. Its controller uses estimated throughput/latency and observed availability; migration consumes buffers and communication. Recovery can fall back to reloading weights when required context is lost. These are concrete mechanisms behind a cost/latency frontier, not a price discount alone.

[DERIVED] A cheaper unreliable resource can increase accepted-task cost through lost work, recovery traffic, cold-state delay and extra headroom. The frontier depends on correlated preemptions and grace-period/control availability, not simply the average discounted price. A standby or on-demand fallback pays a reserve to preserve service. Compare these policies at fixed workload, acceptance and failure scenario rather than crediting cheap interrupted work as completed service.

[DERIVED] Financial uncertainty has two sources: measurement uncertainty in accepted service/resource use, and scenario uncertainty in future prices, workload/lifetime and failure behavior. They should not be combined into a narrow statistical confidence interval without a probabilistic forecast model. Report dated observed quantities separately from assumptions and scenario ranges. Geographic/currency/tax/contract differences can matter but do not justify invented universal prices.

[DERIVED] Resource accounting includes every inference FLOP and physical-state/traffic term from Chapter 42, plus training/preparation, retries, migration, tools, idle/redundancy, storage/network and energy over the horizon. An economic estimator also consumes CPU/memory to join events and cost records. Finite task/attempt logs can be processed in $O(n)$ after identity joins under a declared map implementation, with $O(n)$ retained audit data. Missing billing/usage remains unknown rather than zero.



```figure
{
  "id": "fig-48.16",
  "kind": "diagram",
  "title": "Complete accepted-task cost boundary",
  "caption": "All attempts, idle/reserve and supporting services enter cost; only unique contract-valid tasks enter the accepted denominator.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.8",
  "alt": "The diagram shows Offered task/attempt graph to Inference and retries; Offered task/attempt graph to Tools retrieval network storage; Inference and retries to Complete charged cost; Tools retrieval network storage to Complete charged cost; Idle reserve recovery to Complete charged cost; Offered task/attempt graph to Unique accepted tasks; Complete charged cost to Cost per accepted task; Unique accepted tasks to Cost per accepted task.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "t",
        "kind": "dataset",
        "label": "Offered task/attempt graph"
      },
      {
        "id": "i",
        "kind": "process",
        "label": "Inference and retries"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Tools retrieval network storage"
      },
      {
        "id": "r",
        "kind": "hardware",
        "label": "Idle reserve recovery"
      },
      {
        "id": "c",
        "kind": "metric",
        "label": "Complete charged cost"
      },
      {
        "id": "a",
        "kind": "metric",
        "label": "Unique accepted tasks"
      },
      {
        "id": "u",
        "kind": "metric",
        "label": "Cost per accepted task"
      }
    ],
    "edges": [
      {
        "from": "t",
        "to": "i"
      },
      {
        "from": "t",
        "to": "s"
      },
      {
        "from": "i",
        "to": "c"
      },
      {
        "from": "s",
        "to": "c"
      },
      {
        "from": "r",
        "to": "c"
      },
      {
        "from": "t",
        "to": "a"
      },
      {
        "from": "c",
        "to": "u"
      },
      {
        "from": "a",
        "to": "u"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 48.5 — Bounded accepted-task cost ledger.** [DERIVED] Inputs are finite task/attempt/resource/billing records, currency/date and ownership boundary, allocation rules, acceptance and horizon. Output is costs per accepted task with scenario/measurement gaps.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateUnitsTariffDatesAndNonoverlap};\
C\leftarrow0;\quad \mathcal A\leftarrow\varnothing.\\
2.&\quad \text{For every charged event }e:\quad
\operatorname{UnknownUsageOrPrice}\Rightarrow\operatorname{RetainGap}(e);\
\text{else }C\leftarrow C+\operatorname{Cost}(e).\\
3.&\quad \operatorname{AddAllocatedFixedAndIdleReserveCostsOnce};\
\operatorname{JoinAttemptsToUniqueTasks}.\\
4.&\quad \operatorname{TaskPassesQualityAndSLOs}(i)
\Rightarrow\mathcal A\leftarrow\mathcal A\cup\{i\}.\\
5.&\quad |\mathcal A|=0\Rightarrow c_{\rm accepted}=\mathrm{UNDEFINED};\
\text{else }c_{\rm accepted}\leftarrow C/|\mathcal A|.\\
6.&\quad \operatorname{Return}(\text{known subtotal},\text{complete/partial status},
c_{\rm accepted},\text{scenario sensitivity}).
\end{aligned}
$$

[DERIVED] Invariants are no duplicate electricity/rental charges, all failed attempts retained and no unknown cost silently set to zero. A ratio using an incomplete numerator is labelled a partial subtotal, not total accepted-task cost. Finite records/horizon guarantee termination; no price forecast is relabelled an observed tariff.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** and **NVIDIA Triton Inference Server — Serving / portable runtime** supply runtime/benchmark measurements, not a complete financial ledger [R48.5–R48.7]. SpotServe is an outside-stack research implementation routed through Chapter 48's cost/capacity anchor; its artifact documents the distributed components [R48.22]. No billing integration or economic deployment was executed here.

[DERIVED] Join task events to provisioning intervals and separately dated price/energy records. Keep a machine-readable component tree showing ownership and allocation. This makes double counting and omissions reviewable. If internal reasoning or provider usage is undisclosed, report an uncertainty interval only when its bounds are defensible; otherwise retain an unidentified total.

## Experimental design

### Reported experiments

[PAPER-REPORTED] SpotServe replays two 20-minute segments from a 12-hour AWS spot-availability trace on g4dn.12xlarge/T4 instances. It tests OPT-6.7B, GPT-20B and LLaMA-30B, fixed 512/128 input/output and bursty/dynamic arrivals, against same-engine rerouting/reparallelization baselines [R48.21, §6.1]. Redundant-serving baselines are excluded.

[PAPER-REPORTED] Its reported up-to-54% cost saving accompanies less-than-18% average and 90% P99 latency increases in the compared on-demand frontier [R48.21, §6.2/Fig. 7]. Those historical prices and tolerances are not current tariffs or a fixed-SLO accepted-task result.

## Observations

**What the paper claims.** [PAPER-REPORTED] SpotServe reports a favorable preemptible-resource cost/latency frontier [R48.21].

**What the evidence shows.** [PAPER-REPORTED] The disclosed saving changes latency and uses selected availability traces; strict SLO optimization remains a stated extension [R48.21, §§6.2/8]. Task-quality acceptance is not established by that token-cost comparison.

**What we infer.** [MATHEMATICALLY-DERIVED] Equations 48.8–48.9 require an accepted denominator and a forecasted horizon. A lower rental bill alone cannot establish lower accepted-task cost.

**What remains unknown.** [UNVERIFIED] The contemporary frontier under matched quality, strict tails, current contracts and broader correlated failures remains unmeasured.



```figure
{
  "id": "fig-48.17",
  "kind": "stat-panel",
  "title": "Economic boundary",
  "caption": "Historical prices, fixed forecasts and current measured costs remain distinguishable.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.8",
  "alt": "Historical prices, fixed forecasts and current measured costs remain distinguishable.",
  "spec": {
    "header": "ECONOMIC BOUNDARY",
    "rows": [
      {
        "key": "training",
        "value": "Allocated fixed cost and forecast volume"
      },
      {
        "key": "idle",
        "value": "Charged provisioned interval"
      },
      {
        "key": "retry",
        "value": "Every attempt; unique accepted tasks"
      },
      {
        "key": "energy",
        "value": "Ownership and no double counting"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Cheap-token denominator substitution.** [DERIVED] *Symptom:* reported unit cost falls while completed useful tasks become rarer. *Cause:* unsuccessful, repeated or late tokens enter the benefit denominator. *Detection:* reconcile unique accepted tasks and all charged attempts. *Mitigation:* retain token metrics as diagnostics and price the complete task contract.

[DERIVED] Other failures include zero assigned cost for idle reserves, current-price claims based on historical papers, training amortized over unsupported lifetime volume, and electricity added twice to an inclusive cloud charge. A missed invoice component makes a subtotal, not a complete cost estimate.

## Siblings

[DERIVED] [§48.3](48-3-metrics.md) defines accepted service; [§48.4](48-4-queueing-and-capacity.md) determines feasible reserves; [§48.6](48-6-external-measurements.md) bounds external price/performance evidence. Chapter 21 owns inference-aware training decisions. Compare equal accepted-task contracts over a common ownership/horizon boundary.

## Extensions

### Improvements

[DERIVED] The lineage expands per-token/kernel prices into workload-aware capacity and failure/recovery economics. SpotServe adds state-preserving adaptation to cheaper preemptible resources; its cost advantage requires its disclosed latency/failure regime [R48.21]. An accepted-task ledger adds quality and complete ownership boundaries, but needs measurements that a published token-cost frontier may not disclose.

## Limitations

[DERIVED] Future demand, tariffs, retirement and failures are uncertain. Costs can be jointly shared across workloads, making allocation partly a declared accounting choice. Missing provider internals can prevent reconstruction of physical energy even when an invoice is known.

> **Open question.** [UNVERIFIED] Which resource/failure investments minimize lifecycle cost at a fixed accepted-task quality and tail service target under uncertain demand? *Settling evidence:* held-out demand/failure traces, dated complete costs and validated service/quality models, with explicit scenario sensitivity.

## Reproducibility

[DERIVED] Retain dated tariffs, usage/billing, ownership/allocation, task/attempt identities, training/preparation assumptions, idle/reserve/recovery and scenario ranges. No current price recommendation or executed cost measurement is claimed. Primary-source protocol boundaries remain separate from the proposed study.

## References

[R48.5](references.md#r48-5), [R48.6](references.md#r48-6), [R48.7](references.md#r48-7), [R48.21](references.md#r48-21), [R48.22](references.md#r48-22).
