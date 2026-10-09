---
id: "ms.section.35.1"
entity_type: "section"
title: "RLVR formulation"
short_title: "RLVR formulation"
volume: 2
part: 6
chapter: 35
section: 35.1
slug: "35-1-rlvr-formulation"
parent: "ms.chapter.35"
prev_sibling: null
next_sibling: "ms.section.35.2"
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

# 35.1 — RLVR formulation

## Scope

[DERIVED] Formulate reinforcement learning with verifiable rewards as optimization against a versioned decision procedure, not against an unrestricted notion of correctness. This section owns reward source, answer checking, executable tests, proof checking, task sampling and the boundary of verifiability. The deliverable is a complete experiment record connecting each sampled response to its behavior policy, checker version, resource limits and independent evaluation outcome. The formulation allows deterministic and stochastic checkers, but their contracts must be stated separately. Policy-gradient and clipped-surrogate foundations remain owned by Chapter34; feedback ontology and verifier validity remain owned by Chapter32.

## Why this exists

[DERIVED] A terminal scalar makes training convenient while concealing how the scalar was obtained. Exact string comparison can reject equivalent answers. A program can pass supplied examples while failing unseen inputs. A proof-looking response can persuade a learned judge while being rejected by a kernel. A timeout can indicate resource exhaustion rather than semantic incorrectness. Increasing expected training acceptance therefore solves a precisely defined optimization problem whose relationship to deployment correctness requires an additional argument.

[DERIVED] The bottleneck is not merely reward sparsity. It is the intersection of a searchable task distribution, a checker with acceptable error modes, and an execution system that preserves measurement identity. An optimizer can make a flawed checker easier to exploit. More rollout compute cannot establish soundness, and stronger isolation cannot establish that a finite test suite is complete. The experiment must carry these distinctions through data collection, optimization and reporting.

## Intuition

[MATHEMATICALLY-DERIVED] Treat the checker as part of the environment. Its output is a function of a candidate, fixtures, state and version. Holding the prompt text fixed while changing the test suite changes the reward function. Holding the reward function fixed while preferentially sampling solvable prompts changes the objective measure. Holding both fixed while changing decoding temperature changes the behavior distribution. These interventions act at different places in the same expectation and should not be conflated.

[DERIVED] A useful mental object is an immutable attempt, not merely a successful solution. Rejected, malformed, capped and errored attempts remain necessary to estimate cost and selection. Otherwise a training dataset assembled from accepted traces hides the unsuccessful search that produced it. The visual below preserves both branches before any scalar reduction.


```figure
{
  "id": "fig-35.1",
  "kind": "diagram",
  "title": "From attempt to evidence",
  "caption": "Every attempt reaches a typed status before reward reduction; semantic audit remains independent.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "Every attempt reaches a typed status before reward reduction; semantic audit remains independent. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Prompt + fixtures"
      },
      {
        "id": "n1",
        "kind": "model",
        "label": "Frozen behavior"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Capped generation"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Versioned checker"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Status ledger"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Independent audit"
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
        "label": "heldout"
      }
    ]
  }
}
```


## Formulation

> **Definition — Verifiable-reward RL.** Policy optimization whose reward is computed by a declared checking procedure over a specified task domain. The word verifiable describes the procedure and its scope; it does not assert that every accepted artifact satisfies the full intended specification.

[DERIVED] Let the immutable experiment identity be

$$
\mathcal E=(D_{\rm tr},D_{\rm dev},D_{\rm test},v_\pi,v_V,v_{\rm parse},v_{\rm env},\mathcal B,\mathcal M).
$$
*(Eq. 35.0)*

where $D$ are lineage-separated splits, $v$ are policy/checker/parser/environment identities, $\mathcal B$ is the budget contract and $\mathcal M$ is the frozen metric and selection contract.

[MATHEMATICALLY-DERIVED] For prompt $x\sim D$ and response $y\sim\pi_\theta(\cdot\mid x)$, define checker status $z=V_v(x,y;\xi)$, where $\xi$ contains authorized fixtures or randomness. A scalar map $r_v$ and an optional frozen reference give

$$
J(\theta)=\mathbb E_{x,y,\xi}[r_v(z)]
-\beta\,\mathbb E_{x\sim D}D_{\rm KL}
\bigl(\pi_\theta(\cdot\mid x)\Vert\pi_{\rm ref}(\cdot\mid x)\bigr).
$$
*(Eq. 35.1)*

where $\beta\ge0$ is the reference-KL coefficient; rewards and KL are dimensionless per response under the declared sequence convention.

[DERIVED] Distinguish PASS, FAIL, INVALID, TIMEOUT and ERROR before mapping them to numbers. A timeout policy may assign zero reward, omit the example or retry it; those choices produce different estimators. This chapter's proposed artifact retains all statuses and charges every attempt. It does not silently identify ERROR with a correct negative label.

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] For a finite output space with differentiable, common-support policy and an integrable reward independent of $\theta$ conditional on $x,y$, differentiating the expectation gives $\nabla J_{\rm reward}=\mathbb E[r_v(V_v)\nabla\log\pi_\theta(y\mid x)]$. If the checker itself is trained jointly or uses a changing model, treating its output as fixed defines a surrogate; the full derivative has additional terms. The same warning applies when task weights depend on current success estimates. A moving curriculum is an intentional change in training distribution, not an unbiased estimate of a fixed objective by default.

[DERIVED] Answer checking requires a parser contract before equivalence. Declare whether units, numerical tolerance, algebraic normalization, multiple boxed answers and trailing commentary are admitted. Numerical comparison should specify absolute and relative tolerances, behavior around zero, nonfinite values and precision. Symbolic equivalence requires domain assumptions: cancellation by a variable is invalid where that variable is zero. Never award correctness by searching for a gold substring without recording the resulting acceptance rule.

[DERIVED] Execution verification evaluates a program in a restricted environment against fixtures. The trusted boundary includes interpreter/compiler, dependencies, test loader, random seed, time/memory limits and result collector. Tests must be unavailable to the candidate through files, environment variables, network endpoints and logs unless deliberately public. An execution result establishes behavior on those fixtures under that environment. General program correctness needs either a complete finite enumeration or a separate proof.

[DERIVED] Proof verification separates parsing, elaboration, trusted-kernel checking and admitted axioms. A valid proof of a weakened or incorrectly translated statement does not establish the original task. The ledger therefore stores the exact formal statement, imported modules, trusted axioms and kernel version. A learned proof grader remains an estimator even if trained on formal mathematics; its confidence is not a kernel certificate.

[MATHEMATICALLY-DERIVED] Suppose candidate correctness prevalence is $p$, checker sensitivity is $s$ and false acceptance is $f$. Expected checker acceptance and accepted precision are

$$
a=ps+(1-p)f,\qquad
\Pr(C=1\mid{\rm PASS})=\frac{ps}{ps+(1-p)f}.
$$
*(Eq. 35.2)*

where the second expression is defined only for $a>0$ and all rates refer to the same candidate population.

[DERIVED] Optimization changes that population. Even if $f$ was small on initial random outputs, a policy can concentrate on a rare accepted error family. Equation 35.2 is descriptive at the measured distribution; it is not a transport guarantee from an initial audit to an optimized policy. Measure checker error on policy-generated adversarial outputs as well as heldout ordinary outputs.


```figure
{
  "id": "fig-35.2",
  "kind": "calculator",
  "title": "Acceptance is not precision",
  "caption": "Eq.35.2 varies prevalence, sensitivity and false acceptance. The positive input bounds keep the accepted denominator defined.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.2",
  "alt": "Eq.35.2 varies prevalence, sensitivity and false acceptance. The positive input bounds keep the accepted denominator defined. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "35.2",
    "tex": "a=ps+(1-p)f",
    "inputs": [
      {
        "symbol": "p",
        "label": "Correct prevalence",
        "default": 0.2,
        "min": 0.001,
        "max": 0.999,
        "format": "raw"
      },
      {
        "symbol": "s",
        "label": "Sensitivity",
        "default": 0.95,
        "min": 0.001,
        "max": 1,
        "format": "raw"
      },
      {
        "symbol": "f",
        "label": "False acceptance",
        "default": 0.02,
        "min": 0.001,
        "max": 1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "a",
        "label": "Acceptance",
        "formula": "p*s+(1-p)*f",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "ppv",
        "label": "Accepted precision",
        "formula": "p*s/(p*s+(1-p)*f)",
        "format": "raw",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Ordinary outputs",
      "variables": {
        "p": 0.2,
        "s": 0.95,
        "f": 0.02
      }
    },
    {
      "anchor": "mechanism",
      "label": "Rare correct outputs",
      "variables": {
        "p": 0.02,
        "s": 0.95,
        "f": 0.02
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Exploited checker",
      "variables": {
        "p": 0.02,
        "s": 0.95,
        "f": 0.2
      }
    }
  ]
}
```


[MATHEMATICALLY-DERIVED] With $B$ prompts, $G$ attempts per prompt, enforced response cap $L_{\max}$ and checker cap $c_{\max}$, a conservative admitted-work bound is

$$
N_{\rm generated}\le BGL_{\max},\qquad
W_{\rm checker}\le BGc_{\max}.
$$
*(Eq. 35.3)*

where generated work is measured in model tokens and checker work uses an explicitly declared unit such as CPU-seconds, execution steps or proof elaboration operations.

[DERIVED] This excludes prompt prefill, retries and hidden provider work unless included in the declared boundary. The actual ledger must count consumed work for partial attempts. Reserve a maximum before generation, enforce the cap during execution and release unused reservation afterward. Post-hoc rejection of an over-budget response does not undo compute already spent.


```figure
{
  "id": "fig-35.3",
  "kind": "tensor-flow",
  "title": "Bounded collection separates attempts from admitted groups",
  "caption": "Eq.35.3 analyticalB32,G8,L4096 means256 attempts and at most1,048,576 generated tokens before additional checker/evaluator cost. Complete valid groups can be admitted; failed, partial or unknown outcomes remain in the ledger.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.3",
  "alt": "Prompt dimensionB expands to rollout dimensionsB,G,L, followed by checker statusesB,G and complete admitted groupsK,G,whereK≤B. Maximal tokensBGL are an allowance, not observed work.",
  "spec": {
    "dims": {
      "B": "32 prompts",
      "G": "8 attempts per group",
      "L": "4096-token cap",
      "K": "complete admitted groups, at mostB"
    },
    "steps": [
      {
        "shape": "[B]",
        "label": "Prompt occurrences"
      },
      {
        "shape": "[B, G, L]",
        "label": "Bounded candidate slots",
        "op": "Generate at mostB×G×L tokens"
      },
      {
        "shape": "[B, G]",
        "label": "Checker status and reward",
        "op": "Check all completed attempts"
      },
      {
        "shape": "[K, G]",
        "label": "Complete admitted groups",
        "op": "Reject partial/unknown groups; retain ledger"
      }
    ]
  },
  "anchor": "formulation"
}
```


## Algorithm

**Algorithm 35.1 — Bounded verifier-grounded collection.** Inputs are finite prompt list $X$, group size $G$, token allowance $L_{\max}$, checker allowance $c_{\max}$, total token budget $T$, frozen experiment $\mathcal E$ and a generator that enforces its allowance. State consists of attempt ledger $\mathcal A$, consumed tokens $u$ and reserved tokens $h$. Outputs retain every attempted status and any unattempted budget exhaustion.

$$
\begin{aligned}
(1)\;&(\mathcal A,u,h)\leftarrow(\varnothing,0,0).\\
(2)\;&(x,i)\leftarrow X\times\{1,\ldots,G\}\quad\text{in frozen order}.\\
(3)\;&u+h+L_{\max}>T\ \Longrightarrow\ \text{return }(\mathcal A,\mathrm{BUDGET\_STOP}).\\
(4)\;&h\leftarrow h+L_{\max};\quad
(y,n,q)\leftarrow\operatorname{GenerateEnforced}_{v_\pi}(x,L_{\max}).\\
(5)\;&0\le n\le L_{\max};\quad u\leftarrow u+n;\quad h\leftarrow h-L_{\max}.\\
(6)\;&z\leftarrow\begin{cases}
V_v(x,y;c_{\max}),&q=\mathrm{COMPLETE},\\
q,&q\in\{\mathrm{CAPPED},\mathrm{ERROR}\}.
\end{cases}\\
(7)\;&\mathcal A\leftarrow\mathcal A\cup\{(x,i,y,n,q,z,\mathcal E)\}.\\
(8)\;&\text{repeat lines 2--7 over the finite index set; return }(\mathcal A,\mathrm{DONE}).
\end{aligned}
$$

[DERIVED] The invariant is $0\le u+h\le T$ with exactly one record per initiated attempt. A generator that cannot report consumed work after failure violates the artifact contract and stops collection. The checker must return a typed timeout/error under its own cap. Worst-case collection storage is $O(BGL_{\max})$ tokens plus bounded execution logs; checker sandbox storage is separately capped. Concurrency requires atomic reservations, not independent workers reading the same free-budget value.

## Implementation

[OFFICIAL-DOCUMENTATION] Hugging Face TRL, the reference stack's post-training layer, exposes reward functions and group-relative losses in releasev1.13.0; inspected trainer code retains reward and completion masks before loss reduction. The pinned source is recorded as R35.1. This documents interfaces and operators, not an executed training run.

[DERIVED] In a practical tensor path, prompt IDs have shape $[B,P]$, completions $[B,G,L]$, generated-action masks $[B,G,L]$, terminal statuses $[B,G]$ and behavior log probabilities $[B,G,L]$. Environment observations and tool outputs are not policy actions. The checker consumes decoded artifacts, but the training loss must retain the exact token identities to which log probabilities apply. Chapter36 owns asynchronous rollout identities and Chapter37 owns decoding processors.

[DERIVED] Critic-free training removes critic state, not actor optimizer memory, rollout KV cache or checker cost. Reference weights consume memory only when a reference penalty is actually used. Dense training includes actor parameters, gradients, optimizer moments and activations; sharding changes residency and communication without changing the objective. Verifier workers add CPU/RAM/process-launch overhead that must be measured separately from accelerator utilization.


```figure
{
  "id": "fig-35.4",
  "kind": "matrix",
  "title": "Three checks, three propositions",
  "caption": "Rows are string equality, supplied execution tests and kernel checking; columns are exact form, supplied cases and formal statement. Filled cells mark directly checked propositions.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "Rows are string equality, supplied execution tests and kernel checking; columns are exact form, supplied cases and formal statement. Filled cells mark directly checked propositions. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "rows": 3,
    "cols": 3,
    "pattern": "explicit",
    "cells": [
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
      ]
    ],
    "rowLabel": "checker: string / tests / kernel",
    "colLabel": "property: form / cases / theorem",
    "legend": "Filled = directly checked proposition; off-diagonal implication requires assumptions."
  }
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] VPR is a useful counterexample to treating every reward-normalized procedure as within-prompt GRPO. Its turn-level rewards come from game-specific oracles, and its batch can span initial states. [R35.8, §2; Appendix A,C].

| Field | Inspected VPR disclosure |
|---|---|
| Models and tasks | Qwen3-4B; Tic-Tac-Toe, Sudoku, Minesweeper |
| Protocol | 128 trajectories across initial states; 100 updates; $\gamma=0$; KL disabled |
| Optimizer/resources | Adam $(0.9,0.95)$; learning rate $2\times10^{-7}$; 8 H100 |
| Evaluation | 3 runs, 100 games each; game-specific oracle |
| Boundary | Normalization crosses initial states; fewer than 4 active turns triggers fallback |
| Missing | Precision, complete uncertainty reconstruction: NOT-DISCLOSED in inspected method |

## Observations

**What the paper claims.** [PAPER-REPORTED] VPR reports task-dependent improvements over its policy-training comparisons, with different oracle constructions for its three games. [R35.8, §3; Appendix C].

**What the evidence shows.** [DERIVED] Its disclosed protocol concerns those measured games, not general proof soundness or a universal RLVR advantage. Cross-initial-state normalization prevents treating it as the within-prompt estimator of §35.2.

**What we infer.** [MATHEMATICALLY-DERIVED] Equation 35.2 makes acceptance and correctness different observables whenever false acceptance is nonzero. The same acceptance increase can arise from more correct solutions or more accepted errors.

**What remains unknown.** [UNVERIFIED] No training run or checker attack study has been executed for this book. Independent reproduction and deployment transfer remain unverified.


```figure
{
  "id": "fig-35.5",
  "kind": "compare",
  "title": "Reward channels retain their scope",
  "caption": "The comparison separates checker evidence from a learned prediction and from subjective preference.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "The comparison separates checker evidence from a learned prediction and from subjective preference. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Deterministic checker"
      },
      {
        "id": "n1",
        "label": "Learned judge"
      },
      {
        "id": "n2",
        "label": "Preference"
      }
    ],
    "rows": [
      {
        "dimension": "Output",
        "values": {
          "n0": "Typed verdict",
          "n1": "Estimated verdict",
          "n2": "Comparison label"
        }
      },
      {
        "dimension": "Conditioning",
        "values": {
          "n0": "Fixtures + version",
          "n1": "Training + context",
          "n2": "Rubric + candidates"
        }
      },
      {
        "dimension": "Primary gap",
        "values": {
          "n0": "Specification coverage",
          "n1": "Generalization error",
          "n2": "Target disagreement"
        }
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Measurement substitution.** *Symptom:* acceptance rises while independent tests stagnate. *Cause:* the policy exploits a parser or public-test shortcut. *Detection:* compare original checker decisions with heldout semantic outcomes and inspect disagreement slices. *Mitigation:* repair and version the checker, then rerun evaluation; do not relabel the old run as having used the new specification.

[DERIVED] Other failures include nondeterministic fixtures, leaked expected answers, sandbox escapes, unbounded checker retries and status-dependent missingness. Report the frequency and cost of each observed status. A larger fraction of ERROR outcomes can make a conditional pass rate improve while unconditional service success deteriorates.


```figure
{
  "id": "fig-35.6",
  "kind": "chart",
  "title": "False acceptance under optimization",
  "caption": "For an assumed sensitivity0.95, Eq.35.2 compares false-acceptance rates as correct prevalence varies. Log-spaced prevalence samples expose the rare-correctness regime.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.2",
  "alt": "For an assumed sensitivity0.95, Eq.35.2 compares false-acceptance rates as correct prevalence varies. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "correct prevalence",
      "domain": [
        0.001,
        0.999
      ],
      "scale": "log10",
      "ticks": [
        0.001,
        0.01,
        0.1,
        0.999
      ]
    },
    "y": {
      "label": "accepted precision",
      "domain": [
        0,
        1
      ]
    },
    "series": [
      {
        "id": "n0",
        "label": "f = 0.01",
        "emphasis": true,
        "points": [
          [
            0.001,
            0.08683729433272395
          ],
          [
            0.0010715085847370128,
            0.09247869434935903
          ],
          [
            0.0011481306471651151,
            0.09844753235178477
          ],
          [
            0.0012302318448370831,
            0.10475766141909078
          ],
          [
            0.0013182039829597873,
            0.11142284304471999
          ],
          [
            0.0014124668841759339,
            0.11845664208594793
          ],
          [
            0.001513470392051253,
            0.12587230990776577
          ],
          [
            0.0016216965178282104,
            0.1336826556590994
          ],
          [
            0.0017376617406910458,
            0.1418999058497833
          ],
          [
            0.0018619194725195166,
            0.15053555266831034
          ],
          [
            0.001995062698893673,
            0.15960019179295354
          ],
          [
            0.0021377268089531627,
            0.1691033508004889
          ],
          [
            0.0022905926276157737,
            0.179053309663376
          ],
          [
            0.0024543896646256136,
            0.18945691524136832
          ],
          [
            0.0026298995959361427,
            0.20031939210784866
          ],
          [
            0.0028179599940419756,
            0.21164415249249202
          ],
          [
            0.0030194683250614382,
            0.22343260855498073
          ],
          [
            0.0032353862316448173,
            0.23568399061139542
          ],
          [
            0.0034667441221473555,
            0.2483951752951287
          ],
          [
            0.003714646087967471,
            0.26156052792538453
          ],
          [
            0.003980275172516906,
            0.275171763555345
          ],
          [
            0.004264899016967456,
            0.2892178312559072
          ],
          [
            0.004569875909717076,
            0.30368482613824044
          ],
          [
            0.004896661268444708,
            0.31855593341124594
          ],
          [
            0.005246814585687736,
            0.3338114083952443
          ],
          [
            0.005622006871087782,
            0.3494285958643629
          ],
          [
            0.006024028625821031,
            0.3653819913687198
          ],
          [
            0.006454798387268739,
            0.3816433463042795
          ],
          [
            0.00691637188470508,
            0.39818181747367026
          ],
          [
            0.0074109518496951994,
            0.41496416074546494
          ],
          [
            0.00794089852802105,
            0.43195496721160803
          ],
          [
            0.008508740943300064,
            0.4491169390093397
          ],
          [
            0.009117188966049327,
            0.4664112007669264
          ],
          [
            0.009769146245791416,
            0.4837976415057513
          ],
          [
            0.010467724067916863,
            0.5012352808379515
          ],
          [
            0.011216256201431159,
            0.5186826524874599
          ],
          [
            0.012018314808443238,
            0.536098197573941
          ],
          [
            0.012877727491318899,
            0.5534406597639915
          ],
          [
            0.01379859555885203,
            0.5706694743295998
          ],
          [
            0.01478531359862396,
            0.5877451433635865
          ],
          [
            0.01584259044895447,
            0.6046295898746123
          ],
          [
            0.016975471670527313,
            0.621286484195818
          ],
          [
            0.01818936362492997,
            0.6376815370549881
          ],
          [
            0.019490059275015615,
            0.6537827547248581
          ],
          [
            0.02088376583021246,
            0.6695606528484095
          ],
          [
            0.022377134368710132,
            0.6849884267616736
          ],
          [
            0.023977291577886563,
            0.7000420773624925
          ],
          [
            0.025691873764447915,
            0.7147004927485681
          ],
          [
            0.027529063296585565,
            0.7289454869290889
          ],
          [
            0.029497627652060043,
            0.7427617978667592
          ],
          [
            0.03160696125855822,
            0.7561370479061087
          ],
          [
            0.033867130325995295,
            0.7690616702742912
          ],
          [
            0.03628892088471119,
            0.781528805796476
          ],
          [
            0.0388838902588103,
            0.7935341742522833
          ],
          [
            0.04166442222028714,
            0.8050759249227056
          ],
          [
            0.0446437860871452,
            0.8161544708545229
          ],
          [
            0.0478362000475389,
            0.82677231122133
          ],
          [
            0.05125689901213498,
            0.8369338459093196
          ],
          [
            0.05492220731850072,
            0.8466451861251927
          ],
          [
            0.05884961663447952,
            0.8559139644358281
          ],
          [
            0.06305786943232689,
            0.864749147226101
          ],
          [
            0.06756704843196393,
            0.8731608521216869
          ],
          [
            0.07239867244019084,
            0.8811601724843945
          ],
          [
            0.07757579904322742,
            0.8887590106621386
          ],
          [
            0.08312313464265153,
            0.8959699212747243
          ],
          [
            0.08906715235985166,
            0.9028059654479518
          ],
          [
            0.09543621837166055,
            0.9092805765773435
          ],
          [
            0.10226072728007046,
            0.915407437911886
          ],
          [
            0.10957324716204594,
            0.921200371998535
          ],
          [
            0.11740867499164263,
            0.9266732418191861
          ],
          [
            0.12580440317614291,
            0.9318398632815399
          ],
          [
            0.13480049800095334,
            0.9367139285910673
          ],
          [
            0.14443989083484604,
            0.9413089399298019
          ],
          [
            0.15476858300801452,
            0.9456381527953167
          ],
          [
            0.16583586534067052,
            0.9497145283062333
          ],
          [
            0.17769455336981954,
            0.9535506937552194
          ],
          [
            0.19040123939677095,
            0.9571589106830974
          ],
          [
            0.20401656255820722,
            0.9605510497550784
          ],
          [
            0.21860549820965464,
            0.9637385717392262
          ],
          [
            0.23423766800235665,
            0.9667325139153203
          ],
          [
            0.2509876721333035,
            0.9695434812769959
          ],
          [
            0.2689354453539934,
            0.9721816419293071
          ],
          [
            0.2881666384368754,
            0.9746567261260324
          ],
          [
            0.3087730269199186,
            0.9769780284346374
          ],
          [
            0.3308529490799255,
            0.9791544125607384
          ],
          [
            0.354511775224698,
            0.9811943184072073
          ],
          [
            0.3798624105436222,
            0.9831057709850689
          ],
          [
            0.4070258339163863,
            0.9848963908335056
          ],
          [
            0.43613167525114954,
            0.9865734056442558
          ],
          [
            0.46731883410734176,
            0.9881436628212243
          ],
          [
            0.5007361425553082,
            0.9896136427390688
          ],
          [
            0.5365430754361094,
            0.9909894724948356
          ],
          [
            0.5749105114109899,
            0.992276939974405
          ],
          [
            0.6160215484324221,
            0.9934815080806225
          ],
          [
            0.6600723775283271,
            0.9946083289926319
          ],
          [
            0.7072732190693723,
            0.995662258346241
          ],
          [
            0.7578493259874145,
            0.9966478692432346
          ],
          [
            0.8120420587326735,
            0.9975694660135982
          ],
          [
            0.8701100370995773,
            0.9984310976687728
          ],
          [
            0.9323303744180369,
            0.9992365709964657
          ],
          [
            0.9990000000000001,
            0.999989463258382
          ]
        ]
      },
      {
        "id": "n1",
        "label": "f = 0.10",
        "dashed": true,
        "points": [
          [
            0.001,
            0.009419930589985125
          ],
          [
            0.0010715085847370128,
            0.01008745678438921
          ],
          [
            0.0011481306471651151,
            0.010801824944820671
          ],
          [
            0.0012302318448370831,
            0.011566254541323352
          ],
          [
            0.0013182039829597873,
            0.012384176437124675
          ],
          [
            0.0014124668841759339,
            0.01325924531784608
          ],
          [
            0.001513470392051253,
            0.014195352634195956
          ],
          [
            0.0016216965178282104,
            0.015196640044306403
          ],
          [
            0.0017376617406910458,
            0.016267513334495883
          ],
          [
            0.0018619194725195166,
            0.01741265678861965
          ],
          [
            0.001995062698893673,
            0.01863704796616421
          ],
          [
            0.0021377268089531627,
            0.019945972837695794
          ],
          [
            0.0022905926276157737,
            0.021345041213020895
          ],
          [
            0.0024543896646256136,
            0.022840202382290394
          ],
          [
            0.0026298995959361427,
            0.024437760873104383
          ],
          [
            0.0028179599940419756,
            0.026144392207275286
          ],
          [
            0.0030194683250614382,
            0.027967158519114927
          ],
          [
            0.0032353862316448173,
            0.02991352387276346
          ],
          [
            0.0034667441221473555,
            0.031991369089034584
          ],
          [
            0.003714646087967471,
            0.034209005862391076
          ],
          [
            0.003980275172516906,
            0.03657518991591514
          ],
          [
            0.004264899016967456,
            0.03909913290646577
          ],
          [
            0.004569875909717076,
            0.04179051275366672
          ],
          [
            0.004896661268444708,
            0.04465948202506667
          ],
          [
            0.005246814585687736,
            0.04771667396599838
          ],
          [
            0.005622006871087782,
            0.05097320571669841
          ],
          [
            0.006024028625821031,
            0.0544406782116719
          ],
          [
            0.006454798387268739,
            0.058131172207808474
          ],
          [
            0.00691637188470508,
            0.06205723983932769
          ],
          [
            0.0074109518496951994,
            0.06623189105044687
          ],
          [
            0.00794089852802105,
            0.07066857421221727
          ],
          [
            0.008508740943300064,
            0.07538115019006118
          ],
          [
            0.009117188966049327,
            0.08038385909533292
          ],
          [
            0.009769146245791416,
            0.08569127893022326
          ],
          [
            0.010467724067916863,
            0.09131827532343781
          ],
          [
            0.011216256201431159,
            0.097279941557553
          ],
          [
            0.012018314808443238,
            0.10359152811140133
          ],
          [
            0.012877727491318899,
            0.1102683609861323
          ],
          [
            0.01379859555885203,
            0.1173257481558363
          ],
          [
            0.01478531359862396,
            0.1247788735869639
          ],
          [
            0.01584259044895447,
            0.1326426784092953
          ],
          [
            0.016975471670527313,
            0.1409317289986953
          ],
          [
            0.01818936362492997,
            0.1496600719515286
          ],
          [
            0.019490059275015615,
            0.15884107619473561
          ],
          [
            0.02088376583021246,
            0.16848726278527804
          ],
          [
            0.022377134368710132,
            0.17861012330741918
          ],
          [
            0.023977291577886563,
            0.18921992817353225
          ],
          [
            0.025691873764447915,
            0.20032552656883018
          ],
          [
            0.027529063296585565,
            0.21193414024476534
          ],
          [
            0.029497627652060043,
            0.22405115384894123
          ],
          [
            0.03160696125855822,
            0.23667990496703767
          ],
          [
            0.033867130325995295,
            0.24982147752701442
          ],
          [
            0.03628892088471119,
            0.2634745026571979
          ],
          [
            0.0388838902588103,
            0.277634971474656
          ],
          [
            0.04166442222028714,
            0.29229606458355767
          ],
          [
            0.0446437860871452,
            0.30744800325925675
          ],
          [
            0.0478362000475389,
            0.3230779273574785
          ],
          [
            0.05125689901213498,
            0.33916980489625354
          ],
          [
            0.05492220731850072,
            0.35570437799218374
          ],
          [
            0.05884961663447952,
            0.37265914937908645
          ],
          [
            0.06305786943232689,
            0.39000841309060574
          ],
          [
            0.06756704843196393,
            0.40772333205267597
          ],
          [
            0.07239867244019084,
            0.4257720643207854
          ],
          [
            0.07757579904322742,
            0.4441199385357028
          ],
          [
            0.08312313464265153,
            0.46272967789514424
          ],
          [
            0.08906715235985166,
            0.4815616705929622
          ],
          [
            0.09543621837166055,
            0.5005742833146847
          ],
          [
            0.10226072728007046,
            0.5197242130566602
          ],
          [
            0.10957324716204594,
            0.5389668713155359
          ],
          [
            0.11740867499164263,
            0.5582567936332857
          ],
          [
            0.12580440317614291,
            0.5775480666329079
          ],
          [
            0.13480049800095334,
            0.5967947640842503
          ],
          [
            0.14443989083484604,
            0.6159513832290446
          ],
          [
            0.15476858300801452,
            0.6349732725852717
          ],
          [
            0.16583586534067052,
            0.6538170427439876
          ],
          [
            0.17769455336981954,
            0.6724409522513332
          ],
          [
            0.19040123939677095,
            0.6908052615047109
          ],
          [
            0.20401656255820722,
            0.7088725486425592
          ],
          [
            0.21860549820965464,
            0.7266079826199241
          ],
          [
            0.23423766800235665,
            0.743979549979313
          ],
          [
            0.2509876721333035,
            0.7609582331882866
          ],
          [
            0.2689354453539934,
            0.7775181397636649
          ],
          [
            0.2881666384368754,
            0.7936365826838281
          ],
          [
            0.3087730269199186,
            0.8092941137597152
          ],
          [
            0.3308529490799255,
            0.8244745126556801
          ],
          [
            0.354511775224698,
            0.839164735097853
          ],
          [
            0.3798624105436222,
            0.8533548244654311
          ],
          [
            0.4070258339163863,
            0.8670377914251164
          ],
          [
            0.43613167525114954,
            0.8802094665456994
          ],
          [
            0.46731883410734176,
            0.8928683309312776
          ],
          [
            0.5007361425553082,
            0.905015329856488
          ],
          [
            0.5365430754361094,
            0.9166536741981802
          ],
          [
            0.5749105114109899,
            0.927788634160247
          ],
          [
            0.6160215484324221,
            0.9384273294076232
          ],
          [
            0.6600723775283271,
            0.9485785192867747
          ],
          [
            0.7072732190693723,
            0.9582523963366081
          ],
          [
            0.7578493259874145,
            0.9674603858063129
          ],
          [
            0.8120420587326735,
            0.9762149534128651
          ],
          [
            0.8701100370995773,
            0.9845294231051298
          ],
          [
            0.9323303744180369,
            0.9924178061648151
          ],
          [
            0.9990000000000001,
            0.9998946425749354
          ]
        ]
      }
    ],
    "annotations": [
      {
        "x": 0.010416666666666668,
        "y": 0.5,
        "label": "f0.01: accepted precision1/2"
      },
      {
        "x": 0.09523809523809523,
        "y": 0.5,
        "label": "f0.10: accepted precision1/2"
      }
    ]
  }
}
```


## Siblings

[DERIVED] Human preferences and learned reward models estimate different targets and are defined in Chapter32. Offline preference optimization in Chapter33 learns from supplied comparisons. RLVR samples current-policy candidates and queries a checker. None of these labels establishes superiority without matched task, data, budget and evaluation contracts.

## Extensions

### Improvements

[PAPER-REPORTED] GLM-5's reasoning stage uses domain-specific evaluations or judge models, illustrating a mixed reward ecosystem rather than a single universally formal verifier. ARCUS changes task sampling while retaining its GRPO updater. Their detailed mechanisms are treated in §35.3–35.4, not attributed to the checker itself. [R35.2, §3.2; R35.4, §4].

## Limitations

[DERIVED] This formulation cannot manufacture a reliable checker for open-ended scientific novelty, interpersonal usefulness or unknown deployment requirements. Restrict claims to the verified property and task domain. When the target is only partly verifiable, preserve separate metrics for the unverified remainder.

## Reproducibility

[DERIVED] Publish split lineage, prompt serialization, behavior-policy identity, checker/container hashes, answer equivalence rules, all statuses, retry policy, enforced budgets and evaluator independence. Artifact completeness is falsifiable: a missing attempt identity, unknown checker version or unrecoverable error cost prevents exact reconstruction of the measured objective.

## References

[R35.1] TRL v1.13.0 pinned trainer/config. [R35.2] GLM-5 §3.2. [R35.4] ARCUS §4. [R35.8] VPR §2–3, Appendices A,C. Dates and eligibility are in [references](references.md).
