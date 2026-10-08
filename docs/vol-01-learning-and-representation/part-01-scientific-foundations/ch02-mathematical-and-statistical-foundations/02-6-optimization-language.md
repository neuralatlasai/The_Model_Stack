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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 02.6 Optimization language

## Scope

Constrained optimization specifies decision variables, an objective, feasible constraints, and any uncertainty in their inputs. Lagrangians and KKT conditions describe regular stationary solutions; Pareto dominance describes trade-offs without fixing an exchange rate; sensitivity and propagation quantify local or distributional uncertainty in a decision. Evaluation frontiers are developed in [§06.5](../ch06-experimental-design-and-evaluation-before-optimization/06-5-quality-resource-frontiers.md), compute allocation in [§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md), and serving economics in [§48.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-5-economics.md).

## Why this exists

An allocation optimum depends on both the fitted objective and its compute constraint. Changing loss coefficients, scaling exponents, or cost assumptions can change the selected parameters and tokens even if the constrained algebra is unchanged. P09 evaluates three estimation approaches rather than treating one fitted allocation exponent as a mathematical constant [PAPER-REPORTED · P09, §§3.1–3.3]. A deployment frontier similarly depends on measured quality, latency, cost, and the uncertainty associated with each quantity.

## Intuition

At a regular smooth solution, an inequality multiplier gives the negative derivative of the minimized objective with respect to a relaxed constraint bound. Its units are objective units per constraint unit, and the envelope interpretation is local. A Pareto frontier retains non-dominated alternatives; a weighted objective selects only supported alternatives. Propagating a joint distribution of fitted inputs through an allocation rule is distinct from differentiating that rule at one point [MATHEMATICALLY-DERIVED · DERIVED:eq-2.25; DERIVED:eq-2.27].

## Formulation

> **Definition — decision variable, Lagrangian, KKT conditions.** For decision variables x ∈ ℝᵏ, objective f, inequality constraints g_i(x) ≤ b_i and equalities h_j(x) = 0, the Lagrangian is ℒ(x, λ, ν) = f(x) + Σ_i λ_i (g_i(x) − b_i) + Σ_j ν_j h_j(x), and the KKT relations are first-order necessary conditions under a constraint qualification, and sufficient under the convexity conditions stated below.

$$
\min_{x} f(x) \;\; \text{s.t.}\;\; g_i(x) \le b_i,\; h_j(x) = 0; \qquad \mathcal{L}(x,\lambda,\nu) = f(x) + \sum_i \lambda_i\big(g_i(x) - b_i\big) + \sum_j \nu_j h_j(x)
$$
*(Eq. 2.24)* where λ_i ≥ 0, ν_j free; the subscripted λ_i here are multipliers, local to this section and distinct from the loss weight λ and the arrival rate λ of notation.md.

$$
\nabla_x \mathcal{L} = 0, \quad g_i(x) \le b_i, \quad \lambda_i \ge 0, \quad \lambda_i\big(g_i(x) - b_i\big) = 0,\quad h_j(x)=0; \qquad \frac{\partial f^{*}}{\partial b_i} = -\lambda_i^{*}
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
  - { anchor: experimental-design, label: "k = 10⁶", variables: { alpha: 0.3, beta: 0.3, k: 1000000, da: 0, db: 0.02 }, highlight: [k, sh], note: "Six decades past the pilot budget the same error is 26 %: the conditional sensitivity of the growth ratio to exponent error." }
  - { anchor: failure-modes, label: "α ≠ β, unpropagated", variables: { alpha: 0.3, beta: 0.2, k: 10000, da: 0, db: 0.02 }, highlight: [aN, gN, gD, sh], note: "α = 0.3, β = 0.2: 10⁴× compute is 39.8× parameters and 251× tokens, and δβ = 0.02 shifts N* by 25 %. A point N* to three figures hides this." }
```

> **Definition — Pareto dominance / Pareto frontier.** For objectives to be maximised q(x) and minimised c(x), x dominates x′ if q(x) ≥ q(x′) and c(x) ≤ c(x′) with at least one strict; the frontier is the set of non-dominated x.

> **Definition — sensitivity analysis.** Local: derivatives of the optimum or prediction with respect to inputs (∂x*/∂p, ∂f*/∂p via Eq. 2.25 or the envelope theorem). Global: variation of inputs over their ranges or distributions.

> **Definition — delta-method uncertainty propagation.** For inputs X with mean μ and covariance Σ and a differentiable g,

$$
\operatorname{Var}\big[g(X)\big] \approx \nabla g(\mu)^{\top}\,\Sigma\,\nabla g(\mu); \qquad \text{for a ratio } g = U/W:\;\; \frac{\operatorname{Var}(g)}{g^2} \approx \frac{\operatorname{Var}(U)}{U^2} + \frac{\operatorname{Var}(W)}{W^2} - \frac{2\operatorname{Cov}(U,W)}{UW}
$$
*(Eq. 2.27)* where the ratio form applies directly to cost per accepted task (notation.md §2.10), U = total cost, W = accepted tasks.

> **Assumption.** Objectives and constraints are differentiable and the optimum is regular (constraint qualification holds) · *sensitivity:* at kinks or discrete capacity steps, the smooth envelope derivative may fail; a one-sided or generalized derivative requires its own regularity assumptions.

## Mechanism

### Methodology

<details><summary>Derivation of Eq. 2.26</summary>

ℒ = A N^{−α} + B D^{−β} + ν(6ND − C). Stationarity: ∂ℒ/∂N = −αA N^{−α−1} + 6νD = 0 and ∂ℒ/∂D = −βB D^{−β−1} + 6νN = 0. Eliminating ν: αA N^{−α−1}/D = βB D^{−β−1}/N, hence αA N^{−α} = βB D^{−β}: at the optimum the two reducible-loss terms stand in the fixed ratio β/α. Substituting D = C/(6N) gives αA N^{−α} = βB (6N/C)^{β}, so N^{α+β} ∝ C^{β} and N* ∝ C^{β/(α+β)}; then D* = C/(6N*) ∝ C^{α/(α+β)}. When α = β the exponents are both 1/2, i.e. N and D scale in equal proportion with C.

</details>

**What the fitted inputs are and what they cost to trust.** P09's third approach fits final run losses with the positive additive family in Eq. N.3, minimizing Huber residuals in log-loss with L-BFGS and a grid of initializations [PAPER-REPORTED · P09, §3.3, Eqs. (2)–(4); Appendix D.2]. Equation 2.26 is the analytic allocation rule for that fitted family and the stated compute constraint. The three estimation approaches use different summaries of training runs; their exponent differences measure methodological sensitivity rather than contradicting the algebra [MATHEMATICALLY-DERIVED · DERIVED:eq-2.26]. P08 provides the historical comparison, with different empirical allocation conclusions under its modeling and training protocol; full scaling methodology is owned by Chapter 21 [PAPER-REPORTED · P08, §6]. A joint covariance matrix for fitted parameters is NOT-DISCLOSED in the inspected P09 fitting account, preventing a numerical propagation of fit uncertainty from the published point estimates alone.

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

**Sensitivity in systems decisions.** For serving, the decision variables are batch size, precision, parallelism degree, and cache policy; the constraints are HBM capacity (Eq. N.8), p99 latency, and cost; the multipliers on the latency constraint are the price of quality in milliseconds, and [§44.6](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch44-scheduling-distributed-serving-and-disaggregation/44-6-load-adaptation.md) and [§48.5](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-5-economics.md) develop them. Cost per accepted task is a ratio. Its first-order relative uncertainty depends on both numerator and denominator and their covariance; positive covariance can cancel variation, so there is no universal lower bound from the denominator alone [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27]. Cost of the analyses: local sensitivity is one gradient (or the multipliers, free at the optimum); delta-method propagation is one gradient of g and a k×k covariance; Monte Carlo propagation is n evaluations of g, which for g = "re-solve the allocation" is n constrained solves.

```figure
id: fig-2.32
kind: diagram
title: A serving configuration written as a constrained problem
caption: >-
  The serving decision of this paragraph in the vocabulary of Eq. 2.24:
  four decision variables on the left, three constraints in the middle, and
  one multiplier per constraint. Follow the emphasised path: the latency
  constraint's multiplier is the price of quality in milliseconds, and by
  Eq. 2.25 the minimized objective obeys ∂f*/∂b_i = −λ_i* under the envelope conditions. The dashed cliff is where
  the smooth envelope formula can fail; discrete alternatives require direct comparison.
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
  constraint as non-smooth, where smooth sensitivity is not established.
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
    - { id: front, kind: boundary, label: "quality–cost frontier", sub: "point frontier; interval dominance is separate" }
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
    - { from: cliff, to: hbm, kind: dependency, label: "smooth envelope conditions fail" }
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

### KKT conditions and the limits of multipliers

A complete specification distinguishes decision variables from fixed inputs, admissible domains, measured responses, and uncertain model parameters. Discrete batch sizes or device counts have integer domains; differentiating a continuous relaxation does not certify an integer optimum. Equality constraints contribute unrestricted multipliers because a feasible perturbation must remain tangent to their level sets. At a regular smooth local optimum, the active constraint gradients restrict the feasible directions, yielding stationarity with nonnegative inequality multipliers. Linear independence of the active inequality and equality gradients is one sufficient constraint qualification. Without a qualification, a local optimum can exist without a KKT multiplier: minimize $x$ subject to $x^2\le0$. The only feasible point is zero, but stationarity would require $1+\eta\cdot0=0$, impossible for finite $\eta$ [MATHEMATICALLY-DERIVED · DERIVED:eq-2.25].

For differentiable convex $f,g_i$ and affine equalities, a feasible KKT point is globally optimal. To prove this, convexity gives $\mathcal L(x,\eta^*,\nu^*)\ge\mathcal L(x^*,\eta^*,\nu^*)$ from its zero gradient. For any feasible $x$, nonnegative multipliers and $g_i(x)-b_i\le0$ give $f(x)\ge\mathcal L(x,\eta^*,\nu^*)$. Complementarity at $x^*$ gives $\mathcal L(x^*,\eta^*,\nu^*)=f(x^*)$, hence $f(x)\ge f(x^*)$. Nonconvex objectives lose this sufficiency; a stationary point may be a maximum or saddle. Slater's strict-feasibility condition supplies strong-duality and multiplier existence for the appropriate convex setting, rather than certifying arbitrary nonconvex training [MATHEMATICALLY-DERIVED · DERIVED:eq-2.25].

For a perturbation of bound $b_i$, the value function obeys $\partial f^*/\partial b_i=-\eta_i^*$ when it is differentiable and the regular solution branch is tracked. Its units are objective units per constraint unit. Multiple optimizers, active-set switches, or discrete feasibility changes can make the derivative fail to exist. Infeasibility beyond a deadline does not imply an infinite multiplier: infeasible problems have no finite optimal point from which that sensitivity is computed. Likewise, capacity constraints do not universally bind first; the active set is part of the declared workload and design [MATHEMATICALLY-DERIVED · DERIVED:eq-2.25].

### Allocation, dimensionless sensitivity, and uncertainty

Put $u=\log N$, $v=\log D$ using fixed numerical units. The equality constraint becomes $u+v=\log(C/6)$ and the reducible loss becomes $Ae^{-\alpha u}+Be^{-\beta v}$. With positive $A,B,\alpha,\beta$, substituting $v$ gives a strictly convex one-dimensional function; its second derivative is positive. The stationary allocation is therefore the unique interior global optimum for this continuous model. Positivity and an unrestricted positive domain matter; lower/upper bounds on available tokens or allowed model sizes can move the optimum to a boundary [MATHEMATICALLY-DERIVED · DERIVED:eq-2.26].

Including the coefficient rather than only its compute exponent gives

$$
N^*=\left(\frac{\alpha A}{\beta B}\right)^{1/(\alpha+\beta)}\left(\frac C6\right)^{\beta/(\alpha+\beta)},\qquad D^*=\frac{C}{6N^*}.
$$
*(Eq. 2.31)* This is the source-family optimum reconstructed from Eq. 2.26. To compare sensitivities across unit conventions, use reference values $N_0,D_0,C_0=6N_0D_0$, set $\tilde A=AN_0^{-\alpha}$ and $\tilde B=BD_0^{-\beta}$, and write $\log(N^*/N_0)=[\log(\alpha\tilde A/(\beta\tilde B))+\beta\log(C/C_0)]/(\alpha+\beta)$. Differentiation must include the coefficient term and any correlation among fitted inputs; using only a $\log C$ term is an incomplete sensitivity calculation [MATHEMATICALLY-DERIVED · DERIVED:eq-2.31].

For an estimated input vector $\hat\psi$ with covariance $\Sigma_\psi$, linearize an output $g$ as $g(\hat\psi)\approx g(\psi_0)+\nabla g(\psi_0)^\top(\hat\psi-\psi_0)$. Taking variance proves Eq. 2.27. For a ratio $U/W$, the gradient is $(1/W,-U/W^2)$; substituting it yields the numerator, denominator, and negative covariance terms. If $U=kW$ exactly, the ratio is constant despite a random denominator, providing a counterexample to any denominator-only lower bound. If $W$ can approach zero, the linear approximation can fail or the ratio can be undefined [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27].

Monte Carlo propagation draws joint input vectors from a stated input law, then evaluates or re-solves the output map. Bootstrap propagation instead refits on resampled independent run units and carries each joint fit through allocation. Neither supplies missing out-of-range model validity: resampling observed pilots cannot certify the scaling family beyond their supported regime. A second-order bias term is $\tfrac12\mathrm{tr}(H_g\Sigma_\psi)$ when its Taylor approximation is justified. Report that approximation regime rather than interpreting a nonlinear transformation of point estimates as an unbiased decision [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27].

### Frontier extraction and uncertainty-aware dominance

For finite candidates with cost minimized and quality maximized, sort by cost ascending and process equal-cost groups together. Only maximum-quality candidates at a given cost can survive; they survive if they exceed the best quality at strictly lower cost. Identical cost/quality candidates represent the same objective point but may retain distinct configuration identifiers. This sweep takes $O(n\log n)$ time and $O(n)$ output storage with constant-time finite numeric comparisons. General higher-dimensional frontiers need a suitable dominance-query algorithm; the two-dimensional sweep must not be generalized into an unbounded all-pairs loop [MATHEMATICALLY-DERIVED · DERIVED:eq-2.24].

For simultaneous quality intervals and exactly known costs, candidate $j$ certainly dominates $i$ if $c_j\le c_i$ and $q_j^{\rm lo}>q_i^{\rm hi}$, or a corresponding strict cost improvement with a non-strict quality separation. Pointwise intervals alone do not deliver simultaneous coverage over all tested candidates. If costs are also estimated, their joint uncertainty and pairing enter the comparison. The point frontier and the set not ruled out by simultaneous dominance are separate outputs [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27].

## Algorithm

```text
Algorithm 2.6 — Two-objective point frontier with explicit ties
INPUT   finite candidates (id, cost, quality); cost lower and quality higher are preferred
OUTPUT  nondominated objective points and their equivalent configuration identifiers
INVARIANT best is the highest quality at all strictly smaller processed costs
1  reject non-finite cost or quality
2  sort by cost ascending; group equal costs; initialize best = -infinity
3  for each equal-cost group G:
4      qmax = maximum quality in G
5      if qmax > best: emit every identifier in G whose quality equals qmax
6      best = max(best, qmax)
7  return emitted points and equivalence identifiers
```

Complexity is $O(n\log n)$ comparisons plus an $O(n)$ sweep; finite scalar comparisons have constant cost. Exact equality refers to the recorded numeric objective values, not an implicit experimental tolerance. Uncertainty-aware dominance uses the separately stated simultaneous-interval contract; it is not inferred from the point frontier [MATHEMATICALLY-DERIVED · DERIVED:eq-2.24].

## Implementation

The objects here are tables, not tensors. Implementation consists of (i) recording, for each candidate configuration, the decision variables, the binding constraints, and the measured quality with its interval and cluster count; (ii) storing fitted-input covariance alongside fitted values; and (iii) computing multipliers from the solver or from finite differences of f* in b. Solvers for Eq. 2.24 at the scale of a design table are any general nonlinear-programming routine; the expensive quantities are the evaluations of f and g (training runs, load tests), each of which is a Chapter 21 or Chapter 48 experiment.

## Experimental design

### Reported experiments

P09 §§3.1–3.3 estimates allocation from fixed-size training curves, isoFLOP experiments, and a parametric fit. The final-loss fit uses log-loss Huber residuals with threshold $10^{-3}$, L-BFGS, and multiple initializations; its third approach reports compute exponents 0.46 for parameters and 0.54 for tokens. The other approaches yield nearby but different exponents. This is evidence about a specified training family, not a universal optimization law [PAPER-REPORTED · P09, Eqs. (2)–(4); Table 2; Appendix D.2].

P08 §6 provides the earlier allocation comparison. Its data/training/accounting protocol differs, so differing optima do not form a controlled ablation of one exponent alone [PAPER-REPORTED · P08, §6]. KKT, Pareto dominance, and the delta method are mathematical constructions with no training dataset. Unexecuted book refitting/uncertainty checks remain in [verification.md](verification.md).

## Observations

Balancing the two reducible-loss terms gives the allocation rule only for the positive additive fitted family, its feasible domain, and the chosen compute constraint. Those are premises of the optimization, rather than consequences of KKT. P09's approach-dependent exponent estimates record empirical methodological sensitivity within its studied regime [MATHEMATICALLY-DERIVED · DERIVED:eq-2.31; PAPER-REPORTED · P09, Table 2].

Uncertainty in an allocation depends jointly on coefficients, exponents, their covariance, reference units, and any active domain constraints. Increasing the compute budget does not universally increase that uncertainty. A point frontier likewise describes the supplied point estimates; simultaneous interval dominance requires a separate joint uncertainty statement [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27].

The full joint parameter covariance needed for numerical propagation is NOT-DISCLOSED in the inspected P09 fitting account. No fit or allocation experiment was executed by the book [NOT-DISCLOSED · P09, §3.3 and Appendix D.2].

## Failure modes

> **Failure mode — hidden scalarisation.** *Symptom:* a single "efficiency score" ranks designs. *Cause:* an unstated weight w. *Detection:* ask which frontier points the score can never select. *Mitigation:* report the frontier (Algorithm 2.6) and fixed-constraint comparisons.

> **Failure mode — extrapolated multiplier.** *Symptom:* the marginal value of compute quoted far from the fitted range. *Cause:* Eq. 2.25 is local. *Detection:* compare with a re-solve at the new b. *Mitigation:* report the range of validity of the fit.

> **Failure mode — unpropagated fit uncertainty.** *Symptom:* a point N* reported to three significant figures. *Cause:* Σ ignored. *Detection:* absence of an interval. *Mitigation:* Eq. 2.27 or bootstrap-over-runs.

> **Failure mode — constraint cliff.** *Symptom:* a design that is optimal at b and infeasible at b − ε (KV cache exceeds HBM by one sequence). *Cause:* non-smooth constraint. *Detection:* check slack at the optimum. *Mitigation:* evaluate neighboring feasible discrete choices and report slack; do not extrapolate the smooth multiplier across the boundary.

## Siblings

KKT describes regular stationary constrained solutions; convexity conditions determine when those conditions also certify a global minimum. Weighted scalarization supplies an explicit quality-cost exchange rate and selects supported points. It is legitimate when that exchange rate represents the objective, but can miss non-supported Pareto alternatives. An epsilon-constraint sweep can recover those alternatives when the relevant bounds are visited and the constrained problems are solved globally [MATHEMATICALLY-DERIVED · DERIVED:eq-2.25; DERIVED:alg-2.6].

The delta method applies a local linearization to a joint input covariance. Monte Carlo propagation evaluates the response on joint draws and can capture nonlinear behavior under the chosen input law, but does not validate that law or repair a misspecified fitted family. If the response includes re-optimization, each draw incurs a solve. Bootstrap propagation additionally requires that the resampled observations match the fit's independent sampling units [MATHEMATICALLY-DERIVED · DERIVED:eq-2.27].

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
    - { dimension: "new failure mode", values: { kkt: "local validity; extrapolated multipliers", scal: "misses non-convex frontier points; hides w", eps: "one solve per ε", delta: "wrong for strongly nonlinear g, small denominators or strong extrapolation", mc: "n re-solves" } }
```

## Extensions

### Improvements

P09 changes the empirical allocation methodology by comparing fixed-size curves, matched-compute profiles, and a positive parametric family, rather than importing a single historical point optimum. Its reported comparisons support sensitivity to the training protocol; they do not isolate every changed ingredient as an independent gain [PAPER-REPORTED · P09, §§2–3].

The epsilon-constraint formulation can recover non-supported frontier points missed by weighted scalarization, under exact solves and a sweep covering their costs. This is a mathematical coverage property; measured quality gains or execution-time savings do not follow [MATHEMATICALLY-DERIVED · DERIVED:eq-2.24]. Agent tool budgets, serving concurrency, and embodied deadlines add discrete or stochastic constraints. Their canonical models are developed in Chapters 48, 54, and 60, and no universally binding constraint is presumed here.

## Limitations

Eq. 2.26 depends on the accounting C ≈ 6ND, which notation.md restricts to dense Transformers under stated assumptions; for MoE, long context, or multimodal training the constraint changes and so does the rule. The delta method is first-order. Insensitivity along a particular perturbation can arise from active domain bounds, correlated coefficient/exponent changes, or a vanishing directional derivative; it does not by itself identify which constraint binds.

## Reproducibility

Symbols: x, f, g_i, h_j, b_i, λ_i (multipliers, local), ν_j, f*, q, c, Σ, w, ε (local); N, D, C, E, A, B, α, β from notation.md. Every reported decision must state: variables, constraints and their levels, binding multipliers or slack, the fit and its covariance (or NOT-DISCLOSED), and the propagation method. No fit was performed in this edition.

## References

P08, P09. See [references.md](references.md).
