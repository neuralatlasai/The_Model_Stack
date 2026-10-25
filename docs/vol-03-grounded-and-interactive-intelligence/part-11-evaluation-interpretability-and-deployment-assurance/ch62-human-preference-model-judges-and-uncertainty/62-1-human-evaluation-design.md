---
id: ms.section.62.1
entity_type: section
title: "Human evaluation design"
volume: 3
part: 11
chapter: 62
section: 62.1
slug: 62-1-human-evaluation-design
parent: ms.chapter.62
prev_sibling: null
next_sibling: ms.section.62.2
children: []
prerequisites: [ms.chapter.6, ms.chapter.61]
downstream: [ms.chapter.63, ms.chapter.66]
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

# 62.1 Human evaluation design

## Scope

[DERIVED] Human evaluation measures judgments from a specified population under a specified rubric and presentation protocol. It does not turn preference into truth or make an expert panel infallible. This section owns rubric construction, blind comparisons, rater/task sampling, qualification, consent and repeated-item design. Pairwise statistical aggregation follows in [62.2](62-2-pairwise-aggregation.md); benchmark support and general sampling foundations remain in [Chapter 61](../ch61-capability-portfolios-and-benchmark-validity/README.md) and Chapter 6.

[DERIVED] The unit is a prompt–response–rater judgment with its context and assignment. Multiple raters evaluating one response share its content; one rater evaluating many responses contributes dependence through expertise, severity and fatigue. A count of judgments is therefore not automatically a count of independent tasks, users or qualified opinions.

## Why this exists

[DERIVED] Open-ended outputs often have no single exact checker. A response can be correct but unhelpful, preferred but false, concise but incomplete, or acceptable to one user population and unsuitable to another. An undifferentiated overall-quality question forces annotators to choose an implicit utility function and then hides its variation in a mean.

[DERIVED] The controlling obstruction is constructing a judgment that corresponds to the decision. A factual-verification rubric requires evidence and domain knowledge; a preference question requires the intended users; an instruction-compliance check requires the full instruction history. Recruiting more unqualified raters can tighten an interval around the wrong measurement. The design must specify both the required competence and the legitimacy of whose preferences are being represented.

## Intuition

[DERIVED] Build a rubric as a set of observable obligations and anchored failure examples. Separate factual support, completeness, instruction compliance, relevance, style and prohibited outcomes before asking for an optional overall preference. A rater should be able to indicate insufficient information or an unresolved ambiguity instead of guessing a score. The rubric defines what the rater can inspect: references, earlier turns, tool traces and modality support.

[DERIVED] Blinding removes one presentation cue but not every model signature. Randomized answer order balances assignment; it does not guarantee each judge is order-invariant. Repeated items diagnose within-rater stability, while independently adjudicated control items test agreement with the intended predicate. A perfectly stable rater can consistently apply the wrong rule.

## Formulation

> **Definition — Population-conditioned preference.** [DERIVED] Let $u$ denote a task, $h$ a rater/user drawn from target population $H$, and $J_h(A,B,u)$ a tie-adjusted preference score in $[0,1]$. The target is

$$
\mu_{AB}=\mathbb E_{u\sim Q,\,h\sim H(\cdot\mid u)}[J_h(A,B,u)].
$$
*(Eq. 62.1)*

[DERIVED] A value of one half is tie-adjusted parity under this population and rubric, not equal factual correctness. Task-dependent rater assignment belongs in $H(\cdot\mid u)$. For a finite frame of $N_f$ judgment units with known nonzero inclusion probabilities $\pi_i$, an inverse-inclusion estimator of its fixed mean is

$$
\widehat\mu_{\mathrm{HT}}=\frac1{N_f}\sum_{i\in\mathcal S}\frac{J_i}{\pi_i},\qquad \pi_i>0.
$$
*(Eq. 62.2)*

[MATHEMATICALLY-DERIVED] Its design expectation equals the frame mean because $\mathbb E[\mathbf1\{i\in\mathcal S\}/\pi_i]=1$. This does not create a population sampling frame when respondents self-select and their inclusion probabilities are unknown. A normalized ratio-weight estimator is a different, generally finite-sample biased construction.

[MATHEMATICALLY-DERIVED] For $G$ independent equal-sized clusters of $r$ judgments with common variance $\sigma_J^2$ and common within-cluster correlation $\rho$, the mean variance is

$$
\operatorname{Var}(\overline J)=\frac{\sigma_J^2}{Gr}\big[1+(r-1)\rho\big],\qquad n_{\mathrm{eff}}=\frac{Gr}{1+(r-1)\rho}.
$$
*(Eq. 62.3)*

[DERIVED] The equicorrelation covariance must be valid; for $r>1$, $-1/(r-1)\le\rho\le1$. The displayed effective count is a variance equivalence under this model, not an estimated universal correction. Crossed task/rater effects require a richer model or resampling design.

```figure
{
  "id": "fig-62.3",
  "kind": "calculator",
  "title": "Repeated judgments and independent information",
  "caption": "Illustrative equicorrelation model from Eq. 62.3 with nonnegative within-cluster correlation. Increasing repeated judgments can leave the effective independent count close to the number of clusters; this is not an estimated correction for a real study.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.3",
  "alt": "Illustrative equicorrelation model from Eq. 62.3 with nonnegative within-cluster correlation. Increasing repeated judgments can leave the effective independent count close to the number of clusters; this is not an estimated correction for a real study.",
  "spec": {
    "tex": "n_{eff}=Gr/[1+(r-1)\\rho]",
    "equation": "62.3",
    "inputs": [
      {
        "symbol": "G",
        "label": "Independent clusters",
        "default": 100,
        "min": 1,
        "max": 1000,
        "format": "integer"
      },
      {
        "symbol": "r",
        "label": "Judgments per cluster",
        "default": 3,
        "min": 1,
        "max": 20,
        "format": "integer"
      },
      {
        "symbol": "rho",
        "label": "Within-cluster correlation",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "raw",
        "label": "Raw judgment count",
        "formula": "G*r",
        "format": "integer"
      },
      {
        "symbol": "effective",
        "label": "Variance-equivalent independent count",
        "formula": "G*r/(1+(r-1)*rho)",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Independent repeats",
      "variables": {
        "rho": 0
      },
      "highlight": [
        "effective"
      ],
      "note": "Independent repeats contribute their full count under this analytical model."
    },
    {
      "anchor": "mechanism",
      "label": "Correlated judgments",
      "variables": {
        "rho": 0.5
      },
      "highlight": [
        "effective"
      ],
      "note": "Shared task or rater effects reduce variance-equivalent information."
    },
    {
      "anchor": "failure-modes",
      "label": "Perfectly shared errors",
      "variables": {
        "rho": 1
      },
      "highlight": [
        "effective"
      ],
      "note": "Repeated dependent rows do not create additional independent clusters."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Define the target population and decision first. Domain-qualified adjudicators can check a technical predicate, while intended users can report usefulness or preference; one group does not automatically substitute for the other. Record language proficiency, domain competence and lived/task experience as relevant design variables, not as a single assumed hierarchy of expertise. Recruitment, compensation, informed consent, permitted data access and handling of sensitive material belong in the study protocol before collection.

[DERIVED] Pilot the rubric on independently reviewed examples spanning clear passes, clear failures and genuine ambiguity. Anchor each score level with observable distinctions. Ask for criterion-level judgments before an overall score when an overall score is needed. Record disagreement and evidence rather than enforcing consensus by discarding dissent. Adjudication can produce an operational reference label, but must retain the original votes and the rule by which it was created.

[DERIVED] Assign answer order randomly and preserve the realized order. Counterbalance model pair, domain and rater blocks where feasible. Insert undisclosed repeated items with an interval and order policy that limits memory effects; repeated items are for stability, not extra independent content coverage. Keep qualification controls separate from the held-out evaluation set and avoid selecting raters based on which candidate they favor.

[DERIVED] Plan the inferential hierarchy. Task-family or user/session resampling may be appropriate for deployment questions; rater resampling asks about a rater population. If the same raters and tasks are crossed, preserve both sources of dependence. Specify how skipped, unanswerable and unsupported judgments affect denominators. A study of consenting volunteers supports that recruited population unless a justified sampling/transport argument extends it.

```figure
{
  "id": "fig-62.4",
  "kind": "diagram",
  "title": "A judgment depends on population and opportunity",
  "caption": "Target tasks and raters enter a blinded assignment with rubric/evidence controls. Raw disagreement and adjudication remain separate so qualification does not silently redefine the evaluated population.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.1",
  "alt": "Target tasks and raters enter a blinded assignment with rubric/evidence controls. Raw disagreement and adjudication remain separate so qualification does not silently redefine the evaluated population.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "objective",
        "label": "Required judgment and population"
      },
      {
        "id": "n1",
        "kind": "dataset",
        "label": "Tasks and rater frame"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Rubric and opportunity controls"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Blinded randomized assignment"
      },
      {
        "id": "n4",
        "kind": "metric",
        "label": "Raw judgments and disagreement"
      },
      {
        "id": "n5",
        "kind": "process",
        "label": "Independent adjudication"
      },
      {
        "id": "n6",
        "kind": "metric",
        "label": "Population-bounded report"
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
        "to": "n6"
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

[DERIVED] **Algorithm 62.1 — Collect a blinded, auditable human evaluation.**

1. Freeze the decision, task/rater populations, criteria, evidence access, practical margins and consent/access process.
2. Pilot rubric anchors and independently validated controls. Resolve operational ambiguity without inspecting the candidate comparison outcomes.
3. Sample tasks and recruit qualified raters under logged inclusion/assignment rules. Retain the sampling frame and any unknown inclusion probabilities.
4. Randomize display order and blocks, insert prespecified repeats, and collect criterion scores, ties, abstentions, evidence and time spent.
5. Apply preregistered quality checks using appropriate opportunity denominators. Do not classify a rater who saw no positive controls as incapable of detecting positives.
6. Preserve raw judgments and reasons; adjudicate disputed items independently under a versioned rule.
7. Analyze dependence and subgroup coverage, report recruitment/retention and disagreement, and confirm any selected choice on held-out tasks.

[DERIVED] Collection terminates at finite participant/task/time caps with missingness recorded. Consent withdrawal and incomplete assignments require declared retention and denominator rules rather than silent replacement with more favorable judgments.

## Implementation

[DERIVED] The annotation interface should display exactly the allowed evidence, hide model identity where blinding is required, preserve answer order and prevent reference labels from leaking into candidate text. Store task, response, rater, rubric, order, assignment, repeat and timestamp identities. Keep personally identifying recruitment records separate from the analytic ledger, using only the fields needed for the sampling argument.

[DERIVED] Rubric changes require a new version and a bridge sample if old/new judgments will be compared. A structured response schema improves completeness of recording but cannot establish sound judgment. Permit explicit not-enough-information values; forcing every case into a numeric score conceals whether the rater could inspect the evidence needed for correctness.

[DERIVED] Human effort scales with the number of assigned judgments and their review time, including training, controls, adjudication and discarded assignments. Model/evidence preparation adds inference and storage cost. Repeated items increase precision for within-rater behavior but can add little independent population information under Eq. 62.3. Annotator time, compensation and review expense must be measured rather than inferred from a nominal item count. No participant or annotation interface was used by the book.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Hussain and colleagues describe three-stakeholder consensus plus senior adjudication for a mental-health error dataset. Their human baseline recruits 233 people but reports 55 after filtering F1 below 0.2; the paper notes that some excluded raters saw no positive cases. The retained cohort spans patients, public participants, providers, researchers, care partners and an administrator [R62.1, §§3–3.1, Table 1].

[DERIVED] This protocol illustrates both multi-perspective review and a consequential selection problem. A zero-positive assignment does not identify positive-class recall or F1-based expertise. Retained-group comparisons condition on the performance filter and task allocation; they are not unfiltered population comparisons. Consensus is the study's reference construction, not independent proof of clinical correctness or deployment readiness.

## Observations

**What the paper claims.** [PAPER-REPORTED] The study motivates domain-informed, multi-stakeholder evaluation of hallucinations and omissions [R62.1, §§3–5].

**What the evidence shows.** [DERIVED] Qualification, assignment opportunity and performance-based retention change the population being summarized.

**What we infer.** [DERIVED] Recruitment and retention need their own ledger and validity argument.

**What remains unknown.** [NOT-DISCLOSED] This study does not establish the reader's target-user preferences or the validity of a different rubric.

## Failure modes

> **Failure mode — Qualification by missing opportunity.** [DERIVED] *Symptom:* a rater is rejected for failing to detect a class absent from assigned items. *Cause:* a performance statistic is used without its opportunity denominator. *Detection:* inspect per-rater class counts, controls and undefined metric handling. *Mitigation:* use separately designed qualification evidence and retain the allocation/retention sensitivity.

[MATHEMATICALLY-DERIVED] If a rater receives only negative items, both true-positive and false-negative counts are zero. Recall has denominator zero; a software convention returning F1 equal to zero does not prove inability to recognize a positive case. With perfectly correlated repeats, Eq. 62.3 gives $n_{\mathrm{eff}}=G$ regardless of how many times each cluster is repeated.

[DERIVED] Other failures include unblinding through brand names, evidence unavailable to raters, fatigue-related missingness, and rubric anchors that reward verbosity rather than usefulness. Diagnose these through order controls, assignment logs, independent controls and targeted review rather than assuming a larger panel averages them away.

```figure
{
  "id": "fig-62.5",
  "kind": "compare",
  "title": "Stability controls and validity controls",
  "caption": "Repeated identical items test consistency; independently checked controls test the intended judgment. Neither proves the other, and both require a defined sampling opportunity.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.3",
  "alt": "Repeated identical items test consistency; independently checked controls test the intended judgment. Neither proves the other, and both require a defined sampling opportunity.",
  "spec": {
    "axis": "What an annotation control can establish",
    "columns": [
      {
        "id": "a",
        "label": "Repeated item"
      },
      {
        "id": "b",
        "label": "Independent reference control"
      }
    ],
    "rows": [
      {
        "dimension": "Primary target",
        "values": {
          "a": "Within-rater stability",
          "b": "Agreement with intended predicate"
        }
      },
      {
        "dimension": "Possible failure",
        "values": {
          "a": "Consistently wrong judgment",
          "b": "Reference itself may be wrong"
        }
      },
      {
        "dimension": "Denominator",
        "values": {
          "a": "Repeated eligible assignments",
          "b": "Actual opportunities for each class"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer direct user sampling when the target is user preference; prefer domain-qualified adjudication for a factual or professional predicate; use both when both are requirements. Reverse a cheap general-rater design if errors require unavailable expertise, and reverse an expert-only preference claim if it fails to represent the intended users.

[DERIVED] [Pairwise aggregation](62-2-pairwise-aggregation.md) models judgments after collection. [Model judges](62-3-model-as-judge.md) reduce some annotation cost but inherit a validation obligation against a relevant independent reference. [Chapter 61](../ch61-capability-portfolios-and-benchmark-validity/README.md) supplies the task-support and protocol contract.

## Extensions

[DERIVED] A useful improvement changes the rubric's ability to discriminate a required failure or improves representation of the target population at acceptable expense. Higher raw inter-rater agreement can also result from deleting difficult cases, collapsing categories or selecting homogeneous raters. Evaluate those mechanisms separately.

[DERIVED] Next evidence should follow the obstruction: disputed factual labels require evidence/adjudication; preference heterogeneity requires population slices; order sensitivity requires matched swaps; unqualified assignments require better recruitment or task allocation. Repeating the same clear examples does not repair a missing user group.

## Limitations

[DERIVED] Human judgments are context-dependent and can remain irreducibly heterogeneous. A qualified panel can agree on a wrong fact, while a minority view can represent an important target subgroup. Blinding, training and controls reduce specific biases; they do not create a universal gold standard.

[UNVERIFIED] No human evaluation, consent process or clinical deployment assessment was executed for this chapter. The source study's outcomes are bounded by its reported data and selection; the book's protocol remains a proposal.

## Reproducibility

[DERIVED] Archive recruitment and retention counts, target/sampling frames, qualification opportunity, rubric anchors, assignments, display order, raw criterion judgments, ties/abstentions, repeats and adjudication. Record consent/access and retention procedures without exposing private participant records. Preserve enough deidentified structure to reconstruct dependence and exclusions.

[ASSUMED] [Experiment 62.1](verification.md#experiment-621--human-and-order-audit) proposes a blinded human/order audit. It is unexecuted; its planned sample is not evidence of adequate power until the intended margin and sampling design are specified.

## References

[R62.1] Hussain et al., inspected v1, §§3–3.1 and the relevant §5 evaluation tables. Exact release/inspection fields and the cohort-selection limit appear in [references](references.md).
