---
id: ms.section.63.6
entity_type: section
title: "Realistic evaluation"
volume: 3
part: 11
chapter: 63
section: 63.6
slug: 63-6-realistic-evaluation
parent: ms.chapter.63
prev_sibling: ms.section.63.5
next_sibling: ms.verification.63
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

# 63.6 Realistic evaluation

## Scope

[DERIVED] Realistic evaluation asks whether evidence transfers to the intended users, workflows, environments and consequences. It does not mean adding uncontrolled complexity until attribution becomes impossible. This section joins the capability portfolio of [Chapter 61](../ch61-capability-portfolios-and-benchmark-validity/README.md), judgment validity of [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md) and system ledger of this chapter into a bounded release argument. The artifact is a target-distribution reliability report with explicit unresolved conditions, confirmation data and reversal triggers, feeding [Chapter 66](../ch66-release-decisions-reproducibility-and-research-to-production-closure/README.md).

## Why this exists

[DERIVED] A laboratory task can expose an important mechanism while poorly representing ordinary work. Production observations can represent real work while confounding model, user and environment changes. Both are useful if their estimands are stated. A long episode is not automatically realistic; a large task count is not automatically diverse; a live website is not automatically a valid evaluator. The relevant question is whether the test includes the failure mechanisms and support of the claimed use, with trustworthy outcomes.

## Intuition

[DERIVED] Build a sequence of evidence: controlled component tests identify mechanisms; interactive replicas test policy/state behavior; blinded held-out workflows test transfer; shadow evaluation tests traffic and timing without consequential actions; authorized limited operation tests actual outcomes with rollback/escalation. A later stage does not erase an earlier defect. A missing target subgroup, unknown action effect or invalid verifier is a specific evidence gap, not a reason to replace all evaluation with one aggregate leaderboard.

## Formulation

[MATHEMATICALLY-DERIVED] For target distribution $P$ and test distribution $Q$, common loss $0\le L\le1$ and a frozen system,

$$
R_P=\mathbb E_P[L],\qquad R_Q=\mathbb E_Q[L],\qquad |R_P-R_Q|\le\operatorname{TV}(P,Q).
$$
*(Eq. 63.16)*

[DERIVED] This bound uses $\operatorname{TV}(P,Q)=\sup_A|P(A)-Q(A)|$ on a shared measurable task/environment space. It is informative only if distribution distance is bounded; merely naming a realistic benchmark does not bound it. Importance weighting additionally needs target support within the sampled support and controlled weight variance. New workflows or permissions outside support are an evidence gap.

[MATHEMATICALLY-DERIVED] A durability-sensitive operational success event may require

$$
Y_{\rm op}=G_{\rm outcome}G_{\rm scope}G_{\rm data}G_{\rm restart}G_{\rm fresh\ traffic}G_{\rm deadline}.
$$
*(Eq. 63.17)*

[DERIVED] Each gate requires its own qualified predicate and time boundary. A finite soak period checks a declared horizon; it does not certify unlimited durability. A safe unresolved/escalation outcome can be separately useful even when it is not counted as automatic task completion.

[MATHEMATICALLY-DERIVED] For $K\ge1$ prespecified system/stratum claims, $n\ge1$ independent identically distributed Bernoulli failure observations per claim, frozen before evaluation, a deliberately conservative rule is

$$
B(e,n)=\begin{cases}1-(\delta/K)^{1/n},&e=0,\\1,&e>0,\end{cases}\qquad P\{\text{all }K\text{ true failure rates}\le B\}\ge1-\delta.
$$
*(Eq. 63.18)*

[DERIVED] Here $0<\delta<1$ and $e$ is the observed failure count. For a true failure probability $r$ exceeding the zero-failure bound, $P(e=0)=(1-r)^n<\delta/K$; nonzero-error cases return the trivial bound one, and a union bound covers all fixed claims. Correlation between claims is allowed, while observations within each claim must meet the stated independence/sampling premise. The instrument displays the zero-observed-failure branch only. It is a valid but inefficient special construction, not a general interval estimator or a guarantee for adaptive policy search.

```figure
{
  "id": "fig-63.18",
  "kind": "calculator",
  "title": "What zero observed failures can establish",
  "caption": "Eq. 63.18 zero-error branch for fixed claims and independent identically distributed Bernoulli observations. It does not certify adaptively chosen systems or correlated repeats.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-63.18",
  "alt": "Eq. 63.18 zero-error branch for fixed claims and independent identically distributed Bernoulli observations. It does not certify adaptively chosen systems or correlated repeats.",
  "spec": {
    "tex": "B_0=1-(\\delta/K)^{1/n}",
    "equation": "63.18",
    "inputs": [
      {
        "symbol": "n",
        "label": "Independent cases per fixed claim",
        "default": 100,
        "min": 1,
        "max": 100000,
        "format": "integer"
      },
      {
        "symbol": "K",
        "label": "Prespecified claims",
        "default": 1,
        "min": 1,
        "max": 100,
        "format": "integer"
      },
      {
        "symbol": "delta",
        "label": "Family error probability",
        "default": 0.05,
        "min": 0.001,
        "max": 0.2,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "upper",
        "label": "Zero-error failure upper bound",
        "formula": "1-(delta/K)^(1/n)",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "One fixed claim",
      "variables": {
        "n": 100,
        "K": 1,
        "delta": 0.05
      },
      "note": "No observed failure still permits a nontrivial failure rate.",
      "highlight": [
        "upper"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "More independent evidence",
      "variables": {
        "n": 10000,
        "K": 1,
        "delta": 0.05
      },
      "note": "More independent cases narrow the bound.",
      "highlight": [
        "upper"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Many fixed claims",
      "variables": {
        "n": 100,
        "K": 50,
        "delta": 0.05
      },
      "note": "Simultaneous claims require their multiplicity to be covered.",
      "highlight": [
        "upper"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Define the target with user/task distribution, language/modality mix, accessible evidence, tool permissions, side-effect severity, horizon, concurrency and arrival pattern. Include ordinary cases and explicitly weighted rare consequential cases; their weights serve different purposes from an adversarial suite. Split by workflow/repository/user or incident family so development cannot learn a near-duplicate evaluation path. Freeze the system and outcome predicates before the confirmation sample.

[DERIVED] Separate simulator validity from agent performance. A simulated user can reveal requirements consistently and still omit human disagreement, interruptions or behavior shifts. A privileged reference may exploit information unavailable to either the evaluated agent or a typical professional. Qualify both sides of a verifier with valid and invalid controls; a no-op failing is necessary for an informative repair task but not sufficient to reject all unsafe repairs. Verify after the agent is quiescent, under fresh traffic and restart where required.

[DERIVED] During limited operation, record intervention and feedback loops. Users may avoid difficult tasks after failures, operators may silently repair outcomes, and accepted traffic may become easier under admission control. These mechanisms change the observed distribution. Log offered requests, escalations and human repairs, and define an intention-to-treat or another explicitly justified estimand. A completion rate conditional on accepting a task is different from an offered-task service rate.

```figure
{
  "id": "fig-63.19",
  "kind": "diagram",
  "title": "Evidence stages and reversal conditions",
  "caption": "Freeze independent confirmation after development; operational stages retain permission bounds, monitoring and explicit reversal rather than inheriting universal authority from a benchmark.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.17",
  "alt": "Freeze independent confirmation after development; operational stages retain permission bounds, monitoring and explicit reversal rather than inheriting universal authority from a benchmark.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Target + invariant contract"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Controlled qualification"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Frozen held-out confirmation"
      },
      {
        "id": "n3",
        "kind": "state",
        "label": "Supported scope / gaps"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Authorized bounded operation"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Monitor / reverse / re-evaluate"
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
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "supported scope"
      },
      {
        "from": "n3",
        "to": "n1",
        "label": "unresolved requirement"
      },
      {
        "from": "n4",
        "to": "n5"
      },
      {
        "from": "n5",
        "to": "n1",
        "label": "material change"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 63.6 — Produce a bounded reliability decision.**

[DERIVED] **Inputs:** target-use contract, qualified evidence stages, frozen candidate, independent confirmation set, resource limits and reversal policy. **Outputs:** scoped claim, unresolved gaps and operational decision record.

1. Map each required outcome and invariant to a measurable predicate, target support and independent evidence source. List unsupported workflows and hidden dependencies.
2. Complete controlled/interactive qualification, fault tests and joint budget evaluation. Treat discovered defects as development feedback; issue a new system/protocol version after repair.
3. Freeze the candidate, policies, thresholds, task roster and statistical claims. Run independent confirmation with all offered episodes and prespecified uncertainty.
4. Apply noncompensable policy/integrity/deadline gates before aggregate utility. Distinguish failure to demonstrate a requirement from proof of unacceptable intrinsic behavior.
5. If an authorized operational stage is used, bound permissions, traffic and duration; monitor the same offered-task ledger and define rollback/escalation triggers in advance.
6. Publish the scoped result, evidence boundaries and unresolved conditions. Reopen evaluation when model, tools, data, permissions, traffic or predicates change; stop any finite campaign at its declared limit.

[DERIVED] No deployment is performed by this manuscript. The procedure specifies which evidence a future decision would require. Computational cost includes qualification, discarded candidates, confirmation, monitoring and human adjudication, not only the final successful run.

## Implementation

[DERIVED] Store a release-evidence manifest linking candidate artifacts, task/protocol hashes, source versions, expected/observed case rosters, independent labels, calculator bindings and unexecuted proposals. A report should be reproducible without exposing private user data or hidden verifier secrets; use controlled access and deidentified join keys. Preserve the exact event predicates and their revisions so a later change can be traced to the evidence it invalidates.

[DERIVED] Include an outcome transition record when updating a candidate: tasks that improve, regress, become unresolved or change labels. Keep label changes separate from model changes. Shadow operation validates timing/data paths while suppressing consequential actions; it does not directly measure effects of actions that never occurred. An operational canary needs authorized actions and an actual reversal mechanism, with coverage of asynchronous work and persistent state from [Chapter 47](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/README.md).

## Experimental design

[ASSUMED] Confirm a frozen policy on held-out task/workflow families drawn from a declared target frame. Compare controlled replica and shadow/live signals only on appropriately linked, privacy-preserving cases, retaining unobserved-action limits. Require an independently audited sample of task/policy/integrity labels. Predeclare margins, independent-unit counts, multiplicity and stopping rules; a zero-error target of extreme reliability may demand far more evidence than the available tasks. Experiment 63.3 is a proposed, unexecuted study.

## Observations

**What the paper claims.** [PAPER-REPORTED] Incident-Arena uses 20 tasks on three substrates with outcome and safety gates under load [R63.9, §3].

**What the evidence shows.** [PAPER-REPORTED] Its protocol includes a post-agent soak, restart/preservation checks and restricted repair surfaces; task difficulty is confounded with substrate [R63.9, §§3–4, Appendix B].

**What we infer.** [DERIVED] Repair validity requires more than clearing an alert. These checks demonstrate a bounded experimental contract, not “the last nine” of field reliability.

**What remains unknown.** [UNVERIFIED] We have not reproduced the trials or established transfer to another deployment. The landing-page and full-text effort summaries disagree; pooled effort numbers are omitted pending reconciliation.

[DERIVED] Source context for the operational comparison:

| Field | Incident-Arena inspected v1 context |
|---|---|
| Hardware | AWS m7i.2xlarge: 8 vCPUs, 32 GB, 80 GiB gp3; remote inference hardware NOT-DISCLOSED |
| Precision | Hosted model precision NOT-DISCLOSED |
| Sequence/workload | 20 authored tasks, three substrates; multiple model/effort/trial settings |
| Input/output | Scoped operational shell, metrics/logs and task-specific repair surfaces; lengths vary |
| Concurrency | Per-trial fresh k3s cluster; cross-trial/model-serving concurrency NOT-DISCLOSED |
| Runtime | Ubuntu 24.04 amd64, pinned images, modified Harbor/Kubernetes backend |
| Boundary | Ready-cluster start; harness plus agent budget 60 minutes; termination then 180-second graded soak at load-cycle boundary |
| Comparability | Authored finite cohort; substrate/difficulty confounding; setup excluded from episode clock; no equal-hardware model latency claim |

## Failure modes

> **Failure mode — Releasing beyond the evidence support.** [DERIVED] *Symptom:* a controlled benchmark score is claimed for new users, permissions, tools or rare hazards. *Cause:* target shift and untested consequences are hidden by one aggregate rating. *Detection:* map each claimed condition to observed task/support and predicate evidence. *Mitigation:* narrow the claim, gather qualified independent evidence for the missing support and define operational reversal triggers.

[MATHEMATICALLY-DERIVED] Zero failures among $n=100$ independent cases yields an upper failure bound near $0.0295$ for a single fixed claim at $\delta=0.05$, not a guarantee of near-perfect reliability. With perfect shared dependence, all 100 successes can be the same one-bit event; the binomial argument fails. Repeating an easy task or relabeling timeouts as missing cannot justify an extreme reliability claim.

```figure
{
  "id": "fig-63.20",
  "kind": "compare",
  "title": "Evidence and decision boundaries",
  "caption": "A controlled result and a deployment claim differ in population, permissions and consequences; transfer requires an explicit argument.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.16",
  "alt": "A controlled result and a deployment claim differ in population, permissions and consequences; transfer requires an explicit argument.",
  "spec": {
    "axis": "Claim scope",
    "columns": [
      {
        "id": "a",
        "label": "Controlled evaluation"
      },
      {
        "id": "b",
        "label": "Target operation"
      }
    ],
    "rows": [
      {
        "dimension": "Population",
        "values": {
          "a": "Qualified sampled tasks",
          "b": "Actual offered users/workflows"
        }
      },
      {
        "dimension": "Environment",
        "values": {
          "a": "Pinned/reset replica",
          "b": "Drifting tools, data and state"
        }
      },
      {
        "dimension": "Decision",
        "values": {
          "a": "Mechanism and bounded score",
          "b": "Authorized scope, monitoring, reversal"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Choose controlled replicas to isolate mechanisms and prevent harmful experimentation; choose held-out real workflows to assess transfer; choose shadow/limited operation to assess live timing and consequences within authorized scope. Reverse a benchmark-only decision when target support is absent. Reverse a live-only inference when confounding or unrecorded human repair prevents interpreting outcomes. More realism can reduce experimental control, so maintain both evidence types with explicit roles.

## Extensions

[DERIVED] Track reliability under requirements, data and tool evolution, including unseen workflow combinations and multilingual/multimodal support. Use prespecified change-detection or sequential inference with guarantees appropriate to repeated monitoring. A drifting failure rate invalidates a static i.i.d. certificate; it requires a new model of evidence or a renewed confirmation window. Link security/privacy/adversarial requirements to [Chapter 65](../ch65-security-privacy-safety-and-adversarial-robustness/README.md) and the final release argument to [Chapter 66](../ch66-release-decisions-reproducibility-and-research-to-production-closure/README.md).

## Limitations

[DERIVED] Real target distributions are partly unknown, and operational labels can be delayed or selectively observed. A valid statistical interval cannot repair an invalid predicate or missing support. Confidence bounds concern sampled events under assumptions, not every conceivable failure. A chapter can provide a defensible method and still leave an empirical decision unresolved; it cannot honestly manufacture a perfect numerical rating.

## Reproducibility

[DERIVED] Publish the evidence manifest, target/sampling frames, protocol/candidate versions, sampling/stopping rules, offered/outcome/resource ledger, label audits, excluded support and reversal conditions. Keep static code inspection, authored mathematical instruments, paper-reported results and proposed studies in separate evidence categories. [Verification](verification.md) supplies typed proposals and exact calculator bindings; neither constitutes benchmark replication.

## References

[R63.9] Fu et al., inspected v1 full-text HTML and PDF (2026-09-30), §§3–6 and Appendix B. The abstract landing page has a different pooled token/turn summary; see the explicit source discrepancy in [references](references.md).
