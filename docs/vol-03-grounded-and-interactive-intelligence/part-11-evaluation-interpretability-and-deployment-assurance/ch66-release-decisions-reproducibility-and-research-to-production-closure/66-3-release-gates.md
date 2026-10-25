---
id: ms.section.66.3
entity_type: section
title: "Release gates"
volume: 3
part: 11
chapter: 66
section: 66.3
slug: 66-3-release-gates
parent: ms.chapter.66
prev_sibling: ms.section.66.2
next_sibling: ms.section.66.4
children: []
prerequisites: [ms.chapter.6, ms.chapter.30, ms.chapter.47, ms.chapter.48, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
downstream: []
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

# 66.3 Release gates

## Scope

[DERIVED] Release gates combine capability floors, regression ceilings, SLOs, security/integrity requirements, monitor readiness, rollback and accountable authorization. Their output is a feasible-set decision with explicit uncertainty. [Chapters 61–63](../ch61-capability-portfolios-and-benchmark-validity/README.md) define metrics and evidence; [65](../ch65-security-privacy-safety-and-adversarial-robustness/README.md) defines adversarial constraints. Passing a declared gate does not establish universal safety.

## Why this exists

[DERIVED] A point estimate can cross a threshold by chance. Repeated peeking can invalidate a fixed-sample interval. A tiny confidence-region volume can retain a long direction that violates a subgroup margin. Improvement, practical equivalence, absence of evidence and noninferiority are different conclusions. An empty observation window cannot demonstrate a behavioral floor.

## Intuition

[DERIVED] Express the statistical decision as set containment: a confidence set contains plausible metric vectors; the feasible set contains acceptable vectors. Support requires the entire valid confidence set inside the feasible set, plus all operational prerequisites. Overlap with acceptable and unacceptable values is unresolved. Statistical evidence cannot substitute for actual monitor coverage, rollback ability or authorization.

## Formulation

[MATHEMATICALLY-DERIVED] For the complete metric vector $z=(\mu,\Delta,s)$ containing capability coordinates $\mu_j$, regression contrasts $\Delta_k$ and service/security quantities $s$, with floors $c_j$ and tolerances $r_k$, define



$$
\mathcal F=\{z:\mu_j\ge c_j,\ \Delta_k\ge-r_k,\ \mathrm{service/security\ constraints}\},\qquad \mathrm{eligible}=\mathbf1\{\mathcal C\subseteq\mathcal F\}\prod_\ell G_\ell.


$$
*(Eq. 66.7)*



[DERIVED] All coordinates and constraints are mapped back to their declared units before containment is tested. Operational gates $G_\ell$ include integrity, monitor/rollback readiness and required accountable authorization. For bounded observations $Z_{tj}\in[0,1]$ with constant conditional means $\mu_j$ given the complete past, and a fixed roster of $K\ge1$ coordinates, a conservative anytime construction is



$$
\epsilon_t=\sqrt{\frac{\log(\pi^2Kt^2/(3\delta))}{2t}},\qquad
\mathcal C_t=\prod_{j=1}^{K}[\max(0,\bar Z_{tj}-\epsilon_t),\min(1,\bar Z_{tj}+\epsilon_t)],\qquad
P\{\forall t,j:\mu_j\in\mathcal C_{tj}\}\ge1-\delta.


$$
*(Eq. 66.8)*



[DERIVED] Conditional Hoeffding bounds and the error allocation $6\delta/(\pi^2Kt^2)$ prove this by summing over coordinates and times. Independent identically distributed bounded cases suffice; arbitrary drifting conditional means do not. For paired differences in $[-1,1]$, first transform $Z=(d+1)/2$ and map the interval back, doubling its half-width. The calculator executes the half-width and one clipped coordinate only.



$$
\mathrm{noninferior}:\inf_{\Delta\in\mathcal C_t}\Delta\ge-r,\qquad
\mathrm{equivalent}:\mathcal C_t\subseteq[-r,r],\quad r>0.


$$
*(Eq. 66.9)*



[DERIVED] Nonsignificance establishes neither relation. A small region volume does not imply coordinatewise containment.

```figure
{
  "id": "fig-66.9",
  "kind": "calculator",
  "title": "Conservative anytime coordinate bound",
  "caption": "Eq. 66.8 component: bounded constant conditional means, fixed metric roster, union control over times. This is not a full release decision.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-66.8",
  "alt": "Eq. 66.8 component: bounded constant conditional means, fixed metric roster, union control over times. This is not a full release decision.",
  "spec": {
    "tex": "\\epsilon_t=\\sqrt{\\log(\\pi^2Kt^2/(3\\delta))/(2t)}",
    "equation": "66.8",
    "inputs": [
      {
        "symbol": "t",
        "label": "Observation index",
        "default": 500,
        "min": 1,
        "max": 100000,
        "format": "integer"
      },
      {
        "symbol": "K",
        "label": "Fixed coordinates",
        "default": 10,
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
      },
      {
        "symbol": "mean",
        "label": "One observed bounded mean",
        "default": 0.9,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "eps",
        "label": "Conservative half-width",
        "formula": "sqrt(ln(3.141592653589793^2*K*t^2/(3*delta))/(2*t))",
        "format": "raw"
      },
      {
        "symbol": "lower",
        "label": "Clipped coordinate lower bound",
        "formula": "max(0,mean-eps)",
        "format": "percent"
      },
      {
        "symbol": "upper",
        "label": "Clipped coordinate upper bound",
        "formula": "min(1,mean+eps)",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Joint-time control",
      "variables": {
        "t": 500,
        "K": 10,
        "delta": 0.05,
        "mean": 0.9
      },
      "note": "The bound pays for coordinates and all observation times.",
      "highlight": [
        "lower",
        "upper"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "More valid observations",
      "variables": {
        "t": 10000,
        "K": 10,
        "delta": 0.05,
        "mean": 0.9
      },
      "note": "Additional evidence narrows the bound under its premises.",
      "highlight": [
        "eps"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Small cohort",
      "variables": {
        "t": 10,
        "K": 10,
        "delta": 0.05,
        "mean": 0.9
      },
      "note": "Clipping can leave little information.",
      "highlight": [
        "lower",
        "upper"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Freeze metrics, strata, margins, thresholds, candidate and sampling rules before confirmation. Include target-relevant capability floors, critical regressions, offered-task deadline success, resource caps and legitimate-use degradation. Statistics estimates events under a model; it does not choose an organization's acceptable harm tradeoff.

[DERIVED] Choose a fixed-horizon procedure or an anytime-valid method matching actual optional stopping. A confidence sequence still needs its sampling/conditional-mean premises. Multiple metrics need joint control; selectively labeled subgroups need valid denominators and support. The final release claim is the conjunction of required gates, not the most favorable metric.

```figure
{
  "id": "fig-66.10",
  "kind": "diagram",
  "title": "Containment before eligibility",
  "caption": "A valid joint region must satisfy the feasible set and operational prerequisites; unresolved overlap remains visible.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.7",
  "alt": "A valid joint region must satisfy the feasible set and operational prerequisites; unresolved overlap remains visible.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Frozen claims"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Qualified outcomes"
      },
      {
        "id": "n2",
        "kind": "metric",
        "label": "Valid joint region"
      },
      {
        "id": "n3",
        "kind": "boundary",
        "label": "Feasible set + controls"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Eligible / violation / unresolved"
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

**Algorithm 66.3 — Apply a frozen release gate.**

[DERIVED] **Inputs:** candidate identity, target frame, feasible set, qualified labels and valid uncertainty method. **Outputs:** eligible, demonstrated violation or unresolved.

1. Freeze candidate, metrics, margins and accountable roles.
2. Validate integrity, monitor coverage and rollback prerequisites.
3. Collect every offered case under the declared assignment and labeling policy.
4. Construct the valid joint region; numerical approximations must conservatively enlarge it.
5. Declare eligibility only on containment and passed hard controls. Separate a demonstrated violation from unresolved overlap.
6. Stop or continue under the prespecified budget/stopping rule, retaining all decisions.

[DERIVED] Eq. 66.8 costs $O(K)$ per update with running sums. It is intentionally conservative; tighter methods have additional computation and validity obligations.

## Implementation

[DERIVED] A gate manifest records threshold, unit, denominator, independent sampling level, label delay, missingness, error budget, cadence and authority. Numerical certification needs conservative rounding/bounds: an underestimated region can falsely pass. Conditional subgroup accuracy needs uncertainty for joint correctness and subgroup proportion, with denominator away from zero. An absent group is unsupported coverage, not perfect performance.

## Experimental design

[ASSUMED] Test the implementation on known bounded distributions, correlated coordinates, optional stopping and violated conditional means. Check false-passage control separately from detection power. Then confirm a frozen candidate on independent held-out tasks with qualified labels and complete resource accounting. Experiment 66.3 is proposed and unexecuted; mathematical software fixtures are not agent-capability evidence.

## Observations

**What the paper claims.** [PAPER-REPORTED] Denoodt et al. construct multivariate confidence sequences with tractable conservative outer approximations [R66.3, §§2–5].

**What the evidence shows.** [PAPER-REPORTED] Synthetic and Adult-data comparisons illustrate monitoring; safe discretization and conditional means are explicit [R66.3, §6, Appendix F].

**What we infer.** [DERIVED] Numerical validity and the actual acceptance set both matter. Region volume alone cannot establish required coordinate margins.

**What remains unknown.** [UNVERIFIED] These examples do not certify arbitrary drifting deployments or the authored gate.

## Failure modes

> **Failure mode — Precision mistaken for admissibility.** [DERIVED] *Symptom:* a narrow-looking region or nonsignificant result is called equivalent/safe. *Cause:* the decision ignores an essential direction or margin. *Detection:* test containment against every required constraint. *Mitigation:* keep eligible, demonstrated violation and unresolved outcomes distinct.

[MATHEMATICALLY-DERIVED] A rectangle of widths $10^{-6}$ and $0.5$ has tiny area but can violate a $0.01$ second-coordinate margin. Small volume does not repair that uncertainty.

```figure
{
  "id": "fig-66.11",
  "kind": "compare",
  "title": "Different inferential conclusions",
  "caption": "Improvement, noninferiority and equivalence use different prespecified sets.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.9",
  "alt": "Improvement, noninferiority and equivalence use different prespecified sets.",
  "spec": {
    "axis": "Declared Claim boundary",
    "columns": [
      {
        "id": "a",
        "label": "Required relation"
      },
      {
        "id": "b",
        "label": "Insufficient substitute"
      }
    ],
    "rows": [
      {
        "dimension": "Improvement",
        "values": {
          "a": "Contrast region above zero",
          "b": "Positive point estimate"
        }
      },
      {
        "dimension": "Noninferiority",
        "values": {
          "a": "Lower bound above -r",
          "b": "Nonsignificance"
        }
      },
      {
        "dimension": "Equivalence",
        "values": {
          "a": "Whole region inside [-r,r]",
          "b": "Small volume alone"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer a fixed sample for a fixed confirmation decision and a valid confidence sequence when optional stopping is necessary. Reverse point-estimate gating when uncertainty changes the decision. Reverse a complex region method if its numerical implementation cannot preserve coverage; wider honest uncertainty is preferable to unsupported precision.

## Extensions

[DERIVED] Add severity-specific and subgroup constraints under a proof covering the actual design. The [62.5](../ch62-human-preference-model-judges-and-uncertainty/62-5-confidence-and-abstention.md) selective-risk certificate applies to its frozen score, accepted cohort and fixed selection construction; it does not automatically cover changing admission/monitoring policies.

## Limitations

[DERIVED] Thresholds reflect practical obligations, not universal constants. Rare harms can demand infeasible evidence. Failure to certify is not proof of intrinsic unsafety. Drift, selective feedback, invalid labels and adaptive candidate changes can invalidate a mathematically sound interval.

## Reproducibility

[DERIVED] Archive margins, gate manifests, full joint regions, numerical tolerances, expected/observed rosters, stopping history, blocked prerequisites and accountable decisions. No deployment is authorized or performed by this manuscript.

## References

[R66.3] Denoodt et al., v2 (2026-10-08), §§2–6, Appendix F and §G.6. Eq. 66.8 is a separately derived union-over-time construction, not their portfolio implementation.
