---
id: ms.section.66.1
entity_type: section
title: "Evidence synthesis"
volume: 3
part: 11
chapter: 66
section: 66.1
slug: 66-1-evidence-synthesis
parent: ms.chapter.66
prev_sibling: null
next_sibling: ms.section.66.2
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

# 66.1 Evidence synthesis

## Scope

[DERIVED] A release dossier connects each claim to its intervention, comparator, population, outcome predicate, uncertainty and executed artifact. It is a scientific argument, not an average chapter rating. Prerequisites are [experimental design](../../../vol-01-learning-and-representation/part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md), [benchmark validity](../ch61-capability-portfolios-and-benchmark-validity/README.md), [judgment uncertainty](../ch62-human-preference-model-judges-and-uncertainty/README.md) and [whole-system reliability](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md). Its output is a claim–evidence–assumption graph with visible support limits.

## Why this exists

[DERIVED] Successful demonstrations can conceal changed baselines, selected tasks, tuned evaluators and unresolved regressions. Repeating a result can reproduce an implementation defect. A strong aggregate capability score can coexist with a failed privacy or state-integrity requirement. The dossier must identify what changed, what remained controlled, what the experiment identifies and which decisions still depend on untested premises.

## Intuition

[DERIVED] Treat a headline statement as a query over evidence. A claim of improved valid deadline completion needs candidate/baseline identities, offered task IDs, independent labels, timing boundaries, complete failures and a supported contrast. Graph edges distinguish measurement, mathematical implication and conditional engineering judgment. A citation supports a source-local claim; it does not experimentally verify a new implementation.

## Formulation

[MATHEMATICALLY-DERIVED] For frozen systems $a=0,1$, target population $P$ and declared outcome $Y^{(a)}$,

$$
\Delta_P=\mathbb E_P[Y^{(1)}-Y^{(0)}],\qquad \widehat\Delta=\frac1n\sum_{i=1}^n d_i,\quad d_i=Y_i^{(1)}-Y_i^{(0)}.


$$
*(Eq. 66.1)*

[DERIVED] A paired difference is causal only under an appropriate assignment/replay design; matching names alone does not identify counterfactuals. With independent paired task units and $n>1$,

$$
\widehat{\operatorname{SE}}(\widehat\Delta)=\sqrt{\frac{\sum_i(d_i-\widehat\Delta)^2}{n(n-1)}}.


$$
*(Eq. 66.2)*

[DERIVED] This estimates standard error, not an exact finite-sample confidence guarantee. For nonnegative normalized weights and simultaneous component bounds $|\mu_j-\widehat\mu_j|\le\epsilon_j$,

$$
U=w^\top\mu\ge w^\top\widehat\mu-\sum_jw_j\epsilon_j,\qquad U_{L,2}=w\widehat\mu_1+(1-w)\widehat\mu_2-w\epsilon_1-(1-w)\epsilon_2.


$$
*(Eq. 66.3)*

[DERIVED] The second expression is the instrument's exact two-component specialization. Its input uncertainty must already be valid simultaneously. Utility cannot waive a required security, policy or integrity gate.

```figure
{
  "id": "fig-66.3",
  "kind": "calculator",
  "title": "Utility needs valid component bounds",
  "caption": "Eq. 66.3 two-component lower bound; supplied uncertainty must be simultaneously valid. Hard release gates remain separate.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-66.3",
  "alt": "Eq. 66.3 two-component lower bound; supplied uncertainty must be simultaneously valid. Hard release gates remain separate.",
  "spec": {
    "tex": "U_L=w\\widehat\\mu_1+(1-w)\\widehat\\mu_2-w\\epsilon_1-(1-w)\\epsilon_2",
    "equation": "66.3",
    "inputs": [
      {
        "symbol": "w",
        "label": "First weight",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "m1",
        "label": "First benefit",
        "default": 0.8,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "m2",
        "label": "Second benefit",
        "default": 0.75,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "e1",
        "label": "First valid error bound",
        "default": 0.05,
        "min": 0,
        "max": 0.5,
        "format": "percent"
      },
      {
        "symbol": "e2",
        "label": "Second valid error bound",
        "default": 0.05,
        "min": 0,
        "max": 0.5,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "point",
        "label": "Weighted point estimate",
        "formula": "w*m1+(1-w)*m2",
        "format": "percent"
      },
      {
        "symbol": "lower",
        "label": "Conditional lower bound",
        "formula": "w*m1+(1-w)*m2-w*e1-(1-w)*e2",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Explicit evidence",
      "variables": {
        "w": 0.5,
        "m1": 0.8,
        "m2": 0.75,
        "e1": 0.05,
        "e2": 0.05
      },
      "note": "This is conditional on valid input bounds.",
      "highlight": [
        "lower"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "Weaker evidence",
      "variables": {
        "w": 0.5,
        "m1": 0.8,
        "m2": 0.75,
        "e1": 0.05,
        "e2": 0.2
      },
      "note": "Unchanged point estimates can have weaker support.",
      "highlight": [
        "point",
        "lower"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Weight sensitivity",
      "variables": {
        "w": 0.9,
        "m1": 0.8,
        "m2": 0.4,
        "e1": 0.05,
        "e2": 0.2
      },
      "note": "A low utility weight does not remove a required gate.",
      "highlight": [
        "lower"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Start with the decision and actual alternative: existing system, simpler policy, human-supported workflow or no automatic action. Separate mechanism presence, implementation, branch activation and outcome improvement. Preserve negative and regression cases. A claim card records target, estimand, intervention, comparator, sampling frame, protocol hash, predicates, contrast, uncertainty, resource boundary, failures and assumptions. Attach the exact run/output IDs producing every number. Missing evidence remains unresolved; a proxy is not substituted silently.

```figure
{
  "id": "fig-66.4",
  "kind": "diagram",
  "title": "Trace the claim to executed evidence",
  "caption": "The support graph connects target, intervention, raw outcomes and uncertainty; unresolved premises require a scoped revision.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.1",
  "alt": "The support graph connects target, intervention, raw outcomes and uncertainty; unresolved premises require a scoped revision.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "objective",
        "label": "Target + alternative"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Intervention"
      },
      {
        "id": "n2",
        "kind": "dataset",
        "label": "Run + raw outcomes"
      },
      {
        "id": "n3",
        "kind": "metric",
        "label": "Contrast + uncertainty"
      },
      {
        "id": "n4",
        "kind": "boundary",
        "label": "Premises / gaps"
      },
      {
        "id": "n5",
        "kind": "state",
        "label": "Scoped claim"
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
      },
      {
        "from": "n4",
        "to": "n5"
      },
      {
        "from": "n4",
        "to": "n0",
        "label": "revise scope"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 66.1 — Synthesize an auditable claim.** [DERIVED] **Inputs:** finite claims, immutable evidence and target-use contract. **Outputs:** scoped support and unresolved conditions.

1. Define the target event, units, comparator and boundary.
2. Trace every quantity to inputs, run, output and scorer.
3. Audit assignment, selection, exclusions, label revisions and dependence; recompute from raw outcomes where available.
4. Link deductions to premises and recommendations to alternatives/reversal conditions.
5. Apply hard gates before optional utility; retain uncertainty and failures.
6. Freeze a dossier version; changed evidence creates a new version. 

[DERIVED] Graph traversal costs $O(V+E)$; scientific predicate review can dominate bookkeeping.

## Implementation

[DERIVED] Use stable IDs for claims, datasets/splits, models, environments, runs, outputs, evaluators and decisions. Store byte hashes separately from semantic roles. Record first source release, inspected revision and actual access date. Preserve rationale, exploratory branches and controlled deviations. An assistant may traverse the graph but its answer must resolve to records; it cannot invent a missing execution. Evidence access controls apply to user data, verifier secrets and model artifacts alike.

## Experimental design

[ASSUMED] An independent reviewer receives the frozen package without the original developer and reconstructs the target contrast and every number. Compare provenance-only versus provenance-plus-rationale packages on separate claims, preserving reviewer/task dependence. Measure reconstruction and correctly identified obstruction, not document length. Experiment 66.1 in [verification](verification.md) is proposed and unexecuted.

## Observations

**What the paper claims.** [PAPER-REPORTED] Li and Kesselman report interpretation/coordination breakdowns during a 19-month clinical ML infrastructure deployment [R66.1, §2, Table 1].

**What the evidence shows.** [PAPER-REPORTED] Embedded authors grouped incidents reflectively; the proposed AI interaction layer lacks longitudinal evaluation [R66.1, §§2.2/3.2/5].

**What we infer.** [DERIVED] Record experimental intent alongside lineage.

**What remains unknown.** [UNVERIFIED] This situated account neither estimates population prevalence nor establishes the prototype's benefit.

## Failure modes

> **Failure mode — A number without executed provenance.** [DERIVED] *Symptom:* the result cannot be traced to the intended workload/artifact/scorer. *Cause:* a paper constant, proxy or wrong checkpoint occupies the result slot. *Detection:* follow the claim to raw outputs and independently recompute its predicate. *Mitigation:* bind quantities to runs and mark absent evidence explicitly.

[MATHEMATICALLY-DERIVED] Equal-weight changes $+0.10,-0.06$ give average gain $0.02$ while violating a second-component regression ceiling below $0.06$. Aggregate gain does not imply gate satisfaction.

```figure
{
  "id": "fig-66.5",
  "kind": "compare",
  "title": "Support and authority are different records",
  "caption": "A bounded empirical contrast and an authorized release decision have different obligations.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.3",
  "alt": "A bounded empirical contrast and an authorized release decision have different obligations.",
  "spec": {
    "axis": "Evidence role",
    "columns": [
      {
        "id": "a",
        "label": "Scientific finding"
      },
      {
        "id": "b",
        "label": "Release decision"
      }
    ],
    "rows": [
      {
        "dimension": "Core object",
        "values": {
          "a": "Estimand and contrast",
          "b": "Action and constraints"
        }
      },
      {
        "dimension": "Needed boundary",
        "values": {
          "a": "Measured support",
          "b": "Accountable authorization"
        }
      },
      {
        "dimension": "Reopen when",
        "values": {
          "a": "Premises change",
          "b": "Gate or scope changes"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Use a compact graph for a small decision and a hierarchical dossier for distinct populations/permissions. Reverse aggregate-only reporting when subgroup or integrity gates matter. Reverse an unstructured artifact archive when a reviewer cannot reconstruct the actual claim. More artifacts do not repair an invalid predicate.

## Extensions

[DERIVED] Add label, missing-case and target-shift sensitivity to the relevant inference. Incorporate [Chapter 64](../ch64-mechanistic-interpretability-and-causal-model-analysis/README.md) mechanism evidence only for its demonstrated causal scope; an internal explanation can refine a hypothesis without replacing an external outcome. Identify the next experiment that distinguishes remaining explanations.

## Limitations

[DERIVED] A dossier makes evidence inspectable but cannot create missing experiments. Agreement can reflect a shared invalid reference; one successful rerun does not establish transfer across hardware, tasks or permissions. Scientific support and accountable authorization remain different records.

## Reproducibility

[DERIVED] Archive the graph, exact source locators, raw outcome/resource ledgers, analysis code when implemented, unresolved assumptions and independent-review findings. Preserve baseline and material revisions. Worked instruments and proposed studies are not a release certification or newly executed research.

## References

[R66.1] Li and Kesselman, inspected v2 (2026-04-10), §§2–5 and Table 1; exact source/access fields are in [references](references.md).
