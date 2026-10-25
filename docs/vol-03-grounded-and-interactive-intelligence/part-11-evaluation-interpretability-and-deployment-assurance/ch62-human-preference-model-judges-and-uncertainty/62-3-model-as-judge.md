---
id: ms.section.62.3
entity_type: section
title: "Model-as-judge"
volume: 3
part: 11
chapter: 62
section: 62.3
slug: 62-3-model-as-judge
parent: ms.chapter.62
prev_sibling: ms.section.62.2
next_sibling: ms.section.62.4
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

# 62.3 Model-as-judge

## Scope

[DERIVED] A model judge is an inference system that maps candidate outputs, instructions and permitted evidence to grades. It may produce absolute scores, pairwise preferences, criterion labels or structured error localization. This section owns its construction and independent validation. Bias and adversarial behavior follow in [62.4](62-4-judge-failure-modes.md); confidence-to-action control follows in [62.5](62-5-confidence-and-abstention.md).

[DERIVED] Judge quality is conditional on the task, rubric, reference, input support, prompt, endpoint and output parser. A strong answer generator is not automatically a valid evaluator in every domain. Conversely, a modest specialized checker can be preferable when it directly tests the required predicate.

## Why this exists

[DERIVED] Human review can be expensive at the scale of model development, but replacing it with an unvalidated judge changes the measurement rather than removing uncertainty. A judge may reward fluent errors, follow instructions embedded in the candidate response, or miss a required omission. An ensemble can repeat a shared mistake with high confidence.

[DERIVED] The obstruction is validating the measurement channel independently of the candidate comparison. Agreement with a convenient existing model judge is not independent evidence of truth. Prompt tuning on the same human labels later used to advertise judge accuracy turns evaluation into training unless a held-out confirmation set remains.

## Intuition

[DERIVED] Decompose judging into evidence admission, rubric application, structured output and a validated parser. References can constrain factual checks, but may be incomplete or wrong; a reference-aware judge measures support under that evidence, not unrestricted truth. Pairwise grading controls some scale/severity effects while introducing display-order dependence and candidate-relative judgments. Absolute grading permits comparisons to anchored criteria but requires stable scale interpretation.

[DERIVED] A rationale is useful as a review artifact when it identifies checkable evidence and failure location. It is not proof of the judge's internal computation. Independently verifying a cited span or executable claim can strengthen the evaluation; asking the same model to endorse its own rationale does not provide an independent oracle.

## Formulation

[MATHEMATICALLY-DERIVED] A structured evaluator can be tested against independent labels for side $y_i^\star$, error location $r_i^\star$ and category $t_i^\star$:

$$
A_i^{\mathrm{joint}}=\mathbf1\{\widehat y_i=y_i^\star,\ \widehat r_i=r_i^\star,\ \widehat t_i=t_i^\star\},\qquad A_i^{\mathrm{joint}}\le\mathbf1\{\widehat y_i=y_i^\star\}.
$$
*(Eq. 62.7)*

[DERIVED] This stricter target tests output localization as well as side choice. It does not establish causal faithfulness of the rationale. All target fields and their validity must exist; absent labels cannot silently relax a strict joint criterion.

[MATHEMATICALLY-DERIVED] For a binary true predicate $Z$, observed judge label $\widehat Z$, sensitivity $s=P(\widehat Z=1\mid Z=1)$, specificity $c=P(\widehat Z=0\mid Z=0)$, true prevalence $p$ and observed positive rate $q$,

$$
q=sp+(1-c)(1-p),\qquad p=\frac{q+c-1}{s+c-1}\quad\text{if }s+c\ne1.
$$
*(Eq. 62.8)*

[DERIVED] The inversion requires the same sensitivity/specificity on the target population and a trustworthy reference. Values estimated with uncertainty can yield an unstable or out-of-range plug-in result; clipping does not remove uncertainty or misspecification. At $s+c=1$, the observed rate carries no prevalence information in this model. Multiplying observed positives by precision recovers the detected true-positive fraction $sp$, not total positive prevalence $p$ when recall is below one; correcting only false positives cannot recover missed positives.

[MATHEMATICALLY-DERIVED] For binary labels on the same evaluated distribution,

$$
|\mathbb E[\widehat Z]-\mathbb E[Z]|\le P(\widehat Z\ne Z),\qquad |\widehat\Delta_{\mathrm{judge}}-\Delta_{\mathrm{true}}|\le e_A+e_B
$$
*(Eq. 62.9)*

[DERIVED] The second relation is a population bias bound for candidates with judge misgrading probabilities $e_A,e_B$, not a finite-sample confidence statement; hats label the judge-defined contrast here. Sampling error and estimated error bounds must be added separately. A validation slice must represent the candidate-conditioned target distribution for these rates to transfer.

```figure
{
  "id": "fig-62.9",
  "kind": "calculator",
  "title": "Judge-rate correction needs identification",
  "caption": "Illustrative binary confusion model in Eq. 62.8, not measured judge performance. Sensitivity and specificity must transfer to the target population; the plug-in estimate may leave the probability range and is not silently clipped.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.8",
  "alt": "Illustrative binary confusion model in Eq. 62.8, not measured judge performance. Sensitivity and specificity must transfer to the target population; the plug-in estimate may leave the probability range and is not silently clipped.",
  "spec": {
    "tex": "q=sp+(1-c)(1-p);\\quad p=(q+c-1)/(s+c-1)",
    "equation": "62.8",
    "inputs": [
      {
        "symbol": "q",
        "label": "Observed positive fraction",
        "default": 0.3,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "sens",
        "label": "Illustrative sensitivity",
        "default": 0.8,
        "min": 0.6,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "spec",
        "label": "Illustrative specificity",
        "default": 0.9,
        "min": 0.6,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "prevalence",
        "label": "Unclipped plug-in prevalence",
        "formula": "(q+spec-1)/(sens+spec-1)",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Illustrative validation rates",
      "variables": {
        "sens": 0.8,
        "spec": 0.9
      },
      "highlight": [
        "prevalence"
      ],
      "note": "The inversion is conditional on transferable sensitivity and specificity."
    },
    {
      "anchor": "mechanism",
      "label": "Lower sensitivity",
      "variables": {
        "sens": 0.6,
        "spec": 0.9
      },
      "highlight": [
        "prevalence"
      ],
      "note": "Missing positives changes the inferred prevalence even at the same observed rate."
    },
    {
      "anchor": "failure-modes",
      "label": "Boundary mismatch visible",
      "variables": {
        "q": 0,
        "sens": 0.8,
        "spec": 0.9
      },
      "highlight": [
        "prevalence"
      ],
      "note": "An out-of-range plug-in value exposes incompatible estimates rather than being silently clipped."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Select the required output first: an anchored criterion score, a pairwise preference, or an error-location tuple. Give the judge the evidence needed for that output, including prior turns and relevant tool/media state. Specify whether it should penalize unsupported claims, missing obligations, style or refusal, and how conflicts or insufficient evidence are handled. Keep these axes separate before an overall grade.

[DERIVED] Build a validation set with independently adjudicated passes, failures, omissions, ambiguous cases and adversarially formatted responses. Stratify by error type and difficulty rather than reporting one agreement value. Separate judge-prompt development, calibration, model/ensemble selection and final confirmation. Validate the parser with known structured outputs and invalid-output controls; an unparseable verdict is an offered evaluator failure.

[DERIVED] For pairwise judgments, randomize and log order, run a prespecified swapped subset and map verdicts back to actual candidate IDs. For reference grading, audit reference errors and evidence sufficiency. For ensembles, measure member errors against the independent labels and their overlap. Diversity of provider names or prompts does not establish independent errors, and consensus on a false label remains false.

[DERIVED] Use qualified human adjudication or stronger executable checks where model judgments cannot reliably distinguish the decision-relevant failures. A hybrid allocation can send uncertain or high-severity cases to independent review, but evaluate the whole allocation policy, its coverage and expense. The confidence score used to route review needs a separate validated operating rule.

```figure
{
  "id": "fig-62.10",
  "kind": "diagram",
  "title": "Judge validation precedes candidate grading",
  "caption": "A frozen rubric and schema are checked against independent labels and parser controls. Candidate grading is admitted only within that validated role; failed controls return to instrument design.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.7",
  "alt": "A frozen rubric and schema are checked against independent labels and parser controls. Candidate grading is admitted only within that validated role; failed controls return to instrument design.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "objective",
        "label": "Required grade and evidence"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Judge prompt and parser"
      },
      {
        "id": "n2",
        "kind": "dataset",
        "label": "Independent reference labels"
      },
      {
        "id": "n3",
        "kind": "branch",
        "label": "Validation meets margin?"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Repair or narrow judge role"
      },
      {
        "id": "n5",
        "kind": "model",
        "label": "Candidate-output grading"
      },
      {
        "id": "n6",
        "kind": "metric",
        "label": "Grade plus judge uncertainty"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n3"
      },
      {
        "from": "n2",
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "no"
      },
      {
        "from": "n4",
        "to": "n1",
        "label": "revise"
      },
      {
        "from": "n3",
        "to": "n5",
        "label": "yes"
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

[DERIVED] **Algorithm 62.3 — Validate and apply a model judge.**

1. Freeze rubric, evidence access, output schema, endpoint revision and parser, with explicit invalid/abstain states.
2. Split independent reference labels into development, calibration and confirmation sets at the task-family/source level.
3. Tune only on development data, then freeze any ensemble/member weights and review-routing policy. Keep the final confirmation labels unused.
4. Test ordinary, missing-evidence, order, style and adversarial controls. Report per-category confusion and disagreement, not just overall agreement.
5. Confirm decision-relevant error bounds under the target population and candidate distribution. Reject or narrow the judge role if its errors can reverse the selection.
6. Grade candidate outputs with finite call/retry/time budgets, retaining every raw response, parser state, member vote and review action.
7. Publish both the candidate result and the judge validation boundary. Revalidate after judge, rubric, population or candidate-output distribution changes.

[DERIVED] An automatic grade is admitted only at the level independently supported. A failed judge call cannot be converted into a candidate success by omission.

## Implementation

[OFFICIAL-DOCUMENTATION] RankJudge source at commit 1e2260c8f4564b81179a8632d651876e16daa5d2 stores verdict, predicted/target turn and type, component correctness and an overall field. run_match conjoins turn/type correctness only when the relevant values are present; its strict JSON request does not itself require ground-truth completeness [R62.8, run_match]. The book's stricter Eq. 62.7 therefore requires validating required metadata before scoring.

[OFFICIAL-DOCUMENTATION] The same revision's metrics module removes incomplete and unanimous pairs based on the judges observed in collected matches, and optionally removes the highest-rated pair slice [R62.9, _filter_trivial_pairs and _select_top_pids].

[DERIVED] An evaluation needing a fixed configured roster must check that roster separately: a judge missing from every record is not represented by a set inferred only from observed records. Outcome-based filtering changes the scored population and must be reported. Retain the unfiltered offered ledger alongside any informative-pair ranking. The source's stored usage reflects the returned attempt; a complete expense ledger must preserve all attempts rather than presume that one record includes earlier retry expense.

[DERIVED] A reference-baseline comparison uses approximately $mn$ pairs for $m$ candidates and $n$ tasks; all-pairs comparison uses $n m(m-1)/2$. Multiple judges/repeats and references multiply execution expense and input tokens. Long contexts, reasoning outputs and adjudication can dominate costs. Static inspection of these files is not API execution, package compatibility or reproduction of the paper.

## Experimental design

### Reported experiments

[PAPER-REPORTED] RankJudge generates reference-grounded conversation pairs with a single intended flawed turn, grading side, turn and category jointly. It evaluates 21 judges in machine learning, biomedicine and finance. Its authors audit 120 of 703 informative pairs and identify 17 noisy/ambiguous pairs; the published slice also applies a judge-set-dependent hard-pair cut [R62.3, §3, Appendix C].

[DERIVED] The methodology improves localization resolution relative to verdict-only comparison. Its filtering trades validity against coverage and makes the evaluated slice depend on the judge set. A generated single-flaw plan is not proof that the realized pair has exactly one flaw; the human audit is evidence about that construction error, not universal ground truth.

## Observations

**What the paper claims.** [PAPER-REPORTED] Joint side/turn/type evaluation distinguishes a correct preference from correct error localization [R62.3, §3].

**What the evidence shows.** [DERIVED] Synthetic construction still needs independent label and filtering audits.

**What we infer.** [DERIVED] Validate metadata, parser and evaluator separately from candidate performance.

**What remains unknown.** [UNVERIFIED] The inspected implementation has not been executed and does not establish judge validity on the reader's workflows.

## Failure modes

> **Failure mode — Judge agreement mistaken for independent truth.** [DERIVED] *Symptom:* an ensemble confidently accepts a shared false claim. *Cause:* members share training, prompts, references or failure modes, and consensus substitutes for independent validation. *Detection:* inspect error overlap on qualified reference labels and held-out adversarial controls. *Mitigation:* use independent evidence or review for the failure classes the ensemble cannot resolve.

[MATHEMATICALLY-DERIVED] If all $K_j$ ensemble members output the same erroneous label on an event, majority vote has exactly the same error event regardless of $K_j$. The variance reasoning in Eq. 62.3 explains why correlated members do not supply $K_j$ independent measurements. A name-diverse ensemble need not be error-diverse.

[DERIVED] A second failure is changing the target silently: an absolute rubric can reward both responses, while forced pairwise selection must choose one unless ties are allowed. A third is evaluation leakage when the generator and validator share hidden reference answers or prompt-development labels. Preserve these boundaries in the protocol.

```figure
{
  "id": "fig-62.11",
  "kind": "compare",
  "title": "Consensus and independent evidence",
  "caption": "Agreement among dependent judges measures repeatability of their decision channel. Independent evidence or qualified adjudication is needed to test shared errors.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.9",
  "alt": "Agreement among dependent judges measures repeatability of their decision channel. Independent evidence or qualified adjudication is needed to test shared errors.",
  "spec": {
    "axis": "What supports a candidate-correctness conclusion",
    "columns": [
      {
        "id": "a",
        "label": "Judge consensus"
      },
      {
        "id": "b",
        "label": "Independent predicate validation"
      }
    ],
    "rows": [
      {
        "dimension": "Shared false claim",
        "values": {
          "a": "Can be unanimous",
          "b": "Can be detected if reference valid"
        }
      },
      {
        "dimension": "Primary evidence",
        "values": {
          "a": "Member vote pattern",
          "b": "Checked artifact or qualified labels"
        }
      },
      {
        "dimension": "Remaining limit",
        "values": {
          "a": "Correlated error",
          "b": "Reference and support validity"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer an exact or executable checker when it faithfully covers the required predicate. Prefer an independently validated model judge when the target is open-ended and its error is below the decision tolerance. Prefer human/hybrid review when model-judge failures remain consequential. Reverse the model-judge preference if the candidate output distribution shifts, error overlap rises or the grader becomes a target of optimization.

[DERIVED] [62.1](62-1-human-evaluation-design.md) supplies independent human reference design, [62.2](62-2-pairwise-aggregation.md) handles aggregation assumptions, and [Chapter 63](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) treats the judge as one stage of an end-to-end system.

## Extensions

[DERIVED] A meaningful evaluator improvement reduces a specified false acceptance/rejection, improves localization or expands supported domains under matched evidence and expense. Higher agreement on easy pairs or a filtered dataset is not enough. Validate changes on untouched tasks and preserve the original predicate so that a better score cannot be obtained by redefining success.

[DERIVED] The next investigation follows the failure: reference errors need adjudication, parsing errors need software repair, correlated errors need independent evidence, and domain failure needs qualified validation. More calls to the same judge are useful only when sampling variability is the controlling uncertainty.

## Limitations

[DERIVED] Independent reference labels can still be wrong; natural-language rubrics can remain ambiguous. Confusion correction in Eq. 62.8 is fragile when judge errors change by candidate or domain. An ensemble can amplify confidence without improving validity. Structured output checks syntax and field presence, not truth.

[UNVERIFIED] No judge endpoint, reference dataset or repository was executed. The code entries are pinned static inspections with exact functions; they are not CODE-VERIFIED runtime or compatibility claims.

## Reproducibility

[DERIVED] Archive judge/model revision, rubric and prompt, permitted references, rendered input, output schema/parser, member weights, calibration/development/confirmation splits, raw grades, error matrices, invalid calls, routing actions, adjudication and all attempt costs. Record configured rosters and offered IDs before filtering.

[ASSUMED] [Experiment 62.2](verification.md#experiment-622--judge-validation-and-bias-controls) proposes independent judge and parser validation. No candidate score or error bound has been estimated by the book.

## References

[R62.3] RankJudge v1, §3 and Appendix C. [R62.8, R62.9] Pinned run_match and metrics source, static inspection. Full provenance, release date and limits: [references](references.md).
