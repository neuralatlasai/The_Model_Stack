---
id: "ms.section.38.6"
entity_type: "section"
title: "Evaluation and economics"
short_title: "Evaluation and economics"
volume: 2
part: 7
chapter: 38
section: 38.6
slug: "38-6-evaluation-and-economics"
parent: "ms.chapter.38"
prev_sibling: "ms.section.38.5"
next_sibling: "ms.verification.38"
children: []
prerequisites: ["ms.chapter.6", "ms.chapter.32", "ms.chapter.35", "ms.chapter.37"]
downstream: ["ms.chapter.39", "ms.chapter.47", "ms.chapter.61", "ms.chapter.63", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["inference", "evaluation", "assurance"], "mechanism": ["search", "verification", "adaptive_compute"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2300
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 38.6 — Evaluation and economics

## Scope

[DERIVED] Evaluation and economics determine whether an inference policy earns its additional resources. This section owns fixed-token, FLOP, elapsed-time and monetary comparisons; verifier/evaluator cost; answer length; easy/hard task mixtures; routing; uncertainty and amortization. The deliverable is the chapter artifact: a quality-versus-inference-budget frontier with every point linked to immutable attempts, frozen policies and independent outcomes. A point without a resource boundary is an incomplete scientific claim.

[DERIVED] The frontier is conditional on workload, model, hardware, decoder, evaluator and service regime. It is not one universal curve for a model family. Closed-book mathematics, retrieval-heavy research and executable code tasks have different information and checking costs. A meaningful comparison keeps those conditions explicit rather than pooling them into a scalar score without a weighting rule.

## Why this exists

[DERIVED] A method can reduce reasoning tokens while increasing answer length, verifier work or preparation cost. Parallel search can improve median latency while degrading p99 under load. A router can improve average quality by spending much more on a small hard subset. Oracle coverage can rise while selected-answer accuracy falls. Each is a real possible outcome that a one-number “efficiency” claim can hide.

[DERIVED] Evaluation itself consumes compute and can influence development. Repeatedly checking a test set turns it into a selection channel, even if each check returns only a score or binary result. The final frontier must therefore separate development selection from one frozen independent audit. Label unknowns, timeouts and missing records are part of the result, not inconvenient rows to delete.

## Intuition

[DERIVED] A frontier point is a complete policy, not merely a token limit. For example, “eight candidates” must specify generation configuration, per-candidate cap, parsing, selection, verification and timeout behavior. Increasing a budget can change the actual distribution of candidates and the selector's exposure to extreme proxy scores. Connecting two points by a line does not prove an executable intermediate policy exists; a randomized mixture is one explicit way to interpolate average cost and quality.

[DERIVED] Separate quality, work and time. Quality is measured by a task-appropriate independent evaluator. Work is the sum of consumed operations. Time includes queues and dependencies. Monetary cost follows an explicitly dated tariff or measured internal cost model. A token count can be one axis, while the other coordinates remain annotations or hard constraints.


```figure
{
  "id": "fig-38.31",
  "kind": "diagram",
  "title": "A frontier point has a full boundary",
  "caption": "Preparation and development precede a frozen policy; deployment attempts and independent evaluation contribute separate cost records.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.26",
  "alt": "Preparation and development precede a frozen policy; deployment attempts and independent evaluation contribute separate cost records. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Development tasks"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Offline labels / features"
      },
      {
        "id": "n2",
        "kind": "model",
        "label": "Frozen inference policy"
      },
      {
        "id": "n3",
        "kind": "memory",
        "label": "All attempt costs"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Independent evaluator"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Quality-cost frontier"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2",
        "label": "prepare"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "deploy"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "audit"
      },
      {
        "from": "n4",
        "to": "n5",
        "label": "quality"
      },
      {
        "from": "n3",
        "to": "n5",
        "label": "cost"
      }
    ]
  }
}
```


## Formulation

> **Definition — Resource-conditioned frontier.** The nondominated set of frozen inference policies under a declared task measure, quality metric, resource coordinates and evaluation protocol, with uncertainty and missingness retained.

[MATHEMATICALLY-DERIVED] For policies $\mu$, define expected quality $U(\mu)$, cost vector $\mathbf C(\mu)$ and latency distribution $L_\mu$. A scalar-budget frontier can be written

$$
F(B)=\sup_{\mu\in\mathcal A}\{U(\mu):E[C_1(\mu)]\le B,\ C_j(\mu)\le b_j\text{ under declared constraint types}\}.
$$
*(Eq. 38.26)*

The admissible set $\mathcal A$ includes information access, decoding, verifier and hard-cap rules. Say whether each extra constraint is expected, per-query or a tail risk. PolicyA dominates policyB only if it is no worse in all declared dimensions and strictly better in at least one, under the stated uncertainty criterion. A noisy point estimate is not a proof of population dominance.

[MATHEMATICALLY-DERIVED] If methodA incurs preparation $F_A$, methodB preparation $F_B$, and stationary deployment costs $c_A<c_B$ at acceptable matched quality, then

$$
C_A(Q)-C_B(Q)=F_A-F_B-Q(c_B-c_A),\qquad
Q^*=\frac{F_A-F_B}{c_B-c_A}.
$$
*(Eq. 38.27)*

When $F_A\le F_B$, A already has no larger modeled total cost for $Q\ge0$. If $c_A\ge c_B$ with larger preparation, there is no positive cost break-even under this model. The quality condition is essential: a cheaper method at lower utility is a tradeoff, not automatic economic dominance.


```figure
{
  "id": "fig-38.32",
  "kind": "calculator",
  "title": "Preparation must be amortized",
  "caption": "Eq.38.27 uses a positive deployment saving and nonnegative preparation increment. Units must be the same declared monetary or work unit.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.27",
  "alt": "Eq.38.27 uses a positive deployment saving and nonnegative preparation increment. Units must be the same declared monetary or work unit. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "38.27",
    "tex": "Q^*=\\Delta F/\\Delta c",
    "inputs": [
      {
        "symbol": "F",
        "label": "Extra preparation cost",
        "default": 1000,
        "min": 0,
        "max": 10000,
        "format": "fixed3"
      },
      {
        "symbol": "saving",
        "label": "Deployment saving per query",
        "default": 0.1,
        "min": 0.001,
        "max": 10,
        "format": "fixed3"
      },
      {
        "symbol": "Q",
        "label": "Deployment queries",
        "default": 10000,
        "min": 100,
        "max": 100000,
        "format": "integer",
        "options": [
          100,
          1000,
          10000,
          100000
        ]
      }
    ],
    "outputs": [
      {
        "symbol": "break",
        "label": "Break-even queries",
        "formula": "F/saving",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "net",
        "label": "Total cost saving",
        "formula": "Q*saving-F",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Small deployment",
      "variables": {
        "Q": 100
      }
    },
    {
      "anchor": "mechanism",
      "label": "Break-even region",
      "variables": {
        "Q": 10000
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Smaller actual saving",
      "variables": {
        "saving": 0.01
      }
    }
  ]
}
```


[MATHEMATICALLY-DERIVED] With easy-task share $\alpha$, quality and cost average as

$$
U_\alpha=\alpha U_E+(1-\alpha)U_H,\qquad
C_\alpha=\alpha C_E+(1-\alpha)C_H.
$$
*(Eq. 38.28)*

Changing $\alpha$ can reverse method rankings. A deployment router trained under one mixture requires a new feasibility and quality assessment under another. Reporting only a pooled mean can conceal failure on the hard subset or unequal resource use across groups.

## Mechanism

### Methodology

[DERIVED] **Fixed tokens.** Include prompt prefills, intermediate reasoning, all sampled candidates and final answers under a declared tokenizer. Distinguish generated tokens from teacher-forced scoring tokens. If the budget only constrains generated tokens, separately disclose verifier and retrieval cost. Charge partial and discarded output. A hard aggregate cap requires reservations before candidate generation; a retrospective mean token count is a different protocol.

[DERIVED] **Fixed FLOPs or accelerator work.** Count all model components, attention context effects, flow/refiner evaluations and evaluator work. A parameter-count approximation can be useful when explicitly labeled, but it does not capture memory bandwidth or kernel efficiency. Distinguish a theoretical operation estimate from measured hardware counters. Padding, batching, prefill reuse and sparse execution can change cost at equal logical token counts.

[DERIVED] **Fixed time.** Measure arrival-to-return latency, including queueing and cancellations. Report concurrency, arrival process, workload distribution, hardware, precision, serving version and cache policy. A single isolated-request measurement is not a p99 result under sustained load. Parallel execution can reduce span while increasing occupancy and delaying other requests. Deadline-denied work and incomplete responses affect both quality and latency denominators.

[DERIVED] **Fixed monetary cost.** Use a dated tariff or declared internal accounting model with input, output, cache, tool and verifier charges. Do not substitute current prices for the prices attached to a reported historical experiment. A provider's billed token categories need not reveal internal FLOPs. For internal systems, separate accelerator allocation, utilization, storage and engineering/preparation assumptions rather than presenting an invented universal cost per token.


```figure
{
  "id": "fig-38.33",
  "kind": "chart",
  "title": "Workload mix can reverse a ranking",
  "caption": "Eq.38.28 assumesA easy/hard quality0.95/0.40 andB0.85/0.70. These are analytical utilities, not paper outcomes.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.28",
  "alt": "Eq.38.28 assumesA easy/hard quality0.95/0.40 andB0.85/0.70. These are analytical utilities, not paper outcomes. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "easy-task share",
      "domain": [
        0,
        1
      ]
    },
    "y": {
      "label": "mean quality"
    },
    "series": [
      {
        "id": "n0",
        "label": "Policy A",
        "formula": "0.95*x+0.4*(1-x)",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 2
        },
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "Policy B",
        "formula": "0.85*x+0.7*(1-x)",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 2
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0.75,
        "y": 0.8125,
        "label": "Ranking reverses at75% easy tasks"
      }
    ]
  }
}
```


[DERIVED] **Verifier and evaluator boundaries.** The deployment verifier affects the returned answer and belongs inside inference cost. The independent evaluator measures the experiment and belongs in research cost; report both and a combined total when assessing preparation amortization. Oracle labels for training a router are also preparation cost. A reference answer used to evaluate candidate coverage cannot secretly become a deployment selector.

[DERIVED] **Answer length and task mixtures.** A latent or capped method may move information from a reasoning segment into the final answer. Measure both. Fixed maximum lengths can create different censoring rates for easy and hard tasks; a pooled mean can favor a policy that abandons long hard cases. Report status-conditioned counts and unconditional quality over the intended task population. Any exclusion must identify the resulting estimand.

[MATHEMATICALLY-DERIVED] **Coverage estimation.** For complete fixed-$n$ iid candidate samples with all correctness labels known, let $c$ be correct and $1\le k\le n$. The standard estimator is

$$
\widehat{\mathrm{pass@}k}=1-\frac{{n-c\choose k}}{{n\choose k}},\qquad
{n-c\choose k}=0\text{ when }n-c<k.
$$
*(Eq. 38.29)*

Its unbiasedness follows by averaging the no-correct event over all $k$-subsets of a complete iid sample. Budget-stopped $n$ can depend on response lengths and correctness; substituting that random $n$ need not estimate the original fixed-$k$ iid coverage unbiasedly. Unknown evaluator labels cannot silently count as failures or disappear. Report the budget-defined empirical event, known-label bounds or NOT-ESTIMABLE as distinct outputs.


```figure
{
  "id": "fig-38.34",
  "kind": "memory-stack",
  "title": "Unknown audit outcomes occupy the denominator",
  "caption": "A100-task analytical audit contains70 known successes,20 known failures and10 unknown labels. The unknown segment gives quality bounds0.70–0.80; it remains an unknown status, never an observed success/failure.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.29",
  "alt": "A100-task stacked audit bar has70 successes,20 failures and10 unknown outcomes. Keeping all100 tasks gives lower quality0.70 and upper quality0.80, without labeling the unknown tasks.",
  "spec": {
    "format": "integer",
    "variables": {
      "C": 70,
      "F": 20,
      "U": 10,
      "N": 100
    },
    "bars": [
      {
        "label": "All final audit tasks",
        "segments": [
          {
            "label": "Known successes",
            "formula": "C",
            "kind": "metric"
          },
          {
            "label": "Known failures",
            "formula": "F",
            "kind": "process"
          },
          {
            "label": "Unknown labels",
            "formula": "U",
            "kind": "dependency"
          }
        ]
      }
    ],
    "budget": {
      "label": "Fixed task denominator",
      "formula": "N"
    }
  },
  "anchor": "formulation"
}
```


[DERIVED] A same-pass@$k$ comparison does not establish equal solution diversity. The statistic depends on total correct probability, not on how correct mass is distributed among proof or program families. A finite absence of success does not prove zero base-model support or novel capability. Evaluate diversity with a declared equivalence relation and matched count/length controls, and keep that construct separate from selected-answer quality.

## Algorithm

**Algorithm 38.7 — Frozen frontier audit with separate estimands.** Inputs are finite development policies $\mathcal P$, lineage-separated development tasks $D$ and final audit tasks $A$, frozen selection/metric rules, finite call deadlines and a complete reservation budget for both collection and independent evaluation. Outputs are selected policy records, audit statuses, quality/cost statistics and admissible coverage estimates. No final audit feedback returns to development.

$$
\begin{aligned}
1.\;&D=\varnothing\lor A=\varnothing\lor\mathcal P=\varnothing\Rightarrow\textbf{return }\mathrm{NOT\_ESTIMABLE};\quad
 H_D,H_A\gets\varnothing.\\
2.\;&\textbf{for }\mu\in\mathcal P:\ \textbf{for }x\in D:\
 g\gets\mathrm{ReserveOrRecordDenied}(\mu,x);\quad
 g=\mathrm{DENIED}\Rightarrow[H_D\gets H_D\cup\{\mathrm{DENIED}(\mu,x)\};\ \textbf{continue}];\quad
 H_D\gets H_D\cup\mathrm{CollectAndEvaluateCapped}(\mu,x).\\
3.\;&D_{\rm usable}\gets\{h\in H_D:\mathrm{CompleteKnownMetric}(h)\};\quad
 D_{\rm usable}=\varnothing\Rightarrow\textbf{return }(\mathrm{NOT\_ESTIMABLE},H_D).\\
4.\;&\mathcal P^*\gets\mathrm{SelectFrozen}(H_D);\quad
 \mathcal P^*=\varnothing\Rightarrow\textbf{return }(\mathrm{ABSTAIN},H_D);\quad
 v^*\gets\mathrm{Freeze}(\mathcal P^*,\mathcal M,V_{\rm audit}).\\
5.\;&\textbf{for }\mu\in\mathcal P^*:\ \textbf{for }x\in A:\
 H_A\gets H_A\cup\mathrm{ReservedAuditOnceCapped}(v^*,\mu,x);\quad
 \mathrm{RetainAllStatusAndCost}(H_A).\\
6.\;&\textbf{for each }(\mu,x):\quad
 \mathrm{CompleteFixedNIID}\land\mathrm{AllLabelsKnown}\Rightarrow
 \hat p_k\gets\mathrm{Eq}_{38.29}(n,c,k);\\
7.\;&\quad\neg(\mathrm{CompleteFixedNIID}\land\mathrm{AllLabelsKnown})\Rightarrow
 \hat p_k\gets\mathrm{NOT\_ESTIMABLE};\quad
 \mathrm{ReportBudgetEventAndKnownLabelBounds}(H_A).\\
8.\;&\mathrm{AllAuditMetricsUnknown}\Rightarrow\textbf{return }(\mathrm{NOT\_ESTIMABLE},H_D,H_A);\quad
 \textbf{return }(\mathrm{FrontierWithMissingnessAndUncertainty}(H_A),H_D,H_A).
\end{aligned}
$$

[DERIVED] Reservation failure records DENIED and skips the dependent call. Evaluation allowance is reserved before generation, so an expensive candidate cannot consume the entire budget and leave its required audit unpaid. Each collection has finite task/candidate counts and enforced deadlines. An unknown metric remains unknown. For binary outcomes, reporting unconditional lower/upper quality bounds treats unknowns as0/1 only for bounding, explicitly labeled as bounds rather than observed labels. The final evaluation is not repeated to repair a disappointing selected policy.

## Implementation

[DERIVED] Use one immutable experiment ID connecting offline preparation, development selection, deployment attempts and final audit. Each record identifies requested budgets, consumed resources, reservation denials, answer length, verifier work, independent evaluator work and terminal status. A cached evaluator result needs candidate bytes, fixtures, evaluator version and environment identity in its key. Reusing an answer label after a fixture change corrupts both quality and cost accounting.

[DERIVED] Bootstrap over tasks for paired comparisons, retaining all candidates and arms for each sampled task. Candidate-level resampling alone understates uncertainty when the task is the experimental unit. Distinguish training-seed variance, sampling variance and task uncertainty. A mean±standard deviation is not automatically a confidence interval. Multiple budget and method comparisons require a declared family or an explicitly exploratory interpretation. Tail quantiles need enough requests and their own uncertainty assessment.


```figure
{
  "id": "fig-38.35",
  "kind": "chart",
  "title": "Similar high-k coverage can hide different pass1",
  "caption": "R38.6 Table2:GRPO/RFT mean pass1=0.634/0.571 and pass32=0.969/0.972. Reported95% intervals are pass1[.598,.669]/[.538,.605],pass32[.951,.988]/[.955,.990]. High-k overlap does not prove equivalence, diversity retention or new capability.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": "R38.6",
  "alt": "Grouped bars show GRPO versus RFT at pass1:0.634 versus0.571, and pass32:0.969 versus0.972. The reported intervals overlap at pass32; these are source-specific three-seed summaries, not a matched-all-methods universal result.",
  "spec": {
    "type": "bar",
    "categories": [
      "pass1",
      "pass32"
    ],
    "x": {
      "label": "oracle coverage statistic"
    },
    "y": {
      "label": "reported probability",
      "domain": [
        0,
        1
      ],
      "format": "raw"
    },
    "series": [
      {
        "id": "n0",
        "label": "GRPO",
        "values": [
          0.634,
          0.969
        ],
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "RFT",
        "values": [
          0.571,
          0.972
        ]
      }
    ]
  },
  "context": {
    "hardware": "NOT-DISCLOSED",
    "model": "Qwen2.5-1.5B-Instruct",
    "precision": "NOT-DISCLOSED",
    "sequenceLength": "max response1024",
    "ioDistribution": "100 held-out GSM8K tasks;32 candidates; temperature1; top-p1",
    "concurrency": "NOT-DISCLOSED",
    "runtimeVersion": "NOT-DISCLOSED",
    "measurementBoundary": "Source Table2 three-seed summary; problem bootstrap and random-effects aggregation"
  }
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] The October2026 pass@$k$ study provides a bounded example of construct separation. [R38.6](references.md)

| Field | Inspected protocol: §§2–5 |
|---|---|
| Model/data | Qwen2.5-1.5B-Instruct;1500 filtered GSM8K training;100 held-out problems |
| Arms/replication | GRPO, shortest-correct RFT, RFT+KL; three seeds,187steps each |
| Evaluation | 32samples/problem; temperature1, top-p1, no top-k; completion cap1024; correctness checker |
| Uncertainty | Problem bootstrap; three-seed random-effects summaries; some raw-rollout analyses limited to two intact seeds |
| Findings | GRPO pass1=0.634 versus RFT0.571; pass32=0.969 versus0.972 with overlapping intervals; entropy directions differ |
| Gaps | Complete hardware/precision/optimizer/cost boundary and all raw rollouts: NOT-DISCLOSED or unavailable in inspected evidence |

[DERIVED] The result is neither a universal entropy law nor proof that two policies have identical high-$k$ coverage. The source explicitly records contrary trends in other workloads and limited detection power. It illustrates why a selected-answer frontier should retain construct-specific metrics instead of treating pass@$k$ as a complete account of diversity or capability retention.

## Observations

**What the paper claims.** [PAPER-REPORTED] Existing pass@$k$ reporting can miss distinct changes in output diversity and capability retention. [R38.6](references.md)

**What the evidence shows.** [PAPER-REPORTED] In the inspected small-model arithmetic protocol, high-$k$ estimates overlap while other output-distribution measures move differently. The source bounds this finding by data, scale and missing raw records.

**What we infer.** [DERIVED] A credible inference frontier needs selected-answer quality, oracle coverage, diversity, statuses and full cost as separate fields.

**What remains unknown.** [UNVERIFIED] No cited study establishes one universally optimal inference policy or a stable economic ranking across deployment mixtures, tariffs and service loads.

## Failure modes

[DERIVED] Counting only selected candidates understates sampling cost. Omitting evaluator calls can make a costly router look free. Comparing an isolated latency against a loaded service quantile confounds scheduling. Dropping timeouts improves apparent quality while changing the task measure. A stochastic expected-budget mixture can satisfy its mean and violate an individual deadline. Treating a missing audit label as incorrect can hide evaluator failure; treating it as excluded can hide task failure. Both require explicit alternative estimands or bounds.


```figure
{
  "id": "fig-38.36",
  "kind": "compare",
  "title": "Three distinct audit outputs",
  "caption": "A budget-defined success event and an unknown-label bound cannot silently become a fixed-n iid estimator.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.29",
  "alt": "A budget-defined success event and an unknown-label bound cannot silently become a fixed-n iid estimator. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Fixed-n iid coverage"
      },
      {
        "id": "n1",
        "label": "Budget-defined event"
      },
      {
        "id": "n2",
        "label": "Unknown-label bound"
      }
    ],
    "rows": [
      {
        "dimension": "Admission",
        "values": {
          "n0": "Complete n, all labels",
          "n1": "Declared budget policy",
          "n2": "Known denominator/statuses"
        }
      },
      {
        "dimension": "Output",
        "values": {
          "n0": "Eq.38.29 estimator",
          "n1": "Actual policy event",
          "n2": "Lower / upper quality"
        }
      },
      {
        "dimension": "Does not establish",
        "values": {
          "n0": "Solution diversity",
          "n1": "Unbiased iid passk",
          "n2": "Observed unknown outcomes"
        }
      }
    ]
  }
}
```


## Siblings

[DERIVED] Chapter06 owns basic resource accounting; Chapters06 and61 own evaluation validity; Chapter32 owns feedback and verifier validity. Chapter35 owns pass@$k$ and capability boundaries. The chapter's earlier sections specify the policies whose frontier is measured, while Chapter39 studies amortizing expensive inference through distillation.

## Extensions

### Improvements

[DERIVED] Report several budget axes with common task records, rather than pretending one conversion fits every policy. Add preparation-amortization curves across deployment volumes and task mixtures. Preserve budget-stopped and unknown outcomes, and publish conditional metrics only beside their unconditional denominators. Prefer a development-frozen policy family over repeated tuning on the final audit. A future service study can add controlled arrival processes and tail objectives, with its full proposed design specified in verification.md.

## Limitations

[DERIVED] A frontier remains conditional on its evaluator and task measure. Compute counters can be unavailable for hosted services, and cost models can become stale. Statistical uncertainty does not capture all contamination or specification error. The chapter's analytical calculators are declared models and counterexamples, not benchmark measurements or executed GPU experiments.

## Reproducibility

[DERIVED] Release a machine-readable frontier table, operation ledger, split lineage, frozen policy/configuration hashes, raw evaluator statuses, cost boundary, cache rules, uncertainty procedure and development-selection history. Mark a point incomplete when its measured resources or denominator cannot be reconstructed. Preserve excluded outcomes with reasons so an independent reader can recompute alternative legitimate estimands.

## References

[R38.6](references.md) §§2–5 supplies the bounded construct-validity study. [R38.1](references.md) AppendixE documents offline oracle cost; [R38.3](references.md) §5 supplies workload-dependent serving evidence; [R38.4](references.md) AppendixE separates latent and answer costs. Equations38.26–38.29 and Algorithm38.7 define the book-derived artifact contract.
