---
id: ms.section.6.4
entity_type: section
title: Measurement uncertainty
short_title: Measurement uncertainty
volume: 1
part: 1
chapter: 6
section: 6.4
slug: 06-4-measurement-uncertainty
parent: ms.chapter.6
prev_sibling: ms.section.6.3
next_sibling: ms.section.6.5
children: []
prerequisites: [ms.section.2.5, ms.section.3.6, ms.section.6.1, ms.section.6.2, ms.section.6.3]
downstream: [ms.section.6.5, ms.section.6.6, ms.chapter.61, ms.chapter.62]
related: [ms.section.21.5]
siblings_by_mechanism: [ms.section.2.5]
relations:
  - {type: supported_by, target: reference.R6.1}
  - {type: supported_by, target: reference.R6.25}
  - {type: evaluated_by, target: experiment.6.4}
axes: {lifecycle: [evaluation, pretraining, inference], mechanism: [variance_decomposition, paired_estimation, practical_equivalence], feedback_setting: [], modality: [text]}
papers: [P06, P07]
implementations: [impl.pytorch, impl.vllm, impl.sglang]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 6.4 Measurement uncertainty

## Scope

Objective: allocate uncertainty across training runs, tasks, dependent items, and repeated generations before choosing an experiment budget. Baseline: one score with an item-level binomial interval. Success: every reported interval names its random population, preserves pairing, and distinguishes an unresolved effect from practical equivalence. Statistical definitions belong to [§2.5](../ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md); this section applies them to the evaluation unit of [§6.1](06-1-evaluation-units.md). Hardware repeatability belongs to [§3.6](../ch03-numerical-computation-and-trustworthy-training/03-6-reproducibility-limits.md), and judge-specific uncertainty is developed in [Chapter 62](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/README.md).

## Why this exists

**PAPER-REPORTED · [R6.1](references.md).** Miller treats evaluation questions as draws from a population and recommends analysing paired differences, accounting for clustered questions, and planning statistical power. **PAPER-REPORTED · [R6.25](references.md).** Bouthillier et al. examine variation in data sampling, initialisation, and hyperparameter selection across an entire benchmarking procedure. These are different boundaries: uncertainty conditional on a checkpoint and uncertainty of the procedure that produces checkpoints.

**DERIVED.** A million generations from one trained checkpoint do not reveal variability across independently trained checkpoints. Conversely, retraining many times on the same narrow question set cannot establish transfer to unrepresented task families. The scarce resource is independent coverage of the population named in the claim. The design therefore needs a variance budget before it needs a narrower error bar.

## Intuition

**DERIVED.** Replication acts where it is introduced. New decoding draws average away conditional generation noise; new passages increase independent item coverage; new training runs probe training variability. Shared prompts can reduce noise in a difference by exposing both arms to the same difficult items. The reduction depends on covariance, rather than on the two runs having identical seed integers.

**ASSUMED.** The proposed analysis uses bounded, higher-is-better task scores, fixed task weights, and complete paired outcomes. Invalid outputs receive the preregistered failure score. Infrastructure failures are reported separately and handled by a rule fixed before inspection. Sensitivity: removing failed generations instead estimates quality conditional on successful execution and can favour an unreliable arm.

## Formulation

> **Definition — seed variance / task variance.** Seed variance is variation in an evaluation score across independent training or generation seeds at a specified fixed boundary; the two seed types must be distinguished. Task variance is variation of a method's effect across task populations, distinct from item variation within a task.

> **Definition — variance budget.** The planned allocation of independent runs, tasks, item clusters, and generation samples under a resource constraint, chosen to reduce uncertainty in a specified effect.

> **Definition — practical-equivalence margin.** A preregistered positive effect magnitude below which a difference does not change the intended decision; its units match the metric.

| Local symbol | Meaning | Units / shape |
|---|---|---|
| r, s | number and index of independent training-seed blocks | counts |
| J, j | number and index of tasks | counts |
| G, g | independent clusters per task and their index | counts; balanced illustration |
| m, h | independent generation pairs per cluster and their index | counts |
| d_sjgh | candidate score minus baseline score | dimensionless, in [−1, 1] |
| w_j | fixed non-negative task weights | sum to one |
| Δ, δ | population difference; practical margin | score units |
| α | planned type-I error level | probability |

**MATHEMATICALLY-DERIVED.** For equal task weights and a balanced illustrative design, write a crossed random-effects model:

$$
d_{sjgh}=\Delta+a_s+b_j+c_{jg}+u_{sj}+v_{sjg}+e_{sjgh},\qquad
\operatorname{Var}(\widehat\Delta)=
\frac{\sigma_a^2}{r}+\frac{\sigma_b^2}{J}+\frac{\sigma_c^2}{JG}
+\frac{\sigma_u^2}{rJ}+\frac{\sigma_v^2}{rJG}+\frac{\sigma_e^2}{rJGm}.
$$
*(Eq. 6.9)* where a = seed effect, b = task effect, c = cluster effect, u = seed-by-task interaction, v = seed-by-cluster interaction, e = generation residual; all components are assumed mutually independent and mean-zero, with independence across their respective indices.

```figure
id: fig-6.19
kind: memory-stack
title: Variance budget of Eq. 6.9, term by term
caption: >-
  Eq. 6.9 stacked like a memory budget. Each segment is one variance
  component divided by its own replication count, and the line is the
  variance that would resolve δ = 1 point at α = 0.05 with power 0.8, the
  Eq. 2.23 relation (1/2.8)². The component values are ASSUMED illustrative
  inputs in squared points, not estimates for any suite. Scroll the
  argument. Generations shrink one segment, clusters three, seeds the rest,
  and no amount of either touches σ_b²/J, which only more tasks can shrink.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-6.9", "DERIVED:eq-2.23"]
concepts: [ms.section.6.4]
alt: >-
  Two stacked bars of Var(Δ̂) in squared points, with ASSUMED components
  σ_a² = 1, σ_b² = 4, σ_c² = 500, σ_u² = 1, σ_v² = 200 and σ_e² = 1500, and a
  target line at (1/2.8)² = 0.128. At r = 5 seed blocks, J = 10 tasks,
  G = 100 clusters and m = 1 generation, the fixed-suite bar holds seed 0.20,
  cluster 0.50, seed × task 0.02, seed × cluster 0.04 and generation 0.30, a
  total of 1.06 (SE 1.03 points). The new-task bar adds task 0.40, for 1.46.
  With m = 16 the generation term falls to 0.019 and the fixed-suite total
  to 0.78. With G = 1000 it is 0.30, now dominated by the seed term 0.20.
  With r = 20 and G = 1000 it is 0.114, under the target, while the
  new-task bar stays at 0.51.
spec:
  format: raw
  variables: { r: 5, J: 10, G: 100, m: 1, sa: 1, sb: 4, sc: 500, su: 1, sv: 200, se: 1500 }
  bars:
    - label: "fixed suite (conditional)"
      segments:
        - { label: "seed, σ_a² ÷ r", kind: state, formula: "sa/r" }
        - { label: "cluster, σ_c² ÷ JG", kind: dataset, formula: "sc/(J*G)" }
        - { label: "seed × task, σ_u² ÷ rJ", kind: node, formula: "su/(r*J)" }
        - { label: "seed × cluster, σ_v² ÷ rJG", kind: node, formula: "sv/(r*J*G)" }
        - { label: "generation, σ_e² ÷ rJGm", kind: process, formula: "se/(r*J*G*m)" }
    - label: "new tasks (adds σ_b² ÷ J)"
      segments:
        - { label: "seed, σ_a² ÷ r", kind: state, formula: "sa/r" }
        - { label: "cluster, σ_c² ÷ JG", kind: dataset, formula: "sc/(J*G)" }
        - { label: "seed × task, σ_u² ÷ rJ", kind: node, formula: "su/(r*J)" }
        - { label: "seed × cluster, σ_v² ÷ rJG", kind: node, formula: "sv/(r*J*G)" }
        - { label: "generation, σ_e² ÷ rJGm", kind: process, formula: "se/(r*J*G*m)" }
        - { label: "task, σ_b² ÷ J", kind: dataset, formula: "sb/J" }
  budget: { label: "target for δ = 1 pt, α = 0.05, power 0.8", formula: "(1/2.8)^2" }
states:
  - { anchor: formulation, label: "r = 5, G = 100, m = 1", variables: { r: 5, J: 10, G: 100, m: 1 }, highlight: ["fixed suite (conditional)", "new tasks (adds σ_b² ÷ J)"], note: "Each term carries its own count. The fixed-suite variance is 1.06 pt² (SE 1.03), eight times the 0.128 target: this design cannot resolve δ = 1 point." }
  - { anchor: mechanism, label: "m = 16 generations", variables: { r: 5, J: 10, G: 100, m: 16 }, highlight: ["fixed suite (conditional)/generation, σ_e² ÷ rJGm"], note: "Sixteen generations per cluster cut the σ_e² term from 0.30 to 0.019, but the total only falls from 1.06 to 0.78. Decoding repetitions shrink only the final term." }
  - { anchor: algorithm, label: "G = 1000 clusters", variables: { r: 5, J: 10, G: 1000, m: 1 }, highlight: ["fixed suite (conditional)/cluster, σ_c² ÷ JG", "fixed suite (conditional)/seed, σ_a² ÷ r"], note: "Ten times the independent clusters shrink the cluster, seed × cluster and generation terms, from 1.06 to 0.30. The seed term σ_a²/r = 0.20 now dominates." }
  - { anchor: experimental-design, label: "r = 20, G = 1000", variables: { r: 20, J: 10, G: 1000, m: 1 }, highlight: ["fixed suite (conditional)", "new tasks (adds σ_b² ÷ J)/task, σ_b² ÷ J"], note: "Twenty seed blocks and 1000 clusters per task: 0.114, under the target for a fixed suite. The new-task bar stays at 0.51 because σ_b²/J = 0.40 needs more tasks, not more runs." }
```

**MATHEMATICALLY-DERIVED.** Each component appears in the grand mean with its own replication count: the seed contribution is an average of r terms regardless of the number of questions. Equation 6.9 follows by adding variances of those averages. With unequal task weights, the independent task contribution becomes σ_b²Σ_j w_j². With a fixed task suite, condition on the selected tasks: b_j is not sampled, and σ_b²/J is not part of that conditional uncertainty. Generalisation to new task populations requires an additional sampling assumption.

**MATHEMATICALLY-DERIVED.** For one fixed checkpoint pair and independent clusters, let x_g be the sum of all paired item differences in cluster g, n_g its item count, and n the total count. For the item-weighted mean:

$$
\widehat\Delta=\frac{\sum_g x_g}{n},\qquad
\widehat{\operatorname{SE}}_{\mathrm{cluster}}^2
=\frac{G}{G-1}\frac{1}{n^2}\sum_{g=1}^{G}(x_g-n_g\widehat\Delta)^2.
$$
*(Eq. 6.10)* where G > 1; this is an intercept-only cluster sandwich estimator with a finite-cluster correction, relying on many independent clusters for reliable inference.

**MATHEMATICALLY-DERIVED.** The covariance identity underlying pairing is

$$
\operatorname{Var}(X-Y)=\operatorname{Var}(X)+\operatorname{Var}(Y)-2\operatorname{Cov}(X,Y).
$$
*(Eq. 6.11)* where X and Y are scores on a jointly sampled evaluation unit. Pairing helps when covariance is positive; negative covariance increases the variance of the difference.

## Mechanism

**DERIVED.** Decide the inference boundary first. A claim about two released checkpoints can condition on their training histories. A claim that one training algorithm improves another must include training-run variation. A claim about future tasks must justify how tasks were sampled. One interval cannot silently switch between these three questions. Report the conditional checkpoint comparison even when an expensive procedure-level comparison remains unmeasured.

```figure
id: fig-6.20
kind: diagram
title: Three inference boundaries and the Eq. 6.9 terms each admits
caption: >-
  The claim picks the population, the population picks which terms of Eq.
  6.9 are random, and those terms pick the estimator. The heavy path is the
  one the section says to report even when the others are unaffordable: a
  fixed checkpoint pair, cluster-resampled by Algorithm 6.4. Moving down a
  row adds terms and never removes one. A procedure claim needs seed blocks,
  and a new-task claim also needs a justified sampling model for tasks. More
  generations act only on σ_e², at the far right.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-6.9", "DERIVED:eq-6.10", "DERIVED:alg-6.4"]
concepts: [ms.section.6.4]
alt: >-
  Left-to-right diagram. A branch asks which population the claim names.
  Branch one: two released checkpoints, conditional on their training
  histories, where the cluster and generation terms σ_c²/(JG) and
  σ_e²/(rJGm) are random. They feed the cluster standard error of Eq. 6.10
  in Algorithm 6.4, on the emphasised path, and then the decision rule that
  compares the interval with zero and with ±δ. Branch two: training
  algorithm A against B, which adds the seed terms σ_a²/r, σ_u²/(rJ) and
  σ_v²/(rJG). These feed the seed-block interval Δ̂ ± t(r−1)·s_Δ/√r
  conditional on the suite. Branch three: future tasks, which adds the task
  term σ_b²/J and needs a crossed-effects analysis or a validated crossed
  bootstrap, plus a justified task-sampling assumption. A side note: more
  generations m shrink only σ_e².
spec:
  direction: LR
  nodes:
    - { id: q, kind: branch, label: "which population does the claim name?" }
    - { id: ck, kind: model, label: "two released checkpoints", sub: "condition on training histories" }
    - { id: pr, kind: process, label: "training algorithm A vs B", sub: "include training-run variation" }
    - { id: tk, kind: dataset, label: "future task populations", sub: "justify how tasks were sampled" }
    - { id: tc, kind: metric, label: "cluster + generation terms", sub: "σ_c²/(JG), σ_e²/(rJGm)" }
    - { id: ta, kind: metric, label: "+ seed terms", sub: "σ_a²/r, σ_u²/(rJ), σ_v²/(rJG)" }
    - { id: tb, kind: metric, label: "+ task term", sub: "σ_b²/J" }
    - { id: e1, kind: process, label: "cluster SE, Eq. 6.10", sub: "Algorithm 6.4, paired, O(G) memory" }
    - { id: e2, kind: process, label: "seed-block interval", sub: "Δ̂ ± t(r−1)·s_Δ/√r, suite fixed" }
    - { id: e3, kind: process, label: "crossed-effects analysis", sub: "or a validated crossed bootstrap" }
    - { id: dec, kind: branch, label: "interval vs 0 and vs ±δ", sub: "improvement · equivalence · degradation · unresolved", emphasis: true }
    - { id: gen, kind: dependency, label: "more generations m", sub: "shrink σ_e² only" }
  edges:
    - { from: q, to: ck, kind: emphasis }
    - { from: q, to: pr }
    - { from: q, to: tk }
    - { from: ck, to: tc, kind: emphasis }
    - { from: pr, to: ta }
    - { from: tk, to: tb }
    - { from: tc, to: e1, kind: emphasis }
    - { from: ta, to: e2 }
    - { from: tb, to: e3 }
    - { from: e1, to: dec, kind: emphasis }
    - { from: e2, to: dec }
    - { from: e3, to: dec }
    - { from: gen, to: tc, kind: dependency, label: "σ_e² term" }
```

**DERIVED.** Sample dependence determines the effective evidence. Translations of one question, multiple questions about one passage, and multiple turns of one trajectory share a sampling event. Aggregate or resample that event as a unit. For unequal clusters, resample clusters and recompute the ratio of total score differences to total item counts; averaging cluster means instead changes the estimand to equal cluster weighting. If one cluster dominates n, increasing its number of near-duplicates does little to improve independent coverage.

**DERIVED.** Seed variation cannot be estimated by applying an item bootstrap to one run. Under a fixed test suite, compute a complete suite-level difference for each independent training-seed block and report the dispersion of those r differences. This captures training variability conditional on that suite. To include sampled-item uncertainty as well, use a justified crossed-effects analysis or a bootstrap validated for the crossed seed-by-cluster design. Do not concatenate every seed's outcomes and pretend they are independent new questions.

**MATHEMATICALLY-DERIVED.** An approximate paired mean interval is Δ̂ ± t_(r−1,1−α/2)·s_Δ/√r when r independent seed-block differences are approximately Gaussian and the suite is fixed. With two seeds there is one variance degree of freedom; the relevant quantile is very large. A narrow item interval may coexist with an almost uninformative training-procedure interval. More decoding repetitions shrink only the final term of Eq. 6.9 and cannot fix this limitation.

```figure
id: fig-6.21
kind: chart
title: Seed-block interval half-width against the number of seed blocks
caption: >-
  The half-width Δ̂ ± t(r−1, 0.975)·s_Δ/√r in units of s_Δ, against the
  normal-quantile shortcut 1.96/√r. At two seed blocks the t quantile is
  12.71 and the interval is 9.0 s_Δ wide on each side, 6.5 times the naive
  one. By five blocks, verification.md's allocation, the penalty is 1.4×.
  Beyond about twenty blocks the two curves nearly meet. The quantiles are
  standard values of the t distribution. Nothing about any workload is
  assumed.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.9"
alt: >-
  Line chart on a log y axis of the 95 % seed-block half-width in units of
  s_Δ against r seed blocks from 2 to 30. With the t quantile it is 8.98 at
  r = 2 (t = 12.71), 2.48 at r = 3, 1.59 at r = 4, 1.24 at r = 5, 1.05 at
  r = 6, 0.84 at r = 8, 0.72 at r = 10, 0.55 at r = 15, 0.47 at r = 20 and
  0.37 at r = 30. The dashed normal shortcut 1.96/√r is 1.39 at r = 2, 0.88
  at r = 5, 0.62 at r = 10, 0.44 at r = 20 and 0.36 at r = 30.
spec:
  type: line
  x: { label: "independent seed blocks r", scale: linear, format: integer, domain: [2, 30] }
  y: { label: "95 % half-width ÷ s_Δ", scale: log10, format: fixed2, domain: [0.3, 10] }
  series:
    - { id: t, label: "t(r − 1, 0.975)/√r", points: [[2, 8.985], [3, 2.484], [4, 1.591], [5, 1.242], [6, 1.049], [8, 0.836], [10, 0.715], [15, 0.554], [20, 0.468], [30, 0.373]], emphasis: true }
    - { id: z, label: "normal shortcut 1.96/√r", formula: "1.96/sqrt(x)", sample: { from: 2, to: 30, count: 29 }, dashed: true }
  annotations:
    - { x: 2, label: "r = 2: t = 12.71, one degree of freedom" }
    - { x: 5, label: "r = 5: 1.24 vs 0.88" }
states:
  - { anchor: mechanism, label: "r = 2 seeds", variables: { x: 2 }, highlight: [t, z], note: "Two seed blocks leave one variance degree of freedom: t = 12.71, a half-width of 9.0 s_Δ against 1.39 s_Δ for the normal shortcut. An item interval cannot repair this." }
  - { anchor: experimental-design, label: "r = 5 seeds", variables: { x: 5 }, highlight: [t], note: "Experiment 6.4 varies the number of seed blocks. At verification.md's five, t = 2.78 and the half-width is 1.24 s_Δ, 1.4 times the shortcut." }
  - { anchor: limitations, label: "r = 20 seeds", variables: { x: 20 }, highlight: [t, z], note: "Twenty blocks bring the half-width to 0.47 s_Δ, near the 0.44 of the shortcut. With few seed blocks, as the Limitations say, specialised inference is needed." }
```

**ASSUMED.** Let δ = 0.01 represent one absolute percentage point for a planned accuracy decision. Use a prespecified confidence interval [l,u]. Practical improvement requires l > δ; practical degradation requires u < −δ; an interval entirely inside [−δ,δ] supports equivalence under this conservative decision rule. Every other configuration is unresolved for that practical decision. A positive interval such as [0.002,0.006] excludes zero while supporting a negligible effect at this δ. An interval [−0.03,0.04] establishes neither equivalence nor improvement. These are illustrative intervals, not measurements.

```figure
id: fig-6.22
kind: chart
title: Five intervals under the ±δ decision rule
caption: >-
  The section's decision rule drawn against δ = 0.01. Rows 2 and 4 are the
  section's own illustrative intervals. The other three are constructed only
  to complete the four verdicts. Read row 4 against row 3. Both exclude
  zero, but only row 4 lies inside ±δ and supports equivalence, while row 3
  crosses +δ and is unresolved. Row 2 crosses both margins and is the
  "non-significance called equivalence" failure mode waiting to happen.
placement: inline
evidence: ASSUMED
source: ["DERIVED:eq-6.9", "DERIVED:eq-6.10"]
alt: >-
  Chart of five horizontal confidence intervals for a difference Δ, with
  dashed vertical lines at −δ = −0.01, 0 and +δ = 0.01. Row 5, constructed,
  [0.012, 0.030]: the lower bound exceeds δ, practical improvement. Row 4,
  from the text, [0.002, 0.006]: excludes zero and lies inside ±δ,
  equivalence at this δ. Row 3, constructed, [0.004, 0.020]: excludes zero
  but crosses +δ, unresolved. Row 2, from the text, [−0.03, 0.04]: crosses
  both margins, unresolved. Row 1, constructed, [−0.030, −0.012]: the upper
  bound is below −δ, practical degradation. All intervals are illustrative.
spec:
  type: line
  x: { label: "difference Δ, score units", scale: linear, format: fixed3, domain: [-0.04, 0.05] }
  y: { label: "illustrative interval (row)", scale: linear, format: integer, domain: [0, 6] }
  series:
    - { id: lo, label: "−δ = −0.01", points: [[-0.01, 0], [-0.01, 6]], dashed: true }
    - { id: zero, label: "zero", points: [[0, 0], [0, 6]], dashed: true }
    - { id: hi, label: "+δ = 0.01", points: [[0.01, 0], [0.01, 6]], dashed: true }
    - { id: imp, label: "row 5 [0.012, 0.030]: improvement (constructed)", points: [[0.012, 5], [0.03, 5]] }
    - { id: eqv, label: "row 4 [0.002, 0.006]: equivalence (text)", points: [[0.002, 4], [0.006, 4]], emphasis: true }
    - { id: sig, label: "row 3 [0.004, 0.020]: excludes 0, unresolved (constructed)", points: [[0.004, 3], [0.02, 3]] }
    - { id: wide, label: "row 2 [−0.03, 0.04]: unresolved (text)", points: [[-0.03, 2], [0.04, 2]] }
    - { id: deg, label: "row 1 [−0.030, −0.012]: degradation (constructed)", points: [[-0.03, 1], [-0.012, 1]] }
  annotations:
    - { x: 0.004, label: "excludes zero, still negligible at δ" }
```

**DERIVED.** Repeated inspection and multiple endpoints also consume uncertainty. Fix one primary contrast, or allocate an error budget over the declared family of contrasts. Stopping when an ordinary fixed-sample interval first excludes zero is not the registered fixed-sample procedure. Use the fixed endpoint here; specialised sequential inference belongs in a separately specified analysis. Changing δ after seeing the interval is another form of outcome-dependent selection.

**MATHEMATICALLY-DERIVED.** A planning allocation for a simplified variance σ_a²/r + σ_z²/(rn), where n independent clusters are evaluated per run, has an instructive optimum. With cost K = r(c_train + n·c_eval), substituting r gives variance proportional to σ_a²c_train + σ_a²n c_eval + σ_z²c_train/n + σ_z²c_eval. Differentiation gives n* = √(σ_z²c_train/(σ_a²c_eval)) when both variances and costs are positive. Round within feasibility constraints and check sensitivity; this excludes shared-cluster uncertainty across seeds and is a planning model, not the full Eq. 6.9.

```figure
id: fig-6.23
kind: calculator
title: Clusters per run against seed runs under one budget
caption: >-
  The section's planning optimum for the simplified variance
  σ_a²/r + σ_z²/(rn) under the cost K = r(c_train + n·c_eval). R =
  c_train/c_eval is the price of one training run in cluster evaluations.
  n* grows as √R and does not depend on K. The budget only sets how many
  runs r it buys. Variance inputs are ASSUMED squared points, matching the
  Eq. 6.9 panel. Real suites cap n at the clusters that exist, so round
  within that cap. This planning model omits shared-cluster uncertainty and
  is not the full Eq. 6.9.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.9"
alt: >-
  Calculator for n* = √(σ_z²·c_train/(σ_a²·c_eval)) with inputs σ_a²
  (squared points), σ_z² (squared points per cluster), the cost ratio
  R = c_train/c_eval and the budget K in training-run units. At σ_a² = 1,
  σ_z² = 1500, R = 10⁵ and K = 10: n* is 12,247 clusters per run, r is 8.9
  affordable runs, evaluation takes 10.9 % of the budget, and the variance
  is 0.126 squared points (SE 0.36). At R = 10³: n* = 1,225, r = 4.5, 55 %
  on evaluation, variance 0.495. At R = 10⁷: n* = 122,474, r = 9.9,
  variance 0.102. At σ_a² = 4: n* = 6,124, variance 0.45.
spec:
  tex: >-
    n^{*}=\sqrt{\frac{\sigma_z^{2}\,c_{\text{train}}}{\sigma_a^{2}\,c_{\text{eval}}}},\qquad K=r\,(c_{\text{train}}+n\,c_{\text{eval}}),\qquad \operatorname{Var}=\frac{\sigma_a^{2}}{r}+\frac{\sigma_z^{2}}{r\,n}
  inputs:
    - { symbol: sa2, label: "seed variance σ_a², pt²", default: 1, min: 0.1, max: 10, step: 0.1, format: fixed1 }
    - { symbol: sz2, label: "per-cluster variance σ_z², pt²", default: 1500, min: 100, max: 5000, step: 100, format: integer }
    - { symbol: R, label: "c_train ÷ c_eval per cluster", default: 100000, min: 100, max: 100000000, scale: log10, format: si }
    - { symbol: K, label: "budget K, in training runs", default: 10, min: 1, max: 100, step: 1, format: integer }
  outputs:
    - { symbol: ns, label: "optimal clusters per run n*", formula: "sqrt(sz2*R/sa2)", format: integer, emphasis: true }
    - { symbol: rr, label: "affordable seed runs r = K/(1 + n*/R)", formula: "K/(1 + ns/R)", format: fixed1 }
    - { symbol: sh, label: "share of budget spent evaluating", formula: "(ns/R)/(1 + ns/R)", format: percent }
    - { symbol: v, label: "variance at the optimum, pt²", formula: "sa2/rr + sz2/(rr*ns)", format: fixed3 }
    - { symbol: se, label: "SE at the optimum, points", formula: "sqrt(v)", format: fixed2 }
  presets:
    - { label: "cheap training, R = 10³", values: { R: 1000 } }
    - { label: "costly training, R = 10⁷", values: { R: 10000000 } }
    - { label: "noisier seeds, σ_a² = 4", values: { sa2: 4 } }
```

**DERIVED — cost line.** Replicating r training runs multiplies parameters stored across checkpoints, training tokens, and training FLOPs by r; generation evaluation scales with rJGm and output lengths. Streaming cluster sufficient statistics uses O(G) memory for one checkpoint pair; reading outcomes is linear in their bytes. Distributed aggregation sends cluster sums and counts instead of logits. Latency grows with scheduled work; throughput depends on batching. Energy and money require measured power and the actual charging boundary; neither follows from a seed count alone.

## Algorithm

```text
Algorithm 6.4 — Paired cluster uncertainty for a fixed checkpoint pair
INPUT   immutable paired outcome stream; expected item ids; group keys;
        fixed task weights; confidence level; practical margin delta
OUTPUT  task effects, suite effect, declared conditional interval, decision
STATE   per-task ordered maps from bounded cluster keys to (sum_diff, count)
INVARIANT  every expected item has exactly one scored pair or a registered failure
1  Verify item ids, scoring version, checkpoint hashes, and absence of duplicate pairs.
2  Reject unmatched records unless the preregistered missingness rule resolves them.
3  Average registered generation repetitions within each item; preserve failures.
4  Accumulate paired differences and counts by task and independent cluster.
5  Compute each task's item-weighted difference and Eq. 6.10 variance.
6  If clusters cross task boundaries, aggregate their weighted residuals jointly;
   otherwise sum task variances multiplied by squared fixed task weights.
7  Apply the registered large-cluster interval rule; flag too few independent clusters.
8  Compare the interval to zero and separately to [-delta, delta].
9  Emit the result with checkpoint-conditional scope and all effective sample counts.
```

**DERIVED.** Balanced trees give worst-case O(n log G) aggregation for bounded-length keys; a sorted stream permits O(n) aggregation. Memory is O(G) sufficient statistics and the bounded input buffer. A separate deduplication pass costs O(n log n) if ids are not already unique by storage constraint. The procedure terminates after the finite expected item manifest; it never retries until a desired score appears.

## Implementation

**OFFICIAL-DOCUMENTATION · [R6.3](references.md).** LM Evaluation Harness exposes per-sample logging and distinct seed controls; it is outside the reference stack, routed through the plan's evaluation-tool anchor. **OFFICIAL-DOCUMENTATION · [R6.33, R6.35](references.md).** vLLM and SGLang document restrictions on reproducible inference. Stable sampling settings do not imply bitwise equality across engines or hardware.

**ASSUMED.** The implementation boundary is PyTorch (*Model / autograd framework*) for score tensors, vLLM or SGLang (*Inference engine*) for generation, and a separate CPU analysis process. Store scores as `[r, J, G, items, m]` conceptually, with ragged offsets rather than padded global tensors. Accumulate sufficient statistics in a declared floating-point precision. Validate the reducer independently of model execution. The exact framework and engine commits remain UNVERIFIED; no API execution is claimed.

## Experimental design

### Experiment 6.4 — Which replication reduces the uncertainty?

- **Hypothesis:** independent training replication and new clusters reduce different terms of Eq. 6.9; extra generations cannot remove either floor.
- **Setup:** proposal; use the fixed arms and seed blocks in [verification.md](verification.md).
- **Independent variables:** number of seed blocks, independent clusters, generation repetitions.
- **Controlled variables:** checkpoints within a conditional comparison, tokenizer, scoring, task weights, group keys.
- **Dataset/workload:** held-out tasks with preserved passage or problem-family ids.
- **Hardware:** one pinned accelerator configuration; actual model and runtime are UNVERIFIED until registration.
- **Metrics:** conditional interval width; seed-block variance; cluster variance; compute consumed.
- **Baselines:** naive item-independent interval and seed-only interval, labelled with their respective boundaries.
- **Expected result:** predicted variance floors under the stated random-effects assumptions; no experimental result is asserted.
- **Ablation:** deliberately ignore cluster ids in analysis while retaining the original raw records.
- **Interpretation:** narrowing only the naive interval rejects the claim that independent information increased.
- **Threats to validity:** few clusters, heteroscedastic runs, task selection, dependence across supposedly independent seed blocks.

## Observations

**What the paper claims.** PAPER-REPORTED: R6.1 addresses paired and clustered evaluation; R6.25 addresses variation across learning pipelines; [R6.26](references.md) analyses statistical power in NLP experiments.

**What the evidence shows.** DERIVED: these support choosing the uncertainty boundary before selecting the estimator. They do not supply the variance components for this chapter's proposed workload.

**What we infer.** DERIVED: the next unit of compute should target the variance term limiting the decision, with development-only pilot estimates and sensitivity analysis.

**What remains unknown.** UNVERIFIED: all variance components, power, interval coverage under the actual workload, and the practical adequacy of the illustrative δ. NOT-DISCLOSED: sufficiently detailed repeated-run variation for the DCLM comparisons used here.

## Failure modes

> **Failure mode — Pseudoreplication [DERIVED].** *Symptom:* error bars collapse after duplicating translated questions. *Cause:* rows substituted for independent clusters. *Detection:* count source-question ids. *Mitigation:* preserve the source cluster during aggregation and resampling.

> **Failure mode — Non-significance called equivalence [DERIVED].** *Symptom:* a broad interval crossing zero is described as no meaningful difference. *Cause:* a null test substituted for the practical decision. *Detection:* compare both bounds with ±δ. *Mitigation:* report unresolved or collect the missing independent evidence.

> **Failure mode — Failed runs disappear [DERIVED].** *Symptom:* only successful seeds enter the mean. *Cause:* selection after observing training outcomes. *Detection:* reconcile all registered run ids. *Mitigation:* publish failures and apply the prespecified procedure-level estimand.

## Siblings

**Item-level inference — [§2.5](../ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md).** DERIVED: appropriate when observations are independent and the checkpoint is fixed; the changed primitive is a row rather than a cluster. It reduces implementation cost, while unmodelled grouping produces optimistic intervals.

**Seed-block inference — [§6.3](06-3-controlled-comparisons.md).** DERIVED: introduced when the training procedure is the intervention; replaces fixed-checkpoint uncertainty with independent run contrasts. It estimates a different population and costs additional training runs; shared test items still limit task generalisation.

**Judge uncertainty — [Chapter 62](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/README.md).** ASSUMED forward route: adds evaluator identity and disagreement to the experimental factors. The objective becomes agreement with a declared evaluation criterion; a stable judge can still be systematically wrong.

## Extensions

**ASSUMED.** For multilingual evaluation, cluster translations by source problem and report language-specific effects. For agents, cluster steps within complete trajectories, and decide whether users or environments create a higher dependence level. For embodied systems, repeat across environments and initial states; repeated frames are not repeated trials. Long-context tasks should retain source-document clusters even when many windows are scored.

## Limitations

**DERIVED.** The balanced model is a diagnostic approximation, not a universal estimator. Heavy-tailed rewards, rare safety events, few seed blocks, dominant clusters, or nonstationary endpoints require specialised inference. Interval precision cannot establish construct validity, remove contamination, or recover an undisclosed training history. A decision remains unresolved when the relevant independent replication is absent.

## Reproducibility

**ASSUMED.** Retain paired item ids, cluster definitions, task weights, all seed namespaces, failure handling, score precision, estimator revision, confidence level, multiplicity rule, and δ. Report independent counts next to the interval. References were opened on 2026-09-20; moving documentation is evidence about documented behaviour, not a pinned runtime. The proposed experiment has not been executed.

## References

[Chapter reference register](references.md): R6.1, R6.3, R6.25, R6.26, R6.33, R6.35; P06 and P07 supply the comparison context. Statistical ownership: [§2.5](../ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md).
