---
id: ms.section.52.4
entity_type: section
title: Adaptive execution
volume: 3
part: 9
chapter: 52
section: 52.4
slug: 52-4-adaptive-execution
parent: ms.chapter.52
prev_sibling: ms.section.52.3
next_sibling: ms.section.52.5
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

# 52.4 — Adaptive execution

## Scope

[DERIVED] Adaptive execution changes a plan when new evidence invalidates assumptions or alters the feasible continuation. We cover replanning, grounded reflection, substitution, escalation and uncertainty-aware stopping. The baseline follows the original plan after its premises become false. Success preserves verified progress and hard constraints while choosing a bounded next action; it does not require endless continuation.

## Why this exists

[DERIVED] A plan can be valid at construction and invalid at execution. Inventory changes, credentials expire, a tool returns an unexpected value or a user refines the goal. Blind continuation compounds error. Blind restart discards valid progress and can duplicate effects. Adaptation must identify what changed and which downstream decisions depend on it.

[PAPER-REPORTED] Reflexion uses an actor, evaluator and verbal reflection stored for subsequent trials; it changes prompt context rather than applying a gradient update to model weights [R52.10, §3]. LATS combines reflection with search and environment feedback [R52.4, §§3–4]. [DERIVED] These are mechanisms for conditioning future proposals on feedback. They do not make the feedback correct or establish convergence to a valid plan.

[DERIVED] The dominant constraint is distinguishing a new observation from an unsupported explanation. A reflection that invents a cause can make the next attempt more systematically wrong. Useful adaptation requires an evidence delta and a defined effect boundary.

## Intuition

[DERIVED] Replanning is a controlled graph edit. Preserve nodes whose required inputs and effects remain established; invalidate nodes whose premises changed; regenerate only a continuation that remains compatible with committed effects. The new plan should reference actual state, not a hypothetical restart state.

[DERIVED] Tool substitution is semantic refinement. Matching a name or JSON schema is insufficient: a replacement may search a different population, apply a different unit convention or create a stronger side effect. The substituting action must satisfy the original step's obligations under the current context.

## Formulation

> **Definition — Plan repair closure.** [DERIVED] Nodes affected by a changed premise together with their downstream evidence dependencies; already committed effects remain separately recorded.

| Local symbol | Meaning |
|---|---|
| $\Delta e_t$ | Newly validated evidence or explicit invalidation event |
| $\mathcal D_t=(V_t,E_t)$ | Current finite plan dependency graph |
| $J_t$ | Nodes directly affected by changed premises |
| $\operatorname{Desc}(J_t)$ | Their downstream dependency closure |
| $P_a,Q_a$ | Original action pre/postconditions |
| $P_b,Q_b$ | Replacement action pre/postconditions |
| $\mathcal H_t$ | Currently supported context conditions |
| $\mathcal O_t$ | Finite admissible controller options |
| $U(o),\widehat U(o)$ | True modeled expected utility and its estimate |
| $\varepsilon_u\ge0$ | Uniform utility estimation error bound |

[DERIVED] A conservative invalidation set is

$$
\mathcal I_t=J_t\cup\operatorname{Desc}_{\mathcal D_t}(J_t).
$$
*(Eq. 52.15)*

Computing the closure by graph traversal takes $O(|V_t|+|E_t|)$ worst-case time. This marks unsupported future use; it does not erase already committed external effects.

[DERIVED] A sufficient contract for replacing $a$ by $b$ is

$$
\mathcal H_t\land P_a\Rightarrow P_b,\qquad
\mathcal H_t\land Q_b\Rightarrow Q_a,
$$
*(Eq. 52.16)*

together with preserved authorization, effect restrictions, units, entity scope and resource feasibility. Conditions must be interpreted over the same relevant state and result boundary. A stronger postcondition is useful only if its additional effects remain permitted.

[DERIVED] For options continue, replan, substitute, escalate and stop, define

$$
U(o)=
\mathbb E[\operatorname{GoalValue}(o)
-\operatorname{ResourceCost}(o)
-\operatorname{RiskLoss}(o)\mid e_t],
\qquad o\in\mathcal O_t.
$$
*(Eq. 52.17)*

Utility terms need compatible declared units, or a stated multiobjective ordering. Hard constraints determine eligibility before utility comparison; an expected benefit cannot authorize a forbidden action.

[MATHEMATICALLY-DERIVED] If $|U(o)-\widehat U(o)|\le\varepsilon_u$ for every admissible option, and $\hat o$ maximizes $\widehat U$, then

$$
U(o^*)-U(\hat o)
\le
[U(o^*)-\widehat U(o^*)]
+[\widehat U(\hat o)-U(\hat o)]
\le2\varepsilon_u.
$$
*(Eq. 52.18)*

The middle estimated-utility difference is nonpositive. This bound requires a valid uniform error assumption; a model's self-reported confidence does not supply one.

[DERIVED] A conservative continuation gate against a stop option is

$$
\widehat U(o)-\varepsilon_u>
\widehat U(\text{stop})+\varepsilon_u.
$$
*(Eq. 52.19)*

Failure of this inequality does not prove stopping is optimal. It says the declared estimates cannot establish a positive advantage at this uncertainty level.

## Mechanism

### Methodology

[DERIVED] Replanning begins with a discrepancy record: expected observation, actual observation, source revision, affected assumption and committed effect frontier. Classify the event before changing control. A transient transport failure, semantic contradiction, denied permission and changed user objective require different responses. The classifier can be model-assisted, but its verdict must retain raw evidence and an unresolved state when confidence is insufficient.

[DERIVED] Bind evidence dependencies to individual plan nodes. A price change invalidates a budget calculation and dependent purchase step without necessarily invalidating identity verification. A revoked credential may invalidate all future calls under that principal. A completed write cannot simply be removed from the plan graph; it becomes part of the starting state for the continuation or enters compensation. This is why Eq. 52.15 is an evidence invalidation rule rather than rollback.

[PAPER-REPORTED] Reflexion generates a verbal summary from trajectory and evaluator feedback, retains a bounded number of experiences, and conditions the actor's next trial on them [R52.10, §3]. [DERIVED] A grounded reflection should separate observed failure from causal hypothesis. “The API rejected version 7 because current version is 8” has a receipt. “The tool is unreliable” is a broader inference. Reflection should propose a falsifiable change, such as refresh-and-compare, rather than manufacture unsupported state.

[DERIVED] New evidence is required for changing factual beliefs; new reasoning can also expose a logical inconsistency in existing evidence. These should be tagged differently. Repeatedly paraphrasing the same failure is not independent support. Retain contradiction links so a later successful result can invalidate an old hypothesis. Detailed memory retention and consolidation belong to [Chapter 53](../ch53-agent-memory-persistent-state-and-long-horizon-consistency/README.md).

[DERIVED] Substitution first determines whether the original failure is local to the tool or indicates that the task precondition is false. An alternate search endpoint can help after an outage; it cannot create inventory that no authorized provider has. Evaluate Eq. 52.16 using the actual replacement contract. Compare retrieval population, pagination, freshness, identifier namespace, units, consistency and effect semantics. Revalidate the replacement immediately before dispatch.

[DERIVED] A multi-step replacement is a subplan with the same entry/exit obligations. It may consume more steps and expose intermediate effects, so allocate a sub-budget and verify each transition. A syntactically valid chain of datatype conversions may not preserve business meaning. Only schema-compatible substitutions are easy to enumerate; semantic equivalence is a separate claim.

[PAPER-REPORTED] ToolMaze constructs alternative direct and multi-hop paths in a simulated DAG and distinguishes explicit from implicit failures [R52.2, §§3.2–3.4]. [DERIVED] That permits controlled tests of substitution and anomaly detection, while its enumerated alternatives remain bounded by the constructed world. A production environment can have hidden side effects and alternatives absent from the simulator.

[DERIVED] Escalation transfers a bounded unresolved decision to a specified authority or specialist. The request contains current state, evidence, failed options, remaining budget and permitted actions. It must have a response deadline and a fallback terminal status. During transfer, ownership of external effects must remain unique; a paused original controller cannot later commit after a successor takes over. The fencing boundary is developed in Chapter 47 and the logical retry ledger in [Section 46.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch46-admission-control-routing-autoscaling-and-service-contracts/46-5-resilience.md).

[DERIVED] Uncertainty-aware stopping distinguishes lack of evidence from impossibility. If the controller cannot establish safe action preconditions, it may stop with partial progress even when an unknown valid path exists. A finite search failure says “unresolved within these resources,” not “unsatisfiable.” If a valid hard critic proves infeasibility under the current model, report that model and horizon. A revoked permission is a terminal policy condition rather than an invitation to find an equivalent unauthorized route.

[DERIVED] Adaptation costs include discrepancy detection, evidence refresh, invalidation traversal, extra model proposals, critic calls and discarded work. Whole-plan regeneration can repeatedly serialize irrelevant history; local repair can miss unrecorded dependencies. Hierarchical repair reduces prompt size only if subgoal interfaces are adequate. Network and verifier latency can dominate model generation. The cited sources do not disclose a shared hardware/precision baseline that converts these costs into a universal speed claim.

```figure
id: fig-52.12
kind: diagram
title: "Evidence delta to bounded plan repair"
caption: "Changed evidence invalidates dependent future nodes while receipts preserve committed effects. Repair, escalation and stopping are distinct exits."
placement: inline
evidence: DERIVED
source: DERIVED:eq-52.15
alt: "New validated evidence and the old plan feed dependency invalidation. The committed effect frontier is preserved. Admissible choices branch to repair and typed verification, fenced escalation, or truthful partial stopping."
spec:
  direction: LR
  nodes:
    - {id: delta, kind: state, label: "Validated evidence delta"}
    - {id: old, kind: state, label: "Current plan"}
    - {id: closure, kind: process, label: "Invalidate dependency closure"}
    - {id: receipts, kind: memory, label: "Committed effect receipts"}
    - {id: choice, kind: branch, label: "Admissible continuation"}
    - {id: repair, kind: process, label: "Repair / substitute"}
    - {id: verify, kind: process, label: "Typed verification"}
    - {id: next, kind: process, label: "One admitted next step"}
    - {id: escalate, kind: state, label: "Fenced handoff + expiry"}
    - {id: stop, kind: state, label: "Partial / unresolved stop"}
  edges:
    - {from: delta, to: closure}
    - {from: old, to: closure}
    - {from: closure, to: choice}
    - {from: receipts, to: choice, kind: dependency}
    - {from: choice, to: repair}
    - {from: repair, to: verify}
    - {from: verify, to: next}
    - {from: verify, to: stop}
    - {from: choice, to: escalate}
    - {from: choice, to: stop}
```

## Algorithm

[DERIVED] **Algorithm 52.4 — Bounded evidence-conditioned adaptation.** Inputs are current plan/effect ledger, validated discrepancy, finite option set and durable adaptation cap $K_r\ge1$. Outputs are a verified continuation or terminal/escalated status. Every dispatch uses the admission and effect protocol; all terminal operators return after final accounting. Reserve final verification and reconciliation capacity separately.

$$
\begin{aligned}
1.\;&\operatorname{AtomicReserveRepairUnderCapAndOwnership}
=\text{fail}\Rightarrow\operatorname{Finish}(\text{exhausted/ownership lost}).\\
2.\;&\Delta e\leftarrow\operatorname{ValidateDiscrepancyAndFreshness};
\quad\Delta e=\text{unresolved}\Rightarrow\operatorname{Finish}(\text{uncertain}).\\
3.\;&\mathcal I\leftarrow J\cup\operatorname{Desc}(J);
\quad\operatorname{MarkUnsupportedFutureNodes}(\mathcal I);
\quad\operatorname{RetainEffectReceipts}.\\
4.\;&\mathcal O\leftarrow
\operatorname{AdmissibleOptions}(\text{current state},\text{policy},\text{remaining budget}).\\
5.\;&\mathcal O=\varnothing\Rightarrow\operatorname{Finish}(\text{no admissible continuation}).\\
6.\;&o\leftarrow\operatorname{BoundedSelect}(\mathcal O);
\quad o=\text{stop}\Rightarrow\operatorname{Finish}(\text{partial/unresolved}).\\
7.\;&o=\text{escalate}\Rightarrow
\operatorname{PersistFencedHandoffAndDeadline};
\ \operatorname{ReturnSuspended}.\\
8.\;&p'\leftarrow\operatorname{BoundedRepair}(o,\Delta e,\text{committed frontier});
\quad\mathbf v\leftarrow\operatorname{PropertyIndexedVerifyContinuation}(p');\\
&\mathbf v\text{ has failed required property}
\Rightarrow\operatorname{Finish}(\text{repair rejected});
\quad\mathbf v\text{ has unknown/missing/unsupported required property}
\Rightarrow\operatorname{Finish}(\text{repair unresolved}).\\
9.\;&\operatorname{PersistPlanRevision}(p');
\quad\operatorname{ReturnNextAdmittedStep}(p').
\end{aligned}
$$

[DERIVED] Suspended is a durable non-success status with an expiry handler, not an infinite running loop. The next step is revalidated on resume. Repair attempts count even if the proposal is malformed or the replacement times out. The algorithm guarantees a finite local decision under its bounds, not eventual recovery.

## Implementation

[OFFICIAL-DOCUMENTATION] LangGraph interrupts resume using the same thread identity and restart the interrupted node from its beginning; the documentation therefore requires idempotent side effects before an interrupt [R52.13, “Resuming interrupts” and “Rules of interrupts”]. [DERIVED] An escalation node must not repeat an unprotected write while reconstructing its local state.

[DERIVED] This outside-stack implementation illustrates control plumbing; no numbered stack system implements semantic substitution or calibrated utility automatically. Keep plan versions, discrepancy records and effect receipts in durable state. Large raw observations can be stored separately with immutable references, but the referenced bytes and access policy must remain available for verification. A summary alone cannot reconstruct the failed precondition.

## Experimental design

### Reported experiments

[PAPER-REPORTED] LATS's GPT-3.5 HotpotQA ablation uses 100 questions and compares ReAct-based LATS 0.63 with no reflection 0.58, DFS 0.42 and no LM heuristic 0.37 [R52.4, Table 8, §5.1]. The study's correctness feedback and branching are part of the intervention; it does not isolate reflection at identical token cost.

[PAPER-REPORTED] ToolMaze's 400 base tasks become 2,000 instances across clean and four perturbation modes, with 25 steps, temperature 1 and a 16k-token cap [R52.2, §4.1]. For Claude Sonnet 4-6, explicit-transient TSR changes 49.00→75.50 with a failure-aware hint, while implicit-transient TSR changes 5.75→27.75 [R52.2, Table 2]. These are simulated-task rates under different prompts, not transaction reliability or a universal stopping policy.

## Observations

**What the paper claims.** [PAPER-REPORTED] Reflection/search and failure awareness can improve adaptive behavior in their respective environments [R52.4, §5; R52.2, §4.2].

**What the evidence shows.** [PAPER-REPORTED] Removing LATS reflection reduces its reported result; ToolMaze's implicit-failure rate remains far below its explicit-failure rate even with hints.

**What we infer.** [DERIVED] Detecting that feedback is wrong is a different problem from choosing another tool after an explicit error. Additional reasoning requires an informative checking channel.

**What remains unknown.** [UNVERIFIED] Utility calibration, semantic substitution under changing contracts and safe escalation across real service ownership boundaries were not measured.

## Failure modes

> **Failure mode — Reflection invents a repair premise.** [DERIVED] *Symptom:* later calls use a value absent from any trusted receipt. *Cause:* a causal explanation is treated as an observation. *Detection:* require provenance for every substituted input. *Mitigation:* retain hypothesis status and obtain an independent check.

[DERIVED] Other failures include replacing a tool with different side effects, invalidating too little of a plan, restarting from a hypothetical clean state and allowing two escalated owners to commit.

## Siblings

[DERIVED] Reactive action selection changes the next action without an explicit plan edit. Replanning changes a continuation graph. Reflection changes proposal context. Substitution changes the implementation of a step. Escalation changes decision authority. Stopping changes the terminal contract. They should be separately observable even when one controller combines them.

## Extensions

### Improvements

[PAPER-REPORTED] LATS adds evaluated search to single-trajectory agents; Reflexion adds remembered feedback; ToolMaze makes failure type and alternative-path structure explicit [R52.4, §4; R52.10, §3; R52.2, §3]. [DERIVED] Each improves a different component of adaptation and adds compute, state or evaluation burden. No source establishes that more reflection always helps.

## Limitations

[DERIVED] A substantive open question is how to detect semantically plausible but incorrect observations before they contaminate a long continuation. Evidence requires independent state truth and controlled corruption that preserves superficial schema validity. Prompt confidence and repeated self-agreement cannot settle this question.

## Reproducibility

[UNVERIFIED] Preserve discrepancy timing, old/new plan graphs, evidence dependencies, all options considered, substitution contracts, critic results, ownership epoch, escalation deadline and unsuccessful repairs. No adaptive controller was run for this edition.

```figure
id: fig-52.13
kind: calculator
title: "Continuation advantage under uniform uncertainty"
caption: "Illustrative utility units must be consistent. A positive lower advantage supports continuation under the assumed uniform error bound; a nonpositive value does not prove stopping optimal."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-52.19
alt: "The conservative continuation advantage subtracts twice the uniform estimation error from the estimated utility difference."
states:
  - {anchor: formulation, label: "Utility", note: "Use one declared utility scale; hard constraints gate options first."}
  - {anchor: mechanism, label: "Decision", note: "Positive lower advantage is conditional on a valid error bound."}
  - {anchor: failure-modes, label: "Unknown", note: "A verbal confidence score does not supply a uniform bound."}
spec:
  tex: "\\widehat U(o)-\\widehat U(\\mathrm{stop})-2\\varepsilon_u"
  equation: "52.19"
  inputs:
    - {symbol: cont, label: "estimated continuation utility", default: 5, min: -20, max: 20, format: fixed2}
    - {symbol: stop, label: "estimated stop utility", default: 3, min: -20, max: 20, format: fixed2}
    - {symbol: error, label: "uniform utility error bound", default: 1, min: 0, max: 10, format: fixed2}
  outputs:
    - {symbol: result, label: "lower advantage in utility units", formula: "cont-stop-2*error", format: fixed2}
```

```figure
id: fig-52.14
kind: stat-panel
title: "Semantic substitution obligations"
caption: "A matching schema is insufficient when the replacement changes entity scope, units, authorization or effects."
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-52.15
alt: "A replacement must be applicable under the original supported context, imply the original promised result, and preserve effect and authorization restrictions."
spec:
  header: CONTRACT BOUNDARY
  rows:
    - {key: "entry", value: "context implies applicability"}
    - {key: "exit", value: "result satisfies original obligation"}
    - {key: "effects", value: "permissions and effects preserved"}
```

## References

[R52.2](references.md#r52-2), [R52.4](references.md#r52-4), [R52.10](references.md#r52-10), [R52.13](references.md#r52-13).
