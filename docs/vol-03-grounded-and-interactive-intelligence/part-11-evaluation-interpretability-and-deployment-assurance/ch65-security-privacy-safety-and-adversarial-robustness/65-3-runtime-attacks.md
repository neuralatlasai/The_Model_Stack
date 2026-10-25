---
id: ms.section.65.3
entity_type: section
title: "Runtime attacks"
volume: 3
part: 11
chapter: 65
section: 65.3
slug: 65-3-runtime-attacks
parent: ms.chapter.65
prev_sibling: ms.section.65.2
next_sibling: ms.section.65.4
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.24, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36, ms.chapter.46, ms.chapter.47, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64]
downstream: [ms.chapter.66]
related: [ms.chapter.30, ms.chapter.42, ms.chapter.48]
relations: []
axes: {lifecycle: [pretraining, post_training, inference, evaluation, assurance], mechanism: [security_boundary, privacy_accounting, adversarial_evaluation], feedback_setting: [], modality: [text, code, image, tool_trajectory]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 65.3 - Runtime attacks

## Scope

[DERIVED] Runtime attacks include direct jailbreaks, indirect instructions in retrieved material, manipulated tool outputs, credential exposure and unauthorized actions. Persistent memory creates a cross-request surface. A refusal bypass and a state-changing authorization failure must be scored separately.

## Why this exists

[DERIVED] Instruction hierarchy is useful model behavior, but runtime permissions determine which consequences a mistake can cause. A retrieved document cannot become an authenticated user merely by describing a new instruction. A model-generated statement that approval occurred cannot replace a verifiable approval event.

## Intuition

[DERIVED] The model sees many strings through one sequence interface; the application must preserve their different trust and authority. Text from a tool may be evidence about a task, while permission to read another tenant's record or send a network request must come from an external principal and policy. The security boundary fails when evidence is promoted into authority without validation.

## Formulation

[MATHEMATICALLY-DERIVED] Let q_t be the conditional probability of first success at attempt t given no previous success, under the declared adaptive attack protocol. Then

$$
 ASR@B=1-\prod_{t=1}^B(1-q_t).
$$
*(Eq. 65.9)*

[DERIVED] This chain-rule identity does not require independent attempts; the conditional hazards incorporate feedback and selection. The common specialization 1-(1-p)^B requires equal conditional hazards p. A marginal one-shot success estimate cannot automatically be substituted for every q_t of an adaptive attacker. ASR@B is monotone in B for a nested attempt sequence, but comparisons with different attack policies or reset conditions need not isolate budget effects.

[MATHEMATICALLY-DERIVED] A capability broker can enforce

$$
 \mathcal C_{effective}=\mathcal C_{user}\cap\mathcal C_{runtime}\cap
 \mathcal C_{resource}\cap\mathcal C_{task}.
$$
*(Eq. 65.10)*

[DERIVED] Each set is a server-verified permission scope, including resource identity, operation and lifetime. An action must belong to the intersection at execution time. Model text cannot enlarge a set. This intersection is useful only if every relevant execution path consults the broker and credentials cannot bypass it.

[MATHEMATICALLY-DERIVED] For delivery event D and activation event A,

$$
 \Pr[D\cap A]=\Pr[D]\Pr[A\mid D].
$$
*(Eq. 65.11)*

[DERIVED] Multiplying marginal delivery and activation rates assumes an independence or invariance that the deployed pipeline may violate. A reranker changes which payloads reach the model; the conditional activation distribution can change with it. Measure the composed system rather than inferring an end-to-end rate from separate tables.

[MATHEMATICALLY-DERIVED] In a hypothetical independent-turn model with success probability p, two new fields per successful turn and a ten-field profile, the expected fields recovered after t turns is

$$
 E_t=\sum_{j=0}^t\min(2j,10){t\choose j}p^j(1-p)^{t-j}.
$$
*(Eq. 65.12)*

[DERIVED] This is an analytical occupancy model, not a record of actual extraction. Repeated fields, adaptive state, correlated failures and access controls violate its premises. Probability all t turns succeed, p^t, differs from probability at least one succeeds and from expected distinct fields.

```figure
{
  "id": "fig-65.9",
  "kind": "diagram",
  "title": "Untrusted content may propose; a broker decides",
  "caption": "The model proposes an action from mixed-trust context. Resource, principal and destination checks occur outside that context.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.9",
  "alt": "The model proposes an action from mixed-trust context. Resource, principal and destination checks occur outside that context.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "u",
        "kind": "node",
        "label": "Authenticated user/task"
      },
      {
        "id": "d",
        "kind": "dataset",
        "label": "Untrusted retrieved/tool content"
      },
      {
        "id": "m",
        "kind": "model",
        "label": "Action proposal"
      },
      {
        "id": "b",
        "kind": "boundary",
        "label": "Capability and destination broker"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Bounded mock side effect"
      }
    ],
    "edges": [
      {
        "from": "u",
        "to": "m",
        "kind": "flow",
        "label": "task"
      },
      {
        "from": "d",
        "to": "m",
        "kind": "flow",
        "label": "evidence only"
      },
      {
        "from": "m",
        "to": "b",
        "kind": "flow",
        "label": "typed request"
      },
      {
        "from": "u",
        "to": "b",
        "kind": "dependency",
        "label": "verified scope"
      },
      {
        "from": "b",
        "to": "s",
        "kind": "flow",
        "label": "authorized execution"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] Back-Reveal assumes attacker-fine-tuned open weights, attacker-controlled retrieval service, memory access and outbound connectors. Its sandbox uses synthetic user information. Table 8 measures payload delivery through reranking/filters, not end-to-end exfiltration. Section 4.5's multi-turn profile extraction is an analytical stationary-turn model, rather than an executed multi-turn trace. These assumptions are substantially stronger than prompt-only access to an immutable closed service. [R65.2, Sections 3.1,4.1,4.4-4.5; Table 8]

[PAPER-REPORTED] Adaptive Adversaries v2 gives the attacker history/feedback while the defender normally starts fresh each attempt. The frontier evaluation has945 battles,15 rounds and only five battles per scenario/pair. It has no real tools, retrieval or external state changes; synthetic/output-based criteria bound agent-security conclusions. The same saved trajectories rise from low first-round success to higher ASR@15. Provenance text helps selected scenarios but leaves memory-leak18/45 unchanged. Pooling three attackers spends three times the battle budget. [R65.5, Sections 3-6; Tables1-3; Appendix B]

[OFFICIAL-DOCUMENTATION] Static inspection of the pinned originating defender shows conversation-ID-keyed history; reset semantics also depend on the caller. The memory-leak criterion can disregard an emitted synthetic secret when nearby refusal wording matches its exclusion rule. That is a scoring policy, not evidence that information did not appear. No model or competition run was executed here. [R65.11, defender agent and memory-leak plugin]

```figure
{
  "id": "fig-65.10",
  "kind": "compare",
  "title": "Protocol choices change the attack event",
  "caption": "Output-based success is useful within its scope; actual state changes need an execution oracle.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.10",
  "alt": "Output-based success is useful within its scope; actual state changes need an execution oracle.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "choice",
        "label": "Choice"
      },
      {
        "id": "meaning",
        "label": "What it tests"
      },
      {
        "id": "gap",
        "label": "What remains"
      }
    ],
    "rows": [
      {
        "dimension": "Fresh defender",
        "values": {
          "choice": "Reset context each attempt",
          "meaning": "Attacker learns across independent sessions",
          "gap": "Persistent-memory behavior"
        }
      },
      {
        "dimension": "Persistent defender",
        "values": {
          "choice": "Keep defender context",
          "meaning": "History can help or hurt resistance",
          "gap": "Confounded if attacker prompt also changes"
        }
      },
      {
        "dimension": "Output oracle",
        "values": {
          "choice": "Pattern/judge over generated text",
          "meaning": "Scored textual violation",
          "gap": "Actual resource access or side effect"
        }
      },
      {
        "dimension": "Execution oracle",
        "values": {
          "choice": "Inspect mock state/egress",
          "meaning": "Authorized versus executed transition",
          "gap": "Faithfulness to production environment"
        }
      }
    ]
  }
}
```

## Algorithm

### Algorithm 65.3 — Mediate an attacker-influenced action

[DERIVED] Inputs: typed model proposal, authenticated task snapshot and a resource-scoped broker. Outputs: rejected, staged, committed or uncertain action state, with audit identity.

1. Parse against the tool schema and reject unknown fields/types; preserve the provenance of all arguments.
2. Resolve resource, tenant, operation and destination from verified runtime identities. Do not accept a retrieved string or model assertion as an authorization token.
3. Intersect current user/runtime/resource/task permissions; check destination allowlists, secret isolation and operation-specific invariants.
4. For a consequential action, bind any required approval to the exact normalized action and version; reject changed arguments or expired state.
5. Execute through the sole permitted path under a bounded capability. Record actual mock state/egress, not only a model's report of execution.
6. On timeout or ambiguous acknowledgment, mark uncertain and reconcile through the canonical execution protocol; never infer safe failure from a missing response.

[DERIVED] Canonical retry/idempotency semantics belong to @ms.chapter.51. Security adds the requirement that the same identity, authorization and destination constraints survive retries and reconciliation. Parsing is linear in proposal length; permission evaluation depends on policy/index complexity; model and tool latency dominate many deployments. A permissive fallback destroys the invariant even if the common path is strict.

## Implementation

[DERIVED] Sandbox tools and loaders with explicit filesystem/network boundaries. Prevent metadata endpoints, redirect chains, DNS rebinding and alternative protocols from bypassing egress policy; validate the actual resolved destination and each redirect. The July 28MCP guidance describes these classes and confused-deputy risks, but reading documentation is not a test of this application's implementation [R65.10].

[DERIVED] Memory is data until promoted into a new task context. Store principal, tenant, task, retention and source provenance alongside entries; enforce access at query time and validate state before actions. A poisoned summary can persist an unauthorized instruction even if the original document is removed. Treat deletion, derived summaries, embeddings, caches and logs as a connected retention problem.

```figure
{
  "id": "fig-65.11",
  "kind": "calculator",
  "title": "Budget amplification under constant conditional hazard",
  "caption": "Specialization of Eq.65.9 to q_t=p at every surviving attempt. Adaptive hazards need not be constant.",
  "placement": "rail",
  "anchor": "implementation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-65.9",
  "alt": "Specialization of Eq.65.9 to q_t=p at every surviving attempt. Adaptive hazards need not be constant.",
  "spec": {
    "equation": "65.9",
    "tex": "ASR@B=1-(1-p)^B",
    "inputs": [
      {
        "symbol": "p",
        "label": "Constant conditional success probability",
        "default": 0.01,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "B",
        "label": "Attempts in the same protocol",
        "default": 15,
        "min": 1,
        "max": 1000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "asr",
        "label": "At least one success",
        "formula": "1-(1-p)^B",
        "format": "percent"
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[DERIVED] Experiment 65.3 proposes synthetic indirect instructions in local retrieved/tool content, with both output and mock execution-state oracles. Fresh/persistent defender state and attacker feedback are separate factors. Equal-budget attacker diversity is compared against additional budget; held-out benign tasks use the same application controls.

## Observations

**What the paper claims.** [PAPER-REPORTED] Back-Reveal composes malicious learned behavior with tool interfaces; Adaptive Adversaries reveals failures missed by one-shot scoring [R65.2,R65.5].

**What the evidence shows.** [DERIVED] Attacker-controlled weights, synthetic state, output criteria, reset rules and interaction budgets restrict what transfers to another application.

**What we infer.** [DERIVED] Permission mediation can limit the consequence of a model mistake even when textual robustness is imperfect, if all execution paths are covered.

**What remains unknown.** [UNVERIFIED] The residual error of any particular production broker and robustness against unknown adaptive strategies are not measured here.

## Failure modes

[DERIVED] Common failures are treating authenticated tool transport as trusted content, authorizing from model prose, leaking secrets through logs or monitor rationales, admitting an egress bypass, and scoring a refusal containing a secret as safe. A stronger attacker model cannot be silently attributed to a weaker prompt-only test.

## Siblings

[DERIVED] @ms.chapter.51 owns protocol/execution, @ms.chapter.53 memory and @ms.chapter.63 reliability. @ms.section.65.4 evaluates layered controls; @ms.section.65.6 distinguishes an empirical frontier from a complete risk bound.

## Extensions

### Improvements and their evidence

[DERIVED] Prefer structural privilege removal when a task does not require the contested capability. If the task requires it, use narrow mediation and test legitimate completion. Add provenance or monitors when held-out tests show complementary benefit; reverse the choice if they only shift failures, expose additional information or create unacceptable false refusals. Independent control failures must be demonstrated before multiplying their miss probabilities.

## Limitations

[DERIVED] No live service, private memory or credentials were attacked. The analytical extraction model is explicitly hypothetical. Output benchmarks and static code inspection do not establish execution safety.

## Reproducibility

[DERIVED] Pin model/harness/scorer, attacker budget/feedback, session IDs, reset semantics, mock state, action approvals and destination resolution. Preserve attempted/blocked/executed/uncertain outcomes separately.

## References

[R65.2,R65.5,R65.10,R65.11] Exact sources, inspected locations and uncertainty: @ms.references.65.
