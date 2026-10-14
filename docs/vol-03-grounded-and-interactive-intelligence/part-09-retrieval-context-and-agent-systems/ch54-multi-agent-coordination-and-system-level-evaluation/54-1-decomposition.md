---
id: ms.section.54.1
entity_type: section
title: "Decomposition"
volume: 3
part: 9
chapter: 54
section: 54.1
slug: 54-1-decomposition
parent: ms.chapter.54
prev_sibling: null
next_sibling: ms.section.54.2
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

# 54.1 Decomposition

## Scope

[DERIVED] Decomposition turns a task into bounded work units, dependencies, ownership and a final acceptance condition. It distinguishes independent evidence gathering from state-dependent action sequences, specialist roles from actual differentiated capabilities, and planner/worker organization from undirected conversation. The baseline duplicates the complete task across agents or assigns roles without specifying interfaces. Useful parallelism means a better accepted-task outcome or lower latency under a declared total resource budget.

[DERIVED] Chapter 52 owns a single controller's planning/recovery machinery. Here multiple controllers create new dependency, communication and conflict costs. Chapter 51 supplies the tool/effect contract; delegating a task does not expand its authorized operations.

## Why this exists

[DERIVED] A task can look linguistically separable while remaining operationally sequential. Finding a recipe, checking inventory and executing a craft may share the same rapidly changing state. Independent execution based on stale snapshots can make the nominally parallel workers interfere. By contrast, separate retrieval over frozen documents can produce independent evidence artifacts that a later synthesis consumes.

[DERIVED] Role names do not establish specialist competence. Two agents with identical model, context and tools may make correlated errors despite different personas. Real specialization changes observations, tools, training/model choice, objective or verification responsibility. Its value must be measured against a single controller given the same information and budget.

[PAPER-REPORTED] A controlled multi-architecture study reports substantially different outcomes across Finance Agent, WorkBench, PlanCraft and BrowseComp-Plus, including degradation on its state-dependent PlanCraft tasks [R54.4, §4.2/Figure 2]. The evidence supports task-dependent tradeoffs; it does not establish a universal complexity threshold or superiority of a named topology.

## Intuition

[DERIVED] A good subtask has a bounded input, concrete output, acceptance check and known consumers. Independent workers can proceed without guessing each other's intermediate state. Dependent workers wait for validated artifacts or authoritative state transitions. The planner is responsible for the dependency graph and budget allocation, while the final evaluator checks the original task rather than a collection of plausible local completions.

[DERIVED] Parallelism buys wall-clock overlap, not free reasoning. Planning, context construction, verification, merge and conflict handling consume the same total budget. A decomposition is useful when its reduced span or improved local evidence outweighs these costs without breaking final correctness.

## Formulation

[DERIVED] Represent a finite task graph as $\mathcal G=(\mathcal V,\mathcal E)$, with node $i$ carrying input artifact/version, output contract, work duration $w_i\ge0$, read/write set, authority scope and acceptance predicate. Directed edges encode required outputs or state transitions. A static execution graph must be acyclic; bounded controller loops can be unrolled into a finite graph for analysis.

[MATHEMATICALLY-DERIVED] Under a model with $m_{\rm slots}\ge1$ identical execution slots, no preemption and node work measured on those slots, every schedule satisfies
$$
T_{\rm finish}\ge
\max\!\left(\frac{W_{\rm work}}{m_{\rm slots}},D_{\rm span}\right),\quad
W_{\rm work}=\sum_i w_i,\quad
D_{\rm span}=\max_{\pi\ {\rm path}}\left(\sum_{i\in\pi}w_i+\sum_{e\in\pi}h_e\right).
$$
*(Eq. 54.1)*

[DERIVED] Here $h_e\ge0$ is unavoidable communication/synchronization delay on edge $e$. The lower bound is necessary, not an achievable latency prediction. Slot heterogeneity, shared inference bandwidth, queueing, tool rate limits and communication capacity add constraints. If coordinator work consumes the same slots, it belongs in the graph/work sum.

[MATHEMATICALLY-DERIVED] For independently executable branches with enough slots and no shared-resource slowdown, let preparation/merge/communication cost be $H_{\rm coord}\ge0$. The idealized parallel path is
$$
T_{\rm par}=H_{\rm coord}+\max_i w_i,\qquad
T_{\rm seq}=\sum_i w_i,\qquad
T_{\rm par}<T_{\rm seq}\iff H_{\rm coord}<\sum_iw_i-\max_iw_i.
$$
*(Eq. 54.2)*

[DERIVED] This compares equal branch work; it does not assert equal quality or that a single agent must execute the same decomposition. A stronger single-agent strategy may avoid branches entirely. Parallel inference requests can also contend on one server, invalidating the fixed-$w_i$ premise.

[MATHEMATICALLY-DERIVED] If joint success of $k$ subtask checks and one synthesis check is sufficient for final correctness, including interface consistency, with failure probabilities $\epsilon_0,\ldots,\epsilon_k$, the union bound gives
$$
\Pr(\mathrm{final\ correct})\ge
\max\!\left(0,1-\sum_{i=0}^{k}\epsilon_i\right)
$$
*(Eq. 54.3)*

[DERIVED] This lower bound assumes their joint success is sufficient for the task, including interface consistency. Independence is unnecessary for the bound; multiplying success probabilities would require it. A decomposition can improve individual checks or create additional failure surfaces, so agent count alone does not determine final quality.



```figure
{
  "id": "fig-54.3",
  "kind": "calculator",
  "title": "Work and critical-path lower bound",
  "caption": "Illustrative ideal lower bound with fixed work, a critical path and m identical slots. Inputs satisfy W≥span; scheduling, communication and resource contention can raise completion time.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-54.1",
  "alt": "Illustrative ideal lower bound with fixed work, a critical path and m identical slots. Inputs satisfy W≥span; scheduling, communication and resource contention can raise completion time.",
  "spec": {
    "tex": "T_{\\min}\\ge\\max(W/m,T_{\\rm span})",
    "equation": "54.1",
    "inputs": [
      {
        "symbol": "work",
        "label": "Total serial-equivalent work seconds",
        "default": 100,
        "min": 100,
        "max": 10000,
        "format": "seconds"
      },
      {
        "symbol": "slots",
        "label": "Identical slots",
        "default": 4,
        "min": 1,
        "max": 32,
        "format": "integer"
      },
      {
        "symbol": "span",
        "label": "Critical-path seconds",
        "default": 40,
        "min": 1,
        "max": 100,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "lower",
        "label": "Necessary completion-time bound",
        "formula": "max(work/slots,span)",
        "format": "seconds"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] First preserve the original task acceptance condition and authority scope. Identify evidence needs and effectful transitions separately. Partition evidence gathering by sources or questions with clear outputs; serialize transitions that depend on updated authoritative state. A task whose dominant work is one irreversible sequence offers little safe effect parallelism even if supporting reads can overlap.

[DERIVED] Define each role through an interface: observations it receives, tools it may use, outputs it owns and checks it performs. A critic that reads only another agent's summary has less evidential independence than a verifier that executes tests against the artifact. A planner that sees the full task may still omit a requirement; downstream workers must report uncovered constraints rather than assume the plan is complete.

[DERIVED] Construct dependency and conflict edges. Data dependence requires a predecessor's artifact. Write/read overlap may require ordering, snapshot semantics or commit-time validation. Shared external services impose capacity constraints even without logical dependencies. A frozen corpus and isolated output directories make evidence tasks easier to parallelize; shared mutable accounts and files require §54.3's ownership discipline.

[DERIVED] Allocate a finite budget across preparation, workers, synthesis and verification before launching. A worker's successful local answer is provisional until interface and task-level checks pass. If a predecessor fails, descendants become blocked or require an explicitly authorized alternative plan; they do not consume an undefined input. Reject cycles or unbounded delegation unless the controller supplies a finite iteration/state policy.

[PAPER-REPORTED] MetaGPT defines role profiles and an SOP workflow, uses structured artifacts and a shared publish/subscribe message pool, and activates actions after their prerequisites arrive [R54.2, §§3.1–3.2]. Its executable feedback checks generated code rather than relying only on role agreement [R54.2, §3.3]. These are concrete mechanisms; the social analogy is not their scientific justification.

[DERIVED] **Cost.** Graph validation/topological ordering takes $O(|\mathcal V|+|\mathcal E|)$ for explicit finite dependencies. Role contexts and artifact copies add token/storage work. Conflict discovery over naive pairwise read/write sets can be quadratic in node count; resource-indexed representations can reduce comparisons depending on the domain. Preparation, verification and merge must be counted alongside worker tokens, tool calls and latency. Eq. 54.1 is an analysis boundary, not a substitute for observed server schedules.



```figure
{
  "id": "fig-54.4",
  "kind": "diagram",
  "title": "Decompose with checked interfaces",
  "caption": "A task graph permits independent branches; authoritative interface and final checks remain on the accepted-task path.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.1",
  "alt": "The typed task graph forks into two independent workers. Their artifacts join at interface checks, then an independent final acceptance gate returns a verified task or explicit partial/failure outcome.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "Task and authority"
      },
      {
        "id": "b",
        "kind": "branch",
        "label": "Typed dependency graph"
      },
      {
        "id": "c1",
        "kind": "process",
        "label": "Independent worker A"
      },
      {
        "id": "c2",
        "kind": "process",
        "label": "Independent worker B"
      },
      {
        "id": "d",
        "kind": "boundary",
        "label": "Join and interface checks"
      },
      {
        "id": "v",
        "kind": "branch",
        "label": "Final task / policy checks"
      },
      {
        "id": "e",
        "kind": "metric",
        "label": "Accepted task"
      },
      {
        "id": "stop",
        "kind": "state",
        "label": "Partial / failed / unknown"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c1"
      },
      {
        "from": "b",
        "to": "c2"
      },
      {
        "from": "c1",
        "to": "d"
      },
      {
        "from": "c2",
        "to": "d"
      },
      {
        "from": "d",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e",
        "label": "passes"
      },
      {
        "from": "v",
        "to": "stop",
        "label": "fails / unresolved"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 54.1 — Bounded dependency-aware delegation.** [DERIVED] Inputs are a finite graph, task contract, verified authority, positive integer slot limit, durable budget/deadline and bounded worker contracts. Output is a verified task artifact or a complete partial/failed graph record.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateGraphInterfacesAuthorityAndAcyclicity};
\quad\operatorname{Invalid}\Rightarrow\operatorname{RejectAndStop}.\\
2.&\quad J\leftarrow\operatorname{LoadDurableTaskJournalOrCreate};\quad \operatorname{ReserveSynthesisAndVerificationBudget};\quad \operatorname{Unavailable}\Rightarrow\operatorname{ReturnPartial};
\quad\operatorname{ReconcileInFlightEffects}(J).\\
3.&\quad \mathcal R\leftarrow\{i:\operatorname{AllPredecessorsValidated}(i)
\land\operatorname{OwnershipAvailable}(i)\land\operatorname{NotDispatched}(i)\}.\\
4.&\quad \operatorname{AtomicallyReserveBudgetAndOwnership}_{\le m_{\rm slots}-m_{\rm active}}(\mathcal R);
\quad\operatorname{DispatchPreparedWorkers};\\
 &\quad \operatorname{NoReadyOrRunningWork}\Rightarrow\operatorname{GoTo}(7).\\
5.&\quad \operatorname{ObserveBoundedWorkerEvents};
\quad\operatorname{ValidateArtifactsAndPersistTerminalOrUnknownState};\\
 &\quad \operatorname{FailedPredecessor}\Rightarrow\operatorname{MarkDependentWorkBlocked}.\\
6.&\quad \operatorname{BudgetOrDeadlineReached}\Rightarrow
\operatorname{SignalCancellationAndReconcileWithinRemainingBound};\\
 &\quad \operatorname{Otherwise}\Rightarrow\operatorname{GoTo}(3).\\
7.&\quad \operatorname{SynthesizeOnlyValidatedInputs};
\quad\operatorname{CheckOriginalTaskPostcondition};\quad\operatorname{Return}(J,\mathrm{outcome}).
\end{aligned}
$$

[DERIVED] Invariants are finite graph/budget, explicit blocked dependencies, durable reservations, qualified worker authority and no unchecked artifact promoted to task success. Empty graphs still require checking the original postcondition. Late worker completion and cancellation cannot authorize a second conflicting effect. Missing output or exceeded limits remain failures/unknowns in the record.

## Implementation

[DERIVED] Separate planner output from the executable graph. Parse and validate the graph before spawning workers; retain versioned input/output artifacts. Give each worker the minimum sufficient context plus original constraints needed to detect plan omissions. Isolation should cover writable artifacts and credentials, not merely a separate chat history.

[OFFICIAL-DOCUMENTATION] LangGraph persistence records checkpoints and task-related state; the inspected documentation distinguishes successful pending writes from unfinished work during recovery [R54.15, Checkpoints/Pending writes]. Such facilities can support a coordinator, but they do not by themselves enforce task decomposition quality or external-effect atomicity. The pinned source inspection in R54.14 supports only narrow state/update interfaces.

## Experimental design

### Reported experiments

[PAPER-REPORTED] MetaGPT evaluates HumanEval, MBPP and SoftwareDev; its SoftwareDev comparison selects seven tasks from a seventy-task collection, and its role ablation uses two tasks [R54.2, §§4.1/4.4/Table 3]. These protocols are informative about the disclosed workflow, but small selected engineering tasks do not establish broad specialist-role benefit or budget-matched superiority.

[PAPER-REPORTED] R54.4 compares five architectures across four benchmarks and nine model configurations. Its main text describes matched maximum iterations and later matched tokens, while Appendix E.2 lists differing per-architecture caps [R54.4, §4.1/§4.2/Appendix E.2]. Equal realized compute therefore requires inspecting actual traces; the stated fairness goal is not a proven identity of tokens, calls or latency.

## Observations

**What the paper claims.** [PAPER-REPORTED] Structured roles and coordination can improve some tasks, while R54.4 reports strong domain dependence [R54.2; R54.4].

**What the evidence shows.** [PAPER-REPORTED] The experiments use specific tasks, workflows, model settings and resource controls; some decompositions degrade state-dependent tasks.

**What we infer.** [DERIVED] Useful decomposition depends on validated interfaces, independent work and total coordination cost, with a strong single-agent alternative included.

**What remains unknown.** [UNVERIFIED] No local graph, worker configuration or accepted-task latency/quality experiment was executed.



```figure
{
  "id": "fig-54.5",
  "kind": "stat-panel",
  "title": "Scientific boundaries to retain",
  "caption": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.1",
  "alt": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "spec": {
    "header": "CLAIM BOUNDARY",
    "rows": [
      {
        "key": "parallelism",
        "value": "Independent admissible branches"
      },
      {
        "key": "span",
        "value": "Dependencies plus interfaces"
      },
      {
        "key": "synthesis",
        "value": "Reserved before dispatch"
      },
      {
        "key": "claim",
        "value": "Bound differs from achieved time"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

[DERIVED] Artificial splitting creates coordination without reducing span; detect it through dependency and time traces. Plan omission drops task requirements; retain original-condition coverage. Role theater changes labels without differentiated evidence; compare actual contexts/tools. Hidden shared state creates conflicts; declare read/write domains. A blocked predecessor is silently ignored; enforce dependency validity. Unbudgeted synthesis spends resources after workers exhaust the cap; reserve merge/verification capacity.

## Siblings

[DERIVED] Independent ensembles, pipeline specialists and planner/worker systems solve different problems. Ensembles repeat alternatives; pipelines transform dependent artifacts; planner/worker systems allocate heterogeneous subtasks. Compare at equal authority, total resource budgets and task acceptance. Chapter 38 owns test-time search/verification; Chapters 52–53 own controller and persistent-state foundations.

## Extensions

### Improvements

[DERIVED] Structured interfaces, executable feedback and explicit conflict edges improve the information available to a coordinator. Their value requires matched ablations rather than attributing all gains to agent count. Open research is learning decomposition policies that predict useful independence and merge risk before execution. Settling evidence requires held-out task families, rejected decompositions and equal-budget single-agent alternatives.

## Limitations

[DERIVED] Duration and failure probabilities are workload-dependent, not known constants. A static DAG does not fully describe adaptive search; bounded unfolding can grow quickly and omit distribution shifts. Eq. 54.3 is conditional on complete interface correctness. No dependency graph proves semantic task completeness or secure execution.

## Reproducibility

[UNVERIFIED] Preserve task/graph/role versions, model/context/tool differences, artifact hashes, budgets, scheduling/events and final task checks. Proposed decomposition ablations live in verification.md. All current claims are derived or source-reported; no original agent run occurred.

## References

[PAPER-REPORTED] [R54.2](references.md#r54-2) MetaGPT; [R54.4](references.md#r54-4) controlled architectures. [OFFICIAL-DOCUMENTATION] [R54.8](references.md#r54-8), [R54.14](references.md#r54-14) persistence/state interfaces. Access 2026-10-14.
