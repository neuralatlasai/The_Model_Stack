---
id: ms.section.52.2
entity_type: section
title: State and constraints
volume: 3
part: 9
chapter: 52
section: 52.2
slug: 52-2-state-and-constraints
parent: ms.chapter.52
prev_sibling: ms.section.52.1
next_sibling: ms.section.52.3
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

# 52.2 — State and constraints

## Scope

[DERIVED] This section defines controller-visible state, latent world state, goals, action preconditions, budgets and stopping conditions. The baseline treats the latest model summary as the state. Success means that decisions use an explicit evidence boundary and that every exit distinguishes verified completion, safe abandonment, uncertainty, exhausted resources and unresolved effects. General memory policies are owned by [Chapter 53](../ch53-agent-memory-persistent-state-and-long-horizon-consistency/README.md).

## Why this exists

[DERIVED] A controller can complete its internal checklist while the external task remains unfinished. A payment acknowledgement may refer to a different account; a successful lookup may be stale; a timeout may follow a committed write. The model observes reports about state, not direct access to all state. Calling an inferred fact “current state” removes the uncertainty that the controller must manage.

[PAPER-REPORTED] The classical POMDP account separates state estimation from the action policy and updates a distribution over hidden states from actions and observations [R52.6, §§3.1–3.3, pp. 105–107]. [DERIVED] This is a useful formal reference, not evidence that a language-model summary implements Bayesian filtering. Most API agents lack a complete transition model and calibrated observation likelihoods.

[DERIVED] The dominant constraint is epistemic: which facts are established, for which revision and principal, with what unresolved alternatives? Budgets add a second constraint. A model may recommend another useful investigation even when no authorized time or action capacity remains.

## Intuition

[DERIVED] Maintain a ledger of claims with provenance rather than overwriting uncertainty with prose. “Tool returned success” is an observation. “Reservation exists with identifier r at revision v” is an interpreted claim. “User's requested itinerary is fully booked and policy compliant” is a goal conclusion requiring several claims. These levels require different checks.

[DERIVED] A stopping rule needs more than the absence of a next action. An empty admissible set can mean the goal is satisfied, evidence is missing, permission was revoked, or no feasible continuation remains under the current budget. These cases imply different outputs and recovery obligations.

## Formulation

| Local symbol | Meaning |
|---|---|
| $s_t\in\mathcal S$ | Latent world state |
| $\mu_t(s)$ | Belief probability over a finite modeled state space |
| $K_s(s'\mid s,a)$ | Modeled transition probabilities |
| $Z_o(o\mid s',a)$ | Modeled observation likelihood |
| $e_t$ | Evidence ledger with source, version, time and trust status |
| $P_a,Q_a$ | Action precondition and promised postcondition |
| $I(s),G(s)$ | Safety invariant and goal predicate |
| $\mathbf u_t,\mathbf c_t,\mathbf B$ | Nonnegative consumed, reserved and maximum resource vectors |
| $K_c,K_a$ | Positive integer decision and attempt caps |
| $d$ | Absolute request deadline |

[MATHEMATICALLY-DERIVED] For known $K_s,Z_o$, the finite-state Bayesian update is

$$
\mu_{t+1}(s')=
\frac{
Z_o(o_{t+1}\mid s',a_t)
\sum_sK_s(s'\mid s,a_t)\mu_t(s)}
{\sum_{\bar s}Z_o(o_{t+1}\mid \bar s,a_t)
\sum_sK_s(\bar s\mid s,a_t)\mu_t(s)}.
$$
*(Eq. 52.6)* — notation-adapted Bayes update from R52.6, §3.3.

The denominator must be positive. A zero denominator means the observation is impossible under the model; setting an arbitrary normalized belief would conceal model failure.

[DERIVED] A conservative modeled admissibility set is

$$
\mathcal A_t^{\rm robust}=
\{a:\operatorname{Authorized}(a,t)
\land \forall s\in\operatorname{supp}(\mu_t),P_a(s)
\land \mathbf u_t+\mathbf c_t+\widehat{\mathbf c}(a)\le\mathbf B\}.
$$
*(Eq. 52.7)*

Resource inequalities are componentwise, with matching units such as attempts, tokens, dollars and bytes. Worst-case reservations require upper bounds; estimates alone cannot enforce hard caps.

[MATHEMATICALLY-DERIVED] Suppose $I(s_0)$, every admitted action satisfies $P_a$, and the *actual* transition relation obeys

$$
I(s)\land P_a(s)\land K_{\rm actual}(s'\mid s,a)>0
\ \Rightarrow\ I(s').
$$
*(Eq. 52.8)*

Induction then preserves $I$ over all executed transitions. Checking this implication only in an inaccurate world model does not establish the actual premise.

[MATHEMATICALLY-DERIVED] With durable counters $j_c,j_a$ and a reservation before every corresponding attempt,

$$
0\le j_c\le K_c,\quad0\le j_a\le K_a,\qquad
\rho_t=K_c-j_c\in\mathbb N_0,
$$
*(Eq. 52.9)*

and every nonterminal controller cycle decreases $\rho_t$. This ranking argument bounds cycles, provided waits and finalization are bounded.

## Mechanism

### Methodology

[DERIVED] The goal contract specifies target entities, acceptable outcomes, prohibited side effects and the evidence required to declare completion. It must distinguish logical satisfaction from presentation: producing an answer string is different from updating a record, and updating one component of a compound request is different from completing the whole request. Record optional versus mandatory subgoals and the policy for partial success before execution.

[DERIVED] Observations carry an operation identity, request arguments, response revision, timestamp, principal and transport/effect status. Preserve raw responses alongside interpreted facts. Interpretation should not silently convert an empty response into a negative fact or a timeout into a failed effect. Unknown, absent, false, stale and denied are distinct states. A model can propose an interpretation; the controller attaches its support and confidence status.

[PAPER-REPORTED] PlanBench-XL records discovered tools and typed values with provenance in a constructed retail world. Retrieval maps alias-aware word, bigram and character-trigram hashes to a top datatype [R52.1, §§3.1–3.2, Appendix B.6]. [DERIVED] This is not general enterprise semantic retrieval; inspectable typed state does not prove semantic fidelity to an external business process.

[DERIVED] Preconditions have structural, semantic and temporal components. Structural checks validate argument types and required fields. Semantic checks establish that an identifier belongs to the requested entity and that the action is appropriate. Temporal checks bind the action to a current version or lease. Authorization is a hard predicate rather than a model preference. For changing state, a precondition checked before a long planning call can already be obsolete at dispatch.

[PAPER-REPORTED] PDDL2.1 distinguishes start, end and interval conditions for durative actions [R52.7, §5, pp. 71–73]. [DERIVED] The corresponding engineering issue is that some conditions must remain true while an operation runs. A read permission can be checked at return; a write may require version-checked commitment; a resource lease can expire mid-execution. The formal language does not itself provide these production guarantees.

[DERIVED] For a belief model, Eq. 52.7 may reject useful actions because an unlikely state remains in the support. A chance constraint can replace universal admissibility with $\Pr_{\mu_t}[\neg P_a]\le\delta$, but that is meaningful only if the modeled probabilities and failure events are calibrated for the operating distribution. A verbal confidence score is not such a probability. Hard policy boundaries remain hard even when the estimated benefit is high. For calibrated conditional per-step violation bounds $\delta_t$, the union bound gives trajectory violation probability at most $\sum_t\delta_t$; a per-step bound is not a horizon-independent guarantee.

[DERIVED] Evidence acquisition can itself be an action. A read-only query may narrow uncertainty without advancing a visible subgoal; a clarification may reveal the correct intent. Charge these operations to the same decision/time envelope. A zero-cost information assumption biases a planner toward unlimited investigation and hides actual latency, rate limits and privacy exposure.

[DERIVED] Budget accounting separates consumed resources from in-flight reservations. Reserve before dispatch, convert a reservation to measured consumption when known, and release only unused capacity. A failed or timed-out call still consumes an attempt and possibly billable tokens or external fees. Parallel workers must share atomic reservations. Persist logical-request caps across retries and resumptions; a per-process recursion limit is insufficient.

[DERIVED] Stopping has an ordered contract. First reconcile ambiguous effects that could change the reported outcome. Then independently check the goal. If it is established, return verified completion with receipts. If a hard condition is violated, stop effects and report that violation. If budget or deadline is reached, report exhausted capacity with committed partial progress. If the admissible set is empty because evidence is insufficient, return unresolved uncertainty or a bounded escalation. “No plan found” under a finite search cap is not a proof that no valid plan exists.

[DERIVED] A ledger with $n_f$ facts and $n_d$ dependency edges requires $O(n_f+n_d)$ metadata plus retained response bytes. Dense belief filtering costs $O(|\mathcal S|^2)$ per action/observation and $O(|\mathcal S|)$ belief storage; sparse transitions can reduce the arithmetic. Enumerating the state space is usually the limiting issue. Predicate checking depends on the evidence index and solver, not model parameter count. Hard caps on serialization bytes and model tokens prevent state growth from defeating the nominal action cap.

```figure
id: fig-52.6
kind: diagram
title: "Hidden state and evidence-aware admission"
caption: "Observations support claims about hidden state. Dispatch requires supported current preconditions, permission and durable capacity; failed or unknown hard gates block the action."
placement: inline
evidence: DERIVED
source: DERIVED:eq-52.7
alt: "Hidden world state produces an observation recorded in an evidence ledger. Preconditions, authorization and durable budgets jointly gate dispatch. All supported gates permit a bounded action; a failed, denied or unknown gate stops it."
spec:
  direction: LR
  nodes:
    - {id: world, kind: state, label: "Hidden world state", group: external}
    - {id: obs, kind: state, label: "Observed response", group: external}
    - {id: ledger, kind: memory, label: "Evidence + unknowns"}
    - {id: pre, kind: process, label: "Current preconditions"}
    - {id: auth, kind: process, label: "Authorization"}
    - {id: budget, kind: memory, label: "Durable budget"}
    - {id: gate, kind: branch, label: "All hard gates supported"}
    - {id: blocked, kind: state, label: "Blocked / clarify / stop"}
    - {id: act, kind: process, label: "Bounded action", group: external}
  edges:
    - {from: world, to: obs}
    - {from: obs, to: ledger}
    - {from: ledger, to: pre}
    - {from: pre, to: gate}
    - {from: auth, to: gate, kind: dependency}
    - {from: budget, to: gate, kind: dependency}
    - {from: gate, to: act, label: "Supported"}
    - {from: gate, to: blocked, label: "Failed / denied / unknown"}
    - {from: act, to: world, kind: feedback}
  groups:
    - {id: external, label: "External state and effects"}
```

## Algorithm

[DERIVED] **Algorithm 52.2 — Evidence-aware admission and stopping.** Inputs are persistent goal/evidence state, current policy, resource caps and deadline. Outputs are one admitted action or a terminal status. $\operatorname{Finish}$ follows Algorithm 52.1's return-and-account convention. An unresolved effect is reconciled with a bounded status query; absence of a safe reconciliation path terminates as ambiguous.

$$
\begin{aligned}
1.\;&(\xi,e,\mathbf u,\mathbf c,j_c,j_a)\leftarrow\operatorname{LoadDurableState}.\\
2.\;&\operatorname{AmbiguousEffects}(\xi)\ne\varnothing
\Rightarrow
\operatorname{ReconcileWithinBudgetOrFinishAmbiguous}.\\
3.\;&(j_c,j_a)\leftarrow\operatorname{ReloadDurableCounters};
\quad\operatorname{VerifiedGoalAndInvariantAndPublicationAuthority}(G,I,e,\text{current revision})
\Rightarrow\operatorname{Finish}(\text{complete}).\\
4.\;&\operatorname{RevokedOrUnsafe}(\xi)
\Rightarrow\operatorname{Finish}(\text{policy/safety stop}).\\
5.\;&(t_{\rm now}\ge d)\lor(j_c\ge K_c)\lor(j_a\ge K_a)
\Rightarrow\operatorname{Finish}(\text{exhausted}).\\
6.\;&\operatorname{AtomicReserveDecisionUnderCapAndOwnership}=\text{fail}\Rightarrow\operatorname{Finish}(\text{exhausted/ownership lost});
\quad(a,\mathcal E_a)\leftarrow\operatorname{BoundedProposal}(e).\\
7.\;&\neg\operatorname{CurrentSupportedPreconditions}(a,\mathcal E_a)
\Rightarrow\operatorname{RecordUnknownOrReject};\ \operatorname{goto}3.\\
8.\;&\neg\operatorname{AtomicReserve}(\widehat{\mathbf c}(a),j_a+1)
\Rightarrow\operatorname{Finish}(\text{capacity unavailable}).\\
9.\;&\operatorname{RevalidateAtDispatch}(a);
\quad\text{changed}\Rightarrow
\operatorname{ReleaseUnusedReservation};\ \operatorname{goto}3.\\
10.\;&\operatorname{ReturnAdmitted}(a,\text{version},\text{operation key},\text{deadline}).
\end{aligned}
$$

[DERIVED] Line 9 cannot release an effect reservation if a dispatch may already have occurred; such a race must enter reconciliation. The invariant is that every accepted claim has a source and every launched attempt has a durable charge. Finite loops do not imply a valid goal or a correct world model.

[DERIVED] Successful atomic reservations return the incremented durable counter values into local state. A resumed invocation reloads them before any cap test; failed reservations return immediately. Protected finalization capacity is excluded from the proposal allowance.

## Implementation

[OFFICIAL-DOCUMENTATION] LangGraph documents thread-scoped checkpoints and distinguishes them from cross-thread stores [R52.12, “Persistence” and memory/checkpointer discussion]. Its interrupt API can wait indefinitely [R52.13, introduction]. [DERIVED] A bounded controller reserves final verification/reconciliation capacity before proposals and therefore needs an application deadline for suspended work as well as runtime step caps. Neither checkpoint presence nor typed state proves current external truth.

[DERIVED] No numbered stack implementation owns these control predicates. The outside-stack framework is an orchestration example, not a verified deployed configuration. Values should use exact decimal/integer representations for contractual quantities where floating-point rounding would change admission. Use timestamps with a declared clock basis and retain server versions; client wall clocks alone cannot establish cross-service ordering.

## Experimental design

### Reported experiments

[PAPER-REPORTED] τ-bench provides policy documents, hidden database state and a simulated user. Its deterministic API transitions and stochastic user dialogue expose different kinds of uncertainty [P43, §3]. The main study caps episodes at 30 agent actions, uses agent temperature 0 and user temperature 1, and runs at least three trials per task [P43, §5].

[PAPER-REPORTED] Its policy-removal ablation changes GPT-4o retail pass^1 from 61.2 to 56.8; the airline row is 33.2 to 10.8 [P43, Table 3]. The airline baseline differs from Table 2's 35.2, so those rows must not be silently combined. Hardware, backend precision and exact stochastic reproducibility are not disclosed.

## Observations

**What the paper claims.** [PAPER-REPORTED] Explicit state, domain constraints and repeated trials expose failures hidden by answer-only evaluation [P43, §§3–5; R52.1, §3].

**What the evidence shows.** [PAPER-REPORTED] Removing policy can materially change task outcomes in the specified τ-bench ablation; an API-valid action need not be policy compliant [P43, §3, reward discussion].

**What we infer.** [DERIVED] Preconditions require evidence and current versions. Supplying a policy document is weaker than enforcing its conditions.

**What remains unknown.** [UNVERIFIED] Calibration of latent-state beliefs, enforcement under concurrent writers and production authorization races were not tested here.

## Failure modes

> **Failure mode — Unknown becomes false.** [DERIVED] *Symptom:* the controller creates a duplicate object after an empty or timed-out lookup. *Cause:* lack of evidence is converted into evidence of absence. *Detection:* trace interpretation status and lookup coverage. *Mitigation:* preserve unknown status and use an authoritative operation-key reconciliation path.

[DERIVED] Other failures are budget reset after resume, unbounded suspended work, stale preconditions and goal predicates that omit a requested subtask. Observable counters and receipts make these diagnoses falsifiable.

## Siblings

[DERIVED] A fact ledger supports auditable local decisions without requiring an enumerated probabilistic world. A Bayesian belief supports principled uncertainty only with an adequate model. A symbolic state supports precise predicates but can be incomplete. These are representation alternatives with different guarantees, not interchangeable names for a prompt summary.

## Extensions

### Improvements

[PAPER-REPORTED] Relative to hidden conversational histories, τ-bench adds state-based outcome checks; ToolMaze adds controlled perturbations and topology [P43, §3; R52.2, §§3.2–3.5]. [DERIVED] These improve diagnostic coverage while retaining modeled-world and synthetic-user limitations. They do not prove safety of an arbitrary external API.

## Limitations

[DERIVED] A central open problem is constructing compact state abstractions that preserve action-relevant uncertainty under changing APIs. Evidence would require adversarially hidden preconditions and independent audits of abstraction errors. Finite controller budgets solve a termination problem; they cannot compensate for missing semantic state.

## Reproducibility

[UNVERIFIED] Record the goal/policy revision, raw observations, interpretation rules, unknown-state handling, resource units, durable counters, timeouts and clock assumptions. Exact world state and likelihood models are usually unavailable; mark them absent rather than presenting Eq. 52.6 as an implemented estimator.

```figure
id: fig-52.7
kind: calculator
title: "Persisted decision allowance"
caption: "Illustrative cap domain keeps used decisions at or below the cap. Remaining decisions bound proposals only when counters persist and waits/finalization are bounded."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-52.9
alt: "Remaining decision count equals the durable cap minus persisted use. This is a termination allowance, not a probability of task success."
states:
  - {anchor: formulation, label: "Counter", note: "The cap and used count are nonnegative integers with used no greater than cap."}
  - {anchor: mechanism, label: "Resume", note: "Reload and atomically increment the same logical-request counter."}
  - {anchor: failure-modes, label: "Boundary", note: "Bounded proposals do not bound an unbounded external wait."}
spec:
  tex: "\\rho=K_c-j_c"
  equation: "52.9"
  inputs:
    - {symbol: cap, label: "decision cap", default: 100, min: 100, max: 1000, format: integer}
    - {symbol: used, label: "persisted decisions used", default: 30, min: 0, max: 100, format: integer}
  outputs:
    - {symbol: result, label: "decisions remaining", formula: "cap-used", format: integer}
```

```figure
id: fig-52.8
kind: stat-panel
title: "Terminal status has multiple obligations"
caption: "A satisfied goal cannot bypass invariant checks or publication authority. Unresolved effects remain visible at every terminal branch."
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-52.7
alt: "Completion requires goal, invariant and publication authority. Uncertainty and ambiguous effects are separate terminal outcomes rather than false success."
spec:
  header: CONTRACT BOUNDARY
  rows:
    - {key: "complete", value: "goal + invariant + authority"}
    - {key: "uncertain", value: "insufficient supported state"}
    - {key: "ambiguous", value: "effect requires reconciliation"}
```

## References

[P43](references.md#p43), [R52.1](references.md#r52-1), [R52.2](references.md#r52-2), [R52.6](references.md#r52-6), [R52.7](references.md#r52-7), [R52.12](references.md#r52-12), [R52.13](references.md#r52-13).
