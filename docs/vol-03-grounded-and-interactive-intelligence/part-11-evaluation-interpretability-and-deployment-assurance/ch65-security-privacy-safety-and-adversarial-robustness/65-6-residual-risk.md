---
id: ms.section.65.6
entity_type: section
title: "Residual risk"
volume: 3
part: 11
chapter: 65
section: 65.6
slug: 65-6-residual-risk
parent: ms.chapter.65
prev_sibling: ms.section.65.5
next_sibling: ms.verification.65
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.24, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36, ms.chapter.46, ms.chapter.47, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64]
downstream: [ms.chapter.66]
related: [ms.chapter.30, ms.chapter.42, ms.chapter.48]
relations: []
axes: {lifecycle: [pretraining, post_training, inference, evaluation, assurance], mechanism: [security_boundary, privacy_accounting, adversarial_evaluation], feedback_setting: [], modality: [text, code, image, tool_trajectory]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 65.6 - Residual risk

## Scope

[DERIVED] Residual risk includes deployment shift, adaptive attackers, incomplete threat inventories, finite budgets, imperfect evaluators and limitations of assurance evidence. This section turns those gaps into an explicit decision record rather than an unqualified claim of robustness.

## Why this exists

[DERIVED] A benchmark can establish that a particular attack succeeded. Failure to discover a violation establishes much less: the attacker may be weak, the budget short, the scorer insensitive or the evaluated state unlike production. Security evidence must therefore describe the tested frontier and the conditions that reopen the decision.

## Intuition

[DERIVED] An attack search is an optimization process against the complete system. A defense change can redirect the search rather than remove every route. Increasing the search budget can reveal a vulnerability without changing the defender. A useful release dossier says which risks were reduced, which remain, and which observations would trigger a change.

## Formulation

[MATHEMATICALLY-DERIVED] For feasible attacker set A_B under budget/access constraints and deployment distribution P,

$$
 R_B(Df;P)=\sup_{A\in\mathcal A_B}\mathbb E_P[L(V,h)\mid Df,A],\qquad
 \sup_{A\in\mathcal A_{tested}}R(Df,A)\le R_B(Df;P)
 \quad\text{if }\mathcal A_{tested}\subseteq\mathcal A_B.
$$
*(Eq. 65.21)*

[DERIVED] The inequality concerns true risks under the same P, not arbitrary finite-sample estimates. An observed attack supplies a concrete counterexample to a universal invariant; its empirical success fraction still has sampling uncertainty. Source changes, a stronger attacker, different privileges or a shifted P change the estimand.

[MATHEMATICALLY-DERIVED] For a finite list of violation classes V1 through Vk,

$$
 \max_j\Pr[V_j]\le\Pr[\bigcup_{j=1}^kV_j]\le
 \min(1,\sum_{j=1}^k\Pr[V_j]).
$$
*(Eq. 65.22)*

[DERIVED] This union bound needs no independence, but requires all probabilities refer to the same deployment experiment. An incomplete list leaves unmodeled classes outside the bound. Per-category rates measured on separately balanced datasets cannot be summed as deployment probabilities without the appropriate conditioning/weights. Severity-weighted risk additionally requires a loss model.

[MATHEMATICALLY-DERIVED] For N legitimate task opportunities, end-to-end useful-task cost is

$$
 C_{useful}=\frac{C_{base\ model}+C_{base\ tools}+C_{monitor\ increment}+C_{retry\ increment}+C_{review}+C_{infrastructure}}
 {N\,\widehat U},\qquad N\widehat U>0.
$$
*(Eq. 65.23)*

[DERIVED] The numerator is a disjoint cost partition: base-model and base-tool terms cover primary task work; the monitor increment covers monitoring outside that base work; the retry increment covers additional retry work not already charged in either term. Every paid event is assigned once, including failed, refused and uncertain work. Do not add a complete all-model-call total to overlapping monitor/retry model-call totals. U is useful authorized completion, not accepted responses. Keep attacker expenditure separate from defender workload cost and report both; an attacker that spends three times the battles does not demonstrate equal-cost search efficiency. When no task completes, the per-useful-task ratio is undefined rather than zero.

[MATHEMATICALLY-DERIVED] For n independent identically distributed Bernoulli trials of a fixed event under a fixed evaluation distribution, zero observed violations gives a one-sided exact upper confidence endpoint

$$
 p_{upper}=1-\eta^{1/n},\qquad n\ge1,\quad0<\eta<1.
$$
*(Eq. 65.24)*

[DERIVED] The confidence level is1-eta; eta here is not the DP failure parameter. This follows from Pr[zero]=(1-p)^n. It does not certify all adaptive attackers, dependent attempts from one battle, data-selected thresholds, a changed deployment distribution or an incomplete scorer. A selected-risk certificate needs a held-out selection/calibration construction with explicit coverage and denominator; see @ms.section.62.5. Zero executions, missing outcomes or no opportunities supply no empirical certificate, and zero observed violations is not zero risk.

```figure
{
  "id": "fig-65.18",
  "kind": "diagram",
  "title": "Residual risk is a versioned decision loop",
  "caption": "A new privilege, distribution, policy, model, attack or scorer can invalidate the recorded evidence. Reopening is part of the decision, not an afterthought.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.18",
  "alt": "A new privilege, distribution, policy, model, attack or scorer can invalidate the recorded evidence. Reopening is part of the decision, not an afterthought.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "s",
        "kind": "state",
        "label": "Frozen threat/system snapshot"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "Bounded held-out evaluation"
      },
      {
        "id": "r",
        "kind": "dataset",
        "label": "Evidence and unresolved gaps"
      },
      {
        "id": "d",
        "kind": "branch",
        "label": "Release/limit/hold decision"
      },
      {
        "id": "m",
        "kind": "metric",
        "label": "Operational signals and changes"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "e",
        "kind": "flow",
        "label": "fixed premises"
      },
      {
        "from": "e",
        "to": "r",
        "kind": "flow",
        "label": "results and uncertainty"
      },
      {
        "from": "r",
        "to": "d",
        "kind": "flow",
        "label": "declared criteria"
      },
      {
        "from": "d",
        "to": "m",
        "kind": "flow",
        "label": "monitor scoped deployment"
      },
      {
        "from": "m",
        "to": "s",
        "kind": "feedback",
        "label": "reopen changed premises"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Compare the same system under fixed/adaptive attacks, equal/different budgets, fresh/persistent state and independent evaluator checks. These axes identify different failure mechanisms. A pooled aggregate can hide scenario-specific weaknesses and must retain its cells, denominators and uncertainty.

[PAPER-REPORTED] Adaptive Adversaries reports that headline defender differences in the frontier matrix are not statistically decisive under its small per-cell sample. Frozen attacks reproduce more often on their original target than across targets. Its historical competition uses a different ten-round protocol, while frontier evaluation uses fifteen rounds. Historical benign-task results are not a matched utility control for every frontier defender. The source itself bounds selection, sample size, scorer and task scope [R65.5, Sections 4-6; Appendix B].

[DERIVED] These findings argue against treating one aggregate as an intrinsic security rank. They do not show that no ranking could be estimated under a sufficiently specified, well-powered deployment distribution. Source-specific negatives are evidence about that protocol, not a universal impossibility theorem.

```figure
{
  "id": "fig-65.19",
  "kind": "compare",
  "title": "A residual-risk record states when to reverse",
  "caption": "The proposed decision table makes unresolved evidence actionable without implying that a finite checklist certifies security.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.19",
  "alt": "The proposed decision table makes unresolved evidence actionable without implying that a finite checklist certifies security.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "premise",
        "label": "Recorded premise"
      },
      {
        "id": "signal",
        "label": "Reopening signal"
      },
      {
        "id": "action",
        "label": "Response"
      }
    ],
    "rows": [
      {
        "dimension": "Access",
        "values": {
          "premise": "Scoped tools, data and egress",
          "signal": "New resource, plugin or outbound path",
          "action": "Rebuild authority graph and retest"
        }
      },
      {
        "dimension": "Behavior",
        "values": {
          "premise": "Frozen policy/model/monitor",
          "signal": "Model, adapter, prompt or policy change",
          "action": "Re-evaluate both harm and legitimate utility"
        }
      },
      {
        "dimension": "Evaluation",
        "values": {
          "premise": "Held-out fixed-budget attacks/scorer",
          "signal": "New strategy, judge failure or budget",
          "action": "Preserve old result; add explicit new estimand"
        }
      },
      {
        "dimension": "Operations",
        "values": {
          "premise": "Known workload and review capacity",
          "signal": "Shift, alert backlog or uncertain effects",
          "action": "Limit privileges/traffic and reconcile evidence"
        }
      }
    ]
  }
}
```

## Algorithm

### Algorithm 65.6 — Produce a residual-risk release record

[DERIVED] Inputs: threat snapshot, control graph, held-out harm/utility/resource evidence and accountable owners. Output: a scoped decision with reversal conditions.

1. Freeze model, data, dependencies, permissions, policy, monitors, attack/scoring harness and deployment population assumptions.
2. State every claim with its protected unit/event, denominator, budget, uncertainty and evidence category: formal conditional result, source report, static inspection, executed local fixture or proposed experiment.
3. List observed counterexamples, negative results, missing implementation details and untested access/shift conditions; do not convert missingness to safety.
4. Compare declared harm/utility/resource constraints and operational review capacity. Select release, restricted release or hold with a named owner and review date.
5. Bind monitoring/rollback to concrete events: unauthorized effect, secret exposure, drift, scorer failure, privilege/configuration changes or unexplained alert backlog.
6. Preserve immutable prior evidence and reopen only the affected claims when premises change; rerun the necessary held-out comparisons without silently reusing a tuned test set.

[DERIVED] The algorithm is a governance procedure with technical prerequisites, not a universal assurance theorem. A finite evaluation budget ending is a resource stop, not proof that the scientific question is settled.

## Implementation

[DERIVED] Store claim/evidence links alongside code/configuration hashes and the actual control owner. Keep attempted, blocked, committed and uncertain effects distinct in telemetry. A review queue needs capacity and escalation deadlines; otherwise nominal human oversight can become an unbounded delay while harmful actions continue.

[DERIVED] Use privacy-preserving audit data where possible, but validate that redaction does not erase the event needed to detect a violation. Store synthetic canaries and minimized state evidence for routine regression. Incident response should revoke credentials/capabilities and reconcile actual effects; adding another system instruction is not sufficient when the compromised boundary is external authority.

```figure
{
  "id": "fig-65.20",
  "kind": "calculator",
  "title": "Zero observed violations still leaves an upper endpoint",
  "caption": "Eq.65.24 fixed-event IID Bernoulli construction. It does not apply to dependent adaptive attempts or a selected benchmark without additional analysis.",
  "placement": "rail",
  "anchor": "implementation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-65.24",
  "alt": "Eq.65.24 fixed-event IID Bernoulli construction. It does not apply to dependent adaptive attempts or a selected benchmark without additional analysis.",
  "spec": {
    "equation": "65.24",
    "tex": "p_{upper}=1-\\eta^{1/n}",
    "inputs": [
      {
        "symbol": "n",
        "label": "Independent fixed-design trials",
        "default": 100,
        "min": 1,
        "max": 1000000,
        "format": "integer"
      },
      {
        "symbol": "eta",
        "label": "One-sided error probability",
        "default": 0.05,
        "min": 1e-06,
        "max": 0.5,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "upper",
        "label": "Upper violation probability endpoint",
        "formula": "1-eta^(1/n)",
        "format": "percent"
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[DERIVED] Experiment 65.5 proposes a held-out budget/state/shift stress matrix and decision record. Its units are independent battles or legitimate task sessions, not individual correlated attack attempts. Compare release decisions under evaluator disagreement and missing outcomes as sensitivity analyses. No empirical certification or production deployment result is claimed.

## Observations

**What the paper claims.** [PAPER-REPORTED] Multi-round, multi-attacker evaluation uncovers distinct weaknesses missed by single-attempt summaries [R65.5].

**What the evidence shows.** [DERIVED] Limited samples, target-specific replay, differing protocols and output-based tasks constrain transfer and ranking claims.

**What we infer.** [DERIVED] A defensible handoff preserves the tested frontier, unresolved assumptions and explicit reversal conditions.

**What remains unknown.** [UNVERIFIED] Unknown attacks, distribution shifts, hidden execution paths and scorer blind spots remain outside the inspected evidence.

## Failure modes

[DERIVED] Common overclaims are zero failures described as zero risk, attacks pooled without budget normalization, dependent attempts treated as independent trials, conditional rates summed as unconditional risk, and old evidence reused after a privilege change. An unreviewed alert backlog can invalidate an oversight premise without changing a model score.

## Siblings

[DERIVED] @ms.section.62.5 owns risk/certificate selection assumptions; @ms.chapter.63 owns reliability events and operational uncertainty. @ms.chapter.64 bounds interpretation evidence. @ms.chapter.66 receives this threat/control/evidence record for end-to-end release integration.

## Extensions

### Improvements and their evidence

[DERIVED] Increase attack diversity when observed methods have narrow coverage, and increase independent battle counts when uncertainty dominates. Restrict privileges when unknown failure consequences are unacceptable. Reverse a release decision on a violated invariant, unaccounted private release, unacceptable utility loss or changed access—not only on a higher aggregate ASR. A stronger conditional mathematical bound is useful only when the actual experiment meets its premises.

## Limitations

[DERIVED] No finite tested attacker set proves universal security. The confidence endpoint is a mathematical fixture under IID/fixed-design assumptions, not a certificate for these source benchmarks. No chapter-proposed experiment or release was executed.

## Reproducibility

[DERIVED] Archive the complete dossier: source revisions, component/control hashes, threat graph, policy, attacker/human budgets, group/session units, event definitions, all outcomes, uncertainty analysis, owners and reopening rules. Preserve proposed versus executed status.

## References

[R65.5,R65.9-R65.11] Source-specific protocols and limitations: @ms.references.65. Proposed artifact: @ms.verification.65.
