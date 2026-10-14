---
id: "ms.section.53.6"
entity_type: "section"
title: "53.6 — Long-horizon evaluation"
volume: 3
part: 9
chapter: 53
section: 53.6
slug: "53-6-long-horizon-evaluation"
parent: "ms.chapter.53"
prev_sibling: "ms.section.53.5"
next_sibling: "ms.verification.53"
children: []
prerequisites: ["ms.chapter.24","ms.chapter.42","ms.chapter.49","ms.chapter.50","ms.chapter.51","ms.chapter.52"]
downstream: ["ms.chapter.54","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference","evaluation","assurance"],"mechanism":["agent_memory","persistent_state","provenance","deletion"],"feedback_setting":[],"modality":["text"]}
papers: ["P16","P40"]
implementations: ["impl.pytorch","impl.hugging-face-transformers"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 53.6 — Long-horizon evaluation

## Scope

[DERIVED] Long-horizon memory evaluation measures whether persistent state improves future decisions across sessions while controlling cumulative errors, false memories, adaptation, interference and lifecycle cost. The unit is an offered dependent task or interaction sequence, not merely a successful recall. This section separates retention, current-state resolution, action consistency and deletion behavior.

## Why this exists

[DERIVED] A system can recall isolated facts accurately while failing to update them, combine them, or use them in an action. A system can improve a late answer by preserving an early mistake that happens to match the benchmark. A system can report cheap retrieval while hiding expensive write-side extraction and consolidation. These are different scientific claims and need different denominators.

[DERIVED] Long horizons create feedback. Generated interpretations become future inputs; mistakes can be compressed and repeated; an early action can change the environment faced by later sessions. Evaluation that feeds a fixed gold history to every query measures reading from that history, not the full adaptive state/action process.

## Intuition

[DERIVED] Evaluate three coupled objects: the retained evidence, the accepted state, and the resulting decision trajectory. For each decision, record whether the needed source was retained/retrieved, whether the accepted state was correct for the requested time, and whether the action satisfied its preconditions. Final task success remains essential, but it cannot identify which interface failed.

[DERIVED] Include tasks where memory should help, where it should remain silent, where old information must be invalidated, and where it must be forgotten. A memory system that always recalls something can score well on answerable questions while inventing personal facts on unanswerable ones. A state updater that recognizes corrections only when explicitly asked can still execute stale plans in ordinary interactions.

```figure
{
  "id": "fig-53.18",
  "kind": "diagram",
  "title": "All offered tasks retain outcomes and cost",
  "caption": "Policy and baseline start from matched, isolated initial states. Their actions produce separate adaptive observations and can diverge. Every terminal or missing outcome joins the same offered-task ledger with its full lifetime cost.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.23",
  "alt": "The offered-task manifest forks matched initial states into separate policy and baseline memory/action loops. Each loop receives its own action-dependent observations. Success, timeout and failure from both branches join independent paired labels and all-attempt cost; unknown labels remain visible.",
  "spec": {
    "direction": "TB",
    "nodes": [
      {
        "id": "i",
        "kind": "dataset",
        "label": "all offered task IDs"
      },
      {
        "id": "p",
        "kind": "state",
        "label": "matched isolated initial states"
      },
      {
        "id": "w",
        "kind": "process",
        "label": "policy: write / read / consolidate",
        "group": "policy"
      },
      {
        "id": "a",
        "kind": "process",
        "label": "policy actions / state changes",
        "group": "policy"
      },
      {
        "id": "t",
        "kind": "state",
        "label": "policy terminal outcome",
        "group": "policy"
      },
      {
        "id": "w0",
        "kind": "process",
        "label": "baseline memory / context rule",
        "group": "baseline"
      },
      {
        "id": "a0",
        "kind": "process",
        "label": "baseline actions / state changes",
        "group": "baseline"
      },
      {
        "id": "t0",
        "kind": "state",
        "label": "baseline terminal outcome",
        "group": "baseline"
      },
      {
        "id": "j",
        "kind": "process",
        "label": "independent paired outcome labels"
      },
      {
        "id": "u",
        "kind": "state",
        "label": "missing / unknown retained"
      },
      {
        "id": "c",
        "kind": "metric",
        "label": "all outcomes + lifetime costs"
      }
    ],
    "edges": [
      {
        "from": "i",
        "to": "p",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "w",
        "kind": "flow",
        "label": "same initial task"
      },
      {
        "from": "p",
        "to": "w0",
        "kind": "flow",
        "label": "same initial task"
      },
      {
        "from": "w",
        "to": "a",
        "kind": "flow"
      },
      {
        "from": "a",
        "to": "w",
        "kind": "feedback",
        "label": "new action-dependent observation"
      },
      {
        "from": "a",
        "to": "t",
        "kind": "flow",
        "label": "success / timeout / failure"
      },
      {
        "from": "w0",
        "to": "a0",
        "kind": "flow"
      },
      {
        "from": "a0",
        "to": "w0",
        "kind": "feedback",
        "label": "new action-dependent observation"
      },
      {
        "from": "a0",
        "to": "t0",
        "kind": "flow",
        "label": "success / timeout / failure"
      },
      {
        "from": "t",
        "to": "j",
        "kind": "flow"
      },
      {
        "from": "t0",
        "to": "j",
        "kind": "flow"
      },
      {
        "from": "j",
        "to": "c",
        "kind": "flow",
        "label": "known labels"
      },
      {
        "from": "j",
        "to": "u",
        "kind": "flow",
        "label": "missing / unknown labels"
      },
      {
        "from": "u",
        "to": "c",
        "kind": "flow",
        "label": "bounds / unresolved, no imputation"
      },
      {
        "from": "t",
        "to": "c",
        "kind": "flow",
        "label": "full policy cost"
      },
      {
        "from": "t0",
        "to": "c",
        "kind": "flow",
        "label": "full baseline cost"
      }
    ],
    "groups": [
      {
        "id": "policy",
        "label": "Memory policy trajectory"
      },
      {
        "id": "baseline",
        "label": "Baseline trajectory"
      }
    ]
  }
}
```

## Formulation

[MATHEMATICALLY-DERIVED] Let $E_t$ be a declared unrecovered material error at decision $t$, and let $e_t=\Pr(E_t\mid E_1^c,\ldots,E_{t-1}^c)$ when the conditioning event has positive probability. Then
$$
\Pr\!\left(\bigcap_{t=1}^{T}E_t^c\right)=
\prod_{t=1}^{T}(1-e_t).
$$
(Eq. 53.19)

[MATHEMATICALLY-DERIVED] This is the chain rule, with no independence assumption. If a preceding clean-history event has probability zero, the full clean-trajectory probability is zero rather than an evaluation of undefined later conditionals. Substituting one marginal per-step error rate into every factor is unjustified unless the conditional rates actually match. The identity concerns an all-clean trajectory; task success can have a different definition and may tolerate or recover intermediate mistakes.

[DERIVED] For $N\ge1$ offered tasks, task $i$ with $n_i\ge1$ scored subtasks, define a macro progress measure and a domain-defined final success measure:
$$
\mathrm{PS}=\frac1N\sum_{i=1}^{N}
\frac1{n_i}\sum_{t=1}^{n_i}b_{it},
\qquad
\mathrm{SR}=\frac1N\sum_{i=1}^{N}y_i,
\qquad b_{it},y_i\in\{0,1\}.
$$
(Eq. 53.20)

[DERIVED] Unless the task contract specifies it, $y_i$ need not equal $\prod_tb_{it}$. Macro progress weights each task equally, whereas pooling all subtasks weights longer tasks more heavily. A reported average across domains is a third aggregation. Name the unit and weighting before comparing numbers; a final-answer criterion does not prove every intermediate action was correct.

```figure
{
  "id": "fig-53.19",
  "kind": "calculator",
  "title": "Conditional errors compound along a clean trajectory",
  "caption": "Illustrative constant conditional error over T decisions, displayed as percentages. Marginal error rates cannot replace these conditionals. For extreme inputs the numerical product can underflow to zero; this is not a mathematical zero unless e = 1.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-53.19",
  "alt": "A constant 2% error conditional on all earlier decisions being clean yields about 36.4% all-clean probability over 50 decisions. Larger horizons compound conditional errors. Numerical zero at extreme inputs can indicate floating-point underflow rather than impossibility.",
  "spec": {
    "tex": "P_{clean}=(1-e)^T",
    "inputs": [
      {
        "symbol": "e",
        "label": "error given all earlier decisions clean",
        "default": 0.02,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "t",
        "label": "required clean decisions",
        "default": 50,
        "min": 1,
        "max": 10000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "all-clean trajectory probability",
        "formula": "(1-e)^t",
        "format": "percent",
        "emphasis": true
      }
    ],
    "equation": "53.19"
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Conditional errors",
      "note": "The input conditions on all earlier decisions being clean, not the marginal per-step error."
    },
    {
      "anchor": "mechanism",
      "label": "Longer horizon",
      "note": "The constant-conditional-rate specialization compounds across the required decisions.",
      "variables": {
        "t": 500
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Numerical underflow",
      "note": "At extreme inputs the displayed product can be zero from floating-point underflow; the real product remains positive for e < 1.",
      "variables": {
        "e": 0.9,
        "t": 10000
      }
    }
  ]
}
```

[DERIVED] Let $Y_i^\pi$ and $Y_i^0$ be paired task utilities under memory policy $\pi$ and a declared baseline. Let $C_i^\pi$ include write, read, consolidation, storage/replication, correction/deletion and runtime repair cost for the evaluated lifetime, all converted to one declared cost unit. A utility-per-cost summary is
$$
U_{\rm cost}=
\frac{\sum_{i=1}^{N}(Y_i^\pi-Y_i^0)}
{\sum_{i=1}^{N}C_i^\pi},
\qquad \sum_i C_i^\pi>0.
$$
(Eq. 53.21)

[DERIVED] Every offered task remains in the numerator and denominator, including failures, abstentions, timeouts and no-memory-benefit cases. The ratio of sums differs from the average of per-task ratios and prevents tiny-cost tasks from receiving disproportionate weight. Report raw task outcomes and costs alongside the ratio, since an apparent gain can be driven by one expensive subgroup. Energy, latency and money remain separate dimensions unless a declared conversion model combines them.

[MATHEMATICALLY-DERIVED] With independent evaluation episodes, fixed policy/baseline and paired bounded utilities $Y_i^\pi,Y_i^0\in[0,1]$, let $X_i=Y_i^\pi-Y_i^0\in[-1,1]$. Hoeffding's inequality gives
$$
\Pr\!\left(
|\bar X-\mathbb E\bar X|>
\sqrt{\frac{2\ln(2/\delta)}{N}}
\right)\le\delta,\qquad 0<\delta<1.
$$
(Eq. 53.22)

[MATHEMATICALLY-DERIVED] The range length is two; applying the bounded-sum inequality yields the displayed factor. Correlation within an episode is allowed because the episode is the unit. Cross-episode shared mutable memory violates the independent-unit premise unless evaluation clusters or otherwise models it. Selecting the policy on the same evaluation set also requires selection-aware analysis.

## Mechanism

### Methodology

[PAPER-REPORTED] LongMemEval provides 500 questions covering extraction, multi-session reasoning, knowledge updates, temporal reasoning and abstention. Histories are delivered session by session; its standard small/medium settings contain approximately 115k and 1.5M tokens. Questions/evidence are human curated, with LLM-simulated, human-edited evidence sessions and distractor histories. Its answer judge is gpt-4o-2024-08-06, with separate retrieval-location labels. [R53.3, §3.1–3.3]

[DERIVED] This protocol separates write-side ingestion from query-time access and supplies inspectable evidence locations. It nevertheless evaluates answers over a constructed history; it does not alone test a fully adaptive external environment whose future observations depend on the agent's own actions. Generated-history realism, evidence placement and judge errors remain part of the measurement model.

[PAPER-REPORTED] MemoryArena instead carries memory across interdependent agentic subtasks in shopping, travel, search and formal reasoning. PS macro-averages passed-subtask fractions. SR uses final constraint satisfaction for shopping/travel and final-subtask correctness for search/reasoning. Table 3 reports heterogeneous outcomes with GPT-5.1-mini: progressive-search SR is 0.06 for long context and 0.24 for Mem0, while shopping SR is 0.01 and 0.00 respectively. Its evaluated external-memory configurations are not universally beneficial. [R53.4, §3.2–4.3, Table 3]

[DERIVED] The comparison supports a task-dependent interface analysis, not an explanation that all gains or failures come from memory alone. Search, action selection, consolidation and model use interact. A result under a named task agent and configuration is not a universal ranking of memory representations. The source's final-success semantics also preclude interpreting every successful reasoning task as an entirely correct derivation trajectory.

[PAPER-REPORTED] STALE adds explicit state-resolution, adversarial false-premise and implicit-action-adaptation probes. Its judge validation covers 240 responses from two target-model groups: overall agreement is 95.83%, with 91.25% for implicit-policy adaptation. Correctness-conditioned attention patterns are described as associations, not causal evidence that attention reweighting is the operative repair mechanism. [R53.5, §3.5, §4.3; Appendix E.3]

[DERIVED] Together, these protocols cover different failure surfaces. Recall benchmarks test access and reading; conflict benchmarks test invalidation and premise resistance; interactive sequences test the coupled memory/action loop; deletion probes test post-revocation exposure or behavior. A single aggregate score cannot substitute for those distinct contracts.

## Algorithm

### Algorithm 53.6 — Offered-task evaluation ledger

[DERIVED] Algorithm 53.6 constructs a bounded evaluation ledger. Inputs are a frozen policy/baseline release, offered-task list, domain outcome predicates, cluster IDs, maximum sessions/actions/tokens, matched environment/seed policy, durable work budget and per-task deadline. Proposed new tests appear only in verification; the procedure defines the accounting required to interpret an executed evaluation.

$$
\begin{aligned}
1.\;& \mathcal L\gets\text{all offered task IDs with pending status};
      \quad\text{freeze policies, judge, splits and outcome predicates}.\\
2.\;& \text{For each task }i\text{ within the fixed list: atomically reserve }c_i\\
   & \text{for setup, both arms, writes/reads, judging, cleanup and recording};\\
   & \text{if infeasible, mark budget-limited for both arms; do not drop }i.\\
3.\;& \text{Initialize paired environments and allowed prior memory identically};\\
   & \text{execute each arm within session/action/token/deadline caps};\\
   & \text{record evidence retention, retrieved IDs, accepted-state versions and effects}.\\
4.\;& \text{On timeout/failure: preserve terminal status and actual work};\\
   & \text{never replace failed trajectories with a successful rerun without separate reporting}.\\
5.\;& \text{Score }b_{it},y_i,\text{ false-memory, stale-action, abstention and deletion endpoints}\\
   & \text{using frozen predicates; log judge disagreements and missing labels}.\\
6.\;& \operatorname{reconcile}(c_i,\text{actual cost});\quad
      \text{persist all write/read/consolidation/storage/repair work}.\\
7.\;& \text{Aggregate known endpoints under Eq. 53.20--53.21 only when defined};\\
   & \text{retain unknown entries and report bounds/unresolved fractions rather than imputed outcomes};\\
   & \text{report clustered/paired uncertainty only under its justified sampling model};\\
   & \text{publish exclusions, missing outcomes and unexecuted tasks explicitly}.
\end{aligned}
$$
(Eq. 53.23)

[MATHEMATICALLY-DERIVED] If $n_u$ offered tasks lack a bounded endpoint $Y_i\in[0,1]$, with known-endpoint sum $s_k$, the full offered-task mean is only partially identified:

$$
\frac{s_k}{N}\le \bar Y\le\frac{s_k+n_u}{N}.
$$
*(Eq. 53.24)*

[MATHEMATICALLY-DERIVED] The lower bound sets unknown endpoints to zero and the upper bound to one. Unexecuted cases remain unknown, not automatically failed. For paired differences use their $[-1,1]$ range; for unknown costs use justified recorded caps or leave the ratio uncertified. An arithmetic mean over completed cases has a different denominator and cannot silently stand in for the offered-task mean.

[DERIVED] A bound requires enforced operator caps, not merely a finite list of tasks. Paired initialization controls prior state and environment; it does not force adaptive observations to be identical after actions diverge. Those trajectories are part of the policy outcome. A replay diagnostic with fixed observations is a separate experiment with a different causal boundary.

## Implementation

[DERIVED] The LongMemEval evaluator is outside reference-stack §4 and is used through the plan's memory-evaluation scope; Hugging Face Transformers/PyTorch backend behavior is inspected separately in §53.5.

[OFFICIAL-DOCUMENTATION] The inspected LongMemEval evaluation implementation maps model aliases to dated judge endpoints and uses category-specific answer rubrics. Its temporal rubric tolerates off-by-one date counts; knowledge-update scoring can accept old information alongside the required update. The source is mutable main, unpinned and unexecuted here. [R53.11, model_zoo; get_anscheck_prompt]

[DERIVED] Those details affect interpretation. Passing that knowledge-update rubric is not a certificate that every stale statement was suppressed, and a tolerated date error may matter for an action deadline. Preserve the official score for comparability while reporting any stricter current-state/action endpoint separately. Never silently redefine a benchmark metric and retain its original name.

[DERIVED] Accounting covers every evaluated arm and the entire retained-memory lifetime. Memory policies need not add model parameters, but extractor/encoder/judge models do. Input/output tokens, inference FLOPs, KV and external-storage capacity, bytes read/written, network replication and invalidation, wall time and throughput must be attributable by stage. Consolidation outside the visible query still belongs to cost.

[DERIVED] Storage occupancy should be integrated over time if retention duration differs; deletion and replay can dominate occasional requests. Energy measurements need device/service boundaries and sampling details. Monetary estimates need dated prices and billable units. No benchmark here supplies a universal conversion from tokens or latency to energy/money, and no such measurements were performed for this manuscript.

## Experimental design

### Reported experiments and negative conditions

[PAPER-REPORTED] LongMemEval's meta-evaluation samples 30 questions per type for two answer models. Table 6 reports average judge agreement of 0.98 and 0.97, with some subgroup values of 0.90. Its representation ablations show that compressed values can lose evidence and that time extraction can erroneously filter needed records. These results require subgroup and source-interface analysis, rather than assuming a judge or memory representation is uniformly reliable. [R53.3, Appendix A.4, Table 6; §5.2; Appendix E.4]

[DERIVED] Source-reported contrasts are not automatically causal component effects. Replacing a memory representation can change context length, information exposure, query formulation and number of calls simultaneously. A matched comparison must name which dimensions are held fixed. Oracle evidence access changes the input distribution and often makes the task easier; it identifies a diagnostic boundary rather than a deployable upper bound.

[DERIVED] False-memory and interference evaluation should distinguish source errors, extraction errors, stale-state errors and cross-tenant contamination. Adaptation must be measured on changed-state tasks and retention on still-valid tasks. A memory system can improve one while damaging the other. The scientific question is the joint tradeoff under the offered workload, not the highest recall score after dropping hard cases.

## Observations

**What the paper claims.** [PAPER-REPORTED] MemoryArena evaluates memory within dependent action sequences. [R53.4, §3]

**What the evidence shows.** [PAPER-REPORTED] Its gains vary by domain and configuration. [R53.4, Table 3]

**What we infer.** [DERIVED] Long-horizon evaluation needs task, state, action and lifecycle-cost endpoints with all offered tasks retained.

**What remains unknown.** [NOT-DISCLOSED] These studies do not establish a universally optimal memory policy or a production privacy/consistency guarantee.

## Failure modes

[DERIVED] Success-only denominators hide failures. Shared mutable memory leaks evaluation information across episodes. A fixed-history test is mislabeled adaptive execution. A judge accepts a correct update plus an unsafe stale instruction. Repeated seeds are treated as independent users. Uncharged consolidation makes a costly policy appear cheap. Later corrections are scored using future evidence unavailable at the original decision.

## Siblings

[DERIVED] Static recall, implicit-conflict probing, interactive dependent tasks and deletion audits measure different properties. Controlled replay isolates selected interfaces while changing adaptive behavior. Production telemetry offers realistic workload evidence but introduces selection, missing-label and confounding issues covered in Chapter 47.

```figure
{
  "id": "fig-53.20",
  "kind": "compare",
  "title": "Evaluation modes identify different failures",
  "caption": "Use the mode matching the claim and report its missing interfaces rather than pooling unlike scores.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-53.23",
  "alt": "Use the mode matching the claim and report its missing interfaces rather than pooling unlike scores. Comparison of semantic contracts, not a feature ranking.",
  "spec": {
    "axis": "Representation and guarantee boundary",
    "columns": [
      {
        "id": "a",
        "label": "Fixed-history recall"
      },
      {
        "id": "b",
        "label": "Dependent action sequence"
      },
      {
        "id": "c",
        "label": "Post-revocation audit"
      }
    ],
    "rows": [
      {
        "dimension": "Identifies",
        "values": {
          "a": "retention / retrieval / reading",
          "b": "coupled state and action outcome",
          "c": "exposure / behavioral residue"
        }
      },
      {
        "dimension": "Does not establish",
        "values": {
          "a": "adaptive environment control",
          "b": "absence of every intermediate error",
          "c": "zero risk for arbitrary attacks"
        }
      },
      {
        "dimension": "Cost boundary",
        "values": {
          "a": "ingest + query + judging",
          "b": "all actions / writes / recovery",
          "c": "cleanup + retained copies + probes"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The improvement path adds state revision, action trajectories and lifetime cost to recall evaluation. The unresolved question is whether learned memory policies transfer across changing dependency structures without increasing false memories or deletion debt. Settling evidence needs held-out domains, independent episode clusters, explicit state interventions, matched lifetime budgets and calibrated failure/abstention endpoints.

## Limitations

[DERIVED] Benchmark histories and environments cannot cover arbitrary future behavior. Finite probes cannot prove absence of extraction; final-answer correctness cannot prove every intermediate step; a utility/cost ratio cannot replace its raw outcomes. Equation 53.22 depends on its sampling and bounded-utility premises, not on model size or research prestige.

## Reproducibility

[UNVERIFIED] No long-horizon evaluation was executed. Reproduction requires frozen releases, exact histories/environments, task/cluster IDs, initialization, all offered outcomes, source/state/action traces, judge rubrics, caps and lifecycle cost logs. Proposed evaluations are in [verification](verification.md).

## References

[DERIVED] [R53.3, LongMemEval v2](https://arxiv.org/html/2410.10813v2), §3–5 and Appendix A.4; [R53.4, MemoryArena v1](https://arxiv.org/html/2602.16313v1), §3–4; [R53.5, STALE v1](https://arxiv.org/html/2605.06527v1), Appendix E.3; [R53.11, evaluation source](https://raw.githubusercontent.com/xiaowu0162/LongMemEval/main/src/evaluation/evaluate_qa.py). See [references](references.md).
