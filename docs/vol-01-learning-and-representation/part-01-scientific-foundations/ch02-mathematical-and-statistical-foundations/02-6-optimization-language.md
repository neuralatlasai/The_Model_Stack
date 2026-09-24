---
id: ms.section.2.6
entity_type: section
title: Optimization language
short_title: Optimisation language
volume: 1
part: 1
chapter: 2
section: 2.6
slug: 02-6-optimization-language
parent: ms.chapter.2
prev_sibling: ms.section.2.5
next_sibling: ms.verification.2
children: []
prerequisites: [ms.section.1.1, ms.section.1.5, ms.section.2.4, ms.section.2.5]
downstream: [ms.section.6.5, ms.section.21.2, ms.section.21.5, ms.section.29.6, ms.section.44.6, ms.section.48.5]
related: [ms.section.34.1]
siblings_by_mechanism: []
relations:
  - {type: prerequisite_of, target: ms.section.6.5}
  - {type: prerequisite_of, target: ms.section.21.2}
  - {type: supported_by, target: paper.P09}
  - {type: supported_by, target: paper.P08}
axes: {lifecycle: [pretraining, serving, evaluation], mechanism: [constrained_optimization, pareto, sensitivity], feedback_setting: [], modality: [text]}
papers: [P08, P09]
implementations: []
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, ASSUMED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 02.6 Optimization language

## Scope

Objective: fix the vocabulary in which design decisions are stated — decision variables, constraints, Lagrangians and their multipliers, Pareto frontiers, sensitivity analysis, and uncertainty propagation — so that Chapter 01's "constrained optimisation problem" can be written down and its solution's fragility computed. Baseline: a design chosen by scalarising quality and cost with an unstated weight. Success: every allocation decision in the book (N vs D, batch vs latency, precision vs accuracy, engine configuration) names its variables, constraints, binding multipliers, and the uncertainty of its inputs. Boundaries: fixed-budget frontier comparisons in evaluation are [§06.5](../ch06-experimental-design-and-evaluation-before-optimization/06-5-quality-resource-frontiers.md); compute-optimal fits are [§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md); serving economics are [§48.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-5-economics.md).

## Why this exists

What failed: decisions were presented as points — "train this size on this many tokens", "serve at this batch" — without the constraint that made them optimal or the sensitivity that would make them wrong. The bottleneck: constraints (compute, HBM, latency SLO, money) change between the paper and the reader, and a point optimum does not transfer; only the *rule* — the multiplier condition — transfers. The dominant constraint: uncertainty in the fitted inputs (scaling exponents, cost coefficients) that propagates into the decision. What changed: decisions are stated as optimisation problems with named multipliers, frontiers instead of scalarised winners, and propagated uncertainty.

## Intuition

Physically, a Lagrange multiplier is a price: the marginal loss reduction per unit of extra compute, the marginal quality per millisecond of latency. Two designs at different prices are not comparable by a single number; they are two points on a frontier, and the frontier is what an engineer must see to choose. Sensitivity analysis asks how far the optimum moves when an input moves; uncertainty propagation asks how wide the interval on the optimum is when the input has an interval. No cognitive analogy is used.

## Formulation

> **Definition — decision variable, Lagrangian, KKT conditions.** For decision variables x ∈ ℝᵏ, objective f, inequality constraints g_i(x) ≤ b_i and equalities h_j(x) = 0, the Lagrangian is ℒ(x, λ, ν) = f(x) + Σ_i λ_i (g_i(x) − b_i) + Σ_j ν_j h_j(x), and the KKT conditions are its first-order optimality conditions.

$$
\min_{x} f(x) \;\; \text{s.t.}\;\; g_i(x) \le b_i,\; h_j(x) = 0; \qquad \mathcal{L}(x,\lambda,\nu) = f(x) + \sum_i \lambda_i\big(g_i(x) - b_i\big) + \sum_j \nu_j h_j(x)
$$
*(Eq. 2.24)* where λ_i ≥ 0, ν_j free; the subscripted λ_i here are multipliers, local to this section and distinct from the loss weight λ and the arrival rate λ of notation.md.

$$
\nabla_x \mathcal{L} = 0, \quad g_i(x) \le b_i, \quad \lambda_i \ge 0, \quad \lambda_i\big(g_i(x) - b_i\big) = 0; \qquad \frac{\partial f^{*}}{\partial b_i} = -\lambda_i^{*}
$$
*(Eq. 2.25)* where f* = optimal value as a function of the constraint levels; the last identity (the sensitivity theorem) holds under standard regularity and identifies −λ_i* as the shadow price of constraint i.

> **Definition — shadow price.** ∂f*/∂b_i: the marginal change of the optimal objective per unit relaxation of constraint i.

For the compute-allocation problem of Chapter 21 with loss form Eq. N.3 and C ≈ 6ND:

$$
\min_{N,D}\; E + A N^{-\alpha} + B D^{-\beta} \;\text{ s.t. }\; 6ND = C \quad\Longrightarrow\quad \alpha A N^{-\alpha} = \beta B D^{-\beta},\;\; N^{*} \propto C^{\beta/(\alpha+\beta)},\;\; D^{*} \propto C^{\alpha/(\alpha+\beta)}
$$
*(Eq. 2.26)* where N, D, C, E, A, B, α, β are as in notation.md Eq. N.3; the accounting assumptions of C ≈ 6ND apply.

```figure
id: fig-2.30
kind: calculator
title: Compute-optimal growth rule and its sensitivity to the exponents
caption: >-
  Eq. 2.26 as a growth rule: multiplying compute by k = C/C₀ multiplies N* by
  k^(β/(α+β)) and D* by k^(α/(α+β)), and the two multiply back to k because
  6ND = C. The last output is the first-order change in N*'s growth when the
  fitted exponents are off by (δα, δβ): the Mechanism's lever arm, written
  relative to a fitted budget C₀ so that the constant cancels. Illustrative
  α and β; P09's fitted values and their covariance are not used.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.26", "DERIVED:eq-2.27"]
alt: >-
  Calculator for Eq. 2.26 with inputs α, β, compute multiple k = C/C₀ and
  exponent errors δα and δβ. At α = β = 0.3 both exponents are 0.5, so 100
  times the compute gives 10 times N* and 10 times D*, whose product is 100.
  With δβ = 0.02 the growth of N* is off by a factor 1.080 at k = 100, 1.166
  at k = 10^4 and 1.259 at k = 10^6. At α = 0.3, β = 0.2 the exponents are
  0.4 and 0.6; 10^4 times the compute gives 39.8 times N* and 251 times D*,
  and δβ = 0.02 shifts N*'s growth by a factor 1.247. Illustrative
  exponents, not a published fit.
spec:
  tex: >-
    \alpha A N^{-\alpha} = \beta B D^{-\beta},\quad N^{*} \propto C^{\beta/(\alpha+\beta)},\quad D^{*} \propto C^{\alpha/(\alpha+\beta)},\quad \delta \ln N^{*} \approx \ln k\,\frac{\alpha\,\delta\beta - \beta\,\delta\alpha}{(\alpha+\beta)^{2}}
  inputs:
    - { symbol: alpha, label: "α, parameter exponent", default: 0.3, min: 0.1, max: 0.6, step: 0.01, format: fixed2 }
    - { symbol: beta, label: "β, data exponent", default: 0.3, min: 0.1, max: 0.6, step: 0.01, format: fixed2 }
    - { symbol: k, label: "compute multiple k = C/C₀", default: 100, min: 1, max: 1000000, scale: log10, format: raw }
    - { symbol: da, label: "error δα in the fitted α", default: 0, min: -0.05, max: 0.05, step: 0.005, format: fixed3 }
    - { symbol: db, label: "error δβ in the fitted β", default: 0, min: -0.05, max: 0.05, step: 0.005, format: fixed3 }
  outputs:
    - { symbol: aN, label: "N* exponent β/(α + β)", formula: "beta/(alpha + beta)", format: fixed3 }
    - { symbol: aD, label: "D* exponent α/(α + β)", formula: "alpha/(alpha + beta)", format: fixed3 }
    - { symbol: gN, label: "N* grows by k^aN", formula: "k^aN", format: ratio }
    - { symbol: gD, label: "D* grows by k^aD", formula: "k^aD", format: ratio }
    - { symbol: chk, label: "product, = k because 6ND = C", formula: "gN*gD", format: raw }
    - { symbol: sh, label: "first-order error in N* growth", formula: "exp(ln(k)*(alpha*db - beta*da)/(alpha + beta)^2)", format: ratio, emphasis: true }
  presets:
    - { label: "δβ = 0.02, k = 10⁴", values: { db: 0.02, k: 10000 } }
    - { label: "α = 0.3, β = 0.2", values: { beta: 0.2 } }
states:
  - { anchor: formulation, label: "α = β, k = 100", variables: { alpha: 0.3, beta: 0.3, k: 100, da: 0, db: 0 }, highlight: [aN, aD, gN, gD], note: "α = β gives exponents 1/2: 100× compute is 10× parameters and 10× tokens, P09's 'scaled equally' as a corollary of Eq. 2.26." }
  - { anchor: mechanism, label: "δβ = 0.02, k = 10⁴", variables: { alpha: 0.3, beta: 0.3, k: 10000, da: 0, db: 0.02 }, highlight: [db, k, sh], note: "An error of 0.02 in β moves N*'s growth over 10⁴× compute by 17 %: ln k multiplies every exponent error." }
  - { anchor: experimental-design, label: "k = 10⁶", variables: { alpha: 0.3, beta: 0.3, k: 1000000, da: 0, db: 0.02 }, highlight: [k, sh], note: "Six decades past the pilot budget the same error is 26 %: the prediction that the interval on N* widens with log C." }
  - { anchor: failure-modes, label: "α ≠ β, unpropagated", variables: { alpha: 0.3, beta: 0.2, k: 10000, da: 0, db: 0.02 }, highlight: [aN, gN, gD, sh], note: "α = 0.3, β = 0.2: 10⁴× compute is 39.8× parameters and 251× tokens, and δβ = 0.02 shifts N* by 25 %. A point N* to three figures hides this." }
```

> **Definition — Pareto dominance / Pareto frontier.** For objectives to be maximised q(x) and minimised c(x), x dominates x′ if q(x) ≥ q(x′) and c(x) ≤ c(x′) with at least one strict; the frontier is the set of non-dominated x.

> **Definition — sensitivity analysis.** Local: derivatives of the optimum or prediction with respect to inputs (∂x*/∂p, ∂f*/∂p via Eq. 2.25 or the envelope theorem). Global: variation of inputs over their ranges or distributions.

> **Definition — delta-method uncertainty propagation.** For inputs X with mean μ and covariance Σ and a differentiable g,

$$
\operatorname{Var}\big[g(X)\big] \approx \nabla g(\mu)^{\top}\,\Sigma\,\nabla g(\mu); \qquad \text{for a ratio } g = U/W:\;\; \frac{\operatorname{Var}(g)}{g^2} \approx \frac{\operatorname{Var}(U)}{U^2} + \frac{\operatorname{Var}(W)}{W^2} - \frac{2\operatorname{Cov}(U,W)}{UW}
$$
*(Eq. 2.27)* where the ratio form applies directly to cost per accepted task (notation.md §2.10), U = total cost, W = accepted tasks.

> **Assumption.** Objectives and constraints are differentiable and the optimum is regular (constraint qualification holds) · *sensitivity:* at kinks (e.g. memory-capacity cliffs, batch-size steps) the multiplier is set-valued and Eq. 2.25's derivative becomes a one-sided bound.

## Mechanism

<details><summary>Derivation of Eq. 2.26</summary>

ℒ = A N^{−α} + B D^{−β} + ν(6ND − C). Stationarity: ∂ℒ/∂N = −αA N^{−α−1} + 6νD = 0 and ∂ℒ/∂D = −βB D^{−β−1} + 6νN = 0. Eliminating ν: αA N^{−α−1}/D = βB D^{−β−1}/N, hence αA N^{−α} = βB D^{−β}: at the optimum the two reducible-loss terms stand in the fixed ratio β/α. Substituting D = C/(6N) gives αA N^{−α} = βB (6N/C)^{β}, so N^{α+β} ∝ C^{β} and N* ∝ C^{β/(α+β)}; then D* = C/(6N*) ∝ C^{α/(α+β)}. When α = β the exponents are both 1/2, i.e. N and D scale in equal proportion with C.

</details>

**What the fitted inputs are and what they cost to trust.** P09 estimates compute-optimal allocation by three approaches, the third fitting the parametric form "L(N,D) = E + A/N^α + B/D^β" with a Huber loss minimised by L-BFGS, and its abstract states that "for compute-optimal training, the model size and the number of training tokens should be scaled equally" [PAPER-REPORTED · P09]. Eq. 2.26 shows that this conclusion is the statement α ≈ β under the fitted form; P09 also reports that its three approaches yield differing exponent estimates [PAPER-REPORTED · P09], which is exactly the input uncertainty that Eq. 2.27 must propagate into N*: since log N* = (β/(α+β)) log C + const, a perturbation (δα, δβ) moves log N* by (log C)(α δβ − β δα)/(α+β)² to first order, and the lever arm log C grows with the budget [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27]. P08 reports power-law dependence of loss on model size, dataset size, and compute over "more than seven orders of magnitude" and a different allocation conclusion under its own accounting [PAPER-REPORTED · P08]; the disagreement between P08 and P09 is a disagreement about fitted inputs and constraints, not about Eq. 2.26, and is developed in [§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md). The parameter covariance Σ of published fits is NOT-DISCLOSED in the reports inspected, so the propagation can be carried out only on the reader's own fits ([§21.5](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md)), where the bootstrap of §02.5 over pilot runs (each run a cluster) supplies Σ at a cost of R refits.

**Why scalarisation loses frontier points.** Minimising c(x) − w·q(x) for a weight w > 0 recovers only points where a supporting line touches the frontier, i.e. the convex hull; a frontier point inside a concave region is never the minimiser for any w. The ε-constraint form (maximise q subject to c ≤ ε, sweeping ε) recovers every frontier point, at the cost of one constrained solve per ε [MATHEMATICALLY-DERIVED]. This is why [§06.5](../ch06-experimental-design-and-evaluation-before-optimization/06-5-quality-resource-frontiers.md) compares at fixed quality, fixed latency, fixed compute, or fixed cost rather than by a weighted score, and why a "cost-adjusted" leaderboard score encodes an unstated w.

```figure
id: fig-2.31
kind: chart
title: Which frontier points a weighted score can select
caption: >-
  Two Pareto frontiers in (cost c ↓, quality q ↑), each made only of
  non-dominated points. The frontier q = √c bows outward: every point
  minimises c − w·q for some weight w, and the dashed supporting line for
  w = 1 touches it at c = 1/4. The frontier q = c² bows inward, the whole of
  it a "concave region" in the Mechanism's sense: its chord q = c lies above
  every interior point, so c − w·q is minimised only at the two ends,
  whatever w is. The ε-constraint sweep, maximise q subject to c ≤ ε,
  recovers every point of both. Geometry only; no system is plotted.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:alg-2.6"
alt: >-
  Line chart of normalised quality q against normalised cost c from 0 to 1.
  The frontier q = √c bows outward; the dashed line q = c + 1/4, the
  supporting line of weight w = 1, touches it at c = 0.25, q = 0.5, the point
  a weighted score with w = 1 selects. The frontier q = c² bows inward; the
  dashed chord q = c joins its ends and lies above every interior point, for
  example above (0.5, 0.25), so no weight selects an interior point of this
  frontier; only c = 0 or c = 1 can be chosen.
spec:
  type: line
  x: { label: "cost c, normalised (lower is better)", scale: linear, format: fixed2, domain: [0, 1] }
  y: { label: "quality q, normalised (higher is better)", scale: linear, format: fixed2, domain: [0, 1.25] }
  series:
    - { id: outward, label: "frontier q = √c, bows outward: all supported", formula: "sqrt(x)", sample: { from: 0, to: 1, count: 41 }, emphasis: true }
    - { id: support, label: "supporting line, w = 1: q = c + 1/4", formula: "x + 0.25", sample: { from: 0, to: 1, count: 2 }, dashed: true }
    - { id: inward, label: "frontier q = c², bows inward: ends only", formula: "x^2", sample: { from: 0, to: 1, count: 41 } }
    - { id: chord, label: "chord q = c", formula: "x", sample: { from: 0, to: 1, count: 2 }, dashed: true }
  annotations:
    - { x: 0.25, label: "w = 1 selects c = 1/4, q = 1/2" }
    - { x: 0.5, label: "(0.5, 0.25): no w selects it" }
```

**Sensitivity in systems decisions.** For serving, the decision variables are batch size, precision, parallelism degree, and cache policy; the constraints are HBM capacity (Eq. N.8), p99 latency, and cost; the multipliers on the latency constraint are the price of quality in milliseconds, and [§44.6](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch44-scheduling-distributed-serving-and-disaggregation/44-6-load-adaptation.md) and [§48.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-5-economics.md) develop them. Cost per accepted task is a ratio, and Eq. 2.27's ratio form shows that its relative uncertainty is at least the relative uncertainty of the acceptance count — which is a Bernoulli mean whose interval §02.5 supplies [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27]. Cost of the analyses: local sensitivity is one gradient (or the multipliers, free at the optimum); delta-method propagation is one gradient of g and a k×k covariance; Monte Carlo propagation is n evaluations of g, which for g = "re-solve the allocation" is n constrained solves.

```figure
id: fig-2.32
kind: diagram
title: A serving configuration written as a constrained problem
caption: >-
  The serving decision of this paragraph in the vocabulary of Eq. 2.24:
  four decision variables on the left, three constraints in the middle, and
  one multiplier per constraint. Follow the emphasised path: the latency
  constraint's multiplier is the price of quality in milliseconds, and by
  Eq. 2.25 it is also ∂f*/∂b for that constraint. The dashed cliff is where
  the multiplier stops being a derivative and becomes a one-sided bound.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.24", "DERIVED:eq-2.25", "DERIVED:eq-2.27"]
alt: >-
  Left-to-right diagram. Decision variables batch size, precision b,
  parallelism degree and cache policy feed three constraints: HBM capacity
  (Eq. N.8) from batch, precision and cache policy; p99 latency from batch
  and parallelism; and cost per accepted task, a ratio U/W whose uncertainty
  follows Eq. 2.27, from parallelism. Precision also affects quality, the
  objective, which carries an interval from §02.5. Each constraint feeds the
  multipliers λ_i ≥ 0 with complementary slackness (Eq. 2.25); the
  emphasised path runs from the latency constraint through the multipliers
  to the shadow prices ∂f*/∂b_i = −λ_i*, the price of quality per
  millisecond. Sweeping the constraint levels traces the quality–cost
  frontier of Algorithm 2.6. A dashed constraint-cliff node marks the HBM
  constraint as non-smooth, where the multiplier is one-sided.
spec:
  direction: LR
  nodes:
    - { id: bs, kind: state, label: "batch size", group: dv }
    - { id: prec, kind: state, label: "precision b", group: dv }
    - { id: par, kind: state, label: "parallelism degree", group: dv }
    - { id: cp, kind: state, label: "cache policy", group: dv }
    - { id: hbm, kind: memory, label: "HBM capacity", sub: "Eq. N.8", group: con }
    - { id: lat, kind: metric, label: "p99 latency SLO", group: con }
    - { id: cost, kind: metric, label: "cost per accepted task", sub: "ratio U/W; uncertainty by Eq. 2.27", group: con }
    - { id: q, kind: objective, label: "quality", sub: "with its §02.5 interval" }
    - { id: lam, kind: node, label: "multipliers λ_i ≥ 0", sub: "λ_i(g_i − b_i) = 0, Eq. 2.25" }
    - { id: price, kind: metric, label: "shadow prices ∂f*/∂b_i = −λ_i*", sub: "quality per ms, per GiB, per unit cost", emphasis: true }
    - { id: front, kind: boundary, label: "quality–cost frontier", sub: "Algorithm 2.6, with ambiguous set U" }
    - { id: cliff, kind: dependency, label: "constraint cliff", sub: "KV cache over HBM by one sequence" }
  edges:
    - { from: bs, to: hbm }
    - { from: prec, to: hbm }
    - { from: cp, to: hbm }
    - { from: bs, to: lat }
    - { from: par, to: lat }
    - { from: par, to: cost }
    - { from: prec, to: q, kind: dependency, label: "precision vs accuracy" }
    - { from: hbm, to: lam }
    - { from: lat, to: lam, kind: emphasis }
    - { from: cost, to: lam }
    - { from: lam, to: price, kind: emphasis }
    - { from: price, to: front, label: "sweep b_i" }
    - { from: q, to: front }
    - { from: cliff, to: hbm, kind: dependency, label: "multiplier one-sided" }
  groups:
    - { id: dv, label: "decision variables x" }
    - { id: con, label: "constraints g_i(x) ≤ b_i" }
```

```figure
id: fig-2.33
kind: calculator
title: Relative uncertainty of cost per accepted task
caption: >-
  Eq. 2.27's ratio form for g = U/W, total cost over accepted tasks, with W
  a binomial count of n attempts at acceptance rate a, so
  Var(W)/W² = (1 − a)/(n·a). With U fixed or uncorrelated with W, the
  relative uncertainty of g is at least that of the acceptance count, as the
  Mechanism says; the −2Cov(U, W)/(UW) term can lower it when cost moves
  with acceptances, which the ρ = 0.9 preset shows. Illustrative n, a and
  cost spread, not a measured deployment.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-2.27"
alt: >-
  Calculator for the ratio form of Eq. 2.27 with inputs attempted tasks n,
  acceptance rate a, relative standard deviation of total cost and the
  correlation of cost with accepted tasks. At n = 1024, a = 0.5, a 2 % cost
  spread and zero correlation: 512 accepted tasks, relative SD of W 3.13 %,
  relative SD of cost per accepted task 3.71 %, and a 95 % relative
  half-width of 7.27 %. With fixed cost the SD equals that of W, 3.13 %
  (half-width 6.13 %). At n = 4096 it is 2.54 % (4.97 %). With correlation
  0.9 it falls to 1.59 %, below the acceptance count's own 3.13 %.
spec:
  tex: >-
    \frac{\operatorname{Var}(g)}{g^{2}} \approx \frac{\operatorname{Var}(U)}{U^{2}} + \frac{\operatorname{Var}(W)}{W^{2}} - \frac{2\operatorname{Cov}(U,W)}{UW},\qquad \frac{\operatorname{Var}(W)}{W^{2}} = \frac{1-a}{n\,a}
  equation: "2.27"
  inputs:
    - { symbol: n, label: "attempted tasks n", default: 1024, min: 16, max: 65536, scale: log2, format: integer }
    - { symbol: a, label: "acceptance rate a", default: 0.5, min: 0.05, max: 0.95, step: 0.05, format: percent }
    - { symbol: cU, label: "relative SD of total cost U", default: 0.02, min: 0, max: 0.2, step: 0.005, format: percent }
    - { symbol: r, label: "correlation of U with W", default: 0, min: -0.9, max: 0.9, step: 0.1, format: fixed1 }
  outputs:
    - { symbol: W, label: "accepted tasks W = n·a", formula: "n*a", format: integer }
    - { symbol: cW, label: "relative SD of W", formula: "sqrt((1 - a)/(n*a))", format: percent }
    - { symbol: cg, label: "relative SD of g = U/W", formula: "sqrt(cU^2 + cW^2 - 2*r*cU*cW)", format: percent, emphasis: true }
    - { symbol: hw, label: "95 % half-width, relative", formula: "1.96*cg", format: percent }
  presets:
    - { label: "fixed cost, cU = 0", values: { cU: 0 } }
    - { label: "n = 4096", values: { n: 4096 } }
    - { label: "cost tracks acceptances, ρ = 0.9", values: { r: 0.9 } }
```

## Algorithm

```text
Algorithm 2.6 — Pareto frontier of (quality ↑, cost ↓) with interval-aware dominance
INPUT   candidates i = 1..n with quality q_i, cost c_i, and quality interval [q_i^lo, q_i^hi] from §02.5
OUTPUT  frontier F (indices), and the set U of candidates that are frontier-ambiguous
STATE   candidates sorted by cost ascending, ties by quality descending; running best quality q_best
INVARIANT after processing candidate i, q_best = max quality among candidates with cost ≤ c_i
1  sort candidates by (c_i ascending, q_i descending)
2  q_best ← −∞;  F ← ∅;  U ← ∅
3  for each candidate i in sorted order:
4      if q_i > q_best:  F ← F ∪ {i};  q_best ← q_i        # strictly non-dominated
5      else if q_i^hi ≥ q_best_lo:  U ← U ∪ {i}            # dominated at point estimates, not at interval level
6  return F, U
```

Complexity: O(n log n) for the sort, O(n) sweep; for more than two objectives the sweep becomes an O(n²) pairwise check or a divide-and-conquer non-dominated sort. Termination: one pass. The set U is reported, not discarded: with §02.5's intervals, a candidate dominated at point estimates but not at the interval level is undecided.

## Implementation

The objects here are tables, not tensors. Implementation consists of (i) recording, for each candidate configuration, the decision variables, the binding constraints, and the measured quality with its interval and cluster count; (ii) storing fitted-input covariance alongside fitted values; and (iii) computing multipliers from the solver or from finite differences of f* in b. Solvers for Eq. 2.24 at the scale of a design table are any general nonlinear-programming routine; the expensive quantities are the evaluations of f and g (training runs, load tests), each of which is a Chapter 21 or Chapter 48 experiment.

## Experimental design

Proposal: fit Eq. N.3 to a pilot grid of training runs by the P09 Approach-3 procedure (Huber loss), bootstrap the fit over runs (Algorithm 2.5 with each run a cluster) to obtain Σ for (α, β, A, B, E), propagate to N* at several C by Eq. 2.27 and by Monte Carlo over the bootstrap replicates, and report the interval on N* against the point allocation. Prediction: the interval widens with log C. Controlled: tokenizer, data mixture, learning-rate schedule, and the definition of C. This is the pilot methodology of [§21.5](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-5-pilot-methodology.md) and is not run here.

## Observations

**What the paper claims.** P09 reports the parametric fit, its fitting procedure, the "scaled equally" allocation rule, and differing exponent estimates across its three approaches; P08 reports power-law scaling across model size, data, and compute [PAPER-REPORTED].

**What the evidence shows.** Eq. 2.24–2.27 are theorems. That P09's allocation rule is a corollary of α ≈ β in Eq. 2.26 is a derivation, not a reported result. The published fits' parameter covariances are not available, so the size of the propagated uncertainty is not established by the sources [NOT-DISCLOSED].

**What we infer.** The book infers (DERIVED) that the allocation decision is more uncertain at larger C by the lever-arm argument, and (ASSUMED) that fit uncertainty rather than the 6ND accounting dominates the decision interval; both are testable by the proposal above.

**What remains unknown.** Whether the exponents are stable across data mixtures, tokenizers, and objectives is UNVERIFIED here and is Chapter 21's subject.

## Failure modes

> **Failure mode — hidden scalarisation.** *Symptom:* a single "efficiency score" ranks designs. *Cause:* an unstated weight w. *Detection:* ask which frontier points the score can never select. *Mitigation:* report the frontier (Algorithm 2.6) and fixed-constraint comparisons.

> **Failure mode — extrapolated multiplier.** *Symptom:* the marginal value of compute quoted far from the fitted range. *Cause:* Eq. 2.25 is local. *Detection:* compare with a re-solve at the new b. *Mitigation:* report the range of validity of the fit.

> **Failure mode — unpropagated fit uncertainty.** *Symptom:* a point N* reported to three significant figures. *Cause:* Σ ignored. *Detection:* absence of an interval. *Mitigation:* Eq. 2.27 or bootstrap-over-runs.

> **Failure mode — constraint cliff.** *Symptom:* a design that is optimal at b and infeasible at b − ε (KV cache exceeds HBM by one sequence). *Cause:* non-smooth constraint. *Detection:* check slack at the optimum. *Mitigation:* margin on b; treat the multiplier as one-sided.

## Siblings

**Lagrangian / KKT (constrained optimum)** — this file. Why it exists: transferable optimality rule. New failure mode: local validity. Changed primitive: point → rule.

**Weighted scalarisation** — this file (as the thing to avoid); applied with stated w in [§48.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-5-economics.md) when cost is the objective. Why it exists: a single number. What assumption changed: a known exchange rate w. New failure mode: misses non-convex frontier points.

**ε-constraint / fixed-budget comparison** — [§06.5](../ch06-experimental-design-and-evaluation-before-optimization/06-5-quality-resource-frontiers.md). Why it exists: recover the whole frontier. What problem it solved: comparisons at fixed quality, latency, compute, or cost. New failure mode: one solve per ε.

**Delta-method propagation** — this file, Eq. 2.27. Why it exists: cheap first-order intervals. What assumption changed: g approximately linear over Σ. New failure mode: wrong for strongly nonlinear g (e.g. N* at large log C). Changed primitive: resampling → gradient.

**Monte Carlo propagation** — this file; bootstrap-over-runs per §02.5. Why it exists: no linearity assumption. New failure mode: n re-solves.

```figure
id: fig-2.34
kind: compare
title: Five ways to state a design decision, by what each returns and costs
caption: >-
  The first three columns turn a design choice into a decision; the last two
  put an interval on it. Read the "frontier coverage" row: only the
  ε-constraint sweep recovers every frontier point, and weighted
  scalarisation is the one column that can never select a point in a
  non-convex region. The cost row prices each in solves or evaluations of
  g, which for an allocation decision are training runs or load tests.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-2.24", "DERIVED:eq-2.25", "DERIVED:eq-2.27", "DERIVED:alg-2.6"]
alt: >-
  Comparison of five formulations. Lagrangian and KKT: returns the optimum
  and its multipliers as prices; assumes differentiability and constraint
  qualification; one solve, multipliers free at the optimum; fails by local
  validity and extrapolated multipliers. Weighted scalarisation (§48.5):
  one point per weight; assumes a known exchange rate; recovers only
  supported, convex-hull points; fails by missing non-convex points and
  hiding w. ε-constraint or fixed-budget comparison (§06.5): one frontier
  point per ε; recovers every point; costs one constrained solve per ε.
  Delta-method propagation: Var[g] ≈ ∇gᵀΣ∇g; assumes g near-linear over Σ;
  one gradient and a k × k covariance; wrong for strongly nonlinear g.
  Monte Carlo propagation (§21.5): the distribution of g over input draws,
  such as a bootstrap over runs; no linearity assumption; n evaluations of
  g, which are n re-solves when g re-solves the allocation.
spec:
  axis: >-
    What each formulation returns about a design decision, what it assumes,
    and what it costs in solves or evaluations of g; no decision is ranked
  columns:
    - { id: kkt, label: "Lagrangian / KKT", node: ms.section.2.6 }
    - { id: scal, label: "Weighted scalarisation", node: ms.section.48.5 }
    - { id: eps, label: "ε-constraint / fixed budget", node: ms.section.6.5 }
    - { id: delta, label: "Delta-method propagation" }
    - { id: mc, label: "Monte Carlo propagation", node: ms.section.21.5 }
  rows:
    - { dimension: "returns", values: { kkt: "x* and multipliers λ*, read as prices", scal: "one point per weight w", eps: "one frontier point per ε", delta: "Var[g] ≈ ∇gᵀ Σ ∇g", mc: "the distribution of g over input draws" } }
    - { dimension: "assumes", values: { kkt: "differentiable f and g; constraint qualification", scal: "a known exchange rate w", eps: "one constrained solve per ε is affordable", delta: "g close to linear over Σ", mc: "draws of the inputs, e.g. a bootstrap over runs" } }
    - { dimension: "frontier coverage", values: { kkt: "not a frontier method: one constrained optimum", scal: "supported, convex-hull points only", eps: "every frontier point", delta: "not applicable", mc: "not applicable" } }
    - { dimension: "cost", values: { kkt: "one solve; multipliers free at the optimum", scal: "one solve per w", eps: "one constrained solve per ε", delta: "one gradient of g and a k × k covariance", mc: "n evaluations of g; n re-solves if g re-solves the allocation" } }
    - { dimension: "new failure mode", values: { kkt: "local validity; extrapolated multipliers", scal: "misses non-convex frontier points; hides w", eps: "one solve per ε", delta: "wrong for strongly nonlinear g, e.g. N* at large log C", mc: "n re-solves" } }
```

## Extensions

For agents the decision variables include tool-call budgets and retry limits and the constraints are cost per accepted task and side-effect bounds ([Chapter 54](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch54-multi-agent-coordination-and-system-level-evaluation/README.md)); for embodiment, a real-time constraint enters as a hard latency bound with an infinite multiplier beyond it ([Chapter 60](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch60-vision-language-action-policies-and-embodied-learning/README.md)). For long context the KV constraint (Eq. N.8) is the one that binds first. Cross-references, not proposals.

## Limitations

Eq. 2.26 depends on the accounting C ≈ 6ND, which notation.md restricts to dense Transformers under stated assumptions; for MoE, long context, or multimodal training the constraint changes and so does the rule. The delta method is first-order. Falsification: an allocation rule that does not move when the fitted α, β move — i.e. a decision insensitive to its inputs — would indicate that the constraint, not the loss fit, is binding, which is itself a reportable finding.

## Reproducibility

Symbols: x, f, g_i, h_j, b_i, λ_i (multipliers, local), ν_j, f*, q, c, Σ, w, ε (local); N, D, C, E, A, B, α, β from notation.md. Every reported decision must state: variables, constraints and their levels, binding multipliers or slack, the fit and its covariance (or NOT-DISCLOSED), and the propagation method. No fit was performed in this edition.

## References

P08, P09. See [references.md](references.md).
