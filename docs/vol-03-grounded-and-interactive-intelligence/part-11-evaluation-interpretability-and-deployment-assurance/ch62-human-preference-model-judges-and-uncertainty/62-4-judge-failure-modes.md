---
id: ms.section.62.4
entity_type: section
title: "Judge failure modes"
volume: 3
part: 11
chapter: 62
section: 62.4
slug: 62-4-judge-failure-modes
parent: ms.chapter.62
prev_sibling: ms.section.62.3
next_sibling: ms.section.62.5
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

# 62.4 Judge failure modes

## Scope

[DERIVED] Judge failure modes include position, verbosity, style and authorship effects, domain mismatch, instructions embedded in evaluated content, and correlated errors. This section treats them as mechanisms requiring matched controls rather than as an assumption that every judge exhibits every bias. The target is a grade justified by the rubric and evidence; the nuisance is presentation or provenance that should not change that grade at the claimed level.

[DERIVED] A bias estimate is conditional on the control. Length can carry relevant completeness; style can carry task usefulness; source attribution can be relevant in a provenance-sensitive task. Calling every dependence on these variables bias would erase legitimate target information. State which invariance the task requires before intervening.

## Why this exists

[DERIVED] A judge is itself a language-processing system. Its input contains both evaluation instructions and candidate content, often in one context window. Presentation cues can compete with the intended rubric, and untrusted text can attempt to redirect evaluation. If the candidate is optimized against this channel, the grader becomes an attack surface as well as a measurement instrument.

[DERIVED] The obstruction is separating legitimate quality variation from nuisance effects. Truncating a long answer may remove the fact needed for correctness; rewriting style may change a hedge or scope; blindly comparing self-generated and other-generated outputs confounds authorship with quality. Independent content-preservation checks and randomized matched interventions are therefore necessary.

## Intuition

[DERIVED] Swapping the same two responses is a clean position intervention if the rest of the task is unchanged and verdicts are mapped back to identities. It can remove an average directional advantage while leaving nonlinear effects. Likewise, relabeling identical content can isolate a displayed-authorship effect, while comparing different authors' outputs cannot do so without controlling quality.

[DERIVED] For adversarial evaluation, the relevant question is whether a transformation changes the judge while preserving the true predicate. A wrapper can make harmful content look superficially benign, or make a correct answer look wrong. If the underlying predicate genuinely changes, the changed verdict is not evidence of a grader attack. Validate the predicate independently and retain the attack's access and budget.

## Formulation

[MATHEMATICALLY-DERIVED] In the declared logistic position model, let $d$ be the candidate-A quality margin including sensitivity and $\zeta$ a slot-A intercept. After mapping both display orders back to candidate A,

$$
\overline p(d)=\tfrac12[\sigma(d+\zeta)+\sigma(d-\zeta)],\qquad \overline p(0)=\tfrac12,\qquad \left.\frac{d\,\operatorname{logit}\overline p(d)}{dd}\right|_{d=0}=1-\big[2\sigma(\zeta)-1\big]^2.
$$
*(Eq. 62.10)*

[DERIVED] The derivative follows from $\sigma'(-\zeta)=\sigma'(\zeta)$ and $\operatorname{logit}'(1/2)=4$. Thus balanced orders remove the equal-quality directional intercept, not every effect of position. This is a local slope under a specified model, not a universal attenuation constant for arbitrary judges; see [62.2](62-2-pairwise-aggregation.md).

[MATHEMATICALLY-DERIVED] For identical evaluation target $u$ with displayed labels $l_s,l_o$, a paired label effect is

$$
\Delta_{\mathrm{label}}=\mathbb E_u\!\left[\mathbb E[J(u,l_s)\mid u]-\mathbb E[J(u,l_o)\mid u]\right].
$$
*(Eq. 62.11)*

[DERIVED] A randomized label intervention with fixed content and evaluation protocol can identify this effect on the judge's score. It does not establish whether the underlying output is objectively good or identify the judge's internal recognition mechanism.

[MATHEMATICALLY-DERIVED] Given a finite admissible transformation set $\mathcal T(u)$ preserving independently validated predicate $g(u)$, an adversarial error target is

$$
R_{\mathrm{adv}}=\mathbb E_{u\sim Q}\left[\max_{t\in\mathcal T(u)}\mathbf1\{J(t(u))\ne g(u)\}\right].
$$
*(Eq. 62.12)*

[DERIVED] The set must encode attacker information, edit permissions and finite search budget; it includes identity if ordinary error is part of the target. An empirical found-attack rate need not reach the maximum. A rate conditional on initially correct judgments is a different estimand.

```figure
{
  "id": "fig-62.12",
  "kind": "calculator",
  "title": "Swap averaging preserves nonlinear sensitivity",
  "caption": "Illustrative logistic position model from Eq. 62.10. Balanced order makes the equal-quality preference one half while retaining a reduced local slope when position bias is nonzero; these are analytical inputs, not measured judge scores.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.10",
  "alt": "Illustrative logistic position model from Eq. 62.10. Balanced order makes the equal-quality preference one half while retaining a reduced local slope when position bias is nonzero; these are analytical inputs, not measured judge scores.",
  "spec": {
    "tex": "\\bar p=\\{\\sigma(d+\\zeta)+\\sigma(d-\\zeta)\\}/2",
    "equation": "62.10",
    "inputs": [
      {
        "symbol": "margin",
        "label": "Candidate quality margin",
        "default": 0.5,
        "min": -3,
        "max": 3,
        "format": "raw"
      },
      {
        "symbol": "bias",
        "label": "Position log-odds intercept",
        "default": 1.5,
        "min": -4,
        "max": 4,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "plain",
        "label": "No-position model preference",
        "formula": "1/(1+exp(-margin))",
        "format": "percent"
      },
      {
        "symbol": "averaged",
        "label": "Mapped swap-average preference",
        "formula": "(1/(1+exp(-(margin+bias)))+1/(1+exp(-(margin-bias))))/2",
        "format": "percent"
      },
      {
        "symbol": "slope",
        "label": "Local logit-slope factor at zero margin",
        "formula": "4*exp(-bias)/(1+exp(-bias))^2",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "No position intercept",
      "variables": {
        "bias": 0
      },
      "highlight": [
        "plain",
        "averaged",
        "slope"
      ],
      "note": "The analytical order-average equals the no-position response curve here."
    },
    {
      "anchor": "mechanism",
      "label": "Position-sensitive judge",
      "variables": {
        "bias": 2
      },
      "highlight": [
        "averaged",
        "slope"
      ],
      "note": "Averaging removes the equal-quality directional effect while retaining attenuated local sensitivity."
    },
    {
      "anchor": "failure-modes",
      "label": "Equal quality with position bias",
      "variables": {
        "margin": 0,
        "bias": 2
      },
      "highlight": [
        "averaged",
        "slope"
      ],
      "note": "Parity at zero margin alone does not establish complete debiasing."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Build matched controls by failure class. For position, swap identical content and retain actual slots. For verbosity, use independently verified shorter/longer versions with the same obligations, and separately test legitimate additions of needed information. For style, preserve factual qualifiers and instruction compliance. For authorship, vary labels on the same content and separately analyze actual source. For domain failure, use qualified labels spanning subtle omissions and high-severity errors rather than generic benchmark agreement.

[DERIVED] Judge prompts should distinguish trusted rubric/reference channels from untrusted evaluated material. Quoting or tagging content provides a boundary description, not a proof that the model respects it. Disable tools and side effects not needed for grading; validate outputs against a strict schema and preserve invalid states. Test the whole grading pipeline, including reference retrieval, parser and routing, rather than only the model response in isolation.

[DERIVED] Adversarial controls require an independent preservation audit. Preserve both the original and attacked response, raw judge verdicts, semantic/predicate labels, search history and all attempted transformations. Report the denominator: all offered items, all harmful cases, initially correct true positives, or successfully generated attacks. Different denominators are not interchangeable rates.

[DERIVED] Repeat controls across relevant judges and task strata, but do not interpret correlated outcomes as independent evidence. An ensemble may share a style heuristic or follow the same injected instruction. Judge diversification should be evaluated through conditional error overlap and independent validation.

```figure
{
  "id": "fig-62.13",
  "kind": "diagram",
  "title": "A verdict flip needs a preserved predicate",
  "caption": "The same target enters matched nuisance or bounded adversarial transformations. Independent predicate review determines whether a changed grade is a judge failure or a changed task.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.12",
  "alt": "The same target enters matched nuisance or bounded adversarial transformations. Independent predicate review determines whether a changed grade is a judge failure or a changed task.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Original target and predicate"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Matched or bounded transformation"
      },
      {
        "id": "n2",
        "kind": "branch",
        "label": "Predicate preserved?"
      },
      {
        "id": "n3",
        "kind": "state",
        "label": "Changed task or invalid control"
      },
      {
        "id": "n4",
        "kind": "model",
        "label": "Frozen judge and parser"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Mapped paired grade change"
      },
      {
        "id": "n6",
        "kind": "boundary",
        "label": "Independent predicate audit"
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
        "from": "n6",
        "to": "n2"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "no"
      },
      {
        "from": "n2",
        "to": "n4",
        "label": "yes"
      },
      {
        "from": "n4",
        "to": "n5"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 62.4 — Audit nuisance and adversarial sensitivity.**

1. Freeze the intended invariances, predicate, source labels, judge protocol and attacker access/budget.
2. Sample original tasks and construct matched order, length, style and label variants. Independently validate preservation before inspecting candidate-relative effects.
3. Run the frozen judge under finite calls/retries, preserving actual order, raw grades and parser failures. Randomize variant order to avoid systematic sequence effects.
4. Estimate paired effects under Eqs. 62.10–62.11 and report class/domain slices with appropriate clustering.
5. Search the bounded admissible attack set; separately audit whether successful verdict flips retain the underlying predicate. Publish failed searches as well as found attacks.
6. Revalidate any defense on untouched ordinary and adversarial cases, measuring false rejection and expense as well as attack resistance.
7. Restrict the judge's role or route unresolved classes to independent review when errors can reverse the decision.

[DERIVED] Termination follows from finite variant, attempt and time caps. Exhausting the search supports only the checked attack procedure; it is not evidence of an optimal attack or absolute robustness.

## Implementation

[DERIVED] Preserve candidate identity separately from displayed label. Otherwise relabeling can accidentally change the ground truth and erase the very bias being tested. A pairwise judge returning a slot rather than a model ID requires a checked mapping under swaps. A style rewrite must retain references and scope; treat any changed fact as an invalid nuisance control.

[DERIVED] Run an evaluator with the minimum operational privileges needed for reading and grading. The source material being judged must not gain authority to alter rubric, reference labels, comparison weights or release state. Chapter 65 owns the broader security model; this section measures the integrity of the grade.

[DERIVED] A full crossed design over $n$ targets, $v$ variants, $K_j$ judges and $r$ repeats schedules $nvK_jr$ calls before search and review. Attack optimization adds all attempted calls/tokens, not just the successful wrapper. Storing raw input/output, predicate audits and retry history is necessary for cost and validity. Device execution details and local protection effectiveness remain unverified here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Chae and colleagues use ten models to select fixed narrative constraints and judge them blind or with manipulated self/other labels. Their v3 matches targets using prior blind ratings and reports label-driven shifts on identical selections; it also checks mixed-effects and random-slope alternatives [R62.5, §§3–4, Appendices C/H]. Matching is to judged quality, not independently established objective quality.

[PAPER-REPORTED] Gao's v2 compares a dedicated classifier and three small open-model judges on 596 human-labeled completions. Wrapper flip rates of 57–100% are conditional on each judge's initially correct true positives; a two-annotator sample checks preservation [R62.7, §§3–4, Tables 1–2]. These are not whole-population deployment attack rates.

| Source boundary | Hardware / precision | Model and workload | Concurrency / runtime | Measurement boundary |
|---|---|---|---|---|
| R62.7 | Single NVIDIA T4; 4-bit quantization | Named classifier and Qwen/Phi judges; 596 completions, true-positive subset for flips; exact lengths NOT-DISCLOSED here | NOT-DISCLOSED here | Judge labels against human majority; conditional flip rate, not end-user safety |

[DERIVED] These studies isolate distinct effects: label intervention and predicate-preserving adversarial presentation. Neither supports a universal bias rate across domains or guarantees that a defended judge is correct.

## Observations

**What the paper claims.** [PAPER-REPORTED] Displayed attribution and content-preserving adversarial framing can alter the studied judge outputs [R62.5, R62.7].

**What the evidence shows.** [DERIVED] A changed verdict needs both a matched intervention and a preserved target to be interpreted as a nuisance failure.

**What we infer.** [DERIVED] Validate the evaluator under the conditions in which candidates can influence its inputs.

**What remains unknown.** [UNVERIFIED] These studies do not establish resistance or failure rates for untested judges, attacks or workflows.

## Failure modes

> **Failure mode — Average-order correction treated as complete debiasing.** [DERIVED] *Symptom:* balanced-order results are assumed equivalent to an unbiased judge. *Cause:* nonlinear averaging removes an intercept at equal quality while retaining changed sensitivity. *Detection:* inspect matched-order probabilities and held-out behavior across quality margins. *Mitigation:* fit an identified order-aware model or retain the remaining sensitivity limitation.

[MATHEMATICALLY-DERIVED] At nonzero $\zeta$, Eq. 62.10 has local logit slope strictly below one even though $\overline p(0)=1/2$. This is a counterexample to the claim that swap-and-average always recovers the no-bias response curve. It does not imply order correction is useless.

[DERIVED] A second failure is declaring an attack successful after the transformation removed the problematic content. A third is treating a strong grader's disagreement with a weak grader as proof of truth without independent labels. Both require predicate validation rather than another vote from the same channel.

```figure
{
  "id": "fig-62.14",
  "kind": "compare",
  "title": "Found attacks and population risk",
  "caption": "Attack discovery conditional on initially correct cases and natural offered-population error are different estimands. Report both boundaries before comparing defenses.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.12",
  "alt": "Attack discovery conditional on initially correct cases and natural offered-population error are different estimands. Report both boundaries before comparing defenses.",
  "spec": {
    "axis": "Denominator behind an evaluator failure rate",
    "columns": [
      {
        "id": "a",
        "label": "Conditional flip audit"
      },
      {
        "id": "b",
        "label": "Offered-population evaluation"
      }
    ],
    "rows": [
      {
        "dimension": "Included cases",
        "values": {
          "a": "Initially correct eligible cases",
          "b": "Every offered target"
        }
      },
      {
        "dimension": "Question",
        "values": {
          "a": "Can a checked judgment be flipped?",
          "b": "How often does the endpoint fail?"
        }
      },
      {
        "dimension": "Missing obligation",
        "values": {
          "a": "Natural prevalence and initial errors",
          "b": "Worst-case bounded search"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer randomized/matched nuisance controls for causal presentation effects; prefer independent domain adjudication for subtle factual or professional predicates; prefer executable checks where available. Reverse a prompt-only mitigation preference when a held-out attack or ordinary false rejection crosses the acceptance margin. Reverse a complex statistical adjustment if the nuisance is not identified or its reference target is irrelevant to the decision.

[DERIVED] [Model-judge validation](62-3-model-as-judge.md) establishes the ordinary error boundary; [confidence and abstention](62-5-confidence-and-abstention.md) converts validated uncertainty into a routing rule. Defensive routing must itself be evaluated for coverage and cost.

## Extensions

[DERIVED] A useful improvement can be smaller matched label/position effects, better predicate fidelity under admissible attacks, or improved independent error rates at matched expense. A reduced attack-success estimate can instead reflect a weaker attacker, changed denominator, invalid transformation or more aggressive overblocking. Preserve those alternatives before claiming scientific progress.

[DERIVED] Consequential next evidence is a held-out attack with independent predicate review, a matched control separating length from completeness, or a new domain slice. Additional random judge repeats are appropriate only if repeat variability, rather than systematic bias, controls the decision.

## Limitations

[DERIVED] Not every nuisance can be varied without changing quality, and labels/length may interact with genuine rubric criteria. Statistical adjustment depends on identifying variation and model fit. Adversarial search is incomplete and often conditional on selected initial successes; its rate does not transport automatically to natural use.

[UNVERIFIED] The book has not attacked or defended a judge. No local runtime or safety rate is measured. Broader deployment authorization remains outside this evaluation mechanism.

## Reproducibility

[DERIVED] Archive originals/variants, actual and claimed source, preserved-predicate labels, rubric/model/parser revisions, order assignment, attack permissions/search budget, every attempt, failed calls, successful flip denominator and independent audit. Keep ordinary false accept/reject rates beside adversarial metrics.

[ASSUMED] [Experiment 62.2](verification.md#experiment-622--judge-validation-and-bias-controls) proposes these controls. Its attacks and reviews are unexecuted; illustrative equations are not empirical bias estimates.

## References

[R62.5] Authorship labels, inspected v3 PDF, §§3–4 and Appendices C/H. [R62.7] Jailbreak-judge audit, inspected v2, §§3–4 and Tables 1–2. Mathematical order mechanism relates to [R62.2, §4.1]. Exact provenance: [references](references.md).
