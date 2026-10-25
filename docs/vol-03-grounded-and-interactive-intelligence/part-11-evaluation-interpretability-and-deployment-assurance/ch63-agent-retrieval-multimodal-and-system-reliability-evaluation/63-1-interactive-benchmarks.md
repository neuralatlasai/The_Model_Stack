---
id: ms.section.63.1
entity_type: section
title: "Interactive benchmarks"
volume: 3
part: 11
chapter: 63
section: 63.1
slug: 63-1-interactive-benchmarks
parent: ms.chapter.63
prev_sibling: null
next_sibling: ms.section.63.2
children: []
prerequisites: [ms.chapter.6, ms.chapter.62]
downstream: [ms.chapter.65, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [evaluation_validity], feedback_setting: [], modality: [text, image, audio, video]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 63.1 Interactive benchmarks

## Scope

[DERIVED] Interactive evaluation measures a closed loop: the agent observes a state, chooses an action, receives an environment response and updates its next action. The evaluated object includes the policy, scaffold, tools, credentials, environment reset, time budget and verifier. This section covers repository repair, terminal work, customer-service interaction and browser/desktop use. Their scores do not share a common unit of capability. Use [Chapter 61](../ch61-capability-portfolios-and-benchmark-validity/README.md) to select a portfolio and [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md) to validate judgment predicates. Here the output is a versioned episode contract with separate completion, policy and state-integrity gates.

## Why this exists

[DERIVED] A patch can satisfy selected tests while violating an unstated requirement. A support agent can return the requested words after updating the wrong account. A desktop agent can display a successful dialog before a write is durable. Final-text grading loses these distinctions. The evaluation must establish what actions were allowed, what state change was required, which unrelated invariants must survive and when the system is considered finished. Otherwise a better score may reward access to a hidden solution, a permissive verifier or discarded timeouts.

## Intuition

[DERIVED] A static question has a mostly fixed input; an interactive policy changes its future inputs. More tool access can reveal useful evidence and also create new failure opportunities. A browser observation depends on page load and prior actions; a terminal command can permanently modify the repository. Resetting the screen without resetting the database does not produce the same initial state. The experimental unit is therefore an offered task episode, with its environment identity and complete action history, rather than an isolated model response.

## Formulation

[MATHEMATICALLY-DERIVED] Let $x=(s_0,i,v)$ contain initial state, instruction and an immutable protocol/environment version. At step $t$, observation $o_t$ follows an observation kernel $O_v(o_t\mid s_t)$, action $a_t$ is sampled from $\pi_v(\cdot\mid h_t)$ using allowed history $h_t=(i,o_0,a_0,\ldots,o_t)$, and $s_{t+1}\sim T_v(\cdot\mid s_t,a_t)$. For a finite horizon $H$ or earlier terminal state,

$$
P_v(\tau\mid x)=\prod_{t=0}^{H-1}O_v(o_t\mid s_t)\pi_v(a_t\mid h_t)T_v(s_{t+1}\mid s_t,a_t).
$$
*(Eq. 63.1)*

[DERIVED] The displayed density uses an environment state sufficient for the transition kernel; hidden server state, user responses and simulator randomness belong in that state or its exogenous inputs. History truncation in the agent does not justify dropping relevant environment state from the experimental record.

$$
Y=G_{\rm task}G_{\rm policy}G_{\rm integrity}G_{\rm deadline},\qquad \widehat q_{\rm offered}=\frac{1}{N}\sum_{j=1}^{N}Y_j.
$$
*(Eq. 63.2)*

[DERIVED] Each gate is binary and defined independently of the agent's declaration. All $N\ge1$ offered episodes remain in the denominator; infrastructure outcomes can additionally receive an explicit unresolved category and bounded sensitivity analysis. A useful three-gate specialization of the probability chain rule is

$$
q=P(A\cap B\cap C)=a\,b\,c,\quad a=P(A),\quad b=P(B\mid A),\quad c=P(C\mid A\cap B).
$$
*(Eq. 63.3)*

[DERIVED] This product requires positive conditioning probabilities for the stated conditional factors. Its calculator uses illustrative $a,b,c\in[0,1]$ and a product extension at zero. It does not multiply three marginal pass rates or establish independence.

```figure
{
  "id": "fig-63.3",
  "kind": "calculator",
  "title": "Joint success needs conditional gates",
  "caption": "Eq. 63.3 chains conditional probabilities; the inputs are not three marginal benchmark scores.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-63.3",
  "alt": "Eq. 63.3 chains conditional probabilities; the inputs are not three marginal benchmark scores.",
  "spec": {
    "tex": "q=a\\,b\\,c",
    "equation": "63.3",
    "inputs": [
      {
        "symbol": "a",
        "label": "First-gate probability",
        "default": 0.9,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "b",
        "label": "Second gate conditional on first",
        "default": 0.95,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "c",
        "label": "Third gate conditional on first two",
        "default": 0.98,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "joint",
        "label": "Joint gate probability",
        "formula": "a*b*c",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Conditional chain",
      "variables": {
        "a": 0.9,
        "b": 0.95,
        "c": 0.98
      },
      "note": "Three conditional gates define the joint event.",
      "highlight": [
        "joint"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "Better completion only",
      "variables": {
        "a": 0.98,
        "b": 0.95,
        "c": 0.98
      },
      "note": "Completion can improve while later obligations remain.",
      "highlight": [
        "joint"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Policy/integrity obstruction",
      "variables": {
        "a": 0.98,
        "b": 0.5,
        "c": 0.8
      },
      "note": "A strong first gate cannot compensate for later failures.",
      "highlight": [
        "joint"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Define the task family before selecting the verifier. SWE-bench variants evaluate repository patches against release-specific tests; Full, Lite, Verified, Multilingual, Multimodal and Pro releases are distinct populations. Terminal-Bench evaluates command-line tasks with task-specific environments and verifiers. The $\tau$ family introduces user interaction, policy and database-state requirements; agent-construction variants also evaluate the delivered agent. Browser/computer-use families add visual grounding, focus, timing and persistent application state. These are family locators, not newly dated publications or interchangeable leaderboards.

[DERIVED] A protocol must specify reset completeness, credentials, network access, visible repository history, dependency services, user simulator, observation/action interfaces, maximum steps, wall clock, model budget, cancellation and terminal scoring. Separate legal agent-visible tests from held-out evaluator artifacts. Verifier repair changes the measurement and requires a new version; the original score is not retrospectively evidence for the corrected protocol. Qualify a task using an independently checked valid solution, a no-operation control and adversarial invalid solutions that exercise the actual acceptance predicate.

```figure
{
  "id": "fig-63.4",
  "kind": "diagram",
  "title": "Freeze the full interactive loop",
  "caption": "Versioned observations, actions and state transitions feed an independent verifier; an agent declaration is not a terminal-state proof.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.1",
  "alt": "Versioned observations, actions and state transitions feed an independent verifier; an agent declaration is not a terminal-state proof.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Task + initial state"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Observe and act"
      },
      {
        "id": "n2",
        "kind": "state",
        "label": "Environment transition"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Quiesce and verify"
      },
      {
        "id": "n4",
        "kind": "metric",
        "label": "Gate vector + offered ledger"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2"
      },
      {
        "from": "n2",
        "to": "n1",
        "label": "next observation"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "terminal or limit"
      },
      {
        "from": "n3",
        "to": "n4"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 63.1 — Qualify and execute an interactive task.**

[DERIVED] **Inputs:** finite task set, frozen episode contract, reset/checkpoint procedure, scoped agent, independent verifier and resource limits. **Outputs:** offered-episode ledger and gate vector.

1. Materialize a new environment from pinned images, data and configuration; verify the initial-state digest and readiness. Mark readiness failure explicitly before starting the agent clock.
2. Audit the information boundary and verifier secrecy. Run the qualified solution and no-operation/invalid controls on separate resets. Reject the task version if these do not separate the intended behaviors.
3. Register an offered episode ID before launch. Start a monotonic clock, trace observations/actions and count all model/tool usage.
4. Execute until explicit submission, task terminal state or finite step/time/resource limit. Treat model timeout, invalid action and missing output as recorded outcomes. Apply only the prespecified infrastructure retry rule, retaining parent/child attempt IDs.
5. Cancel and confirm quiescence before evaluation or use an isolated evaluator snapshot. Inspect task, policy, integrity and deadline gates without trusting the agent's claim.
6. Publish all gate outcomes, unresolved cases, costs and reset/version hashes; terminate after the finite registered episodes and bounded cleanup.

[DERIVED] The evaluator has no unrestricted authority to repeat an unfavorable run. A rejected launch and a completed failed episode are different ledger states; neither disappears from the accounting.

## Implementation

[DERIVED] Separate evaluator and agent trust domains. The agent should not be able to edit grading scripts, read reference patches, alter telemetry or inherit credentials to the hidden control plane. Content hashes alone do not enforce isolation. Preserve required build dependencies while removing future solution artifacts; indiscriminate deletion can change task feasibility. Container digests pin filesystem layers but do not freeze an external website, hosted model or simulator service. Record these dependencies and qualify drift controls.

[DERIVED] A practical artifact stores task/version, environment reset ID, model and scaffold revisions, visible tools, allowed side effects, resource limits, monotonic timestamps, actions, returned data, terminal reason and verifier version. Use a full-history clock for the user-facing boundary; report infrastructure setup separately. Verify asynchronous writes after agent termination so a still-running child process cannot repair the environment during scoring. [Chapter 47](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/README.md) supplies recovery and ownership principles; [Chapter 54](../../part-09-retrieval-context-and-agent-systems/ch54-multi-agent-coordination-and-system-level-evaluation/README.md) supplies tool/agent architecture.

## Experimental design

[ASSUMED] Compare two frozen scaffolds on matched tasks and independent environment resets, blocking by repository/application and task family. Hold the model, allowed information, evaluation predicates, reset procedure and offered budgets fixed when estimating a scaffold effect. When changing an information boundary, report the intervention as a different protocol rather than pure model progress. Include verified-valid, no-op and plausible-invalid submissions; report false acceptance and false rejection on these controls. [Experiment 63.1](verification.md#experiment-631--repeats-and-environment-control) proposes a repeated-run extension; no runs are reported here.

## Observations

**What the paper claims.** [PAPER-REPORTED] SWE-Bench Pro Verified v3 combines anti-leakage controls with refinement of 102 of 731 instances [R63.1, §§3–4].

**What the evidence shows.** [PAPER-REPORTED] Its protected and refined conditions are separate comparisons, with model-dependent score changes; the audit concerns observed channels, not proof that every leakage route is closed [R63.1, Tables 2–3].

**What we infer.** [DERIVED] Verifier quality and permitted information are experimental factors. A score change after jointly changing them does not isolate a model capability change.

**What remains unknown.** [UNVERIFIED] We have not executed these environments or established their transfer to the reader's repositories.

## Failure modes

> **Failure mode — Passing the evaluator through its workspace.** [DERIVED] *Symptom:* a submission passes without the requested behavior. *Cause:* reference artifacts, writable grading state or a weak acceptance predicate are accessible. *Detection:* inspect traces and challenge the verifier with semantically invalid submissions on clean resets. *Mitigation:* isolate grading, remove forbidden information while preserving task feasibility, and issue a new protocol version after repair.

[MATHEMATICALLY-DERIVED] Marginal completion and policy pass rates of $0.9$ each permit a joint rate anywhere from $0.8$ to $0.9$, since $\max(0,P(A)+P(B)-1)\le P(A\cap B)\le\min(P(A),P(B))$. Their product $0.81$ is a particular dependence model, not an identified joint success rate. A test suite can also accept every patch that returns a constant while missing the intended input-dependent behavior; no repetition of that suite repairs its validity.

```figure
{
  "id": "fig-63.5",
  "kind": "compare",
  "title": "Task success and verifier acceptance",
  "caption": "A valid evaluator needs both acceptance of intended behavior and rejection of plausible invalid behavior.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.2",
  "alt": "A valid evaluator needs both acceptance of intended behavior and rejection of plausible invalid behavior.",
  "spec": {
    "axis": "Two control directions",
    "columns": [
      {
        "id": "a",
        "label": "Valid solution"
      },
      {
        "id": "b",
        "label": "Invalid submission"
      }
    ],
    "rows": [
      {
        "dimension": "Expected gate",
        "values": {
          "a": "Accept",
          "b": "Reject"
        }
      },
      {
        "dimension": "Failure exposed",
        "values": {
          "a": "False rejection",
          "b": "False acceptance"
        }
      },
      {
        "dimension": "Required evidence",
        "values": {
          "a": "Qualified solution on reset",
          "b": "Adversarial counterexample on reset"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Use a static unit test when the requirement is a deterministic function with a well-defined oracle. Use an interactive environment when state, permissions, user exchanges or delayed effects are part of the requirement. Reverse a fully simulated design if simulator assumptions determine the desired behavior; add qualified user/workflow evidence. Reverse a live-only design if uncontrolled drift prevents attribution; use pinned replicas and later targeted live validation. Controlled and live evidence answer different questions.

## Extensions

[DERIVED] Add multi-user isolation, requirement changes, temporal data and held-out workflows only with a stated target and oracle. A new interface is useful when it exposes a missing failure mechanism, not merely because it increases episode length. Multimodal tasks need modality provenance, permitted observation times and missing-stream behavior from [Chapters 55–57](../../part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/README.md); a screenshot containing a future answer is still answer leakage.

## Limitations

[DERIVED] Controlled replicas cannot prove operational safety outside their permissions, workloads and time horizon. Human-validated tasks can retain ambiguous specifications or incomplete tests. Network blocking may remove realistic support resources as well as solutions; its collateral effects need controls. The historical family names above do not certify their current release, contamination status or leaderboard comparability.

## Reproducibility

[DERIVED] Archive the episode contract, source/image/data hashes, verified initial and terminal states, reset failures, all offered IDs, retry lineage and acceptance controls. Distinguish static inspection of official code from execution of its environment. The pinned implementation surfaces in [references](references.md) were inspected only; no benchmark replication, model inference or live-system repair was performed.

## References

[R63.1] Zheng et al., inspected v3 (2026-10-09), §§3.1–3.3 and 4.1–4.4, Tables 2–3. Release history and scope are in [references](references.md). Historical benchmark families are connected through [Chapter 61](../ch61-capability-portfolios-and-benchmark-validity/README.md) and do not count as new-window primary papers.
