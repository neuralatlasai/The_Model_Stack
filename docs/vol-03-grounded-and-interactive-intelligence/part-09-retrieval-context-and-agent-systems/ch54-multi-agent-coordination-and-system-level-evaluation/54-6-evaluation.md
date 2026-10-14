---
id: ms.section.54.6
entity_type: section
title: "Evaluation"
volume: 3
part: 9
chapter: 54
section: 54.6
slug: 54-6-evaluation
parent: ms.chapter.54
prev_sibling: ms.section.54.5
next_sibling: ms.verification.54
children: []
prerequisites: [ms.chapter.6, ms.chapter.38, ms.chapter.48, ms.chapter.51, ms.chapter.52, ms.chapter.53]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [multi_agent_coordination, resource_accounting], feedback_setting: [], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 54.6 Evaluation

## Scope

[DERIVED] System-level evaluation asks whether coordination improves accepted task outcomes, robustness or latency under a declared total budget. It covers reproducibility and attribution of gains to decomposition, information, verification or extra compute. The baseline compares a large team with one short single-agent attempt and reports the team's best answer. The objective is a defensible comparison against a strong resource-matched alternative.

[DERIVED] Chapter 48 supplies workload, latency, failure and accepted-cost boundaries. Chapter 38 supplies test-time search/verifier alternatives; Chapters 51–53 supply tool, controller and state correctness. A multi-agent score is a property of their composed system and evaluator, not of agent count alone.

## Why this exists

[DERIVED] A team may use more input tokens, hidden reasoning, tools, retries, wall time or human intervention than its comparator. It may receive better documents, different models or a more forgiving answer extractor. Any of these can produce a gain without a coordination benefit. Conversely, a rigid call match can penalize an efficient policy that uses fewer calls but longer necessary context.

[DERIVED] Selection can also bias results. Reporting only completed runs removes failures and timeouts; selecting the best topology on test tasks inflates apparent performance; treating repeated runs of the same task as independent overstates uncertainty reduction. A production service includes denied, partial, failed and unknown outcomes and their full costs.

[PAPER-REPORTED] ReAct provides an important conceptual baseline by interleaving reasoning, actions and observations within one controller, with action-only and reasoning-only comparisons [P41, §§2–3]. Tool access and verification therefore cannot be attributed exclusively to a multi-agent design.

## Intuition

[DERIVED] Compare interventions at a fixed acceptance contract. First ask whether a team beats a single controller given additional allowed computation. Then ask whether it beats independent candidates with the same aggregation/checker. Finally isolate whether communication, specialization or external evidence changes outcomes beyond those baselines.

[DERIVED] Report a frontier rather than one convenient operating point when policies spend resources differently. A method can trade latency for quality or money for robustness. The relevant claim names the resource axis, task distribution, quality/effect constraints and uncertainty; “better” without those boundaries is not a scientific conclusion.

## Formulation

[DERIVED] For integer $n_{\rm tasks}\ge1$ paired tasks, let $Y_i^{\rm team},Y_i^{\rm single}\in\{0,1\}$ indicate accepted end-task outcomes under fixed policy/budget conditions. Define
$$
\widehat\Delta=\frac1{n_{\rm tasks}}\sum_i
(Y_i^{\rm team}-Y_i^{\rm single})
=\frac{n_{10}-n_{01}}{n_{\rm tasks}}.
$$
*(Eq. 54.20)*

[DERIVED] Here $n_{10}$ counts team-only successes and $n_{01}$ single-only successes. Pairing controls task difficulty but does not magically equalize model/tool randomness. Repeated trials require a declared task-level aggregation or hierarchical/block uncertainty treatment.

[MATHEMATICALLY-DERIVED] For iid task pairs with discordance probabilities $q_{10},q_{01}$, the per-task difference $D_i$ has
$$
\operatorname{Var}(D_i)=q_{10}+q_{01}-(q_{10}-q_{01})^2,\qquad
\operatorname{Var}(\widehat\Delta)=\operatorname{Var}(D_i)/n_{\rm tasks}.
$$
*(Eq. 54.21)*

[DERIVED] This is a sampling-variance identity, not permission to use a normal interval with tiny or dependent samples. Shared task templates, common outages and repeated histories create dependence. Publish task counts, paired outcomes, repeated-run structure and a justified uncertainty procedure; confidence about an average does not establish robustness to rare irreversible failures.

[DERIVED] Budget fairness has two distinct estimands. A fixed-cap comparison evaluates policies granted the same enforceable resource cap, allowing different realized use. A cost-frontier comparison evaluates accepted success versus actual charged use. Conditioning post hoc on equal realized use can select different difficulty/outcome populations because resource use is itself affected by the policy.

[DERIVED] A prospective architecture selector may use only features available before the target outcome, or features independently predicted from separate calibration data. For standardized regression features $z_j=(f_j-\mu_j)/\sigma_j$ with $\sigma_j>0$,
$$
\widehat y=\gamma_0+\sum_j\gamma_j z_j.
$$
*(Eq. 54.22)*

[DERIVED] Coefficients $\gamma_j$ cannot be multiplied directly by untransformed raw $f_j$ without the training transformations. Interaction columns need the exact construction and standardization used in fitting. Missing transforms, means/scales and unavailable outcome-derived inputs block a reproducible ex-ante prediction.



```figure
{
  "id": "fig-54.18",
  "kind": "calculator",
  "title": "Paired task success difference",
  "caption": "Illustrative paired binary task outcomes. n10 favors the team and n01 favors baseline. Input ranges ensure their sum cannot exceed the minimum task count. This gives an effect estimate, not its uncertainty.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-54.20",
  "alt": "Illustrative paired binary task outcomes. n10 favors the team and n01 favors baseline. Input ranges ensure their sum cannot exceed the minimum task count. This gives an effect estimate, not its uncertainty.",
  "spec": {
    "tex": "\\widehat\\Delta=(n_{10}-n_{01})/n_{\\rm tasks}",
    "equation": "54.20",
    "inputs": [
      {
        "symbol": "tasks",
        "label": "Paired task count",
        "default": 100,
        "min": 50,
        "max": 10000,
        "format": "integer"
      },
      {
        "symbol": "gain",
        "label": "Team-only accepted tasks",
        "default": 15,
        "min": 0,
        "max": 20,
        "format": "integer"
      },
      {
        "symbol": "loss",
        "label": "Baseline-only accepted tasks",
        "default": 8,
        "min": 0,
        "max": 20,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "delta",
        "label": "Paired success difference",
        "formula": "(gain-loss)/tasks",
        "format": "percent"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Fix the end-task acceptance definition before comparing systems. It includes answer/artifact quality, authorized tool behavior, required communicated information, irreversible effects and deadline constraints. An output parser or judge is part of the evaluated system; a lenient extractor in only one condition creates an evaluation intervention.

[DERIVED] Identify the comparison hierarchy. A single short attempt measures scaling relative to a weak baseline. A single controller with the same total budget tests whether delegation adds value beyond more computation. Independent candidates plus a matched aggregator isolate communication. A serial specialist pipeline distinguishes role/interface specialization from wall-clock overlap. A critic with independent tests distinguishes evidence-based correction from additional text.

[DERIVED] Hold model identities, tools, corpus snapshots, authority and evaluators constant for the intended causal comparison. If heterogeneous models or extra retrieval are the intervention, name them separately. Tune policies on development tasks and freeze them before held-out evaluation. Report all attempted tasks and cap violations rather than selecting favorable completed runs.

[DERIVED] Resource accounting includes coordinator/worker prompts, outputs, reported hidden reasoning, failed candidates, retries, tools, external jobs, artifact storage, network and human intervention. Equal maximum iterations is not equal realized tokens; equal tokens across different models is not equal FLOPs or money. Choose the primary budget definition and report remaining axes rather than claiming universal equality.

[DERIVED] Attribute failures by stage with original evidence. Decomposition omission, unsupported tool selection, invalid arguments, stale shared state, unverified communication, aggregation error and evaluator error have different interventions. An oracle diagnostic can identify whether a correct intermediate artifact would fix the final outcome, but it is a diagnostic condition rather than deployable performance.

[PAPER-REPORTED] R54.12 develops a failure taxonomy from more than 150 traces and iterative expert annotation, with separate categories for specification/design, inter-agent misalignment and verification/termination [R54.12, §§3–4]. Theoretical sampling and annotation agreement support a diagnostic taxonomy; they do not estimate population failure probabilities or prove causal sufficiency.

[DERIVED] **Cost.** Evaluation itself consumes model/tool/evaluator work, repeated runs and human review. Development/search costs belong in the deployment decision when amortized; test leakage cannot be repaired by hiding those costs. Paired task-level records require storage proportional to tasks/trials/events, and fault/robustness coverage can be much more expensive than one accuracy run. Report the complete accepted-task denominator using Chapter 48's accounting.



```figure
{
  "id": "fig-54.19",
  "kind": "diagram",
  "title": "Attribute accepted outcomes",
  "caption": "Freeze tasks, tools, information and budgets; preserve every attempt and compare paired accepted outcomes with uncertainty at the declared task/seed unit.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.20",
  "alt": "The diagram shows Frozen tasks and baselines to Controlled interventions; Controlled interventions to All attempts and resource traces; All attempts and resource traces to Independent outcome checker; Independent outcome checker to Paired effect and uncertainty.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "Frozen tasks and baselines"
      },
      {
        "id": "b",
        "kind": "branch",
        "label": "Controlled interventions"
      },
      {
        "id": "c",
        "kind": "memory",
        "label": "All attempts and resource traces"
      },
      {
        "id": "d",
        "kind": "boundary",
        "label": "Independent outcome checker"
      },
      {
        "id": "e",
        "kind": "metric",
        "label": "Paired effect and uncertainty"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d"
      },
      {
        "from": "d",
        "to": "e"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 54.6 — Finite comparison and attribution audit.** [DERIVED] Inputs are finite held-out tasks, frozen system configurations, declared budget units/caps, integer trial count, independent acceptance/effect checker and complete event/resource records. Output is paired outcomes, resource frontiers, uncertainty and scoped conclusions.

$$
\begin{aligned}
1.&\quad \operatorname{FreezeTaskEvaluatorPolicyAndBudgetManifest};
\quad\operatorname{MissingRequiredIdentity}\Rightarrow\operatorname{ReturnUnverified}.\\
2.&\quad \text{For each task/trial/configuration:}\quad
\operatorname{RunOrInspectUnderDeclaredCaps};\\
 &\quad\operatorname{RecordAllTerminalPartialUnknownAndMissingCases};\
\operatorname{ChargeAllCoveredResources}.\\
3.&\quad \operatorname{IndependentTaskPolicyAndEffectCheck}
\Rightarrow Y_i^{(a)}\leftarrow\mathrm{accepted/rejected/unknown};\\
 &\quad\operatorname{Unknown}\Rightarrow\operatorname{RetainUnresolvedAndReportDenominator}.\\
4.&\quad \operatorname{BuildPairedOutcomesAndTaskBlocks};
\quad\operatorname{Compute}_{54.20,54.21}\text{ only under their domains}.\\
5.&\quad \operatorname{AuditBudgetsInformationAndEvaluatorEquivalence};
\quad\operatorname{Confounded}\Rightarrow\operatorname{RestrictAttribution}.\\
6.&\quad \operatorname{CompareFrozenAblationsAndActualCostLatencyFrontiers};
\quad\operatorname{ReturnScopedClaimsWithUncertaintyAndGaps}.
\end{aligned}
$$

[DERIVED] This is an explanatory bounded analysis procedure, not an executed study. Integer task/trial/configuration counts and per-run caps terminate it. Invariants are no omitted failures, no unknown counted as known success, no test-set policy tuning and no cost-free extra agents. Binary formulas require a declared treatment of unknown outcomes; otherwise report bounds or unresolved fractions instead of inserting a favorable label.

## Implementation

[DERIVED] Use a versioned run manifest joining task, policy, model, tool/corpus, evaluator, seed and complete resource identity. Temperature zero does not establish deterministic remote execution. Record actual returned versions where available and explicitly unavailable fields. Preserve initial/worker/aggregated artifacts so error attribution can be independently checked.

[DERIVED] Independent outcome checks are preferable when the environment supports them: tests, database assertions, verified citations and authorized-effect logs. An LLM judge needs its prompt/model/order, calibration against humans or objective checks and uncertainty. Agreement among judges is not truth, and a judge exposed to the candidate's persuasive rationale may share its errors.

[PAPER-REPORTED] R54.6 Appendix F shows answer extraction changes evaluated accuracy and can change apparent debate benefit [R54.6, Appendix F/Table 7]. This is a concrete reason to freeze the evaluator and report malformed outputs consistently rather than crediting coordination for formatting changes.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R54.4 reports 180 model/architecture/benchmark configurations, with Appendix E.4 subsets of 50 Finance Agent and 100 instances for each other benchmark, identical tool interfaces and frozen weights [R54.4, §§4.1–4.2/Appendix E]. Its domain-dependent outcomes are useful comparative evidence within that setup.

[PAPER-REPORTED] The same source reports five-fold experiment-level cross-validation with $R^2=0.524$ for its coordination regression [R54.4, §4.3/Table 3/Eq. 1]. However, its efficiency predictor is $E_c=S/(T_{\rm turns}/T_{\rm single})$, where $S$ is observed success [R54.4, §4.1]. Given the turn ratio, this predictor already contains the target. Cross-validation cannot make a feature available before execution; an ex-ante selector requires an independent prediction/calibration of that quantity.

[DERIVED] The source also states that predictors are standardized, then substitutes raw efficiency/tool values into standardized coefficients and gives a penalty interpretation inconsistent with the displayed arithmetic [R54.4, §4.3]. Eq. 54.22 explains the missing transformation. The reported descriptive fit can remain source-reported; it does not establish a universal architecture law, intrinsic vendor mechanism or deployable 45% baseline threshold. Outcome-derived benchmark complexity and four domains further constrain transfer.

[PAPER-REPORTED] R54.12's annotation process uses successive small expert rounds, and its automated annotator is checked against expert labels on ten traces [R54.12, §§3.2–3.3/Table 2]. This supplies diagnostic evidence with a narrow validation population; no general annotator reliability or intervention effect is inferred beyond it. τ-bench and τ²-bench provide repeated task/state checks under their own simulated-user regimes [P43; R54.11].

## Observations

**What the paper claims.** [PAPER-REPORTED] Multi-agent studies report task-dependent gains, overhead and prospective scaling explanations [R54.4–R54.7].

**What the evidence shows.** [PAPER-REPORTED] Results depend on workload, evaluator, model and resource controls. Some claimed predictors incorporate observed outcomes, and comparison units differ.

**What we infer.** [DERIVED] Budget-matched superiority is a hypothesis that needs held-out paired outcomes and mechanism-isolating ablations; descriptive correlations cannot establish it.

**What remains unknown.** [UNVERIFIED] No local comparative study, architecture selector or accepted-task cost/latency frontier was executed.



```figure
{
  "id": "fig-54.20",
  "kind": "stat-panel",
  "title": "Scientific boundaries to retain",
  "caption": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.20",
  "alt": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "spec": {
    "header": "CLAIM BOUNDARY",
    "rows": [
      {
        "key": "denominator",
        "value": "All original tasks and attempts"
      },
      {
        "key": "attribution",
        "value": "Mechanism versus extra resources"
      },
      {
        "key": "predictor",
        "value": "Available before policy execution"
      },
      {
        "key": "uncertainty",
        "value": "Task and seed units distinguished"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

[DERIVED] Weak single-agent baseline attributes extra compute to coordination; include the stronger comparator. Different tools/context confound decomposition with information; disclose the intervention. Outcome-derived predictor leaks the target; separate ex-post explanation from prospective prediction. Standardized/raw feature mismatch produces invalid numbers; retain transforms. Test-set topology search overfits; freeze selection. Success-only reporting censors failures; keep all tasks. Judge/extraction drift changes labels; version and audit evaluation. Repeated-task pseudoreplication understates uncertainty; use task-level blocks.

## Siblings

[DERIVED] Single-agent long reasoning, independent ensembling, best-of-k/verifier selection, serial specialists and communicative teams belong on the same declared resource/quality frontier. There is no need to preserve the same internal call graph across them; their value is their best frozen policy under the same allowed resources. Chapter 6 owns statistical fundamentals and Chapter 48 service/economic measurement.

## Extensions

### Improvements

[DERIVED] Stronger evaluation adds equal-resource alternatives, frozen mechanism ablations, task/effect checkers and complete failed-run costs. The changed mechanism is more identifiable evidence. Open research is prospective prediction of coordination value across new tasks/models under nonstationary services and unknown higher-order errors. Settling evidence requires features available at decision time and held-out domain transfer, not outcome-containing fits.

## Limitations

[DERIVED] A finite held-out sample does not cover all task or adversarial distributions. Paired variance formulas require the stated independence unit. No single budget simultaneously equalizes tokens, FLOPs, latency and money across heterogeneous models. A successful average does not justify irreversible failures beyond the declared policy threshold.

## Reproducibility

[UNVERIFIED] Preserve all manifests/traces, task-level paired outcomes, raw budgets/cost units, model/evaluator identities, frozen development choices and uncertainty code. Proposed study details remain in verification.md. Source-reported outcomes and original mathematical counterexamples are not original model experiments.

## References

[PAPER-REPORTED] [P41](references.md#p41) ReAct; [R54.4](references.md#r54-4) controlled scaling study; [R54.6](references.md#r54-6) extraction/debate comparison; [P43](references.md#p43), [R54.11](references.md#r54-11), [R54.12](references.md#r54-12) task evaluation and failure taxonomy. Access 2026-10-14.
