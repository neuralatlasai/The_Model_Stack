---
id: ms.section.62.5
entity_type: section
title: "Confidence and abstention"
volume: 3
part: 11
chapter: 62
section: 62.5
slug: 62-5-confidence-and-abstention
parent: ms.chapter.62
prev_sibling: ms.section.62.4
next_sibling: ms.section.62.6
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

# 62.5 Confidence and abstention

## Scope

[DERIVED] Confidence is useful only relative to a specified event and decision. A token probability, answer-string likelihood, verbal self-rating, sampled-answer agreement, semantic-entropy score or judge verdict can be an uncertainty proxy; none is automatically the probability that an answer is correct. This section owns calibration, selective risk and abstention, including finite-sample selection conditions and distribution-shift limits.

[DERIVED] The target is an answer or review policy whose accepted errors and coverage satisfy a declared requirement. A low accepted error rate with almost no answered cases can be operationally useless. A calibrated average can hide a failed language/domain stratum. Report both dimensions and retain noncompensable population obligations from Chapter 61.

## Why this exists

[DERIVED] Forced-answer evaluation rewards a response even when the evidence is insufficient. Allowing abstention can reduce error among returned answers, but a threshold selected on observed labels may overfit. A confidence number can look precise while describing the wrong event or an unstable population.

[DERIVED] The controlling obstruction is turning a score into a justified action rule. This needs a validated correctness predicate, a fixed score-generation procedure, an independent calibration sample, selection-aware uncertainty and target support. More elaborate confidence elicitation does not replace those requirements. If the predicate is a model judge, its error becomes part of the risk being controlled.

## Intuition

[DERIVED] Distinguish discrimination, calibration and decision value. A score discriminates when it orders correct cases above incorrect ones; it is calibrated when stated probabilities match the associated frequencies; it is decision-useful when its induced actions meet the actual error/coverage/cost constraints. A monotone score transform preserves ordering but can change calibration and a fixed numerical threshold.

[DERIVED] A verbal self-rating is an output conditioned on the prompt and context. Validate it like any other learned score. A high probability for the selected next token does not aggregate semantic correctness over alternative answers, and agreement among repeated answers can reflect a shared false belief. Sampling and semantic clustering can supply useful signals at additional inference/judging cost, with their own dependence and labeling errors.

## Formulation

[MATHEMATICALLY-DERIVED] Let $Z=1$ denote independently defined answer correctness and $S_c\in[0,1]$ a confidence score. Write $m(s)=P(Z=1\mid S_c=s)$. Calibration and a squared-score decomposition are

$$
\begin{aligned}
\mathbb E[Z\mid S_c]&=S_c\quad\text{(calibration)},\\
\mathbb E[(S_c-Z)^2]&=\mathbb E[(S_c-m(S_c))^2]+\mathbb E[m(S_c)(1-m(S_c))].
\end{aligned}
$$
*(Eq. 62.13)*

[DERIVED] The identity follows by conditioning on $S_c$ and expanding the square. Coarse-bin expected calibration error replaces conditional calibration by bin-average differences and can hide cancellation. Calibration with respect to $S_c$ alone does not imply the full-history posterior needed for unrestricted Bayes-optimal decisions in [62.6](62-6-interpreting-scores.md).

[MATHEMATICALLY-DERIVED] Let uncertainty $U$ increase toward rejection and define a gate $g_t=\mathbf1\{U\le t\}$. With a fixed target distribution and predicate,

$$
C_a(t)=P(U\le t),\qquad R_a(t)=P(Z=0\mid U\le t)=\frac{\mathbb E[(1-Z)g_t]}{C_a(t)}\quad\text{when }C_a(t)>0.
$$
*(Eq. 62.14)*

[DERIVED] Zero coverage gives undefined conditional risk, not perfect correctness. Coverage is nondecreasing in $t$; conditional risk need not be monotone. For $K_t\ge1$ thresholds fixed independently of calibration outcomes, a frozen score/system/predicate, and independent identically distributed calibration/deployment tuples, let $n_t$ be accepted calibration cases and $e_t$ their errors. A simultaneous construction is

$$
\begin{aligned}
B_t&=\begin{cases}\min\!\left(1,\dfrac{e_t}{n_t}+\sqrt{\dfrac{\log(K_t/\delta)}{2n_t}}\right),&n_t>0,\\1,&n_t=0,\end{cases}\\
\widehat t&=\max\{t\in\mathcal T:B_t\le\alpha\},\qquad P\{\widehat t=\mathrm{NULL}\ \text{or}\ R_a(\widehat t)\le\alpha\}\ge1-\delta,
\end{aligned}
$$
*(Eq. 62.15)*

[DERIVED] Here $0<\alpha,\delta<1$ and $|\mathcal T|=K_t$; NULL is returned if no threshold is certified. Conditional on each fixed $n_t>0$, accepted errors are i.i.d. Bernoulli under these premises. Hoeffding at level $\delta/K_t$, followed by a union bound over the fixed grid, gives the displayed guarantee. It certifies the largest admissible threshold on that grid, hence greatest coverage among certified thresholds, not among all possible policies.

```figure
{
  "id": "fig-62.15",
  "kind": "calculator",
  "title": "Selection-aware accepted-risk bound",
  "caption": "Illustrative fixed-grid Hoeffding certificate from Eq. 62.15. Inputs require independent identically distributed accepted cases under a frozen score/system and fixed thresholds. No feasible certificate does not prove intrinsic unsafe behavior.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.15",
  "alt": "Illustrative fixed-grid Hoeffding certificate from Eq. 62.15. Inputs require independent identically distributed accepted cases under a frozen score/system and fixed thresholds. No feasible certificate does not prove intrinsic unsafe behavior.",
  "spec": {
    "tex": "B=\\min(1,e/n+\\sqrt{\\log(K_t/\\delta)/(2n)})",
    "equation": "62.15",
    "inputs": [
      {
        "symbol": "n",
        "label": "Accepted calibration cases",
        "default": 500,
        "min": 100,
        "max": 10000,
        "format": "integer"
      },
      {
        "symbol": "errors",
        "label": "Accepted calibration errors",
        "default": 10,
        "min": 0,
        "max": 100,
        "format": "integer"
      },
      {
        "symbol": "K",
        "label": "Fixed candidate thresholds",
        "default": 20,
        "min": 1,
        "max": 200,
        "format": "integer"
      },
      {
        "symbol": "delta",
        "label": "Family error probability",
        "default": 0.05,
        "min": 0.001,
        "max": 0.2,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "bound",
        "label": "Simultaneous risk upper bound",
        "formula": "min(1,errors/n+sqrt(ln(K/delta)/(2*n)))",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Fixed-grid certificate",
      "variables": {
        "n": 500,
        "errors": 10,
        "K": 20
      },
      "highlight": [
        "bound"
      ],
      "note": "The simultaneous bound uses accepted integer counts and a fixed threshold grid."
    },
    {
      "anchor": "mechanism",
      "label": "More independent calibration",
      "variables": {
        "n": 2000,
        "errors": 40,
        "K": 20
      },
      "highlight": [
        "bound"
      ],
      "note": "At the same error fraction, more independent evidence narrows uncertainty."
    },
    {
      "anchor": "failure-modes",
      "label": "Small accepted cohort",
      "variables": {
        "n": 100,
        "errors": 2,
        "K": 20
      },
      "highlight": [
        "bound"
      ],
      "note": "Failure to certify can reflect limited evidence even when the observed error fraction is low."
    }
  ]
}
```

## Mechanism

### Methodology

[DERIVED] Define correctness and support first. Choose a score using only allowed information and development data. Freeze generation, uncertainty sampling, semantic grouping, scoring and any calibration transform before the risk-calibration sample. Separate development, threshold calibration and final target evaluation at source/task-family level. Record which uncertainty includes inference randomness and whether extra generations are charged.

[DERIVED] Test both score calibration and the operational risk/coverage curve. Use valid binning or calibration diagnostics with uncertainty and report relevant strata. For selective certification, use a prespecified finite grid and simultaneous bounds as in Eq. 62.15, or another method with a stated proof covering its actual selection rule. A grid chosen from the same observed scores needs its own argument or an additional split; simply applying a fixed-threshold bound repeatedly is insufficient.

[DERIVED] Do not binary-search on presumed monotone conditional risk without establishing it. Scan the finite grid or use a valid sequential-testing procedure with an explicit order and stopping rule. Coverage monotonicity is enough to choose the largest certified threshold after simultaneous validation. A fixed-sequence rule is a different algorithm whose error control must be justified at its claimed level.

[DERIVED] Distinguish an unsafe policy from failure to certify it. A safe policy can lack enough accepted calibration cases to obtain a narrow upper bound. A weak score can also make no useful threshold feasible. More independent labels, a better score, a changed risk target or a narrower population can have different consequences; the absence of a feasible threshold alone does not identify which obstruction applies.

[DERIVED] Revalidate on distribution shifts in language, domain, modality, endpoint or prompt. I.i.d. calibration assumptions and the same correctness predicate are part of the guarantee. A domain-qualified judge revision can change the event being estimated even with identical model outputs.

```figure
{
  "id": "fig-62.16",
  "kind": "diagram",
  "title": "Freeze before selecting a certified threshold",
  "caption": "Independent development fixes score and grid. Calibration constructs simultaneous bounds, then the rule returns a certified threshold or NULL. Untouched target evidence tests coverage and transfer; changed assumptions reopen calibration.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.15",
  "alt": "Independent development fixes score and grid. Calibration constructs simultaneous bounds, then the rule returns a certified threshold or NULL. Untouched target evidence tests coverage and transfer; changed assumptions reopen calibration.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Independent development"
      },
      {
        "id": "n1",
        "kind": "state",
        "label": "Frozen score/system/grid"
      },
      {
        "id": "n2",
        "kind": "dataset",
        "label": "Independent calibration tuples"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Accepted counts and simultaneous bounds"
      },
      {
        "id": "n4",
        "kind": "branch",
        "label": "Any certified threshold?"
      },
      {
        "id": "n5",
        "kind": "state",
        "label": "Largest certified threshold"
      },
      {
        "id": "n6",
        "kind": "state",
        "label": "NULL: not certified"
      },
      {
        "id": "n7",
        "kind": "metric",
        "label": "Untouched target risk and coverage"
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
        "label": "no"
      },
      {
        "from": "n5",
        "to": "n7"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 62.5 — Certify a finite-grid abstention rule.**

1. Freeze the target population, model/decoding, correctness predicate, uncertainty function and finite threshold grid using independent development information.
2. Draw independent identically distributed calibration tuples under the declared target and retain offered failures. For every fixed threshold, compute $n_t$ and $e_t$.
3. Set $B_t=1$ for no accepted cases; otherwise compute the simultaneous bound in Eq. 62.15 or a valid binomial alternative at $\delta/K_t$.
4. Enumerate all certified thresholds and return the largest, or NULL if none. Do not infer monotone risk or impossibility from a rejected threshold.
5. Evaluate the frozen selected rule on untouched target data, reporting offered acceptance, accepted error, failure/abstention, subgroup coverage and actual expense.
6. Reopen calibration after score/system/predicate/population changes. Route unresolved high-severity cases under a separately evaluated review policy.

[DERIVED] Sorting $n_{\mathrm{cal}}$ scores and accumulating errors supports a presorted fixed-grid scan in $O(n_{\mathrm{cal}}\log n_{\mathrm{cal}}+K_t)$ work after generation; preserve score ties and inclusive-boundary semantics. The finite sample/grid gives termination, not non-null certification.

## Implementation

[DERIVED] The calibration ledger needs raw answer, allowed context, score-generation inputs, all sampled answers/clusters, correctness label and provenance, population stratum, calibration split, threshold grid, selection rule and failure status. Use integer accepted/error counts and defined no-coverage behavior. Floating-point threshold comparisons and ties must match calibration and deployment.

[PAPER-REPORTED] CIC presents fixed-threshold binomial bounds and a fixed-grid union-bound theorem, but its assumption is labeled exchangeability while its proof explicitly uses i.i.d. tuples. Its implementation remarks discuss empirical-score scanning and fixed-sequence testing [R62.6, §3.4, source theorem IDs 3.2 and 3.3, §3.5]. This chapter's Eq. 62.15 retains the stronger sufficient sampling and selection premises rather than importing a broader guarantee.

[DERIVED] A correctness classifier controls errors relative to its labels unless independently shown to match the intended truth. Uncertainty from multiple generation samples multiplies inference/semantic-judge work and can alter latency. A score useful for ranking may still be expensive enough that simpler direct review is preferable at a matched accepted-task cost. Exact device costs and local runtime behavior are unverified.

## Experimental design

### Reported experiments

[PAPER-REPORTED] CIC evaluates seven instruction-tuned models on CommonsenseQA and TriviaQA, using 100 calibration/test splits. It reports accepted-case error, answering coverage and failed calibration trials; semantic entropy uses ten sampled answers per question, and TriviaQA correctness uses sentence similarity above 0.6. Some strict-risk settings return no certified threshold [R62.6, §4, Tables 1–4].

[DERIVED] These reported experiments concern the paper's implemented procedure and datasets. They do not automatically verify the fixed-grid theorem for an empirical-grid variant, nor show that a null result proves an intrinsically unsafe model. Coverage, failure counts, label validity and the actual testing rule must accompany any guarantee claim. Sentence-similarity acceptance is a proxy whose threshold does not itself establish factual correctness; a risk guarantee relative to that label cannot silently become a truth guarantee.

## Observations

**What the paper claims.** [PAPER-REPORTED] Confidence bounds can turn uncertainty scores into risk-controlled selective policies under its stated conditions [R62.6, §3].

**What the evidence shows.** [DERIVED] The proof, selection rule and experimental implementation have distinct assumptions that must be aligned.

**What we infer.** [DERIVED] Certify the actual deployed rule under explicit sufficient premises; report inability to certify separately from unsafe behavior.

**What remains unknown.** [UNVERIFIED] No target calibration, independence assumption or risk/coverage curve has been established by the book.

## Failure modes

> **Failure mode — Exchangeability substituted for independent evidence.** [DERIVED] *Symptom:* repeated dependent cases produce an apparently tight binomial risk bound. *Cause:* permutation invariance is treated as i.i.d. sampling. *Detection:* inspect shared source/session/latent variables and test whether the proof requires independent Bernoulli errors. *Mitigation:* use justified independent units or a valid dependence-aware bound and narrow the guarantee.

[MATHEMATICALLY-DERIVED] Let one shared $Z_0\sim\mathrm{Bernoulli}(0.1)$ determine every error $E_i=Z_0$, and set every $U_i=0$. The tuples are exchangeable. Their error count is either zero or $n$, not $\mathrm{Binomial}(n,0.1)$. With $n=1,000$, $K_t=1$ and $\delta=0.05$, zero errors give a Hoeffding bound about 0.0387 with probability 0.9, although marginal risk is 0.1. Thus exchangeability alone does not justify the displayed marginal-risk guarantee. This is an analytical counterexample, not a measured failure of a named model.

[DERIVED] Coarse calibration can also conceal error. Scores 0.6 and 0.8 with true correctness probabilities 0.8 and 0.6 have zero average calibration discrepancy in one equally weighted bin, while neither score is calibrated. Low bin ECE is therefore not a certificate of reliable high-confidence decisions.

```figure
{
  "id": "fig-62.17",
  "kind": "compare",
  "title": "Exchangeability and i.i.d. sampling",
  "caption": "Permutation symmetry alone allows shared latent errors. The binomial-conditioning proof in Eq. 62.15 needs the stronger independent sampling premise or another valid dependence-aware argument.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-62.15",
  "alt": "Permutation symmetry alone allows shared latent errors. The binomial-conditioning proof in Eq. 62.15 needs the stronger independent sampling premise or another valid dependence-aware argument.",
  "spec": {
    "axis": "Evidence supporting a binomial accepted-error bound",
    "columns": [
      {
        "id": "a",
        "label": "Exchangeability alone"
      },
      {
        "id": "b",
        "label": "Independent identical tuples"
      }
    ],
    "rows": [
      {
        "dimension": "Symmetry",
        "values": {
          "a": "Order of records irrelevant",
          "b": "Order irrelevant plus independence"
        }
      },
      {
        "dimension": "Counterexample",
        "values": {
          "a": "Every error equals one shared Bernoulli",
          "b": "Independent Bernoulli draws"
        }
      },
      {
        "dimension": "Count law",
        "values": {
          "a": "Can be zero or all errors",
          "b": "Binomial after fixed-threshold conditioning"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Prefer a simple score plus independently calibrated threshold when it meets risk, coverage and expense constraints. Prefer richer uncertainty sampling when it provides enough additional discrimination to justify its cost. Prefer review or abstention when no admissible rule can be certified. Reverse these choices when target support, error severity, sampling dependence or endpoint behavior changes.

[DERIVED] [62.3](62-3-model-as-judge.md) supplies label-validation obligations, [62.6](62-6-interpreting-scores.md) supplies the full-information utility condition, and [61.5](../ch61-capability-portfolios-and-benchmark-validity/61-5-robustness-and-transfer.md) supplies support/shift limitations. Calibration does not bypass any of them.

## Extensions

[DERIVED] Post-hoc score calibration can improve probability interpretation without changing ranking; improved ranking can improve coverage at a fixed risk without producing calibrated probabilities. Evaluate these contributions separately. A new abstention method is valuable if it expands the certified operating envelope or reduces expense under matched assumptions, not merely if it returns fewer answers.

[DERIVED] Next evidence should distinguish insufficient calibration size, poor score ordering, label defects, unsupported strata and true risk violations. More repeated draws of dependent cases cannot replace independent calibration. A larger fixed grid increases selection flexibility but also the simultaneous-certification burden in Eq. 62.15.

## Limitations

[DERIVED] Finite-sample guarantees are conditional on sampling, fixed score/system, valid labels and a covered selection rule. They are not universal assurance under deployment drift. Abstention can exclude important users or cases; population-level service requirements therefore constrain acceptable coverage. A confidence score may be strategically or accidentally miscalibrated without any syntax error.

[UNVERIFIED] No uncertainty estimator, calibration transform, model endpoint or risk certificate was executed here. Source-reported outcomes and the book's conditional derivations remain separate.

## Reproducibility

[DERIVED] Archive the target correctness event, score construction, independent splits, fixed grid, accepted/error counts, bound and multiplicity rule, NULL outcomes, target evaluation, subgroups and all generation/review expense. Preserve failed and abstained cases, including undefined conditional-risk outputs.

[ASSUMED] [Experiment 62.3](verification.md#experiment-623--calibration-and-decision-audit) proposes i.i.d., correlated and shifted controls. It is unexecuted; the exchangeable counterexample is a mathematical check of premises rather than new model research.

## References

[R62.6] Dong and Shinnou, CIC, inspected v1, §§3–4, source theorem IDs 3.2 and 3.3, Algorithm 1 and Tables 1–4. The ledger records the sampling/implementation distinction explicitly: [references](references.md).
