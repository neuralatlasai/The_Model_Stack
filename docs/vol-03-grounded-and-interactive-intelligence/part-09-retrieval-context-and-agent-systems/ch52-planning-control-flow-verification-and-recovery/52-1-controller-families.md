---
id: ms.section.52.1
entity_type: section
title: Controller families
volume: 3
part: 9
chapter: 52
section: 52.1
slug: 52-1-controller-families
parent: ms.chapter.52
prev_sibling: null
next_sibling: ms.section.52.2
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

# 52.1 — Controller families

## Scope

[DERIVED] We compare deterministic workflows, reactive loops, plan–execute controllers, search and hierarchical decomposition as execution structures. The objective is verified goal attainment within an explicit tool, model, time and effect budget. The baseline is a fixed workflow with the same available tools. General inference-time search theory belongs to [Chapter 38](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/README.md); here the question is how a controller couples proposals to observations and committed external actions.

## Why this exists

[DERIVED] A model-generated sequence is not yet an executable plan. It may reference an unavailable result, choose an unauthorized action or assume an effect that did not occur. Adding a loop exposes fresh observations but also creates opportunities for repetition, state drift and unbounded spending. The architecture determines where uncertainty is resolved and which mistakes can be detected before external commitment.

[PAPER-REPORTED] ReAct augments environment actions with language actions that update the agent's context without changing the external environment [P41, §2]. ReWOO instead separates plan generation, worker evidence collection and final solving [R52.5, §2.1]. These are different locations for conditioning on observations, not different guarantees of correctness.

[OFFICIAL-DOCUMENTATION] Anthropic distinguishes predefined workflows from agents that choose their own process and tools, and describes routing, parallelization and orchestrator–worker patterns [R52.3, “Workflows vs. agents” and “Building blocks”]. This first-party design account does not provide a controlled universal ranking. [DERIVED] The dominant constraint is the availability and cost of trustworthy feedback at each decision boundary.

## Intuition

[DERIVED] Separate three objects: a proposal, an execution authorization and an observed effect. A controller may produce the first using a language model, a graph rule or symbolic search. A validator decides whether the second follows from current evidence and policy. The environment determines the third. Conflating these objects lets a persuasive plan become an unsupported state update.

[DERIVED] Controller families distribute computation across this boundary. A fixed graph moves decisions into development. A reactive loop makes decisions after each observation. A planner amortizes coordination across several future steps. Search spends additional proposals and evaluations before choosing. Hierarchy restricts local decisions using subgoal contracts. Hybrid controllers combine these choices at different levels.

## Formulation

> **Definition — Controller family.** [DERIVED] The execution structure determining how a proposal depends on observations, plan state, search branches and delegated subgoals.

| Local symbol | Contract |
|---|---|
| $h_t$ | Recorded observations, proposals, calls and receipts through decision $t$ |
| $\xi_t$ | Controller state, including plan, budgets and effect ledger |
| $a_t$, $o_{t+1}$ | Proposed external action and resulting observation |
| $\Pi_c$, $\mathcal V$ | Controller proposal rule and execution validator |
| $n_a,n_i$ | Nonnegative integer counts of external attempts and model invocations, respectively |
| $n_p,n_e$ | Positive integer prefix tokens and fixed nonnegative tokens appended before each later invocation in the replay model |
| $w_s,h_s$ | Positive integer search branching cap and nonnegative integer search depth |
| $\ell_v$ | Nonnegative elapsed duration of graph node $v$, seconds |

[DERIVED] A family-independent contract is

$$
a_t\sim\Pi_c(\cdot\mid \xi_t,h_t),\qquad
\operatorname{Permit}_t=\mathcal V(a_t,\xi_t,h_t),\qquad
(\xi_{t+1},h_{t+1})=\operatorname{Record}(a_t,o_{t+1},\operatorname{Receipt}_{t+1}).
$$
*(Eq. 52.1)*

The last update occurs after bounded dispatch and reconciliation; a rejected proposal has no external effect. Language reasoning can change the proposal state but cannot create an environment receipt.

[MATHEMATICALLY-DERIVED] If each of $n_i$ model invocations replays a prefix of $n_p$ tokens and all preceding records, each of fixed length $n_e$, then total input tokens are

$$
N_{\rm replay}=\sum_{j=0}^{n_i-1}(n_p+jn_e)
=n_in_p+\frac{n_i(n_i-1)}2n_e.
$$
*(Eq. 52.2)*

This identity counts input tokens at the invocation boundary. Prefix caching, attention implementation, variable record lengths and provider billing can change compute, traffic and price; it is not a quadratic FLOP or latency theorem.

[MATHEMATICALLY-DERIVED] A full bounded search tree contains at most

$$
N_{\rm tree}\le \sum_{j=0}^{h_s}w_s^j
=\begin{cases}
h_s+1,&w_s=1,\\
(w_s^{h_s+1}-1)/(w_s-1),&w_s>1.
\end{cases}
$$
*(Eq. 52.3)*

For a nonempty workflow DAG under unlimited workers and fixed node durations, execution without resource contention has makespan at least its critical path:

$$
\ell_{\rm graph}\ge \max_{p\in\operatorname{Paths}}\sum_{v\in p}\ell_v.
$$
*(Eq. 52.4)*

Equality requires an appropriate earliest-start schedule and no additional queuing, synchronization or communication delays.

## Mechanism

### Methodology

[DERIVED] A deterministic workflow defines nodes, guards and edges before a request arrives. Deterministic refers to control decisions given identical validated inputs, not to stochastic model outputs inside a node. The graph admits static dependency checking, explicit failure edges and restricted effects. It becomes brittle when an unmodeled case requires a different tool sequence. An exception branch is therefore part of the architecture, including what happens when no branch matches.

[PAPER-REPORTED] ReAct prompts a frozen model with trajectories containing reasoning, actions and observations. Its knowledge tasks alternate reasoning and API calls; longer interactive tasks allow reasoning sparsely [P41, §§2–4]. [DERIVED] Reactive execution reduces the interval between evidence arrival and the next decision. It does not automatically preserve a goal inventory or prevent repeated calls. The controller must persist progress and distinguish new evidence from a rephrasing of its previous reasoning.

[PAPER-REPORTED] ReWOO's planner emits steps with named evidence variables. Workers substitute earlier results into dependent instructions, and a solver combines the resulting evidence [R52.5, §2.1]. [DERIVED] This representation exposes dataflow and can avoid repeated model processing of full observations during planning. Its hazard is committing to a tool structure before observing results. A dependency can be syntactically well formed while semantically invalid because an upstream result is absent, stale or erroneous. Independent workers can run concurrently only when their read/write effects and prerequisites permit it.

[PAPER-REPORTED] LATS uses tree selection, LM-generated expansions, value/self-consistency heuristics, environment simulation, reward backpropagation and reflection on failed trajectories [R52.4, §§3–4]. Its selection resembles an upper-confidence index,

$$
\operatorname{UCT}(v)=\overline q_v+
c_s\sqrt{\frac{\ln N_{\operatorname{parent}(v)}}{N_v}},
\qquad N_v>0,
$$
*(Eq. 52.5)*

where visit counts are dimensionless, $N_{\operatorname{parent}(v)}\ge1$, $\overline q_v$ is normalized search reward and $c_s\ge0$ has the same reward units. Unvisited nodes need an explicit exploration rule. [DERIVED] Adaptive sampling, learned heuristics and nonstationary textual states do not inherit a generic confidence guarantee merely from this expression. The source assumes environments can be reset or reverted for branching [R52.4, §3]. A production controller must branch in a simulator or read-only sandbox before committing real effects.

[DERIVED] Hierarchical decomposition replaces one large choice with subgoal contracts. A parent supplies an objective, admissible state boundary, effect permissions, evidence requirements and child budget. The child returns a typed result with receipts and unresolved conditions. The parent verifies that result before treating the subgoal as complete. A hierarchy without these return conditions merely distributes unverified prose.

[DERIVED] Budgets must compose: allocating each of $m$ workers the entire parent budget can multiply spending by $m$. Allocate disjoint reservations or charge a shared atomic counter. Child failure needs a parent policy for partial results, cancellation and compensation. Parallel decomposition is useful when subproblems have limited dependencies; interacting writes can serialize even apparently independent language tasks.

[DERIVED] Resource costs follow the actual decision structure. Workflows store $O(|V|+|E|)$ graph metadata. Reactive histories grow with observed tokens unless summarized or externally referenced. Plan–execute stores plan edges and evidence bindings; retained output bytes can dominate graph metadata. Search stores up to Eq. 52.3 nodes plus trajectories and verifier state, with model calls proportional to expanded nodes and sampling multiplicity. Hierarchy adds dispatch, result serialization and verification at every boundary. GPU FLOPs, energy and price remain configuration-dependent; the cited architectural studies do not disclose a common 2026 hardware-normalized comparison.

```figure
id: fig-52.3
kind: diagram
title: "Controller proposals and the shared effect gate"
caption: "Five proposal structures share one admission boundary. Search branches remain simulated until one current action passes validation and reservation; denied or unsupported proposals cannot dispatch."
placement: inline
evidence: DERIVED
source: DERIVED:eq-52.1
alt: "Workflow, reactive loop, plan-execute, search and hierarchy propose to a shared validator. Admission permits one external action; denial or unknown prerequisites lead to a blocked stop. Receipts return to durable controller state."
spec:
  direction: LR
  nodes:
    - {id: wf, kind: process, label: "Fixed workflow"}
    - {id: react, kind: process, label: "Reactive loop"}
    - {id: plan, kind: process, label: "Plan–execute"}
    - {id: search, kind: branch, label: "Sandbox search"}
    - {id: hier, kind: process, label: "Hierarchy"}
    - {id: gate, kind: process, label: "Validate and reserve"}
    - {id: blocked, kind: state, label: "Blocked / stop"}
    - {id: act, kind: process, label: "Dispatch one action", group: world}
    - {id: obs, kind: state, label: "Receipt / observation", group: world}
    - {id: state, kind: state, label: "Durable controller state"}
  edges:
    - {from: wf, to: gate}
    - {from: react, to: gate}
    - {from: plan, to: gate}
    - {from: search, to: gate}
    - {from: hier, to: gate}
    - {from: gate, to: act, label: "Admitted"}
    - {from: gate, to: blocked, label: "Denied / unknown"}
    - {from: act, to: obs}
    - {from: obs, to: state, kind: feedback}
    - {from: state, to: react, kind: feedback}
    - {from: state, to: plan, kind: feedback}
  groups:
    - {id: world, label: "External effect boundary"}
```

## Algorithm

[DERIVED] **Algorithm 52.1 — Bounded controller dispatcher.** Inputs are goal contract $G$, controller family $f$, tool schemas/policy $\mathcal T$, persistent state $\xi$, absolute deadline $d$ and integer decision cap $K_c\ge1$. Output is a receipt-bearing terminal status. Every $\operatorname{Finish}(z)$ below persists accounting, cancels or reconciles outstanding effects, releases unused reservations and returns; it never falls through. Calls, model proposals and validation have explicit timeouts. Proposal spending excludes a separately reserved final-check, reconciliation and cleanup allowance; its exhaustion stops further proposals.

$$
\begin{aligned}
1.\;&\xi\leftarrow\operatorname{LoadOrCreate}(G,\mathcal T,d,K_c);
\quad \text{new entry only: }j_c\leftarrow0.\\
2.\;&\operatorname{Terminal}(\xi)\Rightarrow
\operatorname{Finish}(\operatorname{StoredResult}(\xi)).\\
3.\;&(j_c\ge K_c)\lor(t_{\rm now}\ge d)
\Rightarrow\operatorname{Finish}(\text{budget/deadline}).\\
4.\;&\operatorname{AtomicReserveDecisionUnderCapAndOwnership}(\xi)=\text{fail}\Rightarrow\operatorname{Finish}(\text{exhausted/ownership lost});
\quad p\leftarrow\operatorname{BoundedPropose}_f(\xi).\\
5.\;&p=\text{invalid}\Rightarrow
\operatorname{RecordRejection};\ \operatorname{goto}3.\\
6.\;&p=\text{finish}\Rightarrow
\operatorname{Finish}(\operatorname{IndependentOutcomeCheck}(\xi)).\\
7.\;&a\leftarrow\operatorname{NextValidatedAction}(p,\xi);
\quad a=\varnothing\Rightarrow\operatorname{Finish}(\text{blocked}).\\
8.\;&\operatorname{AtomicReserveAttemptAndEffects}(a,\xi)=\text{fail}\Rightarrow\operatorname{Finish}(\text{capacity unavailable});
\quad o\leftarrow\operatorname{BoundedDispatchOrReconcile}(a).\\
9.\;&\xi\leftarrow\operatorname{PersistObservationAndReceipts}(o);
\quad \operatorname{goto}3.
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] Each nonterminal visit reserves one decision, so there are at most $K_c$ proposals across delivery and resume if the counter persists. Termination additionally requires bounded external waits and finite finalization. This does not prove goal attainment or effect safety; those require the predicates and effect protocol in Sections 52.2–52.5.

[DERIVED] Atomic reservation checks current ownership and the persisted cap, increments the durable counter on success and returns its updated value; otherwise it returns failure without dispatch. Final verification, reconciliation and cleanup use their protected allowance and may return unresolved when they cannot finish safely.

[DERIVED] The chapter-wide Finish convention is ownership-fenced: final accounting, publication and cancellation apply only to this owner's current epoch and reservations. If ownership was lost, Finish returns a local ownership-lost status without mutating the authoritative ledger, releasing a successor's reservations or cancelling its work. Every later algorithm uses this convention.

## Implementation

[OFFICIAL-DOCUMENTATION] LangGraph is outside the numbered reference stack, included through the plan's agent-controller anchor. Static inspection at commit ccb851effb7b4c6255add86dbeed577061475aff finds an out-of-steps branch in PregelLoop.tick and initialization from recursion_limit in synchronous/asynchronous entry [R52.14, _loop.py, tick and entry methods]. This establishes a narrow source property, not execution reliability or a persistent logical-request budget.

[DERIVED] The controller sits above the inference engine and tool transports. Model tensors, precision and kernels belong to the chosen backend; controller metadata is CPU/database state. Record tokenization, prompt serialization, caching and network boundaries because Eq. 52.2 counts requests rather than device operations. No indexed training-stack system is needed to define the controller, and adding one would not verify its effect semantics.

## Experimental design

### Reported experiments

[PAPER-REPORTED] ReAct uses PaLM-540B, six HotpotQA and three FEVER demonstrations and a Wikipedia search/lookup interface. Table 1 reports HotpotQA EM 27.4 for ReAct versus 25.7 Act and 29.4 CoT; FEVER accuracy is 60.9 versus 58.9 and 56.3 [P41, §§3.1–3.3]. These results demonstrate task dependence, not uniform superiority.

[PAPER-REPORTED] ReWOO evaluates GPT-3.5-turbo on 1,000 HotpotQA questions with six exemplars. Table 2 reports average tokens 1,986.2 versus ReAct's 9,795.1, judged accuracy 42.4 versus 40.8, but EM 30.4 versus 32.2 [R52.5, §§3.1–3.2]. The opposite movement of two quality measures matters.

[PAPER-REPORTED] LATS's 100-question HotpotQA study uses GPT-3.5, three examples, five sampled expansion nodes, 50 trajectories and maximum depth six; its LM/self-consistency score weight is 0.5. ReAct-based LATS reports EM 0.63 versus ReAct 0.32 with oracle answer-correctness feedback [R52.4, §5.1/Table 3, Appendix D.1]. This is additional inference computation with a particular evaluator, not an equal-cost controller comparison. Hardware, backend precision and complete uncertainty are not disclosed.

## Observations

**What the paper claims.** [PAPER-REPORTED] Interleaving feedback, decoupling planning and searching alternatives each address a different limitation [P41; R52.4–5, methods].

**What the evidence shows.** [PAPER-REPORTED] ReAct's gains differ by task; ReWOO reduces counted tokens while losing EM in the cited case; LATS gains with search and feedback.

**What we infer.** [DERIVED] Select the feedback boundary and resource envelope before selecting the architectural label. A cheaper controller can be useful without dominating every quality metric.

**What remains unknown.** [NOT-DISCLOSED] A common deployment, equivalent effects, full latency distributions and equal total model/verifier budgets are absent from these cross-paper comparisons.

## Failure modes

> **Failure mode — Search executes irreversible branches.** [DERIVED] *Symptom:* several mutually exclusive reservations or changes appear in the real system. *Cause:* simulated exploration is confused with execution. *Detection:* compare branch IDs with effect receipts. *Mitigation:* sandbox search, then validate and commit one selected branch.

[DERIVED] Other observable failures include graph exceptions with no terminal edge, repeated reactive actions, unresolved plan variables and worker results accepted without their evidence. Each requires a distinct trace field rather than a single “planner failed” category.

## Siblings

[DERIVED] Fixed workflows minimize runtime structural freedom. Reactive loops maximize immediate feedback. Plan–execute reduces repeated coordination. Search explicitly compares alternatives. Hierarchy limits local scope. These dimensions can coexist: a fixed outer workflow can host a bounded reactive subcontroller with a searched proposal.

## Extensions

### Improvements

[PAPER-REPORTED] Relative to interleaved ReAct, ReWOO changes when observations enter model reasoning; its token result supports that particular efficiency claim [R52.5, §3.2]. LATS changes single-trajectory execution into evaluated branching [R52.4, §4]. [DERIVED] Their additional failure boundaries are stale plans and search-evaluator error respectively. Neither removes the need for current-state checks.

## Limitations

[DERIVED] A genuine open question is when the value of additional planning exceeds its latency and evaluator cost under partial observability. Evidence would require controlled feedback availability and matched total budgets across controller structures. Architectural names alone do not specify an optimization objective.

## Reproducibility

[UNVERIFIED] Preserve prompts, task/effect schemas, model snapshots, decision and tool caps, timeouts, graph/plan versions, validator revision and complete unsuccessful traces. No controller, model API or search environment was executed for this edition.

```figure
id: fig-52.4
kind: calculator
title: "Repeated-history input tokens"
caption: "Illustrative equal-record-length replay model. Token growth counts model inputs; caching and engine kernels determine the corresponding physical work."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-52.2
alt: "Total replayed input tokens increase with invocation count and fixed appended record length, without asserting model FLOPs or latency."
states:
  - {anchor: formulation, label: "Replay model", note: "Fixed record length is required for this identity."}
  - {anchor: mechanism, label: "Architecture", note: "One external action can require several or no model invocations."}
  - {anchor: failure-modes, label: "Physical boundary", note: "Input token counts do not certify cache savings or speed."}
spec:
  tex: "N_{\\rm replay}=n_i n_p+n_i(n_i-1)n_e/2"
  equation: "52.2"
  inputs:
    - {symbol: calls, label: "model invocations", default: 8, min: 1, max: 100, format: integer}
    - {symbol: prefix, label: "prefix tokens", default: 1000, min: 1, max: 100000, format: integer}
    - {symbol: record, label: "tokens added per invocation", default: 200, min: 0, max: 10000, format: integer}
  outputs:
    - {symbol: result, label: "input tokens", formula: "calls*prefix+calls*(calls-1)*record/2", format: integer}
```

```figure
id: fig-52.5
kind: stat-panel
title: "Branching and commitment boundaries"
caption: "The proposal family changes exploration cost; it does not change who owns real effects."
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-52.1
alt: "Workflow branches execute declared guards, search branches require a resettable sandbox, and hierarchical workers share a global budget and effect ledger."
spec:
  header: CONTRACT BOUNDARY
  rows:
    - {key: "workflow", value: "predeclared failure edges"}
    - {key: "search", value: "resettable branches before commit"}
    - {key: "hierarchy", value: "shared budget and effect owner"}
```

## References

[P41](references.md#p41), [R52.3](references.md#r52-3), [R52.4](references.md#r52-4), [R52.5](references.md#r52-5), [R52.14](references.md#r52-14).
