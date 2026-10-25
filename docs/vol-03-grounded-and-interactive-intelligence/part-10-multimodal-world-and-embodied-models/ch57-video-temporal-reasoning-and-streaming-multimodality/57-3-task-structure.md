---
id: ms.section.57.3
entity_type: section
title: "Task structure"
volume: 3
part: 10
chapter: 57
section: 57.3
slug: 57-3-task-structure
parent: ms.chapter.57
prev_sibling: ms.section.57.2
next_sibling: ms.section.57.4
children: []
prerequisites: [ms.chapter.15, ms.chapter.18, ms.chapter.55, ms.chapter.56]
downstream: [ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.63]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.53]
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [temporal_representation, streaming_state, evidence_grounding], feedback_setting: [], modality: [video, audio, text]}
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 57.3 Task structure

## Scope

[DERIVED] The objective is an answer whose task type, temporal evidence and uncertainty are inspectable. The baseline scores free-form video answers without checking localization or causal access. This section owns temporal localization, event ordering, causal questions, long-video summarization and state tracking. Success combines semantic correctness with the declared grounding and timing conditions. General retrieval and context assembly remain in Chapters 49–50; physical world-model learning is developed in Chapter 59.

## Why this exists

[DERIVED] A request to name an action, locate its interval, order two actions, explain an outcome and predict a future state imposes different evidence requirements. Treating all five as answer-string matching hides whether a system saw the decisive event, tracked its participants or relied on a linguistic prior. A single accuracy number also confounds observation failure with reasoning after adequate evidence.

[DERIVED] Long-video summaries add an irreversible selection decision. A concise description can remain factually correct while omitting the only event needed by a later query. State tracking adds a different constraint: the system must preserve which entity had which property at which time, including uncertainty through occlusion and changes in identity. Fluency does not establish these invariants.

## Intuition

[DERIVED] Grounding makes a claim traceable to observations. It does not by itself prove that those observations uniquely imply the claim. Temporal precedence can support an event-order statement while leaving a causal explanation unidentified. Separate observation, annotation convention, model inference and hypothetical intervention in the answer schema.

[MATHEMATICALLY-DERIVED] A many-to-one representation cannot answer a question that distinguishes histories inside one of its equivalence classes. For summarization and state tracking, the question family therefore controls what must survive. “Long context” describes capacity, whereas retained counts, identities and transition times specify the information contract.

## Formulation

[DERIVED] An answer record contains a task code, media prefix, proposition, participant identities, supporting intervals, optional spatial tracks, confidence/unknown status and revision number. A forecast also declares its horizon and conditioning prefix. Ground truth must identify whether an interval denotes physical onset, first visible evidence, action duration or an annotator's permitted response window.

[MATHEMATICALLY-DERIVED] For nonempty positive-duration intervals $A=[a_0,a_1]$ and $G=[g_0,g_1]$,

$$
\operatorname{tIoU}(A,G)=
\frac{\max(0,\min(a_1,g_1)-\max(a_0,g_0))}
{\max(a_1,g_1)-\min(a_0,g_0)}.
$$
*(Eq. 57.10)*

[DERIVED] This is interval overlap, not an explanation score. Point events need an explicit tolerance or discrete-time rule rather than zero-width intervals producing an undefined denominator. A long enclosing interval can improve recall while degrading precision; report boundary error and duration bias alongside overlap.

[MATHEMATICALLY-DERIVED] Let uncertain event times lie in $[l_A,u_A]$ and $[l_B,u_B]$. A robust order conclusion follows when

$$
u_A<l_B\ \Longrightarrow\ A\prec B.
$$
*(Eq. 57.11)*

[DERIVED] Overlapping uncertainty intervals do not establish a tie or reversal. They leave order unresolved unless another observation constrains it. Reducing frame spacing can tighten timestamp quantization, while identity or occlusion uncertainty may remain unchanged.

```figure
id: fig-57.9
kind: calculator
title: Temporal overlap and interval extent
caption: Illustrative positive-duration intervals. The first interval begins at zero and the second at a nonnegative offset; the calculation instantiates Eq. 57.10 under that coordinate choice.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-57.10
alt: Change the two interval durations and the second start offset. The readout separates intersection seconds from temporal intersection over union.
spec:
  tex: \mathrm{tIoU}=\frac{\max(0,\min(a_1,g_1)-\max(a_0,g_0))}{\max(a_1,g_1)-\min(a_0,g_0)}
  equation: "57.10"
  inputs:
    - {symbol: la, label: "first interval duration seconds", default: 4, min: 0.01, max: 100, format: fixed2}
    - {symbol: lb, label: "second interval duration seconds", default: 4, min: 0.01, max: 100, format: fixed2}
    - {symbol: off, label: "second interval start seconds", default: 2, min: 0, max: 100, format: fixed2}
  outputs:
    - {symbol: overlap, label: "intersection seconds", formula: "max(0,min(la,off+lb)-off)", format: fixed2}
    - {symbol: iou, label: "temporal intersection over union", formula: "overlap/(max(la,off+lb))", format: percent}
```

## Mechanism

### Methodology

[DERIVED] First classify the requested evidence relation. Localization returns intervals and uncertainty; ordering returns a relation with its participants and temporal bounds; a state query returns the entity-property value at a named time; summarization returns selected propositions with coverage exclusions; a causal question distinguishes an observational explanation from an intervention claim. This classification fixes the checker before the answer is generated.

[PAPER-REPORTED] CaST-Bench constructs causal-chain annotations with temporal segments and spatial tracks, filters text-only-solvable questions and masks annotated evidence to test remaining shortcuts. Its instance matching supports temporal/spatial grounding metrics and a joint answer/grounding evaluation [R57.3, §§4.1–4.3, Supplement§12].

[DERIVED] Its motivation suggests a useful engineering contract: generate a proposed evidence chain, then validate each interval against the admitted prefix and each identity against the source observations. This book procedure is not the benchmark's causal identification theorem. A correctly localized chain can still omit a confounder, and a badly formatted chain can fail a metric despite a correct internal inference.

[MATHEMATICALLY-DERIVED] Consider a binary analytical counterexample with exogenous $U_c\sim\operatorname{Bernoulli}(1/2)$:

$$
\begin{array}{lll}
\mathcal M_1:& X_c=U_c,&Y_c=X_c,\\
\mathcal M_2:& X_c=U_c,&Y_c=U_c.
\end{array}
$$
*(Eq. 57.12)*

[DERIVED] Both models yield the same observational equality $X_c=Y_c$. Setting $X_c$ externally changes $Y_c$ in the first model but not the second. An observational recording of this joint law cannot choose between those interventions. In real video, additional structural assumptions or interventions are needed before an order-consistent narrative becomes a causal effect estimate.

[DERIVED] Controlled frame reordering tests sequence sensitivity, but it may create physically impossible histories. It is a valid intervention on the model input, not automatically an intervention on the physical system. Describe the measured property as sensitivity to reordered evidence unless the physical counterfactual itself is justified.

[DERIVED] State tracking requires explicit latent-state semantics. For a declared finite hidden-state model with transition probabilities $K(z'\mid z)$ and observation likelihood $L(o_k\mid z')$, Bayesian filtering gives

$$
b_k(z')=
\frac{L(o_k\mid z')\sum_z K(z'\mid z)b_{k-1}(z)}
{\sum_{\widetilde z}L(o_k\mid\widetilde z)
\sum_zK(\widetilde z\mid z)b_{k-1}(z)}.
$$
*(Eq. 57.13)*

[DERIVED] This equation is an exact update only under its specified transition/observation model and a positive denominator. Through occlusion, propagate uncertainty under that model rather than replace it by an unsupported definite state. Entropy need not increase: a known deterministic many-to-one transition can reduce uncertainty without a new observation. An impossible observation under all states diagnoses model misspecification or bad input; it does not authorize arbitrary renormalization. A language summary is not implicitly such a calibrated posterior.

[DERIVED] Long-video summarization selects a limited evidence set for later interpretation. Let propositions $j$ have declared importance $w_j\ge0$, evidence items $i$ incur costs $c_i>0$, and $a_{ij}\in\{0,1\}$ indicate support. A coverage-based proxy is

$$
\max_{J:\sum_{i\in J}c_i\le Q_e}
\sum_j w_j\min\!\left(1,\sum_{i\in J}a_{ij}\right).
$$
*(Eq. 57.14)*

[DERIVED] This instantiates the context-selection family owned by [§50.2](../../part-09-retrieval-context-and-agent-systems/ch50-context-construction-and-retrieval-augmented-generation/50-2-context-budgeting.md). Its gain depends on the chosen propositions and support mapping. Coverage of known questions does not guarantee preservation for unknown future questions. Entity IDs, event counts and source references should therefore remain separately inspectable rather than being recoverable only from a polished narrative.

[DERIVED] **Cost.** Comparing all predicted and reference event pairs costs $O(n_pn_g)$ overlap evaluations before matching; a sorting-based greedy assignment adds ordering work. Dense finite-state filtering costs $O(n_z^2)$ per observation and $O(n_z)$ belief storage; sparse transitions can reduce it. Candidate evidence selection incurs retrieval/encoding and optimization costs, plus storage of source links and spatial tracks. None of these costs includes decoder generation unless explicitly charged. Energy and monetary comparisons remain unverified without complete executions.

```figure
id: fig-57.10
kind: diagram
title: From task request to checked evidence relation
caption: Evidence grounding and causal identification are different obligations. A task may terminate with unresolved order or insufficient causal information.
evidence: DERIVED
source: DERIVED:eq-57.12
alt: A task contract leads to proposed intervals and entities, admissible-prefix checks, and a task-specific checker. Validated grounded claims and unresolved claims take separate output paths.
spec:
  direction: LR
  nodes:
    - {id: task, kind: objective, label: Declared task and acceptance rule}
    - {id: proposal, kind: process, label: Proposed intervals and entities}
    - {id: prefix, kind: branch, label: Evidence inside admitted prefix}
    - {id: checker, kind: metric, label: "Localization, order or state check"}
    - {id: accept, kind: state, label: Grounded bounded conclusion}
    - {id: unknown, kind: state, label: Insufficient or conflicting evidence}
  edges:
    - {from: task, to: proposal}
    - {from: proposal, to: prefix}
    - {from: prefix, to: checker, label: valid references}
    - {from: prefix, to: unknown, label: invalid or future evidence}
    - {from: checker, to: accept, label: declared conditions met}
    - {from: checker, to: unknown, label: conditions unresolved}
```

## Algorithm

> **Algorithm 57.3 — Typed temporally grounded answer.** [DERIVED] Inputs are a task schema, finite evidence index, admitted prefix, entity ledger, bounded retrieval budget and checker. Output is an answer/evidence record with accepted, rejected or unknown status.

$$
\begin{aligned}
1.&\quad q_{\mathrm{type}}\leftarrow\operatorname{ParseTask};
\quad\operatorname{Unsupported}\Rightarrow\operatorname{Return}(\mathrm{unknown}).\\
2.&\quad E_q\leftarrow\operatorname{BoundedRetrieve}(q_{\mathrm{type}});
\quad\operatorname{RecordAllAccessAndCosts}.\\
3.&\quad \operatorname{RejectFutureInvalidOrUnresolvableReferences}(E_q);
\quad\operatorname{RetainGaps}.\\
4.&\quad A_q\leftarrow\operatorname{GenerateBoundedProposal}(E_q,q_{\mathrm{type}}).\\
5.&\quad v_q\leftarrow\operatorname{CheckIntervalsIdentitiesRelationsAndTask}(A_q,E_q);\\
 &\quad\operatorname{InterventionClaim}\Rightarrow\operatorname{RequireAdditionalCausalPremises}.\\
6.&\quad\operatorname{Return}(A_q,E_q,v_q,\operatorname{UnresolvedConditions}).
\end{aligned}
$$

[DERIVED] Termination follows from finite retrieval/call/output limits, including checker reserve. The invariant is that each accepted evidence reference resolves inside the allowed prefix. That invariant is necessary for the contract but insufficient for answer correctness. A missing checker yields unknown status rather than acceptance by fluent agreement.

## Implementation

[DERIVED] Store each proposition and entity-state revision with source interval, identity version and a direct distinction between observed and inferred fields. Multiple entities can share a visual class; class labels cannot replace identity. A timeline query must specify whether it requests state immediately before or after an event boundary. Half-open interval conventions avoid double-counting a state change at a shared endpoint.

[DERIVED] PyTorch (#17, Core training framework) can execute a declared finite-state filter; Hugging Face Transformers (#26, Model-definition layer) can generate candidates from a model-specific processor. The evidence index and acceptance checker remain application responsibilities. A generated JSON schema does not enforce temporal truth. No named runtime is asserted to supply Algorithm 57.3 automatically.

## Experimental design

### Reported experiments

[PAPER-REPORTED] CaST-Bench evaluates2,066 questions over1,015 videos. Its Gemini-2.5-Pro diagnostic reports 45.98% direct accuracy,50.34% with self-generated chains and 75.61% with ground-truth chains. Native-video and 1-FPS-frame API paths differ; the latter is used for the GPT-5 series. Grounding uses threshold 0.1 [R57.3, Tables 2–4, §5.1].

[DERIVED] The ground-truth-chain condition supplies privileged evidence. It diagnoses headroom under that access regime; it cannot establish that the deployed system can recover those chains. Match the observation path before attributing a difference to reasoning, and report parse/format failures separately from a successfully parsed but wrong grounding.

## Observations

**What the paper claims.** [PAPER-REPORTED] Explicit grounding is difficult and ground-truth evidence can substantially improve answer accuracy in its benchmark [R57.3, §5.2].

**What the evidence shows.** [DERIVED] Self-generated and oracle-chain conditions are materially different. Correct answers and faithful evidence can diverge, so answer accuracy alone is insufficient.

**What we infer.** [DERIVED] Use joint grounding/answer checks for tasks that require evidence. Preserve a direct-answer comparator because chain generation adds its own representation and formatting costs.

**What remains unknown.** [UNVERIFIED] Independent replication, calibrated state uncertainty and identifiable physical causal effects remain unchecked. Benchmark causal labels do not settle those separate obligations.

## Failure modes

> **Failure mode — Identity collapse.** [DERIVED] *Symptom:* an action is assigned to the wrong visually similar participant. *Cause:* class labels replace entity identity through occlusion. *Detection:* inspect track continuity and alternative assignments. *Mitigation:* retain unresolved identities and prevent a definite state update.

> **Failure mode — Narrative causal substitution.** [DERIVED] *Symptom:* a coherent explanation is accepted without excluding confounding. *Cause:* temporal order is treated as an intervention model. *Detection:* construct observationally equivalent alternatives as in Eq. 57.12. *Mitigation:* bound the answer to observed evidence or state the missing causal premises.

## Siblings

[DERIVED] Localization estimates where; ordering constrains before/after; state tracking integrates updates; summarization allocates retained evidence; causal inference asks what would change under a specified intervention. Combining their outputs can strengthen a task record, but does not erase the different acceptance rules.

## Extensions

[DERIVED] Evidence-chain supervision is a documented diagnostic route, while explicit state ledgers are an engineering construction for auditability. Prefer the extra structure when a required identity, count or interval check becomes enforceable. Reverse that preference if the same task can be checked with less structure and lower complete cost; retain it when free-form outputs systematically hide unsupported claims.

```figure
id: fig-57.11
kind: stat-panel
title: Grounded answer acceptance boundary
caption: These fields distinguish traceability, temporal validity and the stronger premises needed for intervention claims; they are not model performance scores.
evidence: DERIVED
source: DERIVED:eq-57.12
alt: The panel lists resolved source intervals, entity identity, temporal uncertainty and causal premises as separate acceptance fields.
spec:
  header: ANSWER CONTRACT
  rows:
    - {key: source, value: resolvable interval and media identity}
    - {key: prefix, value: no future or unavailable observations}
    - {key: identity, value: tracked or explicitly unresolved}
    - {key: causality, value: additional intervention premises}
```

## Limitations

[DERIVED] A defensible conclusion identifies the task relation actually checked. A new identity ambiguity, missing causal premise, changed query family or failed evidence checker reopens the result. More narrative detail or a higher language-model score cannot discharge an unavailable observational distinction.

## Reproducibility

[DERIVED] Preserve task schema, annotation convention, evidence intervals/tracks, identity revisions, source-prefix ledger, generated chain, parser outcome and checker version. Keep oracle-evidence diagnostics separately labeled. No model, tracker or causal experiment was executed for the book.

## References

[DERIVED] [R57.3](references.md#r57-3), v2, inspected 2026-10-25. Earlier general retrieval, memory and context machinery is linked to its canonical chapters.
