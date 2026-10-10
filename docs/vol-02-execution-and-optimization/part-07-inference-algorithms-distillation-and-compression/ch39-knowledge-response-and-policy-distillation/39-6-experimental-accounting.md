---
id: "ms.section.39.6"
entity_type: "section"
title: "39.6 — Experimental accounting"
short_title: "39.6 — Experimental accounting"
volume: 2
part: 7
chapter: 39
section: 39.6
slug: "39-6-experimental-accounting"
parent: "ms.chapter.39"
prev_sibling: "ms.section.39.5"
next_sibling: "ms.verification.39"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.37", "ms.chapter.38"]
downstream: ["ms.chapter.40", "ms.chapter.41", "ms.chapter.42", "ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "adaptation", "inference"], "mechanism": ["distillation", "distribution_matching"], "feedback_setting": ["ai_feedback", "verifiable_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: ["impl.pytorch", "impl.megatron-lm", "impl.verl", "impl.vllm", "impl.sglang"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2200
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 39.6 — Experimental accounting

## Scope

[DERIVED] Account for the complete teacher–student experiment and determine when a deployment saving amortizes its one-time cost. The baseline is serving the existing teacher under the same quality and workload requirement. Success means matched scientific comparisons, a complete resource ledger and a break-even statement conditional on measured serving costs. A faster student update alone does not establish a cheaper pipeline or an economically usable student.

## Why this exists

[DERIVED] Distillation can move cost outside the displayed training loop: teacher responses are generated in advance, rejected candidates disappear, verification consumes another model or executable environment, and teacher adaptation requires its own optimizer. Cached targets then make student iterations appear cheap while the initial bill remains. Quality measurements can also become optimistic when checkpoints, filters or prompts are selected using the reported test set.

[PAPER-REPORTED] The offline study excludes teacher-cache construction from its per-iteration profile [R39.1, §4.1]. SCOUT adds periodic teacher GRPO and evaluates a longer-OPD fixed-data compute control [R39.4, §5]. OPCD's Appendix A.3 selects the highest-test-accuracy checkpoint, while Appendix B.2 averages the three best test checkpoints [R39.6]. These are material boundaries, not incidental reporting details.

## Intuition

[MATHEMATICALLY-DERIVED] A complete bill adds all work once, regardless of where it is scheduled. A cache is advantageous when repeated teacher work saved exceeds cache construction, storage and access overhead. A deployment investment is recovered only when positive per-request savings accumulate beyond that bill. If the student fails the target quality requirement, no request count converts it into a valid substitute. Test-based selection estimates a selected statistic rather than untouched generalization.

## Formulation

[MATHEMATICALLY-DERIVED] For one declared accounting unit—GPU-hours, energy or currency, separately—define

$$
\begin{aligned}
\mathcal C_{\rm total}={}&\mathcal C_{\rm teacher\,adapt}+\mathcal C_{\rm generation}
+\mathcal C_{\rm rejected}+\mathcal C_{\rm verification}+\mathcal C_{\rm scoring/cache}\\
&+\mathcal C_{\rm student\,train}+\mathcal C_{\rm evaluation/search}
+\mathcal C_{\rm storage/I/O}+\mathcal C_{\rm integration}.
\end{aligned}
$$
*(Eq. 39.17)*

where categories are disjoint ledger tags, not additive labels on the same work. Generation includes accepted outputs and rejected work is separated only if generation excludes it; otherwise that term must be zero to avoid double counting. Teacher adaptation includes rollout, backward, optimizer and verification cost if those are not already assigned elsewhere. Report wall-clock makespan independently because overlapped work does not add as elapsed time.

[MATHEMATICALLY-DERIVED] If cache creation costs $A$ seconds-equivalent and saves $\Delta t>0$ per repeated student iteration after cache I/O overhead, the first strictly cost-saving iteration count is $\lfloor A/\Delta t\rfloor+1$. For deployment, with finite nonnegative one-time incremental cost $C_0\geq0$ and positive matched-quality per-request saving $\Delta c=c_T-c_S$,

$$
Q_{\rm break}=\left\lceil\frac{C_0}{\Delta c}\right\rceil,\qquad
\mathcal C_T(Q)=Qc_T,\qquad\mathcal C_S(Q)=C_0+Qc_S.
$$
*(Eq. 39.18)*

where equality at the ceiling is amortization, while a strict saving may require one more request. All cost inputs must be finite and nonnegative. If $\Delta c\leq0$, no finite strictly cost-saving point exists under this model; when $C_0=0$ and $\Delta c=0$, both systems have equal cost at every request count. Requests must have the same input/output distribution, concurrency, SLO and quality threshold. A mean token-cost estimate cannot substitute for a required tail-latency or tool-success constraint.


```figure
{
  "id": "fig-39.31",
  "kind": "calculator",
  "title": "Conditional deployment amortization",
  "caption": "Illustrative currency units, not a market quote. Both systems must satisfy the same quality and SLO. Positive incremental saving yields a finite request count.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.18",
  "alt": "Illustrative currency units, not a market quote. Both systems must satisfy the same quality and SLO. Positive incremental saving yields a finite request count.",
  "spec": {
    "tex": "Q_{\\rm break}=\\lceil C_0/\\Delta c\\rceil",
    "equation": "39.18",
    "inputs": [
      {
        "symbol": "C0",
        "label": "One-time incremental cost",
        "default": 10000,
        "min": 100,
        "max": 100000,
        "step": 100,
        "scale": "linear",
        "format": "fixed2"
      },
      {
        "symbol": "saving",
        "label": "Per-request saving",
        "default": 0.02,
        "min": 0.001,
        "max": 0.1,
        "step": 0.001,
        "scale": "linear",
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "Q",
        "label": "Requests to amortize",
        "formula": "ceil(C0/saving)",
        "format": "integer"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] Construct the comparison around a frozen prompt manifest and evaluation contract. A matched-data experiment holds accepted target artifacts fixed, exposing differences due to objective or implementation. A matched-attempt experiment holds teacher candidates fixed, exposing filtering effects. A matched-compute experiment fixes the complete ledger, allowing different accepted data volumes. A matched-quality deployment comparison chooses systems meeting the same minimum capability, retention and latency conditions. These answer different questions and cannot all be inferred from one equal-example-count run.

[MATHEMATICALLY-DERIVED] For independent prompts with acceptance probabilities $a_i$ and per-attempt generation cost $g_i$, unlimited retry cost for one accepted sample each is $\sum_i g_i/a_i$, not generally $\sum_i g_i/\bar a$. Correlation between difficulty, response length and acceptance makes a global average misleading. Caps create missing prompts and change the accepted population. Verifier cost must include rejected candidates, invalid parser outputs, timeouts and any human escalation; the source provides no universal constant cost per accepted token.

[PAPER-REPORTED] OPCD's filtered experience pool is not label-free: it evaluates300 extracted contexts using1000 math or128 game validation examples, then chooses the strongest context. Its unfiltered variant randomly samples from the pool and is the relevant no-quality-label construction [R39.6, Appendix A.3]. The same appendix evaluates checkpoints every two steps and selects highest test accuracy; the system-prompt experiment reports the average of the three best test checkpoints. This makes the displayed test statistic selection-dependent even if the training and test examples are textually disjoint.


```figure
{
  "id": "fig-39.32",
  "kind": "systems-trace",
  "title": "Teacher cost remains in the full transaction",
  "caption": "Asynchronous work can leave the critical path while consuming memory, bandwidth and compute. The ledger counts each resource stage once rather than adding overlapped wall times.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.17",
  "alt": "Asynchronous work can leave the critical path while consuming memory, bandwidth and compute. The ledger counts each resource stage once rather than adding overlapped wall times.",
  "spec": {
    "columns": [
      "compute",
      "memory",
      "communication",
      "failure"
    ],
    "stages": [
      {
        "name": "Teacher adaptation",
        "values": {
          "compute": "Rollout, backward and optimizer",
          "memory": "Trainable teacher state",
          "communication": "Model and rollout transfers",
          "failure": "Invalid rewards or incomplete update"
        }
      },
      {
        "name": "Teacher hidden cache",
        "values": {
          "compute": "Teacher forward",
          "memory": "CPU hidden-state buffer",
          "communication": "Offload/load traffic",
          "failure": "Stale prefix or checkpoint"
        }
      },
      {
        "name": "Head reconstruction",
        "values": {
          "compute": "Hidden times teacher head",
          "memory": "One resident teacher head",
          "communication": "Head and hidden-state loading",
          "failure": "Wrong teacher identity"
        }
      },
      {
        "name": "Student training",
        "values": {
          "compute": "Local loss and backward",
          "memory": "Student optimizer and activations",
          "communication": "Training collectives",
          "failure": "Nonfinite update"
        }
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.33",
  "kind": "chart",
  "title": "Complete cost rises as acceptance falls",
  "caption": "Analytical homogeneous independent-attempt example with one cost unit per attempt and one accepted trace requested. This is a rejection-cost relation, not a benchmark.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.7",
  "alt": "Analytical homogeneous independent-attempt example with one cost unit per attempt and one accepted trace requested. This is a rejection-cost relation, not a benchmark.",
  "spec": {
    "type": "bar",
    "x": {
      "label": "Per-attempt acceptance"
    },
    "y": {
      "label": "Expected generation cost units",
      "format": "fixed2"
    },
    "categories": [
      "1.00",
      "0.50",
      "0.25",
      "0.10"
    ],
    "series": [
      {
        "id": "cost",
        "label": "Cost per accepted trace",
        "values": [
          1,
          2,
          4,
          10
        ]
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] A finite selection example shows the problem without estimating its magnitude for OPCD. If $K$ independently evaluated candidate checkpoints each solve one Bernoulli test item with true success probability $p$, the selected maximum accuracy has expectation $1-(1-p)^K$, exceeding $p$ for $K>1$, $0<p<1$. Real checkpoints share examples and are correlated; this toy expression is an explanatory counterexample, not a correction factor for the paper. The valid remedy is a validation selection rule followed by one untouched final evaluation, or an explicitly selection-aware analysis with adequate data.

[MATHEMATICALLY-DERIVED] For paired baseline/student outcomes $A_i,B_i$ on the same $n$ items,

$$
\widehat\Delta=\frac1n\sum_i(A_i-B_i)=\frac{n_{10}-n_{01}}{n},\qquad
\operatorname{Var}(\widehat\Delta)=\frac{\operatorname{Var}(A)+\operatorname{Var}(B)-2\operatorname{Cov}(A,B)}{n}.
$$
*(Eq. 39.19)*

where $n_{10}$ counts student-only successes and $n_{01}$ baseline-only successes when $A$ denotes the student. Pairing preserves information about which items improved or regressed. Repeated decoding estimates sampling variation conditional on a trained checkpoint; independent training seeds estimate another level. Pooling all sampled completions as independent test items inflates apparent information when they share prompts or model state.

## Algorithm

**Algorithm 39.6 — Complete-cost, selection-safe experiment closure.** [DERIVED] Inputs are immutable source/train/validation/test manifests, positive integer candidate budget $K$, finite positive integer generation/update/evaluation caps, a quality/retention/SLO requirement and a ledger schema. Output is a frozen artifact, paired quality report and conditional cost statement, or a named incomplete/unusable result. Proposed execution belongs to verification.md; the algorithm defines the accounting contract.

$$
\begin{aligned}
1.&\quad \mathcal L\leftarrow\varnothing;\ \text{validate integer budgets; freeze splits, evaluators and selection rule.}\\
2.&\quad \text{For at most }K\text{ candidates: charge adaptation, generation, rejected work and verification once.}\\
3.&\quad \text{Charge cache construction/storage and bounded student training; preserve every failed attempt.}\\
4.&\quad \text{If no valid candidate remains return NO\_FEASIBLE\_CHECKPOINT; otherwise select on validation only.}\\
5.&\quad \text{Evaluate the chosen artifact on untouched test items with paired baseline outcomes.}\\
6.&\quad \text{If manifests, cost tags or finite nonnegative cost measurements are missing, return INCOMPLETE\_ACCOUNTING.}\\
7.&\quad \text{If quality, retention or SLO fails, return NOT\_A\_VALID\_SUBSTITUTE with observed failures.}\\
8.&\quad \text{Measure matched-workload serving costs; if }c_T-c_S\leq0\text{ return NO\_FINITE\_STRICT\_SAVING.}\\
9.&\quad Q_{\rm break}\leftarrow\lceil C_0/(c_T-c_S)\rceil;\quad\text{publish units, boundary and uncertainty.}
\end{aligned}
$$

[DERIVED] Invariants are disjoint work tags, final-test isolation, complete failures, immutable selected artifact and matched deployment conditions. No quality threshold is relaxed after test inspection. Stopping includes finite candidate/update/token limits and named service failures. Complexity follows the actual logged workload, rather than an architecture-only FLOP estimate; the method cannot recover missing external API usage from a successful-run summary.

## Implementation

[DERIVED] Separate CPU teacher storage, GPU head residency, hidden-cache bytes, learner optimizer state, network traffic and elapsed overlap. A teacher forward can be off the critical path while still consuming resources and limiting throughput elsewhere. Count teacher-head reconstruction for every scored token; caching last hidden states removes explicit persistent logits, not the head multiplication. A trainable teacher requires gradients and optimizer state that a frozen scorer does not.

[PAPER-REPORTED] SCOUT's larger allocation than OPD is disclosed:24A100s for the4B-teacher configuration versus16 for OPD, with32 for7/8B teachers [R39.4, Appendix B.4]. Its fixed-data one- versus three-epoch control supports a compute comparison within that study, while additional fresh data, total teacher initialization and broader search remain separate accounting questions. DeepSeek's asynchronous offload and head ordering are disclosed mechanisms without isolated bytes/time/energy measurements [R39.8, §5.2.2].


```figure
{
  "id": "fig-39.34",
  "kind": "chart",
  "title": "Selecting the best test outcome inflates the statistic",
  "caption": "Analytical counterexample: independent candidate outcomes on a single Bernoulli test item with true success .5. The selected test maximum is not an untouched success estimate; this is not an OPCD bias estimate.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.19",
  "alt": "Analytical counterexample: independent candidate outcomes on a single Bernoulli test item with true success .5. The selected test maximum is not an untouched success estimate; this is not an OPCD bias estimate.",
  "spec": {
    "type": "step",
    "x": {
      "label": "Candidate checkpoints",
      "format": "integer"
    },
    "y": {
      "label": "Expected selected test maximum",
      "format": "raw"
    },
    "series": [
      {
        "id": "selected",
        "label": "Best of K",
        "points": [
          [
            1,
            0.5
          ],
          [
            2,
            0.75
          ],
          [
            3,
            0.875
          ],
          [
            4,
            0.9375
          ],
          [
            5,
            0.96875
          ],
          [
            6,
            0.984375
          ],
          [
            7,
            0.9921875
          ],
          [
            8,
            0.99609375
          ],
          [
            9,
            0.998046875
          ],
          [
            10,
            0.9990234375
          ],
          [
            11,
            0.99951171875
          ],
          [
            12,
            0.999755859375
          ],
          [
            13,
            0.9998779296875
          ],
          [
            14,
            0.99993896484375
          ],
          [
            15,
            0.999969482421875
          ],
          [
            16,
            0.9999847412109375
          ]
        ]
      },
      {
        "id": "true",
        "label": "True candidate success",
        "points": [
          [
            1,
            0.5
          ],
          [
            2,
            0.5
          ],
          [
            3,
            0.5
          ],
          [
            4,
            0.5
          ],
          [
            5,
            0.5
          ],
          [
            6,
            0.5
          ],
          [
            7,
            0.5
          ],
          [
            8,
            0.5
          ],
          [
            9,
            0.5
          ],
          [
            10,
            0.5
          ],
          [
            11,
            0.5
          ],
          [
            12,
            0.5
          ],
          [
            13,
            0.5
          ],
          [
            14,
            0.5
          ],
          [
            15,
            0.5
          ],
          [
            16,
            0.5
          ]
        ],
        "dashed": true
      }
    ]
  }
}
```


## Experimental design

### Reported experiments

| Evidence boundary | Disclosed setup, outcome and gap |
|---|---|
| Offline timing [R39.1, §4.1; Appendix A] | One H200,8K, compressed3B student/8B teacher; BF16; globalbatch32/micro1;25.9→18.5s iteration; teacher cache creation excluded; profile15 iterations |
| SCOUT compute control [R39.4, §5/Figure6] |4B teacher→1.7B student, same OpenR1-Math data; SCOUT1epoch versus OPD3; OPD plateaus under this repeated-data protocol; fresh-data counterfactual not tested |
| OPCD selection [R39.6, Appendices A.3/B.2] |50steps, batch128, LR sweep $10^{-6}$ to $5\cdot10^{-6}$; top256 student-vocabulary RKL; best test checkpoint or best-three-test average |
| OPCD retention [R39.6, Tables1–2] | Filtered math accuracy80.9 but IF-Eval80.8 versus baseline81.3; filtered FrozenLake38.3 but IF66.7 versus67.3; improved target quality does not imply zero forgetting |
| Missing cost fields | Complete search/cache/verifier monetary and energy totals, exact OPCD hardware/precision/optimizer/evaluator revisions, and serving SLO break-even measurements NOT-DISCLOSED |

[PAPER-REPORTED] OPCD's three-context standard deviations describe variation across selected experiential contexts in the unfiltered setting, not an independently established training-seed confidence interval. Its reported advantages are useful observations under a selection-dependent protocol. They cannot be quoted as an untouched test estimate without this caveat.

## Observations

**What the paper claims.** [PAPER-REPORTED] The offline method reduces student-iteration cost; SCOUT's teacher adaptation improves fixed-data compute efficiency; OPCD transfers contextual knowledge while mitigating forgetting [R39.1, R39.4, R39.6].

**What the evidence shows.** [PAPER-REPORTED] The offline profile saves7.4seconds per iteration under its specified8K workload, before cache-construction amortization. SCOUT's matched-data control favors adaptation over additional repeated OPD epochs. OPCD reports strong target-domain gains, including unfiltered FrozenLake6.3→26.5±6.4 and math75.0→79.7±.5, while some filtered retention measures decline and test-based checkpoint selection remains explicit in the appendix. No inspected source reports a complete matched-quality serving break-even for these pipelines.

**What we infer.** [DERIVED] Optimization speed, complete production cost and unbiased quality estimation must be audited separately. The disclosed results support local resource/quality comparisons, not a universal inexpensive-distillation claim.

**What remains unknown.** [NOT-DISCLOSED] Full rejection/verifier/search bills, independent replication, component-isolated scheduling overhead, final untouched OPCD selection estimates and serving-cost/SLO distributions remain unavailable. These gaps block a numerical deployment recommendation from the chapter alone.


```figure
{
  "id": "fig-39.35",
  "kind": "chart",
  "title": "Pairing changes uncertainty without changing means",
  "caption": "Analytical Bernoulli marginals both have probability .5. Positive same-item covariance reduces paired variance; treating repeated completions as new test items does not create this information.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.19",
  "alt": "Analytical Bernoulli marginals both have probability .5. Positive same-item covariance reduces paired variance; treating repeated completions as new test items does not create this information.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Outcome covariance",
      "format": "fixed3"
    },
    "y": {
      "label": "Variance of paired mean difference",
      "format": "fixed3"
    },
    "series": [
      {
        "id": "s0",
        "label": "Paired n=100",
        "points": [
          [
            0.0,
            0.005
          ],
          [
            0.0025,
            0.0049499999999999995
          ],
          [
            0.005,
            0.0049
          ],
          [
            0.0075,
            0.00485
          ],
          [
            0.01,
            0.0048
          ],
          [
            0.0125,
            0.00475
          ],
          [
            0.015,
            0.004699999999999999
          ],
          [
            0.0175,
            0.00465
          ],
          [
            0.02,
            0.0046
          ],
          [
            0.0225,
            0.00455
          ],
          [
            0.025,
            0.0045000000000000005
          ],
          [
            0.0275,
            0.00445
          ],
          [
            0.03,
            0.0044
          ],
          [
            0.0325,
            0.00435
          ],
          [
            0.035,
            0.0043
          ],
          [
            0.0375,
            0.00425
          ],
          [
            0.04,
            0.0042
          ],
          [
            0.0425,
            0.00415
          ],
          [
            0.045,
            0.0041
          ],
          [
            0.0475,
            0.004050000000000001
          ],
          [
            0.05,
            0.004
          ],
          [
            0.0525,
            0.00395
          ],
          [
            0.055,
            0.0039000000000000003
          ],
          [
            0.0575,
            0.00385
          ],
          [
            0.06,
            0.0038
          ],
          [
            0.0625,
            0.00375
          ],
          [
            0.065,
            0.0037
          ],
          [
            0.0675,
            0.00365
          ],
          [
            0.07,
            0.0036
          ],
          [
            0.0725,
            0.0035499999999999998
          ],
          [
            0.075,
            0.0034999999999999996
          ],
          [
            0.0775,
            0.00345
          ],
          [
            0.08,
            0.0034
          ],
          [
            0.0825,
            0.0033499999999999997
          ],
          [
            0.085,
            0.0032999999999999995
          ],
          [
            0.08750000000000001,
            0.0032499999999999994
          ],
          [
            0.09,
            0.0032
          ],
          [
            0.0925,
            0.00315
          ],
          [
            0.095,
            0.0031
          ],
          [
            0.0975,
            0.0030499999999999998
          ],
          [
            0.1,
            0.003
          ],
          [
            0.10250000000000001,
            0.00295
          ],
          [
            0.105,
            0.0029000000000000002
          ],
          [
            0.1075,
            0.00285
          ],
          [
            0.11,
            0.0028000000000000004
          ],
          [
            0.1125,
            0.0027500000000000003
          ],
          [
            0.115,
            0.0027
          ],
          [
            0.11750000000000001,
            0.00265
          ],
          [
            0.12,
            0.0026
          ],
          [
            0.1225,
            0.00255
          ],
          [
            0.125,
            0.0025
          ],
          [
            0.1275,
            0.00245
          ],
          [
            0.13,
            0.0024
          ],
          [
            0.1325,
            0.0023499999999999997
          ],
          [
            0.135,
            0.0023
          ],
          [
            0.1375,
            0.00225
          ],
          [
            0.14,
            0.0021999999999999997
          ],
          [
            0.14250000000000002,
            0.0021499999999999996
          ],
          [
            0.145,
            0.0021000000000000003
          ],
          [
            0.1475,
            0.00205
          ],
          [
            0.15,
            0.002
          ],
          [
            0.1525,
            0.0019500000000000001
          ],
          [
            0.155,
            0.0019
          ],
          [
            0.1575,
            0.00185
          ],
          [
            0.16,
            0.0018
          ],
          [
            0.1625,
            0.0017499999999999998
          ],
          [
            0.165,
            0.0017
          ],
          [
            0.1675,
            0.0016499999999999998
          ],
          [
            0.17,
            0.0015999999999999999
          ],
          [
            0.17250000000000001,
            0.0015499999999999997
          ],
          [
            0.17500000000000002,
            0.0014999999999999996
          ],
          [
            0.1775,
            0.0014500000000000001
          ],
          [
            0.18,
            0.0014000000000000002
          ],
          [
            0.1825,
            0.00135
          ],
          [
            0.185,
            0.0013
          ],
          [
            0.1875,
            0.00125
          ],
          [
            0.19,
            0.0012
          ],
          [
            0.1925,
            0.00115
          ],
          [
            0.195,
            0.0010999999999999998
          ],
          [
            0.1975,
            0.0010499999999999997
          ],
          [
            0.2,
            0.0009999999999999998
          ],
          [
            0.2025,
            0.0009499999999999998
          ],
          [
            0.20500000000000002,
            0.0008999999999999997
          ],
          [
            0.20750000000000002,
            0.0008499999999999996
          ],
          [
            0.21,
            0.0008000000000000001
          ],
          [
            0.2125,
            0.0007500000000000001
          ],
          [
            0.215,
            0.0007000000000000001
          ],
          [
            0.2175,
            0.00065
          ],
          [
            0.22,
            0.0006
          ],
          [
            0.2225,
            0.0005499999999999999
          ],
          [
            0.225,
            0.0004999999999999999
          ],
          [
            0.2275,
            0.0004499999999999998
          ],
          [
            0.23,
            0.0003999999999999998
          ],
          [
            0.2325,
            0.0003499999999999998
          ],
          [
            0.23500000000000001,
            0.0002999999999999997
          ],
          [
            0.23750000000000002,
            0.0002499999999999997
          ],
          [
            0.24,
            0.00020000000000000017
          ],
          [
            0.2425,
            0.00015000000000000012
          ],
          [
            0.245,
            0.00010000000000000009
          ],
          [
            0.2475,
            5.000000000000004e-05
          ],
          [
            0.25,
            0.0
          ]
        ]
      },
      {
        "id": "s1",
        "label": "Unpaired n=100",
        "points": [
          [
            0,
            0.005
          ],
          [
            0.25,
            0.005
          ]
        ]
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.36",
  "kind": "cycle",
  "title": "Close the experiment before reporting economics",
  "caption": "A final artifact is selected on validation, evaluated once on untouched tests and checked against complete cost and serving constraints. Failed quality gates remain failed substitutions.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.18",
  "alt": "A final artifact is selected on validation, evaluated once on untouched tests and checked against complete cost and serving constraints. Failed quality gates remain failed substitutions.",
  "spec": {
    "stages": [
      {
        "id": "manifest",
        "label": "Freeze manifests",
        "kind": "dataset"
      },
      {
        "id": "work",
        "label": "Log every resource stage",
        "kind": "memory"
      },
      {
        "id": "select",
        "label": "Validation selection",
        "kind": "branch"
      },
      {
        "id": "test",
        "label": "Untouched paired evaluation",
        "kind": "metric"
      },
      {
        "id": "cost",
        "label": "Quality-gated amortization",
        "kind": "objective"
      }
    ],
    "edges": [
      {
        "from": "manifest",
        "to": "work"
      },
      {
        "from": "work",
        "to": "select"
      },
      {
        "from": "select",
        "to": "test"
      },
      {
        "from": "test",
        "to": "cost"
      },
      {
        "from": "cost",
        "to": "manifest"
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Cost moved outside the reported boundary.** [DERIVED] *Symptom:* cheap training iterations coexist with a large unreported generation or verifier bill. *Cause:* cached/precomputed work is omitted. *Detection:* reconcile token/service counters against complete attempt and cache manifests. *Mitigation:* publish both per-iteration and amortized complete costs in consistent units.

[DERIVED] Other failures include double counting rejected generation, summing overlapped durations as makespan, comparing students at different output caps, selecting on final tests and treating repeated generations as independent models. A deployment break-even can disappear if quality requires retries, a verifier or a fallback teacher; those serving paths belong in $c_S$.

## Siblings

[DERIVED] Compare online scoring with offline caches by complete reuse horizon; compare fixed and adapted teachers by total optimization/verification work; compare accepted-data and attempt-matched designs by the scientific question they isolate. Direct teacher serving avoids distillation's initial bill but has its own per-request cost. Quantization and batching from Chapters40/42/48 can alter both teacher and student serving costs, so an architecture-only ratio is not enough.

## Extensions

### Improvements

[PAPER-REPORTED] Full chunking extends the source output-head benchmark to256K tokens while forward chunking can be faster at32K [R39.1, §4.3]. SCOUT reduces teacher update frequency to every10 student steps after observing a broad effective interval range [R39.4, §5]. These are demonstrated boundary-dependent changes; complete economics still require the ledger. The chapter proposes no unexecuted cost optimization as an established successor.

## Limitations

[DERIVED] Break-even is conditional on stationary request mix, measured serving costs and a valid quality substitute. A future workload or hardware price change requires recomputation. Training FLOPs, GPU-hours, energy, money and wall-clock are distinct units with different uncertainty. Mathematical accounting closes identities, not missing factual measurements.

## Reproducibility

[DERIVED] Retain stage-tagged resource records, hardware/runtime/precision, all teacher and evaluator revisions, data/prefix hashes, candidate selection history and paired item outcomes. Archive reported test-selection limitations beside source results. The chapter provides analytical contracts and a proposed verification artifact; it has not generated synthetic data, trained a student or measured deployment economics.

## References

[R39.1](references.md#r39-1), [R39.4](references.md#r39-4), [R39.6](references.md#r39-6), [R39.8](references.md#r39-8).
