---
id: ms.section.61.4
entity_type: section
title: "Validity threats"
volume: 3
part: 11
chapter: 61
section: 61.4
slug: 61-4-validity-threats
parent: ms.chapter.61
prev_sibling: ms.section.61.3
next_sibling: ms.section.61.5
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

# 61.4 Validity threats

## Scope

[DERIVED] Benchmark validity asks whether the measurement supports the claimed inference. The threats here are contamination, saturation, item selection, shortcuts, incorrect labels, and narrow population support. [Protocol control](61-3-version-and-protocol-control.md) addresses instrument identity; this section asks whether the identified instrument measures what the decision requires. Correct software and a valid confidence interval do not repair a wrong target.

[DERIVED] The target claim must be named before diagnosing a threat. Absolute accuracy, model ordering, transfer to unseen items, and deployment acceptance are different claims. A shared score inflation can preserve ordering while invalidating an absolute acceptance threshold. A near-tie can reverse under a small differential bias even when the global rank correlation remains high.

## Why this exists

[DERIVED] A benchmark accumulates exposure through training corpora, synthetic generation, public solutions, evaluator tuning, and repeated development feedback. Excluding exact test rows from a prompt prevents one leakage path, not all of them. A model can exploit a dataset-specific shortcut without having memorized a particular answer, and a contaminated model can still learn a transferable method. Neither observed success nor a string match identifies the causal source of performance alone.

[DERIVED] The dominant constraint is identifiability. When capability, release date, data access, and benchmark exposure change together, a performance difference cannot be assigned uniquely to memorization. The evaluation must either intervene on exposure, use credible controls, or keep the conclusion descriptive. A freshness claim based only on the date a benchmark page was accessed is insufficient.

## Intuition

[DERIVED] An audit should try to falsify the proposed interpretation. If a question remains solvable after removing the evidence it supposedly tests, the evidence-dependence claim fails. If a corrected label changes the preferred system, the original ranking was not robust to label uncertainty. If an item-family split destroys performance while a random row split does not, the random split may have permitted template transfer that deployment lacks.

[DERIVED] Treat original-versus-paraphrase gaps as signals needing controls. Paraphrases can preserve the answer while changing inferential difficulty, terminology familiarity, or model-specific parsing. Even a clean model can respond differently to them. Correcting by a clean reference removes a common reference gap; it does not guarantee removal of system-specific wording effects.

## Formulation

[MATHEMATICALLY-DERIVED] If at most an $\epsilon_{\mathrm{lab}}$ fraction of a fixed $n$-item set has changed binary labels and predictions are fixed, then each accuracy changes by at most that fraction. For two systems,

$$
\begin{aligned}
|\widehat v_j-\widehat v_j^{\star}|&\le\epsilon_{\mathrm{lab}},\\
|(\widehat v_A-\widehat v_B)-(\widehat v_A^{\star}-\widehat v_B^{\star})|&\le2\epsilon_{\mathrm{lab}},\\
\Delta^{\star}&\ge\max(-1,\widehat\Delta-2\epsilon_{\mathrm{lab}}),\qquad \widehat\Delta=\widehat v_A-\widehat v_B,\quad\Delta^{\star}=\widehat v_A^{\star}-\widehat v_B^{\star}.
\end{aligned}
$$
*(Eq. 61.10)*

[DERIVED] The star denotes corrected labels on the same offered items, not an unknown deployment truth. This worst-case bound does not estimate the mislabeled fraction and does not cover changed prompts or missing items. A reference-corrected original/paraphrase signal can be written

$$
\widehat d_j=\frac1n\sum_i(Y_{ji}^{o}-Y_{ji}^{p})-\frac1n\sum_i(Y_{0i}^{o}-Y_{0i}^{p}).
$$
*(Eq. 61.11)*

[DERIVED] $o,p$ denote aligned original/paraphrase items and $0$ a declared clean reference. Calling $\widehat d_j$ a causal contamination effect requires the counterfactual non-exposure wording effect of $j$ to match the reference after relevant controls. Without that assumption it remains a corrected contrast.

[MATHEMATICALLY-DERIVED] If $M_e$ independent null estimates have common continuous cumulative distribution $F$ and the largest is selected,

$$
\Pr\!\left(\max_{1\le\ell\le M_e}\widehat\Delta_\ell\ge t\right)=1-F(t)^{M_e}.
$$
*(Eq. 61.12)*

[DERIVED] Independence and the common null law are explicit analytical premises. The relation shows how selection can produce an impressive result without a true improvement. Correlated trials require a different calculation; hiding trials does not remove the selection.

```figure
{
  "id": "fig-61.12",
  "kind": "calculator",
  "title": "Label-uncertainty margin",
  "caption": "Illustrative worst-case paired-gap sensitivity from Eq. 61.10 on a fixed item set with unchanged predictions. The mislabeled fraction is a chosen input, not an estimated benchmark error rate.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.10",
  "alt": "Illustrative worst-case paired-gap sensitivity from Eq. 61.10 on a fixed item set with unchanged predictions. The mislabeled fraction is a chosen input, not an estimated benchmark error rate.",
  "spec": {
    "tex": "\\Delta^\\star\\ge\\max(-1,\\widehat\\Delta-2\\epsilon_{lab})",
    "equation": "61.10",
    "inputs": [
      {
        "symbol": "gap",
        "label": "Illustrative observed gap",
        "default": 0.08,
        "min": -1,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "eta",
        "label": "Maximum changed-label fraction",
        "default": 0.03,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "lower",
        "label": "Worst-case lower gap bound",
        "formula": "max(-1,gap-2*eta)",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Small label bound",
      "variables": {
        "gap": 0.08,
        "eta": 0.03
      },
      "highlight": [
        "lower"
      ],
      "note": "The fixed-set margin can survive this chosen worst-case label bound."
    },
    {
      "anchor": "mechanism",
      "label": "Larger uncertainty",
      "variables": {
        "gap": 0.08,
        "eta": 0.06
      },
      "highlight": [
        "lower"
      ],
      "note": "The worst-case bound no longer preserves the observed positive gap."
    },
    {
      "anchor": "failure-modes",
      "label": "Near-tie decision",
      "variables": {
        "gap": 0.01,
        "eta": 0.03
      },
      "highlight": [
        "lower"
      ],
      "note": "Small differential uncertainty matters for a near-tie even with stable global ranks."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Separate an exposure audit from a validity audit. Exposure auditing records data lineage, exact/near-duplicate checks, public-solution availability, train/development/test boundaries, and provider disclosures. Validity auditing examines answerability, label correctness, shortcuts, construct coverage and deployment support. A clean benchmark can have invalid labels; a partly exposed benchmark can still detect a regression, with a bounded claim.

[DERIVED] For contamination identification, a controlled model family with known injected exposure permits a detection check under that training design. Negative controls trained on legitimate data help test whether the signal flags ordinary learning. Multiple references and independently generated equivalent items probe dependence on wording, but semantic equivalence and comparable difficulty need their own validation. A null signal only rules out effects the audit could detect under its assumptions.

[DERIVED] For selection effects, preserve the full candidate/prompt/task search history and reserve independent confirmation. For saturation, inspect item-level errors, ceiling effects, evaluator false acceptance and local discrimination under Eq. 61.6. For narrow coverage, compare the benchmark support with deployment strata; unknown support is not repaired by statistical reweighting. For shortcuts, use evidence-removal, answer-order, template-held-out and irrelevant-cue controls designed to preserve the intended task. Each failed control has a different corrective action.

```figure
{
  "id": "fig-61.13",
  "kind": "diagram",
  "title": "Audit discrepancies need distinct diagnoses",
  "caption": "A failed validity control branches to label, exposure, support, or evaluator investigation. Only an independently validated revision supports a changed decision; unresolved signals remain gaps.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.11",
  "alt": "A failed validity control branches to label, exposure, support, or evaluator investigation. Only an independently validated revision supports a changed decision; unresolved signals remain gaps.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "metric",
        "label": "Observed discrepancy"
      },
      {
        "id": "n1",
        "kind": "branch",
        "label": "Controlling uncertainty"
      },
      {
        "id": "n2",
        "kind": "dataset",
        "label": "Label or support review"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Controlled exposure or wording test"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Validator controls"
      },
      {
        "id": "n5",
        "kind": "branch",
        "label": "Evidence resolves claim?"
      },
      {
        "id": "n6",
        "kind": "state",
        "label": "Revise or narrow conclusion"
      },
      {
        "id": "n7",
        "kind": "state",
        "label": "Unresolved gap"
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
        "from": "n1",
        "to": "n3"
      },
      {
        "from": "n1",
        "to": "n4"
      },
      {
        "from": "n2",
        "to": "n5"
      },
      {
        "from": "n3",
        "to": "n5"
      },
      {
        "from": "n4",
        "to": "n5"
      },
      {
        "from": "n5",
        "to": "n6",
        "label": "yes"
      },
      {
        "from": "n5",
        "to": "n7",
        "label": "no"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 61.4 — Adversarial validity audit.**

1. State the exact claim: score, ordering, transfer, or acceptance. Freeze its population, allowed information, and resource envelope.
2. Build an item lineage and exposure ledger. Mark unavailable training data or uncertain provenance explicitly.
3. Validate labels and task support on a prespecified independently adjudicated sample. Retain ambiguities and estimate only quantities the sampling design supports.
4. Apply matched shortcut and wording controls; separately validate that each control preserves the target answer/specification.
5. Compare original, corrected-label, held-out-family and matched-variant results with paired uncertainty. Use Eq. 61.10 as a sensitivity bound only when its fixed-set premises hold.
6. Attribute each discrepancy as a counterexample, evaluator defect, exposure signal, support failure, or inconclusive result. Change the instrument/version or narrow the claim accordingly.
7. Confirm a revised decision on reserved evidence. Stop at the prespecified audit budget with unresolved claims recorded; lack of a discovered defect is not proof of universal validity.

[DERIVED] Every automated audit stage needs an error rate or independent controls. A model-based paraphraser and judge can share the same semantic blind spot.

## Implementation

[DERIVED] Store source-item IDs, raw text/media hashes, transformation lineage, answer references, deduplication procedure, exclusion reason and review status. Keep a separate table linking suspected training exposure to actual evidence rather than placing a contamination flag directly in the ground-truth label. A flag may denote a string overlap, a detected contrast, or confirmed injected training; those are different observations.

[DERIVED] Exact hashing is linear in input bytes and detects byte identity. Pairwise similarity comparison is quadratic in item count without indexing; approximate candidate retrieval lowers search cost while introducing false negatives that need validation. Semantic review and new model inference can dominate audit expense. Store counts of offered, checked, flagged, reviewed and corrected items; a high correction proportion among deliberately suspicious examples does not estimate the full benchmark's error prevalence.

[DERIVED] Audits can themselves expose held-out material. Keep private confirmatory items separate from model development and public demonstrations. Runtime isolation, access controls and retention policies are part of the evaluation system, with their general mechanisms owned by Chapters 47 and 65. No private data or model weights have been accessed here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Xiao and Cheng analyze aligned responses on ARC, GSM8K, HellaSwag and MMLU from 47 public models and 74 models with controlled fine-tuning exposure. Their audit subtracts a clean-reference wording gap, calibrates against known exposure, and compares original, paraphrased and synthetic-item rankings using penalized Rasch fits and raw-accuracy checks. They report rank correlation 0.997 for the studied leaderboard [R61.3, Method and Results, pp. 6–13]. No new model inference was run in that paper's analysis.

[DERIVED] Stable global ordering does not validate absolute thresholds, near-tie pair ordering, or other model populations. The within-item design improves on a release-date proxy, but its interpretation still depends on wording effects and reference suitability. It is evidence against one universal claim of inevitable rank destruction, not a certificate that contamination is harmless.

## Observations

**What the paper claims.** [PAPER-REPORTED] Shared contamination can inflate scores with little ordering change in its sampled public models [R61.3, Discussion].

**What the evidence shows.** [DERIVED] Absolute bias and differential ranking bias are distinct audit targets.

**What we infer.** [DERIVED] Require a decision-specific sensitivity analysis even when overall rank correlation is high.

**What remains unknown.** [NOT-DISCLOSED] The reader's exposure history and deployment transfer are not identified by this public response matrix.

## Failure modes

> **Failure mode — Paraphrase contrast treated as causal proof.** [DERIVED] *Symptom:* A positive wording contrast is labeled confirmed training exposure. *Cause:* System-specific wording difficulty can differ from the clean reference even without exposure. *Detection:* Use known-exposure and negative controls plus independently validated equivalent items. *Mitigation:* Keep the contrast descriptive unless its counterfactual identification assumptions are justified.

[MATHEMATICALLY-DERIVED] A clean candidate can answer an original item correctly and a valid paraphrase incorrectly because its wording is unfamiliar, while a clean reference answers both. Equation 61.11 is then positive without candidate exposure. Conversely, exposure to both variants can hide memorization. The contrast therefore needs identification controls.

[MATHEMATICALLY-DERIVED] With two systems separated by a measured gap $g$, a shared additive bias leaves $g$ unchanged; differential biases $u_A,u_B$ change it by $u_A-u_B$. Arbitrarily high global correlation can coexist with a reversed near-tie. Likewise, excluding every timeout can increase a successful-case accuracy while decreasing offered-task success.

[DERIVED] Mislabeled difficult items can make a stronger candidate appear worse. Removing all model-disagreed items after looking at candidate predictions, however, preferentially erases informative failures. Use independent adjudication and publish both original and corrected results under distinct versions.

```figure
{
  "id": "fig-61.14",
  "kind": "compare",
  "title": "Absolute inflation and differential bias",
  "caption": "Shared bias can preserve a model ordering while invalidating an absolute acceptance rule. Near-tie ordering depends on differential bias, not global rank correlation alone.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.10",
  "alt": "Shared bias can preserve a model ordering while invalidating an absolute acceptance rule. Near-tie ordering depends on differential bias, not global rank correlation alone.",
  "spec": {
    "axis": "Decision affected by an accuracy bias",
    "columns": [
      {
        "id": "a",
        "label": "Shared additive bias"
      },
      {
        "id": "b",
        "label": "Differential additive bias"
      }
    ],
    "rows": [
      {
        "dimension": "Absolute threshold",
        "values": {
          "a": "Can cross the threshold",
          "b": "Can cross the threshold"
        }
      },
      {
        "dimension": "Pair ordering",
        "values": {
          "a": "Gap unchanged in additive example",
          "b": "Gap shifts by bias difference"
        }
      },
      {
        "dimension": "Required evidence",
        "values": {
          "a": "Calibrated absolute performance",
          "b": "Decision-margin sensitivity"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer a freshly authored, independently validated set when public exposure is decision-relevant and valid construction is feasible. Prefer a stable historical regression set when detecting changes on a fixed behavioral contract is the target. These choices can coexist. Reverse the freshness preference if new items are unrepresentative or poorly validated; reverse the stable-set preference if adaptation has made its score cease to predict the required behavior.

[DERIVED] [Robustness and transfer](61-5-robustness-and-transfer.md) addresses support shifts and valid perturbations. [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md) addresses judge error and disagreement; an automated validity audit must obey those same constraints.

## Extensions

[DERIVED] Improvement claims should name the changed validity property: fewer false acceptances under independently checked labels, better target support, a calibrated exposure detector, or reduced decision sensitivity under valid variants. A harder dataset or a lower model score is not by itself an improvement in measurement.

[DERIVED] Consequential next evidence depends on the failure: label uncertainty calls for qualified adjudication; a shortcut calls for a matched control; unidentified exposure calls for controlled training or narrower wording; support mismatch calls for target sampling. Repeating the same public test with another seed cannot substitute for these interventions.

## Limitations

[DERIVED] Training exposure is often unobservable, semantic equivalence is task-dependent, and human adjudicators can be wrong. Neither a finite audit nor a non-significant discrepancy establishes the absence of contamination. A significance threshold alone does not decide whether an effect is consequential; the required acceptance margin matters.

[UNVERIFIED] This chapter has not audited private training corpora, reconstructed provider data pipelines, or corrected a benchmark. Its explicit bounds and counterexamples establish conditional limitations; source-reported analyses remain attributed to their authors.

## Reproducibility

[DERIVED] Preserve raw versus revised labels, adjudicator provenance, item sampling probabilities, complete candidate history, exposure evidence, transformation/semantic-check versions, all offered outcomes and sensitivity specifications. Archive both original and corrected reports so later readers can reconstruct the scientific change.

[ASSUMED] [Experiment 61.2](verification.md#experiment-612--validator-and-perturbation-controls) proposes the audit; [Experiment 61.3](verification.md#experiment-613--paired-report-and-decision-audit) proposes decision sensitivity. Both remain unexecuted.

## References

[R61.3] Xiao and Cheng, inspected v1 PDF, Method/Results/Discussion, pp. 6–15. Release metadata and the explicit paraphrase-identification limit are recorded in [references](references.md).
