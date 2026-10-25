---
id: ms.section.66.6
entity_type: section
title: "Research feedback"
volume: 3
part: 11
chapter: 66
section: 66.6
slug: 66-6-research-feedback
parent: ms.chapter.66
prev_sibling: ms.section.66.5
next_sibling: ms.verification.66
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

# 66.6 Research feedback

## Scope

[DERIVED] Research-to-production closure is a feedback loop: negative results, incidents, reproduction obstructions and unexplained regressions revise hypotheses and determine the next discriminating experiment. Closure means the current decision's support and limits are explicit, not that research is finished. This section reconnects [6](../../../vol-01-learning-and-representation/part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md) experimental design, [64](../ch64-mechanistic-interpretability-and-causal-model-analysis/README.md) causal mechanisms, [65](../ch65-security-privacy-safety-and-adversarial-robustness/README.md) residual risk and the release dossier.

## Why this exists

[DERIVED] A failed candidate can teach more than a small aggregate improvement if it separates plausible mechanisms. Conversely, repeated tuning on the same evaluation tasks can create apparent progress without new evidence. A negative result may reflect an absent mechanism, an inactive branch, an invalid output, inadequate power or a genuinely ineffective intervention. These explanations require different experiments.

## Intuition

[DERIVED] Preserve the entire reasoning chain: hypothesis, predicted observable difference, intervention, activation evidence, outcome predicate and inference. A technique described in a prompt is not necessarily implemented; implemented code may not activate; an activated branch may fail to return a valid artifact. Only after these checks does an outcome contrast test the intended method. A failed proxy or selector does not refute every possible version of the underlying idea.

## Formulation

[MATHEMATICALLY-DERIVED] For hypotheses $h$ and a newly observed result $D$, a specified likelihood model gives



$$
P(h\mid D)=\frac{P(D\mid h)P(h)}{\sum_{h'}P(D\mid h')P(h')},


$$
*(Eq. 66.16)*



[DERIVED] This identity is not a license to invent priors or likelihoods after seeing results. A frequentist nonsignificant test is not a posterior probability that a mechanism is absent. Model misspecification and selection remain substantive concerns.

[MATHEMATICALLY-DERIVED] For state $Z$, a finite action set and utility $u(a,Z)$ with $\mathbb E[\max_a|u(a,Z)|]<\infty$, the value of perfect state information is



$$
\operatorname{EVPI}=\mathbb E_Z[\max_a u(a,Z)]-\max_a\mathbb E_Z[u(a,Z)]\ge0.


$$
*(Eq. 66.17)*



[DERIVED] Jensen's max inequality gives nonnegativity. A proposed imperfect experiment has value at most EVPI when it only reveals information about this fixed decision model and cannot itself improve the available actions or outcomes. Actual expected sample information also requires the experiment's observation/likelihood model and decision rule.



$$
V_0=\max(0,qB-(1-q)H),\qquad V_{\rm perfect}=qB,\qquad
\operatorname{EVPI}_2=qB-V_0,\qquad U_{\rm net,upper}=\operatorname{EVPI}_2-C_e.


$$
*(Eq. 66.18)*



[DERIVED] The instrument assumes two states, safe with probability $q$, and two actions: release yields $B\ge0$ when safe and $-H$ otherwise; defer yields zero. Perfect information permits release only in the safe state. $C_e\ge0$ is experiment cost in the same utility units. This is an illustrative upper bound, not a measured safety posterior, permission to release or a complete ethical utility model.

```figure
{
  "id": "fig-66.18",
  "kind": "calculator",
  "title": "Perfect-information value is an upper bound",
  "caption": "Eq. 66.18 illustrative two-state utility model. Inputs are chosen assumptions, not a calibrated safety posterior or an authorization decision.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-66.18",
  "alt": "Eq. 66.18 illustrative two-state utility model. Inputs are chosen assumptions, not a calibrated safety posterior or an authorization decision.",
  "spec": {
    "tex": "V_0=\\max(0,qB-(1-q)H),\\quad \\operatorname{EVPI}=qB-V_0",
    "equation": "66.18",
    "inputs": [
      {
        "symbol": "q",
        "label": "Assumed safe-state probability",
        "default": 0.9,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "benefit",
        "label": "Release benefit if safe (utility units)",
        "default": 10,
        "min": 0,
        "max": 100,
        "format": "raw"
      },
      {
        "symbol": "harm",
        "label": "Loss if unsafe (same units)",
        "default": 50,
        "min": 0,
        "max": 1000,
        "format": "raw"
      },
      {
        "symbol": "cost",
        "label": "Experiment cost (same units)",
        "default": 2,
        "min": 0,
        "max": 100,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "current",
        "label": "Current optimal expected utility",
        "formula": "max(0,q*benefit-(1-q)*harm)",
        "format": "raw"
      },
      {
        "symbol": "perfect",
        "label": "Expected utility with perfect information",
        "formula": "q*benefit",
        "format": "raw"
      },
      {
        "symbol": "evpi",
        "label": "Perfect-information value upper bound",
        "formula": "perfect-current",
        "format": "raw"
      },
      {
        "symbol": "net",
        "label": "Net information-value upper bound",
        "formula": "evpi-cost",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Explicit decision model",
      "variables": {
        "q": 0.9,
        "benefit": 10,
        "harm": 50,
        "cost": 2
      },
      "note": "The values are hypothetical and do not represent ethical authorization.",
      "highlight": [
        "evpi",
        "net"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "More consequential uncertainty",
      "variables": {
        "q": 0.8,
        "benefit": 10,
        "harm": 50,
        "cost": 2
      },
      "note": "Information can change the preferred action.",
      "highlight": [
        "current",
        "evpi"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Cost exceeds possible information gain",
      "variables": {
        "q": 0.99,
        "benefit": 10,
        "harm": 50,
        "cost": 10
      },
      "note": "A negative upper bound rules out value in this limited model, not all scientific value.",
      "highlight": [
        "net"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Convert each unresolved condition into competing hypotheses and a discriminating observation. If a mechanism is absent, repair implementation before testing efficacy. If untriggered, use a qualified workload that reaches it without changing the scientific target silently. If activated but invalid, fix output/contract handling. If the intended intervention executes faithfully, measure its outcome under matched budgets, tasks and information.

[DERIVED] Include same-code and simpler-policy controls when extra sampling or orchestration can explain a gain. Separate oracle answer coverage from a usable pre-execution selection policy. Record whether an analysis was planned before acquisition, developed after inspection or independently confirmed. Promote an exploratory pattern to a hypothesis, not immediately to a causal conclusion.

```figure
{
  "id": "fig-66.19",
  "kind": "diagram",
  "title": "A failure becomes a discriminating test",
  "caption": "The current evidence identifies an unsupported link; the next experiment separates explanations and returns independently measured support.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.17",
  "alt": "The current evidence identifies an unsupported link; the next experiment separates explanations and returns independently measured support.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Frozen findings + failures"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Locate unsupported link"
      },
      {
        "id": "n2",
        "kind": "objective",
        "label": "Competing hypotheses"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Discriminating bounded study"
      },
      {
        "id": "n4",
        "kind": "metric",
        "label": "Independent outcome"
      },
      {
        "id": "n5",
        "kind": "state",
        "label": "Updated scoped dossier"
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
        "from": "n5",
        "to": "n1",
        "label": "remaining gap"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 66.6 — Close the current decision and open the next test.**

[DERIVED] **Inputs:** finite unresolved claims, failures, evidence graph and remaining research resources. **Outputs:** revised support, falsifiable hypotheses and a prioritized study.

1. Freeze current evidence, including negative results, incidents and failed reproduction attempts.
2. Locate the earliest unsupported link: implementation, activation, validity, measurement, attribution or target transfer.
3. State competing explanations and an observation/intervention that could distinguish them.
4. Select a feasible study using expected decision relevance, cost, independent support and consequences; label any value-of-information approximation.
5. Separate development from new confirmation, freeze hypotheses/predicates/budgets and preserve all candidates/outcomes.
6. Update the dossier with the measured result or explicit obstruction. Stop the finite current campaign and leave unresolved questions visible.

[DERIVED] Evidence-graph traversal costs $O(V+E)$; experiment cost and uncertainty dominate prioritization. A large search budget does not make a weakly identified contrast informative.

## Implementation

[DERIVED] Store hypothesis and analysis versions, source/run links, intervention diff, branch-activation traces, output-validity checks, exclusions, resource ledger and decision consequences. Preserve negative candidates and the reason a path was abandoned. Link incident examples to development data, then test repairs on held-out incidents/workflows. Do not recycle the same revealing failure as independent confirmation.

[DERIVED] Automated research systems need explicit limits on tool privileges, candidate count, data access and compute, with scientific review of the measurement itself. A generated report is a claim; the evidence graph must still show executed computation and faithful scoring. Changing the evaluator after a failure creates a new protocol and requires transparent back-comparison.

## Experimental design

[ASSUMED] Compare an intervention with same-code repeated execution, a simpler control and a mechanism-disabled ablation under matched resources. Verify implementation/activation/output validity before efficacy analysis. Freeze a selector on development tasks and evaluate it on held-out tasks/repeats. Record null, negative and unresolved outcomes. The verification proposals are unexecuted; the decision instrument is only algebraic.

## Observations

**What the paper claims.** [PAPER-REPORTED] Xu et al. separate oracle coverage, repeat-stable advantages and usable harness selection [R66.6, §§3–4].

**What the evidence shows.** [PAPER-REPORTED] On 386 common-complete MATH tasks, the frozen selector adds 0.00 percentage points; full 27-execution oracle coverage ties the same-code control. Stable complementarity remains unresolved at three repeats [R66.6, §5, Table 3].

**What we infer.** [DERIVED] A tested selector's negative result and the existence of any useful specialization are distinct claims; equal executions are not equal model calls/tokens.

**What remains unknown.** [UNVERIFIED] The observed protocol does not rule out other selectors, workloads or sufficiently powered designs.

## Failure modes

> **Failure mode — Tuning converts an observation into its own confirmation.** [DERIVED] *Symptom:* a repair repeatedly improves the same revealed cases but lacks new evidence. *Cause:* development feedback and evaluation are pooled without recording selection. *Detection:* inspect chronology, task exposure and candidate lineage. *Mitigation:* preserve exploratory status and confirm on independent support.

[DERIVED] More programs can increase oracle coverage through extra rolls even when code is identical. Stable losses can produce repeatable patterns without useful specialization. A mechanism's presence, activation and valid output are necessary diagnostic checks, not proof of efficacy.

```figure
{
  "id": "fig-66.20",
  "kind": "compare",
  "title": "Three mechanism checks before efficacy",
  "caption": "A proposed mechanism must be implemented, activated and produce a valid result before its efficacy can be interpreted.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.16",
  "alt": "A proposed mechanism must be implemented, activated and produce a valid result before its efficacy can be interpreted.",
  "spec": {
    "axis": "Diagnostic layer",
    "columns": [
      {
        "id": "a",
        "label": "Required evidence"
      },
      {
        "id": "b",
        "label": "Failure consequence"
      }
    ],
    "rows": [
      {
        "dimension": "Implementation",
        "values": {
          "a": "Actual operation in code",
          "b": "Idea not instantiated"
        }
      },
      {
        "dimension": "Activation",
        "values": {
          "a": "Relevant executed branch",
          "b": "Workload did not test mechanism"
        }
      },
      {
        "dimension": "Output validity",
        "values": {
          "a": "Artifact meets its contract",
          "b": "Outcome contrast is confounded"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer targeted experiments when a consequential mechanism is identifiable; prefer broader independent transfer checks when the mechanism is sound but target support is missing. Reverse an expensive study whose result cannot change any feasible decision. Reverse an oracle-only method claim when the deployed selector cannot access the oracle information.

## Extensions

[DERIVED] Track external replication, counterexamples, incident recurrence and changed requirements as first-class evidence. Extend the hypothesis graph when new architectures alter the mechanism, preserving earlier scope rather than rewriting history. Use [Chapter 64](../ch64-mechanistic-interpretability-and-causal-model-analysis/README.md) interventions to distinguish internal mechanisms only when their assumptions and target relevance are satisfied.

## Limitations

[DERIVED] Value-of-information models depend on utilities, priors, available actions and observation models; perfect information is usually unattainable. Negative results can be underpowered or protocol-specific. Positive results can be selected. A research loop remains scientifically useful only when both kinds of limitation are retained.

## Reproducibility

[DERIVED] Publish the current bounded conclusion, negative results, unresolved mechanisms, proposed next experiment and exact artifact/run/source chronology. Keep executed observations and plans visibly distinct. Independent reproduction or a precise obstruction is a valid final record; an invented perfect rating is not.

## References

[R66.6] Xu et al., v1 (2026-09-26), §§3–6, Table 3, Appendices B–E and BIRD trace context. Post-acquisition diagnostic development and common-complete selection are disclosed by the source.
