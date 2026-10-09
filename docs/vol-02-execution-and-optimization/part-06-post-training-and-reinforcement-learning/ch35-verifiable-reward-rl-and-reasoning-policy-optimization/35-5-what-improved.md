---
id: "ms.section.35.5"
entity_type: "section"
title: "What improved"
short_title: "What improved"
volume: 2
part: 6
chapter: 35
section: 35.5
slug: "35-5-what-improved"
parent: "ms.chapter.35"
prev_sibling: "ms.section.35.4"
next_sibling: "ms.section.35.6"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34"]
downstream: ["ms.chapter.36", "ms.chapter.38", "ms.chapter.39", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["reinforcement_learning", "verification", "policy_optimization"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
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

# 35.5 — What improved

## Scope

[DERIVED] Determine what improved after post-training by separating single-sample correctness, sampling coverage, verifier-selected success, solution diversity, distributional generalization and evidence of new capability. The section owns the evaluation distinction; Chapter38 owns inference-time selection/search algorithms. A valid result names the policy, task distribution, decoding, candidate budget, evaluator and uncertainty. It does not turn a pass@k increase into a claim of more diverse reasoning or a new mathematical capability.

## Why this exists

[DERIVED] A policy can concentrate probability on one known correct solution and improve pass@1. It can spread probability across several incorrect answers and increase token entropy. It can preserve a rare correct answer while changing all surface wording. These changes are not interchangeable. A benchmark average can hide improvements on easy prompts and regressions on difficult ones. A finite sample of an initial policy can miss a solution that was always in its support.

[DERIVED] The bottleneck is the interpretation of a measured metric, not a shortage of possible metrics. Define the claim first. If the claim is service reliability, include the selector and its errors. If it is coverage, use a stated sampling budget. If it is diversity, measure distinct solution families under a declared equivalence relation. If it is generalization, separate task lineage and distribution shift. Each requires different evidence.

## Intuition

[MATHEMATICALLY-DERIVED] Pass@k asks whether at least one of $k$ attempts is correct. It ignores whether the correct attempts use one strategy or many. Replacing all correct traces by copies of one trace leaves correctness indicators and pass@k unchanged. Replacing incorrect outputs by many superficially different errors can raise textual diversity without improving coverage. A diversity claim therefore needs information beyond binary correctness.

[DERIVED] Likewise, an oracle evaluator that recognizes the correct candidate is not a deployable selector. A real verifier can reject a correct candidate or select an accepted error. Report oracle coverage and end-to-end selected accuracy separately. The difference is operationally important precisely when best-of-many sampling makes rare checker errors more likely to appear.


```figure
{
  "id": "fig-35.25",
  "kind": "diagram",
  "title": "One candidate set, several questions",
  "caption": "Correctness indicators produce coverage; solution-family labels produce diversity; a selector adds a separate decision rule.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "Correctness indicators produce coverage; solution-family labels produce diversity; a selector adds a separate decision rule. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "tensor",
        "label": "Frozen candidates"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Independent correctness"
      },
      {
        "id": "n2",
        "kind": "metric",
        "label": "Pass@k coverage"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Solution-family map"
      },
      {
        "id": "n4",
        "kind": "metric",
        "label": "Diversity"
      },
      {
        "id": "n5",
        "kind": "process",
        "label": "Deployable selector"
      },
      {
        "id": "n6",
        "kind": "metric",
        "label": "Selected accuracy"
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
        "from": "n0",
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4"
      },
      {
        "from": "n0",
        "to": "n5"
      },
      {
        "from": "n5",
        "to": "n6"
      },
      {
        "from": "n1",
        "to": "n6",
        "label": "audit"
      }
    ]
  }
}
```


## Formulation

[MATHEMATICALLY-DERIVED] For a fixed prompt with iid attempts and per-attempt correctness probability $p$,

$$
{\rm pass}@k=1-(1-p)^k.
$$
*(Eq. 35.20)*

where independence, identical decoding and a fixed correctness definition are required. A shared latent failure mode produces correlated attempts and invalidates this simple product.

[MATHEMATICALLY-DERIVED] Given a fixed, prespecified number $n$ of iid sampled attempts, with all correctness labels known, of which $c$ are correct, the conventional unbiased estimator for $1\le k\le n$ is

$$
\widehat{{\rm pass}@k}
=1-\frac{\binom{n-c}{k}}{\binom nk}.
$$
*(Eq. 35.21)*

where the numerator is zero if $n-c<k$; the estimator is not defined for $k>n$.

[DERIVED] To derive it, choose a uniformly random subset of $k$ indices from the $n$ samples. Conditional on the observed indicators, the probability that all selected indices are incorrect is the hypergeometric ratio. Unconditionally, those selected iid attempts all fail with probability $(1-p)^k$. Taking expectations establishes unbiasedness under the stated sampling model. This is not a reason to treat the $k$ subsets as independent experimental replications. If collection stops at a token budget and the realized sample size depends on response lengths or termination, substituting that random size into this formula does not generally preserve unbiasedness for the original iid pass@k. Complete fixed-count collection and budget-stopped service evaluation are distinct estimands.


```figure
{
  "id": "fig-35.26",
  "kind": "calculator",
  "title": "Coverage from iid success",
  "caption": "Eq.35.20 computes coverage for integer candidate budgets. It does not count distinct solution families.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.20",
  "alt": "Eq.35.20 computes coverage for integer candidate budgets. It does not count distinct solution families. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "35.20",
    "tex": "P_k=1-(1-p)^k",
    "inputs": [
      {
        "symbol": "p",
        "label": "Per-attempt correctness",
        "default": 0.1,
        "min": 0.001,
        "max": 0.999,
        "format": "raw"
      },
      {
        "symbol": "k",
        "label": "Candidates",
        "default": 8,
        "min": 1,
        "max": 64,
        "format": "integer",
        "options": [
          1,
          2,
          4,
          8,
          16,
          32,
          64
        ]
      }
    ],
    "outputs": [
      {
        "symbol": "cover",
        "label": "Any-success probability",
        "formula": "1-(1-p)^k",
        "format": "raw",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "One attempt",
      "variables": {
        "k": 1
      }
    },
    {
      "anchor": "mechanism",
      "label": "Eight attempts",
      "variables": {
        "k": 8
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Many attempts",
      "variables": {
        "k": 32
      }
    }
  ]
}
```


## Mechanism

### Methodology

[DERIVED] Evaluate the same prompt identities before and after training. Use a fixed decoding policy and separately report any deployment decoding change. Store all candidate texts, token counts, termination states and correctness labels. Freeze checkpoint selection on a disjoint dev set, then evaluate the test set once under the committed analysis. A metric used to choose a checkpoint is development feedback even if it has a familiar benchmark name.

[MATHEMATICALLY-DERIVED] A mixture over prompt-specific success probabilities gives

$$
\mathbb E_x[{\rm pass}@k_x]
=1-\mathbb E_x[(1-p_x)^k].
$$
*(Eq. 35.22)*

where prompt weights are part of the estimand. For integer $k\ge2$, convexity gives $\mathbb E[(1-p_x)^k]\ge(1-\mathbb E[p_x])^k$. Therefore applying Eq. 35.20 to aggregate pass@1 generally overestimates average prompt coverage.

[DERIVED] The gap is meaningful: a system that solves half the prompts always and never solves the other half has pass@1 one half and pass@k one half for every finite $k$. A system with success probability one half on every prompt has the same pass@1 but pass@k approaching one. Report per-prompt performance or difficulty slices so this distinction remains visible.

[MATHEMATICALLY-DERIVED] Define a declared solution-family variable $Z=\phi(x,y)$, correctness $C$ and textual output $Y$. If $Z$ is a deterministic function of $Y$,

$$
H(Y)=H(Z)+H(Y\mid Z).
$$
*(Eq. 35.23)*

where the entropy is taken under a fixed prompt/policy distribution. Surface paraphrases can increase $H(Y\mid Z)$ without changing strategy entropy $H(Z)$.

[DERIVED] A solution-family map may classify algorithms, proof structures, tool-use plans or canonical programs. It must be fixed independently of the comparison where possible, tested for labeling consistency and accompanied by examples of merged and separated families. Learned clustering introduces estimator uncertainty; human labels introduce rubric disagreement. Neither is automatically a ground-truth measure of reasoning.

[DERIVED] Report correct-only diversity with a controlled number of correct examples or a count-sensitive estimator. Otherwise the better policy supplies more correct samples and appears more diverse merely because more items were observed. Control response length for lexical n-gram metrics, because longer responses offer more opportunities for distinct substrings. Incorrect-answer diversity can be useful as an error diagnostic, but it is not a positive capability metric by itself.


```figure
{
  "id": "fig-35.27",
  "kind": "chart",
  "title": "Same average pass1, different coverage",
  "caption": "Eq.35.22 contrasts uniform success0.5 with half always-correct/half always-failing prompts.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.22",
  "alt": "Eq.35.22 contrasts uniform success0.5 with half always-correct/half always-failing prompts. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "candidate budget",
      "domain": [
        1,
        32
      ]
    },
    "y": {
      "label": "average prompt coverage"
    },
    "series": [
      {
        "id": "n0",
        "label": "Every prompt p0.5",
        "formula": "1-0.5^x",
        "sample": {
          "from": 1,
          "to": 32,
          "count": 32
        },
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "Half solved, half unsolved",
        "formula": "0.5",
        "sample": {
          "from": 1,
          "to": 32,
          "count": 32
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 0.5,
        "label": "Same mean pass1"
      },
      {
        "x": 32,
        "y": 0.5,
        "label": "Heterogeneous unsolved half remains"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] Let a hard per-query generated-token budget be $T$ and candidate cap $L_{\max}$. Pre-reserving full candidate allowances admits at most

$$
k_{\max}=\left\lfloor\frac{T}{L_{\max}}\right\rfloor.
$$
*(Eq. 35.24)*

where this conservative guarantee excludes separately counted prompt prefill and verifier work.

[DERIVED] If unused reservation is released, the realized number of candidates can be larger for short responses, but it becomes length dependent. Comparing fixed-$k$ coverage and fixed-token coverage then answers different questions. A response-length reduction can improve service coverage under fixed tokens even without changing fixed-$k$ accuracy. Report both, together with the actual length and timeout distributions.

[DERIVED] Generalization requires a task construction boundary: exact duplicates, paraphrases, common source problems, solution templates and teacher-generated derivatives can cross a split without identical text. Deduplicate at the relevant lineage level and disclose residual contamination risk. A heldout benchmark that was repeatedly used for checkpoint selection is not independent evidence of transfer.

[MATHEMATICALLY-DERIVED] Failure to observe an initial solution in a finite sample gives Eq. 35.10's bound, not proof of zero support. Demonstrating a genuinely new capability would require a stronger operational definition and evidence than a finite before/after sampling comparison. A more defensible claim is increased success probability, improved coverage under the tested budget, or retention/loss on a declared hard slice.

## Algorithm

**Algorithm 35.5 — Frozen paired evaluation under hard budgets.** Inputs are frozen before/after checkpoints, heldout prompts $X$, candidate count $n$, response/token/checker budgets, a frozen independent evaluator and a declared diversity map $\phi$. The output is a paired prompt-level record, not only a scalar mean.

$$
\begin{aligned}
(1)\;&\mathcal E_{\rm eval}\leftarrow
\operatorname{Freeze}(X,v_{\rm before},v_{\rm after},v_{\rm dec},v_{\rm judge},\phi,n,T,\mathrm{mode}).\\
(2)\;&\mathcal R\leftarrow\varnothing;\quad
(v,x)\leftarrow\{v_{\rm before},v_{\rm after}\}\times X.\\
(3)\;&\mathcal A_{vx}\leftarrow
\operatorname{Collect}_{35.1}(x,n,L_{\max},T)\quad\text{with identity }v.\\
(4)\;&C_{vxi}\leftarrow
\operatorname{IndependentEvaluate}(x,y_{vxi},v_{\rm judge})
\in\{0,1,\mathrm{UNKNOWN}\}.\\
(5)\;&a_{vx}\leftarrow\mathbf1[\mathrm{mode}=\mathrm{FIXED\_IID},
\ |\mathcal A_{vx}|=n,\ \forall i:C_{vxi}\in\{0,1\},
\ \operatorname{IIDContract}(\mathcal A_{vx})].\\
(6)\;&c_{vx}\leftarrow\sum_{i=1}^nC_{vxi}\quad\text{only if }a_{vx}=1;\\
&\hat P_{vx,k}\leftarrow
1-\binom{n-c_{vx}}k/\binom nk
\quad(a_{vx}=1,\ 1\le k\le n);\\
&a_{vx}=0\ \text{or }k>n\Longrightarrow\hat P_{vx,k}=\mathrm{NOT\_ESTIMABLE}.\\
(7)\;&L_{vx}\leftarrow\mathbf1[\exists i:C_{vxi}=1];\quad
U_{vx}\leftarrow\mathbf1[\exists i:C_{vxi}\in\{1,\mathrm{UNKNOWN}\}].\\
(8)\;&Z_{vxi}\leftarrow\phi(x,y_{vxi});\quad
\mathcal R\leftarrow\mathcal R\cup
\{(v,x,\mathcal A_{vx},C_{vx},Z_{vx},\hat P_{vx},[L_{vx},U_{vx}])\}.\\
(9)\;&\text{return paired prompt records and clustered uncertainty for each admitted estimand}.
\end{aligned}
$$

[DERIVED] FIXED_IID mode reserves enough work for all $n$ independent capped attempts before collection; an incomplete or probability-incompatible set is not admitted to Eq. 35.21. BUDGET mode reports the empirical any-success event among attempted candidates and its unknown-label bounds $[L,U]$, not an unbiased fixed-$k$ estimator. An empty candidate set is explicitly NOT_ESTIMABLE for fixed-count pass@k and has no attempted success in the budget event. Evaluator errors produce tagged unknown labels rather than silently counted successes. Incomplete candidate sets remain visible; metric denominators follow the frozen missingness policy. The invariant is no test-driven model, decoder or cluster-map update. Termination follows the finite model/prompt/candidate set and enforced budgets. Evaluator work is $O(|X|n)$ bounded calls, diversity labeling depends on the declared map, and storing outputs costs $O(|X|nL_{\max})$ tokens. Bootstrap or other uncertainty procedures resample prompts, not overlapping candidate subsets as though independent.

## Implementation

[DERIVED] The model-generation layer can use vLLM, while TRL/verl belong to training; the evaluation artifact must not inherit a trainer's reward as independent correctness by default. Store evaluator inputs separately from candidate-accessible fixtures. Candidate masks preserve CAPPED and ERROR outcomes. Hash checkpoint, tokenizer and decoding processor order; temperature and top-p names alone do not identify a full sampling distribution.

[DERIVED] Compute per-prompt counts in integer arithmetic and evaluate hypergeometric ratios through products or log-binomial functions to avoid overflow. For $c=0$, Eq. 35.21 is exactly zero; for $c=n$, it is one at every admissible $k$. A sampled estimate of zero remains a finite observation, not a statement about true support.


```figure
{
  "id": "fig-35.28",
  "kind": "matrix",
  "title": "Repeated correctness is not diversity",
  "caption": "Rows index six attempts; columns index three solution families. The first three correct attempts share one family; the last three occupy other families but need not be correct.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.23",
  "alt": "Rows index six attempts; columns index three solution families. The first three correct attempts share one family; the last three occupy other families but need not be correct. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "rows": 6,
    "cols": 3,
    "pattern": "explicit",
    "cells": [
      [
        1,
        0,
        0
      ],
      [
        1,
        0,
        0
      ],
      [
        1,
        0,
        0
      ],
      [
        0,
        1,
        0
      ],
      [
        0,
        0,
        1
      ],
      [
        0,
        1,
        0
      ]
    ],
    "rowLabel": "attempt1–6",
    "colLabel": "family A / B / C",
    "legend": "Filled = assigned family; correctness is a separate label, never implied by occupancy."
  }
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] R35.7 directly studies metric interpretation rather than treating pass@k as diversity. [§2–4].

| Field | Disclosed protocol |
|---|---|
| Model/training | Qwen2.5-1.5B-Instruct;1500GSM8K frozen tasks filtered once by initial1–7/8 success;187steps |
| Comparisons | GRPO G8/noKL; shortest-correct RFT; RFT+KL; main seeds 0,1,2 |
| Evaluation | 100heldoutGSM8K×32; MATH500×16; temperature 1/top-p1;1024response cap |
| Metrics | pass1/8/32; entropy; answer diversity; correct-only length/count controls |
| Uncertainty | 95% prompt bootstrap per seed; random-effects aggregation; plotted min–max is not CI |
| Missing | Optimizer, hardware, precision: NOT-DISCLOSED |

## Observations

**What the paper claims.** [PAPER-REPORTED] R35.7 reports GRPO entropy decreases and RFT entropy increases across its three main seeds, without a consistent high-$k$ winner. On its hard MATH slice, GRPO coverage is statistically indistinguishable from the frozen base, while RFT is worse.

**What the evidence shows.** [DERIVED] The study supplies a controlled counterexample to identifying entropy or pass@k with diversity. Its small model, filtered task pool, finite hard slice and specific decoding do not establish universal post-training behavior.

**What we infer.** [MATHEMATICALLY-DERIVED] Equations35.20–35.23 show why a coverage metric cannot identify strategy diversity or new support. The study's observations are compatible with these distinctions without proving a unique causal mechanism.

**What remains unknown.** [UNVERIFIED] Transfer to larger models, different task domains and other training recipes remains unverified here. The book has not independently reproduced the reported training runs.


```figure
{
  "id": "fig-35.29",
  "kind": "compare",
  "title": "Match metric to claim",
  "caption": "The evaluation contract distinguishes properties that a single score cannot establish.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "The evaluation contract distinguishes properties that a single score cannot establish. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Coverage"
      },
      {
        "id": "n1",
        "label": "Diversity"
      },
      {
        "id": "n2",
        "label": "New capability"
      }
    ],
    "rows": [
      {
        "dimension": "Evidence",
        "values": {
          "n0": "Correctness + budget",
          "n1": "Equivalence classes",
          "n2": "Stronger operational test"
        }
      },
      {
        "dimension": "Finite absence",
        "values": {
          "n0": "No sampled success",
          "n1": "No sampled family",
          "n2": "Does not prove zero support"
        }
      },
      {
        "dimension": "Main confound",
        "values": {
          "n0": "Decoder/evaluator",
          "n1": "Length/sample count",
          "n2": "Undetected base probability"
        }
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Candidate subsets treated as replications.** *Symptom:* extremely narrow confidence intervals accompany many overlapping pass@k subsets. *Cause:* the same sampled attempts are reused as if independent experimental units. *Detection:* inspect resampling identities and task clustering. *Mitigation:* estimate uncertainty over independent prompts/seeds under the declared sampling model.

[DERIVED] Other failures include changing temperature after seeing test results, comparing oracle coverage with deployable selection, reporting only successful response lengths and treating average pass@1 as sufficient to predict coverage. A verifier-selected result also needs false-selection analysis; increasing candidate count can increase both solution opportunities and exploitable errors.


```figure
{
  "id": "fig-35.30",
  "kind": "chart",
  "title": "Hard reservation admits complete candidate slots",
  "caption": "Eq.35.24 fixes4096 tokens per fully reserved candidate. A step occurs at each complete4096-token budget increment;32768 tokens admits eight slots. Actual short responses may use less, but no overshoot is guaranteed by this bound.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.24",
  "alt": "A step plot maps token budgets0,4096,…,32768 to guaranteed fully reserved candidate slots0,1,…,8. Partial slot budgets do not admit an additional worst-case candidate.",
  "spec": {
    "type": "step",
    "x": {
      "label": "hard generated-token budget",
      "domain": [
        0,
        32768
      ],
      "format": "tokens"
    },
    "y": {
      "label": "fully reserved candidate slots",
      "domain": [
        0,
        8
      ],
      "format": "integer"
    },
    "series": [
      {
        "id": "slots",
        "label": "floor(budget/4096)",
        "points": [
          [
            0,
            0
          ],
          [
            4096,
            1
          ],
          [
            8192,
            2
          ],
          [
            12288,
            3
          ],
          [
            16384,
            4
          ],
          [
            20480,
            5
          ],
          [
            24576,
            6
          ],
          [
            28672,
            7
          ],
          [
            32768,
            8
          ]
        ],
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation"
}
```


## Siblings

[DERIVED] Pass@1 measures one attempt; pass@k measures any-success coverage under a candidate budget. Majority-vote accuracy measures an aggregation rule and depends on answer normalization. Verifier-selected accuracy measures another rule plus verifier error. Strategy diversity measures an equivalence-class distribution. Generalization measures performance on a specified shifted population. None subsumes the others.

## Extensions

### Improvements

[PAPER-REPORTED] OPEFO and ARCUS report coverage alongside single-sample metrics, but their candidate counts and decoding differ from R35.7 and from each other. Those reports broaden evaluation axes; they do not make cross-paper averages directly comparable. [R35.4, Appendix E–F; R35.6, §6.4].

[DERIVED] The appropriate extension is a claim-specific evaluation contract, not a synthetic combined score whose weights are chosen after results. Book-authored matched experiments are proposed in verification.md and remain unexecuted.

## Limitations

[DERIVED] A diversity map is an imperfect measurement model. Finite tasks and samples cannot exhaust a policy's support, and correctness labels can be wrong. Uncertainty intervals condition on the stated task/sampling process; they do not cover unknown contamination or an invalid evaluator.

## Reproducibility

[DERIVED] Publish prompt-level counts, all candidates and statuses, evaluator version, decoding, token/checker budgets, diversity map, split lineage, seed structure, bootstrap unit and checkpoint-selection rule. Preserve negative findings and uncertainty alongside gains. A raw average without these fields cannot establish which property improved.

## References

[R35.7] What pass@k Cannot Measure, §2–4. [R35.4] ARCUS evaluation appendix. [R35.6] OPEFO §6.4. Metric identities and counterexamples are derived locally.
