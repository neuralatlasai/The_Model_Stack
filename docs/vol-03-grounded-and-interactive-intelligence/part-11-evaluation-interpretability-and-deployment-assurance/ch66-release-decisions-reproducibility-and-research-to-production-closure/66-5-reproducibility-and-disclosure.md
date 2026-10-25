---
id: ms.section.66.5
entity_type: section
title: "Reproducibility and disclosure"
volume: 3
part: 11
chapter: 66
section: 66.5
slug: 66-5-reproducibility-and-disclosure
parent: ms.chapter.66
prev_sibling: ms.section.66.4
next_sibling: ms.section.66.6
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

# 66.5 Reproducibility and disclosure

## Scope

[DERIVED] A reproducibility package lets an independent reviewer repeat the declared evaluation or identify exactly which missing artifacts prevent it. It distinguishes rerunning the original code, retraining from recorded inputs, independent reimplementation and transfer to a new environment. The output is executable instructions plus claim-specific availability and deviation records, connected to [30](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/README.md) checkpoints, [61](../ch61-capability-portfolios-and-benchmark-validity/README.md) protocol validity and [63](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) whole-execution accounting.

## Why this exists

[DERIVED] A repository link can exist while its data, weights, dependency wheels, evaluator or compute requirements are unavailable. An installation that exits successfully may never run the intended experiment. A familiar score can be copied or measured on the wrong artifact. Exact bits, statistically compatible results and faithful scientific reconstruction are different targets; define the one being attempted before judging the outcome.

## Intuition

[DERIVED] Reproduction has two axes: procedural fidelity and agreement of the measured target. A faithful run can fall outside tolerance through variance or an erroneous published result; a matching number can arise from a wrong experiment. Audit both. Restricted data need an access pathway and an explicit public-claim limit. A synthetic substitute may test code but cannot silently reproduce the original population result.

## Formulation

[MATHEMATICALLY-DERIVED] For scalar target $m_\star$, independently measured $m$, fixed absolute/relative tolerances $a>0,b\ge0$,



$$
\tau_m=\max(a,b|m_\star|),\qquad e_m=|m-m_\star|,\qquad
z_m=e_m/\tau_m,\qquad \mathrm{numeric\ match}=\mathbf1\{z_m\le1\}.


$$
*(Eq. 66.13)*



[DERIVED] Tolerances must be justified before results and do not establish procedural fidelity. Stochastic claims may require comparison of distributions or paired uncertainty rather than one scalar acceptance band. The instrument executes the three continuous quantities, not the full reproduction verdict.



$$
C_{\rm campaign}=\sum_{r=1}^{R}\left(C_{{\rm model},r}+C_{{\rm tool},r}+C_{{\rm infra},r}+C_{{\rm review},r}\right),\qquad
H_{\rm accel}=\sum_r n_{{\rm devices},r}t_r.


$$
*(Eq. 66.14)*



[DERIVED] Device-hours are an accounting unit, not equal compute across hardware, utilization or precision. Include failed setup, retries and reviewer work under the declared boundary. For qualified mutation tests with detected $D$, survived confirmed non-equivalent $S$ and excluded equivalent/unverified/non-evaluable cases,



$$
\widehat q_{\rm detect}=D/(D+S),\quad D+S>0.


$$
*(Eq. 66.15)*



[DERIVED] This measures the selected workflow's sensitivity to the tested mutations, not the proportion of all research that is reproducible. Preserve every excluded count; zero denominator is undefined.

```figure
{
  "id": "fig-66.15",
  "kind": "calculator",
  "title": "Numeric match has a declared tolerance",
  "caption": "Eq. 66.13 scalar components only; matching does not establish faithful protocol or a stochastic reproduction.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-66.13",
  "alt": "Eq. 66.13 scalar components only; matching does not establish faithful protocol or a stochastic reproduction.",
  "spec": {
    "tex": "\\tau=\\max(a,b|m_\\star|),\\quad z=|m-m_\\star|/\\tau",
    "equation": "66.13",
    "inputs": [
      {
        "symbol": "ref",
        "label": "Reference metric (chosen units)",
        "default": 0.8,
        "min": -100,
        "max": 100,
        "format": "raw"
      },
      {
        "symbol": "measured",
        "label": "Measured metric (same units)",
        "default": 0.79,
        "min": -100,
        "max": 100,
        "format": "raw"
      },
      {
        "symbol": "atol",
        "label": "Prespecified absolute tolerance",
        "default": 0.01,
        "min": 0.001,
        "max": 10,
        "format": "raw"
      },
      {
        "symbol": "rtol",
        "label": "Prespecified relative tolerance",
        "default": 0.02,
        "min": 0,
        "max": 1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "tol",
        "label": "Allowed scalar deviation",
        "formula": "max(atol,rtol*abs(ref))",
        "format": "raw"
      },
      {
        "symbol": "error",
        "label": "Absolute observed deviation",
        "formula": "abs(measured-ref)",
        "format": "raw"
      },
      {
        "symbol": "normalized",
        "label": "Normalized deviation (match if <=1)",
        "formula": "error/tol",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Frozen tolerance",
      "variables": {
        "ref": 0.8,
        "measured": 0.79,
        "atol": 0.01,
        "rtol": 0.02
      },
      "note": "Tolerances precede the result.",
      "highlight": [
        "normalized"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "Outside band",
      "variables": {
        "ref": 0.8,
        "measured": 0.7,
        "atol": 0.01,
        "rtol": 0.02
      },
      "note": "A non-match needs fidelity and variance diagnosis.",
      "highlight": [
        "normalized"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Near-zero reference",
      "variables": {
        "ref": 0,
        "measured": 0.01,
        "atol": 0.001,
        "rtol": 0.02
      },
      "note": "Absolute tolerance prevents a zero denominator.",
      "highlight": [
        "tol",
        "normalized"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Pin the exact scientific target, configuration, dataset/split, artifact, metric, tolerance and budget. Provide a clean-environment entrypoint, dependency lock, expected intermediate checks, output schema, resource needs and failure classification. Record necessary hosted APIs, private artifacts and approval/access conditions without presenting them as freely reproducible.

[DERIVED] An independent reviewer should reconstruct from the package before asking the original author. Audit any compatibility repair: preserve the scientific protocol, record the deviation and validate its equivalence where claimed. Do not weaken tests, alter labels, swap the model or change the target to make the run pass. An unavailable dependency is an obstruction; a validated environment restoration is additional evidence with its own provenance.

```figure
{
  "id": "fig-66.16",
  "kind": "diagram",
  "title": "Reproduction needs fidelity and measurement",
  "caption": "Independent reconstruction yields a measured agreement/non-match or a named obstruction, with every deviation retained.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.13",
  "alt": "Independent reconstruction yields a measured agreement/non-match or a named obstruction, with every deviation retained.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Frozen target + package"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Availability / identity"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Faithful bounded execution"
      },
      {
        "id": "n3",
        "kind": "metric",
        "label": "Independent recomputation"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Match / non-match / obstruction"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2",
        "label": "available"
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
        "from": "n1",
        "to": "n4",
        "label": "missing artifact"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 66.5 — Independently reproduce or identify the obstruction.**

[DERIVED] **Inputs:** frozen target/package, separate reviewer, compute/access limits and fidelity rubric. **Outputs:** measured reproduction, faithful non-match, invalid attempt or named obstruction.

1. Verify artifact availability, identity, licenses/access and executable environment.
2. Reconstruct target/configuration before running; distinguish evaluation, retraining and reimplementation.
3. Run qualified smoke/intermediate controls and the intended experiment within the declared budget.
4. Trace every reported value to saved outputs, scorer and actual artifact; independently recompute where feasible.
5. Evaluate fidelity and numeric/statistical agreement separately. Retain setup failures, deviations, missing artifacts and resource use.
6. Stop at the finite budget; publish the obstruction precisely instead of inventing a result or silently changing the experiment.

[DERIVED] Work is dominated by the target computation and independent audit. A short successful script is insufficient evidence that the target was executed.

## Implementation

[DERIVED] Supply commands with real configuration files, environment identifiers, seed policy and output locations. Include expected shapes, finite-value checks, split identities and invariants at meaningful intermediate stages. Preserve stdout/stderr, exit code, complete attempt history and raw outputs. Separate unavailable data from unavailable code, hardware incompatibility, missing weights and ambiguous scientific instructions; they imply different next actions.

[DERIVED] Validate the safeguards themselves with controlled reproducibility-relevant mutations. Relaxing a dependency pin need not install a different version; confirm resolved state before declaring a non-equivalent test. A seed change is not automatically an unacceptable result. Detection needs a requirement and semantic interpretation, not merely a failing process.

## Experimental design

[ASSUMED] Independent reviewers attempt frozen dossiers under recorded compute/access limits. In a separate disposable fixture campaign, introduce confirmed configuration changes and audit whether controls detect the ones they are designed to constrain. Preserve baseline failure and bounded restoration separately. Experiments 66.1–66.2 are proposed, unexecuted protocols; no reproduction or mutation run is reported here.

## Observations

**What the paper claims.** [PAPER-REPORTED] RECLAIM fixes claim targets and audits executed evidence across artifact-availability tiers [R66.5, §§3–5].

**What the evidence shows.** [PAPER-REPORTED] It confirms 73 of 400 agent-paper cells; 76 faithful outside-tolerance runs lack a human reproduction on the same cluster, limiting attribution [R66.5, §§5–6]. MLReproMutate detects 2 of 23 confirmed non-equivalent evaluable cases after bounded restoration [R66.7, §§5–6].

**What we infer.** [DERIVED] Execution, fidelity, agreement and safeguard sensitivity are separate outcomes.

**What remains unknown.** [UNVERIFIED] These finite selected studies do not estimate universal reproducibility or prove that every non-match is an agent error.

## Failure modes

> **Failure mode — Agreement obtained by changing the target.** [DERIVED] *Symptom:* the result matches after swapping a checkpoint, data split or evaluator. *Cause:* outcome-directed repair erases the original scientific contract. *Detection:* compare run provenance and field-level diffs with the frozen target. *Mitigation:* retain the original attempt, report deviations separately and validate equivalence before using a repaired run as support.

[DERIVED] A completed baseline and mutant can both pass because the chosen workflow checks completion rather than the changed scientific quantity. A survived mutation establishes a bounded control gap, not that the entire repository is irreproducible.

```figure
{
  "id": "fig-66.17",
  "kind": "compare",
  "title": "Distinct reproducibility outcomes",
  "caption": "Execution success, fidelity and agreement are separate; mutation survival concerns one tested workflow.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.15",
  "alt": "Execution success, fidelity and agreement are separate; mutation survival concerns one tested workflow.",
  "spec": {
    "axis": "Observation",
    "columns": [
      {
        "id": "a",
        "label": "Supports"
      },
      {
        "id": "b",
        "label": "Does not establish"
      }
    ],
    "rows": [
      {
        "dimension": "Command completes",
        "values": {
          "a": "Executability on this host",
          "b": "Intended experiment ran"
        }
      },
      {
        "dimension": "Number matches",
        "values": {
          "a": "Declared numeric relation",
          "b": "Fidelity or causal mechanism"
        }
      },
      {
        "dimension": "Mutation survives",
        "values": {
          "a": "Selected check missed this change",
          "b": "Whole repository irreproducible"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Use an original-code rerun to check the released pipeline, retraining to check data/optimization dependence and independent reimplementation to probe specification sufficiency. Reverse a bitwise target when the claim is statistical and hardware-dependent; reverse broad statistical tolerance when an exact deterministic invariant is required. Match the test to the scientific claim.

## Extensions

[DERIVED] Add privacy-preserving controlled-access evaluation, blinded independent artifact audits and validated portable kernels. A confidential package can support a controlled review while limiting public reproducibility. State what outsiders can actually check, and never describe an unavailable artifact as open merely because its metadata is public.

## Limitations

[DERIVED] Reproduction is resource- and environment-dependent. One faithful non-match can reflect stochastic variation, source errors or implementation mismatch; it needs diagnosis. One successful run cannot establish a result across all seeds or target populations. A software mutation score is not a universal quality rating.

## Reproducibility

[DERIVED] Publish exact commands/configurations, artifact/access status, expected intermediates, target/tolerance rationale, hardware/precision/runtime, all compute usage, raw outputs, audit and deviation/obstruction records. Keep public summaries within the scope outsiders can reproduce. Detailed 12-field studies and executable bindings appear in [verification](verification.md).

## References

[R66.5] Salunkhe et al., v1 (2026-09-23), §§3–6 and audit/target appendices. [R66.7] Shulepov, v1 (2026-08-27), §§3/5–8, Tables 2–5 and restoration accounting.
