---
id: ms.section.62.6
entity_type: section
title: "Interpreting scores"
volume: 3
part: 11
chapter: 62
section: 62.6
slug: 62-6-interpreting-scores
parent: ms.chapter.62
prev_sibling: ms.section.62.5
next_sibling: ms.verification.62
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

# 62.6 Interpreting scores

## Scope

[DERIVED] A reported score must say whose judgment it represents, which predicate it measures and which complete endpoint produced the behavior. User preference, factual truth, usefulness, policy compliance and service reliability are separate outcomes. This section connects their measurements to a decision without treating one as a universal substitute for the others.

[DERIVED] An evaluation of a model plus prompt, retrieval, tools, cache, safety filters and grader describes that endpoint under its workload. Attributing its result to model weights requires controlled cross-configurations. A benchmark sample or volunteer pool supports a broader population only through a defensible sampling/transport argument.

## Why this exists

[DERIVED] Scores become consequential when used to select models, allocate review, authorize features or declare an improvement. A preference score can reward persuasive falsehoods; a truth checker can ignore whether a response is usable; a safety gate can block every useful action. Averaging those outcomes can conceal a requirement violation rather than resolve a trade-off.

[DERIVED] The obstruction is specifying utility and admissibility. A scientific report can estimate declared quantities and expose uncertainty; it cannot silently supply the value of an incorrect answer, the cost of review or which population should be represented. Those choices must be explicit so another reviewer can assess whether the preferred endpoint changes when they change.

## Intuition

[DERIVED] A decision uses the full admitted information available at the moment of action. A calibrated score is one compressed statistic. If two cases share a score but have different decision-relevant evidence, a score-threshold policy can be suboptimal even though it is optimal among score-measurable policies.

[DERIVED] Agreement metrics are also conditional summaries. Raw agreement counts matching labels. Chance-corrected agreement subtracts a particular marginal baseline. Neither is an estimate of truth unless the reference labels validly instantiate truth, and their numerical difference is not a newly measured fraction of factual errors. Retain the confusion matrix, prevalence, tie handling and reference construction.

## Formulation

[MATHEMATICALLY-DERIVED] Let $\mathcal F$ be admitted decision information and $p=P(Z=1\mid\mathcal F)$ the full-information probability of a valid answer. If a correct answer has utility $g\ge0$, an incorrect answer has utility $-c_e$ with $c_e>0$, and deferral has utility $-c_d$ with $c_d\ge0$, then

$$
U_{\mathrm{answer}}=pg-(1-p)c_e,\qquad U_{\mathrm{defer}}=-c_d,\qquad \mathrm{answer}\ \Longleftrightarrow\ p(g+c_e)\ge c_e-c_d.
$$
*(Eq. 62.16)*

[DERIVED] This is a one-step comparison with only these two actions and specified costs. It does not solve a sequential information-gathering problem. If $c_d\ge c_e$, answering is weakly optimal throughout this restricted model; omitted harms or actions can change that conclusion. Replacing $p$ by a merely calibrated score justifies the corresponding score-restricted decision, not full-$\mathcal F$ Bayes optimality.

[MATHEMATICALLY-DERIVED] For an observed categorical confusion table $n_{ab}$ with $n>0$, row/column marginals $n_{a+},n_{+a}$, chance-corrected agreement is

$$
p_o=\frac{\sum_a n_{aa}}{n},\qquad p_e=\sum_a\frac{n_{a+}n_{+a}}{n^2},\qquad \kappa=\frac{p_o-p_e}{1-p_e}\quad\text{when }p_e<1.
$$
*(Eq. 62.17)*

[DERIVED] For the two-class calculator, $a=n_{11},b=n_{12},c=n_{21},d=n_{22}$ and $n=a+b+c+d$. At $p_e=1$ the expression is undefined. High prevalence agreement and low $\kappa$ can coexist without a contradiction. They answer different baseline-conditioned questions.

[MATHEMATICALLY-DERIVED] Let $M(\theta,\psi)$ be expected acceptance for fixed weights $\theta$ and the remaining endpoint protocol $\psi$ on one common population. A telescoping identity is

$$
M(\theta_2,\psi_2)-M(\theta_1,\psi_1)=\big[M(\theta_2,\psi_2)-M(\theta_1,\psi_2)\big]+\big[M(\theta_1,\psi_2)-M(\theta_1,\psi_1)\big].
$$
*(Eq. 62.18)*

[DERIVED] The identity is not identification from two endpoint scores: the cross-configuration may be unobserved or infeasible. Interactions make the decomposition path-dependent. A controlled factorial comparison is needed for a supported attribution.

```figure
{
  "id": "fig-62.18",
  "kind": "calculator",
  "title": "Raw and chance-corrected agreement",
  "caption": "Illustrative two-class confusion table under Eq. 62.17. Every cell is positive in this calculator so n > 0 and expected agreement < 1; the manuscript separately treats degenerate constant-label cases. These are not measured judge results.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.17",
  "alt": "Illustrative two-class confusion table under Eq. 62.17. Every cell is positive in this calculator so n > 0 and expected agreement < 1; the manuscript separately treats degenerate constant-label cases. These are not measured judge results.",
  "spec": {
    "tex": "p_o=(a+d)/n;\\quad \\kappa=(p_o-p_e)/(1-p_e)",
    "equation": "62.17",
    "inputs": [
      {
        "symbol": "a",
        "label": "Both label positive",
        "default": 40,
        "min": 1,
        "max": 1000,
        "format": "integer"
      },
      {
        "symbol": "b",
        "label": "Reference positive, judge negative",
        "default": 10,
        "min": 1,
        "max": 1000,
        "format": "integer"
      },
      {
        "symbol": "c",
        "label": "Reference negative, judge positive",
        "default": 10,
        "min": 1,
        "max": 1000,
        "format": "integer"
      },
      {
        "symbol": "d",
        "label": "Both label negative",
        "default": 40,
        "min": 1,
        "max": 1000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "agreement",
        "label": "Raw agreement",
        "formula": "(a+d)/(a+b+c+d)",
        "format": "percent"
      },
      {
        "symbol": "kappa",
        "label": "Cohen kappa",
        "formula": "((a+d)/(a+b+c+d)-((a+b)*(a+c)+(c+d)*(b+d))/(a+b+c+d)^2)/(1-((a+b)*(a+c)+(c+d)*(b+d))/(a+b+c+d)^2)",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Balanced illustrative table",
      "variables": {
        "a": 40,
        "b": 10,
        "c": 10,
        "d": 40
      },
      "highlight": [
        "agreement",
        "kappa"
      ],
      "note": "Raw and chance-corrected agreement use different baselines."
    },
    {
      "anchor": "mechanism",
      "label": "Imbalanced table",
      "variables": {
        "a": 900,
        "b": 10,
        "c": 10,
        "d": 40
      },
      "highlight": [
        "agreement",
        "kappa"
      ],
      "note": "Label marginals change the chance-corrected interpretation."
    },
    {
      "anchor": "failure-modes",
      "label": "Near-constant agreement",
      "variables": {
        "a": 1000,
        "b": 1,
        "c": 1,
        "d": 1
      },
      "highlight": [
        "agreement",
        "kappa"
      ],
      "note": "High raw agreement alone does not establish discrimination or factual truth."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Define a decision vector before aggregation: correct/supportable content, required usefulness, policy compliance, completion under deadline and resource expense. Assign noncompensable requirements their own gates. If a weighted utility is needed, state its population, costs and sensitivity range. Do not infer an unspecified safety/quality trade-off from a preference poll.

[DERIVED] For preference, preserve target user/task weights and heterogeneity. For truth, preserve reference evidence and independent adjudication. For usefulness, test whether users can complete the intended task, not merely whether they like the response. For safety, record prohibited effects and useful approved behavior separately. For endpoints, keep prompt, retrieval/tool permissions, inference limits, cache state and filters in the identity.

[DERIVED] Evaluate joint acceptance when all requirements must hold on the same task. Marginal success rates alone do not identify it. For three events with probabilities $p_1,p_2,p_3$, the joint probability lies between $\max(0,p_1+p_2+p_3-2)$ and $\min(p_1,p_2,p_3)$; dependence and paired outcomes determine where within that interval it lies. Separate task cohorts cannot reconstruct the joint event.

[DERIVED] Interpret confidence intervals and agreement coefficients at their actual levels. A reference panel's disagreement is evidence about the measurement process; it can reflect ambiguous tasks, heterogeneous legitimate preferences or factual mistakes. A model's self-consistency says little about correctness without independent labels. Report these distinctions rather than replacing a disappointing metric with a more favorable one after seeing results.

```figure
{
  "id": "fig-62.19",
  "kind": "diagram",
  "title": "A bounded decision preserves separate predicates",
  "caption": "Preference, truth, usefulness and compliance connect to their own references, then rejoin on shared offered IDs. Compatible endpoints and declared costs determine the supported decision and its reversal conditions.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.16",
  "alt": "Preference, truth, usefulness and compliance connect to their own references, then rejoin on shared offered IDs. Compatible endpoints and declared costs determine the supported decision and its reversal conditions.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Population and offered IDs"
      },
      {
        "id": "n1",
        "kind": "metric",
        "label": "Preference with user reference"
      },
      {
        "id": "n2",
        "kind": "metric",
        "label": "Truth with evidence reference"
      },
      {
        "id": "n3",
        "kind": "metric",
        "label": "Usefulness and compliance"
      },
      {
        "id": "n4",
        "kind": "branch",
        "label": "Joint requirements satisfied?"
      },
      {
        "id": "n5",
        "kind": "dependency",
        "label": "Endpoint identity and declared costs"
      },
      {
        "id": "n6",
        "kind": "objective",
        "label": "Bounded decision or unresolved gap"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n0",
        "to": "n2"
      },
      {
        "from": "n0",
        "to": "n3"
      },
      {
        "from": "n1",
        "to": "n4"
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

[DERIVED] **Algorithm 62.6 — Convert evaluation evidence into a bounded decision.**

1. State the user/task population, required predicates, action set, costs and noncompensable gates before comparing scores.
2. Verify that preference, truth, usefulness and compliance measurements each have an admissible reference and offered denominator.
3. Compute task-level and joint outcomes on shared IDs. Preserve rater/prompt dependence, judge error and calibration uncertainty.
4. Compare only compatible endpoints; use cross-configurations when attributing a change to weights rather than a scaffold or access policy.
5. Apply the declared utility/risk rule and evaluate sensitivity to plausible population weights, costs, labels and protocol changes.
6. Confirm any selected endpoint or threshold on independent evidence; record a bounded conclusion, unresolved obligations and reversal conditions.
7. Stop when the stated decision is resolved or the evidence budget ends. An unresolved choice remains unresolved rather than becoming a total ranking.

[DERIVED] A numerical optimization or aggregate score cannot supply the missing utility function or production authorization. Those belong in the accountable release process of Chapter 66.

## Implementation

[DERIVED] Reports need explicit fields for score kind, reference construction, population, candidate endpoint, task support, protocol revision, judge/rater identity, ties/abstentions, offered failures and resource boundary. Store the underlying confusion and pairwise tables so a different summary can be reconstructed without rerunning generation. Preserve raw references and rubric decisions for audit.

[DERIVED] A dashboard comparing model endpoints should expose which components differ. A parameter-only change and a retrieval-enabled endpoint are scientifically different comparisons. Cache reuse must preserve the semantics claimed by the evaluation; a stale answer can appear consistent while being wrong for the current task. General cache/state mechanisms remain canonical in Chapters 42 and 53.

[DERIVED] Report the cost of candidate generation, grading, review, retries, tools and infrastructure on one attribution window. Human preference per response is not cost per completed task. Tail latency and offered-load goodput belong to the system-level boundary in Chapter 63. Dense all-pairs comparison can require quadratic candidate-pair count; reconstructing frozen summary tables is usually linear in stored judgments for fixed metrics. No device throughput or expense has been measured here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Norman, Rivera and Hughes evaluate 21 model judges on three benchmarks, using ordinary agreement, repeated judgments and order/bias protocols. Their source reports approximately 541,000 judgments and compares raw matching with chance-corrected metrics [R62.4, §3, §4, Table 2]. Its benchmark/label conventions and tie exclusions are part of that measurement.

[DERIVED] The paper's interpretation of raw–kappa gaps as overstated performance requires care: Eq. 62.17 transforms agreement relative to marginals; it does not independently count additional factual mistakes. The source describes randomized displayed labels and also discusses canonical all-chosen labels, so a reproduction must check how labels were mapped before computing each metric. The book does not inherit a universal reliability or accuracy correction from this study.

## Observations

**What the paper claims.** [PAPER-REPORTED] Repeatability and benchmark-conditioned agreement provide different pictures of judge behavior [R62.4, §§4–5].

**What the evidence shows.** [DERIVED] Metric definitions, label marginals and task selection materially affect interpretation.

**What we infer.** [DERIVED] Preserve underlying outcomes and make the supported target explicit before using a score for a decision.

**What remains unknown.** [NOT-DISCLOSED] The reader's user preferences, truth predicate and complete endpoint utility are not established by this benchmark comparison.

## Failure modes

> **Failure mode — Preference becomes a truth certificate.** [DERIVED] *Symptom:* a favored response is assumed factually correct or authorized for use. *Cause:* a population-conditioned preference label is substituted for an independent required predicate. *Detection:* check preferred outputs against evidence, task success and policy/compliance gates on the same items. *Mitigation:* retain the vector and joint acceptance rule, and obtain the missing independent evidence.

[MATHEMATICALLY-DERIVED] A model that always emits the majority reference class can have high raw agreement under severe imbalance while adding no discrimination. If gold is constant and the judge sometimes differs, $p_o=p_e$ and $\kappa=0$; if both are identically constant, $p_o=p_e=1$ and $\kappa$ is undefined. Neither case permits reading a raw-minus-kappa gap as a count of hallucinations.

[DERIVED] Endpoint attribution has a parallel failure. If two candidates differ in weights and retrieval access, only their total difference is observed. Eq. 62.18 cannot identify the missing cross-configuration by algebra. A claimed weight improvement requires a feasible controlled comparison or a narrowed endpoint-level conclusion.

```figure
{
  "id": "fig-62.20",
  "kind": "compare",
  "title": "Endpoint comparison and model attribution",
  "caption": "Equation 62.18 is an identity involving cross-configurations. Two endpoint scores do not identify the model-only term when prompts, retrieval or tools also differ.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.18",
  "alt": "Equation 62.18 is an identity involving cross-configurations. Two endpoint scores do not identify the model-only term when prompts, retrieval or tools also differ.",
  "spec": {
    "axis": "Evidence required for the claimed contribution",
    "columns": [
      {
        "id": "a",
        "label": "Complete endpoint choice"
      },
      {
        "id": "b",
        "label": "Weight-change attribution"
      }
    ],
    "rows": [
      {
        "dimension": "What varies",
        "values": {
          "a": "All declared production components",
          "b": "Weights under matched remaining protocol"
        }
      },
      {
        "dimension": "Required comparison",
        "values": {
          "a": "Same offered target and constraints",
          "b": "Feasible cross-configuration controls"
        }
      },
      {
        "dimension": "Supported conclusion",
        "values": {
          "a": "Endpoint-specific acceptance",
          "b": "Conditional model effect with interactions"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer a population-specific vector and joint gate when requirements are heterogeneous. Prefer an aggregate utility when its costs/weights are explicit and the conclusion survives plausible sensitivity. Prefer direct endpoint evaluation for product selection; prefer controlled factorial contrasts for model attribution. Reverse the scalar-summary preference when a failed gate or population slice changes the decision.

[DERIVED] [Chapter 61](../ch61-capability-portfolios-and-benchmark-validity/README.md) supplies the portfolio and validity boundary. [Chapter 63](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md) measures long-horizon completion, policy and resources. [Chapter 66](../ch66-release-decisions-reproducibility-and-research-to-production-closure/README.md) consumes this evidence in the release dossier.

## Extensions

[DERIVED] A new evaluation method can improve a decision by reducing a relevant uncertainty, identifying an omitted failure, expanding valid support or lowering expense at a matched margin. A higher score alone does not identify which contribution occurred. Preserve the previous predicate and compare at the claimed level: prediction, ranking, calibration, utility or operational acceptance.

[DERIVED] The next evidence should be the smallest investigation capable of reversing the choice: qualified truth review, target-user sampling, a missing cross-configuration, a new domain slice or an offered-load reliability run. Additional agreement on an already resolved proxy may have little decision value.

## Limitations

[DERIVED] Utility choices, reference validity and population support remain substantive assumptions. A finite study cannot authorize universal trust, and an apparently stable ranking may be specific to a task mix or endpoint. Model-judge evaluations can become targets of optimization and require revalidation.

[UNVERIFIED] No numerical preference, accuracy, calibration or endpoint ranking was generated by the book. This draft provides source-bounded analysis and conditional decision constructions. It does not certify a release or a numerical quality rating.

## Reproducibility

[DERIVED] Archive the decision rule, action set and cost meanings, population weights, noncompensable gates, joint IDs, independent references, judge validation, protocol/endpoint differences, uncertainty procedure, sensitivity and confirmation. Record what remains unknown and the evidence that would reopen the choice.

[ASSUMED] [Experiment 62.3](verification.md#experiment-623--calibration-and-decision-audit) proposes the decision audit. Its full-information and score-restricted policies are compared only under their stated information regimes; neither is claimed implemented here.

## References

[R62.4] Reliability without Validity, inspected v1, §3, §§4–5 and Table 2. The raw/kappa interpretation and display-label mapping limits are explicit in [references](references.md).
