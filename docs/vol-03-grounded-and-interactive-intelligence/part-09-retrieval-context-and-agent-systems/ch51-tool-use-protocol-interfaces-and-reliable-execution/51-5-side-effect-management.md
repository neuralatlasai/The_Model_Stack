---
id: ms.section.51.5
entity_type: section
title: "Side-effect management"
volume: 3
part: 9
chapter: 51
section: 51.5
slug: 51-5-side-effect-management
parent: ms.chapter.51
prev_sibling: ms.section.51.4
next_sibling: ms.section.51.6
children: []
prerequisites: [ms.chapter.10, ms.chapter.11, ms.chapter.37, ms.chapter.46, ms.chapter.47, ms.chapter.50]
downstream: [ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [tool_use, typed_interfaces, authorization], feedback_setting: [], modality: [text]}
papers: [P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 51.5 Side-effect management

## Scope

[DERIVED] Side-effect management governs when an accepted action may cross a commit boundary and what happens after partial completion. It includes dry runs, approval scope, transactional updates, compensation, isolation and auditability. The baseline asks a model whether an action is safe and then executes the latest generated arguments. The objective is an enforceable relationship among user intent, reviewed proposal, current state and committed effect.

[DERIVED] The unit of review is a concrete operation with identity, arguments, target, resource version and effect scope. Approval can already exist through a standing authorized workflow; a system need not invent repeated confirmation steps. It must nevertheless establish that the action actually executed remains inside that authorization. §51.4 owns delivery ambiguity and deduplication; this section owns the transition itself.

## Why this exists

[DERIVED] A preview can describe one change while execution performs another. The model may regenerate different recipients after approval, a resource may change during a long wait, or a wrapper may add hidden defaults. A broad approval such as “continue” is meaningful only within the application context that defines what continuation permits. Recording a click without its scope does not provide a defensible authorization record.

[DERIVED] Multi-step tasks introduce another gap. Reserving inventory, charging a payment and sending confirmation can fail at different boundaries. If the first two succeed and the last fails, retrying the whole task may double-charge; declaring the task rolled back may be false. A system must expose partial effects and recovery obligations rather than compressing all steps into one conversational success flag.

[PAPER-REPORTED] The classical saga model decomposes a long-lived transaction into committed subtransactions with compensating transactions, releasing resources between steps; it does not preserve full outer transaction isolation [R51.19, §§1–3]. Its relevance is the explicit handling of partial progress, not a guarantee that every tool action has an inverse.

## Intuition

[DERIVED] Separate preparation from commit. Preparation resolves arguments, obtains authoritative state, computes a proposed change and creates a reviewable artifact. Commit verifies the authorization scope and expected state atomically where feasible, then applies exactly that proposal. A dry run can explain expected effects but cannot freeze a concurrently changing world.

[DERIVED] Compensation is a new authorized action that aims to restore an acceptable condition. It may refund money, release inventory or issue a correction. It cannot erase a recipient's knowledge of a sent message or retract a secret already disclosed. Treating compensation as time reversal hides residual harm and its own failure modes.

## Formulation

[DERIVED] Let a prepared proposal be $u=(\iota,v,a,r,\nu,e)$, where $r$ identifies the target, $\nu$ its expected state version and $e$ the declared effect scope. An approval record is $\alpha=(p,g(u),\Gamma,t_{\rm exp})$ with verified principal $p$, canonical proposal digest $g$, authorized scope $\Gamma$ and expiration. A commit gate is
$$
\operatorname{CommitAllowed}(u,\alpha,s,t)=
\operatorname{AuthorityValid}(p,\Gamma,u,t)
\land g(u)=\alpha_{\rm digest}
\land t<t_{\rm exp}
\land \operatorname{Version}(s,r)=\nu
\land P(s,a).
$$
*(Eq. 51.11)*

[DERIVED] The digest binds a proposal; it does not establish that its contents are safe or that the signer understood them. Canonicalization must preserve effect-relevant fields, and an authority check must be enforced independently of model text. Version equality is useful only when the state owner updates the version consistently and checks it atomically with the mutation.

[MATHEMATICALLY-DERIVED] In an illustrative model where relevant invalidating state changes follow a homogeneous Poisson process of rate $\lambda_d\ge0$, the probability of at least one such change during preparation-to-commit delay $\Delta\ge0$ is
$$
p_{\rm drift}=1-\exp(-\lambda_d\Delta).
$$
*(Eq. 51.12)*

[DERIVED] This is a sensitivity example, not a measured drift law. It explains why a longer review delay increases stale-state exposure under its assumptions; it does not justify a universal approval lifetime. Authoritative commit-time checking remains necessary even when the predicted probability is small.

[DERIVED] For committed steps $T_1,\ldots,T_k$ with compensations $C_k,\ldots,C_1$, the recovery goal is an acceptable invariant $\mathcal I$:
$$
z_{\rm rec}=C_1\circ\cdots\circ C_k\circ T_k\circ\cdots\circ T_1(z_0),
\qquad z_{\rm rec}\in\mathcal I.
$$
*(Eq. 51.13)*

[DERIVED] Composition is read right-to-left. In general $z_{\rm rec}\ne z_0$: concurrent legitimate changes, fees, notifications and information disclosure may persist. A compensation sequence itself needs preconditions, authorization, idempotency and a failure ledger.



```figure
{
  "id": "fig-51.15",
  "kind": "calculator",
  "title": "Illustrative stale-state exposure",
  "caption": "Homogeneous Poisson illustration. It is not measured state drift or an approval-lifetime recommendation.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-51.12",
  "alt": "Homogeneous Poisson illustration. It is not measured state drift or an approval-lifetime recommendation.",
  "spec": {
    "tex": "p_{\\rm drift}=1-\\exp(-\\lambda_d\\Delta)",
    "equation": "51.12",
    "inputs": [
      {
        "symbol": "rate",
        "label": "Invalidating changes/second",
        "default": 0.02,
        "min": 0,
        "max": 2,
        "format": "fixed3"
      },
      {
        "symbol": "delay",
        "label": "Preparation-to-commit seconds",
        "default": 30,
        "min": 0,
        "max": 600,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "result",
        "label": "At least one change",
        "formula": "1-exp(-rate*delay)",
        "format": "percent"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Begin by classifying the actual effect domain: reads that disclose sensitive data, durable writes, external communications, resource allocation and irreversible physical or financial actions. A nominal read can still exfiltrate data to a model or external client. A generic readOnly annotation cannot substitute for inspecting the implementation and threat boundary.

[DERIVED] Construct the concrete change artifact before seeking approval when approval is required by the task's policy. Include target identity, exact change, expected state, cost/limits and recoverability. Preserve already granted authorization when its scope covers the action; request a new decision only when the action exceeds that scope or material facts change. Bind the approved artifact to dispatch so later generation cannot silently alter it.

[DERIVED] A dry run must disclose its meaning. It may parse and validate without contacting the backend, ask the backend to validate without committing, or execute against a disposable isolated state. These provide different evidence. A “preview” endpoint might still allocate resources or trigger logs; its no-effect claim requires a contract, not a name. Differences between sandbox and live permissions, inventory and state limit transfer.

[DERIVED] For one state owner, use a transactional compare-and-update when available. An illustrative account balance of 10 cannot safely authorize two concurrent withdrawals of 6 from separate stale reads. A locked/serializable transaction or correctly implemented version check can reject one; repeated preflight checks outside the commit transaction cannot eliminate the race. For multi-owner effects, identify each commit boundary and whether atomic distributed coordination actually exists.

[DERIVED] Where atomic all-or-nothing execution is unavailable, retain a durable step journal and choose forward recovery or compensation under a declared policy. Never compensate a step merely because its response was lost: reconcile whether it committed and identify its operation before acting. Compensation must respect concurrent updates and current authority. If recovery becomes impossible or unauthorized, expose the partial terminal state.

[PAPER-REPORTED] Sagas explicitly associate subtransactions with compensation and discuss recovery/logging and failures of compensation; the paper also distinguishes forward recovery from backward recovery [R51.19, §§2–7]. This historical method provides a lineage for journals and compensating workflows, not a source-reported modern agent performance result.

[DERIVED] **Cost.** Preparation, validation and approval add latency before commit. Holding locks across user think time retains scarce resources and increases contention; releasing them requires version revalidation. A $k$-step journal stores at least operation/status references per step, plus result/provenance bytes. Compensation can add up to $k$ additional effectful operations for a simple linear reverse path, with its own retries and deadlines. Audit retention, redaction and access control also consume storage and operational work.



```figure
{
  "id": "fig-51.16",
  "kind": "diagram",
  "title": "Proposal-bound commit",
  "caption": "Preparation creates a durable proposal; applicable authority and current state are checked at the commit boundary.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.12",
  "alt": "Preparation creates a durable proposal; applicable authority and current state are checked at the commit boundary.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "Prepared proposal"
      },
      {
        "id": "p",
        "kind": "memory",
        "label": "Persist before dispatch"
      },
      {
        "id": "g",
        "kind": "boundary",
        "label": "Scope and state check"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "Commit"
      },
      {
        "id": "o",
        "kind": "feedback",
        "label": "Journaled recovery"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "p"
      },
      {
        "from": "p",
        "to": "g"
      },
      {
        "from": "g",
        "to": "e"
      },
      {
        "from": "e",
        "to": "o"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 51.5 — Bounded proposal-bound commit and recovery.** [DERIVED] Inputs are a finite sequence of integer length $0\le n_{\rm steps}\le K$ steps, authoritative state interfaces, standing authorization or required approval records, integer recovery budget $k_{\rm rec}\ge0$ and absolute deadline. Output is committed success, known partial state, compensated acceptable state or unresolved recovery.

$$
\begin{aligned}
1.&\quad J\leftarrow\operatorname{LoadDurableJournalOrCreate};\
n_{\rm steps}=0\Rightarrow\operatorname{VerifyPostconditionAndReturn}(J);\\
 &\quad \operatorname{ReconcilePreviouslyPreparedUnknowns}(J)\text{ within budget};\
i\leftarrow\operatorname{FirstUnfinishedStep}(J).\\
2.&\quad \operatorname{AllStepsKnownComplete}\Rightarrow
\operatorname{VerifyPostconditionAndReturn}(J);
\quad\operatorname{DeadlineReached}\Rightarrow\operatorname{GoTo}(6);\\
 &\quad u_i\leftarrow\operatorname{LoadPreparedProposalOrPrepareOnce};
\quad\operatorname{PersistPreparedOperation}(J,i,u_i).\\
3.&\quad \operatorname{RequiredAuthorityMissing}\Rightarrow
\operatorname{Return}(J,\mathrm{partial/awaiting\ decision},u_i);\\
 &\quad \neg\operatorname{CommitAllowed}(u_i,\alpha_i,s,t)
\Rightarrow\operatorname{PersistRejected};\,\operatorname{GoTo}(6).\\
4.&\quad z_i\leftarrow\operatorname{ExecuteVia}_{51.4}(u_i);
\quad\operatorname{PersistObservedOutcome}(J,i,z_i).\\
5.&\quad z_i=\mathrm{known\ committed}\land i<n_{\rm steps}
\Rightarrow i\leftarrow i+1;\,\operatorname{GoTo}(2);\\
 &\quad \operatorname{AllRequiredStepsKnownComplete}\Rightarrow
\operatorname{VerifyPostconditionAndReturn}(J).\\
6.&\quad \operatorname{ReconcileUnknownEntries}(J)\text{ within remaining budget};\\
 &\quad \operatorname{PolicyAllowsRecovery}\Rightarrow
\operatorname{RunJournaledAuthorizedRecovery}_{\le k_{\rm rec}};\\
7.&\quad \operatorname{Return}(J,\operatorname{VerifiedFinalOrPartialState}).
\end{aligned}
$$

[DERIVED] The journal, recovery counters, ownership and deadline survive restart. PREPARED is persisted before dispatch; after a crash it denotes possible execution until reconciliation resolves it. An unreconciled prior step may not be redispatched unless Algorithm 51.4's repeat-safety gate permits it; otherwise return the unresolved journal. A zero-step workflow still checks the task postcondition. It does not prove no effect. Each recovery operation also follows §§51.4–51.5 rather than bypassing journaling. Every next step obtains applicable authorization and current preconditions; changing a prepared proposal requires a new bound authorization where necessary.

[DERIVED] Invariants are no execution outside scope, no regenerated proposal after approval, no invented inverse and no “rolled back” label without verified recovery. All preparation/reconciliation/recovery calls have bounds; exhausting them preserves partial/unknown state and the reviewable pending proposal.

## Implementation

[OFFICIAL-DOCUMENTATION] MCP stateful-tool guidance uses explicit application handles and recommends validating authorization on every authenticated handle call [R51.1, Stateful Tools]. Tool annotations remain untrusted hints unless their server is trusted. A “non-destructive” hint does not establish a transaction or exemption from application policy.

[DERIVED] Journals should bind task, logical operation, attempt, principal, proposal digest, state version and observed outcome. Record the approving authority and its actual scope without copying secrets into the model trace. Separate an immutable audit event from mutable workflow status so a later compensation does not overwrite evidence that an earlier effect occurred.

[DERIVED] Isolation must be enforced outside the model: scoped credentials, filesystem/network policy, resource quotas and separate state domains as appropriate. A disposable environment is useful only if its credentials, mounts and network paths cannot mutate production resources. A dry-run flag passed to a powerful tool is weaker than an enforced execution boundary.

## Experimental design

### Reported experiments

[PAPER-REPORTED] τ-bench tasks encode domain policies and expected outcomes; some policy constraints are API-enforced and others depend on the agent [P43, §3/Appendix B]. Its final-state evaluator can therefore miss a transient policy violation even when the desired database is reached. The study does not provide a distributed transaction/compensation benchmark.

[PAPER-REPORTED] τ²-bench's telecom tasks combine initialization, solution and assertion functions, and evaluate final-state assertions in that domain [R51.8, §§3.2–3.3]. This improves controlled environment coverage, while leaving live financial, communication and cross-service compensation outside the disclosed experiment.

## Observations

**What the paper claims.** [PAPER-REPORTED] Sagas manage partial long-lived transactions with explicit recovery; task benchmarks assess constrained tool-mediated environment outcomes [R51.19; P43; R51.8].

**What the evidence shows.** [PAPER-REPORTED] The sources reconstruct recovery obligations or test simplified environments; they do not certify arbitrary irreversible effects or user understanding of approvals.

**What we infer.** [DERIVED] Commit-time authority/state checks and durable partial-effect records are necessary parts of a defensible executor.

**What remains unknown.** [NOT-DISCLOSED] No inspected matched study measures current agent approval binding, compensation success and residual harm across live services.



```figure
{
  "id": "fig-51.17",
  "kind": "stat-panel",
  "title": "Contract boundary to retain",
  "caption": "These distinctions constrain claims; they are not measured deployment results.",
  "placement": "rail",
  "anchor": "observations",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.12",
  "alt": "Four relevant execution boundaries remain explicit.",
  "spec": {
    "header": "EXECUTION CONTRACT",
    "rows": [
      {
        "key": "prepare",
        "value": "Concrete proposal plus version"
      },
      {
        "key": "approve",
        "value": "Applicable scope bound to proposal"
      },
      {
        "key": "commit",
        "value": "Atomic state/authority check"
      },
      {
        "key": "recover",
        "value": "New authorized journaled action"
      }
    ]
  }
}
```

## Failure modes

[DERIVED] Proposal drift changes recipients or values after review; bind and compare the concrete artifact. Stale approval authorizes obsolete state; recheck version/preconditions. Dry-run leakage changes production resources during preview; isolate credentials/state and audit effects. Lost commit response triggers wrongful compensation; reconcile first. Blind inverse overwrites concurrent valid work; use semantic compensation. Audit overcollection leaks secrets; redact and restrict access. Compensation failure leaves an unresolved obligation; retain it instead of declaring success.

## Siblings

[DERIVED] Local transactions offer a different atomicity/isolation scope from multi-service sagas. Two-phase coordination requires compatible participants and operational assumptions; a model cannot create that contract by planning a sequence. Human approval, standing workflow authorization and automatic policy enforcement differ in authority source, not in the need to bind the action. Chapter 53 owns long-term state consistency; Chapter 65 owns broader privacy/security/safety treatment.

## Extensions

### Improvements

[DERIVED] A stronger workflow moves from generic permission prompts to concrete proposal binding, commit-time validation and explicit recovery journals. The changed mechanism is enforceable scope and state evidence; no measured improvement is asserted. Historical sagas explain why compensation and forward recovery must be designed with the underlying system rather than improvised after a model error.

[DERIVED] Open research concerns communicating partial/irreversible effects to users without obscuring uncertainty, and validating compensation under concurrent actors. Evidence must include actual commit/recovery boundaries, residual outcomes and human task understanding; a final textual success label cannot settle either question.

## Limitations

[DERIVED] Eq. 51.11 specifies a gate, not a universal authorization language. Eq. 51.12 assumes a Poisson drift model; real changes can be bursty or adversarial. Eq. 51.13 does not guarantee that compensations exist or succeed. Some actions require preventive restriction because no acceptable recovery can restore the relevant invariant.

## Reproducibility

[UNVERIFIED] Required artifacts include proposal/approval scopes, state-version semantics, journal persistence, transaction guarantees, compensation contracts, isolation configuration and exact partial-effect observations. No live write, approval flow or recovery was executed. Proposed fault/partial-effect checks remain in verification.md.

## References

[PAPER-REPORTED] [R51.19](references.md#r51-19) Sagas; [P43](references.md#p43) τ-bench; [R51.8](references.md#r51-8) τ²-bench. [OFFICIAL-DOCUMENTATION] [R51.1](references.md#r51-1) Stateful Tools. Access 2026-10-14.
