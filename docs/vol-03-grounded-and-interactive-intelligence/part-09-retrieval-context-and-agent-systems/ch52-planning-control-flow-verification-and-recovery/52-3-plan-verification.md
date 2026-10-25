---
id: ms.section.52.3
entity_type: section
title: Plan verification
volume: 3
part: 9
chapter: 52
section: 52.3
slug: 52-3-plan-verification
parent: ms.chapter.52
prev_sibling: ms.section.52.2
next_sibling: ms.section.52.4
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
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 52.3 — Plan verification

## Scope

[DERIVED] Plan verification establishes which properties follow from dependencies, tests, constraint models, evidence and independent outcome checks. The baseline accepts a plausible plan or a successful tool response as proof of completion. Success is a property-specific verdict with explicit assumptions: structurally valid, model-valid, test-passing, currently supported or independently completed. General verifier-guided inference-time search belongs to [Chapter 38](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/README.md).

## Why this exists

[DERIVED] Different checks answer different questions. A topological sort cannot establish that an API response is truthful. Unit tests cannot cover an omitted requirement. A solver can prove a statement about an incomplete transition model. A second model can reproduce the first model's error. Treating all these checks as a single “verified” flag discards the boundary that determines whether an external action is justified.

[PAPER-REPORTED] LLM-Modulo proposes a generate–test–critique architecture with hard model-based critics and softer preference critics, including explicit model-acquisition and reformulation roles [R52.8, §3]. Its soundness is conditional on the critics and their models. [DERIVED] Translation into a formal language is itself an evidence-bearing transformation; checking a mistranslated requirement proves the wrong proposition.

[DERIVED] The dominant constraint becomes the independence and coverage of the checking channel. The same model, prompt and generated assumptions can create both a plan and an approving critique without adding information about the real environment.

## Intuition

[DERIVED] Verification should produce a vector of claims rather than a scalar confidence. For example, a plan may be acyclic, type-correct and satisfiable under the model, yet remain unauthorized because its entity identity is unresolved. Conversely, a valid alternative plan can differ from a reference trajectory. Judge resemblance and task correctness must remain separate.

[DERIVED] Pre-execution verification checks whether a proposed action is justified. Post-execution verification checks what actually happened. Both are needed when transport acknowledgements, API effects and user-visible outcomes can disagree.

## Formulation

> **Definition — Property-indexed verification verdict.** [DERIVED] A separate supported, failed or unresolved result for each required plan property, retaining its checker and assumptions.

| Local symbol | Meaning |
|---|---|
| $\mathcal D=(V,E)$ | Finite dependency graph of plan steps |
| $\nu(v)$ | Step position in a proposed topological ordering |
| $\widehat s_j$, $\widehat K$ | Modeled state and encoded transition relation |
| $h_v$ | Nonnegative integer verification horizon |
| $\widehat I,\widehat G$ | Model invariant and goal predicates |
| $\alpha$ | Abstraction mapping actual states to modeled states |
| $A_t,C_t$ | Events that internal tests accept and independent outcome is correct |
| $p_v,\eta_1,\eta_0$ | Prior correctness, acceptance if correct, acceptance if incorrect |

[MATHEMATICALLY-DERIVED] A topological ordering must satisfy

$$
(u,v)\in E\Rightarrow\nu(u)<\nu(v).
$$
*(Eq. 52.10)*

Cycle detection and topological sorting take $O(|V|+|E|)$ time and auxiliary graph storage. This checks dependency structure, not the truth or freshness of bound values.

[DERIVED] A bounded synthesis formula is

$$
\Phi_{h_v}=
\widehat{\operatorname{Init}}(\widehat s_0)
\land\bigwedge_{j=0}^{h_v-1}
\widehat K(\widehat s_j,a_j,\widehat s_{j+1})
\land\bigwedge_{j=0}^{h_v}\widehat I(\widehat s_j)
\land\widehat G(\widehat s_{h_v}).
$$
*(Eq. 52.11)*

A satisfying assignment is a modeled witness. In a nondeterministic model, existence of one favorable trajectory does not establish that a fixed plan succeeds on all possible trajectories.

[DERIVED] For a fixed candidate $\mathbf a$, a bounded counterexample query instead asks whether

$$
\Psi_{h_v}(\mathbf a)=
\widehat{\operatorname{Init}}(\widehat s_0)
\land\bigwedge_{j=0}^{h_v-1}\widehat K(\widehat s_j,a_j,\widehat s_{j+1})
\land
\left[\bigvee_{j=0}^{h_v}\neg\widehat I(\widehat s_j)
\ \lor\ \neg\widehat G(\widehat s_{h_v})\right]
$$
*(Eq. 52.12)*

is satisfiable. The transition conjunction is empty and true when $h_v=0$. Unsatisfiability rules out encoded counterexamples within this horizon, provided the model admits the intended transitions and the encoding is correct. A separate executability/nonblocking check must cover every allowed nondeterministic branch through the horizon; one favorable witness excludes neither deadlock on another branch nor an impossible intended action.

[MATHEMATICALLY-DERIVED] A two-step counterexample makes the quantifiers consequential. Let the first fixed action lead from $s_0$ nondeterministically to $g$ or $d$, and let the second action lead from $g$ to the goal $f$ but have no successor from $d$. Suppose all represented states satisfy the invariant. A successful full-length witness $s_0,g,f$ exists, and Eq. 52.12 can be unsatisfiable because it quantifies only complete two-transition paths. The allowed prefix $s_0,d$ is nevertheless stuck before the goal. Thus a satisfiable feasibility query plus an unsatisfiable complete-path counterexample query still does not establish success on every branch. Separately reject any reachable prefix before the horizon whose prescribed next action has no allowed successor, unless the declared task contract already permits terminal success there. A timeout or solver unknown on this prefix check leaves the corresponding verdict unresolved.

[MATHEMATICALLY-DERIVED] Suppose all actual initial states map into the modeled initial set; all actual candidate transitions are represented by $\widehat K$ under $\alpha$; model predicates imply their actual counterparts; and all actual executions are defined through the checked horizon. If every modeled execution satisfies $\widehat I$ throughout and $\widehat G$ at the end, induction on the transition simulation gives the corresponding actual properties:

$$
\widehat I(\alpha(s))\Rightarrow I(s),\qquad
\widehat G(\alpha(s))\Rightarrow G(s).
$$
*(Eq. 52.13)*

This conditional transfer argument exposes the missing premise in a solver-only deployment claim.

[MATHEMATICALLY-DERIVED] For $0<p_v<1$ and a positive acceptance probability,

$$
\Pr(\neg C_t\mid A_t)=
\frac{\eta_0(1-p_v)}
{\eta_1p_v+\eta_0(1-p_v)}.
$$
*(Eq. 52.14)*

This is the fraction of accepted outputs that are wrong, not the false-positive rate $\Pr(A_t\mid\neg C_t)=\eta_0$.

## Mechanism

### Methodology

[DERIVED] Dependency checking starts by parsing a plan into typed steps with stable IDs, explicit inputs, outputs, read/write sets and prerequisites. Reject unknown references, incompatible types and cycles. Resolve each evidence binding to an actual receipt; a generated variable name is not a value. If steps execute concurrently, validate resource and effect conflicts as well as graph edges. A DAG does not make concurrent writes commute.

[DERIVED] Executable tests instantiate part of the contract. Use schema tests for interface shape, property tests for invariants and task tests for required outcomes. A test generated from the same erroneous interpretation as the implementation can agree with it. Separate visible development tests from independent evaluation; track which checks influenced the plan. Passing a finite test suite establishes those executions, not universal semantic correctness.

[PAPER-REPORTED] Reflexion generates tests, filters syntactically invalid statements and uses at most six tests per programming task [R52.10, §4.3]. Its MBPP Python result falls from the GPT-4 baseline's 80.1 to 77.1, while HumanEval Python improves to 91.0. The source reports $\Pr(\text{incorrect}\mid\text{tests pass})$ of 16.3% and 1.4% respectively [R52.10, Tables 1–2 and analysis]. These are conditional acceptance-error measurements, not universal test FPRs.

[DERIVED] Constraint solvers encode action applicability, entity relationships, capacities, time and goal requirements in a declared theory. The encoding must identify exact integers, bounded domains and any approximation of strings, time or numerical quantities. An SMT solver returns a result for this formula. Unsupported theories, timeouts or resource limits can yield unknown; unknown cannot be promoted to safe or infeasible.

[OFFICIAL-DOCUMENTATION] Z3's guide distinguishes sat, unsat and unknown, and retrieves a model after sat [R52.9, “Basic Commands,” check-sat/get-model]. [DERIVED] A witness should be replayed through the domain interpreter before dispatch. For plan checking, counterexamples are often more informative than a Boolean failure: identify the first invalid precondition, violated resource or omitted goal. Bound refinement iterations so a critic cannot create an endless proposal loop.

[DERIVED] Evidence review binds factual premises to their sources, revisions and authority. A model-generated summary is useful for routing attention but should retain links to raw observations. If a plan relies on a contract clause, product option or record status, the verifier must inspect the actual relevant evidence. Cross-source agreement adds little when sources share the same upstream mistake. Provenance and freshness are separate from semantic agreement.

[DERIVED] Independent outcome verification queries authoritative state after the effect boundary, using a checker with a separately specified goal contract. It should match operation IDs, entities, amounts and versions, and include negative obligations such as “no additional reservation.” A natural-language success statement is insufficient. A checker may need permissions to inspect state that the actor cannot see; log this separation without exposing hidden evaluation data to the actor.

[PAPER-REPORTED] τ-bench combines final-database comparison with required information substrings, but explicitly notes that success can still omit user confirmation and violate policy [P43, §3, “Reward”]. [DERIVED] State outcome, disclosure and process compliance therefore require separate checks. Making a reward more exact on one dimension does not make it complete on every dimension.

[DERIVED] Costs differ sharply by verifier. Dependency checks are linear in graph size. Test execution costs the tested program plus harness/sandbox overhead and can be unbounded without timeout and memory limits. Bounded encodings grow with horizon and state variables; general solver time is not predictably linear in formula size. Evidence review incurs retrieval, serialization and possibly model calls. Independent outcome checks add network/database latency and may require waiting for a documented consistency boundary. Preserve a final-check budget before spending on proposals.

```figure
id: fig-52.9
kind: diagram
title: "Property-indexed verification and actual outcomes"
caption: "Structural, executable and model checks approve different properties. Their verdicts feed one typed gate; actual outcome verification follows effects."
placement: inline
evidence: DERIVED
source: DERIVED:eq-52.13
alt: "A candidate branches to dependency checks, sandbox tests, modeled constraints and evidence review. Supported required verdicts permit execution, followed by an independent authoritative outcome check. Unknown verdicts stop dispatch."
spec:
  direction: LR
  nodes:
    - {id: cand, kind: state, label: "Candidate plan"}
    - {id: dep, kind: process, label: "Dependencies"}
    - {id: test, kind: process, label: "Sandbox tests"}
    - {id: solve, kind: process, label: "Model constraints"}
    - {id: evidence, kind: process, label: "Evidence review"}
    - {id: gate, kind: branch, label: "Required verdicts supported"}
    - {id: unresolved, kind: state, label: "Reject / unresolved"}
    - {id: exec, kind: process, label: "Effect execution"}
    - {id: out, kind: metric, label: "Independent outcome"}
  edges:
    - {from: cand, to: dep}
    - {from: cand, to: test}
    - {from: cand, to: solve}
    - {from: cand, to: evidence}
    - {from: dep, to: gate}
    - {from: test, to: gate}
    - {from: solve, to: gate}
    - {from: evidence, to: gate}
    - {from: gate, to: unresolved}
    - {from: gate, to: exec}
    - {from: exec, to: out}
```

## Algorithm

[DERIVED] **Algorithm 52.3 — Layered candidate verification.** Inputs are candidate plan, current evidence, policy/model revision, horizon and persistent integer verification cap $K_v\ge1$. Output is a property-indexed verdict and counterexample record. All check calls have deadlines; failed reservations terminate before execution. Finish persists results and releases unused reservations.

$$
\begin{aligned}
1.\;&j_v\leftarrow\operatorname{LoadPersistentVerificationCount};
\quad \operatorname{ReserveUnderCapAndOwnership}(j_v,K_v)
=\text{fail}\Rightarrow\operatorname{Finish}(\text{exhausted}).\\
2.\;&\mathcal D\leftarrow\operatorname{ParseTypedDependencies}(p);
\quad\text{invalid/cyclic}\Rightarrow\operatorname{Finish}(\text{structural reject}).\\
3.\;&\operatorname{ResolveCurrentEvidenceAndPolicy}(p);
\quad\text{missing/stale/denied}\Rightarrow\operatorname{Finish}(\text{unsupported}).\\
4.\;&r_{\rm test}\leftarrow\operatorname{BoundedSandboxTests}(p);
\quad\text{fail/timeout}\Rightarrow\operatorname{Finish}(\text{test unresolved/reject}).\\
5.\;&r_{\rm solve}\leftarrow\operatorname{BoundedModelCheck}(p,\widehat K,h_v);
\quad r_{\rm solve}=\text{unknown}
\Rightarrow\operatorname{Finish}(\text{model unresolved}).\\
6.\;&\operatorname{Counterexample}(r_{\rm solve})
\Rightarrow\operatorname{Finish}(\text{model reject},\text{witness}).\\
7.\;&\operatorname{CheckExecutabilityAndNonvacuity};
\quad\text{fail}\Rightarrow\operatorname{Finish}(\text{invalid model path}).\\
8.\;&\operatorname{Finish}(\text{pre-execution verdicts},\text{assumptions},
\text{required post-effect checks}).
\end{aligned}
$$

[DERIVED] An inapplicable test or solver layer is explicitly marked not applicable with a reason, rather than automatically passed. This algorithm verifies a candidate; it does not execute it or certify unmodeled requirements. Its cap bounds checker invocations, while each checker needs its own time/memory envelope.

## Implementation

[OFFICIAL-DOCUMENTATION] Z3 and LangGraph are outside the numbered reference stack, routed through the chapter's planning/control anchor. Z3 is a formula-solving component; LangGraph supplies graph state and execution plumbing [R52.9; R52.12]. Neither is an end-to-end task verifier. No solver or framework run was executed here.

[DERIVED] Represent IDs and exact contract values without lossy floating-point conversion. Serialize the formula, theory settings, timeout and model revision alongside the verdict. Sandbox tests need isolated files, bounded processes and explicit network/effect permissions. Verifier outputs should use typed statuses so transport failure cannot deserialize as a passing result. Numerical tolerances must derive from the measured operator/task contract, not a generic epsilon.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Reflexion's GPT-4 ablation uses the 50 hardest HumanEval Rust problems: baseline 0.60, reflection without test generation 0.52, tests without reflection 0.60 and both 0.68 [R52.10, Table 3]. This is bounded evidence that feedback and interpretation interacted in that setup; exact compute equality and confidence intervals are not disclosed.

[PAPER-REPORTED] APB uses a reference-informed Gemini 3 Pro judge, with 92.22% agreement on 720 human-annotated samples versus 80.83% without references. Its executable validation evaluates 200 tasks each in ToolSandbox and τ²-bench; GPT-4o's τ² reward moves 0.56→0.63 after critique of the same draft plan [R52.11, Appendix D.1/Table 7; §5.1/Table 3]. Critique adds computation. These results are neither an executable correctness certificate for judge scores nor an equal-compute ablation.

## Observations

**What the paper claims.** [PAPER-REPORTED] External critics, executable feedback and diagnostic critique can improve candidate plans [R52.8, §3; R52.10, §4.3; R52.11, §5.1].

**What the evidence shows.** [PAPER-REPORTED] Reflexion includes a negative dataset result and a harmful reflection-only ablation. APB's judge agreement and executable reward are different measurements.

**What we infer.** [DERIVED] Verification quality depends on specification coverage and feedback reliability, not solely critic fluency. Preserve multiple verdicts.

**What remains unknown.** [UNVERIFIED] Real-world abstraction completeness, hidden-policy violations and production checker failures remain outside these studies.

## Failure modes

> **Failure mode — Vacuous model validity.** [DERIVED] *Symptom:* a plan is declared safe because its impossible transition sequence has no counterexample. *Cause:* unsatisfiability is interpreted without checking executability. *Detection:* check both that intended executions exist and that every allowed reachable prefix can execute its prescribed next action or satisfies an explicitly permitted terminal condition; replaying one favorable witness is insufficient. *Mitigation:* distinguish existential feasibility, prefix nonblocking and complete-path safety/goal checking.

[DERIVED] Additional failures include judge/reference bias, test leakage, stale evidence, solver unknown treated as unsat and outcome checks that omit unauthorized side effects. Each has a distinct counterexample boundary.

## Siblings

[DERIVED] Dependency checks establish structure; tests establish sampled executions; solvers establish encoded properties; evidence review establishes supported premises; outcome checks establish observed results. Combining them increases coverage only when their failure modes and specifications are actually different.

## Extensions

### Improvements

[PAPER-REPORTED] LLM-Modulo makes critic scope explicit; Reflexion feeds executable feedback into revisions; APB links diagnostic refinement to separate execution metrics [R52.8, §3; R52.10, §3; R52.11, §5.1]. [DERIVED] These changes introduce model maintenance, testing and critic cost. Their remaining limitation is the fidelity of the checking channel.

## Limitations

[DERIVED] A genuine open question is how to maintain sound abstractions as APIs, policies and hidden dependencies change. Evidence would require independently discovered model omissions and measured rates of false acceptance after updates. A verified formula cannot certify an unrepresented business requirement.

## Reproducibility

[UNVERIFIED] Preserve raw requirements, translations, formula/solver build, test suite and generator, sandbox limits, evidence revisions, critic prompts, counterexamples and independent outcome receipts. The book inspected methods and official documentation; it did not execute solver queries, tests or agent tasks.

```figure
id: fig-52.10
kind: calculator
title: "Error among internally accepted outputs"
caption: "Illustrative calibrated event model. Prior correctness and both acceptance rates determine error among accepted outputs; this quantity differs from test false-positive rate."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-52.14
alt: "The probability of an incorrect accepted output follows Bayes' rule. Positive prior and acceptance-if-correct keep the denominator defined."
states:
  - {anchor: formulation, label: "Events", note: "All inputs are probabilities under one declared evaluation population."}
  - {anchor: mechanism, label: "Selection", note: "Conditioning on acceptance changes the denominator."}
  - {anchor: failure-modes, label: "Calibration", note: "Self-reported confidence does not establish these rates."}
spec:
  tex: "\\Pr(\\neg C\\mid A)=\\eta_0(1-p_v)/[\\eta_1p_v+\\eta_0(1-p_v)]"
  equation: "52.14"
  inputs:
    - {symbol: prior, label: "prior correctness probability", default: 0.8, min: 0.01, max: 0.99, format: fixed2}
    - {symbol: acceptGood, label: "acceptance if correct", default: 0.95, min: 0.01, max: 1, format: fixed2}
    - {symbol: acceptBad, label: "acceptance if incorrect", default: 0.1, min: 0, max: 1, format: fixed2}
  outputs:
    - {symbol: result, label: "accepted-output error probability", formula: "acceptBad*(1-prior)/(acceptGood*prior+acceptBad*(1-prior))", format: fixed3}
```

```figure
id: fig-52.11
kind: stat-panel
title: "Solver verdicts and their scope"
caption: "A solver result concerns the encoded formula. A favorable path witness does not prove every nondeterministic branch succeeds."
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-52.13
alt: "SAT supplies a modeled witness, UNSAT excludes encoded counterexamples within the checked horizon, and UNKNOWN remains unresolved."
spec:
  header: CONTRACT BOUNDARY
  rows:
    - {key: "SAT", value: "modeled witness only"}
    - {key: "UNSAT", value: "encoded query has no model"}
    - {key: "UNKNOWN", value: "no feasibility/safety verdict"}
```

## References

[P43](references.md#p43), [R52.8](references.md#r52-8), [R52.9](references.md#r52-9), [R52.10](references.md#r52-10), [R52.11](references.md#r52-11), [R52.12](references.md#r52-12).
