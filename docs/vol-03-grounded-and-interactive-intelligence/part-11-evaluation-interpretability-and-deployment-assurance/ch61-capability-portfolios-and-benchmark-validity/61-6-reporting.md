---
id: ms.section.61.6
entity_type: section
title: "Reporting"
volume: 3
part: 11
chapter: 61
section: 61.6
slug: 61-6-reporting
parent: ms.chapter.61
prev_sibling: ms.section.61.5
next_sibling: ms.verification.61
children: []
prerequisites: [ms.chapter.6, ms.chapter.31, ms.chapter.49, ms.chapter.55, ms.chapter.56, ms.chapter.57]
downstream: [ms.chapter.62, ms.chapter.66]
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

# 61.6 Reporting

## Scope

[DERIVED] A research report must expose the estimand, offered population, protocol, denominators, uncertainty, resource boundary, and decision margin. Its purpose is to make the inference assessable, including where it can fail. This section owns portfolio reporting and restrictions on cross-paper comparison; general uncertainty and quality/resource frontiers remain canonical in [Chapter 6](../../../vol-01-learning-and-representation/part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md).

[DERIVED] Report task-level results before aggregates, preserve failure and abstention counts, and state whether uncertainty concerns sampled items, inference randomness, judges, or independently trained checkpoints. Repeated samples from one checkpoint do not estimate training-run variation. A narrow interval conditional on one selected benchmark pool does not establish broad population validity.

## Why this exists

[DERIVED] A leaderboard compresses a high-dimensional instrument into a few numbers. Compression is useful only if its weights and omitted dimensions are visible. Different model orderings can arise from different task mixtures without any contradiction in item-level results. Different uncertainty estimates can arise from treating translations or repeated episodes as independent when they are not.

[DERIVED] The dominant constraint is preserving the inferential unit through aggregation. A million correlated responses can carry far less independent information than their row count suggests. Reporting the total is still necessary for expense and workload accounting, but it must not be mistaken for the effective sample size or the number of independently developed systems.

## Intuition

[DERIVED] Compare paired outcomes whenever the same offered items are available. The informative observation is the within-item difference, not two unrelated standard errors. For grouped tasks, preserve the cluster when resampling. For aggregate scores, apply exactly the same weights to each candidate and disclose whether they represent benchmark conventions, equal task importance, or estimated deployment frequency.

[DERIVED] A score is not a utility unless a decision-maker supplies the mapping. A small mathematical accuracy gain can be irrelevant under a violated latency requirement; a mean preference gain can coexist with more severe failures. Report the frontier and noncompensable constraints rather than forcing an unsupported universal winner.

## Formulation

[MATHEMATICALLY-DERIVED] For independent identically distributed paired items $z_i=Y_{Ai}-Y_{Bi}$ and $n>1$, the paired mean difference and its estimated standard error are

$$
\widehat\Delta=\frac1n\sum_i z_i,\qquad \widehat{\operatorname{SE}}(\widehat\Delta)=\sqrt{\frac{\sum_i(z_i-\widehat\Delta)^2}{n(n-1)}}.
$$
*(Eq. 61.16)*

[DERIVED] This is a standard-error estimator, not an exact confidence interval. A normal approximation requires a suitable sampling regime; clustered families or raters require a cluster-aware procedure. Resample both candidates' outcomes together to preserve pairing. If there is one cluster, a cluster bootstrap cannot create independent clusters.

[MATHEMATICALLY-DERIVED] For $R$ prespecified bounded-score means, each based on at least $n$ independent identically distributed $[0,1]$ observations within its cell, Hoeffding plus a union bound gives simultaneous error at most $\varepsilon$ with probability at least $1-\alpha$ when

$$
n\ge\frac{\log(2R/\alpha)}{2\varepsilon^2},\qquad 0<\varepsilon<1,\quad 0<\alpha<1.
$$
*(Eq. 61.17)*

[DERIVED] Independence between cells is unnecessary for the union bound; within-cell sampling premises remain necessary. This conservative design bound is not a power calculation for paired ranking differences, a correction for adaptive search, or a formula using raw correlated row counts.

[MATHEMATICALLY-DERIVED] With per-task counts $n_r>0$ and declared nonnegative weights summing to one,

$$
\widehat v_{\mathrm{macro},w}=\sum_{r=1}^{R}w_r\widehat v_r,\qquad \widehat v_{\mathrm{micro}}=\frac{\sum_r n_r\widehat v_r}{\sum_r n_r}.
$$
*(Eq. 61.18)*

[DERIVED] Micro-aggregation is the special weight choice $w_r=n_r/\sum_s n_s$, not a neutral default. Neither expression automatically estimates deployment performance.

```figure
{
  "id": "fig-61.18",
  "kind": "calculator",
  "title": "Simultaneous bounded-mean design bound",
  "caption": "Illustrative conservative sample-size bound from Eq. 61.17. It assumes independent identically distributed bounded scores within every prespecified cell; correlated raw rows and adaptive comparisons do not satisfy this premise automatically.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.17",
  "alt": "Illustrative conservative sample-size bound from Eq. 61.17. It assumes independent identically distributed bounded scores within every prespecified cell; correlated raw rows and adaptive comparisons do not satisfy this premise automatically.",
  "spec": {
    "tex": "n\\ge\\log(2R/\\alpha)/(2\\varepsilon^2)",
    "equation": "61.17",
    "inputs": [
      {
        "symbol": "cells",
        "label": "Prespecified cells",
        "default": 8,
        "min": 1,
        "max": 100,
        "format": "integer"
      },
      {
        "symbol": "alpha",
        "label": "Family error probability",
        "default": 0.05,
        "min": 0.001,
        "max": 0.2,
        "format": "percent"
      },
      {
        "symbol": "eps",
        "label": "Absolute accuracy tolerance",
        "default": 0.05,
        "min": 0.005,
        "max": 0.2,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "n",
        "label": "Minimum independent cases per cell",
        "formula": "ceil(ln(2*cells/alpha)/(2*eps^2))",
        "format": "integer"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Five-point tolerance",
      "variables": {
        "eps": 0.05,
        "cells": 8
      },
      "highlight": [
        "n"
      ],
      "note": "The illustrative bound counts independent cases per prespecified cell."
    },
    {
      "anchor": "mechanism",
      "label": "Tighter tolerance",
      "variables": {
        "eps": 0.025,
        "cells": 8
      },
      "highlight": [
        "n"
      ],
      "note": "Halving the tolerance increases this conservative requirement quadratically."
    },
    {
      "anchor": "failure-modes",
      "label": "More declared comparisons",
      "variables": {
        "eps": 0.05,
        "cells": 40
      },
      "highlight": [
        "n"
      ],
      "note": "Multiplicity changes the evidence requirement; correlated row counts cannot replace it."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Start the report with the decision, required population, time window, candidate identities and protocol hashes. Then give a task ledger containing offered/eligible/completed/accepted counts, failures, abstentions, exact metrics and intervals. Use task-specific denominators and show excluded cases with reasons. Distinguish a prespecified primary comparison from exploratory slices and candidate selection.

[DERIVED] For repeated or grouped data, declare the sampling hierarchy: source document, item family, language translation, user, session, environment seed, judge and model run. Use resampling or a model that respects dependencies relevant to the inferential target. An item-cluster interval conditions on the selected models; a model-family interval asks a different question. Disclose small numbers of independent clusters and unstable tail estimates.

[DERIVED] Report both absolute levels and paired differences, practical acceptance margins and multiplicity handling. An interval including zero is not evidence of equivalence; equivalence requires a prespecified margin and adequate precision. A statistically detectable difference is not necessarily consequential. A selected best score needs confirmation or selection-aware inference, including the prompts and protocols tried.

[DERIVED] Report resources over the same offered cohort. Record input/output and reasoning tokens, tool/grader calls, retries, wall-clock delays and failure time. Use the shared [cost-per-accepted-task contract](../../../front-matter/notation.md) with a strictly positive accepted denominator; report undefined cost per accepted task if none pass. Timing quantiles should specify offered versus completed cases and timeout censoring rather than dropping slow failures. Hardware, model, precision, sequence length, input/output distribution, concurrency, runtime revision and measurement boundary accompany every reported performance value.

```figure
{
  "id": "fig-61.19",
  "kind": "diagram",
  "title": "Every summary reconnects to offered outcomes",
  "caption": "Task and protocol identities join outcomes, resources and clusters. The report exposes task vectors and gates before an optional weighted aggregate and decision-sensitive conclusion.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.18",
  "alt": "Task and protocol identities join outcomes, resources and clusters. The report exposes task vectors and gates before an optional weighted aggregate and decision-sensitive conclusion.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Offered task ledger"
      },
      {
        "id": "n1",
        "kind": "dependency",
        "label": "Protocol and cluster IDs"
      },
      {
        "id": "n2",
        "kind": "metric",
        "label": "Task outcomes and uncertainty"
      },
      {
        "id": "n3",
        "kind": "metric",
        "label": "Resource and failure ledger"
      },
      {
        "id": "n4",
        "kind": "branch",
        "label": "All required gates pass?"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Optional declared aggregate"
      },
      {
        "id": "n6",
        "kind": "objective",
        "label": "Bounded decision and reversal"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n2"
      },
      {
        "from": "n1",
        "to": "n2"
      },
      {
        "from": "n0",
        "to": "n3"
      },
      {
        "from": "n2",
        "to": "n4"
      },
      {
        "from": "n3",
        "to": "n4"
      },
      {
        "from": "n4",
        "to": "n5",
        "label": "yes"
      },
      {
        "from": "n4",
        "to": "n6",
        "label": "no or unresolved"
      },
      {
        "from": "n5",
        "to": "n6"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 61.6 — Produce a decision-auditable report.**

1. Validate that every offered key has exactly one terminal outcome or an explicit unresolved/infrastructure status. Reconcile attempted calls and billed resources with the ledger.
2. Compute task metrics and uncertainty under the declared sampling design. Preserve paired IDs and clusters; do not substitute repeated rows for independent units.
3. Apply frozen aggregation weights and noncompensable gates. Publish the vector and counts before the aggregate.
4. Perform prespecified protocol, label and population-weight sensitivity analyses. Mark exploratory discoveries and confirm selected conclusions on independent evidence.
5. Join cost and timing to the same offered task IDs. Record incomplete/resource-exhausted cases and acceptance-conditioned quantities separately.
6. State the supported comparison, practical margin, unresolved assumptions, and evidence that would reverse the choice. If candidate protocols are incompatible, do not publish a common ranking.
7. Archive the artifact and stop when the planned evidence resolves the stated decision or the budget ends with an explicit unresolved conclusion.

[DERIVED] The report pass is linear in stored outcomes for fixed metrics; pairwise candidate comparisons can require $O(m^2n)$ work if all pairs are examined. The number of comparisons belongs in the analysis plan.

## Implementation

[DERIVED] Store raw outcomes in an append-only ledger with stable task, system, protocol, repeat, attempt and judge IDs. Derived tables must name their transformation version. Use explicit missing states rather than NaN-as-zero or silently dropping records. A dashboard should expose counts and protocol differences on the same surface as a comparison, so an attractive aggregate cannot conceal an incompatible denominator.

[OFFICIAL-DOCUMENTATION] The pinned harness metrics module separates metric aggregation from metric-specific standard-error dispatch and includes bootstrap-based estimators for selected functions [R61.11, stderr_for_metric and bootstrap_stderr]. Static inspection establishes the named implementation surface, not correctness for every dependency structure or workload.

[DERIVED] A generic item bootstrap can be wrong for translated copies, shared source documents, repeated users or correlated judges even if correctly implemented. The researcher must choose the resampling unit. A reweighting or macro/micro switch requires its uncertainty computation to change consistently; retaining an old pooled standard error beside a new point estimate is a different instrument.

[DERIVED] Report generation costs CPU and storage for joins, resampling and publication, with bootstrap work proportional to replicates times the resampled ledger size for direct implementations. These costs can be bounded independently of model inference. Device energy and money require actual metering and pricing records; parameter counts or advertised peak throughput are not substitutes.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Truong and colleagues compare expert-schema-guided synthetic evaluation data with a few-shot baseline in social work. Their human study has six experts reviewing five examples per condition; the compared datasets have 100 generated examples per method. Five experts prefer the schema condition. Automatic style similarity favors the baseline while expert style ratings favor the schema; coverage and content realism improve, but diversity does not [R61.4, §§4–7, Table 1].

[DERIVED] This is a concrete reason to report dimensions and measurement disagreement. An aggregate called dataset quality could obscure a proxy whose ordering differs from qualified reviewers. The small context-specific study does not establish universal preference, deployment safety, or the training value of those generated samples.

## Observations

**What the paper claims.** [PAPER-REPORTED] Structured expert input improves several context-specific evaluation-data dimensions [R61.4, §§6–8].

**What the evidence shows.** [DERIVED] Different quality dimensions and instruments need not agree on one ranking.

**What we infer.** [DERIVED] Report the construct, sample and disagreement rather than resolving it by an arbitrary average.

**What remains unknown.** [NOT-DISCLOSED] Generalization to other professions, organizations and actual downstream model decisions is not established by this small study.

## Failure modes

> **Failure mode — Denominator engineering.** [DERIVED] *Symptom:* Accuracy and cost appear better after failures or retries disappear. *Cause:* Different conditional cohorts and expense windows are combined in one headline comparison. *Detection:* Reconcile every offered task and attempt against acceptance, timing and resource ledgers. *Mitigation:* Retain offered denominators and separately label completed/accepted-case diagnostics.

[MATHEMATICALLY-DERIVED] Consider analytical task rates for systems $A=(0.9,0.6)$ and $B=(0.8,0.8)$. Equal-task weighting prefers $B$ (0.8 versus 0.75); weighting the first task by 0.9 prefers $A$ (0.87 versus 0.8). The conflict is a weight choice, not a measurement contradiction. Counts alone must not decide the target weights.

[DERIVED] Cross-paper rankings are especially fragile when task revisions, hidden reasoning budgets, tool access, graders or failure policies differ. Two reported intervals can overlap despite a significant paired difference, or fail to overlap under a confounded protocol. Without item-level matched data and compatible instruments, state separate source-conditioned results rather than inventing a precise ordering.

```figure
{
  "id": "fig-61.20",
  "kind": "compare",
  "title": "Macro and micro weights answer different questions",
  "caption": "Equation 61.18 shows that pooled accuracy weights tasks by their sample sizes. Equal-task weights and deployment weights require separate justification and can reverse the preferred candidate.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.18",
  "alt": "Equation 61.18 shows that pooled accuracy weights tasks by their sample sizes. Equal-task weights and deployment weights require separate justification and can reverse the preferred candidate.",
  "spec": {
    "axis": "Meaning of a portfolio aggregate",
    "columns": [
      {
        "id": "a",
        "label": "Equal-task macro"
      },
      {
        "id": "b",
        "label": "Pooled micro"
      }
    ],
    "rows": [
      {
        "dimension": "Weights",
        "values": {
          "a": "One divided by task count",
          "b": "Task sample count divided by total"
        }
      },
      {
        "dimension": "Target",
        "values": {
          "a": "Equal task importance if justified",
          "b": "Sampled item mixture"
        }
      },
      {
        "dimension": "Main risk",
        "values": {
          "a": "Arbitrary task partition",
          "b": "Benchmark size silently becomes utility"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] A task vector is preferable when requirements are heterogeneous or weights uncertain. A weighted aggregate is useful when the weighting population and utility interpretation are defensible. A constrained frontier is preferable when latency, expense and quality trade off. Reverse a scalar-summary preference if sensitivity to plausible weights changes the decision or hides a failed gate.

[DERIVED] [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md) handles preference populations, judge disagreement and calibration. [Chapter 63](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) adds repeated episodes, policy compliance, stage-level attribution and offered-load reliability. [Chapter 66](../ch66-release-decisions-reproducibility-and-research-to-production-closure/README.md) owns the release decision that consumes this report.

## Extensions

[DERIVED] Report sensitivity as a decision update: a new label revision reverses the candidate choice; a budget change makes both inadmissible; plausible population weights preserve the choice; or current uncertainty is too large to distinguish candidates within the practical margin. These outcomes have different implications for further research.

[DERIVED] Additional samples are worthwhile when sampling uncertainty controls the decision. They are not the appropriate remedy for an invalid grader, missing target support, or an incomparable endpoint. Investigation priority should follow the uncertainty that can actually reverse an acceptable choice, not whichever metric is easiest to increase.

## Limitations

[DERIVED] Confidence statements condition on the sampling model and cannot compensate for construct error. Robust intervals can still be irrelevant to an unmeasured population. Cost records can omit shared infrastructure unless the attribution window is explicit. User utility and acceptable failure severity require an accountable choice; a benchmark cannot supply them by itself.

[UNVERIFIED] The chapter supplies no new model scores or measured ranking. A complete local compiler check establishes manuscript structure and visual syntax only, not benchmark validity, statistical replication, or a numerical quality rating.

## Reproducibility

[DERIVED] The final portfolio artifact contains requirements, coverage map, immutable protocol manifests, item/variant lineage, raw offered outcomes, grader controls, exclusion ledger, task reports, paired/cluster-aware analysis, resource joins, sensitivity results, and a decision note naming reversal conditions. Record exact code revisions and distinguish source inspection from execution.

[ASSUMED] [Experiment 61.3](verification.md#experiment-613--paired-report-and-decision-audit) proposes a report reconstruction and sensitivity audit. It remains unexecuted. Every illustrative figure computes a stated equation on chosen inputs and must be read at that conditional level.

## References

[R61.4] Truong et al., inspected v1, §§4–8, Table 1 and relevant appendices. [R61.11] Harness metrics source at the pinned v0.4.13 commit. See [references](references.md) for exact inspection scope.
