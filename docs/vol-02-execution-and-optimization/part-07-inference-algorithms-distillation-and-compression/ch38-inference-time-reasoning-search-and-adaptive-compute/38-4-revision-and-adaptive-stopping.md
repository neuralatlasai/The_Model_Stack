---
id: "ms.section.38.4"
entity_type: "section"
title: "Revision and adaptive stopping"
short_title: "Revision and adaptive stopping"
volume: 2
part: 7
chapter: 38
section: 38.4
slug: "38-4-revision-and-adaptive-stopping"
parent: "ms.chapter.38"
prev_sibling: "ms.section.38.3"
next_sibling: "ms.section.38.5"
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

# 38.4 — Revision and adaptive stopping

## Scope

[DERIVED] Revision and adaptive stopping decide whether to continue an existing trajectory, generate another candidate, request evidence, change reasoning mode or return the current answer. This section owns critique/refinement, uncertainty-driven allocation, diminishing returns, expected-budget routing and hard-cap enforcement. It derives a randomized allocation relaxation and its limits rather than attributing an unqualified optimality theorem to a finite deterministic router.

[DERIVED] A controller may be learned offline or specified directly. In either case the reported deployment policy includes its feature extraction, fallbacks, stopping decisions and all rejected attempts. A prompt-only router chooses before seeing a trajectory; an adaptive controller observes intermediate outcomes. They solve different information problems and should not share a claimed guarantee without an explicit reduction.

## Why this exists

[DERIVED] Uniform budgets overcompute easy tasks and can undercompute useful difficult ones. Yet the hardest tasks are not necessarily the best investment: some remain unsolved at every available budget, while medium-difficulty tasks have the largest marginal gains. A useful allocator predicts the value of another operation, not simply an abstract difficulty label. It must also pay for the observations used to make that prediction.

[DERIVED] Longer reasoning can correct an early error or elaborate it. A critique can add new evidence or merely restate the model's own preference. A stopping rule trained on average cost can produce unacceptable tails. These possibilities make the budget policy an experimental object in its own right. A lower average token count does not establish equivalent quality, hard deadlines or a transferable allocation law.

## Intuition

[DERIVED] Consider a finite menu of actions: answer now, short continuation, long continuation, another independent candidate, retrieval and checking. Each action has a task-dependent utility and cost. A price on compute favors actions whose additional utility exceeds their additional cost at that price. This produces a staircase of chosen actions as the price changes. A staircase does not generally pass through an arbitrary deterministic budget target; randomization can fill the gaps in expectation.

[DERIVED] Revision is a state transition, not an independent sample. The new candidate depends on the old one and the critique. Repeating the same judge's advice can increase agreement without adding independent evidence. An environment-generated counterexample, by contrast, can invalidate a concrete claim under declared fixtures. Preserve whether a revision is driven by self-generated text, a learned score or externally checked feedback.


```figure
{
  "id": "fig-38.19",
  "kind": "diagram",
  "title": "Revision buys another observation",
  "caption": "The controller chooses continuation, critique, evidence or stopping from retained history; every operation passes admission.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.19",
  "alt": "The controller chooses continuation, critique, evidence or stopping from retained history; every operation passes admission. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "memory",
        "label": "Incumbent + history"
      },
      {
        "id": "n1",
        "kind": "branch",
        "label": "Continue or stop"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Resource admission"
      },
      {
        "id": "n3",
        "kind": "model",
        "label": "Revise / critique"
      },
      {
        "id": "n4",
        "kind": "dependency",
        "label": "Evidence / check"
      },
      {
        "id": "n5",
        "kind": "state",
        "label": "Retain outcome"
      },
      {
        "id": "n6",
        "kind": "metric",
        "label": "Frozen return"
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
        "label": "continue"
      },
      {
        "from": "n2",
        "to": "n3"
      },
      {
        "from": "n2",
        "to": "n4"
      },
      {
        "from": "n3",
        "to": "n5"
      },
      {
        "from": "n4",
        "to": "n5"
      },
      {
        "from": "n5",
        "to": "n0",
        "label": "feedback"
      },
      {
        "from": "n1",
        "to": "n6",
        "label": "stop"
      }
    ]
  }
}
```


## Formulation

> **Definition — Expected-budget policy.** A potentially randomized action distribution whose average resource usage under a declared task measure is constrained; it does not imply a hard per-query, tail-latency or monetary ceiling.

[MATHEMATICALLY-DERIVED] For finite prompts $x$ with weights $p_x$, finite actions $a$, utility $u_{xa}$ and cost $c_{xa}\ge0$, the randomized relaxation is

$$
V(B)=\max_{q}\sum_{x,a}p_xq_{xa}u_{xa},\quad
q_{xa}\ge0,\quad\sum_aq_{xa}=1,\quad\sum_{x,a}p_xq_{xa}c_{xa}\le B.
$$
*(Eq. 38.15)*

The utilities describe the frozen action policy, generator, selector and evaluator together. They are not intrinsic properties of prompt text. Restricting $q_{xa}$ to one-hot choices produces a deterministic finite allocation problem that can have a nonzero duality gap.

[MATHEMATICALLY-DERIVED] The price oracle and dual bound are

$$
a_\lambda(x)\in\arg\max_a(u_{xa}-\lambda c_{xa}),\quad
G_B(\lambda)=\lambda B+\sum_xp_x\max_a(u_{xa}-\lambda c_{xa}),\quad\lambda\ge0.
$$
*(Eq. 38.16)*

Weak duality gives $V(B)\le G_B(\lambda)$. Strong duality holds for the feasible bounded linear program in Eq.38.15. It does not automatically hold for its one-hot restriction. With deterministic tie handling, chosen average cost is nonincreasing in $\lambda$: write the two oracle optimality inequalities at $\lambda_1<\lambda_2$, add them, and obtain $(\lambda_2-\lambda_1)(C_1-C_2)\ge0$. This proves monotonicity, not continuous budget coverage.


```figure
{
  "id": "fig-38.20",
  "kind": "calculator",
  "title": "Imitation regret leaves budget slack",
  "caption": "Eq.38.17 retains the nonnegative price-times-slack term for feasible learned costs. This analytical calculator does not estimate a model benchmark.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.17",
  "alt": "Eq.38.17 retains the nonnegative price-times-slack term for feasible learned costs. This analytical calculator does not estimate a model benchmark. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "38.17",
    "tex": "V(B)-\\hat U\\le R+\\lambda(B-\\hat C)",
    "inputs": [
      {
        "symbol": "R",
        "label": "Penalized regret",
        "default": 0,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "lambda",
        "label": "Compute price",
        "default": 0.5,
        "min": 0,
        "max": 2,
        "format": "fixed3"
      },
      {
        "symbol": "B",
        "label": "Budget",
        "default": 3,
        "min": 1,
        "max": 10,
        "format": "fixed3"
      },
      {
        "symbol": "fraction",
        "label": "Consumed budget fraction",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "C",
        "label": "Consumed cost",
        "formula": "B*fraction",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "slack",
        "label": "Price times slack",
        "formula": "lambda*B*(1-fraction)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "bound",
        "label": "Utility gap upper bound",
        "formula": "R+lambda*B*(1-fraction)",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Perfect imitation, slack",
      "variables": {
        "R": 0,
        "fraction": 0.5
      }
    },
    {
      "anchor": "mechanism",
      "label": "Budget saturated",
      "variables": {
        "R": 0,
        "fraction": 1
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Imperfect imitation",
      "variables": {
        "R": 0.2,
        "fraction": 0.5
      }
    }
  ]
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] **Finite deterministic counterexample.** One prompt has actions $(c,u)=(1,0)$ and $(3,1)$ with budget $B=2$. The only feasible deterministic action has utility0. A randomized half-half mixture has expected cost2 and utility0.5; the dual minimum is also0.5. Intersecting a simplex with a budget halfspace can create a fractional vertex. The inspected source's deterministic strong-duality assertion therefore needs qualification; its AppendixE.3 actually uses stochastic mixing, which matches the randomized interpretation. [R38.1](references.md)

[MATHEMATICALLY-DERIVED] **Imitation and unused budget.** Let $\hat U,\hat C$ be the learned policy's average utility and cost, and define its penalized regret against the price oracle by $R_\lambda=J_\lambda(a_\lambda)-J_\lambda(\hat\mu)$. Since $G_{B'}(\lambda)=J_\lambda(a_\lambda)+\lambda B'$, weak duality yields

$$
V(B')-\hat U\le R_\lambda+\lambda(B'-\hat C).
$$
*(Eq. 38.17)*

Perfect imitation makes $R_\lambda=0$ but does not remove the price-times-slack term. In the same two-action example with $B'=3$ and $\lambda=1$, the oracle selects the cheap action; a perfect imitator has utility0 while the constrained optimum has utility1. Feasibility and zero label error alone are insufficient. The inspected AppendixB.4 drops a positive slack term; this chapter retains it and does not claim the corrected bound is the paper's result. [R38.1](references.md)

[DERIVED] **Uncertainty-driven allocation.** Entropy, vote disagreement, scorer margin and intermediate failures can be useful features, but each needs a transport test. High entropy can indicate a fixable ambiguity or a hopeless task. Low entropy can indicate a confidently repeated error. A feature's accuracy AUROC is not directly its ability to rank marginal utility of compute. For that, the label must compare action outcomes at controlled budgets, including selection and verifier cost.

[DERIVED] **Critique and refinement.** Retain $y_t$, generate a critique $h_t$, and propose $y_{t+1}\sim\pi(\cdot\mid x,y_t,h_t)$. A development-frozen accept rule chooses whether to replace the incumbent. Accepting every confident critique can destroy a correct answer; accepting only increased proxy score can overfit the scorer. Keeping the best verified incumbent makes sense only if “verified” names a genuine deployment-available property. Otherwise the incumbent is merely best-scored under a fallible proxy.


```figure
{
  "id": "fig-38.21",
  "kind": "chart",
  "title": "Randomization fills a deterministic gap",
  "caption": "Eq.38.15 example has cheap cost1 utility0 and expensive cost3 utility1. The plotted randomized utility for B in[1,3] is(B−1)/2; deterministic B2 utility is0.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.15",
  "alt": "Eq.38.15 example has cheap cost1 utility0 and expensive cost3 utility1. The plotted randomized utility for B in[1,3] is(B−1)/2; deterministic B2 utility is0. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "expected budget",
      "domain": [
        1,
        3
      ]
    },
    "y": {
      "label": "randomized utility",
      "domain": [
        0,
        1
      ]
    },
    "series": [
      {
        "id": "n0",
        "label": "Randomized relaxation",
        "formula": "(x-1)/2",
        "sample": {
          "from": 1,
          "to": 3,
          "count": 101
        },
        "emphasis": true
      }
    ],
    "annotations": [
      {
        "x": 2,
        "y": 0.5,
        "label": "Randomized optimum1/2"
      },
      {
        "x": 2,
        "y": 0,
        "label": "Deterministic optimum0"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] **Mode reward and length.** Suppose correct answers in modes1 and2 receive $b_1\gamma_1^L$ and $b_2\gamma_2^L$ with positive bases and distinct discounts. Their intersection is

$$
L^*=\frac{\log(b_1/b_2)}{\log(\gamma_2/\gamma_1)}.
$$
*(Eq. 38.18)*

For the inspected three-mode recipe, exact discount construction using bases1.3/1.2/1 and caps1024/3000 places the first intersection at1024. The printed rounded run discounts0.99984/0.99994 instead imply approximately800.4. These are different numerical specifications; unrounded run values are needed to reconcile them. Neither reward intersection guarantees an optimal task-difficulty router. A reward surface is an incentive, while actual routing depends on correctness probabilities and training dynamics. [R38.2](references.md)

[MATHEMATICALLY-DERIVED] For controller state $s$, terminal utility $U_{\rm stop}(s)$ and admitted action $a$, a finite-horizon value recursion is

$$
V_k(s,b)=\max\left\{U_{\rm stop}(s),\ \max_{a:u(a)\le b}\mathbb E[V_{k-1}(s',b-c(a))-\lambda c(a)]\right\},\quad V_0=U_{\rm stop}.
$$
*(Eq. 38.19)*

Here the remaining budget $b$ is scalar for clarity, actual costs satisfy their reservation bounds, and $s'$ includes the action outcome. A greedy marginal-gain rule is optimal only under additional structure; future information can have option value. A learned approximation must preserve the hard admission guard even if its value estimates are wrong.

## Algorithm

**Algorithm 38.5 — Hard-capped revision with a frozen stopping rule.** Inputs are an initial optional incumbent, nonnegative integer action cap $K$, finite run deadline, action menu, immutable evaluator/scorer identities, hard resource ceiling and enforceable per-action bounds. Ground-truth test labels are inaccessible to the controller. State is history $H$, remaining budget $b$, incumbent set $Y$ and action index $t$.

$$
\begin{aligned}
1.\;&t\gets0;\ b\gets B;\ H\gets\varnothing;\ Y\gets\begin{cases}\varnothing&y_0=\bot,\\\mathrm{AdmitKnownInitial}(y_0)&\text{otherwise}.\end{cases}\\
2.\;&\textbf{while }t<K\land\mathrm{BeforeDeadline}:\quad
 s\gets(x,H,Y,b);\ a\gets\hat\mu(s).\\
3.\;&a=\mathrm{STOP}\Rightarrow\textbf{break};\quad
 \neg\mathrm{Authorized}(a)\lor u(a)>b\Rightarrow
 [H\gets H\cup\{\mathrm{DENIED}(t,a)\};\ \textbf{break}].\\
4.\;&\iota\gets\mathrm{UniqueID}(t,a);\ \mathrm{Reserve}(\iota,u(a));\quad
 (o,z,c)\gets\mathrm{ExecuteCapped}(a,s);\ b\gets b-c.\\
5.\;&H\gets H\cup\{(\iota,a,o,z,c,b)\};\ \mathrm{ReleaseUnused}(\iota);\quad
 z=\mathrm{COMPLETE}\land\mathrm{Admissible}(o)\Rightarrow Y\gets Y\cup\{(\iota,o)\}.\\
6.\;&t\gets t+1;\quad\mathrm{UnknownScore}(o)\Rightarrow
 \mathrm{RetainWithoutPromoting}(Y,\iota);\quad
 z=\mathrm{COMPLETE}\land\mathrm{Admissible}(o)\land\mathrm{KnownFiniteScore}(o)\Rightarrow\mathrm{UpdateIncumbentFrozen}(Y,H).\\
7.\;&Y_{\rm eligible}\gets\{y\in Y:\mathrm{Admissible}(y)\land\mathrm{KnownFiniteScore}(y)\};\\
8.\;&Y_{\rm eligible}=\varnothing\Rightarrow\textbf{return }(\mathrm{ABSTAIN},H,B-b);\quad
 \textbf{return }(\mathrm{SelectIncumbentFrozen}(Y_{\rm eligible}),H,B-b).
\end{aligned}
$$

[DERIVED] Admissible means structurally valid under the declared task interface, not known semantically correct. All scoring or critique calls requiring compute occur as budgeted actions before selection; the final local selection allowance is reserved. Initial candidates carry previously consumed work in the experiment total. The cap and deadlines guarantee termination, while nonnegative $c\le u(a)\le b$ preserves the hard resource ceiling. Errors consume work and do not become fabricated negative correctness labels. With no valid incumbent, stopping returns ABSTAIN.

## Implementation

[DERIVED] Separate offline utility estimation from deployment routing. Constructing labels for every prompt-action pair can cost far more than running the eventual policy. A feature extractor that calls an LLM also has an inference cost. Freeze extraction and classification together, and use lineage-separated training and evaluation tasks. A classifier trained on oracle labels derived from evaluation outputs leaks outcome information even if the final input contains only prompt features.

[DERIVED] Expected budgets require a declared task measure. A router calibrated to many easy arithmetic questions can exceed its target after a hard-task shift. A hard cap enforces a different policy and can reduce quality by denying the router's preferred action. Tail constraints need their own measurement or risk model. For nonnegative cost, Markov's inequality only gives $P(C\ge t)\le E[C]/t$; an average bound alone is generally too loose for a useful p99 service objective.


```figure
{
  "id": "fig-38.22",
  "kind": "memory-stack",
  "title": "Preparation calls precede deployment",
  "caption": "R38.1 AppendixE uses48 responses for each of200 prompts per model/dataset setting:9,600 generation calls. The feature pass adds200 calls. Call counts do not imply equal token or accelerator cost; four reported settings multiply the response-pool work.",
  "placement": "rail",
  "evidence": "PAPER-REPORTED",
  "source": "R38.1",
  "alt": "A stacked call-count bar contains9600 oracle-response generations and200 feature calls for one200-prompt setting. These are preparation calls, not free deployment features and not a normalized FLOP or time measure.",
  "spec": {
    "format": "integer",
    "variables": {
      "P": 200,
      "N": 48
    },
    "bars": [
      {
        "label": "One preparation setting",
        "segments": [
          {
            "label": "Oracle responses",
            "formula": "P*N",
            "kind": "model"
          },
          {
            "label": "Feature passes",
            "formula": "P",
            "kind": "process"
          }
        ]
      }
    ]
  },
  "anchor": "formulation"
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] Two inspected studies implement different allocation interfaces. [R38.1](references.md), [R38.2](references.md)

| Field | Prompt-only AdaCompute | Learned mode routing |
|---|---|---|
| Model/data | DeepSeekV3, GPT4o-mini, Qwen2.5-7B;200-question settings | R1-Distill-Qwen1.5B; MATH-lighteval/MATH500 |
| Label/optimization | 48 draws/question; budgets1/2/4/8/16; window majority; XGBoost100/depth5/lr0.1 | GRPO mean-centering; token-mean loss; Adam1e-6;G8;90steps |
| Split/replication | 80/20; three split seeds | Three training seeds; validation every10steps;4H100 |
| Actual observation | DeepSeek MATH B2: accuracy0.562, consumed budget1.87; fixed2:0.517 | MATH accuracy0.782 versus base0.796; lengths2810 versus4743; Table5 |
| Boundary | Entropy feature costs one model pass; expected mixing; hardware/precision NOT-DISCLOSED | Train caps1024/3000; global16384; validation uncapped; warmup specification inconsistent |

[DERIVED] The first protocol reuses a finite response pool to estimate several action utilities; those estimates are correlated across budgets. The second changes routing, reward shaping, caps and training together. Its final table demonstrates an accuracy/token tradeoff, not strict quality-preserving dominance. No matched deployment-cost comparison between these two studies is asserted.

## Observations

**What the paper claims.** [PAPER-REPORTED] AdaCompute learns a low-cost approximation to price-oracle labels; mode routing learns distinct response-length behaviors. [R38.1](references.md), [R38.2](references.md)

**What the evidence shows.** [PAPER-REPORTED] Both studies report bounded-protocol allocation effects. Their deployment budgets and quality costs differ, and the mode study includes a negative binary-router collapse result. [R38.2](references.md) AppendixA.

**What we infer.** [MATHEMATICALLY-DERIVED] Oracle imitation, expected-budget feasibility and constrained optimality are distinct properties. Equations38.15–38.17 identify the additional relaxation and slack assumptions required.

**What remains unknown.** [NOT-DISCLOSED] Unrounded mode discounts, one reconciled warmup protocol, source-complete extraction cost and transferable tail guarantees remain unavailable in the inspected evidence.

## Failure modes

[DERIVED] A router can collapse to one mode when rewards or task difficulty provide no useful separation. Forced routing warmup is an intervention, not ordinary sampling of the routing action. A balance correction can alter the optimized objective; the source's actual outcome gates and wrong-Long exemption must be retained rather than replaced by an ungated formula. An expected-budget oracle can leave useful budget unspent at an unsuitable price. Repeated development feedback can overfit a stopping threshold even when the feedback is only binary.


```figure
{
  "id": "fig-38.23",
  "kind": "compare",
  "title": "Budget guarantees are different",
  "caption": "An average bound, a tail objective and a hard admission cap have different obligations.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.19",
  "alt": "An average bound, a tail objective and a hard admission cap have different obligations. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Expected budget"
      },
      {
        "id": "n1",
        "label": "Tail objective"
      },
      {
        "id": "n2",
        "label": "Hard cap"
      }
    ],
    "rows": [
      {
        "dimension": "Constraint",
        "values": {
          "n0": "Population mean",
          "n1": "Quantile / exceedance",
          "n2": "Every admitted run"
        }
      },
      {
        "dimension": "Required evidence",
        "values": {
          "n0": "Task measure + average",
          "n1": "Load + tail samples",
          "n2": "Enforceable reservation"
        }
      },
      {
        "dimension": "Main gap",
        "values": {
          "n0": "Distribution shift",
          "n1": "Sparse tail uncertainty",
          "n2": "Denied useful work"
        }
      }
    ]
  }
}
```


## Siblings

[DERIVED] §38.1 owns resource units and admission. §38.2 owns complete-candidate aggregation; §38.3 owns tree-frontier control. Chapter35 owns GRPO estimator semantics, including mean-centering and normalization. §38.6 owns independent frontier evaluation and offline amortization.

## Extensions

### Improvements

[DERIVED] Learn marginal action value on development-only outcomes, with confidence intervals and extraction cost. Distinguish deployable observations from privileged oracle labels. Add a hard-cap wrapper around an expected-budget router and report the wrapper's denial rate and quality impact. For finite action sets, recover randomized mixtures explicitly and retain their random seeds; do not claim a deterministic policy exactly hits every budget. Use an untouched final audit after all thresholds and mixtures are frozen.


```figure
{
  "id": "fig-38.24",
  "kind": "cycle",
  "title": "A bounded revision loop preserves its incumbent",
  "caption": "Algorithm38.5 admits critique/revision/checking before execution. Only complete admissible candidates with known finite scores can replace the incumbent. Stop, denial or error retains charged work; the independent final audit never feeds this loop.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.19",
  "alt": "An incumbent leads to authorized critique, budget-admitted revision, a frozen proxy check and a stop-or-promote gate. Eligible promotion returns to the incumbent stage. A finite action cap and deadline bound the loop; final audit labels are outside it.",
  "spec": {
    "stages": [
      {
        "id": "n0",
        "kind": "state",
        "label": "Incumbent",
        "sub": "Optional; empty can abstain"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Authorized critique",
        "sub": "No final audit labels"
      },
      {
        "id": "n2",
        "kind": "model",
        "label": "Admitted revision",
        "sub": "Reserve before execution"
      },
      {
        "id": "n3",
        "kind": "metric",
        "label": "Frozen proxy check",
        "sub": "Complete / admissible / known"
      },
      {
        "id": "n4",
        "kind": "branch",
        "label": "Stop or promote",
        "sub": "Finite cap and deadline"
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
        "to": "n0",
        "kind": "feedback",
        "label": "Eligible promotion"
      }
    ]
  }
}
```


## Limitations

[DERIVED] Utility tables are noisy and distribution-dependent. LP duality describes the stated finite randomized program, not arbitrary learned controllers or per-query service guarantees. The value recursion presupposes a transition model that real systems only approximate. A plausible critique, a longer answer and a low routing entropy are not evidence of causal reasoning quality.

## Reproducibility

[DERIVED] Publish action definitions, utility-estimation pools, oracle prices, tie rules, mixture weights, feature extraction versions, training/split seeds, caps, validation differences and all deployment denials. Report offline label and feature cost separately and in amortized totals. Include both deterministic counterexamples and the corrected slack inequality in the artifact's mathematical audit.

## References

[R38.1](references.md) §§2–5 and AppendicesB.4,C.4,E–H; [R38.2](references.md) Method and AppendicesA–D. Counterexamples, corrected Eq.38.17 and Algorithm38.5 are book-derived and deliberately do not inherit unqualified source optimality claims.
