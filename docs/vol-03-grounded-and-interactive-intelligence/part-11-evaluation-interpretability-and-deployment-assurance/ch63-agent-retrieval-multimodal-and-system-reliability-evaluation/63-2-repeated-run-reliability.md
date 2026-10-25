---
id: ms.section.63.2
entity_type: section
title: "Repeated-run reliability"
volume: 3
part: 11
chapter: 63
section: 63.2
slug: 63-2-repeated-run-reliability
parent: ms.chapter.63
prev_sibling: ms.section.63.1
next_sibling: ms.section.63.3
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

# 63.2 Repeated-run reliability

## Scope

[DERIVED] Repetition distinguishes the chance of finding one successful attempt from the chance of consistently completing the same task. The distinction matters for irreversible operations, flaky tools and long workflows. This section defines repeated-run estimands, finite-sample estimators, task heterogeneity and paired comparisons. The unit of independent evidence is usually a task or a reset environment, not each tool span. [Chapter 61](../ch61-capability-portfolios-and-benchmark-validity/README.md) supplies population/protocol control; [62.5](../ch62-human-preference-model-judges-and-uncertainty/62-5-confidence-and-abstention.md) supplies selection-aware risk certification.

## Why this exists

[DERIVED] Best-of-many demonstrations can improve while reliable unattended operation worsens. Retrying until success spends additional resources and can repeat a committed write. Conversely, repeating the exact same deterministic failure adds no exploration. A repeated-run report must state whether the evaluator resets the environment between runs, whether the agent learns from earlier attempts, whether an oracle selects the winning result and whether all attempts count against time/cost. These choices change the policy and the event being measured.

## Intuition

[DERIVED] Consider two task populations with mean single-attempt success one half. In the first every task has probability one half; in the second half the tasks always succeed and half always fail. Their mean accuracies coincide. Under independent repeats conditional on task, the second population has much higher all-runs success and much lower at-least-one success. Task heterogeneity therefore determines repetition curves even before tool or environment correlation is introduced.

## Formulation

[MATHEMATICALLY-DERIVED] Let $p_x=P(Y=1\mid x)$ for a frozen policy and reset distribution. Conditional independent identically distributed attempts give

$$
\operatorname{Pass@}k=\mathbb E_x[1-(1-p_x)^k],\qquad \operatorname{Pass}^{k}=\mathbb E_x[p_x^k],\qquad k\in\mathbb N_{\ge1}.
$$
*(Eq. 63.4)*

[DERIVED] Without conditional independence the events remain $P(\max_{j\le k}Y_j=1)$ and $P(\prod_{j\le k}Y_j=1)$, but these powers need not hold. The calculator is explicitly the homogeneous specialization $p_x=p$ with independent resets. It is not a plug-in estimate for a heterogeneous portfolio.

[MATHEMATICALLY-DERIVED] If $c_x$ of $n\ge k$ exchangeable observed attempts succeeded, the averages over all size-$k$ subsets are

$$
\widehat{\operatorname{Pass@}k}_x=1-\frac{\binom{n-c_x}{k}}{\binom nk},\qquad \widehat{\operatorname{Pass}^{k}}_x=\frac{\binom{c_x}{k}}{\binom nk},\quad \binom a k=0\ \text{for }a<k.
$$
*(Eq. 63.5)*

[DERIVED] These are exact empirical subset proportions. They are unbiased for the corresponding independent-attempt population functions under the stronger i.i.d. premise. The subsets overlap: $\binom nk$ is not an independent sample count. Average task-level values under the target task weights.

$$
z_x^{(m)}=\prod_{j=1}^{k}Y_{xj}^{(m)},\quad b=\sum_x\mathbf1\{z_x^{(0)}=0,z_x^{(1)}=1\},\quad c=\sum_x\mathbf1\{z_x^{(0)}=1,z_x^{(1)}=0\}.
$$
*(Eq. 63.6)*

[DERIVED] Under the paired marginal-equality null and independent task pairs, conditional on $b+c=d>0$, the discordant-direction count is $\operatorname{Binomial}(d,1/2)$. An exact two-sided McNemar test can use the binomial tail; $d=0$ has no discordant evidence. The asymptotic statistic $(b-c)^2/(b+c)$ requires an adequate discordant count. Report $b$ and $c$ separately, the paired effect and an interval, not only a significance label.

```figure
{
  "id": "fig-63.6",
  "kind": "calculator",
  "title": "One success and all successes diverge",
  "caption": "Eq. 63.4, specialized to identical independent attempt probability p. Heterogeneous tasks and correlated attempts require their own joint distribution.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-63.4",
  "alt": "Eq. 63.4, specialized to identical independent attempt probability p. Heterogeneous tasks and correlated attempts require their own joint distribution.",
  "spec": {
    "tex": "P_{\\ge1}=1-(1-p)^k,\\quad P_{\\rm all}=p^k",
    "equation": "63.4",
    "inputs": [
      {
        "symbol": "p",
        "label": "Homogeneous attempt success",
        "default": 0.7,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "k",
        "label": "Independent attempts",
        "default": 3,
        "min": 1,
        "max": 20,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "one",
        "label": "At least one success",
        "formula": "1-(1-p)^k",
        "format": "percent"
      },
      {
        "symbol": "all",
        "label": "All attempts succeed",
        "formula": "p^k",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Three independent attempts",
      "variables": {
        "p": 0.7,
        "k": 3
      },
      "note": "The same p gives different search and consistency events.",
      "highlight": [
        "one",
        "all"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "More attempts",
      "variables": {
        "p": 0.7,
        "k": 10
      },
      "note": "Extra attempts increase search success and tighten the all-runs requirement.",
      "highlight": [
        "one",
        "all"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Rare individual failure accumulates",
      "variables": {
        "p": 0.99,
        "k": 20
      },
      "note": "A high single-run rate is weaker than repeated unattended reliability.",
      "highlight": [
        "all"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Distinguish independent resets from sequential repair. An attempt that reuses prior successful plans, evaluator feedback, caches or changed external state is an adaptive policy with history. Evaluate that whole policy under its budget, and do not interpret its attempts through the i.i.d. powers. Shared model-service incidents can correlate many tasks; task seeds alone do not make those outcomes independent. Block or replicate across service/time conditions when that variation is part of the target.

[DERIVED] Report a task-by-attempt matrix, per-task success counts, at-least-one and all-runs events, and the distribution of partial consistency. A score called pass@1 may be a mean over several trials; disclose the averaging. A repeated-run success event becomes stricter with $k$ and its observed fraction is sensitive to repeat count, so comparisons require the same $k$ and reset policy. Evaluate regression transitions: an improved average can hide a substantial set of formerly reliable tasks becoming unreliable.

```figure
{
  "id": "fig-63.7",
  "kind": "diagram",
  "title": "Preserve the repetition hierarchy",
  "caption": "Task, environment and time blocks determine independent evidence; overlapping subsets are summaries, not new independent trials.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.5",
  "alt": "Task, environment and time blocks determine independent evidence; overlapping subsets are summaries, not new independent trials.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Frozen task roster"
      },
      {
        "id": "n1",
        "kind": "state",
        "label": "Fresh reset + time block"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "n registered attempts"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Task-level repetition events"
      },
      {
        "id": "n4",
        "kind": "metric",
        "label": "Paired cluster uncertainty"
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
        "to": "n4"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 63.2 — Estimate repetition and paired transitions.**

[DERIVED] **Inputs:** finite offered task roster, $n$ fresh attempts per system/task, repeat counts $1\le k\le n$, frozen reset and exclusion rules. **Outputs:** task matrices, repetition curves and paired uncertainty.

1. Freeze the task roster and all repeat counts before outcomes. Randomize or block execution order across systems and time, with a fresh reset for each intended independent attempt.
2. Record success gates, errors, tool incidents and budget exhaustion for every registered attempt. Preserve missing/unresolved outcomes with prespecified pessimistic/optimistic bounds.
3. Compute per-task success counts and Eq. 63.5; average using frozen task weights. Compute exact observed all-$n$ indicators and paired transition counts for matched $k$-run bundles.
4. Resample independent task/application clusters for intervals, preserving within-task repeats and system pairs. If the target includes variable service conditions, include that sampling level.
5. Evaluate prespecified contrasts with their actual assumptions and multiple-comparison plan. Publish improvements, regressions and uncertainty alongside the mean.
6. Terminate after the finite scheduled attempts; treat additional tuning/retries as a separate development stage requiring new held-out evidence.

[DERIVED] Counting costs $O(Nn)$ time and $O(Nn)$ trace-index storage, or $O(N)$ for aggregated counts with raw traces archived elsewhere. Stable products avoid factorial overflow in Eq. 63.5. Bootstrap cost is $O(BN)$ per fixed summary after task aggregation; it does not turn dependent tasks into independent units.

## Implementation

[DERIVED] Seeds, temperature, API response IDs and server revisions belong in the ledger. Temperature zero does not freeze GPU reductions, tool timing, rendered layouts or external state. Detect a repeated-run failure through terminal gates and traces, not a textual claim of determinism. Record tool return/error class separately from whether the agent recovered. Pin common service incidents to time blocks so a downtime episode is not misread as dozens of independent model failures.

[DERIVED] For writes, use idempotency keys and read-after-timeout status checks from [Chapter 54](../../part-09-retrieval-context-and-agent-systems/ch54-multi-agent-coordination-and-system-level-evaluation/README.md). Resetting a test database makes repeats safer but removes a real production risk; separately test unknown write outcomes on an isolated system. A no-reset retry policy must account for duplicate effects, not only its eventual final success. Deleting failed attempts and keeping the first successful transcript inflates a deployment reliability claim.

## Experimental design

[ASSUMED] Allocate repeats using a prespecified precision or decision margin, with a separate pilot for variance estimates. Compare fixed-repeat and adaptive-retry policies under equal offered tasks and total budgets; report them as distinct interventions. Evaluate tasks across fresh environment snapshots and service/time blocks. Include deterministic toy controls with known success probabilities/dependence to verify estimator code, then qualify actual tasks. Experiment 63.1 defines the unexecuted scientific protocol; the calculator below is algebraic illustration.

## Observations

**What the paper claims.** [PAPER-REPORTED] The computer-use reliability study evaluates repeated OSWorld executions with task-paired comparisons [R63.2, §2].

**What the evidence shows.** [PAPER-REPORTED] Deterministic decoding helps some tested agents and regresses another; plan-refinement comparisons use prior rollout feedback and assumed ground-truth success signals [R63.2, Tables 1/4, §5.1].

**What we infer.** [DERIVED] Sampling randomness is one mechanism among several. Feedback-assisted adaptation is a different information/budget regime from unaided independent repeats.

**What remains unknown.** [UNVERIFIED] These comparisons do not establish a universal decoding rule or the reliability of another tool environment.

## Failure modes

> **Failure mode — Plugging a mean into a nonlinear repetition curve.** [DERIVED] *Symptom:* portfolio all-runs or best-of-many reliability is inferred solely from aggregate single-run accuracy. *Cause:* task heterogeneity and dependence are discarded. *Detection:* retain the task-by-attempt matrix and compare empirical curves with the assumed model. *Mitigation:* estimate task-level repeated events under matched resets and disclose any homogeneous approximation.

[MATHEMATICALLY-DERIVED] For $k=2$, the homogeneous $p=1/2$ population has Pass@2 $=3/4$ and Pass$^2=1/4$. A half-always-success/half-always-fail population has both values $1/2$. With perfectly correlated attempts on each task, both events equal single-run success regardless of $k$. These counterexamples invalidate a universal conversion between the three scores.

[DERIVED] A task-cluster bootstrap can still be optimistic when tasks share a repository or a simultaneous service failure. Resample at the relevant independent level or report the limited fixed-cohort interpretation.

```figure
{
  "id": "fig-63.8",
  "kind": "compare",
  "title": "Search policy or unattended reliability",
  "caption": "A winner-selection regime and an all-runs regime have different costs, assumptions and acceptance events.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.4",
  "alt": "A winner-selection regime and an all-runs regime have different costs, assumptions and acceptance events.",
  "spec": {
    "axis": "Choose the operational event",
    "columns": [
      {
        "id": "a",
        "label": "At least one"
      },
      {
        "id": "b",
        "label": "Every attempt"
      }
    ],
    "rows": [
      {
        "dimension": "Event",
        "values": {
          "a": "Exists a successful attempt",
          "b": "All k attempts succeed"
        }
      },
      {
        "dimension": "Additional requirement",
        "values": {
          "a": "Recognize/select a valid winner",
          "b": "Control every repeated effect"
        }
      },
      {
        "dimension": "Hidden assumption",
        "values": {
          "a": "Oracle selection may be unrealistic",
          "b": "Independent powers may be unrealistic"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Use at-least-one success for a search policy only when the user can recognize the winner and pay for all attempts; include selector errors when recognition is imperfect. Use all-runs or catastrophic-failure risk for repeated unattended operations. Reverse best-of-many selection if validation costs or irreversible side effects dominate. Reverse a deterministic-only policy if controlled tests show systematic failures that safe exploration can repair.

## Extensions

[DERIVED] Model repeatability hierarchically by task, environment, user simulator and time block when there is enough independent replication to identify those components. Add learning curves for policies allowed to reuse prior attempts, with development/evaluation separation. A fitted hierarchical model can stabilize small-task estimates but introduces distributional assumptions; show sensitivity rather than replacing raw outcomes with an unexplained posterior.

## Limitations

[DERIVED] Finite repeats rarely support extreme reliability claims. Seeing no failure in a few attempts is weak evidence about a rare event, and task selection can dominate the interval. Exchangeability of attempts alone does not give independent Bernoulli errors; the shared-latent counterexample in [62.5](../ch62-human-preference-model-judges-and-uncertainty/62-5-confidence-and-abstention.md) applies here too. Reliable completion does not imply policy correctness if that gate is absent.

## Reproducibility

[DERIVED] Publish offered attempt IDs, task clusters, seeds, reset/service versions, timestamps, gate outcomes, repeat counts, optional feedback and every retry. Provide exact estimator/test definitions, zero-denominator behavior and the sampling level of uncertainty. Source outcomes remain paper-reported; no computer-use agent was executed for this text.

## References

[R63.2] Gonzalez-Pumariega et al., inspected v1 (2026-04-20), §2 metrics, §§3–5, Tables 1–4 and clarification/perturbation appendix context. The study's instruction clarification uses evaluator information and is not equivalent to an uninformed user interaction.
