---
id: ms.section.21.3
entity_type: section
title: Inference-aware training
short_title: Inference-aware training
volume: 1
part: 4
chapter: 21
section: '21.3'
slug: 21-3-inference-aware-training
parent: ms.chapter.21
prev_sibling: ms.section.21.2
next_sibling: ms.section.21.4
children: []
prerequisites:
- ms.chapter.6
- ms.chapter.9
- ms.chapter.13
- ms.chapter.19
- ms.chapter.20
downstream:
- ms.chapter.22
- ms.chapter.29
- ms.chapter.30
related:
- ms.chapter.35
- ms.chapter.36
- ms.chapter.59
siblings_by_mechanism: []
relations:
- type: supported_by
  target: paper.P08
- type: supported_by
  target: paper.P09
axes:
  lifecycle:
  - pretraining
  - post_training
  - evaluation
  - inference
  mechanism:
  - scaling_laws
  - compute_allocation
  feedback_setting: []
  modality:
  - text
papers:
- P07
- P08
- P09
implementations: []
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-08'
editorial_status: manuscript_draft
---

# 21.3 Inference-aware training

## Scope

[DERIVED] A smaller model trained longer can have higher training cost and lower total lifecycle cost when recurring inference is sufficiently large. This statement requires a quality constraint, expected demand, a serving-work model and feasibility constraints. Without those conditions, “train longer” is not an allocation rule. The relevant comparison is between alternatives that deliver the required quality under the actual deployment workload.

## Why this exists

[PAPER-REPORTED] Training-only scaling minimizes a one-time budget. Sardana et al. add recurring inference and show why the selected training duration can move beyond that optimum. Their long-training sweep also tests whether an early-ratio loss fit remains predictive in the newly selected region. The economic objective and the empirical extrapolation problem must both be solved; changing the former does not validate the latter. [R21.3], §§2–6.

## Intuition

[MATHEMATICALLY-DERIVED] Equal quality constrains parameters and training tokens to a curve. Extra training can reduce the deployed size, paying once to reduce a recurring cost. At zero demand, the minimum is training-only; positive demand adds a slope favoring smaller size. Approaching the fitted capacity boundary makes required data diverge, preventing unlimited substitution under this law. The break-even calculation prices a finite pair of quality-matched alternatives without claiming the surface is exact.

## Formulation

[PAPER-REPORTED] Sardana et al. replace training-only optimality by fixed-quality lifecycle optimization. Their basic dense approximation minimizes $6ND_{\mathrm{tr}}+2ND_{\mathrm{inf}}$ subject to the scaling law reaching a target loss. Inference demand is assumed fixed for that target quality. The additional inference term rewards smaller deployed models, while the quality constraint requires compensating training. [R21.3, sections 2–3]

[MATHEMATICALLY-DERIVED] Write the target excess loss as $\ell=L_{\mathrm{target}}-E>0$. Under Eq. 21.3, the required training presentations for a continuous model size $N$ are

$$
D(N)=\left(\frac{B}{\ell-A N^{-\alpha}}\right)^{1/\beta},
\qquad N>(A/\ell)^{1/\alpha}.
$$
*(Eq. 21.9)*

[MATHEMATICALLY-DERIVED] At or below that strict size boundary, no finite amount of data reaches the target under this law. As $N$ approaches the boundary from above, $D(N)$ diverges. This is the capacity constraint hidden by statements that additional data can always replace parameters. Far above it, required data approaches $(B/\ell)^{1/\beta}$, but the one-time work $ND(N)$ then grows with model size.

[MATHEMATICALLY-DERIVED] For positive cost coefficients $k_{\mathrm{tr}},k_{\mathrm{inf}}$ and demand $Q$, define

$$
J(N)=k_{\mathrm{tr}}ND(N)+k_{\mathrm{inf}}NQ.
$$
*(Eq. 21.10)*

[MATHEMATICALLY-DERIVED] If $u=A N^{-\alpha}$ and $\epsilon_D=-d\log D/d\log N$, then

$$
\epsilon_D=\frac{\alpha u}{\beta(\ell-u)},\qquad
\frac{dJ}{dN}=k_{\mathrm{tr}}D(1-\epsilon_D)+k_{\mathrm{inf}}Q.
$$
*(Eq. 21.11)*

[DERIVED] With zero demand the interior training optimum satisfies $\epsilon_D=1$. Positive demand requires $\epsilon_D=1+k_{\mathrm{inf}}Q/(k_{\mathrm{tr}}D)>1$ at an interior optimum, moving toward the smaller-model, longer-training portion of the fixed-quality curve. This is a local condition; constrained deployment may instead select a memory, data or latency boundary. A numerical solver must search a feasible interval and compare endpoints rather than assume an unconstrained stationary point exists.

## Mechanism

```figure
id: fig-21.5
kind: diagram
title: From fixed quality to lifecycle allocation
caption: A quality constraint defines feasible model and training-duration pairs. Demand and measured serving cost determine which feasible pair minimizes lifecycle cost.
placement: wide
evidence: DERIVED
source: [R21.3]
alt: A validated loss surface and target quality produce feasible size-duration pairs. Training cost, serving cost and demand then determine lifecycle comparisons and break-even thresholds.
spec:
  direction: TB
  nodes:
    - {id: loss, kind: model, label: validated quality surface}
    - {id: target, kind: objective, label: fixed target quality}
    - {id: pairs, kind: state, label: feasible size-duration pairs}
    - {id: demand, kind: dataset, label: input and output demand}
    - {id: costs, kind: hardware, label: measured training and serving costs}
    - {id: choose, kind: process, label: lifecycle and break-even comparison}
  edges:
    - {from: loss, to: pairs}
    - {from: target, to: pairs}
    - {from: pairs, to: choose}
    - {from: demand, to: choose}
    - {from: costs, to: choose}
```

### Methodology

### Separate input processing and output generation

[PAPER-REPORTED] The inference-aware study extends the objective to monetary cost with separate training, prompt-processing and generation utilization assumptions. Its analytical examples recognize that prompt processing and autoregressive generation can operate at markedly different model-FLOP utilization. Those utilization values are scenario assumptions, not universal hardware measurements. [R21.3], §6, Figure 6 and Appendix B.3.

[MATHEMATICALLY-DERIVED] A corresponding simplified currency model is

$$
J_{\$}=\frac{6ND\,p_{\mathrm{tr}}}{u_{\mathrm{tr}}F_{\mathrm{tr}}}
+2N\left(\frac{Q_{\mathrm{in}}p_{\mathrm{in}}}{u_{\mathrm{in}}F_{\mathrm{in}}}
+\frac{Q_{\mathrm{out}}p_{\mathrm{out}}}{u_{\mathrm{out}}F_{\mathrm{out}}}\right).
$$
*(Eq. 21.12)*

[DERIVED] Here $p$ is currency per hardware-second, $F$ is peak FLOP/s for the declared arithmetic, and $u$ is achieved utilization relative to that peak. Units then reduce to currency. This model omits operation-specific attention work, memory traffic, cache capacity, queueing, failures, idle reservation and orchestration unless those are added explicitly. An empirically measured cost per request can replace the serving approximation, preserving its workload boundary. The simplified objective is useful only within the range where its utilization assumptions remain credible.

[DERIVED] Prefill work depends on prompt length and attention structure. Generation repeatedly reads weights and cache state, so batching, memory bandwidth and accumulated context matter. KV-cache storage depends on cached layers, heads, dimensions, token count and precision; it is not determined by $N$ alone. Latency constraints can prohibit the nominally cheapest throughput operating point. Thus a currency optimum, a FLOP optimum and a low-latency optimum can select different model/data pairs.

### Break-even is a workload calculation

[MATHEMATICALLY-DERIVED] Consider quality-matched alternatives $A$ and $B$, where $A$ costs more to train but less per served unit. Let their one-time costs be $T_A>T_B$ and serving costs $s_A<s_B$. Then

$$
Q_{\mathrm{break}}=\frac{T_A-T_B}{s_B-s_A},\qquad
J_A<J_B\ \Longleftrightarrow\ Q>Q_{\mathrm{break}}.
$$
*(Eq. 21.13)*

[DERIVED] The served unit must be fixed: a generated token, a request with specified length distribution, or another measured workload unit. When input/output mixtures change, use $T_A-T_B+Q_{\mathrm{in}}\Delta s_{\mathrm{in}}+Q_{\mathrm{out}}\Delta s_{\mathrm{out}}<0$ instead of a single ambiguous token threshold. If $s_A\ge s_B$, extra training has no serving-cost break-even in this linear model. If $T_A\le T_B$ and $s_A<s_B$, $A$ dominates economically under the stated equal-quality and feasibility assumptions.

[MATHEMATICALLY-DERIVED] For uncertain demand in a linear cost model, expected cost uses $\mathbb E[Q]$. A risk constraint may instead involve an upper quantile or regret over several demand scenarios. This distinction matters because a point-optimal long training run can be wasteful if the model is retired early. Demand that depends on model quality, speed, price or release timing is endogenous; holding it fixed is then a simplifying assumption rather than a measured fact.

```figure
id: fig-21.6
kind: calculator
title: Demand needed to amortize extra training
caption: >-
  Equation 21.13 assumes quality-matched feasible alternatives, a positive
  one-time premium and constant positive savings per request. Inputs are
  analytical currency units, not quoted service prices or measured demand.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-21.13
alt: >-
  An extra one million currency units in training and savings of 0.001
  units per request break even at one billion requests. At that demand,
  the lifecycle cost difference is zero under the linear assumptions.
spec:
  tex: Q_{\mathrm{break}}=\Delta T/\Delta s
  equation: "21.13"
  inputs:
    - {symbol: premium, label: extra training currency, default: 1000000, min: 0, max: 1000000000}
    - {symbol: saving, label: currency saved per request, default: 0.001, min: 0.000001, max: 1}
    - {symbol: demand, label: lifetime request count, default: 1000000000, min: 0, max: 1000000000000, format: integer}
  outputs:
    - {symbol: threshold, label: break-even requests, formula: premium/saving, format: integer, emphasis: true}
    - {symbol: difference, label: longer-trained minus baseline cost, formula: premium-demand*saving}
```

## Algorithm

**Algorithm 21.3 — Compare lifecycle allocations.** [DERIVED] Input: a validated conditional loss surface, a target excess loss $\ell$, finite sizes $\{N_k\}_{k=1}^K$, audited serving costs, and demand scenarios $\{(Q_{\mathrm{in},s},Q_{\mathrm{out},s},\mathcal W_s)\}_{s=1}^S$. The workload record $\mathcal W_s$ specifies arrival and length distributions, concurrency, capacity, and latency constraints. Output: feasible candidate costs and scenario regret. This is an allocation procedure, not evidence that a predicted checkpoint has already reached the quality target.

$$
\begin{aligned}
1.\quad &\ell\le0\ \Longrightarrow\ \operatorname{return}(\mathrm{invalid\ target}).\\
2.\quad &u_k\gets A N_k^{-\alpha},\qquad k=1,\ldots,K.\\
3.\quad &D_k\gets\begin{cases}
 [B/(\ell-u_k)]^{1/\beta},&u_k<\ell,\\
 +\infty,&u_k\ge\ell.
\end{cases}\\
4.\quad &v_{ks}\gets\operatorname{finite}(D_k)\land
 \operatorname{data\_memory\_context\_latency}(k,D_k,\mathcal W_s).\\
5.\quad &J_{ks}\gets\begin{cases}
 T_k+Q_{\mathrm{in},s}s_{\mathrm{in},ks}+Q_{\mathrm{out},s}s_{\mathrm{out},ks},&v_{ks},\\
 +\infty,&\neg v_{ks}.
\end{cases}\\
6.\quad &\mathcal F_s\gets\{k:v_{ks}\};\quad
 \mathcal F_s=\varnothing\ \Longrightarrow\ \operatorname{mark}(s,\mathrm{infeasible}).\\
 &\mathcal F_s\ne\varnothing:\quad J_s^*\gets\min_{k\in\mathcal F_s}J_{ks},\qquad
 \operatorname{regret}_{ks}\gets J_{ks}-J_s^*.\\
7.\quad &\operatorname{return}(\{D_k,v_{ks},J_{ks},\operatorname{regret}_{ks}\},\mathrm{provenance}).
\end{aligned}
$$
*(Eq. 21.26)*

[DERIVED] $T_k$ is the one-time cost at the predicted horizon; $s_{\mathrm{in},ks}$ and $s_{\mathrm{out},ks}$ use common workload units and are audited for $\mathcal W_s$ within the declared serving boundary. Scenario-independent coefficients are valid only when one certified operating regime covers every scenario. Missing cost or constraint measurements return unresolved status rather than a finite estimate. If every candidate is infeasible in a scenario, its regret is undefined and is omitted with that reason. The invariant is a common quality/serving contract across comparisons, with capacity tested separately for each scenario. Independent quality evaluation remains a required gate before deployment. Cost and loss uncertainty can be propagated by repeating this finite evaluation over retained joint fit/cost draws. One draw costs $O(KS)$ arithmetic and $O(KS)$ retained outputs; this excludes measurement, training and pairwise break-even enumeration.

## Implementation

[DERIVED] The cost model consumes measurements from the chosen Model / autograd framework and Inference engine layers; it does not require or validate a particular product. **FlashAttention**, the Attention kernel layer, appears in the plan-anchored context study as a source execution choice, not a measured serving advantage in this section. Chapters 42 and 48 own cache/workload measurement and lifecycle benchmarking; a candidate's runtime revision and operating point must accompany its cost inputs. [R21.9], §2.1.

[DERIVED] A deployment record should retain prompt/output length distributions, concurrency, batch policy, latency percentiles, cache precision, hardware topology and serving software revision. Mean tokens alone can hide long-tail memory or latency violations. Training cost should include required pilot and failed-run work when the decision concerns a program budget, and exclude those costs only when the decision explicitly concerns a final run. Reusing a teacher or pretrained checkpoint requires the same distinction between sunk and incremental costs.

[DERIVED] Monetary and energy accounting cannot be inferred from published parameter/token totals alone. Multiplying algorithmic FLOPs by a peak-power-per-peak-FLOP ratio presumes utilization and power behavior that may not hold. Measured hardware-seconds and power traces provide a different evidence boundary from a theoretical work estimate. For a source that reports only algorithmic allocation, this manuscript makes no claim that its minimum is also an energy or wall-time minimum.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Sardana et al. train 47 MPT models across six sizes from 150M to 6B parameters and token/parameter ratios extending to 10000 in parts of the sweep. The training corpus combines general web and code, without repeating the same corpus epochs in the reported long-training setup. The largest ratios are not observed at every size; notably the 2.5B sweep does not extend across the full range. Evaluation includes held-out loss and categorized downstream tasks. [R21.3], §§3–5 and Appendices C–D.

[PAPER-REPORTED] Their fits and measurements show continued gains from longer training over the tested range, while a law fit only to low token/parameter ratios can overpredict the benefit at much higher ratios. This is direct negative evidence against extrapolating an early-regime data exponent indefinitely. The results motivate inference-aware allocation but do not prove that arbitrarily long training always remains beneficial. [R21.3, section 5]

## Observations

### Observation 21.3 - Expected serving demand changes the allocation objective

**What the paper claims.** [PAPER-REPORTED] Adding inference to lifecycle cost favors smaller, longer-trained models in relevant demand regimes. [R21.3]

**What the evidence shows.** [PAPER-REPORTED] A controlled long-training sweep supports additional quality gains and reveals that extrapolation from shorter training can exaggerate those gains. The monetary conclusions depend on explicit serving assumptions. [R21.3]

**What we infer.** [DERIVED] Overtraining relative to a training-only optimum can be rational, but its justification is a quality-matched lifecycle comparison with a demand threshold.

**What remains unknown.** [UNVERIFIED] No experiment in this manuscript measures an actual service's demand, utilization, price, cache behavior or latency; no universal deployment break-even value is established.

## Failure modes

[DERIVED] Using cumulative tokens as if they were independent unique data can make the required training horizon unrealistically attractive. Evaluating quality only with average cross-entropy can miss critical task regressions. A smaller model may generate longer answers or require more retries to deliver the same task success, changing the workload itself. Serving-cache and quantization choices can alter both quality and cost. A fixed two-FLOP-per-weight approximation misses all of these interactions.

[DERIVED] Releasing later to complete a long run can forfeit useful service months; comparing lifetime costs without a release-time assumption omits that effect. Retraining cadence and expected model obsolescence limit how much demand a checkpoint can amortize. If quality is merely predicted rather than independently confirmed, model-selection risk belongs in the decision alongside mean cost. A cheaper expected solution can have higher risk of failing the required quality constraint.

## Siblings

[DERIVED] Compare alternatives on one declared axis: training work at fixed quality; total algorithmic work at fixed demand; currency at fixed service criteria; or cost per accepted task. Constant-token comparisons do not match task success when answers and retries differ. Distillation changes supervision and teacher cost, compression changes representation/runtime, and test-time search changes the served algorithm. Each can alter lifecycle economics without sharing the same fitted training response.

## Extensions

### Improvements

[DERIVED] Inference-aware scaling extends the training-only objective while preserving the distinction between a fitted response surface and a decision model. The next methodological improvement is to replace constant serving coefficients by workload-specific measured functions and to validate the loss surface in the longer-training region actually selected. Those changes improve the question's fidelity without asserting that a particular deployment optimum has already been observed.

[DERIVED] Distillation and test-time search introduce additional alternatives: move compute to teacher supervision during training or to adaptive inference after training. Their cost boundaries and quality responses differ from simply increasing $D$. Section 21.4 reconstructs those reported studies; the unexecuted lifecycle verification protocol is in [verification](verification.md).

## Limitations

[MATHEMATICALLY-DERIVED] The analytical objective assumes the fitted quality surface, enough data, fixed workload coefficients and demand exogenous to the selected model. Context, batching and queueing can make serving cost nonlinear; finite capacity can make a demand scenario infeasible. A loss target below the floor has no solution under this family. A predicted economically favorable allocation remains conditional until independent quality and workload measurements confirm its premises.

## Reproducibility

[DERIVED] Retain fit revision, target metric, demand horizon/distribution, model lifetime, input/output length distribution, source prices and dates, measured utilization boundary, latency constraint and joint uncertainty draws. State whether pilots, failed runs and checkpoint reuse are sunk or incremental. No actual service demand, currency bill, power trace or deployment break-even has been measured in this manuscript.

## References

[R21.3](references.md#r21-3), §§2–6 and Appendices B–D; [R21.9](references.md#r21-9), §2.1; [21.4](21-4-beyond-dense-pretraining.md); [verification](verification.md).
