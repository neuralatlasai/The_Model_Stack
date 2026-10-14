---
id: ms.section.54.5
entity_type: section
title: "Resource control"
volume: 3
part: 9
chapter: 54
section: 54.5
slug: 54-5-resource-control
parent: ms.chapter.54
prev_sibling: ms.section.54.4
next_sibling: ms.section.54.6
children: []
prerequisites: [ms.chapter.6, ms.chapter.38, ms.chapter.48, ms.chapter.51, ms.chapter.52, ms.chapter.53]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [multi_agent_coordination, resource_accounting], feedback_setting: [], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 54.5 Resource control

## Scope

[DERIVED] Resource control limits aggregate model, tool, storage and execution work across a dynamic team. It includes token/tool budgets, concurrency, stragglers, critical paths, cancellation and runaway coordination. The baseline gives every agent a generous local cap and assumes the total remains manageable. Success means respecting a declared global resource contract while retaining enough capacity for synthesis, verification and safe recovery.

[DERIVED] Chapter 48 owns accepted-task cost and service benchmarking. This section owns allocation and enforcement within one coordination task. Model tokens, tool calls, wall time and money are different budget units; equal agent calls do not equal equal resource consumption.

## Why this exists

[DERIVED] A team can multiply work without improving task outcome. Workers duplicate searches, exchange growing histories, spawn descendants or repeatedly challenge one another. A coordinator can consume its remaining budget summarizing partial results and then lack resources to verify them. Local caps cannot prevent global overrun when each child receives a fresh independent allocation.

[DERIVED] Concurrency also changes service behavior. Parallel model requests may share one inference engine, GPU memory or rate limit. They can queue or slow one another, turning nominal overlap into contention. Tool services, artifact stores and client resources add separate bottlenecks. A schedule based only on agent count misses these coupled constraints.

[OFFICIAL-DOCUMENTATION] Anthropic's research-system engineering report describes orchestrator/worker parallel search, substantial token overhead and prompt-level effort rules [R54.13, Architecture/Prompt engineering]. These are first-party observations in a disclosed product setting, not a universal budget law or equal-compute proof of multi-agent superiority.

## Intuition

[DERIVED] Treat the team as one resource-owning job with suballocations. Before dispatch, reserve a conservative amount for an operation; after a known terminal outcome, charge actual use and release the unused reservation. A child may spend only its allocation and cannot replenish it through further delegation. Leave an explicit reserve for final verification and bounded cleanup.

[DERIVED] A timeout does not necessarily release a resource. The server may still run or hold memory after the client stops waiting. A safe concurrency count includes unresolved potentially active work until authoritative termination or the declared resource contract establishes release. Otherwise repeated timeouts can create more simultaneous work than the nominal slot cap.

## Formulation

[DERIVED] Let $\mathbf B$ be a nonnegative vector of global caps in named units, $\mathbf C$ charged consumption, $\mathbf R_i$ outstanding conservative reservations and $\mathbf F$ finalization/recovery reserve. Componentwise admission of proposed reservation $\mathbf r$ requires
$$
\mathbf C+\sum_{i\in\mathrm{active}}\mathbf R_i+\mathbf F+\mathbf r
\preceq\mathbf B,\qquad
\mathbf B_{\rm free}=\mathbf B-\mathbf C-\sum_i\mathbf R_i-\mathbf F.
$$
*(Eq. 54.17)*

[DERIVED] A hard guarantee requires each reservation to upper-bound actual covered consumption, atomic accounting and enforced child/remote limits. Hidden reasoning tokens, unbounded external jobs or unknown tariffs can make the budget only a monitored estimate. Such unknowns cannot be silently charged as zero. Dollars require dated tariffs and a complete ownership boundary as in Chapter 48.

[MATHEMATICALLY-DERIVED] If integer $n_a\ge1$ independent branch durations are iid exponential with rate $\kappa_{\rm svc}>0$, the all-branch barrier duration $M=\max_iX_i$ has
$$
\Pr(M\le t)=(1-e^{-\kappa_{\rm svc}t})^{n_a},\quad t\ge0;\qquad
\mathbb E M=\frac1{\kappa_{\rm svc}}\sum_{j=1}^{n_a}\frac1j.
$$
*(Eq. 54.18)*

[DERIVED] The mean follows by integrating the survival probability, or by exponential order-statistic gaps. This is an illustrative straggler model, not a fitted LLM service law. Identical deterministic branches would have no such stochastic maximum penalty; shared queueing and heavy-tailed tools can behave very differently.

[MATHEMATICALLY-DERIVED] The corresponding $p_q$ quantile for $0<p_q<1$ is
$$
t_{p_q}=-\frac1{\kappa_{\rm svc}}\log(1-p_q^{1/n_a}).
$$
*(Eq. 54.19)*

[DERIVED] Stopping after a quorum changes the task contract unless missing branches are optional or redundantly sufficient. Dropping a slow but required evidence source may improve latency while invalidating the answer. Speculative duplicate execution may lower waiting time but increases work and must obey effect deduplication.

[DERIVED] Critical path remains the longest dependency chain, including coordinator, communication and final checking. Resource limits can delay off-path nodes until they become the actual bottleneck. The graph lower bound in Eq. 54.1 is therefore a necessary condition; observed schedule traces determine achieved latency.



```figure
{
  "id": "fig-54.15",
  "kind": "calculator",
  "title": "One resource component remaining",
  "caption": "Illustrative one component of the global reservation vector. A negative result forbids additional admission; all components must pass and unknown remote work retains its reservation.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-54.17",
  "alt": "Illustrative one component of the global reservation vector. A negative result forbids additional admission; all components must pass and unknown remote work retains its reservation.",
  "spec": {
    "tex": "B_{\\rm free}=B_{\\max}-C_{\\rm used}-R_{\\rm active}-F_{\\rm final}",
    "equation": "54.17",
    "inputs": [
      {
        "symbol": "cap",
        "label": "Total token cap",
        "default": 100000,
        "min": 10000,
        "max": 1000000,
        "format": "tokens"
      },
      {
        "symbol": "spent",
        "label": "Charged tokens",
        "default": 20000,
        "min": 0,
        "max": 1000000,
        "format": "tokens"
      },
      {
        "symbol": "reserved",
        "label": "Active-work tokens reserved",
        "default": 30000,
        "min": 0,
        "max": 1000000,
        "format": "tokens"
      },
      {
        "symbol": "final",
        "label": "Finalization tokens reserved",
        "default": 10000,
        "min": 0,
        "max": 1000000,
        "format": "tokens"
      }
    ],
    "outputs": [
      {
        "symbol": "free",
        "label": "Unreserved token remainder",
        "formula": "cap-spent-reserved-final",
        "format": "tokens"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Define a budget vector before delegation. Separate model input, output and hidden/reported reasoning work; tool invocation and externally billed work; concurrent jobs; artifact bytes; wall-clock deadline and money. Some units can be controlled directly, others only estimated. Record the distinction and the conservative margin rather than claiming a hard bound from incomplete telemetry.

[DERIVED] Reserve finalization and recovery resources first. Allocate remaining budget to bounded worker operations with explicit maximum descendants, rounds and message sizes. Reservations and ownership updates must be atomic and durable so two concurrent workers cannot spend the same balance or obtain a fresh cap after restart. The coordinator follows the same accounting as workers.

[DERIVED] Choose a ready task using dependency and resource constraints. Large critical-path or high-value evidence tasks may deserve earlier slots, but estimated duration/value uncertainty remains visible. Maintain per-service limits as well as aggregate agent concurrency. A worker waiting on a tool can release a model slot while still occupying a tool-job reservation; resource types need separate state.

[DERIVED] Charge actual usage on known outcomes, including failures and cancellation work. Release a reservation only when its covered resource is known no longer committed or active. For unknown remote jobs, retain the conservative reservation or expose that the hard cap can no longer be established. A cancellation acknowledgment alone is insufficient under Chapter 51's cooperative semantics.

[DERIVED] Detect runaway coordination through state, not a vague impression of verbosity. Track repeated task/artifact hashes, unchanged verified evidence, cycles of objections without new checks, descendant count and budget velocity. A progress metric should count accepted evidence or state changes, not message volume. Finite caps provide termination even when semantic progress detection is imperfect.

[DERIVED] **Cost.** More concurrency can reduce span while increasing simultaneous memory and rate-limit pressure. More rounds add generated tokens and repeated input context. Budget accounting adds metadata writes and coordination latency; strict reservations can leave capacity unused when estimates are conservative. Cancellation/recovery consumes work, and paying for duplicate speculation can be expensive even when the final answer uses one branch. These tradeoffs belong in accepted-task evaluation.



```figure
{
  "id": "fig-54.16",
  "kind": "diagram",
  "title": "Global reservation precedes work",
  "caption": "Admission atomically reserves every resource component and a free slot. Covered finalization use moves from reserve to charge; uncertain work cannot be released by a timeout alone.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.17",
  "alt": "Durable budgets enter an atomic resource-and-slot gate. Admitted work reaches a known/unknown outcome branch: known use is charged with safe releases; unknown work retains reservations. Rejected admission waits within a bound or returns partial without dispatch.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "Durable job and budgets"
      },
      {
        "id": "b",
        "kind": "branch",
        "label": "Atomic resource + free-slot admission"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "Bounded concurrent work"
      },
      {
        "id": "status",
        "kind": "branch",
        "label": "Known terminal outcome?"
      },
      {
        "id": "charge",
        "kind": "memory",
        "label": "Charge use, release unused safely"
      },
      {
        "id": "hold",
        "kind": "memory",
        "label": "Retain uncertain reservations"
      },
      {
        "id": "wait",
        "kind": "process",
        "label": "Bounded wait / reconsider"
      },
      {
        "id": "final",
        "kind": "boundary",
        "label": "Use reserved finalization"
      },
      {
        "id": "e",
        "kind": "metric",
        "label": "Checked final / partial outcome"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "admitted"
      },
      {
        "from": "b",
        "to": "wait",
        "label": "unavailable, no dispatch"
      },
      {
        "from": "wait",
        "to": "a",
        "label": "event before deadline",
        "kind": "feedback"
      },
      {
        "from": "wait",
        "to": "final",
        "label": "deadline / cap"
      },
      {
        "from": "c",
        "to": "status"
      },
      {
        "from": "status",
        "to": "charge",
        "label": "known"
      },
      {
        "from": "status",
        "to": "hold",
        "label": "unknown"
      },
      {
        "from": "charge",
        "to": "final"
      },
      {
        "from": "hold",
        "to": "final"
      },
      {
        "from": "final",
        "to": "e"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 54.5 — Durable global resource admission.** [DERIVED] Inputs are global budget vector, task graph/controller, integer concurrency/descendant/round caps, absolute deadline and per-operation enforceable or explicitly estimated reservations. Output is a complete resource ledger plus verified, partial or failed task state.

$$
\begin{aligned}
1.&\quad (\mathbf C,\{\mathbf R_i\},\mathbf F,J)\leftarrow
\operatorname{LoadDurableBudgetStateOrCreate};
\quad\operatorname{EnsureIdempotentFinalizationReserve}(\mathrm{jobId});\\
 &\quad\operatorname{Unavailable}\Rightarrow\operatorname{ReturnPartial}.\\
2.&\quad \operatorname{ReconcileKnownTerminalAndUnknownJobs};
\quad\operatorname{PersistChargesAndSafeReleases}.\\
3.&\quad \mathcal R\leftarrow\operatorname{ReadyAuthorizedWork};
\quad m_{\rm free}\leftarrow m_{\rm cap}-m_{\rm possiblyActive}.\\
4.&\quad i\leftarrow\operatorname{SelectFeasible}(\mathcal R,m_{\rm free},\mathbf B_{\rm free});
\quad i=\bot\Rightarrow\operatorname{GoTo}(6);\\
 &\quad\operatorname{AtomicReserveAndJournal}(i,\mathbf r_i)
\Rightarrow\operatorname{DispatchBoundedWork}(i).\\
5.&\quad \operatorname{ObserveBoundedEvent};
\quad\operatorname{PersistActualUsageStatusAndProgress};
\quad\operatorname{BeforeCaps}\Rightarrow\operatorname{GoTo}(2).\\
6.&\quad \operatorname{BeforeDeadlineAndCaps}\land\operatorname{NoNewWorkFitsAndActiveJobsRemain}\Rightarrow\operatorname{WaitBoundedEvent};\,\operatorname{GoTo}(2);\\
 &\quad \operatorname{DeadlineOrCapOrNoRemainingWork}\Rightarrow
\operatorname{SignalCancellationForOptionalWork};\\
 &\quad\operatorname{BoundedReconcileAndFinalizeUsingReserve};\\
7.&\quad \operatorname{Return}(J,\mathbf C,\mathrm{unreleased\ reservations},\mathrm{outcome}).
\end{aligned}
$$

[DERIVED] If no new task fits but jobs are active, step 6 waits only for bounded events before returning to step 2; it does not treat temporary unavailability as successful completion. Finalization reserve is idempotent by persisted job identity; covered consumption atomically increases $\mathbf C$ and decreases $\mathbf F$, avoiding double counting or renewed reserve on restart. Invariants are componentwise budget accounting, persistent limits, counted unknown potentially active jobs and no descendant outside the parent allocation. A reservation failure prevents dispatch. Finalization failure remains a partial outcome.

## Implementation

[OFFICIAL-DOCUMENTATION] The pinned LangGraph StateGraph source exposes node policy fields for retry, cache, timeout and error handling [R54.14, _NodeDefaults]. Those fields are interfaces, not proof of a global monetary/token budget. A workflow must connect actual usage and durable ownership to its own admission policy.

[DERIVED] Integrate model/tool usage records with task/agent/operation IDs. Distinguish observed tokens from provider-billed units and cached-input accounting. Record client wait, server execution and cancellation/release events separately. Shared prefix caching can change actual costs across variants; it must be declared rather than silently credited to one topology.

[DERIVED] Token reservations should include the actual context transferred to each agent and expected maximum outputs under an enforced cap. An API returning incomplete reasoning/billing data requires a bounded tariff/request contract or an explicit estimate. Tool jobs with non-cancellable external work need independent server-side limits or a conservative orphan-job policy.

[OFFICIAL-DOCUMENTATION] In the pinned LangGraph source, set_node_defaults applies policies at compile time and explicitly does not inherit them into subgraphs; retry/timeout cover error-handler nodes, while cache/error-handler defaults cover regular nodes [R54.14, lines 252–268]. This is a concrete interface boundary requiring explicit global-budget propagation and enforcement. Static inspection does not establish runtime enforcement.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] R54.13 reports that its multi-agent research system uses about fifteen times chat token usage in its data and gives explicit prompt-level effort guidelines [R54.13, Why multi-agent systems/Scale effort]. The comparator is chat, not a budget-matched single-agent research baseline. The report's internal evaluation lacks the complete public workload/traces required for independent equal-budget attribution.

[PAPER-REPORTED] R54.4 states matched computation through maximum iterations, while Appendix E.2 gives a single-agent ten-iteration cap and architecture-specific worker/round settings [R54.4, §4.1/Appendix E.2]. R54.5 states matching by total agent calls [R54.5, §5.1]. These are disclosed control choices; neither alone proves equal realized tokens, tool work, latency or money.

[PAPER-REPORTED] AutoGen's dynamic group-chat pilot uses twelve manually crafted tasks to compare speaker-selection prompting [R54.3, §3 A5/Appendix D]. It does not establish a production resource-control guarantee or broad latency scaling law.

## Observations

**What the paper claims.** [PAPER-REPORTED] Coordination studies seek controlled resource comparisons and report topology-dependent costs [R54.4–R54.5].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] First-party engineering reports describe material overhead and allocation heuristics [R54.13]; public studies use different units of matching.

**What we infer.** [DERIVED] Global durable reservations, actual-use accounting and declared unknowns are needed before “same budget” has a precise meaning.

**What remains unknown.** [UNVERIFIED] No local concurrency, orphan-job, reservation or accepted-task resource experiment was executed.



```figure
{
  "id": "fig-54.17",
  "kind": "stat-panel",
  "title": "Scientific boundaries to retain",
  "caption": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.17",
  "alt": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "spec": {
    "header": "CLAIM BOUNDARY",
    "rows": [
      {
        "key": "scope",
        "value": "Subagents and handlers counted"
      },
      {
        "key": "restart",
        "value": "No cap reset or double reserve"
      },
      {
        "key": "tail",
        "value": "Join maximum differs from mean"
      },
      {
        "key": "cancel",
        "value": "Authoritative release required"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

[DERIVED] Fresh child caps multiply resources; inherit suballocations. Race in balance checking overspends; reserve atomically. Client timeout releases a still-running slot; count possibly active work. Barrier waits forever for a failed worker; propagate failure and deadline. Straggler cancellation drops required evidence; preserve acceptance semantics. Uncharged synthesis exceeds the cap; reserve it first. Proxy counters omit tools/retries/hidden usage; expose partial accounting. Restart resets budget; load durable state.

## Siblings

[DERIVED] Static per-role quotas, shared dynamic budgets and value-based adaptive allocation trade simplicity, utilization and estimation risk. All require external enforcement for hard caps. Single-agent long reasoning and independent best-of-k should receive equivalent total resources in comparisons. Chapter 48 owns full economics; §54.6 owns budget/frontier reporting.

## Extensions

### Improvements

[DERIVED] A stronger coordinator replaces local-only caps with durable global admission, reserve-aware scheduling and bounded cancellation/reconciliation. The changed mechanism is accountable resource ownership. Open research concerns predicting marginal verified value under nonstationary tool/server latency and allocating budget without censoring hard tasks. Settling evidence requires prospective policies, full failure costs and held-out workloads.

## Limitations

[DERIVED] Reservation guarantees are conditional on actual enforceable bounds. Exponential straggler formulas are illustrative. Shared servers invalidate independent-duration assumptions. A policy can obey every budget and still return a wrong answer; resource correctness is one component of accepted-task service.

## Reproducibility

[UNVERIFIED] Preserve caps/reservations, actual model/tool/billing units, concurrency timeline, orphan/cancellation records, finalization reserve and all failed tasks. Proposed resource sweeps are in verification.md. No benchmark or billing API was executed.

## References

[PAPER-REPORTED] [R54.3](references.md#r54-3), [R54.4](references.md#r54-4), [R54.5](references.md#r54-5). [OFFICIAL-DOCUMENTATION] [R54.13](references.md#r54-13) first-party research-system report; [R54.14](references.md#r54-14) static policy fields. Access 2026-10-14.
